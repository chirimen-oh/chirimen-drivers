const { requestI2CAccess } = require("node-web-i2c");
const NEOPIXEL_I2C = require("@chirimen/neopixel-i2c");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const neopixel_i2c = new NEOPIXEL_I2C(port, 0x41);
  await neopixel_i2c.init();
  console.log("initialization complete");

  while (true) {
    await neopixel_i2c.setGlobal(0x20, 0x00, 0x00); // Red
    await sleep(200);
    await neopixel_i2c.setGlobal(0x00, 0x20, 0x00); // Green
    await sleep(200);
    await neopixel_i2c.setGlobal(0x00, 0x00, 0x20); // Blue
    await sleep(200);
  }
}
