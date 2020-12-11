import MLX90614 from "https://unpkg.com/@chirimen/mlx90614?module";

main();

async function main() {
  const temperatureDisplay = document.getElementById("temperatureDisplay");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const mlx90614 = new MLX90614(port, 0x5a);
  await mlx90614.init();

  while (true) {
    // Temperature of object that the sensor looking at. (Measured by IR sensor)
    const objectTemperature = await mlx90614.get_obj_temp();
    // Temperature measured by the chip. (The package temperature)
    const ambientTemperature = await mlx90614.get_amb_temp();

    temperatureDisplay.innerHTML = [
      `Object temperature: ${objectTemperature.toFixed(2)} degree`,
      `Ambient temperature: ${ambientTemperature.toFixed(2)} degree`
    ].join("<br>");

    await sleep(500);
  }
}
