// デモ撮影用の的サーバー。
//
// 審査用の動画では「生きている → 落ちる → 戻る」を見せる必要がある。
// 本物のサーバーは都合よく落とせないので、手元に的を立てて落とす。
//
//   node scripts/demo-target.mjs          # 8777 で待ち受ける
//   node scripts/demo-target.mjs --flap   # 20秒ごとに勝手に落ちて戻る（一人で撮るとき用）
//
// 止める: Ctrl+C

import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 8777);
const flap = process.argv.includes('--flap');

let alive = true;
const server = createServer((req, res) => {
  if (!alive) { req.socket.destroy(); return; }   // 落ちている間は繋がせない
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('ok\n');
});

server.listen(port, () => {
  console.log(`http://127.0.0.1:${port} で待っています`);
  console.log(flap
    ? '20秒ごとに落ちて戻ります（撮影用）'
    : 'Enter を押すたびに 生きている / 落ちている が切り替わります');
});

const flip = () => {
  alive = !alive;
  console.log(alive ? '● 生きている' : '× 落ちている');
};

if (flap) {
  setInterval(flip, 20000);
} else {
  // 手元で切り替える。撮影しながら片手で操作できる
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', flip);
  process.stdin.resume();
}
