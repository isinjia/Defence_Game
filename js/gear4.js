// ===== 장비·아이템 (4): 방어구 계열 · 테마 세트 =====
// 사용자 승인: 방어구를 천·가죽·사슬·중갑·외골격으로 나누고 직업 상성 ±15%.
// 히든이 아닌 이름 있는 테마 세트(일반~영웅) — 게이트 드롭 + 제작 길드/장인에서도 만든다.
// 브랜드(회사 라벨)와 별개. 고유(신화)와도 별개.

const ARMOR_FAMS = {
  cloth: {
    name: '천',
    names: ['에테르 로브', '직물 코트', '명주 장막', '견습 수의'],
    mul: { def: 0.7, hp: 0.85, mp: 1.35 },
  },
  leather: {
    name: '가죽',
    names: ['사냥꾼 가죽갑', '야간 경갑', '정찰 베스트', '연마 가죽조끼'],
    mul: { def: 0.9, hp: 0.95, spd: 1.35 },
  },
  chain: {
    name: '사슬',
    names: ['사슬 코트', '링메일 수트', '연쇄 외투', '경량 사슬갑'],
    mul: { def: 1.05, hp: 1.05, spd: 1.05 },
  },
  plate: {
    name: '중갑',
    names: ['판금 흉갑', '중장 플레이트', '성벽 갑주', '철벽 수트'],
    mul: { def: 1.35, hp: 1.3, spd: 0.7 },
  },
  exo: {
    name: '외골격',
    names: ['산업 외골격', '하중 프레임', '돌격 엑소슈트', '중공업 하니스'],
    mul: { def: 1.2, hp: 1.25, atk: 0.35, mp: 0.75 },
  },
};
const GROUP_ARMOR_FAMS = {
  fighter: ['chain', 'plate', 'exo'],
  guard: ['plate', 'exo', 'chain'],
  shadow: ['leather', 'cloth'],
  shooter: ['leather', 'chain'],
  mage: ['cloth'],
  summon: ['cloth', 'exo'],
  support: ['cloth', 'leather'],
  esper: ['cloth', 'leather'],
  east: ['cloth', 'chain', 'leather'],
};
const ARMOR_FIT = 0.15;

const afamOfName = (name) => {
  for (const [k, f] of Object.entries(ARMOR_FAMS)) if (f.names.some((n) => name.includes(n))) return k;
  if (/로브|직물|명주|수의/.test(name)) return 'cloth';
  if (/가죽|경갑|베스트|조끼/.test(name)) return 'leather';
  if (/사슬|링메일|연쇄/.test(name)) return 'chain';
  if (/판금|플레이트|성벽|철벽|중장/.test(name)) return 'plate';
  if (/외골격|프레임|엑소|하니스/.test(name)) return 'exo';
  return null;
};

