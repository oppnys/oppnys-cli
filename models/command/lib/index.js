const semver = require('semver');
const colors = require('colors');
const log = require('@oppnys/log');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error(colors.red('参数不能为空'));
    }
    if (!Array.isArray(argv)) {
      throw new Error(colors.red('参数必须为数组'));
    }
    if (argv.length < 1) {
      throw new Error(colors.red('参数列表为空'));
    }
    this._argv = argv;
    // eslint-disable-next-line no-unused-vars
    const runner = new Promise(() => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((err) => { log.error(err); });
    });
  }

  initArgs() {
    const len = this._argv.length - 1;
    this._argv = this._argv.slice(0, len);
  }

  // 检查node版本号
  // eslint-disable-next-line class-methods-use-this
  checkNodeVersion() {
    // 获取当前node版本号
    const currentVersion = process.version;
    // 获取兼容最低的版本号
    const lowestVersion = LOWEST_NODE_VERSION;

    // 2.比对最低版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`Oppnys 需要安装v${lowestVersion} 以上版本的弄node.js, 当前版本为 ${currentVersion}`));
    }
    log.verbose('currentVersion', currentVersion);
  }

  // eslint-disable-next-line class-methods-use-this
  init() {
    throw new Error('必须实现init方法!');
  }

  // eslint-disable-next-line class-methods-use-this
  exec() {
    throw new Error('必须实现exec方法!');
  }
}
module.exports = Command;
