const path = require('path');
const pkgDir = require('pkg-dir');
const npminstall = require('npminstall');
const pathExists = require('path-exists').sync;
const fsExtra = require('fs-extra');
const { isObject } = require('@oppnys/utils');
const formatPath = require('@oppnys/format-path');
const log = require('@oppnys/log');
const { getDefaultRegistry, getNpmLatestVersion } = require('@oppnys/get-npm-info');

class Package {
  constructor(options) {
    if (!options) {
      throw new Error('Package实例化时options不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package实例化时options格式必须为对象！');
    }
    // package的路径
    this.targetPath = options.targetPath;
    // 缓存路径
    this.storeDir = options.storeDir;
    // package的名称
    this.packageName = options.packageName;
    // package的版本
    this.packageVersion = options.packageVersion;

    // package 的缓存目录前缀
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }

  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fsExtra.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName);
    }
    log.verbose('current version', this.packageVersion);
  }

  // 判断当前Package是否存在
  // eslint-disable-next-line consistent-return
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      log.verbose('cacheFilePath: ', this.cacheFilePath);
      return pathExists(this.cacheFilePath);
    }
    return pathExists(this.targetPath);
  }

  get cacheFilePath() {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this
      .packageVersion}@${this.packageName}`);
  }

  // 获取指定版本的路径
  getSpecificCacheFilePath(packageVersion) {
    return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
  }

  // 安装Package
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(true),
      pkgs: [
        { name: this.packageName, version: this.packageVersion },
      ],
    });
  }

  // 更新Package
  async update() {
    await this.prepare();
    const latestPackageVersion = await getNpmLatestVersion(this.packageName);
    log.verbose('update latest', latestPackageVersion);
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    if (!pathExists(latestFilePath)) {
      log.verbose('install ', `path: ${this.targetPath}, name: ${this.packageName}, version: ${latestPackageVersion}`);
      this.packageVersion = latestPackageVersion;
      return npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(true),
        pkgs: [
          { name: this.packageName, version: latestPackageVersion },
        ],
      });
    }
    return latestPackageVersion;
  }

  // 获取入口文件路径
  getRootFilePath() {
    // eslint-disable-next-line no-underscore-dangle
    function _getRootFile(targetPath) {
      // 获取package.json所在的目录
      const dir = pkgDir.sync(targetPath);
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
    if (this.storeDir) {
      return _getRootFile(this.cacheFilePath);
    }
    return _getRootFile(this.targetPath);
  }
}

module.exports = Package;
