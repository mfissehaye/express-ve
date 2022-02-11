module.exports = (container, repo) => {
    return async (req, res) => {
        try {
            const courseType = await container.repo[repo].delete(req.params.id)
            res.status(200).json(courseType)
        } catch(ex) {
            res.status(ex.status || 500).json(ex)
        }
    }
}
