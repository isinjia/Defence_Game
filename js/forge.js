// ===== 공방 확장: 장비 강화·대장장이 · 괴수 부산물·제작 · 포터 · 정보 브로커 =====
// 설계: docs/헌터물_제안2.md 4·8·후순위
//  - 강화: 장비에 +1~+10. 단계당 능력치 +8%. 높을수록 성공률이 떨어지고 +7 이상에서 실패하면 내려가거나 부서진다.
//    공방 대장장이와 친해질수록 성공률이 오른다. 수원(장비 제조의 중심)은 +5%.
//  - 부산물: 괴수 형태마다 가죽·합금·회로 같은 부산물이 나온다. 보스는 정수를 남긴다. 공방에서 부산물+코어로 장비를 만든다.
//  - 포터: 용병 사무소에서 고용하는 비전투 짐꾼. 코어·부산물 +30%, 게이트 크레딧 +10%.
//  - 정보 브로커: 포차에서 이 지역 게이트의 정체(등급 오판·숨은 구역)를 산다. 가끔 가짜가 섞인다.

const PLUS_MAX = 10;
const PLUS_RATE = [95, 90, 85, 75, 65, 55, 45, 35, 25, 18];
const PLUS_STAT = 0.08;
const PARTS = {
  hide: { name: '괴수 가죽', from: ['beast'] },
  gel: { name: '산성 점액', from: ['slime'] },
  wing: { name: '날개막', from: ['swarm', 'flyer'] },
  circuit: { name: '에테르 회로', from: ['drone'] },
  alloy: { name: '합금 파편', from: ['golem'] },
  ecto: { name: '망령 실', from: ['ghost', 'choir'] },
  silk: { name: '강철 거미줄', from: ['spider'] },
  lens: { name: '수정체', from: ['eye'] },
  scale: { name: '용린', from: ['dragon'] },
  sun: { name: '태양핵 조각', from: ['core'] },
  bone: { name: '괴수 뼈', from: [] }, // 그 밖의 형태
  essence: { name: '보스 정수', from: [] },
};
const partOfShape = (shape) => Object.keys(PARTS).find((k) => PARTS[k].from.includes(shape)) || 'bone';
// 부산물 제작법: 부산물 n개 + 같은 등급 코어 2개 + 크레딧 → 정해진 성격의 장비
const GEAR_RECIPES = [
  { id: 'g_hide', part: 'hide', n: 4, slot: 'armor', name: '가죽 경갑', mul: { def: 0.9, hp: 0.9, spd: 1.2 } },
  { id: 'g_alloy', part: 'alloy', n: 4, slot: 'armor', name: '합금 판갑', mul: { def: 1.35, hp: 1.1 } },
  { id: 'g_silk', part: 'silk', n: 4, slot: 'armor', name: '거미실 내갑', mul: { def: 1.0, hp: 1.35 } },
  { id: 'g_scale', part: 'scale', n: 3, slot: 'armor', name: '용린 갑주', mul: { def: 1.45, hp: 1.45 }, rarity: 2 },
  { id: 'g_circuit', part: 'circuit', n: 4, slot: 'acc', name: '회로 이식칩', mul: { mp: 1.2, spd: 1.3 } },
  { id: 'g_lens', part: 'lens', n: 3, slot: 'acc', name: '감시자의 눈', mul: { mp: 1.1, luck: 1.8 } },
  { id: 'g_wing', part: 'wing', n: 4, slot: 'acc', name: '바람깃 장식', mul: { mp: 0.8, spd: 1.8 } },
  { id: 'g_ecto', part: 'ecto', n: 4, slot: 'acc', name: '망령 부적', mul: { mp: 1.6 } },
  { id: 'g_gel', part: 'gel', n: 4, slot: 'weapon', name: '산성 코팅 단검', mul: { atk: 0.95, spd: 1.4 } },
  { id: 'g_bone', part: 'bone', n: 5, slot: 'weapon', name: '골각 대검', mul: { atk: 1.15 } },
  { id: 'g_sun', part: 'sun', n: 3, slot: 'weapon', name: '태양핵 창', mul: { atk: 1.5 }, rarity: 2 },
  { id: 'g_essence', part: 'essence', n: 1, slot: 'weapon', name: '정수 각인 무기', mul: { atk: 1.35, spd: 1.2 }, rarity: 2 },
];
const SMITH_NAME = '대장장이 도철민';

