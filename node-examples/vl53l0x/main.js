const { requestI2CAccess } = require("node-web-i2c");
const VL53L0X = require("@chirimen/vl53l0x");
const { promisify } = require("util");
const sleep = promisify(setTimeout)


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


