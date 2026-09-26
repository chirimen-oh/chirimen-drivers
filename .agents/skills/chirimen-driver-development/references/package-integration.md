# Package integration

新規 driver を、利用者の import から届く状態にする確認項目。個別 package の作り方は [add-new-driver.md](add-new-driver.md)。正は現行の [packages/chirimen/](../../../../packages/chirimen/) と [docs/contributing/](../../../../docs/contributing/)。

`packages/<device>/` がリポジトリにあるだけでは、aggregate package `chirimen` からその driver は使えない。dependency の宣言と、public な re-export の両方が必要である。

## 利用者から見える入口

公開する driver には、次の二つの入口がある。

| 入口 | 利用者の import |
| --- | --- |
| 個別 package | `import Device from "@chirimen/<device>"` |
| aggregate package | `import { ClassName } from "chirimen"` |

aggregate の見本は [packages/chirimen/README.md](../../../../packages/chirimen/README.md)。依存の宣言は [packages/chirimen/package.json](../../../../packages/chirimen/package.json)、re-export は [packages/chirimen/index.js](../../../../packages/chirimen/index.js)。

## 確認項目

### Driver package

[add-new-driver.md](add-new-driver.md) の package 作成が済んでいること。

- `packages/<device>/index.js`
- `packages/<device>/package.json`
- `packages/<device>/README.md`

構成は Pure ESM である。`"type": "module"` と `"exports": "./index.js"` を置く。いまの aggregate の re-export は `packages/chirimen/index.js` に書く。Pure ESM 移行より前の入口 `packages/chirimen/src/index.ts` には書かない。

### Package metadata

個別 package の `package.json` は [repository-structure.md](repository-structure.md) に合わせる。

- `name` は `@chirimen/<device>`
- 初版の `version` は `1.0.0`
- `repository.directory` は `packages/<device>`
- `publishConfig.access` は `public`
- I2C なら `peerDependencies` に `node-web-i2c`

### Aggregate package dependency

[packages/chirimen/package.json](../../../../packages/chirimen/package.json) の `dependencies` に、依頼した driver を足す。

- キーは `@chirimen/<device>`、値は `"latest"`
- 既存の `@chirimen/*` と同じく、パッケージ名のアルファベット順の位置に置く
- 既存の並びを全体でソートし直す差分は加えない

`dependencies` に行があるだけでは、`import { ClassName } from "chirimen"` ではその class を参照できない。次の re-export が必要である。

### Public export

[packages/chirimen/index.js](../../../../packages/chirimen/index.js) に named re-export を足す。

```js
export { default as ClassName } from "@chirimen/<device>";
```

`ClassName` は、その driver が default export している class 名にする。既存の export の並びに合わせ、近い名前の隣に置く。export 列を全体で並べ替える差分は加えない。

export 名は、利用者が `chirimen` から import する名前と一致させる。別デバイスの class 名は付けない。

### Lockfile

リポジトリルートで `npm install` し、新しい workspace と `chirimen` の dependency を `package-lock.json` に反映する。

master へ入ったとき、CI は [.github/workflows/ci.yml](../../../../.github/workflows/ci.yml) の `npm ci` を実行する。lockfile が `package.json` と一致していないと、ここで失敗する。

### README / documentation

個別 package の README には、仕様、使い方、public メソッドを書く。書き方は [add-new-driver.md](add-new-driver.md) の README に従う。

`chirimen` の README は aggregate の import 例である。新しい driver のたびに、その例へデバイスを足す慣行は現行の README には無い。確認するのは、re-export した名前で `import { ClassName } from "chirimen"` できることと、個別 README の class 名が一致していることである。

### Version consistency

Lerna は independent である。個別 package の version と `chirimen` の version は別々に決める。個別 package の上げ幅は [modify-driver.md](modify-driver.md)。

| 変更 | 上げる package | 上げ幅 |
| --- | --- | --- |
| 新規 driver の初版 | `packages/<device>` | `1.0.0` |
| `chirimen` に新しい public export を足す | `packages/chirimen` | MINOR |
| dependency は既にあり、re-export だけが欠けている | `packages/chirimen` | PATCH |

ルートの `package.json` や、依頼外の package の version は変えない。

### Build / test / lint

現行の確認は次のとおり。

- 触った package に `npx prettier --write` を実行する
- 自動テストは無い。ハードウェア確認は [docs/contributing/testing.md](../../../../docs/contributing/testing.md)
- CI の確認は `npm ci` である

Pure ESM の driver に、ビルド用の rollup 設定や `src/index.ts` は足さない。

## 差分の範囲

依頼された driver と、その driver を `chirimen` から使えるようにするファイルだけを変える。

- `packages/<device>/`
- `packages/chirimen/package.json`
- `packages/chirimen/index.js`
- ルートの `package-lock.json`

既に aggregate へ入っていない別の package を、この作業でまとめて足さない。
