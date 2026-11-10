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
    if (r >= 4) return { id: 'transit', name: '고속 이동망', days: () => 2 };
    if (r >= 2) return { id: 'truck', name: '파티 장갑차', days: (d) => Math.max(1, Math.ceil(d / 2)) };
    return { id: 'walk', name: '도보', days: (d) => Math.max(1, d) };
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
        tgt ? { sys: `${ride.name}(으)로 이동 · 약 ${days}일 · 길은 리더가 정한다 (팀 경비)` } : null,
      ].filter(Boolean), () => this.crewDepart(plan, tgt, days));
    },
    crewDepart(plan, tgt, days) {
      const c = led(); if (!c) return this.after();
      if (tgt) {
        c.job = true;
        this.crewMarch = { plan, id: tgt.id, kind: plan.kind, x: tgt.x, y: tgt.y, label: plan.kind === 'gate' ? G.gateName(tgt) : `${tgt.name} 무리`, ride: G.crewRide().id };
        // 고속 이동망: 역에서 역으로 (짧은 연출) → 목표 지역 도시에서 걸어서
        if (this.crewMarch.ride === 'transit' && G.player.region !== tgt.region && WORLD.cityPos[tgt.region]) {
          const pos = WORLD.cityPos[tgt.region]; const p = G.player;
          G._crewBusy = true; try { G.advanceDays(2, { noSave: true }); } finally { G._crewBusy = false; }
          p.x = pos[0]; p.y = pos[1]; p.region = tgt.region; G.reveal(p.x, p.y, 5); G.syncParty();
          this.toast(`고속 이동망으로 ${regionById(tgt.region).name}역에 내렸다. (2일 · 팀 경비)`);
          this.renderGame();
        }
        return this.crewMarchStep();
      }
      // 호위·훈련: 기존 처리(날짜 대기 없이)
      c.plan = { ...plan, day: G.day }; c.job = true;
      this.rallyAsked = true;
      G._crewBusy = true;
      try { this.answerCrewPlanBase('1'); } finally { G._crewBusy = false; this.rallyAsked = false; }
      if (!this.ctx) this.crewJobDone();
    },
    // 리더가 지도 위에서 팀을 이끌고 간다 (길 사건이 생기면 멈추고, 결정은 리더가 한 뒤 이어서 간다)
    crewMarchStep() {
      const m = this.crewMarch; if (!m || this.walking || G.over) return;
      const p = G.player;
      const live = m.kind === 'gate' ? G.mapGates.find((x) => x.id === m.id) : G.mobs.find((x) => x.id === m.id);
      if (live) { m.x = live.x; m.y = live.y; }
      if (p.x === m.x && p.y === m.y) return this.crewArrive();
      if (!live) { this.crewMarch = null; this.toast('목표가 사라졌다. 리더가 거점으로 돌아가자고 한다.'); return this.crewJobDone(); }
      const plan = this.travelPlan ? this.travelPlan(m.x, m.y) : null;
      if (!plan || plan.err || !plan.steps.length) { this.crewMarch = null; return this.crewArrive(live); }
      this.travel = { x: m.x, y: m.y, label: m.label };
      const map = this.map;
      if (map && !map._baseTween) { map._baseTween = map.tween; const k = FX.reduced ? 0.15 : plan.steps.length > 12 ? 0.4 : 0.7; map.tween = function (from, to, ms, done) { return map._baseTween.call(this, from, to, ms * k, done); }; }
      this.closeModal();
      this.walk(plan.steps);
    },
    crewArrive(live) {
      const m = this.crewMarch; this.crewMarch = null; this.travel = null;
      const tgt = live || (m && (m.kind === 'gate' ? G.mapGates.find((x) => x.id === m.id) : G.mobs.find((x) => x.id === m.id)));
      if (!m || !tgt) return this.crewJobDone();
      this.renderGame();
      if (m.kind === 'gate') { this.startGate(tgt.id); if (this.ctx && this.ctx.kind === 'gate') { this.ctx.crewRaid = true; return; } }
      else { this.startMob(tgt.id); if (this.ctx && this.ctx.kind === 'mob') { this.ctx.crewRaid = true; return; } }
      return this.crewJobDone();
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

  // 팀 이동: 도착하면 리더가 이끄는 진입, 멈추면 일이 끝난 뒤 다시 걷는다
  const baseEnd = UI.endWalk;
  UI.endWalk = function (...a) {
    const m = this.crewMarch; const p = G.player;
    if (m && p.x === m.x && p.y === m.y) { this._crewArriving = true; try { this.walking = null; } catch (e) { /* 무시 */ } }
    const r = baseEnd.apply(this, a);
    if (this._crewArriving) { this._crewArriving = false; if (this.crewMarch) return this.crewArrive(); }
    return r;
  };
  const baseEnc = UI.encounter;
  const resume = (ui) => { const m = ui.crewMarch; setTimeout(() => { if (ui.crewMarch === m && !ui.walking && !ui.ctx && !ui.modalOpen() && !ui.dlg) ui.crewMarchStep(); }, 350); };
  UI.encounter = function (obj) { if (this._crewArriving) return; if (this.crewMarch) return resume(this); return baseEnc.call(this, obj); };
  const baseOpenCity = UI.openCity;
  if (baseOpenCity) UI.openCity = function (...a) { if (this._crewArriving) return; if (this.crewMarch) return resume(this); return baseOpenCity.apply(this, a); };
  // 리더가 이끄는 동안 지도를 눌러 방향을 바꿀 수 없다
  const baseTap = UI.onTap;
  UI.onTap = function (x, y) { if (this.crewMarch) { this.toast('리더가 길을 정한다. 팀이 목표로 가는 중이다.'); return; } return baseTap.call(this, x, y); };
  // 길 사건의 선택은 리더가 한다
  const baseStory = UI.showStory;
  if (baseStory) UI.showStory = function (q) { const r = baseStory.call(this, q); if (this.crewMarch && this.leaderGate) this.leaderGate(['story-choice']); return r; };
  // 이동수단: 파티 장갑차는 하루에 두 배를 간다(괴수 기습 없음)
  const baseStep = Game.prototype.walkStep;
  Game.prototype.walkStep = function (x, y, diag) {
    const m = UI.crewMarch; if (!m || m.ride !== 'truck') return baseStep.call(this, x, y, diag);
    const save = WORLD.DAYS_PER_COST; WORLD.DAYS_PER_COST = save / 2;
    let res; try { res = baseStep.call(this, x, y, diag); } finally { WORLD.DAYS_PER_COST = save; }
    const before = this.queue.length; this.queue = this.queue.filter((q) => q.type !== 'mobAmbush');
    if (this.queue.length !== before) res.stop = !!this.objAt(x, y) || this.queue.length > 0;
    return res;
  };

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
    { const c = led(); if (c && c.job && !this.ctx && !this.dlg && !this.crewMarch && !this.walking) this.crewJobDone(); }
    if (this.crewMarch && !this.walking && !this.ctx && !this.dlg && !(G.queue && G.queue.length)) { const m = this.crewMarch; setTimeout(() => { if (this.crewMarch === m && !this.walking && !this.ctx && !this.modalOpen()) this.crewMarchStep(); }, 400); return; } // 호위 전투 등 팀 일이 끝나고 화면이 비면 거점으로
    const q0 = G.queue && G.queue[0]; if (q0 !== q) return this.processQueue();
    if (q && q.type === 'crewCall') { G.queue.shift(); if (this.dlg) return; return this.crewCall(q.first); }
    if (q && q.type === 'crewLate') { G.queue.shift(); return this.after(G.crewMissDue()); }
    const r = baseQ.call(this);
    // 팀 이동 중 기습: 싸울지 달아날지 리더가 정한다. 나는 따른다(몇 초 뒤 저절로)
    const box = document.getElementById('modal-box');
    if (this.crewMarch && box && box.querySelector('.mob-enc') && !box.querySelector('.lead-dec')) {
      const L = G.crewLeader(); const fight = box.querySelector('[data-act="mob"]'); const flee = box.querySelector('[data-act="mob-flee"]');
      if (L && fight && flee) {
        const mob = G.mobs.find((m) => String(m.id) === fight.dataset.v);
        const go = !mob || mob.tier <= L.rankIdx + (L.personality === 'warlike' ? 1 : 0) || L.personality === 'warlike';
        const T = go ? { just: '피할 수 없다. 맞선다.', kind: '싸워야겠어요. 다들 준비해요!', cold: '친다.' } : { just: '저건 무리다. 물러난다.', kind: '저건 안 돼요. 일단 피해요!', cold: '빠진다.' };
        const pick = go ? fight : flee;
        fight.closest('.row').insertAdjacentHTML('beforebegin', `<div class="cn-card lead-dec"><b>${L.name}(리더)의 결정</b> <span class="small">· ${go ? '맞서 싸운다' : '달아난다'}</span><p class="small">"${T[typeof voiceCol === 'function' ? voiceCol(L) : 'just'] || T.just}"</p></div>`);
        fight.closest('.row').innerHTML = `<button class="primary" data-act="${pick.dataset.act}" data-v="${pick.dataset.v}">따른다</button>`;
        this.autoFollow(box.querySelector('.lead-dec + .row [data-act], .row.end [data-act]'), 4);
      }
    }
    return r;
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

// ===== 대칭: 내가 리더일 때도 같은 흐름 — 호출 → 함께 이동·일 → 일이 끝나면 해산 =====
// 평소 팀원들은 거점(마지막으로 해산한 도시)에 있고 나는 혼자 움직인다(G.party()에 없음).
// 도시에서 [팀 호출] → 팀원들이 그 도시로 온다(거리만큼 1~6일, 늦는 팀원도 있다). 다 모이면 함께 다닌다.
// 게이트·토벌이 끝나면 팀은 해산해 거점으로 돌아간다. 늦은 팀원: 관계 −3, 명성 −2, 어긴 횟수 +1, 세 번이면 내보냄.
const LEAD_TIME = { lateBase: 0.06, lateLowRel: 0.12, lateLazy: 0.15, missFame: 2, missRel: 3, kickAfter: 3 };
{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const mine = (g) => { const p = g.player; return p && !p.crew ? p.lead : null; };
  const baseParty = GP.party;
  GP.party = function () {
    const all = baseParty.call(this); const L = mine(this);
    if (this._crewAll || !L) return all;
    if (L.state !== 'on') return [];
    const now = absDay(this);
    return all.filter((n) => !L.late || !L.late[n.id] || L.late[n.id] <= now);
  };
  for (const name of ['canRecruit', 'dismiss', 'recruit']) {
    const base = GP[name]; if (!base) continue;
    GP[name] = function (...a) { return this.withCrew(() => base.apply(this, a)); };
  }
  GP.leadMembers = function () { return this.withCrew(() => (this.player.crew ? [] : this.party())); };
  // 해산: 팀원은 거점으로 돌아간다
  GP.leadDisband = function (why) {
    const p = this.player; if (p.crew || !this.leadMembers().length) return '';
    const base = (p.lead && p.lead.base) || p.region;
    p.lead = { state: 'free', base };
    for (const n of this.leadMembers()) n.region = base;
    return why || `팀이 해산했다. 팀원들은 ${regionById(base).name}(으)로 돌아갔다. 다음 일은 도시에서 [팀 호출]로.`;
  };
  // 호출: 지금 있는 도시로 모인다
  GP.leadCall = function () {
    const p = this.player; const L = mine(this); if (!L || L.state !== 'free' || !this.onCity()) return '';
    const now = absDay(this); const due = now + Math.max(1, Math.min(6, regionDist(L.base, p.region) * 2));
    const late = {};
    for (const n of this.leadMembers()) {
      const lazy = /lazy|spacey|gambler|drifter/.test(n.persona || '');
      if (RNG.chance(LEAD_TIME.lateBase + ((n.relation || 0) < 20 ? LEAD_TIME.lateLowRel : 0) + (lazy ? LEAD_TIME.lateLazy : 0))) late[n.id] = due + RNG.int(1, 3);
    }
    p.lead = { state: 'called', base: p.region, due, late, at: p.region };
    return `팀원들에게 연락했다. ${due - now}일 안에 ${regionById(p.region).name}(으)로 모인다.`;
  };
  // 날마다: 다 모였는지, 늦은 팀원 도착
  GP.leadTick = function () {
    const p = this.player; const L = mine(this); if (!L || this.over) return;
    const now = absDay(this);
    if (L.state === 'called' && now >= L.due && p.region === L.at) {
      L.state = 'on'; L.base = L.at;
      const here = this.party(); for (const n of here) n.region = p.region;
      this.queue.push({ type: 'toast', text: `팀이 모였다: ${here.map((n) => n.name).join(', ') || '없음'}.${Object.keys(L.late || {}).length ? ' 아직 안 온 팀원이 있다.' : ''}` });
    }
    if (L.state === 'on' && L.late) for (const id of Object.keys(L.late)) {
      if (L.late[id] > now) continue;
      const n = this.npcById(+id); delete L.late[id]; if (!n || !n.alive) continue;
      n.teamMiss = (n.teamMiss || 0) + 1; this.changeRel(n, -LEAD_TIME.missRel, '호출에 늦었다'); n.fame = Math.max(0, (n.fame || 0) - LEAD_TIME.missFame); n.region = p.region;
      this.queue.push({ type: 'toast', text: n.teamMiss >= LEAD_TIME.kickAfter ? `${n.name}이(가) 세 번째로 늦었다. 팀에서 내보냈다. ${this.dismiss(n.id) || ''}` : `${n.name}이(가) 늦게 합류했다. (관계 −${LEAD_TIME.missRel}, 명성 −${LEAD_TIME.missFame}, 늦은 횟수 ${n.teamMiss}/${LEAD_TIME.kickAfter})` });
    }
  };
  const baseAdv = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) { const r = baseAdv.call(this, n, opts); this.leadTick(); return r; };
  // 일이 끝나면 해산 (게이트·토벌)
  const baseMob = GP.finishMob;
  GP.finishMob = function (...a) { const r = baseMob.apply(this, a); const L = mine(this); if (L && L.state === 'on' && !this.over) this.queue.push({ type: 'toast', text: this.leadDisband(`일이 끝나 팀이 해산했다. 팀원들은 ${regionById(L.base).name}(으)로 돌아갔다.`) }); return r; };
  // 새 팀원: 함께 있을 때 들어오면 함께, 아니면 거점으로
  const baseRec = GP.recruit;
  GP.recruit = function (id) { const r = baseRec.call(this, id); const L = mine(this); const n = this.npcById(id); if (L && n && n.isCompanion && L.state !== 'on') n.region = L.base; return r; };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function () { baseInit.call(this); const p = this.player; if (p) { if (p.lead && !p.lead.state) p.lead = null; p.lead ??= null; } };
}
if (typeof UI !== 'undefined') {
  const absDay = () => G.monthKey() * 30 + G.day;
  const mine = () => { const p = G.player; return p && !p.crew ? p.lead : null; };
  const baseFG = UI.finishGate;
  if (baseFG) UI.finishGate = function (...a) { const r = baseFG.apply(this, a); const L = mine(); if (L && L.state === 'on' && !G.over) this.toast(G.leadDisband(`일이 끝나 팀이 해산했다. 팀원들은 ${regionById(L.base).name}(으)로 돌아갔다.`)); return r; };
  // 팀원이 있는데 아직 이 흐름이 아니면(옛 저장·처음 영입) 함께 있는 상태로 시작한다
  const ensure = () => { const p = G.player; if (p && !p.crew && !p.lead && G.leadMembers().length) p.lead = { state: 'on', base: p.region }; if (p && !p.crew && p.lead && !G.leadMembers().length) p.lead = null; };
  const basePH = UI.partyHtml;
  if (basePH) UI.partyHtml = function () {
    ensure(); let html = basePH.call(this); const L = mine(); if (!L) return html;
    const line = L.state === 'free' ? `팀은 해산 중 · 팀원들은 ${regionById(L.base).name}에 있다. ${G.onCity() ? '<button class="sm primary" data-act="lead-call">팀 호출 (이 도시로)</button>' : '도시에서 호출할 수 있다.'}`
      : L.state === 'called' ? `팀 호출 중 · ${regionById(L.at).name}(으)로 ${Math.max(0, L.due - absDay())}일 안에 모인다.`
      : `팀과 함께 움직이는 중. <button class="sm" data-act="lead-disband">해산한다</button>`;
    return html.replace('</h3>', `</h3><p class="small amber">${line}</p>`);
  };
  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    ensure(); const html = baseHQ.call(this); const L = mine(); if (!L || L.state === 'on') return html;
    const here = G.onCity();
    const row = L.state === 'free'
      ? `<button class="obj-link hq rally" data-act="lead-call"><span class="hq-mark">⚑</span><span class="hq-t">${here ? '팀 호출 · 이 도시로 모은다' : '팀 호출 (도시에서)'}</span><span class="hq-r">해산 중</span></button>`
      : `<button class="obj-link hq rally" data-act="lead-wait"><span class="hq-mark">⚑</span><span class="hq-t">${regionById(L.at).name}에서 팀 집결 · 기다린다</span><span class="hq-r amber">${Math.max(0, L.due - absDay())}일</span></button>`;
    return html.replace('<div class="obj-title">현재 퀘스트</div>', `<div class="obj-title">현재 퀘스트</div>${row}`).replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '');
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'lead-call') { ensure(); const t = G.leadCall(); if (t) { this.closeModal(); this.renderGame(); return this.toast(t); } return this.toast('도시에서 팀을 호출할 수 있다.'); }
    if (act === 'lead-disband') { const t = G.leadDisband(); if (t) { this.closeModal(); this.renderGame(); return this.toast(t); } return; }
    if (act === 'lead-wait') {
      const L = mine(); if (!L || L.state !== 'called' || this.ctx) return;
      if (G.player.region !== L.at) return this.travelRegion ? this.travelRegion(L.at) : null;
      const d = Math.max(1, L.due - absDay()); G.advanceDays(d); this.renderGame(); return this.processQueue();
    }
    return baseHandle.call(this, act, v);
  };
}
