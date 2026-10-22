import { buildFormats, buildFormatIds } from '@/lib/build-formats';
import { DropSelect } from '@/components/drop-select';
import { Suspense } from 'react';
import { DiscoverIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { approvedProjects } from '@/lib/data';
import { categories, type Category } from '@/lib/constants';
import { ProjectCard, Empty } from '@/components/cards';
export const metadata = { title: 'Discover' };
export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; format?: string }>;
}) {
  const { category = 'All', q = '', format = '' } = await searchParams;
  const valid = categories.includes(category as Category) ? category : 'All';
  const validFormat = buildFormatIds.includes(format as (typeof buildFormatIds)[number])
    ? format
    : '';
  return (
    <main id="main" className="container">
      <DiscoverIntro valid={valid} />
      <div className="page-toolbar">
        <nav className="tabs" aria-label="Project categories">
          {['All', ...categories].map((c) => (
            <Link
              className={valid === c ? 'selected' : ''}
              aria-current={valid === c ? 'page' : undefined}
              href={`/discover?category=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ''}${validFormat ? `&format=${encodeURIComponent(validFormat)}` : ''}`}
              key={c}
            >
              {c === 'All' ? 'All builds' : c}
            </Link>
          ))}
        </nav>
      </div>
      <form className="discovery-filters">
        <input type="hidden" name="category" value={valid} />
        <div className="field discovery-format">
          <label htmlFor="build-format-filter">Build format</label>
          <DropSelect
            key={validFormat}
            id="build-format-filter"
            name="format"
            defaultValue={validFormat || 'all'}
            options={[
              { value: 'all', label: 'All formats' },
              ...buildFormats.map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
        <div className="search-form">
          <Search size={18} aria-hidden />
          <label className="sr-only" htmlFor="search">
            Search builds or technologies
          </label>
          <input
            id="search"
            name="q"
            placeholder="Find your next obsession…"
            defaultValue={q}
            maxLength={200}
          />
        </div>
        <button className="button secondary" type="submit">
          Apply filters
        </button>
        {(q || validFormat) && (
          <Link href={`/discover?category=${encodeURIComponent(valid)}`} className="text-link">
            Clear filters
          </Link>
        )}
      </form>
      <Suspense key={`${valid}:${q}:${validFormat}`} fallback={<DataSkeleton />}>
        <DiscoverProjects valid={valid} q={q} format={validFormat} />
      </Suspense>
    </main>
  );
}

async function DiscoverProjects({
  valid,
  q,
  format,
}: {
  valid: string;
  q: string;
  format: string;
}) {
  const projects = await approvedProjects(valid, q.slice(0, 200), format);
  return (
    <>
      <p className="browse-count">
        {projects.length} released {projects.length === 1 ? 'build' : 'builds'}
        {q && ` matching “${q}”`}
      </p>
      {projects.length ? (
        <section aria-label="Discovered builds">
          <h2 className="sr-only">Builds to explore</h2>
          <div className="project-grid">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
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
