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
    const say = { cold: '이걸로 간다.', just: '이렇게 하자. 이유는 나중에 설명하지.', kind: '이렇게 해 보는 게 어때요?', warlike: '고민할 거 없어. 이거다.', greedy: '남는 쪽으로 가자.' }[L.personality] || '이렇게 하자.';
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
