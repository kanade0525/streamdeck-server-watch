// Stream Deck との接続。公式SDK（@elgato/streamdeck）に乗せている。
//
// 配布時、プラグインは Stream Deck 同梱の Node 20 で動く。この Node には
// 標準の WebSocket が無いので、自前で繋ぐには WebSocket クライアントを持ち込む
// 必要がある。公式SDKはそこを含めて面倒を見る。ビルドステップは入れていない。

import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import streamDeck, { SingletonAction } from '@elgato/streamdeck';

import { parseTarget, check, hostOf } from './check.js';
import { WatchState, STATUS } from './watch-state.js';
import { watchImage, badTargetImage, dataUri } from './draw.js';
import { RateLimiter } from './rate-limit.js';

const ROOT = join(import.meta.dirname, '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8')).Version;
const logger = streamDeck.logger;

const DEFAULTS = {
  target: '',
  name: '',
  consoleUrl: '',
  intervalSec: 30,
  timeoutSec: 5,
  failuresToDown: 3,
};

const MIN_INTERVAL_SEC = 10;

/**
 * キー1枚ぶんの監視。キーごとに別の対象を見るので、状態も時計もキーごとに持つ。
 * 別のページに切り替えている間も動かし続ける（履歴が欠けると推移の線が嘘になる）。
 */
class Watcher {
  constructor(action, settings) {
    this.action = action;
    this.timer = null;
    this.running = false;
    // 送信の関門。この道具は数十秒に1回しか変わらないので余裕だが、
    // Marketplace の規定（毎秒10回まで）を仕組みとして守らせておく
    this.limiter = new RateLimiter({
      minIntervalMs: 100,
      send: (image) => this.action.setImage(image),
    });
    this.apply(settings);
  }

  /** 設定を入れ直す。対象が変わったら履歴は捨てる */
  apply(raw) {
    const s = { ...DEFAULTS, ...(raw ?? {}) };
    const targetChanged = this.rawTarget !== s.target;
    this.rawTarget = s.target;
    this.name = s.name;
    this.consoleUrl = String(s.consoleUrl ?? '').trim();
    this.intervalMs = Math.max(MIN_INTERVAL_SEC, Number(s.intervalSec) || DEFAULTS.intervalSec) * 1000;
    this.timeoutMs = Math.max(1, Number(s.timeoutSec) || DEFAULTS.timeoutSec) * 1000;
    this.target = parseTarget(s.target);

    if (!this.state || targetChanged) {
      this.state = new WatchState({ failuresToDown: Number(s.failuresToDown) || DEFAULTS.failuresToDown });
    } else {
      this.state.failuresToDown = Math.max(1, Number(s.failuresToDown) || DEFAULTS.failuresToDown);
    }

    this.paint();
    this.schedule();
  }

  schedule() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    // 未設定や書き方がおかしい時は通信しない。利用者が入れた宛先にしか繋がない
    if (this.target.kind === 'none' || this.target.kind === 'invalid') return;
    this.tick();
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  async tick() {
    if (this.running) return;  // 前の確認が終わる前に次を始めない
    this.running = true;
    try {
      const result = await check(this.target, { timeoutMs: this.timeoutMs, version: VERSION });
      const { changed, from, to } = this.state.record(result);
      if (changed) logger.info(`${this.label()}: ${from} → ${to} (${result.detail})`);
      this.paint();
    } catch (e) {
      logger.error(`${this.label()}: 確認に失敗`, e);
    } finally {
      this.running = false;
    }
  }

  label() {
    return this.name || hostOf(this.target) || '(未設定)';
  }

  paint() {
    if (this.target.kind === 'invalid') {
      this.limiter.request(dataUri(badTargetImage(streamDeck.i18n.translate('checkTarget'))));
      return;
    }
    this.limiter.request(dataUri(watchImage({
      status: this.state.status,
      name: this.name || hostOf(this.target),
      lastMs: this.state.lastMs,
      consecutiveFailures: this.state.consecutiveFailures,
      failuresToDown: this.state.failuresToDown,
      downFor: this.state.downFor(),
      history: this.state.history,
    })));
  }

  /**
   * 押された時。コンソールのURLが入っていれば開く。
   *
   * http/https のときだけ開く。file: や独自の scheme を許すと、
   * 設定欄が「任意のものを起動させる入口」になってしまう。
   * 起動は execFile で、シェルを一切経由しない（引数として渡すので、
   * URL に何が混ざっても文字列の組み立てが崩れない）。
   */
  open() {
    if (!/^https?:\/\//i.test(this.consoleUrl)) return false;
    execFile('open', [this.consoleUrl]);
    return true;
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.limiter.dispose();
  }
}

class WatchAction extends SingletonAction {
  manifestId = 'com.kanade0525.serverwatch.watch';

  constructor() {
    super();
    this.watchers = new Map();  // context -> Watcher
  }

  onWillAppear(ev) {
    ev.action.setTitle('');
    const existing = this.watchers.get(ev.action.id);
    if (existing) { existing.apply(ev.payload?.settings); return; }
    this.watchers.set(ev.action.id, new Watcher(ev.action, ev.payload?.settings));
  }

  onWillDisappear(ev) {
    // 画面から消えても監視は続けたいので、ここでは止めない。
    // Stream Deck を終うとプロセスごと終わるため、後始末は要らない
  }

  onDidReceiveSettings(ev) {
    this.watchers.get(ev.action.id)?.apply(ev.payload?.settings);
  }

  onKeyUp(ev) {
    const w = this.watchers.get(ev.action.id);
    if (!w) return;
    // 開く先が無いときは、押しても何も起きない
    if (!w.open()) ev.action.showAlert?.();
  }
}

streamDeck.actions.registerAction(new WatchAction());
await streamDeck.connect();
logger.info(`接続した version=${VERSION}`);
