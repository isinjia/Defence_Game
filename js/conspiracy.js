// ===== 게이트 크로니클: 음모 (영역 C) =====
// docs/NPC_사회_제안.md 층 3. 음모 = 주모자·대상·종류·진행도·공모자·은밀도·기한.
// 종류 넷: 공략권 매수(bidRig), 게이트 방치(neglect), 암살(assassin), 길드 이적(defect).
// 매달 진행되고, 주변 NPC가 눈치채면 야망에 따라 폭로·협박·가담·침묵. 플레이어는 단서를 모아 끼어든다.
// 같은 음모의 소식은 thread 'plot:id'로 묶여 헤드라인에서 후속 보도로 보인다.

const PLOT_KINDS = {
  bidRig:   { name: '공략권 매수', speed: 22 },
  neglect:  { name: '게이트 방치', speed: 30 },
  assassin: { name: '암살', speed: 12 },
  defect:   { name: '길드 이적', speed: 10 },
};
const PLOT_MAX = 4;

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.plots ??= [];
    this.world.plotSeq ??= 1;
    this.player.plotClues ??= {};
  });

  GP.plotNews = function (pl, text, score = 0) { this.rumor(text, { thread: 'plot:' + pl.id, kind: 'plot', score }); };
  GP.plotLeader = function (pl) { const n = this.npcById(pl.leader); return n && n.alive ? n : null; };
  GP.activePlots = function () { return (this.world.plots || []).filter((p) => p.status === 'active'); };

  // ---------- 음모 시작 ----------
  GP.plotStart = function () {
    const w = this.world; const mk = this.monthKey();
    if (this.activePlots().length >= PLOT_MAX) return;
    const tryKinds = ['bidRig', 'neglect', 'assassin', 'defect'].sort(() => RNG.next() - 0.5);
    for (const kind of tryKinds) {
      const pl = this['plotSeed_' + kind]();
      if (!pl) continue;
      Object.assign(pl, { id: w.plotSeq++, kind, start: mk, progress: 0, accomplices: [], known: [], status: 'active', secrecy: pl.secrecy ?? 70 });
      w.plots.push(pl);
      return pl;
    }
    return null;
  };

  GP.plotSeed_bidRig = function () {
    const b = this.world.bid; if (!b || this.activePlots().some((p) => p.kind === 'bidRig')) return null;
    const ok = (L) => L && (L.personality === 'greedy' || L.personality === 'cold' || L.amb === 'power' || L.amb === 'wealth');
    const gid = RNG.pick(Object.keys(GUILDS).filter((id) => id !== 'kama' && this.factionLeader && ok(this.factionLeader(id))));
    if (!gid) return null;
    const L = this.factionLeader(gid);
    return { owner: gid, leader: L.id, target: { bid: b.region + ':' + b.tier }, deadline: b.until, secrecy: 60 };
  };
  GP.plotSeed_neglect = function () {
    const owner = RNG.pick(['cult', 'black']);
    const L = this.factionLeader ? this.factionLeader(owner) : null; if (!L) return null;
    const g = this.mapGates.find((x) => x.tier >= 3 && !x.final && !x.mission && !x.hold && !x.bid && x.region !== 'jeju' && this.monthKey() - x.born <= 1);
    if (!g) return null;
    g.hold = true;
    return { owner, leader: L.id, target: { gate: g.id, region: g.region, tier: g.tier }, deadline: g.deadline ?? this.monthKey() + 3, secrecy: 75 };
  };
  GP.plotSeed_assassin = function () {
    const cand = this.adults().filter((n) => n.nemesis && n.nemesis !== 'player' && !n.isCompanion && (n.amb === 'revenge' || n.personality === 'warlike' || n.personality === 'cold' || n.faction));
    const L = RNG.pick(cand); if (!L) return null;
    const t = this.npcById(L.nemesis); if (!t || !t.alive) return null;
    if (this.activePlots().some((p) => p.kind === 'assassin' && p.target.npc === t.id)) return null;
    return { owner: L.faction || L.guild || null, leader: L.id, target: { npc: t.id }, deadline: this.monthKey() + 10, secrecy: 80 };
  };
  GP.plotSeed_defect = function () {
    const cand = this.adults().filter((n) => n.guild && n.guild !== 'kama' && (n.amb === 'power' || (n.personality === 'greedy' && n.cash < 0)) && n.rankIdx >= 3 && !n.isCompanion);
    const L = RNG.pick(cand); if (!L) return null;
    const F = this.world.factions && this.world.factions[L.guild];
    const to = Object.keys(GUILDS).filter((g) => g !== L.guild && g !== 'kama').sort((a, b) => (this.guildPower ? this.guildPower(b) - this.guildPower(a) : 0))[0];
    if (!to || (F && (F.rel[to] || 0) > 30)) return null;
    return { owner: L.guild, leader: L.id, target: { guild: to }, deadline: this.monthKey() + 12, secrecy: 65 };
  };

  // ---------- 진행 ----------
  GP.plotRecruit = function (pl) {
    const L = this.plotLeader(pl); if (!L) return;
    const pool = this.adults().filter((n) => n !== L && n.region === L.region && !n.isCompanion && !pl.accomplices.includes(n.id) && !pl.known.includes(n.id));
    const n = RNG.pick(pool); if (!n) return;
    const p = { greedy: 0.45, cold: 0.3, warlike: 0.2, kind: 0.05, just: 0.01 }[n.personality] ?? 0.1;
    const bonus = (this.link ? Math.max(0, this.link(L, n)) / 200 : 0) + (n.cash < 0 ? 0.15 : 0) + (n.faction && n.faction === pl.owner ? 0.3 : 0);
    if (RNG.chance(p + bonus)) { pl.accomplices.push(n.id); pl.secrecy -= 4; n.cash = (n.cash || 0) + 200; }
    else if (n.personality === 'just' || n.amb === 'truth') this.plotDiscover(pl, n);
  };

  GP.plotDiscover = function (pl, n) {
    if (pl.known.includes(n.id) || pl.status !== 'active') return;
    pl.known.push(n.id);
    const L = this.plotLeader(pl);
    if (n.amb === 'truth' || n.personality === 'just' || n.amb === 'guard') return this.plotExpose(pl, n);
    if (n.amb === 'wealth' || n.personality === 'greedy') {
      if (L) { const v = Math.round(300 * RANKS[n.rankIdx].mult); L.cash -= v; n.cash = (n.cash || 0) + v; }
      if (RNG.chance(0.3)) this.plotNews(pl, `누군가 ${L ? L.name : '어떤 간부'}의 약점을 쥐고 돈을 뜯어낸다는 소문이 돈다.`, 0);
      return;
    }
    if (n.amb === 'power') { pl.accomplices.push(n.id); return; }
  };

  GP.plotTargetText = function (pl) {
    const t = pl.target;
    if (pl.kind === 'bidRig') { const [r, tier] = t.bid.split(':'); return `${regionById(r).name} ${RANKS[+tier].key}급 공략권`; }
    if (pl.kind === 'neglect') return `${regionById(t.region).name} ${RANKS[t.tier].key}급 게이트`;
    if (pl.kind === 'assassin') { const n = this.npcById(t.npc); return n ? n.name : '누군가'; }
    if (pl.kind === 'defect') return this.factionName ? this.factionName(t.guild) : t.guild;
    return '';
  };
  GP.plotOwnerText = function (pl) { return pl.owner && this.factionName ? this.factionName(pl.owner) : '누군가'; };

  GP.plotExpose = function (pl, by) {
    pl.status = 'exposed'; pl.end = this.monthKey();
    const L = this.plotLeader(pl); const who = by === 'player' ? this.player.name : by ? by.name : '익명의 제보자';
    const own = this.plotOwnerText(pl);
    const what = { bidRig: `${own}의 ${this.plotTargetText(pl)} 매수`, neglect: `${own}의 ${this.plotTargetText(pl)} 고의 방치`, assassin: `${L ? L.name : '누군가'}의 ${this.plotTargetText(pl)} 암살 계획`, defect: `${L ? L.name : '간부'}의 ${this.plotTargetText(pl)} 이적 공작` }[pl.kind];
    this.plotNews(pl, `속보: ${what}이(가) 폭로됐다. 제보자는 ${who}. 공모자 ${pl.accomplices.length}명이 조사를 받는다.`, 4);
    if (pl.owner && this.factionPrestige) this.factionPrestige(pl.owner, -12);
    if (pl.owner && this.factionRel) this.factionRel(pl.owner, 'kama', -15);
    if (L) { L.cash -= 1000; L.hurt = Math.max(L.hurt || 0, 2); if (pl.kind === 'defect' || pl.kind === 'bidRig') { if (L.guild === pl.owner && RNG.chance(0.6)) L.guild = null; } if (this.npcRemember) this.npcRemember(L, '음모가 들통났다'); }
    for (const id of pl.accomplices) { const n = this.npcById(id); if (n) { n.cash -= 300; if (n.faction === pl.owner && RNG.chance(0.5)) n.faction = null; } }
    if (pl.kind === 'neglect') { const g = this.mapGates.find((x) => x.id === pl.target.gate); if (g) g.hold = false; }
    if (pl.kind === 'bidRig' && this.world.bid && this.world.bid.rigged === pl.id) this.world.bid.rigged = null;
    if (by && by !== 'player') { by.renown = (by.renown || 0) + 15; if (L && this.addLink) this.addLink(L, by, -60); if (L) L.nemesis ??= by.id; }
  };

  GP.plotComplete = function (pl) {
    pl.status = 'done'; pl.end = this.monthKey();
    const L = this.plotLeader(pl); const own = this.plotOwnerText(pl);
    if (pl.kind === 'bidRig') {
      if (this.world.bid) this.world.bid.rigged = pl.id, this.world.bid.riggedBy = pl.owner;
    } else if (pl.kind === 'neglect') {
      const g = this.mapGates.find((x) => x.id === pl.target.gate);
      if (g) g.neglected = true; // 기한에 브레이크 확률 두 배
    } else if (pl.kind === 'assassin') {
      const t = this.npcById(pl.target.npc);
      if (t && t.alive && L) {
        const ok = RNG.chance(0.35 + (L.rankIdx - t.rankIdx) * 0.15 + pl.accomplices.length * 0.05);
        if (ok) { this.killNpc(t, '의문사', L); this.plotNews(pl, `${RANKS[t.rankIdx].key}급 ${t.name}이(가) ${regionById(t.region).name}에서 숨진 채 발견됐다. 관리국은 사인을 밝히지 않았다.`, 3); if (t.met) this.log(`${t.name}이(가) 의문사했다.`, 'bad'); }
        else { this.plotNews(pl, `${t.name}이(가) 습격을 받았지만 살아남았다. 범인은 달아났다.`, 2); t.nemesis ??= L.id; if (this.addLink) this.addLink(t, L, -40); }
      }
    } else if (pl.kind === 'defect' && L) {
      const from = L.guild; const to = pl.target.guild;
      const follow = pl.accomplices.map((id) => this.npcById(id)).filter((n) => n && n.alive && n.guild === from).slice(0, 2);
      L.guild = to; for (const n of follow) n.guild = to;
      if (this.factionPrestige) { this.factionPrestige(from, -10); this.factionPrestige(to, 6); }
      if (this.factionRel) this.factionRel(from, to, -30);
      this.plotNews(pl, `${this.factionName(from)} 간부 ${L.name}이(가) ${follow.length ? `${follow.length}명을 데리고 ` : ''}${this.factionName(to)}(으)로 넘어갔다. "배신자"라는 낙인이 붙었다.`, 3);
    }
  };

  GP.plotMonthly = function () {
    const mk = this.monthKey();
    const pace = this.storyPace ? this.storyPace() : 1;
    if (RNG.chance(0.12 * pace)) this.plotStart();
    for (const pl of this.activePlots()) {
      const L = this.plotLeader(pl);
      if (!L || L.retired) { pl.status = 'dropped'; if (pl.kind === 'neglect') { const g = this.mapGates.find((x) => x.id === pl.target.gate); if (g) g.hold = false; } continue; }
      if (pl.kind === 'assassin') { const t = this.npcById(pl.target.npc); if (!t || !t.alive) { pl.status = 'dropped'; continue; } }
      if (pl.kind === 'neglect' && !this.mapGates.some((x) => x.id === pl.target.gate)) { pl.status = 'dropped'; continue; }
      if (RNG.chance(0.35)) this.plotRecruit(pl);
      pl.progress += PLOT_KINDS[pl.kind].speed * RNG.range(0.6, 1.3) * pace + pl.accomplices.length * 3;
      // 주변의 눈
      const eyes = this.adults().filter((n) => n.region === L.region && n !== L && !pl.accomplices.includes(n.id) && !pl.known.includes(n.id) && (n.amb === 'truth' || n.personality === 'just' || n.personality === 'cold' || n.personality === 'greedy'));
      for (const n of eyes) if (RNG.chance((100 - pl.secrecy) / 2500 * (n.amb === 'truth' ? 3 : 1))) { this.plotDiscover(pl, n); if (pl.status !== 'active') break; }
      if (pl.status !== 'active') continue;
      // 플레이어 단서
      this.plotClueRoll(pl, 0.06);
      if (pl.progress >= 100) this.plotComplete(pl);
      else if (mk >= pl.deadline && pl.kind !== 'neglect') { pl.status = 'dropped'; }
    }
    // 오래된 음모 정리
    this.world.plots = this.world.plots.filter((p) => p.status === 'active' || mk - (p.end ?? p.start) <= 24).slice(-12);
  };

  // ---------- 플레이어 단서 ----------
  const CLUE_TEXT = {
    bidRig: (g, pl, L) => `${L.name}이(가) 관리국 입찰 담당자와 늦은 밤 고깃집에서 만나는 걸 본 사람이 있다.`,
    neglect: (g, pl) => `${g.plotTargetText(pl)} 근처에서 흰 로브를 입은 사람들이 협회 팀을 돌려보내는 걸 봤다는 말이 있다.`,
    assassin: (g, pl, L) => `${L.name}이(가) ${g.plotTargetText(pl)}의 동선을 묻고 다닌다는 이야기를 들었다.`,
    defect: (g, pl, L) => `${L.name}이(가) ${g.plotTargetText(pl)} 사람들과 자주 어울린다는 귓속말을 들었다.`,
  };
  GP.plotClueRoll = function (pl, chance) {
    const p = this.player; const L = this.plotLeader(pl); if (!L) return false;
    const near = p.region === L.region || (pl.target.region && p.region === pl.target.region);
    if (!near || !RNG.chance(chance)) return false;
    p.plotClues[pl.id] = (p.plotClues[pl.id] || 0) + 1;
    this.log(`단서: ${fixJosa(CLUE_TEXT[pl.kind](this, pl, L))}`, 'major');
    if (p.plotClues[pl.id] === 2) this.queue.push({ type: 'plot', id: pl.id });
    return true;
  };

  // 포차에서 한잔하면 귓속말을 듣기 쉽다
  wrap('drink', function (base, id) {
    const r = base.call(this, id);
    if (typeof r === 'string' && !r.includes('부족') && !r.includes('이미')) for (const pl of this.activePlots()) if (this.plotClueRoll(pl, 0.35)) break;
    return r;
  });

  // 플레이어의 선택
  GP.plotAct = function (id, how) {
    const pl = (this.world.plots || []).find((x) => x.id === id && x.status === 'active');
    if (!pl) return '이미 끝난 일이다.';
    const p = this.player; const L = this.plotLeader(pl);
    if (how === 'expose') {
      this.plotExpose(pl, 'player');
      p.merit = (p.merit || 0) + 30; p.fame += 10;
      if (L) { L.relation = Math.min(L.relation, -50); if (L.met !== false) L.met = true; if (this.npcRemember) this.npcRemember(L, '당신이 음모를 폭로했다', -50); if (RNG.chance(0.4)) L.nemesis = 'player'; }
      return `관리국에 증거를 넘겼다. 협회 공적 +30, 명성 +10. ${L ? `${L.name}이(가) 이를 갈 것이다.` : ''}`;
    }
    if (how === 'blackmail') {
      const v = Math.round(400 * RANKS[L ? L.rankIdx : 3].mult);
      p.money += v; pl.known.push(-1);
      if (L) { L.met = true; this.changeRel(L, -30, '당신에게 협박당했다'); L.cash -= v; }
      if (this.addSin) this.addSin(2, '협박');
      return `입을 다무는 대가로 ${fmt(v)} 크레딧을 받았다. 음모는 계속된다.`;
    }
    if (how === 'join') {
      const v = Math.round(250 * RANKS[L ? L.rankIdx : 3].mult);
      p.money += v; pl.accomplices.push(-1); pl.progress += 25;
      if (L) { L.met = true; this.changeRel(L, 25, '음모에 가담했다'); }
      if (this.addSin) this.addSin(3, '음모 가담');
      return `${L ? L.name : '그들'}과(와) 손을 잡았다. 수고비 ${fmt(v)} 크레딧. 들키면 함께 무너진다.`;
    }
    return '모른 척하기로 했다.';
  };
}

