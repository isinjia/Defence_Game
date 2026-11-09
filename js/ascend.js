// ===== 돌파 묶음: 에테르 역류 시련(심마) · 운명 카드(각성 변이) · 각성 순도 =====
// 설계: docs/귀곡팔황_대조.md 3장 3·1·2
//  - B→A, A→S, S→SS 돌파 전에 '나의 그림자'와 홀로 싸운다. 지면 돌파 실패와 같은 대가, 이기면 성공률·순도 보너스.
//  - 돌파에 성공할 때마다 각성 변이 카드 3장 중 하나를 골라 몸에 새긴다. 좋고 나쁨이 섞여 있다.
//  - C급·S급에 오를 때 각성 순도(하·중·상·완전)가 매겨지고 평생 능력에 반영된다.

const TRIAL_RANKS = [4, 5, 6]; // 이 등급에서 다음 등급으로 오를 때 시련
const PURITY_RANKS = [3, 6];   // 이 등급에 오를 때 순도를 매긴다
const PURITY = [
  { name: '하', color: '#8a8f98', mod: -0.03, desc: '탁한 각성. 체력·공격·방어·정신력 -3%' },
  { name: '중', color: '#5fa8d3', mod: 0, desc: '평범한 각성. 보정 없음' },
  { name: '상', color: '#d98cf0', mod: 0.05, desc: '맑은 각성. 체력·공격·방어·정신력 +5%' },
  { name: '완전', color: '#ffe066', mod: 0.1, desc: '완전 각성. 체력·공격·방어·정신력 +10%, 돌파 +5%' },
];
const TRIAL_FEARS = [
  { id: 'death', text: '죽음이 두렵다', shadow: '그림자의 칼끝이 더 날카로워졌다.', buff: { atk: 1.15 } },
  { id: 'alone', text: '혼자 남는 것이 두렵다', shadow: '그림자가 바람처럼 빨라졌다.', buff: { spd: 1.15 } },
  { id: 'fail', text: '여기서 멈추는 것이 두렵다', shadow: '그림자의 몸이 강철처럼 단단해졌다.', buff: { def: 1.2, hp: 1.1 } },
];
// 각성 변이 카드. mods 는 extraMod 로 얹고, monthly 는 매달 낮은 확률의 부작용.
const FATES = [
  { id: 'berserk', name: '폭주 회로', mods: { atk: 0.15 }, bad: '매달 2% 확률로 폭주(부상 1개월)', monthly: 'berserk' },
  { id: 'short_flame', name: '짧은 불꽃', mods: { hp: 0.08, atk: 0.08, def: 0.08, spd: 0.08, life: -5 } },
  { id: 'steel_vein', name: '강철 혈관', mods: { def: 0.15, spd: -0.06 } },
  { id: 'wind_nerve', name: '바람의 신경', mods: { spd: 0.12, hp: -0.06 } },
  { id: 'deep_well', name: '깊은 우물', mods: { mp: 0.25, train: 0.1, atk: -0.05 } },
  { id: 'lucky_star', name: '흉운의 별', mods: { luck: 0.6 }, bad: '매달 2% 확률로 불운(크레딧 5% 손실)', monthly: 'jinx' },
  { id: 'giant_heart', name: '거인의 심장', mods: { hp: 0.2, spd: -0.08 } },
  { id: 'hungry', name: '굶주린 회로', mods: { train: 0.22, heal: -0.2 } },
  { id: 'warm', name: '사람 냄새', mods: { social: 0.25, atk: -0.04 } },
  { id: 'long_line', name: '장수 혈통', mods: { life: 6, atk: -0.05 } },
  { id: 'blade_will', name: '칼날 의지', mods: { atk: 0.1, def: -0.08 } },
  { id: 'still_eye', name: '고요한 눈', mods: { breakthrough: 8, spd: -0.05 } },
  { id: 'ether_body', name: '에테르 체질', mods: { train: 0.15, hp: 0.05, life: -2 } },
  { id: 'balance', name: '균형', mods: { hp: 0.05, atk: 0.05, def: 0.05 }, rare: true },
  { id: 'echo', name: '회귀의 잔향', mods: { train: 0.1, breakthrough: 5, social: -0.06 }, when: (g, p) => !!(p.regress && p.regress.count) },
  { id: 'brand', name: '후원자의 낙인', mods: { luck: 0.2, atk: 0.06, social: -0.08 }, when: (g, p) => !!p.sponsor },
  { id: 'healer_soul', name: '치유의 손', mods: { heal: 0.3, atk: -0.05 } },
  { id: 'iron_will', name: '꺾이지 않는 마음', mods: { mp: 0.1, def: 0.06, luck: -0.15 } },
];
const fateById = (id) => FATES.find((f) => f.id === id);
function fateText(f) { return modsText(Object.fromEntries(Object.entries(f.mods).filter(([k]) => k !== 'life'))) + (f.mods.life ? `${Object.keys(f.mods).length > 1 ? ', ' : ''}수명 ${f.mods.life > 0 ? '+' : ''}${f.mods.life}년` : '') + (f.bad ? ` · ${f.bad}` : ''); }

