import { and, eq, sql } from 'drizzle-orm';
import { projects } from './schema';

// Approval schedules a build; its first weekly exhibition opens public access.
// Locked weekly snapshots also establish release for imported historical builds.
export function projectReleaseAt() {
  return sql<Date | null>`(
    select min(release.starts_at) from (
      select p.starts_at from entries e join periods p on p.id = e.period_id
      where e.project_id = "projects"."id" and p.kind = 'weekly'
      union all
      select p.starts_at from results r join periods p on p.id = r.period_id
      where r.project_id = "projects"."id" and p.kind = 'weekly' and p.locked_at is not null
    ) release
  )`.mapWith((value) => (value ? new Date(value) : null));
}
export function releasedProject(now = new Date()) {
  return and(eq(projects.status, 'approved'), sql`${projectReleaseAt()} <= ${now}`)!;
}
export function isReleased(status: string, releaseAt: Date | null, now = new Date()) {
  return status === 'approved' && !!releaseAt && releaseAt <= now;
}
export function releaseMessage(releaseAt: Date | null) {
  if (!releaseAt)
    return 'Approved and awaiting a Drop date. Your build remains private until release.';
  return `Scheduled for the next Drop: ${releaseAt.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })} at ${releaseAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })} IST. Your build stays private until then.`;
}
