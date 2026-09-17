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

/** 表示名。長いと読めないので詰める */
const fitName = (name) => {
  const s = String(name ?? '').trim();
  if (s.length <= 12) return s;
  return `${s.slice(0, 11)}…`;
};

/** 応答時間の推移。失敗した回は下まで落とし、線を切って描く */
const sparkline = (history, color) => {
  const points = history.slice(-20);
  if (points.length < 2) return '';
  const values = points.filter((v) => v !== null);
  if (values.length === 0) return '';
  const max = Math.max(...values, 1);
  const x = (i) => 8 + (56 * i) / (points.length - 1);
  const y = (v) => 62 - 12 * (v / max);

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
    .map((v, i) => (v === null ? `<rect x="${(x(i) - 1).toFixed(1)}" y="61" width="2" height="3" fill="${color}"/>` : ''))
    .join('');

  return segments.map((s) => `<polyline points="${s.join(' ')}" fill="none" stroke="${color}" stroke-width="1.6"
    stroke-linejoin="round" stroke-linecap="round"/>`).join('') + fails;
};

/** 落ちている時間。何回失敗したかより、どれだけ落ちているかの方が知りたい */
export const downDuration = (ms) => {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;
  return `${Math.floor(hour / 24)}d`;
};

/** 真ん中に出す値。正常なら応答時間、異常なら落ちている時間 */
const centerText = (v) => {
  if (v.status === STATUS.idle) return '—';
  if (v.status === STATUS.down) return `DOWN ${downDuration(v.downFor ?? 0)}`;
  if (v.lastMs === null) return `…${v.consecutiveFailures}`;
  return v.lastMs >= 1000 ? `${(v.lastMs / 1000).toFixed(1)}s` : `${v.lastMs}ms`;
};

export const watchImage = (v) => {
  const skin = SKIN[v.status] ?? SKIN[STATUS.idle];
  const text = centerText(v);
  const size = text.length >= 7 ? 15 : text.length >= 6 ? 17 : text.length >= 5 ? 19 : 22;
  const name = fitName(v.name);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="10" fill="${skin.ground}"/>
  <rect x="0" y="0" width="72" height="3.5" rx="1.75" fill="${skin.line}"/>
  ${name ? `<text x="36" y="20" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="10" font-weight="600" fill="${skin.label}">${esc(name)}</text>` : ''}
  <text x="36" y="${name ? 44 : 41}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${size}" font-weight="700" fill="${skin.text}">${esc(text)}</text>
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
