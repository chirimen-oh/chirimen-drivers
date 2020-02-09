# @chirimen/tca9548a

Driver for TCA9548A with WebI2C

## API

###  TCA9548A

▸ **TCA9548A**(`bus`: [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface), `address`: [TCA9548AAddress](#tca9548aaddress)): *object*

*Defined in [packages/tca9548a/src/index.ts:34](https://github.com/chirimen-oh/chirimen-drivers/blob/10d9904/packages/tca9548a/src/index.ts#L34)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`bus` | [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface) | - |
`address` | [TCA9548AAddress](#tca9548aaddress) | 112 |

**Returns:** *object*

* **i2cSlave**: *null | [I2CSlaveDevice](http://browserobo.github.io/WebI2C/#I2CSlaveDevice-interface)* = null as I2CSlaveDevice | null

* **init**(): *Promise‹void›*

* **read**(): *Promise‹[TCA9548AChannel](#tca9548achannel) | null›*

* **write**(`channel`: [TCA9548AChannel](#tca9548achannel)): *Promise‹void›*

### `Const` TCA9548AChannels

• **TCA9548AChannels**: *ReadonlyArray‹[TCA9548AChannel](#tca9548achannel)›* = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7
]

*Defined in [packages/tca9548a/src/index.ts:17](https://github.com/chirimen-oh/chirimen-drivers/blob/10d9904/packages/tca9548a/src/index.ts#L17)*

###  TCA9548AAddress

Ƭ **TCA9548AAddress**: *112 | 113 | 114 | 115 | 116 | 117 | 118 | 119*

*Defined in [packages/tca9548a/src/index.ts:4](https://github.com/chirimen-oh/chirimen-drivers/blob/10d9904/packages/tca9548a/src/index.ts#L4)*

I2C bus slave address (default `0x70`; when A0-A2 pins are high(1)/low(0) `0x70+4*A2+2*A1+A0` )

###  TCA9548AChannel

Ƭ **TCA9548AChannel**: *0 | 1 | 2 | 3 | 4 | 5 | 6 | 7*

*Defined in [packages/tca9548a/src/index.ts:15](https://github.com/chirimen-oh/chirimen-drivers/blob/10d9904/packages/tca9548a/src/index.ts#L15)*

8 switch channels for I2C data flow

## License

MIT
