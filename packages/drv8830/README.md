# DRV8830

DRV8830は、I2Cで制御する低電圧モータードライバーICです。

このCHIRIMENドライバーはブラシ付きDCモーター1個をHブリッジで駆動します。APIには電圧（V）を指定するだけで、IC内蔵のPWMレギュレーターがその電圧になるよう自動調整するため、電源電圧が変動してもモーター速度を一定に保てます（正転・逆転・ブレーキ・停止）。フォルト状態の読み取りにも対応しています。

## 仕様

- デバイス: DRV8830
- インターフェイス: I2C
- デフォルトI2Cアドレス: `0x64`（アドレスピンA0・A1の設定により`0x60`〜`0x68`の範囲で変更可能）
- 動作電源電圧: 2.75V〜6.8V
- 出力電圧範囲: 約0V〜5.06V（64段階、約0.08V刻み）
- 最大出力電流: 1A（連続）

## インストール

```bash
npm install @chirimen/drv8830
```

## 使用方法

```js
import { requestI2CAccess } from "node-web-i2c";
import DRV8830 from "@chirimen/drv8830";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const i2cAccess = await requestI2CAccess();
const motor = new DRV8830(i2cAccess.ports.get(1));
await motor.init();
await motor.forward(); // 正転
await sleep(1000);
await motor.reverse(); // 逆転
await sleep(1000);
await motor.stop(); // 停止
await motor.clearFault();
```

## API

### `constructor(i2cPort, slaveAddress)`

DRV8830ドライバーのインスタンスを生成します。

- `i2cPort`: I2Cポートのインスタンス
- `slaveAddress`: I2Cスレーブアドレス。省略時は `0x64`

### `init()`

I2C接続を開始します。

### `forward(voltage = 3)`

モーターを正転方向に駆動します。

- `voltage`: 出力電圧を0以上の数値（V）で指定します。デフォルト値は `3` です。内部で最も近い64段階のいずれかに丸められ、最大値（約`5.06`V）を超える値は最大値にクランプされます。

例:

```js
await motor.forward(3);
```

### `reverse(voltage = 3)`

モーターを逆転方向に駆動します。

- `voltage`: 出力電圧を0以上の数値（V）で指定します。デフォルト値は `3` です。内部で最も近い64段階のいずれかに丸められ、最大値（約`5.06`V）を超える値は最大値にクランプされます。

例:

```js
await motor.reverse(3);
```

### `brake()`

モーターの両出力をHighにしてショートブレーキをかけます。

例:

```js
await motor.brake();
```

### `stop()`

モーターの出力をハイインピーダンス状態にして停止（コースト）します。

例:

```js
await motor.stop();
```

### `readFault()`

FAULTレジスタを読み取り、フォルト状態を返します。

戻り値は次のプロパティを持つオブジェクトです。

- `fault`: いずれかのフォルトが発生している場合`true`
- `ocp`: 過電流（Overcurrent Protection）が発生した場合`true`
- `uvlo`: 低電圧誤動作防止（Undervoltage Lockout）が発生した場合`true`
- `ots`: 過熱（Overtemperature Shutdown）が発生した場合`true`
- `ilimit`: 電流制限状態が継続した場合`true`

例:

```js
const fault = await motor.readFault();
if (fault.fault) {
  console.log(fault);
}
```

### `clearFault()`

FAULTレジスタのフォルト状態をクリアします。

例:

```js
await motor.clearFault();
```

## データシート

Texas Instruments DRV8830:

https://www.ti.com/lit/ds/symlink/drv8830.pdf
