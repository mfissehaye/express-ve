const readdirp = require("readdirp");
const pathResolver = require("path");
const _camelCase = require('lodash/camelCase')

module.exports = async (c) => {
  const configFiles = await readdirp.promise(pathResolver.resolve('./', 'config'))
      .then((files) => files.map(f => f.path))

  const configs = {}
  configFiles.forEach(config => {
    const key = _camelCase(config.replace(/\.js$/, ''))
    configs[key] = require(pathResolver.resolve('./config/', config))
  })
  c.service('config', () => {
    return {
      ...configs,
      ...process.env
    }
  });
};
