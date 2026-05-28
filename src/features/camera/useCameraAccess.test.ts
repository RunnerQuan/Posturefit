import { describe, expect, it, vi } from 'vitest';
import { buildCameraConstraintCandidates, shouldPreferRearCamera } from './useCameraAccess';

describe('useCameraAccess helpers', () => {
  it('prefers rear camera on narrow coarse-pointer touch devices', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 430,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 5,
    });
    vi.mocked(window.matchMedia).mockImplementation(query => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    expect(shouldPreferRearCamera()).toBe(true);
  });

  it('keeps the user-facing camera preference on desktop-like devices', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      configurable: true,
      value: 0,
    });
    vi.mocked(window.matchMedia).mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    expect(shouldPreferRearCamera()).toBe(false);
  });

  it('tries rear-camera constraints before falling back to user-facing camera', () => {
    const constraints = buildCameraConstraintCandidates(true);

    expect(constraints).toEqual([
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { exact: 'environment' },
        },
      },
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' },
        },
      },
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      },
    ]);
  });
});
