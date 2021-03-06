import GP2Y0E03 from "https://esm.run/@chirimen/gp2y0e03";

main();

async function main() {
  const valelem = document.getElementById("distance");

  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const sensorUnit = new GP2Y0E03(port, 0x40);
  await sensorUnit.init();

  while (true) {
    try {
      const distance = await sensorUnit.read();
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
}
