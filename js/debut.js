// ===== 게이트 크로니클: 데뷔 시나리오 =====
// 헌터 자격 시험에서 밝혀진 등급과 재능에 따라 첫 해의 이야기가 달라진다.
// 주목받는 유망주 / 기대주 / 평범한 신입 / 바닥. 각 5단계가 몇 달에 걸쳐 이어진다.

const DEBUT_TIERS = {
  star: { name: '주목받는 유망주', gaps: [0, 1, 2, 2, 3] },
  rising: { name: '기대주', gaps: [0, 1, 2, 2, 3] },
  normal: { name: '평범한 신입', gaps: [0, 1, 1, 2, 3] },
  bottom: { name: '바닥', gaps: [0, 1, 1, 2, 3] },
};
const NEG_TRAITS = ['slow_learner', 'cursed', 'frail'];

Object.assign(Game.prototype, {
  debutTier() {
    const p = this.player; const r = p.rankIdx; const t = p.talent;
    const neg = (p.traits || []).filter((x) => NEG_TRAITS.includes(x)).length;
    if (r >= 3 || (r === 2 && t >= 7)) return 'star';
    if (r === 2 || (r === 1 && t >= 6)) return 'rising';
    if (r === 0 && (t <= 4 || neg >= 1)) return 'bottom';
    return 'normal';
  },
  debutStart() {
    const p = this.player; if (p.debut) return;
    const tier = this.debutTier();
    p.debut = { tier, step: 0, at: this.monthKey(), npc: null };
    this.lifeEvent(`${DEBUT_TIERS[tier].name}(으)로 헌터 생활을 시작했다.`);
  },
  debutNext() { const d = this.player.debut; if (!d) return; d.step++; d.at = this.monthKey(); if (d.step >= 5) d.done = true; },
  // 조건이 맞으면 다음 단계를 띄운다. 게이트 직후나 맞지 않는 장소에서는 기다린다
  debutDue(force) {
    const d = this.player.debut; if (!d || d.done || d.queued) return null;
    const ev = this.storyById(`debut_${d.tier}_${d.step}`); if (!ev) return null;
    if (!force && this.monthKey() - d.at < DEBUT_TIERS[d.tier].gaps[d.step]) return null;
    if (this.afterGate) return null;
    if (ev.at && !ev.at.includes(this.situation ? this.situation() : (this.onCity() ? 'city' : 'field'))) return null;
    d.queued = true;
    return { type: 'story', id: ev.id, npc: d.step === 2 ? d.npc : null };
  },
  // 데뷔 시나리오에 등장하는 인물을 만든다
  debutNpc(o) {
    const p = this.player; const n = this.makeNpc(false, o.race || 'human');
    n.rankIdx = Math.max(0, Math.min(7, o.rank)); n.stage = RNG.int(0, 2); n.region = p.region; n.met = true;
    n.relation = o.rel || 0; n.personality = o.pers || n.personality; if (o.cls) n.cls = o.cls;
    n.ageMonths = (o.age || 24 + n.rankIdx * 3) * 12; n.lifespan = Math.max(n.lifespan, Math.floor(n.ageMonths / 12) + 20);
    n.links = {}; n.disciples = []; n.parents = []; n.guild = o.guild || null;
    this.npcs.push(n); p.debut.npc = n.id;
    return n;
  },
  debutJoinGuild(id, bonus) {
    const p = this.player; if (p.crew) this.crewLeave && this.crewLeave('quit');
    p.guild = id; p.guildRank = 0; p.contrib = 0;
    this.lifeEvent(`${GUILDS[id].name}에 입단했다.`);
    return this.gain({ money: bonus });
  },
});

const D = (tier, step, ev) => S({ id: `debut_${tier}_${step}`, trigger: 'debut', ...ev });
const dn = (g) => { g.debutNext(); return ''; };
const npcOf = (g) => g.npcById(g.player.debut.npc) || { name: '그 사람' };
const guildPair = (g) => { const ks = Object.keys(GUILDS).filter((k) => k !== 'jujak' && k !== 'kama'); return [ks[g.player.debut.at % ks.length], ks[(g.player.debut.at + 1) % ks.length]]; };

