# 新規 driver の追加

`packages/` に新しいドライバ package を追加するときの手順。正は [docs/contributing/add-driver.md](../../../../docs/contributing/add-driver.md) と [docs/contributing/appendix.md](../../../../docs/contributing/appendix.md)。ディレクトリ構成は [repository-structure.md](repository-structure.md)。

`chirimen.org` のサンプル、実体配線図、パーツ画像は、この workflow の途中で追加しない。

## 1. 類似 driver を調べる

public API を決める前に、同じ種類の現行 package を読む。

| 用途 | package |
| --- | --- |
| ディレクトリと `package.json` の雛形 | [packages/hello-world/](../../../../packages/hello-world/) |
| 単純な I2C センサー | [packages/adt7410/](../../../../packages/adt7410/) |
| レジスタが多いセンサー | [packages/amg8833/](../../../../packages/amg8833/) |

GPIO や SPI のデバイスは、I2C の雛形を流用せず、同じバスの現行 package に合わせる。

## 2. Package を作る

ブランチ名は `feat/<デバイス名>`。ディレクトリ名は型番の小文字にする。

[packages/hello-world/](../../../../packages/hello-world/) を `packages/<device>/` にコピーし、次を更新する。

| ファイル | 更新する内容 |
| --- | --- |
| `package.json` | `name`（`@chirimen/<device>`）、`description`、`version`（初版は `1.0.0`）、`repository.directory`。I2C なら `peerDependencies` に `node-web-i2c` |
| `index.js` | センサーの読み取りを class として実装する |
| `README.md` | 仕様、使い方、API。日本語で書く |

`package.json` の `"type": "module"` と `"exports": "./index.js"` は hello-world のまま残す。

## 3. Public API を決める

I2C ドライバの基本形は次のとおり。

- class を default export する
- `constructor(i2cPort, slaveAddress)` でポートとアドレスを受け取る
- `async init()` で `i2cPort.open()` を呼ぶ
- `async read()` で測定値を返す。未初期化なら、理由が分かる `Error` を投げる

利用者が呼ぶ操作だけを public にする。レジスタアドレスやビット操作は class の外に出さない。複数の読み取りが必要なら、同種の現行 driver のメソッド名に合わせ、`read()` 一つに詰め込まない。

## 4. README

README には、少なくとも次を書く。

- 測定範囲、精度、スレーブアドレスなど、使うために必要な仕様
- `init()` と読み取りメソッドの呼び出し例
- 各 public メソッドの引数、戻り値、未初期化時のエラー

## 5. 確認

自動テストの仕組みは無い。確認方法の正は [docs/contributing/testing.md](../../../../docs/contributing/testing.md)。

1. `npx prettier --write packages/<device>/` を実行する
2. リポジトリルートで `npm install` し、新しい workspace を `package-lock.json` に反映する
3. ハードウェアがあるときは、初期化、正常な読み取り、センサー未接続などの異常系を確認する

コミットは対象 package と、lockfile の更新に限る。メッセージは `feat: add <device> driver`。
