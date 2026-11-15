// ===== 게이트 크로니클: 얻은 물건의 팀 정산 (영역 A, 사용자 확정) =====
// 파티로 싸워 얻은 물건을 혼자 다 가져가던 것을, 크레딧과 같은 몫으로 나눈다. (소속 길드·보호국은 전리품이 귀속되므로 해당 없음, 혼자면 전부 내 것)
// ※ 2026-11-15 사용자 확정으로 바뀜: 아래 화면 부분 머리말(나눔 1/인원 무작위 + 입찰만, 최소가 시세 80%) 참고. 이 머리말은 옛 규칙.
//  1) 코어·부산물: 기본은 그 자리에서 협회 시세로 팔아 몫대로 나눈다(즉시 정산).
//     [내가 산다]를 고르면 남의 몫만큼 내고 실물을 가져간다.
//  2) 장비: 하나씩
//     - [입찰한다]: 그 장비를 쓸 만한 팀원이 값을 부르고, 내가 더 부르면 내 것. 낙찰금은 몫대로 나눈다(내 몫은 돌려받는다).
//     - [○○에게 준다]: 내가 리더(또는 내가 모은 자유 파티)일 때만. 받은 팀원은 고마워한다.
//     - [팔아서 나눈다]: 상점 매입가로 팔아 몫대로.
//     리더가 NPC면 리더가 받을 사람을 정하고(성격에 따라 공정하게, 혹은 측근에게), 나는 입찰로만 가져올 수 있다.
//  3) 고르지 않고 [확인]을 누르면: 재료는 즉시 정산, 장비는 NPC 리더의 결정대로(내가 리더면 팔아서 나눈다).
const LOOT_SPLIT = { bidStep: 0.1, npcWant: { fit: 0.75, any: 0.4 }, giftRel: 4, saleRate: 0.4 };