Object.assign(Game.prototype, {
  forgeInit() {
    const p = this.player; if (!p) return;
    p.parts ??= {}; p.smith ??= 0; p.porter ??= null; p.intel ??= {};
  },
  // ---------- 강화 ----------
  plusRate(it) {
    const p = this.player; const plus = it.plus || 0; if (plus >= PLUS_MAX) return 0;
    let r = PLUS_RATE[plus] + Math.floor(p.smith / 10) + (this.region().id === 'suwon' ? 5 : 0) + Math.max(0, p.luck - 10) * 0.1;
    return Math.max(5, Math.min(97, Math.round(r)));
  },
  plusCost(it) {
    const plus = it.plus || 0;
    return { cores: 1 + Math.floor(plus / 2), tier: it.tier, money: Math.round(60 * RANKS[it.tier].mult * (plus + 1) ** 1.3) };
  },
  findGear(uid) { const p = this.player; return p.inventory.find((e) => e.uid === uid) || Object.values(p.equip).find((e) => e && e.uid === uid); },
  applyPlus(it) {
    it.base ??= { atk: it.atk || 0, def: it.def || 0, hp: it.hp || 0, mp: it.mp || 0, spd: it.spd || 0, luck: it.luck || 0, value: it.value };
    const m = 1 + PLUS_STAT * (it.plus || 0);
    for (const k of ['atk', 'def', 'hp', 'mp', 'spd']) if (it.base[k]) it[k] = Math.round(it.base[k] * m);
    it.value = Math.round(it.base.value * (1 + 0.15 * (it.plus || 0)));
  },
  enhance(uid) {
    const p = this.player; const it = this.findGear(uid);
    if (!it || !this.onCity()) return '';
    if ((it.plus || 0) >= PLUS_MAX) return '더 이상 강화할 수 없다.';
    const c = this.plusCost(it); const money = Math.round(c.money * this.priceMul());
    let have = 0; for (let t = c.tier; t < RANKS.length; t++) have += this.coreCount(t);
    if (have < c.cores) return `${coreName(c.tier)} 이상이 ${c.cores}개 필요하다.`;
    if (p.money < money) return '크레딧이 부족하다.';
    let need = c.cores; for (let t = c.tier; t < RANKS.length && need > 0; t++) { const u = Math.min(need, this.coreCount(t)); p.mats['c' + t] -= u; need -= u; }
    p.money -= money;
    const rate = this.plusRate(it); const plus = it.plus || 0;
    p.smith = Math.min(100, p.smith + 2);
    if (RNG.int(1, 100) <= rate) {
      it.plus = plus + 1; this.applyPlus(it); this.recalc();
      if (it.plus >= 7) { p.smith = Math.min(100, p.smith + 3); this.rumor(`${p.name}의 ${it.name}이(가) +${it.plus} 강화에 성공했다는 소문이 돈다.`); }
      if (it.plus === PLUS_MAX) this.lifeEvent(`${it.name}을(를) +${PLUS_MAX}까지 단련했다.`);
      return `<span class="good">강화 성공!</span> ${it.name} +${it.plus} (성공률 ${rate}%)`;
    }
    if (plus < 7) return `<span class="bad">강화 실패.</span> 재료만 날아갔다. (성공률 ${rate}%)`;
    if (RNG.chance(0.3)) {
      for (const s of Object.keys(p.equip || {})) if (p.equip[s] === it) p.equip[s] = null;
      p.inventory = p.inventory.filter((e) => e !== it);
      this.recalc();
      this.log(`${it.name} +${plus}이(가) 강화 도중 산산조각 났다.`, 'bad');
      return `<span class="bad">파괴!</span> ${it.name} +${plus}이(가) 망치 아래서 부서졌다. ${SMITH_NAME}이(가) 고개를 숙인다.`;
    }
    it.plus = plus - 1; this.applyPlus(it); this.recalc();
    return `<span class="bad">강화 실패.</span> 단계가 내려갔다: +${it.plus} (성공률 ${rate}%)`;
  },

  // ---------- 부산물 ----------
  addPart(id, tier, n = 1) { const k = `${id}:${tier}`; this.player.parts[k] = (this.player.parts[k] || 0) + n; },
  partCount(id, tier) { return this.player.parts[`${id}:${tier}`] || 0; },
  partLabel(id, tier) { return `${RANKS[tier].key}급 ${PARTS[id].name}`; },
  partBonus() { const p = this.player; let b = 0; if (this.hasPorter()) b += 0.3; if (p.cls === 'alchemist') b += 0.2; return b; },
  craftGear(rid, tier) {
    const p = this.player; const rc = GEAR_RECIPES.find((r) => r.id === rid);
    if (!rc || !this.onCity()) return '';
    if (this.partCount(rc.part, tier) < rc.n) return `${this.partLabel(rc.part, tier)}이(가) ${rc.n}개 필요하다.`;
    if (this.coreCount(tier) < 2) return `${coreName(tier)}가 2개 필요하다.`;
    const money = Math.round(150 * RANKS[tier].mult * this.priceMul());
    if (p.money < money) return '크레딧이 부족하다.';
    p.parts[`${rc.part}:${tier}`] -= rc.n; p.mats['c' + tier] -= 2; p.money -= money;
    const it = this.makeEquipment(rc.slot, tier, rc.rarity ?? 1);
    const m = RANKS[tier].mult * RARITY[it.rarity].mult;
    const base = { atk: 8 * m, def: 5 * m, hp: 30 * m, mp: 20 * m, spd: 2 * m, luck: 3 * RARITY[it.rarity].mult };
    for (const k of ['atk', 'def', 'hp', 'mp', 'spd', 'luck']) delete it[k];
    for (const [k, v] of Object.entries(rc.mul)) it[k] = Math.round(base[k] * v);
    it.name = `[${RANKS[tier].key}] ${rc.name}`; it.crafted = true; if (it.slot === 'weapon') it.fam = undefined;
    it.value = Math.round(it.value * 1.2);
    p.inventory.push(it);
    p.smith = Math.min(100, p.smith + 3);
    return `${SMITH_NAME}이(가) ${it.name}을(를) 두드려 냈다. (${UI.equipStats ? UI.equipStats(it) : ''})`;
  },
  sellParts() {
    const p = this.player; let v = 0;
    for (const [k, n] of Object.entries(p.parts)) { if (!n) continue; const t = +k.split(':')[1]; v += n * Math.round(25 * RANKS[t].mult ** 1.5); p.parts[k] = 0; }
    p.money += v; return v ? `부산물을 모두 넘겼다. +${fmt(v)} 크레딧` : '팔 부산물이 없다.';
  },

  // ---------- 포터 ----------
  hasPorter() { const pt = this.player.porter; return !!(pt && pt.until >= this.monthKey()); },
  porterFee() { return Math.round(180 * RANKS[this.player.rankIdx].mult ** 1.3); },
  hirePorter() {
    const p = this.player; const c = Math.round(this.porterFee() * 3 * this.priceMul());
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c;
    const name = RNG.pick(['짐꾼 박씨', '포터 윤하', '포터 강두', '짐꾼 미소', '포터 철이']);
    const until = Math.max(this.monthKey() - 1, (p.porter && p.porter.until) || 0) + 3;
    p.porter = { name: this.hasPorter() ? p.porter.name : name, until };
    return `${p.porter.name}과(와) 3개월 계약했다. 코어·부산물을 더 챙겨 온다. (−${fmt(c)} 크레딧)`;
  },

  // ---------- 정보 브로커 ----------
  intelCost() { return Math.round(140 * RANKS[this.player.rankIdx].mult); },
  buyIntel() {
    const p = this.player; const rid = this.region().id;
    if (p.intel[rid] === this.monthKey()) return '이번 달 정보는 이미 샀다.';
    const c = Math.round(this.intelCost() * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.intel[rid] = this.monthKey();
    const gates = this.mapGates.filter((g) => g.region === rid && !g.final && !g.intel);
    if (!gates.length) return '브로커가 어깨를 으쓱한다. "요즘 이 근방은 조용해."';
    for (const g of gates) {
      const truth = g.variant === 'misrank' ? 'misrank' : g.variant === 'double' ? 'double' : g.variant === 'red' ? 'red' : 'normal';
      const fake = RNG.chance(0.15);
      const said = fake ? RNG.pick(['misrank', 'double', 'normal'].filter((x) => x !== truth)) : truth;
      g.intel = { said, fake, real: said === 'misrank' ? (g.variant === 'misrank' ? g.realTier : Math.min(7, g.tier + 1)) : null };
    }
    return `브로커가 쪽지를 밀어 준다. 이 지역 게이트 ${gates.length}곳의 정보. (−${fmt(c)} 크레딧) "열에 하나쯤은 틀려도 내 탓 하지 마."`;
  },
  intelText(g) {
    const i = g.intel; if (!i) return '';
    return { misrank: `등급 오판 의심 · 실제 ${RANKS[i.real || g.tier].key}급?`, double: '숨은 구역 있음', red: '붉은 기운', normal: '특이 사항 없음' }[i.said];
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.forgeInit(); });
  wrap('lootFromKills', function (base, kills, boss) {
    const lines = base.call(this, kills, boss);
    const p = this.player; if (!p || !p.parts) return lines;
    const bonus = this.partBonus(); const got = {};
    for (const k of kills || []) {
      if (k.portrait || k.summon) continue;
      const t = Math.max(0, Math.min(7, k.tier || 0));
      if (this.hasPorter() && RNG.chance(0.3)) this.addCore(t, 1);
      if (k.boss) { this.addPart('essence', t); got[`essence:${t}`] = (got[`essence:${t}`] || 0) + 1; }
      if (RNG.chance(0.35 + bonus)) { const id = partOfShape(k.shape); this.addPart(id, t); got[`${id}:${t}`] = (got[`${id}:${t}`] || 0) + 1; }
    }
    const txt = Object.entries(got).map(([key, n]) => { const [id, t] = key.split(':'); return `${this.partLabel(id, +t)} ${n}`; }).join(', ');
    if (txt) lines.push(`부산물: ${txt}${this.hasPorter() ? ` (${this.player.porter.name}이 챙김)` : ''}`);
    return lines;
  });
  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    if (result !== 'lose' && loot && this.hasPorter()) loot.money = Math.round((loot.money || 0) * 1.1);
    return base.call(this, gate, result, loot, ...rest);
  });
  wrap('worldMonthly', function (base) {
    base.call(this);
    const pt = this.player.porter;
    if (pt && pt.until === this.monthKey() - 1) { this.log(`포터 ${pt.name}의 계약이 끝났다.`); }
  });
}

