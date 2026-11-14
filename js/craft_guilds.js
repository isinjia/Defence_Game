// ===== 제작 길드 · 장인 NPC (무기공·방어구공·장신구공) =====
// 사용자 승인: 4대 거대 길드에도 제작 부서가 있고, 전투 길드와 별도인 제작 전문 길드가 있다.
// 테마 세트는 게이트 드롭뿐 아니라 제작 길드·장인에게서도 만든다.

const CRAFT_ROLES = {
  weapon: { name: '무기공', slot: 'weapon', verb: '벼렸다' },
  armor: { name: '방어구공', slot: 'armor', verb: '두드렸다' },
  acc: { name: '장신구공', slot: 'acc', verb: '세공했다' },
};

// 제작 전문 중소 길드 (전투 공략보다 장비·강화가 본업)
const CRAFT_MINOR_GUILDS = {
  suwonforge: {
    name: '수원 갑주조합', home: 'suwon', elem: 'holy', color: '#c9b27a', size: 28, rep: 58, minRank: 0, fameReq: 0,
    style: '장인·방어구', spec: '중갑·사슬 제작', craftRoles: ['armor', 'weapon'],
    desc: '수원 산업 벨트의 방어구 장인들이 모인 조합. 판금과 사슬을 맞춰 준다.',
  },
  ulsanframe: {
    name: '울산 골격공방', home: 'ulsan', elem: 'water', color: '#8aa8c0', size: 34, rep: 54, minRank: 0, fameReq: 0,
    style: '장인·외골격', spec: '외골격·대형 무기', craftRoles: ['armor', 'weapon'],
    desc: '현무 중공업과 납품 계약을 맺은 외골격 공방 길드. 하중 프레임이 특기다.',
  },
  daejeonjewel: {
    name: '대전 정밀장신조합', home: 'daejeon', elem: 'wood', color: '#9ec98a', size: 19, rep: 52, minRank: 0, fameReq: 0,
    style: '장인·장신구', spec: '장신구·속성 부여', craftRoles: ['acc'],
    desc: '청룡 연구소 인근의 정밀 세공사들. 장신구와 에테르 회로를 다룬다.',
  },
};

// 4대 거대 길드 사내 제작 부서
const GUILD_CRAFT_DEPT = {
  baekho: { name: '백호 전술 장비과', roles: ['armor', 'acc'], sets: ['city_guard', 'iron_line'] },
  hyeonmu: { name: '현무 골격 제작반', roles: ['weapon', 'armor'], sets: ['factory_frame', 'iron_line'] },
  cheongryong: { name: '청룡 에테르 세공실', roles: ['acc', 'weapon'], sets: ['azure_robe', 'archive_charm'] },
  jujak: { name: '주작 수제 공방', roles: ['weapon', 'armor', 'acc'], sets: ['jujak_free', 'night_scout'] },
};

const CRAFT_CITY_SEED = {
  gangnam: ['weapon', 'armor', 'acc'],
  suwon: ['armor', 'weapon'],
  ulsan: ['armor', 'weapon'],
  daejeon: ['acc', 'weapon'],
  busan: ['weapon', 'acc'],
  incheon: ['weapon', 'armor'],
  gwangju: ['acc'],
  jeonju: ['acc', 'armor'],
};

const CRAFTER_NAMES = {
  weapon: ['한도철', '백망치', '서강철', '오열화'],
  armor: ['강판석', '윤사슬', '문중갑', '채가죽'],
  acc: ['이세공', '박수정', '김핀', '최회로'],
};

// ironbridge 등 기존 중소 길드에 제작 역할 표기
if (typeof MINOR_GUILDS !== 'undefined') {
  if (MINOR_GUILDS.ironbridge) MINOR_GUILDS.ironbridge.craftRoles = ['weapon', 'armor'];
  if (MINOR_GUILDS.bluesteel) MINOR_GUILDS.bluesteel.craftRoles = ['armor'];
  if (MINOR_GUILDS.greenlamp) MINOR_GUILDS.greenlamp.craftRoles = ['acc'];
  if (MINOR_GUILDS.suwonfort) MINOR_GUILDS.suwonfort.craftRoles = ['armor'];
  if (MINOR_GUILDS.harbor) MINOR_GUILDS.harbor.craftRoles = ['weapon'];
  if (MINOR_GUILDS.haeundae) MINOR_GUILDS.haeundae.craftRoles = ['weapon', 'acc'];
  if (MINOR_GUILDS.hanok) MINOR_GUILDS.hanok.craftRoles = ['acc'];
}

