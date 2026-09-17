// 監視対象の書き方の判定。ここを間違えると、
// 「ping で書いたつもりが HTTP で見に行っていた」のような取り違えが起きる。
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTarget } from '../com.kanade0525.serverwatch.sdPlugin/bin/check.js';

test('https で始まれば HTTP で見る', () => {
  const t = parseTarget('https://example.com/health');
  assert.equal(t.kind, 'http');
  assert.equal(t.host, 'example.com');
});

test('http でも HTTP で見る', () => {
  assert.equal(parseTarget('http://192.168.1.1').kind, 'http');
});

test('ホスト:ポート なら TCP で繋ぐ', () => {
  const t = parseTarget('db.example.com:5432');
  assert.equal(t.kind, 'tcp');
  assert.equal(t.host, 'db.example.com');
  assert.equal(t.port, 5432);
});

test('IPv6 は角かっこで書く', () => {
  const t = parseTarget('[::1]:5432');
  assert.equal(t.kind, 'tcp');
  assert.equal(t.host, '::1');
});

test('ホスト名だけなら ping', () => {
  assert.equal(parseTarget('example.com').kind, 'ping');
  assert.equal(parseTarget('1.1.1.1').kind, 'ping');
});

test('空なら未設定。通信させない', () => {
  assert.equal(parseTarget('').kind, 'none');
  assert.equal(parseTarget('   ').kind, 'none');
  assert.equal(parseTarget(undefined).kind, 'none');
});

test('前後の空白は落とす', () => {
  assert.equal(parseTarget('  example.com  ').kind, 'ping');
});

test('読めない書き方は invalid にする', () => {
  assert.equal(parseTarget('bad input').kind, 'invalid');
  assert.equal(parseTarget('example.com:99999').kind, 'invalid');
  assert.equal(parseTarget('example.com/path').kind, 'invalid');
});
