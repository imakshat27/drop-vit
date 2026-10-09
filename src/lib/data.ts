import { and, eq, desc, asc, sql, or } from 'drizzle-orm';
import { db } from './db';
import { projects, users, members, awards, recruitments, periods, supports } from './schema';
import { prepareWeeks, rankingFor } from './rankings';
export async function approvedProjects(category?: string, q?: string) {
  const all = await db()
    .select()
    .from(projects)
    .where(eq(projects.status, 'approved'))
    .orderBy(desc(projects.featured), desc(projects.createdAt));
  return all.filter(
    (p) =>
      (!category ||
        category === 'All' ||
        p.category === category ||
        (category === 'Open Source' && p.openSource) ||
        (category === 'Startups' && p.startup) ||
        (category === 'Launches' && p.launched)) &&
      (!q || `${p.title} ${p.tagline} ${p.tech.join(' ')}`.toLowerCase().includes(q.toLowerCase())),
  );
}
export async function currentWeek() {
  return prepareWeeks();
}
export async function lastChampion() {
  const [p] = await db()
    .select()
    .from(periods)
    .where(and(eq(periods.kind, 'weekly'), sql`${periods.lockedAt} IS NOT NULL`))
    .orderBy(desc(periods.endsAt))
    .limit(1);
  if (!p) return null;
  const rows = await rankingFor(p);
  return rows[0] ? { ...rows[0], period: p } : null;
}
export async function projectBySlug(slug: string, userId?: string, isAdmin = false) {
  const [p] = await db()
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.slug, slug),
        isAdmin
          ? undefined
          : or(eq(projects.status, 'approved'), userId ? eq(projects.ownerId, userId) : undefined),
      ),
    );
  return p;
}
export async function projectTeam(id: string) {
  return db()
    .select({ id: users.id, name: users.name, bio: users.bio, role: members.role })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.projectId, id));
}
export async function projectAwards(id: string) {
  return db().select().from(awards).where(eq(awards.projectId, id)).orderBy(desc(awards.createdAt));
}
export async function openRoles() {
  return db()
    .select({ role: recruitments, project: projects })
    .from(recruitments)
    .innerJoin(projects, eq(recruitments.projectId, projects.id))
    .where(and(eq(recruitments.status, 'open'), eq(projects.status, 'approved')));
}
export async function supportedIds(userId?: string, periodId?: string) {
  if (!userId || !periodId) return [];
  return (
    await db()
      .select({ id: supports.projectId })
      .from(supports)
      .where(and(eq(supports.userId, userId), eq(supports.periodId, periodId)))
  ).map((r) => r.id);
}
export async function allPeriods() {
  return db().select().from(periods).orderBy(desc(periods.startsAt), asc(periods.kind));
}
