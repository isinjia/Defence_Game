// ===== 시험 뒤 소속 흐름 (영역 D, 사용자 확정 순서) =====
// "내 등급에 따라 길드가 권유, 거절하면 보호국이 권유, 그것도 거절하면 확률로 무소속이 권유.
//  보호국도 확률이지만 보호국이 안 뜨면 무소속은 무조건 뜸. 길드 권유는 F급은 안 뜨고 등급에 따라 확률."
// 1) 길드 권유  : 판정 등급별 확률(AFF_ODDS.guild). F급은 0. 낮은 등급은 지역 중소 길드, C급 이상·특출하면 거대 길드도.
// 2) 보호국 권유: 길드를 거절했거나 길드 권유가 없었을 때, 등급별 확률(AFF_ODDS.kama). 보호국 = 관리국 산하 헌터 보호국.
// 3) 무소속 파티: 항상 온다(보호국을 거절했어도). 거절하면 혼자 시작.
// 4) 모두 거절 → 완전 솔로.
// 시험 리더가 그 단계의 소속(길드·보호국·무소속 파티장)이면 리더가 직접 권유하고, 수락하면 리더 파티에 시험 동기와 함께 들어간다.
// 결과: flags.story.affPath = 'leader' | 'guild' | 'kama' | 'party' | 'solo'. 확률표는 docs/첫_30분_점검.md "시험 뒤 소속 흐름".

//              F     E     D     C     B     A     S    SS
const AFF_ODDS = {
  guild:         [0,    0.35, 0.6,  0.8,  0.95, 1,    1,   1],   // 길드 권유
  kama:          [0.45, 0.55, 0.65, 0.75, 0.85, 0.9,  0.95, 1],  // 보호국 권유
};
const AFF_LEADER = { guild: 0.5, kama: 0.25 }; // 시험 리더 소속: 지역 중소 길드 50% · 보호국 25% · 나머지는 무소속 파티장

