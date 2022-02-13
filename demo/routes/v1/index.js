module.exports = (container) => {
    return {
        route: async (req, res) => {
            return res.json({ message: 'Welcome to the API' })
        }
    }
}
