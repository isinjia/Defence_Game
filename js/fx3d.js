// 스킬 이펙트를 three.js 파티클로 (영역 B, docs/구현_대기목록.md 4-11)
// 전투 화면 위에 투명 WebGL 캔버스 하나(pointer-events: none). 위치는 공격자·대상 DOM 요소의 화면 좌표를 그대로 쓴다.
// 스킬 type × elem 으로 효과를 자동으로 고른다. WebGL이 없거나 끄면 기존 CSS 효과만 남는다.
// 성능: 동시 입자 2000개 상한, devicePixelRatio 최대 2, 할 일이 없으면 그리기 멈춤.
const FX3D = {
  MAX: 2000, KEY: 'gc_fx3d_v1',
  opt: { mode: 'high' }, // high | low | off
  ok: false, tried: false, cv: null, r: null, scene: null, cam: null, pts: null, geo: null,
  parts: [], tasks: [], raf: 0, last: 0, W: 0, H: 0,

  load() { try { const o = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (o) Object.assign(this.opt, o); } catch (e) { /* 무시 */ } },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.opt)); } catch (e) { /* 무시 */ } },
  on() { return this.opt.mode !== 'off' && this.init(); },
  // 입자 수 배율 (낮음·동작 줄이기)
  q() { return (this.opt.mode === 'low' ? 0.5 : 1) * (FX.reduced ? 0.4 : 1); },

  init() {
    if (this.tried) return this.ok;
    this.tried = true;
    try {
      if (typeof THREE_FX === 'undefined') return (this.ok = false);
      const T = THREE_FX;
      const cv = document.createElement('canvas'); cv.id = 'fx3d'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      const r = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
      r.setClearColor(0x000000, 0);
      const geo = new T.BufferGeometry();
      const N = this.MAX;
      this.aPos = new Float32Array(N * 3); this.aCol = new Float32Array(N * 3); this.aSize = new Float32Array(N); this.aAlpha = new Float32Array(N);
      geo.setAttribute('position', new T.BufferAttribute(this.aPos, 3));
      geo.setAttribute('color', new T.BufferAttribute(this.aCol, 3));
      geo.setAttribute('size', new T.BufferAttribute(this.aSize, 1));
      geo.setAttribute('alpha', new T.BufferAttribute(this.aAlpha, 1));
      const mat = new T.ShaderMaterial({
        uniforms: { dpr: { value: 1 } },
        vertexShader: 'attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float dpr;' +
          'void main(){ vC = color; vA = alpha; gl_PointSize = size * dpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float s = smoothstep(0.5, 0.0, r); gl_FragColor = vec4(vC * (0.75 + 0.35 * s), min(1.0, vA * (0.25 + 0.9 * s))); }',
        transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending,
      });
      const pts = new T.Points(geo, mat); pts.frustumCulled = false;
      const scene = new T.Scene(); scene.add(pts);
      Object.assign(this, { cv, r, geo, mat, pts, scene, ok: true });
      this.resize();
      window.addEventListener('resize', () => this.resize());
    } catch (e) { this.ok = false; if (this.cv) this.cv.remove(); }
    return this.ok;
  },
  resize() {
    if (!this.r) return;
    const W = window.innerWidth, H = window.innerHeight; const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = W; this.H = H;
    this.r.setPixelRatio(dpr); this.r.setSize(W, H, false);
    this.mat.uniforms.dpr.value = dpr;
    this.cam = new THREE_FX.OrthographicCamera(0, W, 0, H, -10, 10); // y 아래로 = 화면 좌표 그대로
  },

  // ---------- 입자 ----------
  add(p) {
    if (this.parts.length >= this.MAX) return;
    const c = _fxHex(p.c || '#ffffff');
    this.parts.push({ x: p.x, y: p.y, vx: p.vx || 0, vy: p.vy || 0, ax: p.ax || 0, ay: p.ay || 0, drag: p.drag ?? 0.9, t: 0, life: p.life || 0.6, s0: (p.s || 8) * 1.7, s1: (p.s1 ?? (p.s || 8) * 0.2) * 1.7, a0: p.a ?? 1, r: c[0], g: c[1], b: c[2], orb: p.orb || null });
    this.kick();
  },
  task(fn) { this.tasks.push(fn); this.kick(); },
  kick() { if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame((t) => this.frame(t)); } },
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000) * this.speed(); this.last = now;
    this.tasks = this.tasks.filter((f) => { try { return f(dt) !== false; } catch (e) { return false; } });
    const P = this.parts; let n = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.t += dt; if (p.t >= p.life) continue;
      if (p.orb) { p.orb.a += p.orb.w * dt; p.x = p.orb.cx + Math.cos(p.orb.a) * p.orb.rx; p.y = p.orb.cy + Math.sin(p.orb.a) * p.orb.ry + p.orb.dy * p.t; }
      else { const d = Math.pow(p.drag, dt * 60); p.vx = (p.vx + p.ax * dt) * d; p.vy = (p.vy + p.ay * dt) * d; p.x += p.vx * dt; p.y += p.vy * dt; }
      const k = p.t / p.life;
      this.aPos[n * 3] = p.x; this.aPos[n * 3 + 1] = p.y; this.aPos[n * 3 + 2] = 0;
      this.aCol[n * 3] = p.r; this.aCol[n * 3 + 1] = p.g; this.aCol[n * 3 + 2] = p.b;
      this.aSize[n] = p.s0 + (p.s1 - p.s0) * k; this.aAlpha[n] = p.a0 * (1 - k * k);
      P[n] = p; n++;
    }
    P.length = n;
    this.geo.setDrawRange(0, n);
    for (const k of ['position', 'color', 'size', 'alpha']) this.geo.attributes[k].needsUpdate = true;
    this.r.render(this.scene, this.cam);
    if (n || this.tasks.length) this.raf = requestAnimationFrame((t) => this.frame(t));
    else { this.raf = 0; this.r.clear(); }
  },
  // 전투 배속·자동 전투에 맞춰 빨리
  speed() { const c = typeof UI !== 'undefined' && UI.ctx; return c && c.combat ? ((c.speed || 1) > 1 ? 1.8 : 1) * (c.combat.auto ? 1.6 : 1) : 1; },
};
FX3D.load();

