// @ts-check
// APDS9930 driver for CHIRIMEN
// Digital Proximity and Ambient Light Sensor
// Register map / lux calculation ported from https://github.com/Depau/APDS9930
// (Arduino library, a fork of SparkFun's APDS-9960 library adapted for APDS-9930)

// レジスタアドレス（上位ビットの COMMAND ビット 0x80 を含む）
const APDS9930_ENABLE = 0x80;
const APDS9930_ATIME = 0x81;
const APDS9930_PTIME = 0x82;
const APDS9930_PPCOUNT = 0x8e;
const APDS9930_CONTROL = 0x8f;
const APDS9930_POFFSET = 0x9e;
const APDS9930_ID = 0x92;
const APDS9930_STATUS = 0x93;
const APDS9930_CH0DATAL = 0x94; // CH0DATAH = +1
const APDS9930_CH1DATAL = 0x96; // CH1DATAH = +1
const APDS9930_PDATAL = 0x98; // PDATAH = +1

// APDS9930_ID の既知の値（リビジョンにより異なる）
const APDS9930_DEVICE_IDS = [0x39, 0x30];

// ENABLE レジスタのビット
const ENABLE_PON = 0x01; // Power ON
const ENABLE_AEN = 0x02; // ALS Enable
const ENABLE_PEN = 0x04; // Proximity Enable

// STATUS レジスタのビット
const STATUS_AVALID = 0x01; // ALSの測定値が有効
const STATUS_PVALID = 0x02; // Proximityの測定値が有効

// CONTROL レジスタ: ALS Gain (bit1:0)
const AGAIN_TABLE = { 1: 0x00, 8: 0x01, 16: 0x02, 120: 0x03 };
// CONTROL レジスタ: Proximity Gain (bit3:2)
const PGAIN_TABLE = { 1: 0x00, 2: 0x01, 4: 0x02, 8: 0x03 };
// CONTROL レジスタ: Proximity用IR LEDドライブ電流 (bit7:6, 単位mA)
const PDRIVE_TABLE = { 100: 0x00, 50: 0x01, 25: 0x02, 12.5: 0x03 };
// CONTROL レジスタ: Proximity用フォトダイオード選択 (bit5:4) - Ch1固定
const CONTROL_PDIODE_CH1 = 0x02 << 4;

const DEFAULT_ATIME = 0xed; // ALS積分時間 ≈ 2.73ms × (256-0xED) ≈ 52ms
const DEFAULT_PTIME = 0xff; // Proximity積分時間 ≈ 2.73ms（データシート推奨の固定値）
const DEFAULT_PPULSE = 0x08; // Proximity用IR LEDパルス数
const DEFAULT_POFFSET = 0x00; // Proximityオフセット補正（クロストーク較正用、初期値0）
// Proximityゲインの初期値。データシート/参考実装の既定値(8倍)は近距離では
// 遮蔽・反射などのクロストークだけで容易に飽和(1023固定)するため、
// 実用上飽和しにくい1倍を既定にしている。より遠距離を検知したい場合は
// setPGain() で引き上げる。
const DEFAULT_PGAIN = 1;
const DEFAULT_PDRIVE_MA = 100;

// ALS(照度)計算用の係数（データシート記載のオープンエア係数）
const ALS_GA = 0.49;
const ALS_DF = 52;
const ALS_COE_B = 1.862;
const ALS_COE_C = 0.746;
const ALS_COE_D = 1.291;

