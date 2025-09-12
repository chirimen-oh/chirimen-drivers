# @chirimen/max30102

Driver for MAX30102 with WebI2C

## Usage

```
$ npm i @chirimen/max30102
```

```js
import { requestI2CAccess } from "node-web-i2c";
import MAX30102 from "@chirimen/max30102";

const i2cAccess = await requestI2CAccess();
const max30102 = new MAX30102(i2cAccess.ports.get(1));
await max30102.init(); // Initialize and setup the sensor

// Read 100 samples (default)
for await (const { ir, red } of max30102.readSamples()) {
  console.log(`IR: ${ir}, RED: ${red}`);
}
```