// 제작 길드를 MINOR_GUILDS / GUILDS에 합친다 (minor_guilds.js 이후 로드)
for (const [id, m] of Object.entries(CRAFT_MINOR_GUILDS)) {
  if (typeof REGIONS !== 'undefined' && !REGIONS.some((r) => r.id === m.home)) continue;
  if (typeof MINOR_GUILDS !== 'undefined') MINOR_GUILDS[id] = m;
  if (typeof GUILDS !== 'undefined') {
    GUILDS[id] = { ...m, minor: true, tier: 'minor' };
    if (typeof GUILD_TIER !== 'undefined') GUILD_TIER[id] = 'minor';
  }
}

Object.assign(Game.prototype, {
  craftInit() {
    const p = this.player; if (!p) return;
    p.craftRel ??= {}; // crafterKey → 관계 0~100
    p.themeSeen ??= [];
    this.seedCityCrafters();
  },
  seedCityCrafters() {
    const w = this.world; w.crafters ??= {};
    for (const [rid, roles] of Object.entries(CRAFT_CITY_SEED)) {
      if (w.crafters[rid]) continue;
      w.crafters[rid] = roles.map((role, i) => ({
        id: `${rid}_${role}`,
        role,
        name: CRAFTER_NAMES[role][i % CRAFTER_NAMES[role].length],
        guild: this.defaultCrafterGuild(rid, role),
      }));
    }
  },
  defaultCrafterGuild(rid, role) {
    const reg = typeof regionById === 'function' ? regionById(rid) : (REGIONS || []).find((r) => r.id === rid);
    if (reg && reg.guild && GUILD_CRAFT_DEPT[reg.guild] && GUILD_CRAFT_DEPT[reg.guild].roles.includes(role)) return reg.guild;
    const craftHome = Object.entries(CRAFT_MINOR_GUILDS).find(([, m]) => m.home === rid && (m.craftRoles || []).includes(role));
    if (craftHome) return craftHome[0];
    if (rid === 'incheon') return 'ironbridge';
    return null;
  },
  cityCrafters(regionId) {
    this.seedCityCrafters();
    return (this.world.crafters && this.world.crafters[regionId]) || [];
  },
  craftRelOf(cid) { return this.player.craftRel[cid] || 0; },
  addCraftRel(cid, d) {
    const p = this.player;
    p.craftRel[cid] = Math.max(0, Math.min(100, (p.craftRel[cid] || 0) + d));
  },
  craftBonus(cid) {
    // 관계 10당 강화 성공 +1%, 제작 비용 −1% (최대 8)
    return Math.min(8, Math.floor(this.craftRelOf(cid) / 10));
  },
  // 이 도시에서 만들 수 있는 테마 세트 (제작 길드·4대 부서·장인 길드)
  craftableThemes(regionId) {
    const reg = typeof regionById === 'function' ? regionById(regionId) : (REGIONS || []).find((r) => r.id === regionId);
    const ids = new Set();
    const markGuild = (gid) => {
      if (!gid) return;
      for (const T of THEME_SETS) {
        if ((T.craftGuilds || []).includes(gid)) ids.add(T.id);
      }
      const dept = GUILD_CRAFT_DEPT[gid];
      if (dept) for (const s of dept.sets) ids.add(s);
    };
    if (reg && reg.guild) markGuild(reg.guild);
    for (const c of this.cityCrafters(regionId)) markGuild(c.guild);
    // 제작 전문 길드 본거지
    for (const [gid, m] of Object.entries(CRAFT_MINOR_GUILDS)) if (m.home === regionId) markGuild(gid);
    if (typeof MINOR_GUILDS !== 'undefined' && MINOR_GUILDS.ironbridge && regionId === 'incheon') markGuild('ironbridge');
    // 아무 표기가 없어도 기본 세트 일부는 공방에서 가능 (입문용)
    if (!ids.size) { ids.add('city_guard'); ids.add('night_scout'); }
    return [...ids].map(themeById).filter(Boolean);
  },
  themeCraftCost(setId, pieceIdx) {
    const T = themeById(setId); const pc = T && T.pieces[pieceIdx];
    if (!pc) return null;
    const tier = this.player.rankIdx;
    const cores = 2 + (pc.slot === 'weapon' ? 1 : 0);
    const money = Math.round(220 * RANKS[tier].mult * (1 + pieceIdx * 0.15));
    return { tier, cores, money, slot: pc.slot };
  },
  findCrafterForSlot(regionId, slot) {
    const role = slot === 'weapon' ? 'weapon' : slot === 'armor' ? 'armor' : 'acc';
    const list = this.cityCrafters(regionId);
    return list.find((c) => c.role === role) || list[0] || null;
  },
  craftThemePiece(setId, pieceIdx) {
    const p = this.player;
    if (!this.onCity()) return '도시 공방에서만 만들 수 있다.';
    const T = themeById(setId); if (!T) return '';
    const themes = this.craftableThemes(this.region().id);
    if (!themes.some((t) => t.id === setId)) return '이 도시의 장인·제작 길드가 다루는 세트가 아니다.';
    const cost = this.themeCraftCost(setId, pieceIdx); if (!cost) return '';
    const crafter = this.findCrafterForSlot(this.region().id, cost.slot);
    const bonus = crafter ? this.craftBonus(crafter.id) : 0;
    const money = Math.round(cost.money * this.priceMul() * (1 - bonus * 0.01));
    if (this.coreCount(cost.tier) < cost.cores) return `${coreName(cost.tier)}가 ${cost.cores}개 필요하다.`;
    if (p.money < money) return '크레딧이 부족하다.';
    let need = cost.cores;
    for (let t = cost.tier; t < RANKS.length && need > 0; t++) {
      const u = Math.min(need, this.coreCount(t));
      p.mats['c' + t] -= u; need -= u;
    }
    p.money -= money;
    const rar = bonus >= 5 ? RNG.weighted([1, 2], [50, 50]) : RNG.weighted([0, 1, 2], [30, 50, 20]);
    const it = this.makeThemePiece(setId, pieceIdx, cost.tier, rar);
    p.inventory.push(it);
    if (crafter) {
      this.addCraftRel(crafter.id, 4);
      const role = CRAFT_ROLES[crafter.role];
      return fixJosa(`${crafter.name} ${role.name}이(가) ${it.name}을(를) ${role.verb}. (−${fmt(money)} 크레딧)`);
    }
    return fixJosa(`${it.name}을(를) 제작했다. (−${fmt(money)} 크레딧)`);
  },
  guildCraftDeptHtml(reg) {
    const gid = reg && reg.guild;
    const dept = gid && GUILD_CRAFT_DEPT[gid];
    if (!dept) return '';
    const g = GUILDS[gid];
    return `<div class="sec-title sec">${dept.name} <span class="small dim">${g ? g.name : ''} 사내 제작</span></div>
      <div class="small dim">소속이면 세트 제작비 10% 할인. 다루는 세트: ${dept.sets.map((id) => `〈${themeById(id).name}〉`).join(' · ')}</div>`;
  },
});

