// "For you": a small recommender that learns from what each user plays, skips, likes, saves and adds to playlists.
//
// What is learned: one score per artist, genre and track (table `taste`). A signal adds to the scores of the
// track, its artist and its genres, and every score fades with a half-life of 30 days, so tastes can change.
// Ranking: score every candidate track, then sample from the scores (not simply "the top N"), keeping about
// one pick in five for something unfamiliar so the profile cannot lock in. Nothing leaves this server.

const HALF_LIFE = 30 * 24 * 3600 // seconds
const SCORE_MIN = -8
const SCORE_MAX = 12
const KEEP_PLAYS_DAYS = 90

// how much each kind of signal counts
export const SIGNAL = { complete: 1, partial: 0.3, skipLate: -0.4, skipEarly: -1, like: 2, favourite: 3, playlist: 2 }

// ranking: how much each score counts, how sharply high scores are preferred, and how often to explore
const W_ARTIST = 1
const W_GENRE = 0.8
const W_TRACK = 1
const TEMPERATURE = 1.5
const EXPLORE_SHARE = 0.2
const NO_REPEAT_HOURS = 3 // a track played in the last hours is not offered again
const LEARNING_PLAYS = 8 // fewer plays than this and the feed is still mostly random

const now = () => Math.floor(Date.now() / 1000)
const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi)
const decay = (score, updatedAt, at) => score * 0.5 ** (Math.max(0, at - updatedAt) / HALF_LIFE)

export function foryouEnabled(userId) {
    const row = useDb().prepare('SELECT enabled FROM taste_settings WHERE user_id = ?').get(userId)
    return row ? row.enabled === 1 : true
}

export function setForyouEnabled(userId, enabled) {
    useDb().prepare(`INSERT INTO taste_settings (user_id, enabled) VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET enabled = excluded.enabled`).run(userId, enabled ? 1 : 0)
}

function trackInfo(trackId) {
    const db = useDb()
    const row = db.prepare('SELECT id, artist FROM tracks WHERE id = ?').get(trackId)
    if (!row) return null
    const genres = db.prepare('SELECT genre FROM track_genres WHERE track_id = ?').all(trackId).map((g) => g.genre)
    return { id: row.id, artist: row.artist, genres }
}

// Adds `weight` to the track's own score, its artist's and (shared out) its genres'.
export function addSignal(userId, trackId, weight) {
    if (!foryouEnabled(userId)) return
    const info = trackInfo(trackId)
    if (!info) return
    const db = useDb()
    const t = now()
    const read = db.prepare('SELECT score, updated_at FROM taste WHERE user_id = ? AND kind = ? AND key = ?')
    const write = db.prepare(`INSERT INTO taste (user_id, kind, key, score, updated_at) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, kind, key) DO UPDATE SET score = excluded.score, updated_at = excluded.updated_at`)
    const bump = (kind, key, delta) => {
        const row = read.get(userId, kind, key)
        const base = row ? decay(row.score, row.updated_at, t) : 0
        write.run(userId, kind, key, clamp(base + delta, SCORE_MIN, SCORE_MAX), t)
    }

    db.exec('BEGIN')
    try {
        bump('artist', artistKey(info.artist), weight)
        bump('track', String(trackId), weight)
        for (const g of info.genres) bump('genre', g, (0.6 * weight) / Math.sqrt(info.genres.length))
        db.exec('COMMIT')
    } catch (error) {
        db.exec('ROLLBACK')
        throw error
    }
}

