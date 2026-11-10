// ===== 게이트 크로니클: 소속 파티 =====
// 다른 헌터가 이끄는 파티에 정식 파티원으로 들어간다.
// 리더가 매달 일정을 잡아 제안하고(게이트 공략, 토벌, 호위, 합동 훈련, 정비), 플레이어는 참가하거나 빠진다.
// 빠지는 일이 잦으면 신뢰가 떨어져 파티에서 밀려난다. 리더보다 강해지면 리더 자리를 물려받을 수도 있다.

const CREW_NAMES = ['새벽', '검은 늑대', '청람', '불꽃놀이', '은방울', '북극성', '철새', '모래시계', '반딧불', '해오름', '돌고래', '무지개 다리', '첫눈', '등대', '까마귀', '한낮'];
const CREW_STYLES = {
  steady: { name: '안전 제일', desc: '무리하지 않는다. 등급에 맞는 게이트만 고른다.', tier: -1, gate: 0.45, hunt: 0.2, escort: 0.1, train: 0.25 },
  greedy: { name: '수익 우선', desc: '돈 되는 일이면 어디든 간다.', tier: 0, gate: 0.4, hunt: 0.15, escort: 0.35, train: 0.1 },
  bold: { name: '공격적', desc: '한 단계 높은 게이트에 도전한다.', tier: 1, gate: 0.6, hunt: 0.25, escort: 0.05, train: 0.1 },
  mentor: { name: '육성형', desc: '신입을 키우는 데 공을 들인다. 훈련이 잦다.', tier: -1, gate: 0.35, hunt: 0.15, escort: 0.05, train: 0.45 },
};
const CREW_SHARE = 0.75; // 리더 몫과 공용 경비를 떼고 받는 분배율

