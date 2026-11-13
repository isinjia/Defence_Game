// ===== 후반 크레딧 소모처: 투자·후원 센터 (영역 E, docs/평가_보고.md "크레딧 소모처") =====
// 게이트·파티형은 70년에 크레딧이 수백만~천만 단위로 쌓이는데 쓸 곳이 없다. 기존 시스템(강화·아지트·가게·길드 창설)과 겹치지 않는 큰 지출 넷:
//  1. 에테르 연구 후원: 단계마다 모든 기본 능력 +2% 영구. 비용이 1.6배씩 오른다(20단계). SS 이후의 성장 목표.
//  2. 수명 연장 시술: 회당 수명 +1년, 비용 2배씩(최대 10회). 20% 확률로 에테르 오염 부작용.
//  3. 길드 지분 투자: 대형 길드 지분(1%씩, 길드당 최대 30%)을 사고판다. 값은 길드 위상을 따라 매달 움직이고, 배당이 나온다.
//     10% 이상이면 이사회 의석: 그 길드 계약 월급 +15%, 그 길드 본부 도시 물가 −10%.
//  4. 후계 신탁: 맡긴 돈은 계승 때 자녀에게 전부 간다(일반 재산은 60%). 500만마다 자녀 재능 +1(최대 +3). 중도 해지는 절반만 돌려받는다.
// 강남·부산·대구의 '투자·후원 센터'. 크레딧이 30만을 넘으면 한 번 안내한다.

const LATE = {
  research: { max: 20, base: 20000, grow: 1.6, per: 0.02 },
  life: { max: 10, base: 100000, grow: 2, side: 0.2 },
  share: { max: 30, divRate: 0.004, seat: 10, fee: 0.05 },
  trust: { talentPer: 5000000, talentMax: 3, cancel: 0.5 },
  hint: 300000,
};
FACILITIES.push({ id: 'invest', name: '투자·후원 센터', desc: '연구 후원·수명 시술·길드 지분·후계 신탁. 큰돈이 쌓였을 때.', big: true });
FAC_ICON.invest = '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';

