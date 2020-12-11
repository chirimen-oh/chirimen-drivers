import INA219 from "https://unpkg.com/@chirimen/ina219?module";

main();

async function main() {
  const currentDisplay = document.getElementById("currentDisplay");
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const ina219 = new INA219(port, 0x40);
  await ina219.init();
  await ina219.configure();

  while (true) {
    const voltage = await ina219.voltage();
    const supplyVoltage = await ina219.supply_voltage();
    const current = await ina219.current();
    const power = await ina219.power();
    const shuntVoltage = await ina219.shunt_voltage();

    currentDisplay.innerHTML = [
      `Voltage: ${voltage.toFixed(3)}V`,
      `Supply voltage: ${supplyVoltage.toFixed(3)}V`,
      `Current: ${current.toFixed(2)}mA`,
      `Power: ${power.toFixed(2)}mW`,
      `Shunt voltage: ${shuntVoltage.toFixed(2)}mV`
    ].join("<br>");

    await sleep(500);
  }
}
