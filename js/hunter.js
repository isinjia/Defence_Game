// ===== 게이트 크로니클: 헌터물 확장 =====
// 칭호, 공식 등급 재측정, 게이트 변이(레드·이중·오판), 코어 시세, 스킬 숙련과 각성,
// 회귀, 길드 공략권 입찰, 헌터 랭킹, 후원자, 시련의 탑. (방송: 사용자 요청으로 삭제 — 중계 진입·제안 사건·헌터 창 칸·스트리머 칭호·광고 수익)

const REGRESS_KEY = 'gate_chronicle_regress';

// ---------- 칭호 ----------
const TITLES = [
  { id: 'first_gate', name: '첫 균열', how: '게이트 1회 공략', mods: { train: 0.03 }, cond: (g, p) => p.record.gates >= 1 },
  { id: 'gate_hunter', name: '게이트 사냥꾼', how: '게이트 15회 공략', mods: { atk: 0.04 }, cond: (g, p) => p.record.gates >= 15 },
  { id: 'gate_sweeper', name: '게이트 청소부', how: '게이트 60회 공략', mods: { atk: 0.07, def: 0.03 }, cond: (g, p) => p.record.gates >= 60 },
  { id: 'slayer', name: '백귀 사냥', how: '괴수 150마리 처치', mods: { atk: 0.04 }, cond: (g, p) => p.record.kills >= 150 },
  { id: 'massacre', name: '괴수 학살자', how: '괴수 600마리 처치', mods: { atk: 0.08 }, cond: (g, p) => p.record.kills >= 600 },
  { id: 'unyielding', name: '불굴', how: '돌파 실패 3회', mods: { breakthrough: 6 }, cond: (g, p) => p.record.fails >= 3 },
  { id: 'red_survivor', name: '붉은 문의 생환자', how: '레드 게이트 공략', mods: { hp: 0.06 }, cond: (g, p) => (p.record.red || 0) >= 1 },
  { id: 'hidden_finder', name: '숨은 층의 발견자', how: '이중 던전의 숨겨진 구역 공략', mods: { luck: 0.15 }, cond: (g, p) => (p.record.hidden || 0) >= 1 },
  { id: 'misjudged', name: '오판 게이트 생존자', how: '등급 오판 게이트 2회 공략', mods: { def: 0.05 }, cond: (g, p) => (p.record.misrank || 0) >= 2 },
  { id: 'city_shield', name: '도시의 방패', how: '게이트 브레이크 2회 저지', mods: { def: 0.05, hp: 0.04 }, cond: (g, p) => (p.record.breaks || 0) >= 2 },
  { id: 'duelist', name: '피의 결투가', how: '생사결 5회 승리', mods: { atk: 0.06, social: -0.1 }, cond: (g, p) => p.record.npcKills >= 5 },
  { id: 'national', name: '국민 헌터', how: '명성 400', mods: { social: 0.15 }, cond: (g, p) => p.fame >= 400 },
  { id: 'climber', name: '탑 등반자', how: '시련의 탑 10층', mods: { spd: 0.04 }, cond: (g, p) => (p.tower.best || 0) >= 10 },
  { id: 'summit', name: '정상을 보는 자', how: '시련의 탑 30층', mods: { atk: 0.05, def: 0.05, spd: 0.03 }, cond: (g, p) => (p.tower.best || 0) >= 30 },
  { id: 'measure_error', name: '측정 오류', how: '재측정에서 두 등급 이상 상승', mods: { atk: 0.05, luck: 0.1 }, cond: (g) => !!g.flags.measureError },
  { id: 'regressor', name: '회귀자', how: '죽음 뒤 처음으로 돌아오기', mods: { train: 0.06 }, cond: (g, p) => !!(p.regress && p.regress.count) },
  { id: 'mastery', name: '기술의 극의', how: '스킬 하나를 각성', mods: { mp: 0.1 }, cond: (g, p) => Object.keys(p.skillXp || {}).some((id) => g.skillLv(id) >= 5) },
  { id: 'core_baron', name: '마석 재벌', how: '코어 판매 누적 10만 크레딧', mods: { price: -0.06 }, cond: (g, p) => (p.coreSales || 0) >= 100000 },
  { id: 'top_ranker', name: '랭킹 1위', how: '국내 헌터 랭킹 1위', mods: { atk: 0.04, social: 0.1 }, cond: (g, p) => p.bestRankPos === 1 },
  { id: 'chosen', name: '선택받은 자', how: '후원자 호감 100', mods: { hp: 0.05, atk: 0.05 }, cond: (g, p) => !!(p.sponsor && p.sponsor.chosen) },
  { id: 's_rank', name: '공인 S급', how: '관리국 공식 S급 등록', mods: { hp: 0.05, def: 0.03 }, cond: (g, p) => p.official >= 6 },
  { id: 'guild_ace', name: '길드의 에이스', how: '낙찰 게이트 3회 공략', mods: { atk: 0.03, def: 0.03 }, cond: (g, p) => (p.record.bidGates || 0) >= 3 },
];
const titleById = (id) => TITLES.find((t) => t.id === id);
const MOD_NAME = { hp: '체력', mp: '정신력', atk: '공격', def: '방어', spd: '속도', luck: '운', train: '수련', social: '친화', price: '물가', breakthrough: '돌파', heal: '회복', life: '수명' };
function modsText(mods, mul = 1) {
  return Object.entries(mods).map(([k, v]) => {
    const x = v * mul;
    if (k === 'breakthrough') return `돌파 성공률 ${x > 0 ? '+' : ''}${Math.round(x)}%`;
    if (k === 'price') return `물가 ${Math.round(x * 100)}%`;
    return `${MOD_NAME[k] || k} ${x > 0 ? '+' : ''}${Math.round(x * 100)}%`;
  }).join(', ');
}

// ---------- 스킬 숙련 ----------
const SKILL_LV_REQ = [0, 8, 24, 50, 90]; // Lv1~Lv5(각성)에 필요한 누적 사용 횟수

// ---------- 후원자 ----------
const SPONSORS = {
  ash: { name: '잿빛 군주', like: 'carnage', hate: 'retreat', likeText: '학살과 정면 승부', hateText: '등을 보이는 것', bless: { atk: 0.04 }, color: '#ff6b6b',
    up: ['잿빛 군주가 피 냄새에 웃는다.', '잿빛 군주가 당신의 칼끝을 지켜본다.', '잿빛 군주: "더."'], down: ['잿빛 군주가 등을 돌린다.', '잿빛 군주: "겁쟁이에게 줄 것은 없다."'] },
  star: { name: '별을 세는 노파', like: 'explore', hate: 'idle', likeText: '낯선 곳과 숨은 길', hateText: '한자리에 머무는 것', bless: { spd: 0.03, luck: 0.1 }, color: '#9fd8ff',
    up: ['별을 세는 노파가 지도에 점 하나를 찍었다.', '별을 세는 노파: "그래, 그 길이야."'], down: ['별을 세는 노파가 하품을 했다.', '별을 세는 노파: "지루하구나."'] },
  warden: { name: '침묵하는 파수꾼', like: 'protect', hate: 'murder', likeText: '사람을 지키는 일', hateText: '무고한 피', bless: { def: 0.04, hp: 0.04 }, color: '#7cd992',
    up: ['침묵하는 파수꾼이 고개를 끄덕인다.', '침묵하는 파수꾼의 시선이 따뜻해졌다.'], down: ['침묵하는 파수꾼이 눈을 감았다.', '침묵하는 파수꾼에게서 차가운 기운이 흐른다.'] },
  gold: { name: '황금 눈의 상인', like: 'wealth', hate: 'loss', likeText: '돈이 도는 일', hateText: '손해 보는 것', bless: { luck: 0.08, price: -0.04 }, color: '#ffd84d',
    up: ['황금 눈의 상인이 주판을 튕긴다.', '황금 눈의 상인: "남는 장사로군."'], down: ['황금 눈의 상인이 혀를 찬다.', '황금 눈의 상인: "적자는 용서 못 하네."'] },
};
const SPONSOR_TIERS = [[100, 3, '선택'], [60, 2, '총애'], [30, 1, '관심']];

