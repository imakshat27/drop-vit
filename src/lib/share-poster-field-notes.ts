import { drawBrandMark } from './brand-mark';
import { shareFormats, type ShareCard, type ShareFormat } from './share-cards';

const ink = '#18151d',
  paper = '#fff9ed',
  lime = '#dcff73',
  lilac = '#c8afff',
  peach = '#ffcab9';

/** Field Notes collage posters rendered on the device, with no requests or server CPU. */
export async function renderFieldNotesPoster(card: ShareCard, format: ShareFormat): Promise<Blob> {
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
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.strokeStyle = dark ? '#302936' : '#18151d25';
  c.lineWidth = 1;
  for (let gx = 25; gx < w; gx += 48) {
    c.beginPath();
    c.moveTo(gx, 0);
    c.lineTo(gx, h);
    c.stroke();
  }
  for (let gy = 20; gy < h; gy += 48) {
    c.beginPath();
    c.moveTo(0, gy);
    c.lineTo(w, gy);
    c.stroke();
  }

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

  // Shared identity and the approved Field Notes composition.
  text('drop', 70, top, 76);
  c.font = '700 76px Arial, sans-serif';
  spark(70 + c.measureText('drop').width + 50, top + 38, 28, fg);
  text('FIELD NOTES', 765, top + 25, 24, fg, '700', 'monospace');
  const panelY = top + 143;
  const panelH = square ? 230 : story ? 310 : 275;
  c.fillStyle = paper;
  c.fillRect(58, panelY, 964, panelH);
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.strokeRect(58, panelY, 964, panelH);
  const labels = {
    build: 'THE BUILD',
    builder: 'THE MAKER',
    pick: 'CURATOR PICK',
    award: 'EARNED ON DROP',
  };
  text(labels[card.kind], 86, panelY + 31, 23, ink, '700', 'monospace');
  fit(card.title.toUpperCase(), panelY + 86, 116, 3, panelH - 110, ink);

  const copyY = footer - 192;
  const artStart = panelY + panelH + 58;
  const artEnd = copyY - 140;
  const artH = artEnd - artStart;
  const words =
    card.kind === 'builder'
      ? ['MEET THE', 'MAKER.']
      : card.kind === 'pick'
        ? ['CURATED.', 'FOR YOU.']
        : dark
          ? ['THE WORK', 'GETS SEEN.']
          : ['BUILT', 'BETWEEN', 'LECTURES.'];
  const step = artH / words.length;
  words.forEach((word, i) => {
    c.save();
    c.translate(70 + (i % 2) * 35, artStart + i * step);
    c.rotate(i % 2 ? 0.035 : -0.025);
    c.fillStyle = ink;
    c.fillRect(10, 12, 880, step - 10);
    c.fillStyle = i % 2 ? lilac : paper;
    c.fillRect(0, 0, 880, step - 10);
    let size = Math.min(words.length === 3 ? 99 : 110, step * 0.72);
    c.font = `700 ${size}px Arial, sans-serif`;
    while (c.measureText(word).width > 730) {
      size -= 1;
      c.font = `700 ${size}px Arial, sans-serif`;
    }
    text(word, 26, 13, size, ink);
    c.restore();
  });
  const stampSize = Math.min(117, artH * 0.3);
  c.save();
  c.translate(936, artEnd - stampSize * 0.55);
  c.rotate(0.12);
  c.fillStyle = lime;
  c.fillRect(-stampSize, -stampSize, stampSize * 2, stampSize * 2);
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.strokeRect(-stampSize, -stampSize, stampSize * 2, stampSize * 2);
  spark(0, 0, stampSize * 0.73, ink);
  c.restore();

  const badge =
    card.kind === 'build'
      ? card.tags.slice(0, 2).join(' / ') || 'BUILT BETWEEN LECTURES'
      : labels[card.kind];
  const badgeLabel = badge.length > 40 ? badge.slice(0, 39) + '…' : badge;
  c.font = '700 25px Arial, sans-serif';
  const badgeW = Math.min(880, c.measureText(badgeLabel).width + 44);
  c.save();
  c.translate(83, copyY - 105);
  c.rotate(-0.045);
  c.fillStyle = ink;
  c.fillRect(9, 11, badgeW, 65);
  c.fillStyle = dark ? lime : peach;
  c.fillRect(0, 0, badgeW, 65);
  c.strokeStyle = ink;
  c.lineWidth = 3;
  c.strokeRect(0, 0, badgeW, 65);
  text(badgeLabel, 22, 19, 25, ink);
  c.restore();
  fit(
    dark ? card.distinction || card.description : card.description,
    copyY,
    dark ? 34 : 30,
    3,
    99,
    fg,
    '400',
  );
  const meta = dark
    ? card.period
    : card.credit
      ? `BY ${card.credit.toUpperCase()}`
      : card.tags.join(' / ');
  if (meta) fit(meta, footer - 98, 21, 2, 48, fg, '400');
  rule(footer - 53);
  text('BUILT HERE. DROPPED WEEKLY.', 70, footer - 30, 20, fg, '700', 'monospace');
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