{
  const GP = Game.prototype;
  const partPrice = (t) => Math.round(25 * RANKS[t].mult ** 1.5);
  const snap = (g) => { const p = g.player; return { mats: { ...(p.mats || {}) }, parts: { ...(p.parts || {}) }, inv: new Set((p.inventory || []).map((e) => e)) }; };
  const diff = (g, s) => {
    const p = g.player; const out = { cores: {}, parts: {}, gear: [] };
    for (const [k, n] of Object.entries(p.mats || {})) if (/^c\d+$/.test(k) && n > (s.mats[k] || 0)) out.cores[+k.slice(1)] = n - (s.mats[k] || 0);
    for (const [k, n] of Object.entries(p.parts || {})) if (n > (s.parts[k] || 0)) out.parts[k] = n - (s.parts[k] || 0);
    for (const e of p.inventory || []) if (!s.inv.has(e)) out.gear.push(e);
    return out;
  };
  const merge = (a, b) => {
    if (!a) return b;
    for (const [t, n] of Object.entries(b.cores)) a.cores[t] = (a.cores[t] || 0) + n;
    for (const [k, n] of Object.entries(b.parts)) a.parts[k] = (a.parts[k] || 0) + n;
    a.gear.push(...b.gear); return a;
  };
  const empty = (b) => !b || (!Object.keys(b.cores).length && !Object.keys(b.parts).length && !b.gear.length);

  Object.assign(GP, {
    // 이번 정산에 끼는 팀원과 몫 (나 포함, 합 1)
    lootShares() {
      const p = this.player; if (!p || (this.payKind && this.payKind(p.guild))) return null;
      const mates = this.party().filter((n) => n && n.alive && !(n.merc && n.merc.job));
      if (!mates.length) return null;
      const L = this.crewLeader ? this.crewLeader() : null;
      if (this.crew && this.crew() && this.crewShareRate) {
        const me = Math.max(0.01, Math.min(1, this.crewShareRate()));
        const rest = (1 - me) / mates.length;
        return { me, rows: mates.map((n) => ({ n, f: rest })), npcLead: L, leaderIsMe: !L };
      }
      const pow = (u) => Math.max(1, u.atk * 1.2 + u.def + u.maxHp / 8);
      let mine = 1, theirs = [];
      try { mine = pow(this.playerUnit()); theirs = mates.map((n) => pow(this.npcUnit(n, 'ally'))); } catch (e) { theirs = mates.map(() => mine); }
      const lc = this.leaderCut ? this.leaderCut() : 0; const tot = mine + theirs.reduce((a, b) => a + b, 0);
      const rows = mates.map((n, i) => ({ n, f: theirs[i] / tot * (1 - lc) }));
      return { me: 1 - rows.reduce((a, r) => a + r.f, 0), rows, npcLead: null, leaderIsMe: true };
    },
    lootMatValue(bag) {
      let v = 0;
      for (const [t, n] of Object.entries(bag.cores)) v += this.corePrice(+t) * n;
      for (const [k, n] of Object.entries(bag.parts)) v += partPrice(+k.split(':')[1]) * n;
      return v;
    },
    // 장비를 탐내는 정도: 계열이 맞으면 크게, 방어구·장신구는 보통
    lootWant(n, it) {
      const c = classById(n.cls || 'swordsman'); const fams = (c && GROUP_FAMS[c.g]) || [];
      const fam = it.slot === 'weapon' ? this.weaponFam(it) : null;
      if (it.slot === 'weapon') return fam && fams.includes(fam) ? LOOT_SPLIT.npcWant.fit : 0.12;
      return LOOT_SPLIT.npcWant.any + (RARITY[it.rarity] ? RARITY[it.rarity].mult * 0.03 : 0);
    },
    lootBidders(it, S) {
      return S.rows.map((r) => {
        const want = this.lootWant(r.n, it); const purse = typeof r.n.money === 'number' ? r.n.money : Infinity;
        return { n: r.n, max: Math.min(purse, Math.round(it.value * want * (0.85 + (r.n.rankIdx || 0) * 0.05))) };
      }).filter((b) => b.max >= it.value * LOOT_SPLIT.saleRate * 0.8).sort((a, b) => b.max - a.max);
    },
    // NPC 리더가 정하는 받는 사람: 공정한 리더는 가장 잘 맞는 사람, 욕심 많은 리더는 자기, 냉정한 리더는 강한 사람
    lootLeaderPick(it, S) {
      const L = S.npcLead; const pool = S.rows.map((r) => r.n);
      const fit = (n) => this.lootWant(n, it) + (n.rankIdx || 0) * 0.02;
      const pers = L ? persById(L.personality).id : 'just';
      if (pers === 'greedy' && pool.includes(L)) return L;
      if (pers === 'cold' || pers === 'warlike') return pool.slice().sort((a, b) => (b.rankIdx || 0) - (a.rankIdx || 0) || fit(b) - fit(a))[0];
      const best = pool.slice().sort((a, b) => fit(b) - fit(a))[0];
      // 공정한 리더는 나도 후보로 본다
      const myFit = it.slot === 'weapon' ? (this.famFit(it) > 0 ? LOOT_SPLIT.npcWant.fit : 0.12) : LOOT_SPLIT.npcWant.any;
      return (pers === 'just' || pers === 'kind') && myFit >= fit(best) ? 'me' : best;
    },
    // 돈을 몫대로 나눠 준다 (내 몫은 돌려받음)
    lootPayOut(total, S, skip) {
      let mine = 0;
      for (const r of S.rows) { if (r.n === skip) continue; const a = Math.round(total * r.f); if (typeof r.n.money === 'number') r.n.money += a; }
      if (skip !== 'me') { mine = Math.round(total * S.me); this.player.money += mine; }
      return mine;
    },
    npcGiveGear(n, it) {
      n.gearBonus ??= { atk: 0, def: 0, hp: 0 };
      n.gearBonus.atk += it.atk || 0; n.gearBonus.def += it.def || 0; n.gearBonus.hp += it.hp || 0;
      (n.gearNames ||= []).push(it.name); if (n.gearNames.length > 4) n.gearNames.shift();
    },
  });

  // 팀원이 받은 장비는 전투 능력치에 붙는다
  const baseNU = GP.npcUnit;
  GP.npcUnit = function (n, side) {
    const u = baseNU.call(this, n, side); const b = n && n.gearBonus;
    if (b) { u.atk += b.atk; u.def += b.def; u.hp += b.hp; u.maxHp += b.hp; }
    return u;
  };

  // 게이트 안의 전투마다 얻은 것을 모아 둔다
  const baseLoot = GP.lootFromKills;
  GP.lootFromKills = function (...a) {
    const s = snap(this); const r = baseLoot.apply(this, a);
    const c = typeof UI !== 'undefined' ? UI.ctx : null; const run = c && (c.run || (c.prevCtx && c.prevCtx.run));
    if (run) run.lootBag = merge(run.lootBag, diff(this, s));
    return r;
  };
  // 토벌·게이트를 끝낼 때 정산할 물건 꾸러미를 만든다
  const baseMob = GP.finishMob;
  GP.finishMob = function (mob, result, ...a) {
    const s = snap(this); const r = baseMob.call(this, mob, result, ...a);
    this._lootPend = result === 'win' ? diff(this, s) : null;
    return r;
  };
  const baseGate = GP.finishGate;
  GP.finishGate = function (gate, result, ...a) {
    const s = snap(this); const r = baseGate.call(this, gate, result, ...a);
    const c = typeof UI !== 'undefined' ? UI.ctx : null; const run = c && c.run;
    this._lootPend = result === 'lose' ? null : merge(run && run.lootBag ? run.lootBag : null, diff(this, s));
    if (run) run.lootBag = null;
    return r;
  };
}

