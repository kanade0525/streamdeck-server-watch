// 監視の状態機械。通信も描画も Stream Deck も知らないので、Node から直接呼んで検査できる。
//
// なぜ「疑い」を挟むか: 失敗1回で赤にすると、瞬断のたびに赤くなる。
// 赤が日常になった監視は誰も見なくなり、道具として死ぬ。
// 連続して失敗したときだけ赤にして、赤の意味を守る。

export const STATUS = {
  idle: 'idle',        // まだ一度も確認していない／未設定
  up: 'up',            // 正常
  suspect: 'suspect',  // 失敗したが確定していない
  down: 'down',        // 異常が確定した
};

export class WatchState {
  /**
   * @param {object} opts
   * @param {number} opts.failuresToDown 異常と決める連続失敗回数
   * @param {number} opts.historySize    応答時間の履歴の長さ
   * @param {() => number} opts.now
   */
  constructor({ failuresToDown = 3, historySize = 20, now = () => Date.now() } = {}) {
    this.failuresToDown = Math.max(1, failuresToDown);
    this.historySize = historySize;
    this.now = now;
    this.status = STATUS.idle;
    this.consecutiveFailures = 0;
    this.lastMs = null;        // 直近の応答時間
    this.lastDetail = '';
    this.lastCheckedAt = 0;
    this.history = [];         // 応答時間の推移。失敗は null で入れる
    this.downSince = 0;        // 異常が確定した時刻
  }

  /**
   * 1回ぶんの結果を入れる。状態が変わったかどうかを返す
   * @param {{ok: boolean, ms: number, detail: string}} result
   */
  record(result) {
    const before = this.status;
    this.lastCheckedAt = this.now();
    this.lastDetail = result.detail ?? '';

    if (result.ok) {
      this.consecutiveFailures = 0;
      this.lastMs = result.ms;
      this.status = STATUS.up;
      this.downSince = 0;
      this.#push(result.ms);
    } else {
      this.consecutiveFailures += 1;
      this.lastMs = null;
      this.#push(null);
      if (this.consecutiveFailures >= this.failuresToDown) {
        if (this.status !== STATUS.down) this.downSince = this.lastCheckedAt;
        this.status = STATUS.down;
      } else {
        this.status = STATUS.suspect;
      }
    }
    return { changed: before !== this.status, from: before, to: this.status };
  }

  /** 監視対象が未設定に戻ったとき。履歴も捨てる（別の対象の履歴が混ざると嘘になる） */
  reset() {
    this.status = STATUS.idle;
    this.consecutiveFailures = 0;
    this.lastMs = null;
    this.lastDetail = '';
    this.history = [];
    this.downSince = 0;
  }

  /** 異常が続いている時間（ミリ秒）。異常でなければ 0 */
  downFor() {
    return this.status === STATUS.down && this.downSince ? this.now() - this.downSince : 0;
  }

  #push(ms) {
    this.history.push(ms);
    while (this.history.length > this.historySize) this.history.shift();
  }
}
