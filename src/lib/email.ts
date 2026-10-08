import nodemailer from 'nodemailer';

export function createEmailTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error('SMTP_HOST is required');
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('SMTP_PORT must be a valid port');
  if (Boolean(process.env.SMTP_USER) !== Boolean(process.env.SMTP_PASSWORD))
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together');
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || port === 2465,
    requireTLS: true,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    dnsTimeout: 15000,
  });
}
