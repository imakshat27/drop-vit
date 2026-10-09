import { defineConfig } from '@playwright/test';
const qaPath = `.data/e2e-${Date.now()}`;
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  metadata: { qaPath },
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run db:migrate && npm run db:seed && npm run start -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    env: {
      LOCAL_DB_PATH: qaPath,
      ALLOW_LOCAL_DB: '1',
      DATABASE_URL: '',
      DATABASE_MIGRATION_URL: '',
      DATABASE_URL_UNPOOLED: '',
      APP_URL: 'http://localhost:3100',
      SMTP_HOST: '',
      GOOGLE_CLIENT_ID: 'qa-client.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'qa-only-placeholder',
      CURATOR_EMAIL: '',
      SEED_DEMO_PASSWORD: 'Drop-test-only-2026!',
    },
  },
});
