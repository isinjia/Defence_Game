// ===== 게이트 크로니클: 원소 반응·연계 (영역 A-α, docs/전투_제안.md 4) =====
// 상태 이상(js/status_fx.js)이 걸린 대상에 맞는 속성이 들어가면 반응이 일어난다(상태는 소모된다).
//   둔화·빙결 + 뇌 → 과전류: 큰 추가 피해, 둔화·빙결이 걸린 다른 적에게도 번진다
//   화상 + 목   → 연소 확산: 추가 피해, 다른 적 모두에게 화상
//   화상 + 수   → 증기 폭발: 화상을 꺼뜨리며 적 전체에 피해
//   속박 + 염   → 장작불: 큰 추가 피해
//   낙인 + 암   → 붕괴: 큰 추가 피해, 강화 효과 제거
//   공포 + 성   → 심판: 추가 피해, 기절
//   감전 + 수   → 누전: 추가 피해, 감전이 다른 적 하나로 옮는다
// 연계: 적이 자기 차례를 맞기 전에 아군이 같은 적을 연달아 치면 연계 수가 쌓여 피해가 조금씩 커진다(최대 +30%).
// 동료 AI: 반응을 일으킬 수 있는 적을 성격대로 노린다(냉담은 잘 노리고 호전은 무시).

const ELEM_REACT = [
  { id: 'overload', need: ['slow', 'freeze'], elem: 'bolt', name: '과전류', mult: 0.9, color: '#ffd84d', spread: 'chill' },
  { id: 'wildfire', need: ['burn'], elem: 'wood', name: '연소 확산', mult: 0.5, color: '#ff7a45', spread: 'burn' },
  { id: 'steam', need: ['burn'], elem: 'water', name: '증기 폭발', mult: 0.3, color: '#cfe6ff', aoe: 0.5 },
  { id: 'pyre', need: ['root'], elem: 'fire', name: '장작불', mult: 1.0, color: '#ff9a3c' },
  { id: 'collapse', need: ['mark'], elem: 'dark', name: '붕괴', mult: 0.9, color: '#a36cff', strip: true },
  { id: 'judgement', need: ['fear'], elem: 'holy', name: '심판', mult: 0.6, color: '#fff0b3', stun: true },
  { id: 'shortcircuit', need: ['shock'], elem: 'water', name: '누전', mult: 0.5, color: '#9fd8ff', jump: 'shock' },
];
const REACT_SEEK = { cold: 0.75, just: 0.45, kind: 0.4, greedy: 0.35, warlike: 0.05 };

Object.assign(Combat.prototype, {
  // e 속성 공격이 def에게 일으킬 반응
  reactionFor(e, def) {
    if (!e || !def || !def.st) return null;
    return ELEM_REACT.find((r) => r.elem === e && r.need.some((k) => def.st[k] && def.st[k].t > 0)) || null;
  },
  // 반응: 추가 피해와 부가 효과 (본 피해 dmg 를 바탕으로)
  doReaction(att, def, r, dmg) {
    for (const k of r.need) delete def.st[k];
    this.push(`${r.name}!`, att.side === 'ally' ? 'hit' : 'hurt', { k: 'react', dst: def.id, name: r.name, color: r.color });
    const hit = (t, amount) => {
      if (!t.alive || amount <= 0) return;
      const v = Math.max(1, Math.round(amount)); t.hp -= v;
      this.push(`${r.name} → ${t.name}에게 ${v} 피해`, att.side === 'ally' ? 'hit' : 'hurt', { k: 'dmg', src: att.id, dst: t.id, amt: v, elem: r.elem, hp: Math.max(0, t.hp), killed: t.hp <= 0, react: true });
      if (t.hp <= 0) this.down(t);
    };
    hit(def, dmg * r.mult);
    const others = this.foesOf(att).filter((x) => x !== def && x.alive);
    if (r.spread === 'chill') for (const o of others) if (o.st && (o.st.slow || o.st.freeze)) { delete o.st.slow; delete o.st.freeze; hit(o, dmg * 0.6); }
    if (r.spread === 'burn') for (const o of others) this.applySt(o, 'burn', att);
    if (r.aoe) for (const o of [def, ...others]) hit(o, dmg * r.aoe);
    if (r.strip && def.alive && def.buffs) { def.buffs.atk = 0; def.buffs.atkT = 0; if (def.buffs.def > 0) { def.buffs.def = 0; def.buffs.defT = 0; } }
    if (r.stun && def.alive) { def.stun = Math.max(def.stun || 0, 1); this.push(`${def.name}이(가) 기절했다!`, 'hit', { k: 'note', dst: def.id }); }
    if (r.jump) { const o = others.find((x) => !this.hasSt(x, r.jump)); if (o) this.applySt(o, r.jump, att); }
    (this.reactLog ||= []).push({ id: r.id, by: att.id });
  },
});

