const getPermissionsMiddleware = require("./permissions-middleware");
module.exports = (container, router, routePrefix) => {
    const collectionMiddleware = (req, res, next) => {
        const repo = req.params.collection
        const middleware = getPermissionsMiddleware(container, repo, 'write')
        return middleware(req, res, next)
    }

    router.get(`/${routePrefix}/:collection`, collectionMiddleware, (req, res) => {
        const route = require('./default-routes/list')(container, req.params.collection)
        return route(req, res)
    })

    router.post(`/${routePrefix}/:collection`, collectionMiddleware, (req, res) => {
        const route = require('./default-routes/create')(container, req.params.collection)
        return route(req, res)
    })

    router.post(`/${routePrefix}/:collection/subscribe`, (req, res, next) => {
        return res.sendStatus(200)
    })

    router.all(`/${routePrefix}/*`, (req, res) => {
        return res.sendStatus(404)
    })
}