Object.assign(Game.prototype, {
  crew() { return this.player.crew || null; },
  crewLeader() { const c = this.crew(); const n = c && this.npcById(c.leader); return n && n.alive ? n : null; },
  isCrewMember(n) { const c = this.crew(); return !!(c && n && n.crewOf === c.id); },
  crewTier() {
    const c = this.crew(); const L = this.crewLeader(); if (!c || !L) return this.player.rankIdx;
    const base = Math.min(L.rankIdx, this.player.rankIdx + 1);
    return Math.max(0, Math.min(6, base + CREW_STYLES[c.style].tier + (RNG.chance(0.3) ? 0 : 0)));
  },

  // ---------- 모집 게시판 (헌터넷) ----------
  crewBoard(regionId) {
    const key = this.monthKey(); this.world.crewBoards ??= {};
    let b = this.world.crewBoards[regionId];
    if (!b || key - b.key >= 2) {
      const list = [];
      for (let i = 0; i < 2; i++) { const L = this.makeCrewListing(regionId); if (L) list.push(L); }
      b = this.world.crewBoards[regionId] = { key, list };
    }
    b.list = b.list.filter((L) => { const n = this.npcById(L.leader); return n && n.alive && !n.isCompanion; });
    return b.list;
  },
  makeCrewListing(regionId, leaderNpc) {
    const pr = this.player.rankIdx;
    const used = new Set(Object.values(this.world.crewBoards || {}).flatMap((b) => b.list.flatMap((L) => [L.leader, ...L.members])));
    const free = (n) => n.alive && !n.child && !n.isCompanion && !used.has(n.id) && n.region === regionId && n.relation > -20 && n.nemesis !== 'player';
    const fresh = (rank) => {
      const n = this.makeNpc(false);
      n.rankIdx = Math.max(0, Math.min(7, rank)); n.stage = RNG.int(0, 2); n.region = regionId;
      n.ageMonths = (21 + n.rankIdx * 4 + RNG.int(0, 9)) * 12; n.lifespan = Math.max(n.lifespan, Math.floor(n.ageMonths / 12) + 15);
      n.links ??= {}; n.disciples ??= []; n.parents ??= [];
      this.npcs.push(n); return n;
    };
    let leader = leaderNpc;
    if (!leader) {
      const cands = this.npcs.filter((n) => free(n) && n.rankIdx >= pr && n.rankIdx <= pr + 2);
      leader = cands.length && RNG.chance(0.7) ? RNG.pick(cands) : fresh(pr + RNG.int(0, 1));
    }
    used.add(leader.id);
    const size = RNG.int(1, 3);
    const members = [];
    for (let i = 0; i < size; i++) {
      const pool = this.npcs.filter((n) => free(n) && !used.has(n.id) && Math.abs(n.rankIdx - leader.rankIdx) <= 1 && n.rankIdx <= leader.rankIdx);
      const m = pool.length && RNG.chance(0.5) ? RNG.pick(pool) : fresh(leader.rankIdx - RNG.int(0, 1));
      used.add(m.id); members.push(m.id);
    }
    const have = new Set([leader, ...members.map((id) => this.npcById(id))].map((n) => classById(n.cls).g));
    const roles = ['guard', 'support', 'fighter', 'shooter', 'mage', 'shadow', 'esper', 'summon', 'east'];
    const want = roles.find((g) => !have.has(g)) || RNG.pick(roles);
    const style = leader.personality === 'greedy' ? 'greedy' : leader.personality === 'warlike' ? 'bold' : leader.personality === 'kind' ? RNG.pick(['mentor', 'steady']) : RNG.pick(Object.keys(CREW_STYLES));
    return {
      id: 'crew' + Math.random().toString(36).slice(2, 8), name: `${RNG.pick(CREW_NAMES)} 파티`, leader: leader.id, members, want, style,
      minRank: Math.max(0, leader.rankIdx - 1), region: regionId,
    };
  },
  crewApply(L) {
    const p = this.player; const leader = this.npcById(L.leader);
    if (!leader || !leader.alive) return '모집이 이미 끝났다.';
    if (p.crew) return '이미 소속된 파티가 있다.';
    if (p.rankIdx < L.minRank) return `${leader.name}: "${RANKS[L.minRank].key}급부터 받아요. 조금 더 크고 와요."`;
    const fit = classById(p.cls).g === L.want;
    const chance = (fit ? 0.9 : 0.55) + leader.relation / 200 + Math.min(p.fame, 100) / 400;
    if (L.tried === this.monthKey()) return `${leader.name}은(는) 이번 달엔 더 이상 지원을 받지 않는다.`;
    if (!RNG.chance(chance)) { L.tried = this.monthKey(); return `${leader.name}: "미안해요. 이번엔 ${CLASS_GROUPS[L.want].name} 계열을 찾고 있어서요." (불합격)`; }
    return this.crewJoin(L);
  },
  crewJoin(L) {
    const p = this.player; const leader = this.npcById(L.leader);
    const left = this.party().filter((n) => !n.crewOf);
    for (const n of left) this.dismiss(n.id);
    p.crew = { id: L.id, name: L.name, leader: L.leader, style: L.style, since: this.monthKey(), trust: 50, done: 0, missed: 0, plan: null, nextPlan: this.monthKey() };
    p.party = [];
    for (const id of [L.leader, ...L.members]) {
      const n = this.npcById(id); if (!n || !n.alive) continue;
      n.isCompanion = true; n.crewOf = L.id; n.met = true; n.merc = null; n.relation = Math.max(n.relation, 20); n.region = p.region;
      p.party.push(n.id);
    }
    for (const b of Object.values(this.world.crewBoards || {})) b.list = b.list.filter((x) => x.id !== L.id);
    this.lifeEvent(`${leader.name}이(가) 이끄는 ${L.name}에 정식 파티원으로 들어갔다.`);
    return `${leader.name}: "환영해요. 오늘부터 ${L.name} 정식 파티원이에요. 일정은 내가 잡아서 연락할게요."${left.length ? ` (기존 동료 ${left.map((n) => n.name).join(', ')}와(과)는 헤어졌다)` : ''}`;
  },
  crewLeave(why) {
    const p = this.player; const c = p.crew; if (!c) return '';
    for (const n of this.npcs) if (n.crewOf === c.id) {
      n.crewOf = null; n.isCompanion = false;
      if (why === 'quit') this.changeRel(n, -8);
    }
    p.party = (p.party || []).filter((id) => { const n = this.npcById(id); return n && n.isCompanion; });
    p.crew = null;
    const text = why === 'kicked' ? `${c.name}에서 밀려났다.` : why === 'disband' ? `${c.name}이(가) 해체되었다.` : `${c.name}을(를) 떠났다.`;
    this.lifeEvent(text);
    return text;
  },
  crewTrust(d) { const c = this.crew(); if (c) c.trust = Math.max(0, Math.min(100, c.trust + d)); },

  // ---------- 리더의 일정 ----------
  crewMakePlan() {
    const c = this.crew(); const L = this.crewLeader(); const p = this.player;
    const st = CREW_STYLES[c.style];
    // 리더보다 확실히 강해지면 리더 자리를 넘겨준다
    if (p.rankIdx >= L.rankIdx + 2 && !c.offeredLead) { c.offeredLead = true; return { kind: 'handover' }; }
    const t = this.crewTier();
    const reach = (rid) => rid !== 'jeju' || p.rankIdx >= 6;
    const kind = RNG.weighted(['gate', 'hunt', 'escort', 'train'], [st.gate, st.hunt, st.escort, st.train]);
    const day = RNG.int(Math.min(28, this.day + 2), 29);
    if (kind === 'gate') {
      let gates = this.mapGates.filter((g) => !g.final && !g.mission && !g.cleared && reach(g.region) && g.tier >= t - 1 && g.tier <= t);
      gates.sort((a, b) => regionDist(p.region, a.region) - regionDist(p.region, b.region));
      let gate = gates[0];
      if (!gate || regionDist(p.region, gate.region) > 3) {
        const pos = this.randomFreeTile(p.region);
        if (pos) { gate = { id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: p.region, tier: t, theme: RNG.pick(GATE_THEMES), elem: pickElem(), born: this.monthKey(), crew: true }; this.mapGates.push(gate); }
      }
      if (gate) return { kind: 'gate', gateId: gate.id, day };
    }
    if (kind === 'hunt') {
      const mobs = this.mobs.filter((m) => reach(m.region) && m.tier >= t - 1 && m.tier <= t + 1).sort((a, b) => regionDist(p.region, a.region) - regionDist(p.region, b.region));
      if (mobs[0] && regionDist(p.region, mobs[0].region) <= 3) return { kind: 'hunt', mobId: mobs[0].id, day };
    }
    if (kind === 'escort' || kind === 'hunt') return { kind: 'escort', tier: t, pay: Math.round(260 * RANKS[t].mult ** 1.3), day };
    return { kind: 'train', day };
  },
  crewPlanText(plan) {
    const L = this.crewLeader(); const c = this.crew();
    const when = `${this.month}월 ${plan.day}일`;
    switch (plan.kind) {
      case 'gate': {
        const g = this.mapGates.find((x) => x.id === plan.gateId); if (!g) return null;
        const far = g.region === this.player.region ? '' : ` 이동은 파티 차량으로. ${regionById(g.region).name}까지 같이 가요.`;
        return { title: '게이트 공략 일정', text: `"${when}, ${regionById(g.region).name}의 ${this.gateName(g)}에 들어갑니다.${far} 보상은 리더 몫과 공용 경비를 빼고 나눠요."`, accept: '참가한다', tag: this.gateName(g) };
      }
      case 'hunt': {
        const m = this.mobs.find((x) => x.id === plan.mobId); if (!m) return null;
        return { title: '토벌 일정', text: `"${when}, ${regionById(m.region).name}에 나타난 ${m.name} 무리를 정리하러 갑니다. 협회 토벌 수당이 붙어 있어요."`, accept: '참가한다', tag: `${m.name} ×${m.count}` };
      }
      case 'escort': return { title: '호위 의뢰', text: `"${when}, 에테르 결정 운송 차량 호위 의뢰를 받았어요. 보수는 총 ${fmt(this.crewPayTotal ? this.crewPayTotal(plan.pay) : plan.pay)} 크레딧, 리더 몫을 떼고 배당대로 나눠요.${this.crewPay ? ` 당신 몫은 ${fmt(this.crewPay(plan.pay))} 크레딧쯤.` : ''} 요즘 길목에 약탈 헌터가 나온다니까 각오는 해 두고요."`, accept: '참가한다', tag: '호위' };
      case 'train': return { title: '합동 훈련', text: `"${when}부터 한 달은 합동 훈련이에요. 연계 동작부터 다시 맞춰 봅시다. ${c.style === 'mentor' ? '신입은 내가 직접 봐 줄게요.' : '빠지면 손발이 안 맞아요.'}"`, accept: '훈련에 나간다', tag: '훈련' };
      case 'handover': return { title: '리더 교대', text: `${L.name}이(가) 조용히 말한다. "솔직히 말할게요. 이제 이 파티에서 제일 강한 건 당신이에요. 리더를 맡아 줄래요? 아니면… 더 큰 데로 가도 붙잡진 않을게요."`, accept: '리더를 맡는다', decline: '지금처럼 지낸다', tag: '리더 교대' };
      default: return null;
    }
  },
  crewMonthly() {
    const c = this.crew(); if (!c) return this.crewInviteRoll();
    if (!this.crewLeader()) return this.crewSuccession();
    for (const n of this.party()) if (n.crewOf === c.id && RNG.chance(0.5)) this.changeRel(n, 1);
    if (this.monthKey() < c.nextPlan || c.plan) return;
    c.plan = this.crewMakePlan();
    c.nextPlan = this.monthKey() + 1;
    if (c.plan && this.crewPlanText(c.plan)) this.queue.push({ type: 'crewPlan' });
    else c.plan = null;
  },
  crewSuccession() {
    const c = this.crew();
    const heirs = this.party().filter((n) => n.crewOf === c.id).sort((a, b) => b.rankIdx - a.rankIdx);
    if (!heirs.length) { this.queue.push({ type: 'toast', text: this.crewLeave('disband') }); return; }
    c.leader = heirs[0].id;
    const t = `리더를 잃은 ${c.name}을(를) ${heirs[0].name}이(가) 이어받았다.`;
    this.log(t, 'bad'); this.queue.push({ type: 'toast', text: t });
  },
  crewInviteRoll() {
    const p = this.player;
    if (p.crewInvite && this.monthKey() - p.crewInvite.at < 2) return;
    p.crewInvite = null;
    if (!RNG.chance(0.06 + Math.min(p.fame, 120) / 1500)) return;
    const known = this.npcsHere().filter((n) => n.met && n.relation >= 25 && !n.isCompanion && n.rankIdx >= p.rankIdx);
    const L = this.makeCrewListing(p.region, known.length ? RNG.pick(known) : null);
    if (!L) return;
    p.crewInvite = { ...L, at: this.monthKey() };
    this.queue.push({ type: 'crewInvite' });
  },
});

