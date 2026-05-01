import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

export type Detector = {
  detect(video: HTMLVideoElement, timestampMs: number): HandLandmarkerResult;
  close(): void;
};

const LANDMARKER_OPTIONS = {
  runningMode: 'VIDEO' as const,
  numHands: 1,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

function getResourceUrls(): { assets: string; model: string } {
  const assets = document.documentElement.dataset.handyflowAssets;
  const model = document.documentElement.dataset.handyflowModel;
  if (!assets || !model) {
    throw new Error('handyflow: extension URLs not provided by ISOLATED bridge');
  }
  return { assets, model };
}

// Some pages (YouTube, Trusted Types–strict apps) reject `script.src = "..."`
// with a plain string. Install a TrustedTypes policy and patch the setter so
// MediaPipe's internal <script>-injection still works.
let trustedTypesPatched = false;
function installTrustedTypesShim(): void {
  if (trustedTypesPatched) return;
  trustedTypesPatched = true;
  const tt = (window as any).trustedTypes;
  if (!tt?.createPolicy) return;

  let policy: any;
  try {
    policy = tt.createPolicy('handyflow', { createScriptURL: (url: string) => url });
  } catch (err) {
    console.warn('[handyflow] trustedTypes policy creation failed', err);
    return;
  }

  const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  if (!desc?.set) return;
  const origSet = desc.set;
  Object.defineProperty(HTMLScriptElement.prototype, 'src', {
    ...desc,
    set(value: unknown) {
      if (typeof value === 'string') {
        value = policy.createScriptURL(value);
      }
      origSet.call(this, value);
    },
  });
}

export async function createDetector(): Promise<Detector> {
  installTrustedTypesShim();
  const { assets, model } = getResourceUrls();
  const vision = await FilesetResolver.forVisionTasks(assets);

  let landmarker: HandLandmarker;
  try {
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: model, delegate: 'GPU' },
      ...LANDMARKER_OPTIONS,
    });
  } catch (gpuErr) {
    console.warn('[handyflow] GPU delegate failed, retrying with CPU', gpuErr);
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: model, delegate: 'CPU' },
      ...LANDMARKER_OPTIONS,
    });
  }

  return {
    detect: (video, ts) => landmarker.detectForVideo(video, ts),
    close: () => landmarker.close(),
  };
}
