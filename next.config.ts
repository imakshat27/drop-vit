import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@electric-sql/pglite', 'pg', 'nodemailer'],
};
export default config;
