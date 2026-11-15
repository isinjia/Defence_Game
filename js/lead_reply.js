// ===== 리더 결정 한마디에 이유를 붙인다 (사용자 지적: "이유는 나중에 설명한다면서 나중은 없잖아") =====
// 선택지 글자에서 무슨 행동인지(숨기·버티기·싸우기·챙기기·돕기·살피기·알리기)를 읽어 그 이유를 리더 말투로 말한다.
const LEAD_REASON = (() => {
  const CAT = [
    ['hide', /숨|피한|피해|우회|물러|대피|기다|돌아간|돌아서/],
    ['endure', /정면|맞는다|버틴|견딘/],
    ['fight', /싸|공격|덤벼|돌격|맞서|친다|부순|잡는다|처치/],
    ['take', /챙|연다|열어|줍|가져|캐|판다|모은/],
    ['help', /돕|구한|살린|치료|달랜|나눈|데려/],
    ['scout', /살핀|확인|정찰|조사|조심|지켜|엿본|들여다/],
    ['report', /신고|알린|연락|보고|넘긴/],
  ];
  const T = {
    hide: { banmal: '괜히 맞서다 다칠 필요 없어. 안전한 데로 피하자.', haera: '괜히 맞서다 다칠 필요 없다. 안전한 쪽으로 피한다.', haeyo: '괜히 맞서다 다칠 필요 없어요. 안전한 데로 피해요.', hapsyo: '무리하게 맞설 이유가 없습니다. 안전한 곳으로 피하겠습니다.', hao: '괜히 맞서다 다칠 것 없소. 안전한 곳으로 피하겠소.', cold: '맞설 이유 없다. 피한다.' },
    endure: { banmal: '이 정도는 버틸 수 있어. 몸으로 겪어 두는 것도 공부야.', haera: '이 정도는 버틴다. 몸으로 겪어 두는 것도 공부다.', haeyo: '이 정도는 버틸 수 있어요. 몸으로 겪어 보는 것도 공부예요.', hapsyo: '이 정도는 견딜 수 있습니다. 직접 겪어 두는 것도 훈련입니다.', hao: '이 정도는 버틸 만하오. 몸으로 겪어 두는 것도 공부요.', cold: '버틴다. 이것도 훈련이다.' },
    fight: { banmal: '놔두면 뒤가 위험해. 여기서 정리하고 가자.', haera: '놔두면 뒤가 위험하다. 여기서 정리하고 간다.', haeyo: '그냥 두면 뒤가 위험해요. 여기서 정리하고 가요.', hapsyo: '그대로 두면 후방이 위험합니다. 여기서 정리하고 가겠습니다.', hao: '그냥 두면 뒤가 위태롭소. 여기서 정리하고 가겠소.', cold: '두면 뒤가 위험하다. 친다.' },
    take: { banmal: '챙길 수 있을 때 챙겨야 남는 게 있어. 대신 조심해서 가자.', haera: '챙길 수 있을 때 챙겨야 남는다. 대신 조심해서 간다.', haeyo: '챙길 수 있을 때 챙겨야 남는 게 있어요. 대신 조심해서 해요.', hapsyo: '확보할 수 있을 때 확보해 두겠습니다. 다만 조심해서 진행하겠습니다.', hao: '챙길 수 있을 때 챙겨야 남는 게 있소. 대신 조심하시오.', cold: '챙긴다. 남는 게 있어야 한다.' },
    help: { banmal: '사람부터야. 그냥 지나칠 수는 없어.', haera: '사람이 먼저다. 그냥 지나칠 수 없다.', haeyo: '사람이 먼저예요. 그냥 지나칠 수는 없어요.', hapsyo: '사람이 우선입니다. 그냥 지나칠 수는 없습니다.', hao: '사람이 먼저요. 그냥 지나칠 수는 없소.', cold: '두고 갈 수는 없다.' },
    scout: { banmal: '모르는 채로 움직이면 다쳐. 먼저 살피고 가자.', haera: '모르는 채로 움직이면 다친다. 먼저 살핀다.', haeyo: '모르는 채로 움직이면 다쳐요. 먼저 살펴봐요.', hapsyo: '상황을 모르고 움직이면 위험합니다. 먼저 확인하겠습니다.', hao: '모르는 채로 움직이면 다치오. 먼저 살피겠소.', cold: '먼저 본다.' },
    report: { banmal: '우리 손으로 다 할 일은 아니야. 알릴 데 알리자.', haera: '우리 손으로 다 할 일이 아니다. 알릴 곳에 알린다.', haeyo: '우리끼리 다 할 일은 아니에요. 알릴 데 알려요.', hapsyo: '저희 선에서 처리할 일이 아닙니다. 관계 기관에 알리겠습니다.', hao: '우리 손으로 다 할 일이 아니오. 알릴 곳에 알리겠소.', cold: '우리 일 아니다. 넘긴다.' },
    other: { banmal: '지금 상황에선 이게 제일 나아. 이렇게 하자.', haera: '지금은 이게 제일 낫다. 이렇게 한다.', haeyo: '지금은 이게 제일 나아 보여요. 이렇게 해요.', hapsyo: '현재로서는 이 방법이 가장 낫습니다. 이렇게 하겠습니다.', hao: '지금은 이게 가장 낫소. 이리하겠소.', cold: '이게 낫다. 이걸로 간다.' },
  };
  const reg = (L) => {
    if (L && L.personality === 'cold') return 'cold';
    const r = G.personaRegister ? G.personaRegister(L) : 'haera';
    return r === 'hage' ? 'hao' : (T.other[r] ? r : 'haera');
  };
  return (L, text) => { const c = (CAT.find(([, re]) => re.test(text || '')) || ['other'])[0]; return T[c][reg(L)] || T[c].haera; };
})();

