# adxl345

Node.js 版
https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/grove-accelerometer

# ADXL345 Grove Accelerometer 3 軸加速度センサー

## 概要

I2C 接続の 3 軸加速度センサーで取得した値を表示します。（このセンサーは Grove ケーブル経由で接続します）
Grove-Accelerometer で使用されているチップは、ADXL345 です。適切なケーブル接続とアドレスの確認をすればジェネリック品でも同様に使用できる可能性が高いです。 [ジェネリック品の例](https://www.amazon.co.jp/s?k=ADXL345)

## 使用パーツ

- [GROVE - I2C 三軸加速度センサ ADXL345 搭載](https://www.switch-science.com/catalog/972/) x 1
- [GROVE - 4 ピン-ジャンパメスケーブル](https://www.switch-science.com/catalog/1048/) x 1

## 詳細な使い方・センサー仕様

ドライバの[リポジトリ](https://github.com/chirimen-oh/chirimen-drivers/tree/master/packages/grove-accelerometer)(Github)を参照してください。

## 配線図

![配線図](./images/adxl345/schematic.png 'schematic')

## サンプルコード (main.js)

```javascript
const { requestI2CAccess } = require('node-web-i2c');
const GROVEACCELEROMETER = require('@chirimen/grove-accelerometer');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const groveaccelerometer = new GROVEACCELEROMETER(port, 0x53);
  await groveaccelerometer.init();
  for (;;) {
    try {
      const values = await groveaccelerometer.read();
      console.log(`ax: ${values.x}, ax: ${values.y}, ax: ${values.z}`);
    } catch (err) {
      console.error('READ ERROR:' + err);
    }
    await sleep(1000);
  }
}
```

---

[← 目次に戻る](./index.md)
