// ===== 게이트 크로니클: 게이트 생태계 (영역 C) =====
// docs/헌터물_제안2.md 1. NPC가 지도 위 게이트를 닫고, 놓친 게이트는 기한이 지나면 확률로 터진다.
// 주체: 협회 배정팀(F~C), 길드(C 이상), 프리랜서(지역 개인).
// 한 달에 팀이 들어가고(gate.raid) 다음 달에 결과가 난다. 그 사이 플레이어가 먼저 닫으면 팀은 허탕.
// 브레이크는 "누군가 놓친 결과"다: 속보, 책임론, 막은 사람의 명성, 막지 못하면 도시 피해.

const ECO = {
  deadline: (tier) => (tier >= 5 ? 2 : 3),                                // 닫힘 기한(개월)
  breakChance: [0.004, 0.008, 0.016, 0.032, 0.065, 0.12, 0.2, 0.3],            // 기한까지 못 닫으면 터질 확률
  attempt: [0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2],                  // 달마다 누군가 들어갈 확률
  deathOnFail: 0.1,
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const w = this.world;
    w.ecoLog ??= [];        // 최근 공략 결과 (지도·뉴스용) {mk, region, tier, actor, ok, names}
    w.ecoStat ??= { npc: 0, fail: 0, breaks: 0 };
    w.damaged ??= {};       // 도시 피해 상태 {region: until}
    for (const g of this.mapGates || []) g.deadline ??= g.born + ECO.deadline(g.tier);
  });

  GP.ecoEligible = function (g) { return !g.final && !g.mission && !g.crew && !g.breakCity && !g.cleared; };
  GP.ecoRealTier = function (g) { return g.realTier ?? g.tier; };

  // 지역 NPC 후보 (플레이어 파티·용병·아이 제외)
  GP.ecoPool = function (regionId) {
    const busy = new Set();
    for (const g of this.mapGates) if (g.raid) g.raid.ids.forEach((id) => busy.add(id));
    return this.adults().filter((n) => n.region === regionId && !n.isCompanion && !n.hired && !(n.merc && n.merc.job) && !busy.has(n.id) && n.nemesis !== 'player');
  };

  GP.ecoPower = function (team) { return team.reduce((s, n) => s + RANKS[n.rankIdx].mult * (1 + n.stage * 0.1), 0); };

  // 팀 꾸리기
  GP.ecoForm = function (g) {
    const t = g.tier; const pool = this.ecoPool(g.region);
    const fit = (n) => n.rankIdx >= t - 1 && n.rankIdx <= t + 2;
    const reg = regionById(g.region);
    let actor, team;
    const roll = RNG.next();
    if (t <= 3 && roll < 0.55) {
      actor = { kind: 'assoc', name: '협회 배정팀' };
      team = pool.filter((n) => !n.guild || n.guild === 'kama').filter(fit).sort(() => RNG.next() - 0.5).slice(0, 3);
    } else if (t >= 2 && roll < 0.85) {
      const gs = Object.keys(GUILDS);
      const home = reg.guild;
      const weights = gs.map((id) => (this.guildPower ? this.guildPower(id) : 50) * (id === home ? 2 : 1));
      const gid = RNG.weighted(gs, weights);
      actor = { kind: 'guild', guild: gid, name: GUILDS[gid].name };
      team = this.adults().filter((n) => n.guild === gid && !n.isCompanion && !n.hired && !n.retired && !(n.hurt > 0) && fit(n) && (n.region === g.region || regionDist(n.region, g.region) <= 1))
        .filter((n) => pool.includes(n) || n.region !== g.region).sort((a, b) => b.rankIdx - a.rankIdx).slice(0, 4);
    } else {
      actor = { kind: 'free', name: '프리랜서' };
      team = pool.filter(fit).sort(() => RNG.next() - 0.5).slice(0, RNG.int(1, 3));
    }
    if (!team.length && actor.kind !== 'assoc') return null;
    return { actor, team };
  };

  GP.ecoChance = function (g, actor, team) {
    const real = this.ecoRealTier(g);
    let need = RANKS[real].mult * 2.2 * (g.variant === 'red' ? 1.6 : 1);
    let pow = this.ecoPower(team);
    if (actor.kind === 'assoc') pow += RANKS[Math.min(7, g.tier + 1)].mult * 2.2; // 장비·지원 인력
    if (actor.kind === 'guild') pow += RANKS[g.tier].mult * 0.5 * Math.min(2, (this.guildPower ? this.guildPower(actor.guild) : 50) / 60);
    return Math.max(0.03, Math.min(0.96, pow * pow / (pow * pow + need * need)));
  };

  GP.ecoNote = function (g, actor, team, ok) {
    const w = this.world;
    w.ecoLog.unshift({ mk: this.monthKey(), region: g.region, tier: this.ecoRealTier(g), actor: actor.name, kind: actor.kind, guild: actor.guild || null, ok, names: team.map((n) => n.name), x: g.x, y: g.y });
    if (w.ecoLog.length > 40) w.ecoLog.length = 40;
  };

  // 진행 중인 공략 결과
  GP.ecoResolve = function (g) {
    const r = g.raid; g.raid = null;
    const team = r.ids.map((id) => this.npcById(id)).filter((n) => n && n.alive);
    const actor = r.actor; const reg = regionById(g.region);
    const label = `${reg.name} ${RANKS[g.tier].key}급 게이트`;
    const known = team.filter((n) => n.met);
    const ok = RNG.chance(this.ecoChance(g, actor, team));
    this.ecoNote(g, actor, team, ok);
    if (ok) {
      this.world.ecoStat.npc++;
      this.mapGates = this.mapGates.filter((x) => x.id !== g.id);
      for (const n of team) { n.progress = Math.min(1, (n.progress || 0) + 0.15); n.renown = (n.renown || 0) + g.tier + 1; }
      if (actor.kind === 'guild' && this.world.guildPrestige) this.world.guildPrestige[actor.guild] = (this.world.guildPrestige[actor.guild] || 0) + 1 + Math.floor(g.tier / 2);
      if (g.tier >= 3 || known.length) this.rumor(`${actor.name}${team.length ? `(${team.map((n) => n.name).join('·')})` : ''}이(가) ${label}을(를) 닫았다.`, { kind: 'eco-ok', thread: 'gate:' + g.id });
      if (known.length) this.log(`${known.map((n) => n.name).join('·')}이(가) 속한 ${actor.name}이(가) ${label}을(를) 공략했다.`, 'good');
      if (g.variant === 'misrank') this.rumor(`${label}은(는) 알고 보니 ${RANKS[this.ecoRealTier(g)].key}급이었다고 한다.`);
      return;
    }
    this.world.ecoStat.fail++;
    g.failed = (g.failed || 0) + 1;
    const dead = [];
    const deathP = ECO.deathOnFail * (g.variant === 'red' ? 2 : 1) * (this.ecoRealTier(g) > g.tier ? 1.5 : 1);
    for (const n of team) if (RNG.chance(deathP)) { this.killNpc(n, '게이트'); dead.push(n); }
    g.lastFail = actor.name;
    if (g.tier >= 3 || dead.length || team.some((n) => n.met)) this.rumor(`${actor.name}이(가) ${label} 공략에 실패했다.${dead.length ? ` ${dead.map((n) => n.name).join('·')}은(는) 돌아오지 못했다.` : ' 전원 부상으로 철수.'}`, { kind: 'eco-fail', thread: 'gate:' + g.id, score: dead.length ? 1 : 0 });
    for (const n of dead) if (n.met) { this.log(`${n.name}이(가) ${label}에서 돌아오지 못했다.`, 'bad'); this.lifeEvent && n.relation >= 40 && this.lifeEvent(`${n.name}을(를) 게이트에서 잃었다.`); }
    for (const n of team) if (n.alive && n.met) this.log(`${n.name}이(가) ${label}에서 다쳐 돌아왔다.`, 'bad');
  };

  // 기한이 지난 게이트: 협회가 쓸어 담거나, 터진다
  GP.ecoExpire = function (g) {
    const mk = this.monthKey(); const reg = regionById(g.region);
    this.mapGates = this.mapGates.filter((x) => x.id !== g.id);
    let p = ECO.breakChance[this.ecoRealTier(g)] * (g.variant === 'red' ? 1.5 : 1) * (g.bid ? 1.4 : 1) * (g.neglected ? 2.5 : 1);
    // 지역 헌터가 적으면 더 잘 터진다
    const strong = this.adults().filter((n) => n.region === g.region && n.rankIdx >= g.tier).length;
    if (strong === 0) p *= 1.5;
    if (reg.id === 'jeju' || this.world.breaks.length >= 2 || this.world.breaks.some((b) => b.city === g.region) || !RNG.chance(Math.min(0.9, p))) {
      if (g.tier >= 4 && reg.id !== 'jeju') this.rumor(`${reg.name}의 ${RANKS[g.tier].key}급 게이트가 기한을 넘겼지만 협회 봉쇄팀이 겨우 닫았다.`);
      return;
    }
    const blame = g.bid && this.player.guild ? GUILDS[this.player.guild].name : g.lastFail || (reg.guild ? GUILDS[reg.guild].name : '관리국');
    this.world.breaks.push({ city: g.region, until: mk + 2, tier: this.ecoRealTier(g), blame, from: g.id, at: mk });
    this.world.ecoStat.breaks++;
    this.breakingNews(`속보: ${reg.name} ${RANKS[g.tier].key}급 게이트 브레이크! 괴수가 도심으로 쏟아지고 있다.`, `${blame}이(가) 맡은 게이트를 놓쳤다는 비난이 쏟아진다.`);
    if (g.bid) this.log('당신의 길드가 낙찰받고 방치한 게이트가 터졌다. 길드 안에서 책임론이 돈다.', 'bad');
  };

  GP.breakingNews = function (head, tail) {
    this.rumor(head + (tail ? ' ' + tail : ''), { kind: 'break', score: 2 });
    this.log(head, 'major');
    this.queue.push({ type: 'toast', text: head });
    this.world.breaking = { text: head, mk: this.monthKey() };
  };

  GP.gateEcology = function () {
    const mk = this.monthKey();
    for (const g of [...this.mapGates]) {
      g.deadline ??= g.born + ECO.deadline(g.tier);
      if (g.raid) { this.ecoResolve(g); if (!this.mapGates.includes(g)) continue; }
      if (mk >= g.deadline && !g.final && !g.mission && !g.crew) { this.ecoExpire(g); continue; }
      if (!this.ecoEligible(g) || g.bid) continue;
      // 생긴 달엔 플레이어에게 먼저 기회를 준다
      if (mk - g.born < 1) continue;
      if (!RNG.chance(ECO.attempt[g.tier])) continue;
      const f = this.ecoForm(g);
      if (!f) continue;
      g.raid = { actor: f.actor, ids: f.team.map((n) => n.id), at: mk };
      if (f.team.some((n) => n.met) || g.tier >= 4) this.rumor(`${f.actor.name}이(가) ${regionById(g.region).name} ${RANKS[g.tier].key}급 게이트에 들어갔다.`, { kind: 'eco-in', thread: 'gate:' + g.id, score: -1 });
    }
  };

  wrap('spawnMonthly', function (base) {
    if (this.player) this.gateEcology();
    base.call(this);
    const mk = this.monthKey();
    for (const g of this.mapGates) g.deadline ??= mk + ECO.deadline(g.tier);
    for (const r of Object.keys(this.world.damaged || {})) if (this.world.damaged[r] < mk) delete this.world.damaged[r];
  });

  // 플레이어가 먼저 닫으면 들어가 있던 팀은 허탕
  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const raid = gate && gate.raid;
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (raid && result === 'clear' && Array.isArray(lines)) {
      lines.push(`${raid.actor.name}보다 먼저 보스를 잡았다. 뒤늦게 도착한 팀이 허탈하게 웃는다.`);
      for (const id of raid.ids) { const n = this.npcById(id); if (n) this.changeRel(n, n.personality === 'kind' ? 1 : -3); }
      gate.raid = null;
    }
    return lines;
  });

  // 브레이크 수습: 누가 막았나
  wrap('worldMonthly', function (base) {
    const mk = this.monthKey();
    const ending = (this.world.breaks || []).filter((b) => mk > b.until).map((b) => ({ ...b }));
    // NPC가 막을 기회 (수습 직전)
    for (const b of ending) {
      const reg = regionById(b.city);
      const heroes = this.adults().filter((n) => (n.region === b.city || regionDist(n.region, b.city) <= 1) && n.rankIdx >= b.tier && !n.isCompanion).sort((a, x) => x.rankIdx - a.rankIdx);
      b.hero = heroes[0] && RNG.chance(0.6) ? heroes[0] : null;
      if (b.hero) {
        b.hero.renown = (b.hero.renown || 0) + 20 + b.tier * 5;
        if (b.hero.guild && this.world.guildPrestige) this.world.guildPrestige[b.hero.guild] += 6;
        this.rumor(`${RANKS[b.hero.rankIdx].key}급 ${b.hero.name}이(가) ${reg.name} 브레이크의 핵을 베었다. 시민들이 이름을 연호한다.`);
        if (b.hero.met) this.log(`${b.hero.name}이(가) ${reg.name} 브레이크를 막았다.`, 'good');
      }
    }
    // NPC가 막은 브레이크는 희생이 적다: 기존 수습(희생 18%) 대신 직접 처리
    for (const b of ending) if (b.hero) {
      this.world.breaks = this.world.breaks.filter((x) => x.city !== b.city);
      const victims = this.adults().filter((n) => n.region === b.city && !n.isCompanion && n !== b.hero && RNG.chance(0.04));
      for (const v of victims) this.killNpc(v, '게이트 브레이크');
      if (victims.some((v) => v.met)) this.log(`${regionById(b.city).name} 브레이크로 아는 얼굴이 희생됐다.`, 'bad');
    }
    base.call(this);
    // 아무도 못 막은 브레이크는 도시 피해로 남는다
    for (const b of ending) {
      if (b.hero) continue;
      this.world.damaged[b.city] = mk + 3;
      this.addRep && this.addRep(b.city, -5);
      this.rumor(`${regionById(b.city).name}은(는) 브레이크의 상처가 깊다. 상점 일부가 문을 닫고 물가가 뛰었다.`);
    }
  });

  // 막아 낸 경우(플레이어)
  wrap('resolveBreak', function (base, regionId) {
    const b = (this.world.breaks || []).find((x) => x.city === regionId);
    const r = base.call(this, regionId);
    if (b && b.blame) this.rumor(`${b.blame}이(가) 놓친 게이트의 뒷수습을 ${this.player.name}이(가) 했다는 말이 돈다.`);
    return r;
  });

  // 피해 도시 물가
  if (GP.cityPriceMul) wrap('cityPriceMul', function (base, regionId) {
    const m = base.call(this, regionId);
    return this.world.damaged && this.world.damaged[regionId] ? m * 1.2 : m;
  });

  // NPC 랭킹 점수에 공략 명성 반영
  if (GP.rankScore) wrap('rankScore', function (base, n) { return base.call(this, n) + Math.min(n.renown || 0, 500) * 0.6; });

  // 게이트 정보에 진행 상황
  wrap('gateName', function (base, g) {
    const n = base.call(this, g);
    return g.raid ? `${n} · ${g.raid.actor.name} 공략 중` : n;
  });
}
