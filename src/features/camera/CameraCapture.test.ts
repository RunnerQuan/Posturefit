import { describe, expect, it } from 'vitest';
import { resolveCaptureView } from './CameraCapture';

describe('resolveCaptureView', () => {
  it('uses the selected side view for side-only mode', () => {
    expect(resolveCaptureView('side', null)).toBe('side');
  });

  it('uses the selected front view for front-only mode', () => {
    expect(resolveCaptureView('front', null)).toBe('front');
  });

  it('keeps dual-view capture order as front then side', () => {
    expect(resolveCaptureView('dual', null)).toBe('front');
    expect(resolveCaptureView('dual', 'front')).toBe('side');
  });
});
