// ===== 게이트 크로니클: 얻은 물건의 팀 정산 (영역 A, 사용자 확정) =====
// 파티로 싸워 얻은 물건을 혼자 다 가져가던 것을, 크레딧과 같은 몫으로 나눈다. (소속 길드·보호국은 전리품이 귀속되므로 해당 없음, 혼자면 전부 내 것)
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

// ---------- 화면: 정산서 안의 "팀 정산" ----------
{
  const take = (bag) => {
    const p = G.player;
    for (const [t, n] of Object.entries(bag.cores)) p.mats['c' + t] = Math.max(0, (p.mats['c' + t] || 0) - n);
    for (const [k, n] of Object.entries(bag.parts)) p.parts[k] = Math.max(0, (p.parts[k] || 0) - n);
  };
  const dropGear = (it) => { const p = G.player; p.inventory = p.inventory.filter((e) => e !== it); };

  UI.lootSplitStart = function () {
    const bag = G._lootPend; G._lootPend = null;
    if (!bag || (!Object.keys(bag.cores).length && !Object.keys(bag.parts).length && !bag.gear.length)) return;
    const S = G.lootShares(); if (!S) return;
    const L = { bag, S, mat: Object.keys(bag.cores).length || Object.keys(bag.parts).length ? { v: G.lootMatValue(bag), done: null } : null, gear: bag.gear.map((it) => ({ it, done: null, bid: null, pick: S.npcLead ? G.lootLeaderPick(it, S) : null })) };
    this._loot = L; this.lootRender();
  };
  const who = (x) => (x === 'me' ? '나' : x ? x.name : '');
  UI.lootHtml = function () {
    const L = this._loot; if (!L) return '';
    const S = L.S; const me = Math.round(S.me * 100);
    let h = `<div class="ss-sec loot-split"><div class="ss-h"><span>팀 정산 · 얻은 물건</span><span class="dim">내 몫 ${me}%${S.npcLead ? ` · 리더 ${S.npcLead.name}` : ''}</span></div>`;
    if (L.mat) {
      const mine = Math.round(L.mat.v * S.me); const pay = L.mat.v - mine;
      const list = [...Object.entries(L.bag.cores).map(([t, n]) => `${coreName(+t)} ×${n}`), ...Object.entries(L.bag.parts).map(([k, n]) => { const [id, t] = k.split(':'); return `${G.partLabel(id, +t)} ×${n}`; })].join(' · ');
      h += `<div class="ls-row"><div class="ls-name"><b>코어·부산물</b><span class="small dim">${list}</span><span class="small">시세 ${fmt(L.mat.v)} 크레딧</span></div>`;
      if (L.mat.done) h += `<div class="ls-done">${L.mat.done}</div>`;
      else h += `<div class="ls-btns"><button class="primary sm" data-act="ls-mat" data-v="sell">즉시 정산 <b>+${fmt(mine)}</b></button><button class="sm" data-act="ls-mat" data-v="buy" ${G.player.money < pay ? 'disabled' : ''}>내가 산다 <b>−${fmt(pay)}</b></button></div>`;
      h += '</div>';
    }
    L.gear.forEach((g, i) => {
      const it = g.it; const sale = Math.round(it.value * LOOT_SPLIT.saleRate);
      const col = RARITY[it.rarity] ? RARITY[it.rarity].color : '#ccc';
      h += `<div class="ls-row"><div class="ls-name"><b style="color:${col}">${it.name}</b><span class="small dim">${UI.equipStats ? UI.equipStats(it) : ''}</span><span class="small">매입가 ${fmt(sale)} 크레딧</span></div>`;
      if (g.done) { h += `<div class="ls-done">${g.done}</div></div>`; return; }
      if (g.bid) {
        const top = g.bid.top;
        h += `<div class="ls-bid"><span>최고가 <b>${fmt(g.bid.price)}</b> · ${who(top)}</span>${top === 'me' ? '<span class="small ok">아무도 더 부르지 않는다</span>' : ''}</div>`;
        h += top === 'me'
          ? `<div class="ls-btns"><button class="primary sm" data-act="ls-win" data-v="${i}">${fmt(g.bid.price)}에 낙찰 <b>(실제 −${fmt(Math.round(g.bid.price * (1 - S.me)))})</b></button><button class="sm ghost" data-act="ls-cancel" data-v="${i}">그만둔다</button></div></div>`
          : `<div class="ls-btns"><button class="primary sm" data-act="ls-raise" data-v="${i}" ${G.player.money < g.bid.next ? 'disabled' : ''}>${fmt(g.bid.next)}에 부른다</button><button class="sm ghost" data-act="ls-fold" data-v="${i}">포기 · ${who(top)}에게</button></div></div>`;
        return;
      }
      const pickTxt = S.npcLead ? `<div class="small ls-lead">리더 결정: ${g.pick === 'me' ? '<b class="ok">나에게</b>' : `<b>${who(g.pick)}</b>에게`}</div>` : '';
      const best = !S.npcLead ? G.lootBidders(it, S)[0] : null;
      h += `${pickTxt}<div class="ls-btns">
        ${g.pick === 'me' ? '' : `<button class="primary sm" data-act="ls-bid" data-v="${i}">입찰한다</button>`}
        ${S.npcLead ? '' : `${best ? `<button class="sm" data-act="ls-give" data-v="${i}">${best.n.name}에게 준다</button>` : ''}<button class="sm" data-act="ls-sell" data-v="${i}">팔아서 나눈다 <b>+${fmt(Math.round(sale * S.me))}</b></button><button class="sm ghost" data-act="ls-keep" data-v="${i}">내가 갖는다 <b>−${fmt(Math.round(sale * (1 - S.me)))}</b></button>`}
      </div></div>`;
    });
    return h + '<div class="small dim ls-foot">고르지 않고 확인을 누르면 재료는 즉시 정산, 장비는 ' + (S.npcLead ? '리더 결정대로' : '팔아서 나눈다') + '.</div></div>';
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
  // 남은 것은 기본 처리
  UI.lootFinish = function () {
    const L = this._loot; if (!L) return; this._loot = null;
    const S = L.S;
    if (L.mat && !L.mat.done) { take(L.bag); G.lootPayOut(L.mat.v, S); }
    for (const g of L.gear) {
      if (g.done) continue;
      if (g.bid) { lootSettleBid(g, S); continue; }
      if (S.npcLead && g.pick && g.pick !== 'me') { dropGear(g.it); G.npcGiveGear(g.pick, g.it); }
      else if (!S.npcLead) { dropGear(g.it); G.lootPayOut(Math.round(g.it.value * LOOT_SPLIT.saleRate), S); }
    }
    G.save();
  };
  const lootSettleBid = (g, S) => {
    const b = g.bid; if (!b) return;
    if (b.top === 'me') { G.player.money -= b.price; G.lootPayOut(b.price, S); g.done = `내가 ${fmt(b.price)}에 낙찰. 내 몫 ${fmt(Math.round(b.price * S.me))}은 돌려받았다.`; }
    else { dropGear(g.it); G.npcGiveGear(b.top, g.it); G.lootPayOut(b.price, S, b.top); g.done = `${b.top.name}이(가) ${fmt(b.price)}에 가져갔다. 내 몫 +${fmt(Math.round(b.price * S.me))}`; }
    g.bid = null;
  };
  // NPC가 내 값에 응한다
  const npcAnswer = (g, S) => {
    const b = g.bid; const rival = G.lootBidders(g.it, S).find((x) => x.max > b.price);
    if (rival) { b.price = Math.min(rival.max, Math.round(b.price * (1 + LOOT_SPLIT.bidStep))); b.top = rival.n; }
    b.next = Math.round(b.price * (1 + LOOT_SPLIT.bidStep));
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const L = this._loot;
    if (L && /^ls-/.test(act)) {
      const S = L.S; const g = L.gear[+v];
      switch (act) {
        case 'ls-mat': {
          const mine = Math.round(L.mat.v * S.me); const pay = L.mat.v - mine;
          if (v === 'buy') { if (G.player.money < pay) return; G.player.money -= pay; for (const r of S.rows) if (typeof r.n.money === 'number') r.n.money += Math.round(L.mat.v * r.f); L.mat.done = `실물을 가져왔다. 팀에 ${fmt(pay)} 크레딧을 냈다.`; }
          else { take(L.bag); G.lootPayOut(L.mat.v, S); L.mat.done = `협회 시세로 넘기고 내 몫 +${fmt(mine)} 크레딧.`; }
          break;
        }
        case 'ls-bid': {
          const base = Math.round(g.it.value * LOOT_SPLIT.saleRate);
          const rival = G.lootBidders(g.it, S).find((x) => x.max >= base);
          g.bid = rival ? { price: base, top: rival.n, next: Math.round(base * (1 + LOOT_SPLIT.bidStep)) } : { price: base, top: 'me', next: base };
          break;
        }
        case 'ls-raise': {
          const b = g.bid; if (!b || G.player.money < b.next) return;
          b.price = b.next; b.top = 'me'; npcAnswer(g, S);
          break;
        }
        case 'ls-win': case 'ls-fold': if (g.bid) lootSettleBid(g, S); break;
        case 'ls-cancel': {
          // 내가 그만두면 다음으로 많이 부른 팀원이 가져간다(없으면 원래 선택으로)
          const rival = G.lootBidders(g.it, S)[0];
          if (rival && g.bid) { g.bid.top = rival.n; g.bid.price = Math.min(rival.max, Math.round(g.it.value * LOOT_SPLIT.saleRate)); lootSettleBid(g, S); } else g.bid = null;
          break;
        }
        case 'ls-give': {
          const best = G.lootBidders(g.it, S)[0]; if (!best) break;
          dropGear(g.it); G.npcGiveGear(best.n, g.it); G.changeRel(best.n, LOOT_SPLIT.giftRel, '전리품을 양보받았다');
          g.done = `${best.n.name}에게 줬다. 고마워한다. (관계 +${LOOT_SPLIT.giftRel})`; break;
        }
        case 'ls-sell': { dropGear(g.it); const mine = G.lootPayOut(Math.round(g.it.value * LOOT_SPLIT.saleRate), S); g.done = `팔아서 나눴다. 내 몫 +${fmt(mine)}`; break; }
        case 'ls-keep': {
          const sale = Math.round(g.it.value * LOOT_SPLIT.saleRate); const pay = Math.round(sale * (1 - S.me)); if (G.player.money < pay) return;
          G.player.money -= pay; for (const r of S.rows) if (typeof r.n.money === 'number') r.n.money += Math.round(sale * r.f);
          g.done = `내가 갖는다. 팀에 ${fmt(pay)} 크레딧을 냈다.`; break;
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
