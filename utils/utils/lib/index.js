const cp = require('child_process');

function isObject(opts) {
  return Object.prototype.toString.call(opts) === '[object Object]';
}

function loading(msg = 'loading', spinnerStr = '|/-\\') {
  const { Spinner } = require('cli-spinner');
  const spinner = new Spinner(`:: ${msg} %s`);
  spinner.setSpinnerString(spinnerStr);
  spinner.start();
  return spinner;
}

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

function execCommand(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

function execAsync(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = execCommand(command, args, options);
    p.on('error', (error) => {
      reject(error);
    });
    p.on('exit', (c) => {
      resolve(c);
    });
  });
}

function getCommands(commands = '') {
  const cmds = commands.split(' ');
  const cmd = cmds[0];
  const args = cmds.slice(1);
  return {
    cmd,
    args,
  };
}

module.exports = {
  isObject,
  loading,
  sleep,
  execCommand,
  execAsync,
  getCommands,
};
