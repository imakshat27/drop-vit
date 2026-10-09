import { BrandSpark } from '@/components/brand-spark';
import { Suspense } from 'react';
import { RecruitIntro } from '@/components/page-intros';
import { DataSkeleton } from '@/components/data-skeleton';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { openRoles, projectAwards } from '@/lib/data';
import { Tag, RoleMeta, Empty } from '@/components/cards';
export const metadata = { title: 'Recruit' };
async function RecruitData() {
  const roles = await openRoles();
  const awards = await Promise.all(roles.map((r) => projectAwards(r.project.id)));
  return (
    <>
      <div className="drop-banner">
        <div>
          <span className="eyebrow">COLLABORATION, NOT COMPETITION</span>
          <h2>{roles.length} open doors.</h2>
          <p>
            Roles belong to approved projects. They aren’t ranked, voted on, or entered in the
            Weekly Drop.
          </p>
        </div>
        <Link href="/submit" className="text-link">
          Find people for your build <ArrowUpRight size={18} aria-hidden />
        </Link>
      </div>
      {roles.length ? (
        <div className="role-grid">
          {roles.map(({ role, project }, i) => (
            <article className="role-card" key={role.id}>
              <Link href={`/projects/${project.slug}`} className="role-project">
                <span className={`project-monogram ${project.color}`}>{project.title[0]}</span>
                {project.title}
                <ArrowUpRight size={15} aria-hidden />
              </Link>
              <h3>{role.role}</h3>
              <p>{role.description}</p>
              <div className="stack-tags" style={{ marginBottom: 20 }}>
                {role.skills.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </div>
              <RoleMeta location={role.location} commitment={role.commitment} />
              <p className="understated">
                {role.compensation} · {role.openings} opening{role.openings !== 1 ? 's' : ''}
              </p>
              {awards[i]
                .filter((a) => a.rarity !== 'common')
                .slice(0, 1)
                .map((a) => (
                  <div className="badge-card" style={{ marginTop: 20 }} key={a.id}>
                    <b aria-hidden>
                      <BrandSpark className="brand-mark" />
                    </b>
                    <div>
                      <h3>{a.title}</h3>
                      <small>{a.type.toUpperCase()}</small>
                    </div>
                  </div>
                ))}
              <Link href={`/projects/${project.slug}#recruitment`} className="text-link">
                Meet the build & apply <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="The workshop is quiet today."
          description="Check back for new opportunities, or submit your project with an open role."
          href="/submit"
          label="Grow your team"
        />
      )}
    </>
  );
}

export default function Recruit() {
  return (
    <main id="main" className="container">
      <RecruitIntro />
      <Suspense fallback={<DataSkeleton />}>
        <RecruitData />
      </Suspense>
    </main>
  );
}
