const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const path = require('path')

module.exports = (c) => {
  const app = express();
  c.service('app', (_c) => {
    if (!_c.router.ready) throw new Error('Routes are not ready');

    // CORS Configuration
    app.use(cors());
    app.options('*', cors());

    // Configure JSON Parser and Promises
    app.use(bodyParser.json({ limit: '25mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }));

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
    app.use('/', _c.router);

    app.addProvider = (provider) => {
      provider(_c)
    }
    return app;
  });
};
