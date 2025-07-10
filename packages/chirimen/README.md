# CHIRIMEN

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
