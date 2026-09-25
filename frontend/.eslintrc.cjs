module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/immutability': 'off'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        beforeEach: 'readonly',
        expect: 'readonly',
        vi: 'readonly'
      }
    }
  ],
  ignorePatterns: ['dist/', 'node_modules/']
};
