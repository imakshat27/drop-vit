/** The single eight-spoke Drop mark used by HTML, particles and exported posters. */
export const BRAND_MARK_PATH = 'M32 3v58M3 32h58M11.5 11.5l41 41M11.5 52.5l41-41';
export const BRAND_MARK_STROKE = 7;
export function drawBrandMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.scale(radius / 29, radius / 29);
  context.translate(-32, -32);
  context.strokeStyle = color;
  context.lineWidth = BRAND_MARK_STROKE;
  context.lineCap = 'butt';
  context.stroke(new Path2D(BRAND_MARK_PATH));
  context.restore();
}
export function createBrandMarkElement() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', BRAND_MARK_PATH);
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', String(BRAND_MARK_STROKE));
  svg.append(path);
  return svg;
}
