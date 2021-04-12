'use strict';

function init(projectName, cmdObj) {
    console.log(`初始化 ${projectName}, 参数 `, cmdObj, process.env.CLI_TARGET_PATH )
}

module.exports = init;
