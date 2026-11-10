// ===== 게이트 크로니클: 게이트 관리권 입찰 (영역 C, 4-17) =====
// 모든 게이트는 관리국(owner 'kama')이 등록한다. C급 이상은 대부분, F~D급은 가끔 다음 달 입찰에 붙어 길드로 넘어간다.
// 필드: g.owner = 'kama' | 길드 id, g.ownerSince = 낙찰 월, g.tender = 입찰 예정 월(대기 중일 때만).
// 입장 규칙·입장료·지도 표시는 F(js/gate_owner.js). 여기서는 소유 결정과 NPC 팀 배정·책임론만 다룬다.

const TENDER = {
  chance: [0.05, 0.08, 0.15, 0.7, 0.8, 0.9, 0.95, 1],   // 등급별 입찰에 붙을 확률
  homeBonus: 1.8,                                        // 지역 연고 길드
  rigBonus: 2.5,                                         // 공략권 매수 음모를 꾸민 길드
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.gateOwner = function (g) { return (g && g.owner) || 'kama'; };
  GP.gateOwnerName = function (g) { const o = this.gateOwner(g); return o === 'kama' ? '관리국' : (GUILDS[o] ? GUILDS[o].name : '관리국'); };

  // 새 게이트 등록: 관리국 소유, 등급에 따라 입찰 공고
  GP.tenderRegister = function (g) {
    if (g.owner) return;
    const mk = this.monthKey();
    if (g.bid && this.player && this.player.guild) { g.owner = this.player.guild; g.ownerSince = g.born ?? mk; return; }
    g.owner = 'kama'; g.ownerSince = g.born ?? mk;
    if (g.final || g.mission || g.crew || g.breakCity || g.exam || g.tutorial || g.region === 'jeju') return;
    if (RNG.chance(TENDER.chance[Math.min(7, g.tier)])) g.tender = mk + 1;
  };

  // 입찰 참가 길드: 거대·정부 길드는 전국, 중소 길드는 본거지 1칸 안
  GP.tenderBidders = function (g) {
    return Object.keys(GUILDS).filter((id) => {
      if (id === 'kama') return false;
      const G0 = GUILDS[id];
      if (!G0.minor) return true;
      const h = G0.home; if (!h) return false;
      return (h === g.region || regionDist(h, g.region) <= 1) && g.tier <= (G0.minRank != null ? G0.minRank + 3 : 4);
    });
  };

  GP.tenderResolve = function (g) {
    delete g.tender;
    const ids = this.tenderBidders(g); if (!ids.length) return;
    const reg = regionById(g.region);
    const rigBy = (this.world.plots || []).filter((pl) => pl.kind === 'bidRig' && pl.status === 'active').map((pl) => pl.owner);
    const b = this.world.bid; if (b && b.rigged && b.riggedBy) rigBy.push(b.riggedBy);
    const scores = ids.map((id) => {
      let s = Math.sqrt(Math.max(1, this.guildPower ? this.guildPower(id) : 50)) * RNG.range(0.5, 1.5); // 세력 차이를 누그러뜨려 독식을 막는다
      if (reg.guild === id || (GUILDS[id].home === g.region)) s *= TENDER.homeBonus;
      if (rigBy.includes(id)) s *= TENDER.rigBonus;
      return { id, s };
    }).sort((a, x) => x.s - a.s);
    // 아무도 탐내지 않으면(점수 낮음) 관리국 직할로 남는다
    if (scores[0].s < 2 + g.tier * 0.5) return;
    const win = scores[0].id;
    g.owner = win; g.ownerSince = this.monthKey();
    if (this.world.guildPrestige) this.world.guildPrestige[win] = (this.world.guildPrestige[win] || 0) + 1;
    (this.world.tenderLog ||= []).unshift({ mk: this.monthKey(), gate: g.id, region: g.region, tier: g.tier, guild: win, rig: rigBy.includes(win) });
    if (this.world.tenderLog.length > 30) this.world.tenderLog.length = 30;
    if (g.tier >= 4 || this.player.guild === win) {
      this.rumor(`${GUILDS[win].name}이(가) ${reg.name} ${RANKS[g.tier].key}급 게이트 관리권을 따냈다.${scores[1] ? ` (${GUILDS[scores[1].id].name} 탈락)` : ''}`, { kind: 'tender', thread: 'gate:' + g.id, score: -1 });
    }
    if (this.player.guild === win) this.log(`소속 길드가 ${reg.name} ${RANKS[g.tier].key}급 게이트 관리권을 낙찰받았다.`, 'good');
  };

  GP.tenderMonthly = function () {
    const mk = this.monthKey();
    for (const g of this.mapGates || []) {
      this.tenderRegister(g);
      if (g.tender != null && mk >= g.tender && !g.raid && !g.cleared) this.tenderResolve(g);
    }
  };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.tenderLog ??= [];
    for (const g of this.mapGates || []) if (!g.owner) { g.owner = g.bid && this.player.guild ? this.player.guild : 'kama'; g.ownerSince ??= g.born; }
  });

  // 매달: 입찰 결과 → 기존 생태계(게이트 생성·NPC 공략) 순서
  wrap('spawnMonthly', function (base) {
    if (this.player) this.tenderMonthly();
    base.call(this);
    if (this.player) for (const g of this.mapGates || []) this.tenderRegister(g);
  });

  // NPC 팀 배정이 owner를 따른다: 길드 게이트는 그 길드 팀만, 관리국 게이트는 협회 배정팀·프리랜서
  wrap('ecoForm', function (base, g) {
    const o = this.gateOwner(g);
    if (o !== 'kama' && GUILDS[o]) {
      const t = g.tier; const fit = (n) => n.rankIdx >= t - 1 && n.rankIdx <= t + 2;
      const team = this.adults().filter((n) => n.guild === o && !n.isCompanion && !n.hired && !n.retired && !(n.hurt > 0) && fit(n) && (n.region === g.region || regionDist(n.region, g.region) <= 1))
        .sort((a, b) => b.rankIdx - a.rankIdx).slice(0, 4);
      if (!team.length) { g.ownerIdle = (g.ownerIdle || 0) + 1; return null; }
      return { actor: { kind: 'guild', guild: o, name: GUILDS[o].name }, team };
    }
    for (let i = 0; i < 4; i++) {
      const f = base.call(this, g);
      if (!f || f.actor.kind !== 'guild') return f;
    }
    return null;
  });

  // 낙찰 후 방치 → 브레이크 책임론
  wrap('ecoExpire', function (base, g) {
    const o = this.gateOwner(g);
    const guildOwned = o !== 'kama' && GUILDS[o] && !g.bid;
    if (guildOwned && !g.lastFail) g.lastFail = GUILDS[o].name;
    const before = (this.world.breaks || []).length;
    base.call(this, g);
    if (!guildOwned || (this.world.breaks || []).length <= before) return;
    const reg = regionById(g.region);
    if (this.world.guildPrestige) this.world.guildPrestige[o] = Math.max(10, (this.world.guildPrestige[o] || 0) - 5);
    this.rumor(`${GUILDS[o].name}이(가) ${reg.name} ${RANKS[g.tier].key}급 게이트 관리권을 따 놓고 방치했다는 책임론이 거세다. 관리국은 관리권 회수를 검토 중이다.`, { kind: 'break', thread: 'gate:' + g.id, score: 1 });
    if (this.player.guild === o) this.log(`소속 길드가 관리권을 가진 ${reg.name} 게이트가 터졌다. 길드 안팎에서 책임론이 돈다.`, 'bad');
  });
}
