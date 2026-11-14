// ===== 첫 파티: 리더가 있는 4인 팀이 나를 5번째로 부른다 (영역 D, 4-22 사용자 확정) =====
// - 후보에서 고르는 방식(affiliation.js showFirstParty)을 바꾼다. 소속과 관계없이 "한 자리가 비었다"는 영입 제안이 온다.
// - 빈자리가 내 자리: 내 역할 칸(탱커·근접·지원·원거리/마법·특수)만 비워 두고 나머지 네 칸을 채운다. 내 역할과 겹치는 팀원은 없다.
// - 길드: 선임 리더(affil_risk.js 선임과 같은 인물) + 길드원 3. 거대 길드는 리더 +2·팀원 +1, 중소 길드는 리더 +1·팀원 동급.
// - 관리국: 연수 조장(+1) + 조원 3(동급).
// - 무소속: 프리랜서 리더 제안 2~3개. 실력 좋은 팀일수록 내 배당이 작다(9% / 15% / 균등 20%) → p.crew.share (E payroll이 읽는다).
// - 수락하면 crew.js 파티(리더 = 전투 오더 리더 orders.js pickLeader)로 들어간다. 거절하면 혼자 시작(구출 경고).

const TEAM_SLOTS = { tank: ['tank'], melee: ['melee'], support: ['support'], dps: ['ranged', 'caster'], util: ['assassin', 'esper', 'summoner'] };
const TEAM_SLOT_NAME = { tank: '탱커', melee: '근접 딜러', support: '지원', dps: '원거리·마법', util: '유격' };
const slotOfRole = (role) => Object.keys(TEAM_SLOTS).find((k) => TEAM_SLOTS[k].includes(role)) || 'dps';
const FREE_OFFERS = [
  { key: 'pro', lead: 2, mem: 1, share: 0.09, name: '실력 좋은 팀', note: '팀은 강하지만 신입 몫은 작다' },
  { key: 'mid', lead: 1, mem: 0, share: 0.15, name: '보통 팀', note: '무난한 조건' },
  { key: 'rook', lead: 0, mem: 0, share: 0.2, name: '초보끼리', note: '다 같이 신입, 배당은 균등' },
];

