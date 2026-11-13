// ===== 장비 칸 확장: 방어구 5 · 장신구 3 · 장비 풀 확대 =====
// 사용자 요청: 방어구 장착칸 5, 액세서리 장착칸 3, 장비도 그만큼 늘림.
// 방어구 부위: 몸통·투구·장갑·장화·망토. 장신구는 acc/acc2/acc3.
// 옛 저장은 initSandbox 감싸기에서 ??= null 로 칸만 채운다.

const ARMOR_PARTS = {
  armor: {
    name: '몸통',
    w: 3,
    mul: { def: 1, hp: 1 },
    names: [
      '전술 코트', '나노 섬유 수트', '세라믹 플레이트', '중장 외골격', '에테르 장막', '유물 갑주',
      '케블라 재킷', '방탄 조끼', '강화 흉갑', '그림자 슈트', '룬 갑주', '게이트 방호복',
    ],
  },
  helm: {
    name: '투구',
    w: 2,
    mul: { def: 0.5, hp: 0.55, mp: 0.35 },
    names: [
      '전술 헬멧', '바이저 마스크', '세라믹 투구', '에테르 후드', '유물 면갑', '방호 고글',
      '강습 헬름', '룬 서클릿', '야간 옵틱스', '강철 면갑', '사막 후드', '심연 면갑',
    ],
  },
  gloves: {
    name: '장갑',
    w: 2,
    mul: { def: 0.4, hp: 0.35, atk: 0.3 },
    names: [
      '전술 글러브', '충격 흡수 장갑', '마나 건틀릿 커버', '유물 수갑', '절단 방지 장갑',
      '암살자 글러브', '강화 권투대', '룬 손목띠', '사수 글러브', '강철 건틀릿', '에테르 손싸개',
    ],
  },
  boots: {
    name: '장화',
    w: 2,
    mul: { def: 0.4, hp: 0.4, spd: 1.15 },
    names: [
      '전술 부츠', '소음 억제 장화', '자력 등산화', '유물 각반', '방수 전투화',
      '질주 슈즈', '중장 각반', '모래 장화', '룬 각반', '비행 부츠', '심연 장화',
    ],
  },
  cloak: {
    name: '망토',
    w: 2,
    mul: { def: 0.45, hp: 0.5, mp: 0.45, luck: 0.7 },
    names: [
      '전술 망토', '위장 케이프', '에테르 숄', '유물 외투', '방풍 로브',
      '그림자 망토', '성광 케이프', '방한 외투', '룬 망토', '정찰 케이프', '심연 로브',
    ],
  },
};
const ARMOR_SLOT_IDS = Object.keys(ARMOR_PARTS);
const ACC_SLOT_IDS = ['acc', 'acc2', 'acc3'];
const ACC_SLOT_NAMES = { acc: '장신구 1', acc2: '장신구 2', acc3: '장신구 3' };

// 장신구·무기 이름 풀 확대 (칸이 늘면 드롭·상점 다양성도 맞춤)
EQUIP_TEMPLATES.weapon.push(
  '진동 도끼', '고주파 카타나', '레일 스나이퍼', '공명 창', '에테르 해머',
  '그림자 단검쌍', '성광 메이스', '폭풍 활', '파쇄 건틀릿', '전술 방패창'
);
EQUIP_TEMPLATES.armor.push(
  '케블라 재킷', '방탄 조끼', '강화 흉갑', '그림자 슈트', '룬 갑주', '게이트 방호복'
);
EQUIP_TEMPLATES.acc.push(
  '전투 통신칩', '각성 안정기', '운명의 부적', '마나 배터리', '유물 귀걸이',
  '게이트 나침반', '심안 렌즈', '회복 팔찌', '치명 반지', '명성 배지', '은밀 목걸이', '수련 팔찌'
);

const armorPartOf = (slot) => ARMOR_PARTS[slot] || null;
const isArmorSlot = (slot) => !!ARMOR_PARTS[slot];
const isAccSlot = (slot) => ACC_SLOT_IDS.includes(slot);
const equipSlotKind = (slot) => (slot === 'weapon' || slot === 'sub' ? 'weapon' : isArmorSlot(slot) ? 'armor' : isAccSlot(slot) ? 'acc' : slot);

