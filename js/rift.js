// ===== 대균열(비경): 기간 한정 공동 탐색 =====
// 설계: docs/귀곡팔황_대조.md 3장 10
//  - 1~2년에 한 번, 한 지역에 '대균열'이 한 달 동안 열린다. 들어가는 NPC 명단이 뉴스로 나온다.
//  - 안은 네 구역 + 균열핵. 보물 방, 괴수, 다른 헌터 파티(협력·약탈·지나치기)를 만난다.
//  - 균열이 닫히면 NPC들의 생사와 얻은 것이 뉴스가 되고, 약탈은 원한으로 남는다.

const RIFT_STEPS = 4;

Object.assign(Game.prototype, {
  riftInit() {
    if (!this.world) return;
    this.world.rift ??= { next: this.monthKey() + RNG.int(10, 18), active: null };
    if (this.player) this.player.riftRun ??= null;
  },
  riftActive() { const r = this.world && this.world.rift && this.world.rift.active; return r && r.mk === this.monthKey() ? r : null; },
  riftHere() { const r = this.riftActive(); return r && r.region === this.player.region ? r : null; },
  riftMonthly() {
    const R = this.world.rift; const mk = this.monthKey();
    // 지난달 균열 마감
    if (R.active && R.active.mk < mk && !R.active.closed) this.riftClose(R.active);
    if (mk < R.next) return;
    const regs = REGIONS.filter((r) => r.id !== 'jeju');
    const reg = RNG.pick(regs);
    const pool = this.npcs.filter((n) => n.alive && !n.child && !n.isCompanion && n.rankIdx >= 2).sort((a, b) => b.rankIdx - a.rankIdx || RNG.next() - 0.5);
    const npcs = pool.slice(0, 14).sort(() => RNG.next() - 0.5).slice(0, RNG.int(5, 8)).map((n) => n.id);
    R.active = { mk, region: reg.id, npcs, tier: Math.max(2, Math.min(7, Math.round(npcs.reduce((a, id) => a + this.npcById(id).rankIdx, 0) / Math.max(1, npcs.length)))), entered: false, met: [], robbed: [], closed: false };
    R.next = mk + RNG.int(12, 24);
    const names = npcs.slice(0, 4).map((id) => this.npcById(id).name).join(', ');
    this.rumor(`[속보] ${reg.name}에 대균열 개방! 한 달 뒤 닫힌다. ${names} 등 ${npcs.length}명이 진입을 신청했다.`);
    this.log(`${reg.name}에 대균열이 열렸다. 이번 달 안에 그곳 도시에서 들어갈 수 있다.`, 'major');
  },
  riftClose(r) {
    r.closed = true;
    const out = [];
    for (const id of r.npcs) {
      const n = this.npcById(id); if (!n || !n.alive) continue;
      if (r.robbed.includes(id)) { n.relation = Math.max(-100, n.relation - 10); continue; }
      const roll = RNG.next();
      if (roll < 0.12) { this.killNpc(n, '대균열에서 실종', null); out.push(`${n.name} 실종`); }
      else if (roll < 0.4) { n.rankIdx = Math.min(7, n.rankIdx + (RNG.chance(0.3) ? 1 : 0)); n.stage = Math.min(2, (n.stage || 0) + 1); out.push(`${n.name} 보물 획득`); }
    }
    this.rumor(`대균열이 닫혔다. ${out.length ? out.join(', ') : '모두 무사히 돌아왔다'}.${r.entered ? ` ${this.player.name}도 그 안에 있었다.` : ''}`);
  },
  riftEnter() {
    const r = this.riftHere(); const p = this.player;
    if (!r || r.entered || !this.onCity()) return false;
    r.entered = true;
    p.riftRun = { step: 0, gains: [] };
    return true;
  },
  // 다음 구역의 사건을 고른다
  riftRoll() {
    const r = this.riftActive(); const run = this.player.riftRun;
    if (!r || !run) return null;
    if (run.step >= RIFT_STEPS) return { kind: 'core' };
    const left = r.npcs.filter((id) => !r.met.includes(id) && this.npcById(id) && this.npcById(id).alive);
    const w = [3, 3, left.length ? 3 : 0];
    const kind = RNG.weighted(['treasure', 'monster', 'npc'], w);
    if (kind === 'npc') { const id = RNG.pick(left); r.met.push(id); return { kind, npc: id }; }
    return { kind };
  },
  riftGain(o) { const s = this.gain(o); this.player.riftRun && this.player.riftRun.gains.push(s); return s; },
  riftLeave(why) {
    const p = this.player; const run = p.riftRun; if (!run) return '';
    p.riftRun = null;
    this.advanceDays(3 + run.step * 4, { eventChance: 0 });
    this.lifeEvent(`대균열에서 돌아왔다${why ? ` (${why})` : ''}.`);
    return `대균열을 빠져나왔다. ${run.step}개 구역을 지났다.`;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.riftInit(); });
  wrap('worldMonthly', function (base) { base.call(this); this.riftMonthly(); });
}

