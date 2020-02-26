import ADT7410 from "https://unpkg.com/@chirimen/adt7410?module";

main();

async function main() {
  const head = document.getElementById("head");
  const i2cAccess = await navigator.requestI2CAccess(); // i2cAccessを非同期で取得
  const port = i2cAccess.ports.get(1); // I2C I/Fの1番ポートを取得
  const adt7410 = new ADT7410(port, 0x48); // 取得したポートの0x48アドレスをADT7410ドライバで受信する
  await adt7410.init();
  for (;;) {
    // 無限ループ
    const value = await adt7410.read();
    head.innerHTML = `${value} degree`;
    await sleep(1000);
  }
}
