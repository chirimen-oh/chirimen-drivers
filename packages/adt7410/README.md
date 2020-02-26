# ADT7410

## センサー仕様

- 動作・測定可能温度
  - -55℃ ～+150℃
- 温度精度
  - ±0.5℃ (-40℃ ～+105℃ の環境下)
- 温度解像度
  - 0.0625℃
- I2C スレーブアドレス
  - 0x48（ジャンパにより変更可能。）

詳細な仕様は[データシート](https://www.analog.com/media/en/technical-documentation/data-sheets/ADT7410.pdf)を参照してください。（ANALOG DEVICES 社のサイトにリンクします。）

## ドライバ

### 初期化

```javascript
const adt7410 = new ADT7410(i2cPort, slaveAddress);
await adt7410.init();
```

I2C ポートの取得とセンサーの初期化をします。  
センサーを使う前に必ず一回実行してください。  
|引数|型|説明|
|:---|:---|:---|
|i2cPort|Number|使用する I2C ポートの番号です。必ず１番を使用してください。|
|slaveAddress|Number|センサーの I2C スレーブアドレスです。デフォルトでは 0x48 に設定されています。|

### 温度の読み取り read()

```js
temperature = await adt7410.read();
```

温度を測定します。
|返り値|型|説明|
|:---|:---|:---|
|tempeature|Number|センサーが測定した温度です。単位は ℃（セルシウス度）です。|

## 参考リンク

- ADT7410 データシート（ANALOG DEVICES 社）
  - https://www.analog.com/media/en/technical-documentation/data-sheets/ADT7410.pdf
- ＡＤＴ７４１０使用　高精度・高分解能　Ｉ２Ｃ・１６Ｂｉｔ　温度センサモジュール（秋月電子通商）
  - http://akizukidenshi.com/catalog/g/gM-06675/
