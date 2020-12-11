import PAJ7620 from "https://esm.run/@chirimen/grove-gesture";

main();

async function main() {
  const head = document.getElementById("head");
  head.innerHTML = "started";
  const i2cAccess = await navigator.requestI2CAccess();
  head.innerHTML = "initializing...";
  const port = i2cAccess.ports.get(1);
  const gesture = new PAJ7620(port, 0x73);
  await gesture.init();

  for (;;) {
    const v = await gesture.read();
    head.innerHTML = v;
    await sleep(1000);
  }
}
