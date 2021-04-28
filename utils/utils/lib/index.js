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

module.exports = {
  isObject,
  loading,
  sleep,
};
