{% include translate.md %}

# Contributing Guidelines

[CHIRIMEN Drivers](https://github.com/chirimen-oh/chirimen-drivers) へのコントリビュート方法です。

## はじめに

このリポジトリは、[CHIRIMEN](https://chirimen.org/) で使う IoT デバイスドライバをまとめた **monorepo**（複数パッケージを一つのリポジトリで管理する構成）です。60 個以上のセンサーやモジュール用ドライバが `packages/` 以下にあり、それぞれが npm パッケージ（`@chirimen/デバイス名`）として公開されています。

**このガイドの読み方:** まず [貢献の種類と手順の選び方](#貢献の種類と手順の選び方) で自分の目的に合ったセクションを選び、初めての方は [初めての貢献：ドキュメント修正](#初めての貢献ドキュメント修正) から始めることをおすすめします。

## 目次

- [貢献の種類と手順の選び方](#貢献の種類と手順の選び方)
- [行動規範](#行動規範)
- [Issues と Pull Request](#issues-と-pull-request)
- [このリポジトリのしくみ](#このリポジトリのしくみ)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [初めての貢献：ドキュメント修正](#初めての貢献ドキュメント修正)
- [既存ドライバの修正](#既存ドライバの修正)
- [新しいドライバの追加](#新しいドライバの追加)
- [コーディング規約](#コーディング規約)
- [テストについて](#テストについて)
- [リリース方法](#リリース方法)
- [よくある質問](#よくある質問)
- [質問・相談](#質問相談)
- [参考リンク](#参考リンク)
- [付録](#付録)

## 貢献の種類と手順の選び方

やりたいことに合わせて、読むべきセクションを選んでください。

| やりたいこと | 読むセクション | 難易度 |
| --- | --- | --- |
| 誤字・文言の修正（Git 不要） | [初めての貢献：ドキュメント修正](#初めての貢献ドキュメント修正) の GitHub UI 編集 | 初級 |
| ドキュメント修正（Git 使用） | [開発環境のセットアップ](#開発環境のセットアップ) → [初めての貢献：ドキュメント修正](#初めての貢献ドキュメント修正) | 初級 |
| 既存ドライバのバグ修正・機能追加 | [開発環境のセットアップ](#開発環境のセットアップ) → [既存ドライバの修正](#既存ドライバの修正) | 中級 |
| 新しいドライバの追加 | [開発環境のセットアップ](#開発環境のセットアップ) → [新しいドライバの追加](#新しいドライバの追加) | 中級〜上級 |
| npm への公開・リリース（メンテナ向け） | [リリース方法](#リリース方法) | 上級 |

初めてコントリビュートする方は、まず小さなドキュメント修正から Pull Request を送ると、フォーク・ブランチ・PR の流れを体験できます。

## 行動規範

[コントリビューター行動規範 - Contributor Covenant](https://www.contributor-covenant.org/ja/version/1/4/code-of-conduct)

行動規範に反するコントリビュートは受け入れません。

## Issues と Pull Request

### Issues

質問、バグ、提案、その他 Issue を歓迎します。

- **バグ報告**: 再現手順、期待する動作、実際の動作を記載してください
- **機能提案**: 具体的なユースケースと共に提案してください
- **質問**: 遠慮なくお尋ねください

### Pull Request

ドキュメント追加、モジュール追加、バグ修正、その他改善するための Pull Request を歓迎します。

**PR を送るときの基本ルール:**

- ブランチ名は `type/short-description` 形式（例: `docs/fix-readme-typo`, `feat/example-sensor`）
- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org/) に準拠（`feat:`, `fix:`, `docs:` など）
- 変更内容と動作確認の結果を PR 説明に記載してください

詳細は [共通の Git ワークフロー](#共通の-git-ワークフロー) を参照してください。

## このリポジトリのしくみ

このリポジトリは [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) と [Lerna](https://lerna.js.org/) で管理される **monorepo** です。複数の CHIRIMEN ドライバパッケージを一つのリポジトリで管理しています。

**monorepo とは:** 通常はパッケージごとにリポジトリを分けますが、ここでは 60 個以上のドライバを `packages/` 以下にまとめています。ルートで `npm ci` を実行すると、すべてのパッケージの依存関係が一括でインストールされます。

**パッケージの命名:** 各ドライバは `@chirimen/デバイス名` という npm パッケージ名で公開されます（例: `@chirimen/adt7410`）。ディレクトリ名はデバイス型番の小文字（例: `adt7410`, `mpu6050`）にします。

**バージョン管理:** Lerna の **independent** モードを使っており、各パッケージが独立したバージョン番号を持ちます。あるドライバだけを更新しても、他のドライバのバージョンには影響しません。

**I2C 通信:** 多くのドライバは I2C バス経由でセンサーと通信します。ブラウザや Node.js 環境では [`node-web-i2c`](https://www.npmjs.com/package/node-web-i2c) を通じて I2C にアクセスします。I2C ドライバの `package.json` には `peerDependencies` として `node-web-i2c` を指定します。

### ファイル構造

```
/
├── LICENSE
├── CONTRIBUTING.md # このドキュメント
├── README.md # プロジェクトのトップページ
├── .github/workflows/ # GitHub Actions ワークフロー
│ ├── ci.yml # CI (npm ci の実行)
│ └── release.yml # リリース自動化
├── microbit-examples/ # CHIRIMEN with micro:bit 用サンプルコード
├── lerna.json # Lerna 設定ファイル
├── package.json # ルート package.json (workspaces 設定)
└── packages/ # ドライバモジュールのソースコード
├── hello-world/ # サンプルドライバ
├── adt7410/ # 温度センサー (ADT7410)
│ ├── index.js # ドライバ本体
│ ├── package.json # パッケージ設定
│ └── README.md # ドライバのドキュメント
├── amg8833/ # 赤外線アレイセンサー
└── ... # その他60個以上のドライバ
```

## 開発環境のセットアップ

コードの変更を行う前に、以下の手順で環境を整えます。

### 必要なツール

- **Node.js** (LTS バージョン推奨 — 現在 v20 以上)
- **npm** (Node.js に同梱)
- **Git**

### 初期セットアップ

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

### 共通の Git ワークフロー

ドキュメント修正・ドライバ修正・新規追加など、コード変更の PR はすべて以下の流れに従います。

**1. 最新の master を取得してブランチを作成**

```bash
git checkout master
git pull upstream master   # upstream を追加している場合
git checkout -b type/short-description
```

**ブランチ名の例:**

| 変更内容 | ブランチ名の例 |
| --- | --- |
| README の誤字修正 | `docs/fix-readme-typo` |
| 新ドライバ追加 | `feat/example-sensor` |
| 既存ドライバのバグ修正 | `fix/adt7410-temperature` |

**2. 変更を加えてコミット**

```bash
git add <変更したファイル>
git commit -m "type: short description"
```

**コミットメッセージの形式（[Conventional Commits](https://www.conventionalcommits.org/)）:**

| プレフィックス | 用途 | 例 |
| --- | --- | --- |
| `feat:` | 新機能・新ドライバ追加 | `feat: add example-sensor driver` |
| `fix:` | バグ修正 | `fix(adt7410): fix negative temperature calculation` |
| `docs:` | ドキュメントのみの変更 | `docs: fix typo in README` |
| `refactor:` | 動作を変えないコード整理 | `refactor(bme280): simplify init logic` |

**3. フォークにプッシュして PR を作成**

```bash
git push origin type/short-description
```

GitHub でフォークを開き、「Compare & pull request」から PR を作成します。タイトルと説明に変更内容・動作確認結果を記載してください。

## 初めての貢献：ドキュメント修正

誤字や文言の変更など、軽微なドキュメント修正から始めるのがおすすめです。

### チェックリスト

- [ ] 修正対象のファイルを特定する
- [ ] 変更を加える（GitHub UI または Git）
- [ ] Pull Request を作成する

### 方法 A: GitHub 上で直接編集（Git 不要）

1. 修正したいファイルを GitHub で開く
2. 右上の鉛筆アイコン（Edit this file）をクリック
3. 変更を加える
4. 下部の「Propose changes」をクリック
5. 「Create pull request」をクリック

詳しくは [リポジトリのファイルを編集する](https://help.github.com/ja/github/managing-files-in-a-repository/editing-files-in-your-repository) を参照してください。

### 方法 B: Git を使う

[共通の Git ワークフロー](#共通の-git-ワークフロー) に従い、以下の例のように進めます。

```bash
git checkout -b docs/fix-readme-typo
# ファイルを編集
git add README.md
git commit -m "docs: fix typo in README"
git push origin docs/fix-readme-typo
# GitHub で Pull Request を作成
```

## 既存ドライバの修正

既存のドライバにバグ修正や機能追加を行う場合の手順です。新ドライバの追加より先に読むと、リポジトリの構造に慣れやすくなります。

### チェックリスト

- [ ] Issue を確認または作成する
- [ ] ブランチを作成する（[共通の Git ワークフロー](#共通の-git-ワークフロー)）
- [ ] `packages/<ドライバ名>/` のコードを修正する
- [ ] Prettier でフォーマットする
- [ ] `package.json` の `version` を更新する
- [ ] コミットして PR を作成する

### 手順の詳細

**1. Issue の確認**

既存の Issue がない場合は、まず [Issue](https://github.com/chirimen-oh/chirimen-drivers/issues) を作成して問題を報告します。

**2. ブランチの作成**

```bash
git checkout master
git pull upstream master
git checkout -b fix/adt7410-negative-temperature
```

**3. コードの修正とフォーマット**

```bash
# ファイルを編集（例）
vim packages/adt7410/index.js

# フォーマット
npx prettier --write packages/adt7410/
```

**4. バージョンの更新**

`packages/<ドライバ名>/package.json` の `version` を、[セマンティックバージョニング](https://semver.org/lang/ja/) に従って更新します。

| 変更の種類 | バージョンの上げ方 | 例 |
| --- | --- | --- |
| バグ修正（後方互換） | PATCH | `2.0.0` → `2.0.1` |
| 機能追加（後方互換） | MINOR | `2.0.0` → `2.1.0` |
| 破壊的変更 | MAJOR | `2.0.0` → `3.0.0` |

**5. コミットと PR**

```bash
git add packages/adt7410/
git commit -m "fix(adt7410): fix negative temperature calculation

Fixes #123"
git push origin fix/adt7410-negative-temperature
```

GitHub で Pull Request を作成します。

## 新しいドライバの追加

新しい I2C デバイス（や GPIO・SPI デバイス）のドライバを追加する手順です。

### チェックリスト

- [ ] ブランチを作成する（`feat/<デバイス名>`）
- [ ] `packages/hello-world` をコピーして新パッケージを作成する
- [ ] `package.json` / `index.js` / `README.md` を編集する
- [ ] Prettier でフォーマットする
- [ ] （任意）ハードウェアで動作確認する
- [ ] ルートで `npm install` して `package-lock.json` を更新する
- [ ] コミットして PR を作成する

### 手順の詳細

**1. ブランチの作成**

[共通の Git ワークフロー](#共通の-git-ワークフロー) に従い、ブランチ名は `feat/<デバイス名>` とします。

```bash
git checkout master
git pull upstream master
git checkout -b feat/example-sensor
```

**2. テンプレートからパッケージを作成**

[packages/hello-world/](packages/hello-world/) が最小構成のテンプレートです。これをコピーして新しいディレクトリを作ります。

```bash
cp -r packages/hello-world packages/example-sensor
```

ディレクトリ名はデバイス型番の小文字（例: `adt7410`, `mpu6050`）にします。

**3. ファイルの編集**

| ファイル | やること |
| --- | --- |
| `package.json` | `name`, `description`, `version`, `repository.directory` を更新。I2C ドライバなら `peerDependencies` に `node-web-i2c` を追加 |
| `index.js` | センサーの読み取りロジックをクラスとして実装 |
| `README.md` | 仕様・使い方・API リファレンスを記述（日本語推奨） |

`package.json` と `index.js` のテンプレートは [付録](#付録) を参照してください。

**実装の参考ドライバ:**

| 難易度 | パッケージ | 特徴 |
| --- | --- | --- |
| 最小構成 | [packages/hello-world/](packages/hello-world/) | パッケージ構造の雛形 |
| シンプル | [packages/adt7410/](packages/adt7410/) | I2C 温度センサー |
| 複雑 | [packages/amg8833/](packages/amg8833/) | 赤外線アレイセンサー |

**4. フォーマット**

```bash
npx prettier --write packages/example-sensor/
```

**5. 動作確認（任意）**

ハードウェアがある場合、ローカルパッケージを直接インストールして確認できます。

```bash
mkdir tmp-check && cd tmp-check
npm init -y
npm install ../packages/example-sensor node-web-i2c
```

`tmp-check/package.json` に `"type": "module"` を追記し、サンプルコードを実行します。確認後は `tmp-check/` を削除してください（コミット不要）。

**6. package-lock.json の更新**

新パッケージを workspace に追加したため、ルートで以下を実行します。

```bash
cd /path/to/chirimen-drivers
npm install
```

**7. コミットと PR**

```bash
git add packages/example-sensor/ package-lock.json
git commit -m "feat: add example-sensor driver"
git push origin feat/example-sensor
```

[共通の Git ワークフロー](#共通の-git-ワークフロー) に従い、GitHub で Pull Request を作成します。PR がマージされると、GitHub Actions が自動的に npm へ公開します。

## コーディング規約

ドライバ実装時は以下の規約に従ってください。具体例は [付録](#付録) の `index.js` テンプレートと [packages/adt7410/](packages/adt7410/) を参照してください。

### 必須

| ルール | 説明 |
| --- | --- |
| ES Modules | `package.json` に `"type": "module"` を記述 |
| クラスベース | センサードライバは ES6 クラスとして実装 |
| 非同期処理 | `async/await` を使用（`init()`, `read()` など） |
| エラーハンドリング | 未初期化時など、わかりやすいエラーメッセージを返す |
| I2C の初期化 | コンストラクタでポートとアドレスを受け取り、`init()` で `i2cPort.open()` を呼ぶ |

### 推奨

- **JSDoc**: 型情報を記述（`@param`, `@returns` など）
- **命名**: 変数名・関数名は英語で明確に
- **コメント**: 複雑なロジック（レジスタ操作など）に説明を追加
- **フォーマット**: Prettier を使用（スペース 2 個）

```bash
npx prettier --write packages/your-driver/
```

## テストについて

現在、このプロジェクトには自動テストの仕組みはありません。以下の方法で動作確認を行ってください。

1. 実際のハードウェアで動作確認
2. サンプルコードが正しく動作することを確認
3. 異常系（センサー未接続など）の動作確認

## リリース方法

> **一般のコントリビュータ向け:** PR が master にマージされると、GitHub Actions が自動的に npm へパッケージを公開します。手動でリリース作業を行う必要はありません。

以下は、バージョン管理の仕組みを理解したい方・メンテナ向けの説明です。

### バージョン管理の仕組み

各パッケージは Lerna の **independent** モードで独立したバージョン番号を持ちます（[このリポジトリのしくみ](#このリポジトリのしくみ) 参照）。バージョンの更新は、各パッケージの `package.json` を手動で編集します。

```json
{
  "name": "@chirimen/your-device-name",
  "version": "1.0.1"
}
```

### バージョニングの指針

| 種類 | 例 | いつ使うか |
| --- | --- | --- |
| PATCH | `1.0.0` → `1.0.1` | バグ修正（後方互換） |
| MINOR | `1.0.0` → `1.1.0` | 機能追加（後方互換） |
| MAJOR | `1.0.0` → `2.0.0` | 破壊的変更 |

詳細は [セマンティックバージョニング](https://semver.org/lang/ja/) を参照してください。

### 自動リリースの流れ

1. `package.json` の `version` を更新して PR をマージ
2. GitHub Actions（[.github/workflows/release.yml](.github/workflows/release.yml)）が起動
3. README の更新、`lerna publish from-package` の実行
4. バージョンが更新されたパッケージのみ npm に公開

### 公開の確認

`https://www.npmjs.com/package/{パッケージ名}`（例: https://www.npmjs.com/package/@chirimen/hello-world）

## よくある質問

### Q1. 新しいパッケージを追加したのに npm に公開されない

以下を確認してください:

1. `package.json` の `name` が `@chirimen/` で始まっているか
2. `publishConfig.access` が `"public"` に設定されているか
3. `version` が `1.0.0` など正しく設定されているか
4. PR が master にマージされているか
5. [GitHub Actions のログ](https://github.com/chirimen-oh/chirimen-drivers/actions) にエラーがないか

### Q2. monorepo の依存関係はどう管理するか

ルートディレクトリで `npm ci` を実行すれば、すべての workspace パッケージの依存関係が一括でインストールされます。

### Q3. Lerna のコマンドを使う必要があるか

通常の開発では不要です。リリースは GitHub Actions が自動的に行います。

### Q4. 既存のドライバを参考にしたい

[新しいドライバの追加](#新しいドライバの追加) の「実装の参考ドライバ」を参照してください。最小構成は `hello-world`、I2C センサーは `adt7410`、複雑な例は `amg8833` です。

### Q5. I2C 以外のデバイス（GPIO、SPI など）のドライバも追加できるか

はい、可能です。主に I2C デバイスを扱っていますが、GPIO や SPI のドライバも歓迎します。

### Q6. ドキュメントは日本語で書くべきか

README は日本語推奨です。コード内コメントやコミットメッセージは英語・日本語どちらでも構いません。

## 質問・相談

不明点があれば、お気軽に [Issue](https://github.com/chirimen-oh/chirimen-drivers/issues) を作成してください。どのセクションを読めばよいかわからない場合は、[貢献の種類と手順の選び方](#貢献の種類と手順の選び方) から始めてください。

## 参考リンク

- [CHIRIMEN 公式サイト](https://chirimen.org/)
- [npm workspaces ドキュメント](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Lerna ドキュメント](https://lerna.js.org/)
- [セマンティックバージョニング](https://semver.org/lang/ja/)

## 付録

### package.json テンプレート（I2C ドライバ）

`packages/<デバイス名>/package.json` の例です。`YOUR_DEVICE` と `your-device` を実際のデバイス名に置き換えてください。

```json
{
  "name": "@chirimen/your-device",
  "description": "CHIRIMEN driver for YOUR_DEVICE sensor",
  "version": "1.0.0",
  "license": "MIT",
  "type": "module",
  "exports": "./index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/chirimen-oh/chirimen-drivers.git",
    "directory": "packages/your-device"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "node-web-i2c": "^1.1.51"
  }
}
```

| フィールド | 説明 |
| --- | --- |
| `name` | 必ず `@chirimen/` で始める |
| `description` | センサーの機能を簡潔に説明 |
| `version` | 初版は `1.0.0` から開始 |
| `type` | `"module"` を指定（ES Modules） |
| `exports` | エントリーポイント（通常 `"./index.js"`） |
| `repository.directory` | パッケージのパス |
| `peerDependencies` | I2C ドライバは `node-web-i2c` を指定 |

### index.js の基本構造（I2C ドライバ）

[packages/adt7410/index.js](packages/adt7410/index.js) を参考に、以下のパターンで実装します。

```javascript
// @ts-check

class YourDevice {
  constructor(i2cPort, slaveAddress) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    // センサーの初期化処理
  }

  async read() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not initialized. Call init() first.");
    }
    // データ読み取り処理
    return {};
  }
}

export default YourDevice;
```

### Conventional Commits の具体例

```
feat: add example-sensor driver
fix(adt7410): fix negative temperature calculation
docs: fix typo in README
refactor(bme280): simplify init logic
```

Issue を閉じる場合はコミット本文に `Fixes #123` を記載します。
