// Read-only access to a local music folder.
// Nothing in here ever writes, renames or deletes anything inside that folder.
//
// The folder is a setting: the one saved from the "Local" tab in My collection (database,
// meta.library_dir), or MUSIC_DIR from .env when nothing is saved. Every library track
// remembers the folder it was indexed from (tracks.lib_root); only tracks from the current
// folder are `available`, so switching folders never mixes libraries and keeps likes/playlists.
import { readdir } from 'node:fs/promises'
import { resolve, sep, basename, extname } from 'node:path'

const LIB_PREFIX = 'lib:'
const RESCAN_MS = 10 * 60 * 1000

// Windows paths are case-insensitive: "E:\Music" and "e:\music" are the same folder.
const keyOf = (path) => (process.platform === 'win32' ? path.toLowerCase() : path)

// --- the folder setting -------------------------------------------------------------

let current // undefined = not loaded yet

function load() {
    const row = useDb().prepare("SELECT value FROM meta WHERE key = 'library_dir'").get()
    if (row?.value) return { dir: resolve(row.value), source: 'saved' }
    if (process.env.MUSIC_DIR) return { dir: resolve(process.env.MUSIC_DIR), source: 'env' }
    return { dir: null, source: 'none' }
}

function setting() {
    current ??= load()
    return current
}

export const libraryDir = () => setting().dir

// Saves (or, with null, clears) the folder and re-points `available` at it.
export function saveLibraryDir(dir) {
    const db = useDb()
    if (dir) {
        db.prepare("INSERT INTO meta (key, value) VALUES ('library_dir', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
            .run(dir)
    } else {
        db.prepare("DELETE FROM meta WHERE key = 'library_dir'").run()
    }
    current = undefined
    lastScan = 0
    lastError = ''
    updateAvailability({ showCurrent: true }) // assume the chosen folder is there; the rescan that follows corrects it per file
}

// The folder string already stored for the same place (so letter case never creates a second library).
function canonicalRoot(dir) {
    const known = useDb().prepare('SELECT DISTINCT lib_root FROM tracks WHERE lib_root IS NOT NULL').all()
    return known.find((r) => keyOf(r.lib_root) === keyOf(dir))?.lib_root ?? dir
}

// Hides the tracks of every folder other than the current one. With showCurrent it also switches the
// current folder's tracks on (when it was just chosen); after a scan that is left to the per-file result.
function updateAvailability({ showCurrent = false } = {}) {
    const db = useDb()
    const dir = libraryDir()
    const set = db.prepare('UPDATE tracks SET available = ? WHERE lib_root = ?')
    for (const { lib_root } of db.prepare('SELECT DISTINCT lib_root FROM tracks WHERE lib_root IS NOT NULL').all()) {
        const isCurrent = Boolean(dir) && keyOf(lib_root) === keyOf(dir)
        if (!isCurrent) set.run(0, lib_root)
        else if (showCurrent) set.run(1, lib_root)
    }
}

// --- indexing -------------------------------------------------------------------

// "Artist - Title.mp3" -> { artist, title }
function parseFilename(rel) {
    const name = basename(rel, extname(rel)).trim()
    const i = name.indexOf(' - ')
    return i > 0
        ? { artist: name.slice(0, i).trim(), title: name.slice(i + 3).trim() || name }
        : { artist: 'Unknown artist', title: name }
}

let lastScan = 0
let lastError = ''
let lastFound = 0
let scanning = null

// Registers every .mp3 under the folder as a track (once per file) and marks which of them
// still exist. Files that disappeared become unavailable instead of being deleted.
export function syncLibrary() {
    const dir = libraryDir()
    if (!dir || Date.now() - lastScan < RESCAN_MS) return Promise.resolve()
    scanning ??= (async () => {
        try {
            const files = (await readdir(dir, { recursive: true })).filter((f) => extname(f).toLowerCase() === '.mp3')
            const db = useDb()
            const root = canonicalRoot(dir)

            // Tracks indexed before folders could be switched all came from the one configured folder.
            db.prepare("UPDATE tracks SET lib_root = ? WHERE lib_root IS NULL AND src LIKE 'lib:%'").run(root)

            const insert = db.prepare('INSERT OR IGNORE INTO tracks (artist, title, src, lib_root) VALUES (?, ?, ?, ?)')
            const show = db.prepare('UPDATE tracks SET available = 1 WHERE lib_root = ? AND src = ?')
            db.exec('BEGIN')
            try {
                db.prepare('UPDATE tracks SET available = 0 WHERE lib_root = ?').run(root)
                for (const rel of files) {
                    const src = LIB_PREFIX + rel.split(sep).join('/')
                    const { artist, title } = parseFilename(rel)
                    insert.run(artist, title, src, root)
                    show.run(root, src)
                }
                db.exec('COMMIT')
            } catch (error) {
                db.exec('ROLLBACK')
                throw error
            }
            updateAvailability() // folders indexed earlier stay hidden
            lastFound = files.length
            lastError = ''
            lastScan = Date.now()
            startTagScan()
        } catch (error) {
            // e.g. a disconnected drive: keep the known tracks as they are and report the problem
            lastError = error.code === 'ENOENT' ? 'The folder was not found. Is the drive connected?' : error.message
            console.error('Music library scan failed:', error.message)
        } finally {
            scanning = null
        }
    })()
    return scanning
}

// Scan again now, instead of waiting for the next automatic rescan.
export function rescanLibrary() {
    lastScan = 0
    return syncLibrary()
}

export function libraryStatus() {
    const { dir, source } = setting()
    return { dir, source, error: lastError, found: lastFound, indexing: scanning !== null }
}

// Absolute path of a track's audio file, or null if it is outside its base folder.
// Library tracks resolve against the folder they were indexed from.
export function resolveTrackFile(src, libRoot = null) {
    const isLib = src.startsWith(LIB_PREFIX)
    const base = isLib ? (libRoot ? resolve(libRoot) : libraryDir()) : resolve(process.cwd(), 'public')
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
        hasCover: Boolean(common.picture?.length),
        genres: (common.genre ?? []).map((g) => String(g).trim()).filter(Boolean)
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
