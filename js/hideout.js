// ===== 헌터 아지트(거처) =====
// 설계: docs/귀곡팔황_대조.md 3장 6
//  - 도시 하나에 아지트를 산다. 다섯 시설을 3단계까지 넓힌다.
//    수련실(그 지역 수련 +10%/단계), 금고(매달 이자 0.4%/단계), 개인 공방(그 도시 물가 −5%/단계),
//    훈련장(파티원 성장), 가족 거주(배우자·자녀·연인 관계, 휴식 때 부상 회복).
//  - 아지트에서는 공짜로 쉴 수 있다. 그 도시에 브레이크가 터지면 시설이 부서질 수 있다.

const BASE_FACS = [
  { id: 'train', name: '수련실', desc: '이 지역에서 수련 효율 +10%/단계' },
  { id: 'vault', name: '금고', desc: '매달 보유 크레딧의 0.4%/단계 이자 (등급별 상한)' },
  { id: 'forge', name: '개인 공방', desc: '이 도시 물가 −5%/단계' },
  { id: 'yard', name: '훈련장', desc: '파티원이 매달 함께 수련해 성장한다' },
  { id: 'home', name: '가족 거주', desc: '배우자·자녀·연인 관계 매달 +2/단계, 아지트 휴식 때 부상 추가 회복' },
];
const BASE_MAX = 3;
FACILITIES.push({ id: 'hideout', name: '헌터 아지트', desc: '내 거점. 사서 시설을 넓히고, 공짜로 쉰다.' });
FAC_ICON.hideout = '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>';

Object.assign(Game.prototype, {
  baseInit() { const p = this.player; if (!p) return; p.base ??= null; },
  baseLv(id) { const b = this.player.base; return b ? b.lv[id] || 0 : 0; },
  atBase() { const b = this.player.base; return !!(b && b.region === this.player.region); },
  basePrice() { return Math.round(4000 * RANKS[Math.min(this.player.rankIdx, 5)].mult ** 1.2 * this.cityPriceMul(this.region().id)); },
  baseUpCost(id) { return Math.round(1500 * (this.baseLv(id) + 1) ** 1.6 * RANKS[Math.min(this.player.rankIdx, 5)].mult ** 0.8); },
  buyBase() {
    const p = this.player; if (!this.onCity()) return '';
    if (p.base && p.base.region === this.region().id) return '';
    let refund = 0;
    if (p.base) refund = Math.round(p.base.paid * 0.5);
    const c = this.basePrice();
    if (p.money + refund < c) return '크레딧이 부족하다.';
    const old = p.base;
    p.money += refund - c;
    p.base = { region: this.region().id, lv: {}, paid: c };
    if (old) this.log(`${regionById(old.region).name}의 아지트를 정리했다. (+${fmt(refund)} 크레딧)`);
    this.lifeEvent(`${this.region().name}에 아지트를 마련했다.`);
    return `${this.region().name}에 아지트를 샀다. (−${fmt(c)} 크레딧)`;
  },
  upgradeBase(id) {
    const p = this.player; if (!this.atBase() || !this.onCity()) return '';
    const f = BASE_FACS.find((x) => x.id === id); if (!f) return '';
    if (this.baseLv(id) >= BASE_MAX) return '더 넓힐 수 없다.';
    const c = this.baseUpCost(id); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.base.paid += Math.round(c * 0.5);
    p.base.lv[id] = this.baseLv(id) + 1;
    this.advanceDays(10, { eventChance: 0.05 });
    return `${f.name}을(를) ${p.base.lv[id]}단계로 넓혔다. (−${fmt(c)} 크레딧, 열흘)`;
  },
  restAtBase() {
    const p = this.player; if (!this.atBase() || !this.onCity()) return '';
    p.hp = p.maxHp; p.mp = p.maxMp;
    if (p.injured > 0) p.injured = Math.max(0, p.injured - 1 - (this.baseLv('home') >= 2 ? 1 : 0));
    if (p.taint != null && this.addTaint) this.addTaint(-8);
    this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
    this.advanceDays(5, { eventChance: 0.1 });
    return '아지트에서 푹 쉬었다. 체력과 정신력을 모두 회복했다.';
  },
  baseMonthly() {
    const p = this.player; const b = p.base; if (!b) return;
    const v = this.baseLv('vault');
    if (v) { const cap = Math.round(400 * RANKS[p.rankIdx].mult ** 1.5 * v); const i = Math.min(cap, Math.round(p.money * 0.004 * v)); if (i > 0) p.money += i; }
    const y = this.baseLv('yard');
    if (y) for (const n of this.party ? this.party() : []) if (RNG.chance(0.06 * y)) { if (n.stage < 2) n.stage++; else if (n.rankIdx < p.rankIdx) { n.rankIdx++; n.stage = 0; this.log(`${n.name}이(가) 아지트 훈련장에서 ${RANKS[n.rankIdx].key}급에 올랐다.`, 'good'); } }
    const h = this.baseLv('home');
    if (h) for (const id of [p.spouse, p.partner, ...(p.children || [])]) { const n = id != null && this.npcById(id); if (n && n.alive) this.changeRel(n, 2 * h); }
    if (this.cityBreak(b.region) && RNG.chance(0.35)) {
      const built = BASE_FACS.filter((f) => this.baseLv(f.id) > 0);
      if (built.length) { const f = RNG.pick(built); b.lv[f.id]--; this.log(`${regionById(b.region).name} 브레이크로 아지트의 ${f.name}이(가) 부서졌다. (${b.lv[f.id]}단계)`, 'bad'); }
    }
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.baseInit(); });
  wrap('trainGain', function (base, mult = 1) { const t = this.atBase() ? this.baseLv('train') : 0; return base.call(this, mult * (1 + 0.1 * t)); });
  wrap('priceMul', function (base) { const m = base.call(this); const f = this.atBase() && this.onCity() ? this.baseLv('forge') : 0; return m * (1 - 0.05 * f); });
  wrap('worldMonthly', function (base) { base.call(this); this.baseMonthly(); });
}

