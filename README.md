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

The home page (`/`) is a welcome page for visitors who are not logged in; a logged-in user who opens it goes to the Feed page instead (the target is `HOME_FOR_USERS` in `app/utils/home.js`), and the menu hides *Home* for them. On that welcome page, **Start listening** and the genre cards open the log in / sign up window for visitors who are not logged in, and after logging in or signing up they continue to what they clicked (for example a genre). The **side menu is for logged-in users only**; visitors who are not logged in get a slim top bar (logo, theme switch, Log in, Sign up) and no menu. The menu: **Feed, News, Listen, Library, Profile, Subscriptions, Playlists**. The button at its top folds it to an icon rail (remembered in a cookie); on phones it becomes a drawer opened from the top bar. *Profile* has three tabs: **Account info** (name, email, member since and your counts), **Settings** (theme and the For you controls) and **Local** (the music folder). *Playlists* start with the built-in **Saved** and **Liked** lists (pinned on top; each has Play all and a remove button), then your own playlists. The old `/collection` address redirects to `/profile`. Feed, News and Subscriptions are placeholder pages for now.

## Access

- **Visitors who are not logged in can only see the home page.** Any other address, typed in the address bar, followed from a link, or an address that does not exist, redirects to `/?next=...` (server side, before anything is rendered). The home page then opens the log in / sign up window, and after logging in the visitor continues to the page they asked for. The `next` value must be an internal path; anything else is ignored. The guard is in `app/middleware/home.global.js`.
- **The API is closed too:** the track list, audio, cover art, comments and search need an account (401 otherwise), so music cannot be opened by typing an `/api/...` address. Only `/api/genres` (the genre names for the home page) is public.
- **Logging out** always leads to the home page.
- Logged-in users who open `/` go to the Feed page.

## Playlists and playing lists

- **Add to a playlist:** the **Playlist button** on the listening page opens a dropdown list (the same list as a pop-up window from the `+` buttons in the Library, artist lists and Saved/Liked). **Saved and Liked are pinned on top** (ticking them saves or likes the track, and the heart and star on the player follow), then your playlists, then a box to create a new one.
- **Playlist page:** add songs by searching the library, sort (title, artist, date added, shuffle), move tracks with the arrow buttons or by dragging the grip, rename, remove, delete. Every change is saved on the server.
- **Playing a list:** opening a track from Saved, Liked or a playlist (or pressing Play / Play all) plays through that list in order, shown as *Playing from ...* in the player. The URL looks like `/listener?source=saved&track=ID` (`source` is `saved`, `liked` or `playlist:ID`). The menu's Listen link returns to the shuffled feed.
- **Side menu dropdown:** clicking *Playlists* in the side menu unfolds your lists right there (Saved and Liked pinned on top, then your playlists, then a link to the full page). From the collapsed rail it unfolds the menu first.
- **Shuffle and repeat:** the buttons beside Previous/Next. Shuffle plays a list in random order, each track once (greyed out in the Listen feed, which is random already). Repeat cycles off, playlist (the list starts over) and this song. Both are remembered on the device.
- **Mini player:** the audio lives in one shared player (`app/composables/usePlayer.js`), so music keeps playing on every page. Except on Listen (full player) a bar at the bottom shows the track with previous/play/next, seek, repeat, a volume button that opens the piano-key meter, and close. Clicking the track returns to it in the full player. Logging out stops the music.
- Playlists are private to their owner.

## Themes

Two themes, switched from the navbar and remembered in a cookie: **Ivory** (light) and **Ebony** (dark, the default). All colours are CSS variables in `app/assets/css/theme.css`; components only use those variables, so adding a theme means adding one more `:root[data-theme='...']` block.

## The Library (`/library`)

Where music is browsed. A search bar (artists and songs, live), genre tabs (**All**, one per genre found, **Unsorted**) and, under each genre, its artists (the biggest first, **Show all** for the rest; a single genre lists every artist A to Z). Clicking an artist opens their tracks; **Play all** or a track plays through that artist in order (`/listener?source=artist:name`). **Play <genre>** shuffles just that genre (`/listener?genre=rock`). The home page genre cards and the genre tags on a playing track lead here. API: `/api/artists`, `/api/artists/<key>`, and `/api/search` (artists + songs).

## The listening page (`/listener`)

The **Listen** tab: a full-screen feed, one track at a time, with two modes (switch at the top): **For you** and **Random** (the whole library, shuffled).

### For you

A small recommender that runs on this server (no external AI, nothing leaves it). It learns from what each user does:

