import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@electric-sql/pglite', 'pg', 'nodemailer'],
  outputFileTracingIncludes: {
    '/*': ['node_modules/pg-cloudflare/dist/**/*', 'node_modules/pg-cloudflare/esm/**/*'],
  },
};
export default config;
