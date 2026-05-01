export type Landmark = { x: number; y: number; z: number };

export type GestureLabel = 'IDLE' | 'POINT' | 'PINCH';

export type GestureEvent =
  | { kind: 'POINT_SCROLL'; velocityY: number }
  | { kind: 'PINCH_DOWN' }
  | { kind: 'PINCH_UP' };

export type ExtensionMessage =
  | { type: 'START_TRACKING' }
  | { type: 'STOP_TRACKING' }
  | { type: 'TRACKING_STATE'; running: boolean };
