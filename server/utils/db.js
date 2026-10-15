import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import seed from '../data/comments.json'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
    id     INTEGER PRIMARY KEY,
    artist TEXT NOT NULL,
    title  TEXT NOT NULL,
    src    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    body        TEXT NOT NULL,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS comments_track ON comments(track_id);
`

// Import the original JSON songs/comments the first time the database is created.
function seedIfEmpty(db) {
    if (db.prepare('SELECT COUNT(*) AS n FROM tracks').get().n > 0) return
    const insertTrack = db.prepare('INSERT INTO tracks (id, artist, title, src) VALUES (?, ?, ?, ?)')
    const insertComment = db.prepare('INSERT INTO comments (track_id, author_name, body) VALUES (?, ?, ?)')
    db.exec('BEGIN')
    try {
        for (const track of seed.songs) {
            insertTrack.run(track.id, track.artist, track.song, track.src)
            for (const c of track.comments) insertComment.run(track.id, c.name, c.comment)
        }
        db.exec('COMMIT')
    } catch (error) {
        db.exec('ROLLBACK')
        throw error
    }
}

let db

export function useDb() {
    if (db) return db
    const dir = join(process.cwd(), '.data')
    mkdirSync(dir, { recursive: true })
    const instance = new DatabaseSync(join(dir, 'app.db'))
    instance.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    instance.exec(SCHEMA)
    seedIfEmpty(instance)
    db = instance
    return db
}
