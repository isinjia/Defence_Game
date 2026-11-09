// ===== 속성 개편 저장 이전 (docs/구현_대기목록.md 4-9) =====
// 옛 다섯 속성(염·뇌·빙·강·영) 저장을 새 여섯 속성(염·뇌·수·목·성·암)으로 바꾼다.
//  - ice→water, steel→wood, spirit→dark(고유 장비는 도감의 새 속성을 따른다)
//  - 속성 값을 담는 칸(elem·element·affinity·evo 등)과 속성을 키로 쓰는 표(영혼 무기 먹이, 성향 점수 등)를 모두 고친다.
//  - 이름이 바뀐 괴수·장비는 이름도 고친다(처음 보는 괴수 기록 포함).
//  - 한 번 고치면 world.elem6 표시를 남겨 다시 돌지 않는다.
const ELEM_RENAME = [
  ['변이 들개', '가시털 들개'], ['망령 드론', '빛무리 드론'], ['골렘 잔해병', '이끼 골렘'], ['철갑 거미 여왕', '가시 거미 여왕'],
  ['차원 포식자', '심판의 눈'], ['강철 거신', '고목 거신'],
];
const ELEM_PREFIX_OLD = { ice: '빙결', steel: '강철', spirit: '영혼' };
const ELEM_VALUE_KEYS = ['elem', 'element', 'affinity', 'evo', 'e', 'elemPref', 'weak'];

function elemMigrate(root) {
  const isOld = (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(ELEM_OLD, v);
  const fixName = (s) => { if (typeof s !== 'string') return s; for (const [a, b] of ELEM_RENAME) if (s.includes(a)) s = s.split(a).join(b); return s; };
  const seen = new Set();
  const renamed = new Map(ELEM_RENAME.map(([, b]) => [b, (MONSTERS.find((m) => m.name === b) || {}).elem]).filter(([, e]) => e));
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 12 || seen.has(o)) return;
    seen.add(o);
    if (Array.isArray(o)) {
      for (let i = 0; i < o.length; i++) { if (isOld(o[i]) && depth > 0) o[i] = ELEM_OLD[o[i]]; else walk(o[i], depth + 1); }
      return;
    }
    // 속성을 키로 쓰는 표: { ice: 3, fire: 1 } → { water: 3, fire: 1 }
    const keys = Object.keys(o);
    if (keys.some(isOld) && keys.every((k) => isOld(k) || ELEMENTS[k])) {
      for (const k of keys) if (isOld(k)) {
        const nk = ELEM_OLD[k]; const v = o[k]; delete o[k];
        o[nk] = typeof v === 'number' && typeof o[nk] === 'number' ? o[nk] + v : (o[nk] ?? v);
      }
    }
    for (const k of ELEM_VALUE_KEYS) if (isOld(o[k])) {
      const old = o[k]; o[k] = ELEM_OLD[old];
      if (k === 'elem' && typeof o.name === 'string' && ELEM_PREFIX_OLD[old] && typeof ELEM_PREFIX !== 'undefined') o.name = o.name.replace(ELEM_PREFIX_OLD[old] + ' ', (ELEM_PREFIX[o[k]] || '') + ' ');
    }
    // 고유 장비는 도감의 새 속성을 그대로
    if (o.uniq && typeof uniqById === 'function') { const U = uniqById(o.uniq); if (U) { o.elem = U.elem || null; o.name = `「${U.name}」`; } }
    if (typeof o.name === 'string' && (o.elem !== undefined || o.uid || o.shape)) o.name = fixName(o.name);
    // 이름이 바뀐 괴수는 새 도감 속성으로 (예: 차원 포식자 → 심판의 눈, 성)
    if (typeof o.name === 'string' && o.elem && !o.uid && renamed.has(o.name.replace(/^\[[^\]]*\]\s*/, ''))) o.elem = renamed.get(o.name.replace(/^\[[^\]]*\]\s*/, ''));
    for (const k of keys) { const v = o[k]; if (v && typeof v === 'object') walk(v, depth + 1); }
  };
  walk(root, 0);
  const p = root.player;
  if (p && Array.isArray(p.foeSeen)) p.foeSeen = [...new Set(p.foeSeen.map(fixName))];
}

{
  const GP = Game.prototype;
  const base = GP.initSandbox;
  GP.initSandbox = function (...a) {
    if (this.player && !(this.world && this.world.elem6)) {
      try { elemMigrate({ player: this.player, npcs: this.npcs, mapGates: this.mapGates, mobs: this.mobs, shops: this.shops, world: this.world, flags: this.flags }); } catch (e) { /* 이전 실패는 무시 */ }
    }
    const r = base.apply(this, a);
    if (this.world) this.world.elem6 = 1;
    return r;
  };
}
