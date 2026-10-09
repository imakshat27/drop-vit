import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Local art-direction studies only. Not imported by the app or deployed.
const folder = resolve('.data/share-explorations');
await mkdir(folder, { recursive: true });
const cards = [
  {
    kind: 'build',
    title: 'Patchwork',
    body: 'Your first open-source contribution, minus the overwhelm.',
    meta: 'ARJUN MEHTA + TEAM',
    tags: 'TYPESCRIPT / NEXT.JS',
    path: '/projects/patchwork',
  },
  {
    kind: 'builder',
    title: 'Ananya Rao',
    body: 'Making useful things between lectures. Design, code, and a little curiosity.',
    meta: 'REACT / DESIGN / TYPESCRIPT',
    tags: 'MEET THE MAKER',
    path: '/builders/ananya',
  },
  {
    kind: 'pick',
    title: 'Patchwork',
    body: 'Your first open-source contribution, minus the overwhelm.',
    meta: 'SELECTED BY THE CURATORS',
    tags: 'CURATOR PICK',
    path: '/projects/patchwork',
  },
  {
    kind: 'award',
    title: 'Sample Project',
    body: 'Example award',
    meta: 'SAMPLE / NOT A REAL RESULT',
    tags: 'EARNED ON DROP',
    path: '/projects/sample-project',
  },
];
const directions = [
  {
    id: 'signal',
    name: '01 / SIGNAL',
    description: 'Oversized type. Strong contrast. A poster that holds its own in a feed.',
  },
  {
    id: 'flow',
    name: '02 / FLOW',
    description: 'Sweeping curves. Flat colours. A softer, sculptural direction.',
  },
  {
    id: 'field-notes',
    name: '03 / FIELD NOTES',
    description: 'Campus zine. Layered paper, stamps and a little organised chaos.',
  },
];
function draw({ card, direction }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const c = canvas.getContext('2d');
  const ink = '#18151d',
    paper = '#fff9ed',
    peach = '#ffcab9',
    lilac = '#c8afff',
    lime = '#dcff73';
  const dark = card.kind === 'award',
    colour = dark ? ink : card.kind === 'builder' ? lilac : card.kind === 'pick' ? lime : peach;
  const fg = dark ? paper : ink;
  const labels = {
    build: 'THE BUILD',
    builder: 'THE MAKER',
    pick: 'CURATOR PICK',
    award: 'EARNED ON DROP',
  };
  function rect(x, y, w, h, fill) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
  }
  function text(value, x, y, size, fill = ink, weight = 700, family = 'Arial') {
    c.font = `${weight} ${size}px ${family}`;
    c.fillStyle = fill;
    c.textBaseline = 'top';
    c.fillText(value, x, y);
  }
  function spark(x, y, r, fill, line = r * 0.14) {
    c.strokeStyle = fill;
    c.lineWidth = line;
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 4;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      c.stroke();
    }
  }
  function logo(x, y, fill = ink) {
    text('drop', x, y, 76, fill);
    c.font = '700 76px Arial';
    spark(x + c.measureText('drop').width + 50, y + 38, 28, fill, 7);
  }
  function wrap(
    value,
    x,
    y,
    maxWidth,
    size,
    fill = ink,
    weight = 700,
    family = 'Arial',
    maxLines = 3,
  ) {
    let lines;
    do {
      c.font = `${weight} ${size}px ${family}`;
      lines = [''];
      for (const word of value.split(/\s+/)) {
        const i = lines.length - 1,
          next = lines[i] ? lines[i] + ' ' + word : word;
        if (c.measureText(next).width <= maxWidth) lines[i] = next;
        else lines.push(word);
      }
      if (lines.length <= maxLines) break;
      size -= 2;
    } while (size > 24);
    lines
      .slice(0, maxLines)
      .forEach((line, i) => text(line, x, y + i * size * 1.06, size, fill, weight, family));
    return Math.min(lines.length, maxLines) * size * 1.06;
  }
  function rule(y, fill = ink) {
    rect(70, y, 940, 2, fill);
  }
  function badge(label, x, y, w, bg, rotation = 0) {
    c.save();
    c.translate(x, y);
    c.rotate(rotation);
    rect(9, 11, w, 65, ink);
    rect(0, 0, w, 65, bg);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(0, 0, w, 65);
    text(label, 22, 19, 25);
    c.restore();
  }
  function footer(fill = ink) {
    rule(1200, fill);
    text('BUILT HERE. DROPPED WEEKLY.', 70, 1223, 20, fill, 700, 'monospace');
    text('droppp.tech ↗', 795, 1220, 25, fill);
    text(card.path, 70, 1260, 22, fill, 400);
  }
  rect(0, 0, 1080, 1350, colour);
  if (direction === 'signal') {
    logo(70, 64, fg);
    text(labels[card.kind], 740, 90, 23, fg, 700, 'monospace');
    rule(174, fg);
    const titleH = wrap(
      card.title,
      65,
      224,
      950,
      card.kind === 'award' ? 116 : card.kind === 'builder' ? 140 : 172,
      fg,
      700,
      'Arial',
      2,
    );
    wrap(card.body, 70, 245 + titleH, 850, dark ? 44 : 34, dark ? lime : ink, 400, 'Arial', 3);
    const panelY = 625;
    rect(0, panelY, 1080, 530, dark ? lilac : ink);
    c.save();
    c.beginPath();
    c.rect(0, panelY, 1080, 530);
    c.clip();
    if (card.kind === 'builder') {
      text('AR', 58, 680, 325, paper);
      spark(815, 865, 200, lilac, 29);
      text('CURIOUS BY DEFAULT.', 70, 1050, 28, paper, 700, 'monospace');
    } else if (card.kind === 'award') {
      spark(540, 879, 225, ink, 38);
    } else {
      text(card.kind === 'pick' ? 'GOOD' : 'IDEAS', 56, 682, 208, paper);
      text(card.kind === 'pick' ? 'FIND.' : 'OUT.', 56, 883, 208, paper);
      spark(865, 904, 190, card.kind === 'pick' ? lime : peach, 28);
    }
    c.restore();
    c.save();
    c.translate(540, 598);
    c.rotate(-0.065);
    rect(-570, -37, 1140, 74, dark ? lime : lilac);
    text(card.meta, -469, -12, 26);
    c.restore();
    footer(fg);
  } else if (direction === 'flow') {
    // Flat, intersecting sculptural bands; the logo remains untouched.
    rect(0, 0, 1080, 1350, dark ? ink : paper);
    logo(70, 64, fg);
    text(labels[card.kind], 740, 89, 23, fg, 700, 'monospace');
    rule(176, fg);
    const titleH = wrap(card.title, 70, 221, 940, 135, fg, 700, 'Arial', 2);
    wrap(card.body, 70, 235 + titleH, 900, dark ? 43 : 34, dark ? lime : ink, 400, 'Arial', 3);
    const zone = 590;
    c.save();
    c.beginPath();
    c.rect(0, zone, 1080, 530);
    c.clip();
    function band(path, fill, width) {
      c.beginPath();
      path();
      c.strokeStyle = fill;
      c.lineWidth = width;
      c.lineCap = 'round';
      c.stroke();
    }
    band(
      () => {
        c.moveTo(-120, 1060);
        c.bezierCurveTo(120, 680, 340, 1120, 530, 830);
        c.bezierCurveTo(760, 500, 890, 570, 1170, 730);
      },
      dark ? lilac : colour,
      210,
    );
    band(
      () => {
        c.moveTo(-180, 720);
        c.bezierCurveTo(140, 1020, 290, 580, 580, 1040);
        c.bezierCurveTo(750, 1280, 1000, 870, 1150, 950);
      },
      dark ? peach : lilac,
      185,
    );
    band(
      () => {
        c.moveTo(-40, 1110);
        c.bezierCurveTo(310, 950, 350, 570, 650, 750);
        c.bezierCurveTo(970, 970, 1040, 610, 1150, 610);
      },
      dark ? lime : ink,
      55,
    );
    c.lineCap = 'butt';
    c.save();
    c.translate(810, 900);
    c.rotate(0.15);
    rect(-160, -140, 320, 280, dark ? ink : paper);
    c.strokeStyle = dark ? paper : ink;
    c.lineWidth = 3;
    c.strokeRect(-160, -140, 320, 280);
    if (card.kind === 'builder') text('AR', -114, -74, 134, fg);
    else spark(0, 0, 105, dark ? lime : ink, 17);
    c.restore();
    c.restore();
    text(card.meta, 70, 1142, 23, fg, 700, 'monospace');
    footer(fg);
  } else {
    // A tidy underlying grid makes the collage's odd angles intentional.
    rect(0, 0, 1080, 1350, dark ? ink : colour);
    c.strokeStyle = dark ? '#302936' : '#18151d25';
    c.lineWidth = 1;
    for (let x = 25; x < 1080; x += 48) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 1350);
      c.stroke();
    }
    for (let y = 20; y < 1350; y += 48) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(1080, y);
      c.stroke();
    }
    logo(70, 64, fg);
    text('FIELD NOTES', 765, 89, 24, fg, 700, 'monospace');
    rect(58, 207, 964, 275, paper);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(58, 207, 964, 275);
    text(labels[card.kind], 86, 238, 23, ink, 700, 'monospace');
    wrap(card.title, 82, 293, 900, 116, ink, 700, 'Arial', 1);
    // Main cut-out uses separate bands with a small alternating tilt.
    const words =
      card.kind === 'builder'
        ? ['MEET THE', 'MAKER.']
        : card.kind === 'pick'
          ? ['CURATED.', 'FOR YOU.']
          : card.kind === 'award'
            ? ['THE WORK', 'GETS SEEN.']
            : ['BUILT', 'BETWEEN', 'LECTURES.'];
    const start = 540,
      step = words.length === 3 ? 129 : 176;
    words.forEach((word, i) => {
      c.save();
      c.translate(70 + (i % 2) * 35, start + i * step);
      c.rotate(i % 2 ? 0.035 : -0.025);
      rect(10, 12, 880, step - 10, ink);
      rect(0, 0, 880, step - 10, i % 2 ? lilac : paper);
      text(word, 26, 13, words.length === 3 ? 99 : 110, ink);
      c.restore();
    });
    c.save();
    c.translate(936, 838);
    c.rotate(0.12);
    rect(-117, -117, 234, 234, lime);
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.strokeRect(-117, -117, 234, 234);
    spark(0, 0, 86, ink, 15);
    c.restore();
    badge(card.tags, 83, 978, card.kind === 'build' ? 475 : 363, dark ? lime : peach, -0.045);
    wrap(card.body, 70, 1083, 930, dark ? 34 : 30, fg, 400, 'Arial', 2);
    text(card.meta, 70, 1165, 19, fg, 700, 'monospace');
    footer(fg);
  }
  return canvas.toDataURL('image/png').split(',')[1];
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1560, height: 750 } });
  const rows = [];
  for (const direction of directions) {
    const images = [];
    for (const card of cards) {
      const base64 = await page.evaluate(draw, { card, direction: direction.id });
      await writeFile(
        resolve(folder, `${direction.id}-${card.kind}.png`),
        Buffer.from(base64, 'base64'),
      );
      images.push(
        `<figure><figcaption>${card.kind.toUpperCase()}</figcaption><img alt="${direction.name} ${card.kind} poster, fictional sample" src="data:image/png;base64,${base64}"></figure>`,
      );
    }
    const row = `<section><h1>${direction.name}</h1><p>${direction.description} <span>Fictional examples.</span></p><div class="cards">${images.join('')}</div></section>`;
    rows.push(row);
    await page.setContent(html(row));
    await page.screenshot({
      path: resolve(folder, `${direction.id}-overview.png`),
      fullPage: true,
    });
  }
  const gallery = html(rows.join(''));
  await writeFile(resolve(folder, 'index.html'), gallery);
  console.log(`Local previews: ${folder}`);
} finally {
  await browser.close();
}
function html(content) {
  return `<!doctype html><html><head><meta charset="UTF-8"><title>Drop / share card explorations</title><style>body{margin:0;background:#fff9ed;color:#18151d;font-family:Arial,sans-serif}section{padding:28px 32px 38px}h1{font-size:28px;margin:0 0 9px}p{font-size:17px;margin:0 0 24px}p span{opacity:.65;margin-left:12px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}figure{margin:0;min-width:0}figcaption{font-size:12px;font-weight:700;margin-bottom:12px}img{width:100%;display:block} @media(max-width:850px){.cards{grid-template-columns:repeat(2,1fr)}}</style></head><body>${content}</body></html>`;
}
