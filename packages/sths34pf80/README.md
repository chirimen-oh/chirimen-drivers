# STHS34PF80

STHS34PF80 is a high-precision infrared temperature sensor from STMicroelectronics.

This package provides a WebI2C driver for CHIRIMEN.

## Usage

```js
import { requestI2CAccess } from "node-web-i2c";
import STHS34PF80 from "@chirimen/sths34pf80";

const I2CADDR_STHS34PF80 = 0x5a;

const i2cAccess = await requestI2CAccess();
const i2cPort = i2cAccess.ports.get(1);

const sensor = new STHS34PF80(
  i2cPort,
  I2CADDR_STHS34PF80
);

await sensor.init();

const whoAmI = await sensor.readWhoAmI();
console.log("WHO_AM_I:", "0x" + whoAmI.toString(16));

const data = await sensor.read();
console.dir(data);
```

## I2C Address

The default I2C address is `0x5A`.

## Reference

- [STHS34PF80 Datasheet](https://www.st.com/resource/en/datasheet/sths34pf80.pdf)
