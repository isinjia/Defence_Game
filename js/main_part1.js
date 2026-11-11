// ===== 메인 시나리오 1부 「균열의 냄새」 (영역 D, docs/메인_시나리오.md §3) =====
const FRIEND_AWAKE = (g) => { const f = g.mainWho('friend'); return !!(f && f.rankIdx >= 1); };
const HAS_LEADER = (g) => !!g.mainWho('leader');
const HAS_RIVAL = (g) => !!g.mainWho('rival');
// 내가 NPC 리더 파티의 팀원인가 (역할 대칭: 팀원이면 메인 일정 전에 리더 반응이 한 번 있다)
const IN_CREW = (g) => !!(g.player.crew && g.crewLeader && g.crewLeader());
const KID1 = { name: '아이', sub: '강북 폐구' };

// ---------- 1장 전단지 ----------
MAIN.ch(1, {
  part: 1, title: '전단지', rank: 0, after: 3, where: 'city',
  goal: '도시에 들어간다',
  scenes: [
    { id: 'c1_street', lines: [
      { narr: '아침 일곱 시. 게이트 경보가 없는 날의 거리는 생각보다 조용하다.' },
      { narr: '편의점 앞 전봇대에 종이가 한 장 붙어 있다. 그 옆 전봇대에도. 그 옆에도. 같은 종이가 골목 끝까지 줄지어 있다.' },
      { narr: '검은 바탕에 흰 글씨. 한가운데 갈라진 원이 그려져 있다.' },
      { sys: '「균열은 저주가 아니다. 구원이다.\n신의 문이 열리는 날, 각성하지 못한 자들도 빛을 받으리라.\n— 균열교. 매주 목요일 무료 급식, 강북 폐구 옛 성혼예식장 지하」' },
      { narr: '출근하던 사람 몇이 전단 앞에서 걸음을 늦춘다. 아무도 떼어 내지 않는다.' },
    ], choices: [
      { text: '전단을 한 장 떼어 읽어 본다', set: { c1_leaflet: 'read' }, say: [{ narr: '종이가 두껍다. 인쇄도 깨끗하다. 돈을 들인 전단이다. 뒷면에는 손글씨처럼 흘려 쓴 문장 하나. "당신의 가족은 왜 각성하지 못했습니까?"' }] },
      { text: '지나친다', set: { c1_leaflet: 'pass' }, say: [{ narr: '사이비는 게이트만큼 흔하다. 대붕괴 뒤로 이십 년, 매년 새 이름이 생겼다가 사라졌다.' }] },
    ] },
    { id: 'c1_leader', lines: [
      { who: 'leader', text: { haera: '봤냐, 그 전단. 동네가 도배가 됐더라.', haeyo: '그 전단 봤어요? 동네가 도배가 됐더라고요.', short: '전단. 봤나.' }, alt: { who: 'friend', text: '야, 너네 동네도 그 전단 붙었어? 여기 버스 정류장까지 다 붙었어.' } },
      { who: 'leader', text: { haera: '요즘 저런 데가 또 늘었다. 게이트 하나 터질 때마다 신도가 두 배로 는다는 말도 있고.', haeyo: '요즘 저런 데가 또 늘었어요. 게이트 하나 터질 때마다 신도가 두 배로 는대요.', short: '저런 데가 또 늘었다. 게이트 터질 때마다 는다.' }, when: HAS_LEADER },
      { who: 'leader', text: { haera: '헌터는 엮이지 않는 게 좋다. 저 사람들이 원하는 게 결국 우리거든. 각성자가 신도로 하나 들어가면 그다음은 백 명이 따라 들어간다.', haeyo: '헌터는 엮이지 않는 게 좋아요. 저 사람들이 원하는 게 결국 우리거든요. 각성자 하나가 들어가면 백 명이 따라 들어가요.', short: '엮이지 마라. 저들이 원하는 건 우리다.' }, when: HAS_LEADER },
    ], choices: [
      { text: '"각성 못 한 사람들한테는 저게 희망일 수도 있잖아요."', when: HAS_LEADER, set: { c1_view: 'sympathy' }, rel: { leader: 2 }, relWhy: '속마음을 말해 주었다',
        say: [{ who: 'leader', text: { haera: '…희망이라. 그 희망 팔아서 돈 버는 놈이 있다는 게 문제지. 그래도 네 말이 틀린 건 아니다. 기억해 둬, 그 마음.', haeyo: '…희망이라. 그 희망 팔아서 돈 버는 사람이 있다는 게 문제죠. 그래도 틀린 말은 아니에요. 그 마음, 기억해 둬요.', short: '…희망. 그걸 파는 놈이 문제다. 그 마음은 기억해 둬.' } }] },
      { text: '"알겠습니다. 안 엮일게요."', when: HAS_LEADER, set: { c1_view: 'obey' }, rel: { leader: 1 }, relWhy: '말을 따라 주었다',
        say: [{ who: 'leader', text: { haera: '그래. 우린 게이트만 닫으면 된다. 나머진 관리국 일이다.', haeyo: '네, 우린 게이트만 닫으면 돼요. 나머진 관리국 일이에요.', short: '그래. 우린 게이트만.' } }] },
      { text: '"누가 뒤에 있는지 궁금하긴 하네요."', when: HAS_LEADER, set: { c1_view: 'curious' }, rel: { leader: -1 }, relWhy: '경고를 흘려들었다',
        say: [{ who: 'leader', text: { haera: '궁금해하지 마라. 그런 궁금증이 헌터를 제일 많이 죽인다. …농담 아니다.', haeyo: '궁금해하지 마요. 그런 궁금증이 헌터를 제일 많이 죽여요. …농담 아니에요.', short: '궁금해하지 마라. 그게 헌터를 죽인다.' } }] },
      { text: '친구에게 "그러게, 별 데가 다 있다"고 답한다', when: (g) => !HAS_LEADER(g), set: { c1_view: 'pass' } },
    ] },
    { id: 'c1_kid', lines: [
      { narr: '점심 무렵. 협회 지부로 가는 길에, 전봇대 앞에 아이 하나가 서 있다. 열 살쯤. 소매가 해진 점퍼.' },
      { narr: '아이는 전단을 떼어 조심스럽게 접는다. 보물이라도 되는 것처럼 주머니에 넣는다. 그러다 당신의 헌터 배지를 본다.' },
      { who: KID1, text: '…{hyung}, 헌터야?' },
      { who: { name: '아이', sub: '강북 폐구' }, text: '우리 엄마가 그러는데, 헌터는 신이 된 사람들이래. 문에서 빛을 받아서. 우리 같은 사람은 못 받고.' },
      { who: { name: '아이', sub: '강북 폐구' }, text: '근데 이 아저씨들이 그러는데, 문이 다시 열리면 우리도 받을 수 있대. 진짜야?' },
    ], choices: [
      { text: '"신 같은 거 아니야. 운이 좋았던 것뿐이야."', set: { c1_kid: 'luck' },
        say: [{ who: { name: '아이', sub: '강북 폐구' }, text: '운? …그럼 나는 운이 나쁜 거네.' }, { narr: '아이는 웃지도 울지도 않는다. 그 말이 당신 귀에 오래 남는다.' }] },
      { text: '"그런 말은 믿지 마. 문은 사람을 죽여."', set: { c1_kid: 'warn' },
        say: [{ who: { name: '아이', sub: '강북 폐구' }, text: '알아. 아빠도 문 때문에 죽었어. …근데 {hyung}은 안 죽었잖아.' }, { narr: '아이가 뛰어간다. 주머니 속 전단은 그대로다.' }] },
      { text: '대답 대신 편의점에서 빵을 사 준다', set: { c1_kid: 'bread' }, gain: { money: -2 },
        say: [{ narr: '아이는 빵을 받아 들고 한참 쳐다본다. "목요일엔 저기 가면 밥 줘. 공짜로." 그 말만 남기고 간다.' }] },
    ], pause: '오늘은 여기까지. 다음 날 이야기가 이어진다.' },
    { id: 'c1_friend', lines: [
      { narr: '다음 날 저녁. 휴대폰이 울린다. 화면에 뜬 이름은 {friend}.' },
      { who: 'friend', text: '너 그 전단 봤어? 균열교인가 뭔가. 우리 회사 앞에도 붙었더라.', when: (g) => !FRIEND_AWAKE(g) },
      { who: 'friend', text: '웃기지. 문이 열리면 다 각성한대. …근데 있잖아, 좀 솔깃하더라. 나 같은 사람한테는.', when: (g) => !FRIEND_AWAKE(g) },
      { who: 'friend', text: '그 전단 봤어? 균열교. 우리 같은 각성자 보고 "먼저 빛을 받은 형제"라고 부르더라. 소름 돋아서.', when: FRIEND_AWAKE },
      { who: 'friend', text: '근데 우리 동네 비각성자 아줌마들은 진지하게 읽더라. 목요일에 밥 준다고.', when: FRIEND_AWAKE },
    ], choices: [
      { text: '전화를 건다', next: 'c1_call', set: { c1_friend: 'call' } },
      { text: '"그런 데 가지 마"라고 짧게 답한다', next: 'c1_news', set: { c1_friend: 'short' },
        say: [{ who: 'friend', text: '안 가. 내가 무슨. …너 요즘 바쁘지? 언제 밥 한번 먹자.' }] },
    ] },
    { id: 'c1_call', lines: [
      { narr: '신호음이 두 번 가기 전에 {friend}이(가) 받는다. 뒤에서 지하철 소리가 난다.' },
      { who: 'friend', text: '오, 웬일이야. 헌터님이 먼저 전화를 다 하고.' },
      { who: 'friend', text: '나? 똑같지. 계약 또 석 달 연장. 지난주에 경보 울렸을 때 대피소 갔는데, 각성자 가족부터 들여보내더라. 우린 계단에서 기다렸어.', when: (g) => !FRIEND_AWAKE(g) },
      { who: 'friend', text: '그때 생각했어. 아, 이 세상은 원래 이렇구나. 문 열린 날부터 줄이 두 개로 나뉜 거구나.', when: (g) => !FRIEND_AWAKE(g) },
      { who: 'friend', text: '나도 등록은 했는데 일이 없어. E급 아래는 길드에서 쳐다도 안 보더라. 너는 시험 때 잘했다며?', when: FRIEND_AWAKE },
      { who: 'friend', text: '…가끔 그런 생각 해. 우리가 각성한 게 진짜 운이었을까. 그날 너랑 나만.', when: FRIEND_AWAKE },
    ], choices: [
      { text: '"대피소 일은 내가 협회에 따져 볼게."', when: (g) => !FRIEND_AWAKE(g), set: { c1_call: 'promise' }, run: (g) => { const f = g.mainWho('friend'); if (f) g.changeRel(f, 4, '대피소 일을 들어 주었다'); },
        say: [{ who: 'friend', text: '…됐어, 바뀌겠냐. 근데 고맙다. 그 말 해 준 사람 네가 처음이야.' }] },
      { text: '"우리가 각성한 게 운이었는지, 나도 모르겠어."', set: { c1_call: 'doubt' }, run: (g) => { const f = g.mainWho('friend'); if (f) g.changeRel(f, 2, '속마음을 나눴다'); },
        say: [{ who: 'friend', text: '그치. 모르겠지. …에이, 이런 얘기 하려고 전화한 거 아니지? 다음 주에 국밥 먹자. 네가 사.' }] },
      { text: '그냥 웃으며 안부를 묻는다', set: { c1_call: 'light' },
        say: [{ who: 'friend', text: '아 몰라, 괜히 우울해졌네. 다음에 밥이나 먹자. 진짜로.' }] },
    ] },
    { id: 'c1_news', lines: [
      { narr: '밤 아홉 시 뉴스. 앵커 뒤 화면에 그 갈라진 원이 떠 있다.' },
      { sys: '「신흥 종교 ‘균열교’ 급속 확산… 관리국 "사회 불안 조장 단체로 관찰 중"」' },
      { narr: '화면이 바뀐다. 회색 정장의 남자가 기자회견장에 선다. 국가 각성자 관리국 국장, 마도현.' },
      { who: 'madohyun', text: '게이트는 자연재해입니다. 이십 년 전에도, 지금도. 누군가 열고 닫는 문이 아닙니다.' },
      { who: 'madohyun', text: '관리국은 각성자와 비각성자를 가리지 않고 국민 모두를 지킵니다. 근거 없는 교리에 현혹되지 마십시오.' },
      { narr: '기자 하나가 손을 든다. "대피소에서 각성자 가족을 먼저 들인다는 제보가 있습니다—" 화면이 다음 뉴스로 넘어간다.' },
    ] },
    { id: 'c1_night', lines: [
      { narr: '자정이 넘었다. 창밖으로 먼 곳에서 게이트 경보가 한 번 울렸다가 그친다.' },
      { narr: '책상 위에 낮에 떼어 온 전단이 놓여 있다. 갈라진 원. "당신의 가족은 왜 각성하지 못했습니까?"', when: (g, M) => M.flags.c1_leaflet === 'read' },
      { narr: '눈을 감으면 낮에 본 전단이 떠오른다. 골목 끝까지 줄지어 붙어 있던, 같은 얼굴의 종이들.', when: (g, M) => M.flags.c1_leaflet !== 'read' },
      { narr: '이상하다. 처음 각성하던 날처럼 손끝이 조금 저릿하다.' },
    ], choices: [
      { text: '전단의 주소를 메모해 둔다', set: { c1_addr: true }, say: [{ narr: '강북 폐구, 옛 성혼예식장 지하. 목요일. 메모장 맨 아래에 적고 휴대폰을 엎어 둔다.' }], next: 'end' },
      { text: '잊고 잔다', set: { c1_addr: false }, say: [{ narr: '사이비는 관리국 일이다. 내 일은 게이트다. 그렇게 생각하며 잠든다. 꿈은 꾸지 않는다. 아직은.' }], next: 'end' },
    ] },
  ],
  done: (g, M) => { const f = g.mainWho('friend'); if (f) f.met = true; if (M.flags.c1_kid === 'bread') g.lifeEvent('균열교 전단을 줍던 아이에게 빵을 사 주었다.'); },
});

