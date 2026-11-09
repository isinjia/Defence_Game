// ===== 각성 전야: 평범한 삶 출신과 생활형 각성 (docs/프롤로그_점검.md 4) =====
// "매번 극적일 필요 없다. 백수라서 백수 짓 하다가 각성할 수도 있다."
// - 새 출신 "평범한 삶": 도입은 사건이 아니라 하루 일과(늦잠, 라면, 엄마 잔소리, 알바 사장 눈치, 랭크전).
// - 생활형 각성 갈래 5개: 늦잠(nap) · 편의점(cvs) · 게임(game) · 늦깎이(bloom) · 일일 수련(quest). 정기 검진(late)도 생활형.
// - 속성은 생활 속 "그날 이후 이상한 일"(life_odd)에서 고른다. 갈래마다 첫 줄만 다르다.
// - 출신을 뽑을 때 평범한 삶이 30%쯤 나오게 해, 생활형 이야기가 전체의 30~40%가 되게 한다(ui_prologue).
// 속성 키(4-9 적용): life_odd 의 water=비 오는 날, wood=화분, holy=고양이, dark=밤눈.

BACKGROUNDS.push({ id: 'idle', name: '평범한 삶', desc: '특별할 것 없는 하루하루. 크레딧 300. 시간만은 많다: 수련 +10%.', region: 'suwon', money: 300, mods: { train: 0.1 } });

const LIFE_INTRO = (title, text, ch) => ({ title, text, choices: ch.map(([t, e, g, tr, next, extra]) => ({ text: t, e: e ? { [e]: 1 } : undefined, g, t: tr || {}, next, ...(extra || {}) })) });

