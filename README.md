# CHIRIMEN Drivers

[![release](https://github.com/chirimen-oh/chirimen-drivers/actions/workflows/release.yml/badge.svg)](https://github.com/chirimen-oh/chirimen-drivers/actions/workflows/release.yml)

## Download

- [@chirimen/ads1015](https://www.jsdelivr.com/package/npm/@chirimen/ads1015)
- [@chirimen/ads1x15](https://www.jsdelivr.com/package/npm/@chirimen/ads1x15)
- [@chirimen/adt7410](https://www.jsdelivr.com/package/npm/@chirimen/adt7410)
- [@chirimen/aht10](https://www.jsdelivr.com/package/npm/@chirimen/aht10)
- [@chirimen/ahtx0](https://www.jsdelivr.com/package/npm/@chirimen/ahtx0)
- [@chirimen/ak8963](https://www.jsdelivr.com/package/npm/@chirimen/ak8963)
- [@chirimen/amg8833](https://www.jsdelivr.com/package/npm/@chirimen/amg8833)
- [@chirimen/apds9960](https://www.jsdelivr.com/package/npm/@chirimen/apds9960)
- [@chirimen/arduino-stepping-motor](https://www.jsdelivr.com/package/npm/@chirimen/arduino-stepping-motor)
- [@chirimen/as3935](https://www.jsdelivr.com/package/npm/@chirimen/as3935)
- [@chirimen/as5600](https://www.jsdelivr.com/package/npm/@chirimen/as5600)
- [@chirimen/bh1750](https://www.jsdelivr.com/package/npm/@chirimen/bh1750)
- [@chirimen/bme280](https://www.jsdelivr.com/package/npm/@chirimen/bme280)
- [@chirimen/bme680](https://www.jsdelivr.com/package/npm/@chirimen/bme680)
- [@chirimen/bmp180](https://www.jsdelivr.com/package/npm/@chirimen/bmp180)
- [@chirimen/bmp280](https://www.jsdelivr.com/package/npm/@chirimen/bmp280)
- [@chirimen/canzasi](https://www.jsdelivr.com/package/npm/@chirimen/canzasi)
- [@chirimen/ccs811](https://www.jsdelivr.com/package/npm/@chirimen/ccs811)
- [@chirimen/ens160](https://www.jsdelivr.com/package/npm/@chirimen/ens160)
- [@chirimen/gp2y0e03](https://www.jsdelivr.com/package/npm/@chirimen/gp2y0e03)
- [@chirimen/grove-accelerometer](https://www.jsdelivr.com/package/npm/@chirimen/grove-accelerometer)
- [@chirimen/grove-gesture](https://www.jsdelivr.com/package/npm/@chirimen/grove-gesture)
- [@chirimen/grove-light](https://www.jsdelivr.com/package/npm/@chirimen/grove-light)
- [@chirimen/grove-oled-display](https://www.jsdelivr.com/package/npm/@chirimen/grove-oled-display)
- [@chirimen/grove-touch](https://www.jsdelivr.com/package/npm/@chirimen/grove-touch)
- [@chirimen/grove-water-level-sensor](https://www.jsdelivr.com/package/npm/@chirimen/grove-water-level-sensor)
- [@chirimen/ht16k33](https://www.jsdelivr.com/package/npm/@chirimen/ht16k33)
- [@chirimen/htu21d](https://www.jsdelivr.com/package/npm/@chirimen/htu21d)
- [@chirimen/icm20948](https://www.jsdelivr.com/package/npm/@chirimen/icm20948)
- [@chirimen/ina219](https://www.jsdelivr.com/package/npm/@chirimen/ina219)
- [@chirimen/ltr390](https://www.jsdelivr.com/package/npm/@chirimen/ltr390)
- [@chirimen/max30102](https://www.jsdelivr.com/package/npm/@chirimen/max30102)
- [@chirimen/mcp9808](https://www.jsdelivr.com/package/npm/@chirimen/mcp9808)
- [@chirimen/mlx90614](https://www.jsdelivr.com/package/npm/@chirimen/mlx90614)
- [@chirimen/mma7660](https://www.jsdelivr.com/package/npm/@chirimen/mma7660)
- [@chirimen/mpu6050](https://www.jsdelivr.com/package/npm/@chirimen/mpu6050)
- [@chirimen/mpu6500](https://www.jsdelivr.com/package/npm/@chirimen/mpu6500)
- [@chirimen/neopixel-i2c](https://www.jsdelivr.com/package/npm/@chirimen/neopixel-i2c)
- [@chirimen/pca9685](https://www.jsdelivr.com/package/npm/@chirimen/pca9685)
- [@chirimen/pca9685-pwm](https://www.jsdelivr.com/package/npm/@chirimen/pca9685-pwm)
- [@chirimen/pcf8591](https://www.jsdelivr.com/package/npm/@chirimen/pcf8591)
- [@chirimen/qrcodescanner](https://www.jsdelivr.com/package/npm/@chirimen/qrcodescanner)
- [@chirimen/rc522_ws1850s](https://www.jsdelivr.com/package/npm/@chirimen/rc522_ws1850s)
- [@chirimen/s11059](https://www.jsdelivr.com/package/npm/@chirimen/s11059)
- [@chirimen/scd40](https://www.jsdelivr.com/package/npm/@chirimen/scd40)
- [@chirimen/seesaw](https://www.jsdelivr.com/package/npm/@chirimen/seesaw)
- [@chirimen/sgp40](https://www.jsdelivr.com/package/npm/@chirimen/sgp40)
- [@chirimen/sht30](https://www.jsdelivr.com/package/npm/@chirimen/sht30)
- [@chirimen/sht40](https://www.jsdelivr.com/package/npm/@chirimen/sht40)
- [@chirimen/tca9548a](https://www.jsdelivr.com/package/npm/@chirimen/tca9548a)
- [@chirimen/tcs34725](https://www.jsdelivr.com/package/npm/@chirimen/tcs34725)
- [@chirimen/tsl2591](https://www.jsdelivr.com/package/npm/@chirimen/tsl2591)
- [@chirimen/veml6070](https://www.jsdelivr.com/package/npm/@chirimen/veml6070)
- [@chirimen/vl53l0x](https://www.jsdelivr.com/package/npm/@chirimen/vl53l0x)
- [@chirimen/vl53l1x](https://www.jsdelivr.com/package/npm/@chirimen/vl53l1x)
- [@chirimen/vl6180x](https://www.jsdelivr.com/package/npm/@chirimen/vl6180x)

## Usage

### Node.js

```
$ npm i chirimen
```

```js
import { requestI2CAccess, ADT7410 } from "chirimen";

const i2cAccess = await requestI2CAccess();
const adt7410 = new ADT7410(i2cAccess.ports.get(1), 0x48);
await adt7410.init();
await adt7410.read();
```

### Deno

```js
import { requestI2CAccess, ADT7410 } from "npm:chirimen";
```

## Documents

- [CHIRIMEN Tutorial](https://r.chirimen.org/tutorial)
- [CHIRIMEN Drivers Documentation](https://chirimen.org/chirimen-drivers/)
- [Web I2C API](https://browserobo.github.io/WebI2C/)

## [Contributing Guidelines](https://chirimen.org/chirimen-drivers/CONTRIBUTING)

- [リリース方法](https://chirimen.org/chirimen-drivers/CONTRIBUTING#%E3%83%AA%E3%83%AA%E3%83%BC%E3%82%B9%E6%96%B9%E6%B3%95)
