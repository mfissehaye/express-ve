module.exports = (c) => {
  c.service('logger', () => ({
    // eslint-disable-next-line no-console
    log: console.log
  }));
};
