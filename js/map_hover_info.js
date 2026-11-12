// ===== 게이트 크로니클: PC 맵 커서 칸 정보 (영역 B, 사용자 요청) =====
// 넓은 화면 + 마우스에서, 커서가 가리키는 칸의 요약(지형·도시·게이트·거리)을
// 지도 중앙 상단(#hud-look)에 보여 준다. 좁은 화면·터치에서는 쓰지 않는다.
// 칸을 눌러 뜨는 기존 팁(#hud-tip)은 그대로 두고, 팁이 열려 있으면 이 표시는 숨긴다.
{
  const PC = '(min-width: 641px)';
  const isPc = () => window.matchMedia(PC).matches;

  UI.ensureHudLook = function () {
    let el = document.getElementById('hud-look');
    if (el) return el;
    const world = document.getElementById('world');
    if (!world) return null;
    el = document.createElement('div');
    el.id = 'hud-look';
    el.className = 'hud hud-look';
    el.setAttribute('aria-live', 'polite');
    world.appendChild(el);
    return el;
  };

  UI.hideMapLook = function () {
    const el = document.getElementById('hud-look');
    if (el) { el.classList.remove('on'); el.innerHTML = ''; }
  };

  UI.mapLookHtml = function (x, y) {
    const p = G.player; if (!p || !WORLD.inb(x, y)) return '';
    const known = G.revealed(x, y);
    const ty = WORLD.type(x, y); const reg = WORLD.regionAt(x, y); const city = WORLD.cityAt(x, y);
    const d = Math.max(Math.abs(x - p.x), Math.abs(y - p.y));
    const title = !known ? '미탐색 지역' : city ? city.name : reg ? `${reg.name} · ${WORLD.T_NAME[ty]}` : WORLD.T_NAME[ty];
    const bits = [];
    if (d) bits.push(`현재 위치에서 ${d}칸`);
    if (ty === WORLD.T.SEA || ty === WORLD.T.NORTH) bits.push('진입 불가');
    else if (!G.canJeju() && reg && reg.id === 'jeju') bits.push('관리국 공인 S급만');
    const map = this.map;
    if (map && map.reachData && map.reachData.dist.has(WORLD.idx(x, y)) && WORLD.idx(x, y) !== map.reachData.start) {
      bits.push(`이동 ${WORLD.daysFor(map.reachData.dist.get(WORLD.idx(x, y)))}일`);
    }
    let body = '';
    if (!known) body = '<div class="small dim">신호가 닿지 않는다. 가까이 가면 드러난다.</div>';
    else {
      const obj = G.objAtSeen(x, y);
      if (obj && obj.kind === 'gate') body += `<div class="look-row">${this.rift ? this.rift(obj.tier) : ''}<span><b>${G.gateName(obj)}</b> ${this.rankTag(obj.tier)} ${this.elemTag(obj.elem)}</span></div>`;
      if (obj && obj.kind === 'mob') body += `<div class="look-row"><span class="mob-dot" style="--c:${elemColor(obj.elem)}"></span><span><b>${obj.name} 무리 ×${obj.count}</b> ${this.rankTag(obj.tier)}</span></div>`;
      const ns = this.npcsAt ? this.npcsAt(x, y) : [];
      for (const n of ns.slice(0, 2)) body += `<div class="look-row">${this.npcAvatar ? this.npcAvatar(n, 22) : ''}<span><b>${n.name}</b> <span class="dim">${this.rankTag(n.rankIdx, n.stage)}</span></span></div>`;
      if (x === p.x && y === p.y && !body) body = '<div class="small dim">현재 위치</div>';
    }
    return fixJosa(`<div class="look-title"><b>${title}</b></div>${bits.length ? `<div class="look-sub small dim">${bits.join(' · ')}</div>` : ''}${body}`);
  };

  UI.showMapLook = function (x, y) {
    if (!isPc() || !G || !G.player || G.over || this.screen !== 'game') return this.hideMapLook();
    if (this.modalOpen && this.modalOpen()) return this.hideMapLook();
    if (this.dlg) return this.hideMapLook();
    const tip = document.getElementById('hud-tip');
    if (tip && !tip.classList.contains('hidden')) return this.hideMapLook();
    const el = this.ensureHudLook(); if (!el) return;
    const html = this.mapLookHtml(x, y);
    if (!html) return this.hideMapLook();
    el.innerHTML = html;
    el.classList.add('on');
  };

  UI.onMapHover = function (hoverIdx) {
    if (!isPc()) return this.hideMapLook();
    if (hoverIdx == null || hoverIdx < 0) return this.hideMapLook();
    const [x, y] = WORLD.xy(hoverIdx);
    this.showMapLook(x, y);
  };

  // MapView.draw 매 프레임 hover 변화를 감지해 갱신 (입력 쪽을 건드리지 않음)
  if (typeof MapView !== 'undefined') {
    const baseDraw = MapView.prototype.draw;
    MapView.prototype.draw = function (...a) {
      const r = baseDraw.apply(this, a);
      try {
        if (this._lookHover !== this.hover) {
          this._lookHover = this.hover;
          if (typeof UI !== 'undefined' && UI.onMapHover) UI.onMapHover(this.hover);
        }
      } catch (e) { /* 무시 */ }
      return r;
    };
  }

  const baseHide = UI.hideTip;
  if (baseHide) UI.hideTip = function (...a) {
    const r = baseHide.apply(this, a);
    // 팁을 닫은 뒤에도 커서가 칸 위에 있으면 다시 보여 준다
    try {
      if (this.map && this.map.hover >= 0) this.onMapHover(this.map.hover);
    } catch (e) { /* 무시 */ }
    return r;
  };

  const baseShow = UI.showTip;
  if (baseShow) UI.showTip = function (...a) {
    try { this.hideMapLook(); } catch (e) { /* 무시 */ }
    return baseShow.apply(this, a);
  };
}
