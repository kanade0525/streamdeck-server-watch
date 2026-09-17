// キーに出す絵。72×72 の SVG を文字列で組み立てる。
//
// 色で状態を出すのがこの道具の主眼なので、数字は補助に置く。
// 透明度に頼らず色そのもので描くのは、このレンダラが opacity をどこまで
// 解釈するか確かめていないため（Combo Counter で同じ判断をしている）。

import { STATUS } from './watch-state.js';

const BG = '#14181c';
const INK = '#e8f0e8';
const MUTED = '#79838d';

// 状態ごとの色。下地・線・文字を一組にして、どの状態でも読める濃さにそろえてある
const SKIN = {
  [STATUS.up]:      { ground: '#16241c', line: '#57d08a', text: '#e8f0e8', label: '#57d08a' },
  [STATUS.suspect]: { ground: '#2a2416', line: '#ffa94d', text: '#e8f0e8', label: '#ffa94d' },
  [STATUS.down]:    { ground: '#2c1719', line: '#ff5f56', text: '#ffffff', label: '#ff5f56' },
  [STATUS.idle]:    { ground: BG,        line: '#3a444e', text: MUTED,     label: MUTED },
};

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// 72×72 は狭い。どこに何を置くかを先に決めて、帯が重ならないようにする。
// 目で見ずに数字を入れると必ず重なるので、scripts/preview.mjs で実寸を確かめること。
const BAND = {
  rule: 3.5,      // 上端の色の帯
  name: 15,       // 名前の基準線
  status: 40,     // UP / DOWN の基準線
  sub: 52,        // 応答時間・落ちている時間の基準線
  sparkTop: 58,   // 推移の線はここから下だけを使う
  sparkBottom: 68,
};

// 左右に 6px ずつ余白を残す。端に着いた文字は窮屈に見えるし、
// キーの丸みに食い込んで読みにくくなる
const INNER_W = 60;

/**
 * 表示名。幅に収まるところまで字を小さくし、それでも余るなら詰める。
 * Helvetica の太字は 1文字あたりおおよそ 0.56em なので、それで測る。
 */
const fitName = (name) => {
  const raw = String(name ?? '').trim();
  if (!raw) return { text: '', size: 0 };
  for (const size of [9.5, 8.5, 7.5]) {
    if (raw.length * size * 0.56 <= INNER_W) return { text: raw, size };
  }
  const max = Math.max(4, Math.floor(INNER_W / (7.5 * 0.56)) - 1);
  return { text: `${raw.slice(0, max)}…`, size: 7.5 };
};

/** 応答時間の推移。失敗した回は下まで落とし、線を切って描く */
const sparkline = (history, color) => {
  const points = history.slice(-20);
  if (points.length < 2) return '';
  const values = points.filter((v) => v !== null);
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const x = (i) => 8 + (56 * i) / (points.length - 1);
  const span = BAND.sparkBottom - BAND.sparkTop;
  const y = (v) => BAND.sparkBottom - span * (v / max);

  // 失敗で切れる線にする。繋いでしまうと、落ちていた事実が絵から消える
  const segments = [];
  let current = [];
  points.forEach((v, i) => {
    if (v === null) {
      if (current.length > 1) segments.push(current);
      current = [];
    } else {
      current.push(`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    }
  });
  if (current.length > 1) segments.push(current);

  const fails = points
    .map((v, i) => (v === null
      ? `<rect x="${(x(i) - 1).toFixed(1)}" y="${BAND.sparkBottom - 2}" width="2" height="2.5" fill="${color}"/>`
      : ''))
    .join('');

  return segments.map((s) => `<polyline points="${s.join(' ')}" fill="none" stroke="${color}" stroke-width="1.6"
    stroke-linejoin="round" stroke-linecap="round"/>`).join('') + fails;
};

/** 落ちている時間。監視ツールでよくある書き方にそろえる（5m / 2h 3m / 3d） */
export const downDuration = (ms) => {
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h ${min % 60}m`;
  const day = Math.floor(hour / 24);
  return `${day}d ${hour % 24}h`;
};

/** 応答時間の書き方 */
const latency = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

/**
 * キー1枚。監視ツールの見せ方にそろえてある。
 *   上段  … 名前
 *   中央  … UP / DOWN の状態
 *   その下… 応答時間、または落ちている時間
 *   最下段… 応答時間の推移
 *
 * 状態の言葉を大きく出すのは、色が見分けにくい人にも状態が伝わるようにするため。
 */
export const watchImage = (v) => {
  const skin = SKIN[v.status] ?? SKIN[STATUS.idle];
  const name = fitName(v.name);

  let status = 'UP';
  let sub = v.lastMs === null ? '' : latency(v.lastMs);
  if (v.status === STATUS.idle) { status = '—'; sub = ''; }
  else if (v.status === STATUS.down) { status = 'DOWN'; sub = downDuration(v.downFor ?? 0); }
  // 疑いの間は UP のまま色だけ黄にする。まだ落ちたと決まっていない

  // DOWN は4文字あるので、UP と同じ大きさだと端に着く。
  // 0.62em で見積もって、左右の余白が残る大きさにする
  const statusSize = status === 'DOWN' ? 17 : 23;
  const subSize = sub.length >= 6 ? 9.5 : 11;
  const font = 'Helvetica, Arial, sans-serif';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${skin.ground}"/>
  <rect x="0" y="0" width="72" height="${BAND.rule}" rx="${BAND.rule / 2}" fill="${skin.line}"/>
  ${name.text ? `<text x="36" y="${BAND.name}" text-anchor="middle" font-family="${font}"
        font-size="${name.size}" font-weight="600" fill="${skin.label}">${esc(name.text)}</text>` : ''}
  <text x="36" y="${BAND.status}" text-anchor="middle" font-family="${font}"
        font-size="${statusSize}" font-weight="700" fill="${skin.text}">${status}</text>
  ${sub ? `<text x="36" y="${BAND.sub}" text-anchor="middle" font-family="${font}"
        font-size="${subSize}" font-weight="500" fill="${skin.label}">${esc(sub)}</text>` : ''}
  ${sparkline(v.history ?? [], skin.line)}
</svg>`;
};

/** 監視対象の書き方がおかしい時 */
export const badTargetImage = () => `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${BG}"/>
  <path d="M36 20 L50 46 H22 Z" fill="none" stroke="#ffa94d" stroke-width="3" stroke-linejoin="round"/>
  <rect x="35" y="29" width="2" height="9" rx="1" fill="#ffa94d"/>
  <rect x="35" y="40" width="2" height="2.6" rx="1" fill="#ffa94d"/>
  <text x="36" y="62" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="9" fill="${MUTED}">check target</text>
</svg>`;

export const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
