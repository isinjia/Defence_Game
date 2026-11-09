// ===== 게이트 크로니클: 막아서기 · 게이트 탈출 규칙 · 탐색 중 변이 =====
// docs/구현_대기목록.md 4-3(막아서기) · 4-4(탈출 규칙과 탐색 중 변이). council.js 를 이어받는다.
// - 막아서기: 리더가 강행하려 할 때 동료 한 명이 앞을 막아선다(게이트당 최대 한 번).
//   · 강한 반대 + 보호형 성격이나 관계가 아주 높거나 낮을 때
//   · 통찰형: 통찰력 높은 동료가 "무조건 불가능"이나 "변이 조짐"을 느끼면 관계·성격과 상관없이. 통찰이 낮으면 틀린 경고도 낸다.
//   · 리더는 물러선다/설득한다/그래도 강행. 강행하면 성격대로 크게 반응(따로 행동·이탈·동조·비난).
//   · 플레이어가 리더가 아니면 플레이어도 막아설 수 있다.
// - 탈출: 귀환석은 어디서든 쓴다(4-7 최종 확정). 층 지도에도 귀환석 버튼.
// - 탐색 중 변이: 일반 게이트가 공략 도중 변이(레드·더블·등급 오측정)로 바뀔 수 있다. 1~2칸 전에 조짐이 있다.

const INSIGHT_GRP = { esper: 0.55, mage: 0.4, support: 0.35, shadow: 0.35, summon: 0.3 };
const MUT_KINDS = { red: '레드 게이트', double: '이중 던전', misrank: '등급 오측정' };

Object.assign(Game.prototype, {
  insightOf(n) { return Math.min(0.9, (INSIGHT_GRP[classById(n.cls || 'swordsman').g] || 0.15) + n.rankIdx * 0.03 + (n.personality === 'cold' ? 0.05 : 0)); },
});

