import { ArrowUpRight, Code2, Command, Layers, MousePointer2, Plus, Search } from 'lucide-react';
export function ProjectArt({
  symbol,
  color,
  title,
  large = false,
}: {
  symbol: string;
  color: string;
  title: string;
  large?: boolean;
}) {
  return (
    <div
      className={`project-art ${color} ${large ? 'large' : ''}`}
      role="img"
      aria-label={`${title} — illustrated project preview`}
    >
      <div className="art-grain" />
      {symbol === 'custom' ? (
        <div className="custom-art">
          <span className="custom-project-glyph" aria-hidden>
            {title.slice(0, 1)}
          </span>
          <b>{title}</b>
          <small>MADE HERE. DROPPED HERE.</small>
        </div>
      ) : symbol === 'canvas' ? (
        <div className="canvas-demo">
          <div className="canvas-top">
            <span>
              <span className="mini-mark">c.</span> canvas club
            </span>
            <span>
              our next big thing <ArrowUpRight size={13} />
            </span>
          </div>
          <div className="canvas-grid">
            <span className="scribble-line" />
            <div className="sticky sticky-one">
              <small>THE BIG IDEA</small>
              <b>
                What if we
                <br />
                built this?
              </b>
              <span className="draw-star">✳</span>
            </div>
            <div className="sticky sticky-two">
              <small>STEP 01</small>
              <b>
                Make it
                <br />a little real.
              </b>
              <div className="sticky-check">✓</div>
            </div>
            <span className="cursor-label">
              <MousePointer2 size={15} fill="currentColor" /> Ananya
            </span>
            <div className="canvas-toolbar">
              <MousePointer2 size={15} />
              <Plus size={15} />
              <Layers size={15} />
              <span>Aa</span>
            </div>
          </div>
        </div>
      ) : symbol === 'patch' ? (
        <div className="patch-art">
          <div className="patch-word">
            patch<span>work</span>
            <span className="patch-flower">✳</span>
          </div>
          <div className="code-window">
            <div className="code-dots">
              <i />
              <i />
              <i />
              <span>your-first-pr.ts</span>
            </div>
            <p>
              <span className="code-purple">const</span> firstStep = &#123;
              <br />
              &nbsp; curious: <span className="code-green">true</span>,<br />
              &nbsp; experience: <span className="code-orange">&quot;not required&quot;</span>
              <br />
              &#125;;
            </p>
            <div className="code-bottom">
              <Code2 size={14} /> Good first issues <b>→</b>
            </div>
          </div>
          <span className="floating-label">every contribution counts ↗</span>
        </div>
      ) : symbol === 'orbit' ? (
        <div className="orbit-art">
          <span className="orbit-ring r1" />
          <span className="orbit-ring r2" />
          <span className="orbit-ring r3" />
          <div className="orbit-center">
            a<span>h</span>
          </div>
          <span className="orbit-caption">
            good things happen
            <br />
            <b>after hours.</b>
          </span>
          <span className="orbit-person op1">dm</span>
          <span className="orbit-person op2">as</span>
        </div>
      ) : symbol === 'folio' ? (
        <div className="folio-art">
          <div className="folio-paper">
            <small>ISHAAN SHAH / SELECTED WORK</small>
            <h3>
              A little code.
              <br />
              <em>A lot of care.</em>
            </h3>
            <div className="folio-shapes">
              <span />
              <span />
              <span />
            </div>
            <div className="folio-caption">
              01 / THE THINGS I MAKE <ArrowUpRight size={16} />
            </div>
          </div>
        </div>
      ) : symbol === 'chip' ? (
        <div className="chip-art">
          <div className="chip">
            <span>
              tiny
              <br />
              <b>ML</b>
            </span>
          </div>
          <small>SMALL BOARD. BIG IDEAS.</small>
        </div>
      ) : symbol === 'tabs' ? (
        <div className="tabs-art">
          <div className="browser-tabs">
            <i />
            <i />
            <i />
          </div>
          <div className="tabs-inner">
            <Command size={28} />
            <h3>
              A little less
              <br />
              <em>everything.</em>
            </h3>
            <span>3 workspaces. One clear mind.</span>
          </div>
        </div>
      ) : symbol === 'meal' ? (
        <div className="meal-art">
          <div className="plate">
            <span />
            <span />
            <span />
          </div>
          <b>
            Good food.
            <br />
            <em>Less waste.</em>
          </b>
        </div>
      ) : (
        <div className="signal-art">
          <div className="signal-wave" />
          <h3>
            something
            <br />
            <em>is happening.</em>
          </h3>
          <span>
            <Search size={16} /> Find your next thing
          </span>
        </div>
      )}
    </div>
  );
}