// ---------- 2장 비각성자의 거리 ----------
const KID = { name: '도윤', sub: '경계선 마을' };
const YEONHEE = { name: '서연희', sub: '균열교 급식소 봉사자' };
const DRIFTER = { name: '떠돌이 헌터', sub: '등록 말소' };
// 리더 반응(역할 대칭): 1장에서 내가 한 말과 리더 성격으로 정해진다. 'with' 동행 · 'stop' 말림 · 'let' 묵인
const LEAD_STANCE = (g, M) => {
  if (M.flags.leadStance) return M.flags.leadStance;
  const L = g.mainWho('leader'); const v = M.flags.c1_view;
  return v === 'sympathy' || (L && L.personality === 'kind' && v !== 'curious') ? 'with' : v === 'obey' || (L && L.personality === 'cold') ? 'stop' : 'let';
};
MAIN.ch(2, {
  part: 1, title: '비각성자의 거리', rank: 0, after: 1, when: (g) => g.player.rankIdx >= 1 || g.player.stage >= 2, where: 'gangbuk',
  goal: '강북 폐구의 경계선 마을에 간다',
  scenes: [
    { id: 'c2_lead', skip: (g) => !IN_CREW(g), lines: [
      { narr: '강북으로 가겠다고 하자 {leader}이(가) 지도에서 눈을 뗀다.' },
      { who: 'leader', text: (g, M) => ({ with: '경계선 마을? …혼자 보내긴 그렇다. 나도 간다. 대신 일 생기면 내 말 들어.', stop: '거긴 우리 일정에 없다. 가지 마라. 가면 내가 책임 못 진다.', let: '네 개인 시간이다. 말리진 않는다. 대신 팀 이름은 걸고 다니지 마.' })[LEAD_STANCE(g, M)] },
    ], choices: [
      { text: '같이 가자고 한다', when: (g, M) => LEAD_STANCE(g, M) === 'with', set: { leadStance: 'with', c2_leaderWith: true }, rel: { leader: 2 }, relWhy: '경계선 마을에 함께 갔다' },
      { text: '"그래도 가 볼게요."', when: (g, M) => LEAD_STANCE(g, M) === 'stop', set: { leadStance: 'stop', c2_defied: true }, rel: { leader: -2 }, relWhy: '말렸는데 갔다',
        say: [{ who: 'leader', text: { haera: '…고집은. 다치면 연락해라. 그 정도는 해 준다.', haeyo: '…고집도. 다치면 연락해요. 그 정도는 해 줄게요.', short: '…다치면 연락해.' } }] },
      { text: '"알아서 할게요."', when: (g, M) => LEAD_STANCE(g, M) === 'let', set: { leadStance: 'let' } },
    ] },
    { id: 'c2_edge', lines: [
      { narr: '강북 폐구. 게이트 경계선을 알리는 노란 철책이 동네 한가운데를 가른다. 철책 안쪽은 헌터의 땅, 바깥쪽은 아직 사람이 사는 땅이다.' },
      { narr: '바깥쪽이라고 안전한 건 아니다. 이십 년 전 버려진 아파트 단지 사이로 판자와 방수포로 이은 집들이 들어차 있다. 관리국 지도에는 "비거주 구역"이라고 적혀 있는 곳.' },
      { who: 'leader', when: (g, M) => !!M.flags.c2_leaderWith || !IN_CREW(g), text: { haera: '여기까지 와 본 적 있냐. …나는 신입 때 한 번 와 보고 다시는 안 왔다. 볼 때마다 뭔가를 빚진 기분이라서.', haeyo: '여기까지 와 본 적 있어요? …저는 신입 때 한 번 와 보고 다시는 안 왔어요. 볼 때마다 뭔가 빚진 기분이라서.', short: '여긴 신입 때 한 번 왔다. 다시는 안 왔다. 빚진 기분이라.' }, alt: '경계선 마을은 처음이다. 철책 너머로 게이트 경보탑이 보인다. 여기 사람들은 저 탑이 울릴 때마다 어디로 도망칠까.' },
    ] },
    { id: 'c2_walk', lines: [
      { narr: '철책을 따라 이십 분. 아스팔트가 끊기고 흙길이 시작된다. 길가에 찌그러진 경보 스피커가 기울어 서 있다. 전선은 끊겨 있다.' },
      { narr: '빨랫줄에 걸린 아이 옷이 바람에 흔들린다. 그 옆에 낯익은 갈라진 원이 그려진 천막이 서 있다. 줄이 길다.' },
      { narr: '누군가 소매를 잡아당긴다.', when: (g, M) => !!M.flags.c1_kid },
      { who: KID, text: '{hyung}! 나 기억해? 전봇대 앞에서.', when: (g, M) => !!M.flags.c1_kid },
      { who: KID, text: (g, M) => (M.flags.c1_kid === 'bread' ? '나 도윤이야. 그때 빵 진짜 맛있었어. 동생이랑 반 나눠 먹었어.' : M.flags.c1_kid === 'warn' ? '나 도윤이야. …문은 사람을 죽인다며. 그럼 여긴 왜 왔어?' : '나 도윤이야. 운 나쁜 애. 기억나?'), when: (g, M) => !!M.flags.c1_kid },
    ] },
    { id: 'c2_line', lines: [
      { narr: '천막 앞의 줄은 대부분 노인과 아이다. 손에 든 건 냄비, 반찬통, 찌그러진 도시락통.' },
      { narr: '배식대 뒤에서 흰 앞치마를 두른 여자가 국을 퍼 준다. 삼십 대 중반. 손등에 오래된 화상 자국이 있다.' },
      { who: YEONHEE, text: '천천히 와요, 넉넉하니까. 할머니, 지난주에 약 받으셨어요? 아직이면 이따 저랑 같이 가요.' },
      { narr: '도윤이 냄비를 두 손으로 꼭 쥐고 줄 맨 앞에 선다.', when: (g, M) => !!M.flags.c1_kid },
      { who: YEONHEE, text: '헌터분이세요? …여긴 각성자분들이 잘 안 오시는데. 드시고 가실래요? 사양 마세요, 교리 같은 거 안 물어봐요.' },
    ], choices: [
      { text: '국 한 그릇을 받는다', set: { c2_eat: true }, say: [{ narr: '멀건 된장국에 두부 몇 조각. 그래도 따뜻하다. 옆에 앉은 노인이 숟가락을 멈추고 당신을 물끄러미 본다.' }] },
      { text: '"괜찮아요. 일하러 왔어요."', set: { c2_eat: false }, say: [{ who: YEONHEE, text: '그렇죠, 바쁘시겠죠. 그래도 물 한 잔은 드세요.' }] },
      { text: '배식을 돕는다', set: { c2_eat: 'help' }, run: (g) => g.addRep && g.addRep('gangbuk', 2), say: [{ narr: '국자를 받아 든다. 연희가 놀란 눈으로 보다가 웃는다. "손이 빠르시네요. 헌터라 그런가." 줄이 조금 빨리 줄어든다.' }] },
    ] },
    { id: 'c2_talk', lines: [
      { narr: '배식이 끝나 갈 무렵, 연희가 플라스틱 의자 두 개를 들고 온다.' },
      { who: YEONHEE, text: '저 간호사였어요. 대붕괴 나던 해에 신입이었죠. 그날 응급실에 들어온 사람 반이 각성하고, 반은 죽었어요.' },
      { who: YEONHEE, text: '각성한 사람들은 협회가 데려갔어요. 죽은 사람들은… 우리가 묻었고요. 저는 둘 다 아니었어요. 그냥 남았죠.' },
      { who: YEONHEE, text: '교주님이 그러셨어요. 남은 사람도 사람이라고. 저는 그 말 한마디에 여기 왔어요. 교리는 솔직히 잘 몰라요.' },
    ], choices: [
      { text: '"교주라는 사람은 어떤 사람이에요?"', set: { c2_ask: 'leader' }, say: [
        { who: YEONHEE, text: '저도 직접 뵌 건 몇 번 없어요. 늘 가면을 쓰고 계시고. 이름도 없대요. 그래서 다들 무명님이라고 불러요.' },
        { who: YEONHEE, text: '목소리가… 이상하게 슬퍼요. 문 얘기를 할 때마다요. 꼭 그 문을 직접 본 사람처럼.' },
      ] },
      { text: '"문이 열리면 모두 각성한다는 걸 믿어요?"', set: { c2_ask: 'doctrine' }, say: [
        { who: YEONHEE, text: '…믿고 싶은 거겠죠. 저 아이들한테 "너흰 평생 철책 밖에서 살 거야"라고는 못 하잖아요.' },
        { who: YEONHEE, text: '헌터님은요? 각성하던 날, 운이 좋았다고 생각하세요?' },
      ] },
      { text: '"여기 경보 울리면 어디로 피해요?"', set: { c2_ask: 'shelter' }, say: [
        { who: YEONHEE, text: '피할 데가 없어요. 대피소는 철책 안쪽에만 있거든요. 그래서 다들 지하 주차장에 숨어요. 작년에 한 번 무너졌고요.' },
        { narr: '연희는 담담하게 말한다. 담담해서 더 무겁다.' },
      ] },
    ], pause: { days: 7, label: '목요일', text: '다음 목요일, 급식소가 다시 문을 연다.' } },
    { id: 'c2_raid', lines: [
      { narr: '일주일 뒤 목요일. 다시 경계선 마을. 줄은 지난주보다 길다.' },
      { narr: '천막 밖에서 오토바이 엔진 소리가 겹쳐 울린다. 셋. 아니, 넷.' },
      { narr: '헬멧도 안 쓴 남자들이 천막 앞에 오토바이를 세운다. 등에 단 무기가 협회 정식 장비가 아니다. 등록 말소된 각성자들, 이른바 "떠돌이"다.' },
      { who: DRIFTER, text: '어이, 사이비들. 여기 코어 모은다며? 신께 바친다고. 그거 우리가 대신 받아 줄게.' },
      { who: YEONHEE, text: '여긴 밥 주는 데예요. 코어 같은 거 없어요.' },
      { who: DRIFTER, text: '없으면 만들어 와야지. 다음 주까지. 아니면 이 천막 태운다.' },
      { narr: '남자가 배식대를 걷어찬다. 국통이 엎어진다. 줄 끝의 아이가 냄비를 떨어뜨린다.' },
    ], choices: [
      { text: '막아선다', set: { c2_fight: true }, next: 'c2_after',
        fight: (g) => ({ title: '떠돌이 헌터 무리', mobs: { tier: Math.max(0, g.player.rankIdx), n: 3, human: true }, win: { text: '떠돌이들이 오토바이를 버려 두고 달아났다. 천막 안이 조용해진다.', gain: { fame: 4, rep: 4 } }, lose: { text: '쓰러졌다. 떠돌이들은 웃으며 천막의 물건을 쓸어 갔다.', gain: { injure: 1 } } }) },
      { text: '협회에 신고만 하고 지켜본다', set: { c2_fight: false }, gain: { merit: 2 }, next: 'c2_after', say: [
        { narr: '협회 신고 접수 번호가 문자로 온다. 출동 예정 시각: "확인 중". 떠돌이들은 천막의 쌀자루 두 개를 싣고 떠난다.' },
        { narr: '연희는 아무 말 없이 엎어진 국통을 세운다.' },
      ] },
    ] },
    { id: 'c2_after', lines: [
      { who: YEONHEE, text: (g, M) => (M.flags.fight_c2_raid === 'win' ? '…각성자분이 우릴 지켜 준 건 처음이에요. 정말로요.' : M.flags.c2_fight ? '다치셨잖아요. 이리 와요, 소독이라도 해 드릴게요. …그래도 막아 줘서 고마워요.' : '괜찮아요. 늘 있는 일이에요. 협회는 경계선 밖엔 잘 안 와요. 알아요.') },
      { who: KID, text: (g, M) => (M.flags.fight_c2_raid === 'win' ? '{hyung} 진짜 세다! 신 맞잖아!' : '…헌터도 다 똑같네.'), when: (g, M) => !!M.flags.c1_kid },
      { narr: '연희가 앞치마 주머니에서 접힌 종이를 꺼낸다. 전단과 같은 갈라진 원. 이번엔 손으로 쓴 초대장이다.' },
      { who: YEONHEE, text: '다음 주 목요일 밤에 집회가 있어요. 교주님이 직접 오신대요. 오시라는 건 아니에요. 그냥… 여기 사람들이 뭘 믿는지 한 번은 봐 주셨으면 해서요.' },
    ], choices: [
      { text: '초대장을 받는다', set: { c2_invite: true }, run: (g) => g.addRep && g.addRep('gangbuk', 1), say: [{ narr: '초대장 뒷면에 연희의 글씨. "남은 사람도 사람입니다." 주머니에 넣는다.' }] },
      { text: '"저는 안 갈 거예요."', set: { c2_invite: false }, say: [{ who: YEONHEE, text: '네, 그게 맞을지도 몰라요. 오늘 와 줘서 고마웠어요.' }, { narr: '돌아서는 등 뒤로, 아이들이 엎어진 국을 손으로 쓸어 담는 소리가 들린다.' }] },
    ] },
    { id: 'c2_night', lines: [
      { narr: '그날 밤. 숙소로 돌아오는 버스 안. 창에 비친 얼굴에 국물 자국이 묻어 있다.' },
      { who: 'leader', when: (g, M) => !!M.flags.c2_leaderWith, text: (g, M) => (M.flags.fight_c2_raid === 'win' ? '떠돌이 넷을 상대로 그 정도면 됐다. …근데 다음엔 혼자 먼저 뛰어들지 마.' : '신고만 했다고 뭐라 할 생각 없다. 그게 규정이니까. …규정이 저 동네를 지켜 준 적은 없지만.') },
      { who: 'leader', when: (g, M) => !M.flags.c2_leaderWith && HAS_LEADER(g), text: (g, M) => (M.flags.c2_fight ? '협회 기록 봤다. 경계선 밖에서 떠돌이랑 붙었다며. …다친 데는 없냐.' : '경계선 마을 갔었다며. 무슨 일 있었냐.') },
      { who: 'friend', when: (g) => !HAS_LEADER(g), text: '오늘 강북 갔다며? 뉴스에 떠돌이 얘기 나오던데. 너 괜찮아?' },
    ], choices: [
      { text: '있었던 일을 그대로 말한다', rel: { leader: 1, friend: 1 }, relWhy: '경계선 마을 일을 털어놓았다', set: { c2_told: true }, next: 'end' },
      { text: '"별일 없었어요."', set: { c2_told: false }, next: 'end', say: [{ narr: '휴대폰을 엎어 둔다. 주머니 속에서 초대장인지 영수증인지 모를 종이가 바스락거린다.' }] },
    ] },
  ],
  done: (g, M) => {
    if (M.flags.fight_c2_raid === 'win') g.rumor('강북 경계선 마을 급식소에서 떠돌이 넷을 쫓아낸 신입 헌터가 있다는 말이 돈다.');
    else if (M.flags.c2_fight === false) g.rumor('떠돌이들이 강북 경계선 마을 급식소의 쌀을 털어 갔다. 협회 출동은 없었다.');
    if (M.flags.c1_kid) g.lifeEvent('경계선 마을의 아이 도윤과 다시 만났다.');
    M.flags.yeonhee = 'met';
  },
  expire: { months: 8, run: (g, M) => {
    Object.assign(M.flags, { c2_missed: true, foodHall: 'burned', yeonhee: 'missing' });
    g.rumor('강북 경계선 마을의 균열교 급식소가 불탔다. 봉사자 하나가 그날 이후 보이지 않는다고 한다.');
    return '강북 경계선 마을의 균열교 급식소가 떠돌이들에게 불탔다는 소식이 들린다.';
  } },
});

