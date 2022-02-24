const readdirp = require("readdirp");
const pathResolver = require("path");
const _camelCase = require('lodash/camelCase')

module.exports = async (c) => {
    const configFiles = await readdirp.promise(pathResolver.resolve('./', 'config'))
        .then((files) => files.map(f => f.path))

    const configs = {}
    configFiles.forEach(config => {
        const key = _camelCase(config.replace(/\.js$/, ''))
        if (key !== 'index') {
            configs[key] = require(pathResolver.resolve('./config/', config))
        } else {
            const topConfigs = require(pathResolver.resolve('./config'))
            for (const configKey in topConfigs) {
                configs[configKey] = topConfigs[configKey]
            }
        }
    })
    c.service('config', () => {
        return {
            ...configs,
            ...process.env
        }
    });
};