| Signal | Weight |
|---|---|
| heard to the end | +1 |
| heard partly (over 40% or 30 s) | +0.3 |
| skipped after 10-30 s | -0.4 |
| skipped within 10 s | -1 |
| liked / saved / added to a playlist | +2 / +3 / +2 (taking it back undoes it) |

Each signal adds to a score for the track, its artist and its genres. Scores fade with a 30-day half-life, so tastes can change. To pick tracks it scores every track (artist + 0.8 x genre + track), then **samples** in proportion to the scores instead of taking the top N, so the feed varies; about one pick in five is **something new** (an artist not played yet, in a genre you like). Tracks played in the last 3 hours or skipped in the last day are not offered. Each pick shows why ("Because you like Rock"). With fewer than 8 plays it is still **learning** and mostly random.

- **Settings** (the sliders button next to the switch): turn it off (nothing is learned, the feed is random), see what it learned, or **reset** it (deletes the user's plays and scores).
- **Storage:** raw plays are kept 90 days (about 100 bytes each); older listening lives on only as the scores, so it stays small (roughly 0.1-1 MB per user). Tables: `plays`, `taste`, `taste_settings`. Code: `server/utils/taste.js`.
- **API:** `POST /api/plays` (the player reports a track when it moves on), `GET /api/foryou`, `GET|DELETE /api/foryou/profile`, `PUT /api/foryou/settings`.

- **Change track:** swipe up/down, mouse wheel, or `↓`/`↑` (`j`/`k`). Each track has its own URL (`/listener?track=ID`), which is what Share copies.
- **Player:** play/pause (`Space`), seek bar, volume meter drawn as piano keys, with mute (`m`). Volume is remembered.
- **Like, Save (favourite), Comments, Share** on the right. Like, favourite and commenting need an account.
- **Background:** the blurred cover art of the current track, cross-fading between tracks. Tracks without embedded art get a colour gradient.

## Genres

The genre tabs live in the **Library**; the home page shows a gold card per genre. The genres of a track are shown under its artist in the player and open that genre in the Library.

- **Where genres come from:** the genre tag stored in each file (ID3 `TCON`). Free-text tags such as `Alt. Rock` or `Post-hardcore, alternative rock, nu metal` are matched to a fixed list of genres by the patterns in `server/utils/genres.js` (English, Russian and Japanese labels; garbled Windows-1251 tags are repaired). Junk such as `Other` or `Cover` is ignored. A track can have several genres.
- **Tracks without a usable tag** borrow a genre from other tracks by the same artist (or, failing that, the same folder) when those mostly agree. The rest are **Unsorted**. Only genres that have tracks are shown.
- **Scanning:** the first start reads the tags of every track in the background (about 30 seconds for 1,700 files); the genre counts fill in as it goes. Tags are stored in the database (`tracks.genre_raw`, `track_genres`), so changing the matching rules only needs `TAXONOMY_VERSION` bumped in `server/utils/genres.js`, not a rescan.

## Local music folder

The music folder is a setting. Open **Profile → Local** to see it, type or paste a different full path (for example `E:Music`) and press **Save**; **Rescan folder** looks for new or removed files, and **Use the default folder** goes back to `MUSIC_DIR` from `.env` (see `.env.example`), which is what the app uses until you save one. The folder is **read-only**: the app only lists, reads and streams `.mp3` files, it never writes there. Titles, artists, cover art and genres come from the files' tags (falling back to the `Artist - Title.mp3` filename). Tracks are indexed into the database on first load.

- **Local only:** changing the folder works only for a browser on the same computer as the server (and only when logged in), because it chooses which folder on the server gets read. On a public deployment the tab is read-only.
- **Switching folders is safe:** every track remembers the folder it came from. Tracks of a folder you switched away from are hidden from the feed and genres (and shown as *Unavailable* in your collection and playlists) but keep their likes, saves and playlist places; they come back if you switch back. Files you delete from the folder become unavailable on the next rescan.

Without a music folder (saved in the app or set in `MUSIC_DIR`) there are no tracks to play: the app ships without any music. Don't commit music you don't have the rights to.

## Accounts and data

- Data is stored in a SQLite file, `.data/app.db`, created on first start. The file is git-ignored; back it up if you care about the accounts.
- Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie (only their hash is stored). Sign in/up is rate-limited per IP.
- Only logged-in users can comment, like or favourite.
- Hosting needs a persistent disk, so serverless platforms (Vercel, Netlify) won't keep the database.
