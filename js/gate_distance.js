// 생활권 주변부터 공략하고, 정착지에서 멀어질수록 강한 일반 게이트를 만난다.
{
  const GP = Game.prototype;
  const settlements = () => [
    ...Object.entries(WORLD.cityPos).map(([region, p]) => ({ x: p[0], y: p[1], region, radius: ['gangnam', 'busan', 'daegu'].includes(region) ? Math.max(2, Math.round(WORLD.K * 0.9)) : Math.max(1, Math.round(WORLD.K * 0.45)) })),
    ...WORLD.towns.map(t => ({ ...t, radius: Math.max(1, Math.round(WORLD.K * (t.tier === 2 ? 0.4 : 0.22))) })),
  ];
  const ordinary = g => !g.final && !g.mission && !g.variant && !g.calamity && !g.north && !g.breakCity && !g.exam && !g.tutorial && !g.crew;
  GP.gateSettlementDistance = function (x, y, region) {
    const points = settlements().filter(t => (t.region === 'jeju') === (region === 'jeju'));
    return Math.min(...points.map(t => Math.max(0, Math.hypot(x - t.x, y - t.y) - t.radius)));
  };
  GP.gateDistanceTier = function (x, y, region) {
    // 정착지 외곽에서 4칸 이내 F, 8칸 이내 E … 28칸 이내 S, 그 밖은 SS.
    return Math.max(0, Math.min(7, Math.ceil(this.gateSettlementDistance(x, y, region) / 4) - 1));
  };
  GP.nearbyStarterGateTile = function (region = this.player.region) {
    const p = this.player;
    const towns = settlements().filter(t => t.region === region).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
    const home = towns[0]; if (!home) return null;
    for (let r = 2; r <= home.radius + 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || Math.hypot(dx, dy) > home.radius + 4) continue;
      const x = home.x + dx, y = home.y + dy;
      if (!WORLD.inb(x, y) || !WORLD.passable(WORLD.idx(x, y), true) || WORLD.regionAt(x, y)?.id !== region) continue;
      if (WORLD.cityAt(x, y) || WORLD.townAt(x, y) || WORLD.isRoad(x, y) || this.objAt(x, y) || (p.x === x && p.y === y)) continue;
      return [x, y];
    }
    return null;
  };
  GP.ensureNearbyStarterGate = function () {
    const p = this.player;
    if (!p || this.mapGates.some(g => !g.cleared && ordinary(g) && g.region === p.region && g.tier === 0 && this.ensureOwner(g) === 'kama' && Math.hypot(g.x - p.x, g.y - p.y) <= 6)) return;
    // 첫 활동 안내에서만 확보한다. 일반 월별 생성 수는 늘리지 않는다.
    const pos = this.nearbyStarterGateTile(); if (!pos) return;
    const gate = { id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: p.region, tier: 0, theme: RNG.pick(GATE_THEMES), elem: pickElem(), born: this.monthKey(), owner: 'kama' };
    this.mapGates.push(gate);
  };
  const init = GP.initSandbox;
  GP.initSandbox = function (...args) {
    const result = init.apply(this, args);
    this.world.gateDistanceVersion ??= 0;
    if (!this.world.gateDistanceVersion) {
      const active = this.player?.gateRunSave?.gid;
      for (const gate of this.mapGates || []) {
        if (ordinary(gate) && !gate.cleared && !gate.raid && gate.id !== active && !(this.player?.firstSortie?.status === 'active' && gate.id === this.player.firstSortie.gate)) gate.tier = this.gateDistanceTier(gate.x, gate.y, gate.region);
      }
      this.world.gateDistanceVersion = 1;
    }
    return result;
  };
  const sortie = GP.firstSortieOffer;
  GP.firstSortieOffer = function (...args) {
    const s = this.player.firstSortie;
    if (!s || !['active', 'done'].includes(s.status)) {
      this.ensureNearbyStarterGate();
      // 아직 신청하지 않은 먼 목표는 가까운 게이트부터 다시 고른다.
      if (s) s.gate = null;
    }
    return sortie.apply(this, args);
  };
  const cands = GP.crewJobCands;
  GP.crewJobCands = function (...args) {
    const c = this.player?.crew, L = c && this.npcById(c.leader);
    if (!L?.alive) return cands.apply(this, args);
    // 리더가 높게 각성했어도 신입 팀원의 첫 공략을 먼 고등급 게이트로 잡지 않는다.
    const cap = Math.min(L.rankIdx, this.player.rankIdx + 1);
    const ride = this.crewRide();
    const routes = this.mapGates.filter(g => !g.cleared && !g.final && !g.mission && !g.variant && !g.calamity && !g.north && g.tier <= cap && (g.region !== 'jeju' || this.player.rankIdx >= 6))
      .map(g => { const raw = UI.travelPlan(g.x, g.y).days ?? 99; return { g, raw, d: ride.days(raw) }; })
      .filter(x => x.d <= 8).sort((a, b) => a.raw - b.raw || a.g.tier - b.g.tier).slice(0, 3);
    const mates = this.withCrew(() => this.party()).filter(n => n !== L && n.crewOf === c.id);
    const tier = this.crewTier();
    return routes.map(({g, d}, i) => {
      const x = { kind: 'gate', id: g.id, tier: g.tier, region: g.region, days: d, title: this.gateName(g), rec: i === 0, yes: [], no: [] };
      for (const n of mates) {
        const pr = n.personality;
        const like = pr === 'warlike' ? x.tier >= tier : pr === 'kind' ? x.tier < tier : ['greedy', 'just'].includes(pr) ? true : x.rec;
        (like ? x.yes : x.no).push(n);
      }
      return x;
    });
  };
}
