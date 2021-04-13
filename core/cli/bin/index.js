#!/usr/bin/env node

const importLocal = require('import-local');

if (importLocal(__filename)) {
  // eslint-disable-next-line global-require
  require('npmlog').info('cli', '正在使用oppnys本地版本');
} else {
  // eslint-disable-next-line global-require
  require('../lib')(process.argv.slice(2));
}
