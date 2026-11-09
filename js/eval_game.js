// ---------- 평가 보정: 게임 규칙 쪽 ----------
// 1) 에테르가 돌파 직전까지 가득 찼는데 수련하면 '+43'만 보이고 한 달이 그냥 지나가던 문제 → 막고 돌파를 안내한다.
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  GP.etherCapped = function () {
    const p = this.player; if (!p) return false;
    return p.stage === 2 && p.rankIdx < RANKS.length - 1 && p.ether >= stageReq(p.rankIdx, 2);
  };
  GP.etherCapMsg = function () {
    const p = this.player; const next = RANKS[p.rankIdx + 1].key;
    return this.hasCatalyst && this.hasCatalyst()
      ? `에테르가 가득 찼다. 더 수련해도 늘지 않는다. 각성 촉매가 있으니 정보 창에서 ${next}급 돌파를 시도하자.`
      : `에테르가 가득 찼다. 더 수련해도 늘지 않는다. 공방이나 헌터 마켓에서 각성 촉매를 구해 ${next}급 돌파를 하자.`;
  };
  const baseTrainAt = GP.trainAt;
  if (baseTrainAt) GP.trainAt = function (place) { if (this.etherCapped()) return this.etherCapMsg(); return baseTrainAt.call(this, place); };
}
if (typeof UI !== 'undefined') {
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if ((act === 'train' || act === 'train-pick') && G.player && G.etherCapped()) { this.toast(G.etherCapMsg()); return; }
    return baseHandle.call(this, act, v);
  };
}
