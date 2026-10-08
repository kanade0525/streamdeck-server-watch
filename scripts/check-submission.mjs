// Marketplace へ出す前の確認。提出ボタンを押す前にこれを走らせる。
//
// なぜ要るか: 差し戻しは1回あたり4〜10営業日を失う。これまで落ちた2回は、
// どちらも押す前の数分で防げたものだった。
//   - Description 欄に manifest の短い文が入ったまま出した（下限250字を割っていた）
//   - 手元の版番号が審査中の版より先に進んでいて、配布物が弾かれた
// その2つを含め、規格で決まっている数字を機械で見る。
//
// 規格の出どころ: https://docs.elgato.com/guidelines/products
//   アイコン        288×288 PNG
//   サムネイル      1920×960 PNG
//   ギャラリー      1920×960 PNG を3点以上（最大10点）
//   動画            MP4 1920×1080・250MB未満
//   説明文          250字以上（ガイドラインの上限表記は1,500字だが、
//                   実物のフォームは4,000字。食い違っているので下限だけ見る）
//
// 道具を足さないため、PNG の寸法はヘッダ（IHDR）を直に読む。
// 動画は macOS の mdls で測る。

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';

let ng = 0;
const ok = (m) => console.log(`  OK  ${m}`);
const bad = (m) => { console.log(`  NG  ${m}`); ng += 1; };
const note = (m) => console.log(`  --  ${m}`);
const head = (m) => console.log(`\n[${m}]`);

/** PNG の IHDR から寸法を読む。画像の道具を入れずに済ませる */
const pngSize = (path) => {
  const b = readFileSync(path);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

/** 動画の寸法。macOS の Spotlight が持っている値を借りる */
const mp4Size = (path) => {
  try {
    const out = execFileSync('mdls', ['-name', 'kMDItemPixelWidth', '-name', 'kMDItemPixelHeight', path], { encoding: 'utf8' });
    const n = [...out.matchAll(/= (\d+)/g)].map((m) => Number(m[1]));
    if (n.length < 2) return null;
    return { h: n[0], w: n[1] };   // mdls は Height, Width の順で返す
  } catch { return null; }
};

const files = (dir, re) => (existsSync(dir) ? readdirSync(dir).filter((f) => re.test(f)).sort() : []);

// ---- manifest ----
head('プラグイン');
const manifests = [];
for (const d of readdirSync('.')) {
  if (d.endsWith('.sdPlugin') && existsSync(join(d, 'manifest.json'))) manifests.push(join(d, 'manifest.json'));
}
if (existsSync('dist')) {
  for (const d of readdirSync('dist')) {
    if (d.endsWith('.sdPlugin') && existsSync(join('dist', d, 'manifest.json'))) manifests.push(join('dist', d, 'manifest.json'));
  }
}
if (!manifests.length && existsSync('plugin/manifest.json')) manifests.push('plugin/manifest.json');
if (!manifests.length) bad('manifest.json が見つからない');

let version = null;
for (const m of manifests) {
  const j = JSON.parse(readFileSync(m, 'utf8'));
  version = j.Version;
  console.log(`  --  ${j.Name}  v${j.Version}  (${m})`);
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(String(j.Version))) bad(`版番号の形が違う: ${j.Version}（x.y.z.w）`);
}

// ---- 審査中の版と食い違っていないか ----
head('版番号');
if (existsSync('.submitted-version')) {
  const submitted = readFileSync('.submitted-version', 'utf8').trim();
  if (submitted === version) ok(`審査中の版と一致している（${submitted}）`);
  else bad(`審査中は ${submitted}。手元は ${version}。修正版は同じ版番号で出す決まりなので、` +
           `提出用だけ ${submitted} に戻して包むか、手元の版を戻す`);
} else {
  note('.submitted-version が無い。提出したら、その版番号をこのファイルに書いておく');
  note(`  echo ${version} > .submitted-version`);
}

