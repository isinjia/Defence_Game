// ===== 스킬 이펙트: 무기·컨셉별 모양 + 속성별 모양 (사용자 요청) =====
// 전에는 모든 스킬이 '속성 색 점이 날아가 터지는' 한 가지였다(js/fx3d.js). 여기서는 2D 캔버스 한 장 위에
//  - 스킬의 모양(form): 검기·내려찍기·창 찌르기·주먹·단검·화살·총알·폭탄·방패·마법구·광선·부적·저주·염동·발톱·물기·정령·음표·균열·지면 분출·빛기둥·회전
//  - 속성의 모양(element): 염=불꽃 혀, 뇌=갈라지는 번개, 수=물방울과 물결 고리, 목=잎과 가시, 성=십자 광채와 빛줄기, 암=검보라 연기와 공허
// 를 따로 그려 겹친다. 수·목·성은 색(파랑·초록·금색)뿐 아니라 입자 모양 자체가 달라 한눈에 구별된다.
// 좌표는 화면 px. 어떤 스킬이 어떤 모양을 쓰는지는 js/fx_forms_map.js 가 고른다.
const FXF = (() => {
  const TAU = Math.PI * 2;
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const ease = (k) => 1 - (1 - k) * (1 - k);
  // 속성 팔레트: main 몸통, hi 밝은 심, lo 어두운 가장자리
  const EL = {
    fire: { main: '#ff5a1f', hi: '#ffe08a', lo: '#b31d0a' },
    bolt: { main: '#ffe23d', hi: '#ffffff', lo: '#3f8cff' },
    water: { main: '#1e8bff', hi: '#c8f3ff', lo: '#0a3aa6' },
    wood: { main: '#34c14a', hi: '#d4fa86', lo: '#0f6a27' },
    holy: { main: '#ffcf3f', hi: '#fffbe8', lo: '#e07f00' },
    dark: { main: '#8f3dff', hi: '#e6c2ff', lo: '#16052b' },
    none: { main: '#cdd6e4', hi: '#ffffff', lo: '#66748c' },
  };
  const el = (e) => EL[e] || EL.none;

  const S = { cv: null, g: null, items: [], raf: 0, last: 0, manual: false, speed: () => 1, quality: () => 1 };
  function init() {
    if (S.cv) return true;
    if (typeof document === 'undefined') return false;
    const cv = document.createElement('canvas'); cv.id = 'fxf'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1250';
    document.body.appendChild(cv); S.cv = cv; S.g = cv.getContext('2d'); resize();
    window.addEventListener('resize', resize);
    return true;
  }
  function resize() { if (!S.cv) return; const d = Math.min(2, window.devicePixelRatio || 1); S.dpr = d; S.cv.width = Math.round(innerWidth * d); S.cv.height = Math.round(innerHeight * d); }
  function add(it) { it.t = -(it.delay || 0); S.items.push(it); kick(); return it; }
  const at = (delay, fn) => add({ delay, life: 0.001, once: fn });
  function kick() { if (S.manual || S.raf || !init()) return; S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
  function frame(now) { const dt = Math.min(0.05, (now - S.last) / 1000) * S.speed(); S.last = now; step(dt); S.raf = S.items.length ? requestAnimationFrame(frame) : 0; }
  function step(dt) {
    if (!init()) return; const g = S.g; g.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
    const arr = S.items; S.items = [];
    for (const it of arr) {
      it.t += dt; if (it.t < 0) { S.items.push(it); continue; }
      if (it.once) { if (!it.done) { it.done = 1; try { it.once(); } catch (e) { /* 무시 */ } } continue; }
      const k = it.t / it.life; if (k >= 1) { if (it.end) try { it.end(it); } catch (e) { /* 무시 */ } continue; }
      if (it.vx != null) { const d = Math.pow(it.drag ?? 1, dt * 60); it.vx = (it.vx + (it.ax || 0) * dt) * d; it.vy = (it.vy + (it.ay || 0) * dt) * d; it.x += it.vx * dt; it.y += it.vy * dt; if (it.vr) it.rot = (it.rot || 0) + it.vr * dt; }
      g.save(); try { it.draw(g, k, it, dt); } catch (e) { /* 무시 */ } g.restore();
      S.items.push(it);
    }
  }
  const N = (n) => Math.max(1, Math.round(n * S.quality()));

  // ---------- 기본 도형 ----------
  const P = {
    // 반짝 번지는 빛
    flash(x, y, r, col, life = 0.22, delay = 0) { add({ delay, life, draw(g, k) { g.globalCompositeOperation = 'lighter'; const rr = r * (0.5 + ease(k) * 0.7); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, rgba(col, 0.9 * (1 - k))); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } }); },
    // 퍼지는 고리 (sq: 세로 납작 비율 → 바닥 물결)
    ring(x, y, r0, r1, col, w = 3, life = 0.35, delay = 0, sq = 1) { add({ delay, life, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(col, 1 - k); g.lineWidth = w * (1 - k * 0.6); g.beginPath(); g.ellipse(x, y, r0 + (r1 - r0) * ease(k), (r0 + (r1 - r0) * ease(k)) * sq, 0, 0, TAU); g.stroke(); } }); },
    // 튀는 불티·파편: 진행 방향으로 늘어난 짧은 선
    spark(x, y, ang, spd, col, life = 0.3, w = 2, delay = 0, ay = 0) { add({ delay, life, x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, ay, drag: 0.9, draw(g, k, it) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(col, 1 - k); g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(it.x, it.y); g.lineTo(it.x - it.vx * 0.045, it.y - it.vy * 0.045); g.stroke(); } }); },
    dot(x, y, vx, vy, r, col, life = 0.5, o = {}) { add({ delay: o.delay, life, x, y, vx, vy, ay: o.ay || 0, drag: o.drag ?? 0.94, draw(g, k, it) { g.globalCompositeOperation = o.dark ? 'source-over' : 'lighter'; g.fillStyle = rgba(col, (o.a ?? 1) * (1 - k)); g.beginPath(); g.arc(it.x, it.y, r * (1 - k * 0.5), 0, TAU); g.fill(); } }); },
    // 양끝이 뾰족한 빛줄기
    streak(x1, y1, x2, y2, w, col, hi, life = 0.2, delay = 0) { add({ delay, life, draw(g, k) { const a = Math.atan2(y2 - y1, x2 - x1), nx = Math.sin(a), ny = -Math.cos(a), mx = (x1 + x2) / 2, my = (y1 + y2) / 2; g.globalCompositeOperation = 'lighter'; for (const [ww, c, al] of [[w * 2.4, col, 0.35], [w, col, 0.9], [w * 0.4, hi, 1]]) { const h = ww * (1 - k) / 2; g.fillStyle = rgba(c, al * (1 - k * k)); g.beginPath(); g.moveTo(x1, y1); g.lineTo(mx + nx * h, my + ny * h); g.lineTo(x2, y2); g.lineTo(mx - nx * h, my - ny * h); g.closePath(); g.fill(); } } }); },
    // 초승달 검기: (x,y) 중심, ang 방향으로 배가 나온 초승달. grow 로 커지며 vx,vy 로 나아간다
    crescent(o) {
      const E = el(o.el); add({ delay: o.delay, life: o.life || 0.3, x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, drag: o.drag ?? 1, end: o.end, draw(g, k, it) {
        const r = o.r * (1 + (o.grow || 0) * ease(k)), span = (o.span || 2.2) * Math.min(1, k / 0.25 + 0.15), th = (o.th || 0.42) * r * (1 - k * 0.55);
        g.translate(it.x, it.y); g.rotate(o.ang); g.globalCompositeOperation = o.el === 'dark' ? 'source-over' : 'lighter';
        const a1 = -span / 2, a2 = span / 2, al = 1 - k * k;
        const path = (rr, inner) => { g.beginPath(); g.arc(0, 0, rr, a1, a2); const x2 = Math.cos(a1) * rr, y2 = Math.sin(a1) * rr; g.quadraticCurveTo(Math.cos(0) * (rr - inner), 0, x2, y2); g.closePath(); };
        path(r * 1.06, th * 1.5); g.fillStyle = rgba(E.main, 0.28 * al); g.fill();
        path(r, th); const gr = g.createLinearGradient(r - th, 0, r, 0); gr.addColorStop(0, rgba(E.lo, 0.15 * al)); gr.addColorStop(0.55, rgba(E.main, 0.95 * al)); gr.addColorStop(1, rgba(E.hi, al)); g.fillStyle = gr; g.fill();
        g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(E.hi, al); g.lineWidth = Math.max(1, r * 0.035); g.beginPath(); g.arc(0, 0, r, a1, a2); g.stroke();
      } });
    },
    // 잎: 빙글 도는 잎사귀 (목)
    leaf(x, y, vx, vy, s, col, vein, life = 0.7, delay = 0) { add({ delay, life, x, y, vx, vy, ay: 160, drag: 0.93, rot: R(0, TAU), vr: R(-9, 9), draw(g, k, it) { g.translate(it.x, it.y); g.rotate(it.rot); g.scale(1, 0.55 + 0.45 * Math.cos(it.t * 9)); g.globalAlpha = 1 - k * k; g.fillStyle = col; g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.75, s, 0); g.quadraticCurveTo(0, s * 0.75, -s, 0); g.fill(); g.strokeStyle = vein; g.lineWidth = 1; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); } }); },
    // 물방울: 진행 방향으로 꼬리가 긴 방울 (수)
    drop(x, y, vx, vy, s, col, hi, life = 0.55, delay = 0) { add({ delay, life, x, y, vx, vy, ay: 620, drag: 0.985, draw(g, k, it) { g.translate(it.x, it.y); g.rotate(Math.atan2(it.vy, it.vx)); g.globalAlpha = 1 - k * k; g.fillStyle = col; g.beginPath(); g.moveTo(s, 0); g.bezierCurveTo(s, s * 0.9, -s * 0.4, s * 0.7, -s * 2.2, 0); g.bezierCurveTo(-s * 0.4, -s * 0.7, s, -s * 0.9, s, 0); g.fill(); g.fillStyle = hi; g.beginPath(); g.arc(s * 0.3, -s * 0.25, s * 0.28, 0, TAU); g.fill(); } }); },
    // 불꽃 혀: 위로 오르며 흔들리는 눈물꼴 (염)
    flame(x, y, s, E, life = 0.45, delay = 0) { const ph = R(0, TAU), dx = R(-18, 18); add({ delay, life, draw(g, k) { const yy = y - k * s * 2.4, xx = x + dx * k + Math.sin(ph + k * 9) * s * 0.25, ss = s * (1 - k * 0.7); g.globalCompositeOperation = 'lighter'; for (const [m, c, a] of [[1, E.lo, 0.55], [0.72, E.main, 0.9], [0.4, E.hi, 1]]) { const q = ss * m; g.fillStyle = rgba(c, a * (1 - k)); g.beginPath(); g.moveTo(xx, yy - q * 1.7); g.bezierCurveTo(xx + q * 1.1, yy - q * 0.3, xx + q * 0.8, yy + q * 0.9, xx, yy + q * 0.9); g.bezierCurveTo(xx - q * 0.8, yy + q * 0.9, xx - q * 1.1, yy - q * 0.3, xx, yy - q * 1.7); g.fill(); } } }); },
    // 십자 광채: 네 갈래 빛 (성)
    cross(x, y, s, E, life = 0.4, delay = 0, rot = 0) { add({ delay, life, draw(g, k) { const ss = s * (0.5 + ease(k) * 0.8), al = 1 - k * k; g.translate(x, y); g.rotate(rot); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); const L = i % 2 ? ss : ss * 1.7; g.fillStyle = rgba(E.main, 0.85 * al); g.beginPath(); g.moveTo(0, -ss * 0.16); g.lineTo(L, 0); g.lineTo(0, ss * 0.16); g.fill(); g.fillStyle = rgba(E.hi, al); g.beginPath(); g.moveTo(0, -ss * 0.07); g.lineTo(L * 0.8, 0); g.lineTo(0, ss * 0.07); g.fill(); } g.fillStyle = rgba(E.hi, al); g.beginPath(); g.arc(0, 0, ss * 0.22, 0, TAU); g.fill(); } }); },
    // 연기: 어둡게 덮는 덩이 (암) — 더하기 섞기가 아니라 덮어 그려 검보라가 그대로 보인다
    smoke(x, y, r, E, life = 0.7, delay = 0, vx = 0, vy = -30) { add({ delay, life, x, y, vx, vy, drag: 0.96, draw(g, k, it) { const rr = r * (0.6 + k * 0.9); const gr = g.createRadialGradient(it.x, it.y, 0, it.x, it.y, rr); gr.addColorStop(0, rgba(E.lo, 0.85 * (1 - k))); gr.addColorStop(0.6, rgba(E.main, 0.4 * (1 - k))); gr.addColorStop(1, rgba(E.main, 0)); g.fillStyle = gr; g.beginPath(); g.arc(it.x, it.y, rr, 0, TAU); g.fill(); } }); },
    // 번개 가지: 꺾이며 갈라지는 줄기 (뇌)
    fork(x1, y1, x2, y2, E, w = 3, life = 0.22, delay = 0, branch = 2) {
      const mk = (ax, ay, bx, by, n, amp) => { const pts = [[ax, ay]]; const a = Math.atan2(by - ay, bx - ax), nx = Math.sin(a), ny = -Math.cos(a); for (let i = 1; i < n; i++) { const t = i / n, o = R(-amp, amp); pts.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o]); } pts.push([bx, by]); return pts; };
      const len = Math.hypot(x2 - x1, y2 - y1); const main = mk(x1, y1, x2, y2, Math.max(4, Math.round(len / 22)), Math.min(18, len * 0.12)); const subs = [];
      for (let i = 0; i < branch; i++) { const p = main[Math.floor(R(1, main.length - 1))], a = Math.atan2(y2 - y1, x2 - x1) + R(-1.1, 1.1), L = len * R(0.18, 0.35); subs.push(mk(p[0], p[1], p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L, 4, 8)); }
      add({ delay, life, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.lineJoin = 'miter'; const al = k < 0.5 ? 1 : 1 - (k - 0.5) * 2; const line = (pts, ww) => { for (const [m, c, a] of [[3, E.lo, 0.35], [1.4, E.main, 0.9], [0.5, E.hi, 1]]) { g.strokeStyle = rgba(c, a * al); g.lineWidth = ww * m; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }; line(main, w); subs.forEach((s) => line(s, w * 0.55)); } });
    },
  };

  // ---------- 속성 타격 모양: 맞은 자리에서 속성마다 다른 것이 튄다 ----------
  function accent(e, x, y, sc = 1, delay = 0) {
    const E = el(e);
    if (e === 'fire') { P.flash(x, y, 46 * sc, E.main, 0.25, delay); for (let i = 0; i < N(7); i++) P.flame(x + R(-16, 16) * sc, y + R(-4, 14) * sc, R(9, 16) * sc, E, R(0.35, 0.6), delay + R(0, 0.08)); for (let i = 0; i < N(8); i++) P.spark(x, y, R(-Math.PI, 0), R(120, 300) * sc, E.hi, R(0.3, 0.5), 2, delay, 260); }
    else if (e === 'bolt') { P.flash(x, y, 52 * sc, E.hi, 0.16, delay); for (let i = 0; i < N(4); i++) { const a = R(0, TAU), L = R(34, 62) * sc; P.fork(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, E, 2.4 * sc, 0.2, delay + i * 0.03, 1); } for (let i = 0; i < N(8); i++) P.spark(x, y, R(0, TAU), R(200, 420) * sc, E.main, 0.2, 1.6, delay); }
    else if (e === 'water') { P.ring(x, y + 14 * sc, 8 * sc, 46 * sc, E.hi, 3, 0.45, delay, 0.32); P.ring(x, y + 14 * sc, 4 * sc, 30 * sc, E.main, 2.5, 0.5, delay + 0.08, 0.32); for (let i = 0; i < N(11); i++) { const a = -Math.PI / 2 + R(-0.95, 0.95), v = R(120, 230) * sc; P.drop(x + R(-6, 6), y, Math.cos(a) * v, Math.sin(a) * v, R(3.5, 6.5) * sc, i % 3 ? E.main : E.hi, '#ffffff', R(0.45, 0.7), delay); } }
    else if (e === 'wood') { P.ring(x, y, 6 * sc, 34 * sc, E.hi, 2.5, 0.3, delay); for (let i = 0; i < N(9); i++) { const a = R(0, TAU), v = R(120, 260) * sc; P.leaf(x, y, Math.cos(a) * v, Math.sin(a) * v - 70, R(5.5, 9) * sc, i % 4 === 0 ? '#ff9fd0' : (i % 2 ? E.main : E.hi), E.lo, R(0.55, 0.9), delay); } thorns(x, y + 12 * sc, E, sc, delay); }
    else if (e === 'holy') { P.cross(x, y, 26 * sc, E, 0.45, delay, Math.PI / 4 * 0); P.ring(x, y, 8 * sc, 42 * sc, E.hi, 2.5, 0.4, delay); for (let i = 0; i < N(8); i++) { const a = i / 8 * TAU; P.streak(x + Math.cos(a) * 14 * sc, y + Math.sin(a) * 14 * sc, x + Math.cos(a) * 52 * sc, y + Math.sin(a) * 52 * sc, 3 * sc, E.main, E.hi, 0.3, delay + 0.03); } for (let i = 0; i < N(6); i++) P.dot(x + R(-18, 18) * sc, y + R(-6, 12) * sc, 0, R(-90, -40), R(1.6, 2.8), E.hi, R(0.5, 0.8), { delay }); }
    else if (e === 'dark') { for (let i = 0; i < N(6); i++) P.smoke(x + R(-14, 14) * sc, y + R(-10, 10) * sc, R(16, 26) * sc, E, R(0.5, 0.8), delay + R(0, 0.06), R(-30, 30), R(-40, 10)); add({ delay, life: 0.4, draw(g, k) { const r = 15 * sc * (1 - k * 0.6); g.fillStyle = rgba('#07010f', 0.95 * (1 - k)); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = rgba(E.hi, 1 - k); g.lineWidth = 2; g.stroke(); } }); for (let i = 0; i < N(6); i++) { const a = i / 6 * TAU + R(-0.2, 0.2); P.streak(x + Math.cos(a) * 12 * sc, y + Math.sin(a) * 12 * sc, x + Math.cos(a) * R(34, 50) * sc, y + Math.sin(a) * R(34, 50) * sc, 5 * sc, E.main, E.hi, 0.32, delay + 0.04); } P.ring(x, y, 6 * sc, 36 * sc, E.hi, 2, 0.35, delay); }
    else { P.flash(x, y, 34 * sc, E.hi, 0.16, delay); P.ring(x, y, 5 * sc, 30 * sc, E.main, 2, 0.25, delay); for (let i = 0; i < N(9); i++) P.spark(x, y, R(0, TAU), R(160, 340) * sc, i % 2 ? E.hi : E.main, 0.25, 1.8, delay); }
  }
  // 바닥에서 솟는 가시 (목)
  function thorns(x, y, E, sc = 1, delay = 0, n = 3) { for (let i = 0; i < N(n); i++) { const dx = (i - (n - 1) / 2) * 15 * sc + R(-4, 4), h = R(22, 36) * sc, lean = R(-0.35, 0.35); add({ delay: delay + i * 0.03, life: 0.5, draw(g, k) { const up = Math.min(1, k / 0.25), al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1; g.translate(x + dx, y); g.rotate(lean); g.globalAlpha = al; g.fillStyle = E.lo; g.beginPath(); g.moveTo(-5 * sc, 0); g.quadraticCurveTo(-2 * sc, -h * up * 0.6, 0, -h * up); g.quadraticCurveTo(3 * sc, -h * up * 0.6, 5 * sc, 0); g.fill(); g.fillStyle = E.main; g.beginPath(); g.moveTo(-2.5 * sc, 0); g.quadraticCurveTo(-1 * sc, -h * up * 0.6, 0, -h * up * 0.96); g.quadraticCurveTo(1.5 * sc, -h * up * 0.6, 2.5 * sc, 0); g.fill(); } }); } }
  // 지나가는 자리에 남는 속성 자국 (투사체 꼬리)
  function trail(e, x, y, sc = 1) {
    const E = el(e);
    if (e === 'fire') { if (Math.random() < 0.7) P.flame(x + R(-4, 4), y + R(-4, 4), R(5, 9) * sc, E, 0.28); }
    else if (e === 'bolt') { if (Math.random() < 0.5) P.spark(x, y, R(0, TAU), R(60, 160), E.main, 0.16, 1.4); }
    else if (e === 'water') { if (Math.random() < 0.6) P.drop(x, y, R(-40, 40), R(-60, 20), R(2, 3.6) * sc, E.main, E.hi, 0.35); }
    else if (e === 'wood') { if (Math.random() < 0.45) P.leaf(x, y, R(-50, 50), R(-50, 30), R(3.5, 5.5) * sc, Math.random() < 0.5 ? E.main : E.hi, E.lo, 0.45); }
    else if (e === 'holy') { if (Math.random() < 0.6) P.dot(x + R(-5, 5), y + R(-5, 5), 0, R(-30, 0), R(1.4, 2.4) * sc, E.hi, 0.3); }
    else if (e === 'dark') { if (Math.random() < 0.6) P.smoke(x, y, R(7, 11) * sc, E, 0.4, 0, 0, R(-10, 10)); }
    else if (Math.random() < 0.4) P.dot(x, y, R(-20, 20), R(-20, 20), 1.6 * sc, E.hi, 0.2);
  }
  // 날아가는 것: draw(g, ang, k) 를 진행 방향으로 돌려 그린다. arc 는 포물선 높이
  function fly(o) {
    const dur = o.dur || Math.max(0.1, Math.hypot(o.to.x - o.from.x, o.to.y - o.from.y) / (o.speed || 900));
    add({ delay: o.delay, life: dur, end: () => { if (o.hit) o.hit(o.to.x, o.to.y, Math.atan2(o.to.y - o.from.y, o.to.x - o.from.x)); }, draw(g, k) {
      const kk = o.ease ? ease(k) : k; const x = o.from.x + (o.to.x - o.from.x) * kk, y = o.from.y + (o.to.y - o.from.y) * kk - Math.sin(kk * Math.PI) * (o.arc || 0);
      const k2 = Math.min(1, kk + 0.02); const x2 = o.from.x + (o.to.x - o.from.x) * k2, y2 = o.from.y + (o.to.y - o.from.y) * k2 - Math.sin(k2 * Math.PI) * (o.arc || 0);
      const ang = Math.atan2(y2 - y, x2 - x) || Math.atan2(o.to.y - o.from.y, o.to.x - o.from.x);
      if (o.el !== undefined && !o.noTrail) trail(o.el, x, y, o.sc || 1);
      g.translate(x, y); g.rotate(ang + (o.spin ? o.spin * k * TAU : 0)); o.draw(g, k, ang);
    } });
    return dur + (o.delay || 0);
  }

  // ---------- 무기·컨셉 그림 ----------
  const SHAPE = {
    arrow(g, E, s = 1) { g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#d9c7a1'; g.lineWidth = 2.2 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-26 * s, 0); g.lineTo(8 * s, 0); g.stroke(); g.fillStyle = E.main; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(-26 * s, 0); g.lineTo(-33 * s, d * 6 * s); g.lineTo(-20 * s, d * 1 * s); g.fill(); } g.fillStyle = E.hi; g.beginPath(); g.moveTo(15 * s, 0); g.lineTo(4 * s, -5 * s); g.lineTo(7 * s, 0); g.lineTo(4 * s, 5 * s); g.closePath(); g.fill(); g.strokeStyle = E.main; g.lineWidth = 1; g.stroke(); },
    fist(g, E, s = 1, al = 1) { // 진행 방향(+x)으로 내지른 주먹: 손등 + 네 손가락 마디 + 엄지
      g.globalAlpha = al; g.lineJoin = 'round'; g.lineWidth = 2 * s; g.strokeStyle = E.lo;
      const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); };
      g.fillStyle = E.lo; rr(-30 * s, -10 * s, 16 * s, 20 * s, 4 * s); g.fill(); // 손목
      g.fillStyle = E.main; rr(-20 * s, -17 * s, 28 * s, 34 * s, 9 * s); g.fill(); g.stroke(); // 손등
      for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? E.main : E.hi; rr(4 * s, (-17 + i * 8.5) * s, 15 * s, 8.5 * s, 4 * s); g.fill(); g.stroke(); } // 손가락 마디
      g.fillStyle = E.hi; rr(-8 * s, 10 * s, 20 * s, 9 * s, 4.5 * s); g.fill(); g.stroke(); // 엄지
    },
    dagger(g, E, s = 1) { g.fillStyle = E.hi; g.beginPath(); g.moveTo(18 * s, 0); g.lineTo(-4 * s, -4 * s); g.lineTo(-4 * s, 4 * s); g.fill(); g.fillStyle = E.lo; g.fillRect(-12 * s, -2 * s, 8 * s, 4 * s); g.fillStyle = E.main; g.fillRect(-5 * s, -6 * s, 2.5 * s, 12 * s); },
    spear(g, E, s = 1) { g.strokeStyle = '#8a7350'; g.lineWidth = 3 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-58 * s, 0); g.lineTo(6 * s, 0); g.stroke(); g.fillStyle = E.hi; g.beginPath(); g.moveTo(30 * s, 0); g.lineTo(6 * s, -6 * s); g.lineTo(2 * s, 0); g.lineTo(6 * s, 6 * s); g.closePath(); g.fill(); g.strokeStyle = E.main; g.lineWidth = 1.5; g.stroke(); },
    bullet(g, E, s = 1) { g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(-46 * s, 0, 6 * s, 0); gr.addColorStop(0, rgba(E.main, 0)); gr.addColorStop(1, rgba(E.hi, 1)); g.strokeStyle = gr; g.lineWidth = 3 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-46 * s, 0); g.lineTo(6 * s, 0); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(6 * s, 0, 2.4 * s, 0, TAU); g.fill(); },
    bomb(g, E, s = 1) { g.fillStyle = '#1b2230'; g.strokeStyle = E.main; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 9 * s, 0, TAU); g.fill(); g.stroke(); g.fillStyle = E.hi; g.beginPath(); g.arc(-3 * s, -3 * s, 2.4 * s, 0, TAU); g.fill(); g.strokeStyle = '#c9b48a'; g.beginPath(); g.moveTo(5 * s, -7 * s); g.quadraticCurveTo(10 * s, -14 * s, 14 * s, -11 * s); g.stroke(); g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(14 * s, -11 * s, 2.6 * s, 0, TAU); g.fill(); },
    flask(g, E, s = 1) { g.fillStyle = rgba(E.main, 0.9); g.strokeStyle = '#dfe9f5'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-3 * s, -11 * s); g.lineTo(3 * s, -11 * s); g.lineTo(3 * s, -4 * s); g.lineTo(9 * s, 8 * s); g.lineTo(-9 * s, 8 * s); g.lineTo(-3 * s, -4 * s); g.closePath(); g.fill(); g.stroke(); g.fillStyle = E.hi; g.beginPath(); g.arc(-2 * s, 3 * s, 2 * s, 0, TAU); g.fill(); },
    shield(g, E, s = 1) { g.fillStyle = E.lo; g.strokeStyle = E.hi; g.lineWidth = 2.5 * s; g.lineJoin = 'round'; g.beginPath(); g.moveTo(0, -22 * s); g.lineTo(18 * s, -15 * s); g.lineTo(16 * s, 6 * s); g.quadraticCurveTo(10 * s, 20 * s, 0, 25 * s); g.quadraticCurveTo(-10 * s, 20 * s, -16 * s, 6 * s); g.lineTo(-18 * s, -15 * s); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = E.main; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(0, -12 * s); g.lineTo(0, 14 * s); g.moveTo(-9 * s, -3 * s); g.lineTo(9 * s, -3 * s); g.stroke(); },
    talisman(g, E, s = 1) { g.fillStyle = '#f3e7c2'; g.strokeStyle = '#8a6a2a'; g.lineWidth = 1; g.fillRect(-7 * s, -15 * s, 14 * s, 30 * s); g.strokeRect(-7 * s, -15 * s, 14 * s, 30 * s); g.strokeStyle = E.main === '#cdd6e4' ? '#c0281c' : E.main; g.lineWidth = 2 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3 * s, -10 * s); g.lineTo(3 * s, -10 * s); g.moveTo(0, -10 * s); g.lineTo(0, 9 * s); g.moveTo(-4 * s, -3 * s); g.lineTo(4 * s, -3 * s); g.moveTo(-4 * s, 4 * s); g.quadraticCurveTo(0, 0, 4 * s, 4 * s); g.stroke(); },
    note(g, E, s = 1) { g.fillStyle = E.main; g.strokeStyle = E.hi; g.lineWidth = 2 * s; g.beginPath(); g.ellipse(-4 * s, 8 * s, 6 * s, 4.4 * s, -0.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(1.5 * s, 7 * s); g.lineTo(1.5 * s, -12 * s); g.quadraticCurveTo(10 * s, -10 * s, 9 * s, -2 * s); g.stroke(); },
    wisp(g, E, s = 1, t = 0) { g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 14 * s); gr.addColorStop(0, rgba(E.hi, 1)); gr.addColorStop(0.5, rgba(E.main, 0.8)); gr.addColorStop(1, rgba(E.main, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 14 * s, 0, TAU); g.fill(); g.fillStyle = rgba(E.main, 0.7); g.beginPath(); g.moveTo(-4 * s, -7 * s); g.quadraticCurveTo(-26 * s, Math.sin(t * 20) * 6 * s, -34 * s, 0); g.quadraticCurveTo(-26 * s, 5 * s, -4 * s, 7 * s); g.fill(); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#10131c'; g.beginPath(); g.arc(4 * s, -3 * s, 1.8 * s, 0, TAU); g.arc(4 * s, 3 * s, 1.8 * s, 0, TAU); g.fill(); },
    orb(g, E, s = 1, dark = false) { if (dark) { g.fillStyle = '#07010f'; g.beginPath(); g.arc(0, 0, 10 * s, 0, TAU); g.fill(); g.strokeStyle = E.hi; g.lineWidth = 2; g.stroke(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(E.main, 0.7); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 14 * s, 0, TAU); g.stroke(); return; } g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 15 * s); gr.addColorStop(0, rgba(E.hi, 1)); gr.addColorStop(0.45, rgba(E.main, 0.95)); gr.addColorStop(1, rgba(E.lo, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 15 * s, 0, TAU); g.fill(); },
  };
  // 발톱 자국 세 줄
  function claw(x, y, E, sc = 1, delay = 0, ang = -0.9) { for (let i = 0; i < 3; i++) { const off = (i - 1) * 13 * sc; const nx = Math.cos(ang + Math.PI / 2) * off, ny = Math.sin(ang + Math.PI / 2) * off, L = (i === 1 ? 46 : 38) * sc; P.streak(x + nx - Math.cos(ang) * L, y + ny - Math.sin(ang) * L, x + nx + Math.cos(ang) * L, y + ny + Math.sin(ang) * L, 7 * sc, E.main, E.hi, 0.3, delay + i * 0.035); } }
  // 위아래 이빨이 닫힌다
  function bite(x, y, E, sc = 1, delay = 0) { add({ delay, life: 0.4, draw(g, k) { const close = Math.min(1, k / 0.35), al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1, gap = 26 * sc * (1 - close); g.globalAlpha = al; for (const d of [-1, 1]) { g.fillStyle = E.hi; g.strokeStyle = E.lo; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const tx = x + (i - 2) * 12 * sc, base = y + d * (gap + 18 * sc), tip = y + d * gap; g.beginPath(); g.moveTo(tx - 6 * sc, base); g.lineTo(tx, tip); g.lineTo(tx + 6 * sc, base); g.closePath(); g.fill(); g.stroke(); } } } }); }
  // 충격선: 만화식으로 사방에 뻗는 굵은 선 (주먹·방패)
  function impactLines(x, y, E, sc = 1, delay = 0, n = 10) { for (let i = 0; i < n; i++) { const a = i / n * TAU + R(-0.12, 0.12), r0 = R(16, 24) * sc, r1 = R(44, 66) * sc; P.streak(x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, 6 * sc, E.main, E.hi, 0.25, delay); } P.ring(x, y, 10 * sc, 56 * sc, E.hi, 4, 0.3, delay); }
  // 문양: 원 + 별 (저주·결계·봉인)
  function sigil(x, y, r, E, life = 0.7, delay = 0, pts = 5) { const rot0 = R(0, TAU); add({ delay, life, draw(g, k) { const al = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8, rr = r * (0.7 + 0.3 * Math.min(1, k / 0.2)); g.translate(x, y); g.rotate(rot0 + k * 1.6); g.globalCompositeOperation = E === EL.dark ? 'source-over' : 'lighter'; g.strokeStyle = rgba(E.main, al); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, rr * 0.72, 0, TAU); g.stroke(); g.strokeStyle = rgba(E.hi, al); g.lineWidth = 1.8; g.beginPath(); for (let i = 0; i <= pts; i++) { const a = i * (Math.floor(pts / 2) * TAU / pts); const px = Math.cos(a) * rr * 0.72, py = Math.sin(a) * rr * 0.72; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); } }); }

  // ---------- 모양별 연출 ----------
  // from/to: {x, y, w, h}. o: { el, type(스킬 종류), big(치명), then(맞는 순간 부를 것) }
  const hitAt = (o, x, y, sc = 1) => { accent(o.el, x, y, sc * (o.big ? 1.35 : 1)); if (o.then) { const f = o.then; o.then = null; f(); } };
  const dirOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const FORM = {
    // 검기: 초승달 칼바람이 날아가 베고 지나간다
    slash(from, to, o) {
      const E = el(o.el), a = dirOf(from, to), sc = o.big ? 1.3 : 1, d = Math.hypot(to.x - from.x, to.y - from.y), T = Math.max(0.12, d / 1500);
      const one = (delay, tilt, size) => { P.crescent({ x: from.x + Math.cos(a) * 24, y: from.y + Math.sin(a) * 24, ang: a + tilt, r: 38 * size, th: 0.5, span: 2.3, el: o.el, life: T, delay, vx: (to.x - from.x - Math.cos(a) * 24) / T, vy: (to.y - from.y - Math.sin(a) * 24) / T, grow: 0.35 }); at(delay + T * 0.92, () => { P.streak(to.x - Math.cos(a + tilt + 1.57) * 44 * size, to.y - Math.sin(a + tilt + 1.57) * 44 * size, to.x + Math.cos(a + tilt + 1.57) * 44 * size, to.y + Math.sin(a + tilt + 1.57) * 44 * size, 9 * size, E.main, E.hi, 0.22); }); };
      if (o.type === 'multi') { [[0, 0.5], [0.09, -0.55], [0.18, 0.15]].forEach(([dl, t]) => one(dl, t, 0.85)); at(T + 0.18, () => hitAt(o, to.x, to.y, 0.9)); }
      else if (o.type === 'crit' || o.big) { one(0, 0.6, sc * 1.1); one(0.05, -0.6, sc * 1.1); at(T + 0.05, () => { hitAt(o, to.x, to.y, 1.1); }); }
      else if (o.type === 'pierce') { // 일섬: 가는 선 하나가 대상을 꿰뚫고 지나간 뒤 터진다
        const ex = to.x + Math.cos(a) * 90, ey = to.y + Math.sin(a) * 90; P.streak(from.x, from.y, ex, ey, 5, E.main, E.hi, 0.28); at(0.12, () => { P.streak(to.x - Math.cos(a) * 70, to.y - Math.sin(a) * 70, ex, ey, 14, E.main, E.hi, 0.2); hitAt(o, to.x, to.y); });
      } else { one(0, R(-0.35, 0.35), sc); at(T, () => hitAt(o, to.x, to.y)); }
    },
    // 내려찍기: 위에서 아래로 굵은 한 줄 + 바닥 갈라짐
    cleave(from, to, o) {
      const E = el(o.el), sc = o.big ? 1.3 : 1;
      P.crescent({ x: to.x - 10, y: to.y - 46 * sc, ang: Math.PI / 2, r: 44 * sc, th: 0.62, span: 2.6, el: o.el, life: 0.2, vy: 260, grow: 0.2 });
      at(0.13, () => { P.streak(to.x, to.y - 78 * sc, to.x, to.y + 30 * sc, 16 * sc, E.main, E.hi, 0.25); for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i - 2) * 0.5; P.streak(to.x, to.y + 26 * sc, to.x + Math.cos(a) * R(40, 70) * sc * (i === 2 ? 0.3 : 1), to.y + 26 * sc + Math.abs(Math.sin(a)) * 10, 5 * sc, E.lo, E.main, 0.4); } P.ring(to.x, to.y + 26 * sc, 10, 70 * sc, E.hi, 3, 0.35, 0, 0.28); hitAt(o, to.x, to.y, 1.15); });
    },
    // 창 찌르기: 창이 곧게 뻗어 찌른다
    thrust(from, to, o) {
      const E = el(o.el), a = dirOf(from, to), n = o.type === 'multi' ? 4 : 1;
      for (let i = 0; i < n; i++) { const ox = n > 1 ? R(-14, 14) : 0, oy = n > 1 ? R(-12, 12) : 0, tt = { x: to.x + ox, y: to.y + oy }; fly({ from: { x: from.x + Math.cos(a) * 20, y: from.y + Math.sin(a) * 20 }, to: tt, dur: 0.11, delay: i * 0.085, el: o.el, noTrail: true, draw: (g) => SHAPE.spear(g, E, o.big ? 1.25 : 1), hit: (x, y) => { P.streak(x - Math.cos(a) * 110, y - Math.sin(a) * 110, x + Math.cos(a) * (o.type === 'pierce' ? 120 : 26), y + Math.sin(a) * (o.type === 'pierce' ? 120 : 26), o.type === 'pierce' ? 12 : 7, E.main, E.hi, 0.22); P.ring(x, y, 4, 26, E.hi, 2.5, 0.2); if (i === n - 1) hitAt(o, to.x, to.y); } }); }
    },
    // 주먹: 주먹이 날아가 꽂히고 충격선이 터진다
    fist(from, to, o) {
      const E = el(o.el), a = dirOf(from, to), sc = o.big ? 1.3 : 1;
      if (o.type === 'multi') { for (let i = 0; i < 5; i++) { const tt = { x: to.x + R(-22, 22), y: to.y + R(-20, 20) }; fly({ from: { x: tt.x - Math.cos(a) * 70, y: tt.y - Math.sin(a) * 70 }, to: tt, dur: 0.07, delay: i * 0.07, el: o.el, noTrail: true, draw: (g, k) => SHAPE.fist(g, E, 0.75 + k * 0.25), hit: (x, y) => { P.ring(x, y, 6, 30, E.hi, 3, 0.18); for (let j = 0; j < 4; j++) P.spark(x, y, R(0, TAU), R(160, 300), E.main, 0.2, 2); if (i === 4) { impactLines(to.x, to.y, E, 0.9); hitAt(o, to.x, to.y); } } }); } return; }
      if (o.type === 'pierce') { // 장풍: 반투명한 큰 주먹이 뚫고 지나간다
        const ex = { x: to.x + Math.cos(a) * 70, y: to.y + Math.sin(a) * 70 }; fly({ from, to: ex, dur: 0.3, el: o.el, draw: (g, k) => { SHAPE.fist(g, E, 1.2 + k * 0.9, 0.75 * (1 - k * 0.6)); } }); for (let i = 0; i < 3; i++) at(0.06 + i * 0.07, () => { const k = 0.3 + i * 0.25; P.ring(from.x + (ex.x - from.x) * k, from.y + (ex.y - from.y) * k, 8, 40, E.hi, 3, 0.25, 0, 0.6); }); at(0.2, () => hitAt(o, to.x, to.y, 1.1)); return;
      }
      const start = o.type === 'stun' ? { x: to.x, y: to.y - 130 } : from;
      fly({ from: start, to, dur: o.type === 'stun' ? 0.14 : Math.max(0.1, Math.hypot(to.x - start.x, to.y - start.y) / 1300), el: o.el, draw: (g, k) => SHAPE.fist(g, E, (0.7 + k * 0.6) * sc), hit: (x, y) => { impactLines(x, y, E, sc); hitAt(o, x, y, 1.05); } });
    },
    // 단검: 대상 위에 짧고 날카로운 칼자국이 연달아 그어진다
    stab(from, to, o) {
      const E = el(o.el), n = o.type === 'multi' ? 5 : (o.type === 'crit' || o.big) ? 3 : 2, a0 = dirOf(from, to);
      fly({ from, to: { x: to.x - Math.cos(a0) * 26, y: to.y - Math.sin(a0) * 26 }, dur: 0.1, el: o.el, noTrail: true, draw: (g) => SHAPE.dagger(g, E, 1.1) });
      for (let i = 0; i < n; i++) { const a = a0 + (i % 2 ? 1 : -1) * R(0.5, 1.1), L = R(30, 46) * (o.big ? 1.25 : 1), cx = to.x + R(-8, 8), cy = to.y + R(-8, 8); P.streak(cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, 4.5, E.main, E.hi, 0.18, 0.1 + i * 0.06); }
      at(0.1 + n * 0.06, () => { if (o.type === 'crit' || o.big) P.cross(to.x, to.y, 16, { main: E.main, hi: '#ffffff' }, 0.25, 0, Math.PI / 4); hitAt(o, to.x, to.y, 0.85); });
    },
    // 화살: 화살이 살짝 휘어 날아가 꽂힌다
    arrow(from, to, o) {
      const E = el(o.el), n = o.type === 'multi' ? 3 : 1, a = dirOf(from, to);
      for (let i = 0; i < n; i++) { const tt = { x: to.x + (n > 1 ? R(-12, 12) : 0), y: to.y + (n > 1 ? R(-12, 12) : 0) }, end = o.type === 'pierce' ? { x: tt.x + Math.cos(a) * 120, y: tt.y + Math.sin(a) * 120 } : tt;
        fly({ from, to: end, speed: 1250, arc: o.type === 'pierce' ? 0 : 16 + i * 6, delay: i * 0.09, el: o.el, sc: 0.8, draw: (g) => SHAPE.arrow(g, E, o.big ? 1.25 : 1), hit: (x, y, ang) => { if (o.type !== 'pierce') add({ life: 0.28, draw(g, k) { g.translate(tt.x, tt.y); g.rotate(ang + Math.sin(k * 40) * 0.12 * (1 - k)); g.globalAlpha = 1 - k * k; SHAPE.arrow(g, E, o.big ? 1.25 : 1); } }); if (i === n - 1 && o.type !== 'pierce') hitAt(o, to.x, to.y, 0.9); } });
        if (o.type === 'pierce') at(i * 0.09 + Math.hypot(to.x - from.x, to.y - from.y) / 1250, () => { P.streak(from.x, from.y, end.x, end.y, 4, E.main, E.hi, 0.25); if (i === n - 1) hitAt(o, to.x, to.y); }); }
    },
    // 총알: 총구 불빛 + 빠른 탄 자국. 저격(crit·pierce)은 조준 표시가 먼저 뜬다
    bullet(from, to, o) {
      const E = el(o.el), a = dirOf(from, to), n = o.type === 'multi' ? 5 : 1, snipe = o.type === 'crit' || o.type === 'pierce' || o.big;
      const shot = (delay, tt) => { at(delay, () => { P.flash(from.x + Math.cos(a) * 18, from.y + Math.sin(a) * 18, 22, '#ffe9a8', 0.1); for (let j = 0; j < 4; j++) P.spark(from.x + Math.cos(a) * 18, from.y + Math.sin(a) * 18, a + R(-0.5, 0.5), R(160, 320), '#ffd36b', 0.14, 2); }); fly({ from: { x: from.x + Math.cos(a) * 18, y: from.y + Math.sin(a) * 18 }, to: tt, speed: 2600, delay, el: o.el, noTrail: true, draw: (g) => SHAPE.bullet(g, E, snipe ? 1.5 : 1), hit: (x, y) => { for (let j = 0; j < 5; j++) P.spark(x, y, a + Math.PI + R(-0.9, 0.9), R(140, 300), E.hi, 0.2, 1.8); P.ring(x, y, 3, 16, E.main, 2, 0.15); } }); };
      if (snipe) { add({ life: 0.3, draw(g, k) { const r = 30 - 12 * Math.min(1, k / 0.6); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba('#ff5a5a', k < 0.8 ? 1 : (1 - k) * 5); g.lineWidth = 2; g.beginPath(); g.arc(to.x, to.y, r, 0, TAU); for (let i = 0; i < 4; i++) { const q = i * Math.PI / 2; g.moveTo(to.x + Math.cos(q) * (r - 7), to.y + Math.sin(q) * (r - 7)); g.lineTo(to.x + Math.cos(q) * (r + 9), to.y + Math.sin(q) * (r + 9)); } g.stroke(); } }); shot(0.26, to); at(0.3, () => { P.streak(from.x, from.y, to.x + Math.cos(a) * (o.type === 'pierce' ? 110 : 0), to.y + Math.sin(a) * (o.type === 'pierce' ? 110 : 0), 5, E.main, E.hi, 0.3); hitAt(o, to.x, to.y, 1.1); }); return; }
      for (let i = 0; i < n; i++) shot(i * 0.06, { x: to.x + (n > 1 ? R(-16, 16) : 0), y: to.y + (n > 1 ? R(-16, 16) : 0) });
      at((n - 1) * 0.06 + Math.hypot(to.x - from.x, to.y - from.y) / 2600, () => hitAt(o, to.x, to.y, 0.85));
    },
    // 폭탄·플라스크: 포물선으로 던져 터진다
    bomb(from, to, o) {
      const E = el(o.el === 'none' ? 'fire' : o.el), flask = o.flask;
      fly({ from, to, dur: 0.42, arc: 70, spin: 1.5, el: o.el, noTrail: true, draw: (g) => (flask ? SHAPE.flask : SHAPE.bomb)(g, E, 1), hit: (x, y) => { P.flash(x, y, 70, E.hi, 0.25); P.ring(x, y, 8, 74, E.main, 5, 0.35); P.ring(x, y, 4, 50, E.hi, 3, 0.3, 0.05); for (let i = 0; i < 12; i++) P.spark(x, y, R(0, TAU), R(200, 460), i % 2 ? E.hi : E.main, 0.35, 2.5, 0, 300); if (!flask) for (let i = 0; i < 4; i++) P.smoke(x + R(-20, 20), y + R(-16, 10), R(18, 28), { lo: '#1a1d26', main: '#59606e' }, 0.7, 0.05, R(-30, 30), R(-60, -20)); hitAt(o, x, y, 1.25); } });
    },
    // 방패: 방패가 밀고 들어가 부딪친다
    shield(from, to, o) {
      const E = el(o.el), a = dirOf(from, to);
      fly({ from, to: { x: to.x - Math.cos(a) * 18, y: to.y - Math.sin(a) * 18 }, dur: 0.16, ease: true, el: o.el, noTrail: true, draw: (g, k, ang) => { g.rotate(-ang); SHAPE.shield(g, E, 1.1 + k * 0.25); }, hit: (x, y) => { impactLines(to.x, to.y, E, 1, 0, 8); add({ life: 0.22, draw(g, k) { g.translate(x, y); g.globalAlpha = 1 - k; SHAPE.shield(g, E, 1.35); } }); hitAt(o, to.x, to.y, 1.05); } });
    },
    // 마법구: 속성 덩어리가 날아가 터진다 (꼬리와 터지는 모양이 속성마다 다르다)
    orb(from, to, o) {
      const E = el(o.el), n = o.type === 'multi' ? 3 : 1;
      if (o.el === 'bolt') { for (let i = 0; i < n; i++) at(i * 0.09, () => { P.fork(from.x, from.y, to.x, to.y, E, o.big ? 5 : 3.5, 0.24, 0, 3); if (i === n - 1) hitAt(o, to.x, to.y, 1.1); }); return; }
      for (let i = 0; i < n; i++) fly({ from, to: { x: to.x + (n > 1 ? R(-12, 12) : 0), y: to.y + (n > 1 ? R(-12, 12) : 0) }, speed: o.el === 'dark' ? 620 : o.el === 'holy' ? 1200 : 850, arc: o.el === 'water' || o.el === 'wood' ? 34 : 0, delay: i * 0.1, el: o.el, sc: 1.1, draw: (g) => SHAPE.orb(g, E, o.big ? 1.35 : 1, o.el === 'dark'), hit: (x, y) => { if (i === n - 1) hitAt(o, to.x, to.y, 1.15); else accent(o.el, x, y, 0.6); } });
    },
    // 광선: 굵은 빛줄기가 이어졌다 사라진다
    beam(from, to, o) {
      const E = el(o.el), a = dirOf(from, to), ex = o.type === 'pierce' ? to.x + Math.cos(a) * 120 : to.x, ey = o.type === 'pierce' ? to.y + Math.sin(a) * 120 : to.y, w = o.big ? 20 : 14;
      P.flash(from.x, from.y, 26, E.hi, 0.2); add({ life: 0.4, draw(g, k) { const grow = Math.min(1, k / 0.15), al = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1, x2 = from.x + (ex - from.x) * grow, y2 = from.y + (ey - from.y) * grow; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; for (const [m, c, q] of [[2.2, E.lo, 0.3], [1, E.main, 0.85], [0.42, E.hi, 1]]) { g.strokeStyle = rgba(c, q * al); g.lineWidth = w * m * (0.85 + 0.15 * Math.sin(k * 60)); g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(x2, y2); g.stroke(); } } });
      at(0.07, () => hitAt(o, to.x, to.y, 1.1)); for (let i = 0; i < 4; i++) at(0.1 + i * 0.06, () => accent(o.el, to.x + R(-8, 8), to.y + R(-8, 8), 0.45));
    },
    // 빛기둥: 하늘에서 내리꽂힌다
    smite(from, to, o) {
      const E = el(o.el), w = o.big ? 46 : 34;
      add({ life: 0.5, draw(g, k) { const grow = Math.min(1, k / 0.18), al = k > 0.5 ? 1 - (k - 0.5) / 0.5 : 1, top = to.y - 260, y2 = top + (to.y + 24 - top) * grow; g.globalCompositeOperation = 'lighter'; for (const [m, c, q] of [[1.5, E.lo, 0.25], [1, E.main, 0.6], [0.45, E.hi, 0.95]]) { const gr = g.createLinearGradient(0, top, 0, y2); gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(0.35, rgba(c, q * al)); gr.addColorStop(1, rgba(c, q * al)); g.fillStyle = gr; g.fillRect(to.x - w * m / 2, top, w * m, y2 - top); } } });
      at(0.1, () => { P.ring(to.x, to.y + 22, 8, 60, E.hi, 3.5, 0.4, 0, 0.3); hitAt(o, to.x, to.y, 1.2); });
    },
    // 부적: 부적이 빙글 날아가 붙고 문양이 터진다
    talisman(from, to, o) {
      const E = el(o.el), n = o.type === 'multi' ? 3 : 1;
      for (let i = 0; i < n; i++) fly({ from, to: { x: to.x + (n > 1 ? (i - 1) * 16 : 0), y: to.y + (n > 1 ? R(-8, 8) : 0) }, speed: 950, arc: 20, spin: 2, delay: i * 0.1, el: o.el, sc: 0.7, draw: (g) => SHAPE.talisman(g, E, 1), hit: (x, y) => { add({ life: 0.4, draw(g, k) { g.translate(x, y); g.scale(1 + k * 0.5, 1 + k * 0.5); g.globalAlpha = 1 - k; SHAPE.talisman(g, E, 1); } }); if (i === n - 1) { sigil(to.x, to.y, 30, E, 0.5, 0, 8); at(0.12, () => hitAt(o, to.x, to.y)); } } });
    },
    // 저주: 대상 발밑에 문양이 돌고 사슬이 조인다
    curse(from, to, o) {
      const E = el(o.el === 'none' ? 'dark' : o.el);
      sigil(to.x, to.y, 36, E, 0.8, 0, 5); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; P.streak(to.x + Math.cos(a) * 70, to.y + Math.sin(a) * 70, to.x + Math.cos(a) * 10, to.y + Math.sin(a) * 10, 5, E.main, E.hi, 0.35, 0.15 + i * 0.04); }
      at(0.35, () => hitAt({ ...o, el: o.el === 'none' ? 'dark' : o.el, then: o.then }, to.x, to.y)); o.then = null;
    },
    // 염동·정신: 겹겹이 조여드는 고리와 일그러짐
    psychic(from, to, o) {
      const E = el(o.el === 'none' ? 'dark' : o.el), C = o.el === 'none' ? { main: '#c77dff', hi: '#f1d9ff', lo: '#5b21b6' } : E;
      for (let i = 0; i < 4; i++) add({ delay: i * 0.07, life: 0.35, draw(g, k) { const r = 64 * (1 - ease(k)) + 8; g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(i % 2 ? C.hi : C.main, Math.min(1, k * 3)); g.lineWidth = 3; g.beginPath(); for (let q = 0; q <= 24; q++) { const a = q / 24 * TAU, rr = r + Math.sin(a * 6 + k * 14) * 4; q ? g.lineTo(to.x + Math.cos(a) * rr, to.y + Math.sin(a) * rr) : g.moveTo(to.x + Math.cos(a) * rr, to.y + Math.sin(a) * rr); } g.closePath(); g.stroke(); } });
      at(0.4, () => { P.flash(to.x, to.y, 40, C.hi, 0.2); for (let i = 0; i < 8; i++) P.spark(to.x, to.y, R(0, TAU), R(180, 340), C.main, 0.3, 2); hitAt(o, to.x, to.y, 0.9); });
    },
    claw(from, to, o) { const E = el(o.el); claw(to.x, to.y, E, o.big ? 1.3 : 1, 0, -0.9); if (o.type === 'multi' || o.type === 'crit' || o.big) claw(to.x, to.y, E, o.big ? 1.3 : 1, 0.14, -2.2); at(o.type === 'multi' || o.big ? 0.24 : 0.1, () => hitAt(o, to.x, to.y, 0.9)); },
    bite(from, to, o) { const E = el(o.el); bite(to.x, to.y, { ...E, hi: '#f4f1e6' }, o.big ? 1.3 : 1); at(0.14, () => hitAt(o, to.x, to.y, 0.95)); },
    // 정령·혼: 얼굴 달린 불덩이가 꼬리를 끌며 날아든다
    spirit(from, to, o) {
      const E = el(o.el), n = o.type === 'multi' ? 3 : 1;
      for (let i = 0; i < n; i++) { const side = i % 2 ? 1 : -1; fly({ from, to, dur: 0.38, arc: 50 * side * (n > 1 ? 1 : R(-1, 1)), delay: i * 0.11, ease: true, el: o.el, draw: (g, k) => SHAPE.wisp(g, E, o.big ? 1.3 : 1, k), hit: (x, y) => { if (i === n - 1) hitAt(o, to.x, to.y, 1.05); else accent(o.el, x, y, 0.55); } }); }
    },
    // 음표: 음표들이 물결치며 날아간다
    note(from, to, o) {
      const E = el(o.el);
      for (let i = 0; i < 4; i++) fly({ from, to: { x: to.x + R(-14, 14), y: to.y + R(-14, 14) }, dur: 0.4, arc: (i % 2 ? 1 : -1) * R(20, 46), delay: i * 0.07, el: o.el, noTrail: true, draw: (g, k, ang) => { g.rotate(-ang + Math.sin(k * 12) * 0.3); SHAPE.note(g, i % 2 ? E : { main: E.hi, hi: E.main }, 1); }, hit: (x, y) => { P.ring(x, y, 4, 26, E.hi, 2, 0.25); if (i === 3) hitAt(o, to.x, to.y, 0.9); } });
    },
    // 균열: 공간이 세로로 찢어졌다 닫힌다
    rift(from, to, o) {
      const E = el(o.el === 'none' ? 'dark' : o.el), h = o.big ? 110 : 84, tilt = R(-0.3, 0.3);
      add({ life: 0.5, draw(g, k) { const open = k < 0.3 ? k / 0.3 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1, w = 15 * open; g.translate(to.x, to.y); g.rotate(tilt); g.fillStyle = '#05010b'; g.beginPath(); g.moveTo(0, -h / 2); g.quadraticCurveTo(w, 0, 0, h / 2); g.quadraticCurveTo(-w, 0, 0, -h / 2); g.fill(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(E.hi, open); g.lineWidth = 2.5; g.stroke(); g.strokeStyle = rgba(E.main, 0.6 * open); g.lineWidth = 7; g.stroke(); } });
      at(0.18, () => { for (let i = 0; i < 8; i++) P.spark(to.x, to.y + R(-h / 2, h / 2) * 0.7, (i % 2 ? 0 : Math.PI) + R(-0.4, 0.4), R(160, 320), E.main, 0.3, 2); hitAt({ ...o, el: o.el === 'none' ? 'dark' : o.el, then: o.then }, to.x, to.y); o.then = null; });
    },
    // 지면 분출: 발밑에서 속성 기둥이 솟는다
    ground(from, to, o) {
      const E = el(o.el === 'none' ? 'wood' : o.el), e = o.el === 'none' ? 'wood' : o.el, by = to.y + (to.h || 60) * 0.4;
      P.ring(to.x, by, 6, 56, E.main, 3, 0.35, 0, 0.3);
      if (e === 'wood') thorns(to.x, by, E, o.big ? 1.9 : 1.5, 0.05, 5);
      else for (let i = 0; i < 5; i++) { const dx = (i - 2) * 13; add({ delay: 0.04 + Math.abs(i - 2) * 0.03, life: 0.4, draw(g, k) { const up = Math.min(1, k / 0.3), al = 1 - k * k, hh = (i === 2 ? 96 : 60) * up; g.globalCompositeOperation = e === 'dark' ? 'source-over' : 'lighter'; const gr = g.createLinearGradient(0, by, 0, by - hh); gr.addColorStop(0, rgba(E.hi, al)); gr.addColorStop(0.5, rgba(E.main, 0.8 * al)); gr.addColorStop(1, rgba(E.lo, 0)); g.fillStyle = gr; g.beginPath(); g.moveTo(to.x + dx - 8, by); g.lineTo(to.x + dx, by - hh); g.lineTo(to.x + dx + 8, by); g.fill(); } }); }
      at(0.14, () => hitAt({ ...o, el: e, then: o.then }, to.x, to.y, 1.1)); o.then = null;
    },
    // 회전: 불꽃 부채가 대상 둘레를 한 바퀴 돈다 (춤·선풍)
    whirl(from, to, o) { const E = el(o.el); for (let i = 0; i < 3; i++) P.crescent({ x: to.x, y: to.y, ang: i * TAU / 3, r: 40, th: 0.4, span: 1.9, el: o.el, life: 0.4, delay: i * 0.05, grow: 0.5 }); add({ life: 0.4, draw(g, k) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(E.hi, 1 - k); g.lineWidth = 3; g.beginPath(); g.arc(to.x, to.y, 44 + k * 14, k * 9, k * 9 + 4.2); g.stroke(); } }); at(0.2, () => hitAt(o, to.x, to.y)); },
  };

  // ---------- 전체 공격: 모양별로 적 진영을 한꺼번에 덮는다 ----------
  // area {x, y, w, h}, spots [{x, y}], from 시전자
  const AOE = {
    slash(from, area, spots, o) { const E = el(o.el), a = Math.atan2(area.y - from.y, area.x - from.x); P.crescent({ x: from.x, y: from.y, ang: a, r: Math.max(70, area.w * 0.42), th: 0.36, span: 2.4, el: o.el, life: 0.3, vx: (area.x - from.x) / 0.3, vy: (area.y - from.y) / 0.3, grow: 0.25 }); P.crescent({ x: from.x, y: from.y, ang: a, r: Math.max(56, area.w * 0.34), th: 0.3, span: 2.2, el: o.el, life: 0.3, delay: 0.07, vx: (area.x - from.x) / 0.3, vy: (area.y - from.y) / 0.3, grow: 0.25 }); spots.forEach((s, i) => at(0.26 + i * 0.02, () => { P.streak(s.x - 34, s.y + 14, s.x + 34, s.y - 14, 8, E.main, E.hi, 0.22); accent(o.el, s.x, s.y, 0.7); })); },
    arrow(from, area, spots, o) { const E = el(o.el); const all = [...spots]; for (let i = 0; i < 8; i++) all.push({ x: area.x + R(-area.w / 2, area.w / 2), y: area.y + R(-area.h / 2, area.h / 2), extra: true }); all.forEach((s, i) => fly({ from: { x: s.x - 70 + R(-10, 10), y: s.y - 230 }, to: s, dur: 0.2, delay: R(0, 0.3), el: o.el, sc: 0.7, noTrail: !!s.extra, draw: (g) => SHAPE.arrow(g, E, s.extra ? 0.8 : 1), hit: (x, y, ang) => { add({ life: 0.3, draw(g, k) { g.translate(x, y); g.rotate(ang); g.globalAlpha = 1 - k * k; SHAPE.arrow(g, E, s.extra ? 0.8 : 1); } }); if (!s.extra) accent(o.el, x, y, 0.65); } })); },
    bullet(from, area, spots, o) { const E = el(o.el); spots.forEach((s, i) => { for (let j = 0; j < 3; j++) { const d = i * 0.05 + j * 0.05, tt = { x: s.x + R(-14, 14), y: s.y + R(-14, 14) }; fly({ from, to: tt, speed: 2600, delay: d, el: o.el, noTrail: true, draw: (g) => SHAPE.bullet(g, E, 1), hit: (x, y) => { for (let q = 0; q < 3; q++) P.spark(x, y, R(0, TAU), R(140, 280), E.hi, 0.18, 1.8); if (j === 2) accent(o.el, s.x, s.y, 0.6); } }); } }); P.flash(from.x, from.y, 30, '#ffe9a8', 0.3); },
    bomb(from, area, spots, o) { spots.forEach((s, i) => FORM.bomb(from, s, { el: o.el, flask: o.flask, delay: i * 0.05 })); },
    fist(from, area, spots, o) { const E = el(o.el); P.ring(area.x, area.y + area.h * 0.3, 20, area.w * 0.62, E.hi, 5, 0.45, 0.1, 0.3); P.ring(area.x, area.y + area.h * 0.3, 10, area.w * 0.45, E.main, 4, 0.45, 0.16, 0.3); spots.forEach((s, i) => fly({ from: { x: s.x, y: s.y - 120 }, to: s, dur: 0.13, delay: i * 0.03, el: o.el, noTrail: true, draw: (g, k) => SHAPE.fist(g, E, 0.8 + k * 0.4), hit: (x, y) => { impactLines(x, y, E, 0.7, 0, 7); accent(o.el, x, y, 0.65); } })); },
    smite(from, area, spots, o) { spots.forEach((s, i) => at(i * 0.04, () => FORM.smite(from, s, { el: o.el }))); },
    ground(from, area, spots, o) { spots.forEach((s, i) => at(i * 0.04, () => FORM.ground(from, { ...s, h: 60 }, { el: o.el }))); },
    orb(from, area, spots, o) { const E = el(o.el), e = o.el; if (e === 'bolt') spots.forEach((s, i) => at(i * 0.03, () => { P.fork(s.x + R(-30, 30), s.y - 240, s.x, s.y, E, 4, 0.26, 0, 3); accent(e, s.x, s.y, 0.8); })); else if (e === 'water') { add({ life: 0.6, draw(g, k) { const xx = area.x - area.w * 0.7 + area.w * 1.4 * ease(k), al = 1 - k * k, hh = area.h * 0.75; g.globalCompositeOperation = 'source-over'; g.fillStyle = rgba(E.main, 0.6 * al); g.beginPath(); g.moveTo(xx - 70, area.y + hh / 2); g.quadraticCurveTo(xx - 30, area.y - hh * 0.7, xx + 30, area.y - hh * 0.35); g.quadraticCurveTo(xx + 12, area.y - hh * 0.05, xx + 44, area.y + hh / 2); g.closePath(); g.fill(); g.strokeStyle = rgba(E.hi, al); g.lineWidth = 4; g.beginPath(); g.moveTo(xx - 62, area.y + hh / 2 - 6); g.quadraticCurveTo(xx - 26, area.y - hh * 0.62, xx + 30, area.y - hh * 0.35); g.stroke(); } }); spots.forEach((s, i) => at(0.2 + i * 0.03, () => accent(e, s.x, s.y, 0.8))); } else spots.forEach((s, i) => fly({ from: { x: s.x - 40, y: s.y - 220 }, to: s, dur: 0.24, delay: i * 0.04, el: e, draw: (g) => SHAPE.orb(g, E, 1.2, e === 'dark'), hit: (x, y) => accent(e, x, y, 0.9) })); },
    beam(from, area, spots, o) { const E = el(o.el); add({ life: 0.5, draw(g, k) { const sw = ease(Math.min(1, k / 0.7)), tx = area.x - area.w / 2 + area.w * sw, ty = area.y, al = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; for (const [m, c, q] of [[2.2, E.lo, 0.3], [1, E.main, 0.85], [0.4, E.hi, 1]]) { g.strokeStyle = rgba(c, q * al); g.lineWidth = 14 * m; g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(tx, ty); g.stroke(); } } }); spots.forEach((s) => at(0.08 + 0.3 * ((s.x - (area.x - area.w / 2)) / Math.max(1, area.w)), () => accent(o.el, s.x, s.y, 0.75))); },
    whirl(from, area, spots, o) { for (let i = 0; i < 4; i++) P.crescent({ x: area.x, y: area.y, ang: i * TAU / 4, r: Math.max(60, area.w * 0.36), th: 0.34, span: 1.7, el: o.el, life: 0.5, delay: i * 0.05, grow: 0.45 }); spots.forEach((s, i) => at(0.18 + i * 0.03, () => accent(o.el, s.x, s.y, 0.7))); },
  };
  const AOE_ALIAS = { cleave: 'slash', thrust: 'slash', stab: 'slash', shield: 'fist', talisman: 'orb', curse: 'orb', psychic: 'orb', claw: 'slash', bite: 'slash', spirit: 'orb', note: 'orb', rift: 'orb' };

  return {
    S, P, EL, FORM, AOE, SHAPE, accent, trail, add, at, step, init,
    forms: Object.keys(FORM),
    // 단일 대상
    play(form, from, to, o = {}) { if (!from || !to || !init()) return false; (FORM[form] || FORM.orb)(from, to, o); return true; },
    // 전체 대상
    playAoe(form, from, area, spots, o = {}) { if (!area || !init()) return false; const f = AOE[form] || AOE[AOE_ALIAS[form]] || AOE.orb; f(from || { x: area.x, y: area.y + 200 }, area, spots && spots.length ? spots : [{ x: area.x, y: area.y }], o); return true; },
  };
})();
