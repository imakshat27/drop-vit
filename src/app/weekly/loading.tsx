import { WeeklyIntro } from '@/components/page-intros';
import { WeeklyPending } from '@/components/weekly-pending';
export default function Loading() {
  return (
    <div className="container page-loading">
      <WeeklyIntro />
      <WeeklyPending />
    </div>
  );
}
