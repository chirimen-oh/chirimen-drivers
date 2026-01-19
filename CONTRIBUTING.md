{% include translate.md %}

# Contributing Guidelines

[CHIRIMEN Drivers](https://github.com/chirimen-oh/chirimen-drivers) へのコントリビュート方法です。

## 目次

- [行動規範](#行動規範)
- [Issues と Pull Request](#issues-と-pull-request)
- [プロジェクト構成](#プロジェクト構成)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [初めての貢献：ドキュメント修正](#初めての貢献ドキュメント修正)
- [新しいドライバの追加：完全ガイド](#新しいドライバの追加完全ガイド)
- [既存ドライバの修正方法](#既存ドライバの修正方法)
- [リリース方法](#リリース方法)
- [コーディング規約](#コーディング規約)
- [テストについて](#テストについて)
- [質問・相談](#質問相談)
- [参考リンク](#参考リンク)
- [よくある質問](#よくある質問)

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

## プロジェクト構成

このリポジトリは [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) と [Lerna](https://lerna.js.org/) で管理される **monorepo** です。複数の CHIRIMEN ドライバパッケージを一つのリポジトリで管理しています。

### ファイル構造

```
/
├── LICENSE
├── CONTRIBUTING.md # このドキュメント
├── README.md # プロジェクトのトップページ
├── .github/workflows/ # GitHub Actions ワークフロー
│ ├── ci.yml # CI (npm ci の実行)
│ └── release.yml # リリース自動化
├── examples/ # ドキュメント用のMarkdownファイル
├── raspi-examples/ # CHIRIMEN for Raspberry Pi ブラウザ用サンプルコード
├── microbit-examples/ # CHIRIMEN with micro:bit 用サンプルコード
├── node-examples/ # Node.js 用サンプルコード
│ └── adt7410/ # 各ドライバのサンプル
│ ├── main.js
│ └── package.json
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

### 必要なツール

- **Node.js** (LTS バージョン推奨 - 現在 v20 以上)
- **npm** (Node.js に同梱)
- **Git**

### 初期セットアップ手順

**ステップ 1**: GitHub でリポジトリをフォークする

1. [chirimen-drivers リポジトリ](https://github.com/chirimen-oh/chirimen-drivers) にアクセス
2. 右上の「Fork」ボタンをクリック
3. あなたのアカウントにフォークされます

**ステップ 2**: ローカルにクローンする

```bash
# あなたのフォークをクローン
git clone https://github.com/YOUR_USERNAME/chirimen-drivers.git

# ディレクトリに移動
cd chirimen-drivers
```

**ステップ 3**: 依存関係をインストールする

```bash
# すべてのworkspaceパッケージの依存関係をインストール
npm ci
```

これで開発環境の準備が完了です！

**ステップ 4**: オリジナルリポジトリをリモートに追加（オプション）

```bash
# 最新の変更を取得するため
git remote add upstream https://github.com/chirimen-oh/chirimen-drivers.git

# 確認
git remote -v
```

## 初めての貢献：ドキュメント修正

ドキュメントの誤字や文言の変更など軽微な修正は、GitHub 上で直接編集して Pull Request を送ることができます。

### GitHub UI で編集する方法

1. 修正したいファイルを GitHub で開く
2. 右上の鉛筆アイコン（Edit this file）をクリック
3. 変更を加える
4. 下部の「Propose changes」をクリック
5. 「Create pull request」をクリック

詳しくは[リポジトリのファイルを編集する](https://help.github.com/ja/github/managing-files-in-a-repository/editing-files-in-your-repository)を参照してください。

### Git を使った修正方法

```bash
# 新しいブランチを作成
git checkout -b fix-typo-in-readme

# ファイルを編集
# (あなたの好きなエディタで編集)

# 変更をステージング
git add README.md

# コミット
git commit -m "docs: fix typo in README"

# あなたのフォークにプッシュ
git push origin fix-typo-in-readme

# GitHubでPull Requestを作成
```

## 新しいドライバの追加：完全ガイド

新しい I2C デバイスのドライバを追加する完全な手順を説明します。

### 例：BME280 センサードライバを追加する場合

このガイドでは、架空の「BME280」センサーのドライバを追加する例で説明します。

---

### ステップ 1: ブランチを作成する

```bash

# masterブランチから最新の状態で新しいブランチを作成

git checkout master
git pull upstream master # upstreamを追加している場合
git checkout -b add-bme280-driver
```

---

### ステップ 2: パッケージディレクトリを作成する

```bash

# packagesディレクトリ内に新しいドライバ用のディレクトリを作成

mkdir packages/bme280
cd packages/bme280
```

**命名規則**: デバイスの型番を小文字にしたもの（例: `adt7410`, `bme280`, `mpu6050`）

---

### ステップ 3: package.json を作成する

`packages/bme280/package.json` を以下の内容で作成します:

```json
{
  "name": "@chirimen/bme280",
  "description": "CHIRIMEN driver for BME280 temperature, humidity and pressure sensor",
  "version": "1.0.0",
  "license": "MIT",
  "type": "module",
  "exports": "./index.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/chirimen-oh/chirimen-drivers.git",
    "directory": "packages/bme280"
  },
  "keywords": [
    "CHIRIMEN",
    "IoT",
    "I2C",
    "sensor",
    "BME280",
    "temperature",
    "humidity",
    "pressure"
  ],
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "node-web-i2c": "^1.1.51"
  }
}
```

**重要なフィールド:**

- `name`: 必ず `@chirimen/` で始める
- `description`: センサーの機能を簡潔に説明
- `version`: 初版は `1.0.0` から開始
- `type`: `"module"` を指定（ES Modules を使用）
- `exports`: エントリーポイント（通常は `"./index.js"`）
- `repository.directory`: パッケージのパス
- `peerDependencies`: `node-web-i2c` を指定（I2C 通信に必要）

---

### ステップ 4: ドライバコード (index.js) を作成する

`packages/bme280/index.js` を作成します。実際の実装例は `packages/adt7410/index.js` を参考にしてください。

基本的な構造:

```javascript
// @ts-check

class BME280 {
  constructor(i2cPort, slaveAddress = 0x76) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }

  async init() {
    this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    // センサーの初期化処理をここに記述
  }

  async read() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not initialized. Call init() first.");
    }
    // データ読み取り処理をここに記述
    return { temperature: 0, humidity: 0, pressure: 0 };
  }
}

export default BME280;
```

**実装のポイント:**

1. **クラスベースの設計**: ES6 クラスを使用
2. **コンストラクタ**: I2C ポートとアドレスを受け取る
3. **init() メソッド**: センサーの初期化処理
4. **read() メソッド**: データ読み取り
5. **エラーハンドリング**: 適切なエラーメッセージ
6. **非同期処理**: async/await を使用

---

### ステップ 5: README.md を作成する

`packages/bme280/README.md` を作成します。`packages/adt7410/README.md` を参考に、以下の内容を含めます:

- センサーの仕様
- インストール方法
- 使い方（サンプルコード）
- API リファレンス
- 参考リンク（データシートなど）

---

### ステップ 6: サンプルコードを作成する（推奨）

`node-examples/bme280/` ディレクトリにサンプルコードを追加します:

```bash
mkdir -p node-examples/bme280
```

`node-examples/bme280/package.json`:

```json
{
  "name": "bme280-example",
  "private": true,
  "type": "module",
  "dependencies": {
    "@chirimen/bme280": "*",
    "node-web-i2c": "^1.1.51"
  }
}
```

`node-examples/bme280/main.js`:

```javascript
import { requestI2CAccess } from "node-web-i2c";
import BME280 from "@chirimen/bme280";

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const bme280 = new BME280(port, 0x76);
  await bme280.init();

  while (true) {
    const data = await bme280.read();
    console.log(`Temperature: ${data.temperature.toFixed(2)}℃`);
    await sleep(1000);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
```

---

### ステップ 7: コードをフォーマットする

```bash

# ルートディレクトリに戻る

cd /path/to/chirimen-drivers

# Prettierでフォーマット

npx prettier --write packages/bme280/
npx prettier --write node-examples/bme280/
```

---

### ステップ 8: 動作確認する

実際のハードウェアがある場合は動作確認を行います:(optional)

```bash
cd node-examples/bme280
npm install
node main.js
```

---

### ステップ 9A: package-lock.jsonを更新する

package-lock.jsonを更新します:

```bash
# ルートディレクトリに戻る

cd /path/to/chirimen-drivers

# npm installする
npm install
```

---

### ステップ 9B: 変更をコミットする

```bash
# すべての変更をステージング
git add packages/bme280/
git add node-examples/bme280/

# コミット
git commit -m "feat: add BME280 sensor driver

- Add BME280 I2C driver for temperature, humidity and pressure
- Add comprehensive README with API documentation
- Add Node.js example code
- Support I2C addresses 0x76 and 0x77"

# あなたのフォークにプッシュ
git push origin add-bme280-driver
```

**コミットメッセージの規約:**

- `feat:` - 新機能追加
- `fix:` - バグ修正
- `docs:` - ドキュメントのみの変更
- `refactor:` - リファクタリング

---

### ステップ 10: Pull Request を作成する

1. GitHub であなたのフォークを開く
2. 「Compare & pull request」ボタンをクリック
3. タイトルと説明を記入
4. 「Create pull request」をクリック

---

## 既存ドライバの修正方法

既存のドライバにバグ修正や機能追加を行う場合の手順です。

### バグ修正の例

**ステップ 1**: Issue を確認または作成

既存の Issue がない場合は、まず Issue を作成して問題を報告します。

**ステップ 2**: ブランチを作成

```bash
git checkout master
git pull upstream master
git checkout -b fix-adt7410-negative-temperature
```

**ステップ 3**: コードを修正

```bash
# ファイルを編集
vim packages/adt7410/index.js
```

**ステップ 4**: 変更をコミット

```bash
git add packages/adt7410/
git commit -m "fix(adt7410): fix negative temperature calculation

Fixes #123"
```

**ステップ 5**: バージョンを更新

`packages/adt7410/package.json` の `version` を更新:

- バグ修正: PATCH バージョンを上げる（例: `2.0.0` → `2.0.1`）

**ステップ 6**: Push と PR 作成

```bash
git push origin fix-adt7410-negative-temperature
```

GitHub で Pull Request を作成します。

## コーディング規約

### 必須事項

- **ES Modules を使用**: `type: "module"` を package.json に記述
- **クラスベースの実装**: センサードライバはクラスとして実装
- **非同期処理**: `async/await` を使用（Promise も可）
- **エラーハンドリング**: 適切なエラーメッセージを含める

### 推奨事項

- **型注釈**: JSDoc で型情報を記述
- **わかりやすい命名**: 変数名・関数名は英語で明確に
- **コメント**: 複雑なロジックには説明を追加
- **フォーマット**: Prettier を使用（スペース 2 個）

### コードフォーマット

プロジェクトには Prettier が設定されています:

```bash
# 自動フォーマット
npx prettier --write packages/your-driver/
```

## テストについて

現在、このプロジェクトには自動テストの仕組みはありません。

**推奨される動作確認方法:**

1. 実際のハードウェアで動作確認
2. サンプルコードが正しく動作することを確認
3. 異常系（センサー未接続など）の動作確認

## リリース方法

### バージョン管理の仕組み

このプロジェクトは Lerna の **`independent` モード**を使用しており、各パッケージが独立したバージョン番号を持ちます。

### バージョンの更新方法

**手動で** 各パッケージの `package.json` の `version` フィールドを編集します:

```json
{
  "name": "@chirimen/your-device-name",
  "version": "1.0.1"
}
```

### バージョニングの指針（セマンティックバージョニング）

- **MAJOR (1.0.0 → 2.0.0)**: 後方互換性のない変更
- **MINOR (1.0.0 → 1.1.0)**: 後方互換性のある機能追加
- **PATCH (1.0.0 → 1.0.1)**: 後方互換性のあるバグ修正

### 自動リリースの流れ

1. package.json の version を更新
2. 変更を commit して master ブランチに push（または PR をマージ）
3. GitHub Actions が自動的に npm へパッケージを公開

GitHub Actions のワークフロー ([.github/workflows/release.yml](.github/workflows/release.yml)) が以下を実行します:

1. README の更新（自動）
2. `lerna publish from-package` の実行
3. バージョンが更新されたパッケージのみ npm に公開

### 公開の確認

**npm での確認:**

`https://www.npmjs.com/package/{パッケージ名}`

例: https://www.npmjs.com/package/@chirimen/hello-world

## よくある質問

### Q1. 新しいパッケージを追加したのに npm に公開されない

**A.** 以下を確認してください:

1. `package.json` の `name` が `@chirimen/` で始まっているか
2. `publishConfig.access` が `"public"` に設定されているか
3. `version` フィールドが正しく設定されているか
4. PR がマージされて master ブランチに反映されているか
5. [GitHub Actions のログ](https://github.com/chirimen-oh/chirimen-drivers/actions)でエラーが出ていないか

### Q2. monorepo の依存関係はどう管理するか

**A.** ルートディレクトリで `npm ci` を実行すれば、すべての workspace パッケージの依存関係が自動的にインストールされます。

### Q3. Lerna のコマンドを使う必要があるか

**A.** 通常の開発では不要です。リリースは GitHub Actions が自動的に行います。

### Q4. 既存のドライバを参考にしたい

**A.** 以下のドライバが参考になります:

- **シンプルな例**: `packages/hello-world/` - 最小構成
- **実用的な例**: `packages/adt7410/` - 温度センサー
- **複雑な例**: `packages/amg8833/` - 赤外線アレイセンサー

### Q5. I2C 以外のデバイス（GPIO、SPI など）のドライバも追加できますか

**A.** はい、可能です。このリポジトリは主に I2C デバイスを扱っていますが、GPIO や SPI を使用するドライバも歓迎します。

### Q6. ドキュメントは日本語で書くべきですか

**A.** README は日本語で記述することを推奨します。コード内のコメントやコミットメッセージは英語でも日本語でも構いません。

## 質問・相談

不明点があれば、お気軽に [Issue](https://github.com/chirimen-oh/chirimen-drivers/issues) を作成してください。

## 参考リンク

- [CHIRIMEN 公式サイト](https://chirimen.org/)
- [npm workspaces ドキュメント](https://docs.npmjs.com/cli/using-npm/workspaces)
- [Lerna ドキュメント](https://lerna.js.org/)
- [セマンティックバージョニング](https://semver.org/lang/ja/)
