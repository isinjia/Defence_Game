// ===== 게이트 크로니클: 인연 장면 속도와 맥락 (사용자 지적) =====
// 튜토리얼 동료와 파티를 맺자마자 "오늘 게이트에서 구하지 못한 사람이…" 같은 깊은 장면이 나와 이야기가 어긋났다.
//  - 단계 장면은 시간이 쌓여야 나온다: 앞 장면 뒤 2개월, 처음 인연 장면부터 단계별 [0, 1, 4, 8]개월.
//    때가 안 됐으면 관계는 문턱에 머물고 장면은 기다린다(bondPending 'wait' → 매달 다시 본다).
//  - 같은 파티원이면 혼자 따로 게이트에 다녀온 듯한 문장 대신 함께 겪은 일로 말한다.

const BOND_GAP = [0, 1, 4, 8];

Object.assign(Game.prototype, {
  bondReady(n) {
    const mk = this.monthKey();
    n.bondFirstMk ??= mk;
    const st = n.bondStage || 0;
    if (n.bondLastMk != null && mk - n.bondLastMk < 2) return false;
    return mk - n.bondFirstMk >= (BOND_GAP[st] ?? 8);
  },
  inMyParty(n) { return !!n && (n.isCompanion || (this.party && this.party().includes(n))); },
});

{
  const P = Game.prototype;
  const isBond = (q) => q && q.type === 'story' && /^bond_/.test(q.id);
  // 문턱에 닿아 장면이 줄에 들어갔는데 때가 아니면 꺼내서 기다리게 한다
  const baseRel = P.changeRel;
  P.changeRel = function (n, d, why) {
    const had = this.queue.filter(isBond).length;
    const r = baseRel.call(this, n, d, why);
    if (n && this.queue.filter(isBond).length > had && !this.bondReady(n)) {
      const i = this.queue.findIndex((q) => isBond(q) && q.npc === n.id);
      if (i >= 0) { this.queue.splice(i, 1); n.bondPending = 'wait'; }
    }
    return r;
  };
  // 매달 다시 볼 때도 때가 된 사람만
  const baseMonthly = P.bondMonthly;
  P.bondMonthly = function () {
    const held = this.npcs.filter((n) => n.bondPending === 'wait' && n.alive && !this.bondReady(n));
    for (const n of held) n.bondPending = 'hold';
    try { return baseMonthly.call(this); } finally { for (const n of held) if (n.bondPending === 'hold') n.bondPending = 'wait'; }
  };
  const baseAdv = P.bondAdvance;
  P.bondAdvance = function (n, path) { n.bondLastMk = this.monthKey(); return baseAdv.call(this, n, path); };
}

// 파티원일 때의 문장
{
  const swap = (id, party) => {
    const ev = STORY.find((e) => e.id === id); if (!ev) return;
    const solo = ev.text;
    ev.text = (g, c) => (c && c.npc && g.inMyParty(c.npc) ? party : solo);
  };
  swap('bond_kind_2', '밤늦게 {npc}에게서 전화가 온다. 목소리가 떨린다. "지난번 우리 같이 들어갔던 게이트 말이야… 우리가 조금만 빨랐으면 그 사람 구할 수 있었을까? 나 이 일 계속해도 되는 걸까?"');
  swap('bond_warlike_2', '{npc}의 팔에 새 붕대가 감겨 있다. 지난 게이트에서 혼자 앞으로 뛰쳐나갔다가 생긴 상처다. "다들 위로하는데, 그딴 거 필요 없어." 잠시 침묵. "…너라면 그때 어떻게 했을 것 같아?"');
  swap('bond_greedy_2', '{npc}이(가) 큰 계약을 앞두고 망설인다. "우리 파티 앞으로 들어온 제안인데, 상대가 수상해. 근데 돈이 너무 커. 너라면 어떡할래? 네 말대로 할게."');
}

