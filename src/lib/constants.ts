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
  india.setUTCDate(india.getUTCDate() - ((day + 6) % 7));
  india.setUTCHours(0, 0, 0, 0);
  const start = new Date(india.getTime() - 330 * 60000);
  return { start, end: new Date(start.getTime() + 7 * 86400000) };
}
