import { and, eq, gt } from 'drizzle-orm';
import { db } from './db';
import { verificationTokens, users } from './schema';
import { hashToken } from './password';
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
