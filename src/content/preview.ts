import type { Landmark } from '../shared/messages';

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const WIDTH = 160;
const HEIGHT = 120;

export class PreviewOverlay {
  private host: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private label: HTMLDivElement;
  private dot: HTMLDivElement;

  constructor() {
    this.host = document.createElement('div');
    this.host.id = 'handyflow-preview-host';
    Object.assign(this.host.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '2147483647',
      pointerEvents: 'none',
    } as CSSStyleDeclaration);

    const root = this.host.attachShadow({ mode: 'open' });
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      width: ${WIDTH}px;
      background: rgba(15,15,20,0.78);
      border-radius: 10px;
      padding: 8px;
      font: 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      backdrop-filter: blur(6px);
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:6px;';
    this.dot = document.createElement('div');
    this.dot.style.cssText =
      'width:8px;height:8px;border-radius:50%;background:#888;transition:background 120ms;';
    this.label = document.createElement('div');
    this.label.textContent = 'IDLE';
    this.label.style.cssText = 'font-weight:600;letter-spacing:0.04em;';
    header.append(this.dot, this.label);

    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.style.cssText = `width:${WIDTH}px;height:${HEIGHT}px;display:block;border-radius:6px;background:#000;`;

    wrap.append(header, this.canvas);
    root.append(wrap);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    this.ctx = ctx;
  }

  attach(): void {
    if (!this.host.isConnected) document.documentElement.appendChild(this.host);
  }

  detach(): void {
    this.host.remove();
  }

  render(landmarks: Landmark[], gesture: string): void {
    this.label.textContent = gesture;
    const dotColor =
      gesture === 'POINT' ? '#4ade80' :
      gesture === 'PINCH' ? '#facc15' :
      gesture === 'ERR'   ? '#f87171' :
      gesture === 'INIT'  ? '#60a5fa' :
      '#888';
    this.dot.style.background = dotColor;

    const { ctx } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (landmarks.length === 0) return;

    // MediaPipe normalized x is in mirrored selfie space; flip horizontally so it feels natural.
    const px = (l: Landmark) => (1 - l.x) * WIDTH;
    const py = (l: Landmark) => l.y * HEIGHT;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(96,165,250,0.9)';
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.moveTo(px(landmarks[a]), py(landmarks[a]));
      ctx.lineTo(px(landmarks[b]), py(landmarks[b]));
    }
    ctx.stroke();

    ctx.fillStyle = '#fff';
    for (const l of landmarks) {
      ctx.beginPath();
      ctx.arc(px(l), py(l), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
