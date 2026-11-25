// ===== 게이트 크로니클 스킬 컨셉 × pixelfx 화풍 =====
// patch-gg/pixelfx(MIT) 의 shade·하드램프·SPARK·히어로프레임 기법을 빌려,
// 우리 FORM(검기·창찌르기·내려찍·주먹·단검·화살·탄·폭탄·속성구·빛기둥·회오리…)을
// 스킬 컨셉에 맞게 새로 그린다. 원본 sword-slash 등을 그대로 붙이지 않는다.
(() => {
  if (typeof PIXELFX === 'undefined' || !PIXELFX.createFx) return;
  const {
    Particles, Lights, P, Rng, fit, sparkle, flare, clamp, smooth, ease, TAU, WHITE,
  } = PIXELFX;

  const PAL = {
    none: ['#1a2030', '#2e3648', '#6e7a90', '#9aa6ba', '#c8d0dc', '#e8eef7', '#ffffff'],
    fire: ['#1f0b10', '#8c1d1c', '#e0561e', '#f2701f', '#ffc46a', '#fff8d6', '#ffffff'],
    bolt: ['#0a0f2e', '#2550d0', '#3a8bd8', '#7cc8ff', '#b8e0ff', '#e8f6ff', '#ffffff'],
    volt: ['#24160a', '#a8680f', '#ff8a2a', '#ffd23c', '#ffe27a', '#fff6cf', '#ffffff'],
    water: ['#081830', '#14508c', '#36a2e0', '#58b4ec', '#c4ecff', '#e8f8ff', '#ffffff'],
    ice: ['#0c1430', '#1f4f94', '#3a8bd8', '#58b4ec', '#b8e8ff', '#e8f8ff', '#ffffff'],
    wood: ['#0c1a0e', '#225224', '#4f9a3a', '#6cb82a', '#b4e070', '#e4ffb0', '#ffffff'],
    holy: ['#2a1c08', '#9a6c18', '#ffd84a', '#ffe27a', '#fff6cf', '#fffbe6', '#ffffff'],
    dark: ['#050308', '#1c1230', '#5e3290', '#9a48ec', '#c77dff', '#ecc8ff', '#ffffff'],
    blood: ['#14040a', '#6a101c', '#d42a30', '#ff4a4a', '#ff9a8a', '#ffe0d8', '#ffffff'],
    poison: ['#0d1a0c', '#265e18', '#4f9a3a', '#6cb82a', '#b4e070', '#e0ff8a', '#ffffff'],
  };
  const sparksOf = (el) => (el === 'fire' || el === 'blood' || el === 'volt'
    ? ['#fff3a6', '#ffe26b', '#ff8a2a', '#f2561d']
    : el === 'holy' ? ['#fffbe6', '#ffe27a', '#ffd84a', '#9a6c18']
      : el === 'dark' ? ['#ecc8ff', '#c77dff', '#9a48ec', '#5e3290']
        : el === 'wood' || el === 'poison' ? ['#e4ffb0', '#b4e070', '#6cb82a', '#225224']
          : ['#fff3a6', '#ffe26b', '#62c8f4', '#2c58aa']);

  function ramp(el) { return fit(PAL[el] || PAL.none, 7); }
  function mod(name, desc, size, origin, duration, options, create) {
    return { meta: { name, desc, tags: ['gc', 'combat', 'one-shot'], size, origin, duration, loop: false, fps: 30, options }, create };
  }

  // ---------- 공통: 히트 십자( hit-spark 기법 ) ----------
  function hitCross(p, x, y, aim, C, t, sc = 1) {
    if (t < 0 || t > 0.12) return;
    const L = (t < 0.03 ? 28 : t < 0.06 ? 34 : 18) * sc;
    const arms = [[aim, 1], [aim + Math.PI, 0.35], [aim + 1.57, 0.55], [aim - 1.57, 0.45]];
    for (const [a, k] of arms) {
      const c = Math.cos(a), s = Math.sin(a);
      for (let d = 0; d <= L * k; d += 0.5) {
        const u = d / (L * k || 1);
        const col = u < 0.25 ? WHITE : u < 0.55 ? C[5] : C[3];
        p.px(x + c * d, y + s * d, col);
        if (u < 0.35) p.px(x + c * d - s, y + s * d + c, C[5]);
      }
    }
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      if (Math.abs(dx) + Math.abs(dy) <= 3) p.px(x + dx, y + dy, WHITE);
    }
    p.glow(x, y, 18 * sc, C[4], 0.35 * (1 - t / 0.12));
  }

  // ---------- 검기: 시전자→대상 칼끝 궤적 (베지어 스미어, 하드램프) ----------
  // pixelfx crescent shade 기법 · 기하만 우리 컨셉(궤적 절삭)으로
  function bladeSmear(p, path, head, tail, W, C, age) {
    if (head - tail < 0.02 || W < 0.4) return;
    const n = C.length;
    const samples = 40;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = i / samples;
      if (u < tail || u > head) continue;
      pts.push({ u, ...path(u) });
    }
    if (pts.length < 2) return;
    // 궤적 주변 shade 박스
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    for (const q of pts) { minX = Math.min(minX, q.x); minY = Math.min(minY, q.y); maxX = Math.max(maxX, q.x); maxY = Math.max(maxY, q.y); }
    const pad = W + 4;
    p.shade(minX - pad, minY - pad, maxX + pad, maxY + pad, (x, y, out) => {
      let best = 1e9, along = 0, nx = 0, ny = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
        let t = ((x - a.x) * dx + (y - a.y) * dy) / L2; t = clamp(t, 0, 1);
        const px = a.x + dx * t, py = a.y + dy * t;
        const d = Math.hypot(x - px, y - py);
        if (d < best) {
          best = d; along = a.u + (b.u - a.u) * t;
          const len = Math.hypot(dx, dy) || 1; nx = -dy / len; ny = dx / len;
        }
      }
      const v = (along - tail) / Math.max(0.001, head - tail);
      const w = W * Math.pow(Math.sin(Math.PI * Math.pow(Math.max(0.02, v), 1.85)), 0.55) * (0.55 + 0.45 * v);
      if (best > w || w < 0.35) return;
      const q = best / w;
      const ci = q < 0.22 && age < 0.45 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.2 - v * 0.7 + 0.35);
      out.c = C[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / 0.35);
    });
    // 칼끝 빛
    const tip = path(head);
    p.glow(tip.x, tip.y, 6 + W * 0.5, C[n - 3], 0.35 * (1 - age));
    p.glow(tip.x, tip.y, 3, WHITE, 0.25 * (1 - age));
  }

  function makeSlashPath(reach, bulge, tilt) {
    const x0 = -4, y0 = 0, x1 = reach, y1 = 0;
    const cx = (x0 + x1) * 0.5, cy = -bulge;
    // 기울인 좌표계
    const c = Math.cos(tilt), s = Math.sin(tilt);
    const rot = (x, y) => ({ x: x * c - y * s, y: x * s + y * c });
    return (u) => {
      const v = 1 - u;
      const x = v * v * x0 + 2 * v * u * cx + u * u * x1;
      const y = v * v * y0 + 2 * v * u * cy + u * u * y1;
      return rot(x, y - 18);
    };
  }

  const slash = mod('GC 검기', '시전자→대상 칼끝 궤적 절삭', [160, 96], [28, 70], 0.55, {
    palette: PAL.none, sparks: sparksOf('none'), reach: 72, seed: 2, kind: 'dmg',
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('none') });
    const kind = o.kind || 'dmg';
    const reach = o.reach || 72;
    const cuts = kind === 'multi' ? [[0, 0.7, 1], [0.07, -0.65, 0.9], [0.14, 0.2, 1.05]]
      : (kind === 'crit' || o.big) ? [[0, 0.85, 1.15], [0.05, -0.75, 1.1]]
        : kind === 'pierce' ? [[0, 0.05, 0.7]] : [[0, 0.55 + Rg.range(-0.1, 0.1), 1]];
    const paths = cuts.map(([t0, tilt, sc]) => ({
      t0, path: makeSlashPath(reach * sc, kind === 'pierce' ? 4 : 32 * sc, tilt),
      W: kind === 'pierce' ? 4.5 : 14 * sc, sweep: kind === 'pierce' ? 0.05 : 0.1, hold: 0.08, trail: 0.32,
    }));
    let t = 0, landed = false;
    return {
      update(dt) {
        t += dt;
        if (!landed && t >= 0.1) {
          landed = true;
          const tip = paths[paths.length - 1].path(1);
          for (let i = 0; i < 12; i++) {
            const a = Rg.range(-0.9, 0.9), sp = Rg.range(140, 380);
            ps.spawn(P.SPARK, tip.x, tip.y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.32));
          }
          for (let i = 0; i < 14; i++) {
            const u = Rg.range(0.35, 1), q = paths[0].path(u), sp = Rg.range(30, 100);
            ps.spawn(P.MOTE, q.x, q.y, Rg.range(-50, 50), -sp, Rg.range(0.25, 0.55), C[4 + Rg.int(0, 1)], 0.6);
          }
        }
        ps.update(dt);
      },
      draw(p) {
        for (const s of paths) {
          const u = t - s.t0; if (u < 0) continue;
          const head = ease.outExpo(clamp(u / s.sweep));
          const tail = smooth(s.sweep + s.hold, s.sweep + s.hold + s.trail, u);
          const age = clamp(u / (s.sweep + s.hold + s.trail));
          if (tail < 1) bladeSmear(p, s.path, head, Math.min(head, tail), s.W * (1 - tail * 0.45), C, age);
          // 궤적 점선 잔상
          const th = 0.75 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
          if (tail > 0.02 && th > 0) for (let k = 0; k <= tail; k += 0.03) {
            const q = s.path(k); p.dot(q.x, q.y, C[2], th * (0.4 + 0.6 * k));
          }
          const tip = s.path(Math.min(1, head));
          const g = u - s.sweep * 0.5;
          if (g > 0 && g < 0.2) sparkle(p, tip.x, tip.y, 9 * ease.outBack(Math.min(1, g / 0.04)) * (1 - g / 0.2), C[5], C[3], 0.55);
          // 칼끝 흰 절삭면
          if (head > 0.2 && head < 1.01 && age < 0.7) {
            const tng = (() => { const a = s.path(Math.max(0, head - 0.02)), b = tip; const l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return [(b.x - a.x) / l, (b.y - a.y) / l]; })();
            for (let d = 0; d < 10; d++) p.px(tip.x + tng[0] * d, tip.y + tng[1] * d, d < 3 ? WHITE : C[5]);
          }
        }
        // 히트 십자는 짧게만 — 검기 궤적이 주인공
        if (landed && t - 0.1 < 0.07) hitCross(p, paths[0].path(1).x, paths[0].path(1).y, 0, C, t - 0.1, o.big ? 1.1 : 0.85);
        ps.draw(p);
      },
    };
  });

  // ---------- 창 찌르기: 손→끝점 속도선 다발 ----------
  const thrust = mod('GC 창 찌르기', '손에서 끝으로 모이는 관통 속도선', [180, 72], [24, 48], 0.55, {
    palette: PAL.volt, sparks: sparksOf('volt'), reach: 78, seed: 3,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('volt') });
    const lights = new Lights();
    const HX = 0, HY = -18, TX = o.reach || 78, TY = -18;
    const OUT = 0.07, HOLD = 0.05, PULL = 0.18;
    const streaks = [-6, -3, 0, 3, 6].map((off) => ({
      off, x0: HX + Rg.range(0, 4), t0: Rg.range(0, 0.015),
      w: off === 0 ? 2 : 1, hot: off === 0, len: Rg.range(0.8, 1),
    }));
    let t = 0, struck = false;
    return {
      update(dt) {
        t += dt;
        if (!struck && t >= OUT) {
          struck = true;
          lights.add(TX, TY, 40, C[4], 0.45, 0.25);
          lights.add(TX, TY, 12, WHITE, 0.55, 0.06);
          for (let i = 0; i < 12; i++) {
            const a = Rg.range(-0.55, 0.45), sp = Rg.range(150, 340);
            ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp - 20, Rg.range(0.12, 0.32));
          }
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        if (t < 0.05) sparkle(p, HX + 2, HY, 5 * (1 - t / 0.05), C[5], C[3], 0.4);
        const pull = smooth(OUT + HOLD, OUT + HOLD + PULL, t);
        for (const s of streaks) {
          const u = clamp((t - s.t0) / OUT), head = ease.outExpo(u);
          if (u <= 0 || pull >= 1) continue;
          const y0 = HY + s.off, end = s.x0 + (TX - s.x0) * s.len;
          const x1 = s.x0 + (end - s.x0) * head;
          const xa = s.x0 + (end - s.x0) * Math.max(pull, head * 0.3);
          for (let x = xa; x <= x1; x += 0.5) {
            const v = (x - xa) / Math.max(1, x1 - xa);
            const c = v > 0.88 ? WHITE : s.hot ? (v > 0.35 ? C[6] : C[5]) : v > 0.5 ? C[5] : C[3];
            p.dot(x, y0, c, v < 0.12 ? v / 0.12 : 1);
            if (s.w > 1 && v > 0.1) p.dot(x, y0 + 1, v > 0.6 ? C[5] : C[3], 1);
          }
        }
        const q = t - OUT;
        if (q >= 0 && q < 0.35) {
          const g = ease.outBack(clamp(q / 0.04), 2.2) * (1 - smooth(0.08, 0.35, q));
          const L = 22 * g;
          for (const [dx, dy, k] of [[1, 0, 1], [-1, 0, 0.65], [0, -1, 0.4], [0, 1, 0.4]]) {
            for (let d = 1; d <= L * k; d += 0.5) {
              const u = d / (L * k); p.px(TX + dx * d, TY + dy * d, u < 0.3 ? WHITE : u < 0.65 ? C[5] : C[4]);
            }
          }
          p.px(TX, TY, WHITE);
          p.glow(TX, TY, 8 + L, C[4], 0.3 * (1 - q / 0.35));
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 내려찍: 머리 위 → 낙하 → 바닥 균열 ----------
  const cleave = mod('GC 내려찍', '머리 위 예광 후 가속 낙하·바닥 충격', [140, 160], [70, 140], 0.7, {
    palette: PAL.fire, sparks: sparksOf('fire'), seed: 4,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('fire') });
    const lights = new Lights();
    const X = 0, TOP = -110, BOT = 0;
    let t = 0, slammed = false;
    return {
      update(dt) {
        t += dt;
        if (!slammed && t >= 0.22) {
          slammed = true;
          lights.add(X, BOT, 50, C[4], 0.5, 0.28);
          for (let i = 0; i < 14; i++) {
            const a = -Math.PI / 2 + Rg.range(-1.1, 1.1), sp = Rg.range(160, 420);
            ps.spawn(P.SPARK, X, BOT, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.2, 0.4));
          }
          for (let i = 0; i < 8; i++) ps.spawn(P.GRIT, X, BOT, Rg.range(-120, 120), Rg.range(-220, -60), Rg.range(0.35, 0.55), C[3], 1);
          for (let i = 0; i < 6; i++) ps.spawn(P.DUST, X + Rg.range(-16, 16), BOT, Rg.range(-30, 30), Rg.range(-20, -5), Rg.range(0.4, 0.7), C[1], 1.2);
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        // 예광
        if (t < 0.18) {
          const k = 1 - t / 0.18;
          sparkle(p, X, TOP, 10 * k, C[5], C[3], 0.5);
          p.glow(X, TOP, 22, C[4], 0.35 * k);
        }
        // 낙하 검신
        if (t >= 0.1 && t < 0.28) {
          const g = ease.inQuad(clamp((t - 0.1) / 0.12));
          const y = TOP + (BOT - TOP) * g;
          for (let d = TOP; d <= y; d += 0.5) {
            const u = (d - TOP) / Math.max(1, y - TOP);
            const c = u > 0.85 ? WHITE : u > 0.5 ? C[5] : C[3];
            p.px(X, d, c); p.px(X - 1, d, C[4]); p.px(X + 1, d, C[4]);
            if (u > 0.7) p.px(X - 2, d, C[3]);
          }
          p.glow(X, y, 14, C[4], 0.4);
        }
        if (slammed) {
          const q = t - 0.22;
          // 바닥 타원 충격
          const rx = 8 + 28 * ease.outCubic(clamp(q / 0.12));
          const ry = 3 + 10 * ease.outCubic(clamp(q / 0.12));
          for (let a = 0; a < TAU; a += 0.08) {
            p.dot(X + Math.cos(a) * rx, BOT + Math.sin(a) * ry * 0.55, q < 0.08 ? WHITE : C[4], Math.max(0, 1 - q / 0.35));
          }
          // 균열
          for (const ang of [-0.9, -0.3, 0.25, 0.85, 1.4]) {
            const L = 18 + (Math.abs(ang) < 0.4 ? 14 : 0);
            for (let d = 2; d < L * (1 - q * 0.5); d++) p.dot(X + Math.cos(ang) * d, BOT + Math.sin(ang) * d * 0.35, C[2], 0.8 - q);
          }
          hitCross(p, X, BOT - 8, -1.57, C, q, 1.1);
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 주먹: 돌진 잔상 + 만화 타격 십자 ----------
  const fist = mod('GC 주먹', '속도선 돌진 후 둔타 충격', [140, 88], [30, 60], 0.5, {
    palette: PAL.fire, sparks: sparksOf('fire'), reach: 64, seed: 5,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('fire') });
    const lights = new Lights();
    const HX = 0, HY = -16, TX = o.reach || 64, TY = -16;
    const DUR = 0.09;
    let t = 0, hit = false;
    return {
      update(dt) {
        t += dt;
        if (!hit && t >= DUR) {
          hit = true;
          lights.add(TX, TY, 44, C[4], 0.5, 0.2);
          for (let i = 0; i < 14; i++) {
            const a = Rg.range(0, TAU), sp = Rg.range(120, 360);
            ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.15, 0.35));
          }
          for (let i = 0; i < 7; i++) ps.spawn(P.DUST, TX, TY, Rg.range(-50, 50), Rg.range(-40, -10), Rg.range(0.35, 0.6), C[1], 1.1);
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        const g = ease.outExpo(clamp(t / DUR));
        const x = HX + (TX - HX) * Math.min(1, g);
        // 속도선 잔상
        if (t < DUR + 0.06) {
          for (let i = 0; i < 5; i++) {
            const back = 10 + i * 10, al = (1 - i / 5) * (t < DUR ? 1 : 1 - (t - DUR) / 0.06);
            for (let d = 0; d < back; d++) p.dot(x - d, HY + (i - 2) * 2, d < 3 ? WHITE : C[4], al * (1 - d / back));
          }
          p.px(x, HY, WHITE); p.px(x - 1, HY, C[5]); p.px(x + 1, HY, C[5]);
          p.glow(x, HY, 12, C[4], 0.35);
        }
        if (hit) {
          const q = t - DUR;
          hitCross(p, TX, TY, 0, C, q, o.big ? 1.3 : 1.1);
          // 충격 링
          const r = 4 + 22 * ease.outCubic(clamp(q / 0.1));
          for (let a = 0; a < TAU; a += 0.12) p.dot(TX + Math.cos(a) * r, TY + Math.sin(a) * r * 0.7, q < 0.06 ? WHITE : C[4], Math.max(0, 1 - q / 0.28));
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 단검 연살: 짧은 절삭이 연달아 ----------
  const stab = mod('GC 단검 연살', '점멸 후 얇은 절삭 연속', [120, 90], [50, 55], 0.55, {
    palette: PAL.dark, sparks: sparksOf('dark'), seed: 6, kind: 'dmg',
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('dark') });
    const n = o.kind === 'multi' ? 6 : (o.kind === 'crit' || o.big) ? 5 : 3;
    const cuts = [];
    for (let i = 0; i < n; i++) {
      cuts.push({
        t0: 0.04 + i * 0.045,
        ang: (i % 2 ? 1 : -1) * (0.5 + i * 0.15) + Rg.range(-0.1, 0.1),
        len: Rg.range(28, 40) * (o.big ? 1.2 : 1),
        ox: Rg.range(-6, 6), oy: Rg.range(-8, 8),
      });
    }
    let t = 0, doneHit = false;
    return {
      update(dt) {
        t += dt;
        if (!doneHit && t >= 0.04 + (n - 1) * 0.045) {
          doneHit = true;
          for (let i = 0; i < 10; i++) {
            const a = Rg.range(0, TAU), sp = Rg.range(100, 280);
            ps.spawn(P.SPARK, cuts[n - 1].ox, -16 + cuts[n - 1].oy, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.28));
          }
        }
        ps.update(dt);
      },
      draw(p) {
        if (t < 0.08) { p.glow(0, -16, 16, C[4], 0.4 * (1 - t / 0.08)); sparkle(p, -18, -10, 5 * (1 - t / 0.08), C[5], C[3], 0.4); }
        for (const c of cuts) {
          const u = t - c.t0; if (u < 0 || u > 0.2) continue;
          const head = ease.outExpo(clamp(u / 0.05));
          const fade = u > 0.1 ? 1 - (u - 0.1) / 0.1 : 1;
          const cs = Math.cos(c.ang), sn = Math.sin(c.ang);
          const x0 = c.ox - cs * c.len * 0.35, y0 = -16 + c.oy - sn * c.len * 0.35;
          for (let d = 0; d <= c.len * head; d += 0.5) {
            const v = d / c.len;
            const col = v > 0.75 ? WHITE : v > 0.4 ? C[5] : C[3];
            p.dot(x0 + cs * d, y0 + sn * d, col, fade);
          }
          if (u < 0.08) p.px(x0 + cs * c.len * head, y0 + sn * c.len * head, WHITE);
        }
        if (doneHit) hitCross(p, 0, -16, 0.4, C, t - (0.04 + (n - 1) * 0.045), 0.9);
        ps.draw(p);
      },
    };
  });

  // ---------- 화살 ----------
  const arrow = mod('GC 화살', '시위→직선 비행→꽂힘', [160, 64], [16, 40], 0.5, {
    palette: PAL.wood, sparks: sparksOf('wood'), reach: 90, seed: 7,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('wood') });
    const HX = 0, HY = -14, TX = o.reach || 90, TY = -14;
    const FLY = 0.14;
    let t = 0, hit = false;
    return {
      update(dt) {
        t += dt;
        if (!hit && t >= FLY) {
          hit = true;
          for (let i = 0; i < 8; i++) {
            const a = Rg.range(-0.8, 0.8) + Math.PI, sp = Rg.range(80, 220);
            ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.15, 0.3));
          }
          for (let i = 0; i < 6; i++) ps.spawn(P.MOTE, TX, TY, Rg.range(-40, 20), Rg.range(-60, -10), Rg.range(0.3, 0.5), C[4], 0.7);
        }
        // 비행 중 잎 입자
        if (t < FLY && Rg.chance(0.4)) {
          const g = t / FLY, x = HX + (TX - HX) * g;
          ps.spawn(P.MOTE, x, HY + Rg.range(-3, 3), -30, Rg.range(-20, 10), 0.25, C[4], 0.5);
        }
        ps.update(dt);
      },
      draw(p) {
        if (t < 0.06) { // 시위
          p.glow(HX, HY, 10, C[4], 0.4 * (1 - t / 0.06));
          for (let i = -6; i <= 6; i++) p.dot(HX - 2, HY + i * 0.7, C[3], 0.7);
        }
        const g = ease.outQuad(clamp(t / FLY));
        if (t < FLY + 0.1) {
          const x = HX + (TX - HX) * Math.min(1, g);
          // 화살 몸통 + 궤적
          for (let d = 0; d < 22; d++) {
            const c = d < 2 ? WHITE : d < 8 ? C[5] : d < 14 ? C[3] : C[1];
            p.px(x - d, HY, c);
            if (d < 10) p.px(x - d, HY - 1, C[2]);
          }
          p.px(x + 1, HY, WHITE); p.px(x + 2, HY, C[5]);
          p.px(x + 3, HY - 1, C[4]); p.px(x + 3, HY + 1, C[4]);
          p.px(x - 16, HY - 2, C[4]); p.px(x - 17, HY - 1, C[3]);
          p.px(x - 16, HY + 2, C[4]); p.px(x - 17, HY + 1, C[3]);
          p.glowLine(x - 24, HY, x + 2, HY, 4, C[4], 0.3);
        }
        if (hit) {
          const q = t - FLY;
          for (let a = 0; a < TAU; a += 0.35) p.dot(TX + Math.cos(a) * (4 + q * 30), TY + Math.sin(a) * (4 + q * 30), C[4], Math.max(0, 1 - q / 0.3));
        }
        ps.draw(p);
      },
    };
  });

  // ---------- 총알 ----------
  const bullet = mod('GC 총알', '총구 섬광→트레이서→충격', [170, 56], [20, 36], 0.4, {
    palette: PAL.volt, sparks: sparksOf('volt'), reach: 100, seed: 8, kind: 'dmg',
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('volt') });
    const HX = 0, HY = -12, TX = o.reach || 100, TY = -12;
    const snipe = o.kind === 'crit' || o.kind === 'pierce' || o.big;
    const FLY = snipe ? 0.08 : 0.1;
    let t = 0, hit = false;
    return {
      update(dt) {
        t += dt;
        if (!hit && t >= FLY) {
          hit = true;
          for (let i = 0; i < (snipe ? 14 : 8); i++) {
            const a = Rg.range(-0.7, 0.7), sp = Rg.range(180, 400);
            ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.1, 0.28));
          }
        }
        ps.update(dt);
      },
      draw(p) {
        // 총구
        if (t < 0.06) {
          flare(p, HX, HY, 10 * (1 - t / 0.06), 1, C);
          for (let i = 0; i < 5; i++) p.dot(HX + i * 2, HY + Rg.range(-2, 2), WHITE, 1 - t / 0.06);
        }
        if (snipe && t < FLY) {
          // 레일 직선
          for (let x = HX; x < TX; x += 1) p.dot(x, HY, x % 3 === 0 ? WHITE : C[5], 0.7);
        } else if (t < FLY) {
          const g = t / FLY, x = HX + (TX - HX) * g;
          for (let d = 0; d < 18; d++) p.dot(x - d, HY, d < 2 ? WHITE : C[4], 1 - d / 18);
        }
        if (hit) hitCross(p, TX, TY, 0, C, t - FLY, snipe ? 1.3 : 0.9);
        ps.draw(p);
      },
    };
  });

  // ---------- 폭탄 ----------
  const bomb = mod('GC 폭탄', '투척 아크→만화식 폭발', [120, 120], [60, 90], 0.75, {
    palette: PAL.fire, sparks: sparksOf('fire'), seed: 9, flask: false,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('fire') });
    const lights = new Lights();
    const THROW = 0.28;
    let t = 0, boom = false;
    return {
      update(dt) {
        t += dt;
        if (!boom && t >= THROW) {
          boom = true;
          lights.add(0, 0, 60, C[4], 0.6, 0.35);
          for (let i = 0; i < 22; i++) {
            const a = Rg.range(0, TAU), sp = Rg.range(120, 420);
            ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp - 40, Rg.range(0.25, 0.55));
          }
          for (let i = 0; i < 10; i++) ps.spawn(P.FIRE, Rg.range(-10, 10), Rg.range(-8, 4), Rg.range(-40, 40), Rg.range(-80, -20), Rg.range(0.35, 0.65));
          for (let i = 0; i < 8; i++) ps.spawn(P.SMOKE, Rg.range(-8, 8), 0, Rg.range(-20, 20), Rg.range(-30, -5), Rg.range(0.5, 0.9));
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        if (t < THROW) {
          const g = t / THROW, x = -40 + 40 * g, y = -60 * Math.sin(g * Math.PI);
          p.px(x, y, C[2]); p.px(x, y - 1, C[3]); p.px(x + 1, y, C[1]);
          if (!o.flask && Rg.chance(0.5)) p.dot(x + 2, y - 3, C[5], 0.8);
        }
        if (boom) {
          const q = t - THROW;
          if (q < 0.08) {
            // 흰 히어로 + 별
            for (const a of [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2, 4.9]) {
              for (let d = 0; d < 28; d++) p.px(Math.cos(a) * d, Math.sin(a) * d, d < 6 ? WHITE : C[5]);
            }
            for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (Math.abs(dx) + Math.abs(dy) <= 5) p.px(dx, dy, WHITE);
          } else if (q < 0.25) {
            const r = 10 + 30 * ((q - 0.08) / 0.17);
            for (let a = 0; a < TAU; a += 0.1) p.dot(Math.cos(a) * r, Math.sin(a) * r * 0.75, C[4], 1 - (q - 0.08) / 0.17);
          }
          p.glow(0, 0, 40, C[3], 0.4 * Math.exp(-q / 0.2));
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 속성 마법구 (염/뇌/수/목/성/암) ----------
  const orb = mod('GC 속성구', '속성별 투사체→폭발', [150, 90], [24, 55], 0.7, {
    palette: PAL.fire, sparks: sparksOf('fire'), reach: 80, seed: 10, el: 'fire',
  }, (o) => {
    const el = o.el || 'fire';
    const C = fit(o.palette || PAL[el] || PAL.fire, 7), Rg = new Rng(o.seed);
    const ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf(el) });
    const lights = new Lights();
    const HX = 0, HY = -16, TX = o.reach || 80, TY = -16;
    const FLY = el === 'bolt' ? 0.06 : 0.22;
    let t = 0, hit = false;
    return {
      update(dt) {
        t += dt;
        if (el !== 'bolt' && t < FLY && Rg.chance(0.5)) {
          const g = t / FLY, x = HX + (TX - HX) * g;
          if (el === 'fire') ps.spawn(P.EMBER, x - 4, HY, Rg.range(-20, 10), Rg.range(-40, -10), 0.3);
          else if (el === 'water' || el === 'ice') ps.spawn(P.MOTE, x, HY, -20, Rg.range(-10, 10), 0.25, C[4], 0.5);
          else if (el === 'wood' || el === 'poison') ps.spawn(P.MOTE, x, HY + Rg.range(-4, 4), -15, 5, 0.3, C[4], 0.6);
          else if (el === 'dark') ps.spawn(P.MOTE, x, HY, -10, Rg.range(-15, 15), 0.35, C[2], 0.7);
        }
        if (!hit && t >= FLY) {
          hit = true;
          lights.add(TX, TY, 48, C[4], 0.5, 0.3);
          const n = el === 'bolt' ? 16 : 12;
          for (let i = 0; i < n; i++) {
            const a = Rg.range(0, TAU), sp = Rg.range(140, 380);
            ps.spawn(P.SPARK, TX, TY, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.15, 0.4));
          }
          if (el === 'fire') for (let i = 0; i < 8; i++) ps.spawn(P.FIRE, TX, TY, Rg.range(-60, 60), Rg.range(-90, -20), 0.45);
          if (el === 'dark') for (let i = 0; i < 6; i++) ps.spawn(P.SMOKE, TX, TY, Rg.range(-30, 30), Rg.range(-40, -5), 0.6, C[1]);
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        // 시전 링
        if (t < 0.1) {
          const r = 14 * (1 - t / 0.1) + 4;
          for (let a = 0; a < TAU; a += 0.2) p.dot(HX + Math.cos(a) * r, HY + Math.sin(a) * r, C[4], 0.8);
        }
        if (el === 'bolt') {
          // 번개: 지그재그 순간 연결
          if (t < 0.2) {
            const segs = 7; let x = HX, y = HY;
            for (let i = 1; i <= segs; i++) {
              const nx = HX + (TX - HX) * (i / segs) + (i < segs ? Rg.range(-5, 5) : 0);
              const ny = HY + (TY - HY) * (i / segs) + (i < segs ? Rg.range(-8, 8) : 0);
              p.line(x, y, nx, ny, i === segs ? WHITE : C[5], 1);
              p.line(x, y + 1, nx, ny + 1, C[3], 0.7);
              x = nx; y = ny;
            }
            p.glow(TX, TY, 20, C[4], 0.45 * (1 - t / 0.2));
          }
        } else if (t < FLY) {
          const g = ease.outQuad(t / FLY), x = HX + (TX - HX) * g, y = HY + (TY - HY) * g;
          if (el === 'fire') {
            p.px(x, y, WHITE); p.px(x - 1, y, C[5]); p.px(x + 1, y, C[5]);
            for (let i = 1; i < 6; i++) p.dot(x - i * 2, y + Math.sin(t * 40 + i) * 2, C[6 - Math.min(5, i)], 0.9);
            p.glow(x, y, 12, C[3], 0.4);
          } else if (el === 'holy') {
            // 금빛 창
            for (let d = 0; d < 16; d++) p.px(x - d, y, d < 2 ? WHITE : C[5]);
            sparkle(p, x, y, 6, C[5], C[3], 0.5);
          } else if (el === 'dark') {
            for (let a = 0; a < TAU; a += 0.5) p.dot(x + Math.cos(a + t * 8) * 5, y + Math.sin(a + t * 8) * 5, C[3], 0.8);
            p.px(x, y, C[0]); p.px(x, y, C[5]); p.glow(x, y, 10, C[2], 0.35);
          } else if (el === 'wood' || el === 'poison') {
            p.px(x, y, C[5]); p.px(x - 2, y - 2, C[4]); p.px(x - 3, y + 1, C[3]);
            p.px(x - 1, y, C[2]);
          } else {
            // water/ice/default
            p.px(x, y, WHITE); p.px(x - 1, y, C[5]); p.px(x + 1, y, C[4]);
            p.dot(x - 3, y + 1, C[4], 0.8); p.glow(x, y, 9, C[3], 0.3);
          }
        }
        if (hit) {
          const q = t - FLY;
          if (el === 'holy') {
            // 십자 섬광
            for (let d = -16; d <= 16; d++) { p.px(TX + d, TY, Math.abs(d) < 3 ? WHITE : C[5]); p.px(TX, TY + d, Math.abs(d) < 3 ? WHITE : C[5]); }
            p.glow(TX, TY, 24, C[4], 0.4 * Math.exp(-q / 0.15));
          } else hitCross(p, TX, TY, 0, C, q, 1.1);
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 빛기둥 / 낙뢰 ----------
  const smite = mod('GC 빛기둥', '하늘에서 내려꽂히는 기둥·낙뢰', [100, 180], [50, 160], 0.75, {
    palette: PAL.holy, sparks: sparksOf('holy'), seed: 11, el: 'holy',
  }, (o) => {
    const el = o.el || 'holy';
    const C = fit(o.palette || PAL[el] || PAL.holy, 7), Rg = new Rng(o.seed);
    const ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf(el) });
    const lights = new Lights();
    const X = 0, BOT = 0, TOP = -140;
    let t = 0, struck = false;
    return {
      update(dt) {
        t += dt;
        if (!struck && t >= 0.12) {
          struck = true;
          lights.add(X, BOT, 55, C[4], 0.55, 0.35);
          for (let i = 0; i < 16; i++) {
            const a = -Math.PI / 2 + Rg.range(-0.9, 0.9), sp = Rg.range(140, 360);
            ps.spawn(P.SPARK, X, BOT, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.2, 0.45));
          }
        }
        ps.update(dt); lights.update(dt);
      },
      draw(p) {
        if (t < 0.12) {
          const k = t / 0.12;
          for (let a = 0; a < TAU; a += 0.25) p.dot(X + Math.cos(a) * (18 - k * 10), BOT + Math.sin(a) * (6 - k * 2), C[4], 0.7);
        }
        if (t >= 0.1) {
          const g = clamp((t - 0.1) / 0.08);
          const y2 = TOP + (BOT - TOP) * g;
          if (el === 'bolt') {
            // 낙뢰 지그재그
            let x = X, y = TOP;
            const segs = 8;
            for (let i = 1; i <= segs * g; i++) {
              const ny = TOP + (BOT - TOP) * (i / segs);
              const nx = X + (i < segs ? Rg.range(-7, 7) : 0);
              p.line(x, y, nx, ny, WHITE, 1); p.line(x + 1, y, nx + 1, ny, C[4], 0.7);
              x = nx; y = ny;
            }
          } else {
            for (let y = TOP; y <= y2; y += 0.5) {
              const u = (y - TOP) / (BOT - TOP);
              p.px(X, y, u > 0.9 ? WHITE : C[5]);
              p.px(X - 1, y, C[4]); p.px(X + 1, y, C[4]);
              if (u > 0.5) { p.px(X - 2, y, C[3]); p.px(X + 2, y, C[3]); }
            }
          }
          p.glow(X, y2, 16, C[4], 0.45);
        }
        if (struck) {
          const q = t - 0.12;
          const rx = 6 + 26 * ease.outCubic(clamp(q / 0.1));
          for (let a = 0; a < TAU; a += 0.1) p.dot(X + Math.cos(a) * rx, BOT + Math.sin(a) * rx * 0.35, q < 0.08 ? WHITE : C[4], Math.max(0, 1 - q / 0.4));
          if (el === 'holy') sparkle(p, X, BOT - 20, 12 * Math.exp(-q / 0.2), C[5], C[3], 0.5);
        }
        ps.draw(p); lights.draw(p);
      },
    };
  });

  // ---------- 회오리: 회전 칼날 링 ----------
  const whirl = mod('GC 회오리', '회전하는 절삭 링', [120, 100], [60, 70], 0.65, {
    palette: PAL.bolt, sparks: sparksOf('bolt'), seed: 12,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf('bolt') });
    let t = 0, landed = false;
    return {
      update(dt) {
        t += dt;
        if (!landed && t >= 0.15) {
          landed = true;
          for (let i = 0; i < 12; i++) {
            const a = Rg.range(0, TAU), sp = Rg.range(80, 240);
            ps.spawn(P.SPARK, Math.cos(a) * 20, Math.sin(a) * 12, Math.cos(a) * sp, Math.sin(a) * sp, 0.3);
          }
        }
        if (t < 0.45 && Rg.chance(0.35)) {
          const a = t * 18; ps.spawn(P.MOTE, Math.cos(a) * 22, Math.sin(a) * 14, 0, -10, 0.25, C[4], 0.5);
        }
        ps.update(dt);
      },
      draw(p) {
        const al = t > 0.45 ? 1 - (t - 0.45) / 0.2 : Math.min(1, t * 6);
        const r = 14 + 12 * clamp(t / 0.2);
        for (let i = 0; i < 5; i++) {
          const a0 = t * 16 + i * TAU / 5, a1 = a0 + 0.95;
          for (let s = 0; s < 12; s++) {
            const u = s / 12, ang = a0 + (a1 - a0) * u;
            const x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.65 - 10;
            const w = Math.sin(u * Math.PI);
            const c = w > 0.7 ? WHITE : w > 0.35 ? C[5] : C[3];
            p.dot(x, y, c, al * (0.5 + 0.5 * w));
            if (w > 0.5) p.dot(x * 0.92, y * 0.92, C[4], al * 0.6);
          }
        }
        p.glow(0, -10, 18, C[3], 0.3 * al);
        ps.draw(p);
      },
    };
  });

  // ---------- 기타 형태 (컨셉 유지·간결) ----------
  const claw = mod('GC 할퀴기', '세 줄 발톱 절삭', [110, 80], [40, 50], 0.45, {
    palette: PAL.blood, sparks: sparksOf('blood'), seed: 13,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
    let t = 0;
    return {
      update(dt) { t += dt; if (t > 0.08 && t < 0.1) for (let i = 0; i < 8; i++) ps.spawn(P.SPARK, 20, -12, Rg.range(-40, 160), Rg.range(-120, 40), 0.25); ps.update(dt); },
      draw(p) {
        for (let i = 0; i < 3; i++) {
          const delay = i * 0.03, u = t - delay; if (u < 0 || u > 0.22) continue;
          const head = ease.outExpo(clamp(u / 0.06)), fade = u > 0.12 ? 1 - (u - 0.12) / 0.1 : 1;
          const ang = -0.9 + i * 0.15, cs = Math.cos(ang), sn = Math.sin(ang);
          for (let d = 0; d < 36 * head; d += 0.5) {
            const v = d / 36; p.dot(cs * d, -20 + sn * d + (i - 1) * 5, v > 0.7 ? WHITE : C[5], fade);
          }
        }
        ps.draw(p);
      },
    };
  });

  const beam = mod('GC 광선', '차지 후 직선 빔', [170, 60], [16, 36], 0.55, {
    palette: PAL.bolt, sparks: sparksOf('bolt'), reach: 100, seed: 14,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
    const TX = o.reach || 100;
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t > 0.12 && t < 0.4 && Rg.chance(0.4)) ps.spawn(P.SPARK, Rg.range(20, TX), -12 + Rg.range(-3, 3), Rg.range(40, 120), 0, 0.2);
        ps.update(dt);
      },
      draw(p) {
        if (t < 0.12) {
          for (let i = 0; i < 8; i++) p.dot(Math.cos(t * 20 + i) * (14 - t * 40), -12 + Math.sin(t * 20 + i) * (14 - t * 40), C[4], 0.8);
          p.glow(0, -12, 12, C[4], 0.4);
        } else {
          const fade = t > 0.4 ? 1 - (t - 0.4) / 0.15 : 1;
          for (let x = 0; x < TX; x += 0.5) {
            p.px(x, -12, WHITE); p.px(x, -13, C[5]); p.px(x, -11, C[5]);
            if (x % 3 < 1) p.px(x, -14, C[3]);
          }
          p.glowLine(0, -12, TX, -12, 5, C[4], 0.35 * fade);
          hitCross(p, TX, -12, 0, C, t - 0.12, 1);
        }
        ps.draw(p);
      },
    };
  });

  const ground = mod('GC 지면', '땅에서 솟는 충격·가시', [120, 100], [60, 85], 0.55, {
    palette: PAL.wood, sparks: sparksOf('wood'), seed: 15, el: 'wood',
  }, (o) => {
    const el = o.el || 'wood';
    const C = fit(o.palette || PAL[el] || PAL.wood, 7), Rg = new Rng(o.seed);
    const ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks || sparksOf(el) });
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t > 0.05 && t < 0.08) for (let i = 0; i < 10; i++) ps.spawn(P.GRIT, Rg.range(-20, 20), 0, Rg.range(-60, 60), Rg.range(-200, -40), 0.4, C[2], 1);
        ps.update(dt);
      },
      draw(p) {
        const g = ease.outBack(clamp(t / 0.1));
        for (let i = -2; i <= 2; i++) {
          const h = (18 + (2 - Math.abs(i)) * 10) * g;
          for (let y = 0; y < h; y++) p.px(i * 8, -y, y > h - 3 ? C[5] : C[2]);
          if (el === 'wood') { p.px(i * 8 - 2, -h + 2, C[4]); p.px(i * 8 + 2, -h + 3, C[3]); }
        }
        const rx = 10 + 24 * g;
        for (let a = 0; a < TAU; a += 0.15) p.dot(Math.cos(a) * rx, Math.sin(a) * rx * 0.3, C[3], Math.max(0, 1 - t / 0.45));
        ps.draw(p);
      },
    };
  });

  const curse = mod('GC 저주', '룬·사슬이 죄어듦', [110, 110], [55, 70], 0.7, {
    palette: PAL.dark, sparks: sparksOf('dark'), seed: 16,
  }, (o) => {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
    let t = 0;
    return {
      update(dt) {
        t += dt;
        if (t < 0.5 && Rg.chance(0.3)) ps.spawn(P.MOTE, Rg.range(-20, 20), Rg.range(-30, 10), 0, -15, 0.4, C[3], 0.6);
        ps.update(dt);
      },
      draw(p) {
        const r = 28 - 10 * ease.outCubic(clamp(t / 0.35));
        for (let a = 0; a < TAU; a += 0.2) {
          const x = Math.cos(a + t) * r, y = Math.sin(a + t) * r * 0.8 - 10;
          p.dot(x, y, C[4], 0.85);
          if (a % 1 < 0.2) p.px(x, y, C[5]);
        }
        // 눈
        if (t > 0.1) {
          p.px(0, -18, C[5]); p.px(-2, -18, C[3]); p.px(2, -18, C[3]); p.px(0, -17, WHITE);
        }
        p.glow(0, -10, 16, C[2], 0.3 * (1 - t / 0.7));
        ps.draw(p);
      },
    };
  });

  const shield = mod('GC 방패', '육각 보호막 전개', [100, 100], [50, 60], 0.5, {
    palette: PAL.holy, sparks: sparksOf('holy'), seed: 17,
  }, (o) => {
    const C = fit(o.palette, 7);
    let t = 0;
    return {
      update(dt) { t += dt; },
      draw(p) {
        const g = ease.outBack(clamp(t / 0.12));
        const fade = t > 0.3 ? 1 - (t - 0.3) / 0.2 : 1;
        const r = 22 * g;
        for (let i = 0; i < 6; i++) {
          const a0 = i * TAU / 6 - Math.PI / 2, a1 = (i + 1) * TAU / 6 - Math.PI / 2;
          p.line(Math.cos(a0) * r, Math.sin(a0) * r - 8, Math.cos(a1) * r, Math.sin(a1) * r - 8, C[5], fade);
        }
        for (let a = 0; a < TAU; a += 0.3) p.dot(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7 - 8, C[4], fade * 0.7);
        p.glow(0, -8, 18, C[3], 0.35 * fade);
        if (t < 0.15) sparkle(p, 0, -8, 10 * (1 - t / 0.15), C[5], C[3], 0.5);
      },
    };
  });

  // 간단 위임 형태
  const bite = claw;
  const psychic = curse;
  const spirit = orb;
  const note = beam;
  const rift = curse;
  const talisman = shield;
  const nova = whirl;
  const rain = smite;
  const burst = fist;

  const FORM = {
    slash, cleave, thrust, fist, stab, arrow, bullet, bomb, orb, beam, smite,
    whirl, claw, bite, ground, curse, psychic, spirit, note, rift, shield, talisman,
    nova, rain, burst,
    barrier: shield, field: shield, trap: curse, wall: ground, summon: talisman,
  };

  // hit 시각(초) — 브릿지 히트스톱·피해 동기화
  const HIT_AT = {
    slash: 0.1, thrust: 0.07, cleave: 0.22, fist: 0.09, stab: 0.2,
    arrow: 0.14, bullet: 0.1, bomb: 0.28, orb: 0.22, beam: 0.12, smite: 0.12,
    whirl: 0.15, claw: 0.1, ground: 0.08, curse: 0.25, shield: 0.12, burst: 0.09,
  };

  globalThis.FXGC = { FORM, PAL, HIT_AT, ramp, sparksOf, mod };
})();
