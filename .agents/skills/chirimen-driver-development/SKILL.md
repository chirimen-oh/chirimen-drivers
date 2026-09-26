---
name: chirimen-driver-development
description: >-
  Guides CHIRIMEN driver additions, modifications, bug fixes, and reviews in
  chirimen-drivers. Use when adding a driver, changing a package under
  packages/, fixing a driver bug, reviewing a pull request, or when the user
  mentions chirimen-driver-development, ドライバ追加, ドライバ修正, or ドライバレビュー.
---

# CHIRIMEN driver development

`chirimen-oh/chirimen-drivers` でドライバを追加・変更・修正・レビューするときの入口。配置・目的・基本 workflow はここ、コアの repository knowledge は `references/` にある。

コア reference は、repository structure、新規 driver、既存 driver の変更、coding conventions の 4 本である。新規 package を利用者の import まで届ける確認は [references/package-integration.md](references/package-integration.md)、差分の確認項目は [references/review-checklist.md](references/review-checklist.md) にある。

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

| 作業 | 現行ガイド | reference |
| --- | --- | --- |
| 新規 driver | [docs/contributing/add-driver.md](../../../docs/contributing/add-driver.md) | [references/add-new-driver.md](references/add-new-driver.md) |
| package integration | 現行の [packages/chirimen/](../../../packages/chirimen/) | [references/package-integration.md](references/package-integration.md) |
| 既存 driver の変更、bug fix | [docs/contributing/fix-driver.md](../../../docs/contributing/fix-driver.md) | [references/modify-driver.md](references/modify-driver.md) |
| 実装の書き方 | [docs/contributing/coding-standards.md](../../../docs/contributing/coding-standards.md) | [references/coding-conventions.md](references/coding-conventions.md) |
| リポジトリ構成 | [docs/contributing/repository.md](../../../docs/contributing/repository.md) | [references/repository-structure.md](references/repository-structure.md) |
| ブランチとコミット | [docs/contributing/setup.md](../../../docs/contributing/setup.md) | 未追加 |
| review の基本ルール | [docs/contributing/getting-started.md](../../../docs/contributing/getting-started.md) | [references/review-checklist.md](references/review-checklist.md) |

reference がある作業は、現行ガイドとその reference の両方を読む。reference が無い主題は、現行ガイドを使う。historical pull request を読む場合も、上の「判断の優先順位」と「Pure ESM より前の pull request」に従う。

### 3. 種別に応じて進める

手順の全文は、種別に対応する reference にある。ここには入口と、完了とみなす状態だけを書く。

**新規 driver**

手順は [references/add-new-driver.md](references/add-new-driver.md)。利用者の import までは [references/package-integration.md](references/package-integration.md)。

個別 package（`index.js`、`package.json`、`README.md`）と、`chirimen` の dependency および re-export が揃っていること。

**既存 driver の変更**

手順は [references/modify-driver.md](references/modify-driver.md)。

互換を保つ変更は MINOR、互換を壊す変更は MAJOR。振る舞いが変わるときは、その package の README を同じ変更で更新する。

**bug fix**

手順は [references/modify-driver.md](references/modify-driver.md)。

当該 package に限定した後方互換の修正として PATCH を上げる。`chirimen` から import できない不具合は [references/package-integration.md](references/package-integration.md) に従い、re-export と `packages/chirimen` の PATCH で直す。

**review**

確認項目は [references/review-checklist.md](references/review-checklist.md)。

差分が依頼された package と必要な metadata に収まり、public API、async、README、package integration が現行の規約に沿っていること。

### 4. 変更を Conventional Commits で残す

ブランチ名は `type/short-description`。コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に従う。

## 利用方法

入口は `.agents/skills/chirimen-driver-development/SKILL.md` である。Cursor と Claude Code は、このリポジトリ内の Skill を読む。依頼文には `chirimen-driver-development` と作業種別（新規 driver、既存 driver の修正、review）を書く。

次の例は、日常のドライバ作業で Agent に渡す prompt である。Skill 自体を historical pull request で確認する prompt は [references/validation.md](references/validation.md) の Case 1–3 にある。

### 新規 driver

```text
新しい I2C driver を追加したい。
chirimen-driver-development Skill に従って、
最初に必要な変更箇所と実装計画を提示してください。
まだコードは変更しないでください。
```

### 既存 driver の修正

```text
既存の driver を修正したい。
chirimen-driver-development Skill に従って、
変更範囲、互換、README、version を含む実装計画を提示してください。
まだコードは変更しないでください。
```

### review

```text
この driver の変更を review してください。
chirimen-driver-development Skill の review checklist を使用し、
public API、async behavior、package integration、documentation の観点を確認してください。
```

日常のドライバ追加、修正、review では [references/validation.md](references/validation.md) を読まない。Skill 自体が現行の開発パターンを再現できるかを確認するときだけ読む。実施結果は同ファイルの「実施結果」にある。expected checklist から落ちた項目は無く、reference への追記も無い。

## references

このディレクトリのファイルは、SKILL.md から 1 階層で参照する。

- [references/repository-structure.md](references/repository-structure.md) — 現行の package 構成と、historical pull request を読むときの注意
- [references/add-new-driver.md](references/add-new-driver.md) — 類似 driver の調査、package 作成、public API、README、確認
- [references/modify-driver.md](references/modify-driver.md) — API の互換、bug fix と機能変更、README、version
- [references/coding-conventions.md](references/coding-conventions.md) — 命名、private、async、timeout、定数
- [references/package-integration.md](references/package-integration.md) — driver package から `chirimen` の public export、lockfile、version まで
- [references/review-checklist.md](references/review-checklist.md) — API の境界、定数、timeout、エラー、export 漏れ、無関係な差分
- [references/validation.md](references/validation.md) — historical pull request を使った再現の確認と、不足の戻し方
