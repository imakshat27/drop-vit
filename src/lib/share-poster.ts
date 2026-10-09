import { shareFormats, type ShareCard, type ShareFormat } from './share-cards';

const ink = '#18151d',
  paper = '#fff9ed',
  lime = '#dcff73',
  lilac = '#c8afff',
  peach = '#ffcab9';
// No remote images/fonts, DOM screenshots, uploads, or server work. Everything is local Canvas.
export async function renderSharePoster(card: ShareCard, format: ShareFormat): Promise<Blob> {
  const { width, height } = shareFormats[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Image export is unavailable in this browser.');
  const dark = card.kind === 'award';
  const fg = dark ? paper : ink;
  c.fillStyle = dark ? ink : card.kind === 'builder' ? lilac : card.kind === 'pick' ? lime : peach;
  c.fillRect(0, 0, width, height);

  function text(value: string, x: number, y: number, size: number, color = fg, weight = '700') {
    c!.font = `${weight} ${size}px Arial, sans-serif`;
    c!.fillStyle = color;
    c!.textBaseline = 'top';
    c!.fillText(value, x, y);
  }
  function line(y: number) {
    c!.strokeStyle = fg;
    c!.lineWidth = 3;
    c!.beginPath();
    c!.moveTo(86, y);
    c!.lineTo(994, y);
    c!.stroke();
  }
  function spark(x: number, y: number, radius: number, color: string, rotation = 0) {
    c!.save();
    c!.translate(x, y);
    c!.rotate(rotation);
    c!.strokeStyle = color;
    c!.lineWidth = 10;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * i) / 4;
      c!.beginPath();
      c!.moveTo(Math.cos(a) * radius * 0.22, Math.sin(a) * radius * 0.22);
      c!.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      c!.stroke();
    }
    c!.restore();
  }
  function wrap(
    value: string,
    x: number,
    y: number,
    maxWidth: number,
    size: number,
    maxLines: number,
    color = fg,
    weight = '700',
    maxHeight = Infinity,
  ) {
    let lines: string[] = [];
    maxLines = Math.max(1, Math.min(maxLines, Math.floor(maxHeight / (24 * 1.08))));
    const words = value.trim().split(/\s+/u);
    for (; size >= 24; size -= 2) {
      c!.font = `${weight} ${size}px Arial, sans-serif`;
      lines = [''];
      for (const word of words) {
        // Split oversized words so long project names cannot leave the canvas.
        let remainder = word;
        const pieces: string[] = [];
        while (c!.measureText(remainder).width > maxWidth) {
          let end = remainder.length;
          while (end > 1 && c!.measureText(remainder.slice(0, end)).width > maxWidth) end--;
          pieces.push(remainder.slice(0, end));
          remainder = remainder.slice(end);
        }
        pieces.push(remainder);
        for (const piece of pieces) {
          const last = lines.length - 1;
          const next = lines[last] ? `${lines[last]} ${piece}` : piece;
          if (c!.measureText(next).width <= maxWidth) lines[last] = next;
          else lines.push(piece);
        }
      }
      if (lines.length <= maxLines && lines.length * size * 1.08 <= maxHeight) break;
    }
    size = Math.max(24, size);
    lines = lines.slice(0, maxLines);
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
      let last = lines.at(-1)!;
      while (c!.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[lines.length - 1] = `${last}…`;
    }
    lines.forEach((value, i) => text(value, x, y + i * size * 1.08, size, color, weight));
    return lines.length * size * 1.08;
  }

  const top = format === 'story' ? 180 : 82;
  const bottom = format === 'story' ? height - 210 : height - 95;
  text('drop', 86, top, 77);
  spark(274, top + 39, 29, dark ? lime : ink);
  text('THE THINGS WE MAKE.', 615, top + 24, 25, fg, '400');
  line(top + 115);
  text(
    card.kind === 'award'
      ? 'EARNED ON DROP'
      : card.kind === 'builder'
        ? 'MEET THE MAKER'
        : card.kind === 'pick'
          ? 'SELECTED BY THE CURATORS'
          : 'IDEAS THAT ESCAPE THE CLASSROOM',
    86,
    top + 147,
    24,
  );

  const artTop = top + 225;
  const artHeight = Math.min(440, height * 0.28);
  c.save();
  c.translate(540, artTop + artHeight / 2);
  c.strokeStyle = fg;
  c.lineWidth = 3;
  c.rotate(-0.19);
  c.beginPath();
  c.ellipse(0, 0, 410, artHeight * 0.4, 0, 0, Math.PI * 2);
  c.stroke();
  c.rotate(0.38);
  c.beginPath();
  c.ellipse(0, 0, 410, artHeight * 0.4, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  c.fillStyle = dark ? lime : card.kind === 'builder' ? paper : lilac;
  c.beginPath();
  c.arc(540, artTop + artHeight / 2, artHeight * 0.45, 0, Math.PI * 2);
  c.fill();
  if (card.kind === 'builder') {
    const initials = card.title
      .split(/\s+/u)
      .slice(0, 2)
      .map((v) => Array.from(v)[0] ?? '')
      .join('')
      .toUpperCase();
    c.font = '900 128px Arial, sans-serif';
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.fillText(initials, 540, artTop + artHeight / 2 - 65);
    c.textAlign = 'left';
  } else spark(540, artTop + artHeight / 2, artHeight * 0.29, ink, Math.PI / 8);
  if (card.kind === 'pick') {
    c.save();
    c.translate(540, artTop + artHeight * 0.76);
    c.rotate(-0.08);
    c.fillStyle = paper;
    c.fillRect(-236, -32, 472, 64);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(-236, -32, 472, 64);
    text('CURATOR PICK', -180, -18, 39, ink);
    c.restore();
  }
  spark(928, artTop + 50, 30, fg);

  const titleY = artTop + artHeight + 42;
  const titleSpace = Math.min(250, (bottom - titleY) * 0.48);
  const titleSize = Math.min(110, titleSpace / 2.2);
  const titleHeight = wrap(card.title, 86, titleY, 908, titleSize, 3, fg, '700', titleSpace);
  const descY = titleY + titleHeight + 25;
  const bodyEnd = format === 'square' ? bottom - 60 : bottom - 200;
  if (card.kind === 'award') {
    const awardHeight = wrap(
      card.distinction || 'Project achievement',
      86,
      descY,
      908,
      42,
      2,
      lime,
      '700',
      Math.max(52, bodyEnd - descY - 35),
    );
    if (card.period) wrap(card.period, 86, descY + awardHeight + 16, 908, 26, 1, paper, '400');
  } else {
    wrap(
      card.description,
      86,
      descY,
      900,
      34,
      format === 'square' ? 2 : 3,
      fg,
      '400',
      Math.max(52, bodyEnd - descY),
    );
  }
  if (format !== 'square') {
    const tagY = bottom - 125;
    let x = 86;
    for (const tag of card.tags.slice(0, 3)) {
      c.font = '700 22px Arial, sans-serif';
      const label = tag.length > 24 ? `${tag.slice(0, 23)}…` : tag;
      const w = c.measureText(label).width + 38;
      if (x + w > 994) break;
      c.fillStyle = dark ? '#302a39' : paper;
      c.fillRect(x, tagY, w, 48);
      text(label, x + 19, tagY + 12, 22);
      x += w + 12;
    }
  }
  line(bottom - 42);
  text('BUILT HERE. DROPPED WEEKLY.', 86, bottom - 17, 22);
  text('droppp.tech ↗', 770, bottom - 17, 25);
  // Export a short, readable address, without ever exposing private account fields.
  const path = card.path.length > 65 ? `${card.path.slice(0, 62)}…` : card.path;
  text(path, 86, bottom + 24, 21, fg, '400');
  if (card.credit && format !== 'square')
    wrap(`BY ${card.credit}`, 86, bottom - 184, 900, 24, 1, fg, '400');

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Couldn’t export this image. Try again.')),
      'image/png',
    ),
  );
}
