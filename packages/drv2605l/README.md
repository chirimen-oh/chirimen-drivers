# DRV2605L

DRV2605L is a haptic motor driver controlled via I2C.

This CHIRIMEN driver supports ERM vibration motors and provides built-in waveform playback and Real-Time Playback (RTP) vibration control.

## Specifications

- Device: DRV2605L
- Interface: I2C
- Default I2C address: `0x5A`
- Supported motor type: ERM
- Built-in waveform effects: 1–123
- RTP vibration strength: 0–127

## Installation

```bash
npm install @chirimen/drv2605l
```

## Usage

```js
import { requestI2CAccess } from "node-web-i2c";
import DRV2605L from "@chirimen/drv2605l";

const i2cAccess = await requestI2CAccess();
const i2cPort = i2cAccess.ports.get(1);

const motor = new DRV2605L(i2cPort, 0x5a);

await motor.init();

// Vibrate with strength 80 for 400 ms
await motor.vibrate(80, 400);
```

## API

### `constructor(i2cPort, slaveAddress)`

Creates a DRV2605L driver instance.

- `i2cPort`: I2C port instance
- `slaveAddress`: I2C slave address. Defaults to `0x5A`

### `init()`

Initializes the DRV2605L for an ERM vibration motor.

The driver uses the ERM effect library and configures the device for open-loop ERM operation.

### `playEffect(effect = 1)`

Plays one of the DRV2605L built-in waveform effects.

- `effect`: Effect number from `1` to `123`

Example:

```js
await motor.playEffect(1);
```

### `vibrate(strength = 100, duration = 200)`

Vibrates the motor using Real-Time Playback (RTP) mode.

- `strength`: Vibration strength from `0` to `127`
- `duration`: Duration in milliseconds

Example:

```js
await motor.vibrate(80, 400);
```

### `stop()`

Stops waveform playback and RTP vibration.

Example:

```js
await motor.stop();
```

## Datasheet

Texas Instruments DRV2605L product page:

https://www.ti.com/product/DRV2605L
