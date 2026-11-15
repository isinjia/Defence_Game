// ===== 시험 탐색: 리더 제안에 반대했을 때의 말 (사용자 요청: "반대했을 때 말도 좀 더 완성도 있게") =====
// 전에는 반대하면 "저는 다른 쪽이 낫다고 봐요." → "걱정되는 거 알아. 내가 맨 앞에 설게. 같이 가자." 한 줄씩이었다.
// 이제 ① 내가 왜 반대하는지(가려는 칸 종류에 맞춰) 말하고 ② 리더가 반대한 사람을 짚어 받아 주고(인정) ③ 왜 그 길인지 이유를 대고
// ④ 설득이면 약속(맨 앞에 서고 이상하면 같이 빠진다), 밀어붙이면 책임을 말한다. 말투는 리더의 말투(반말·하라·해요·합쇼·하오)와 냉정한 성격을 따른다.
// council_dlg.js 가 상의 결과를 대화로 바꿔 보여 주는 것을 감싸서, 그 대화의 내 말·리더 말만 바꿔 끼운다.
if (typeof UI !== 'undefined' && UI.councilLeadResolve) {
  const reg = (L) => {
    if (L && L.personality === 'cold') return 'cold';
    const r = G.personaRegister ? G.personaRegister(L) : 'haera';
    return r === 'hage' ? 'hao' : ({ banmal: 1, haera: 1, haeyo: 1, hapsyo: 1, hao: 1 }[r] ? r : 'haera');
  };
  const MINE = {
    event: '"뭐가 있는지 모르는 곳이잖아요. 함정이면 어떡해요?"',
    fight: '"처음부터 싸우는 건 무리 아닐까요? 아직 손발도 안 맞춰 봤는데요."',
    elite: '"처음부터 센 놈이랑 붙는 건 무리 아닐까요?"',
    treasure: '"상자는 미끼일 수도 있어요. 괜히 손댔다가 일 날 것 같아요."',
    rest: '"벌써 쉬어요? 시간만 가는 것 같은데요."',
    boss: '"지금 보스한테 가는 건 너무 이르지 않아요?"',
  };
  const ACK = {
    banmal: (n) => `${n} 말도 일리 있어.`, haera: (n) => `${n}의 걱정도 일리 있다.`, haeyo: (n) => `${n} 씨 걱정도 이해해요.`,
    hapsyo: (n) => `${n} 님의 우려도 이해합니다.`, hao: (n) => `${n}의 걱정도 일리가 있소.`, cold: () => '…들었다.',
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
      banmal: '내가 맨 앞에 설게. 이상하면 바로 손 들어. 그럼 같이 빠지자.',
      haera: '맨 앞은 내가 선다. 이상하면 바로 말해라. 같이 물러난다.',
      haeyo: '제가 맨 앞에 설게요. 이상하면 바로 말해 줘요. 그럼 같이 빠지면 돼요.',
      hapsyo: '선두는 제가 맡겠습니다. 이상이 있으면 바로 말씀해 주십시오. 함께 물러나겠습니다.',
      hao: '앞은 내가 서겠소. 이상하면 바로 말하시오. 함께 물러나겠소.',
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

  const baseRes = UI.councilLeadResolve;
  UI.councilLeadResolve = function (v, ...rest) {
    const t = this.councilLead; const L = this.examLeader && this.examLeader();
    if (!t || !t.nd) return baseRes.call(this, v, ...rest);
    const xs = (t.votes || []).filter((x) => x.vote === 'X').map((x) => G.npcById(x.id)).filter(Boolean);
    const anyX = v === 'X' || xs.length > 0;
    const stubborn = !!L && (L.personality === 'cold' || L.personality === 'warlike');
    const toAlt = v === 'X' && !!t.alt && !stubborn;
    if (!anyX || toAlt) return baseRes.call(this, v, ...rest);
    const mode = stubborn ? 'force' : 'persuade';
    const nt = WHY[t.nd.t] ? t.nd.t : 'event';
    const r = reg(L);
    const who = v === 'X' ? G.player.name : xs[0].name;
    const leadLines = [q(`${ACK[r](who)} ${WHY[nt][r]}`), q(PROMISE[mode][r])];
    const talk = this.talk;
    this.talk = function (lines, done) {
      UI.talk = talk;
      const out = [];
      for (const ln of lines || []) {
        if (ln && ln.who === 'player' && v === 'X') { out.push({ ...ln, text: MINE[t.nd.t] || ln.text }); continue; }
        if (ln && ln.who && ln.who !== 'player' && ln.text && !ln.narr && leadLines) {
          // 내가 따랐는데 동료가 반대한 경우: 그 동료의 걱정을 먼저 한 줄 들려준다
          if (v !== 'X' && xs[0]) { const xv = (t.votes || []).find((x) => x.id === xs[0].id); if (xv && xv.line) out.push({ who: xs[0], text: xv.line }); }
          for (const s of leadLines) out.push({ ...ln, text: s });
          continue;
        }
        out.push(ln);
      }
      return talk.call(UI, out, done);
    };
    try { return baseRes.call(this, v, ...rest); } finally { if (this.talk !== talk) this.talk = talk; }
  };
}
