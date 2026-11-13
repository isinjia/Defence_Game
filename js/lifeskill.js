// ===== 생활 기술(부직업): 조제 · 정비 · 결계 · 부적 =====
// 설계: docs/귀곡팔황_대조.md 3장 7
//  - 네 기술에 숙련(Lv0~5)이 있다. 쓰면 오르고, 직업군마다 잘 맞는 기술은 1.5배로 는다.
//  - 조제: 싸게 회복제를 만들고, 불법 각성제(공격 +15% 한 달, 오염·무법)를 빚는다.
//  - 정비: 강화·부산물 제작을 할 때마다 오르고, 강화 성공률 +2%/Lv.
//  - 결계: 도시에 결계 장치를 세운다(1년). 그 지역 게이트가 터지려 할 때 막아 낸다. 관리국 공적.
//  - 부적: 전투에서 쓰는 일회용 공격 부적. 적 전체에 속성 피해.

const LSKILLS = [
  { id: 'brew', name: '조제', roles: ['support'], desc: '회복제·각성제를 빚는다' },
  { id: 'maint', name: '정비', roles: ['tank', 'melee'], desc: '강화 성공률 +2%/Lv' },
  { id: 'ward', name: '결계', roles: ['caster', 'esper'], desc: '도시 결계로 브레이크를 막는다' },
  { id: 'talis', name: '부적', roles: ['support', 'caster', 'summoner'], desc: '전투용 부적을 쓴다' },
];
const LS_XP = [0, 5, 15, 35, 70, 120];

