const path = require('path');
const Package = require('@oppnys/package');
const log = require('@oppnys/log');

const SETTINGS = {
  init: '@oppnys/init',
};

const CACHE_DIR = 'dependencies';

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME;
  log.verbose('targetPath:', targetPath);
  log.verbose('homePath:', homePath);

  // eslint-disable-next-line prefer-rest-params
  const cmdObj = arguments[arguments.length - 1];
  const commandName = cmdObj.name();
  const packageName = SETTINGS[commandName];
  const packageVersion = 'latest';
  let storeDir = '';
  let pkg;
  if (!targetPath) {
    targetPath = path.resolve(homePath, CACHE_DIR); // 生成缓存路径
    storeDir = path.resolve(homePath, 'node_modules');
    log.verbose('targetPath: ', targetPath);
    log.verbose('storeDir: ', storeDir);
    pkg = new Package({
      targetPath,
      storeDir,
      packageName,
      packageVersion,
    });
    if (pkg.exists()) {
      // 更新package
      // pkg.update();
    } else {
      // 安装package
      pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  require(rootFile).apply(null, arguments);
}

module.exports = exec;
