// ===== 길드 인원 채우기: 공격대를 꾸릴 만큼 길드원 NPC를 둔다 (영역 E, guild_parties.js와 짝) =====
// 길드 세력이 "공격대 전력의 합"이 되려면 길드마다 공격대를 이룰 인원이 있어야 한다.
// 수치: docs/E_수치.md "길드 인원"
const ROSTER = {
  min: { giant: 24, gov: 24, minor: 4 }, // 길드 규모별 최소 인원 (거대 6개 공격대, 관리국 6개 대, 중소 1개 공격대)
  minorRankCap: 3,                     // 중소 길드 신규 인원 등급 상한(B급)
  monthly: 1,                          // 인원이 모자란 길드가 한 달에 뽑는 신입 수
  giantRankFloor: 2,                   // 거대 길드는 소수 정예: 처음 채우는 인원은 C급 이상
  freeShare: 0.4,                      // 무소속 헌터가 성인 각성자의 이 비율은 되게 채운다
  maxAdults: 360,                      // 성인 각성자 상한: 이 수를 넘으면 무소속을 더 늘리지 않는다
  freeMonthly: 2,                      // 무소속이 모자랄 때 한 달에 늘어나는 수
};
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const tierOf = (id) => { const g = GUILDS[id]; return id === 'kama' || g.tier === 'gov' ? 'gov' : g.minor || g.tier === 'minor' ? 'minor' : 'giant'; };
  Object.assign(GP, {
    guildNeed(id) { return ROSTER.min[tierOf(id)] || 4; },
    guildHeadcount(id) { let c = 0; for (const n of this.npcs) if (n.alive && !n.child && n.guild === id) c++; return c; },
    guildRecruit(id, young) {
      const n = this.makeNpc(!!young, RNG.chance(0.85) ? 'human' : undefined);
      if (tierOf(id) === 'minor' && n.rankIdx > ROSTER.minorRankCap) n.rankIdx = ROSTER.minorRankCap;
      if (tierOf(id) === 'giant' && !young && n.rankIdx < ROSTER.giantRankFloor) n.rankIdx = ROSTER.giantRankFloor;
      const home = typeof guildHome === 'function' ? guildHome(id) : null;
      if (home && (home.id !== 'jeju' || n.rankIdx >= 6)) n.region = home.id;
      n.guild = id; this.npcs.push(n);
      return n;
    },
    // limit: 길드마다 이번에 뽑을 수 있는 최대 인원
    guildFill(limit = 99, young = false) {
      let added = 0;
      for (const id of Object.keys(GUILDS)) {
        const lack = this.guildNeed(id) - this.guildHeadcount(id);
        for (let i = 0; i < Math.min(limit, lack); i++) { this.guildRecruit(id, young); added++; }
      }
      if (added) this._gpCache = null;
      return added;
    },
    // 무소속 헌터: 길드 밖에서 뛰는 사람이 가장 많아야 한다
    freeFill(limit = 999, young = false) {
      const a = this.npcs.filter((n) => n.alive && !n.child); const free = a.filter((n) => !n.guild).length;
      const need = Math.ceil((ROSTER.freeShare * a.length - free) / (1 - ROSTER.freeShare));
      let added = 0;
      for (let i = 0; i < Math.min(limit, need, ROSTER.maxAdults - a.length); i++) { const n = this.makeNpc(!!young); n.guild = null; this.npcs.push(n); added++; }
      return added;
    },
  });
  // 새 게임·옛 저장: 한 번 채운다
  wrap('initSandbox', function (base) {
    base.call(this);
    if (this.world && (this.world.rosterV || 0) < 2) {
      try { if (!this.world.rosterV) this.guildFill(99, false); this.freeFill(999, false); } catch (e) { console.warn('guildFill', e); }
      this.world.rosterV = 2;
    }
  });
  // 매달: 인원이 모자란 길드는 신입을 뽑는다
  wrap('worldMonthly', function (base) { base.call(this); try { this.guildFill(ROSTER.monthly, true); this.freeFill(ROSTER.freeMonthly, true); } catch (e) { console.warn('guildFill', e); } });
}
