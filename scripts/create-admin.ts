import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, database } from '../src/lib/db';
import { users } from '../src/lib/schema';
import { isVitEmail } from '../src/lib/email-policy';
async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  if (!isVitEmail(email)) throw new Error('Curators must use a VIT email');
  const [existing] = await db().select().from(users).where(eq(users.email, email));
  if (!existing?.googleSubject || !existing.verified)
    throw new Error('The account must sign in with its VIT Google account first');
  await db().update(users).set({ role: 'admin' }).where(eq(users.id, existing.id));
  console.log('Existing Google account granted curator role.');
  await database().close();
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Could not provision curator');
  process.exit(1);
});
