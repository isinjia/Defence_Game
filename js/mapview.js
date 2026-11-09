// ===== 게이트 크로니클: 월드맵 렌더러 =====
// SF 전술 홀로맵 스타일. 캔버스 하나에 지형·안개·오브젝트·플레이어를 그린다.

class MapView {
  constructor(canvas, mini, handlers) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.mini = mini; this.mctx = mini ? mini.getContext('2d') : null;
    this.h = handlers; // { onTap(x,y), onHover(x,y) }
    this.tile = 46; this.camX = 0; this.camY = 0;
    this.reachData = null; this.hover = -1;
    this.token = null; // 애니메이션 중 플레이어 위치 {x,y}
    this.moving = false;
    this.t = 0; this.alive = true;
    this.imgs = {};
    this.fogPat = this.makeFogPattern();
    this.bindInput();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.cv.parentElement);
    const loop = () => { if (!this.alive) return; this.t += 1; this.draw(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  destroy() { this.alive = false; cancelAnimationFrame(this.raf); this.ro.disconnect(); }

  makeFogPattern() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d');
    x.fillStyle = '#05070c'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 220; i++) { x.fillStyle = `rgba(120,150,190,${Math.random() * 0.08})`; x.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 1, 1); }
    for (let y = 0; y < 64; y += 3) { x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, y, 64, 1); }
    return this.ctx.createPattern(c, 'repeat');
  }

  resize() {
    const r = this.cv.parentElement.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = r.width; this.hgt = r.height;
    this.cv.width = r.width * this.dpr; this.cv.height = r.height * this.dpr;
    this.cv.style.width = r.width + 'px'; this.cv.style.height = r.height + 'px';
    if (this.w < 600 && this.tile > 40) this.tile = 38;
  }

  // 타일 좌표 <-> 화면 좌표
  toScreen(x, y) { return [(x - this.camX) * this.tile + this.w / 2, (y - this.camY) * this.tile + this.hgt / 2]; }
  toTile(sx, sy) { return [Math.floor((sx - this.w / 2) / this.tile + this.camX), Math.floor((sy - this.hgt / 2) / this.tile + this.camY)]; }
  centerOn(x, y) { this.camX = x + 0.5; this.camY = y + 0.5; this.clampCam(); }
  clampCam() {
    this.camX = Math.max(0, Math.min(WORLD.COLS, this.camX));
    this.camY = Math.max(0, Math.min(WORLD.ROWS, this.camY));
  }
  zoom(f, sx = this.w / 2, sy = this.hgt / 2) {
    const before = [(sx - this.w / 2) / this.tile + this.camX, (sy - this.hgt / 2) / this.tile + this.camY];
    this.tile = Math.max(22, Math.min(80, this.tile * f));
    this.camX = before[0] - (sx - this.w / 2) / this.tile; this.camY = before[1] - (sy - this.hgt / 2) / this.tile;
    this.clampCam();
  }

  setPlayerImage(svg) {
    if (this.imgs.playerSrc === svg) return;
    this.imgs.playerSrc = svg;
    const im = new Image();
    im.src = svg.startsWith('<') ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : svg;
    this.imgs.player = im;
  }

  refresh() {
    const p = G.player;
    this.reachData = this.moving ? null : WORLD.reach(p.x, p.y, G.moveRange(), G.canJeju());
    this.drawMini();
  }

  bindInput() {
    const cv = this.cv;
    let down = null, pinch = null;
    const pts = new Map();
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, [e.offsetX, e.offsetY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), tile: this.tile }; down = null; return; }
      down = { x: e.offsetX, y: e.offsetY, cx: this.camX, cy: this.camY, moved: false };
    });
    cv.addEventListener('pointermove', (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, [e.offsetX, e.offsetY]);
      if (pinch && pts.size === 2) {
        const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        this.zoom((pinch.tile * d / pinch.d) / this.tile, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        return;
      }
      if (down) {
        const dx = e.offsetX - down.x, dy = e.offsetY - down.y;
        if (Math.abs(dx) + Math.abs(dy) > 7) down.moved = true;
        if (down.moved) { this.camX = down.cx - dx / this.tile; this.camY = down.cy - dy / this.tile; this.clampCam(); this.drawMini(); }
        return;
      }
      if (e.pointerType === 'mouse') {
        const [tx, ty] = this.toTile(e.offsetX, e.offsetY);
        this.hover = WORLD.inb(tx, ty) ? WORLD.idx(tx, ty) : -1;
        cv.style.cursor = this.reachData && this.reachData.dist.has(this.hover) && this.hover !== this.reachData.start ? 'pointer' : 'grab';
      }
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pinch) { if (pts.size < 2) pinch = null; down = null; return; }
      if (down && !down.moved) {
        const [tx, ty] = this.toTile(e.offsetX, e.offsetY);
        if (WORLD.inb(tx, ty)) this.h.onTap(tx, ty);
      }
      down = null;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); down = null; pinch = null; });
    cv.addEventListener('pointerleave', () => { this.hover = -1; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.offsetX, e.offsetY); }, { passive: false });
    if (this.mini) this.mini.addEventListener('click', (e) => {
      const r = this.mini.getBoundingClientRect();
      this.camX = ((e.clientX - r.left) / r.width) * WORLD.COLS; this.camY = ((e.clientY - r.top) / r.height) * WORLD.ROWS;
      this.clampCam(); this.drawMini();
    });
  }

  // 한 칸 사이를 부드럽게 이동 (걷기 연출)
  tween(from, to, ms, done) {
    this.moving = true; this.reachData = null;
    const t0 = performance.now();
    const step = (now) => {
      const k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      this.token = { x: from[0] + (to[0] - from[0]) * e, y: from[1] + (to[1] - from[1]) * e, walking: true };
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  }

  // 경로를 따라 토큰을 움직인다
  animatePath(path, done) {
    this.moving = true; this.reachData = null;
    const pts = path.map(WORLD.xy);
    let i = 0;
    const stepMs = FX.reduced ? 0 : 85;
    const step = () => {
      if (i >= pts.length) { this.token = null; this.moving = false; done(); return; }
      this.token = { x: pts[i][0], y: pts[i][1] };
      this.camX += (pts[i][0] + 0.5 - this.camX) * 0.35; this.camY += (pts[i][1] + 0.5 - this.camY) * 0.35;
      i++;
      setTimeout(step, stepMs);
    };
    step();
  }

  // ---------- 그리기 ----------
  draw() {
    const c = this.ctx, s = this.tile, t = this.t;
    if (!G.player) return;
    if (this.token && this.token.walking) { this.camX += (this.token.x + 0.5 - this.camX) * 0.1; this.camY += (this.token.y + 0.5 - this.camY) * 0.1; }
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#05080d'; c.fillRect(0, 0, this.w, this.hgt);
    const [x0, y0] = this.toTile(0, 0), [x1, y1] = this.toTile(this.w, this.hgt);
    const T = WORLD.T;
    for (let y = Math.max(0, y0); y <= Math.min(WORLD.ROWS - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(WORLD.COLS - 1, x1); x++) {
        const [px, py] = this.toScreen(x, y);
        const i = WORLD.idx(x, y), ty = WORLD.tiles[i];
        this.drawTile(ty, px, py, s, x, y);
        if (!G.fog[i]) { c.globalAlpha = 0.86; this.drawFog(px, py, s, x, y); c.globalAlpha = 1; }
      }
    }
    // 격자
    c.strokeStyle = 'rgba(70,120,160,.10)'; c.lineWidth = 1; c.beginPath();
    for (let x = Math.max(0, x0); x <= Math.min(WORLD.COLS, x1 + 1); x++) { const [px] = this.toScreen(x, 0); c.moveTo(px + 0.5, 0); c.lineTo(px + 0.5, this.hgt); }
    for (let y = Math.max(0, y0); y <= Math.min(WORLD.ROWS, y1 + 1); y++) { const [, py] = this.toScreen(0, y); c.moveTo(0, py + 0.5); c.lineTo(this.w, py + 0.5); }
    c.stroke();
    // 이동 가능 범위
    const rd = this.reachData;
    if (rd && !this.moving && !UI.ctx) {
      const pulse = 0.08 + Math.sin(t / 20) * 0.025;
      for (const [i] of rd.dist) {
        if (i === rd.start) continue;
        const [x, y] = WORLD.xy(i); const [px, py] = this.toScreen(x, y);
        if (px < -s || py < -s || px > this.w || py > this.hgt) continue;
        c.fillStyle = `rgba(150,240,230,${pulse})`; c.fillRect(px + 1, py + 1, s - 2, s - 2);
      }
      // 범위 외곽선
      c.strokeStyle = 'rgba(150,240,230,.55)'; c.lineWidth = 1.5; c.beginPath();
      for (const [i] of rd.dist) {
        const [x, y] = WORLD.xy(i); const [px, py] = this.toScreen(x, y);
        const has = (dx, dy) => WORLD.inb(x + dx, y + dy) && rd.dist.has(WORLD.idx(x + dx, y + dy));
        if (!has(0, -1)) { c.moveTo(px, py); c.lineTo(px + s, py); }
        if (!has(0, 1)) { c.moveTo(px, py + s); c.lineTo(px + s, py + s); }
        if (!has(-1, 0)) { c.moveTo(px, py); c.lineTo(px, py + s); }
        if (!has(1, 0)) { c.moveTo(px + s, py); c.lineTo(px + s, py + s); }
      }
      c.stroke();
      // 마우스를 올린 경로
      if (this.hover >= 0 && rd.dist.has(this.hover) && this.hover !== rd.start) {
        const path = WORLD.pathTo(rd, this.hover);
        c.strokeStyle = '#ffb547'; c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath();
        path.forEach((i, k) => { const [x, y] = WORLD.xy(i); const [px, py] = this.toScreen(x + 0.5, y + 0.5); k ? c.lineTo(px, py) : c.moveTo(px, py); });
        c.stroke(); c.setLineDash([]);
        const [hx, hy] = WORLD.xy(this.hover); const [px, py] = this.toScreen(hx, hy);
        const days = WORLD.daysFor(rd.dist.get(this.hover));
        this.chip(px + s / 2, py - 6, `${days}일`, '#ffb547', '#1a1205');
      }
    }
    // 남은 경로
    if (this.walkPath && this.walkPath.length) {
      c.strokeStyle = 'rgba(255,181,71,.75)'; c.lineWidth = 2.5; c.setLineDash([5, 6]); c.lineDashOffset = -t / 2; c.beginPath();
      const pos = this.token || { x: G.player.x, y: G.player.y };
      let [sx, sy] = this.toScreen(pos.x + 0.5, pos.y + 0.5); c.moveTo(sx, sy);
      for (const i of this.walkPath) { const [x, y] = WORLD.xy(i); [sx, sy] = this.toScreen(x + 0.5, y + 0.5); c.lineTo(sx, sy); }
      c.stroke(); c.setLineDash([]);
      const last = this.walkPath[this.walkPath.length - 1]; const [lx, ly] = WORLD.xy(last); const [px, py] = this.toScreen(lx + 0.5, ly + 0.5);
      c.strokeStyle = '#ffb547'; c.lineWidth = 2; c.beginPath(); c.arc(px, py, s * 0.3, 0, Math.PI * 2); c.stroke();
    }
    this.drawObjects();
    this.drawCities();
    this.drawPlayer();
    // 가장자리 비네팅
    const g = c.createRadialGradient(this.w / 2, this.hgt / 2, Math.min(this.w, this.hgt) * 0.35, this.w / 2, this.hgt / 2, Math.max(this.w, this.hgt) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    c.fillStyle = g; c.fillRect(0, 0, this.w, this.hgt);
  }

  drawFog(px, py, s) {
    const c = this.ctx;
    c.save(); c.translate(px, py); c.fillStyle = this.fogPat; c.fillRect(0, 0, s, s); c.restore();
  }

  drawTile(ty, px, py, s, x, y) {
    const c = this.ctx, T = WORLD.T, r = WORLD.h2(x, y, 5), t = this.t;
    if (ty === T.SEA || ty === T.BRIDGE) {
      c.fillStyle = '#071019'; c.fillRect(px, py, s, s);
      if (r < 0.22) { c.strokeStyle = 'rgba(70,140,190,.18)'; c.lineWidth = 1; c.beginPath(); const yy = py + s * (0.3 + r * 2); c.moveTo(px + s * 0.2, yy); c.quadraticCurveTo(px + s * 0.4, yy - 3, px + s * 0.6, yy); c.quadraticCurveTo(px + s * 0.75, yy + 3, px + s * 0.85, yy); c.stroke(); }
      if (ty === T.BRIDGE) {
        c.fillStyle = 'rgba(70,224,208,.10)'; c.fillRect(px + s * 0.3, py, s * 0.4, s);
        c.strokeStyle = 'rgba(70,224,208,.8)'; c.setLineDash([4, 4]); c.lineDashOffset = -t / 3; c.beginPath(); c.moveTo(px + s / 2, py); c.lineTo(px + s / 2, py + s); c.stroke(); c.setLineDash([]);
      }
      return;
    }
    if (ty === T.NORTH) {
      c.fillStyle = '#0c0f15'; c.fillRect(px, py, s, s);
      c.strokeStyle = 'rgba(255,90,110,.10)'; c.lineWidth = 2; c.beginPath();
      for (let k = -s; k < s; k += 8) { c.moveTo(px + k, py + s); c.lineTo(px + k + s, py); }
      c.save(); c.beginPath(); c.rect(px, py, s, s); c.clip();
      c.beginPath(); for (let k = -s; k < s; k += 8) { c.moveTo(px + k, py + s); c.lineTo(px + k + s, py); } c.stroke(); c.restore();
      return;
    }
    const n = WORLD.noise(x * 0.5, y * 0.5, 7);
    const base = ty === T.CITY ? 18 : 14 + n * 6;
    c.fillStyle = `hsl(205, 22%, ${base * 0.6}%)`; c.fillRect(px, py, s, s);
    // 해안선
    const sea = (dx, dy) => { if (!WORLD.inb(x + dx, y + dy)) return false; const t2 = WORLD.type(x + dx, y + dy); return t2 === T.SEA || t2 === T.BRIDGE; };
    c.strokeStyle = 'rgba(70,224,208,.55)'; c.lineWidth = 1.5; c.beginPath();
    if (sea(0, -1)) { c.moveTo(px, py + 0.5); c.lineTo(px + s, py + 0.5); }
    if (sea(0, 1)) { c.moveTo(px, py + s - 0.5); c.lineTo(px + s, py + s - 0.5); }
    if (sea(-1, 0)) { c.moveTo(px + 0.5, py); c.lineTo(px + 0.5, py + s); }
    if (sea(1, 0)) { c.moveTo(px + s - 0.5, py); c.lineTo(px + s - 0.5, py + s); }
    c.stroke();
    if (ty === T.MOUNTAIN) {
      const k = 0.15 + r * 0.1;
      c.fillStyle = '#26364a';
      c.beginPath(); c.moveTo(px + s * k, py + s * 0.88); c.lineTo(px + s * 0.48, py + s * 0.16); c.lineTo(px + s * (0.85 - k / 2), py + s * 0.88); c.fill();
      c.fillStyle = '#3a5068';
      c.beginPath(); c.moveTo(px + s * 0.48, py + s * 0.16); c.lineTo(px + s * (0.85 - k / 2), py + s * 0.88); c.lineTo(px + s * 0.55, py + s * 0.88); c.fill();
      c.fillStyle = '#20303f';
      c.beginPath(); c.moveTo(px + s * 0.5, py + s * 0.9); c.lineTo(px + s * 0.74, py + s * 0.45); c.lineTo(px + s * 0.98, py + s * 0.9); c.fill();
      c.strokeStyle = 'rgba(140,190,230,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px + s * 0.36, py + s * 0.38); c.lineTo(px + s * 0.48, py + s * 0.16); c.lineTo(px + s * 0.6, py + s * 0.38); c.stroke();
    } else if (ty === T.RUIN) {
      for (let k = 0; k < 3; k++) {
        const bx = px + s * (0.12 + k * 0.28 + WORLD.h2(x, y, k) * 0.05), bh = s * (0.2 + WORLD.h2(x, y, k + 3) * 0.45), bw = s * 0.2;
        c.fillStyle = '#1b2633'; c.fillRect(bx, py + s * 0.88 - bh, bw, bh);
        c.fillStyle = '#2c3b4d'; c.beginPath(); c.moveTo(bx, py + s * 0.88 - bh); c.lineTo(bx + bw, py + s * 0.88 - bh + bw * 0.6); c.lineTo(bx + bw, py + s * 0.88 - bh); c.fill();
      }
      if (r < 0.18) { const a = 0.5 + Math.sin(t / 7 + r * 40) * 0.3; c.fillStyle = `rgba(255,140,60,${a})`; c.fillRect(px + s * 0.7, py + s * 0.75, 3, 3); }
    } else if (ty === T.ETHER) {
      const a = 0.22 + Math.sin(t / 30 + r * 10) * 0.08;
      const g = c.createRadialGradient(px + s / 2, py + s / 2, 1, px + s / 2, py + s / 2, s * 0.75);
      g.addColorStop(0, `rgba(197,120,255,${a + 0.15})`); g.addColorStop(1, 'rgba(197,120,255,0)');
      c.fillStyle = g; c.fillRect(px, py, s, s);
      const sx = px + s * (0.2 + ((r * 7 + t / 90) % 1) * 0.6), sy = py + s * (0.8 - ((r * 13 + t / 60) % 1) * 0.6);
      c.fillStyle = 'rgba(230,200,255,.8)'; c.fillRect(sx, sy, 2, 2);
    } else if (ty === T.PLAIN) {
      if (r < 0.3) { c.fillStyle = 'rgba(120,160,190,.10)'; c.fillRect(px + s * r * 2, py + s * 0.6, s * 0.25, 1.5); }
    } else if (ty === T.CITY) {
      c.fillStyle = 'rgba(70,224,208,.06)'; c.fillRect(px, py, s, s);
      for (let k = 0; k < 4; k++) {
        const bw = s * 0.17, bx = px + s * 0.08 + k * s * 0.22, bh = s * (0.3 + WORLD.h2(x, y, k + 11) * 0.55);
        c.fillStyle = '#152231'; c.fillRect(bx, py + s * 0.92 - bh, bw, bh);
        c.fillStyle = 'rgba(70,224,208,.35)'; c.fillRect(bx, py + s * 0.92 - bh, bw, 1.5);
        for (let wy = py + s * 0.92 - bh + 4; wy < py + s * 0.88; wy += 5) {
          if (WORLD.h2(k, Math.round(wy), x + y) < 0.45) { c.fillStyle = WORLD.h2(k, Math.round(wy), 3) < 0.25 ? 'rgba(255,181,71,.85)' : 'rgba(150,220,255,.6)'; c.fillRect(bx + 2, wy, bw - 4 > 2 ? 2 : 1, 2); }
        }
      }
    }
  }

  chip(cx, cy, text, color, bg) {
    const c = this.ctx;
    c.font = '600 11px "Chakra Petch", "IBM Plex Sans KR", sans-serif';
    const w = c.measureText(text).width + 10;
    c.fillStyle = bg || 'rgba(8,12,18,.85)'; c.fillRect(cx - w / 2, cy - 8, w, 16);
    c.strokeStyle = color; c.lineWidth = 1; c.strokeRect(cx - w / 2 + 0.5, cy - 7.5, w - 1, 15);
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, cx, cy + 0.5);
  }

  drawObjects() {
    const c = this.ctx, s = this.tile, t = this.t;
    const vis = (x, y) => G.revealed(x, y);
    // NPC 표식
    for (const n of G.npcs) {
      if (!n.alive || n.isCompanion) continue;
      const [x, y] = UI.npcPos(n);
      if (!vis(x, y) || G.objAt(x, y)) continue;
      const [px, py] = this.toScreen(x + 0.5, y + 0.5);
      if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
      const col = elemColor(n.element);
      c.save(); c.translate(px + s * 0.22, py - s * 0.18); c.rotate(Math.PI / 4);
      c.fillStyle = '#0a0f16'; c.fillRect(-s * 0.11, -s * 0.11, s * 0.22, s * 0.22);
      c.strokeStyle = col; c.lineWidth = n.met ? 2 : 1.2; c.strokeRect(-s * 0.11, -s * 0.11, s * 0.22, s * 0.22);
      if (n.relation <= -30) { c.fillStyle = '#ff5a6e'; c.fillRect(-s * 0.05, -s * 0.05, s * 0.1, s * 0.1); }
      c.restore();
    }
    // 괴수 무리
    for (const m of G.mobs) {
      if (!vis(m.x, m.y)) continue;
      const [px, py] = this.toScreen(m.x + 0.5, m.y + 0.5);
      if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
      const col = elemColor(m.elem), bob = Math.sin(t / 18 + m.id) * 1.5;
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(px, py + s * 0.32, s * 0.28, s * 0.08, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1d0e12'; c.beginPath(); c.arc(px, py + bob, s * 0.3, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 2; c.stroke();
      c.strokeStyle = col; c.lineWidth = 2.2; c.lineCap = 'round'; c.beginPath();
      for (let k = -1; k <= 1; k++) { c.moveTo(px - s * 0.12 + k * s * 0.1, py - s * 0.14 + bob); c.lineTo(px + s * 0.04 + k * s * 0.1, py + s * 0.14 + bob); }
      c.stroke(); c.lineCap = 'butt';
      this.chip(px, py + s * 0.48, `${RANKS[m.tier].key}·${m.count}`, RANKS[m.tier].color);
    }
    // 게이트
    for (const g of G.mapGates) {
      if (!vis(g.x, g.y)) continue;
      const [px, py] = this.toScreen(g.x + 0.5, g.y + 0.5);
      if (px < -s * 2 || py < -s * 2 || px > this.w + s * 2 || py > this.hgt + s * 2) continue;
      const col = g.final || g.variant === 'red' ? '#ff4f6a' : RANKS[g.tier].color;
      const sc = g.final ? 1.6 : 1;
      const glow = c.createRadialGradient(px, py, 1, px, py, s * 0.8 * sc);
      glow.addColorStop(0, g.final ? 'rgba(255,79,106,.55)' : 'rgba(214,92,255,.5)'); glow.addColorStop(1, 'rgba(214,92,255,0)');
      c.fillStyle = glow; c.beginPath(); c.arc(px, py, s * 0.8 * sc, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 3; k++) {
        c.save(); c.translate(px, py); c.rotate((t / (40 + k * 15)) * (k % 2 ? -1 : 1));
        c.strokeStyle = k === 1 ? '#d65cff' : col; c.lineWidth = 2 - k * 0.4; c.setLineDash([s * 0.25, s * 0.12]);
        c.beginPath(); c.ellipse(0, 0, s * (0.2 + k * 0.07) * sc, s * (0.32 + k * 0.07) * sc, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
      c.setLineDash([]);
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(px, py, s * 0.06 * sc, s * 0.16 * sc, 0, 0, Math.PI * 2); c.fill();
      this.chip(px, py + s * 0.5 * sc + 4, g.final ? '원초' : g.mission ? `임무·${RANKS[g.tier].key}` : g.bid ? `낙찰·${RANKS[g.tier].key}` : g.variant === 'red' ? `레드·${RANKS[g.tier].key}` : `${RANKS[g.tier].key}급`, g.mission || g.bid ? '#ffb547' : col);
    }
  }

  drawCities() {
    const c = this.ctx, s = this.tile;
    for (const reg of REGIONS) {
      const [x, y] = WORLD.cityPos[reg.id];
      const [px, py] = this.toScreen(x + 0.5, y - 0.6);
      if (px < -200 || py < -60 || px > this.w + 200 || py > this.hgt + 60) continue;
      const known = G.revealed(x, y);
      if (G.cityBreak && G.cityBreak(reg.id)) {
        const [bx, by] = this.toScreen(x + 0.5, y + 0.5); const pr = (this.t % 60) / 60;
        c.strokeStyle = `rgba(255,79,106,${1 - pr})`; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, s * (0.6 + pr * 1.4), 0, Math.PI * 2); c.stroke();
      }
      c.font = `700 ${s > 34 ? 13 : 11}px "IBM Plex Sans KR", sans-serif`;
      const name = reg.name;
      const w = c.measureText(name).width + 14;
      c.fillStyle = known ? 'rgba(8,14,22,.88)' : 'rgba(8,14,22,.6)';
      c.fillRect(px - w / 2, py - 10, w, 20);
      c.fillStyle = known ? (reg.guild ? GUILDS[reg.guild].color : '#46e0d0') : '#3a4658';
      c.fillRect(px - w / 2, py + 8, w, 2);
      c.fillStyle = known ? '#e3e8f1' : '#6b7790';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, px, py + 0.5);
      const dangerY = py - 16;
      if (known && s > 30) { c.fillStyle = ['#6bdc8b', '#9fdc6b', '#f0b35b', '#ff8a4c', '#ff4f6a'][reg.danger - 1]; for (let k = 0; k < reg.danger; k++) c.fillRect(px - reg.danger * 4 + k * 8 + 1, dangerY, 6, 3); }
    }
  }

  drawPlayer() {
    const c = this.ctx, s = this.tile, p = G.player;
    const pos = this.token || { x: p.x, y: p.y };
    let [px, py] = this.toScreen(pos.x + 0.5, pos.y + 0.5);
    if (pos.walking) py -= Math.abs(Math.sin(((pos.x + pos.y) % 1) * Math.PI)) * s * 0.12;
    const R = s * 0.42;
    const ring = RANKS[p.rankIdx].color;
    const pulse = (Math.sin(this.t / 15) + 1) / 2;
    c.strokeStyle = `rgba(70,224,208,${0.5 - pulse * 0.4})`; c.lineWidth = 2;
    c.beginPath(); c.arc(px, py, R + 4 + pulse * 6, 0, Math.PI * 2); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(px, py + R * 0.95, R * 0.9, R * 0.25, 0, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.clip();
    if (this.imgs.player && this.imgs.player.complete) c.drawImage(this.imgs.player, px - R, py - R, R * 2, R * 2);
    else { c.fillStyle = '#46e0d0'; c.fill(); }
    c.restore();
    c.strokeStyle = ring; c.lineWidth = 3; c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.stroke();
    // 동료
    const comp = G.companion();
    if (comp) {
      c.fillStyle = elemColor(comp.element); c.beginPath(); c.arc(px + R * 0.9, py + R * 0.75, R * 0.28, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#05080d'; c.lineWidth = 2; c.stroke();
    }
  }

  drawMini() {
    const m = this.mctx; if (!m || !G.player) return;
    const W = this.mini.width, H = this.mini.height, sx = W / WORLD.COLS, sy = H / WORLD.ROWS, T = WORLD.T;
    m.fillStyle = '#04060a'; m.fillRect(0, 0, W, H);
    for (let y = 0; y < WORLD.ROWS; y++) for (let x = 0; x < WORLD.COLS; x++) {
      const i = WORLD.idx(x, y), ty = WORLD.tiles[i];
      if (ty === T.SEA) continue;
      const known = G.fog[i];
      m.fillStyle = ty === T.NORTH ? '#121722' : !known ? '#141b26' : ty === T.CITY ? '#46e0d0' : ty === T.MOUNTAIN ? '#2f4258' : ty === T.ETHER ? '#5a3a80' : ty === T.BRIDGE ? '#1f5a5a' : '#22303f';
      m.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
    }
    for (const g of G.mapGates) if (G.revealed(g.x, g.y)) { m.fillStyle = g.final ? '#ff4f6a' : '#d65cff'; m.fillRect(g.x * sx - 1, g.y * sy - 1, sx + 2, sy + 2); }
    m.fillStyle = '#ffb547'; m.fillRect(G.player.x * sx - 2, G.player.y * sy - 2, sx + 4, sy + 4);
    // 현재 시야
    const vw = this.w / this.tile, vh = this.hgt / this.tile;
    m.strokeStyle = 'rgba(227,232,241,.7)'; m.lineWidth = 1;
    m.strokeRect((this.camX - vw / 2) * sx, (this.camY - vh / 2) * sy, vw * sx, vh * sy);
  }
}
