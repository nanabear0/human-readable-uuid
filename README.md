# human-readable-uuid

Reversible, human-readable representations of UUIDs:

```text
Banana30-Earth07-Trigger27-Barrel19-Picture22-Draw06-Beef23-Divorce00
```

Each UUID is split into eight 16-bit values. Every value is encoded as a word
from a fixed 2,048-word dictionary (11 bits) followed by a zero-padded number
from 00 through 31 (5 bits), preserving all 128 bits without collisions.

## Install

```sh
npm install human-readable-uuid
```

## Usage

```ts
import humanReadableUuid = require('human-readable-uuid');

const readable = humanReadableUuid.toHumanReadable(
  '123e4567-e89b-12d3-a456-426614174000',
);
const uuid = humanReadableUuid.toUuid(readable);
```

The package compiles from TypeScript to CommonJS. `encode` and `decode` are
short aliases for `toHumanReadable` and `toUuid`:

```js
const {encode, decode} = require('human-readable-uuid');
```

UUID input must use canonical `8-4-4-4-12` formatting, with optional braces.
Human-readable input is case-insensitive. Decoded UUIDs are returned in
canonical lowercase form.

## Compatibility

The dictionary and its order are part of the encoding format. Changing either
would make previously encoded values decode differently. Applications should
store the UUID as the durable identifier and use this representation as a
display or input format.

This package encodes UUIDs; it does not generate them and does not add security
or entropy.

## Word list

The dictionary is the standardized BIP-39 English list. Its 2,048 familiar,
pronounceable words are unique, alphabetically sorted, between 3 and 8 letters,
and deliberately selected to avoid confusingly similar spellings. Every word
is uniquely identifiable by its first four letters. See
[`THIRD_PARTY_LICENSES.md`](./THIRD_PARTY_LICENSES.md) for attribution.

The package has no runtime dependencies. Only the compiled CommonJS files,
type declarations, and documentation are published.

## License

MIT
