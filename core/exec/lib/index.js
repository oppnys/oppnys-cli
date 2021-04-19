const path = require('path');
const cp = require('child_process');
const Package = require('@oppnys/package');
const log = require('@oppnys/log');

const SETTINGS = {
  init: '@oppnys/init',
};

const CACHE_DIR = 'dependencies';

function spawn(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['-c'].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

async function exec() {
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
    if (await pkg.exists()) {
      // 更新package
      await pkg.update();
    } else {
      // 安装package
      await pkg.install();
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  log.verbose('rootFile', rootFile);
  if (rootFile) {
    try {
      // require(rootFile).call(null, Array.from(arguments));
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        // eslint-disable-next-line no-prototype-builtins
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });
      child.on('error', (error) => {
        log.error(error.message);
        process.exit(1);
      });
      child.on('exit', (exitCode) => {
        log.verbose(`命令执行成功： ${exitCode}`);
        process.exit(exitCode);
      });
    } catch (e) {
      log.error(e.message);
    }
  }
}

module.exports = exec;
