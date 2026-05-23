import { describe, expect, it } from 'vitest';
import type { CaptureMode, KeypointName, PoseKeypoint17 } from '../../types';
import { validateKeypointsForMode } from './normalizeKeypoints';

const KEYPOINT_NAMES: KeypointName[] = [
  'nose',
  'leftEye',
  'rightEye',
  'leftEar',
  'rightEar',
  'leftShoulder',
  'rightShoulder',
  'leftElbow',
  'rightElbow',
  'leftWrist',
  'rightWrist',
  'leftHip',
  'rightHip',
  'leftKnee',
  'rightKnee',
  'leftAnkle',
  'rightAnkle',
];

function pose(missing: KeypointName[] = []): PoseKeypoint17[] {
  return KEYPOINT_NAMES.map((name, index) => ({
    name,
    x: index * 10,
    y: index * 20,
    score: missing.includes(name) ? 0 : 0.95,
  }));
}

function validate(mode: CaptureMode, missing: KeypointName[] = []) {
  return validateKeypointsForMode(pose(missing), mode);
}

describe('validateKeypointsForMode', () => {
  it('requires a full body outline for fullBody mode', () => {
    const result = validate('fullBody', ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']);

    expect(result.isValid).toBe(false);
    expect(result.message).toBe('请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内');
  });

  it('allows halfBody mode without leg keypoints', () => {
    const result = validate('halfBody', ['leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle']);

    expect(result.isValid).toBe(true);
  });

  it('allows closeUp mode without hip and leg keypoints', () => {
    const result = validate('closeUp', [
      'leftHip',
      'rightHip',
      'leftKnee',
      'rightKnee',
      'leftAnkle',
      'rightAnkle',
    ]);

    expect(result.isValid).toBe(true);
  });

  it('allows sitting mode without ankle keypoints', () => {
    const result = validate('sitting', ['leftAnkle', 'rightAnkle']);

    expect(result.isValid).toBe(true);
  });
});
