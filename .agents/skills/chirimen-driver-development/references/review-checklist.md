# Review checklist

差分が現行の規約と依頼範囲に合っているかの確認項目。基本ルールは [docs/contributing/getting-started.md](../../../../docs/contributing/getting-started.md)。実装の書き方は [coding-conventions.md](coding-conventions.md)、公開経路は [package-integration.md](package-integration.md)、version は [modify-driver.md](modify-driver.md)。

historical review の指摘は、ここに一般化した項目だけを使う。特定デバイスのレジスタ手順、当時の module 形式、当時のファイル配置は、review の必須条件にしない。

## 範囲

- [ ] 差分は依頼された package と、その変更に必要な metadata に収まっている
- [ ] metadata は、README、version、`chirimen` の dependency と re-export、ルートの `package-lock.json` に限る
- [ ] 無関係な package の修正、依存の上げ直し、lockfile の無関係な差分が無い

## Public API と private implementation

- [ ] public なのは、利用者が呼ぶ操作だけである
- [ ] レジスタアドレス、ビットマスク、変換の途中結果が class の外に出ていない
- [ ] 新規 package の private メソッドは `#` である
- [ ] 既存 package では、そのファイルが使っている `#` または `_` に合わせている
- [ ] 接頭辞を揃えるだけの変更が無い

## Constants / magic values

- [ ] 新しく足すレジスタアドレス、ビットマスク、既定の待ち時間は、モジュール先頭の名前付き定数である
- [ ] 同じ数値が二度以上出るときは定数にまとまっている
- [ ] 意味を変えない修正で、既存のマジックナンバーを一括で定数へ移していない

## Timeout / loop termination

- [ ] 新しく足す準備待ちループに、上限時間か上限回数がある
- [ ] 上限を超えたら `Error` になる
- [ ] 依頼範囲の外にある既存の無限待ちを、この差分で置換していない

## Error handling

- [ ] 未初期化の読み取りは、理由が分かる `Error` を投げる
- [ ] 失敗を空の戻り値や `null` で表していない
- [ ] 互換を保つ修正で、呼び出し側が依存しているエラー文言を変えていない

## Async behavior

- [ ] `init()` と読み取りが `async/await` である
- [ ] コンストラクタはポートとアドレスを保持し、`i2cPort.open()` は `init()` で呼んでいる

## Documentation

- [ ] 振る舞い、引数、戻り値、エラー条件が変わるとき、その package の README が同じ差分で更新されている
- [ ] 説明だけの誤りを直す変更では、`version` を上げていない

## Package integration

[package-integration.md](package-integration.md) の確認項目を使う。

- [ ] 個別 package の metadata が Pure ESM の現行形である
- [ ] 利用者に公開する driver は、`packages/chirimen/package.json` の dependency と `packages/chirimen/index.js` の re-export の両方がある
- [ ] dependency だけが追加され、re-export が無い状態で終わっていない
- [ ] ルートの `package-lock.json` が更新されている
- [ ] version の上げ幅が、個別 package と `chirimen` で [package-integration.md](package-integration.md) の表と一致している

## Export 漏れ

- [ ] 個別 package が class を default export している
- [ ] `chirimen` の re-export 名が、その class 名と一致している
- [ ] 別デバイスの class 名を export 名に使っていない
- [ ] re-export の位置が、既存の export 列の近い名前の隣である

## 現行の入口

review で不足として見る入口は、現行のファイルである。

- 個別 driver は `packages/<device>/index.js`
- aggregate の re-export は `packages/chirimen/index.js`
- フォーマットは Prettier、CI の確認は `npm ci`

Pure ESM 移行より前の `src/index.ts` や rollup 設定が無いことは、不足にしない。
