// ===== 게이트 크로니클: 적 행동 예고 (영역 A-1, docs/전투_제안.md 1) =====
// 적의 게이지가 60%를 넘으면 다음 행동을 미리 정하고(u.next), 머리 위에 아이콘과 대상 얼굴을 띄운다.
// 예고는 정직하다: 차례가 오면 예고한 행동을 그대로 한다.
//  - 대상이 먼저 쓰러지면 그 자리에서 다시 정하고 예고도 바뀐다.
//  - 아군이 도발하면 단일 공격 예고의 대상이 도발한 사람으로 바뀐다.
// 화면을 더 차지하지 않도록 적 그림 위에 겹쳐 띄운다.

const INTENT_AT = 60;
const INTENT_KIND = {
  attack: { name: '공격', color: '#ff6b5a', svg: '<path d="M5 19 19 5M14 5h5v5M5 14l5 5"/>' },
  multi: { name: '연타', color: '#ff6b5a', svg: '<path d="M4 16 14 6M8 20l12-12M15 6h4v4"/>' },
  aoe: { name: '전체 공격', color: '#ff3d57', svg: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/>' },
  stun: { name: '기절 공격', color: '#ffb547', svg: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>' },
  debuff: { name: '약화', color: '#c58cff', svg: '<path d="M12 5v14M6 13l6 6 6-6"/>' },
  buff: { name: '강화', color: '#7be0a0', svg: '<path d="M12 19V5M6 11l6-6 6 6"/>' },
  heal: { name: '회복', color: '#7be0a0', svg: '<path d="M12 5v14M5 12h14"/>' },
  summon: { name: '소환', color: '#c58cff', svg: '<circle cx="12" cy="9" r="4"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6"/>' },
  guard: { name: '방어', color: '#8cc4ff', svg: '<path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6z"/>' },
};
function intentKind(sk) {
  if (!sk) return 'attack';
  switch (sk.type) {
    case 'aoe': return 'aoe';
    case 'multi': return 'multi';
    case 'stun': return 'stun';
    case 'debuff': return 'debuff';
    case 'buff': case 'buff_all': return 'buff';
    case 'shield': case 'shield_all': case 'taunt': case 'evade': return 'guard';
    case 'heal': case 'heal_ally': case 'heal_all': case 'revive': return 'heal';
    case 'summon': return 'summon';
    default: return 'attack';
  }
}
const intentNeedsTarget = (sk) => sk && SKILL_AIM[sk.type] === 'enemy';

Object.assign(Combat.prototype, {
  // AI가 하려는 일을 실제로 하지 않고 미리 정해 둔다
  planIntent(u) {
    let cap = null;
    this.useSkill = (uu, sk, t) => { cap = { skill: sk.id, target: t ? t.id : null }; };
    const saveLog = this.log.length;
    try { this.aiActRaw(u); } catch (e) { cap = null; } finally { delete this.useSkill; this.log.length = saveLog; }
    u.next = cap || { skill: 'strike', target: (this.pickTarget(u) || {}).id || null };
    return u.next;
  },
  // 지금 예고가 가리키는 대상 (도발이 걸리면 도발한 사람)
  intentTarget(u) {
    const n = u.next; if (!n) return null;
    const sk = skillById(n.skill);
    if (!intentNeedsTarget(sk)) return null;
    const foes = this.foesOf(u);
    const taunter = foes.find((f) => f.tauntT > 0);
    if (taunter) return taunter;
    let t = n.target && this.units.find((x) => x.id === n.target && x.alive);
    if (!t) { this.planIntent(u); t = u.next.target && this.units.find((x) => x.id === u.next.target && x.alive); }
    return t || null;
  },
});

{
  // 원래 판단 함수 (예고 계획에 쓴다)
  Combat.prototype.aiActRaw = Combat.prototype.aiAct;
  const baseAi = Combat.prototype.aiAct;
  Combat.prototype.aiAct = function (u) {
    if (u.side !== 'enemy') return baseAi.call(this, u);
    if (!u.next) this.planIntent(u);
    const n = u.next; u.next = null;
    let sk = skillById(n.skill);
    if (!sk || sk.mp > u.mp) sk = skillById('strike');
    let t = null;
    if (intentNeedsTarget(sk)) { u.next = n; t = this.intentTarget(u); u.next = null; if (!t) t = this.pickTarget(u); }
    else if (SKILL_AIM[sk.type] === 'ally') t = n.target && this.units.find((x) => x.id === n.target && x.alive);
    return this.useSkill(u, sk, t);
  };
  // 게이지가 60%를 넘는 순간 행동을 정한다
  const baseTick = Combat.prototype.tick;
  Combat.prototype.tick = function (dt) {
    const r = baseTick.call(this, dt);
    for (const u of this.units) if (u.side === 'enemy' && u.alive && !u.next && u.atb >= INTENT_AT && !this.result) this.planIntent(u);
    return r;
  };
}

Object.assign(UI, {
  // 적 그림 위 예고 표시
  drawIntents() {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    const cb = c.combat;
    for (const u of cb.units) {
      if (u.side !== 'enemy') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const host = el.querySelector('.fx-host') || el;
      let tag = host.querySelector('.intent');
      if (!u.alive || !u.next || cb.result) { if (tag) tag.remove(); continue; }
      const sk = skillById(u.next.skill); const kind = intentKind(sk); const K = INTENT_KIND[kind];
      const t = cb.intentTarget(u);
      const key = kind + '|' + (t ? t.id : '') + '|' + (sk ? sk.id : '');
      if (tag && tag._key === key) continue;
      if (!tag) { host.insertAdjacentHTML('beforeend', '<span class="intent"></span>'); tag = host.querySelector('.intent'); }
      tag._key = key;
      tag.style.setProperty('--ic', K.color);
      tag.title = `다음 행동: ${sk && sk.id !== 'strike' ? sk.name : K.name}${t ? ' → ' + t.name : ''}`;
      tag.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${K.svg}</svg>${t ? `<span class="intent-face">${this.unitSprite(t, 18)}</span>` : kind === 'aoe' ? '<b>전체</b>' : ''}`;
    }
    // 노려지는 아군 표시
    const aimed = new Set(cb.units.filter((u) => u.side === 'enemy' && u.alive && u.next).map((u) => (cb.intentTarget(u) || {}).id).filter(Boolean));
    for (const u of cb.units) {
      if (u.side !== 'ally') continue;
      const el = document.getElementById('u-' + u.id); if (el) el.classList.toggle('threatened', aimed.has(u.id) && !cb.result);
    }
  },
});

{
  const baseGauges = UI.drawGauges;
  UI.drawGauges = function () { const r = baseGauges.call(this); try { this.drawIntents(); } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ } return r; };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () { const r = baseRefresh.call(this); try { this.drawIntents(); } catch (e) { /* 무시 */ } return r; };
}
