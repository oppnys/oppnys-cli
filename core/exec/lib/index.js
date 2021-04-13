const Package = require('@oppnys/package');
const log = require('@oppnys/log');

const SETTINGS = {
  init: '@oppnys/init',
};

function exec() {
  let targetPath = process.env.CLI_TARGET_PATH;
  const homePath = process.env.CLI_HOME;
  log.verbose('targetPath', targetPath);
  log.verbose('homePath', homePath);

  // eslint-disable-next-line prefer-rest-params
  const cmdObj = arguments[arguments.length - 1];
  const commandName = cmdObj.name();
  const packageName = SETTINGS[commandName];
  const packageVersion = 'latest';
  if (!targetPath) {
    targetPath = ''; // 生成缓存路径
  }
  const pkg = new Package({
    targetPath,
    packageName,
    packageVersion,
  });

  console.log(pkg.getRootFilePath());
}

module.exports = exec;
