// ===== 게이트 크로니클: 대형 연합 레이드 (영역 A-β, docs/헌터물_제안2.md 5) =====
// 분기마다(3달에 한 번) 관리국이 큰 게이트에 길드 연합 공대를 소집한다. C급 이상이면 플레이어에게도 소집 공문이 온다.
//  - 공대: 내 파티 + 연합 길드 대표 NPC(전장 인원이 6명을 넘지 않게 1~3명). 남은 연합 파티는 후방 지원 효과(공격·방어 소폭 상승).
//  - 공대장: 참가자 중 등급·명성이 가장 높은 사람. 역할(방어·지원·공격)은 직업으로 정한다.
//  - 보스는 보스 패턴(js/boss_pattern.js)·약점 파괴(js/break_gauge.js)를 그대로 쓴다. 공대 인원만큼 체력이 크다.
//  - 끝나면 기여도(UI.combatStats, js/mvp.js)로 전리품을 나눈다. 길드 위세·명성·소문이 한 번에 움직인다.
//  - 거절하면 다음 달에 NPC 연합끼리 결과가 난다(소문·길드 위세).

const RAID_MIN_RANK = 3; // C급
const RAID_BOSS = {
  fire: ['화산 군주', 'beast'], bolt: ['뇌운의 왕', 'drone'], water: ['심해 포식자', 'slime'],
  wood: ['고목 거신', 'golem'], holy: ['타락한 성기사', 'eye'], dark: ['그림자 군주', 'ghost'],
};
const RAID_ROLE = { tank: '방어', support: '지원' };

Object.assign(Game.prototype, {
  raidRole(cls) { const r = (classById(cls) || {}).role; return RAID_ROLE[r] || '공격'; },
  // 분기 공고
  raidMonthly() {
    const w = this.world; const p = this.player; const mk = this.monthKey();
    if (w.raid && w.raid.status === 'open' && mk >= w.raid.due) this.raidResolveNpc(w.raid);
    if (w.raid && w.raid.status !== 'open' && mk - w.raid.mk >= 3) w.raid = null;
    if (w.raid || mk % 3 !== 0) return;
    const tier = Math.max(4, Math.min(7, Math.max(p.rankIdx + 1, 5)));
    const elem = RNG.pick(ELEMENT_KEYS);
    const reg = RNG.pick(REGIONS.filter((r) => r.id !== 'jeju'));
    const gids = Object.keys(GUILDS);
    const guilds = gids.map((g) => [g, Math.random()]).sort((a, b) => a[1] - b[1]).slice(0, 3).map((x) => x[0]);
    if (p.guild && !guilds.includes(p.guild)) guilds[0] = p.guild;
    const boss = RAID_BOSS[elem] || ['재앙의 군주', 'golem'];
    w.raid = { id: mk, mk, due: mk + 1, tier, elem, region: reg.id, boss: boss[0], shape: boss[1], guilds, status: 'open' };
    this.rumor(`관리국 소집: ${reg.name} ${RANKS[tier].key}급 대형 게이트에 연합 공대 편성. ${guilds.map((g) => GUILDS[g].name).join('·')} 참가. 보스 「${boss[0]}」.`);
    if (p.examDone && p.rankIdx >= RAID_MIN_RANK && !this.over) this.queue.push({ type: 'raid' });
  },
  // 플레이어 없이 결과가 난다
  raidResolveNpc(r) {
    const pw = r.guilds.reduce((a, g) => a + this.guildPower(g), 0) / Math.max(1, r.guilds.length);
    const ok = RNG.chance(Math.max(0.35, Math.min(0.9, 0.45 + pw / 400)));
    r.status = ok ? 'npc_clear' : 'npc_fail';
    const reg = regionById(r.region);
    const pres = this.world.guildPrestige || (this.world.guildPrestige = {});
    for (const g of r.guilds) pres[g] = Math.max(10, (pres[g] || 0) + (ok ? 3 : -2));
    this.rumor(ok ? `${reg.name} 연합 레이드 성공. ${GUILDS[r.guilds[0]].name} 주도로 「${r.boss}」 토벌.` : `${reg.name} 연합 레이드 실패. 「${r.boss}」 앞에서 공대가 무너졌다. 사상자 집계 중.`);
  },
  // 연합 대표: 연합 길드 소속 NPC 중 강한 순
  raidReps(r, n) {
    const mine = new Set(this.player.party || []);
    const pool = this.npcs.filter((x) => x.alive && !x.child && !mine.has(x.id) && x.guild && r.guilds.includes(x.guild) && x.rankIdx >= r.tier - 2)
      .sort((a, b) => b.rankIdx - a.rankIdx || (b.stage || 0) - (a.stage || 0));
    const out = [];
    for (const g of r.guilds) { const x = pool.find((y) => y.guild === g && !out.includes(y)); if (x && out.length < n) out.push(x); }
    for (const x of pool) if (out.length < n && !out.includes(x)) out.push(x);
    return out;
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) {
    const r = base.call(this);
    this.world.raid ??= null; this.world.guildPrestige ??= {};
    this.player.raids ??= 0;
    return r;
  });
  wrap('worldMonthly', function (base) { const r = base.call(this); try { this.raidMonthly(); } catch (e) { /* 레이드 공고 실패는 진행을 막지 않는다 */ } return r; });
}