// ---- 説明文 ----
head('説明文');
// 判定するのは「説明欄に貼る原稿」だけ。GitHub 用の原稿は表も見出しも自由なので触らない
const descs = files('docs', /^description-marketplace.*\.md$/).map((f) => join('docs', f));
const others = files('docs', /^description.*\.md$/).map((f) => join('docs', f)).filter((f) => !descs.includes(f));
if (!descs.length) {
  bad('説明欄に貼る原稿が無い（docs/description-marketplace.md）');
  for (const o of others) note(`${o} はあるが、表や見出しを含むなら説明欄にはそのまま貼れない`);
}
for (const desc of descs) {
  const s = readFileSync(desc, 'utf8').trim();
  const firstPara = s.split('\n\n')[0];
  if (s.length >= 250) ok(`${desc}: ${s.length}字（下限250）`);
  else bad(`${desc}: ${s.length}字。下限250字に足りない`);
  if (firstPara.length < 250) bad(`${desc}: 先頭の段落が ${firstPara.length}字。250字までを書式なしの平文にする`);
  const tables = s.split('\n').filter((l) => l.trim().startsWith('|')).length;
  const heads = s.split('\n').filter((l) => l.trim().startsWith('#')).length;
  if (tables) bad(`${desc}: 表が ${tables}行ある。説明欄は書式が効かないので、罫線がそのまま文字として出る`);
  if (heads) bad(`${desc}: 見出しが ${heads}行ある。箇条書きに開く`);
  // 説明欄は書式が効かないので、強調やコード記法は記号がそのまま文字として出る
  const emph = (s.match(/\*\*/g) ?? []).length;
  const ticks = (s.match(/`/g) ?? []).length;
  if (emph) bad(`${desc}: ** が ${emph}個ある。記号がそのまま出るので外す`);
  if (ticks) bad(`${desc}: バッククォートが ${ticks}個ある。記号がそのまま出るので外す`);
  if (!tables && !heads && !emph && !ticks && firstPara.length >= 250) ok(`${desc}: 先頭 ${firstPara.length}字が平文、表・見出し・記号無し`);
}
for (const o of others) note(`${o}（GitHub 用。説明欄には貼らない）`);
const desc = descs[0];

// ---- 画像 ----
head('画像');
const icons = files('media', /\.png$/).filter((f) => f.startsWith('icon'));
const icon288 = icons.find((f) => { const s = pngSize(join('media', f)); return s && s.w === 288 && s.h === 288; });
if (icon288) ok(`アイコン 288×288: ${icon288}`);
else bad(`288×288 のアイコンが無い（あるのは ${icons.map((f) => { const s = pngSize(join('media', f)); return `${f} ${s.w}×${s.h}`; }).join(', ') || 'なし'}）`);

const th = 'media/thumbnail.png';
if (!existsSync(th)) bad('media/thumbnail.png が無い');
else {
  const s = pngSize(th);
  if (s.w === 1920 && s.h === 960) ok('サムネイル 1920×960');
  else bad(`サムネイルが ${s.w}×${s.h}。1920×960 にする`);
}

const gal = files('media', /^gallery-.*\.png$/);
if (gal.length >= 3) ok(`ギャラリー ${gal.length}点（3点以上・10点まで）`);
else bad(`ギャラリーが ${gal.length}点。3点以上が必須`);
if (gal.length > 10) bad('ギャラリーが10点を超えている');
for (const f of gal) {
  const s = pngSize(join('media', f));
  if (!s || s.w !== 1920 || s.h !== 960) bad(`${f} が ${s ? `${s.w}×${s.h}` : '読めない'}。1920×960 にする`);
}

// ---- 動画（任意。ただし機能が静止画で伝わらないものは求められる）----
head('動画');
const vids = files('demo', /\.mp4$/);
if (!vids.length) note('デモ動画が無い。動きで見せる種類のものは審査で求められることがある');
for (const f of vids) {
  const p = join('demo', f);
  const mb = statSync(p).size / 1024 / 1024;
  const s = mp4Size(p);
  if (!s) { note(`${f}: 寸法を測れなかった`); continue; }
  if (s.w === 1920 && s.h === 1080) ok(`${f}  1920×1080  ${mb.toFixed(1)}MB`);
  else bad(`${f} が ${s.w}×${s.h}。1920×1080 にする`);
  if (mb >= 250) bad(`${f} が ${mb.toFixed(1)}MB。250MB未満にする`);
}

// ---- 機械で見られない分 ----
head('手で確かめること');
console.log(`  1. アップロードすると Description 欄に manifest の文が入る。必ず上書きする
     pbcopy < ${desc ?? 'docs/description-marketplace.md'}
  2. コンソールに出ている版番号と、包んだ配布物の版番号が一致しているか
  3. 設定画面の言語。審査担当は英語で見る
  4. 動画をメールで求められた場合、ギャラリーに置くだけでは届かない。返信に添付する`);

console.log(ng ? `\n${ng}件、直すところがある。` : '\n機械で見られる分は通っている。');
process.exit(ng ? 1 : 0);
