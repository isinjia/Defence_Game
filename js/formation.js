// ===== 게이트 크로니클: 진형 (전열 2 · 후열 3) =====
// 전열은 적의 공격을 먼저 받는다. 후열은 전열이 버티는 동안 덜 노려진다.
// 기본 배치: 탱커·근접은 전열, 서포터·딜러는 후열. 파티 창에서 자리를 바꿀 수 있다.

const FORM_CAP = { front: 2, back: 3 };
const ROLE_PRI = { tank: 0, melee: 1, assassin: 2, esper: 3, summoner: 4, ranged: 5, caster: 6, support: 7 };
const MELEE_ROLES = ['tank', 'melee'];

function rolePri(cls) { const c = classById(cls); return c && ROLE_PRI[c.role] != null ? ROLE_PRI[c.role] : 5; }
function roleOf(cls) { const c = classById(cls); return c ? c.role : ''; }

// units: [{ id, cls, maxHp }], prefs: { id: 'front'|'back' } → { id: row }
function assignRows(units, prefs = {}) {
  const rows = {};
  const pri = (u) => rolePri(u.cls) * 1e6 - (u.maxHp || 0);
  for (const u of units) rows[u.id] = prefs[u.id] === 'front' || prefs[u.id] === 'back' ? prefs[u.id] : (rolePri(u.cls) <= 1 ? 'front' : 'back');
  const list = (r) => units.filter((u) => rows[u.id] === r);
  // 전열 초과: 직접 정하지 않은 사람, 전열에 덜 맞는 사람부터 후열로
  while (list('front').length > FORM_CAP.front) {
    const f = list('front').sort((a, b) => (prefs[a.id] ? 1 : 0) - (prefs[b.id] ? 1 : 0) || pri(b) - pri(a))[0];
    rows[f.id] = 'back';
  }
  // 후열 초과: 전열에 잘 맞는 사람부터 전열로
  while (list('back').length > FORM_CAP.back) {
    const b = list('back').sort((x, y) => (prefs[x.id] ? 1 : 0) - (prefs[y.id] ? 1 : 0) || pri(x) - pri(y))[0];
    rows[b.id] = 'front';
  }
  // 아무도 앞에 서지 않으면 가장 전열다운 사람이 선다
  if (units.length && !list('front').length) rows[units.slice().sort((a, b) => pri(a) - pri(b))[0].id] = 'front';
  return rows;
}

Object.assign(Game.prototype, {
  formUnits() {
    const p = this.player;
    return [{ id: 'player', cls: p.cls, maxHp: p.maxHp, name: p.name }, ...this.party().map((n) => ({ id: 'npc' + n.id, cls: n.cls, maxHp: (n.rankIdx + 1) * 100, name: n.name, npc: n }))];
  },
  formation() { return assignRows(this.formUnits(), this.player.form || {}); },
  // 두 사람 자리 바꾸기, 또는 한 사람을 빈 자리로
  formMove(id, target) {
    const p = this.player; const rows = this.formation();
    const prefs = { ...rows };
    if (target === 'front' || target === 'back') {
      if (rows[id] === target) return;
      const cnt = Object.values(rows).filter((r) => r === target).length;
      if (cnt >= FORM_CAP[target]) return '그 줄은 이미 가득 찼다.';
      prefs[id] = target;
      if (!Object.values(prefs).includes('front')) return '전열에는 최소 한 명이 서야 한다.';
    } else {
      if (rows[id] === rows[target]) return;
      prefs[id] = rows[target]; prefs[target] = rows[id];
    }
    p.form = prefs;
    return '';
  },
});

