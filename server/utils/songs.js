import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const file = join(process.cwd(), 'server', 'data', 'comments.json')

async function read() {
  return JSON.parse(await fs.readFile(file, 'utf-8'))
}

export async function loadSongs() {
  return (await read()).songs
}

// Serialise writes so concurrent requests can't clobber each other.
let queue = Promise.resolve()

export function addComment(songId, { name, comment }) {
  const task = queue.then(async () => {
    const data = await read()
    const song = data.songs.find((s) => s.id === songId)
    if (!song) return null
    const id = song.comments.reduce((max, c) => Math.max(max, c.id), 0) + 1
    const added = { id, name, comment }
    song.comments.push(added)
    await fs.writeFile(file, JSON.stringify(data, null, 4), 'utf-8')
    return added
  })
  queue = task.catch(() => {})
  return task
}
