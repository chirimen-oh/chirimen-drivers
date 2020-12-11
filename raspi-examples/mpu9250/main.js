import MPU6500 from "https://unpkg.com/@chirimen/mpu6500?module";
import AK8963 from "https://unpkg.com/@chirimen/ak8963?module";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const mpu6500 = new MPU6500(port, 0x68);
  const ak8963 = new AK8963(port, 0x0c);
  await mpu6500.init();
  await ak8963.init();

  while (true) {
    const g = await mpu6500.getGyro();
    const r = await mpu6500.getAcceleration();
    const h = await ak8963.readData();
    value.innerHTML = [
      `Gx: ${g.x}`,
      `Gy: ${g.y}`,
      `Gz: ${g.z}`,
      `Rx: ${r.x}`,
      `Ry: ${r.y}`,
      `Rz: ${r.z}`,
      `Hx: ${h.x}`,
      `Hy: ${h.y}`,
      `Hz: ${h.z}`
    ].join("<br>");

    await sleep(500);
  }
}
