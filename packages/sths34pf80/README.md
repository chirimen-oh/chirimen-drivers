# @chirimen/sths34pf80

CHIRIMEN driver for STHS34PF80 (Infrared presence and motion sensor with temperature sensing)

STMicroelectronics製のIRセンサー STHS34PF80 用のCHIRIMENドライバです。
対象物からの赤外線強度（TOBJECT）と周辺温度（TAMBIENT）を取得できます。
STHS34PF80は人感・動体検知（presence/motion detection）を主機能とするセンサーですが、本ドライバは温度読み取り専用です（詳細は下記「対応範囲について」を参照）。

## 主な仕様

| 項目             | 内容                                                                          |
| ---------------- | ----------------------------------------------------------------------------- |
| 型番             | STHS34PF80                                                                    |
| インターフェース | I2C                                                                           |
| I2Cアドレス      | `0x5A`                                                                        |
| 測定項目         | 周辺温度(`ambientTemperature`)、対象物の温度(`objectTemperature`、簡易換算値) |
| 出力データレート | 4Hz（既定。本ドライバでは固定）                                               |

## Installation

```sh
npm install @chirimen/sths34pf80
```

## Usage

```js
import { requestI2CAccess } from "node-web-i2c";
import STHS34PF80 from "@chirimen/sths34pf80";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const i2cAccess = await requestI2CAccess();
const sths34pf80 = new STHS34PF80(i2cAccess.ports.get(1));

await sths34pf80.init();

while (true) {
  const data = await sths34pf80.read();
  console.dir(data);
  await sleep(250);
}
```

## API

### `new STHS34PF80(i2cPort, slaveAddress = 0x5A)`

ドライバのインスタンスを生成します。

- `i2cPort`: `requestI2CAccess()` で取得したI2Cポート
- `slaveAddress`: I2Cアドレス（省略可。デフォルト値: `0x5A`）

### `async init()`

センサーを初期化します。WHO_AM_Iレジスタの値を確認したうえで、BDU（Block Data Update）を有効化し、出力データレート（ODR）を4Hzに設定します。
初期化に失敗した場合は `null` を返します。

### `async readWhoAmI()`

WHO_AM_Iレジスタ（デバイスID、既定値: `0xD3`）の値を取得します。

### `async readStatus()`

STATUSレジスタの値を取得します。bit2がDRDY（新しい測定データの準備完了フラグ）です。

### `async readFunctionStatus()`

FUNC_STATUSレジスタの値を取得します。bit0〜2はそれぞれ周辺温度シェイク・動体検知・人感検知のフラグに対応しますが、本ドライバではこれらの検知アルゴリズムを設定していないため、有効な値は返りません（詳細は下記「対応範囲について」を参照）。

### `async readObjectTemperatureRaw()`

対象物からの赤外線強度の生値（符号付き16bit）を取得します。DRDYが立つまで内部で待機します。

### `async readAmbientTemperatureRaw()`

周辺温度の生値（符号付き16bit、単位: 1/100°C）を取得します。DRDYが立つまで内部で待機します。

### `async read()`

対象物の赤外線強度・周辺温度をまとめて測定し、結果をオブジェクトで返します。

```js
{
  objectTemperatureRaw: number,   // 対象物からの赤外線強度の生値（未変換）
  objectTemperature: number,      // 対象物の温度（°C、簡易換算値）
  ambientTemperatureRaw: number,  // 周辺温度の生値（1/100°C単位）
  ambientTemperature: number      // 周辺温度（°C）
}
```

`objectTemperature`はTOBJECTの感度（2000 LSB/°C）による簡易換算値です。放射率や対象物との距離による補正は行っていないため、厳密な絶対温度ではなく目安として扱ってください。より高精度な補正が必要な場合は、[AN5867](https://www.st.com/resource/en/application_note/an5867-sths34pf80-lowpower-highsensitivity-infrared-ir-sensor-for-presence-and-motion-detection-stmicroelectronics.pdf)記載の補正アルゴリズム（TOBJ_COMPレジスタ等）を参照してください。

## 対応範囲について

STHS34PF80は温度センサーとしてだけでなく、TPRESENCE/TMOTIONレジスタやアルゴリズム設定（CTRL2/CTRL3、しきい値レジスタ等）による人感・動体検知（presence/motion detection）を主機能とするIRセンサーです。
本ドライバはTOBJECT/TAMBIENTの温度読み取りのみに対応しており、人感・動体検知機能には対応していません。これらの機能が必要な場合は、[AN5867](https://www.st.com/resource/en/application_note/an5867-sths34pf80-lowpower-highsensitivity-infrared-ir-sensor-for-presence-and-motion-detection-stmicroelectronics.pdf)を参考に別途アルゴリズム設定を実装してください。

## データシート

- [STHS34PF80 Datasheet](https://www.st.com/resource/en/datasheet/sths34pf80.pdf)

## 参考

- [AN5867: STHS34PF80 low-power, high-sensitivity IR sensor for presence and motion detection](https://www.st.com/resource/en/application_note/an5867-sths34pf80-lowpower-highsensitivity-infrared-ir-sensor-for-presence-and-motion-detection-stmicroelectronics.pdf)
