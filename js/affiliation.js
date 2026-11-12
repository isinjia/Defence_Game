// ===== 게이트 크로니클: 소속 결정 · 네 길드 면접 · 첫 파티 · 첫 해 수첩 =====
// 프롤로그 선택은 "어디로 가고 싶은지(희망)"만 정한다. 실제 소속은 협회 측정 등급이 정한다.
// 등급이 낮으면 길드는 쳐다보지도 않는다. 관리국(협회)은 공공기관이라 누구든 연수는 받아 준다.
// 소속이 정해지면 그 소속 사람들로 첫 파티를 꾸리고, 소속이 내려 주는 "첫 해 수첩"으로 핵심 고리를 익힌다.

// ---------- 길드 적합도 ----------
const GUILD_FIT = {
  baekho: { g: ['guard', 'shooter'], bg: ['chaebol', 'soldier'], e: 'holy', r: 'gangnam' },
  cheongryong: { g: ['mage', 'esper', 'summon'], bg: ['subject', 'student'], e: 'wood', r: 'daejeon' },
  hyeonmu: { g: ['fighter', 'east'], bg: ['student', 'orphan'], e: 'water', r: 'ulsan' },
  jujak: { g: ['shadow', 'support'], bg: ['orphan'], e: 'fire', r: 'gwangju' },
};
// 점수: 직업 계열 +2, 출신 +2, 각성한 지역이 본부 +1, 속성 +1. 동점이면 무작위
function guildFitOrder(grp, bg, elem, region) {
  const sc = Object.entries(GUILD_FIT).map(([id, f]) => [id, (f.g.includes(grp) ? 2 : 0) + (f.bg.includes(bg) ? 2 : 0) + (f.r === region ? 1 : 0) + (f.e === elem ? 1 : 0) + Math.random() * 0.5]);
  return sc.sort((a, b) => b[1] - a[1]).map(([id]) => id);
}

// ---------- 네 길드 면접 장면 (프롤로그) ----------
const VG_SCENE = {
  baekho: { title: '백호 타워 보안 브리핑실', text: '관리국 등록을 마친 다음 날, 검은 세단이 집 앞에 선다. "백호 시큐리티 인재 확보팀입니다."\n\n강남 백호 타워 41층 보안 브리핑실. 각 잡힌 제복 차림의 교관이 장비 지급 목록부터 내민다. "방탄 내피, 전술 장갑, 통신기. 수습 기간 지급품입니다. 우리 일은 규율이 반이에요. 등급도 안 나온 신입이 그걸 지킬 수 있겠습니까?"\n\n교관이 덧붙인다. "물론 계약은 협회 측정 뒤입니다. 등급 나오면 다시 연락드리죠."' },
  cheongryong: { title: '청룡 연구소 측정실', text: '관리국 등록을 마친 다음 날, 연구소 로고가 찍힌 메일이 온다. "청룡 연구소 각성자 협력 프로그램 안내."\n\n대전 연구소 지하 측정실. 면접이라기보다 실험에 가깝다. 흰 가운의 연구원이 머리에 전극을 붙이며 말한다. "편하게 계세요. 에테르 파형만 좀 볼게요. 흥미로운 패턴이 나오면… 우리가 먼저 데려가야죠."\n\n연구원이 모니터에서 눈을 떼지 않는다. "정식 제안은 협회 측정 뒤에 드릴게요."' },
  hyeonmu: { title: '현무 중공업 면접실', text: '관리국 등록을 마친 다음 날, 모르는 번호로 전화가 온다. "현무 중공업 각성자단 신인 발굴팀입니다. 소문 듣고 연락드렸어요."\n\n중공업 본사 28층 면접실. 정장 차림의 스카우터 셋이 태블릿을 넘기며 묻는다. "등급도 아직 안 나온 신입한테 우리가 왜 투자해야 하죠?"\n\n가운데 스카우터가 덧붙인다. "물론 등급 나오면 다시 연락드리죠. 그때까진 가계약입니다."' },
  jujak: { title: '광주 포차 2층 연합 사무실', text: '관리국 등록을 마친 다음 날, 메신저로 링크 하나가 온다. "주작 프리랜서 연합. 밥은 사 줌."\n\n광주 금남로 포차 2층. 연합 사무실이라기엔 소주 박스가 너무 많다. 계약서 대신 소주잔이 놓인다. 연합 간사가 웃는다. "우린 누구나 환영이야. 근데 같이 일하려면 서로 알아야지. 한 잔 받고, 너 얘기 좀 해 봐."\n\n"등급? 그건 나오면 그때 보고."' },
};
const VG_CHOICES = [
  { text: '"등급 나오기 전이니까요. 제일 싸게 살 수 있을 때잖아요."', t: { merchant: 1, charisma: 1 }, luck: 1, flag: 'hope_guild', next: null },
  { text: '말 대신 손바닥 위로 에테르를 끌어올린다. 주변 기계가 지직거린다', talent: 1, t: { mana_sense: 1, reckless: 1 }, flag: 'hope_guild', next: null },
  { text: '"투자 말고 계약서부터 보여 주세요."', t: { genius: 1 }, talent: 1, flag: 'hope_guild', next: null },
  { text: '"길드는 아직 생각 없어요. 같이 다닐 사람이 있어서요." {friend}의 얼굴이 떠오른다', t: { charisma: 1 }, friend: 20, flag: 'hope_free', next: null },
  { text: '내내 창밖만 본다. "다음에 제가 부르면 오세요."', t: { loner: 1, berserk: 1 }, luck: 2, flag: 'hope_free', next: null },
];
for (const id of Object.keys(VG_SCENE)) {
  PROLOGUE['vg_' + id] = { ...VG_SCENE[id], choices: [...VG_CHOICES, { text: '"다른 길드 이야기도 들어 보겠습니다."', luck: 1, next: 'vg_second' }] };
  PROLOGUE['vg2_' + id] = { ...VG_SCENE[id], choices: VG_CHOICES };
}
// "다른 길드 이야기도" → 두 번째로 잘 맞는 길드 장면으로 바꿔 끼운다 (자리 표시용)
PROLOGUE.vg_second = PROLOGUE.vg2_hyeonmu;

