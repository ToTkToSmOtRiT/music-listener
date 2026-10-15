# Simple Music Listener

Nuxt 4 app. The API (tracks, comments, accounts) lives in `server/api` as Nitro routes, so there is a single process and no separate Express server.

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

## Accounts and data

- Data is stored in a SQLite file, `.data/app.db`, created on first start and seeded from `server/data/comments.json`. The file is git-ignored; back it up if you care about the accounts.
- Passwords are hashed with scrypt. Sessions are random tokens in an httpOnly cookie (only their hash is stored). Sign in/up is rate-limited per IP.
- Only logged-in users can comment.
- Hosting needs a persistent disk, so serverless platforms (Vercel, Netlify) won't keep the database.