Object.assign(Game.prototype, {
  armorSlots() { return ARMOR_SLOT_IDS.slice(); },
  accSlots() { return ACC_SLOT_IDS.slice(); },
  equipSlotsInit() {
    const p = this.player; if (!p || !p.equip) return;
    for (const s of ARMOR_SLOT_IDS) p.equip[s] ??= null;
    for (const s of ACC_SLOT_IDS) p.equip[s] ??= null;
    // 시작 장비·옛 저장이 몸통 칸에 넣어 둔 다른 부위 장비를 제자리로 옮긴다.
    for (const slot of ARMOR_SLOT_IDS) {
      const item = p.equip[slot];
      if (!item || !isArmorSlot(item.slot) || item.slot === slot) continue;
      p.equip[slot] = null;
      if (!p.equip[item.slot]) p.equip[item.slot] = item;
      else if (p.equip[item.slot] !== item && !p.inventory.includes(item)) p.inventory.push(item);
    }
  },
  pickArmorPart() {
    const keys = ARMOR_SLOT_IDS;
    const weights = keys.map((k) => ARMOR_PARTS[k].w);
    return RNG.weighted(keys, weights);
  },
  freeAccSlot() { return ACC_SLOT_IDS.find((s) => !this.player.equip[s]) || null; },
  equipAccTo(uid, slot) {
    const p = this.player;
    if (!isAccSlot(slot)) return '';
    const it = p.inventory.find((e) => e.uid === uid);
    if (!it || equipSlotKind(it.slot) !== 'acc') return '';
    if (p.equip[slot] && p.equip[slot].cursed) return '저주받은 장비가 떨어지지 않는다.';
    p.inventory = p.inventory.filter((e) => e !== it);
    if (p.equip[slot]) p.inventory.push(p.equip[slot]);
    // 같은 장신구가 다른 칸에 있으면 비운다
    for (const s of ACC_SLOT_IDS) if (p.equip[s] === it) p.equip[s] = null;
    it.slot = 'acc';
    p.equip[slot] = it;
    this.recalc();
    return `${it.name}을(를) ${ACC_SLOT_NAMES[slot]}에 장착했다.`;
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) { base.call(this); this.equipSlotsInit(); });

  // 방어구 생성 시 부위를 정해 칸·이름·능력치를 맞춘다
  wrap('makeEquipment', function (base, slot, tier, rarityIdx) {
    let part = null;
    let want = slot;
    if (slot === 'armor') {
      part = this.pickArmorPart();
      want = 'armor';
    } else if (isArmorSlot(slot)) {
      part = slot;
      want = 'armor';
    }
    const it = base.call(this, want, tier, rarityIdx);
    if (part) {
      const P = ARMOR_PARTS[part];
      it.slot = part;
      const brandTag = it.brand && typeof BRANDS !== 'undefined' && BRANDS[it.brand] ? ` 〈${BRANDS[it.brand].short}〉` : '';
      const elemPre = (it.elem && typeof ELEM_PREFIX !== 'undefined' && ELEM_PREFIX[it.elem]) ? `${ELEM_PREFIX[it.elem]} ` : '';
      const baseName = RNG.pick(P.names);
      for (const k of ['atk', 'def', 'hp', 'mp', 'spd', 'luck']) delete it[k];
      const m = RANKS[it.tier].mult * RARITY[Math.min(it.rarity, RARITY.length - 1)].mult;
      const seed = { atk: 8 * m, def: 5 * m, hp: 30 * m, mp: 20 * m, spd: 2 * m, luck: 3 * RARITY[Math.min(it.rarity, RARITY.length - 1)].mult };
      for (const [k, mul] of Object.entries(P.mul)) {
        const v = Math.round((seed[k] || 0) * mul);
        if (v) it[k] = v;
      }
      if (!it.uniq) it.name = `[${RANKS[it.tier].key}] ${elemPre}${baseName}${brandTag}`;
    }
    if ((want === 'acc' || slot === 'acc') && !it.uniq) {
      // 장신구 3칸 대비: 개당 약 75% (합치면 예전 1칸보다 두툼)
      for (const k of ['mp', 'luck', 'spd', 'hp', 'def', 'atk']) if (it[k]) it[k] = Math.max(1, Math.round(it[k] * 0.75));
      const brandTag = it.brand && typeof BRANDS !== 'undefined' && BRANDS[it.brand] ? ` 〈${BRANDS[it.brand].short}〉` : '';
      const baseName = RNG.pick(EQUIP_TEMPLATES.acc);
      it.name = `[${RANKS[it.tier].key}] ${baseName}${brandTag}`;
    }
    return it;
  });

  // 고유 장비는 지정 칸(몸통/무기/장신구)을 유지한다
  if (GP.makeUnique) wrap('makeUnique', function (base, id, tier) {
    const it = base.call(this, id, tier);
    const U = typeof uniqById === 'function' ? uniqById(it.uniq || id) : null;
    if (U && (U.slot === 'armor' || U.slot === 'weapon' || U.slot === 'acc')) it.slot = U.slot;
    return it;
  });

  // 장신구는 빈 칸을 우선, 방어구는 자기 부위 칸
  wrap('equipItem', function (base, uid) {
    const p = this.player;
    const it = p.inventory.find((e) => e.uid === uid);
    if (!it) return;
    if (equipSlotKind(it.slot) === 'acc') {
      const target = this.freeAccSlot() || 'acc';
      if (p.equip[target] && p.equip[target].cursed) return;
      p.inventory = p.inventory.filter((e) => e !== it);
      if (p.equip[target]) p.inventory.push(p.equip[target]);
      it.slot = 'acc';
      p.equip[target] = it;
      this.recalc();
      return;
    }
    // 옛 저장·제작 방어구(slot=armor)는 몸통 칸
    if (it.slot === 'armor' || isArmorSlot(it.slot)) {
      const target = isArmorSlot(it.slot) ? it.slot : 'armor';
      if (p.equip[target] && p.equip[target].cursed) return;
      p.inventory = p.inventory.filter((e) => e !== it);
      if (p.equip[target]) p.inventory.push(p.equip[target]);
      it.slot = target;
      p.equip[target] = it;
      this.recalc();
      return;
    }
    return base.call(this, uid);
  });

  // 몸통 외 방어구·장신구 2·3 능력치
  wrap('recalc', function (base) {
    base.call(this);
    const p = this.player; if (!p || !p.equip) return;
    const inj = p.injured > 0 ? 0.8 : 1;
    // armor·acc·weapon은 기본 recalc, sub는 gear3. 여기선 추가 부위·장신구 칸만.
    const extra = [...ARMOR_SLOT_IDS.filter((s) => s !== 'armor'), 'acc2', 'acc3'];
    for (const slot of extra) {
      const e = p.equip[slot]; if (!e) continue;
      p.maxHp += Math.round(e.hp || 0);
      p.maxMp += Math.round(e.mp || 0);
      p.atk += Math.round((e.atk || 0) * inj);
      p.def += Math.round((e.def || 0) * inj);
      p.spd += Math.round(e.spd || 0);
      p.luck += Math.round(e.luck || 0);
    }
    p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp);
  });

  // 상점 장비 수 확대 (칸이 늘어난 만큼 구경거리도)
  wrap('getShop', function (base) {
    const s = base.call(this);
    if (!s || s.slotExpanded) return s;
    s.slotExpanded = true;
    const reg = this.region();
    const [lo, hi] = GATE_RANGES[reg.danger];
    const add = reg.id === 'suwon' ? 4 : reg.id === 'busan' ? 3 : 2;
    for (let i = 0; i < add; i++) {
      const rar = reg.id === 'busan' ? RNG.weighted([0, 1, 2, 3], [30, 35, 25, 10]) : RNG.weighted([0, 1, 2], [55, 32, 13]);
      const kind = RNG.weighted(['weapon', 'armor', 'acc'], [2, 4, 3]);
      const it = this.makeEquipment(kind, RNG.int(lo, Math.min(7, hi + (reg.id === 'suwon' ? 1 : 0))), rar);
      if (reg.id === 'busan') it.value = Math.round(it.value * RNG.range(0.6, 1.5));
      s.equips.push(it);
    }
    return s;
  });
}

