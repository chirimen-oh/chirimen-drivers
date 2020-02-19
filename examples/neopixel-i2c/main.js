import NEOPIXEL_I2C from "https://unpkg.com/@chirimen/neopixel-i2c?module";

main();

async function main() {
  const initDisplay = document.getElementById("init");
  const color = document.getElementById("colorPicker");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const neopixel_i2c = new NEOPIXEL_I2C(port, 0x41);
  await neopixel_i2c.init();
  initDisplay.remove();
  await neopixel_i2c.setGlobal(0x10, 0x10, 0x10);

  color.set.addEventListener("click", async () => {
    console.log([
      parseInt(color.red.value, 10),
      color.green.value,
      color.blue.value
    ]);
    await neopixel_i2c.setGlobal(
      parseInt(color.red.value, 10),
      parseInt(color.green.value, 10),
      parseInt(color.blue.value, 10)
    );
  });
}
