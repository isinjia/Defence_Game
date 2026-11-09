// ===== 게이트 크로니클: 지역 재앙 게이트 =====
// 플레이어 등급이 오를 때마다 한 지역에 "재앙급 게이트"가 열린다. 몇 달에 걸친 연속 사건이고,
// 막지 못하면 그 지역 지도가 바뀐다(폐허화, 위험도 상승).
// 저장: G.world.calamity = { active, done: {id: 'player'|'npc'|'fail'}, last, scars: [타일], dangerUp: {regionId: n} }

const CALAMITIES = [
  { id: 'nest',   tier: 2, region: 'gangbuk',   name: '강북 지하철 둥지',     boss: '둥지의 여왕',       elem: 'steel',
    omen: '강북 폐구 지하철 노선 전체에서 괴수 울음이 그치지 않는다. 선로 아래에 거대한 둥지가 자라고 있다.',
    spread: '둥지에서 쏟아진 무리가 강북 일대 지상으로 올라오기 시작했다.', scar: '둥지가 터지며 강북의 지하가 통째로 무너져 내렸다.' },
  { id: 'basin',  tier: 3, region: 'daegu',     name: '분지 에테르 폭주',     boss: '분지의 화신',       elem: 'fire',
    omen: '대구 분지에 고인 에테르가 끓어오른다. 계측기가 매일 최고치를 갈아 치운다.',
    spread: '분지 가장자리 마을들이 에테르 열기에 버려지고 있다.', scar: '분지가 폭발하듯 타올라 대구 외곽이 잿더미가 됐다.' },
  { id: 'abyss',  tier: 4, region: 'gangneung', name: '동해 심해 게이트',     boss: '심해의 왕',         elem: 'ice',
    omen: '동해 수심 3천 미터에서 게이트 신호가 잡혔다. 해안 전선의 괴수들이 이유 없이 물러났다. 폭풍 전의 고요다.',
    spread: '심해형 괴수가 강릉 해안 방벽을 시험하듯 두드리고 있다.', scar: '심해의 무리가 방벽을 넘어 강릉 해안선을 삼켰다.' },
  { id: 'north',  tier: 5, region: null,        name: '북부 봉쇄선 침투',     boss: '봉쇄선의 파수꾼',   elem: 'spirit',
    omen: '북부 봉쇄 구역 너머에서 무언가가 봉쇄선을 넘어오고 있다. 관리국은 보도를 막았다.',
    spread: '봉쇄선 초소 두 곳과 연락이 끊겼다.', scar: '봉쇄선이 뚫려 접경 지대가 폐허로 변했다.' },
  { id: 'strait', tier: 6, region: 'busan',     name: '대한해협 대균열',      boss: '해협의 군주',       elem: 'bolt',
    omen: '부산 앞바다가 갈라졌다. 해협 한가운데 수평선 끝까지 이어진 균열이 번개를 토한다.',
    spread: '해상 도시의 부유 구획 하나가 균열로 끌려 들어갔다.', scar: '균열이 해상 도시를 할퀴고 지나가 부산 외곽이 폐허가 됐다.' },
];
const calamityById = (id) => CALAMITIES.find((c) => c.id === id);
const CAL_MONTHS = 6;
const BASE_DANGER = REGIONS.map((r) => r.danger);
const BASE_TILES = WORLD.tiles.slice();