// 가격: 소속 거대 길드 사내 제작이면 할인
{
  const GP = Game.prototype;
  const baseCost = GP.themeCraftCost;
  GP.themeCraftCost = function (setId, pieceIdx) {
    const c = baseCost.call(this, setId, pieceIdx); if (!c) return c;
    const reg = this.region(); const p = this.player;
    if (reg && reg.guild && p.guild === reg.guild && GUILD_CRAFT_DEPT[reg.guild] && GUILD_CRAFT_DEPT[reg.guild].sets.includes(setId)) {
      c.money = Math.round(c.money * 0.9);
      c.guildDiscount = true;
    }
    return c;
  };
}

// ---------- 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.craftInit();
  });

  // 강화: 해당 슬롯 장인이 있으면 성공률 보정 + 관계 상승
  if (GP.plusRate) wrap('plusRate', function (base, it) {
    let r = base.call(this, it);
    if (!it || !this.onCity()) return r;
    const c = this.findCrafterForSlot(this.region().id, it.slot);
    if (c) r = Math.min(97, r + this.craftBonus(c.id));
    return r;
  });
  if (GP.enhance) wrap('enhance', function (base, uid) {
    const it = this.findGear(uid);
    const r = base.call(this, uid);
    if (it && this.onCity() && /성공/.test(String(r))) {
      const c = this.findCrafterForSlot(this.region().id, it.slot);
      if (c) this.addCraftRel(c.id, 2);
    }
    return r;
  });

  // 길드 정보: 제작 부서·제작 길드 표기
  if (typeof guildInfo === 'function') {
    const baseInfo = guildInfo;
    const patched = function (id) {
      let s = baseInfo(id);
      const dept = GUILD_CRAFT_DEPT[id];
      if (dept) s += `\n제작 부서: ${dept.name} (${dept.roles.map((r) => CRAFT_ROLES[r].name).join('·')})`;
      const m = (typeof MINOR_GUILDS !== 'undefined' && MINOR_GUILDS[id]) || CRAFT_MINOR_GUILDS[id];
      if (m && m.craftRoles) s += `\n제작 역할: ${m.craftRoles.map((r) => CRAFT_ROLES[r].name).join('·')}`;
      return s;
    };
    try { guildInfo = patched; } catch (e) { /* 환경에 따라 재할당 불가 */ }
    if (typeof globalThis !== 'undefined') globalThis.guildInfo = patched;
  }
}