// 기존 기능과의 연결
{
  const GP = Game.prototype;
  const baseMonth = GP.advanceMonth;
  GP.advanceMonth = function (n = 1, opts = {}) {
    const before = this.monthKey();
    baseMonth.call(this, n, opts);
    if (!this.over && this.player && this.monthKey() !== before) this.crewMonthly();
  };
  const baseRecruit = GP.canRecruit;
  GP.canRecruit = function (n) { return !this.crew() && baseRecruit.call(this, n); };
  const baseDismiss = GP.dismiss;
  GP.dismiss = function (id) {
    const n = id != null ? this.npcById(id) : this.companion();
    if (n && this.isCrewMember(n)) return `${n.name}은(는) ${this.crew().name}의 파티원이다. 파티 구성은 리더가 정한다.`;
    return baseDismiss.call(this, id);
  };
  const baseHire = GP.hireMerc;
  GP.hireMerc = function (r, i) { if (this.crew()) return '소속 파티가 있는 동안에는 용병을 따로 고용할 수 없다.'; return baseHire.call(this, r, i); };
  const baseKill = GP.killNpc;
  GP.killNpc = function (n, cause, killer) {
    baseKill.call(this, n, cause, killer);
    if (n.crewOf) n.crewOf = null;
  };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function () {
    baseInit.call(this);
    this.world.crewBoards ??= {};
    const c = this.player.crew;
    if (c) for (const id of this.player.party) { const n = this.npcById(id); if (n && n.crewOf === c.id) n.isCompanion = true; }
  };
}