// A finished listening session of one track: how long it was heard out of how long it is.
export function recordPlay(userId, trackId, listenedSec, durationSec) {
    if (!foryouEnabled(userId) || !trackExists(trackId)) return null
    const duration = clamp(Number(durationSec) || 0, 1, 3 * 3600)
    const listened = clamp(Number(listenedSec) || 0, 0, duration + 5)
    const ratio = listened / duration

    let outcome, weight
    if (ratio >= 0.85 || duration - listened <= 8) [outcome, weight] = ['complete', SIGNAL.complete]
    else if (listened < 10 && ratio < 0.5) [outcome, weight] = ['skip', SIGNAL.skipEarly]
    else if (listened < 30 && ratio < 0.4) [outcome, weight] = ['skip', SIGNAL.skipLate]
    else [outcome, weight] = ['partial', SIGNAL.partial]

    const db = useDb()
    const t = now()
    // the same report twice in a row (a double event) counts once
    const last = db.prepare('SELECT track_id, played_at FROM plays WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId)
    if (last && last.track_id === trackId && t - last.played_at < 3) return null

    db.prepare('INSERT INTO plays (user_id, track_id, played_at, listened, duration, outcome) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, trackId, t, listened, duration, outcome)
    db.prepare('DELETE FROM plays WHERE user_id = ? AND played_at < ?').run(userId, t - KEEP_PLAYS_DAYS * 86400)
    addSignal(userId, trackId, weight)
    return { outcome, weight }
}

export function resetTaste(userId) {
    const db = useDb()
    db.prepare('DELETE FROM taste WHERE user_id = ?').run(userId)
    db.prepare('DELETE FROM plays WHERE user_id = ?').run(userId)
}

function tasteMaps(userId) {
    const t = now()
    const maps = { artist: new Map(), genre: new Map(), track: new Map() }
    for (const r of useDb().prepare('SELECT kind, key, score, updated_at FROM taste WHERE user_id = ?').all(userId)) {
        maps[r.kind]?.set(r.key, decay(r.score, r.updated_at, t))
    }
    return maps
}

const playCount = (userId) =>
    useDb().prepare('SELECT COUNT(*) AS n FROM plays WHERE user_id = ?').get(userId).n

export function tasteProfile(userId) {
    const maps = tasteMaps(userId)
    const artists = artistIndex()
    const top = (map, label) => [...map]
        .filter(([, s]) => s >= 0.5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([key, score]) => ({ key, label: label(key), score: Math.round(score * 10) / 10 }))
        .filter((x) => x.label)
    return {
        enabled: foryouEnabled(userId),
        plays: playCount(userId),
        learning: playCount(userId) < LEARNING_PLAYS,
        genres: top(maps.genre, (slug) => GENRE_BY_SLUG[slug]?.label),
        artists: top(maps.artist, (key) => artists.get(key)?.name),
    }
}

// --- the feed --------------------------------------------------------------------------------

// Picks one item at random, in proportion to its weight.
function pickWeighted(items, weightOf) {
    let total = 0
    for (const it of items) total += weightOf(it)
    let r = Math.random() * total
    for (let i = 0; i < items.length; i++) {
        r -= weightOf(items[i])
        if (r <= 0) return i
    }
    return items.length - 1
}

// `count` tracks for the user, never any in `exclude` (what the page already holds), never one played in the
// last few hours or skipped in the last day. Returns [{ id, reason }].
export function forYouPicks(userId, count, exclude = []) {
    const db = useDb()
    const t = now()
    const maps = tasteMaps(userId)
    const learning = playCount(userId) < LEARNING_PLAYS

    const blocked = new Set(exclude)
    for (const r of db.prepare('SELECT DISTINCT track_id FROM plays WHERE user_id = ? AND played_at > ?').all(userId, t - NO_REPEAT_HOURS * 3600)) blocked.add(r.track_id)
    for (const r of db.prepare("SELECT DISTINCT track_id FROM plays WHERE user_id = ? AND outcome = 'skip' AND played_at > ?").all(userId, t - 86400)) blocked.add(r.track_id)

    const genresOf = new Map()
    for (const r of db.prepare('SELECT tg.track_id AS id, tg.genre AS genre FROM track_genres tg JOIN tracks t ON t.id = tg.track_id WHERE t.available = 1').all()) {
        genresOf.set(r.id, [...(genresOf.get(r.id) ?? []), r.genre])
    }

    const pool = db.prepare('SELECT id, artist FROM tracks WHERE available = 1').all()
        .filter((tr) => !blocked.has(tr.id))
        .map((tr) => {
            const genres = genresOf.get(tr.id) ?? []
            const key = artistKey(tr.artist)
            const A = maps.artist.get(key) ?? 0
            const G = genres.reduce((s, g) => s + (maps.genre.get(g) ?? 0), 0) / Math.max(1, Math.sqrt(genres.length))
            const T = maps.track.get(String(tr.id)) ?? 0
            const raw = clamp(W_ARTIST * A + W_GENRE * G + W_TRACK * T, -6, 8)
            return { id: tr.id, key, name: primaryArtist(tr.artist), genres, A, G, T, raw, known: maps.artist.has(key) }
        })

    const reasonFor = (c, explore) => {
        if (learning) return 'Getting to know your taste'
        if (explore) {
            const best = c.genres.map((g) => [g, maps.genre.get(g) ?? 0]).sort((a, b) => b[1] - a[1])[0]
            return best && best[1] > 0.5 ? `Something new in ${GENRE_BY_SLUG[best[0]].label}` : 'Something new for you'
        }
        if (c.A >= 0.8) return `Because you like ${c.name}`
        const g = c.genres.map((x) => [x, maps.genre.get(x) ?? 0]).sort((a, b) => b[1] - a[1])[0]
        if (g && g[1] >= 0.8) return `Because you like ${GENRE_BY_SLUG[g[0]].label}`
        if (c.T >= 0.5) return 'You have enjoyed this before'
        return 'A pick for you'
    }

    const poolSize = pool.length
    const picks = []
    while (picks.length < count && pool.length) {
        let chosen
        let explore = false
        if (learning) {
            // Early on everything is a guess, so it is a plain shuffle.
            chosen = pool[Math.floor(Math.random() * pool.length)]
        } else {
            // About one pick in five is unfamiliar: artists not played yet, favouring genres you like.
            explore = Math.random() < EXPLORE_SHARE
            const fresh = explore ? pool.filter((c) => !c.known && c.G >= 0) : []
            const from = fresh.length ? fresh : pool
            if (!fresh.length) explore = false
            chosen = from[pickWeighted(from, (c) => (explore ? Math.max(0.2, 1 + c.G) : Math.exp(c.raw / TEMPERATURE)))]
        }
        pool.splice(pool.indexOf(chosen), 1)
        picks.push({ id: chosen.id, reason: reasonFor(chosen, explore) })
    }
    return { picks, learning, poolSize }
}