Object.assign(UI, {
  gateMutated(c) { const g = c.gate; return !!(c.run && c.run.mutated) || (g.variant && g.variant !== 'normal') || !!g.final; },
  canRecall() { const c = this.ctx; return !!(c && c.run && (G.player.items.recall || 0) > 0); },
  useRecall() {
    if (!this.canRecall()) return this.toast('귀환석이 없다.');
    G.player.items.recall--;
    const ov = document.getElementById('council-ov'); if (ov) ov.remove();
    this.toast('귀환석이 빛났다. 순식간에 바깥으로 빠져나왔다.');
    return this.handle('g-leave');
  },
  // 탐색 중 변이: 칸에 들어갈 때마다 진행
  mutTick() {
    const c = this.ctx; const run = c && c.run; if (!run || this.gateMutated(c)) return;
    const g = c.gate;
    if (run.mut) {
      run.mut.left--;
      if (run.mut.left > 0) { run.signNote = '공기가 눅눅하게 무거워진다. 출구 쪽 공간이 아주 조금 일렁인 것 같다.'; return; }
      const kind = run.mut.kind; run.mut = null; run.mutated = true; g.variant = kind; g.midMutated = true;
      if (kind === 'red') { run.floors++; run.signNote = '<b class="bad">게이트가 붉게 물들었다. 레드 게이트로 변이!</b> 출구가 닫혔다. 한 층이 더 생겼다.'; }
      else if (kind === 'double') { c.hidden = true; run.signNote = '<b class="bad">게이트 깊은 곳에서 두 번째 심장 소리가 들린다. 이중 던전으로 변이!</b>'; }
      else { g.realTier = Math.min(7, g.tier + RNG.int(1, 2)); g.revealedMis = true; run.signNote = `<b class="bad">에테르 농도가 치솟는다. 실제 등급은 ${RANKS[g.realTier].key}급이었다!</b> 괴수들이 단단해진다.`; }
      G.log(`공략 중이던 ${G.gateName(g)}이(가) ${MUT_KINDS[kind]}(으)로 변이했다.`, 'bad');
      return;
    }
    const t = GateRun.tier(g);
    const p = 0.025 + t * 0.004 + (g.neglected ? 0.03 : 0) + (g.deadline && g.deadline - G.monthKey() <= 1 ? 0.03 : 0);
    if (RNG.chance(p)) { run.mut = { left: RNG.int(1, 2) + 1, kind: RNG.weighted(['red', 'double', 'misrank'], [35, 30, 35]) }; run.signNote = '어디선가 낮은 울림이 들렸다. 기분 탓일까.'; }
  },
  // 통찰형 막아서기 후보
  insightBlock(key) {
    const c = this.ctx; const run = c.run; if (run.blocked) return null;
    const nd = this.nodeOf(key); const hp = this.councilHp(); const g = c.gate;
    const mems = this.councilMembers().filter((n) => n.id !== (this.councilLeader() || {}).id);
    if (!mems.length) return null;
    const seer = mems.slice().sort((a, b) => G.insightOf(b) - G.insightOf(a))[0]; const ins = G.insightOf(seer);
    const hopeless = (nd.t === 'boss' || nd.t === 'elite') && (hp < 0.3 || GateRun.tier(g) > G.player.rankIdx + 1);
    if (run.mut && RNG.chance(ins * 1.3)) return { n: seer, why: 'sign', real: true };
    if (hopeless && RNG.chance(ins * 1.1)) return { n: seer, why: 'hopeless', real: true };
    if (!run.mut && !hopeless && RNG.chance((1 - ins) * 0.03)) return { n: seer, why: RNG.chance(0.5) ? 'sign' : 'hopeless', real: false };
    return null;
  },
  // 강행에 막아서는 동료 (보호형·관계)
  strongBlocker() {
    const cn = this.ctx.council;
    const xs = cn.votes.filter((v) => v.vote === 'X' && v.s < -0.5).map((v) => G.npcById(v.id)).filter(Boolean);
    return xs.find((n) => n.personality === 'just' || n.personality === 'kind' || n.relation >= 70 || n.relation <= -10) || null;
  },
  blockLine(b) {
    if (b.why === 'sign') return '"멈춰. 뭔가 이상해. 이 게이트, 변하고 있어. 지금 나가야 해."';
    if (b.why === 'hopeless') return '"이건 못 이겨. 저 앞에 있는 놈은 지금 우리 상태로 절대 안 돼. 돌아가자."';
    const n = b.n;
    return n.relation >= 70 ? `"…나 너 믿어. 그래서 말리는 거야. 이번만은 내 말 들어."` : n.relation <= -10 ? '"또 혼자 정하려고? 이번엔 못 비켜."' : '"여기서 강행하면 누군가 죽어. 신입들 생각도 해."';
  },
  showBlock(b) {
    const c = this.ctx; c.run.blocked = true; c.block = b;
    const n = b.n; const L = this.councilLeader();
    const recall = (G.player.items.recall || 0) > 0;
    this.councilPanel(`<div class="cn-card cn-block"><div class="eyebrow bad">막아서기</div>
      <div class="cn-blocker">${this.npcPortrait(n, 96)}<div><b>${n.name}이(가)</b> ${L ? `${L.name}의` : '당신의'} 앞을 막아섰다.<p class="event-text">${b.line || this.blockLine(b)}</p></div></div>
      ${L ? `<p class="small">리더 ${L.name}이(가) 당신을 본다. ${n.name}의 편을 들어 줄 수도 있다.</p>` : ''}
      <div class="cn-btns">
        ${L ? '<button class="primary" data-act="blk" data-v="side">막아선 쪽에 선다</button><button class="ghost" data-act="blk" data-v="leader">리더 결정에 따른다</button>'
          : `<button class="primary" data-act="blk" data-v="back">물러선다</button><button data-act="blk" data-v="talk">설득한다</button><button class="danger" data-act="blk" data-v="force">그래도 강행</button>`}
        ${recall ? '<button data-act="blk" data-v="recall">귀환석으로 나간다</button>' : ''}</div></div>`);
  },
  blockResolve(v) {
    const c = this.ctx; const b = c.block; if (!b) return; const n = b.n; const L = this.councilLeader();
    if (v === 'recall') { G.changeRel(n, 8, '막아선 말을 듣고 함께 빠져나왔다'); G.addMemory && G.addMemory(n, '게이트 안에서 막아섰고, 내가 그 말을 들었다'); c.block = null; return this.useRecall(); }
    if (L) { // NPC 리더 앞을 동료가 막아섬: 리더는 성격대로, 플레이어는 편을 든다
      const back = RNG.chance((v === 'side' ? 0.6 : 0.25) + L.relation / 300 + (L.personality === 'kind' || L.personality === 'just' ? 0.15 : L.personality === 'cold' ? -0.2 : 0));
      c.block = null;
      if (back) { G.changeRel(n, v === 'side' ? 5 : 1, '막아선 편을 들어 주었다'); this.toast(`${L.name}: "…알았어. 물러서지."`); c.council.stage = 'consult'; return this.renderCouncil(); }
      if (v === 'side') G.changeRel(L, -3, '리더 앞을 막아선 편에 섰다');
      this.toast(`${L.name}: "책임은 내가 진다." 그대로 나아갔다.`);
      return this.councilGo(true);
    }
    if (v === 'back') {
      G.changeRel(n, 8, '막아선 말을 들어 주었다'); G.addMemory && G.addMemory(n, '게이트 안에서 막아섰고, 내가 그 말을 들었다');
      c.block = null; const ov = document.getElementById('council-ov'); if (ov) ov.remove(); c.council = null;
      return this.toast(`${n.name}이(가) 숨을 내쉬었다. "고마워."`);
    }
    if (v === 'talk') {
      const ok = RNG.chance(Math.max(0.1, Math.min(0.85, 0.3 + n.relation / 200 + ((G.player.traits || []).includes('charisma') ? 0.15 : 0) - (b.real ? 0.15 : 0))));
      if (ok) { G.changeRel(n, -1, '설득에 넘어갔다'); this.toast(`${n.name}: "…좋아. 네 판단을 믿어 볼게."`); c.block = null; return this.councilGo(false); }
      this.toast(`${n.name}이(가) 고개를 젓는다. 비키지 않는다.`); b.line = '"말로는 안 돼. 비킬 수 없어."';
      return this.showBlock(b);
    }
    // 그래도 강행: 성격대로 크게 반응
    c.block = null; const run = c.run;
    G.changeRel(n, -12, '막아섰는데 강행했다'); n.grumble = (n.grumble || 0) + 2;
    G.npcRemember && G.npcRemember(n, '게이트에서 막아섰지만 무시당했다', 0);
    const pers = n.personality; let msg;
    if (pers === 'warlike') { (run.sitOut ||= {})[n.id] = run.floor; msg = `${n.name}: "그럼 혼자 가. 이 층은 난 빠진다."`; }
    else if (pers === 'cold' || pers === 'greedy') { n.leaveAfterGate = true; msg = `${n.name}이(가) 아무 말 없이 뒤로 물러났다. 눈빛이 식었다.`; }
    else if (pers === 'just') { for (const o of this.councilMembers()) if (o !== n) G.changeRel(o, -3, '막아선 동료를 무시하는 걸 봤다'); msg = `${n.name}: "다들 봤지?" 다른 팀원들도 웅성거린다.`; }
    else { run.blame = n.id; msg = `${n.name}이(가) 입술을 깨물었다. "…다치면 다 네 탓이야."`; }
    run.blockForced = { id: n.id, hp: this.councilHp(), real: b.real };
    this.toast(msg);
    return this.councilGo(true);
  },
  blockAfter() {
    const c = this.ctx; const run = c && c.run; const bf = run && run.blockForced; if (!bf) return;
    run.blockForced = null; const n = G.npcById(bf.id); if (!n) return;
    const now = this.councilHp(); const bad = now < 0.25 || bf.hp - now > 0.4 || (bf.real && run.mutated);
    if (bad) {
      G.changeRel(n, -4, '경고를 무시한 결과를 봤다');
      if (run.blame === n.id || n.relation < 0) G.rumor(`${G.player.name}, 게이트에서 동료의 경고를 무시하고 강행했다는 증언이 나왔다.`);
      this.toast(`${n.name}: "그러게 내가 뭐랬어."`);
    } else { G.changeRel(n, 5, '이번엔 네가 옳았다'); n.grumble = Math.max(0, (n.grumble || 0) - 1); this.toast(`${n.name}: "…이번엔 네가 옳았다."`); }
  },
});

