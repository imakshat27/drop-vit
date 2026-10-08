export function Portal() {
  return (
    <svg className="portal-sculpture" viewBox="0 0 640 640" fill="none" aria-hidden="true">
      <g className="portal-core">
        <path
          className="matte-flower"
          d="M320 28L359 116L427 54L429 151L519 113L482 204L579 202L516 277L610 320L516 359L579 430L482 429L519 524L429 482L427 581L359 516L320 610L279 516L211 581L210 482L115 524L156 429L58 430L124 359L29 320L124 277L58 202L156 204L115 113L210 151L211 54L279 116Z"
          fill="#DBFF76"
          stroke="#17151C"
          strokeWidth="3"
        />
        <circle cx="320" cy="320" r="155" fill="#17151C" />
        {[70, 90, 110, 130].map((r) => (
          <circle
            key={r}
            className="echo-ring"
            cx="320"
            cy="320"
            r={r}
            stroke="#DBFF76"
            strokeWidth="2"
          />
        ))}
        <path d="M281 280L361 360M361 280L281 360" stroke="#FFF9ED" strokeWidth="18" />
      </g>
      <g className="portal-orbit">
        <ellipse
          cx="320"
          cy="320"
          rx="308"
          ry="208"
          stroke="#17151C"
          strokeWidth="3"
          strokeDasharray="8 9"
          transform="rotate(-33 320 320)"
        />
        <circle cx="568" cy="137" r="28" fill="#FFF9ED" stroke="#17151C" strokeWidth="3" />
        <path d="M46 460H99M72 434V486" stroke="#17151C" strokeWidth="6" />
      </g>
      <g className="scribble-loop" stroke="#17151C" strokeWidth="3" strokeLinecap="round">
        <path d="M160 510C-100 330 666 89 590 370C512 641 58 601 131 184C199-200 591 201 420 550" />
      </g>
    </svg>
  );
}

export function CurveType() {
  return (
    <span className="kinetic-word" aria-hidden="true">
      {'building.'.split('').map((letter, i) => (
        <span className="kinetic-glyph" key={i} style={{ animationDelay: `${i * -0.22}s` }}>
          <span>{letter}</span>
        </span>
      ))}
    </span>
  );
}
