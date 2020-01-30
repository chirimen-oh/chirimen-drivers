const { requestI2CAccess } = require("node-web-i2c");
const ADS1015 = require("@chirimen/ads1015");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  var i2cAccess = await requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var ads1015 = new ADS1015(port, 0x48);
  await ads1015.init();
  for (;;) {
    try {
      var value = await ads1015.read(0);
      console.log("value:", value);
    } catch (error) {
      console.error("error: code:" + error.code + " message:" + error.message);
    }
    await sleep(100);
  }
}