function _fxHex(h) { const n = parseInt(String(h).replace('#', ''), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
const _fxR = (a, b) => a + Math.random() * (b - a);
const _fxPick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- 속성별 모양 ----------
// 속성 키: fire·bolt·water·wood·holy·dark (4-9). 모르는 키는 none.
const FX3D_EL = {
  fire:   { c: ['#ff4b1f', '#ff8a2a', '#ffd36b'], trail: 'flame', speed: 900 },
  bolt:   { c: ['#fffbd0', '#ffe14d', '#9fdcff'], trail: 'zap', speed: 0 },
  water:  { c: ['#3aa8ff', '#8fdcff', '#e8fbff'], trail: 'drop', speed: 850 },
  wood:   { c: ['#4fcf5f', '#b6f07a', '#ff9ad5'], trail: 'leaf', speed: 760 },
  holy:   { c: ['#fff3c4', '#ffd166', '#ffffff'], trail: 'spear', speed: 1300 },
  dark:   { c: ['#7a3cff', '#c58cff', '#ff4fd8'], trail: 'orb', speed: 620 },
  none:   { c: ['#e3e8f1', '#9aa6b8', '#ffffff'], trail: 'shard', speed: 1100 },
};
const elOf = (e) => FX3D_EL[e] || FX3D_EL.none;

Object.assign(FX3D, {
  // 요소 중심 좌표
  at(el) { if (!el) return null; const h = el.querySelector ? (el.querySelector('.fx-host') || el) : el; const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; },
  n(k) { return Math.max(1, Math.round(k * 1.5 * this.q())); },

  burst(x, y, e, big = 1) {
    const E = elOf(e);
    for (let i = 0; i < this.n(26 * big); i++) {
      const a = Math.random() * Math.PI * 2, v = _fxR(80, 320) * big;
      this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + (E.trail === 'flame' ? -60 : 0), ay: E.trail === 'drop' ? 500 : E.trail === 'flame' ? -120 : 0, drag: 0.9, life: _fxR(0.35, 0.7), s: _fxR(8, 18) * big, c: _fxPick(E.c) });
    }
    this.add({ x, y, life: 0.25, s: 70 * big, s1: 110 * big, a: 0.6, c: E.c[2] }); // 섬광
    if (e === 'holy') for (let i = 0; i < this.n(16); i++) { const d = i < 8 ? [1, 0] : [0, 1]; const s = (i % 8 - 3.5) * 9; this.add({ x: x + d[0] * s, y: y + d[1] * s, life: 0.4, s: 10, c: '#fff3c4' }); }
    if (e === 'dark') for (let i = 0; i < this.n(18); i++) this.add({ x, y, life: 0.8, s: 14, c: _fxPick(E.c), orb: { cx: x, cy: y, rx: _fxR(10, 40), ry: _fxR(8, 30), a: Math.random() * 6.3, w: _fxR(5, 9), dy: -20 } });
    if (e === 'wood') for (let i = 0; i < this.n(12); i++) this.add({ x, y, vx: _fxR(-120, 120), vy: _fxR(-200, -60), ay: 120, drag: 0.94, life: 1.1, s: 10, c: _fxPick(['#ff9ad5', '#b6f07a']) });
  },
  // 단일: 투사체가 날아가 터진다. opts: big(치명), pierce(관통), edge(1 약점 / -1 저항), then()
  proj(from, to, e, opts = {}) {
    if (!from || !to) return;
    const E = elOf(e); const big = opts.big ? 1.6 : 1;
    const end = () => {
      if (opts.edge < 0) { // 저항: 튕겨 나가는 작은 파편
        for (let i = 0; i < this.n(10); i++) this.add({ x: to.x, y: to.y, vx: (from.x - to.x) * _fxR(0.3, 0.8) + _fxR(-80, 80), vy: (from.y - to.y) * _fxR(0.3, 0.8) + _fxR(-80, 80), drag: 0.88, life: 0.4, s: 6, c: '#9fb4cc' });
      } else {
        this.burst(to.x, to.y, e, big * (opts.edge > 0 ? 1.5 : 1));
        if (opts.edge > 0) for (let i = 0; i < this.n(28); i++) { const a = i / 28 * Math.PI * 2; this.add({ x: to.x + Math.cos(a) * 30, y: to.y + Math.sin(a) * 30, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160, drag: 0.85, life: 0.5, s: 9, c: '#ffd166' }); }
      }
      if (opts.pierce) { const dx = to.x - from.x, dy = to.y - from.y; for (let i = 0; i < this.n(16); i++) this.add({ x: to.x, y: to.y, vx: dx * _fxR(1.2, 2), vy: dy * _fxR(1.2, 2), drag: 0.92, life: 0.45, s: 7, c: _fxPick(E.c) }); }
      if (opts.then) opts.then();
    };
    if (E.trail === 'zap') { this.zap(from, to, E, big); return end(); }
    const dur = Math.max(0.12, Math.hypot(to.x - from.x, to.y - from.y) / E.speed);
    let t = 0;
    this.task((dt) => {
      t += dt; const k = Math.min(1, t / dur);
      const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * (E.trail === 'drop' || E.trail === 'leaf' ? 40 : 0);
      const m = this.n(4 * big);
      for (let i = 0; i < m; i++) {
        if (E.trail === 'flame') this.add({ x: x + _fxR(-6, 6), y: y + _fxR(-6, 6), vx: _fxR(-30, 30), vy: _fxR(-90, -20), drag: 0.9, life: 0.35, s: _fxR(14, 24) * big, s1: 4, c: _fxPick(E.c) });
        else if (E.trail === 'drop') this.add({ x, y, vx: _fxR(-40, 40), vy: _fxR(-20, 40), ay: 400, life: 0.4, s: _fxR(5, 9), c: _fxPick(E.c) });
        else if (E.trail === 'leaf') this.add({ x, y, vx: _fxR(-60, 60), vy: _fxR(-60, 60), drag: 0.9, life: 0.5, s: _fxR(6, 10), c: _fxPick(E.c) });
        else if (E.trail === 'spear') this.add({ x: x - (to.x - from.x) * 0.04 * i, y: y - (to.y - from.y) * 0.04 * i, life: 0.18, s: 12 * big, s1: 2, c: _fxPick(E.c) });
        else if (E.trail === 'orb') this.add({ x, y, life: 0.5, s: 10, c: _fxPick(E.c), orb: { cx: x, cy: y, rx: 14 * big, ry: 14 * big, a: Math.random() * 6.3, w: 10, dy: 0 } });
        else this.add({ x: x + _fxR(-3, 3), y: y + _fxR(-3, 3), life: 0.2, s: 7 * big, c: _fxPick(E.c) });
      }
      // 투사체 몸통
      this.add({ x, y, life: 0.05, s: (E.trail === 'orb' ? 26 : 18) * big, s1: (E.trail === 'orb' ? 26 : 18) * big, c: E.trail === 'orb' ? '#2a0d40' : E.c[2], a: E.trail === 'orb' ? 1 : 0.9 });
      if (k >= 1) { end(); return false; }
      return true;
    });
  },
  // 번개 줄기: 지그재그를 순간 연결
  zap(a, b, E, big = 1) {
    const seg = 10; let px = a.x, py = a.y;
    for (let i = 1; i <= seg; i++) {
      const k = i / seg; const nx = a.x + (b.x - a.x) * k + (i < seg ? _fxR(-22, 22) : 0), ny = a.y + (b.y - a.y) * k + (i < seg ? _fxR(-14, 14) : 0);
      const m = this.n(7);
      for (let j = 0; j < m; j++) { const t = j / m; this.add({ x: px + (nx - px) * t, y: py + (ny - py) * t, life: 0.22, s: 7 * big, s1: 3, c: _fxPick(E.c) }); }
      px = nx; py = ny;
    }
  },
  multi(from, to, e, opts) { for (let i = 0; i < 3; i++) setTimeout(() => this.proj(from, { x: to.x + _fxR(-14, 14), y: to.y + _fxR(-10, 10) }, e, i === 2 ? opts : { ...opts, then: null }), i * 110 / this.speed()); },

  // 범위: 적(또는 아군) 진영 위에서 내려꽂힘
  aoe(area, e) {
    if (!area) return;
    const E = elOf(e); const { x, y, w, h } = area; const L = x - w / 2, T = y - h / 2;
    const spots = Array.from({ length: 5 }, () => ({ x: L + _fxR(0.1, 0.9) * w, y: T + _fxR(0.3, 0.8) * h }));
    const tr = E.trail;
    if (tr === 'flame' || tr === 'shard') spots.forEach((s, i) => setTimeout(() => this.proj({ x: s.x - 60, y: T - 120 }, s, e), i * 70));
    else if (tr === 'zap') spots.forEach((s, i) => setTimeout(() => { this.zap({ x: s.x + _fxR(-20, 20), y: 0 }, s, E, 1.2); this.burst(s.x, s.y, e, 0.7); }, i * 80));
    else if (tr === 'drop') { let t = 0; this.task((dt) => { t += dt; const k = t / 0.6; const fx = L - 20 + (w + 40) * k; for (let i = 0; i < this.n(10); i++) this.add({ x: fx + _fxR(-10, 10), y: T + h * _fxR(0.2, 1) + Math.sin((fx + i * 20) / 30) * 12, vx: 120, vy: _fxR(-160, -40), ay: 500, life: 0.5, s: _fxR(8, 14), c: _fxPick(E.c) }); return k < 1; }); }
    else if (tr === 'leaf') spots.forEach((s) => { for (let i = 0; i < this.n(30); i++) this.add({ x: s.x + _fxR(-8, 8), y: T + h, vx: _fxR(-20, 20), vy: _fxR(-420, -200), drag: 0.92, life: 0.8, s: _fxR(8, 14), c: _fxPick(E.c) }); });
    else if (tr === 'spear') spots.slice(0, 4).forEach((s, i) => setTimeout(() => { for (let j = 0; j < this.n(40); j++) this.add({ x: s.x + _fxR(-10, 10), y: _fxR(T - 60, T + h), vy: _fxR(-200, -80), life: 0.6, s: _fxR(8, 14), c: _fxPick(E.c) }); this.burst(s.x, s.y, e, 0.8); }, i * 90));
    else { // 어둠: 검은 안개가 덮쳤다 터짐
      for (let i = 0; i < this.n(80); i++) this.add({ x: x + _fxR(-w / 2, w / 2), y: y + _fxR(-h / 2, h / 2), life: 0.9, s: _fxR(18, 34), a: 0.5, c: _fxPick(E.c), orb: { cx: x, cy: y, rx: _fxR(20, w / 2), ry: _fxR(10, h / 3), a: Math.random() * 6.3, w: _fxR(2, 4), dy: 0 } });
      setTimeout(() => spots.forEach((s) => this.burst(s.x, s.y, e, 0.8)), 600);
    }
  },
  // 맴도는 입자 (dot·debuff·stun)
  linger(p, e, kind) {
    if (!p) return; const E = elOf(e);
    if (kind === 'stun') { for (let i = 0; i < this.n(10); i++) this.add({ x: p.x, y: p.y - p.h / 2, life: 1.1, s: 9, c: '#ffe14d', orb: { cx: p.x, cy: p.y - p.h / 2, rx: 22, ry: 7, a: i / 10 * 6.3, w: 7, dy: 0 } }); return; }
    for (let i = 0; i < this.n(22); i++) this.add({ x: p.x, y: p.y, life: _fxR(0.8, 1.3), s: _fxR(6, 11), c: _fxPick(E.c), orb: { cx: p.x, cy: p.y, rx: _fxR(16, 34), ry: _fxR(10, 24), a: Math.random() * 6.3, w: _fxR(3, 6), dy: -14 } });
  },
  // 흡혈: 대상 → 시전자로 빨려 오는 입자
  drain(from, to, e) {
    if (!from || !to) return; const c = e === 'dark' ? ['#ff4f6a', '#c58cff'] : elOf(e).c;
    for (let i = 0; i < this.n(26); i++) { const d = _fxR(0, 0.25); const T = _fxR(0.45, 0.7); const sx = from.x + _fxR(-20, 20), sy = from.y + _fxR(-20, 20); const mx = (sx + to.x) / 2 + _fxR(-60, 60), my = (sy + to.y) / 2 + _fxR(-40, 40); let t = -d; this.task((dt) => { t += dt; if (t < 0) return true; const k = Math.min(1, t / T); const x = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * mx + k * k * to.x, y = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * my + k * k * to.y; this.add({ x, y, life: 0.12, s: 9, c: _fxPick(c) }); return k < 1; }); }
  },
  // 회복: 아래에서 위로 오르는 빛 입자
  heal(p, e, revive) {
    if (!p) return; const c = e === 'wood' ? ['#4fcf5f', '#b6f07a', '#ff9ad5'] : e === 'water' ? ['#8fdcff', '#e8fbff'] : ['#fff3c4', '#ffd166', '#b6f07a'];
    for (let i = 0; i < this.n(revive ? 60 : 30); i++) this.add({ x: p.x + _fxR(-p.w / 2, p.w / 2), y: p.y + p.h / 2 + _fxR(-10, 10), vy: _fxR(-160, -60) * (revive ? 1.6 : 1), vx: _fxR(-10, 10), drag: 0.96, life: _fxR(0.6, 1.1), s: _fxR(6, 12), c: _fxPick(c) });
    if (revive) for (let j = 0; j < this.n(40); j++) this.add({ x: p.x + _fxR(-8, 8), y: _fxR(0, p.y + p.h / 2), vy: -60, life: 0.7, s: 12, a: 0.6, c: '#fff3c4' });
  },
  // 강화·보호막: 몸 주위에 회전하는 고리
  ring(p, e, color) {
    if (!p) return; const c = color ? [color] : elOf(e).c;
    for (let i = 0; i < this.n(36); i++) this.add({ x: p.x, y: p.y, life: 0.9, s: 8, c: _fxPick(c), orb: { cx: p.x, cy: p.y + p.h * 0.25, rx: p.w * 0.6, ry: p.w * 0.18, a: i / 36 * 6.3, w: 6, dy: -30 } });
  },
  pulse(p, color) { if (!p) return; for (let i = 0; i < this.n(30); i++) { const a = i / 30 * 6.3; this.add({ x: p.x, y: p.y, vx: Math.cos(a) * 220, vy: Math.sin(a) * 140, drag: 0.86, life: 0.5, s: 9, c: color }); } },
  summon(p, e) { if (!p) return; const E = elOf(e); for (let i = 0; i < this.n(40); i++) { const a = i / 40 * 6.3; this.add({ x: p.x + Math.cos(a) * 50, y: p.y + p.h / 2 + Math.sin(a) * 14, vx: -Math.cos(a) * 80, vy: -Math.sin(a) * 30 - 40, drag: 0.95, life: 0.8, s: 8, c: _fxPick(E.c) }); } },
});