Object.assign(Game.prototype, {
  calState() { return this.world && this.world.calamity; },
  calGate() { const s = this.calState(); return s && s.active ? this.mapGates.find((g) => g.id === s.active.gateId) : null; },
  calamityInit() {
    const s = this.world.calamity ??= { active: null, done: {}, last: this.monthKey(), scars: [], dangerUp: {} };
    s.done ??= {}; s.scars ??= []; s.dangerUp ??= {};
    // 지도·위험도는 판마다 다시 계산한다 (이전 판의 흔적을 지우고 이번 판 흔적만 얹는다)
    WORLD.tiles.set(BASE_TILES);
    REGIONS.forEach((r, i) => { r.danger = BASE_DANGER[i]; });
    for (const i of s.scars) if (WORLD.tiles[i] === WORLD.T.PLAIN || WORLD.tiles[i] === WORLD.T.MOUNTAIN) WORLD.tiles[i] = WORLD.T.RUIN;
    for (const [rid, n] of Object.entries(s.dangerUp)) { const r = regionById(rid); if (r) r.danger = Math.min(5, r.danger + n); }
  },
  calTile(c) {
    if (c.region) return this.randomFreeTile(c.region);
    // 북부 봉쇄선과 맞닿은 땅
    const T = WORLD.T; const pool = [];
    for (let i = 0; i < WORLD.tiles.length; i++) {
      const t = WORLD.tiles[i]; if (t === T.SEA || t === T.NORTH || t === T.CITY || WORLD.region[i] < 0) continue;
      const [x, y] = WORLD.xy(i);
      if ([[0, -1], [1, 0], [-1, 0], [0, 1]].some(([dx, dy]) => WORLD.inb(x + dx, y + dy) && WORLD.type(x + dx, y + dy) === T.NORTH) && !this.objAt(x, y)) pool.push([x, y]);
    }
    return pool.length ? RNG.pick(pool) : null;
  },
  calStart(c) {
    const s = this.calState(); const key = this.monthKey();
    const pos = this.calTile(c); if (!pos) return;
    const region = WORLD.regionAt(pos[0], pos[1]).id;
    const g = { id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region, tier: c.tier, theme: c.name, elem: c.elem, born: key, deadline: 1e9, calamity: c.id, variant: 'normal' };
    this.mapGates.push(g);
    s.active = { id: c.id, gateId: g.id, start: key, region, help: false };
    this.reveal(pos[0], pos[1], 1);
    const head = `[재앙 경보] ${regionById(region).name} · ${c.name}`;
    this.log(`${head}. ${c.omen}`, 'major');
    this.rumor(c.omen);
    this.queue.push({ type: 'toast', text: `${head}. ${CAL_MONTHS}개월 안에 막지 못하면 지역이 무너진다.` });
    if (this.world) this.world.breaking = { text: head, mk: key };
  },
  calMonthly() {
    const s = this.calState(); const key = this.monthKey(); const p = this.player;
    if (!s.active) {
      if (key - (s.last || 0) < 6) return;
      const c = CALAMITIES.find((x) => !s.done[x.id] && p.rankIdx >= x.tier - 1);
      if (c) this.calStart(c);
      return;
    }
    const a = s.active; const c = calamityById(a.id); const g = this.calGate();
    if (!g) { s.done[a.id] ||= 'player'; s.active = null; s.last = key; return; }
    const e = key - a.start; const reg = regionById(a.region);
    if (e === 1) this.rumor(`${reg.name}에 들어간 협회 선발대가 ${c.name} 입구에서 밀려 나왔다. 부상자 다수.`);
    if (e === 2) {
      a.help = true;
      this.log(`${reg.name} 협회가 ${c.name} 공동 대응을 요청했다. 막아 내면 포상이 크게 오른다.`, 'major');
      this.queue.push({ type: 'toast', text: `${reg.name} 협회의 지원 요청: ${c.name}` });
    }
    if (e === 3) {
      this.log(c.spread, 'bad'); this.rumor(c.spread);
      const victims = this.adults().filter((n) => n.region === a.region && !n.isCompanion && !n.met && RNG.chance(0.05)).slice(0, 2);
      for (const v of victims) this.killNpc(v, c.name);
    }
    // 재앙 주변으로 괴수가 번진다
    if (e >= 1) for (let k = 0; k < Math.min(3, e); k++) {
      const pos = this.randomFreeTile(a.region); if (!pos) continue;
      const tier = Math.max(0, c.tier - 1 + (RNG.chance(0.3) ? 1 : 0));
      const pool = MONSTERS.filter((m) => m.elem === c.elem && Math.abs(m.tier - tier) <= 1); const tpl = RNG.pick(pool.length ? pool : MONSTERS);
      this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: a.region, tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(2, 3), born: key });
    }
    if (e >= CAL_MONTHS) this.calTimeout();
  },
  // 기한이 지나면 NPC가 막거나, 지역이 무너진다
  calTimeout() {
    const s = this.calState(); const a = s.active; const c = calamityById(a.id); const key = this.monthKey();
    const reg = regionById(a.region);
    this.mapGates = this.mapGates.filter((g) => g.id !== a.gateId);
    const heroes = this.adults().filter((n) => !n.isCompanion && n.rankIdx >= c.tier && (n.region === a.region || (typeof regionDist === 'function' && regionDist(n.region, a.region) <= 1))).sort((x, y) => y.rankIdx - x.rankIdx).slice(0, 3);
    if (heroes.length && RNG.chance(Math.min(0.75, 0.3 + heroes.length * 0.15))) {
      s.done[a.id] = 'npc';
      for (const h of heroes) { h.renown = (h.renown || 0) + 40 + c.tier * 10; h.fame = (h.fame || 0) + 10; }
      const names = heroes.map((h) => h.name).join('·');
      this.rumor(`${names}이(가) ${c.name}을(를) 막아 냈다. ${reg.name} 시민들이 거리로 나와 이름을 외친다.`);
      this.log(`${c.name}은(는) ${names}의 손에 닫혔다.`, 'major');
    } else {
      s.done[a.id] = 'fail';
      const tiles = (WORLD.regionTiles[a.region] || []).filter((i) => WORLD.tiles[i] === WORLD.T.PLAIN || WORLD.tiles[i] === WORLD.T.MOUNTAIN);
      for (const i of tiles) if (RNG.chance(0.3)) { WORLD.tiles[i] = WORLD.T.RUIN; s.scars.push(i); }
      if (reg.danger < 5) { s.dangerUp[a.region] = (s.dangerUp[a.region] || 0) + 1; reg.danger++; }
      if (this.world.damaged) this.world.damaged[a.region] = key + 3;
      this.addRep(a.region, -10);
      this.log(`[속보] ${c.scar} ${reg.name} 위험도가 올랐다.`, 'major');
      this.rumor(`아무도 ${c.name}을(를) 막지 못했다. ${c.scar}`);
      this.queue.push({ type: 'toast', text: `${c.name}을(를) 막지 못했다. ${reg.name} 일대가 폐허가 됐다.` });
    }
    s.active = null; s.last = key;
  },
  calReward(gate) {
    const s = this.calState(); const a = s.active; const c = calamityById(gate.calamity); const p = this.player;
    const lines = [];
    const mul = a && a.help ? 1.5 : 1;
    const money = Math.round(900 * RANKS[c.tier].mult ** 1.6 * mul / 10) * 10;
    const fame = Math.round((15 + c.tier * 8) * mul);
    p.money += money; p.fame += fame; this.addRep(gate.region, 40);
    p.record.calamity = (p.record.calamity || 0) + 1;
    lines.push(`재앙 저지! ${fmt(money)} 크레딧, 명성 +${fame}, ${regionById(gate.region).name} 평판 +40${mul > 1 ? ' (협회 공동 대응 포상 포함)' : ''}`);
    lines.push(`유물 발견: ${this.addRelic(null, RNG.chance(0.4) ? 3 : 2)}`);
    s.done[c.id] = 'player'; s.active = null; s.last = this.monthKey();
    const first = !Object.entries(s.done).some(([id, v]) => id !== c.id && v === 'player');
    this.lifeEvent(`${c.name}을(를) 막아 냈다.`);
    this.rumor(`${p.name}이(가) ${c.name}의 ${c.boss}을(를) 쓰러뜨렸다.${first ? ' 지역 재앙을 혼자 힘으로 막은 첫 헌터다.' : ''}`);
    this.log(`${c.name} 저지. ${regionById(gate.region).name}이(가) 무너지지 않았다.`, 'major');
    return lines;
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.calamityInit(); });
  wrap('spawnMonthly', function (base) {
    const g = this.world && this.world.calamity ? this.calGate() : null;
    if (g) g.born = this.monthKey(); // 오래된 게이트 정리에서 빠지도록
    base.call(this);
    const s = this.calState(); if (!s || !this.player) return;
    const key = this.monthKey(); if (s.key === key) return; s.key = key;
    this.calMonthly();
  });
  if (GP.ecoEligible) wrap('ecoEligible', function (base, g) { return !g.calamity && base.call(this, g); });
  wrap('gateName', function (base, g) { return g.calamity ? `${RANKS[g.tier].key}급 재앙 · ${calamityById(g.calamity).name}` : base.call(this, g); });
  wrap('gateRooms', function (base, gate) {
    const rooms = base.call(this, gate);
    const c = gate.calamity && calamityById(gate.calamity);
    if (c && rooms.length) {
      const last = rooms[rooms.length - 1];
      const boss = last.find((m) => m.boss) || last[0];
      if (boss) { boss.name = `[재앙] ${c.boss}`; boss.hp = boss.maxHp = Math.round(boss.maxHp * 1.9); boss.atk = Math.round(boss.atk * 1.15); }
      last.push(this.makeMonster(gate.tier, false, gate.elem));
    }
    return rooms;
  });
  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (gate && gate.calamity && result === 'clear' && Array.isArray(lines)) lines.push(...this.calReward(gate));
    return lines;
  });
  if (typeof GateRun !== 'undefined') {
    const baseFloors = GateRun.floorsOf;
    GateRun.floorsOf = function (gate) { return gate.calamity ? 3 : baseFloors.call(this, gate); };
  }
  if (typeof TITLES !== 'undefined') TITLES.push({ id: 'calamity_stopper', name: '재앙 저지자', how: '지역 재앙 게이트 저지', mods: { def: 0.04, hp: 0.04 }, cond: (g, p) => (p.record.calamity || 0) >= 1 });
}

