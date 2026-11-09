// ===== 게이트 크로니클: NPC 파티와 귀환석 (영역 C) =====
// docs/구현_대기목록.md 4-7(사용자 확정): 귀환석은 어디서든 즉시 탈출되지만 매우 매우 귀하다.
// NPC 쪽 반영: 변이 게이트(레드·오측정)에서 공략에 실패한 팀은 "갇힌다". 아주 드물게 상위 길드 팀만
// 귀환석을 갖고 있어 생환하고(뉴스), 대부분은 실종 → 구조 요청. 기한 안에 누가 게이트를 닫으면 구출,
// 게이트가 기한을 넘기면 실종자는 돌아오지 못한다.

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.ecoIsVariant = function (g) { return g.variant === 'red' || (g.realTier != null && g.realTier > g.tier) || g.variant === 'double'; };
  // 귀환석을 가진 팀: 상위 두 길드의 팀만, 그것도 드물게
  GP.ecoHasRecall = function (actor) {
    if (!actor || actor.kind !== 'guild' || !this.guildPower) return false;
    const top = Object.keys(GUILDS).sort((a, b) => this.guildPower(b) - this.guildPower(a)).slice(0, 2);
    return top.includes(actor.guild) && RNG.chance(0.15);
  };

  // 변이 게이트 실패: 사망 대신 갇힘
  wrap('killNpc', function (base, n, cause, killer) {
    if (this._ecoTrap && cause === '게이트' && !killer) { this._ecoTrap.push(n); return; }
    return base.call(this, n, cause, killer);
  });

  wrap('ecoResolve', function (base, g) {
    const raid = g.raid;
    if (!raid || !this.ecoIsVariant(g)) return base.call(this, g);
    const team = raid.ids.map((id) => this.npcById(id)).filter((n) => n && n.alive);
    this._ecoTrap = [];
    try { base.call(this, g); } finally {
      const trapped = this._ecoTrap; this._ecoTrap = null;
      const failed = this.mapGates.includes(g);
      if (failed) {
        // 죽을 운명이던 사람뿐 아니라 팀 전체가 갇힌다
        const all = [...new Set([...trapped, ...team.filter((n) => n.alive)])];
        const label = `${regionById(g.region).name} ${RANKS[g.tier].key}급 ${g.variant === 'red' ? '레드 ' : ''}게이트`;
        if (this.ecoHasRecall(raid.actor)) {
          for (const n of all) { n.hurt = Math.max(n.hurt || 0, 2); if (n.met && this.npcRemember) this.npcRemember(n, `${label}에서 귀환석으로 살아 나왔다`); }
          if (this.world.factions && this.world.factions[raid.actor.guild]) this.world.factions[raid.actor.guild].funds -= 5000;
          this.rumor(`${raid.actor.name} 파티, ${label}에 갇혔다가 귀환석으로 생환. 귀환석 한 개 값이 얼마인지 아는 사람들은 혀를 찼다.`, { kind: 'recall', thread: 'gate:' + g.id, score: 4 });
          if (all.some((n) => n.met)) this.log(`${all.filter((n) => n.met).map((n) => n.name).join('·')}이(가) 귀환석으로 ${label}에서 빠져나왔다.`, 'good');
        } else if (all.length) {
          g.trapped = all.map((n) => n.id); g.trapActor = raid.actor.name;
          g.deadline = Math.max(g.deadline || 0, this.monthKey() + 2); // 구조 시한
          for (const n of all) { n.missing = g.id; n.hurt = 99; }
          this.rumor(`속보: ${raid.actor.name} 파티 ${all.length}명, ${label}에서 실종. 변이로 출구가 닫혔다. 협회가 구조 요청을 냈다.`, { kind: 'missing', thread: 'gate:' + g.id, score: 5 });
          const known = all.filter((n) => n.met);
          if (known.length || this.player.region === g.region) {
            this.log(`구조 요청: ${label}에 ${known.length ? known.map((n) => n.name).join('·') + ' 등 ' : ''}${all.length}명이 갇혔다. 두 달 안에 게이트를 닫으면 구할 수 있다.`, 'major');
            this.queue.push({ type: 'toast', text: `구조 요청 · ${label}` });
          }
        }
      }
    }
  });

  // 실종자가 갇힌 게이트는 이름에 표시
  wrap('gateName', function (base, g) {
    const n = base.call(this, g);
    return g.trapped && g.trapped.length ? `${n} · 구조 요청 ${g.trapped.length}명` : n;
  });

  GP.ecoFreeTrapped = function (g, by) {
    const ids = g.trapped || []; g.trapped = null;
    const out = [];
    for (const id of ids) { const n = this.npcById(id); if (!n || !n.alive) continue; n.missing = null; n.hurt = 3; out.push(n); }
    return out;
  };

  // 플레이어가 닫으면 구출
  wrap('finishGate', function (base, gate, result, ...rest) {
    const trapped = gate && gate.trapped ? gate.trapped.slice() : null;
    const lines = base.call(this, gate, result, ...rest);
    if (trapped && result === 'clear') {
      const saved = this.ecoFreeTrapped(gate, 'player');
      if (saved.length) {
        const p = this.player;
        p.fame += 5 + saved.length * 2; p.merit = (p.merit || 0) + 10 * saved.length;
        for (const n of saved) { n.met = true; this.changeRel(n, 30, '갇힌 게이트에서 구해 줬다'); }
        if (this.addLaw) this.addLaw(4, '구조');
        if (this.addOpinion) this.addOpinion(3);
        this.rumor(`${p.name}이(가) 실종됐던 ${saved.map((n) => n.name).join('·')}을(를) 구해 냈다.`, { kind: 'rescue', thread: 'gate:' + gate.id, score: 5 });
        if (Array.isArray(lines)) lines.push(`게이트 깊은 곳에서 실종자 ${saved.length}명을 찾아 데리고 나왔다. 명성 +${5 + saved.length * 2}, 협회 공적 +${10 * saved.length}.`);
      }
    }
    return lines;
  });
  // NPC 팀이 닫으면 구출
  wrap('ecoResolve', function (base, g) {
    const had = g.trapped && g.trapped.length;
    base.call(this, g);
    if (had && !this.mapGates.includes(g)) {
      const saved = this.ecoFreeTrapped(g, 'npc');
      if (saved.length) this.rumor(`실종됐던 ${saved.map((n) => n.name).join('·')}, 공략팀에 구조돼 생환.`, { kind: 'rescue', thread: 'gate:' + g.id, score: 3 });
    }
  });
  // 기한이 지나면 돌아오지 못한다
  wrap('ecoExpire', function (base, g) {
    const ids = g.trapped ? g.trapped.slice() : [];
    g.trapped = null;
    base.call(this, g);
    const lost = ids.map((id) => this.npcById(id)).filter((n) => n && n.alive);
    for (const n of lost) { n.missing = null; this.killNpc(n, '게이트 실종'); }
    if (lost.length) {
      this.rumor(`${regionById(g.region).name} 게이트가 닫히며 실종자 ${lost.length}명의 수색이 끝났다. ${lost.map((n) => n.name).join('·')}.`, { kind: 'missing', thread: 'gate:' + g.id, score: 3 });
      if (lost.some((n) => n.met)) this.log(`${lost.filter((n) => n.met).map((n) => n.name).join('·')}은(는) 끝내 돌아오지 못했다.`, 'bad');
    }
  });
  // 다른 경로로 게이트가 사라지면 실종자도 돌아오지 못한다
  wrap('spawnMonthly', function (base) {
    base.call(this);
    const live = new Set(this.mapGates.map((g) => g.id));
    for (const n of this.npcs) if (n.alive && n.missing && !live.has(n.missing)) { n.missing = null; this.killNpc(n, '게이트 실종'); }
  });
  // 옛 저장·이상 상태: 사라진 게이트의 실종자 정리
  wrap('initSandbox', function (base) {
    base.call(this);
    const live = new Set((this.mapGates || []).map((g) => g.id));
    for (const n of this.npcs || []) if (n.missing && !live.has(n.missing)) { n.missing = null; if (n.hurt === 99) n.hurt = 0; }
  });
}
