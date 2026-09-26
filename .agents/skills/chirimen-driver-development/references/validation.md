# Historical pull request validation

`chirimen-driver-development` Skill が、現行の開発パターンを再現できるかを確認する手順。Skill を書くときに読んだ pull request では自己評価しない。別の historical pull request を validation data にする。

再現の正は、現行の `packages/` と [docs/contributing/](../../../../docs/contributing/)、およびこのディレクトリの reference である。historical pull request の差分は、観点が出るかを見る材料である。当時のファイル配置や module 形式を、計画の期待値にしない。

## Source の分離

Training source はこの検証で読まない。Validation source だけを、計画または review を書いたあとに見る。

### Training source

Skill の知識を一般化するときに使った pull request。検証の入力にしない。

- #399
- #409
- #410
- #435
- #436
- #439
- #441
- #444

### Validation source

| Case | Pull request | 作業 |
| --- | --- | --- |
| 1 | [#405 Add VL6180X](https://github.com/chirimen-oh/chirimen-drivers/pull/405) | 新規 I2C driver |
| 2 | [#404 update rc522_ws1850s](https://github.com/chirimen-oh/chirimen-drivers/pull/404) | 既存 driver の変更 |
| 3 | [#402 Add rc522_ws1850s](https://github.com/chirimen-oh/chirimen-drivers/pull/402) | review |

#402、#404、#405 は Pure ESM 移行より前である。rollup、`main` / `module`、デバイス名のソースファイルは、当時の記録である。現行の package は [repository-structure.md](repository-structure.md) の `index.js` と `"type": "module"` である。

## 手順

1. 作業種別を決める。新規 driver、既存 driver の変更、review のどれかにする。
2. [SKILL.md](../SKILL.md) と、種別に対応する reference だけを読んで、計画または review を書く。この段階では validation source の diff を見ない。
3. 書いたものを、その case の expected checklist と突き合わせる。
4. その後に、割り当てた pull request を見る。観点が揃っているかを確認する。
5. 落ちた項目を「不足の記録」に残す。一般化できる不足だけを、戻す reference に足す。

デバイス固有のレジスタ手順、当時の module 形式、当時のファイル名は reference に戻さない。

## Case 1: 新規 I2C driver

[#405](https://github.com/chirimen-oh/chirimen-drivers/pull/405) と比較する。計画の正は [add-new-driver.md](add-new-driver.md) と [package-integration.md](package-integration.md) である。

### Prompt

```text
VL6180X の新規 I2C driver を追加する計画を作ってください。
chirimen-driver-development Skill に従い、コードはまだ変更しないでください。
必要な package と source、README、package integration、public export、
build / test / validation を計画に含めてください。
```

### Expected checklist

- [ ] `packages/vl6180x/index.js`、`package.json`、`README.md` を認識している
- [ ] Pure ESM（`"type": "module"`、`"exports": "./index.js"`、class の default export）を計画している
- [ ] 同種の現行 I2C package（[packages/adt7410/](../../../../packages/adt7410/)）を見て public API を決める、と書いている
- [ ] `constructor(i2cPort, slaveAddress)`、`async init()`、読み取りメソッドを public API に含めている
- [ ] README に仕様、使い方、引数、戻り値、未初期化時のエラーを書く、と書いている
- [ ] `packages/chirimen/package.json` の dependency と `packages/chirimen/index.js` の re-export の両方を含めている
- [ ] 個別 package の初版 `1.0.0` と、`chirimen` の MINOR を分けている
- [ ] ルートの `package-lock.json` を `npm install` で更新する、と書いている
- [ ] Prettier、`npm ci`、ハードウェア確認（[docs/contributing/testing.md](../../../../docs/contributing/testing.md)）を提示している
- [ ] rollup、`src/index.ts`、ルート README のパッケージ一覧を、現行の必須ファイルにしていない

## Case 2: 既存 driver の変更

[#404](https://github.com/chirimen-oh/chirimen-drivers/pull/404) と比較する。計画の正は [modify-driver.md](modify-driver.md) である。

### Prompt

```text
既存の rc522_ws1850s driver を変更する計画を作ってください。
chirimen-driver-development Skill に従い、コードはまだ変更しないでください。
変更範囲、互換、README、version を計画に含めてください。
```

### Expected checklist

- [ ] 変更範囲を依頼された package と、その変更に必要な metadata に限っている
- [ ] bug fix、互換のある変更、破壊的変更のどれかを、利用者から見える振る舞いで分けている
- [ ] version の上げ幅を PATCH、MINOR、MAJOR のいずれかで示している
- [ ] 振る舞い、引数、戻り値、エラー条件が変わるときは、その package の README を同じ変更で更新する、と書いている
- [ ] 説明だけの修正では `version` を上げない、と書いている
- [ ] 無関係な package やルートの version を変えない、と書いている
- [ ] ブランチ名を `fix/<device>-<内容>` または `feat/<device>-<内容>` にしている

## Case 3: Review

[#402](https://github.com/chirimen-oh/chirimen-drivers/pull/402) の diff を、[review-checklist.md](review-checklist.md) の観点で見る。合格は、historical pull request が現行 checklist を通ることではない。観点が review に使われることである。

#402 には、rollup 出力名 `VEML6070` と、package 直下の README の有無がある。別デバイス名と README の観点が機能しているかを見る材料にする。rollup ファイル自体を現行の必須成果物にはしない。

### Prompt

```text
PR #402 の差分を review してください。
chirimen-driver-development Skill の review-checklist.md を使い、
範囲、public API、定数、timeout、エラー、async、README、
package integration、export、無関係な差分を確認してください。
Pure ESM より前のファイル配置との差は、Skill の不足にしないでください。
```

### Expected checklist

- [ ] 範囲（依頼 package と必要な metadata、無関係な差分）を見ている
- [ ] public API と private implementation を見ている
- [ ] 定数とマジックナンバーを見ている
- [ ] timeout とループの終了条件を見ている
- [ ] エラー処理を見ている
- [ ] async（`init()` と `i2cPort.open()` の位置）を見ている
- [ ] README と、説明だけの修正では version を上げないことを見ている
- [ ] package integration（dependency と re-export の両方、lockfile、version）を見ている
- [ ] export 名が class 名と一致するか、別デバイスの名前を使っていないかを見ている
- [ ] `src/index.ts` や rollup が無いことを、現行構成の不足にしていない

## 不足の記録

expected checklist の項目が計画または review から落ちたときだけ、不足とする。次を残す。

| 項目 | 書く内容 |
| --- | --- |
| Case | 1、2、3 のいずれか |
| 落ちた確認項目 | expected checklist の項目 |
| 戻す reference | その項目の正があるファイル |
| 一般化できるか | 現行の package と contributing に共通するルールか |

一般化できる不足は、戻す reference に足す。戻す先は次のとおり。

| 落ちた内容 | 戻す reference |
| --- | --- |
| package 作成、public API、README、確認手順 | [add-new-driver.md](add-new-driver.md) |
| 互換、version、既存 package の README | [modify-driver.md](modify-driver.md) |
| dependency、re-export、lockfile | [package-integration.md](package-integration.md) |
| review の観点 | [review-checklist.md](review-checklist.md) |
| 命名、private、async、timeout、定数 | [coding-conventions.md](coding-conventions.md) |

不足ではない差は、このファイルに残し、reference には書かない。

- Pure ESM より前の rollup、`main` / `module`、デバイス名のソースファイル
- ルート README のパッケージ一覧だけを、`chirimen` の public export とみなすこと
- 特定デバイスのレジスタ手順、ビット操作、待ち時間の数値

## 実施結果

上の手順で 3 ケースを実行したあと、この節に結果を書く。実行前は空である。
