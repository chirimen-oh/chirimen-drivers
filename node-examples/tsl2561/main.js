const { requestI2CAccess } = require("node-web-i2c");
const GROVELIGHT = require("@chirimen/grove-light");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const grovelight = new GROVELIGHT(port, 0x29);
  await grovelight.init();
  for (;;) {
    try {
      const value = await grovelight.read();
      console.log(value);
    } catch (error) {
      console.error(" Error : ", error);
    }
    await sleep(200);
  }
}
