// ===== 팀 거점·합류 기한·리더가 바로 출발 (영역 D, 사용자 확정) =====
// NPC가 리더인 파티의 팀원일 때:
// 1) 팀 거점 = 리더가 머무는 도시(crew.base). 평소는 개인 시간이고 지도에서 나 혼자 움직인다(G.party()에 팀원이 없다).
// 2) 리더가 "○일까지 ○○로 와라"고 연락한다(crew.due). 퀘스트 목록 맨 위에 "○○에서 리더와 합류 · ○일까지".
//    튜토리얼 직후 파티에 들어가도 바로 이 연락이 온다.
// 3) 기한 안에 거점에서 리더에게 말을 걸면 [일하러 간다] → 다른 팀원은 알아서 모이고, 리더가 고른 일로 바로 출발한다.
//    일은 리더가 고른다(crewMakePlan: 게이트·토벌·호위·훈련). 기다리는 날짜는 없다.
// 4) 이동은 리더의 이동수단으로(등급에 따라 도보·파티 장갑차·고속 이동망, 비용은 팀 경비). 나는 경로를 정하지 않는다.
//    도착하면 게이트 입장·토벌도 리더가 이끈다(leader_rule.js·council.js).
// 5) 일이 끝나면 거점으로 돌아가 개인 시간. 리더가 다음 기한(7~12일)을 준다. 그 전에 와서 말 걸면 바로 다음 일.
//    기한을 넘기면 지각 불이익(신뢰·관계·명성, 세 번이면 제명). 리더십이 낮은 리더는 기한이 짧고, 날짜를 헷갈리기도 한다(그땐 불이익 없음).
// 6) 게이트 제안은 리더에게 말을 걸 때 [이 게이트를 가자고 제안] — 게이트마다 한 번(거절되면 다음 달까지, 등급·관계가 오르면 다시).
const CREW_TIME = { dueMin: 7, dueMax: 12, dueLowMin: 4, dueLowMax: 7, firstDue: 5, askRel: 10, propose: 3 };