if (typeof UI !== 'undefined') {
  UI.showPlot = function (id) {
    const pl = (G.world.plots || []).find((x) => x.id === id && x.status === 'active');
    if (!pl) return this.processQueue();
    const L = G.plotLeader(pl);
    this.modal(`<div class="eyebrow">음모의 냄새</div><h3>${PLOT_KINDS[pl.kind].name}</h3>
      <p class="event-text">단서가 맞아떨어진다. ${G.plotOwnerText(pl)}${L ? `의 ${L.name}` : ''}이(가) ${G.plotTargetText(pl)}을(를) 두고 뭔가를 꾸미고 있다. 어떻게 할까?</p>
      <div class="cards">
        <button class="choice-btn" data-act="plot-act" data-v="${pl.id}:expose">관리국에 폭로한다 <span class="small dim">공적·명성, 원한</span></button>
        <button class="choice-btn" data-act="plot-act" data-v="${pl.id}:blackmail">약점을 쥐고 돈을 받는다 <span class="small dim">돈, 악명</span></button>
        <button class="choice-btn" data-act="plot-act" data-v="${pl.id}:join">한몫 끼어든다 <span class="small dim">돈·관계, 들키면 위험</span></button>
        <button class="choice-btn" data-act="plot-act" data-v="${pl.id}:ignore">모른 척한다</button>
      </div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'plot') { G.queue.shift(); return this.showPlot(q.id); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'plot-act') { const [id, how] = String(v).split(':'); this.closeModal(); return this.after(G.plotAct(+id, how)); }
    return baseHandle.call(this, act, v);
  };
}

// ---------- 다른 시스템과 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('worldMonthly', function (base) {
    // 매수된 입찰: 결과 직전에 주모 길드 점수를 크게 올린다
    const b = this.world.bid; const mk = this.monthKey();
    let rig = null;
    if (b && b.rigged && mk >= b.until && b.riggedBy && this.world.guildPrestige) { rig = b.riggedBy; this.world.guildPrestige[rig] += 60; }
    base.call(this);
    if (rig) this.world.guildPrestige[rig] -= 60;
    this.plotMonthly();
  });
  // 방치된 게이트는 공략 시도 없음, 기한에 더 잘 터진다
  wrap('ecoEligible', function (base, g) { return base.call(this, g) && !g.hold; });
  wrap('ecoExpire', function (base, g) {
    const act = (this.world.plots || []).find((p) => p.kind === 'neglect' && p.status === 'active' && p.target.gate === g.id);
    if (act) { g.neglected = true; act.status = 'done'; act.end = this.monthKey(); }
    const before = (this.world.breaks || []).length;
    base.call(this, g);
    const pl = (this.world.plots || []).find((p) => p.kind === 'neglect' && p.target.gate === g.id);
    if (pl && this.world.breaks.length > before) {
      const b = this.world.breaks[this.world.breaks.length - 1]; b.blame = this.plotOwnerText(pl);
      this.plotNews(pl, `${regionById(g.region).name} 브레이크 뒤에 ${this.plotOwnerText(pl)}이(가) 있었다는 의혹이 제기됐다.`, 2);
    }
  });
}