Object.assign(UI, {
  // 프롤로그 지금까지의 점수로 면접 볼 길드 순서
  proGuildOrder() {
    const s = this.pro; const sc = s.sc;
    const top = (o, keys) => { let best = keys[0], bv = -1; for (const k of keys) if ((o[k] || 0) > bv) { bv = o[k] || 0; best = k; } return best; };
    const grp = top(sc.g, Object.keys(CLASS_GROUPS).filter((g) => g !== 'hidden'));
    const elem = top(sc.e, ELEMENT_KEYS);
    const bg = BACKGROUNDS.find((b) => b.id === s.bg) || {};
    let order = guildFitOrder(grp, s.bg, elem, bg.region);
    if (s.bg === 'subject') order = ['cheongryong', ...order.filter((x) => x !== 'cheongryong')];
    return order;
  },
});

// ---------- 희망 · 소속 ----------
Object.assign(Game.prototype, {
  // 판정 장면에서 고른 희망 (프롤로그 플래그 또는 출신)
  setHope(flags, hopeGuild) {
    const p = this.player; flags = flags || {};
    let hope = flags.hope_kama ? 'kama' : flags.hope_guild ? 'guild' : flags.hope_free ? 'free' : null;
    if (!hope) hope = p.bg === 'soldier' ? 'kama' : (p.bg === 'subject' || p.bg === 'chaebol') ? 'guild' : 'free';
    if (!hopeGuild) {
      const grp = classById(p.cls).g; const bg = BACKGROUNDS.find((b) => b.id === p.bg) || {};
      hopeGuild = p.bg === 'subject' ? 'cheongryong' : guildFitOrder(grp, p.bg, p.element, bg.region)[0];
    }
    p.origin = { hope, hopeGuild, aff: null, broker: !!flags.broker, mentor: null };
  },
  affJoin(id, rank = 0) {
    const p = this.player;
    if (p.guild && p.guild !== id && this.crewLeave && p.crew) this.crewLeave('quit');
    p.guild = id; p.guildRank = rank; p.contrib = rank >= 1 ? GUILD_RANKS[1].req : 0;
    if (p.origin) p.origin.aff = id === 'kama' ? 'kama' : 'guild';
    this.lifeEvent(`${GUILDS[id].name}에 ${GUILD_RANKS[rank].name}(으)로 들어갔다.`);
  },
  affTier() { const d = this.player.debut; return d ? d.tier : this.debutTier(); },
  // 측정 결과와 희망으로 첫 소속 사건을 고른다
  affEventId() {
    const o = this.player.origin; if (!o) return null;
    const t = this.affTier();
    if (o.hope === 'guild') return 'aff_guild_' + t;
    if (o.hope === 'kama') return t === 'star' ? 'aff_kama_star' : t === 'bottom' ? 'aff_kama_bottom' : 'aff_kama';
    return null;
  },
  otherGuild(not) { const ks = Object.keys(GUILD_FIT).filter((k) => k !== not); return ks[this.monthKey() % ks.length]; },
});

const AFF = (id, ev) => S({ id, trigger: 'system', ...ev });
const gName = (id) => GUILDS[id].name;
const hopeG = (g) => (g.player.origin && g.player.origin.hopeGuild) || 'jujak';
const afterAff = (g) => { g.queue.unshift({ type: 'firstParty' }); return ''; };