// ---------- 공방 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    if (id !== 'workshop') return html;
    const p = G.player; const pm = G.priceMul();
    const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(Math.round(v))}</span>`;
    const crafters = G.cityCrafters(reg.id);
    html += `<div class="sec-title sec">장인</div>
      <div class="small dim">무기공·방어구공·장신구공이 칸을 나눠 맡는다. 관계를 쌓으면 강화 성공률이 오르고 제작비가 줄어든다.</div>
      <div class="cards">${crafters.map((c) => {
        const role = CRAFT_ROLES[c.role];
        const gname = c.guild && GUILDS[c.guild] ? GUILDS[c.guild].name : '프리랜서';
        const rel = G.craftRelOf(c.id);
        return `<div class="item-row"><div class="grow"><b>${c.name}</b> <span class="tag">${role.name}</span>
          <div class="small dim">${gname} · 관계 ${rel} · 보정 +${G.craftBonus(c.id)}%</div></div></div>`;
      }).join('') || '<div class="small dim">이 도시에는 상주 장인이 없다.</div>'}</div>`;

    html += G.guildCraftDeptHtml(reg) || '';

    const themes = G.craftableThemes(reg.id);
    html += `<div class="sec-title sec">테마 세트 제작</div>
      <div class="small dim">히든 고유가 아니다. 게이트에서도 드롭되고, 이 도시 장인·제작 길드에서도 맞출 수 있다.</div>
      <div class="cards">${themes.map((T) => T.pieces.map((pc, i) => {
        const cost = G.themeCraftCost(T.id, i);
        const crafter = G.findCrafterForSlot(reg.id, pc.slot);
        const bonus = crafter ? G.craftBonus(crafter.id) : 0;
        const money = Math.round(cost.money * pm * (1 - bonus * 0.01));
        const ok = G.coreCount(cost.tier) >= cost.cores && p.money >= money;
        const fam = pc.fam && typeof WEAPON_FAMS !== 'undefined' && WEAPON_FAMS[pc.fam] ? WEAPON_FAMS[pc.fam].name
          : pc.afam && ARMOR_FAMS[pc.afam] ? ARMOR_FAMS[pc.afam].name : this.slotName(pc.slot);
        return `<div class="item-row"><div class="grow"><b>${pc.name}</b> <span class="small dim">〈${T.name}〉 · ${fam}</span>
          <div class="small dim">${coreName(cost.tier)} ${cost.cores}개${cost.guildDiscount ? ' · 길드 할인' : ''}${crafter ? ` · ${crafter.name}` : ''}</div></div>
          <button class="sm" data-act="craft-theme" data-v="${T.id}|${i}" ${ok ? '' : 'disabled'}>${coin(money)}</button></div>`;
      }).join('')).join('')}</div>`;

    // 제작 전문 길드 안내
    const locals = Object.entries(CRAFT_MINOR_GUILDS).filter(([, m]) => m.home === reg.id);
    if (locals.length) {
      html += `<div class="sec-title sec">이 도시 제작 길드</div><div class="cards">${locals.map(([gid, m]) =>
        `<div class="item-row"><div class="grow"><b style="color:${m.color}">${m.name}</b> <span class="small dim">${m.style} · ${(m.craftRoles || []).map((r) => CRAFT_ROLES[r].name).join('·')}</span>
          <div class="small dim">${m.desc}</div></div>
          ${p.guild === gid ? '<span class="tag good">소속</span>' : p.guild ? '' : `<button class="sm" data-act="minor-join" data-v="${gid}">가입</button>`}</div>`
      ).join('')}</div>`;
    }
    return html;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'craft-theme') {
      const [sid, idx] = String(v).split('|');
      const r = G.craftThemePiece(sid, +idx);
      G.save();
      return this.afterCity(r);
    }
    return baseHandle.call(this, act, v);
  };

  // 길드 화면: 제작 길드 목록
  if (UI.guildHtml) {
    const baseGuild = UI.guildHtml;
    UI.guildHtml = function () {
      let html = baseGuild.call(this);
      const p = G.player;
      const rows = Object.entries(CRAFT_MINOR_GUILDS).map(([id, g]) => {
        const home = typeof guildHome === 'function' ? guildHome(id) : REGIONS.find((r) => r.id === g.home);
        return `<div class="item-row ${p.guild === id ? 'hl' : ''}"><span class="slot-ico" style="--c:${g.color}"></span><div class="grow"><b style="color:${g.color}">${g.name}</b>
          <span class="small dim">${home ? home.name : g.home} · 제작 길드 · ${(g.craftRoles || []).map((r) => CRAFT_ROLES[r].name).join('·')}</span>
          <div class="small dim">${g.spec}</div></div>
          ${p.guild === id ? '<span class="tag good">소속</span>' : p.guild ? '' : `<button class="sm" data-act="minor-join" data-v="${id}">가입</button>`}</div>`;
      }).join('');
      html += `<div class="sec"><div class="sec-title">제작 전문 길드</div><div class="cards">${rows}</div>
        <div class="small dim">4대 거대 길드에도 사내 제작 부서가 있다. 테마 세트는 드롭·제작 길드·장인 모두에서 모을 수 있다.</div></div>`;
      return html;
    };
  }
}
