import nodemailer from 'nodemailer';

export function createEmailTransport(
  settings: {
    SMTP_HOST?: string;
    SMTP_PORT?: string;
    SMTP_USER?: string;
    SMTP_PASSWORD?: string;
  } = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  },
) {
  const host = settings.SMTP_HOST;
  if (!host) throw new Error('SMTP_HOST is required');
  const port = Number(settings.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('SMTP_PORT must be a valid port');
  if (Boolean(settings.SMTP_USER) !== Boolean(settings.SMTP_PASSWORD))
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together');
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || port === 2465,
    requireTLS: true,
    auth: settings.SMTP_USER
      ? { user: settings.SMTP_USER, pass: settings.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    dnsTimeout: 15000,
  });
}
