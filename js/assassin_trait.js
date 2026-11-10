// ===== 게이트 크로니클: 암살계 특성 (영역 A, 사용자 설계) =====
// 1. 전투 개시: 파티에 암살계가 있으면 우리가 기습할(적 전원 1턴 기절) 확률이 오른다.
// 2. 생사결: 확률로 "암살 기습"이 발동해 상대의 체력과 능력치(공격·방어·속도)를 25% 깎고 시작한다.
// 둘 다 능력 차이(상대가 등급이 높을수록)로 실패할 수 있고, 게이트 보스·층 보스·보스 몬스터에게는 발동하지 않는다.

const ASSASSIN = {
  ambushBase: 0.12, ambushPerRank: 0.03, ambushPerAdv: 0.05, ambushMax: 0.32, // 전투 개시 기습 확률 증가분
  strikeBase: 0.4, strikePerGap: 0.12, strikePerAdv: 0.05, strikeMax: 0.75,   // 생사결 암살 기습 확률
  cut: 0.25,                                                                  // 깎는 비율
};

Object.assign(Game.prototype, {
  // 우리 편에서 가장 뛰어난 암살계 (나 또는 동료)
  bestAssassin() {
    const p = this.player; const out = [];
    const isShadow = (cls) => { const c = classById(cls); return c && c.g === 'shadow'; };
    if (isShadow(p.cls)) out.push({ name: p.name, rank: p.rankIdx || 0, adv: p.clsAdv || 0, me: true });
    for (const n of this.party ? this.party() : []) if (n && n.alive && isShadow(n.cls)) out.push({ name: n.name, rank: n.rankIdx || 0, adv: n.clsAdv || 0 });
    return out.sort((a, b) => b.rank + b.adv - (a.rank + a.adv))[0] || null;
  },
});

{
  // 상대의 등급(괴수는 등급 단계, 사람은 헌터 등급)
  const foeRank = (c) => {
    const cb = c.combat; if (!cb) return 0;
    if (c.kind === 'duel') { const n = G.npcById(c.npcId); return n ? n.rankIdx || 0 : 0; }
    if (c.pvp) return c.pvp.rank || 0; // 게이트 안 길드 추격대 (js/gate_pursuit.js)
    return Math.max(0, ...cb.units.filter((u) => u.side === 'enemy').map((u) => u.tier || 0));
  };
  const bossFight = (c) => c.nodeKind === 'boss' || (c.combat && c.combat.units.some((u) => u.side === 'enemy' && (u.boss || u.isBoss)));
  // 능력 차이: 상대가 한 등급 높을 때마다 35%씩 떨어지고, 세 등급 이상이면 통하지 않는다
  const gapFactor = (a, r) => Math.max(0, 1 - 0.35 * Math.max(0, r - a.rank));

  // 1. 전투 개시 기습
  const basePick = UI.pickIntro;
  if (basePick) UI.pickIntro = function (c) {
    if (c.intro || this._nextIntro || c.tutorial || ['exam', 'spar', 'tourney', 'story'].includes(c.kind) || bossFight(c)) return basePick.call(this, c);
    const a = G.bestAssassin(); if (!a) return basePick.call(this, c);
    const ch = Math.min(ASSASSIN.ambushMax, ASSASSIN.ambushBase + ASSASSIN.ambushPerRank * a.rank + ASSASSIN.ambushPerAdv * a.adv) * gapFactor(a, foeRank(c));
    if (Math.random() < ch) { c.assassinAmbush = a; return 'ambush'; }
    return basePick.call(this, c);
  };

  // 2. 생사결 암살 기습
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...args) {
    const c = this.ctx;
    const r = baseOpen.apply(this, args);
    try {
      if (!c || !c.combat || c.assassinChecked === c.combat) return r;
      c.assassinChecked = c.combat;
      const cb = c.combat;
      // 전투 개시 기습을 암살계가 이끌었으면 배너에 이름을 남긴다
      if (c.assassinAmbush) {
        const bn = document.querySelector('#stage .intro-banner.ambush span');
        if (bn) bn.textContent = `${c.assassinAmbush.name}(암살계)의 기척 지우기 · 적 전원 1턴 기절`;
      }
      if ((c.kind !== 'duel' && !c.pvp) || bossFight(c)) return r; // 생사결·게이트 안 대인 전투
      const a = G.bestAssassin(); if (!a) return r;
      const gap = a.rank - foeRank(c);
      const ch = Math.max(0, Math.min(ASSASSIN.strikeMax, ASSASSIN.strikeBase + ASSASSIN.strikePerGap * gap + ASSASSIN.strikePerAdv * a.adv)) * gapFactor(a, foeRank(c));
      const foe = cb.units.find((u) => u.side === 'enemy' && u.alive); if (!foe) return r;
      if (Math.random() >= ch) {
        if (gap < 0) cb.push(`${a.name}이(가) 그림자에 숨으려 했지만, ${foe.name}에게 간파당했다.`, 'hurt', { k: 'note', dst: foe.id });
        this.toast(gap < 0 ? '암살 기습 실패: 상대가 한 수 위다.' : '암살 기습의 틈을 잡지 못했다.');
        return r;
      }
      const k = 1 - ASSASSIN.cut;
      const cut = Math.round(foe.maxHp * ASSASSIN.cut);
      foe.hp = Math.max(1, Math.min(foe.hp, foe.maxHp) - cut);
      foe.atk = Math.round(foe.atk * k); foe.def = Math.round(foe.def * k); if (foe.spd) foe.spd = Math.round(foe.spd * k * 100) / 100;
      cb.push(`${a.name}의 암살 기습! ${foe.name}의 급소를 그었다. 체력·공격·방어·속도 25% 감소`, 'hit', { k: 'note', dst: foe.id }); // 연출은 아래에서 직접 (재생 때 두 번 터지지 않게)
      if (c.disp && c.disp[foe.id]) c.disp[foe.id].hp = foe.hp;
      const el = document.getElementById('u-' + foe.id);
      if (el) { const host = el.querySelector('.fx-host') || el; FX.floatText(host, `암살 기습 -${cut}`, 'crit'); if (FX.burst) FX.burst(host, '#9a7bff', 16); FX.pulse(el, 'hit', 420); }
      const st = document.getElementById('stage');
      if (st) { st.insertAdjacentHTML('beforeend', '<div class="intro-banner ambush assassin"><b>암살 기습!</b><span>상대의 체력·능력치 25% 감소</span></div>'); setTimeout(() => { const b = st.querySelector('.intro-banner.assassin'); if (b) b.remove(); }, 1400); }
      this.refreshUnits();
    } catch (e) { /* 특성 연출 실패는 전투를 막지 않는다 */ }
    return r;
  };
}
