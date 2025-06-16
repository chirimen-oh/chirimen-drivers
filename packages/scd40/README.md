[データシート]: https://cdn.sparkfun.com/assets/d/4/9/a/d/Sensirion_CO2_Sensors_SCD4x_Datasheet.pdf

# SCD40

## センサー仕様
- メーカー
  - Sensirion
- 測定範囲・精度
  - CO2: 400ppm - 2000ppm ±50ppm
  - 温度: -10℃ - 60℃ ±1.5℃
  - 湿度: 0% - 100% ±9%
- 電源電圧
  - 2.4 - 5.5V
- I2C スレーブアドレス
  - 0x62

詳細な仕様は[データシート][]を参照してください。

## ドライバ

### 初期化

```javascript
const scd40 = new SCD40(port);
await scd40.init();
```

I2C ポートの取得とセンサーの初期化をします。  
センサーを使う前に必ず一回実行してください。  
|引数|型|説明|
|:---|:---|:---|
|i2cPort|I2CSlaveDevice|使用する I2C ポートの port オブジェクトです。|
|slaveAddress|Number|センサーの I2C スレーブアドレスです。[センサー仕様](#センサー仕様)を参照してください。|

### 測定開始 start_periodic_measurement()

```javascript
await scd40.start_periodic_measurement();
```

測定を開始します。必ず実行してください。

### 新規測定可能状態 data_ready()

```javascript
await scd40.data_ready();
```

測定可能な状態かどうかを確認します。一回の測定後次の測定には数秒の間隔が必要です。


### 測定 getData()

```js
data = await scd40.getData();
```

測定します。測定可能な状態でないときは直前に測定された値を返却します。
新たに測定された値が返却された場合、updatedがtrueになります。

|返り値|型|説明|
|:---|:---|:---|
|o|object|測定結果が入った下記のメンバーを含むオブジェクトです|
|o.co2|Number|センサーが測定したCO2濃度です。単位は ppmです。|
|o.tempeature|Number|センサーが測定した温度です。単位は ℃（セルシウス度）です。|
|o.relative_humidity|Number|センサーが測定した湿度です。単位は ％です。|
|o.updated|Boolean|測定値が更新されたことを示します|

## 参考リンク