Object.assign(UI, {
  // 소집 공문 + 공대 편성
  raidPlan() {
    const r = G.world.raid; if (!r) return null;
    const party = this.allyUnits();
    const repN = Math.max(1, Math.min(3, 6 - party.length));
    const reps = G.raidReps(r, repN);
    const repUnits = reps.map((n) => G.npcUnit(n, 'ally'));
    // 대표가 모자라면 관리국 지원 헌터
    for (let i = repUnits.length; i < repN; i++) {
      const g = r.guilds[i % r.guilds.length];
      const u = G.npcUnit({ id: -880 - i, name: `${GUILDS[g].name.split(' ')[0]} 헌터`, rankIdx: Math.max(0, r.tier - 1), stage: 1, element: GUILDS[g].elem, personality: 'just', cls: RNG.pick(['swordsman', 'guardian', 'healer', 'archer']) }, 'ally');
      delete u.npcId; u.portrait = { seed: 'raid' + g + i, gender: RNG.chance(0.5) ? 'M' : 'F', elem: GUILDS[g].elem }; u.guild = g;
      repUnits.push(u);
    }
    for (let i = 0; i < reps.length; i++) repUnits[i].guild = reps[i].guild;
    const support = Math.max(0, r.guilds.length - 1);
    // 공대장: 등급이 가장 높은 사람(같으면 플레이어)
    const p = G.player;
    const cand = [{ name: p.name, rank: p.rankIdx + (p.fame > 300 ? 0.5 : 0), me: true }, ...reps.map((n) => ({ name: n.name, rank: n.rankIdx, id: n.id }))];
    const lead = cand.reduce((a, b) => (b.rank > a.rank ? b : a));
    return { r, party, repUnits, reps, support, lead };
  },
  showRaid() {
    const plan = this.raidPlan(); if (!plan) return this.processQueue();
    const { r, party, repUnits, support, lead } = plan; this._raidPlan = plan;
    const reg = regionById(r.region);
    const row = (u, tag) => `<div class="raid-m">${this.unitSprite(u, 30)}<span class="raid-n">${u.isPlayer ? '나' : u.name}</span><span class="tag tiny">${G.raidRole(u.cls)}</span>${tag ? `<span class="tag tiny dim">${tag}</span>` : ''}</div>`;
    this.modal(`<div class="eyebrow">관리국 소집 · 연합 레이드</div><h3>${reg.name} ${RANKS[r.tier].key}급 대형 게이트</h3>
      <p class="small">보스 「${r.boss}」 ${FX.elemIcon(r.elem, 12)} · 연합: ${r.guilds.map((g) => `<b style="color:${GUILDS[g].color}">${GUILDS[g].name}</b>`).join(' · ')}</p>
      <p class="small">공대장 <b>${lead.me ? '나' : lead.name}</b>${lead.me ? ' — 공대를 이끈다. 성공하면 명성이 더 오른다.' : ''}</p>
      <div class="raid-list">${party.map((u) => row(u, '내 파티')).join('')}${repUnits.map((u) => row(u, u.guild && GUILDS[u.guild] ? GUILDS[u.guild].name.split(' ')[0] : '연합')).join('')}</div>
      <p class="small dim">후방 지원 ${support}개 파티: 공대 공격·방어 +${support * 6}%. 전리품은 기여도(피해·치유·받아 냄·그로기)대로 나눈다.</p>
      <div class="row end"><button class="ghost" data-act="raid-skip">이번엔 빠진다</button><button class="primary" data-act="raid-go">공대에 합류한다</button></div>`, 'event-box raid-box');
  },
  startRaid() {
    const plan = this._raidPlan || this.raidPlan(); if (!plan) return;
    const { r, party, repUnits, support } = plan;
    const allies = [...party, ...repUnits];
    for (const u of allies) { u.atk = Math.round(u.atk * (1 + 0.06 * support)); u.def = Math.round(u.def * (1 + 0.06 * support)); }
    const n = allies.length;
    const boss = G.makeMonster(r.tier, true, r.elem);
    Object.assign(boss, { name: `[레이드] ${r.boss}`, elem: r.elem, shape: r.shape, raidBoss: true });
    boss.maxHp = boss.hp = Math.round(boss.hp * (1 + 0.3 * (n - 1)) * 1.4);
    boss.atk = Math.round(boss.atk * (1 + 0.05 * (n - 1)));
    const adds = [G.makeMonster(Math.max(0, r.tier - 1), false, r.elem), G.makeMonster(Math.max(0, r.tier - 1), false, r.elem)];
    for (const a of adds) { a.maxHp = a.hp = Math.round(a.hp * (1 + 0.15 * (n - 1))); }
    r.status = 'joined';
    this.closeModal();
    this.ctx = { kind: 'raid', raid: r, plan, elem: r.elem, combat: new Combat(G, { allies, enemies: [boss, ...adds], canFlee: true, title: `연합 레이드 · ${r.boss}` }) };
    this.openCombat();
  },
  skipRaid() {
    const r = G.world.raid; this.closeModal();
    if (r) G.log(`연합 레이드 소집에 응하지 않았다. 다음 달에 결과가 나온다.`, '');
    this.processQueue();
  },
  finishRaid() {
    const c = this.ctx; const cb = c.combat; const r = c.raid; const p = G.player;
    p.hp = Math.max(1, cb.player.hp); p.mp = cb.player.mp;
    const reg = regionById(r.region);
    const lines = [];
    const stats = this.combatStats(cb);
    const total = stats.reduce((a, s) => a + Math.max(0, s.score), 0) || 1;
    const me = stats.find((s) => s.unit.isPlayer);
    const myParty = new Set([cb.player.id, ...G.party().map((n) => 'npc' + n.id)]);
    const partyShare = stats.filter((s) => myParty.has(s.unit.id)).reduce((a, s) => a + Math.max(0, s.score), 0) / total;
    const mvp = stats[0];
    const pres = G.world.guildPrestige || (G.world.guildPrestige = {});
    if (cb.result === 'win') {
      r.status = 'clear'; p.raids = (p.raids || 0) + 1;
      const pool = Math.round(G.monsterReward({ tier: r.tier, boss: true }).money * 12);
      const share = Math.max(0.12, partyShare);
      const money = Math.round(pool * share);
      const lead = c.plan.lead && c.plan.lead.me;
      const fame = Math.round((8 + r.tier * 3) * (lead ? 1.5 : 1) * (0.6 + share));
      lines.push(`「${r.boss}」 토벌 성공. 공대 전리품 ${fmt(pool)} 크레딧 중 우리 몫 ${Math.round(share * 100)}%.`);
      p.money += money;
      lines.push(`(크레딧 +${fmt(money)}` + G.gain({ fame, merit: 6 + r.tier }).trim().replace(/^\(/, ', '));
      if (mvp && mvp.unit.isPlayer) { lines.push('공대 MVP로 뽑혔다. 보스의 핵을 받았다.' + G.gain({ relic: 1 })); }
      for (const g of r.guilds) pres[g] = Math.max(10, (pres[g] || 0) + (g === p.guild ? 5 : 3));
      // 함께 싸운 연합 대표와 가까워진다
      for (const n of c.plan.reps) G.changeRel(n, mvp && mvp.unit.npcId === n.id ? 4 : 2);
      G.rumor(`${reg.name} 연합 레이드 성공! 「${r.boss}」 토벌. MVP ${mvp ? (mvp.unit.isPlayer ? p.name : mvp.unit.name) : '-'}${lead ? `, 공대장 ${p.name}` : ''}.`);
      G.lifeEvent(`${reg.name} 연합 레이드에서 「${r.boss}」를 토벌했다.`);
    } else {
      r.status = cb.result === 'flee' ? 'fled' : 'fail';
      for (const g of r.guilds) pres[g] = Math.max(10, (pres[g] || 0) - 2);
      if (cb.result === 'flee') { lines.push('공대에서 이탈했다. 남은 공대원들이 겨우 철수했다.'); lines.push(G.gain({ fame: -5 }).trim()); }
      else { lines.push('공대가 무너졌다. 구조대에 실려 나왔다.'); lines.push(G.gain({ injure: 2 }).trim()); }
      G.rumor(`${reg.name} 연합 레이드 ${cb.result === 'flee' ? '중도 철수' : '실패'}. 「${r.boss}」는 아직 살아 있다.`);
    }
    if (cb.result !== 'flee') { const lost = G.partyCasualties(cb.units); if (lost.length) lines.push(`${lost.join(', ')}이(가) 쓰러져 돌아오지 못했다…`); }
    const bars = stats.map((s) => `<div class="mvp-row ${s === mvp ? 'top' : ''}"><span class="mvp-n">${s.unit.isPlayer ? '나' : s.unit.name.replace(/\(.*\)$/, '')}</span><span class="mvp-bar"><i style="width:${Math.round((Math.max(0, s.score) / total) * 100)}%"></i></span><span class="num small">${Math.round((Math.max(0, s.score) / total) * 100)}%</span></div>`).join('');
    this.ctx = null; G.save();
    this.closeModal(); this.renderGame();
    this.modal(`<div class="eyebrow">연합 레이드 · ${reg.name}</div><h3>${cb.result === 'win' ? '토벌 성공' : cb.result === 'flee' ? '이탈' : '실패'}</h3>${lines.filter(Boolean).map((l) => `<p>${fixJosa(l)}</p>`).join('')}
      <div class="sec-title small">기여도</div><div class="mvp-list raid-share">${bars}</div>
      <div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },
});

{
  const baseQueue = UI.processQueue;
  UI.processQueue = function (...a) {
    if (!this.modalOpen() && G.queue.length && G.queue[0].type === 'raid') {
      G.queue.shift();
      const r = G.world.raid;
      if (r && r.status === 'open' && !G.over) return this.showRaid();
      return this.processQueue();
    }
    return baseQueue.apply(this, a);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v, ...rest) {
    if (act === 'raid-go') return this.startRaid();
    if (act === 'raid-skip') return this.skipRaid();
    return baseHandle.call(this, act, v, ...rest);
  };
  const baseFinish = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function (...a) {
    if (this.ctx && this.ctx.kind === 'raid') return this.finishRaid();
    return baseFinish.apply(this, a);
  };
}
