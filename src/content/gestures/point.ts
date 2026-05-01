import type { Landmark } from '../../shared/messages';

const TIP = { thumb: 4, index: 8, middle: 12, ring: 16, pinky: 20 };
const PIP = { index: 6, middle: 10, ring: 14, pinky: 18 };

export function isPointing(landmarks: Landmark[]): boolean {
  const indexExtended = landmarks[TIP.index].y < landmarks[PIP.index].y - 0.04;
  const middleCurled = landmarks[TIP.middle].y > landmarks[PIP.middle].y - 0.01;
  const ringCurled = landmarks[TIP.ring].y > landmarks[PIP.ring].y - 0.01;
  const pinkyCurled = landmarks[TIP.pinky].y > landmarks[PIP.pinky].y - 0.01;
  return indexExtended && middleCurled && ringCurled && pinkyCurled;
}

const DEAD_ZONE = 0.1;
const MAX_VELOCITY_PX = 40;

export function pointVelocityY(landmarks: Landmark[]): number {
  const tipY = landmarks[TIP.index].y;
  const offset = tipY - 0.5;
  if (Math.abs(offset) < DEAD_ZONE) return 0;
  const signed = offset > 0 ? offset - DEAD_ZONE : offset + DEAD_ZONE;
  const normalized = Math.max(-1, Math.min(1, signed / (0.5 - DEAD_ZONE)));
  return normalized * MAX_VELOCITY_PX;
}
