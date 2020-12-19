// CCS811サンプル / CHIRIMEN for Raspberry Pi
//
// Note:
// https://research.itplants.com/?p=2041
// や
// https://learn.adafruit.com/adafruit-ccs811-air-quality-sensor/raspberry-pi-wiring-test
// にあるようにCCS811はI2Cのビットレートを下げないと動かないそうです・・・(I2Cのクロックストレッチとよばれる仕様にRaspberry Piのチップが対応していないためとのこと)
// CHIRIMEN for Raspberry Pi 環境(RaspbianにCHIRIMEN用環境設定を入れたもの)に以下の変更をしてください。
// /boot/config.txtの末尾を、dtparam=i2c_baudrate=10000　に変更（デフォルトより一桁少なく）してリブート

//import CCS811 from "./node_modules/@chirimen-raspi/chirimen-driver-i2c-ccs811/CCS811.js";
import CCS811 from "https://cdn.jsdelivr.net/npm/@chirimen/ccs811@1.0.0/ccs811.js";

main();

async function main() {
  try {
    var i2cAccess = await navigator.requestI2CAccess();
    var port = i2cAccess.ports.get(1);
    var ccs = new CCS811(port);
    await ccs.init();
    while (1) {
      var data = await ccs.readData();
      document.getElementById("CO2").innerHTML = data.CO2 + "ppm";
      document.getElementById("TVOC").innerHTML = data.TVOC + "ppb";
      await sleep(1500);
    }
  } catch (error) {
    console.error("error", error);
  }
}

