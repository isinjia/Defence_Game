// ===== 게이트 크로니클: 필살 게이지 (영역 A-γ, docs/전투_제안.md 7) =====
// 피해를 주거나 받거나 동료가 쓰러지면 차는 아군 개인 게이지. 가득 차면 직업 역할에 맞는 필살기를 한 번(대가 없음, 한 전투에 한 사람 한 번).
// 혼자이거나 둘일 때, 체력 35% 미만으로 몰렸을 때 더 빨리 찬다.
// (예전 한계 돌파 단추는 이 게이지와 겹쳐 뺐다.)
// - 플레이어: 스킬 목록 맨 위의 필살 버튼(가득 차면 스킬 버튼에 '필' 표시). 자동 전투면 알아서 쓴다.
// - 동료: 자기 차례에 가득 차 있으면 바로 쓴다.
// 화면: 아군 그림 아래 얇은 줄(그림 위에 겹쳐 높이를 더하지 않는다).

const ULT_MAX = 100;
// 역할별 필살기
const ULT_SKILL = {
  tank: { name: '불괴의 성벽', desc: '파티 방어 크게 상승 3턴 · 적의 시선을 끈다 · 체력 25% 회복' },
  support: { name: '생명의 노래', desc: '쓰러진 동료 하나를 일으키고 파티 체력 30% 회복' },
  strike: { name: '일섬', desc: '한 적에게 위력 350% 관통 일격(치명 잘 터짐)' },
  wide: { name: '섬멸', desc: '적 전체에 위력 180% 피해' },
};
function ultKindOf(u) {
  const r = (classById(u.cls) || {}).role;
  if (r === 'tank') return 'tank';
  if (r === 'support') return 'support';
  if (r === 'melee' || r === 'assassin') return 'strike';
  return 'wide';
}

Object.assign(Combat.prototype, {
  ultOk(u) { return !!(u && u.side === 'ally' && !u.summon && u.alive && !u.fled); },
  ultAdd(u, v) {
    if (!this.ultOk(u) || this.result || u.ultUsed) return; // 한 전투에 한 사람 한 번
    // 사람이 적을수록, 몰릴수록(체력 35% 미만) 빨리 찬다
    const n = this.units.filter((x) => x.side === 'ally' && !x.summon && x.alive).length;
    v *= (n <= 1 ? 1.8 : n === 2 ? 1.3 : 1) * (u.hp < u.maxHp * 0.35 ? 1.6 : 1);
    const was = u.ult || 0; u.ult = Math.min(ULT_MAX, was + v);
    if (was < ULT_MAX && u.ult >= ULT_MAX) this.log.push({ t: '', cls: '', ev: { k: 'ultfull', dst: u.id } });
  },
  ultReady(u) { return this.ultOk(u) && (u.ult || 0) >= ULT_MAX && !(u.stun > 0); },
  ultInfo(u) { const k = ultKindOf(u); return { kind: k, ...ULT_SKILL[k] }; },
  // 필살기 실행
  useUlt(u, targetId) {
    if (!this.ultReady(u)) return false;
    const info = this.ultInfo(u); u.ult = 0; u.ultUsed = true;
    const foes = this.foesOf(u); const friends = this.friendsOf(u);
    const picked = targetId != null ? foes.find((x) => x.id === targetId) : null;
    const t = picked || (u.isPlayer && this.target && this.target.alive ? this.target : this.pickTarget(u)) || foes[0];
    const sk = (power, type = 'dmg') => ({ id: 'ult', name: info.name, type, power, elem: u.elem, mp: 0 });
    this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: u.elem, side: 'ally', name: '필살 · ' + info.name } });
    this.push(`${u.name}의 필살기 — ${info.name}!`, 'hit', { k: 'aoe', src: u.id, side: 'ally', elem: u.elem, ult: true });
    this._inUlt = true;
    try {
      if (info.kind === 'tank') {
        for (const f of friends) { f.buffs.def = Math.max(f.buffs.def, 0.6); f.buffs.defT = Math.max(f.buffs.defT, 3); }
        u.tauntT = Math.max(u.tauntT, 3);
        this.healUnit(u, u.maxHp * 0.25 / 0.55, u);
        this.buffEvent(u, `${info.name} · 파티 방어 크게 상승, 적의 시선이 쏠린다`);
      } else if (info.kind === 'support') {
        const down = this.units.find((f) => f.side === u.side && !f.alive && !f.summon && !f.fled);
        if (down) { down.alive = true; down.hp = Math.round(down.maxHp * 0.3); down.atb = 30; this.push(`${u.name}의 ${info.name}! ${down.name}이(가) 다시 일어섰다.`, 'heal', { k: 'heal', dst: down.id, amt: down.hp, hp: down.hp, revive: true }); }
        for (const f of this.friendsOf(u)) if (!f.summon) this.healUnit(f, f.maxHp * 0.3, null);
      } else if (info.kind === 'strike') {
        if (t) this.dealDamage(u, t, sk(3.5), { pierce: true, crit: 0.35 });
      } else {
        for (const f of foes) if (f.alive) this.dealDamage(u, f, sk(1.8));
      }
    } finally { this._inUlt = false; }
    if (u.isPlayer && this.game.player) this.game.player.ultCount = (this.game.player.ultCount || 0) + 1;
    this.checkEnd();
    return true;
  },
  playerUlt(targetId) {
    if (!this.waiting || this.result) return false;
    if (!this.useUlt(this.player, targetId)) return false;
    this.endPlayerTurn();
    return true;
  },
});

