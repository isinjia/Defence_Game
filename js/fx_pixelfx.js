// ===== pixelfx 타격감 보강 (영역 B) =====
// 참고: https://github.com/patch-gg/pixelfx (MIT) — Hugo Duprez / Sprite Fusion 절차적 픽셀 VFX 기법
// 기존 WebGL 입자(js/fx_gl.js · fx_forms.js)를 유지한 채, 맞는 순간에만 얹는다.
// 핵심: ① 흰 히어로 프레임 ② 방향성 십자 섬광·스파크 원뿔 ③ 깨진 고리(치명) ④ 히트스톱·흔들림 동기화
// 팔레트는 pixelfx PAL 램프(어두운→밝은 단계)를 기존 hi/main/lo/deep 자리에 맞게 옮긴 것.
const FXPX = (() => {
  const TAU = Math.PI * 2;
  // pixelfx/src/core/color.js PAL 계열을 기존 4칸 API에 맞춤 (심·몸통·가장자리·그늘)
  const PAL = {
    fire: { hi: '#fff8d6', main: '#f2701f', lo: '#8c1d1c', deep: '#1f0b10' },
    ember: { hi: '#ffc46a', main: '#e0561e', lo: '#701a14', deep: '#1a0a0e' },
    bolt: { hi: '#ffffff', main: '#7cc8ff', lo: '#2550d0', deep: '#0a0f2e' },
    volt: { hi: '#ffffff', main: '#ffd23c', lo: '#a8680f', deep: '#24160a' },
    water: { hi: '#c4ecff', main: '#36a2e0', lo: '#14508c', deep: '#081830' },
    ice: { hi: '#ffffff', main: '#58b4ec', lo: '#1f4f94', deep: '#0c1430' },
    wood: { hi: '#e4ffb0', main: '#4f9a3a', lo: '#225224', deep: '#0c1a0e' },
    leaf: { hi: '#b4e070', main: '#4f9a3a', lo: '#225224', deep: '#0c1a0e' },
    holy: { hi: '#fffbe6', main: '#ffd84a', lo: '#9a6c18', deep: '#2a1c08' },
    heal: { hi: '#c8ffc4', main: '#3ec466', lo: '#17663e', deep: '#08201a' },
    dark: { hi: '#ecc8ff', main: '#9a48ec', lo: '#2c1a4a', deep: '#050308' },
    shadow: { hi: '#a970e0', main: '#5e3290', lo: '#1c1230', deep: '#050308' },
    none: { hi: '#ffffff', main: '#9aa6ba', lo: '#2e3648', deep: '#0c0e14' },
    blood: { hi: '#ff9a8a', main: '#d42a30', lo: '#6a101c', deep: '#14040a' },
    poison: { hi: '#e0ff8a', main: '#6cb82a', lo: '#265e18', deep: '#0d1a0c' },
    metal: { hi: '#d0d8e6', main: '#6e7a90', lo: '#2e3648', deep: '#0c0e14' },
  };

  let lastStop = 0;

  function patchPalettes() {
    if (typeof FXG === 'undefined' || !FXG.EL) return;
    // 기존 키는 유지하되 단계감·대비를 pixelfx 램프에 가깝게 (기능 삭제 없음)
    const map = {
      fire: PAL.fire, bolt: PAL.volt, water: PAL.water, wood: PAL.leaf,
      holy: PAL.holy, dark: PAL.shadow, none: PAL.none, blood: PAL.blood,
      ice: PAL.ice, poison: PAL.poison,
    };
    for (const [k, v] of Object.entries(map)) Object.assign(FXG.EL[k], v);
  }

  // 무대 히트스톱 — fx_feel 과 같은 CSS 클래스를 쓰되, 연출 맞는 순간에 짧게
  function hitstop(ms) {
    try {
      if (typeof FX !== 'undefined' && FX.reduced) return;
      const st = document.getElementById('stage');
      if (!st) return;
      const now = performance.now();
      if (now < lastStop) return;
      lastStop = now + ms * 0.55;
      st.classList.add('hitstop');
      clearTimeout(st._pxHs);
      st._pxHs = setTimeout(() => st.classList.remove('hitstop'), ms);
    } catch (e) { /* 무시 */ }
  }

  // 맞은 유닛 근처 유닛에 짧은 흰 틴트 (pixelfx hit-flash의 흰→붉은 비트)
  function bodyFlash(x, y, crit) {
    try {
      if (typeof FX !== 'undefined' && FX.reduced) return;
      let best = null, bd = 1e9;
      for (const el of document.querySelectorAll('#stage .unit')) {
        const r = el.getBoundingClientRect();
        if (!r.width) continue;
        const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
        if (d < bd) { bd = d; best = el; }
      }
      if (!best || bd > 90) return;
      best.classList.remove('px-hit', 'px-crit');
      void best.offsetWidth;
      best.classList.add(crit ? 'px-crit' : 'px-hit');
      clearTimeout(best._pxHit);
      best._pxHit = setTimeout(() => best.classList.remove('px-hit', 'px-crit'), crit ? 280 : 160);
    } catch (e) { /* 무시 */ }
  }

  // 방향성 십자 섬광 + 흰 심 (pixelfx impacts/hit-spark)
  function crossFlare(x, y, aim, E, sc, crit) {
    const G = FXG, R = G.R, p = G.p, burst = G.burst, rgb = G.rgb;
    const a = aim ?? R(-0.4, 0.4);
    // 1~2프레임 흰 히어로
    p('core', x, y, { s: [14 * sc, 36 * sc], c: ['#ffffff', E.hi], life: 0.045, a: 1, pop: true, fout: 0.15 });
    p('core', x, y, { s: [22 * sc, 8 * sc], c: ['#ffffff', E.main], life: 0.07, a: 0.95, pop: true, fout: 0.2 });
    // 비대칭 십자: 진행 방향 긴 팔, 뒤로 짧은 팔, 위아래 다른 길이
    const arms = [
      { ang: a, L: 72 * sc, w: 0.18 },
      { ang: a + Math.PI, L: 22 * sc, w: 0.2 },
      { ang: a - Math.PI / 2, L: 38 * sc, w: 0.22 },
      { ang: a + Math.PI / 2, L: 26 * sc, w: 0.2 },
      { ang: a - Math.PI / 4, L: 16 * sc, w: 0.12 },
    ];
    for (const r of arms) {
      p('spark', x + Math.cos(r.ang) * r.L * 0.35, y + Math.sin(r.ang) * r.L * 0.35, {
        rot: r.ang, s: [r.L * 0.45, r.L], asp: r.w, c: ['#ffffff', E.hi], life: 0.09, a: 1, pop: true, fout: 0.35,
      });
      p('spark', x + Math.cos(r.ang) * r.L * 0.4, y + Math.sin(r.ang) * r.L * 0.4, {
        rot: r.ang, s: [r.L * 0.4, r.L * 0.92], asp: r.w * 1.6, c: [E.hi, E.main], a: 0.7, life: 0.14, pop: true, fout: 0.4,
      });
    }
    // 만화식 타격선: 몸 쪽으로 찌르듯
    const n = crit ? 9 : 6;
    for (let i = 0; i < G.N(n); i++) {
      const ang = a + Math.PI + (-0.9 + (i / Math.max(1, n - 1)) * 1.8) + R(-0.08, 0.08);
      const L = R(28, 48) * sc;
      p('ray', x + Math.cos(ang) * (18 * sc), y + Math.sin(ang) * (18 * sc), {
        rot: ang, s: [L * 0.35, L], asp: 0.22, c: ['#ffffff', E.main], life: 0.16, a: 0.95,
        vx: Math.cos(ang) * L * 1.4, vy: Math.sin(ang) * L * 1.4, drag: 0.88, fout: 0.35, delay: R(0, 0.03),
      });
    }
    // 진행 방향 스파크 원뿔 + 중력 (hit-spark 스파크/칩)
    burst('spark', x, y, crit ? 14 : 9, {
      ang: a, spread: 0.55, v: [180 * sc, 420 * sc], sz: [12 * sc, 22 * sc, 2], asp: 0.28, face: true, stretch: 0.01,
      c: ['#ffffff', E.hi], life: [0.22, 0.42], ay: 520, drag: 0.94,
    });
    burst('shard', x, y, crit ? 8 : 5, {
      ang: a, spread: 0.9, v: [90 * sc, 220 * sc], sz: [8 * sc, 14 * sc, 3], asp: 0.45, face: true,
      c: [E.hi, E.main], life: [0.3, 0.5], ay: 780, drag: 0.96, rrot: true, rvr: 10,
    });
    G.spr('glow', x, y, 70 * sc, 70 * sc, 0, rgb(E.main), 0.55, true);
  }

  // 치명: 깨진 고리 + 별 과대 팽창 키프레임 (pixelfx impacts/crit-hit)
  function critBurst(x, y, aim, E, sc) {
    const G = FXG, p = G.p, burst = G.burst;
    const keys = [
      [0, 1.0], [0.025, 1.35], [0.055, 1.05], [0.09, 1.22],
    ];
    keys.forEach(([dl, s], i) => {
      G.at(dl, () => {
        p('star4', x, y, {
          s: [48 * sc * s, i === 0 ? 48 * sc * s : 8], c: i < 2 ? ['#ffffff', E.hi] : [E.hi, E.main],
          life: 0.1, a: 1 - i * 0.12, pop: true, fout: 0.25, rot: (aim || 0) + i * 0.2,
        });
      });
    });
    // 고리가 커지며 파편으로 갈라짐
    p('ring', x, y, { s: [36 * sc, 120 * sc], c: ['#ffffff', E.hi], life: 0.28, pop: true, fout: 0.35 });
    G.at(0.04, () => {
      p('ring', x, y, { s: [70 * sc, 170 * sc], c: [E.hi, E.main], a: 0.7, life: 0.32, pop: true, fout: 0.4 });
      burst('shard', x, y, 12, {
        ang: aim ?? 0, spread: Math.PI, v: [160 * sc, 380 * sc], sz: [14 * sc, 26 * sc, 4], asp: 0.35, face: true,
        c: [E.hi, E.main], life: [0.28, 0.55], ay: 420, drag: 0.9, rrot: true, rvr: 12,
      });
    });
    // 렌즈 플레어: 가로 긴 줄 + 짧은 세로
    p('spark', x, y, { rot: 0, s: [90 * sc, 160 * sc], asp: 0.08, c: ['#ffffff', E.hi], life: 0.2, pop: true, fout: 0.4 });
    p('spark', x, y, { rot: Math.PI / 2, s: [40 * sc, 70 * sc], asp: 0.1, c: [E.hi, E.main], a: 0.8, life: 0.18, pop: true, fout: 0.4 });
  }

  function aimOf(o, x, y) {
    if (o && o.from && Number.isFinite(o.from.x)) return Math.atan2(y - o.from.y, x - o.from.x);
    if (o && o._aim != null) return o._aim;
    return null;
  }

  // FXF.hitAt 가 호출하는 훅 — 속성 accent 뒤에 타격감을 얹음
  function onHit(o, x, y, sc = 1) {
    if (typeof FXG === 'undefined' || !FXG.init()) return;
    if (typeof FX !== 'undefined' && FX.reduced) return;
    const mode = (() => { try { return typeof FX3D !== 'undefined' && FX3D.opt ? FX3D.opt.mode : (JSON.parse(localStorage.getItem('gc_fx3d_v1') || '{}').mode || 'high'); } catch (e) { return 'high'; } })();
    if (mode === 'off') return;

    const crit = !!(o && (o.big || o.type === 'crit'));
    const e = (o && (o.pal || o.el)) || 'none';
    const E = (FXG.EL && FXG.EL[e]) || PAL[e] || PAL.none;
    const s = Math.min(1.35, (sc || 1) * (crit ? 1.15 : 1));
    const aim = aimOf(o, x, y);

    crossFlare(x, y, aim, E, s, crit);
    if (crit) critBurst(x, y, aim, E, s);

    // 히트스톱·흔들림: 평타도 짧게, 치명/큰 타격은 더 길게 (pixelfx act.hits)
    const stopMs = Math.round((crit ? 90 : 45) / Math.max(0.6, FXG.S.speed ? FXG.S.speed() : 1));
    hitstop(stopMs);
    FXG.shake(crit ? 5 : 2.5, crit ? 200 : 120);
    bodyFlash(x, y, crit);
  }

  // flash 를 더 펀치 있게: 첫 프레임 순백 강조 (기존 flash 는 유지, 앞에 한 겹)
  function punchFlash(x, y, E, sc = 1, delay = 0) {
    if (typeof FXG === 'undefined') return;
    const p = FXG.p;
    p('core', x, y, { s: [12 * sc, 40 * sc], c: ['#ffffff', '#ffffff'], life: 0.04, a: 1, pop: true, fout: 0.1, delay });
    p('star4', x, y, { s: [36 * sc, 120 * sc], c: ['#ffffff', E.hi], life: 0.1, a: 0.95, pop: true, fout: 0.2, delay });
  }

  function setup() {
    patchPalettes();
  }

  // 스크립트 로드 직후 팔레트 적용 (미리보기·전투 모두)
  try { setup(); } catch (e) { /* 무시 */ }

  return { PAL, onHit, punchFlash, setup, hitstop };
})();
