import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended,
  prettier,
  {
    files: ['packages/**/*.js'],
    rules: {
      // セミコロン忘れをエラーにする
      'no-extra-semi': 'error',
      // varの使用を禁止し、let/constを使用するようにする
      'no-var': 'error',
      // 未使用の変数をエラーにする
      'no-unused-vars': 'error',
      // 文字列はシングルクォーテーションを使用する
      quotes: ['error', 'single'],
    },
  },
]);