Object.assign(Game.prototype, {
  lskillInit() { const p = this.player; if (!p) return; p.lskill ??= {}; p.wards ??= {}; },
  lsLv(id) { const x = (this.player.lskill || {})[id] || 0; let lv = 0; for (let i = 0; i < LS_XP.length; i++) if (x >= LS_XP[i]) lv = i; return lv; },
  lsGain(id, n = 1) {
    const p = this.player; const L = LSKILLS.find((s) => s.id === id);
    const role = p.cls && classById(p.cls) ? classById(p.cls).role : '';
    const before = this.lsLv(id);
    p.lskill[id] = (p.lskill[id] || 0) + n * (L.roles.includes(role) ? 1.5 : 1);
    const after = this.lsLv(id);
    if (after > before) { this.log(`생활 기술 [${L.name}] 숙련 Lv${after}`, 'good'); return ` [${L.name}] Lv${after}!`; }
    return '';
  },
  payCores(tier, n) {
    let have = 0; for (let t = tier; t < RANKS.length; t++) have += this.coreCount(t);
    if (have < n) return false;
    let need = n; for (let t = tier; t < RANKS.length && need > 0; t++) { const u = Math.min(need, this.coreCount(t)); this.player.mats['c' + t] -= u; need -= u; }
    return true;
  },
  // ---------- 조제 ----------
  brewPotion() {
    const p = this.player; const c = Math.round(30 * this.priceMul());
    if (p.money < c) return '크레딧이 부족하다.';
    if (!this.payCores(0, 1)) return '코어가 1개 필요하다.';
    p.money -= c; const n = 2 + Math.floor(this.lsLv('brew') / 2);
    p.items.potion = (p.items.potion || 0) + n;
    return `응급 회복제 ${n}개를 빚었다.${this.lsGain('brew')}`;
  },
  brewStim() {
    const p = this.player; if (this.lsLv('brew') < 1) return '조제 Lv1이 필요하다.';
    const c = Math.round(200 * RANKS[p.rankIdx].mult * this.priceMul());
    if (p.money < c) return '크레딧이 부족하다.';
    if (!this.payCores(p.rankIdx, 2)) return `${coreName(p.rankIdx)} 이상이 2개 필요하다.`;
    p.money -= c; p.items.stim = (p.items.stim || 0) + 1;
    return `불법 각성제 1병을 빚었다. 들키면 곤란하다.${this.lsGain('brew', 2)}`;
  },
  useStim() {
    const p = this.player; if (!p.items.stim) return '';
    p.items.stim--;
    const val = 0.15 + 0.02 * this.lsLv('brew');
    p.buffs.push({ stat: 'atk', val, until: this.monthKey(), name: '불법 각성제' });
    if (this.addLaw) this.addLaw(-3);
    this.recalc();
    return `각성제를 삼켰다. 핏줄이 타오른다. 이번 달 공격 +${Math.round(val * 100)}%`;
  },
  // ---------- 결계 ----------
  wardCost() { return Math.round(500 * RANKS[this.player.rankIdx].mult * this.priceMul()); },
  wardActive(rid) { const w = (this.player.wards || {})[rid]; return w && w.until >= this.monthKey() ? w : null; },
  placeWard() {
    const p = this.player; const rid = this.region().id; if (!this.onCity()) return '';
    if (this.wardActive(rid)) return '이미 결계가 서 있다.';
    const c = this.wardCost(); if (p.money < c) return '크레딧이 부족하다.';
    if (!this.payCores(Math.max(0, p.rankIdx - 1), 4)) return `${coreName(Math.max(0, p.rankIdx - 1))} 이상이 4개 필요하다.`;
    p.money -= c; p.wards[rid] = { until: this.monthKey() + 12, lv: this.lsLv('ward') };
    p.merit += 3; this.addRep(rid, 4);
    this.advanceDays(4, { eventChance: 0.05 });
    return `${this.region().name} 외곽에 결계 장치를 세웠다. 1년간 게이트 브레이크를 막는다. (협회 공적 +3, 평판 +4)${this.lsGain('ward', 2)}`;
  },
  wardBlock(rid) { const w = this.wardActive(rid); return w ? 0.45 + 0.08 * Math.max(w.lv, this.lsLv('ward')) : 0; },
  // ---------- 부적 ----------
  makeTalisman() {
    const p = this.player; const c = Math.round(80 * RANKS[p.rankIdx].mult ** 0.8 * this.priceMul());
    if (p.money < c) return '크레딧이 부족하다.';
    if (!this.payCores(Math.max(0, p.rankIdx - 1), 1)) return `${coreName(Math.max(0, p.rankIdx - 1))} 이상이 1개 필요하다.`;
    p.money -= c; const n = 1 + (this.lsLv('talis') >= 3 ? 1 : 0);
    p.items.talisman = (p.items.talisman || 0) + n;
    return `${ELEMENTS[p.element] ? ELEMENTS[p.element].name : ''} 공격 부적 ${n}장을 그렸다.${this.lsGain('talis')}`;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.lskillInit(); });
  if (GP.plusRate) wrap('plusRate', function (base, it) { const r = base.call(this, it); return r ? Math.min(97, r + 2 * this.lsLv('maint')) : r; });
  if (GP.enhance) wrap('enhance', function (base, uid) { const r = base.call(this, uid); if (typeof r === 'string' && /강화 (성공|실패)|파괴/.test(r)) return r + this.lsGain('maint'); return r; });
  if (GP.craftGear) wrap('craftGear', function (base, rid, t) { const r = base.call(this, rid, t); if (typeof r === 'string' && r.includes('두드려')) return r + this.lsGain('maint', 2); return r; });
  // 결계: 터지려던 게이트를 막아 낸다
  if (GP.ecoExpire) wrap('ecoExpire', function (base, g) {
    const b = this.wardBlock(g.region);
    if (b && RNG.chance(b)) {
      this.mapGates = this.mapGates.filter((x) => x.id !== g.id);
      this.rumor(`${regionById(g.region).name}의 기한 넘긴 ${RANKS[g.tier].key}급 게이트가 터지려는 순간, ${this.player.name}의 결계가 막아 냈다.`);
      this.player.merit += 2; this.addRep(g.region, 3);
      return;
    }
    return base.call(this, g);
  });
  // 부적: 전투 중 적 전체에 속성 피해
  Combat.prototype.useTalisman = function () {
    const g = this.game; if (!this.waiting || this.result || !g.player.items.talisman) return false;
    g.player.items.talisman--;
    const u = this.player; const lv = g.lsLv('talis');
    const sk = { id: 'talisman', name: '공격 부적', type: 'aoe', power: 1.1 + 0.12 * lv, mp: 0, elem: u.elem };
    this.push(`${u.name}이(가) 부적을 찢었다!`, 'hit', { k: 'aoe', src: u.id, side: u.side, elem: u.elem });
    for (const f of this.foesOf(u)) this.dealDamage(u, f, sk);
    this.talisUsed = (this.talisUsed || 0) + 1;
    this.endPlayerTurn();
    return true;
  };
}

