// BME680サンプル / CHIRIMEN for Raspberry Pi

// import BME680 from "./node_modules/@chirimen-raspi/chirimen-driver-i2c-bme680/bme680.js";
import BME680 from "https://cdn.jsdelivr.net/npm/@chirimen/bme680@1.0.0/bme680.js";


main();

async function main() {
  try {
    var temp = document.getElementById("temp");
    var pres = document.getElementById("pres");
    var humi = document.getElementById("humi");
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    // BME680 の SlaveAddress 初期値はモジュールによって異なる
    var bme680 = new BME680(port, 0x77);
    bme680 = new BME680(port, 0x77);
    await bme680.init();
    while (1) {
      var val = await bme680.readData();
      temp.innerHTML = val.temperature + " celsius";
      pres.innerHTML = val.pressure + " hPa";
      humi.innerHTML = val.humidity + " %";
      gas.innerHTML = val.gas + " ohm";
      await sleep(2000);
    }
  } catch (error) {
    console.error("error", error);
  }
}
