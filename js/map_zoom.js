// ===== 게이트 크로니클: 월드맵 줌 (기본 배율 + 확대/축소) =====
// 지금 화면(타일 ≈42px)을 기본으로 두고, 버튼·핀치·휠 줌이 리사이즈에 덮이지 않게 한다.
(() => {
  const DEF = 42;
  const MIN = 14;
  const MAX = 96;
  const KEY = 'gc_map_tile';

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
    baseZoom.call(this, f, sx, sy);
    // 상한을 조금 넓히고 저장
    this.tile = Math.max(MIN, Math.min(MAX, this.tile));
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
