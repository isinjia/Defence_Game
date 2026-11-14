// ===== 삶의 흔적: 소탕·위임 · 살면서 바뀌는 특성 · 관리국↔무법 성향 =====
// 설계: docs/귀곡팔황_대조.md 3장 5·4·8
//  - 소탕: 내 등급보다 두 등급 이상 낮은 게이트는 전투 없이 정리(보상 70%, 날짜만 흐름).
//  - 위임: 제자나 길드 후배에게 낮은 게이트를 맡기고 보수 일부를 받는다(한 달 2회).
//  - 후천 특성: 삶의 기록이 몸에 새겨진다(3칸). 좋고 나쁨이 섞여 있고, 나쁜 것은 치료로 지운다.
//  - 성향(p.law, −100 무법 ~ +100 관리국): 의뢰·구조·브레이크 저지는 관리국 쪽, 무고한 살인·균열교는 무법 쪽.
//    (C 영역의 악행·수배가 같은 수치를 쓰면 된다)

const SWEEP_SHARE = 0.7;
const DELEGATE_SHARE = 0.3;
const DELEGATE_PER_MONTH = 2;
const LTRAIT_SLOTS = 3;
const LIFE_TRAITS = [
  { id: 'survivor', name: '생존 본능', how: '레드 게이트에서 살아 돌아옴', mods: { def: 0.06, hp: 0.06 }, cond: (g, p) => (p.record.red || 0) >= 1 },
  { id: 'guardian', name: '수호자', how: '브레이크 저지 3회', mods: { def: 0.08, social: 0.08 }, cond: (g, p) => (p.record.breaks || 0) >= 3 },
  { id: 'veteran', name: '백전노장', how: '게이트 공략 60회', mods: { atk: 0.05, def: 0.05 }, cond: (g, p) => p.record.gates >= 60 },
  { id: 'wanderer', name: '방랑자', how: '도시 8곳 방문', mods: { spd: 0.06, luck: 0.1 }, cond: (g, p) => (p.visited || []).length >= 8 },
  { id: 'mentor', name: '스승의 그릇', how: '제자 둘 이상', mods: { train: 0.08, social: 0.05 }, cond: (g, p) => (p.disciples || []).length >= 2 },
  { id: 'star', name: '스타 기질', how: '구독자 1만 명', mods: { social: 0.15, luck: 0.1 }, cond: (g, p) => (p.followers || 0) >= 10000 },
  { id: 'lone_wolf', name: '외톨이 늑대', how: '파티 없이 게이트 30회', mods: { atk: 0.06, spd: 0.05, social: -0.08 }, cond: (g, p) => p.record.gates >= 30 && !(p.party || []).length && !p.crew },
  { id: 'lonely', name: '고독', how: '가까운 사람 셋을 잃음', neg: true, mods: { atk: 0.08, social: -0.15 }, cond: (g, p) => g.npcs.filter((n) => !n.alive && n.met && n.relation >= 50).length >= 3 },
  { id: 'blood_hands', name: '피 묻은 손', how: '사람을 셋 이상 죽임', neg: true, mods: { atk: 0.1, social: -0.2 }, cond: (g, p) => p.record.npcKills >= 3 },
  { id: 'defeat_shadow', name: '패배의 그림자', how: '게이트에서 세 번 쓰러짐', neg: true, mods: { spd: -0.05, def: -0.05 }, cond: (g, p) => (p.record.losses || 0) >= 3 },
  { id: 'scarred', name: '상흔', how: '치명상이 쌓임', neg: true, mods: { hp: -0.06, atk: 0.06 }, cond: (g, p) => p.lifePenalty >= 6 },
  { id: 'hunted', name: '쫓기는 자', how: '무법 성향이 깊어짐', neg: true, mods: { spd: 0.06, luck: -0.15 }, cond: (g, p) => (p.law || 0) <= -60 },
];
const ltraitById = (id) => LIFE_TRAITS.find((t) => t.id === id);
const LAW_LABELS = [[60, '관리국의 사람'], [20, '모범 헌터'], [-20, '중립'], [-60, '회색 지대'], [-101, '무법자']];
const lawLabel = (v) => LAW_LABELS.find(([t]) => v >= t)[1];