// ========== 주목받는 유망주 ==========
D('star', 0, { text: (g) => `측정 결과가 나온 지 세 시간. 휴대폰이 쉬지 않고 울린다. 협회 홍보팀이 내일 아침 기자회견을 잡았다며 대본을 보내왔다.\n\n"${RANKS[g.player.rankIdx].key}급 신규 각성자, 올해 최대어." 포털 메인에 당신 얼굴이 걸려 있다. 댓글 수가 실시간으로 늘어난다.`,
  choices: [
    { text: '회견장에 선다. 대본은 접어 둔다', do: (g) => { dn(g); g.rumor(`신인 ${g.player.name}, 기자회견에서 "S급이 목표"라고 밝혀.`); return '플래시가 터졌다. "목표요? 원초의 게이트를 닫는 겁니다." 다음 날 그 말이 모든 신문 1면에 실렸다.' + g.gain({ fame: 12, rep: 10 }); } },
    { text: '회견을 거절하고 휴대폰을 끈다', do: (g) => { dn(g); return '협회 홍보팀이 한숨을 쉬었다. "신비주의도 나쁘진 않죠." 대신 기사는 추측으로 채워졌다.' + g.gain({ fame: 4 }); } },
    { text: '소꿉친구에게 먼저 전화한다', do: (g) => { dn(g); const f = g.npcs.find((n) => n.friendhood && n.alive); if (f) g.changeRel(f, 12); return `"${f ? f.name : '야'}… 나 뉴스 나왔대." 수화기 너머로 비명 같은 웃음이 터졌다.` + g.gain({ fame: 6 }); } },
  ] });
D('star', 1, { text: (g) => { const [a, b] = guildPair(g); return `${GUILDS[a].name}과(와) ${GUILDS[b].name}에서 동시에 연락이 왔다. 계약금 경쟁이 붙었다.\n\n${GUILDS[a].name}은(는) "2군 주전 보장", ${GUILDS[b].name}은(는) "전담 트레이너와 연구 지원". 협회 직원은 귀띔한다. "어디든 들어가면 그쪽 색으로 물듭니다. 신중하세요."`; },
  choices: [
    { text: '"2군 주전 보장" 쪽과 계약한다', do: (g) => { dn(g); const id = guildPair(g)[0]; return `계약서에 서명했다. 명함 뒷면에 박힌 문장 하나가 눈에 띈다. "${GUILDS[id].desc}"` + g.debutJoinGuild(id, 1500); } },
    { text: '"연구 지원" 쪽과 계약한다', do: (g) => { dn(g); const id = guildPair(g)[1]; return '연봉 협상 자리에서 상대가 먼저 숫자를 올렸다.' + g.debutJoinGuild(id, 1500); } },
    { text: '둘 다 거절한다. "당분간은 혼자 갑니다"', do: (g) => { dn(g); g.rumor(`신인 ${g.player.name}, 대형 길드 영입 제의 모두 거절.`); return '스카우터의 표정이 굳었다. "후회하실 겁니다." 커뮤니티는 들끓었다. 건방지다는 쪽과 멋있다는 쪽으로.' + g.gain({ fame: 8 }); } },
  ] });
D('star', 2, { at: ['city'], text: (g) => `{city} 협회 로비. 누군가 길을 막는다. ${npcOf(g).name}, 몇 년째 지역 신인왕 소리를 듣던 ${RANKS[npcOf(g).rankIdx].key}급 헌터다.\n\n"측정기 숫자 하나로 뉴스 타는 기분 어때? 공개 대련 신청한다. 거절하면 겁먹은 걸로 알지."`,
  choices: [
    { text: '받아들인다', do: (g) => { dn(g); const n = npcOf(g); g.storyFight({ title: `공개 대련 · ${n.name}`, spar: true, mobs: { tier: n.rankIdx, n: 1, boss: true, human: true, name: n.name },
      win: { text: `${n.name}이(가) 무릎을 꿇고 웃었다. "…인정. 다음엔 안 진다." 대련 영상이 하루 만에 백만 회를 넘겼다.`, gain: { fame: 15 }, after: (G) => G.changeRel(n, 25) },
      lose: { text: `바닥에 드러누운 당신에게 ${n.name}이(가) 손을 내민다. "숫자보다 경험이야, 신인." 영상 댓글은 냉정했다.`, gain: { fame: -5, ether: 40 }, after: (G) => G.changeRel(n, 15) } }); return '로비에 사람들이 둥글게 모였다.'; } },
    { text: '"관심 없어요." 지나간다', do: (g) => { dn(g); g.changeRel(npcOf(g), -20); return '등 뒤로 비웃음이 따라왔다. "역시 숫자뿐이네." 그 말이 오래 남았다.' + g.gain({ fame: -3 }); } },
  ] });
