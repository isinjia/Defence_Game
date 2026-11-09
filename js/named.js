// ===== 게이트 크로니클: 네임드 괴수 (영역 C) =====
// docs/헌터물_제안3.md 8. 놓친 보스(플레이어 철수·패배, NPC 공략 실패)가 사람을 먹고 자라
// 이름 붙은 재앙이 되어 몇 달 뒤 다른 지역에 나타난다. 흉터(처음 상처 입힌 속성에 저항), 처치한 헌터 수,
// 현상금이 기록되고, 쓰러뜨리면 유일 전리품. 괴수 하나의 성장 기록만 둔다(서열 구조 없음).
// 저장: world.named = [{ id, name, base, shape, elem, scar, tier, kills, victims, born, appear, region, status, bounty, slayer }]

const NAMED_EPITHET = ['외눈', '피먹은', '잿빛', '찢긴 귀', '울부짖는', '굶주린', '검은 이빨', '세 번 죽은', '도시를 삼킨', '흉터투성이', '등 굽은', '붉은 눈'];
const NAMED_MAX = 3;

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) { base.call(this); this.world.named ??= []; this.world.namedSeq ??= 1; });

  GP.namedActive = function () { return (this.world.named || []).filter((x) => x.status !== 'dead'); };
  GP.namedById = function (id) { return (this.world.named || []).find((x) => x.id === id); };

  // 놓친 보스가 네임드로
  GP.namedBirth = function ({ tier, elem, region, scar, by }) {
    const w = this.world;
    if (this.namedActive().length >= NAMED_MAX) return null;
    const m = this.makeMonster(Math.max(0, Math.min(7, tier)), true, elem);
    const base = m.name.replace(/^\[보스\] /, '');
    const nm = { id: w.namedSeq++, name: `${RNG.pick(NAMED_EPITHET)} ${base}`, base, shape: m.shape, elem: m.elem, scar: scar || null, tier: Math.min(7, tier), kills: 0, victims: [], born: this.monthKey(), appear: this.monthKey() + RNG.int(2, 4), region, status: 'lurking', bounty: Math.round(800 * RANKS[Math.min(7, tier)].mult), by };
    w.named.push(nm);
    this.rumor(`${regionById(region).name}에서 ${by === 'player' ? '' : '공략팀이 '}놓친 보스가 게이트 밖으로 달아났다는 목격담. 협회가 행방을 쫓는다.`, { kind: 'named', thread: 'named:' + nm.id, score: 1 });
    return nm;
  };

  // 나타나기·이동·성장
  GP.namedMonthly = function () {
    const mk = this.monthKey();
    for (const nm of this.namedActive()) {
      if (nm.status === 'lurking' && mk >= nm.appear) {
        const regs = REGIONS.filter((r) => r.id !== nm.region && r.id !== 'jeju');
        nm.region = RNG.pick(regs).id; nm.status = 'active'; nm.tier = Math.min(7, nm.tier + 1);
        nm.bounty = Math.round(nm.bounty * 1.5);
        this.rumor(`속보: 「${nm.name}」 ${regionById(nm.region).name}에 출현. ${RANKS[nm.tier].key}급으로 자랐다. 관리국 현상금 ${fmt(nm.bounty)} 크레딧.`, { kind: 'named', thread: 'named:' + nm.id, score: 4 });
        if (nm.by === 'player') this.log(`그때 놓친 그놈이다. 「${nm.name}」이(가) ${regionById(nm.region).name}에 나타났다.`, 'major');
        continue;
      }
      if (nm.status !== 'active') continue;
      // 헌터를 덮친다
      // 관리국 토벌대: 희생이 쌓이면 움직인다
      if (nm.kills >= 3 && RNG.chance(0.06 + nm.kills * 0.02)) {
        nm.status = 'dead'; nm.slayer = 'kama';
        this.rumor(`관리국 특별 토벌대가 「${nm.name}」을(를) 사살했다. 희생자 ${nm.kills}명.`, { kind: 'named', thread: 'named:' + nm.id, score: 2 });
        continue;
      }
      if (mk - nm.appear > 24 && RNG.chance(0.1)) { nm.status = 'dead'; nm.slayer = 'gone'; this.rumor(`「${nm.name}」이(가) 자취를 감췄다. 죽었는지, 숨었는지는 아무도 모른다.`, { kind: 'named', thread: 'named:' + nm.id }); continue; }
      if (RNG.chance(0.1)) {
        const prey = this.adults().filter((n) => n.region === nm.region && !n.isCompanion && n.rankIdx <= nm.tier && n.arch !== 'rival');
        const hunters = this.adults().filter((n) => n.region === nm.region && !n.isCompanion && !n.retired && n.rankIdx >= nm.tier);
        if (hunters.length && RNG.chance(0.22)) {
          const h = RNG.pick(hunters);
          nm.status = 'dead'; nm.slayer = h.id; h.renown = (h.renown || 0) + 30 + nm.kills * 5; h.cash = (h.cash || 0) + nm.bounty;
          this.rumor(`${RANKS[h.rankIdx].key}급 ${h.name}이(가) 「${nm.name}」을(를) 쓰러뜨렸다. 희생자 ${nm.kills}명의 원한이 풀렸다.`, { kind: 'named', thread: 'named:' + nm.id, score: 3 });
          if (this.npcFirst) this.npcFirst('named', h);
          continue;
        }
        const v = RNG.pick(prey);
        if (v) {
          this.killNpc(v, `「${nm.name}」`);
          nm.kills++; nm.victims.push(v.name);
          nm.maxTier ??= Math.min(7, nm.tier + 2);
          if (nm.kills % 4 === 0 && nm.tier < nm.maxTier) { nm.tier++; nm.bounty = Math.round(nm.bounty * 1.4); }
          this.rumor(`「${nm.name}」에게 ${v.name}이(가) 당했다. 벌써 ${nm.kills}번째 희생자.`, { kind: 'named', thread: 'named:' + nm.id, score: v.met ? 3 : 1 });
          if (v.met) this.log(`${v.name}이(가) 「${nm.name}」에게 당했다.`, 'bad');
        }
      }
      // 가끔 옆 지역으로
      if (RNG.chance(0.1)) { const opts = REGIONS.filter((r) => r.id !== 'jeju' && regionDist(r.id, nm.region) === 1); if (opts.length) nm.region = RNG.pick(opts).id; }
    }
    // 지도 위 무리로 보이기
    for (const nm of this.namedActive().filter((x) => x.status === 'active')) {
      let mob = this.mobs.find((m) => m.named === nm.id);
      if (mob && mob.region !== nm.region) { this.mobs = this.mobs.filter((m) => m !== mob); mob = null; }
      if (!mob) {
        const pos = this.randomFreeTile(nm.region); if (!pos) continue;
        this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: nm.region, tier: nm.tier, elem: nm.elem, name: `「${nm.name}」`, shape: nm.shape, count: 1 + Math.min(2, Math.floor(nm.kills / 3)), born: this.monthKey(), named: nm.id });
      } else { mob.born = this.monthKey(); mob.tier = nm.tier; }
    }
    this.mobs = this.mobs.filter((m) => !m.named || (this.namedById(m.named) && this.namedById(m.named).status === 'active'));
  };

  wrap('spawnMonthly', function (base) { base.call(this); if (this.world && this.world.named) this.namedMonthly(); });

  // 전투: 첫 괴수가 네임드
  wrap('mobRoom', function (base, mob) {
    const list = base.call(this, mob);
    const nm = mob && mob.named && this.namedById(mob.named);
    if (nm && list[0]) {
      const m = list[0]; const k = 1.4 + nm.kills * 0.08;
      m.name = `「${nm.name}」`; m.boss = true; m.named = nm.id; m.shape = nm.shape || m.shape; m.elem = nm.elem || m.elem;
      m.hp = m.maxHp = Math.round(m.hp * k * 2.2); m.atk = Math.round(m.atk * (1.15 + nm.kills * 0.03)); m.def = Math.round(m.def * 1.3);
      if (nm.scar) m.resist = nm.scar; // 흉터: 처음 상처 입힌 속성에 강하다
    }
    return list;
  });
  wrap('finishMob', function (base, mob, result, kills, hpLeft, mpLeft) {
    const nm = mob && mob.named && this.namedById(mob.named);
    const lines = base.call(this, mob, result, kills, hpLeft, mpLeft);
    if (!nm || !Array.isArray(lines)) return lines;
    const p = this.player;
    if (result === 'win') {
      nm.status = 'dead'; nm.slayer = 'player';
      const fm = 15 + Math.min(nm.kills, 10) * 2;
      p.money += nm.bounty; p.fame += fm;
      lines.push(`「${nm.name}」 토벌! 관리국 현상금 ${fmt(nm.bounty)} 크레딧, 명성 +${fm}.`);
      if (this.addRelic) lines.push(`유일 전리품: ${this.addRelic(null, Math.min(3, 1 + Math.floor(nm.tier / 3)))}`);
      this.rumor(`${p.name}이(가) 「${nm.name}」을(를) 쓰러뜨렸다.${nm.kills ? ` 희생자 ${nm.kills}명의 원한이 풀렸다.` : ''}`, { kind: 'named', thread: 'named:' + nm.id, score: 4 });
      if (nm.by === 'player') this.lifeEvent(`예전에 놓친 「${nm.name}」을(를) 끝내 쓰러뜨렸다.`);
      else this.lifeEvent(`네임드 괴수 「${nm.name}」을(를) 토벌했다.`);
      if (this.claimFirst) this.claimFirst('named');
      this.mobs = this.mobs.filter((m) => m.named !== nm.id);
    } else if (result === 'lose') {
      if (!nm.scar) nm.scar = p.element;
      this.rumor(`「${nm.name}」이(가) ${p.name}을(를) 물리쳤다. 녀석은 점점 대담해진다.`, { kind: 'named', thread: 'named:' + nm.id, score: 2 });
    }
    return lines;
  });

  // 놓친 보스
  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (gate && !gate.final && !gate.breakCity && (result === 'retreat' || result === 'lose') && gate.tier >= 1 && RNG.chance(0.3)) {
      const nm = this.namedBirth({ tier: gate.realTier ?? gate.tier, elem: gate.elem, region: gate.region, scar: this.player.element, by: 'player' });
      if (nm && Array.isArray(lines)) lines.push('<span class="bad">보스가 게이트가 닫히기 전에 바깥으로 빠져나갔다. 언젠가 다시 만날 것 같은 예감이 든다.</span>');
    }
    return lines;
  });
  if (GP.ecoResolve) wrap('ecoResolve', function (base, g) {
    const had = this.mapGates.includes(g);
    base.call(this, g);
    if (had && this.mapGates.includes(g) && g.tier >= 2 && RNG.chance(0.08)) this.namedBirth({ tier: g.realTier ?? g.tier, elem: g.elem, region: g.region, scar: null, by: 'npc' });
  });
}

if (typeof UI !== 'undefined') {
  const baseRight = UI.rightHtml;
  UI.rightHtml = function () {
    const html = baseRight.call(this);
    const act = G.namedActive().filter((x) => x.status === 'active');
    if (!act.length) return html;
    const rows = act.map((nm) => `<div class="item-row"><div class="grow"><b class="bad">「${nm.name}」</b> <span class="tag">${RANKS[nm.tier].key}급</span>
      <div class="small dim">${regionById(nm.region).name} 출몰 · 희생자 ${nm.kills}명${nm.scar ? ` · 흉터: ${ELEMENTS[nm.scar] ? ELEMENTS[nm.scar].name : nm.scar}에 강함` : ''} · 현상금 ${fmt(nm.bounty)}</div></div></div>`).join('');
    return html + `<div class="sec-title sec">현상수배 괴수</div><div class="cards">${rows}</div>`;
  };
}
