// ===== 장비·아이템 (3): 길드 브랜드 세트 · 장비 칸 늘리기 · 고유 장비 =====
// 설계: docs/장비_아이템_점검.md 2장 5·7·6 (사용자 승인)
//  - 다섯 세력이 곧 장비 회사다. 같은 브랜드 2개·3개를 갖추면 세트 효과. 그 길드 본부 도시 마켓에서 주로 판다.
//  - B급에 장신구 2번째 칸, A급에 보조 칸(방패·드론·단검·총 계열 무기를 능력치 50%로).
//  - 이름과 사연이 있는 고유 장비 20종(신화 등급). 보스·히든 피스 금고에서만 나온다. 도감에 모인다.

const BRANDS = {
  baekho: { short: '백호', name: '백호 전술 장비', set: { 2: { def: 0.08 }, 3: { def: 0.15, hp: 0.05 } } },
  hyeonmu: { short: '현무', name: '현무 외골격', set: { 2: { hp: 0.08 }, 3: { hp: 0.1, atk: 0.08 } } },
  cheongryong: { short: '청룡', name: '청룡 에테르 장비', set: { 2: { mp: 0.12 }, 3: { mp: 0.15, train: 0.08 } } },
  jujak: { short: '주작', name: '주작 수제 장비', set: { 2: { spd: 0.06 }, 3: { spd: 0.1, luck: 0.15 } } },
  kama: { short: '관리국', name: '관리국 지급품', set: { 2: { atk: 0.04, def: 0.04 }, 3: { atk: 0.05, def: 0.05, hp: 0.05 } } },
};
const SUB_FAMS = ['shield', 'drone', 'dagger', 'gun'];
const EXTRA_SLOTS = [{ slot: 'acc2', name: '장신구 2', rank: 4, of: 'acc' }, { slot: 'sub', name: '보조', rank: 5, of: 'weapon' }];
const UNIQUES = [
  { id: 'u_blackflame', name: '1세대 S급의 흑염검', slot: 'weapon', fam: 'sword', elem: 'fire', mul: { atk: 1.25 }, mods: { atk: 0.06 }, lore: '대붕괴를 막다 사라진 검사의 검. 아직도 불꽃이 꺼지지 않는다.' },
  { id: 'u_gasmask', name: '대붕괴 첫날의 방독면', slot: 'acc', mul: { mp: 1.1 }, mods: { hp: 0.08, heal: 0.15 }, lore: '그날 살아남은 사람 중 하나가 쓰고 있던 것.' },
  { id: 'u_shard_ring', name: '원초 게이트의 파편 반지', slot: 'acc', mul: { mp: 1.2, luck: 1.5 }, mods: { breakthrough: 6 }, lore: '원초의 게이트에서 튀어나온 돌조각을 깎았다.' },
  { id: 'u_iron_wall', name: '강북 방어선의 철벽', slot: 'armor', mul: { def: 1.35, hp: 1.2 }, mods: { def: 0.05 }, lore: '강북이 버려지던 밤, 마지막까지 서 있던 방패병의 갑옷.' },
  { id: 'u_frost_rifle', name: '동해 저격수의 서리 라이플', slot: 'weapon', fam: 'gun', elem: 'water', mul: { atk: 1.2, spd: 1.2 }, mods: { luck: 0.1 }, lore: '해안 전선에서 300마리를 쏘았다는 전설의 총.' },
  { id: 'u_thunder_lance', name: '천둥 기수의 창', slot: 'weapon', fam: 'spear', elem: 'bolt', mul: { atk: 1.3 }, mods: { spd: 0.05 }, lore: '쓰러뜨린 천둥 기수의 창을 그대로 썼다.' },
  { id: 'u_spirit_bell', name: '망자의 합창단 종', slot: 'weapon', fam: 'instr', elem: 'dark', mul: { atk: 1.05, mp: 1.4 }, mods: { mp: 0.1, social: 0.08 }, lore: '흔들면 누군가의 노래가 들린다.' },
  { id: 'u_queen_silk', name: '거미 여왕의 비단 망토', slot: 'armor', elem: 'wood', mul: { def: 1.1, hp: 1.35 }, mods: { spd: 0.05 }, lore: '가시 거미 여왕의 둥지에서 뜯어 온 실로 짰다.' },
  { id: 'u_watcher_eye', name: '심연 감시자의 눈', slot: 'acc', mul: { mp: 1.3 }, mods: { luck: 0.2, atk: 0.04 }, lore: '감은 적이 없는 눈. 끼고 있으면 잠이 줄어든다.' },
  { id: 'u_sun_core', name: '태양의 잔해 심장석', slot: 'acc', elem: 'fire', mul: { mp: 1.1 }, mods: { atk: 0.07, life: -2 }, lore: '쥐고 있으면 손바닥이 늘 뜨겁다.' },
  { id: 'u_old_badge', name: '관리국 1호 배지', slot: 'acc', mul: { mp: 0.9 }, mods: { social: 0.12, price: -0.05 }, lore: '관리국이 처음 발급한 각성자 등록증 배지.' },
  { id: 'u_hunter_coat', name: '무명 헌터의 낡은 코트', slot: 'armor', mul: { def: 1.15, hp: 1.15 }, mods: { train: 0.06, luck: 0.06 }, lore: '주머니에 쪽지가 있다. "다음 사람을 지켜 줘."' },
  { id: 'u_twin_fang', name: '쌍둥이 송곳니', slot: 'weapon', fam: 'dagger', elem: 'wood', mul: { atk: 1.15, spd: 1.5 }, mods: { spd: 0.06 }, lore: '서로를 찾아 울리는 두 자루의 단검.' },
  { id: 'u_choir_staff', name: '사제의 공명 지팡이', slot: 'weapon', fam: 'staff', elem: 'holy', mul: { atk: 1.1, mp: 1.5 }, mods: { heal: 0.2 }, lore: '대붕괴 때 무너진 성당 종탑에서 나왔다.' },
  { id: 'u_titan_fist', name: '고목 거신의 주먹', slot: 'weapon', fam: 'fist', elem: 'wood', mul: { atk: 1.3, def: 1 }, mods: { hp: 0.05 }, lore: '고목 거신의 옹이진 손가락 마디를 그대로 끼웠다.' },
  { id: 'u_wyvern_bow', name: '폭풍 와이번 힘줄 활', slot: 'weapon', fam: 'bow', elem: 'bolt', mul: { atk: 1.2, spd: 1.3 }, mods: { luck: 0.08 }, lore: '시위를 당기면 바람이 먼저 운다.' },
  { id: 'u_aegis_drone', name: '이지스 호위 드론', slot: 'weapon', fam: 'drone', mul: { atk: 1.05, def: 1 }, mods: { def: 0.06, mp: 0.06 }, lore: '주인을 잃고 몇 년을 혼자 순찰하던 드론.' },
  { id: 'u_glacier_plate', name: '빙결 고룡의 비늘갑', slot: 'armor', elem: 'water', mul: { def: 1.4, hp: 1.3 }, mods: {}, lore: '녹지 않는 비늘. 여름에도 서리가 낀다.' },
  { id: 'u_lucky_coin', name: '노점상 할머니의 동전', slot: 'acc', mul: { mp: 0.8, luck: 3 }, mods: { luck: 0.25 }, lore: '"이거 가져가. 운이 좋아질 거야." 정말이었다.' },
  { id: 'u_last_letter', name: '마지막 편지가 든 펜던트', slot: 'acc', mul: { mp: 1 }, mods: { hp: 0.06, mp: 0.06, breakthrough: 3 }, lore: '열어 보지 않았다. 아직은.' },
];
const uniqById = (id) => UNIQUES.find((u) => u.id === id);

