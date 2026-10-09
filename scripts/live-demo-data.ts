import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../src/lib/db';
import {
  awards,
  audit,
  entries,
  members,
  periods,
  projects,
  recruitments,
  results,
  supports,
  users,
} from '../src/lib/schema';
import { weekBounds, categories } from '../src/lib/constants';
import { fixtures } from './demo-fixtures';

const prefix = 'demo-drop-';
const marker = '[Demo] Fictional test data; remove before launch.';
const builders = [
  { id: 'ananya', name: 'Ananya Rao', skills: ['React', 'Design', 'Python'] },
  { id: 'arjun', name: 'Arjun Mehta', skills: ['TypeScript', 'C++', 'Open source'] },
  { id: 'diya', name: 'Diya Shah', skills: ['Flutter', 'Product', 'Community'] },
  { id: 'ishaan', name: 'Ishaan Nair', skills: ['Next.js', 'UI design', 'MDX'] },
];
export const demoUserIds = [
  ...builders.map((b) => prefix + b.id),
  ...Array.from({ length: 32 }, (_, i) => `${prefix}supporter-${i}`),
];
export const demoProjectIds = [
  ...fixtures.map((p) => prefix + p.id),
  ...['pending', 'changes', 'rejected'].map((s) => prefix + s),
];
export const demoPeriodIds = [prefix + 'archive-week', prefix + 'archive-month'];

/** A single atomic operation; rerunning seed never resets edits, votes or existing records. */
const fixtureTriggers = [
  ['periods', 'immutable_period'],
  ['entries', 'valid_entry'],
  ['supports', 'valid_support'],
  ['supports', 'immutable_support'],
  ['results', 'valid_result'],
  ['results', 'immutable_result'],
  ['awards', 'immutable_award'],
] as const;

// Administrative fixture operation only: table locks prevent concurrent writes,
// and transactional DDL restores every protection even if the operation aborts.
async function fixtureProtection(
  tx: Parameters<Parameters<ReturnType<typeof db>['transaction']>[0]>[0],
  enabled: boolean,
) {
  for (const [table, trigger] of fixtureTriggers)
    await tx.execute(
      sql.raw(`ALTER TABLE ${table} ${enabled ? 'ENABLE' : 'DISABLE'} TRIGGER ${trigger}`),
    );
}

