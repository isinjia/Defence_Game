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
  floor: { giant: 60, minor: 40 }, // 위세가 이보다 낮은 길드는
  floorRegen: 0.5,     // 매달 이만큼 회복 (거대 길드는 2배)
  kamaCap: 200,        // 관리국 위세 상한
  breakSmall: 2,       // 관리권 게이트 방치로 터졌을 때 위세 감소: B급 이하
  breakBig: 15,        //   A급 이상 (옛 규칙은 등급 무관 5)
  // 중소·무소속 보호
  rescueBonus: 0.1,    // 관리국 관리 게이트에서 무소속·중소 길드원 구출 확률(한 차례) +10%p
  minorPayFloor: 1.0,  // 중소 길드 월급 하한 = 기준 월급 × 이 값 (관리국 지원금)
  report: { chance: 0.6, meritBonus: 0.002, max: 0.9, reward: 180, prestige: 6, rel: 4 }, // 가로채기 신고: 인정 확률, 공적 1당 가산, 상한, 보상금(×등급 배율), 그 길드 위세 감소, 그 길드원 관계 감소
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
        const v = pr[id] || 0; const lim = Math.max(80, avg * ANTI.probeAt);
        if (v > lim) {
          pr[id] = v - (1 + (v - lim) * ANTI.probeCut);
          if (!a.probe[id]) { a.probe[id] = this.monthKey(); this.rumor(`관리국이 ${GUILDS[id].name}의 공략권 독과점 조사에 들어갔다. 당분간 위세가 꺾일 전망이다.`); if (this.player.guild === id) this.log(`관리국이 소속 길드 ${GUILDS[id].name}을(를) 독과점 혐의로 조사한다.`, 'bad'); }
        } else if (a.probe[id]) delete a.probe[id];
        const k = tierOf(id); const fl = ANTI.floor[k] || 40;
        if (v < fl) pr[id] = Math.min(fl, v + ANTI.floorRegen * (k === 'giant' ? 2 : 1));
      }
      if ((pr.kama || 0) > ANTI.kamaCap) pr.kama = ANTI.kamaCap;
    },
  });
  // 0) 관리권 게이트 방치: A급 이상만 크게 깎는다 (gate_tender.js의 -5를 고쳐 쓴다)
  wrap('ecoExpire', function (base, g) {
    const pr = this.world.guildPrestige; const o = this.gateOwner ? this.gateOwner(g) : 'kama';
    const before = pr && GUILDS[o] ? pr[o] : null;
    const r = base.call(this, g);
    if (before != null && pr[o] < before) pr[o] = Math.max(10, before - (g.tier >= 5 ? ANTI.breakBig : ANTI.breakSmall));
    return r;
  });
  // 4-a) 관리국 관리 게이트에서는 무소속·중소 길드원도 구조대가 챙긴다
  Object.assign(GP, {
    antiProtected() { const gid = this.player.guild; return !gid || !GUILDS[gid] || tierOf(gid) === 'minor'; },
    // 4-b) 가로채기 신고
    antiReportResolve(q, go) {
      const p = this.player; const R = ANTI.report; const g = GUILDS[q.guild];
      if (!go) return `${g.name}의 일을 문제 삼지 않기로 했다.`;
      const ch = Math.min(R.max, R.chance + (p.merit || 0) * R.meritBonus);
      for (const n of this.npcs) if (n.alive && n.guild === q.guild && n.met) this.changeRel(n, -R.rel, '관리국에 신고했다');
      if (!RNG.chance(ch)) return `관리국 조사관: "증거가 부족합니다. 이번 건은 기각입니다." ${g.name} 쪽에서는 신고 사실을 알아챘다.`;
      const money = Math.round(R.reward * RANKS[Math.max(p.rankIdx, q.tier)].mult);
      p.money += money; p.merit = (p.merit || 0) + 2;
      if (this.world.guildPrestige) this.world.guildPrestige[q.guild] = Math.max(10, (this.world.guildPrestige[q.guild] || 0) - R.prestige);
      this.rumor(`관리국이 ${g.name}에 시정 명령을 내렸다. 하급 게이트를 쓸어 간 일을 ${p.name}이(가) 신고했다고 한다.`);
      this.lifeEvent(`${g.name}의 하급 게이트 독식을 관리국에 신고해 인정받았다.`);
      return `관리국이 신고를 인정했다. ${g.name}에 시정 명령이 내려갔다. 보상금 ${fmt(money)} 크레딧, 공적 +2. (${g.name} 위세 -${R.prestige})`;
    },
  });
  wrap('rescueWave', function (base, gate) {
    let c = base.call(this, gate);
    const owner = this.gateOwner ? this.gateOwner(gate) : 'kama';
    if ((owner === 'kama' || !GUILDS[owner]) && this.antiProtected() && gate.variant !== 'red') c = Math.min(0.97, c + ANTI.rescueBonus);
    return c;
  });
  // 4-c) 중소 길드 월급 하한: 관리국 지원금으로 기준 월급은 보장
  wrap('makeContract', function (base, gid, ...rest) {
    const c = base.call(this, gid, ...rest);
    if (c && GUILDS[gid] && tierOf(gid) === 'minor' && this.payBase && c.salary > 0) {
      const fl = Math.round(this.payBase(gid) * ANTI.minorPayFloor);
      if (c.salary < fl) { c.salary = fl; c.subsidy = true; }
    }
    return c;
  });
  // 4-b) 거대 길드가 내 지역의 D급 이하 게이트(무소속·중소 몫)를 닫으면 신고할 수 있다. 한 달에 한 번
  wrap('ecoNote', function (base, g, actor, team, ok) {
    const r = base.call(this, g, actor, team, ok);
    try {
      const p = this.player; const a = this.antiState(); const mk = this.monthKey();
      if (ok && actor && actor.kind === 'guild' && GUILDS[actor.guild] && tierOf(actor.guild) === 'giant' && band(g.tier) === 'low'
        && g.region === p.region && this.antiProtected() && a.reportMk !== mk && !this.queue.some((q) => q.type === 'antiReport')) {
        a.reportMk = mk;
        this.queue.push({ type: 'antiReport', guild: actor.guild, tier: g.tier, region: g.region });
      }
    } catch (e) { console.warn('antiReport', e); }
    return r;
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
  if (typeof UI !== 'undefined') {
    const baseQueue = UI.processQueue;
    UI.processQueue = function () {
      const q = G.queue[0];
      if (q && q.type === 'antiReport') {
        G.queue.shift(); this.antiQ = q; const g = GUILDS[q.guild]; const R = ANTI.report;
        const ch = Math.round(Math.min(R.max, R.chance + (G.player.merit || 0) * R.meritBonus) * 100);
        return this.modal(`<div class="eyebrow">${G.dateStr()} · ${regionById(q.region).name}</div><h3>거대 길드의 하급 게이트 독식</h3>
          <p class="event-text"><b style="color:${g.color}">${g.name}</b> 공격대가 이 지역의 ${RANKS[q.tier].key}급 게이트를 닫고 갔다. D급 이하 게이트는 관리국 방침상 무소속과 중소 길드 몫이다.</p>
          <p class="small dim">관리국에 신고하면 인정 확률 ${ch}%. 인정되면 보상금과 공적을 받고 ${g.name} 위세가 깎인다. 어느 쪽이든 ${g.name} 사람들과는 사이가 나빠진다.</p>
          <div class="row end"><button class="ghost" data-act="anti-report" data-v="0">넘어간다</button><button class="primary" data-act="anti-report" data-v="1">관리국에 신고한다</button></div>`, 'event-box');
      }
      return baseQueue.call(this);
    };
    const baseHandle = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'anti-report') { const q = this.antiQ; this.antiQ = null; this.closeModal(); if (!q) return this.processQueue(); const t = G.antiReportResolve(q, v === '1'); G.save(); return this.after(t); }
      return baseHandle.call(this, act, v);
    };
  }
}
