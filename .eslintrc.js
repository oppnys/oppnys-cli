module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    quotes: ['error', 'single'],
    'global-require': 'off',
    'prefer-rest-params': 'off',
    'import/no-dynamic-require': 'off',
    'prefer-spread': 'off',
    'no-underscore-dangle': 'off',
  },
};