// pieces: slot + 선택적 fam(무기)/afam(방어구) + 고정 이름
// set: 2·3피스 효과 (extraMod 키)
const THEME_SETS = [
  {
    id: 'city_guard', name: '도심 경비대',
    pieces: [
      { slot: 'weapon', fam: 'shield', name: '경비대 방패' },
      { slot: 'armor', afam: 'plate', name: '경비대 중갑' },
      { slot: 'acc', name: '경비대 인식표' },
    ],
    set: { 2: { def: 0.06 }, 3: { def: 0.1, hp: 0.05 } },
    dropW: 3,
  },
  {
    id: 'night_scout', name: '야간 정찰',
    pieces: [
      { slot: 'weapon', fam: 'dagger', name: '야간 정찰 단검' },
      { slot: 'armor', afam: 'leather', name: '야간 정찰 경갑' },
      { slot: 'acc', name: '야광 신호칩' },
    ],
    set: { 2: { spd: 0.06 }, 3: { spd: 0.1, luck: 0.08 } },
    dropW: 3,
  },
  {
    id: 'azure_robe', name: '청룡 견습',
    pieces: [
      { slot: 'weapon', fam: 'staff', name: '견습 공명 로드' },
      { slot: 'armor', afam: 'cloth', name: '견습 연구 로브' },
      { slot: 'acc', name: '견습 에테르 핀' },
    ],
    set: { 2: { mp: 0.08 }, 3: { mp: 0.12, train: 0.06 } },
    dropW: 3, craftGuilds: ['cheongryong', 'greenlamp', 'daejeonjewel'],
  },
  {
    id: 'harbor_search', name: '항만 수색',
    pieces: [
      { slot: 'weapon', fam: 'gun', name: '항만 수색 권총' },
      { slot: 'armor', afam: 'leather', name: '방수 수색 베스트' },
    ],
    set: { 2: { luck: 0.1, spd: 0.04 } },
    dropW: 2, craftGuilds: ['harbor', 'ironbridge'],
  },
  {
    id: 'iron_line', name: '철벽 전선',
    pieces: [
      { slot: 'weapon', fam: 'spear', name: '전선 할버드' },
      { slot: 'armor', afam: 'plate', name: '전선 판금' },
      { slot: 'acc', name: '전선 통신기' },
    ],
    set: { 2: { def: 0.07, hp: 0.04 }, 3: { def: 0.12, hp: 0.08 } },
    dropW: 2, craftGuilds: ['baekho', 'suwonfort', 'suwonforge'],
  },
  {
    id: 'jujak_free', name: '주작 자유대',
    pieces: [
      { slot: 'weapon', fam: 'bow', name: '자유대 장궁' },
      { slot: 'armor', afam: 'leather', name: '자유대 경갑' },
      { slot: 'acc', name: '자유대 부적' },
    ],
    set: { 2: { spd: 0.05, luck: 0.08 }, 3: { spd: 0.08, luck: 0.12 } },
    dropW: 2, craftGuilds: ['jujak', 'haeundae'],
  },
  {
    id: 'factory_frame', name: '공장 골격조',
    pieces: [
      { slot: 'weapon', fam: 'fist', name: '골격 너클' },
      { slot: 'armor', afam: 'exo', name: '공장 하중 프레임' },
    ],
    set: { 2: { hp: 0.08, atk: 0.05 } },
    dropW: 2, craftGuilds: ['hyeonmu', 'bluesteel', 'ulsanframe'],
  },
  {
    id: 'archive_charm', name: '아카이브 부적',
    pieces: [
      { slot: 'weapon', fam: 'instr', name: '기록 하프' },
      { slot: 'armor', afam: 'cloth', name: '기록 보관 로브' },
      { slot: 'acc', name: '기억의 펜던트 복제' },
    ],
    set: { 2: { mp: 0.07, heal: 0.06 }, 3: { mp: 0.1, heal: 0.1, train: 0.04 } },
    dropW: 2, craftGuilds: ['daejeonjewel', 'hanok', 'cheongryong'],
  },
];
const themeById = (id) => THEME_SETS.find((t) => t.id === id);

