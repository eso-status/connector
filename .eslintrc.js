module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'max-len': 0,
    'import/extensions': 0,
    'import/prefer-default-export': 0,
    'no-nested-ternary': 0,
    'import/no-extraneous-dependencies': 0,
    'no-unused-vars': 0,
    'no-redeclare': 0,
    'import/no-unresolved': 0,
  },
};
