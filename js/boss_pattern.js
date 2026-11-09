// ===== 게이트 크로니클: 보스 패턴·광폭화 (영역 A-β, docs/헌터물_제안2.md 2) =====
// 보스가 체력 60%·30%를 넘으면 속성별 표에 따라 패턴 하나를 발동한다.
//  - 광폭: 공격 +30%, 속도 +25% (남은 전투 내내)
//  - 호출: 부하 둘을 부른다
//  - 장막: 최대 체력 15%만큼 피해를 흡수하는 보호막
//  (1~2인 파티면 광폭 +15%·+12%, 부하 하나, 장막 10%, 차지 피해 ×0.75)
//  - 차지: "기를 모은다" — 다음 행동이 강한 전체기. 행동 예고(js/intent.js u.next)의 강화판으로 띄우고, 예고한 그대로 쓴다.
//    방어·도발·치유로 버티거나, 약점을 깨서(그로기, js/break_gauge.js) 취소시킬 수 있다.
// 보스는 체력과 상관없이 처음 모은 기술 뒤로 8번째 행동마다 다시 기를 모은다(30% 아래에선 6번째마다).

const BOSS_CHARGE = {
  fire: { id: 'boss_c_fire', name: '업화 폭발', elem: 'fire' },
  bolt: { id: 'boss_c_bolt', name: '천둥 낙뢰', elem: 'bolt' },
  water: { id: 'boss_c_water', name: '대해일', elem: 'water' },
  wood: { id: 'boss_c_wood', name: '가시 숲 폭주', elem: 'wood' },
  holy: { id: 'boss_c_holy', name: '심판의 빛', elem: 'holy' },
  dark: { id: 'boss_c_dark', name: '암흑 붕괴', elem: 'dark' },
  none: { id: 'boss_c_none', name: '파멸의 일격', elem: null },
};
const BOSS_CHARGE_POWER = 1.7;
const BOSS_SKILLS = {};
for (const k of Object.keys(BOSS_CHARGE)) { const c = BOSS_CHARGE[k]; BOSS_SKILLS[c.id] = { id: c.id, name: c.name, elem: c.elem, rankReq: 99, power: BOSS_CHARGE_POWER, mp: 0, type: 'aoe', price: 0, desc: '보스가 기를 모아 쓰는 전체기.', boss: true }; }
{
  // 보스 전용 기술도 skillById로 찾을 수 있게 (SKILLS 목록에는 넣지 않아 상점·습득에 섞이지 않는다)
  const baseSkillById = skillById;
  // eslint-disable-next-line no-global-assign
  skillById = function (id) { return BOSS_SKILLS[id] || baseSkillById(id); };
}

// 속성별 패턴 표: [60% 때, 30% 때]
const BOSS_PHASES = {
  fire: ['charge', 'enrage'],
  bolt: ['enrage', 'charge'],
  water: ['veil', 'charge'],
  wood: ['call', 'veil'],
  holy: ['veil', 'charge'],
  dark: ['call', 'charge'],
  none: ['enrage', 'charge'],
};
const BOSS_PHASE_INFO = {
  enrage: { name: '광폭화', line: (u) => `${u.name}이(가) 포효하며 광폭화했다! 공격·속도 상승` },
  call: { name: '부하 호출', line: (u) => `${u.name}이(가) 부하를 불러냈다!` },
  veil: { name: '장막', line: (u) => `${u.name}이(가) 에테르 장막을 둘렀다!` },
  charge: { name: '차지', line: (u, sk) => `${u.name}이(가) 기를 모은다… 다음은 ${sk.name}!` },
};
const BOSS_CALL_NAME = { fire: '불씨 새끼', bolt: '전격 새끼', water: '물방울 새끼', wood: '덩굴 새끼', holy: '빛 조각', dark: '그림자 새끼' };