// 장면마다 그 장면에 맞는 대답 (사용자 지적: 어느 장면이든 "무슨 일이 있어도 네 편이야 / 말 대신 그 손을…"이 똑같이 나왔다)
// 단계 0·1: [다가가기, 어색하게] / 단계 2·3: [우정, 사랑, 서로 배움, 경쟁] 순서 (bond_more.js의 결과 처리 그대로)
const BOND_LINES = {
  kind_0: ['고맙다며 김밥을 받아 든다', '괜찮다고 했다가 결국 받아 먹는다'],
  kind_1: ['아이들 틈에 섞여 같이 뛰어논다', '멀찍이 지켜보다, 아이가 손을 잡자 따라간다'],
  kind_2: ['"네 잘못 아니야. 무슨 일이 있어도 난 네 편이야."', '말없이 {npc}의 집 앞까지 찾아가 문을 두드린다', '"그날 일, 같이 하나씩 되짚어 보자. 다음엔 구할 수 있게."', '"그럼 다음엔 내가 너보다 먼저 닿을게. 너도 지지 마."'],
  kind_3: ['"내 목록에도 네 이름을 맨 위에 적어 둘게."', '수첩을 덮고 그 손을 꼭 잡는다', '"이 목록, 같이 지켜 나가자. 모르는 건 서로 알려 주면서."', '"지키는 건 내가 더 잘할걸? 내기할래?"'],
  warlike_0: ['"…고마워. 다음엔 내가 네 거 손봐 줄게."', '투덜거림은 못 들은 척 무기를 받아 든다'],
  warlike_1: ['바닥에 뻗은 채로 웃음을 터뜨린다', '숨을 고르며 엄지만 들어 보인다'],
  warlike_2: ['"위로 아니야. 다음 판엔 내가 옆에 서 있을게."', '흉터 위에 조용히 손을 얹는다', '"그놈 싸움 방식부터 같이 뜯어보자."', '"나라면 이겼지. 그러니까 너도 나부터 이겨 봐."'],
  warlike_3: ['"웃기긴. 내 등도 평생 너한테 맡긴다."', '대답 대신 그 등에 이마를 기댄다', '"그럼 등 맡기는 법부터 제대로 맞춰 보자."', '"등은 맡겨도 승부는 따로야. 알지?"'],
  greedy_0: ['"갚을게. 이자는 밥으로."', '모르는 척 고개만 끄덕인다'],
  greedy_1: ['"말해 줘서 고마워. 혼자 짊어지지 마."', '장부를 덮어 주고 아무 말도 하지 않는다'],
  greedy_2: ['"돈보다 네가 중요해. 어떻게 하든 네 편이야."', '"그 돈 없어도 돼. 나랑 있으면." 하고 손을 잡는다', '"계약서 같이 뜯어보자. 수상한 데를 찾아서."', '"그 정도 돈이면 내가 먼저 벌어 올게. 지켜봐."'],
  greedy_3: ['"좋아. 이제부터 계산 없는 사이다."', '봉투를 돌려주고 그 손을 잡는다', '"계산은 끝이어도, 서로 배울 건 아직 많지."', '"계산 끝? 그럼 이제 누가 더 버나 겨뤄 보자."'],
  just_0: ['"당연하지." 업자 하나의 팔을 붙잡는다', '말없이 업자 하나를 끌고 나란히 걷는다'],
  just_1: ['팻말 옆에 조용히 함께 선다', '멀리서 지켜보다 따뜻한 커피를 건넨다'],
  just_2: ['"내. 네가 끝나면 나도 같이 끝날게."', '떨리는 그 손을 잡아 고발장 위에 함께 얹는다', '"증거부터 같이 다지자. 혼자 무너지지 않게."', '"그럼 나는 내 방식으로 그 길드를 무너뜨려 볼게. 누가 먼저인지 보자."'],
  just_3: ['손잡이를 잡는다. "약속할게. 친구로서."', '칼 대신 그 손을 잡는다', '"서로를 바로잡아 주는 사이. 좋아."', '"막아 봐. 대신 나도 봐주진 않아."'],
  cold_0: ['캔커피를 들어 보이며 고맙다고 웃는다', '말없이 캔커피를 마신다'],
  cold_1: ['"아무한테도 말 안 해. 대신 다음에 또 보여 줘."', '고개만 끄덕인다'],
  cold_2: ['"난 안 죽어. 그러니까 마음껏 기대."', '깨지 않게 어깨를 내준 채 밤을 지샌다', '"같이 강해지자. 누가 기대도 버틸 수 있게."', '"그럼 내가 너보다 오래 살아남을게. 두고 봐."'],
  cold_3: ['"내 1번도 너야." 휴대폰을 보여 준다', '빨개진 귀를 보고 조용히 그 손을 잡는다', '"위급할 땐 서로 부르자. 그렇게 정하자."', '"1번 자리 지키려면 나보다 약해지면 안 돼."'],
};
for (const [key, lines] of Object.entries(BOND_LINES)) {
  const ev = STORY.find((e) => e.id === 'bond_' + key); if (!ev || !ev.choices) continue;
  ev.choices.forEach((ch, i) => { if (lines[i]) ch.text = lines[i]; });
}
