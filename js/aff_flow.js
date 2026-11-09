// ===== 시험 뒤 소속 흐름 (영역 D, 사용자 요청) =====
// "튜토리얼 끝난 후 웬만하면 리더가 있는 곳으로 소속. 모두 거절하면 낭인, 그것조차 무소속 파티가 권유하고 그것도 거절하면 완전 솔로."
// 1) 시험 리더가 자기 소속(지역 중소 길드, 없으면 자기가 꾸린 파티)으로 먼저 권유한다. 수락이 기본·권장 경로.
//    수락하면 리더가 이끄는 파티(crew.js)의 정식 파티원이 되고, 연락처를 나눈 시험 동기들도 같은 파티로 들어온다.
// 2) 거절 → 다른 길드 제안: 프롤로그 희망이 있으면 그 사건(affiliation.js aff_*), 없으면 등급에 맞는 신규 등록 제안(minor_guilds.js).
// 3) 길드도 모두 거절 → 무소속 헌터들(시험 동기·소꿉친구·같은 기수)이 함께 다니자고 권유한다.
// 4) 그것도 거절 → 완전 솔로.
// 결과: flags.story.affPath = 'leader' | 'guild' | 'party' | 'solo'. 첫 해 수첩·관계·이후 사건이 여기에 맞춰 이어진다.

// ---------- 시험 리더의 소속 ----------
if (typeof UI !== 'undefined' && UI.makeExamLeader) {
  const base = UI.makeExamLeader;
  UI.makeExamLeader = function () {
    const id = base.call(this); const L = G.npcById(id); const p = G.player;
    if (L) {
      const near = G.minorGuildsNear ? G.minorGuildsNear(p.region, 1).filter((g) => GUILDS[g] && (GUILDS[g].minRank || 0) <= L.rankIdx) : [];
      const home = near.filter((g) => GUILDS[g].home === p.region);
      if (near.length && RNG.chance(0.7)) { L.guild = RNG.pick(home.length ? home : near); L.crewName = null; }
      else { L.guild = null; L.crewName = `${RNG.pick(CREW_NAMES)} 파티`; }
    }
    return id;
  };
}

// 리더 말투 (시험 리더 성격은 just·kind·cold)
const AFF_LEAD = {
  just: {
    ask: (L, g, crew) => g ? `${g.name}에 들어와라. 시험 때 등 맡겨 보니 같이 뛸 만하더라.` : `내 ${crew}에 자리가 하나 있다. 시험 때 보니 같이 뛸 만하더라.`,
    more: (g) => g ? `우리 쪽은 ${g.spec || '현장 위주'}다. 처음 1년은 내가 직접 데리고 다닌다.` : '크진 않지만 서로 등은 맡긴다. 처음 1년은 내가 직접 데리고 다닌다.',
    mates: (names) => `${names}도 오기로 했다. 시험 때 그 파티 그대로 간다.`,
    yes: '좋다. 오늘부터 내 파티다. 늦지 마라.',
    no: '…알았다. 네 길이니까. 연락처는 지우지 마라.',
  },
  kind: {
    ask: (L, g, crew) => g ? `혹시 갈 데 정했어요? 안 정했으면 우리 ${g.name} 와요. 다들 좋은 사람들이에요.` : `혹시 갈 데 정했어요? 제가 꾸리는 ${crew}에 한 자리 비었는데, 와 줄래요?`,
    more: (g) => g ? `${g.spec || '현장 일'} 위주로 해요. 처음엔 제가 옆에서 다 알려 줄게요.` : '작은 파티지만 신입은 제가 끝까지 챙겨요. 처음엔 옆에서 다 알려 줄게요.',
    mates: (names) => `${names}도 같이 하기로 했어요. 시험 파티 그대로예요.`,
    yes: '와, 진짜요? 잘 왔어요! 오늘 저녁은 제가 살게요.',
    no: '그래요… 아쉽지만 응원할게요. 힘들면 언제든 연락해요.',
  },
  cold: {
    ask: (L, g, crew) => g ? `${g.name}. 들어올 거면 들어와.` : `${crew}. 한 자리 있다. 올 거면 와.`,
    more: (g) => g ? `${g.spec || '현장'}. 내 밑에서 1년.` : '사람 많은 건 싫다. 그래서 너 하나만 묻는 거다.',
    mates: (names) => `${names}. 저것들도 온다.`,
    yes: '…좋아. 내일 아침 여섯 시.',
    no: '…그래. 후회는 하지 마.',
  },
};
const affLead = (L) => AFF_LEAD[L.personality] || AFF_LEAD.just;
const affNames = (list) => list.map((n) => n.name).join(', ');