Object.assign(PROLOGUE, {
  // ---------- 도입: 하루 일과 ----------
  idle_1: LIFE_INTRO('취준 3년 차의 오후', '눈을 뜨니 오후 두 시. 휴대폰엔 불합격 메일 두 통과 엄마의 문자 세 통. "밥은 먹었니" "이력서는" "너 오늘도 자니?"\n\n방바닥엔 어제 먹다 만 라면 그릇. 창밖에서 동네 꼬마들이 "헌터 놀이"를 한다.', [
    ['다시 눕는다. 오늘은 그냥 쉬는 날로 하자', 'water', { support: 1, esper: 1 }, { lucky: 1 }, 'nap_1'],
    ['라면 물부터 올린다. 일단 먹고 생각하자', 'fire', { fighter: 1, guard: 1 }, null, 'nap_1'],
    ['이력서 파일을 연다. 경력란이 텅 비어 있다', 'wood', { mage: 1, guard: 1 }, { genius: 1 }, 'late_1'],
    ['{friend}에게 "뭐 해?" 문자를 보낸다', 'holy', { support: 1, summon: 1 }, { charisma: 1 }, 'bloom_1', { friend: 10 }],
  ]),
  idle_2: LIFE_INTRO('편의점 야간', '새벽 세 시의 편의점. 손님은 한 시간째 없다. 폐기 바구니엔 유통기한이 막 지난 삼각김밥 네 개. 점장은 "먹어도 돼, 대신 말하지 마"라고 했었다.\n\n카운터 밑 작은 TV에서는 게이트 브레이크 속보가 흘러나온다. 남의 일 같다.', [
    ['폐기 삼각김밥을 하나 깐다. 참치마요다', 'fire', { fighter: 1, support: 1 }, null, 'cvs_1'],
    ['재고 정리를 한다. 진열대를 칼같이 맞춘다', 'wood', { guard: 1, mage: 1 }, { iron_body: 1 }, 'cvs_1'],
    ['CCTV 화면을 멍하니 본다. 화면 구석이 미세하게 일렁인다', 'water', { shadow: 1, esper: 1 }, { mana_sense: 1 }, 'cvs_1'],
    ['단골 술 취한 아저씨의 넋두리를 끝까지 들어 준다', 'holy', { support: 2 }, { charisma: 1 }, 'bloom_1'],
  ]),
  idle_3: LIFE_INTRO('공시생의 독서실', '노량진 독서실 23번 자리. 칸막이엔 "합격" 포스트잇이 바래 간다. 오늘의 목표: 행정법 3회독. 현실: 2시간째 같은 페이지.\n\n옆자리 공시생이 속삭인다. "들었어? 각성자 특채 생긴대. 시험 안 봐도 된대."', [
    ['형광펜을 쥐고 다시 읽는다. 각성은 남의 이야기다', 'water', { mage: 2 }, { genius: 1 }, 'quest_1'],
    ['몰래 휴대폰으로 각성자 특채 공고를 찾아본다', 'bolt', { esper: 1, shadow: 1 }, { lucky: 1 }, 'late_1'],
    ['독서실을 나와 계단을 뛰어 오르내린다. 머리가 안 돌아갈 땐 몸이다', 'fire', { fighter: 1, guard: 1 }, { iron_body: 1 }, 'quest_1'],
    ['책상에 엎드려 잔다. 꿈에서라도 합격하자', 'dark', { esper: 1, summon: 1 }, null, 'nap_1'],
  ]),
  idle_4: LIFE_INTRO('퇴사 첫 주', '사직서를 낸 지 일주일. 출근 알람은 껐는데 몸은 여전히 일곱 시에 눈을 뜬다. 할 일이 없다는 게 이렇게 이상한 줄 몰랐다.\n\n단톡방에선 전 팀장이 "다들 수고 많다"는 공지를 올렸다. 내 이름은 이미 빠져 있다.', [
    ['동네 헬스장 한 달 회원권을 끊는다', 'wood', { fighter: 1, guard: 1 }, { iron_body: 1 }, 'quest_1'],
    ['한낮의 공원 벤치에 앉아 아무것도 안 한다', 'water', { support: 1, esper: 1 }, { lucky: 1 }, 'nap_1'],
    ['퇴직금으로 게이밍 컴퓨터를 산다. 해 보고 싶던 게임이 있었다', 'bolt', { shooter: 1, esper: 1 }, { reckless: 1 }, 'game_1'],
    ['동창회 공지에 "참석"을 누른다. 오랜만이다', 'fire', { support: 1, fighter: 1 }, { charisma: 1 }, 'bloom_1'],
  ]),
  idle_5: LIFE_INTRO('랭크전', '새벽 네 시. 랭크전 9연패. 팀원은 탈주했고 상대는 "ez"를 친다. 모니터 불빛만 방을 비춘다.\n\n엄마가 문 너머에서 말한다. "너 그 게임 속 칼질하는 것만큼 현실에서 살아 봐라."', [
    ['한 판만 더. 이번엔 이긴다', 'fire', { fighter: 1, shooter: 1 }, { reckless: 1 }, 'game_1'],
    ['리플레이를 돌려 내 실수를 하나하나 분석한다', 'water', { mage: 1, shooter: 1 }, { genius: 1 }, 'game_1'],
    ['헤드셋을 벗고 창문을 연다. 새벽 공기가 차다', 'dark', { esper: 1, support: 1 }, null, 'nap_1'],
    ['길드원들에게 "오늘은 접는다" 하고 자러 간다', 'wood', { support: 1, guard: 1 }, { charisma: 1 }, 'quest_1'],
  ]),
  idle_6: LIFE_INTRO('치킨집 뒷주방', '부모님 치킨집 뒷주방. 튀김기 기름이 180도에서 끓는다. 오늘 주문 마흔두 건. 배달 기사는 둘 다 연락이 안 된다.\n\n아버지가 앞치마를 던져 준다. "네가 가. 오토바이 탈 줄 알지?"', [
    ['앞치마를 매고 튀김기 앞을 지킨다', 'fire', { fighter: 1, guard: 1 }, { iron_body: 1 }, 'cvs_1'],
    ['오토바이 키를 받는다. 마흔두 건, 다 돌린다', 'bolt', { shooter: 1, shadow: 1 }, { quick: 1 }, 'quest_1'],
    ['주문 순서를 동선대로 다시 짠다. 아버지가 눈을 크게 뜬다', 'water', { mage: 1, support: 1 }, { genius: 1 }, 'late_1'],
    ['단골 손님한테 서비스 콜라를 몰래 하나 더 넣는다', 'holy', { support: 2 }, { lucky: 1 }, 'bloom_1'],
  ]),
  idle_7: LIFE_INTRO('방구석 홈트', '"하루 30분, 따라만 하세요!" 유튜브 홈트 영상 14일 차. 오늘은 플랭크 3분. 1분 40초에 무너졌다.\n\n댓글창: "D-30 각성 준비 루틴 ㄱㄱ" "이거 하다가 진짜 각성한 사람 있음ㅋㅋ"', [
    ['다시 엎드린다. 3분 채운다', 'wood', { guard: 1, fighter: 1 }, { iron_body: 1 }, 'quest_1'],
    ['영상 속도를 1.5배로 올린다', 'bolt', { fighter: 1, shadow: 1 }, { reckless: 1 }, 'quest_1'],
    ['"진짜 각성한 사람" 댓글을 끝까지 찾아 읽는다', 'water', { esper: 1, mage: 1 }, { mana_sense: 1 }, 'quest_1'],
    ['오늘은 됐다. 매트 위에 대자로 눕는다', 'holy', { support: 1, summon: 1 }, null, 'nap_1'],
  ]),
  idle_8: LIFE_INTRO('서른둘의 동창회', '고등학교 동창회. 반장은 C급 헌터, 짝꿍은 길드 사무직, 맨 뒷자리 녀석은 무려 B급이다. 다들 각성 이야기뿐이다.\n\n누군가 묻는다. "넌 아직이야?" 소주잔을 내려놓는다. 아직이다. 서른둘에.', [
    ['"응, 아직." 웃으며 잔을 비운다', 'fire', { fighter: 1, support: 1 }, { charisma: 1 }, 'bloom_1'],
    ['B급 녀석에게 각성할 때 어땠는지 진지하게 묻는다', 'water', { mage: 1, esper: 1 }, { genius: 1 }, 'bloom_1'],
    ['화장실에 가서 거울 속 얼굴을 오래 본다', 'dark', { esper: 1, shadow: 1 }, null, 'late_1'],
    ['2차는 빠지고 혼자 걸어서 집에 간다', 'wood', { guard: 1, shadow: 1 }, { loner: 1 }, 'nap_1'],
  ]),

  // ---------- 생활형 갈래 ----------
  nap_1: { title: '낮잠에서 깨어나니', text: '낮잠에서 깼다. 천장에 손가락만 한 금이 가 있다. 어제는 없었다. 손끝이 계속 찌릿하다.\n\n엄마가 방문을 연다. "너 또 전기장판 켜 놓고 잤니? 집 두꺼비집 내려갔잖아!"',
    choices: [
      { text: '"아니거든!" 손을 내저었는데 형광등이 깜빡인다', g: { esper: 2 }, next: 'nap_odd' },
      { text: '금 간 천장을 가만히 올려다본다. 금이 숨을 쉬는 것 같다', g: { mage: 2 }, next: 'nap_odd' },
      { text: '아무 일 없는 척 다시 이불을 덮는다', g: { shadow: 2 }, next: 'nap_odd' },
      { text: '{friend}에게 사진을 보낸다. "이거 정상이냐"', g: { support: 2 }, friend: 5, next: 'nap_odd' },
      { text: '두꺼비집을 올리러 간다. 손이 닿기도 전에 스위치가 올라간다', g: { summon: 1, esper: 1 }, next: 'nap_odd' },
    ] },
  cvs_1: { title: '삼각김밥의 다음 날', text: '폐기 삼각김밥 탓인지, 그날 새벽 지독한 배탈이 났다. 하루를 꼬박 앓았다.\n\n다음 날 출근하자, 편의점 입구에 새로 설치된 관리국 무료 에테르 측정기가 당신이 지나갈 때마다 "삐-" 하고 운다. 점장이 고개를 갸웃한다. "고장 났나?"',
    choices: [
      { text: '측정기 앞을 몇 번 왔다 갔다 해 본다. 매번 운다', g: { esper: 2 }, next: 'cvs_odd' },
      { text: '측정기 뒷면을 열어 고장인지 직접 본다', g: { mage: 1, shooter: 1 }, next: 'cvs_odd' },
      { text: '측정기를 피해 뒷문으로 출근한다', g: { shadow: 2 }, next: 'cvs_odd' },
      { text: '점장에게 솔직히 말한다. "저 같아요"', g: { guard: 1, support: 1 }, next: 'cvs_odd' },
      { text: '진열대 상자를 번쩍 든다. 어제보다 훨씬 가볍다', g: { fighter: 2 }, next: 'cvs_odd' },
    ] },
  game_1: { title: '부서진 마우스', text: '10연패째. 화가 나서 마우스를 쥐었다. 콰직. 플라스틱이 가루가 됐다. 손바닥엔 상처 하나 없다.\n\n키보드 위에 남은 손자국이 살짝 그을려 있다. 디스코드에서 길드원이 묻는다. "님 왜 튕김?"',
    choices: [
      { text: '새 마우스를 꺼내 조심스럽게, 아주 조심스럽게 쥔다', g: { shooter: 2 }, next: 'game_odd' },
      { text: '"님들, 저 각성한 듯" 채팅을 친다', g: { support: 1, esper: 1 }, next: 'game_odd' },
      { text: '부서진 마우스 조각을 맞춰 보며 내 힘이 얼마나 되는지 계산한다', g: { mage: 2 }, next: 'game_odd' },
      { text: '게임 속 내 캐릭터 동작을 따라 해 본다. 몸이 그대로 움직인다', g: { fighter: 1, shadow: 1 }, next: 'game_odd' },
      { text: '컴퓨터를 끄고 밖으로 나가 동네 놀이터 철봉을 잡아 본다', g: { guard: 2 }, next: 'game_odd' },
    ] },
  bloom_1: { title: '늦게 온 것', text: '{?idle_8_go:동창회 2차 노래방, 차례가 돌아와 마이크를 잡았는데|그날 밤 혼자 집에 오는 길, 편의점 앞 파라솔에 앉았는데} 갑자기 숨이 막힌다. 몸 안에서 무언가 오래 닫혀 있던 문이 열린다.\n\n남들은 스무 살 전에 겪었다는 그 느낌. 서른둘에, 이런 데서, 아무 일도 없이.',
    choices: [
      { text: '"…드디어?" 혼자 웃음이 터진다', g: { support: 2 }, next: 'bloom_odd' },
      { text: '숨을 고르며 몸 구석구석에서 흐르는 것을 하나씩 짚어 본다', g: { mage: 1, esper: 1 }, next: 'bloom_odd' },
      { text: '아무에게도 말하지 않기로 한다. 늦은 만큼 조용히', g: { shadow: 2 }, next: 'bloom_odd' },
      { text: '{friend}에게 전화해 소리 지른다. "나 왔어! 나도 왔다고!"', g: { support: 1, summon: 1 }, friend: 10, next: 'bloom_odd' },
      { text: '파라솔 기둥을 잡고 일어선다. 기둥이 휜다', g: { fighter: 1, guard: 1 }, next: 'bloom_odd' },
    ] },
  quest_1: { title: '일일 수련 달성', text: '오늘도 했다. 별거 아닌 하루치 운동, 공부, 배달. 마지막 하나를 끝낸 순간 귓가에 "띵" 하는 소리가 났다. 진짜로.\n\n눈앞에 아무것도 없는데, 무언가 "달성"했다는 감각이 남는다. 다음 날도, 그다음 날도. 하루치를 끝낼 때마다 몸이 조금씩 가벼워진다.',
    choices: [
      { text: '하루치를 두 배로 늘린다. 띵 소리가 두 번 난다', g: { fighter: 2 }, next: 'quest_odd' },
      { text: '소리가 나는 조건을 노트에 적어 실험한다', g: { mage: 2 }, next: 'quest_odd' },
      { text: '아무도 모르게 매일 밤 동네를 한 바퀴씩 더 돈다', g: { shadow: 1, shooter: 1 }, next: 'quest_odd' },
      { text: '{friend}에게 같이 하자고 꼬신다', g: { support: 2 }, friend: 5, next: 'quest_odd' },
      { text: '띵 소리가 날 때마다 눈을 감고 그 너머의 무언가에 귀를 기울인다', g: { esper: 1, summon: 1 }, next: 'quest_odd' },
    ] },

  // ---------- 생활 속 이상한 일 = 속성 ----------
  life_odd: { title: '그날 이후 이상한 일', text: '그날 이후로 이상한 일이 하나둘 생긴다. 극적인 건 없다. 그냥, 생활이 조금씩 이상하다.\n\n그중에서도 가장 자주 일어나는 일은—',
    textBy: {
      arc_nap: '두꺼비집 사건 이후로 집에 이상한 일이 하나둘 생긴다. 엄마는 다 전기장판 탓이라고 한다. 극적인 건 없다. 그냥, 생활이 조금씩 이상하다.\n\n그중에서도 가장 자주 일어나는 일은—',
      arc_cvs: '측정기는 결국 "정상 작동"으로 판정 났다. 고장 난 건 나였다. 그날 이후로 편의점에서도, 집에서도 이상한 일이 생긴다.\n\n그중에서도 가장 자주 일어나는 일은—',
      arc_game: '마우스를 세 개째 부순 뒤로, 게임보다 현실이 더 이상해졌다.\n\n그중에서도 가장 자주 일어나는 일은—',
      arc_bloom: '서른둘에 온 것은 요란하지 않았다. 그냥 매일이 조금씩 이상해졌다.\n\n그중에서도 가장 자주 일어나는 일은—',
      arc_quest: '"띵" 소리가 쌓일수록 생활이 조금씩 이상해진다.\n\n그중에서도 가장 자주 일어나는 일은—',
    },
    choices: [
      { text: '라면 물을 올리면 불을 켜기도 전에 끓는다', e: { fire: 4 }, next: '' },
      { text: '휴대폰이 충전기 없이도 늘 100%다', e: { bolt: 4 }, next: '' },
      { text: '비 오는 날이면 몸이 가볍고, 우산 없이도 젖지 않는다', e: { water: 4 }, next: '' }, // 4-9: 수(水)
      { text: '방 안 화분이 미친 듯이 자라 창문을 덮는다', e: { wood: 4 }, next: '' }, // 4-9: 목(木)
      { text: '다리를 저는 동네 고양이가 손에 닿자 멀쩡히 뛰어간다', e: { holy: 4 }, next: '' }, // 4-9: 성(聖)
      { text: '밤에 불을 켜지 않아도 방 안이 대낮처럼 다 보인다', e: { dark: 4 }, next: '' }, // 4-9: 암(暗)
    ] },
  // 갈래별 마무리: 직업
  nap_2: { title: '느긋한 각성자', text: '두 달째, 엄마는 이제 전기장판 탓을 하지 않는다. 대신 관리국 등록 서류를 식탁 위에 올려 둔다. "백수보단 헌터가 낫지."\n\n서류의 "희망 직무" 칸이 비어 있다.', choices: 'life' },
  cvs_2: { title: '야간 알바 헌터', text: '점장은 결국 당신을 "에테르 경비 겸 알바"로 시급을 올려 줬다. 새벽 세 시, 편의점 앞에서 취객 대신 작은 괴수를 쫓아낸 날도 있었다.\n\n관리국 등록 서류의 "희망 직무" 칸이 비어 있다.', choices: 'life' },
  game_2: { title: '현실 랭크전', text: '게임 길드원들이 "현실에서도 파티 짜자"고 난리다. 손은 이제 마우스를 부수지 않는다. 대신 전혀 다른 것을 쥐고 싶다.\n\n관리국 등록 서류의 "희망 직무" 칸이 비어 있다.', choices: 'life' },
  bloom_2: { title: '늦깎이 등록', text: '관리국 등록 창구 직원이 서류를 두 번 본다. "서른둘에 첫 각성이요? …드물긴 한데, 없는 일은 아니에요." 옆 창구의 스무 살들이 힐끔거린다.\n\n"희망 직무" 칸이 비어 있다.', choices: 'life' },
  quest_2: { title: '하루치의 끝', text: '"띵" 소리는 이제 매일 일곱 번쯤 난다. 이게 각성이라는 건 관리국 측정기가 확인해 줬다. 측정관이 웃었다. "홈트로 각성한 사람은 처음 보네요."\n\n"희망 직무" 칸이 비어 있다.', choices: 'life' },
});