// ---------- 화면 ----------
{
  const baseName = UI.equipName;
  UI.equipName = function (it) {
    const h = baseName.call(this, it);
    return it && it.plus ? h.replace(`>${it.name}</b>`, `>${it.name} <span class="amber">+${it.plus}</span></b>`) : h;
  };
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    const p = G.player; const pm = G.priceMul();
    const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(Math.round(v))}</span>`;
    if (id === 'workshop') {
      const gear = [...Object.values(p.equip).filter(Boolean), ...p.inventory];
      const smithLv = p.smith >= 80 ? '의형제 같은 사이' : p.smith >= 50 ? '단골' : p.smith >= 20 ? '아는 얼굴' : '처음 보는 손님';
      html += `<div class="sec-title sec">장비 강화 · ${SMITH_NAME} <span class="small dim">(${smithLv} · 성공률 +${Math.floor(p.smith / 10)}%${reg.id === 'suwon' ? ', 수원 +5%' : ''})</span></div>
        <div class="small dim">단계당 능력치 +8%. +7부터는 실패하면 단계가 내려가거나 부서진다.</div>
        <div class="cards">${gear.map((it) => { const c = G.plusCost(it); const max = (it.plus || 0) >= PLUS_MAX; const eq = Object.values(p.equip).includes(it);
          return this.equipRow(it, max ? '<span class="small amber">최대</span>' : `<button class="sm ${(it.plus || 0) >= 7 ? 'danger' : ''}" data-act="enhance" data-v="${it.uid}">${G.plusRate(it)}% · ${coin(c.money * pm)}</button>`,
            ` · ${eq ? '<span class="amber">장착 중</span> · ' : ''}${coreName(c.tier)} ${c.cores}개`); }).join('') || '<div class="small dim">강화할 장비가 없다.</div>'}</div>`;
      const owned = Object.entries(p.parts).filter(([, n]) => n > 0);
      const can = [];
      for (const rc of GEAR_RECIPES) for (let t = 0; t < 8; t++) if (G.partCount(rc.part, t) > 0) can.push({ rc, t });
      html += `<div class="sec-title sec">괴수 부산물 제작</div>
        <div class="small dim">보유: ${owned.map(([k, n]) => { const [pid, t] = k.split(':'); return `${G.partLabel(pid, +t)} ${n}`; }).join(' · ') || '없음'}. 괴수를 쓰러뜨리면 형태마다 다른 부산물이 나온다.</div>
        <div class="cards">${can.map(({ rc, t }) => { const n = G.partCount(rc.part, t); const ok = n >= rc.n && G.coreCount(t) >= 2;
          return `<div class="item-row"><div class="grow"><b>[${RANKS[t].key}] ${rc.name}</b> <span class="small dim">${this.slotName(rc.slot)}${rc.rarity ? ' · 영웅' : ''}</span>
            <div class="small dim">${G.partLabel(rc.part, t)} ${n}/${rc.n} · ${coreName(t)} 2개 · ${Object.keys(rc.mul).map((k) => MOD_NAME[k] || k).join('·')} 특화</div></div>
            <button class="sm" data-act="craft-gear" data-v="${rc.id}|${t}" ${ok ? '' : 'disabled'}>${coin(150 * RANKS[t].mult * pm)}</button></div>`; }).join('') || '<div class="small dim">만들 수 있는 것이 없다.</div>'}
        ${owned.length ? '<div class="row end"><button class="sm ghost" data-act="sell-parts">부산물 일괄 판매</button></div>' : ''}</div>`;
    }
    if (id === 'merc') {
      html += `<div class="sec-title sec">포터 (비전투)</div><div class="item-row"><div class="grow"><b>${G.hasPorter() ? `${p.porter.name} · ${p.porter.until - G.monthKey() + 1}개월 남음` : '짐꾼 고용'}</b>
        <div class="small dim">전투엔 나서지 않는다. 코어·부산물 +30%, 게이트 크레딧 +10%. 파티 칸을 차지하지 않는다.</div></div>
        <button class="sm" data-act="hire-porter">${G.hasPorter() ? '연장' : '3개월'} ${coin(G.porterFee() * 3 * pm)}</button></div>`;
    }
    if (id === 'tavern') {
      const done = p.intel[reg.id] === G.monthKey();
      const known = G.mapGates.filter((g) => g.region === reg.id && g.intel);
      html += `<div class="sec-title sec">구석 자리의 정보 브로커</div><div class="item-row"><div class="grow"><b>이 지역 게이트 정보</b>
        <div class="small dim">등급 오판·숨은 구역 같은 게이트의 정체를 미리 알려 준다. 열에 하나쯤은 틀린다.</div></div>
        <button class="sm" data-act="buy-intel" ${done ? 'disabled' : ''}>${done ? '이번 달 구매함' : coin(G.intelCost() * pm)}</button></div>
        ${known.map((g) => `<div class="small">· ${G.gateName(g)} — ${G.intelText(g)}</div>`).join('')}`;
    }
    return html;
  };
  // 게이트 조우 창에 브로커 정보
  const baseEnc = UI.encounter;
  UI.encounter = function (obj) {
    const r = baseEnc.call(this, obj);
    if (obj.kind === 'gate' && obj.intel) { const row = $box.querySelector('.enc .row'); if (row) row.insertAdjacentHTML('beforeend', ` <span class="tag ${obj.intel.said === 'normal' ? '' : 'amber'}">정보: ${G.intelText(obj)}</span>`); }
    return r;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    return G.hasPorter() ? html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `<div class="small dim">동행 포터: ${G.player.porter.name} (${G.player.porter.until - G.monthKey() + 1}개월)</div><div class="sec"><div class="sec-title">선천 특성</div>`) : html;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'enhance': { const r = G.enhance(v); G.save(); return this.afterCity(stripTags(r)); }
      case 'craft-gear': { const [rid, t] = v.split('|'); const r = G.craftGear(rid, +t); G.save(); return this.afterCity(r); }
      case 'sell-parts': return this.afterCity(G.sellParts());
      case 'hire-porter': return this.afterCity(G.hirePorter());
      case 'buy-intel': return this.afterCity(G.buyIntel());
      default: return baseHandle.call(this, act, v);
    }
  };
}
