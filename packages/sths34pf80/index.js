// @ts-check

// STHS34PF80 driver for CHIRIMEN
// https://www.st.com/resource/en/datasheet/sths34pf80.pdf
// Programmed by x-na-ogata

const ADDRESS = 0x5a;

// Registers
const WHO_AM_I = 0x0f;
const CTRL1 = 0x20;
const STATUS = 0x23;
const FUNC_STATUS = 0x25;
const TOBJECT_L = 0x26;
const TOBJECT_H = 0x27;
const TAMBIENT_L = 0x28;
const TAMBIENT_H = 0x29;

const STHS34PF80_ID = 0xd3; // WHO_AM_I の既定値
const STATUS_DRDY = 0x04; // STATUS(0x23) bit2: TOBJECT/TAMBIENTの新しいデータが準備できたことを示すフラグ
const TOBJECT_SENSITIVITY = 2000; // TOBJECTの感度(2000 LSB/°C。データシート記載値)

class STHS34PF80 {
  constructor(i2cPort, slaveAddress = ADDRESS) {
    this.i2cPort = i2cPort;
    this.slaveAddress = slaveAddress;
    this.i2cSlave = null;
  }

  async init() {
    try {
      this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

      const id = await this.i2cSlave.read8(WHO_AM_I);
      if (id !== STHS34PF80_ID) {
        throw new Error("STHS34PF80 not found. id=0x" + id.toString(16));
      }

      // BDU = 1, ODR = 4 Hz
      await this.i2cSlave.write8(CTRL1, 0x15);
    } catch (e) {
      console.error("STHS34PF80.init() error : " + e);
      return null;
    }
    return this;
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async readWhoAmI() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    return await this.i2cSlave.read8(WHO_AM_I);
  }

  async readStatus() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    return await this.i2cSlave.read8(STATUS);
  }

  async readFunctionStatus() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    return await this.i2cSlave.read8(FUNC_STATUS);
  }

  // ODR周期(4Hzなら250ms)より速く連続でreadすると古いデータを読んでしまうため、
  // STATUSのDRDYビットが立つまで待つ
  async #waitForDataReady(timeoutMs = 500) {
    const steps = Math.ceil(timeoutMs / 10);
    for (let i = 0; i < steps; i++) {
      const status = await this.i2cSlave.read8(STATUS);
      if (status & STATUS_DRDY) {
        return;
      }
      await this.wait(10);
    }
    throw new Error("STHS34PF80: measurement timeout");
  }

  // TOBJECT_L(0x26)〜TAMBIENT_H(0x29)は連続したレジスタなので、
  // read8を4回に分けず1回のバーストリードで取得する
  async #readTemperatures() {
    if (this.i2cSlave == null) {
      throw new Error("i2cSlave is not open yet.");
    }
    await this.#waitForDataReady();
    await this.i2cSlave.writeByte(TOBJECT_L);
    const raw = await this.i2cSlave.readBytes(4);

    let objectRaw = raw[0] | (raw[1] << 8);
    // Convert unsigned 16-bit to signed 16-bit
    if (objectRaw & 0x8000) {
      objectRaw -= 0x10000;
    }

    let ambientRaw = raw[2] | (raw[3] << 8);
    // Convert unsigned 16-bit to signed 16-bit
    if (ambientRaw & 0x8000) {
      ambientRaw -= 0x10000;
    }

    return { objectRaw, ambientRaw };
  }

  async readObjectTemperatureRaw() {
    const { objectRaw } = await this.#readTemperatures();
    return objectRaw;
  }

  async readAmbientTemperatureRaw() {
    const { ambientRaw } = await this.#readTemperatures();
    return ambientRaw;
  }

  async read() {
    const { objectRaw, ambientRaw } = await this.#readTemperatures();

    return {
      objectTemperatureRaw: objectRaw,
      // TOBJECTの感度(2000 LSB/°C)による簡易換算値。放射率や距離による補正は
      // 行っていないため、厳密な絶対温度ではなく目安として扱うこと。より高精度な
      // 補正が必要な場合はAN5867記載のアルゴリズム(TOBJ_COMP等)を参照
      objectTemperature: objectRaw / TOBJECT_SENSITIVITY,
      ambientTemperatureRaw: ambientRaw,
      ambientTemperature: ambientRaw / 100,
    };
  }
}

export default STHS34PF80;
