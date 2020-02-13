import TCS34725 from "https://unpkg.com/@chirimen/tcs34725?module";

main();

async function main() {
  const rgbDisplay = document.getElementById("rgbDisplay");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const tcs34725 = new TCS34725(port, 0x29);
  await tcs34725.init();

  // You can select the value of gain from 1, 4, 16 or 60.
  await tcs34725.gain(4);

  while (true) {
    const data = await tcs34725.read();
    rgbDisplay.innerHTML = [
      `R: ${data.r}`,
      `G: ${data.g}`,
      `B: ${data.b}`,
      `C: ${data.c}`
    ].join("<br>");

    await sleep(500);
  }
}
