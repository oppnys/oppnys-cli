class Command {
  constructor(argv) {
    // eslint-disable-next-line no-underscore-dangle
    this._argv = argv;
    const runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => {});
    });
  }

  // eslint-disable-next-line class-methods-use-this
  init() {
    throw new Error('必须实现init方法');
  }

  // eslint-disable-next-line class-methods-use-this
  exec() {
    throw new Error('必须实现exec方法');
  }
}
module.exports = Command;