Object.assign(Game.prototype, {
  gear3Init() { const p = this.player; if (!p) return; p.equip.acc2 ??= null; p.equip.sub ??= null; p.uniqSeen ??= []; },
  slotOpen(slot) { const s = EXTRA_SLOTS.find((x) => x.slot === slot); return !s || this.player.rankIdx >= s.rank; },
  brandCount() { const c = {}; for (const e of Object.values(this.player.equip || {})) if (e && e.brand) c[e.brand] = (c[e.brand] || 0) + 1; return c; },
  brandMod(key) {
    let v = 0;
    for (const [b, n] of Object.entries(this.brandCount())) { const B = BRANDS[b]; if (!B) continue; const tier = n >= 3 ? 3 : n >= 2 ? 2 : 0; if (tier && B.set[tier][key]) v += B.set[tier][key]; }
    return v;
  },
  uniqMod(key) { let v = 0; for (const e of Object.values(this.player.equip || {})) if (e && e.uniq) { const U = uniqById(e.uniq); if (U && U.mods[key]) v += U.mods[key]; } return v; },
  makeUnique(id, tier) {
    const U = uniqById(id) || RNG.pick(UNIQUES);
    const t = Math.max(0, Math.min(7, tier));
    const it = this.makeEquipment(U.slot, t, 3);
    const m = RANKS[t].mult * RARITY[4].mult;
    const base = { atk: 8 * m, def: 5 * m, hp: 30 * m, mp: 20 * m, spd: 2 * m, luck: 3 * RARITY[4].mult };
    for (const k of ['atk', 'def', 'hp', 'mp', 'spd', 'luck']) delete it[k];
    const def = U.slot === 'weapon' ? { atk: 1 } : U.slot === 'armor' ? { def: 1, hp: 1 } : { mp: 1 };
    for (const [k, v] of Object.entries({ ...def, ...U.mul })) it[k] = Math.round(base[k] * v);
    Object.assign(it, { rarity: 4, uniq: U.id, name: `「${U.name}」`, fam: U.fam || (U.slot === 'weapon' ? null : undefined), elem: U.elem || null, brand: null, value: Math.round(it.value * 2.5) });
    if (!this.player.uniqSeen.includes(U.id)) this.player.uniqSeen.push(U.id);
    return it;
  },
  rollUniqueDrop(tier) {
    const pool = UNIQUES.filter((u) => !this.player.uniqSeen.includes(u.id));
    const U = pool.length ? RNG.pick(pool) : RNG.pick(UNIQUES);
    const it = this.makeUnique(U.id, tier);
    this.player.inventory.push(it);
    this.lifeEvent(`고유 장비 ${it.name}을(를) 얻었다.`);
    return it;
  },
  equipExtra(uid, slot) {
    const p = this.player; const it = p.inventory.find((e) => e.uid === uid);
    const S = EXTRA_SLOTS.find((x) => x.slot === slot);
    if (!it || !S || !this.slotOpen(slot)) return '';
    if (it.slot !== S.of) return '';
    if (slot === 'sub' && !SUB_FAMS.includes(this.weaponFam ? this.weaponFam(it) : it.fam)) return '보조 칸에는 방패·드론·단검·총 계열만 낀다.';
    if (p.equip[slot] && p.equip[slot].cursed) return '저주받은 장비가 떨어지지 않는다.';
    p.inventory = p.inventory.filter((e) => e !== it);
    if (p.equip[slot]) p.inventory.push(p.equip[slot]);
    p.equip[slot] = it; this.recalc();
    return `${it.name}을(를) ${S.name} 칸에 장착했다.`;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.gear3Init(); });
  wrap('extraMod', function (base, key) { let v = base.call(this, key); if (this.player && this.player.equip) v += this.brandMod(key) + this.uniqMod(key); return v; });
  // 추가 칸 능력치(보조는 50%)
  wrap('recalc', function (base) {
    base.call(this);
    const p = this.player; if (!p || !p.equip) return;
    const inj = p.injured > 0 ? 0.8 : 1;
    for (const [slot, f] of [['acc2', 1], ['sub', 0.5]]) {
      const e = p.equip[slot]; if (!e) continue;
      p.maxHp += Math.round((e.hp || 0) * f); p.maxMp += Math.round((e.mp || 0) * f);
      p.atk += Math.round((e.atk || 0) * f * inj); p.def += Math.round((e.def || 0) * f * inj);
      p.spd += Math.round((e.spd || 0) * f); p.luck += Math.round((e.luck || 0) * f);
    }
  });
  wrap('unequip', function (base, slot) {
    const p = this.player;
    if (slot === 'acc2' || slot === 'sub') { const e = p.equip[slot]; if (!e || e.cursed) return; p.inventory.push(e); p.equip[slot] = null; this.recalc(); return; }
    return base.call(this, slot);
  });
  // 브랜드: 새 장비 일부, 길드 본부 도시 마켓은 그 길드 브랜드
  wrap('makeEquipment', function (base, slot, tier, rarityIdx) {
    const it = base.call(this, slot, tier, rarityIdx);
    if (RNG.chance(0.1)) { it.brand = RNG.pick(Object.keys(BRANDS)); it.name += ` 〈${BRANDS[it.brand].short}〉`; }
    return it;
  });
  wrap('getShop', function (base) {
    const s = base.call(this); const reg = this.region();
    if (s && !s.brandDone) {
      s.brandDone = true;
      if (reg.guild && BRANDS[reg.guild]) for (const it of s.equips.slice(0, 3)) if (!it.brand) { it.brand = reg.guild; it.name += ` 〈${BRANDS[reg.guild].short}〉`; }
    }
    return s;
  });
  // 고유 장비: 보스에게서 드물게
  wrap('lootFromKills', function (base, kills, boss) {
    const lines = base.call(this, kills, boss);
    const p = this.player; if (!p || !p.uniqSeen) return lines;
    for (const k of kills || []) if (k.boss && !k.portrait && RNG.chance(0.025 + Math.max(0, p.luck - 10) / 2000)) { const it = this.rollUniqueDrop(k.tier || 0); lines.push(`<span class="amber">고유 장비!</span> ${it.name}`); break; }
    return lines;
  });
  if (GP.hiddenGrant) wrap('hiddenGrant', function (base, h) {
    const r = base.call(this, h);
    const t = typeof hiddenTpl === 'function' && hiddenTpl(h.id);
    if (t && (t.kind === 'vault' || t.kind === 'heart')) { const it = this.rollUniqueDrop(this.player.rankIdx); return `${r} 그리고 고유 장비 ${it.name}.`; }
    return r;
  });
  // 칸이 열리는 순간
  wrap('breakthrough', function (base) {
    const before = this.player.rankIdx; const r = base.call(this);
    if (r && r.ok) for (const S of EXTRA_SLOTS) if (before < S.rank && this.player.rankIdx >= S.rank) { r.msg += ` 새 장비 칸 열림: ${S.name}.`; this.log(`새 장비 칸이 열렸다: ${S.name}`, 'major'); }
    return r;
  });
}

