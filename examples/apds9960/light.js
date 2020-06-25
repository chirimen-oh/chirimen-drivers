import APDS9960 from "https://unpkg.com/@chirimen/apds9960?module";

main();

async function main() {
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const apds = new APDS9960(port);
  await apds.init();
  await apds.enableLightSensor();
  await apds.enableProximitySensor();
  await apds.setProximityIntLowThreshold(50);
  while (true) {
    const luminance = await apds.readAmbientLight();
    const proximity = await apds.readProximity();
    document.getElementById("AmbientLight").innerHTML = luminance;
    document.getElementById("Proximity").innerHTML = proximity;
    await sleep(200);
  }
}
