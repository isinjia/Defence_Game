// 완성 원본을 보존하면서 전투용·확대용 표시 파일과 연결 정보를 만든다.
// 외형 수정·잘라내기·배경 제거는 하지 않는다. 투명 원본의 크기와 압축만 조정한다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { jobs, style } = require('./monster_art_catalog');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'assets/monsters');
const partial = process.argv.includes('--partial');
const cachePath = path.join(root, 'js/monster_art_data.js');
const cached = fs.existsSync(cachePath) ? new Function(fs.readFileSync(cachePath, 'utf8') + ';return MONSTER_ART_DATA;')() : {};
const data = new Function(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + ';return MONSTERS;')();
const extra = fs.readFileSync(path.join(root, 'js/monster_pack.js'), 'utf8').match(/const MON_NEW = (\[[\s\S]*?\n\]);/)[1];
const templates = [...data, ...new Function('return ' + extra)(), { name: '황금 코어 도마뱀', elem: 'holy', shape: 'beast', tier: 0 }];
const special = {
  '심연의 군주': ['dark', 'lord'], '화산 군주': ['fire', 'beast'], '뇌운의 왕': ['bolt', 'drone'],
  '심해 포식자': ['water', 'slime'], '타락한 성기사': ['holy', 'eye'], '그림자 군주': ['dark', 'ghost'],
};
(async () => {
  for (const dir of ['thumb', 'web']) fs.mkdirSync(path.join(folder, dir), { recursive: true });
  const records = {};
  for (const job of jobs) {
    const source = path.join(folder, 'original', job.name + '.png');
    if (!fs.existsSync(source)) { if (partial) continue; throw new Error('원본 없음: ' + job.name); }
    const input = sharp(source), meta = await input.metadata(), stats = await input.stats();
    if (!meta.hasAlpha || stats.channels[3].min !== 0) throw new Error('투명 배경 확인 필요: ' + job.name);
    if (Math.min(meta.width, meta.height) < 512) throw new Error('원본 해상도 확인 필요: ' + job.name);
    const revision = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex').slice(0, 10);
    for (const [dir, size, quality] of [['thumb', 256, 86], ['web', 1024, 91]]) {
      const dest = path.join(folder, dir, job.name + '.webp');
      if (cached[job.name] && cached[job.name].rev === revision && fs.existsSync(dest)) continue;
      await sharp(source).resize({ width: size, height: size, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality, alphaQuality: 100, effort: 4 }).toFile(dest);
    }
    const tpl = templates.find((m) => m.name === job.name), spec = special[job.name];
    if (!tpl && !spec) throw new Error('연결할 괴수 종류 없음: ' + job.name);
    records[job.name] = { elem: tpl ? tpl.elem : spec[0], shape: tpl ? tpl.shape : spec[1], tier: tpl ? tpl.tier : 7, special: !tpl, rev: revision };
  }
  if (!partial && Object.keys(records).length !== jobs.length) throw new Error('원화 수 불일치');
  fs.writeFileSync(path.join(root, 'js/monster_art_data.js'), '// 종별 원화 연결 정보. 표시 파일을 다시 만들 때 함께 갱신한다.\nconst MONSTER_ART_DATA = ' + JSON.stringify(records, null, 2) + ';\n');
  fs.writeFileSync(path.join(folder, '제작기록.json'), JSON.stringify({ 제작방식: '내장 이미지 생성 도구', 공통요청: style, 개별요청: jobs.map(({ name, design }) => ({ 이름: name, 외형: design })), 원화: records }, null, 2));
  require('./monster_art_gallery')(records, folder);
  console.log('원화 연결·표시 파일 준비: ' + Object.keys(records).length + '종');
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
