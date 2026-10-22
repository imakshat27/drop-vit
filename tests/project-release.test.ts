import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
import { projects, users, entries, periods, recruitments } from '../src/lib/schema';
import { approvedProjects, projectBySlug, openRoles, allPeriods } from '../src/lib/data';
import { rankingFor } from '../src/lib/rankings';
import {
  projectReleaseAt,
  releasedProject,
  isReleased,
  releaseMessage,
} from '../src/lib/project-release';
process.env.LOCAL_DB_PATH = 'memory://';
after(async () => {
  await database().close();
});

test('scheduled builds stay private everywhere and release at the exact exhibition start', async () => {
  for (const file of (await readdir('migrations')).filter((f) => f.endsWith('.sql')).sort())
    await database().executeScript(await readFile(`migrations/${file}`, 'utf8'));
  await db()
    .insert(users)
    .values({ id: 'owner', name: 'Owner', email: 'owner@vitstudent.ac.in', passwordHash: 'x' });
  await db().insert(projects).values({
    id: 'scheduled',
    slug: 'scheduled',
    title: 'Secret build',
    tagline: 'Private until Monday',
    description: 'Story',
    category: 'Projects',
    ownerId: 'owner',
    status: 'approved',
  });
  const startsAt = new Date(Date.now() + 7 * 86400000);
  const [future] = await db()
    .insert(periods)
    .values({
      id: 'future',
      label: 'Next Drop',
      kind: 'weekly',
      startsAt,
      endsAt: new Date(startsAt.getTime() + 7 * 86400000),
    })
    .returning();
  await db().insert(entries).values({ projectId: 'scheduled', periodId: 'future' });
  await db().insert(recruitments).values({
    id: 'role',
    projectId: 'scheduled',
    role: 'Builder',
    description: 'Join us',
    skills: [],
    commitment: 'Part time',
    compensation: 'Unpaid',
    applicationUrl: 'https://example.com',
  });
  const [schedule] = await db()
    .select({ releaseAt: projectReleaseAt() })
    .from(projects)
    .where(eq(projects.id, 'scheduled'));
  assert.equal(schedule.releaseAt?.toISOString(), startsAt.toISOString());
  assert.deepEqual(await approvedProjects(), []);
  assert.deepEqual(await openRoles(), []);
  assert.deepEqual(await allPeriods(), []);
  assert.deepEqual(await rankingFor(future), []);
  assert.equal(await projectBySlug('scheduled'), undefined);
  assert.equal(await projectBySlug('scheduled', 'other'), undefined);
  assert.equal((await projectBySlug('scheduled', 'owner'))?.id, 'scheduled');
  assert.equal((await projectBySlug('scheduled', 'curator', true))?.id, 'scheduled');
  assert.equal(
    (
      await db()
        .select()
        .from(projects)
        .where(releasedProject(new Date(startsAt.getTime() - 1)))
    ).length,
    0,
  );
  assert.equal((await db().select().from(projects).where(releasedProject(startsAt))).length, 1);
  assert.equal(isReleased('approved', startsAt, startsAt), true);
  assert.equal(isReleased('pending', startsAt, startsAt), false);
  assert.equal(isReleased('approved', null), false);
  assert.match(releaseMessage(startsAt), /Scheduled for the next Drop:.*IST.*private/);
  // Simulate the release arriving; all public entry points now open without a second approval.
  await db()
    .update(periods)
    .set({ startsAt: new Date(Date.now() - 1000) })
    .where(eq(periods.id, 'future'));
  assert.equal((await approvedProjects()).length, 1);
  assert.equal((await openRoles()).length, 1);
  assert.equal((await projectBySlug('scheduled'))?.id, 'scheduled');
  assert.equal((await rankingFor({ ...future, startsAt: new Date(Date.now() - 1000) })).length, 1);
  // Adding next week's re-entry must never hide a previously released build.
  await db()
    .insert(periods)
    .values({
      ...future,
      id: 'later',
      startsAt: new Date(startsAt.getTime() + 7 * 86400000),
      endsAt: new Date(startsAt.getTime() + 14 * 86400000),
    });
  await db().insert(entries).values({ projectId: 'scheduled', periodId: 'later' });
  assert.equal((await approvedProjects()).length, 1);
});
