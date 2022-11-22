module.exports = {
    env: {
        browser: true,
        es2021: true,
        jquery: true
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
        camelcase: 'off',
        eqeqeq: 'warn',
        'handle-callback-err': 'warn',
        'n/no-callback-literal': 'off',
        'no-throw-literal': 'off',
        'no-unused-vars': 'warn',
        'brace-style': ['warn', '1tbs', { allowSingleLine: false }]
    }
}
