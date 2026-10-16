import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'

const TYPES = { '.mp3': 'audio/mpeg', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.wav': 'audio/wav' }

// Streams the audio file with HTTP range support so the player can seek.
export default defineEventHandler(async (event) => {
    requireUser(event) // listening needs an account; checked before looking the track up
    const track = requireTrack(event)
    if (!track.available) throw createError({ statusCode: 404, statusMessage: 'This track is not in the current music folder' })
    const file = resolveTrackFile(track.src, track.lib_root)
    const info = file && (await stat(file).catch(() => null))
    if (!info?.isFile()) throw createError({ statusCode: 404, statusMessage: 'Audio file not found' })

    setHeader(event, 'Content-Type', TYPES[extname(file).toLowerCase()] || 'application/octet-stream')
    setHeader(event, 'Accept-Ranges', 'bytes')
    setHeader(event, 'Cache-Control', 'private, max-age=3600')

    const range = /^bytes=(\d*)-(\d*)$/.exec(getRequestHeader(event, 'range') || '')
    if (!range) {
        setHeader(event, 'Content-Length', info.size)
        return sendStream(event, createReadStream(file))
    }

    let start = range[1] === '' ? info.size - Number(range[2]) : Number(range[1])
    let end = range[1] === '' || range[2] === '' ? info.size - 1 : Number(range[2])
    end = Math.min(end, info.size - 1)
    if (!(start >= 0 && start <= end)) {
        setHeader(event, 'Content-Range', `bytes */${info.size}`)
        throw createError({ statusCode: 416, statusMessage: 'Range not satisfiable' })
    }
    setResponseStatus(event, 206)
    setHeader(event, 'Content-Range', `bytes ${start}-${end}/${info.size}`)
    setHeader(event, 'Content-Length', end - start + 1)
    return sendStream(event, createReadStream(file, { start, end }))
})