Object.assign(Game.prototype, {
  ascendInit() {
    const p = this.player; if (!p) return;
    p.fates ??= [];
    p.purity ??= {};
    p.btTrial ??= null;
  },
  needsTrial() { const p = this.player; return TRIAL_RANKS.includes(p.rankIdx); },
  trialPassed() { const t = this.player.btTrial; return !!(t && t.rank === this.player.rankIdx && t.won); },

  // 순도 점수: 유물(영웅 이상은 2점), 에테르 농축 지대, 온전한 몸, 부상, 시련 승리
  purityScore(relicUids) {
    const p = this.player;
    const used = p.relics.filter((r) => (relicUids || []).includes(r.uid)).slice(0, this.relicSlots());
    let s = 0; const why = [];
    const rs = used.reduce((a, r) => a + (r.grade >= 2 ? 2 : 1), 0);
    if (rs) { s += rs; why.push(`유물 +${rs}`); }
    if (this.onEther()) { s += 1; why.push('에테르 농축 지대 +1'); }
    if (p.injured > 0) { s -= 2; why.push('부상 −2'); } else if (p.hp >= p.maxHp * 0.95) { s += 1; why.push('온전한 몸 +1'); }
    if (this.trialPassed()) { s += 2; why.push('시련 극복 +2'); }
    return { s, why };
  },
  purityGrade(s) { return s >= 5 ? 3 : s >= 3 ? 2 : s >= 1 ? 1 : 0; },
  purityMod(key) {
    const p = this.player; let v = 0;
    for (const g of Object.values(p.purity || {})) {
      if (['hp', 'atk', 'def', 'mp'].includes(key)) v += PURITY[g].mod;
      if (key === 'breakthrough' && g === 3) v += 5;
    }
    return v;
  },
  fateMod(key) { let v = 0; for (const f of this.player.fates || []) { const F = fateById(f.id); if (F && F.mods[key]) v += F.mods[key]; } return v; },

  // 시련 결과
  trialWin() {
    const p = this.player;
    p.btTrial = { rank: p.rankIdx, won: true };
    this.lifeEvent(`${RANKS[p.rankIdx + 1].key}급 돌파 앞에서 자신의 그림자를 넘어섰다.`);
  },
  trialLose(fled) {
    const p = this.player;
    p.btTrial = null;
    if (fled) {
      p.ether = Math.floor(p.ether * 0.75);
      this.log('그림자 앞에서 물러섰다. 역류한 에테르 일부를 잃었다. (촉매는 남았다)', 'bad');
      return '그림자 앞에서 물러섰다. 에테르 일부를 잃었지만 촉매는 지켰다.';
    }
    p.items[this.catalystKey()] = Math.max(0, (p.items[this.catalystKey()] || 0) - 1);
    p.ether = Math.floor(p.ether * 0.5);
    p.btBonus = 5; p.record.fails++; // 돌파 실패와 같은 대가(수명 손상 없음, js/balance.js)
    this.recalc();
    p.hp = Math.max(1, Math.floor(p.maxHp * 0.3));
    this.log('에테르 역류 시련에서 무너졌다. 돌파 실패와 같은 대가를 치렀다. (촉매 소실, 에테르 절반)', 'bad');
    this.advanceMonth(1, { eventChance: 0 });
    return '그림자에게 삼켜졌다. 에테르가 역류해 촉매가 타 버렸다. (에테르 절반 손실, 다음 돌파 +5%)';
  },

  // 운명 카드 후보 3장
  fateOffer() {
    const p = this.player; const own = new Set(p.fates.map((f) => f.id));
    const pool = FATES.filter((f) => !own.has(f.id) && (!f.when || f.when(this, p)));
    const out = [];
    while (out.length < 3 && pool.length) {
      const w = pool.map((f) => (f.rare ? 1 : 4));
      const f = RNG.weighted(pool, w); out.push(f.id); pool.splice(pool.indexOf(f), 1);
    }
    return out;
  },
  takeFate(id) {
    const p = this.player; const F = fateById(id); if (!F || p.fates.some((f) => f.id === id)) return '';
    p.fates.push({ id, rank: p.rankIdx });
    this.recalc(); p.hp = Math.min(p.hp, p.maxHp);
    this.lifeEvent(`각성 변이 [${F.name}]이(가) 몸에 새겨졌다.`);
    return `[${F.name}] ${fateText(F)}`;
  },
  fateMonthly() {
    const p = this.player;
    for (const f of p.fates || []) {
      const F = fateById(f.id); if (!F || !F.monthly) continue;
      if (F.monthly === 'berserk' && RNG.chance(0.02)) {
        p.injured = Math.max(p.injured, 1); this.recalc();
        this.log('폭주 회로가 날뛰었다. 에테르가 제멋대로 터져 몸을 다쳤다. (부상 1개월)', 'bad');
      }
      if (F.monthly === 'jinx' && RNG.chance(0.02) && p.money > 0) {
        const v = Math.round(p.money * 0.05); p.money -= v;
        this.log(`흉운의 별이 빛났다. 어처구니없는 사고로 ${fmt(v)} 크레딧을 잃었다.`, 'bad');
      }
    }
  },
  // 그림자 대사: 지난 삶의 상처를 건드린다
  shadowLine() {
    const p = this.player;
    const dead = this.npcs.filter((n) => !n.alive && n.met && n.relation >= 40);
    if (dead.length) { const n = RNG.pick(dead); return `"${n.name}을(를) 지키지 못한 건 누구였지? 나야. 그리고 너지."`; }
    if (p.record.npcKills > 0) return `"네가 쓰러뜨린 ${p.record.npcKills}명. 그들의 얼굴을 기억해? 난 다 기억해."`;
    if (p.record.fails >= 2) return `"벌써 ${p.record.fails}번 무너졌잖아. 이번이라고 다를까?"`;
    if (p.regress && p.regress.count) return '"너는 한 번 죽었어. 그때 끝났어야 했어."';
    return '"너는 나야. 나는 멈추지 않는 너고."';
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.ascendInit(); });
  wrap('extraMod', function (base, key) { return base.call(this, key) + this.fateMod(key) + this.purityMod(key); });
  wrap('btChance', function (base) {
    let c = base.call(this);
    if (this.trialPassed()) c = Math.min(95, c + 10);
    return c;
  });
  wrap('breakthroughWith', function (base, relicUids) {
    const p = this.player;
    const from = p.rankIdx;
    const pur = this.purityScore(relicUids);
    const res = base.call(this, relicUids);
    if (!res) return res;
    p.btTrial = null;
    if (res.ok) {
      if (PURITY_RANKS.includes(p.rankIdx)) {
        const g = this.purityGrade(pur.s);
        p.purity[p.rankIdx] = g;
        this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp;
        res.msg += ` 각성 순도 [${PURITY[g].name}] — ${PURITY[g].desc}.`;
        res.purity = g;
        this.lifeEvent(`${RANKS[p.rankIdx].key}급 각성 순도: ${PURITY[g].name}`);
      }
      if (p.rankIdx > from) this.queue.push({ type: 'fate', offer: this.fateOffer() });
    }
    return res;
  });
  wrap('worldMonthly', function (base) { base.call(this); this.fateMonthly(); });
}

