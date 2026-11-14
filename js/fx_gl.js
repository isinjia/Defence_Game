// ===== 스킬 이펙트 엔진: WebGL 입자 + 잔상 꼬리 + 빛 번짐 (사용자 요청: 상용 게임 수준 입자) =====
// 화면 전체를 덮는 투명 WebGL 캔버스 한 장. 질감이 있는 입자(빛 번짐·불티·연기·불꽃·잎·물방울·파편·깃털·초승달·문양 등)를
// 한 장의 아틀라스에 미리 그려 두고, 한 번의 그리기 호출로 수천 개를 찍는다. 그 위에 빛 번짐(블룸)을 한 겹 더한다.
//  - 더하기 섞기와 덮어 그리기를 입자마다 고를 수 있다(연기·어둠은 덮어 그려야 검게 보인다).
//  - 입자: 색·크기·투명도가 수명에 따라 변하고, 중력·감속·회전·진행 방향 늘이기를 가진다.
//  - 꼬리(ribbon): 지나온 자리를 이은 띠. 번개(bolt): 매 순간 다시 꺾이는 줄기. 빛줄기(beam).
// 어떤 스킬에 무엇을 쓰는지는 js/fx_forms.js(모양)와 js/fx_forms_map.js(스킬 이름 → 모양)가 정한다.
const FXG = (() => {
  const TAU = Math.PI * 2;
  const R = (a, b) => a + Math.random() * (b - a);
  const hexCache = {};
  const rgb = (h) => hexCache[h] || (hexCache[h] = (() => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; })());
  const ease = (k) => 1 - (1 - k) * (1 - k);
  // 속성 팔레트: hi 가장 밝은 심, main 몸통, lo 어두운 가장자리, deep 연기·그늘
  const EL = {
    fire: { hi: '#fff3c2', main: '#ff7a1a', lo: '#d92a0b', deep: '#3a1208' },
    bolt: { hi: '#ffffff', main: '#ffe84d', lo: '#4aa3ff', deep: '#14233f' },
    water: { hi: '#e6fbff', main: '#2d9bff', lo: '#0d47c9', deep: '#06204d' },
    wood: { hi: '#e3ff9a', main: '#3fd04f', lo: '#128a2c', deep: '#0b3314' },
    holy: { hi: '#fffdf0', main: '#ffd54a', lo: '#ff9d0a', deep: '#5a3600' },
    dark: { hi: '#f0d2ff', main: '#a04bff', lo: '#4b12a8', deep: '#0b0216' },
    none: { hi: '#ffffff', main: '#d5deec', lo: '#8a99b3', deep: '#232a38' },
    blood: { hi: '#ffd0d0', main: '#ff3344', lo: '#a00a1c', deep: '#2a0308' },
    ice: { hi: '#ffffff', main: '#9fe8ff', lo: '#3f9bdc', deep: '#0c2a44' },
    poison: { hi: '#e9ff8a', main: '#8fdc2e', lo: '#5a2ea6', deep: '#1c0f33' },
  };
  const el = (e) => EL[e] || EL.none;

  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  // ---------- 무기·도구 그림 (아틀라스에 팔레트별로 찍는다) ----------
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

  // ---------- 아틀라스: 입자 질감을 캔버스에 직접 그려 한 장으로 ----------
  const AW = 2048, AH = 1024, UV = {};
  const HERO = ['arrow', 'fist', 'dagger', 'spear', 'bomb', 'flask', 'shield', 'talisman', 'note', 'wisp'];
  const PALS = ['fire', 'bolt', 'water', 'wood', 'holy', 'dark', 'none', 'blood', 'ice', 'poison'];
  function buildAtlas() {
    const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH; const g = cv.getContext('2d');
    const rg = (h, stops) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, h); stops.forEach(([p, a]) => gr.addColorStop(p, `rgba(255,255,255,${a})`)); return gr; };
    const soft = (blur, fn) => { g.save(); g.shadowColor = '#fff'; g.shadowBlur = blur; g.fillStyle = '#fff'; g.strokeStyle = '#fff'; fn(); g.restore(); };
    const poly = (pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
    const M = {
      glow: (h) => { g.fillStyle = rg(h * 0.98, [[0, 1], [0.18, 0.6], [0.45, 0.18], [1, 0]]); g.fillRect(-h, -h, h * 2, h * 2); },
      core: (h) => { g.fillStyle = rg(h * 0.95, [[0, 1], [0.38, 1], [0.62, 0.3], [1, 0]]); g.fillRect(-h, -h, h * 2, h * 2); },
      spark: (h) => { g.save(); g.scale(1, 0.13); g.fillStyle = rg(h * 0.96, [[0, 1], [0.35, 0.7], [1, 0]]); g.beginPath(); g.arc(0, 0, h * 0.96, 0, TAU); g.fill(); g.restore(); g.save(); g.scale(1, 0.05); g.fillStyle = rg(h * 0.8, [[0, 1], [1, 0]]); g.beginPath(); g.arc(0, 0, h * 0.8, 0, TAU); g.fill(); g.restore(); },
      smoke: (h) => { for (let i = 0; i < 18; i++) { const a = Math.random() * TAU, d = Math.random() * h * 0.42, r = h * (0.22 + Math.random() * 0.3); g.save(); g.translate(Math.cos(a) * d, Math.sin(a) * d); g.fillStyle = rg(r, [[0, 0.2], [0.6, 0.1], [1, 0]]); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.restore(); } g.globalCompositeOperation = 'destination-in'; g.fillStyle = rg(h * 0.96, [[0, 1], [0.55, 1], [1, 0]]); g.fillRect(-h, -h, h * 2, h * 2); },
      flame: (h) => { soft(h * 0.14, () => { const gr = g.createLinearGradient(0, h * 0.7, 0, -h * 0.8); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0.45)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -h * 0.78); g.bezierCurveTo(h * 0.16, -h * 0.4, h * 0.52, -h * 0.05, h * 0.4, h * 0.34); g.bezierCurveTo(h * 0.3, h * 0.72, -h * 0.3, h * 0.72, -h * 0.4, h * 0.34); g.bezierCurveTo(-h * 0.5, 0, -h * 0.05, -h * 0.25, 0, -h * 0.78); g.fill(); }); },
      star4: (h) => { for (const [sx, sy] of [[1, 0.055], [0.055, 1], [0.6, 0.03], [0.03, 0.6]]) { g.save(); if (sx === 0.6 || sy === 0.6) g.rotate(Math.PI / 4); g.scale(sx, sy); g.fillStyle = rg(h * 0.97, [[0, 1], [0.3, 0.6], [1, 0]]); g.beginPath(); g.arc(0, 0, h * 0.97, 0, TAU); g.fill(); g.restore(); } g.fillStyle = rg(h * 0.3, [[0, 1], [1, 0]]); g.beginPath(); g.arc(0, 0, h * 0.3, 0, TAU); g.fill(); },
      ring: (h) => { soft(h * 0.1, () => { g.lineWidth = h * 0.045; g.beginPath(); g.arc(0, 0, h * 0.8, 0, TAU); g.stroke(); }); },
      wave: (h) => { g.fillStyle = rg(h * 0.98, [[0, 0], [0.5, 0], [0.74, 0.35], [0.86, 1], [0.9, 0.25], [1, 0]]); g.fillRect(-h, -h, h * 2, h * 2); },
      leaf: (h) => { soft(2, () => { g.beginPath(); g.moveTo(-h * 0.85, 0); g.quadraticCurveTo(0, -h * 0.6, h * 0.85, 0); g.quadraticCurveTo(0, h * 0.6, -h * 0.85, 0); g.fill(); }); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = h * 0.05; g.beginPath(); g.moveTo(-h * 0.8, 0); g.lineTo(h * 0.8, 0); for (let i = -2; i <= 2; i++) { g.moveTo(i * h * 0.24, 0); g.lineTo(i * h * 0.24 + h * 0.18, -h * 0.2); g.moveTo(i * h * 0.24, 0); g.lineTo(i * h * 0.24 + h * 0.18, h * 0.2); } g.stroke(); },
      drop: (h) => { soft(h * 0.08, () => { g.beginPath(); g.moveTo(h * 0.7, 0); g.bezierCurveTo(h * 0.7, h * 0.42, h * 0.1, h * 0.4, -h * 0.85, 0); g.bezierCurveTo(h * 0.1, -h * 0.4, h * 0.7, -h * 0.42, h * 0.7, 0); g.fill(); }); },
      shard: (h) => { soft(h * 0.06, () => { poly([[-h * 0.9, 0], [-h * 0.1, -h * 0.17], [h * 0.9, 0], [-h * 0.1, h * 0.17]]); g.fill(); }); },
      petal: (h) => { soft(2, () => { g.beginPath(); g.moveTo(-h * 0.7, 0); g.bezierCurveTo(-h * 0.3, -h * 0.55, h * 0.5, -h * 0.5, h * 0.75, 0); g.bezierCurveTo(h * 0.5, h * 0.5, -h * 0.3, h * 0.55, -h * 0.7, 0); g.fill(); }); g.globalCompositeOperation = 'destination-out'; g.fillStyle = rg(h * 0.5, [[0, 0.35], [1, 0]]); g.beginPath(); g.arc(-h * 0.5, 0, h * 0.5, 0, TAU); g.fill(); },
      feather: (h) => { soft(2, () => { g.beginPath(); g.moveTo(-h * 0.9, 0); g.bezierCurveTo(-h * 0.4, -h * 0.34, h * 0.5, -h * 0.3, h * 0.9, 0); g.bezierCurveTo(h * 0.5, h * 0.3, -h * 0.4, h * 0.34, -h * 0.9, 0); g.fill(); }); g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = h * 0.03; g.beginPath(); g.moveTo(-h * 0.9, 0); g.lineTo(h * 0.9, 0); for (let i = -6; i <= 6; i++) { g.moveTo(i * h * 0.12, 0); g.lineTo(i * h * 0.12 - h * 0.14, -h * 0.26); g.moveTo(i * h * 0.12, 0); g.lineTo(i * h * 0.12 - h * 0.14, h * 0.26); } g.stroke(); },
      plus: (h) => { soft(h * 0.14, () => { g.fillRect(-h * 0.16, -h * 0.6, h * 0.32, h * 1.2); g.fillRect(-h * 0.6, -h * 0.16, h * 1.2, h * 0.32); }); },
      chev: (h) => { soft(h * 0.1, () => { poly([[0, -h * 0.75], [h * 0.55, -h * 0.1], [h * 0.22, -h * 0.1], [h * 0.22, h * 0.7], [-h * 0.22, h * 0.7], [-h * 0.22, -h * 0.1], [-h * 0.55, -h * 0.1]]); g.fill(); }); },
      hex: (h) => { const pts = Array.from({ length: 6 }, (_, i) => [Math.cos(i * TAU / 6) * h * 0.82, Math.sin(i * TAU / 6) * h * 0.82]); g.fillStyle = 'rgba(255,255,255,0.14)'; poly(pts); g.fill(); soft(h * 0.08, () => { g.lineWidth = h * 0.06; g.lineJoin = 'round'; poly(pts); g.stroke(); }); },
      bubble: (h) => { g.fillStyle = rg(h * 0.8, [[0, 0.05], [0.8, 0.14], [1, 0.5]]); g.beginPath(); g.arc(0, 0, h * 0.8, 0, TAU); g.fill(); soft(2, () => { g.lineWidth = h * 0.05; g.beginPath(); g.arc(0, 0, h * 0.8, 0, TAU); g.stroke(); g.lineWidth = h * 0.09; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, h * 0.56, -2.4, -1.6); g.stroke(); }); },
      star5: (h) => { soft(h * 0.1, () => { poly(Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? h * 0.36 : h * 0.82, a = -Math.PI / 2 + i * TAU / 10; return [Math.cos(a) * r, Math.sin(a) * r]; })); g.fill(); }); },
      ray: (h) => { const gr = g.createLinearGradient(0, 0, h * 0.96, 0); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; poly([[0, 0], [h * 0.96, -h * 0.2], [h * 0.96, h * 0.2]]); g.fill(); },
      line: (h) => { const gr = g.createLinearGradient(0, -h * 0.9, 0, h * 0.9); [[0, 0], [0.3, 0.18], [0.44, 0.7], [0.5, 1], [0.56, 0.7], [0.7, 0.18], [1, 0]].forEach(([p, a]) => gr.addColorStop(p, `rgba(255,255,255,${a})`)); g.fillStyle = gr; g.fillRect(-h, -h * 0.9, h * 2, h * 1.8); },
      eye: (h) => { soft(h * 0.08, () => { g.lineWidth = h * 0.07; g.beginPath(); g.moveTo(-h * 0.85, 0); g.quadraticCurveTo(0, -h * 0.62, h * 0.85, 0); g.quadraticCurveTo(0, h * 0.62, -h * 0.85, 0); g.stroke(); g.beginPath(); g.arc(0, 0, h * 0.26, 0, TAU); g.fill(); }); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(0, 0, h * 0.06, h * 0.2, 0, 0, TAU); g.fill(); },
      skull: (h) => { soft(h * 0.06, () => { g.beginPath(); g.arc(0, -h * 0.15, h * 0.52, 0, TAU); g.fill(); g.fillRect(-h * 0.3, h * 0.2, h * 0.6, h * 0.34); }); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.ellipse(-h * 0.2, -h * 0.14, h * 0.13, h * 0.16, 0, 0, TAU); g.ellipse(h * 0.2, -h * 0.14, h * 0.13, h * 0.16, 0, 0, TAU); g.fill(); poly([[0, h * 0.06], [-h * 0.07, h * 0.2], [h * 0.07, h * 0.2]]); g.fill(); for (let i = -2; i <= 2; i++) g.fillRect(i * h * 0.12 - h * 0.015, h * 0.3, h * 0.03, h * 0.26); },
      fang: (h) => { soft(h * 0.05, () => { poly([[-h * 0.34, -h * 0.8], [h * 0.34, -h * 0.8], [h * 0.05, h * 0.85], [-h * 0.05, h * 0.85]]); g.fill(); }); },
      chain: (h) => { soft(h * 0.06, () => { g.lineWidth = h * 0.12; for (const x of [-h * 0.45, h * 0.45]) { g.beginPath(); g.ellipse(x, 0, h * 0.42, h * 0.22, 0, 0, TAU); g.stroke(); } }); },
      hand: (h) => { soft(h * 0.05, () => { const rr = (x, y, w, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.fill(); }; rr(-h * 0.38, -h * 0.05, h * 0.76, h * 0.8, h * 0.2); for (let i = 0; i < 4; i++) rr(-h * 0.38 + i * h * 0.195, -h * (0.62 + (i === 1 || i === 2 ? 0.16 : 0)), h * 0.17, h * 0.75, h * 0.08); g.save(); g.translate(-h * 0.42, h * 0.25); g.rotate(-0.7); rr(-h * 0.1, -h * 0.5, h * 0.2, h * 0.55, h * 0.09); g.restore(); }); },
      crack: (h) => { soft(h * 0.05, () => { g.lineWidth = h * 0.05; g.lineJoin = 'miter'; const br = (x, y, a, len, d) => { let px = x, py = y; g.beginPath(); g.moveTo(px, py); const n = 4; for (let i = 0; i < n; i++) { const aa = a + (Math.random() - 0.5) * 1.0; px += Math.cos(aa) * len / n; py += Math.sin(aa) * len / n; g.lineTo(px, py); if (d > 0 && Math.random() < 0.6) { g.stroke(); br(px, py, aa + (Math.random() < 0.5 ? 0.8 : -0.8), len * 0.5, d - 1); g.beginPath(); g.moveTo(px, py); } } g.stroke(); }; for (let i = 0; i < 6; i++) br(0, 0, i * TAU / 6 + Math.random() * 0.5, h * 0.85, 2); }); },
      bone: (h) => { soft(h * 0.05, () => { g.fillRect(-h * 0.62, -h * 0.09, h * 1.24, h * 0.18); for (const x of [-h * 0.66, h * 0.66]) for (const y of [-h * 0.12, h * 0.12]) { g.beginPath(); g.arc(x, y, h * 0.16, 0, TAU); g.fill(); } }); },
      sword: (h) => { soft(h * 0.05, () => { poly([[h * 0.92, 0], [h * 0.7, -h * 0.09], [-h * 0.35, -h * 0.09], [-h * 0.35, h * 0.09], [h * 0.7, h * 0.09]]); g.fill(); g.fillRect(-h * 0.44, -h * 0.26, h * 0.1, h * 0.52); g.fillRect(-h * 0.8, -h * 0.05, h * 0.38, h * 0.1); g.beginPath(); g.arc(-h * 0.84, 0, h * 0.08, 0, TAU); g.fill(); }); },
      // 256 크기
      crescent: (h) => { g.translate(-h * 0.42, 0); soft(h * 0.07, () => { const r = h * 1.25, a = 0.82, th = h * 0.5; const gr = g.createLinearGradient(r - th * 1.1, 0, r, 0); gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, -a, a); g.quadraticCurveTo(r - th * 1.5, 0, Math.cos(-a) * r, Math.sin(-a) * r); g.closePath(); g.fill(); }); },
      rune: (h) => { soft(h * 0.05, () => { g.lineWidth = h * 0.028; for (const r of [0.9, 0.82, 0.5]) { g.beginPath(); g.arc(0, 0, h * r, 0, TAU); g.stroke(); } for (let t = 0; t < 2; t++) { poly([0, 1, 2].map((i) => { const a = -Math.PI / 2 + t * Math.PI + i * TAU / 3; return [Math.cos(a) * h * 0.82, Math.sin(a) * h * 0.82]; })); g.stroke(); } for (let i = 0; i < 24; i++) { const a = i * TAU / 24; g.beginPath(); g.moveTo(Math.cos(a) * h * 0.82, Math.sin(a) * h * 0.82); g.lineTo(Math.cos(a) * h * (i % 2 ? 0.86 : 0.9), Math.sin(a) * h * (i % 2 ? 0.86 : 0.9)); g.stroke(); } for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.beginPath(); g.arc(Math.cos(a) * h * 0.66, Math.sin(a) * h * 0.66, h * 0.05, 0, TAU); g.stroke(); } }); },
      bagua: (h) => { soft(h * 0.05, () => { g.lineWidth = h * 0.03; g.beginPath(); g.arc(0, 0, h * 0.9, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, h * 0.34, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, -h * 0.17, h * 0.17, -Math.PI / 2, Math.PI / 2); g.arc(0, h * 0.17, h * 0.17, -Math.PI / 2, Math.PI / 2, true); g.stroke(); g.lineWidth = h * 0.05; for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * TAU / 8); for (let j = 0; j < 3; j++) { const y = -h * (0.5 + j * 0.1); if ((i + j) % 3) { g.beginPath(); g.moveTo(-h * 0.16, y); g.lineTo(h * 0.16, y); g.stroke(); } else { g.beginPath(); g.moveTo(-h * 0.16, y); g.lineTo(-h * 0.04, y); g.moveTo(h * 0.04, y); g.lineTo(h * 0.16, y); g.stroke(); } } g.restore(); } }); },
      clock: (h) => { soft(h * 0.05, () => { g.lineWidth = h * 0.03; g.beginPath(); g.arc(0, 0, h * 0.88, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, h * 0.78, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.lineWidth = h * (i % 3 ? 0.02 : 0.05); g.beginPath(); g.moveTo(Math.cos(a) * h * 0.66, Math.sin(a) * h * 0.66); g.lineTo(Math.cos(a) * h * 0.78, Math.sin(a) * h * 0.78); g.stroke(); } g.lineWidth = h * 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h * 0.56); g.moveTo(0, 0); g.lineTo(h * 0.36, h * 0.1); g.stroke(); g.beginPath(); g.arc(0, 0, h * 0.06, 0, TAU); g.fill(); }); },
      wing: (h) => { soft(h * 0.04, () => { for (let i = 0; i < 9; i++) { g.save(); g.translate(-h * 0.8, h * 0.5); g.rotate(-1.35 + i * 0.16); const L = h * (1.55 - i * 0.09); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(L * 0.35, -h * 0.14, L * 0.8, -h * 0.1, L, 0); g.bezierCurveTo(L * 0.8, h * 0.1, L * 0.35, h * 0.1, 0, 0); g.fill(); g.restore(); } }); },
    };
    const big = ['crescent', 'rune', 'bagua', 'clock', 'wing'];
    let x = 0, y = 0;
    for (const name of Object.keys(M)) {
      const s = big.includes(name) ? 256 : 128;
      if (x + s > 1024) { x = 0; y += 128; }
      if (s === 256 && y < 512) { x = 0; y = 512; } // 큰 것은 아래 반쪽
      if (s === 256 && x + s > 1024) { x = 0; y += 256; }
      g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip(); g.translate(x + s / 2, y + s / 2); M[name](s / 2 - 3); g.restore();
      const pad = name === 'line' ? 6 : 1; UV[name] = [(x + pad) / AW, (y + 1) / AH, (x + s - pad) / AW, (y + s - 1) / AH];
      x += s;
    }
    // 무기 그림: 팔레트별로 색을 입혀 오른쪽 반쪽에 (96px 칸)
    PALS.forEach((pn, j) => HERO.forEach((hn, i) => { const cx = 1024 + i * 96, cy = j * 96; g.save(); g.beginPath(); g.rect(cx, cy, 96, 96); g.clip(); g.translate(cx + 48, cy + 48); g.scale(1.15, 1.15); const E = EL[pn]; try { SHAPE[hn](g, { main: E.main, hi: E.hi, lo: E.lo }, 1); } catch (e) { /* 무시 */ } g.restore(); UV[`h_${hn}_${pn}`] = [(cx + 1) / AW, (cy + 1) / AH, (cx + 95) / AW, (cy + 95) / AH]; }));
    return cv;
  }
  // ---------- WebGL: 사각형 묶음 그리기 + 빛 번짐 ----------
  const MAXQ = 6000, VS = 9; // 꼭짓점: x y u v r g b a keep
  const S = { cv: null, gl: null, ok: false, tried: false, items: [], raf: 0, last: 0, manual: false, n: 0, W: 0, H: 0, dpr: 1, speed: () => 1, quality: () => 1, bloom: () => true, atlas: null };
  const buf = new Float32Array(MAXQ * 4 * VS);
  function prog(gl, vs, fs) { const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }; const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link'); return p; }
  function init() {
    if (S.tried) return S.ok; S.tried = true;
    try {
      if (typeof document === 'undefined') return false;
      const cv = document.createElement('canvas'); cv.id = 'fxg'; cv.setAttribute('aria-hidden', 'true');
      cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1250';
      const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
      if (!gl) return false;
      S.pMain = prog(gl, 'attribute vec2 p; attribute vec2 t; attribute vec4 c; attribute float k; uniform vec2 res; varying vec2 vt; varying vec4 vc; varying float vk; void main(){ vt=t; vc=c; vk=k; gl_Position=vec4(p.x/res.x*2.0-1.0, 1.0-p.y/res.y*2.0, 0.0, 1.0); }',
        'precision mediump float; uniform sampler2D tex; varying vec2 vt; varying vec4 vc; varying float vk; void main(){ vec4 s=texture2D(tex, vt); gl_FragColor=vec4(s.rgb*vc.rgb*vc.a, s.a*vc.a*vk); }');
      S.pPost = prog(gl, 'attribute vec2 p; varying vec2 vt; void main(){ vt=p*0.5+0.5; gl_Position=vec4(p,0.0,1.0); }',
        'precision mediump float; uniform sampler2D tex; uniform vec2 dir; uniform float gain; uniform float keep; varying vec2 vt; void main(){ vec4 s=texture2D(tex,vt)*0.227; s+=(texture2D(tex,vt+dir*1.385)+texture2D(tex,vt-dir*1.385))*0.316; s+=(texture2D(tex,vt+dir*3.231)+texture2D(tex,vt-dir*3.231))*0.07; gl_FragColor=vec4(s.rgb*gain, s.a*keep); }');
      S.vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, S.vb); gl.bufferData(gl.ARRAY_BUFFER, buf.byteLength, gl.DYNAMIC_DRAW);
      const idx = new Uint16Array(MAXQ * 6); for (let i = 0; i < MAXQ; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      S.ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, S.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      S.qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, S.qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      S.atlas = buildAtlas();
      S.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, S.tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, S.atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      document.body.appendChild(cv); S.cv = cv; S.gl = gl; S.ok = true; resize();
      window.addEventListener('resize', resize);
      cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); S.ok = false; S.items = []; });
    } catch (e) { S.ok = false; }
    return S.ok;
  }
  function target(gl, w, h) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return { t, f, w, h }; }
  function resize(w, h, dpr) {
    if (!S.gl) return; const gl = S.gl;
    S.W = w || window.innerWidth; S.H = h || window.innerHeight; S.dpr = dpr || Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.max(2, Math.round(S.W * S.dpr)), ph = Math.max(2, Math.round(S.H * S.dpr));
    S.cv.width = pw; S.cv.height = ph;
    for (const k of ['scene', 'b1', 'b2']) if (S[k]) { gl.deleteTexture(S[k].t); gl.deleteFramebuffer(S[k].f); }
    S.scene = target(gl, pw, ph); S.b1 = target(gl, Math.max(2, pw >> 2), Math.max(2, ph >> 2)); S.b2 = target(gl, Math.max(2, pw >> 2), Math.max(2, ph >> 2));
  }
  // 사각형 하나: 네 귀퉁이 좌표를 직접 (꼬리·번개·빛줄기용)
  function quad4(uv, x0, y0, x1, y1, x2, y2, x3, y3, c, a, keep) {
    if (S.n >= MAXQ || a <= 0.003) return; let o = S.n * 4 * VS; const r = c[0], g = c[1], b = c[2];
    buf[o] = x0; buf[o + 1] = y0; buf[o + 2] = uv[0]; buf[o + 3] = uv[1]; buf[o + 4] = r; buf[o + 5] = g; buf[o + 6] = b; buf[o + 7] = a; buf[o + 8] = keep; o += VS;
    buf[o] = x1; buf[o + 1] = y1; buf[o + 2] = uv[2]; buf[o + 3] = uv[1]; buf[o + 4] = r; buf[o + 5] = g; buf[o + 6] = b; buf[o + 7] = a; buf[o + 8] = keep; o += VS;
    buf[o] = x2; buf[o + 1] = y2; buf[o + 2] = uv[2]; buf[o + 3] = uv[3]; buf[o + 4] = r; buf[o + 5] = g; buf[o + 6] = b; buf[o + 7] = a; buf[o + 8] = keep; o += VS;
    buf[o] = x3; buf[o + 1] = y3; buf[o + 2] = uv[0]; buf[o + 3] = uv[3]; buf[o + 4] = r; buf[o + 5] = g; buf[o + 6] = b; buf[o + 7] = a; buf[o + 8] = keep;
    S.n++;
  }
  // 가운데·크기·회전으로 찍는 질감 하나. add=true 면 빛을 더하고, false 면 덮어 그린다
  function spr(name, x, y, w, h, rot, c, a, add) {
    const uv = UV[name] || UV.glow; const cs = Math.cos(rot || 0), sn = Math.sin(rot || 0), hw = w / 2, hh = h / 2;
    const ax = cs * hw, ay = sn * hw, bx = -sn * hh, by = cs * hh;
    quad4(uv, x - ax - bx, y - ay - by, x + ax - bx, y + ay - by, x + ax + bx, y + ay + by, x - ax + bx, y - ay + by, c, a, add === false ? 1 : 0);
  }
  // 두 점을 잇는 띠 (line 질감)
  function seg(x1, y1, x2, y2, w1, w2, c, a, add, name) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    quad4(UV[name || 'line'], x1 + nx * w1 / 2, y1 + ny * w1 / 2, x2 + nx * w2 / 2, y2 + ny * w2 / 2, x2 - nx * w2 / 2, y2 - ny * w2 / 2, x1 - nx * w1 / 2, y1 - ny * w1 / 2, c, a, add === false ? 1 : 0);
  }
  function render() {
    const gl = S.gl; if (!gl) return;
    const pw = S.cv.width, ph = S.cv.height, bloom = S.bloom() && S.n > 0;
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloom ? S.scene.f : null); gl.viewport(0, 0, pw, ph); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (S.n) {
      gl.useProgram(S.pMain); gl.bindBuffer(gl.ARRAY_BUFFER, S.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf.subarray(0, S.n * 4 * VS));
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, S.ib);
      const st = VS * 4; const A = (n, sz, off) => { const l = gl.getAttribLocation(S.pMain, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, st, off * 4); };
      A('p', 2, 0); A('t', 2, 2); A('c', 4, 4); A('k', 1, 8);
      gl.uniform2f(gl.getUniformLocation(S.pMain, 'res'), S.W, S.H); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, S.tex); gl.uniform1i(gl.getUniformLocation(S.pMain, 'tex'), 0);
      gl.drawElements(gl.TRIANGLES, S.n * 6, gl.UNSIGNED_SHORT, 0);
    }
    if (!bloom) return;
    // 빛 번짐: 장면을 1/4 크기로 줄여 가로·세로로 흐린 뒤 원본 위에 더한다
    gl.useProgram(S.pPost); gl.bindBuffer(gl.ARRAY_BUFFER, S.qb); const l = gl.getAttribLocation(S.pPost, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
    const U = (n) => gl.getUniformLocation(S.pPost, n); gl.uniform1i(U('tex'), 0);
    const pass = (src, dst, w, h, dx, dy, gain, keep, blend) => { gl.bindFramebuffer(gl.FRAMEBUFFER, dst); gl.viewport(0, 0, w, h); if (blend) gl.enable(gl.BLEND); else { gl.disable(gl.BLEND); gl.clear(gl.COLOR_BUFFER_BIT); } gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform2f(U('dir'), dx, dy); gl.uniform1f(U('gain'), gain); gl.uniform1f(U('keep'), keep); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    pass(S.scene.t, S.b1.f, S.b1.w, S.b1.h, 1.6 / S.b1.w, 0, 1, 1, false);
    pass(S.b1.t, S.b2.f, S.b2.w, S.b2.h, 0, 1.6 / S.b2.h, 1, 1, false);
    pass(S.b2.t, S.b1.f, S.b1.w, S.b1.h, 3.2 / S.b1.w, 0, 1, 1, false);
    pass(S.b1.t, S.b2.f, S.b2.w, S.b2.h, 0, 3.2 / S.b2.h, 1, 1, false);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, pw, ph); gl.clear(gl.COLOR_BUFFER_BIT);
    pass(S.scene.t, null, pw, ph, 0, 0, 1 / 0.859, 1 / 0.859, true); // 원본(흐림 0 → 가중치 합 0.859 보정)
    pass(S.b2.t, null, pw, ph, 0, 0, 0.95, 0, true);                  // 번짐은 빛만 더한다
  }

  // ---------- 입자·항목 ----------
  function add(it) { it.t = -(it.delay || 0); S.items.push(it); kick(); return it; }
  const at = (delay, fn) => add({ delay, life: 0.001, once: fn });
  function kick() { if (S.manual || S.raf || !init()) return; S.last = performance.now(); S.raf = requestAnimationFrame(frame); }
  function frame(now) { const dt = Math.min(0.05, (now - S.last) / 1000) * S.speed(); S.last = now; step(dt); S.raf = S.items.length ? requestAnimationFrame(frame) : 0; if (!S.raf) { S.n = 0; render(); } }
  function step(dt) {
    if (!init()) return; S.n = 0;
    const arr = S.items; S.items = [];
    for (let i = 0; i < arr.length; i++) {
      const it = arr[i]; it.t += dt; if (it.t < 0) { S.items.push(it); continue; }
      if (it.once) { if (!it.done) { it.done = 1; try { it.once(); } catch (e) { /* 무시 */ } } continue; }
      const k = it.t / it.life; if (k >= 1) { if (it.end) try { it.end(it); } catch (e) { /* 무시 */ } continue; }
      try { if (it.p) drawP(it, k, dt); else it.draw(k, it, dt); } catch (e) { continue; }
      S.items.push(it);
    }
    render();
  }
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // 입자 하나를 움직이고 그린다
  function drawP(it, k, dt) {
    const d = Math.pow(it.drag, dt * 60); it.vx = (it.vx + it.ax * dt) * d; it.vy = (it.vy + it.ay * dt) * d; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
    let x = it.x, y = it.y; if (it.wob) { x += Math.sin(it.t * it.wf + it.ph) * it.wob; }
    const kk = it.pop ? ease(k) : k; const s = it.s0 + (it.s1 - it.s0) * kk;
    const al = it.a * (k < it.fin ? k / it.fin : 1) * (k > it.fout ? 1 - (k - it.fout) / (1 - it.fout) : 1);
    const c = it.c1 ? lerp3(it.c0, it.c1, k) : it.c0;
    let rot = it.rot, w = s, h = s * it.asp;
    if (it.face) { rot = Math.atan2(it.vy, it.vx); if (it.stretch) w = s + Math.hypot(it.vx, it.vy) * it.stretch; }
    spr(it.tex, x, y, w, h, rot, c, al, it.add);
  }
  const N = (n) => Math.max(1, Math.round(n * S.quality()));
  // 입자 추가. o: vx vy ax ay drag life delay s|[s0,s1] asp rot vr face stretch c|[c0,c1] a fin fout add pop wob wf
  function p(tex, x, y, o = {}) {
    if (S.items.length > 5200) return null;
    const sz = Array.isArray(o.s) ? o.s : [o.s || 10, (o.s || 10) * (o.shrink ?? 0.3)]; const cc = Array.isArray(o.c) ? o.c : [o.c || '#ffffff'];
    return add({ p: 1, tex, x, y, vx: o.vx || 0, vy: o.vy || 0, ax: o.ax || 0, ay: o.ay || 0, drag: o.drag ?? 0.94, life: o.life || 0.5, delay: o.delay || 0, s0: sz[0], s1: sz[1], asp: o.asp || 1, rot: o.rot || 0, vr: o.vr || 0, face: !!o.face, stretch: o.stretch || 0, c0: rgb(cc[0]), c1: cc[1] ? rgb(cc[1]) : null, a: o.a ?? 1, fin: o.fin ?? 0.08, fout: o.fout ?? 0.45, add: o.add !== false, pop: !!o.pop, wob: o.wob || 0, wf: o.wf || 9, ph: Math.random() * TAU, end: o.end });
  }
  // 방사형으로 n개: 방향 ang±spread, 속도 [v0,v1]
  function burst(tex, x, y, n, o = {}) { const ang = o.ang ?? 0, sp = o.spread ?? Math.PI, v = o.v || [100, 300]; for (let i = 0; i < N(n); i++) { const a = ang + R(-sp, sp), s = R(v[0], v[1]); p(tex, x + (o.jx ? R(-o.jx, o.jx) : 0), y + (o.jy ? R(-o.jy, o.jy) : 0), { ...o, vx: Math.cos(a) * s + (o.vx || 0), vy: Math.sin(a) * s + (o.vy || 0), life: Array.isArray(o.life) ? R(o.life[0], o.life[1]) : o.life, s: Array.isArray(o.sz) ? [R(o.sz[0], o.sz[1]), o.sz[2] ?? 0] : o.s, rot: o.rrot ? R(0, TAU) : o.rot, vr: o.rvr ? R(-o.rvr, o.rvr) : o.vr, delay: (o.delay || 0) + (o.dj ? R(0, o.dj) : 0) }); } }
  // 꼬리: 따라갈 대상의 지나온 자리를 띠로 잇는다
  function ribbon(get, o = {}) {
    const pts = [], maxN = o.len || 14, c0 = rgb((o.c || ['#ffffff'])[0]), c1 = rgb((o.c || ['#ffffff'])[1] || (o.c || ['#ffffff'])[0]);
    const it = add({ life: 9, delay: o.delay, alive: true, draw(k, self, dt) {
      if (self.alive) { const q = get(); if (q) pts.unshift([q[0], q[1]]); else self.alive = false; } else pts.pop();
      if (pts.length > maxN) pts.length = maxN;
      if (!self.alive && pts.length < 2) { self.t = self.life; return; }
      for (let i = 0; i < pts.length - 1; i++) { const k1 = i / maxN, k2 = (i + 1) / maxN; const w1 = (o.w || 10) * (1 - k1), w2 = (o.w || 10) * (1 - k2); seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w1, w2, lerp3(c0, c1, k1), (o.a ?? 0.9) * (1 - k1), o.add !== false); }
    } });
    return { stop() { it.alive = false; } };
  }
  // 번개: 매 0.04초 다시 꺾이는 줄기 + 가지
  function bolt(x1, y1, x2, y2, E, o = {}) {
    const w = o.w || 6, life = o.life || 0.24, br = o.branch ?? 2; let pts = [], subs = [], tt = 9;
    const mk = (ax, ay, bx, by, amp) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(3, Math.round(L / 20)), a = Math.atan2(by - ay, bx - ax), nx = Math.sin(a), ny = -Math.cos(a), out = [[ax, ay]]; for (let i = 1; i < n; i++) { const t = i / n, off = R(-amp, amp); out.push([ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off]); } out.push([bx, by]); return out; };
    const cm = rgb(E.main), ch = rgb(E.hi), cl = rgb(E.lo);
    add({ life, delay: o.delay, draw(k, it, dt) {
      tt += dt; if (tt > 0.045) { tt = 0; const L = Math.hypot(x2 - x1, y2 - y1); pts = mk(x1, y1, x2, y2, Math.min(20, L * 0.1)); subs = []; for (let i = 0; i < br; i++) { const q = pts[1 + Math.floor(Math.random() * (pts.length - 2))] || pts[0], a = Math.atan2(y2 - y1, x2 - x1) + R(-1.2, 1.2), l = L * R(0.15, 0.32); subs.push(mk(q[0], q[1], q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l, 7)); } }
      const al = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      const line = (pp, ww) => { for (let i = 0; i < pp.length - 1; i++) { seg(pp[i][0], pp[i][1], pp[i + 1][0], pp[i + 1][1], ww * 5, ww * 5, cl, 0.5 * al, true); seg(pp[i][0], pp[i][1], pp[i + 1][0], pp[i + 1][1], ww * 2.2, ww * 2.2, cm, 0.95 * al, true); seg(pp[i][0], pp[i][1], pp[i + 1][0], pp[i + 1][1], ww, ww, ch, al, true); } };
      line(pts, w); subs.forEach((s) => line(s, w * 0.5));
      for (const q of pts) spr('glow', q[0], q[1], w * 5, w * 5, 0, cm, 0.35 * al, true);
    } });
  }
  // 빛줄기: from → to 로 뻗었다 가늘어지며 사라진다
  function beam(x1, y1, x2, y2, E, o = {}) {
    const w = o.w || 16, life = o.life || 0.45, cm = rgb(E.main), ch = rgb(E.hi), cl = rgb(E.lo);
    add({ life, delay: o.delay, draw(k) { const g = Math.min(1, k / 0.14), al = k > 0.5 ? 1 - (k - 0.5) / 0.5 : 1, ww = w * (k > 0.5 ? 1 - (k - 0.5) : 1) * (0.9 + 0.1 * Math.sin(k * 70)), ex = x1 + (x2 - x1) * g, ey = y1 + (y2 - y1) * g; seg(x1, y1, ex, ey, ww * 4, ww * 4, cl, 0.45 * al, o.add !== false); seg(x1, y1, ex, ey, ww * 2, ww * 2, cm, 0.9 * al, true); seg(x1, y1, ex, ey, ww * 0.8, ww * 0.8, ch, al, true); spr('glow', x1, y1, ww * 5, ww * 5, 0, ch, 0.8 * al, true); spr('glow', ex, ey, ww * 6, ww * 6, 0, cm, 0.9 * al, true); } });
  }
  // 무기 그림을 띄운다 (맞는 순간 꽂힌 채 사라지는 것 등)
  const hero = (shape, pal) => `h_${shape}_${EL[pal] ? pal : 'none'}`;

  return { S, EL, el, UV, R, TAU, rgb, ease, N, init, resize, add, at, step, p, burst, spr, seg, ribbon, bolt, beam, hero, lerp3 };
})();
