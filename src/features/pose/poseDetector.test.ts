import { beforeEach, describe, expect, it, vi } from 'vitest';

const createDetector = vi.fn();

vi.mock('@tensorflow/tfjs-backend-webgl', () => ({}));
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
  getBackend: vi.fn(() => 'webgl'),
}));
vi.mock('@tensorflow-models/pose-detection', () => ({
  SupportedModels: {
    BlazePose: 'BlazePose',
  },
  createDetector,
}));

describe('createPoseDetector', () => {
  beforeEach(async () => {
    vi.resetModules();
    createDetector.mockReset();
    createDetector.mockResolvedValue({ dispose: vi.fn(), estimatePoses: vi.fn() });
  });

  it.each([
    ['BlazePose_Lite', 'lite'],
    ['BlazePose', 'full'],
    ['BlazePose_Full', 'full'],
    ['BlazePose_Heavy', 'heavy'],
  ] as const)('maps %s to the BlazePose tfjs %s model', async (input, expected) => {
    const { createPoseDetector, disposeDetector } = await import('./poseDetector');

    await createPoseDetector({ modelType: input });

    expect(createDetector).toHaveBeenCalledWith('BlazePose', expect.objectContaining({ modelType: expected }));
    disposeDetector();
  });
});