export async function changeDemoData(
  connection: ReturnType<typeof db>,
  cleanup = false,
  now = new Date(),
) {
  return connection.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(7408216)`);
    await tx.execute(
      sql`LOCK TABLE users, projects, periods, entries, supports, results, awards, members, recruitments, audit IN ACCESS EXCLUSIVE MODE`,
    );
    const triggerStates = await tx.execute(
      sql`SELECT tgname, tgenabled FROM pg_trigger WHERE NOT tgisinternal`,
    );
    if (
      fixtureTriggers.some(
        ([, name]) => !triggerStates.rows.some((t) => t.tgname === name && t.tgenabled === 'O'),
      )
    )
      throw new Error('Expected database protections are missing or changed; nothing changed.');
    const existingUsers = await tx.select().from(users).where(inArray(users.id, demoUserIds));
    const existingProjects = await tx
      .select()
      .from(projects)
      .where(inArray(projects.id, demoProjectIds));
    const existingPeriods = await tx
      .select()
      .from(periods)
      .where(inArray(periods.id, demoPeriodIds));
    if (
      existingUsers.some(
        (u) =>
          u.email !== `${u.id}@demo.drop.test` ||
          u.passwordHash !== '!demo-only!' ||
          u.role !== 'user',
      ) ||
      existingProjects.some(
        (p) => !demoUserIds.includes(p.ownerId) || !p.description.startsWith(marker),
      ) ||
      existingPeriods.some((p) => !p.label.startsWith('[Demo]'))
    )
      throw new Error('Reserved demo IDs collide with non-demo data; nothing changed.');

    if (cleanup) {
      // Refuse to remove fixtures that have become owners/dependencies of real content.
      const unrelated = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(
            inArray(projects.ownerId, demoUserIds),
            sql`${projects.id} NOT IN (${sql.join(
              demoProjectIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );
      const realPeriodEntries = await tx
        .select()
        .from(entries)
        .where(
          and(
            inArray(entries.periodId, demoPeriodIds),
            sql`${entries.projectId} NOT IN (${sql.join(
              demoProjectIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );
      const realPeriodResults = await tx
        .select()
        .from(results)
        .where(
          and(
            inArray(results.periodId, demoPeriodIds),
            sql`${results.projectId} NOT IN (${sql.join(
              demoProjectIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );
      const realPeriodAwards = await tx
        .select()
        .from(awards)
        .where(
          and(
            inArray(awards.periodId, demoPeriodIds),
            sql`${awards.projectId} NOT IN (${sql.join(
              demoProjectIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );
      const realPeriodSupports = await tx
        .select()
        .from(supports)
        .where(
          and(
            inArray(supports.periodId, demoPeriodIds),
            sql`${supports.projectId} NOT IN (${sql.join(
              demoProjectIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ),
        );
      if (
        unrelated.length ||
        realPeriodEntries.length ||
        realPeriodResults.length ||
        realPeriodAwards.length ||
        realPeriodSupports.length
      )
        throw new Error(
          'Real content depends on demo fixtures; cleanup refused without changing data.',
        );
      await fixtureProtection(tx, false);
      await tx
        .delete(audit)
        .where(
          or(
            inArray(audit.actorId, demoUserIds),
            inArray(audit.targetId, [...demoProjectIds, ...demoUserIds]),
          ),
        );
      await tx.delete(recruitments).where(inArray(recruitments.projectId, demoProjectIds));
      await tx.delete(awards).where(inArray(awards.projectId, demoProjectIds));
      await tx.delete(results).where(inArray(results.projectId, demoProjectIds));
      await tx
        .delete(supports)
        .where(
          or(inArray(supports.projectId, demoProjectIds), inArray(supports.userId, demoUserIds)),
        );
      await tx.delete(entries).where(inArray(entries.projectId, demoProjectIds));
      await tx
        .delete(members)
        .where(
          or(inArray(members.projectId, demoProjectIds), inArray(members.userId, demoUserIds)),
        );
      await tx.delete(projects).where(inArray(projects.id, demoProjectIds));
      await tx.delete(users).where(inArray(users.id, demoUserIds));
      await tx.delete(periods).where(inArray(periods.id, demoPeriodIds));
      await fixtureProtection(tx, true);
      return {
        action: 'removed',
        projects: existingProjects.length,
        users: existingUsers.length,
        demoPeriods: existingPeriods.length,
      };
    }
    // Treat a completed seed as immutable rather than adding votes on every future week.
    if (existingProjects.length || existingUsers.length || existingPeriods.length) {
      if (
        existingProjects.length !== demoProjectIds.length ||
        existingUsers.length !== demoUserIds.length ||
        existingPeriods.length !== demoPeriodIds.length
      )
        throw new Error('Demo fixtures are incomplete. Clean up before reseeding.');
      return {
        action: 'already present',
        projects: existingProjects.length,
        users: existingUsers.length,
        demoPeriods: existingPeriods.length,
      };
    }
    await fixtureProtection(tx, false);
    await tx.insert(users).values(
      demoUserIds.map((id) => {
        const builder = builders.find((b) => prefix + b.id === id);
        return {
          id,
          name: `[Demo] ${builder?.name || 'Sample Supporter'}`,
          email: `${id}@demo.drop.test`,
          passwordHash: '!demo-only!',
          verified: true,
          role: 'user',
          bio: `${marker} ${builder ? 'Student builder exploring ideas and shipping experiments.' : 'Synthetic support fixture.'}`,
          skills: builder?.skills || [],
        };
      }),
    );
    const demoProjects = fixtures.map((p, i) => ({
      ...p,
      id: prefix + p.id,
      slug: prefix + p.id,
      title: `[Demo] ${p.title}`,
      ownerId: prefix + p.ownerId,
      status: 'approved',
      featured: i === 0,
      description: `${marker}\n\n${p.description}`,
      createdAt: new Date(now.getTime() - (8 - i) * 86400000),
    }));
    await tx.insert(projects).values(demoProjects);
    await tx.insert(projects).values(
      ['pending', 'changes', 'rejected'].map((status) => ({
        id: prefix + status,
        slug: prefix + status,
        title: `[Demo] ${status} submission`,
        tagline: 'A sample submission for testing moderation.',
        description: marker,
        category: 'Projects',
        ownerId: prefix + 'ananya',
        status,
        feedback:
          status === 'changes'
            ? 'Sample feedback: add setup instructions and explain the problem.'
            : status === 'rejected'
              ? 'Sample feedback: insufficient project details.'
              : '',
      })),
    );
    await tx
      .insert(members)
      .values(demoProjects.map((p) => ({ projectId: p.id, userId: p.ownerId, role: 'Creator' })));
    await tx.insert(members).values([
      { projectId: prefix + 'canvas', userId: prefix + 'ishaan', role: 'Engineer' },
      { projectId: prefix + 'patchwork', userId: prefix + 'ananya', role: 'Designer' },
    ]);
    const { start, end } = weekBounds(now);
    const [existingWeek] = await tx
      .select()
      .from(periods)
      .where(and(eq(periods.kind, 'weekly'), eq(periods.startsAt, start)))
      .limit(1);
    const currentId = existingWeek?.id || `week-${start.toISOString().slice(0, 10)}`;
    if (existingWeek?.lockedAt)
      throw new Error('Current week is already locked; demo seed refused.');
    if (!existingWeek)
      await tx.insert(periods).values({
        id: currentId,
        label: `Drop · ${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`,
        kind: 'weekly',
        startsAt: start,
        endsAt: end,
        formula: 'weekly-support-v1',
      });
    // A complete week wholly inside the previous IST month, with consistent support snapshots.
    const india = new Date(now.getTime() + 330 * 60000);
    const monthStart = new Date(
      Date.UTC(india.getUTCFullYear(), india.getUTCMonth() - 1, 1) - 330 * 60000,
    );
    const monthEnd = new Date(
      Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), 1) - 330 * 60000,
    );
    const archiveStart = weekBounds(new Date(monthStart.getTime() + 14 * 86400000)).start;
    const archiveEnd = new Date(archiveStart.getTime() + 7 * 86400000);
    await tx.insert(periods).values([
      {
        id: demoPeriodIds[0],
        label: '[Demo] Sample weekly archive',
        kind: 'weekly',
        startsAt: new Date(archiveStart.getTime() + 1),
        endsAt: archiveEnd,
        lockedAt: archiveEnd,
        formula: 'weekly-support-v1',
      },
      {
        id: demoPeriodIds[1],
        label: '[Demo] Sample monthly archive',
        kind: 'monthly',
        startsAt: new Date(monthStart.getTime() + 1),
        endsAt: monthEnd,
        lockedAt: monthEnd,
        formula: 'weekly-share-v1',
      },
    ]);
    const liveCounts = [18, 32, 25, 14, 21, 16, 10, 8];
    const archiveCounts = [32, 28, 24, 21, 18, 14, 11, 8];
    for (const [periodId, counts, supportedAt] of [
      [currentId, liveCounts, now],
      [demoPeriodIds[0], archiveCounts, archiveStart],
    ] as const) {
      await tx.insert(entries).values(demoProjects.map((p) => ({ periodId, projectId: p.id })));
      await tx.insert(supports).values(
        demoProjects.flatMap((p, i) =>
          Array.from({ length: counts[i] }, (_, j) => ({
            id: `${prefix}support-${periodId}-${i}-${j}`,
            periodId,
            projectId: p.id,
            userId: `${prefix}supporter-${j}`,
            createdAt: supportedAt,
          })),
        ),
      );
    }
    for (const periodId of demoPeriodIds) {
      for (const category of ['Overall', ...categories]) {
        const group = demoProjects
          .map((p, i) => ({ p, count: archiveCounts[i] }))
          .filter(({ p }) => category === 'Overall' || p.category === category)
          .sort((a, b) => b.count - a.count || a.p.id.localeCompare(b.p.id));
        const total = group.reduce((sum, r) => sum + r.count, 0);
        await tx.insert(results).values(
          group.map(({ p, count }, i) => ({
            id: `${prefix}result-${periodId}-${category}-${i}`,
            periodId,
            projectId: p.id,
            category,
            rank: i + 1,
            supportCount: count,
            score: (count / total) * 100,
            titleSnapshot: p.title,
            taglineSnapshot: p.tagline,
            colorSnapshot: p.color,
            symbolSnapshot: p.symbol,
          })),
        );
        const winner = group[0].p;
        await tx.insert(awards).values({
          id: `${prefix}award-${periodId}-${category}`,
          projectId: winner.id,
          periodId,
          title: `[Demo] ${category === 'Overall' ? 'Project' : category} of the ${periodId === demoPeriodIds[0] ? 'Week' : 'Month'} — Sample archive`,
          description: 'Fictional award for testing achievement posters; not a real result.',
          type: 'earned',
          rarity: 'gold',
          createdAt: monthEnd,
        });
      }
    }
    await tx.insert(awards).values({
      id: prefix + 'faculty-pick',
      projectId: prefix + 'afterhours',
      title: '[Demo] Faculty Pick',
      description: 'Fictional special recognition for testing.',
      type: 'special',
      rarity: 'rare',
    });
    await tx.insert(recruitments).values([
      {
        id: prefix + 'frontend',
        projectId: prefix + 'patchwork',
        role: '[Demo] Frontend engineer',
        skills: ['React', 'TypeScript'],
        description: 'Sample role: build approachable contribution workflows.',
        commitment: '5 hours / week',
        compensation: 'Volunteer',
        applicationUrl: `mailto:${prefix}arjun@demo.drop.test`,
      },
      {
        id: prefix + 'designer',
        projectId: prefix + 'afterhours',
        role: '[Demo] Product designer',
        skills: ['Figma', 'Research'],
        description: 'Sample role: design a campus collaboration experience.',
        commitment: '3 hours / week',
        compensation: 'Volunteer',
        applicationUrl: `mailto:${prefix}diya@demo.drop.test`,
      },
      {
        id: prefix + 'embedded',
        projectId: prefix + 'tinyml',
        role: '[Demo] Embedded engineer',
        skills: ['C++', 'ESP32'],
        description: 'Sample role: document reproducible edge ML experiments.',
        commitment: '4 hours / week',
        compensation: 'Volunteer',
        applicationUrl: `mailto:${prefix}arjun@demo.drop.test`,
      },
    ]);
    await fixtureProtection(tx, true);
    return {
      action: 'seeded',
      projects: demoProjectIds.length,
      users: demoUserIds.length,
      demoPeriods: 2,
      supports: 300,
      roles: 3,
    };
  });
}
