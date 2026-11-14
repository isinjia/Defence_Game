// 월드맵 이동 경로에 하루 단위 표시 (영역 F·B, 사용자 요청)
// 갈 곳을 고르면(모바일: 칸을 한 번 누름 · PC: 마우스를 올림) 지금 위치에서 그 칸까지 경로를 화살표로 그리고,
// 경로 위에 하루가 넘어갈 때마다 "1일·2일…"(하루가 안 걸리는 짧은 길은 "1시간·2시간…")을 붙이고 끝에 전체 걸리는 시간.
// 시간은 이동 확인 창의 "경로 …"와 같은 계산(G.travelStepDays, WORLD.formatTravelTime — js/world_travel_time.js)을 쓴다.
{
  const MP = MapView.prototype;

  // 경로 칸마다 누적 이동 시간(일, 소수). 실제 걷기와 같은 계산(G.travelStepDays: 지형·국도·탈것 반영)을 쓴다
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
  const fmt = (d) => (WORLD.formatTravelTime ? WORLD.formatTravelTime(d) : `${Math.max(1, Math.round(d))}일`);
  // 표시 간격: 경로가 하루를 넘으면 1일마다, 아니면 길이에 맞춰 1·2·3·6시간마다
  const stepOf = (total) => (total >= 1 ? 1 : total >= 12 / 24 ? 3 / 24 : total >= 6 / 24 ? 2 / 24 : 1 / 24);
  const label = (v, unit) => (unit >= 1 ? `${Math.round(v)}일` : `${Math.round(v * 24)}시간`);

  // 화살표 경로 + 하루 표시
  MP.drawDayPath = function (path, opts = {}) {
    if (!path || path.length < 2) return;
    const c = this.ctx, s = this.tile; const pts = path.map((i) => { const [x, y] = WORLD.xy(i); return this.toScreen(x + 0.5, y + 0.5); });
    // 선: 짙은 테두리 위에 주황 실선
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    for (const [w, col] of [[Math.max(5, s * 0.16), 'rgba(8,10,14,.75)'], [Math.max(3, s * 0.09), opts.walking ? 'rgba(255,181,71,.8)' : '#ffb547']]) {
      c.strokeStyle = col; c.lineWidth = w; c.beginPath();
      pts.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py)));
      c.stroke();
    }
    // 끝 화살촉
    const [ex, ey] = pts[pts.length - 1]; const [bx, by] = pts[pts.length - 2];
    const ang = Math.atan2(ey - by, ex - bx); const hl = Math.max(9, s * 0.32);
    c.fillStyle = '#ffb547'; c.strokeStyle = 'rgba(8,10,14,.85)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - hl * Math.cos(ang - 0.5), ey - hl * Math.sin(ang - 0.5)); c.lineTo(ex - hl * Math.cos(ang + 0.5), ey - hl * Math.sin(ang + 0.5)); c.closePath(); c.stroke(); c.fill();
    c.restore();
    // 표시 간격(1일, 짧은 길은 몇 시간)마다 그 시점을 넘기는 칸에 붙인다. 끝에는 전체 걸리는 시간
    const cum = cumDays(path); const total = cum[cum.length - 1]; const unit = stepOf(total);
    const minGap = Math.max(1, Math.ceil(30 / Math.max(8, s))); // 칸이 30px보다 작으면 몇 칸 건너 표시
    let next = unit, lastK = -99;
    for (let k = 1; k < path.length; k++) {
      const end = k === path.length - 1;
      if (end) { if (opts.endChip !== false && total > 0) this.chip(pts[k][0], pts[k][1] - s * 0.5 - 4, fmt(total), '#ffb547', '#1a1205'); break; }
      if (cum[k] + 1e-9 < next) continue;
      const mark = Math.floor(cum[k] / unit + 1e-9) * unit; next = mark + unit;
      if (k - lastK < minGap || total - mark < unit * 0.35) continue; // 끝 표시와 너무 가까우면 생략
      lastK = k;
      this.chip(pts[k][0], pts[k][1] - s * 0.5 + 2, label(mark, unit), '#ffe2a8', 'rgba(12,16,24,.88)');
    }
  };

  const baseDraw = MP.draw;
  MP.draw = function (...a) {
    const r = baseDraw.apply(this, a);
    try {
      if (typeof UI === 'undefined' || !G.player) return r;
      // 걷는 중: 남은 경로
      if (this.walkPath && this.walkPath.length) {
        const pos = this.token ? WORLD.idx(Math.round(this.token.x), Math.round(this.token.y)) : WORLD.idx(G.player.x, G.player.y);
        this.drawDayPath([pos, ...this.walkPath], { walking: true });
        return r;
      }
      const rd = this.reachData; if (!rd) return r;
      // 모바일: 한 번 눌러 고른 칸 / PC: 마우스를 올린 칸
      let target = -1, hov = false;
      if (UI._moveSel) target = WORLD.idx(UI._moveSel[0], UI._moveSel[1]);
      else if (this.hover >= 0) { target = this.hover; hov = true; }
      // 마우스를 올린 경로는 mapview.js 가 끝에 걸리는 시간을 이미 붙이므로 끝 표시는 빼고 그린다
      if (target >= 0 && target !== rd.start && rd.dist.has(target)) this.drawDayPath(WORLD.pathTo(rd, target), { endChip: !hov });
    } catch (e) { /* 표시 실패는 이동을 막지 않는다 */ }
    return r;
  };
}
