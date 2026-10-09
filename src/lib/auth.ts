import { cookies } from 'next/headers';
import { cache } from 'react';
import { randomBytes } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from './db';
import { sessions, users, rateLimits } from './schema';
import { hashToken } from './password';
import { isVitEmail } from './email-policy';
export const currentUser = cache(async () => {
  const cookie = (await cookies()).get('drop_session')?.value;
  if (!cookie) return null;
  const [row] = await db()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(cookie)), gt(sessions.expiresAt, new Date())));
  if (!row || !isVitEmail(row.user.email)) return null;
  const { passwordHash: _, ...safe } = row.user;
  void _;
  return safe;
});
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect('/signin');
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') throw new Error('Admin access required');
  return user;
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db()
    .insert(sessions)
    .values({ tokenHash: hashToken(token), userId, expiresAt });
  (await cookies()).set('drop_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}
export async function rateLimit(key: string, max = 10) {
  const resetAt = new Date(Date.now() + 15 * 60000);
  const rows = await db()
    .insert(rateLimits)
    .values({ key, attempts: 1, resetAt })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        attempts: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN 1 ELSE ${rateLimits.attempts}+1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} < now() THEN ${resetAt} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning();
  if (rows[0].attempts > max) throw new Error('Too many attempts. Please try again in 15 minutes.');
}
