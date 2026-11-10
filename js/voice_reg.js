// ===== 말투 맞추기: 한 인물은 장면 내내 한 말투 (영역 D) =====
// 성격 50종 대사(persona_greet·persona_council)와 옛 기질 틀(just/kind/cold…)이 한 장면에 섞이면
// "…하지 않소" 다음에 "긴장되죠?"처럼 말투가 휙휙 바뀐다. 성격 대사의 말투를 읽어 기질 틀의 열을 고른다.
//  - 해요·합쇼체 성격 → kind 열 · 하오체 성격 → hao 열(아래 VOICE_HAO) · 반말 성격 → 기질(cold/warlike/greedy) 또는 just 열
// 쓰는 법: voiceKey(n) → 'kind' | 'just' | 'cold' | 'warlike' | 'greedy' | 'hao'
const VOICE_REG_CACHE = {};
function voiceRegOfPersona(id) {
  if (!id) return null;
  if (id in VOICE_REG_CACHE) return VOICE_REG_CACHE[id];
  const lines = [];
  const P = typeof PERSONA_GREET !== 'undefined' && PERSONA_GREET[id];
  if (P) for (const k of ['leadGreet', 'leadBrief', 'greet', 'welcome']) lines.push(...(P[k] || []));
  const c = { yo: 0, hao: 0, ban: 0 };
  for (const t of lines) {
    for (const x0 of String(t).replace(/["'”’)\s]+$/, '').split(/[.!?…]+\s+/)) {
      const x = x0.replace(/[.!?…~]+$/, '');
      if (/(요|니다|니까|세요|죠)$/.test(x)) c.yo++; else if (/(오|소|구려|시오|하오|겠소|이오|리다)$/.test(x)) c.hao++; else c.ban++;
    }
  }
  const r = !lines.length ? null : c.hao > c.yo && c.hao > c.ban ? 'hao' : c.yo > c.ban ? 'yo' : 'ban';
  VOICE_REG_CACHE[id] = r;
  return r;
}
function voiceKey(n) {
  if (!n) return 'just';
  const reg = voiceRegOfPersona(n.persona);
  const pers = n.personality || 'just';
  if (reg === 'yo') return 'kind';
  if (reg === 'hao') return 'hao';
  if (reg === 'ban') return ['cold', 'warlike', 'greedy'].includes(pers) ? pers : 'just';
  return pers;
}
// 기질 틀 표 T(열: just/kind/cold…)에서 그 사람 말투의 줄. hao 줄이 없으면 hao 표 → just 순
function voicePick(T, n, hao) {
  if (!T) return '';
  const k = voiceKey(n);
  if (k === 'hao' && hao) return hao;
  return T[k] ?? (k === 'warlike' || k === 'greedy' || k === 'hao' ? T.just : T.just) ?? '';
}

// 하오체 줄 (기사도 성격 등). 키는 각 표의 키와 같다.
const VOICE_HAO = {
  leadSay: {
    brief: '오늘 그대들 임시 파티의 리더를 맡은 선임이오. 게이트는 문 열자마자 싸우는 곳이 아니오. 먼저 살피고, 고르고, 그다음에 싸우는 것이오. 순서를 그르치면 목숨을 잃소.',
    ex1: '갈림길이오. 탐색에선 고른 행동이 다음 전투를 바꾸오. 정찰하면 적이 약해지고, 욕심내면 적이 늘어나오. 정답은 없소. 결과를 감당하는 것이 헌터요.',
    ex1after: '좋소. 이제 진짜 전투요. 동료들은 각자 알아서 싸울 것이니, 그대는 그대 몫만 하시오.',
    ex2: '보급 상자요. 게이트 안의 상자는 반은 선물이고 반은 함정이오. 열기 전에 확인하는 방법도 있소. 그리고 이 앞이 보스 구역이오.',
    ex2after: '보스는 체력이 많고 한 방이 세오. 막는 이가 끌고, 치는 이가 약점을 노리시오. 위험하면 회복약을 아끼지 마시오.',
    gauge: '저마다 움직이는 속도가 다르오. 빠른 자가 먼저 치오. 동료들은 알아서 싸우니, 그대는 그대 몫만 하시오.',
    turn: '{name}, 지금이오. 서두르지 말고 판단하시오.',
    aimEnemy: '어느 놈부터 칠지 정하시오.',
    aimAlly: '누구를 돌보겠소?',
    aimNone: '그건 겨눌 필요 없는 기술이오. 바로 쓰시오.',
    done: '좋소. 다치면 바로 약을 먹고, 버거우면 막으며 버티시오. 무리는 금물이오.',
    boss: '보스요. 속성 상성을 보시오. 상성이 맞으면 피해가 크게 들어가오.',
    tools: '전투가 답답하면 위에서 속도를 올리시오. 손에 익으면 자동으로 맡겨도 되오.',
    win: '"수고했소. 처음치곤 훌륭했소. 밖에선 내가 없으니, 오늘 한 순서를 잊지 마시오."',
    lose: '"내가 끼어든 건 이번이 마지막이오. 밖에서는 아무도 대신 싸워 주지 않소."',
  },
  examMap: {
    intro: '이 게이트는 층층이 이어져 있소. 위로 갈수록 깊고, 맨 끝에 주인이 있소. 길마다 괴수가 있거나, 무언가 놓여 있거나, 숨 돌릴 곳이 있소. 첫 길은 내가 제안하겠소. 의견은 다 같이 내시오.',
    pick1: '저쪽에서 무언가 반짝이지만, 왼쪽으로 가야 다음 갈림길 둘이 다 열리오. 길을 넓게 남겨 두는 것이오.',
    arrive: '무언가 있소. 무슨 일이 생길지 모르오. 어떻게 하느냐에 따라 다음 싸움이 달라지오.',
    your1: '앞의 두 길 모두 괴수 기척이 있소. 이번엔 그대가 고르시오.',
    your2: '왼쪽은 녹슨 보급 상자, 오른쪽은 에테르 샘이오. 상자는 보상이 있으나 함정일 수도 있고, 샘은 확실히 회복되오. 체력을 보고 그대가 정하시오. 어느 쪽이든 괜찮소.',
    boss: '저 너머가 이 게이트의 주인이오. 들어가면 돌아 나올 수 없소. 준비되었으면 갑시다.',
    go: '인사는 이쯤 하고 들어갑시다. 내 뒤를 따르시오.',
  },
  propose: (nm) => `첫 칸은 저 ${nm}이오. 내가 앞장서겠소. 의견이 있으면 지금 말하시오.`,
  reply: {
    ok: '좋소. 갑시다. 내 뒤를 따르시오.',
    force: '반대는 들었소. 그래도 가오. 첫 칸은 훈련용이고, 책임은 내가 지겠소.',
    persuade: '걱정은 아오. 첫 칸은 훈련용이고, 내가 맨 앞에 서겠소. 함께 갑시다.',
    say: '고맙소. 뒤는 그대에게 맡기겠소.',
  },
  ask: (L, slot, t) => `${t.name}의 리더 ${L.name}요. ${slot} 한 자리가 비어 있소. 함께하겠소? 처음 한 해는 내 곁에서 배우시오.`,
};
