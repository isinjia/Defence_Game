// ===== 메인 시나리오 1부 「균열의 냄새」 (영역 D, docs/메인_시나리오.md §3) =====
const FRIEND_AWAKE = (g) => { const f = g.mainWho('friend'); return !!(f && f.rankIdx >= 1); };
const HAS_LEADER = (g) => !!g.mainWho('leader');

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
      { who: 'leader', text: '봤냐, 그 전단. 동네가 도배가 됐더라.', alt: { who: 'friend', text: '야, 너네 동네도 그 전단 붙었어? 여기 버스 정류장까지 다 붙었어.' } },
      { who: 'leader', text: '요즘 저런 데가 또 늘었다. 게이트 하나 터질 때마다 신도가 두 배로 는다는 말도 있고.', when: HAS_LEADER },
      { who: 'leader', text: '헌터는 엮이지 않는 게 좋다. 저 사람들이 원하는 게 결국 우리거든. 각성자가 신도로 하나 들어가면 그다음은 백 명이 따라 들어간다.', when: HAS_LEADER },
    ], choices: [
      { text: '"각성 못 한 사람들한테는 저게 희망일 수도 있잖아요."', when: HAS_LEADER, set: { c1_view: 'sympathy' },
        say: [{ who: 'leader', text: '…희망이라. 그 희망 팔아서 돈 버는 놈이 있다는 게 문제지. 그래도 네 말이 틀린 건 아니다. 기억해 둬, 그 마음.' }] },
      { text: '"알겠습니다. 안 엮일게요."', when: HAS_LEADER, set: { c1_view: 'obey' },
        say: [{ who: 'leader', text: '그래. 우린 게이트만 닫으면 된다. 나머진 관리국 일이다.' }] },
      { text: '"누가 뒤에 있는지 궁금하긴 하네요."', when: HAS_LEADER, set: { c1_view: 'curious' },
        say: [{ who: 'leader', text: '궁금해하지 마라. 그런 궁금증이 헌터를 제일 많이 죽인다. …농담 아니다.' }] },
      { text: '친구에게 "그러게, 별 데가 다 있다"고 답한다', when: (g) => !HAS_LEADER(g), set: { c1_view: 'pass' } },
    ] },
    { id: 'c1_kid', lines: [
      { narr: '점심 무렵. 협회 지부로 가는 길에, 전봇대 앞에 아이 하나가 서 있다. 열 살쯤. 소매가 해진 점퍼.' },
      { narr: '아이는 전단을 떼어 조심스럽게 접는다. 보물이라도 되는 것처럼 주머니에 넣는다. 그러다 당신의 헌터 배지를 본다.' },
      { who: { name: '아이', sub: '강북 폐구' }, text: '…{hyung}, 헌터야?' },
      { who: { name: '아이', sub: '강북 폐구' }, text: '우리 엄마가 그러는데, 헌터는 신이 된 사람들이래. 문에서 빛을 받아서. 우리 같은 사람은 못 받고.' },
      { who: { name: '아이', sub: '강북 폐구' }, text: '근데 이 아저씨들이 그러는데, 문이 다시 열리면 우리도 받을 수 있대. 진짜야?' },
    ], choices: [
      { text: '"신 같은 거 아니야. 운이 좋았던 것뿐이야."', set: { c1_kid: 'luck' },
        say: [{ who: { name: '아이', sub: '강북 폐구' }, text: '운? …그럼 나는 운이 나쁜 거네.' }, { narr: '아이는 웃지도 울지도 않는다. 그 말이 당신 귀에 오래 남는다.' }] },
      { text: '"그런 말은 믿지 마. 문은 사람을 죽여."', set: { c1_kid: 'warn' },
        say: [{ who: { name: '아이', sub: '강북 폐구' }, text: '알아. 아빠도 문 때문에 죽었어. …근데 {hyung}은 안 죽었잖아.' }, { narr: '아이가 뛰어간다. 주머니 속 전단은 그대로다.' }] },
      { text: '대답 대신 편의점에서 빵을 사 준다', set: { c1_kid: 'bread' }, gain: { money: -2 },
        say: [{ narr: '아이는 빵을 받아 들고 한참 쳐다본다. "목요일엔 저기 가면 밥 줘. 공짜로." 그 말만 남기고 간다.' }] },
    ] },
    { id: 'c1_friend', lines: [
      { narr: '저녁. 휴대폰이 울린다. 화면에 뜬 이름은 {friend}.' },
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
  done: (g, M) => { const f = g.mainWho('friend'); if (f) f.met = true; },
});