Object.assign(Game.prototype, {
  teamPickCls(slot, used) {
    const pool = CLASSES.filter((c) => TEAM_SLOTS[slot].includes(c.role) && c.r < 2 && c.g !== 'hidden' && !used.has(c.id));
    const c = RNG.pick(pool.length ? pool : CLASSES.filter((x) => TEAM_SLOTS[slot].includes(x.role) && x.g !== 'hidden'));
    used.add(c.id); return c.id;
  },
  teamMember(rank, guild, cls) {
    const p = this.player; const n = this.makeNpc(false, 'human');
    n.rankIdx = Math.max(0, Math.min(7, rank)); n.stage = RNG.int(0, 2); n.region = p.region; n.guild = guild || null;
    n.met = true; n.relation = Math.max(n.relation || 0, 15); n.cls = cls;
    n.ageMonths = (21 + n.rankIdx * 3 + RNG.int(0, 8)) * 12; n.lifespan = Math.max(n.lifespan || 0, Math.floor(n.ageMonths / 12) + 20);
    n.links ??= {}; n.disciples ??= []; n.parents ??= [];
    this.npcs.push(n); return n;
  },
  // kind: 'big' | 'minor' | 'kama' | 'free:<offer key>'  → { leader, members[], slots, name, share }
  firstTeamBuild(kind) {
    const p = this.player; const my = slotOfRole(classById(p.cls).role);
    const slots = Object.keys(TEAM_SLOTS).filter((k) => k !== my);
    const used = new Set([p.cls]);
    const off = kind.startsWith('free:') ? FREE_OFFERS.find((o) => o.key === kind.slice(5)) : null;
    const [lr, mr] = kind === 'big' ? [2, 1] : kind === 'minor' ? [1, 0] : kind === 'kama' ? [1, 0] : [off.lead, off.mem];
    const guild = kind === 'big' || kind === 'minor' || kind === 'kama' ? p.guild : null;
    const leadSlot = RNG.pick(slots);
    // 초보끼리 팀: 소속 없는 시험 동기·소꿉친구가 자기 역할 칸이 비면 그 자리로 들어온다
    const known = off && off.key === 'rook' ? this.npcs.filter((n) => n.alive && !n.isCompanion && (n.examMate || n.friendhood) && !n.guild) : [];
    const take = (slot) => { const i = known.findIndex((n) => slotOfRole(classById(n.cls).role) === slot); return i >= 0 ? known.splice(i, 1)[0] : null; };
    const pr = p.rankIdx;
    const leader = take(leadSlot) || this.teamMember(pr + lr, guild, this.teamPickCls(leadSlot, used));
    if (leader.rankIdx < pr + lr) leader.rankIdx = Math.min(7, pr + lr);
    const members = slots.filter((s) => s !== leadSlot).map((s) => take(s) || this.teamMember(pr + mr, guild, this.teamPickCls(s, used)));
    for (const n of [leader, ...members]) { n.met = true; if (guild) n.guild = guild; }
    const name = kind === 'kama' ? `관리국 연수 ${RNG.int(2, 9)}조` : guild ? `${GUILDS[guild].name} ${RNG.int(2, 12)}팀` : `${RNG.pick(CREW_NAMES)} 파티`;
    return { kind, leader: leader.id, members: members.map((n) => n.id), mySlot: my, leadSlot, name, share: off ? off.share : null, offer: off };
  },
  firstTeamJoin(t) {
    const p = this.player; const L = this.npcById(t.leader);
    const listing = { id: 'crew' + Math.random().toString(36).slice(2, 8), name: t.name, leader: t.leader, members: t.members, style: t.kind === 'big' || t.kind === 'minor' || t.kind === 'kama' ? 'mentor' : t.offer && t.offer.key === 'pro' ? 'bold' : 'steady' };
    this.crewJoin(listing);
    if (p.crew && t.share != null) p.crew.share = t.share;
    if ((t.kind === 'big' || t.kind === 'minor') && L) p.senior = { id: L.id, since: this.monthKey() };
    if (L) { this.changeRel(L, 5, '팀에 받아 주었다'); if (this.addMemory) this.addMemory(L, '한 자리가 빈 팀에 신입으로 들어왔다'); }
    this.flags.story.firstTeam = { kind: t.kind, leader: t.leader };
    this.lifeEvent(`${L ? `${L.name}이(가) 이끄는 ` : ''}${t.name}에 다섯 번째 팀원으로 들어갔다.`);
  },
});

// 첫 해 수첩: 팀 리더가 과제를 준다 ("리더를 따라 배우는 신입")
{
  const GP = Game.prototype;
  const baseVoice = GP.nbVoiceKey;
  GP.nbVoiceKey = function () { const L = this.crewLeader && this.crewLeader(); if (L && this.flags.story.firstTeam) return 'leader'; return baseVoice.call(this); };
  const baseMentor = GP.nbMentor;
  GP.nbMentor = function () {
    const nb = this.player.notebook; const L = this.crewLeader && this.crewLeader();
    if (nb && nb.voice === 'leader' && nb.mentor == null && L) { nb.mentor = L.id; if (this.player.origin) this.player.origin.mentor = L.id; }
    return baseMentor.call(this);
  };
}