AFF('aff_guild_star', { text: (g) => { const a = hopeG(g); const b = g.otherGuild(a); return `측정 결과가 나온 지 한 시간. 면접을 봤던 ${gName(a)}에서 전화가 온다. "계약서 준비해 뒀습니다. 오늘 바로 뵙죠."\n\n10분 뒤, ${gName(b)}에서도 연락이 왔다. 계약금 숫자가 하나 더 붙어 있다.`; },
  choices: [
    { text: '면접 본 길드에 정식 입단한다', do: (g) => { g.affJoin(hopeG(g), 1); afterAff(g); return '"역시 우리 눈이 맞았어요." 계약서에 서명했다.' + g.gain({ money: 1200, fame: 3 }); } },
    { text: '더 높은 계약금 쪽으로 간다', do: (g) => { const b = g.otherGuild(hopeG(g)); g.flags.story.snubbedBy = hopeG(g); g.affJoin(b, 1); afterAff(g); return `${gName(b)}에 정식 입단했다. 면접을 봤던 스카우터는 "아쉽네요"라고만 했다.` + g.gain({ money: 1800 }); } },
    { text: '둘 다 미루고 혼자 시작한다', do: (g) => { g.player.origin.aff = 'free'; afterAff(g); return '"후회하실 텐데요." 그래도 길드들은 계속 연락해 올 것이다.' + g.gain({ fame: 2 }); } },
  ] });
AFF('aff_guild_rising', { text: (g) => `측정 다음 날, 면접을 봤던 ${gName(hopeG(g))}에서 문자가 온다.\n\n"측정 결과 확인했습니다. 수습 3개월로 시작해 보시죠. 숙소는 제공합니다. 정식 계약은 그 뒤에 이야기하고요."`,
  choices: [
    { text: '수습으로 들어간다', do: (g) => { g.affJoin(hopeG(g), 0); afterAff(g); return '수습 단원 명찰을 받았다. 이름 옆에 "수습" 두 글자가 작게 박혀 있다.' + g.gain({ money: 300 }); } },
    { text: '정중히 거절하고 혼자 해 본다', do: (g) => { g.player.origin.aff = 'free'; afterAff(g); return '"그럼 나중에 다시 보죠." 문은 완전히 닫히지 않았다.' + g.gain({ ether: 20 }); } },
  ] });
AFF('aff_guild_normal', { text: (g) => `측정 결과가 나온 지 사흘. ${gName(hopeG(g))}에서는 연락이 없다. 면접 때 받은 명함 번호로 걸어 보니 "담당자가 자리에 없습니다"만 돌아온다.\n\n대신 주작 프리랜서 연합 단톡방에서 초대 링크가 왔다. "등급 상관없음. 밥은 사 줌."`,
  choices: [
    { text: '주작 연합 수습으로 들어간다', when: (g) => hopeG(g) !== 'jujak', do: (g) => { g.flags.story.snubbedBy = hopeG(g); g.affJoin('jujak', 0); afterAff(g); return '포차 2층 사무실. 간사가 소주잔을 내밀었다. "어디서 거절당했지? 괜찮아. 우리도 다 그랬어."' + g.gain({ money: 150 }); } },
    { text: '주작 연합 수습으로 들어간다', when: (g) => hopeG(g) === 'jujak', do: (g) => { g.affJoin('jujak', 0); afterAff(g); return '면접 때 그 간사가 다시 소주잔을 내밀었다. "등급? 그건 나오면 그때 본다고 했잖아."' + g.gain({ money: 150 }); } },
    { text: '어디에도 들어가지 않는다', do: (g) => { g.flags.story.snubbedBy = hopeG(g); g.player.origin.aff = 'free'; afterAff(g); return '명함을 서랍에 넣었다. 언젠가 저쪽에서 다시 전화하게 만들겠다.' + g.gain({ ether: 20 }); } },
  ] });
AFF('aff_guild_bottom', { text: (g) => `측정 결과가 나오고 일주일. ${gName(hopeG(g))}은(는) 물론이고, 어디서도 연락이 없다. 면접 때 받은 명함은 이제 없는 번호라고 나온다.\n\n대신 모르는 번호로 문자가 한 통 온다. "F급 하위 맞으시죠? 등록 대행했던 사람 소개로 연락드려요. 쉬운 일 있는데."`,
  choices: [
    { text: '일단 들어 본다', do: (g) => { g.flags.story.snubbedBy = hopeG(g); g.flags.story.brokerLink = true; g.player.origin.aff = 'free'; afterAff(g); return '"게이트 사체 운반, 무등록 현장이요. 현금으로 드려요." 찜찜했지만 통장 잔고가 더 찜찜했다.' + g.gain({ money: 200, merit: -2 }); } },
    { text: '답장하지 않는다', do: (g) => { g.flags.story.snubbedBy = hopeG(g); g.player.origin.aff = 'free'; afterAff(g); return '휴대폰을 엎어 두었다. 결국 남은 건 소꿉친구와 나뿐이다.' + g.gain({ hp: 0.3 }); } },
  ] });
