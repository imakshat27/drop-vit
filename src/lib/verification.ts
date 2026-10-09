import { and, eq, gt } from 'drizzle-orm';
import { db } from './db';
import { verificationTokens, users } from './schema';
import { hashToken } from './password';
import { randomBytes } from 'node:crypto';
import { createEmailTransport } from './email';
import { verificationEmail } from './verification-email';

export async function sendVerification(userId: string, email: string) {
  if (!process.env.SMTP_HOST) return false;
  const origin = process.env.APP_URL;
  if (!origin && process.env.NODE_ENV === 'production') throw new Error('APP_URL is required');
  const url = new URL('/verify', origin || 'http://localhost:3000');
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  url.searchParams.set('token', token);
  await db()
    .insert(verificationTokens)
    .values({ tokenHash, userId, expiresAt: new Date(Date.now() + 86400000) });
  let transport;
  try {
    transport = createEmailTransport();
    const result = await transport.sendMail({
      from: process.env.SMTP_FROM || 'Drop <hello@droppp.tech>',
      to: email,
      ...verificationEmail(url),
    });
    if (!result.accepted?.length) throw new Error('Verification email was not accepted');
    return true;
  } catch (error) {
    await db().delete(verificationTokens).where(eq(verificationTokens.tokenHash, tokenHash));
    throw error;
  } finally {
    transport?.close();
  }
}
export async function consumeVerification(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  return db().transaction(async (tx) => {
    const rows = await tx
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.tokenHash, hashToken(token)),
          gt(verificationTokens.expiresAt, new Date()),
        ),
      )
      .returning();
    if (!rows.length) return false;
    await tx.update(users).set({ verified: true }).where(eq(users.id, rows[0].userId));
    return true;
  });
}
