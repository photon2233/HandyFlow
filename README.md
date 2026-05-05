# HandyFlow

Touchless hand-gesture control for Chrome. Webcam + MediaPipe HandLandmarker, all image processing runs locally (no video frames leave the machine).

## Phase 1 MVP

- **Index-finger point → page scroll.** Tip in the upper half of the frame scrolls up, lower half scrolls down, speed scales with distance from center. Picks the deepest scrollable container under the viewport center, so SPAs like ChatGPT, Slack, Notion, and Twitter scroll their inner panes — not just the page-level scrollbar.
- **Thumb + index pinch → play / pause** the largest visible `<video>` on the page.
- **Bottom-right skeleton preview** with current gesture label (IDLE / POINT / PINCH / INIT / ERR).
- **Popup start / stop** toggle, state persisted via `chrome.storage`.
- Camera + ML inference run in a **MAIN-world content script** on the active tab. Each new site needs to grant camera permission once; tracking follows tab switches automatically.

Not yet implemented (later phases): horizontal swipe to switch tabs, palm open/close zoom, wake gesture, ghost-overlay animation, custom shortcut bindings.

## Quick start

```bash
npm install
npm run dev          # watch build into dist/
```

Load into Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → pick the `dist/` directory
4. Click the HandyFlow toolbar icon → **Start tracking** → allow camera when prompted

## End-to-end test

| Scenario | Action | Expected |
| --- | --- | --- |
| Scroll | Long page (Wikipedia article); index finger out, others curled, hand in lower half of frame | Page scrolls down smoothly |
| Inner-container scroll | ChatGPT thread, Twitter feed, Notion doc | Inner panel scrolls (not just window) |
| Video | YouTube video, pinch thumb + index | Video pauses; pinch again to resume |
| Feedback | Any of the above | Bottom-right preview shows skeleton + label |
| Performance | Chrome task manager | Extension process CPU under ~15% |

## Project layout

```
src/
├── background/service-worker.ts   # Routes START/STOP, follows active tab
├── content/
│   ├── bridge.ts                  # ISOLATED-world bridge: chrome.runtime ↔ DOM events
│   ├── main.ts                    # MAIN-world entry: camera + inference loop + UI
│   ├── camera.ts                  # getUserMedia wrapper
│   ├── detector.ts                # HandLandmarker loader + TrustedTypes shim
│   ├── gestures/                  # Gesture classifier (point / pinch / stubs)
│   ├── preview.ts                 # Shadow-DOM skeleton overlay
│   └── actions.ts                 # Scroll-target finder + video toggle
├── popup/                         # Start / stop UI
└── shared/                        # Cross-context message types + storage wrapper
```

### Why two content scripts?

MediaPipe loads its WASM glue with `document.body.appendChild(<script src=...>)`. That `<script>` runs in the page's MAIN world, where `var ModuleFactory` is set. The MV3 default content script runs in the ISOLATED world, so it would never see that global — hence a `ModuleFactory not set` error.

We split:
- `bridge.ts` (ISOLATED) — has access to `chrome.runtime.*`, forwards START/STOP commands as DOM custom events, and exposes extension resource URLs via `documentElement.dataset` (since `chrome.runtime.getURL` is unavailable in MAIN world).
- `main.ts` (MAIN) — does the heavy lifting; lives in the same world as MediaPipe's injected WASM script, so the global lookup just works.

A small TrustedTypes policy in `detector.ts` keeps `script.src = "..."` working on strict-CSP pages like YouTube.

## Troubleshooting

- **Camera doesn't start.** Check `chrome://settings/content/camera` and confirm the page origin can request the camera. Also verify the page is reachable HTTPS — `getUserMedia` rejects `http://` for non-localhost.
- **Preview doesn't appear.** Content scripts don't inject on `chrome://`, the Chrome Web Store, or `file://`. Try a normal HTTPS page.
- **YouTube pause doesn't toggle.** Some embedded players overlay custom controls on top of the underlying `<video>`. The element is detected, but the toggle is intercepted. Site-specific adapters can be added later.
- **High CPU.** Default capture is 480×360 @ 30 fps. Lower it in `src/content/camera.ts` if needed.
- **Re-prompted for camera on every site.** Inherent to the content-script architecture: `getUserMedia` uses the page origin's permission. Permission persists per origin, but new origins prompt again.

## Privacy

- Video frames never leave the device. They're handed straight to MediaPipe's WASM runtime inside the content script — never serialized over `chrome.runtime.sendMessage` or any other cross-process channel.
- The extension makes no network requests at runtime. The model file is downloaded once at build time by `npm run fetch-model`.

## Build

```bash
npm run build        # tsc type-check + vite production build into dist/
```

`dist/` is loadable directly into Chrome, or zippable into a `.crx` / `.zip` for distribution.
