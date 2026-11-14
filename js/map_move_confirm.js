// ===== 게이트 크로니클: 맵 이동 확정 (영역 B·F, 사용자 요청) =====
// 가깝다고 한 번에 걸어가지 않는다.
//  PC: 클릭 → 중앙에 칸 정보(+출발) · 같은 칸을 다시 클릭하거나 더블클릭 → 이동
//  모바일: 터치 → 칸 정보(+출발) · 같은 칸 재터치 또는 [출발] → 이동
{
  const canReach = (map, x, y) => {
    const rd = map && map.reachData; if (!rd) return null;
    const i = WORLD.idx(x, y);
    if (!rd.dist.has(i) || i === rd.start) return null;
    return { rd, i, steps: WORLD.pathTo(rd, i).slice(1) };
  };

  UI.clearMoveSel = function () { this._moveSel = null; this._walkPlan = null; };

  UI.goWalkTo = function (x, y) {
    if (this.walking || this.ctx || this.modalOpen() || !this.map || this.map.moving || G.over) return;
    const r = canReach(this.map, x, y); if (!r || !r.steps.length) return this.showTip(x, y);
    this.clearMoveSel(); this.hideTip();
    if (this.hideMapLook) this.hideMapLook();
    return this.walk(r.steps);
  };

  UI.showMoveConfirm = function (x, y) {
    this._moveSel = [x, y];
    this.showTip(x, y);
    const tip = document.getElementById('hud-tip');
    const r = canReach(this.map, x, y);
    if (!tip || !r) return;
    this._walkPlan = r.steps;
    const days = G.travelPathDays(r.steps);
    const eta = G.etaInfo(days);
    tip.querySelectorAll('.tp-eta, .tp-go').forEach((el) => el.remove());
    tip.insertAdjacentHTML('beforeend',
      `<div class="small ${eta.warn ? 'amber' : 'dim'} tp-eta">${eta.text} · 경로 ${WORLD.formatTravelTime(days)}</div>` +
      `<div class="row end tp-go"><button class="primary sm" data-act="walk-go">출발</button></div>`);
  };

  const baseTap = UI.onTap;
  UI.onTap = function (x, y) {
    if (this.walking) { this.walking.stop = true; this.toast('다음 칸에서 멈춘다.'); return; }
    if (this.ctx || this.modalOpen() || !this.map || this.map.moving || G.over) return;
    // 팀 행군 등 앞선 감싸기가 막아야 하는 경우는 base에 맡긴다(도달 칸이 아니면)
    const r = canReach(this.map, x, y);
    if (r) {
      if (this._moveSel && this._moveSel[0] === x && this._moveSel[1] === y) return this.goWalkTo(x, y);
      return this.showMoveConfirm(x, y);
    }
    this.clearMoveSel();
    return baseTap.call(this, x, y);
  };

  UI.onDblTap = function (x, y) {
    if (this.walking || this.ctx || this.modalOpen() || !this.map || this.map.moving || G.over) return;
    if (this.crewMarch) { this.toast('리더가 길을 정한다. 팀이 목표로 가는 중이다.'); return; }
    const r = canReach(this.map, x, y);
    if (r) return this.goWalkTo(x, y);
    this.clearMoveSel();
    return this.showTip(x, y);
  };

  // PC 더블클릭 → 바로 이동 (클릭 두 번 확정과 별도)
  if (typeof MapView !== 'undefined') {
    const baseBind = MapView.prototype.bindInput;
    MapView.prototype.bindInput = function () {
      baseBind.call(this);
      this.cv.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (!this.h || !this.h.onDblTap) return;
        const [tx, ty] = this.toTile(e.offsetX, e.offsetY);
        if (WORLD.inb(tx, ty)) this.h.onDblTap(tx, ty);
      });
    };
  }

  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      if (this.map && this.map.h && !this.map.h.onDblTap) this.map.h.onDblTap = (x, y) => this.onDblTap(x, y);
    } catch (e) { /* 무시 */ }
    return r;
  };

  const baseHide = UI.hideTip;
  UI.hideTip = function (...a) {
    // ×로 닫으면 확정 선택도 지운다(다시 눌러야 선택)
    const tip = document.getElementById('hud-tip');
    const closing = tip && !tip.classList.contains('hidden');
    const r = baseHide.apply(this, a);
    if (closing) this._moveSel = null;
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'walk-go') {
      const st = this._walkPlan; const sel = this._moveSel;
      this.clearMoveSel(); this.hideTip();
      if (st && st.length) return this.walk(st);
      if (sel) return this.goWalkTo(sel[0], sel[1]);
      return;
    }
    if (act === 'tip-close') { this.clearMoveSel(); }
    return baseHandle.call(this, act, v);
  };
}
