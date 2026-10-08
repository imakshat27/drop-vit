import { LiveRefresh } from '@/components/live-refresh';
import Link from 'next/link';
import { MotionControl } from '@/components/motion';
import { Portal, CurveType } from '@/components/portal';
import { ArrowUpRight, ArrowRight, Trophy, ArrowUp } from 'lucide-react';
import { ProjectArt } from '@/components/art';
import { ProjectCard, RankingRow, SectionTitle, RoleMeta } from '@/components/cards';
import {
  approvedProjects,
  currentWeek,
  lastChampion,
  openRoles,
  supportedIds,
  projectTeam,
} from '@/lib/data';
import { rankingFor } from '@/lib/rankings';
import { currentUser } from '@/lib/auth';
import { categories, categoryCopy, dateRange } from '@/lib/constants';
export default async function Home() {
  const week = await currentWeek();
  const user = await currentUser();
  const [projects, champion, roles, ranked, supported] = await Promise.all([
    approvedProjects(),
    lastChampion(),
    openRoles(),
    week ? rankingFor(week) : Promise.resolve([]),
    supportedIds(user?.id, week?.id),
  ]);
  const team = champion ? await projectTeam(champion.project.id) : [];
  return (
    <main id="main" className="maximalist-home">
      <LiveRefresh />
      <div className="container">
        <section className="hero">
          <div className="hero-top">
            <span className="eyebrow">
              <span className="live-dot" /> A CAMPUS FULL OF POSSIBILITIES
            </span>
            <MotionControl />
          </div>
          <div className="hero-layout">
            <div className="hero-message">
              <span className="poster-kicker">THE NEXT BIG THING IS ALREADY HERE ↗</span>
              <h1>
                <span>What VIT</span>
                <span>
                  is <em className="sr-only">building.</em>
                </span>
                <CurveType />
              </h1>
              <div className="hero-copy">
                <p>
                  The side projects. The big bets. The “what if we actually built this?” Discover
                  what happens after class.
                </p>
                <Link href="/weekly" className="button">
                  Explore this week’s Drop <ArrowUpRight size={20} aria-hidden />
                </Link>
              </div>
            </div>
            <div className="orbit-scene" aria-label="A peek inside the exhibition">
              <div className="scene-parallax">
                <Portal />
                <div className="build-collage">
                  <span className="collage-sticker" aria-hidden>
                    ENTER THE
                    <br />
                    BUILDVERSE
                  </span>
                  <span className="collage-star" aria-hidden>
                    ✳
                  </span>
                  {projects.slice(0, 3).map((project, i) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className={`collage-build collage-build-${i}`}
                      aria-label={`Explore ${project.title}`}
                    >
                      <div className="collage-label">
                        <span>BUILD / 0{i + 1}</span>
                        <ArrowUpRight size={17} aria-hidden />
                      </div>
                      <ProjectArt
                        symbol={project.symbol}
                        color={project.color}
                        title={project.title}
                      />
                      <b>{project.title}</b>
                    </Link>
                  ))}
                  <span className="collage-caption">SIDE PROJECTS. OTHERWORLDLY ENERGY.</span>
                </div>
              </div>
              <span className="scene-coordinate">27° N / INFINITE POSSIBILITIES</span>
            </div>
          </div>
          <div className="hero-bottom">
            <div className="avatar-stack" aria-hidden>
              <span>AR</span>
              <span>AM</span>
              <span>DM</span>
              <span>IS</span>
            </div>
            <span>Made by students. Worth your attention.</span>
          </div>
        </section>
        <div className="ribbon-crossing">
          <div className="ribbon-back" aria-hidden>
            IDEAS ESCAPE THE CLASSROOM ↗ IDEAS ESCAPE THE CLASSROOM
          </div>
          <div className="drop-strip" role="img" aria-label="Built here. Dropped weekly.">
            <div className="ribbon-track" aria-hidden>
              {[0, 1].map((i) => (
                <span key={i}>
                  BUILT HERE <b>✳</b> DROPPED WEEKLY <b>✳</b> VIT, INDIA <b>↗</b>{' '}
                </span>
              ))}
            </div>
          </div>
        </div>
        {champion && (
          <section className="champion-section" data-reveal aria-label="Last week's champion">
            <div className="champion">
              <div className="champion-copy">
                <div className="champion-top">
                  <span className="award-tag">
                    <Trophy size={14} aria-hidden /> LAST WEEK’S CHAMPION
                  </span>
                </div>
                <h2>{champion.project.title}</h2>
                <p>{champion.project.tagline}</p>
                <div className="champion-stats">
                  <span>
                    <ArrowUp size={14} aria-hidden />
                    {champion.count} supports
                  </span>
                  <span>By {team.map((t) => t.name.split(' ')[0]).join(' & ')}</span>
                </div>
                <Link href={`/projects/${champion.project.slug}`} className="text-link">
                  Meet the winning build <ArrowUpRight size={18} aria-hidden />
                </Link>
                <div className="winner-seal" aria-hidden>
                  <span>{champion.period.label.toUpperCase()}</span>
                  <b>01</b>
                  <span>WINNER</span>
                </div>
              </div>
              <Link
                href={`/projects/${champion.project.slug}`}
                aria-label={`View ${champion.project.title}`}
              >
                <ProjectArt
                  symbol={champion.project.symbol}
                  color={champion.project.color}
                  title={champion.project.title}
                  large
                />
              </Link>
            </div>
          </section>
        )}
        <section className="section" data-reveal>
          <SectionTitle
            eyebrow="THE WEEKLY EXHIBITION"
            title="New week. New possibilities."
            href="/weekly"
            label="View the Drop"
          />
          <div className="weekly-home">
            <div>
              <div className="weekly-intro">
                <span className="eyebrow">
                  <span className="live-dot" /> {week?.label.toUpperCase() || 'NEXT DROP SOON'}
                </span>
                <span className="micro">{week && dateRange(week.startsAt, week.endsAt)} · IST</span>
              </div>
              {ranked.slice(0, 4).map((row) => (
                <RankingRow
                  key={row.project.id}
                  row={row}
                  periodId={week.id}
                  supported={supported.includes(row.project.id)}
                />
              ))}
              {!ranked.length && (
                <p>The next exhibition is taking shape. Your build could be in it.</p>
              )}
            </div>
            <aside className="contribute-card">
              <span className="big-asterisk" aria-hidden>
                ✳
              </span>
              <h3>
                You don’t have to
                <br />
                build it alone.
              </h3>
              <p>Your first pull request. Your next collaborator. Find an open door.</p>
              <Link href="/discover?category=Open+Source" className="text-link">
                Find something to contribute to <ArrowUpRight size={17} aria-hidden />
              </Link>
            </aside>
          </div>
        </section>
        <section className="section" data-reveal>
          <SectionTitle eyebrow="FOLLOW YOUR CURIOSITY" title="A little bit of everything." />
          <div className="category-grid">
            {categories.map((c, i) => (
              <Link
                key={c}
                href={`/discover?category=${encodeURIComponent(c)}`}
                className={`category-tile ${['lilac', 'peach', 'lime', 'sky'][i]}`}
              >
                <ArrowUpRight size={22} aria-hidden />
                <span className="category-shape" aria-hidden>
                  {['{ }', '◒', '✳', '↗'][i]}
                </span>
                <h3>{c}</h3>
                <p>{categoryCopy[c]}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="section" data-reveal>
          <SectionTitle
            eyebrow="FROM THE WORKSHOP"
            title="Made with a little obsession."
            href="/discover"
            label="All projects"
          />
          <div className="project-grid">
            {projects
              .filter((p) => p.id !== champion?.project.id)
              .slice(0, 3)
              .map((p) => (
                <ProjectCard project={p} key={p.id} />
              ))}
          </div>
        </section>
        <section className="section" data-reveal>
          <SectionTitle
            eyebrow="GOOD TEAMS START SOMEWHERE"
            title="There’s a seat for you."
            href="/recruit"
            label="All open roles"
          />
          <div className="role-grid">
            {roles.slice(0, 3).map(({ role, project }) => (
              <article className="role-card" key={role.id}>
                <Link href={`/projects/${project.slug}`} className="role-project">
                  <span className={`project-monogram ${project.color}`}>{project.title[0]}</span>
                  {project.title}
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
                <h3>{role.role}</h3>
                <p>{role.description}</p>
                <RoleMeta location={role.location} commitment={role.commitment} />
                <Link href={`/projects/${project.slug}#recruitment`} className="text-link">
                  Explore the opportunity <ArrowRight size={16} aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="section" data-reveal>
          <div className="honors-teaser">
            <div>
              <span className="eyebrow">A LITTLE WELL-DESERVED RECOGNITION</span>
              <h2>
                Good work leaves
                <br />
                <em>a mark.</em>
              </h2>
              <p>
                Weeks become months. Side projects become something more. Meet the builds that
                earned their place.
              </p>
              <Link href="/honors?view=hall" className="text-link">
                Step into the Hall of Fame <ArrowUpRight size={18} aria-hidden />
              </Link>
            </div>
            <div className="award-display">
              <span aria-hidden>✳</span>
              <b>The things we’re proud of.</b>
              <small>PERMANENT HONORS. NO POPULARITY CONTESTS.</small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