// ---------- 전투 연출에 걸기 ----------
{
  const nameType = {};
  const typeOfName = (n) => { if (!n) return 'dmg'; if (nameType[n]) return nameType[n]; const s = (typeof SKILLS !== 'undefined' ? SKILLS : []).find((x) => x.name === n); return (nameType[n] = s ? s.type : 'dmg'); };
  const unitEl = (id) => document.getElementById('u-' + id);
  const sideArea = (side) => { const el = document.getElementById(side === 'enemy' ? 'foes' : 'allies'); return el ? FX3D.at(el) : null; };
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const r = baseApply.call(this, l);
    const ev = l && l.ev; const c = this.ctx;
    if (!ev || !c || !c.combat || !FX3D.on()) return r;
    try {
      const unit = (id) => c.combat.units.find((u) => u.id === id);
      if (ev.k === 'cast') { this._cast = { src: ev.src, elem: ev.elem, side: ev.side, type: typeOfName(ev.name), shots: 0 }; return r; }
      const cast = this._cast || {};
      const e = ev.elem || cast.elem || 'none';
      if (ev.k === 'aoe') { FX3D.aoe(sideArea(ev.side === 'ally' ? 'enemy' : 'ally'), e); cast.aoe = true; return r; }
      if (ev.k === 'dmg') {
        const to = FX3D.at(unitEl(ev.dst)); const src = ev.src != null ? ev.src : cast.src; const from = FX3D.at(unitEl(src));
        const dst = unit(ev.dst); const edge = dst && UI.elemEdge ? UI.elemEdge(ev.elem, dst.elem) : 0;
        if (cast.aoe && cast.src === src) { if (to) FX3D.burst(to.x, to.y, e, 0.6); return r; }
        const t = cast.src === src ? cast.type : 'dmg';
        const opts = { big: !!ev.crit, pierce: t === 'pierce', edge };
        if (t === 'multi') { if (!cast.shots++) FX3D.multi(from, to, e, opts); else if (to) FX3D.burst(to.x, to.y, e, 0.5); }
        else FX3D.proj(from, to, e, opts);
        if (t === 'drain') setTimeout(() => FX3D.drain(to, from, e), 200);
        if (t === 'dot' || t === 'debuff') setTimeout(() => FX3D.linger(to, e), 200);
        if (t === 'stun') setTimeout(() => FX3D.linger(to, 'bolt', 'stun'), 200);
        return r;
      }
      const p = FX3D.at(unitEl(ev.dst));
      const t = cast.type;
      if (ev.k === 'heal') FX3D.heal(p, cast.elem, !!ev.revive);
      else if (ev.k === 'mp') FX3D.heal(p, 'water');
      else if (ev.k === 'buff') { if (t === 'taunt') FX3D.pulse(p, '#ff4f6a'); else FX3D.ring(p, cast.elem || 'holy', ev.mp != null && t === 'evade' ? '#9fdcff' : null); }
      else if (ev.k === 'summon') FX3D.summon(p, cast.elem);
    } catch (err) { /* 연출 실패 무시 */ }
    return r;
  };

  // ---------- 설정: 이펙트 높음/낮음/끄기 + 미리 보기 ----------
  const baseSet = UI.settingsHtml;
  if (baseSet) UI.settingsHtml = function () {
    const html = baseSet.call(this);
    const m = FX3D.opt.mode;
    const row = `<div class="set-row"><div><b>스킬 이펙트</b><div class="small dim">${FX3D.init() ? 'WebGL 입자 효과' : '이 기기는 WebGL을 쓸 수 없어 기본 효과만 나옵니다'}</div></div>
      <span class="row" style="gap:4px">${[['high', '높음'], ['low', '낮음'], ['off', '끄기']].map(([k, n]) => `<button class="sm ${m === k ? 'primary' : ''}" data-act="fx3d-mode" data-v="${k}">${n}</button>`).join('')}</span></div>
      <div class="set-row"><div><b>이펙트 미리 보기</b><div class="small dim">스킬 종류 6 × 속성 6</div></div><button data-act="fx3d-preview" ${FX3D.ok && m !== 'off' ? '' : 'disabled'}>보기</button></div>`;
    const i = html.lastIndexOf('<div class="row end">');
    return i >= 0 ? html.slice(0, i) + row + html.slice(i) : html + row;
  };
  const PV_EL = [['fire', '염'], ['bolt', '뇌'], ['water', '수'], ['wood', '목'], ['holy', '성'], ['dark', '암']];
  const PV_TYPE = [['dmg', '단일'], ['aoe', '전체'], ['drain', '흡혈'], ['dot', '지속'], ['heal', '회복'], ['shield', '보호']];
  UI.fxPreviewHtml = function () {
    return `<h3>이펙트 미리 보기</h3>
      <div class="fxpv-stage" id="fxpv"><div class="fxpv-foes" id="fxpv-foes"><i></i><i></i><i></i></div><div class="fxpv-me" id="fxpv-me"><i></i></div></div>
      <div class="fxpv-grid"><span></span>${PV_EL.map(([, n]) => `<b>${n}</b>`).join('')}
        ${PV_TYPE.map(([t, tn]) => `<b>${tn}</b>${PV_EL.map(([e, en]) => `<button class="sm" data-act="fx3d-play" data-v="${t}|${e}" aria-label="${en} ${tn}">▶</button>`).join('')}`).join('')}</div>
      <div class="row end"><button data-act="settings">설정으로</button><button class="primary" data-act="modal-close">닫기</button></div>`;
  };
  UI.fxPreviewPlay = function (t, e) {
    const foes = [...document.querySelectorAll('#fxpv-foes i')]; const me = document.querySelector('#fxpv-me i');
    const to = FX3D.at(foes[1]), from = FX3D.at(me), area = FX3D.at(document.getElementById('fxpv-foes'));
    if (t === 'dmg') FX3D.proj(from, to, e, { edge: 0 });
    else if (t === 'aoe') FX3D.aoe(area, e);
    else if (t === 'drain') { FX3D.proj(from, to, e, {}); setTimeout(() => FX3D.drain(to, from, e), 200); }
    else if (t === 'dot') { FX3D.proj(from, to, e, {}); setTimeout(() => FX3D.linger(to, e), 200); }
    else if (t === 'heal') FX3D.heal(from, e);
    else FX3D.ring(from, e);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'fx3d-mode': FX3D.opt.mode = v; FX3D.save(); return this.openSettings ? this.openSettings() : undefined;
      case 'fx3d-preview': return this.modal(this.fxPreviewHtml(), 'fxpv-box');
      case 'fx3d-play': { const [t, e] = String(v).split('|'); FX3D.init(); return this.fxPreviewPlay(t, e); }
    }
    return baseHandle.call(this, act, v);
  };
}
