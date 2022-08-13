module.exports = {
    env: {
        node: true,
        jest: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint', 'promise', 'unicorn'],
    extends: [
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:promise/recommended',
        'plugin:unicorn/recommended',
        'prettier',
    ],
    rules: {
        'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
        'import/no-default-export': 'error',
        'import/prefer-default-export': 'off',
        'unicorn/prefer-module': 'off',
        'class-methods-use-this': 'off',
        'no-restricted-syntax': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/no-null': 'off',
        'import/no-cycle': 'off',
        'unicorn/prefer-top-level-await': 'off',
    },
};
