import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

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
    id         INTEGER PRIMARY KEY,
    artist     TEXT NOT NULL,
    title      TEXT NOT NULL,
    src        TEXT NOT NULL,
    has_cover  INTEGER NOT NULL DEFAULT 0,
    meta_done  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS track_genres (
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    genre    TEXT NOT NULL,
    source   TEXT NOT NULL DEFAULT 'tag',
    PRIMARY KEY (track_id, genre)
);

CREATE INDEX IF NOT EXISTS track_genres_genre ON track_genres(genre);

CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS favourites (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS playlists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id    INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    added_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS playlist_tracks_position ON playlist_tracks(playlist_id, position);

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

// Databases created before a column existed get it added in place.
function ensureColumn(db, table, column, definition) {
    const has = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)
    if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

let db

export function useDb() {
    if (db) return db
    const dir = join(process.cwd(), '.data')
    mkdirSync(dir, { recursive: true })
    const instance = new DatabaseSync(join(dir, 'app.db'))
    instance.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
    instance.exec(SCHEMA)
    ensureColumn(instance, 'tracks', 'has_cover', 'INTEGER NOT NULL DEFAULT 0')
    ensureColumn(instance, 'tracks', 'meta_done', 'INTEGER NOT NULL DEFAULT 0')
    ensureColumn(instance, 'tracks', 'genre_raw', 'TEXT')
    ensureColumn(instance, 'tracks', 'genre_done', 'INTEGER NOT NULL DEFAULT 0')
    ensureColumn(instance, 'tracks', 'lib_root', 'TEXT')
    ensureColumn(instance, 'tracks', 'available', 'INTEGER NOT NULL DEFAULT 1')
    // The same relative path can exist in two different music folders, so the folder is part of the key.
    instance.exec('DROP INDEX IF EXISTS tracks_src')
    instance.exec("CREATE UNIQUE INDEX IF NOT EXISTS tracks_root_src ON tracks(COALESCE(lib_root, ''), src)")
    db = instance
    return db
}
