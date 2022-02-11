const repoProvider = require('./providers/repo-provider');
const loggerProvider = require('./providers/logger-provider');
const configProvider = require('./providers/config-provider');
const appProvider = require('./providers/app-provider');
const routesProvider = require('./providers/routes-provider');
const authenticationServiceProvider = require('./providers/authentication-service-provider');
const authorizationServiceProvider = require('./providers/authorization-service-provider')
const customProvidersProvider = require('./providers/custom-providers-provider')

class Container {
  constructor() {
    this.services = {};
  }

  service(name, cb) {
    Object.defineProperty(this, name, {
      get: () => {
        if (!Object.prototype.hasOwnProperty.call(this.services, name)) {
          this.services[name] = cb(this);
        }
        return this.services[name];
      },
      // so that declaration can be overridden
      configurable: true,
      // so we can see what dependencies are declared
      enumerable: true
    });
  }
}

module.exports = async () => {
  const container = new Container();
  configProvider(container); // config
  loggerProvider(container); // logger
  await repoProvider(container); // repo
  authenticationServiceProvider(container); // authentication
  authorizationServiceProvider(container); // locker

  await routesProvider(container); // router
  // await customProvidersProvider(container);
  appProvider(container); // app

  return container;
};
