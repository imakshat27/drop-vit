import { and, eq, gte, lt, sql, asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from './db';
import { awards, entries, periods, projects, results, type Period, type Project } from './schema';
import { categories, weekBounds } from './constants';
export type RankedProject = { project: Project; count: number; score: number; rank: number };
export function normalizedWeeklyScore(shares: number[]) {
  return shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : 0;
}
export async function rankingFor(period: Period, category = 'Overall'): Promise<RankedProject[]> {
  if (period.lockedAt) {
    const rows = await db()
      .select()
      .from(results)
      .innerJoin(projects, eq(results.projectId, projects.id))
      .where(and(eq(results.periodId, period.id), eq(results.category, category)))
      .orderBy(asc(results.rank));
    return rows.map(({ results: r, projects: p }) => ({
      project: {
        ...p,
        title: r.titleSnapshot,
        tagline: r.taglineSnapshot,
        color: r.colorSnapshot,
        symbol: r.symbolSnapshot,
      },
      count: r.supportCount,
      score: r.score,
      rank: r.rank,
    }));
  }
  if (period.kind === 'weekly') {
    const list = await db()
      .select({
        project: projects,
        count: sql<number>`(select count(*)::int from supports where supports.project_id=${projects.id} and supports.period_id=${period.id})`,
      })
      .from(entries)
      .innerJoin(projects, eq(entries.projectId, projects.id))
      .where(and(eq(entries.periodId, period.id), eq(projects.status, 'approved')));
    const filtered = list.filter((r) => category === 'Overall' || r.project.category === category);
    const total = filtered.reduce((n, r) => n + Number(r.count), 0);
    return filtered
      .sort((a, b) => Number(b.count) - Number(a.count) || a.project.id.localeCompare(b.project.id))
      .map((r, i) => ({
        ...r,
        count: Number(r.count),
        score: total ? (Number(r.count) / total) * 100 : 0,
        rank: i + 1,
      }));
  }
  const weeks = await db()
    .select()
    .from(periods)
    .where(
      and(
        eq(periods.kind, 'weekly'),
        gte(periods.startsAt, period.startsAt),
        lt(periods.startsAt, period.endsAt),
      ),
    )
    .orderBy(asc(periods.startsAt));
  const combined = new Map<string, { project: Project; shares: number[]; count: number }>();
  for (const week of weeks.filter((w) => w.endsAt <= period.endsAt))
    for (const row of await rankingFor(week, category)) {
      const prev = combined.get(row.project.id) || { project: row.project, shares: [], count: 0 };
      prev.shares.push(row.score);
      prev.count += row.count;
      combined.set(row.project.id, prev);
    }
  return [...combined.values()]
    .map((r) => ({
      project: r.project,
      count: r.count,
      score: normalizedWeeklyScore(r.shares),
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score || a.project.id.localeCompare(b.project.id))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
export async function lockPeriod(id: string) {
  const [p] = await db().select().from(periods).where(eq(periods.id, id));
  if (!p) throw new Error('Period not found');
  if (p.lockedAt) return;
  if (new Date() < p.endsAt)
    throw new Error('This period is still open. Results can only lock after its closing time.');
  if (p.kind !== 'weekly') {
    const children = await db()
      .select()
      .from(periods)
      .where(
        and(
          eq(periods.kind, 'weekly'),
          gte(periods.startsAt, p.startsAt),
          lt(periods.startsAt, p.endsAt),
        ),
      );
    for (const child of children.filter((c) => c.endsAt <= p.endsAt)) await lockPeriod(child.id);
  }
  // Hold the same period row lock used by support inserts to serialize the final snapshot.
  await db().transaction(async (tx) => {
    const check = await tx.execute(sql`SELECT locked_at FROM periods WHERE id=${id} FOR UPDATE`);
    if (check.rows[0]?.locked_at) return;
    for (const category of ['Overall', ...categories]) {
      let rows: RankedProject[];
      if (p.kind === 'weekly') {
        const list = await tx
          .select({
            project: projects,
            count: sql<number>`(select count(*)::int from supports where supports.project_id=${projects.id} and supports.period_id=${id})`,
          })
          .from(entries)
          .innerJoin(projects, eq(entries.projectId, projects.id))
          .where(and(eq(entries.periodId, id), eq(projects.status, 'approved')));
        const filtered = list
          .filter((r) => category === 'Overall' || r.project.category === category)
          .sort(
            (a, b) => Number(b.count) - Number(a.count) || a.project.id.localeCompare(b.project.id),
          );
        const total = filtered.reduce((n, r) => n + Number(r.count), 0);
        rows = filtered.map((r, i) => ({
          ...r,
          count: Number(r.count),
          score: total ? (Number(r.count) / total) * 100 : 0,
          rank: i + 1,
        }));
      } else {
        const snapshots = await tx
          .select()
          .from(results)
          .innerJoin(periods, eq(results.periodId, periods.id))
          .innerJoin(projects, eq(results.projectId, projects.id))
          .where(
            and(
              eq(periods.kind, 'weekly'),
              gte(periods.startsAt, p.startsAt),
              lt(periods.endsAt, new Date(p.endsAt.getTime() + 1)),
              eq(results.category, category),
            ),
          );
        const grouped = new Map<string, { project: Project; shares: number[]; count: number }>();
        for (const r of snapshots) {
          const item = grouped.get(r.projects.id) || { project: r.projects, shares: [], count: 0 };
          item.shares.push(r.results.score);
          item.count += r.results.supportCount;
          grouped.set(r.projects.id, item);
        }
        rows = [...grouped.values()]
          .map((r) => ({
            project: r.project,
            count: r.count,
            score: normalizedWeeklyScore(r.shares),
            rank: 0,
          }))
          .sort((a, b) => b.score - a.score || a.project.id.localeCompare(b.project.id))
          .map((r, i) => ({ ...r, rank: i + 1 }));
      }
      if (rows.length) {
        await tx.insert(results).values(
          rows.map((r) => ({
            id: randomUUID(),
            periodId: id,
            projectId: r.project.id,
            category,
            rank: r.rank,
            supportCount: r.count,
            score: r.score,
            titleSnapshot: r.project.title,
            taglineSnapshot: r.project.tagline,
            colorSnapshot: r.project.color,
            symbolSnapshot: r.project.symbol,
          })),
        );
        const winner = rows[0];
        await tx
          .insert(awards)
          .values({
            id: randomUUID(),
            projectId: winner.project.id,
            periodId: id,
            title: `${category === 'Overall' ? 'Project' : category} ${p.kind === 'weekly' ? 'of the Week' : p.kind === 'monthly' ? 'of the Month' : 'of the Year'} — ${p.label}`,
            description: `First place in ${category} for ${p.label}. Permanently recorded.`,
            type: 'earned',
            rarity: 'gold',
          })
          .onConflictDoNothing();
        if (category === 'Overall') {
          for (const r of rows.slice(0, 3))
            await tx
              .insert(awards)
              .values({
                id: randomUUID(),
                projectId: r.project.id,
                periodId: id,
                title: `Top 3 — ${p.label}`,
                description: 'Finished in the top three of this exhibition.',
                type: 'earned',
              })
              .onConflictDoNothing();
        }
      }
    }
    if (p.kind === 'weekly') {
      const winners = await tx
        .select({ projectId: results.projectId, count: sql<number>`count(*)::int` })
        .from(results)
        .innerJoin(periods, eq(results.periodId, periods.id))
        .where(
          and(eq(periods.kind, 'weekly'), eq(results.category, 'Overall'), eq(results.rank, 1)),
        )
        .groupBy(results.projectId);
      for (const w of winners)
        if (Number(w.count) >= 3)
          await tx
            .insert(awards)
            .values({
              id: randomUUID(),
              projectId: w.projectId,
              title: '3× Weekly Winner',
              description: 'Three first-place finishes in the weekly exhibition.',
              type: 'earned',
              rarity: 'gold',
            })
            .onConflictDoNothing();
    }
    await tx.update(periods).set({ lockedAt: new Date() }).where(eq(periods.id, id));
  });
}
export async function prepareWeeks() {
  await prepareCalendarPeriods();
  const expired = await db()
    .select()
    .from(periods)
    .where(
      and(
        eq(periods.kind, 'weekly'),
        lt(periods.endsAt, new Date()),
        sql`${periods.lockedAt} IS NULL`,
      ),
    );
  for (const p of expired) await lockPeriod(p.id);
  const { start, end } = weekBounds();
  for (const [s, e] of [
    [start, end],
    [end, new Date(end.getTime() + 7 * 86400000)],
  ]) {
    const existing = await db()
      .select()
      .from(periods)
      .where(and(eq(periods.kind, 'weekly'), eq(periods.startsAt, s)))
      .limit(1);
    if (!existing.length)
      await db()
        .insert(periods)
        .values({
          id: `week-${s.toISOString().slice(0, 10)}`,
          label: `Drop · ${s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`,
          kind: 'weekly',
          startsAt: s,
          endsAt: e,
          formula: 'weekly-support-v1',
        })
        .onConflictDoNothing();
  }
}

export async function prepareCalendarPeriods() {
  const now = new Date();
  const india = new Date(now.getTime() + 330 * 60000);
  const y = india.getUTCFullYear(),
    m = india.getUTCMonth();
  const candidates = [
    {
      id: `month-${y}-${m + 1}`,
      kind: 'monthly',
      label: india.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      startsAt: new Date(Date.UTC(y, m, 1) - 330 * 60000),
      endsAt: new Date(Date.UTC(y, m + 1, 1) - 330 * 60000),
    },
    {
      id: `year-${y}`,
      kind: 'yearly',
      label: String(y),
      startsAt: new Date(Date.UTC(y, 0, 1) - 330 * 60000),
      endsAt: new Date(Date.UTC(y + 1, 0, 1) - 330 * 60000),
    },
    {
      id: 'all-time',
      kind: 'all-time',
      label: 'All time',
      startsAt: new Date('2025-01-01T00:00:00Z'),
      endsAt: new Date('2100-01-01T00:00:00Z'),
    },
  ];
  for (const c of candidates) {
    const existing = await db()
      .select()
      .from(periods)
      .where(and(eq(periods.kind, c.kind), eq(periods.startsAt, c.startsAt)))
      .limit(1);
    if (!existing.length) await db().insert(periods).values(c).onConflictDoNothing();
  }
}
