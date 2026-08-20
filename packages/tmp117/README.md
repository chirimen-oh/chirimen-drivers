[データシート]: https://www.ti.com/lit/ds/symlink/tmp117.pdf

# TMP117

## センサー仕様

- 動作・測定可能温度
  - -55℃ ～+150℃
- 温度精度
  - ±0.1℃ (-20℃ ～+50℃ の環境下)
- 温度解像度
  - 0.0078125℃
- I2C スレーブアドレス
  - 0x48(デフォルト), 0x49, 0x4A, 0x4B（ADD0ピンの配線により変更可能。詳しくは[データシート][]を参照）

詳細な仕様は[データシート][]を参照してください。（Texas Instruments社のサイトにリンクします。）

## ドライバ

### 初期化

```javascript
const tmp117 = new TMP117(i2cPort, slaveAddress);
await tmp117.init();
```

I2C ポートの取得とセンサーの初期化をします。
センサーを使う前に必ず一回実行してください。初期化時にデバイスIDを確認し、TMP117以外のデバイスが接続されている場合はエラーになります。

|引数|型|説明|
|:---|:---|:---|
|i2cPort|I2CSlaveDevice|使用する I2C ポートの port オブジェクトです。|
|slaveAddress|Number|センサーの I2C スレーブアドレスです。[センサー仕様](#センサー仕様)を参照してください。|

### 温度の読み取り read()

```js
const data = await tmp117.read();
console.log(data.temperature);
```

温度を測定します。

|返り値|型|説明|
|:---|:---|:---|
|temperature|Number|センサーが測定した温度です。単位は ℃（セルシウス度）です。|

## 参考リンク

- TMP117 データシート（Texas Instruments社）
  - https://www.ti.com/lit/ds/symlink/tmp117.pdf

