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

```
Hello,

Thank you for the review. A demo video is attached (78 seconds, 1920x1080,
0.85 MB). The same video is also the first item in the product gallery, in
case it did not reach you from there.

What the video shows, with timestamps:

  0:00  A key watching a local server. It is green, labelled UP, and shows
        the latest response time. (Sped up 4x, marked on screen.)
  0:07  The server is stopped. The key turns amber, not red.
  0:21  Further failed checks. A single failure never turns the key red.
        (Sped up 8x.)
  0:27  After three consecutive failures the key turns red and starts
        counting how long the outage has lasted.
  0:47  The outage continues. (Sped up 10x.)
  0:57  The server is started again. On the next check the key returns to
        green and shows the response time again.

Waiting periods are sped up so the video stays short. Every moment where the
key changes state is left at normal speed, and the speed factor is shown on
screen whenever footage is sped up.

To reproduce it yourself, no account or API key is needed. Add the Server
Watch action to a key and type a target into the settings:

  https://example.com   requests the page over HTTPS
  example.com:443       opens a TCP connection to that port
  example.com           sends a ping

Stopping whatever is listening on that target turns the key red; starting it
again turns the key green. An optional second field takes a console URL, and
pressing the key opens it in the default browser.

One note on the video: the plugin follows the language of the Stream Deck
app, and my machine is set to Japanese, so the settings panel appears in
Japanese in the recording. With the app set to English, every label shown
there is in English. Both languages ship with the plugin.

The plugin is macOS only and requires Stream Deck 6.9 or later. It connects
only to the target the user enters, and makes no other network requests.

I have resubmitted the plugin as version 0.1.0.0, unchanged from the version
you reviewed, as described in the revisions guide.

Please let me know if anything else would help.

Thanks,
Kanade
```

## 日本語訳（確認用・送らない）

- 審査ありがとう。デモ動画を添付した（78秒・1920×1080・830KB）。同じものはギャラリーの1点目にも置いてあるが、届いていない場合に備えて添付する
- 動画の中身を時刻付きで説明（緑→黄→赤→緑）
- 待ち時間は早回しし、**状態が変わる瞬間は等速**のまま。早回ししている区間には倍率を画面に出している
- 自分で試す手順。アカウントもAPIキーも要らない。書き方で HTTPS / TCP / ping が決まる
- **動画の設定画面が日本語なのは、私の端末の言語設定のせい。英語にすれば英語で出る**（英日どちらも同梱）
- macOS のみ、Stream Deck 6.9 以降。**利用者が入れた宛先にしか繋がない**
- 版番号は 0.1.0.0 のまま再提出した
