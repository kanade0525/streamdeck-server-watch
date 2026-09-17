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

```
Watches a server and tells you at a glance whether it is up.

The key is green while the server responds, and red once it stops. A single
failed check will not turn it red — only repeated failures do, three by
default, so a brief hiccup does not cry wolf. The key also carries the recent
response times, so you can see the server slowing down before it falls over.

Press the key to open your console page — the AWS Lightsail dashboard, your
hosting panel, anything you would open next. The thing you check and the thing
you do about it sit on the same key.

There are only two fields to fill in: the server to watch, and the page to open.
How the server is checked is decided by how you write it:

  https://example.com   requests the page and checks the response
  example.com:5432      opens a TCP connection to the port
  example.com           sends a ping (ICMP)

Many cloud hosts block ping, so an https:// URL is usually the most reliable.

Connections: the plugin contacts the address you entered, and nothing else.
Before you set one, it makes no connections at all. Results stay on your
machine. The source is public at
https://github.com/kanade0525/streamdeck-server-watch

Available in English and Japanese.
```

## Release notes（初回）

```
First release.

Green while the server is up, red once it is down, with the recent response
times on the key. Press the key to open your console page.

English and Japanese.
```

## Tags の候補

`monitoring` / `server` / `uptime` / `ping` / `devops` / `status`

## 気をつけること

- **対応OSは macOS のみ。** Windows は ping の呼び分けを書いてあるが実機で確かめていないので、
  申告しない
- ギャラリーは4枚あるが、規定は3枚以上。足りている
