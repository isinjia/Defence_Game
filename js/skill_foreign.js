// ===== 다른 직업 스킬 배우기 (사용자 결정: 아무 직업이나, 비싸고 효과 −30%, 등급 제한 1단계 위) =====
// - 직업 스킬(F~D급)마다 '이방 사본'(id: fx_원래id)을 만든다. SKILLS 에는 넣지 않고 skillById 로만 찾게 해서,
//   NPC·괴수·보상 스킬 풀에는 섞이지 않는다.
// - 일반 상점은 C급까지만 판다(사용자 확정). 상점마다 매달 다른 직업 스킬 2개가 더 나온다.
// - 이방 사본은 cls 가 없어서 전직·직업 변경 때 지워지지 않는다.
const FOREIGN = { mul: 0.7, shopCap: 3, shopCount: 2, price: [0, 1600, 3000, 8000] };
const FOREIGN_SKILLS = {};
{
  for (const sk of SKILLS) {
    if (!sk.cls || sk.learn || sk.branch || sk.type === 'passive' || !(sk.rankReq <= FOREIGN.shopCap - 1)) continue;
    const c = typeof classById === 'function' ? classById(sk.cls) : null; if (!c) continue;
    const rq = sk.rankReq + 1;
    FOREIGN_SKILLS['fx_' + sk.id] = Object.assign({}, sk, {
      id: 'fx_' + sk.id, base: sk.id, xcls: sk.cls, cls: undefined, rankReq: rq,
      power: Math.round(sk.power * FOREIGN.mul * 100) / 100, price: FOREIGN.price[rq],
      desc: `[${c.name} 스킬] ${sk.desc} (다른 직업이라 효과 −30%)`,
    });
  }
  const baseById = skillById;
  // eslint-disable-next-line no-global-assign
  skillById = function (id) { return (typeof id === 'string' && id.startsWith('fx_') && FOREIGN_SKILLS[id]) || baseById(id); };
}
{
  const GP = Game.prototype;
  const baseShop = GP.getShop;
  GP.getShop = function (...a) {
    const s = baseShop.apply(this, a);
    if (!s || s.fxDone) return s;
    s.fxDone = true;
    try {
      const reg = this.region(); const hi = Math.min(FOREIGN.shopCap, GATE_RANGES[reg.danger][1]);
      // 일반 상점은 C급까지: 넘는 것은 빼고 C급 이하로 채운다
      const n = s.skills.length;
      s.skills = s.skills.filter((id) => { const k = skillById(id); return k && k.rankReq <= FOREIGN.shopCap; });
      let pool = SKILLS.filter((k) => k.price > 0 && !k.cls && k.rankReq <= hi && !s.skills.includes(k.id));
      while (s.skills.length < n && pool.length) { const k = RNG.pick(pool); s.skills.push(k.id); pool = pool.filter((x) => x !== k); }
      // 다른 직업 스킬
      const mine = this.player && this.player.cls;
      let fp = Object.values(FOREIGN_SKILLS).filter((k) => k.rankReq <= hi && k.xcls !== mine);
      for (let i = 0; i < FOREIGN.shopCount && fp.length; i++) { const k = RNG.pick(fp); s.skills.push(k.id); fp = fp.filter((x) => x !== k); }
    } catch (e) { /* 상점은 그대로 */ }
    return s;
  };
}
