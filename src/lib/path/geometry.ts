export interface Point { x: number; y: number; }

export function generatePathPoints(nodeCount: number, containerWidth: number = 400): Point[] {
  const VERTICAL_SPACING = 100;
  const AMPLITUDE = containerWidth * 0.25;
  const CENTER_X = containerWidth / 2;
  const points: Point[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const x = CENTER_X + Math.sin(i * 1.2) * AMPLITUDE;
    const y = 80 + i * VERTICAL_SPACING;
    points.push({ x: Math.round(x), y: Math.round(y) });
  }
  return points;
}

export function generateSVGPath(points: Point[]): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpY = (prev.y + curr.y) / 2;
    path += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`;
  }
  return path;
}

export function calculatePathHeight(nodeCount: number): number {
  return 80 + (nodeCount - 1) * 100 + 160;
}
