// ===== 게이트 크로니클: 길드 게이트 보스 가로채기 (영역 C, 4-17 추가) =====
// 남의 길드가 관리권을 가진 게이트(g.owner, js/gate_tender.js)에서 외부인이 최종 보스를 잡아 닫으면 그 길드와 크게 틀어진다.
// C: 관계·추격 판정·협상 결과·뉴스. F: 최종층 진입 훅(G.guildChaseCheck 호출), 경고·층 지도 표식. A: 대인 전투 연출.
// p.guildFeud[gid]: 길드가 플레이어를 보는 감정(−100~100). −60 이하면 적대.

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) { base.call(this); this.player.guildFeud ??= {}; });

  GP.guildFeud = function (gid, d = 0) {
    const f = (this.player.guildFeud ||= {});
    if (d) f[gid] = Math.max(-100, Math.min(100, (f[gid] || 0) + d));
    return f[gid] || 0;
  };
  GP.guildHostileTo = function (gid) { return this.guildFeud(gid) <= -60; };

  // 성향: 거대·정부 길드는 법적 대응·현상금, 평판 낮은 중소 길드나 수장이 거친 길드는 바로 생사결
  GP.guildTemper = function (gid) {
    if (GUILDS[gid] && GUILDS[gid].lawless) return 'lawless';
    if (typeof GUILD_TIER !== 'undefined' && GUILD_TIER[gid] !== 'minor') return 'legal';
    const L = this.factionLeader ? this.factionLeader(gid) : null;
    if ((GUILDS[gid].rep ?? 50) < 50 || (L && ['warlike', 'greedy'].includes(L.personality))) return 'lawless';
    return 'legal';
  };

  // 외부인 여부: 관리국 게이트·자기 길드·동맹(세력 관계 50 이상) 게이트는 해당 없음
  GP.isGuildGateOutsider = function (g) {
    const o = g && this.gateOwner ? this.gateOwner(g) : 'kama';
    if (o === 'kama' || !GUILDS[o] || g.bid || g.exam || g.tutorial) return null;
    const p = this.player;
    if (p.guild === o) return null;
    const F = this.world.factions;
    if (p.guild && F && F[p.guild] && (F[p.guild].rel[o] || 0) >= 50) return null;
    return o;
  };

  // 최종층 진입 때 F가 부른다 → 추격대가 오는가
  GP.guildChaseCheck = function (g) {
    const gid = this.isGuildGateOutsider(g); if (!gid) return null;
    const inside = g.raid && g.raid.actor && g.raid.actor.guild === gid;
    const temper = this.guildTemper(gid);
    let p = inside ? 0.8 : 0.25;
    if (temper === 'lawless') p *= 1.5;
    if (this.guildHostileTo(gid)) p += 0.2;
    if (!RNG.chance(Math.min(0.95, p))) return { chase: false, guild: gid, temper };
    const fit = (n) => n.rankIdx >= g.tier - 1;
    const team = (inside ? g.raid.ids.map((id) => this.npcById(id)).filter((n) => n && n.alive) : this.adults().filter((n) => n.guild === gid && !n.isCompanion && !n.hired && !n.retired && !(n.hurt > 0) && fit(n)))
      .sort((a, b) => b.rankIdx - a.rankIdx).slice(0, 4);
    if (!team.length) return { chase: false, guild: gid, temper };
    // 거대 길드는 먼저 말로(협상 여지), 무법 길드는 바로 칼부터
    return { chase: true, guild: gid, temper, inside: !!inside, ids: team.map((n) => n.id), mood: temper === 'lawless' ? 'kill' : 'deal' };
  };

  // 추격대와 협상: kind = share(보상 나눔) | apology(사과·철수) | bribe(뇌물)
  GP.guildChaseDeal = function (g, kind, chase) {
    const p = this.player; const gid = chase ? chase.guild : this.isGuildGateOutsider(g); if (!gid) return { ok: true, text: '' };
    const name = GUILDS[gid].name; const lawless = (chase && chase.temper) === 'lawless';
    if (kind === 'apology') {
      const ok = RNG.chance(lawless ? 0.35 : 0.75);
      if (ok) { this.guildFeud(gid, -5); return { ok, leave: true, text: `${name} 추격대에 고개를 숙이고 보스층에서 물러났다. 체면은 구겼지만 피는 보지 않았다.` }; }
      return { ok, text: `${name} 추격대는 사과를 받아 주지 않았다. "말로 끝날 일이 아니야."` };
    }
    if (kind === 'bribe') {
      const cost = Math.round(400 * RANKS[g.tier].mult);
      if (p.money < cost) return { ok: false, text: `쥐여 줄 돈이 모자라다. (${fmt(cost)} 크레딧 필요)` };
      const ok = RNG.chance(lawless ? 0.8 : 0.5);
      if (ok) { p.money -= cost; this.guildFeud(gid, -10); return { ok, cost, text: `${fmt(cost)} 크레딧을 건넸다. 추격대는 못 본 척 길을 비켰다. 보스를 잡더라도 길드의 감정은 남는다.` }; }
      if (!lawless) { this.guildFeud(gid, -15); if (this.addSin) this.addSin(1, '길드 추격대 매수 시도'); }
      return { ok, text: lawless ? `${name} 추격대가 돈만 챙기고 칼을 뽑았다.` : `${name} 추격대가 뇌물을 거절했다. 매수 시도까지 기록에 남는다.` };
    }
    // share: 보스 전리품을 나누기로
    const ok = RNG.chance(lawless ? 0.5 : 0.7);
    if (ok) { g.poachShare = gid; this.guildFeud(gid, -8); return { ok, text: `보스 전리품의 절반을 ${name}에 넘기기로 했다. 추격대가 보스층 입구를 지킨다.` }; }
    return { ok, text: `${name} 추격대가 코웃음을 쳤다. "전부 내놓든지, 여기서 죽든지."` };
  };

  // 추격대와의 생사결 결과(A의 전투 뒤에 부른다): won = 이겼는가
  GP.guildChaseResult = function (g, chase, won) {
    const gid = chase.guild; const name = GUILDS[gid].name; const p = this.player;
    if (won) {
      this.guildFeud(gid, -30);
      if (this.addSin) this.addSin(2, `${name} 추격대 격퇴`);
      this.rumor(`${p.name}이(가) ${name} 추격대를 게이트 안에서 쓰러뜨렸다는 소문이다.`, { kind: 'poach', score: 3 });
      return `${name} 추격대를 물리쳤다. 악명이 퍼진다.`;
    }
    const lost = Math.floor(p.money * 0.2); p.money -= lost;
    p.injured = Math.max(p.injured || 0, 5); this.recalc();
    if (RNG.chance(0.03)) { p.lifePenalty += 2; if (this.noteLifeLoss) this.noteLifeLoss(2, `${name} 추격대에 당함`); }
    this.guildFeud(gid, 10); // 응징을 했으니 조금 풀린다
    return `${name} 추격대에 붙잡혔다. 전리품과 ${fmt(lost)} 크레딧을 빼앗기고 크게 다쳤다. (부상 5개월)`;
  };

  // 보스를 잡아 게이트를 닫았다 → 후폭풍
  GP.bossPoach = function (g, lines) {
    const gid = this.isGuildGateOutsider(g); if (!gid) return;
    const p = this.player; const name = GUILDS[gid].name; const reg = regionById(g.region);
    const shared = g.poachShare === gid;
    this.guildFeud(gid, shared ? -15 : -60);
    for (const n of this.adults()) if (n.guild === gid && n.met && this.changeRel) this.changeRel(n, shared ? -5 : -25);
    if (this.factionPrestige) this.factionPrestige(gid, -2);
    if (p.guild && this.factionRel) this.factionRel(p.guild, gid, shared ? -5 : -15);
    const out = [];
    if (shared) {
      out.push(`약속대로 보스 전리품 절반을 ${name}에 넘겼다. 그래도 길드 게이트를 닫은 일은 쉽게 잊히지 않는다.`);
    } else {
      out.push(`${name}의 관리권 게이트에서 보스를 가로챘다. ${name}이(가) 당신을 적으로 여긴다.`);
      this.rumor(`${p.name}, ${name} 관리 게이트 보스 가로채기. ${reg.name} ${RANKS[g.tier].key}급 게이트가 길드 허락 없이 닫혔다.`, { kind: 'poach', thread: 'gate:' + g.id, score: 4 });
      if (this.guildTemper(gid) === 'legal') {
        const fine = Math.round(Math.min(p.money * 0.25, 600 * RANKS[g.tier].mult));
        if (fine > 0) { p.money -= fine; out.push(`${name}이(가) 관리국에 손해배상을 청구했다. 배상금 ${fmt(fine)} 크레딧.`); }
        p.poachBounty = { guild: gid, until: this.monthKey() + 6 };
        out.push(`${name}이(가) 업계에 당신의 이름을 돌렸다. 한동안 길드 쪽 사람들이 노릴 수 있다.`);
      }
      // 소속 길드가 있으면 외교 문제로 제명(관리국 소속은 징계 없이 경고)
      if (p.guild && p.guild !== 'kama' && GUILD_TIER[gid] !== 'minor') {
        const was = GUILDS[p.guild].name;
        const r = this.leaveGuild();
        if (p.guild) { p.guild = null; p.guildRank = 0; p.contrib = 0; p.contract = null; }
        out.push(`${was}이(가) 외교 문제를 이유로 당신을 제명했다. ${r || ''}`.trim());
        this.rumor(`${was}, ${name}과(와)의 마찰 끝에 ${p.name}을(를) 제명.`, { kind: 'transfer', score: 2 });
      }
      // 헌터넷 여론은 갈린다
      if (this.hnetPost && this.world.hnet) {
        const post = this.hnetPost({ board: 'hot', title: `[논란] ${p.name}, ${name} 게이트 보스 가로채기`, body: `${reg.name} ${RANKS[g.tier].key}급, ${name} 관리권 게이트. 입장료 내고 들어가서 보스까지 잡아 버렸다고.`, kind: 'gate', aboutPlayer: true, vars: this.hnetVars ? this.hnetVars() : {}, n: 4 });
        const side = [
          ['속 시원하다 ㅋㅋ 대형 길드가 게이트 독점하는 거 언제까지 봐야 함', 'praise'], ['관리권 입찰이 애초에 짬짜미임', 'govcrit'],
          ['입장료 냈으면 보스층 안 가는 게 룰이지 비매너 ㅉㅉ', 'anti'], ['저러다 진짜 길드 추격대한테 묻힌다', 'doubt'], [`${name} 표정 관리 안 되겠네`, 'joke'],
        ];
        for (const [t, k] of side) post.cmt.push({ nick: this.hnetNick(), t, up: RNG.int(20, 400), k });
        if (p.hnet) p.hnet.heat = (p.hnet.heat || 0) + 8;
        if (p.hnet && p.hnet.card) this.queue.push({ type: 'hnet', id: post.id });
      }
    }
    delete g.poachShare; delete g.poachShareA;
    for (let i = 0; i < out.length; i++) out[i] = typeof fixJosa === 'function' ? fixJosa(out[i]) : out[i];
    if (Array.isArray(lines)) lines.push(...out);
    this.log(out[0], 'bad');
  };

  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    const gid = result === 'clear' ? this.isGuildGateOutsider(gate) : null;
    if (gid && gate.poachShare === gid && !gate.poachShareA && loot) { loot.money = Math.round(loot.money / 2); loot.ether = Math.round(loot.ether / 2); }
    const lines = base.call(this, gate, result, loot, ...rest);
    if (gid) this.bossPoach(gate, lines);
    return lines;
  });

  // 보스층 앞에서 물러난 외부인(F가 부른다): 매너 좋은 헌터
  GP.guildGateMannerly = function (g) {
    const gid = this.isGuildGateOutsider(g); if (!gid) return '';
    this.guildFeud(gid, 4);
    if (this.factionPrestige) this.factionPrestige(gid, 0);
    return `${GUILDS[gid].name} 관리 게이트의 보스층 앞에서 물러났다. 규칙을 지키는 헌터라는 평이 돈다.`;
  };

  // 현상금이 걸린 동안 적대 길드원이 가끔 기습
  wrap('worldMonthly', function (base) {
    base.call(this);
    const p = this.player; const b = p && p.poachBounty;
    if (!b) return;
    if (this.monthKey() > b.until) { p.poachBounty = null; return; }
    if (!RNG.chance(0.1)) return;
    const n = RNG.pick(this.adults().filter((x) => x.guild === b.guild && !x.isCompanion && !x.retired && Math.abs(x.rankIdx - p.rankIdx) <= 1));
    if (n) this.queue.push({ type: 'ambush', npcId: n.id });
  });

  // A의 추격대 연출(js/gate_pursuit.js) 결과 통보: 관계·뉴스·현상금
  GP.gatePursuitResult = function ({ guild, result, amount = 0 }) {
    const gid = guild; if (!GUILDS[gid]) return;
    const name = GUILDS[gid].name; const p = this.player;
    const g = typeof UI !== 'undefined' && UI.ctx ? UI.ctx.gate : null;
    const legal = this.guildTemper(gid) === 'legal';
    if (result === 'share') { if (g) { g.poachShare = gid; g.poachShareA = true; } this.guildFeud(gid, -8); }
    else if (result === 'bribe') this.guildFeud(gid, -10);
    else if (result === 'apology') this.guildFeud(gid, -3);
    else if (result === 'win') {
      this.guildFeud(gid, -30);
      for (const n of this.adults()) if (n.guild === gid && n.met && this.changeRel) this.changeRel(n, -15);
      this.rumor(`${p.name}이(가) ${name} 추격대를 게이트 안에서 쓰러뜨렸다는 소문이다.`, { kind: 'poach', score: 3 });
      if (legal) { p.poachBounty = { guild: gid, until: this.monthKey() + 6 }; this.log(`${name}이(가) 추격대 일로 현상금을 걸었다. 한동안 길드 쪽 사람들이 노린다.`, 'bad'); }
      if (this.hnetReact) this.hnetReact(`${p.name}, ${name} 추격대 역관광`, `게이트 안에서 길드 추격대와 붙었다는 목격담.`, 'gate');
    } else if (result === 'lose') {
      this.guildFeud(gid, 10);
      this.rumor(`${name} 추격대가 관리권 게이트에 몰래 들어간 ${p.name}을(를) 붙잡아 전리품을 압수했다.`, { kind: 'poach', score: 2 });
    } else if (result === 'dead') {
      this.rumor(`${name} 관리권 게이트 안에서 ${p.name}이(가) 숨졌다. 길드 추격대와 마찰이 있었다는 증언이 나온다.`, { kind: 'poach', score: 4 });
    }
  };
}

// 성향 필드(A gate_pursuit.js가 읽는다): tier = 거대·정부·중소, lawless = 평판 낮은 중소 길드
for (const id of Object.keys(GUILDS)) {
  if (typeof GUILD_TIER !== 'undefined' && GUILD_TIER[id] && GUILDS[id].tier == null) GUILDS[id].tier = GUILD_TIER[id];
  if (GUILDS[id].minor && GUILDS[id].lawless == null) GUILDS[id].lawless = (GUILDS[id].rep ?? 50) < 50;
}
