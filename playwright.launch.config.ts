import { defineConfig } from '@playwright/test';
import { weekBounds } from './src/lib/constants';
const qaPath = `.data/e2e-${Date.now()}`;
const firstRelease = weekBounds().end.toISOString();
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: '.data/launch-test-results',
  testMatch: 'launch-empty.spec.ts',
  workers: 1,
  metadata: { firstRelease },
  use: { baseURL: 'http://localhost:3101', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run db:migrate && npm run start -- --port 3101',
    url: 'http://localhost:3101',
    reuseExistingServer: false,
    env: {
      DATABASE_URL: '',
      DATABASE_MIGRATION_URL: '',
      DATABASE_URL_UNPOOLED: '',
      ALLOW_LOCAL_DB: '1',
      LOCAL_DB_PATH: qaPath,
      APP_URL: 'http://localhost:3101',
      DROP_FIRST_RELEASE_AT: firstRelease,
    },
  },
});