// ---------- 화면: 정산서 안의 "팀 정산" (사용자 확정 규칙, 2026-11-15) ----------
// 장비·재료는 하나씩 파티원(나 포함) 중 한 명에게 똑같은 확률(1/인원)로 무작위로 돌아간다.
// 꼭 가져가고 싶으면 입찰만 할 수 있다. NPC 팀원도 입찰한다. 최소가는 시세의 80%, 더 높이 부른 쪽이 가져가고
// 낙찰금은 낙찰자를 뺀 나머지 파티원이 똑같이 나눈다(n빵). 입찰이 걸리면 받은 사람도 거부할 수 없고, 지키려면 같이 입찰한다. [확인]을 누르면 굴린 결과대로(진행 중인 입찰은 그때 최고가로) 끝난다.
const LOOT_ROLL = { minRate: 0.8, step: 0.1, npcOpen: 0.55 };
{
  const dropGear = (it) => { const p = G.player; p.inventory = p.inventory.filter((e) => e !== it); };
  // 입찰은 장비와 B급 이상 재료만 (사용자 결정). F~C급 재료는 무작위 나눔만
  const biddable = (lot) => lot.kind === 'gear' || (lot.kind === 'core' ? +lot.key : +String(lot.key).split(':')[1]) >= 4;
  const mineOf = (lot) => (lot.bid ? lot.bid.top : lot.owner) === 'me';
  const who = (x) => (x === 'me' ? '나' : x ? x.name : '');
  const priceOf = (lot) => (lot.kind === 'gear' ? (lot.it.value || 0)
    : lot.kind === 'core' ? G.corePrice(+lot.key) * lot.n : Math.round(25 * RANKS[+lot.key.split(':')[1]].mult ** 1.5) * lot.n);
  const nameOf = (lot) => (lot.kind === 'gear' ? lot.it.name : lot.kind === 'core' ? `${coreName(+lot.key)} ×${lot.n}` : (() => { const [id, t] = lot.key.split(':'); return `${G.partLabel(id, +t)} ×${lot.n}`; })());
  // NPC가 이 물건에 쓸 수 있는 최고가
  const npcMax = (n, lot) => {
    const want = lot.kind === 'gear' ? G.lootWant(n, lot.it) : 0.5;
    const purse = typeof n.money === 'number' ? n.money : Infinity;
    return Math.min(purse, Math.round(priceOf(lot) * (0.7 + want * 0.6) * (0.9 + (n.rankIdx || 0) * 0.04)));
  };
  const rivals = (lot, S, except) => S.rows.map((r) => r.n).filter((n) => n !== except).map((n) => ({ n, max: npcMax(n, lot) })).filter((x) => x.max >= lot.min).sort((a, b) => b.max - a.max);
  // 낙찰금: 낙찰자가 내고, 낙찰자를 뺀 나머지가 똑같이 나눈다
  const payOut = (from, amt, S) => {
    if (from === 'me') G.player.money -= amt; else if (typeof from.money === 'number') from.money = Math.max(0, from.money - amt);
    const others = ['me', ...S.rows.map((r) => r.n)].filter((x) => x !== from); const each = Math.floor(amt / Math.max(1, others.length));
    let mine = 0; for (const o of others) { if (o === 'me') { G.player.money += each; mine = each; } else if (typeof o.money === 'number') o.money += each; }
    return mine;
  };

  UI.lootSplitStart = function () {
    const bag = G._lootPend; G._lootPend = null;
    if (!bag || (!Object.keys(bag.cores).length && !Object.keys(bag.parts).length && !bag.gear.length)) return;
    const S = G.lootShares(); if (!S) return;
    const pool = ['me', ...S.rows.map((r) => r.n)];
    const roll = () => RNG.pick(pool);
    const lots = [];
    for (const it of bag.gear) lots.push({ kind: 'gear', it, owner: roll() });
    const stack = (kind, key, n) => { const by = new Map(); for (let i = 0; i < n; i++) { const o = roll(); by.set(o, (by.get(o) || 0) + 1); } for (const [o, k] of by) lots.push({ kind, key, n: k, owner: o }); };
    for (const [t, n] of Object.entries(bag.cores)) stack('core', t, n);
    for (const [k, n] of Object.entries(bag.parts)) stack('part', k, n);
    for (const lot of lots) {
      lot.min = Math.max(1, Math.round(priceOf(lot) * LOOT_ROLL.minRate));
      // 다른 사람에게 간 물건을 NPC가 꼭 갖고 싶으면 입찰을 건다
      const r = !biddable(lot) ? null : rivals(lot, S, lot.owner).filter((x) => lot.kind !== 'gear' || G.lootWant(x.n, lot.it) >= LOOT_ROLL.npcOpen)[0];
      if (r && RNG.chance(lot.kind === 'gear' ? 0.6 : 0.2)) lot.bid = { top: r.n, price: lot.min, next: Math.round(lot.min * (1 + LOOT_ROLL.step)) };
    }
    this._loot = { S, lots }; this.lootRender();
  };
  UI.lootMine = function (uid) { const L = this._loot; if (!L) return true; const lot = L.lots.find((x) => x.kind === 'gear' && String(x.it.uid) === String(uid)); return !lot || (lot.done ? lot.final === 'me' : lot.owner === 'me' && !lot.bid); };
  UI.lootHtml = function () {
    const L = this._loot; if (!L) return '';
    const n = L.S.rows.length + 1;
    let h = `<div class="ss-sec loot-split"><div class="ss-h"><span>팀 정산 · 얻은 물건</span><span class="dim">${n}명이 하나씩 무작위로 나눔</span></div>`;
    L.lots.forEach((lot, i) => {
      const col = lot.kind === 'gear' && RARITY[lot.it.rarity] ? RARITY[lot.it.rarity].color : '#cfd8e3';
      const stats = lot.kind === 'gear' && UI.equipStats ? `<span class="small dim">${UI.equipStats(lot.it)}</span>` : '';
      h += `<div class="ls-row"><div class="ls-name"><b style="color:${col}">${nameOf(lot)}</b>${stats}<span class="small">시세 ${fmt(priceOf(lot))}${biddable(lot) ? ` · 최소 입찰 ${fmt(lot.min)}` : ''}</span></div>`;
      if (lot.done) { h += `<div class="ls-done">${lot.done}</div></div>`; return; }
      h += `<div class="small ls-lead">나눔: <b class="${lot.owner === 'me' ? 'ok' : ''}">${who(lot.owner)}</b>에게</div>`;
      if (lot.bid) {
        const b = lot.bid; const meTop = b.top === 'me';
        h += `<div class="ls-bid"><span>입찰 최고가 <b>${fmt(b.price)}</b> · ${who(b.top)}</span></div>`;
        h += meTop
          ? `<div class="ls-btns"><button class="primary sm" data-act="ls-win" data-v="${i}">${fmt(b.price)}에 낙찰</button><button class="sm ghost" data-act="ls-cancel" data-v="${i}">그만둔다</button></div></div>`
          : `<div class="ls-btns"><button class="primary sm" data-act="ls-raise" data-v="${i}" ${G.player.money < b.next ? 'disabled' : ''}>${fmt(b.next)}에 부른다</button><button class="sm ghost" data-act="ls-fold" data-v="${i}">${lot.owner === 'me' ? '넘긴다' : '포기'} · 내 몫 +${fmt(Math.floor(b.price / Math.max(1, L.S.rows.length)))}</button></div></div>`;
        return;
      }
      h += lot.owner === 'me' || !biddable(lot) ? '</div>'
        : `<div class="ls-btns"><button class="primary sm" data-act="ls-bid" data-v="${i}" ${G.player.money < lot.min ? 'disabled' : ''}>입찰한다 · ${fmt(lot.min)}부터</button></div></div>`;
    });
    return h + '<div class="small dim ls-foot">꼭 가져가야 하는 것만 입찰한다(장비·B급 이상 재료). 낙찰금은 낙찰자를 뺀 파티원이 똑같이 나눈다. 입찰이 걸리면 받은 사람도 거부할 수 없다. 확인을 누르면 나눔(진행 중인 입찰은 그때 최고가) 그대로 끝난다.</div></div>';
  };
  UI.lootRender = function () {
    const box = document.getElementById('modal-box'); if (!box || !this._loot) return;
    const sheet = box.querySelector('.settle-sheet'); const html = this.lootHtml();
    const old = box.querySelector('.loot-split');
    const el = document.createElement('div'); el.innerHTML = html; const node = el.firstChild;
    if (old) old.replaceWith(node);
    else if (sheet) { const items = [...sheet.querySelectorAll('.ss-sec')].find((s) => /얻은 물건/.test(s.textContent)); if (items) items.replaceWith(node); else sheet.appendChild(node); }
    else { const row = box.querySelector('.row.end'); if (row) row.before(node); else box.appendChild(node); }
    if (this.walletChip) try { this.walletChip(); } catch (e) { /* 무시 */ }
  };
  // 한 덩어리를 끝낸다: 최종 주인에게 넘기고, 입찰이면 낙찰금을 받았던 사람에게 준다
  const settle = (lot, S) => {
    const b = lot.bid; const final = b ? b.top : lot.owner;
    const share = b ? payOut(final, b.price, S) : 0; const n1 = S.rows.length;
    if (final !== 'me') {
      if (lot.kind === 'gear') { dropGear(lot.it); G.npcGiveGear(final, lot.it); }
      else if (lot.kind === 'core') { const k = 'c' + lot.key; G.player.mats[k] = Math.max(0, (G.player.mats[k] || 0) - lot.n); }
      else G.player.parts[lot.key] = Math.max(0, (G.player.parts[lot.key] || 0) - lot.n);
    }
    lot.final = final; lot.bid = null;
    lot.done = b
      ? (final === 'me' ? `내가 ${fmt(b.price)}에 낙찰. 나머지 ${n1}명이 나눠 가졌다.` : `${who(final)}이(가) ${fmt(b.price)}에 가져갔다. 내 몫 +${fmt(share)}`)
      : (final === 'me' ? '내 것' : `${who(final)}의 것`);
  };
  UI.lootFinish = function () {
    const L = this._loot; if (!L) return; this._loot = null;
    for (const lot of L.lots) if (!lot.done) settle(lot, L.S);
    G.save();
  };
  // NPC가 내 값에 응한다
  const npcAnswer = (lot, S) => {
    const b = lot.bid; const r = rivals(lot, S, null).find((x) => x.max > b.price); // 받은 사람도 지키려면 같이 입찰한다
    if (r) { b.price = Math.min(r.max, Math.round(b.price * (1 + LOOT_ROLL.step))); b.top = r.n; }
    b.next = Math.round(b.price * (1 + LOOT_ROLL.step));
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const L = this._loot;
    if (L && /^ls-/.test(act)) {
      const S = L.S; const lot = L.lots[+v]; if (!lot || lot.done) return;
      switch (act) {
        case 'ls-bid': {
          if (!biddable(lot) || G.player.money < lot.min) return;
          lot.bid = { top: 'me', price: lot.min, next: Math.round(lot.min * (1 + LOOT_ROLL.step)) };
          npcAnswer(lot, S); break;
        }
        case 'ls-raise': {
          const b = lot.bid; if (!b || G.player.money < b.next) return;
          b.price = b.next; b.top = 'me'; npcAnswer(lot, S); break;
        }
        case 'ls-win': case 'ls-fold': if (lot.bid) settle(lot, S); break;
        case 'ls-cancel': {
          // 내가 그만두면 다음으로 많이 부른 사람이 그 값에, 없으면 나눔 그대로
          const r = rivals(lot, S, null)[0];
          if (r) { lot.bid = { top: r.n, price: Math.min(r.max, lot.min), next: lot.min }; settle(lot, S); } else lot.bid = null;
          break;
        }
      }
      G.save(); this.lootRender(); return;
    }
    if (L && (act === 'modal-close' || act === 'settle-close')) this.lootFinish();
    return baseHandle.call(this, act, v);
  };
  // 정산서가 그려진 뒤에 붙인다
  const baseP = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function (...a) { if (this._loot) this.lootFinish(); const r = baseP.apply(this, a); try { this.lootSplitStart(); } catch (e) { /* 무시 */ } return r; };
  const baseG = UI.finishGate;
  UI.finishGate = function (...a) { if (this._loot) this.lootFinish(); const r = baseG.apply(this, a); try { this.lootSplitStart(); } catch (e) { /* 무시 */ } return r; };
}
