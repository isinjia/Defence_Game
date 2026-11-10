// ===== "리더가 이끈다" (영역 D, 사용자 요청) =====
// 플레이어가 리더가 아닐 때(crew.js 파티의 NPC 리더가 있을 때):
// 1) 월드맵: 게이트는 리더가 잡는 일정(crew.js crewPlan)으로 들어간다. 지도에서 게이트를 누르면 "리더에게 제안"만 할 수 있다.
// 2) 게이트 층 지도: 리더가 먼저 길을 제안하고(council.js), 나는 O·X·다른 길 의견. 엉망인 리더는 길을 대충 고른다.
// 3) 게이트 안 사건·탐색 사건: 리더가 고르고 나는 따르거나 반대(설득 성공은 리더 성격·관계·리더십).
// 4) 첫 팀에는 탐색계 동료가 꼭 있고(first_team.js), 첫 게이트에서 정찰을 알려 준다.
// 5) 리더 품질(orders.js npcLead 0~100): 정확·무난·어설픔·엉망 — 말과 판단이 달라진다.
// 플레이어가 리더(자기 파티·솔로)면 지금처럼 직접 정한다.

const LEAD_TIER = (q) => (q >= 75 ? 'good' : q >= 50 ? 'ok' : q >= 30 ? 'poor' : 'bad');
const LEAD_TIP = {
  map: {
    good: ['층 지도는 위로 갈수록 깊다. 정찰이 본 칸부터 믿고, 미확인 칸은 체력이 넉넉할 때만 간다.', '샘은 아껴 둬. 보스 앞에서 쉬는 게 제일 비싸다.'],
    ok: ['길은 내가 고를게. 반대면 말해.', '체력 반 아래면 샘부터 찾자.'],
    poor: ['음… 일단 가 보고 생각하자.', '길? 대충 위로 가면 되겠지.'],
    bad: ['아무 데나 가자. 다 비슷하지 뭐.', '…어디였더라. 아무튼 따라와.'],
  },
};
const leadQ = (L) => (typeof npcLead === 'function' ? npcLead(L) : 60);

