# @chirimen/tca9548a

Driver for TCA9548A with WebI2C

## API

### TCA9548A

▸ **TCA9548A**(`bus`: [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface), `address`: [TCA9548AAddress](#tca9548aaddress)): _object_

_Defined in [packages/tca9548a/index.js:36](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L36)_

**Parameters:**

| Name      | Type                                                             | Default |
| --------- | ---------------------------------------------------------------- | ------- |
| `bus`     | [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface) | -       |
| `address` | [TCA9548AAddress](#tca9548aaddress)                              | 112     |

**Returns:** _object_

- **i2cSlave**: _null | [I2CSlaveDevice](http://browserobo.github.io/WebI2C/#I2CSlaveDevice-interface)_ = null as I2CSlaveDevice | null

- **init**(): _Promise‹void›_

- **read**(): _Promise‹[TCA9548AChannel](#tca9548achannel) | null›_

- **write**(`channel`: [TCA9548AChannel](#tca9548achannel)): _Promise‹void›_

### `Const` TCA9548AChannels

• **TCA9548AChannels**: _ReadonlyArray‹[TCA9548AChannel](#tca9548achannel)›_ = [
0,
1,
2,
3,
4,
5,
6,
7
]

_Defined in [packages/tca9548a/index.js:14](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L14)_

### TCA9548AAddress

Ƭ **TCA9548AAddress**: _112 | 113 | 114 | 115 | 116 | 117 | 118 | 119_

_Defined in [packages/tca9548a/index.js:2](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L2)_

I2C bus slave address (default `0x70`; when A0-A2 pins are high(1)/low(0) `0x70+4*A2+2*A1+A0` )

### TCA9548AChannel

Ƭ **TCA9548AChannel**: _0 | 1 | 2 | 3 | 4 | 5 | 6 | 7_

_Defined in [packages/tca9548a/index.js:6](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L6)_

8 switch channels for I2C data flow

## License

MIT
