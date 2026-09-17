// アイコンPNGを生成する。
//
// なぜ生成するか: 画像編集の道具も依存パッケージも持ち込まずに、同じ図形を
// 全サイズで作りたいため。node:zlib だけで PNG を組み立て、形は距離関数で描く。
// 4×4 の多重標本で縁をならしているので、20px でも輪郭が潰れない。
//
// 図柄は電波の弧が三段。真ん中の点が対象で、外へ広がる弧が「見ている」ことを表す。
// 色は正常時の緑で、キーの色づかいと揃えてある。

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

// ---- PNG の組み立て ----
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const png = (size, sample, height = size) => {
  const raw = Buffer.alloc(height * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = sample(x, y);
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

// ---- 形（すべて 0..1 の座標で書き、最後に大きさを掛ける）----
const segDist = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

/** 上向きの弧。中心 (cx,cy) から半径 r の円のうち、上側の扇だけを太さ t で描く */
const arc = (px, py, cx, cy, r, t, spreadDeg = 52) => {
  const d = Math.hypot(px - cx, py - cy);
  if (Math.abs(d - r) > t / 2) return false;
  const deg = (Math.atan2(cy - py, px - cx) * 180) / Math.PI;  // 上が +90
  return Math.abs(deg - 90) <= spreadDeg;
};

/** 点 */
const dot = (px, py, cx, cy, r) => Math.hypot(px - cx, py - cy) <= r;

const roundedRect = (px, py, r) => {
  const x = Math.min(px, 1 - px), y = Math.min(py, 1 - py);
  if (x >= r || y >= r) return px >= 0 && px <= 1 && py >= 0 && py <= 1;
  return Math.hypot(r - x, r - y) <= r;
};

// 弧は外へ行くほど薄く。見ている範囲が広がっていく形にする
const GREEN = [0x57, 0xd0, 0x8a];
const ARCS = [
  { r: 0.17, t: 0.075, color: GREEN },
  { r: 0.31, t: 0.070, color: [0x46, 0xac, 0x74] },
  { r: 0.45, t: 0.065, color: [0x36, 0x88, 0x5c] },
];
const CENTER_Y = 0.70;  // 点は下寄り。弧が上へ広がる余地をつくる
const DOT_R = 0.055;

/**
 * @param {boolean} opts.plate 暗い角丸の下地を敷くか（キーやプラグインの絵）
 * @param {number[]|null} opts.ink 単色で描く時の色。null なら段の色を使う
 */
const make = (size, { plate, ink, height }) => (x, y) => {
  const imgH = height ?? size;
  const S = 4; // 多重標本。縁をならす
  let r = 0, g = 0, b = 0, a = 0;
  for (let sy = 0; sy < S; sy++) {
    for (let sx = 0; sx < S; sx++) {
      // 縦長の絵では、図柄を正方形として中央に置く（縦に引き伸ばさない）
      const side = Math.min(size, imgH);
      const px = (x + (sx + 0.5) / S - (size - side) / 2) / side;
      const py = (y + (sy + 0.5) / S - (imgH - side) / 2) / side;
      let c = null;
      if (dot(px, py, 0.5, CENTER_Y, DOT_R)) c = ink ?? GREEN;
      if (!c) {
        for (const a of ARCS) {
          if (arc(px, py, 0.5, CENTER_Y, a.r, a.t)) { c = ink ?? a.color; break; }
        }
      }
      if (!c && plate && roundedRect(px, py, 0.14)) c = [0x14, 0x18, 0x1c];
      if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
    }
  }
  const n = S * S;
  return a === 0 ? [0, 0, 0, 0] : [Math.round(r / (a / 255)), Math.round(g / (a / 255)), Math.round(b / (a / 255)), Math.round(a / n)];
};

const out = 'com.kanade0525.serverwatch.sdPlugin/imgs';
mkdirSync(out, { recursive: true });

const files = [
  // キーに最初から出る絵。下地あり・段の色
  ['key', 72, { plate: true, ink: null }],
  ['key@2x', 144, { plate: true, ink: null }],
  // プラグインの顔。Marketplace の規定は 256×256 と、高DPI用の 512×512
  ['plugin', 256, { plate: true, ink: null }],
  ['plugin@2x', 512, { plate: true, ink: null }],
  // 一覧に並ぶ小さい絵。背景は透明・白単色（明るい地でも暗い地でも読める）
  ['action', 20, { plate: false, ink: [0xff, 0xff, 0xff] }],
  ['action@2x', 40, { plate: false, ink: [0xff, 0xff, 0xff] }],
  ['category', 28, { plate: false, ink: [0xff, 0xff, 0xff] }],
  ['category@2x', 56, { plate: false, ink: [0xff, 0xff, 0xff] }],
];
for (const [name, size, opts] of files) {
  const h = opts.height ?? size;
  writeFileSync(`${out}/${name}.png`, png(size, make(size, opts), h));
}
console.log(`アイコンを${files.length}枚つくった`);
