module.exports = (container, repo) => {
    return async (req, res) => {
        try {
            const created = await container.repo[repo].create(req.body)
            res.status(201).json(created)
        } catch(ex) {
            let message = ''
            if(ex.code === 11000) {
                message = `Duplicate ${Object.keys(ex.keyPattern).join(',')}`
            }
            res.status(ex.status || 500).json(message ? { message } : ex)
        }
    }
}
