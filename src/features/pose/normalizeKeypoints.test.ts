import { describe, expect, it } from 'vitest';
import type { CaptureMode, BlazePoseLandmark, PoseKeypoint33 } from '../../types';
import { validateKeypointsForMode } from './normalizeKeypoints';

// MediaPipe BlazePose 33 点关键点
const KEYPOINT_NAMES_33: BlazePoseLandmark[] = [
  'nose',
  'left_eye_inner',
  'left_eye',
  'left_eye_outer',
  'right_eye_inner',
  'right_eye',
  'right_eye_outer',
  'left_ear',
  'right_ear',
  'mouth_left',
  'mouth_right',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_pinky',
  'right_pinky',
  'left_index',
  'right_index',
  'left_thumb',
  'right_thumb',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
  'left_heel',
  'right_heel',
  'left_foot_index',
  'right_foot_index',
];

function pose33(missing: BlazePoseLandmark[] = []): PoseKeypoint33[] {
  return KEYPOINT_NAMES_33.map((name, index) => ({
    name,
    x: index * 10,
    y: index * 20,
    score: missing.includes(name) ? 0 : 0.95,
  }));
}

function validate(mode: CaptureMode, missing: BlazePoseLandmark[] = []) {
  return validateKeypointsForMode(pose33(missing), mode);
}

describe('validateKeypointsForMode', () => {
  it('requires a full body outline for fullBody mode', () => {
    const result = validate('fullBody', ['left_knee', 'right_knee', 'left_ankle', 'right_ankle']);

    expect(result.isValid).toBe(false);
    expect(result.message).toBe('请上传完整全身照片，确保头部、肩部、髋部、膝盖和脚踝都在画面内');
  });

  it('allows halfBody mode without leg keypoints', () => {
    const result = validate('halfBody', ['left_knee', 'right_knee', 'left_ankle', 'right_ankle']);

    expect(result.isValid).toBe(true);
  });

  it('rejects closeUp front-view photos without hip keypoints because head offset cannot be analyzed', () => {
    const result = validate('closeUp', [
      'left_hip',
      'right_hip',
      'left_knee',
      'right_knee',
      'left_ankle',
      'right_ankle',
    ]);

    expect(result.isValid).toBe(false);
    expect(result.missingKeypoints).toEqual(['left_hip', 'right_hip']);
  });

  it('allows sitting mode without ankle keypoints', () => {
    const result = validate('sitting', ['left_ankle', 'right_ankle']);

    expect(result.isValid).toBe(true);
  });

  it('allows side-view analysis when one side is visible and the far side is hidden', () => {
    const result = validateKeypointsForMode(
      pose33(['right_shoulder', 'right_hip', 'right_knee', 'right_ankle']),
      'fullBody',
      'side'
    );

    expect(result.isValid).toBe(true);
  });

  it('rejects side-view full-body photos when the visible leg keypoints needed for knee hyperextension are missing', () => {
    const result = validateKeypointsForMode(
      pose33(['right_shoulder', 'right_hip', 'right_knee', 'right_ankle', 'left_knee', 'left_ankle']),
      'fullBody',
      'side'
    );

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('膝盖和脚踝');
    expect(result.missingKeypoints).toEqual(['left_knee', 'left_ankle']);
  });

  it('rejects side-view full-body photos when ears needed for forward-head analysis are missing', () => {
    const result = validateKeypointsForMode(
      pose33(['right_shoulder', 'right_hip', 'right_knee', 'right_ankle', 'left_ear']),
      'fullBody',
      'side'
    );

    expect(result.isValid).toBe(false);
    expect(result.missingKeypoints).toEqual(['left_ear']);
  });

  it('rejects clearly unreliable front-view full-body poses before analysis', () => {
    const unreliable = pose33().map(point =>
      point.name === 'right_hip' ? { ...point, x: 500 } : point
    );

    const result = validateKeypointsForMode(unreliable, 'fullBody', 'front');

    expect(result.isValid).toBe(false);
    expect(result.message).toContain('拍摄角度');
  });
});