// ---------- 화면 ----------
Object.assign(UI, {
  crewHtml() {
    const p = G.player; const c = G.crew();
    if (c) {
      const L = G.crewLeader(); const st = CREW_STYLES[c.style];
      const planT = c.plan && G.crewPlanText(c.plan);
      return `<div class="panel"><h3>소속 파티 · ${c.name}</h3>
        <p class="small">리더 <b>${L ? L.name : '공석'}</b> ${L ? this.rankTag(L.rankIdx, L.stage) : ''} · 방침 <b>${st.name}</b> <span class="dim">${st.desc}</span></p>
        <div class="row small"><span class="dim">신뢰</span><div class="grow">${this.bar('ether', c.trust, 100)}</div><b class="num">${c.trust}</b></div>
        <p class="small dim">함께한 일정 ${c.done}회 · 빠진 일정 ${c.missed}회 · ${G.monthKey() - c.since}개월째. 리더가 매달 일정을 잡아 연락한다. 자주 빠지면 신뢰가 떨어져 파티에서 밀려난다. 게이트 보상은 ${Math.round(CREW_SHARE * 100)}%를 받는다.</p>
        ${planT ? `<p class="small">지금 잡힌 일정: <b>${planT.tag}</b> <button class="sm primary" data-act="crew-plan-open">일정 보기</button></p>` : '<p class="small dim">다음 일정은 다음 달 초에 연락이 온다.</p>'}
        <div class="row end"><button class="sm ghost" data-act="crew-leave">파티 탈퇴</button></div></div>`;
    }
    const reg = G.region();
    const list = G.crewBoard(reg.id);
    const row = (L, i) => {
      const n = G.npcById(L.leader); const st = CREW_STYLES[L.style];
      const mem = L.members.map((id) => G.npcById(id)).filter(Boolean);
      return `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${L.name}</b> <span class="small dim">리더 ${n.name}</span> ${this.rankTag(n.rankIdx, n.stage)}
        <div class="small dim">${st.name} · 파티원 ${mem.map((m) => `${m.name}(${className(m.cls)})`).join(', ')} · ${RANKS[L.minRank].key}급 이상 · <span class="${classById(p.cls).g === L.want ? 'good' : ''}">${CLASS_GROUPS[L.want].name} 계열 우대</span></div></div>
        <button class="sm primary" data-act="crew-apply" data-v="${i}">지원</button></div>`;
    };
    return `<div class="panel"><h3>파티 모집 · ${reg.name}</h3>
      <p class="dim small">헌터넷 모집 게시판. 다른 헌터가 이끄는 파티에 정식 파티원으로 들어가면 리더가 일정을 잡고, 함께 게이트에 들어간다. 지금 동료와는 헤어지게 된다.</p>
      <div class="cards">${list.map(row).join('') || '<div class="dim small">이 지역에는 지금 모집 중인 파티가 없다.</div>'}</div></div>`;
  },
  showCrewPlan() {
    const c = G.crew(); const L = G.crewLeader();
    const t = c && c.plan && L && G.crewPlanText(c.plan);
    if (!t) { if (c) c.plan = null; return this.processQueue(); }
    const rest = c.plan.kind === 'handover';
    this.modal(`<div class="story-portrait">${UI.npcPortrait(L, 130)}<div><div class="eyebrow">${c.name} · ${G.fullDate()}</div><b>${L.name}</b> <span class="small dim">리더</span><div class="small">${this.rankTag(L.rankIdx, L.stage)}</div><div class="small dim">신뢰 ${c.trust}</div></div></div>
      <h3>${t.title}</h3><p class="event-text">${fixJosa(t.text)}</p>
      <div class="cards"><button class="choice-btn" data-act="crew-plan" data-v="1">${t.accept}</button>
      <button class="choice-btn" data-act="crew-plan" data-v="0">${t.decline || '이번엔 빠진다 (신뢰 하락)'}</button>
      ${rest ? '' : '<button class="choice-btn" data-act="crew-plan" data-v="later">나중에 답한다</button>'}</div>`, 'event-box');
  },
  showCrewInvite() {
    const p = G.player; const L = p.crewInvite; const n = L && G.npcById(L.leader);
    if (!n || !n.alive || p.crew) return this.processQueue();
    const mem = L.members.map((id) => G.npcById(id)).filter(Boolean);
    this.modal(`<div class="story-portrait">${UI.npcPortrait(n, 130)}<div><div class="eyebrow">메시지 · ${G.fullDate()}</div><b>${n.name}</b><div class="small">${this.rankTag(n.rankIdx, n.stage)} · ${L.name} 리더</div></div></div>
      <p class="event-text">"${p.name} 씨 맞죠? ${(p.record && p.record.gates) >= 3 ? '요즘 활약 들었어요.' : '협회 신규 명단에서 이름 봤어요.'} 우리 ${L.name}에 정식 파티원으로 들어올래요? 지금 ${mem.map((m) => m.name).join(', ')}이(가) 같이 뛰고 있어요. 일정은 내가 잡고, 보상은 공정하게 나눠요."</p>
      <div class="cards"><button class="choice-btn" data-act="crew-invite" data-v="1">들어간다${G.party().length ? ' (지금 동료와는 헤어진다)' : ''}</button><button class="choice-btn" data-act="crew-invite" data-v="0">정중히 거절한다</button></div>`, 'event-box');
  },
  answerCrewPlan(v) {
    const c = G.crew(); if (!c || !c.plan) { this.closeModal(); return this.after(); }
    const plan = c.plan; const L = G.crewLeader();
    if (v === 'later') { this.closeModal(); return this.after('일정은 파티 화면에서 다시 볼 수 있다.'); }
    c.plan = null;
    if (plan.kind === 'handover') {
      this.closeModal();
      if (v !== '1') { G.changeRel(L, 5); return this.after(`${L.name}: "알았어요. 그래도 고마워요."`); }
      const name = c.name;
      for (const n of G.party()) if (n.crewOf === c.id) n.crewOf = null;
      G.player.crew = null;
      G.lifeEvent(`${name}의 리더가 되었다.`);
      return this.after(`이제 ${name}의 리더다. 파티원 구성과 일정은 당신이 정한다.`);
    }
    if (v !== '1') {
      c.missed++; G.crewTrust(-12); G.changeRel(L, -4);
      this.closeModal();
      if (c.trust <= 0) return this.after(`${L.name}: "미안하지만 같이 가기는 어렵겠어요." ` + G.crewLeave('kicked'));
      return this.after(`${L.name}: "알겠어요. 이번엔 우리끼리 갈게요." (신뢰 -12)`);
    }
    c.done++; G.crewTrust(6);
    this.closeModal();
    const p = G.player;
    const travel = (region, x, y) => {
      const d = regionDist(p.region, region);
      p.x = x; p.y = y; p.region = region; G.reveal(x, y, 4); G.syncParty();
      G.advanceDays(Math.max(1, plan.day - G.day) + d * 2, { noSave: true });
    };
    if (plan.kind === 'gate') {
      const g = G.mapGates.find((x) => x.id === plan.gateId);
      if (!g) return this.after('도착해 보니 이미 다른 파티가 게이트를 닫은 뒤였다.');
      travel(g.region, g.x, g.y);
      if (G.over) return this.after();
      this.renderGame(); if (this.map) this.map.centerOn(p.x, p.y);
      this.startGate(g.id);
      if (this.ctx && this.ctx.kind === 'gate') this.ctx.crewRaid = true;
      return;
    }
    if (plan.kind === 'hunt') {
      const m = G.mobs.find((x) => x.id === plan.mobId);
      if (!m) return this.after('목표 무리는 이미 흩어진 뒤였다.');
      travel(m.region, m.x, m.y);
      if (G.over) return this.after();
      this.renderGame(); if (this.map) this.map.centerOn(p.x, p.y);
      this.startMob(m.id); if (this.ctx && this.ctx.kind === 'mob') this.ctx.crewRaid = true; // 팀 토벌: 보상 분배(payroll.js)
      return;
    }
    if (plan.kind === 'escort') {
      const pay = G.crewPay ? G.crewPay(plan.pay) : plan.pay; // 의뢰 보수도 리더 몫·배당대로 나눈다(payroll.js)
      G.advanceDays(Math.max(1, plan.day - G.day), { noSave: true });
      G.storyFight({ title: `${c.name} · 운송 차량 호위`, mobs: { tier: plan.tier, n: 2, human: true }, spar: false,
        win: { text: `약탈 헌터들을 쫓아냈다. 화물은 무사히 도착했다. (의뢰 보수 분배: 내 몫 ${fmt(pay)} 크레딧)`, gain: { money: pay, fame: 1 }, after: (g) => { g.crewTrust(4); for (const n of g.party()) g.changeRel(n, 2); } },
        lose: { text: '화물 일부를 빼앗겼다. 리더가 보수를 깎았다.', gain: { money: Math.round(pay * 0.2), injure: 1 }, after: (g) => g.crewTrust(-3) } });
      return this.after();
    }
    // 합동 훈련
    const gain = G.trainGain(1.6);
    G.addEther(gain);
    for (const n of G.party()) G.changeRel(n, 3);
    G.log(`${c.name}와(과) 한 달 동안 합동 훈련을 했다. 에테르 +${fmt(gain)}`, 'good');
    G.advanceMonth(1, { eventChance: 0.1 });
    return this.after(`합동 훈련을 마쳤다. 에테르 +${fmt(gain)}, 파티원과의 관계가 깊어졌다.`);
  },
});

