// キーの絵を実寸で書き出して、目で確かめるための道具。
// 72×72 は小さく、文字は簡単にはみ出す。コードだけ見て判断しない。
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { watchImage, badTargetImage } from '../com.kanade0525.serverwatch.sdPlugin/bin/draw.js';
import { STATUS } from '../com.kanade0525.serverwatch.sdPlugin/bin/watch-state.js';

const OUT = 'preview';
const TMP = join(OUT, '.work');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const hist = [120, 90, 140, 110, 130, 100, 124];

const cases = [
  ['up', { status: STATUS.up, name: 'api-prod', lastMs: 124, history: hist }],
  ['up-slow', { status: STATUS.up, name: 'kanade0525.github.io', lastMs: 2400, history: hist }],
  ['up-noname', { status: STATUS.up, name: '', lastMs: 8, history: hist }],
  ['suspect', { status: STATUS.suspect, name: 'tsubu', lastMs: null, history: [...hist, null] }],
  ['down-min', { status: STATUS.down, name: 'tsubu', lastMs: null, downFor: 5 * 60_000, history: [...hist, null, null, null] }],
  ['down-hour', { status: STATUS.down, name: 'db-primary', lastMs: null, downFor: 90 * 60_000, history: [null, null, null] }],
  ['down-day', { status: STATUS.down, name: 'old-box', lastMs: null, downFor: 26 * 3600_000, history: [null, null] }],
  ['idle', { status: STATUS.idle, name: '', lastMs: null, history: [] }],
  ['bad', null],
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// キーを並べて1枚に。実寸(72)と、細部を見るための拡大(216)を並べる
const tiles = cases.map(([name, v]) => {
  const svg = v ? watchImage(v) : badTargetImage();
  return `<div class="tile">
    <div class="k" style="width:72px;height:72px">${svg}</div>
    <div class="k" style="width:216px;height:216px">${svg}</div>
    <div class="cap">${name}</div>
  </div>`;
}).join('');

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin:0; padding:24px; background:#3a3f45;
         font:12px -apple-system,Helvetica,Arial,sans-serif; color:#cfd6dd; }
  .grid { display:flex; flex-wrap:wrap; gap:26px; }
  .tile { display:flex; flex-direction:column; align-items:center; gap:10px; }
  .k svg { width:100%; height:100%; display:block; }
  .cap { color:#98a2ab; }
</style><div class="grid">${tiles}</div>`;

const src = join(TMP, 'preview.html');
writeFileSync(src, html);
execFileSync(CHROME, ['--headless', '--disable-gpu', '--hide-scrollbars',
  `--screenshot=${join(OUT, 'keys.png')}`, '--window-size=1500,1100',
  '--virtual-time-budget=1200', src], { stdio: 'ignore' });
rmSync(TMP, { recursive: true, force: true });
console.log(`${OUT}/keys.png に書き出した`);
