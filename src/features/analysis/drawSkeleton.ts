import type { PoseKeypoint33, BlazePoseLandmark, PostureIssueType, PostureIssue } from '../../types';
import { SKELETON_CONNECTIONS_33 } from '../pose/normalizeKeypoints';

export interface DrawOptions {
  showKeypoints?: boolean;
  showSkeleton?: boolean;
  showIssues?: boolean;
  keypointColor?: string;
  skeletonColor?: string;
  issueColor?: string;
  fontSize?: number;
}

const DEFAULT_OPTIONS: Required<DrawOptions> = {
  showKeypoints: true,
  showSkeleton: true,
  showIssues: true,
  keypointColor: '#00FF00',
  skeletonColor: '#00FF00',
  issueColor: '#FF4444',
  fontSize: 14,
};

const SEVERITY_COLORS: Record<string, string> = {
  normal: '#00FF00',
  mild: '#FFFF00',
  moderate: '#FF8800',
  severe: '#FF0000',
};

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint33[],
  issues: PostureIssue[] = [],
  imageSize: { width: number; height: number } = { width: ctx.canvas.width, height: ctx.canvas.height },
  options: DrawOptions = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  const scaleX = canvasWidth / imageSize.width;
  const scaleY = canvasHeight / imageSize.height;

  if (opts.showSkeleton) {
    drawSkeletonLines(ctx, keypoints, scaleX, scaleY, opts.skeletonColor);
  }

  if (opts.showKeypoints) {
    drawKeypoints(ctx, keypoints, scaleX, scaleY, opts.keypointColor);
  }

  if (opts.showIssues && issues) {
    drawIssueLabels(ctx, keypoints, issues, scaleX, scaleY, opts.fontSize);
  }
}

function drawSkeletonLines(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint33[],
  scaleX: number,
  scaleY: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  const keypointMap = new Map<BlazePoseLandmark, PoseKeypoint33>();
  keypoints.forEach(kp => keypointMap.set(kp.name, kp));

  for (const [startName, endName] of SKELETON_CONNECTIONS_33) {
    const start = keypointMap.get(startName);
    const end = keypointMap.get(endName);

    if (!start || !end || start.score < 0.3 || end.score < 0.3) {
      continue;
    }

    const x1 = start.x * scaleX;
    const y1 = start.y * scaleY;
    const x2 = end.x * scaleX;
    const y2 = end.y * scaleY;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint33[],
  scaleX: number,
  scaleY: number,
  baseColor: string
): void {
  for (const kp of keypoints) {
    if (kp.score < 0.3) {
      continue;
    }

    const x = kp.x * scaleX;
    const y = kp.y * scaleY;
    const radius = 5;

    ctx.fillStyle = kp.score > 0.5 ? baseColor : '#FFAA00';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawIssueLabels(
  ctx: CanvasRenderingContext2D,
  keypoints: PoseKeypoint33[],
  issues: PostureIssue[],
  scaleX: number,
  scaleY: number,
  fontSize: number
): void {
  const keypointMap = new Map<BlazePoseLandmark, PoseKeypoint33>();
  keypoints.forEach(kp => keypointMap.set(kp.name, kp));

  const issuePositions: Record<PostureIssueType, { anchor: BlazePoseLandmark; offset: { x: number; y: number } }> = {
    forwardHead: { anchor: 'nose', offset: { x: 30, y: -20 } },
    roundedShoulder: { anchor: 'left_shoulder', offset: { x: -80, y: -20 } },
    // 正面问题
    shoulderImbalance: { anchor: 'left_shoulder', offset: { x: 80, y: -20 } },
    pelvicTilt: { anchor: 'left_hip', offset: { x: 80, y: 20 } },
    anteriorPelvicTilt: { anchor: 'left_hip', offset: { x: -80, y: 20 } },
    kneeValgus: { anchor: 'left_knee', offset: { x: -80, y: 0 } },
    headOffset: { anchor: 'nose', offset: { x: -80, y: 30 } },
    centerOfGravityShift: { anchor: 'left_hip', offset: { x: -80, y: -20 } },
    // 侧面问题
    hunchback: { anchor: 'left_shoulder', offset: { x: 80, y: 0 } },
    kneeHyperextension: { anchor: 'left_knee', offset: { x: 80, y: 0 } },
  };

  for (const issue of issues) {
    if (issue.severity === 'normal') {
      continue;
    }

    const pos = issuePositions[issue.type];
    const anchor = keypointMap.get(pos.anchor);
    if (!anchor || anchor.score < 0.3) {
      continue;
    }

    const x = anchor.x * scaleX + pos.offset.x;
    const y = anchor.y * scaleY + pos.offset.y;
    const color = SEVERITY_COLORS[issue.severity] || SEVERITY_COLORS.mild;

    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    const textWidth = ctx.measureText(issue.label).width;
    const padding = 6;
    const boxWidth = textWidth + padding * 2;
    const boxHeight = fontSize + padding * 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - padding, y - padding, boxWidth, boxHeight, 4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - padding, y - padding, boxWidth, boxHeight, 4);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(issue.label, x, y);
  }
}
