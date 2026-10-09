import { Suspense } from 'react';
import { DiscoverIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { approvedProjects } from '@/lib/data';
import { categories, type Category } from '@/lib/constants';
import { ProjectCard, Empty } from '@/components/cards';
export const metadata = { title: 'Discover' };
export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category = 'All', q = '' } = await searchParams;
  const valid = categories.includes(category as Category) ? category : 'All';
  return (
    <main id="main" className="container">
      <DiscoverIntro valid={valid} />
      <div className="page-toolbar">
        <nav className="tabs" aria-label="Project categories">
          {['All', ...categories].map((c) => (
            <Link
              className={valid === c ? 'selected' : ''}
              aria-current={valid === c ? 'page' : undefined}
              href={`/discover?category=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              key={c}
            >
              {c === 'All' ? 'All builds' : c}
            </Link>
          ))}
        </nav>
        <form className="search-form">
          <Search size={18} aria-hidden />
          <input type="hidden" name="category" value={valid} />
          <label className="sr-only" htmlFor="search">
            Search projects or technologies
          </label>
          <input
            id="search"
            name="q"
            placeholder="Find your next obsession…"
            defaultValue={q}
            maxLength={200}
          />
          <button aria-label="Search">
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
      <Suspense key={`${valid}:${q}`} fallback={<DataSkeleton />}>
        <DiscoverProjects valid={valid} q={q} />
      </Suspense>
    </main>
  );
}

async function DiscoverProjects({ valid, q }: { valid: string; q: string }) {
  const projects = await approvedProjects(valid, q.slice(0, 200));
  return (
    <>
      <p className="browse-count">
        {projects.length} approved {projects.length === 1 ? 'build' : 'builds'}
        {q && ` matching “${q}”`}
      </p>
      {projects.length ? (
        <div className="project-grid">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Empty
          title="Nothing here. Yet."
          description="Try a different search, or be the first to bring a build to this corner of Drop."
          href="/discover"
          label="Reset discovery"
        />
      )}
    </>
  );
}
