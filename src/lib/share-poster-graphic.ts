import { drawBrandMark } from './brand-mark';
import { shareFormats, type ShareCard, type ShareFormat } from './share-cards';

const ink = '#18151d',
  paper = '#fff9ed',
  lime = '#dcff73',
  lilac = '#c8afff',
  peach = '#ffcab9';

/** Flow and Signal posters rendered on the device, with no requests or server CPU. */
export async function renderGraphicPoster(
  card: ShareCard,
  format: ShareFormat,
  edition: 'flow' | 'signal',
): Promise<Blob> {
  const { width: w, height: h } = shareFormats[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Image export is unavailable in this browser.');
  const dark = card.kind === 'award';
  const fg = dark ? paper : ink;
  const bg = dark ? ink : card.kind === 'builder' ? lilac : card.kind === 'pick' ? lime : peach;
  const story = format === 'story',
    square = format === 'square';
  const x = 76,
    right = w - x,
    top = story ? 170 : 70,
    footer = h - (story ? 210 : 75);
  c.fillStyle = edition === 'flow' && !dark ? paper : bg;
  c.fillRect(0, 0, w, h);
  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    color = fg,
    weight = '700',
    font = 'Arial',
  ) {
    c!.font = `${weight} ${size}px ${font}, sans-serif`;
    c!.textBaseline = 'top';
    c!.fillStyle = color;
    c!.fillText(value, x, y);
  }
  function rule(y: number, color = fg) {
    c!.strokeStyle = color;
    c!.lineWidth = 2;
    c!.beginPath();
    c!.moveTo(x, y);
    c!.lineTo(right, y);
    c!.stroke();
  }
  function spark(cx: number, cy: number, r: number, color: string) {
    drawBrandMark(c!, cx, cy, r, color);
  }
  function fit(
    value: string,
    y: number,
    size: number,
    maxLines: number,
    height: number,
    color = fg,
    weight = '700',
    maxWidth = right - x,
  ) {
    // Word wrapping plus long-token splitting, bounded in both axes for every format.
    let rows: string[] = [];
    const input = value.trim().split(/\s+/u);
    const minimum = Math.min(26, size);
    for (; size >= minimum; size -= 2) {
      c!.font = `${weight} ${size}px Arial, sans-serif`;
      rows = [''];
      for (const word of input) {
        let rest = word;
        const chunks: string[] = [];
        while (c!.measureText(rest).width > maxWidth) {
          let end = rest.length;
          while (end > 1 && c!.measureText(rest.slice(0, end)).width > maxWidth) end--;
          chunks.push(rest.slice(0, end));
          rest = rest.slice(end);
        }
        chunks.push(rest);
        for (const chunk of chunks) {
          const i = rows.length - 1;
          const next = rows[i] ? `${rows[i]} ${chunk}` : chunk;
          if (c!.measureText(next).width <= maxWidth) rows[i] = next;
          else rows.push(chunk);
        }
      }
      if (rows.length <= maxLines && rows.length * size * 1.05 <= height) break;
    }
    size = Math.max(minimum, size);
    const limit = Math.max(1, Math.min(maxLines, Math.floor(height / (size * 1.05))));
    if (rows.length > limit) {
      rows = rows.slice(0, limit);
      let tail = rows.at(-1)!;
      while (tail && c!.measureText(tail + '…').width > maxWidth) tail = tail.slice(0, -1);
      rows[rows.length - 1] = tail + '…';
    }
    rows.forEach((row, i) => text(row, x, y + size * 1.05 * i, size, color, weight));
    return rows.length * size * 1.05;
  }

  text('drop', x, top, 76);
  c.font = '700 76px Arial, sans-serif';
  spark(x + c.measureText('drop').width + 50, top + 38, 28, fg);
  const label = {
    build: 'THE BUILD',
    builder: 'THE MAKER',
    pick: 'CURATOR PICK',
    award: 'EARNED ON DROP',
  }[card.kind];
  text(label, 740, top + 26, 23, fg, '700', 'monospace');
  rule(top + 110);
  const titleY = top + 155;
  const titleH = fit(
    card.title.toUpperCase(),
    titleY,
    edition === 'signal' ? 158 : 130,
    3,
    square ? 170 : 260,
  );
  const descriptionY = titleY + titleH + 22;
  const descriptionH = fit(
    dark ? card.distinction || card.description : card.description,
    descriptionY,
    dark ? 40 : 32,
    square ? 2 : 3,
    square ? 80 : 120,
    dark ? lime : fg,
    '400',
  );
  const artTop = descriptionY + descriptionH + 32;
  const metaY = footer - 108;
  const artBottom = metaY - 30;
  const artH = Math.max(0, artBottom - artTop);
  const cy = artTop + artH / 2;
  c.save();
  c.beginPath();
  c.rect(0, artTop, w, artH);
  c.clip();
  if (edition === 'signal') {
    c.fillStyle = dark ? lilac : ink;
    c.fillRect(0, artTop, w, artH);
    const panelFg = dark ? ink : paper;
    if (card.kind === 'award') {
      spark(540, cy, Math.min(220, artH * 0.37), ink);
    } else if (card.kind === 'builder') {
      const initials = card.title
        .replace(/^\[Demo\]\s*/iu, '')
        .split(/\s+/u)
        .slice(0, 2)
        .map((v) => Array.from(v)[0] || '')
        .join('')
        .toUpperCase();
      text(initials, 70, cy - artH * 0.28, Math.min(300, artH * 0.56), panelFg);
      spark(850, cy, Math.min(180, artH * 0.35), lilac);
    } else {
      const words = card.kind === 'pick' ? ['GOOD', 'FIND.'] : ['IDEAS', 'OUT.'];
      const size = Math.min(200, artH * 0.34);
      text(words[0], 70, cy - size, size, paper);
      text(words[1], 70, cy + 8, size, paper);
      spark(860, cy + artH * 0.14, Math.min(180, artH * 0.36), card.kind === 'pick' ? lime : peach);
    }
    c.save();
    c.translate(540, artTop + 30);
    c.rotate(-0.045);
    c.fillStyle = dark ? lime : lilac;
    c.fillRect(-560, -27, 1120, 54);
    text(
      card.kind === 'builder'
        ? 'CURIOUS BY DEFAULT.'
        : card.kind === 'pick'
          ? 'SELECTED BY THE CURATORS'
          : dark
            ? 'THE WORK GETS SEEN.'
            : 'IDEAS THAT ESCAPE THE CLASSROOM',
      -464,
      -13,
      24,
      ink,
      '700',
      'monospace',
    );
    c.restore();
  } else {
    // Curves scale into a clipped artwork zone, never into the title or caption.
    c.translate(0, artTop);
    c.scale(1, artH / 530);
    function band(points: number[], color: string, width: number) {
      c!.beginPath();
      c!.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 6)
        c!.bezierCurveTo(
          points[i],
          points[i + 1],
          points[i + 2],
          points[i + 3],
          points[i + 4],
          points[i + 5],
        );
      c!.strokeStyle = color;
      c!.lineWidth = width;
      c!.lineCap = 'round';
      c!.stroke();
    }
    band(
      [-120, 470, 120, 90, 340, 530, 530, 240, 760, -90, 890, -20, 1170, 140],
      dark ? lilac : bg,
      210,
    );
    band(
      [-180, 130, 140, 430, 290, -10, 580, 450, 750, 690, 1000, 280, 1150, 360],
      dark ? peach : lilac,
      185,
    );
    band(
      [-40, 520, 310, 360, 350, -20, 650, 160, 970, 380, 1040, 20, 1150, 20],
      dark ? lime : ink,
      55,
    );
    c.restore();
    c.save();
    c.beginPath();
    c.rect(0, artTop, w, artH);
    c.clip();
    c.translate(810, cy + artH * 0.07);
    c.rotate(0.15);
    const side = Math.min(270, artH * 0.66);
    c.fillStyle = dark ? ink : paper;
    c.fillRect(-side / 2, -side / 2, side, side);
    c.strokeStyle = fg;
    c.lineWidth = 3;
    c.strokeRect(-side / 2, -side / 2, side, side);
    spark(0, 0, side * 0.34, dark ? lime : ink);
  }
  c.restore();
  const meta = dark
    ? card.period
    : card.credit
      ? `BY ${card.credit.toUpperCase()}`
      : card.tags.join(' / ');
  if (meta) fit(meta, metaY, 22, 2, 50, fg, '400');
  rule(footer - 53);
  text('BUILT HERE. DROPPED WEEKLY.', x, footer - 30, 20, fg, '700', 'monospace');
  text('droppp.tech ↗', 795, footer - 30, 25, fg);
  fit(card.path, footer + 9, 22, 1, 30, fg, '400');
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Couldn’t export this image. Try again.')),
      'image/png',
    ),
  );
}
