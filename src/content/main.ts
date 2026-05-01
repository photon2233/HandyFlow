import type { ExtensionMessage, GestureLabel, Landmark } from '../shared/messages';
import { scrollByVelocity, togglePrimaryVideo } from './actions';
import { PreviewOverlay } from './preview';
import { startCamera, type CameraHandle } from './camera';
import { createDetector, type Detector } from './detector';
import { GestureClassifier } from './gestures';

const FRAME_INTERVAL_MS = 1000 / 30;
const PREVIEW_INTERVAL_MS = 1000 / 15;

const overlay = new PreviewOverlay();
const classifier = new GestureClassifier();

let camera: CameraHandle | null = null;
let detector: Detector | null = null;
let running = false;
let rafId: number | null = null;
let timeoutId: number | null = null;
let lastPreviewAt = 0;

async function start(): Promise<void> {
  if (running) return;

  overlay.attach();
  overlay.render([], 'INIT');

  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.display = 'none';
  document.documentElement.appendChild(video);

  try {
    camera = await startCamera(video);
    detector = await createDetector();
  } catch (err) {
    video.remove();
    camera = null;
    detector = null;
    overlay.render([], 'ERR');
    console.error('[handyflow] start failed', err);
    return;
  }

  classifier.reset();
  running = true;
  loop();
}

function stop(): void {
  running = false;
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (timeoutId !== null) clearTimeout(timeoutId);
  rafId = timeoutId = null;
  detector?.close();
  detector = null;
  if (camera) {
    camera.video.remove();
    camera.stop();
  }
  camera = null;
  overlay.detach();
}

function loop(): void {
  if (!running || !camera || !detector) return;
  const now = performance.now();
  let result;
  try {
    result = detector.detect(camera.video, now);
  } catch (err) {
    console.error('[handyflow] detect failed', err);
    rafId = requestAnimationFrame(loop);
    return;
  }
  const hand = result.landmarks?.[0];
  let label: GestureLabel = 'IDLE';
  let landmarks: Landmark[] = [];
  if (hand && hand.length === 21) {
    landmarks = hand.map((p) => ({ x: p.x, y: p.y, z: p.z }));
    const classified = classifier.classify(landmarks, now);
    label = classified.label;
    for (const event of classified.events) {
      if (event.kind === 'POINT_SCROLL') scrollByVelocity(event.velocityY);
      else if (event.kind === 'PINCH_DOWN') togglePrimaryVideo();
    }
  } else {
    classifier.reset();
  }
  if (now - lastPreviewAt >= PREVIEW_INTERVAL_MS) {
    overlay.render(landmarks, label);
    lastPreviewAt = now;
  }
  timeoutId = window.setTimeout(() => {
    rafId = requestAnimationFrame(loop);
  }, FRAME_INTERVAL_MS);
}

document.addEventListener('handyflow-cmd', (ev) => {
  const message = (ev as CustomEvent<ExtensionMessage>).detail;
  if (message.type === 'START_TRACKING') {
    start();
  } else if (message.type === 'STOP_TRACKING') {
    stop();
  } else if (message.type === 'TRACKING_STATE' && !message.running) {
    stop();
  }
});
