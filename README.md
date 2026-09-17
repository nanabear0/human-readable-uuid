# human-readable-uuid

[**Try the live UUID converter →**](https://nanabear0.github.io/human-readable-uuid/)

Turn UUIDs into deterministic word-number phrases that people can read, compare,
say aloud, and turn back into the original UUID.

| UUID | Equivalent human-readable UUID |
| --- | --- |
| `01234567-89ab-cdef-0123-456789abcdef` | `Abuse03-Earth07-Meadow11-Social15-Abuse03-Earth07-Meadow11-Social15` |

> [!WARNING]
> **This whole repository is slopcoded.** The implementation, tests,
> documentation, packaging, and word-list tooling were produced through
> AI-assisted "slopcoding." Review the code and evaluate it for your own use
> case rather than treating it as hand-crafted or independently audited
> software.

## Why?

UUIDs are excellent machine identifiers. They are fixed-size, widely supported,
and effectively unique. They are much less pleasant when they escape into a
human-facing interface:

- `123e4567-e89b-12d3-a456-426614174000` is difficult to read aloud.
- Long hexadecimal strings are easy to transpose or truncate when copied.
- Two UUIDs are hard to distinguish at a glance, especially in tables and logs.
- "The item ending in `174000`" is a poor label for a support conversation.
- Users cannot build much visual or verbal recognition around random hex.

`human-readable-uuid` gives the same 128 bits a more structured display form:
eight familiar words, each followed by a two-digit number. The result is longer,
but its boundaries are obvious and its pieces are easier to scan and dictate.

```text
Banana30-Earth07-Trigger27-Barrel19-Picture22-Draw06-Beef23-Divorce00
```

The transformation is deterministic and reversible. The same UUID always
produces the same phrase, and the phrase decodes to the exact original UUID.
There is no database, lookup service, randomness, or runtime dependency.

## Good fits

- Showing a friendlier reference next to an internal UUID
- Giving support agents an identifier that is easier to read back
- Distinguishing records in admin tools, logs, demos, and test fixtures
- Accepting either a canonical UUID or a readable representation in a UI

Keep the UUID as the durable identifier. Treat the readable value as a display
and input format, not as a replacement database key.

## Install

Install the published package from [npm](https://www.npmjs.com/package/human-readable-uuid):

```sh
npm install human-readable-uuid
```

Node.js 18 or newer is required. The package is CommonJS and includes TypeScript
declarations.

## Usage

```ts
import humanReadableUuid = require('human-readable-uuid');

const uuid = '01234567-89ab-cdef-0123-456789abcdef';

const readable = humanReadableUuid.toHumanReadable(uuid);
// Abuse03-Earth07-Meadow11-Social15-Abuse03-Earth07-Meadow11-Social15

const restored = humanReadableUuid.toUuid(readable);
// 01234567-89ab-cdef-0123-456789abcdef
```

Short aliases are also available:

```js
const {encode, decode} = require('human-readable-uuid');

const reference = encode('ffffffff-ffff-ffff-ffff-ffffffffffff');
// Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31

const uuid = decode(reference);
// ffffffff-ffff-ffff-ffff-ffffffffffff
```

### In a UI

Store and submit the real UUID, while presenting the readable form as a
secondary reference:

```js
const {encode} = require('human-readable-uuid');

function toOrderViewModel(order) {
  return {
    ...order,
    id: order.id,
    reference: encode(order.id),
  };
}
```

| UUID used by the system | Human-readable UUID shown in the UI |
| --- | --- |
| `01234567-89ab-cdef-0123-456789abcdef` | `Abuse03-Earth07-Meadow11-Social15-Abuse03-Earth07-Meadow11-Social15` |

This keeps API links, foreign keys, and storage unchanged while giving people a
reference they can recognize and communicate.

## More examples

Every row is an exact, reversible pair:

| UUID | Equivalent human-readable UUID |
| --- | --- |
| `00000000-0000-0000-0000-000000000000` | `Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00-Abandon00` |
| `ffffffff-ffff-ffff-ffff-ffffffffffff` | `Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31-Zoo31` |
| `01234567-89ab-cdef-0123-456789abcdef` | `Abuse03-Earth07-Meadow11-Social15-Abuse03-Earth07-Meadow11-Social15` |

## How it works

A UUID contains 128 bits. This package splits those bits into eight 16-bit
values. Each value becomes:

- an 11-bit index into a fixed 2,048-word dictionary; and
- a 5-bit number from `00` through `31`.

Together, each word-number pair preserves all 16 bits. Eight pairs preserve all
128 bits, so the mapping is one-to-one and has no encoding collisions.

The dictionary is the standardized BIP-39 English word list. Its 2,048 words
are unique, alphabetically sorted, between 3 and 8 letters, and uniquely
identified by their first four letters. See
[`THIRD_PARTY_LICENSES.md`](./THIRD_PARTY_LICENSES.md) for attribution.

## Input behavior

- UUID input must use canonical `8-4-4-4-12` formatting.
- UUIDs may be uppercase and may be wrapped in braces.
- Human-readable input is case-insensitive.
- Human-readable input must contain exactly eight valid word-number pairs.
- Number suffixes must contain two digits and be between `00` and `31`.
- Decoded UUIDs are returned in canonical lowercase form.
- Invalid input throws a `TypeError`.

## Limitations

Human-readable does not mean short, foolproof, or suitable for every user:

- **It is longer than a UUID.** The format trades screen space for recognizable
  chunks. Compact tables and mobile layouts may be worse with it.
- **It is not typo-correcting.** There is no checksum, fuzzy matching, or error
  recovery. A different valid word or number can represent a different UUID.
- **It is not a UUID generator.** Generate UUIDs with your platform's normal
  cryptographic UUID facility, then encode them.
- **It adds no entropy or security.** The readable value exposes exactly the
  same identifier bits as the UUID. Do not display secret or sensitive IDs.
- **It is English-only.** Some BIP-39 words may be unfamiliar, awkward, or
  inappropriate for a particular product or audience.
- **It is not natural language.** Eight word-number pairs are easier to segment,
  but users still need to copy or communicate a fairly long value.
- **The dictionary is part of the wire format.** Changing its words or order
  would make existing values decode differently. Pin package behavior and test
  stable vectors if readable IDs are persisted or exchanged between systems.

For user-facing products, test this representation with actual users and
assistive technologies. A short, server-issued support code may be a better
choice when reversibility and offline conversion are not required.

## API

```ts
toHumanReadable(uuid: string): string
toUuid(readableId: string): string
encode(uuid: string): string
decode(readableId: string): string
WORDS: readonly string[]
```

`encode` aliases `toHumanReadable`; `decode` aliases `toUuid`.

## Development

```sh
npm test
```

The test command compiles the TypeScript source and runs the Node.js test suite.
Only compiled CommonJS files, type declarations, documentation, and licenses
are included in the published package.

The GitHub Pages demo is a separate Vite project:

```sh
cd demo
npm install
npm run dev
```

`npm run build` creates the deployable site in `demo/dist`. The Pages
workflow builds and deploys that directory whenever the demo or shared
encoder source changes on `main`.

### Publishing

Releases are published through npm trusted publishing. The GitHub Release tag
must match the version in `package.json`, with an optional `v` prefix (for
example, package version `1.0.1` accepts tag `1.0.1` or `v1.0.1`).

After the first manual npm publish, configure the package's trusted publisher:

| Setting | Value |
| --- | --- |
| Provider | GitHub Actions |
| Owner | `nanabear0` |
| Repository | `human-readable-uuid` |
| Workflow filename | `publish.yml` |

Then publish a new version by updating the package version, pushing the version
commit and tag, and creating a GitHub Release for that tag. The release workflow
runs the tests and publishes without a long-lived npm token. The workflow can
also be started manually from GitHub's Actions tab by supplying the package
version.

## License

MIT
