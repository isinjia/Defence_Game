// ===== 게이트 크로니클: 각성 전야 (스토리로 시작하기) =====
// 출신은 무작위로 정해진다. 어느 경로든 선택은 8번. 장면마다의 선택이 속성(e), 직업 계열(g), 직업(c), 특성(t), 재능(talent)에 점수를 쌓는다.
// {name} 플레이어, {friend} 소꿉친구 이름

const PROLOGUE = {
  // ---------- 1. 출신별 도입 (출신마다 1장면) ----------
  chaebol_1: { title: '강남, 펜트하우스', text: '대리석 식탁 위로 샹들리에 빛이 쏟아진다. 아버지가 와인잔을 내려놓는다.\n\n"백호 시큐리티 지분 일부를 네 앞으로 돌렸다. 각성자가 아니어도 괜찮다. 각성자를 부리는 쪽에 서면 되니까."\n\n창밖, 강남 돔 너머로 게이트 하나가 희미하게 깜빡인다. 그날 밤 {friend}에게서 문자가 온다. "폐상가 쪽 하늘 봤어? 이상해."',
    choices: [
      { text: '"전 부리는 쪽이 되기 싫어요." 자리를 박차고 일어난다', e: { fire: 1 }, g: { fighter: 2 }, c: { swordsman: 1 }, t: { berserk: 1 }, next: 'gate_break' },
      { text: '고개를 끄덕이며 아버지의 계획을 듣는다', e: { steel: 1 }, g: { guard: 1, support: 1 }, t: { merchant: 2 }, next: 'gate_break' },
      { text: '대답 대신 창밖의 게이트를 오래 바라본다', e: { spirit: 1 }, g: { mage: 1, esper: 1 }, t: { mana_sense: 1 }, next: 'gate_break' },
      { text: '경호 실장의 총을 떠올린다. 배워 두고 싶다', e: { bolt: 1 }, g: { shooter: 2 }, c: { gunslinger: 1 }, t: { quick: 1 }, next: 'gate_break' },
    ] },
  orphan_1: { title: '희망의 집', text: '보육원의 아침은 늘 전쟁이다. 동생 여섯의 도시락을 싸고, 열이 나는 원장 할머니께 죽을 쑤고 나면 해가 중천이다. 냉장고도, 통장도 비었다.\n\n오후에는 재개발 용역들이 대문을 걷어차고 갔다. 저녁 무렵 {friend}가 찾아와 말한다. "폐상가 쪽 하늘, 아까부터 보랏빛이야."',
    choices: [
      { text: '대문 앞을 몸으로 막아섰던 손이 아직 떨린다', e: { steel: 1 }, g: { guard: 2 }, t: { iron_body: 2 }, next: 'gate_break' },
      { text: '동생들을 먼저 먹이고 오늘도 굶는다', e: { ice: 1 }, g: { support: 2 }, t: { charisma: 1 }, talent: 1, next: 'gate_break' },
      { text: '용역 차량의 블랙박스를 몰래 빼 온다', e: { bolt: 1 }, g: { shadow: 2 }, c: { thief: 1 }, t: { quick: 1, lucky: 1 }, next: 'gate_break' },
    ] },
  soldier_1: { title: '전역 신고', text: '전역하는 날. 위병소를 나서는데 자꾸 박 상병 얼굴이 떠오른다. 작년 게이트 경계 작전에서 돌아오지 못한 녀석. 주머니 속 녀석의 군번줄이 차갑다.\n\n집에 오니 {friend}가 기다리고 있다. "전역 축하해. 그런데 저기 폐상가 하늘, 좀 이상하지 않아?"',
    choices: [
      { text: '"네 몫까지 싸운다." 헌터 등록 안내서를 챙긴다', e: { fire: 1 }, g: { fighter: 2 }, c: { lancer: 1 }, t: { berserk: 1 }, next: 'gate_break' },
      { text: '녀석의 가족을 찾아가 군번줄을 전한다', e: { spirit: 1 }, g: { support: 2 }, t: { charisma: 1 }, next: 'gate_break' },
      { text: '총구를 겨누던 감각을 떠올리며 숨을 고른다', e: { ice: 1 }, g: { shooter: 2 }, c: { sniper: 1 }, t: { loner: 1 }, next: 'gate_break' },
    ] },
  subject_1: { title: '하얀 방', text: '꿈을 꾼다. 하얀 방, 하얀 가운, 손목의 바코드. "피험자 12번, 에테르 주입 7차." 바늘이 들어오고, 세상이 뒤집힌다.\n\n연구소가 폐쇄된 지 2년. 깨어나도 손목엔 바코드 흉터가 있고, 요즘은 형광등이 저절로 깜빡인다. {friend}가 창밖을 가리킨다. "저 보랏빛, 너도 보여?"',
    choices: [
      { text: '이를 악물고 고통을 견디던 기억', e: { steel: 1 }, g: { guard: 1, fighter: 1 }, t: { iron_body: 2 }, next: 'gate_break' },
      { text: '연구원의 생각이 들렸던 기억', e: { spirit: 1 }, g: { esper: 2 }, c: { telepath: 2 }, next: 'gate_break' },
      { text: '벽 너머로 몸이 미끄러졌던 기억', e: { bolt: 1 }, g: { esper: 1, shadow: 1 }, c: { teleporter: 2 }, next: 'gate_break' },
      { text: '아무 기억도 없는 척, 힘을 숨기며 산다', e: { ice: 1 }, g: { shadow: 2 }, c: { telekinetic: 1 }, t: { loner: 1 }, next: 'gate_break' },
    ] },
  student_1: { title: '편의점 야간', text: '대학 2학년. 조별 과제는 혼자 떠안았고, 새벽에는 편의점 야간 근무다. 취한 손님이 계산대를 내리치며 소리친다. "나 D급 헌터야!"\n\n손님이 나가고 나서야 {friend}의 문자를 본다. "폐상가 쪽 하늘 갈라졌대. 너 거기 근처잖아."',
    choices: [
      { text: '눈을 똑바로 보며 "나가 주세요"라고 했었다', e: { fire: 1 }, g: { fighter: 2 }, t: { reckless: 1 }, next: 'gate_break' },
      { text: '과제를 하며 게이트 논문을 뒤적이던 참이다', e: { ice: 1 }, g: { mage: 2 }, t: { genius: 1, mana_sense: 1 }, next: 'gate_break' },
      { text: '몰래 휴대폰으로 녹화해 신고해 두었다', e: { bolt: 1 }, g: { shooter: 1, shadow: 1 }, t: { quick: 1 }, next: 'gate_break' },
      { text: '{friend}에게 바로 전화를 건다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, t: { charisma: 1 }, friend: 5, next: 'gate_break' },
    ] },

  // ---------- 2. 게이트 브레이크 ----------
  gate_break: { title: '게이트 브레이크', text: '재난 문자가 쏟아진다. [긴급] 게이트 브레이크 발생. 즉시 대피하십시오.\n\n{friend}와 함께 골목에 나서자 괴수들이 쏟아져 나온다. 버스 정류장 아래, 일곱 살쯤 된 아이가 넘어져 울고 있다. 괴수 하나가 고개를 돌린다.',
    choices: [
      { text: '아이에게 달려가 끌어안는다', e: { steel: 1 }, g: { guard: 2 }, c: { paladin: 1, guardian: 1 }, t: { iron_body: 1 }, next: 'gear' },
      { text: '돌을 던져 괴수를 자기 쪽으로 유인한다', e: { bolt: 1 }, g: { shadow: 1, fighter: 1 }, t: { quick: 1 }, next: 'gear' },
      { text: '"여기요!" 주변 어른들을 큰 소리로 부른다', e: { spirit: 1 }, g: { support: 1, summon: 1 }, t: { charisma: 1 }, next: 'gear' },
      { text: '{friend}에게 아이를 맡기고 괴수 앞을 막아선다', e: { fire: 1 }, g: { fighter: 2 }, t: { reckless: 1 }, friend: 10, next: 'gear' },
      { text: '괴수의 걸음을 세며 빈틈을 기다린다', e: { ice: 1 }, g: { mage: 1, shooter: 1 }, t: { mana_sense: 1 }, next: 'gear' },
    ] },

  // ---------- 3. 쓰러진 헌터 ----------
  gear: { title: '쓰러진 헌터', text: '골목 끝에 출동한 헌터가 쓰러져 있다. E급 배지. 피가 멎지 않는다. 그가 손을 뻗어 흩어진 장비를 가리킨다.\n\n"…쓸 줄 알면… 써…"',
    choices: [
      { text: '에테르 블레이드를 줍는다', g: { fighter: 2 }, c: { swordsman: 2, dualblade: 1 }, next: 'voice' },
      { text: '권총을 줍는다', g: { shooter: 2 }, c: { gunslinger: 2, archer: 1 }, next: 'voice' },
      { text: '그의 품에서 빛나는 부적 뭉치를 꺼낸다', g: { east: 2 }, c: { taoist: 2, shaman: 1 }, next: 'voice' },
      { text: '아무것도 줍지 않는다. 그의 상처부터 누른다', g: { support: 2 }, c: { healer: 2, priest: 1 }, talent: 1, next: 'voice' },
      { text: '찌그러진 방패를 들어 올린다', g: { guard: 2 }, c: { guardian: 2 }, t: { iron_body: 1 }, next: 'voice' },
      { text: '굴러다니는 마력석을 주머니에 넣는다', g: { mage: 1, support: 1 }, c: { alchemist: 1, elementalist: 1 }, t: { merchant: 1 }, next: 'voice' },
    ] },

  // ---------- 4. 어둠 속 목소리 (직업 계열) ----------
  voice: { title: '어둠', text: '2층 높이의 괴수가 골목을 막아선다. 꼬리가 옆구리를 후려치고, 몸이 벽에 처박힌다. 숨이 쉬어지지 않는다. 세상이 조용해진다.\n\n어둠 속에서 누군가 묻는다.\n\n"무엇을 원하나."',
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
      { text: '부러진 신호등 기둥을 창처럼 꼬나쥔다', g: { fighter: 2 }, c: { lancer: 3 }, next: 'rooftop' },
      { text: '거리를 벌리고 힘을 쏘아 보낸다', g: { mage: 1, shooter: 1 }, c: { elementalist: 2, archer: 1 }, next: 'rooftop' },
      { text: '그림자처럼 등 뒤로 돌아 급소를 찌른다', g: { shadow: 2 }, c: { assassin: 3 }, next: 'rooftop' },
      { text: '{friend}와 사람들에게 외친다. "내가 신호하면 동시에!"', g: { support: 2 }, c: { bard: 3 }, t: { charisma: 1 }, friend: 10, next: 'night_dream' },
      { text: '괴수의 눈을 똑바로 보며 "멈춰"라고 명령한다', g: { esper: 1, summon: 1 }, c: { telepath: 2, tamer: 2 }, next: 'night_dream' },
      { text: '손바닥 위로 빛을 모아 방패처럼 펼친다', g: { guard: 2 }, c: { paladin: 3 }, next: 'night_dream' },
      { text: '손을 뻗자 부서진 차가 허공으로 떠오른다', g: { esper: 2 }, c: { telekinetic: 3 }, next: 'night_dream' },
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
  rooftop: { title: '병원 옥상', text: '퇴원 전날 밤, 몰래 병원 옥상에 올라간다. 아무도 없다. 손을 펼친다. 이번엔 의지대로 힘을 꺼내 볼 생각이다.',
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
  verdict: { title: '관리국 판정', text: '국가 각성자 관리국 지부. 원통형 측정기 안에 들어선다. 유리 너머에서 {friend}가 눈이 퉁퉁 부은 채 손을 흔든다.\n\n심사관이 말한다. "등급은 F부터 시작합니다. 마지막으로, 헌터가 되려는 이유가 뭡니까?"',
    choices: [
      { text: '숨을 고르고 차분히 에테르를 흘려 보낸다. "사람을 지키고 싶어서요."', talent: 1, t: { charisma: 1 }, friend: 15, next: null },
      { text: '측정기에 있는 힘껏 쏟아붓는다. 계기판이 터진다', luck: 2, t: { reckless: 1, berserk: 1 }, next: null },
      { text: '일부러 힘을 숨긴다. "돈이요. 솔직히."', t: { merchant: 2, lucky: 1 }, next: null },
      { text: '"게이트가 왜 열렸는지 알아내려고요."', talent: 1, t: { mana_sense: 1, genius: 1 }, next: null },
      { text: '유리 너머 {friend}를 본다. "저 녀석 옆에 서 있으려고요."', t: { charisma: 1, iron_body: 1 }, friend: 25, next: null },
    ] },
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
