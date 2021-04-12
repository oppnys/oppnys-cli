'use strict';

const path = require('path')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const {Command} = require('commander')
const log = require("@oppnys/log")

/**
 * require('*.js / *.json / *.node')
 * *.[any] => *.js => module.exports
 */
const pkg = require('../package.json')
const constant = require('./const')
const init = require('@oppnys/init')
const exec = require('@oppnys/exec')

let args;
const program = new Command('program')

async function core() {
    try {
        await prepare();
        registerCommand();
    } catch (e) {
        log.error('cli', e.message)
    }
}

/**
 * 预检查
 * @returns {Promise<void>}
 */
async function prepare() {
    checkVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
}

/**
 * 命令注册
 */
function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否制定本地调试文件路径', '');

    program
        .command('init [projectName]')
        .option('-f --force', '是否强制初始化项目')
        .action(exec);

    // 指定全局的targetPath
    program.on('option:targetPath', function (){
        if (program.opts().targetPath) {
            process.env.CLI_TARGET_PATH = program.opts().targetPath
        }
    })

    // 调试模式监听
    program.on('option:debug', function () {
        if (program.opts().debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
        log.verbose('test', 'test')
    })

    // 未知命令监听
    program.on('command:*', function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name)
        log.error(colors.red(`unknown command:${obj[0]}`))
        if (availableCommands.length > 0) {
            log.info(colors.red(`available commands：${availableCommands.join(',')}`))
        }
    })


    program.parse(process.argv)

    if (program.args && program.args.length < 1) {
        program.outputHelp()
    }
}

/**
 * 检查是否需要全局更新
 */
async function checkGlobalUpdate() {
    // 获取当前版本号和模块名
    const currentVersion = pkg.version
    const packageName = pkg.name

    // 通过模块名获取 npm 线上所有版本号
    const {getNpmSemverVersion} = require('@oppnys/get-npm-info')
    // 提取所有版本号，对比哪些大于当前版本号
    const lastVersion = await getNpmSemverVersion(packageName, currentVersion)
    if (lastVersion && semver.gt(lastVersion, currentVersion)) {
        log.warn(
            colors.yellow('更新提示：', `请手动更新 ${packageName}, 当前版本为: ${currentVersion}, 最新版本为：${lastVersion}
            更新命令： npm install -g ${packageName}`)
        )
    }
}

/**
 * 检查环境
 */
function checkEnv() {
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        require('dotenv').config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
}

/**
 * 创建默认的环境变量
 * @returns {{home: *|{}}}
 */
function createDefaultConfig() {
    const config = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        config['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        config['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME = config.cliHome
}

/**
 * 检查是否为用户主目录
 */
function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在'))
    }
}

/**
 * 检查是否是root账户
 */
function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
}

/**
 * 检查node版本号
 */
function checkNodeVersion() {
    // 获取当前node版本号
    const currentVersion = process.version
    // 获取兼容最低的版本号
    const lowestVersion = constant.LOWEST_NODE_VERSION

    // 2.比对最低版本号
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`Oppnys 需要安装v${lowestVersion} 以上版本的弄node.js, 当前版本为 ${currentVersion}`))
    }

}

/**
 * 检查版本
 */
function checkVersion() {
    log.success(colors.red(`Current Version ${pkg.version}`))
}

module.exports = core;