{
  const basePartyHtml = UI.partyHtml;
  UI.partyHtml = function () {
    let html = basePartyHtml.call(this);
    for (const n of G.party()) {
      if (!G.isCrewMember(n)) continue;
      const tag = n.id === G.crew().leader ? '<span class="tag">리더</span>' : '<span class="tag">파티원</span>';
      html = html.replace(`<button class="sm ghost" data-act="party-out" data-v="${n.id}">내보내기</button>`, tag);
    }
    return this.crewHtml() + html;
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'crewPlan') { G.queue.shift(); return this.showCrewPlan(); }
    if (q && q.type === 'crewInvite') { G.queue.shift(); return this.showCrewInvite(); }
    return baseQueue.call(this);
  };
  const baseFinishGate = UI.finishGate;
  UI.finishGate = function (result) {
    const c = this.ctx;
    if (c && c.crewRaid && result !== 'lose') c.loot.money = Math.round(c.loot.money * (G.crewShareRate ? G.crewShareRate() : CREW_SHARE)); // 4-22: 무소속 팀 배당(payroll.js)
    baseFinishGate.call(this, result);
    if (c && c.crewRaid && G.crew()) {
      if (result === 'clear') { G.crewTrust(4); for (const n of G.party()) G.changeRel(n, 2); }
      if (result === 'retreat') G.crewTrust(-2);
      this.toast(result === 'lose' ? '파티원들이 당신을 업고 나왔다.' : `파티 분배: 리더 몫과 공용 경비를 빼고 ${Math.round((G.crewShareRate ? G.crewShareRate() : CREW_SHARE) * 100)}%를 받았다.`);
      G.save();
    }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'crew-apply': { const L = G.crewBoard(G.region().id)[+v]; if (!L) return; return this.after(G.crewApply(L)); }
      case 'crew-leave': return this.after(G.crewLeave('quit'));
      case 'crew-plan': return this.answerCrewPlan(v);
      case 'crew-plan-open': this.closeModal(); return this.showCrewPlan();
      case 'crew-invite': {
        const p = G.player; const L = p.crewInvite; p.crewInvite = null; this.closeModal();
        if (!L) return this.after();
        if (v === '1') return this.after(G.crewJoin(L));
        const n = G.npcById(L.leader); if (n) G.changeRel(n, -2);
        return this.after('정중히 거절했다.');
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