{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  const leadQ = (L) => (typeof npcLead === 'function' ? npcLead(L) : 60);

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
  for (const name of ['advanceMonth', 'crewSuccession', 'crewLeave']) {
    const base = GP[name]; if (!base) continue;
    GP[name] = function (...a) { return this.withCrew(() => base.apply(this, a)); };
  }

  // 거점과 합류 기한
  GP.crewBaseName = function () { const c = this.crew(); return c && c.base ? regionById(c.base).name : ''; };
  GP.crewSetDue = function (first) {
    const c = npcLed(this); if (!c) return;
    const L = this.npcById(c.leader); const q = leadQ(L);
    const [lo, hi] = q < 40 ? [CREW_TIME.dueLowMin, CREW_TIME.dueLowMax] : [CREW_TIME.dueMin, CREW_TIME.dueMax];
    const d = first ? Math.max(CREW_TIME.firstDue, regionDist(this.player.region, c.base) * 2 + 3) : RNG.int(lo, hi);
    c.due = absDay(this) + d;
    c.dueMixed = !first && q < 30 && RNG.chance(0.35); // 리더가 날짜를 헷갈렸다
    c.dueWarned = false;
    this.queue.push({ type: 'crewCall', first: !!first });
  };
  GP.crewDueLeft = function () { const c = npcLed(this); return c && c.due ? c.due - absDay(this) : null; };
  GP.crewAtBase = function () { const c = npcLed(this); return !!(c && this.player.region === c.base && this.onCity()); };

  // 들어가자마자 거점을 정하고 첫 연락
  const baseJoin = GP.crewJoin;
  GP.crewJoin = function (L) {
    const r = baseJoin.call(this, L);
    const c = npcLed(this);
    if (c) {
      const lead = this.npcById(c.leader);
      c.base = this.player.region; if (lead) lead.region = c.base;
      c.on = false; c.asked = {}; c.plan = null; c.nextPlan = Infinity;
      this.crewSetDue(true);
    }
    return r;
  };
  // 리더가 달마다 일정을 잡던 흐름은 쓰지 않는다 (관계만 조금씩)
  const baseMonthly = GP.crewMonthly;
  GP.crewMonthly = function () {
    const c = npcLed(this);
    if (!c) return baseMonthly.call(this);
    this.withCrew(() => { for (const n of this.party()) if (n.crewOf === c.id && RNG.chance(0.5)) this.changeRel(n, 1); });
  };

  // 날마다: 기한 확인
  GP.crewDayTick = function () {
    const c = npcLed(this); if (!c || this.over || c.on || !c.due) return;
    const left = c.due - absDay(this);
    if (left === 1 && !c.dueWarned) { c.dueWarned = true; this.queue.push({ type: 'toast', text: `${this.npcById(c.leader).name}: "내일까지 ${this.crewBaseName()}(으)로 와라."` }); }
    if (left < 0 && !this.queue.some((q) => q.type === 'crewLate')) this.queue.push({ type: 'crewLate' });
  };
  const baseAdv = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) { const r = baseAdv.call(this, n, opts); this.crewDayTick(); return r; };

  // 기한을 넘겼다
  GP.crewMissDue = function () {
    const c = npcLed(this); if (!c) return '';
    const L = this.npcById(c.leader);
    if (c.dueMixed) { this.crewSetDue(false); return `${L.name}: "…내가 날짜를 잘못 말했다. 네 잘못 아니다." (불이익 없음)`; }
    c.missed = (c.missed || 0) + 1;
    const R = typeof RALLY !== 'undefined' ? RALLY : { missLeader: 8, missMember: 3, missFame: 2, missTrust: 15, kickAfter: 3 };
    this.crewTrust(-R.missTrust); this.changeRel(L, -R.missLeader, '합류 기한을 어겼다');
    this.withCrew(() => { for (const n of this.party()) if (n !== L && n.crewOf === c.id) this.changeRel(n, -R.missMember, '합류 기한을 어겼다'); });
    this.player.fame = Math.max(0, (this.player.fame || 0) - R.missFame);
    this.lifeEvent(`${c.name}의 합류 기한을 어겼다. 팀은 나 없이 일을 나갔다.`);
    if (c.missed >= R.kickAfter || c.trust <= 0) return `${L.name}: "세 번이면 충분해." ${this.crewLeave('kicked')}`;
    this.crewSetDue(false);
    return `${L.name}: "${c.missed === R.kickAfter - 1 ? '한 번만 더 이러면 같이 못 간다.' : '기다리다 우리끼리 나갔다. 몫은 없다.'}" (리더 관계 -${R.missLeader}, 명성 -${R.missFame}, 신뢰 -${R.missTrust} · 어긴 횟수 ${c.missed}/${R.kickAfter})`;
  };

  // 리더의 이동수단 (등급에 따라). 비용은 팀 경비
  GP.crewRide = function () {
    const L = this.crewLeader(); const r = L ? L.rankIdx : 0;
    if (r >= 4) return { name: '고속 이동망', days: () => 2 };
    if (r >= 2) return { name: '파티 장갑차', days: (d) => Math.max(1, Math.ceil(d / 2)) };
    return { name: '도보', days: (d) => Math.max(1, d) };
  };

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
    else if (p.injured > 0 || (p.maxHp && p.hp / p.maxHp < 0.5)) why = say({ just: '네 몸부터 추슬러라. 다친 채로는 안 데려간다.', kind: '아직 다 안 나았잖아요. 몸부터 챙겨요.', cold: '다친 사람은 안 데려간다.' });
    else if (!RNG.chance(Math.max(0.15, Math.min(0.9, 0.35 + (L.relation || 0) / 150)))) why = say({ just: '이번엔 내가 봐 둔 일이 있다. 다음에 보자.', kind: '이번엔 제가 봐 둔 일이 있어요. 다음에 봐요.', cold: '안 간다.' });
    c.asked ??= {};
    c.asked[g.id] = { m: this.monthKey(), rank: p.rankIdx, rel: L.relation || 0, ok: !why, why };
    if (why) { this.changeRel(L, -1, '리더가 고르지 않은 게이트를 가자고 했다'); return { ok: false, text: `${L.name}: "${why}" (이 게이트는 다음 달까지 다시 제안할 수 없다)` }; }
    return { ok: true, text: `${L.name}: "${say({ just: '좋다, 거기로 간다.', kind: '좋아요, 거기로 가요!', cold: '간다.' })}"` };
  };

  const baseInit = GP.initSandbox;
  GP.initSandbox = function () {
    baseInit.call(this);
    const c = this.player && this.player.crew;
    if (c) {
      c.on ??= false; c.asked ??= {};
      const L = this.npcById(c.leader);
      if (L && L.alive && !c.base) { c.base = L.region || this.player.region; c.plan = null; c.nextPlan = Infinity; c.due = absDay(this) + CREW_TIME.dueMin; }
      delete c.next; delete c.lateAt; delete c.askedWork;
    }
  };
}

