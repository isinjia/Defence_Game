// ===== 장비·아이템 (2): 속성 장비 · 무작위 옵션 =====
// 설계: docs/장비_아이템_점검.md 2장 4·3 (사용자 승인)
//  - 속성 무기: 같은 속성 스킬 피해 +15%, 기본 타격이 그 속성이 된다. 속성 방어구: 그 속성 피해 −25%.
//  - 희귀 1줄, 영웅 2줄, 전설 3줄의 무작위 옵션(치명·속성 피해·괴수 특효·흡혈·회복·수련·코어·운·체력).
//  - 신화 등급을 더한다(고유 장비 전용).

RARITY.push({ name: '신화', mult: 2.8, color: '#ff5d73' });
const ELEM_PREFIX = { fire: '화염', ice: '빙결', bolt: '뇌전', steel: '강철', spirit: '영혼' };
const SHAPE_NAME = { beast: '야수', slime: '점액', drone: '기계', golem: '골렘', ghost: '망령', dragon: '용', eye: '감시자', spider: '거미', swarm: '벌레떼', flyer: '비행', choir: '합창단', core: '핵' };
const GEAR_OPTS = [
  { id: 'crit', w: 3, roll: (r) => 0.03 + 0.015 * r, text: (v) => `치명 +${Math.round(v * 100)}%` },
  { id: 'elemDmg', w: 3, roll: (r) => 0.06 + 0.03 * r, text: (v) => `속성 피해 +${Math.round(v * 100)}%` },
  { id: 'vs', w: 3, roll: (r) => 0.15 + 0.05 * r, text: (v, o) => `${SHAPE_NAME[o.shape] || o.shape} 특효 +${Math.round(v * 100)}%` },
  { id: 'drain', w: 2, roll: (r) => 0.03 + 0.015 * r, text: (v) => `흡혈 ${Math.round(v * 100)}%` },
  { id: 'heal', w: 2, roll: (r) => 0.08 + 0.04 * r, text: (v) => `회복량 +${Math.round(v * 100)}%` },
  { id: 'train', w: 2, roll: (r) => 0.03 + 0.015 * r, text: (v) => `수련 +${Math.round(v * 100)}%` },
  { id: 'core', w: 2, roll: (r) => 0.08 + 0.04 * r, text: (v) => `코어 획득 +${Math.round(v * 100)}%` },
  { id: 'luck', w: 2, roll: (r) => 0.08 + 0.04 * r, text: (v) => `운 +${Math.round(v * 100)}%` },
  { id: 'hp', w: 2, roll: (r) => 0.03 + 0.015 * r, text: (v) => `체력 +${Math.round(v * 100)}%` },
];
const optById = (id) => GEAR_OPTS.find((o) => o.id === id);
const OPT_MOD_KEYS = ['heal', 'train', 'luck', 'hp'];

