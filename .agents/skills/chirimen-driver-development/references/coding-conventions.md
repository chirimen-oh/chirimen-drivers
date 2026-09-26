# Coding conventions

ドライバ実装の書き方。正は [docs/contributing/coding-standards.md](../../../../docs/contributing/coding-standards.md)。編集中の package に既にある書き方を優先し、他の package の流儀へ無関係に書き換えない。

デバイス固有のレジスタ値は、ここには置かない。値はデータシートと、その package の現行コードから取る。

## Naming

変数名、メソッド名、class 名は英語にする。package ディレクトリは型番の小文字、公開名は `@chirimen/<device>`、class 名はデバイス型番（例: `ADT7410`）にする。

利用者が読むメソッド名は、操作の内容が分かる名前にする。レジスタ番号を public メソッド名にしない。

## Private implementation

public にするのは、利用者が呼ぶ操作だけである。レジスタアドレス、ビットマスク、変換の途中結果は class の外に出さない。

新規 package の private メソッドは `#` にする。現行の例は [packages/apds9930/index.js](../../../../packages/apds9930/index.js) の `#waitForStatus`。

既存 package を直すときは、そのファイルが使っている `#` または `_` 接頭辞に合わせる。接頭辞を揃えるだけの変更は加えない。

## Async

`init()` と読み取りは `async/await` で書く。コンストラクタでは I2C ポートとアドレスを保持し、`i2cPort.open()` は `init()` で呼ぶ。

`init()` の前に読み取られたときは、未初期化であることが分かる `Error` を投げる。空の戻り値や `null` で失敗を表さない。

## Timeout

センサーの準備完了を待つループには、終了条件を付ける。新規コードは、上限時間か上限回数を超えたら `Error` にする。

- 回数で打ち切る例: [packages/apds9930/index.js](../../../../packages/apds9930/index.js) の `#waitForStatus`
- 経過時間で打ち切る例: [packages/drv2605l/index.js](../../../../packages/drv2605l/index.js) の再生待ち

終了条件のない `while` は見本にしない。古い package に残っている無限待ちを、依頼範囲の外だからといってこの作業で置換しない。依頼された package の待ちを直すときは、同じ上限付きの形にする。

## Constants

レジスタアドレス、ビットマスク、既定の待ち時間は、モジュール先頭の名前付き定数にする。同じ数値が二度以上出るときも、定数にまとめる。

既存 package がマジックナンバーのまま動いている場合、その数値の意味を変えない修正では、一括で定数へ移さない。新しく足すレジスタ操作から名前を付ける。

## 現行の規約を優先する

実装の見本は、今の [docs/contributing/coding-standards.md](../../../../docs/contributing/coding-standards.md) と、同じ種類の現行 package である。historical pull request の指摘は、上のルールに既にあるものだけを採用する。PR 固有のデバイス手順や、当時の module 形式は規約にしない。
