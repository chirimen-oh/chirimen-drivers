# sht30

- TBD

## SHT30 温湿度センサー

- TBD

## 配線図

![配線図](./images/sht30/schematic.png 'schematic')

## サンプルコード (main.js)

```javascript
const { requestI2CAccess } = require('node-web-i2c');
const SHT30 = require('@chirimen/sht30');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const sht30 = new SHT30(port, 0x44);
  await sht30.init();

  while (true) {
    const { humidity, temperature } = await sht30.readData();
    console.log(
      [
        `Humidity: ${humidity.toFixed(2)}%`,
        `Temperature: ${temperature.toFixed(2)} degree`,
      ].join(', ')
    );

    await sleep(500);
  }
}
```

---

[← 目次に戻る](./index.md)
