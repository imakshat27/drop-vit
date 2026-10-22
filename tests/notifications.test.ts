import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { eq, sql } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
import { users, projects, periods, entries, notificationOutbox } from '../src/lib/schema';
import { notificationEmail } from '../src/lib/notification-email';
import { queueNotification, deliverNotification, dueNotifications } from '../src/lib/notifications';
process.env.LOCAL_DB_PATH = 'memory://';
after(async () => {
  await database().close();
});

test('transactional templates escape user content, keep private links in the workshop, and label previews', () => {
  const payload = {
    name: 'Akshat',
    title: '<img onerror=bad>',
    slug: 'some-build',
    note: '<script>alert(1)</script>\nA second line.',
    decision: 'approved' as const,
    releaseAt: '2026-10-25T18:30:00Z',
  };
  for (const kind of ['submission', 'review', 'live'] as const) {
    const mail = notificationEmail(kind, payload, 'https://droppp.tech');
    assert(!mail.html.includes('<script>'));
    assert(!mail.html.includes('<img onerror='));
    assert(mail.html.includes('&lt;img onerror=bad&gt;'));
    assert(mail.text.includes(kind === 'live' ? '/projects/some-build' : '/me'));
    const demo = notificationEmail(kind, payload, 'https://droppp.tech', { demo: true });
    assert(demo.subject.startsWith('[DEMO]'));
    assert(demo.html.includes('No build has been submitted, reviewed or published.'));
  }
  const review = notificationEmail('review', payload, 'https://droppp.tech');
  assert.match(review.text, /Monday.*26.*October.*2026.*00:00.*IST/);
  assert(review.html.includes('&lt;script&gt;'));
  for (const decision of ['changes', 'rejected'] as const)
    assert(
      notificationEmail('review', { ...payload, decision }, 'https://droppp.tech').text.includes(
        '/me',
      ),
    );
  assert.throws(() =>
    notificationEmail('review', { ...payload, releaseAt: undefined }, 'https://droppp.tech'),
  );
});

test('durable outbox deduplicates, leases once, retries failures, and never announces a build early', async () => {
  for (const file of (await readdir('migrations')).filter((f) => f.endsWith('.sql')).sort())
    await database().executeScript(await readFile(`migrations/${file}`, 'utf8'));
  await db()
    .insert(users)
    .values({ id: 'u', name: 'Builder', email: 'builder@vitstudent.ac.in', passwordHash: 'x' });
  await db().insert(projects).values({
    id: 'p',
    slug: 'a-build',
    title: 'A build',
    tagline: 'A tagline',
    description: 'Story',
    category: 'Projects',
    ownerId: 'u',
    status: 'approved',
  });
  const [week] = await db()
    .insert(periods)
    .values({
      id: 'w',
      label: 'Next Drop',
      kind: 'weekly',
      startsAt: new Date(Date.now() + 86400000),
      endsAt: new Date(Date.now() + 2 * 86400000),
    })
    .returning();
  await db().insert(entries).values({ projectId: 'p', periodId: 'w' });
  const base = {
    projectId: 'p',
    userId: 'u',
    recipient: 'builder@vitstudent.ac.in',
    payload: { name: 'Builder', title: 'A build', slug: 'a-build' },
  };
  const receipt = (await queueNotification(db(), {
    ...base,
    eventKey: 'receipt:p',
    kind: 'submission',
  }))!;
  assert.equal(
    await queueNotification(db(), { ...base, eventKey: 'receipt:p', kind: 'submission' }),
    undefined,
  );
  let sent = 0;
  const sender = {
    origin: 'https://droppp.tech',
    send: async (mail: { to: string; messageId: string }) => {
      assert.equal(mail.to, base.recipient);
      assert(mail.messageId.includes(receipt));
      sent++;
    },
  };
  const outcomes = await Promise.all([
    deliverNotification(db(), receipt, sender),
    deliverNotification(db(), receipt, sender),
  ]);
  assert.deepEqual(outcomes.sort(), ['sent', 'skipped']);
  assert.equal(sent, 1);
  const review = (await queueNotification(db(), {
    ...base,
    eventKey: 'review:p',
    kind: 'review',
    payload: { ...base.payload, decision: 'changes', note: 'Add a usage example.' },
  }))!;
  assert.equal(
    await deliverNotification(db(), review, {
      origin: sender.origin,
      send: async () => {
        throw { code: 'ETIMEDOUT' };
      },
    }),
    'deferred',
  );
  assert(!(await dueNotifications(db())).includes(review));
  const [retry] = await db()
    .select()
    .from(notificationOutbox)
    .where(eq(notificationOutbox.id, review));
  assert.equal(retry.attempts, 1);
  assert.equal(retry.lastError, 'ETIMEDOUT');
  assert.equal(retry.sentAt, null);
  await db()
    .update(notificationOutbox)
    .set({ availableAt: new Date(Date.now() - 1000) })
    .where(eq(notificationOutbox.id, review));
  assert.equal(
    await deliverNotification(db(), review, { origin: sender.origin, send: async () => {} }),
    'sent',
  );
  const live = (await queueNotification(db(), {
    ...base,
    eventKey: 'live:p',
    kind: 'live',
    periodId: 'w',
    availableAt: week.startsAt,
  }))!;
  assert.equal(
    await deliverNotification(db(), live, {
      origin: sender.origin,
      send: async () => {
        throw new Error('Must not send early');
      },
    }),
    'skipped',
  );
  await db()
    .update(periods)
    .set({ startsAt: new Date(Date.now() - 1000) })
    .where(eq(periods.id, 'w'));
  await db()
    .update(notificationOutbox)
    .set({ availableAt: new Date(Date.now() - 1000) })
    .where(eq(notificationOutbox.id, live));
  let liveSends = 0;
  assert.equal(
    await deliverNotification(db(), live, {
      origin: sender.origin,
      send: async () => {
        liveSends++;
      },
    }),
    'sent',
  );
  assert.equal(liveSends, 1);
  // Crashed workers can be reclaimed after their lease expires; an active lease cannot.
  const crash = (await queueNotification(db(), {
    ...base,
    eventKey: 'crash:p',
    kind: 'submission',
  }))!;
  await db().execute(
    sql`UPDATE notification_outbox SET lease_token='old', leased_until=now()+interval '10 minutes' WHERE id=${crash}`,
  );
  assert(!(await dueNotifications(db())).includes(crash));
  await db().execute(
    sql`UPDATE notification_outbox SET leased_until=now()-interval '1 second' WHERE id=${crash}`,
  );
  assert((await dueNotifications(db())).includes(crash));
  const cancel = (await queueNotification(db(), {
    ...base,
    eventKey: 'cancel:p',
    kind: 'live',
    periodId: 'w',
  }))!;
  await db().update(projects).set({ status: 'changes' }).where(eq(projects.id, 'p'));
  assert.equal(
    await deliverNotification(db(), cancel, {
      origin: sender.origin,
      send: async () => {
        throw new Error('Private build must not be announced');
      },
    }),
    'cancelled',
  );
  // An action rollback must roll its queued message back too.
  const before = (await db().select().from(notificationOutbox)).length;
  await assert.rejects(
    db().transaction(async (tx) => {
      await queueNotification(tx, { ...base, eventKey: 'rollback', kind: 'submission' });
      throw new Error('rollback');
    }),
  );
  assert.equal((await db().select().from(notificationOutbox)).length, before);
});
