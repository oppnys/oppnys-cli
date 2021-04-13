const path = require('path');

function formatPath(p) {
  if (p && typeof p === 'string') {
    const { sep } = path;
    if (sep === '/') {
      return p;
    }
    return p.replace(/\\/g, '/');
  }
  return p;
}

module.exports = formatPath;
