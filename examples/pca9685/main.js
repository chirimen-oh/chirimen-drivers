import PCA9685 from "https://unpkg.com/@chirimen/pca9685?module";

main();

async function main() {
  const head = document.getElementById("head");
  
  // servo setting for sg90
  // Servo PWM pulse: min=0.0011[sec], max=0.0019[sec] angle=+-60[deg]
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const pca9685 = new PCA9685(port, 0x40);
  let angle = 0;
  await pca9685.init(0.001, 0.002, 30);
  for (;;) {
    angle = angle <= -30 ? 30 : -30;
    await pca9685.setServo(0, angle);
    head.innerHTML = angle;
    await sleep(1000);
  }
}
