const { requestI2CAccess } = require("node-web-i2c");
const { requestGPIOAccess } = require("node-web-gpio");
const PCA9685_PWM = require("@chirimen/pca9685-pwm");
const { promisify } = require("util");
const sleep = promisify(setTimeout);

main();

async function main() {
  // Address of GPIO port connecting to H-Bridge controller
  const gpioPortAddress = [20, 21];

  const gpioAccess = await requestGPIOAccess();
  const i2cAccess = await requestI2CAccess();
  const i2cPort = i2cAccess.ports.get(1);
  const gpioPort1 = gpioAccess.ports.get(gpioPortAddress[0]);
  const gpioPort2 = gpioAccess.ports.get(gpioPortAddress[1]);
  await gpioPort1.export("out");
  await gpioPort2.export("out");
  console.log("a");

  const pca9685_pwm = new PCA9685_PWM(i2cPort, 0x40);
  console.log("b");
  await pca9685_pwm.init();
  console.log("c");
  gpioPort1.write(0);
  gpioPort2.write(0);

  while (true) {
    // Forward
    gpioPort1.write(1);
    gpioPort2.write(0);

    await sleep(3000);

    // Brake
    gpioPort1.write(1);
    gpioPort2.write(1);
    await sleep(300);
    gpioPort1.write(0);
    gpioPort2.write(0);

    await sleep(3000);

    // Reverse
    gpioPort1.write(0);
    gpioPort2.write(1);

    await sleep(3000);
  }
}
