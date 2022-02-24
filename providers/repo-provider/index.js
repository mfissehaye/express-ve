// const mongoose = require('mongoose');
const {MongoClient} = require('mongodb')
// const blueBird = require('bluebird')
const readdirp = require('readdirp')
const pathResolver = require("path")
const _camelCase = require('lodash/camelCase')
const _upperFirst = require('lodash/upperFirst')
// const {model} = require('mongoose')

// mongoose.Promise = blueBird;
//TODO check c in the next line is only passed to define services on it, they can't be accessed from it.
module.exports = async (c) => {
    // We are using repo.ready to see if database is ready or not
    // If database is not ready every access to repo will throw an error
    c.service('repo', (_c) => new Proxy({}, {
        get(target, name) {
            if (name === 'ready') return false;
            throw new Error('Database is not ready');
        }
    }));

    const dbName = process.env.DB_NAME || (() => {
        throw new Error('No db name provided')
    })()
    const dbHost = process.env.DB_HOST || 'localhost'
    const dbPort = process.env.DB_PORT || 27017

    const connectionString = `mongodb://${dbHost}:${dbPort}/?replicaSet=rs0&maxPoolSize=20&w=majority`
    const client = new MongoClient(connectionString, {
        useUnifiedTopology: true
    })
    await client.connect()

    c.service('db', (_c) => {
        return client.db(dbName)
    })

    try {
        // if (mongoose.connections) await mongoose.connection.close()
        // await mongoose.connect(`mongodb://${dbHost}:${dbPort}/${dbName}`)

        // if (c.config.NODE_ENV === 'development') {
        //     mongoose.set('debug', true)
        //     mongoose.connection.on('error', (err) => console.log('Mongoose Error: ', err))
        // }

        // const modelFiles = await readdirp.promise(pathResolver.resolve('./', 'db'))
        //     .then((files) => files.map((f) => f.fullPath))

        // const modelNames = modelFiles.map(f => f.split('/').slice(-1).pop())
        // const defaultModelFiles = await readdirp.promise(__dirname + '/default-models/')
        //     .then((files) => files
        //         .map((f) => f.fullPath)
        //         .filter(f => !modelNames.includes(f.split('/').slice(-1).pop())))

        // modelFiles.forEach(file => require(file)(mongoose))
        // defaultModelFiles.forEach(file => require(file)(mongoose))

        // const repoFiles = await readdirp.promise(pathResolver.resolve('./', 'repo'))
        //     .then((files) => files.map((f) => f.fullPath))

        // c.service('model', (_c) => (name) => mongoose.model(name))

        const repoFiles = await readdirp.promise(pathResolver.resolve('./', 'repo'))
            .then((files) => files.map((f) => f.fullPath))

        c.service('repo', (_c) => {
            const repos = {}
            repoFiles.forEach(file => {
                let repoName = file.substring(file.lastIndexOf('/') + 1)
                repoName = repoName.substring(0, repoName.lastIndexOf('.'))
                repos[repoName] = require(file)(_c)
            })

            // return {
            //   ready: true,
            //   // _mongoose: mongoose,
            //   ...repos,
            // }

            return new Proxy(repos, {
                get(object, key) {
                    if (key === 'ready') return true
                    // if (key === 'mongoose') return mongoose
                    const modelName = /*_upperFirst*/(_camelCase(key))

                    let defaultMethods = {}

                    try {
                        // const Model = mongoose.model(modelName)
                        defaultMethods = {
                            get: require('./default-methods/get')(_c.db, modelName),
                            create: require('./default-methods/create')(_c.db, modelName),
                            createMany: require('./default-methods/createMany')(_c.db, modelName),
                            delete: require('./default-methods/delete')(_c.db, modelName),
                            all: require('./default-methods/all')(_c.db, modelName),
                            update: require('./default-methods/update')(_c.db, modelName),
                        }
                    } catch (ex) {
                        console.error(`Model ${modelName} does not exist`)
                    }

                    if (object.hasOwnProperty(key)) return {
                        ...defaultMethods,
                        ...object[key]
                    }
                    else return defaultMethods
                }
            })
        });
    } catch (error) {
        c.logger.log('Mongo Error: ', error);
    } finally {
        // if (client) await client.close()
        //TODO provide some way to perform destruction once all services are done running
    }
};
