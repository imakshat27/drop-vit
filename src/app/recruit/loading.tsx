import { RecruitIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
export default function Loading() {
  return (
    <div className="container page-loading">
      <RecruitIntro />
      <DataSkeleton layout="grid" />
    </div>
  );
}
