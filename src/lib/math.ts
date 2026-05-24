export type Point = {
  x: number;
  y: number;
};

export function calculateAngle(pointA: Point, pointB: Point, pointC: Point): number {
  const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y };
  const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y };

  const dotProduct = vectorBA.x * vectorBC.x + vectorBA.y * vectorBC.y;
  const magnitudeBA = Math.sqrt(vectorBA.x ** 2 + vectorBA.y ** 2);
  const magnitudeBC = Math.sqrt(vectorBC.x ** 2 + vectorBC.y ** 2);

  if (magnitudeBA === 0 || magnitudeBC === 0) {
    return 0;
  }

  const cosAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const clampedCos = Math.max(-1, Math.min(1, cosAngle));
  const angleRad = Math.acos(clampedCos);
  const angleDeg = angleRad * (180 / Math.PI);

  return angleDeg;
}

export function calculateDistance(pointA: Point, pointB: Point): number {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// distance 是 calculateDistance 的别名
export const distance = calculateDistance;

export function angleToHorizontal(pointA: Point, pointB: Point): number {
  return Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x) * (180 / Math.PI);
}

export function signedDistanceToLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  if (lineLength === 0) {
    return 0;
  }

  return ((dx * (lineStart.y - point.y)) - (dy * (lineStart.x - point.x))) / lineLength;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

export function midpoint(pointA: Point, pointB: Point): Point {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}