Object.assign(Game.prototype, {
  lifeInit() {
    const p = this.player; if (!p) return;
    p.ltraits ??= []; p.ltraitsGone ??= [];
    p.law ??= 0;
    p.deleg ??= { mk: -1, n: 0 };
    p.lawSeen ??= { breaks: p.record.breaks || 0, cult: false };
    p.record.losses ??= 0;
  },
  addLaw(d, why) {
    const p = this.player; const before = lawLabel(p.law);
    p.law = Math.max(-100, Math.min(100, p.law + d));
    const after = lawLabel(p.law);
    if (after !== before) this.log(`세간의 평가가 바뀌었다: ${after}${why ? ` (${why})` : ''}`, d > 0 ? 'good' : 'bad');
  },
  lawMod(key) {
    const L = this.player.law || 0;
    if (L >= 40 && key === 'social') return 0.05;
    if (L <= -40 && key === 'price') return -0.05; // 암시장 연줄
    if (L <= -40 && key === 'social') return -0.05;
    return 0;
  },
  ltraitMod(key) { let v = 0; for (const id of this.player.ltraits || []) { const t = ltraitById(id); if (t && t.mods[key]) v += t.mods[key]; } return v; },

  // ---------- 소탕 ----------
  canSweep(g) {
    const p = this.player;
    return !!g && g.kind === 'gate' && !g.final && !g.bid && !g.mission && g.variant !== 'red' && g.tier <= p.rankIdx - 2;
  },
  sweepGate(id) {
    const p = this.player; const g = this.mapGates.find((x) => x.id === id);
    if (!this.canSweep(g) || !this.canAct()) return null;
    if (g.variant === 'misrank' && g.realTier > p.rankIdx - 2) {
      g.revealedMis = true;
      p.hp = Math.max(1, Math.round(p.hp - p.maxHp * 0.25));
      this.log(`${this.gateName(g)} 소탕에 나섰다가 에테르가 공지보다 짙다는 걸 알아챘다. 물러났다.`, 'bad');
      this.advanceDays(3, { eventChance: 0 });
      return [`<span class="bad">등급 오판 게이트였다! 실제 ${RANKS[g.realTier].key}급. 소탕을 멈추고 물러났다. (체력 손실)</span>`];
    }
    const kills = this.gateRooms(g).flat();
    const loot = { money: 0, ether: 0, kills: kills.length, list: kills.filter(() => RNG.chance(SWEEP_SHARE)), sweep: true };
    for (const k of kills) { const r = this.monsterReward(k); loot.money += r.money; loot.ether += r.ether; }
    loot.money = Math.round(loot.money * SWEEP_SHARE); loot.ether = Math.round(loot.ether * SWEEP_SHARE);
    const lines = this.finishGate(g, 'clear', loot, p.hp, p.mp);
    lines.unshift(`${RANKS[g.tier].key}급 게이트를 전투 없이 소탕했다. (보상 ${Math.round(SWEEP_SHARE * 100)}%)`);
    return lines;
  },

  // ---------- 위임 ----------
  delegates(g) {
    const p = this.player; const out = [];
    for (const id of p.disciples || []) { const n = this.npcById(id); if (n && n.alive && !n.child && n.rankIdx >= g.tier) out.push({ kind: 'disciple', n, name: `제자 ${n.name}`, rank: n.rankIdx }); }
    if (p.guild && (p.guildRank || 0) >= 2 && g.tier <= p.rankIdx - 1) out.push({ kind: 'guild', name: '길드 후배들', rank: Math.max(0, p.rankIdx - 1) });
    return out.sort((a, b) => b.rank - a.rank);
  },
  delegLeft() { const p = this.player; return p.deleg.mk === this.monthKey() ? DELEGATE_PER_MONTH - p.deleg.n : DELEGATE_PER_MONTH; },
  canDelegate(g) {
    return !!g && g.kind === 'gate' && !g.final && !g.bid && !g.mission && g.variant !== 'red' && g.tier < this.player.rankIdx && this.delegLeft() > 0 && this.delegates(g).length > 0;
  },
  delegateGate(id) {
    const p = this.player; const g = this.mapGates.find((x) => x.id === id);
    if (!this.canDelegate(g) || !this.canAct()) return null;
    const d = this.delegates(g)[0];
    if (p.deleg.mk !== this.monthKey()) p.deleg = { mk: this.monthKey(), n: 0 };
    p.deleg.n++;
    const real = g.variant === 'misrank' ? g.realTier : g.tier;
    const chance = d.rank > real ? 0.95 : d.rank === real ? 0.75 : 0.35;
    if (!RNG.chance(chance)) {
      if (g.variant === 'misrank') g.revealedMis = true;
      if (d.n) this.changeRel(d.n, -3);
      this.log(`${d.name}에게 맡긴 ${this.gateName(g)} 공략이 실패했다. 다들 다쳐서 돌아왔다.`, 'bad');
      return `${d.name}이(가) 공략에 실패하고 돌아왔다. 게이트는 그대로 남았다.`;
    }
    let money = 0; for (const k of this.gateRooms(g).flat()) money += this.monsterReward(k).money;
    money = Math.round(money * DELEGATE_SHARE);
    p.money += money;
    this.mapGates = this.mapGates.filter((x) => x.id !== g.id);
    if (g.breakCity) this.resolveBreak(g.breakCity);
    let extra = '';
    if (d.kind === 'disciple') { this.changeRel(d.n, 3); d.n.ether = (d.n.ether || 0) + Math.round(stageReq(d.n.rankIdx, d.n.stage) * 0.15); extra = ` ${d.n.name}의 실력이 조금 늘었다.`; }
    if (d.kind === 'guild') { const c = 10 * (g.tier + 1); p.contrib += c; extra = ` 길드 공헌도 +${c}.`; }
    this.addLaw(1);
    this.log(`${d.name}에게 ${this.gateName(g)}을(를) 맡겼다. 몫으로 ${fmt(money)} 크레딧을 받았다.`, 'good');
    return `${d.name}이(가) ${this.gateName(g)}을(를) 정리했다. 몫 ${fmt(money)} 크레딧.${extra}`;
  },

  // ---------- 후천 특성 ----------
  ltraitMonthly() {
    const p = this.player;
    if (this.queue.some((q) => q.type === 'ltrait')) return;
    for (const t of LIFE_TRAITS) {
      if (p.ltraits.includes(t.id) || p.ltraitsGone.includes(t.id) || !t.cond(this, p)) continue;
      if (p.ltraits.length < LTRAIT_SLOTS) this.gainLtrait(t.id);
      else this.queue.push({ type: 'ltrait', id: t.id });
      return; // 한 달에 하나
    }
  },
  gainLtrait(id, drop) {
    const p = this.player; const t = ltraitById(id); if (!t) return '';
    if (drop && (ltraitById(drop) || {}).neg) return '';
    if (drop) { p.ltraits = p.ltraits.filter((x) => x !== drop); p.ltraitsGone.push(drop); }
    if (p.ltraits.length >= LTRAIT_SLOTS) return '';
    p.ltraits.push(id); this.recalc();
    this.lifeEvent(`삶이 몸에 새겨졌다: 특성 [${t.name}] (${t.how})`);
    return `특성 [${t.name}]을(를) 얻었다. ${modsText(t.mods)}`;
  },
  refuseLtrait(id) { if ((ltraitById(id) || {}).neg && this.player.ltraits.some((x) => !ltraitById(x).neg)) return ''; this.player.ltraitsGone.push(id); return '새 흔적을 흘려보냈다.'; },
  cureCost() { return Math.round(800 * RANKS[this.player.rankIdx].mult); },
  cureLtrait(id) {
    const p = this.player; const t = ltraitById(id);
    if (!t || !t.neg || !p.ltraits.includes(id)) return '';
    if (!this.onCity()) return '도시의 각성자 전문 병원에서만 치료할 수 있다.';
    const c = this.cureCost(); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.ltraits = p.ltraits.filter((x) => x !== id); p.ltraitsGone.push(id);
    this.recalc();
    this.lifeEvent(`오랜 치료 끝에 [${t.name}]을(를) 떨쳐 냈다.`);
    this.advanceDays(14, { eventChance: 0.05 });
    return `[${t.name}]을(를) 치료했다. (−${fmt(c)} 크레딧, 2주)`;
  },

  // ---------- 성향 ----------
  lawMonthly() {
    const p = this.player; const s = p.lawSeen;
    const br = p.record.breaks || 0;
    if (br > s.breaks) { this.addLaw(6 * (br - s.breaks), '브레이크 저지'); s.breaks = br; }
    const cult = this.flags && this.flags.story && this.flags.story.cult;
    if (cult && !s.cult) { s.cult = true; if (cult === 'join') this.addLaw(-30, '균열교 가담'); if (cult === 'report') this.addLaw(8, '균열교 신고'); }
    if (p.law >= 60) p.merit = (p.merit || 0) + 2;
    if (p.law <= -60 && RNG.chance(0.04)) {
      const fine = Math.round(p.money * 0.08); p.money -= fine;
      this.log(`관리국 감찰반이 들이닥쳤다. 이것저것 트집을 잡아 ${fmt(fine)} 크레딧을 벌금으로 뜯어 갔다.`, 'bad');
    }
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.lifeInit(); });
  wrap('extraMod', function (base, key) { return base.call(this, key) + this.ltraitMod(key) + this.lawMod(key); });
  wrap('worldMonthly', function (base) { base.call(this); this.lawMonthly(); this.ltraitMonthly(); });
  wrap('finishGate', function (base, gate, result, ...rest) {
    if (result === 'lose') this.player.record.losses = (this.player.record.losses || 0) + 1;
    return base.call(this, gate, result, ...rest);
  });
  wrap('payBounty', function (base, q) { const r = base.call(this, q); this.addLaw(3, '의뢰 완수'); return r; });
  wrap('finishDuel', function (base, n, won, ...rest) {
    const villain = n && (n.relation <= -20 || persById(n.personality).id === 'warlike');
    const r = base.call(this, n, won, ...rest);
    if (won) this.addLaw(villain ? -2 : -12, villain ? '' : '무고한 헌터 살해');
    return r;
  });
  // 성향에 따라 NPC 성격별로 호감이 다르게 쌓인다
  wrap('changeRel', function (base, n, d) {
    const L = (this.player && this.player.law) || 0;
    if (d > 0 && n && L) {
      const pid = n.personality;
      if (pid === 'just') d *= 1 + L / 200;
      else if (pid === 'greedy' || pid === 'warlike') d *= 1 - L / 400;
      d = Math.round(d * 10) / 10;
    }
    return base.call(this, n, d);
  });
}