Object.assign(Game.prototype, {
  lateInit() {
    const p = this.player; if (!p) return;
    p.late ??= { research: 0, life: 0, shares: {}, trust: 0, hinted: false };
    p.late.shares ??= {};
  },
  // ---------- 1. 연구 후원 ----------
  researchCost() { const n = this.player.late.research; return n >= LATE.research.max ? 0 : Math.round(LATE.research.base * LATE.research.grow ** n); },
  fundResearch() {
    const p = this.player; const L = p.late; if (!this.onCity()) return '';
    const c = this.researchCost(); if (!c) return '연구는 끝까지 후원했다.';
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; L.research++; this.recalc(); p.hp = Math.min(p.maxHp, p.hp);
    if (L.research % 5 === 0) this.lifeEvent(`에테르 연구 후원 ${L.research}단계. 연구소 벽에 이름이 새겨졌다.`);
    this.advanceMonth(1, { eventChance: 0.1 });
    return `연구 ${L.research}단계 성과가 몸에 이식됐다. 모든 기본 능력 +${Math.round(L.research * LATE.research.per * 100)}% (−${fmt(c)} 크레딧, 한 달)`;
  },
  // ---------- 2. 수명 연장 ----------
  lifeCost() { const n = this.player.late.life; return n >= LATE.life.max ? 0 : Math.round(LATE.life.base * LATE.life.grow ** n); },
  extendLife() {
    const p = this.player; const L = p.late; if (!this.onCity()) return '';
    if (p.rankIdx < 5) return 'A급 이상만 시술을 견딘다.';
    const c = this.lifeCost(); if (!c) return '더 이상의 시술은 몸이 버티지 못한다.';
    if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; L.life++; p.lifeBonus += 1;
    let side = '';
    if (RNG.chance(LATE.life.side)) { p.injured = Math.max(p.injured, 2); this.recalc(); side = ' 부작용으로 몸이 상했다. (부상 2개월)'; }
    this.lifeEvent(`수명 연장 시술 ${L.life}회째.`);
    this.advanceMonth(1, { eventChance: 0 });
    return `시술이 끝났다. 수명 +1년 (−${fmt(c)} 크레딧, 한 달)${side}`;
  },
  // ---------- 3. 길드 지분 ----------
  shareGuilds() { return Object.keys(GUILDS).filter((id) => id !== 'kama' && !GUILDS[id].minor); },
  sharePrice(id) { const pr = (this.world.guildPrestige && this.world.guildPrestige[id]) || 50; return Math.round(pr * 1500); },
  boardSeat(id) { return ((this.player.late && this.player.late.shares[id]) || 0) >= LATE.share.seat; },
  buyShare(id, n = 1) {
    const p = this.player; const L = p.late; if (!this.onCity() || !this.shareGuilds().includes(id)) return '';
    const have = L.shares[id] || 0; n = Math.min(n, LATE.share.max - have); if (n <= 0) return `${GUILDS[id].name} 지분은 ${LATE.share.max}%까지만 살 수 있다.`;
    const c = this.sharePrice(id) * n; if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; L.shares[id] = have + n;
    let t = `${GUILDS[id].name} 지분 ${n}%를 샀다. (보유 ${L.shares[id]}%, −${fmt(c)} 크레딧)`;
    if (have < LATE.share.seat && L.shares[id] >= LATE.share.seat) { this.lifeEvent(`${GUILDS[id].name} 이사회에 자리를 얻었다.`); this.rumor(`${p.name}, ${GUILDS[id].name} 지분 ${L.shares[id]}% 확보 — 이사회 입성.`); t += ' 이사회 의석을 얻었다!'; }
    return t;
  },
  sellShare(id, n = 1) {
    const p = this.player; const L = p.late; if (!this.onCity()) return '';
    const have = L.shares[id] || 0; n = Math.min(n, have); if (n <= 0) return '';
    const v = Math.round(this.sharePrice(id) * n * (1 - LATE.share.fee));
    p.money += v; L.shares[id] = have - n;
    return `${GUILDS[id].name} 지분 ${n}%를 팔았다. +${fmt(v)} 크레딧 (수수료 ${Math.round(LATE.share.fee * 100)}%)`;
  },
  // ---------- 4. 후계 신탁 ----------
  trustDeposit(v) {
    const p = this.player; if (!this.onCity()) return '';
    v = Math.min(v, p.money); if (v <= 0) return '';
    p.money -= v; p.late.trust += v;
    return `후계 신탁에 ${fmt(v)} 크레딧을 맡겼다. (신탁 ${fmt(p.late.trust)})`;
  },
  trustCancel() {
    const p = this.player; const t = p.late.trust; if (!t || !this.onCity()) return '';
    const v = Math.round(t * LATE.trust.cancel); p.money += v; p.late.trust = 0;
    return `신탁을 해지했다. 절반인 ${fmt(v)} 크레딧만 돌아왔다.`;
  },
  lateMonthly() {
    const p = this.player; const L = p.late; if (!L) return;
    let div = 0;
    for (const [id, n] of Object.entries(L.shares)) if (n > 0 && GUILDS[id]) div += Math.round(this.sharePrice(id) * n * LATE.share.divRate);
    if (div) { p.money += div; this.log(`길드 지분 배당 ${fmt(div)} 크레딧`); }
    if (!L.hinted && p.money >= LATE.hint) {
      L.hinted = true;
      this.log('큰돈이 쌓였다. 강남·부산·대구의 투자·후원 센터에서 연구 후원·수명 시술·길드 지분·후계 신탁에 쓸 수 있다.', 'major');
    }
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.lateInit(); });
  wrap('worldMonthly', function (base) { base.call(this); this.lateMonthly(); });
  wrap('extraMod', function (base, key) {
    let v = base.call(this, key);
    const L = this.player && this.player.late;
    if (L && L.research && ['hp', 'mp', 'atk', 'def', 'spd'].includes(key)) v += L.research * LATE.research.per;
    return v;
  });
  // 이사회 의석: 그 길드 계약 월급 +15%, 본부 도시 물가 −10%
  wrap('makeContract', function (base, gid, ...rest) {
    const c = base.call(this, gid, ...rest);
    if (c && this.boardSeat && this.boardSeat(gid) && c.salary) { c.salary = Math.round(c.salary * 1.15); c.board = true; }
    return c;
  });
  wrap('priceMul', function (base) {
    const m = base.call(this); const reg = this.region();
    return reg && reg.guild && this.boardSeat && this.boardSeat(reg.guild) ? m * 0.9 : m;
  });
}

