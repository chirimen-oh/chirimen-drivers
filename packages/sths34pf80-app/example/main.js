import { requestI2CAccess } from "node-web-i2c";
import STHS34PF80 from "../index.js";

const i2cAccess = await requestI2CAccess();

const sensor = new STHS34PF80(
  i2cAccess.ports.get(1),
  0x5A
);

await sensor.init();

const whoAmI = await sensor.readWhoAmI();
const status = await sensor.readStatus();
const funcStatus = await sensor.readFuncStatus();

const tObject = await sensor.readTObject();
const tAmbient = await sensor.readTAmbient();
const tAmbientCelsius = await sensor.readTAmbientCelsius();

console.log(`WHO_AM_I     = 0x${whoAmI.toString(16)}`);
console.log(`STATUS       = 0x${status.toString(16)}`);
console.log(`FUNC_STATUS  = 0x${funcStatus.toString(16)}`);
console.log(`TOBJECT raw  = ${tObject}`);
console.log(`TAMBIENT raw = ${tAmbient}`);
console.log(`TAMBIENT     = ${tAmbientCelsius.toFixed(2)} ℃`);
