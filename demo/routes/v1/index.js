module.exports = (container) => {
    return {
        route: (req, res) => {
            return res.json({ message: 'Welcome to the API' })
        }
    }
}