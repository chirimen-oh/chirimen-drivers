// @ts-check
// RC522_WS1850S.js
//
// MFRC522/WS1850S RFIDカードリーダーライブラリ for CHIRIMEN WebI2C
// m5 RFID2が使えます
//。
// by Satoru Takagi
// 2025/08/25
//
//
// https://docs.m5stack.com/en/unit/rfid2
// によると、
// > IC (RC522->WS1850S) のみが置き換えられており、機能上の違いはありません
// とのことだが、ドライバレベル互換なのかというと、この製品のドライバのリンクがRC522を指している
// こと、I2Cアドレスが0x28であることから、差異はあるかもしてないが、ドライバレベル互換のICと想定
//
// https://github.com/arozcan/MFRC522-I2C-Library
// の一部をJavaScriptに移植したものです
//
// History:
// 2025/08/25 : カードの検出と、UIDの読み取りのみ動作しています。
// 2025/08/28 : バグだらけだった上のものをだいぶちゃんとに動かせるようにした（実質これが最初の版）
//
//
// ToDo: 認証＆書き込み

class RC522 {
	constructor(i2cPort, slaveAddress) {
		if (!slaveAddress) {
			slaveAddress = 0x28; // デフォルトのI2Cアドレス
		}

		this.i2cPort = i2cPort;
		this.slaveAddress = slaveAddress;
		this.i2cSlave = null;

		// ATQAとSAKを格納するためのプロパティ
		this.atqa = null;
		this.sak = null;

		// レジスタアドレス
		this.CommandReg = 0x01;
		this.ComIrqReg = 0x04;
		this.ErrorReg = 0x06;
		this.FIFODataReg = 0x09;
		this.FIFOLevelReg = 0x0a;
		this.ControlReg = 0x0c;
		this.BitFramingReg = 0x0d;
		this.CollReg = 0x0e;
		this.ModeReg = 0x11;
		this.TxModeReg = 0x12;
		this.RxModeReg = 0x13;
		this.TxControlReg = 0x14;
		this.TxASKReg = 0x15;
		this.RFCfgReg = 0x26;
		this.GsNReg = 0x27;
		this.CWGsPReg = 0x28;
		this.ModGsPReg = 0x29;
		this.TModeReg = 0x2a;
		this.TPrescalerReg = 0x2b;
		this.TReloadRegH = 0x2c;
		this.TReloadRegL = 0x2d;
		this.DivIrqReg = 0x05;
		this.CRCResultRegL = 0x22;
		this.CRCResultRegH = 0x21;

		// MFRC522コマンド
		this.PCD_Idle = 0x00;
		this.PCD_Transceive = 0x0c;
		this.PCD_SoftReset = 0x0f;
		this.PCD_CalcCRC = 0x03;

		// MIFARE PICCコマンド
		this.PICC_CMD_REQA = 0x26;
		this.PICC_CMD_WUPA = 0x52;
		this.PICC_CMD_CT = 0x88;
		this.PICC_CMD_SEL_CL1 = 0x93; // Cascade Level 1
		this.PICC_CMD_SEL_CL2 = 0x95; // Cascade Level 2
		this.PICC_CMD_SEL_CL3 = 0x97; // Cascade Level 3
		this.PICC_CMD_HLTA = 0x50; // Halt

		// ステータスコード
		this.STATUS_OK = 1;
		this.STATUS_ERROR = 2;
		this.STATUS_COLLISION = 3;
		this.STATUS_TIMEOUT = 4;
		this.STATUS_NO_ROOM = 5;
		this.STATUS_INTERNAL_ERROR = 6;
		this.STATUS_INVALID = 7;
		this.STATUS_CRC_WRONG = 8;
	}

	/**
	 * MFRC522モジュールを初期化します。
	 */
	async init() {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);
		await this.PCD_Reset();

		await this.i2cSlave.write8(this.TModeReg, 0x8d);
		await this.i2cSlave.write8(this.TPrescalerReg, 0x3e);
		await this.i2cSlave.write8(this.TReloadRegH, 0x00);
		await this.i2cSlave.write8(this.TReloadRegL, 0x4b);

		await this.i2cSlave.write8(this.TxASKReg, 0x40);
		await this.i2cSlave.write8(this.ModeReg, 0x3d);

		await this.PCD_AntennaOn();