// ===== 시험 탐색: 리더 제안에 반대했을 때의 말 (사용자 요청: "반대했을 때 말도 좀 더 완성도 있게") =====
// 반대가 있어도 원래 길로 가면, 리더가 한 번만 말한다: 왜 그 길인지(가려는 칸 종류에 맞춰) + 설득이면 약속, 밀어붙이면 책임.
// 말투는 리더의 말투(반말·하라·해요·합쇼·하오)와 냉정한 성격을 따른다. 주인공의 말은 넣지 않는다(사용자 결정 2026-11-15).
// council_dlg.js 가 상의 결과를 대화로 바꿔 보여 주는 것을 감싸서 그 대화를 바꿔 끼운다.
if (typeof UI !== 'undefined' && UI.councilLeadResolve) {
  const reg = (L) => {
    if (L && L.personality === 'cold') return 'cold';
    const r = G.personaRegister ? G.personaRegister(L) : 'haera';
    return r === 'hage' ? 'hao' : ({ banmal: 1, haera: 1, haeyo: 1, hapsyo: 1, hao: 1 }[r] ? r : 'haera');
  };
  const WHY = {
    event: {
      banmal: '그래도 여긴 훈련용 게이트라 모르는 칸이어도 크게 위험하진 않아. 그리고 여길 거쳐야 다음 갈림길이 넓게 남아.',
      haera: '그래도 훈련용 게이트다. 모르는 칸이라도 크게 위험하진 않다. 여길 거쳐야 다음 길도 넓게 남는다.',
      haeyo: '그래도 여긴 훈련용 게이트라 모르는 칸이어도 크게 위험하진 않아요. 여길 거쳐야 다음에 고를 길도 넓게 남고요.',
      hapsyo: '다만 훈련용 게이트라 미지 칸이라도 위험은 크지 않습니다. 이곳을 거쳐야 다음 경로도 넓게 남습니다.',
      hao: '허나 훈련용 게이트라 모르는 칸이라도 크게 위험하진 않소. 여기를 거쳐야 다음 길도 넓게 남소.',
      cold: '모르는 칸이라도 훈련용이다. 길도 넓게 남는다.',
    },
    fight: {
      banmal: '그래도 보스 앞에서 처음 손발 맞추는 것보단, 여기서 한 번 맞춰 보는 게 나아.',
      haera: '그래도 보스 앞에서 처음 손발을 맞추는 것보단 여기서 한 번 맞춰 보는 게 낫다.',
      haeyo: '그래도 보스 앞에서 처음 손발 맞추는 것보다, 여기서 한 번 맞춰 보는 게 나아요.',
      hapsyo: '다만 보스 앞에서 처음 합을 맞추는 것보다 여기서 한 번 맞춰 보는 편이 낫습니다.',
      hao: '허나 보스 앞에서 처음 손발을 맞추느니, 여기서 한 번 맞춰 보는 게 낫소.',
      cold: '여기서 손발 맞춘다. 보스 앞에선 늦다.',
    },
    treasure: {
      banmal: '그래도 보급품이 있으면 보스전이 훨씬 편해져. 함정인지는 내가 먼저 확인할게.',
      haera: '그래도 보급품이 있으면 보스전이 훨씬 편해진다. 함정인지는 내가 먼저 본다.',
      haeyo: '그래도 보급품이 있으면 보스전이 훨씬 편해져요. 함정인지는 제가 먼저 확인할게요.',
      hapsyo: '다만 보급품을 챙기면 보스전이 훨씬 수월해집니다. 함정 여부는 제가 먼저 확인하겠습니다.',
      hao: '허나 보급품이 있으면 보스전이 한결 수월하오. 함정인지는 내가 먼저 살피겠소.',
      cold: '보급은 필요하다. 함정은 내가 본다.',
    },
    rest: {
      banmal: '그래도 다친 사람이 있잖아. 보스 앞에서 무너지는 것보단 지금 숨 돌리는 게 나아.',
      haera: '그래도 다친 사람이 있다. 보스 앞에서 무너지느니 지금 숨을 돌리는 게 낫다.',
      haeyo: '그래도 다친 사람이 있잖아요. 보스 앞에서 무너지는 것보다 지금 숨 돌리는 게 나아요.',
      hapsyo: '다만 부상자가 있습니다. 보스 앞에서 무너지는 것보다 지금 정비하는 편이 낫습니다.',
      hao: '허나 다친 이가 있소. 보스 앞에서 무너지느니 지금 숨을 돌리는 게 낫소.',
      cold: '다친 사람이 있다. 지금 쉰다.',
    },
  };
  WHY.elite = WHY.fight; WHY.boss = WHY.fight;
  const PROMISE = {
    persuade: {
      banmal: '내가 맨 앞에 설게.',
      haera: '맨 앞은 내가 선다.',
      haeyo: '제가 맨 앞에 설게요.',
      hapsyo: '선두는 제가 맡겠습니다.',
      hao: '앞은 내가 서겠소.',
      cold: '앞은 내가 본다. 따라와.',
    },
    force: {
      banmal: '이번엔 내 판단대로 갈 거야. 무슨 일 생기면 그건 내 책임이야.',
      haera: '이번엔 내 판단대로 간다. 책임은 내가 진다.',
      haeyo: '이번엔 제 판단대로 갈게요. 무슨 일 생기면 제가 책임질게요.',
      hapsyo: '이번에는 제 판단대로 가겠습니다. 책임은 제가 지겠습니다.',
      hao: '이번엔 내 판단대로 가겠소. 책임은 내가 지겠소.',
      cold: '간다. 책임은 내가 진다.',
    },
  };
  const q = (s) => `"${s}"`;

  // 사용자 결정(2026-11-15): 찬성·반대할 때마다 주인공이 말하고 리더가 답하는 주고받기는 뺀다. 리더가 "이렇게 한다"고 한 번만 말한다.
  const strip = (x) => x.replace(/^(그래도|다만|허나)\s*/, '');
  const baseRes = UI.councilLeadResolve;
  UI.councilLeadResolve = function (v, ...rest) {
    const t = this.councilLead; const L = this.examLeader && this.examLeader();
    let lead = null;
    if (t && t.nd) {
      const xs = (t.votes || []).filter((x) => x.vote === 'X').map((x) => G.npcById(x.id)).filter(Boolean);
      const anyX = v === 'X' || xs.length > 0;
      const stubborn = !!L && (L.personality === 'cold' || L.personality === 'warlike');
      const toAlt = v === 'X' && !!t.alt && !stubborn;
      if (anyX && !toAlt) { const r = reg(L); const nt = WHY[t.nd.t] ? t.nd.t : 'event'; lead = q(`${strip(WHY[nt][r])} ${PROMISE[stubborn ? 'force' : 'persuade'][r]}`); }
    }
    const talk = this.talk;
    this.talk = function (lines, done) {
      UI.talk = talk;
      const out = [];
      for (const ln of lines || []) {
        if (ln && ln.who === 'player') continue; // 주인공 말은 뺀다
        if (lead && ln && ln.who && ln.text && !ln.narr) { out.push({ ...ln, text: lead }); continue; }
        out.push(ln);
      }
      return talk.call(UI, out, done);
    };
    try { return baseRes.call(this, v, ...rest); } finally { if (this.talk !== talk) this.talk = talk; }
  };
}
