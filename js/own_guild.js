// ===== 게이트 크로니클: 길드 창설과 운영 (영역 C) =====
// docs/헌터물_제안3.md 3. A급 이상 + 자금 + 명성이면 관리국에 길드를 등록한다.
// 길드원(관계 높은 NPC·제자)을 영입해 월급을 주고, 매달 방침(안전·보통·공격)에 따라 길드원이 지도 위 게이트를 공략한다.
// 시설(본부·훈련장·의무실·정보실)을 올리고, 세력 판도에 6번째로 이름을 올린다. 이적·배신·사망 책임론이 위험.
// 5대 길드 목록(GUILDS)에는 넣지 않는다(본부 지역 등 기존 코드가 기대하는 값이 없으므로). 저장: p.myGuild

const OG_NAMES = ['새벽', '청람', '흑월', '은랑', '한빛', '청사초롱', '무명', '백야'];
const OG_FAC = {
  hq:       { name: '본부', max: 3, cost: [0, 30000, 90000], desc: (l) => `길드원 정원 ${4 + l * 4}명` },
  training: { name: '훈련장', max: 3, cost: [15000, 45000, 120000], desc: (l) => `길드원 수련 +${l * 30}%` },
  clinic:   { name: '의무실', max: 3, cost: [12000, 36000, 90000], desc: (l) => `공략 실패 사망 −${l * 25}%` },
  intel:    { name: '정보실', max: 3, cost: [12000, 36000, 90000], desc: (l) => `공략 성공 +${l * 5}%, 음모 단서` },
};
const OG_POLICY = { safe: { name: '안전', range: [-3, -1] }, normal: { name: '보통', range: [-2, 0] }, bold: { name: '공격', range: [-1, 1] } };

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) { base.call(this); this.player.myGuild ??= null; });

  GP.ogFoundCost = function () { return 50000; };
  GP.ogCanFound = function () {
    const p = this.player;
    if (p.myGuild) return '이미 길드를 운영하고 있다.';
    if (p.rankIdx < 5) return '실력 A급 이상이어야 길드를 등록할 수 있다.';
    if ((p.official ?? 0) < 5) return '관리국 공식 등급 A급 이상이어야 한다. 재측정을 받자.';
    if (p.fame < 150) return '명성 150 이상이 필요하다.';
    if ((p.wanted || 0) >= 1) return '수배자는 길드를 등록할 수 없다.';
    if (p.money < this.ogFoundCost()) return `등록비와 사무실 보증금 ${fmt(this.ogFoundCost())} 크레딧이 필요하다.`;
    if (p.guild) return '다른 길드 소속이다. 먼저 계약을 정리해야 한다.';
    return '';
  };
  GP.ogFound = function (name) {
    const why = this.ogCanFound(); if (why) return why;
    const p = this.player;
    p.money -= this.ogFoundCost();
    p.myGuild = { name: `${name} 길드`, founded: this.monthKey(), members: [], funds: 5000, prestige: 20, fac: { hq: 1, training: 0, clinic: 0, intel: 0 }, policy: 'normal', log: [] };
    this.lifeEvent(`${p.myGuild.name}을(를) 세웠다.`);
    this.rumor(`${RANKS[p.official].key}급 ${p.name}, ${p.myGuild.name} 창설. 5대 길드 체제에 균열이 갈까.`, { kind: 'guild', score: 5 });
    if (this.world.factions) for (const id of Object.keys(GUILDS)) { const F = this.world.factions[id]; F.relMine = (F.relMine ?? 0) - 10; }
    return `${p.myGuild.name}을(를) 관리국에 등록했다. 사무실 열쇠를 받았다.`;
  };
  GP.ogMembers = function () { const g = this.player.myGuild; return g ? g.members.map((id) => this.npcById(id)).filter((n) => n && n.alive) : []; };
  GP.ogCap = function () { const g = this.player.myGuild; return g ? 4 + g.fac.hq * 4 : 0; };
  GP.ogNote = function (t, type = '') { const g = this.player.myGuild; g.log.unshift({ date: this.dateStr(), t: fixJosa(t) }); if (g.log.length > 12) g.log.length = 12; this.log(`[${g.name}] ${t}`, type); };
  GP.ogPower = function () {
    const g = this.player.myGuild; if (!g) return 0;
    let v = g.prestige; for (const n of this.ogMembers()) v += RANKS[n.rankIdx].mult * 3;
    return Math.round(v + RANKS[this.player.rankIdx].mult * 4);
  };
  GP.ogCandidates = function () {
    const p = this.player; const g = p.myGuild; if (!g) return [];
    return this.adults().filter((n) => n.region === p.region && !n.ogMember && !n.isCompanion && !n.retired && !(n.merc && n.merc.job) && n.guild !== 'kama' && (n.relation >= 40 || (p.disciples || []).includes(n.id)));
  };
  GP.ogSalary = function (n) { return Math.round(60 * RANKS[n.rankIdx].mult); };
  GP.ogRecruit = function (id) {
    const g = this.player.myGuild; const n = this.npcById(id); if (!g || !n) return '';
    if (this.ogMembers().length >= this.ogCap()) return '정원이 찼다. 본부를 넓히자.';
    const loyal = n.guild ? 0.35 : 0;
    if (RNG.chance(loyal + (n.amb === 'power' ? 0.2 : 0) - n.relation / 300)) { this.changeRel(n, -2, '길드 영입을 거절했다'); return `${n.name}: "지금 길드를 떠날 수는 없어. 미안해."`; }
    const from = n.guild; n.guild = null; n.ogMember = true; g.members.push(n.id);
    this.changeRel(n, 5, '당신의 길드에 들어왔다');
    if (from && this.factionRel) { const F = this.world.factions[from]; if (F) F.relMine = (F.relMine ?? 0) - 8; }
    this.ogNote(`${n.name}(${RANKS[n.rankIdx].key}급)이(가) 길드에 들어왔다.${from ? ` ${GUILDS[from].name}에서 옮겨 왔다.` : ''}`, 'good');
    return `${n.name}이(가) ${g.name}에 합류했다. 월급 ${fmt(this.ogSalary(n))} 크레딧.`;
  };
  GP.ogKick = function (id) {
    const g = this.player.myGuild; const n = this.npcById(id); if (!g || !n) return '';
    g.members = g.members.filter((x) => x !== n.id); n.ogMember = false; this.changeRel(n, -15, '길드에서 내보냈다');
    this.ogNote(`${n.name}을(를) 내보냈다.`);
    return `${n.name}을(를) 길드에서 내보냈다.`;
  };
  GP.ogUpgrade = function (k) {
    const g = this.player.myGuild; const F = OG_FAC[k]; if (!g || !F) return '';
    const lv = g.fac[k]; if (lv >= F.max) return '더 올릴 수 없다.';
    const cost = F.cost[lv]; const p = this.player;
    if (g.funds + p.money < cost) return '자금이 부족하다.';
    const fromFunds = Math.min(g.funds, cost); g.funds -= fromFunds; p.money -= cost - fromFunds;
    g.fac[k]++; this.ogNote(`${F.name}을(를) ${g.fac[k]}단계로 올렸다.`, 'good');
    return `${F.name} ${g.fac[k]}단계: ${F.desc(g.fac[k])}.`;
  };
  GP.ogDeposit = function (v) { const p = this.player; const g = p.myGuild; v = Math.min(v, p.money); if (!g || v <= 0) return ''; p.money -= v; g.funds += v; return `길드 금고에 ${fmt(v)} 크레딧을 넣었다.`; };
  GP.ogWithdraw = function () { const p = this.player; const g = p.myGuild; if (!g || g.funds <= 0) return ''; const v = Math.floor(g.funds * 0.5); g.funds -= v; p.money += v; return `길드 금고에서 ${fmt(v)} 크레딧을 꺼냈다.`; };

  // 매달 운영
  GP.ogMonthly = function () {
    const p = this.player; const g = p.myGuild; if (!g) return;
    // 다른 길드로 빠져나간 사람 정리 (스카우트·무작위 가입)
    for (const n of this.ogMembers()) if (n.guild) { n.ogMember = false; this.ogNote(`${n.name}이(가) ${GUILDS[n.guild] ? GUILDS[n.guild].name : '다른 길드'}의 제의를 받아 떠났다.`, 'bad'); }
    const ms = this.ogMembers().filter((n) => n.ogMember);
    g.members = ms.map((n) => n.id);
    // 월급
    let pay = 0; for (const n of ms) pay += this.ogSalary(n);
    if (g.funds >= pay) g.funds -= pay;
    else { const short = pay - g.funds; g.funds = 0; if (p.money >= short) p.money -= short; else { for (const n of ms) this.changeRel(n, -6, '월급이 밀렸다'); this.ogNote('월급이 밀렸다. 길드원들이 수군거린다.', 'bad'); } }
    // 훈련장
    for (const n of ms) n.progress += 0.02 * g.fac.training;
    // 공략
    const pol = OG_POLICY[g.policy] || OG_POLICY.normal;
    for (const n of ms) {
      if (n.hurt > 0 || !RNG.chance(0.45)) continue;
      const gate = this.mapGates.find((x) => !x.final && !x.mission && !x.raid && !x.hold && !x.crew && !x.bid && x.region !== 'jeju' && (x.region === n.region || regionDist(x.region, n.region) <= 1) && x.tier >= n.rankIdx + pol.range[0] && x.tier <= n.rankIdx + pol.range[1]);
      if (!gate) { g.funds += Math.round(90 * RANKS[n.rankIdx].mult); continue; } // 잡일 수입
      const real = gate.realTier ?? gate.tier;
      const mates = ms.filter((x) => x !== n && x.region === n.region && !(x.hurt > 0)).slice(0, 2);
      const pow = [n, ...mates].reduce((s, x) => s + RANKS[x.rankIdx].mult * (1 + x.stage * 0.1), 0);
      const need = RANKS[real].mult * 1.5 * (gate.variant === 'red' ? 1.6 : 1);
      const chance = Math.min(0.96, pow * pow / (pow * pow + need * need) + g.fac.intel * 0.05);
      const label = `${regionById(gate.region).name} ${RANKS[gate.tier].key}급 게이트`;
      if (RNG.chance(chance)) {
        this.mapGates = this.mapGates.filter((x) => x !== gate);
        const income = Math.round(420 * RANKS[real].mult * (1 + mates.length * 0.3));
        g.funds += income; g.prestige += 1 + Math.floor(real / 2);
        for (const x of [n, ...mates]) { x.progress += 0.1; this.changeRel(x, 1); }
        this.ogNote(`${n.name}${mates.length ? ` 외 ${mates.length}명` : ''}이(가) ${label}을(를) 닫았다. 수입 ${fmt(income)}.`);
        if (real >= 4) this.rumor(`${g.name}이(가) ${label}을(를) 공략했다.`, { kind: 'guild', score: 1 });
      } else {
        const deathP = 0.12 * (1 - g.fac.clinic * 0.25) * (gate.variant === 'red' ? 2 : 1);
        for (const x of [n, ...mates]) {
          if (RNG.chance(deathP)) {
            this.killNpc(x, '게이트');
            this.ogNote(`${x.name}이(가) ${label}에서 돌아오지 못했다.`, 'bad');
            this.rumor(`${g.name} 길드원 ${x.name} 사망. 무리한 공략 방침이 도마에 올랐다.`, { kind: 'guild', score: 3 });
            g.prestige = Math.max(0, g.prestige - 4);
            for (const o of ms) if (o.alive && o !== x) this.changeRel(o, -4, `${x.name}의 죽음`);
            if (this.addOpinion) this.addOpinion(-1);
          } else { x.hurt = RNG.int(1, 3); }
        }
        this.ogNote(`${n.name}의 팀이 ${label} 공략에 실패했다.`, 'bad');
      }
    }
    // 이적·배신
    for (const n of ms) {
      if (!n.alive) continue;
      if (n.relation < 20 && RNG.chance(0.06)) {
        const to = RNG.pick(Object.keys(GUILDS).filter((x) => x !== 'kama'));
        g.members = g.members.filter((x) => x !== n.id); n.ogMember = false; n.guild = to;
        const betray = n.amb === 'power' && RNG.chance(0.4);
        if (betray) { const lost = Math.round(g.funds * 0.2); g.funds -= lost; this.ogNote(`${n.name}이(가) 금고에서 ${fmt(lost)} 크레딧을 들고 ${GUILDS[to].name}(으)로 넘어갔다.`, 'bad'); this.rumor(`${g.name}의 ${n.name}, 길드 자금을 빼돌려 ${GUILDS[to].name}행. 배신자 낙인.`, { kind: 'guild', score: 3 }); }
        else this.ogNote(`${n.name}이(가) ${GUILDS[to].name}의 스카우트 제의를 받아 떠났다.`, 'bad');
      }
    }
    // 대형 길드의 견제
    if (g.prestige > 60 && RNG.chance(0.05)) { g.prestige -= 5; this.rumor(`5대 길드가 ${g.name} 견제에 나섰다는 말이 돈다. 공략권 입찰에서 노골적으로 밀어낸다.`, { kind: 'guild', score: 2 }); }
    // 정보실: 음모 단서
    if (g.fac.intel && this.activePlots) for (const pl of this.activePlots()) if (RNG.chance(0.05 * g.fac.intel)) { const L = this.plotLeader(pl); if (L) { const keep = p.region; p.region = L.region; try { this.plotClueRoll(pl, 1); } finally { p.region = keep; } } break; }
  };
  wrap('worldMonthly', function (base) { base.call(this); this.ogMonthly(); });
  // 길드원이 아무 길드에나 무작위로 가입하는 일은 막는다 (스카우트는 세력의 수로만)
  wrap('simulateNpcs', function (base) {
    const ms = this.player && this.player.myGuild ? this.npcs.filter((n) => n.ogMember && !n.guild) : [];
    base.call(this);
    for (const n of ms) if (n.guild) n.guild = null;
  });
  // 내 길드원은 다른 공략팀에 끼지 않는다
  wrap('ecoPool', function (base, r) { return base.call(this, r).filter((n) => !n.ogMember); });

  GP.ogDisband = function () {
    const p = this.player; const g = p.myGuild; if (!g) return '';
    for (const n of this.ogMembers()) { n.ogMember = false; this.changeRel(n, -10, '길드가 해산됐다'); }
    p.money += g.funds; this.lifeEvent(`${g.name}을(를) 해산했다.`);
    this.rumor(`${g.name} 해산.`, { kind: 'guild', score: 2 });
    p.myGuild = null;
    return '길드를 해산했다. 금고에 남은 돈은 돌려받았다.';
  };
}