if (typeof UI !== 'undefined') {
  const led = () => { const c = G.player && G.crew && G.crew(); return c && G.crewLeader() ? c : null; };
  const absDay = () => G.monthKey() * 30 + G.day;
  const say = (L, T) => T[typeof voiceCol === 'function' ? voiceCol(L) : 'just'] || T.just;
  const dueText = (c) => { const d = c.due - absDay(); const mm = G.month + Math.floor((G.day + d - 1) / 30); const dd = ((G.day + d - 1) % 30) + 1; return `${((mm - 1) % 12) + 1}월 ${dd}일`; };

  Object.assign(UI, {
    // 리더의 연락
    crewCall(first) {
      const c = led(); const L = G.crewLeader(); if (!c || !L) return this.processQueue();
      const T = first
        ? { just: `${c.name}에 온 걸 환영한다. ${dueText(c)}까지 ${G.crewBaseName()}(으)로 와라. 도착하면 나한테 말 걸어. 바로 일하러 간다.`, kind: `환영해요! ${dueText(c)}까지 ${G.crewBaseName()}(으)로 와 줘요. 도착하면 저한테 말 걸어요. 바로 일하러 가요.`, cold: `${dueText(c)}까지 ${G.crewBaseName()}. 늦지 마라.` }
        : { just: `수고했다. 다음은 ${dueText(c)}까지 ${G.crewBaseName()}(으)로 모여라. 그 전에 오면 바로 다음 일 간다.`, kind: `수고했어요! 다음엔 ${dueText(c)}까지 ${G.crewBaseName()}에서 봐요. 일찍 오면 바로 다음 일 가요.`, cold: `다음. ${dueText(c)}까지 ${G.crewBaseName()}.` };
      this.talk([{ who: L, text: say(L, T) }, { sys: `합류 기한 ${dueText(c)} · ${G.crewBaseName()} (현재 퀘스트 맨 위) · 기한을 넘기면 신뢰·관계가 떨어진다` }], () => { this.renderGame(); this.processQueue(); });
    },
    // 거점에서 리더에게 말 걸기
    crewTalk() {
      const c = led(); const L = G.crewLeader(); if (!c || !L) return;
      if (!G.crewAtBase()) return this.travelRegion ? this.travelRegion(c.base) : null;
      const p = G.player;
      if (p.rankIdx >= L.rankIdx + 2 && !c.offeredLead) { c.offeredLead = true; c.plan = { kind: 'handover' }; return this.showCrewPlan(); }
      const near = G.mapGates.filter((g) => !g.final && !g.mission && !g.cleared && regionDist(c.base, g.region) <= 2)
        .sort((a, b) => regionDist(c.base, a.region) - regionDist(c.base, b.region)).slice(0, CREW_TIME.propose);
      const T = { just: '왔군. 일하러 갈까?', kind: '왔어요? 바로 일하러 갈까요?', cold: '왔나. 간다.' };
      this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(L, 96)}<div><div class="eyebrow">${c.name} · 거점 ${G.crewBaseName()}</div><b>${L.name}</b> <span class="small dim">리더</span>
        <p class="event-text">"${say(L, T)}"</p><p class="small dim">일은 리더가 고른다. 다른 팀원들은 알아서 모인다.</p></div></div>
        <div class="cards"><button class="choice-btn primary" data-act="crew-work">일하러 간다</button>
        ${near.map((g) => { const a = G.crewGateAsked(g); return `<button class="choice-btn" data-act="crew-propose" data-v="${g.id}" ${a ? 'disabled' : ''}>"${G.gateName(g)}"에 가자고 제안한다 <span class="small dim">${regionById(g.region).name}${a ? ' · 이미 물어봄' : ' · 게이트마다 한 번'}</span></button>`; }).join('')}
        <button class="choice-btn" data-act="modal-close">나중에</button></div>`), 'event-box');
    },
    // 리더가 일을 고르고 바로 출발
    crewWork(gateId) {
      const c = led(); const L = G.crewLeader(); if (!c || !L) return;
      this.closeModal();
      let plan = gateId != null ? { kind: 'gate', gateId } : G.crewMakePlan();
      if (plan && plan.kind === 'handover') plan = G.crewMakePlan();
      if (!plan || plan.kind === 'handover') plan = { kind: 'train' };
      const p = G.player; const ride = G.crewRide();
      // 리더는 거점 가까운 일을 고른다: 너무 멀면(편도 8일 넘게) 거점 근처 게이트로 바꾼다
      if (gateId == null && (plan.kind === 'gate' || plan.kind === 'hunt') && this.travelPlan) {
        const t0 = plan.kind === 'gate' ? G.mapGates.find((x) => x.id === plan.gateId) : G.mobs.find((x) => x.id === plan.mobId);
        const far = !t0 || ride.days(this.travelPlan(t0.x, t0.y).days || 99) > 8;
        if (far) {
          const near = G.mapGates.filter((g) => !g.final && !g.mission && !g.cleared && g.tier <= L.rankIdx && g.tier >= G.crewTier() - 1)
            .map((g) => ({ g, d: ride.days(this.travelPlan(g.x, g.y).days || 99) })).filter((x) => x.d <= 8).sort((a, b) => a.d - b.d)[0];
          if (near) plan = { kind: 'gate', gateId: near.g.id };
          else { let pos = null, best = 99; for (let k = 0; k < 10; k++) { const q = G.randomFreeTile(c.base); if (!q) continue; const d = this.travelPlan(q[0], q[1]).days || 99; if (d < best) { best = d; pos = q; } } if (pos) { const g = { id: G.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: c.base, tier: G.crewTier(), theme: RNG.pick(GATE_THEMES), elem: pickElem(), born: G.monthKey(), crew: true }; G.mapGates.push(g); plan = { kind: 'gate', gateId: g.id }; } }
        }
      }
      const tgt = plan.kind === 'gate' ? G.mapGates.find((x) => x.id === plan.gateId) : plan.kind === 'hunt' ? G.mobs.find((x) => x.id === plan.mobId) : null;
      const what = tgt ? (plan.kind === 'gate' ? `${regionById(tgt.region).name}의 ${G.gateName(tgt)}` : `${regionById(tgt.region).name}의 ${tgt.name} 무리 토벌`) : plan.kind === 'escort' ? '운송 차량 호위 의뢰' : '합동 훈련';
      // 팀 집합: 다른 팀원은 알아서 모인다
      c.on = true; G.syncParty(); c.done = (c.done || 0) + 1; G.crewTrust(3);
      const days = tgt ? ride.days(this.travelPlan ? (this.travelPlan(tgt.x, tgt.y).days || regionDist(p.region, tgt.region) * 2) : regionDist(p.region, tgt.region) * 2) : 0;
      const T = { just: `이번엔 ${what}(으)로 간다. 다들 모였지? 출발한다.`, kind: `이번엔 ${what}(으)로 가요. 다 모였죠? 출발해요!`, cold: `${what}. 출발.` };
      this.talk([
        { narr: `${G.crewMembers().filter((n) => n !== L).map((n) => n.name).join(', ')}이(가) 하나둘 모였다.` },
        { who: L, text: say(L, T) },
        tgt ? { sys: `${ride.name}로 ${days}일 이동 (팀 경비)` } : null,
      ].filter(Boolean), () => this.crewDepart(plan, tgt, days));
    },
    crewDepart(plan, tgt, days) {
      const c = led(); if (!c) return this.after();
      const p = G.player;
      if (tgt) {
        G._crewBusy = true;
        try { G.advanceDays(days, { noSave: true }); } finally { G._crewBusy = false; }
        G.queue = G.queue.filter((q) => q.type !== 'crewLate');
        p.x = tgt.x; p.y = tgt.y; p.region = tgt.region; G.reveal(tgt.x, tgt.y, 4); G.syncParty();
        if (G.over) return this.after();
        this.renderGame(); if (this.map) this.map.centerOn(p.x, p.y);
        c.job = true;
        if (plan.kind === 'gate') { this.startGate(tgt.id); if (this.ctx && this.ctx.kind === 'gate') { this.ctx.crewRaid = true; return; } }
        else { this.startMob(tgt.id); if (this.ctx && this.ctx.kind === 'mob') { this.ctx.crewRaid = true; return; } }
        return this.crewJobDone();
      }
      // 호위·훈련: 기존 처리(날짜 대기 없이)
      c.plan = { ...plan, day: G.day }; c.job = true;
      this.rallyAsked = true;
      G._crewBusy = true;
      try { this.answerCrewPlanBase('1'); } finally { G._crewBusy = false; this.rallyAsked = false; }
      if (!this.ctx) this.crewJobDone();
    },
    // 일이 끝나면 거점으로 돌아가 개인 시간, 다음 기한
    crewJobDone() {
      const c = led(); if (!c || !c.job) return;
      c.job = false; c.on = false;
      const p = G.player;
      if (p.region !== c.base && !G.over) {
        const pos = WORLD.cityPos[c.base]; const ride = G.crewRide();
        const d = ride.days(regionDist(p.region, c.base) * 2);
        G._crewBusy = true; try { G.advanceDays(d, { noSave: true }); } finally { G._crewBusy = false; }
        if (pos) { p.x = pos[0]; p.y = pos[1]; } p.region = c.base; G.reveal(p.x, p.y, 4);
        G.log(`${c.name}와(과) 함께 거점 ${G.crewBaseName()}(으)로 돌아왔다. (${ride.name} ${d}일)`);
      }
      G.queue = G.queue.filter((q) => q.type !== 'crewLate');
      G.crewSetDue(false);
    },
  });

  const baseAns = UI.answerCrewPlan;
  UI.answerCrewPlanBase = function (v) { return baseAns.call(this, v); };
  // 리더 교대 제안 외의 옛 일정 창(저장에 남은 것)은 새 흐름으로
  UI.answerCrewPlan = function (v) {
    const c = led(); const plan = c && c.plan;
    if (c && plan && plan.kind !== 'handover') { c.plan = null; this.closeModal(); if (v === '1') return this.crewWork(plan.kind === 'gate' ? plan.gateId : null); return this.after('리더에게는 거점에서 말을 걸면 된다.'); }
    return baseAns.call(this, v);
  };

  // 팀 게이트·토벌이 끝나면
  const baseFG = UI.finishGate;
  if (baseFG) UI.finishGate = function (...a) { const c = this.ctx; const r = baseFG.apply(this, a); if (c && c.crewRaid) { const cc = led(); if (cc && cc.job) G.withCrew(() => this.crewJobDone()); } return r; };
  const baseMob = Game.prototype.finishMob;
  Game.prototype.finishMob = function (...a) { const r = baseMob.apply(this, a); const ctx = UI.ctx; const cc = led(); if (cc && cc.job && (!ctx || ctx.crewRaid)) this.withCrew(() => UI.crewJobDone()); return r; };

  // 파티 화면에는 팀원을 계속 보여 준다
  const basePartyHtml = UI.partyHtml;
  if (basePartyHtml) UI.partyHtml = function () {
    const c = led(); const html = G.withCrew(() => basePartyHtml.call(this));
    return c && !c.on ? html.replace('</h3>', `</h3><p class="small amber">지금은 개인 시간이다. 팀원들은 거점 ${G.crewBaseName()}에 있다. 합류 기한까지 가서 리더에게 말을 걸면 바로 일하러 간다.</p>`) : html;
  };

  // 지도에서 게이트를 눌렀을 때: 개인 시간에는 혼자 들어갈 수 있다. 팀으로 가자는 제안은 거점에서 리더에게
  UI.leadGateAsk = function (L, g) {
    const c = G.crew();
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(L, 96)}<div><div class="eyebrow">${c ? c.name : '파티'} · 리더 ${L.name}</div>
      <p class="event-text">팀으로 가는 일은 리더가 고른다. 지금은 개인 시간이라 혼자 들어갈 수 있다.</p>
      <p class="small dim">이 게이트에 팀으로 가자고 하려면 거점 ${G.crewBaseName()}에서 리더에게 말을 걸 때 제안한다(게이트마다 한 번).</p></div></div>
      <div class="cards"><button class="choice-btn" data-act="gate-solo" data-v="${g.id}">혼자 들어간다 (팀원 없음)</button>
      <button class="choice-btn" data-act="modal-close">돌아간다</button></div>`), 'event-box');
  };

  // 현재 퀘스트 맨 위: 합류 기한
  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    const html = baseHQ.call(this); const c = led(); if (!c || c.on || !c.due) return html;
    const left = c.due - absDay(); const here = G.crewAtBase();
    const row = `<button class="obj-link hq rally" data-act="crew-talk"><span class="hq-mark">⚑</span><span class="hq-t">${here ? `리더 ${G.crewLeader().name}에게 말 걸기 · 일하러 간다` : `${G.crewBaseName()}에서 리더와 합류`}</span><span class="hq-r ${left < 0 ? 'bad' : left <= 2 ? 'amber' : ''}">${left > 0 ? `${dueText(c)}까지 · ${left}일` : left === 0 ? '오늘까지' : '기한 지남'}</span></button>`;
    return html.replace('<div class="obj-title">현재 퀘스트</div>', `<div class="obj-title">현재 퀘스트</div>${row}`).replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '');
  };

  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return;
    const q = G.queue && G.queue[0];
    { const c = led(); if (c && c.job && !this.ctx && !this.dlg) this.crewJobDone(); } // 호위 전투 등 팀 일이 끝나고 화면이 비면 거점으로
    const q0 = G.queue && G.queue[0]; if (q0 !== q) return this.processQueue();
    if (q && q.type === 'crewCall') { G.queue.shift(); if (this.dlg) return; return this.crewCall(q.first); }
    if (q && q.type === 'crewLate') { G.queue.shift(); return this.after(G.crewMissDue()); }
    return baseQ.call(this);
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'gate-solo') { this._soloGate = true; try { return baseHandle.call(this, 'gate', v); } finally { this._soloGate = false; } }
    if (act === 'crew-talk') { if (this.ctx) return; return this.crewTalk(); }
    if (act === 'crew-work') return this.crewWork(null);
    if (act === 'crew-propose') {
      const g = G.mapGates.find((x) => String(x.id) === String(v)); if (!g) return;
      const res = G.crewProposeGate(g); this.closeModal();
      if (!res.ok) { this.toast(res.text); return this.crewTalk(); }
      this.toast(res.text); return this.crewWork(g.id);
    }
    return baseHandle.call(this, act, v);
  };
}
