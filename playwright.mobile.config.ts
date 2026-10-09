import { defineConfig } from '@playwright/test';
import base from './playwright.config';
const server = Array.isArray(base.webServer) ? base.webServer[0] : base.webServer!;
export default defineConfig({
  ...base,
  testMatch: 'mobile-layout.spec.ts',
  testIgnore: [],
  webServer: {
    ...server,
    // Existing QA fixtures plus the exact demo data used on the live site.
    command:
      'npm run db:migrate && npm run db:seed && npm run demo:seed -- --apply && npm run start -- --port 3100',
  },
});
