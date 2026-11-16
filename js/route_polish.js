// ===== 월드맵 이동 경로 · 퀘스트 안내선 다듬기 (사용자 요청: 완성도가 떨어진다) =====
// A. 선 모양: 이동 경로는 흰 테두리 주황 실선 + 칸마다 작은 점 + 하루가 끝나는 곳에 동그란 날짜 표.
//    퀘스트 안내선은 가는 노란 점선에 진행 방향 화살표. 두 선 모두 내 캐릭터 원 밖에서 시작한다.
// B. 퀘스트 목적지가 화면 밖이면 화면 가장자리에 방향 화살표와 '제목 · 걸리는 시간'을 띄운다(안개 속에서도 보인다).
// C. 이동 확인 창은 화면 아래(빠른 단추 위)로 내려 지도와 경로를 가리지 않게 하고, 경로가 보이게 화면을 옮긴다.
// D. 현재 퀘스트 목록: 제목을 두 줄까지, 추적 단추는 작은 ◎ 아이콘.
(() => {
  if (typeof MapView === 'undefined') return;
  const MP = MapView.prototype;
  const ORANGE = '#ffb547', YELLOW = '#ffe23b', INK = 'rgba(8,10,14,.85)';

  const ptsOf = (view, path) => path.map((i) => { const [x, y] = WORLD.xy(i); return view.toScreen(x + 0.5, y + 0.5); });
  // 첫 점을 내 캐릭터 원 밖으로 옮긴다
  const trimStart = (view, pts) => {
    if (pts.length < 2) return pts;
    const R = view.tile * 0.42 + 6;
    let [x0, y0] = pts[0]; let k = 1;
    while (k < pts.length - 1 && Math.hypot(pts[k][0] - x0, pts[k][1] - y0) < R) k++;
    const [x1, y1] = pts[k]; const d = Math.hypot(x1 - x0, y1 - y0);
    if (d <= R) return pts.slice(k);
    return [[x0 + (x1 - x0) * R / d, y0 + (y1 - y0) * R / d], ...pts.slice(k)];
  };
  const stroke = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const cumDays = (path) => {
    const out = [0]; let t = 0;
    for (let k = 1; k < path.length; k++) {
      const [x0, y0] = WORLD.xy(path[k - 1]); const [x1, y1] = WORLD.xy(path[k]);
      const diag = x0 !== x1 && y0 !== y1;
      t += G.travelStepDays ? G.travelStepDays(x1, y1, diag) : WORLD.stepCost(path[k]) * (diag ? 1.4 : 1) * WORLD.DAYS_PER_COST;
      out.push(t);
    }
    return out;
  };
  const fmt = (d) => (WORLD.formatTravelTime ? WORLD.formatTravelTime(d) : d >= 1 ? `${Math.round(d)}일` : `${Math.max(1, Math.round(d * 24))}시간`);
  const clampX = (view, x, half) => Math.max(half + 4, Math.min(view.w - half - 4, x));
  const clampY = (view, y) => Math.max(16, Math.min(view.hgt - 16, y));
  // 지도에서 가려지지 않는 세로 띠: 위쪽 퀘스트 목록 아래 ~ 아래쪽 빠른 단추 위 (캔버스 좌표)
  const safeBand = (view) => {
    try {
      const cv = view.ctx && view.ctx.canvas; const r = cv.getBoundingClientRect(); const k = view.hgt / (r.height || view.hgt);
      const trEl = document.getElementById('hud-tr'); const qEl = document.querySelector('.hud-quick') || document.getElementById('hud-card');
      const top = trEl ? (trEl.getBoundingClientRect().bottom - r.top) * k + 14 : 70;
      const bottom = qEl ? (qEl.getBoundingClientRect().top - r.top) * k - 14 : view.hgt - 250;
      if (bottom - top > 80) return [top, bottom];
    } catch (e) { /* 무시 */ }
    return [70, view.hgt - 250];
  };

  // ---------- A. 이동 경로 ----------
  MP.drawDayPath = function (path, opts = {}) {
    if (!path || path.length < 2) return;
    const c = this.ctx, s = this.tile; const all = ptsOf(this, path); const pts = trimStart(this, all);
    if (pts.length < 2) return;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    const w = Math.max(3, s * 0.08);
    c.lineWidth = w + 5; c.strokeStyle = INK; stroke(c, pts);
    c.lineWidth = w + 2; c.strokeStyle = 'rgba(255,255,255,.9)'; stroke(c, pts);
    c.lineWidth = w; c.strokeStyle = opts.walking ? 'rgba(255,181,71,.9)' : ORANGE; stroke(c, pts);
    // 칸마다 작은 점 (칸이 작으면 건너뛴다)
    const every = Math.max(1, Math.ceil(18 / Math.max(6, s)));
    c.fillStyle = '#fff';
    for (let k = 1; k < all.length - 1; k += every) { const [x, y] = all[k]; if (Math.hypot(x - all[0][0], y - all[0][1]) < s * 0.42 + 6) continue; c.beginPath(); c.arc(x, y, Math.max(1.6, w * 0.38), 0, 7); c.fill(); }
    // 하루가 끝나는 칸에 동그란 날짜 표
    const cum = cumDays(path); const total = cum[cum.length - 1];
    if (total >= 1) {
      let next = 1, lastK = -99; const gap = Math.max(1, Math.ceil(34 / Math.max(8, s)));
      for (let k = 1; k < path.length - 1; k++) {
        if (cum[k] + 1e-9 < next) continue;
        const day = Math.floor(cum[k] + 1e-9); next = day + 1;
        if (k - lastK < gap || total - day < 0.35) continue; lastK = k;
        const [x, y] = all[k]; const r = Math.max(9, Math.min(13, s * 0.22));
        c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#1a1205'; c.fill(); c.lineWidth = 2; c.strokeStyle = ORANGE; c.stroke();
        c.fillStyle = '#ffe2a8'; c.font = `700 ${r > 11 ? 11 : 10}px "IBM Plex Sans KR", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`${day}일`, x, y + 0.5);
      }
    }
    // 도착 칸: 고리 + 걸리는 시간
    const [ex, ey] = all[all.length - 1];
    c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); c.arc(ex, ey, s * 0.3, 0, 7); c.stroke();
    c.lineWidth = 2; c.strokeStyle = ORANGE; c.beginPath(); c.arc(ex, ey, s * 0.3, 0, 7); c.stroke();
    c.restore();
    if (opts.endChip !== false && total > 0) {
      c.save(); c.font = '700 12px "IBM Plex Sans KR", sans-serif';
      const text = fmt(total); const half = c.measureText(text).width / 2 + 10; c.restore();
      this.chip(clampX(this, ex, half), clampY(this, ey - s * 0.5 - 6), text, ORANGE, '#1a1205');
    }
  };

  // ---------- A. 퀘스트 안내선: 가는 점선 + 방향 화살표, 안개 위에도 그린다 ----------
  const baseQR = MP.drawQuestRoute;
  MP.drawQuestRoute = function () { /* 아래 draw 감싸기에서 맨 위에 그린다 */ };
  const drawQuestLine = function (view) {
    if (UI.ctx || !view.questRouteData) return;
    const route = view.questRouteData(); if (!route || !route.path || route.path.length < 2) return;
    const c = view.ctx, s = view.tile; const all = ptsOf(view, route.path);
    if (view.token && view.token.walking) all[0] = view.toScreen(view.token.x + 0.5, view.token.y + 0.5);
    const pts = trimStart(view, all); if (pts.length < 2) return;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.lineWidth = 5; c.strokeStyle = 'rgba(8,10,14,.7)'; c.setLineDash([]); stroke(c, pts);
    c.lineWidth = 2.5; c.strokeStyle = YELLOW; c.setLineDash([8, 7]); c.lineDashOffset = -((view.t || 0) / 3) % 15; stroke(c, pts);
    c.setLineDash([]);
    // 진행 방향 화살표: 일정 간격마다
    const step = Math.max(70, s * 2.2); let acc = step * 0.6;
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = pts[k - 1], [bx, by] = pts[k]; const len = Math.hypot(bx - ax, by - ay); if (!len) continue;
      while (acc <= len) {
        const t = acc / len, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, an = Math.atan2(by - ay, bx - ax), L = 7;
        if (x > -20 && y > -20 && x < view.w + 20 && y < view.hgt + 20) {
          c.beginPath(); c.moveTo(x + L * Math.cos(an), y + L * Math.sin(an)); c.lineTo(x + L * Math.cos(an + 2.5), y + L * Math.sin(an + 2.5)); c.lineTo(x + L * Math.cos(an - 2.5), y + L * Math.sin(an - 2.5)); c.closePath();
          c.fillStyle = YELLOW; c.strokeStyle = INK; c.lineWidth = 1.5; c.fill(); c.stroke();
        }
        acc += step;
      }
      acc -= len;
    }
    c.restore();
  };

  // ---------- B. 목적지가 보이는 곳 밖이면: 선이 보이는 곳을 벗어나는 자리에 '제목 · 걸리는 시간' ----------
  const drawEdge = function (view) {
    if (UI.ctx || !view.questRouteData) return;
    const route = view.questRouteData(); if (!route || !route.dest || !route.path || route.path.length < 2) return;
    const [top, bottom] = safeBand(view); const left = 10, right = view.w - 10;
    const inside = ([x, y]) => x >= left && x <= right && y >= top && y <= bottom;
    const all = ptsOf(view, route.path); if (inside(all[all.length - 1])) return; // 목적지가 보이면 기존 표시로 충분
    const d = route.dest; const text = `${d.kind === 'main' ? '메인' : '추적'} · ${String(d.title).slice(0, view.w < 600 ? 9 : 16)} · ${fmt(route.days)}`;
    const c = view.ctx; c.save(); c.font = '700 12px "IBM Plex Sans KR", sans-serif'; const half = c.measureText(text).width / 2 + 10; c.restore();
    // 선이 보이는 칸을 처음 벗어나는 자리(경계와 만나는 점)를 찾는다
    let x = view.w / 2, y = top + 12, found = false;
    for (let i = 1; i < all.length && !found; i++) {
      const [ax, ay] = all[i - 1], [bx, by] = all[i];
      if (!inside(all[i - 1]) || inside(all[i])) continue;
      let t = 1;
      if (by < top) t = Math.min(t, (top - ay) / (by - ay)); if (by > bottom) t = Math.min(t, (bottom - ay) / (by - ay));
      if (bx < left) t = Math.min(t, (left - ax) / (bx - ax)); if (bx > right) t = Math.min(t, (right - ax) / (bx - ax));
      const cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t; found = true;
      if (cy <= top + 1) { x = cx; y = top + 12; } else if (cy >= bottom - 1) { x = cx; y = bottom - 12; }
      else { x = cx < view.w / 2 ? left + half : right - half; y = cy; }
    }
    if (!found) { const [dx, dy] = all[all.length - 1]; x = dx; y = dy < top ? top + 12 : bottom - 12; }
    { const R = view.tile * 0.42 + 14; const [px, py] = view.toScreen(G.player.x + 0.5, G.player.y + 0.5); const cx = clampX(view, x, half);
      if (Math.abs(cx - px) < half + R && Math.abs(y - py) < R) y = py - R - 8; } // 내 캐릭터와 겹치지 않게
    view.chip(clampX(view, x, half), Math.max(top + 10, Math.min(bottom - 10, y)), text, YELLOW, '#171b0bf2');
  };

  const baseDraw = MP.draw;
  MP.draw = function (...a) {
    const r = baseDraw.apply(this, a);
    try { drawQuestLine(this); } catch (e) { /* 표시 실패는 이동을 막지 않는다 */ }
    // 퀘스트 선이 내 캐릭터를 덮지 않게 캐릭터를 다시 그린다
    try { if (this.drawPlayer && !UI.ctx) this.drawPlayer(); } catch (e) { /* 무시 */ }
    try { drawEdge(this); } catch (e) { /* 무시 */ }
    return r;
  };
  void baseQR;

  // ---------- C. 이동 확인 창 위치 ----------
  if (typeof UI !== 'undefined') {
    const placeTip = () => {
      const tip = document.getElementById('hud-tip'); if (!tip || tip.classList.contains('hidden')) return;
      const anchor = document.querySelector('.hud-quick') || document.getElementById('hud-card');
      if (!anchor) return;
      const top = anchor.getBoundingClientRect().top;
      tip.classList.add('tip-low');
      tip.style.top = 'auto'; tip.style.bottom = `${Math.max(8, window.innerHeight - top + 8)}px`;
    };
    const baseConfirm = UI.showMoveConfirm;
    if (baseConfirm) UI.showMoveConfirm = function (x, y, ...a) {
      const r = baseConfirm.call(this, x, y, ...a);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return r;
      try {
        placeTip();
        // 내 위치와 목적지가 모두 보이도록 화면을 옮긴다(위쪽 지도 영역 가운데)
        const m = this.map; const p = G.player;
        if (m) {
          const tip = document.getElementById('hud-tip'); const cv = m.ctx.canvas.getBoundingClientRect(); const k = m.hgt / (cv.height || m.hgt);
          const [top] = safeBand(m); const tipTop = tip ? (tip.getBoundingClientRect().top - cv.top) * k : m.hgt * 0.6;
          // 둘 다 들어가면 가운데, 아니면 목적지를 보이는 칸 가운데에 둔다
          const visH = tipTop - top; const fits = (Math.abs(y - p.y) + 1.2) * m.tile <= visH && (Math.abs(x - p.x) + 1.2) * m.tile <= m.w;
          const cx = fits ? (p.x + x) / 2 + 0.5 : x + 0.5, cy = fits ? (p.y + y) / 2 + 0.5 : y + 0.5; const visMid = (top + tipTop) / 2;
          m.camX = cx; m.camY = cy + (m.hgt / 2 - visMid) / m.tile;
          if (m.clampCam) m.clampCam();
        }
      } catch (e) { /* 무시 */ }
      return r;
    };
    const baseHide = UI.hideTip;
    if (baseHide) UI.hideTip = function (...a) { const tip = document.getElementById('hud-tip'); if (tip) { tip.classList.remove('tip-low'); tip.style.top = ''; tip.style.bottom = ''; } return baseHide.apply(this, a); };
  }

  // ---------- D. 퀘스트 목록 ----------
  if (typeof document !== 'undefined' && !document.getElementById('route-polish-css')) {
    const st = document.createElement('style'); st.id = 'route-polish-css';
    st.textContent = `.hud-tip.tip-low{max-height:34vh;overflow:auto;display:grid;grid-template-columns:1fr auto;column-gap:10px;row-gap:2px;padding-top:8px;padding-bottom:8px}
.hud-tip.tip-low>*{grid-column:1/-1}
.hud-tip.tip-low>.dim:not(.small){display:none}
.hud-tip.tip-low>.tp-eta{grid-column:1;align-self:center}
.hud-tip.tip-low>.tp-go{grid-column:2;margin:0 !important;align-self:center}
#hud-tr .qr-hud-row .hq-t{flex:1 1 auto;min-width:0;white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.25;font-size:12.5px}
@media (max-width:640px){#hud-tr .qr-hud-row .hq-r{display:none}}
body:has(.hud-tip.tip-low:not(.hidden)) .map-origin{display:none !important}
#hud-tr .qr-track{min-width:38px !important;width:38px !important;max-width:38px;padding:0 !important;font-size:0 !important;display:flex;align-items:center;justify-content:center}
#hud-tr .qr-track::before{content:'';width:14px;height:14px;border-radius:50%;border:2px solid currentColor;box-shadow:inset 0 0 0 3px transparent}
#hud-tr .qr-track.active::before{background:radial-gradient(circle,currentColor 0 3px,transparent 3.5px)}`;
    document.head.appendChild(st);
  }
})();
