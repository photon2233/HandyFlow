import type { ExtensionMessage } from '../shared/messages';

// Expose extension resource URLs to the MAIN-world script via DOM dataset.
// chrome.runtime.getURL is unavailable in MAIN world, so we resolve here.
document.documentElement.dataset.handyflowAssets = chrome.runtime.getURL('assets');
document.documentElement.dataset.handyflowModel = chrome.runtime.getURL(
  'models/hand_landmarker.task',
);

// Forward background commands to MAIN world via DOM custom events.
// MAIN world cannot listen to chrome.runtime.onMessage directly.
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  document.dispatchEvent(new CustomEvent('handyflow-cmd', { detail: message }));
  sendResponse({ ok: true });
  return false;
});

window.addEventListener('beforeunload', () => {
  document.dispatchEvent(
    new CustomEvent('handyflow-cmd', { detail: { type: 'STOP_TRACKING' } }),
  );
});
