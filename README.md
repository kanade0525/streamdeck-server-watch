# Server Watch for Stream Deck

サーバーが生きているかをキーの色で出します。**正常なら緑、異常なら赤。**
押すと、入れておいたコンソールのページが開きます。

- 見に行かなくても、視界の端で分かります
- 異常に気づいた次の動作が同じキーに乗っています。赤い → 押す → コンソールが開く
- 押していない間も測り続けるので、**応答時間の推移**がキーに残ります

## 入れるのは二つだけ

| 項目 | 必須 | 例 |
| --- | --- | --- |
| 監視対象 | 必須 | `https://example.com` |
| 押したとき開くページ | 任意 | `https://lightsail.aws.amazon.com/ls/webapp/home` |

開くページが空なら、押しても何も起きません。

### 監視対象の書き方で調べ方が決まります

| 書き方 | 調べ方 |
| --- | --- |
| `https://…` | 取りに行って、状態番号が 400 未満なら正常 |
| `host:port` | TCP で繋がるか |
| ホスト名だけ | ping（ICMP） |

**クラウドは ping を止めていることが多いので、`https://` で書くのが最も確実です。**
設定画面には、入れた文字列がどう扱われるかがその場で出ます。

## 色

| 色 | 意味 |
| --- | --- |
| 緑 | 正常 |
| 黄 | 失敗したが、まだ確定していない |
| 赤 | 連続して失敗した（既定は3回） |
| 灰 | 未設定、またはまだ一度も確認していない |

**失敗1回では赤にしません。** 瞬断のたびに赤くなる監視は、赤が意味を失って
誰も見なくなるからです。回数は設定で変えられます。

## 通信について

**利用者が入れた宛先にだけ繋ぎます。** ほかのどこにも繋ぎません。
測った結果は端末の中だけに置き、外に送りません。

未設定のあいだは通信そのものをしません。

## 言語

英語と日本語に対応しています。Stream Deck アプリの言語に合わせて切り替わります。
キーに出る `UP` / `DOWN` は訳していません（監視の世界でそのまま通る言葉のため）。

## 要るもの

- macOS 12 以降
- Stream Deck 6.9 以降（ボタンのみの機種で動きます）

権限は要りません。

## 入れる

```sh
git clone https://github.com/kanade0525/streamdeck-server-watch.git
cd streamdeck-server-watch
npm run link
```

Stream Deck を再起動し、**Server Watch** をキーに置いてください。

[Releases](https://github.com/kanade0525/streamdeck-server-watch/releases) の
`.streamDeckPlugin` からも入れられます。

## 開発

```sh
npm test          # 検査（依存パッケージ不要）
npm run preview   # キーの絵を実寸で書き出して目で確かめる
npm run icons     # アイコンを作り直す
npm run media     # 提出用の画像を作り直す
npm run link    # 開発中のものを Stream Deck に見せる
npm run pack    # .streamDeckPlugin を作る
```

```
com.kanade0525.serverwatch.sdPlugin/
  bin/check.js        調べる部分（HTTP / TCP / ping）
  bin/watch-state.js  状態機械（正常・疑い・異常）。ここが検査の対象
  bin/draw.js         SVG の組み立て
  bin/rate-limit.js   送信の関門
  bin/plugin.js       Stream Deck との接続
  ui/watch.html       設定画面
  en.json / ja.json   訳語
tests/
```

## ライセンス

MIT
