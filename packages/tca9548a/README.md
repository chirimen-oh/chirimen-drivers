# @chirimen/tca9548a

Driver for TCA9548A with WebI2C

## Usage

`get(channel)` returns an object implementing [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface), scoped to one downstream channel. Pass it straight into another driver's constructor, just like a plain I2CPort. It selects the channel and serializes access on its own, so you don't need to call `write()` before every read or write:

```js
import { requestI2CAccess } from "node-web-i2c";
import TCA9548A from "@chirimen/tca9548a";
import SHT30 from "@chirimen/sht30";

const i2cAccess = await requestI2CAccess();

const mux = new TCA9548A(i2cAccess.ports.get(1));

const s0 = new SHT30(mux.get(0));
const s1 = new SHT30(mux.get(1));

await s0.init();
await s1.init();

while (true) {
  console.log(await s0.readData());
  console.log(await s1.readData());
}
```

`read()` and `write()` still work too, for selecting a channel manually before each access.

Every I2C operation issued through a mux instance (whether via `read()`/`write()` or a `get(channel)`-wrapped device) is serialized, so it's safe to call them concurrently. If a single operation doesn't complete within 5 seconds, that call rejects with `TCA9548ALockTimeoutError` so your code isn't left waiting forever. Later calls on the same mux still wait for the stuck operation to actually finish, though — there's no way to cancel an I2C transaction once it's issued, so letting other calls proceed early could interleave with whatever the stuck operation eventually does to the bus.

## Breaking changes in 3.0.0

`TCA9548A` is now a real class. `new TCA9548A(bus)` still works exactly as before, but calling it as a plain function (`TCA9548A(bus)`, without `new`) now throws instead of returning a driver instance.

## API

### Class: TCA9548A

_Defined in [packages/tca9548a/index.js:55](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L55)_

#### Constructor

▸ **new TCA9548A**(`bus`: [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface), `address`: [TCA9548AAddress](#tca9548aaddress)): _TCA9548A_

_Defined in [packages/tca9548a/index.js:79](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L79)_

**Parameters:**

| Name      | Type                                                             | Default |
| --------- | ---------------------------------------------------------------- | ------- |
| `bus`     | [I2CPort](http://browserobo.github.io/WebI2C/#I2CPort-interface) | -       |
| `address` | [TCA9548AAddress](#tca9548aaddress)                              | 112     |

#### Properties and methods

- **i2cSlave**: _null | [I2CSlaveDevice](http://browserobo.github.io/WebI2C/#I2CSlaveDevice-interface)_ = null as I2CSlaveDevice | null

- **init**(): _Promise‹void›_

- **read**(): _Promise‹[TCA9548AChannel](#tca9548achannel) | null›_

- **write**(`channel`: [TCA9548AChannel](#tca9548achannel)): _Promise‹void›_ — throws `RangeError` for a channel outside 0-7.

- **get**(`channel`: [TCA9548AChannel](#tca9548achannel)): _I2CPort-like object_ — see [Usage](#usage). Calling `get()` twice with the same channel returns the same object. Throws `RangeError` for a channel outside 0-7.

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

_Defined in [packages/tca9548a/index.js:23](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L23)_

### TCA9548AAddress

Ƭ **TCA9548AAddress**: _112 | 113 | 114 | 115 | 116 | 117 | 118 | 119_

_Defined in [packages/tca9548a/index.js:4](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L4)_

I2C bus slave address (default `0x70`; when A0-A2 pins are high(1)/low(0) `0x70+4*A2+2*A1+A0` )

### TCA9548AChannel

Ƭ **TCA9548AChannel**: _0 | 1 | 2 | 3 | 4 | 5 | 6 | 7_

_Defined in [packages/tca9548a/index.js:9](https://github.com/chirimen-oh/chirimen-drivers/blob/master/packages/tca9548a/index.js#L9)_

8 switch channels for I2C data flow

### TCA9548ANotFoundError

An `Error` thrown when the mux chip itself doesn't respond at its configured address.

### TCA9548ALockTimeoutError

An `Error` thrown when a single I2C operation doesn't complete within 5 seconds.

## License

MIT
