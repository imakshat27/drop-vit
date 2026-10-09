import { BrandSpark } from '@/components/brand-spark';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Star, MapPin } from 'lucide-react';
import { ProjectArt } from './art';
import { Support } from './support';
import type { Project } from '@/lib/schema';
import type { RankedProject } from '@/lib/rankings';
export function Tag({ children, color = '' }: { children: React.ReactNode; color?: string }) {
  return <span className={`tag ${color}`}>{children}</span>;
}
export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card">
      <Link href={`/projects/${project.slug}`} className="art-link">
        <ProjectArt symbol={project.symbol} color={project.color} title={project.title} />
      </Link>
      <div className="card-meta">
        <Tag>{project.category}</Tag>
        {project.featured && (
          <span className="micro">
            <Star size={14} aria-hidden /> Curator pick
          </span>
        )}
      </div>
      <h3>
        <Link href={`/projects/${project.slug}`}>
          {project.title}
          <ArrowUpRight size={20} aria-hidden />
        </Link>
      </h3>
      <p>{project.tagline}</p>
      <div className="tech-list">
        {project.tech.slice(0, 3).map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </article>
  );
}
export function RankingRow({
  row,
  periodId,
  supported = false,
  locked = false,
  score = false,
  upcoming = false,
}: {
  row: RankedProject;
  periodId: string;
  supported?: boolean;
  locked?: boolean;
  score?: boolean;
  upcoming?: boolean;
}) {
  return (
    <article className="ranking-row">
      <span className={`rank ${row.rank === 1 ? 'first' : ''}`}>
        {upcoming ? '—' : String(row.rank).padStart(2, '0')}
      </span>
      <Link
        href={`/projects/${row.project.slug}`}
        className={`project-monogram ${row.project.color}`}
        aria-label={`View ${row.project.title}`}
      >
        {row.project.title.slice(0, 1)}
        <span>↗</span>
      </Link>
      <div className="rank-info">
        <div className="rank-heading">
          <Link href={`/projects/${row.project.slug}`}>{row.project.title}</Link>
          <Tag>{row.project.category}</Tag>
        </div>
        <p>{row.project.tagline}</p>
        <div className="tech-list">
          {row.project.tech.slice(0, 3).map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      {score ? (
        <div className="score">
          <b>{row.score.toFixed(2)}</b>
          <span>weekly share</span>
        </div>
      ) : (
        <Support
          key={periodId}
          title={row.project.title}
          compact
          projectId={row.project.id}
          periodId={periodId}
          count={row.count}
          supported={supported}
          locked={locked}
          upcoming={upcoming}
        />
      )}
    </article>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  href,
  label = 'Explore all',
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {href && (
        <Link className="text-link" href={href}>
          {label}
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}
    </div>
  );
}
export function Empty({
  title,
  description,
  href,
  label,
  level = 'h2',
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
  level?: 'h1' | 'h2';
}) {
  const Heading = level;
  return (
    <div className="empty">
      <span className="empty-spark" aria-hidden>
        <BrandSpark className="brand-mark" />
      </span>
      <Heading>{title}</Heading>
      <p>{description}</p>
      {href && (
        <Link href={href} className="button">
          {label || 'Explore projects'}
          <ArrowRight size={18} aria-hidden />
        </Link>
      )}
    </div>
  );
}
export function RoleMeta({ location, commitment }: { location: string; commitment: string }) {
  return (
    <div className="role-meta">
      <span>
        <MapPin size={14} aria-hidden />
        {location}
      </span>
      <span>{commitment}</span>
    </div>
  );
}
