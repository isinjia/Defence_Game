// ===== 게이트 크로니클: 사건 개연성 보정 (docs/종합_평가_v1.91.md 1순위 A·B·C) =====
// A. 대붕괴 뒤 경과 연수: 메인·사건 문장의 고정 "이십 년/20년"을 지금 연도 기준으로 바꾼다(2087년 시작 = 20년).
// B. 등급과 안 맞는 생활 사건: 낮은 등급 전용으로 묶고, 높은 등급에는 그 등급다운 변형을 준다.
// C. 메인과 소재가 겹치는 무작위 사건: 메인의 그 대목이 진행 중이면 나오지 않는다.

const COLLAPSE_YEAR = 2067;
// 한자어 수 읽기(1~99): 20 → 이십, 35 → 삼십오
const hanNum = (n) => {
  const d = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  n = Math.max(1, Math.min(99, Math.round(n)));
  const t = Math.floor(n / 10), o = n % 10;
  return (t ? (t > 1 ? d[t] : '') + '십' : '') + d[o];
};

{
  const GP = Game.prototype;
  GP.eraYears = function () { return Math.max(20, (this.year || 2087) - COLLAPSE_YEAR); };

  // A. 메인 본문: "이십 년" → 실제 경과 연수(한글 읽기)
  const baseMain = GP.mainFill;
  if (baseMain) GP.mainFill = function (t) {
    const s = baseMain.call(this, t);
    const n = this.eraYears();
    return n === 20 ? s : s.replace(/이십 년/g, `${hanNum(n)} 년`);
  };
  // A. 무작위 사건: "20년" → 실제 경과 연수(숫자)
  const baseStory = GP.storyFill;
  GP.storyFill = function (str, c) {
    const s = baseStory.call(this, str, c);
    const n = this.eraYears();
    return n === 20 ? s : s.replace(/(^|[^0-9])20년/g, `$1${n}년`);
  };

  // B·C. 사건 조건 보정 (STORY 는 이 파일보다 먼저 다 채워진다)
  const ev = (id) => STORY.find((e) => e.id === id);
  const andWhen = (e, f) => { if (!e) return; const w = e.when; e.when = (g, c) => f(g, c) && (!w || w(g, c)); };
  const cap = (id, maxRank) => { const e = ev(id); if (e && e.maxRank == null) e.maxRank = maxRank; };

  // B. 낮은 등급 전용
  cap('street_pickpocket', 4);   // story_roles.js 가 이미 B급까지로 묶어 둠(그 위는 hi_pickpocket)
  cap('base_black_market', 3);   // 500크레딧 거래
  cap('base_duel_challenge', 4); // 아무나 거리에서 A급에게 덤비지 않는다
  cap('base_mentor', 4);         // 지나가던 노인이 호흡법을 고쳐 주는 단계
  cap('craft_guild_scout', 3);   // "수습부터 배워요" 권유

  // B. 높은 등급 변형
  S({ id: 'hi_pickpocket', city: true, minRank: 5, text: '등 뒤에서 지갑으로 뻗던 손이 멈춘다. 돌아보니 앳된 소년이 당신 얼굴을 알아보고 하얗게 굳어 있다. 손가락 끝에 속도 계열 에테르가 떨린다.',
    choices: [
      { text: '조용히 손목을 놓아 준다', do: (g) => '소년은 고개를 꾸벅 숙이고 인파 속으로 사라졌다. 등록되지 않은 각성자다. 이 동네에 저런 아이가 몇이나 될까.' + g.gain({ rep: 2 }) },
      { text: '협회 청소년 등록 창구로 데려간다', do: (g) => '"…밥은 줘요?" 창구 직원이 당신을 보고 서류를 먼저 내밀었다. 소년은 그날 처음으로 이름을 적었다.' + g.gain({ fame: 2, merit: 3 }) },
    ] });
  S({ id: 'hi_duel_request', city: true, minRank: 5, text: '숙소 앞에 젊은 헌터가 무릎을 꿇고 있다. 밤새 기다린 모양이다. "한 수만 가르쳐 주십시오. 한 합이면 됩니다. 평생 기억하겠습니다."',
    choices: [
      { text: '한 합 받아 준다', do: (g) => { g.startSparWithRandomNpc(); return '목검 대신 맨손으로 받아 준다.'; } },
      { text: '자세 하나만 고쳐 주고 보낸다', do: (g) => '어깨에 들어간 힘 하나를 짚어 주었다. 그는 그 자리에서 열 번을 다시 했다.' + g.gain({ fame: 3, rep: 1 }) },
      { text: '"게이트에서 살아남는 게 먼저다."', do: () => '그는 한참 고개를 숙였다가 일어났다. 등이 조금 곧아져 있었다.' },
    ] });
  S({ id: 'hi_black_market', city: true, minRank: 5, text: '뒷골목 암시장 상인이 당신을 알아보고 가판을 급히 덮는다. "아, 아닙니다. 그냥 장난감이에요." 덮개 밑으로 관리국 봉인이 붙은 코어 상자가 보인다.',
    choices: [
      { text: '봉인 번호를 찍어 관리국에 넘긴다', do: (g) => '사흘 뒤 밀수 조직 하나가 통째로 잡혔다는 뉴스가 떴다.' + g.gain({ merit: 6, rep: 2 }) },
      { text: '못 본 척 지나간다', do: () => '상인은 다음 날 가게를 옮겼다.' },
    ] });

  // C. 메인 4~5부 바다 대목(21 심해 신호 ~ 32 해협의 군주)이 진행 중이면 동해 비상 소집은 따로 나오지 않는다
  andWhen(ev('rank_a_nation'), (g) => { const M = g.flags && g.flags.main; const ch = M ? M.ch : 0; return !(ch >= 21 && ch <= 32); });
}
