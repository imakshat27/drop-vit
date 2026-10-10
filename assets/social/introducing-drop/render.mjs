import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const folder = fileURLToPath(new URL('.', import.meta.url));
const source = await readFile(new URL('../../../src/lib/brand-mark.ts', import.meta.url), 'utf8');
const path = source.match(/BRAND_MARK_PATH = '([^']+)'/)[1];
const mark = (color = 'currentColor', cls = '') =>
  `<svg class="${cls}" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="${path}" stroke="${color}" stroke-width="7"/></svg>`;
const logo = `<span class="wordmark">drop</span>${mark('#dbff76')}`;
const styles = `
*{box-sizing:border-box}html,body{margin:0;font-family:Arial,Helvetica,sans-serif}body{width:1080px;height:1350px;background:#000;color:#fff;overflow:hidden}
:root{--lime:#dbff76;--lilac:#c6b0ff;--cream:#fff9ed;--ink:#000}
.canvas{position:relative;width:1080px;height:1350px;padding:60px;overflow:hidden}
.brand{display:inline-flex;align-items:center;gap:14px;line-height:1;color:inherit}.brand svg{width:58px;height:58px}.wordmark{font-size:82px;font-weight:800;letter-spacing:-6.5px;line-height:1}
.topline{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid currentColor;padding-bottom:30px}.mono{font-family:'Courier New',monospace;font-size:23px;font-weight:700;letter-spacing:1px;line-height:1.3}.topline .mono{text-align:right}
h1{margin:0;font-weight:900;letter-spacing:-9px;line-height:.92}.foot{position:absolute;left:60px;right:60px;bottom:55px;display:flex;align-items:center;justify-content:space-between;border-top:2px solid currentColor;padding-top:24px}.foot strong{font-size:35px;letter-spacing:-1px}.arrow{width:40px;height:40px;flex-shrink:0}
.intro h1{font-size:139px;margin-top:58px}.intro h1 span{color:var(--lime)}.intro .invite{position:absolute;left:60px;right:60px;top:805px;background:var(--lime);color:#000;padding:30px 34px 38px;border:3px solid #000;box-shadow:12px 12px 0 var(--lilac)}
.invite .mono{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:15px}.invite h2{font-size:83px;line-height:1;margin:26px 0 19px;letter-spacing:-4px}.invite p{font-size:33px;line-height:1.3;margin:0;max-width:730px}.invite svg{position:absolute;right:30px;bottom:46px;width:100px;height:100px}
.weekly{background:var(--lilac);color:#000}.weekly .brand svg path{stroke:#000}.weekly h1{font-size:132px;margin-top:40px;letter-spacing:-8px}.weekly .underline{display:inline-block;background:#000;color:var(--lime);padding:5px 17px 17px;margin-top:8px;transform:rotate(-2deg)}
.steps{margin-top:38px}.step{display:grid;grid-template-columns:84px 1fr;gap:20px;border-top:2px solid #000;padding:20px 0 20px}.step .num{font-family:'Courier New',monospace;font-weight:700;font-size:44px;line-height:1}.step h2{font-size:43px;margin:0 0 9px;letter-spacing:-1.5px;line-height:1.1}.step p{font-size:29px;line-height:1.25;max-width:760px;margin:0}.weekly .join{margin-top:5px;display:flex;justify-content:space-between;align-items:center;padding:20px 25px;background:var(--lime);border:3px solid #000;box-shadow:8px 8px 0 #000}.join .mono{font-size:20px}.join strong{font-size:28px;letter-spacing:-1px}
.avatar{width:1080px;height:1080px;background:#000;display:flex;justify-content:center;align-items:center}.avatar .brand{gap:27px;transform:translateY(-10px)}.avatar .wordmark{font-size:238px;letter-spacing:-19px}.avatar .brand svg{width:175px;height:175px;margin-top:25px}
`;
const benefitsStyles = `
.benefits{background:var(--lime);color:#000}.benefits .brand svg path{stroke:#000}
.benefits h1{font-size:104px;letter-spacing:-6px;margin-top:28px;line-height:.93}
.benefits .perks{margin-top:28px}.perk{display:grid;grid-template-columns:80px 1fr;gap:18px;padding:16px 0;border-top:2px solid #000}
.perk .num{font-family:'Courier New',monospace;font-size:36px;font-weight:700;line-height:1.2}
.perk h2{font-size:42px;line-height:1;margin:0 0 12px;letter-spacing:-1.5px}
.perk p{font-size:29px;line-height:1.25;margin:0}
.perk.guest{margin-top:5px;background:#000;color:#fff;padding:20px 22px;box-shadow:8px 8px 0 var(--lilac)}
.guest .num{color:var(--lime)}.guest h2{color:var(--lime)}
`;
const arrow =
  '<svg class="arrow" viewBox="0 0 40 40" fill="none"><path d="M8 32L32 8M8 8h24v24" stroke="currentColor" stroke-width="3.5"/></svg>';
