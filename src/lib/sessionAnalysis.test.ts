import { describe, expect, it } from 'vitest';
import { getSessionDisplayAnalysis, getSessionDisplayIssueLabel, getSessionDisplayPhotos } from './sessionAnalysis';
import type { CombinedAnalysisResult, PostureAnalysisResult, PostureSession } from '../types';

const singleAnalysis: PostureAnalysisResult = {
  keypoints: [],
  metrics: {
    forwardHeadAngle: 0,
    roundedShoulderAngle: 0,
    shoulderImbalanceAngle: 0,
    pelvicTiltAngle: 0,
    anteriorTiltAngle: 0,
    kneeValgusAngle: 0,
    headOffsetAngle: 0,
    centerOfGravityShiftAngle: 0,
    hunchbackAngle: 0,
    kneeHyperextensionAngle: 180,
    trunkLeanAngle: 0,
  },
  issues: [],
  primaryIssue: 'pelvicTilt',
  score: 70,
  analyzedAt: '2026-05-24T00:00:00.000Z',
  view: 'front',
};

const staleCombinedAnalysis: CombinedAnalysisResult = {
  allIssues: [],
  issuesByView: { front: [], side: [] },
  primaryIssue: 'pelvicTilt',
  score: 90,
  frontViewScore: { view: 'front', items: [], normalizedScore: 90 },
  sideViewScore: { view: 'side', items: [], normalizedScore: 90 },
  allScores: [],
  analyzedAt: '2026-05-24T00:00:00.000Z',
};

function createSession(overrides: Partial<PostureSession>): PostureSession {
  return {
    id: 'session-1',
    createdAt: '2026-05-24T00:00:00.000Z',
    updatedAt: '2026-05-24T00:00:00.000Z',
    step: 'chat',
    sourceType: 'upload',
    captureMode: 'fullBody',
    viewSelection: 'dual',
    photos: [],
    chatMessages: [],
    ...overrides,
  };
}

describe('sessionAnalysis', () => {
  it('ignores stale combined scores until both dual-view analyses exist', () => {
    const session = createSession({
      analysis: singleAnalysis,
      combinedAnalysis: staleCombinedAnalysis,
      photos: [
        {
          id: 'front',
          view: 'front',
          imageUrl: 'front.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: singleAnalysis,
        },
      ],
    });

    expect(getSessionDisplayAnalysis(session)?.score).toBe(70);
  });

  it('uses the combined score only for complete dual-view analysis', () => {
    const sideAnalysis = { ...singleAnalysis, view: 'side' as const };
    const session = createSession({
      analysis: sideAnalysis,
      combinedAnalysis: staleCombinedAnalysis,
      photos: [
        {
          id: 'front',
          view: 'front',
          imageUrl: 'front.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: singleAnalysis,
        },
        {
          id: 'side',
          view: 'side',
          imageUrl: 'side.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: sideAnalysis,
        },
      ],
    });

    expect(getSessionDisplayAnalysis(session)?.score).toBe(90);
  });

  it('shows only the analyzed single-view photo when stale photos exist', () => {
    const sideAnalysis = { ...singleAnalysis, view: 'side' as const };
    const session = createSession({
      analysis: sideAnalysis,
      photos: [
        {
          id: 'stale-front',
          view: 'front',
          imageUrl: 'stale-front.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: singleAnalysis,
        },
        {
          id: 'current-side',
          view: 'side',
          imageUrl: 'current-side.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: sideAnalysis,
        },
      ],
    });

    expect(getSessionDisplayPhotos(session).map(photo => photo.imageUrl)).toEqual(['current-side.png']);
  });

  it('shows healthy label when score is 100 without a primary issue', () => {
    const session = createSession({
      analysis: {
        ...singleAnalysis,
        primaryIssue: null,
        issues: [],
        score: 100,
      },
    });

    expect(getSessionDisplayIssueLabel(session)).toBe('体态良好');
  });

  it('shows healthy label when analysis has no issues and score is above 90', () => {
    const session = createSession({
      analysis: {
        ...singleAnalysis,
        primaryIssue: null,
        issues: [],
        score: 96.6,
      },
    });

    expect(getSessionDisplayIssueLabel(session)).toBe('体态良好');
  });

  it('shows healthy label when all analyzed issues are normal and score is above 90', () => {
    const session = createSession({
      analysis: {
        ...singleAnalysis,
        primaryIssue: null,
        issues: [
          {
            type: 'pelvicTilt',
            severity: 'normal',
            angle: 0.4,
            threshold: 5,
            label: '骨盆侧倾正常',
            view: 'front',
          },
          {
            type: 'headOffset',
            severity: 'normal',
            angle: 0.8,
            threshold: 5,
            label: '头部偏移正常',
            view: 'front',
          },
        ],
        score: 100,
      },
    });

    expect(getSessionDisplayIssueLabel(session)).toBe('体态良好');
  });

  it('shows healthy label when combined analysis has only normal issues and score is above 90', () => {
    const sideAnalysis = { ...singleAnalysis, view: 'side' as const };
    const session = createSession({
      analysis: sideAnalysis,
      combinedAnalysis: {
        ...staleCombinedAnalysis,
        primaryIssue: null,
        score: 96.6,
        allIssues: [
          {
            type: 'pelvicTilt',
            severity: 'normal',
            angle: 0.4,
            threshold: 5,
            label: '骨盆侧倾正常',
            view: 'front',
          },
          {
            type: 'roundedShoulder',
            severity: 'normal',
            angle: 1.2,
            threshold: 25,
            label: '圆肩正常',
            view: 'side',
          },
        ],
        issuesByView: {
          front: [
            {
              type: 'pelvicTilt',
              severity: 'normal',
              angle: 0.4,
              threshold: 5,
              label: '骨盆侧倾正常',
              view: 'front',
            },
          ],
          side: [
            {
              type: 'roundedShoulder',
              severity: 'normal',
              angle: 1.2,
              threshold: 25,
              label: '圆肩正常',
              view: 'side',
            },
          ],
        },
      },
      photos: [
        {
          id: 'front',
          view: 'front',
          imageUrl: 'front.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: singleAnalysis,
        },
        {
          id: 'side',
          view: 'side',
          imageUrl: 'side.png',
          capturedAt: '2026-05-24T00:00:00.000Z',
          analysis: sideAnalysis,
        },
      ],
    });

    expect(getSessionDisplayIssueLabel(session)).toBe('体态良好');
  });

  it('still shows the detected issue when score is high', () => {
    const session = createSession({
      analysis: {
        ...singleAnalysis,
        primaryIssue: 'pelvicTilt',
        issues: [
          {
            type: 'pelvicTilt',
            severity: 'mild',
            angle: 3.2,
            threshold: 2,
            label: '骨盆侧倾',
            view: 'front',
          },
        ],
        score: 96.6,
      },
    });

    expect(getSessionDisplayIssueLabel(session)).toBe('骨盆侧倾');
  });
});
