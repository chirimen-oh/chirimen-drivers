import Neopixel from "https://esm.run/@chirimen/neopixel-i2c";

main();

async function main() {
  const initDisplay = document.getElementById("init");
  const color = document.getElementById("colorPicker");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const neopixel = new Neopixel(port, 0x41);
  await neopixel.init();
  initDisplay.remove();
  await neopixel.setGlobal(0x10, 0x10, 0x10);

  color.set.addEventListener("click", async () => {
    console.log([
      parseInt(color.red.value, 10),
      color.green.value,
      color.blue.value,
    ]);
    await neopixel.setGlobal(
      parseInt(color.red.value, 10),
      parseInt(color.green.value, 10),
      parseInt(color.blue.value, 10)
    );
  });
}
