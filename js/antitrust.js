// ===== 관리국의 독점 견제 (영역 E) =====
// 관리국은 거대 길드의 독점을 막고 중소 길드와 무소속을 보호한다.
// 1) 입찰 연속 낙찰 제한  2) 게이트 등급별 할당  3) 위세 독과점 조사·바닥 회복
// 수치: docs/E_수치.md "관리국 독점 견제"
const ANTI = {
  streakPenalty: 0.7,  // 입찰 2연속 낙찰 뒤 다음 입찰 점수 배율
  streakBan: 3,        // 이만큼 연속 낙찰하면 다음 입찰 참가 금지
  loseCut: 0,          // 입찰에서 진 길드의 위세 감소(옛 규칙 1 → 0)
  // 등급별 할당: [거대 길드 배율, 중소 길드 배율]. 관리국은 항상 1
  quota: { low: [0.3, 1], mid: [0.8, 1.5], high: [1, 0.1] }, // D급 이하 / C~B급 / A급 이상
  probeAt: 3,          // 위세가 길드 평균의 이 배수를 넘으면 독과점 조사
  probeCut: 0.05,      // 조사 중 매달 초과분의 이 비율 + 1 만큼 위세 감소
  floor: 40,           // 위세가 이보다 낮은 길드는
  floorRegen: 0.5,     // 매달 이만큼 회복
};
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const tierOf = (id) => { const g = GUILDS[id]; return id === 'kama' || g.tier === 'gov' ? 'gov' : g.minor || g.tier === 'minor' ? 'minor' : 'giant'; };
  const band = (t) => (t <= 2 ? 'low' : t <= 4 ? 'mid' : 'high');
  Object.assign(GP, {
    antitrust: true,
    antiState() { const w = this.world; return (w.anti ??= { streak: null, n: 0, probe: {} }); },
    // 1) 입찰 점수 배율
    bidScoreMul(id) {
      const a = this.antiState(); if (id === 'kama' || a.streak !== id) return 1;
      return a.n >= ANTI.streakBan ? 0 : a.n >= 2 ? ANTI.streakPenalty : 1;
    },
    bidLoseCut() { return ANTI.loseCut; },
    bidWon(id) {
      const a = this.antiState(); const was = a.streak === id ? a.n : 0;
      a.streak = id; a.n = was + 1;
      if (id !== 'kama' && a.n === ANTI.streakBan) this.rumor(`관리국이 ${GUILDS[id].name}의 ${ANTI.streakBan}연속 낙찰에 제동을 걸었다. 다음 공략권 입찰에는 참가할 수 없다.`);
    },
    // 2) 등급별 할당: NPC 공략 배정 가중치
    quotaMul(id, tier) { const k = tierOf(id); if (k === 'gov') return 1; const q = ANTI.quota[band(tier)]; return k === 'giant' ? q[0] : q[1]; },
    ecoGuildWeight(id, tier, home) { return (this.guildPower ? this.guildPower(id) : 50) * (id === home ? 2 : 1) * this.quotaMul(id, tier); },
    // 3) 위세: 독과점 조사와 바닥 회복
    antiMonthly() {
      const w = this.world; const pr = w.guildPrestige; if (!pr) return;
      const a = this.antiState(); const ids = Object.keys(GUILDS).filter((id) => id !== 'kama');
      const avg = ids.reduce((s, id) => s + (pr[id] || 0), 0) / Math.max(1, ids.length);
      for (const id of ids) {
        const v = pr[id] || 0; const lim = Math.max(ANTI.floor * 2, avg * ANTI.probeAt);
        if (v > lim) {
          pr[id] = v - (1 + (v - lim) * ANTI.probeCut);
          if (!a.probe[id]) { a.probe[id] = this.monthKey(); this.rumor(`관리국이 ${GUILDS[id].name}의 공략권 독과점 조사에 들어갔다. 당분간 위세가 꺾일 전망이다.`); if (this.player.guild === id) this.log(`관리국이 소속 길드 ${GUILDS[id].name}을(를) 독과점 혐의로 조사한다.`, 'bad'); }
        } else if (a.probe[id]) delete a.probe[id];
        if (v < ANTI.floor) pr[id] = Math.min(ANTI.floor, v + ANTI.floorRegen);
      }
    },
  });
  wrap('worldMonthly', function (base) { base.call(this); try { this.antiMonthly(); } catch (e) { console.warn('antitrust', e); } });
  // 2) 관리권 입찰(gate_tender.js): D급 이하는 거대 길드 제외, C~B급은 중소 길드가 있으면 거대 길드 제외, A급 이상은 중소 길드 제외
  wrap('tenderBidders', function (base, g) {
    const ids = base.call(this, g) || []; const b = band(g.tier);
    const minors = ids.filter((id) => tierOf(id) === 'minor');
    if (b === 'low') return ids.filter((id) => tierOf(id) !== 'giant');
    if (b === 'mid') return minors.length ? ids.filter((id) => tierOf(id) !== 'giant') : ids;
    const big = ids.filter((id) => tierOf(id) !== 'minor'); return big.length ? big : ids;
  });
}
