// The one audio player of the app. It lives outside any page, so music keeps playing while you move
// between tabs: the Listen page shows it in full, every other page shows the mini player at the bottom.
//
// It owns the queue (tracks + position), the <audio> element, shuffle and repeat, and the report of each
// play to the "For you" recommender. The Listen page only decides WHICH tracks are in the queue.
//
// Shuffle: plays a list in random order, every track once. Repeat: 'off', 'all' (the whole list, called
// "playlist" in the UI) or 'one' (the same song again). Both are remembered on this device.

let instance = null

export function usePlayer() {
  if (!instance) instance = createPlayer()
  return instance
}

function createPlayer() {
  const tracks = ref([])
  const index = ref(0)
  const direction = ref('next') // which way the slide animation goes
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const muted = ref(false)
  const wantPlay = ref(false) // once the user has pressed play, later tracks start by themselves
  const isList = ref(false) // playing a saved list (not the Listen feed)
  const shuffle = ref(false)
  const repeat = ref('off') // off | all | one
  const key = ref('') // what the queue is: 'saved', 'playlist:3', 'genre:rock', 'feed:foryou' ...
  const label = ref('') // a list's name, for display
  const notice = ref({ text: '', n: 0 }) // short messages for whichever page is showing

  const current = computed(() => tracks.value[index.value] ?? null)
  const repeatLabel = computed(() => ({
    off: 'Repeat: off',
    all: 'Repeat: playlist',
    one: 'Repeat: this song'
  }[repeat.value]))

  // set by the Listen page while it is open: fetches more tracks when the queue is nearly over
  let nearEnd = null
  let audio = null
  let failures = 0
  let heard = new Set() // shuffle: positions already played in this round
  let trail = [] // shuffle: positions in the order they were played, for "previous"
  let play = null // { id, started, listened, duration }: what "For you" learns from
  // anything the Listen page needs to carry from one visit to the next (feed position and so on)
  const meta = { value: null }

  const notify = (text) => { notice.value = { text, n: notice.value.n + 1 } }

  // --- saved settings --------------------------------------------------------

  if (import.meta.client) {
    try {
      const saved = JSON.parse(localStorage.getItem('player') || '{}')
      if (typeof saved.volume === 'number') volume.value = Math.min(Math.max(saved.volume, 0), 1)
      muted.value = Boolean(saved.muted)
    } catch (error) { /* storage unavailable */ }
    try {
      const modes = JSON.parse(localStorage.getItem('playModes') || '{}')
      shuffle.value = Boolean(modes.shuffle)
      if (['off', 'all', 'one'].includes(modes.repeat)) repeat.value = modes.repeat
    } catch (error) { /* storage unavailable */ }

    effectScope(true).run(() => {
      watch([volume, muted], () => {
        applyVolume()
        try {
          localStorage.setItem('player', JSON.stringify({ volume: volume.value, muted: muted.value }))
        } catch (error) { /* storage unavailable */ }
      })
    })

    // Closing the tab or reloading: send the last play before the page goes away.
    window.addEventListener('pagehide', () => flushPlay(true))
    // Browsers may pause audio of a tab in the background; when you come back, carry on if you were listening.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && audio && wantPlay.value && audio.paused && !audio.ended && audio.src) {
        audio.play().catch(() => {})
      }
    })
    setupMediaSession()
  }

  function saveModes() {
    try {
      localStorage.setItem('playModes', JSON.stringify({ shuffle: shuffle.value, repeat: repeat.value }))
    } catch (error) { /* storage unavailable */ }
  }

  function applyVolume() {
    if (audio) audio.volume = muted.value ? 0 : volume.value
  }

  // --- audio -----------------------------------------------------------------

  function ensureAudio() {
    if (audio) return audio
    const a = new Audio()
    a.preload = 'auto'
    audio = a
    // Handlers use their own element and ignore it once it has been discarded.
    const live = (fn) => () => { if (audio === a) fn() }
    a.addEventListener('timeupdate', live(() => {
      currentTime.value = a.currentTime
      if (play) play.listened = Math.max(play.listened, a.currentTime)
    }))
    a.addEventListener('durationchange', live(() => {
      duration.value = Number.isFinite(a.duration) ? a.duration : 0
      if (play) play.duration = duration.value
    }))
    a.addEventListener('play', live(() => { isPlaying.value = true }))
    a.addEventListener('pause', live(() => { isPlaying.value = false }))
    a.addEventListener('playing', live(() => {
      failures = 0
      if (play) play.started = true // only tracks that really began playing are reported
    }))
    a.addEventListener('ended', live(onEnded))
    a.addEventListener('error', live(() => {
      if (!a.getAttribute('src')) return
      notify('Could not play this track')
      if (wantPlay.value && ++failures < 3) setTimeout(() => { if (audio === a) go(1) }, 900)
    }))
    applyVolume()
    return a
  }

  // A play is reported when the player moves on (next track, new queue, leaving the page).
  function flushPlay(useBeacon = false) {
    const p = play
    play = null
    if (!p || !p.started || !p.duration) return
    const body = JSON.stringify({
      trackId: p.id,
      listened: Math.round(p.listened * 10) / 10,
      duration: Math.round(p.duration * 10) / 10
    })
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/plays', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/plays', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
        .catch(() => { /* a lost report only means a little less learned */ })
    }
  }

  // After "For you" was reset nothing about the old listening should be written back.
  function discardPlay() {
    play = null
  }

  function loadAudio(autoplay) {
    if (!current.value) return
    const a = ensureAudio()
    play = { id: current.value.id, started: false, listened: 0, duration: 0 }
    a.src = `/api/tracks/${current.value.id}/audio`
    currentTime.value = 0
    duration.value = 0
    if (autoplay) a.play().catch(() => {})
  }

  function togglePlay() {
    const a = ensureAudio()
    if (!a.src && current.value) loadAudio(false)
    if (a.paused) {
      wantPlay.value = true
      a.play().catch(() => notify('Press play to start'))
    } else {
      wantPlay.value = false
      a.pause()
    }
  }

  function seek(seconds) {
    if (audio) audio.currentTime = seconds
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !current.value) return
    const t = current.value
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      artwork: t.hasCover ? [{ src: `/api/tracks/${t.id}/cover` }] : []
    })
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return
    const set = (action, fn) => { try { navigator.mediaSession.setActionHandler(action, fn) } catch (e) { /* unsupported */ } }
    set('nexttrack', () => go(1))
    set('previoustrack', () => go(-1))
    set('play', () => { if (!isPlaying.value) togglePlay() })
    set('pause', () => { if (isPlaying.value) togglePlay() })
  }

  // --- queue -------------------------------------------------------------------

  function resetShuffle() {
    heard = new Set([index.value])
    trail = []
  }

  // Start playing the queue at a position (the queue itself is set through `tracks`). Playback goes on
  // by itself if the user had pressed play before.
  function select(position) {
    flushPlay() // report the track being left
    index.value = position
    resetShuffle()
    if (current.value) {
      loadAudio(wantPlay.value)
      updateMediaSession()
    }
  }

  // The Listen page replaced the queue with a new feed or list.
  function setQueue(items, { start = 0, list = false, id = '', name = '', autoplay = false } = {}) {
    flushPlay()
    tracks.value = items
    isList.value = list
    key.value = id
    label.value = name
    if (!list && repeat.value === 'all') repeat.value = 'off' // a feed has no list to repeat
    if (autoplay) wantPlay.value = true
    select(start)
  }

  // Closing the mini player: stop and forget the queue.
  function stop() {
    flushPlay()
    wantPlay.value = false
    if (audio) {
      const a = audio
      audio = null // detach first so the events below are ignored
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
    isPlaying.value = false
    currentTime.value = 0
    duration.value = 0
    tracks.value = []
    index.value = 0
    key.value = ''
    label.value = ''
    isList.value = false
    meta.value = null
  }

  function toggleShuffle() {
    if (!isList.value) return
    shuffle.value = !shuffle.value
    resetShuffle()
    saveModes()
    notify(shuffle.value ? 'Shuffle on' : 'Shuffle off')
  }

  // In the Listen feed there is no list to repeat: only off and "this song".
  function cycleRepeat() {
    const order = isList.value ? ['off', 'all', 'one'] : ['off', 'one']
    repeat.value = order[(order.indexOf(repeat.value) + 1) % order.length]
    saveModes()
    notify(repeatLabel.value)
  }

  // Where to go from here; -1 means stay (the start of the list, or the end with repeat off).
  function pickNext(step, auto) {
    const n = tracks.value.length
    if (isList.value && shuffle.value) {
      if (step < 0) {
        if (!trail.length) { notify('This is where your list starts'); return -1 }
        return trail.pop()
      }
      heard.add(index.value)
      const rest = []
      for (let i = 0; i < n; i++) if (!heard.has(i)) rest.push(i)
      if (!rest.length) {
        if (auto && repeat.value !== 'all') return -1 // every track played once
        heard = new Set([index.value]) // a new round
        for (let i = 0; i < n; i++) if (i !== index.value) rest.push(i)
        if (!rest.length) return index.value
      }
      trail.push(index.value)
      return rest[Math.floor(Math.random() * rest.length)]
    }
    const next = index.value + step
    if (next < 0) { notify('This is where your feed starts'); return -1 }
    if (next >= n) {
      if (isList.value && auto && repeat.value !== 'all') return -1 // the list is over
      return 0 // end of the feed or list: start over
    }
    return next
  }

  function onEnded() {
    if (repeat.value === 'one') {
      flushPlay() // the song was heard to the end: report it, then play it again
      loadAudio(true)
      return
    }
    if (go(1, true) === false) {
      wantPlay.value = false
      isPlaying.value = false
      notify('End of the list')
    }
  }

  // auto: the track ended by itself (not a press on Next). Returns false when playback stopped at the list's end.
  function go(step, auto = false) {
    const n = tracks.value.length
    if (!n) return
    const next = pickNext(step, auto)
    if (next < 0) return auto ? false : undefined
    flushPlay() // report the track being left: heard to the end, or skipped
    direction.value = step > 0 ? 'next' : 'prev'
    index.value = next
    loadAudio(wantPlay.value)
    updateMediaSession()
    if (next >= n - 3 && nearEnd) nearEnd()
  }

  return {
    tracks, index, current, direction, isPlaying, currentTime, duration, volume, muted, wantPlay,
    isList, shuffle, repeat, repeatLabel, key, label, notice, meta,
    notify, togglePlay, seek, go, select, setQueue, stop, flushPlay, discardPlay,
    toggleShuffle, cycleRepeat,
    onNearEnd: (fn) => { nearEnd = fn }
  }
}
