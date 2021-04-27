const request = require('@oppnys/request');

function getProjectTemplate() {
  return request({
    url: '/project/template',
  });
}

module.exports = getProjectTemplate;
