// ===== 팀 일정과 개인 시간 (영역 D, 사용자 확정) =====
// NPC가 리더인 파티의 팀원일 때:
// 1) 평소에는 개인 시간이다. 지도에서는 나 혼자 움직이고(G.party()에 팀원이 들어오지 않는다), 혼자 할 수 있는 것만 한다
//    (수련·휴식·개인 의뢰·내 등급으로 들어갈 수 있는 게이트 솔로 공략). 팀은 리더가 잡은 일정 때만 모인다(crew.on).
// 2) "이 게이트 가자" 제안은 게이트마다 한 번. 거절되면 리더가 이유를 말하고, 그 게이트는 다음 달까지 다시 제안할 수 없다.
//    (내 등급이 오르거나 리더와의 관계가 10 이상 오르면 다시 제안 가능.) 수락된 게이트도 같은 달에는 다시 제안할 수 없다.
// 3) 일정이 보인다: 수락한 일정은 퀘스트 목록에 날짜·남은 일수로 뜨고, [집결일까지 보내기]로 그 사이를 수련·휴식으로 넘긴다(사건이 생기면 멈춤).
//    리더가 한 달에 두 번 일을 잡으면 두 번째는 "예정"으로 미리 보인다. 일이 없으면 한 달에 한 번 "일 좀 잡아 달라"고 할 수 있다.
//    리더십이 낮은 리더는 공지가 며칠 늦는다.
const CREW_TIME = { askRel: 10, skipTrain: 0.8, lateMin: 4, lateMax: 9, askWorkMin: 2, askWorkMax: 4, secondPlan: 0.5 };

