const path = require('path');
const pkgDir = require('pkg-dir');
const npminstall = require('npminstall');
const { isObject } = require('@oppnys/utils');
const formatPath = require('@oppnys/format-path');
const { getDefaultRegistry } = require('@oppnys/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package实例化时options不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package实例化时options格式必须为对象！');
    }
    // package的路径
    this.tatgetPath = options.targetPath;
    // 缓存路径
    this.storeDir = options.storeDir;
    // package的名称
    this.packageName = options.packageName;
    // package的版本
    this.packageVersion = options.packageVersion;
  }

  // 判断当前Package是否存在
  exists() {
    console.log('exists');
  }

  // 安装Package
  install() {
    npminstall({
      root: this.tatgetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(true),
      pkgs: [
        { name: this.packageName, version: this.packageVersion },
      ],
    });
  }

  // 更新Package
  update() {
    console.log('update');
  }

  // 获取入口文件路径
  getRootFilePath() {
    // 获取package.json所在的目录
    const dir = pkgDir.sync(this.tatgetPath);
    // 如果目录存在
    if (dir) {
      // 读取package.json
      const pkg = require(path.resolve(dir, 'package.json'));
      // 查找main/lib 入口文件
      const pkgFile = pkg && (pkg.main || pkg.lib);
      // 生成兼容（MacOS、Windows）路径
      return formatPath(path.resolve(dir, pkgFile));
    }
    return null;
  }
}

module.exports = Package;
