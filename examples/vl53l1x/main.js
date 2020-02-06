import VL53L1X from "https://unpkg.com/@chirimen/vl53l1x?module";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const vl53l1x = new VL53L1X(port, 0x29);

  // Mode: short, medium, long
  const mode = "short";
  await vl53l1x.init(mode);
  document.getElementById("mode").innerHTML = "Measurement mode: " + mode;

  // Necessary to start mesurement
  await vl53l1x.startContinuous();

  while (true) {
    const data = await vl53l1x.read();
    value.innerHTML = data.toFixed(2) + " mm";

    await sleep(500);
  }
}
