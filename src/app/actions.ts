'use server';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, gt, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  users,
  sessions,
  projects,
  members,
  periods,
  entries,
  supports,
  awards,
  recruitments,
  audit,
} from '@/lib/schema';
import { currentUser, requireUser, requireAdmin, rateLimit } from '@/lib/auth';
import { hashToken } from '@/lib/password';
import { submissionSchema, type ActionState } from '@/lib/validation';
import { categories } from '@/lib/constants';
import { lockPeriod, prepareWeeks } from '@/lib/rankings';
function refresh() {
  revalidatePath('/', 'layout');
}
function message(e: unknown) {
  console.error(e instanceof Error ? e.message : 'Mutation failed');
  return e instanceof Error &&
    [
      'Too many attempts. Please try again in 15 minutes.',
      'This period is still open. Results can only lock after its closing time.',
      'Open-source builds need a repository URL before approval.',
      'Submission already reviewed',
    ].includes(e.message)
    ? e.message
    : 'Something went wrong. Please try again.';
}
export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get('drop_session')?.value;
  if (token)
    await db()
      .delete(sessions)
      .where(eq(sessions.tokenHash, hashToken(token)));
  jar.delete('drop_session');
  redirect('/');
}
export async function supportAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await currentUser();
  if (!user) return { error: 'Sign in to support this project.' };
  if (!user.verified) return { error: 'Sign in with your VIT Google account to support projects.' };
  const projectId = String(form.get('projectId') || '');
  const periodId = String(form.get('periodId') || '');
  try {
    await rateLimit(`support:${user.id}`, 50);
    const [period] = await db().select().from(periods).where(eq(periods.id, periodId));
    if (
      !period ||
      period.kind !== 'weekly' ||
      period.lockedAt ||
      new Date() < period.startsAt ||
      new Date() >= period.endsAt
    )
      return { error: 'This Drop is closed. Its results are permanent.' };
    const inserted = await db()
      .insert(supports)
      .values({ id: randomUUID(), projectId, periodId, userId: user.id })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) return { success: 'You already supported this project.' };
    const [count] = await db()
      .select({ n: sql<number>`count(*)::int` })
      .from(supports)
      .where(eq(supports.projectId, projectId));
    for (const threshold of [100, 500])
      if (Number(count.n) >= threshold)
        await db()
          .insert(awards)
          .values({
            id: randomUUID(),
            projectId,
            title: `${threshold} Supports`,
            description: `Backed by the community ${threshold} times.`,
            type: 'earned',
          })
          .onConflictDoNothing();
    refresh();
    return { success: 'Support recorded. Thanks for backing this build.' };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function submitAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const values: Record<string, unknown> = Object.fromEntries(form);
  for (const key of ['openSource', 'startup', 'launched', 'recruiting'])
    values[key] = form.get(key) === 'on';
  const parsed = submissionSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
    return { error: 'A few details need your attention.', errors };
  }
  let slug = '';
  try {
    await rateLimit(`submit:${user.id}`, 8);
    const v = parsed.data;
    const editing = String(form.get('editId') || '');
    const id = editing || randomUUID();
    slug = `${v.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${id.slice(0, 6)}`;
    await db().transaction(async (tx) => {
      if (editing) {
        await tx.execute(sql`SELECT id FROM projects WHERE id=${editing} FOR UPDATE`);
        const [old] = await tx
          .select()
          .from(projects)
          .where(and(eq(projects.id, editing), eq(projects.ownerId, user.id)));
        if (!old || !['changes', 'rejected', 'pending'].includes(old.status))
          throw new Error('Project cannot be edited');
        slug = old.slug;
      }
      const project = {
        title: v.title,
        tagline: v.tagline,
        description: v.description,
        category: v.category,
        website: v.website,
        github: v.github,
        demo: v.demo,
        tech: v.tech
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12),
        openSource: v.openSource || v.category === 'Open Source',
        startup: v.startup || v.category === 'Startups',
        launched: v.launched || v.category === 'Launches',
        status: 'pending',
        feedback: '',
        details: {
          problem: v.problem,
          solution: v.solution,
          language: v.language,
          license: v.license,
          difficulty: v.difficulty,
          areas: v.areas,
          setup: v.setup,
          stage: v.stage,
          traction: v.traction,
          launchDate: v.launchDate,
          whatsNew: v.whatsNew,
          media: v.media ? [v.media] : [],
        },
      };
      if (editing) {
        await tx.update(projects).set(project).where(eq(projects.id, id));
        await tx.delete(recruitments).where(eq(recruitments.projectId, id));
      } else {
        await tx
          .insert(projects)
          .values({ ...project, id, slug, symbol: 'custom', ownerId: user.id });
        await tx.insert(members).values({ projectId: id, userId: user.id, role: 'Creator' });
      }
      const emails = v.team
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      for (const email of emails) {
        const [member] = await tx.select().from(users).where(eq(users.email, email));
        if (!member) throw new Error('One of the team emails has no Drop account yet.');
        await tx
          .insert(members)
          .values({ projectId: id, userId: member.id, role: 'Collaborator' })
          .onConflictDoNothing();
      }
      if (v.recruiting)
        await tx.insert(recruitments).values({
          id: randomUUID(),
          projectId: id,
          role: v.role,
          description: v.roleDescription,
          skills: v.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          commitment: v.commitment,
          compensation: v.compensation,
          location: v.location || 'VIT Vellore / Remote',
          applicationUrl: v.applicationUrl,
        });
    });
    refresh();
  } catch (e) {
    if (e instanceof Error && e.message.includes('team emails')) return { error: e.message };
    return { error: message(e) };
  }
  redirect(`/projects/${slug}?submitted=1`);
}
export async function reviewAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(form.get('projectId'));
  const decision = String(form.get('decision'));
  const category = String(form.get('category'));
  const note = String(form.get('note') || '')
    .trim()
    .slice(0, 2000);
  if (
    !['approved', 'rejected', 'changes'].includes(decision) ||
    !categories.includes(category as (typeof categories)[number])
  )
    return { error: 'Choose a valid decision and category.' };
  if (decision !== 'approved' && !note) return { error: 'Add a useful note for the builder.' };
  try {
    await prepareWeeks();
    await db().transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM projects WHERE id=${id} FOR UPDATE`);
      const [p] = await tx.select().from(projects).where(eq(projects.id, id));
      if (!p || p.status === 'approved') throw new Error('Submission already reviewed');
      if (category === 'Open Source' && !p.github)
        throw new Error('Open-source builds need a repository URL before approval.');
      await tx
        .update(projects)
        .set({
          status: decision,
          category,
          feedback: note,
          openSource: p.openSource || category === 'Open Source',
          startup: p.startup || category === 'Startups',
          launched: p.launched || category === 'Launches',
        })
        .where(eq(projects.id, id));
      if (decision === 'approved') {
        const [next] = await tx
          .select()
          .from(periods)
          .where(and(eq(periods.kind, 'weekly'), gt(periods.startsAt, new Date())))
          .orderBy(asc(periods.startsAt))
          .limit(1);
        if (next)
          await tx
            .insert(entries)
            .values({ periodId: next.id, projectId: id })
            .onConflictDoNothing();
        for (const title of [
          'First Project',
          ...(p.openSource ? ['First Open Source Project'] : []),
          ...(p.launched ? ['First Launch'] : []),
        ])
          await tx
            .insert(awards)
            .values({
              id: randomUUID(),
              projectId: id,
              title,
              description: 'Approved and shared with the Drop community.',
              type: 'earned',
              rarity: 'common',
            })
            .onConflictDoNothing();
      }
      await tx
        .insert(audit)
        .values({ id: randomUUID(), actorId: admin.id, action: decision, targetId: id, note });
    });
    refresh();
    return {
      success:
        decision === 'approved'
          ? 'Approved. Scheduled for the next Weekly Drop.'
          : 'Decision saved. The builder can see your feedback.',
    };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function adminAction(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const action = String(form.get('action'));
  const id = String(form.get('id'));
  try {
    if (action === 'lock') {
      await lockPeriod(id);
    } else if (action === 'feature') {
      await db()
        .update(projects)
        .set({ featured: form.get('featured') === 'true' })
        .where(and(eq(projects.id, id), eq(projects.status, 'approved')));
    } else if (action === 'badge') {
      const title = String(form.get('title') || '').trim();
      if (title.length < 3 || title.length > 100)
        return { error: 'Badge title must be 3–100 characters.' };
      const [project] = await db()
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.status, 'approved')));
      if (!project) return { error: 'Select an approved project.' };
      await db()
        .insert(awards)
        .values({
          id: randomUUID(),
          projectId: id,
          title,
          description: String(form.get('description') || 'Curator-awarded distinction.').slice(
            0,
            500,
          ),
          type: 'special',
        })
        .onConflictDoNothing();
    } else if (action === 'role') {
      await db()
        .update(recruitments)
        .set({ status: form.get('status') === 'open' ? 'open' : 'closed' })
        .where(eq(recruitments.id, id));
    } else return { error: 'Unknown action.' };
    await db().insert(audit).values({ id: randomUUID(), actorId: admin.id, action, targetId: id });
    refresh();
    return { success: 'Saved.' };
  } catch (e) {
    return { error: message(e) };
  }
}
export async function updateProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      bio: z.string().max(500),
      skills: z.string().max(300),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Use a name of 2–80 characters, a bio under 500, and skills under 300.' };
  await db()
    .update(users)
    .set({
      name: parsed.data.name,
      bio: parsed.data.bio,
      skills: parsed.data.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
    .where(eq(users.id, user.id));
  refresh();
  return { success: 'Builder profile updated.' };
}