// 첫 해 수첩: 리더 밑으로 갔으면 리더가 직접 과제를 준다
NB_VOICE.leader = { who: '파티장', give: (t) => `"다음은 이거다. ${t}. 모르면 물어봐."`, done: '"됐다. 다음 거 간다."', nag: '"요즘 손 놓고 있지? 할 건 하자."', pers: null };

Object.assign(Game.prototype, {
  affFlow() { return this.flags.story.affFlow || null; },
});
{
  const GP = Game.prototype;
  const baseVoice = GP.nbVoiceKey;
  GP.nbVoiceKey = function () {
    const fl = this.flags.story; const f = fl.affFlow;
    if (fl.affPath === 'leader' && f && f.leader != null) { const L = this.npcById(f.leader); if (L && L.alive) return 'leader'; }
    return baseVoice.call(this);
  };
  const baseMentor = GP.nbMentor;
  GP.nbMentor = function () {
    const nb = this.player.notebook; const f = this.flags.story.affFlow;
    if (nb && nb.voice === 'leader' && nb.mentor == null && f) { const L = this.npcById(f.leader); if (L && L.alive) { nb.mentor = L.id; if (this.player.origin) this.player.origin.mentor = L.id; } }
    return baseMentor.call(this);
  };
  // 2단계에서 신규 등록 제안을 이미 받았으면, 한 달 뒤 같은 내용의 데뷔 문자(debut_rising_0)는 건너뛴다
  const baseDue = GP.debutDue;
  if (baseDue) GP.debutDue = function (force) {
    const r = baseDue.call(this, force);
    if (r && r.id === 'debut_rising_0' && this.flags.story.debutOffersSeen) { const d = this.player.debut; d.queued = false; this.debutNext(); return null; }
    return r;
  };
}