// 마무리 직업 선택지 (생활형 갈래 공통)
const LIFE_JOBS = [
  { text: '"방패요. 동네 지키는 거면 할 만할 것 같아서요."', g: { guard: 2 }, c: { guardian: 3 }, next: 'verdict' },
  { text: '"뭐든 베는 거요. 스트레스 풀리게."', g: { fighter: 2 }, c: { swordsman: 3 }, next: 'verdict_guild' },
  { text: '"멀리서 쏘는 거요. 게임에서도 원딜이었거든요."', g: { shooter: 2 }, c: { gunslinger: 3 }, next: 'verdict' },
  { text: '"다친 사람 돌보는 거요. 그건 잘할 것 같아요."', g: { support: 2 }, c: { healer: 3 }, next: 'verdict' },
  { text: '"조용히 다니는 거요. 원래 존재감이 없어서."', g: { shadow: 2 }, c: { thief: 3 }, next: 'verdict_street' },
  { text: '"머리 쓰는 거요. 공부는 질리게 했으니까."', g: { mage: 2 }, c: { elementalist: 3 }, next: 'verdict' },
  { text: '"남의 마음 읽는 거요. 알바 오래 하면 다 보여요."', g: { esper: 2 }, c: { telepath: 3 }, next: 'verdict_guild' },
  { text: '"뭘 부르는 거요. 고양이라도 좋으니."', g: { summon: 2 }, c: { tamer: 3 }, next: 'verdict' },
];
for (const id of ['nap_2', 'cvs_2', 'game_2', 'bloom_2', 'quest_2']) PROLOGUE[id].choices = LIFE_JOBS.map((c) => ({ ...c }));
// 속성 장면은 갈래마다 한 장씩 (첫 줄만 다르고 선택지는 같다) → 그 갈래의 마무리로
for (const a of ['nap', 'cvs', 'game', 'bloom', 'quest']) {
  const base = PROLOGUE.life_odd;
  PROLOGUE[`${a}_odd`] = { title: base.title, text: base.textBy['arc_' + a] || base.text, choices: base.choices.map((c) => ({ ...c, next: `${a}_2` })) };
}
delete PROLOGUE.life_odd;
// 다른 출신에서도 생활형 갈래로 가는 길 몇 개
for (const [key, arc] of Object.entries({ 'student_1:0': 'cvs', 'orphan_2:0': 'quest' })) {
  const [id, i] = key.split(':'); const ch = PROLOGUE[id] && PROLOGUE[id].choices[+i];
  if (ch) ch.next = `${arc}_1`;
}

PROLOGUE_START.idle = Array.from({ length: 8 }, (_, i) => `idle_${i + 1}`);
// 동창회에서 2차로 가지 않은 경우를 bloom_1 이 구분한다
PROLOGUE.idle_8.choices[0].flag = 'idle_8_go'; PROLOGUE.idle_8.choices[1].flag = 'idle_8_go';

// 출신 뽑기: 평범한 삶이 30%쯤, 나머지는 고르게
const PRO_BG_WEIGHT = { idle: 3 };
function proPickBg(rng = Math.random) {
  const list = BACKGROUNDS.filter((b) => PROLOGUE_START[b.id]).map((b) => b.id);
  const w = list.map((id) => PRO_BG_WEIGHT[id] || (7 / Math.max(1, list.length - 1)));
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { r -= w[i]; if (r < 0) return list[i]; }
  return list[0];
}
