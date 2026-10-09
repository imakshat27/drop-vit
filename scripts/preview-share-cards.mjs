import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Reproducible fictional previews from the same renderer the app ships.
const folder = resolve('.data/share-previews');
await mkdir(folder, { recursive: true });
const result = await build({
  entryPoints: ['src/lib/share-poster.ts'],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'DropPosters',
  platform: 'browser',
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 740 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    '<html><body style="margin:0;background:#fff9ed;font-family:Arial;color:#18151d"><h1 style="margin:32px;font-size:30px">Drop / made to be shared.</h1><p style="margin:0 32px 24px">Fictional sample content · exported by the actual browser renderer</p><div id="cards" style="display:flex;gap:20px;padding:0 32px"></div></body></html>',
  );
  await page.addScriptTag({ content: result.outputFiles[0].text });
  const buildCard = {
    kind: 'build',
    title: 'Patchwork',
    description: 'Your first open-source contribution, minus the overwhelm.',
    credit: 'Arjun Mehta and team',
    path: '/projects/patchwork',
    tags: ['TypeScript', 'Next.js', 'GitHub API'],
  };
  const cards = [
    buildCard,
    {
      kind: 'builder',
      title: 'Ananya Rao',
      description: 'Making useful things between lectures. Design, code, and a little curiosity.',
      path: '/builders/ananya',
      tags: ['React', 'Design', 'TypeScript'],
    },
    { ...buildCard, kind: 'pick', distinction: 'Curator pick' },
    {
      kind: 'award',
      title: 'Sample Project',
      description: 'Fictional award illustration. No real award is claimed.',
      path: '/projects/sample-project',
      tags: [],
      distinction: 'Example award',
      period: 'SAMPLE · NOT A REAL RESULT',
    },
  ];
  for (const card of cards) {
    for (const format of ['portrait', 'story', 'square']) {
      const base64 = await page.evaluate(
        async ({ card, format }) => {
          const blob = await window.DropPosters.renderSharePoster(card, format);
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });
        },
        { card, format },
      );
      await writeFile(resolve(folder, `${card.kind}-${format}.png`), Buffer.from(base64, 'base64'));
      if (format === 'portrait')
        await page.evaluate(
          ({ base64, kind }) => {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'flex:1;min-width:0';
            const label = document.createElement('p');
            label.textContent = kind.toUpperCase();
            label.style.cssText = 'font-size:13px;font-weight:700';
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${base64}`;
            img.style.cssText = 'width:100%;border-radius:4px';
            wrap.append(label, img);
            document.querySelector('#cards').append(wrap);
          },
          { base64, kind: card.kind },
        );
    }
  }
  await page.screenshot({ path: resolve(folder, 'overview.png'), fullPage: true });
  await writeFile(resolve(folder, 'index.html'), await page.content());
  console.log(`Share previews: ${folder}`);
} finally {
  await browser.close();
}
