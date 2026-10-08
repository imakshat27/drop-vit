import Link from 'next/link';
import { and, eq, desc, sql } from 'drizzle-orm';
import { Lock, ArrowUpRight } from 'lucide-react';
import { db } from '@/lib/db';
import { results, periods, projects } from '@/lib/schema';
import { currentWeek, allPeriods } from '@/lib/data';
import { rankingFor } from '@/lib/rankings';
import { categories } from '@/lib/constants';
import { RankingRow, Empty } from '@/components/cards';
export const metadata = { title: 'Honors' };
export default async function Honors({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; category?: string; period?: string; view?: string }>;
}) {
  await currentWeek();
  const query = await searchParams;
  const kind = ['weekly', 'monthly', 'yearly', 'all-time'].includes(query.kind || '')
    ? query.kind!
    : 'monthly';
  const category = ['Overall', ...categories].includes(query.category || '')
    ? query.category!
    : 'Overall';
  const all = await allPeriods();
  const options = all.filter((p) => p.kind === kind);
  const period =
    options.find((p) => p.id === query.period) || options.find((p) => !p.lockedAt) || options[0];
  const hall = query.view === 'hall';
  const ranked = period && !hall ? await rankingFor(period, category) : [];
  const champions = hall
    ? await db()
        .select({ result: results, period: periods, project: projects })
        .from(results)
        .innerJoin(periods, eq(results.periodId, periods.id))
        .innerJoin(projects, eq(results.projectId, projects.id))
        .where(and(eq(results.rank, 1), sql`${periods.lockedAt} IS NOT NULL`))
        .orderBy(desc(periods.endsAt))
    : [];
  const url = (overrides: Record<string, string>) =>
    '/honors?' +
    new URLSearchParams({
      kind,
      category,
      ...(query.period ? { period: query.period } : {}),
      ...overrides,
    }).toString();
  return (
    <main id="main" className="container">
      <div className="page-head split">
        <div>
          <span className="eyebrow">GOOD WORK LEAVES A MARK</span>
          <h1>
            {hall ? (
              <>
                The Hall <em>of Fame.</em>
              </>
            ) : (
              <>
                A place <em>well earned.</em>
              </>
            )}
          </h1>
          <p>
            {hall
              ? 'The builds that became a little bigger than a side project. Their place here is permanent.'
              : 'Weekly champions. Monthly standouts. Lasting recognition for projects that deserve it.'}
          </p>
        </div>
        <span className="header-shape" aria-hidden>
          ✳
        </span>
      </div>
      <nav className="tabs honors-tabs" aria-label="Honors sections">
        <Link className={!hall ? 'selected' : ''} href="/honors">
          Leaderboards
        </Link>
        <Link className={hall ? 'selected' : ''} href="/honors?view=hall">
          Hall of Fame
        </Link>
      </nav>
      {hall ? (
        champions.length ? (
          <div className="hall-grid">
            {champions.map(({ result: r, period: p, project }) => (
              <article className="hall-card" key={r.id}>
                <span className="locked-label">
                  <Lock size={12} aria-hidden /> {p.label.toUpperCase()}
                </span>
                <span className="award-star" aria-hidden>
                  ✳
                </span>
                <span className="eyebrow">
                  {r.category === 'Overall'
                    ? 'OVERALL CHAMPION'
                    : `${r.category.toUpperCase()} WINNER`}
                </span>
                <h3 style={{ marginTop: 12 }}>{r.titleSnapshot}</h3>
                <p>{r.taglineSnapshot}</p>
                <Link href={`/projects/${project.slug}`} className="text-link">
                  Meet the build <ArrowUpRight size={17} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="The first legends are in the making."
            description="Completed exhibitions will leave their champions here."
            href="/weekly"
          />
        )
      ) : (
        <>
          <div className="page-toolbar">
            <nav className="tabs" aria-label="Leaderboard timeframe">
              {[
                ['weekly', 'Weekly'],
                ['monthly', 'Monthly'],
                ['yearly', 'Yearly'],
                ['all-time', 'All time'],
              ].map(([value, label]) => (
                <Link
                  href={url({ kind: value, period: '' })}
                  className={kind === value ? 'selected' : ''}
                  key={value}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <form className="period-select">
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="category" value={category} />
              <label htmlFor="period">Edition</label>
              <select id="period" name="period" defaultValue={period?.id}>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.lockedAt ? ' · Locked' : ' · In progress'}
                  </option>
                ))}
              </select>
              <button className="button secondary small">View edition</button>
            </form>
          </div>
          <nav className="tabs" aria-label="Leaderboard category">
            {['Overall', ...categories].map((c) => (
              <Link
                href={url({ category: c })}
                className={category === c ? 'selected' : ''}
                key={c}
              >
                {c}
              </Link>
            ))}
          </nav>
          {period && (
            <div className="drop-banner" style={{ marginTop: 30 }}>
              <div>
                <span className="eyebrow">
                  {category.toUpperCase()} / {period.kind.toUpperCase()}
                </span>
                <h2>{period.label}</h2>
                <p>
                  {period.kind === 'weekly'
                    ? 'One verified support per project per builder.'
                    : 'Average weekly support share · weekly-share-v1'}
                </p>
              </div>
              <span className="locked-label">
                {period.lockedAt ? (
                  <>
                    <Lock size={14} aria-hidden /> LOCKED FOREVER
                  </>
                ) : (
                  <>IN PROGRESS</>
                )}
              </span>
            </div>
          )}
          <div className="weekly-layout">
            <section aria-label={`${category} rankings`}>
              {ranked.length ? (
                ranked.map((r) => (
                  <RankingRow
                    row={r}
                    key={r.project.id}
                    periodId={period.id}
                    locked={!!period.lockedAt}
                    score={kind !== 'weekly'}
                  />
                ))
              ) : (
                <Empty
                  title="An open field."
                  description="No eligible builds in this period and category yet. Recognition starts with shipping."
                  href="/discover"
                />
              )}
            </section>
            <aside className="note-panel">
              <h3>Built to be fair.</h3>
              <p>
                Monthly, yearly, and all-time scores average each project’s weekly share of support
                in its eligible weeks. More weeks on the platform don’t automatically mean a higher
                score.
              </p>
              <p>
                Only weeks fully contained within a period count. In-progress editions include this
                week’s live score. Ties use stable project IDs. The formula is versioned so future
                editions can evolve.
              </p>
              <p>
                When an edition ends, its ranks, scores, and project titles are stored permanently.
                Recruitment never enters these rankings.
              </p>
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