		console.log("MFRC522 initialized via WebI2C");
	}

	/**
	 * MFRC522をソフトリセットします。
	 */
	async PCD_Reset() {
		await this.i2cSlave.write8(this.CommandReg, this.PCD_SoftReset);
		await sleep(50);
		while ((await this.i2cSlave.read8(this.CommandReg)) & (1 << 4)) {
			await sleep(10);
		}
	}

	/**
	 * アンテナをオンにします。
	 */
	async PCD_AntennaOn() {
		const value = await this.i2cSlave.read8(this.TxControlReg);
		if ((value & 0x03) !== 0x03) {
			await this.i2cSlave.write8(this.TxControlReg, value | 0x03);
		}
	}

	/**
	 * カードをHALT（休止）状態にします。
	 * @return {Promise<number>} ステータスコード
	 */
	async PICC_HaltA() {
		const command = new Uint8Array([this.PICC_CMD_HLTA, 0x00]);
		const crc = new Uint8Array(2);

		// CRCを計算
		const { status: crcStatus } = await this.PCD_CalculateCRC(command, 2, crc);
		if (crcStatus !== this.STATUS_OK) {
			return crcStatus;
		}

		// コマンドとCRCを結合
		const sendData = new Uint8Array(4);
		sendData[0] = command[0];
		sendData[1] = command[1];
		sendData[2] = crc[0];
		sendData[3] = crc[1];

		// 送信
		const { status } = await this.PCD_TransceiveData(
			sendData,
			4,
			new Uint8Array(0),
			0,
			0,
			0,
			false
		);

		// PICC_HaltAは、正常な場合でもタイムアウトを返すため、
		// タイムアウトを正常なレスポンスとして処理
		if (status === this.STATUS_TIMEOUT) {
			return this.STATUS_OK;
		}

		// 意図せずレスポンスがあった場合はエラー
		if (status === this.STATUS_OK) {
			return this.STATUS_ERROR;
		}

		return status;
	}

	// --------------------- 通信プロトコル ---------------------

	/**
	 * MFRC522とPICC（カード）間でデータを送受信します。
	 * @param {Uint8Array} sendData 送信するデータ
	 * @param {number} sendLen 送信データの長さ
	 * @param {Uint8Array} backData 受信バッファ
	 * @param {number} backLen 受信バッファの最大長
	 * @param {number} sendValidBits 送信データの最後のバイトの有効ビット数
	 * @param {number} rxAlign 受信データの最初のビットの位置
	 * @param {boolean} checkCRC CRC検証を行うか
	 * @return {Promise<object>} ステータス、有効ビット数、受信バイト数を含むオブジェクト
	 */
	async PCD_TransceiveData(
		sendData,
		sendLen,
		backData,
		backLen,
		sendValidBits,
		rxAlign,
		checkCRC
	) {
		//console.log("PCD_TransceiveData ===========================");
		const waitIRq = 0x30; // RxIrqとIdleIrq
		const ans = await this.PCD_CommunicateWithPICC(
			this.PCD_Transceive,
			waitIRq,
			sendData,
			sendLen,
			backData,
			backLen,
			sendValidBits,
			rxAlign,
			checkCRC
		);
		//console.log("PCD_TransceiveData(NEW) ans:", ans, " backData:", backData);
		return ans;
	}

	async PCD_SetRegisterBitMask(reg, mask) {
		let tmp = await this.i2cSlave.read8(reg);
		await this.i2cSlave.write8(reg, tmp | mask); // set bit mask
		//		console.log("PCD_SetRegisterBitMask:",{tmp,mask},tmp | mask);
	}

	async PCD_ReadRegister(reg, count, values, rxAlign) {
		let address = reg;
		let index = 0; // Index in values array.
		await this.i2cSlave.writeByte(address);
		for (let j = 0; j < count; j++) {
			if (index == 0 && rxAlign) {
				// Only update bit positions rxAlign..7 in values[0]
				// Create bit mask for bit positions rxAlign..7
				let mask = 0;
				for (let i = rxAlign; i <= 7; i++) {
					mask |= 1 << i;
				}
				// Read value and tell that we want to read the same address again.
				let value = await this.i2cSlave.readByte();
				// Apply mask to both current value of values[0] and the new data in value.
				values[0] = (values[index] & ~mask) | (value & mask);
			} else {
				// Normal case
				values[index] = await this.i2cSlave.readByte();
			}
			index++;
		}
	}

	/**
	 * MFRC522とPICC（カード）間でデータを送受信します。
	 * @param {number} command コマンド
	 * @param {number} waitIRq
	 * @param {Uint8Array} sendData 送信するデータ
	 * @param {number} sendLen 送信データの長さ
	 * @param {Uint8Array} backData 受信バッファ
	 * @param {number} backLen 受信バッファの最大長
	 * @param {number} validBits 送信データの最後のバイトの有効ビット数
	 * @param {number} rxAlign 受信データの最初のビットの位置
	 * @param {boolean} checkCRC CRC検証を行うか
	 * @return {Promise<object>} ステータス、有効ビット数、受信バイト数を含むオブジェクト
	 */
	async PCD_CommunicateWithPICC(
		command,
		waitIRq,
		sendData,
		sendLen,
		backData,
		backLen,
		validBits,
		rxAlign,
		checkCRC
	) {
		let n, _validBits;
		let i;

		// Prepare values for BitFramingReg
		let txLastBits = validBits ? validBits : 0;
		let bitFraming = (rxAlign << 4) + txLastBits; // RxAlign = BitFramingReg[6..4]. TxLastBits = BitFramingReg[2..0]

		await this.i2cSlave.write8(this.CommandReg, this.PCD_Idle);
		await this.i2cSlave.write8(this.ComIrqReg, 0x7f);
		await this.PCD_SetRegisterBitMask(this.FIFOLevelReg, 0x80);

		const writeData = new Uint8Array(sendLen + 1);
		writeData[0] = this.FIFODataReg;
		writeData.set(sendData.slice(0, sendLen), 1);
		await this.i2cSlave.writeBytes(writeData);

		await this.i2cSlave.write8(this.BitFramingReg, bitFraming);
		await this.i2cSlave.write8(this.CommandReg, command);
		if (command === this.PCD_Transceive) {
			//			console.log("PCD_Transceive");
			await this.PCD_SetRegisterBitMask(this.BitFramingReg, 0x80);
		}

		// Loop with a timeout
		i = 2000;
		while (true) {
			n = await this.i2cSlave.read8(this.ComIrqReg);
			if (n & waitIRq) {
				break;
			}
			if (n & 0x01) {
				// Timer interrupt - nothing received in 25ms
				return { status: this.STATUS_TIMEOUT, validBits, receivedLen: backLen };
			}
			--i;
			if (i == 0) {
				// The emergency break. If all other condions fail we will eventually terminate on this one after 35.7ms. Communication with the MFRC522 might be down.
				return { status: this.STATUS_TIMEOUT, validBits, receivedLen: backLen };
			}
			await sleep(1); // Small delay to avoid busy-waiting
		}

		const errorRegValue = await this.i2cSlave.read8(this.ErrorReg);
		//		console.log(`PCD_TransceiveData: errorRegValue value: 0x${errorRegValue.toString(16)}`);
		//		console.log(`PCD_TransceiveData: Status after loop: ${result}`);

		// console.log("PCD_CommunicateWithPICC : errorRegValue:",errorRegValue.toString(2)," collisions:",errorRegValue & 0x08, " stat_error:",errorRegValue & 0x13);

		if (errorRegValue & 0x13) {
			return { status: this.STATUS_ERROR, validBits, receivedLen: backLen };
		}

		if (backData && backLen) {
			n = await this.i2cSlave.read8(this.FIFOLevelReg);
			//			console.log("receivedLen: n:",n);
			if (n > backLen) {
				return { status: this.STATUS_NO_ROOM, validBits, receivedLen: backLen };
			}
			backLen = n;
			await this.PCD_ReadRegister(this.FIFODataReg, n, backData, rxAlign);
			_validBits = (await this.i2cSlave.read8(this.ControlReg)) & 0x07;
			if (validBits) {
				validBits = _validBits;
			}
			//			console.log("backData:",{backData , backLen,n,_validBits,errorRegValue});
		}

		// Tell about collisions
		if (errorRegValue & 0x08) {
			// CollErr
			return { status: this.STATUS_COLLISION, validBits, receivedLen: backLen };
		}

		// Perform CRC_A validation if requested.
		if (backData && backLen && checkCRC) {
			// In this case a MIFARE Classic NAK is not OK.
			if (backLen == 1 && _validBits == 4) {
				return {
					status: this.STATUS_MIFARE_NACK,
					validBits,
					receivedLen: backLen,
				};
			}
			// We need at least the CRC_A value and all 8 bits of the last byte must be received.
			if (backLen < 2 || _validBits != 0) {
				return {
					status: this.STATUS_CRC_WRONG,
					validBits,
					receivedLen: backLen,
				};
			}
			// Verify CRC_A - do our own calculation and store the control in controlBuffer.
			let controlBuffer = [];
			n = await this.PCD_CalculateCRC(backData, backLen - 2, controlBuffer);
			if (n != this.STATUS_OK) {
				return { status: n, validBits, receivedLen: backLen };
			}
			if (
				backData[backLen - 2] != controlBuffer[0] ||
				backData[backLen - 1] != controlBuffer[1]
			) {
				return {
					status: this.STATUS_CRC_WRONG,
					validBits,
					receivedLen: backLen,
				};
			}
		}
		return { status: this.STATUS_OK, validBits, receivedLen: backLen };
	}

	/**
	 * REQAコマンドを送信して、新しいカードに応答を要求します。
	 */
	async PICC_RequestA(bufferATQA) {
		let validBits, status;
		await this.PCD_ClearRegisterBitMask(this.CollReg, 0x80);
		validBits = 7;

		const command = new Uint8Array([this.PICC_CMD_REQA]);
		let backData = new Uint8Array(2);
		const { status: currentStatus, validBits: currentValidBits } =
			await this.PCD_TransceiveData(command, 1, backData, 2, 7, 0, false);
		if (currentStatus === this.STATUS_OK) {
			status = currentStatus;
			validBits = currentValidBits;
		}

		if (status !== this.STATUS_OK) return { status, validBits };

		bufferATQA.set(backData);
		return { status: this.STATUS_OK, validBits };
	}

	async PICC_RequestAO(bufferATQA) {
		await this.i2cSlave.write8(this.CollReg, 0x80); // ValuesAfterColl=1

		const command = new Uint8Array([this.PICC_CMD_REQA]);
		let backData = new Uint8Array(2);

		// タイムアウトする可能性があるため、複数回試行する
		let status = this.STATUS_ERROR;
		let validBits = 0;
		for (let i = 0; i < 3; i++) {
			// 3回まで再試行
			const { status: currentStatus, validBits: currentValidBits } =
				await this.PCD_TransceiveData(command, 1, backData, 2, 7, 0, false);
			// console.log("生のATQAデータ:", backData, " currentValidBits:",currentValidBits, " currentStatus:",currentStatus);
			if (currentStatus === this.STATUS_OK) {
				status = currentStatus;
				validBits = currentValidBits;
				break;
			}
			await sleep(50); // 次の試行まで少し待つ
		}

		if (status !== this.STATUS_OK) return { status, validBits };

		bufferATQA.set(backData);
		return { status: this.STATUS_OK, validBits };
	}

	/**
	 * Clears the bits given in mask from register reg.
	 */

	async PCD_ClearRegisterBitMask(reg, mask) {
		let tmp = await this.i2cSlave.read8(reg);
		await this.i2cSlave.write8(reg, tmp & ~mask); // clear bit mask
	} // End PCD_ClearRegisterBitMask()

	/**
	 * アンチコリジョン・プロトコルを実行して、カードのUIDを選択・取得します。
	 */
	// validBits: number
	async PICC_Select(uid, validBits) {
		let uidComplete;
		let selectDone;
		let useCascadeTag;
		let cascadeLevel = 1;
		let result;
		let count;
		let index;
		let uidIndex;
		let currentLevelKnownBits;
		let buffer = new Uint8Array(9); // ポインタ操作に近づける
		let bufferUsed;
		let rxAlign;
		let txLastBits;
		let responseBuffer;
		let responseLength;

		// Sanity checks
		if (validBits > 80) {
			return this.STATUS_INVALID;
		}

		// Prepare MFRC522
		await this.PCD_ClearRegisterBitMask(this.CollReg, 0x80);

		uidComplete = false;
		while (!uidComplete) {
			switch (cascadeLevel) {
				case 1:
					buffer[0] = this.PICC_CMD_SEL_CL1;
					uidIndex = 0;
					useCascadeTag = validBits && uid.size > 4;
					break;
				case 2:
					buffer[0] = this.PICC_CMD_SEL_CL2;
					uidIndex = 3;
					useCascadeTag = validBits && uid.size > 7;
					break;
				case 3:
					buffer[0] = this.PICC_CMD_SEL_CL3;
					uidIndex = 6;
					useCascadeTag = false;
					break;
				default:
					return this.STATUS_INTERNAL_ERROR;
			}

			currentLevelKnownBits = validBits - 8 * uidIndex;
			if (currentLevelKnownBits < 0) currentLevelKnownBits = 0;

			index = 2;
			if (useCascadeTag) {
				buffer[index++] = this.PICC_CMD_CT;
			}

			let bytesToCopy =
				Math.floor(currentLevelKnownBits / 8) +
				(currentLevelKnownBits % 8 ? 1 : 0);
			if (bytesToCopy) {
				let maxBytes = useCascadeTag ? 3 : 4;
				if (bytesToCopy > maxBytes) bytesToCopy = maxBytes;
				for (count = 0; count < bytesToCopy; count++) {
					buffer[index++] = uid.uidByte[uidIndex + count];
				}
			}
			if (useCascadeTag) currentLevelKnownBits += 8;
			let calculatedBCC;
			selectDone = false;
			while (!selectDone) {
				//console.log("!!!!!!!!!!!!!!!!!!Loop:");
				if (currentLevelKnownBits >= 32) {
					buffer[1] = 0x70;
					buffer[6] = buffer[2] ^ buffer[3] ^ buffer[4] ^ buffer[5];
					calculatedBCC = buffer[6];

					const crcRes = await this.PCD_CalculateCRC(
						buffer,
						7,
						buffer.subarray(7)
					);
					result = crcRes.status;
					if (result !== this.STATUS_OK) {
						//						console.log("========PICC_Select NOT STATUS_OK :  uid:",uid, " result:",result);
						return result;
					}

					txLastBits = 0;
					bufferUsed = 9;
					responseBuffer = buffer.subarray(6); // BCC, CRC 部分を再利用
					responseLength = 3;
				} else {
					txLastBits = currentLevelKnownBits % 8;
					count = Math.floor(currentLevelKnownBits / 8);
					index = 2 + count;
					buffer[1] = (index << 4) + txLastBits;
					bufferUsed = index + (txLastBits ? 1 : 0);
					responseBuffer = buffer.subarray(index); // 未使用部分を応答バッファに
					responseLength = buffer.length - index;
				}

				rxAlign = txLastBits;
				await this.i2cSlave.write8(
					this.BitFramingReg,
					(rxAlign << 4) + txLastBits
				);

				let ans = await this.PCD_TransceiveData(
					buffer,
					bufferUsed,
					responseBuffer,
					responseLength,
					txLastBits,
					rxAlign,
					false
				);

				result = ans.status;
				responseLength = ans.receivedLen;
				txLastBits = ans.validBits;

				//				console.log("???????????????:",{result,currentLevelKnownBits,responseLength,txLastBits,buffer,responseBuffer});

				if (result === this.STATUS_COLLISION) {
					//					console.log("???:STATUS_COLLISION");
					let coll = await this.PCD_ReadRegister(this.CollReg);
					if (coll & 0x20) {
						//						console.log("========PICC_Select STATUS_COLLISION :  uid:",uid);
						return this.STATUS_COLLISION;
					}

					let collisionPos = coll & 0x1f;
					if (collisionPos === 0) collisionPos = 32;
					if (collisionPos <= currentLevelKnownBits)
						//					console.log("========PICC_Select STATUS_INTERNAL_ERROR :  uid:",uid);
						return this.STATUS_INTERNAL_ERROR;

					currentLevelKnownBits = collisionPos;
					count = (currentLevelKnownBits - 1) % 8;
					index = 1 + Math.floor(currentLevelKnownBits / 8) + (count ? 1 : 0);
					buffer[index] |= 1 << count;
				} else if (result !== this.STATUS_OK) {
					//console.log("???: NOT! STATUS_OK : uid:",uid,"  validBits:",validBits);
					return result;
				} else {
					// STATUS_OK
					if (currentLevelKnownBits >= 32) {
						selectDone = true;
					} else {
						currentLevelKnownBits = 32;
					}
					//console.log("???:STATUS_OK",{result,currentLevelKnownBits,responseLength,txLastBits,selectDone,buffer,responseBuffer});
				}
			}

			//console.log("EXIT INT LOOP!");

			index = buffer[2] === this.PICC_CMD_CT ? 3 : 2;
			bytesToCopy = buffer[2] === this.PICC_CMD_CT ? 3 : 4;
			for (count = 0; count < bytesToCopy; count++) {
				uid.uidByte[uidIndex + count] = buffer[index++];
			}
			uid.bcc = calculatedBCC;

			if (responseLength !== 3 || txLastBits !== 0) {
				//console.log("========PICC_Select STATUS_ERROR :  uid:",uid);
				return this.STATUS_ERROR;
			}

			const crcRes = await this.PCD_CalculateCRC(
				responseBuffer,
				1,
				buffer.subarray(2)
			);
			result = crcRes.status;

			if (result !== this.STATUS_OK) {
				//console.log("========PICC_Select STATUS NOT OK :  result:",result);
				return result;
			}
			if (buffer[2] !== responseBuffer[1] || buffer[3] !== responseBuffer[2]) {
				//console.log("========PICC_Select STATUS_CRC_WRONG :  uid:",uid);
				return this.STATUS_CRC_WRONG;
			}

			if (responseBuffer[0] & 0x04) {
				cascadeLevel++;
			} else {
				uidComplete = true;
				uid.sak = responseBuffer[0];
			}
		}

		uid.size = 3 * cascadeLevel + 1;
		//console.log("========PICC_Select OK :  uid:",uid);
		return this.STATUS_OK;
	}

	/**
	 * CRCを計算します。
	 */
	async PCD_CalculateCRC(sendData, sendLen, backData) {
		// CRC計算の前準備
		await this.i2cSlave.write8(this.CommandReg, this.PCD_Idle);
		await this.i2cSlave.write8(this.DivIrqReg, 0x04);
		await this.i2cSlave.write8(this.FIFOLevelReg, 0x80);

		// データをFIFOに書き込み
		const writeData = new Uint8Array(sendLen + 1);
		writeData[0] = this.FIFODataReg;
		writeData.set(sendData.slice(0, sendLen), 1);
		await this.i2cSlave.writeBytes(writeData);

		await this.i2cSlave.write8(this.CommandReg, this.PCD_CalcCRC);

		// CRC計算の完了を待機
		let i = 2000;
		while (true) {
			const n = await this.i2cSlave.read8(this.DivIrqReg);
			if (n & 0x04) break; // CRCIrq
			if (--i === 0) return { status: this.STATUS_TIMEOUT };
			await sleep(1);
		}

		// FIFOからではなく、専用レジスタから計算結果のCRCを読み込み
		backData[0] = await this.i2cSlave.read8(this.CRCResultRegL);
		backData[1] = await this.i2cSlave.read8(this.CRCResultRegH);

		return { status: this.STATUS_OK };
	}

	// --------------------- UID取得関連関数 ---------------------

	/**
	 * 新しいカードがリーダー範囲内にあるか確認します。
	 * @return {Promise<boolean>}
	 */
	async PICC_IsNewCardPresent() {
		const bufferATQA = new Uint8Array(2);
		const { status } = await this.PICC_RequestA(bufferATQA);
		if (status === this.STATUS_OK || status === this.STATUS_COLLISION) {
			return {
				status,
				atqa: bufferATQA,
			};
		} else {
			return null;
		}
		//		return status === this.STATUS_OK || status === this.STATUS_COLLISION;
	}

	/**
	 * 範囲内のカードのUIDを読み取ります。
	 * ATQA, SAKも取得し、オブジェクトとして返却します。
	 * @return {Promise<object|null>} 成功すればUID, ATQA, SAKを含むオブジェクト、失敗すればnull
	 */
	async PICC_ReadCardSerial() {
		let result = null;
		const uid = { uidByte: new Uint8Array(10), size: 0 };
		const selectStatus = await this.PICC_Select(uid, 0);
		//console.log("PICC_ReadCardSerial : uid: ",uid,"  selectStatus:",selectStatus);
		if (selectStatus === this.STATUS_OK) {
			//				console.log("PICC_ReadCardSerial: UIDの読み取りに成功しました。");
			result = {
				uid: uid.uidByte.slice(0, uid.size),
				uidLength: uid.size,
				bcc: uid.bcc,
				//				atqa: this.atqa,
				sak: uid.sak,
			};
		}
		return result;
	}
}

// スリープ関数（ミリ秒単位）
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export default RC522;
