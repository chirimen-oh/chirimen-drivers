const { requestI2CAccess } = require("node-web-i2c");
const S11059 = require("@chirimen/s11059");
const { promisify } = require("util");
const sleep = promisify(setTimeout)


main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const s11059 = new S11059(port, 0x2a);
  await s11059.init();
  for (;;) {
    try {
      const values = await s11059.readR8G8B8();
      const red = values[0] & 0xff;
      const green = values[1] & 0xff;
      const blue = values[2] & 0xff;
      const gain_level = values[3];
      console.log(`R:${red} G:${green} B:${blue} GAIN: ${gain_level}`);
    } catch (error) {
      console.error("READ ERROR:" + error);
    }
    await sleep(1000);
  }
}