// 연계 기연 이름 (회귀자의 기억에 쓰인다)
const CHAIN_NAMES = { cult: '균열교', family: '잃어버린 가족', voice: '제주의 목소리', subject: '피험자 7번', pocha: '포차 사장님', nuri: '고철 드론 누리', smuggle: '부산 암시장', baekho: '백호 가문의 후계' };

// ---------- 시련의 탑 ----------
FAC_ICON.tower = '<path d="M9 21V8l3-5 3 5v13M7 21h10M9 12h6M9 16h6"/>';
FACILITIES.splice(FACILITIES.findIndex((f) => f.id === 'auction'), 0, { id: 'tower', name: '시련의 탑', desc: '층마다 다른 시험. 한 달에 한 번 오를 수 있다.', only: ['daejeon'] });

Object.assign(Game.prototype, {
  // ---------- 초기화 ----------
  hunterInit() {
    const p = this.player;
    p.titles ??= []; p.title ??= null;
    // 삭제된 칭호(인기 스트리머 등)는 옛 저장에서 걸러 낸다
    p.titles = p.titles.filter((id) => titleById(id)); if (p.title && !titleById(p.title)) p.title = null;
    // 삭제된 광고·예능(celebrity.js)의 대기 사건은 옛 저장에서 지운다
    if (Array.isArray(this.queue)) this.queue = this.queue.filter((q) => q.type !== 'celeb');
    p.official ??= p.rankIdx;
    p.skillXp ??= {};
    p.followers ??= 0; p.streams ??= 0;
    p.tower ??= { best: 0, month: -1 };
    p.coreSales ??= 0;
    p.sponsor ??= null;
    p.bestRankPos ??= null;
    for (const k of ['red', 'hidden', 'misrank', 'breaks', 'bidGates']) p.record[k] ??= 0;
    const w = this.world;
    w.coreIdx ??= RANKS.map(() => 1); w.corePrev ??= w.coreIdx.slice();
    w.guildPrestige ??= Object.fromEntries(Object.keys(GUILDS).map((id) => [id, 40 + RNG.int(0, 20)]));
    w.bid ??= null;
  },

  // ---------- 칭호 ----------
  checkTitles() {
    const p = this.player; if (!p || !p.titles) return;
    for (const t of TITLES) {
      if (p.titles.includes(t.id)) continue;
      let ok = false; try { ok = t.cond(this, p); } catch (e) { ok = false; }
      if (!ok) continue;
      p.titles.push(t.id);
      if (!p.title) p.title = t.id;
      this.lifeEvent(`칭호 「${t.name}」을(를) 얻었다.`);
      this.queue.push({ type: 'toast', text: `칭호 획득 · 「${t.name}」 (${modsText(t.mods)})` });
    }
  },
  equipTitle(id) {
    const p = this.player;
    if (id && !p.titles.includes(id)) return '';
    p.title = p.title === id ? null : id; this.recalc();
    return p.title ? `칭호 「${titleById(id).name}」을(를) 달았다.` : '칭호를 뗐다.';
  },

  // ---------- 공식 등급 ----------
  remeasureCost() { return Math.round(150 * RANKS[this.player.rankIdx].mult ** 1.5); },
  remeasure() {
    const p = this.player;
    if (!this.onCity()) return '관리국 측정은 도시의 협회 의뢰소에서 받을 수 있다.';
    const cost = this.remeasureCost();
    if (p.money < cost) return '크레딧이 부족하다.';
    p.money -= cost;
    const gap = p.rankIdx - p.official;
    const prev = p.official; p.official = p.rankIdx;
    const surge = this.flags.story.reawakened && !this.flags.reawakenMeasured;
    if (surge) this.flags.reawakenMeasured = true;
    if (gap <= 0 && !surge) return `측정 결과는 그대로다. 관리국 등록 등급 ${RANKS[p.official].key}급.`;
    let msg = `측정기의 수치가 치솟았다. 관리국 등록 등급 ${RANKS[prev].key}급 → ${RANKS[p.official].key}급.`;
    const fame = Math.max(0, gap) * 12 + (surge ? 15 : 0);
    p.fame += fame;
    if (surge) msg += ' 측정기가 과부하로 불꽃을 튀겼다. 재각성의 흔적이다.';
    if (gap >= 2 || surge) {
      this.flags.measureError = true;
      this.lifeEvent(`재측정에서 ${RANKS[prev].key}급이 ${RANKS[p.official].key}급으로 뒤집혔다.`);
      this.rumor(`관리국 재측정 이변! ${RANKS[prev].key}급으로 등록돼 있던 ${p.name}이(가) ${RANKS[p.official].key}급 판정을 받았다.`);
    }
    this.sponsorAct('explore', gap >= 2 ? 4 : 0);
    this.save();
    return msg + (fame ? ` 명성 +${fame}` : '');
  },

  // ---------- 스킬 숙련 ----------
  skillLv(id) { const xp = (this.player.skillXp || {})[id] || 0; let lv = 1; for (let i = 1; i < SKILL_LV_REQ.length; i++) if (xp >= SKILL_LV_REQ[i]) lv = i + 1; return lv; },
  skillEff(sk) {
    if (!sk || sk.id === 'strike' || sk._eff || !this.player) return sk;
    const lv = this.skillLv(sk.id);
    if (lv <= 1) return sk;
    return { ...sk, _eff: true, lv, awakened: lv >= 5, name: lv >= 5 ? `${sk.name}·각성` : sk.name,
      power: Math.round(sk.power * (1 + 0.06 * (lv - 1) + (lv >= 5 ? 0.12 : 0)) * 1000) / 1000,
      mp: Math.max(0, Math.round(sk.mp * (1 - 0.05 * (lv - 1)))) };
  },
  skillUse(id) {
    const p = this.player; if (!p || id === 'strike') return '';
    const before = this.skillLv(id);
    p.skillXp[id] = (p.skillXp[id] || 0) + 1;
    const after = this.skillLv(id);
    if (after === before) return '';
    const sk = skillById(id);
    if (after >= 5) { this.lifeEvent(`스킬 [${sk.name}]이(가) 각성했다.`); return `[스킬 각성] ${sk.name}이(가) 한계를 넘어섰다!`; }
    return `[스킬 숙련] ${sk.name} Lv${after}`;
  },

  // ---------- 게이트 변이 ----------
  rollGateVariant(g) {
    if (g.variant !== undefined) return;
    if (g.final || g.mission || g.bid || g.breakCity) { g.variant = 'normal'; return; }
    const r = RNG.next();
    if (g.tier >= 2 && r < 0.07) g.variant = 'red';
    else if (r < 0.18) g.variant = 'double';
    else if (r < 0.27 && g.tier < 7) { g.variant = 'misrank'; g.realTier = Math.min(7, g.tier + RNG.int(1, 2)); }
    else g.variant = 'normal';
  },

  // ---------- 방송 ----------
  streamResult(gate, result) {
    const p = this.player; const red = gate.variant === 'red';
    if (result === 'clear') {
      const t = gate.realTier ?? gate.tier;
      const gain = Math.round((t + 1) ** 1.7 * 140 * RNG.range(0.7, 1.3) * (red ? 2 : 1) * (gate.variant === 'misrank' ? 1.5 : 1) * (1 + Math.min(p.fame, 1000) / 400));
      const money = Math.round(25 * (t + 1) * RANKS[t].mult * (red ? 2 : 1));
      p.followers += gain; p.streams++; p.money += money; p.fame += 1;
      this.sponsorAct('wealth', 3);
      return [`방송 성공! 동시 접속이 폭발했다. 구독자 +${fmt(gain)}, 후원금 ${fmt(money)} 크레딧, 명성 +1`];
    }
    if (result === 'retreat') { const l = Math.floor(p.followers * 0.04); p.followers -= l; p.fame = Math.max(0, p.fame - 1); return [`철수 장면에 채팅창이 싸늘해졌다. 구독자 -${fmt(l)}, 명성 -1`]; }
    const l = Math.floor(p.followers * 0.1); p.followers -= l; p.fame = Math.max(0, p.fame - 3);
    return [`방송 사고. 쓰러지는 장면이 그대로 송출됐다. 구독자 -${fmt(l)}, 명성 -3`];
  },
  adIncome() { return Math.floor((this.player.followers || 0) / 40); },

  // ---------- 랭킹 ----------
  rankScore(n) { return n.rankIdx * 1000 + n.stage * 300 + n.talent * 15 + (n.id % 37); },
  playerRankScore() { const p = this.player; return p.official * 1000 + (p.official === p.rankIdx ? p.stage * 300 : 0) + Math.min(p.fame, 2000) * 0.6 + p.record.gates * 4; },
  ranking() {
    const p = this.player;
    const list = this.adults().filter((n) => n.region !== 'jeju' || n.rankIdx >= 6).map((n) => ({ npc: n, name: n.name, rank: n.rankIdx, score: this.rankScore(n) }));
    list.push({ me: true, name: p.name, rank: p.official, score: this.playerRankScore() });
    list.sort((a, b) => b.score - a.score);
    return { list, pos: list.findIndex((x) => x.me) + 1 };
  },
  checkRanking() {
    const p = this.player; const { pos } = this.ranking();
    const best = p.bestRankPos;
    if (best != null && pos >= best) return;
    p.bestRankPos = pos;
    for (const th of [1, 3, 10, 30]) {
      if (pos <= th && (best == null || best > th)) {
        const txt = th === 1 ? `${p.name}, 국내 헌터 랭킹 1위 등극!` : `${p.name}이(가) 국내 헌터 랭킹 ${th}위 안에 진입했다.`;
        this.rumor(txt); this.log(txt, 'good');
        if (th <= 3) this.lifeEvent(`국내 헌터 랭킹 ${pos}위에 올랐다.`);
        break;
      }
    }
  },

  // ---------- 코어 시세 ----------
  corePrice(t) { return Math.max(1, Math.round(18 * RANKS[t].mult ** 1.6 * (this.world.coreIdx[t] || 1))); },
  coreTrend(t) { const w = this.world; const d = (w.coreIdx[t] || 1) - (w.corePrev[t] || 1); return Math.abs(d) < 0.02 ? 0 : d > 0 ? 1 : -1; },
  coreMarketMonthly() {
    const w = this.world;
    w.corePrev = w.coreIdx.slice();
    const breakPush = this.world.breaks.length ? -0.04 : 0;
    w.coreIdx = w.coreIdx.map((v) => Math.max(0.45, Math.min(2.2, v + (1 - v) * 0.15 + RNG.range(-0.08, 0.08) + breakPush)));
    if (RNG.chance(0.07)) {
      const t = RNG.int(0, 7);
      if (RNG.chance(0.55)) { w.coreIdx[t] = Math.min(2.2, w.coreIdx[t] + 0.5); this.rumor(`에테르 발전소 수요 폭증으로 ${coreName(t)} 시세가 급등했다.`); }
      else { w.coreIdx[t] = Math.max(0.45, w.coreIdx[t] - 0.35); this.rumor(`대형 길드가 ${coreName(t)} 재고를 풀었다. 시세 급락.`); }
    }
  },

  // ---------- 길드 공략권 입찰 ----------
  guildPower(id) {
    const p = this.player;
    let v = this.world.guildPrestige[id] || 0;
    for (const n of this.adults()) if (n.guild === id) v += RANKS[n.rankIdx].mult * 3;
    if (p.guild === id) v += RANKS[p.rankIdx].mult * 4 + p.guildRank * 3;
    return Math.round(v);
  },
  bidUnit() { const b = this.world.bid; return b ? Math.round(300 * RANKS[b.tier].mult) : 0; },
  bidContribute() {
    const p = this.player; const b = this.world.bid;
    if (!b || !p.guild) return '';
    if (b.mine >= 3) return '이번 입찰에는 더 보탤 수 없다.';
    const c = this.bidUnit();
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; b.mine = (b.mine || 0) + 1; b.paid = (b.paid || 0) + c;
    p.contrib += Math.round(c / 40);
    const lines = []; this.checkGuildRank(lines);
    return `길드 입찰 자금에 ${fmt(c)} 크레딧을 보탰다. 공헌도 +${Math.round(c / 40)}${lines.length ? ' · ' + lines.join(' · ') : ''}`;
  },
  guildBidMonthly() {
    const w = this.world; const p = this.player; const mk = this.monthKey();
    if (w.bid && mk >= w.bid.until) {
      const b = w.bid; w.bid = null;
      const scores = Object.keys(GUILDS).map((id) => ({ id, s: this.guildPower(id) * RNG.range(0.75, 1.25) + (id === b.guild ? (b.mine || 0) * 18 : 0) }));
      scores.sort((a, x) => x.s - a.s);
      const win = scores[0].id;
      for (const id of Object.keys(GUILDS)) w.guildPrestige[id] = Math.max(10, (w.guildPrestige[id] || 0) + (id === win ? 6 : -1));
      const reg = regionById(b.region);
      this.rumor(`${GUILDS[win].name}이(가) ${scores[1] ? GUILDS[scores[1].id].name + '을(를) 제치고 ' : ''}${reg.name} ${RANKS[b.tier].key}급 게이트 공략권을 따냈다.`);
      if (p.guild && win === p.guild) {
        const pos = this.randomFreeTile(b.region);
        if (pos) {
          const g = { id: this.nextObjId++, kind: 'gate', x: pos[0], y: pos[1], region: b.region, tier: b.tier, theme: '길드 낙찰 게이트', elem: pickElem(), born: mk, bid: true, variant: 'normal' };
          this.mapGates.push(g);
          this.log(`${GUILDS[win].name}이(가) ${reg.name} ${RANKS[b.tier].key}급 게이트 공략권을 따냈다. 길드가 당신에게 공략을 맡겼다.`, 'good');
          this.queue.push({ type: 'toast', text: `길드 낙찰! ${reg.name}에 ${RANKS[b.tier].key}급 낙찰 게이트가 열렸다.` });
        }
      } else if (b.paid && b.guild === p.guild) {
        const back = Math.round(b.paid * 0.5); p.money += back;
        this.log(`입찰에서 밀렸다. 보탠 자금의 절반 ${fmt(back)} 크레딧이 돌아왔다.`, 'bad');
      }
    }
    if (!w.bid && RNG.chance(0.3)) {
      const reg = RNG.pick(REGIONS.filter((r) => r.danger >= 2 && r.id !== 'jeju'));
      const tier = Math.max(3, Math.min(7, GATE_RANGES[reg.danger][1] + RNG.int(0, 1)));
      w.bid = { region: reg.id, tier, until: mk + 1, guild: p.guild || null, mine: 0, paid: 0 };
      this.rumor(`관리국이 ${reg.name} ${RANKS[tier].key}급 게이트 공략권 입찰을 공고했다. 5대 길드가 움직인다.`);
    } else if (w.bid && p.guild && !w.bid.mine) w.bid.guild = p.guild;
  },

  // ---------- 후원자 ----------
  sponsor() { const p = this.player; return p && p.sponsor ? SPONSORS[p.sponsor.id] : null; },
  sponsorTier() { const p = this.player; if (!p.sponsor) return 0; if (p.sponsor.chosen) return 3; const t = SPONSOR_TIERS.find(([v]) => p.sponsor.favor >= v); return t ? t[1] : 0; },
  sponsorAct(kind, amt) {
    const p = this.player; const s = this.sponsor(); if (!s || !amt) return;
    let d = 0;
    if (s.like === kind) d = amt; else if (s.hate === kind) d = -amt; else return;
    const tier0 = this.sponsorTier();
    p.sponsor.favor = Math.max(0, Math.min(100, p.sponsor.favor + d));
    if (p.sponsor.favor >= 100 && !p.sponsor.chosen) {
      p.sponsor.chosen = true;
      this.lifeEvent(`후원자 ${s.name}에게 선택받았다.`);
    }
    const tier1 = this.sponsorTier();
    const mk = this.monthKey();
    if (tier1 !== tier0) {
      this.recalc();
      this.queue.push({ type: 'toast', text: tier1 > tier0 ? `[후원자] ${s.name}의 ${['', '관심', '총애', '선택'][tier1]}을 받는다. (${modsText(s.bless, tier1)})` : `[후원자] ${s.name}의 관심이 식었다.` });
      p.sponsor.msgAt = mk;
    } else if (Math.abs(d) >= 3 && p.sponsor.msgAt !== mk && RNG.chance(0.45)) {
      p.sponsor.msgAt = mk;
      this.queue.push({ type: 'toast', text: `[후원자] ${RNG.pick(d > 0 ? s.up : s.down)}` });
    }
  },
  sponsorMonthly() {
    const p = this.player; const s = this.sponsor(); if (!s) return;
    if (!p.sponsor.chosen) p.sponsor.favor = Math.max(0, p.sponsor.favor - 1);
    if (this.sponsorTier() >= 2 && RNG.chance(0.12)) {
      const gift = { ash: { ether: 30 }, star: RNG.chance(0.3) ? { relic: true } : { ether: 20 }, warden: { item: ['potion', 3] }, gold: { money: 400 } }[p.sponsor.id];
      const txt = this.gain(gift);
      this.log(`[후원자] ${s.name}이(가) 선물을 내렸다.${txt}`, 'good');
    }
  },
  takeSponsor(id) {
    this.player.sponsor = { id, favor: 10, chosen: false, since: this.dateStr() };
    this.lifeEvent(`후원자 ${SPONSORS[id].name}와(과) 계약했다.`);
  },

  // ---------- 시련의 탑 ----------
  towerSpec(n) {
    const tier = Math.min(7, Math.floor((n - 1) / 6));
    const rule = n % 10 === 0 ? 'boss2' : n % 5 === 0 ? 'boss' : n % 4 === 0 ? 'solo' : n % 7 === 0 ? 'elite' : n % 3 === 0 ? 'elem' : 'normal';
    const label = { boss2: '쌍두 수문장', boss: '수문장', solo: '단독 시험 · 동료 없이', elite: '정예 시험', elem: '속성 시험', normal: '일반 시험' }[rule];
    return { n, tier, rule, label };
  },
  towerEnemies(spec) {
    const { tier, rule, n } = spec; const list = [];
    const elem = rule === 'elem' ? pickElem() : null;
    if (rule === 'boss' || rule === 'boss2') {
      list.push(this.makeMonster(tier, true, elem));
      if (rule === 'boss2') list.push(this.makeMonster(tier, true, elem)); else list.push(this.makeMonster(tier, false, elem));
    } else {
      const cnt = rule === 'solo' ? RNG.int(1, 2) : RNG.int(2, 3);
      for (let k = 0; k < cnt; k++) list.push(this.makeMonster(tier, false, elem));
    }
    const step = 1 + ((n - 1) % 6) * 0.06;
    for (const e of list) {
      if (elem) e.elem = elem;
      const em = rule === 'elite' ? 1.4 : 1;
      e.hp = e.maxHp = Math.round(e.hp * step * em); e.atk = Math.round(e.atk * (rule === 'elite' ? 1.15 : 1) * (1 + (step - 1) / 2));
    }
    return rule === 'solo' ? list : this.scaleForParty(list, tier);
  },
  towerReward(spec) {
    const p = this.player; const first = spec.n > p.tower.best;
    const m = RANKS[spec.tier].mult;
    const money = Math.round(50 * m * (1 + (spec.n % 6) * 0.2) * (first ? 1 : 0.3));
    const ether = Math.round(4 * m ** 1.2 * (first ? 1 : 0.3));
    p.money += money; this.addEther(ether);
    const out = [`${fmt(money)} 크레딧`, `에테르 ${fmt(ether)}`];
    if (first) {
      p.tower.best = spec.n;
      if (spec.n % 10 === 0) { const k = this.catalystKey(); p.items[k] = (p.items[k] || 0) + 1; out.push(`${RANKS[p.rankIdx].key}급 각성 촉매`); }
      else if (spec.n % 5 === 0) out.push(this.addRelic(null, spec.n >= 20 ? 1 : undefined));
      if (spec.n % 10 === 0) this.rumor(`${p.name}이(가) 시련의 탑 ${spec.n}층을 돌파했다.`);
      this.sponsorAct('explore', 2);
    }
    return (first ? '첫 돌파 보상: ' : '반복 보상: ') + out.join(', ');
  },
  canTower() { return this.player.tower.month !== this.monthKey(); },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) { base.call(this); this.hunterInit(); });
  wrap('save', function (base) { if (!this.over && this.player && this.player.titles) this.checkTitles(); return base.call(this); });
  wrap('extraMod', function (base, key) {
    let v = base.call(this, key);
    const p = this.player;
    const t = p.title && titleById(p.title); if (t && t.mods[key]) v += t.mods[key];
    const s = this.sponsor(); if (s && s.bless[key]) v += s.bless[key] * this.sponsorTier();
    return v;
  });
  // 시험 뒤 협회 측정 결과는 곧 공식 등급이다
  if (GP.revealAwakenRank) wrap('revealAwakenRank', function (base) { const r = base.call(this); const p = this.player; if (p.official == null || p.official < p.rankIdx) p.official = p.rankIdx; return r; });
  wrap('canJeju', function () { const p = this.player; return p.rankIdx >= 6 && (p.official ?? p.rankIdx) >= 6; });
  wrap('worldMonthly', function (base) {
    base.call(this);
    const p = this.player;
    this.coreMarketMonthly();
    this.guildBidMonthly();
    this.sponsorMonthly();
    if (p.followers > 0) p.followers = Math.floor(p.followers * 0.985);
    this.checkRanking();
  });
  wrap('spawnMonthly', function (base) { base.call(this); for (const g of this.mapGates) this.rollGateVariant(g); });
  wrap('gateName', function (base, g) {
    const n = base.call(this, g);
    if (g.variant === 'red') return `[레드] ${n}`;
    if (g.bid) return `낙찰 · ${n}`;
    if (g.variant === 'misrank' && g.revealedMis) return `${n} (실제 ${RANKS[g.realTier].key}급)`;
    return n;
  });
  wrap('gateRooms', function (base, g) {
    if (g.variant === 'misrank') { g.revealedMis = true; return base.call(this, { ...g, tier: g.realTier }); }
    const rooms = base.call(this, g);
    if (g.variant === 'red') {
      const extra = []; for (let k = RNG.int(2, 3); k > 0; k--) extra.push(this.makeMonster(g.tier, false, g.elem));
      rooms.splice(rooms.length - 1, 0, this.scaleForParty(extra, g.tier));
      for (const e of rooms[rooms.length - 1]) if (e.boss) { e.hp = e.maxHp = Math.round(e.maxHp * 1.25); e.atk = Math.round(e.atk * 1.1); e.name = e.name.replace('[보스]', '[붉은 보스]'); }
    }
    return rooms;
  });
  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const p = this.player;
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (result === 'clear') {
      if (gate.variant === 'red') {
        p.record.red++;
        const bonus = Math.round(loot.money * 0.5); p.money += bonus; p.fame += 6;
        lines.push(`레드 게이트를 깨뜨렸다! 추가 보상 ${fmt(bonus)} 크레딧, 명성 +6`);
        if (RNG.chance(0.6)) lines.push(`붉은 핵에서: ${this.addRelic()}`);
        this.lifeEvent(`${RANKS[gate.tier].key}급 레드 게이트에서 살아 돌아왔다.`);
      }
      if (gate.variant === 'misrank') {
        p.record.misrank++;
        const comp = Math.round(200 * RANKS[gate.realTier].mult); p.money += comp; p.fame += 4;
        lines.push(`등급 오판 게이트였다. 실제 ${RANKS[gate.realTier].key}급. 관리국 보상금 ${fmt(comp)} 크레딧, 명성 +4`);
        this.rumor(`관리국의 등급 오판! ${RANKS[gate.tier].key}급으로 공지된 게이트가 실제 ${RANKS[gate.realTier].key}급이었다. ${p.name}이(가) 공략.`);
      }
      if (loot.hidden) {
        p.record.hidden++;
        lines.push(`숨겨진 구역의 보물: ${this.addRelic(null, RNG.weighted([1, 2, 3], [60, 30, 10]))}`);
        this.sponsorAct('explore', 8);
      }
      if (gate.bid) {
        p.record.bidGates++;
        const c = 50 * (gate.tier + 1); p.contrib += c;
        if (p.guild) this.world.guildPrestige[p.guild] = (this.world.guildPrestige[p.guild] || 0) + 8;
        lines.push(`낙찰 게이트 공략: 공헌도 +${c}, 길드 위세 상승`);
        this.checkGuildRank(lines);
      }
      const realT = gate.realTier ?? gate.tier;
      if (!gate.breakCity && realT > p.official) { const f = (realT - p.official) * 2; p.fame += f; lines.push(`공식 등급(${RANKS[p.official].key}급)보다 높은 게이트를 깼다. 명성 +${f}`); }
      if (gate.breakCity) { p.record.breaks++; this.sponsorAct('protect', 10); }
      this.sponsorAct('carnage', Math.min(8, Math.round((loot.kills || 0) * 0.6)));
    } else if (result === 'retreat') this.sponsorAct('retreat', 4);
    else if (result === 'lose') {
      this.sponsorAct('loss', 5);
      if (gate.variant === 'red') {
        p.lifePenalty += 3; p.injured = Math.max(p.injured, 6); this.recalc();
        lines.push('<span class="bad">레드 게이트는 구조대도 들어올 수 없었다. 게이트가 저절로 닫히며 바깥으로 내던져졌다. 수명 -3년, 부상 6개월.</span>');
      }
    }
    this.checkTitles(); this.save();
    return lines;
  });
  wrap('finishMob', function (base, mob, result, kills, hpLeft, mpLeft) {
    const lines = base.call(this, mob, result, kills, hpLeft, mpLeft);
    if (result === 'win') this.sponsorAct('carnage', Math.min(5, Math.round(kills.length * 0.6)));
    if (result === 'lose') this.sponsorAct('loss', 4);
    if (result === 'flee') this.sponsorAct('retreat', 2);
    return lines;
  });
  wrap('finishDuel', function (base, n, won, hp, mp) {
    const villain = n.relation <= -20 || persById(n.personality).id === 'warlike';
    const r = base.call(this, n, won, hp, mp);
    if (won) { this.sponsorAct('carnage', 6); if (!villain) this.sponsorAct('murder', 12); }
    return r;
  });
  wrap('payBounty', function (base, q) { const r = base.call(this, q); this.sponsorAct('protect', 3); return r; });
  wrap('visitCity', function (base, regionId) { const first = !this.player.visited.includes(regionId); base.call(this, regionId); if (first) this.sponsorAct('explore', 5); });
  wrap('rest', function (base) { this.sponsorAct('idle', 2); return base.call(this); });
  wrap('sellCores', function (base, tier) {
    const n = this.coreCount(tier); if (!n) return '';
    const v = this.corePrice(tier) * n;
    this.player.mats['c' + tier] = 0; this.player.money += v; this.player.coreSales += v;
    this.sponsorAct('wealth', Math.min(8, Math.round(v / (120 * RANKS[this.player.rankIdx].mult))));
    return `${coreName(tier)} ${n}개를 ${fmt(v)} 크레딧에 넘겼다.`;
  });
  wrap('gameOver', function (base, reason) {
    base.call(this, reason);
    try {
      const p = this.player; const prev = JSON.parse(localStorage.getItem(REGRESS_KEY) || 'null') || {};
      const chains = Object.keys(this.flags.chains || {}).filter((k) => this.flags.chains[k] > 0 && CHAIN_NAMES[k]);
      const data = {
        lives: (prev.lives || 0) + 1, bestRank: Math.max(prev.bestRank || 0, p.rankIdx),
        titles: [...new Set([...(prev.titles || []), ...(p.titles || [])])],
        chains: [...new Set([...(prev.chains || []), ...chains])],
        lastName: p.name, lastAge: this.ageYears(), lastDate: this.dateStr(), lastRank: p.rankIdx,
      };
      localStorage.setItem(REGRESS_KEY, JSON.stringify(data));
    } catch (e) { /* 저장 불가 */ }
  });
  wrap('newGame', function (base, opts) {
    base.call(this, opts);
    if (!Game.regressNext) return;
    Game.regressNext = false;
    const d = Game.regressData(); if (!d) return;
    const p = this.player; const lives = d.lives || 1;
    p.regress = { count: lives, bestRank: d.bestRank || 0, chains: d.chains || [], lastName: d.lastName, lastDate: d.lastDate, lastAge: d.lastAge };
    p.titles = [...new Set([...p.titles, ...(d.titles || []).filter((id) => titleById(id))])];
    p.talent += Math.min(3, lives);
    p.money += 800 * Math.min(5, lives);
    p.items.potion = (p.items.potion || 0) + 3;
    this.flags.story.regressor = true;
    this.recalc();
    this.lifeEvent(`${lives + 1}번째 삶. ${d.lastName ? `${d.lastName}(으)로 살다 ${d.lastAge}세에 죽은 기억` : '죽음의 기억'}을 안고 ${this.year}년 ${this.month}월로 돌아왔다.`);
    this.checkTitles();
    this.save();
  });
  Game.regressData = () => { try { return JSON.parse(localStorage.getItem(REGRESS_KEY) || 'null'); } catch (e) { return null; } };

  // 스킬 숙련: 플레이어가 쓴 스킬은 숙련도가 오르고, 숙련도만큼 강해진다
  const baseUse = Combat.prototype.useSkill;
  Combat.prototype.useSkill = function (u, skill, target) {
    const g = this.game;
    if (!u.isPlayer || !skill || skill.id === 'strike' || !g.skillEff) return baseUse.call(this, u, skill, target);
    skill = g.skillEff(skill);
    const up = g.skillUse(skill.id);
    baseUse.call(this, u, skill, target);
    if (up) this.push(up, 'good', { k: 'note', dst: u.id });
    if (skill.awakened && ['dmg', 'crit', 'pierce', 'drain', 'stun'].includes(skill.type) && !this.result) {
      const others = this.foesOf(u).filter((f) => f !== target);
      if (others.length && Math.random() < 0.4) {
        this.push('각성의 여운이 옆으로 번진다!', 'hit');
        this.dealDamage(u, others[Math.floor(Math.random() * others.length)], { ...skill, power: skill.power * 0.5 });
        this.checkEnd();
      }
    }
  };
}