Object.assign(Game.prototype, {
  armorFam(it) {
    if (!it || it.slot !== 'armor') return null;
    if (it.afam === undefined) it.afam = afamOfName(it.name || '');
    return it.afam;
  },
  armorFit(it) {
    const fam = this.armorFam(it); const p = this.player;
    if (!fam || !p || !p.cls) return 0;
    const c = classById(p.cls); if (!c || c.g === 'hidden') return 0;
    const ok = GROUP_ARMOR_FAMS[c.g] || [];
    return ok.includes(fam) ? ARMOR_FIT : -ARMOR_FIT;
  },
  themeCount() {
    const c = {};
    for (const e of Object.values(this.player.equip || {})) {
      if (!e || !e.theme) continue;
      c[e.theme] = (c[e.theme] || 0) + 1;
    }
    return c;
  },
  themeMod(key) {
    let v = 0;
    for (const [id, n] of Object.entries(this.themeCount())) {
      const T = themeById(id); if (!T) continue;
      const tier = n >= 3 && T.set[3] ? 3 : n >= 2 && T.set[2] ? 2 : 0;
      if (tier && T.set[tier][key]) v += T.set[tier][key];
    }
    return v;
  },
  makeThemePiece(setId, pieceIdx, tier, rarityIdx) {
    const T = themeById(setId); if (!T) return null;
    const pc = T.pieces[pieceIdx]; if (!pc) return null;
    const t = Math.max(0, Math.min(7, tier == null ? this.player.rankIdx : tier));
    const rar = rarityIdx == null ? RNG.weighted([0, 1, 2], [45, 40, 15]) : rarityIdx;
    const it = this.makeEquipment(pc.slot, t, Math.min(3, rar));
    // 테마 피스: 이름·계열을 고정하고 능력치를 살짝 정리
    const m = RANKS[t].mult * RARITY[it.rarity].mult;
    const base = { atk: 8 * m, def: 5 * m, hp: 30 * m, mp: 20 * m, spd: 2 * m, luck: 3 * RARITY[it.rarity].mult };
    for (const k of ['atk', 'def', 'hp', 'mp', 'spd', 'luck']) delete it[k];
    if (pc.slot === 'weapon') {
      it.atk = Math.round(base.atk);
      it.fam = pc.fam || it.fam;
      if (it.fam === 'shield') { it.def = Math.round(base.atk * 0.35); it.atk = Math.round(base.atk * 0.8); }
      if (it.fam === 'instr' || it.fam === 'staff') it.mp = Math.round(base.atk * 1.1);
      if (it.fam === 'dagger' || it.fam === 'bow') it.spd = Math.round(base.atk * 0.2);
    } else if (pc.slot === 'armor') {
      it.afam = pc.afam || 'chain';
      const A = ARMOR_FAMS[it.afam];
      it.def = Math.round(base.def * (A.mul.def || 1));
      it.hp = Math.round(base.hp * (A.mul.hp || 1));
      if (A.mul.mp) it.mp = Math.round(base.mp * A.mul.mp);
      if (A.mul.spd) it.spd = Math.round(base.spd * A.mul.spd);
      if (A.mul.atk) it.atk = Math.round(base.atk * A.mul.atk);
    } else {
      it.mp = Math.round(base.mp); it.luck = Math.round(base.luck);
      if (RNG.chance(0.5)) it.spd = Math.round(base.spd * 0.8);
    }
    it.theme = T.id;
    it.themePiece = pieceIdx;
    it.name = `[${RANKS[t].key}] ${pc.name} 〈${T.name}〉`;
    it.value = Math.round(it.value * 1.15);
    it.brand = null; // 테마와 브랜드를 동시에 붙이지 않음
    if (!this.player.themeSeen) this.player.themeSeen = [];
    if (!this.player.themeSeen.includes(T.id)) this.player.themeSeen.push(T.id);
    return it;
  },
  rollThemeDrop(tier, force) {
    if (!force && !RNG.chance(0.08 + Math.max(0, (this.player.luck || 10) - 10) / 800)) return null;
    const weights = THEME_SETS.map((t) => t.dropW || 1);
    const T = RNG.weighted(THEME_SETS, weights);
    const idx = RNG.int(0, T.pieces.length - 1);
    const it = this.makeThemePiece(T.id, idx, tier, RNG.weighted([1, 2], [70, 30]));
    if (!it) return null;
    this.player.inventory.push(it);
    return it;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const p = this.player; if (!p) return;
    p.themeSeen ??= [];
  });

  wrap('makeEquipment', function (base, slot, tier, rarityIdx) {
    const it = base.call(this, slot, tier, rarityIdx);
    if (slot === 'armor' && !it.theme) {
      const p = this.player; const c = p && p.cls && classById(p.cls);
      const mine = (c && GROUP_ARMOR_FAMS[c.g]) || [];
      const fam = mine.length && RNG.chance(0.4) ? RNG.pick(mine) : RNG.pick(Object.keys(ARMOR_FAMS));
      const A = ARMOR_FAMS[fam];
      it.afam = fam;
      const m = RANKS[it.tier].mult * RARITY[it.rarity].mult;
      const baseDef = Math.round(5 * m); const baseHp = Math.round(30 * m);
      const baseMp = Math.round(20 * m); const baseSpd = Math.round(2 * m); const baseAtk = Math.round(8 * m);
      it.def = Math.round(baseDef * (A.mul.def || 1));
      it.hp = Math.round(baseHp * (A.mul.hp || 1));
      if (A.mul.mp) it.mp = Math.round(baseMp * A.mul.mp);
      if (A.mul.spd && A.mul.spd !== 1) it.spd = Math.round(baseSpd * Math.abs(A.mul.spd));
      if (A.mul.atk) it.atk = Math.round(baseAtk * A.mul.atk);
      // 브랜드 접미가 이미 붙어 있을 수 있음
      const brandTag = (it.brand && typeof BRANDS !== 'undefined' && BRANDS[it.brand]) ? ` 〈${BRANDS[it.brand].short}〉` : '';
      it.name = `[${RANKS[it.tier].key}] ${RNG.pick(A.names)}${brandTag}`;
    }
    return it;
  });

  wrap('recalc', function (base) {
    base.call(this);
    const p = this.player; const a = p && p.equip && p.equip.armor;
    const f = a ? this.armorFit(a) : 0;
    if (!f) return;
    const inj = p.injured > 0 ? 0.8 : 1;
    p.def = Math.max(0, Math.round(p.def + (a.def || 0) * f * inj));
    p.maxHp = Math.max(1, Math.round(p.maxHp + (a.hp || 0) * f)); p.hp = Math.min(p.hp, p.maxHp);
    p.maxMp = Math.max(1, Math.round(p.maxMp + (a.mp || 0) * f)); p.mp = Math.min(p.mp, p.maxMp);
    p.spd = Math.max(1, Math.round(p.spd + (a.spd || 0) * f));
    p.atk = Math.max(1, Math.round(p.atk + (a.atk || 0) * f * inj));
  });

  wrap('extraMod', function (base, key) {
    return base.call(this, key) + this.themeMod(key);
  });

  // 게이트·토벌 전리품: 일반 장비와 별도로 테마 피스 드롭 (고유·히든이 아님)
  wrap('lootFromKills', function (base, kills, boss) {
    const lines = base.call(this, kills, boss);
    const p = this.player; if (!p || !p.themeSeen) return lines;
    const list = (kills || []).filter((k) => k && !k.portrait && !k.summon);
    if (!list.length) return lines;
    const top = list.reduce((a, k) => Math.max(a, k.tier || 0), 0);
    const chance = boss ? 0.12 : 0.04;
    if (RNG.chance(chance + Math.max(0, (p.luck || 10) - 10) / 1500)) {
      const it = this.rollThemeDrop(top, true);
      if (it) lines.push(`테마 세트: ${it.name}`);
    }
    return lines;
  });
}

