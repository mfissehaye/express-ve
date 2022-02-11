module.exports = (container, repo) => {
    return async (req, res) => {
        try {
            const item = await container.repo[repo].get(req.params.id)
            res.json(item)
        } catch(ex) {
            res.status(ex.status || 500).json(ex.message ? { message: ex.message, ex } : ex)
        }
    }
}
