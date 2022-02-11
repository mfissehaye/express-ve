const mongoose = require('mongoose');
const blueBird = require('bluebird');
const readdirp = require('readdirp');
const pathResolver = require("path");
const _camelCase = require('lodash/camelCase')
const _upperFirst = require('lodash/upperFirst')
const {model} = require("mongoose");

mongoose.Promise = blueBird;

module.exports = async (c) => {
    // We are using repo.ready to see if database is ready or not
    // If database is not ready every access to repo will throw an error
    c.service('repo', (_c) => new Proxy({}, {
        get(target, name) {
            if (name === 'ready') return false;
            throw new Error('Database is not ready');
        }
    }));

    try {
        if (mongoose.connections) await mongoose.connection.close()
        const dbName = c.config.DB_NAME || (() => {
            throw new Error('No db name provided')
        })()
        const dbHost = c.config.DB_HOST || 'localhost'
        const dbPort = c.config.DB_PORT || 27017
        await mongoose.connect(`mongodb://${dbHost}:${dbPort}/${dbName}`)

        if(c.config.NODE_ENV === 'development') {
            mongoose.set('debug', true)
            mongoose.connection.on('error', (err) => console.log('Mongoose Error: ', err))
        }

        const modelFiles = await readdirp.promise(pathResolver.resolve('./', 'db'))
            .then((files) => files.map((f) => f.fullPath))

        const modelNames = modelFiles.map(f => f.split('/').slice(-1).pop())
        const defaultModelFiles = await readdirp.promise(__dirname + '/default-models/')
            .then((files) => files
                .map((f) => f.fullPath)
                .filter(f => !modelNames.includes(f.split('/').slice(-1).pop())))

        modelFiles.forEach(file => require(file)(mongoose))
        defaultModelFiles.forEach(file => require(file)(mongoose))

        const repoFiles = await readdirp.promise(pathResolver.resolve('./', 'repo'))
            .then((files) => files.map((f) => f.fullPath))

        c.service('model', (_c) => (name) => mongoose.model(name))
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
                    if (key === 'mongoose') return mongoose
                    const modelName = _upperFirst(_camelCase(key))

                    let defaultMethods = {}

                    try {
                        const Model = mongoose.model(modelName)
                        defaultMethods = {
                            get: require('./default-methods/get')(Model, modelName),
                            create: require('./default-methods/create')(Model, modelName),
                            createMany: require('./default-methods/createMany')(Model, modelName),
                            delete: require('./default-methods/delete')(Model, modelName),
                            all: require('./default-methods/all')(Model, modelName),
                            update: require('./default-methods/update')(Model, modelName),
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
    }
};
