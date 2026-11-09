// 성장·밸런스 자동 시뮬레이션 (docs/성장_밸런스_분석.md 의 표를 다시 만든다)
// 사용법: node tools/balance_sim.js [판 수=4] [년 수=70] [정책=train,gate,party]
// 빌드된 dist/game.js 를 읽으므로, js/ 를 고쳤다면 먼저 bash tools/build.sh
// 스토리 사건·기습·용병·쇼핑·탑·대회는 빠져 있다. 경향을 보는 도구다.
const path = require('path');
const { chromium } = require('playwright');

const RUNS = +process.argv[2] || 4;
const YEARS = +process.argv[3] || 70;
const POLICIES = (process.argv[4] || 'train,gate,party').split(',');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(500);

  const results = await page.evaluate(({ RUNS, YEARS, POLICIES }) => {
    const out = [];
    for (const pol of POLICIES) for (let run = 0; run < RUNS; run++) {
      try { localStorage.clear(); } catch (e) { /* 무시 */ }
      G.newGame({ name: '모의' + run, gender: 'M', bg: RNG.pick(BACKGROUNDS).id, element: RNG.pick(ELEMENT_KEYS), talent: RNG.int(3, 7), traits: [], cls: rollClass(), awakenRank: 0 });
      G.save = () => {};
      const p = G.player; p.examDone = true;
      const R = { pol, bg: p.bg, rankAge: { F: G.ageYears() }, wins: 0, loses: 0, retreats: 0, btOk: 0, btTry: 0, npcDist: {} };
      if (pol === 'party') for (let i = 0; i < 3; i++) { const n = G.makeNpc(true); n.rankIdx = 0; n.isCompanion = true; n.relation = 60; G.npcs.push(n); p.party.push(n.id); }

      const autoEquip = () => {
        for (const it of [...p.inventory]) { const cur = p.equip[it.slot]; if (!cur || it.value > cur.value) G.equipItem(it.uid); }
        for (const it of p.inventory) p.money += Math.round(it.value * 0.4);
        p.inventory = [];
      };
      const runGate = (tier) => {
        const g = { id: G.nextObjId++, kind: 'gate', x: p.x, y: p.y, region: p.region, tier, theme: '모의', elem: RNG.pick(ELEMENT_KEYS), born: G.monthKey(), variant: 'normal' };
        const rooms = G.gateRooms(g); const loot = { money: 0, ether: 0, kills: 0, list: [] };
        let res = 'clear', hp = p.hp, mp = p.mp;
        for (let i = 0; i < rooms.length; i++) {
          p.hp = hp; p.mp = mp;
          const cb = new Combat(G, { allies: [G.playerUnit(), ...G.party().map((n) => G.npcUnit(n, 'ally'))], enemies: rooms[i], canFlee: false });
          cb.runAll();
          if (cb.result !== 'win') { res = 'lose'; hp = 1; break; }
          for (const k of cb.kills) { const r = G.monsterReward(k); loot.money += r.money; loot.ether += r.ether; loot.kills++; loot.list.push(k); }
          hp = cb.player.hp; mp = cb.player.mp;
          if (i < rooms.length - 1 && hp < p.maxHp * 0.35) { res = 'retreat'; break; }
          hp = Math.min(p.maxHp, hp + Math.floor(p.maxHp * 0.1));
        }
        G.finishGate(g, res, loot, Math.max(1, hp), mp);
        if (res === 'clear') R.wins++; else if (res === 'lose') R.loses++; else R.retreats++;
      };

      const y0 = G.year;
      let guard = 0;
      while (!G.over && G.year - y0 < YEARS && guard++ < 20000) {
        G.queue = [];
        autoEquip();
        if (G.remeasure && p.official < p.rankIdx) G.remeasure();
        const yy = G.year - y0;
        if (yy % 10 === 0 && !R.npcDist[yy]) { const d = RANKS.map(() => 0); for (const n of G.adults()) d[n.rankIdx]++; R.npcDist[yy] = d; }
        for (const n of G.party()) if (n.rankIdx < p.rankIdx && RNG.chance(0.15)) n.rankIdx++;
        if (p.injured > 0) { G.rest(); continue; }
        if (G.canBreakthrough()) {
          if (!G.hasCatalyst()) {
            if (!String(G.craft('catalyst')).includes('만들었다')) {
              const price = Math.round(G.catalystPrice() * G.priceMul());
              if (p.money >= price) { p.money -= price; p.items[G.catalystKey()] = (p.items[G.catalystKey()] || 0) + 1; }
            }
          }
          if (G.hasCatalyst()) {
            const r = G.breakthroughWith(p.relics.slice(0, G.relicSlots()).map((x) => x.uid));
            if (r) { R.btTry++; if (r.ok) { R.btOk++; R.rankAge[RANKS[p.rankIdx].key] = G.ageYears(); } }
            continue;
          }
          runGate(p.rankIdx); continue;
        }
        if (pol === 'train') { if (p.hp < p.maxHp * 0.5) G.rest(); else G.train(); continue; }
        if (p.hp < p.maxHp * 0.6) { if (p.money >= G.innCost()) G.stayInn(); else G.rest(); continue; }
        runGate(Math.min(7, p.rankIdx + (p.stage === 2 && RNG.chance(0.3) ? 1 : 0)));
      }
      Object.assign(R, {
        end: G.over ? G.over.reason.slice(0, 30) : '생존', final: rankLabel(p.rankIdx, p.stage), age: G.ageYears(), maxLife: Math.round(G.maxLife()),
        lifePenalty: p.lifePenalty, money: Math.round(p.money), rankPos: G.ranking ? `${G.ranking().pos}/${G.ranking().list.length}` : '-',
      });
      out.push(R);
    }
    return out;
  }, { RUNS, YEARS, POLICIES });

  const keys = RANKS_KEYS();
  function RANKS_KEYS() { return ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS']; }
  console.log('\n== 판별 결과 ==');
  for (const r of results) {
    console.log(`${r.pol.padEnd(6)} ${r.bg.padEnd(8)} 최종 ${r.final.padEnd(8)} ${r.age}세/${r.maxLife} 수명손상 ${String(r.lifePenalty).padStart(3)}년 승/패/철수 ${r.wins}/${r.loses}/${r.retreats} 돌파 ${r.btOk}/${r.btTry} 크레딧 ${r.money} 랭킹 ${r.rankPos} | ${r.end}`);
  }
  console.log('\n== 등급 도달 나이 (정책별 최소~최대) ==');
  for (const pol of POLICIES) {
    const rs = results.filter((r) => r.pol === pol);
    const row = keys.map((k) => { const v = rs.map((r) => r.rankAge[k]).filter((x) => x != null); return v.length ? `${k} ${Math.min(...v)}~${Math.max(...v)}${v.length < rs.length ? `(${v.length}/${rs.length})` : ''}` : `${k} -`; });
    console.log(pol.padEnd(6), row.join(' | '));
  }
  console.log('\n== NPC 성인 등급 분포 (첫 판, F..SS) ==');
  const first = results[0];
  for (const [y, d] of Object.entries(first.npcDist)) { const tot = d.reduce((a, b) => a + b, 0); console.log(`${y}년: ${d.join(', ')}  · S 이상 ${d[6] + d[7]}명 (${Math.round(((d[6] + d[7]) / tot) * 100)}%)`); }
  if (errors.length) console.log('\n스크립트 오류:', errors.slice(0, 5));
  await browser.close();
})();
