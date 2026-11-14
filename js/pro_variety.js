// ===== 프롤로그 선택지 말투 바꾸기 (D) =====
// 같은 결과(점수·깃발)는 그대로, 말만 판마다 바뀐다. choice.alt 에 다른 말투를 넣으면 장면에 들어올 때 하나를 고른다.
const PRO_ALT = {
  verdict: [
    ['측정기 손잡이를 꼭 쥔다. "누가 다치는 걸 보는 게 싫어서요."', '"제가 막을 수 있었던 일이 있었거든요. 다음엔 막으려고요."', '천천히 에테르를 흘린다. "지킬 사람이 생겨서요."'],
    ['말 대신 측정기에 힘을 쏟는다. 바늘이 끝까지 넘어간다. "이게 대답이에요."', '"이유요? 몸이 가만히 못 있어요." 측정기가 비명을 지른다', '경고등이 켜질 때까지 힘을 민다. "적어 주세요. 하고 싶어서라고."'],
    ['일부러 힘을 반만 낸다. "생활비요. 월세가 밀렸거든요."', '"현실적으로요? 코어 한 개 값이 제 반년 월급이던데요."', '어깨를 으쓱한다. "빚이 좀 있어서요. 멋없죠?"'],
    ['"그날 열린 게이트, 아무도 이유를 모르잖아요. 그게 궁금해요."', '"에테르가 뭔지 알고 싶어요. 제 몸에서 나오는 거니까."', '측정기 수치를 오래 본다. "이 숫자가 왜 이렇게 나오는지부터 알아야겠어요."'],
    ['유리 너머 {friend}을(를) 본다. "같이 가기로 했거든요, 저 녀석이랑."', '{friend}이(가) 손을 흔든다. 대답 대신 마주 흔든다. "…쟤 때문이에요."', '"혼자였으면 안 했어요." 시선이 유리 너머 {friend}에게 간다'],
  ],
  verdict_guild: [
    ['"아직 등급이 없으니까 지금이 제일 싸요. 나중엔 못 사요."', '"오르기 전에 사는 게 투자잖아요. 아닌가요?"', '태블릿을 가리킨다. "거기 숫자가 나오면 제 몸값도 오를 텐데요."'],
    ['말 대신 손바닥에 에테르를 모은다. 태블릿이 지직거린다', '대답 대신 탁자 위 물컵을 본다. 물이 저절로 끓기 시작한다', '"보여 드릴게요." 면접실 조명이 한 번 깜빡인다'],
    ['"투자 말고 계약서부터 보여 주세요."', '"조건부터 듣죠. 위약금 조항이 몇 쪽이에요?"', '"제가 왜 투자받아야 하는지보다, 그쪽이 뭘 주는지가 먼저 아닐까요?"'],
    ['"길드는 아직이요. 같이 다닐 사람이 있어서요." {friend}의 얼굴이 떠오른다', '"죄송하지만, 먼저 약속한 사람이 있어요." {friend} 생각이 난다', '"혼자 들어가면 재미없을 것 같아서요." {friend}에게 문자를 보낸다'],
    ['면접 내내 창밖만 본다. "다음에 제가 부르면 오세요."', '자리에서 일어난다. "등급 나오면 그때 다시 연락 주세요. 가격은 그때 정하죠."', '태블릿을 밀어낸다. "저는 팔 생각이 없는데요."'],
  ],
  verdict_street: [
    ['무시하고 412번 표를 꼭 쥔 채 다시 줄을 선다', '"괜찮아요. 기다릴게요." 대기 의자로 돌아간다', '브로커를 지나쳐 청사 안으로 들어간다. 정식으로 할 거다'],
    ['"얼마예요?" 일단 조건부터 듣는다', '"원하는 등급이라… 구체적으로 어떻게요?" 귀를 기울인다', '명함을 받아 지갑에 넣는다. 일단은'],
    ['브로커의 손목 문신을 기억해 둔다. 언젠가 쓸모가 있겠지', '대답 없이 브로커의 얼굴과 말투를 새겨 둔다', '"생각해 볼게요." 돌아서며 번호판까지 외워 둔다'],
    ['브로커를 등지고 {friend}에게 전화한다. "줄이 길어서 오늘 늦겠어. 등록 끝나면 우리 같이 팀 짜자."', '{friend}에게 문자를 보낸다. "브로커가 붙었는데 무시했어. 등록 끝나면 우리 둘이 팀 하자."', '{friend}에게 전화한다. "수상한 사람이 꼬드기는데 안 넘어갈 거야. 등록하면 너랑 같이 다닐래."'],
    ['브로커의 멱살을 잡고 관리국 경비를 부른다', '"경비원님! 여기요!" 브로커가 줄행랑친다', '브로커 손목을 비틀어 잡는다. "같이 안으로 들어가시죠."'],
  ],
};
for (const [id, list] of Object.entries(PRO_ALT)) {
  const sc = PROLOGUE[id]; if (!sc || !Array.isArray(sc.choices)) continue;
  list.forEach((alt, i) => { if (sc.choices[i]) sc.choices[i].alt = alt; });
}
{
  const baseRender = UI.renderPrologue;
  UI.renderPrologue = function () {
    const s = this.pro; const sc = s && PROLOGUE[s.id];
    if (sc && Array.isArray(sc.choices)) {
      s.altPick ||= {};
      if (!s.altPick[s.id]) s.altPick[s.id] = sc.choices.map((c) => (c.alt ? Math.floor(Math.random() * (c.alt.length + 1)) : 0));
      sc.choices.forEach((c, i) => { if (!c.alt) return; c._t0 ??= c.text; const k = s.altPick[s.id][i]; c.text = k ? c.alt[k - 1] : c._t0; });
    }
    return baseRender.call(this);
  };
}

// 생활형 마무리(희망 직무): 일반 대답 2개 + 각성 속성 대답 1개
{
  const LIFE_END = new Set(['nap_2', 'cvs_2', 'game_2', 'bloom_2', 'quest_2']);
  const baseShown = UI.proShown;
  UI.proShown = function (id) {
    if (!LIFE_END.has(id)) return baseShown.call(this, id);
    const s = this.pro; s.lifeShown ||= {}; if (s.lifeShown[id]) return s.lifeShown[id];
    const ch = PROLOGUE[id].choices; const e = (s.sc && s.sc.e) || {};
    const el = Object.keys(e).sort((a, b) => e[b] - e[a])[0];
    const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const gen = shuffle(ch.map((c, i) => i).filter((i) => !ch[i].el)).slice(0, 2);
    const mine = shuffle(ch.map((c, i) => i).filter((i) => ch[i].el === el)).slice(0, 1);
    return (s.lifeShown[id] = [...gen, ...mine]);
  };
}


// 다음 장면 위의 "「앞 장면」 그 뒤 — 이어지는 한 줄"은 뺀다 (사용자: 이어지는 이야기를 못 받쳐 주면 오히려 어색하다)
{
  const baseR = UI.renderPrologue;
  UI.renderPrologue = function () { const r = baseR.apply(this, arguments); for (const el of document.querySelectorAll('#pro-scene .pro-gap')) el.remove(); return r; };
}
