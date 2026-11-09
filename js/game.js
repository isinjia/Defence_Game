// ===== 게이트 크로니클: 게임 로직 =====

const RNG = {
  next: () => Math.random(),
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
  range: (a, b) => a + Math.random() * (b - a),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  weighted(items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; }
    return items[items.length - 1];
  },
};

const SAVE_KEY = 'gate_chronicle_save_v2';

function rankLabel(r, s) { return `${RANKS[r].key}급 ${STAGE_NAMES[s]}`; }
function stageReq(r, s) { return Math.floor(60 * RANKS[r].mult ** 2.5 * (1 + s * 0.25)); }
function statMult(r, s) { return RANKS[r].mult * (1 + 0.15 * s); }
function regionById(id) { return REGIONS.find((r) => r.id === id); }
function regionDist(a, b) { const A = regionById(a), B = regionById(b); return Math.abs(A.x - B.x) + Math.abs(A.y - B.y); }
function skillById(id) { return SKILLS.find((s) => s.id === id); }
function traitById(id) { return TRAITS.find((t) => t.id === id); }
function persById(id) { return PERSONALITIES.find((p) => p.id === id); }
function relationLabel(v) {
  if (v <= -50) return '원수';
  if (v <= -20) return '적대';
  if (v < 10) return '무관심';
  if (v < 30) return '지인';
  if (v < 60) return '친구';
  return '절친';
}
// 한국어 조사 자동 보정: "이(가)" → 받침에 따라 "이"/"가"
function fixJosa(text) {
  return String(text).replace(/([가-힣])(이\(가\)|은\(는\)|을\(를\)|와\(과\)|\(으\)로)/g, (m, ch, j) => {
    const jong = (ch.charCodeAt(0) - 0xac00) % 28;
    const has = jong !== 0;
    const map = { '이(가)': has ? '이' : '가', '은(는)': has ? '은' : '는', '을(를)': has ? '을' : '를', '와(과)': has ? '과' : '와', '(으)로': has && jong !== 8 ? '으로' : '로' };
    return ch + map[j];
  });
}
function fmt(n) { return Math.floor(n).toLocaleString('ko-KR'); }

class Game {
  constructor() { this.rng = RNG; this.queue = []; }

