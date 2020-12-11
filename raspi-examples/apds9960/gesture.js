import APDS9960 from "https://esm.run/@chirimen/apds9960";

main();

async function main() {
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const apds = new APDS9960(port);
  await apds.init();
  await apds.enableGestureSensor();
  while (true) {
    const direction = await apds.readGesture();
    document.getElementById("Gesture").innerHTML = direction;
    await sleep(200);
  }
}
