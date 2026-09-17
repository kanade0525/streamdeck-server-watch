// 監視対象が生きているかを調べる。Stream Deck も描画も知らないので、Node から直接呼べる。
//
// 調べ方は利用者に選ばせず、入力の書き方から決める。方式を選ばせると、
// 「ping で書いたが相手が ICMP を止めていて、ずっと赤い」という事故が起きる。

import { connect } from 'node:net';
import { execFile } from 'node:child_process';
import { platform } from 'node:process';

/** 入力の書き方から調べ方を決める */
export const parseTarget = (raw) => {
  const input = String(raw ?? '').trim();
  if (!input) return { kind: 'none' };

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      return { kind: 'http', url: url.toString(), host: url.hostname };
    } catch {
      return { kind: 'invalid', reason: 'URL として読めない' };
    }
  }

  // ホスト:ポート。IPv6 は [::1]:5432 の形だけ受ける
  const withPort = input.match(/^\[([^\]]+)\]:(\d{1,5})$/) ?? input.match(/^([^:/\s]+):(\d{1,5})$/);
  if (withPort) {
    const port = Number(withPort[2]);
    if (port < 1 || port > 65535) return { kind: 'invalid', reason: 'ポート番号が範囲の外' };
    return { kind: 'tcp', host: withPort[1], port };
  }

  if (/[/\s]/.test(input)) return { kind: 'invalid', reason: 'ホスト名として読めない' };
  return { kind: 'ping', host: input };
};

/** 対象をそのまま表す短い名前。表示名が未設定のときに使う */
export const hostOf = (target) => target.host ?? '';

const httpCheck = async (target, timeoutMs, version) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const started = Date.now();
  try {
    // HEAD を受け付けない相手が珍しくないので GET で取りに行き、本文は読まずに閉じる
    const res = await fetch(target.url, {
      method: 'GET',
      signal: ac.signal,
      redirect: 'follow',
      headers: { 'User-Agent': `StreamDeck-ServerWatch/${version}` },
    });
    const ms = Date.now() - started;
    res.body?.cancel().catch(() => {});
    return res.status < 400
      ? { ok: true, ms, detail: String(res.status) }
      : { ok: false, ms, detail: String(res.status) };
  } catch (e) {
    return { ok: false, ms: Date.now() - started, detail: e.name === 'AbortError' ? '時間切れ' : '繋がらない' };
  } finally {
    clearTimeout(timer);
  }
};

const tcpCheck = (target, timeoutMs) =>
  new Promise((resolve) => {
    const started = Date.now();
    const socket = connect({ host: target.host, port: target.port });
    const done = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done({ ok: true, ms: Date.now() - started, detail: '接続' }));
    socket.once('timeout', () => done({ ok: false, ms: Date.now() - started, detail: '時間切れ' }));
    socket.once('error', () => done({ ok: false, ms: Date.now() - started, detail: '繋がらない' }));
  });

const pingCheck = (target, timeoutMs) =>
  new Promise((resolve) => {
    const started = Date.now();
    // macOS の ping は待ち時間をミリ秒で受ける。Windows は -w がミリ秒
    const args = platform === 'win32'
      ? ['-n', '1', '-w', String(timeoutMs), target.host]
      : ['-c', '1', '-W', String(timeoutMs), target.host];
    const bin = platform === 'win32' ? 'ping' : '/sbin/ping';
    execFile(bin, args, { timeout: timeoutMs + 1000 }, (err, stdout) => {
      const ms = Date.now() - started;
      if (err) return resolve({ ok: false, ms, detail: '届かない' });
      // 実測の往復時間が取れれば、そちらを使う（プロセス起動の時間を含めないため）
      const m = String(stdout).match(/time[=<]\s?([\d.]+)\s?ms/i);
      resolve({ ok: true, ms: m ? Math.round(Number(m[1])) : ms, detail: 'ping' });
    });
  });

/**
 * 一度だけ調べる。
 * @returns {Promise<{ok: boolean, ms: number, detail: string}>}
 */
export const check = async (target, { timeoutMs = 5000, version = '0.0.0' } = {}) => {
  switch (target.kind) {
    case 'http': return httpCheck(target, timeoutMs, version);
    case 'tcp': return tcpCheck(target, timeoutMs);
    case 'ping': return pingCheck(target, timeoutMs);
    default: return { ok: false, ms: 0, detail: '未設定' };
  }
};
