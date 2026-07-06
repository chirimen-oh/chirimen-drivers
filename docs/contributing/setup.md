# 開発環境のセットアップ

コードの変更を行う前に、以下の手順で環境を整えます。

## 必要なツール

- **Node.js** (LTS バージョン推奨)
- **npm** (Node.js に同梱)
- **Git**

## 初期セットアップ

1. **フォーク:** [chirimen-drivers リポジトリ](https://github.com/chirimen-oh/chirimen-drivers) の右上「Fork」ボタンで、自分のアカウントにコピーを作成
2. **クローン:** フォークしたリポジトリをローカルに取得

```bash
git clone https://github.com/YOUR_USERNAME/chirimen-drivers.git
cd chirimen-drivers
```

3. **依存関係のインストール:** ルートディレクトリで実行（すべての workspace パッケージが対象）

```bash
npm ci
```

4. **upstream の追加（推奨）:** 本家リポジトリの最新変更を取り込むため

```bash
git remote add upstream https://github.com/chirimen-oh/chirimen-drivers.git
git remote -v
```

## 共通の Git ワークフロー

ドキュメント修正・ドライバ修正・新規追加など、コード変更の PR はすべて以下の流れに従います。

**1. 最新の master を取得してブランチを作成**

```bash
git checkout master
git pull upstream master   # upstream を追加している場合
git checkout -b type/short-description
```

**ブランチ名の例:**

| 変更内容               | ブランチ名の例            |
| ---------------------- | ------------------------- |
| README の誤字修正      | `docs/fix-readme-typo`    |
| 新ドライバ追加         | `feat/example-sensor`     |
| 既存ドライバのバグ修正 | `fix/adt7410-temperature` |

**2. 変更を加えてコミット**

```bash
git add <変更したファイル>
git commit -m "type: short description"
```

**コミットメッセージの形式（[Conventional Commits](https://www.conventionalcommits.org/)）:**

| プレフィックス | 用途                     | 例                                                   |
| -------------- | ------------------------ | ---------------------------------------------------- |
| `feat:`        | 新機能・新ドライバ追加   | `feat: add example-sensor driver`                    |
| `fix:`         | バグ修正                 | `fix(adt7410): fix negative temperature calculation` |
| `docs:`        | ドキュメントのみの変更   | `docs: fix typo in README`                           |
| `refactor:`    | 動作を変えないコード整理 | `refactor(bme280): simplify init logic`              |

**3. フォークにプッシュして PR を作成**

```bash
git push origin type/short-description
```

GitHub でフォークを開き、「Compare & pull request」から PR を作成します。タイトルと説明に変更内容・動作確認結果を記載してください。

[← 目次に戻る](../../CONTRIBUTING.md)