{
  const CP = Combat.prototype;
  // 게이지 충전: 기록되는 피해·쓰러짐을 보고 채운다
  const basePush = CP.push;
  CP.push = function (t, cls, ev) {
    const r = basePush.call(this, t, cls, ev);
    if (ev && !this._inUlt) {
      if (ev.k === 'dmg' && ev.amt > 0) {
        const src = ev.src && this.units.find((x) => x.id === ev.src);
        const dst = this.units.find((x) => x.id === ev.dst);
        const owner = src && src.summonOf ? this.units.find((x) => x.id === src.summonOf) : src;
        if (owner && owner.side === 'ally' && dst) this.ultAdd(owner, Math.min(10, 3 + 15 * ev.amt / Math.max(1, dst.maxHp)));
        if (dst && dst.side === 'ally') this.ultAdd(dst, Math.min(15, 2 + 25 * ev.amt / Math.max(1, dst.maxHp)));
      } else if (ev.k === 'down') {
        const d = this.units.find((x) => x.id === ev.dst);
        if (d && d.side === 'ally' && !d.summon) for (const f of this.allies()) if (f !== d) this.ultAdd(f, 20);
      }
    }
    return r;
  };
  // 동료: 차례에 가득 차 있으면 필살기
  const baseAi = CP.aiAct;
  CP.aiAct = function (u) {
    if (this.ultOk(u) && (!u.isPlayer || this.auto) && this.ultReady(u) && this.foesOf(u).length) {
      const k = ultKindOf(u);
      // 지원형은 누군가 다쳤거나 쓰러졌을 때, 방어형은 적이 둘 이상이거나 동료가 다쳤을 때
      const hurt = this.friendsOf(u).some((f) => !f.summon && f.hp < f.maxHp * 0.6) || this.units.some((f) => f.side === 'ally' && !f.alive && !f.summon && !f.fled);
      if ((k !== 'support' && k !== 'tank') || hurt || (k === 'tank' && this.foesOf(u).length >= 2)) { if (this.useUlt(u)) return; }
    }
    return baseAi.call(this, u);
  };
  // 자동 전투: 플레이어도 가득 차면 쓴다
  const baseAuto = CP.autoStep;
  CP.autoStep = function () {
    if (this.waiting && !this.result && this.ultReady(this.player) && this.foesOf(this.player).length) { if (this.playerUlt(null)) return; }
    return baseAuto.call(this);
  };
}

Object.assign(UI, {
  ultBtn() {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.ultInfo) return '';
    const p = cb.player; if (!p) return '';
    const v = Math.floor(p.ult || 0); const info = cb.ultInfo(p);
    const ready = cb.waiting && !c.playing && !cb.auto && cb.ultReady(p);
    return `<button class="skill-btn ult-btn ${cb.ultReady(p) ? 'go' : ''}" data-act="c-ult" ${ready ? '' : 'disabled'} title="${info.desc}">
      <span class="ult-ic">필</span><span><b>필살 · ${info.name}</b><span class="small dim">${p.ultUsed ? '이번 전투에서 이미 썼다' : cb.ultReady(p) ? info.desc : `필살 게이지 ${v}%`}</span></span></button>`;
  },
  drawUlt() {
    const c = this.ctx; const cb = c && c.combat; if (!cb || !cb.units || !cb.ultOk) return;
    for (const u of cb.units) {
      if (u.side !== 'ally' || u.summon) continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const host = el.querySelector('.fx-host'); if (!host) continue;
      let bar = host.querySelector('.ult-bar');
      if (!bar) { host.insertAdjacentHTML('beforeend', '<i class="ult-bar" aria-hidden="true"><b></b></i>'); bar = host.querySelector('.ult-bar'); }
      const v = Math.max(0, Math.min(100, u.ult || 0));
      bar.firstChild.style.width = v + '%';
      bar.classList.toggle('full', v >= ULT_MAX && u.alive);
      el.classList.toggle('ult-full', v >= ULT_MAX && u.alive);
    }
  },
});

{
  // B의 명령 메뉴를 감싼다: 스킬 목록 맨 위에 필살 버튼(게이지가 반 이상일 때부터 보인다)
  const baseMenu = UI.commandMenu;
  if (baseMenu) UI.commandMenu = function (...a) {
    const c = this.ctx; const cb = c && c.combat;
    const sb = document.querySelector('#cb-ctrl > .skill-btns');
    if (cb && !cb.result && sb && cb.player && (cb.player.ult || 0) >= ULT_MAX / 2) sb.insertAdjacentHTML('afterbegin', this.ultBtn());
    const r = baseMenu.apply(this, a);
    if (cb && !cb.result && cb.ultReady) {
      const on = cb.waiting && !c.playing && !cb.auto && cb.ultReady(cb.player);
      this.cmdBadge(document.querySelector('#cb-ctrl .cmd-main [data-v=skill]'), 'ult', on, '필');
    }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'c-ult') {
      const c = this.ctx; if (!c || !c.combat || c.playing) return;
      c.cmd = null; c.sel = null;
      return this.combatAction((x) => x.playerUlt(x.target ? x.target.id : null));
    }
    return baseHandle.call(this, act, v);
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) { const r = baseRefresh.apply(this, a); try { this.drawUlt(); } catch (e) { /* 무시 */ } return r; };
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && ev.k === 'ultfull') {
      const t = document.getElementById('u-' + ev.dst);
      if (t) { FX.pulse(t, 'glow', 600); FX.floatText(t.querySelector('.fx-host'), '필살!', 'skill'); }
      this.drawUlt(); return 260;
    }
    const w = baseApply.call(this, l);
    if (ev && ev.ult) { const st = document.getElementById('stage'); if (st) FX.pulse(st, 'quake', 420); return Math.max(w, 460); }
    return w;
  };
}
