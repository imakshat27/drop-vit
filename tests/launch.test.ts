import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
import { users, projects, periods, entries, results } from '../src/lib/schema';
import { weekBounds, firstDropAt, firstDropLabel } from '../src/lib/constants';
import { prepareWeeks, lockPeriod } from '../src/lib/rankings';
import { heroRanking } from '../src/lib/data';
import { resetLaunchData } from '../scripts/launch-reset-data';
process.env.LOCAL_DB_PATH = 'memory://';
after(async () => {
  await database().close();
});

test('Monday boundary switches exactly at midnight IST', () => {
  const before = weekBounds(new Date('2026-10-25T18:29:59.999Z'));
  const after = weekBounds(new Date('2026-10-25T18:30:00Z'));
  assert.equal(before.end.toISOString(), '2026-10-25T18:30:00.000Z');
  assert.equal(after.start.toISOString(), '2026-10-25T18:30:00.000Z');
  assert.equal(firstDropAt().toISOString(), after.start.toISOString());
  assert.match(firstDropLabel(), /Monday.*26.*October.*2026/);
});

test('launch starts with the first Monday, the hero switches to closed results, reset removes history but preserves real accounts', async () => {
  for (const file of (await readdir('migrations')).filter((f) => f.endsWith('.sql')).sort())
    await database().executeScript(await readFile(`migrations/${file}`, 'utf8'));
  const first = await prepareWeeks();
  // This audit runs before launch; no phantom pre-launch exhibition should exist.
  if (new Date() < firstDropAt())
    assert.equal(first.startsAt.toISOString(), firstDropAt().toISOString());
  await db()
    .insert(users)
    .values([
      {
        id: 'real',
        name: 'Curator',
        email: 'curator@vitstudent.ac.in',
        passwordHash: 'x',
        role: 'admin',
      },
      { id: 'demo', name: 'Demo', email: 'demo@demo.drop.test', passwordHash: '!demo-only!' },
    ]);
  await db()
    .insert(projects)
    .values(
      Array.from({ length: 4 }, (_, i) => ({
        id: `p${i}`,
        slug: `p${i}`,
        title: `Build ${i}`,
        tagline: 'A build',
        description: 'Story',
        category: 'Projects',
        status: 'approved',
        ownerId: 'real',
      })),
    );
  const [active] = await db()
    .insert(periods)
    .values({
      id: 'active',
      kind: 'weekly',
      label: 'Current',
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000),
    })
    .returning();
  await db()
    .insert(entries)
    .values(Array.from({ length: 4 }, (_, i) => ({ projectId: `p${i}`, periodId: active.id })));
  assert.deepEqual(
    (await heroRanking(active)).map((r) => r.project.id),
    ['p0', 'p1', 'p2'],
  );
  // Record a distinct archived order, then lock it to make those results permanent.
  await db().execute(sql`ALTER TABLE entries DISABLE TRIGGER valid_entry`);
  const [closed] = await db()
    .insert(periods)
    .values({
      id: 'closed',
      kind: 'weekly',
      label: 'Closed',
      startsAt: new Date(Date.now() - 8 * 86400000),
      endsAt: new Date(Date.now() - 86400000),
    })
    .returning();
  await db().insert(entries).values({ projectId: 'p3', periodId: closed.id });
  await db().execute(sql`ALTER TABLE entries ENABLE TRIGGER valid_entry`);
  await lockPeriod(closed.id);
  assert.deepEqual(
    (await heroRanking(active)).map((r) => r.project.id),
    ['p3'],
  );
  assert.ok((await db().select().from(results)).length);
  await resetLaunchData(db());
  assert.equal((await db().select().from(projects)).length, 0);
  assert.equal((await db().select().from(periods)).length, 0);
  assert.equal((await db().select().from(results)).length, 0);
  assert.deepEqual(await db().select({ id: users.id, role: users.role }).from(users), [
    { id: 'real', role: 'admin' },
  ]);
  const guards = await db().execute(sql`SELECT tgenabled FROM pg_trigger WHERE NOT tgisinternal`);
  assert(guards.rows.every((r) => r.tgenabled === 'O'));
});
