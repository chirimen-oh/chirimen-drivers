// ICM20948 driver for WebI2C
// https://www.waveshare.com/wiki/Environment_Sensor_HAT
// の
// https://files.waveshare.com/upload/b/bc/Environment_Sensor_HAT_Code.7z
// をベースに移植
// 2023/12/13 Ported by Satoru Takagi

var ICM20948 = function (i2cPort, slaveAddress) {
	this.I2C_ADD_ICM20948 = 0x68;
	if (!slaveAddress) {
		slaveAddress = this.I2C_ADD_ICM20948;
	}
	this.i2cPort = i2cPort;
	this.i2cSlave = null;
	this.slaveAddress = slaveAddress;

	// consts
	this.Gyro = [0, 0, 0];
	this.Accel = [0, 0, 0];
	this.Mag = [0, 0, 0];
	this.pitch = 0.0;
	this.roll = 0.0;
	this.yaw = 0.0;
	this.pu8data = [0, 0, 0, 0, 0, 0, 0, 0];
	this.U8tempX = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	this.U8tempY = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	this.U8tempZ = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	this.GyroOffset = [0, 0, 0];
	this.Ki = 1.0;
	this.Kp = 4.5;
	this.q0 = 1.0;
	this.q1 = 0.0;
	this.q2 = 0.0;
	this.q3 = 0.0;
	this.angles = [0.0, 0.0, 0.0];
	this.true = 0x01;
	this.false = 0x00;
	// define ICM-20948 Device I2C address
	this.I2C_ADD_ICM20948_AK09916 = 0x0c;
	this.I2C_ADD_ICM20948_AK09916_READ = 0x80;
	this.I2C_ADD_ICM20948_AK09916_WRITE = 0x00;
	// define ICM-20948 Register
	// user bank 0 register
	this.REG_ADD_WIA = 0x00;
	this.REG_VAL_WIA = 0xea;
	this.REG_ADD_USER_CTRL = 0x03;
	this.REG_VAL_BIT_DMP_EN = 0x80;
	this.REG_VAL_BIT_FIFO_EN = 0x40;
	this.REG_VAL_BIT_I2C_MST_EN = 0x20;
	this.REG_VAL_BIT_I2C_IF_DIS = 0x10;
	this.REG_VAL_BIT_DMP_RST = 0x08;
	this.REG_VAL_BIT_DIAMOND_DMP_RST = 0x04;
	this.REG_ADD_PWR_MIGMT_1 = 0x06;
	this.REG_VAL_ALL_RGE_RESET = 0x80;
	this.REG_VAL_RUN_MODE = 0x01; // Non low-power mode
	this.REG_ADD_LP_CONFIG = 0x05;
	this.REG_ADD_PWR_MGMT_1 = 0x06;
	this.REG_ADD_PWR_MGMT_2 = 0x07;
	this.REG_ADD_ACCEL_XOUT_H = 0x2d;
	this.REG_ADD_ACCEL_XOUT_L = 0x2e;
	this.REG_ADD_ACCEL_YOUT_H = 0x2f;
	this.REG_ADD_ACCEL_YOUT_L = 0x30;
	this.REG_ADD_ACCEL_ZOUT_H = 0x31;
	this.REG_ADD_ACCEL_ZOUT_L = 0x32;
	this.REG_ADD_GYRO_XOUT_H = 0x33;
	this.REG_ADD_GYRO_XOUT_L = 0x34;
	this.REG_ADD_GYRO_YOUT_H = 0x35;
	this.REG_ADD_GYRO_YOUT_L = 0x36;
	this.REG_ADD_GYRO_ZOUT_H = 0x37;
	this.REG_ADD_GYRO_ZOUT_L = 0x38;
	this.REG_ADD_EXT_SENS_DATA_00 = 0x3b;
	this.REG_ADD_REG_BANK_SEL = 0x7f;
	this.REG_VAL_REG_BANK_0 = 0x00;
	this.REG_VAL_REG_BANK_1 = 0x10;
	this.REG_VAL_REG_BANK_2 = 0x20;
	this.REG_VAL_REG_BANK_3 = 0x30;

	// user bank 1 register
	// user bank 2 register
	this.REG_ADD_GYRO_SMPLRT_DIV = 0x00;
	this.REG_ADD_GYRO_CONFIG_1 = 0x01;
	this.REG_VAL_BIT_GYRO_DLPCFG_2 = 0x10; // bit[5:3]
	this.REG_VAL_BIT_GYRO_DLPCFG_4 = 0x20; // bit[5:3]
	this.REG_VAL_BIT_GYRO_DLPCFG_6 = 0x30; // bit[5:3]
	this.REG_VAL_BIT_GYRO_FS_250DPS = 0x00; // bit[2:1]
	this.REG_VAL_BIT_GYRO_FS_500DPS = 0x02; // bit[2:1]
	this.REG_VAL_BIT_GYRO_FS_1000DPS = 0x04; // bit[2:1]
	this.REG_VAL_BIT_GYRO_FS_2000DPS = 0x06; // bit[2:1]
	this.REG_VAL_BIT_GYRO_DLPF = 0x01; // bit[0]
	this.REG_ADD_ACCEL_SMPLRT_DIV_2 = 0x11;
	this.REG_ADD_ACCEL_CONFIG = 0x14;
	this.REG_VAL_BIT_ACCEL_DLPCFG_2 = 0x10; // bit[5:3]
	this.REG_VAL_BIT_ACCEL_DLPCFG_4 = 0x20; // bit[5:3]
	this.REG_VAL_BIT_ACCEL_DLPCFG_6 = 0x30; // bit[5:3]
	this.REG_VAL_BIT_ACCEL_FS_2g = 0x00; // bit[2:1]
	this.REG_VAL_BIT_ACCEL_FS_4g = 0x02; // bit[2:1]
	this.REG_VAL_BIT_ACCEL_FS_8g = 0x04; // bit[2:1]
	this.REG_VAL_BIT_ACCEL_FS_16g = 0x06; // bit[2:1]
	this.REG_VAL_BIT_ACCEL_DLPF = 0x01; // bit[0]

	// user bank 3 register
	this.REG_ADD_I2C_SLV0_ADDR = 0x03;
	this.REG_ADD_I2C_SLV0_REG = 0x04;
	this.REG_ADD_I2C_SLV0_CTRL = 0x05;
	this.REG_VAL_BIT_SLV0_EN = 0x80;
	this.REG_VAL_BIT_MASK_LEN = 0x07;
	this.REG_ADD_I2C_SLV0_DO = 0x06;
	this.REG_ADD_I2C_SLV1_ADDR = 0x07;
	this.REG_ADD_I2C_SLV1_REG = 0x08;
	this.REG_ADD_I2C_SLV1_CTRL = 0x09;
	this.REG_ADD_I2C_SLV1_DO = 0x0a;

	// define ICM-20948 Register  end

	// define ICM-20948 MAG Register
	this.REG_ADD_MAG_WIA1 = 0x00;
	this.REG_VAL_MAG_WIA1 = 0x48;
	this.REG_ADD_MAG_WIA2 = 0x01;
	this.REG_VAL_MAG_WIA2 = 0x09;
	this.REG_ADD_MAG_ST2 = 0x10;
	this.REG_ADD_MAG_DATA = 0x11;
	this.REG_ADD_MAG_CNTL2 = 0x31;
	this.REG_VAL_MAG_MODE_PD = 0x00;
	this.REG_VAL_MAG_MODE_SM = 0x01;
	this.REG_VAL_MAG_MODE_10HZ = 0x02;
	this.REG_VAL_MAG_MODE_20HZ = 0x04;
	this.REG_VAL_MAG_MODE_50HZ = 0x05;
	this.REG_VAL_MAG_MODE_100HZ = 0x08;
	this.REG_VAL_MAG_MODE_ST = 0x10;
	// define ICM-20948 MAG Register  end

	this.MAG_DATA_LEN = 6;
};

