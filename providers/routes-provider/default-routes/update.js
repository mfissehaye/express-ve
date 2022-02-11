module.exports = (container, repo) => {
    return async (req, res) => {
        try {
            const updated = await container.repo[repo].update(req.params.id, req.body)
            res.json(updated)
        } catch(ex) {
            console.error(ex)
            res.status(ex.status || 500).json(ex)
        }
    }
}