Object.assign(Combat.prototype, {
  // 1~2인 파티: 패턴을 약하게 (혼자 보스를 상대할 때 지나치게 가혹하지 않게)
  bossSmall() { return this.units.filter((f) => f.side === 'ally' && !f.summon).length <= 2; },
  bossChargeSkill(u) { return BOSS_SKILLS[(BOSS_CHARGE[u.elem] || BOSS_CHARGE.none).id]; },
  // 기를 모은다: 다음 행동을 강한 전체기로 정하고 예고한다
  bossCharge(u) {
    if (!u.alive) return false;
    if (u.brk && u.brk.groggy) { u.bp.pending = true; return false; } // 그로기에서 깨어나면 모은다
    const sk = this.bossChargeSkill(u);
    u.next = { skill: sk.id, target: null, charge: true };
    u.atb = Math.min(u.atb, 45); // 대응할 틈을 준다
    u.bp.lastCharge = u.bp.acts; u.bp.pending = false;
    this.push(BOSS_PHASE_INFO.charge.line(u, sk), 'bad', { k: 'phase', dst: u.id, kind: 'charge', name: sk.name });
    return true;
  },
  bossPhase(u, kind) {
    const P = BOSS_PHASE_INFO[kind]; if (!P) return;
    u.bp.used.push(kind);
    if (kind === 'charge') { this.bossCharge(u); return; }
    const small = this.bossSmall();
    if (kind === 'enrage') { u.enraged = true; u.atk = Math.round(u.atk * (small ? 1.15 : 1.3)); u.spd = Math.round(u.spd * (small ? 1.12 : 1.25)); }
    if (kind === 'veil') u.veil = Math.round(u.maxHp * (small ? 0.1 : 0.15));
    this.push(P.line(u), 'bad', { k: 'phase', dst: u.id, kind });
    if (kind === 'call') this.bossCall(u);
  },
  bossCall(u) {
    const G0 = this.game; if (!G0 || !G0.makeMonster) return;
    const now = this.units.filter((f) => f.alive && f.summonOf === u.id).length;
    for (let i = 0; i < (this.bossSmall() ? 1 : 2) - now; i++) {
      const m = G0.makeMonster(Math.max(0, (u.tier || 0) - 1), false, u.elem);
      const hp = Math.round(m.hp * 0.55);
      Object.assign(m, { id: `${u.id}_c${Math.random().toString(36).slice(2, 6)}`, name: BOSS_CALL_NAME[u.elem] || '부하', hp, maxHp: hp, summon: true, summonOf: u.id, elem: u.elem });
      const su = this.prep(m); su.atb = Math.random() * 30; this.units.push(su);
      this.push(`${su.name}이(가) 나타났다!`, 'bad', { k: 'summon', dst: su.id, src: u.id });
    }
  },
  // 체력 구간 확인
  bossCheck(u) {
    if (!u || !u.bp || !u.alive || this.result) return;
    const r = u.hp / u.maxHp;
    const T = [0.6, 0.3];
    while (u.bp.phase < T.length && r <= T[u.bp.phase]) {
      const kind = (BOSS_PHASES[u.elem] || BOSS_PHASES.none)[u.bp.phase];
      u.bp.phase++;
      this.bossPhase(u, kind);
    }
  },
});