// ---------- 화면 ----------
{
  const baseObj = UI.hudObjective;
  UI.hudObjective = function () {
    const html = baseObj.call(this);
    const s = G.calState(); const g = G.calGate();
    if (!s || !s.active || !g) return html;
    const c = calamityById(s.active.id); const left = Math.max(0, CAL_MONTHS - (G.monthKey() - s.active.start));
    const link = `<button class="obj-link calamity-link" data-act="focus" data-v="${g.x},${g.y}">⚠ 재앙 · ${c.name} · ${left}개월 남음</button>`;
    return html.replace('<div class="obj-title">현재 상황</div>', `<div class="obj-title">현재 상황</div>${link}`);
  };
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip) return;
    const g = G.objAt(x, y); if (!g || !g.calamity || !G.revealed(x, y)) return;
    const s = G.calState(); const c = calamityById(g.calamity);
    const left = s.active ? Math.max(0, CAL_MONTHS - (G.monthKey() - s.active.start)) : 0;
    tip.insertAdjacentHTML('beforeend', fixJosa(`<div class="small bad">재앙급 게이트 · 3개 층 · 보스 ${c.boss}. ${left}개월 안에 아무도 막지 못하면 ${regionById(g.region).name} 일대가 무너진다.${s.active && s.active.help ? ' 협회 공동 대응 포상 1.5배.' : ''}</div>`));
  };
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    const g = G.calGate && G.world && G.world.calamity ? G.calGate() : null;
    if (g && G.revealed(g.x, g.y)) {
      const c = this.ctx, s = this.tile; const [px, py] = this.toScreen(g.x + 0.5, g.y + 0.5);
      const pr = (this.t % 90) / 90;
      for (let k = 0; k < 2; k++) {
        const q = (pr + k * 0.5) % 1;
        c.strokeStyle = `rgba(255,79,106,${0.7 * (1 - q)})`; c.lineWidth = 2.5;
        c.beginPath(); c.arc(px, py, s * (0.7 + q * 2.2), 0, Math.PI * 2); c.stroke();
      }
      const gr = c.createRadialGradient(px, py, 1, px, py, s * 1.6);
      gr.addColorStop(0, 'rgba(255,79,106,.35)'); gr.addColorStop(1, 'rgba(255,79,106,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(px, py, s * 1.6, 0, Math.PI * 2); c.fill();
    }
    baseObjs.call(this);
    if (g && G.revealed(g.x, g.y)) { const [px, py] = this.toScreen(g.x + 0.5, g.y + 0.5); this.chip(px, py - this.tile * 0.75, '재앙', '#ff4f6a', '#1a0508'); }
  };
}
