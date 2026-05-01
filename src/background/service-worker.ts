import type { ExtensionMessage } from '../shared/messages';
import { loadSettings, saveSettings } from '../shared/settings';

let activeTrackedTabId: number | null = null;

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id ?? null;
}

async function sendToTab(tabId: number, message: ExtensionMessage): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    // Tab may not have a content script (chrome:// pages, web store) — ignore.
  }
}

async function startTracking(): Promise<void> {
  const tabId = await getActiveTabId();
  if (tabId === null) return;
  activeTrackedTabId = tabId;
  await saveSettings({ enabled: true });
  await sendToTab(tabId, { type: 'START_TRACKING' });
  broadcastTrackingState(true);
}

async function stopTracking(): Promise<void> {
  await saveSettings({ enabled: false });
  if (activeTrackedTabId !== null) {
    await sendToTab(activeTrackedTabId, { type: 'STOP_TRACKING' });
  }
  activeTrackedTabId = null;
  broadcastTrackingState(false);
}

function broadcastTrackingState(running: boolean): void {
  chrome.runtime
    .sendMessage({ type: 'TRACKING_STATE', running } satisfies ExtensionMessage)
    .catch(() => {
      /* No listener (popup closed) — ignore. */
    });
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'START_TRACKING':
      startTracking().then(() => sendResponse({ ok: true }));
      return true;
    case 'STOP_TRACKING':
      stopTracking().then(() => sendResponse({ ok: true }));
      return true;
    default:
      return false;
  }
});

// Hand off camera ownership when the user switches tabs while tracking is on:
// stop the previous tab's content script, start the new active tab's.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const { enabled } = await loadSettings();
  if (!enabled) return;
  if (activeTrackedTabId !== null && activeTrackedTabId !== tabId) {
    await sendToTab(activeTrackedTabId, { type: 'STOP_TRACKING' });
  }
  activeTrackedTabId = tabId;
  await sendToTab(tabId, { type: 'START_TRACKING' });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTrackedTabId === tabId) activeTrackedTabId = null;
});

chrome.runtime.onStartup.addListener(async () => {
  // Don't auto-resume — user re-toggles after browser restart to acknowledge
  // that camera permission may need re-granting on per-origin basis.
  await saveSettings({ enabled: false });
});
