import GP2Y0E03 from "https://unpkg.com/@chirimen/gp2y0e03?module";

main();

async function main() {
  const valelem = document.getElementById("distance");
  try {
    const i2cAccess = await navigator.requestI2CAccess();
    const port = i2cAccess.ports.get(1);
    const sensor_unit = new GP2Y0E03(port, 0x40);
    await sensor_unit.init();

    while (1) {
      try {
        const distance = await sensor_unit.read();
        if (distance != null) {
          valelem.innerHTML = "Distance:" + distance + "cm";
        } else {
          valelem.innerHTML = "out of range";
        }
      } catch (err) {
        console.error("READ ERROR:" + err);
      }
      await sleep(500);
    }
  } catch (err) {
    console.error("GP2Y0E03 init error");
  }
}
