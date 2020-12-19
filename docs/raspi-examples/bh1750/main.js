import BH1750 from "https://esm.run/@chirimen/bh1750";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const bh1750 = new BH1750(port, 0x23);
  await bh1750.init();

  while (true) {
    const lux = await bh1750.measure_high_res();
    value.innerHTML = lux.toFixed(3) + "lx";

    await sleep(500);
  }
}
