import PCF8591 from "https://unpkg.com/@chirimen/pcf8591?module";

main();

let pcf8591;
let dacVoltage;

async function main() {
  const value = document.getElementById("value");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  pcf8591 = new PCF8591(port, 0x48);
  await pcf8591.init();
  dacVoltage = document.getElementById("voltage").value;
  await pcf8591.setDAC(dacVoltage);

  while (true) {
    let output = "";

    // PCF8591 has 4 channels
    for (let channel = 0; channel < 4; channel++) {
      const voltage = await pcf8591.readADC(channel);
      output += `CH${channel}: ${voltage.toFixed(3)}V<br>`;
    }
    value.innerHTML = output;

    await sleep(500);
  }
}

async function setDACVoltage() {
  dacVoltage = document.getElementById("voltage").value;
  await pcf8591.setDAC(dacVoltage);
}
document.getElementById("setVoltage").addEventListener("click", setDACVoltage);
