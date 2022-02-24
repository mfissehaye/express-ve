const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const {createServer} = require('http')
const {Server} = require('socket.io')
const path = require('path')
const {createAdapter} = require('@socket.io/mongo-adapter')

module.exports = async (c) => {
    let httpServer
    const app = express()

    c.service('app', (_c) => {
        try {
            if (!_c.router.ready) throw new Error('Routes are not ready');

            // CORS Configuration
            app.use(cors())
            // app.options('*', cors())
            // app.get('*', cors())

            // Configure JSON Parser and Promises
            app.use(bodyParser.json({limit: '25mb'}));
            app.use(bodyParser.urlencoded({extended: true, limit: '25mb'}));

            // catch 404 and forward to error handler
            // app.use((req, res, next) => {
            //   const err = new Error('Not Found')
            //   console.log(err)
            //   err.status = 404
            //   res.send('Route not found')
            //   next(err)
            // })

            app.static = (path, route) => route ? app.use(route, express.static(path)) : app.use(express.static(path))
            // app.use(express.static(path.resolve('../frontend/dist', 'assets')))
            app.use('uploads', express.static(path.resolve('uploads')))
            app.use('/', _c.router)

            httpServer = createServer(app)
            app.server = httpServer

            // app.addProvider = (provider) => {
            //     provider(_c)
            // }
            return app
        } catch (err) {
            console.error('App init error: ', err)
        }
    })
}
