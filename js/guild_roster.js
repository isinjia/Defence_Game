// ===== 길드 인원 채우기: 공격대를 꾸릴 만큼 길드원 NPC를 둔다 (영역 E, guild_parties.js와 짝) =====
// 길드 세력이 "공격대 전력의 합"이 되려면 길드마다 공격대를 이룰 인원이 있어야 한다.
// 수치: docs/E_수치.md "길드 인원"
const ROSTER = {
  min: { giant: 8, gov: 8, minor: 4 }, // 길드 규모별 최소 길드원 (거대·관리국 2개 공격대, 중소 1개 공격대)
  minorRankCap: 3,                     // 중소 길드 신규 인원 등급 상한(B급)
  monthly: 1,                          // 인원이 모자란 길드가 한 달에 뽑는 신입 수
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
  });
  // 새 게임·옛 저장: 한 번 채운다
  wrap('initSandbox', function (base) {
    base.call(this);
    if (this.world && !this.world.rosterV) { this.world.rosterV = 1; try { this.guildFill(99, false); } catch (e) { console.warn('guildFill', e); } }
  });
  // 매달: 인원이 모자란 길드는 신입을 뽑는다
  wrap('worldMonthly', function (base) { base.call(this); try { this.guildFill(ROSTER.monthly, true); } catch (e) { console.warn('guildFill', e); } });
}
