// manifest.json を実行時に読んでいないことを見る。
//
// なぜこのテストが要るか:
//   Marketplace から入れると manifest.json は平文ではなく、ELGATO で始まる暗号化された
//   形式で置かれる。読んで JSON.parse すると例外で落ち、プラグインが起動しない。
//   開発用のシンボリックリンクでは平文のままなので、手元では絶対に再現しない。
//   実際に 0.1.0 がこれで全ユーザー起動不能になった。
//   版番号が要るなら streamDeck.info.plugin.version を使う。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BIN = 'com.kanade0525.serverwatch.sdPlugin/bin';

test('実行時に manifest.json を読んでいない', () => {
  for (const f of readdirSync(BIN).filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(join(BIN, f), 'utf8');
    const code = src
      .split('\n')
      .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
      .join('\n');
    assert.ok(
      !code.includes('manifest.json'),
      `${f} が manifest.json を参照している。Marketplace では暗号化されていて読めない`,
    );
  }
});
