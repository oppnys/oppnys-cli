#!/usr/bin/env node


const importLocal = require('import-local')
console.log(__filename)
if (importLocal(__filename)) {
    require('npmlog').info('cli', '正在使用oppnys本地版本')
} else {
    require('../lib')(process.argv.slice(2))
}