import OledDisplay from "https://unpkg.com/@chirimen/grove-oled-display?module";

main();

async function main() {
  const status = document.getElementById("status");
  status.innerHTML = "started";
  const i2cAccess = await navigator.requestI2CAccess();
  status.innerHTML = "initializing...";
  const port = i2cAccess.ports.get(1);
  const display = new OledDisplay(port, 0x3c); // set Address to 0x3C
  await display.init(true); // use SSD1306
  display.clearDisplayQ();
  await display.playSequence();
  status.innerHTML = "drawing text...";
  display.drawStringQ(0, 0, "hello");
  display.drawStringQ(1, 0, "Real");
  display.drawStringQ(2, 0, "World");
  await display.playSequence();
  status.innerHTML = "completed";
}