// ---------- 사건 ----------
S({ id: 'sponsor_offer', at: ['city', 'field'], minRank: 1, once: true, weight: 0.7, when: (g) => !g.player.sponsor, text: '잠들기 직전, 시야 한구석에 글자가 떠올랐다. [당신을 지켜보는 존재들이 있습니다.] 넷의 그림자가 어른거린다. 하나는 피를, 하나는 길을, 하나는 사람을, 하나는 돈을 원한다. [후원 계약을 맺으시겠습니까?]',
  choices: [
    ...Object.entries(SPONSORS).map(([id, s]) => ({ text: `${s.name} — ${s.likeText}`, do: (g) => { g.takeSponsor(id); return `[${s.name}와(과) 계약했습니다.] ${s.likeText}을(를) 보이면 기뻐하고, ${s.hateText}을(를) 싫어한다. 호감이 쌓이면 축복이 내린다. (${modsText(s.bless)}부터)`; } })),
    { text: '거절한다', do: (g) => { g.flags.story.sponsorRefused = true; return '글자가 흩어졌다. 그림자들이 아쉬운 듯 물러났다. 언젠가 다시 올지도 모른다.'; } },
  ] });
S({ id: 'sponsor_offer2', at: ['city', 'field'], minRank: 4, once: true, weight: 0.5, when: (g) => !g.player.sponsor && g.flags.story.sponsorRefused, text: '[당신의 이름이 저편에서 다시 거론되고 있습니다.] 예전의 그림자들이 돌아왔다. 이번엔 더 가까이.',
  choices: [
    ...Object.entries(SPONSORS).map(([id, s]) => ({ text: `${s.name} — ${s.likeText}`, do: (g) => { g.takeSponsor(id); g.player.sponsor.favor = 25; return `[${s.name}와(과) 계약했습니다.] 오래 기다렸다는 듯 호감이 높다.`; } })),
    { text: '끝까지 거절한다', do: () => '그림자들이 완전히 떠났다. 당신의 길은 당신 혼자 간다.' },
  ] });
