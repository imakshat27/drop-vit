import { shareFormats, type ShareCard, type ShareFormat } from './share-cards';

const ink = '#18151d',
  paper = '#fff9ed',
  lime = '#dcff73',
  lilac = '#c8afff',
  peach = '#ffcab9';

/** Print-inspired posters rendered on the device, with no requests or server CPU. */
export async function renderRemixPoster(card: ShareCard, format: ShareFormat): Promise<Blob> {
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
  function spark(cx: number, cy: number, r: number, color: string, stroke = r * 0.15) {
    c!.strokeStyle = color;
    c!.lineWidth = stroke;
    c!.lineCap = 'butt';
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 4;
      c!.beginPath();
      c!.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
      c!.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c!.stroke();
    }
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

  // Logo clear space is measured from the text, never guessed from its position.
  text('drop', x, top, 74);
  c.font = '700 74px Arial, sans-serif';
  spark(x + c.measureText('drop').width + 22 + 27, top + 38, 27, dark ? lime : ink, 7);
  text('BUILT HERE.', 775, top + 17, 23, fg, '700', 'monospace');
  text('DROPPED WEEKLY.', 775, top + 47, 20, fg, '400', 'monospace');
  rule(top + 105);
  const label = {
    build: 'A BUILD WORTH A LOOK',
    builder: 'THE PEOPLE BEHIND THE IDEAS',
    pick: 'CURATOR SELECT / FEATURED BUILD',
    award: 'RECOGNITION / EARNED ON DROP',
  }[card.kind];
  text(label, x, top + 134, 23, fg, '700', 'monospace');
  const titleY = top + 190;
  const titleBudget = square ? 180 : story ? 300 : 235;
  const titleHeight = fit(card.title, titleY, square ? 112 : 136, 3, titleBudget);
  const descY = titleY + titleHeight + 24;
  const descBudget = square ? 95 : 130;
  let descHeight: number;
  if (dark) {
    descHeight = fit(card.distinction || 'Project achievement', descY, 43, 3, descBudget, lime);
    if (card.period)
      descHeight += 18 + fit(card.period, descY + descHeight + 18, 25, 2, 65, paper, '400');
  } else descHeight = fit(card.description, descY, 33, square ? 2 : 3, descBudget, ink, '400');

  const artY = descY + descHeight + 40;
  const artEnd = footer - (square ? 115 : 200);
  const artH = Math.max(115, artEnd - artY);
  c.save();
  // Clip decorative artwork to its own area, keeping all actual copy unobscured.
  c.beginPath();
  c.rect(0, artY, w, Math.max(0, artEnd - artY));
  c.clip();
  const cy = artY + artH / 2;
  if (card.kind === 'build') {
    // A stack of oversized sheets: the work leaving the workshop.
    c.translate(535, cy);
    c.rotate(-0.13);
    c.fillStyle = lilac;
    c.fillRect(-435, -artH * 0.36, 865, artH * 0.76);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(-435, -artH * 0.36, 865, artH * 0.76);
    c.rotate(0.23);
    c.fillStyle = paper;
    c.fillRect(-405, -artH * 0.33, 810, artH * 0.65);
    c.strokeRect(-405, -artH * 0.33, 810, artH * 0.65);
    text('IDEAS OUT.', -360, -artH * 0.22, Math.min(88, artH * 0.24), ink);
    text('WORLD IN.', -360, artH * 0.03, Math.min(88, artH * 0.24), ink);
    spark(317, artH * 0.05, Math.min(100, artH * 0.23), ink);
  } else if (card.kind === 'builder') {
    // Maker ID, with a clean monogram and oversized print typography.
    c.translate(540, cy);
    c.rotate(-0.055);
    c.fillStyle = ink;
    c.fillRect(-455, -artH * 0.36 + 14, 910, artH * 0.72);
    c.fillStyle = paper;
    c.fillRect(-465, -artH * 0.36, 910, artH * 0.72);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(-465, -artH * 0.36, 910, artH * 0.72);
    const initials = card.title
      .replace(/^\[Demo\]\s*/u, '')
      .split(/\s+/u)
      .slice(0, 2)
      .map((s) => Array.from(s)[0] || '')
      .join('')
      .toUpperCase();
    text(initials, -422, -artH * 0.25, Math.min(185, artH * 0.47), ink);
    text('MAKER', -100, -artH * 0.17, Math.min(95, artH * 0.25), ink);
    text(
      'CURIOUS BY DEFAULT.',
      -93,
      artH * 0.1,
      Math.min(25, artH * 0.09),
      ink,
      '400',
      'monospace',
    );
    spark(350, artH * 0.17, Math.min(65, artH * 0.15), ink);
  } else if (card.kind === 'pick') {
    // A curator's selection ticket rather than an invented ranking badge.
    c.translate(540, cy);
    c.rotate(-0.09);
    c.fillStyle = ink;
    c.fillRect(-435, -artH * 0.35 + 18, 888, artH * 0.7);
    c.fillStyle = lilac;
    c.fillRect(-450, -artH * 0.35, 888, artH * 0.7);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(-450, -artH * 0.35, 888, artH * 0.7);
    text('GOOD', -408, -artH * 0.26, Math.min(136, artH * 0.33), ink);
    text('FIND.', -408, artH * 0.04, Math.min(136, artH * 0.33), ink);
    spark(267, 0, Math.min(150, artH * 0.32), ink);
    c.setLineDash([7, 10]);
    c.beginPath();
    c.moveTo(80, -artH * 0.3);
    c.lineTo(80, artH * 0.3);
    c.stroke();
    c.setLineDash([]);
  } else {
    // A sculptural solid asterisk with a ribbon wrapping across its base.
    spark(540, cy - artH * 0.07, Math.min(290, artH * 0.42), lime, Math.min(47, artH * 0.075));
    c.translate(540, cy + artH * 0.22);
    c.rotate(-0.065);
    c.fillStyle = lilac;
    c.fillRect(-470, -40, 940, 80);
    text('THE WORK SPEAKS FOR ITSELF.', -405, -19, 33, ink);
  }
  c.restore();

  if (!square) {
    if (card.credit) fit(`BY ${card.credit}`, footer - 178, 25, 1, 30, fg, '400');
    let tx = x;
    for (const tag of card.tags.slice(0, 3)) {
      const label = tag.length > 25 ? tag.slice(0, 24) + '…' : tag;
      c.font = '700 22px Arial, sans-serif';
      const tw = c.measureText(label).width + 32;
      if (tx + tw > right) break;
      c.fillStyle = dark ? lilac : ink;
      c.fillRect(tx, footer - 125, tw, 43);
      text(label, tx + 16, footer - 115, 22, dark ? ink : paper);
      tx += tw + 12;
    }
  }
  rule(footer - 53);
  text('THE THINGS WE MAKE.', x, footer - 31, 22, fg, '700', 'monospace');
  text('droppp.tech ↗', 770, footer - 31, 26);
  fit(card.path, footer + 9, 22, 1, 30, fg, '400');
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Couldn’t export this image. Try again.')),
      'image/png',
    ),
  );
}
