const fs = require('fs');
const fsExtra = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const Command = require('@oppnys/command');
const log = require('@oppnys/log');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '';
    this.force = this._argv[1].force || false;
    log.verbose('projectName: ', this.projectName);
    log.verbose('options force: ', this.force);
  }

  async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare();
      console.log(projectInfo);
      // 2. 下载阶段
      this.downloadTemplate();
      // 3. 安装模版
    } catch (e) {
      log.error(e.message);
    }
  }

  async prepare() {
    // 获取当前命令执行的位置
    const localPath = process.cwd();
    // 1. 判断当前目录是否为空
    const ret = this.isDirEmpty(localPath);
    if (!ret) {
      let ifContinue = false;
      // 2. 是否启动强制更新
      if (!this.force) {
        // 1.1不为空 是否继续创建
        ifContinue = (await inquirer.prompt({
          name: 'ifContinue',
          type: 'confirm',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目？',
        })).ifContinue;
      }
      if (!ifContinue) return;
      if (ifContinue || this.force) {
        const { confirmDelete } = await inquirer.prompt({
          name: 'confirmDelete',
          type: 'confirm',
          default: false,
          message: '是否确定要清空当前文件夹中的文件？',
        });
        if (confirmDelete) {
          // 清空当前目录
          fsExtra.emptyDirSync(localPath);
        }
      }
    }
    // eslint-disable-next-line consistent-return,no-return-await
    return await this.getProjectInfo();
  }

  downloadTemplate() {
    // 1.通过项目模板API获取项目模板信息
    // 1.1 通过egg.js搭建后端系统
    // 1.2 通过npm 存储项目模板
    // 1.3 将项目模板信息存储到mongodb 数据库中
    // 1.4 通过egg.js 获取mongodb中的数据并且通过API返回
  }

  /**
   * 获取项目基本信息
   * @returns {Promise<{}>}
   */
  async getProjectInfo() {
    let projectInfo = {};
    // 1. 选择创建项目或者文件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      default: TYPE_PROJECT,
      choices: [
        { name: '项目', value: TYPE_PROJECT },
        { name: '组件', value: TYPE_COMPONENT },
      ],
      message: '请选择初始化类型',
    });
    log.verbose('type', type);
    if (type === TYPE_PROJECT) {
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: '请输入项目名称',
          default: this.projectName,
          // 项目名称必须以字母开头和字母或数字结尾，只能包含-_两种特殊字符
          validate: function validate(v) {
            const done = this.async();
            setTimeout(() => {
              if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
                done('请输入合法的项目名称！（项目名称只能包含字母数字-_等特殊字符，且必须以字母开头和数字字母结尾）');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: (v) => v,
        },
        {
          type: 'input',
          name: 'version',
          message: '请输入项目的版本',
          default: '1.0.0',
          validate: function validate(v) {
            const done = this.async();
            setTimeout(() => {
              if (!semver.valid(v)) {
                done('请输入合法的版本号！（例如：1.0.0）');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: (v) => {
            if (semver.valid(v)) {
              return semver.valid(v);
            }
            return v;
          },
        },
      ]);
      projectInfo = {
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
      console.log(TYPE_COMPONENT);
    }
    return projectInfo;
  }

  // 当前文件夹是否为空
  // eslint-disable-next-line class-methods-use-this
  isDirEmpty(localPath) {
    // 获取当前位置是否有文件
    let fileList = fs.readdirSync(localPath);
    // 过滤缓存文件
    fileList = fileList.filter((file) => !file.startsWith('.') && ['node_modules'].indexOf(file) < 0);
    return !fileList || fileList.length <= 0;
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports.InitCommand = InitCommand;
module.exports = init;
