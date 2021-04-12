'use strict';

const { isObject } = require('@oppnys/utils')
const pkgDir = require('pkg-dir')

class Package {
    constructor(options) {
        if (!options ) {
            throw new Error('Package实例化时options不能为空！')
        }
        if(!isObject(options)){
            throw new Error('Package实例化时options格式必须为对象！')
        }
        // package的路径
        this.tatgetPath = options.targetPath;
        // package的名称
        this.packageName = options.packageName;
        // package的版本
        this.packageVersion = options.packageVersion;
    }

    // 判断当前Package是否存在
    exists() {
    }

    // 安装Package
    install() {
    }

    // 更新Package
    update() {
    }

    //获取入口文件路径
    async getRootFilePath() {
      const rootPath = await pkgDir(this.tatgetPath)
    }
}

module.exports = Package;
