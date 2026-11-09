// ===== 게이트 크로니클: 샌드박스 확장 =====
// 도시 시설, 돌파 재료, 유물, 의뢰, NPC 사회 시뮬레이션, 세계 사건.
// Game.prototype 에 기능을 덧붙인다.

const RANK_KEYS = RANKS.map((r) => r.key);
const coreName = (t) => `${RANKS[t].key}급 코어`;
const relicById = (id) => RELICS.find((r) => r.id === id);

Object.assign(Game.prototype, {
  // ---------- 초기화 / 이전 저장 호환 ----------
  initSandbox() {
    const p = this.player;
    p.merit ??= 0; p.rep ??= {}; p.mats ??= {}; p.relics ??= []; p.relicBonus ??= {};
    p.buffs ??= []; p.visited ??= [p.region]; p.quests ??= []; p.disciples ??= [];
    p.partner ??= null; p.spouse ??= null; p.master ??= null; p.lifeEvents ??= [];
    p.tavern ??= {};
    p.cls ??= 'swordsman'; p.clsAdv ??= 0; p.party ??= [];
    if (p.companion) { if (!p.party.includes(p.companion)) p.party.push(p.companion); p.companion = null; }
    this.world ??= { breaks: [], boards: {}, auctions: {}, lastTournament: 0, archives: {} };
    this.flags.chains ??= {}; this.flags.chainAt ??= {}; this.flags.seen ??= {}; this.flags.story ??= {};
    for (const n of this.npcs) { n.links ??= {}; n.disciples ??= []; n.parents ??= []; n.cls ??= rollClass(); n.race ??= 'human'; }
  },

  // ---------- 용병 사무소 ----------
  mercsFor(regionId) {
    const key = this.monthKey(); this.world.mercs ??= {};
    let m = this.world.mercs[regionId];
    if (!m || m.key !== key) {
      const list = [];
      const pr = this.player.rankIdx;
      const groups = Object.keys(CLASS_GROUPS).filter((g) => g !== 'hidden').sort(() => Math.random() - 0.5).slice(0, 4);
      for (let i = 0; i < 4; i++) {
        const n = this.makeNpc(false);
        const pool = CLASSES.filter((c) => c.g === groups[i] && c.r < 3); n.cls = RNG.pick(pool).id;
        n.rankIdx = Math.max(0, Math.min(7, pr + RNG.int(-1, 0))); n.stage = RNG.int(0, 2);
        n.ageMonths = (22 + n.rankIdx * 4 + RNG.int(0, 10)) * 12; n.region = regionId; n.hireable = true; n.personality = RNG.pick(['kind', 'greedy', 'cold', 'just']);
        list.push(n);
      }
      m = this.world.mercs[regionId] = { key, list };
    }
    return m.list;
  },
  mercFee(n) { return Math.round(180 * RANKS[n.rankIdx].mult ** 1.6 * (classById(n.cls).r + 1) ** 0.5); },
  hireMerc(regionId, idx) {
    const p = this.player; const list = this.mercsFor(regionId); const n = list[idx];
    if (!n || n.hired) return '';
    if (this.party().length >= 4) return '파티는 최대 5명이다.';
    const fee = this.mercFee(n);
    if (p.money < fee) return '크레딧이 부족하다.';
    p.money -= fee; n.hired = true; n.hireable = false;
    n.met = true; n.relation = 10; n.isCompanion = true; n.merc = { until: this.monthKey() + 3 };
    n.links ??= {}; n.disciples ??= []; n.parents ??= [];
    this.npcs.push(n); p.party.push(n.id);
    return `${n.name}(${className(n.cls)})을(를) 3개월 계약으로 고용했다.`;
  },
  expireMercs() {
    const mk = this.monthKey();
    for (const n of this.party()) {
      if (n.merc && mk >= n.merc.until) {
        if (n.relation >= 40) { n.merc = null; this.log(`계약이 끝났지만 ${n.name}은(는) 남기로 했다. "돈 때문만은 아니었으니까."`, 'good'); }
        else { this.dismiss(n.id); this.log(`${n.name}의 용병 계약이 끝났다.`); }
      }
    }
  },
  // 쓰러진 파티원은 낮은 확률로 목숨을 잃는다
  partyCasualties(units) {
    const lost = [];
    for (const u of units) {
      if (!u.npcId || u.alive) continue;
      const n = this.npcById(u.npcId);
      if (u.fled) { if (n) { this.changeRel(n, -6); this.log(`${n.name}은(는) 전투 중 달아났다. 서로 어색해졌다.`, 'bad'); } continue; }
      if (n && RNG.chance(0.08)) { this.killNpc(n, '전투 중 전사'); lost.push(n.name); this.lifeEvent(`동료 ${n.name}이(가) 전투에서 쓰러져 돌아오지 못했다.`); }
    }
    return lost;
  },

  lifeEvent(text) {
    this.player.lifeEvents.push({ date: this.dateStr(), age: this.ageYears(), text: fixJosa(text) });
    this.log(text, 'major');
  },

  // ---------- 능력치 보정: 목표, 유물, 일시 버프 ----------
  extraMod(key) {
    const p = this.player;
    let v = 0;
    if (p.relicBonus && p.relicBonus[key]) v += p.relicBonus[key];
    const mk = this.monthKey();
    for (const b of p.buffs || []) if (b.stat === key && b.until >= mk) v += b.val;
    if (key !== 'life' && p.spouse && this.npcById(p.spouse) && this.npcById(p.spouse).alive && ['atk', 'def', 'hp'].includes(key)) v += 0.04;
    if (key === 'train' && p.master && this.npcById(p.master) && this.npcById(p.master).alive) v += 0.1;
    return v;
  },

  // ---------- 재료와 유물 ----------
  addCore(tier, n = 1) { const p = this.player; p.mats['c' + tier] = (p.mats['c' + tier] || 0) + n; },
  coreCount(tier) { return this.player.mats['c' + tier] || 0; },
  addRelic(id, grade) {
    const r = id ? relicById(id) : RNG.pick(RELICS);
    const g = grade ?? RNG.weighted([0, 1, 2, 3], [50, 32, 14, 4]);
    this.player.relics.push({ id: r.id, grade: g, uid: Math.random().toString(36).slice(2, 9) });
    return `${RARITY[g].name} 유물 [${r.name}]`;
  },
  relicLabel(rl) { const r = relicById(rl.id); return `${r.name} (${RARITY[rl.grade].name})`; },
  relicValue(rl) { const r = relicById(rl.id); return r.val * RARITY[rl.grade].mult; },
  catalystKey() { return 'cat' + this.player.rankIdx; },
  hasCatalyst() { return (this.player.items[this.catalystKey()] || 0) > 0; },
  relicSlots() { return 1 + Math.floor(this.player.rankIdx / 2); },

  // 괴수 처치 보상: 코어, 낮은 확률로 유물
  lootFromKills(kills, boss) {
    const lines = [];
    let cores = {};
    for (const k of kills) {
      const n = k.boss ? 2 : RNG.chance(0.7) ? 1 : 0;
      if (n) { this.addCore(k.tier, n); cores[k.tier] = (cores[k.tier] || 0) + n; }
    }
    const txt = Object.entries(cores).map(([t, n]) => `${coreName(+t)} ${n}개`).join(', ');
    if (txt) lines.push(`괴수 코어: ${txt}`);
    if (boss && RNG.chance(0.3 + this.player.luck / 400)) lines.push(`유물 발견: ${this.addRelic()}`);
    return lines;
  },

  // ---------- 돌파 (촉매 필수, 유물 선택) ----------
  breakthroughWith(relicUids) {
    const p = this.player;
    if (!this.canBreakthrough() || !this.hasCatalyst()) return null;
    const used = p.relics.filter((r) => relicUids.includes(r.uid)).slice(0, this.relicSlots());
    p.items[this.catalystKey()]--;
    const res = this.breakthrough();
    if (!res) return null;
    if (res.ok && used.length) {
      const gains = [];
      for (const rl of used) {
        const r = relicById(rl.id); const v = this.relicValue(rl);
        p.relicBonus[r.stat] = (p.relicBonus[r.stat] || 0) + v;
        gains.push(`${r.desc} +${r.stat === 'life' ? Math.round(v) + '년' : Math.round(v * 100) + '%'}`);
      }
      p.relics = p.relics.filter((r) => !used.includes(r));
      this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
      res.msg += ` 유물의 힘이 깃들었다: ${gains.join(', ')}`;
    }
    if (res.ok) this.lifeEvent(`${RANKS[p.rankIdx].name}에 올랐다.`);
    return res;
  },

  // ---------- 도시 평판, 협회 공적 ----------
  rep(regionId) { return this.player.rep[regionId] || 0; },
  addRep(regionId, n) { this.player.rep[regionId] = Math.max(-100, Math.min(300, this.rep(regionId) + n)); },
  repLabel(v) { return v >= 200 ? '도시의 영웅' : v >= 100 ? '존경받는 헌터' : v >= 40 ? '믿을 만한 헌터' : v >= 10 ? '아는 얼굴' : v <= -20 ? '경계 대상' : '외지인'; },
  cityPriceMul(regionId) { return Math.max(0.7, 1 - this.rep(regionId) / 1000); },

  // ---------- 캡슐 호텔 ----------
  innCost() { return Math.round(30 * RANKS[this.player.rankIdx].mult); },
  stayInn() {
    const p = this.player; const c = this.innCost();
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.hp = p.maxHp; p.mp = p.maxMp;
    if (p.injured > 0) p.injured = Math.max(0, p.injured - 1);
    this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
    this.advanceDays(5, { eventChance: 0.1 });
    return `캡슐 호텔에서 푹 쉬었다. 몸이 가볍다. (${fmt(c)} 크레딧, 5일)`;
  },

  // ---------- 포차 ----------
  drink(id) {
    const p = this.player; const d = DRINKS.find((x) => x.id === id); const city = this.region().id;
    const price = Math.round(d.price * RANKS[p.rankIdx].mult ** 0.5);
    if (p.money < price) return '크레딧이 부족하다.';
    if (d.effect === 'social') {
      if (p.tavern[city] === this.monthKey()) return '이번 달엔 이미 이 도시 사람들과 한잔했다.';
      p.tavern[city] = this.monthKey();
      p.money -= price;
      const here = this.npcsHere();
      for (const n of here) { n.met = true; this.changeRel(n, this.relGain(n, 4)); }
      this.addRep(city, 2);
      return `포차에 모인 ${here.length}명과 잔을 부딪쳤다. 다들 조금 가까워졌다.`;
    }
    p.money -= price;
    p.buffs = p.buffs.filter((b) => b.stat !== d.buff.stat);
    p.buffs.push({ stat: d.buff.stat, val: d.buff.val, until: this.monthKey() + d.buff.months - 1, name: d.name });
    this.recalc();
    return `${d.name}을(를) 마셨다. ${d.desc}`;
  },
  drinkPrice(d) { return Math.round(d.price * RANKS[this.player.rankIdx].mult ** 0.5); },

  // ---------- 공방 ----------
  recipeTier(rc) { return rc.tier === 'rank' ? this.player.rankIdx : rc.tier; },
  recipeCost(rc) { return Math.round(rc.credits * (rc.tier === 'rank' ? RANKS[this.player.rankIdx].mult ** 2 : 1)); },
  craft(id) {
    const p = this.player; const rc = RECIPES.find((r) => r.id === id);
    const tier = this.recipeTier(rc); const cost = this.recipeCost(rc);
    // 높은 등급 코어로 낮은 등급 재료를 대신할 수 있다
    let have = 0; for (let t = tier; t < RANKS.length; t++) have += this.coreCount(t);
    if (have < rc.cores) return `${coreName(tier)} 이상이 ${rc.cores}개 필요하다.`;
    if (p.money < cost) return '크레딧이 부족하다.';
    let need = rc.cores;
    for (let t = tier; t < RANKS.length && need > 0; t++) { const u = Math.min(need, this.coreCount(t)); p.mats['c' + t] -= u; need -= u; }
    p.money -= cost;
    const key = rc.out === 'catalyst' ? 'cat' + tier : rc.out;
    p.items[key] = (p.items[key] || 0) + rc.n;
    return `${rc.out === 'catalyst' ? `${RANKS[tier].key}급 ` : ''}${rc.name} ${rc.n}개를 만들었다.`;
  },

  // ---------- 헌터 마켓: 큰 도시는 각성 촉매 판매 ----------
  catalystPrice() { return Math.round(900 * RANKS[this.player.rankIdx].mult ** 2.2); },
  buyCatalyst() {
    const p = this.player; const c = Math.round(this.catalystPrice() * this.priceMul());
    if (!BIG_CITIES.includes(this.region().id)) return '';
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.items[this.catalystKey()] = (p.items[this.catalystKey()] || 0) + 1;
    return `${RANKS[p.rankIdx].key}급 각성 촉매를 구했다.`;
  },
  sellCores(tier) {
    const n = this.coreCount(tier); if (!n) return '';
    const v = Math.round(18 * RANKS[tier].mult ** 1.6) * n;
    this.player.mats['c' + tier] = 0; this.player.money += v;
    return `${coreName(tier)} ${n}개를 ${fmt(v)} 크레딧에 넘겼다.`;
  },

  // ---------- 스킬 아카이브 ----------
  archiveSkills() {
    const reg = this.region(); const key = this.year;
    let a = this.world.archives[reg.id];
    if (!a || a.key !== key) {
      const [, hi] = GATE_RANGES[reg.danger];
      let pool = SKILLS.filter((s) => s.price > 0 && s.rankReq <= Math.min(7, hi + 1));
      const guildElem = reg.guild ? GUILDS[reg.guild].elem : null;
      const pick = [];
      while (pick.length < (reg.id === 'daejeon' ? 6 : 4) && pool.length) {
        let s = guildElem && RNG.chance(0.4) ? pool.find((x) => x.elem === guildElem) : null;
        if (!s) s = RNG.pick(pool);
        pick.push(s.id); pool = pool.filter((x) => x !== s);
      }
      a = this.world.archives[reg.id] = { key, skills: pick };
    }
    return a.skills;
  },
  skillMerit(sk) { return Math.round(sk.price / 25); },
  skillRepReq(sk) { return sk.rankReq >= 4 ? 60 : sk.rankReq >= 2 ? 25 : 0; },
  learnFromArchive(id) {
    const p = this.player; const sk = skillById(id); const reg = this.region();
    if (p.skills.includes(id)) return '이미 습득한 스킬이다.';
    if (sk.rankReq > p.rankIdx) return `${RANKS[sk.rankReq].key}급 이상만 익힐 수 있다.`;
    if (this.rep(reg.id) < this.skillRepReq(sk)) return `이 도시 평판이 ${this.skillRepReq(sk)} 이상이어야 열람할 수 있다.`;
    const price = Math.round(sk.price * this.priceMul() * this.cityPriceMul(reg.id)); const merit = this.skillMerit(sk);
    if (p.money < price) return '크레딧이 부족하다.';
    if (p.merit < merit) return `협회 공적이 ${merit} 필요하다.`;
    p.money -= price; p.merit -= merit; p.skills.push(id);
    if (p.equipSkills.length < 4) p.equipSkills.push(id);
    this.log(`스킬 데이터 [${sk.name}]을(를) 내려받았다.`, 'good');
    return `[${sk.name}] 습득 완료.`;
  },

  // ---------- 고속 이동망 ----------
  transitCost(regionId) { return Math.round(60 * regionDist(this.player.region, regionId) * RANKS[this.player.rankIdx].mult ** 0.5); },
  transit(regionId) {
    const p = this.player;
    if (regionId === 'jeju' && !this.canJeju()) return '제주는 S급 이상만 출입할 수 있다.';
    if (!p.visited.includes(regionId)) return '가 본 적 없는 도시다.';
    const c = this.transitCost(regionId);
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c;
    [p.x, p.y] = WORLD.cityPos[regionId];
    p.region = regionId; this.reveal(p.x, p.y, 5);
    this.syncParty();
    this.advanceDays(2, { eventChance: 0.05 });
    return `고속 이동망으로 ${regionById(regionId).name}에 도착했다.`;
  },
  visitCity(regionId) {
    const p = this.player;
    if (!p.visited.includes(regionId)) { p.visited.push(regionId); this.log(`${regionById(regionId).name}에 처음 발을 들였다.`); }
  },

  // ---------- 협회 의뢰소 ----------
  board(regionId) {
    const key = this.monthKey();
    let b = this.world.boards[regionId];
    if (!b || b.key !== key) { b = this.world.boards[regionId] = { key, list: this.makeBounties(regionId) }; }
    return b.list;
  },
  makeBounties(regionId) {
    const key = this.monthKey();
    const reg = regionById(regionId); const [lo, hi] = GATE_RANGES[reg.danger];
    const pr = this.player.rankIdx;
    const out = [];
    const types = ['hunt', 'gate', 'deliver', 'courier', 'wanted'];
    for (let i = 0; i < 4; i++) {
      const type = RNG.pick(types);
      const tier = Math.max(0, Math.min(7, RNG.int(Math.max(lo, pr - 1), Math.max(lo, Math.min(hi, pr + 1)))));
      const m = RANKS[tier].mult;
      const q = { id: `${key}-${regionId}-${i}`, type, region: regionId, tier, from: regionId, months: RNG.int(3, 6) };
      if (type === 'hunt') { q.n = RNG.int(3, 6); q.title = `${reg.name} 일대 ${RANKS[tier].key}급 이상 괴수 ${q.n}마리 토벌`; }
      if (type === 'gate') { q.n = 1; q.title = `${reg.name}의 ${RANKS[tier].key}급 이상 게이트 공략`; }
      if (type === 'deliver') { q.n = RNG.int(2, 5); q.title = `${coreName(tier)} ${q.n}개 납품`; }
      if (type === 'courier') {
        const dest = RNG.pick(REGIONS.filter((r) => r.id !== regionId && r.id !== 'jeju' && regionDist(r.id, regionId) <= 3));
        q.dest = dest.id; q.title = `${dest.name}까지 봉인 화물 운송`;
      }
      if (type === 'wanted') {
        const targets = this.npcs.filter((n) => n.alive && !n.child && !n.isCompanion && n.region !== 'jeju' && Math.abs(n.rankIdx - pr) <= 1 && persById(n.personality).hostile > 0);
        if (!targets.length) { i--; continue; }
        const t = RNG.pick(targets); q.target = t.id; q.tier = t.rankIdx;
        q.title = `현상수배: ${t.name} (${RANKS[t.rankIdx].key}급) 처치`;
      }
      const base = { hunt: 50, gate: 140, deliver: 40, courier: 70, wanted: 220 }[type] * (q.n || 1) ** 0.6;
      q.money = Math.round(base * m * RNG.range(0.85, 1.2));
      q.merit = Math.round({ hunt: 6, gate: 12, deliver: 4, courier: 6, wanted: 18 }[type] * (1 + tier * 0.5));
      q.repGain = { hunt: 6, gate: 10, deliver: 4, courier: 5, wanted: 12 }[type];
      out.push(q);
    }
    return out;
  },
  acceptBounty(qid) {
    const p = this.player; const q = this.board(this.region().id).find((x) => x.id === qid);
    if (!q || q.taken) return '';
    if (p.quests.filter((x) => x.kind === 'bounty' && x.status !== 'claimed').length >= 4) return '의뢰는 동시에 4개까지만 받을 수 있다.';
    q.taken = true;
    const t = { ...q, kind: 'bounty', progress: 0, status: 'active', deadline: this.monthKey() + q.months };
    if (q.type === 'deliver') t.status = 'turnin';
    p.quests.push(t);
    return `의뢰 수락: ${q.title}`;
  },
  claimBounty(qid) {
    const p = this.player; const q = p.quests.find((x) => x.id === qid);
    if (!q) return '';
    if (q.type === 'deliver') {
      if (this.coreCount(q.tier) < q.n) return `${coreName(q.tier)}가 ${q.n}개 필요하다.`;
      p.mats['c' + q.tier] -= q.n;
    } else if (q.status !== 'done') return '아직 완료하지 못했다.';
    if (q.from !== this.region().id || !this.onCity()) return `${regionById(q.from).name} 의뢰소에 보고해야 한다.`;
    return this.payBounty(q);
  },
  payBounty(q) {
    const p = this.player;
    p.money += q.money; p.merit += q.merit; this.addRep(q.from, q.repGain);
    q.status = 'claimed';
    p.quests = p.quests.filter((x) => x !== q);
    p.fame += 1;
    return `의뢰 완료: ${q.title}. ${fmt(q.money)} 크레딧, 협회 공적 +${q.merit}, ${regionById(q.from).name} 평판 +${q.repGain}`;
  },
  // 진행도 갱신
  questEvent(kind, data) {
    const p = this.player;
    for (const q of p.quests) {
      if (q.status !== 'active') continue;
      if (kind === 'kill' && q.type === 'hunt' && data.region === q.region && data.tier >= q.tier) { q.progress += data.n; if (q.progress >= q.n) q.status = 'done'; }
      if (kind === 'gate' && (q.type === 'gate' || q.type === 'npc_gate') && data.region === q.region && data.tier >= q.tier) { q.progress = 1; q.status = 'done'; }
      if (kind === 'npckill' && q.target === data.id) { q.status = 'done'; }
      if (kind === 'arrive' && q.type === 'courier' && q.dest === data.region) { q.status = 'done'; this.queue.push({ type: 'toast', text: this.payBounty(q) }); }
    }
    for (const q of p.quests) if (q.status === 'done' && q.kind === 'bounty' && q.type !== 'courier') q.notified ||= (this.log(`의뢰 달성: ${q.title}. ${regionById(q.from).name} 의뢰소에 보고하자.`, 'good'), true);
    // NPC 부탁은 즉시 보상
    for (const q of [...p.quests]) if (q.kind === 'npc' && q.status === 'done') this.finishNpcQuest(q);
  },
  expireQuests() {
    const p = this.player; const mk = this.monthKey();
    for (const q of [...p.quests]) {
      if (q.deadline && mk > q.deadline && q.status !== 'done') {
        p.quests = p.quests.filter((x) => x !== q);
        if (q.kind === 'bounty') { this.addRep(q.from, -5); this.log(`의뢰 기한 초과: ${q.title}`, 'bad'); }
        if (q.kind === 'npc') { const n = this.npcById(q.npc); if (n) this.changeRel(n, -12); this.log(`${n ? n.name : '누군가'}의 부탁을 지키지 못했다.`, 'bad'); }
      }
    }
  },

  // ---------- 경매장 ----------
  auctionOpen() { return BIG_CITIES.includes(this.region().id) && this.month === SAGA.auctionMonth; },
  auctionLots() {
    const id = this.region().id; const key = this.year;
    let a = this.world.auctions[id];
    if (!a || a.key !== key) {
      const lots = [];
      for (let i = 0; i < 2; i++) { const r = RNG.pick(RELICS); const g = RNG.weighted([1, 2, 3], [50, 35, 15]); lots.push({ kind: 'relic', id: r.id, grade: g, base: Math.round(1500 * RARITY[g].mult ** 2 * RANKS[Math.max(1, this.player.rankIdx)].mult) }); }
      const tier = Math.min(7, this.player.rankIdx + 1);
      lots.push({ kind: 'equip', item: this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), tier, 3), base: 0 });
      lots[2].base = Math.round(lots[2].item.value * 1.2);
      lots.forEach((l, i) => { l.uid = `${key}-${id}-${i}`; l.max = Math.round(l.base * RNG.range(0.85, 1.9)); l.done = false; });
      a = this.world.auctions[id] = { key, lots };
    }
    return a.lots;
  },
  bid(uid, mult) {
    const p = this.player; const lot = this.auctionLots().find((l) => l.uid === uid);
    if (!lot || lot.done) return '';
    const amount = Math.round(lot.base * mult);
    if (p.money < amount) return '크레딧이 부족하다.';
    lot.done = true;
    if (amount >= lot.max) {
      p.money -= amount;
      if (lot.kind === 'relic') { this.addRelic(lot.id, lot.grade); return `낙찰! ${RARITY[lot.grade].name} 유물 [${relicById(lot.id).name}]을(를) ${fmt(amount)} 크레딧에 손에 넣었다.`; }
      p.inventory.push(lot.item); return `낙찰! ${lot.item.name}을(를) ${fmt(amount)} 크레딧에 손에 넣었다.`;
    }
    const rival = RNG.pick(this.npcs.filter((n) => n.alive && !n.child && n.rankIdx >= p.rankIdx)) || { name: '익명의 입찰자' };
    return `${rival.name}이(가) ${fmt(lot.max)} 크레딧을 불러 가져갔다.`;
  },

  // ---------- NPC 사회 시뮬레이션 ----------
  link(a, b) { return (a.links && a.links[b.id]) || 0; },
  addLink(a, b, d) { a.links[b.id] = Math.max(-100, Math.min(100, this.link(a, b) + d)); b.links[a.id] = Math.max(-100, Math.min(100, this.link(b, a) + d)); },
  adults() { return this.npcs.filter((n) => n.alive && !n.child); },
  simulateSociety() {
    const alive = this.adults();
    const notable = (...ns) => ns.some((n) => n.met || n.rankIdx >= 4);
    // 아이들 성장
    for (const n of this.npcs) if (n.alive && n.child && n.ageMonths >= 18 * 12) {
      n.child = false;
      const par = n.parents.map((id) => this.npcById(id)).filter(Boolean);
      if (par.some((x) => x.met) || par.some((x) => x.id === -1)) this.rumor(`${par.map((x) => x.name).join('와(과) ')}의 자녀 ${n.name}이(가) 각성자로 등록됐다.`);
    }
    for (let k = 0; k < 40; k++) {
      const a = RNG.pick(alive); if (!a) break;
      const others = alive.filter((o) => o !== a && o.region === a.region);
      if (!others.length) continue;
      // 이미 아는 사이와 더 자주 어울린다
      const known = others.filter((o) => Math.abs(this.link(a, o)) >= 10);
      const b = known.length && RNG.chance(0.65) ? RNG.pick(known) : RNG.pick(others);
      const pa = persById(a.personality), pb = persById(b.personality);
      const cur = this.link(a, b);
      const drift = cur >= 20 ? 3 : cur <= -20 ? -3 : 0; // 좋은 사이는 더 좋아지고, 나쁜 사이는 더 나빠진다
      const d = Math.round(RNG.int(-4, 11) * (pa.relGain + pb.relGain) / 2 - (pa.hostile + pb.hostile) * 8 + drift);
      this.addLink(a, b, d);
      const L = this.link(a, b);
      const single = (x) => !x.partner && !x.spouse;
      const ageOk = Math.abs(a.ageMonths - b.ageMonths) < 15 * 12;
      if (L >= 60 && single(a) && single(b) && ageOk && RNG.chance(0.25)) {
        a.partner = b.id; b.partner = a.id;
        if (notable(a, b)) this.rumor(`${a.name}와(과) ${b.name}이(가) 연인 사이라는 목격담이 올라왔다.`);
      } else if (a.partner === b.id && L >= 80 && !a.spouse && RNG.chance(0.1)) {
        a.spouse = b.id; b.spouse = a.id;
        if (notable(a, b)) this.rumor(`${a.name}와(과) ${b.name}이(가) 결혼식을 올렸다. 하객 명단에 S급이 둘이나 있었다는 소문이다.`);
        if (a.met && a.relation >= 30) this.queue.push({ type: 'story', id: 'npc_wedding', npc: a.id });
      } else if (a.spouse === b.id && a.ageMonths < 45 * 12 && RNG.chance(0.04)) {
        const c = this.makeNpc(true, RNG.chance(0.5) ? a.race : b.race); c.ageMonths = 0; c.child = true; c.parents = [a.id, b.id]; c.region = a.region;
        if (c.race === 'human' && a.race === 'human') c.name = a.name[0] + c.name.slice(1); c.lifespan += 2;
        this.npcs.push(c);
        if (notable(a, b)) this.rumor(`${a.name}·${b.name} 부부가 아이를 얻었다. 이름은 ${c.name}.`);
      } else if (Math.abs(a.rankIdx - b.rankIdx) >= 2 && L >= 40 && RNG.chance(0.12)) {
        const [m, s] = a.rankIdx > b.rankIdx ? [a, b] : [b, a];
        if (!s.master && m.disciples.length < 3) { s.master = m.id; m.disciples.push(s.id); if (notable(m, s)) this.rumor(`${m.name}이(가) ${s.name}을(를) 제자로 받아들였다.`); }
      } else if (L <= -45 && (pa.id === 'warlike' || pb.id === 'warlike') && RNG.chance(0.15)) {
        const pa2 = a.rankIdx + a.stage * 0.3 + RNG.range(-1, 1), pb2 = b.rankIdx + b.stage * 0.3 + RNG.range(-1, 1);
        const [win, lose] = pa2 >= pb2 ? [a, b] : [b, a];
        if (lose.isCompanion) continue;
        this.killNpc(lose, `${win.name}와(과)의 결투`, win);
        if (notable(win, lose)) this.rumor(`${win.name}와(과) ${lose.name}의 오랜 악연이 결투로 끝났다. ${lose.name}은(는) 돌아오지 못했다.`);
      } else if (a.partner === b.id && L < 20 && RNG.chance(0.3)) {
        a.partner = null; b.partner = null; if (a.spouse === b.id) { a.spouse = null; b.spouse = null; }
        if (notable(a, b)) this.rumor(`${a.name}와(과) ${b.name}이(가) 갈라섰다는 이야기가 돈다.`);
      }
    }
  },

  // 죽음이 남기는 원한
  avenge(victim, killer) {
    const close = this.adults().filter((n) => n !== victim && (n.spouse === victim.id || n.partner === victim.id || victim.parents.includes(n.id) || n.parents.includes(victim.id) || n.master === victim.id || victim.master === n.id || this.link(n, victim) >= 55));
    for (const n of close) {
      if (killer === 'player') {
        n.met = true; n.relation = Math.min(n.relation, -80); n.nemesis = 'player';
        if (n.isCompanion) { n.isCompanion = false; this.player.companion = null; }
        if (this.player.partner === n.id) this.player.partner = null;
        this.queue.push({ type: 'story', id: 'vow_revenge', npc: n.id, victim: victim.id });
      } else if (killer) {
        this.addLink(n, killer, -70); n.nemesis = killer.id;
      }
    }
  },

  // ---------- 세계 사건 ----------
  worldMonthly() {
    const mk = this.monthKey(); const p = this.player;
    // 게이트 브레이크
    for (const b of [...this.world.breaks]) {
      if (mk > b.until) {
        this.world.breaks = this.world.breaks.filter((x) => x !== b);
        const victims = this.adults().filter((n) => n.region === b.city && !n.isCompanion && RNG.chance(0.18));
        for (const v of victims) this.killNpc(v, '게이트 브레이크');
        this.rumor(`${regionById(b.city).name}의 게이트 브레이크가 수습됐다. 희생자 ${victims.length}명.`);
        if (victims.some((v) => v.met)) this.log(`${regionById(b.city).name} 게이트 브레이크로 아는 얼굴이 희생됐다.`, 'bad');
      }
    }
    if (RNG.chance(0.035) && this.world.breaks.length < 2) {
      const reg = RNG.pick(REGIONS.filter((r) => r.danger >= 2 && r.id !== 'jeju' && !this.world.breaks.some((b) => b.city === r.id)));
      if (reg) {
        this.world.breaks.push({ city: reg.id, until: mk + 2, tier: Math.min(7, GATE_RANGES[reg.danger][1]) });
        this.rumor(`긴급: ${reg.name}에서 게이트 브레이크 발생! 협회가 각성자를 소집하고 있다.`);
        this.log(`${reg.name}에서 게이트 브레이크가 발생했다.`, 'major');
      }
    }
    // 헌터 대회
    if (this.month === SAGA.tournamentMonth && this.year % SAGA.tournamentEvery === 0 && this.world.lastTournament !== this.year) {
      this.world.lastTournament = this.year;
      if (p.region === SAGA.tournamentCity) this.queue.push({ type: 'tournament' });
      else {
        const champ = this.adults().sort((a, b) => b.rankIdx - a.rankIdx || b.stage - a.stage)[RNG.int(0, 4)];
        if (champ) { this.rumor(`${this.year}년 전국 헌터 대회 우승자는 ${champ.name}. 명성이 하늘을 찌른다.`); champ.met = champ.met; }
      }
    }
    if (this.month === SAGA.tournamentMonth - 1 && this.year % SAGA.tournamentEvery === 0) this.rumor(`다음 달 ${regionById(SAGA.tournamentCity).name}에서 전국 헌터 대회가 열린다.`);
    if (this.month === SAGA.auctionMonth - 1) this.rumor('다음 달 강남·부산·대구 경매장에서 정기 경매가 열린다.');
    // 버프 만료, 용병 계약
    p.buffs = p.buffs.filter((b) => b.until >= mk);
    this.expireMercs();
    this.expireQuests();
  },
  cityBreak(regionId) { return this.world.breaks.find((b) => b.city === regionId); },
  breakGate(regionId) {
    const b = this.cityBreak(regionId); if (!b) return null;
    return { id: 'break-' + regionId, kind: 'gate', tier: b.tier, theme: '게이트 브레이크 방어전', elem: RNG.pick(ELEMENT_KEYS), region: regionId, breakCity: regionId, x: this.player.x, y: this.player.y };
  },
  resolveBreak(regionId) {
    this.world.breaks = this.world.breaks.filter((b) => b.city !== regionId);
    const p = this.player;
    p.merit += 40; p.fame += 15; this.addRep(regionId, 40);
    this.lifeEvent(`${regionById(regionId).name} 게이트 브레이크를 막아 냈다.`);
    this.rumor(`${p.name}이(가) ${regionById(regionId).name}의 게이트 브레이크를 막았다. 시민들이 이름을 연호한다.`);
    return '도시를 지켜 냈다. 협회 공적 +40, 명성 +15, 도시 평판 +40';
  },

});
