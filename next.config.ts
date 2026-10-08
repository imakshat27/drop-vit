import type { NextConfig } from 'next';
const config: NextConfig = { serverExternalPackages: ['@electric-sql/pglite', 'pg', 'nodemailer'] };
export default config;