  // ---------- 시작 / 저장 ----------
  newGame(opts) {
    const bg = BACKGROUNDS.find((b) => b.id === opts.bg);
    this.year = 2087; this.month = 3; this.day = 1;
    this.mobs = []; this.mapGates = []; this.nextObjId = 1;
    this.fog = new Uint8Array(WORLD.COLS * WORLD.ROWS);
    this.logs = []; this.rumors = [];
    this.shops = {}; this.gates = {};
    this.flags = { won: false };
    this.over = null;
    this.queue = [];
    this.npcs = []; this.nextNpcId = 1;

    let talent = opts.talent + (bg.talent || 0);
    for (const t of opts.traits) talent += traitById(t).mods.talent || 0;
    const startSkill = SKILLS.find((s) => s.elem === opts.element && s.rankReq === 0);

    this.player = {
      name: opts.name, gender: opts.gender, bg: bg.id, element: opts.element, look: opts.look || opts.name,
      license: `${this.year}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      traits: opts.traits.slice(), talent: Math.max(1, talent),
      rankIdx: 0, stage: 0, ether: 0,
      ageMonths: 19 * 12, lifePenalty: 0, lifeBonus: 0,
      money: bg.money, fame: bg.fame || 0, region: bg.region,
      guild: null, guildRank: 0, contrib: 0,
      skills: ['strike', startSkill.id], equipSkills: [startSkill.id],
      cls: opts.cls || 'swordsman', clsAdv: 0, party: [],
      equip: { weapon: null, armor: null, acc: null },
      inventory: [], items: { potion: 3, mana: 2 },
      btBonus: 0, companion: null, injured: 0,
      record: { gates: 0, kills: 0, npcKills: 0, breakthroughs: 0, fails: 0 },
      hp: 1, mp: 1,
    };
    [this.player.x, this.player.y] = WORLD.cityPos[this.player.region];
    this.reveal(this.player.x, this.player.y, 6);
    this.player.equip.weapon = this.makeEquipment('weapon', 0, 0);
    this.player.equip.armor = this.makeEquipment('armor', 0, 0);
    this.player.awakenRank = opts.awakenRank ?? rollAwakenRank(0);
    this.grantClassSkills();
    this.initSandbox();
    this.recalc();
    this.player.hp = this.player.maxHp; this.player.mp = this.player.maxMp;

    for (let i = 0; i < 55; i++) this.npcs.push(this.makeNpc(false));
    for (let i = 0; i < 3; i++) this.spawnMonthly();
    for (const n of this.npcs) { n.links ??= {}; n.disciples ??= []; n.parents ??= []; }
    // 처음 몇 년치 인간관계를 미리 굴려 세계에 사연을 만든다
    for (let i = 0; i < 24; i++) this.simulateSociety();
    // 은퇴를 앞둔 노인 헌터들 (에테르 덕에 일반인보다 오래 산다)
    for (const n of this.npcs.filter((x) => !x.child && RNG.chance(0.13))) {
      const age = RNG.int(62, 84);
      n.ageMonths = age * 12 + RNG.int(0, 11); n.lifespan = Math.max(n.lifespan, age + RNG.int(3, 14));
    }
    // 부부에게 이미 자란 아이들
    for (const a of this.adults().filter((x) => x.spouse && x.id < x.spouse)) {
      if (!RNG.chance(0.55)) continue;
      const b = this.npcById(a.spouse); if (!b) continue;
      const c = this.makeNpc(true, RNG.chance(0.5) ? a.race : b.race); c.child = true; c.parents = [a.id, b.id]; c.region = a.region;
      c.ageMonths = RNG.int(0, 16) * 12 + RNG.int(0, 11); if (c.race === 'human' && a.race === 'human') c.name = a.name[0] + c.name.slice(1);
      this.npcs.push(c);
    }
    // 홀로 아이를 키우는 헌터들
    for (const a of this.adults().filter((x) => x.ageMonths >= 26 * 12 && x.ageMonths <= 55 * 12 && !x.spouse)) {
      if (!RNG.chance(0.14)) continue;
      const c = this.makeNpc(true, a.race); c.child = true; c.parents = [a.id]; c.region = a.region;
      c.ageMonths = RNG.int(0, 15) * 12 + RNG.int(0, 11); if (c.race === 'human') c.name = a.name[0] + c.name.slice(1);
      this.npcs.push(c);
    }
    this.rumors = [];
    this.lifeEvent(`${regionById(this.player.region).name}에서 각성했다.`);
    this.log(`${this.dateStr()}, ${this.player.name}은(는) ${regionById(this.player.region).name}에서 각성했다.`, 'major');
    this.log('20년 전 "대붕괴" 이후 한반도 곳곳에 게이트가 열렸다. 살아남아, 강해져라.');
  }

  save() {
    if (this.over) { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ } return; }
    const data = {
      year: this.year, month: this.month, player: this.player, npcs: this.npcs, nextNpcId: this.nextNpcId,
      logs: this.logs, rumors: this.rumors, shops: this.shops, flags: this.flags,
      day: this.day, mobs: this.mobs, mapGates: this.mapGates, nextObjId: this.nextObjId, world: this.world,
      fog: Array.from(this.fog).join(''),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* 저장 실패 무시 */ }
  }
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  load() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { data = null; }
    if (!data) return false;
    if (data.player.x == null) return false; // 지도 도입 전 저장 데이터
    Object.assign(this, data);
    this.fog = Uint8Array.from(String(data.fog || ''), (c) => (c === '1' ? 1 : 0));
    if (this.fog.length !== WORLD.COLS * WORLD.ROWS) this.fog = new Uint8Array(WORLD.COLS * WORLD.ROWS);
    this.over = null; this.queue = [];
    this.initSandbox();
    this.recalc();
    return true;
  }

  // ---------- 기본 계산 ----------
  mod(key) {
    const p = this.player;
    let v = 0;
    for (const t of p.traits) v += traitById(t).mods[key] || 0;
    const bg = BACKGROUNDS.find((b) => b.id === p.bg);
    v += bg.mods[key] || 0;
    if (p.relicBonus) v += this.extraMod(key);
    if (p.cls) v += this.classMod(p.cls, p.clsAdv || 0, key);
    return v;
  }

  recalc() {
    const p = this.player;
    const m = statMult(p.rankIdx, p.stage);
    let hp = 100 * m * (1 + this.mod('hp'));
    let mp = 50 * m * (1 + this.mod('mp'));
    let atk = 20 * m * (1 + this.mod('atk'));
    let def = 8 * m * (1 + this.mod('def'));
    let spd = 10 * Math.sqrt(m) * (1 + this.mod('spd'));
    let luck = 10 * (1 + this.mod('luck'));
    for (const slot of ['weapon', 'armor', 'acc']) {
      const e = p.equip[slot];
      if (!e) continue;
      hp += e.hp || 0; mp += e.mp || 0; atk += e.atk || 0; def += e.def || 0; spd += e.spd || 0; luck += e.luck || 0;
    }
    if (p.injured > 0) { atk *= 0.8; def *= 0.8; }
    Object.assign(p, {
      maxHp: Math.round(hp), maxMp: Math.round(mp), atk: Math.round(atk), def: Math.round(def),
      spd: Math.round(spd), luck: Math.round(luck),
    });
    p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp);
  }

  classMod(cls, adv, key) {
    const c = classById(cls);
    let v = (c.mods[key] || 0) * (1 + 0.3 * adv);
    if (['hp', 'atk', 'def', 'mp'].includes(key)) v += 0.06 * adv;
    return v;
  }
  // 등급에 맞는 직업 스킬을 자동으로 익힌다
  grantClassSkills() {
    const p = this.player; const got = [];
    for (const sk of SKILLS) {
      if (sk.cls !== p.cls || sk.rankReq > p.rankIdx || p.skills.includes(sk.id)) continue;
      p.skills.push(sk.id); got.push(sk.name);
      if (p.equipSkills.length < 5) p.equipSkills.push(sk.id);
    }
    return got;
  }
  setClass(cls, why) {
    const p = this.player; const old = className(p.cls, p.clsAdv);
    p.skills = p.skills.filter((id) => !(skillById(id) || {}).cls);
    p.equipSkills = p.equipSkills.filter((id) => !(skillById(id) || {}).cls);
    p.cls = cls;
    const got = this.grantClassSkills();
    this.recalc();
    this.lifeEvent(`${why || '각성'}: 직업이 [${old}]에서 [${className(cls, p.clsAdv)}](으)로 바뀌었다.`);
    return got;
  }
  maxLife() {
    const p = this.player;
    return BASE_LIFESPAN + RANKS[p.rankIdx].life + this.mod('life') + p.lifeBonus - p.lifePenalty;
  }
  ageYears() { return Math.floor(this.player.ageMonths / 12); }
  dateStr() { return `${this.year}년 ${this.month}월`; }
  fullDate() { return `${this.year}년 ${this.month}월 ${this.day}일`; }
  monthKey() { return this.year * 12 + this.month; }
  region() { return regionById(this.player.region); }

  log(text, type = '') {
    this.logs.unshift({ date: this.dateStr(), text: fixJosa(text), type });
    if (this.logs.length > 120) this.logs.length = 120;
  }
  rumor(text) {
    this.rumors.unshift({ date: this.dateStr(), text: fixJosa(text) });
    if (this.rumors.length > 80) this.rumors.length = 80;
  }

  // ---------- 수련 / 돌파 ----------
  trainGain(mult = 1) {
    const p = this.player;
    let g = 15 * RANKS[p.rankIdx].mult * this.region().ether * (1 + p.talent * 0.08) * (1 + this.mod('train'));
    if (p.guild === 'cheongryong') g *= 1.15;
    if (p.injured > 0) g *= 0.5;
    if (this.onEther()) g *= 1.4;
    return Math.max(1, Math.floor(g * mult * RNG.range(0.85, 1.15)));
  }

  addEther(n) {
    const p = this.player;
    p.ether += n;
    while (p.stage < 2 && p.ether >= stageReq(p.rankIdx, p.stage)) {
      p.ether -= stageReq(p.rankIdx, p.stage);
      p.stage++;
      this.recalc();
      p.hp = p.maxHp; p.mp = p.maxMp;
      this.log(`경지가 올랐다: ${rankLabel(p.rankIdx, p.stage)}`, 'good');
    }
    if (p.stage === 2) p.ether = Math.min(p.ether, stageReq(p.rankIdx, 2));
  }

  // 이벤트·아이템용: 등급에 비례한 에테르 지급
  etherGift(base) {
    const v = Math.round(base * RANKS[this.player.rankIdx].mult ** 1.5);
    this.addEther(v);
    return v;
  }

  canBreakthrough() {
    const p = this.player;
    return p.rankIdx < RANKS.length - 1 && p.stage === 2 && p.ether >= stageReq(p.rankIdx, 2);
  }
  btChance() {
    const p = this.player;
    let c = 75 - p.rankIdx * 8 + (p.luck - 10) * 0.5 + this.mod('breakthrough') + p.btBonus;
    if (p.injured > 0) c -= 20;
    return Math.max(5, Math.min(95, Math.round(c)));
  }

  train() {
    if (!this.canAct()) return;
    const g = this.trainGain();
    this.addEther(g);
    this.log(`${this.region().name}${this.onEther() ? '의 에테르 농축 지대' : ''}에서 한 달간 수련했다. 에테르 +${fmt(g)}`);
    this.advanceMonth(1, { eventChance: 0.22 });
  }

  rest() {
    if (!this.canAct()) return;
    const p = this.player;
    p.hp = p.maxHp; p.mp = p.maxMp;
    if (p.injured > 0) p.injured = Math.max(0, p.injured - 2);
    this.recalc();
    this.log('한 달간 휴식하며 몸을 회복했다.');
    this.advanceMonth(1, { eventChance: 0.15, noRegen: true });
  }

  breakthrough() {
    if (!this.canBreakthrough() || !this.canAct()) return null;
    const p = this.player;
    const chance = this.btChance();
    const ok = RNG.int(1, 100) <= chance;
    let msg;
    if (ok) {
      p.rankIdx++; p.stage = 0; p.ether = 0; p.btBonus = 0;
      p.record.breakthroughs++;
      p.fame += 5 * p.rankIdx;
      this.recalc();
      p.hp = p.maxHp; p.mp = p.maxMp;
      msg = `돌파 성공! ${RANKS[p.rankIdx].name}이 되었다. 수명이 늘어났다.`;
      const learned = this.grantClassSkills();
      if (learned.length) msg += ` 새 직업 스킬: ${learned.join(', ')}.`;
      if ((p.rankIdx >= 3 && p.clsAdv < 1) || (p.rankIdx >= 6 && p.clsAdv < 2)) this.queue.push({ type: 'story', id: 'class_advance' });
      this.log(msg, 'major');
      if (p.rankIdx >= 4) this.rumor(`신예 ${p.name}이(가) ${RANKS[p.rankIdx].name}에 올랐다는 소식에 업계가 술렁인다.`);
    } else {
      p.ether = Math.floor(p.ether * 0.5);
      p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
      p.lifePenalty += 1;
      p.btBonus = 5;
      p.record.fails++;
      msg = '돌파 실패... 에테르가 역류해 내상을 입었다. (에테르 절반 손실, 수명 -1) 하지만 깨달음을 얻었다. (다음 돌파 +5%)';
      this.log(msg, 'bad');
    }
    this.advanceMonth(1, { eventChance: 0 });
    return { ok, msg, chance };
  }

  canAct() { return !this.over; }

  // ---------- 지도 이동 ----------
  onEther() { return WORLD.type(this.player.x, this.player.y) === WORLD.T.ETHER; }
  onCity() { return WORLD.cityAt(this.player.x, this.player.y); }
  canJeju() { return this.player.rankIdx >= 6; }
  moveRange() { return Math.min(9, 5 + Math.floor(this.player.spd / 12)); }
  reveal(x, y, r) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r || !WORLD.inb(x + dx, y + dy)) continue;
      this.fog[WORLD.idx(x + dx, y + dy)] = 1;
    }
  }
  revealed(x, y) { return this.fog[WORLD.idx(x, y)] === 1; }
  objAt(x, y) {
    return this.mapGates.find((g) => g.x === x && g.y === y) || this.mobs.find((m) => m.x === x && m.y === y) || null;
  }
  // path: 타일 인덱스 배열 (시작 포함), cost: 이동 비용
  moveAlong(path, cost) {
    if (!this.canAct() || !path || path.length < 2) return 0;
    const p = this.player;
    for (const i of path) { const [x, y] = WORLD.xy(i); this.reveal(x, y, 3); }
    [p.x, p.y] = WORLD.xy(path[path.length - 1]);
    const reg = WORLD.regionAt(p.x, p.y);
    if (reg && reg.id !== p.region) {
      p.region = reg.id;
      this.log(`${reg.name}에 들어섰다.`);
    }
    const city = this.onCity();
    if (city) { this.reveal(p.x, p.y, 5); this.visitCity(city.id); this.questEvent('arrive', { region: city.id }); }
    this.syncParty();
    const days = WORLD.daysFor(cost);
    this.advanceDays(days, { eventChance: 0.3 });
    return days;
  }
  advanceDays(n, opts = {}) {
    this.day += n;
    while (this.day > 30 && !this.over) {
      this.day -= 30;
      this.advanceMonth(1, { ...opts, noSave: opts.noSave });
    }
    if (!opts.noSave) this.save();
  }

  // 지도에서 한 칸 걷기. 시간이 흐르고, 길 위에서 일이 생기면 stop 을 돌려준다.
  walkStep(x, y, diag) {
    const p = this.player;
    const t = WORLD.type(x, y);
    const days = Math.max(1, Math.round(WORLD.T_COST[t] * (diag ? 1.4 : 1) * WORLD.DAYS_PER_COST));
    p.x = x; p.y = y;
    this.reveal(x, y, 3);
    const reg = WORLD.regionAt(x, y);
    if (reg && reg.id !== p.region) { p.region = reg.id; this.log(`${reg.name}에 들어섰다.`); }
    this.syncParty();
    const city = this.onCity();
    if (city) { this.reveal(x, y, 5); this.visitCity(city.id); this.questEvent('arrive', { region: city.id }); }
    const before = this.queue.length;
    this.advanceDays(days, { eventChance: 0.3, noSave: true });
    if (this.over) return { stop: true, days };
    let stop = this.queue.length > before || !!city;
    if (!city && !stop) {
      // 노상 사건
      if (RNG.chance(0.03)) { const ev = this.pickStory('road') || this.pickStory('month'); if (ev) { this.queue.push(ev); stop = true; } }
      // 근처 괴수 무리의 기습
      const mob = !stop && this.mobs.find((m) => Math.max(Math.abs(m.x - x), Math.abs(m.y - y)) === 1);
      if (mob && RNG.chance(Math.max(0.12, 0.3 + (mob.tier - p.rankIdx) * 0.1))) { this.queue.push({ type: 'mobAmbush', mobId: mob.id }); stop = true; }
    }
    if (this.objAt(x, y)) stop = true;
    return { stop, days, city };
  }

  // 매달 지도 위 게이트와 괴수 무리 갱신
  randomFreeTile(regionId) {
    const pool = WORLD.regionTiles[regionId];
    if (!pool || !pool.length) return null;
    for (let k = 0; k < 20; k++) {
      const [x, y] = WORLD.xy(RNG.pick(pool));
      if (this.objAt(x, y) || (this.player && this.player.x === x && this.player.y === y)) continue;
      return [x, y];
    }
    return null;
  }
  spawnMonthly() {
    const key = this.monthKey();
    this.mapGates = this.mapGates.filter((g) => g.final || g.mission || key - g.born < 4);
    this.mobs = this.mobs.filter((m) => key - m.born < 5);
    for (const reg of REGIONS) {
      const [lo, hi] = GATE_RANGES[reg.danger];
      const gCount = this.mapGates.filter((g) => g.region === reg.id && !g.final && !g.mission).length;
      if (gCount < 2 && RNG.chance(0.35 + reg.danger * 0.1)) {
        const pos = this.randomFreeTile(reg.id);
        if (pos) this.mapGates.push({ id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: reg.id, tier: RNG.int(lo, hi), theme: RNG.pick(GATE_THEMES), elem: pickElem(), born: key });
      }
      const cap = 2 + Math.floor(reg.danger / 2);
      const mCount = this.mobs.filter((m) => m.region === reg.id).length;
      for (let k = mCount; k < cap; k++) {
        if (!RNG.chance(0.55)) continue;
        const pos = this.randomFreeTile(reg.id); if (!pos) continue;
        const tier = Math.max(0, RNG.int(lo - 1, hi - 1));
        const tpl = RNG.pick(MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1));
        this.mobs.push({ id: this.nextObjId++, kind: 'mob', x: pos[0], y: pos[1], region: reg.id, tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: RNG.int(1, 3), born: key });
      }
    }
    // 길드 임무 게이트
    const p = this.player;
    if (p && p.guild && !this.mapGates.some((g) => g.mission)) {
      const home = REGIONS.find((r) => r.guild === p.guild);
      const pos = this.randomFreeTile(home.id);
      if (pos) this.mapGates.push({ id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: home.id, tier: Math.max(0, Math.min(7, p.rankIdx + RNG.int(-1, 0))), theme: '길드 지정 게이트', elem: GUILDS[p.guild].elem, born: key, mission: true });
    }
    if (p && !p.guild) this.mapGates = this.mapGates.filter((g) => !g.mission);
    // 원초의 게이트 (한라산)
    if (!this.flags.won && !this.mapGates.some((g) => g.final)) {
      const jt = WORLD.regionTiles.jeju.map(WORLD.xy).find(([x, y]) => WORLD.type(x, y) === WORLD.T.MOUNTAIN) || WORLD.xy(WORLD.regionTiles.jeju[0]);
      this.mapGates.push({ id: this.nextObjId++, kind: 'gate', x: jt[0], y: jt[1], region: 'jeju', tier: 7, theme: '원초의 게이트', elem: 'dark', born: key, final: true });
    }
  }
  mobRoom(mob) {
    const list = [];
    for (let k = 0; k < mob.count; k++) {
      const m = this.makeMonster(mob.tier, false, mob.elem);
      if (k === 0) { const tpl = MONSTERS.find((t) => t.name === mob.name); if (tpl) { m.name = tpl.name; m.shape = tpl.shape; m.elem = tpl.elem; } }
      list.push(m);
    }
    return this.scaleForParty(list, mob.tier);
  }
  finishMob(mob, result, kills, hpLeft, mpLeft) {
    const p = this.player;
    p.hp = Math.max(1, hpLeft); p.mp = Math.max(0, mpLeft);
    if (result === 'lose') {
      const lost = Math.floor(p.money * 0.15);
      p.money -= lost; p.lifePenalty += 1; p.injured = 2;
      this.recalc(); p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
      this.log(`${mob.name} 무리에게 패배했다.`, 'bad');
      this.advanceDays(20, { noRegen: true });
      return [`간신히 목숨을 건졌다. 치료비 ${fmt(lost)} 크레딧, 수명 -1년, 부상 2개월.`];
    }
    if (result !== 'win') return ['무리에게서 물러났다.'];
    let money = 0, ether = 0;
    for (const k of kills) { const r = this.monsterReward(k); money += r.money; ether += r.ether; }
    p.money += money; this.addEther(ether); p.record.kills += kills.length;
    this.mobs = this.mobs.filter((m) => m !== mob && m.id !== mob.id);
    const lines = [`토벌 보상: ${fmt(money)} 크레딧, 에테르 ${fmt(ether)}`, ...this.lootFromKills(kills, false)];
    this.questEvent('kill', { region: mob.region, tier: mob.tier, n: kills.length });
    if (RNG.chance(0.15)) { const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), mob.tier); p.inventory.push(it); lines.push(`전리품: ${it.name}`); }
    this.log(`${mob.name} 무리를 토벌했다.`, 'good');
    this.save();
    return lines;
  }

  // ---------- 시간 ----------
  advanceMonth(n = 1, opts = {}) {
    const p = this.player;
    for (let i = 0; i < n && !this.over; i++) {
      this.month++;
      if (this.month > 12) { this.month = 1; this.year++; }
      p.ageMonths++;
      if (p.injured > 0) { p.injured--; if (p.injured === 0) { this.recalc(); this.log('부상이 완치되었다.', 'good'); } }
      if (!opts.noRegen) {
        p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.2));
        p.mp = Math.min(p.maxMp, p.mp + Math.floor(p.maxMp * 0.3));
      }
      if (p.guild) {
        const sal = Math.floor(40 * RANKS[p.official ?? p.rankIdx].mult * (1 + p.guildRank));
        p.money += sal;
      }
      this.simulateNpcs();
      this.spawnMonthly();
      this.simulateSociety();
      this.worldMonthly();
      this.storyMonthly();
      if (this.ageYears() >= this.maxLife()) {
        this.gameOver(`${this.ageYears()}세, 수명이 다해 눈을 감았다.`);
        return;
      }
      if (this.month === 1) this.log(`${this.year}년이 밝았다. ${this.ageYears()}세.`, 'major');
    }
    if (this.over) return;
    // 매복 체크
    const enemies = this.npcsHere().filter((n) => n.relation <= -30 && !n.isCompanion);
    for (const e of enemies) {
      if (RNG.chance(0.12 + persById(e.personality).hostile)) { this.queue.push({ type: 'ambush', npcId: e.id }); break; }
    }
    if (opts.eventChance && RNG.chance(opts.eventChance)) {
      const ev = this.pickStory();
      if (ev) this.queue.push(ev);
    }
    if (!opts.noSave) this.save();
  }

  gameOver(reason) {
    reason = fixJosa(reason);
    this.over = { reason, date: this.dateStr() };
    this.log(reason, 'bad');
    this.queue = [{ type: 'gameover' }];
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* 무시 */ }
  }

  // ---------- NPC ----------
  makeNpc(young, race) {
    const gender = RNG.chance(0.5) ? 'M' : 'F';
    race = race || rollRace();
    const name = race === 'human' ? RNG.pick(SURNAMES) + RNG.pick(gender === 'M' ? GIVEN_M : GIVEN_F) : RNG.pick(RACES[race].names[gender]);
    const rankIdx = young ? RNG.weighted([0, 1], [80, 20]) : RNG.weighted([0, 1, 2, 3, 4, 5, 6], [26, 24, 18, 13, 10, 6, 3]);
    const raceLife = { elf: 35, dwarf: 15, dragonkin: 25, orc: -5, beastkin: -5 }[race] || 0;
    const lifespan = BASE_LIFESPAN + RANKS[rankIdx].life + raceLife + RNG.int(-8, 8);
    let ageYears = young ? RNG.int(18, 22) : Math.min(lifespan - 3, 19 + rankIdx * 5 + RNG.int(0, 15));
    const guildIds = Object.keys(GUILDS);
    return {
      id: this.nextNpcId++, name, gender, ageMonths: ageYears * 12 + RNG.int(0, 11), lifespan,
      rankIdx, stage: RNG.int(0, 2), progress: RNG.next(),
      element: pickElem(), personality: RNG.pick(PERSONALITIES).id,
      region: RNG.pick(REGIONS.filter((r) => r.id !== 'jeju' || rankIdx >= 6)).id,
      relation: 0, alive: true, talent: RNG.int(2, 9),
      guild: rankIdx >= 1 && RNG.chance(0.35) ? RNG.pick(guildIds) : null,
      lastTalk: -1, lastSpar: -1, met: false, isCompanion: false, death: null,
      links: {}, disciples: [], parents: [], partner: null, spouse: null, master: null, child: false,
      cls: race !== 'human' && RACES[race].groups.length && RNG.chance(0.6) ? RNG.pick(CLASSES.filter((c) => RACES[race].groups.includes(c.g) && c.r < 3)).id : rollClass(),
      race,
    };
  }

  npcById(id) { return this.npcs.find((n) => n.id === id); }
  npcsHere() { return this.npcs.filter((n) => n.alive && !n.child && n.region === this.player.region); }
  party() { const p = this.player; return (p.party || []).map((id) => this.npcById(id)).filter((n) => n && n.alive); }
  companion() { return this.party()[0] || null; }
  partySize() { return 1 + this.party().length; }
  syncParty() { for (const n of this.party()) n.region = this.player.region; }
  npcRankLabel(n) { return rankLabel(n.rankIdx, n.stage); }

  killNpc(n, cause, killer) {
    n.alive = false; n.death = { date: this.dateStr(), cause };
    if (n.isCompanion) { n.isCompanion = false; if (this.player) this.player.party = (this.player.party || []).filter((x) => x !== n.id); }
    const p = this.player;
    if (p && p.partner === n.id) { p.partner = null; this.lifeEvent(`연인 ${n.name}을(를) 잃었다.`); }
    if (p && p.spouse === n.id) { p.spouse = null; this.lifeEvent(`배우자 ${n.name}을(를) 잃었다.`); }
    if (p && p.master === n.id) { p.master = null; this.lifeEvent(`스승 ${n.name}이(가) 세상을 떠났다.`); }
    if (p && p.disciples && p.disciples.includes(n.id)) { p.disciples = p.disciples.filter((x) => x !== n.id); this.lifeEvent(`제자 ${n.name}을(를) 잃었다.`); }
    if (this.avenge && (killer || cause === '게이트')) this.avenge(n, killer);
    if (this.questEvent) this.questEvent('npckill', { id: n.id });
  }

  simulateNpcs() {
    // NPC 돌파 확률(F→E … S→SS)과 진척 배율: 높은 등급의 희소성 유지 (docs/성장_밸런스_분석.md 2-5)
    const NPC_BT = [0.6, 0.5, 0.4, 0.32, 0.22, 0.15, 0.03];
    const NPC_SLOW = [1, 1, 1, 1, 1, 1, 0.7, 1];
    for (const n of this.npcs) {
      if (!n.alive) continue;
      n.ageMonths++;
      if (n.child) continue;
      if (n.ageMonths / 12 >= n.lifespan) {
        this.killNpc(n, '수명');
        if (n.met || n.rankIdx >= 4) this.rumor(`${RANKS[n.rankIdx].key}급 각성자 ${n.name}이(가) ${Math.floor(n.ageMonths / 12)}세로 세상을 떠났다.`);
        if (n.met) this.log(`${n.name}이(가) 수명을 다해 세상을 떠났다는 소식을 들었다.`, 'bad');
        continue;
      }
      // 수련
      const reg = regionById(n.region);
      // 높은 등급일수록 진척이 크게 둔화 (B 이상 추가 감속)
      n.progress += (1 + n.talent * 0.08) * reg.ether * 0.3 / (4 * RANKS[n.rankIdx].mult ** 1.5) * RNG.range(0.5, 1.5) * (NPC_SLOW[n.rankIdx] ?? 1);
      if (n.progress >= 1) {
        if (n.stage < 2) { n.stage++; n.progress = 0; }
        else if (n.rankIdx < RANKS.length - 1) {
          if (RNG.chance(NPC_BT[n.rankIdx] * (0.8 + n.talent * 0.04))) {
            n.rankIdx++; n.stage = 0; n.progress = 0;
            n.lifespan += RANKS[n.rankIdx].life - RANKS[n.rankIdx - 1].life;
            if (n.met || n.rankIdx >= 3) this.rumor(RUMOR_TEMPLATES[0]({ name: n.name, rankName: RANKS[n.rankIdx].name }));
          } else {
            n.progress = n.rankIdx >= 4 ? 0 : 0.3;
          }
        } else n.progress = 1;
      }
      // 게이트 사망 (배경 확률. 대부분은 게이트 생태계 gate_eco.js의 공략 실패로 죽는다)
      if (!n.isCompanion && RNG.chance(0.0006 * reg.danger * (1 + Math.max(0, n.rankIdx - 3) * 0.35))) {
        this.killNpc(n, '게이트');
        if (n.met || n.rankIdx >= 4) this.rumor(`${n.name}이(가) ${reg.name}의 게이트에서 돌아오지 못했다.`);
        if (n.met) this.log(`${n.name}이(가) 게이트에서 전사했다는 비보가 들려왔다.`, 'bad');
        continue;
      }
      // 활약 소문
      if (RNG.chance(0.006)) this.rumor(RNG.pick(RUMOR_TEMPLATES.slice(1))({ name: n.name }));
      // 이동
      if (!n.isCompanion && RNG.chance(0.04)) {
        const opts = REGIONS.filter((r) => regionDist(r.id, n.region) === 1 && (r.id !== 'jeju' || n.rankIdx >= 6));
        if (opts.length) n.region = RNG.pick(opts).id;
      }
      // 길드 가입
      if (!n.guild && n.rankIdx >= 1 && RNG.chance(0.01)) n.guild = RNG.pick(Object.keys(GUILDS));
      // NPC끼리의 결투
      if (persById(n.personality).id === 'warlike' && RNG.chance(0.002)) {
        const victims = this.npcs.filter((o) => o.alive && o !== n && o.region === n.region && o.rankIdx < n.rankIdx && !o.isCompanion);
        if (victims.length) {
          const v = RNG.pick(victims);
          this.killNpc(v, `${n.name}에게 살해`, n);
          this.rumor(`${n.name}이(가) 결투 끝에 ${v.name}을(를) 쓰러뜨렸다.`);
          if (v.met) this.log(`${v.name}이(가) ${n.name}에게 살해당했다.`, 'bad');
          if (v.met && v.relation >= 30) { n.relation -= 20; }
        }
      }
    }
    // 인구 유지
    const alive = this.npcs.filter((n) => n.alive && !n.child).length;
    for (let i = alive; i < 50; i++) this.npcs.push(this.makeNpc(true));
    // 오래된 사망자 정리 (만난 적 없는 사람)
    if (this.npcs.length > 180) {
      const keep = new Set(); const p = this.player;
      [p.partner, p.spouse, p.master, ...(p.disciples || [])].forEach((id) => id && keep.add(id));
      this.npcs = this.npcs.filter((n) => n.alive || n.met || keep.has(n.id));
    }
  }

  relGain(n, base) {
    let g = base * persById(n.personality).relGain * (1 + this.mod('social')) * (1 + Math.min(this.player.fame, 200) / 400);
    if (n.guild && n.guild === this.player.guild) g *= 1.5;
    return Math.round(g);
  }
  changeRel(n, d) { n.relation = Math.max(-100, Math.min(100, n.relation + d)); }

  talk(id) {
    const n = this.npcById(id); if (!n || !n.alive) return '';
    if (n.lastTalk === this.monthKey()) return `${n.name}은(는) 이미 이번 달에 충분히 이야기를 나눴다.`;
    n.lastTalk = this.monthKey(); n.met = true;
    const pers = persById(n.personality);
    if ((pers.id === 'warlike' || pers.id === 'cold') && RNG.chance(0.2)) {
      this.changeRel(n, -6);
      return pers.id === 'warlike' ? `${n.name}: "시비 거는 거냐? 꺼져." (관계 -6)` : `${n.name}은(는) 당신을 무시했다. (관계 -6)`;
    }
    const g = this.relGain(n, RNG.int(3, 7));
    this.changeRel(n, g);
    const lines = {
      kind: ['"오늘도 무사해서 다행이에요."', '"요즘 게이트가 부쩍 늘었대요. 조심하세요."'],
      warlike: ['"강한 놈이랑 붙고 싶어 몸이 근질근질해."', '"네 실력, 언젠가 확인해보겠어."'],
      greedy: ['"좋은 결정 시세가 오르고 있어. 정보 하나 줄까?"', '"돈 되는 게이트 알면 나한테도 알려줘."'],
      just: ['"힘은 약한 자를 지키기 위해 쓰는 거다."', '"관리국은 너무 느려. 우리가 움직여야 해."'],
      cold: ['"...용건만 말해."', '"..."'],
    };
    return `${n.name}: ${RNG.pick(lines[pers.id])} (관계 +${g})`;
  }

  giftCost(n) { return Math.round(100 * RANKS[n.rankIdx].mult); }
  gift(id) {
    const n = this.npcById(id); if (!n) return '';
    const cost = this.giftCost(n);
    if (this.player.money < cost) return '크레딧이 부족하다.';
    this.player.money -= cost; n.met = true;
    const g = this.relGain(n, persById(n.personality).id === 'greedy' ? 18 : 12);
    this.changeRel(n, g);
    return `${n.name}에게 ${fmt(cost)} 크레딧 상당의 선물을 건넸다. (관계 +${g})`;
  }

  canTeach(n) { return n.rankIdx >= this.player.rankIdx + 1 && (n.relation >= 40 || this.player.master === n.id); }
  teach(id) {
    const n = this.npcById(id);
    if (!n || !this.canTeach(n) || !this.canAct()) return '';
    const g = this.trainGain(2.2);
    this.addEther(g);
    this.changeRel(n, 2);
    this.log(`${n.name}에게 한 달간 가르침을 받았다. 에테르 +${fmt(g)}`, 'good');
    this.advanceMonth(1, { eventChance: 0.1 });
    return `${n.name}의 지도 아래 수련했다. 에테르 +${fmt(g)}`;
  }

  // 제자를 한 달 동안 직접 가르친다
  teachDisciple(id) {
    const p = this.player; const n = this.npcById(id);
    if (!n || !n.alive || !(p.disciples || []).includes(id) || !this.canAct()) return '';
    n.progress += 1.2; this.changeRel(n, 6); p.fame += 2; p.merit += 3;
    let msg = `${n.name}을(를) 한 달 동안 가르쳤다.`;
    if (n.progress >= 1) {
      n.progress = 0;
      if (n.stage < 2) n.stage++; else if (n.rankIdx < p.rankIdx - 1 || RNG.chance(0.4)) { n.rankIdx = Math.min(7, n.rankIdx + 1); n.stage = 0; msg += ` ${n.name}이(가) ${RANKS[n.rankIdx].key}급으로 돌파했다!`; this.lifeEvent(`제자 ${n.name}을(를) ${RANKS[n.rankIdx].key}급으로 키워 냈다.`); }
    }
    this.advanceMonth(1, { eventChance: 0.1 });
    return msg + ' (명성 +2, 협회 공적 +3)';
  }
  canRecruit(n) { return !n.isCompanion && !n.child && n.relation >= 50 && this.party().length < 4; }
  recruit(id) {
    const n = this.npcById(id);
    if (!n || !this.canRecruit(n)) return '';
    const p = this.player;
    if (n.rankIdx > p.rankIdx + 1 && !RNG.chance(0.25)) {
      this.changeRel(n, -3);
      return `${n.name}: "아직은 네가 날 따라올 실력이 아닌 것 같아." (거절)`;
    }
    n.isCompanion = true; (p.party ||= []).push(n.id); n.region = p.region;
    this.log(`${n.name}이(가) 파티에 합류했다.`, 'good');
    return `${n.name}: "좋아, 함께 가자." 파티에 합류했다!`;
  }
  dismiss(id) {
    const p = this.player; const c = id != null ? this.npcById(id) : this.companion(); if (!c) return '';
    c.isCompanion = false; p.party = (p.party || []).filter((x) => x !== c.id); c.merc = null;
    this.log(`${c.name}이(가) 파티를 떠났다.`);
    return `${c.name}와(과) 헤어졌다.`;
  }

  // 전투 유닛 생성
  playerUnit() {
    const p = this.player;
    return {
      id: 'player', name: p.name, side: 'ally', isPlayer: true, cls: p.cls, clsAdv: p.clsAdv,
      hp: p.hp, maxHp: p.maxHp, mp: p.mp, maxMp: p.maxMp, atk: p.atk, def: p.def, spd: p.spd, luck: p.luck,
      elem: p.element, skills: ['strike', ...p.equipSkills], affinity: p.element,
    };
  }
  npcUnit(n, side) {
    const cls = n.cls || 'swordsman';
    const adv = n.rankIdx >= 6 ? 2 : n.rankIdx >= 3 ? 1 : 0;
    const m = statMult(n.rankIdx, n.stage) * 1.12;
    const rm = (n.race && RACES[n.race]) ? RACES[n.race].mods : {};
    const cm = (k) => 1 + this.classMod(cls, adv, k) + (rm[k] || 0);
    const skills = ['strike', ...SKILLS.filter((s) => s.cls === cls && s.rankReq <= n.rankIdx).map((s) => s.id), ...SKILLS.filter((s) => !s.cls && s.elem === n.element && s.rankReq <= n.rankIdx && s.price).map((s) => s.id).slice(-1)];
    return {
      id: 'npc' + n.id, npcId: n.id, name: n.name, side, cls, clsAdv: adv, pers: n.personality,
      hp: Math.round(100 * m * cm('hp')), maxHp: Math.round(100 * m * cm('hp')), mp: Math.round(50 * m * cm('mp')), maxMp: Math.round(50 * m * cm('mp')),
      atk: Math.round(20 * m * cm('atk')), def: Math.round(8 * m * cm('def')), spd: Math.round(10 * Math.sqrt(m) * cm('spd')), luck: Math.round(10 * cm('luck')),
      elem: n.element, skills, affinity: n.element, rankText: this.npcRankLabel(n),
    };
  }
  // 파티 인원에 맞춰 적 규모를 키운다 (혼자면 그대로)
  scaleForParty(list, tier) {
    const n = this.partySize();
    if (n <= 1) return list;
    for (const e of list) { e.maxHp = e.hp = Math.round(e.hp * (1 + 0.28 * (n - 1))); e.atk = Math.round(e.atk * (1 + 0.05 * (n - 1))); }
    const extra = n >= 4 ? 2 : n >= 2 ? 1 : 0;
    for (let i = 0; i < extra && list.length < 6; i++) list.push(this.makeMonster(tier, false, list[0] && list[0].elem));
    return list;
  }
  makeMonster(tier, boss, prefElem) {
    let pool = MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1);
    if (!pool.length) pool = MONSTERS;
    if (prefElem && RNG.chance(0.6)) { const ep = pool.filter((m) => m.elem === prefElem); if (ep.length) pool = ep; }
    const t = RNG.pick(pool);
    const m = RANKS[tier].mult * RNG.range(0.95, 1.1) * (boss ? 1 : 1);
    const hpMul = boss ? 3.2 : 1, atkMul = boss ? 1.35 : 1;
    const skills = ['strike', ...SKILLS.filter((s) => s.elem === t.elem && (s.type === 'dmg' || s.type === 'aoe') && s.rankReq <= Math.floor(tier / 1.5)).map((s) => s.id).slice(-2)];
    const hp = Math.round(60 * m * t.hp * hpMul);
    return {
      id: 'm' + Math.random().toString(36).slice(2, 8), name: (boss ? '[보스] ' : '') + t.name, side: 'enemy', boss,
      hp, maxHp: hp, mp: Math.round(40 * m), maxMp: Math.round(40 * m),
      atk: Math.round(10.5 * m * t.atk * atkMul), def: Math.round(4 * m * (boss ? 1.3 : 1)), spd: Math.round(10.5 * Math.sqrt(m) * RNG.range(0.92, 1.15) * (boss ? 1.1 : 1)), luck: 5,
      elem: t.elem, skills, tier, shape: t.shape,
    };
  }

  // ---------- 게이트 ----------
  getGates() { return this.mapGates; }

  gateName(gate) { return gate.final ? '원초의 게이트' : `${RANKS[gate.tier].key}급 게이트 · ${gate.theme}`; }
  gateRooms(gate) {
    const rooms = [];
    const n = gate.final ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const enemies = [];
      if (last) {
        if (gate.final) {
          const boss = this.makeMonster(7, true, 'dark');
          boss.name = '[최종] 심연의 군주'; boss.shape = 'lord'; boss.hp = boss.maxHp = Math.round(boss.maxHp * 2.2); boss.atk = Math.round(boss.atk * 1.2);
          enemies.push(boss);
        } else {
          enemies.push(this.makeMonster(gate.tier, true, gate.elem));
          if (RNG.chance(0.4)) enemies.push(this.makeMonster(gate.tier, false, gate.elem));
        }
      } else {
        const cnt = i === 0 ? RNG.int(1, 2) : RNG.int(2, 3);
        for (let k = 0; k < cnt; k++) enemies.push(this.makeMonster(gate.tier, false, gate.elem));
      }
      rooms.push(this.scaleForParty(enemies, gate.tier));
    }
    return rooms;
  }
  monsterReward(mon) {
    const m = RANKS[mon.tier].mult;
    const mul = mon.boss ? 5 : 1;
    return {
      money: Math.round(40 * m * mul * RNG.range(0.8, 1.2)),
      ether: Math.round(3 * m ** 1.2 * mul * RNG.range(0.85, 1.15)),
    };
  }

  // 게이트 종료 처리. result: 'clear' | 'retreat' | 'lose'
  finishGate(gate, result, loot, hpLeft, mpLeft) {
    const p = this.player;
    p.hp = Math.max(1, hpLeft); p.mp = Math.max(0, mpLeft);
    const lines = [];
    if (result === 'lose') {
      const lost = Math.floor(p.money * 0.3);
      p.money -= lost; p.lifePenalty += 2; p.injured = 3;
      this.recalc();
      p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
      lines.push(`쓰러진 당신을 관리국 구조대가 끌어냈다. 치료비로 ${fmt(lost)} 크레딧을 잃었고, 치명상으로 수명이 2년 줄었다. (부상 3개월)`);
      this.log(`${this.gateName(gate)}에서 패배했다.`, 'bad');
      this.advanceDays(45, { noRegen: true });
      return lines;
    }
    p.money += loot.money; p.record.kills += loot.kills;
    this.addEther(loot.ether);
    lines.push(`획득: ${fmt(loot.money)} 크레딧, 에테르 ${fmt(loot.ether)}`);
    lines.push(...this.lootFromKills(loot.list || [], result === 'clear'));
    if (loot.list) this.questEvent('kill', { region: gate.region, tier: gate.tier, n: loot.list.length });
    if (result === 'clear') {
      gate.cleared = true; p.record.gates++;
      this.mapGates = this.mapGates.filter((g) => g.id !== gate.id);
      this.questEvent('gate', { region: gate.region, tier: gate.tier });
      if (gate.breakCity) lines.push(this.resolveBreak(gate.breakCity));
      if (p.record.gates === 1) this.lifeEvent('첫 게이트를 공략했다.');
      const fame = gate.tier + 1;
      p.fame += fame;
      lines.push(`게이트 클리어! 명성 +${fame}`);
      if (RNG.chance(0.7)) {
        const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), gate.tier);
        p.inventory.push(it);
        lines.push(`보스 드롭: ${it.name}`);
      }
      if (RNG.chance(0.3)) { p.items.crystal = (p.items.crystal || 0) + 1; lines.push('에테르 결정 1개를 주웠다.'); }
      if (gate.mission) {
        const c = 30 * (gate.tier + 1);
        p.contrib += c; p.money += Math.round(loot.money * 0.3);
        lines.push(`길드 임무 완료: 공헌도 +${c}, 보너스 보수 지급`);
        this.checkGuildRank(lines);
      }
      const comp = this.companion();
      if (comp) this.changeRel(comp, 2);
      this.log(`${this.gateName(gate)} 공략 완료.`, 'good');
      if (gate.final) {
        this.flags.won = true;
        p.fame += 500;
        this.log('원초의 게이트를 닫았다. 한반도에 새벽이 찾아왔다.', 'major');
        this.rumor(`${p.name}이(가) 원초의 게이트를 닫았다! 전설이 탄생했다.`);
        this.queue.push({ type: 'victory' });
      }
    } else {
      this.log(`${this.gateName(gate)}에서 철수했다.`);
    }
    this.advanceDays(10, { eventChance: 0.1 });
    return lines;
  }

  // ---------- 장비 / 상점 ----------
  makeEquipment(slot, tier, rarityIdx) {
    if (rarityIdx == null) {
      const luckBonus = Math.max(0, (this.player ? this.player.luck : 10) - 10) * 0.6;
      rarityIdx = RNG.weighted([0, 1, 2, 3], [55, 30 + luckBonus, 12 + luckBonus / 2, 3 + luckBonus / 4]);
    }
    const r = RARITY[rarityIdx];
    const m = RANKS[tier].mult * r.mult;
    const base = RNG.pick(EQUIP_TEMPLATES[slot]);
    const it = { uid: Math.random().toString(36).slice(2, 10), slot, tier, rarity: rarityIdx, name: `[${RANKS[tier].key}] ${base}` };
    if (slot === 'weapon') { it.atk = Math.round(8 * m); if (RNG.chance(0.3)) it.spd = Math.round(2 * m); }
    if (slot === 'armor') { it.def = Math.round(5 * m); it.hp = Math.round(30 * m); }
    if (slot === 'acc') { it.mp = Math.round(20 * m); it.luck = Math.round(3 * r.mult); if (RNG.chance(0.5)) it.spd = Math.round(1.5 * m); }
    it.value = Math.round(150 * RANKS[tier].mult ** 2 * r.mult);
    return it;
  }

  priceMul() {
    let m = 1 + this.mod('price');
    const reg = this.region();
    if (reg.guild && reg.guild === this.player.guild) m *= 0.8;
    if (this.cityPriceMul) m *= this.cityPriceMul(reg.id);
    return m;
  }

  getShop() {
    const reg = this.region();
    const key = this.monthKey();
    let s = this.shops[reg.id];
    if (!s || s.key !== key) {
      const [lo, hi] = GATE_RANGES[reg.danger];
      const eqCount = reg.id === 'suwon' ? 6 : reg.id === 'busan' ? 5 : 3;
      const equips = [];
      for (let i = 0; i < eqCount; i++) {
        const rar = reg.id === 'busan' ? RNG.weighted([0, 1, 2, 3], [30, 35, 25, 10]) : RNG.weighted([0, 1, 2], [60, 30, 10]);
        const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), RNG.int(lo, Math.min(7, hi + (reg.id === 'suwon' ? 1 : 0))), rar);
        if (reg.id === 'busan') it.value = Math.round(it.value * RNG.range(0.6, 1.5));
        equips.push(it);
      }
      const skCount = reg.id === 'daejeon' ? 5 : 2;
      let skPool = SKILLS.filter((sk) => sk.price > 0 && sk.rankReq <= hi);
      const guildElem = reg.guild ? GUILDS[reg.guild].elem : null;
      const skills = [];
      for (let i = 0; i < skCount && skPool.length; i++) {
        let pick = guildElem && RNG.chance(0.5) ? skPool.find((sk) => sk.elem === guildElem && !skills.includes(sk.id)) : null;
        if (!pick) pick = RNG.pick(skPool);
        skills.push(pick.id);
        skPool = skPool.filter((sk) => sk.id !== pick.id);
      }
      s = this.shops[reg.id] = { key, equips, skills };
    }
    return s;
  }

  buyEquip(uid) {
    const s = this.getShop(); const it = s.equips.find((e) => e.uid === uid);
    if (!it) return '';
    const price = Math.round(it.value * this.priceMul());
    if (this.player.money < price) return '크레딧이 부족하다.';
    this.player.money -= price;
    s.equips = s.equips.filter((e) => e.uid !== uid);
    this.player.inventory.push(it);
    return `${it.name}을(를) 구매했다.`;
  }
  buySkill(id) {
    const sk = skillById(id); const p = this.player;
    if (p.skills.includes(id)) return '이미 습득한 스킬이다.';
    if (sk.rankReq > p.rankIdx) return `${RANKS[sk.rankReq].key}급 이상만 익힐 수 있다.`;
    const price = Math.round(sk.price * this.priceMul());
    if (p.money < price) return '크레딧이 부족하다.';
    p.money -= price; p.skills.push(id);
    if (p.equipSkills.length < 4) p.equipSkills.push(id);
    this.log(`스킬 데이터 [${sk.name}]을(를) 습득했다.`, 'good');
    return `[${sk.name}] 습득 완료.`;
  }
  buyItem(id) {
    const c = CONSUMABLES.find((x) => x.id === id);
    const price = Math.round(c.price * this.priceMul());
    if (this.player.money < price) return '크레딧이 부족하다.';
    this.player.money -= price;
    this.player.items[id] = (this.player.items[id] || 0) + 1;
    return `${c.name}을(를) 구매했다.`;
  }
  sellEquip(uid) {
    const p = this.player; const it = p.inventory.find((e) => e.uid === uid);
    if (!it) return '';
    const price = Math.round(it.value * 0.4);
    p.inventory = p.inventory.filter((e) => e.uid !== uid);
    p.money += price;
    return `${it.name}을(를) ${fmt(price)} 크레딧에 팔았다.`;
  }
  equipItem(uid) {
    const p = this.player; const it = p.inventory.find((e) => e.uid === uid);
    if (!it) return;
    p.inventory = p.inventory.filter((e) => e.uid !== uid);
    if (p.equip[it.slot]) p.inventory.push(p.equip[it.slot]);
    p.equip[it.slot] = it;
    this.recalc();
  }
  unequip(slot) {
    const p = this.player;
    if (!p.equip[slot]) return;
    p.inventory.push(p.equip[slot]); p.equip[slot] = null;
    this.recalc();
  }
  useItem(id) {
    const p = this.player; const c = CONSUMABLES.find((x) => x.id === id);
    if (!p.items[id]) return '';
    p.items[id]--;
    const heal = 1 + this.mod('heal');
    if (c.effect === 'hp') { const v = Math.floor(p.maxHp * c.val * heal); p.hp = Math.min(p.maxHp, p.hp + v); return `체력 +${v}`; }
    if (c.effect === 'mp') { const v = Math.floor(p.maxMp * c.val * heal); p.mp = Math.min(p.maxMp, p.mp + v); return `정신력 +${v}`; }
    if (c.effect === 'ether') { const v = this.etherGift(c.val); return `에테르 +${v}`; }
    if (c.effect === 'bt') { p.btBonus += c.val; return `다음 돌파 성공률 +${c.val}%`; }
    return '';
  }
  toggleSkill(id) {
    const p = this.player;
    if (id === 'strike') return;
    if (p.equipSkills.includes(id)) p.equipSkills = p.equipSkills.filter((s) => s !== id);
    else if (p.equipSkills.length < 4) p.equipSkills.push(id);
  }

  // ---------- 길드 ----------
  joinGuild() {
    const reg = this.region(); const p = this.player;
    if (!reg.guild || p.guild) return '';
    if (!this.onCity()) return '길드 본부가 있는 도시 안에서 신청할 수 있다.';
    const g = GUILDS[reg.guild];
    if (p.fame < g.fameReq) return `명성이 부족하다. (필요 ${g.fameReq})`;
    p.guild = reg.guild; p.guildRank = 0; p.contrib = 0;
    this.log(`${g.name}에 가입했다.`, 'major');
    return `${g.name}에 ${GUILD_RANKS[0].name}(으)로 가입했다.`;
  }
  leaveGuild() {
    const p = this.player; if (!p.guild) return '';
    const g = GUILDS[p.guild];
    p.guild = null; p.guildRank = 0; p.contrib = 0; p.fame = Math.max(0, p.fame - 5);
    this.log(`${g.name}을(를) 탈퇴했다.`);
    return `${g.name}을(를) 탈퇴했다. (명성 -5)`;
  }
  checkGuildRank(lines) {
    const p = this.player;
    while (p.guildRank < GUILD_RANKS.length - 1 && p.contrib >= GUILD_RANKS[p.guildRank + 1].req) {
      p.guildRank++;
      const t = `길드 직위 상승: ${GUILD_RANKS[p.guildRank].name}`;
      lines.push(t); this.log(t, 'good');
    }
  }

  // ---------- 이벤트에서 쓰는 헬퍼 ----------
  gainNpcRelationRandom(v) {
    const here = this.npcsHere();
    if (!here.length) return;
    const n = RNG.pick(here); n.met = true; this.changeRel(n, v);
  }
  startSparWithRandomNpc() {
    const here = this.npcsHere().filter((n) => !n.isCompanion);
    const n = here.length ? RNG.pick(here) : null;
    if (n) this.queue.push({ type: 'spar', npcId: n.id, fromEvent: true });
  }

  // 대련/결투 결과
  finishSpar(n, won) {
    const p = this.player; n.met = true;
    n.lastSpar = this.monthKey();
    if (won) {
      const g = this.trainGain(0.5); this.addEther(g); p.fame += 1;
      this.changeRel(n, persById(n.personality).id === 'warlike' ? 8 : 4);
      return `대련 승리! 에테르 +${fmt(g)}, 명성 +1`;
    }
    const g = this.trainGain(0.25); this.addEther(g);
    this.changeRel(n, 2);
    return `대련 패배. 그래도 배운 것이 있다. 에테르 +${fmt(g)}`;
  }
  finishDuel(n, won, hpLeft, mpLeft) {
    const p = this.player;
    if (!won) { this.gameOver(`${n.name}와(과)의 생사결에서 패해 목숨을 잃었다.`); return ''; }
    p.hp = Math.max(1, hpLeft); p.mp = mpLeft;
    const loot = Math.round(200 * RANKS[n.rankIdx].mult ** 1.5 * RNG.range(0.7, 1.3));
    const ether = Math.round(stageReq(n.rankIdx, n.stage) * 0.25);
    p.money += loot; this.addEther(ether); p.record.npcKills++;
    const villain = n.relation <= -20 || persById(n.personality).id === 'warlike';
    const fameD = villain ? 3 : -10;
    p.fame = Math.max(0, p.fame + fameD);
    this.killNpc(n, `${p.name}에게 살해`, 'player');
    this.lifeEvent(`생사결 끝에 ${n.name}을(를) 베었다.`);
    this.rumor(`${p.name}이(가) 생사결 끝에 ${n.name}을(를) 쓰러뜨렸다.`);
    this.log(`${n.name}을(를) 쓰러뜨렸다.`, villain ? 'good' : 'bad');
    // 같은 지역의 지인들이 반응
    for (const o of this.npcsHere()) {
      if (o.met && persById(o.personality).id === 'just' && !villain) this.changeRel(o, -15);
    }
    return `승리. ${fmt(loot)} 크레딧과 에테르 ${fmt(ether)}을(를) 빼앗았다. 명성 ${fameD > 0 ? '+' : ''}${fameD}`;
  }
}
