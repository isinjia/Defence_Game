// ===== 게이트 크로니클: 각성 전야 (스토리로 시작하기) =====
// 출신은 무작위로 정해진다. 장면마다의 선택이 속성(e), 직업 계열(g), 직업(c), 특성(t), 재능(talent)에 점수를 쌓는다.
// {name} 플레이어, {friend} 소꿉친구 이름

const PROLOGUE = {
  // ---------- 출신별 도입 (출신마다 2장면) ----------
  chaebol_1: { title: '강남, 펜트하우스', text: '대리석 식탁 위로 샹들리에 빛이 쏟아진다. 아버지가 와인잔을 내려놓는다.\n\n"백호 시큐리티 지분 일부를 네 앞으로 돌렸다. 각성자가 아니어도 괜찮다. 각성자를 부리는 쪽에 서면 되니까."\n\n창밖, 강남 돔 너머로 게이트 하나가 희미하게 깜빡인다.',
    choices: [
      { text: '"전 부리는 쪽이 되기 싫어요." 자리를 박차고 일어난다', e: { fire: 2 }, g: { fighter: 2 }, t: { berserk: 1 }, next: 'chaebol_2' },
      { text: '고개를 끄덕이며 아버지의 계획을 듣는다', e: { steel: 2 }, g: { guard: 1, support: 1 }, t: { merchant: 2 }, next: 'chaebol_2' },
      { text: '대답 대신 창밖의 게이트를 오래 바라본다', e: { spirit: 2 }, g: { mage: 1, esper: 1 }, t: { mana_sense: 1 }, next: 'chaebol_2' },
    ] },
  chaebol_2: { title: '경호 실장', text: '집안 경호를 맡은 한 실장은 B급 헌터 출신이다. 아무도 없는 지하 주차장에서 그가 묻는다.\n\n"작은 회장님, 아니, {name}. 정말로 배우고 싶습니까? 회장님은 모르게 해야 합니다."',
    choices: [
      { text: '목검을 집어 든다', e: { fire: 1, steel: 1 }, g: { fighter: 3 }, c: { swordsman: 2, lancer: 1 }, next: 'common_1' },
      { text: '"사람을 지키는 법을 알려 주세요"', e: { steel: 2 }, g: { guard: 3 }, c: { guardian: 2 }, t: { iron_body: 1 }, next: 'common_1' },
      { text: '그의 총을 가리킨다', e: { bolt: 2 }, g: { shooter: 3 }, c: { gunslinger: 2 }, next: 'common_1' },
    ] },
  orphan_1: { title: '희망의 집', text: '보육원의 아침은 늘 전쟁이다. 동생 여섯의 도시락을 싸고, 열이 나는 원장 할머니께 죽을 쑤고 나면 해가 중천이다.\n\n냉장고가 비었다. 통장도 비었다.',
    choices: [
      { text: '오늘도 새벽 택배 상하차를 뛴다', e: { steel: 2 }, g: { guard: 1, fighter: 1 }, t: { iron_body: 2 }, next: 'orphan_2' },
      { text: '동생들을 먼저 먹이고 굶는다', e: { spirit: 1, ice: 1 }, g: { support: 2 }, t: { charisma: 1 }, talent: 1, next: 'orphan_2' },
      { text: '마트에서 몰래 몇 개 챙겨 나온다', e: { bolt: 2 }, g: { shadow: 3 }, t: { quick: 1, lucky: 1 }, next: 'orphan_2' },
    ] },
  orphan_2: { title: '철거 용역', text: '재개발 조합이 보낸 용역 깡패들이 보육원 대문을 걷어찬다. 동생들이 울며 당신 뒤에 숨는다. 할머니가 비틀거리며 나오신다.',
    choices: [
      { text: '대문 앞을 몸으로 막아선다', e: { fire: 1, steel: 1 }, g: { guard: 2, fighter: 1 }, t: { iron_body: 1 }, next: 'common_1' },
      { text: '우두머리와 차분히 협상한다', e: { spirit: 1, ice: 1 }, g: { support: 1, esper: 2 }, t: { charisma: 2 }, next: 'common_1' },
      { text: '뒷문으로 빠져나가 그들의 차량 블랙박스를 빼 온다', e: { bolt: 1, ice: 1 }, g: { shadow: 3 }, t: { quick: 1 }, next: 'common_1' },
    ] },
  soldier_1: { title: '휴전선, 새벽 3시', text: 'GOP 경계 근무. 철책 너머 북쪽 하늘에 보랏빛 줄이 그어진다. 통신 두절 구역에서 무언가 이쪽을 보고 있다.\n\n옆 초소 후임이 떨리는 목소리로 묻는다. "병장님… 저거 뭡니까?"',
    choices: [
      { text: '규정대로 즉시 상황 보고', e: { steel: 2 }, g: { guard: 2 }, t: { iron_body: 1 }, next: 'soldier_2' },
      { text: '야간 투시경을 들고 철책 쪽으로 간다', e: { fire: 2 }, g: { fighter: 2 }, t: { reckless: 1 }, next: 'soldier_2' },
      { text: '총구를 겨누고 숨을 고른다', e: { ice: 2 }, g: { shooter: 3 }, c: { sniper: 2 }, next: 'soldier_2' },
    ] },
  soldier_2: { title: '전역 신고', text: '전역하는 날. 위병소를 나서는데 자꾸 박 상병 얼굴이 떠오른다. 작년 게이트 경계 작전에서 돌아오지 못한 녀석.\n\n주머니 속 녀석의 군번줄이 차갑다.',
    choices: [
      { text: '"네 몫까지 싸운다." 헌터 등록 안내서를 챙긴다', e: { fire: 2 }, g: { fighter: 2 }, t: { berserk: 1 }, next: 'common_1' },
      { text: '녀석의 가족을 찾아가 군번줄을 전한다', e: { spirit: 1, ice: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'common_1' },
      { text: '모든 걸 잊으려 혼자 술을 마신다', e: { ice: 1 }, g: { shadow: 1, mage: 1 }, t: { loner: 2 }, next: 'common_1' },
    ] },
  subject_1: { title: '하얀 방', text: '꿈을 꾼다. 하얀 방, 하얀 가운, 손목의 바코드. "피험자 12번, 에테르 주입 7차." 바늘이 들어오고, 세상이 뒤집힌다.\n\n깨어나도 손목엔 여전히 바코드 흉터가 있다.',
    choices: [
      { text: '이를 악물고 고통을 견디는 기억', e: { steel: 2 }, g: { guard: 1, fighter: 1 }, t: { iron_body: 2 }, next: 'subject_2' },
      { text: '연구원의 생각이 들렸던 기억', e: { spirit: 3 }, g: { esper: 3 }, c: { telepath: 2 }, next: 'subject_2' },
      { text: '벽 너머로 몸이 미끄러졌던 기억', e: { bolt: 2 }, g: { esper: 2, shadow: 1 }, c: { teleporter: 2 }, next: 'subject_2' },
    ] },
  subject_2: { title: '보호소', text: '연구소가 폐쇄된 지 2년. 보호 시설에서 평범한 척 살고 있다. 그런데 요즘 손끝이 따끔거린다. 컵이 저절로 미끄러지고, 형광등이 깜빡인다.',
    choices: [
      { text: '아무에게도 들키지 않게 숨긴다', e: { ice: 2 }, g: { shadow: 2 }, t: { loner: 1 }, next: 'common_1' },
      { text: '밤마다 몰래 힘을 시험해 본다', e: { bolt: 1, spirit: 1 }, g: { esper: 2, mage: 1 }, c: { telekinetic: 2 }, talent: 1, next: 'common_1' },
      { text: '시설 의사에게 털어놓는다', e: { spirit: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'common_1' },
    ] },
  student_1: { title: '조별 과제', text: '대학 2학년, 교양 수업 조별 과제. 단톡방은 사흘째 조용하다. 마감은 내일 아침 9시.\n\n소꿉친구 {friend}만 "나 뭐 하면 돼?"라고 물어 온다.',
    choices: [
      { text: '역할을 나누고 전화를 돌린다', e: { spirit: 1, steel: 1 }, g: { support: 2, guard: 1 }, t: { charisma: 2 }, next: 'student_2' },
      { text: '그냥 혼자 밤새 다 한다', e: { ice: 2 }, g: { mage: 2 }, t: { loner: 1, mana_sense: 1 }, next: 'student_2' },
      { text: '{friend}랑 PC방으로 도망간다', e: { bolt: 2 }, g: { shadow: 1, shooter: 1 }, t: { lucky: 1 }, next: 'student_2' },
    ] },
  student_2: { title: '편의점 야간', text: '새벽 2시 편의점. 취한 손님이 계산대를 내리치며 소리친다. "야, 내가 누군지 알아? 나 D급 헌터야!" 팔뚝에 협회 문신이 보인다.',
    choices: [
      { text: '눈을 똑바로 보며 "나가 주세요"', e: { fire: 2 }, g: { fighter: 2 }, t: { reckless: 1 }, next: 'common_1' },
      { text: '꾹 참고 정중하게 응대한다', e: { steel: 1, ice: 1 }, g: { guard: 2 }, t: { iron_body: 1 }, next: 'common_1' },
      { text: '몰래 휴대폰으로 녹화해 신고한다', e: { bolt: 1 }, g: { shooter: 1, shadow: 1 }, t: { quick: 1 }, next: 'common_1' },
    ] },

  // ---------- 공통 ----------
  common_1: { title: '대붕괴 20주기', text: '3월 1일. 대붕괴 20주기 추모일. 방송은 하루 종일 그날의 영상을 튼다. 제주 하늘이 찢어지던 장면.\n\n{friend}에게서 문자가 온다. "광화문 추모식 같이 갈래?"',
    choices: [
      { text: '함께 촛불을 들러 간다', e: { spirit: 1, fire: 1 }, g: { support: 1, east: 1 }, t: { charisma: 1 }, next: 'common_2' },
      { text: '혼자 방에서 그날의 기록을 찾아본다', e: { ice: 1, spirit: 1 }, g: { mage: 2 }, t: { mana_sense: 1 }, next: 'common_2' },
      { text: '"그런 거 안 가." 헬스장으로 간다', e: { fire: 1, steel: 1 }, g: { fighter: 2 }, t: { iron_body: 1 }, next: 'common_2' },
    ] },
  common_2: { title: '소문', text: '헌터 커뮤니티에 글이 올라왔다. "우리 동네 폐상가 지하에 미등록 게이트 열림ㅋㅋ 쬐끄만 거라 F급도 안 될 듯"\n\n{friend}가 링크를 보내며 덧붙인다. "가 볼래? 진짜면 신고 포상금 나온대."',
    choices: [
      { text: '"가 보자." 손전등을 챙긴다', e: { fire: 1 }, g: { fighter: 1, shadow: 1 }, t: { reckless: 1 }, next: 'path_explore' },
      { text: '"위험해." 협회에 신고만 한다', e: { steel: 1 }, g: { guard: 1, support: 1 }, next: 'path_report' },
      { text: '"관심 없어." 일찍 잠자리에 든다', e: { ice: 1 }, g: { mage: 1 }, next: 'path_home' },
    ] },
  path_explore: { title: '폐상가 지하', text: '곰팡내 나는 지하 주차장. 천장에 손바닥만 한 균열이 떠 있다. 보랏빛이 숨 쉬듯 커졌다 작아진다.\n\n{friend}가 소매를 붙잡는다. "야… 이거 점점 커지는 거 같은데?"',
    choices: [
      { text: '앞장서서 균열에 다가간다', e: { fire: 2 }, g: { fighter: 2 }, c: { berserker: 1 }, next: 'break_1' },
      { text: '{friend}의 손을 잡고 뒤로 물러선다', e: { spirit: 1, steel: 1 }, g: { guard: 1, support: 1 }, next: 'break_1' },
      { text: '휴대폰으로 균열을 촬영한다', e: { bolt: 2 }, g: { shooter: 1, esper: 1 }, t: { lucky: 1 }, next: 'break_1' },
    ] },
  path_report: { title: '무시당한 신고', text: '협회 콜센터 직원이 하품 섞인 목소리로 말한다. "네, 접수됐고요. F급 이하는 대기 순번이 3주예요."\n\n그날 밤, 창밖에서 사이렌이 울린다. 폐상가 쪽 하늘이 보랏빛으로 물들었다.',
    choices: [
      { text: '그럴 줄 알았다. 운동화를 신고 뛰어나간다', e: { fire: 1, bolt: 1 }, g: { fighter: 1, guard: 1 }, next: 'break_1' },
      { text: '{friend}에게 전화부터 건다', e: { spirit: 1, bolt: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'break_1' },
      { text: '대피소로 가는 사람들을 안내한다', e: { steel: 2 }, g: { guard: 2 }, next: 'break_1' },
    ] },
  path_home: { title: '갈라진 하늘', text: '잠결에 창문이 덜컹거린다. 눈을 뜨자 방 안이 보랏빛이다. 창밖, 폐상가 쪽 하늘이 찢어져 있다. 휴대폰에 재난 문자가 쏟아진다.\n\n[긴급] 게이트 브레이크 발생. 즉시 대피하십시오.',
    choices: [
      { text: '{friend}의 집 쪽으로 달린다', e: { fire: 1, spirit: 1 }, g: { support: 1, fighter: 1 }, next: 'break_1' },
      { text: '침착하게 비상 가방을 챙긴다', e: { ice: 2 }, g: { mage: 1, guard: 1 }, t: { mana_sense: 1 }, next: 'break_1' },
      { text: '창밖을 멍하니 바라본다. 저 빛이 부르는 것 같다', e: { spirit: 1, ice: 1 }, g: { esper: 1, east: 1 }, next: 'break_1' },
    ] },
  break_1: { title: '게이트 브레이크', text: '골목으로 괴수들이 쏟아져 나온다. 개만 한 것, 사람만 한 것, 그리고 2층 높이의 무언가.\n\n버스 정류장 아래, 일곱 살쯤 된 아이가 넘어져 울고 있다. 괴수 하나가 고개를 돌린다.',
    choices: [
      { text: '아이에게 달려가 끌어안는다', e: { steel: 2 }, g: { guard: 3 }, c: { paladin: 1, guardian: 1 }, t: { iron_body: 1 }, next: 'break_2' },
      { text: '돌을 던져 괴수를 자기 쪽으로 유인한다', e: { fire: 1, bolt: 1 }, g: { fighter: 1, shadow: 2 }, t: { quick: 1 }, next: 'break_2' },
      { text: '"여기요!" 주변 어른들을 큰 소리로 부른다', e: { spirit: 1 }, g: { support: 2, summon: 1 }, t: { charisma: 1 }, next: 'break_2' },
    ] },
  break_2: { title: '쓰러진 헌터', text: '골목 끝에 출동한 헌터가 쓰러져 있다. E급 배지. 피가 멎지 않는다. 그가 손을 뻗어 떨어진 장비를 가리킨다.\n\n"…쓸 줄 알면… 써…"',
    choices: [
      { text: '에테르 블레이드를 줍는다', e: { fire: 1 }, g: { fighter: 2 }, c: { swordsman: 2, dualblade: 1 }, next: 'break_3' },
      { text: '권총을 줍는다', e: { bolt: 1 }, g: { shooter: 2 }, c: { gunslinger: 2, archer: 1 }, next: 'break_3' },
      { text: '그의 품에서 빛나는 부적 뭉치를 꺼낸다', e: { spirit: 1 }, g: { east: 3 }, c: { taoist: 2, shaman: 1 }, next: 'break_3' },
      { text: '아무것도 줍지 않는다. 그의 상처부터 누른다', e: { ice: 1 }, g: { support: 3 }, c: { healer: 2 }, next: 'break_3' },
    ] },
  break_3: { title: '마주침', text: '2층 높이의 괴수가 골목을 막아선다. 비늘 사이로 용암 같은 빛이 흐른다. 뒤에는 아이와 {friend}가 있다.\n\n도망칠 곳은 없다.',
    choices: [
      { text: '정면으로 마주 선다. 이상하게 손바닥이 뜨겁다', e: { fire: 3 }, g: { fighter: 1 }, next: 'break_4' },
      { text: '괴수의 움직임을 읽는다. 머리가 차갑게 식는다', e: { ice: 3 }, g: { mage: 1, shooter: 1 }, next: 'break_4' },
      { text: '번개처럼 옆으로 몸을 던진다', e: { bolt: 3 }, g: { shadow: 1 }, next: 'break_4' },
      { text: '발을 땅에 박는다. 절대 비켜서지 않겠다', e: { steel: 3 }, g: { guard: 1 }, next: 'break_4' },
      { text: '눈을 감는다. 괴수의 분노가 들린다', e: { spirit: 3 }, g: { esper: 1 }, next: 'break_4' },
    ] },
  break_4: { title: '어둠', text: '괴수의 꼬리가 옆구리를 후려쳤다. 몸이 벽에 처박힌다. 숨이 쉬어지지 않는다. 세상이 조용해진다.\n\n어둠 속에서 누군가 묻는다.\n\n"무엇을 원하나."',
    choices: [
      { text: '"전부 부숴 버릴 힘."', e: { fire: 2 }, g: { fighter: 3 }, c: { berserker: 2 }, t: { berserk: 1 }, next: 'awaken' },
      { text: '"뒤에 있는 사람들을 지킬 힘."', e: { steel: 2 }, g: { guard: 3 }, c: { guardian: 1, paladin: 1 }, next: 'awaken' },
      { text: '"살아남을 힘. 그거면 돼."', e: { bolt: 1, ice: 1 }, g: { shadow: 3 }, c: { assassin: 2, thief: 1 }, t: { lucky: 1 }, next: 'awaken' },
      { text: '"이게 대체 뭔지 이해하고 싶다."', e: { ice: 1, spirit: 1 }, g: { mage: 3 }, c: { elementalist: 2 }, t: { genius: 1 }, talent: 1, next: 'awaken' },
      { text: '"혼자가 아니면 좋겠다."', e: { spirit: 1, bolt: 1 }, g: { summon: 3 }, c: { summoner: 1, tamer: 2 }, next: 'awaken' },
    ] },
  awaken: { title: '각성', text: '심장이 다시 뛴다. 아니, 무언가 다른 것이 뛴다. 혈관을 따라 낯선 힘이 쏟아진다.\n\n당신은 일어선다.',
    choices: [
      { text: '온몸이 불길처럼 타오른다', e: { fire: 3 }, next: 'first_fight' },
      { text: '살갗 위로 전류가 튄다', e: { bolt: 3 }, next: 'first_fight' },
      { text: '숨결이 하얗게 얼어붙는다', e: { ice: 3 }, next: 'first_fight' },
      { text: '피부가 강철처럼 단단해진다', e: { steel: 3 }, next: 'first_fight' },
      { text: '수많은 목소리가 머릿속에 울린다', e: { spirit: 3 }, next: 'first_fight' },
    ] },
  first_fight: { title: '첫 싸움', text: '괴수가 다시 덤벼든다. 하지만 이번엔 보인다. 놈의 움직임이, 빈틈이, 그리고 내 안의 힘을 쓰는 법이.',
    choices: [
      { text: '맨몸으로 파고들어 주먹을 꽂는다', g: { fighter: 2 }, c: { monk: 3 }, next: 'aftermath' },
      { text: '거리를 벌리고 힘을 쏘아 보낸다', g: { mage: 1, shooter: 1, esper: 1 }, c: { elementalist: 1, telekinetic: 1 }, next: 'aftermath' },
      { text: '그림자처럼 등 뒤로 돌아 급소를 찌른다', g: { shadow: 3 }, c: { assassin: 2 }, next: 'aftermath' },
      { text: '{friend}와 사람들에게 외친다. "내가 신호하면 동시에!"', g: { support: 2, summon: 1 }, c: { bard: 2 }, t: { charisma: 1 }, next: 'aftermath' },
      { text: '괴수의 눈을 똑바로 보며 "멈춰"라고 명령한다', g: { esper: 2, summon: 1 }, c: { telepath: 1, tamer: 1 }, next: 'aftermath' },
    ] },
  aftermath: { title: '쓰러진 괴수', text: '괴수가 무너진다. 거리가 조용해진다. 아이가 울음을 터뜨리고, {friend}가 다리에 힘이 풀려 주저앉는다.\n\n멀리서 협회 진압팀의 헬기 소리가 들린다. 손이 떨린다. 이게 내가 한 일인가.',
    choices: [
      { text: '{friend}에게 다가가 손을 내민다', t: { charisma: 1 }, friend: 15, next: 'hospital' },
      { text: '괴수의 사체에서 빛나는 코어를 뽑아 든다', t: { merchant: 1 }, g: { shadow: 1 }, next: 'hospital' },
      { text: '쓰러진 헌터에게 달려간다', g: { support: 1 }, c: { healer: 1, priest: 2 }, next: 'hospital' },
    ] },
  hospital: { title: '헌터 전문 병원', text: '하얀 천장. 소독약 냄새. 옆 침대에서 붕대를 감은 노인이 웃는다.\n\n"며칠 만에 깼구먼. 젊은이 덕에 우리 손주가 살았어. 각성 직후엔 몸이 제멋대로일 거야. 잘 다스려."',
    choices: [
      { text: '노인에게 에테르 다스리는 법을 묻는다', talent: 1, t: { mana_sense: 1 }, g: { east: 1 }, next: 'night_dream' },
      { text: '링거를 뽑고 바로 몸을 움직여 본다', t: { reckless: 1, iron_body: 1 }, g: { fighter: 1 }, next: 'night_dream' },
      { text: '창밖을 보며 조용히 생각을 정리한다', t: { loner: 1 }, g: { mage: 1 }, next: 'night_dream' },
    ] },
  night_dream: { title: '병실의 밤', text: '그날 밤, 이상한 꿈을 꾼다. 끝없는 벌판에 무언가가 서 있다. 그것이 당신을 향해 천천히 고개를 돌린다.',
    choices: [
      { text: '빛으로 된 짐승. 다가와 손을 핥는다', e: { bolt: 1 }, g: { summon: 3 }, c: { summoner: 2, tamer: 2 }, next: 'rooftop' },
      { text: '방울을 든 무녀. 춤을 추며 무언가를 부른다', e: { spirit: 2 }, g: { east: 3 }, c: { shaman: 3 }, next: 'rooftop' },
      { text: '거꾸로 도는 거대한 시계', e: { ice: 1, bolt: 1 }, g: { mage: 2, esper: 1 }, c: { chronomancer: 3, seer: 2 }, talent: 1, next: 'rooftop' },
      { text: '구름을 뚫고 선 거인', e: { steel: 2 }, g: { guard: 3 }, c: { giant: 3 }, t: { iron_body: 1 }, next: 'rooftop' },
      { text: '해골들이 무릎 꿇은 왕좌', e: { spirit: 1, ice: 1 }, g: { summon: 2, mage: 1 }, c: { necromancer: 3, warlock: 2 }, next: 'rooftop' },
    ] },
  rooftop: { title: '병원 옥상', text: '퇴원 전날 밤, 몰래 옥상에 올라간다. 아무도 없다. 손을 펼친다. 이번엔 의지대로 힘을 꺼내 볼 생각이다.',
    choices: [
      { text: '두 손에 칼날 같은 기운을 모은다', g: { fighter: 2 }, c: { dualblade: 3, swordmonk: 2 }, next: 'friend_visit' },
      { text: '멀리 옥탑 물탱크를 겨눠 한 점으로 쏜다', g: { shooter: 3 }, c: { archer: 2, sniper: 3 }, next: 'friend_visit' },
      { text: '그림자 속으로 녹아들었다 나온다', g: { shadow: 2, esper: 1 }, c: { teleporter: 3, assassin: 1 }, next: 'friend_visit' },
      { text: '손끝에서 녹색 독기가 피어오른다', g: { shadow: 3 }, c: { poisoner: 3 }, next: 'friend_visit' },
      { text: '빈 공간에 빛의 벽을 세운다', g: { mage: 2, guard: 1 }, c: { warder: 3 }, next: 'friend_visit' },
      { text: '주머니 속 약병들이 반응하며 끓어오른다', g: { support: 2 }, c: { alchemist: 3 }, t: { mana_sense: 1 }, next: 'friend_visit' },
    ] },
  friend_visit: { title: '병문안', text: '{friend}가 귤 한 봉지를 들고 왔다. 눈이 퉁퉁 부어 있다.\n\n"너 진짜… 바보야? 죽는 줄 알았잖아." 그러다 작게 덧붙인다. "…고마워. 근데 이제 너 헌터 되는 거야?"',
    choices: [
      { text: '"응. 이번엔 내가 지킬 차례야."', friend: 20, t: { charisma: 1 }, next: 'measure' },
      { text: '"모르겠어. 좀 무서워."', friend: 10, talent: 1, next: 'measure' },
      { text: '"너도 각성하면 같이 하자."', friend: 25, g: { summon: 1, support: 1 }, next: 'measure' },
    ] },
  measure: { title: '관리국 측정실', text: '국가 각성자 관리국 지부. 원통형 측정기 안에 들어선다. 기술자가 말한다. "힘 빼시고요. 에테르를 자연스럽게 흘려 보내세요."\n\n유리 너머로 수십 명의 신규 각성자가 순번을 기다린다.',
    choices: [
      { text: '숨을 고르고 차분히 흘려 보낸다', talent: 1, next: 'verdict' },
      { text: '있는 힘껏 쏟아붓는다', luck: 1, t: { reckless: 1 }, next: 'measure_burst' },
      { text: '일부러 힘을 숨긴다', t: { lucky: 1 }, g: { shadow: 1 }, next: 'verdict' },
    ] },
  measure_burst: { title: '측정기 폭주', text: '측정기 계기판이 붉게 치솟더니 퍽 소리와 함께 화면이 꺼진다. 기술자들이 웅성거린다.\n\n"이거… 재측정해야겠는데요? 아니, 잠깐만. 이 수치 다시 띄워 봐."',
    choices: [
      { text: '태연한 척한다', luck: 2, next: 'verdict' },
      { text: '"죄송합니다…" 고개를 숙인다', talent: 1, next: 'verdict' },
    ] },
  verdict: { title: '판정', text: '심사관이 결과지를 넘긴다. "축하합니다. 정식 각성자로 등록됩니다. 등급은 F. 다들 F에서 시작해요."\n\n그가 펜을 멈춘다. "마지막 질문입니다. 헌터가 되려는 이유가 뭡니까?"',
    choices: [
      { text: '"사람을 지키고 싶어서요."', t: { charisma: 1 }, g: { guard: 1 }, next: 'first_morning' },
      { text: '"돈이요. 솔직히."', t: { merchant: 2 }, next: 'first_morning' },
      { text: '"얼마나 강해질 수 있는지 알고 싶어서요."', talent: 1, t: { berserk: 1 }, g: { fighter: 1 }, next: 'first_morning' },
      { text: '"게이트가 왜 열렸는지 알아내려고요."', t: { mana_sense: 1 }, g: { mage: 1, esper: 1 }, next: 'first_morning' },
    ] },
  first_morning: { title: '첫 아침', text: '협회 등록증이 나왔다. 손바닥만 한 카드에 이름과 F라는 글자가 박혀 있다.\n\n휴대폰이 울린다. {friend}다. "오늘 첫 출근이지? 파이팅. 살아서 와."\n\n문을 연다. 게이트가 숨 쉬는 도시로.',
    choices: [{ text: '첫발을 내딛는다', next: null }] },
};

const PROLOGUE_START = { chaebol: 'chaebol_1', orphan: 'orphan_1', soldier: 'soldier_1', subject: 'subject_1', student: 'student_1' };

// 쌓인 점수로 각성 결과를 정한다
function resolvePrologue(sc, rng = Math.random) {
  const top = (o, keys) => { let best = keys[0], bv = -1; for (const k of keys) { const v = (o[k] || 0) + rng() * 0.5; if (v > bv) { bv = v; best = k; } } return best; };
  const element = top(sc.e, ELEMENT_KEYS);
  const talent = Math.max(1, Math.min(10, 4 + (sc.talent || 0) + Math.floor(rng() * 3) - 1));
  const luck = (sc.luck || 0) + talent * 0.4;
  // 직업: 가장 높은 계열에서, 직업 점수와 희귀도 운을 함께 본다
  const groups = Object.keys(CLASS_GROUPS).filter((g) => g !== 'hidden');
  const grp = top(sc.g, groups);
  const pool = CLASSES.filter((c) => c.g === grp && c.r < 3);
  const rare = [10, 4 + luck * 0.6, 1 + luck * 0.4];
  const weights = pool.map((c) => rare[c.r] * (1 + (sc.c[c.id] || 0) * 1.5));
  let r = rng() * weights.reduce((a, b) => a + b, 0), best = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r < 0) { best = pool[i]; break; } }
  // 특성: 점수 높은 순으로 3개 (서로 충돌하는 특성은 제외)
  const clash = { genius: 'slow_learner', slow_learner: 'genius', lucky: 'cursed', cursed: 'lucky', charisma: 'loner', loner: 'charisma' };
  const traits = [];
  const ranked = Object.entries(sc.t).sort((a, b) => b[1] - a[1] + (rng() - 0.5) * 0.3).map(([k]) => k);
  for (const id of ranked) { if (traits.length >= 3) break; if (clash[id] && traits.includes(clash[id])) continue; if (traitById(id)) traits.push(id); }
  while (traits.length < 3) { const t = TRAITS[Math.floor(rng() * TRAITS.length)].id; if (!traits.includes(t) && !(clash[t] && traits.includes(clash[t]))) traits.push(t); }
  return { element, talent, cls: best.id, traits };
}
