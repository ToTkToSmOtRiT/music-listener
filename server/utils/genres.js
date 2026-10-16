import { dirname } from 'node:path'

// Bump when the genre list or the matching rules below change: the genres of every
// track are then rebuilt from the stored raw tags on the next start (no file rescan).
export const TAXONOMY_VERSION = 1

// Genre tags are free text ("Alt. Rock", "Post-hardcore, alternative rock, nu metal", "ロック"),
// so each genre is a pattern matched against the whole raw tag; one tag can match several genres.
export const GENRES = [
    { slug: 'rock', label: 'Rock', re: /rock|рок|ロック|ร็อค/u },
    { slug: 'metal', label: 'Metal', re: /metal|djent|металл/u },
    { slug: 'hardcore', label: 'Hardcore & Post-hardcore', re: /hardcore|metalcore|хардкор/u },
    { slug: 'alternative', label: 'Alternative & Indie', re: /alternative|\balt\b|indie|инди|альтернатив/u },
    { slug: 'pop', label: 'Pop', re: /\bpop\b|jpop|поп|ポップ/u },
    { slug: 'anime', label: 'Anime & J-music', re: /anime|j-?pop|j-?rock|visual kei|японск|japan|アニメ|ロック/u },
    { slug: 'soundtrack', label: 'Soundtracks & Games', re: /soundtrack|\bost\b|\bgame\b|サウンドトラック|саундтрек|\bscore\b/u },
    { slug: 'hiphop', label: 'Hip-Hop & Rap', re: /hip[\s-]?hop|\brap\b|рэп|хип[\s-]?хоп|\btrap\b|\btrill\b/u },
    { slug: 'electronic', label: 'Electronic', re: /electro|techno|\bhouse\b|trance|dubstep|\bedm\b|ambient|synthwave|электрон/u },
    { slug: 'jazz', label: 'Jazz', re: /jazz|джаз|fusion/u },
    { slug: 'blues', label: 'Blues', re: /blues|блюз/u },
    { slug: 'classical', label: 'Classical', re: /classical|классик/u },
    { slug: 'folk', label: 'Folk', re: /folk|фолк|народн/u },
    { slug: 'funk', label: 'Funk', re: /funk|фанк/u },
    { slug: 'country', label: 'Country', re: /country|кантри/u },
    { slug: 'punk', label: 'Punk', re: /punk|панк/u },
    { slug: 'reggae', label: 'Reggae & Ska', re: /reggae|регги|\bska\b/u },
    { slug: 'rnb', label: 'R&B & Soul', re: /r&b|\brnb\b|r'n'b|\bsoul\b/u },
    { slug: 'instrumental', label: 'Instrumental', re: /instrumental|инструментал/u },
]

export const GENRE_BY_SLUG = Object.fromEntries(GENRES.map((g, i) => [g.slug, { ...g, order: i }]))

// Old files often store Russian tags as Windows-1251 bytes read as Latin-1 ("Èíäè-ðîê" instead of "Инди-рок").
function repairText(text) {
    if (/[Ѐ-ӿ]/.test(text) || !/[À-ÿ]/.test(text)) return text
    const bytes = Uint8Array.from(text, (c) => c.charCodeAt(0))
    if (bytes.some((b, i) => text.charCodeAt(i) > 255)) return text
    const fixed = new TextDecoder('windows-1251').decode(bytes)
    return /[Ѐ-ӿ]/.test(fixed) ? fixed : text
}

function matches(text) {
    const lower = text.normalize('NFKC').toLowerCase()
    return GENRES.filter((g) => g.re.test(lower)).map((g) => g.slug)
}

// Raw tags -> genre slugs. Junk such as "Other", "Cover" or "????" simply matches nothing.
export function genresFromRaw(rawTags) {
    const found = new Set()
    for (const raw of rawTags) {
        let hits = matches(raw)
        if (!hits.length) hits = matches(repairText(raw)) // only try the repair when the original matched nothing
        hits.forEach((slug) => found.add(slug))
    }
    return found
}

// --- rebuilding ---------------------------------------------------------------

const artistKey = (artist) => String(artist).split(/\s+(?:feat\.?|ft\.?)\s+/i)[0].trim().toLowerCase()

// Most common genres among the tagged tracks of a group (an artist or a folder).
function sharedGenres(peers, tagGenres, minPeers, minShare) {
    const tagged = peers.filter((id) => tagGenres.get(id).size)
    if (tagged.length < minPeers) return []
    const counts = new Map()
    for (const id of tagged) for (const g of tagGenres.get(id)) counts.set(g, (counts.get(g) ?? 0) + 1)
    return [...counts].filter(([, n]) => n / tagged.length >= minShare).map(([g]) => g)
}

// Recomputes track_genres from the stored raw tags. Tracks whose own tags give no genre borrow one
// from the same artist, then from the same folder, when their tagged tracks mostly agree.
export function rebuildGenres() {
    const db = useDb()
    const rows = db.prepare('SELECT id, src, artist, genre_raw FROM tracks').all()

    const tagGenres = new Map(rows.map((r) => [r.id, r.genre_raw ? genresFromRaw(r.genre_raw.split(' | ')) : new Set()]))
    const byArtist = new Map()
    const byFolder = new Map()
    for (const r of rows) {
        const a = artistKey(r.artist)
        if (a) byArtist.set(a, [...(byArtist.get(a) ?? []), r.id])
        const folder = r.src.startsWith('lib:') ? dirname(r.src.slice(4)) : '.'
        if (folder !== '.') byFolder.set(folder, [...(byFolder.get(folder) ?? []), r.id])
    }

    const insert = db.prepare('INSERT OR IGNORE INTO track_genres (track_id, genre, source) VALUES (?, ?, ?)')
    db.exec('BEGIN')
    try {
        db.exec('DELETE FROM track_genres')
        for (const r of rows) {
            const own = tagGenres.get(r.id)
            if (own.size) {
                own.forEach((g) => insert.run(r.id, g, 'tag'))
                continue
            }
            let borrowed = sharedGenres(byArtist.get(artistKey(r.artist)) ?? [], tagGenres, 1, 0.5)
            let source = 'artist'
            if (!borrowed.length && r.src.startsWith('lib:')) {
                borrowed = sharedGenres(byFolder.get(dirname(r.src.slice(4))) ?? [], tagGenres, 2, 0.6)
                source = 'folder'
            }
            borrowed.forEach((g) => insert.run(r.id, g, source))
        }
        db.prepare("INSERT INTO meta (key, value) VALUES ('genre_taxonomy', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
            .run(String(TAXONOMY_VERSION))
        db.exec('COMMIT')
    } catch (error) {
        db.exec('ROLLBACK')
        throw error
    }
}

export function genresAreCurrent() {
    const row = useDb().prepare("SELECT value FROM meta WHERE key = 'genre_taxonomy'").get()
    return row?.value === String(TAXONOMY_VERSION)
}
