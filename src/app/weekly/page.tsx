import { LiveRefresh } from '@/components/live-refresh';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { ArrowUpRight, Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { periods } from '@/lib/schema';
import { currentWeek, supportedIds, allPeriods } from '@/lib/data';
import { rankingFor } from '@/lib/rankings';
import { currentUser } from '@/lib/auth';
import { dateRange } from '@/lib/constants';
import { RankingRow, Empty } from '@/components/cards';
import { Countdown } from '@/components/countdown';
export const metadata = { title: 'Weekly Drop' };
export default async function Weekly({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const active = await currentWeek();
  const { period: requested } = await searchParams;
  const [requestedPeriod] = requested
    ? await db().select().from(periods).where(eq(periods.id, requested))
    : [];
  const period = requestedPeriod?.kind === 'weekly' ? requestedPeriod : active;
  const [ranked, user, archive] = await Promise.all([
    rankingFor(period),
    currentUser(),
    allPeriods(),
  ]);
  const supported = await supportedIds(user?.id, period.id);
  const upcoming = period.startsAt > new Date();
  return (
    <main id="main" className="container">
      {!period.lockedAt && !upcoming && <LiveRefresh />}
      <div className="page-head split">
        <div>
          <span className="eyebrow">A NEW EXHIBITION. EVERY MONDAY.</span>
          <h1>
            The Weekly <em>Drop.</em>
          </h1>
          <p>
            Big ideas, small teams, and things that actually shipped. Take a look around. Back the
            builds you believe in.
          </p>
        </div>
        <span className="header-shape" aria-hidden>
          ↗
        </span>
      </div>
      <div className="drop-banner">
        <div>
          <span className="eyebrow">
            {period.lockedAt ? 'PERMANENT RECORD' : upcoming ? 'UP NEXT' : 'THE EXHIBITION IS OPEN'}
          </span>
          <h2>
            {period.label}{' '}
            <span className="understated">
              / {ranked.length} {ranked.length === 1 ? 'build' : 'builds'}
            </span>
          </h2>
          <p>{dateRange(period.startsAt, period.endsAt)} · Closes at midnight IST</p>
        </div>
        {period.lockedAt ? (
          <span className="locked-label">
            <Lock size={14} aria-hidden /> LOCKED FOREVER
          </span>
        ) : upcoming ? (
          <span className="locked-label">
            Opens {dateRange(period.startsAt, period.endsAt).split(' — ')[0]}
          </span>
        ) : (
          <Countdown endsAt={period.endsAt.toISOString()} />
        )}
      </div>
      <div className="weekly-layout">
        <section aria-label="Project rankings">
          <div className="weekly-intro">
            <span className="eyebrow">{period.lockedAt ? 'THE FINAL LINEUP' : 'THE LINEUP'}</span>
            <span className="micro">
              {period.lockedAt ? 'Final supports' : 'Ranked by support · updates every 30s'}
            </span>
          </div>
          {ranked.length ? (
            ranked.map((row) => (
              <RankingRow
                key={row.project.id}
                row={row}
                periodId={period.id}
                supported={supported.includes(row.project.id)}
                locked={!!period.lockedAt}
                upcoming={upcoming}
              />
            ))
          ) : (
            <Empty
              title="The next big thing is coming."
              description="Approved submissions join the next exhibition. This lineup will grow as our curators review new builds."
              href="/submit"
              label="Put your build in the mix"
            />
          )}
        </section>
        <aside>
          <div className="note-panel">
            <h3>
              A little support
              <br />
              goes a long way.
            </h3>
            <p>Projects compete. People don’t.</p>
            <ul>
              <li>Verified builders can support each project once per Drop.</li>
              <li>No downvotes. Just backing what you believe in.</li>
              <li>When the week ends, the results stay put. Forever.</li>
              <li>Recruitment is always outside the competition.</li>
            </ul>
            <Link href="/submit" className="button secondary">
              Submit your build <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="aside-section" style={{ marginTop: 30 }}>
            <h2>Other exhibitions</h2>
            {archive
              .filter(
                (p) =>
                  p.kind === 'weekly' &&
                  p.id !== period.id &&
                  (p.lockedAt || p.startsAt > new Date()),
              )
              .map((p) => (
                <Link className="project-link" key={p.id} href={`/weekly?period=${p.id}`}>
                  {p.label}
                  <Lock size={13} aria-hidden />
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
