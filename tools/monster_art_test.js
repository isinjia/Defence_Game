// 종별 이미지 연결·실제 파일 로드·도감 비공개 규칙·전투 배치를 검사한다.
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { jobs } = require('./monster_art_catalog');
const root = path.resolve(__dirname, '..');
const partial = process.argv.includes('--partial');

(async () => {
  const data = new Function(fs.readFileSync(path.join(root, 'js/monster_art_data.js'), 'utf8') + ';return MONSTER_ART_DATA;')();
  if (!partial && Object.keys(data).length !== jobs.length) throw new Error('전체 원화 연결 수가 다름');
  let thumbs = 0, large = 0;
  for (const name of Object.keys(data)) {
    for (const [dir, size] of [['thumb', 256], ['web', 1024]]) {
      const file = path.join(root, 'assets/monsters', dir, name + '.webp');
      const image = sharp(file), meta = await image.metadata(), stats = await image.stats();
      if (!meta.hasAlpha || stats.channels[3].min !== 0 || meta.width !== size || meta.height !== size) throw new Error('투명 배경 또는 표시 크기 오류: ' + name);
      if (dir === 'thumb') thumbs += fs.statSync(file).size; else large += fs.statSync(file).size;
    }
  }
  console.log(`통과 이미지 ${Object.keys(data).length}종 · 투명도·크기 · 작은 그림 합계 ${Math.round(thumbs / 1024)}킬로바이트 · 확대 그림 합계 ${Math.round(large / 1024)}킬로바이트`);
  const shots = path.join(root, 'docs/몬스터_원화'); fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [width, height, label] of [[320, 568, '작은_휴대전화'], [412, 915, '휴대전화'], [1440, 900, '큰_화면']]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(() => { window.TUT_AUTO_TAP = true; });
      await page.goto('file://' + path.join(root, 'index.html'));
      await page.evaluate((partial) => {
        UI.handle('new'); UI.handle('mode-manual'); UI.create.name = '원화검사'; UI.handle('c-start');
        for (let i = 0; i < 10; i++) UI.closeModal();
        UI.exam = null; if (UI.dlg) UI.dlgEnd(); G.queue = []; UI.ctx = null; G.player.examDone = true;
        if (!partial) {
          const missing = [...MONSTERS, MON_TREASURE].filter((m) => !MonsterArt.data[m.name]);
          if (missing.length) throw new Error('연결되지 않은 괴수 있음');
          if (MonsterArt.resolve({ name: '[최종] 심연의 군주', shape: 'lord', _tpl: '서리 늑대' }) !== '심연의 군주') throw new Error('최종 보스가 일반 원화로 바뀜');
          if (MonsterArt.resolve({ name: '[보스] 화산 군주', shape: 'beast', _tpl: '가시털 들개' }) !== '화산 군주') throw new Error('레이드 전용 원화 선택 실패');
        }
        if (MonsterArt.resolve({ name: '「붉은 서리 늑대」', shape: 'beast', elem: 'fire' }) !== '서리 늑대') throw new Error('별명 붙은 괴수 연결 실패');
        const before = JSON.stringify({ p: G.player, world: G.world });
        const host = document.createElement('div'); host.id = '원화검사'; host.style.cssText = 'position:fixed;inset:0;z-index:2000;overflow:auto;background:#101b2a;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px';
        host.innerHTML = Object.keys(MonsterArt.data).map((name) => `<div style="text-align:center;color:#d3dfdc">${MonsterArt.image({ name }, 170)}<p style="font-size:11px">${name}</p></div>`).join('');
        document.body.appendChild(host);
        if (host.querySelector('svg')) throw new Error('도형 몬스터가 남아 있음');
        if (before !== JSON.stringify({ p: G.player, world: G.world })) throw new Error('외형 표시로 게임 상태 변경');
      }, partial);
      await page.evaluate(async () => { for (const img of document.querySelectorAll('#원화검사 img')) img.loading = 'eager'; await Promise.all([...document.querySelectorAll('#원화검사 img')].map((img) => img.decode())); });
      await page.locator('#원화검사').screenshot({ path: path.join(shots, label + '_원화.png') });
      await page.evaluate(() => {
        document.getElementById('원화검사').remove();
        const name = '가시털 들개'; G.player.dex[name] = {};
        if (UI.dexDetail(name).includes('data-act="monster-art"')) throw new Error('미발견 괴수 원화 공개됨');
        G.player.dex[name] = { seen: 1, kills: 0 }; UI.handle('monster-art', name);
      });
      await page.locator('.monster-art-full img').evaluate((img) => img.decode());
      const full = await page.locator('.monster-art-full img').boundingBox();
      if (!full || full.width > width + 1 || full.height > height) throw new Error('확대 원화가 화면을 벗어남');
      await page.screenshot({ path: path.join(shots, label + '_확대.png') });
      await page.evaluate(() => {
        UI.handle('dex-mon', '가시털 들개');
        if (!document.querySelector('.monster-art-action')) throw new Error('확대 뒤 도감 복귀 실패');
        UI.closeModal(); UI.ctx = null; G.queue = [];
        UI.renderGame(); const p = G.player;
        const m = { id: 987654, kind: 'mob', x: p.x, y: p.y, region: p.region, tier: 1, elem: 'fire', name: '불꽃 쥐', shape: 'beast', count: 3, born: G.monthKey() };
        G.mobs.push(m); UI.startMob(m.id);
      });
      await page.waitForSelector('#foes .monster-art');
      await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#foes .monster-art')].map((img) => img.decode())); });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(shots, label + '_전투.png') });
      const bounds = await page.evaluate(() => {
        const box = document.getElementById('modal-box');
        return { scroll: box.scrollHeight, height: box.clientHeight, art: [...document.querySelectorAll('#foes .monster-art')].every((img) => img.complete && img.naturalWidth > 0) };
      });
      if (!bounds.art) throw new Error('전투 원화 로드 실패');
      if (errors.length) throw new Error(errors[0]);
      console.log(`통과 ${label} · 전 종 로드·원화 확대·도감 복귀·실제 전투 (화면 ${bounds.scroll}/${bounds.height})`);
      await page.close();
    }
    const gallery = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await gallery.goto('file://' + path.join(root, 'assets/monsters/gallery.html'));
    await gallery.evaluate(async () => { const images = [...document.querySelectorAll('.card img')]; images.forEach((img) => img.loading = 'eager'); await Promise.all(images.map((img) => img.decode())); });
    await gallery.screenshot({ path: path.join(shots, '원화_모음.png'), fullPage: true });
    await gallery.locator('.card').first().click(); await gallery.locator('#art-image').evaluate((img) => img.decode()); await gallery.keyboard.press('Escape');
    if (!await gallery.locator('.viewer').evaluate((el) => el.classList.contains('hidden'))) throw new Error('원화집 닫기 실패');
    console.log('통과 원화집 · 전 종 로드·확대·닫기'); await gallery.close();
  } finally { await browser.close(); }
})().catch((e) => { console.error(e.message); process.exitCode = 1; });