S({ id: 'reawaken', at: ['city', 'field'], minRank: 0, maxRank: 3, once: true, weight: 0.35, when: (g) => g.ageYears() >= 20, text: '새벽, 온몸의 혈관이 타는 듯 뜨거워졌다. 이미 각성한 몸에서 에테르가 다시 끓어오른다. 드물게 일어난다는 재각성이다.',
  choices: [
    { text: '흐름에 몸을 맡긴다', do: (g) => { g.flags.story.reawakened = true; g.lifeEvent('재각성을 겪었다.'); return '눈을 떴을 때 세상이 달라 보였다. 관리국에서 재측정을 받으면 놀랄 것이다.' + g.gain({ talent: 2, ether: 40, skill: true }); } },
    { text: '억누른다', do: (g) => '이를 악물고 버텼다. 열기가 서서히 가라앉았다.' + g.gain({ hp: -0.3, ether: 15 }) },
  ] });
// (방송 제안 사건은 사용자 요청으로 삭제)

// ---------- 화면 ----------
Object.assign(UI, {
  hunterHtml() {
    const p = G.player;
    const t = p.title && titleById(p.title);
    const { list, pos, total } = G.ranking();
    const s = G.sponsor();
    const off = p.official;
    const titleRows = TITLES.map((x) => {
      const own = p.titles.includes(x.id); const on = p.title === x.id;
      return `<div class="item-row ${on ? 'equipped' : ''} ${own ? '' : 'locked'}"><div class="grow"><b class="${own ? 'amber' : 'dim'}">「${x.name}」</b> <span class="small dim">${x.how}</span><div class="small ${own ? '' : 'dim'}">${modsText(x.mods)}</div></div>
        ${own ? `<button class="sm ${on ? 'primary' : ''}" data-act="title" data-v="${x.id}">${on ? '장착 중' : '달기'}</button>` : '<span class="small dim">미획득</span>'}</div>`;
    }).join('');
    const top = list.slice(0, 10).map((x, i) => `<div class="item-row ${x.me ? 'hl' : ''}"><b class="num rank-pos">${i + 1}</b><div class="grow"><b>${x.name}</b>${x.me ? ' <span class="tag amber">나</span>' : ''}</div>${this.rankTag(x.rank)}</div>`).join('');
    const tierName = ['', '관심', '총애', '선택'][G.sponsorTier()];
    return `<div class="panel"><h3>헌터 기록</h3>
      <div class="sec"><div class="sec-title">관리국 등록</div>
        <div class="item-row ${off < p.rankIdx ? 'hl' : ''}"><div class="grow"><b>공식 등급 ${RANKS[off].key}급</b> <span class="small dim">실제 ${rankLabel(p.rankIdx, p.stage)}</span>
          <div class="small dim">${off < p.rankIdx ? '실력이 등록 등급보다 높다. 도시의 협회 의뢰소에서 재측정을 받으면 공식 등급이 오르고, 차이가 클수록 화제가 된다.' : '등록 등급이 실력과 같다.'} 의뢰 난이도, 길드 월급, 랭킹, 제주 출입은 공식 등급을 따른다.</div></div></div></div>
      <div class="sec"><div class="sec-title">국내 헌터 랭킹 · 내 순위 ${fmt(pos)}위 / ${fmt(total || list.length)}명</div>
        <p class="small dim">공식 등급, 명성, 공략 횟수로 매달 집계된다.${p.bestRankPos ? ` 최고 ${p.bestRankPos}위.` : ''}</p>
        <div class="cards">${top}</div></div>
      <div class="sec"><div class="sec-title">후원자</div>
        ${s ? `<div class="item-row" style="border-left:3px solid ${s.color}"><div class="grow"><b style="color:${s.color}">${s.name}</b> ${tierName ? `<span class="tag">${tierName}</span>` : ''}
          <div class="small dim">좋아함: ${s.likeText} · 싫어함: ${s.hateText}</div>${this.bar('ether', p.sponsor.favor, 100)}
          <div class="small">호감 ${p.sponsor.favor}/100 · 축복 ${G.sponsorTier() ? modsText(s.bless, G.sponsorTier()) : '없음 (30부터)'}</div></div></div>`
        : '<p class="small dim">아직 후원 계약이 없다. 언젠가 저편의 존재들이 당신을 찾아올지도 모른다.</p>'}</div>
      <div class="sec"><div class="sec-title">시련의 탑</div><p class="small">최고 기록 <b class="num">${p.tower.best}</b>층 <span class="dim small">· 대전의 탑에서 한 달에 한 번 도전</span></p></div>
      <div class="sec"><div class="sec-title">칭호 · ${p.titles.length}/${TITLES.length}</div>
        <p class="small dim">칭호 하나를 달면 효과가 붙는다. ${t ? `지금: <b class="amber">「${t.name}」</b> ${modsText(t.mods)}` : '아직 단 칭호가 없다.'}</p>
        <div class="cards">${titleRows}</div></div>
      ${p.regress ? `<div class="sec"><div class="sec-title">회귀자의 기억 · ${p.regress.count + 1}번째 삶</div>
        <p class="small">지난 생: ${p.regress.lastName || '?'} · ${p.regress.lastAge || '?'}세에 죽음 · 최고 ${RANKS[p.regress.bestRank || 0].key}급</p>
        <p class="small dim">기억 속 기연: ${(p.regress.chains || []).map((c) => CHAIN_NAMES[c]).join(', ') || '없음'} — 이 기연들은 더 쉽게 찾아온다.</p></div>` : ''}
    </div>`;
  },

  remeasureHtml() {
    const p = G.player;
    return `<div class="item-row hl"><div class="grow"><b>관리국 등급 재측정</b> <span class="small">공식 ${RANKS[p.official].key}급</span>
      <div class="small dim">의뢰 난이도, 길드 월급, 랭킹, 제주 출입은 공식 등급을 따른다. 실력이 등록보다 높으면 재측정 때 화제가 된다.</div></div>
      <button class="sm" data-act="remeasure">${FX.icon('coin', 13)} <span class="num">${fmt(G.remeasureCost())}</span></button></div>`;
  },

  towerHtml() {
    const p = G.player; const next = p.tower.best + 1; const spec = G.towerSpec(next);
    const can = G.canTower();
    const preview = [0, 1, 2, 3, 4].map((i) => G.towerSpec(next + i)).map((s) => `<div class="item-row ${s.n === next ? 'hl' : ''}"><b class="num rank-pos">${s.n}층</b><div class="grow small">${s.label}</div>${this.rankTag(s.tier)}</div>`).join('');
    return `<p>구름을 뚫고 솟은 검은 탑. 층마다 다른 시험이 기다린다. 쓰러져도 탑이 밖으로 내뱉을 뿐 목숨은 잃지 않는다. 이긴 뒤 다음 층으로 오르거나 내려올 수 있고, 체력은 이어진다.</p>
      <p class="small dim">최고 기록 ${p.tower.best}층 · 5층마다 유물, 10층마다 각성 촉매 · 4층마다 동료 없이 혼자 치르는 시험</p>
      <div class="cards">${preview}</div>
      <div class="row end sec"><button class="primary" data-act="tower-go" ${can ? '' : 'disabled'}>${can ? `${next}층 도전 · ${spec.label}` : '이번 달은 이미 올랐다'}</button></div>`;
  },

  startTowerFloor(n) {
    const spec = G.towerSpec(n);
    const allies = spec.rule === 'solo' ? [G.playerUnit()] : this.allyUnits();
    this.ctx = { kind: 'tower', spec, elem: G.player.element, combat: new Combat(G, { allies, enemies: G.towerEnemies(spec), canFlee: false, title: `시련의 탑 ${n}층 · ${spec.label}` }) };
    this.openCombat();
  },
  towerResultHtml() {
    const c = this.ctx; const cb = c.combat;
    if (cb.result === 'win') {
      if (!c.counted) { c.counted = true; c.reward = G.towerReward(c.spec); G.player.record.kills += cb.kills.length; }
      return `<div class="result win"><b>${c.spec.n}층 통과</b> <span class="small">${c.reward}</span></div>
        <div class="row end"><button class="ghost" data-act="tower-leave">내려간다</button><button class="primary" data-act="tower-next">${c.spec.n + 1}층으로</button></div>`;
    }
    return `<div class="result lose"><b>쓰러졌다</b> <span class="small">탑이 당신을 밖으로 내뱉는다.</span></div><div class="row end"><button class="primary" data-act="tower-leave">탑 밖으로</button></div>`;
  },
  towerLeave() {
    const c = this.ctx; const cb = c.combat; const p = G.player;
    p.hp = Math.max(1, cb.result === 'win' ? cb.player.hp : Math.round(p.maxHp * 0.2)); p.mp = Math.max(0, cb.player.mp);
    p.tower.month = G.monthKey();
    const floor = cb.result === 'win' ? c.spec.n : c.spec.n - 1;
    G.log(`시련의 탑에 올랐다. ${cb.result === 'win' ? `${floor}층까지 통과.` : `${c.spec.n}층에서 쓰러졌다.`} (최고 ${p.tower.best}층)`, cb.result === 'win' ? 'good' : '');
    this.ctx = null;
    G.advanceDays(5, { eventChance: 0.05 });
    this.closeModal(); this.renderGame();
    this.toast(`탑에서 내려왔다. 최고 기록 ${p.tower.best}층.`);
    this.processQueue();
  },
});

