import VEML6070 from "https://unpkg.com/@chirimen/veml6070?module";

main();

async function main() {
  const head = document.getElementById("head");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const veml6070 = new VEML6070(port);
  await veml6070.init();
  for (;;) {
    const value = await veml6070.read();
    head.innerHTML = value;
    await sleep(200);
  }
}
