import MPU6050 from "https://esm.run/@chirimen/mpu6050";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const mpu6050 = new MPU6050(port, 0x68);
  await mpu6050.init();

  while (true) {
    const data = await mpu6050.readAll();
    const temperature = data.temperature.toFixed(2);
    const g = [data.gx.toFixed(10), data.gy.toFixed(10), data.gz.toFixed(10)];
    const r = [data.rx.toFixed(10), data.ry.toFixed(10), data.rz.toFixed(10)];
    value.innerHTML = [
      `Temperature: ${temperature} degree`,
      `Gx: ${g[0]}, Gy: ${g[1]}, Gz: ${g[2]}`,
      `Rx: ${r[0]}, Ry: ${r[1]}, Rz: ${r[2]}`,
    ].join("<br>");

    await sleep(500);
  }
}
