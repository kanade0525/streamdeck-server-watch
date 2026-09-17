// 描画の検査。見た目は機械で判断できないので、
// 「壊れた SVG を出さない」「状態が絵に出る」の2点を押さえる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { watchImage, badTargetImage, downDuration } from '../com.kanade0525.serverwatch.sdPlugin/bin/draw.js';
import { STATUS } from '../com.kanade0525.serverwatch.sdPlugin/bin/watch-state.js';

const base = {
  status: STATUS.up, name: 'api-prod', lastMs: 124,
  consecutiveFailures: 0, history: [90, 120, 110, 130, 124],
};

const wellFormed = (svg) => {
  assert.match(svg, /^<svg [^>]*>/);
  assert.match(svg, /<\/svg>$/);
  assert.ok(!svg.includes('NaN'), 'NaN が混じらない');
  assert.ok(!svg.includes('undefined'), 'undefined が混じらない');
};

test('どの状態でも壊れない', () => {
  for (const status of Object.values(STATUS)) {
    wellFormed(watchImage({ ...base, status }));
  }
});

test('状態ごとに色が変わる', () => {
  const up = watchImage({ ...base, status: STATUS.up });
  const down = watchImage({ ...base, status: STATUS.down, consecutiveFailures: 3 });
  const suspect = watchImage({ ...base, status: STATUS.suspect, consecutiveFailures: 1 });
  assert.match(up, /#57d08a/, '正常は緑');
  assert.match(down, /#ff5f56/, '異常は赤');
  assert.match(suspect, /#ffa94d/, '疑いは黄');
});

test('正常なら応答時間を出す', () => {
  assert.match(watchImage({ ...base, lastMs: 124 }), />124ms</);
  assert.match(watchImage({ ...base, lastMs: 2400 }), />2\.4s</, '1秒以上は秒で出す');
});

test('長い表示名は詰める', () => {
  const svg = watchImage({ ...base, name: 'very-long-server-name-here' });
  assert.match(svg, /…/);
  assert.ok(!svg.includes('very-long-server-name-here'));
});

test('表示名に記号が入っても壊れない', () => {
  const svg = watchImage({ ...base, name: 'a<b>&c' });
  assert.ok(!svg.includes('<b>'), 'そのまま埋め込まない');
  assert.match(svg, /&lt;|&amp;/);
});

test('履歴が無くても、1点しか無くても壊れない', () => {
  wellFormed(watchImage({ ...base, history: [] }));
  wellFormed(watchImage({ ...base, history: [100] }));
  wellFormed(watchImage({ ...base, history: [null, null] }));
});

test('全部失敗の履歴でも壊れない', () => {
  wellFormed(watchImage({ ...base, status: STATUS.down, lastMs: null, history: [null, null, null] }));
});

test('書き方がおかしい時の絵が壊れていない', () => {
  wellFormed(badTargetImage());
});

test('落ちている時間は単位を繰り上げて短く出す', () => {
  assert.equal(downDuration(0), '0s');
  assert.equal(downDuration(42_000), '42s');
  assert.equal(downDuration(59_999), '59s');
  assert.equal(downDuration(60_000), '1m');
  assert.equal(downDuration(90 * 60_000), '1h');
  assert.equal(downDuration(26 * 60 * 60_000), '1d');
});

test('異常のときは落ちている時間を出す', () => {
  const svg = watchImage({ ...base, status: STATUS.down, lastMs: null, downFor: 5 * 60_000 });
  assert.match(svg, />DOWN 5m</);
});

test('落ちている時間が渡ってこなくても壊れない', () => {
  wellFormed(watchImage({ ...base, status: STATUS.down, lastMs: null }));
});
