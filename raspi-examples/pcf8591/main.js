import PCF8591 from "https://esm.run/@chirimen/pcf8591";

main();

async function main() {
  const adcDisplay = document.getElementById("adcDisplay");
  const dacVoltage = document.getElementById("dacVoltage");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const pcf8591 = new PCF8591(port, 0x48);
  await pcf8591.init();
  await pcf8591.setDAC(3.3);

  //DAC control
  document
    .getElementById("dacSetButton")
    .addEventListener("click", () => pcf8591.setDAC(dacVoltage.value));

  while (true) {
    let output = "";

    // PCF8591 has 4 channels
    for (let channel = 0; channel < 4; channel++) {
      const voltage = await pcf8591.readADC(channel);
      output += `CH${channel}: ${voltage.toFixed(3)}V<br>`;
    }
    adcDisplay.innerHTML = output;

    await sleep(500);
  }
}
