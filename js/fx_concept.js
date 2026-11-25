// ===== 스킬 컨셉 연출 (전면 재설계) =====
// 기존 반달·재활용 연출을 쓰지 않는다. pixelfx(MIT) 타격 문법 — 빠른 인·느린 아웃·흰 칼끝·히트스톱 —
// 을 빌려, 각 스킬 모양이 "무엇이 일어나는지" 한눈에 읽히게 다시 짠다.
// API(FXF.play / FORM 키)는 유지. 로드 후 FXF.FORM 을 덮어쓴다.
(() => {
  if (typeof FXG === 'undefined' || typeof FXF === 'undefined') return;
  const G = FXG, R = G.R, TAU = G.TAU, el = G.el, N = G.N, p = G.p, burst = G.burst, at = G.at, add = G.add, rgb = G.rgb;
  const kit = FXF.kit || {};
  const flash = kit.flash || (() => {});
  const shock = kit.shock || (() => {});
  const sparks = kit.sparks || (() => {});
  const smoke = kit.smoke || (() => {});
  const rays = kit.rays || (() => {});
  const cut = kit.cut || (() => {});
  const thorns = kit.thorns || (() => {});
  const fly = kit.fly || (() => {});
  const hitAt = kit.hitAt || ((o, x, y, sc) => { if (FXF.accent) FXF.accent(o.pal || o.el, x, y, sc); });
  const trail = FXF.trail || (() => {});
  const WHITE = [1, 1, 1];
  const dirOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const outExpo = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 4);
  const inQuad = (x) => { x = Math.min(1, Math.max(0, x)); return x * x; };

  // ---------- 칼날 궤적: 시전자→대상 베지어를 칼끝이 쓸고, 흰 절삭면이 남는다 ----------
  function bladeArc(from, to, o, opt = {}) {
    const E = el(o.pal || o.el), aim = dirOf(from, to), L = Math.max(56, dist(from, to));
    const size = opt.size || 160, tilt = opt.tilt || 0.55, delay = opt.delay || 0;
    const nx = Math.cos(aim + Math.PI / 2), ny = Math.sin(aim + Math.PI / 2);
    const bulge = tilt * Math.max(size * 0.55, L * 0.38);
    const start = { x: from.x + Math.cos(aim) * 6, y: from.y + Math.sin(aim) * 6 };
    const end = { x: to.x + Math.cos(aim) * 40, y: to.y + Math.sin(aim) * 40 };
    const ctrl = { x: (start.x + end.x) * 0.5 + nx * bulge, y: (start.y + end.y) * 0.5 + ny * bulge };
    const bez = (u) => { const v = 1 - u; return [v * v * start.x + 2 * v * u * ctrl.x + u * u * end.x, v * v * start.y + 2 * v * u * ctrl.y + u * u * end.y]; };
    const tang = (u) => {
      const tx = 2 * (1 - u) * (ctrl.x - start.x) + 2 * u * (end.x - ctrl.x);
      const ty = 2 * (1 - u) * (ctrl.y - start.y) + 2 * u * (end.y - ctrl.y);
      const len = Math.hypot(tx, ty) || 1; return [tx / len, ty / len];
    };
    const sweep = opt.sweep || 0.09, hold = 0.05, trailT = opt.trail || 0.26, life = sweep + hold + trailT;
    let hitDone = false;
    const fire = () => { if (hitDone || !opt.onHit) return; hitDone = true; try { opt.onHit(); } catch (e) { /* */ } };
    add({ delay, life, end: fire, draw(k) {
      const t = k * life, headU = outExpo(t / sweep);
      let tailU = 0;
      if (t > hold * 0.4) tailU = Math.min(headU, Math.pow(Math.max(0, (t - hold * 0.4) / (sweep + trailT)), 1.25));
      if (!hitDone && headU >= 0.7) fire();
      const fade = t > sweep + hold ? Math.max(0, 1 - (t - sweep - hold) / trailT) : 1;
      if (fade < 0.03 || headU <= tailU + 0.01) return;
      const tip = bez(headU), [tdx, tdy] = tang(headU), segs = 28;
      for (let i = 0; i < segs; i++) {
        const u0 = tailU + (headU - tailU) * (i / segs), u1 = tailU + (headU - tailU) * ((i + 1) / segs);
        const [x0, y0] = bez(u0), [x1, y1] = bez(u1), along = (i + 0.5) / segs;
        const wShape = Math.pow(Math.sin(Math.PI * Math.pow(Math.max(0.02, along), 1.85)), 0.5);
        const w = Math.max(4, size * (0.1 + 0.14 * wShape) * (0.5 + 0.5 * along)) * fade;
        const al = Math.min(1, 0.3 + along) * fade;
        G.seg(x0, y0, x1, y1, w * 2.8, w * 2.5, rgb(E.lo), 0.45 * al, o.el !== 'dark');
        G.seg(x0, y0, x1, y1, w * 1.6, w * 1.4, rgb(E.main), 0.9 * al, true);
        G.seg(x0, y0, x1, y1, w * 0.7, w * 0.55, rgb(E.hi), al, true);
        if (along > 0.7) G.seg(x0, y0, x1, y1, w * 0.35, w * 0.22, WHITE, al, true);
      }
      // 칼끝 흰 절삭면 + 짧은 검신
      G.spr('glow', tip[0], tip[1], 64, 64, 0, rgb(E.hi), 0.55 * fade, true);
      G.spr('core', tip[0], tip[1], 16, 16, 0, WHITE, 0.95 * fade, true);
      G.seg(tip[0] - tdx * 12, tip[1] - tdy * 12, tip[0] + tdx * 42, tip[1] + tdy * 42, 5, 1.5, WHITE, 0.95 * fade, true);
      G.seg(tip[0] - tdx * 8, tip[1] - tdy * 8, tip[0] + tdx * 36, tip[1] + tdy * 36, 9, 2.8, rgb(E.main), 0.6 * fade, true);
      G.seg(tip[0] + tdx * 8, tip[1] + tdy * 8, tip[0] + tdx * 56, tip[1] + tdy * 56, 2.4, 0.7, rgb(E.hi), 0.75 * fade, true);
      if (Math.random() < 0.7) {
        const u = tailU + (headU - tailU) * Math.random(), [x, y] = bez(u), [sx, sy] = tang(u);
        p('spark', x, y, { vx: sx * R(140, 320), vy: sy * R(140, 320), s: [16, 2], asp: 0.25, face: true, c: ['#ffffff', E.hi], life: 0.22 });
      }
    } });
  }

  // ---------- 찌르기 다발: 손에서 끝점으로 모이는 속도선 ----------
  function pierceBundle(from, to, o, onHit) {
    const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.25 : 1;
    const hx = from.x + Math.cos(a) * 18, hy = from.y + Math.sin(a) * 18;
    flash(hx, hy, E, 0.55);
    // 뒤로 움츠렸다가 뻗는 예고
    p('glow', hx, hy, { s: [40, 90], c: [E.hi, E.main], life: 0.12, pop: true });
    add({ life: 0.22, delay: 0.05, draw(k) {
      const g = outExpo(Math.min(1, k / 0.55)), al = k > 0.65 ? (1 - k) / 0.35 : 1;
      const ex = hx + (to.x - hx) * g, ey = hy + (to.y - hy) * g;
      for (const off of [-14, -7, 0, 7, 14]) {
        const ox = Math.cos(a + 1.57) * off * sc * (1 - g * 0.7), oy = Math.sin(a + 1.57) * off * sc * (1 - g * 0.7);
        const w = (off === 0 ? 7 : 3.2) * sc * (1 - k * 0.3);
        G.seg(hx + ox, hy + oy, ex, ey, w * 2.2, w * 0.8, rgb(E.lo), 0.4 * al, true);
        G.seg(hx + ox, hy + oy, ex, ey, w, w * 0.4, off === 0 ? WHITE : rgb(E.hi), al, true);
      }
      // 끝점 사점 별
      if (g > 0.85) {
        const L = 28 * sc;
        for (const [dx, dy, len] of [[1, 0, L], [-1, 0, L * 0.65], [0, -1, L * 0.4], [0, 1, L * 0.4]]) {
          G.seg(ex, ey, ex + dx * len, ey + dy * len, 3.5, 1, WHITE, al, true);
        }
        G.spr('ring', ex, ey, 36 * sc, 70 * sc, 0, rgb(E.hi), 0.7 * al, true);
        G.spr('core', ex, ey, 14, 14, 0, WHITE, al, true);
      }
    } });
    at(0.14, () => { sparks(to.x, to.y, E, 14, sc, { ang: a + Math.PI, spread: 0.9 }); shock(to.x, to.y, E, 50 * sc); if (onHit) onHit(); });
  }

  // ---------- 내려찍: 머리 위 예광 → 가속 낙하 → 바닥 균열 ----------
  function heavySlam(from, to, o, onHit) {
    const E = el(o.pal || o.el), sc = o.big ? 1.3 : 1, by = to.y + (to.h || 60) * 0.4;
    const top = { x: to.x - 8, y: to.y - 210 };
    // 머리 위 검광
    p('star4', top.x, top.y, { s: [30, 120 * sc], c: [E.hi, E.main], life: 0.22, pop: true });
    p('glow', top.x, top.y, { s: [50, 140], c: [E.main, E.lo], life: 0.28, a: 0.6 });
    add({ life: 0.28, delay: 0.18, draw(k) {
      const g = inQuad(Math.min(1, k / 0.7));
      const x = top.x + (to.x - top.x) * g, y = top.y + (by - top.y) * g;
      const a = Math.atan2(by - top.y, to.x - top.x);
      const al = k > 0.75 ? (1 - k) / 0.25 : 1;
      // 두꺼운 검신 궤적
      G.seg(top.x, top.y, x, y, 26 * sc, 12 * sc, rgb(E.lo), 0.55 * al, true);
      G.seg(top.x, top.y, x, y, 14 * sc, 6 * sc, rgb(E.main), 0.9 * al, true);
      G.seg(top.x, top.y, x, y, 5 * sc, 2 * sc, WHITE, al, true);
      // 칼끝 절삭면 (스프라이트 검 대신)
      G.spr('glow', x, y, 80 * sc, 80 * sc, 0, rgb(E.hi), 0.6 * al, true);
      G.spr('core', x, y, 18 * sc, 18 * sc, 0, WHITE, al, true);
      G.seg(x - Math.cos(a) * 10, y - Math.sin(a) * 10, x + Math.cos(a) * 36, y + Math.sin(a) * 36, 8 * sc, 2 * sc, WHITE, al, true);
    } });
    at(0.36, () => {
      flash(to.x, by, E, 1.4 * sc);
      p('crack', to.x, by, { s: [70, 220 * sc], asp: 0.42, c: [E.hi, E.main], life: 0.85, pop: true, fout: 0.5 });
      shock(to.x, by, E, 140 * sc, 0.28);
      shock(to.x, by, E, 100 * sc, 0.28, 0.06);
      burst('shard', to.x, by, 16, { ang: -Math.PI / 2, spread: 1.3, v: [220, 620], sz: [16, 30, 6], asp: 0.4, c: ['#c4b49a', '#5a4e3e'], add: false, life: [0.45, 0.85], ay: 900, rrot: true, rvr: 12 });
      smoke(to.x, by, 8, 1.2 * sc, ['#5c5248', '#17130f'], { v: [50, 180], ay: -40 });
      rays(to.x, by, E, 8, 110 * sc);
      if (onHit) onHit();
    });
  }

  // ---------- 주먹 임팩트: 속도선 돌진 → 충격 원반 (주먹 스프라이트 없음) ----------
  function punchHit(from, to, o, onHit) {
    const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.3 : 1;
    const dur = Math.max(0.07, dist(from, to) / 1700);
    // 예고: 어깨 쪽에서 압축되는 힘
    p('glow', from.x, from.y, { s: [50 * sc, 110 * sc], c: [E.hi, E.main], life: 0.1, pop: true });
    burst('spark', from.x, from.y, 8, { ang: a, spread: 0.7, v: [80, 220], sz: [10, 18, 2], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.1, 0.18] });
    add({ life: dur + 0.12, draw(k) {
      const life = dur + 0.12, t = k * life;
      const g = outExpo(Math.min(1, t / dur));
      const x = from.x + (to.x - from.x) * g, y = from.y + (to.y - from.y) * g;
      const al = t > dur ? Math.max(0, 1 - (t - dur) / 0.12) : 1;
      // 돌진 코어 + 다중 속도선
      for (let i = 0; i < 5; i++) {
        const off = (i - 2) * 7 * sc, ox = Math.cos(a + 1.57) * off, oy = Math.sin(a + 1.57) * off;
        const back = 40 + i * 18;
        G.seg(x - Math.cos(a) * back + ox, y - Math.sin(a) * back + oy, x + ox, y + oy, (i === 2 ? 14 : 5) * sc, 1.5 * sc, i === 2 ? WHITE : rgb(E.hi), (i === 2 ? 1 : 0.55) * al, true);
      }
      G.spr('core', x, y, 22 * sc, 22 * sc, 0, WHITE, al, true);
      G.spr('glow', x, y, 70 * sc, 70 * sc, 0, rgb(E.main), 0.55 * al, true);
      G.spr('ring', x, y, 36 * sc * (0.6 + g * 0.5), 50 * sc, a, rgb(E.hi), 0.7 * al, true);
    } });
    at(dur, () => {
      const x = to.x, y = to.y;
      // 만화식 타격: 흰 원반 + 방사선 + 파편
      p('ring', x, y, { s: [40 * sc, 160 * sc], c: ['#ffffff', E.hi], life: 0.22, pop: true });
      p('ring', x, y, { s: [70 * sc, 220 * sc], c: [E.main, E.lo], a: 0.7, life: 0.32, pop: true, delay: 0.03 });
      p('star4', x, y, { s: [70 * sc, 260 * sc], c: ['#ffffff', E.main], life: 0.2, pop: true, rot: R(0, 1) });
      rays(x, y, E, 16, 170 * sc, { asp: 0.2, life: 0.28 });
      shock(x, y, E, 95 * sc);
      burst('spark', x, y, 20, { v: [300, 780], sz: [14, 28, 2], asp: 0.28, face: true, c: ['#ffffff', E.hi], life: [0.18, 0.4], drag: 0.9 });
      burst('shard', x, y, 8, { v: [180, 420], sz: [16, 28, 4], asp: 0.4, c: [E.hi, E.main], life: [0.25, 0.45], rrot: true });
      if (onHit) onHit(x, y);
    });
  }

  // ---------- 단검 연살: 점멸 후 얇은 절삭이 연달아 ----------
  function daggerFlurry(from, to, o, onHit) {
    const E = el(o.pal || o.el), a = dirOf(from, to), n = o.type === 'multi' ? 7 : (o.type === 'crit' || o.big) ? 5 : 3;
    // 시전자 점멸
    p('glow', from.x, from.y, { s: [80, 20], c: [E.hi], life: 0.1, pop: true });
    at(0.04, () => p('glow', to.x - Math.cos(a) * 40, to.y - Math.sin(a) * 40, { s: [70, 30], c: [E.main], life: 0.12, pop: true }));
    for (let i = 0; i < n; i++) {
      const ang = a + (i % 2 ? 1 : -1) * (0.55 + i * 0.12), delay = 0.06 + i * 0.04;
      at(delay, () => {
        cut(to.x + R(-8, 8), to.y + R(-8, 8), ang, R(130, 180) * (o.big ? 1.2 : 1), E, 0, 0.85);
        // 짧은 칼끝 점
        p('core', to.x + Math.cos(ang) * 20, to.y + Math.sin(ang) * 20, { s: [10, 28], c: ['#ffffff', E.hi], life: 0.08, pop: true });
      });
    }
    at(0.06 + n * 0.04, () => {
      if (o.type === 'crit' || o.big) { p('star4', to.x, to.y, { s: [50, 220], c: ['#ffffff', E.main], life: 0.28, pop: true, rot: Math.PI / 4 }); flash(to.x, to.y, E, 0.8); }
      if (onHit) onHit();
    });
  }

  // ---------- 속성 마법구: 컨셉별 몸통 ----------
  function magicOrb(from, to, o, onHit) {
    const e = o.pal || o.el, E = el(e), sc = o.big ? 1.3 : 1, n = o.type === 'multi' ? 3 : 1;
    if (e === 'bolt' && !o.pal) {
      flash(from.x, from.y, E, 0.6);
      // 차지 → 낙뢰
      burst('glow', from.x, from.y, 16, { v: [-180, -60], sz: [8, 14, 2], c: ['#ffffff', E.main], life: [0.15, 0.25], jx: 40, jy: 40 });
      for (let i = 0; i < n; i++) at(0.12 + i * 0.1, () => {
        G.bolt(from.x, from.y - 20, to.x + R(-8, 8), to.y, E, { w: 6 * sc, life: 0.28, branch: 4 });
        if (i === n - 1) { flash(to.x, to.y, E, 1.1); if (onHit) onHit(); } else FXF.accent('bolt', to.x, to.y, 0.55);
      });
      return;
    }
    // 시전 원
    p('ring', from.x, from.y, { s: [100, 28], c: [E.hi, E.main], life: 0.24, pop: true });
    p('rune', from.x, from.y, { s: [40, 110], c: [E.hi, E.main], a: 0.5, life: 0.3, vr: 4, pop: true });
    const body = (x, y, ang, k) => {
      const t = k * 28;
      if (e === 'fire') {
        G.spr('core', x, y, 48 * sc, 48 * sc, 0, WHITE, 1, true);
        for (let i = 0; i < 4; i++) G.spr('flame', x - Math.cos(ang) * (8 + i * 6), y - Math.sin(ang) * (8 + i * 6), (70 - i * 8) * sc, (90 - i * 10) * sc, ang - Math.PI / 2 + Math.sin(t + i) * 0.4, rgb(i ? E.main : E.hi), 0.85, true);
      } else if (e === 'water' || e === 'blood') {
        G.spr('core', x, y, 44 * sc, 44 * sc, 0, rgb(E.main), 0.95, false);
        G.spr('bubble', x, y, 58 * sc, 58 * sc, t * 0.08, rgb(E.hi), 1, true);
        for (let i = 0; i < 3; i++) G.spr('drop', x - Math.cos(ang) * (12 + i * 10), y - Math.sin(ang) * (12 + i * 10), 50 * sc, 28 * sc, ang, rgb(E.hi), 0.7, true);
      } else if (e === 'wood' || e === 'poison') {
        G.spr('core', x, y, 36 * sc, 36 * sc, 0, rgb(E.main), 1, true);
        for (let i = 0; i < 5; i++) G.spr(e === 'wood' ? 'leaf' : 'bubble', x + Math.cos(t * 0.4 + i * 1.25) * 20 * sc, y + Math.sin(t * 0.4 + i * 1.25) * 20 * sc, 28 * sc, 16 * sc, t + i, rgb(E.hi), 1, e !== 'wood');
      } else if (e === 'holy') {
        G.spr('star4', x, y, 120 * sc, 120 * sc, t * 0.12, rgb(E.hi), 1, true);
        G.spr('core', x, y, 28 * sc, 28 * sc, 0, WHITE, 1, true);
        G.spr('spark', x - Math.cos(ang) * 28, y - Math.sin(ang) * 28, 160 * sc, 28 * sc, ang, rgb(E.main), 0.9, true);
      } else if (e === 'dark') {
        G.spr('core', x, y, 46 * sc, 46 * sc, 0, rgb('#05010b'), 0.98, false);
        G.spr('ring', x, y, 70 * sc, 70 * sc, t * 0.35, rgb(E.main), 1, true);
        for (let i = 0; i < 4; i++) G.spr('shard', x + Math.cos(-t * 0.5 + i * 1.57) * 28 * sc, y + Math.sin(-t * 0.5 + i * 1.57) * 28 * sc, 24 * sc, 10 * sc, -t * 0.5 + i * 1.57, rgb(E.hi), 1, true);
      } else if (e === 'ice') {
        G.spr('shard', x, y, 100 * sc, 36 * sc, ang, rgb(E.main), 1, true);
        G.spr('shard', x, y, 80 * sc, 18 * sc, ang, WHITE, 1, true);
        G.spr('glow', x, y, 50 * sc, 50 * sc, 0, rgb(E.hi), 0.6, true);
      } else {
        G.spr('core', x, y, 40 * sc, 40 * sc, 0, WHITE, 1, true);
        G.spr('ring', x, y, 60 * sc, 60 * sc, t * 0.25, rgb(E.main), 0.95, true);
        G.spr('star4', x, y, 80 * sc, 80 * sc, -t * 0.2, rgb(E.hi), 0.75, true);
      }
    };
    for (let i = 0; i < n; i++) {
      fly({
        from, to: { x: to.x + (n > 1 ? R(-16, 16) : 0), y: to.y + (n > 1 ? R(-16, 16) : 0) },
        speed: e === 'dark' ? 620 : e === 'holy' ? 1300 : 880,
        arc: e === 'water' || e === 'wood' || e === 'poison' ? 40 : 0,
        side: n > 1 ? (i - 1) * 42 : 0, delay: 0.08 + i * 0.1, el: o.el, pal: o.pal, body, gs: 120 * sc, rw: 24 * sc, rlen: 16, sc: 1.25,
        hit: (x, y) => { if (i === n - 1) { if (onHit) onHit(); } else FXF.accent(e, x, y, 0.6); },
      });
    }
  }

  // ---------- FORM 교체 ----------
  const FORM = {
    slash(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.25 : 1;
      if (o.type === 'pierce') {
        // 발도: 검은 선 → 정지 → 절삭이 한꺼번에
        const sx = from.x - Math.cos(a) * 20, sy = from.y - Math.sin(a) * 20;
        const ex = to.x + Math.cos(a) * 180, ey = to.y + Math.sin(a) * 180;
        p('spark', (sx + ex) / 2, (sy + ey) / 2, { rot: a, s: [dist({ x: sx, y: sy }, { x: ex, y: ey }), dist({ x: sx, y: sy }, { x: ex, y: ey }) * 1.05], asp: 0.035, c: ['#ffffff', E.hi], life: 0.18, pop: true, fout: 0.4 });
        flash(from.x, from.y, E, 0.4);
        at(0.2, () => {
          for (let i = 0; i < 3; i++) cut(to.x + R(-8, 8), to.y + R(-8, 8), a + 1.57 + (i - 1) * 0.7, 200 * sc, E, i * 0.02, 1.3);
          flash(to.x, to.y, E, 1.2); hitAt(o, to.x, to.y, 1.15);
        });
        return;
      }
      const arcs = o.type === 'multi'
        ? [[0, 0.75, 0.9], [0.08, -0.7, 0.9], [0.16, 0.15, 1.05]]
        : (o.type === 'crit' || o.big) ? [[0, 0.85, 1.2], [0.05, -0.8, 1.15]] : [[0, 0.55 + R(-0.15, 0.15), 1]];
      flash(from.x + Math.cos(a) * 16, from.y + Math.sin(a) * 16, E, 0.4);
      arcs.forEach(([dl, tilt, sz], i) => bladeArc(from, to, o, {
        size: 155 * sz * sc, tilt, delay: dl, sweep: 0.085, trail: 0.24,
        onHit: () => {
          cut(to.x, to.y, a + tilt + 1.57, 200 * sz * sc, E, 0, 1.15);
          if (i === arcs.length - 1) hitAt(o, to.x, to.y, arcs.length > 1 ? 1.15 : 1);
          else FXF.accent(o.pal || o.el, to.x, to.y, 0.55);
        },
      }));
    },

    cleave(from, to, o) {
      heavySlam(from, to, o, () => hitAt(o, to.x, to.y, 1.25));
    },

    thrust(from, to, o) {
      const n = o.type === 'multi' ? 4 : 1, a = dirOf(from, to);
      if (o.type === 'pierce' || n === 1) {
        pierceBundle(from, to, o, () => {
          const L = o.type === 'pierce' ? 280 : 140;
          p('ray', to.x + Math.cos(a) * L * 0.2, to.y + Math.sin(a) * L * 0.2, { rot: a, s: [L * 0.45, L], asp: 0.28, c: [el(o.pal || o.el).hi, el(o.pal || o.el).main], life: 0.28, vx: Math.cos(a) * L * 1.8, vy: Math.sin(a) * L * 1.8, drag: 0.86 });
          hitAt(o, to.x, to.y, o.type === 'pierce' ? 1.2 : 1.05);
        });
        return;
      }
      for (let i = 0; i < n; i++) {
        const tt = { x: to.x + R(-20, 20), y: to.y + R(-18, 18) };
        at(i * 0.07, () => pierceBundle(from, tt, o, i === n - 1 ? () => hitAt(o, to.x, to.y, 1.1) : () => FXF.accent(o.pal || o.el, tt.x, tt.y, 0.5)));
      }
    },

    fist(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), sc = o.big ? 1.3 : 1;
      if (o.type === 'multi') {
        for (let i = 0; i < 6; i++) {
          const tt = { x: to.x + R(-28, 28), y: to.y + R(-24, 24) };
          at(i * 0.06, () => punchHit({ x: tt.x - Math.cos(a) * 70, y: tt.y - Math.sin(a) * 70 }, tt, o, i === 5 ? () => hitAt(o, to.x, to.y, 1.15) : null));
        }
        return;
      }
      if (o.type === 'pierce') {
        // 장풍: 농축 파동이 직선으로 관통
        flash(from.x, from.y, E, 0.7);
        const ex = { x: to.x + Math.cos(a) * 160, y: to.y + Math.sin(a) * 160 };
        add({ life: 0.42, draw(k) {
          const g = outExpo(Math.min(1, k / 0.55)), al = k > 0.6 ? (1 - k) / 0.4 : 1;
          const x = from.x + (ex.x - from.x) * g, y = from.y + (ex.y - from.y) * g;
          const s = (70 + g * 90) * sc;
          G.spr('glow', x, y, s * 1.6, s * 1.1, 0, rgb(E.lo), 0.45 * al, true);
          G.spr('ring', x, y, s, s * 0.72, a, rgb(E.main), 0.85 * al, true);
          G.spr('ring', x, y, s * 0.7, s * 0.5, a, rgb(E.hi), 0.9 * al, true);
          G.spr('core', x, y, 28 * sc, 28 * sc, 0, WHITE, al, true);
          G.seg(from.x, from.y, x, y, 18 * sc, 6 * sc, rgb(E.main), 0.5 * al, true);
          G.seg(from.x, from.y, x, y, 7 * sc, 2 * sc, WHITE, 0.85 * al, true);
        } });
        at(0.22, () => { rays(to.x, to.y, E, 12, 150); shock(to.x, to.y, E, 95); hitAt(o, to.x, to.y, 1.2); });
        return;
      }
      const start = o.type === 'stun' ? { x: to.x, y: to.y - 210 } : from;
      punchHit(start, to, o, (x, y) => {
        if (o.type === 'stun') { shock(x, y + 24, E, 120, 0.3); if (FXF.stars) FXF.stars(to); }
        hitAt(o, to.x, to.y, 1.15);
      });
    },

    stab(from, to, o) {
      daggerFlurry(from, to, o, () => hitAt(o, to.x, to.y, 0.9));
    },

    arrow(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' ? 3 : 1, a = dirOf(from, to), sc = o.big ? 1.25 : 1;
      // 시위 당김
      p('ring', from.x, from.y, { s: [55, 18], c: [E.hi, E.main], life: 0.12 });
      for (let i = 0; i < n; i++) {
        const tt = { x: to.x + (n > 1 ? R(-14, 14) : 0), y: to.y + (n > 1 ? R(-14, 14) : 0) };
        const pierce = o.type === 'pierce', end = pierce ? { x: tt.x + Math.cos(a) * 180, y: tt.y + Math.sin(a) * 180 } : tt;
        fly({
          from, to: end, speed: 1550, arc: pierce ? 0 : 12 + i * 6, delay: i * 0.08, el: o.el, pal: o.pal,
          hero: 'arrow', hs: 110 * sc, rw: 8, rlen: 16, gs: 44, sc: 0.85,
          hit: (x, y, ang) => {
            if (!pierce) {
              p(G.hero('arrow', o.pal || o.el), tt.x - Math.cos(ang) * 16, tt.y - Math.sin(ang) * 16, { s: [110 * sc, 110 * sc], rot: ang, c: ['#ffffff'], add: false, life: 0.5, fout: 0.55, wob: 2, wf: 50 });
              sparks(tt.x, tt.y, E, 8, 0.7, { ang: ang + Math.PI, spread: 1 });
            }
            if (i === n - 1 && !pierce) hitAt(o, to.x, to.y, 0.95);
          },
        });
        if (pierce) at(i * 0.08 + dist(from, to) / 1550, () => { cut(to.x, to.y, a, 300, E, 0, 0.85); p('ring', to.x, to.y, { s: [50, 90], c: [E.hi], life: 0.25, pop: true }); if (i === n - 1) hitAt(o, to.x, to.y, 1); });
      }
    },

    bullet(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to), n = o.type === 'multi' ? 7 : 1;
      const snipe = o.type === 'crit' || o.type === 'pierce' || o.big;
      const mz = { x: from.x + Math.cos(a) * 24, y: from.y + Math.sin(a) * 24 };
      const muzzle = (s) => {
        p('star4', mz.x, mz.y, { s: [80 * s, 140 * s], c: ['#fff6d0', '#ffc24a'], life: 0.08, rot: a });
        burst('spark', mz.x, mz.y, 6, { ang: a, spread: 0.45, v: [220, 520], sz: [12, 22, 2], asp: 0.28, face: true, c: ['#fff6d0', '#ff8a2a'], life: [0.1, 0.2] });
        smoke(mz.x, mz.y, 1, 0.45, ['#6a7080', '#22252e'], { a: 0.28 });
      };
      if (snipe) {
        add({ life: 0.32, draw(k) {
          const r = 160 - 110 * outExpo(Math.min(1, k / 0.7)), al = k < 0.8 ? 1 : (1 - k) / 0.2, c = rgb('#ff4a4a');
          G.spr('ring', to.x, to.y, r, r, k * 4, c, al, true);
          for (let i = 0; i < 4; i++) { const q = i * Math.PI / 2 + k * 4; G.spr('spark', to.x + Math.cos(q) * r * 0.4, to.y + Math.sin(q) * r * 0.4, 36, 8, q, c, al, true); }
          G.spr('core', to.x, to.y, 8, 8, 0, c, al, true);
        } });
        at(0.28, () => {
          muzzle(1.7);
          const ex = to.x + Math.cos(a) * (o.type === 'pierce' ? 200 : 0), ey = to.y + Math.sin(a) * (o.type === 'pierce' ? 200 : 0);
          const L = dist(mz, { x: ex, y: ey });
          p('spark', (mz.x + ex) / 2, (mz.y + ey) / 2, { rot: a, s: [L, L], asp: 0.04, c: ['#ffffff', E.hi], life: 0.2, fout: 0.2 });
          p('spark', (mz.x + ex) / 2, (mz.y + ey) / 2, { rot: a, s: [L, L], asp: 0.14, c: [E.main, E.lo], a: 0.65, life: 0.28 });
          rays(to.x, to.y, E, 10, 120); hitAt(o, to.x, to.y, 1.2);
        });
        return;
      }
      for (let i = 0; i < n; i++) {
        at(i * 0.05, () => muzzle(1));
        fly({
          from: mz, to: { x: to.x + (n > 1 ? R(-22, 22) : 0), y: to.y + (n > 1 ? R(-22, 22) : 0) },
          speed: 3400, delay: i * 0.05, el: o.el, pal: o.pal, noTrail: true, ribbon: false, glow: false,
          body: (x, y, ang) => {
            G.spr('spark', x - Math.cos(ang) * 32, y - Math.sin(ang) * 32, 120, 18, ang, rgb(E.main), 0.95, true);
            G.spr('spark', x - Math.cos(ang) * 24, y - Math.sin(ang) * 24, 90, 8, ang, WHITE, 1, true);
          },
          hit: (x, y) => { sparks(x, y, E, 8, 0.75, { ang: a + Math.PI, spread: 1.1 }); p('core', x, y, { s: [14, 36], c: ['#ffffff', E.main], life: 0.1 }); },
        });
      }
      at((n - 1) * 0.05 + dist(mz, to) / 3400, () => hitAt(o, to.x, to.y, 0.9));
    },

    bomb(from, to, o) {
      const pal = o.pal || (o.el === 'none' ? 'fire' : o.el), E = el(pal), sc = o.big ? 1.3 : 1;
      fly({
        from, to, dur: 0.42, arc: 95, spin: 1.8, el: o.el, pal, hero: o.flask ? 'flask' : 'bomb', hs: 80, ribbon: false, gs: 32, noTrail: true,
        body: (x, y) => { if (!o.flask && Math.random() < 0.85) p('spark', x + 8, y - 10, { vx: R(-50, 50), vy: R(-100, -20), s: [12, 2], asp: 0.3, face: true, c: ['#fff6d0', '#ffb347'], life: 0.22 }); },
        hit: (x, y) => {
          flash(x, y, E, 1.6 * sc);
          // 만화식 폭발 별
          p('star4', x, y, { s: [80 * sc, 280 * sc], c: ['#ffffff', E.hi], life: 0.2, pop: true });
          p('star4', x, y, { s: [50 * sc, 180 * sc], rot: Math.PI / 4, c: [E.hi, E.main], life: 0.28, pop: true });
          shock(x, y, E, 120 * sc); shock(x, y + 12, E, 150 * sc, 0.3, 0.05);
          if (o.flask) burst('shard', x, y, 14, { v: [220, 520], sz: [12, 22, 4], asp: 0.4, c: ['#ffffff', '#bfe9ff'], life: [0.3, 0.6], ay: 700, rrot: true, rvr: 14 });
          else {
            burst('flame', x, y, 20, { v: [140, 420 * sc], sz: [48 * sc, 84 * sc, 8], asp: 1.4, c: [E.main, E.lo], a: 0.85, life: [0.3, 0.65], drag: 0.88, rrot: true });
            smoke(x, y, 10, 1.5 * sc, ['#3b3d47', '#0b0c10'], { v: [50, 180], delay: 0.06, a: 0.7 });
            burst('spark', x, y, 26, { v: [280, 820], sz: [14, 26, 2], asp: 0.28, face: true, c: ['#fff6d0', '#ff8a2a'], life: [0.35, 0.85], ay: 650, drag: 0.95 });
          }
          hitAt({ ...o, pal }, x, y, 1.25 * sc);
        },
      });
    },

    shield(from, to, o) {
      const E = el(o.pal || o.el), a = dirOf(from, to);
      fly({
        from, to: { x: to.x - Math.cos(a) * 24, y: to.y - Math.sin(a) * 24 }, dur: 0.16, ease: true, el: o.el, pal: o.pal,
        noTrail: true, rw: 70, rlen: 5, ra: 0.5, gs: 120,
        body: (x, y, ang, k) => { const s = 120 + k * 50; G.spr(G.hero('shield', o.pal || o.el), x, y, s, s, 0, WHITE, 1, false); },
        hit: () => {
          for (let i = 0; i < 7; i++) {
            const ang = i * TAU / 7;
            p('hex', to.x + Math.cos(ang) * 28, to.y + Math.sin(ang) * 28, { s: [40, 100], c: [E.hi, E.main], life: 0.35, delay: i * 0.02, pop: true, rot: Math.PI / 6 });
          }
          p('hex', to.x, to.y, { s: [80, 220], c: [E.hi, E.main], life: 0.35, pop: true });
          rays(to.x, to.y, E, 12, 160); shock(to.x, to.y, E, 100);
          hitAt(o, to.x, to.y, 1.1);
        },
      });
    },

    orb(from, to, o) { magicOrb(from, to, o, () => hitAt(o, to.x, to.y, 1.2)); },

    beam(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to);
      const ex = o.type === 'pierce' ? to.x + Math.cos(a) * 200 : to.x, ey = o.type === 'pierce' ? to.y + Math.sin(a) * 200 : to.y;
      const w = o.big ? 24 : 16;
      // 차지: 입자가 시전자로
      burst('glow', from.x, from.y, 18, { v: [-220, -80], sz: [8, 14, 2], c: [E.hi, E.main], life: [0.14, 0.22], jx: 50, jy: 50 });
      p('star4', from.x, from.y, { s: [50, 170], c: [E.hi, E.main], life: 0.22, pop: true });
      p('ring', from.x, from.y, { s: [120, 40], c: [E.hi], life: 0.2, pop: true });
      at(0.14, () => {
        G.beam(from.x, from.y, ex, ey, E, { w, life: 0.55, add: e !== 'dark' });
        for (let i = 0; i < N(16); i++) {
          const kk = Math.random();
          p('spark', from.x + (ex - from.x) * kk, from.y + (ey - from.y) * kk, { vx: Math.cos(a) * R(320, 720), vy: Math.sin(a) * R(320, 720), s: [24, 4], asp: 0.22, face: true, c: [E.hi, E.main], life: R(0.15, 0.32), delay: R(0, 0.28) });
        }
        hitAt(o, to.x, to.y, 1.15);
        for (let i = 0; i < 5; i++) at(0.06 + i * 0.06, () => { sparks(to.x, to.y, E, 6, 0.75); p('glow', to.x, to.y, { s: [90, 140], c: [E.hi, E.main], a: 0.55, life: 0.14 }); });
      });
    },

    smite(from, to, o) {
      const e = o.pal || o.el, E = el(e), w = o.big ? 78 : 56, by = to.y + (to.h || 60) * 0.42, top = to.y - 540;
      // 하늘이 열림
      p('glow', to.x, top + 80, { s: [220, 120], asp: 0.5, c: [E.hi, E.main], a: 0.5, life: 0.35, pop: true });
      p('ring', to.x, by, { s: [130, 45], asp: 0.3, c: [E.hi, E.main], life: 0.25, pop: true });
      at(0.12, () => {
        add({ life: 0.6, draw(k) {
          const g = Math.min(1, k / 0.1), al = k > 0.45 ? 1 - (k - 0.45) / 0.55 : 1;
          const ww = w * (k > 0.45 ? 1 - (k - 0.45) * 0.75 : 1), y2 = top + (by - top) * g;
          G.seg(to.x, top, to.x, y2, ww * 3, ww * 3.4, rgb(E.lo), 0.3 * al, e !== 'dark');
          G.seg(to.x, top, to.x, y2, ww * 1.6, ww * 1.8, rgb(E.main), 0.6 * al, true);
          G.seg(to.x, top, to.x, y2, ww * 0.55, ww * 0.65, rgb(E.hi), 0.85 * al, true);
          G.spr('glow', to.x, y2, ww * 5, ww * 2.5, 0, rgb(E.hi), 0.6 * al, true);
          G.spr('star4', to.x, y2, 80, 160, 0, WHITE, 0.7 * al, true);
        } });
        at(0.08, () => {
          shock(to.x, by, E, 140, 0.3); shock(to.x, by, E, 95, 0.3, 0.07);
          burst('glow', to.x, by, 28, { ang: -Math.PI / 2, spread: 0.35, v: [160, 560], sz: [7, 14, 2], c: [E.hi, E.main], life: [0.4, 0.95], jx: w * 0.7 });
          hitAt(o, to.x, to.y, 1.3);
        });
      });
    },

    talisman(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' ? 4 : 1;
      for (let i = 0; i < n; i++) {
        const tt = { x: to.x + (n > 1 ? (i - 1.5) * 22 : 0), y: to.y + (n > 1 ? R(-12, 12) : 0) };
        fly({
          from, to: tt, speed: 1050, side: (i % 2 ? 1 : -1) * (34 + i * 14), spin: 2.2, delay: i * 0.08,
          el: o.el, pal: o.pal, hero: 'talisman', hs: 84, rw: 12, rlen: 14, gs: 48, sc: 0.75,
          hit: (x, y) => {
            p(G.hero('talisman', e), x, y, { s: [84, 120], c: ['#ffffff'], add: false, life: 0.45, fout: 0.3 });
            if (i === n - 1) {
              p('bagua', to.x, to.y, { s: [70, 240], c: [E.hi, E.main], life: 0.75, vr: 3.5, pop: true, fout: 0.55 });
              p('bagua', to.x, to.y, { s: [70, 180], c: [E.main, E.lo], a: 0.55, life: 0.75, vr: -2.5, pop: true, fout: 0.55 });
              flash(to.x, to.y, E, 0.9);
              at(0.14, () => hitAt(o, to.x, to.y, 1.1));
            }
          },
        });
      }
    },

    curse(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'dark' : o.el), E = el(e);
      p('rune', to.x, to.y, { s: [90, 230], c: [E.hi, E.main], life: 0.95, vr: 2.8, pop: true, fin: 0.1, fout: 0.55 });
      p('rune', to.x, to.y, { s: [90, 270], c: [E.main, E.lo], a: 0.45, life: 0.95, vr: -1.6, pop: true, fout: 0.55 });
      p('eye', to.x, to.y - (to.h || 60) * 0.78, { s: [36, 100], asp: 0.55, c: [E.hi, E.main], life: 0.85, pop: true, fin: 0.2, fout: 0.65 });
      for (let i = 0; i < 5; i++) {
        const a = i * TAU / 5 + 0.4;
        for (let j = 0; j < 5; j++) p('chain', to.x + Math.cos(a) * (160 - j * 30), to.y + Math.sin(a) * (160 - j * 30), { rot: a, s: [36, 36], asp: 0.5, c: [E.hi, E.main], life: 0.55, delay: 0.1 + j * 0.028, vx: -Math.cos(a) * 260, vy: -Math.sin(a) * 260, drag: 0.85, fout: 0.55 });
      }
      smoke(to.x, to.y + 20, 8, 1.1, [E.lo, E.deep], { a: 0.65, delay: 0.08 });
      at(0.4, () => hitAt({ ...o, pal: e }, to.x, to.y, 1));
    },

    psychic(from, to, o) {
      const E = o.pal ? el(o.pal) : (o.el === 'none' ? { hi: '#f6e3ff', main: '#c77dff', lo: '#6a2bd9', deep: '#1a0633' } : el(o.el));
      for (let i = 0; i < 6; i++) p('wave', to.x, to.y, { s: [250 - i * 14, 30], c: [i % 2 ? E.hi : E.main, E.lo], life: 0.38, delay: i * 0.05, fin: 0.3, fout: 0.8, vr: i % 2 ? 3.5 : -3.5 });
      burst('shard', to.x, to.y, 14, { v: [-280, -120], sz: [18, 28, 4], asp: 0.4, c: [E.hi, E.main], life: [0.28, 0.42], jx: 100, jy: 100, rrot: true, drag: 1 });
      p('eye', from.x, from.y - (from.h || 60) * 0.55, { s: [24, 80], asp: 0.55, c: [E.hi, E.main], life: 0.5, pop: true, fout: 0.55 });
      at(0.38, () => { flash(to.x, to.y, E, 1.15); shock(to.x, to.y, E, 110); burst('shard', to.x, to.y, 18, { v: [260, 680], sz: [18, 32, 4], asp: 0.35, face: true, c: [E.hi, E.main], life: [0.25, 0.5], drag: 0.88 }); hitAt(o, to.x, to.y, 0.9); });
    },

    claw(from, to, o) {
      const E = el(o.pal || o.el), sc = o.big ? 1.3 : 1, two = o.type === 'multi' || o.type === 'crit' || o.big;
      const rake = (ang, delay) => {
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * 24 * sc;
          at(delay + i * 0.025, () => {
            cut(to.x + Math.cos(ang + 1.57) * off, to.y + Math.sin(ang + 1.57) * off, ang, (i === 1 ? 210 : 170) * sc, E, 0, 1.6);
            p('spark', to.x + Math.cos(ang) * 40, to.y + Math.sin(ang) * 40, { rot: ang, s: [80, 140], asp: 0.2, c: [E.hi, E.main], life: 0.14, pop: true });
          });
        }
      };
      rake(-0.9, 0); if (two) rake(-2.15, 0.12);
      at(two ? 0.22 : 0.1, () => {
        burst('drop', to.x, to.y, 10, { v: [160, 400], sz: [10, 18, 4], asp: 0.5, face: true, c: ['#ffd0d0', '#d81e33'], add: false, life: [0.3, 0.55], ay: 720 });
        hitAt(o, to.x, to.y, 0.95);
      });
    },

    bite(from, to, o) {
      const E = el(o.pal || o.el), sc = o.big ? 1.3 : 1;
      for (const d of [-1, 1]) for (let i = 0; i < 5; i++) {
        const h = (i === 0 || i === 4 ? 48 : i === 2 ? 62 : 72) * sc;
        p('fang', to.x + (i - 2) * 24 * sc, to.y + d * 90 * sc, { rot: d < 0 ? 0 : Math.PI, s: [h, h], asp: 1, c: ['#fffdf2', E.hi], add: false, life: 0.4, vy: -d * 680 * sc, drag: 0.7, fout: 0.6 });
      }
      at(0.12, () => {
        flash(to.x, to.y, E, 0.9); shock(to.x, to.y, E, 80, 0.45);
        burst('drop', to.x, to.y, 12, { v: [180, 440], sz: [10, 18, 4], asp: 0.5, face: true, c: ['#ffd0d0', '#d81e33'], add: false, life: [0.3, 0.55], ay: 720 });
        hitAt(o, to.x, to.y, 1);
      });
    },

    spirit(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' ? 4 : 1;
      p('rune', from.x, from.y + (from.h || 60) * 0.4, { s: [55, 160], asp: 0.36, c: [E.hi, E.main], life: 0.5, pop: true, fout: 0.5 });
      for (let i = 0; i < n; i++) {
        fly({
          from, to, dur: 0.4, side: (i % 2 ? 1 : -1) * (70 + i * 18) * (n > 1 ? 1 : R(-1, 1)), delay: 0.06 + i * 0.09, ease: true,
          el: o.el, pal: o.pal, hero: 'wisp', hs: 104 * (o.big ? 1.3 : 1), rw: 28, rlen: 20, gs: 100,
          hit: (x, y) => { p(G.hero('wisp', e), x, y, { s: [104, 160], rot: -Math.PI / 2, vy: -130, c: ['#ffffff'], add: false, a: 0.65, life: 0.4, fout: 0.2 }); if (i === n - 1) hitAt(o, to.x, to.y, 1.1); else FXF.accent(e, x, y, 0.55); },
        });
      }
    },

    note(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to);
      for (let j = -1; j <= 1; j++) p('spark', (from.x + to.x) / 2 + Math.cos(a + 1.57) * j * 14, (from.y + to.y) / 2 + Math.sin(a + 1.57) * j * 14, { rot: a, s: [dist(from, to) * 0.35, dist(from, to) * 1.1], asp: 0.03, c: [E.hi, E.main], a: 0.6, life: 0.55, pop: true, fout: 0.5 });
      for (let i = 0; i < 5; i++) {
        fly({
          from, to: { x: to.x + R(-18, 18), y: to.y + R(-18, 18) }, dur: 0.4, side: (i % 2 ? 1 : -1) * R(20, 50), delay: i * 0.06,
          el: o.el, pal: o.pal, noTrail: true, rw: 6, rlen: 8, gs: 42,
          body: (x, y, ang, k) => { G.spr(G.hero('note', i % 2 ? e : 'none'), x, y, 74, 74, Math.sin(k * 16) * 0.4, WHITE, 1, false); },
          hit: (x, y) => { p('ring', x, y, { s: [40, 70], c: [E.hi], life: 0.22, pop: true }); p('star4', x, y, { s: [22, 70], c: [E.hi], life: 0.2 }); if (i === 4) hitAt(o, to.x, to.y, 0.95); },
        });
      }
    },

    rift(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'dark' : o.el), E = el(e), h = o.big ? 280 : 210, tilt = R(-0.25, 0.25) + Math.PI / 2;
      burst('glow', to.x, to.y, 18, { v: [-340, -140], sz: [7, 12, 2], c: [E.hi, E.main], life: [0.2, 0.32], jx: 95, jy: 95, drag: 1 });
      add({ life: 0.65, draw(k) {
        const op = k < 0.2 ? outExpo(k / 0.2) : k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1, w = h * 0.22 * op;
        G.spr('glow', to.x, to.y, h, h * 0.55 * op, tilt, rgb(E.main), 0.55 * op, true);
        G.spr('shard', to.x, to.y, h * 1.08, w * 1.6, tilt, rgb(E.main), 0.95, true);
        G.spr('shard', to.x, to.y, h, w, tilt, rgb('#05010b'), 0.98, false);
        G.spr('spark', to.x, to.y, h * 1.25, 12 * op, tilt, rgb(E.hi), op, true);
      } });
      at(0.18, () => {
        burst('shard', to.x, to.y, 18, { ang: tilt + Math.PI / 2, spread: 0.55, v: [220, 600], sz: [18, 32, 4], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.25, 0.5], jy: 50 });
        burst('shard', to.x, to.y, 18, { ang: tilt - Math.PI / 2, spread: 0.55, v: [220, 600], sz: [18, 32, 4], asp: 0.3, face: true, c: [E.hi, E.main], life: [0.25, 0.5], jy: 50 });
        hitAt({ ...o, pal: e }, to.x, to.y, 1.05);
      });
    },

    ground(from, to, o) {
      const e = o.pal || o.el, E = e === 'none' ? { hi: '#efe4d0', main: '#b59a78', lo: '#6e573c', deep: '#2a2016' } : el(e);
      const by = to.y + (to.h || 60) * 0.42, sc = o.big ? 1.3 : 1;
      p('crack', to.x, by, { s: [55, 200 * sc], asp: 0.4, c: [E.hi, E.main], life: 0.75, pop: true, fout: 0.5 });
      shock(to.x, by, E, 110 * sc, 0.28);
      at(0.06, () => {
        if (e === 'wood') thorns(to.x, by, E, 1.55 * sc, 0, 7, 120);
        else if (e === 'dark') {
          for (let i = 0; i < 7; i++) {
            const a = -Math.PI / 2 + (i - 3) * 0.22, L = (i === 3 ? 180 : 120) * sc;
            p('shard', to.x + (i - 3) * 15, by, { rot: a, s: [12, L], asp: 0.28, c: ['#0a0214', '#0a0214'], add: false, life: 0.55, pop: true, fout: 0.55, vx: Math.cos(a) * L * 0.95, vy: Math.sin(a) * L * 0.95, drag: 0.78 });
            p('shard', to.x + (i - 3) * 15, by, { rot: a, s: [14, L * 1.1], asp: 0.34, c: [E.main, E.lo], a: 0.75, life: 0.55, pop: true, fout: 0.5, vx: Math.cos(a) * L * 0.95, vy: Math.sin(a) * L * 0.95, drag: 0.78 });
          }
        } else if (e === 'none' || e === 'ice') {
          burst('shard', to.x, by, 14, { ang: -Math.PI / 2, spread: 0.55, v: [320, 760], sz: [28 * sc, 54 * sc, 14], asp: 0.5, c: [E.hi, E.lo], add: e === 'ice', life: [0.5, 0.9], ay: 1300, rrot: true, rvr: 8, jx: 32 });
        } else {
          const tex = e === 'fire' ? 'flame' : e === 'water' ? 'drop' : 'spark';
          burst(tex, to.x, by, 24, { ang: -Math.PI / 2, spread: 0.28, v: [320, 800 * sc], sz: [32 * sc, 60 * sc, 8], asp: tex === 'flame' ? 1 : 0.5, face: tex !== 'flame', c: [E.hi, e === 'fire' ? E.lo : E.main], life: [0.35, 0.7], ay: e === 'water' ? 1100 : -120, drag: 0.92, jx: 24, add: e !== 'water', dj: 0.1 });
          p('line', to.x, by - 100 * sc, { rot: Math.PI / 2, s: [70, 280 * sc], asp: 0.28, c: [E.hi, E.main], a: 0.85, life: 0.42, pop: true, fout: 0.3 });
        }
        smoke(to.x, by, 5, 1.05, ['#5c5248', '#17130f'], { a: 0.5 });
        hitAt({ ...o, pal: e === 'none' ? 'none' : e }, to.x, to.y, 1.15);
      });
    },

    whirl(from, to, o) {
      const e = o.pal || o.el, E = el(e), r0 = o.big ? 78 : 60;
      // 회전 칼날: crescent 스프라이트 대신 호 세그먼트
      add({ life: 0.65, draw(k) {
        const al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : Math.min(1, k * 5), r = r0 * (0.75 + 0.55 * k);
        for (let i = 0; i < 5; i++) {
          const a0 = k * 18 + i * TAU / 5, a1 = a0 + 0.9;
          for (let s = 0; s < 10; s++) {
            const u0 = s / 10, u1 = (s + 1) / 10, ang0 = a0 + (a1 - a0) * u0, ang1 = a0 + (a1 - a0) * u1;
            const x0 = to.x + Math.cos(ang0) * r, y0 = to.y + Math.sin(ang0) * r * 0.7;
            const x1 = to.x + Math.cos(ang1) * r, y1 = to.y + Math.sin(ang1) * r * 0.7;
            const w = 8 + 6 * Math.sin(u0 * Math.PI);
            G.seg(x0, y0, x1, y1, w * 1.8, w * 1.6, rgb(E.lo), 0.4 * al, true);
            G.seg(x0, y0, x1, y1, w, w * 0.8, rgb(E.hi), 0.85 * al, true);
          }
        }
        if (Math.random() < 0.9) {
          const a = R(0, TAU);
          p('spark', to.x + Math.cos(a) * r, to.y + Math.sin(a) * r * 0.55, { vx: -Math.sin(a) * 340, vy: -280, s: [18, 3], asp: 0.28, face: true, c: [E.hi, E.main], life: 0.32 });
          trail(e, to.x + Math.cos(a) * r, to.y + Math.sin(a) * r * 0.55, 1);
        }
      } });
      at(0.18, () => hitAt(o, to.x, to.y, 1.05));
      at(0.34, () => FXF.accent(e, to.x, to.y, 0.65));
    },

    meteor(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'fire' : o.el), E = el(e), sc = o.big ? 1.35 : 1, by = to.y + (to.h || 60) * 0.3;
      p('ring', to.x, by, { s: [160, 55], asp: 0.32, c: ['#ff5a4a', '#ff5a4a'], a: 0.85, life: 0.36 });
      fly({
        from: { x: to.x + 180, y: to.y - 480 }, to: { x: to.x, y: by }, dur: 0.32, accel: true, el: o.el, pal: e,
        gs: 200 * sc, rw: 58 * sc, rlen: 18, sc: 1.7,
        body: (x, y, ang, k) => {
          G.spr('core', x, y, 84 * sc, 84 * sc, 0, rgb(E.hi), 1, true);
          G.spr('smoke', x, y, 80 * sc, 80 * sc, k * 10, rgb(E.deep), 0.9, false);
          G.spr('flame', x - Math.cos(ang) * 34, y - Math.sin(ang) * 34, 130 * sc, 180 * sc, ang - Math.PI / 2, rgb(E.main), 0.95, true);
        },
        hit: (x, y) => {
          flash(x, y, E, 2.1 * sc); shock(x, y, E, 200 * sc, 0.34); shock(x, y, E, 140 * sc, 0.34, 0.06);
          p('crack', x, y, { s: [90, 280 * sc], asp: 0.4, c: [E.hi, E.main], life: 0.95, pop: true, fout: 0.5 });
          burst('flame', x, y, 22, { ang: -Math.PI / 2, spread: 1.4, v: [180, 560], sz: [54, 96, 8], asp: 1.4, c: [E.main, E.lo], a: 0.85, life: [0.35, 0.7], drag: 0.9, rvr: 2 });
          smoke(x, y, 12, 1.7 * sc, ['#3b3d47', '#0b0c10'], { v: [55, 210], a: 0.75, delay: 0.05 });
          burst('shard', x, y, 16, { ang: -Math.PI / 2, spread: 1.3, v: [320, 860], sz: [18, 36, 8], asp: 0.5, c: ['#8a7a66', '#3a3026'], add: false, life: [0.55, 1.0], ay: 1300, rrot: true, rvr: 10 });
          hitAt({ ...o, pal: e }, to.x, to.y, 1.45 * sc);
        },
      });
    },

    swords(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' || o.big ? 8 : 5;
      for (let i = 0; i < n; i++) {
        const tx = to.x + (i - (n - 1) / 2) * 18 + R(-8, 8), ty = to.y + R(-12, 16);
        fly({
          from: { x: tx + R(-24, 24), y: ty - 400 }, to: { x: tx, y: ty }, dur: 0.15, delay: 0.04 + i * 0.045, accel: true,
          el: o.el, pal: o.pal, noTrail: true, rw: 8, rlen: 10, gs: 55,
          body: (x, y, ang) => { G.spr('sword', x, y, 125, 125, ang, rgb(E.main), 0.95, true); G.spr('sword', x, y, 115, 115, ang, WHITE, 1, true); },
          hit: (x, y, ang) => {
            p('sword', x, y - 28, { rot: ang, s: [115, 115], c: [E.hi, E.main], life: 0.42, fout: 0.4 });
            p('ring', x, y + 12, { s: [40, 55], asp: 0.34, c: [E.hi], life: 0.22, pop: true });
            sparks(x, y, E, 6, 0.65);
            if (i === n - 1) hitAt(o, to.x, to.y, 1.15);
          },
        });
      }
    },

    hands(from, to, o) {
      const e = o.pal || o.el, E = el(e), n = o.type === 'multi' || o.type === 'aoe' ? 6 : 2;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + 0.4, d = 180;
        p('hand', to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, { rot: a - Math.PI / 2, s: [120, 100], c: [E.main, E.lo], a: 0.9, life: 0.52, delay: i * 0.028, vx: -Math.cos(a) * 820, vy: -Math.sin(a) * 820, drag: 0.78, fout: 0.55, add: e !== 'dark' });
        p('hand', to.x + Math.cos(a) * d, to.y + Math.sin(a) * d, { rot: a - Math.PI / 2, s: [104, 86], c: [E.hi, E.main], a: 0.65, life: 0.52, delay: i * 0.028, vx: -Math.cos(a) * 820, vy: -Math.sin(a) * 820, drag: 0.78, fout: 0.55 });
      }
      at(0.22, () => { shock(to.x, to.y, E, 100); flash(to.x, to.y, E, 0.7); hitAt(o, to.x, to.y, 1.1); });
    },

    clock(from, to, o) {
      const E = o.pal ? el(o.pal) : { hi: '#f4fbff', main: '#9fd6ff', lo: '#5a7bd9', deep: '#101a3a' };
      p('clock', to.x, to.y, { s: [70, 240], c: [E.hi, E.main], life: 0.8, pop: true, fout: 0.7, vr: -0.6 });
      p('ring', to.x, to.y, { s: [280, 210], c: [E.main, E.lo], life: 0.75, a: 0.65 });
      for (let i = 0; i < 12; i++) { const a = i * TAU / 12; p('glow', to.x + Math.cos(a) * 105, to.y + Math.sin(a) * 105, { s: [12, 5], c: [E.hi], life: 0.65, delay: i * 0.018 }); }
      at(0.55, () => { burst('shard', to.x, to.y, 24, { v: [220, 660], sz: [22, 42, 6], asp: 0.45, c: [E.hi, E.main], life: [0.35, 0.7], rrot: true, rvr: 14, ay: 480 }); flash(to.x, to.y, E, 1.15); hitAt(o, to.x, to.y, 0.95); });
    },

    cloud(from, to, o) {
      const e = o.pal || (o.el === 'none' ? 'poison' : o.el), E = el(e);
      fly({ from, to, dur: 0.28, arc: 42, el: o.el, pal: e, gs: 70, rw: 22, body: (x, y) => G.spr('smoke', x, y, 70, 70, 0, rgb(E.main), 0.85, false) });
      at(0.28, () => {
        smoke(to.x, to.y, 16, 1.6, [E.main, E.deep], { a: 0.65, v: [25, 140], life: [0.95, 1.55], ay: -24, jx: 48, jy: 30 });
        burst('bubble', to.x, to.y, 16, { ang: -Math.PI / 2, spread: 1.6, v: [25, 130], sz: [8, 20, 26], c: [E.hi, E.main], life: [0.6, 1.25], ay: -65, jx: 55, jy: 32, dj: 0.4 });
        hitAt({ ...o, pal: e }, to.x, to.y, 0.85);
      });
    },

    dragon(from, to, o) {
      const e = o.pal || o.el, E = el(e), T = 0.58, a = dirOf(from, to), ex = to.x + Math.cos(a) * 70, ey = to.y + Math.sin(a) * 70;
      add({ life: T + 0.28, draw(k) {
        const head = Math.min(1, k * (T + 0.28) / T);
        for (let i = 0; i < 18; i++) {
          const kk = head - i * 0.032; if (kk < 0) continue;
          const s = Math.sin(kk * 10) * 50 * (1 - kk * 0.4);
          const x = from.x + (ex - from.x) * kk + Math.cos(a + 1.57) * s;
          const y = from.y + (ey - from.y) * kk + Math.sin(a + 1.57) * s;
          const sz = (i === 0 ? 105 : 80 - i * 3) * (o.big ? 1.3 : 1), al = k > 0.78 ? (1 - k) / 0.22 : 1;
          G.spr('glow', x, y, sz * 1.9, sz * 1.9, 0, rgb(E.main), 0.35 * al, true);
          G.spr(i === 0 ? 'core' : 'flame', x, y, sz, sz, a - Math.PI / 2 + Math.cos(kk * 10) * 0.65, rgb(i === 0 ? E.hi : i % 2 ? E.main : E.lo), 0.95 * al, true);
          if (i === 0) { G.spr('eye', x, y, sz * 0.7, sz * 0.4, a + Math.cos(kk * 10) * 0.65, rgb('#1a0500'), al, false); trail(e, x, y, 1.7); }
        }
      } });
      at(T * 0.78, () => { hitAt(o, to.x, to.y, 1.45); rays(to.x, to.y, E, 12, 180); });
    },

    bird(from, to, o) {
      const e = o.pal || o.el, E = el(e), a = dirOf(from, to), ex = { x: to.x + Math.cos(a) * 150, y: to.y + Math.sin(a) * 150 };
      fly({
        from, to: ex, dur: 0.42, el: o.el, pal: o.pal, gs: 160, rw: 44, rlen: 18, sc: 1.55,
        body: (x, y, ang, k) => {
          const f = Math.sin(k * 28) * 0.55;
          for (const sd of [-1, 1]) {
            G.spr('wing', x + Math.cos(ang + sd * 1.57) * 44, y + Math.sin(ang + sd * 1.57) * 44, 130 * sd, 130, ang + Math.PI / 2 + sd * (0.55 + f), rgb(E.lo), 0.5, true);
            G.spr('wing', x + Math.cos(ang + sd * 1.57) * 40, y + Math.sin(ang + sd * 1.57) * 40, 110 * sd, 110, ang + Math.PI / 2 + sd * (0.55 + f), rgb(E.main), 0.5, true);
          }
          G.spr('core', x, y, 48, 48, 0, rgb(E.hi), 1, true);
        },
      });
      at(0.42 * dist(from, to) / Math.max(1, dist(from, ex)), () => hitAt(o, to.x, to.y, 1.3));
    },

    bone(from, to, o) {
      const E = el(o.pal || o.el), n = o.type === 'multi' ? 4 : 1;
      for (let i = 0; i < n; i++) {
        fly({
          from, to: { x: to.x + (n > 1 ? R(-16, 16) : 0), y: to.y + (n > 1 ? R(-16, 16) : 0) }, speed: 1250, delay: i * 0.07,
          el: o.el, pal: o.pal, rw: 14, rlen: 12, gs: 55,
          body: (x, y, ang, k) => {
            const spin = o.type === 'pierce' ? 0 : k * 18;
            G.spr('bone', x, y, 100, 100, ang + spin, rgb('#f3ecd8'), 1, false);
            G.spr('bone', x, y, 115, 115, ang + spin, rgb(E.main), 0.55, true);
          },
          hit: (x, y) => {
            burst('bone', x, y, 5, { v: [150, 400], sz: [28, 42, 20], c: ['#f3ecd8', '#b9ac98'], add: false, life: [0.4, 0.7], ay: 800, rrot: true, rvr: 14 });
            p('skull', x, y - 22, { s: [34, 90], c: [E.hi, E.main], life: 0.55, vy: -70, pop: true, fout: 0.4 });
            if (i === n - 1) hitAt(o, to.x, to.y, 1.1);
          },
        });
      }
    },
  };

  // kit.crescentFly 도 새 칼날 궤적으로 (시그니처 연출·AOE가 씀)
  const crescentFly = (from, to, o, size, tilt, delay, T, onHit) => {
    bladeArc(from, to, o || {}, { size: size || 160, tilt: tilt || 0.55, delay: delay || 0, sweep: Math.max(0.07, Math.min(0.12, (T || 0.2) * 0.55)), trail: Math.max(0.18, (T || 0.2) * 0.9), onHit });
  };

  Object.assign(FXF.FORM, FORM);
  if (FXF.kit) {
    FXF.kit.crescentFly = crescentFly;
    Object.assign(FXF.kit, { bladeArc, pierceBundle, heavySlam });
  }

  // AOE 회오리·해일도 crescent 스프라이트 대신 호/파동으로
  if (FXF.AOE) {
    FXF.AOE.whirl = function (from, area, spots, o) {
      const e = o.pal || o.el, E = el(e), r0 = Math.max(100, area.w * 0.42);
      add({ life: 0.8, draw(k) {
        const al = k > 0.6 ? 1 - (k - 0.6) / 0.4 : Math.min(1, k * 5), r = r0 * (0.7 + 0.55 * k);
        for (let i = 0; i < 6; i++) {
          const a0 = k * 17 + i * TAU / 6;
          for (let s = 0; s < 12; s++) {
            const u0 = s / 12, ang0 = a0 + u0 * 1.0, ang1 = a0 + (u0 + 1 / 12) * 1.0;
            const x0 = area.x + Math.cos(ang0) * r, y0 = area.y + Math.sin(ang0) * r * 0.65;
            const x1 = area.x + Math.cos(ang1) * r, y1 = area.y + Math.sin(ang1) * r * 0.65;
            const w = 10 + 8 * Math.sin(u0 * Math.PI);
            G.seg(x0, y0, x1, y1, w * 1.6, w, rgb(E.main), 0.75 * al, true);
            G.seg(x0, y0, x1, y1, w * 0.7, w * 0.4, rgb(E.hi), 0.9 * al, true);
          }
        }
      } });
      (spots || []).forEach((s, i) => at(0.15 + i * 0.04, () => FXF.accent(e, s.x, s.y, 0.8)));
    };
    FXF.AOE.slash = function (from, area, spots, o) {
      const E = el(o.pal || o.el), a = Math.atan2(area.y - from.y, area.x - from.x);
      const far = { x: area.x + Math.cos(a) * 50, y: area.y + Math.sin(a) * 50 }, sz = Math.max(280, area.w * 1.2);
      flash(from.x, from.y, E, 0.65);
      crescentFly(from, far, o, sz, 0.7, 0, 0.24);
      crescentFly(from, far, o, sz * 0.9, -0.75, 0.07, 0.24);
      (spots || []).forEach((s, i) => at(0.18 + i * 0.02, () => { cut(s.x, s.y, a + 1.57 + R(-0.35, 0.35), 200, E, 0, 1.15); FXF.accent(o.pal || o.el, s.x, s.y, 0.75); }));
    };
  }
})();
