# 審査への返信（デモ動画の要求）

2026-09-23 に `maker@elgato.com` から、機能確認のためデモ動画をメールで送るよう依頼が来た。

**動画はギャラリーに上げてあるが、先方はメールで送れと言っている。**
ギャラリーに置いただけでは審査側の手元に届いていない可能性が高い。

もう一つ、動画に写っている設定画面が日本語になっている。審査担当は英語で見るので、
これも「機能を確認できない」理由になり得る。本文でその旨を断っている。

## 送るもの

| | |
| --- | --- |
| 宛先 | `maker@elgato.com`（**届いたメールにそのまま返信する**。件名を変えない） |
| 添付 | `demo/server-watch-demo.mp4`（78秒・1920×1080・850KB） |
| 本文 | 下記をそのまま貼る |

添付したうえで、**同じ版番号 0.1.0.0 のまま**再提出する。

```sh
sh scripts/pack-submission.sh 0.1.0.0
```

## 本文（英語・そのまま貼る）

審査担当は流し読みする。**動画を確かめるのに要る情報だけ**にしてある。
再現手順や対応OSは製品ページに書いてあるので、ここでは繰り返さない。

```
Hello,

Thank you for the review. A demo video is attached (78 seconds). It is also
the first item in the product gallery.

  0:00  The key is green, labelled UP, showing the response time
  0:07  The server is stopped - the key turns amber, not red
  0:27  After three consecutive failures it turns red and counts the outage
  0:57  The server is back - the key returns to green

Waiting periods are sped up, marked on screen. The settings panel reads
Japanese because my Stream Deck app is set to Japanese; English ships with
the plugin as well.

I have resubmitted as version 0.1.0.0, unchanged.

Thanks,
Kanade
```

## 日本語訳（確認用・送らない）

- 審査ありがとう。デモ動画を添付した（78秒）。同じものはギャラリーの1点目にも置いてある
- 動画の中身を時刻で4点（緑 → 黄 → 赤＋経過時間 → 緑）
- 待ち時間は早回しで、倍率は画面に出ている
- **設定画面が日本語なのは私の端末の言語設定のせい。英語も同梱している**
- 版番号は 0.1.0.0 のまま再提出した
