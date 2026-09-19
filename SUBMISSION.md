# Marketplace 提出用の文面

そのまま貼れる形にしてある。**提出は英語が要件**なので、本文はすべて英語。

## 基本

| 欄 | 記入 |
| --- | --- |
| Type | Stream Deck Plugin |
| Name | `Server Watch` |
| File | `com.kanade0525.serverwatch.streamDeckPlugin` |
| Icon | `media/icon-512.png` |
| Thumbnail | `media/thumbnail.png` |
| Gallery | `media/gallery-1-colors.png` 〜 `gallery-4-privacy.png` |
| Compatibility | Stream Deck 6.9 or later（manifest から自動） |
| SDK | Version 3（manifest から自動） |
| DRM protection | Yes |
| Supported OS | macOS 12 or later |

## Description

審査で「機能の説明が足りない」と指摘されたため書き直した。

- 上限は **4,000 字**、Markdown が使える
- **最初の 250 字は装飾なしの平文**にする（検索用）
- 機能・仕組み・同梱物・動作要件を書く。箇条書き推奨

本文は **[`docs/description-en.md`](docs/description-en.md)**（3,773 字）。
そのまま貼れる。内容は次のとおり。

| 節 | 何を書いたか |
| --- | --- |
| 冒頭（平文 402 字） | 何をする道具か。緑/赤、応答時間、押すとコンソールが開くこと |
| How it works | 端末から直接確認すること。書き方で方式が決まる表 |
| Reading the key | 4 つの状態。**1 回の失敗では赤にしない**理由 |
| Pressing the key | コンソールを開く用途。空なら何も起きない |
| What is included | アクション 1 つ、設定 6 項目、対応言語 |
| Setting it up | 4 手順 |
| Connections and data | 入れた宛先にしか繋がない。未設定なら通信しない。ソース公開先 |
| Requirements | macOS 12 / Stream Deck 6.9 / キー専用 |
| Good to know | 別プロファイルでも計測が続く、複数キー、最短 10 秒 |

## Release notes

```
First release.

Green while the server is up, red once it is down, with the recent response
times on the key. Press the key to open your console page.

English and Japanese.
```

## 審査からの指摘（2026-09-19）と対応

| 指摘 | 対応 |
| --- | --- |
| 説明文に機能・仕組み・同梱物の記載を増やすこと | 上の Description に差し替え（1,499 字） |
| 動作確認のためのデモ動画を maker@elgato.com へ送ること | 下記の手順で撮る |

再提出は Maker Console → Products → Server Watch → Versions →
却下された版を選び、修正して再提出する。

## デモ動画の撮り方

**狙いは「本当に動くこと」を審査担当に見せること。** 作り込む必要はない。
60〜90 秒、音声なしで足りる。

### 準備

```sh
npm run demo        # 的サーバーを 8777 で立てる。Enter を押すたびに落ちる/戻る
```

キーの設定は次のようにしておく。

| 項目 | 値 |
| --- | --- |
| 監視対象 | `http://127.0.0.1:8777` |
| 表示名 | `demo-api` |
| 押したとき開くページ | `https://lightsail.aws.amazon.com/ls/webapp/home` |
| 確認の間隔 | **10 秒**（撮影中に待たされないため） |
| 赤にする失敗回数 | **2 回**（同上） |

**Stream Deck と画面の両方が映る画角**にする。手持ちのスマートフォンで構わない。

### 撮る順番

| 秒 | 映すもの |
| --- | --- |
| 0:00 | 設定画面。監視対象とコンソールのURLを入れているところ |
| 0:10 | キーが緑になり、`UP` と応答時間が出る |
| 0:20 | 的サーバーの端末で Enter を押して落とす |
| 0:30 | キーが黄になる（まだ赤ではないことを見せる） |
| 0:45 | キーが赤になり、`DOWN` と経過時間が出る |
| 0:55 | **赤いキーを押す。ブラウザでコンソールのページが開く** |
| 1:05 | 端末で Enter を押して戻す。次の確認でキーが緑に戻る |

**0:30 の黄色を必ず入れる。** 1回の失敗では赤にしないという設計が伝わる唯一の場面で、
ここが監視ツールとしての質を示す。

### 送り方

`maker@elgato.com` に返信する形で送る。本文は次で足りる。

```
Hello,

Here is a short demo of Server Watch as requested.

The video shows: entering a target and a console URL in the property
inspector, the key turning green with the response time, the server going
down (yellow first, then red after repeated failures), the outage time on
the key, pressing the key to open the console page, and the key returning
to green once the server is back.

The description has also been expanded as requested, and the revision has
been resubmitted in Maker Console.

Thanks,
Kanade Ishida
```


## Tags の候補

`monitoring` / `server` / `uptime` / `ping` / `devops` / `status`

## 気をつけること

- **対応OSは macOS のみ。** Windows は ping の呼び分けを書いてあるが実機で確かめていないので、
  申告しない
- ギャラリーは4枚あるが、規定は3枚以上。足りている
