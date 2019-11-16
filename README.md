# CHIRIMEN Drivers

## Download

### Verified official drivers

- [@chirimen/ads1015](https://www.jsdelivr.com/package/npm/@chirimen/ads1015)
- [@chirimen/adt7410](https://www.jsdelivr.com/package/npm/@chirimen/adt7410)
- [@chirimen/gp2y0e03](https://www.jsdelivr.com/package/npm/@chirimen/gp2y0e03)
- [@chirimen/grove-accelerometer](https://www.jsdelivr.com/package/npm/@chirimen/grove-accelerometer)
- [@chirimen/grove-gesture](https://www.jsdelivr.com/package/npm/@chirimen/grove-gesture)
- [@chirimen/grove-light](https://www.jsdelivr.com/package/npm/@chirimen/grove-light)
- [@chirimen/grove-oled-display](https://www.jsdelivr.com/package/npm/@chirimen/grove-oled-display)
- [@chirimen/grove-touch](https://www.jsdelivr.com/package/npm/@chirimen/grove-touch)
- [@chirimen/pca9685](https://www.jsdelivr.com/package/npm/@chirimen/pca9685)
- [@chirimen/s11059](https://www.jsdelivr.com/package/npm/@chirimen/s11059)
- [@chirimen/veml6070](https://www.jsdelivr.com/package/npm/@chirimen/veml6070)
- [@chirimen/vl53l0x](https://www.jsdelivr.com/package/npm/@chirimen/vl53l0x)

### Contributed drivers

- [@chirimen/ads1x15](https://www.jsdelivr.com/package/npm/@chirimen/ads1x15)
- [@chirimen/ak8963](https://www.jsdelivr.com/package/npm/@chirimen/ak8963)
- [@chirimen/amg8833](https://www.jsdelivr.com/package/npm/@chirimen/amg8833)
- [@chirimen/arduino-stepping-motor](https://www.jsdelivr.com/package/npm/@chirimen/arduino-stepping-motor)
- [@chirimen/bh1750](https://www.jsdelivr.com/package/npm/@chirimen/bh1750)
- [@chirimen/bme280](https://www.jsdelivr.com/package/npm/@chirimen/bme280)
- [@chirimen/bmp180](https://www.jsdelivr.com/package/npm/@chirimen/bmp180)
- [@chirimen/bmp280](https://www.jsdelivr.com/package/npm/@chirimen/bmp280)
- [@chirimen/canzasi](https://www.jsdelivr.com/package/npm/@chirimen/canzasi)
- [@chirimen/mpu6050](https://www.jsdelivr.com/package/npm/@chirimen/mpu6050)
- [@chirimen/mpu6500](https://www.jsdelivr.com/package/npm/@chirimen/mpu6500)
- [@chirimen/neopixel-i2c](https://www.jsdelivr.com/package/npm/@chirimen/neopixel-i2c)
- [@chirimen/pca9685-pwm](https://www.jsdelivr.com/package/npm/@chirimen/pca9685-pwm)
- [@chirimen/pcf8591](https://www.jsdelivr.com/package/npm/@chirimen/pcf8591)
- [@chirimen/sht30](https://www.jsdelivr.com/package/npm/@chirimen/sht30)
- [@chirimen/tcs34725](https://www.jsdelivr.com/package/npm/@chirimen/tcs34725)

## Usage

### In a browser

```html
<script src="https://cdn.jsdelivr.net/npm/@chirimen/adt7410"></script>
```

Using ES Modules:

```js
import ADT7410 from "https://unpkg.com/@chirimen/adt7410?module";
```

### Using Yarn

```sh
yarn add @chirimen/adt7410
```

### Using npm

```sh
npm i @chirimen/adt7410
```

### In Node.js

```js
const ADT7410 = require("@chirimen/adt7410");
```

Using ES Modules:

```js
import ADT7410 from "@chirimen/adt7410";
```

## Documents

- [CHIRIMEN Tutorial](https://r.chirimen.org/tutorial)
- [CHIRIMEN Drivers Documentation](https://chirimen.org/chirimen-drivers/)
- [Web I2C API](https://browserobo.github.io/WebI2C/)

## Build all packages

### Using Yarn

```sh
yarn && yarn build
```

## Release

### Using Yarn

```sh
yarn release
```

### Using npm

```sh
npm run release
```
