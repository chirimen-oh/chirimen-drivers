const { requestI2CAccess } = require("node-web-i2c");
const VL53L1X = require("@chirimen/vl53l1x");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const vl53l1x = new VL53L1X(port, 0x29);

  // Mode: short, medium, long
  await vl53l1x.init("short");

  // Necessary to start mesurement
  await vl53l1x.startContinuous();

  while (true) {
    const data = await vl53l1x.read();
    console.log(data.toFixed(2) + " mm");
    await sleep(500);
  }
}
