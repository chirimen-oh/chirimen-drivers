import BMP180 from "https://esm.run/@chirimen/bmp180";

main();

async function main() {
  const head = document.getElementById("head");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const bmp180 = new BMP180(port, 0x77);
  await bmp180.init();
  for (;;) {
    const pressure = await bmp180.readPressure();
    const temperature = await bmp180.readTemperature();
    head.innerHTML = [
      `Pressure: ${pressure.toFixed(2)} hPa`,
      `Temperature: ${temperature} degree`,
    ].join(", ");
    await sleep(500);
  }
}
