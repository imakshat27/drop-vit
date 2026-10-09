import { BRAND_MARK_PATH, BRAND_MARK_STROKE } from '@/lib/brand-mark';
/** Solid eight-spoke brand mark, independent of platform glyph rendering. */
export function BrandSpark({ className = 'brand-spark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <path d={BRAND_MARK_PATH} stroke="currentColor" strokeWidth={BRAND_MARK_STROKE} />
    </svg>
  );
}
