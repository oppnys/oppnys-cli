const semver = require('semver');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';

const notEmptyDir = {
  name: 'notEmptyDir',
  type: 'confirm',
  default: false,
  message: '当前文件夹不为空，是否继续创建项目？',
};

const confirmDelete = {
  name: 'confirmDelete',
  type: 'confirm',
  default: false,
  message: '是否确定要清空当前文件夹中的文件？',
};

const projectType = {
  type: 'list',
  name: 'type',
  default: TYPE_PROJECT,
  choices: [
    {
      name: '项目',
      value: TYPE_PROJECT,
    },
    {
      name: '组件',
      value: TYPE_COMPONENT,
    },
  ],
  message: '请选择初始化类型',
};

function getProjectName(defaultName = '', typeName = '项目') {
  return {
    type: 'input',
    name: 'projectName',
    message: `请输入${typeName}名称`,
    default: defaultName,
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
  };
}

const projectVersion = (typeName = '项目') => ({
  type: 'input',
  name: 'version',
  message: `请输入${typeName}的版本`,
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
});

const projectDesc = {
  type: 'input',
  name: 'projectDesc',
  message: '请输入组件库的描述信息',
  default: '这是个有趣的组件库',
  validate: function validate(v) {
    const done = this.async();
    setTimeout(() => {
      if (!v.length) {
        done('描述信息不为空');
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
};

function getTemplates(list = [], typeName = '项目') {
  return {
    type: 'list',
    name: 'projectTemplate',
    message: `请选择${typeName}模板`,
    choices: list,
  };
}

module.exports = {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  notEmptyDir,
  confirmDelete,
  projectType,
  getProjectName,
  projectVersion,
  getTemplates,
  projectDesc,
};
