const getPermissionsMiddleware = require("./permissions-middleware");
module.exports = (container, router, routePrefix) => {
    router.get(`/${routePrefix}/:collection`, (req, res, next) => {
        const repo = req.params.collection
        const middleware = getPermissionsMiddleware(container, repo, 'read')
        return middleware(req, res, next)
    }, (req, res) => {
        const route = require('./default-routes/list')(container, req.params.collection)
        return route(req, res)
    })

    router.post(`/${routePrefix}/:collection/subscribe`, (req, res, next) => {
        return res.sendStatus(200)
    })

    router.all(`/${routePrefix}/*`, (req, res) => {
        return res.sendStatus(404)
    })
}