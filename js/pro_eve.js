// ===== 프롤로그 끝: 길드 면접 대신 "등록 전후의 하루" (영역 D, 사용자 요청) =====
// 길드는 시험 뒤 판정 등급을 보고 권유가 온다(aff_flow.js). 그래서 프롤로그 끝의 네 길드 면접(이름만 다르고 선택지가 같았다)은
// 서로 전혀 다른 하루 넷 중 하나로 바꾼다. 선택은 특성·친구·희망(hope_*)만 남기고, 실제 소속은 시험 뒤에 정해진다.
Object.assign(PROLOGUE, {
  eve_net: { title: '헌터넷 첫 로그인', text: '관리국 등록을 마친 날 밤. 등록 문자에 딸려 온 링크로 헌터넷에 가입했다. 닉네임 칸에서 한참 망설이다 아무거나 쳤다.\n\n신규 게시판 맨 위 글: [F급 3년 차입니다. 궁금한 거 물어보세요]. 댓글이 사백 개다.',
    choices: [
      { text: '익명으로 질문을 단다. "F급도 먹고살 만한가요?"', t: { lucky: 1, charisma: 1 }, flag: 'hope_free', next: null },
      { text: '공략 게시판 정리글을 새벽까지 전부 읽는다', talent: 1, t: { genius: 1, mana_sense: 1 }, flag: 'hope_kama', next: null },
      { text: '각성하던 날 찍힌 영상을 올린다. 조회수가 미친 듯이 오른다', luck: 1, t: { charisma: 1, reckless: 1 }, flag: 'hope_guild', next: null },
      { text: '노트북을 덮고 운동화 끈을 묶는다. 글로 배울 건 없다', t: { iron_body: 1, loner: 1 }, flag: 'hope_free', next: null },
    ] },
  eve_shop: { title: '장비점 "대장간 김씨"', text: '시험 전에 뭐라도 하나 손에 쥐고 싶었다. 재래시장 골목 끝 장비점. 간판은 대장간인데 안에는 중고 장비가 빼곡하다. 주인 아저씨가 돋보기 너머로 본다. "예산은?"\n\n지갑에 30만 원.',
    choices: [
      { text: '손에 착 붙는 중고 단검을 고른다. "이거요."', t: { quick: 1 }, luck: 1, flag: 'hope_free', next: null },
      { text: '가게에서 제일 무거운 방패를 들어 본다. 내려놓기 싫다', t: { iron_body: 1, longevity: 1 }, flag: 'hope_kama', next: null },
      { text: '아무것도 안 사고, 아저씨의 옛날 게이트 이야기를 두 시간 듣는다', talent: 1, t: { mana_sense: 1 }, luck: 1, next: null },
      { text: '아저씨가 내미는 장갑을 받아 든다. "이건 벌써 계산됐어. 아까 {friend}이(가) 왔다 갔거든."', t: { charisma: 1 }, friend: 15, next: null },
    ] },
  eve_dinner: { title: '등록 전날 저녁', text: '{friend}네 집 저녁 식탁. {friend}의 어머니가 반찬을 자꾸 이쪽으로 민다. "헌터 된다며? 밥이라도 든든히 먹어야지."\n\nTV에서는 게이트 사고 뉴스가 나오고, 아무도 채널을 돌리지 않는다.',
    choices: [
      { text: '"헌터 되면 어머니 가게부터 지켜 드릴게요."', t: { charisma: 1 }, friend: 10, flag: 'hope_kama', next: null },
      { text: '대답 대신 밥을 두 공기 먹는다. 어머니가 웃는다', t: { iron_body: 1, glutton: 1 }, friend: 10, next: null },
      { text: '설거지를 하며 {friend}에게만 말한다. "사실 좀 무서워."', friend: 25, t: { lucky: 1 }, flag: 'hope_free', next: null },
      { text: '"돈 많이 벌어서 이 신세 꼭 갚을게요."', t: { merchant: 1 }, luck: 1, flag: 'hope_guild', next: null },
    ] },
  eve_line: { title: '봉쇄선 앞', text: '관리국에서 집에 가는 길. 사거리 하나가 노란 테이프로 막혀 있다. 소형 게이트. 구경꾼들이 휴대폰을 들고 웅성거린다.\n\n장비를 갖춘 헌터 넷이 테이프를 넘는다. 그중 하나가 지나가며 당신을 힐끔 본다. 같은 냄새를 맡은 표정이다.',
    choices: [
      { text: '헌터들이 나올 때까지 테이프 앞에서 끝까지 지켜본다', talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama', next: null },
      { text: '힐끔 본 헌터에게 말을 건다. "무섭지 않아요?"', t: { charisma: 1 }, flag: 'hope_guild', next: null },
      { text: '경찰이 한눈판 사이, 테이프 아래로 한 발 들인다', t: { reckless: 1, berserk: 1 }, luck: 1, flag: 'hope_free', next: null },
      { text: '구경꾼들 사이에서 조용히 빠져나온다. 내 차례는 곧 온다', t: { loner: 1, quick: 1 }, next: null },
    ] },
});
const PRO_EVE = ['eve_net', 'eve_shop', 'eve_dinner', 'eve_line'];

if (typeof UI !== 'undefined') {
  // affiliation.js가 verdict_guild → vg_<길드>(면접)로 바꿔 끼운 직후, 하루 장면 하나로 다시 바꾼다. 희망 길드(hopeGuild)는 그대로 둔다(C급 이상 길드 권유 때 우선)
  const baseChoose = UI.proChoose;
  UI.proChoose = function (i) {
    const r = baseChoose.call(this, i);
    const s = this.pro;
    if (s && typeof s.id === 'string' && /^vg2?_/.test(s.id)) { s.id = PRO_EVE[Math.floor(Math.random() * PRO_EVE.length)]; this.renderPrologue(); }
    return r;
  };
}

// ---------- 추가 14장 (사용자 요청: 15~20장) ----------
const EV = (title, text, choices) => ({ title, text, choices: choices.map(([t, o]) => ({ text: t, ...o, next: null })) });
Object.assign(PROLOGUE, {
  eve_bath: EV('새벽 목욕탕', '동네 목욕탕, 새벽 다섯 시. 온탕에 등 문신이 반쯤 지워진 할아버지가 앉아 있다. 팔뚝에 길게 난 흉터. 할아버지가 눈을 감은 채 말한다. "냄새 나네. 막 깨어난 놈 냄새."', [
    ['"할아버지도 헌터셨어요?" 조심스럽게 묻는다', { talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama' }],
    ['냉탕에 들어가 할아버지보다 오래 버틴다', { t: { iron_body: 1, reckless: 1 } }],
    ['말없이 할아버지 등을 밀어 드린다', { t: { charisma: 1, lucky: 1 }, luck: 1 }],
    ['못 들은 척 수건을 뒤집어쓰고 먼저 나온다', { t: { loner: 1 }, flag: 'hope_free' }],
  ]),
  eve_pcbang: EV('PC방 밤샘', '등록 축하한다며 게임 친구들이 PC방으로 불러냈다. 자정, 컵라면 다섯 개. 화면 속 내 캐릭터는 만렙인데, 현실의 나는 이제 막 1레벨이다.\n\n옆자리 친구가 묻는다. "야, 각성하면 뭐가 달라져? 진짜 게임처럼 막 강해지는 느낌이냐?"', [
    ['"몰라. 그냥… 몸이 내 몸 같지가 않아. 손이 생각보다 먼저 움직여."', { t: { quick: 1, berserk: 1 } }],
    ['밤새 헌터 공략 영상을 틀어 놓고 친구들과 동선을 짜 본다', { talent: 1, t: { genius: 1 }, flag: 'hope_guild' }],
    ['"너희도 언젠가 깨어나면 같이 하자." 반쯤 진심으로', { t: { charisma: 1 }, friend: 10, flag: 'hope_free' }],
    ['새벽 세 시에 먼저 일어난다. 내일부터는 진짜 게임이다', { t: { iron_body: 1 } }],
  ]),
  eve_checkup: EV('관리국 의무실', '등록 서류의 마지막 칸은 건강 검진이다. 관리국 의무실 간호사가 혈압계를 감으며 말한다. "에테르 수치가 오르면 다들 잠을 못 자요. 요즘 잠은 잘 와요?"', [
    ['"한 번 누우면 열두 시간씩 자요." 사실대로 말한다', { t: { lucky: 1, glutton: 1 } }],
    ['"하나도 못 자요." 손이 떨리는 걸 숨기지 못한다', { t: { mana_sense: 1, reckless: 1 }, talent: 1 }],
    ['간호사가 자리를 비운 사이 자기 차트를 몰래 읽어 본다', { t: { genius: 1, quick: 1 }, flag: 'hope_kama' }],
    ['"괜찮아요." 웃으며 소매를 내린다. 팔에 처음 보는 무늬가 있다', { luck: 1, t: { loner: 1 } }],
  ]),
  eve_rooftop: EV('밤의 뒷산', '밤 열한 시, 동네 뒷산 약수터 위 공터. 가로등 하나 없는 데서 한 번은 제대로 써 보고 싶었다. 운동 기구 몇 개와 쓰러진 소나무 사이에 선다.\n\n심호흡. 손끝이 뜨거워진다.', [
    ['힘을 끝까지 끌어올려 본다. 쓰러진 소나무 둥치가 쪼개진다', { talent: 1, t: { berserk: 1 }, luck: -1 }],
    ['딱 반만 쓰고 멈추는 연습을 한 시간 한다', { t: { mana_sense: 1, longevity: 1 }, flag: 'hope_kama' }],
    ['바위 능선을 눈 감고 끝까지 걸어 본다', { t: { quick: 1, reckless: 1 } }],
    ['{friend}을(를) 불러내 보여 준다. "봐, 이거."', { friend: 15, t: { charisma: 1 }, flag: 'hope_free' }],
  ]),
  eve_lastshift: EV('알바 마지막 날', '삼 년 다닌 김밥집 마지막 근무. 사장님이 앞치마를 받아 들고 한참 만지작거린다. "헌터 된다며. 다치면 언제든 와. 김밥은 평생 공짜다."', [
    ['마지막으로 김밥 백 줄을 말고 간다', { t: { iron_body: 1, glutton: 1 }, luck: 1 }],
    ['"사장님 가게는 제가 지켜 드릴게요."', { t: { charisma: 1 }, flag: 'hope_kama' }],
    ['"첫 월급 타면 여기 단체 주문할게요." 길드 회식 핑계로', { t: { merchant: 1 }, flag: 'hope_guild' }],
    ['아무 말 못 하고 꾸벅 인사만 한다. 문밖에서 운다', { t: { lucky: 1 }, friend: 5 }],
  ]),
  eve_karaoke: EV('송별회 노래방', '"헌터 되는 놈 송별회"라는 이름으로 동창들이 노래방을 잡았다. 한 명은 벌써 취했다. 화면에 뉴스 자막이 흐른다. "오늘 오후 강남 게이트 사망자 2명."\n\n누군가 리모컨으로 자막을 꺼 버린다.', [
    ['마이크를 잡고 제일 시끄러운 노래를 부른다', { t: { charisma: 1, berserk: 1 }, friend: 5 }],
    ['다시 자막을 켜고 끝까지 읽는다', { talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama' }],
    ['계산은 내가 한다. "선금이라 치자."', { t: { merchant: 1 }, luck: 1, flag: 'hope_guild' }],
    ['화장실 간다고 나와서 그대로 집에 간다', { t: { loner: 1, quick: 1 }, flag: 'hope_free' }],
  ]),
  eve_fortune: EV('골목 점집', '할머니 손에 끌려 골목 끝 점집에 왔다. 방울 소리. 무당이 쌀알을 흩뿌리다 손을 멈춘다. "…너는 남의 운을 먹고 크겠구나. 아니면 남한테 운을 주든지."', [
    ['"그럼 주는 쪽으로 할게요."', { t: { charisma: 1, lucky: 1 }, luck: -1 }],
    ['"먹는 쪽이면 얼마나 크는데요?"', { t: { reckless: 1 }, luck: 2, flag: 'hope_guild' }],
    ['쌀알이 떨어진 모양을 휴대폰으로 찍어 둔다', { talent: 1, t: { genius: 1, mana_sense: 1 } }],
    ['복채만 두고 나온다. 운은 내가 정한다', { t: { loner: 1 }, flag: 'hope_free' }],
  ]),
  eve_subway: EV('막차', '자정 막차. 칸에는 나와 졸고 있는 할머니, 그리고 이어폰을 낀 고등학생뿐이다. 터널 한가운데서 열차가 덜컹 멈춘다. 조명이 깜빡인다.\n\n안내 방송: "선로 앞 이상 반응 확인 중입니다. 잠시만…"', [
    ['할머니 옆으로 옮겨 앉는다', { t: { longevity: 1, iron_body: 1 }, flag: 'hope_kama' }],
    ['창밖 어둠을 노려본다. 뭔가 움직였다', { talent: 1, t: { mana_sense: 1 } }],
    ['고등학생에게 말을 건다. "괜찮아. 나 헌터야." 아직 아니지만', { t: { charisma: 1 }, luck: 1 }],
    ['비상 레버 위치부터 확인해 둔다', { t: { quick: 1, genius: 1 }, flag: 'hope_free' }],
  ]),
  eve_loan: EV('각성자 대출 창구', '은행 2층, "신규 각성자 장비 대출" 창구. 상담원이 웃으며 서류를 민다. "등급 나오기 전이면 금리가 좀 높긴 한데, 다들 이렇게 시작하세요."\n\n금리 칸의 숫자가 생각보다 크다.', [
    ['깎아 달라고 끝까지 버틴다. 결국 0.5% 깎는다', { t: { merchant: 1, charisma: 1 }, flag: 'hope_guild' }],
    ['서류를 덮는다. 빚부터 지고 시작하진 않겠다', { t: { iron_body: 1 }, luck: 1, flag: 'hope_free' }],
    ['약관을 처음부터 끝까지 읽는다. 함정 조항 두 개를 찾는다', { talent: 1, t: { genius: 1 } }],
    ['{friend}에게 전화한다. "야, 이거 사기 아니냐?"', { friend: 10, t: { lucky: 1 } }],
  ]),
  eve_cat: EV('길고양이 밥 주기', '매일 밤 주던 동네 길고양이 사료. 오늘따라 고양이들이 가까이 오지 않는다. 멀찍이서 털을 세우고 나를 본다. 깨어난 뒤로 처음이다.', [
    ['쪼그려 앉아 한 시간을 기다린다. 한 마리가 결국 다가온다', { t: { lucky: 1, charisma: 1 }, luck: 1 }],
    ['기운을 꾹 눌러 숨기는 법을 그 자리에서 익힌다', { talent: 1, t: { mana_sense: 1, longevity: 1 } }],
    ['사료만 두고 돌아선다. 이제 이런 거리감에 익숙해져야 한다', { t: { loner: 1 }, flag: 'hope_free' }],
    ['{friend}에게 밥 주는 일을 부탁한다. "당분간 네가 해 줘."', { friend: 15, flag: 'hope_kama' }],
  ]),
  eve_teacher: EV('옛 담임의 전화', '고등학교 담임 선생님에게서 전화가 왔다. 어떻게 알았는지 모르겠다. "뉴스 보고 너인 줄 알았다. …몸조심해라. 선생님 제자 중에 헌터 된 애가 셋인데, 지금 연락되는 건 하나다."', [
    ['"나머지 둘은요?" 묻는다', { talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama' }],
    ['"선생님, 저는 오래 연락드릴게요."', { t: { charisma: 1, lucky: 1 } }],
    ['"그 하나는 어디 길드예요?" 연락처를 받는다', { t: { merchant: 1 }, luck: 1, flag: 'hope_guild' }],
    ['대답 없이 듣기만 하다 끊는다. 밤새 잠이 안 온다', { t: { loner: 1, reckless: 1 } }],
  ]),
  eve_run: EV('한강 새벽 러닝', '새벽 다섯 시 한강. 러닝 동호회 사람들 사이에 섞여 뛴다. 5킬로, 10킬로. 숨이 차지 않는다. 동호회 회장이 뒤에서 소리친다. "거기 신입! 페이스 좀 맞춰요!"', [
    ['페이스를 맞추며 뒤처진 사람과 함께 뛴다', { t: { charisma: 1, iron_body: 1 }, flag: 'hope_free' }],
    ['참지 않고 끝까지 달린다. 하프 코스를 한 시간에 끊는다', { t: { quick: 1, berserk: 1 }, luck: 1 }],
    ['멈춰 서서 심장 소리를 듣는다. 이게 각성이구나', { talent: 1, t: { mana_sense: 1 } }],
    ['다음 주부터 혼자 뛰기로 한다. 눈에 띄면 피곤해진다', { t: { loner: 1, longevity: 1 }, flag: 'hope_kama' }],
  ]),
  eve_secondhand: EV('중고 거래', '시험 준비금이 모자라 중고 거래 앱에 게임기와 기타를 올렸다. 약속 장소 지하철역 3번 출구. 게임기를 사러 온 사람은 헌터 조끼를 입은 중년 아저씨다. 상자를 열어 보던 아저씨가 고개를 든다. "학생도 이번에 등록했지? 눈빛 보니 알겠네."', [
    ['"어떻게 아셨어요?" 아저씨 얘기를 한참 듣는다', { talent: 1, t: { mana_sense: 1 }, flag: 'hope_kama' }],
    ['"그럼 좀 깎아 드릴게요. 대신 첫 게이트 팁 하나만요."', { t: { merchant: 1, charisma: 1 }, luck: 1 }],
    ['기타는 팔지 않기로 한다. 이건 남겨 둔다', { t: { lucky: 1 }, friend: 5, flag: 'hope_free' }],
    ['돈만 받고 바로 돌아선다. 낯선 헌터와 엮이기 싫다', { t: { loner: 1, quick: 1 } }],
  ]),
  eve_memorial: EV('대붕괴 추모비', '시청 앞 대붕괴 추모비. 이름이 빽빽하게 새겨진 검은 돌. 매년 이맘때면 국화가 쌓인다. 처음으로, 이 돌 앞에서 다른 마음이 든다.', [
    ['국화 한 송이를 놓고 이름 하나하나를 읽는다', { t: { lucky: 1, mana_sense: 1 }, flag: 'hope_kama' }],
    ['"여기 이름 더 늘지 않게 할게요." 소리 내 말한다', { t: { charisma: 1, iron_body: 1 } }],
    ['추모비 뒤 공터에서 혼자 오래 서 있다', { talent: 1, t: { loner: 1 } }],
    ['옆에서 울던 낯선 아이에게 손수건을 건넨다', { luck: 1, t: { charisma: 1 }, flag: 'hope_free' }],
  ]),
});
PRO_EVE.push('eve_bath', 'eve_pcbang', 'eve_checkup', 'eve_rooftop', 'eve_lastshift', 'eve_karaoke', 'eve_fortune', 'eve_subway', 'eve_loan', 'eve_cat', 'eve_teacher', 'eve_run', 'eve_secondhand', 'eve_memorial');
