// 생성된 아이템 아이콘을 투명 원본·표시용 webp·연결 정보로 만든다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { jobs, style } = require('./item_art_catalog');

const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'assets/items');
const srcDir = process.argv[2] || '/opt/cursor/artifacts/assets';
const partial = process.argv.includes('--partial');

const FILE_MAP = {
  cons_potion: 'item-potion', cons_mana: 'item-mana', cons_crystal: 'item-crystal', cons_elixir: 'item-elixir',
  cons_antidote: 'item-antidote', cons_amp: 'item-amp', cons_flash: 'item-flash', cons_recall: 'item-recall',
  cons_guardcharm: 'item-guardcharm', cons_decoy: 'item-decoy',
  part_hide: 'item-hide', part_gel: 'item-gel', part_wing: 'item-wing', part_circuit: 'item-circuit',
  part_alloy: 'item-alloy', part_ecto: 'item-ecto', part_silk: 'item-silk', part_lens: 'item-lens',
  part_scale: 'item-scale', part_sun: 'item-sun', part_bone: 'item-bone', part_essence: 'item-essence',
  mat_core: 'item-core', mat_catalyst: 'item-catalyst',
  relic_magma_heart: 'item-magma-heart', relic_storm_quill: 'item-storm-quill', relic_frost_sarira: 'item-frost-sarira',
  relic_steel_nerve: 'item-steel-nerve', relic_soul_lamp: 'item-soul-lamp', relic_lucky_coin: 'item-lucky-coin',
  relic_old_chip: 'item-old-chip', relic_world_sap: 'item-world-sap', relic_rift_shard: 'item-rift-shard',
  relic_dragon_scale: 'item-dragon-scale',
  eq_sword: 'item-sword', eq_spear: 'item-spear', eq_fist: 'item-fist', eq_gun: 'item-gun', eq_bow: 'item-bow',
  eq_dagger: 'item-dagger', eq_staff: 'item-staff', eq_instr: 'item-instr', eq_shield: 'item-shield',
  eq_drone: 'item-drone', eq_armor: 'item-armor', eq_acc: 'item-acc',
};

async function findSource(base) {
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
    const p = path.join(srcDir, base + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// 거의 검은 배경을 투명으로. 가장자리부터 채우듯 어두운 픽셀을 제거한다.
async function toTransparentPng(inputPath, outPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = Buffer.from(data);
  const thresh = 28; // R,G,B 모두 이하면 배경 후보
  const visited = new Uint8Array(width * height);
  const q = [];
  const idx = (x, y) => (y * width + x) * channels;
  const dark = (i) => px[i] <= thresh && px[i + 1] <= thresh && px[i + 2] <= thresh;
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (!dark(idx(x, y))) return;
    visited[p] = 1; q.push(p);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (q.length) {
    const p = q.pop();
    const x = p % width, y = (p / width) | 0;
    const i = p * channels;
    px[i + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  // 아주 어두운 고립 배경 잔여도 살짝 정리
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (px[i + 3] === 0) continue;
    if (px[i] <= 12 && px[i + 1] <= 12 && px[i + 2] <= 12) px[i + 3] = 0;
  }
  await sharp(px, { raw: { width, height, channels } }).png().toFile(outPath);
}

(async () => {
  for (const dir of ['original', 'thumb', 'web']) fs.mkdirSync(path.join(folder, dir), { recursive: true });
  const cachePath = path.join(root, 'js/item_art_data.js');
  const cached = fs.existsSync(cachePath) ? new Function(fs.readFileSync(cachePath, 'utf8') + ';return ITEM_ART_DATA;')() : {};
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
    // 이미 투명 원본이 있으면 다시 만들지 않는다(--force 로 덮어씀)
    if (source && (!fs.existsSync(original) || process.argv.includes('--force'))) await toTransparentPng(source, original);
    const buf = fs.readFileSync(original);
    const revision = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
    for (const [dir, size, quality] of [['thumb', 128, 88], ['web', 512, 90]]) {
      const dest = path.join(folder, dir, job.id + '.webp');
      if (cached[job.id] && cached[job.id].rev === revision && fs.existsSync(dest)) continue;
      await sharp(original).resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality, alphaQuality: 100, effort: 4 }).toFile(dest);
    }
    records[job.id] = { kind: job.kind, key: job.key, name: job.name, rev: revision };
  }
  if (!partial && Object.keys(records).length !== jobs.length) throw new Error('아이콘 수 불일치');
  const out = Object.keys(cached).length && partial ? { ...cached, ...records } : records;
  fs.writeFileSync(cachePath, '// 아이템 아이콘 연결 정보. 표시 파일을 다시 만들 때 함께 갱신한다.\nconst ITEM_ART_DATA = ' + JSON.stringify(out, null, 2) + ';\n');
  fs.writeFileSync(path.join(folder, '제작기록.json'), JSON.stringify({
    제작방식: '내장 이미지 생성 도구', 공통요청: style,
    개별요청: jobs.map(({ id, name, design }) => ({ id, 이름: name, 외형: design })),
    아이콘: out,
  }, null, 2));
  console.log('아이템 아이콘 준비: ' + Object.keys(records).length + '종');
})().catch((e) => { console.error(e.stack || e.message); process.exitCode = 1; });
