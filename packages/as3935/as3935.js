// @ts-check
// AS3935 driver for CHIRIMEN raspberry pi3
// AMS Franklin Lightning Sensor. I2C Sensor
// Ported from https://github.com/pcfens/RaspberryPi-AS3935/blob/master/RPi_AS3935/RPi_AS3935.py
// Reference 1 : https://www.ne.jp/asahi/shared/o-family/ElecRoom/AVRMCOM/AS3935/AS3935_test.html
// Reference 2 : https://www.ishikawa-lab.com/RasPi_lightning.html
//
// Programmed by Satoru Takagi

/** @param {number} ms Delay for a number of milliseconds. */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

var AS3935 = function (i2cPort, slaveAddress) {
    if (!slaveAddress) {
        // 秋月電子 AE-AS3935のアドレスは03です。
        // 標準外のアドレスなので検出には-aオプション必要。i2cdetect -y -a 1
        slaveAddress = 0x03;
    }
    this.i2cPort = i2cPort;
    this.i2cSlave = null;
    this.slaveAddress = slaveAddress;
}

AS3935.prototype = {
    init: async function () {
        this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
    },
    calibrate: async function (tun_cap) {
        /** 
        Calibrate the lightning sensor - this takes up to half a second
        and is blocking.

        The value of tun_cap should be between 0 and 15, and is used to set
        the internal tuning capacitors (0-120pF in steps of 8pF)
        **/
        await sleep(80);
        var reg08 = await this.i2cSlave.read8(0x08);
        if (tun_cap && tun_cap >= 0 && tun_cap < 0x10) {
            await this.i2cSlave.write8(0x08, ((reg08 & 0xf0) | tun_cap));
        } else {
            console.warn("Value of TUN_CAP must be between 0 and 15");
        }
        await this.i2cSlave.write8(0x3D, 0x96);
        await sleep(10);
        reg08 = await this.i2cSlave.read8(0x08);
        await this.i2cSlave.write8(0x08, (reg08 | 0x20));
        await sleep(10);
        reg08 = await this.i2cSlave.read8(0x08);
        await this.i2cSlave.write8(0x08, (reg08 & 0xdf));
        await sleep(10);
    },
    reset: async function () {
        // Reset all registers to their default power on values
        await this.i2cSlave.write8(0x3c, 0x96);
    },
    get_interrupt: async function () {
        /**
        Get the value of the interrupt register
        0x01 - Too much noise
        0x04 - Disturber
        0x08 - Lightning
        **/
        var reg03 = await this.i2cSlave.read8(0x03);
        return (reg03 & 0x0f);
    },
    get_distance: async function () {
        // Get the estimated distance of the most recent lightning event
        var reg07 = await this.i2cSlave.read8(0x07);
        if ((reg07 & 0x3f) == 0x3f) {
            return false;
        } else {
            return (reg07 & 0x3f);
        }
    },
    get_energy: async function () {
        // Get the calculated energy of the most recent lightning event
        var reg04 = await this.i2cSlave.read8(0x04);
        var reg05 = await this.i2cSlave.read8(0x05);
        var reg06 = await this.i2cSlave.read8(0x06);
        return ((reg06 & 0x1f) << 16 | reg05 << 8 | reg04);
    },
    get_noise_floor: async function () {
        // Get the noise floor value.
        // Actual voltage levels used in the sensor are located in Table 16 of the data sheet.
        var reg01 = await this.i2cSlave.read8(0x01);
        return ((reg01 & 0x70) >> 4);
    },
    set_noise_floor: async function (noisefloor) {
        // Set the noise floor value.
        // Actual voltage levels used in the sensor are located in Table 16 of the data sheet.
        noisefloor = (noisefloor & 0x07) << 4;
        var reg01 = await this.i2cSlave.read8(0x01);
        var write_data = (reg01 & 0x8f) + noisefloor;
        await this.i2cSlave.write8(0x01, write_data);
    },
    lower_noise_floor: async function (min_noise) {
        // Lower the noise floor by one step.
        // min_noise is the minimum step that the noise_floor should be lowered to.
        if (!min_noise) { min_noise = 0 }
        var floor = await this.get_noise_floor();
        if (floor > min_noise) {
            --floor;
            await this.set_noise_floor(floor);
        }
        return floor;
    },
    raise_noise_floor: async function (max_noise) {
        // Raise the noise floor by one step
        // max_noise is the maximum step that the noise_floor should be raised to.
        if (!max_noise) { max_noise = 7 }
        var floor = await this.get_noise_floor();
        if (floor < max_noise) {
            ++floor;
            await this.set_noise_floor(floor);
        }
        return floor;
    },
    get_min_strikes: async function () {
        // Get the number of lightning detections required before an interrupt is raised.
        var reg02 = await this.i2cSlave.read8(0x02);
        var value = (reg02 >> 4) & 0x03;
        if (value == 0) {
            return 1;
        } else if (value == 1) {
            return 5;
        } else if (value == 2) {
            return 9;
        } else if (value == 3) {
            return 16;
        }
    },
    set_min_strikes: async function (minstrikes) {
        // Set the number of lightning detections required before an interrupt is raised.
        // Valid values are 1, 5, 9, and 16, any other raises an exception.

        if (minstrikes == 1) {
            minstrikes = 0
        } else if (minstrikes == 5) {
            minstrikes = 1
        } else if (minstrikes == 9) {
            minstrikes = 2
        } else if (minstrikes == 16) {
            minstrikes = 3
        } else {
            console.error("Value must be 1, 5, 9, or 16");
            return;
        }
        var reg02 = await this.i2cSlave.read8(0x02);
        var write_data = (reg02 & 0xCF) + minstrikes;
        await this.i2cSlave.write8(0x02, write_data);
    },
    get_indoors: async function () {
        // Determine whether or not the sensor is configured for indoor use or not.
        // Returns True if configured to be indoors, otherwise False.
        var reg00 = await this.i2cSlave.read8(0x00);
        if ((reg00 & 0x20) == 0x20) {
            return true;
        } else {
            return false;
        }
    },
    set_indoors: async function (indoors) {
        // Set whether or not the sensor should use an indoor configuration.
        var write_value;
        var reg00 = await this.i2cSlave.read8(0x00);
        if (indoors) {
            write_value = (reg00 & 0xc1) | 0x24;
        } else {
            write_value = (reg00 & 0xc1) | 0x1c;
        }
        await this.i2cSlave.write8(0x00, write_value);
    },
    set_mask_disturber: async function (mask_dist) {
        // Set whether or not disturbers should be masked (no interrupts for what the sensor determines are man-made events)
        var reg03 = await this.i2cSlave.read8(0x03);
        var write_value;
        if (mask_dist) {
            write_value = reg03 | 0x20;
        } else {
            write_value = reg03 | 0xdf;
        }
        await this.i2cSlave.write8(0x03, write_value);
    },
    get_mask_disturber: async function () {
        // Get whether or not disturbers are masked or not.
        // Returns True if interrupts are masked, false otherwise
        var reg03 = await this.i2cSlave.read8(0x03);
        if ((reg03 & 0x20) == 0x20) {
            return true;
        } else {
            return false;
        }
    },
    set_disp_lco: async function (display_lco) {
        // Have the internal LC oscillator signal displayed on the interrupt pin for measurement.
        // Passing display_lco=True enables the output, False disables it.
        var reg08 = await this.i2cSlave.read8(0x08);
        if (display_lco) {
            await this.i2cSlave.write8(0x08, (reg08 | 0x80));
        } else {
            await this.i2cSlave.write8(0x08, (reg08 & 0x7f));
        }
        await sleep(10);
    },
    get_disp_lco: async function () {
        // Determine whether or not the internal LC oscillator is displayed on the interrupt pin.
        // Returns True if the LC oscillator is being displayed on the interrupt pin, False otherwise
        var reg08 = await this.i2cSlave.read8(0x08);
        if ((reg08 & 0x80) == 0x80) {
            return true;
        } else {
            return false;
        }
    }
};

export default AS3935;