D('star', 3, { text: '에너지 음료 회사에서 광고 모델 제안이 왔다. 계약금이 웬만한 D급 헌터 연봉이다. 대신 촬영과 행사로 한 달은 게이트에 못 들어간다.\n\n그 사이 커뮤니티에 사진 한 장이 올라온다. 당신 집 앞을 몰래 찍은 사진이다.',
  choices: [
    { text: '광고를 찍는다', do: (g) => { dn(g); g.advanceDays(25, { noSave: true }); return '얼굴이 버스 정류장마다 붙었다. 통장은 두둑해졌고, 거리를 걷기는 어려워졌다.' + g.gain({ money: 3000, fame: 10 }); } },
    { text: '거절하고 협회에 사생활 보호를 요청한다', do: (g) => { dn(g); return '협회가 집 앞에 경비를 붙였다. "유명세도 관리 대상이에요." 수련에 집중할 수 있었다.' + g.gain({ ether: 60, merit: 5 }); } },
    { text: '광고비를 받아 보육 시설에 기부한다', do: (g) => { dn(g); g.rumor(`신인 ${g.player.name}, 첫 광고 수익 전액 기부.`); return '기사 제목이 바뀌었다. "건방진 신인"에서 "착한 괴물 신인"으로.' + g.gain({ fame: 18, rep: 15 }); } },
  ] });
D('star', 4, { text: (g) => `관리국에서 공문이 왔다. "귀하를 특별 관리 각성자로 지정합니다." 그리고 첫 합동 공략 소집. ${RANKS[Math.min(7, g.player.rankIdx + 1)].key}급 게이트, 국가 공략대와 함께다.\n\n대기실의 베테랑들이 당신을 흘끔거린다. 기대 반, 의심 반이다.`,
  choices: [
    { text: '선두에 선다', do: (g) => { dn(g); g.storyFight({ title: '국가 합동 공략 · 보스 구역', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true }, ally: { name: '공략대장 한서진', rank: Math.min(7, g.player.rankIdx + 2), elem: 'steel' },
      win: { text: '보스가 쓰러지는 장면이 생중계됐다. 공략대장이 어깨를 두드린다. "다음엔 네가 지휘해."', gain: { fame: 25, merit: 20, relic: 1 }, life: '국가 합동 공략에서 보스를 쓰러뜨렸다. 주목받는 유망주의 첫 해가 끝났다.' },
      lose: { text: '공략대장이 당신을 끌어냈다. "괜찮아. 다들 처음엔 그래." 첫 실패가 오히려 약이 됐다.', gain: { ether: 80, injure: 1 }, life: '첫 국가 합동 공략에서 쓴맛을 봤다.' } }); return '게이트 앞에 섰다.'; } },
    { text: '후방에서 베테랑들의 움직임을 배운다', do: (g) => { dn(g); g.lifeEvent('국가 합동 공략에 참가했다. 주목받는 유망주의 첫 해가 끝났다.'); return '화려함은 없었지만, 베테랑들의 호흡을 눈에 담았다.' + g.gain({ ether: 120, merit: 15, talent: 1 }); } },
  ] });

// ========== 기대주 ==========
D('rising', 0, { text: (g) => `지역 뉴스 끝자락에 한 줄이 실렸다. "${regionById(g.player.region).name}, 올해 첫 ${RANKS[g.player.rankIdx].key}급 신규 등록." 오후에 중소 길드 두 곳에서 문자가 왔다.\n\n"수습 3개월, 숙소 제공." 거창하진 않지만 현실적인 조건이다.`,
  choices: [
    { text: '주작 프리랜서 연합 수습으로 들어간다', do: (g) => { dn(g); return '숙소는 좁았지만 선배들이 밥을 사 줬다.' + g.debutJoinGuild('jujak', 400); } },
    { text: '답장하지 않고 혼자 해 본다', do: (g) => { dn(g); return '조건 좋은 데가 또 오겠지. 그렇게 생각하기로 했다.' + g.gain({ ether: 30 }); } },
  ] });
