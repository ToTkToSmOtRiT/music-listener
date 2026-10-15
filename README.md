# Simple Music Listener

Nuxt 3 app. The API (songs, comments, placeholder auth) lives in `server/api` as Nitro routes, so there is a single process and no separate Express server.

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

Node 20.11 can't run the newest Nuxt CLI, so `package.json` pins `nuxt` to 3.14 and overrides `nuxi` to 3.15.0. Both can be unpinned on Node 20.12+.