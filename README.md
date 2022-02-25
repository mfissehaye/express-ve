# Express-ve express starter
An express-ve way to start an [express](https://expressjs.com/) project.

#### Checkout a demo project [here](https://mfissehaye.github.com/express-ve/demo) or Learn how to use express-ve [here](https://mfissehaye.medium.com/how-to-create-an-expressjs-based-restful-api-using-express-ve-package-c94f488d55b5)

Are you starting an [express](https://expressjs.com/) project? Are you adding some [routing](https://expressjs.com/en/guide/routing.html) to it? Do you plan to add some [mongodb](https://www.mongodb.com/) data using [mongoosejs](https://mongoosejs.com/)? Then you can start your project with express-ve and have default mappings accelerate your development.

## Installing
```
npm install express-ve
```

or

```
yarn add express-ve
```

## How do you create and start the app?
```javascript
const {createContainer} = require('express-ve')
const path = require('path') // optional

createContainer().then((container) => {
    // Listen as usual
    app.server.listen(8000 /* PORT */).on('listening', () => {
        console.log(`App live and listening on port 8000`)
    })
})
```

It's very simple and straightforward and yet createContainer creates a seamless routing, repo and organized config. Let's how! How do I add a routing?

## Routing
express-ve routing makes use of conventions on the folder structure and maps them to route paths. The mapping is inspired by [nuxtjs routing](https://nuxtjs.org/docs/get-started/routing/).

First define a folder named `routes` at the root of your project.
```javascript
/**
 * routes are registered according to the following convention
 * Path                            Route
 *
 * routes/users/_id.js             GET /users/{id}
 * routes/users/_id/post.js        POST /users/{id}
 * routes/users/_id__post.js       POST /categories/:id/archive
 * routes/users/index.js           GET /users/
 * routes/index.js                 GET /
 * routes/put.js                   PUT /
 */
```

A single route has the following structure
```javascript
// routes/users/_name.js
module.exports = (container) => {
    return {
        route: async (req, res) => {
            return res.json({
                message: `Welcome to express-ve ${req.params.name}`,
            })
        },

        middlewares: [] // oh really? you support middlewares too? Show me below.
    }
}
```

### Route middlewares
Middlewares can be defined in one of two ways per route or globally.
#### Per Route
Just as shown in the last code snippet above, you return from a route file an object with keys 'route' and middleware. The middleware is an array of all middlewares that will apply to this specific route.
```javascript
const multer = require('multer')
const upload = multer({storage})
// const storage ... define your storage here

middlewares: [async (req, res, next) => {
    await mkdirp(`${__dirname}/../../uploads/${req.bot._id}`)
    next()
}, upload.single('picture')]
```
The code snippet above has two middlewares and each will run one after the other the first one making sure a directory exists, the other one taking the files from the request and uploading it using [multer](http://expressjs.com/en/resources/middleware/multer.html).
#### Globally
You can also define middlewares globally by following the same folder structure conventions like that of routes. When you define a route at the same level of nesting as a specific route, the route and all others nested under it will be protected by the middleware

For example defining a middleware at the path `middlewares/v1.js` will protect all the paths `v1/`, `v1/users/:id`, `v1/:id` etc. Defining it under the path `middlewares/users/index.js` it will protect routes `users/`, `users/:id`, `POST: users/:id`, `users/:id/upload` etc.

#### How do I define a global middleware
First create a folder named middlewares at the root of your project and create your middleware file inside it. A single middleware file can look something like this:
```javascript
// Here is a google authenticator middleware example
const {OAuth2Client} = require("google-auth-library");
module.exports = (container, route) => {
    return async (req, res, next) => {
        // You can add exception to a global middleware like below
        if (route.startsWith('/v1/auth') || route.startsWith('/v1/telegram/handler/'))
            return next()

        try {
            const token = req.headers.authorization
            if (!token) return res.status(401).json({message: 'No token provided'})
            const client = new OAuth2Client(container.config.CLIENT_ID) // Oh configs too? How do they work? Tell me more.
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: container.config.CLIENT_ID
            })

            const payload = ticket.getPayload()
            const googleId = payload['sub']

            let user = await container.repo.user.findUserByGoogleId(googleId)
            if (user) {
                req.user = user
                return next()
            }

            return res.status(401).json({message: 'User is not authenticated'})
        } catch (ex) {
            return res.status(401).json(ex.message ? {message: ex.message} : ex)
        }
    }
}
```

## Configurations
Define your configurations inside a config folder at the root of your project, and they will be accessible as `container.config.google.CLIENT_ID`. You can separate your configurations by environments by defining each of the configs in different folders `dev`, `staging` and `production` for example. The configs can then be accessed as `container.config.dev.google.CLIENT_ID` or `container.config.staging.google.CLIENT_ID`

## Models
You can define your models inside a folder named `db` at the root of your project. A single model looks like this:
```javascript
module.exports = (mongoose) => {
    const UserSchema = new mongoose.Schema({
        name: String,
        picture: String,
        email: {
            type: String,
            unique: true
        },
        googleId: String,
    }, { timestamps: true })

    mongoose.model('User', UserSchema)
}
```
## Repositories
Repos provide a few default database operations `all`, `create`, `createMany`, `delete`, `get` and `update`. They all accept req.body in the router and return relevant results. `all` returns all entries from the database by using the name of the repo as the model.

`container.repo.command.all()` will return all `commands` from the database as long as the `Command` schema is defined. It accepts params from the request body, it can also filter out results using query parameters.  It also supports pagination out of the box. All you have to do is add `page` and `limit` parameters to the request. The README will be updated with more details on this.