D('rising', 1, { text: '협회에서 "신인 육성 프로그램" 추천장이 왔다. 한 달 합숙, 은퇴한 A급 교관들이 직접 가르친다. 대신 그동안 수입은 없다.',
  choices: [
    { text: '합숙에 들어간다', do: (g) => { dn(g); g.advanceDays(28, { noSave: true }); return '새벽 다섯 시 기상, 밤 열한 시 소등. 몸이 기억하는 동작이 하나씩 늘었다.' + g.gain({ ether: 150, talent: 1 }); } },
    { text: '거절하고 실전으로 배운다', do: (g) => { dn(g); return '교관이 어깨를 으쓱했다. "실전파군. 죽지만 마."' + g.gain({ money: 300 }); } },
  ] });
D('rising', 2, { text: (g) => `같은 날 등록한 동기 ${npcOf(g).name}이(가) 연락해 왔다. 당신보다 한 달 늦게 측정했는데 같은 등급이 나왔단다.\n\n"우리 기수에서 누가 먼저 다음 등급 찍나, 내기할래? 진 사람이 고기 산다."`,
  choices: [
    { text: '"콜." 손을 내민다', do: (g) => { dn(g); g.changeRel(npcOf(g), 20); g.flags.story.debutRival = npcOf(g).id; return '라이벌이 생겼다. 이상하게 수련이 더 잘 됐다.' + g.gain({ ether: 50 }); } },
    { text: '"그런 거 안 해." 웃고 넘긴다', do: (g) => { dn(g); g.changeRel(npcOf(g), 5); return `${npcOf(g).name}은(는) "재미없긴" 하고 웃었다.`; } },
  ] });
D('rising', 3, { at: ['city'], text: '{city} 의뢰소 게시판에 당신 이름이 박힌 지명 의뢰가 붙었다. "기대주 ○○ 헌터 지명 · 상가 지하 게이트 정리." 의뢰인은 지역 상인회다. 첫 지명이다.',
  choices: [
    { text: '받는다', do: (g) => { dn(g); g.storyFight({ title: '지명 의뢰 · 상가 지하', mobs: { tier: g.player.rankIdx, n: 3 },
      win: { text: '상인회장이 두 손으로 봉투를 내밀었다. "역시 소문대로네요." 다음 지명이 벌써 줄을 섰다.', gain: { money: 900, fame: 8, rep: 12 } },
      lose: { text: '간신히 물러났다. 상인회장은 말없이 다른 헌터를 불렀다.', gain: { fame: -3, injure: 1 } } }); return '셔터를 올렸다.'; } },
    { text: '아직 이르다며 사양한다', do: (g) => { dn(g); return '의뢰는 다른 사람에게 넘어갔다. 아쉽지만 무리하지 않았다.' + g.gain({ rep: -3 }); } },
  ] });
D('rising', 4, { text: '등록 후 반년. 협회 신인 평가 결과가 나왔다. 평가표 맨 아래 칸에 손글씨 메모가 있다. "성장 곡선 상위권. 지켜볼 것."',
  choices: [
    { text: '메모를 사진 찍어 둔다', do: (g) => { dn(g); g.lifeEvent('협회 신인 평가에서 "지켜볼 것"이라는 평을 받았다. 기대주의 첫 해가 끝났다.'); return '누군가 보고 있다. 그거면 충분했다.' + g.gain({ fame: 10, merit: 10 }); } },
    { text: '라이벌에게 자랑한다', when: (g) => g.flags.story.debutRival, do: (g) => { dn(g); const n = g.npcById(g.flags.story.debutRival); if (n) g.changeRel(n, 10); g.lifeEvent('기대주의 첫 해가 끝났다. 라이벌과 고기를 먹었다.'); return '"…나도 같은 메모 받았거든?" 둘이 동시에 웃었다. 고기는 반반 냈다.' + g.gain({ fame: 8, hp: 1 }); } },
  ] });

// ========== 평범한 신입 ==========
D('normal', 0, { text: '자격증을 받고 집에 오니 우편함에 고지서가 쌓여 있다. 월세, 장비 할부, 헌터 의무 보험료. 협회 신입 안내 책자 첫 장에는 이렇게 적혀 있다.\n\n"F급 헌터의 평균 월수입은 일반 직장인과 비슷합니다. 다만 사망률이 다릅니다."',
  choices: [
    { text: '의뢰소에 등록하고 하루 두 건씩 뛴다', do: (g) => { dn(g); return '첫 주 수입은 편의점 알바보다 조금 많았다. 그래도 내 힘으로 번 돈이다.' + g.gain({ money: 250, ether: 20 }); } },
    { text: '당분간 아르바이트를 병행한다', do: (g) => { dn(g); return '낮엔 택배, 밤엔 수련. 몸은 고됐지만 고지서는 막았다.' + g.gain({ money: 400 }); } },
    { text: '수련에만 집중한다. 돈은 나중 문제다', do: (g) => { dn(g); return '라면으로 한 달을 버텼다. 에테르는 차곡차곡 쌓였다.' + g.gain({ ether: 70, money: -100 }); } },
  ] });
