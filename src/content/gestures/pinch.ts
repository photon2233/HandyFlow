import type { Landmark } from '../../shared/messages';

const PINCH_THRESHOLD = 0.06;
const RELEASE_THRESHOLD = 0.09;
const COOLDOWN_MS = 350;

type State = 'OPEN' | 'CLOSED';

export class PinchTracker {
  private state: State = 'OPEN';
  private lastTransitionAt = 0;

  update(landmarks: Landmark[], now: number): 'PINCH_DOWN' | 'PINCH_UP' | null {
    const dx = landmarks[4].x - landmarks[8].x;
    const dy = landmarks[4].y - landmarks[8].y;
    const dz = landmarks[4].z - landmarks[8].z;
    const dist = Math.hypot(dx, dy, dz);

    if (now - this.lastTransitionAt < COOLDOWN_MS) return null;

    if (this.state === 'OPEN' && dist < PINCH_THRESHOLD) {
      this.state = 'CLOSED';
      this.lastTransitionAt = now;
      return 'PINCH_DOWN';
    }
    if (this.state === 'CLOSED' && dist > RELEASE_THRESHOLD) {
      this.state = 'OPEN';
      this.lastTransitionAt = now;
      return 'PINCH_UP';
    }
    return null;
  }

  reset(): void {
    this.state = 'OPEN';
    this.lastTransitionAt = 0;
  }
}

export function isPinched(landmarks: Landmark[]): boolean {
  const dx = landmarks[4].x - landmarks[8].x;
  const dy = landmarks[4].y - landmarks[8].y;
  return Math.hypot(dx, dy) < PINCH_THRESHOLD;
}