{
  const basePrep = Combat.prototype.prep;
  Combat.prototype.prep = function (u) {
    const r = basePrep.call(this, u);
    if (r.side === 'enemy' && r.boss && !r.summon && r.hp > 0) r.bp = { phase: 0, used: [], acts: 0, lastCharge: null };
    return r;
  };

  // 장막: 받는 피해를 먼저 흡수한다
  const baseCalc = Combat.prototype.calcDamage;
  Combat.prototype.calcDamage = function (att, def, skill, opt) {
    const r = baseCalc.call(this, att, def, skill, opt);
    if (skill && skill.boss && this.bossSmall()) r.dmg = Math.max(1, Math.round(r.dmg * 0.75));
    if (def.veil > 0) {
      const a = Math.min(def.veil, Math.max(0, r.dmg - 1));
      def.veil -= a; r.dmg -= a;
      r.note = (r.note || '') + (def.veil > 0 ? ` 장막(${a} 흡수)` : ` 장막 붕괴!`);
    }
    return r;
  };

  const baseDeal = Combat.prototype.dealDamage;
  Combat.prototype.dealDamage = function (att, def, skill, opt) {
    const d = baseDeal.call(this, att, def, skill, opt);
    if (def.bp) this.bossCheck(def);
    return d;
  };

  const baseTurn = Combat.prototype.takeTurn;
  Combat.prototype.takeTurn = function (u) {
    if (u.bp) u.bp.acts++;
    const r = baseTurn.call(this, u);
    if (u.bp && u.alive) {
      this.bossCheck(u); // 중독 피해 등으로 구간을 넘었을 때
      // 주기적으로 다시 기를 모은다
      const every = u.bp.phase >= 2 ? 6 : 8;
      if (u.bp.pending && !(u.brk && u.brk.groggy) && !this.result) this.bossCharge(u);
      else if (u.bp.lastCharge != null && !u.next && u.bp.acts - u.bp.lastCharge >= every && !this.result) this.bossCharge(u);
    }
    return r;
  };

  // 그로기가 차지를 끊는다
  const baseBreak = Combat.prototype.breakUnit;
  if (baseBreak) Combat.prototype.breakUnit = function (u, by) {
    const charging = u.next && u.next.charge ? u.next : null;
    const r = baseBreak.call(this, u, by);
    if (charging) { const sk = skillById(charging.skill); this.push(`${u.name}의 ${sk ? sk.name : '큰 기술'}이(가) 끊겼다!`, 'good', { k: 'phase', dst: u.id, kind: 'cancel' }); }
    return r;
  };
}

// ---------- 화면 ----------
{
  // 차지 예고는 일반 예고보다 크고 빛나게, 기술 이름까지
  const baseIntents = UI.drawIntents;
  UI.drawIntents = function () {
    const r = baseIntents.call(this);
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return r;
    for (const u of c.combat.units) {
      if (u.side !== 'enemy') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      el.classList.toggle('enraged', !!u.enraged && u.alive);
      const tag = el.querySelector('.intent'); if (!tag) continue;
      const ch = !!(u.next && u.next.charge);
      tag.classList.toggle('charge', ch);
      if (ch && !tag.querySelector('.ch-name')) { const sk = skillById(u.next.skill); tag.insertAdjacentHTML('beforeend', `<b class="ch-name">${sk ? sk.name : '차지'}</b>`); tag.title = `기를 모은다: 다음 행동 ${sk ? sk.name : ''} (전체 공격) · 방어·도발·치유로 대비하거나 약점을 깨서 끊자`; }
    }
    return r;
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () {
    const r = baseRefresh.call(this);
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return r;
    for (const u of c.combat.units) {
      if (!u.bp) continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      const st = el.querySelector('.status');
      if (st) st.insertAdjacentHTML('beforeend', [u.enraged ? '<span class="tag tiny bad">광폭</span>' : '', u.veil > 0 ? `<span class="tag tiny" style="color:#8cc4ff">장막 ${u.veil}</span>` : ''].join(''));
      el.classList.toggle('veiled', u.veil > 0 && u.alive);
    }
    return r;
  };
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && ev.k === 'phase') {
      this.appendLog(l);
      const el = document.getElementById('u-' + ev.dst);
      const host = el && el.querySelector('.fx-host');
      const txt = ev.kind === 'charge' ? '기를 모은다!' : ev.kind === 'cancel' ? '끊었다!' : (BOSS_PHASE_INFO[ev.kind] || {}).name || '';
      if (host) { FX.floatText(host, txt, ev.kind === 'cancel' ? 'crit' : 'skill'); FX.burst(host, ev.kind === 'cancel' ? '#ffd166' : '#ff4f6a', 14); }
      const st = document.getElementById('stage');
      if (st && ev.kind !== 'cancel') { st.style.setProperty('--fc', '#ff4f6a'); FX.pulse(st, 'flash', 500); FX.pulse(st, 'quake', 380); }
      try { this.refreshUnits(); } catch (e) { /* 무시 */ }
      return 700;
    }
    return baseApply.call(this, l);
  };
}
