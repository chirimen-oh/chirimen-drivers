import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['packages/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // セミコロン忘れをエラーにする
      semi: ['error', 'always'],
      // varの使用を禁止し、let/constを使用するようにする
      'no-var': 'error',
      // 未使用の変数をエラーにする
      'no-unused-vars': 'error',
      // 文字列はシングルクォーテーションを使用する
      quotes: ['error', 'single'],
    },
  },
];
