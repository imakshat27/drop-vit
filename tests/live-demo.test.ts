import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../src/lib/schema';
import { changeDemoData, demoProjectIds, demoUserIds } from '../scripts/live-demo-data';
import { verifyPassword } from '../src/lib/password';
import { weekBounds } from '../src/lib/constants';

test('live demo seeds atomically, repeats safely, and cleanup preserves real data and guards', async () => {
  const client = new PGlite();
  try {
    for (const file of (await readdir('migrations')).filter((f) => f.endsWith('.sql')).sort())
      await client.exec(await readFile(`migrations/${file}`, 'utf8'));
    const db = drizzle(client, { schema, casing: 'snake_case' });
    await db.insert(schema.users).values({
      id: 'real-user',
      name: 'Real builder',
      email: 'real@vitstudent.ac.in',
      passwordHash: 'real-hash',
      verified: true,
    });
    await db.insert(schema.projects).values({
      id: 'real-project',
      slug: 'real',
      title: 'Real project',
      tagline: 'Keep me',
      description: 'Real work',
      category: 'Projects',
      ownerId: 'real-user',
      status: 'approved',
    });
    const { start, end } = weekBounds();
    await db.insert(schema.periods).values({
      id: 'real-week',
      kind: 'weekly',
      label: 'Current week',
      startsAt: start,
      endsAt: end,
    });
    await db.insert(schema.entries).values({ periodId: 'real-week', projectId: 'real-project' });
    await db.insert(schema.supports).values({
      id: 'real-support',
      periodId: 'real-week',
      projectId: 'real-project',
      userId: 'real-user',
    });
    assert.equal((await changeDemoData(db)).action, 'seeded');
    assert.equal((await db.select().from(schema.supports)).length, 301);
    assert.equal((await db.select().from(schema.results)).length, 32);
    assert.equal((await changeDemoData(db)).action, 'already present');
    assert.equal((await db.select().from(schema.supports)).length, 301);
    assert.equal(await verifyPassword('anything', '!demo-only!'), false);
    // Guards still reject modifications to historical demo snapshots and supports.
    await assert.rejects(
      db.delete(schema.results).where(eq(schema.results.projectId, demoProjectIds[0])),
    );
    await assert.rejects(db.delete(schema.supports).where(eq(schema.supports.id, 'real-support')));
    await db.insert(schema.supports).values({
      id: 'real-on-demo',
      periodId: 'real-week',
      projectId: demoProjectIds[0],
      userId: 'real-user',
    });
    // Cleanup refuses real content that has acquired a dependency on a demo builder.
    await db.insert(schema.projects).values({
      id: 'dependent-real',
      slug: 'dependent',
      title: 'Real',
      tagline: 'Real',
      description: 'Real',
      category: 'Projects',
      ownerId: demoUserIds[0],
    });
    await assert.rejects(changeDemoData(db, true), /Real content depends/);
    assert.equal((await db.select().from(schema.supports)).length, 302);
    await db.delete(schema.projects).where(eq(schema.projects.id, 'dependent-real'));
    const removed = await changeDemoData(db, true);
    assert.equal(removed.projects, 11);
    assert.equal((await db.select().from(schema.users)).length, 1);
    assert.equal((await db.select().from(schema.projects)).length, 1);
    assert.equal((await db.select().from(schema.periods)).length, 1);
    assert.equal((await db.select().from(schema.entries)).length, 1);
    assert.equal((await db.select().from(schema.supports)).length, 1);
    assert.equal((await db.select().from(schema.results)).length, 0);
    assert.equal((await db.select().from(schema.awards)).length, 0);
    assert.equal((await changeDemoData(db, true)).projects, 0);
    const guards = await db.execute(sql`SELECT tgenabled FROM pg_trigger WHERE NOT tgisinternal`);
    assert(guards.rows.every((r) => r.tgenabled === 'O'));
    await assert.rejects(db.delete(schema.supports).where(eq(schema.supports.id, 'real-support')));
    // A reserved-ID collision must also leave all real records untouched.
    await db.insert(schema.users).values({
      id: demoUserIds[0],
      name: 'Real',
      email: 'collision@vitstudent.ac.in',
      passwordHash: 'real',
    });
    await assert.rejects(changeDemoData(db), /collide/);
    assert.equal((await db.select().from(schema.projects)).length, 1);
    await db.delete(schema.users).where(eq(schema.users.id, demoUserIds[0]));
    await db.insert(schema.projects).values({
      id: 'slug-collision',
      slug: demoProjectIds[0],
      title: 'Real',
      tagline: 'Keep me',
      description: 'Real content',
      category: 'Projects',
      ownerId: 'real-user',
    });
    // Fail after temporary trigger changes and user inserts: all must roll back.
    await assert.rejects(changeDemoData(db));
    assert.equal((await db.select().from(schema.users)).length, 1);
    assert.equal((await db.select().from(schema.projects)).length, 2);
    const restored = await db.execute(sql`SELECT tgenabled FROM pg_trigger WHERE NOT tgisinternal`);
    assert(restored.rows.every((r) => r.tgenabled === 'O'));
  } finally {
    await client.close();
  }
});
