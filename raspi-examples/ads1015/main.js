import ADS1015 from "https://esm.run/@chirimen/ads1015";

main();

async function main() {
  const i2cAccess = await navigator.requestI2CAccess();
  const port = i2cAccess.ports.get(1);
  const ads1015 = new ADS1015(port, 0x48);
  await ads1015.init();
  console.log("new");
  for (;;) {
    try {
      const value = await ads1015.read(0);
      console.log("value:", value);
      head.innerHTML = value;
    } catch (error) {
      if (error.code != 4) {
        head.innerHTML = "ERROR";
      }
      console.error("error: code:" + error.code + " message:" + error.message);
    }
    await sleep(100);
  }
}
