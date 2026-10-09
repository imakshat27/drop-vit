import { BrandSpark } from '@/components/brand-spark';
import { categoryCopy, type Category } from '@/lib/constants';
export function WeeklyIntro() {
  return (
    <div className="page-head split">
      <div>
        <span className="eyebrow">A NEW EXHIBITION. EVERY MONDAY.</span>
        <h1>
          The Weekly <em>Drop.</em>
        </h1>
        <p>
          Big ideas, small teams, and things that actually shipped. Take a look around. Back the
          builds you believe in.
        </p>
      </div>
      <span className="header-shape" aria-hidden>
        ↗
      </span>
    </div>
  );
}
export function DiscoverIntro({ valid }: { valid: string }) {
  return (
    <div className="page-head split">
      <div>
        <span className="eyebrow">THE CAMPUS WORKSHOP</span>
        <h1>{valid === 'All' ? 'Follow your curiosity.' : valid}</h1>
        <p>
          {valid === 'All'
            ? 'Side projects, fresh launches, and ideas with legs. Every build here has been reviewed by our curators.'
            : categoryCopy[valid as Category]}{' '}
          {valid === 'Open Source' &&
            'Find an approachable issue, a useful tool, or your next contribution.'}
        </p>
      </div>
      <span className="header-shape" aria-hidden>
        {valid === 'Open Source' ? '{ }' : <BrandSpark className="brand-mark" />}
      </span>
    </div>
  );
}
export function RecruitIntro() {
  return (
    <div className="page-head split">
      <div>
        <span className="eyebrow">YOUR NEXT TEAM IS BUILDING SOMETHING</span>
        <h1>
          A seat <em>at the table.</em>
        </h1>
        <p>
          Find a project you believe in, then find your part in it. Real builds, clear expectations,
          and a chance to make something together.
        </p>
      </div>
      <span className="header-shape" aria-hidden>
        +
      </span>
    </div>
  );
}
export function HonorsIntro({ hall = false }: { hall?: boolean }) {
  return (
    <div className="page-head split">
      <div>
        <span className="eyebrow">GOOD WORK LEAVES A MARK</span>
        <h1>
          {hall ? (
            <>
              The Hall <em>of Fame.</em>
            </>
          ) : (
            <>
              A place <em>well earned.</em>
            </>
          )}
        </h1>
        <p>
          {hall
            ? 'The builds that became a little bigger than a side project. Their place here is permanent.'
            : 'Weekly champions. Monthly standouts. Lasting recognition for projects that deserve it.'}
        </p>
      </div>
      <span className="header-shape" aria-hidden>
        <BrandSpark className="brand-mark" />
      </span>
    </div>
  );
}
