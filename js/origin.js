// ===== 출신과 혈통: 귀환자 · 공략 정보 판매 · 희귀 직업 몸값 · 혈통 각성 =====
// 설계: docs/헌터물_제안3.md 후순위
//  - 귀환자: 게이트 안에서 7년을 버티고 돌아온 시작 배경. 이계 기술(시작 스킬)과 사회 부적응(친화·물가·법)을 함께 준다.
//  - 공략 정보: 처음 깬 등급·변이 게이트의 공략 정보를 의뢰소에 팔거나(돈·공적), 숨겨서 독점(같은 등급 크레딧 +12%, 1년).
//  - 희귀 직업 몸값: 지원계(힐러·사제·음유시인 등)는 용병비가 1.5배. 지원계 플레이어는 길드 스카우트 제안을 받는다.
//  - 혈통 각성: 강한 부모의 자녀는 높은 등급·재능으로 각성한다. 계승할 자녀를 고르는 일이 의미를 갖는다.

BACKGROUNDS.push({ id: 'returnee', name: '게이트 귀환자', desc: '게이트 안에서 7년을 버티고 돌아왔다. 공격·체력 +10%, 이계 기술 하나. 대신 친화 −25%, 물가 +10%, 나이 +7.', region: 'gangbuk', money: 300, mods: { atk: 0.1, hp: 0.1, social: -0.25, price: 0.1 } });
const GUIDE_KEEP_MONTHS = 12;
const GUIDE_BONUS = 0.12;
const SUPPORT_FEE = 1.5;
const isSupport = (cls) => !!cls && classById(cls) && classById(cls).role === 'support';

Object.assign(Game.prototype, {
  originInit() {
    const p = this.player; if (!p) return;
    p.guides ??= []; p.firstClear ??= {};
  },
  // ---------- 공략 정보 ----------
  guideValue(g) {
    const age = this.monthKey() - g.mk;
    const v = 320 * RANKS[g.tier].mult ** 1.5 * (g.variant !== 'normal' ? 1.6 : 1);
    return Math.round(v * (age >= GUIDE_KEEP_MONTHS ? 0.3 : 1));
  },
  guideName(g) { return `${RANKS[g.tier].key}급${{ red: ' 레드', double: ' 이중', misrank: ' 오판' }[g.variant] || ''} 게이트 공략 정보`; },
  sellGuide(uid) {
    const p = this.player; const g = p.guides.find((x) => x.uid === uid);
    if (!g || !this.onCity()) return '';
    const v = this.guideValue(g);
    p.guides = p.guides.filter((x) => x !== g);
    p.money += v; p.merit += 5; this.addRep(this.region().id, 3);
    if (this.addLaw) this.addLaw(2);
    this.rumor(`협회가 ${this.guideName(g)}를 공개했다. 제공자는 ${p.name}.`);
    return `${this.guideName(g)}를 의뢰소에 넘겼다. +${fmt(v)} 크레딧, 협회 공적 +5, 평판 +3`;
  },
  guideBonus(tier) {
    const mk = this.monthKey();
    return (this.player.guides || []).some((g) => g.tier === tier && mk - g.mk < GUIDE_KEEP_MONTHS) ? GUIDE_BONUS : 0;
  },
  // ---------- 지원계 스카우트 ----------
  scoutMonthly() {
    const p = this.player;
    if (!isSupport(p.cls) || p.rankIdx < 1 || !RNG.chance(0.03)) return;
    const gid = RNG.pick(Object.keys(GUILDS).filter((k) => k !== p.guild));
    if (!gid) return;
    this.queue.push({ type: 'scout', guild: gid, money: Math.round(600 * RANKS[p.rankIdx].mult ** 1.4) });
  },
  // ---------- 혈통 ----------
  bloodAwaken(n) {
    const par = (n.parents || []).map((id) => (id === -1 ? { name: this.player.name, rankIdx: this.player.rankIdx, cls: this.player.cls, element: this.player.element, isP: true } : this.npcById(id))).filter(Boolean);
    if (!par.length) return;
    const top = par.reduce((a, b) => (b.rankIdx > a.rankIdx ? b : a));
    if (top.rankIdx < 3) return;
    const base = Math.floor(top.rankIdx / 2) + (RNG.chance(0.25) ? 1 : 0);
    const before = n.rankIdx;
    n.rankIdx = Math.max(n.rankIdx, Math.min(6, base)); n.stage = 0;
    n.talent = Math.min(12, (n.talent || 3) + Math.floor(top.rankIdx / 2));
    if (RNG.chance(0.5)) n.element = top.element;
    let blood = false;
    if (top.rankIdx >= 5 && RNG.chance(0.3)) { n.cls = top.cls; n.bloodline = true; blood = true; }
    if (n.rankIdx > before || blood || top.isP) {
      this.rumor(`${top.name}의 혈통 — 자녀 ${n.name}, ${RANKS[n.rankIdx].key}급으로 각성${blood ? `. 부모의 직업 [${classById(n.cls).name}]을(를) 그대로 이었다` : ''}.`);
      if (top.isP) this.lifeEvent(`자녀 ${n.name}이(가) ${RANKS[n.rankIdx].key}급으로 각성했다${blood ? ' (혈통 각성)' : ''}.`);
    }
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.originInit(); });
  wrap('newGame', function (base, opts) {
    base.call(this, opts);
    const p = this.player; if (!p || p.bg !== 'returnee') return;
    p.ageMonths += 84;
    if (p.law != null) p.law = -10;
    const pool = SKILLS.filter((s) => !s.cls && s.price && s.rankReq <= 1 && (s.elem === p.element || !s.elem) && !p.skills.includes(s.id)).sort((a, b) => b.rankReq - a.rankReq || b.power - a.power);
    const s = pool[0];
    if (s) { p.skills.push(s.id); if (p.equipSkills.length < 5) p.equipSkills.push(s.id); }
    this.lifeEvent(`7년 만에 게이트 밖으로 나왔다. 세상은 변했고, 아무도 나를 기억하지 못한다.${s ? ` 이계에서 익힌 [${s.name}]만이 그 시간을 증명한다.` : ''}`);
    this.recalc();
  });
  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    const p = this.player;
    const t = gate.realTier ?? gate.tier;
    if (result !== 'lose' && loot) { const b = this.guideBonus(t); if (b) loot.money = Math.round((loot.money || 0) * (1 + b)); }
    const lines = base.call(this, gate, result, loot, ...rest);
    if (result === 'clear' && !gate.final && !(loot && loot.sweep)) {
      const v = gate.variant && gate.variant !== 'normal' ? gate.variant : 'normal';
      const key = `${t}:${v}`;
      if (!p.firstClear[key]) {
        p.firstClear[key] = true;
        const g = { uid: Math.random().toString(36).slice(2, 9), tier: t, variant: v, mk: this.monthKey() };
        p.guides.push(g); if (p.guides.length > 6) p.guides.shift();
        lines.push(`처음 깬 ${this.guideName(g)}를 정리했다. 의뢰소에 팔거나, 숨겨서 1년간 독점할 수 있다(같은 등급 크레딧 +${Math.round(GUIDE_BONUS * 100)}%).`);
      }
    }
    return lines;
  });
  wrap('mercFee', function (base, n) { const v = base.call(this, n); return isSupport(n.cls) ? Math.round(v * SUPPORT_FEE) : v; });
  wrap('worldMonthly', function (base) { base.call(this); this.scoutMonthly(); });
  wrap('simulateSociety', function (base) {
    const coming = this.npcs.filter((n) => n.alive && n.child && n.ageMonths >= 18 * 12);
    base.call(this);
    for (const n of coming) if (!n.child) this.bloodAwaken(n);
  });
}