class APDS9930 {
  /**
   * @constructor
   * @param {import('node-web-i2c').I2CPort} i2cPort I2C port instance
   * @param {number?} slaveAddress I2C slave address
   */
  constructor(i2cPort, slaveAddress = 0x39) {
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
    this.aGain = 1;
    this.pGain = DEFAULT_PGAIN;
    this.pDriveMA = DEFAULT_PDRIVE_MA;
    this.aTimeMs = 2.73 * (256 - DEFAULT_ATIME);
  }
  async init() {
    try {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

      const id = await this.i2cSlave.read8(APDS9930_ID);
      if (!APDS9930_DEVICE_IDS.includes(id)) {
        throw new Error("APDS9930 not found. id=0x" + id.toString(16));
      }

      await this.i2cSlave.write8(APDS9930_ATIME, DEFAULT_ATIME);
      await this.i2cSlave.write8(APDS9930_PTIME, DEFAULT_PTIME);
      await this.i2cSlave.write8(APDS9930_PPCOUNT, DEFAULT_PPULSE);
      await this.i2cSlave.write8(APDS9930_POFFSET, DEFAULT_POFFSET);
      await this.#writeControl();
      await this.i2cSlave.write8(
        APDS9930_ENABLE,
        ENABLE_PON | ENABLE_AEN | ENABLE_PEN,
      );
      // 電源投入後、最初のALS/Proximity測定が完了するまで待つ
      await this.wait(this.aTimeMs + 50);
    } catch (e) {
      console.error("APDS9930.init() error : " + e);
      return null;
    }
    return this;
  }
  async #writeControl() {
    await this.i2cSlave.write8(
      APDS9930_CONTROL,
      (PDRIVE_TABLE[this.pDriveMA] << 6) |
        CONTROL_PDIODE_CH1 |
        (PGAIN_TABLE[this.pGain] << 2) |
        AGAIN_TABLE[this.aGain],
    );
  }
  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * ALSのゲインを設定する
   * @param {1 | 8 | 16 | 120} gain
   */
  async setAGain(gain) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    if (!(gain in AGAIN_TABLE)) {
      console.error("APDS9930.setAGain() invalid gain! (1, 8, 16, 120)");
      return null;
    }
    this.aGain = gain;
    await this.#writeControl();
    return gain;
  }
  /**
   * Proximityのゲインを設定する。
   * 近距離での飽和（読み取り値が1023に張り付く）が起きる場合は、
   * より小さい値に下げてください。
   * @param {1 | 2 | 4 | 8} gain
   */
  async setPGain(gain) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    if (!(gain in PGAIN_TABLE)) {
      console.error("APDS9930.setPGain() invalid gain! (1, 2, 4, 8)");
      return null;
    }
    this.pGain = gain;
    await this.#writeControl();
    return gain;
  }
  /**
   * Proximity測定用の赤外線LEDドライブ電流を設定する。
   * 近距離での飽和が起きる場合は、より小さい値に下げてください。
   * @param {100 | 50 | 25 | 12.5} ma
   */
  async setLEDDrive(ma) {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    if (!(ma in PDRIVE_TABLE)) {
      console.error(
        "APDS9930.setLEDDrive() invalid value! (100, 50, 25, 12.5)",
      );
      return null;
    }
    this.pDriveMA = ma;
    await this.#writeControl();
    return ma;
  }
  async #waitForStatus(mask, timeoutMs) {
    const steps = Math.ceil(timeoutMs / 10);
    for (let i = 0; i < steps; i++) {
      const status = await this.i2cSlave.read8(APDS9930_STATUS);
      if (status & mask) {
        return;
      }
      await this.wait(10);
    }
    throw new Error("APDS9930: measurement timeout");
  }
  /** 照度(lux)を取得する */
  async readAmbientLight() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.#waitForStatus(STATUS_AVALID, this.aTimeMs + 100);
    const ch0L = await this.i2cSlave.read8(APDS9930_CH0DATAL);
    const ch0H = await this.i2cSlave.read8(APDS9930_CH0DATAL + 1);
    const ch1L = await this.i2cSlave.read8(APDS9930_CH1DATAL);
    const ch1H = await this.i2cSlave.read8(APDS9930_CH1DATAL + 1);
    const ch0 = (ch0H << 8) | ch0L; // Clear(可視光+赤外)
    const ch1 = (ch1H << 8) | ch1L; // IR(赤外のみ)

    const lpc = (ALS_GA * ALS_DF) / (this.aTimeMs * this.aGain);
    const iac = Math.max(
      ch0 - ALS_COE_B * ch1,
      ALS_COE_C * ch0 - ALS_COE_D * ch1,
      0,
    );
    return iac * lpc;
  }
  /** 近接値(数値が大きいほど近い、範囲の目安は0〜1023)を取得する */
  async readProximity() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.#waitForStatus(STATUS_PVALID, 100);
    const pL = await this.i2cSlave.read8(APDS9930_PDATAL);
    const pH = await this.i2cSlave.read8(APDS9930_PDATAL + 1);
    return (pH << 8) | pL;
  }
  async read() {
    return {
      lux: await this.readAmbientLight(),
      proximity: await this.readProximity(),
    };
  }
}

export default APDS9930;
