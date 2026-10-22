import { test, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { consumeVerification, sendVerification } from '../src/lib/verification';
import nodemailer from 'nodemailer';
import { approvedProjects, projectBySlug, openRoles, currentWeek } from '../src/lib/data';
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
process.env.DROP_FIRST_RELEASE_AT = '2025-01-05T18:30:00Z';
after(async () => {
  await database().close();
});
test('curation, verified unique support, immutable snapshots and awards', async () => {
  await database().executeScript(await readFile('migrations/0001_core.sql', 'utf8'));
  await database().executeScript(await readFile('migrations/0002_period_integrity.sql', 'utf8'));
  await database().executeScript(await readFile('migrations/0003_google_identity.sql', 'utf8'));
  await database().executeScript(await readFile('migrations/0004_notifications.sql', 'utf8'));
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
test('verification delivery hashes tokens, provides both email formats, and removes failed tokens', async () => {
  const previous = { host: process.env.SMTP_HOST, origin: process.env.APP_URL };
  process.env.SMTP_HOST = 'test.invalid';
  process.env.APP_URL = 'https://droppp.tech';
  await db()
    .insert(users)
    .values({ id: 'mail-user', name: 'Mail test', email: 'mail@test.test', passwordHash: 'x' });
  let captured: { text: string; html: string } | undefined;
  let fail = false;
  let closed = 0;
  const mocked = mock.method(nodemailer, 'createTransport', () => ({
    sendMail: async (mail: { text: string; html: string }) => {
      captured = mail;
      return { accepted: fail ? [] : ['mail@test.test'] };
    },
    close: () => closed++,
  }));
  try {
    assert.equal(await sendVerification('mail-user', 'mail@test.test'), true);
    const token = captured!.text.match(/https:\/\/droppp\.tech\/verify\?token=([a-f0-9]{64})/)![1];
    assert.ok(captured!.html.includes(`href="https://droppp.tech/verify?token=${token}"`));
    const [stored] = await db()
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.userId, 'mail-user'));
    assert.equal(stored.tokenHash, hashToken(token));
    assert.ok(stored.expiresAt.getTime() > Date.now() + 23 * 3600000);
    assert.equal(await consumeVerification(token), true);
    assert.equal(await consumeVerification(token), false);
    fail = true;
    await assert.rejects(() => sendVerification('mail-user', 'mail@test.test'));
    assert.equal(
      (
        await db()
          .select()
          .from(verificationTokens)
          .where(eq(verificationTokens.userId, 'mail-user'))
      ).length,
      0,
    );
    assert.equal(closed, 2);
  } finally {
    mocked.mock.restore();
    if (previous.host === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = previous.host;
    if (previous.origin === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous.origin;
  }
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
test('unsafe URLs and invalid conditional details are rejected on otherwise valid submissions', () => {
  const blankFields = [
    'website',
    'github',
    'demo',
    'tech',
    'problem',
    'solution',
    'language',
    'license',
    'difficulty',
    'areas',
    'setup',
    'stage',
    'traction',
    'launchDate',
    'whatsNew',
    'media',
    'team',
    'role',
    'roleDescription',
    'skills',
    'commitment',
    'compensation',
    'location',
    'applicationUrl',
  ];
  const valid = {
    ...Object.fromEntries(blankFields.map((key) => [key, ''])),
    title: 'Test project',
    tagline: 'A sufficiently long pitch',
    description: 'A complete story of a student build and the problem it solves.'.repeat(2),
    category: 'Projects',
    openSource: false,
    startup: false,
    launched: false,
    recruiting: false,
  };
  assert.equal(submissionSchema.safeParse(valid).success, true);
  const unsafe = submissionSchema.safeParse({ ...valid, website: 'javascript:alert(1)' });
  assert.equal(unsafe.success, false);
  if (!unsafe.success) assert.ok(unsafe.error.issues.some((i) => i.path[0] === 'website'));
  assert.equal(submissionSchema.safeParse({ ...valid, openSource: true }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, recruiting: true }).success, false);
  assert.equal(submissionSchema.safeParse({ ...valid, launchDate: '2026-99-99' }).success, false);
});

test('week preparation creates both editions once and locks expired editions', async () => {
  await db()
    .insert(periods)
    .values({
      id: 'expired-preparation',
      label: 'Expired preparation',
      kind: 'weekly',
      startsAt: new Date('2020-01-06T00:00:00Z'),
      endsAt: new Date('2020-01-13T00:00:00Z'),
    });
  const first = await currentWeek();
  assert.ok(first.startsAt <= new Date() && first.endsAt > new Date());
  const before = await db().select().from(periods);
  const repeated = await currentWeek();
  const after = await db().select().from(periods);
  assert.equal(repeated.id, first.id);
  assert.equal(after.length, before.length);
  assert.ok(
    after.some((p) => p.kind === 'weekly' && p.startsAt.getTime() === first.endsAt.getTime()),
  );
  assert.ok(after.find((p) => p.id === 'expired-preparation')?.lockedAt);
  assert.ok(after.some((p) => p.kind === 'monthly'));
  assert.ok(after.some((p) => p.kind === 'yearly'));
});
