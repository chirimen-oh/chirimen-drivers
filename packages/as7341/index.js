// @ts-check
// AS7341 driver for CHIRIMEN
// Based from https://github.com/adafruit/Adafruit_AS7341
// Programmed by Rion Kawashima

const AS7341_WHOAMI = 0x92;
const AS7341_CHIP_ID = 0x09;
const AS7341_ENABLE = 0x80;
const AS7341_ATIME = 0x81;
const AS7341_ASTEP_L = 0xca;
const AS7341_ASTEP_H = 0xcb;
const AS7341_CFG1 = 0xaa; // ゲイン設定
// ゲイン倍率とレジスタ値(0〜10)の対応表
const GAIN_TABLE = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
const AS7341_CFG6 = 0xaf; // SMUXコマンドレジスタ
const AS7341_STATUS2 = 0xa3; // 測定完了フラグ(AVALID)
const AS7341_CH0_DATA_L = 0x95; // 測定データの先頭番地
const SMUX_CMD_WRITE = 0x10; // SMUX書き込みモード(bit4:3 = 10b)

// SMUX結線パターン（Adafruit setup_F1F4_Clear_NIR() より）
// ADC0=F1, ADC1=F2, ADC2=F3, ADC3=F4, ADC4=Clear, ADC5=NIR
const SMUX_F1F4_CLEAR_NIR = [
  0x30, 0x01, 0x00, 0x00, 0x00, 0x42, 0x00, 0x00, 0x50, 0x00, 0x00, 0x00, 0x20,
  0x04, 0x00, 0x30, 0x01, 0x50, 0x00, 0x06,
];

// SMUX結線パターン（Adafruit setup_F5F8_Clear_NIR() より）
// ADC0=F5, ADC1=F6, ADC2=F7, ADC3=F8, ADC4=Clear, ADC5=NIR
const SMUX_F5F8_CLEAR_NIR = [
  0x00, 0x00, 0x00, 0x40, 0x02, 0x00, 0x10, 0x03, 0x50, 0x10, 0x03, 0x00, 0x00,
  0x00, 0x24, 0x00, 0x00, 0x50, 0x00, 0x06,
];

class AS7341 {
  constructor(i2cPort, slaveAddress = 0x39) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
  }
  async init() {
    try {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

      // ① ID確認：正しいチップと会話できているかチェック
      const id = await this.i2cSlave.read8(AS7341_WHOAMI);
      if (id >> 2 !== AS7341_CHIP_ID) {
        throw new Error("AS7341 not found. id=0x" + id.toString(16));
      }

      // ② 電源ON：ENABLEレジスタのbit0(PON)を立てる
      let enable = await this.i2cSlave.read8(AS7341_ENABLE);
      enable |= 0x01;
      await this.i2cSlave.write8(AS7341_ENABLE, enable);
      await this.wait(10);

      // ③ 測定条件のデフォルト設定
      await this.setATIME(100);
      await this.setASTEP(999);
      await this.setGain(256);
    } catch (e) {
      console.error("AS7341.init() error : " + e);
      return null;
    }
    return this;
  }
  async wait(ms) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }
  async setATIME(value) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    if (value < 0 || value > 255) {
      console.error("AS7341.setATIME() value must be 0-255!");
      return null;
    }
    await this.i2cSlave.write8(AS7341_ATIME, value);
    return value;
  }
  async setASTEP(value) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    if (value < 0 || value > 65534) {
      console.error("AS7341.setASTEP() value must be 0-65534!");
      return null;
    }
    await this.i2cSlave.write8(AS7341_ASTEP_L, value & 0xff);
    await this.i2cSlave.write8(AS7341_ASTEP_H, (value >> 8) & 0xff);
    return value;
  }
  async setGain(gain) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    const idx = GAIN_TABLE.indexOf(gain);
    if (idx < 0) {
      console.error("AS7341.setGain() invalid gain! (0.5, 1, 2, 4, ... 512)");
      return null;
    }
    await this.i2cSlave.write8(AS7341_CFG1, idx);
    return gain;
  }
  async #setSmux(config) {
    // 測定を一旦停止（ENABLE bit1 = SP_EN を0に）
    let enable = await this.i2cSlave.read8(AS7341_ENABLE);
    enable &= ~0x02;
    await this.i2cSlave.write8(AS7341_ENABLE, enable);

    // 「これからSMUX設定を書くぞ」とチップに宣言
    await this.i2cSlave.write8(AS7341_CFG6, SMUX_CMD_WRITE);

    // 結線パターン20バイトを0x00〜0x13に書く
    for (let i = 0; i < config.length; i++) {
      await this.i2cSlave.write8(i, config[i]);
    }

    // ENABLE bit4(SMUXEN)=1 で反映開始。チップが処理を終えるとbit4が勝手に0に戻る（最大1秒待つ）
    enable = await this.i2cSlave.read8(AS7341_ENABLE);
    enable |= 0x10;
    await this.i2cSlave.write8(AS7341_ENABLE, enable);
    for (let i = 0; i < 100; i++) {
      if (!((await this.i2cSlave.read8(AS7341_ENABLE)) & 0x10)) {
        return;
      }
      await this.wait(10);
    }
    throw new Error("AS7341.#setSmux() timeout!");
  }
  async #measure() {
    // 測定開始（ENABLE bit1 = SP_EN を1に）
    let enable = await this.i2cSlave.read8(AS7341_ENABLE);
    enable |= 0x02;
    await this.i2cSlave.write8(AS7341_ENABLE, enable);

    // STATUS2のbit6(AVALID)が立つ＝測定完了まで待つ（最大3秒）
    for (let i = 0; i < 300; i++) {
      if ((await this.i2cSlave.read8(AS7341_STATUS2)) & 0x40) {
        return;
      }
      await this.wait(10);
    }
    throw new Error("AS7341.#measure() timeout!");
  }
  async #readChannels() {
    await this.i2cSlave.writeByte(AS7341_CH0_DATA_L);
    const raw = await this.i2cSlave.readBytes(12);
    const ch = [];
    for (let i = 0; i < 6; i++) {
      ch.push(raw[i * 2] | (raw[i * 2 + 1] << 8));
    }
    return ch;
  }
  async read() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.#setSmux(SMUX_F1F4_CLEAR_NIR);
    await this.#measure();
    const low = await this.#readChannels(); // [F1, F2, F3, F4, Clear, NIR]

    await this.#setSmux(SMUX_F5F8_CLEAR_NIR);
    await this.#measure();
    const high = await this.#readChannels(); // [F5, F6, F7, F8, Clear, NIR]

    return {
      f1: low[0],
      f2: low[1],
      f3: low[2],
      f4: low[3],
      f5: high[0],
      f6: high[1],
      f7: high[2],
      f8: high[3],
      clear: high[4],
      nir: high[5],
    };
  }
}
export default AS7341;
