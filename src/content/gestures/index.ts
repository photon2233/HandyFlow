import type { GestureEvent, GestureLabel, Landmark } from '../../shared/messages';
import { isPointing, pointVelocityY } from './point';
import { PinchTracker, isPinched } from './pinch';

export interface ClassifyResult {
  label: GestureLabel;
  events: GestureEvent[];
}

export class GestureClassifier {
  private pinch = new PinchTracker();

  classify(landmarks: Landmark[], now: number): ClassifyResult {
    const events: GestureEvent[] = [];
    const pinchEvent = this.pinch.update(landmarks, now);
    if (pinchEvent) events.push({ kind: pinchEvent });

    if (isPinched(landmarks)) {
      return { label: 'PINCH', events };
    }

    if (isPointing(landmarks)) {
      const velocityY = pointVelocityY(landmarks);
      if (velocityY !== 0) events.push({ kind: 'POINT_SCROLL', velocityY });
      return { label: 'POINT', events };
    }

    return { label: 'IDLE', events };
  }

  reset(): void {
    this.pinch.reset();
  }
}