// ---------- 3장 가면 ----------
MAIN.ch(3, {
  part: 1, title: '가면', rank: 1, after: 1, where: 'gangbuk',
  goal: '강북 폐구, 옛 성혼예식장 지하의 집회',
  scenes: [
    { id: 'c3_lead', skip: (g) => !IN_CREW(g), lines: [
      { narr: '목요일 오후. {leader}에게서 문자가 온다.' },
      { who: 'leader', text: (g, M) => (M.flags.c2_defied ? '오늘 밤 강북 집회 간다는 거 다 들었다. 지난번에도 말렸지. 이번엔 진짜 가지 마라.' : M.flags.c2_leaderWith ? '오늘 밤 집회, 가 볼 생각이지? 혼자 들어가진 마라. 입구까지는 같이 가 준다.' : '오늘 강북 집회 있다더라. 너 거기 가면 우리 팀 이름 꺼내지 마.') },
    ], choices: [
      { text: '"입구까지만 같이 가 줘요."', when: (g, M) => !!M.flags.c2_leaderWith, set: { c3_leaderDoor: true }, rel: { leader: 1 }, relWhy: '집회 입구까지 함께 갔다' },
      { text: '"갈게요. 제가 책임질게요."', when: (g, M) => !M.flags.c2_leaderWith, set: { c3_defied: true }, rel: { leader: (g, M) => (M.flags.c2_defied ? -3 : -1) }, relWhy: '말렸는데 집회에 갔다' },
      { text: '"오늘은 안 갈게요." (다음 목요일로 미룬다)', set: { c3_delay: true }, rel: { leader: 2 }, relWhy: '말을 들어 주었다', next: 'c3_wait' },
    ] },
    { id: 'c3_wait', skip: (g, M) => !M.flags.c3_delay, lines: [
      { narr: '그날 밤은 숙소에 있는다. 강북 쪽 하늘이 촛불 빛으로 희미하게 붉다. 다음 목요일에도 집회가 있다고 한다.' },
    ], pause: { days: 7, label: '목요일', text: '다음 목요일, 집회가 다시 열린다.' } },
    { id: 'c3_friend', lines: [
      { narr: '강북으로 가는 지하철. 휴대폰이 짧게 운다. {friend}다.' },
      { who: 'friend', when: (g) => !FRIEND_AWAKE(g), text: (g, M) => (M.flags.c1_call === 'promise' ? '대피소 얘기, 진짜 협회에 말했어? 우리 회사 사람들이 너 얘기 하더라. …고마워. 근데 회사 언니 하나가 오늘 강북 집회 간대. 좀 무섭다.' : '오늘 회사 언니가 강북 무슨 집회 간대. 균열교 거. 같이 가자는데 안 간다 했어. …안 간다 했다고.') },
      { who: 'friend', when: FRIEND_AWAKE, text: '오늘 강북에서 균열교 집회 한대. 각성자는 "형제"라고 맨 앞자리 준다더라. 너 혹시 가 보려는 거 아니지?' },
    ] },
    { id: 'c3_door', lines: [
      { narr: '목요일 밤 열한 시. 옛 성혼예식장. 간판의 "성혼" 두 글자만 남아 녹슨 채 매달려 있다.' },
      { narr: '{leader}이(가) 계단 앞에서 걸음을 멈춘다. "여기까지다. 나오면 바로 연락해."', when: (g, M) => !!M.flags.c3_leaderDoor },
      { narr: '지하로 내려가는 계단에 촛불이 한 칸씩 놓여 있다. 내려갈수록 사람 냄새가 짙어진다. 땀, 싸구려 향, 젖은 콘크리트.' },
      { narr: (g, M) => (M.flags.c2_invite ? '입구의 신도가 초대장을 보고 고개를 숙인다. "서연희 자매님 손님이시군요."' : '입구의 신도가 당신의 배지를 보고 잠시 망설인다. 그러다 길을 비킨다. "형제님도 빛을 받은 분이시군요. 환영합니다."') },
    ] },
    { id: 'c3_hall', lines: [
      { narr: '예식장 홀. 의자는 다 치워졌고 바닥에 사람들이 앉아 있다. 이백 명은 넘는다. 대부분 경계선 마을의 얼굴들. 작업복, 간호복, 교복.' },
      { narr: '단상에는 결혼식 아치가 그대로 남아 있다. 시든 조화 사이로 갈라진 원이 걸려 있다.' },
      { narr: (g, M) => (M.flags.yeonhee === 'missing' ? '연희를 찾아 홀을 둘러본다. 없다. 옆자리 신도가 고개를 젓는다. "급식소 불난 뒤로 아무도 못 봤어요."' : M.flags.fight_c2_raid === 'win' ? '앞줄 근처의 연희가 당신을 보고 작게 손을 흔든다. 주변 신도 몇이 당신을 돌아본다. "그 헌터래." 수군거림이 따뜻하다.' : M.flags.c2_fight === false ? '앞줄 근처에 연희가 있다. 눈이 마주치자 연희가 고개를 살짝 숙인다. 그뿐이다.' : '앞줄 근처에 흰 앞치마 대신 흰 로브를 입은 연희가 있다.') },
      { narr: '그리고 객석 맨 뒤, 기둥에 등을 기댄 익숙한 얼굴.' },
      { who: 'rival', text: { haera: '…너도 왔냐. 나만 미친 줄 알았는데.', haeyo: '…어, 너도 왔어요? 나만 이상한 줄 알았는데.', short: '…너도냐.' }, alt: '객석 맨 뒤, 헌터 배지를 단 사람이 몇 더 있다. 다들 서로를 못 본 척한다.' },
      { who: 'rival', text: { haera: '나도 그냥 궁금해서. 시험장에서 들었거든. 균열교가 협회 정보를 너무 잘 안다고. 누가 안에서 흘리는 게 아니면 말이 안 된다고.', haeyo: '저도 그냥 궁금해서요. 시험장에서 들었거든요. 균열교가 협회 정보를 너무 잘 안대요. 누가 안에서 흘리는 거 아니면 말이 안 된다고.', short: '궁금해서. 균열교가 협회 정보를 너무 잘 안다더라. 안에서 흘리는 놈이 있다.' } },
    ] },
    { id: 'c3_speech', lines: [
      { narr: '불이 꺼진다. 촛불만 남는다. 단상 위로 한 사람이 올라온다.' },
      { narr: '흰 가면. 아무 표정도 그려지지 않은 매끈한 가면. 검은 코트. 키가 크고 말랐다. 걸음에 군더더기가 없다.' },
      { who: 'mumyeong', text: '이십 년 전, 하늘이 갈라졌습니다.' },
      { who: 'mumyeong', text: '어떤 이들은 그날 빛을 받았습니다. 그들은 각성자가 되었고, 헌터가 되었고, 길드와 돔과 철책을 가졌습니다.' },
      { who: 'mumyeong', text: '어떤 이들은 받지 못했습니다. 여러분입니다. 여러분은 철책 밖에 남았고, 경보가 울리면 주차장으로 숨었고, 무너진 콘크리트 아래서 이름 없이 죽었습니다.' },
      { who: 'mumyeong', text: '나라는 말합니다. 문은 자연재해라고. 운이었다고. 그러니 받아들이라고.' },
      { narr: '가면이 객석을 천천히 훑는다. 당신이 서 있는 쪽에서 아주 잠깐 멈춘다.' },
      { who: 'mumyeong', text: '거짓말입니다. 문은 열린 것이 아닙니다. 누군가 열었습니다. 그리고 그 누군가는, 닫는 법도 다시 여는 법도 알고 있습니다.' },
      { who: 'mumyeong', text: '다음 보름. 우리는 스스로 문을 엽니다. 이번엔 여러분 차례입니다.' },
      { narr: '홀이 터질 듯한 함성으로 찬다. 옆자리의 노인이 울고 있다. 그 옆의 고등학생은 주먹을 쥐고 있다.' },
      { narr: '노인이 당신의 손을 붙잡는다. "나는 권만석이오. 이 아이는 손녀 하은이고. 이번엔 이 아이도 문을 볼 수 있을 거요."' },
    ] },
    { id: 'c3_choice', lines: [
      { who: 'rival', text: '들었냐. "누군가 열었다." …저거 그냥 선동이겠지? 아니면 뭘 아는 거야?', alt: '"누군가 열었다." 그 말이 귀에 박혀 떨어지지 않는다.' },
      { narr: '집회가 끝나고 신도들이 흩어진다. 단상 옆 문으로 가면의 남자가 사라진다. 문 앞을 지키는 신도는 둘.' },
    ], choices: [
      { text: '신도인 척 남아 안쪽 사정을 알아본다 (잠입)', set: { cult: 'spy' }, run: (g) => { g.flags.story.cult = 'spy'; }, say: [
        { narr: '흰 로브를 받아 입는다. 권만석 노인이 손을 꼭 잡는다. "하은이도 이번엔 문을 보게 될 거야."' },
        { narr: '로브 안주머니에 쪽지가 하나 들어 있다. "보름 밤, 강북 폐역 3번 출구. 코어를 가진 형제는 앞줄로."' },
      ] },
      { text: '나가서 협회에 신고한다', set: { cult: 'report' }, run: (g) => { g.flags.story.cult = 'report'; }, gain: { merit: 6 }, say: [
        { narr: '협회 당직자는 하품을 참으며 받아 적는다. "증거가 부족해서요. 일단 감시 요원은 붙여 볼게요."' },
        { narr: '전화를 끊고 나니 문자 하나. 발신자 표시 없음. "신고하셨군요. 그래도 와 주셔서 고맙습니다. — 무"' },
      ] },
      { text: '그 말에서 귀를 뗄 수 없다 (끌린다)', set: { cult: 'join' }, run: (g) => { g.flags.story.cult = 'join'; g.lifeEvent('균열교 집회에서 무명의 말에 마음이 흔들렸다.'); }, say: [
        { narr: '틀린 말이 아니었다. 철책 밖의 국통, 계단에서 기다리던 {friend}, 운이 나쁜 거냐고 묻던 아이.' },
        { narr: '나가는 길에 신도가 쪽지를 쥐여 준다. "보름 밤. 빛을 받은 형제는 맨 앞줄에 섭니다."' },
      ] },
    ] },
    { id: 'c3_rival', skip: (g) => !HAS_RIVAL(g), lines: [
      { who: 'rival', text: (g, M) => (M.flags.cult === 'report' ? '신고했다고? 하, 협회가 뭘 하겠냐. …그래도 네가 맞을지도 모르지.' : M.flags.cult === 'join' ? '야, 너 표정이 이상하다. 저 사람 말에 넘어간 거 아니지?' : '로브까지 입었냐. 미쳤네. …뭐 알아내면 나한테도 말해 줘.') },
      { who: 'rival', text: { haera: '나는 따로 파 볼 거다. 관리국 쪽으로. 그 "누군가 열었다"는 말, 그냥 넘어가면 안 될 것 같아.', haeyo: '저는 따로 파 볼 거예요. 관리국 쪽으로요. "누군가 열었다"는 말, 그냥 넘어가면 안 될 것 같아요.', short: '나는 관리국 쪽을 판다. 그 말, 그냥 못 넘긴다.' } },
    ], choices: [
      { text: '"같이 파 보자. 알아낸 건 서로 나누고."', set: { rivalPact: true }, rel: { rival: 4 }, relWhy: '같이 진실을 쫓기로 했다', say: [{ who: 'rival', text: '…좋아. 대신 나 배신하면 끝이다.' }] },
      { text: '"조심해. 관리국은 뒤가 깨끗하지 않아."', set: { rivalPact: false }, rel: { rival: 1 }, relWhy: '걱정해 주었다', say: [{ who: 'rival', text: '너나 조심해. 로브 냄새 난다.' }] },
      { text: '"네 일이나 신경 써."', set: { rivalPact: 'cold' }, rel: { rival: -3 }, relWhy: '쌀쌀맞게 굴었다', say: [{ who: 'rival', text: '…그래. 그럼 각자 하자.' }, { narr: '동기가 먼저 계단을 올라간다. 한 번도 돌아보지 않는다.' }] },
    ] },
    { id: 'c3_leader', skip: (g) => !HAS_LEADER(g), lines: [
      { narr: '다음 날 아침. {leader}이(가) 협회 지부 앞에서 기다리고 있다.' },
      { who: 'leader', text: (g, M) => (M.flags.cult === 'report' ? '네가 신고 넣었다며. 협회에서 연락 왔다. …왜 신고했냐. 그 사람들, 대부분 경계선 마을 사람들이다.' : M.flags.cult === 'join' ? '어젯밤 집회에 있었다며. 앞줄로 오라는 쪽지까지 받았다는 말도 들었다. …왜 거기 서 있었냐.' : '로브 입고 신도들 사이에 섞였다며. …왜 그렇게까지 했냐. 들키면 어떻게 될지 알잖아.') },
    ], choices: [
      { text: '"더 많이 죽기 전에 누군가는 막아야 하니까요."', set: { c3_why: 'stop' }, rel: { leader: (g, M) => (M.flags.c1_view === 'obey' ? 2 : 1) }, relWhy: '이유를 설명했다',
        say: [{ who: 'leader', text: { haera: '…그래. 그 말은 믿는다. 대신 다음엔 나한테 먼저 말해.', haeyo: '…그래요. 그 말은 믿어요. 대신 다음엔 저한테 먼저 말해요.', short: '…믿는다. 다음엔 먼저 말해.' } }] },
      { text: '"그 사람들 말이 다 틀린 건 아니었어요."', set: { c3_why: 'heard' }, rel: { leader: (g, M) => (M.flags.c1_view === 'sympathy' ? 2 : -2) }, relWhy: '균열교 편을 들었다',
        say: [{ who: 'leader', text: (g, M) => (M.flags.c1_view === 'sympathy' ? '…알아. 나도 그 마음 안다. 그래서 더 걱정되는 거다.' : '그 말이 사람을 죽인다고 했지. …앞으로 지켜볼 거다.') }] },
      { text: '"제 일이에요."', set: { c3_why: 'mine' }, rel: { leader: -2 }, relWhy: '말을 끊었다',
        say: [{ who: 'leader', text: { haera: '…그래, 네 일이다. 근데 네가 죽으면 그건 내 일이 된다.', haeyo: '…그래요, 당신 일이죠. 근데 당신이 다치면 그건 제 일이 돼요.', short: '…네 일이다. 죽으면 내 일이 된다.' } }] },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (g.flags.chains) g.flags.chains.cult = Math.max(g.flags.chains.cult || 0, 2);
    if (M.flags.cult === 'report') g.rumor('협회에 균열교 보름 의식 첩보가 들어왔다는 말이 돈다. 담당자는 "증거 부족"이라고 했다.');
  },
  expire: { months: 10, run: (g, M) => {
    Object.assign(M.flags, { cult: 'none', cultSpread: true });
    g.rumor('균열교 집회가 강북을 넘어 수원·대전 경계선 마을로 번졌다.');
    return '균열교 집회가 강북을 넘어 다른 도시로 번졌다는 뉴스가 나온다.';
  } },
});

// ---------- 4장 보름 ----------
const KWON = { name: '권만석', sub: '경계선 마을 노인' };
const HAEUN = { name: '권하은', sub: '권만석의 손녀' };
const KAMA_AGENT = { name: '관리국 요원', sub: '사후 처리반' };
const RIFT_THING = { name: '틈 너머의 것', sub: '반쪽짜리 문' };
MAIN.ch(4, {
  part: 1, title: '보름', rank: 1, after: 1, where: 'gangbuk',
  goal: (g, M) => (M.flags.cult === 'report' ? '보름 밤, 협회 진압팀과 강북 폐역으로' : '보름 밤, 강북 폐역 3번 출구'),
  scenes: [
    { id: 'c4_wait', lines: [
      { narr: (g, M) => ({
        spy: '보름까지 열흘. 로브 안주머니의 쪽지를 몇 번이고 다시 읽는다. 신도 단체방에는 매일 같은 말이 올라온다. "코어를 모읍시다. 문은 크기만큼만 열립니다."',
        report: '보름까지 열흘. 협회 지부 회의실. 진압팀장이 화이트보드에 폐역 도면을 붙인다. "민간인 이백. 무기는 거의 없음. 문제는 코어다. 수십 개가 한꺼번에 공명하면 뭐가 나올지 아무도 모른다."',
        join: '보름까지 열흘. 모르는 번호로 문자가 온다. "빛을 받은 형제님. 보름 밤 앞줄에 자리를 비워 두겠습니다. 교주님이 직접 뵙고 싶어 하십니다."',
        none: '보름까지 열흘. 뉴스는 균열교가 다른 도시로 번졌다는 이야기뿐이다. 강북 폐역 근처에서 밤마다 촛불 행렬이 보인다는 제보가 헌터넷에 올라온다.',
      })[M.flags.cult || 'none'] || '보름까지 열흘.' },
      { who: 'friend', when: (g) => !FRIEND_AWAKE(g), text: '회사 언니가 보름날 강북 간대. 거기서 문을 열면 우리도 각성할 수 있다고. …너 그날 어디 있어?' },
    ], pause: { days: 10, label: '보름 밤', text: '보름 밤까지 열흘을 기다린다.' } },
    { id: 'c4_station', lines: [
      { narr: '보름. 강북 폐역. 대붕괴 날 마지막 열차가 멈춘 역이다. 선로 위에 열차가 그대로 녹슬어 있다.' },
      { narr: '3번 출구 계단을 내려가자 공기가 무겁다. 귀가 먹먹해진다. 에테르다. 그것도 아주 짙은.' },
      { narr: (g, M) => (M.flags.cult === 'report' ? '뒤에서 무전기 소리가 난다. 협회 진압팀 여섯 명. 팀장이 손짓한다. "헌터 분은 우리 뒤에서."' : M.flags.cult === 'join' ? '흰 로브의 신도들이 당신에게 길을 연다. "빛을 받은 형제님, 앞으로."' : M.flags.cult === 'spy' ? '흰 로브를 입은 채 신도들 틈에 섞인다. 아무도 당신을 의심하지 않는다.' : '촛불 행렬 끝에 붙어 계단을 내려간다. 배지를 가리려고 외투 깃을 세운다.') },
    ] },
    { id: 'c4_ring', lines: [
      { narr: '승강장 한가운데, 코어 수십 개가 원으로 놓여 있다. 크고 작은 코어들이 서로를 향해 희미하게 맥박친다. 원의 중심에서 공기가 일그러진다.' },
      { narr: '원을 둘러싸고 이백 명의 신도가 무릎 꿇고 있다. 맨 앞줄에 낯익은 얼굴. 집회의 노인 권만석과 손녀 하은.' },
      { narr: '단상 대신 녹슨 열차 지붕 위에 흰 가면이 서 있다.' },
      { who: 'mumyeong', text: '두려워하지 마십시오. 처음 문이 열리던 날도 모두가 두려워했습니다. 그리고 그 두려움을 견딘 사람만이 빛을 받았습니다.' },
      { narr: '코어 원이 빛난다. 일그러진 공기가 찢어진다. 손바닥만 한 틈. 그 너머에서 바람이 분다. 차갑고, 이 세상 냄새가 아닌 바람.' },
      { narr: '맨 앞줄의 노인이 기침을 한다. 피가 섞여 있다. 하은이 할아버지를 붙잡는다.' },
    ] },
    { id: 'c4_act', lines: [
      { narr: '틈이 커진다. 손바닥에서 문짝만 하게. 비각성 신도들이 하나둘 쓰러진다. 각성은 일어나지 않는다. 숨만 가빠진다.' },
      { narr: '틈 너머에서 무언가가 움직인다. 괴수의 그림자다. 아니, 그림자의 반쪽이다. 나머지 반은 아직 저편에 걸려 있다.' },
      { who: RIFT_THING, text: '…좁다. 좁아. 이건 문이 아니다. 상처다.' },
      { who: RIFT_THING, text: '누가 두드렸지. 너희가? …아니. 너희는 아직 못 연다. 반쪽짜리 손으로는.' },
      { narr: '열차 지붕 위의 가면이 처음으로 흔들린다. 무명도 저 목소리를 들은 것이다.' },
    ], choices: [
      { text: '코어 원을 부수고 의식을 막는다', when: (g, M) => M.flags.cult !== 'join' && M.flags.cult !== 'report', set: { c4: 'stop' }, next: 'c4_out_stop',
        fight: (g) => ({ title: '폐역의 반쪽 문', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, human: true, elem: 'dark' }, win: { text: '코어 원을 걷어찼다. 틈이 비명 같은 소리를 내며 닫힌다. 반쪽 그림자가 저편으로 끌려 들어간다.', gain: { fame: 12, merit: 12, core: [0, 4] } }, lose: { text: '사제들에게 밀려났다. 틈은 제 힘에 못 이겨 저절로 닫혔다. 쓰러진 신도가 여럿이다.', gain: { injure: 2 } } }) },
      { text: '진압팀과 함께 돌입한다', when: (g, M) => M.flags.cult === 'report', set: { c4: 'raid' }, next: 'c4_out_raid',
        fight: (g) => ({ title: '균열교 사제단', mobs: { tier: Math.max(0, g.player.rankIdx), n: 3, human: true, elem: 'dark' }, ally: { name: '협회 진압팀장', rank: Math.min(7, g.player.rankIdx + 2), elem: 'bolt' }, win: { text: '진압팀이 코어 원을 해체했다. 틈은 소리 없이 접혔다.', gain: { merit: 20, fame: 5 } }, lose: { text: '진압팀이 밀렸다. 사제들은 신도들을 데리고 선로 너머로 사라졌다.', gain: { injure: 1 } } }) },
      { text: '앞줄에 서서 빛을 받는다', when: (g, M) => M.flags.cult === 'join', set: { c4: 'join' }, next: 'c4_join', run: (g) => { g.flags.story.cultist = true; g.lifeEvent('균열교의 보름 의식에서 앞줄에 섰다.'); } },
      { text: '권만석 노인과 하은만 데리고 빠져나온다', set: { c4: 'save' }, next: 'c4_out_save', gain: { fame: 2 }, say: [
        { narr: '노인을 업는다. 하은의 손을 잡는다. 계단을 오르는 동안 등 뒤에서 무언가 찢어지는 소리가 난다.' },
        { narr: '출구에 닿았을 때 승강장 쪽에서 섬광이 터진다. 그리고 비명. 그리고 조용해진다.' },
      ] },
    ] },
    // ----- 출구 1: 막았다 -----
    { id: 'c4_out_stop', lines: [
      { narr: '틈이 닫힌 자리에 그을음만 남는다. 열차 지붕은 비어 있다. 가면은 처음부터 거기 없었던 것처럼 사라졌다.' },
      { narr: '쓰러졌던 신도들이 하나둘 일어난다. 아무도 고맙다고 하지 않는다.' },
      { who: { name: '신도', sub: '경계선 마을' }, text: '…당신이 뭔데. 이번엔 우리 차례였어. 우리 차례였다고.' },
      { narr: '누군가 바닥의 깨진 코어 조각을 당신 발치에 던진다. 하은이 할아버지 뒤에 숨어 당신을 본다. 무서운 사람을 보는 눈이다.' },
      { who: 'leader', when: (g, M) => HAS_LEADER(g), text: (g, M) => (M.flags.c3_why === 'stop' ? '…해냈구나. 근데 저 눈들 봐라. 막은 사람이 원망받는 게 이 일이다.' : '혼자 들어가서 그걸 다 깼다고? …왜 혼자 갔냐. 한 번만 더 이러면 팀에서 뺀다.') },
    ], choices: [
      { text: '신도들에게 "다음엔 다 죽어요"라고 말한다', set: { c4_stopSay: 'warn' }, run: (g, M) => { M.flags.cultGrudge = 2; }, rel: { leader: 1 }, relWhy: '의식을 막았다' },
      { text: '아무 말 없이 돌아선다', set: { c4_stopSay: 'silent' }, run: (g, M) => { M.flags.cultGrudge = 1; }, rel: { leader: 1 }, relWhy: '의식을 막았다' },
    ], next: 'c4_rival' },
    // ----- 출구 2: 진압 -----
    { id: 'c4_out_raid', lines: [
      { narr: '새벽 다섯 시. 폐역 앞에 검은 승합차 세 대가 선다. 협회 차가 아니다. 관리국 사후 처리반.' },
      { narr: '들것이 오가는 사이, 정장 차림의 요원이 서류철을 내민다.' },
      { who: KAMA_AGENT, text: '협조 감사합니다. 본 건은 노후 가스관 폭발 사고로 처리됩니다. 현장에서 보신 내용은 이 서약서에 따라 외부에 발설하지 않으셔야 합니다.' },
      { who: KAMA_AGENT, text: '공훈은 협회 기록에 정상 반영됩니다. 그리고, 앞으로 관리국이 몇 가지 여쭐 일이 있을 겁니다.' },
      { narr: '체포된 신도들 사이에 가면은 없다. 진압팀장이 담배를 꺼내다 만다. "또 놓쳤네. 매번 그래."' },
    ], choices: [
      { text: '서약서에 서명한다', set: { c4_sign: true, kamaWatch: 'signed' }, gain: { merit: 4 }, rel: { leader: (g, M) => (M.flags.c1_view === 'obey' ? 1 : -1) }, relWhy: '관리국 서약서에 서명했다', say: [{ narr: '펜이 무겁다. 이름을 쓰는 동안 승강장 쪽에서 마지막 들것이 올라온다. 하얀 천이 덮여 있다.' }] },
      { text: '서명을 거부한다', set: { c4_sign: false, kamaWatch: 'hostile' }, gain: { merit: -6 }, rel: { leader: (g, M) => (M.flags.c1_view === 'sympathy' ? 2 : -1) }, relWhy: '관리국 서명을 거부했다', say: [{ who: KAMA_AGENT, text: '…알겠습니다. 기록해 두죠.' }, { narr: '요원이 수첩에 무언가를 적는다. 당신 이름 옆에 작은 동그라미.' }] },
    ], next: 'c4_rival' },
    // ----- 출구 3: 참여 -----
    { id: 'c4_join', lines: [
      { narr: '맨 앞줄에 선다. 틈에서 쏟아지는 바람이 온몸을 관통한다. 뼈가 울린다. 에테르가 혈관을 거꾸로 돈다.' },
      { narr: '몇 걸음 뒤에서 비각성 신도들이 쓰러진다. 누군가는 일어나지 못한다.' },
      { who: 'mumyeong', text: '역시. 너는 견디는구나.' },
      { narr: '어느새 가면이 바로 옆에 서 있다. 가면 너머의 목소리는 집회 때보다 훨씬 낮고, 훨씬 지쳐 있다.' },
      { who: 'mumyeong', text: '오늘 문은 실패다. 작다. 너무 작다. 저 안의 것도 들었지? 반쪽짜리 손이라고.' },
      { who: 'mumyeong', text: '하지만 너를 찾았으니 헛되진 않았어. 너는 그날 제주의 바람을 맞은 아이들 중 하나다. 내가 다시 부를 거다.' },
      { narr: '가면이 당신 손에 무언가를 쥐여 준다. 갈라진 원이 새겨진 쇠 배지. 뒷면에 숫자 하나. 일곱.' },
    ], next: 'c4_out_join' },
    { id: 'c4_out_join', lines: [
      { narr: '새벽. 폐역 옆 공터에서 신도들이 쓰러진 사람들을 눕힌다. 사제 하나가 당신에게 고개를 숙인다. "형제님은 다치지 않으셨군요. 역시."' },
      { narr: '세 명은 일어나지 못했다. 그중 하나가 권만석 노인이다. 하은이 할아버지 손을 붙잡고 소리 없이 운다.', when: (g, M) => !M.flags.c4_kwonSaved },
      { narr: '주머니 속 쇠 배지가 체온보다 따뜻하다.' },
      { who: 'leader', when: (g, M) => HAS_LEADER(g), text: '…앞줄에 서 있었다며. 영상이 돌아. 네 얼굴이 찍혀 있다. 왜 앞줄이었냐. 대답 잘해라.' },
    ], choices: [
      { text: '"저도 알고 싶었어요. 그 문이 뭔지."', set: { c4_joinWhy: 'truth' }, rel: { leader: -2 }, relWhy: '균열교 의식 앞줄에 섰다' },
      { text: '"그 사람들을 혼자 두고 싶지 않았어요."', set: { c4_joinWhy: 'people' }, rel: { leader: (g, M) => (M.flags.c1_view === 'sympathy' ? 0 : -3) }, relWhy: '균열교 의식 앞줄에 섰다' },
    ], next: 'c4_rival' },
    // ----- 출구 4: 구출 -----
    { id: 'c4_out_save', lines: [
      { narr: '새벽. 강북 보건소 복도. 권만석 노인은 산소 마스크를 쓰고 잠들어 있다. 하은은 의자에서 다리를 흔들며 당신을 본다.' },
      { who: HAEUN, text: '할아버지가 그랬어요. 문이 열리면 내 다리 낫는다고. 나 태어날 때부터 다리가 이래서.' },
      { who: HAEUN, text: '…{oppa}가 우리 데리고 나와서 문 못 봤어요. 근데 할아버지 살았으니까 괜찮아요. 아마도요.' },
      { narr: '아침 뉴스가 복도 텔레비전에서 흘러나온다. "강북 폐역 가스 폭발 사고, 사상자 다수."' },
      { narr: '가스관 같은 건 없었다. 당신은 봤다.' },
      { who: 'leader', when: (g, M) => HAS_LEADER(g), text: '둘만 데리고 나왔다며. …잘했다. 다 구하려다 다 잃는 놈들 많이 봤다. 그래도 네 얼굴 보니까 잘한 것 같진 않은가 보다.' },
    ], choices: [
      { text: '하은에게 연락처를 남긴다', set: { c4_kwonContact: true }, rel: { leader: 1 }, relWhy: '두 사람을 구해 나왔다', run: (g) => g.lifeEvent('강북 폐역에서 권만석 노인과 손녀 하은을 업고 나왔다.') },
      { text: '말없이 자판기 음료를 하나 쥐여 준다', set: { c4_kwonContact: false }, rel: { leader: 1 }, relWhy: '두 사람을 구해 나왔다', run: (g) => g.lifeEvent('강북 폐역에서 노인과 아이를 구해 나왔다.') },
    ], next: 'c4_rival' },
    // ----- 라이벌 (공통 뒤) -----
    { id: 'c4_rival', skip: (g) => !HAS_RIVAL(g), lines: [
      { narr: '며칠 뒤. 동기 {rival}에게서 전화가 온다.' },
      { who: 'rival', text: (g, M) => ({
        stop: '폐역 깬 거 너지? 헌터넷에 "배교자 사냥꾼"이라고 네 얘기 돈다. 균열교 놈들이 이를 간대.',
        raid: '관리국 서약서 받았지? 나도 봤어. 근데 이상해. 그날 사망자 명단이 관리국 기록에서 통째로 빠졌어.',
        join: '…영상 봤어. 앞줄에 선 거 너 맞지. 무슨 생각이었냐. 진짜로.',
        save: '두 명 구해서 나왔다며. 그 할아버지 손녀 다리, 대붕괴 때 제주 바람 맞은 산모한테서 나온 애들한테 흔한 거래. 알고 있었냐?',
      })[M.flags.c4] || '그날 폐역에 있었지?' },
    ], choices: [
      { text: '숨김없이 다 말한다', set: { c4_rivalTold: true }, rel: { rival: (g, M) => (M.flags.rivalPact === true ? 3 : 1) }, relWhy: '폐역 일을 털어놓았다' },
      { text: '"전화로 할 얘기 아니야."', set: { c4_rivalTold: false }, rel: { rival: (g, M) => (M.flags.rivalPact === true ? -2 : 0) }, relWhy: '말을 아꼈다' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (g.flags.chains) g.flags.chains.cult = Math.max(g.flags.chains.cult || 0, 3);
    const c4 = M.flags.c4;
    M.flags.mumyeong = c4 === 'join' ? 'met' : 'fled';
    if (c4 === 'stop') { g.rumor('강북 폐역 의식을 혼자 깬 헌터를 균열교 신도들이 "배교자 사냥꾼"이라 부른다.'); g.lifeEvent('강북 폐역의 반쪽 문을 막았다. 신도들의 원망을 샀다.'); }
    if (c4 === 'raid') { M.flags.kamaWatch ??= 'signed'; g.rumor('강북 폐역 "가스 폭발" 현장에 관리국 사후 처리반이 먼저 와 있었다는 말이 돈다.'); g.lifeEvent('협회 진압팀과 강북 폐역 의식을 진압했다.'); }
    if (c4 === 'join') { M.flags.badge7 = true; g.rumor('강북 폐역 의식 영상에 헌터 배지를 단 사람이 앞줄에 서 있었다는 말이 돈다.'); }
    if (c4 === 'save') { M.flags.kwon = 'saved'; g.rumor('강북 폐역 "가스 폭발"에서 노인과 아이를 업고 나온 헌터가 있었다는 말이 돈다.'); }
  },
  expire: { months: 6, run: (g, M) => {
    const fr = g.mainWho('friend');
    Object.assign(M.flags, { c4: 'missed', mumyeong: 'fled', kwon: 'dead', doyun: 'leaflet', friendNear: !!(fr && !FRIEND_AWAKE(g) && M.flags.c1_call !== 'promise') });
    if (M.flags.yeonhee !== 'missing') M.flags.yeonhee = 'hurt';
    g.rumor('강북 폐역에서 원인 모를 폭발. 사상자 수십 명. 관리국은 노후 가스관 탓으로 발표했다.');
    if (fr && M.flags.friendNear) g.changeRel(fr, -3, '그날 강북에 있었는데 연락이 없었다');
    return '보름 밤, 강북 폐역에서 무언가 터졌다. 사상자가 많다.';
  } },
});

// ---------- 5장 남은 사람들 ----------
MAIN.ch(5, {
  part: 1, title: '남은 사람들', rank: 1, after: 0, where: (g, M) => (M.flags.c4 === 'join' ? 'any' : 'gangbuk'),
  goal: (g, M) => ({ stop: '강북 경계선 마을에 다시 가 본다', raid: '협회 강북 지부의 사후 브리핑', join: '쇠 배지에 적힌 곳으로', save: '강북 보건소에 들른다', missed: '강북 폐역 사고 뒤의 경계선 마을' })[M.flags.c4] || '강북에 간다',
  start: (g, M) => ({ stop: 'c5_stop', raid: 'c5_raid', join: 'c5_join', save: 'c5_save', missed: 'c5_missed' })[M.flags.c4] || 'c5_stop',
  scenes: [
    { id: 'c5_stop', lines: [
      { narr: '경계선 마을에 들어서자 빨랫줄 너머로 누군가 문을 닫는다. 쾅. 그 옆집도. 쾅.' },
      { narr: '천막 앞 줄이 짧아졌다. 사람들이 당신을 보고 줄에서 빠진다.' },
      { who: YEONHEE, when: (g, M) => M.flags.yeonhee !== 'missing', text: '…오지 마세요, 당분간은. 다들 당신이 문을 깼다고 알아요. 고맙다는 사람도 있어요. 근데 그 사람들은 말을 못 해요.' },
    ], next: 'c5_kid' },
    { id: 'c5_raid', lines: [
      { narr: '협회 강북 지부, 지하 2층 회의실. 에어컨이 지나치게 세다.' },
      { narr: '관리국에서 나온 남자가 화면에 숫자를 띄운다. 체포 41. 부상 63. 사망은 칸이 비어 있다.' },
      { who: KAMA_AGENT, text: '이번 작전은 성공입니다. 균열교의 인공 게이트 기술은 실재하지 않는 것으로 결론 났습니다. 현장의 이상 현상은 가스 누출에 따른 집단 환각입니다.' },
      { narr: (g, M) => (M.flags.kamaWatch === 'hostile' ? '브리핑이 끝나고, 남자가 당신 쪽을 한 번 본다. 서명을 거부한 사람을 기억하는 눈이다.' : '진압팀장이 옆에서 작게 웃는다. "집단 환각이래. 내가 본 그림자도 환각이겠지."') },
    ], next: 'c5_kid' },
    { id: 'c5_join', lines: [
      { narr: '쇠 배지 뒷면의 숫자 일곱. 사흘 밤 내내 만지작거린다. 나흘째 새벽, 문 밑으로 봉투가 들어와 있다.' },
      { sys: '「일곱 번째 형제에게. 문은 아직 너무 작다. 다음 의식까지 너의 몸을 보살펴라. 너는 우리 중 가장 오래 견딜 사람이다. 연락은 우리가 한다. 찾지 마라. — 무」' },
      { narr: '봉투에 같이 든 것: 관리국 공명 실험이라는 제목의 낡은 사진 한 장. 흰 가운을 입은 사람들. 얼굴은 모두 긁혀 있다.' },
    ], next: 'c5_kid' },
    { id: 'c5_save', lines: [
      { narr: '강북 보건소. 권만석 노인이 침대에 앉아 사과를 깎고 있다. 칼질이 서툴다. 손이 떨린다.' },
      { who: KWON, text: '오셨소. 하은아, 인사해라. …자네 덕에 살았소. 그날 앞줄에 있던 사람들 중 셋이 안 깨어났다더군.' },
      { who: KWON, text: '나는 아직도 모르겠소. 자네가 우리를 살린 건지, 하은이의 기회를 뺏은 건지.' },
      { who: HAEUN, text: (g, M) => (M.flags.c4_kwonContact ? '문자 보냈는데 답장이 늦었어요. 바쁜 거 알아요. 헌터니까.' : '…그때 음료수 맛있었어요.') },
    ], next: 'c5_kid' },
    { id: 'c5_missed', lines: [
      { narr: '경계선 마을 입구에 국화가 쌓여 있다. 폐역 사고 희생자 추모 자리. 관리국 공식 추모 자리는 따로 있다. 거긴 이름이 없다.' },
      { narr: '이름을 적은 종이가 판자에 빼곡히 붙어 있다. 권만석이라는 이름도 있다.' },
      { narr: (g, M) => (M.flags.yeonhee === 'missing' ? '연희의 행방은 아직도 모른다. 누군가 국화 옆에 흰 앞치마를 접어 두었다.' : '연희는 팔에 붕대를 감은 채 국화를 정리한다. 당신을 보더니 손을 멈춘다. "…그날 어디 계셨어요?"') },
      { who: 'friend', when: (g, M) => !!M.flags.friendNear, text: '…나 그날 강북에 있었어. 회사 언니 따라서. 출구 앞에서 무서워서 못 들어갔어. 언니는 들어갔고. 아직 병원에 있어.' },
    ], next: 'c5_kid' },
    { id: 'c5_kid', lines: [
      { narr: '철책 앞 공터. 아이들이 깡통을 차고 논다. 그중 하나가 공을 놓치고 당신 쪽으로 뛰어온다.' },
      { who: KID, when: (g, M) => !!M.flags.c1_kid, text: (g, M) => (M.flags.doyun === 'leaflet' ? '{hyung}! 이거 봐, 새 전단이야. 다음 보름엔 더 큰 문 연대. 나도 이번엔 앞줄 설 거야.' : M.flags.c1_kid === 'bread' ? '{hyung}, 나 이거 그렸어. 그날 빵 사 준 거. 줄게.' : M.flags.c1_kid === 'warn' ? '{hyung} 말이 맞았어. 문은 사람을 죽여. 우리 옆집 할머니도… 근데 그래도 나는 각성하고 싶어.' : '운 나쁜 애들끼리 모여서 놀아. {hyung}도 낄래? 아, {hyung}은 운 좋은 쪽이지.') },
      { narr: '도윤이라는 아이는 없다. 대신 처음 보는 아이들이 당신의 배지를 신기하게 쳐다본다.', when: (g, M) => !M.flags.c1_kid },
    ], choices: [
      { text: (g, M) => (M.flags.doyun === 'leaflet' ? '전단을 받아 들고 "앞줄은 서지 마"라고 말한다' : '아이와 잠깐 공을 찬다'), set: { c5_kid: 'stay' }, run: (g, M) => { if (M.flags.c1_kid) { M.flags.doyun = M.flags.doyun === 'leaflet' ? 'warned' : 'friend'; g.lifeEvent('경계선 마을의 도윤과 공을 찼다.'); } } },
      { text: '손을 흔들고 지나친다', set: { c5_kid: 'pass' }, run: (g, M) => { if (M.flags.c1_kid && M.flags.doyun !== 'leaflet') M.flags.doyun = 'distant'; } },
    ] },
    { id: 'c5_end', lines: [
      { narr: '돌아오는 길. 철책 안쪽 게이트 경보탑에 불이 들어온다. 오늘 밤도 어딘가 문이 열린다.' },
      { narr: (g, M) => ({ stop: '문을 막은 사람은 원망을 받는다. 그건 알았다. 알았는데도 가슴이 무겁다.', raid: '"집단 환각." 그 단어가 혀끝에서 쓰다.', join: '주머니 속 배지가 또 따뜻해진다. 아무도 모르는 곳에서 누군가 당신의 이름을 부르는 것 같다.', save: '두 사람을 구했다. 세 사람이 안 깨어났다. 계산이 맞지 않는다.', missed: '그날 밤 당신은 거기 없었다. 그 사실이 이름 없는 종이들보다 무겁다.' })[M.flags.c4] || '' },
    ], next: 'end' },
  ],
  done: (g, M) => { g.lifeEvent('강북 폐역 사고 뒤, 남은 사람들을 만났다.'); },
  expire: { months: 8, run: (g, M) => { M.flags.c5_missed = true; return '경계선 마을은 다시 조용해졌다. 국화도, 전단도 비에 젖었다.'; } },
});

// ---------- 6장 동기 ----------
MAIN.ch(6, {
  part: 1, title: '동기', rank: 1, after: 1, when: (g) => g.player.rankIdx >= 2 || g.player.stage >= 1, where: 'city',
  goal: (g) => (HAS_RIVAL(g) ? '동기 {rival}과(와) 술 한잔' : '시험 동기들의 소식'),
  scenes: [
    { id: 'c6_bar', lines: [
      { narr: '금요일 밤. 협회 지부 뒷골목 포장마차. 비닐 천막 위로 비가 두드린다.' },
      { narr: (g, M) => (M.flags.rivalPact === 'cold' ? '{rival}이(가) 먼저 와 있다. 소주잔을 하나만 놓고. 당신을 보고 잔 하나를 마지못해 더 꺼낸다.' : M.flags.rivalPact === true ? '{rival}이(가) 먼저 와서 잔 두 개를 채워 놨다. 자리에 앉자마자 수첩을 꺼낸다.' : '{rival}이(가) 먼저 와 있다. 오뎅 국물을 휘휘 젓고 있다.'), when: HAS_RIVAL },
      { narr: '시험 동기 단체방이 조용해진 지 오래다. 누구는 길드에 들어갔고, 누구는 소식이 끊겼다. 동기 한 명이 지난달 게이트에서 돌아오지 못했다는 소식만 남아 있다.', when: (g) => !HAS_RIVAL(g) },
    ] },
    { id: 'c6_talk', skip: (g) => !HAS_RIVAL(g), lines: [
      { who: 'rival', text: (g, M) => ({ stop: '배교자 사냥꾼님. 균열교가 네 얼굴 사진 돌린대. 몸조심해.', raid: '서약서. 너도 썼지. 나는 그 서약서 원본을 봤어. 관리국 문서 번호가 대붕괴 해 거랑 같은 체계야. 이십 년 동안 같은 걸 덮고 있다는 거지.', join: '…너 아직 그 배지 갖고 있지. 버려. 관리국이 앞줄 영상 다 갖고 있대.', save: '그 할아버지 손녀 다리 얘기, 더 알아봤어. 대붕괴 해에 제주 근해에 있던 산모들. 그 아이들 다수가 같은 증상이야.', missed: '폐역 사고 명단, 관리국 발표랑 헌터넷 추모 명단이 스물세 명 차이가 나. 스물세 명이 그냥 없어졌어.' })[M.flags.c4] || '요즘 어때.' },
      { who: 'rival', text: { haera: '나 결정했다. 이대로는 아무것도 못 알아내. 안으로 들어가야 돼.', haeyo: '저 결정했어요. 이대로는 아무것도 못 알아내요. 안으로 들어가야 해요.', short: '결정했다. 안으로 들어간다.' } },
    ], choices: [
      { text: '"관리국에 들어가. 안에서 기록을 봐."', set: { rivalPath: 'kama' }, rel: { rival: 2 }, relWhy: '길을 같이 고민해 주었다',
        say: [{ who: 'rival', text: '…역시 그거지. 다음 달 관리국 특채 지원한다. 붙으면, 너한테 제일 먼저 말할게.' }] },
      { text: '"균열교 안으로 들어가. 무명이 뭘 아는지 봐."', set: { rivalPath: 'cult' }, rel: { rival: (g, M) => (M.flags.c4 === 'join' ? 3 : 1) }, relWhy: '위험한 길을 같이 고민해 주었다',
        say: [{ who: 'rival', text: (g, M) => (M.flags.c4 === 'join' ? '너처럼? …그래, 네가 먼저 봤으니까 알겠지. 해 볼게.' : '미쳤냐. …근데 그게 제일 빠르긴 하지.') }] },
      { text: '"아무 데도 들어가지 마. 같이 밖에서 파자."', set: { rivalPath: 'solo' }, rel: { rival: (g, M) => (M.flags.rivalPact === 'cold' ? 1 : 4) }, relWhy: '함께하자고 했다',
        say: [{ who: 'rival', text: (g, M) => (M.flags.rivalPact === 'cold' ? '…네가 그 말을 할 줄은 몰랐다. 생각해 볼게.' : '하. 그래, 그럼 둘이서 하자. 대신 술값은 네가 내.') }] },
    ] },
    { id: 'c6_end', lines: [
      { narr: '천막 밖은 아직 비다. 버스 정류장까지 우산 하나를 둘이 나눠 쓴다.', when: HAS_RIVAL },
      { narr: '비가 그친다. 협회 지부 게시판에 "실종 헌터 정보 구함" 전단이 한 장 늘었다.', when: (g) => !HAS_RIVAL(g) },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const r = g.mainWho('rival');
    if (r && M.flags.rivalPath) { r.mainPath = M.flags.rivalPath; g.lifeEvent(`동기 ${r.name}이(가) ${M.flags.rivalPath === 'kama' ? '관리국으로 들어가기로' : M.flags.rivalPath === 'cult' ? '균열교 안으로 들어가기로' : '함께 밖에서 진실을 쫓기로'} 했다.`); }
  },
  expire: { months: 8, run: (g, M) => {
    const r = g.mainWho('rival'); M.flags.rivalPath = 'alone';
    if (r) { g.changeRel(r, -3, '연락을 받지 않았다'); g.rumor(`시험 동기 ${r.name}이(가) 혼자 관리국 기록을 뒤지다 징계를 받았다는 말이 돈다.`); }
    return '동기의 전화를 몇 번 놓쳤다. 그 사이 동기는 혼자 움직였다.';
  } },
});

// ---------- 7장 꿈 ----------
MAIN.ch(7, {
  part: 1, title: '꿈', rank: 1, after: 1, when: (g) => g.player.rankIdx >= 2 || g.player.stage >= 2, where: 'any',
  goal: '잠든다',
  scenes: [
    { id: 'c7_dream', lines: [
      { narr: '꿈을 꾼다.' },
      { narr: '검은 바다. 파도가 거꾸로 친다. 수평선 끝에 문이 서 있다. 하늘까지 닿은, 갈라진 원 모양의 문.' },
      { narr: (g, M) => (M.flags.c4 === 'join' ? '이번엔 아주 가깝다. 폐역 앞줄에서 맞은 바람과 같은 냄새가 난다. 주머니 속 쇠 배지가 꿈속에서도 따뜻하다.' : '아주 멀다. 그런데 이상하게 낯익다. 폐역의 틈과 같은 바람이 분다.') },
      { narr: '문 너머에서 누군가 당신의 이름을 부른다. {name}. 또렷하게. 처음 각성하던 날 들었던 목소리와 같은 목소리.' },
      { who: 'arin', text: '…들려? 이번엔 들리는구나.' },
      { who: 'arin', text: '그 아래 역에서 누가 문을 두드렸지. 반쪽짜리 손으로. 그러면 안 돼. 그건 문이 아니라 상처야. 상처는 곪아.' },
      { who: 'arin', text: '아직 내 이름은 말 못 해. 너무 멀어. …다음엔 더 가까이 와.' },
      { narr: '바다가 일어선다. 깨어난다. 베개가 에테르로 젖어 있다. 손끝이 저리다. 1장의 그 밤보다 훨씬.' },
    ], choices: [
      { text: '꿈을 공책에 적어 둔다', set: { dream: 'record' }, gain: { ether: 20 }, run: (g) => g.lifeEvent('처음으로 그 꿈을 꿨다. 문 너머의 목소리가 이름을 불렀다.'), say: [{ narr: '"상처는 곪는다." 그 문장 아래 두 줄을 긋는다.' }] },
      { text: '헌터넷에 같은 꿈을 꾼 사람이 있는지 찾아본다', set: { dream: 'search' }, gain: { ether: 10 }, run: (g) => { g.lifeEvent('같은 꿈을 꾸는 헌터를 찾기 시작했다.'); g.rumor('헌터넷 꿈 게시판에 "검은 바다 위의 문" 글이 올라왔다. 댓글이 서른 개 넘게 달렸다.'); },
        say: [{ narr: '검색어: 검은 바다, 문, 목소리. 글이 몇 개 나온다. 전부 대붕괴 해에 태어난 각성자들이다. 그리고 전부 지워지기 직전이다.' }] },
      { text: '그냥 악몽이라 여기고 잊는다', set: { dream: 'ignore' }, say: [{ narr: '물 한 잔. 다시 눕는다. 다음 꿈은 더 선명할 거라는 걸, 아직 모른다.' }] },
    ] },
    { id: 'c7_morning', lines: [
      { who: 'friend', when: (g, M) => M.flags.dream !== 'ignore', text: (g) => (FRIEND_AWAKE(g) ? '…야, 이상한 거 물어봐도 돼? 너 혹시 요즘 바다 꿈 꿔? 검은 바다.' : '아침부터 무슨 일이야. 목소리가 이상한데. 악몽 꿨어?') },
      { narr: '창밖은 평범한 아침이다. 출근하는 사람들. 전봇대의 전단은 새것으로 바뀌어 있다.' },
    ], next: 'end' },
  ],
  done: (g, M) => { if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 1); if (M.flags.dream === 'ignore') M.flags.dreamDebt = 1; },
});

// ---------- 8장 첫 해 ----------
MAIN.ch(8, {
  part: 1, title: '첫 해', rank: 1, after: 1, when: (g, M) => g.monthKey() - (M.startMk || 0) >= 11, where: 'city',
  goal: '데뷔 1년. 가까운 사람과 한 해를 돌아본다',
  scenes: [
    { id: 'c8_meet', lines: [
      { narr: '헌터 등록 1년. 협회에서 기념 배지 하나가 우편으로 온다. 은색. 가볍다.' },
      { who: 'leader', when: HAS_LEADER, text: (g, M) => (M.flags.c4 === 'join' ? '1년이네. 솔직히 말한다. 너를 믿는 데 1년이 더 걸릴 것 같다. 그래도 같이 밥은 먹자.' : M.flags.c4 === 'stop' ? '1년 동안 문 하나를 막고 원망 한 사발을 받았네. 신입치곤 많이 받았다. 오늘은 내가 산다.' : '1년이다. 살아남았네. 그게 제일 어려운 거다. 오늘은 내가 산다.') },
      { who: 'friend', text: (g, M) => (M.flags.friendNear ? '1년 축하해. …폐역 일은 아직 생각나. 언니는 퇴원했어. 근데 다시 집회에 나가.' : M.flags.c1_call === 'promise' ? '1년 축하해, 헌터님. 대피소 일, 진짜로 바뀌진 않았지만 너 덕에 한 번 기사는 났어. 그거면 됐어.' : '1년 축하해! 국밥 약속은 열두 번 미뤘다. 오늘은 안 놔준다.') },
    ] },
    { id: 'c8_look', lines: [
      { narr: '국밥집 텔레비전에서 저녁 뉴스가 나온다.' },
      { sys: (g, M) => (M.flags.cultSpread || M.flags.c4 === 'missed' ? '「균열교, 전국 7개 도시로 확산… 신도 수 추정 5만」' : '「균열교 신도 수 추정 3만… 관리국 "강북 폐역 사고 이후 위축세"」') },
      { narr: '마도현 국장의 얼굴이 짧게 지나간다. "게이트는 자연재해입니다." 1년 전과 같은 말. 같은 표정.' },
      { narr: (g, M) => ({ stop: '당신은 이제 안다. 문은 두드리면 열린다. 반쪽이라도.', raid: '당신은 이제 안다. "집단 환각"이라는 말이 무엇을 덮는지.', join: '당신은 이제 안다. 무명은 그 문을 직접 본 사람이다. 그리고 당신을 "일곱 번째"라고 불렀다.', save: '당신은 이제 안다. 제주 바람을 맞은 아이들이 있다. 하은도, 어쩌면 당신도.', missed: '당신은 이제 안다. 미루는 사이에도 문은 열린다.' })[M.flags.c4] || '' },
      { narr: '그리고 꿈. 검은 바다. 문 너머의 목소리.', when: (g, M) => M.flags.dream && M.flags.dream !== 'ignore' },
    ] },
    { id: 'c8_end', lines: [
      { narr: '자정. 귀갓길. 하늘이 맑다. 남쪽 끝, 아주 멀리. 별 하나가 깜빡이지 않고 붉게 떠 있다.' },
      { narr: '제주 쪽이다.' },
      { sys: '1부 「균열의 냄새」 끝. 2부 「보름의 의식」은 D급이 되면 열린다.' },
    ], next: 'end' },
  ],
  done: (g, M) => { M.part1 = { c4: M.flags.c4, rivalPath: M.flags.rivalPath || null, dream: M.flags.dream || null }; g.lifeEvent('헌터로서 첫 해를 보냈다.'); },
});
