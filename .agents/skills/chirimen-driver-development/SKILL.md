---
name: chirimen-driver-development
description: >-
  Guides CHIRIMEN driver additions, modifications, bug fixes, and reviews in
  chirimen-drivers. Use when adding a driver, changing a package under
  packages/, fixing a driver bug, reviewing a pull request, or when the user
  mentions chirimen-driver-development, ドライバ追加, ドライバ修正, or ドライバレビュー.
---

# CHIRIMEN driver development

`chirimen-oh/chirimen-drivers` でドライバを追加・変更・修正・レビューするときの入口。詳細な repository knowledge は `references/` に後続の変更で追加する。この Skill は配置・目的・基本 workflow を定義し、reference の本文は持たない。

ドライバ実装そのものはこの Skill の対象外である。依頼された package だけを変更する。

## 対象範囲

| 作業 | 内容 |
| --- | --- |
| 新規 driver の追加 | `packages/` に新しいドライバ package を追加する |
| 既存 driver の変更 | 既存 package の API や振る舞いを変える。互換の有無で version を分ける |
| bug fix | 期待と違う動作を、当該 package に限定して直す |
| review | 差分が現行の規約と依頼範囲に合っているかを確認する |

リリース判断、`chirimen.org` のサンプル実装、無関係な package の整理は、この workflow の途中で始めない。

## 判断の優先順位

実装と review の基準は、現在の repository conventions である。優先順は次のとおり。

1. 現行の `packages/` と [docs/contributing/](../../../docs/contributing/)
2. `references/` にある文書
3. historical pull request は、判断の背景を確認する材料

historical pull request の差分は、そのままテンプレートにしない。PR 固有の手順や、現行の構成と食い違うファイル配置は、一般ルールとして固定しない。現行の規約と historical pull request が矛盾するときは、現行の規約を採用する。

## Pure ESM より前の pull request

package structure の基準は、現行の Pure ESM package である。`package.json` の `"type": "module"`、`exports`、ES Modules の class 実装を正解とする。

Pure ESM 移行より前の pull request は、当時の package structure の記録である。新しい package のディレクトリ構成、module 形式、export の書き方に使わない。構成を決めるときは、[packages/hello-world/](../../../packages/hello-world/) と、同じ種類の現行 driver を見る。

## 基本 workflow

### 1. 作業種別を決める

- 新しいディレクトリを `packages/` に足すなら、新規 driver
- 既存 package の機能を足す、または互換のある振る舞い変更なら、既存 driver の変更
- 不具合を直すなら、bug fix
- 差分の妥当性を見るなら、review

種別が重なるときは、利用者から見える振る舞いの変化で分ける。不具合の修正は bug fix、新しい操作の追加は既存 driver の変更。

### 2. 現行のガイドを読む

作業種別に対応する文書を先に読む。

| 作業 | 現行ガイド |
| --- | --- |
| 新規 driver | [docs/contributing/add-driver.md](../../../docs/contributing/add-driver.md) |
| 既存 driver の変更、bug fix | [docs/contributing/fix-driver.md](../../../docs/contributing/fix-driver.md) |
| 実装の書き方 | [docs/contributing/coding-standards.md](../../../docs/contributing/coding-standards.md) |
| リポジトリ構成 | [docs/contributing/repository.md](../../../docs/contributing/repository.md) |
| ブランチとコミット | [docs/contributing/setup.md](../../../docs/contributing/setup.md) |
| review の基本ルール | [docs/contributing/getting-started.md](../../../docs/contributing/getting-started.md) |

`references/` に同じ主題のファイルがあるときは、そのファイルも読む。ファイルがまだ無い主題は、上表の現行ガイドを使う。historical pull request を読む場合も、上の「判断の優先順位」と「Pure ESM より前の pull request」に従う。

### 3. 種別に応じて進める

**新規 driver**

1. `feat/<デバイス名>` ブランチを作る
2. [packages/hello-world/](../../../packages/hello-world/) をコピーして package を作る
3. 同種の現行 package を見て public API を決める
4. `package.json`、`index.js`、`README.md` を更新する
5. Prettier を実行し、リポジトリルートで `npm install` して lockfile を更新する

**既存 driver の変更**

1. 対象 package と公開 API を確認する
2. 互換を保つ変更は MINOR、互換を壊す変更は MAJOR として `package.json` の `version` を上げる
3. 振る舞いが変わるときは、その package の README を更新する

**bug fix**

1. 再現条件、期待する動作、実際の動作を確認する
2. 修正は当該 package に限定する
3. 後方互換の修正として PATCH の `version` を上げる

**review**

1. 差分が依頼された package と、その変更に必要な metadata に収まっているかを見る
2. public API、async、エラーメッセージ、README が現行の [coding-standards.md](../../../docs/contributing/coding-standards.md) に沿っているかを見る
3. 詳細な review checklist は `references/` に追加され次第、そのファイルを使う

### 4. 変更を Conventional Commits で残す

ブランチ名は `type/short-description`。コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従う。

## references

`references/` は後続の変更で repository knowledge を置く場所である。このディレクトリのファイルは、SKILL.md から 1 階層で参照する。