ICM20948.prototype = {
	sleep: function (ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	},
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

		this._address = this.slaveAddress;
		var bRet = await this.icm20948Check(); //Initialization of the device multiple times after power on will result in a return error
		await this.sleep(500); //We can skip this detection by delaying it by 500 milliseconds
		// user bank 0 register
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0);
		await this._write_byte(
			this.REG_ADD_PWR_MIGMT_1,
			this.REG_VAL_ALL_RGE_RESET
		);
		await this.sleep(100);
		await this._write_byte(this.REG_ADD_PWR_MIGMT_1, this.REG_VAL_RUN_MODE);
		// user bank 2 register
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_2);
		await this._write_byte(this.REG_ADD_GYRO_SMPLRT_DIV, 0x07);
		await this._write_byte(
			this.REG_ADD_GYRO_CONFIG_1,
			this.REG_VAL_BIT_GYRO_DLPCFG_6 |
				this.REG_VAL_BIT_GYRO_FS_1000DPS |
				this.REG_VAL_BIT_GYRO_DLPF
		);
		await this._write_byte(this.REG_ADD_ACCEL_SMPLRT_DIV_2, 0x07);
		await this._write_byte(
			this.REG_ADD_ACCEL_CONFIG,
			this.REG_VAL_BIT_ACCEL_DLPCFG_6 |
				this.REG_VAL_BIT_ACCEL_FS_2g |
				this.REG_VAL_BIT_ACCEL_DLPF
		);
		// user bank 0 register
		this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0);
		await this.sleep(100);
		await this.GyroOffsetF();
		await this.MagCheck();
		await this.WriteSecondary(
			this.I2C_ADD_ICM20948_AK09916 | this.I2C_ADD_ICM20948_AK09916_WRITE,
			this.REG_ADD_MAG_CNTL2,
			this.REG_VAL_MAG_MODE_20HZ
		);
	},

	Gyro_Accel_Read: async function () {
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0);
		var data = await this._read_block(this.REG_ADD_ACCEL_XOUT_H, 12);
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_2);
		this.Accel[0] = (data[0] << 8) | data[1];
		this.Accel[1] = (data[2] << 8) | data[3];
		this.Accel[2] = (data[4] << 8) | data[5];
		this.Gyro[0] = ((data[6] << 8) | data[7]) - this.GyroOffset[0];
		this.Gyro[1] = ((data[8] << 8) | data[9]) - this.GyroOffset[1];
		this.Gyro[2] = ((data[10] << 8) | data[11]) - this.GyroOffset[2];
		if (this.Accel[0] >= 32767) {
			//Solve the problem that Python shift will not overflow
			this.Accel[0] = this.Accel[0] - 65535;
		} else if (this.Accel[0] <= -32767) {
			this.Accel[0] = this.Accel[0] + 65535;
		}
		if (this.Accel[1] >= 32767) {
			this.Accel[1] = this.Accel[1] - 65535;
		} else if (this.Accel[1] <= -32767) {
			this.Accel[1] = this.Accel[1] + 65535;
		}
		if (this.Accel[2] >= 32767) {
			this.Accel[2] = this.Accel[2] - 65535;
		} else if (this.Accel[2] <= -32767) {
			this.Accel[2] = this.Accel[2] + 65535;
		}
		if (this.Gyro[0] >= 32767) {
			this.Gyro[0] = this.Gyro[0] - 65535;
		} else if (this.Gyro[0] <= -32767) {
			this.Gyro[0] = this.Gyro[0] + 65535;
		}
		if (this.Gyro[1] >= 32767) {
			this.Gyro[1] = this.Gyro[1] - 65535;
		} else if (this.Gyro[1] <= -32767) {
			this.Gyro[1] = this.Gyro[1] + 65535;
		}
		if (this.Gyro[2] >= 32767) {
			this.Gyro[2] = this.Gyro[2] - 65535;
		} else if (this.Gyro[2] <= -32767) {
			this.Gyro[2] = this.Gyro[2] + 65535;
		}
	},

	MagRead: async function () {
		var counter = 20;
		while (counter > 0) {
			await this.sleep(10);
			await this.icm20948ReadSecondary(
				this.I2C_ADD_ICM20948_AK09916 | this.I2C_ADD_ICM20948_AK09916_READ,
				this.REG_ADD_MAG_ST2,
				1
			);
			if ((this.pu8data[0] & 0x01) != 0) {
				break;
			}
			counter -= 1;
		}
		if (counter != 0) {
			for (var i = 0; i < 8; i++) {
				await this.icm20948ReadSecondary(
					this.I2C_ADD_ICM20948_AK09916 | this.I2C_ADD_ICM20948_AK09916_READ,
					this.REG_ADD_MAG_DATA,
					this.MAG_DATA_LEN
				);
				this.U8tempX[i] = (this.pu8data[1] << 8) | this.pu8data[0];
				this.U8tempY[i] = (this.pu8data[3] << 8) | this.pu8data[2];
				this.U8tempZ[i] = (this.pu8data[5] << 8) | this.pu8data[4];
			}
			this.Mag[0] =
				(this.U8tempX[0] +
					this.U8tempX[1] +
					this.U8tempX[2] +
					this.U8tempX[3] +
					this.U8tempX[4] +
					this.U8tempX[5] +
					this.U8tempX[6] +
					this.U8tempX[7]) /
				8;
			this.Mag[1] =
				-(
					this.U8tempY[0] +
					this.U8tempY[1] +
					this.U8tempY[2] +
					this.U8tempY[3] +
					this.U8tempY[4] +
					this.U8tempY[5] +
					this.U8tempY[6] +
					this.U8tempY[7]
				) / 8;
			this.Mag[2] =
				-(
					this.U8tempZ[0] +
					this.U8tempZ[1] +
					this.U8tempZ[2] +
					this.U8tempZ[3] +
					this.U8tempZ[4] +
					this.U8tempZ[5] +
					this.U8tempZ[6] +
					this.U8tempZ[7]
				) / 8;
		}
		if (this.Mag[0] >= 32767) {
			//Solve the problem that Python shift will not overflow
			this.Mag[0] = this.Mag[0] - 65535;
		} else if (this.Mag[0] <= -32767) {
			this.Mag[0] = this.Mag[0] + 65535;
		}
		if (this.Mag[1] >= 32767) {
			this.Mag[1] = this.Mag[1] - 65535;
		} else if (this.Mag[1] <= -32767) {
			this.Mag[1] = this.Mag[1] + 65535;
		}
		if (this.Mag[2] >= 32767) {
			this.Mag[2] = this.Mag[2] - 65535;
		} else if (this.Mag[2] <= -32767) {
			this.Mag[2] = this.Mag[2] + 65535;
		}
	},

	icm20948ReadSecondary: async function (u8I2CAddr, u8RegAddr, u8Len) {
		var u8Temp = 0;
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_3); //swtich bank3
		await this._write_byte(this.REG_ADD_I2C_SLV0_ADDR, u8I2CAddr);
		await this._write_byte(this.REG_ADD_I2C_SLV0_REG, u8RegAddr);
		await this._write_byte(
			this.REG_ADD_I2C_SLV0_CTRL,
			this.REG_VAL_BIT_SLV0_EN | u8Len
		);

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0); //swtich bank0

		u8Temp = await this._read_byte(this.REG_ADD_USER_CTRL);
		u8Temp |= this.REG_VAL_BIT_I2C_MST_EN;
		await this._write_byte(this.REG_ADD_USER_CTRL, u8Temp);
		await this.sleep(10);
		u8Temp &= ~this.REG_VAL_BIT_I2C_MST_EN;
		await this._write_byte(this.REG_ADD_USER_CTRL, u8Temp);

		for (var i = 0; i < u8Len; i++) {
			this.pu8data[i] = await this._read_byte(
				this.REG_ADD_EXT_SENS_DATA_00 + i
			);
		}

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_3); //swtich bank3

		u8Temp = await this._read_byte(this.REG_ADD_I2C_SLV0_CTRL);
		u8Temp &= ~(this.REG_VAL_BIT_I2C_MST_EN & this.REG_VAL_BIT_MASK_LEN);
		await this._write_byte(this.REG_ADD_I2C_SLV0_CTRL, u8Temp);

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0); //swtich bank0
	},

	WriteSecondary: async function (u8I2CAddr, u8RegAddr, u8data) {
		var u8Temp = 0;
		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_3); //swtich bank3
		await this._write_byte(this.REG_ADD_I2C_SLV1_ADDR, u8I2CAddr);
		await this._write_byte(this.REG_ADD_I2C_SLV1_REG, u8RegAddr);
		await this._write_byte(this.REG_ADD_I2C_SLV1_DO, u8data);
		await this._write_byte(
			this.REG_ADD_I2C_SLV1_CTRL,
			this.REG_VAL_BIT_SLV0_EN | 1
		);

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0); //swtich bank0

		u8Temp = await this._read_byte(this.REG_ADD_USER_CTRL);
		u8Temp |= this.REG_VAL_BIT_I2C_MST_EN;
		await this._write_byte(this.REG_ADD_USER_CTRL, u8Temp);
		await this.sleep(10);
		u8Temp &= ~this.REG_VAL_BIT_I2C_MST_EN;
		await this._write_byte(this.REG_ADD_USER_CTRL, u8Temp);

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_3); //swtich bank3

		u8Temp = await this._read_byte(this.REG_ADD_I2C_SLV0_CTRL);
		u8Temp &= ~(this.REG_VAL_BIT_I2C_MST_EN & this.REG_VAL_BIT_MASK_LEN);
		await this._write_byte(this.REG_ADD_I2C_SLV0_CTRL, u8Temp);

		await this._write_byte(this.REG_ADD_REG_BANK_SEL, this.REG_VAL_REG_BANK_0); //swtich bank0
	},

	GyroOffsetF: async function () {
		var s32TempGx = 0;
		var s32TempGy = 0;
		var s32TempGz = 0;
		for (var i = 0; i < 32; i++) {
			await this.Gyro_Accel_Read();
			s32TempGx += this.Gyro[0];
			s32TempGy += this.Gyro[1];
			s32TempGz += this.Gyro[2];
			await this.sleep(10);
		}
		this.GyroOffset[0] = s32TempGx >> 5;
		this.GyroOffset[1] = s32TempGy >> 5;
		this.GyroOffset[2] = s32TempGz >> 5;
	},

	_read_byte: async function (cmd) {
		return await this.i2cSlave.read8(cmd);
	},
	_read_block: async function (reg, length) {
		await this.i2cSlave.writeByte(reg);
		return await this.i2cSlave.readBytes(length);
	},
	_read_u16: async function (cmd) {
		var LSB = await this.i2cSlave.read8(cmd);
		var MSB = await this.i2cSlave.read8(cmd + 1);
		return (MSB << 8) + LSB;
	},

	_write_byte: async function (cmd, val) {
		await this.i2cSlave.write8(cmd, val);
	},

	imuAHRSupdata: function (gx, gy, gz, ax, ay, az, mx, my, mz) {
		var norm = 0.0;
		var hx = 0,
			hy = 0,
			hz = 0,
			bx = 0,
			bz = 0.0;
		var vx = 0,
			vy = 0,
			vz = 0,
			wx = 0,
			wy = 0,
			wz = 0.0;
		var exInt = 0,
			eyInt = 0,
			ezInt = 0.0;
		var ex = 0,
			ey = 0,
			ez = 0.0;
		var halfT = 0.024;
		/**
		    global q0
		    global q1
		    global q2
		    global q3
		**/
		var q0q0 = this.q0 * this.q0;
		var q0q1 = this.q0 * this.q1;
		var q0q2 = this.q0 * this.q2;
		var q0q3 = this.q0 * this.q3;
		var q1q1 = this.q1 * this.q1;
		var q1q2 = this.q1 * this.q2;
		var q1q3 = this.q1 * this.q3;
		var q2q2 = this.q2 * this.q2;
		var q2q3 = this.q2 * this.q3;
		var q3q3 = this.q3 * this.q3;

		norm = 1 / Math.sqrt(ax * ax + ay * ay + az * az);
		ax = ax * norm;
		ay = ay * norm;
		az = az * norm;

		norm = (1 / Math.sqrt(mx * mx + my * my + mz * mz));
		mx = mx * norm;
		my = my * norm;
		mz = mz * norm;

		// compute reference direction of flux
		hx =
			2 * mx * (0.5 - q2q2 - q3q3) +
			2 * my * (q1q2 - q0q3) +
			2 * mz * (q1q3 + q0q2);
		hy =
			2 * mx * (q1q2 + q0q3) +
			2 * my * (0.5 - q1q1 - q3q3) +
			2 * mz * (q2q3 - q0q1);
		hz =
			2 * mx * (q1q3 - q0q2) +
			2 * my * (q2q3 + q0q1) +
			2 * mz * (0.5 - q1q1 - q2q2);
		bx = Math.sqrt(hx * hx + hy * hy);
		bz = hz;

		// estimated direction of gravity and flux (v and w)
		vx = 2 * (q1q3 - q0q2);
		vy = 2 * (q0q1 + q2q3);
		vz = q0q0 - q1q1 - q2q2 + q3q3;
		wx = 2 * bx * (0.5 - q2q2 - q3q3) + 2 * bz * (q1q3 - q0q2);
		wy = 2 * bx * (q1q2 - q0q3) + 2 * bz * (q0q1 + q2q3);
		wz = 2 * bx * (q0q2 + q1q3) + 2 * bz * (0.5 - q1q1 - q2q2);

		// error is sum of cross product between reference direction of fields and direction measured by sensors
		ex = ay * vz - az * vy + (my * wz - mz * wy);
		ey = az * vx - ax * vz + (mz * wx - mx * wz);
		ez = ax * vy - ay * vx + (mx * wy - my * wx);

		if (ex != 0.0 && ey != 0.0 && ez != 0.0) {
			exInt = exInt + ex * this.Ki * halfT;
			eyInt = eyInt + ey * this.Ki * halfT;
			ezInt = ezInt + ez * this.Ki * halfT;

			gx = gx + this.Kp * ex + exInt;
			gy = gy + this.Kp * ey + eyInt;
			gz = gz + this.Kp * ez + ezInt;
		}

		this.q0 = this.q0 + (-this.q1 * gx - this.q2 * gy - this.q3 * gz) * halfT;
		this.q1 = this.q1 + (this.q0 * gx + this.q2 * gz - this.q3 * gy) * halfT;
		this.q2 = this.q2 + (this.q0 * gy - this.q1 * gz + this.q3 * gx) * halfT;
		this.q3 = this.q3 + (this.q0 * gz + this.q1 * gy - this.q2 * gx) * halfT;

		norm =
			1 /
			Math.sqrt(
				this.q0 * this.q0 +
					this.q1 * this.q1 +
					this.q2 * this.q2 +
					this.q3 * this.q3
			);
		this.q0 = this.q0 * norm;
		this.q1 = this.q1 * norm;
		this.q2 = this.q2 * norm;
		this.q3 = this.q3 * norm;
	},

	icm20948Check: async function () {
		var bRet = false;
		if (this.REG_VAL_WIA == (await this._read_byte(this.REG_ADD_WIA))) {
			bRet = true;
		}
		return bRet;
	},

	MagCheck: async function () {
		await this.icm20948ReadSecondary(
			this.I2C_ADD_ICM20948_AK09916 | this.I2C_ADD_ICM20948_AK09916_READ,
			this.REG_ADD_MAG_WIA1,
			2
		);
		if (
			this.pu8data[0] == this.REG_VAL_MAG_WIA1 &&
			this.pu8data[1] == this.REG_VAL_MAG_WIA2
		) {
			var bRet = true;
			return bRet;
		}
	},

	CalAvgValue: function () {
		var MotionVal = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
		MotionVal[0] = this.Gyro[0] / 32.8;
		MotionVal[1] = this.Gyro[1] / 32.8;
		MotionVal[2] = this.Gyro[2] / 32.8;
		MotionVal[3] = this.Accel[0];
		MotionVal[4] = this.Accel[1];
		MotionVal[5] = this.Accel[2];
		MotionVal[6] = this.Mag[0];
		MotionVal[7] = this.Mag[1];
		MotionVal[8] = this.Mag[2];
		return MotionVal;
	},

	getdata: async function () {
		await this.Gyro_Accel_Read();
		await this.MagRead();

		var MotionVal = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
		MotionVal = this.CalAvgValue();
		await this.sleep(100);
		await this.imuAHRSupdata(
			MotionVal[0] * 0.0175,
			MotionVal[1] * 0.0175,
			MotionVal[2] * 0.0175,
			MotionVal[3],
			MotionVal[4],
			MotionVal[5],
			MotionVal[6],
			MotionVal[7],
			MotionVal[8]
		);

		var pitch =
			Math.asin(-2 * this.q1 * this.q3 + 2 * this.q0 * this.q2) * 57.3;
		var roll =
			Math.atan2(
				2 * this.q2 * this.q3 + 2 * this.q0 * this.q1,
				-2 * this.q1 * this.q1 - 2 * this.q2 * this.q2 + 1
			) * 57.3;
		var yaw =
			Math.atan2(
				-2 * this.q1 * this.q2 - 2 * this.q0 * this.q3,
				2 * this.q2 * this.q2 + 2 * this.q3 * this.q3 - 1
			) * 57.3;

		return [
			roll,
			pitch,
			yaw,
			this.Accel[0],
			this.Accel[1],
			this.Accel[2],
			this.Gyro[0],
			this.Gyro[1],
			this.Gyro[2],
			this.Mag[0],
			this.Mag[1],
			this.Mag[2],
		];
	},
};

export default ICM20948;
