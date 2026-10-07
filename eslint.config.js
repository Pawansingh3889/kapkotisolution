export default [{
  files: ['**/*.js'],
  languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: Object.fromEntries([
    'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'document', 'window', 'fetch', 'AbortSignal', 'crypto', 'Blob', 'URL', 'setTimeout', 'setInterval',
    'matchMedia', 'Request', 'Response', 'TextEncoder', 'TextDecoder', 'console'
  ].map((name) => [name, 'readonly'])) },
  rules: { 'no-undef': 'error', 'no-unused-vars': 'error', 'no-unreachable': 'error', 'no-constant-condition': ['error', { checkLoops: false }], 'eqeqeq': 'error' }
}];
