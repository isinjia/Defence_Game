// ===== 게이트 크로니클: 약점 파괴(그로기) (영역 A-β, docs/전투_제안.md 2) =====
// 적마다 "균열" 칸이 있다(일반 2~3, 보스 5~8). 아군이 상성 우위 속성으로 맞히거나 관통·연타·기절 유형으로 때리거나 치명타를 내면 칸이 깎인다.
// 칸이 다 깎이면 그로기: 게이지가 0으로 떨어지고 다음 행동 1회를 건너뛰며, 그동안 받는 피해 +50%, 예고 중인 행동(보스 큰 기술 포함)이 취소된다.
// 그로기에서 깨어나면 균열이 다시 다 찬다.
// 화면: 적 체력바 바로 아래 얇은 칸 줄(높이를 더하지 않게 2px). 그로기면 금빛으로 빛나고 그림이 휘청인다.
// 다른 시스템이 쓸 수 있는 함수: cb.crackUnit(u, n, by) — 칸 n개 깎기(속성 상태 이상 '균열' 등), cb.breakUnit(u, by) — 그로기 처리(보스 패턴이 감싼다).

const BREAK_TYPES = { pierce: 1, multi: 1, stun: 1 }; // 칸을 깎는 스킬 유형
const BREAK_DMG_MULT = 1.5;

function breakMax(u) {
  if (u.boss) return Math.min(8, 5 + Math.floor((u.tier || 0) / 2));
  return (u.tier || 0) >= 4 ? 3 : 2 + (Math.random() < 0.35 ? 1 : 0);
}

Object.assign(Combat.prototype, {
  // 칸 n개를 깎는다. 다 깎이면 그로기.
  crackUnit(u, n, by) {
    const b = u && u.brk; if (!b || !u.alive || b.groggy || n <= 0) return false;
    b.cur = Math.max(0, b.cur - n);
    if (by) { const k = by.summonOf || by.id; (this.breakHits ||= {})[k] = (this.breakHits[k] || 0) + n; }
    this.log.push({ t: '', cls: '', ev: { k: 'crack', dst: u.id, cur: b.cur, max: b.max } });
    if (b.cur <= 0) this.breakUnit(u, by);
    return true;
  },
  // 그로기: 다음 행동 1회를 건너뛰고 받는 피해 +50%, 예고 취소
  breakUnit(u, by) {
    const b = u.brk; if (!b) return;
    b.groggy = true; b.count = (b.count || 0) + 1;
    u.atb = 0; u.next = null;
    u.stun = Math.max(u.stun || 0, 1);
    if (by) { const k = by.summonOf || by.id; (this.breakBy ||= {})[k] = (this.breakBy[k] || 0) + 1; }
    this.push(`${u.name}의 약점이 무너졌다! 그로기!`, 'good', { k: 'break', dst: u.id, src: by ? by.id : null });
  },
  // 그로기에서 깨어난다
  breakRecover(u) {
    const b = u.brk; if (!b || !b.groggy) return;
    b.groggy = false; b.cur = b.max;
    this.push(`${u.name}이(가) 자세를 바로잡았다.`, '', { k: 'brk_up', dst: u.id, cur: b.cur, max: b.max });
  },
  // 이 공격이 칸을 몇 개 깎는가
  breakPower(att, def, skill, crit) {
    if (!skill || !def.brk) return 0;
    let n = crit ? 1 : 0; // 치명타는 급소를 찌른 것
    const e = skill.elem === 'self' ? att.elem : skill.elem;
    if (e && def.elem && elemMult(e, def.elem) > 1) n++;
    if (BREAK_TYPES[skill.type]) n++;
    return n;
  },
});

{
  const basePrep = Combat.prototype.prep;
  Combat.prototype.prep = function (u) {
    const r = basePrep.call(this, u);
    if (r.side === 'enemy' && !r.summon && r.hp > 0) { const m = breakMax(r); r.brk = { max: m, cur: m, groggy: false }; }
    return r;
  };

  const baseCalc = Combat.prototype.calcDamage;
  Combat.prototype.calcDamage = function (att, def, skill, opt) {
    const r = baseCalc.call(this, att, def, skill, opt);
    if (def.brk && def.brk.groggy) { r.dmg = Math.max(1, Math.round(r.dmg * BREAK_DMG_MULT)); r.note = (r.note || '') + ' 약점 노출!'; }
    return r;
  };

  const baseDeal = Combat.prototype.dealDamage;
  Combat.prototype.dealDamage = function (att, def, skill, opt) {
    const from = this.log.length;
    const d = baseDeal.call(this, att, def, skill, opt);
    // 감싸기로 대상이 바뀌어도 적 쪽은 그대로다. 피한 공격(0)은 깎지 않는다.
    if (d > 0 && att.side === 'ally' && def.side === 'enemy' && def.alive) {
      let crit = false; for (let i = from; i < this.log.length; i++) { const e = this.log[i].ev; if (e && e.k === 'dmg' && e.dst === def.id && e.crit) crit = true; }
      const n = this.breakPower(att, def, skill, crit);
      if (n) this.crackUnit(def, n, att);
    }
    return d;
  };

  const baseTurn = Combat.prototype.takeTurn;
  Combat.prototype.takeTurn = function (u) {
    const groggy = u.brk && u.brk.groggy;
    if (groggy) u.stun = Math.max(u.stun || 0, 1);
    const from = this.log.length;
    const r = baseTurn.call(this, u);
    if (groggy) {
      // 기절 문구를 그로기 문구로 바꾼다
      for (let i = from; i < this.log.length; i++) { const l = this.log[i]; if (l.ev && l.ev.k === 'note' && l.ev.dst === u.id && /기절/.test(l.t)) l.t = fixJosa(`${u.name}은(는) 그로기 상태라 움직이지 못한다.`); }
      if (u.alive) this.breakRecover(u);
      else u.brk.groggy = false;
    }
    return r;
  };

  // 그로기 중엔 행동을 예고하지 않는다 (다음 행동은 건너뛰니까 — 예고는 정직하게)
  if (Combat.prototype.planIntent) {
    const basePlan = Combat.prototype.planIntent;
    Combat.prototype.planIntent = function (u) {
      if (u.brk && u.brk.groggy) { u.next = null; return null; }
      return basePlan.call(this, u);
    };
  }

  // 동료는 그로기 난 적을 몰아친다 (탐욕은 막타, 그 밖엔 대부분 그로기 대상)
  const basePick = Combat.prototype.pickTarget;
  Combat.prototype.pickTarget = function (u) {
    if (u.side === 'ally' && !u.isPlayer && u.pers !== 'greedy') {
      const g = this.foesOf(u).filter((f) => f.brk && f.brk.groggy);
      if (g.length && Math.random() < 0.7) return g.reduce((a, b) => (a.hp < b.hp ? a : b));
    }
    return basePick.call(this, u);
  };
}