AFF('aff_kama_star', { text: '측정 결과가 나온 날 저녁, 관리국 인사과에서 직접 전화가 온다. "특별 채용 대상자로 선정되셨습니다. 연수는 면제, 바로 현장 배치입니다. 대신 국가 소집에는 우선 응하셔야 합니다."\n\n같은 시각, 길드 스카우터들의 문자도 쌓이기 시작한다.',
  choices: [
    { text: '관리국 특채를 받아들인다', do: (g) => { g.affJoin('kama', 1); afterAff(g); return '관리국 신분증을 받았다. 엘리트 코스의 첫날이다.' + g.gain({ merit: 20, fame: 4 }); } },
    { text: '길드 쪽도 들어 보겠다며 미룬다', do: (g) => { g.player.origin.aff = 'free'; afterAff(g); return '"자리는 오래 비워 두지 않습니다." 인사과 직원이 담담하게 말했다.' + g.gain({ fame: 2 }); } },
  ] });
AFF('aff_kama', { text: '협회 측정이 끝나고 관리국에서 우편이 왔다. "신규 등록 각성자 연수 안내. 등급과 관계없이 모든 신규 등록자는 3개월간 관리국 연수를 받을 수 있습니다."\n\n412번 표를 쥐고 줄을 서던 날이 떠오른다.',
  choices: [
    { text: '연수에 들어간다', do: (g) => { g.affJoin('kama', 0); afterAff(g); return '연수 첫날, 담당 주무관이 두꺼운 매뉴얼을 나눠 줬다. "외우라는 거 아닙니다. 죽지 말라는 거예요."' + g.gain({ merit: 6 }); } },
    { text: '연수 없이 혼자 시작한다', do: (g) => { g.player.origin.aff = 'free'; afterAff(g); return '안내문을 접었다. 정식 등록은 했으니 그걸로 됐다.'; } },
  ] });
AFF('aff_kama_bottom', { text: '측정관이 결과지와 함께 안내문 한 장을 건넨다. "관리국 연수는 등급과 관계없이 받으실 수 있습니다. 다만… F급 하위는 현장보다 지원 업무 위주로 배정됩니다."\n\n잡일이라는 뜻이다. 그래도 국가가 쳐 주는 마지막 안전망이다.',
  choices: [
    { text: '그래도 연수에 들어간다', do: (g) => { g.affJoin('kama', 0); afterAff(g); return '첫 배정은 게이트 봉쇄선 차량 통제였다. 그래도 관리국 조끼를 입었다.' + g.gain({ merit: 4 }); } },
    { text: '혼자 해 보겠다', do: (g) => { g.player.origin.aff = 'free'; afterAff(g); return '안내문을 돌려줬다. 측정관은 말리지 않았다.'; } },
  ] });

// 거절했던 길드가 다시 찾아온다 (C급 이상이 되면)
S({ id: 'aff_regret', once: true, minRank: 3, when: (g) => g.flags.story.snubbedBy && g.player.guild !== g.flags.story.snubbedBy, weight: 4,
  text: (g) => `${gName(g.flags.story.snubbedBy)}의 이름으로 꽃바구니가 도착했다. 카드에는 이렇게 적혀 있다.\n\n"측정 때는 저희가 실수했습니다. ${RANKS[g.player.rankIdx].key}급 헌터 ${g.player.name} 님을 정식으로 모시고 싶습니다. 조건은 원하시는 대로."`,
  choices: [
    { text: '정중하게 거절한다', do: (g) => { g.rumor(`${gName(g.flags.story.snubbedBy)}, ${g.player.name} 영입 실패. "신입 때 놓친 인재"라는 뒷말.`); return '"그때 그 전화, 기억합니다." 그 한마디로 충분했다.' + g.gain({ fame: 6 }); } },
    { text: '조건을 듣고 옮긴다', do: (g) => { const id = g.flags.story.snubbedBy; g.affJoin(id, 1); return `${gName(id)}에 정식 단원으로 들어갔다. 계약금이 측정 때 들었던 금액의 열 배였다.` + g.gain({ money: 2500, fame: 3 }); } },
  ] });

