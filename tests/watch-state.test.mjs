// 監視の状態機械の検査。「いつ赤にするか」がこの道具の芯なので、機械で押さえる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { WatchState, STATUS } from '../com.kanade0525.serverwatch.sdPlugin/bin/watch-state.js';

const ok = (ms = 100) => ({ ok: true, ms, detail: '200' });
const ng = () => ({ ok: false, ms: 0, detail: '繋がらない' });

const make = (failuresToDown = 3) => {
  let t = 1_000_000;
  const s = new WatchState({ failuresToDown, now: () => t });
  return { s, advance: (ms) => { t += ms; } };
};

test('最初は待機', () => {
  assert.equal(make().s.status, STATUS.idle);
});

test('成功すれば正常になる', () => {
  const { s } = make();
  s.record(ok(42));
  assert.equal(s.status, STATUS.up);
  assert.equal(s.lastMs, 42);
});

test('1回失敗しただけでは赤にしない', () => {
  const { s } = make(3);
  s.record(ok());
  s.record(ng());
  assert.equal(s.status, STATUS.suspect, '瞬断で赤くしない');
});

test('連続して確定の回数に達したら赤', () => {
  const { s } = make(3);
  s.record(ok());
  s.record(ng());
  s.record(ng());
  assert.equal(s.status, STATUS.suspect);
  s.record(ng());
  assert.equal(s.status, STATUS.down);
  assert.equal(s.consecutiveFailures, 3);
});

test('途中で成功したら失敗の数は振り出しに戻る', () => {
  const { s } = make(3);
  s.record(ng());
  s.record(ng());
  s.record(ok());
  assert.equal(s.status, STATUS.up);
  assert.equal(s.consecutiveFailures, 0);
  s.record(ng());
  assert.equal(s.status, STATUS.suspect, '前の失敗を引きずらない');
});

test('赤から復旧すると一度の成功で緑に戻る', () => {
  const { s } = make(2);
  s.record(ng()); s.record(ng());
  assert.equal(s.status, STATUS.down);
  s.record(ok(80));
  assert.equal(s.status, STATUS.up);
});

test('確定の回数を1にすれば1回で赤', () => {
  const { s } = make(1);
  s.record(ng());
  assert.equal(s.status, STATUS.down);
});

test('状態が変わった時だけ changed を返す', () => {
  const { s } = make(2);
  assert.equal(s.record(ok()).changed, true, '待機→正常');
  assert.equal(s.record(ok()).changed, false, '正常のまま');
  assert.equal(s.record(ng()).changed, true, '正常→疑い');
  assert.equal(s.record(ng()).changed, true, '疑い→異常');
  assert.equal(s.record(ng()).changed, false, '異常のまま');
});

test('異常が続いた時間を測れる', () => {
  const { s, advance } = make(1);
  s.record(ng());
  advance(5000);
  assert.equal(s.downFor(), 5000);
  s.record(ok());
  assert.equal(s.downFor(), 0);
});

test('履歴は長さを超えない。失敗は null で残る', () => {
  const s = new WatchState({ failuresToDown: 3, historySize: 5 });
  for (let i = 0; i < 4; i++) s.record(ok(i + 1));
  s.record(ng());
  s.record(ok(99));
  assert.equal(s.history.length, 5);
  assert.deepEqual(s.history, [2, 3, 4, null, 99], '落ちていた事実が履歴に残る');
});

test('対象を入れ替えたら履歴を捨てる', () => {
  const { s } = make();
  s.record(ok(10));
  s.reset();
  assert.equal(s.status, STATUS.idle);
  assert.deepEqual(s.history, [], '別の対象の履歴が混ざると嘘になる');
});
