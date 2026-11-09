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

// 2) 전투 긴장 (독립 평가: '공격'만 눌러도 체력 10~20%만 잃고 이김 → 전투 재미 과락).
// 자기 등급 게이트를 파티로 돌면 끝 체력 약 80%였다. 일반 괴수·보스의 위협을 올려 50~65% 선으로.
// 헌터 시험(튜토리얼) 괴수는 그대로 둔다.
const THREAT = { atk: 1.1, hp: 1.08, bossAtk: 1.15, bossHp: 1.25 };
if (typeof Game !== 'undefined') {
  const baseMake = Game.prototype.makeMonster;
  Game.prototype.makeMonster = function (tier, boss, prefElem) {
    const m = baseMake.call(this, tier, boss, prefElem);
    if (this._tutorialMobs || !m) return m;
    const a = boss ? THREAT.bossAtk : THREAT.atk; const h = boss ? THREAT.bossHp : THREAT.hp;
    m.atk = Math.round(m.atk * a); m.hp = m.maxHp = Math.round(m.maxHp * h);
    return m;
  };
}
if (typeof UI !== 'undefined' && UI.examEnemies) {
  const baseExamEn = UI.examEnemies;
  UI.examEnemies = function (...a) { G._tutorialMobs = true; try { return baseExamEn.apply(this, a); } finally { G._tutorialMobs = false; } };
}

// 파티는 머릿수만큼 적 체력만 늘고 공격은 거의 그대로라 여전히 쉬웠다 → 3인 이상이면 적 공격을 조금 더.
if (typeof Game !== 'undefined') {
  const baseScale = Game.prototype.scaleForParty;
  Game.prototype.scaleForParty = function (list, tier) {
    const r = baseScale.call(this, list, tier); const n = this.partySize();
    if (n >= 3 && !this._tutorialMobs) for (const e of r) e.atk = Math.round(e.atk * (1 + 0.13 * (n - 2)));
    return r;
  };
}
