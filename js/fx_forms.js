// ===== 스킬 이펙트 연출 (엔진: js/fx_gl.js) =====
// 스킬 한 번의 연출 = 모양(form: 검기·화살·주먹…) + 속성(염·뇌·수·목·성·암) + 스킬 종류(치명·연속·관통·전체…) + 이름에서 읽은 꾸밈(비·폭풍·용·달·꽃…).
// 다른 게임에서 같은 종류의 스킬이 흔히 보이는 방식을 따랐다: 검기는 초승달 칼바람, 발도는 한 줄 섬광 뒤 늦게 터지는 베기,
// 화염구는 불덩이와 폭발, 화살비는 하늘에서 쏟아지는 화살, 심판은 하늘에서 내리꽂는 빛기둥, 회복은 솟는 빛과 십자,
// 보호막은 육각 판이 맞물리는 막, 부활은 빛기둥과 날개, 시간 정지는 시계 문양이 깨지는 식.
// 어떤 스킬이 무엇을 쓰는지는 js/fx_forms_map.js 가 스킬 이름과 직업으로 고른다.
const FXF = (() => {
  const G = FXG, R = G.R, TAU = G.TAU, el = G.el, N = G.N, p = G.p, burst = G.burst, at = G.at, add = G.add, rgb = G.rgb, ease = G.ease;
  const WHITE = [1, 1, 1];
  const dirOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

  // ---------- 공통 조각 ----------
  // 번쩍: 흰 심 + 색 번짐
  const flash = (x, y, E, sc = 1, delay = 0) => { p('core', x, y, { s: [18 * sc, 52 * sc], c: [E.hi, E.main], life: 0.11, a: 0.9, pop: true, fout: 0.2, delay }); p('star4', x, y, { s: [60 * sc, 210 * sc], c: [E.hi, E.main], life: 0.16, a: 0.85, pop: true, fout: 0.2, rot: R(0, 1.5), delay }); p('glow', x, y, { s: [80 * sc, 240 * sc], c: [E.main, E.lo], life: 0.32, a: 0.6, pop: true, fout: 0.15, delay }); };
  // 충격파 고리 (sq: 세로 납작 비율 → 바닥에 퍼지는 고리)
  const shock = (x, y, E, r = 80, sq = 1, delay = 0, life = 0.38) => p('wave', x, y, { s: [r * 0.35, r * 2.1], asp: sq, c: [E.hi, E.main], life, pop: true, fout: 0.3, delay });
  const ringThin = (x, y, E, r = 60, sq = 1, delay = 0, life = 0.4) => p('ring', x, y, { s: [r * 0.3, r * 2.4], asp: sq, c: [E.hi, E.main], life, pop: true, fout: 0.3, delay });
  // 불티: 진행 방향으로 늘어난 빛 조각
  const sparks = (x, y, E, n = 16, sc = 1, o = {}) => burst('spark', x, y, n, { v: [220 * sc, 640 * sc], sz: [16 * sc, 30 * sc, 3], asp: 0.3, face: true, stretch: 0.012, c: [E.hi, E.main], life: [0.22, 0.5], drag: 0.9, ...o });
  // 연기: 덮어 그리는 어두운 덩이
  const smoke = (x, y, n = 5, sc = 1, c = ['#2a2f3a', '#0c0e13'], o = {}) => burst('smoke', x, y, n, { v: [10, 70], sz: [44 * sc, 70 * sc, 130 * sc], c, life: [0.6, 1.1], add: false, a: 0.55, ay: -50, rrot: true, rvr: 1.2, fin: 0.15, fout: 0.3, jx: 12 * sc, jy: 8 * sc, ...o });
  // 사방으로 뻗는 빛살 (만화식 타격선)
  const rays = (x, y, E, n = 10, len = 120, o = {}) => { for (let i = 0; i < N(n); i++) { const a = i / N(n) * TAU + R(-0.15, 0.15), L = len * R(0.7, 1.15); p('ray', x + Math.cos(a) * 18, y + Math.sin(a) * 18, { rot: a, s: [L * 0.3, L], asp: o.asp || 0.28, c: [E.hi, E.main], life: o.life || 0.3, vx: Math.cos(a) * L * 1.2, vy: Math.sin(a) * L * 1.2, drag: 0.9, fout: 0.3, delay: o.delay }); } };
  // 칼자국: 가운데가 밝고 끝이 뾰족한 한 줄
  const cut = (x, y, ang, len, E, delay = 0, w = 1) => { p('spark', x, y, { rot: ang, s: [len * 0.25, len], asp: 0.32 * w, c: [E.main, E.lo], life: 0.3, a: 0.75, pop: true, fout: 0.3, delay }); p('spark', x, y, { rot: ang, s: [len * 0.25, len * 1.05], asp: 0.12 * w, c: [E.hi, E.hi], life: 0.26, pop: true, fout: 0.35, delay }); at(delay + 0.02, () => { for (let i = -2; i <= 2; i++) burst('spark', x + Math.cos(ang) * i * len * 0.16, y + Math.sin(ang) * i * len * 0.16, 1, { ang: ang + (i % 2 ? 1.57 : -1.57), spread: 0.5, v: [120, 300], sz: [10, 18, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.2, 0.35] }); }); };

  // ---------- 속성 타격: 맞은 자리에서 속성마다 다른 것이 터진다 ----------
  function accent(e, x, y, sc = 1, delay = 0) {
    const E = el(e); sc = Math.min(sc, 1.25);
    if (delay) return at(delay, () => accent(e, x, y, sc));
    if (e === 'fire') {
      flash(x, y, E, sc); shock(x, y, E, 64 * sc);
      burst('flame', x, y, 22, { ang: -Math.PI / 2, spread: 1.3, v: [40, 230 * sc], sz: [22 * sc, 44 * sc, 3], asp: 1.5, c: [E.main, E.lo], a: 0.75, life: [0.3, 0.65], ay: -300, drag: 0.92, jx: 18 * sc, jy: 10, wob: 6, dj: 0.1, rot: 0, rvr: 2.5 }); burst('flame', x, y, 8, { ang: -Math.PI / 2, spread: 1, v: [30, 150 * sc], sz: [12 * sc, 22 * sc, 2], asp: 1.5, c: [E.hi, E.main], a: 0.8, life: [0.2, 0.4], ay: -260, jx: 10 * sc, rvr: 2 });
      burst('spark', x, y, 20, { ang: -Math.PI / 2, spread: 1.7, v: [160, 520 * sc], sz: [12, 22, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.4, 0.8], ay: 620, drag: 0.96 });
      smoke(x, y - 10, 5, sc, ['#4a2412', '#0e0806'], { delay: 0.12 }); p('glow', x, y + 10 * sc, { s: [130 * sc, 170 * sc], c: [E.main, E.lo], a: 0.4, life: 0.7 });
    } else if (e === 'bolt') {
      flash(x, y, { hi: '#ffffff', main: E.main, lo: E.lo }, 1.25 * sc); at(0.07, () => p('core', x, y, { s: [40 * sc, 70 * sc], c: ['#ffffff', E.lo], life: 0.1, a: 0.8 }));
      for (let i = 0; i < N(5); i++) { const a = R(0, TAU), L = R(48, 96) * sc; G.bolt(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, E, { w: 3.2 * sc, life: 0.2, branch: 1, delay: i * 0.025 }); }
      burst('spark', x, y, 22, { v: [300, 760 * sc], sz: [12, 22, 2], asp: 0.25, face: true, c: ['#ffffff', E.main], life: [0.12, 0.3], drag: 0.86 }); ringThin(x, y, E, 54 * sc);
    } else if (e === 'water' || e === 'blood') {
      shock(x, y + 16 * sc, E, 70 * sc, 0.34); ringThin(x, y + 16 * sc, E, 46 * sc, 0.34, 0.09);
      p('drop', x, y - 6, { rot: -Math.PI / 2, s: [46 * sc, 120 * sc], asp: 0.55, c: [E.hi, E.main], life: 0.32, vy: -220, drag: 0.9, fout: 0.35 });
      burst('drop', x, y, 18, { ang: -Math.PI / 2, spread: 1.05, v: [170, 440 * sc], sz: [16 * sc, 28 * sc, 8], asp: 0.5, face: true, c: [E.hi, E.main], life: [0.5, 0.85], ay: 980, drag: 0.985, add: false, jx: 8 });
      burst('glow', x, y, 12, { ang: -Math.PI / 2, spread: 1.3, v: [40, 180], sz: [18, 34, 60], c: [E.hi, E.main], a: 0.3, life: [0.3, 0.6] });
      if (e === 'water') burst('bubble', x, y, 6, { ang: -Math.PI / 2, spread: 0.9, v: [20, 90], sz: [8, 16, 20], c: [E.hi], life: [0.6, 1.0], ay: -70, jx: 20 * sc, dj: 0.15 });
      p('glow', x, y, { s: [70 * sc, 150 * sc], c: [E.hi, E.main], a: 0.6, life: 0.25, pop: true });
    } else if (e === 'wood' || e === 'poison') {
      p('glow', x, y, { s: [60 * sc, 170 * sc], c: [E.hi, E.main], a: 0.6, life: 0.28, pop: true }); shock(x, y, E, 52 * sc);
      if (e === 'wood') { for (let i = 0; i < N(16); i++) { const a = R(0, TAU), v = R(120, 360) * sc, pink = i % 5 === 0; p(pink ? 'petal' : 'leaf', x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, ay: 300, drag: 0.93, s: [R(16, 28) * sc, 10], asp: 0.5, c: pink ? ['#ffd0ea', '#ff7dbd'] : [i % 2 ? E.hi : E.main, E.lo], add: false, rot: R(0, TAU), vr: R(-12, 12), life: R(0.6, 1.1), fout: 0.6 }); } thorns(x, y + 18 * sc, E, sc); }
      else { smoke(x, y, 7, sc, [E.main, E.lo], { a: 0.5, v: [20, 90] }); burst('bubble', x, y, 12, { ang: -Math.PI / 2, spread: 1.6, v: [30, 150], sz: [8, 18, 24], c: [E.hi, E.main], life: [0.5, 1.0], ay: -60, jx: 22 * sc }); }
      burst('glow', x, y, 12, { v: [20, 110], sz: [5, 10, 2], c: [E.hi], life: [0.6, 1.2], ay: -40, jx: 20 * sc });
    } else if (e === 'holy') {
      flash(x, y, E, 0.9 * sc); p('star4', x, y, { s: [70 * sc, 260 * sc], c: [E.hi, E.main], life: 0.5, vr: 0.8, pop: true, fout: 0.3 }); p('star4', x, y, { s: [40 * sc, 150 * sc], rot: Math.PI / 4, c: [E.hi, E.main], life: 0.4, a: 0.7, vr: -0.6, pop: true });
      rays(x, y, E, 12, 130 * sc, { asp: 0.2, life: 0.4 }); ringThin(x, y, E, 66 * sc); ringThin(x, y, E, 44 * sc, 1, 0.08);
      burst('glow', x, y, 24, { ang: -Math.PI / 2, spread: 0.7, v: [30, 170], sz: [6, 11, 2], c: [E.hi, E.main], life: [0.6, 1.2], ay: -50, jx: 34 * sc, jy: 24 * sc, dj: 0.2 });
      for (let i = 0; i < N(3); i++) p('feather', x + R(-30, 30) * sc, y - R(10, 40), { vx: R(-20, 20), vy: R(20, 50), s: [26 * sc, 22 * sc], asp: 0.4, c: ['#ffffff', E.hi], add: false, rot: R(0, TAU), vr: R(-2, 2), wob: 14, wf: 5, life: R(0.9, 1.3), fout: 0.6, delay: 0.1 });
    } else if (e === 'dark') {
      smoke(x, y, 10, sc, [E.lo, E.deep], { a: 0.75, v: [20, 120], ay: -20 });
      p('core', x, y, { s: [64 * sc, 18 * sc], c: ['#05010b', '#05010b'], add: false, a: 0.96, life: 0.5, fout: 0.6 }); p('ring', x, y, { s: [84 * sc, 26 * sc], c: [E.hi, E.main], life: 0.5, fout: 0.5 });
      burst('shard', x, y, 14, { v: [240, 560 * sc], sz: [24 * sc, 40 * sc, 6], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.28, 0.55], drag: 0.87 });
      for (let i = 0; i < N(3); i++) { const a = R(0, TAU), L = R(50, 90) * sc; G.bolt(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, { hi: E.hi, main: E.main, lo: E.lo }, { w: 2.6, life: 0.22, branch: 1, delay: 0.04 * i }); }
      p('glow', x, y, { s: [90 * sc, 200 * sc], c: [E.main, E.lo], a: 0.55, life: 0.4, pop: true });
    } else if (e === 'ice') {
      flash(x, y, E, 0.8 * sc); shock(x, y, E, 56 * sc);
      burst('shard', x, y, 16, { v: [200, 520 * sc], sz: [22 * sc, 38 * sc, 8], asp: 0.34, face: true, c: [E.hi, E.main], life: [0.35, 0.7], drag: 0.9, ay: 300 });
      for (let i = 0; i < N(6); i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; p('shard', x + Math.cos(a) * 14, y + 16 * sc, { rot: a, s: [12, R(50, 84) * sc], asp: 0.3, c: [E.hi, E.lo], life: 0.6, pop: true, fout: 0.6, add: false }); }
      burst('glow', x, y, 14, { v: [20, 140], sz: [5, 9, 2], c: [E.hi], life: [0.5, 1.0], ay: 60 });
    } else {
      flash(x, y, E, 0.8 * sc); ringThin(x, y, E, 50 * sc); sparks(x, y, E, 16, sc); smoke(x, y, 2, 0.7 * sc, ['#5a6272', '#1a1d25'], { a: 0.35 });
    }
  }
  // 바닥에서 솟는 가시 (목)
  function thorns(x, y, E, sc = 1, delay = 0, n = 5, hgt = 64) { for (let i = 0; i < N(n); i++) { const dx = (i - (n - 1) / 2) * 15 * sc + R(-4, 4), a = -Math.PI / 2 + R(-0.4, 0.4), L = R(0.6, 1) * hgt * sc; const o = { rot: a, s: [8, L], asp: 0.36, life: 0.55, pop: true, fout: 0.6, add: false, delay: delay + i * 0.025, vx: Math.cos(a) * L * 0.7, vy: Math.sin(a) * L * 0.7, drag: 0.8 }; p('shard', x + dx, y, { ...o, c: [E.lo, E.deep] }); p('shard', x + dx, y, { ...o, s: [5, L * 0.86], asp: 0.2, c: [E.hi, E.main] }); } }
  // 지나가는 자리에 남는 속성 자국 (날아가는 것의 꼬리)
  function trail(e, x, y, sc = 1) {
    const E = el(e), q = G.S.quality();
    if (e === 'fire') { if (Math.random() < 0.9 * q) p('flame', x + R(-5, 5), y + R(-5, 5), { s: [R(16, 28) * sc, 3], asp: 1.4, c: [E.main, E.lo], a: 0.7, life: R(0.2, 0.36), vy: -60, rot: R(-0.6, 0.6) }); if (Math.random() < 0.5 * q) p('spark', x, y, { vx: R(-80, 80), vy: R(-80, 40), ay: 300, s: [10, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: 0.4 }); }
    else if (e === 'bolt') { if (Math.random() < 0.7 * q) p('spark', x, y, { vx: R(-200, 200), vy: R(-200, 200), s: [14, 2], asp: 0.25, face: true, c: ['#ffffff', E.main], life: 0.16 }); }
    else if (e === 'water' || e === 'blood') { if (Math.random() < 0.8 * q) p('drop', x, y, { vx: R(-60, 60), vy: R(-80, 10), ay: 500, s: [R(8, 14) * sc, 4], asp: 0.5, face: true, c: [E.hi, E.main], add: false, life: 0.4 }); if (Math.random() < 0.5 * q) p('glow', x, y, { s: [16 * sc, 34 * sc], c: [E.hi, E.main], a: 0.3, life: 0.3 }); }
    else if (e === 'wood' || e === 'poison') { if (Math.random() < 0.6 * q) p(e === 'wood' ? 'leaf' : 'bubble', x, y, { vx: R(-70, 70), vy: R(-70, 40), ay: e === 'wood' ? 160 : -40, s: [R(9, 15) * sc, 5], asp: e === 'wood' ? 0.5 : 1, c: [Math.random() < 0.5 ? E.hi : E.main, E.lo], add: false, rot: R(0, TAU), vr: R(-10, 10), life: 0.5 }); if (Math.random() < 0.5 * q) p('glow', x, y, { s: [5, 2], c: [E.hi], life: 0.5, vy: -20 }); }
    else if (e === 'holy') { if (Math.random() < 0.9 * q) p('glow', x + R(-6, 6), y + R(-6, 6), { s: [R(5, 9), 1], c: [E.hi, E.main], life: R(0.3, 0.6), vy: -30 }); if (Math.random() < 0.25 * q) p('star4', x, y, { s: [22, 4], c: [E.hi], life: 0.25, rot: R(0, 1) }); }
    else if (e === 'dark') { if (Math.random() < 0.8 * q) p('smoke', x, y, { s: [R(22, 34) * sc, 54 * sc], c: [E.lo, E.deep], add: false, a: 0.6, life: 0.45, rot: R(0, TAU) }); if (Math.random() < 0.4 * q) p('shard', x, y, { vx: R(-90, 90), vy: R(-90, 90), s: [12, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: 0.3 }); }
    else if (e === 'ice') { if (Math.random() < 0.7 * q) p('shard', x, y, { vx: R(-60, 60), vy: R(-30, 80), s: [R(8, 14), 2], asp: 0.35, c: [E.hi, E.main], rot: R(0, TAU), life: 0.4 }); }
    else if (Math.random() < 0.6 * q) p('glow', x + R(-3, 3), y + R(-3, 3), { s: [8 * sc, 2], c: [E.hi, E.main], life: 0.25 });
  }
  // 날아가는 것: 무기 그림(hero)이나 직접 그리는 몸통(body) + 빛 번짐 + 잔상 꼬리 + 속성 자국
  function fly(o) {
    const E = el(o.el), dur = o.dur || Math.max(0.1, dist(o.from, o.to) / (o.speed || 900));
    const st = { x: o.from.x, y: o.from.y, ang: dirOf(o.from, o.to), alive: true };
    const pos = (kk) => { const x = o.from.x + (o.to.x - o.from.x) * kk, y = o.from.y + (o.to.y - o.from.y) * kk; if (!o.arc && !o.side) return [x, y]; const s = Math.sin(kk * Math.PI), a = dirOf(o.from, o.to) + Math.PI / 2; return [x + Math.cos(a) * (o.side || 0) * s, y - (o.arc || 0) * s + Math.sin(a) * (o.side || 0) * s]; };
    if (o.ribbon !== false) at(o.delay || 0, () => G.ribbon(() => (st.alive ? [st.x, st.y] : null), { w: o.rw || 12, c: o.rc || [E.hi, E.main], len: o.rlen || 12, a: o.ra ?? 0.85 }));
    add({ delay: o.delay, life: dur, end: () => { st.alive = false; if (o.hit) o.hit(o.to.x, o.to.y, st.ang); }, draw(k) {
      const kk = o.ease ? ease(k) : o.accel ? k * k : k; const [x, y] = pos(kk), [x2, y2] = pos(Math.min(1, kk + 0.03));
      if (x2 !== x || y2 !== y) st.ang = Math.atan2(y2 - y, x2 - x); st.x = x; st.y = y;
      if (!o.noTrail) trail(o.pal || o.el, x, y, o.sc || 1);
      if (o.glow !== false) G.spr('glow', x, y, o.gs || 64, o.gs || 64, 0, rgb(E.main), o.ga ?? 0.65, true);
      if (o.body) o.body(x, y, st.ang, k);
      if (o.hero) { const sz = (o.hs || 96) * (o.grow ? 1 + o.grow * k : 1); G.spr(G.hero(o.hero, o.pal || o.el), x, y, sz, sz, st.ang + (o.spin ? o.spin * k * TAU : 0), WHITE, o.ha ?? 1, false); }
    } });
    return (o.delay || 0) + dur;
  }
  // 맞는 순간: 속성 타격 + 피해 표시와 맞물리게 넘겨받은 것을 부른다
  // pixelfx 타격감(흰 프레임·십자 섬광·히트스톱)은 js/fx_pixelfx.js 가 onHit 으로 얹는다
  const hitAt = (o, x, y, sc = 1) => {
    accent(o.pal || o.el, x, y, sc * (o.big ? 1.3 : 1));
    try { if (typeof FXPX !== 'undefined' && FXPX.onHit) FXPX.onHit(o, x, y, sc); } catch (e) { /* 무시 */ }
    if (o.then) { const f = o.then; o.then = null; try { f(); } catch (e) { /* 무시 */ } }
  };

  // ---------- 공격 모양 ----------
  // from/to: {x, y, w, h}. o: { el, pal(색만 바꿀 때: blood·ice·poison), type, big, then, 꾸밈… }
  // 초승달 칼바람 한 줄을 날린다
  function crescentFly(from, to, o, size, tilt, delay, T, onHit) {
    const E = el(o.pal || o.el), a = dirOf(from, to); const st = { x: from.x, y: from.y };
    add({ delay, life: T, end: () => onHit && onHit(), draw(k) {
      const x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k, s = size * (0.75 + 0.45 * k), al = k < 0.12 ? k / 0.12 : 1; st.x = x; st.y = y;
      G.spr('glow', x, y, s * 1.3, s * 1.3, 0, rgb(E.main), 0.18 * al, true);
      G.spr('crescent', x, y, s * 1.12, s * 1.12, a + tilt, rgb(E.lo), 0.4 * al, o.el === 'dark' ? false : true);
      G.spr('crescent', x, y, s, s, a + tilt, rgb(E.main), 0.6 * al, true); G.spr('crescent', x + Math.cos(a) * s * 0.06, y + Math.sin(a) * s * 0.06, s * 0.74, s * 0.74, a + tilt, rgb(E.hi), 0.6 * al, true);
      if (Math.random() < 0.4) p('crescent', x, y, { rot: a + tilt, s: [s * 0.9, s * 0.7], c: [E.main, E.lo], a: 0.12, life: 0.09 });
      for (const sd of [-1, 1]) if (Math.random() < 0.7) p('spark', x + Math.cos(a + tilt + sd * 1.3) * s * 0.42, y + Math.sin(a + tilt + sd * 1.3) * s * 0.42, { vx: -Math.cos(a) * R(60, 200) + R(-40, 40), vy: -Math.sin(a) * R(60, 200) + R(-40, 40), s: [14, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: 0.3 });
      trail(o.pal || o.el, x, y, 0.8);
    } });
  }
  const FORM = {
    // 검기: 초승달 칼바람이 날아가 베고 지나간다. 치명=X자, 연속=세 줄, 관통=발도(한 줄 섬광 뒤 늦게 터지는 베기)
    slash(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.25 : 1, T = Math.max(0.13, dist(from, to) / 1500);
      if (o.type === 'pierce') { // 발도·일섬: 화면을 가르는 가는 선 → 잠깐 멈춤 → 세 갈래 베기가 한꺼번에
        const ex = to.x + Math.cos(a) * 150, ey = to.y + Math.sin(a) * 150, sx = from.x - Math.cos(a) * 10, sy = from.y - Math.sin(a) * 10;
        p('spark', (sx + ex) / 2, (sy + ey) / 2, { rot: a, s: [dist({ x: sx, y: sy }, { x: ex, y: ey }) * 0.4, dist({ x: sx, y: sy }, { x: ex, y: ey }) * 1.15], asp: 0.05, c: ['#ffffff', E.hi], life: 0.3, pop: true, fout: 0.5 });
        p('spark', (sx + ex) / 2, (sy + ey) / 2, { rot: a, s: [200, 500], asp: 0.14, c: [E.main, E.lo], a: 0.6, life: 0.3, pop: true, fout: 0.3 }); flash(from.x, from.y, E, 0.5);
        at(0.24, () => { for (let i = 0; i < 3; i++) cut(to.x + R(-6, 6), to.y + R(-6, 6), a + 1.57 + (i - 1) * 0.75, 190 * sc, E, i * 0.03, 1.2); flash(to.x, to.y, E, 1.1); hitAt(o, to.x, to.y, 1.1); }); return;
      }
      const tilts = o.type === 'multi' ? [[0, 0.55, 0.85], [0.1, -0.6, 0.85], [0.2, 0.1, 1]] : (o.type === 'crit' || o.big) ? [[0, 0.62, 1.15], [0.06, -0.62, 1.15]] : [[0, R(-0.3, 0.3), 1]];
      tilts.forEach(([dl, tilt, sz], i) => crescentFly(from, to, o, 150 * sz * sc, tilt, dl, T, () => { cut(to.x, to.y, a + tilt + 1.57, 210 * sz * sc, E, 0, 1.1); if (i === tilts.length - 1) hitAt(o, to.x, to.y, tilts.length > 1 ? 1.1 : 1); else accent(o.pal || o.el, to.x, to.y, 0.5); }));
      flash(from.x + Math.cos(a) * 20, from.y + Math.sin(a) * 20, E, 0.45);
    },
    // 내려찍기: 머리 위에서 큰 칼바람이 떨어지고 바닥이 갈라진다
    cleave(from, to, o) {
      const E = el(o.pal || o.el), sc = o.big ? 1.25 : 1, by = to.y + (to.h || 60) * 0.42;
      crescentFly({ x: to.x - 16, y: to.y - 190 }, { x: to.x, y: to.y + 6 }, o, 250 * sc, 0, 0, 0.15, () => {
        cut(to.x, to.y - 20, Math.PI / 2, 300 * sc, E, 0, 1.6); p('crack', to.x, by, { s: [60, 190 * sc], asp: 0.42, c: [E.hi, E.main], life: 0.7, pop: true, fout: 0.5 });
        shock(to.x, by, E, 120 * sc, 0.3); smoke(to.x, by, 6, 1.1 * sc, ['#5c5248', '#17130f'], { v: [40, 160], ay: -30 }); burst('shard', to.x, by, 10, { ang: -Math.PI / 2, spread: 1.2, v: [200, 520], sz: [16, 28, 6], asp: 0.4, c: ['#b9ac98', '#5c5248'], add: false, life: [0.5, 0.9], ay: 900, rrot: true, rvr: 12 });
        hitAt(o, to.x, to.y, 1.2);
      });
    },
    // 창 찌르기: 창이 곧게 뻗어 꿰뚫는다
    thrust(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), n = o.type === 'multi' ? 5 : 1, sc = o.big ? 1.25 : 1;
      for (let i = 0; i < n; i++) { const tt = { x: to.x + (n > 1 ? R(-18, 18) : 0), y: to.y + (n > 1 ? R(-16, 16) : 0) }, st = { x: tt.x - Math.cos(a) * Math.min(170, dist(from, to) * 0.8), y: tt.y - Math.sin(a) * Math.min(170, dist(from, to) * 0.8) };
        fly({ from: n > 1 ? st : from, to: tt, dur: n > 1 ? 0.07 : 0.12, delay: i * 0.075, el: o.el, pal: o.pal, hero: 'spear', hs: 130 * sc, rw: 16, rlen: 8, gs: 50, noTrail: n > 1, hit: (x, y) => {
          const L = o.type === 'pierce' ? 260 : 120; p('ray', x + Math.cos(a) * L * 0.15, y + Math.sin(a) * L * 0.15, { rot: a, s: [L * 0.4, L], asp: 0.3, c: [E.hi, E.main], life: 0.25, vx: Math.cos(a) * L * 2, vy: Math.sin(a) * L * 2, drag: 0.85 });
          cut(x, y, a, (o.type === 'pierce' ? 320 : 150) * sc, E, 0, 0.9); ringThin(x, y, E, 30); if (i === n - 1) hitAt(o, to.x, to.y, n > 1 ? 1.1 : 1); else sparks(x, y, E, 5, 0.6); } }); }
    },
    // 주먹: 주먹이 날아가 꽂히고 타격선이 터진다. 연속=연타, 관통=장풍(손바닥이 뚫고 지나감), 기절=머리 위에서 내려찍기
    fist(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.3 : 1;
      const boom = (x, y, s) => { rays(x, y, E, 12, 150 * s); shock(x, y, E, 80 * s); p('star4', x, y, { s: [50 * s, 190 * s], c: [E.hi, E.main], life: 0.25, pop: true, rot: R(0, 1) }); };
      if (o.type === 'multi') { for (let i = 0; i < 6; i++) { const tt = { x: to.x + R(-26, 26), y: to.y + R(-24, 24) }; fly({ from: { x: tt.x - Math.cos(a) * 90 + R(-20, 20), y: tt.y - Math.sin(a) * 90 }, to: tt, dur: 0.06, delay: i * 0.065, el: o.el, pal: o.pal, hero: 'fist', hs: 80, rlen: 5, rw: 22, noTrail: true, hit: (x, y) => { shock(x, y, E, 34); sparks(x, y, E, 6, 0.7); if (i === 5) { boom(to.x, to.y, 1); hitAt(o, to.x, to.y, 1.1); } } }); } return; }
      if (o.type === 'pierce') { // 장풍·백보신권
        const ex = { x: to.x + Math.cos(a) * 110, y: to.y + Math.sin(a) * 110 }; flash(from.x, from.y, E, 0.6);
        fly({ from, to: ex, dur: 0.3, el: o.el, pal: o.pal, glow: false, rw: 46, rlen: 10, ra: 0.5, body: (x, y, ang, k) => { const s = 90 + k * 110; G.spr('hand', x, y, s, s, ang + Math.PI / 2, rgb(E.main), 0.75 * (1 - k * 0.5), true); G.spr('hand', x, y, s * 0.9, s * 0.9, ang + Math.PI / 2, rgb(E.hi), 0.5 * (1 - k * 0.5), true); if (Math.random() < 0.5) p('wave', x, y, { s: [30, 130], asp: 0.5, rot: ang + Math.PI / 2, c: [E.hi, E.main], life: 0.25, pop: true }); } });
        at(0.2, () => { boom(to.x, to.y, 1); hitAt(o, to.x, to.y, 1.15); }); return;
      }
      const start = o.type === 'stun' ? { x: to.x, y: to.y - 200 } : from;
      fly({ from: start, to, dur: o.type === 'stun' ? 0.13 : Math.max(0.1, dist(start, to) / 1400), el: o.el, pal: o.pal, hero: 'fist', hs: 96 * sc, grow: 0.5, rw: 30, rlen: 8, gs: 90, hit: (x, y) => { boom(x, y, sc); if (o.type === 'stun') { shock(x, y + 24, E, 110, 0.3); stars(to); } hitAt(o, x, y, 1.1); } });
    },
    // 단검: 순식간에 여러 번 긋는 가는 칼자국
    stab(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' ? 6 : (o.type === 'crit' || o.big) ? 4 : 2, a0 = dirOf(from, to);
      fly({ from, to: { x: to.x - Math.cos(a0) * 24, y: to.y - Math.sin(a0) * 24 }, dur: 0.09, el: o.el, pal: o.pal, hero: 'dagger', hs: 84, rw: 8, rlen: 10, gs: 36, noTrail: true });
      for (let i = 0; i < n; i++) cut(to.x + R(-10, 10), to.y + R(-10, 10), a0 + (i % 2 ? 1 : -1) * R(0.5, 1.2), R(110, 160) * (o.big ? 1.2 : 1), E, 0.09 + i * 0.05, 0.7);
      at(0.09 + n * 0.05, () => { if (o.type === 'crit' || o.big) { p('star4', to.x, to.y, { s: [40, 230], c: ['#ffffff', E.main], life: 0.3, rot: Math.PI / 4, pop: true }); flash(to.x, to.y, E, 0.7); } hitAt(o, to.x, to.y, 0.85); });
    },
    // 화살: 살짝 휘어 날아가 꽂히고 떤다. 관통=꿰뚫고 지나감
    arrow(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' ? 3 : 1, a = dirOf(from, to), sc = o.big ? 1.25 : 1;
      for (let i = 0; i < n; i++) { const tt = { x: to.x + (n > 1 ? R(-14, 14) : 0), y: to.y + (n > 1 ? R(-14, 14) : 0) }, pierce = o.type === 'pierce', end = pierce ? { x: tt.x + Math.cos(a) * 170, y: tt.y + Math.sin(a) * 170 } : tt;
        at(i * 0.09, () => { p('ring', from.x, from.y, { s: [50, 16], c: [E.hi, E.main], life: 0.14 }); });
        fly({ from, to: end, speed: 1500, arc: pierce ? 0 : 14 + i * 7, delay: i * 0.09, el: o.el, pal: o.pal, hero: 'arrow', hs: 104 * sc, rw: 7, rlen: 14, gs: 40, sc: 0.8, hit: (x, y, ang) => {
          if (!pierce) { p(G.hero('arrow', o.pal || o.el), tt.x - Math.cos(ang) * 14, tt.y - Math.sin(ang) * 14, { s: [104 * sc, 104 * sc], rot: ang, c: ['#ffffff'], add: false, life: 0.45, fout: 0.6, wob: 2.5, wf: 60 }); sparks(tt.x, tt.y, E, 6, 0.6, { ang: ang + Math.PI, spread: 1 }); }
          if (i === n - 1 && !pierce) hitAt(o, to.x, to.y, 0.9); } });
        if (pierce) at(i * 0.09 + dist(from, to) / 1500, () => { cut(to.x, to.y, a, 300, E, 0, 0.8); ringThin(to.x, to.y, E, 44); if (i === n - 1) hitAt(o, to.x, to.y); }); }
    },
    // 총알: 총구 섬광 + 빠른 예광탄. 치명·관통=조준 표시가 좁혀진 뒤 굵은 한 발
    bullet(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), n = o.type === 'multi' ? 7 : 1, snipe = o.type === 'crit' || o.type === 'pierce' || o.big, mz = { x: from.x + Math.cos(a) * 22, y: from.y + Math.sin(a) * 22 }, MF = { hi: '#fff6d0', main: '#ffc24a', lo: '#ff7a1a' };
      const muzzle = (s) => { p('star4', mz.x, mz.y, { s: [70 * s, 130 * s], c: [MF.hi, MF.main], life: 0.09, rot: a }); p('glow', mz.x, mz.y, { s: [90 * s, 40], c: [MF.hi, MF.lo], life: 0.12 }); burst('spark', mz.x, mz.y, 5, { ang: a, spread: 0.5, v: [200, 500], sz: [12, 20, 2], asp: 0.3, face: true, c: [MF.hi, MF.main], life: [0.1, 0.22] }); smoke(mz.x, mz.y, 1, 0.5, ['#6a7080', '#22252e'], { a: 0.3 }); };
      const tracer = (tt, delay, s) => fly({ from: mz, to: tt, speed: 3200, delay, el: o.el, pal: o.pal, noTrail: true, ribbon: false, glow: false, body: (x, y, ang) => { G.spr('spark', x - Math.cos(ang) * 30 * s, y - Math.sin(ang) * 30 * s, 110 * s, 20 * s, ang, rgb(E.main), 0.9, true); G.spr('spark', x - Math.cos(ang) * 22 * s, y - Math.sin(ang) * 22 * s, 80 * s, 9 * s, ang, WHITE, 1, true); }, hit: (x, y) => { sparks(x, y, E, 7, 0.7, { ang: a + Math.PI, spread: 1.1 }); p('core', x, y, { s: [16, 40], c: ['#ffffff', E.main], life: 0.1 }); } });
      if (snipe) {
        add({ life: 0.34, draw(k) { const r = 150 - 96 * ease(Math.min(1, k / 0.75)), al = k < 0.85 ? 1 : (1 - k) / 0.15, c = rgb('#ff4a4a'); G.spr('ring', to.x, to.y, r, r, k * 3, c, al, true); for (let i = 0; i < 4; i++) { const q = i * Math.PI / 2 + k * 3; G.spr('spark', to.x + Math.cos(q) * r * 0.42, to.y + Math.sin(q) * r * 0.42, 34, 8, q, c, al, true); } G.spr('core', to.x, to.y, 8, 8, 0, c, al, true); } });
        at(0.3, () => { muzzle(1.6); const ex = to.x + Math.cos(a) * (o.type === 'pierce' ? 200 : 0), ey = to.y + Math.sin(a) * (o.type === 'pierce' ? 200 : 0), L = dist(mz, { x: ex, y: ey }); p('spark', (mz.x + ex) / 2, (mz.y + ey) / 2, { rot: a, s: [L, L * 1.02], asp: 0.05, c: ['#ffffff', E.hi], life: 0.22, fout: 0.2 }); p('spark', (mz.x + ex) / 2, (mz.y + ey) / 2, { rot: a, s: [L, L], asp: 0.16, c: [E.main, E.lo], a: 0.6, life: 0.3 }); rays(to.x, to.y, E, 8, 110); hitAt(o, to.x, to.y, 1.15); }); return;
      }
      for (let i = 0; i < n; i++) { at(i * 0.055, () => muzzle(1)); tracer({ x: to.x + (n > 1 ? R(-20, 20) : 0), y: to.y + (n > 1 ? R(-20, 20) : 0) }, i * 0.055, 1); }
      at((n - 1) * 0.055 + dist(mz, to) / 3200, () => hitAt(o, to.x, to.y, 0.85));
    },
    // 폭탄·플라스크: 포물선으로 던져 불덩이·연기·파편이 터진다
    bomb(from, to, o) {
      const pal = o.pal || (o.el === 'none' ? 'fire' : o.el), E = el(pal), sc = o.big ? 1.25 : 1;
      fly({ from, to, dur: 0.44, arc: 90, spin: 1.6, delay: o.delay, el: o.el, pal, hero: o.flask ? 'flask' : 'bomb', hs: 76, ribbon: false, gs: 30, noTrail: true, body: (x, y) => { if (!o.flask && Math.random() < 0.8) p('spark', x + 8, y - 8, { vx: R(-60, 60), vy: R(-90, 10), s: [10, 2], asp: 0.3, face: true, c: ['#fff6d0', '#ffb347'], life: 0.25 }); }, hit: (x, y) => {
        flash(x, y, E, 1.5 * sc); shock(x, y, E, 110 * sc); shock(x, y + 14, E, 130 * sc, 0.32, 0.05);
        if (o.flask) burst('shard', x, y, 10, { v: [200, 480], sz: [10, 18, 3], asp: 0.4, c: ['#ffffff', '#bfe9ff'], life: [0.3, 0.6], ay: 700, rrot: true, rvr: 14 });
        else { burst('flame', x, y, 16, { v: [120, 380 * sc], sz: [44 * sc, 78 * sc, 8], asp: 1.4, c: ['#ffb040', '#d92a0b'], a: 0.8, life: [0.3, 0.6], drag: 0.88, rrot: true }); smoke(x, y, 9, 1.4 * sc, ['#3b3d47', '#0b0c10'], { v: [40, 170], delay: 0.08, a: 0.7 }); burst('spark', x, y, 22, { v: [260, 760], sz: [14, 24, 2], asp: 0.3, face: true, c: ['#fff6d0', '#ff8a2a'], life: [0.4, 0.9], ay: 700, drag: 0.96 }); }
        hitAt({ ...o, pal }, x, y, 1.2 * sc); if (o.then) { o.then(); o.then = null; } } });
    },
    // 방패: 방패가 밀고 들어가 육각 막이 번쩍이며 부딪친다
    shield(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to);
      fly({ from, to: { x: to.x - Math.cos(a) * 20, y: to.y - Math.sin(a) * 20 }, dur: 0.17, ease: true, el: o.el, pal: o.pal, noTrail: true, rw: 60, rlen: 6, ra: 0.45, gs: 110, body: (x, y, ang, k) => { const s = 110 + k * 40; G.spr(G.hero('shield', o.pal || o.el), x, y, s, s, 0, WHITE, 1, false); }, hit: (x, y) => { p('hex', to.x, to.y, { s: [70, 200], c: [E.hi, E.main], life: 0.3, pop: true }); rays(to.x, to.y, E, 10, 150); shock(to.x, to.y, E, 90); p(G.hero('shield', o.pal || o.el), x, y, { s: [150, 170], c: ['#ffffff'], add: false, life: 0.22, fout: 0.2 }); smoke(to.x, to.y + 20, 3, 0.8, ['#5c6272', '#16181f'], { a: 0.4 }); hitAt(o, to.x, to.y, 1.05); } });
    },
    // 마법구: 속성마다 몸통이 다르다 — 염=불덩이, 수=물 구슬, 목=잎 뭉치, 성=빛의 창, 암=공허 구슬, 뇌=곧바로 내리치는 번개
    orb(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' ? 3 : 1, sc = o.big ? 1.3 : 1;
      if (o.el === 'bolt' && !o.pal) { flash(from.x, from.y, E, 0.5); for (let i = 0; i < n; i++) at(i * 0.1, () => { G.bolt(from.x, from.y, to.x + R(-6, 6), to.y + R(-6, 6), E, { w: 5 * sc, life: 0.26, branch: 3 }); if (i === n - 1) hitAt(o, to.x, to.y, 1.1); else accent('bolt', to.x, to.y, 0.5); }); return; }
      p('ring', from.x, from.y, { s: [90, 20], c: [E.hi, E.main], life: 0.2 }); burst('glow', from.x, from.y, 8, { v: [-120, -40], sz: [6, 10, 2], c: [E.hi, E.main], life: [0.15, 0.25], jx: 30, jy: 30 });
      const body = (x, y, ang, k) => { const t = k * 30;
        if (e === 'fire') { G.spr('core', x, y, 44 * sc, 44 * sc, 0, rgb(E.hi), 1, true); for (let i = 0; i < 3; i++) G.spr('flame', x - Math.cos(ang) * 10, y - Math.sin(ang) * 10, 60 * sc, 70 * sc, ang - Math.PI / 2 + Math.sin(t + i * 2) * 0.35, rgb(i ? E.main : E.lo), 0.8, true); }
        else if (e === 'water' || e === 'blood') { G.spr('core', x, y, 40 * sc, 40 * sc, 0, rgb(E.main), 0.9, false); G.spr('bubble', x, y, 50 * sc, 50 * sc, t * 0.1, rgb(E.hi), 1, true); G.spr('drop', x - Math.cos(ang) * 16, y - Math.sin(ang) * 16, 66 * sc, 34 * sc, ang, rgb(E.main), 0.7, true); }
        else if (e === 'wood' || e === 'poison') { G.spr('core', x, y, 34 * sc, 34 * sc, 0, rgb(E.main), 0.9, true); for (let i = 0; i < 4; i++) G.spr(e === 'wood' ? 'leaf' : 'bubble', x + Math.cos(t * 0.5 + i * 1.57) * 16 * sc, y + Math.sin(t * 0.5 + i * 1.57) * 16 * sc, 30 * sc, e === 'wood' ? 15 * sc : 30 * sc, t * 0.5 + i * 1.57 + 1.57, rgb(i % 2 ? E.hi : E.main), 1, e !== 'wood'); }
        else if (e === 'holy') { G.spr('star4', x, y, 110 * sc, 110 * sc, t * 0.1, rgb(E.hi), 1, true); G.spr('spark', x - Math.cos(ang) * 30, y - Math.sin(ang) * 30, 150 * sc, 30 * sc, ang, rgb(E.main), 0.9, true); G.spr('core', x, y, 26 * sc, 26 * sc, 0, WHITE, 1, true); }
        else if (e === 'dark') { G.spr('ring', x, y, 62 * sc, 62 * sc, t * 0.3, rgb(E.main), 1, true); G.spr('core', x, y, 40 * sc, 40 * sc, 0, rgb('#05010b'), 0.97, false); for (let i = 0; i < 3; i++) G.spr('shard', x + Math.cos(-t * 0.4 + i * 2.1) * 26 * sc, y + Math.sin(-t * 0.4 + i * 2.1) * 26 * sc, 22 * sc, 8 * sc, -t * 0.4 + i * 2.1 + 1.57, rgb(E.hi), 1, true); }
        else if (e === 'ice') { G.spr('shard', x, y, 90 * sc, 34 * sc, ang, rgb(E.main), 1, true); G.spr('shard', x, y, 70 * sc, 16 * sc, ang, WHITE, 1, true); }
        else { G.spr('core', x, y, 36 * sc, 36 * sc, 0, WHITE, 1, true); G.spr('ring', x, y, 54 * sc, 54 * sc, t * 0.2, rgb(E.main), 0.9, true); G.spr('star4', x, y, 70 * sc, 70 * sc, -t * 0.15, rgb(E.main), 0.7, true); } };
      for (let i = 0; i < n; i++) fly({ from, to: { x: to.x + (n > 1 ? R(-14, 14) : 0), y: to.y + (n > 1 ? R(-14, 14) : 0) }, speed: e === 'dark' ? 640 : e === 'holy' ? 1400 : 900, arc: e === 'water' || e === 'wood' || e === 'poison' ? 36 : 0, side: n > 1 ? (i - 1) * 40 : 0, delay: 0.06 + i * 0.1, el: o.el, pal: o.pal, body, gs: 110 * sc, rw: 22 * sc, rlen: 14, sc: 1.2, hit: (x, y) => { if (i === n - 1) hitAt(o, to.x, to.y, 1.2); else accent(e, x, y, 0.6); } });
    },
    // 광선: 모았다가 굵은 빛줄기를 쏜다
    beam(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to), ex = o.type === 'pierce' ? to.x + Math.cos(a) * 180 : to.x, ey = o.type === 'pierce' ? to.y + Math.sin(a) * 180 : to.y, w = o.big ? 22 : 15;
      burst('glow', from.x, from.y, 12, { v: [-200, -80], sz: [6, 10, 2], c: [E.hi, E.main], life: [0.12, 0.2], jx: 44, jy: 44 }); p('star4', from.x, from.y, { s: [40, 150], c: [E.hi, E.main], life: 0.2, pop: true });
      at(0.12, () => { G.beam(from.x, from.y, ex, ey, E, { w, life: 0.5, add: e !== 'dark' }); const L = dist(from, { x: ex, y: ey }); for (let i = 0; i < N(14); i++) { const k = Math.random(); p('spark', from.x + (ex - from.x) * k, from.y + (ey - from.y) * k, { vx: Math.cos(a) * R(300, 700), vy: Math.sin(a) * R(300, 700), s: [22, 4], asp: 0.25, face: true, c: [E.hi, E.main], life: R(0.15, 0.3), delay: R(0, 0.3) }); } hitAt(o, to.x, to.y, 1.1); for (let i = 0; i < 4; i++) at(0.07 + i * 0.07, () => { sparks(to.x, to.y, E, 5, 0.7); p('glow', to.x, to.y, { s: [80, 130], c: [E.hi, E.main], a: 0.5, life: 0.15 }); }); });
    },
    // 빛기둥·심판: 하늘에서 굵은 기둥이 내리꽂힌다
    smite(from, to, o) {
      const e = o.pal || o.el, E = el(e), w = o.big ? 70 : 52, by = to.y + (to.h || 60) * 0.42, top = to.y - 520;
      p('ring', to.x, by, { s: [120, 40], asp: 0.32, c: [E.hi, E.main], life: 0.22 });
      at(0.14, () => { add({ life: 0.55, draw(k) { const g = Math.min(1, k / 0.12), al = k > 0.45 ? 1 - (k - 0.45) / 0.55 : 1, ww = w * (k > 0.45 ? 1 - (k - 0.45) * 0.8 : 1), y2 = top + (by - top) * g; G.seg(to.x, top, to.x, y2, ww * 2.6, ww * 3, rgb(E.lo), 0.28 * al, e !== 'dark'); G.seg(to.x, top, to.x, y2, ww * 1.4, ww * 1.6, rgb(E.main), 0.55 * al, true); G.seg(to.x, top, to.x, y2, ww * 0.5, ww * 0.6, rgb(E.hi), 0.8 * al, true); G.spr('glow', to.x, y2, ww * 4, ww * 2, 0, rgb(E.hi), 0.55 * al, true); } });
        at(0.06, () => { shock(to.x, by, E, 130, 0.32); shock(to.x, by, E, 90, 0.32, 0.08); burst('glow', to.x, by, 26, { ang: -Math.PI / 2, spread: 0.35, v: [150, 520], sz: [6, 12, 2], c: [E.hi, E.main], life: [0.4, 0.9], jx: w * 0.6 }); hitAt(o, to.x, to.y, 1.25); }); });
    },
    // 부적: 빙글 날아가 붙고 팔괘 문양이 돌며 터진다
    talisman(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' ? 4 : 1;
      for (let i = 0; i < n; i++) { const tt = { x: to.x + (n > 1 ? (i - 1.5) * 20 : 0), y: to.y + (n > 1 ? R(-10, 10) : 0) }; fly({ from, to: tt, speed: 1000, side: (i % 2 ? 1 : -1) * (30 + i * 12), spin: 2, delay: i * 0.09, el: o.el, pal: o.pal, hero: 'talisman', hs: 80, rw: 10, rlen: 12, gs: 44, sc: 0.7, hit: (x, y) => { p(G.hero('talisman', e), x, y, { s: [80, 110], c: ['#ffffff'], add: false, life: 0.4, fout: 0.3 }); p('glow', x, y, { s: [40, 120], c: [E.hi, E.main], life: 0.3, pop: true });
        if (i === n - 1) { p('bagua', to.x, to.y, { s: [60, 210], c: [E.hi, E.main], life: 0.7, vr: 3, pop: true, fout: 0.55 }); p('bagua', to.x, to.y, { s: [60, 150], c: [E.main, E.lo], a: 0.5, life: 0.7, vr: -2, pop: true, fout: 0.55 }); at(0.16, () => hitAt(o, to.x, to.y, 1.05)); } } }); }
    },
    // 저주: 마법진이 돌고 눈이 뜨이며 사슬이 조여든다
    curse(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'dark' : o.el), E = el(e);
      p('rune', to.x, to.y, { s: [80, 200], c: [E.hi, E.main], life: 0.9, vr: 2.4, pop: true, fin: 0.1, fout: 0.6 }); p('rune', to.x, to.y, { s: [80, 240], c: [E.main, E.lo], a: 0.4, life: 0.9, vr: -1.4, pop: true, fout: 0.6 });
      p('eye', to.x, to.y - (to.h || 60) * 0.75, { s: [30, 90], asp: 0.6, c: [E.hi, E.main], life: 0.8, pop: true, fin: 0.25, fout: 0.7 });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.7; for (let j = 0; j < 4; j++) p('chain', to.x + Math.cos(a) * (150 - j * 34), to.y + Math.sin(a) * (150 - j * 34), { rot: a, s: [34, 34], asp: 0.5, c: [E.hi, E.main], life: 0.5, delay: 0.12 + j * 0.03, vx: -Math.cos(a) * 240, vy: -Math.sin(a) * 240, drag: 0.86, fout: 0.6 }); }
      smoke(to.x, to.y + 20, 6, 1, [E.lo, E.deep], { a: 0.6, delay: 0.1 });
      at(0.42, () => hitAt({ ...o, pal: e, then: o.then }, to.x, to.y, 0.95)); o.then = null;
    },
    // 염동·정신: 고리가 겹겹이 조여들다 안에서 터진다
    psychic(from, to, o) {
      const e = o.pal || o.el, E = e === 'none' ? { hi: '#f6e3ff', main: '#c77dff', lo: '#6a2bd9', deep: '#1a0633' } : el(e);
      for (let i = 0; i < 5; i++) p('wave', to.x, to.y, { s: [230 - i * 12, 26], c: [i % 2 ? E.hi : E.main, E.lo], life: 0.36, delay: i * 0.06, fin: 0.3, fout: 0.8, vr: i % 2 ? 3 : -3, rot: R(0, 3) });
      burst('shard', to.x, to.y, 12, { v: [-260, -120], sz: [16, 26, 4], asp: 0.4, c: [E.hi, E.main], life: [0.3, 0.42], jx: 90, jy: 90, rrot: true, drag: 1 });
      p('eye', from.x, from.y - (from.h || 60) * 0.6, { s: [20, 70], asp: 0.6, c: [E.hi, E.main], life: 0.45, pop: true, fout: 0.6 });
      at(0.42, () => { flash(to.x, to.y, E, 1.1); shock(to.x, to.y, E, 100); burst('shard', to.x, to.y, 14, { v: [240, 620], sz: [18, 30, 4], asp: 0.35, face: true, c: [E.hi, E.main], life: [0.25, 0.5], drag: 0.88 }); hitAt(o, to.x, to.y, 0.8); });
    },
    // 발톱: 세 줄 할큄. 치명·연속=엇갈린 두 번
    claw(from, to, o) {
      const E = el(o.pal || o.el), sc = o.big ? 1.3 : 1, two = o.type === 'multi' || o.type === 'crit' || o.big;
      const rake = (ang, delay) => { for (let i = 0; i < 3; i++) { const off = (i - 1) * 22 * sc; cut(to.x + Math.cos(ang + 1.57) * off, to.y + Math.sin(ang + 1.57) * off, ang, (i === 1 ? 190 : 160) * sc, E, delay + i * 0.03, 1.5); } };
      rake(-0.95, 0); if (two) rake(-2.2, 0.14);
      at(two ? 0.24 : 0.1, () => { burst('drop', to.x, to.y, 8, { v: [140, 380], sz: [10, 18, 4], asp: 0.5, face: true, c: ['#ffd0d0', '#d81e33'], add: false, life: [0.3, 0.6], ay: 700 }); hitAt(o, to.x, to.y, 0.9); });
    },
    // 물기: 위아래 송곳니가 닫히며 물어뜯는다
    bite(from, to, o) {
      const E = el(o.pal || o.el), sc = o.big ? 1.3 : 1;
      for (const d of [-1, 1]) for (let i = 0; i < 5; i++) { const h = (i === 0 || i === 4 ? 44 : i === 2 ? 56 : 66) * sc; p('fang', to.x + (i - 2) * 22 * sc, to.y + d * 82 * sc, { rot: d < 0 ? 0 : Math.PI, s: [h, h], asp: 1, c: ['#fffdf2', E.hi], add: false, life: 0.42, vy: -d * 620 * sc, drag: 0.72, fout: 0.65 }); p('fang', to.x + (i - 2) * 22 * sc, to.y + d * 82 * sc, { rot: d < 0 ? 0 : Math.PI, s: [h * 1.25, h * 1.25], c: [E.main, E.lo], a: 0.5, life: 0.42, vy: -d * 620 * sc, drag: 0.72, fout: 0.5 }); }
      at(0.13, () => { flash(to.x, to.y, E, 0.8); shock(to.x, to.y, E, 70, 0.5); burst('drop', to.x, to.y, 10, { v: [160, 420], sz: [10, 18, 4], asp: 0.5, face: true, c: ['#ffd0d0', '#d81e33'], add: false, life: [0.3, 0.6], ay: 700 }); hitAt(o, to.x, to.y, 0.95); });
    },
    // 정령·혼: 얼굴 달린 불덩이가 꼬리를 끌며 굽이쳐 날아든다
    spirit(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' ? 4 : 1;
      p('rune', from.x, from.y + (from.h || 60) * 0.4, { s: [50, 150], asp: 0.36, c: [E.hi, E.main], life: 0.45, pop: true, fout: 0.5 });
      for (let i = 0; i < n; i++) fly({ from, to, dur: 0.42, side: (i % 2 ? 1 : -1) * (60 + i * 16) * (n > 1 ? 1 : R(-1, 1)), delay: 0.08 + i * 0.1, ease: true, el: o.el, pal: o.pal, hero: 'wisp', hs: 96 * (o.big ? 1.3 : 1), rw: 26, rlen: 18, gs: 90, hit: (x, y) => { p(G.hero('wisp', e), x, y, { s: [96, 150], rot: -Math.PI / 2, vy: -120, c: ['#ffffff'], add: false, a: 0.6, life: 0.4, fout: 0.2 }); if (i === n - 1) hitAt(o, to.x, to.y, 1.05); else accent(e, x, y, 0.55); } });
    },
    // 음표: 오선 위로 음표들이 물결치며 날아간다
    note(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to);
      for (let j = -1; j <= 1; j++) p('spark', (from.x + to.x) / 2 + Math.cos(a + 1.57) * j * 12, (from.y + to.y) / 2 + Math.sin(a + 1.57) * j * 12, { rot: a, s: [dist(from, to) * 0.3, dist(from, to) * 1.1], asp: 0.03, c: [E.hi, E.main], a: 0.55, life: 0.55, pop: true, fout: 0.5 });
      for (let i = 0; i < 5; i++) fly({ from, to: { x: to.x + R(-16, 16), y: to.y + R(-16, 16) }, dur: 0.42, side: (i % 2 ? 1 : -1) * R(18, 46), delay: i * 0.07, el: o.el, pal: o.pal, noTrail: true, rw: 6, rlen: 8, gs: 40, body: (x, y, ang, k) => { G.spr(G.hero('note', i % 2 ? e : 'none'), x, y, 70, 70, Math.sin(k * 14) * 0.35, WHITE, 1, false); }, hit: (x, y) => { ringThin(x, y, E, 30); p('star4', x, y, { s: [20, 70], c: [E.hi], life: 0.2 }); if (i === 4) hitAt(o, to.x, to.y, 0.9); } });
    },
    // 균열: 공간이 세로로 찢어졌다 닫힌다 — 주변이 빨려 들고 파편이 튄다
    rift(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'dark' : o.el), E = el(e), h = o.big ? 260 : 200, tilt = R(-0.3, 0.3) + Math.PI / 2;
      burst('glow', to.x, to.y, 16, { v: [-320, -140], sz: [6, 10, 2], c: [E.hi, E.main], life: [0.22, 0.34], jx: 90, jy: 90, drag: 1 });
      add({ life: 0.6, draw(k) { const op = k < 0.25 ? ease(k / 0.25) : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1, w = h * 0.2 * op; G.spr('glow', to.x, to.y, h * 0.9, h * 0.5 * op, tilt, rgb(E.main), 0.5 * op, true); G.spr('shard', to.x, to.y, h * 1.05, w * 1.5, tilt, rgb(E.main), 0.9, true); G.spr('shard', to.x, to.y, h, w, tilt, rgb('#05010b'), 0.98, false); G.spr('spark', to.x, to.y, h * 1.2, 10 * op, tilt, rgb(E.hi), op, true); } });
      at(0.2, () => { burst('shard', to.x, to.y, 16, { ang: tilt + Math.PI / 2, spread: 0.5, v: [200, 560], sz: [18, 30, 4], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.25, 0.5], jy: 60 }); burst('shard', to.x, to.y, 16, { ang: tilt - Math.PI / 2, spread: 0.5, v: [200, 560], sz: [18, 30, 4], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.25, 0.5], jy: 60 }); hitAt({ ...o, pal: e, then: o.then }, to.x, to.y); o.then = null; });
    },
    // 지면 분출: 발밑이 갈라지며 속성 기둥이 솟는다 (염=용암, 수=물기둥, 목=가시 뿌리, 암=그림자 송곳, 무속성=바위)
    ground(from, to, o) {
      const e = o.pal || o.el, E = e === 'none' ? { hi: '#efe4d0', main: '#b59a78', lo: '#6e573c', deep: '#2a2016' } : el(e), by = to.y + (to.h || 60) * 0.42, sc = o.big ? 1.3 : 1;
      p('crack', to.x, by, { s: [50, 180 * sc], asp: 0.4, c: [E.hi, E.main], life: 0.7, pop: true, fout: 0.5 }); shock(to.x, by, E, 100 * sc, 0.3);
      at(0.07, () => {
        if (e === 'wood') thorns(to.x, by, E, 1.5 * sc, 0, 7, 110);
        else if (e === 'dark') { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.2, L = (i === 3 ? 170 : 110) * sc; p('shard', to.x + (i - 3) * 14, by, { rot: a, s: [10, L], asp: 0.3, c: ['#0a0214', '#0a0214'], add: false, life: 0.55, pop: true, fout: 0.6, vx: Math.cos(a) * L * 0.9, vy: Math.sin(a) * L * 0.9, drag: 0.8 }); p('shard', to.x + (i - 3) * 14, by, { rot: a, s: [12, L * 1.08], asp: 0.36, c: [E.main, E.lo], a: 0.7, life: 0.55, pop: true, fout: 0.5, vx: Math.cos(a) * L * 0.9, vy: Math.sin(a) * L * 0.9, drag: 0.8 }); } }
        else if (e === 'none' || e === 'ice') burst('shard', to.x, by, 12, { ang: -Math.PI / 2, spread: 0.5, v: [300, 700], sz: [26 * sc, 50 * sc, 14], asp: 0.5, c: [E.hi, E.lo], add: e === 'ice', life: [0.5, 0.9], ay: 1300, rrot: true, rvr: 8, jx: 30 });
        else { const tex = e === 'fire' ? 'flame' : e === 'water' ? 'drop' : 'spark'; burst(tex, to.x, by, 22, { ang: -Math.PI / 2, spread: 0.3, v: [300, 760 * sc], sz: [30 * sc, 58 * sc, 8], asp: tex === 'flame' ? 1 : 0.5, face: tex !== 'flame', c: [E.hi, e === 'fire' ? E.lo : E.main], life: [0.35, 0.7], ay: e === 'water' ? 1100 : -100, drag: 0.93, jx: 22, add: e !== 'water', dj: 0.12 }); p('line', to.x, by - 90 * sc, { rot: Math.PI / 2, s: [60, 260 * sc], asp: 0.3, c: [E.hi, E.main], a: 0.8, life: 0.4, pop: true, fout: 0.3 }); }
        smoke(to.x, by, 4, 1, ['#5c5248', '#17130f'], { a: 0.45 }); hitAt({ ...o, pal: e === 'none' ? 'none' : e, then: o.then }, to.x, to.y, 1.1); });
      o.then = null;
    },
    // 회전·선풍: 칼바람이 대상 둘레를 돌며 회오리가 솟는다
    whirl(from, to, o) {
      const e = o.pal || o.el, E = el(e), r0 = o.big ? 70 : 56;
      add({ life: 0.55, draw(k) { const al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : Math.min(1, k * 6), r = r0 * (0.8 + 0.5 * k); for (let i = 0; i < 3; i++) { const a = k * 14 + i * TAU / 3; G.spr('crescent', to.x + Math.cos(a) * r * 0.25, to.y + Math.sin(a) * r * 0.25, r * 2.6, r * 2.6, a, rgb(E.main), 0.9 * al, true); G.spr('crescent', to.x + Math.cos(a) * r * 0.25, to.y + Math.sin(a) * r * 0.25, r * 2.2, r * 2.2, a, rgb(E.hi), 0.9 * al, true); } if (Math.random() < 0.9) { const a = R(0, TAU); p('spark', to.x + Math.cos(a) * r, to.y + Math.sin(a) * r * 0.5, { vx: -Math.sin(a) * 300, vy: -260, s: [18, 3], asp: 0.3, face: true, c: [E.hi, E.main], life: 0.35 }); trail(e, to.x + Math.cos(a) * r, to.y + Math.sin(a) * r, 1); } } });
      at(0.2, () => hitAt(o, to.x, to.y)); at(0.36, () => accent(e, to.x, to.y, 0.6));
    },
    // 유성·낙하: 하늘에서 비스듬히 큰 덩이가 떨어져 크게 터진다
    meteor(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'fire' : o.el), E = el(e), sc = o.big ? 1.3 : 1, by = to.y + (to.h || 60) * 0.3;
      p('ring', to.x, by, { s: [150, 50], asp: 0.34, c: ['#ff5a4a', '#ff5a4a'], life: 0.34, a: 0.8 });
      fly({ from: { x: to.x + 170, y: to.y - 460 }, to: { x: to.x, y: by }, dur: 0.34, accel: true, el: o.el, pal: e, gs: 190 * sc, rw: 54 * sc, rlen: 16, sc: 1.6, body: (x, y, ang, k) => { G.spr('core', x, y, 76 * sc, 76 * sc, 0, rgb(E.hi), 1, true); G.spr('smoke', x, y, 70 * sc, 70 * sc, k * 9, rgb(E.deep), 0.9, false); G.spr('flame', x - Math.cos(ang) * 30, y - Math.sin(ang) * 30, 120 * sc, 170 * sc, ang - Math.PI / 2, rgb(E.main), 0.9, true); }, hit: (x, y) => { flash(x, y, E, 2 * sc); shock(x, y, E, 190 * sc, 0.36); shock(x, y, E, 130 * sc, 0.36, 0.07); p('crack', x, y, { s: [80, 260 * sc], asp: 0.4, c: [E.hi, E.main], life: 0.9, pop: true, fout: 0.5 }); burst('flame', x, y, 18, { ang: -Math.PI / 2, spread: 1.4, v: [160, 520], sz: [50, 90, 8], asp: 1.4, c: [E.main, E.lo], a: 0.8, life: [0.35, 0.7], drag: 0.9, rvr: 2 }); smoke(x, y, 10, 1.6 * sc, ['#3b3d47', '#0b0c10'], { v: [50, 200], a: 0.7, delay: 0.06 }); burst('shard', x, y, 14, { ang: -Math.PI / 2, spread: 1.3, v: [300, 800], sz: [18, 34, 8], asp: 0.5, c: ['#8a7a66', '#3a3026'], add: false, life: [0.6, 1.0], ay: 1300, rrot: true, rvr: 10 }); hitAt({ ...o, pal: e }, to.x, to.y, 1.4 * sc); } });
    },
    // 검의 비: 빛나는 검 여러 자루가 하늘에서 내리꽂힌다
    swords(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' || o.big ? 7 : 5;
      for (let i = 0; i < n; i++) { const tx = to.x + (i - (n - 1) / 2) * 16 + R(-6, 6), ty = to.y + R(-10, 16); fly({ from: { x: tx + R(-20, 20), y: ty - 380 }, to: { x: tx, y: ty }, dur: 0.16, delay: 0.05 + i * 0.05, accel: true, el: o.el, pal: o.pal, noTrail: true, rw: 8, rlen: 10, gs: 50, body: (x, y, ang) => { G.spr('sword', x, y, 120, 120, ang, rgb(E.main), 0.9, true); G.spr('sword', x, y, 110, 110, ang, WHITE, 1, true); }, hit: (x, y, ang) => { p('sword', x, y - 30, { rot: ang, s: [110, 110], c: [E.hi, E.main], life: 0.4, fout: 0.4 }); ringThin(x, y + 14, E, 34, 0.34); sparks(x, y, E, 5, 0.6); if (i === n - 1) hitAt(o, to.x, to.y, 1.1); } }); }
    },
    // 손: 거대한 손이 움켜쥔다 (손아귀·천수)
    hands(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' || o.type === 'aoe' ? 6 : 2;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.5, d = 170; p('hand', to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, { rot: a - Math.PI / 2, s: [110, 90], c: [E.main, E.lo], a: 0.85, life: 0.5, delay: i * 0.03, vx: -Math.cos(a) * 760, vy: -Math.sin(a) * 760, drag: 0.8, fout: 0.6, add: e !== 'dark' }); p('hand', to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, { rot: a - Math.PI / 2, s: [96, 78], c: [E.hi, E.main], a: 0.6, life: 0.5, delay: i * 0.03, vx: -Math.cos(a) * 760, vy: -Math.sin(a) * 760, drag: 0.8, fout: 0.6 }); }
      at(0.24, () => { shock(to.x, to.y, E, 90); hitAt(o, to.x, to.y, 1.05); });
    },
    // 시간: 시계 문양이 떠올라 멈췄다가 깨진다
    clock(from, to, o) {
      const E = o.pal ? el(o.pal) : { hi: '#f4fbff', main: '#9fd6ff', lo: '#5a7bd9', deep: '#101a3a' };
      p('clock', to.x, to.y, { s: [60, 220], c: [E.hi, E.main], life: 0.75, pop: true, fout: 0.75, vr: -0.5 }); p('ring', to.x, to.y, { s: [260, 200], c: [E.main, E.lo], life: 0.7, a: 0.6 });
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; p('glow', to.x + Math.cos(a) * 96, to.y + Math.sin(a) * 96, { s: [10, 4], c: [E.hi], life: 0.6, delay: i * 0.02 }); }
      at(0.6, () => { burst('shard', to.x, to.y, 22, { v: [200, 620], sz: [22, 40, 6], asp: 0.45, c: [E.hi, E.main], life: [0.35, 0.7], rrot: true, rvr: 14, ay: 500 }); flash(to.x, to.y, E, 1.1); hitAt(o, to.x, to.y, 0.9); });
    },
    // 독안개·장막: 짙은 구름이 덮고 기포가 터진다
    cloud(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'poison' : o.el), E = el(e);
      fly({ from, to, dur: 0.3, arc: 40, el: o.el, pal: e, gs: 60, rw: 20, body: (x, y) => G.spr('smoke', x, y, 60, 60, 0, rgb(E.main), 0.8, false) });
      at(0.3, () => { smoke(to.x, to.y, 14, 1.5, [E.main, E.deep], { a: 0.6, v: [20, 130], life: [0.9, 1.5], ay: -20, jx: 40, jy: 26 }); burst('bubble', to.x, to.y, 14, { ang: -Math.PI / 2, spread: 1.6, v: [20, 120], sz: [8, 18, 24], c: [E.hi, E.main], life: [0.6, 1.2], ay: -60, jx: 50, jy: 30, dj: 0.4 }); hitAt({ ...o, pal: e }, to.x, to.y, 0.8); });
    },
    // 용: 불꽃(속성) 몸통이 굽이치며 날아가 삼킨다
    dragon(from, to, o) {
      const e = o.pal || o.el, E = el(e), T = 0.55, a = dirOf(from, to), ex = to.x + Math.cos(a) * 60, ey = to.y + Math.sin(a) * 60;
      add({ life: T + 0.25, draw(k) { const head = Math.min(1, k * (T + 0.25) / T); for (let i = 0; i < 16; i++) { const kk = head - i * 0.035; if (kk < 0 || (k > head && kk > 1)) continue; const s = Math.sin(kk * 9) * 46 * (1 - kk * 0.4), x = from.x + (ex - from.x) * kk + Math.cos(a + 1.57) * s, y = from.y + (ey - from.y) * kk + Math.sin(a + 1.57) * s, sz = (i === 0 ? 96 : 74 - i * 3) * (o.big ? 1.25 : 1), al = k > 0.8 ? (1 - k) / 0.2 : 1; G.spr('glow', x, y, sz * 1.8, sz * 1.8, 0, rgb(E.main), 0.3 * al, true); G.spr(i === 0 ? 'core' : 'flame', x, y, sz, sz, a - Math.PI / 2 + Math.cos(kk * 9) * 0.6, rgb(i === 0 ? E.hi : i % 2 ? E.main : E.lo), 0.95 * al, true); if (i === 0) { G.spr('eye', x, y, sz * 0.7, sz * 0.4, a + Math.cos(kk * 9) * 0.6, rgb('#1a0500'), al, false); trail(e, x, y, 1.6); } } } });
      at(T * 0.8, () => { hitAt(o, to.x, to.y, 1.4); rays(to.x, to.y, E, 10, 170); });
    },
    // 불새·매: 빛나는 날개가 덮쳐 지나간다
    bird(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to), ex = { x: to.x + Math.cos(a) * 140, y: to.y + Math.sin(a) * 140 };
      fly({ from, to: ex, dur: 0.45, el: o.el, pal: o.pal, gs: 150, rw: 40, rlen: 16, sc: 1.5, body: (x, y, ang, k) => { const f = Math.sin(k * 26) * 0.5; for (const sd of [-1, 1]) { G.spr('wing', x + Math.cos(ang + sd * 1.57) * 40, y + Math.sin(ang + sd * 1.57) * 40, 120 * sd, 120, ang + Math.PI / 2 + sd * (0.5 + f), rgb(E.lo), 0.5, true); G.spr('wing', x + Math.cos(ang + sd * 1.57) * 36, y + Math.sin(ang + sd * 1.57) * 36, 100 * sd, 100, ang + Math.PI / 2 + sd * (0.5 + f), rgb(E.main), 0.45, true); } G.spr('core', x, y, 44, 44, 0, rgb(E.hi), 1, true); } });
      at(0.45 * dist(from, to) / dist(from, ex), () => hitAt(o, to.x, to.y, 1.25));
    },
    // 뼈창: 뼈가 빙글 날아가 박힌다
    bone(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' ? 4 : 1;
      for (let i = 0; i < n; i++) fly({ from, to: { x: to.x + (n > 1 ? R(-14, 14) : 0), y: to.y + (n > 1 ? R(-14, 14) : 0) }, speed: 1200, delay: i * 0.08, el: o.el, pal: o.pal, rw: 12, rlen: 10, gs: 50, body: (x, y, ang, k) => { G.spr('bone', x, y, 96, 96, ang + (o.type === 'pierce' ? 0 : k * 16), rgb('#f3ecd8'), 1, false); G.spr('bone', x, y, 110, 110, ang + (o.type === 'pierce' ? 0 : k * 16), rgb(E.main), 0.5, true); }, hit: (x, y) => { burst('bone', x, y, 4, { v: [140, 380], sz: [26, 40, 20], c: ['#f3ecd8', '#b9ac98'], add: false, life: [0.4, 0.7], ay: 800, rrot: true, rvr: 14 }); p('skull', x, y - 20, { s: [30, 80], c: [E.hi, E.main], life: 0.5, vy: -60, pop: true, fout: 0.4 }); if (i === n - 1) hitAt(o, to.x, to.y, 1.05); } });
    },
  };
  // 머리 위를 도는 별 (기절)
  function stars(to, follow) {
    return add({ life: follow ? Infinity : 1.1, draw(k, self) {
      const t = follow ? follow() : to;
      if (!t) { self.life = 0; return; }
      const y0 = t.y - (t.h || 60) * 0.62;
      const al = follow ? Math.min(1, self.t * 8) : k > 0.75 ? (1 - k) / 0.25 : Math.min(1, k * 8);
      const radius = follow ? Math.max(18, Math.min(40, t.w * 0.42)) : 30;
      const size = follow ? Math.max(10, Math.min(18, t.w * 0.2)) : 22;
      const angle = follow ? (typeof FX !== 'undefined' && FX.reduced ? 0 : self.t * 5) : k * 11;
      for (let i = 0; i < 4; i++) {
        const a = angle + i * TAU / 4;
        G.spr('star5', t.x + Math.cos(a) * radius, y0 + Math.sin(a) * 7, size, size, a,
          rgb(Math.sin(a) > 0 ? '#fff3a0' : '#ffd23f'), al, true);
      }
    } });
  }

  // ---------- 전체 공격 ----------
  // from 시전자, area {x, y, w, h} 상대 진영, spots 실제 대상 자리
  const each = (spots, gap, fn) => spots.forEach((s, i) => at(i * gap, () => fn({ x: s.x, y: s.y, w: s.w || 50, h: s.h || 60 }, i)));
  const AOE = {
    // 검기 폭풍: 진영 폭만 한 칼바람 두 줄이 쓸고 지나간다
    slash(from, area, spots, o) { const E = el(o.pal || o.el), a = Math.atan2(area.y - from.y, area.x - from.x), far = { x: area.x + Math.cos(a) * 40, y: area.y + Math.sin(a) * 40 }, sz = Math.max(260, area.w * 1.15); flash(from.x, from.y, E, 0.6); crescentFly(from, far, o, sz, 0, 0, 0.26); crescentFly(from, far, o, sz * 0.8, 0, 0.08, 0.26); each(spots, 0.02, (s) => at(0.2, () => { cut(s.x, s.y, a + 1.57 + R(-0.4, 0.4), 190, E, 0, 1.1); accent(o.pal || o.el, s.x, s.y, 0.7); })); },
    // 화살비: 하늘에서 비스듬히 쏟아진다
    arrow(from, area, spots, o) { const E = el(o.pal || o.el), all = spots.map((s) => ({ ...s, real: true })); for (let i = 0; i < N(14); i++) all.push({ x: area.x + R(-area.w / 2, area.w / 2), y: area.y + R(-area.h / 2, area.h / 2) }); p('ring', from.x, from.y, { s: [60, 20], c: [E.hi, E.main], life: 0.2 }); all.forEach((s) => fly({ from: { x: s.x - 130 + R(-14, 14), y: s.y - 440 }, to: s, dur: 0.2, delay: 0.1 + R(0, 0.34), el: o.el, pal: o.pal, hero: 'arrow', hs: s.real ? 104 : 84, rw: 6, rlen: 12, gs: 30, noTrail: !s.real, hit: (x, y, ang) => { p(G.hero('arrow', o.pal || o.el), x - Math.cos(ang) * 14, y - Math.sin(ang) * 14, { s: [s.real ? 104 : 84, s.real ? 104 : 84], rot: ang, c: ['#ffffff'], add: false, life: 0.5, fout: 0.6 }); if (s.real) accent(o.pal || o.el, x, y, 0.65); else ringThin(x, y + 8, E, 20, 0.34); } })); },
    // 난사: 진영 전체에 예광탄을 흩뿌린다
    bullet(from, area, spots, o) { const pts = []; spots.forEach((s) => { for (let j = 0; j < 3; j++) pts.push({ x: s.x + R(-18, 18), y: s.y + R(-18, 18), real: j === 2, s }); }); pts.forEach((t, i) => at(i * 0.035, () => FORM.bullet(from, t, { el: o.el, pal: o.pal, type: 'dmg', then: null }))); },
    bomb(from, area, spots, o) { each(spots, 0.06, (s) => FORM.bomb(from, s, { el: o.el, pal: o.pal, flask: o.flask })); },
    // 진각·나한진: 주먹이 머리 위에서 쏟아지고 바닥 충격파가 퍼진다
    fist(from, area, spots, o) { const E = el(o.pal || o.el); shock(area.x, area.y + area.h * 0.35, E, area.w * 0.7, 0.3, 0.12, 0.5); shock(area.x, area.y + area.h * 0.35, E, area.w * 0.5, 0.3, 0.2, 0.5); each(spots, 0.04, (s) => FORM.fist(from, s, { el: o.el, pal: o.pal, type: 'stun' })); },
    smite(from, area, spots, o) { each(spots, 0.07, (s) => FORM.smite(from, s, { el: o.el, pal: o.pal })); },
    ground(from, area, spots, o) { each(spots, 0.06, (s) => FORM.ground(from, s, { el: o.el, pal: o.pal })); },
    meteor(from, area, spots, o) { each(spots, 0.12, (s) => FORM.meteor(from, s, { el: o.el, pal: o.pal })); },
    swords(from, area, spots, o) { each(spots, 0.05, (s) => FORM.swords(from, s, { el: o.el, pal: o.pal })); },
    bone(from, area, spots, o) { each(spots, 0.06, (s) => FORM.bone(from, s, { el: o.el, pal: o.pal })); },
    hands(from, area, spots, o) { each(spots, 0.05, (s) => FORM.hands(from, s, { el: o.el, pal: o.pal, type: 'aoe' })); },
    curse(from, area, spots, o) { each(spots, 0.05, (s) => FORM.curse(from, s, { el: o.el, pal: o.pal })); },
    psychic(from, area, spots, o) { each(spots, 0.04, (s) => FORM.psychic(from, s, { el: o.el, pal: o.pal })); },
    spirit(from, area, spots, o) { each(spots, 0.07, (s) => FORM.spirit(from, s, { el: o.el, pal: o.pal })); },
    note(from, area, spots, o) { const E = el(o.pal || o.el); for (let i = 0; i < 3; i++) shock(from.x, from.y, E, 220 + i * 60, 1, i * 0.1, 0.55); each(spots, 0.06, (s) => FORM.note(from, s, { el: o.el, pal: o.pal })); },
    rift(from, area, spots, o) { const e = o.pal || (o.el === 'none' ? 'dark' : o.el), E = el(e); add({ life: 0.7, draw(k) { const op = k < 0.25 ? ease(k / 0.25) : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1, L = area.w * 1.25; G.spr('glow', area.x, area.y, L, 150 * op, 0, rgb(E.main), 0.5 * op, true); G.spr('shard', area.x, area.y, L * 1.04, 70 * op, 0, rgb(E.main), 0.9, true); G.spr('shard', area.x, area.y, L, 48 * op, 0, rgb('#05010b'), 0.98, false); G.spr('spark', area.x, area.y, L * 1.2, 12 * op, 0, rgb(E.hi), op, true); } }); each(spots, 0.03, (s) => at(0.22, () => { burst('shard', s.x, s.y, 8, { v: [200, 520], sz: [18, 28, 4], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.25, 0.5] }); accent(e, s.x, s.y, 0.8); })); },
    clock(from, area, spots, o) { each(spots, 0.03, (s) => FORM.clock(from, s, { el: o.el, pal: o.pal })); },
    cloud(from, area, spots, o) { const e = o.pal || (o.el === 'none' ? 'poison' : o.el), E = el(e); smoke(area.x, area.y, 26, 1.7, [E.main, E.deep], { a: 0.55, v: [20, 160], life: [1.0, 1.7], ay: -16, jx: area.w * 0.5, jy: area.h * 0.45, dj: 0.3 }); burst('bubble', area.x, area.y, 22, { ang: -Math.PI / 2, spread: 1.6, v: [20, 120], sz: [8, 20, 26], c: [E.hi, E.main], life: [0.6, 1.3], ay: -60, jx: area.w * 0.5, jy: area.h * 0.4, dj: 0.6 }); each(spots, 0.05, (s) => at(0.25, () => accent(e, s.x, s.y, 0.6))); },
    dragon(from, area, spots, o) { const L = { x: area.x - area.w * 0.55, y: area.y }, Rr = { x: area.x + area.w * 0.55, y: area.y }; FORM.dragon({ x: L.x - 60, y: L.y + 40 }, Rr, { el: o.el, pal: o.pal, big: true }); each(spots, 0.05, (s) => at(0.25, () => accent(o.pal || o.el, s.x, s.y, 0.8))); },
    bird(from, area, spots, o) { FORM.bird(from, { x: area.x, y: area.y }, { el: o.el, pal: o.pal }); each(spots, 0.04, (s) => at(0.22, () => { accent(o.pal || o.el, s.x, s.y, 0.8); })); },
    // 회오리: 진영 한가운데 큰 회전
    whirl(from, area, spots, o) { const e = o.pal || o.el, E = el(e), r0 = Math.max(90, area.w * 0.4); add({ life: 0.75, draw(k) { const al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : Math.min(1, k * 6), r = r0 * (0.7 + 0.5 * k); for (let i = 0; i < 4; i++) { const a = k * 16 + i * TAU / 4; G.spr('crescent', area.x + Math.cos(a) * r * 0.3, area.y + Math.sin(a) * r * 0.3, r * 2.4, r * 2.4, a, rgb(E.main), 0.85 * al, true); G.spr('crescent', area.x + Math.cos(a) * r * 0.3, area.y + Math.sin(a) * r * 0.3, r * 2, r * 2, a, rgb(E.hi), 0.85 * al, true); } for (let q = 0; q < 3; q++) { const a = R(0, TAU); trail(e, area.x + Math.cos(a) * r, area.y + Math.sin(a) * r * 0.6, 1.3); p('spark', area.x + Math.cos(a) * r, area.y + Math.sin(a) * r * 0.6, { vx: -Math.sin(a) * 420, vy: -300, s: [22, 3], asp: 0.3, face: true, c: [E.hi, E.main], life: 0.35 }); } } }); each(spots, 0.05, (s) => at(0.2, () => accent(e, s.x, s.y, 0.75))); },
    // 광선 쓸기: 빛줄기가 진영을 가로질러 훑는다
    beam(from, area, spots, o) { const e = o.pal || o.el, E = el(e), cm = rgb(E.main), ch = rgb(E.hi), cl = rgb(E.lo); p('star4', from.x, from.y, { s: [40, 160], c: [E.hi, E.main], life: 0.2, pop: true }); add({ life: 0.6, delay: 0.1, draw(k) { const sw = ease(Math.min(1, k / 0.75)), tx = area.x - area.w * 0.6 + area.w * 1.2 * sw, ty = area.y, al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1, a = Math.atan2(ty - from.y, tx - from.x), ex = tx + Math.cos(a) * 120, ey = ty + Math.sin(a) * 120, w = 15 * (0.9 + 0.1 * Math.sin(k * 80)); G.seg(from.x, from.y, ex, ey, w * 4, w * 4, cl, 0.45 * al, e !== 'dark'); G.seg(from.x, from.y, ex, ey, w * 2, w * 2, cm, 0.9 * al, true); G.seg(from.x, from.y, ex, ey, w * 0.8, w * 0.8, ch, al, true); G.spr('glow', tx, ty, 120, 120, 0, cm, 0.9 * al, true); if (Math.random() < 0.9) sparks(tx, ty, E, 2, 0.7); } }); spots.forEach((s) => at(0.1 + 0.45 * Math.max(0, Math.min(1, (s.x - (area.x - area.w * 0.6)) / (area.w * 1.2))), () => accent(e, s.x, s.y, 0.75))); },
    // 속성 폭풍: 염=불비, 뇌=낙뢰, 수=해일, 목=꽃잎·잎 폭풍, 성=빛의 비, 암=검은 안개와 공허, 얼음=눈보라
    orb(from, area, spots, o) {
      const e = o.pal || o.el, E = el(e);
      if (e === 'bolt') { p('smoke', area.x, area.y - 300, { s: [area.w * 1.2, area.w * 1.4], asp: 0.3, c: ['#2a3350', '#0b0f1c'], add: false, a: 0.7, life: 0.9, fin: 0.2 }); each(spots, 0.06, (s) => { G.bolt(s.x + R(-40, 40), s.y - 460, s.x, s.y, E, { w: 6, life: 0.3, branch: 4 }); accent('bolt', s.x, s.y, 0.95); shock(s.x, s.y + 24, E, 70, 0.3); }); }
      else if (e === 'water' || e === 'blood') { add({ life: 0.75, draw(k) { const xx = area.x - area.w * 0.85 + area.w * 1.7 * ease(k), al = k > 0.7 ? (1 - k) / 0.3 : Math.min(1, k * 6), hh = Math.max(150, area.h * 1.5); for (let i = 0; i < 5; i++) { G.spr('crescent', xx - i * 26, area.y + 10, hh * (1.15 - i * 0.1), hh * (1.15 - i * 0.1), 0, rgb(i ? E.main : E.hi), (0.9 - i * 0.14) * al, i === 0); } G.spr('glow', xx, area.y, hh * 1.4, hh * 1.2, 0, rgb(E.main), 0.4 * al, true); for (let q = 0; q < 3; q++) p('drop', xx + R(-20, 30), area.y + R(-hh / 2, hh / 2), { vx: R(60, 300), vy: R(-340, -80), ay: 900, s: [R(12, 22), 6], asp: 0.5, face: true, c: [E.hi, E.main], add: false, life: 0.5 }); } }); spots.forEach((s) => at(0.1 + 0.4 * Math.max(0, Math.min(1, (s.x - (area.x - area.w / 2)) / Math.max(1, area.w))), () => accent(e, s.x, s.y, 0.85))); }
      else if (e === 'wood') { for (let i = 0; i < N(60); i++) { const pink = i % 3 === 0; p(pink ? 'petal' : 'leaf', area.x - area.w * 0.7 + R(-40, 40), area.y + R(-area.h, area.h), { vx: R(500, 1000), vy: R(-140, 140), drag: 0.975, s: [R(14, 26), 10], asp: 0.5, c: pink ? ['#ffd0ea', '#ff7dbd'] : [i % 2 ? E.hi : E.main, E.lo], add: false, rot: R(0, TAU), vr: R(-14, 14), life: R(0.5, 0.9), delay: R(0, 0.35), wob: 10, fout: 0.7 }); } each(spots, 0.05, (s) => at(0.2, () => { thorns(s.x, s.y + 24, E, 1.3, 0, 5, 90); accent('wood', s.x, s.y, 0.7); })); }
      else if (e === 'holy') { each(spots, 0.05, (s) => { for (let j = 0; j < 4; j++) { const tx = s.x + R(-26, 26); p('spark', tx, s.y - 240, { rot: Math.PI / 2, vy: 1500, drag: 1, s: [170, 170], asp: 0.1, c: [E.hi, E.main], life: 0.17, delay: j * 0.06, fout: 0.8 }); } at(0.2, () => { accent('holy', s.x, s.y, 0.85); shock(s.x, s.y + 24, E, 70, 0.3); }); }); p('glow', area.x, area.y - 260, { s: [area.w * 1.6, area.w * 1.8], asp: 0.4, c: [E.hi, E.main], a: 0.45, life: 0.7 }); }
      else if (e === 'dark') { smoke(area.x, area.y, 26, 1.8, [E.lo, E.deep], { a: 0.75, v: [20, 150], life: [0.9, 1.5], ay: 0, jx: area.w * 0.5, jy: area.h * 0.45, dj: 0.2 }); p('core', area.x, area.y, { s: [20, area.w * 0.9], asp: 0.5, c: ['#05010b', '#05010b'], add: false, a: 0.9, life: 0.8, pop: true, fout: 0.6 }); p('ring', area.x, area.y, { s: [30, area.w * 1.15], asp: 0.5, c: [E.hi, E.main], life: 0.8, pop: true, fout: 0.6 }); each(spots, 0.05, (s) => at(0.3, () => accent('dark', s.x, s.y, 0.85))); }
      else if (e === 'ice') { for (let i = 0; i < N(50); i++) p(i % 3 ? 'glow' : 'shard', area.x + R(-area.w * 0.8, area.w * 0.4), area.y - 260 + R(-40, 40), { vx: R(120, 300), vy: R(500, 900), drag: 1, s: [i % 3 ? R(6, 12) : R(20, 34), 4], asp: i % 3 ? 1 : 0.35, face: i % 3 === 0, c: [E.hi, E.main], life: R(0.35, 0.6), delay: R(0, 0.45) }); each(spots, 0.05, (s) => at(0.3, () => accent('ice', s.x, s.y, 0.85))); }
      else { // 염·무속성: 불덩이가 비처럼 떨어진다
        const all = spots.map((s) => ({ ...s, real: true })); for (let i = 0; i < 4; i++) all.push({ x: area.x + R(-area.w / 2, area.w / 2), y: area.y + R(-area.h / 3, area.h / 3) });
        all.forEach((s, i) => fly({ from: { x: s.x + 110, y: s.y - 420 }, to: s, dur: 0.26, delay: i * 0.06, accel: true, el: o.el, pal: o.pal, gs: 110, rw: 26, rlen: 14, sc: 1.2, body: (x, y, ang) => { G.spr('core', x, y, 40, 40, 0, rgb(E.hi), 1, true); G.spr('flame', x - Math.cos(ang) * 16, y - Math.sin(ang) * 16, 70, 96, ang - Math.PI / 2, rgb(E.main), 0.9, true); }, hit: (x, y) => { accent(e, x, y, s.real ? 0.95 : 0.6); shock(x, y + 20, E, 70, 0.3); } }));
      }
    },
  };
  const AOE_ALIAS = { cleave: 'slash', thrust: 'slash', stab: 'slash', claw: 'slash', bite: 'slash', shield: 'fist', talisman: 'orb' };

  // ---------- 보조 스킬 ----------
  // t: {x, y, w, h} 대상. e: 속성
  const SUP = {
    // 회복: 발밑 고리에서 빛이 솟고 십자와 반짝임이 나선으로 오른다. 속성에 따라 물방울·잎·깃털이 섞인다
    heal(t, e, o = {}) {
      const E = e && e !== 'none' ? el(e) : { hi: '#f4ffe8', main: '#7dffa0', lo: '#1fbf6a', deep: '#063a1f' }, by = t.y + t.h * 0.45, sc = o.big ? 1.4 : 1;
      p('ring', t.x, by, { s: [30, 150 * sc], asp: 0.32, c: [E.hi, E.main], life: 0.6, pop: true, fout: 0.5 }); p('wave', t.x, by, { s: [20, 120 * sc], asp: 0.32, c: [E.hi, E.main], life: 0.5, pop: true, a: 0.7 });
      p('line', t.x, t.y - 20, { rot: Math.PI / 2, s: [80, 230 * sc], asp: 0.42, c: [E.hi, E.main], a: 0.5, life: 0.7, pop: true, fin: 0.2, fout: 0.4 });
      add({ life: 0.9, draw(k, it, dt) { if (Math.random() < 0.9 * G.S.quality()) { const a = k * 16 + R(0, 0.5), r = t.w * 0.55; p('glow', t.x + Math.cos(a) * r, by - k * t.h * 1.3 + Math.sin(a) * 8, { s: [R(7, 12), 2], c: [E.hi, E.main], life: 0.5, vy: -70 }); } } });
      for (let i = 0; i < N(5); i++) p('plus', t.x + R(-t.w * 0.5, t.w * 0.5), by - R(0, 30), { s: [R(14, 22) * sc, 6], c: [E.hi, E.main], life: R(0.7, 1.0), vy: R(-150, -90), drag: 0.97, delay: i * 0.07, fout: 0.6 });
      burst('glow', t.x, by, 22, { ang: -Math.PI / 2, spread: 0.35, v: [60, 260], sz: [5, 10, 2], c: [E.hi, E.main], life: [0.6, 1.1], jx: t.w * 0.5, dj: 0.3 });
      if (e === 'water') burst('bubble', t.x, by, 8, { ang: -Math.PI / 2, spread: 0.5, v: [50, 150], sz: [8, 16, 20], c: [E.hi], life: [0.7, 1.1], ay: -60, jx: t.w * 0.5, dj: 0.3 });
      if (e === 'wood') for (let i = 0; i < N(8); i++) p(i % 2 ? 'leaf' : 'petal', t.x + R(-t.w * 0.5, t.w * 0.5), by, { vx: R(-40, 40), vy: R(-220, -110), drag: 0.97, s: [R(14, 22), 8], asp: 0.5, c: i % 2 ? [E.hi, E.main] : ['#ffd0ea', '#ff7dbd'], add: false, rot: R(0, TAU), vr: R(-8, 8), wob: 12, life: R(0.8, 1.2), delay: i * 0.05, fout: 0.6 });
      if (e === 'holy' || !e || e === 'none') p('star4', t.x, t.y - t.h * 0.2, { s: [30, 130 * sc], c: [E.hi, E.main], life: 0.5, pop: true, vr: 1 });
      if (e === 'dark') smoke(t.x, by, 5, 0.9, [E.lo, E.deep], { a: 0.5 });
    },
    mp(t) { SUP.heal(t, 'water', {}); },
    // 부활: 굵은 빛기둥 + 펼쳐지는 날개 + 떨어지는 깃털
    revive(t, e) {
      const E = el(e && e !== 'none' ? e : 'holy'), by = t.y + t.h * 0.45;
      add({ life: 1.0, draw(k) { const g = Math.min(1, k / 0.15), al = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1, w = 60, top = t.y - 520; G.seg(t.x, by, t.x, by + (top - by) * g, w * 2.6, w * 3, rgb(E.lo), 0.22 * al, true); G.seg(t.x, by, t.x, by + (top - by) * g, w * 1.4, w * 1.6, rgb(E.main), 0.45 * al, true); G.seg(t.x, by, t.x, by + (top - by) * g, w * 0.5, w * 0.6, rgb(E.hi), 0.7 * al, true); const wk = ease(Math.min(1, Math.max(0, (k - 0.15) / 0.3))); for (const sd of [-1, 1]) { G.spr('wing', t.x + sd * 58 * wk, t.y - 30, 130 * sd * wk, 130 * wk, sd * (0.2 - 0.25 * Math.sin(k * 8)), rgb(E.main), 0.42 * al, true); G.spr('wing', t.x + sd * 54 * wk, t.y - 30, 112 * sd * wk, 112 * wk, sd * (0.2 - 0.25 * Math.sin(k * 8)), rgb(E.hi), 0.4 * al, true); } } });
      shock(t.x, by, E, 150, 0.32); shock(t.x, by, E, 110, 0.32, 0.12); p('star4', t.x, t.y - 30, { s: [60, 300], c: [E.hi, E.main], life: 0.7, pop: true, vr: 0.6, delay: 0.15 });
      for (let i = 0; i < N(10); i++) p('feather', t.x + R(-90, 90), t.y - R(120, 220), { vx: R(-20, 20), vy: R(50, 110), s: [R(22, 34), 18], asp: 0.4, c: ['#ffffff', E.hi], add: false, rot: R(0, TAU), vr: R(-2, 2), wob: 16, wf: 5, life: R(1.0, 1.5), delay: 0.2 + i * 0.05, fout: 0.6 });
      burst('glow', t.x, by, 40, { ang: -Math.PI / 2, spread: 0.3, v: [100, 520], sz: [6, 12, 2], c: [E.hi, E.main], life: [0.6, 1.2], jx: 40, dj: 0.4 });
    },
    // 보호막: 육각 판이 차례로 맞물려 막을 이루고 한 번 번쩍인다
    shield(t, e, o = {}) {
      const E = e && e !== 'none' ? el(e) : { hi: '#f1fbff', main: '#7fd4ff', lo: '#2f7fe0', deep: '#0a2244' }, r = Math.max(t.w, t.h) * 0.72;
      const cells = [[0, 0], [1, 0], [-1, 0], [0.5, -0.87], [-0.5, -0.87], [0.5, 0.87], [-0.5, 0.87]];
      cells.forEach(([cx, cy], i) => p('hex', t.x + cx * r * 0.62, t.y + cy * r * 0.62, { s: [r * 0.3, r * 0.72], c: [E.hi, E.main], life: 0.75, delay: i * 0.035, pop: true, fin: 0.15, fout: 0.6, rot: Math.PI / 6 }));
      p('bubble', t.x, t.y, { s: [r * 1.4, r * 2.5], c: [E.hi, E.main], life: 0.8, pop: true, fin: 0.2, fout: 0.55, delay: 0.1 }); p('ring', t.x, t.y, { s: [r * 1.2, r * 3], c: [E.hi, E.main], life: 0.4, pop: true, delay: 0.26 }); p('glow', t.x, t.y, { s: [r * 2, r * 3.4], c: [E.main, E.lo], a: 0.35, life: 0.6, delay: 0.1 });
      at(0.28, () => { for (let i = 0; i < N(10); i++) { const a = i / 10 * TAU; p('star4', t.x + Math.cos(a) * r, t.y + Math.sin(a) * r, { s: [26, 6], c: [E.hi], life: 0.3, delay: i * 0.012 }); } });
      if (e === 'wood') thorns(t.x, t.y + t.h * 0.45, E, 1, 0.1, 6, 50);
      if (e === 'fire') burst('flame', t.x, t.y + t.h * 0.4, 10, { ang: -Math.PI / 2, spread: 0.5, v: [60, 200], sz: [24, 40, 4], asp: 1.4, a: 0.75, c: [E.main, E.lo], life: [0.4, 0.7], jx: r * 0.8, ay: -200 });
    },
    // 강화: 발밑 고리에서 기운이 솟고 화살표가 위로 오른다
    buff(t, e, o = {}) {
      const E = e && e !== 'none' ? el(e) : { hi: '#fff6d0', main: '#ffb547', lo: '#ff6a1a', deep: '#3a1a04' }, by = t.y + t.h * 0.45;
      p('ring', t.x, by, { s: [150, 40], asp: 0.32, c: [E.hi, E.main], life: 0.5, fout: 0.3 }); shock(t.x, by, E, 80, 0.32, 0.1);
      for (let i = 0; i < N(12); i++) { const dx = R(-t.w * 0.6, t.w * 0.6); p('spark', t.x + dx, by - R(0, 20), { rot: -Math.PI / 2, vy: R(-520, -280), drag: 0.95, s: [R(50, 90), 10], asp: 0.14, c: [E.hi, E.main], life: R(0.35, 0.6), delay: R(0, 0.3) }); }
      for (let i = 0; i < 3; i++) p('chev', t.x + (i - 1) * t.w * 0.42, by - 10, { s: [22, 34], c: [E.hi, E.main], life: 0.7, vy: -200, drag: 0.96, delay: 0.1 + i * 0.08, fin: 0.2, fout: 0.6 });
      add({ life: 0.7, draw(k) { const al = k > 0.6 ? (1 - k) / 0.4 : Math.min(1, k * 5); G.spr('flame', t.x, t.y - 6, t.w * 2.1, t.h * 2.3, 0, rgb(E.main), 0.28 * al, true); G.spr('flame', t.x, t.y, t.w * 1.6, t.h * 1.9, Math.sin(k * 20) * 0.05, rgb(E.hi), 0.2 * al, true); } });
      if (o.all) p('star4', t.x, t.y - t.h * 0.5, { s: [20, 90], c: [E.hi], life: 0.35, delay: 0.2 });
    },
    // 약화: 보라 화살표가 아래로 떨어지고 검은 기운이 감긴다
    debuff(t, e) {
      const E = e && e !== 'none' && e !== 'holy' ? el(e) : el('dark'), top = t.y - t.h * 0.7;
      for (let i = 0; i < 3; i++) p('chev', t.x + (i - 1) * t.w * 0.42, top, { rot: Math.PI, s: [34, 22], c: [E.hi, E.main], life: 0.7, vy: 190, drag: 0.96, delay: i * 0.08, fin: 0.2, fout: 0.6 });
      smoke(t.x, t.y, 6, 0.9, [E.lo, E.deep], { a: 0.55, ay: 30 }); p('ring', t.x, t.y, { s: [170, 60], c: [E.main, E.lo], life: 0.5, fout: 0.3 });
      for (let i = 0; i < N(10); i++) p('spark', t.x + R(-t.w * 0.6, t.w * 0.6), top - R(0, 20), { rot: Math.PI / 2, vy: R(240, 420), drag: 0.96, s: [R(36, 60), 8], asp: 0.14, c: [E.hi, E.main], life: R(0.35, 0.55), delay: R(0, 0.25) });
    },
    // 도발: 붉은 충격파가 퍼지고 타격선이 뻗는다
    taunt(t, e) { const E = { hi: '#ffe0e0', main: '#ff4f6a', lo: '#b3122b', deep: '#2a0308' }; shock(t.x, t.y, E, 90); ringThin(t.x, t.y, E, 130, 1, 0.1); rays(t.x, t.y, E, 14, 170, { asp: 0.16 }); p('star4', t.x, t.y - t.h * 0.75, { s: [30, 120], c: [E.hi, E.main], life: 0.4, pop: true }); p('skull', t.x, t.y - t.h * 0.85, { s: [20, 56], c: [E.hi, E.main], life: 0.6, pop: true, fout: 0.6 }); },
    // 회피: 옆으로 스치는 바람 줄기와 잔상
    evade(t, e) { const E = e && e !== 'none' ? el(e) : { hi: '#f4feff', main: '#9fe8ff', lo: '#3f9bdc', deep: '#0c2a44' }; for (let i = 0; i < N(9); i++) { const d = i % 2 ? 1 : -1; p('spark', t.x - d * 60, t.y + R(-t.h * 0.5, t.h * 0.5), { rot: 0, vx: d * R(700, 1100), drag: 0.9, s: [R(70, 120), 20], asp: 0.1, c: [E.hi, E.main], life: R(0.25, 0.4), delay: R(0, 0.15) }); } for (const d of [-1, 1]) p('glow', t.x, t.y, { s: [t.w * 1.6, t.w * 1.2], asp: 1.4, c: [E.main, E.lo], a: 0.45, life: 0.35, vx: d * 240, drag: 0.9 }); p('ring', t.x, t.y + t.h * 0.45, { s: [40, 130], asp: 0.3, c: [E.hi, E.main], life: 0.3, pop: true }); },
    // 소환: 바닥 마법진 + 빛기둥 + 연기
    summon(t, e) {
      const E = el(e && e !== 'none' ? e : 'dark'), by = t.y + t.h * 0.45;
      p('rune', t.x, by, { s: [60, 220], asp: 0.36, c: [E.hi, E.main], life: 1.0, pop: true, fin: 0.1, fout: 0.6 }); p('rune', t.x, by, { s: [60, 260], asp: 0.36, c: [E.main, E.lo], a: 0.4, life: 1.0, pop: true, fout: 0.6 });
      p('line', t.x, t.y - 60, { rot: Math.PI / 2, s: [100, 330], asp: 0.34, c: [E.hi, E.main], a: 0.75, life: 0.7, pop: true, fin: 0.15, fout: 0.4, delay: 0.1 });
      burst('glow', t.x, by, 28, { ang: -Math.PI / 2, spread: 0.3, v: [120, 480], sz: [6, 11, 2], c: [E.hi, E.main], life: [0.5, 1.0], jx: 60, dj: 0.4 }); smoke(t.x, by, 8, 1.2, [E.lo, E.deep], { a: 0.5, delay: 0.25, v: [30, 120] }); at(0.3, () => flash(t.x, t.y, E, 0.9));
    },
    // 지속 피해·약화가 몸에 감기는 모양
    linger(t, e, kind) {
      if (kind === 'stun') return stars(t);
      const E = el(e); add({ life: 1.0, draw(k) { if (Math.random() > 0.75 * G.S.quality()) return; const x = t.x + R(-t.w * 0.5, t.w * 0.5), y = t.y + R(-t.h * 0.4, t.h * 0.45);
        if (e === 'fire') p('flame', x, y, { s: [R(18, 32), 3], asp: 1.5, c: [E.main, E.lo], a: 0.75, life: 0.4, vy: -90, rot: R(-0.4, 0.4) }); else if (e === 'wood' || e === 'poison') p('bubble', x, y, { s: [R(8, 14), 18], c: ['#e9ff8a', '#8fdc2e'], life: 0.5, vy: -50 }); else if (e === 'water' || e === 'blood') p('drop', x, y - 10, { rot: Math.PI / 2, s: [R(12, 18), 6], asp: 0.5, c: [E.hi, E.main], add: false, life: 0.45, vy: 160 }); else if (e === 'bolt') { const a = R(0, TAU); G.bolt(x, y, x + Math.cos(a) * 26, y + Math.sin(a) * 26, E, { w: 2, life: 0.1, branch: 0 }); } else if (e === 'holy') p('star4', x, y, { s: [10, 44], c: [E.hi, E.main], life: 0.3, pop: true }); else p('smoke', x, y, { s: [R(24, 36), 60], c: [E.lo, E.deep], add: false, a: 0.6, life: 0.6, vy: -40, rot: R(0, TAU) }); } });
    },
    // 흡수: 대상에게서 빠져나온 기운이 굽이쳐 시전자에게 빨려 든다
    drain(from, to, e) {
      const E = e === 'dark' || !e || e === 'none' ? { hi: '#ffd0e0', main: '#ff3a6a', lo: '#8a1bd0', deep: '#1a0420' } : el(e);
      for (let i = 0; i < N(9); i++) fly({ from: { x: from.x + R(-18, 18), y: from.y + R(-18, 18) }, to, dur: R(0.4, 0.6), side: R(-90, 90), delay: i * 0.035, ease: true, el: e, noTrail: true, rw: 10, rlen: 12, rc: [E.hi, E.main], gs: 34, body: (x, y) => { G.spr('core', x, y, 16, 16, 0, rgb(E.hi), 1, true); G.spr('glow', x, y, 46, 46, 0, rgb(E.main), 0.7, true); }, hit: (x, y) => { p('glow', x, y, { s: [30, 90], c: [E.hi, E.main], life: 0.2, a: 0.6 }); } });
      at(0.5, () => { p('ring', to.x, to.y, { s: [150, 30], c: [E.hi, E.main], life: 0.35 }); burst('glow', to.x, to.y, 10, { ang: -Math.PI / 2, spread: 0.5, v: [60, 200], sz: [6, 10, 2], c: [E.hi, E.main], life: [0.4, 0.8], jx: 24 }); });
    },
  };

  return {
    G, FORM, AOE, SUP, accent, trail, stars,
    kit: { flash, shock, ringThin, sparks, smoke, rays, cut, thorns, fly, hitAt, crescentFly, dirOf, dist },
    forms: Object.keys(FORM),
    ready: () => G.init(),
    // 단일 대상
    play(form, from, to, o = {}) { if (!from || !to || !G.init()) return false; const t = { w: 50, h: 60, ...to }, f = { w: 50, h: 60, ...from }; (FORM[form] || FORM.orb)(f, t, { ...o, from: f, to: t }); return true; },
    // 전체 대상
    playAoe(form, from, area, spots, o = {}) { if (!area || !G.init()) return false; const f = from || { x: area.x, y: area.y + 260 }; const fn = AOE[form] || AOE[AOE_ALIAS[form]] || AOE.orb; fn(f, area, spots && spots.length ? spots : [{ x: area.x, y: area.y }], { ...o, from: f }); return true; },
    // 보조
    support(kind, t, e, o) { if (!t || !G.init()) return false; const tt = { w: 50, h: 60, ...t }; (SUP[kind] || SUP.buff)(tt, e, o); return true; },
    drain(from, to, e) { if (!from || !to || !G.init()) return false; SUP.drain(from, to, e); return true; },
  };
})();