D('normal', 1, { text: '"신입 헌터 정보방(F~E급)" 단톡방에 초대됐다. 참여자 487명. 공지에는 "사기 공고 주의, 포터 착취 신고는 여기로"라고 적혀 있다.\n\n새 글이 올라온다. "내일 F급 게이트 합동 공략 3명 구합니다. 분배 1/N."',
  choices: [
    { text: '참여한다', do: (g) => { dn(g); g.storyFight({ title: '단톡방 합동 공략', mobs: { tier: 0, n: 3 }, ally: { name: '정보방 방장', rank: 1, elem: 'bolt' },
      win: { text: '분배는 정확히 1/N이었다. 방장이 "다음에도 같이 해요"라며 친구 추가를 했다.', gain: { money: 200, ether: 30 } },
      lose: { text: '다 같이 도망쳤다. 단톡방에 "오늘 공략 실패ㅋㅋ"가 올라왔다.', gain: { injure: 1 } } }); return '약속 장소에 낯선 얼굴 셋이 서 있었다.'; } },
    { text: '눈팅만 하며 정보를 모은다', do: (g) => { dn(g); return '어느 게이트가 꿀인지, 어느 길드가 신입을 갈아 넣는지. 공짜 정보가 쏟아졌다.' + g.gain({ ether: 20 }); } },
  ] });
D('normal', 2, { text: (g) => `중견 헌터 ${npcOf(g).name}이(가) 말을 건다. "자네 신입이지? 우리 파티 포터 자리 비었는데. 일당 15만, 위험수당 없음. 대신 보는 건 많을 거야."`,
  choices: [
    { text: '포터로 따라간다', do: (g) => { dn(g); g.changeRel(npcOf(g), 10); return '짐을 지고 C급 게이트 입구까지만 따라갔다. 선배들의 대화, 장비, 움직임. 돈보다 그게 컸다.' + g.gain({ money: 150, ether: 40 }); } },
    { text: '"전 헌터지 짐꾼이 아닌데요."', do: (g) => { dn(g); g.changeRel(npcOf(g), -5); return `${npcOf(g).name}이(가) 어깨를 으쓱했다. "그래, 자존심도 장비지."`; } },
  ] });
D('normal', 3, { text: '첫 분기 정산. 수입에서 장비 수리비, 회복약, 보험료를 빼니 남는 게 거의 없다. 같은 날 등록한 동기 하나가 은퇴했다는 소식이 들린다. "그냥 회사 다니려고."',
  choices: [
    { text: '그래도 계속한다', do: (g) => { dn(g); return '은퇴한 동기에게 "잘 지내"라고 문자를 보냈다. 그리고 다시 게이트로 향했다.' + g.gain({ ether: 40, fame: 1 }); } },
    { text: '장비 대신 기술에 투자한다', do: (g) => { dn(g); return '중고 스킬 데이터를 하나 샀다. 지갑은 비었지만 손이 하나 늘었다.' + g.gain({ money: -200, skill: true }); } },
  ] });
D('normal', 4, { text: (g) => { const f = g.npcs.find((n) => n.friendhood && n.alive); return `헌터가 된 지 1년. ${f ? f.name : '오랜 친구'}이(가) 포장마차로 불러냈다. "그래서, 할 만해?"\n\n특별한 일은 없었다. 다치지 않았고, 굶지 않았고, 조금씩 강해졌다.`; },
  choices: [
    { text: '"응. 생각보다 할 만해."', do: (g) => { dn(g); const f = g.npcs.find((n) => n.friendhood && n.alive); if (f) g.changeRel(f, 10); g.lifeEvent('평범한 신입의 첫 해를 무사히 넘겼다.'); return '소주잔이 부딪혔다. 평범한 1년이 이렇게 귀한 줄 몰랐다.' + g.gain({ hp: 1, ether: 50 }); } },
    { text: '"아니. 이대론 안 돼. 더 올라갈 거야."', do: (g) => { dn(g); g.lifeEvent('평범한 신입의 첫 해를 넘기며 더 높이 가겠다고 다짐했다.'); return '친구가 잠시 당신을 보다가 웃었다. "그래, 그 얼굴 오랜만이다."' + g.gain({ talent: 1 }); } },
  ] });

