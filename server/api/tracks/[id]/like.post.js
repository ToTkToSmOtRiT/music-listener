export default defineEventHandler((event) => {
    const { on, count } = setFlag(event, 'likes', true)
    return { liked: on, likes: count }
})