{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };

  // 개인 시간에는 팀원이 따라오지 않는다
  const baseParty = GP.party;
  GP.party = function () {
    const all = baseParty.call(this);
    const c = npcLed(this);
    if (!c || c.on || this._crewAll) return all;
    return all.filter((n) => n.crewOf !== c.id);
  };
  GP.crewMembers = function () { const c = this.crew(); return c ? baseParty.call(this).filter((n) => n.crewOf === c.id) : []; };
  GP.crewTogether = function () { const c = npcLed(this); return !c || !!c.on; };
  GP.withCrew = function (fn) { const was = this._crewAll; this._crewAll = true; try { return fn(); } finally { this._crewAll = was; } };

  // 달마다 도는 처리(관계·급여·승계)는 팀원 전원을 본다
  for (const name of ['advanceMonth', 'crewMonthly', 'crewSuccession', 'crewLeave']) {
    const base = GP[name]; if (!base) continue;
    GP[name] = function (...a) { return this.withCrew(() => base.apply(this, a)); };
  }

  // 리더가 일정을 잡는다: 리더십이 낮으면 공지가 늦고, 가끔 한 달에 두 번 잡는다
  const baseMonthly = GP.crewMonthly;
  GP.crewMonthly = function () {
    const c = npcLed(this);
    if (c && !c.plan && this.monthKey() >= c.nextPlan && !c.lateAt) {
      const L = this.npcById(c.leader); const q = typeof npcLead === 'function' ? npcLead(L) : 60;
      if (q < 50 && RNG.chance(q < 30 ? 0.6 : 0.35)) { c.lateAt = absDay(this) + RNG.int(CREW_TIME.lateMin, CREW_TIME.lateMax); c.nextPlan = this.monthKey() + 1; c.next = null; return; }
    }
    const had = c && c.plan;
    const r = baseMonthly.call(this);
    const c2 = npcLed(this);
    if (c2 && c2.plan && c2.plan !== had) this.crewSecondPlan(c2);
    return r;
  };
  GP.crewSecondPlan = function (c) {
    c.next = null;
    const a = c.plan; if (!a || a.kind === 'handover' || a.kind === 'train' || !RNG.chance(CREW_TIME.secondPlan)) return;
    const b = this.crewMakePlan(); if (!b || b.kind === 'handover' || b.kind === 'train') return;
    if (b.kind === 'gate' && a.kind === 'gate' && b.gateId === a.gateId) return;
    if (b.kind === 'hunt' && a.kind === 'hunt' && b.mobId === a.mobId) return;
    b.day = Math.min(29, a.day + RNG.int(7, 12)); if (b.day < a.day + 5) return;
    c.next = { ...b, m: this.monthKey() };
  };
  // 날마다: 늦은 공지, 두 번째 일정 꺼내기, 팀 일정이 끝나면 흩어지기
  GP.crewDayTick = function () {
    const c = npcLed(this); if (!c || this.over) return;
    const now = absDay(this);
    if (c.on && !this._crewBusy && typeof UI !== 'undefined' && !UI.ctx) c.on = false;
    if (c.lateAt && now >= c.lateAt && !c.plan && !c.rally) {
      c.lateAt = null;
      if (this.day <= 26) { c.plan = this.crewMakePlan(); if (c.plan && this.crewPlanText(c.plan)) this.queue.push({ type: 'crewPlan' }); else c.plan = null; }
    }
    if (c.next && (c.next.m !== this.monthKey() || this.day >= c.next.day)) c.next = null;
    if (c.next && !c.plan && !c.rally) {
      c.plan = c.next; c.next = null; delete c.plan.m;
      if (this.crewPlanText(c.plan)) this.queue.push({ type: 'crewPlan' }); else c.plan = null;
    }
  };
  const baseAdv = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) { const r = baseAdv.call(this, n, opts); this.crewDayTick(); return r; };

  // 게이트 제안: 게이트마다 한 번
  GP.crewGateAsked = function (g) {
    const c = npcLed(this); const L = c && this.npcById(c.leader); const a = c && c.asked && c.asked[g.id];
    if (!a) return null;
    if (this.monthKey() > a.m || this.player.rankIdx > a.rank || (L.relation || 0) >= a.rel + CREW_TIME.askRel) { delete c.asked[g.id]; return null; }
    return a;
  };
  GP.crewProposeGate = function (g) {
    const c = npcLed(this); const L = c && this.npcById(c.leader); const p = this.player;
    if (!c || !g) return { ok: false, text: '' };
    const old = this.crewGateAsked(g);
    if (old) return { ok: false, again: true, text: `${L.name}에게 이 게이트는 이미 물어봤다${old.ok ? '' : `("${old.why}")`}. 다음 달이 되거나, 내 등급·리더와의 관계가 오르면 다시 제안할 수 있다.` };
    const say = (T) => T[typeof voiceCol === 'function' ? voiceCol(L) : 'just'] || T.just;
    let why = null;
    if (g.tier > L.rankIdx) why = say({ just: '우리 등급엔 아직 위험하다.', kind: '거긴 우리 등급엔 아직 위험해요.', cold: '등급이 안 된다.' });
    else if (c.plan || c.rally) why = say({ just: '이번 일정이 이미 잡혀 있다. 그것부터 끝낸다.', kind: '이미 잡힌 일정이 있어요. 그것부터 해요.', cold: '일정이 차 있다.' });
    else if (p.injured > 0 || (p.maxHp && p.hp / p.maxHp < 0.5)) why = say({ just: '네 몸부터 추슬러라. 다친 채로는 안 데려간다.', kind: '아직 다 안 나았잖아요. 몸부터 챙겨요.', cold: '다친 사람은 안 데려간다.' });
    else if (!RNG.chance(Math.max(0.15, Math.min(0.9, 0.35 + (L.relation || 0) / 150)))) why = say({ just: '이번 달 방침과 안 맞는다. 다음에 보자.', kind: '이번 달엔 좀 어렵겠어요. 다음에 봐요.', cold: '안 간다.' });
    c.asked ??= {};
    c.asked[g.id] = { m: this.monthKey(), rank: p.rankIdx, rel: L.relation || 0, ok: !why, why };
    if (why) { this.changeRel(L, -1, '일정에 없는 게이트를 가자고 했다'); return { ok: false, text: `${L.name}: "${why}" (이 게이트는 다음 달까지 다시 제안할 수 없다)` }; }
    return { ok: true, text: `${L.name}: "${say({ just: '좋다, 거기로 간다. 다들 모여라.', kind: '좋아요, 거기로 가요. 다들 모여요!', cold: '간다. 모여.' })}"` };
  };
  // 집결일까지 보내기: 하루씩 넘기며 수련(다쳤으면 휴식). 사건이 생기면 멈춘다
  GP.crewSkipToRally = function () {
    const c = npcLed(this); const r = c && c.rally; const p = this.player; if (!r) return { done: false, text: '' };
    const start = absDay(this); let days = 0; let stopped = false;
    const restful = p.injured > 0 || (p.maxHp && p.hp / p.maxHp < 0.6);
    while (absDay(this) < r.at && !this.over) {
      this.advanceDays(1, { noSave: true }); days++;
      if (this.queue.length) { stopped = true; break; }
    }
    let gain = 0;
    if (days) {
      if (restful) { p.hp = p.maxHp; p.mp = p.maxMp; if (p.injured > 0 && days >= 10) p.injured = Math.max(0, p.injured - 1); this.recalc(); }
      else if (this.trainGain) { gain = Math.round(this.trainGain() * (days / 30) * CREW_TIME.skipTrain); if (gain > 0) this.addEther(gain); }
    }
    const what = !days ? '' : restful ? `${days}일 동안 쉬며 몸을 추슬렀다.` : `${days}일 동안 혼자 수련했다. 에테르 +${fmt(gain)}`;
    if (this.over) return { done: false, text: what };
    if (stopped || absDay(this) < r.at) return { done: false, days, text: `${what} 일이 생겨 멈췄다. 집결까지 ${r.at - absDay(this)}일 남았다.`.trim() };
    // 집결지로
    const live = r.kind === 'gate' ? this.mapGates.find((x) => x.id === r.id) : this.mobs.find((x) => x.id === r.id);
    if (live) { p.x = live.x; p.y = live.y; p.region = live.region; this.reveal(live.x, live.y, 4); }
    else p.region = r.region;
    this.rallyCheck();
    return { done: true, days, text: what, from: start };
  };

  const baseInit = GP.initSandbox;
  GP.initSandbox = function () {
    baseInit.call(this);
    const c = this.player && this.player.crew;
    if (c) { c.on ??= false; c.asked ??= {}; c.next ??= null; c.lateAt ??= null; c.askedWork ??= null; }
  };
}

