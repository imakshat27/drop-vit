import Link from 'next/link';
import { eq, desc, ne } from 'drizzle-orm';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, periods, recruitments, audit, users } from '@/lib/schema';
import { currentWeek } from '@/lib/data';
import { categories } from '@/lib/constants';
import { reviewAction, adminAction } from '../actions';
import { ActionForm } from '@/components/action-form';
import { Empty, Tag } from '@/components/cards';
export const metadata = { title: 'Curator workspace' };
export default async function Admin() {
  const admin = await requireUser();
  if (admin.role !== 'admin')
    return (
      <main id="main" className="container" style={{ paddingTop: 48 }}>
        <Empty
          level="h1"
          title="The curator’s workshop."
          description="This workspace is for Drop’s curation team. Your own builds are waiting in your workshop."
          href="/me"
          label="Go to your workshop"
        />
      </main>
    );
  await currentWeek();
  const [queue, approved, editions, roles, log] = await Promise.all([
    db()
      .select()
      .from(projects)
      .where(ne(projects.status, 'approved'))
      .orderBy(desc(projects.createdAt)),
    db().select().from(projects).where(eq(projects.status, 'approved')),
    db().select().from(periods).orderBy(desc(periods.startsAt)),
    db()
      .select({ role: recruitments, project: projects })
      .from(recruitments)
      .innerJoin(projects, eq(recruitments.projectId, projects.id)),
    db()
      .select({ event: audit, name: users.name })
      .from(audit)
      .innerJoin(users, eq(audit.actorId, users.id))
      .orderBy(desc(audit.createdAt))
      .limit(25),
  ]);
  return (
    <main id="main" className="container">
      <div className="page-head">
        <span className="eyebrow">THE CURATOR’S WORKSHOP</span>
        <h1>
          A little <em>editorial care.</em>
        </h1>
        <p>Review the builds. Help them get better. Keep global discovery thoughtful.</p>
      </div>
      <nav className="tabs" aria-label="Curator sections">
        <a href="#queue">Submissions ({queue.filter((p) => p.status === 'pending').length})</a>
        <a href="#editions">Exhibitions</a>
        <a href="#badges">Special badges</a>
        <a href="#roles">Recruitment</a>
      </nav>
      <section className="admin-section" id="queue">
        <h2>Waiting in the wings.</h2>
        {queue.length ? (
          queue.map((p) => (
            <article className="admin-card" key={p.id}>
              <Tag>{p.status}</Tag>
              <h3 style={{ marginTop: 16 }}>
                <Link href={`/projects/${p.slug}`}>{p.title} ↗</Link>
              </h3>
              <p>{p.tagline}</p>
              <p>{p.description}</p>
              {p.feedback && <p>Previous note: {p.feedback}</p>}
              <ActionForm action={reviewAction} button="Save review">
                <input type="hidden" name="projectId" value={p.id} />
                <div className="review-layout">
                  <div className="field">
                    <label htmlFor={`decision-${p.id}`}>Decision</label>
                    <select id={`decision-${p.id}`} name="decision">
                      <option value="approved">Approve & schedule next Drop</option>
                      <option value="changes">Request changes</option>
                      <option value="rejected">Reject</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`category-${p.id}`}>Primary category</label>
                    <select id={`category-${p.id}`} name="category" defaultValue={p.category}>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor={`note-${p.id}`}>A useful note for the builder</label>
                  <textarea id={`note-${p.id}`} name="note" maxLength={2000} />
                  <small>Required for rejection or changes. Visible to the owner.</small>
                </div>
              </ActionForm>
            </article>
          ))
        ) : (
          <Empty
            title="All caught up."
            description="The workshop is in good hands. New submissions will appear here."
          />
        )}
      </section>
      <section className="admin-section" id="editions">
        <h2>Exhibitions & permanent records.</h2>
        <p className="understated">
          Weekly results freeze automatically on the next visit after closing. Monthly and yearly
          results can be finalized after the period ends.
        </p>
        {editions.map((p) => (
          <div className="admin-list-item" key={p.id}>
            <div>
              <b>{p.label}</b>
              <p>
                {p.kind} ·{' '}
                {p.lockedAt
                  ? 'Locked permanently'
                  : `Closes ${p.endsAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`}
              </p>
            </div>
            {p.lockedAt ? (
              <Tag>Locked</Tag>
            ) : p.kind === 'all-time' ? (
              <Tag>Rolling</Tag>
            ) : new Date() < p.endsAt ? (
              <Tag>Not ready to lock</Tag>
            ) : (
              <ActionForm action={adminAction} button="Lock permanently">
                <input type="hidden" name="action" value="lock" />
                <input type="hidden" name="id" value={p.id} />
              </ActionForm>
            )}
          </div>
        ))}
      </section>
      <div className="admin-grid">
        <section className="admin-section" id="badges">
          <h2>A special distinction.</h2>
          <div className="form-panel">
            <ActionForm action={adminAction} button="Award permanent badge">
              <input type="hidden" name="action" value="badge" />
              <div className="field">
                <label htmlFor="badge-project">Project</label>
                <select name="id" id="badge-project">
                  {approved.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="badge-title">Badge title</label>
                <input
                  id="badge-title"
                  name="title"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Hackathon Winner, Faculty Pick…"
                />
              </div>
              <div className="field">
                <label htmlFor="badge-description">Why it earned this</label>
                <textarea id="badge-description" name="description" maxLength={500} />
              </div>
              <p className="understated" style={{ marginBottom: 20 }}>
                This badge is permanent and appears on the project and its team’s profiles.
              </p>
            </ActionForm>
          </div>
        </section>
        <section className="admin-section">
          <h2>Curator picks.</h2>
          {approved.map((p) => (
            <div className="admin-list-item" key={p.id}>
              <div>
                <Link href={`/projects/${p.slug}`}>
                  <b>{p.title}</b>
                </Link>
                <p>{p.category}</p>
              </div>
              <ActionForm
                action={adminAction}
                button={p.featured ? 'Remove feature' : 'Feature build'}
              >
                <input type="hidden" name="action" value="feature" />
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="featured" value={p.featured ? 'false' : 'true'} />
              </ActionForm>
            </div>
          ))}
        </section>
      </div>
      <section className="admin-section" id="roles">
        <h2>Keep the doors up to date.</h2>
        {roles.map(({ role, project }) => (
          <div className="admin-list-item" key={role.id}>
            <div>
              <b>{role.role}</b>
              <p>
                {project.title} · {role.status} · Project {project.status}
              </p>
            </div>
            <ActionForm
              action={adminAction}
              button={role.status === 'open' ? 'Close role' : 'Reopen role'}
            >
              <input type="hidden" name="action" value="role" />
              <input type="hidden" name="id" value={role.id} />
              <input
                type="hidden"
                name="status"
                value={role.status === 'open' ? 'closed' : 'open'}
              />
            </ActionForm>
          </div>
        ))}
      </section>
      <section className="admin-section">
        <h2>A record of care.</h2>
        {log.length ? (
          log.map(({ event, name }) => (
            <div className="audit-row" key={event.id}>
              {event.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · {name} ·{' '}
              {event.action} · {event.targetId}
              {event.note && ` · ${event.note}`}
            </div>
          ))
        ) : (
          <p className="understated">Curator actions will be recorded here.</p>
        )}
      </section>
    </main>
  );
}
