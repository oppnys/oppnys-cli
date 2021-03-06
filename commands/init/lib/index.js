const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const fsExtra = require('fs-extra');
const inquirer = require('inquirer');
const semver = require('semver');
const Command = require('@oppnys/command');
const log = require('@oppnys/log');
const Package = require('@oppnys/package');
const { loading, sleep } = require('@oppnys/utils');
const getProjectTemplate = require('./getProjectTemplate');

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
      this.projectInfo = await this.prepare();
      // 2. 下载阶段
      await this.downloadTemplate();
      // 3. 安装模版
    } catch (e) {
      log.error(e.message);
    }
  }

  async prepare() {
    // 0 判断项目模板是否存在
    const template = await getProjectTemplate();
    log.verbose('template', JSON.stringify(template));
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在');
    }
    this.template = template;
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

  async downloadTemplate() {
    log.verbose('download template info: ', JSON.stringify(this.projectInfo));
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find((item) => item.npmName === projectTemplate);
    const targetPath = path.resolve(userHome, '.oppnys', 'template'); // 生成缓存路径
    const storeDir = path.resolve(userHome, '.oppnys', 'template', 'node_modules');
    const { npmName, version } = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });
    const spinner = loading('fetch template...', '|\\-');
    try {
      if (await templateNpm.exists()) {
        // 更新package
        await templateNpm.update();
      } else {
        // 安装package
        await templateNpm.install();
      }
      await sleep(1500);
      spinner.stop(true);
      log.success('fetch template success');
    } catch (e) {
      spinner.stop(true);
      log.error('fetch template failed');
      throw e;
    }
  }

  /**
   * 创建项目模板清单
   */
  createTemplateChoice() {
    return this.template.map((item) => ({ name: item.name, value: item.npmName }));
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
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.createTemplateChoice(),
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
