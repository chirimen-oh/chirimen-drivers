# ads1x15

- ADDA 変換モジュール ADS1115

## 使用パーツ

- TBD

## 配線図

![配線図](../node-examples/ads1x15/schematic.png 'schematic')

## サンプルコード (main.js)

```javascript
const { requestI2CAccess } = require('node-web-i2c');
const ADS1X15 = require('@chirimen/ads1x15');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const ads1x15 = new ADS1X15(port, 0x48);
  // If you uses ADS1115, you have to select "true", otherwise select "false".
  await ads1x15.init(true);
  console.log('init complete');
  while (true) {
    let output = '';
    // ADS1115 has 4 channels.
    for (let channel = 0; channel < 4; channel++) {
      const rawData = await ads1x15.read(channel);
      const voltage = ads1x15.getVoltage(rawData);
      output += `CH${channel}:${voltage.toFixed(3)}V `;
    }
    console.log(output);

    await sleep(500);
  }
}
```

---

[← 目次に戻る](./index.md)
