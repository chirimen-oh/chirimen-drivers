/**
 * I2C 1602 LCD with PCF8574 Driver for node-webi2c
 * Note: VCCは5Vを入れないとLCDのコントラストが低い場合がある
 *       LEDジャンパーは付けておく
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const I2C1602LCD = function (i2cPort, slaveAddress = 0x27) {
	this.i2cPort = i2cPort;
	this.slaveAddress = slaveAddress;
	this.i2cSlave = null;
	this.line1 = 0x80;
	this.line2 = 0xc0;

	// Constants
	this.LCD_CHR = 1; // Mode - Sending data
	this.LCD_CMD = 0; // Mode - Sending command
	this.LCD_BACKLIGHT = 0x08; // On (Off is 0x00)
	this.ENABLE = 0b00000100; // Enable bit
};

I2C1602LCD.prototype = {
	init: async function () {
		this.i2cSlave = await this.i2cPort.open(this.slaveAddress);

		// 初期化シーケンス
		await this.lcdByte(0x33, this.LCD_CMD);
		await this.lcdByte(0x32, this.LCD_CMD);
		await this.lcdByte(0x06, this.LCD_CMD); // カーソルの移動方向
		await this.lcdByte(0x0c, this.LCD_CMD); // 表示ON, カーソルOFF
		await this.lcdByte(0x28, this.LCD_CMD); // 4bitモード, 2行表示
		await this.lcdByte(0x01, this.LCD_CMD); // クリア
		await sleep(1); // 完了待ち
	},

	lcdByte: async function (bits, mode) {
		// 高位4ビットと低位4ビットに分けて送信する (4bitモード)
		const high = mode | (bits & 0xf0) | this.LCD_BACKLIGHT;
		const low = mode | ((bits << 4) & 0xf0) | this.LCD_BACKLIGHT;

		// High bits
		await this.i2cSlave.writeByte(high);
		await this.lcdToggleEnable(high);

		// Low bits
		await this.i2cSlave.writeByte(low);
		await this.lcdToggleEnable(low);
	},

	lcdToggleEnable: async function (bits) {
		// E(Enable)ピンをパルスさせてデータを確定させる
		await sleep(0.5);
		await this.i2cSlave.writeByte(bits | this.ENABLE);
		await sleep(0.5);
		await this.i2cSlave.writeByte(bits & ~this.ENABLE);
		await sleep(0.5);
	},

	/**
	 * カタカナ対応のプリントメソッド
	 * @param {string} text - 表示したい文字列（全角・半角カタカナ混在OK）
	 * @param {number} line - 行アドレス (0x80 or 0xC0)
	 */
	print: async function (text, line = 0x80) {
		await this.lcdByte(line, this.LCD_CMD);

		// カタカナ変換マップ（全角 -> 半角コード + 濁点/半濁点）
		const kanaMap = {
			ガ: [0xb6, 0xde],
			ギ: [0xb7, 0xde],
			グ: [0xb8, 0xde],
			ゲ: [0xb9, 0xde],
			ゴ: [0xba, 0xde],
			ザ: [0xbb, 0xde],
			ジ: [0xbc, 0xde],
			ズ: [0xbd, 0xde],
			ゼ: [0xbe, 0xde],
			ゾ: [0xbf, 0xde],
			ダ: [0xc0, 0xde],
			ヂ: [0xc1, 0xde],
			ヅ: [0xc2, 0xde],
			デ: [0xc3, 0xde],
			ド: [0xc4, 0xde],
			バ: [0xca, 0xde],
			ビ: [0xcb, 0xde],
			ブ: [0xcc, 0xde],
			ベ: [0xcd, 0xde],
			ボ: [0xce, 0xde],
			パ: [0xca, 0xdf],
			ピ: [0xcb, 0xdf],
			プ: [0xcc, 0xdf],
			ペ: [0xcd, 0xdf],
			ポ: [0xce, 0xdf],
			ア: [0xb1],
			イ: [0xb2],
			ウ: [0xb3],
			エ: [0xb4],
			オ: [0xb5],
			カ: [0xb6],
			キ: [0xb7],
			ク: [0xb8],
			ケ: [0xb9],
			コ: [0xba],
			サ: [0xbb],
			シ: [0xbc],
			ス: [0xbd],
			セ: [0xbe],
			ソ: [0xbf],
			タ: [0xc0],
			チ: [0xc1],
			ツ: [0xc2],
			テ: [0xc3],
			ト: [0xc4],
			ナ: [0xc5],
			ニ: [0xc6],
			ヌ: [0xc7],
			ネ: [0xc8],
			ノ: [0xc9],
			ハ: [0xca],
			ヒ: [0xcb],
			フ: [0xcc],
			ヘ: [0xcd],
			ホ: [0xce],
			マ: [0xcf],
			ミ: [0xd0],
			ム: [0xd1],
			メ: [0xd2],
			モ: [0xd3],
			ヤ: [0xd4],
			ユ: [0xd5],
			ヨ: [0xd6],
			ラ: [0xd7],
			リ: [0xd8],
			ル: [0xd9],
			レ: [0xda],
			ロ: [0xdb],
			ワ: [0xdc],
			ヲ: [0xa6],
			ン: [0xdd],
			ッ: [0xaf],
			ャ: [0xac],
			ュ: [0xad],
			ョ: [0xae],
			ァ: [0xa7],
			ィ: [0xa8],
			ゥ: [0xa9],
			ェ: [0xaa],
			ォ: [0xab],
			ー: [0xb0],
			"゛": [0xde],
			"゜": [0xdf],
			"。": [0xa1],
			"「": [0xa2],
			"」": [0xa3],
			"、": [0xa4],
			"・": [0xa5],
		};

		let buffer = [];
		// 1文字ずつループしてLCD用コードに変換
		for (const char of text) {
			if (kanaMap[char]) {
				// マップにある全角カタカナ
				buffer.push(...kanaMap[char]);
			} else {
				const code = char.charCodeAt(0);
				if (code >= 0xff61 && code <= 0xff9f) {
					// すでに半角カタカナ(Unicode)の場合、JIS X 0201に変換
					buffer.push(code - 0xfec0);
				} else if (code < 128) {
					// 英数字
					buffer.push(code);
				} else {
					// 対応外の文字はスペース
					buffer.push(0x20);
				}
			}
		}

		// 16文字分だけ送信（はみ出し禁止）
		for (let i = 0; i < 16; i++) {
			const byte = buffer[i] !== undefined ? buffer[i] : 0x20; // 足りない分はスペース
			await this.lcdByte(byte, this.LCD_CHR);
		}
	},

	print0: async function (message, line = 0x80) {
		// line: 1行目は 0x80, 2行目は 0xC0
		await this.lcdByte(line, this.LCD_CMD);

		const str = message.padEnd(16, " "); // 16文字に揃える
		for (let i = 0; i < 16; i++) {
			await this.lcdByte(str.charCodeAt(i), this.LCD_CHR);
		}
	},

	clear: async function () {
		await this.lcdByte(0x01, this.LCD_CMD);
		await new Promise((resolve) => setTimeout(resolve, 1));
	},
};

export default I2C1602LCD;
