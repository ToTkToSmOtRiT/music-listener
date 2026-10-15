export default defineEventHandler((event) => {
    const { on, count } = setFlag(event, 'likes', false)
    return { liked: on, likes: count }
})
