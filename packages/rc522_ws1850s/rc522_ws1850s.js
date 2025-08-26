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
// 2025/08/25: カードの検出と、UIDの読み取りのみ動作しています。
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
		this.CRCResultRegL = 0x2a;
		this.CRCResultRegH = 0x2b;

		// MFRC522コマンド
		this.PCD_Idle = 0x00;
		this.PCD_Transceive = 0x0c;
		this.PCD_SoftReset = 0x0f;
		this.PCD_CalcCRC = 0x03;

		// MIFARE PICCコマンド
		this.PICC_CMD_REQA = 0x26;
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

	// --------------------- UID取得関連関数 ---------------------

	/**
	 * 新しいカードがリーダー範囲内にあるか確認します。
	 * @return {Promise<boolean>}
	 */
	async PICC_IsNewCardPresent() {
		const bufferATQA = new Uint8Array(2);
		const { status } = await this.PICC_RequestA(bufferATQA);
		return status === this.STATUS_OK || status === this.STATUS_COLLISION;
	}

	/**
	 * 範囲内のカードのUIDを読み取ります。
	 * ATQA, SAKも取得し、オブジェクトとして返却します。
	 * @return {Promise<object|null>} 成功すればUID, ATQA, SAKを含むオブジェクト、失敗すればnull
	 */
	async PICC_ReadCardSerial() {
		let result = null;

		const bufferATQA = new Uint8Array(2);
		const { status: reqStatus } = await this.PICC_RequestA(bufferATQA);
		this.atqa = bufferATQA;

		if (reqStatus === this.STATUS_OK || reqStatus === this.STATUS_COLLISION) {
			const uid = { uidByte: new Uint8Array(10), size: 0 };

			//			console.log("PICC_ReadCardSerial: UIDの読み取りを開始します...");
			const { status: selectStatus } = await this.PICC_Select(uid);

			if (selectStatus === this.STATUS_OK) {
				//				console.log("PICC_ReadCardSerial: UIDの読み取りに成功しました。");
				result = {
					uid: uid.uidByte.slice(0, uid.size),
					uidLength: uid.size,
					atqa: this.atqa,
					sak: this.sak,
				};
			} else {
				console.warn(
					"PICC_ReadCardSerial: UIDの読み取りに失敗しました。ステータスコード:",
					selectStatus
				);
			}
		} else {
			console.warn(
				"PICC_ReadCardSerial: PICC_RequestAに失敗しました。ステータスコード:",
				reqStatus
			);
		}

		return result;
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
		let result = this.STATUS_OK;
		const waitIRq = 0x30; // RxIrqとIdleIrq
		let n = 0;
		let i = 4000;
		let receivedValidBits = 0;
		let receivedLen = 0;

		await this.i2cSlave.write8(this.CommandReg, this.PCD_Idle);
		await this.i2cSlave.write8(this.ComIrqReg, 0x7f);
		await this.i2cSlave.write8(this.FIFOLevelReg, 0x80);

		const writeData = new Uint8Array(sendLen + 1);
		writeData[0] = this.FIFODataReg;
		writeData.set(sendData.slice(0, sendLen), 1);
		await this.i2cSlave.writeBytes(writeData);

		await this.i2cSlave.write8(
			this.BitFramingReg,
			(rxAlign << 4) + sendValidBits
		);
		await this.i2cSlave.write8(this.CommandReg, this.PCD_Transceive);

		await this.i2cSlave.write8(
			this.BitFramingReg,
			((rxAlign << 4) + sendValidBits) | 0x80
		);

		// Loop with a timeout
		let startTime = Date.now();
		const timeout = 500; // 500ms timeout
		while (Date.now() - startTime < timeout) {
			n = await this.i2cSlave.read8(this.ComIrqReg);
			if (n & waitIRq) {
				break;
			}
			await sleep(1); // Small delay to avoid busy-waiting
		}

		// If the loop timed out, return an error
		if (Date.now() - startTime >= timeout) {
			result = this.STATUS_TIMEOUT;
		}

		const errorReg = await this.i2cSlave.read8(this.ErrorReg);
		//		console.log(`PCD_TransceiveData: ErrorReg value: 0x${errorReg.toString(16)}`);
		//		console.log(`PCD_TransceiveData: Status after loop: ${result}`);
		if (result === this.STATUS_TIMEOUT)
			return { status: result, validBits: receivedValidBits, receivedLen };

		if (errorReg & 0x1b) {
			if (errorReg & 0x08) result = this.STATUS_COLLISION;
			else result = this.STATUS_ERROR;
		}

		if (backData && result === this.STATUS_OK) {
			let fifoLevel = await this.i2cSlave.read8(this.FIFOLevelReg);
			receivedLen = fifoLevel;
			if (fifoLevel > backLen)
				return {
					status: this.STATUS_NO_ROOM,
					validBits: receivedValidBits,
					receivedLen,
				};

			// FIFOから1バイトずつ読み取るように変更
			for (let j = 0; j < fifoLevel; j++) {
				backData[j] = await this.i2cSlave.read8(this.FIFODataReg);
			}

			const controlReg = await this.i2cSlave.read8(this.ControlReg);
			receivedValidBits = controlReg & 0x07;
		}

		if (result === this.STATUS_OK && checkCRC) {
			const receivedCRC = backData.slice(receivedLen - 2, receivedLen);
			const calculatedCRC = new Uint8Array(2);
			const { status: crcStatus } = await this.PCD_CalculateCRC(
				backData.slice(0, receivedLen - 2),
				receivedLen - 2,
				calculatedCRC
			);

			if (
				crcStatus !== this.STATUS_OK ||
				receivedCRC[0] !== calculatedCRC[0] ||
				receivedCRC[1] !== calculatedCRC[1]
			) {
				return {
					status: this.STATUS_CRC_WRONG,
					validBits: receivedValidBits,
					receivedLen,
				};
			}
		}

		return { status: result, validBits: receivedValidBits, receivedLen };
	}

	/**
	 * REQAコマンドを送信して、新しいカードに応答を要求します。
	 */
	async PICC_RequestA(bufferATQA) {
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
	 * アンチコリジョン・プロトコルを実行して、カードのUIDを選択・取得します。
	 */
	async PICC_Select(uid) {
		let result;
		let cascadeLevel = 1;
		let knownBits = 0;
		let sendData = new Uint8Array(9);
		let backData = new Uint8Array(8);
		let backLen = 8;
		let receivedLen;

		uid.size = 0; // UIDサイズをリセット

		while (true) {
			// outer loop
			//			console.log(`--- PICC_Select Outer Loop Start. Cascade Level: ${cascadeLevel} ---`);
			if (cascadeLevel > 3) {
				//				console.log("PICC_Select: Exceeded max cascade levels. Aborting.");
				return { status: this.STATUS_ERROR };
			}

			let command;
			switch (cascadeLevel) {
				case 1:
					command = this.PICC_CMD_SEL_CL1;
					break;
				case 2:
					command = this.PICC_CMD_SEL_CL2;
					break;
				case 3:
					command = this.PICC_CMD_SEL_CL3;
					break;
			}

			// アンチコリジョン・プロトコルのループ
			while (true) {
				// inner loop
				let txLen = Math.floor(knownBits / 8);
				let txLastBits = knownBits % 8;

				// コマンドとNVBを組み立て
				sendData[0] = command;
				if (knownBits === 0) {
					sendData[1] = 0x20;
				} else {
					sendData[1] = 0x40;
				}

				let sendLen = 2 + txLen;
				let sendValidBits = txLastBits;

				// UIDを正しくsendDataにコピー
				for (let i = 0; i < txLen; i++) {
					sendData[2 + i] = uid.uidByte[i];
				}

				if (txLastBits !== 0) {
					sendLen++;
				}

				//				console.log(`PICC_Select: Inner Loop Start. Known Bits: ${knownBits}, txLen: ${txLen}, txLastBits: ${txLastBits}, sendLen: ${sendLen}`);
				//				console.log(`PICC_Select: sendData (before transceive):`, Array.from(sendData.slice(0, sendLen)).map(b => b.toString(16).padStart(2, '0')).join(' '));

				const {
					status: statusFromFn,
					validBits: validBitsFromFn,
					receivedLen: receivedLenFromFn,
				} = await this.PCD_TransceiveData(
					sendData,
					sendLen,
					backData,
					backLen,
					sendValidBits,
					0,
					false
				);

				result = statusFromFn;
				receivedLen = receivedLenFromFn;
				let receivedValidBits = validBitsFromFn;

				//				console.log(`PICC_Select: Transceive status: ${result}, received bytes: ${receivedLen}`);

				if (result !== this.STATUS_OK && result !== this.STATUS_COLLISION) {
					//					console.log(`PICC_Select: Fatal error, aborting. Status: ${result}`);
					return { status: result };
				}

				if (result === this.STATUS_COLLISION) {
					let collisionPos = (await this.i2cSlave.read8(this.CollReg)) & 0x1f;
					if (collisionPos === 0) collisionPos = 32;

					let newKnownBits = knownBits + collisionPos;
					let newKnownBytes = Math.floor(newKnownBits / 8);
					let newKnownLastBits = newKnownBits % 8;

					// 衝突解決のため、sendDataに受信データをコピー
					for (let i = 0; i < receivedLen; i++) {
						sendData[2 + txLen + i] = backData[i];
					}

					if (newKnownLastBits !== 0) {
						let mask = (1 << newKnownLastBits) - 1;
						sendData[2 + newKnownBytes] = sendData[2 + newKnownBytes] & ~mask;
						sendData[2 + newKnownBytes] |= backData[receivedLen - 1] & mask;
					}

					// 衝突位置のビットを1に設定
					let collisionByte = Math.floor((knownBits + collisionPos - 1) / 8);
					let collisionBit = (knownBits + collisionPos - 1) % 8;
					sendData[2 + collisionByte] |= 1 << collisionBit;

					knownBits = newKnownBits;

					//					console.log(`PICC_Select: Collision at bit ${collisionPos}, new known bits: ${knownBits}`);
				} else {
					//					console.log("PICC_Select: No collision, exiting inner loop.");

					// UIDを結合
					for (let i = 0; i < receivedLen; i++) {
						uid.uidByte[uid.size + i] = backData[i];
					}
					uid.size += receivedLen;

					// UIDの一部が正しく読み取られたので、既知のビット数を更新
					// 最後に受信したバイトの有効ビット数を加算
					knownBits = knownBits + (receivedLen - 1) * 8 + receivedValidBits;

					break;
				}
			}

			this.sak = backData[receivedLen - 1]; // SAKをプロパティに格納

			// UIDはまだ不完全なので、カスケードレベルを進めます。
			if ((this.sak & 0x04) !== 0) {
				uid.size--; // BCCを削除

				//				console.log(`PICC_Select: Incomplete UID, proceeding to cascade level ${cascadeLevel + 1}.`);
				cascadeLevel++;
				continue;
			}

			// UIDは完全なので、最後のバイト（BCC）を削除して、ループを終了します。
			uid.size--;

			//			console.log("PICC_Select: UID is complete.");
			break;
		}

		if (uid.size === 4 || uid.size === 7 || uid.size === 10) {
			//			console.log("PICC_Select: UID read successfully:", Array.from(uid.uidByte.slice(0, uid.size)).map(b => b.toString(16).padStart(2, '0')).join(''));
			return { status: this.STATUS_OK };
		}

		//		console.log("PICC_Select: Invalid UID size.");
		return { status: this.STATUS_ERROR };
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
}

// スリープ関数（ミリ秒単位）
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export default RC522;
