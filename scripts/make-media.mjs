// Marketplace に出すサムネイルとギャラリー画像を作る。
//
// なぜ生成するか: 画面を手で撮って並べると、直すたびに撮り直しになる。
// プラグイン本体と同じ描画器（bin/draw.js）でキーを描けば、実物と必ず一致し、
// 見た目を変えたときは走らせ直すだけで済む。
//
// SVG から PNG にするのは、手元の Chrome を画面なしで動かして撮る。
// 画像変換の道具を入れずに済み、見えるものがそのまま出る。
//
// 規格: サムネイル・ギャラリーとも 1920×960 PNG。

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { watchImage, badTargetImage } from '../com.kanade0525.serverwatch.sdPlugin/bin/draw.js';
import { STATUS } from '../com.kanade0525.serverwatch.sdPlugin/bin/watch-state.js';

const OUT = 'media';
const TMP = join(OUT, '.work');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const W = 1920, H = 960;
const BG = '#0e1114';
const INK = '#e8f0e8';
const MUTED = '#79838d';

/** キー1枚。実物と同じ描画器を使う */
const HIST = [120, 90, 140, 110, 130, 100, 124];
const key = (v, px = 200) => {
  const svg = v === null
    ? badTargetImage()
    : watchImage({ status: STATUS.up, name: '', lastMs: 100, history: HIST, ...v });
  return `<div class="key" style="width:${px}px;height:${px}px">${svg}</div>`;
};

const page = (body, extra = '') => `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${W}px; height: ${H}px; background: ${BG}; color: ${INK};
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
  }
  .key svg { width: 100%; height: 100%; display: block; }
  .key { border-radius: 14%; overflow: hidden; }
  .stage { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .inner { width: 1500px; }
  h1 { font-size: 86px; font-weight: 700; letter-spacing: -1.5px; }
  h2 { font-size: 52px; font-weight: 600; letter-spacing: -0.5px; }
  p  { font-size: 30px; color: ${MUTED}; line-height: 1.5; font-weight: 400; }
  .cap { font-size: 24px; color: ${MUTED}; margin-top: 18px; font-weight: 500; }
  .row { display: flex; align-items: center; }
  ${extra}
</style>
${body}`;

// ---- 1. サムネイル ----
const thumbnail = page(`
<div class="stage"><div class="inner row" style="gap:120px">
  <div style="flex-shrink:0">${key({ status: STATUS.up, name: 'api-prod', lastMs: 124 }, 330)}</div>
  <div>
    <h1>Server Watch</h1>
    <p style="margin-top:30px;font-size:38px;max-width:860px;line-height:1.4">
      Green when your server is up, red when it is down. Press the key to open your console.
    </p>
  </div>
</div></div>`);

// ---- 2. 色で分かる ----
const states = [
  { v: { status: STATUS.up, name: 'api-prod', lastMs: 124 }, cap: 'Up' },
  { v: { status: STATUS.suspect, name: 'api-prod', lastMs: null, history: [...HIST, null] }, cap: 'Failing, not confirmed' },
  { v: { status: STATUS.down, name: 'api-prod', lastMs: null, downFor: 5 * 60_000, history: [...HIST, null, null, null] }, cap: 'Down for 5 minutes' },
];
const colors = page(`
<div class="stage"><div class="inner">
  <h2>You read it by color</h2>
  <p style="margin-top:20px">A single failure will not turn it red. Only repeated failures do — three by default.</p>
  <div class="row" style="gap:96px;margin-top:80px;justify-content:center">
    ${states.map((s) => `<div style="text-align:center">
      ${key(s.v, 250)}
      <div class="cap">${s.cap}</div>
    </div>`).join('')}
  </div>
</div></div>`);

// ---- 3. 入れるのは二つだけ ----
const setup = page(`
<div class="stage"><div class="inner">
  <h2>Two fields, nothing else</h2>
  <div class="row" style="gap:100px;margin-top:64px;align-items:stretch">
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#57d08a;margin-bottom:26px">SERVER TO WATCH</div>
      <p style="font-size:30px;color:${INK}">https://example.com</p>
      <p style="margin-top:22px">An https:// URL checks the response, host:port opens a TCP connection,
      a bare host name sends a ping.</p>
    </div>
    <div style="width:1px;background:#252b31"></div>
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#4aa8ff;margin-bottom:26px">CONSOLE TO OPEN (OPTIONAL)</div>
      <p style="font-size:30px;color:${INK}">https://lightsail.aws.amazon.com/…</p>
      <p style="margin-top:22px">Pressing the key opens this page, so the thing you check next
      is on the same key.</p>
    </div>
  </div>
</div></div>`);

// ---- 4. 履歴を持っている ----
const history = page(`
<div class="stage"><div class="inner row" style="gap:150px">
  <div style="flex-shrink:0">${key({
    status: STATUS.up, name: 'api-prod', lastMs: 138,
    history: [120, 90, 140, 110, 900, 130, null, null, 160, 124, 138],
  }, 360)}</div>
  <div>
    <h2>It keeps watching</h2>
    <p style="margin-top:24px;max-width:700px">
      The plugin checks on its own schedule, so the key carries the recent response times —
      including the moments it failed. The line breaks where a check did not come back.
    </p>
  </div>
</div></div>`);

// ---- 5. 通信について ----
const privacy = page(`
<div class="stage"><div class="inner">
  <h2>It only talks to your server</h2>
  <div class="row" style="gap:100px;margin-top:64px;align-items:stretch">
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#57d08a;margin-bottom:26px">WHERE IT CONNECTS</div>
      <p style="font-size:30px;color:${INK}">The address you entered.</p>
      <p style="margin-top:22px">Nothing is contacted until you set one.</p>
    </div>
    <div style="width:1px;background:#252b31"></div>
    <div style="flex:1">
      <div style="font-size:30px;font-weight:700;color:#ff5f56;margin-bottom:26px">WHERE IT NEVER CONNECTS</div>
      <p style="font-size:30px;color:${INK}">Anywhere else.</p>
      <p style="margin-top:22px">Results stay on this machine. The source is public on GitHub.</p>
    </div>
  </div>
</div></div>`);

// ---- 書き出し ----
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });

const pages = [
  ['thumbnail', thumbnail],
  ['gallery-1-colors', colors],
  ['gallery-2-setup', setup],
  ['gallery-3-history', history],
  ['gallery-4-privacy', privacy],
];

for (const [name, html] of pages) {
  const src = join(TMP, `${name}.html`);
  writeFileSync(src, html);
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--hide-scrollbars',
    `--screenshot=${join(OUT, `${name}.png`)}`,
    `--window-size=${W},${H}`,
    `--virtual-time-budget=1500`,
    src,
  ], { stdio: 'ignore' });
  console.log(`撮った: ${OUT}/${name}.png`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${pages.length}枚。すべて ${W}×${H}`);
