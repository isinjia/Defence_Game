// ===== 장비·아이템 (1): 무기 계열·직업 상성 · 전투 소모품(가방) · 얻는 순간 비교 =====
// 설계: docs/장비_아이템_점검.md 2장 1·2·8 (사용자 승인)
//  - 무기는 계열(검·창·건틀릿·총·활·단검·지팡이·악기·방패·드론)이 있다. 직업군에 맞으면 무기 능력치 +15%, 안 맞으면 −15%.
//  - 전투 소모품 6종을 더하고, 전투 화면엔 '가방' 버튼 하나로 묶는다.
//  - 게이트에서 장비를 얻으면 결과 창에서 지금 장비와 ▲▼ 비교, 바로 장착.

const WEAPON_FAMS = {
  sword: { name: '검', names: ['진동 블레이드', '플라즈마 세이버', '합금 장검', '유물 검'] },
  spear: { name: '창', names: ['합금 창', '전술 할버드', '고주파 글레이브'] },
  fist: { name: '건틀릿', names: ['마나 건틀릿', '충격 너클', '파쇄 건틀릿'] },
  gun: { name: '총', names: ['전자기 라이플', '레일 권총', '에테르 샷건'] },
  bow: { name: '활', names: ['복합 활', '에테르 석궁', '광자 장궁'] },
  dagger: { name: '단검', names: ['단분자 단검', '쌍날 나이프', '그림자 비수'] },
  staff: { name: '지팡이', names: ['에테르 지팡이', '공명 로드', '수정 완드'] },
  instr: { name: '악기', names: ['공명 하프', '전술 확성기', '에테르 바이올린'] },
  shield: { name: '방패', names: ['카이트 방패', '에너지 방패', '타워 실드'] },
  drone: { name: '드론', names: ['공격 드론', '전술 드론', '정찰 드론 편대'] },
};
const GROUP_FAMS = {
  fighter: ['sword', 'spear', 'fist'], guard: ['shield', 'spear', 'sword'], shadow: ['dagger', 'bow'], shooter: ['gun', 'bow'],
  mage: ['staff'], summon: ['staff', 'drone'], support: ['staff', 'instr'], esper: ['drone', 'staff'], east: ['sword', 'fist', 'staff'],
};
const FAM_FIT = 0.15;
// 옛 이름·제작 장비 이름으로 계열 추정
const famOfName = (name) => {
  for (const [k, f] of Object.entries(WEAPON_FAMS)) if (f.names.some((n) => name.includes(n))) return k;
  if (/단검|비수|나이프/.test(name)) return 'dagger';
  if (/창|글레이브/.test(name)) return 'spear';
  if (/검|블레이드|세이버/.test(name)) return 'sword';
  return null;
};
const BAG_ITEMS = [
  { id: 'antidote', name: '해독제', price: 90, desc: '전투용 · 중독·기절 등 상태 이상 해제', effect: 'combat' },
  { id: 'amp', name: '강화 앰플', price: 260, desc: '전투용 · 3턴 공격 +40%, 오염 +3', effect: 'combat' },
  { id: 'flash', name: '섬광탄', price: 200, desc: '전투용 · 적 전체 소량 피해, 35% 기절', effect: 'combat' },
  { id: 'recall', name: '귀환석', price: 0, noShop: true, desc: '매우 귀함 · 어디서든(전투 중·보스전·변이 게이트) 즉시 탈출 · 상점에서 팔지 않음', effect: 'combat' },
  { id: 'guardcharm', name: '결계 부적', price: 220, desc: '전투용 · 다음 피해 한 번 무효', effect: 'combat' },
  { id: 'decoy', name: '미끼 드론', price: 180, desc: '전투용 · 적의 공격을 끌어가는 드론 배치', effect: 'combat' },
];
CONSUMABLES.push(...BAG_ITEMS);

