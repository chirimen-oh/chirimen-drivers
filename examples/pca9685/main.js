import PCA9685 from "https://unpkg.com/@chirimen/pca9685?module";

main();

async function main() {
  const head = document.getElementById("head");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const pca9685 = new PCA9685(port, 0x40);
  // servo setting for sg90
  // Servo PWM pulse: min=0.0011[sec], max=0.0019[sec] angle=+-60[deg]
  await pca9685.init(0.001, 0.002, 30);
  for (;;) {
    await pca9685.setServo(0, 30);
    head.textContent = "30 deg";
    await sleep(1000);
    await pca9685.setServo(0, -30);
    head.textContent = "-30 deg";
    await sleep(1000);
  }
}