if (typeof UI !== 'undefined') {
  const LEAD_ASK = {
    kind: (L, t) => `안녕하세요, ${L.name}예요. 우리 ${t.name}에 ${TEAM_SLOT_NAME[t.mySlot]} 자리가 하나 비었어요. 같이 해요. 처음엔 제가 다 알려 줄게요.`,
    just: (L, t) => `${t.name} 리더 ${L.name}이다. ${TEAM_SLOT_NAME[t.mySlot]} 한 자리가 비어 있다. 들어와라. 처음 1년은 내 옆에서 배운다.`,
    cold: (L, t) => `${TEAM_SLOT_NAME[t.mySlot]} 자리 하나. ${t.name}. 올 거면 와.`,
    warlike: (L, t) => `우리 ${t.name}, ${TEAM_SLOT_NAME[t.mySlot]}가 비어서 근질근질하다. 들어와. 대신 따라오기 벅찰 거다.`,
    greedy: (L, t) => `${t.name}의 ${L.name}. ${TEAM_SLOT_NAME[t.mySlot]} 자리 비었어. 조건은 깔끔하게 맞춰 줄게.`,
  };
  const ask = (L, t) => { const g = G.personaLine ? G.personaLine(L, 'leadGreet', {}, null) : null; if (g) return g; const v = voiceKey(L); return VOICE_EXTRA.ask[v] ? VOICE_EXTRA.ask[v](L, TEAM_SLOT_NAME[t.mySlot], t) : (LEAD_ASK[v] || LEAD_ASK.just)(L, t); };
  const welcome = (t) => { const seen = G.personaGreetScene ? G.personaGreetScene() : null; const m = G.npcById(t.members[0]); const w = m && G.personaLine ? G.personaLine(m, 'welcome', {}, seen) : null; return w ? `<p class="small"><b>${m.name}</b> "${w}"</p>` : ''; };
  const rowHtml = (ui, n, tag) => `<div class="item-row">${ui.npcAvatar(n, 36)}<div class="grow"><b>${n.name}</b> ${ui.rankTag(n.rankIdx, n.stage)} ${tag ? `<span class="tag">${tag}</span>` : ''}
    <div><span class="tag cls tiny" style="--c:${groupColor(classById(n.cls).g)}">${className(n.cls)}</span> <span class="small dim">${TEAM_SLOT_NAME[slotOfRole(classById(n.cls).role)]}${n.examMate ? ' · 시험 동기' : n.friendhood ? ' · 소꿉친구' : ''}</span></div></div></div>`;
  const teamHtml = (ui, t) => {
    const L = G.npcById(t.leader); const ms = t.members.map((id) => G.npcById(id)).filter(Boolean);
    return `${rowHtml(ui, L, '리더')}${ms.map((n) => rowHtml(ui, n)).join('')}
      <div class="item-row dim"><div class="grow"><b>빈자리</b> <span class="tag amber">${TEAM_SLOT_NAME[t.mySlot]}</span> <span class="small">← 나</span></div></div>`;
  };
  const SOLO_WARN = '혼자 다니면 쓰러졌을 때 업고 나올 사람이 없다. 구출될 확률이 크게 낮다.';

  Object.assign(UI, {
    // 길드·관리국: 조직이 붙여 주는 팀 하나
    showFirstParty() {
      const p = G.player; const k = G.payKind ? G.payKind(p.guild) : (p.guild === 'kama' ? 'kama' : p.guild ? 'minor' : null);
      if (!k) return this.firstTeamFree();
      const t = this.ftTeam || (this.ftTeam = G.firstTeamBuild(k === 'big' ? 'big' : k === 'kama' ? 'kama' : 'minor'));
      const L = G.npcById(t.leader);
      this.ftOffers = [t];
      this.modal(fixJosa(`<div class="eyebrow">${G.dateStr()} · 영입 제안</div><h3>${t.name}</h3>
        <div class="story-portrait">${this.npcPortrait(L, 96)}<div><p class="event-text">"${ask(L, t)}"</p></div></div>
        <div class="cards">${teamHtml(this, t)}</div>${welcome(t)}
        ${G.payTermsText ? `<p class="small dim">${G.payTermsText(p.guild)}</p>` : ''}
        <div class="row end"><button class="ghost" data-act="ft-solo">혼자 시작한다</button><button class="primary" data-act="ft-join" data-v="0">팀에 들어간다</button></div>`), 'event-box');
    },
    // 무소속: 프리랜서 리더 제안 2~3개
    firstTeamFree() {
      const p = G.player; if (p.origin) p.origin.aff = 'free';
      if (!this.ftOffers || !this.ftFree) {
        const keys = RNG.chance(0.5) ? ['pro', 'mid', 'rook'] : RNG.chance(0.5) ? ['pro', 'rook'] : ['mid', 'rook'];
        this.ftOffers = keys.map((k) => G.firstTeamBuild('free:' + k)); this.ftFree = true;
      }
      const cards = this.ftOffers.map((t, i) => { const L = G.npcById(t.leader); return `<div class="panel sec"><div class="row between"><b>${t.name}</b><span class="tag">${t.offer.name} · 내 배당 ${Math.round(t.share * 100)}%</span></div>
        <p class="event-text small">"${ask(L, t)}"</p><div class="cards">${teamHtml(this, t)}</div><p class="small dim">${t.offer.note}</p>
        <div class="row end"><button class="primary" data-act="ft-join" data-v="${i}" data-info="npc:${L.id}">이 팀에 들어간다</button></div></div>`; }).join('');
      this.modal(fixJosa(`<div class="eyebrow">${G.dateStr()} · 무소속 · 영입 제안 ${this.ftOffers.length}건</div><h3>"${TEAM_SLOT_NAME[this.ftOffers[0].mySlot]} 한 자리 비었습니다"</h3>
        <p class="small dim">무소속 파티는 월급이 없다. 전리품은 리더가 정한 배당대로 나눈다. 강한 팀일수록 신입 몫은 작다.</p>${cards}
        <div class="row end"><button class="ghost" data-act="ft-solo">모두 거절하고 혼자 시작한다</button></div>`), 'event-box');
    },
    firstTeamDone(joinIdx) {
      const t = joinIdx != null ? this.ftOffers && this.ftOffers[joinIdx] : null;
      const f = G.affFlow && G.affFlow(); if (f) f.done = true;
      if (t) { G.firstTeamJoin(t); if (t.kind.startsWith('free')) G.flags.story.affPath = 'party'; }
      else { G.flags.story.affPath = G.player.guild ? G.flags.story.affPath : 'solo'; G.lifeEvent('영입 제안을 모두 거절하고 혼자 시작했다.'); }
      this.ftOffers = null; this.ftTeam = null; this.ftFree = false; this.fpCands = null; this.fpPick = null;
      G.player.onboard = null; G.nbStart(); G.save(); this.closeModal(); this.renderGame();
      const L = t && G.npcById(t.leader);
      this.toast(t ? `${t.name}의 다섯 번째 팀원이 되었다. 리더는 ${L ? L.name : '리더'}.` : '당분간은 혼자다.');
      return this.processQueue();
    },
    // aff_flow.js 3단계(무소속 파티 권유)도 영입 제안으로
    affFreeOffer() {
      const L = G.affFlow && G.affFlow() && G.npcById(G.affFlow().leader);
      if (L && L.alive && !L.guild && UI.affLeaderScene) return this.affLeaderScene(L, 'party', []);
      return this.firstTeamFree();
    },
  });
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'ft-join') return this.firstTeamDone(+v);
    if (act === 'ft-solo') {
      // 경고는 위쪽 알림 띠가 아니라 화면 가운데 확인 창으로 (사용자 요청)
      if (this.confirmOver) return this.confirmOver('혼자 시작할까요?', SOLO_WARN, '혼자 시작한다', () => this.firstTeamDone(null), 'danger');
      if (!this.ftWarned) { this.ftWarned = true; return this.toast(`${SOLO_WARN} 그래도 혼자 시작하려면 한 번 더 누른다.`); }
      this.ftWarned = false; return this.firstTeamDone(null);
    }
    return baseHandle.call(this, act, v);
  };
}
