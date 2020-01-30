import GROVEACCELEROMETER from "https://unpkg.com/@chirimen/grove-accelerometer?module";

main();

async function main() {
  const ax = document.getElementById("ax");
  const ay = document.getElementById("ay");
  const az = document.getElementById("az");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const groveaccelerometer = new GROVEACCELEROMETER(port, 0x53);
  await groveaccelerometer.init();
  for (;;) {
    try {
      const values = await groveaccelerometer.read();
      ax.innerHTML = values.x ? values.x : ax.innerHTML;
      ay.innerHTML = values.y ? values.y : ay.innerHTML;
      az.innerHTML = values.z ? values.z : az.innerHTML;
    } catch (err) {
      console.error("READ ERROR:" + err);
    }
    await sleep(1000);
  }
}
