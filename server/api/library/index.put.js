import { stat, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'

// PUT /api/library { dir } -> use that folder as the music library (an empty value goes back to
// MUSIC_DIR from .env). Only from the computer that runs the app, and only for logged-in users.
export default defineEventHandler(async (event) => {
    requireUser(event)
    requireLocal(event)

    const body = (await readBody(event)) || {}
    // Explorer's "Copy as path" wraps the path in quotes; accept that.
    const raw = String(body.dir ?? '').trim().replace(/^["']|["']$/g, '').trim()

    if (!raw) {
        saveLibraryDir(null)
    } else {
        if (raw.length > 500 || raw.includes('\0')) {
            throw createError({ statusCode: 400, statusMessage: 'That does not look like a folder path' })
        }
        if (!isAbsolute(raw)) {
            throw createError({ statusCode: 400, statusMessage: 'Enter the full path, for example E:\\Music' })
        }
        const dir = resolve(raw)
        const info = await stat(dir).catch(() => null)
        if (!info) throw createError({ statusCode: 400, statusMessage: 'That folder was not found' })
        if (!info.isDirectory()) throw createError({ statusCode: 400, statusMessage: 'That path is a file, not a folder' })
        await access(dir, constants.R_OK).catch(() => {
            throw createError({ statusCode: 400, statusMessage: 'The app is not allowed to read that folder' })
        })
        saveLibraryDir(dir)
    }

    await rescanLibrary() // listing the files is quick; reading their tags continues in the background
    return libraryPayload(event)
})
