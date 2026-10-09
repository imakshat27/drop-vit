import { HonorsIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
export default function Loading() {
  return (
    <div className="container page-loading">
      <HonorsIntro />
      <DataSkeleton layout="ranking" />
    </div>
  );
}
