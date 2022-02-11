module.exports = (container, repo) => {
    return async (req, res) => {
        try {
            const results = await container.repo[repo].all(req.query)
            res.json(results)
        } catch(ex) {
            console.error(ex)
            res.status(ex.status || 500).json(ex)
        }
    }
}
