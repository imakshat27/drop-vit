import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { DataSkeleton } from './data-skeleton';
export function WeeklyPending() {
  return (
    <div className="weekly-layout">
      <DataSkeleton layout="ranking" />
      <aside>
        <WeeklyNote />
      </aside>
    </div>
  );
}
export function WeeklyNote() {
  return (
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
  );
}
