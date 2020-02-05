const { requestI2CAccess } = require("node-web-i2c");
const PCA9685 = require("@chirimen/pca9685");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  const i2cAccess = await requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const pca9685 = new PCA9685(port, 0x40);
  let angle = 0;
  // servo setting for sg90
  // Servo PWM pulse: min=0.0011[sec], max=0.0019[sec] angle=+-60[deg]
  await pca9685.init(0.001, 0.002, 30);
  for (;;) {
    angle = angle <= -30 ? 30 : -30;
    await pca9685.setServo(0, angle);
    console.log(angle);
    await sleep(1000);
  }
}
