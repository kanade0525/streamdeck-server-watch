#!/bin/sh
# 画面収録から、審査に出すデモ動画を作る。
#
# 元の録画は6分42秒で、ほとんどが「次の確認を待っている時間」。
# そこだけ早回しして、状態が切り替わる瞬間は等速のまま残す。
# 早回ししすぎると「本当に動くか」を確かめられないので、
# 黄→赤や、赤→緑の瞬間には手を付けない。
#
# 元の録画で状態が変わった時刻（キーの色を1秒ごとに測って求めた）
#     3s  UP（緑）
#    39s  疑い（黄）
#    99s  DOWN（赤）
#   219s  UP に復帰
#
# 使い方: sh scripts/edit-demo.sh

set -e
cd "$(dirname "$0")/.."

IN=demo/raw.mov
OUT=demo/server-watch-demo.mp4
FONT=/System/Library/Fonts/Helvetica.ttc

[ -f "$IN" ] || { echo "$IN が無い"; exit 1; }

# 字幕。音声なしで送るので、何を見ているかは文字で示す。
# フィルタの中では改行もインデントも使えないので、1行ずつ組み立てる
cap() {
  printf "drawtext=fontfile=%s:text='%s':x=(w-text_w)/2:y=h-46:fontsize=21:fontcolor=white:box=1:boxcolor=black@0.72:boxborderw=9" "$FONT" "$1"
}
# 早回しの倍率を右上に出す。等速の区間には出さない
rate() {
  printf ",drawtext=fontfile=%s:text='%s':x=w-text_w-14:y=14:fontsize=17:fontcolor=white@0.85:box=1:boxcolor=black@0.55:boxborderw=6" "$FONT" "$1"
}
seg() {  # seg <入力> <開始> <終了> <倍率> <字幕> <出力名> [倍率表示]
  printf "[%s]trim=start=%s:end=%s,setpts=(PTS-STARTPTS)/%s,%s%s[%s];" \
    "$1" "$2" "$3" "$4" "$(cap "$5")" "${7:+$(rate "$7")}" "$6"
}

# 画面収録は動きが無い間フレームを出さない（可変フレームレート）。
# そのまま切ると区間の末尾が欠けるので、先に一定フレームレートに直す
GRAPH="[0:v]fps=30,split=6[b1][b2][b3][b4][b5][b6];"

GRAPH="$GRAPH$(seg b1 5 34 4 'Watching http\://127.0.0.1\:8777 - the key shows UP and the response time' v1 '4x')"
GRAPH="$GRAPH$(seg b2 34 48 1 'The server is stopped - the key turns amber, not red' v2)"
GRAPH="$GRAPH$(seg b3 48 92 8 'A single failed check never turns the key red' v3 '8x')"
GRAPH="$GRAPH$(seg b4 92 112 1 'After repeated failures the key turns red and counts the outage' v4)"
GRAPH="$GRAPH$(seg b5 112 212 10 'The outage continues' v5 '10x')"
GRAPH="$GRAPH$(seg b6 212 234 1 'The server is back - the key returns to UP on the next check' v6)"
GRAPH="$GRAPH[v1][v2][v3][v4][v5][v6]concat=n=6:v=1:a=0[out]"

ffmpeg -v warning -y -i "$IN" -filter_complex "$GRAPH" -map "[out]" \
  -r 30 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart "$OUT"

echo "できた: $OUT"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
