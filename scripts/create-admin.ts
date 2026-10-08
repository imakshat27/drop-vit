import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, database } from '../src/lib/db';
import { users } from '../src/lib/schema';
import { hashPassword } from '../src/lib/password';
async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const name = process.env.ADMIN_NAME || 'Drop Curator';
  const [existing] = await db().select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    await db().update(users).set({ role: 'admin' }).where(eq(users.id, existing.id));
    console.log(
      'Existing account granted curator role. Existing password and verification unchanged.',
    );
  } else {
    const password = z.string().min(14).max(128).parse(process.env.ADMIN_PASSWORD);
    await db()
      .insert(users)
      .values({
        id: randomUUID(),
        name,
        email,
        passwordHash: await hashPassword(password),
        role: 'admin',
        verified: false,
      });
    console.log('Curator account created. Sign in and request email verification.');
  }
  await database().close();
}
main().catch(() => {
  console.error(
    'Supply ADMIN_EMAIL and, for new accounts, ADMIN_PASSWORD (at least 14 characters). Ensure migrations have run.',
  );
  process.exit(1);
});