const document = (body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1080, initial-scale=1"><title>Drop / Instagram introduction</title><style>${styles}${benefitsStyles}</style></head><body>${body}</body></html>`;
const designs = [
  [
    'drop-instagram-logo-1080x1080',
    1080,
    `<div class="avatar"><div class="brand">${logo}</div></div>`,
  ],
  [
    '01-meet-drop-1080x1350',
    1350,
    `<article class="canvas intro"><header class="topline"><div class="brand">${logo}</div><div class="mono">INDEPENDENT STUDENT COMMUNITY<br>VIT EDITION / 001</div></header><h1>YOUR SIDE<br>PROJECT<br>IS THE<br><span>MAIN EVENT.</span></h1><section class="invite"><div class="mono"><span>INTRODUCING</span><span>BUILT BETWEEN LECTURES</span></div><h2>MEET DROP.</h2><p>A curated home for what VIT is building.<br>Discover projects. Meet the builders.<br>Put your work out there.</p>${mark('#000')}</section><footer class="foot"><span class="mono">LESS SCROLLING.<br>MORE BUILDING.</span><strong>droppp.tech</strong>${arrow}</footer></article>`,
  ],
  [
    '02-the-weekly-drop-1080x1350',
    1350,
    `<article class="canvas weekly"><header class="topline"><div class="brand">${logo}</div><div class="mono">THE WEEKLY EXHIBITION<br>HOW IT WORKS / 002</div></header><h1>BUILT HERE.<br>DROPPED<br><span class="underline">WEEKLY.</span></h1><section class="steps"><div class="step"><span class="num">01</span><div><h2>Make something real.</h2><p>A project. An open-source contribution. A startup.<br>Something worth putting out into the world.</p></div></div><div class="step"><span class="num">02</span><div><h2>Submit it to Drop.</h2><p>Curators review each build. Approved projects<br>join an upcoming weekly exhibition.</p></div></div><div class="step"><span class="num">03</span><div><h2>Back the work you love.</h2><p>Explore the lineup. Support the builds.<br>Celebrate the standouts in Honors.</p></div></div></section><footer class="foot"><span class="mono">VIT BUILDERS.<br>GOOGLE SIGN-IN.</span><strong>droppp.tech</strong>${arrow}</footer></article>`,
  ],
];
designs.push([
  '03-whats-in-it-for-you-1080x1350',
  1350,
  `<article class="canvas benefits"><header class="topline"><div class="brand">${logo}</div><div class="mono">FOR THE BUILDERS<br>WHY DROP? / 003</div></header><h1>WHAT’S<br>IN IT<br>FOR YOU?</h1><section class="perks"><div class="perk"><span class="num">01</span><div><h2>GET YOUR WORK SEEN.</h2><p>Put your build in front of students who care<br>about what you’re making.</p></div></div><div class="perk"><span class="num">02</span><div><h2>FIND YOUR PEOPLE.</h2><p>Meet fellow builders. Find collaborators.<br>Bring the right people into your next project.</p></div></div><div class="perk"><span class="num">03</span><div><h2>BUILD A TRACK RECORD.</h2><p>Compete for weekly recognition. Earn Honors.<br>Share your work and the wins behind it.</p></div></div><div class="perk guest"><span class="num">04</span><div><h2>HELP SHAPE THE NEXT DROP.</h2><p>Standout builders may be invited to guest-curate<br>a future edition. Bring your taste to the lineup.</p></div></div></section><footer class="foot"><span class="mono">YOU BUILD.<br>WE MAKE ROOM.</span><strong>droppp.tech</strong>${arrow}</footer></article>`,
]);
const browser = await chromium.launch();
try {
  for (const [name, height, body] of designs) {
    const html = document(body);
    await writeFile(folder + name + '.html', html);
    const page = await browser.newPage({ viewport: { width: 1080, height }, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: folder + name + '.png' });
    console.log(`${name}.png exported`);
    await page.close();
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><title>Drop — white wordmark and neon green mark on black</title><rect width="1080" height="1080" fill="#000"/><text x="203" y="603" font-family="Arial,Helvetica,sans-serif" font-size="238" font-weight="800" letter-spacing="-19" fill="#fff">drop</text><g transform="translate(707 458) scale(2.734375)" fill="none" stroke="#dbff76" stroke-width="7"><path d="${path}"/></g></svg>`;
  await writeFile(folder + 'drop-instagram-logo.svg', svg);
  const page = await browser.newPage({ viewport: { width: 1600, height: 880 } });
  const gallery = `<!doctype html><html><head><title>Drop / launch kit</title></head><body style="margin:0;background:#ece6da;display:flex;gap:25px;padding:40px;align-items:center"><img style="width:330px" src="drop-instagram-logo-1080x1080.png"/><img style="width:550px" src="01-meet-drop-1080x1350.png"/><img style="width:550px" src="02-the-weekly-drop-1080x1350.png"/></body></html>`;
  await writeFile(folder + 'preview.html', gallery);
  await page.goto('file://' + folder + 'preview.html');
  await page.screenshot({ path: folder + 'preview.png' });
  await page.close();
} finally {
  await browser.close();
}
