# vl53l0x

# VL53L0X レーザー測距センサー 30 mm - 2 m

## 概要

I2C 接続のレーザー距離センサーで取得した値を表示します。
GP2Y0E03 よりも長距離(最長 2m)の測定ができます。（このセンサーは 4 本のピンヘッダ経由で接続します。あらかじめピンヘッダをハンダ付けしておいてください。製品によってはチップ表面に黄色の保護フィルムがついているものがあります。剥して使用してください。）

## 使用パーツ

- VL53L0X レーザー距離センサー x 1 ([Amazon.co.jp](https://www.amazon.co.jp/s/?field-keywords=VL53L0X), [秋月通商](http://akizukidenshi.com/catalog/g/gM-12590/))
- ジャンパー（メス・メス）ケーブル x 4

## 配線図

![配線図](./images/vl53l0x/schematic.png 'schematic')

## サンプルコード (main.js)

```javascript
const { requestI2CAccess } = require('node-web-i2c');
const VL53L0X = require('@chirimen/vl53l0x');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const vl = new VL53L0X(port, 0x29);
  await vl.init(); // for Long Range Mode (<2m) : await vl.init(true);
  for (;;) {
    const distance = await vl.getRange();
    console.log(`${distance} [mm]`);
    await sleep(500);
  }
}
```

---

[← 目次に戻る](./index.md)
