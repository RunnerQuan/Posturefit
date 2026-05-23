const APP_NAME = 'posturefit';
const VERSION = 1;

export const STORAGE_KEY = `${APP_NAME}.appState.v${VERSION}`;

export const SESSION_LIMIT = 10;

export function getStorageKey(key: string): string {
  return `${APP_NAME}.${key}.v${VERSION}`;
}
