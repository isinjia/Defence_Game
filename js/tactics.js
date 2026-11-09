// ===== 게이트 크로니클: 동료 작전 지시 (영역 A-2, docs/전투_제안.md 6) =====
// 리더 오더(한 사람에게 하나의 행동)와 함께 쓰는 파티 전체의 방침.
// 균형 / 집중 공격(내가 고른 적) / 생존 우선(치유·방어 먼저) / 정신력 아끼기.
// 리더가 플레이어면 전투 머리 도구 줄의 작전 버튼으로 돌려 가며 바꾼다. NPC 리더는 성격대로 정한다.
// 동료는 성격에 따라 작전을 잘 따르거나 무시한다(호전은 생존 우선을 잘 안 따르고, 의협은 잘 따른다).
// 개별 오더가 있으면 오더가 먼저다.

const TACTICS = {
  balance: { name: '균형', short: '균형', desc: '각자 판단대로 싸운다.' },
  focus: { name: '집중 공격', short: '집중', desc: '내가 고른 적을 다 같이 노린다.' },
  survive: { name: '생존 우선', short: '생존', desc: '다친 사람이 있으면 치유·방어부터.' },
  conserve: { name: '정신력 아끼기', short: '절약', desc: '급하지 않으면 기본 공격으로 버틴다.' },
};
const TACTIC_ORDER = ['balance', 'focus', 'survive', 'conserve'];
// 성격별로 작전을 따를 확률
const TACTIC_OBEY = {
  focus: { just: 0.95, kind: 0.9, cold: 0.9, warlike: 0.75, greedy: 0.55 },
  survive: { just: 0.95, kind: 0.97, cold: 0.85, warlike: 0.35, greedy: 0.8 },
  conserve: { just: 0.85, kind: 0.85, cold: 0.95, warlike: 0.3, greedy: 0.6 },
};
// NPC 리더가 고르는 작전
const LEAD_TACTIC = { just: 'survive', kind: 'survive', cold: 'focus', warlike: 'focus', greedy: 'conserve' };
const TACTIC_REPLY = {
  focus: { just: '알았어, 하나씩 확실히.', kind: '네, 같이 노려요!', cold: '효율적이군.', warlike: '좋아, 부숴 버리자!', greedy: '막타는 내 거다.' },
  survive: { just: '다들 무리하지 마.', kind: '다친 사람 먼저 챙길게요.', cold: '…알겠다.', warlike: '쳇, 몸 사리라고?', greedy: '그래, 목숨이 먼저지.' },
  conserve: { just: '아껴 두자. 길게 간다.', kind: '알겠어요, 아껴 쓸게요.', cold: '합리적이다.', warlike: '시시하게 싸우라고?', greedy: '정신력도 돈이지.' },
  balance: { just: '각자 판단대로.', kind: '평소대로 할게요.', cold: '…', warlike: '마음대로 해도 되지?', greedy: '알아서 하지.' },
};

Object.assign(Combat.prototype, {
  // 가장 위험한 적: 다친 동료나 후열을 노린다고 예고한 적
  threatFoe() {
    if (!this.intentTarget) return null;
    let best = null, score = 0;
    for (const e of this.enemies()) {
      if (!e.next) continue;
      const t = this.intentTarget(e); if (!t || t.side !== 'ally') continue;
      const sc = (1 - t.hp / t.maxHp) * 2 + (t.row === 'back' ? 0.6 : 0) + (e.boss ? 0.4 : 0);
      if (sc > score) { score = sc; best = e; }
    }
    return score >= 0.5 ? best : null;
  },
  tacticObeys(u) {
    const t = this.tactic || 'balance'; if (t === 'balance') return false;
    return Math.random() < ((TACTIC_OBEY[t] || {})[u.pers] ?? 0.8);
  },
});

