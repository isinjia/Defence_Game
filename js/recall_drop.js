// ===== 귀환석 획득 경로 (영역 E 몫): 히든 피스 · 대균열 핵 · 기연(연계) 완결 =====
// 귀환석은 매우 귀하다(구현 대기목록 4-7). 상점에 없고, 극소 확률로만 나온다.
// 지급은 js/gate_watch.js 의 giveRecall 을 쓴다.
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const give = (g, chance, why) => { if (g.giveRecall && RNG.chance(chance)) { g.giveRecall(why); return true; } return false; };
  // 히든 피스: 8%
  wrap('hiddenGrant', function (base, h) {
    const r = base.call(this, h);
    return give(this, 0.08, '히든 피스 안쪽 깊은 곳') ? `${r} 그 안쪽에서 귀환석 하나가 빛나고 있었다.` : r;
  });
  // 대균열 핵을 깨고 나올 때: 6%
  wrap('riftLeave', function (base, why) {
    const r = base.call(this, why);
    if (why === '균열핵 파괴' && give(this, 0.06, '대균열의 핵 잔해')) return `${r} 핵 잔해 속에서 귀환석을 주웠다.`;
    return r;
  });
  // 기연(연계 이야기)이 끝까지 이어졌을 때: 3%
  wrap('chainEnd', function (base, id) {
    const st = (this.flags && this.flags.chains && this.flags.chains[id]) || 0; const done = st === 99 || st < 2; // 이미 끝났거나 거의 진행 안 한 갈래는 제외
    const r = base.call(this, id);
    if (!done && this.player) give(this, 0.03, '기연의 끝에서 받은 선물');
    return r;
  });
}