// ---------- 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id !== 'invest') return baseFac.call(this, id, reg);
    const p = G.player; const L = p.late;
    const coin = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(Math.round(v))}</span>`;
    const rc = G.researchCost(); const lc = G.lifeCost();
    const rows = G.shareGuilds().map((gid) => { const n = L.shares[gid] || 0; const pr = G.sharePrice(gid);
      return `<div class="item-row"><div class="grow"><b style="color:${GUILDS[gid].color}">${GUILDS[gid].name}</b> <span class="small">보유 ${n}%${G.boardSeat(gid) ? ' · <span class="amber">이사회</span>' : ''}</span>
        <div class="small dim">1% ${fmt(pr)} · 월 배당 ${fmt(Math.round(pr * LATE.share.divRate))}/1%</div></div>
        <span class="row"><button class="sm" data-act="late-buy" data-v="${gid}" ${n >= LATE.share.max ? 'disabled' : ''}>사기</button>${n ? `<button class="sm ghost" data-act="late-sell" data-v="${gid}">팔기</button>` : ''}</span></div>`; }).join('');
    return `<p class="small dim">헌터로 번 큰돈을 쓰는 곳. 보유 ${coin(p.money)}</p>
      <div class="cards">
        <div class="item-row"><div class="grow"><b>에테르 연구 후원</b> <span class="tag">${L.research}/${LATE.research.max}</span><div class="small dim">단계마다 모든 기본 능력 +2% 영구 (지금 +${Math.round(L.research * LATE.research.per * 100)}%). 한 달 걸린다.</div></div>
          ${rc ? `<button class="sm" data-act="late-research">${coin(rc)}</button>` : '<span class="small amber">완료</span>'}</div>
        <div class="item-row"><div class="grow"><b>수명 연장 시술</b> <span class="tag">${L.life}/${LATE.life.max}</span><div class="small dim">A급 이상. 회당 수명 +1년, 20% 부작용(부상). 한 달 걸린다.</div></div>
          ${lc ? `<button class="sm" data-act="late-life" ${p.rankIdx < 5 ? 'disabled' : ''}>${coin(lc)}</button>` : '<span class="small amber">한계</span>'}</div>
      </div>
      <div class="sec-title sec">길드 지분</div><div class="small dim">값은 길드 위상을 따라 매달 움직인다. ${LATE.share.seat}% 이상이면 이사회 의석: 그 길드 계약 월급 +15%, 본부 도시 물가 −10%. 팔 때 수수료 5%.</div>
      <div class="cards">${rows}</div>
      <div class="sec-title sec">후계 신탁 · ${coin(L.trust)}</div><div class="small dim">맡긴 돈은 계승 때 자녀에게 전부 간다(일반 재산은 60%). ${fmt(LATE.trust.talentPer)}마다 자녀 재능 +1(최대 +${LATE.trust.talentMax}). 중도 해지는 절반.</div>
      <div class="row">${[100000, 1000000, 5000000].map((v) => `<button class="sm" data-act="late-trust" data-v="${v}" ${p.money < v ? 'disabled' : ''}>${fmt(v)} 맡기기</button>`).join('')}${L.trust ? '<button class="sm ghost" data-act="late-trust-cancel">해지</button>' : ''}</div>`;
  };
  // 계승: 신탁은 전부 자녀에게, 재능 보너스
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) {
    const old = G.player; const trust = (old.late && old.late.trust) || 0;
    baseSucceed.call(this, id);
    const p = G.player;
    p.late = { research: 0, life: 0, shares: (old.late && old.late.shares) || {}, trust: 0, hinted: true };
    if (trust) {
      p.money += trust;
      const t = Math.min(LATE.trust.talentMax, Math.floor(trust / LATE.trust.talentPer));
      if (t) p.talent += t;
      G.lifeEvent(`부모가 남긴 신탁 ${fmt(trust)} 크레딧을 받았다.${t ? ` 명문가 교육 덕에 재능 +${t}.` : ''}`);
    }
    G.recalc(); G.save();
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const city = (r) => { G.save(); return this.afterCity(r); };
    switch (act) {
      case 'late-research': return city(G.fundResearch());
      case 'late-life': return city(G.extendLife());
      case 'late-buy': return city(G.buyShare(v, 1));
      case 'late-sell': return city(G.sellShare(v, 1));
      case 'late-trust': return city(G.trustDeposit(+v));
      case 'late-trust-cancel': return city(G.trustCancel());
      default: return baseHandle.call(this, act, v);
    }
  };
}
