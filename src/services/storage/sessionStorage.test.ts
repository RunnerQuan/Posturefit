import { beforeEach, describe, expect, it } from 'vitest';
import { createSession, loadAppState, saveAppState } from './sessionStorage';

describe('sessionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('falls back to an empty schema v2 state for bad data', () => {
    localStorage.setItem('posturefit.appState.v1', '{bad json');

    expect(loadAppState()).toEqual({
      currentSessionId: null,
      sessions: [],
      schemaVersion: 2,
    });
  });

  it('keeps only the latest ten sessions', () => {
    const sessions = Array.from({ length: 12 }, (_, index) => ({
      ...createSession('upload', 'fullBody'),
        id: `session-${index}`,
        updatedAt: new Date(2026, 0, index + 1).toISOString(),
    }));

    saveAppState({
      currentSessionId: 'session-11',
      sessions,
      schemaVersion: 2,
    });

    const loaded = loadAppState();

    expect(loaded.sessions).toHaveLength(10);
    expect(loaded.sessions[0].id).toBe('session-11');
  });
});