(() => {
  // 칸에 들어갈 때: 통찰형 막아서기 → 변이 진행
  const baseEnter = UI.enterNode;
  UI.enterNode = function (key) {
    const c = this.ctx;
    if (c && c.run && (this.councilPass || !this.councilMembers().length)) this.mutTick();
    return baseEnter.call(this, key);
  };
  const baseStart = UI.councilStart;
  UI.councilStart = function (key, clicked) {
    const c = this.ctx; const L = this.councilLeader();
    const b = c && c.run && !c.run.blocked ? this.insightBlock(L ? (this.councilLeaderPick(L) || key) : key) : null;
    if (!b) return baseStart.call(this, key, clicked);
    const p = G.player; const ask = p.councilAsk; p.councilAsk = true; // 막아서기가 있으면 자동 진행하지 않는다
    let r; try { r = baseStart.call(this, key, clicked); } finally { p.councilAsk = ask; }
    if (c.council) this.showBlock(b);
    return r;
  };
  // 플레이어가 리더일 때 강행하면 막아서는 동료
  const baseForce = UI.councilForce;
  UI.councilForce = function () {
    const c = this.ctx;
    if (!c.run.blocked && !this.councilLeader()) { const n = this.strongBlocker(); if (n && RNG.chance(0.6)) return this.showBlock({ n, why: 'protect', real: false }); }
    return baseForce.call(this);
  };
  // NPC 리더일 때: 플레이어가 막아선다
  const baseDecide = UI.councilNpcDecide;
  UI.councilNpcDecide = function (v) {
    const c = this.ctx;
    if (v !== 'B') return baseDecide.call(this, v);
    const L = G.npcById(c.council.leader); c.run.blocked = true;
    const back = RNG.chance(0.45 + L.relation / 200 + (L.personality === 'kind' || L.personality === 'just' ? 0.15 : L.personality === 'cold' ? -0.2 : 0));
    if (back) { G.changeRel(L, 4, '막아선 말을 들어 주었다'); G.addMemory && G.addMemory(L, '게이트에서 내가 막아섰고, 물러서 주었다'); this.toast(`${L.name}: "…네가 그렇게까지 말한다면."`); c.council.stage = 'consult'; c.council.leader = null; return this.renderCouncil(); }
    G.changeRel(L, -5, '내 앞을 막아섰다'); G.npcRemember && G.npcRemember(L, '게이트에서 막아섰다', 0);
    this.toast(`${L.name}: "비켜. 리더는 나야."`);
    return this.councilGo(true);
  };
  const baseRender = UI.renderCouncil;
  UI.renderCouncil = function () {
    baseRender.call(this);
    const c = this.ctx; const cn = c.council;
    if (cn && cn.leader != null && cn.stage === 'vote' && !c.run.blocked) {
      const row = document.querySelector('#council-ov .cn-btns'); if (row) row.insertAdjacentHTML('beforeend', '<button class="sm danger" data-act="cn-vote" data-v="B">막아선다</button>');
    }
  };
  // 지도: 변이 조짐·귀환석
  const baseMap = UI.renderGateMap;
  UI.renderGateMap = function (note) {
    this.blockAfter();
    const c = this.ctx; const run = c && c.run;
    const sign = run && run.signNote; if (run) run.signNote = null;
    const r = baseMap.call(this, sign ? (note ? note + '<br>' : '') + sign : note);
    if (!run) return r;
    const row = document.querySelector('#modal-box .row.end');
    const mut = this.gateMutated(c);
    if (row && (G.player.items.recall || 0) > 0) row.insertAdjacentHTML('afterbegin', `<button class="ghost recall-btn" data-act="g-recall">귀환석 <span class="num">×${G.player.items.recall}</span></button>`);
    if (sign && /변이|울림|일렁/.test(sign)) { const box = document.getElementById('modal-box'); if (box && !FX.reduced) { box.classList.add('gm-shake'); setTimeout(() => box.classList.remove('gm-shake'), 600); } }
    return r;
  };
  // 따로 행동: 그 층 전투에서 빠진다
  const baseAllies = UI.allyUnits;
  UI.allyUnits = function () {
    const list = baseAllies.call(this); const c = this.ctx; const so = c && c.run && c.run.sitOut;
    if (!so) return list;
    return list.filter((u) => !(u.npcId != null && so[u.npcId] === c.run.floor));
  };
  // 게이트가 끝나면: 떠나겠다던 동료, 변이 생환 소식
  const P = Game.prototype;
  const baseFinish = P.finishGate;
  P.finishGate = function (gate, result, ...a) {
    const r = baseFinish.call(this, gate, result, ...a);
    for (const n of this.party()) if (n.leaveAfterGate) { n.leaveAfterGate = false; if (this.dismiss) this.dismiss(n.id); this.log(`${n.name}이(가) 파티를 떠났다. 게이트에서의 일을 잊지 않겠다고 했다.`, 'bad'); }
    if (gate.midMutated && result === 'clear') { this.rumor(`${this.player.name} 파티, 공략 도중 ${MUT_KINDS[gate.variant] || '변이'}(으)로 바뀐 게이트에서 생환!`); this.lifeEvent(`공략 중 변이한 게이트(${MUT_KINDS[gate.variant] || '변이'})에서 살아 나왔다.`); this.player.fame += 6; }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'blk') return this.blockResolve(v);
    if (act === 'g-recall') return this.useRecall();
    return baseHandle.call(this, act, v);
  };
})();

