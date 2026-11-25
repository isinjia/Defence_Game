// ===== pixelfx 실연출 브릿지 =====
// GitHub patch-gg/pixelfx 의 픽셀아트 이펙트를 전투 FORM 에 붙인다.
// 부드러운 WebGL 글로우 대신, 저해상도 color+light 버퍼를 최근접 확대해 그린다.
(() => {
  if (typeof FXF === 'undefined' || typeof PIXELFX === 'undefined' || !PIXELFX.createFx) return;
  const PX = PIXELFX, FX = PX.effects || {};
  const SCALE = 2.75; // 도트 한 칸이 화면에서 읽히게
  const active = [];
  let cv = null, ctx = null, raf = 0, last = 0, manual = false;

  const PAL = {
    none: ['#212f6b', '#2c58aa', '#3a8bd8', '#62c8f4', '#b8c9e8', '#e8f1ff', '#ffffff'],
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

  function ensure() {
    if (cv) return true;
    if (typeof document === 'undefined') return false;
    cv = document.createElement('canvas');
    cv.id = 'fx-pixel';
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1260;image-rendering:pixelated;image-rendering:crisp-edges';
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    resize();
    window.addEventListener('resize', resize);
    return true;
  }
  function resize() {
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.max(2, Math.round(w * dpr));
    cv.height = Math.max(2, Math.round(h * dpr));
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function pick(form, o) {
    const el = o.pal || o.el || 'none';
    const t = o.type || 'dmg';
    const big = !!o.big || t === 'crit';
    if (form === 'slash') {
      if (t === 'pierce') return FX.thrust;
      if (t === 'multi' || big) return FX.doubleSlash;
      return FX.swordSlash;
    }
    if (form === 'cleave') return FX.hammerSmash || FX.heavyCleave || FX.groundSlam;
    if (form === 'thrust') return FX.thrust;
    if (form === 'fist') return big ? (FX.cartoonPow || FX.bluntHit) : (t === 'pierce' ? FX.uppercut : FX.bluntHit);
    if (form === 'stab') return FX.daggerFlurry;
    if (form === 'arrow') return FX.arrow;
    if (form === 'bullet') return FX.bulletTracer;
    if (form === 'bomb') return big ? FX.bigExplosion : FX.smallExplosion;
    if (form === 'shield') return FX.divineShield;
    if (form === 'orb') {
      if (el === 'fire') return FX.fireball || FX.fireBreath || FX.arcaneOrb;
      if (el === 'ice' || el === 'water') return FX.iceLance || FX.frostNova;
      if (el === 'bolt') return FX.zapHit || FX.lightningStrike;
      if (el === 'dark') return FX.darkExplosion;
      if (el === 'poison') return FX.poisonCloud;
      if (el === 'wood') return FX.leafStorm;
      if (el === 'holy') return FX.heal;
      return FX.arcaneOrb;
    }
    if (form === 'beam') return el === 'bolt' ? FX.chainLightning : FX.arcaneBeam;
    if (form === 'smite') return el === 'bolt' ? FX.lightningStrike : (FX.holySmite || FX.holyPillar || FX.heal);
    if (form === 'talisman') return FX.magicCircleCast;
    if (form === 'curse') return FX.curse || FX.hexSigil;
    if (form === 'psychic') return FX.hexSigil;
    if (form === 'claw') return FX.clawSwipe;
    if (form === 'bite') return FX.bluntHit;
    if (form === 'spirit') return FX.arcaneOrb;
    if (form === 'note') return FX.energyDisc;
    if (form === 'rift') return FX.darkExplosion;
    if (form === 'ground') return el === 'wood' ? FX.earthSpike : FX.groundSlam;
    if (form === 'whirl') return FX.spinSlash;
    if (form === 'nova') return el === 'ice' ? FX.frostNova : (el === 'fire' ? FX.fireRing : FX.critHit);
    if (form === 'rain') return el === 'bolt' ? FX.lightningStrike : FX.leafStorm;
    if (form === 'wall') return FX.earthSpike;
    if (form === 'trap') return FX.hexSigil;
    if (form === 'field') return FX.magicCircleCast;
    if (form === 'summon') return FX.magicCircleCast;
    if (form === 'barrier') return FX.divineShield;
    if (form === 'burst') return big ? FX.critHit : FX.hitSpark;
    return FX.hitSpark;
  }

  function elKey(o) {
    const e = o.pal || o.el || 'none';
    if (e === 'bolt' && (o.form === 'bullet' || o.type === 'crit')) return 'volt';
    return PAL[e] ? e : 'none';
  }

  function spawn(mod, from, to, o, onHit) {
    if (!mod || !ensure()) return;
    const meta = mod.meta || {};
    const [fw, fh] = meta.size || [96, 72];
    const [ox, oy] = meta.origin || [fw / 2, fh * 0.85];
    const tags = ((meta.name || '') + ' ' + (meta.tags || []).join(' ')).toLowerCase();
    const form = o.form || '';
    // 내려찍·충격·기둥·폭발은 대상 발밑에 각도 0, 그 외는 시전자→대상 방향
    const atTarget = form === 'cleave' || form === 'bomb' || form === 'smite' || form === 'ground' || form === 'nova'
      || form === 'curse' || form === 'psychic' || form === 'fist'
      || /hit|slam|explosion|nova|pow|smite|pillar|curse|hex|cloud|spike|stomp|pound/.test(tags);
    const ang = atTarget ? 0 : Math.atan2(to.y - from.y, to.x - from.x);
    const el = elKey(o);
    const opts = {
      x: ox,
      y: oy,
      angle: ang,
      flip: false,
      seed: (Math.random() * 1e9) | 0,
      palette: PAL[el] || PAL.none,
      sparks: sparksOf(el),
      light: o.big || o.type === 'crit' ? 1.15 : 1,
    };
    const dist = Math.hypot(to.x - from.x, to.y - from.y) / SCALE;
    if (meta.options && meta.options.radius != null) opts.radius = Math.max(28, Math.min(64, dist * 0.55));
    if (meta.options && meta.options.reach != null) opts.reach = Math.max(40, Math.min(90, dist * 0.75));

    const frame = PX.createFrame(fw, fh);
    const img = typeof ImageData !== 'undefined' ? new ImageData(fw, fh) : null;
    const tmp = document.createElement('canvas');
    tmp.width = fw; tmp.height = fh;
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = false;

    const rawHit = (mod.act && mod.act.hits && mod.act.hits[0] && mod.act.hits[0].t != null)
      ? Math.max(0, mod.act.hits[0].t)
      : Math.min(0.14, (meta.duration || 0.6) * 0.2);
    // 전투는 모바일 템포에 맞게 타격이 ~0.12초에 오게 압축
    // update(dt*speed) 로 이펙트 시간축을 압축 → 타격은 이펙트 시각 rawHit 에 옴
    const speed = Math.max(1, Math.min(4.5, rawHit > 0.02 ? rawHit / 0.12 : (meta.duration || 0.6) / 0.55));
    const stopMs = (mod.act && mod.act.hits && mod.act.hits[0] && mod.act.hits[0].stop)
      ? Math.min(160, mod.act.hits[0].stop * 1000)
      : 80;

    const fx = PX.createFx(mod, opts);
    // 방향성 베기는 시전자~대상 사이(25%)에 두어 궤적이 둘 사이를 가른다
    const along = atTarget ? 1 : 0.22;
    const item = {
      fx, frame, img, tmp, tctx, from, to, ox, oy, fw, fh, ang, o, onHit,
      hitT: rawHit, stopMs,
      hitDone: false, speed,
      sx: from.x + (to.x - from.x) * along,
      sy: from.y + (to.y - from.y) * along,
    };
    active.push(item);
    kick();
  }

  function kick() {
    if (manual || raf || !ensure()) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    if (active.length) raf = requestAnimationFrame(tick);
  }

  function step(dt) {
    if (!ensure()) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    for (let i = active.length - 1; i >= 0; i--) {
      const it = active[i];
      it.fx.update(dt * (it.speed || 1));
      if (!it.hitDone && it.fx.t >= it.hitT) {
        it.hitDone = true;
        try {
          if (typeof FXPX !== 'undefined' && FXPX.hitstop) FXPX.hitstop(it.stopMs);
          if (it.onHit) it.onHit();
        } catch (e) { /* */ }
      }
      PX.clearFrame(it.frame);
      it.fx.draw(it.frame, 'back');
      it.fx.draw(it.frame, 'front');
      if (it.img) {
        PX.composite(it.frame, it.img.data, null, it.o.big ? 1.1 : 1);
        it.tctx.putImageData(it.img, 0, 0);
      }
      // 원점(ox,oy)이 앵커. 화면 좌표 = 앵커 - origin*SCALE
      const dx = Math.cos(it.ang) * 18, dy = Math.sin(it.ang) * 18;
      const ax = it.sx + (it.atCaster === false ? 0 : dx * 0.15);
      const ay = it.sy + (it.atCaster === false ? 0 : dy * 0.15);
      const dw = it.fw * SCALE, dh = it.fh * SCALE;
      ctx.drawImage(it.tmp, ax - it.ox * SCALE, ay - it.oy * SCALE, dw, dh);
      if (it.fx.done()) active.splice(i, 1);
    }
  }

  function hitHook(o, to) {
    return () => {
      try {
        if (FXF.kit && FXF.kit.hitAt) FXF.kit.hitAt(o, to.x, to.y, o.big || o.type === 'crit' ? 1.2 : 1);
        else if (FXF.accent) FXF.accent(o.pal || o.el, to.x, to.y, 1);
      } catch (e) { /* */ }
    };
  }

  // FORM 전면 교체 — 픽셀 이펙트만 쓴다 (WebGL 소프트 연출은 보조 섬광만)
  const FORM = {};
  const keys = ['slash', 'cleave', 'thrust', 'fist', 'stab', 'arrow', 'bullet', 'bomb', 'shield', 'orb', 'beam', 'smite', 'talisman', 'curse', 'psychic', 'claw', 'bite', 'spirit', 'note', 'rift', 'ground', 'whirl', 'nova', 'rain', 'wall', 'trap', 'field', 'summon', 'barrier', 'burst'];
  keys.forEach((k) => {
    FORM[k] = (from, to, o = {}) => {
      const mod = pick(k, o);
      const opt = { ...o, form: k };
      spawn(mod, from, to, opt, hitHook(opt, to));
      // 다중/전체: 짧은 에코
      if (o.type === 'multi' && (k === 'slash' || k === 'stab' || k === 'fist')) {
        const n = k === 'stab' ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const tt = { x: to.x + (Math.random() - 0.5) * 36, y: to.y + (Math.random() - 0.5) * 28 };
          setTimeout(() => spawn(mod, from, tt, { ...opt, type: 'dmg', big: false }, null), 70 + i * 70);
        }
      }
    };
  });

  // AOE 맵도 픽셀로
  if (FXF.AOE) {
    const aoePix = (ids, from, foes, o, pickFn) => {
      (foes || []).forEach((f, i) => {
        setTimeout(() => {
          const mod = pickFn(o);
          spawn(mod, from, f, { ...o, form: 'aoe' }, i === 0 ? hitHook(o, f) : null);
        }, i * 40);
      });
    };
    Object.assign(FXF.AOE, {
      slash(ids, from, foes, o) { aoePix(ids, from, foes, o, () => FX.spinSlash || FX.doubleSlash); },
      whirl(ids, from, foes, o) { aoePix(ids, from, foes, o, () => FX.spinSlash); },
      cleave(ids, from, foes, o) { aoePix(ids, from, foes, o, () => FX.heavyCleave); },
      rain(ids, from, foes, o) { aoePix(ids, from, foes, o, (oo) => pick('rain', oo)); },
      nova(ids, from, foes, o) {
        const c = foes && foes[0] ? foes[0] : from;
        spawn(pick('nova', o), from, c, { ...o, form: 'nova' }, hitHook(o, c));
      },
    });
  }

  Object.assign(FXF.FORM, FORM);
  FXF.pixel = { spawn, active, SCALE, step, ensure, manual: (v) => { manual = !!v; } };

  // kit.crescentFly → 픽셀 슬래시
  if (FXF.kit) {
    FXF.kit.crescentFly = (from, to, o) => {
      spawn(FX.swordSlash, from, to, o || {}, null);
    };
  }
})();
