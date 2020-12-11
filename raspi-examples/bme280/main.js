import BME280 from "https://unpkg.com/@chirimen/bme280?module";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const bme280 = new BME280(port, 0x76);
  await bme280.init();

  while (true) {
    const data = await bme280.readData();
    const temperature = data.temperature.toFixed(2);
    const humidity = data.humidity.toFixed(2);
    const pressure = data.pressure.toFixed(2);
    value.innerHTML = [
      `Temperature: ${temperature} degree`,
      `Humidity: ${humidity} %`,
      `Pressure: ${pressure} hPa`
    ].join("<br>");
    await sleep(500);
  }
}
