import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, projects, members, awards } from '@/lib/schema';
import { ProjectCard, Tag, Empty } from '@/components/cards';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [u] = await db().select({ name: users.name }).from(users).where(eq(users.id, id));
  return { title: u?.name || 'Builder not found' };
}
export default async function Builder({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const [u] = await db()
    .select({ id: users.id, name: users.name, bio: users.bio, skills: users.skills })
    .from(users)
    .where(eq(users.id, id));
  if (!u) notFound();
  const tab = (await searchParams).tab || 'work';
  const work = await db()
    .select({ project: projects, role: members.role })
    .from(members)
    .innerJoin(projects, eq(members.projectId, projects.id))
    .where(and(eq(members.userId, id), eq(projects.status, 'approved')));
  const badges = await db()
    .select({ award: awards, project: projects })
    .from(awards)
    .innerJoin(projects, eq(awards.projectId, projects.id))
    .innerJoin(members, eq(members.projectId, projects.id))
    .where(and(eq(members.userId, id), eq(projects.status, 'approved')));
  const list = tab === 'contributions' ? work.filter((p) => p.role !== 'Creator') : work;
  return (
    <main id="main" className="container">
      <div className="profile-hero">
        <div className="profile-avatar" aria-hidden>
          {u.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div>
          <span className="eyebrow">BUILDER AT VIT</span>
          <h1>{u.name}</h1>
          <p>{u.bio || 'A builder with something in the making.'}</p>
          <div className="stack-tags">
            {u.skills.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </div>
        </div>
      </div>
      <div className="profile-stats">
        <div>
          <b>{work.length}</b>
          <span>builds & collaborations</span>
        </div>
        <div>
          <b>{badges.length}</b>
          <span>project achievements</span>
        </div>
        <div>
          <b>{work.filter((w) => w.project.openSource).length}</b>
          <span>open-source builds</span>
        </div>
      </div>
      <nav className="tabs" aria-label="Builder profile sections">
        {[
          ['work', 'Work'],
          ['achievements', 'Achievements'],
          ['contributions', 'Contributions'],
        ].map(([v, l]) => (
          <Link href={`/builders/${id}?tab=${v}`} key={v} className={tab === v ? 'selected' : ''}>
            {l}
          </Link>
        ))}
      </nav>
      <section style={{ marginTop: 32 }}>
        {tab === 'achievements' ? (
          badges.length ? (
            <div className="project-grid">
              {badges.map(({ award: a, project: p }) => (
                <Link
                  className={`badge-card ${a.type === 'special' ? 'special' : ''}`}
                  key={a.id}
                  href={`/projects/${p.slug}`}
                >
                  <b aria-hidden>✳</b>
                  <div>
                    <h3>{a.title}</h3>
                    <p>
                      {p.title} · {a.description}
                    </p>
                    <small>
                      {a.type.toUpperCase()} · {a.rarity.toUpperCase()}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="The next milestone is ahead."
              description="Recognition here comes from the projects this builder helps ship."
            />
          )
        ) : list.length ? (
          <div className="project-grid">
            {list.map(({ project: p }) => (
              <ProjectCard project={p} key={p.id} />
            ))}
          </div>
        ) : (
          <Empty
            title="Something is in the making."
            description={
              tab === 'contributions'
                ? 'Collaborations will appear here once the projects are approved.'
                : 'Approved builds will find a home here.'
            }
            href="/discover"
          />
        )}
      </section>
    </main>
  );
}
