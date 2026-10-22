import { randomUUID, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { db, database } from '../src/lib/db';
import {
  users,
  sessions,
  projects,
  members,
  periods,
  entries,
  supports,
  results,
  awards,
  recruitments,
} from '../src/lib/schema';
import { hashToken } from '../src/lib/password';
import { weekBounds } from '../src/lib/constants';
import { fixtures } from './demo-fixtures';

async function main() {
  if (
    process.env.E2E_AUTH_FIXTURES === '1' &&
    (process.env.DATABASE_URL ||
      process.env.ALLOW_LOCAL_DB !== '1' ||
      !/^\.data\/e2e-\d+$/.test(process.env.LOCAL_DB_PATH || ''))
  )
    throw new Error('E2E sessions require an isolated local QA database');
  if ((await db().select().from(users).limit(1)).length) {
    console.log('Seed skipped: database already contains users');
    await database().close();
    return;
  }
  if (process.env.NODE_ENV === 'production')
    throw new Error('Fictional seed data is development-only');
  const hash = '!demo-only!';
  await db().transaction(async (tx) => {
    await tx.insert(users).values([
      {
        id: 'ananya',
        name: 'Ananya Rao',
        email: 'ananya@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Making tools for people with too many ideas. CSE · VIT Vellore, 2027.',
        skills: ['Product design', 'React', 'Creative coding'],
      },
      {
        id: 'arjun',
        name: 'Arjun Mehta',
        email: 'arjun@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Open-source enthusiast. Learning in public, one pull request at a time.',
        skills: ['TypeScript', 'C++', 'Open source'],
      },
      {
        id: 'diya',
        name: 'Diya Menon',
        email: 'diya@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Finding small solutions to everyday campus problems. ECE · Class of 2027.',
        skills: ['Flutter', 'Research', 'Prototyping'],
      },
      {
        id: 'ishaan',
        name: 'Ishaan Shah',
        email: 'ishaan@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Shipping small things that make the internet a little nicer.',
        skills: ['Next.js', 'Design', 'TypeScript'],
      },
      {
        id: 'admin',
        name: 'Drop Curator',
        email: 'admin@vitstudent.ac.in',
        passwordHash: hash,
        role: 'admin',
        verified: true,
        bio: 'The people behind the weekly exhibition.',
      },
      ...Array.from({ length: 132 }, (_, i) => ({
        id: `supporter-${i}`,
        name: `Sample builder ${i + 1}`,
        email: `builder-${i}@vitstudent.ac.in`,
        passwordHash: hash,
        verified: true,
      })),
    ]);
    await tx.insert(projects).values(
      fixtures.map((p, index) => ({
        ...p,
        createdAt: new Date(Date.now() - (12 - index) * 86400000),
        slug: p.id,
        status: 'approved',
        featured: p.id === 'canvas',
        github: p.openSource ? 'https://github.com/topics/good-first-issue' : '',
        details: p.details || {},
      })),
    );
    await tx
      .insert(members)
      .values(fixtures.map((p) => ({ projectId: p.id, userId: p.ownerId, role: 'Creator' })));
    await tx.insert(members).values([
      { projectId: 'canvas', userId: 'ishaan', role: 'Engineer' },
      { projectId: 'patchwork', userId: 'ananya', role: 'Designer' },
    ]);
    const { start, end } = weekBounds();
    const previousStart = new Date(start.getTime() - 7 * 86400000);
    const monthStart = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1) - 330 * 60000,
    );
    const monthEnd = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 330 * 60000,
    );
    await tx.insert(periods).values([
      {
        id: 'week-18',
        label: 'Drop #18',
        kind: 'weekly',
        startsAt: start,
        endsAt: end,
        formula: 'weekly-support-v1',
      },
      {
        id: 'week-17',
        label: 'Drop #17',
        kind: 'weekly',
        startsAt: previousStart,
        endsAt: start,
        formula: 'weekly-support-v1',
      },
      {
        id: 'week-19',
        label: 'Drop #19',
        kind: 'weekly',
        startsAt: end,
        endsAt: new Date(end.getTime() + 7 * 86400000),
        formula: 'weekly-support-v1',
      },
      {
        id: 'month-current',
        label: monthStart.toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }),
        kind: 'monthly',
        startsAt: monthStart,
        endsAt: monthEnd,
      },
      {
        id: 'month-september',
        label: 'September 2026',
        kind: 'monthly',
        startsAt: new Date('2026-08-31T18:30:00Z'),
        endsAt: new Date('2026-09-30T18:30:00Z'),
      },
      {
        id: 'year-2026',
        label: '2026',
        kind: 'yearly',
        startsAt: new Date('2025-12-31T18:30:00Z'),
        endsAt: new Date('2026-12-31T18:30:00Z'),
      },
      {
        id: 'all-time',
        label: 'All time',
        kind: 'all-time',
        startsAt: new Date('2025-01-01T00:00:00Z'),
        endsAt: new Date('2100-01-01T00:00:00Z'),
      },
    ]);
    await tx
      .insert(entries)
      .values(
        fixtures
          .filter((p) => p.id !== 'canvas')
          .map((p) => ({ periodId: 'week-18', projectId: p.id })),
      );
    for (const [index, p] of fixtures.filter((p) => p.id !== 'canvas').entries()) {
      const count = [128, 96, 84, 63, 48, 32, 21][index];
      await tx.insert(supports).values(
        Array.from({ length: count }, (_, i) => ({
          id: randomUUID(),
          projectId: p.id,
          periodId: 'week-18',
          userId: `supporter-${i}`,
        })),
      );
    }
    for (const periodId of ['week-17', 'month-september']) {
      const winners = [fixtures[0], fixtures[1], fixtures[2]];
      await tx.insert(results).values(
        winners.flatMap((p, i) => [
          {
            id: randomUUID(),
            periodId,
            projectId: p.id,
            category: 'Overall',
            rank: i + 1,
            supportCount: [246, 182, 121][i],
            score: [44.81, 33.15, 22.04][i],
            titleSnapshot: p.title,
            taglineSnapshot: p.tagline,
            colorSnapshot: p.color,
            symbolSnapshot: p.symbol,
          },
          {
            id: randomUUID(),
            periodId,
            projectId: p.id,
            category: p.category,
            rank: 1,
            supportCount: [246, 182, 121][i],
            score: 100,
            titleSnapshot: p.title,
            taglineSnapshot: p.tagline,
            colorSnapshot: p.color,
            symbolSnapshot: p.symbol,
          },
        ]),
      );
      const { eq } = await import('drizzle-orm');
      await tx
        .update(periods)
        .set({ lockedAt: new Date(periodId === 'week-17' ? start : '2026-09-30T18:30:00Z') })
        .where(eq(periods.id, periodId));
    }
    await tx.insert(awards).values([
      {
        id: 'award-canvas',
        projectId: 'canvas',
        periodId: 'week-17',
        title: 'Project of the Week — Drop #17',
        description: 'First place in the seventeenth weekly exhibition.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-patch',
        projectId: 'patchwork',
        periodId: 'month-september',
        title: 'Open Source Winner — Sep ’26',
        description: 'First place in the locked September open-source rankings.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-canvas-month',
        projectId: 'canvas',
        periodId: 'month-september',
        title: 'Project of the Month — Sep ’26',
        description: 'September’s standout student project.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-diya',
        projectId: 'afterhours',
        title: 'Faculty Pick',
        description: 'Selected by the curation team for thoughtful campus impact.',
        type: 'special',
      },
      ...fixtures.map((p) => ({
        id: `first-${p.id}`,
        projectId: p.id,
        title: 'First Project',
        description: 'Made something and shared it with the world.',
        type: 'earned',
        rarity: 'common',
      })),
    ]);
    await tx.insert(recruitments).values([
      {
        id: 'role-patch',
        projectId: 'patchwork',
        role: 'Frontend collaborator',
        description:
          'Help make the first-contribution experience more welcoming. Work on accessible issue cards and matching flows.',
        skills: ['React', 'Accessibility'],
        commitment: '4–6 hours / week',
        compensation: 'Unpaid · learning collaboration',
        applicationUrl: 'mailto:arjun@vitstudent.ac.in',
      },
      {
        id: 'role-after',
        projectId: 'afterhours',
        role: 'Product designer',
        description:
          'Shape a calmer way for students to find their next collaborator. From user interviews to the very first prototype.',
        skills: ['Figma', 'User research'],
        commitment: '6–8 hours / week',
        compensation: 'Equity discussion',
        applicationUrl: 'mailto:diya@vitstudent.ac.in',
      },
      {
        id: 'role-tiny',
        projectId: 'tinyml',
        role: 'Embedded tinkerer',
        description:
          'Bring a sensor, a curious mind, and a willingness to document the things that break.',
        skills: ['C++', 'ESP32'],
        commitment: '3–5 hours / week',
        compensation: 'Unpaid · open source',
        applicationUrl: 'mailto:arjun@vitstudent.ac.in',
      },
    ]);
  });
  console.log('Seeded fictional projects, builders, supports, and locked archive.');
  if (process.env.E2E_AUTH_FIXTURES === '1') {
    const path = process.env.LOCAL_DB_PATH || '';
    if (
      process.env.DATABASE_URL ||
      process.env.ALLOW_LOCAL_DB !== '1' ||
      !/^\.data\/e2e-\d+$/.test(path)
    )
      throw new Error('E2E sessions require an isolated local QA database');
    await db()
      .insert(projects)
      .values({
        id: 'qa-gallery',
        slug: 'qa-gallery',
        title: 'Gallery QA',
        tagline: 'A screenshot gallery fixture for browser checks.',
        description:
          'Isolated QA data for verifying project media, thumbnail selection, and accessible full screen navigation.',
        category: 'Projects',
        ownerId: 'ananya',
        status: 'approved',
        details: {
          media: [
            'https://images.example.test/one.webp',
            'https://images.example.test/two.webp',
            'https://images.example.test/three.webp',
          ],
        },
      });
    await db().insert(entries).values({ projectId: 'qa-gallery', periodId: 'week-18' });
    await db()
      .insert(projects)
      .values({
        id: 'qa-scheduled',
        slug: 'qa-scheduled',
        title: 'Unreleased QA build',
        tagline: 'This must stay private until next week.',
        description: 'Isolated release privacy fixture.',
        category: 'Projects',
        ownerId: 'ananya',
        status: 'approved',
        details: { media: ['/api/media/YW5hbnlh.00000000-0000-4000-8000-000000000001'] },
      });
    await db().insert(entries).values({ projectId: 'qa-scheduled', periodId: 'week-19' });
    for (const [id, format] of [
      ['qa-cli', 'cli'],
      ['qa-package', 'package'],
    ] as const) {
      await db()
        .insert(projects)
        .values({
          id,
          slug: id,
          title: format === 'cli' ? 'Terminal Compass' : 'Tiny Vector Library',
          tagline: 'A useful developer build without a hosted website.',
          description:
            'A non-web project fixture with installation instructions and a registry or release link.',
          category: 'Projects',
          ownerId: 'ananya',
          status: 'approved',
          website: 'https://example.com/' + format,
          details: {
            buildFormat: format,
            setup:
              format === 'cli'
                ? 'Install from the releases page.\ncompass --help'
                : 'npm install tiny-vector-example',
          },
        });
      await db().insert(entries).values({ projectId: id, periodId: 'week-18' });
    }
    const [coverFixture] = await db().select().from(projects).where(eq(projects.id, 'patchwork'));
    await db()
      .update(projects)
      .set({
        details: {
          ...coverFixture.details,
          media: ['https://images.example.test/hero-cover.webp'],
        },
      })
      .where(eq(projects.id, 'patchwork'));
    const tokens: Record<string, string[]> = {};
    for (const id of ['ananya', 'arjun', 'diya', 'ishaan', 'admin']) {
      const [user] = await db()
        .update(users)
        .set({ googleSubject: `qa-google-${id}` })
        .where(eq(users.id, id))
        .returning();
      tokens[user.email] = [];
      for (let attempt = 0; attempt < 32; attempt++) {
        const token = randomBytes(32).toString('hex');
        tokens[user.email].push(token);
        await db()
          .insert(sessions)
          .values({
            tokenHash: hashToken(token),
            userId: id,
            expiresAt: new Date(Date.now() + 86400000),
          });
      }
    }
    // A legacy password-only session must no longer grant protected access.
    await db().insert(users).values({
      id: 'legacy',
      email: 'legacy@vitstudent.ac.in',
      name: 'Legacy builder',
      passwordHash: hash,
      verified: true,
    });
    const legacyToken = randomBytes(32).toString('hex');
    tokens['legacy@vitstudent.ac.in'] = [legacyToken];
    await db()
      .insert(sessions)
      .values({
        tokenHash: hashToken(legacyToken),
        userId: 'legacy',
        expiresAt: new Date(Date.now() + 86400000),
      });
    await writeFile(`${path}/session-fixtures.json`, JSON.stringify(tokens), { mode: 0o600 });
  }
  await database().close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