if (typeof UI !== 'undefined') {
  const led = () => { const c = G.player && G.crew && G.crew(); return c && G.crewLeader() ? c : null; };
  const absDay = () => G.monthKey() * 30 + G.day;

  // 일정 수락: 게이트·토벌은 집결 약속이 된다(그때까지 개인 시간). 호위·훈련은 바로 팀과 함께
  const baseAns = UI.answerCrewPlan;
  UI.answerCrewPlan = function (v) {
    const c = led(); const plan = c && c.plan;
    if (c && plan && v === '1' && (plan.kind === 'gate' || plan.kind === 'hunt')) { this.rallyAsked = false; return this.handle('rally-meet'); }
    if (c && plan && v === '1' && plan.kind !== 'handover') {
      c.on = true; G._crewBusy = true;
      try { return baseAns.call(this, v); } finally { G._crewBusy = false; }
    }
    return baseAns.call(this, v);
  };
  // 집결: 이때부터 팀이 함께 움직인다
  const baseGo = UI.rallyGo;
  if (baseGo) UI.rallyGo = function (late) { const c = led(); if (c) c.on = true; G._crewBusy = true; try { return baseGo.call(this, late); } finally { G._crewBusy = false; } };
  const baseMiss = UI.rallyMiss;
  if (baseMiss) UI.rallyMiss = function () { return G.withCrew(() => baseMiss.call(this)); };
  // 파티 화면에는 팀원을 계속 보여 준다
  const basePartyHtml = UI.partyHtml;
  if (basePartyHtml) UI.partyHtml = function () {
    const c = led(); const html = G.withCrew(() => basePartyHtml.call(this));
    return c && !c.on ? html.replace('</h3>', '</h3><p class="small amber">지금은 개인 시간이다. 팀원들은 각자 지내다가 리더가 잡은 일정 때 모인다.</p>') : html;
  };

  // 지도에서 게이트를 눌렀을 때 (NPC 리더 파티의 팀원)
  UI.leadGateAsk = function (L, g) {
    const c = G.crew(); const asked = G.crewGateAsked(g);
    const plan = c && c.plan && G.crewPlanText ? G.crewPlanText(c.plan) : null;
    const r = c && c.rally;
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(L, 96)}<div><div class="eyebrow">${c ? c.name : '파티'} · 리더 ${L.name}</div>
      <p class="event-text">팀으로 들어가는 게이트는 리더가 일정을 잡는다. 지금은 개인 시간이라 혼자 들어갈 수도 있다.</p>
      ${r ? `<p class="small">다음 집결: ${r.label}</p>` : plan ? `<p class="small">답할 일정: ${plan.tag}</p>` : '<p class="small dim">잡힌 팀 일정이 없다.</p>'}</div></div>
      <div class="cards"><button class="choice-btn" data-act="gate-solo" data-v="${g.id}">혼자 들어간다 (개인 시간 · 팀원 없음)</button>
      <button class="choice-btn" data-act="lead-gate" data-v="${g.id}" ${asked ? 'disabled' : ''}>리더에게 "${G.gateName(g)}"에 팀으로 가자고 제안한다${asked ? ' (이미 물어봄 · 다음 달부터)' : ' (게이트마다 한 번)'}</button>
      <button class="choice-btn" data-act="modal-close">돌아간다</button></div>`), 'event-box');
  };

  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    let html = baseHQ.call(this); const c = led(); if (!c) return html;
    const rows = [];
    const r = c.rally; const left = r ? r.at - absDay() : 0;
    if (r && left > 0) rows.push(`<button class="obj-link hq rally" data-act="rally-skip"><span class="hq-mark">▶</span><span class="hq-t">집결일까지 보내기 (수련·휴식)</span><span class="hq-r">${left}일</span></button>`);
    const pt = c.plan && c.plan.kind !== 'handover' && G.crewPlanText(c.plan);
    if (pt) rows.push(`<button class="obj-link hq rally" data-act="crew-plan-open"><span class="hq-mark">!</span><span class="hq-t">팀 일정 답하기 · ${pt.tag || pt.title}</span><span class="hq-r amber">${G.month}월 ${c.plan.day}일</span></button>`);
    if (c.next) { const nt = G.crewPlanText(c.next); if (nt) rows.push(`<div class="obj-sub">팀 예정 · ${G.month}월 ${c.next.day}일 ${nt.tag || nt.title}</div>`); }
    if (!r && !pt && !c.next) {
      if (c.lateAt) rows.push('<div class="obj-sub">리더가 며칠 안에 일정을 알려 준다.</div>');
      else if (c.askedWork !== G.monthKey()) rows.push('<button class="obj-link hq" data-act="crew-askwork"><span class="hq-mark">✉</span><span class="hq-t">리더에게 일 좀 잡아 달라고 한다</span><span class="hq-r">월 1회</span></button>');
      else rows.push('<div class="obj-sub">팀 일정 없음 · 개인 시간</div>');
    }
    if (!rows.length) return html;
    const at = html.includes('data-act="rally-travel"') ? html.indexOf('</button>', html.indexOf('data-act="rally-travel"')) + 9 : html.indexOf('<div class="obj-title">현재 퀘스트</div>') + '<div class="obj-title">현재 퀘스트</div>'.length;
    if (at < 9) return html;
    html = html.slice(0, at) + rows.join('') + html.slice(at);
    return html.replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '');
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'gate-solo') { this._soloGate = true; try { return baseHandle.call(this, 'gate', v); } finally { this._soloGate = false; } }
    if (act === 'lead-gate') {
      const c = led(); const g = G.mapGates.find((x) => String(x.id) === String(v)); this.closeModal();
      if (!c || !g) return this.after();
      const res = G.crewProposeGate(g);
      if (!res.ok) return this.after(res.text);
      c.on = true; G._crewBusy = true;
      try { this.toast(res.text); this.startGate(g.id); if (this.ctx && this.ctx.kind === 'gate') this.ctx.crewRaid = true; else c.on = false; } finally { G._crewBusy = false; }
      return;
    }
    if (act === 'rally-skip') {
      if (this.ctx || !led()) return;
      const res = G.crewSkipToRally(); this.renderGame();
      if (res.text) this.toast(res.text);
      return this.processQueue();
    }
    if (act === 'crew-askwork') {
      const c = led(); const L = G.crewLeader(); if (!c || !L || c.askedWork === G.monthKey()) return;
      c.askedWork = G.monthKey(); c.lateAt = absDay() + RNG.int(CREW_TIME.askWorkMin, CREW_TIME.askWorkMax); G.save();
      const T = { just: '알았다. 며칠 안에 하나 잡아서 연락하지.', kind: '알겠어요, 며칠 안에 하나 잡아서 연락할게요!', cold: '…알았다. 기다려.', warlike: '몸이 근질거리냐? 좋아, 곧 잡는다.', greedy: '마침 돈 되는 걸 보고 있었어. 곧 연락할게.' };
      this.renderGame();
      return this.toast(`${L.name}: "${T[typeof voiceCol === 'function' ? voiceCol(L) : 'just'] || T.just}"`);
    }
    return baseHandle.call(this, act, v);
  };
}