// 전투: 아군에게 자리를 정하고, 적은 전열부터 노린다
{
  const basePrep = Combat.prototype.prep;
  Combat.prototype.prep = function (u) {
    const x = basePrep.call(this, u);
    if (x.summon) x.row = 'front'; // 소환수는 앞에 서서 막는다
    return x;
  };
  const Base = Combat;
  // 생성 직후 아군 자리 배정
  Base.prototype.assignFormation = function () {
    const allies = this.units.filter((u) => u.side === 'ally' && !u.summon);
    const prefs = (this.game && this.game.player && this.game.player.form) || {};
    const rows = assignRows(allies.map((u) => ({ id: u.id, cls: u.cls, maxHp: u.maxHp })), prefs);
    for (const u of allies) u.row = u.row || rows[u.id] || 'back';
  };
  const basePick = Base.prototype.pickTarget;
  Base.prototype.pickTarget = function (u) {
    if (u.side !== 'enemy') return basePick.call(this, u);
    if (!this.formed) { this.formed = true; this.assignFormation(); }
    const foes = this.foesOf(u); if (!foes.length) return null;
    const taunter = foes.find((f) => f.tauntT > 0);
    if (taunter && Math.random() < 0.8) return taunter;
    const front = foes.filter((f) => f.row === 'front');
    // 전열이 살아 있으면 대부분 전열을 친다. 가끔 후열로 파고든다.
    const pool = front.length && Math.random() < 0.8 ? front : foes;
    const pl = pool.find((f) => f.isPlayer);
    if (pl && Math.random() < 0.35) return pl;
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const baseCalc = Base.prototype.calcDamage;
  Base.prototype.calcDamage = function (att, def, skill, opt = {}) {
    const r = baseCalc.call(this, att, def, skill, opt);
    // 후열에 선 근접 직업은 제 힘을 다 못 낸다
    if (att.side === 'ally' && att.row === 'back' && MELEE_ROLES.includes(roleOf(att.cls))) r.dmg = Math.max(1, Math.round(r.dmg * 0.75));
    return r;
  };
}

Object.assign(UI, {
  formationHtml() {
    const units = G.formUnits(); const rows = G.formation(); const sel = this.formSel;
    const chip = (u) => {
      const role = roleOf(u.cls); const warn = (rows[u.id] === 'back' && MELEE_ROLES.includes(role)) ? ' <span class="tag tiny bad">근접 −25%</span>' : '';
      return `<button class="form-chip ${sel === u.id ? 'sel' : ''}" data-act="form-pick" data-v="${u.id}">${u.id === 'player' ? this.playerAvatar(30) : this.npcAvatar(u.npc, 30)}<span><b>${u.name}</b><span class="small dim">${className(u.cls)}${warn}</span></span></button>`;
    };
    const row = (r) => {
      const us = units.filter((u) => rows[u.id] === r);
      const empty = Math.max(0, FORM_CAP[r] - us.length);
      return `<div class="form-row ${r}"><div class="form-label">${r === 'front' ? '전열' : '후열'} <span class="small dim">${us.length}/${FORM_CAP[r]}</span></div>
        <div class="form-slots">${us.map(chip).join('')}${Array.from({ length: empty }, () => `<button class="form-chip empty" data-act="form-slot" data-v="${r}" ${sel ? '' : 'disabled'}>빈 자리</button>`).join('')}</div></div>`;
    };
    return `<div class="panel form-panel"><h3>진형</h3>
      <p class="dim small">전열은 적의 공격을 먼저 받고, 후열은 전열이 버티는 동안 덜 노려집니다. 기본은 탱커·근접이 전열, 서포터·딜러가 후열. 한 명을 누른 뒤 다른 사람이나 빈 자리를 누르면 자리가 바뀝니다.</p>
      ${row('front')}${row('back')}
      <div class="row end"><button class="sm ghost" data-act="form-auto">기본 배치로</button></div></div>`;
  },
});

{
  const baseParty = UI.partyHtml;
  UI.partyHtml = function () { return this.formationHtml() + baseParty.call(this); };

  // 전투 화면: 아군을 전열·후열 두 줄로
  const baseOpen = UI.openCombat;
  UI.openCombat = function () {
    const c = this.ctx; if (c && c.combat && c.combat.assignFormation) { c.combat.formed = true; c.combat.assignFormation(); }
    baseOpen.call(this);
    const a = document.getElementById('allies');
    if (a && !document.getElementById('allies-front')) {
      a.classList.add('ally-rows'); a.classList.remove('allies');
      a.innerHTML = '<div class="row-tag">전열</div><div class="allies" id="allies-front"></div><div class="row-tag">후열</div><div class="allies" id="allies-back"></div>';
      this.refreshUnits();
    }
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () {
    const c = this.ctx;
    if (c && c.combat && document.getElementById('allies-front')) {
      // 아군 카드를 자기 줄로 옮긴다 (새로 생긴 소환수 포함)
      for (const u of c.combat.units) {
        if (u.side !== 'ally') continue;
        const host = document.getElementById('allies-' + (u.row || 'back'));
        let el = document.getElementById('u-' + u.id);
        if (!el && host) { host.insertAdjacentHTML('beforeend', fixJosa(this.unitEl(u))); el = document.getElementById('u-' + u.id); if (!c.disp[u.id]) c.disp[u.id] = { hp: u.hp, mp: u.mp }; }
        if (el && host && el.parentNode !== host) host.appendChild(el);
      }
      for (const t of document.querySelectorAll('#allies .row-tag')) { const next = t.nextElementSibling; t.style.display = next && next.children.length ? '' : 'none'; }
    }
    return baseRefresh.call(this);
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'form-pick': {
        if (!this.formSel) { this.formSel = v; return this.openSheet('party'); }
        if (this.formSel === v) { this.formSel = null; return this.openSheet('party'); }
        const msg = G.formMove(this.formSel, v); this.formSel = null; G.save();
        this.openSheet('party'); if (msg) this.toast(msg); return;
      }
      case 'form-slot': {
        if (!this.formSel) return;
        const msg = G.formMove(this.formSel, v); this.formSel = null; G.save();
        this.openSheet('party'); if (msg) this.toast(msg); return;
      }
      case 'form-auto': G.player.form = {}; this.formSel = null; G.save(); return this.openSheet('party');
    }
    return baseHandle.call(this, act, v);
  };
}
