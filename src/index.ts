import {WORDS} from './words';

const UUID_PATTERN = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i;
const TOKEN_PATTERN = /^([a-z]+)(\d{1,2})$/i;
const WORD_INDEX = new Map(WORDS.map((word, index) => [word, index]));
const NUMBER_BITS = 5;
const MAX_NUMBER = (1 << NUMBER_BITS) - 1;

function normalizeUuid(uuid: string): string {
  const unwrapped = uuid.startsWith('{') && uuid.endsWith('}')
    ? uuid.slice(1, -1)
    : uuid;
  const match = UUID_PATTERN.exec(unwrapped);

  if (!match) {
    throw new TypeError(`Invalid UUID: "${uuid}".`);
  }

  return match.slice(1).join('').toLowerCase();
}

function formatUuid(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Converts a canonical UUID into eight word-number pairs. */
export function toHumanReadable(uuid: string): string {
  if (typeof uuid !== 'string') {
    throw new TypeError('UUID must be a string.');
  }

  const hex = normalizeUuid(uuid);
  const tokens: string[] = [];

  for (let offset = 0; offset < hex.length; offset += 4) {
    const value = Number.parseInt(hex.slice(offset, offset + 4), 16);
    const word = WORDS[value >>> NUMBER_BITS]!;
    const number = value & MAX_NUMBER;
    tokens.push(`${word[0]!.toUpperCase()}${word.slice(1)}${number}`);
  }

  return tokens.join('-');
}

/** Converts eight word-number pairs into a canonical lowercase UUID. */
export function toUuid(readableId: string): string {
  if (typeof readableId !== 'string') {
    throw new TypeError('Human-readable UUID must be a string.');
  }

  const tokens = readableId.split('-');
  if (tokens.length !== 8) {
    throw new TypeError('Human-readable UUID must contain exactly 8 word-number pairs.');
  }

  const chunks = tokens.map((token) => {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) {
      throw new TypeError(`Invalid word-number pair: "${token}".`);
    }

    const inputWord = match[1]!;
    const wordIndex = WORD_INDEX.get(inputWord.toLowerCase());
    if (wordIndex === undefined) {
      throw new TypeError(`Unknown dictionary word: "${inputWord}".`);
    }

    const number = Number(match[2]);
    if (number > MAX_NUMBER) {
      throw new TypeError(`Number suffix must be between 00 and ${MAX_NUMBER}.`);
    }

    const value = (wordIndex << NUMBER_BITS) | number;
    return value.toString(16).padStart(4, '0');
  });

  return formatUuid(chunks.join(''));
}

export const encode = toHumanReadable;
export const decode = toUuid;
export {WORDS};
