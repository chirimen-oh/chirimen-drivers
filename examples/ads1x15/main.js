import ADS1X15 from "https://unpkg.com/@chirimen/ads1x15?module";

main();

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const ads1x15 = new ADS1X15(port, 0x48);
  // If you uses ADS1115, you have to select "true", otherwise select "false".
  await ads1x15.init(true);
  console.log("init complete");
  while (true) {
    let output = "";
    // ADS1115 has 4 channels.
    for (let channel = 0; channel < 4; channel++) {
      const rawData = await ads1x15.read(channel);
      const voltage = ads1x15.getVoltage(rawData);
      output += `CH${channel}: ${voltage.toFixed(3)}V<br>`;
    }

    value.innerHTML = output;

    await sleep(500);
  }
}