// ---------- 화면 ----------
Object.assign(UI, {
  // 체력바 바로 아래 얇은 칸 줄 (연출 진행에 맞춘 표시 상태 c.dispBrk)
  drawBreaks() {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    const cb = c.combat; c.dispBrk ||= {};
    for (const u of cb.units) {
      if (u.side !== 'enemy' || !u.brk) continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const d = c.dispBrk[u.id] || (c.dispBrk[u.id] = { cur: u.brk.cur, groggy: u.brk.groggy });
      let row = el.querySelector('.brk');
      if (!row) {
        const hp = el.querySelector('.bar.hp'); if (!hp) continue;
        hp.insertAdjacentHTML('afterend', `<div class="brk" title="약점 균열: 상성 우위 속성이나 관통·연타·기절 공격, 치명타로 깎는다">${'<i></i>'.repeat(u.brk.max)}</div>`);
        row = el.querySelector('.brk');
      }
      // 그로기로 생긴 기절 표시는 겹치니 숨긴다
      if (d.groggy) el.querySelectorAll('.status .tag').forEach((t) => { if (t.textContent === '기절') t.remove(); });
      const key = d.cur + '|' + d.groggy + '|' + u.alive;
      if (row._key === key) continue;
      row._key = key;
      row.querySelectorAll('i').forEach((p, i) => p.classList.toggle('on', i < d.cur));
      const host = el.querySelector('.fx-host');
      if (host && !host.querySelector('.grg-tag')) host.insertAdjacentHTML('beforeend', '<span class="grg-tag">그로기</span>');
      el.classList.toggle('groggy', !!d.groggy && u.alive);
    }
  },
});

{
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev; const c = this.ctx;
    if (ev && c && (ev.k === 'crack' || ev.k === 'break' || ev.k === 'brk_up')) {
      c.dispBrk ||= {};
      const d = c.dispBrk[ev.dst] || (c.dispBrk[ev.dst] = { cur: 0, groggy: false });
      if (ev.k === 'crack') d.cur = ev.cur;
      if (ev.k === 'break') { d.cur = 0; d.groggy = true; }
      if (ev.k === 'brk_up') { d.cur = ev.cur; d.groggy = false; }
      this.appendLog(l);
      const el = document.getElementById('u-' + ev.dst);
      try { this.drawBreaks(); } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ }
      if (ev.k === 'crack') { if (el) { const r = el.querySelector('.brk'); if (r) FX.pulse(r, 'brk-hit', 300); } return 40; }
      if (ev.k === 'break') {
        if (el) { FX.floatText(el.querySelector('.fx-host'), '그로기!', 'crit'); FX.burst(el.querySelector('.fx-host'), '#ffd166', 18); }
        const st = document.getElementById('stage'); if (st) FX.pulse(st, 'quake', 380);
        try { if (typeof SFX !== 'undefined' && SFX.play) SFX.play('crit'); } catch (e) { /* 무시 */ }
        return 520;
      }
      return 200;
    }
    return baseApply.call(this, l);
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () { const r = baseRefresh.call(this); try { this.drawBreaks(); } catch (e) { /* 무시 */ } return r; };
  const baseAfter = UI.afterPlay;
  UI.afterPlay = function () {
    const c = this.ctx;
    if (c && c.combat) { c.dispBrk ||= {}; for (const u of c.combat.units) if (u.brk) c.dispBrk[u.id] = { cur: u.brk.cur, groggy: u.brk.groggy }; }
    return baseAfter.call(this);
  };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { if (this.ctx) this.ctx.dispBrk = {}; return baseOpen.apply(this, a); };

  // 기여도: 그로기를 만든 사람에게 몫을 준다 (연합 레이드 분배에도 쓰인다)
  const baseStats = UI.combatStats;
  if (baseStats) UI.combatStats = function (cb) {
    const list = baseStats.call(this, cb);
    for (const s of list) {
      const u = s.unit; const power = Math.max(1, u.atk * 1.2 + u.def + u.maxHp / 8);
      s.breaks = (cb.breakBy || {})[u.id] || 0;
      s.cracks = (cb.breakHits || {})[u.id] || 0;
      if (s.cracks) { s.abs = (s.abs || 0) + s.cracks * 6 + s.breaks * 20; s.score = Math.round((s.abs / power) * 100); }
    }
    return list.sort((a, b) => b.score - a.score);
  };
}
