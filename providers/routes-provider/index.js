const readdirp = require('readdirp');
const express = require('express');
const pathResolver = require('path');
const fs = require('fs')
const _union = require('lodash/union')
const _camelCase = require('lodash/camelCase')
const getPermissionsMiddleware = require('./permissions-middleware')

const pathToRoute = (file, base = 'routes') => {
    const parts = file.split('/');
    let path = '';

    let method = 'get'; // method is get by default
    for (let j = 0; j < parts.length; j += 1) {
        const paramRoute = /^_((?!.*__.*)[a-zA-Z][a-zA-Z0-9_-]+)(.js)?/.exec(parts[j]);
        if (paramRoute) path += `/:${paramRoute[1]}`;
        else if (j === parts.length - 1) {
            let result = parts[j].match(/^([_a-z0-9-]+)__(get|post|put|patch|delete|all).js$/i)
            if (result && result[1] && result[2]) {
                method = result[2]
                path += `/${result[1].replace(/^_/, ':')}`
            } else {
                let result = parts[j].match(/^([a-z0-9-]+).js$/i)
                if (result && result[1]) {
                    if (result[1] === 'index') { /* Do nothing here */
                    } else if (['get', 'post', 'put', 'patch', 'delete'].includes(result[1])) {
                        method = result[1]
                    } else path += '/' + result[1].replace(/^_/, ':')
                }
            }
        } else path += `/${parts[j]}`;
    }

    const routeFile = pathResolver.resolve('./', `${base}/${file}`)

    return {method, path, file: routeFile};
};

module.exports = async (c) => {
    c.service('router', (_c) => new Proxy({}, {
        get(target, name) {
            if (name === 'ready') return false;
            throw new Error('Routes are not ready');
        }
    }));

    // Define middlewares from the middlewares folder
    // add the middleware to all the paths inside that folder
    let middlewares = []
    if (fs.existsSync(pathResolver.resolve('./', 'middlewares/'))) {
        middlewares = await readdirp.promise(pathResolver.resolve('./', 'middlewares'))
            .then((files) => files.map(f => f.path)
                .filter(p => !p.endsWith('.spec.js')))

        c.service('middlewares', (_c) => {
            const result = {}
            middlewares.forEach((m) => {
                const key = _camelCase(m.replace(/\.js$/, ''))
                result[key] = require(pathResolver.resolve('./middlewares/', m))(_c)
            })

            return result
        })
    } else if (fs.existsSync(pathResolver.resolve('./', 'middlewares.js'))) {
        c.service('middlewares', (_c) => {
            return require(pathResolver.resolve('./', 'middlewares.js'))(_c)
        })
    } else {
        c.service('middlewares', (_c) => [])
    }


    /**
     * load all the files inside the routes folder
     * routes are registered according to the following convention
     * path: routes/users/_id.js => GET /api/users/{id}
     * path: routes/users/_id/post.js => POST /api/users/{id}
     * path: routes/users/_id__post.js => POST /api/categories/:id/archive
     * path: routes/users/index.js => GET /api/users/
     * path: routes/index.js => GET /api/
     * path: routes/put.js => PUT /api/
     */
    const routes = await readdirp.promise(pathResolver.resolve('./', 'routes'))
        .then((files) => files.map((f) => f.path)
            .filter((p) => !p.endsWith('.spec.js')));

    c.service('router', (_c) => {
        const router = express.Router();

        let routePrefix = ''
        if (_c.config.routes)
            routePrefix += _c.config.routes.prefix || ''

        routes.forEach((route) => {
            const {method, path, file} = pathToRoute(route);
            try {
                const routeFunction = require(file)
                let routeModule = routeFunction.length < 3 ? routeFunction(_c) : routeFunction

                // For each route that is being registered
                // check if a corresponding middleware exists
                let routeMiddlewares = middlewares
                    .map(m => pathToRoute(m, 'middlewares'))
                    .filter(({path: middlewarePath}) => !!middlewarePath && path.startsWith(middlewarePath))
                    .map(middleware => require(middleware.file)(_c, path))

                routeMiddlewares = _union(routeMiddlewares, routeModule.middlewares || [])
                const computedPath = routePrefix ? `/${routePrefix}${path}` : path
                router[method](computedPath, ...routeMiddlewares, (req, res) => {
                    return routeModule.route ?
                        routeModule.route(req, res) :
                        typeof routeModule === 'function' ?
                            routeModule(_c, req, res) :
                            (() => {
                                throw new Error(`Invalid route inside file ${file}`)
                            })()
                });
            } catch (ex) {
                console.error(ex)
                if (ex instanceof TypeError) {
                    const truePath = pathResolver.resolve(file);
                    throw new Error(`Make sure the route file ${truePath} returns a function`);
                } else throw ex;
            }
        });

        if (_c.config.routes) {
            if (_c.config.routes.resources) {
                _c.config.routes.resources.forEach((resource) => {
                    const basePath = `/${routePrefix}/${resource}`;
                    let repo = resource.split('/').slice(-1).pop()
                    repo = _camelCase(repo)

                    const middleware = type => getPermissionsMiddleware(_c, repo, type)
                    router.get(basePath, middleware('read'), require(`./default-routes/list.js`)(_c, repo))
                    router.get(`${basePath}/:id`, middleware('read'), require(`./default-routes/get.js`)(_c, repo))
                    router.post(`${basePath}`, middleware('write'), require(`./default-routes/create.js`)(_c, repo))
                    router.put(`${basePath}/:id`, middleware('write'), require(`./default-routes/update.js`)(_c, repo))
                    router.delete(`${basePath}/:id`, middleware('delete'), require(`./default-routes/delete.js`)(_c, repo))
                })
            }
        }

        require('./dynamic-routes')(_c, router, routePrefix)

        router.ready = true;
        return router;
    });
};
