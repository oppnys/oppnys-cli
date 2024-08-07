const fs = require('fs');
const path = require('path');
const userHome = require('user-home');
const fsExtra = require('fs-extra');
const inquirer = require('inquirer');
const { glob } = require('glob');
const ejs = require('ejs');
const Command = require('@oppnys/command');
const log = require('@oppnys/log');
const Package = require('@oppnys/package');
const {
  execAsync,
  getCommands,
} = require('@oppnys/utils');
const {
  loading,
  sleep,
} = require('@oppnys/utils');
const getProjectTemplate = require('./getProjectTemplate');
const {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  notEmptyDir,
  confirmDelete,
  projectType,
  getProjectName,
  projectVersion,
  getTemplates,
  projectDesc,
} = require('./inquirer-config');

const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';

const WHITE_COMMANDS = ['npm', 'cnpm'];

function checkWhiteCommands(cmd) {
  if (!WHITE_COMMANDS.includes(cmd)) {
    throw new Error('The command is not includes in white command list');
  }
}

async function execCommand(command) {
  if (!command) {
    throw new Error(`The ${command} command is not found!`);
  }
  const {
    cmd,
    args,
  } = getCommands(command);
  checkWhiteCommands(cmd);
  await execAsync(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

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
      log.verbose('projectInfo', this.projectInfo);
      // 2. 下载阶段
      await this.downloadTemplate();
      // 3. 安装模版
      await this.installTemplate();
    } catch (e) {
      if (process.env.LOG_LEVEL === 'verbose') {
        // eslint-disable-next-line no-console
        console.log(e);
      }
      log.error(e.message);
    }
  }

  async installTemplate() {
    if (!this.templateInfo) {
      throw new Error('模板信息不存在！！！');
    }
    const { type = TEMPLATE_TYPE_NORMAL } = this.templateInfo;
    if (type === TEMPLATE_TYPE_NORMAL) {
      await this.installNormalTemplate();
      return;
    }
    if (type === TEMPLATE_TYPE_CUSTOM) {
      await this.installCustomTemplate();
      return;
    }
    throw new Error('模板信息无法识别！！！');
  }

  async installNormalTemplate() {
    const { cacheFilePath } = this.templateNpm;
    const templatePath = path.resolve(cacheFilePath, 'template');
    const targetPath = process.cwd();
    const spinner = loading('install template...', '|\\-');
    try {
      await sleep(100);
      fsExtra.ensureDirSync(templatePath, {});
      fsExtra.ensureDirSync(targetPath, {});
      fsExtra.copySync(templatePath, targetPath);
      log.success('template install success');
      spinner.stop(true);
    } catch (e) {
      spinner.stop(true);
      log.verbose(e.message);
      throw e;
    }
    const originIgnore = this.templateInfo.ignore || [];
    const ignore = ['**/node_modules/**', ...originIgnore];
    await this.esjRender({ ignore });
    const {
      installCommand = '',
      startCommand = '',
    } = this.templateInfo;
    await execCommand(installCommand);
    await execCommand(startCommand);
  }

  async esjRender(options) {
    const { projectInfo } = this;
    const files = await this.getProjectFiles(options);
    return new Promise((resolve, reject) => {
      files.forEach((filePath) => {
        ejs.renderFile(filePath, projectInfo, {}, (error, ret) => {
          if (error) {
            reject(error);
          } else {
            fsExtra.writeFileSync(filePath, ret);
            resolve(ret);
          }
        });
      });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async getProjectFiles(options) {
    const dir = process.cwd();
    const files = await glob('**', {
      cwd: dir,
      ignore: options.ignore,
      nodir: true,
    });
    return files.map((file) => path.join(dir, file));
  }

  async installCustomTemplate() {
    log.verbose('安装自定义模板', this);
  }

  async prepare() {
    // 0 判断项目模板是否存在
    const template = await getProjectTemplate();
    log.verbose('remote template list', JSON.stringify(template));
    if (!template || template.length === 0) {
      throw new Error('项目模板不存在');
    }
    this.template = template;
    // 获取当前命令执行的位置
    const localPath = process.cwd();
    // 1. 判断当前目录是否为空
    const ret = this.isDirEmpty(localPath);
    if (!ret) {
      let ifContinue = true;
      // 2. 是否启动强制更新
      if (!this.force) {
        // 1.1不为空 是否继续创建
        ifContinue = (await inquirer.prompt(notEmptyDir)).notEmptyDir;
      }
      if (!ifContinue) return;
      if (ifContinue || this.force) {
        const canDelete = (await inquirer.prompt(confirmDelete)).confirmDelete;
        if (canDelete) {
          // 清空当前目录
          fsExtra.emptyDirSync(localPath);
        } else {
          process.exit(0);
        }
      }
    }
    // eslint-disable-next-line consistent-return,no-return-await
    return await this.getProjectInfo();
  }

  async downloadTemplate() {
    log.verbose('download template info: ', JSON.stringify(this.projectInfo));
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.template.find((item) => item.packName === projectTemplate);
    const targetPath = path.resolve(userHome, '.oppnys', 'template'); // 生成缓存路径
    const storeDir = path.resolve(userHome, '.oppnys', 'template', 'node_modules');
    const {
      packName,
      version,
    } = templateInfo;
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: packName,
      packageVersion: version,
    });
    const spinner = loading('fetch template...', '|\\-');
    this.templateInfo = templateInfo;
    try {
      log.verbose('exists', await templateNpm.exists());
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
    } finally {
      this.templateNpm = templateNpm;
    }
  }

  /**
   * 创建项目模板清单
   */
  createTemplateChoice() {
    return this.template.map((item) => ({
      name: item.name,
      value: item.packName,
    }));
  }

  /**
   * 获取项目基本信息
   * @returns {Promise<{}>}
   */
  async getProjectInfo() {
    let projectInfo = {};
    // 1. 选择创建项目或者文件
    const { type } = await inquirer.prompt(projectType);
    this.template = this.template.filter((t) => t.tag.includes(type));
    if (type === TYPE_PROJECT) {
      const typeName = '项目';
      // 2. 获取项目的基本信息
      const project = await inquirer.prompt([
        getProjectName(this.projectName, typeName), // 项目名称
        projectVersion(typeName), // 项目版本
        getTemplates(this.createTemplateChoice(), typeName), // 模板列表
      ]);
      projectInfo = {
        type,
        ...project,
      };
    } else if (type === TYPE_COMPONENT) {
      // 2. 获取项目的基本信息
      const typeName = '组件库';
      const project = await inquirer.prompt([
        getProjectName(this.projectName, typeName), // 项目名称
        projectVersion(typeName), // 项目版本
        projectDesc,
        getTemplates(this.createTemplateChoice(), typeName), // 模板列表
      ]);
      projectInfo = {
        type,
        ...project,
      };
      console.log(projectInfo);
    }

    return {
      ...projectInfo,
      // eslint-disable-next-line import/no-extraneous-dependencies
      className: require('kebab-case')(projectInfo.projectName),
    };
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
