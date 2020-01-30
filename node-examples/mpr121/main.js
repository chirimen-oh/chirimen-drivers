const { requestI2CAccess } = require("node-web-i2c");
const GroveTouch = require("@chirimen/grove-touch");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  var i2cAccess = await requestI2CAccess();
  var port = i2cAccess.ports.get(1);
  var touchSensor = new GroveTouch(port, 0x5a);
  await touchSensor.init();
  for (;;) {
    var ch = await touchSensor.read();
    console.log(JSON.stringify(ch));
    await sleep(100);
  }
}