if (typeof UI !== 'undefined') {
  const npcLeader = () => (UI.councilLeader ? UI.councilLeader() : null);

  // ---------- 2) 층 지도: 리더가 먼저 길을 제안 ----------
  if (UI.councilLeaderPick) {
    const basePick = UI.councilLeaderPick;
    UI.councilLeaderPick = function (L) {
      const tier = LEAD_TIER(leadQ(L));
      const reach = this.reachable();
      if ((tier === 'bad' && RNG.chance(0.6)) || (tier === 'poor' && RNG.chance(0.3))) { const [r, i] = RNG.pick(reach); return r + ':' + i; }
      return basePick.call(this, L);
    };
  }
  const baseMap = UI.renderGateMap;
  if (baseMap) UI.renderGateMap = function (note) {
    const r = baseMap.call(this, note);
    const c = this.ctx; const L = npcLeader();
    if (!c || !c.run || !L || c.council || G.over) return r;
    const box = document.getElementById('modal-box');
    if (box && !box.querySelector('.lead-rule')) {
      const tip = RNG.pick(LEAD_TIP.map[LEAD_TIER(leadQ(L))]);
      box.insertAdjacentHTML('afterbegin', `<div class="coach lead-say lead-rule"><span class="eyebrow">${L.name} · 리더</span><div>"${tip}" <span class="small dim">· 길은 리더가 정한다. 칸을 누르면 그쪽을 제안한다.</span></div></div>`);
    }
    const reach = this.reachable ? this.reachable() : [];
    const tag = `${c.run.floor}|${reach.map((x) => x.join(':')).join(',')}`;
    if (reach.length > 1 && c.run.leadAsked !== tag) {
      c.run.leadAsked = tag; const ctx = c;
      setTimeout(() => { if (this.ctx === ctx && !ctx.council && !this.dlg && !ctx.run.scoutPending && document.getElementById('modal-box')) { const k = this.councilLeaderPick(L); if (k) this.councilStart(k, null); } }, FX.reduced ? 200 : 700);
    }
    return r;
  };

  // ---------- 3) 사건 결정: 리더가 고른다 ----------
  const PREF = {
    warlike: /싸|공격|덤벼|부순|찢|돌격|맞서/, greedy: /챙|연다|줍|가져|캐|판다|보상/, cold: /살핀|확인|정찰|조심|돌아|기다|피한/,
    just: /돕|구한|살린|신고|지킨|막는/, kind: /돕|구한|치료|달랜|살린|나눈/,
  };
  const leaderChoose = (L, list) => {
    const tier = LEAD_TIER(leadQ(L));
    if (tier === 'bad' || (tier === 'poor' && RNG.chance(0.5))) return RNG.pick(list).i;
    const re = PREF[L.personality];
    const fav = re ? list.filter((x) => re.test(x.text)) : [];
    return (fav.length ? RNG.pick(fav) : RNG.pick(list)).i;
  };
  // 사건 창이 그려진 뒤: 선택지를 잠그고 리더 결정 줄을 붙인다
  const leaderGate = (acts) => {
    const L = npcLeader(); if (!L) return;
    const box = document.getElementById('modal-box'); if (!box) return;
    const act = [].concat(acts).find((a) => box.querySelectorAll(`[data-act="${a}"]`).length >= 2); if (!act) return;
    const btns = [...box.querySelectorAll(`[data-act="${act}"]`)];
    const list = btns.map((b) => ({ i: +b.dataset.v, text: b.textContent }));
    const pick = leaderChoose(L, list);
    const picked = list.find((x) => x.i === pick);
    for (const b of btns) { b.disabled = true; b.classList.toggle('lead-pick', +b.dataset.v === pick); }
    UI.leadDecision = { act, pick, L: L.id };
    const say = { cold: '이걸로 간다.', just: '이렇게 하자. 이유는 나중에 설명하지.', kind: '이렇게 해 보는 게 어때요?', warlike: '고민할 거 없어. 이거다.', greedy: '남는 쪽으로 가자.', ...VOICE_EXTRA.decide }[voiceKey(L)] || '이렇게 하자.';
    btns[btns.length - 1].closest('.cards').insertAdjacentHTML('afterend', `<div class="cn-card lead-dec"><b>${L.name}(리더)의 결정</b> <span class="small">· ${picked.text}</span>
      <p class="small">"${say}"</p><div class="cn-btns"><button class="primary" data-act="lead-ok">O 따른다</button><button class="danger" data-act="lead-no">X 반대한다</button></div></div>`);
  };
  const baseEv = UI.gateEvent;
  if (baseEv) UI.gateEvent = function () { const r = baseEv.apply(this, arguments); leaderGate(['g-ev', 'ck-ev']); return r; };
  const baseEx = UI.showExplore;
  if (baseEx) UI.showExplore = function (node, opts = {}) { const r = baseEx.call(this, node, opts); if (!opts.lead) leaderGate(['ex-choice', 'ck-ex', 'ck-ev']); return r; };

  // ---------- 1) 월드맵: 게이트는 리더 일정으로 ----------
  const crewNpcLead = () => { const p = G.player; return p && p.crew && G.crewLeader ? G.crewLeader() : null; };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'lead-ok' || act === 'lead-no') {
      const d = this.leadDecision; if (!d) return; this.leadDecision = null;
      const L = G.npcById(d.L);
      if (act === 'lead-ok') { if (L) G.changeRel(L, 1, '리더 결정을 따랐다'); return baseHandle.call(this, d.act, String(d.pick)); }
      const q = leadQ(L);
      const chance = 0.25 + (L.relation || 0) / 200 + (L.personality === 'kind' || L.personality === 'just' ? 0.15 : L.personality === 'cold' ? -0.1 : 0) + (q >= 75 ? 0.05 : 0);
      if (RNG.chance(Math.max(0.05, Math.min(0.85, chance)))) {
        this.toast(`${L.name}: "…그래, 네 생각대로 해 보자."`);
        const box = document.getElementById('modal-box');
        if (box) { for (const b of box.querySelectorAll(`[data-act="${d.act}"]`)) b.disabled = false; const dec = box.querySelector('.lead-dec'); if (dec) dec.remove(); }
        return;
      }
      if (L) G.changeRel(L, -1, '결정에 반대했다');
      this.toast(`${L.name}: "${L.personality === 'cold' ? '내가 정한다.' : '미안, 이번엔 내 판단대로 갈게.'}"`);
      return baseHandle.call(this, d.act, String(d.pick));
    }
    if (act === 'gate' && crewNpcLead() && !this.ctx && !(G.mapGates.find((x) => String(x.id) === String(v)) || {}).final && !(G.mapGates.find((x) => String(x.id) === String(v)) || {}).mission) {
      const L = crewNpcLead(); const g = G.mapGates && G.mapGates.find((x) => String(x.id) === String(v));
      if (g) return this.leadGateAsk(L, g);
    }
    if (act === 'lead-gate') {
      const L = crewNpcLead(); const g = G.mapGates.find((x) => String(x.id) === String(v)); this.closeModal();
      if (!L || !g) return this.after();
      const ok = RNG.chance(Math.max(0.1, Math.min(0.9, 0.3 + L.relation / 150 + (g.tier <= L.rankIdx ? 0.15 : -0.25))));
      if (!ok) { G.changeRel(L, -1, '일정에 없는 게이트를 조르다'); return this.after(`${L.name}: "그 게이트는 안 돼. ${g.tier > L.rankIdx ? '우리 수준엔 위험해.' : '일정대로 가자.'}"`); }
      this.after(`${L.name}: "좋아, 거기로 가자. 다들 모여."`);
      this.startGate(g.id); if (this.ctx && this.ctx.kind === 'gate') this.ctx.crewRaid = true;
      return;
    }
    return baseHandle.call(this, act, v);
  };
  UI.leadGateAsk = function (L, g) {
    const c = G.crew();
    const plan = c && c.plan && G.crewPlanText ? G.crewPlanText(c.plan) : null;
    this.modal(fixJosa(`<div class="story-portrait">${this.npcPortrait(L, 96)}<div><div class="eyebrow">${c ? c.name : '파티'} · 리더 ${L.name}</div>
      <p class="event-text">게이트는 리더가 일정을 잡아 다 같이 들어간다. 혼자 정해서 들어갈 수는 없다.</p>
      ${plan ? `<p class="small">다음 일정: ${plan.text}</p>` : '<p class="small dim">리더가 이번 달 일정을 곧 잡는다.</p>'}</div></div>
      <div class="cards"><button class="choice-btn" data-act="lead-gate" data-v="${g.id}">리더에게 "${G.gateName(g)}"에 가자고 제안한다</button>
      <button class="choice-btn" data-act="modal-close">일정을 기다린다</button></div>`), 'event-box');
  };

  // ---------- 5) 엉망인 리더는 일정 날짜를 헷갈린다 ----------
  if (Game.prototype.crewPlanText) {
    const basePT = Game.prototype.crewPlanText;
    Game.prototype.crewPlanText = function (plan) {
      const t = basePT.call(this, plan); const L = this.crewLeader && this.crewLeader();
      if (!t || !L || plan.kind === 'handover') return t;
      const tier = LEAD_TIER(leadQ(L));
      plan.mixed ??= tier === 'bad' ? RNG.chance(0.5) : tier === 'poor' ? RNG.chance(0.2) : false;
      if (plan.mixed) return { ...t, text: t.text + ` <span class="small dim">(…잠깐, ${plan.day}일이었나 ${Math.min(29, plan.day + 1)}일이었나. 아무튼 그쯤에 보자.)</span>` };
      if (tier === 'good') return { ...t, text: t.text + ' <span class="small dim">(집결은 전날 저녁. 장비 점검표는 따로 보낸다.)</span>' };
      return t;
    };
  }

  // ---------- 4) 첫 게이트: 탐색계 동료가 정찰을 알려 준다 ----------
  const baseMap2 = UI.renderGateMap;
  if (baseMap2) UI.renderGateMap = function (note) {
    const r = baseMap2.call(this, note);
    const p = G.player; const c = this.ctx;
    if (!c || !c.run || p.scoutTaught || !G.partyScout) return r;
    const sc = G.partyScout(); if (!sc || !sc.who) return r;
    p.scoutTaught = true; c.run.scoutPending = true;
    const R = typeof GateScout !== 'undefined' ? GateScout.range(sc.power) : 2;
    setTimeout(() => {
      if (this.ctx !== c || !this.talk) return;
      this.talk([
        { who: sc.who, text: `잠깐. 정찰은 내 담당이야. 지도에 물음표로 보이는 칸은 아직 아무도 확인 못 한 "미확인" 칸이야.` },
        { who: sc.who, text: `나는 지금 ${R}칸 앞까지 볼 수 있어. 등급이 오르면 더 멀리 보이고.` },
        { who: sc.who, text: '멀리 볼수록 틀릴 수도 있어. 정예를 그냥 괴수로 볼 때도 있고. 가까운 칸일수록 믿어도 돼.' },
      ], () => { c.run.scoutPending = false; c.run.leadAsked = null; if (this.ctx === c && c.run) this.renderGateMap(); });
    }, FX.reduced ? 300 : 1200);
    return r;
  };
}