if (typeof UI !== 'undefined' && UI.guildHtml) {
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const html = baseGuild.call(this);
    const p = G.player; const g = p.myGuild;
    if (!g) {
      const why = G.ogCanFound();
      return html + `<div class="panel sec"><h3>길드 창설</h3><p class="small dim">실력·공식 등급 A급, 명성 150, 등록비 ${fmt(G.ogFoundCost())} 크레딧. 내 사람들을 모아 내 깃발을 올린다.</p>
        ${why ? `<div class="small bad">${why}</div>` : `<div class="cards">${OG_NAMES.slice(0, 4).map((nm) => `<button class="choice-btn" data-act="og-found" data-v="${nm}">${nm} 길드</button>`).join('')}</div>`}</div>`;
    }
    const ms = G.ogMembers();
    const max = Math.max(G.ogPower(), ...Object.keys(GUILDS).map((id) => G.guildPower ? G.guildPower(id) : 0));
    const fac = Object.entries(OG_FAC).map(([k, F]) => { const lv = g.fac[k]; return `<div class="item-row"><div class="grow"><b>${F.name}</b> <span class="small">${lv}단계</span><div class="small dim">${lv ? F.desc(lv) : '없음'}</div></div>${lv < F.max ? `<button class="sm" data-act="og-up" data-v="${k}">${FX.icon('coin', 13)} <span class="num">${fmt(F.cost[lv])}</span></button>` : ''}</div>`; }).join('');
    const mem = ms.map((n) => `<div class="item-row"><div class="grow"><b>${n.name}</b> ${this.rankTag(n.rankIdx, n.stage)} <span class="small dim">${regionById(n.region).name} · 월급 ${fmt(G.ogSalary(n))}${n.hurt > 0 ? ' · 부상' : ''} · 관계 ${n.relation}</span></div><button class="sm ghost" data-act="og-kick" data-v="${n.id}">내보내기</button></div>`).join('') || '<div class="dim small">길드원이 없다.</div>';
    const cands = G.ogCandidates().slice(0, 5).map((n) => `<div class="item-row"><div class="grow"><b>${n.name}</b> ${this.rankTag(n.rankIdx, n.stage)} <span class="small dim">${n.guild ? GUILDS[n.guild].name : '무소속'} · 관계 ${n.relation}</span></div><button class="sm" data-act="og-recruit" data-v="${n.id}">영입</button></div>`).join('') || '<div class="dim small">이 지역엔 영입할 만한 사람이 없다. (관계 40 이상 또는 제자)</div>';
    const pol = Object.entries(OG_POLICY).map(([k, v]) => `<button class="sm ${g.policy === k ? 'primary' : ''}" data-act="og-policy" data-v="${k}">${v.name}</button>`).join('');
    const log = g.log.slice(0, 5).map((l) => `<div class="l"><span class="d">${l.date}</span>${l.t}</div>`).join('');
    return html + `<div class="panel sec"><h3>${g.name}</h3>
      <div class="small">세력 <b class="num">${G.ogPower()}</b>${this.bar ? this.bar('ether', G.ogPower(), max) : ''} 금고 <b class="num">${fmt(g.funds)}</b> · 위세 ${g.prestige} · 길드원 ${ms.length}/${G.ogCap()}</div>
      <div class="row"><button class="sm" data-act="og-deposit">금고에 ${fmt(Math.min(p.money, 10000))} 넣기</button><button class="sm" data-act="og-withdraw">절반 꺼내기</button></div>
      <div class="sec-title sec">공략 방침</div><div class="row">${pol}</div><div class="small dim">안전: 길드원보다 낮은 게이트만 · 공격: 한 등급 위까지</div>
      <div class="sec-title sec">길드원</div><div class="cards">${mem}</div>
      <div class="sec-title sec">영입 후보 (이 지역)</div><div class="cards">${cands}</div>
      <div class="sec-title sec">시설</div><div class="cards">${fac}</div>
      ${log ? `<div class="sec-title sec">길드 일지</div><div class="logs">${log}</div>` : ''}
      <div class="row sec"><button class="sm danger" data-act="og-disband">해산</button></div></div>`;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'og-found': return this.after(G.ogFound(v));
      case 'og-recruit': return this.after(G.ogRecruit(+v));
      case 'og-kick': return this.after(G.ogKick(+v));
      case 'og-up': return this.after(G.ogUpgrade(v));
      case 'og-policy': G.player.myGuild.policy = v; return this.after(`공략 방침: ${OG_POLICY[v].name}`);
      case 'og-deposit': return this.after(G.ogDeposit(10000));
      case 'og-withdraw': return this.after(G.ogWithdraw());
      case 'og-disband': if (this._ogArm !== G.monthKey()) { this._ogArm = G.monthKey(); return this.after('정말 해산하려면 한 번 더 누른다.'); } this._ogArm = null; return this.after(G.ogDisband());
      default: return baseHandle.call(this, act, v);
    }
  };
}
