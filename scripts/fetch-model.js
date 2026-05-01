// Downloads the MediaPipe HandLandmarker model into public/models/ if missing.
// Idempotent — safe to run on every dev/build.
import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, '..', 'public', 'models', 'hand_landmarker.task');

if (existsSync(target)) {
  console.log(`[handyflow] model already present: ${target}`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
console.log(`[handyflow] downloading ${MODEL_URL}`);

function download(url, redirects = 5) {
  if (redirects < 0) {
    console.error('[handyflow] too many redirects');
    process.exit(1);
  }
  get(url, (res) => {
    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      download(new URL(res.headers.location, url).toString(), redirects - 1);
      return;
    }
    if (res.statusCode !== 200) {
      console.error(`[handyflow] download failed: HTTP ${res.statusCode}`);
      process.exit(1);
    }
    const out = createWriteStream(target);
    res.pipe(out);
    out.on('finish', () => {
      out.close(() => console.log(`[handyflow] saved ${target}`));
    });
  }).on('error', (err) => {
    console.error('[handyflow] download error', err);
    process.exit(1);
  });
}

download(MODEL_URL);