// ---------- 화면 ----------
{
  const baseCtrl = UI.renderControls;
  UI.renderControls = function () {
    baseCtrl.call(this);
    const c = this.ctx; if (!c || !c.combat || c.combat.result) return;
    const n = G.player.items.talisman || 0; if (!n) return;
    const row = document.querySelector('#cb-ctrl .ctrl-row'); if (!row) return;
    const ready = c.combat.waiting && !c.playing && !c.combat.auto;
    row.insertAdjacentHTML('afterbegin', `<button class="sm" data-act="c-talis" ${ready ? '' : 'disabled'}>부적 <span class="num">×${n}</span></button>`);
  };
  // 전투 끝: 부적 숙련
  for (const fn of ['finishGate', 'finishStoryFight', 'finishPersonalCombat']) {
    const base = UI[fn]; if (!base) continue;
    UI[fn] = function (...a) { const cb = this.ctx && this.ctx.combat; if (cb && cb.talisUsed) { G.lsGain('talis', cb.talisUsed); cb.talisUsed = 0; } return base.apply(this, a); };
  }
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    if (id !== 'workshop') return html;
    const p = G.player; const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(v)}</span>`;
    const w = G.wardActive(reg.id);
    html += `<div class="sec-title sec">생활 기술</div><div class="small dim">${LSKILLS.map((s) => `${s.name} Lv${G.lsLv(s.id)}`).join(' · ')} — 직업에 맞는 기술은 빨리 는다.</div>
      <div class="cards">
        <div class="item-row"><div class="grow"><b>조제 · 응급 회복제</b><div class="small dim">코어 1개로 ${2 + Math.floor(G.lsLv('brew') / 2)}개</div></div><button class="sm" data-act="ls-brew">${coin(Math.round(30 * G.priceMul()))}</button></div>
        <div class="item-row"><div class="grow"><b>조제 · 불법 각성제</b> <span class="small dim">보유 ${p.items.stim || 0}</span><div class="small dim">조제 Lv1. 마시면 이번 달 공격 +15%~, 무법</div></div>
          <span class="row"><button class="sm" data-act="ls-stim" ${G.lsLv('brew') < 1 ? 'disabled' : ''}>${coin(Math.round(200 * RANKS[p.rankIdx].mult * G.priceMul()))}</button>${p.items.stim ? '<button class="sm danger" data-act="ls-drink">마신다</button>' : ''}</span></div>
        <div class="item-row"><div class="grow"><b>결계 · ${reg.name}</b><div class="small dim">${w ? `<span class="good">작동 중 · ${w.until - G.monthKey() + 1}개월 남음</span>` : `1년간 이 지역 게이트가 터질 때 ${Math.round((0.45 + 0.08 * G.lsLv('ward')) * 100)}% 확률로 막는다`}</div></div>
          <button class="sm" data-act="ls-ward" ${w ? 'disabled' : ''}>${coin(G.wardCost())}</button></div>
        <div class="item-row"><div class="grow"><b>부적 · 공격 부적</b> <span class="small dim">보유 ${p.items.talisman || 0}</span><div class="small dim">전투 중 적 전체에 내 속성 피해(턴 소모)</div></div><button class="sm" data-act="ls-talis">${coin(Math.round(80 * RANKS[p.rankIdx].mult ** 0.8 * G.priceMul()))}</button></div>
      </div>`;
    return html;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const any = LSKILLS.some((s) => (G.player.lskill || {})[s.id]); if (!any) return html;
    const line = `<div class="small dim">생활 기술: ${LSKILLS.map((s) => `${s.name} Lv${G.lsLv(s.id)}`).join(' · ')}</div>`;
    return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `${line}<div class="sec"><div class="sec-title">선천 특성</div>`);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'ls-brew': { const r = G.brewPotion(); G.save(); return this.afterCity(r); }
      case 'ls-stim': { const r = G.brewStim(); G.save(); return this.afterCity(r); }
      case 'ls-drink': { const r = G.useStim(); G.save(); return this.afterCity(r); }
      case 'ls-ward': { const r = G.placeWard(); G.save(); return this.afterCity(r); }
      case 'ls-talis': { const r = G.makeTalisman(); G.save(); return this.afterCity(r); }
      case 'c-talis': return this.combatAction((cb) => cb.useTalisman());
      default: return baseHandle.call(this, act, v);
    }
  };
}
