module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: 'standard',
    overrides: [
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        indent: ['error', 4],
        camelcase: 'warn',
        'no-unused-vars': 'warn',
        'brace-style': ['warn', '1tbs', { allowSingleLine: false }]
    }
}
