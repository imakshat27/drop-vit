import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { consumeVerification } from '../src/lib/verification';
import { approvedProjects, projectBySlug, openRoles } from '../src/lib/data';
import { db, database } from '../src/lib/db';
import {
  users,
  projects,
  periods,
  entries,
  supports,
  results,
  awards,
  verificationTokens,
  recruitments,
} from '../src/lib/schema';
import { lockPeriod, normalizedWeeklyScore, rankingFor } from '../src/lib/rankings';
import { hashPassword, verifyPassword, hashToken } from '../src/lib/password';
import { submissionSchema } from '../src/lib/validation';
process.env.LOCAL_DB_PATH = 'memory://';
after(async () => {
  await database().close();
});
test('curation, verified unique support, immutable snapshots and awards', async () => {
  await database().executeScript(await readFile('migrations/0001_core.sql', 'utf8'));
  await database().executeScript(await readFile('migrations/0002_period_integrity.sql', 'utf8'));
  await db()
    .insert(users)
    .values([
      { id: 'u', name: 'Verified', email: 'u@test.test', passwordHash: 'x', verified: true },
      { id: 'v', name: 'Unverified', email: 'v@test.test', passwordHash: 'x' },
    ]);
  await db()
    .insert(projects)
    .values([
      {
        id: 'p',
        slug: 'approved',
        title: 'Approved',
        tagline: 'Approved project',
        description: 'Story',
        category: 'Projects',
        ownerId: 'u',
        status: 'approved',
      },
      {
        id: 'q',
        slug: 'pending',
        title: 'Pending',
        tagline: 'Pending project',
        description: 'Story',
        category: 'Projects',
        ownerId: 'u',
      },
    ]);
  const now = Date.now();
  await db()
    .insert(periods)
    .values({
      id: 'w',
      label: 'Test week',
      kind: 'weekly',
      startsAt: new Date(now - 86400000),
      endsAt: new Date(now + 86400000),
    });
  await assert.rejects(() => db().insert(entries).values({ projectId: 'q', periodId: 'w' }));
  await db().insert(entries).values({ projectId: 'p', periodId: 'w' });
  await assert.rejects(() =>
    db().insert(supports).values({ id: 'unverified', projectId: 'p', periodId: 'w', userId: 'v' }),
  );
  await assert.rejects(() =>
    db().insert(supports).values({ id: 'pending', projectId: 'q', periodId: 'w', userId: 'u' }),
  );
  await db().insert(supports).values({ id: 's', projectId: 'p', periodId: 'w', userId: 'u' });
  await assert.rejects(() =>
    db().insert(supports).values({ id: 'duplicate', projectId: 'p', periodId: 'w', userId: 'u' }),
  );
  await assert.rejects(() => lockPeriod('w'), /still open/);
  await db()
    .update(periods)
    .set({ endsAt: new Date(now - 1000) })
    .where(eq(periods.id, 'w'));
  await lockPeriod('w');
  await lockPeriod('w');
  const [p] = await db().select().from(periods).where(eq(periods.id, 'w'));
  assert.ok(p.lockedAt);
  const [r] = await rankingFor(p);
  assert.equal(r.count, 1);
  assert.equal(r.rank, 1);
  assert.equal(r.score, 100);
  await assert.rejects(() =>
    db().update(results).set({ rank: 2 }).where(eq(results.periodId, 'w')),
  );
  await assert.rejects(() => db().delete(results).where(eq(results.periodId, 'w')));
  await assert.rejects(() =>
    db().insert(results).values({
      id: 'extra',
      periodId: 'w',
      projectId: 'p',
      category: 'Launches',
      rank: 1,
      supportCount: 1,
      score: 1,
      titleSnapshot: 'Changed',
      taglineSnapshot: 'x',
      colorSnapshot: 'x',
      symbolSnapshot: 'x',
    }),
  );
  await assert.rejects(() =>
    db().update(periods).set({ lockedAt: null }).where(eq(periods.id, 'w')),
  );
  await assert.rejects(() => db().delete(awards).where(eq(awards.projectId, 'p')));
  await assert.rejects(() =>
    db().insert(supports).values({ id: 'late', projectId: 'p', periodId: 'w', userId: 'u' }),
  );
  await db().update(projects).set({ title: 'Edited project' }).where(eq(projects.id, 'p'));
  assert.equal((await rankingFor(p))[0].project.title, 'Approved');
});
test('pending builds and attached roles stay out of public discovery', async () => {
  assert.equal(
    (await approvedProjects()).some((p) => p.id === 'q'),
    false,
  );
  assert.equal(await projectBySlug('pending'), undefined);
  assert.equal((await projectBySlug('pending', 'u'))?.id, 'q');
  await db().insert(recruitments).values({
    id: 'pending-role',
    projectId: 'q',
    role: 'Collaborator',
    description: 'Help build',
    skills: [],
    commitment: '4 hours',
    compensation: 'Unpaid',
    applicationUrl: 'https://example.com/apply',
  });
  assert.equal((await openRoles()).length, 0);
});
test('email verification tokens expire and can be consumed only once', async () => {
  const token = randomBytes(32).toString('hex');
  await db()
    .insert(verificationTokens)
    .values({ tokenHash: hashToken(token), userId: 'v', expiresAt: new Date(Date.now() + 60000) });
  assert.equal(await consumeVerification(token), true);
  assert.equal(await consumeVerification(token), false);
  assert.equal((await db().select().from(users).where(eq(users.id, 'v')))[0].verified, true);
  const expired = randomBytes(32).toString('hex');
  await db()
    .insert(verificationTokens)
    .values({
      tokenHash: hashToken(expired),
      userId: 'v',
      expiresAt: new Date(Date.now() - 60000),
    });
  assert.equal(await consumeVerification(expired), false);
  assert.equal(await consumeVerification('malformed'), false);
});
test('completed monthly scores freeze independently of later project changes', async () => {
  const now = Date.now();
  const [week] = await db().select().from(periods).where(eq(periods.id, 'w'));
  await db()
    .insert(periods)
    .values({
      id: 'month-test',
      label: 'Test month',
      kind: 'monthly',
      startsAt: new Date(now - 3 * 86400000),
      endsAt: new Date(now - 500),
    });
  await lockPeriod('month-test');
  const [month] = await db().select().from(periods).where(eq(periods.id, 'month-test'));
  assert.ok(month.lockedAt);
  const [rank] = await rankingFor(month);
  assert.equal(rank.score, 100);
  assert.equal(rank.count, 1);
  assert.ok(week.lockedAt);
  await assert.rejects(() => db().delete(periods).where(eq(periods.id, 'month-test')));
  await assert.rejects(() =>
    db().insert(entries).values({ periodId: 'month-test', projectId: 'p' }),
  );
});
test('normalized scoring does not reward more weeks of exposure', () => {
  assert.equal(normalizedWeeklyScore([50]), normalizedWeeklyScore([50, 50, 50, 50]));
  assert.equal(normalizedWeeklyScore([]), 0);
  assert.equal(normalizedWeeklyScore([20, 60]), 40);
});
test('passwords are salted and verified safely', async () => {
  const a = await hashPassword('ten-plus-characters');
  const b = await hashPassword('ten-plus-characters');
  assert.notEqual(a, b);
  assert.equal(await verifyPassword('ten-plus-characters', a), true);
  assert.equal(await verifyPassword('wrong', a), false);
});
test('unsafe project URLs are rejected', () => {
  const out = submissionSchema.safeParse({
    title: 'Test project',
    tagline: 'A sufficiently long pitch',
    description: 'A'.repeat(60),
    category: 'Projects',
    website: 'javascript:alert(1)',
  });
  assert.equal(out.success, false);
});
