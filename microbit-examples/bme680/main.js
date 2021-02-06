// import BME680 from "./bme680.js";
import BME680 from "https://cdn.jsdelivr.net/npm/@chirimen/bme680/bme680.js";

window.connect = connect;
window.disconnect = disconnect;

console.log("Hello this is main.js");

var microBitBle;

var bme;

var readEnable;

async function connect() {
  microBitBle = await microBitBleFactory.connect();
  msg.innerHTML = "micro:bit BLE接続しました。";
  var i2cAccess = await microBitBle.requestI2CAccess();
  var i2cPort = i2cAccess.ports.get(1);
  bme = new BME680(i2cPort);
  await bme.init();
  readEnable = true;
  readData();
}

async function disconnect() {
  readEnable = false;
  await microBitBle.disconnect();
  msg.innerHTML = "micro:bit BLE接続を切断しました。";
}

async function readData() {
  while (readEnable) {
    var bmeData = await bme.readData();
    console.log("bmeData:", bmeData);
    msg.innerHTML =
      "temperature: " +
      bmeData.temperature +
      " celsius<br>" +
      "pressure: " +
      bmeData.pressure +
      " hPa<br>" +
      "humidity: " +
      bmeData.humidity +
      " %<br>" +
      "gas: " +
      bmeData.gas +
      " ohm";
    await sleep(2500);
  }
}
