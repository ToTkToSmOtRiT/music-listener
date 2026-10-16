# Simple Music Listener

Nuxt 4 app. The API (tracks, comments, likes, accounts) lives in `server/api` as Nitro routes, so there is a single process and no separate Express server.

Requires **Node 22.5 or newer** (the database uses the built-in `node:sqlite`).

## Project setup
```
npm install
```

### Development server (http://localhost:3000)
```
npm run dev
```

### Production build and run
```
npm run build
npm start
```

## Navigation

A side menu: **Home, Listen, My collection, Feed, News, Subscriptions, Playlist**. The button at its top folds it to an icon rail (remembered in a cookie); on phones it becomes a drawer opened from the top bar. *My collection* lists the tracks you saved and liked. *Playlists* are your own ordered lists. Feed, News and Subscriptions are placeholder pages for now.

## Playlists and playing lists

- **Add to a playlist** with the Playlist button on the listening page, or the `+` button on a track in My collection. You can create a playlist right there.
- **Playlist page:** add songs by searching the library, sort (title, artist, date added, shuffle), move tracks with the arrow buttons or by dragging the grip, rename, remove, delete. Every change is saved on the server.
- **Playing a list:** opening a track from Saved, Liked or a playlist (or pressing Play / Play all) plays through that list in order, shown as *Playing from ...* in the player. The URL looks like `/listener?source=saved&track=ID` (`source` is `saved`, `liked` or `playlist:ID`). The menu's Listen link returns to the shuffled feed.
- Playlists are private to their owner.

## Themes

Two themes, switched from the navbar and remembered in a cookie: **Ivory** (light) and **Ebony** (dark, the default). All colours are CSS variables in `app/assets/css/theme.css`; components only use those variables, so adding a theme means adding one more `:root[data-theme='...']` block.

## The listening page (`/listener`)

A full-screen feed, one track at a time.

- **Change track:** swipe up/down, mouse wheel, or `↓`/`↑` (`j`/`k`). Each track has its own URL (`/listener?track=ID`), which is what Share copies.
- **Player:** play/pause (`Space`), seek bar, volume meter drawn as piano keys, with mute (`m`). Volume is remembered.
- **Like, Save (favourite), Comments, Share** on the right. Like, favourite and commenting need an account.
- **Background:** the blurred cover art of the current track, cross-fading between tracks. Tracks without embedded art get a colour gradient.

## Local music folder (temporary)

Set `MUSIC_DIR` in `.env` (see `.env.example`) to stream `.mp3` files from a folder on your machine. The folder is **read-only**: the app only lists, reads and streams files, it never writes there. Titles, artists and cover art come from the files' tags (falling back to the `Artist - Title.mp3` filename). Tracks are indexed into the database on first load.

Without `MUSIC_DIR`, only the sample tracks in `public/music` are available. Don't commit music you don't have the rights to.

## Accounts and data

- Data is stored in a SQLite file, `.data/app.db`, created on first start and seeded from `server/data/comments.json`. The file is git-ignored; back it up if you care about the accounts.
- Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie (only their hash is stored). Sign in/up is rate-limited per IP.
- Only logged-in users can comment, like or favourite.
- Hosting needs a persistent disk, so serverless platforms (Vercel, Netlify) won't keep the database.