// ---------- 시험 리더의 소속 ----------
if (typeof UI !== 'undefined' && UI.makeExamLeader) {
  const base = UI.makeExamLeader;
  UI.makeExamLeader = function () {
    const id = base.call(this); const L = G.npcById(id); const p = G.player;
    if (L) {
      const near = G.minorGuildsNear ? G.minorGuildsNear(p.region, 1).filter((g) => GUILDS[g] && (GUILDS[g].minRank || 0) <= L.rankIdx) : [];
      const home = near.filter((g) => GUILDS[g].home === p.region);
      const r = RNG.next(); L.crewName = null;
      if (near.length && r < AFF_LEADER.guild) L.guild = RNG.pick(home.length ? home : near);
      else if (r < AFF_LEADER.guild + AFF_LEADER.kama) L.guild = 'kama';
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
  // ---------- 시험 종료: 옛 소속 사건(aff_*)·첫 파티 대신 새 흐름 ----------
  const baseEnd = UI.endExam;
  UI.endExam = function (ids) {
    const L0 = this.examLeader ? this.examLeader() : null;
    const lid = L0 && L0.alive ? L0.id : null;
    baseEnd.call(this, ids);
    if (!G.player) return;
    const i = G.queue.findIndex((q) => (q.type === 'story' && /^aff_/.test(q.id)) || q.type === 'firstParty');
    if (i >= 0) G.queue.splice(i, 1);
    // 데뷔 첫 단계의 신규 등록 문자(debut_rising_0)는 길드 권유 단계와 같은 내용이라 건너뛴다
    const di = G.queue.findIndex((q) => q.type === 'story' && q.id === 'debut_rising_0');
    if (di >= 0) { G.queue.splice(di, 1); const d = G.player.debut; if (d) { d.queued = false; G.debutNext(); } }
    const r = Math.max(0, Math.min(7, G.player.rankIdx));
    G.flags.story.affFlow = { leader: lid, rank: r, done: false };
    G.queue.splice(i >= 0 ? i : 0, 0, { type: 'affStep', step: 'guild' });
  };

  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return;
    if (this.dlg) return;
    const q = G.queue && G.queue[0];
    if (q && q.type === 'affStep') { G.queue.shift(); return this.affStep(q.step); }
    return baseQ.call(this);
  };

  const odds = (k) => { const f = G.affFlow(); return AFF_ODDS[k][f ? f.rank : 0] || 0; };
  const leaderIn = (pred) => { const f = G.affFlow(); const L = f && G.npcById(f.leader); return L && L.alive && pred(L) ? L : null; };
  const isGuild = (id) => id && id !== 'kama' && GUILDS[id];

  Object.assign(UI, {
    affMates() { return G.npcs.filter((n) => n.examMate && n.alive && n.examContact); },
    affNext(step) { G.queue.unshift({ type: 'affStep', step }); this.renderGame(); return this.processQueue(); },
    // 단계 진행: 확률이 안 맞으면 다음 단계로
    affStep(step) {
      const f = G.affFlow(); if (!f || f.done) return this.processQueue();
      if (step === 'guild') { f.guildShown = RNG.chance(odds('guild')); return f.guildShown ? this.affGuildOffer() : this.affStep('kama'); }
      if (step === 'kama') { f.kamaShown = RNG.chance(odds('kama')); return f.kamaShown ? this.affKamaOffer() : this.affStep('free'); }
      if (step === 'free') { return this.affFreeOffer(); }
      return this.processQueue();
    },
    // 리더가 직접 권유하는 장면 (그 단계의 소속이 리더 소속과 같을 때)
    affLeaderScene(L, kind, alsoChoices) {
      const T = affLead(L); const mates = this.affMates();
      const g = kind === 'party' ? null : GUILDS[L.guild];
      const where = kind === 'kama' ? '관리국 보호국 청사 앞' : g ? `${g.name} 사무실` : '시험장 앞 국밥집';
      const more = kind === 'kama' ? { just: '보호국은 월급제다. 국가 소집엔 응해야 하지만, 신입은 내가 직접 데리고 다닌다.', kind: '보호국은 월급이 꼬박꼬박 나와요. 신입은 제가 옆에서 챙길게요.', cold: '보호국. 월급제. 내 밑에서 1년.' }[L.personality] || '보호국은 월급제다. 신입은 내가 데리고 다닌다.' : T.more(g);
      const target = kind === 'party' ? L.crewName : kind === 'kama' ? '관리국 보호국' : g.name;
      this.talk([
        { narr: `${kind === 'guild' ? '합격 도장을 받고 사흘 뒤' : '며칠 뒤'}, 시험 리더였던 ${L.name}에게서 문자가 왔다. ${where}에서 보자고 한다.` },
        { who: L, text: kind === 'kama' ? `보호국으로 와. ${L.personality === 'kind' ? '같이 일하면 좋겠어요.' : '자리 하나 내 줄 수 있다.'}` : T.ask(L, g, L.crewName) },
        { who: L, text: more },
        mates.length ? { who: L, text: T.mates(affNames(mates)) } : null,
        mates.length ? { who: mates[0], text: '…나는 들어가기로 했어. 너도 오면 좋겠다.' } : null,
        { choices: [
          { text: `${target}에 들어간다 · ${L.name}의 파티`, info: g ? { type: 'guild', id: L.guild } : { type: 'npc', id: L.id }, go: () => this.affLeaderYes(kind) },
          ...(alsoChoices || []),
          { text: '"고마워요. 그래도 다른 길을 알아볼게요."', info: { type: 'npc', id: L.id }, go: () => this.affLeaderNo(kind) },
        ] },
      ].filter(Boolean), null);
    },
    affLeaderYes(kind) {
      const f = G.affFlow(); const L = G.npcById(f.leader); const p = G.player;
      const mates = this.affMates().slice(0, 3);
      if (kind === 'party') p.origin.aff = 'crew'; else G.affJoin(L.guild, 0);
      const listing = G.makeCrewListing(p.region, L);
      listing.name = L.crewName || `${L.name}의 파티`; listing.style = 'mentor';
      if (mates.length) listing.members = mates.map((n) => n.id);
      for (const id of listing.members) { const n = G.npcById(id); if (n) n.guild = L.guild || null; }
      G.crewJoin(listing);
      G.changeRel(L, 10, '시험 뒤 권유를 받아들였다');
      if (G.addMemory) G.addMemory(L, '시험이 끝나고 내 파티로 들어왔다');
      for (const n of mates) G.changeRel(n, 5, '시험 파티 그대로 함께하게 됐다');
      const g = kind === 'party' ? null : GUILDS[L.guild];
      G.flags.story.affPath = 'leader'; f.done = true; p.onboard = null;
      G.lifeEvent(`시험 리더 ${L.name}의 권유로 ${g ? `${g.name}에 들어가 ` : ''}${listing.name}의 정식 파티원이 되었다.`);
      G.nbStart(); G.save();
      const party = G.party().filter((n) => n !== L);
      this.talk([
        { who: L, text: affLead(L).yes },
        { sys: `${g ? `${g.name} 수습 · ` : '무소속 · '}${listing.name} 정식 파티원. 파티장 ${L.name}${party.length ? ` · 함께하는 사람: ${affNames(party)}` : ''}. 일정은 파티장이 매달 잡아 준다.` },
      ], () => { this.renderGame(); this.processQueue(); });
    },
    affLeaderNo(kind) {
      const f = G.affFlow(); const L = G.npcById(f.leader);
      G.changeRel(L, L.personality === 'cold' ? -6 : -3, '시험 뒤 권유를 거절했다');
      if (G.addMemory) G.addMemory(L, '시험이 끝나고 권유했지만 다른 길을 골랐다');
      G.flags.story.leaderDeclined = L.id;
      this.talk([{ who: L, text: affLead(L).no }], () => this.affNext(kind === 'guild' ? 'kama' : kind === 'kama' ? 'free' : 'solo'));
    },
    // ---------- 1) 길드 권유 ----------
    affGuildOffer() {
      const f = G.affFlow(); const p = G.player; const o = p.origin || {};
      let ids = G.debutGuildOffers().filter((id) => isGuild(id));
      if (o.hope === 'guild' && o.hopeGuild && GUILDS[o.hopeGuild] && f.rank >= 3 && !ids.includes(o.hopeGuild)) ids = [o.hopeGuild, ...ids];
      const L = leaderIn((x) => isGuild(x.guild));
      if (L) ids = ids.filter((id) => id !== L.guild);
      ids = ids.slice(0, L ? 1 : 2);
      G.flags.story.debutOffersSeen = true;
      const choices = ids.map((id) => ({ text: `${GUILDS[id].name}에 수습으로 들어간다`, info: { type: 'guild', id }, go: () => this.affJoinOrg(id) }));
      if (L) return this.affLeaderScene(L, 'guild', choices);
      const line = (id) => { const x = GUILDS[id]; return x.minor ? `${x.name}(${guildHome(id).name}, ${x.size}명): "${x.spec} 위주로 일합니다. 수습 3개월, 숙소 제공."` : `${x.name}(거대 길드): "인재 확보팀입니다. 면담 한번 하시죠."`; };
      this.talk([
        { narr: `측정 결과가 협회 명단에 올라간 다음 날, ${ids.length > 1 ? '휴대폰이 연달아 울린다' : '문자가 한 통 온다'}.` },
        ...ids.map((id) => ({ narr: line(id) })),
        { choices: [...choices, { text: '길드는 아직 생각 없다', go: () => { G.flags.story.snubbedBy = G.flags.story.snubbedBy || (GUILD_TIER[ids[0]] === 'giant' ? ids[0] : null); return this.affNext('kama'); } }] },
      ], null);
    },
    // ---------- 2) 보호국 권유 ----------
    affKamaOffer() {
      const L = leaderIn((x) => x.guild === 'kama');
      const yes = { text: '관리국 보호국에 들어간다', info: { type: 'guild', id: 'kama' }, go: () => this.affJoinOrg('kama') };
      if (L) return this.affLeaderScene(L, 'kama', []);
      this.talk([
        { narr: '관리국 보호국에서 우편이 왔다. 봉투에 "신규 등록 각성자 보호 프로그램"이라고 찍혀 있다.' },
        { narr: '"보호국은 신규 각성자에게 월급과 숙소, 3개월 연수를 제공합니다. 대신 국가 소집에는 우선 응하셔야 합니다."' },
        { choices: [yes, { text: '봉투를 서랍에 넣는다', go: () => this.affNext('free') }] },
      ], null);
    },
    affJoinOrg(id) {
      const f = G.affFlow(); G.affJoin(id, 0); f.done = true; G.flags.story.affPath = id === 'kama' ? 'kama' : 'guild';
      G.queue.unshift({ type: 'firstParty' });
      this.renderGame(); return this.processQueue();
    },
    // ---------- 3) 무소속 파티 권유 ----------
    affFreeOffer() {
      const p = G.player; if (p.origin) p.origin.aff = 'free';
      const L = leaderIn((x) => !x.guild);
      if (L) return this.affLeaderScene(L, 'party', []);
      this.fpCands = G.firstPartyCands().map((n) => n.id);
      const list = this.fpCands.map((id) => G.npcById(id)).filter(Boolean);
      const sp = list.find((n) => n.examMate && n.personality === 'kind') || list.find((n) => n.examMate) || list[0];
      const known = sp && (sp.examMate || sp.friendhood);
      this.talk([
        { narr: known ? '어디에도 들어가지 않은 지 일주일. 동네 국밥집에서 낯익은 얼굴이 손을 흔든다.' : '어디에도 들어가지 않은 지 일주일. 헌터넷 무소속 게시판으로 쪽지가 왔다.' },
        sp ? { who: sp, text: sp.friendhood ? '너 아무 데도 안 갔다며? 나도 그래. 그럼 우리끼리 다니자. 혼자는 위험해.' : '우리도 다 무소속이에요. 혼자 다니면 위험하잖아요. 같이 다닐래요?' } : null,
        list.length > 1 ? { narr: `함께하자는 사람들: ${list.map((n) => `${n.name}(${className(n.cls)})`).join(', ')}` } : null,
        { sys: G.payTermsText ? String(G.payTermsText(null)).replace(/<[^>]+>/g, '') : '무소속: 월급은 없다. 전리품은 전투력에 비례해 나누고, 혼자 다니면 조금 더 갖는다.' },
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
    // ---------- 4) 완전 솔로 ----------
    affSolo(sp) {
      const f = G.affFlow(); if (f) f.done = true; G.flags.story.affPath = 'solo';
      if (G.player.origin) G.player.origin.aff = 'free';
      if (sp) G.changeRel(sp, -2, '같이 다니자는 말을 거절했다');
      G.lifeEvent('어디에도 속하지 않고 혼자 다니기로 했다.');
      const end = () => { this.fpCands = []; this.fpPick = new Set(); this.firstPartyDone(false); };
      if (!sp) return this.talk([{ narr: '연락은 더 오지 않았다. 당분간은 혼자다. 그것도 나쁘지 않다.' }], end);
      this.talk([{ who: sp, text: sp.personality === 'cold' ? '…그래. 마음 바뀌면 연락해.' : '그래요… 마음 바뀌면 꼭 연락해요. 번호 안 바꿀게요.' }], end);
    },
  });
  // affStep 'solo' (리더 무소속 파티를 거절한 경우)
  const baseStep = UI.affStep;
  UI.affStep = function (step) { if (step === 'solo') return this.affSolo(null); return baseStep.call(this, step); };
}

// 권유 선택지 ⓘ(길드 정보 카드)에 계약 조건 한 줄: E의 G.payTermsText(gid) (payroll.js)
if (typeof UI !== 'undefined' && UI.INFO && UI.INFO.guild) {
  const baseInfo = UI.INFO.guild;
  UI.INFO.guild = function (id) {
    const r = baseInfo.call(this, id);
    const fn = G.contractTerms || G.payTermsText; if (!r || !fn) return r;
    const t = fn.call(G, id); if (!t) return r;
    return { ...r, body: `${r.body}<div class="ic-row"><span>계약 조건</span><b>${t}</b></div>` };
  };
}