{
  // 집중 공격: 내가 고른 적(조준 대상)을 함께 노린다
  const basePick = Combat.prototype.pickTarget;
  Combat.prototype.pickTarget = function (u) {
    if (u.side === 'ally' && !u.isPlayer && this.tactic === 'focus' && this.target && this.target.alive && this.tacticObeys(u)) return this.target;
    // 생존 우선: 다친 동료나 후열을 노리는 적(행동 예고)을 먼저 친다
    if (u.side === 'ally' && !u.isPlayer && this.tactic === 'survive' && this.tacticObeys(u)) { const th = this.threatFoe(); if (th) return th; }
    return basePick.call(this, u);
  };
  // 생존 우선·정신력 아끼기
  const baseAi = Combat.prototype.aiAct;
  Combat.prototype.aiAct = function (u) {
    const t = this.tactic || 'balance';
    // NPC 리더의 개별 오더가 먼저 (오더를 받으면 오더 처리로 넘긴다)
    if (u.side === 'ally' && !u.isPlayer && !u.summon && !u.order && this.leaderOrders) this.leaderOrders(u);
    if (u.side !== 'ally' || u.isPlayer || u.summon || u.order || t === 'balance' || t === 'focus') return baseAi.call(this, u);
    if (!this.tacticObeys(u)) return baseAi.call(this, u);
    const sk = u.skills.map(skillById).filter((s) => s && s.mp <= u.mp);
    const of = (types) => sk.filter((s) => types.includes(s.type)).sort((a, b) => b.power - a.power)[0];
    const friends = this.friendsOf(u).filter((f) => !f.summon);
    const weak = friends.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), friends[0]);
    if (t === 'survive') {
      if (this.units.some((f) => f.side === u.side && !f.alive && !f.summon) && of(['revive'])) return this.useSkill(u, of(['revive']), null);
      if (friends.filter((f) => f.hp < f.maxHp * 0.7).length >= 2 && of(['heal_all'])) return this.useSkill(u, of(['heal_all']), null);
      if (weak && weak.hp < weak.maxHp * 0.7 && of(['heal_ally'])) return this.useSkill(u, of(['heal_ally']), weak);
      if (u.hp < u.maxHp * 0.6 && of(['heal'])) return this.useSkill(u, of(['heal']), null);
      // 탱커: 적이 다른 사람을 노린다고 예고하면 도발로 끌어온다
      if (of(['taunt']) && !u.tauntT && this.enemies().some((e) => e.next && this.intentTarget(e) && this.intentTarget(e) !== u)) return this.useSkill(u, of(['taunt']), null);
      if (friends.some((f) => f.hp < f.maxHp * 0.6) && of(['shield_all']) && !friends.some((f) => f.buffs.defT)) return this.useSkill(u, of(['shield_all']), null);
      return baseAi.call(this, u);
    }
    if (t === 'conserve') {
      // 위급하면 아끼지 않는다
      if (weak && weak.hp < weak.maxHp * 0.35) return baseAi.call(this, u);
      if (u.mp < u.maxMp * 0.9 || Math.random() < 0.7) return this.useSkill(u, skillById('strike'), this.pickTarget(u));
      return baseAi.call(this, u);
    }
    return baseAi.call(this, u);
  };
}

Object.assign(UI, {
  canSetTactic() { const c = this.ctx; return !!(c && c.combat && c.combat.units && (!c.combat.leaderId || c.combat.leaderId === 'player')); },
  setTactic(t) {
    const c = this.ctx; if (!c || !c.combat || !TACTICS[t]) return;
    const cb = c.combat; cb.tactic = t; G.player.tactic = t;
    // 동료 한 명이 대답한다
    const mates = cb.units.filter((u) => u.side === 'ally' && !u.isPlayer && !u.summon && u.alive && u.pers);
    const m = mates[Math.floor(Math.random() * mates.length)];
    if (m) { const line = (TACTIC_REPLY[t] || {})[m.pers]; if (line) { const el = document.getElementById('u-' + m.id); if (el && FX.floatText) FX.floatText(el.querySelector('.fx-host') || el, line, 'say'); } }
    this.toast(`작전: ${TACTICS[t].name} — ${TACTICS[t].desc}`);
    this.drawTacticBtn();
  },
  drawTacticBtn() {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    const tools = document.querySelector('#modal-box .cb-head .cb-tools'); if (!tools) return;
    let b = tools.querySelector('[data-act=c-tactic]');
    if (c.combat.result) { if (b) b.remove(); return; }
    const t = c.combat.tactic || 'balance'; const mine = this.canSetTactic();
    if (!b) { tools.insertAdjacentHTML('afterbegin', '<button class="icon-btn tactic-btn" data-act="c-tactic"></button>'); b = tools.querySelector('[data-act=c-tactic]'); }
    b.innerHTML = `<span class="tac-k">작전</span><b>${TACTICS[t].short}</b>`;
    b.classList.toggle('on', t !== 'balance'); b.classList.toggle('locked', !mine);
    b.title = mine ? `작전: ${TACTICS[t].name} (눌러서 바꾸기)` : `리더의 작전: ${TACTICS[t].name}`;
  },
});

{
  // 전투 시작: 리더가 작전을 정한다 (플레이어 리더면 지난번 작전 유지)
  const baseOpen = UI.openCombat;
  UI.openCombat = function () {
    baseOpen.call(this);
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    const cb = c.combat;
    if (!cb.tactic) {
      const L = cb.leader ? cb.leader() : null;
      cb.tactic = L && !L.isPlayer ? (LEAD_TACTIC[L.pers] || 'balance') : (G.player.tactic || 'balance');
    }
    this.drawTacticBtn();
  };
  const baseMenu = UI.commandMenu;
  if (baseMenu) UI.commandMenu = function (...a) { const r = baseMenu.apply(this, a); this.drawTacticBtn(); return r; };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) { const r = baseControls.apply(this, a); this.drawTacticBtn(); return r; };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'c-tactic') {
      const c = this.ctx; if (!c || !c.combat) return;
      if (!this.canSetTactic()) { const L = c.combat.leader(); return this.toast(`리더 ${L ? L.name.replace(/\(.*\)$/, '') : ''}의 작전: ${TACTICS[c.combat.tactic || 'balance'].name}`); }
      const i = TACTIC_ORDER.indexOf(c.combat.tactic || 'balance');
      return this.setTactic(TACTIC_ORDER[(i + 1) % TACTIC_ORDER.length]);
    }
    return baseHandle.call(this, act, v);
  };
}
