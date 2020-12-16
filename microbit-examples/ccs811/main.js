//import CCS811 from "https://unpkg.com/@chirimen/ccs811?module";
import CCS811 from "../../packages/ccs811/ccs811.mjs";

window.connect=connect;
window.disconnect=disconnect;

console.log("Hello this is main.js");

var microBitBle;

var ccs;

var readEnable;

async function connect(){
	microBitBle = await microBitBleFactory.connect();
	msg.innerHTML=("micro:bit BLE接続しました。");
	var i2cAccess = await microBitBle.requestI2CAccess();
	var i2cPort = i2cAccess.ports.get(1);
	ccs = new CCS811(i2cPort);
	await ccs.init();
	readEnable = true;
	readData();
}

async function disconnect(){
	readEnable = false;
	await microBitBle.disconnect();
	msg.innerHTML=("micro:bit BLE接続を切断しました。");
}

async function readData(){
	while ( readEnable ){
		var ccsData = await ccs.readData();
		console.log('ccsData:', ccsData);
		msg.innerHTML= "CO2: " + ccsData.CO2 + " ppm  <br>TVOC: "+ ccsData.TVOC + " ppb";
		await sleep(1500);
	}
}
