/** Solid eight-spoke brand mark, independent of platform glyph rendering. */
export function BrandSpark() {
  return (
    <svg
      className="brand-spark"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32 3v58M3 32h58M11.5 11.5l41 41M11.5 52.5l41-41"
        stroke="currentColor"
        strokeWidth="7"
      />
    </svg>
  );
}
