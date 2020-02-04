import OledDisplay from "https://unpkg.com/@chirimen/grove-oled-display?module";

main();

async function main() {
  const head = document.getElementById("head");
  head.innerHTML = "started";
  const i2cAccess = await navigator.requestI2CAccess();
  head.innerHTML = "initializing...";
  const port = i2cAccess.ports.get(1);
  const display = new OledDisplay(port);
  await display.init();
  display.clearDisplayQ();
  await display.playSequence();
  head.innerHTML = "drawing text...";
  display.drawStringQ(0, 0, "hello");
  display.drawStringQ(1, 0, "Real");
  display.drawStringQ(2, 0, "World");
  await display.playSequence();
  head.innerHTML = "completed";
}
