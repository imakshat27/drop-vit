import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, recruitments } from '@/lib/schema';
import { SubmissionForm } from '@/components/submission-form';
import type { SubmissionInput } from '@/lib/validation';
export const metadata = { title: 'Submit your build' };
export default async function Submit({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await requireUser();
  const { edit } = await searchParams;
  let initial: Partial<SubmissionInput> | undefined;
  if (edit) {
    const [p] = await db()
      .select()
      .from(projects)
      .where(and(eq(projects.id, edit), eq(projects.ownerId, user.id)));
    if (!p || p.status === 'approved') notFound();
    const [role] = await db().select().from(recruitments).where(eq(recruitments.projectId, p.id));
    initial = {
      title: p.title,
      tagline: p.tagline,
      description: p.description,
      category: p.category as SubmissionInput['category'],
      website: p.website,
      github: p.github,
      demo: p.demo,
      tech: p.tech.join(', '),
      openSource: p.openSource,
      startup: p.startup,
      launched: p.launched,
      ...p.details,
      media: JSON.stringify(p.details.media || []),
      recruiting: !!role,
      role: role?.role || '',
      roleDescription: role?.description || '',
      skills: role?.skills.join(', ') || '',
      commitment: role?.commitment || '',
      compensation: role?.compensation || '',
      location: role?.location || '',
      applicationUrl: role?.applicationUrl || '',
    };
  }
  return (
    <main id="main" className="container">
      <div className="form-wrap">
        <div className="form-header">
          <span className="eyebrow">YOUR IDEA BELONGS HERE</span>
          <h1>
            {edit ? (
              'Back to the workshop.'
            ) : (
              <>
                Ready, set, <em>Drop.</em>
              </>
            )}
          </h1>
          <p>A little context goes a long way. Show us what you made.</p>
        </div>
        <SubmissionForm initial={initial} editId={edit} />
      </div>
    </main>
  );
}
