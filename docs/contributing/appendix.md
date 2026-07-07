# 付録

## package.json テンプレート（I2C ドライバ）

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

## index.js の基本構造（I2C ドライバ）

[packages/adt7410/index.js](../../packages/adt7410/index.js) を参考に、以下のパターンで実装します。

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

## Conventional Commits の具体例

```
feat: add example-sensor driver
fix(adt7410): fix negative temperature calculation
docs: fix typo in README
refactor(bme280): simplify init logic
```

Issue を閉じる場合はコミット本文に `Fixes #123` を記載します。

[← 目次に戻る](../../CONTRIBUTING.md)
