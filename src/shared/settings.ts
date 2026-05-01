export interface Settings {
  enabled: boolean;
}

const DEFAULTS: Settings = { enabled: false };

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...stored } as Settings;
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await chrome.storage.local.set(patch);
}
