import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'HandyFlow',
  description: 'Touchless web control via hand gestures. All processing runs locally.',
  version: pkg.version,
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_popup: 'src/popup/popup.html',
    default_title: 'HandyFlow',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['storage', 'tabs'],
  host_permissions: ['<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/bridge.ts'],
      run_at: 'document_start',
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
      world: 'MAIN',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['models/*', 'assets/*'],
      matches: ['<all_urls>'],
    },
  ],
});