// ---------- 화면 ----------
{
  const baseStats = UI.equipStats;
  UI.equipStats = function (it) {
    let s = baseStats.call(this, it);
    const af = G.armorFam(it);
    if (af && ARMOR_FAMS[af]) {
      const f = G.armorFit(it);
      s += ` · ${ARMOR_FAMS[af].name} 계열${f > 0 ? ' <span class="good">적합 +15%</span>' : f < 0 ? ' <span class="bad">부적합 −15%</span>' : ''}`;
    }
    if (it.theme) {
      const T = themeById(it.theme);
      if (T) {
        const n = G.themeCount()[it.theme] || 0;
        const tip = `2세트 ${modsText(T.set[2] || {})}${T.set[3] ? ` / 3세트 ${modsText(T.set[3])}` : ''}`;
        s += `<br><span class="amber" title="${tip}">세트 〈${T.name}〉${n >= 2 ? ` · ${n}피스 발동` : ''}</span>`;
      }
    }
    return s;
  };

  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    let html = baseChar.call(this);
    const p = G.player;
    const tc = Object.entries(G.themeCount()).filter(([, n]) => n >= 2);
    const seen = p.themeSeen || [];
    let box = '';
    if (tc.length) {
      box += `<div class="sec"><div class="sec-title">테마 세트 효과</div><div class="cards">${tc.map(([id, n]) => {
        const T = themeById(id); if (!T) return '';
        const tier = n >= 3 && T.set[3] ? 3 : 2;
        return `<div class="small amber">${T.name} ${n}피스: ${modsText(T.set[tier])}</div>`;
      }).join('')}</div></div>`;
    }
    box += `<div class="sec"><div class="sec-title">테마 세트 도감 · ${seen.length}/${THEME_SETS.length}</div><div class="small dim">${seen.length ? seen.map((id) => `〈${themeById(id).name}〉`).join(' ') : '게이트 드롭·제작 길드·장인에게서 모은다. 고유(히든)와는 다르다.'}</div></div>`;
    return html + box;
  };
}