// ---------- 화면 ----------
{
  const baseSlotName = UI.slotName;
  UI.slotName = function (s) {
    if (ARMOR_PARTS[s]) return ARMOR_PARTS[s].name;
    if (ACC_SLOT_NAMES[s]) return ACC_SLOT_NAMES[s];
    if (s === 'sub') return '보조';
    return baseSlotName.call(this, s) || s;
  };

  const baseIcon = UI.slotIcon;
  UI.slotIcon = function (slot, color) {
    const kind = equipSlotKind(slot);
    return baseIcon.call(this, kind === 'armor' ? 'armor' : kind === 'acc' ? 'acc' : (slot === 'sub' ? 'weapon' : slot), color);
  };

  const baseRow = UI.equipRow;
  UI.equipRow = function (it, right, extra = '') {
    const p = G.player;
    if (it && p.inventory.includes(it) && equipSlotKind(it.slot) === 'acc') {
      const btns = ACC_SLOT_IDS.map((s) => `<button class="sm ghost" data-act="equip-acc" data-v="${it.uid}|${s}">${ACC_SLOT_NAMES[s].replace('장신구 ', '')}</button>`).join('');
      if (right) right = `<span class="row" style="flex-wrap:wrap;gap:4px">${btns}${right}</span>`;
    }
    return baseRow.call(this, it, right, extra);
  };

  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    let html = baseChar.call(this);
    const p = G.player;
    const armorRows = ARMOR_SLOT_IDS.map((s) => {
      const it = p.equip[s];
      return it
        ? this.equipRow(it, `<button class="sm ghost" data-act="unequip" data-v="${s}">해제</button>`, ` · ${ARMOR_PARTS[s].name}`)
        : `<div class="item-row">${this.slotIcon(s, '#3a4560')}<div class="grow dim">${ARMOR_PARTS[s].name} 없음</div></div>`;
    }).join('');
    const accRows = ACC_SLOT_IDS.map((s) => {
      const it = p.equip[s];
      return it
        ? this.equipRow(it, `<button class="sm ghost" data-act="unequip" data-v="${s}">해제</button>`, ` · ${ACC_SLOT_NAMES[s]}`)
        : `<div class="item-row">${this.slotIcon(s, '#3a4560')}<div class="grow dim">${ACC_SLOT_NAMES[s]} 없음</div></div>`;
    }).join('');
    const block = `<div class="sec"><div class="sec-title">방어구 · 5칸</div><div class="cards">${armorRows}</div></div>`
      + `<div class="sec"><div class="sec-title">장신구 · 3칸</div><div class="cards">${accRows}</div></div>`;
    // 기존 "장착 장비"(무기·구 1방어·구 1장신)만 무기로 줄이고, 바로 뒤에 5·3칸을 붙인다
    // 장비 행 안에도 div가 여러 겹 있으므로 문자열 패턴으로 끝 태그를 찾으면
    // 첫 행 중간이 잘려 패널·스크롤 구조까지 깨진다. 구역 전체를 DOM으로 교체한다.
    const root = document.createElement('template'); root.innerHTML = html;
    const section = [...root.content.querySelectorAll('.sec')].find(sec => {
      const title = sec.querySelector(':scope > .sec-title');
      return title && title.textContent.trim() === '장착 장비';
    });
    if (section) {
      const w = p.equip.weapon;
      const weaponRow = w
        ? this.equipRow(w, `<button class="sm ghost" data-act="unequip" data-v="weapon">해제</button>`)
        : `<div class="item-row">${this.slotIcon('weapon', '#3a4560')}<div class="grow dim">무기 없음</div></div>`;
      section.outerHTML = `<div class="sec"><div class="sec-title">장착 장비</div><div class="cards">${weaponRow}</div></div>${block}`;
    }
    return root.innerHTML;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'equip-acc') {
      const [uid, slot] = String(v).split('|');
      return this.after(G.equipAccTo(uid, slot));
    }
    return baseHandle.call(this, act, v);
  };

  // 가방 비교 문구: 같은 부위 현재 장비와 비교
  const baseCompare = UI.compareHtml;
  if (baseCompare) UI.compareHtml = function (items) {
    const p = G.player;
    if (!items.length) return baseCompare.call(this, items);
    return `<div class="sec-title sec">얻은 장비</div><div class="cards">${items.map((it) => {
      const kind = equipSlotKind(it.slot);
      let cur = null;
      if (kind === 'acc') cur = ACC_SLOT_IDS.map((s) => p.equip[s]).find(Boolean) || null;
      else if (isArmorSlot(it.slot)) cur = p.equip[it.slot];
      else cur = p.equip[it.slot];
      const keys = ['atk', 'def', 'hp', 'mp', 'spd', 'luck'].filter((k) => it[k] || (cur && cur[k]));
      const arrow = (a, b) => { const d = (a || 0) - (b || 0); return d > 0 ? `<span class="good">▲${d}</span>` : d < 0 ? `<span class="bad">▼${-d}</span>` : '<span class="dim">=</span>'; };
      const cmp = keys.map((k) => `${(typeof MOD_NAME !== 'undefined' && MOD_NAME[k]) || k} ${it[k] || 0} ${cur ? arrow(it[k], cur[k]) : ''}`).join(' · ');
      return `<div class="item-row">${this.slotIcon(it.slot, RARITY[it.rarity].color)}<div class="grow">${this.equipName(it)} <span class="dim small">${this.slotName(it.slot)}</span><div class="small">${cmp}</div></div>
        <button class="sm primary" data-act="quick-equip" data-v="${it.uid}" ${cur && cur.cursed ? 'disabled' : ''}>바로 장착</button></div>`;
    }).join('')}</div>`;
  };
}
