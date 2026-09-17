import {toHumanReadable, toUuid} from '../../src/index';
import './style.css';

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to convert this value.';
}

const uuidInput = getElement<HTMLTextAreaElement>('uuid-input');
const humanInput = getElement<HTMLTextAreaElement>('human-input');
const uuidError = getElement<HTMLParagraphElement>('uuid-error');
const humanError = getElement<HTMLParagraphElement>('human-error');
const status = getElement<HTMLParagraphElement>('conversion-status');
const generateButton = getElement<HTMLButtonElement>('generate-button');
const clearButton = getElement<HTMLButtonElement>('clear-button');

function setError(
  input: HTMLTextAreaElement,
  errorElement: HTMLParagraphElement,
  message = '',
): void {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  errorElement.textContent = message;
}

function encodeUuid(): void {
  const value = uuidInput.value.trim();
  setError(uuidInput, uuidError);
  setError(humanInput, humanError);

  if (!value) {
    humanInput.value = '';
    status.textContent = 'Enter a UUID or generate a random one.';
    return;
  }

  try {
    humanInput.value = toHumanReadable(value);
    status.textContent = 'Encoded locally. All 128 bits are preserved.';
  } catch (error) {
    humanInput.value = '';
    setError(uuidInput, uuidError, errorMessage(error));
    status.textContent = 'Fix the UUID to continue.';
  }
}

function decodeHumanReadableUuid(): void {
  const value = humanInput.value.trim();
  setError(uuidInput, uuidError);
  setError(humanInput, humanError);

  if (!value) {
    uuidInput.value = '';
    status.textContent = 'Enter a human-readable UUID to decode it.';
    return;
  }

  try {
    uuidInput.value = toUuid(value);
    status.textContent = 'Decoded locally to the exact original UUID.';
  } catch (error) {
    uuidInput.value = '';
    setError(humanInput, humanError, errorMessage(error));
    status.textContent = 'Fix the human-readable UUID to continue.';
  }
}

function useUuid(uuid: string): void {
  uuidInput.value = uuid;
  encodeUuid();
}

uuidInput.addEventListener('input', encodeUuid);
humanInput.addEventListener('input', decodeHumanReadableUuid);

generateButton.addEventListener('click', () => {
  useUuid(crypto.randomUUID());
  uuidInput.focus();
});

clearButton.addEventListener('click', () => {
  uuidInput.value = '';
  humanInput.value = '';
  setError(uuidInput, uuidError);
  setError(humanInput, humanError);
  status.textContent = 'Ready to convert in either direction.';
  uuidInput.focus();
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-uuid]')) {
  button.addEventListener('click', () => {
    const uuid = button.dataset.uuid;
    if (uuid) {
      useUuid(uuid);
      document.querySelector('.converter')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  });
}

const copyTimeouts = new WeakMap<HTMLButtonElement, number>();

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-target]')) {
  button.addEventListener('click', async () => {
    const targetId = button.dataset.copyTarget;
    if (!targetId) {
      return;
    }

    const target = getElement<HTMLTextAreaElement>(targetId);
    if (!target.value) {
      status.textContent = 'There is nothing to copy yet.';
      return;
    }

    try {
      await navigator.clipboard.writeText(target.value);
      const existingTimeout = copyTimeouts.get(button);
      if (existingTimeout !== undefined) {
        window.clearTimeout(existingTimeout);
      }

      button.textContent = 'Copied';
      copyTimeouts.set(
        button,
        window.setTimeout(() => {
          button.textContent = 'Copy';
          copyTimeouts.delete(button);
        }, 1600),
      );
    } catch {
      status.textContent = 'Clipboard access was denied. Select and copy the value manually.';
      target.focus();
      target.select();
    }
  });
}

useUuid('01234567-89ab-cdef-0123-456789abcdef');