Object.assign(Game.prototype, {
  weaponFam(it) {
    if (!it || it.slot !== 'weapon' || it.soul) return null;
    if (it.fam === undefined) it.fam = famOfName(it.name || '');
    return it.fam;
  },
  famFit(it) {
    const fam = this.weaponFam(it); const p = this.player;
    if (!fam || !p || !p.cls) return 0;
    const c = classById(p.cls); if (!c || c.g === 'hidden') return 0;
    const ok = GROUP_FAMS[c.g] || [];
    return ok.includes(fam) ? FAM_FIT : -FAM_FIT;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  // 새 무기는 계열을 정하고 그 계열 이름을 붙인다
  wrap('makeEquipment', function (base, slot, tier, rarityIdx) {
    const it = base.call(this, slot, tier, rarityIdx);
    if (slot === 'weapon') {
      // 직업에 맞는 계열이 조금 더 잘 나온다
      const p = this.player; const c = p && p.cls && classById(p.cls);
      const mine = (c && GROUP_FAMS[c.g]) || [];
      const fam = mine.length && RNG.chance(0.4) ? RNG.pick(mine) : RNG.pick(Object.keys(WEAPON_FAMS));
      it.fam = fam;
      it.name = `[${RANKS[tier].key}] ${RNG.pick(WEAPON_FAMS[fam].names)}`;
      if (fam === 'shield') { it.def = Math.round((it.atk || 0) * 0.35); it.atk = Math.round(it.atk * 0.8); }
      if (fam === 'instr' || fam === 'staff') it.mp = Math.round((it.atk || 0) * 1.2);
      if (fam === 'dagger' || fam === 'bow') it.spd = Math.max(it.spd || 0, Math.round((it.atk || 0) * 0.2));
    }
    return it;
  });
  // 무기 계열 상성: 무기 능력치 ±15%
  wrap('recalc', function (base) {
    base.call(this);
    const p = this.player; const w = p && p.equip && p.equip.weapon;
    const f = w ? this.famFit(w) : 0;
    if (!f) return;
    const inj = p.injured > 0 ? 0.8 : 1;
    p.atk = Math.max(1, Math.round(p.atk + (w.atk || 0) * f * inj));
    p.def = Math.max(0, Math.round(p.def + (w.def || 0) * f * inj));
    p.maxMp = Math.max(1, Math.round(p.maxMp + (w.mp || 0) * f)); p.mp = Math.min(p.mp, p.maxMp);
    p.spd = Math.max(1, Math.round(p.spd + (w.spd || 0) * f));
  });
  wrap('useItem', function (base, id) {
    const c = CONSUMABLES.find((x) => x.id === id);
    if (c && c.effect === 'combat') return `${c.name}은(는) 전투 중에 가방에서 쓴다.`;
    return base.call(this, id);
  });

  // 전투: 가방 소모품
  const CP = Combat.prototype;
  const baseDeal = CP.dealDamage;
  CP.dealDamage = function (att, def, skill, opt) {
    if (def && def.shieldOnce && att.side !== def.side) {
      def.shieldOnce = false;
      this.push(`결계 부적이 ${att.name}의 ${skill.name}을(를) 막아 냈다!`, 'heal', { k: 'miss', dst: def.id });
      return 0;
    }
    return baseDeal.call(this, att, def, skill, opt);
  };
  CP.useBag = function (id, ctxInfo) {
    const g = this.game; const gp = g.player;
    if (!this.waiting || this.result || !gp.items[id]) return false;
    const u = this.player;
    switch (id) {
      case 'antidote':
        u.poison = null; u.stun = 0; if (u.status) u.status = null; if (u.statuses) u.statuses = [];
        this.push(`${u.name}: 해독제로 몸을 추슬렀다.`, 'heal', { k: 'buff', dst: u.id, mp: u.mp }); break;
      case 'amp':
        u.buffs.atk = Math.max(u.buffs.atk, 0.4); u.buffs.atkT = Math.max(u.buffs.atkT, 3);
        this.taintGain = (this.taintGain || 0) + 3;
        this.push(`${u.name}: 강화 앰플 투여! 공격 상승.`, 'heal', { k: 'buff', dst: u.id, mp: u.mp }); break;
      case 'flash': {
        const sk = { id: 'flash', name: '섬광탄', type: 'aoe', power: 0.45, mp: 0, elem: null };
        this.push(`${u.name}이(가) 섬광탄을 던졌다!`, 'hit', { k: 'aoe', src: u.id, side: u.side, elem: null });
        for (const f of this.foesOf(u)) { if (baseDeal.call(this, u, f, sk) && f.alive && Math.random() < (f.boss ? 0.15 : 0.35)) { f.stun = 1; this.push(`${f.name}이(가) 눈이 멀어 비틀거린다!`, 'hit', { k: 'note', dst: f.id }); } }
        break;
      }
      case 'recall': // 귀환석은 어디서든 작동한다 (사용자 최종 확정, 구현 대기목록 4-7). 대신 매우 귀하다.
        gp.items[id]--; this.result = 'flee'; this.waiting = false; this.recalled = true;
        this.push('귀환석이 빛났다. 순식간에 바깥으로 빠져나왔다.', ''); return true;
      case 'guardcharm':
        u.shieldOnce = true; this.push(`${u.name}: 결계 부적을 둘렀다.`, 'heal', { k: 'buff', dst: u.id, mp: u.mp }); break;
      case 'decoy': {
        const s = { id: `decoy_${Math.random().toString(36).slice(2, 6)}`, name: '미끼 드론', side: 'ally', summon: true, summonOf: u.id,
          hp: Math.round(u.maxHp * 0.45), maxHp: Math.round(u.maxHp * 0.45), mp: 0, maxMp: 1, atk: 1, def: Math.round(u.def * 1.2), spd: u.spd, luck: 5, elem: null, skills: ['strike'], shape: 'drone', tier: 0 };
        const su = this.prep(s); su.tauntT = 3; su.atb = 0; this.units.push(su);
        this.push(`${u.name}이(가) 미끼 드론을 띄웠다! 적의 시선이 쏠린다.`, 'heal', { k: 'summon', dst: su.id, src: u.id });
        break;
      }
      default: return false;
    }
    gp.items[id]--;
    this.endPlayerTurn();
    return true;
  };
}

// ---------- 화면 ----------
{
  // 장비 설명에 계열과 상성
  const baseStats = UI.equipStats;
  UI.equipStats = function (it) {
    let s = baseStats.call(this, it);
    const fam = G.weaponFam(it);
    if (fam) { const f = G.famFit(it); s += ` · ${WEAPON_FAMS[fam].name} 계열${f > 0 ? ' <span class="good">적합 +15%</span>' : f < 0 ? ' <span class="bad">부적합 −15%</span>' : ''}`; }
    return s;
  };
  // 전투: 가방 버튼
  const baseCtrl = UI.renderControls;
  UI.renderControls = function () {
    baseCtrl.call(this);
    const c = this.ctx; if (!c || !c.combat || c.combat.result) return;
    const p = G.player; const have = BAG_ITEMS.filter((b) => p.items[b.id] > 0);
    const row = document.querySelector('#cb-ctrl .ctrl-row'); if (!row) return;
    const ready = c.combat.waiting && !c.playing && !c.combat.auto;
    if (!have.length) return;
    row.insertAdjacentHTML('afterbegin', `<button class="sm ${c.bagOpen ? 'primary' : ''}" data-act="c-bag">가방 <span class="num">${have.reduce((a, b) => a + p.items[b.id], 0)}</span></button>`);
    if (c.bagOpen) row.insertAdjacentHTML('beforebegin', `<div class="row bag-row" style="flex-wrap:wrap;gap:6px;margin-bottom:6px">${have.map((b) => `<button class="sm" data-act="c-bag-use" data-v="${b.id}" ${ready ? '' : 'disabled'} title="${b.desc}">${b.name} <span class="num">×${p.items[b.id]}</span></button>`).join('')}</div>`);
  };
  // 게이트 결과: 얻은 장비를 바로 비교·장착
  const arrow = (a, b) => { const d = (a || 0) - (b || 0); return d > 0 ? `<span class="good">▲${d}</span>` : d < 0 ? `<span class="bad">▼${-d}</span>` : '<span class="dim">=</span>'; };
  UI.compareHtml = function (items) {
    const p = G.player;
    if (!items.length) return '';
    return `<div class="sec-title sec">얻은 장비</div><div class="cards">${items.map((it) => {
      const cur = p.equip[it.slot];
      const keys = ['atk', 'def', 'hp', 'mp', 'spd', 'luck'].filter((k) => it[k] || (cur && cur[k]));
      const cmp = keys.map((k) => `${MOD_NAME[k] || k} ${it[k] || 0} ${cur ? arrow(it[k], cur[k]) : ''}`).join(' · ');
      return `<div class="item-row">${this.slotIcon(it.slot, RARITY[it.rarity].color)}<div class="grow">${this.equipName(it)}<div class="small">${cmp}</div>${G.weaponFam(it) ? `<div class="small dim">${WEAPON_FAMS[G.weaponFam(it)].name} 계열${G.famFit(it) > 0 ? ' · 적합' : G.famFit(it) < 0 ? ' · 부적합' : ''}</div>` : ''}</div>
        <button class="sm primary" data-act="quick-equip" data-v="${it.uid}" ${cur && cur.cursed ? 'disabled' : ''}>바로 장착</button></div>`; }).join('')}</div>`;
  };
  const baseFinishGate = UI.finishGate;
  UI.finishGate = function (result) {
    const before = new Set(G.player.inventory.map((e) => e.uid));
    baseFinishGate.call(this, result);
    const got = G.player.inventory.filter((e) => !before.has(e.uid));
    if (!got.length) return;
    const row = $box.querySelector('.row.end'); if (row) row.insertAdjacentHTML('beforebegin', this.compareHtml(got));
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'c-bag': { const c = this.ctx; if (!c) return; c.bagOpen = !c.bagOpen; return this.renderControls(); }
      case 'c-bag-use': {
        const c = this.ctx; if (!c || c.playing) return;
        const g = c.gate; const noRecall = !!(c.spec && c.spec.lethal) || !!(g && (g.variant === 'red' || g.final)) || c.kind === 'tower';
        c.bagOpen = false;
        return this.combatAction((cb) => cb.useBag(v, { noRecall }));
      }
      case 'quick-equip': {
        const it = G.player.inventory.find((e) => e.uid === v); if (!it) return;
        const cur = G.player.equip[it.slot]; if (cur && cur.cursed) return this.toast('저주받은 장비가 떨어지지 않는다.');
        G.equipItem(v); G.save();
        const btn = $box.querySelector(`[data-act="quick-equip"][data-v="${v}"]`); if (btn) { btn.textContent = '장착함'; btn.disabled = true; }
        this.renderGame(); return this.toast(`${it.name} 장착.`);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