// ---------- 시험 동기의 측정 결과와 행선지 ----------
Object.assign(Game.prototype, {
  examMateFates() {
    for (const n of this.npcs) {
      if (!n.examMate || n.mateFate) continue;
      n.mateFate = true;
      n.rankIdx = RNG.chance(0.3) ? 1 : 0;
      const r = RNG.next();
      if (n.rankIdx >= 1) n.guild = r < 0.5 ? RNG.pick(Object.keys(GUILD_FIT)) : r < 0.8 ? 'kama' : null;
      else n.guild = r < 0.15 ? 'jujak' : r < 0.5 ? 'kama' : null;
    }
  },
  newcomer(guild, near) {
    const p = this.player; const n = this.makeNpc(true, RNG.chance(0.8) ? 'human' : undefined);
    n.rankIdx = Math.max(0, Math.min(7, p.rankIdx + (near ? 0 : RNG.int(-1, 0)))); n.stage = RNG.int(0, 1);
    n.region = p.region; n.met = true; n.relation = 30; n.guild = guild; n.ageMonths = p.ageMonths + RNG.int(-24, 36);
    n.links = {}; n.disciples = []; n.parents = []; n.cohort = true;
    this.npcs.push(n); return n;
  },
  // 소속이 정하는 첫 파티 후보
  firstPartyCands() {
    const p = this.player; const o = p.origin || {}; const aff = o.aff || 'free';
    const mates = this.npcs.filter((n) => n.examMate && n.alive);
    const out = [];
    if (aff === 'guild' || aff === 'kama') {
      const g = p.guild;
      for (const n of mates) if (n.guild === g) out.push(n);
      while (out.length < 3) out.push(this.newcomer(g, aff === 'guild'));
    } else {
      for (const n of mates) if (!n.guild) out.push(n);
      const f = this.npcs.find((n) => n.friendhood && n.alive);
      if (f && f.rankIdx >= 1) out.unshift(f);
      if (!out.length) out.push(this.newcomer(null, false));
    }
    return out.slice(0, 4);
  },
});