// ---------- 화면 ----------
{
  const purityTag = (g) => `<b style="color:${PURITY[g].color}">${PURITY[g].name}</b>`;
  // 돌파 창: 시련 안내와 예상 순도
  const baseOpen = UI.openBreakthrough;
  UI.openBreakthrough = function () {
    baseOpen.call(this);
    const p = G.player; const row = $box.querySelector('.row.end'); if (!row) return;
    let add = '';
    if (G.needsTrial()) {
      add += `<div class="item-row ${G.trialPassed() ? 'hl' : ''}"><div class="grow"><b>에테르 역류 시련</b> <span class="small">${G.trialPassed() ? '<span class="good">극복 · 성공률 +10%</span>' : '<span class="amber">돌파 전에 치른다</span>'}</span>
        <div class="small dim">${RANKS[p.rankIdx + 1].key}급의 문턱에서 자신의 그림자와 홀로 싸운다. 지면 돌파 실패와 같은 대가(촉매 소실), 이기면 성공률과 순도가 오른다.</div></div></div>`;
    }
    if (PURITY_RANKS.includes(p.rankIdx + 1)) {
      const ps = G.purityScore(this.btSel || []); const g = G.purityGrade(ps.s);
      add += `<div class="item-row"><div class="grow"><b>각성 순도</b> 예상 ${purityTag(g)} <span class="small dim">(${ps.s}점)</span>
        <div class="small dim">${ps.why.length ? ps.why.join(' · ') : '보탬 없음'}. 유물·에테르 농축 지대·온전한 몸으로 올린다. 평생 능력에 남는다.</div></div></div>`;
    }
    if (add) row.insertAdjacentHTML('beforebegin', add);
    if (G.needsTrial() && !G.trialPassed()) { const b = row.querySelector('[data-act="bt-go"]'); if (b) b.textContent = '시련에 든다'; }
  };
  UI.openTrial = function () {
    const p = G.player;
    this.modal(`<div class="eyebrow">에테르 역류 시련 · ${RANKS[p.rankIdx].key}급 → ${RANKS[p.rankIdx + 1].key}급</div>
      <p class="event-text">눈을 감자 에테르가 거꾸로 흐른다. 발밑의 그림자가 일어나 당신의 얼굴로 웃는다.\n${G.shadowLine()}\n그림자가 묻는다. "무엇이 두렵지?"</p>
      <div class="cards">${TRIAL_FEARS.map((f) => `<button class="choice-btn" data-act="bt-fear" data-v="${f.id}">${f.text}</button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="modal-close">아직 아니다</button></div>`.replace(/\n/g, '<br>'), 'event-box');
  };
  UI.startTrial = function (fearId) {
    const f = TRIAL_FEARS.find((x) => x.id === fearId) || TRIAL_FEARS[0];
    const p = G.player; p.hp = p.maxHp; p.mp = p.maxMp;
    this.trialSel = this.btSel || [];
    this.closeModal();
    G.storyFight({ title: '에테르 역류 시련', mirror: true, solo: true, trial: true, fear: f.id,
      win: { text: "그림자가 산산이 흩어졌다. 두려움이 길이 되었다.", after: (g) => { g.trialWin(); g.queue.unshift({ type: 'bt-resume' }); } },
      lose: { text: '', gain: {}, after: (g) => { UI.trialLoseMsg = g.trialLose(UI.trialFled); } } });
    this.toast(f.shadow);
    return this.processQueue();
  };
  // 그림자 강화(두려움)와 홀로 싸우기
  const baseEnemies = UI.storyEnemies;
  UI.storyEnemies = function (spec) {
    const list = baseEnemies.call(this, spec);
    if (spec.trial) {
      const f = TRIAL_FEARS.find((x) => x.id === spec.fear) || TRIAL_FEARS[0];
      for (const u of list) {
        u.name = '역류한 그림자';
        for (const [k, m] of Object.entries(f.buff)) { if (k === 'hp') { u.maxHp = Math.round(u.maxHp * m); u.hp = u.maxHp; } else u[k] = Math.round(u[k] * m); }
      }
    }
    return list;
  };
  const baseStart = UI.startStoryFight;
  UI.startStoryFight = function (spec) {
    if (!spec.solo) return baseStart.call(this, spec);
    const keep = this.allyUnits;
    this.allyUnits = () => [G.playerUnit()];
    try { return baseStart.call(this, spec); } finally { this.allyUnits = keep; }
  };
  const baseFinish = UI.finishStoryFight;
  UI.finishStoryFight = function () {
    const c = this.ctx;
    if (!c || !c.spec || !c.spec.trial) return baseFinish.call(this);
    const result = c.combat.result;
    this.trialFled = result === 'flee'; this.trialLoseMsg = '';
    if (result !== 'win') c.spec = { ...c.spec, lose: { ...c.spec.lose, text: '' } };
    // 시련은 이야기 전투라 괴수 코어가 없다
    c.combat.kills = [];
    baseFinish.call(this);
    if (result !== 'win' && this.trialLoseMsg) { const pe = $box.querySelector('.event-text'); if (pe) pe.textContent = this.trialLoseMsg; this.renderGame(); }
  };
  // 운명 카드 고르기
  UI.showFate = function (q) {
    this.fateOffer = q.offer;
    const p = G.player;
    this.modal(`<div class="eyebrow">각성 변이 · ${RANKS[p.rankIdx].name}</div><h3>운명을 새긴다</h3>
      <p class="dim small">돌파의 순간 에테르가 몸을 다시 짠다. 하나를 고르면 평생 남는다.</p>
      <div class="cards">${q.offer.map((id) => { const F = fateById(id); return `<button class="choice-btn" data-act="fate-pick" data-v="${id}"><b>${F.name}</b>${F.rare ? ' <span class="tag amber">희귀</span>' : ''}<div class="small dim">${fateText(F)}</div></button>`; }).join('')}</div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'fate') { G.queue.shift(); if (!q.offer || !q.offer.length) return this.processQueue(); return this.showFate(q); }
    if (q && q.type === 'bt-resume') {
      G.queue.shift();
      const r = G.breakthroughWith(this.trialSel || []); if (!r) return this.processQueue();
      this.renderGame();
      return FX.breakthrough(r.ok, G.player.rankIdx, () => {
        this.renderGame();
        this.modal(`<h3 class="${r.ok ? 'good' : 'bad'}">${r.ok ? '돌파 성공' : '돌파 실패'}</h3><p class="dim">성공률 ${r.chance}%</p><p>${r.msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
      });
    }
    return baseQueue.call(this);
  };
  // 계승: 변이와 순도는 본인의 몸에 새겨진 것이라 이어지지 않는다
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) { baseSucceed.call(this, id); const p = G.player; p.fates = []; p.purity = {}; p.btTrial = null; G.recalc(); G.save(); };
  // 정보 화면: 변이와 순도
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player;
    const pur = Object.entries(p.purity || {});
    if (!p.fates.length && !pur.length) return html;
    const box = `<div class="sec"><div class="sec-title">각성 변이 · 순도</div>
      ${pur.length ? `<div class="small">${pur.map(([r, g]) => `${RANKS[r].key}급 순도 ${purityTag(g)}`).join(' · ')}</div>` : ''}
      <div class="cards traits">${p.fates.map((f) => { const F = fateById(f.id); return F ? `<div class="trait"><b>${F.name}</b> <span class="small dim">${RANKS[f.rank].key}급</span><span class="dim">${fateText(F)}</span></div>` : ''; }).join('')}</div></div>`;
    const at = html.indexOf('<div class="sec"><div class="sec-title">선천 특성</div>');
    return at < 0 ? html + box : html.slice(0, at) + box + html.slice(at);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'bt-go':
        if (G.needsTrial() && !G.trialPassed() && G.canBreakthrough() && G.hasCatalyst()) return this.openTrial();
        return baseHandle.call(this, act, v);
      case 'bt-fear': return this.startTrial(v);
      case 'fate-pick': {
        if (!(this.fateOffer || []).includes(v)) return;
        const msg = G.takeFate(v); this.fateOffer = null; G.save();
        this.closeModal(); return this.after(msg);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