// ---------- 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id !== 'hideout') return baseFac.call(this, id, reg);
    const p = G.player; const b = p.base;
    const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(v)}</span>`;
    if (!b || b.region !== reg.id) {
      return `<p>${b ? `아지트는 <b>${regionById(b.region).name}</b>에 있다. 이곳으로 옮기면 옛 아지트는 들인 돈의 절반에 정리되고 시설은 처음부터 다시 짓는다.` : '헌터라면 누구나 꿈꾸는 나만의 거점. 공짜로 쉬고, 시설을 넓혀 성장의 발판으로 삼는다.'}</p>
        <div class="row"><button class="primary" data-act="base-buy">${b ? '이곳으로 옮긴다' : '아지트를 산다'} · ${coin(G.basePrice())}</button></div>`;
    }
    return `<p class="small dim">${reg.name}의 내 아지트. 그 도시에 브레이크가 터지면 시설이 부서질 수 있다.</p>
      <div class="row"><button class="primary" data-act="base-rest">${FX.icon('rest')} 아지트에서 쉰다 (5일, 무료)</button></div>
      <div class="sec-title sec">시설</div>
      <div class="cards">${BASE_FACS.map((f) => { const lv = G.baseLv(f.id); return `<div class="item-row"><div class="grow"><b>${f.name}</b> <span class="tag">${lv}/${BASE_MAX}</span><div class="small dim">${f.desc}</div></div>
        ${lv >= BASE_MAX ? '<span class="small amber">완성</span>' : `<button class="sm" data-act="base-up" data-v="${f.id}">${lv ? '넓힌다' : '짓는다'} ${coin(G.baseUpCost(f.id))}</button>`}</div>`; }).join('')}</div>`;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this); const b = G.player.base; if (!b) return html;
    const line = `<div class="small dim">아지트: ${regionById(b.region).name} · ${BASE_FACS.filter((f) => G.baseLv(f.id)).map((f) => `${f.name} ${G.baseLv(f.id)}`).join(', ') || '빈 집'}</div>`;
    return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `${line}<div class="sec"><div class="sec-title">선천 특성</div>`);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'base-buy': { const r = G.buyBase(); G.save(); return this.afterCity(r); }
      case 'base-up': { const r = G.upgradeBase(v); G.save(); return this.afterCity(r); }
      case 'base-rest': { const r = G.restAtBase(); G.save(); return this.afterCity(r); }
      default: return baseHandle.call(this, act, v);
    }
  };
}
