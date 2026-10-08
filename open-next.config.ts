import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// All app routes are dynamic; no persistent ISR cache is needed.
export default defineCloudflareConfig({});
