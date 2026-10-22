import { Suspense } from 'react';
import { WeeklyIntro } from '@/components/page-intros';
import { WeeklyPending, WeeklyNote } from '@/components/weekly-pending';
import { LiveRefresh } from '@/components/live-refresh';
import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { periods } from '@/lib/schema';
import { currentWeek, supportedIds, allPeriods } from '@/lib/data';
import { rankingFor } from '@/lib/rankings';
import { currentUser } from '@/lib/auth';
import { firstDropDescription, dateRange } from '@/lib/constants';
import { RankingRow, Empty } from '@/components/cards';
import { Countdown } from '@/components/countdown';
export const metadata = { title: 'Weekly Drop' };
async function WeeklyData({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const active = await currentWeek();
  const { period: requested } = await searchParams;
  const [requestedPeriod] = requested
    ? await db().select().from(periods).where(eq(periods.id, requested))
    : [];
  const period =
    requestedPeriod?.kind === 'weekly' && requestedPeriod.startsAt <= new Date()
      ? requestedPeriod
      : active;
  const [ranked, user, archive] = await Promise.all([
    rankingFor(period),
    currentUser(),
    allPeriods(),
  ]);
  const supported = await supportedIds(user?.id, period.id);
  const upcoming = period.startsAt > new Date();
  return (
    <>
      {!period.lockedAt && !upcoming && <LiveRefresh />}
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
          <p>
            {upcoming ? 'Opens Sunday at 00:00 IST · ' : 'Week of '}
            {dateRange(period.startsAt, period.endsAt)} · Voting closes{' '}
            {period.endsAt.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              timeZone: 'Asia/Kolkata',
            })}{' '}
            at 00:00 IST
          </p>
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
              description={firstDropDescription()}
              href="/submit"
              label="Put your build in the mix"
            />
          )}
        </section>
        <aside>
          <WeeklyNote />
          <div className="aside-section" style={{ marginTop: 30 }}>
            <h2>Other exhibitions</h2>
            {archive
              .filter((p) => p.kind === 'weekly' && p.id !== period.id && p.lockedAt)
              .map((p) => (
                <Link className="project-link" key={p.id} href={`/weekly?period=${p.id}`}>
                  {p.label}
                  <Lock size={13} aria-hidden />
                </Link>
              ))}
          </div>
        </aside>
      </div>
    </>
  );
}

export default function Weekly({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  return (
    <main id="main" className="container">
      <WeeklyIntro />
      <Suspense fallback={<WeeklyPending />}>
        <WeeklyData searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