// ========== 바닥 ==========
D('bottom', 0, { text: '측정 결과를 받아 든 순간, 측정관이 목소리를 낮췄다. "F급… 그중에서도 하위 수치입니다. 솔직히 말씀드리면, 다른 일을 알아보시는 분들도 많아요."\n\n시험 동기들이 다른 파티 모집 공고를 보며 수군거린다. 아무도 당신 쪽을 보지 않는다.',
  choices: [
    { text: '"그래도 할 겁니다." 자격증을 받아 든다', do: (g) => { dn(g); return '측정관은 더 말하지 않았다. 자격증은 생각보다 가벼웠다.' + g.gain({ ether: 20 }); } },
    { text: '화장실에서 혼자 운다. 그리고 나온다', do: (g) => { dn(g); return '거울 속 얼굴이 엉망이었다. 세수를 하고 나왔다. 그걸로 됐다.' + g.gain({ hp: 1 }); } },
  ] });
D('bottom', 1, { at: ['city'], text: '{city} 의뢰소 창구. 직원이 화면을 보더니 고개를 젓는다. "F급 하위는 단독 의뢰 배정이 안 돼요. 보험사 규정이라."\n\n게시판 구석에 손글씨 공고가 붙어 있다. "게이트 사체 수거 · 일당 8만 · 냄새 각오."',
  choices: [
    { text: '사체 수거 일을 한다', do: (g) => { dn(g); return '한 달 내내 괴수 사체를 날랐다. 냄새는 빠지지 않았지만, 코어 부스러기를 모아 팔 줄 알게 됐다.' + g.gain({ money: 180, core: [0, 2] }); } },
    { text: '의뢰소 앞에서 파티 구걸을 한다', do: (g) => { dn(g); return '"F급 하위? 미안." 열두 번 거절당했다. 열세 번째가 혀를 차며 짐 들기라도 하라고 했다.' + g.gain({ money: 60, ether: 15 }); } },
  ] });
D('bottom', 2, { text: (g) => `${npcOf(g).name}이라는 길드 하청 브로커가 연락해 왔다. "미끼 역할 해 볼래요? 괴수 어그로만 끌고 빠지면 돼요. 50만 원. 산재 처리는… 뭐, 알아서."`,
  choices: [
    { text: '받는다. 돈이 필요하다', do: (g) => { dn(g); if (g.roll(0.55)) return '살아 나왔다. 손이 떨려서 돈을 세지 못했다.' + g.gain({ money: 500, ether: 40 }); return '괴수의 발톱이 옆구리를 스쳤다. 브로커는 전화를 받지 않았다.' + g.gain({ money: 250, injure: 2 }); } },
    { text: '거절하고 번호를 신고한다', do: (g) => { dn(g); g.changeRel(npcOf(g), -30); return '협회 신고 센터 직원이 지친 목소리로 "접수됐습니다"라고 했다. 바뀌는 건 없을 것 같았다.' + g.gain({ merit: 3 }); } },
  ] });
D('bottom', 3, { text: '사체 수거 현장에서 늙은 헌터 하나가 당신의 동작을 보고 있었다. 은퇴한 지 20년, 이름도 잊힌 사람이다.\n\n"측정 수치? 그건 지금 얼마나 담겼는지야. 그릇 크기가 아니고. 내일 새벽 다섯 시, 뒷산으로 와."',
  choices: [
    { text: '새벽 다섯 시에 뒷산에 간다', do: (g) => { dn(g); g.advanceDays(20, { noSave: true }); return '노인은 이름을 말하지 않았다. 대신 숨 쉬는 법부터 다시 가르쳤다. 몸속 에테르가 처음으로 제 길을 찾는 느낌이었다.' + g.gain({ talent: 1, ether: 90 }); } },
    { text: '"사기 아니에요?" 의심한다', do: (g) => { dn(g); return '노인은 웃으며 돌아섰다. 며칠 뒤 다시 찾아갔지만, 그는 없었다.' + g.gain({ ether: 10 }); } },
  ] });