// 첫 팀에 탐색계 동료를 꼭 넣는다 (first_team.js)
if (typeof Game !== 'undefined' && Game.prototype.firstTeamBuild) {
  const baseBuild = Game.prototype.firstTeamBuild;
  Game.prototype.firstTeamBuild = function (kind) {
    const t = baseBuild.call(this, kind);
    const ids = [t.leader, ...t.members]; const p = this.player;
    const isRecon = (cls) => { const c = classById(cls); return c && c.g === 'recon'; };
    if (isRecon(p.cls) || ids.some((id) => { const n = this.npcById(id); return n && isRecon(n.cls); })) return t;
    // 팀원(리더 말고) 중 역할이 맞는 탐색계 직업으로 바꾼다
    const recon = CLASSES.filter((c) => c.g === 'recon' && c.r < 2);
    for (const id of t.members) {
      const n = this.npcById(id); if (!n || n.examMate || n.friendhood) continue;
      const role = classById(n.cls).role; const fit = recon.filter((c) => c.role === role);
      const pick = fit.length ? RNG.pick(fit) : null;
      if (pick) { n.cls = pick.id; n.scoutGuide = true; return t; }
    }
    const n = this.npcById(t.members[0]); if (n) { n.cls = RNG.pick(recon).id; n.scoutGuide = true; }
    return t;
  };
}

