module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // React 19 no longer requires React in scope
    'react/react-in-jsx-scope': 'off',
    // Prop-types not needed in TypeScript projects
    'react/prop-types': 'off',
    // React Native does not parse HTML entities — rule not applicable
    'react/no-unescaped-entities': 'off',
    // Allow any at DB/SDK boundaries (documented in CLAUDE.md)
    '@typescript-eslint/no-explicit-any': 'warn',
    // Warn on unused vars during initial ESLint adoption — tighten to 'error' once legacy dead code is cleaned up
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // require() is a valid React Native idiom for image assets
    '@typescript-eslint/no-require-imports': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    // Empty functions are common in stubs/shims
    '@typescript-eslint/no-empty-function': 'warn',
    // Empty catch blocks are common for user-cancelled actions (e.g. Share, RevenueCat)
    'no-empty': ['warn', { allowEmptyCatch: true }],
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'outputs/',
    'scripts/',
    '*.config.js',
    'jest.setup.js',
    'jest.expo-winter-mock.js',
    'babel.config.js',
    'metro.config.js',
    'supabase/functions/',
  ],
};