Object.assign(UI, {
  showFirstParty() {
    const p = G.player; const o = p.origin || {};
    const cands = this.fpCands || (this.fpCands = G.firstPartyCands().map((n) => n.id));
    this.fpPick ??= new Set(cands.filter((id) => { const n = G.npcById(id); return n && (n.examContact || n.friendhood || n.cohort); }));
    const list = cands.map((id) => G.npcById(id)).filter(Boolean);
    const aff = o.aff || 'free';
    const head = aff === 'guild' ? `${GUILDS[p.guild].name}이(가) 같은 기수 신입들로 첫 파티를 붙여 준다. 시험 동기 중 같은 곳에 뽑힌 사람이 있으면 먼저 들어온다.`
      : aff === 'kama' ? '관리국 연수 동기 조가 편성됐다. 시험 동기 중 관리국을 고른 사람이 있으면 같은 조다.'
      : '아무 데도 뽑히지 않은 사람들. 남겨진 사람들끼리 시작하는 파티다.';
    const tag = (n) => n.friendhood ? '소꿉친구' : n.examMate ? `시험 동기${n.examContact ? ' · 연락처 교환' : ''}` : aff === 'kama' ? '연수 동기' : '같은 기수';
    this.modal(fixJosa(`<div class="eyebrow">${G.dateStr()} · 첫 파티 편성</div><h3>함께 시작할 사람들</h3>
      <p class="event-text">${head}</p>
      <div class="cards">${list.map((n) => `<button class="item-row choice-btn ${this.fpPick.has(n.id) ? 'on' : ''}" data-act="fp-pick" data-v="${n.id}">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${this.rankTag(n.rankIdx, n.stage)}
        <div><span class="tag cls tiny" style="--c:${groupColor(classById(n.cls).g)}">${className(n.cls)}</span> <span class="small dim">${tag(n)} · ${persById(n.personality).name}</span></div></div><b class="${this.fpPick.has(n.id) ? 'amber' : 'dim'}">${this.fpPick.has(n.id) ? '함께' : '—'}</b></button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="fp-done" data-v="0">혼자 시작한다</button><button class="primary" data-act="fp-done" data-v="1" ${this.fpPick.size ? '' : 'disabled'}>이 파티로 시작한다</button></div>`), 'event-box');
  },
  firstPartyDone(yes) {
    const p = G.player; const joined = [];
    for (const id of yes ? [...this.fpPick] : []) {
      const n = G.npcById(id); if (!n || G.party().length >= 4) continue;
      n.isCompanion = true; n.region = p.region; (p.party ||= []).includes(n.id) || p.party.push(n.id); n.relation = Math.max(n.relation, 55); joined.push(n.name);
    }
    this.fpCands = null; this.fpPick = null;
    if (joined.length) G.lifeEvent(`${joined.join(', ')}와(과) 첫 파티를 꾸렸다.`);
    G.nbStart();
    G.save(); this.closeModal(); this.renderGame();
    this.toast(joined.length ? `${joined.join(', ')}와(과) 함께 시작한다.` : '당분간은 혼자다.');
    return this.processQueue();
  },
});

// ---------- 첫 해 수첩 ----------
const NB_TASKS = [
  { id: 'gate', name: '가까운 게이트 하나 공략하기', why: '게이트를 닫으면 코어가 나온다. 코어가 모든 것의 재료다.' },
  { id: 'take', name: '도시 의뢰소에서 협회 의뢰 하나 받기', why: '의뢰는 돈과 협회 공적, 도시 평판을 준다.' },
  { id: 'report', name: '의뢰를 끝내고 의뢰소에 보고하기', why: '받은 도시 의뢰소에 보고해야 보상이 나온다.' },
  { id: 'craft', name: '공방에서 무엇이든 하나 만들기', why: '코어는 공방에서 회복제·장비·각성 촉매가 된다.' },
  { id: 'train', name: '한 달 수련해 에테르 채우기', why: '에테르가 차야 다음 단계, 그리고 돌파로 갈 수 있다.' },
  { id: 'break', name: '각성 촉매로 첫 돌파', why: '코어 → 촉매 → 돌파. 이 게임의 큰 고리다.' },
];
// 수첩을 주는 사람의 말투 (소속별)
const NB_VOICE = {
  baekho: { who: '사수', give: (t) => `"신입, 이번 주 과제다. ${t}. 보고는 간결하게."`, done: '"확인했다. 다음 과제 하달한다."', nag: '"과제가 밀렸다. 백호에서 기한은 장식이 아니다."', pers: 'cold' },
  cheongryong: { who: '사수', give: (t) => `"다음 관찰 항목이에요. ${t}. 데이터가 쌓이면 보이는 게 있어요."`, done: '"좋은 데이터예요. 다음 단계로 가죠."', nag: '"관찰 기록이 비어 있네요. 실험은 기다려 주지 않아요."', pers: 'just' },
  hyeonmu: { who: '사수', give: (t) => `"이번 달 실적 목표. ${t}. 숫자로 증명해."`, done: '"실적 확인. 다음 목표 바로 간다."', nag: '"실적 미달이다. 이대로면 수습 평가 나쁘게 나간다."', pers: 'greedy' },
  jujak: { who: '사수', give: (t) => `"야, 막내! ${t}. 모르면 물어보고, 밥은 형/누나가 산다."`, done: '"오 잘했네! 다음 거 하자."', nag: '"요즘 얼굴 보기 힘들다? 바빠도 할 건 하자."', pers: 'kind' },
  kama: { who: '담당 주무관', give: (t) => `"신규 등록자 연수 과제입니다. ${t}. 완료하시면 공적이 기록됩니다."`, done: '"과제 완료 확인했습니다. 다음 과제 안내드립니다."', nag: '"연수 과제 기한이 지났습니다. 사유서 제출 바랍니다."', pers: 'just' },
  free: { who: '소꿉친구', give: (t) => `"나 좀 알아봤는데, 너 다음엔 이거 해 봐. ${t}. 진짜야, 다들 그렇게 시작한대."`, done: '"오, 했어? 대박. 그럼 다음은…"', nag: '"요즘 뭐 해? 걱정돼서 그래."', pers: null },
};

Object.assign(Game.prototype, {
  nbVoiceKey() { const p = this.player; const o = p.origin || {}; if (o.aff === 'kama' && p.guild === 'kama') return 'kama'; if (o.aff === 'guild' && p.guild && NB_VOICE[p.guild]) return p.guild; return 'free'; },
  nbMentor() {
    const p = this.player; const nb = p.notebook; if (!nb) return null;
    let n = nb.mentor != null ? this.npcById(nb.mentor) : null;
    if (n && n.alive) return n;
    const key = this.nbVoiceKey();
    if (key === 'free') { n = this.npcs.find((x) => x.friendhood && x.alive); if (n) nb.mentor = n.id; return n || null; }
    n = this.makeNpc(false, 'human');
    n.rankIdx = key === 'kama' ? Math.max(2, p.rankIdx + 1) : Math.min(7, p.rankIdx + 2); n.stage = 1; n.region = p.region; n.met = true; n.relation = 25;
    n.guild = p.guild; n.personality = NB_VOICE[key].pers || n.personality; n.ageMonths = RNG.int(27, 40) * 12; n.lifespan = Math.max(n.lifespan, 75);
    n.links = {}; n.disciples = []; n.parents = []; n.mentorOf = true;
    this.npcs.push(n); nb.mentor = n.id; if (p.origin) p.origin.mentor = n.id;
    return n;
  },
  nbStart() {
    const p = this.player; if (p.notebook) return;
    p.notebook = { i: 0, at: this.monthKey(), mentor: null, base: { gates: p.record.gates, br: p.record.breakthroughs, rank: p.rankIdx }, f: {}, nagAt: this.monthKey(), voice: this.nbVoiceKey() };
    this.nbMentor();
    this.queue.push({ type: 'story', id: 'nb_msg', npc: p.notebook.mentor });
  },
  nbTask() { const nb = this.player.notebook; return nb && nb.i < NB_TASKS.length ? NB_TASKS[nb.i] : null; },
  nbDone(t) {
    const p = this.player; const nb = p.notebook;
    switch (t.id) {
      case 'gate': return p.record.gates > nb.base.gates;
      case 'take': return nb.f.take || p.quests.some((q) => q.kind === 'bounty');
      case 'report': return !!nb.f.report;
      case 'craft': return !!nb.f.craft;
      case 'train': return !!nb.f.train;
      case 'break': return p.record.breakthroughs > nb.base.br || p.rankIdx > nb.base.rank;
      default: return false;
    }
  },
  nbReward() {
    const p = this.player; const key = this.player.notebook.voice || this.nbVoiceKey(); const m = this.nbMentor();
    if (key === 'kama') return this.gain({ merit: 6, money: 80 });
    if (key === 'free') { if (m) this.changeRel(m, 6); p.items.potion = (p.items.potion || 0) + 1; return this.gain({ money: 40 }) + ' (응급 회복제 1개)'; }
    p.contrib = (p.contrib || 0) + 25; if (this.checkGuildRank) this.checkGuildRank([]);
    return this.gain({ money: 120 }) + ' (길드 공헌 +25)';
  },
  // 진행 확인: 끝난 과제는 보상, 다음 과제는 메시지로
  nbCheck() {
    const p = this.player; const nb = p && p.notebook; if (!nb || nb.i >= NB_TASKS.length || this.over) return;
    const t = this.nbTask(); if (!t) return;
    if (this.nbDone(t)) {
      nb.i++; nb.at = this.monthKey(); nb.nagAt = nb.at;
      const r = this.nbReward();
      this.log(`첫 해 수첩: [${t.name}] 완료.${r}`, 'good');
      if (nb.i >= NB_TASKS.length) { this.lifeEvent('첫 해 수첩의 과제를 모두 마쳤다.'); this.queue.push({ type: 'story', id: 'nb_end', npc: nb.mentor }); }
      else this.queue.push({ type: 'story', id: 'nb_msg', npc: nb.mentor });
      return;
    }
    // 미루면 한 소리 (길드·관리국은 관계 하락)
    if (this.monthKey() - nb.nagAt >= 3) {
      nb.nagAt = this.monthKey();
      const v = NB_VOICE[nb.voice] || NB_VOICE.free; const m = this.nbMentor();
      if (m && nb.voice !== 'free') this.changeRel(m, -3);
      this.log(fixJosa(`${m ? m.name : v.who}: ${v.nag}`), nb.voice === 'free' ? '' : 'bad');
    }
  },
});

S({ id: 'nb_msg', trigger: 'system', npc: 'here',
  text: (g, c) => { const t = g.nbTask(); const nb = g.player.notebook; const v = NB_VOICE[nb.voice] || NB_VOICE.free; const first = nb.i === 0;
    return `${first ? `${c.npc ? c.npc.name : v.who}에게서 메시지가 왔다. ${nb.voice === 'free' ? '' : `${v.who}(으)로 배정된 사람이다.`}\n\n` : `${c.npc ? c.npc.name : v.who}: ${v.done}\n\n`}${v.give(t ? t.name : '')}\n\n${t ? `(${t.why})` : ''}`; },
  choices: [{ text: '알겠다고 답한다', do: (g) => '첫 해 수첩에 적어 두었다. 의뢰 창에서 언제든 다시 볼 수 있다.' }] });
S({ id: 'nb_end', trigger: 'system', npc: 'here',
  text: (g, c) => { const v = g.player.notebook.voice; return v === 'free' ? `${c.npc ? c.npc.name : '친구'}이(가) 치킨을 사 들고 왔다. "야, 너 진짜 헌터 다 됐다. 이제 내가 알려 줄 게 없네."` : v === 'kama' ? '담당 주무관이 수료증을 건넨다. "연수 과정 수료를 축하드립니다. 이제부터는 정식 현장 요원입니다."' : `${c.npc ? c.npc.name : '사수'}이(가) 어깨를 툭 친다. "수습 딱지 뗄 때 됐네. 이제부터는 네가 알아서 해."`; },
  choices: [{ text: '고개를 숙여 인사한다', do: (g, c) => { const p = g.player; if (c.npc) g.changeRel(c.npc, 10); if (p.guild && p.guildRank < 1 && (p.origin || {}).aff !== 'free') { p.contrib = Math.max(p.contrib || 0, GUILD_RANKS[1].req); g.checkGuildRank && g.checkGuildRank([]); } return '첫 해 수첩을 덮었다. 이제 정해진 과제는 없다.' + g.gain({ fame: 3, ether: 30 }); } }] });

// ---------- 연결 ----------
(() => {
  const P = Game.prototype;
  // 수첩 진행 표시
  const wrapFlag = (name, key, ok) => { const base = P[name]; if (!base) return; P[name] = function (...a) { const r = base.apply(this, a); const nb = this.player && this.player.notebook; if (nb && (!ok || ok(r))) nb.f[key] = true; return r; }; };
  wrapFlag('acceptBounty', 'take', (r) => typeof r === 'string' && r.startsWith('의뢰 수락'));
  wrapFlag('payBounty', 'report');
  wrapFlag('craft', 'craft', (r) => typeof r === 'string' && /만들었다/.test(r));
  wrapFlag('train', 'train');
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); const p = this.player; p.origin ??= null; p.notebook ??= null; };

  // 프롤로그: 판정 장면 고르기 → 네 길드 면접 중 하나
  const baseChoose = UI.proChoose;
  UI.proChoose = function (i) {
    const s = this.pro; const was = s.id;
    const r = baseChoose.call(this, i);
    if (s.id === 'verdict_guild' && was !== 'verdict_guild') { s.vgOrder = this.proGuildOrder(); s.hopeGuild = s.vgOrder[0]; s.id = 'vg_' + s.hopeGuild; this.renderPrologue(); }
    else if (s.id === 'vg_second') { s.hopeGuild = (s.vgOrder || this.proGuildOrder())[1]; s.id = 'vg2_' + s.hopeGuild; this.renderPrologue(); }
    return r;
  };
  // 희망 기록
  const baseBegin = UI.beginFromPrologue;
  UI.beginFromPrologue = function () { const s = this.pro; const r = baseBegin.call(this); if (G.player) G.setHope(s.flags, s.hopeGuild); return r; };

  // 시험 뒤: 동기는 연락처만 교환, 측정 결과로 소속 → 첫 파티 → 수첩
  const baseEnd = UI.endExam;
  UI.endExam = function (ids) {
    const p = G.player;
    if (!p.origin) G.setHope(null, null);
    for (const id of ids || []) { const n = G.npcById(id); if (n) { n.examContact = true; G.changeRel(n, 8); } }
    G.examMateFates();
    baseEnd.call(this, []);
    const ev = G.affEventId();
    if (ev) G.queue.unshift({ type: 'story', id: ev });
    else { p.origin.aff = 'free'; G.queue.unshift({ type: 'firstParty' }); }
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    if (G.player && !G.over) G.nbCheck();
    const q = G.queue[0];
    if (q && q.type === 'firstParty') { G.queue.shift(); return this.showFirstParty(); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'fp-pick': { const id = +v; if (this.fpPick.has(id)) this.fpPick.delete(id); else if (this.fpPick.size < 4) this.fpPick.add(id); return this.showFirstParty(); }
      case 'fp-done': return this.firstPartyDone(v === '1');
      default: return baseHandle.call(this, act, v);
    }
  };

  // 의뢰 창 맨 위: 첫 해 수첩
  const baseQuests = UI.questsHtml;
  UI.questsHtml = function () {
    const html = baseQuests.call(this);
    const nb = G.player.notebook; if (!nb || nb.i >= NB_TASKS.length) return html;
    const v = NB_VOICE[nb.voice] || NB_VOICE.free; const m = G.npcById(nb.mentor);
    const go = (t) => {
      if (!this.goBtn) return '';
      if (t.id === 'gate') { const p = G.player; const d = (o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y)); const gt = G.mapGates.filter((x) => G.gateSeen(x) && x.tier <= p.rankIdx + (G.party().length >= 2 ? 1 : 0)).sort((a, b) => d(a) - d(b))[0]; return gt ? `<button class="sm" data-act="travel-xy" data-v="${gt.x},${gt.y}">이동</button>` : ''; }
      if (t.id === 'report') { const q = G.player.quests.find((x) => x.kind === 'bounty' && x.status === 'done'); return q ? this.goBtn(q.from) : ''; }
      if (t.id === 'take' || t.id === 'craft') return G.onCity() ? '' : this.goBtn(this.nearestCity ? this.nearestCity() : G.player.region);
      return '';
    };
    const rows = NB_TASKS.map((t, i) => `<div class="item-row ${i === nb.i ? 'hl' : ''}"><div class="grow"><b>${i < nb.i ? '✔' : i === nb.i ? '▸' : '·'} ${t.name}</b>${i === nb.i ? `<div class="small dim">${t.why}</div>` : ''}</div>${i === nb.i ? go(t) : ''}</div>`).join('');
    return `<div class="panel"><h3>첫 해 수첩</h3><p class="dim small">${fixJosa(`${m ? `${v.who} ${m.name}` : v.who}이(가)`)} 내려 준 과제. 하나씩 끝낼 때마다 다음 과제가 온다.</p><div class="cards">${rows}</div></div>` + html;
  };
})();

Object.assign(UI, {
  nearestCity() {
    const p = G.player; let best = p.region, bd = 1e9;
    for (const r of REGIONS) { if (r.id === 'jeju') continue; const [x, y] = WORLD.cityPos[r.id]; const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y)); if (d < bd) { bd = d; best = r.id; } }
    return best;
  },
});