// ---------- 화면 ----------
{
  const baseStats = UI.equipStats;
  UI.equipStats = function (it) {
    let s = baseStats.call(this, it);
    if (it.brand && BRANDS[it.brand]) { const B = BRANDS[it.brand]; s += ` · <span title="2세트 ${modsText(B.set[2])} / 3세트 ${modsText(B.set[3])}">${B.name}</span>`; }
    if (it.uniq) { const U = uniqById(it.uniq); if (U) s += `${Object.keys(U.mods).length ? `<br><span class="amber">${modsText(U.mods)}</span>` : ''}<br><i class="dim">${U.lore}</i>`; }
    return s;
  };
  const baseRow = UI.equipRow;
  UI.equipRow = function (it, right, extra = '') {
    const p = G.player;
    if (it && p.inventory.includes(it)) {
      let add = '';
      if (it.slot === 'acc' && G.slotOpen('acc2')) add += `<button class="sm ghost" data-act="equip-extra" data-v="${it.uid}|acc2">2번 칸</button>`;
      if (it.slot === 'weapon' && G.slotOpen('sub') && SUB_FAMS.includes(G.weaponFam ? G.weaponFam(it) : it.fam)) add += `<button class="sm ghost" data-act="equip-extra" data-v="${it.uid}|sub">보조</button>`;
      if (add && right) right = `<span class="row">${add}${right}</span>`;
    }
    return baseRow.call(this, it, right, extra);
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    let html = baseChar.call(this);
    const p = G.player;
    const open = EXTRA_SLOTS.filter((S) => G.slotOpen(S.slot));
    const bc = Object.entries(G.brandCount()).filter(([, n]) => n >= 2);
    let sec = '';
    if (open.length || bc.length) {
      sec = `<div class="sec"><div class="sec-title">장착 장비 · 추가 칸</div><div class="cards">${open.map((S) => { const it = p.equip[S.slot];
        return it ? this.equipRow(it, `<button class="sm ghost" data-act="unequip" data-v="${S.slot}">해제</button>`, ` · ${S.name}${S.slot === 'sub' ? '(50%)' : ''}`) : `<div class="item-row"><div class="grow dim small">${S.name} 칸 비어 있음${S.slot === 'sub' ? ' · 방패·드론·단검·총 계열 무기를 능력치 50%로' : ''}</div></div>`; }).join('')}
        ${bc.map(([b, n]) => `<div class="small amber">${BRANDS[b].name} ${n}세트: ${modsText(BRANDS[b].set[n >= 3 ? 3 : 2])}</div>`).join('')}</div></div>`;
    }
    const codex = `<div class="sec"><div class="sec-title">고유 장비 도감 · ${p.uniqSeen.length}/${UNIQUES.length}</div><div class="small dim">${p.uniqSeen.length ? p.uniqSeen.map((id) => `「${uniqById(id).name}」`).join(' ') : '보스와 히든 피스에서 이름 있는 장비가 나온다.'}</div></div>`;
    const at = html.indexOf('<div class="sec"><div class="sec-title">가방</div>');
    html = at < 0 ? html + sec : html.slice(0, at) + sec + html.slice(at);
    return html + codex;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'equip-extra') { const [uid, slot] = v.split('|'); return this.after(G.equipExtra(uid, slot)); }
    return baseHandle.call(this, act, v);
  };
}