Object.assign(Game.prototype, {
  rollGearOpt(rarity) {
    const o = RNG.weighted(GEAR_OPTS, GEAR_OPTS.map((x) => x.w));
    const out = { id: o.id, v: Math.round(o.roll(rarity) * RNG.range(0.85, 1.15) * 1000) / 1000 };
    if (o.id === 'vs') out.shape = RNG.pick(Object.keys(SHAPE_NAME));
    return out;
  },
  gearOptText(op) { const o = optById(op.id); return o ? o.text(op.v, op) : ''; },
  gearSum(id) { let v = 0; for (const e of Object.values(this.player.equip || {})) if (e && e.opts) for (const op of e.opts) if (op.id === id) v += op.v; return v; },
  gearVs() { const m = {}; for (const e of Object.values(this.player.equip || {})) if (e && e.opts) for (const op of e.opts) if (op.id === 'vs') m[op.shape] = (m[op.shape] || 0) + op.v; return m; },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('makeEquipment', function (base, slot, tier, rarityIdx) {
    const it = base.call(this, slot, tier, rarityIdx);
    // 속성: 무기·방어구 일부
    if ((slot === 'weapon' || slot === 'armor') && RNG.chance(0.2 + 0.1 * it.rarity)) {
      it.elem = RNG.pick(ELEMENT_KEYS);
      it.name = it.name.replace(/^(\[[A-Z]+\] )/, `$1${ELEM_PREFIX[it.elem] || ''} `);
    }
    // 옵션: 희귀 1, 영웅 2, 전설 3, 신화 3
    const n = Math.min(3, it.rarity);
    if (n > 0) { it.opts = []; for (let i = 0; i < n; i++) it.opts.push(this.rollGearOpt(it.rarity)); }
    return it;
  });
  wrap('extraMod', function (base, key) { let v = base.call(this, key); if (this.player && this.player.equip && OPT_MOD_KEYS.includes(key)) v += this.gearSum(key); return v; });
  wrap('playerUnit', function (base) {
    const u = base.call(this); const p = this.player;
    const w = p.equip.weapon; const a = p.equip.armor;
    u.wElem = w && w.elem || null; u.aElem = a && a.elem || null;
    u.gCrit = this.gearSum('crit'); u.gElem = this.gearSum('elemDmg'); u.gDrain = this.gearSum('drain'); u.gVs = this.gearVs();
    return u;
  });
  wrap('lootFromKills', function (base, kills, boss) {
    const lines = base.call(this, kills, boss);
    const c = this.player && this.player.equip ? this.gearSum('core') : 0;
    if (c > 0) { let n = 0; for (const k of kills || []) if (!k.portrait && !k.summon && RNG.chance(c)) { this.addCore(Math.max(0, Math.min(7, k.tier || 0)), 1); n++; } if (n) lines.push(`장비 옵션으로 코어 ${n}개를 더 챙겼다.`); }
    return lines;
  });
  // 전투: 속성·옵션 반영
  const CP = Combat.prototype;
  const baseCalc = CP.calcDamage;
  CP.calcDamage = function (att, def, skill, opt = {}) {
    let sk = skill;
    if (att.isPlayer && att.wElem && skill && skill.id === 'strike') sk = { ...skill, elem: att.wElem };
    const o = att.isPlayer && att.gCrit ? { ...opt, crit: (opt.crit || 0) + att.gCrit } : opt;
    const r = baseCalc.call(this, att, def, sk, o);
    let m = 1;
    if (att.isPlayer) {
      if (r.elem && r.elem === att.wElem) m *= 1.15;
      if (r.elem && att.gElem) m *= 1 + att.gElem;
      if (att.gVs && def.shape && att.gVs[def.shape]) m *= 1 + att.gVs[def.shape];
    }
    if (def.isPlayer && def.aElem && r.elem === def.aElem) m *= 0.75;
    if (m !== 1) r.dmg = Math.max(1, Math.round(r.dmg * m));
    return r;
  };
  const baseDeal = CP.dealDamage;
  CP.dealDamage = function (att, def, skill, opt) {
    const d = baseDeal.call(this, att, def, skill, opt);
    if (d > 0 && att.isPlayer && att.gDrain && att.alive) { const h = Math.max(1, Math.round(d * att.gDrain)); att.hp = Math.min(att.maxHp, att.hp + h); }
    return d;
  };
}

// ---------- 화면 ----------
{
  const baseStats = UI.equipStats;
  UI.equipStats = function (it) {
    let s = baseStats.call(this, it);
    if (it.elem && ELEMENTS[it.elem]) s += ` · ${ELEMENTS[it.elem].name} 속성${it.slot === 'weapon' ? '(같은 속성 피해 +15%)' : '(그 속성 피해 −25%)'}`;
    if (it.opts && it.opts.length) s += `<br><span class="amber">${it.opts.map((op) => G.gearOptText(op)).join(' · ')}</span>`;
    return s;
  };
}
