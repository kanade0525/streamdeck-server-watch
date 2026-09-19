# Marketplace 提出用の文面

そのまま貼れる形にしてある。**提出は英語が要件**なので、本文はすべて英語。

## 基本

| 欄 | 記入 |
| --- | --- |
| Type | Stream Deck Plugin |
| Name | `Server Watch` |
| File | `com.kanade0525.serverwatch.streamDeckPlugin`（**版番号 0.1.0.0 で包むこと**。下記） |
| Icon | `media/icon-512.png` |
| Thumbnail | `media/thumbnail.png` |
| Gallery | `demo/server-watch-demo.mp4` と `media/gallery-1-colors.png` 〜 `gallery-4-privacy.png`（計5点。最低3点） |
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

## 修正版を出すときの決まり

**却下された版を直して出すときは、同じ版番号のままファイルを上げる。**
版を上げたものを出そうとすると
「The uploaded file must keep the same version number」で弾かれる
（上げたい場合は修正版ではなく、新しい版として作ることになる）。

手元のリポジトリが先に進んでいても、提出用だけ版番号を戻して包む。

```sh
sh scripts/pack-submission.sh 0.1.0.0
```

manifest の Version だけ一時的に差し替えて包み、すぐ元に戻す。
中身は現在のソースのままなので、直した内容は入る。

## 審査からの指摘（2026-09-19）と対応

| 指摘 | 対応 |
| --- | --- |
| 説明文に機能・仕組み・同梱物の記載を増やすこと | 上の Description に差し替え（1,499 字） |
| 動作確認のためのデモ動画を maker@elgato.com へ送ること | 下記の手順で撮る |

再提出は Maker Console → Products → Server Watch → Versions →
却下された版を選び、修正して再提出する。

## デモ動画

**`demo/server-watch-demo.mp4`**（78秒・1920×1080・約0.85MB・音声なし）。
`maker@elgato.com` に返信で送り、**ギャラリーにも入れる**。

ギャラリーの規格は、画像なら 1920×960 の png/jpg（10MB まで）、
動画なら 1920×1080 の mp4（50MB まで）。最低3点。
元の録画は 848×768 なので、高さを 1080 に伸ばして左右を余白で埋めている
（引き伸ばして歪ませるより素直）。

元の画面収録（6分42秒）から、待ち時間だけ早回しして作った。
**状態が切り替わる瞬間は等速**のまま残してあり、早回しの倍率は画面の右上に出している。

| 区間 | 内容 | 速度 |
| --- | --- | --- |
| 0:00 | 監視対象と `UP`・応答時間 | 4倍 |
| 0:07 | サーバー停止 → 黄になる（まだ赤ではない） | 等速 |
| 0:21 | 待ち | 8倍 |
| 0:27 | 赤になり、経過時間が出る | 等速 |
| 0:47 | 障害継続 | 10倍 |
| 0:57 | 復旧して緑に戻る | 等速 |

作り直すときは `sh scripts/edit-demo.sh`。
切り替わりの時刻は目視ではなく、キーの色を1秒ごとに測って求めた
（39秒で黄、99秒で赤、219秒で復帰）。

撮り直す場合は、確認の間隔を10秒・赤にする失敗回数を2回にしておくと待たされない。
落として戻す的サーバーは `npm run demo` で立つ。

### メール本文

```
Hello,

Thank you for the review. I have made both changes.

1. Description
The description has been rewritten and expanded. It now covers what the
plugin does, how the check method is chosen from how you write the target
(HTTPS / TCP / ICMP), how to read the key, the settings included, the setup
steps, and what the plugin connects to.

2. Demo video
A short demo is attached (78 seconds, no audio). It shows a key watching a
local server:

- The key is green and shows the response time while the server is up
- The server is stopped, and the key turns amber rather than red, because a
  single failed check is not treated as an outage
- After the failures repeat, the key turns red and shows how long the server
  has been down
- The server is brought back, and the key returns to green on the next check

Waiting between checks is sped up so the video stays short. The speed is
shown in the top right corner, and every moment where the key changes state
is at normal speed.

The revision has been resubmitted in Maker Console.

Thanks,
Kanade Ishida
```

## Tags の候補

`monitoring` / `server` / `uptime` / `ping` / `devops` / `status`

## 気をつけること

- **対応OSは macOS のみ。** Windows は ping の呼び分けを書いてあるが実機で確かめていないので、
  申告しない
- ギャラリーは4枚あるが、規定は3枚以上。足りている
