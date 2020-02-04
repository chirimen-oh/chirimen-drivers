const { requestI2CAccess } = require("node-web-i2c");
const PAJ7620 = require("@chirimen/grove-gesture");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const gesture = new PAJ7620(port, 0x73);
  await gesture.init();

  for (;;) {
    const v = await gesture.read();
    console.log(v);
    await sleep(1000);
  }
}