// ---------- 화면 ----------
{
  const baseCity = UI.cityHtml;
  UI.cityHtml = function () {
    const html = baseCity.call(this);
    const r = G.riftHere(); if (!r) return html;
    const banner = `<div class="break-banner" style="border-color:#8f7be8"><b>대균열 개방</b> · 이번 달 안에 닫힌다. ${r.npcs.length}명이 들어갔다. ${r.entered ? '<span class="dim">(이미 다녀왔다)</span>' : `<button class="primary sm" data-act="rift-enter">들어간다</button>`}</div>`;
    const at = html.indexOf('<div class="city-body">');
    return at < 0 ? html + banner : html.slice(0, at) + banner + html.slice(at);
  };
  UI.riftStep = function () {
    const p = G.player; const run = p.riftRun; const r = G.riftActive();
    if (!run || !r) { p.riftRun = null; return this.processQueue(); }
    const ev = G.riftRoll(); this.riftEv = ev;
    const head = `<div class="eyebrow">대균열 · ${run.step < RIFT_STEPS ? `${run.step + 1}구역` : '균열핵'} / ${RIFT_STEPS}</div>`;
    const leave = '<button class="ghost" data-act="rift-leave">빠져나간다</button>';
    if (ev.kind === 'core') return this.modal(`${head}<h3>균열핵</h3><p class="event-text">공간이 접힌 한가운데에 맥동하는 핵이 있다. 그것을 지키는 무언가가 눈을 뜬다.</p>
      <div class="cards"><button class="choice-btn" data-act="rift-do" data-v="fight">핵을 깨뜨린다</button></div><div class="row end">${leave}</div>`, 'event-box');
    if (ev.kind === 'treasure') return this.modal(`${head}<h3>잠든 보물고</h3><p class="event-text">무너진 회랑 끝, 에테르 결정이 자라난 방. 반짝이는 것들이 쌓여 있다. 함정일 수도 있다.</p>
      <div class="cards"><button class="choice-btn" data-act="rift-do" data-v="loot">쓸어 담는다</button><button class="choice-btn" data-act="rift-do" data-v="careful">조심스럽게 하나만</button></div><div class="row end">${leave}</div>`, 'event-box');
    if (ev.kind === 'monster') return this.modal(`${head}<h3>균열의 짐승들</h3><p class="event-text">뒤틀린 공간에서 괴수 떼가 기어 나온다.</p>
      <div class="cards"><button class="choice-btn" data-act="rift-do" data-v="fight">돌파한다</button></div><div class="row end">${leave}</div>`, 'event-box');
    const n = G.npcById(ev.npc);
    return this.modal(`${head}<div class="ambush">${this.npcPortrait(n, 96)}<div><h3>${n.name}</h3><div class="row small">${this.rankTag(n.rankIdx, n.stage)} ${this.elemTag(n.element)} <span class="dim">관계 ${Math.round(n.relation)}</span></div></div></div>
      <p class="event-text">${n.name}의 파티와 마주쳤다. 그들 뒤에 커다란 보물 상자가 보인다.</p>
      <div class="cards"><button class="choice-btn" data-act="rift-do" data-v="coop">함께 싸우고 나눈다</button><button class="choice-btn" data-act="rift-do" data-v="rob">보물을 빼앗는다</button><button class="choice-btn" data-act="rift-do" data-v="pass">못 본 척 지나친다</button></div>
      <div class="row end">${leave}</div>`, 'event-box');
  };
  const next = (msg) => { const p = G.player; if (p.riftRun) p.riftRun.step++; G.queue.unshift({ type: 'rift' }); return msg; };
  UI.riftDo = function (v) {
    const p = G.player; const ev = this.riftEv; const r = G.riftActive(); if (!ev || !r || !p.riftRun) return;
    const tier = Math.min(7, Math.max(r.tier, p.rankIdx));
    this.closeModal();
    const fightOn = (spec) => { G.storyFight({ ...spec, lose: { text: '균열 밖으로 튕겨 나왔다. 몸이 성치 않다.', gain: { injure: 2 }, after: (g) => { UI.riftLostMsg = g.riftLeave('부상'); } } }); return this.processQueue(); };
    if (ev.kind === 'core') {
      return fightOn({ title: '균열핵의 수호자', mobs: { tier: Math.min(7, tier + 1), n: 1, boss: true, shape: 'eye', elem: 'dark', name: '[균열핵] 수호자' },
        win: { text: '균열핵이 깨지며 응축된 에테르가 쏟아졌다.', gain: { ether: 200, relic: 2, catalyst: 1, fame: 20 }, after: (g) => { g.lifeEvent('대균열의 핵을 깨뜨렸다.'); g.rumor(`${g.player.name}이(가) 대균열의 핵을 깨뜨렸다!`); g.player.riftRun.step++; g.queue.unshift({ type: 'riftEnd' }); } } });
    }
    if (ev.kind === 'monster') return fightOn({ title: '균열의 짐승들', mobs: { tier, n: 3 }, win: { text: '길을 뚫었다.', gain: { ether: 60 }, after: () => next() } });
    if (ev.kind === 'treasure') {
      if (v === 'careful') { const s = G.riftGain({ money: 300, ether: 30 }); this.toast(`작은 상자 하나를 챙겼다.${s}`); next(); return this.processQueue(); }
      if (G.roll(0.55)) { const s = G.riftGain({ money: 700, relic: true, ether: 60 }); this.toast(`보물고를 쓸어 담았다!${s}`); next(); return this.processQueue(); }
      return fightOn({ title: '보물고의 함정', mobs: { tier, n: 2, shape: 'golem', elem: 'wood' }, win: { text: '함정 골렘을 부수고 보물을 챙겼다.', gain: { money: 700, relic: true }, after: () => next() } });
    }
    const n = G.npcById(ev.npc);
    if (v === 'pass') { this.toast(`${n.name}의 파티를 피해 돌아갔다.`); next(); return this.processQueue(); }
    if (v === 'coop') {
      G.changeRel(n, 12); n.met = true;
      return fightOn({ title: `${n.name}와(과) 함께`, mobs: { tier, n: 3 }, ally: { name: n.name, rank: n.rankIdx, elem: n.element },
        win: { text: `${n.name}과(와) 보물을 나눴다. "다음에도 같이 하자."`, gain: { money: 450, ether: 50 }, after: () => next() } });
    }
    r.robbed.push(n.id); n.met = true; G.changeRel(n, -45); if (G.addLaw) G.addLaw(-8, '대균열 약탈');
    return fightOn({ title: `${n.name}의 파티`, mobs: { tier: n.rankIdx, n: 2, human: true, boss: true, name: n.name, elem: n.element },
      win: { text: `${n.name}의 파티를 쓰러뜨리고 상자를 빼앗았다. 그는 이 일을 잊지 않을 것이다.`, gain: { money: 1200, relic: 1, ether: 80 }, after: (g) => { g.rumor(`대균열 안에서 ${g.player.name}이(가) ${n.name}의 파티를 습격했다는 이야기가 돈다.`); next(); } } });
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'rift') { G.queue.shift(); return this.riftStep(); }
    if (q && q.type === 'riftEnd') { G.queue.shift(); const m = G.riftLeave('균열핵 파괴'); G.save(); this.renderGame(); return this.modal(`<div class="eyebrow">대균열</div><h3>귀환</h3><p class="event-text">${m}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box'); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'rift-enter': if (!G.riftEnter()) return; this.closeModal(); G.save(); G.queue.unshift({ type: 'rift' }); return this.processQueue();
      case 'rift-do': return this.riftDo(v);
      case 'rift-leave': { this.closeModal(); const m = G.riftLeave(); G.save(); this.renderGame(); return this.toast(m); }
      default: return baseHandle.call(this, act, v);
    }
  };
}
