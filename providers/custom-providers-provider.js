const readdirp = require("readdirp");
const pathResolver = require("path");
module.exports = async (c) => {

    const providers = await readdirp.promise(pathResolver.resolve('./', 'providers'))
        .then((files) => files.map((f) => f.path)
            .filter((p) => !p.endsWith('.spec.js')))

    c.service('providers', (_c) => {
        providers.forEach((provider) =>
            require(pathResolver.resolve(`providers/${provider}`))(_c))
    })
}