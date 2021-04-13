function isObject(opts) {
  return Object.prototype.toString.call(opts) === '[object Object]';
}

module.exports = {
  isObject,
};
