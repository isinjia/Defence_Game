// 생성된 스킬 종류 아이콘을 투명 원본·표시용 webp·연결 정보로 만든다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { jobs, style } = require('./skill_art_catalog');

const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'assets/skills');
const srcDir = process.argv[2] || '/opt/cursor/artifacts/assets';
const partial = process.argv.includes('--partial');
const force = process.argv.includes('--force');

const FILE_MAP = {
  type_dmg: 'skill-dmg', type_aoe: 'skill-aoe', type_heal: 'skill-heal',
  type_heal_ally: 'skill-heal-ally', type_heal_all: 'skill-heal-all',
  type_buff: 'skill-buff', type_buff_all: 'skill-buff-all',
  type_shield: 'skill-shield', type_shield_all: 'skill-shield-all',
  type_crit: 'skill-crit', type_pierce: 'skill-pierce', type_multi: 'skill-multi',
  type_dot: 'skill-dot', type_stun: 'skill-stun', type_drain: 'skill-drain',
  type_debuff: 'skill-debuff', type_taunt: 'skill-taunt', type_summon: 'skill-summon',
  type_evade: 'skill-evade', type_revive: 'skill-revive',
};

async function findSource(base) {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const p = path.join(srcDir, base + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function toTransparentPng(inputPath, outPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = Buffer.from(data);
  const thresh = 28;
  const visited = new Uint8Array(width * height);
  const q = [];
  const idx = (x, y) => (y * width + x) * channels;
  const dark = (i) => px[i] <= thresh && px[i + 1] <= thresh && px[i + 2] <= thresh;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p] || !dark(idx(x, y))) return;
    visited[p] = 1; q.push(p);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (q.length) {
    const p = q.pop();
    const x = p % width, y = (p / width) | 0;
    px[p * channels + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (px[i + 3] && px[i] <= 12 && px[i + 1] <= 12 && px[i + 2] <= 12) px[i + 3] = 0;
  }
  await sharp(px, { raw: { width, height, channels } })
    .resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toFile(outPath);
}

(async () => {
  for (const dir of ['original', 'thumb', 'web']) fs.mkdirSync(path.join(folder, dir), { recursive: true });
  const cachePath = path.join(root, 'js/skill_art_data.js');
  const cached = fs.existsSync(cachePath) ? new Function(fs.readFileSync(cachePath, 'utf8') + ';return SKILL_ART_DATA;')() : {};
  const records = {};
  for (const job of jobs) {
    const base = FILE_MAP[job.id];
    if (!base) throw new Error('파일 매핑 없음: ' + job.id);
    const source = await findSource(base);
    const original = path.join(folder, 'original', job.id + '.png');
    if (!source && !fs.existsSync(original)) {
      if (partial) continue;
      throw new Error('원본 없음: ' + job.id + ' (' + base + ')');
    }
    if (source && (!fs.existsSync(original) || force)) await toTransparentPng(source, original);
    const buf = fs.readFileSync(original);
    const revision = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
    for (const [dir, size, quality] of [['thumb', 128, 88], ['web', 512, 90]]) {
      const dest = path.join(folder, dir, job.id + '.webp');
      if (cached[job.id] && cached[job.id].rev === revision && fs.existsSync(dest) && !force) continue;
      await sharp(original).resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality, alphaQuality: 100, effort: 4 }).toFile(dest);
    }
    records[job.id] = { key: job.key, name: job.name, rev: revision };
  }
  if (!partial && Object.keys(records).length !== jobs.length) throw new Error('아이콘 수 불일치');
  const out = Object.keys(cached).length && partial ? { ...cached, ...records } : records;
  fs.writeFileSync(cachePath, '// 스킬 종류 아이콘 연결 정보.\nconst SKILL_ART_DATA = ' + JSON.stringify(out, null, 2) + ';\n');
  fs.writeFileSync(path.join(folder, '제작기록.json'), JSON.stringify({
    제작방식: '내장 이미지 생성 도구', 공통요청: style,
    개별요청: jobs.map(({ id, name, design }) => ({ id, 이름: name, 외형: design })),
    아이콘: out,
  }, null, 2));
  console.log('스킬 아이콘 준비: ' + Object.keys(records).length + '종');
})().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1; });
