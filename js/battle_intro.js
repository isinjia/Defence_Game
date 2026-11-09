// 전투 시작 연출 (영역 B, 사용자 요청)
// 연출이 끝난 뒤에야 전투 시간이 흐른다.
//  - 기습당함(ambushed): 몬스터가 위에서 아래로 내려온다 → 아군 전원 1턴 기절
//  - 기습함(ambush):     아군이 아래에서 위로 나타난다 → 적 전원 1턴 기절
//  - 통상(normal):       둘 다 함께 나타난다
// 기절해도 행동 게이지는 찬다. 게이지가 다 차서 차례가 지나가면 기절이 풀린다 (combat.js 의 stun 처리 그대로).
{
  // 어떤 시작인지 정한다. 다른 코드가 ctx.intro 를 정해 두면 그대로 따른다.
  UI.pickIntro = function (c) {
    if (c.intro) return c.intro;
    if (this._nextIntro) return this._nextIntro;
    if (c.tutorial || ['exam', 'spar', 'tourney', 'story'].includes(c.kind)) return 'normal';
    if (c.kind === 'duel') return c.ambushed ? 'ambushed' : 'normal';
    if (c.nodeKind === 'boss' || (c.combat && c.combat.units.some((u) => u.side === 'enemy' && u.boss))) return 'normal';
    const r = Math.random();
    return r < 0.15 ? 'ambushed' : r < 0.30 ? 'ambush' : 'normal';
  };

  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) {
    const c = this.ctx;
    const r = baseOpen.apply(this, a);
    try {
      if (!c || !c.combat || c.introDone === c.combat) return r;
      c.introDone = c.combat;
      const kind = this.pickIntro(c); c.intro = null;
      const cb = c.combat;
      const st = document.getElementById('stage'); if (!st) return r;
      // 기습: 당한 쪽 전원 1턴 기절
      const hit = kind === 'ambushed' ? 'ally' : kind === 'ambush' ? 'enemy' : null;
      if (hit) for (const u of cb.units) if (u.side === hit && u.alive) u.stun = Math.max(u.stun || 0, 1);
      // 연출 동안 시간 정지
      c.playing = true;
      st.classList.add('intro', 'intro-' + kind);
      const banner = document.createElement('div');
      banner.className = 'intro-banner ' + kind;
      banner.innerHTML = kind === 'ambushed' ? '<b>기습당했다!</b><span>아군 전원 1턴 기절</span>' : kind === 'ambush' ? '<b>기습!</b><span>적 전원 1턴 기절</span>' : '<b>전투 개시</b>';
      st.appendChild(banner);
      if (typeof SFX !== 'undefined') SFX.play(kind === 'ambushed' ? 'alert' : kind === 'ambush' ? 'weak' : 'gate');
      if (kind === 'ambushed' && !FX.reduced) setTimeout(() => FX.pulse(st, 'quake', 380), 420);
      this.refreshUnits();
      const ms = FX.reduced ? 500 : 1400;
      setTimeout(() => {
        st.classList.remove('intro', 'intro-' + kind); banner.remove();
        if (this.ctx !== c) return;
        c.playing = false;
        this.refreshUnits(); this.renderControls();
      }, ms);
    } catch (e) { if (c) c.playing = false; }
    return r;
  };

  // 사람에게 기습당한 생사결, 게이트 안 사건에서 튀어나온 괴수는 '기습당함'
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'ambush-fight' || act === 'g-ambush') this._nextIntro = 'ambushed';
    try { return baseHandle.call(this, act, v); } finally { this._nextIntro = null; }
  };
}
