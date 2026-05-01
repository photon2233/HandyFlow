import type { ExtensionMessage } from '../shared/messages';
import { loadSettings } from '../shared/settings';

const button = document.getElementById('toggle') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLSpanElement;
const dot = document.getElementById('dot') as HTMLSpanElement;

function render(running: boolean): void {
  button.textContent = running ? 'Stop tracking' : 'Start tracking';
  button.className = running ? 'on' : 'off';
  status.textContent = running ? 'Live' : 'Stopped';
  dot.classList.toggle('live', running);
}

button.addEventListener('click', async () => {
  const { enabled } = await loadSettings();
  const next: ExtensionMessage = enabled ? { type: 'STOP_TRACKING' } : { type: 'START_TRACKING' };
  button.disabled = true;
  try {
    await chrome.runtime.sendMessage(next);
    render(!enabled);
  } catch (err) {
    console.error('[handyflow] toggle failed', err);
    status.textContent = 'Error — see console';
  } finally {
    button.disabled = false;
  }
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === 'TRACKING_STATE') render(message.running);
});

loadSettings().then((s) => render(s.enabled));