// ---------- 집결과 지각 (사용자 요청: "집결지 늦을 때 불이익") ----------
// 리더 일정(게이트·토벌)을 수락할 때 "같이 이동"(바로 출발) 또는 "집결지에서 만나기"를 고른다.
// 집결지에서 만나기로 했으면 그 날까지 그 지역에 가야 한다(현재 퀘스트 목록 · 누르면 자동 이동).
// 조금 늦음(RALLY.lateOk일 이내): 리더·팀원 관계 소폭↓·신뢰↓, 리더 한마디. 그 뒤 함께 들어간다.
// 크게 늦음·불참: 파티가 먼저 들어가 그 보상은 없다. 관계·명성·신뢰 크게↓, RALLY.kickAfter번째 불참이면 제명.
// 리더가 날짜를 헷갈린 일정(plan.mixed)은 내 탓이 아니다: 불이익 없음, 리더가 사과하거나 남 탓을 한다.
const RALLY = { lateOk: 3, relPerDay: 2, relMax: 6, memberLate: 1, trustLate: 4, missLeader: 8, missMember: 3, missFame: 2, missTrust: 15, kickAfter: 3 };
{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  GP.rally = function () { const c = this.crew && this.crew(); return c && c.rally ? c.rally : null; };
  GP.rallyCheck = function () {
    const r = this.rally(); if (!r || r.queued || this.over) return;
    const now = absDay(this); const p = this.player;
    if (p.region === r.region && now <= r.at + RALLY.lateOk) { r.queued = true; this.queue.unshift({ type: 'rallyGo', late: Math.max(0, now - r.at) }); }
    else if (now > r.at + RALLY.lateOk) { r.queued = true; this.queue.unshift({ type: 'rallyMiss' }); }
  };
  const baseAdv = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) { const res = baseAdv.call(this, n, opts); if (!this._rallyBusy) this.rallyCheck(); return res; };
}