{
  const C = Combat.prototype;
  // 연계 보너스는 본 피해 계산에 넣는다
  const baseCalc = C.calcDamage;
  C.calcDamage = function (att, def, skill, opt = {}) {
    const r = baseCalc.call(this, att, def, skill, opt);
    if (att.side === 'ally' && def.chain > 1) r.dmg = Math.max(1, Math.round(r.dmg * (1 + Math.min(0.3, 0.06 * (def.chain - 1)))));
    return r;
  };
  const baseDeal = C.dealDamage;
  C.dealDamage = function (att, def, skill, opt = {}) {
    const e = this.hitElem ? this.hitElem(att, skill) : (skill && skill.elem);
    const react = this.reactionFor(e, def);
    // 아군의 연계 수 (그 적이 자기 차례를 맞으면 끊긴다)
    if (att.side === 'ally' && def.side === 'enemy') {
      def.chain = (def.chain || 0) + 1;
      if (def.chain >= 3 && def.chain <= 6) this.push(`연계 ${def.chain}`, 'hit', { k: 'chain', dst: def.id, n: def.chain });
    }
    // 반응이 날 때는 같은 공격으로 상태를 새로 걸지 않는다 (반응 뒤 바로 다시 걸리는 것 방지)
    const dmg = baseDeal.call(this, att, def, skill, react ? { ...opt, noStatus: true } : opt);
    if (react && dmg > 0 && def.st) this.doReaction(att, def, react, dmg);
    return dmg;
  };
  const baseTurn = C.takeTurn;
  C.takeTurn = function (u) { u.chain = 0; return baseTurn.call(this, u); };
  // 동료 AI: 반응을 일으킬 수 있는 적을 노린다
  const basePick = C.pickTarget;
  C.pickTarget = function (u) {
    if (u.side === 'ally' && !u.isPlayer && Math.random() < (REACT_SEEK[u.pers] ?? 0.3)) {
      const t = this.foesOf(u).find((f) => this.reactionFor(u.elem, f));
      if (t) return t;
    }
    return basePick.call(this, u);
  };
}

{
  // 연출: 반응 이름과 연계 수
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && (ev.k === 'react' || ev.k === 'chain')) {
      if (this.appendLog) this.appendLog(l);
      const el = document.getElementById('u-' + ev.dst); const host = el && (el.querySelector('.fx-host') || el);
      if (host && ev.k === 'react') {
        host.insertAdjacentHTML('beforeend', `<span class="react-pop" style="--rc:${ev.color}">${ev.name}!</span>`);
        const pop = host.querySelector('.react-pop:last-of-type'); setTimeout(() => pop && pop.remove(), 1100);
        if (FX.burst) FX.burst(host, ev.color, 16);
        const st = document.getElementById('stage'); if (st && FX.pulse) FX.pulse(st, 'quake', 300);
        return 420;
      }
      if (host && ev.k === 'chain') { host.insertAdjacentHTML('beforeend', `<span class="chain-pop">연계 ${ev.n}</span>`); const pop = host.querySelector('.chain-pop:last-of-type'); setTimeout(() => pop && pop.remove(), 800); return 120; }
      return 60;
    }
    return baseApply.call(this, l);
  };
}