// ---------- 화면 ----------
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    const p = G.player;
    if (id === 'board' && p.guides.length) {
      html += `<div class="sec-title sec">공략 정보 판매</div><div class="small dim">팔면 크레딧·공적·평판, 들고 있으면 1년간 같은 등급 게이트 크레딧 +${Math.round(GUIDE_BONUS * 100)}%. 정보는 1년이 지나면 값이 떨어진다.</div>
        <div class="cards">${p.guides.map((g) => { const age = G.monthKey() - g.mk; return `<div class="item-row"><div class="grow"><b>${G.guideName(g)}</b> <span class="small dim">${age < GUIDE_KEEP_MONTHS ? `독점 ${GUIDE_KEEP_MONTHS - age}개월 남음` : '낡은 정보'}</span></div>
          <button class="sm" data-act="sell-guide" data-v="${g.uid}">${FX.icon('coin', 13)} <span class="num">${fmt(G.guideValue(g))}</span></button></div>`; }).join('')}</div>`;
    }
    return html;
  };
  UI.showScout = function (q) {
    this.scoutQ = q;
    const gd = GUILDS[q.guild];
    this.modal(`<div class="eyebrow">스카우트 제안</div><h3>${gd.name}</h3>
      <p class="event-text">"지원계 각성자는 늘 모자랍니다. 다음 시즌 원정에 지원 인력으로 한 번만 함께해 주시죠. 계약금 ${fmt(q.money)} 크레딧."</p>
      <div class="cards"><button class="choice-btn" data-act="scout" data-v="1">받아들인다 (한 달)</button><button class="choice-btn" data-act="scout" data-v="0">정중히 거절한다</button></div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'scout') { G.queue.shift(); return this.showScout(q); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'sell-guide': return this.afterCity(G.sellGuide(v));
      case 'scout': {
        const q = this.scoutQ; this.scoutQ = null; this.closeModal(); if (!q) return;
        if (v !== '1') return this.after('"마음이 바뀌면 연락 주세요."');
        const p = G.player; p.money += q.money; p.fame += 3; G.etherGift(40);
        G.log(`${GUILDS[q.guild].name}의 원정에 지원 인력으로 참가했다. 계약금 ${fmt(q.money)} 크레딧.`, 'good');
        G.advanceMonth(1, { eventChance: 0.1 });
        return this.after(`원정을 마쳤다. +${fmt(q.money)} 크레딧, 명성 +3`);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