if (typeof UI !== 'undefined') {
  const LATE_SAY = {
    cold: '늦었다. 다음엔 두고 간다.', just: '늦었군. 사정이 있었겠지만, 팀은 기다려 주는 곳이 아니다.', kind: '왔네요! 걱정했어요. …다음엔 연락이라도 줘요.',
    warlike: '얼마나 기다렸는지 알아? 몸은 다 풀렸다고.', greedy: '시간이 돈이야. 이번 몫에서 깎을까 하다 참는다.',
  };
  const MIX_SAY = { cold: '…내가 날짜를 잘못 말했군. 내 실수다.', just: '미안하다. 공지가 틀렸다. 네 잘못이 아니다.', kind: '아, 제가 날짜를 헷갈렸어요! 미안해요.', warlike: '누가 날짜를 그렇게 적어 놨어? …아, 나구나.', greedy: '공지 정리하는 애가 틀렸네. 나 말고.' };
  const sayOf = (T, L) => T[L && voiceCol(L)] || T.just;

  // 수락할 때: 같이 이동 / 집결지에서 만나기
  const baseAns = UI.answerCrewPlan;
  UI.answerCrewPlan = function (v) {
    const c = G.crew(); const plan = c && c.plan;
    if (v === '1' && plan && (plan.kind === 'gate' || plan.kind === 'hunt') && !this.rallyAsked) {
      const tgt = plan.kind === 'gate' ? G.mapGates.find((x) => x.id === plan.gateId) : G.mobs.find((x) => x.id === plan.mobId);
      if (tgt) {
        this.rallyAsked = true;
        return this.modal(fixJosa(`<div class="eyebrow">${c.name} · 일정 참가</div><h3>어떻게 갈까?</h3>
          <p class="event-text">집결: ${G.month}월 ${plan.day}일 · ${regionById(tgt.region).name}</p>
          <div class="cards"><button class="choice-btn" data-act="rally-with">리더와 같이 이동한다 (지금 출발)</button>
          <button class="choice-btn" data-act="rally-meet">집결지에서 만난다 (그날까지 ${regionById(tgt.region).name}에 도착 · 늦으면 불이익)</button></div>`), 'event-box');
      }
    }
    this.rallyAsked = false;
    return baseAns.call(this, v);
  };

  UI.rallyGo = function (late) {
    const c = G.crew(); const r = G.rally(); const L = G.crewLeader();
    if (!c || !r || !L) { if (c) c.rally = null; return this.processQueue(); }
    c.rally = null;
    let lines = [];
    if (late > 0 && !r.mixed) {
      const d = Math.min(RALLY.relMax, RALLY.relPerDay * late);
      G.changeRel(L, -d, `집결에 ${late}일 늦었다`); for (const n of G.party()) if (n !== L) G.changeRel(n, -RALLY.memberLate, '집결에 늦었다');
      G.crewTrust(-RALLY.trustLate * late);
      lines = [`${L.name}: "${sayOf(LATE_SAY, L)}" (리더 관계 -${d}, 신뢰 -${RALLY.trustLate * late})`];
    } else if (r.mixed && late > 0) lines = [`${L.name}: "${sayOf(MIX_SAY, L)}"`];
    const now = G.monthKey() * 30 + G.day;
    G._rallyBusy = true; try { if (now < r.at) G.advanceDays(r.at - now, { noSave: true }); } finally { G._rallyBusy = false; }
    const p = G.player;
    if (r.kind === 'gate') {
      const g = G.mapGates.find((x) => x.id === r.id);
      if (!g) return this.after('도착해 보니 이미 다른 파티가 게이트를 닫은 뒤였다.');
      p.x = g.x; p.y = g.y; G.syncParty && G.syncParty();
      if (lines.length) this.toast(lines.join(' '));
      this.renderGame(); this.startGate(g.id); if (this.ctx && this.ctx.kind === 'gate') this.ctx.crewRaid = true; return;
    }
    const m = G.mobs.find((x) => x.id === r.id);
    if (!m) return this.after('목표 무리는 이미 흩어진 뒤였다.');
    p.x = m.x; p.y = m.y; if (lines.length) this.toast(lines.join(' '));
    this.renderGame(); return this.startMob(m.id);
  };
  UI.rallyMiss = function () {
    const c = G.crew(); const r = G.rally(); const L = G.crewLeader();
    if (!c || !r) return this.processQueue();
    c.rally = null;
    if (r.mixed) { if (L) return this.after(`${L.name}: "${sayOf(MIX_SAY, L)} 이번 건은 다음 달로 미루자." (불이익 없음)`); return this.processQueue(); }
    if (r.kind === 'gate') { const g = G.mapGates.find((x) => x.id === r.id); if (g) g.cleared = true; }
    c.missed = (c.missed || 0) + 1; G.crewTrust(-RALLY.missTrust);
    if (L) G.changeRel(L, -RALLY.missLeader, '집결에 나타나지 않았다');
    for (const n of G.party()) if (n !== L) G.changeRel(n, -RALLY.missMember, '집결에 나타나지 않았다');
    G.player.fame = Math.max(0, (G.player.fame || 0) - RALLY.missFame);
    G.lifeEvent(`${c.name}의 집결에 나타나지 않았다. 파티는 먼저 들어갔다.`);
    const miss = c.missed;
    if (miss >= RALLY.kickAfter || c.trust <= 0) return this.after(`${L ? `${L.name}: "세 번이면 충분해." ` : ''}${G.crewLeave('kicked')}`);
    return this.after(`${L ? `${L.name}: "${miss === RALLY.kickAfter - 1 ? '한 번만 더 이러면 같이 못 간다.' : '우리끼리 들어갔다. 몫은 없다.'}" ` : ''}(리더 관계 -${RALLY.missLeader}, 명성 -${RALLY.missFame}, 신뢰 -${RALLY.missTrust} · 불참 ${miss}/${RALLY.kickAfter})`);
  };

  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return;
    const q = G.queue && G.queue[0];
    if (q && q.type === 'rallyGo') { G.queue.shift(); return this.rallyGo(q.late); }
    if (q && q.type === 'rallyMiss') { G.queue.shift(); return this.rallyMiss(); }
    return baseQ.call(this);
  };

  // 현재 퀘스트 목록 맨 위에 집결 (누르면 자동 이동)
  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    const html = baseHQ.call(this); const r = G.player && G.rally && G.rally(); if (!r) return html;
    const left = r.at - (G.monthKey() * 30 + G.day);
    const row = `<button class="obj-link hq rally" data-act="rally-travel"><span class="hq-mark">⚑</span><span class="hq-t">집결 · ${r.label}</span><span class="hq-r ${left < 0 ? 'bad' : left <= 2 ? 'amber' : ''}">${left > 0 ? `${left}일 남음` : left === 0 ? '오늘' : `${-left}일 늦음`}</span></button>`;
    return html.replace('<div class="obj-title">현재 퀘스트</div>', `<div class="obj-title">현재 퀘스트</div>${row}`).replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '');
  };

  const baseH = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'rally-with') { this.closeModal(); this.rallyAsked = true; return this.answerCrewPlan('1'); }
    if (act === 'rally-meet') {
      const c = G.crew(); const plan = c && c.plan; this.closeModal(); this.rallyAsked = false;
      if (!plan) return this.after();
      const tgt = plan.kind === 'gate' ? G.mapGates.find((x) => x.id === plan.gateId) : G.mobs.find((x) => x.id === plan.mobId);
      c.plan = null; c.done = (c.done || 0) + 1; G.crewTrust(3);
      c.rally = { kind: plan.kind, id: tgt.id, x: tgt.x, y: tgt.y, region: tgt.region, at: G.monthKey() * 30 + plan.day, mixed: !!plan.mixed, label: `${G.month}월 ${plan.day}일 ${regionById(tgt.region).name}` };
      G.rallyCheck();
      this.renderGame();
      return this.after(`집결: ${c.rally.label}. 현재 퀘스트 목록에서 누르면 자동으로 이동한다.`);
    }
    if (act === 'rally-travel') { const r = G.rally(); if (r && this.travelStart) return this.travelStart(r.x, r.y, `집결지 (${regionById(r.region).name})`); return; }
    return baseH.call(this, act, v);
  };
}
