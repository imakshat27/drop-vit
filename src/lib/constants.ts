export const categories = ['Open Source', 'Projects', 'Startups', 'Launches'] as const;
export type Category = (typeof categories)[number];
export const categoryCopy: Record<Category, string> = {
  'Open Source': 'Good code. Open doors.',
  Projects: 'Ideas made tangible.',
  Startups: 'Small teams. Big bets.',
  Launches: 'Fresh out of the workshop.',
};
export function dateRange(start: Date, end: Date) {
  const f = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
  return `${f.format(start)} — ${f.format(new Date(end.getTime() - 1))}`;
}
export function weekBounds(now = new Date()) {
  const india = new Date(now.getTime() + 330 * 60000);
  const day = india.getUTCDay();
  india.setUTCDate(india.getUTCDate() - day);
  india.setUTCHours(0, 0, 0, 0);
  const start = new Date(india.getTime() - 330 * 60000);
  return { start, end: new Date(start.getTime() + 7 * 86400000) };
}

// First public exhibition: Sunday 25 October 2026, 00:00 IST.
export function firstDropAt() {
  const value = new Date(process.env.DROP_FIRST_RELEASE_AT || '2026-10-24T18:30:00Z');
  if (!Number.isFinite(value.getTime())) throw new Error('Invalid first Drop date');
  return value;
}
export function firstDropLabel() {
  return firstDropAt().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}
export function firstDropDescription(now = new Date()) {
  return now < firstDropAt()
    ? `The first Drop arrives ${firstDropLabel()} at 00:00 IST. Released builds will appear here then. Submit yours for the first lineup.`
    : 'The first Drop is open. Released builds will appear here as the exhibition takes shape.';
}
