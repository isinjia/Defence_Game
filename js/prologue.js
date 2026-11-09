// ===== 게이트 크로니클: 각성 전야 (스토리로 시작하기) =====
// 출신은 무작위로 정해지고, 출신마다 10가지 사연 중 하나로 시작한다. 도입에서 고른 선택에 따라 13가지 각성 이야기 중 하나로 이어진다. 어느 경로든 선택은 8번 이하. 장면마다의 선택이 속성(e), 직업 계열(g), 직업(c), 특성(t), 재능(talent)에 점수를 쌓는다.
// {name} 플레이어, {friend} 소꿉친구 이름

const PROLOGUE = {
  // ---------- 1. 출신별 도입 (출신마다 1장면) ----------
  chaebol_1: { title: '강남, 펜트하우스', text: '대리석 식탁 위로 샹들리에 빛이 쏟아진다. 아버지가 와인잔을 내려놓는다.\n\n"백호 시큐리티 지분 일부를 네 앞으로 돌렸다. 각성자가 아니어도 괜찮다. 각성자를 부리는 쪽에 서면 되니까."\n\n창밖, 강남 돔 너머로 게이트 하나가 희미하게 깜빡인다. 그날 밤 {friend}에게서 문자가 온다. "요즘 좀 이상하지 않아? 뉴스 봤어?"',
    choices: [
      { text: '"전 부리는 쪽이 되기 싫어요." 자리를 박차고 일어난다', e: { fire: 1 }, g: { fighter: 2 }, c: { swordsman: 1 }, t: { berserk: 1 }, next: 'gate_break' },
      { text: '고개를 끄덕이며 아버지의 계획을 듣는다', e: { steel: 1 }, g: { guard: 1, support: 1 }, t: { merchant: 2 }, next: 'gate_break' },
      { text: '대답 대신 창밖의 게이트를 오래 바라본다', e: { spirit: 1 }, g: { mage: 1, esper: 1 }, t: { mana_sense: 1 }, next: 'gate_break' },
      { text: '경호 실장의 총을 떠올린다. 배워 두고 싶다', e: { bolt: 1 }, g: { shooter: 2 }, c: { gunslinger: 1 }, t: { quick: 1 }, next: 'gate_break' },
    ] },
  orphan_1: { title: '희망의 집', text: '보육원의 아침은 늘 전쟁이다. 동생 여섯의 도시락을 싸고, 열이 나는 원장 할머니께 죽을 쑤고 나면 해가 중천이다. 냉장고도, 통장도 비었다.\n\n오후에는 재개발 용역들이 대문을 걷어차고 갔다. 저녁 무렵 {friend}이(가) 찾아와 귤 봉지를 내민다. "또 굶었지? 먹어."',
    choices: [
      { text: '대문 앞을 몸으로 막아섰던 손이 아직 떨린다', e: { steel: 1 }, g: { guard: 2 }, t: { iron_body: 2 }, next: 'gate_break' },
      { text: '동생들을 먼저 먹이고 오늘도 굶는다', e: { ice: 1 }, g: { support: 2 }, t: { charisma: 1 }, talent: 1, next: 'gate_break' },
      { text: '용역 차량의 블랙박스를 몰래 빼 온다', e: { bolt: 1 }, g: { shadow: 2 }, c: { thief: 1 }, t: { quick: 1, lucky: 1 }, next: 'gate_break' },
    ] },
  soldier_1: { title: '전역 신고', text: '전역하는 날. 위병소를 나서는데 자꾸 박 상병 얼굴이 떠오른다. 작년 게이트 경계 작전에서 돌아오지 못한 녀석. 주머니 속 녀석의 군번줄이 차갑다.\n\n집에 오니 {friend}이(가) 기다리고 있다. "전역 축하해. 이제 뭐 할 거야?"',
    choices: [
      { text: '"네 몫까지 싸운다." 헌터 등록 안내서를 챙긴다', e: { fire: 1 }, g: { fighter: 2 }, c: { lancer: 1 }, t: { berserk: 1 }, next: 'gate_break' },
      { text: '녀석의 가족을 찾아가 군번줄을 전한다', e: { spirit: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'gate_break' },
      { text: '총구를 겨누던 감각을 떠올리며 숨을 고른다', e: { ice: 1 }, g: { shooter: 2 }, c: { sniper: 1 }, t: { loner: 1 }, next: 'gate_break' },
    ] },
  subject_1: { title: '하얀 방', text: '꿈을 꾼다. 하얀 방, 하얀 가운, 손목의 바코드. "피험자 12번, 에테르 주입 7차." 바늘이 들어오고, 세상이 뒤집힌다.\n\n연구소가 폐쇄된 지 2년. 깨어나도 손목엔 바코드 흉터가 있고, 요즘은 형광등이 저절로 깜빡인다. {friend}이(가) 그 흉터를 보고도 모른 척 웃어 준다.',
    choices: [
      { text: '이를 악물고 고통을 견디던 기억', e: { steel: 1 }, g: { guard: 1, fighter: 1 }, t: { iron_body: 2 }, next: 'gate_break' },
      { text: '연구원의 생각이 들렸던 기억', e: { spirit: 1 }, g: { esper: 2 }, c: { telepath: 2 }, next: 'gate_break' },
      { text: '벽 너머로 몸이 미끄러졌던 기억', e: { bolt: 1 }, g: { esper: 1, shadow: 1 }, c: { teleporter: 2 }, next: 'gate_break' },
      { text: '아무 기억도 없는 척, 힘을 숨기며 산다', e: { ice: 1 }, g: { shadow: 2 }, c: { telekinetic: 1 }, t: { loner: 1 }, next: 'gate_break' },
    ] },
  student_1: { title: '편의점 야간', text: '대학 2학년. 조별 과제는 혼자 떠안았고, 새벽에는 편의점 야간 근무다. 취한 손님이 계산대를 내리치며 소리친다. "나 D급 헌터야!"\n\n손님이 나가고 나서야 {friend}의 문자를 본다. "살아 있냐? 내일 밥 먹자."',
    choices: [
      { text: '눈을 똑바로 보며 "나가 주세요"라고 했었다', e: { fire: 1 }, g: { fighter: 2 }, t: { reckless: 1 }, next: 'gate_break' },
      { text: '과제를 하며 게이트 논문을 뒤적이던 참이다', e: { ice: 1 }, g: { mage: 2 }, t: { genius: 1, mana_sense: 1 }, next: 'gate_break' },
      { text: '몰래 휴대폰으로 녹화해 신고해 두었다', e: { bolt: 1 }, g: { shooter: 1, shadow: 1 }, t: { quick: 1 }, next: 'gate_break' },
      { text: '{friend}에게 바로 전화를 건다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, t: { charisma: 1 }, friend: 5, next: 'gate_break' },
    ] },

  // ---------- 2. 게이트 브레이크 ----------
  gate_break: { title: '게이트 브레이크', text: '재난 문자가 쏟아진다. [긴급] 게이트 브레이크 발생. 즉시 대피하십시오.\n\n{friend}와(과) 함께 골목에 나서자 괴수들이 쏟아져 나온다. 버스 정류장 아래, 일곱 살쯤 된 아이가 넘어져 울고 있다. 괴수 하나가 고개를 돌린다.',
    choices: [
      { text: '아이에게 달려가 끌어안는다', e: { steel: 1 }, g: { guard: 2 }, c: { paladin: 1, guardian: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '돌을 던져 괴수를 자기 쪽으로 유인한다', e: { bolt: 1 }, g: { shadow: 1, fighter: 1 }, t: { quick: 1 }, next: 'gear' },
      { text: '"여기요!" 주변 어른들을 큰 소리로 부른다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, t: { charisma: 1 }, next: 'gear' },
      { text: '{friend}에게 아이를 맡기고 괴수 앞을 막아선다', e: { fire: 1 }, g: { fighter: 2 }, t: { reckless: 1 }, friend: 10, next: 'gear' },
      { text: '괴수의 걸음을 세며 빈틈을 기다린다', e: { ice: 1 }, g: { mage: 1, shooter: 1 }, t: { mana_sense: 1 }, next: 'gear' },
    ] },

  // ---------- 3. 쓰러진 헌터 ----------
  gear: { title: '쓰러진 헌터', text: '몇 걸음 앞에 출동한 헌터가 쓰러져 있다. E급 배지. 피가 멎지 않는다. 그가 손을 뻗어 흩어진 장비를 가리킨다.\n\n"…쓸 줄 알면… 써…"',
    choices: [
      { text: '에테르 블레이드를 줍는다', g: { fighter: 2 }, c: { swordsman: 2, dualblade: 1 }, next: 'voice' },
      { text: '권총을 줍는다', g: { shooter: 2 }, c: { gunslinger: 2, archer: 1 }, next: 'voice' },
      { text: '그의 품에서 빛나는 부적 뭉치를 꺼낸다', g: { east: 2 }, c: { taoist: 2, shaman: 1 }, next: 'voice' },
      { text: '아무것도 줍지 않는다. 그의 상처부터 누른다', g: { support: 2 }, c: { healer: 2, priest: 1 }, talent: 1, next: 'voice' },
      { text: '찌그러진 방패를 들어 올린다', g: { guard: 2 }, c: { guardian: 2 }, t: { iron_body: 1 }, next: 'voice' },
      { text: '굴러다니는 마력석을 주머니에 넣는다', g: { mage: 1, support: 1 }, c: { alchemist: 1, elementalist: 1 }, t: { merchant: 1 }, next: 'voice' },
    ] },

  // ---------- 4. 어둠 속 목소리 (직업 계열) ----------
  voice: { title: '어둠', text: '2층 높이의 괴수가 앞길을 막아선다. 꼬리가 옆구리를 후려치고, 몸이 벽에 처박힌다. 숨이 쉬어지지 않는다. 세상이 조용해진다.\n\n어둠 속에서 누군가 묻는다.\n\n"무엇을 원하나."',
    choices: [
      { text: '"전부 부숴 버릴 힘."', g: { fighter: 3 }, c: { berserker: 2 }, t: { berserk: 1 }, next: 'awaken' },
      { text: '"뒤에 있는 사람들을 지킬 힘."', g: { guard: 3 }, c: { guardian: 1, paladin: 1 }, next: 'awaken' },
      { text: '"살아남을 힘. 그거면 돼."', g: { shadow: 3 }, c: { assassin: 1, thief: 1 }, t: { lucky: 1 }, next: 'awaken' },
      { text: '"닿지 않는 곳까지 꿰뚫을 힘."', g: { shooter: 3 }, c: { archer: 1, sniper: 1 }, next: 'awaken' },
      { text: '"이게 대체 뭔지 이해하고 싶다."', g: { mage: 3 }, c: { elementalist: 1 }, t: { genius: 1 }, talent: 1, next: 'awaken' },
      { text: '"혼자가 아니면 좋겠다."', g: { summon: 3 }, c: { tamer: 1, summoner: 1 }, next: 'awaken' },
      { text: '"아무도 죽지 않게 해 줘."', g: { support: 3 }, c: { healer: 1, priest: 1 }, t: { charisma: 1 }, next: 'awaken' },
      { text: '"이 머릿속의 소리를 다스리고 싶다."', g: { esper: 3 }, c: { telekinetic: 1, telepath: 1 }, next: 'awaken' },
      { text: '"옛사람들이 싸우던 방식을 알려 줘."', g: { east: 3 }, c: { taoist: 1, shaman: 1 }, t: { mana_sense: 1 }, next: 'awaken' },
    ] },

  // ---------- 5. 각성 (속성) ----------
  awaken: { title: '각성', text: '심장이 다시 뛴다. 아니, 무언가 다른 것이 뛴다. 혈관을 따라 낯선 힘이 쏟아진다.\n\n당신은 일어선다.',
    choices: [
      { text: '온몸이 불길처럼 타오른다', e: { fire: 4 }, next: 'first_fight' },
      { text: '살갗 위로 전류가 튄다', e: { bolt: 4 }, next: 'first_fight' },
      { text: '숨결이 하얗게 얼어붙는다', e: { ice: 4 }, next: 'first_fight' },
      { text: '피부가 강철처럼 단단해진다', e: { steel: 4 }, next: 'first_fight' },
      { text: '수많은 목소리가 머릿속에 울린다', e: { spirit: 4 }, next: 'first_fight' },
    ] },

  // ---------- 6. 첫 싸움 (직업) ----------
  first_fight: { title: '첫 싸움', text: '괴수가 다시 덤벼든다. 하지만 이번엔 보인다. 놈의 움직임이, 빈틈이, 그리고 내 안의 힘을 쓰는 법이.',
    choices: [
      { text: '맨몸으로 파고들어 주먹을 꽂는다', g: { fighter: 2 }, c: { monk: 3 }, next: 'rooftop' },
      { text: '부러진 쇠기둥을 창처럼 꼬나쥔다', g: { fighter: 2 }, c: { lancer: 3 }, next: 'rooftop' },
      { text: '거리를 벌리고 힘을 쏘아 보낸다', g: { mage: 1, shooter: 1 }, c: { elementalist: 2, archer: 1 }, next: 'rooftop' },
      { text: '그림자처럼 등 뒤로 돌아 급소를 찌른다', g: { shadow: 2 }, c: { assassin: 3 }, next: 'rooftop' },
      { text: '{friend}와(과) 사람들에게 외친다. "내가 신호하면 동시에!"', g: { support: 2 }, c: { bard: 3 }, t: { charisma: 1 }, friend: 10, next: 'night_dream' },
      { text: '괴수의 눈을 똑바로 보며 "멈춰"라고 명령한다', g: { esper: 1, summon: 1 }, c: { telepath: 2, tamer: 2 }, next: 'night_dream' },
      { text: '손바닥 위로 빛을 모아 방패처럼 펼친다', g: { guard: 2 }, c: { paladin: 3 }, next: 'night_dream' },
      { text: '손을 뻗자 무너진 잔해 더미가 허공으로 떠오른다', g: { esper: 2 }, c: { telekinetic: 3 }, next: 'night_dream' },
    ] },

  // ---------- 7. 희귀 직업 갈래 ----------
  night_dream: { title: '병실의 밤', text: '헌터 전문 병원. 며칠 만에 깨어난 그날 밤, 이상한 꿈을 꾼다. 끝없는 벌판에 무언가가 서 있다. 그것이 당신을 향해 천천히 고개를 돌린다.',
    choices: [
      { text: '빛으로 된 짐승. 다가와 손을 핥는다', g: { summon: 2 }, c: { summoner: 3, tamer: 1 }, next: 'verdict' },
      { text: '방울을 든 무녀. 춤을 추며 무언가를 부른다', g: { east: 2 }, c: { shaman: 3 }, next: 'verdict' },
      { text: '거꾸로 도는 거대한 시계', g: { mage: 2 }, c: { chronomancer: 4 }, talent: 1, next: 'verdict' },
      { text: '구름을 뚫고 선 거인', g: { guard: 2 }, c: { giant: 4 }, t: { iron_body: 1 }, next: 'verdict' },
      { text: '해골들이 무릎 꿇은 왕좌', g: { summon: 2 }, c: { necromancer: 4 }, next: 'verdict' },
      { text: '검은 계약서를 내미는 그림자', g: { mage: 2 }, c: { warlock: 4 }, t: { cursed: 1 }, next: 'verdict' },
      { text: '아직 오지 않은 내일이 보이는 눈동자', g: { esper: 2 }, c: { seer: 4 }, t: { lucky: 1 }, next: 'verdict' },
      { text: '빛의 날개를 펼친 누군가가 손을 얹는다', g: { support: 2 }, c: { priest: 3 }, next: 'verdict' },
    ] },
  rooftop: { title: '병원 옥상', text: '싸움이 끝나고 헌터 전문 병원으로 실려 갔다. 퇴원 전날 밤, 몰래 옥상에 올라간다. 아무도 없다. 손을 펼친다. 이번엔 의지대로 힘을 꺼내 볼 생각이다.',
    choices: [
      { text: '두 손에 칼날 같은 기운을 모은다', g: { fighter: 2 }, c: { dualblade: 4 }, next: 'verdict' },
      { text: '맨손에 검기를 두르고 정좌한다', g: { east: 2 }, c: { swordmonk: 4 }, next: 'verdict' },
      { text: '멀리 옥탑 물탱크를 겨눠 한 점으로 쏜다', g: { shooter: 2 }, c: { sniper: 4 }, next: 'verdict' },
      { text: '그림자 속으로 녹아들었다 반대편에서 나온다', g: { esper: 2 }, c: { teleporter: 4 }, next: 'verdict' },
      { text: '손끝에서 녹색 독기가 피어오른다', g: { shadow: 2 }, c: { poisoner: 4 }, next: 'verdict' },
      { text: '빈 공간에 빛의 벽을 세운다', g: { mage: 2 }, c: { warder: 4 }, next: 'verdict' },
      { text: '주머니 속 약병들이 반응하며 끓어오른다', g: { support: 2 }, c: { alchemist: 4 }, t: { mana_sense: 1 }, next: 'verdict' },
      { text: '빈 손에 부적 한 장이 저절로 그려진다', g: { east: 2 }, c: { taoist: 3 }, next: 'verdict' },
    ] },

  // ---------- 8. 관리국 판정 (재능·특성) ----------
  verdict: { title: '관리국 판정', text: '국가 각성자 관리국 지부. 원통형 측정기 안에 들어선다. 유리 너머에서 {friend}이(가) 눈이 퉁퉁 부은 채 손을 흔든다.\n\n심사관이 말한다. "정확한 등급은 협회 실기 시험이 끝나야 나옵니다. 측정기는 잠재치만 봐요. 마지막으로, 헌터가 되려는 이유가 뭡니까?"',
    choices: [
      { text: '숨을 고르고 차분히 에테르를 흘려 보낸다. "사람을 지키고 싶어서요."', talent: 1, t: { charisma: 1 }, friend: 15, next: null },
      { text: '대답 대신 측정기에 있는 힘껏 쏟아붓는다. 계기판이 터진다. "이걸로 대답이 될까요?"', luck: 2, t: { reckless: 1, berserk: 1 }, next: null },
      { text: '일부러 힘을 숨긴다. "돈이요. 솔직히."', t: { merchant: 2, lucky: 1 }, next: null },
      { text: '"게이트가 왜 열렸는지 알아내려고요."', talent: 1, t: { mana_sense: 1, genius: 1 }, next: null },
      { text: '유리 너머 {friend}을(를) 본다. "저 녀석 옆에 서 있으려고요."', t: { charisma: 1, iron_body: 1 }, friend: 25, next: null },
    ] },
  verdict_guild: { title: '길드 면접', text: '관리국 등록을 마친 다음 날, 모르는 번호로 전화가 온다. "청룡 연구소 신인 발굴팀입니다. 소문 듣고 연락드렸어요."\n\n도심 연구소 빌딩 28층 면접실. 정장 차림의 스카우터 셋이 태블릿을 넘기며 묻는다. "등급도 아직 안 나온 신입한테 우리가 왜 투자해야 하죠?"',
    choices: [
      { text: '"등급 나오기 전이니까요. 제일 싸게 살 수 있을 때잖아요."', t: { merchant: 1, charisma: 1 }, luck: 1, next: null },
      { text: '말 대신 손바닥 위로 에테르를 끌어올린다. 태블릿 화면이 지직거린다', talent: 1, t: { mana_sense: 1, reckless: 1 }, next: null },
      { text: '"투자 말고 계약서부터 보여 주세요."', t: { genius: 1 }, talent: 1, next: null },
      { text: '"길드는 아직 생각 없어요. 같이 다닐 사람이 있어서요." {friend}의 얼굴이 떠오른다', t: { charisma: 1 }, friend: 20, next: null },
      { text: '면접 내내 창밖만 본다. "다음에 제가 부르면 오세요."', t: { loner: 1, berserk: 1 }, luck: 2, next: null },
    ] },
  verdict_street: { title: '미등록 각성자', text: '관리국 대기 번호는 412번. 오늘 안엔 어림도 없다. 청사 앞 흡연 구역에서 모자를 눌러쓴 사람이 다가온다.\n\n"등록 대행해 드려요. 기록은 깨끗하게, 등급은 원하는 대로. 아니면… 아예 등록 안 하고 사는 법도 알려 드리고요."',
    choices: [
      { text: '무시하고 412번 표를 꼭 쥔 채 다시 줄을 선다', talent: 1, t: { iron_body: 1 }, next: null },
      { text: '"얼마예요?" 일단 조건부터 듣는다', t: { merchant: 2 }, luck: 1, next: null },
      { text: '브로커의 손목 문신을 기억해 둔다. 언젠가 쓸모가 있겠지', t: { quick: 1, lucky: 1 }, next: null },
      { text: '{friend}에게 전화한다. "나 오늘 늦어. 그래도 정식으로 할게."', t: { charisma: 1 }, friend: 15, next: null },
      { text: '브로커의 멱살을 잡고 관리국 경비를 부른다', t: { berserk: 1, reckless: 1 }, talent: 1, next: null },
    ] },
};

// ---------- 출신별 도입 2~10 (출신마다 10가지 사연 중 하나가 무작위로 나온다) ----------
// 선택지 형식: [문장, 속성, 계열 점수, 직업 점수, 특성 점수, 기타(talent, luck, friend)]
const PRO_INTRO = (title, text, next, ch) => ({
  title, text,
  choices: ch.map(([t, e, g, c, tr, x]) => ({ text: t, e: { [e]: 1 }, g, ...(c ? { c } : {}), ...(tr ? { t: tr } : {}), ...(x || {}), next })),
});

Object.assign(PROLOGUE, {
  // ===== 재벌가 자제 (강남) =====
  chaebol_2: PRO_INTRO('귀국', '런던에서 6년. 귀국 다음 날, 집안 사람들은 아무도 공항에 나오지 않았다. 비서가 건넨 쪽지에는 "저녁 7시, 이사회 만찬"이라고만 적혀 있다.\n\n짐도 풀기 전에 {friend}이(가) 문자를 보낸다. "왔으면 연락을 하지! 오늘 강변 불꽃 축제야. 나와."', 'gb_festival', [
    ['만찬을 건너뛰고 {friend}에게 간다', 'fire', { fighter: 1, support: 1 }, null, { charisma: 1 }, { friend: 5 }],
    ['만찬에 나가 삼촌들의 눈빛을 하나하나 읽는다', 'ice', { esper: 1, shadow: 1 }, { telepath: 1 }, { mana_sense: 1 }],
    ['유학 시절 배운 펜싱 감각을 떠올린다', 'bolt', { fighter: 2 }, { swordsman: 1, dualblade: 1 }, { quick: 1 }],
    ['아무에게도 연락하지 않고 혼자 한강을 걷는다', 'spirit', { mage: 1, east: 1 }, null, { loner: 1 }],
  ]),
  chaebol_3: PRO_INTRO('에테르 경매장', '청담동 지하 경매장. 조명이 꺼지고, 유리관 속 붉은 코어 하나가 무대에 오른다. "A급 화염룡의 심장. 시작가 40억."\n\n아버지 대신 앉은 자리. 패들을 쥔 손에 땀이 찬다. 그때 유리관 속 코어가 당신 쪽으로 맥박치듯 빛난다.', 'gb_market', [
    ['패들을 높이 든다. 저건 내 것이어야 한다', 'fire', { mage: 1, fighter: 1 }, null, { reckless: 1 }],
    ['입찰가를 계산하며 상대들의 지갑을 가늠한다', 'steel', { support: 1, guard: 1 }, { alchemist: 1 }, { merchant: 2 }],
    ['코어의 맥박 소리에 귀를 기울인다', 'spirit', { esper: 2 }, { seer: 1 }, { mana_sense: 1 }],
    ['경매장 뒷문의 경비 배치를 눈여겨본다', 'ice', { shadow: 2 }, { thief: 1 }, { quick: 1 }],
  ]),
  chaebol_4: PRO_INTRO('한강 요트 파티', '사촌이 연 요트 파티. 샴페인 잔이 부딪히고, 누군가 B급 헌터 연예인과 셀카를 찍는다. 갑판 끝에서 {friend}이(가) 어색하게 서 있다. 당신이 초대한 유일한 손님이다.\n\n"야, 나 여기 있어도 돼?"', 'gb_festival', [
    ['{friend} 옆에 서서 같이 야경을 본다', 'spirit', { support: 2 }, { bard: 1 }, { charisma: 1 }, { friend: 10 }],
    ['헌터 연예인에게 다가가 대놓고 실력을 묻는다', 'fire', { fighter: 2 }, { berserker: 1 }, { reckless: 1 }],
    ['사촌의 거래 이야기를 엿듣는다', 'bolt', { shadow: 1, esper: 1 }, null, { merchant: 1 }],
    ['물 아래에서 무언가 꿈틀거리는 걸 본다', 'ice', { summon: 1, mage: 1 }, { tamer: 1 }, { mana_sense: 1 }],
  ]),
  chaebol_5: PRO_INTRO('후계 구도', '이복형이 이사회에서 웃으며 말한다. "막내는 아직 어리잖아요. 백호 시큐리티는 제가 맡겠습니다."\n\n회의가 끝나고, 형의 경호원이 엘리베이터 앞을 막아선다. "오늘은 지하철로 가시죠, 도련님. 차가 없답니다."', 'gb_subway', [
    ['경호원을 똑바로 보며 비키라고 한다', 'steel', { guard: 1, fighter: 1 }, { paladin: 1 }, { iron_body: 1 }],
    ['웃으며 지하철을 탄다. 갚아 줄 날은 따로 있다', 'ice', { shadow: 2 }, { assassin: 1 }, { loner: 1 }],
    ['형에게 쪽지를 남긴다. "다음 이사회에서 봐요."', 'bolt', { support: 1, shooter: 1 }, null, { charisma: 1 }],
    ['어머니가 남긴 부적 지갑을 꽉 쥔다', 'spirit', { east: 2 }, { taoist: 1 }, null, { luck: 1 }],
  ]),
  chaebol_6: PRO_INTRO('재단 봉사', '가문 재단의 홍보 행사. 소아 병동에 장난감을 나눠 주고 사진을 찍으면 끝이다. 그런데 창가 침대의 아이가 사진기 대신 당신을 빤히 본다.\n\n"형아는… 누나는… 아니, 헌터예요?" 아이의 팔에는 게이트 화상 자국이 있다.', 'gb_hospital', [
    ['카메라를 치우고 아이 옆에 앉는다', 'spirit', { support: 2 }, { healer: 1, priest: 1 }, { charisma: 1 }],
    ['"아직은. 근데 될 거야." 약속한다', 'fire', { fighter: 1, guard: 1 }, { paladin: 1 }, { berserk: 1 }],
    ['화상 자국의 치료 기록을 몰래 들여다본다', 'ice', { mage: 1, support: 1 }, { alchemist: 1 }, { genius: 1 }],
    ['행사가 끝나자마자 차에 오른다', 'steel', { guard: 1, shadow: 1 }, null, { loner: 1 }],
  ]),
  chaebol_7: PRO_INTRO('비밀 훈련장', '집에는 요가 학원에 간다고 했다. 실제로는 역삼동 지하의 사설 헌터 훈련장. 은퇴한 A급 교관이 목검으로 당신의 정강이를 친다.\n\n"돈 많은 애들은 사흘 버티면 오래 버틴 거야. 넌 몇 주째지?"', 'gate_break', [
    ['"석 달째요." 다시 목검을 든다', 'steel', { fighter: 2 }, { swordsman: 2 }, { iron_body: 1 }],
    ['교관의 발놀림을 그대로 따라 한다', 'bolt', { fighter: 1, shadow: 1 }, { dualblade: 1 }, { quick: 1 }],
    ['사격장 쪽에서 들리는 총성이 더 끌린다', 'ice', { shooter: 2 }, { sniper: 1 }, null],
    ['교관이 명상하는 걸 보고 옆에 앉는다', 'spirit', { east: 1, mage: 1 }, { swordmonk: 1 }, { mana_sense: 1 }],
  ]),
  chaebol_8: PRO_INTRO('상견례', '호텔 일식당. 상대 집안은 대형 길드의 오너 일가다. 어른들이 "두 집안이 손을 잡으면"으로 시작하는 말을 주고받는다. 맞은편의 정략 상대도 당신만큼 지루한 얼굴이다.\n\n휴대폰이 진동한다. {friend}의 문자다. "너희 집 단지 앞 하늘 봤어?"', 'gb_apartment', [
    ['"저 이 결혼 안 합니다." 일어선다', 'fire', { fighter: 1, guard: 1 }, null, { reckless: 1, berserk: 1 }],
    ['상대에게 몰래 쪽지를 건넨다. "같이 나갈래요?"', 'bolt', { support: 1, shadow: 1 }, { bard: 1 }, { charisma: 1 }],
    ['조용히 웃으며 끝까지 자리를 지킨다', 'ice', { mage: 1, guard: 1 }, { warder: 1 }, { merchant: 1 }],
    ['창밖 하늘의 빛이 마음에 걸린다. 양해를 구하고 자리를 뜬다', 'spirit', { esper: 1, mage: 1 }, { seer: 1 }, { mana_sense: 1 }],
  ]),
  chaebol_9: PRO_INTRO('압류 딱지', '아버지 회사가 부도났다. 펜트하우스 가구마다 빨간 압류 딱지가 붙는다. 어제까지 굽신대던 집사들이 한 명씩 짐을 싼다.\n\n남은 건 카드 한 장과, 끝까지 남은 {friend}의 전화 한 통. "우리 집 와. 라면은 있어."', 'gb_market', [
    ['{friend}네 집으로 간다. 자존심은 나중 문제다', 'spirit', { support: 1, summon: 1 }, null, { charisma: 1 }, { friend: 10 }],
    ['압류 전에 금고 속 유물 하나를 챙겨 나온다', 'bolt', { shadow: 2 }, { thief: 1 }, { lucky: 1 }],
    ['채권자들 앞에서 아버지를 대신해 고개를 든다', 'steel', { guard: 2 }, { guardian: 1 }, { iron_body: 1 }],
    ['헌터 등록 안내서를 검색한다. 돈은 다시 벌면 된다', 'fire', { fighter: 1, shooter: 1 }, null, { merchant: 1 }],
  ]),
  chaebol_10: PRO_INTRO('창업주의 유언', '할머니의 병실. 백호그룹을 세운 사람이 산소 호흡기 너머로 손짓한다. 다른 손주들은 복도에서 변호사와 이야기 중이다.\n\n"얘야, 우리 집안 사람들은 다 돈을 봐. 너는… 사람을 봐라." 할머니가 낡은 호신 부적 하나를 쥐여 준다.', 'gb_hospital', [
    ['부적을 목에 건다', 'spirit', { east: 2 }, { shaman: 1 }, { mana_sense: 1 }],
    ['할머니 손을 잡고 마지막까지 곁을 지킨다', 'ice', { support: 2 }, { priest: 1 }, { charisma: 1 }, { talent: 1 }],
    ['복도로 나가 변호사들을 쫓아낸다', 'fire', { guard: 1, fighter: 1 }, null, { berserk: 1 }],
    ['유언장 사본을 몰래 찍어 둔다', 'bolt', { shadow: 1, esper: 1 }, null, { quick: 1 }],
  ]),

  // ===== 보육원 출신 (전주) =====
  orphan_2: PRO_INTRO('배달 라이더', '하루 마흔 건. 비 오는 날은 단가가 500원 오른다. 헬멧 속으로 빗물이 샌다. 시장 골목 순대국집 사장님이 늘 하던 대로 국물 한 그릇을 쥐여 준다.\n\n"오늘은 일찍 들어가라. 하늘이 수상하다." 다음 배달지는 시장 한복판이다.', 'gb_market', [
    ['콜 하나만 더. 오토바이 시동을 건다', 'bolt', { shadow: 1, fighter: 1 }, null, { quick: 2 }],
    ['국물을 다 비우고 사장님께 꾸벅 인사한다', 'spirit', { support: 2 }, null, { charisma: 1 }],
    ['골목 지름길을 머릿속에 다시 그린다', 'ice', { shadow: 2 }, { thief: 1 }, { lucky: 1 }],
    ['빗속에서 헬멧을 벗고 하늘을 노려본다', 'fire', { fighter: 2 }, { berserker: 1 }, { reckless: 1 }],
  ]),
  orphan_3: PRO_INTRO('고물상', '보육원을 나와 고물상 할아버지 밑에서 일한 지 1년. 오늘 들어온 폐기물 더미에 깨진 헌터 장비가 섞여 있다. 금이 간 방패, 탄창 빠진 권총, 녹슨 부적 상자.\n\n할아버지가 말한다. "쓸 만한 거 하나 골라 가. 월급 대신이다."', 'gate_break', [
    ['금이 간 방패를 고친다', 'steel', { guard: 2 }, { guardian: 1 }, { iron_body: 1 }],
    ['권총을 분해해서 닦는다', 'bolt', { shooter: 2 }, { gunslinger: 1 }, { genius: 1 }],
    ['녹슨 부적 상자를 연다', 'spirit', { east: 2 }, { taoist: 1 }, { mana_sense: 1 }],
    ['장비보다 고철 값이 낫다. 몽땅 판다', 'ice', { support: 1, shadow: 1 }, { alchemist: 1 }, { merchant: 2 }],
  ]),
  orphan_4: PRO_INTRO('퇴소하는 날', '열아홉 살. 보육원을 떠나는 날이다. 자립정착금 통장 하나와 이불 보따리. 원장 할머니가 대문 앞에서 끝내 울음을 참는다.\n\n새로 얻은 원룸은 낡은 아파트 단지 꼭대기 층. {friend}이(가) 이삿짐을 같이 들어 준다.', 'gb_apartment', [
    ['돌아보지 않고 걷는다. 울면 못 간다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
    ['동생들 한 명 한 명을 안아 준다', 'spirit', { support: 2 }, { bard: 1 }, { charisma: 1 }],
    ['"돈 벌어서 꼭 다시 올게요." 약속한다', 'fire', { fighter: 2 }, null, { berserk: 1 }, { talent: 1 }],
    ['이삿짐을 혼자 다 짊어진다', 'steel', { guard: 2 }, { giant: 1 }, { iron_body: 1 }, { friend: 5 }],
  ]),
  orphan_5: PRO_INTRO('한옥마을 기념품 가게', '주말 한옥마을은 관광객으로 붐빈다. 가게 사장님은 손님 앞에서만 웃는다. 진열대 구석, 아무도 사지 않는 낡은 방울 하나가 오늘따라 혼자 울린다.\n\n밖에서는 등불 축제 준비가 한창이다.', 'gb_festival', [
    ['방울을 집어 든다. 손끝이 찌릿하다', 'spirit', { east: 2 }, { shaman: 2 }, null],
    ['관광객에게 한옥 이야기를 맛깔나게 풀어 판다', 'fire', { support: 1, esper: 1 }, { bard: 1 }, { charisma: 1, merchant: 1 }],
    ['사장님의 장부가 이상하다는 걸 눈치챈다', 'ice', { mage: 1, shadow: 1 }, null, { genius: 1 }],
    ['축제 무대 설치를 도우러 나간다', 'steel', { guard: 1, fighter: 1 }, null, { iron_body: 1 }],
  ]),
  orphan_6: PRO_INTRO('친부모의 소식', '모르는 번호로 전화가 왔다. "대학병원 사회복지팀입니다. 친어머니 되시는 분이… 많이 위독하세요. 찾고 계셨답니다."\n\n19년 동안 한 번도 찾지 않던 사람이다. {friend}이(가) 말없이 버스 시간표를 찾아 준다.', 'gb_hospital', [
    ['병원으로 간다. 얼굴이라도 보고 싶다', 'spirit', { support: 1, esper: 1 }, { telepath: 1 }, { charisma: 1 }],
    ['전화를 끊는다. 내 가족은 보육원에 있다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
    ['병원 앞까지 가서 한참을 서성인다', 'bolt', { summon: 1, esper: 1 }, null, { mana_sense: 1 }],
    ['따지고 싶은 말을 수첩에 잔뜩 적어 간다', 'fire', { fighter: 1, shooter: 1 }, null, { reckless: 1 }],
  ]),
  orphan_7: PRO_INTRO('태권도장', '보육원 시절부터 다닌 태권도장. 이제는 사범 보조로 아이들을 가르친다. 관장님이 기왓장 다섯 장을 쌓으며 말한다.\n\n"체육대회 시범이다. 근처 학교 운동장. 실수하면 애들 앞에서 망신이야."', 'gb_school', [
    ['기왓장을 일곱 장으로 늘린다', 'fire', { fighter: 2 }, { monk: 2 }, { berserk: 1 }],
    ['아이들 줄을 세우고 하나하나 자세를 잡아 준다', 'steel', { guard: 1, support: 1 }, { paladin: 1 }, { charisma: 1 }],
    ['돌려차기 연습만 백 번 더 한다', 'bolt', { fighter: 1, shadow: 1 }, { lancer: 1 }, { quick: 1 }],
    ['호흡과 단전 수련법을 따로 묻는다', 'spirit', { east: 2 }, { swordmonk: 1 }, { mana_sense: 1 }],
  ]),
  orphan_8: PRO_INTRO('병원비', '보육원 막내 지우가 원인 모를 열에 시달린다. 에테르 과민증. 치료제는 한 병에 80만 원. 통장에는 23만 원.\n\n응급실 복도에서 {friend}이(가) 편의점 김밥을 내민다. "일단 먹어. 방법은 같이 찾자."', 'gb_hospital', [
    ['지우 곁에서 밤새 이마를 식혀 준다', 'ice', { support: 2 }, { healer: 2 }, null, { friend: 5 }],
    ['사채 전단지를 집어 든다', 'fire', { shadow: 1, fighter: 1 }, null, { reckless: 1, cursed: 1 }],
    ['약제실 재고 목록을 훔쳐본다', 'bolt', { shadow: 1, support: 1 }, { alchemist: 1, poisoner: 1 }, { quick: 1 }],
    ['병원 기도실에 처음으로 들어가 본다', 'spirit', { support: 1, east: 1 }, { priest: 1 }, null, { luck: 1 }],
  ]),
  orphan_9: PRO_INTRO('뒷골목', '"보육원 애들은 손버릇이 나쁘다니까." 편의점 점장이 CCTV도 안 보고 당신을 범인으로 몬다. 해고 통보.\n\n밤거리를 걷는데, 골목 안쪽에서 진짜 범인 셋이 낄낄대며 담배를 나눠 피운다.', 'gate_break', [
    ['곧장 걸어가 멱살을 잡는다', 'fire', { fighter: 2 }, { berserker: 1 }, { berserk: 1 }],
    ['휴대폰으로 녀석들의 자백을 녹음한다', 'bolt', { shooter: 1, shadow: 1 }, null, { quick: 1 }],
    ['그냥 지나친다. 싸워 봐야 내 손해다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
    ['맞아도 쓰러지지 않을 각오로 막아선다', 'steel', { guard: 2 }, null, { iron_body: 2 }],
  ]),
  orphan_10: PRO_INTRO('원장 할머니', '원장 할머니의 장례식. 조문객은 대부분 보육원을 거쳐 간 아이들이다. 헌터가 된 형도, 경찰이 된 누나도 왔다.\n\n영정 앞에서 할머니가 늘 하던 말이 떠오른다. "우리 집 애들은 남을 지키는 애들로 크는 거여."', 'gb_apartment', [
    ['상주 자리를 지키며 조문객을 맞는다', 'steel', { guard: 1, support: 1 }, { guardian: 1 }, { charisma: 1 }],
    ['헌터가 된 형에게 각성하는 법을 묻는다', 'fire', { fighter: 1, shooter: 1 }, null, { berserk: 1 }, { talent: 1 }],
    ['할머니가 아끼던 묵주를 손에 감는다', 'spirit', { support: 1, east: 1 }, { priest: 1 }, null],
    ['장례식장 뒤에서 혼자 운다. 아무도 못 보게', 'ice', { mage: 1, shadow: 1 }, null, { loner: 1 }],
  ]),

  // ===== 특수부대 전역 (인천) =====
  soldier_2: PRO_INTRO('UDT의 바다', '전역 한 달 전, 인천 앞바다 야간 침투 훈련. 수심 20미터, 손전등 불빛 너머로 무언가 거대한 눈이 떴다 감겼다. 보고서에는 "이상 없음"이라고 썼다.\n\n전역하고 처음 맞는 주말, {friend}이(가) 월미도 축제에 가자고 조른다.', 'gb_festival', [
    ['바다를 등지고 앉는다. 그 눈이 떠오른다', 'ice', { mage: 1, esper: 1 }, { seer: 1 }, { mana_sense: 1 }],
    ['{friend}와(과) 놀이기구 줄을 선다. 오늘은 쉰다', 'spirit', { support: 1, summon: 1 }, null, { charisma: 1 }, { friend: 5 }],
    ['잠수칼을 아직도 허리에 차고 다닌다', 'steel', { fighter: 1, shadow: 1 }, { assassin: 1 }, { iron_body: 1 }],
    ['다시 바다로 들어가 확인하고 싶다', 'fire', { fighter: 2 }, null, { reckless: 1 }],
  ]),
  soldier_3: PRO_INTRO('고공 강하', '꿈에서 또 그날로 돌아간다. 고도 4천 미터, 낙하산이 펼쳐지지 않았다. 예비산을 당기기까지 3초. 그 3초 동안 바람 속에서 누군가 웃는 소리를 들었다.\n\n잠에서 깨니 창밖이 이상하게 붉다.', 'gate_break', [
    ['그 3초를 매일 다시 센다. 아직 살아 있다', 'bolt', { shadow: 1, esper: 1 }, { teleporter: 1 }, { quick: 1, lucky: 1 }],
    ['바람 속 웃음소리를 떠올린다', 'spirit', { esper: 1, summon: 1 }, null, { mana_sense: 1 }],
    ['군장을 꾸려 둔다. 습관이다', 'steel', { guard: 1, shooter: 1 }, null, { iron_body: 1 }],
    ['창문을 열고 붉은 하늘을 마주 본다', 'fire', { fighter: 2 }, { lancer: 1 }, { berserk: 1 }],
  ]),
  soldier_4: PRO_INTRO('의무 부사관', '특전사 의무 부사관. 지혈대를 감으며 세었던 숫자들이 아직 손에 남아 있다. 하나, 둘, 셋, 살렸다. 넷, 다섯, 못 살렸다.\n\n전역 후 들어간 병원 응급실. 오늘도 사이렌이 끊이지 않는다.', 'gb_hospital', [
    ['응급실로 뛰어 들어간다', 'ice', { support: 2 }, { healer: 2 }, { iron_body: 1 }],
    ['못 살린 이름들을 하나씩 되뇐다', 'spirit', { support: 1, mage: 1 }, { necromancer: 1, priest: 1 }, null],
    ['약품 배합표를 외운다. 더 빨리, 더 정확히', 'bolt', { support: 1, mage: 1 }, { alchemist: 1 }, { genius: 1 }],
    ['수술 가위를 쥐는 손이 칼을 쥐던 손과 같다', 'steel', { shadow: 1, fighter: 1 }, { poisoner: 1 }, { loner: 1 }],
  ]),
  soldier_5: PRO_INTRO('인질 구출', '707 대테러 특임대. 마지막 작전은 지하철 객차 인질 구출이었다. 진입 2초 전, 테러범의 눈이 보랏빛으로 빛났다. 미등록 각성자였다.\n\n전역 후에도 지하철을 탈 때마다 숨을 참는다.', 'gb_subway', [
    ['객차 출입문 위치부터 확인한다. 버릇이다', 'steel', { guard: 1, shooter: 1 }, null, { iron_body: 1 }],
    ['그때 그 각성자의 눈을 떠올린다', 'spirit', { esper: 2 }, { telepath: 1 }, { mana_sense: 1 }],
    ['권총 대신 손에 쥔 교통카드를 만지작거린다', 'bolt', { shooter: 2 }, { gunslinger: 2 }, { quick: 1 }],
    ['숨을 참지 않기로 한다. 정면으로 본다', 'fire', { fighter: 1, guard: 1 }, null, { berserk: 1 }],
  ]),
  soldier_6: PRO_INTRO('경비업체', '전역 후 취업한 아파트 경비업체. 특수부대 출신이라며 팀장 자리를 줬지만, 하는 일은 택배 정리와 주차 단속이다.\n\n입주민 대표가 소리친다. "그 군인 출신 양반, 엘리베이터 고장은 언제 고쳐요?"', 'gb_apartment', [
    ['묵묵히 공구함을 든다', 'steel', { guard: 2 }, { guardian: 1 }, { iron_body: 1 }],
    ['단지 CCTV를 모조리 다시 배치한다', 'ice', { shooter: 1, mage: 1 }, { warder: 1 }, { genius: 1 }],
    ['관리비 횡령 정황을 찾아낸다', 'bolt', { shadow: 2 }, null, { quick: 1 }],
    ['꼬마 입주민들과 순찰을 돌며 친해진다', 'spirit', { support: 1, summon: 1 }, { tamer: 1 }, { charisma: 1 }],
  ]),
  soldier_7: PRO_INTRO('탐색 구조대', '공군 탐색 구조대. 헬기에서 줄 하나로 내려가 사람을 끌어 올렸다. 마지막 구조 현장은 게이트 근처 산이었고, 줄 끝에 매달린 건 사람이 아니었다.\n\n오늘 아침, 그 산 쪽 하늘에서 같은 냄새가 난다.', 'gate_break', [
    ['로프와 카라비너를 챙긴다', 'steel', { guard: 1, support: 1 }, { paladin: 1 }, { iron_body: 1 }],
    ['그날 줄 끝의 그것을 떠올린다. 아직 무섭다', 'ice', { mage: 1, summon: 1 }, { necromancer: 1 }, { loner: 1 }],
    ['구조대 동기들에게 비상 연락을 돌린다', 'bolt', { support: 2 }, null, { charisma: 1 }],
    ['높은 데서 내려다보면 다 보인다. 옥상으로 간다', 'fire', { shooter: 2 }, { archer: 1 }, { quick: 1 }],
  ]),
  soldier_8: PRO_INTRO('차이나타운 주방', '전역 후 차이나타운 중식당 주방. 칼질 하나는 부대에서 배운 것보다 빠르다. 주방장이 웍을 돌리며 말한다.\n\n"너 칼 잡는 거 보면 사람 많이 다뤄 본 손이야. 오늘은 시장 가서 재료 좀 떼 와라."', 'gb_market', [
    ['양손에 식칼을 쥐고 손목을 풀어 본다', 'steel', { fighter: 2 }, { dualblade: 2 }, null],
    ['웍의 불길을 오래 들여다본다', 'fire', { mage: 1, fighter: 1 }, { elementalist: 1 }, { berserk: 1 }],
    ['시장 상인들과 흥정하는 게 생각보다 재밌다', 'spirit', { support: 1, esper: 1 }, null, { merchant: 2 }],
    ['주방장의 말에 대꾸하지 않는다', 'ice', { shadow: 2 }, { assassin: 1 }, { loner: 1 }],
  ]),
  soldier_9: PRO_INTRO('저격 교관', '전역 직전까지 저격 교관이었다. 800미터 밖 표적의 흔들림까지 읽던 눈. 그런데 요즘은 가끔 표적 너머의 것까지 보인다. 아직 일어나지 않은 움직임 같은 것.\n\n사격장 청소를 마치고 나오는데 하늘에 금이 가 있다.', 'gate_break', [
    ['조준경 없이도 보이는 그것을 믿어 본다', 'spirit', { esper: 1, shooter: 1 }, { seer: 1 }, { mana_sense: 1 }],
    ['숨을 멈추고 거리를 잰다. 800, 600, 400', 'ice', { shooter: 2 }, { sniper: 2 }, null],
    ['교관 시절 후배들에게 연락을 돌린다', 'bolt', { support: 1, shooter: 1 }, null, { charisma: 1 }],
    ['사격장 무기고 열쇠가 아직 주머니에 있다', 'steel', { shooter: 1, guard: 1 }, { gunslinger: 1 }, { reckless: 1 }],
  ]),
  soldier_10: PRO_INTRO('징계', '게이트 봉쇄 작전. "민간인이 남아 있어도 철문을 닫아라." 그 명령을 어기고 문을 다시 열었다. 일곱 명이 살았고, 당신은 징계를 받고 조용히 전역했다.\n\n지하철역 앞에서 그때 살린 아이의 엄마가 알아보고 고개를 숙인다.', 'gb_subway', [
    ['"또 그 상황이 와도 똑같이 합니다."', 'fire', { guard: 2 }, { paladin: 2 }, { berserk: 1 }],
    ['쑥스럽게 손을 흔들고 지나간다', 'spirit', { support: 1, guard: 1 }, null, { charisma: 1 }],
    ['명령을 내린 지휘관의 이름을 아직 기억한다', 'ice', { shadow: 2 }, null, { loner: 1 }],
    ['그 철문의 무게를 손바닥이 기억한다', 'steel', { guard: 1, fighter: 1 }, { giant: 1 }, { iron_body: 1 }],
  ]),

  // ===== 연구소 실험체 (대전) =====
  subject_2: PRO_INTRO('지하 7층', '대덕 연구단지 지하 7층, "이카루스 계획". 탈출하던 밤의 기억은 조각뿐이다. 깨진 유리, 울리는 경보, 그리고 마지막 문 앞에서 당신의 손을 놓은 누군가.\n\n지금도 지하철역 계단을 내려갈 때면 숨이 막힌다.', 'gb_subway', [
    ['계단을 한 칸씩 세며 내려간다. 이겨 낸다', 'steel', { guard: 1, fighter: 1 }, null, { iron_body: 1 }],
    ['손을 놓은 그 사람이 누구였는지 떠올리려 애쓴다', 'spirit', { esper: 2 }, { telepath: 1 }, { mana_sense: 1 }],
    ['출구 위치부터 확인한다', 'bolt', { esper: 1, shadow: 1 }, { teleporter: 2 }, { quick: 1 }],
    ['지하가 싫다. 그냥 버스를 탄다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
  ]),
  subject_3: PRO_INTRO('13번과의 약속', '옆방 피험자 13번. 벽을 두드려 모스 부호로 이야기했다. "나가면 성심당 튀김소보로 같이 먹자." 13번은 연구소 폐쇄 전날 사라졌다.\n\n빵 봉투를 들고 나오는데, 길 건너에 13번과 똑같은 바코드 흉터를 가진 사람이 지나간다.', 'gate_break', [
    ['쫓아간다. 골목 끝에서 놓쳤다. 그날 밤부터 열이 오른다', 'bolt', { shadow: 1, esper: 1 }, null, { quick: 1 }],
    ['벽을 두드리듯 손가락으로 신호를 보낸다. 그 사람이 멈칫하더니 인파 속으로 사라진다', 'spirit', { esper: 2 }, { telepath: 2 }, null],
    ['빵 봉투를 꽉 쥐고 멀리서 지켜본다. 그 사람은 버스를 타고 떠났다', 'ice', { shadow: 2 }, null, { loner: 1 }],
    ['불러 세운다. "13번!"', 'fire', { fighter: 1, summon: 1 }, null, { reckless: 1 }],
  ]),
  subject_4: PRO_INTRO('도와준 연구원', '탈출한 밤, 연구원 하나가 몰래 비상문 카드를 쥐여 줬다. 그 사람은 지금 대학병원 신경과 의사다. 매달 진료라는 이름으로 당신을 만난다.\n\n"요즘 수치가 이상하게 올라가. 무슨 일 있었어?"', 'gb_hospital', [
    ['솔직히 털어놓는다. 꿈에서 목소리가 들린다고', 'spirit', { esper: 1, support: 1 }, { seer: 1 }, { charisma: 1 }],
    ['괜찮다고 거짓말한다', 'ice', { shadow: 2 }, null, { loner: 1 }],
    ['수치 그래프를 들여다보며 직접 계산해 본다', 'bolt', { mage: 2 }, { chronomancer: 1 }, { genius: 1 }],
    ['진료실 창문 유리가 손끝에서 녹아내린다', 'fire', { mage: 1, esper: 1 }, { elementalist: 1 }, { reckless: 1 }],
  ]),
  subject_5: PRO_INTRO('위탁 가정', '연구소 폐쇄 후 배정된 위탁 가정. 아파트 12층, 다정한 부부와 열 살짜리 동생. 처음 가져 본 내 방이다.\n\n그런데 밤마다 동생이 말한다. "{name}, 너 어젯밤에 자는데 침대가 떠 있었어."', 'gb_apartment', [
    ['동생에게 비밀로 해 달라고 새끼손가락을 건다', 'spirit', { support: 1, esper: 1 }, null, { charisma: 1 }],
    ['밤마다 침대를 붙잡고 잔다. 들키면 끝이다', 'steel', { guard: 1, esper: 1 }, { telekinetic: 1 }, { iron_body: 1 }],
    ['일부러 더 띄워 본다. 얼마나 되는지', 'bolt', { esper: 2 }, { telekinetic: 2 }, { reckless: 1 }],
    ['짐을 싼다. 이 집에 폐를 끼칠 수 없다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
  ]),
  subject_6: PRO_INTRO('감시 요원', '매달 첫째 주 화요일, 회색 양복의 관리국 요원이 찾아온다. 시장 국밥집에서 마주 앉아 같은 질문을 한다.\n\n"특이 사항은요?" "없어요." 요원이 국밥을 반쯤 남기고 일어선다. "다음 달엔 진짜 대답을 기대할게요."', 'gb_market', [
    ['요원의 뒤를 몰래 밟는다', 'bolt', { shadow: 2 }, { thief: 1 }, { quick: 1 }],
    ['요원의 생각을 읽어 보려 집중한다', 'spirit', { esper: 2 }, { telepath: 1 }, { mana_sense: 1 }],
    ['남은 국밥을 다 먹는다. 아까우니까', 'steel', { guard: 1, fighter: 1 }, null, { iron_body: 1 }],
    ['다음 달엔 진짜로 대답해 주기로 한다', 'fire', { support: 1, fighter: 1 }, null, { charisma: 1 }],
  ]),
  subject_7: PRO_INTRO('0시 축제', '빵집 아르바이트를 마치고 나오니 0시 축제가 한창이다. 사람들 사이를 걷는데 귓가에 실험실에서 듣던 목소리가 속삭인다.\n\n"곧 열린다. 네가 문이야." 옆에서 {friend}이(가) 솜사탕을 내민다. "왜 그래, 얼굴이 하얘."', 'gb_festival', [
    ['목소리에게 마음속으로 묻는다. "넌 누구야?"', 'spirit', { esper: 1, summon: 1 }, { summoner: 1 }, { mana_sense: 1 }],
    ['{friend}의 손을 잡는다. 혼자 있기 싫다', 'fire', { support: 1, guard: 1 }, null, { charisma: 1 }, { friend: 10 }],
    ['축제장 출구 위치를 하나하나 확인한다', 'ice', { shadow: 1, mage: 1 }, { warder: 1 }, { quick: 1 }],
    ['목소리를 무시한다. 솜사탕을 받는다', 'steel', { guard: 1, fighter: 1 }, null, { lucky: 1 }],
  ]),
  subject_8: PRO_INTRO('잃어버린 일기장', '실험 이전의 기억이 없다. 그런데 오늘 보호 시설 창고에서 자기 이름이 적힌 일기장을 찾았다. 마지막 장에는 어린 글씨로 이렇게 적혀 있다.\n\n"과학관 견학. 내일은 대학 캠퍼스에서 마술쇼를 한대."', 'gb_school', [
    ['일기장 속 캠퍼스를 찾아간다', 'bolt', { mage: 1, esper: 1 }, { chronomancer: 1 }, { mana_sense: 1 }],
    ['한 장 한 장 소리 내어 읽는다', 'spirit', { mage: 1, support: 1 }, { seer: 1 }, { mana_sense: 1 }],
    ['일기장을 덮는다. 지금의 내가 중요하다', 'steel', { guard: 1, fighter: 1 }, null, { iron_body: 1 }],
    ['일기장에 끼워진 사진 속 아이들을 찾아 나선다', 'ice', { shadow: 1, esper: 1 }, null, { genius: 1 }],
  ]),
  subject_9: PRO_INTRO('정기 검진', '석 달에 한 번, 후유증 검진. MRI 기계 안에 누우면 실험실의 기억이 밀려온다. 오늘은 기계가 세 번이나 멈췄다.\n\n기사가 투덜댄다. "이상하네, 이 환자만 들어가면 자기장이 튀어요."', 'gb_hospital', [
    ['자기장이 튀는 순간을 느껴 본다', 'bolt', { esper: 1, mage: 1 }, { elementalist: 1 }, { mana_sense: 1 }],
    ['눈을 감고 숫자를 세며 버틴다', 'steel', { guard: 2 }, null, { iron_body: 2 }],
    ['기계 안의 차가운 공기에 몸을 맡긴다', 'ice', { mage: 2 }, { warder: 1 }, null],
    ['옆 검사실 환자의 고통이 전해진다', 'spirit', { support: 1, esper: 1 }, { healer: 1 }, { charisma: 1 }],
  ]),
  subject_10: PRO_INTRO('책임자', '연구소 책임자 한 박사. 재판에서 무죄를 받고 지금은 대형 길드의 고문이다. 오늘 그의 강연이 있다는 기사를 봤다.\n\n주머니 속 손이 떨린다. 분노인지, 공포인지 모르겠다.', 'gate_break', [
    ['강연장 맨 앞줄에 앉는다', 'fire', { fighter: 2 }, { berserker: 1 }, { berserk: 1 }],
    ['그의 동선을 조사한다. 서두르지 않는다', 'ice', { shadow: 2 }, { assassin: 2 }, { loner: 1 }],
    ['다른 피험자들을 모아 증언을 준비한다', 'spirit', { support: 1, summon: 1 }, null, { charisma: 1 }],
    ['가지 않는다. 그 사람 때문에 내 삶을 쓰지 않겠다', 'steel', { guard: 1, mage: 1 }, null, { lucky: 1 }],
  ]),

  // ===== 평범한 대학생 (광주) =====
  student_2: PRO_INTRO('육상부', '체육교육과 2학년, 육상부. 100미터 기록이 석 달째 제자리다. 코치가 스톱워치를 내던진다. "너 각성자 애들이랑 같은 트랙 뛰면 꼴찌야."\n\n운동장 끝, 체육관 지붕 위로 보랏빛이 스친다.', 'gb_school', [
    ['한 번 더 뛴다. 다리가 터져도', 'bolt', { fighter: 1, shadow: 1 }, null, { quick: 2 }],
    ['코치에게 대든다. "각성자랑 왜 비교해요?"', 'fire', { fighter: 2 }, { monk: 1 }, { reckless: 1 }],
    ['창던지기 쪽으로 종목을 바꿔 볼까 생각한다', 'steel', { fighter: 1, shooter: 1 }, { lancer: 2 }, null],
    ['트랙에 누워 하늘을 본다', 'spirit', { mage: 1, esper: 1 }, null, { mana_sense: 1 }],
  ]),
  student_3: PRO_INTRO('졸업 전시', '미대 졸업 전시 준비. 캔버스 앞에서 사흘째 붓을 못 댔다. 그리고 싶은 건 대붕괴 날의 하늘인데, 그 색을 본 적이 없다.\n\n{friend}이(가) 커피를 들고 들어온다. "쉬엄쉬엄 해. 오늘 시내에서 비엔날레 축제래."', 'gb_festival', [
    ['눈을 감고 떠오르는 색을 그냥 칠한다', 'spirit', { mage: 1, esper: 1 }, { seer: 1 }, { mana_sense: 1 }],
    ['캔버스를 찢고 처음부터 다시', 'fire', { mage: 1, fighter: 1 }, { elementalist: 1 }, { berserk: 1 }],
    ['{friend}을(를) 모델로 앉힌다', 'ice', { support: 1, summon: 1 }, { bard: 1 }, null, { friend: 10 }],
    ['붓 대신 조각칼을 든다', 'steel', { fighter: 1, guard: 1 }, null, { genius: 1 }],
  ]),
  student_4: PRO_INTRO('에테르 공학 동아리', '공대 에테르 공학 동아리. 폐코어로 소형 발전기를 만드는 중이다. 오늘 밤, 처음으로 전구에 불이 들어왔다. 그리고 동아리방 형광등이 전부 터졌다.\n\n선배가 소리친다. "야! 차단기 내려!"', 'gb_school', [
    ['차단기 대신 코어를 맨손으로 잡는다', 'bolt', { mage: 1, esper: 1 }, { elementalist: 1 }, { reckless: 1 }],
    ['측정값을 노트에 미친 듯이 적는다', 'ice', { mage: 2 }, { chronomancer: 1 }, { genius: 1 }],
    ['후배들을 먼저 밖으로 내보낸다', 'steel', { guard: 1, support: 1 }, { warder: 1 }, { charisma: 1 }],
    ['코어 찌꺼기로 다른 걸 만들 수 있을 것 같다', 'fire', { support: 1, mage: 1 }, { alchemist: 2 }, null],
  ]),
  student_5: PRO_INTRO('복학생', '군대를 다녀오니 동기들은 다 졸업반이다. 강의실 맨 뒷줄, 아는 얼굴이 하나도 없다. 등록금 고지서는 가방 속에서 구겨져 있다.\n\n지하철 1호선, 퇴근 시간. 옆자리 사람이 갑자기 코피를 쏟는다.', 'gb_subway', [
    ['휴지를 꺼내 건네고 고개를 받쳐 준다', 'ice', { support: 2 }, { healer: 1 }, null],
    ['비상 버튼을 누르고 승무원을 부른다', 'bolt', { support: 1, guard: 1 }, null, { quick: 1 }],
    ['그 사람 손목의 에테르 반응 팔찌를 본다', 'spirit', { esper: 1, mage: 1 }, null, { mana_sense: 1 }],
    ['군대에서 배운 대로 주변을 정리한다', 'steel', { guard: 2 }, { guardian: 1 }, { iron_body: 1 }],
  ]),
  student_6: PRO_INTRO('휴학, 그리고 카페', '휴학계를 냈다. 양동시장 골목 작은 카페에서 하루 열 시간 일한다. 사장님은 헌터들이 단골이라며 자랑한다.\n\n오늘도 카운터 앞에서 헌터들이 떠든다. "남구 쪽 균열 수치가 미쳤대. 오늘내일 터진다."', 'gb_market', [
    ['헌터들 이야기에 귀를 쫑긋 세운다', 'spirit', { esper: 1, shooter: 1 }, null, { mana_sense: 1 }],
    ['"그거 신고 안 해요?" 끼어든다', 'fire', { guard: 1, fighter: 1 }, null, { reckless: 1 }],
    ['헌터들 주문을 외워 두고 친해진다', 'bolt', { support: 1, shadow: 1 }, { bard: 1 }, { charisma: 1 }],
    ['커피 원두 배합을 바꿔 본다. 손님들이 좋아한다', 'ice', { support: 2 }, { alchemist: 1 }, { merchant: 1 }],
  ]),
  student_7: PRO_INTRO('간호 실습', '간호학과 실습 첫 주. 헌터 전문 병동에 배정됐다. 침대마다 붕대, 비명, 그리고 묘하게 따뜻한 에테르의 냄새.\n\n수간호사가 말한다. "여기선 겁먹으면 환자가 먼저 알아. 웃어."', 'gb_hospital', [
    ['웃는다. 손은 떨려도', 'spirit', { support: 2 }, { healer: 2 }, { charisma: 1 }],
    ['붕대 감는 손이 남들보다 두 배 빠르다', 'bolt', { support: 1, shadow: 1 }, null, { quick: 1 }],
    ['환자의 상처에서 나는 에테르 냄새를 구분해 본다', 'ice', { support: 1, mage: 1 }, { alchemist: 1, poisoner: 1 }, { mana_sense: 1 }],
    ['난동 부리는 환자를 온몸으로 붙잡는다', 'steel', { guard: 2 }, null, { iron_body: 1 }],
  ]),
  student_8: PRO_INTRO('옆집', '대학가 원룸 단지. 옆집에는 밤마다 고양이 수십 마리가 드나드는 이상한 사람이 산다. 오늘은 그 집 문이 열려 있고, 고양이들이 일제히 당신을 본다.\n\n{friend}이(가) 속삭인다. "야, 저 집 사람 헌터래. 은퇴한."', 'gb_apartment', [
    ['고양이 한 마리를 쓰다듬는다. 따라온다', 'spirit', { summon: 2 }, { tamer: 2 }, null],
    ['문을 두드려 인사한다', 'fire', { support: 1, summon: 1 }, null, { charisma: 1 }],
    ['문틈으로 집 안을 들여다본다', 'bolt', { shadow: 2 }, { thief: 1 }, { quick: 1 }],
    ['조용히 문을 닫아 준다', 'ice', { guard: 1, mage: 1 }, null, { loner: 1 }],
  ]),
  student_9: PRO_INTRO('밴드 공연', '밴드 동아리 정기 공연. 무대 뒤에서 기타 줄을 갈다가 손끝이 베였다. 피가 줄에 스며들자 앰프에서 이상한 소리가 난다. 화음 같기도, 울음 같기도 한.\n\n무대는 금남로 거리 축제 한복판이다.', 'gb_festival', [
    ['그 소리 그대로 첫 곡을 시작한다', 'spirit', { support: 2 }, { bard: 2 }, { charisma: 1 }],
    ['드럼 박자에 맞춰 심장이 뛴다', 'fire', { fighter: 1, support: 1 }, { monk: 1 }, { berserk: 1 }],
    ['앰프 회로를 열어 본다', 'bolt', { mage: 1, shooter: 1 }, null, { genius: 1 }],
    ['무대 공포증에 숨을 고른다', 'ice', { mage: 1, esper: 1 }, null, { loner: 1 }],
  ]),
  student_10: PRO_INTRO('각성 준비반', '헌터 지망생 동아리 "각성 준비반". 오늘 에테르 적성 검사 결과가 나왔다. 동기들은 하나둘 "잠재 B" "잠재 C"를 받았다. 당신의 종이엔 "측정 불가".\n\n선배가 어깨를 두드린다. "기계 고장일 거야. 다음에 다시 해."', 'gate_break', [
    ['측정 불가라는 글자를 오래 바라본다', 'spirit', { esper: 1, mage: 1 }, { seer: 1 }, { mana_sense: 1 }, { luck: 1 }],
    ['동아리를 그만둔다', 'ice', { shadow: 1, mage: 1 }, null, { loner: 1 }],
    ['다음 달 재검사를 위해 체력 훈련부터 한다', 'steel', { fighter: 1, guard: 1 }, null, { iron_body: 1 }],
    ['검사 기계를 몰래 다시 켜 본다', 'bolt', { shadow: 1, esper: 1 }, null, { reckless: 1 }],
    ['선배의 방식대로 사격 동아리부터 들어간다', 'fire', { shooter: 2 }, { archer: 1 }, null],
  ]),

  // ---------- 2. 게이트 브레이크 (장소 변형) ----------
  gb_subway: { title: '지하철역 게이트 브레이크', text: '열차가 터널 한가운데서 멈춘다. 비상등이 켜지고, 앞 칸에서 비명이 번진다. 승강장 벽이 보랏빛으로 찢어졌다.\n\n{friend}의 전화가 끊긴다. 계단 아래, 엄마 손을 놓친 아이가 울고 있다. 철로 위로 무언가 기어 온다.',
    choices: [
      { text: '아이를 안고 계단을 거슬러 오른다', e: { steel: 1 }, g: { guard: 2 }, c: { guardian: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '소화기를 뽑아 괴수의 눈에 분사한다', e: { ice: 1 }, g: { fighter: 1, shooter: 1 }, t: { quick: 1 }, next: 'gear' },
      { text: '"다들 이쪽으로!" 비상구 쪽으로 사람들을 이끈다', e: { spirit: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'gear' },
      { text: '끊어진 전선을 괴수 쪽으로 던진다', e: { bolt: 1 }, g: { mage: 1, shadow: 1 }, t: { reckless: 1 }, next: 'gear' },
      { text: '쇠파이프를 들고 괴수 앞을 막는다', e: { fire: 1 }, g: { fighter: 2 }, c: { lancer: 1 }, next: 'gear' },
    ] },
  gb_school: { title: '캠퍼스 게이트 브레이크', text: '운동장 한가운데 하늘이 찢어진다. 스프링클러가 터지고, 건물마다 대피 방송이 울린다. 교정에 견학 온 초등학생들이 줄지어 서 있다.\n\n{friend}이(가) 손짓한다. "강당으로! 거기가 대피소야!" 그런데 괴수 하나가 이미 강당 문 앞에 있다.',
    choices: [
      { text: '아이들을 등 뒤로 숨기고 막아선다', e: { steel: 1 }, g: { guard: 2 }, c: { paladin: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '과학관에서 본 화학약품 위치를 떠올린다', e: { ice: 1 }, g: { mage: 1, support: 1 }, c: { alchemist: 1 }, t: { genius: 1 }, next: 'gear' },
      { text: '옥상으로 올라가 괴수의 위치를 알린다', e: { bolt: 1 }, g: { shooter: 2 }, t: { quick: 1 }, next: 'gear' },
      { text: '아이들에게 노래를 부르게 하며 침착하게 이끈다', e: { spirit: 1 }, g: { support: 2 }, c: { bard: 1 }, t: { charisma: 1 }, friend: 5, next: 'gear' },
      { text: '야구 배트를 집어 든다', e: { fire: 1 }, g: { fighter: 2 }, t: { berserk: 1 }, next: 'gear' },
    ] },
  gb_market: { title: '시장 게이트 브레이크', text: '좌판이 뒤집히고 과일이 굴러간다. 시장 지붕 위로 보랏빛 균열이 번진다. 생선 가게 수조가 깨지며 물과 함께 이빨 달린 무언가가 쏟아진다.\n\n{friend}이(가) 상인 할머니를 부축하고 있다. 골목 안쪽에서 아이 울음소리가 들린다.',
    choices: [
      { text: '좌판 철판을 방패 삼아 골목으로 들어간다', e: { steel: 1 }, g: { guard: 2 }, c: { guardian: 1 }, next: 'gear' },
      { text: '가스통 밸브를 잠그러 뛰어간다', e: { fire: 1 }, g: { support: 1, fighter: 1 }, t: { reckless: 1 }, next: 'gear' },
      { text: '상인들에게 골목 지도를 그려 가며 길을 알린다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, t: { charisma: 1 }, friend: 5, next: 'gear' },
      { text: '얼음 창고 문을 열어 괴수를 가둔다', e: { ice: 1 }, g: { mage: 1, shadow: 1 }, t: { genius: 1 }, next: 'gear' },
      { text: '지붕 위로 올라가 괴수를 유인한다', e: { bolt: 1 }, g: { shadow: 2 }, t: { quick: 1 }, next: 'gear' },
    ] },
  gb_hospital: { title: '병원 게이트 브레이크', text: '정전. 비상 발전기가 돌기까지 30초. 복도 끝 중환자실 창문이 보랏빛으로 물든다. 산소 호흡기 경보음이 일제히 울린다.\n\n{friend}이(가) 휠체어를 밀며 달려온다. "엘리베이터 멈췄어! 위층에 애들이 있어!"',
    choices: [
      { text: '환자를 업고 비상계단을 오른다', e: { steel: 1 }, g: { guard: 1, support: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '산소통 밸브를 하나하나 수동으로 연다', e: { ice: 1 }, g: { support: 2 }, c: { healer: 1 }, next: 'gear' },
      { text: '복도 끝 괴수를 향해 소독용 알코올병을 던진다', e: { fire: 1 }, g: { fighter: 1, shooter: 1 }, t: { reckless: 1 }, next: 'gear' },
      { text: '발전기실로 뛰어가 수동으로 시동을 건다', e: { bolt: 1 }, g: { mage: 1, guard: 1 }, t: { quick: 1 }, next: 'gear' },
      { text: '겁에 질린 아이들에게 괜찮다고 말해 준다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, c: { priest: 1 }, t: { charisma: 1 }, friend: 5, next: 'gear' },
    ] },
  gb_festival: { title: '축제 게이트 브레이크', text: '불꽃이 터지던 하늘에, 불꽃이 아닌 것이 터졌다. 보랏빛 균열. 환호성이 비명으로 바뀐다. 사람들이 출구로 몰리며 서로를 밀친다.\n\n{friend}의 손이 인파 속에서 미끄러진다. 무대 앞, 미아 방송 팻말을 든 아이가 홀로 서 있다.',
    choices: [
      { text: '인파를 거슬러 아이에게 간다', e: { steel: 1 }, g: { guard: 2 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '무대 마이크를 잡고 대피 방향을 외친다', e: { spirit: 1 }, g: { support: 2 }, c: { bard: 1 }, t: { charisma: 1 }, next: 'gear' },
      { text: '{friend}의 손을 놓치지 않고 끝까지 붙잡는다', e: { ice: 1 }, g: { guard: 1, summon: 1 }, friend: 10, next: 'gear' },
      { text: '불꽃 발사대를 괴수 쪽으로 돌린다', e: { fire: 1 }, g: { shooter: 2 }, t: { reckless: 1 }, next: 'gear' },
      { text: '인파 사이를 번개처럼 빠져나가 길을 튼다', e: { bolt: 1 }, g: { shadow: 1, fighter: 1 }, t: { quick: 1 }, next: 'gear' },
    ] },
  gb_apartment: { title: '아파트 단지 게이트 브레이크', text: '단지 놀이터 위 하늘이 갈라진다. 경비실 확성기가 지직거리고, 베란다마다 사람들이 고개를 내민다. 주차장 쪽에서 자동차 경보음이 줄줄이 울린다.\n\n{friend}이(가) 소리친다. "1층에 할머니랑 애 혼자 있는 집 있잖아!"',
    choices: [
      { text: '그 집으로 뛰어가 현관문을 부순다', e: { steel: 1 }, g: { guard: 2 }, c: { guardian: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '놀이터의 괴수를 향해 화분을 던진다', e: { fire: 1 }, g: { fighter: 2 }, t: { berserk: 1 }, next: 'gear' },
      { text: '단지 단톡방에 대피 경로를 올린다', e: { bolt: 1 }, g: { support: 1, shooter: 1 }, t: { quick: 1 }, next: 'gear' },
      { text: '옥상 물탱크 밸브를 열어 계단을 얼음판으로 만든다', e: { ice: 1 }, g: { mage: 1, shadow: 1 }, t: { genius: 1 }, next: 'gear' },
      { text: '짖는 개들이 한 방향을 가리킨다. 따라간다', e: { spirit: 1 }, g: { summon: 2 }, c: { tamer: 1 }, friend: 5, next: 'gear' },
    ] },
});

// ---------- 도입 → 각성 이야기 갈래 ----------
// 도입 장면의 선택지마다 다른 갈래로 이어진다. 'gb' 는 원래의 게이트 브레이크(장소 변형)로 간다.
// 갈래: 게이트 브레이크, 병상, 유물, 꿈과 신병, 에테르 폭풍, 각성자 범죄, 불법 각성제, 결투, 조난, 체험 관광, 친구의 폭주, 정기 검진, 짐꾼
const PRO_ARC_POOL = {
  chaebol: ['gb', 'relic', 'crime', 'drug', 'duel', 'tour', 'late', 'storm', 'dream'],
  orphan: ['gb', 'ill', 'crime', 'duel', 'storm', 'friend', 'dream', 'nest', 'relic'],
  soldier: ['gb', 'wild', 'storm', 'crime', 'nest', 'duel', 'ill', 'tour', 'friend'],
  subject: ['gb', 'drug', 'late', 'friend', 'relic', 'dream', 'ill', 'crime', 'wild'],
  student: ['gb', 'tour', 'late', 'duel', 'friend', 'dream', 'drug', 'storm', 'wild', 'nest', 'ill'],
};
for (const [bg, pool] of Object.entries(PRO_ARC_POOL)) {
  for (let k = 1; k <= 10; k++) {
    const sc = PROLOGUE[`${bg}_${k}`]; if (!sc) continue;
    sc.choices.forEach((ch, i) => {
      const arc = pool[(k * 2 + i) % pool.length];
      if (arc !== 'gb') ch.next = `${arc}_1`;
    });
  }
}
// 도입과 갈래를 하나하나 읽어 보고 어색한 조합을 바로잡은 목록 ("도입:선택지 번호" → 갈래 또는 장면 id)
const PRO_ROUTE_FIX = {
  'chaebol_1:0': 'duel',
  'chaebol_1:1': 'late',
  'chaebol_1:2': 'tour',
  'chaebol_1:3': 'crime',
  'chaebol_2:0': 'gb_festival',
  'chaebol_2:1': 'late',
  'chaebol_2:2': 'duel',
  'chaebol_2:3': 'storm',
  'chaebol_3:0': 'storm',
  'chaebol_3:1': 'relic',
  'chaebol_3:2': 'dream',
  'chaebol_3:3': 'crime',
  'chaebol_4:0': 'friend',
  'chaebol_4:1': 'tour',
  'chaebol_4:2': 'drug',
  'chaebol_4:3': 'dream',
  'chaebol_5:0': 'duel',
  'chaebol_5:1': 'gb_subway',
  'chaebol_5:2': 'relic',
  'chaebol_5:3': 'dream',
  'chaebol_6:0': 'gb_hospital',
  'chaebol_6:1': 'late',
  'chaebol_6:2': 'ill',
  'chaebol_6:3': 'storm',
  'chaebol_7:0': 'duel',
  'chaebol_7:1': 'tour',
  'chaebol_7:2': 'crime',
  'chaebol_7:3': 'dream',
  'chaebol_8:0': 'storm',
  'chaebol_8:1': 'drug',
  'chaebol_8:2': 'late',
  'chaebol_8:3': 'gb_apartment',
  'chaebol_9:0': 'friend',
  'chaebol_9:1': 'crime',
  'chaebol_9:2': 'duel',
  'chaebol_9:3': 'nest',
  'chaebol_10:0': 'dream',
  'chaebol_10:1': 'ill',
  'chaebol_10:2': 'storm',
  'chaebol_10:3': 'crime',
  'orphan_1:0': 'duel',
  'orphan_1:1': 'ill',
  'orphan_1:2': 'gate_break',
  'orphan_2:0': 'gb_market',
  'orphan_2:1': 'friend',
  'orphan_2:2': 'nest',
  'orphan_2:3': 'storm',
  'orphan_3:0': 'gate_break',
  'orphan_3:1': 'nest',
  'orphan_3:2': 'dream',
  'orphan_3:3': 'relic',
  'orphan_4:0': 'late',
  'orphan_4:1': 'gb_apartment',
  'orphan_4:2': 'nest',
  'orphan_4:3': 'friend',
  'orphan_5:0': 'dream',
  'orphan_5:1': 'tour',
  'orphan_5:2': 'duel',
  'orphan_5:3': 'gb_festival',
  'orphan_6:0': 'gb_hospital',
  'orphan_6:1': 'storm',
  'orphan_6:2': 'ill',
  'orphan_6:3': 'friend',
  'orphan_7:0': 'duel',
  'orphan_7:1': 'gb_school',
  'orphan_7:2': 'crime',
  'orphan_7:3': 'wild',
  'orphan_8:0': 'ill',
  'orphan_8:1': 'crime',
  'orphan_8:2': 'gb_hospital',
  'orphan_8:3': 'dream',
  'orphan_9:0': 'gate_break',
  'orphan_9:1': 'crime',
  'orphan_9:2': 'nest',
  'orphan_9:3': 'duel',
  'orphan_10:0': 'crime',
  'orphan_10:1': 'tour',
  'orphan_10:2': 'dream',
  'orphan_10:3': 'friend',
  'soldier_1:0': 'nest',
  'soldier_1:1': 'crime',
  'soldier_1:2': 'storm',
  'soldier_2:0': 'dream',
  'soldier_2:1': 'gb_festival',
  'soldier_2:2': 'crime',
  'soldier_2:3': 'storm',
  'soldier_3:0': 'ill',
  'soldier_3:1': 'dream',
  'soldier_3:2': 'wild',
  'soldier_3:3': 'gate_break',
  'soldier_4:0': 'storm',
  'soldier_4:1': 'gb_hospital',
  'soldier_4:2': 'drug',
  'soldier_4:3': 'crime',
  'soldier_5:0': 'gb_subway',
  'soldier_5:1': 'crime',
  'soldier_5:2': 'drug',
  'soldier_5:3': 'duel',
  'soldier_6:0': 'storm',
  'soldier_6:1': 'crime',
  'soldier_6:2': 'duel',
  'soldier_6:3': 'gb_apartment',
  'soldier_7:0': 'wild',
  'soldier_7:1': 'dream',
  'soldier_7:2': 'storm',
  'soldier_7:3': 'gate_break',
  'soldier_8:0': 'duel',
  'soldier_8:1': 'friend',
  'soldier_8:2': 'gb_market',
  'soldier_8:3': 'late',
  'soldier_9:0': 'gate_break',
  'soldier_9:1': 'wild',
  'soldier_9:2': 'storm',
  'soldier_9:3': 'crime',
  'soldier_10:0': 'storm',
  'soldier_10:1': 'crime',
  'soldier_10:2': 'friend',
  'soldier_10:3': 'gb_subway',
  'student_1:0': 'duel',
  'student_1:1': 'relic',
  'student_1:2': 'crime',
  'student_1:3': 'friend',
  'student_2:0': 'drug',
  'student_2:1': 'late',
  'student_2:2': 'gb_school',
  'student_2:3': 'storm',
  'student_3:0': 'dream',
  'student_3:1': 'storm',
  'student_3:2': 'friend',
  'student_3:3': 'relic',
  'student_4:0': 'ill',
  'student_4:1': 'late',
  'student_4:2': 'storm',
  'student_4:3': 'gb_school',
  'student_5:0': 'ill',
  'student_5:1': 'gb_subway',
  'student_5:2': 'drug',
  'student_5:3': 'crime',
  'student_6:0': 'gb_market',
  'student_6:1': 'duel',
  'student_6:2': 'nest',
  'student_6:3': 'friend',
  'student_7:0': 'ill',
  'student_7:1': 'friend',
  'student_7:2': 'dream',
  'student_7:3': 'drug',
  'student_8:0': 'dream',
  'student_8:1': 'drug',
  'student_8:2': 'storm',
  'student_8:3': 'wild',
  'student_9:0': 'storm',
  'student_9:1': 'gb_festival',
  'student_9:2': 'late',
  'student_9:3': 'ill',
  'student_10:0': 'nest',
  'student_10:1': 'ill',
  'student_10:2': 'gate_break',
  'student_10:3': 'late',
  'student_10:4': 'tour',
  'subject_1:0': 'ill',
  'subject_1:1': 'friend',
  'subject_1:2': 'relic',
  'subject_1:3': 'dream',
  'subject_2:0': 'gb_subway',
  'subject_2:1': 'dream',
  'subject_2:2': 'crime',
  'subject_2:3': 'relic',
  'subject_3:0': 'ill',
  'subject_3:1': 'dream',
  'subject_3:2': 'friend',
  'subject_3:3': 'gate_break',
  'subject_4:0': 'dream',
  'subject_4:1': 'gb_hospital',
  'subject_4:2': 'drug',
  'subject_4:3': 'ill',
  'subject_5:0': 'relic',
  'subject_5:1': 'gb_apartment',
  'subject_5:2': 'friend',
  'subject_5:3': 'wild',
  'subject_6:0': 'drug',
  'subject_6:1': 'dream',
  'subject_6:2': 'gb_market',
  'subject_6:3': 'friend',
  'subject_7:0': 'dream',
  'subject_7:1': 'friend',
  'subject_7:2': 'gb_festival',
  'subject_7:3': 'ill',
  'subject_8:0': 'gb_school',
  'subject_8:1': 'dream',
  'subject_8:2': 'relic',
  'subject_8:3': 'drug',
  'subject_9:0': 'gb_hospital',
  'subject_9:1': 'ill',
  'subject_9:2': 'dream',
  'subject_9:3': 'friend',
  'subject_10:0': 'duel',
  'subject_10:1': 'drug',
  'subject_10:2': 'friend',
  'subject_10:3': 'wild',
};
for (const [key, arc] of Object.entries(PRO_ROUTE_FIX)) {
  const [id, i] = key.split(':'); const ch = PROLOGUE[id] && PROLOGUE[id].choices[+i];
  if (ch) ch.next = PROLOGUE[arc] ? arc : `${arc}_1`;
}

const PROLOGUE_START = Object.fromEntries(['chaebol', 'orphan', 'soldier', 'subject', 'student'].map((bg) => [bg, Array.from({ length: 10 }, (_, i) => `${bg}_${i + 1}`)]));

// 각성 등급: 대부분 F급이지만, 재능과 운이 따르면 더 높은 등급으로 각성하기도 한다.
// 등급은 각성 직후에는 알 수 없고, 헌터 자격 시험이 끝난 뒤 협회가 측정해 알려 준다.
function rollAwakenRank(score = 0, rng = Math.random) {
  const s = Math.max(0, score);
  const w = [Math.max(22, 62 - s * 6), 25 + s * 2, 9 + s * 2, 3 + s, 1 + s * 0.4];
  let r = rng() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
  return 0;
}

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
  const rank = rollAwakenRank((sc.talent || 0) + (sc.luck || 0) * 0.7 + (talent >= 7 ? 1 : 0), rng);
  return { element, talent, cls: best.id, traits, rank };
}
