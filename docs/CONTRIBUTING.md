{% include translate.md %}

# Contribution Guide

CHIRIMEN Drivers へのコントリビュート方法です。

## 行動規範

[コントリビューター行動規範 - Contributor Covenant](https://www.contributor-covenant.org/ja/version/1/4/code-of-conduct)

行動規範に反するコントリビュートは受け入れません。

## Issues

質問、バグ、提案、その他 Issue を歓迎します。

## Pull Request

ドキュメント追加、モジュール追加、バグ修正、その他改善するための Pull Request を歓迎します。

## ファイル構造

```
/
├── LICENSE
├── README.md
├── docs
│   ├── CONTRIBUTING.md
│   ├── README.md
│   └── examples
│        ├── hello.md
│        └── ...
├── examples
│   ├── hello
│   │   ├── package.json
│   │   └── ...
│   └── ...
├── lerna.json
├── package.json
└── packages
    ├── hello
    │   ├── package.json
    │   └── ...
    └── ...
```

| ファイルパス              | 説明                                                        |
| ------------------------- | ----------------------------------------------------------- |
| /docs                     | [CHIRIMEN Drivers ドキュメント]({ site.url })のソースコード |
| /docs/CONTRIBUTING.md     | [このドキュメント]({ page.url })のソースコード              |
| /docs/examples            | /examples の説明のためのドキュメント                        |
| (例) /docs/examples/hello | /examples/hello の説明                                      |
| /examples                 | 本リポジトリのモジュールを用いたコードの例                  |
| /packages                 | 本リポジトリのモジュールのソースコード                      |

## 修正の送り方

ドキュメントの誤字や文言の変更など軽微な修正は直接 GitHub 上で編集して Pull Request を送ることが可能です。
詳しくは[リポジトリのファイルを編集する](https://help.github.com/ja/github/managing-files-in-a-repository/editing-files-in-your-repository)を参照してください。

あるいは、[Git](https://git-scm.com/) を使って直接ファイルの追加・編集・削除を管理することが可能です。
リポジトリをフォークして Pull Request を送るには、以下のドキュメントを参照してください。

1. [リポジトリをフォークする](https://help.github.com/ja/github/getting-started-with-github/fork-a-repo)
2. [プルリクエストの作成方法](https://help.github.com/ja/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)

## 推奨するモジュールの構成

[ES Modules](https://tc39.es/ecma262/#sec-imports) または [UMD (Universal Module Definition) パターン](https://github.com/umdjs/umd)を推奨します。
ES Modules 作成し、[Rollup](https://rollupjs.org/)などを用いて、UMD のフォーマットに変換すると良いでしょう。

### package.json

`name` は、パッケージを公開する際の名前です。
必ず `@chirimen/` から始めてください。

`module`は [Rollup](https://rollupjs.org/) や [Webpack](https://webpack.js.org/) で ES Modules を扱うためのフィールドです。必要に応じて ES Modules 形式のスクリプトのファイル名を記載しましょう。

`scripts` は npm コマンドで実行可能な任意のスクリプトです。
詳しい説明は [npm-scripts のドキュメント](https://docs.npmjs.com/misc/scripts)を参照してください。

その他のプロパティの説明は [npm-package.json のドキュメント](https://docs.npmjs.com/files/package.json)を参照してください。

例:

```json
{
  "name": "@chirimen/hello",
  "version": "1.0.0",
  "main": "index.js",
  "module": "index.mjs",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/chirimen-oh/chirimen-drivers.git",
    "directory": "packages/hello"
  },
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "rollup -c"
  },
  "devDependencies": {
    "rollup": "~1"
  }
}
```

## 全てのモジュールをビルドする方法

packages ディレクトリ以下のそれぞれのモジュールの `npm run build` を実行するには、[Yarn](https://yarnpkg.com/) を使用します。
リポジトリのルートディレクトリで次のコマンドを実行してください。

```sh
yarn && yarn workspaces run build
```

## リリース方法

[@chirimen](https://www.npmjs.com/org/chirimen) のメンバーのみリリース可能です。

リリースするにはまず、npm コマンドで認証します。

```sh
npm login
```

このコマンドを実行し、認証に成功するとデプロイするための認証トークンが発行され ~/.npmrc に記録されます。
詳しい説明は [npm-adduser のドキュメント](https://docs.npmjs.com/cli/adduser) を参照してください。

発行された認証トークンを用いて、モジュールをリリースすることが可能になります。
packages ディレクトリ以下のそれぞれのモジュールをリリースするには、リポジトリのルートディレクトリで次のコマンドを実行してください。

```sh
yarn release
```