// ===== 4-7. 귀환석은 매우 매우 귀하다 =====
// - 상점에서 팔지 않는다. 보스 극소 드롭, 경매장 최고가 품목, 후원자 '선택'·대형 길드 정예의 특별 지급으로만.
// - (사용자 최종 확정) 철수 버튼은 그대로. 귀환석은 어디서든(전투 중·보스전·변이 게이트) 즉시 탈출. 쓰면 팀원 반응·기록·뉴스.
Object.assign(Game.prototype, {
  giveRecall(why) { const p = this.player; p.items.recall = (p.items.recall || 0) + 1; this.lifeEvent(`귀환석을 손에 넣었다. (${why})`); this.log(`매우 귀한 귀환석을 얻었다. (${why})`, 'major'); },
});
(() => {
  const P = Game.prototype;
  // 상점: 사지 못한다
  const baseBuy = P.buyItem;
  P.buyItem = function (id) { const c = CONSUMABLES.find((x) => x.id === id); if (c && c.noShop) return '귀환석은 상점에서 구할 수 없다.'; return baseBuy.call(this, id); };
  const strip = (html) => {
    if (!html || !html.includes('data-v="recall"')) return html;
    const t = document.createElement('template'); t.innerHTML = html;
    for (const b of t.content.querySelectorAll('[data-act="buy-item"][data-v="recall"]')) { const row = b.closest('.item-row'); (row || b).remove(); }
    return t.innerHTML;
  };
  for (const fn of ['shopHtml', 'facilityHtml']) { const base = UI[fn]; if (base) UI[fn] = function (...a) { return strip(base.apply(this, a)); }; }
  // 보스 극소 드롭
  const baseFinish = P.finishGate;
  P.finishGate = function (gate, result, ...a) {
    const r = baseFinish.call(this, gate, result, ...a);
    if (result === 'clear' && RNG.chance(0.012 + (gate.tier || 0) * 0.003 + (gate.variant && gate.variant !== 'normal' ? 0.01 : 0))) { this.giveRecall(`${this.gateName ? this.gateName(gate) : '게이트'} 보스의 잔해에서`); if (Array.isArray(r)) r.push('보스의 잔해 속에서 희미하게 빛나는 돌 — 귀환석이다!'); }
    return r;
  };
  // 경매장 최고가 품목
  const baseLots = P.auctionLots;
  if (baseLots) P.auctionLots = function () {
    const lots = baseLots.call(this);
    const a = this.world.auctions[this.region().id];
    if (a && !a.recallChecked) {
      a.recallChecked = true;
      if (RNG.chance(0.35)) { const base = Math.round(9000 * RANKS[Math.max(2, this.player.rankIdx)].mult ** 0.8); lots.push({ kind: 'recall', base, max: Math.round(base * RNG.range(1.2, 2.2)), done: false, uid: `${a.key}-${this.region().id}-recall` }); }
    }
    return lots;
  };
  const baseBid = P.bid;
  if (baseBid) P.bid = function (uid, mult) {
    const lot = this.auctionLots().find((l) => l.uid === uid);
    if (!lot || lot.kind !== 'recall') return baseBid.call(this, uid, mult);
    if (lot.done) return '';
    const p = this.player; const amount = Math.round(lot.base * mult);
    if (p.money < amount) return '크레딧이 부족하다.';
    lot.done = true;
    if (amount >= lot.max) { p.money -= amount; this.giveRecall(`경매장에서 ${fmt(amount)} 크레딧에 낙찰`); this.rumor(`올해 경매 최고가 품목 귀환석, ${p.name}에게 ${fmt(amount)} 크레딧에 낙찰.`); return `낙찰! 귀환석을 ${fmt(amount)} 크레딧에 손에 넣었다.`; }
    const rival = RNG.pick(this.npcs.filter((n) => n.alive && !n.child && n.rankIdx >= 5)) || { name: '익명의 대형 길드' };
    return `${rival.name}이(가) ${fmt(lot.max)} 크레딧을 불러 귀환석을 가져갔다.`;
  };
  // 특별 지급
  const baseMonthly = P.storyMonthly;
  P.storyMonthly = function () {
    baseMonthly.call(this);
    const p = this.player; p.recallGift ??= {};
    if (p.sponsor && p.sponsor.chosen && !p.recallGift.sponsor) { p.recallGift.sponsor = true; this.giveRecall('후원자가 "선택받은 자"에게 보낸 선물'); }
    if (p.guild && p.guild !== 'kama' && p.guildRank >= 2 && !p.recallGift.guild) { p.recallGift.guild = true; this.giveRecall(`${GUILDS[p.guild].name}이(가) 정예 단원에게 지급`); }
    if (p.civil && p.civil.grade >= 2 && !p.recallGift.civil) { p.recallGift.civil = true; this.giveRecall('관리국 간부 비상 지급품'); }
  };
})();

