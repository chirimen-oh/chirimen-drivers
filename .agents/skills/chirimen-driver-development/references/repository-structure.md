# Repository structure

ドライバ package の置き場所と、現行の Pure ESM 構成。手順の正は [docs/contributing/repository.md](../../../../docs/contributing/repository.md)。構成の見本は [packages/hello-world/](../../../../packages/hello-world/)。

## Monorepo

このリポジトリは npm workspaces と Lerna の monorepo である。ドライバは `packages/` 以下にあり、各 package は Lerna の independent モードで独立した version を持つ。ある package の version を上げても、他の package の version は変わらない。

ルートで `npm ci` すると、workspace の依存関係がまとめて入る。

## Package layout

ディレクトリ名はデバイス型番の小文字にする（例: `adt7410`）。公開名は `@chirimen/<device>` にする。

```text
packages/<device>/
├── index.js       # ドライバ本体
├── package.json   # name, type, exports, version
└── README.md      # 仕様・使い方・API
```

`package.json` は Pure ESM を前提にする。

- `"type": "module"`
- `"exports": "./index.js"`
- `repository.directory` は `packages/<device>`
- `publishConfig.access` は `public`
- 初版の `version` は `1.0.0`

I2C ドライバは `peerDependencies` に `node-web-i2c` を書く。現行の書き方は [packages/adt7410/package.json](../../../../packages/adt7410/package.json)。

実装は ES Modules の class とし、`export default` する。`index.js` の中身は、同じ種類の現行 driver に合わせる。

## Historical pull request を読むとき

判断の正は、現行の `packages/` と [docs/contributing/](../../../../docs/contributing/) である。historical pull request は背景の確認に使い、差分をそのままディレクトリ構成のテンプレートにしない。

Pure ESM 移行より前の pull request は、当時の package structure の記録である。新しい package のディレクトリ構成、module 形式、export の書き方には使わない。`"type": "module"`、`exports`、class の default export が現行の正解である。
