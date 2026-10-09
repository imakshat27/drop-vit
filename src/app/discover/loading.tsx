import { DiscoverIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
export default function Loading() {
  return (
    <div className="container page-loading">
      <DiscoverIntro valid="All" />
      <DataSkeleton layout="grid" />
    </div>
  );
}
