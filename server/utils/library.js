// Read-only access to an optional local music folder (MUSIC_DIR).
// Nothing in here ever writes, renames or deletes anything inside that folder.
import { readdir } from 'node:fs/promises'
import { resolve, sep, basename, extname } from 'node:path'

const LIB_PREFIX = 'lib:'
const RESCAN_MS = 10 * 60 * 1000

export function libraryDir() {
    return process.env.MUSIC_DIR ? resolve(process.env.MUSIC_DIR) : null
}

// "Artist - Title.mp3" -> { artist, title }
function parseFilename(rel) {
    const name = basename(rel, extname(rel)).trim()
    const i = name.indexOf(' - ')
    return i > 0
        ? { artist: name.slice(0, i).trim(), title: name.slice(i + 3).trim() || name }
        : { artist: 'Unknown artist', title: name }
}

let lastScan = 0
let scanning = null

// Registers every .mp3 under MUSIC_DIR as a track (once per file).
export function syncLibrary() {
    const dir = libraryDir()
    if (!dir || Date.now() - lastScan < RESCAN_MS) return Promise.resolve()
    scanning ??= (async () => {
        try {
            const files = await readdir(dir, { recursive: true })
            const db = useDb()
            const insert = db.prepare('INSERT OR IGNORE INTO tracks (artist, title, src) VALUES (?, ?, ?)')
            db.exec('BEGIN')
            try {
                for (const rel of files) {
                    if (extname(rel).toLowerCase() !== '.mp3') continue
                    const { artist, title } = parseFilename(rel)
                    insert.run(artist, title, LIB_PREFIX + rel.split(sep).join('/'))
                }
                db.exec('COMMIT')
            } catch (error) {
                db.exec('ROLLBACK')
                throw error
            }
            lastScan = Date.now()
        } catch (error) {
            console.error('Music library scan failed:', error.message)
        } finally {
            scanning = null
        }
    })()
    return scanning
}

// Absolute path of a track's audio file, or null if it is missing or outside its base folder.
export function resolveTrackFile(src) {
    const isLib = src.startsWith(LIB_PREFIX)
    const base = isLib ? libraryDir() : resolve(process.cwd(), 'public')
    if (!base) return null
    const full = resolve(base, isLib ? src.slice(LIB_PREFIX.length) : src)
    return full.startsWith(base + sep) ? full : null
}

// --- tags and embedded cover art -------------------------------------------

async function parse(file) {
    const { parseFile } = await import('music-metadata')
    return parseFile(file, { duration: false })
}

export async function readTags(file) {
    const { common } = await parse(file)
    return {
        artist: common.artist?.trim() || null,
        title: common.title?.trim() || null,
        hasCover: Boolean(common.picture?.length)
    }
}

const coverCache = new Map()

export async function readCover(file) {
    if (coverCache.has(file)) return coverCache.get(file)
    const { common } = await parse(file)
    const pic = common.picture?.[0]
    const cover = pic ? { data: Buffer.from(pic.data), type: pic.format || 'image/jpeg' } : null
    coverCache.set(file, cover)
    if (coverCache.size > 40) coverCache.delete(coverCache.keys().next().value)
    return cover
}