(() => {
  // 귀환석 사용: 팀원 반응·기록·뉴스
  const baseRecall = UI.useRecall;
  UI.useRecall = function () {
    const c = this.ctx; const ok = this.canRecall();
    if (ok) {
      const mates = G.party(); const run = c.run; const deep = run.floor >= 1 || run.mut;
      const m = mates.length ? RNG.pick(mates) : null;
      const line = m ? (deep ? `${m.name}: "…살았다. 진짜 살았어."` : `${m.name}: "그 귀한 걸 여기서 쓴다고?"`) : '';
      for (const n of mates) G.addMemory && G.addMemory(n, deep ? '귀환석으로 함께 살아 나왔다' : '귀환석을 쓰는 걸 봤다');
      G.lifeEvent(`${G.gateName(c.gate)}에서 귀환석을 써 빠져나왔다.`);
      if (deep) G.rumor(`${G.player.name} 파티, ${G.gateName(c.gate)}에서 귀환석으로 생환.`);
      const r = baseRecall.call(this);
      if (line) setTimeout(() => this.toast(fixJosa(line)), 900);
      return r;
    }
    return baseRecall.call(this);
  };
})();
// 전투 중 귀환석 사용도 기록 (gear.js 가방)
{
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act !== 'c-bag-use' || v !== 'recall') return baseHandle.call(this, act, v);
    const before = G.player.items.recall || 0; const c = this.ctx;
    const r = baseHandle.call(this, act, v);
    if ((G.player.items.recall || 0) < before && c) {
      const where = c.gate ? G.gateName(c.gate) : (c.spec && c.spec.title) || '전투';
      const boss = c.nodeKind === 'boss' || (c.combat && c.combat.units && c.combat.units.some((u) => u.boss && u.alive && u.side !== 'ally'));
      for (const n of G.party()) G.addMemory && G.addMemory(n, '전투 한가운데서 귀환석으로 함께 빠져나왔다');
      G.lifeEvent(`${where}의 전투 한가운데서 귀환석을 써 빠져나왔다.`);
      if (boss || (c.run && this.gateMutated(c))) G.rumor(`${G.player.name} 파티, ${where}에서 귀환석으로 생환.`);
      const m = G.party()[0]; if (m) setTimeout(() => this.toast(fixJosa(`${m.name}: "${boss ? '…살았다. 진짜 살았어.' : '그 귀한 걸 지금 쓴 거야?'}"`)), 900);
    }
    return r;
  };
}