D('bottom', 4, { at: ['field', 'city'], text: '아무도 가지 않는 폐공장 F급 게이트. 보상이 짜서 1년째 방치된 곳이다. 혼자 들어가 마지막 방에 닿았을 때, 벽 틈에서 희미한 빛이 새어 나온다.\n\n누군가 오래전에 숨겨 둔 것이다.',
  choices: [
    { text: '벽을 부순다', do: (g) => { dn(g); g.lifeEvent('아무도 가지 않는 게이트에서 숨겨진 유물을 찾았다. 바닥에서 올라오기 시작했다.'); return '녹슨 상자 안에 유물 하나와 쪽지. "버려진 곳에 남은 사람에게." 처음으로, 운이 이쪽을 봤다.' + g.gain({ relic: 1, ether: 60, fame: 3 }); } },
    { text: '협회에 신고하고 보상을 받는다', do: (g) => { dn(g); g.lifeEvent('방치된 게이트의 비밀 공간을 찾아 협회에 신고했다. 바닥에서 올라오기 시작했다.'); return '협회 조사팀이 놀란 얼굴로 당신을 봤다. "F급 하위가 이걸 찾았다고요?" 처음으로 누군가 이름을 물었다.' + g.gain({ merit: 15, money: 400, fame: 5 }); } },
  ] });

// ---------- 연결 ----------
{
  const GP = Game.prototype;
  const baseReveal = GP.revealAwakenRank;
  if (baseReveal) GP.revealAwakenRank = function () { const r = baseReveal.call(this); if (r) this.debutStart(); return r; };
  const baseMonth = GP.advanceMonth;
  GP.advanceMonth = function (n = 1, opts = {}) {
    baseMonth.call(this, n, opts);
    if (this.over || !this.player || !this.player.debut) return;
    const q = this.debutDue(); if (q) this.queue.push(q);
  };
  // 두 번째 단계부터 필요한 인물
  const baseNext = GP.debutNext;
  GP.debutNext = function () {
    baseNext.call(this);
    const d = this.player.debut; if (!d) return;
    d.queued = false;
    const need = { star: 2, rising: 2, normal: 2, bottom: 2 }[d.tier];
    if (d.step === need) {
      const p = this.player;
      if (d.tier === 'star') this.debutNpc({ rank: Math.min(7, p.rankIdx + 1), pers: 'warlike', age: 27 });
      else if (d.tier === 'rising') this.debutNpc({ rank: p.rankIdx, pers: RNG.pick(['kind', 'warlike', 'just']), age: 20 });
      else if (d.tier === 'normal') this.debutNpc({ rank: 2, pers: 'greedy', age: 34 });
      else this.debutNpc({ rank: 1, pers: 'greedy', age: 31 });
    }
  };
  // 사건 큐가 비어 있고 상황이 맞으면 도시에 들어가거나 길을 걸을 때도 확인한다
  const baseVisit = GP.visitCity;
  GP.visitCity = function (id) { const r = baseVisit.call(this, id); if (this.player.debut) { const q = this.debutDue(); if (q) this.queue.push(q); } return r; };
}
{
  // 시험이 끝나고 첫 단계를 바로 띄운다
  const baseEnd = UI.endExam;
  if (baseEnd) UI.endExam = function (ids) {
    baseEnd.call(this, ids);
    // 시험이 끝나야 판정 결과가 공개된다
    if (this.judgmentHtml) {
      const p = G.player; const mates = G.party().map((n) => n.name);
      this.modal(`${this.judgmentHtml()}
        <p class="sec">${mates.length ? `${mates.join(', ')}와(과) 함께 첫발을 내딛는다.` : '당분간은 혼자다. 시험 동기들은 인물 창에서 다시 만날 수 있다.'}</p>
        ${(() => { const L = G.npcs.filter((n) => n.examLeader && n.alive).pop(); return L ? `<p class="small">시험 리더였던 선임 ${L.name}이(가) 연락처를 건넸다. 인물 창에서 다시 만날 수 있다.</p>` : ''; })()}
        <p class="dim">지도에서 빛나는 칸을 눌러 걸어 다니고, 도시에 들어가 의뢰를 받으며 살아가십시오. 정해진 길은 없습니다.</p>
        <div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`, 'pro-judge');
    }
    const q = G.debutDue(true); if (q) G.queue.push(q);
  };
}
