import BMP280 from "https://unpkg.com/@chirimen/bmp280?module";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const bmp280 = new BMP280(port, 0x76);
  await bmp280.init();

  while (true) {
    const data = await bmp280.readData();
    const pressure = data.pressure.toFixed(2);
    const temperature = data.temperature.toFixed(2);
    value.innerHTML = [
      `Temperature: ${temperature} degree`,
      `Pressure: ${pressure} hPa`
    ].join("<br>");

    await sleep(500);
  }
}
