import { BrandSpark } from '@/components/brand-spark';
import { MediaGallery } from '@/components/media-gallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq, asc } from 'drizzle-orm';
import { ArrowUpRight, ArrowRight, Code2, Lock, Calendar } from 'lucide-react';
import { projectBySlug, projectTeam, projectAwards, currentWeek, supportedIds } from '@/lib/data';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projectReleaseAt, isReleased, releaseMessage } from '@/lib/project-release';
import { recruitments, results, periods, entries, projects } from '@/lib/schema';
import { rankingFor } from '@/lib/rankings';
import { Support } from '@/components/support';
import { Tag, RoleMeta } from '@/components/cards';
import { ShareButton } from '@/components/share-button';
import { projectShareCards, type ShareCard } from '@/lib/share-cards';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await projectBySlug(slug);
  return {
    title: p?.title || 'Private build',
    ...(!p ? { robots: { index: false, follow: false } } : {}),
  };
}
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();
  const p = await projectBySlug(slug, user?.id, user?.role === 'admin');
  if (!p) notFound();
  const [{ releaseAt }] = await db()
    .select({ releaseAt: projectReleaseAt() })
    .from(projects)
    .where(eq(projects.id, p.id));
  const released = isReleased(p.status, releaseAt);
  const week = await currentWeek();
  const [team, awards, roles, history, supported, enrolled] = await Promise.all([
    projectTeam(p.id),
    projectAwards(p.id),
    db()
      .select()
      .from(recruitments)
      .where(and(eq(recruitments.projectId, p.id), eq(recruitments.status, 'open'))),
    db()
      .select({ result: results, period: periods })
      .from(results)
      .innerJoin(periods, eq(results.periodId, periods.id))
      .where(and(eq(results.projectId, p.id), eq(results.category, 'Overall')))
      .orderBy(asc(periods.endsAt)),
    supportedIds(user?.id, week?.id),
    db()
      .select()
      .from(entries)
      .where(and(eq(entries.projectId, p.id), eq(entries.periodId, week.id))),
  ]);
  const ranked = enrolled.length ? await rankingFor(week) : [];
  const row = ranked.find((r) => r.project.id === p.id);
  const submitted = (await searchParams).submitted;
  const shareCards: ShareCard[] = released
    ? projectShareCards(p, team.map((t) => t.name).join(', '))
    : [];
  if (released) {
    for (const award of awards) {
      const locked = history.find((h) => h.period.id === award.periodId && h.period.lockedAt);
      // Period awards must be backed by locked results. Special curator awards stand alone.
      if (award.periodId && !locked) continue;
      shareCards.push({
        kind: 'award',
        title: locked?.result.titleSnapshot || p.title,
        description: award.description,
        distinction: award.title,
        period: locked?.period.label,
        path: `/projects/${p.slug}`,
        tags: [],
      });
    }
  }
  return (
    <main id="main" className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/discover">Discover</Link>
        <ArrowRight size={12} aria-hidden />
        <Link href={`/discover?category=${encodeURIComponent(p.category)}`}>{p.category}</Link>
        <ArrowRight size={12} aria-hidden />
        <span>{p.title}</span>
      </nav>
      {p.status === 'approved' && !released && (
        <div className="message">
          <b>Scheduled · private preview</b>
          <p>{releaseMessage(releaseAt)}</p>
        </div>
      )}
      {p.status !== 'approved' && (
        <div className="message">
          <b>
            {p.status === 'pending'
              ? 'Pending review'
              : p.status === 'changes'
                ? 'Changes requested'
                : 'Not approved'}
          </b>
          <p>
            {submitted
              ? 'You dropped it! A curator will review your build. After approval, it will appear when its scheduled Drop releases.'
              : 'This build is only visible to you, your curator, and its owner until its scheduled Drop releases.'}
          </p>
          {p.feedback && <p>Curator note: {p.feedback}</p>}
          {user?.id === p.ownerId && <Link href={`/submit?edit=${p.id}`}>Edit and resubmit →</Link>}
        </div>
      )}
      <div className="project-header">
        <div>
          <div className="project-heading-tags">
            <Tag>{p.category}</Tag>
            {p.openSource && p.category !== 'Open Source' && <Tag>Open source</Tag>}
            {p.featured && <Tag color="lime">Curator pick</Tag>}
            {roles.length > 0 && <Tag>Team is growing</Tag>}
          </div>
          <h1>{p.title}</h1>
          <p>{p.tagline}</p>
        </div>
        {row ? (
          <Support
            key={week.id}
            title={p.title}
            projectId={p.id}
            periodId={week.id}
            count={row.count}
            supported={supported.includes(p.id)}
          />
        ) : (
          <Link href="/weekly" className="button secondary">
            Explore this week <ArrowUpRight size={16} aria-hidden />
          </Link>
        )}
      </div>
      {shareCards.length > 0 && (
        <div className="project-share-row">
          <ShareButton cards={shareCards} label="Share this build" />
        </div>
      )}
      {p.details.media?.length ? (
        <MediaGallery urls={p.details.media.slice(0, 4)} title={p.title} />
      ) : (
        <div className="project-hero-art project-compact-fallback">
          <BrandSpark className="brand-mark" />
          <div>
            <strong>No screenshots yet.</strong>
            <p>Get to know the build below.</p>
          </div>
        </div>
      )}
      <div className="project-body">
        <div>
          <section className="story-section">
            <span className="eyebrow">BEHIND THE BUILD</span>
            <h2 style={{ marginTop: 14 }}>The idea, made real.</h2>
            <p>{p.description}</p>
            {p.details.problem && (
              <>
                <h3>The problem</h3>
                <p>{p.details.problem}</p>
              </>
            )}
            {p.details.solution && (
              <>
                <h3>The approach</h3>
                <p>{p.details.solution}</p>
              </>
            )}
          </section>

          <section className="story-section">
            <h2>The building blocks.</h2>
            <div className="stack-tags">
              {p.tech.length ? (
                p.tech.map((t) => <Tag key={t}>{t}</Tag>)
              ) : (
                <p>The maker hasn’t added a tech stack yet.</p>
              )}
            </div>
          </section>
          {p.openSource && (
            <section className="story-section">
              <span className="eyebrow">
                <Code2 size={15} aria-hidden /> AN OPEN DOOR
              </span>
              <h2 style={{ marginTop: 14 }}>Make your first contribution.</h2>
              <p>
                {p.details.areas ||
                  'The team welcomes thoughtful contributions. Visit the repository to find where you can help.'}
              </p>
              <div className="fact-grid">
                {[
                  ['Language', p.details.language],
                  ['License', p.details.license],
                  ['Getting started', p.details.difficulty],
                  ['Contributors', p.details.contributors?.toString()],
                ].map(([label, value]) => (
                  <div className="fact" key={label}>
                    <small>{label}</small>
                    <b>{value || 'Ask the maintainers'}</b>
                  </div>
                ))}
              </div>
              {p.details.setup && (
                <>
                  <h3>A little help getting started</h3>
                  <div className="setup">{p.details.setup}</div>
                </>
              )}
              {p.github && (
                <a
                  href={p.github}
                  className="button secondary"
                  style={{ marginTop: 20 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Explore the repository <ArrowUpRight size={17} aria-hidden />
                </a>
              )}
            </section>
          )}
          {p.startup && (
            <section className="story-section">
              <h2>A small team. A big bet.</h2>
              <div className="fact-grid">
                <div className="fact">
                  <small>Stage</small>
                  <b>{p.details.stage || 'Getting started'}</b>
                </div>
                <div className="fact">
                  <small>Early momentum</small>
                  <b>{p.details.traction || 'Building the first version'}</b>
                </div>
              </div>
            </section>
          )}
          {p.launched && (
            <section className="story-section">
              <span className="eyebrow">
                <Calendar size={14} aria-hidden /> OUT IN THE WORLD
              </span>
              <h2 style={{ marginTop: 14 }}>Freshly shipped.</h2>
              <p>{p.details.whatsNew || 'The first public version is ready to explore.'}</p>
              {p.details.launchDate && (
                <p className="understated">
                  Launched{' '}
                  {new Date(`${p.details.launchDate}T00:00:00`).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </section>
          )}
          {roles.length > 0 && (
            <section className="story-section" id="recruitment">
              <h2>Build this with us.</h2>
              <p>
                Explore the actual project, then find a role that fits. These opportunities are
                unranked.
              </p>
              {roles.map((role) => (
                <div className="role-card" style={{ marginTop: 20 }} key={role.id}>
                  <h3>{role.role}</h3>
                  <p>{role.description}</p>
                  <div className="stack-tags" style={{ marginBottom: 18 }}>
                    {role.skills.map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                  <RoleMeta location={role.location} commitment={role.commitment} />
                  <p className="understated">
                    {role.compensation} · {role.openings}{' '}
                    {role.openings === 1 ? 'opening' : 'openings'}
                  </p>
                  <a
                    href={role.applicationUrl}
                    className="button secondary"
                    target={role.applicationUrl.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                  >
                    Apply with the team <ArrowUpRight size={17} aria-hidden />
                  </a>
                  {role.applicationUrl.includes('@demo.drop.test') && (
                    <p className="understated">
                      Sample role · fictional contact for this exhibition.
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}
          <section className="story-section">
            <h2>A little history.</h2>
            <div className="timeline">
              <div className="timeline-item">
                <small>
                  {p.createdAt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                </small>
                <p>Shared with Drop</p>
              </div>
              {history.map(({ result, period }) => (
                <div className="timeline-item" key={result.id}>
                  <small>
                    <Lock size={11} style={{ display: 'inline' }} aria-hidden /> {period.label} ·
                    Locked
                  </small>
                  <p>
                    #{result.rank} overall · {result.supportCount} supports
                  </p>
                  <Link
                    className="text-link"
                    href={
                      period.kind === 'weekly'
                        ? `/weekly?period=${period.id}`
                        : `/honors?period=${period.id}&kind=${period.kind}`
                    }
                  >
                    See permanent results <ArrowRight size={14} aria-hidden />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
        <aside className="project-aside">
          <section className="aside-section">
            <h2>The people who made it</h2>
            {team.map((t) => (
              <Link className="builder" href={`/builders/${t.id}`} key={t.id}>
                <span className="avatar">
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div>
                  <b>{t.name}</b>
                  <small>{t.role}</small>
                </div>
              </Link>
            ))}
          </section>
          <section className="aside-section">
            <h2>Find it in the wild</h2>
            {[
              ['Website', p.website],
              ['Live demo', p.demo],
              ['Repository', p.github],
            ]
              .filter(([, url]) => url)
              .map(([label, url]) => (
                <a
                  href={url}
                  className="project-link"
                  key={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {label}
                  <ArrowUpRight size={16} aria-hidden />
                </a>
              ))}
            {!p.website && !p.demo && !p.github && (
              <p className="understated">External links coming from the makers.</p>
            )}
          </section>
          <section className="aside-section">
            <h2>Earned, not given</h2>
            {awards.map((a) => (
              <div className={`badge-card ${a.type === 'special' ? 'special' : ''}`} key={a.id}>
                <b aria-hidden>
                  <BrandSpark className="brand-mark" />
                </b>
                <div>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  <small>
                    {a.type.toUpperCase()} · {a.rarity.toUpperCase()}
                  </small>
                </div>
              </div>
            ))}
            {!awards.length && (
              <p className="understated">
                Every great build starts somewhere. Its first milestone is ahead.
              </p>
            )}
            {shareCards.some((card) => card.kind === 'award') && (
              <ShareButton
                cards={shareCards.filter((card) => card.kind === 'award')}
                label="Share an achievement"
              />
            )}
          </section>
          {row && (
            <section className="aside-section">
              <h2>This week’s exhibition</h2>
              <p>
                #{row.rank} in {week.label}
              </p>
              <Link href="/weekly" className="text-link">
                See the full lineup <ArrowRight size={16} aria-hidden />
              </Link>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
