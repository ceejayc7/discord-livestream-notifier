module.exports = {
  env: {
    es6: true,
    node: true
  },
  extends: ['eslint:recommended', 'google', 'prettier', 'prettier/babel'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'require-jsdoc': 0,
    'max-len': 0,
    indent: 0,
    'comma-dangle': 0,
    'no-invalid-this': 0
  }
};
