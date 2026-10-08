export function Portal() {
  return (
    <svg className="portal-sculpture" viewBox="0 0 640 640" fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id="portal-metal"
          x1="90"
          y1="70"
          x2="520"
          y2="580"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFF1AE" />
          <stop offset=".18" stopColor="#FFAE63" />
          <stop offset=".4" stopColor="#FF5F28" />
          <stop offset=".54" stopColor="#9C2206" />
          <stop offset=".7" stopColor="#FF8A4C" />
          <stop offset=".88" stopColor="#FFC89F" />
          <stop offset="1" stopColor="#E54A15" />
        </linearGradient>
        <linearGradient
          id="portal-inner"
          x1="205"
          y1="160"
          x2="400"
          y2="450"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#541C10" />
          <stop offset=".36" stopColor="#B2330E" />
          <stop offset=".7" stopColor="#FFB888" />
          <stop offset="1" stopColor="#FFEDC2" />
        </linearGradient>
        <radialGradient id="portal-ball">
          <stop stopColor="#FAFFC3" />
          <stop offset=".3" stopColor="#CAFF5C" />
          <stop offset=".75" stopColor="#719E13" />
          <stop offset="1" stopColor="#2A3A10" />
        </radialGradient>
      </defs>
      <g className="portal-core">
        <path
          fillRule="evenodd"
          d="M317 50C477 43 589 178 585 320C581 463 471 591 316 590C159 589 55 462 55 322C55 179 157 58 317 50ZM318 190C244 190 192 246 193 321C194 395 246 449 318 449C390 449 443 394 442 320C441 246 388 190 318 190Z"
          fill="url(#portal-metal)"
        />
        <path
          d="M318 190C244 190 192 246 193 321C194 395 246 449 318 449C390 449 443 394 442 320C441 246 388 190 318 190ZM318 219C375 219 416 263 416 321C416 379 375 422 318 422C261 422 219 379 219 321C219 263 261 219 318 219Z"
          fill="url(#portal-inner)"
          fillRule="evenodd"
        />
        <path
          d="M92 264C109 155 187 81 292 72"
          stroke="#FFE7C8"
          strokeWidth="7"
          strokeLinecap="round"
          opacity=".6"
        />
        <path
          d="M558 357C535 472 449 555 341 567"
          stroke="#6A210D"
          strokeWidth="10"
          strokeLinecap="round"
          opacity=".4"
        />
      </g>
      <g className="portal-orbit">
        <ellipse
          cx="320"
          cy="320"
          rx="310"
          ry="92"
          stroke="#FFFAEA"
          strokeWidth="3"
          transform="rotate(-33 320 320)"
        />
        <circle cx="568" cy="157" r="28" fill="url(#portal-ball)" />
        <circle cx="72" cy="479" r="10" fill="#FFFAEA" />
      </g>
    </svg>
  );
}

export function CurveType() {
  return (
    <svg className="curve-type" viewBox="0 0 720 180" aria-hidden="true">
      <defs>
        <path id="build-curve" d="M12 100 Q355 190 705 90" />
      </defs>
      <text
        fill="currentColor"
        fontSize="148"
        fontWeight="900"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-10"
      >
        <textPath href="#build-curve" startOffset="50%" textAnchor="middle">
          building.
        </textPath>
      </text>
    </svg>
  );
}