{
  // 시설 화면
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id === 'tower') return this.towerHtml();
    const html = baseFac.call(this, id, reg);
    if (id === 'board') return `<div class="cards">${this.remeasureHtml()}</div>` + html;
    return html;
  };
  // 길드 화면: 세력 판도와 공략권 입찰
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const p = G.player; const b = G.world.bid;
    const ids = Object.keys(GUILDS).sort((a, x) => G.guildPower(x) - G.guildPower(a));
    const max = Math.max(...ids.map((id) => G.guildPower(id)));
    const power = ids.map((id, i) => { const g = GUILDS[id]; const v = G.guildPower(id); return `<div class="item-row ${id === p.guild ? 'hl' : ''}"><b class="num rank-pos">${i + 1}</b><div class="grow"><b style="color:${g.color}">${g.name}</b> <span class="small dim">세력 ${v}</span>${this.bar('ether', v, max)}</div></div>`; }).join('');
    const bid = b ? `<div class="item-row hl"><div class="grow"><b>${regionById(b.region).name} ${RANKS[b.tier].key}급 게이트 공략권</b> <span class="small dim">다음 달 낙찰</span>
        <div class="small dim">${p.guild ? `소속 길드가 따내면 그 게이트가 당신 몫이 된다. 자금을 보태면 낙찰 확률이 오른다. (보탠 횟수 ${b.mine || 0}/3, 실패하면 절반 환급)` : '길드에 소속돼 있으면 입찰에 자금을 보탤 수 있다.'}</div></div>
        ${p.guild ? `<button class="sm" data-act="guild-bid" ${(b.mine || 0) >= 3 ? 'disabled' : ''}>${FX.icon('coin', 13)} <span class="num">${fmt(G.bidUnit())}</span></button>` : ''}</div>`
      : '<div class="dim small">지금 공고된 입찰이 없다. 관리국이 고등급 게이트 공략권을 수시로 입찰에 부친다.</div>';
    return baseGuild.call(this) + `<div class="panel sec"><h3>세력 판도</h3><p class="small dim">길드원들의 실력과 위세로 매달 바뀐다. 입찰에서 이기고 낙찰 게이트를 깨면 위세가 오른다.</p><div class="cards">${power}</div>
      <div class="sec-title sec">공략권 입찰</div><div class="cards">${bid}</div></div>`;
  };
  // 스킬 숙련 표시
  const baseSkills = UI.skillsHtml;
  UI.skillsHtml = function () {
    let html = baseSkills.call(this);
    for (const id of G.player.skills) {
      if (id === 'strike') continue;
      const sk = skillById(id); const lv = G.skillLv(id); const xp = G.player.skillXp[id] || 0;
      const nextReq = SKILL_LV_REQ[lv];
      const tag = `<span class="tag ${lv >= 5 ? 'amber' : ''}">${lv >= 5 ? '각성' : `Lv${lv}`}</span> <span class="small dim">${nextReq ? `숙련 ${xp}/${nextReq}` : '최대'}</span>`;
      html = html.replace(`<b>${sk.name}</b>`, `<b>${sk.name}</b> ${tag}`);
    }
    return html.replace('같은 속성 스킬은 위력 +20%.', '같은 속성 스킬은 위력 +20%. 전투에서 쓸수록 숙련도가 올라 위력이 세지고 소모가 줄며, Lv5에서 각성한다.');
  };
  // 정보 화면에 칭호
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const p = G.player; const t = p.title && titleById(p.title);
    const tag = `<div class="small"><span class="amber">${t ? `「${t.name}」` : ''}</span> <span class="dim">공식 ${RANKS[p.official].key}급${p.sponsor ? ` · 후원자 ${SPONSORS[p.sponsor.id].name}` : ''}</span></div>`;
    return baseChar.call(this).replace(`<h3>${p.name}</h3>`, `<h3>${p.name}</h3>${tag}`);
  };
  // 전투 결과 (탑)
  const baseResult = UI.combatResultHtml;
  UI.combatResultHtml = function () { return this.ctx && this.ctx.kind === 'tower' ? this.towerResultHtml() : baseResult.call(this); };
  // 사망 화면: 회귀
  const baseOver = UI.showGameOver;
  UI.showGameOver = function () {
    baseOver.call(this);
    const row = $box.querySelector('.row.end');
    if (row && Game.regressData()) row.insertAdjacentHTML('afterbegin', '<button class="danger" data-act="regress-now">회귀한다</button>');
  };
  // 시작 방식 화면: 회귀 선택
  const baseMode = UI.renderMode;
  UI.renderMode = function () {
    baseMode.call(this);
    const d = Game.regressData(); if (!d) return;
    const on = !!this.regressOn;
    const grid = $app.querySelector('.mode-grid');
    if (grid) grid.insertAdjacentHTML('afterend', `<div class="panel regress-box ${on ? 'on' : ''}"><div class="grow"><div class="eyebrow">지난 생의 기억 · ${d.lives}번 죽었다</div>
      <b>${d.lastName ? `${d.lastName}, ${d.lastAge}세 · ${RANKS[d.lastRank || 0].key}급에서 끝난 삶` : '끝난 삶'}</b>
      <div class="small dim">회귀하면 재능·자금·칭호와 기연의 기억을 안고 2087년 3월로 돌아간다.</div></div>
      <button class="${on ? 'primary' : 'ghost'}" data-act="regress-toggle">${on ? '회귀자로 시작 ✔' : '회귀자로 시작'}</button></div>`);
  };
  // 새 게임 직전에 회귀 여부를 넘긴다
  const baseNew = Game.prototype.newGame;
  Game.prototype.newGame = function (opts) { if (UI.regressOn) { Game.regressNext = true; UI.regressOn = false; } return baseNew.call(this, opts); };
  // 계승: 칭호·숙련·방송·후원은 본인의 것이라 이어지지 않는다
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) {
    baseSucceed.call(this, id);
    const p = G.player;
    p.official = p.rankIdx; p.titles = []; p.title = null; p.skillXp = {}; p.tower = { best: 0, month: -1 };
    p.followers = Math.floor((p.followers || 0) * 0.5); p.streams = 0; p.sponsor = null; p.bestRankPos = null; p.coreSales = 0; p.regress = null;
    p.record = { gates: 0, kills: 0, npcKills: 0, breakthroughs: 0, fails: 0, red: 0, hidden: 0, misrank: 0, breaks: 0, bidGates: 0 };
    G.recalc(); G.save();
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'title': return this.after(G.equipTitle(v));
      case 'remeasure': return this.afterCity(G.remeasure());
      case 'guild-bid': return this.sheet === 'city' ? this.afterCity(G.bidContribute()) : this.after(G.bidContribute());
      case 'gate-info': { const g = G.mapGates.find((x) => x.id === +v); if (g) return this.encounter(g); return; }
      case 'g-hidden': {
        const c = this.ctx; const cb = c.combat; const g = c.gate;
        G.player.hp = cb.player.hp; G.player.mp = cb.player.mp;
        const t = Math.min(7, (g.realTier ?? g.tier) + 1);
        const boss = G.makeMonster(t, true, g.elem); boss.name = boss.name.replace('[보스]', '[숨은 보스]');
        c.rooms.push(G.scaleForParty([boss, G.makeMonster(t, false, g.elem)], t));
        c.inHidden = true; c.loot.hidden = true; c.roomIdx++; c.counted = false;
        return this.startRoom();
      }
      case 'tower-go': {
        if (!G.canTower()) return;
        G.player.tower.month = G.monthKey(); G.save();
        this.closeModal();
        return this.startTowerFloor(G.player.tower.best + 1);
      }
      case 'tower-next': {
        const c = this.ctx; const cb = c.combat; const p = G.player;
        p.hp = Math.min(p.maxHp, cb.player.hp + Math.floor(p.maxHp * 0.15)); p.mp = cb.player.mp;
        return this.startTowerFloor(c.spec.n + 1);
      }
      case 'tower-leave': return this.towerLeave();
      case 'regress-toggle': this.regressOn = !this.regressOn; return this.render();
      case 'regress-now': this.regressOn = true; this.closeModal(); this.screen = 'mode'; this.ctx = null; return this.render();
      default: return baseHandle.call(this, act, v);
    }
  };
}