if (typeof UI !== 'undefined') {
  // ---------- 시험 종료: 기존 소속 사건은 2단계로 미루고, 리더 권유를 먼저 ----------
  const baseEnd = UI.endExam;
  UI.endExam = function (ids) {
    const L0 = this.examLeader ? this.examLeader() : null;
    const lid = L0 && L0.alive ? L0.id : null;
    baseEnd.call(this, ids);
    if (!G.player) return;
    const i = G.queue.findIndex((q) => (q.type === 'story' && /^aff_/.test(q.id)) || q.type === 'firstParty');
    const old = i >= 0 ? G.queue.splice(i, 1)[0] : null;
    G.flags.story.affFlow = { leader: lid, step2: old && old.type === 'story' ? old.id : null, done: false };
    G.queue.splice(i >= 0 ? i : 0, 0, { type: 'leaderOffer' });
  };

  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return;
    if (this.dlg) return;
    const q = G.queue && G.queue[0]; const f = G.player && G.affFlow();
    if (q && q.type === 'leaderOffer') { G.queue.shift(); return this.affLeaderOffer(); }
    if (q && q.type === 'guildOffer') { G.queue.shift(); return this.affGuildOffer(); }
    if (q && q.type === 'firstParty' && f && !f.done) {
      // 2단계 사건에서 길드·관리국을 골랐으면 조직이 붙여 주는 첫 파티로, 아무 데도 안 갔으면 3단계로
      if (!G.player.guild) { G.queue.shift(); return this.affFreeOffer(); }
      f.done = true; G.flags.story.affPath = 'guild';
    }
    return baseQ.call(this);
  };

  Object.assign(UI, {
    affMates() { return G.npcs.filter((n) => n.examMate && n.alive && n.examContact); },
    // ---------- 1단계: 리더의 권유 ----------
    affLeaderOffer() {
      const f = G.affFlow(); const L = f && G.npcById(f.leader);
      if (!L || !L.alive) return this.affToGuilds();
      const g = L.guild && GUILDS[L.guild]; const T = affLead(L); const mates = this.affMates();
      const where = g ? `${g.name} 사무실` : '시험장 앞 국밥집';
      const target = g ? g.name : L.crewName;
      this.talk([
        { narr: `합격 도장을 받고 사흘 뒤, ${L.name}에게서 문자가 왔다. ${where}에서 보자고 한다.` },
        { who: L, text: T.ask(L, g, L.crewName) },
        { who: L, text: T.more(g) },
        mates.length ? { who: L, text: T.mates(affNames(mates)) } : null,
        mates.length ? { who: mates[0], text: '…나는 들어가기로 했어. 너도 오면 좋겠다.' } : null,
        { choices: [
          { text: `${target}에 들어간다 · 추천`, info: g ? { type: 'guild', id: L.guild } : { type: 'npc', id: L.id }, go: () => this.affLeaderYes() },
          { text: '"고마워요. 그래도 다른 곳도 알아보고 싶어요."', info: { type: 'npc', id: L.id }, go: () => this.affLeaderNo() },
        ] },
      ].filter(Boolean), null);
    },
    affLeaderYes() {
      const f = G.affFlow(); const L = G.npcById(f.leader); const p = G.player; const fl = G.flags.story;
      const g = L.guild && GUILDS[L.guild]; const mates = this.affMates().slice(0, 3);
      if (g) G.affJoin(L.guild, 0); else p.origin.aff = 'crew';
      const listing = G.makeCrewListing(p.region, L);
      listing.name = L.crewName || `${L.name}의 파티`; listing.style = 'mentor';
      if (mates.length) listing.members = mates.map((n) => n.id);
      for (const id of listing.members) { const n = G.npcById(id); if (n) n.guild = L.guild || null; }
      G.crewJoin(listing);
      G.changeRel(L, 10, '시험 뒤 권유를 받아들였다');
      if (G.addMemory) G.addMemory(L, '시험이 끝나고 내 파티로 들어왔다');
      for (const n of mates) G.changeRel(n, 5, '시험 파티 그대로 함께하게 됐다');
      fl.affPath = 'leader'; f.done = true;
      G.lifeEvent(`시험 리더 ${L.name}의 권유로 ${g ? `${g.name}에 들어가 ` : ''}${listing.name}의 정식 파티원이 되었다.`);
      G.nbStart(); G.save();
      const party = G.party().filter((n) => n !== L);
      this.talk([
        { who: L, text: affLead(L).yes },
        { sys: `${g ? `${g.name} 수습 단원 · ` : ''}${listing.name} 정식 파티원. 파티장 ${L.name}${party.length ? ` · 함께하는 사람: ${affNames(party)}` : ''}. 일정은 파티장이 매달 잡아 준다.` },
      ], () => { this.renderGame(); this.processQueue(); });
    },
    affLeaderNo() {
      const f = G.affFlow(); const L = G.npcById(f.leader);
      G.changeRel(L, L.personality === 'cold' ? -6 : -3, '시험 뒤 권유를 거절했다');
      if (G.addMemory) G.addMemory(L, '시험이 끝나고 권유했지만 다른 길을 골랐다');
      G.flags.story.leaderDeclined = L.id;
      this.talk([{ who: L, text: affLead(L).no }], () => this.affToGuilds());
    },
    // ---------- 2단계: 다른 길드 ----------
    affToGuilds() {
      const f = G.affFlow();
      if (f && f.step2) G.queue.unshift({ type: 'story', id: f.step2 });
      else G.queue.unshift({ type: 'guildOffer' });
      this.renderGame(); return this.processQueue();
    },
    affGuildOffer() {
      const p = G.player; const f = G.affFlow(); const L = f && G.npcById(f.leader);
      const ids = G.debutGuildOffers().filter((id) => id && GUILDS[id] && id !== (L && L.guild)).slice(0, 2);
      G.flags.story.debutOffersSeen = true;
      const line = (id) => { const x = GUILDS[id]; return x.minor ? `${x.name}(${guildHome(id).name}, ${x.size}명): "${x.spec} 위주로 일합니다. 수습 3개월, 숙소 제공."` : `${x.name}(거대 길드): "인재 확보팀입니다. 면담 한번 하시죠."`; };
      this.talk([
        { narr: `측정 결과가 협회 명단에 올라간 다음 날, 휴대폰이 연달아 울린다.` },
        ...ids.map((id) => ({ narr: line(id) })),
        { narr: '관리국에서도 우편이 왔다. "신규 등록자는 등급과 관계없이 3개월 연수를 받을 수 있습니다."' },
        { choices: [
          ...ids.map((id) => ({ text: `${GUILDS[id].name}에 수습으로 들어간다`, info: { type: 'guild', id }, go: () => this.affGuildYes(id) })),
          { text: '관리국 신규 연수에 들어간다', info: { type: 'guild', id: 'kama' }, go: () => this.affGuildYes('kama') },
          { text: '어디에도 들어가지 않는다', go: () => this.affFreeOffer() },
        ] },
      ], null);
    },
    affGuildYes(id) {
      const f = G.affFlow(); G.affJoin(id, 0); f.done = true; G.flags.story.affPath = 'guild';
      G.queue.unshift({ type: 'firstParty' });
      this.renderGame(); return this.processQueue();
    },
    // ---------- 3단계: 무소속 헌터들의 권유 ----------
    affFreeOffer() {
      const p = G.player; const f = G.affFlow(); if (p.origin) p.origin.aff = 'free';
      this.fpCands = G.firstPartyCands().map((n) => n.id);
      const list = this.fpCands.map((id) => G.npcById(id)).filter(Boolean);
      const sp = list.find((n) => n.examMate && n.personality === 'kind') || list.find((n) => n.examMate) || list[0];
      const known = sp && (sp.examMate || sp.friendhood);
      this.talk([
        { narr: known ? '어디에도 들어가지 않기로 한 지 일주일. 동네 국밥집에서 낯익은 얼굴이 손을 흔든다.' : '어디에도 들어가지 않기로 한 지 일주일. 헌터넷 무소속 게시판으로 쪽지가 왔다.' },
        sp ? { who: sp, text: sp.friendhood ? '너 아무 데도 안 갔다며? 나도 그래. 그럼 우리끼리 다니자. 혼자는 위험해.' : '우리도 다 무소속이에요. 혼자 다니면 위험하잖아요. 같이 다닐래요?' } : null,
        list.length > 1 ? { narr: `함께하자는 사람들: ${list.map((n) => `${n.name}(${className(n.cls)})`).join(', ')}` } : null,
        { choices: [
          { text: '같이 다닌다', info: sp ? { type: 'npc', id: sp.id } : undefined, go: () => this.affFreeYes() },
          { text: '"고마워. 그래도 당분간은 혼자 다녀 볼게."', go: () => this.affSolo(sp) },
        ] },
      ].filter(Boolean), null);
    },
    affFreeYes() {
      const f = G.affFlow(); if (f) f.done = true; G.flags.story.affPath = 'party';
      this.fpPick = new Set(this.fpCands || []);
      return this.firstPartyDone(true);
    },
    affSolo(sp) {
      const f = G.affFlow(); if (f) f.done = true; G.flags.story.affPath = 'solo';
      if (sp) G.changeRel(sp, -2, '같이 다니자는 말을 거절했다');
      G.lifeEvent('어디에도 속하지 않고 혼자 다니기로 했다.');
      const end = () => { this.fpPick = new Set(); this.firstPartyDone(false); };
      if (!sp) return end();
      this.talk([{ who: sp, text: sp.personality === 'cold' ? '…그래. 마음 바뀌면 연락해.' : '그래요… 마음 바뀌면 꼭 연락해요. 번호 안 바꿀게요.' }], end);
    },
  });
}
