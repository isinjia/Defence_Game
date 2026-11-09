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