// ---------- 화면 ----------
{
  const baseEnc = UI.encounter;
  UI.encounter = function (obj) {
    const r = baseEnc.call(this, obj);
    if (obj.kind !== 'gate') return r;
    const row = $box.querySelector('.row.end'); if (!row) return r;
    let add = '';
    if (G.canDelegate(obj)) { const d = G.delegates(obj)[0]; add += `<button class="ghost" data-act="g-delegate" data-v="${obj.id}" title="${d.name} · 이번 달 ${G.delegLeft()}회 남음">위임 (${d.name})</button>`; }
    if (G.canSweep(obj)) add += `<button data-act="g-sweep" data-v="${obj.id}">소탕 (보상 ${Math.round(SWEEP_SHARE * 100)}%)</button>`;
    if (add) {
      row.insertAdjacentHTML('beforebegin', `<p class="small dim">${G.canSweep(obj) ? '내 등급보다 두 단계 이상 낮다. 소탕하면 전투 없이 정리한다(열흘).' : ''} ${G.canDelegate(obj) ? `위임하면 시간을 쓰지 않고 보수의 ${Math.round(DELEGATE_SHARE * 100)}%를 받는다.` : ''}</p>`);
      row.insertAdjacentHTML('afterbegin', add);
    }
    return r;
  };
  UI.showLtraitSwap = function (id) {
    const p = G.player; const t = ltraitById(id);
    this.ltraitNew = id;
    this.modal(`<div class="eyebrow">삶의 흔적</div><h3>[${t.name}]</h3>
      <p class="event-text">${t.how}. 그 시간들이 몸에 새겨지려 한다. 하지만 마음에 담을 자리는 ${LTRAIT_SLOTS}칸뿐이다.</p>
      <p class="small">${modsText(t.mods)}</p>
      <div class="sec-title sec">무엇을 내려놓을까</div>
      <div class="cards">${p.ltraits.filter((x) => !ltraitById(x).neg).map((x) => { const o = ltraitById(x); return `<button class="choice-btn" data-act="lt-swap" data-v="${x}"><b>${o.name}</b> 내려놓기<div class="small dim">${modsText(o.mods)}</div></button>`; }).join('')}</div>
      ${t.neg ? '<p class="small bad">상처는 고를 수 없다. 좋은 흔적 하나를 내려놓아야 한다. (나쁜 특성은 도시 병원에서 치료한다)</p>' : '<div class="row end"><button class="ghost" data-act="lt-refuse">새 흔적을 받지 않는다</button></div>'}`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'ltrait') {
      G.queue.shift();
      if (G.player.ltraits.includes(q.id) || G.player.ltraitsGone.includes(q.id)) return this.processQueue();
      if (G.player.ltraits.every((x) => ltraitById(x).neg)) { G.refuseLtrait(q.id); return this.processQueue(); }
      return this.showLtraitSwap(q.id);
    }
    return baseQueue.call(this);
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player; const L = p.law || 0;
    const pct = Math.round((L + 100) / 2);
    const lt = p.ltraits.map((id) => { const t = ltraitById(id); return `<div class="trait"><b class="${t.neg ? 'bad' : ''}">${t.name}</b><span class="dim">${modsText(t.mods)} · ${t.how}</span>${t.neg ? `<button class="sm ghost" data-act="lt-cure" data-v="${id}">치료 ${fmt(G.cureCost())}</button>` : ''}</div>`; }).join('');
    const box = `<div class="sec"><div class="sec-title">성향 · ${lawLabel(L)} <span class="small dim num">(${L > 0 ? '+' : ''}${L})</span></div>
      <div class="law-bar" style="position:relative;height:8px;border-radius:4px;background:linear-gradient(90deg,#c0504d,#555 50%,#4f81bd)"><span style="position:absolute;top:-3px;left:calc(${pct}% - 7px);width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #222"></span></div>
      <div class="row small dim" style="justify-content:space-between"><span>무법</span><span>관리국</span></div>
      <div class="small dim">${L >= 40 ? '관리국의 신뢰: 친화 +5%' : L <= -40 ? '암시장 연줄: 물가 −5%, 친화 −5%' : ''}${L >= 60 ? ' · 매달 협회 공적 +2' : L <= -60 ? ' · 감찰반이 가끔 들이닥친다' : ''}</div></div>
      <div class="sec"><div class="sec-title">후천 특성 <span class="small dim">${p.ltraits.length}/${LTRAIT_SLOTS}</span></div>${lt ? `<div class="cards traits">${lt}</div>` : '<div class="small dim">아직 삶이 남긴 흔적이 없다. 레드 게이트 생환, 브레이크 저지, 잃은 사람들… 기록이 특성으로 새겨진다.</div>'}</div>`;
    const at = html.indexOf('<div class="sec"><div class="sec-title">선천 특성</div>');
    return at < 0 ? html + box : html.slice(0, at) + box + html.slice(at);
  };
  // 계승: 성향·후천 특성은 본인의 것
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) { baseSucceed.call(this, id); const p = G.player; p.ltraits = []; p.ltraitsGone = []; p.law = Math.round((p.law || 0) / 2); p.record.losses = 0; G.recalc(); G.save(); };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'g-sweep': {
        const lines = G.sweepGate(+v); if (!lines) return;
        this.closeModal(); this.renderGame();
        return this.modal(`<div class="eyebrow">소탕</div><h3>게이트 정리</h3>${lines.map((l) => `<p>${l}</p>`).join('')}<div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`);
      }
      case 'g-delegate': { const r = G.delegateGate(+v); if (!r) return; this.closeModal(); return this.after(r); }
      case 'lt-swap': { const id = this.ltraitNew; this.ltraitNew = null; const r = G.gainLtrait(id, v); this.closeModal(); return this.after(r); }
      case 'lt-refuse': { const r = G.refuseLtrait(this.ltraitNew); this.ltraitNew = null; this.closeModal(); return this.after(r); }
      case 'lt-cure': { const r = G.cureLtrait(v); return this.sheet === 'city' ? this.afterCity(r) : this.after(r); }
      default: return baseHandle.call(this, act, v);
    }
  };
}
