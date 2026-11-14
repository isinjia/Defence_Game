// ===== 게이트 크로니클: 월드맵 줌 (기본 배율 + 확대/축소) =====
// 지금 화면(타일 ≈42px)을 기본으로 두고, 버튼·핀치·휠 줌이 리사이즈에 덮이지 않게 한다.
(() => {
  // 사용자 요청: 예전 최대 확대(80)를 기본으로 두고, 거기서 더 확대·축소할 수 있게 범위를 다시 잡는다.
  const DEF = 80;
  const MIN = 20;
  const MAX = 140;
  const KEY = 'gc_map_tile2'; // 기준이 바뀌어 저장 키를 새로 쓴다(모두 새 기본에서 시작)

  const loadTile = () => {
    try {
      const v = +localStorage.getItem(KEY);
      if (v >= MIN && v <= MAX) return v;
    } catch (e) { /* 무시 */ }
    return DEF;
  };
  const saveTile = (t) => {
    try { localStorage.setItem(KEY, String(Math.round(t))); } catch (e) { /* 무시 */ }
  };

  const syncBtns = (tile) => {
    const zin = document.querySelector('.hud-zoom [data-act="zoom-in"]');
    const zout = document.querySelector('.hud-zoom [data-act="zoom-out"]');
    if (zin) zin.disabled = tile >= MAX - 0.5;
    if (zout) zout.disabled = tile <= MIN + 0.5;
  };

  const baseResize = MapView.prototype.resize;
  MapView.prototype.resize = function (...a) {
    const keep = this._zoomReady ? this.tile : null;
    baseResize.apply(this, a);
    // 기본 resize는 좁은 화면에서 tile>40이면 38로 되돌려 줌인을 망가뜨린다 → 복구
    if (keep != null) this.tile = keep;
    else {
      this.tile = loadTile();
      this._zoomReady = true;
    }
    syncBtns(this.tile);
  };

  const baseZoom = MapView.prototype.zoom;
  MapView.prototype.zoom = function (f, sx, sy) {
    const before = this.tile;
    // 기본 zoom은 12~80으로 막혀 있어 직접 계산한다 (손가락·휠 위치를 중심으로)
    if (sx == null) sx = this.w / 2; if (sy == null) sy = this.hgt / 2;
    const wx = (sx - this.w / 2) / this.tile + this.camX, wy = (sy - this.hgt / 2) / this.tile + this.camY;
    this.tile = Math.max(MIN, Math.min(MAX, this.tile * f));
    this.camX = wx - (sx - this.w / 2) / this.tile; this.camY = wy - (sy - this.hgt / 2) / this.tile;
    if (this.clampCam) this.clampCam();
    if (this.tile !== before) saveTile(this.tile);
    syncBtns(this.tile);
  };

  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      if (this.map) {
        if (!this.map._zoomReady) {
          this.map.tile = loadTile();
          this.map._zoomReady = true;
        }
        syncBtns(this.map.tile);
      }
      const z = document.querySelector('.hud-zoom');
      if (z) z.classList.add('hud-zoom-on');
    } catch (e) { /* 무시 */ }
    return r;
  };
})();
