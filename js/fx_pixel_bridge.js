// ===== GC 픽셀 연출 브릿지 =====
// pixelfx 엔진(PIXELFX) + 우리 스킬 컨셉 모듈(FXGC)만 쓴다.
// 원본 sword-slash 등 stock 이펙트는 매핑하지 않는다.
(() => {
  if (typeof FXF === 'undefined' || typeof PIXELFX === 'undefined' || typeof FXGC === 'undefined') return;
  const PX = PIXELFX, GC = FXGC;
  const SCALE = 2.75;
  const active = [];
  let cv = null, ctx = null, raf = 0, last = 0, manual = false;

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

  function elKey(o) {
    const e = o.pal || o.el || 'none';
    return GC.PAL[e] ? e : 'none';
  }

  function pick(form) {
    return GC.FORM[form] || GC.FORM.orb;
  }

  function spawn(mod, from, to, o, onHit) {
    if (!mod || !ensure()) return;
    const meta = mod.meta || {};
    const [fw, fh] = meta.size || [120, 90];
    const [ox, oy] = meta.origin || [fw / 2, fh * 0.75];
    const form = o.form || '';
    const atTarget = form === 'cleave' || form === 'bomb' || form === 'smite' || form === 'ground'
      || form === 'nova' || form === 'curse' || form === 'psychic' || form === 'whirl'
      || form === 'shield' || form === 'barrier' || form === 'burst';
    const ang = atTarget ? 0 : Math.atan2(to.y - from.y, to.x - from.x);
    const el = elKey(o);
    const dist = Math.hypot(to.x - from.x, to.y - from.y) / SCALE;
    const opts = {
      x: ox, y: oy, angle: ang, flip: false,
      seed: (Math.random() * 1e9) | 0,
      palette: GC.PAL[el] || GC.PAL.none,
      sparks: GC.sparksOf(el),
      light: o.big || o.type === 'crit' ? 1.15 : 1,
      reach: Math.max(48, Math.min(100, dist * 0.85)),
      kind: o.type || 'dmg',
      big: !!o.big || o.type === 'crit',
      el, flask: !!o.flask,
    };
    const frame = PX.createFrame(fw, fh);
    const img = typeof ImageData !== 'undefined' ? new ImageData(fw, fh) : null;
    const tmp = document.createElement('canvas');
    tmp.width = fw; tmp.height = fh;
    const tctx = tmp.getContext('2d');
    tctx.imageSmoothingEnabled = false;

    const rawHit = GC.HIT_AT[form] != null ? GC.HIT_AT[form] : Math.min(0.14, (meta.duration || 0.55) * 0.25);
    const fx = PX.createFx(mod, opts);
    const along = atTarget ? 1 : 0.2;
    active.push({
      fx, frame, img, tmp, tctx, ox, oy, fw, fh, ang, o, onHit,
      hitT: rawHit, hitDone: false, stopMs: o.big || o.type === 'crit' ? 120 : 80,
      sx: from.x + (to.x - from.x) * along,
      sy: from.y + (to.y - from.y) * along,
    });
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
      it.fx.update(dt);
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
      ctx.drawImage(it.tmp, it.sx - it.ox * SCALE, it.sy - it.oy * SCALE, it.fw * SCALE, it.fh * SCALE);
      if (it.fx.done()) active.splice(i, 1);
    }
  }

  function hitHook(o, to) {
    return () => {
      try {
        if (FXF.kit && FXF.kit.hitAt) FXF.kit.hitAt(o, to.x, to.y, o.big || o.type === 'crit' ? 1.15 : 1);
        else if (FXF.accent) FXF.accent(o.pal || o.el, to.x, to.y, 1);
      } catch (e) { /* */ }
    };
  }

  const FORM = {};
  Object.keys(GC.FORM).forEach((k) => {
    FORM[k] = (from, to, o = {}) => {
      const opt = { ...o, form: k };
      // orb/smite 등은 속성 전달
      if (!opt.el && opt.pal) opt.el = opt.pal;
      spawn(pick(k), from, to, opt, hitHook(opt, to));
      if (o.type === 'multi' && (k === 'slash' || k === 'stab' || k === 'fist' || k === 'arrow' || k === 'bullet')) {
        const n = k === 'stab' ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const tt = { x: to.x + (Math.random() - 0.5) * 30, y: to.y + (Math.random() - 0.5) * 24 };
          setTimeout(() => spawn(pick(k), from, tt, { ...opt, type: 'dmg', big: false }, null), 60 + i * 60);
        }
      }
    };
  });

  if (FXF.AOE) {
    const aoe = (form, from, foes, o) => {
      (foes || []).forEach((f, i) => {
        setTimeout(() => spawn(pick(form), from, f, { ...o, form }, i === 0 ? hitHook(o, f) : null), i * 35);
      });
    };
    Object.assign(FXF.AOE, {
      slash(ids, from, foes, o) { aoe('whirl', from, foes, o); },
      whirl(ids, from, foes, o) { aoe('whirl', from, foes, o); },
      cleave(ids, from, foes, o) { aoe('cleave', from, foes, o); },
      rain(ids, from, foes, o) { aoe('smite', from, foes, o); },
      nova(ids, from, foes, o) {
        const c = foes && foes[0] ? foes[0] : from;
        spawn(pick('nova'), from, c, { ...o, form: 'nova' }, hitHook(o, c));
      },
      orb(ids, from, foes, o) { aoe('orb', from, foes, o); },
      fist(ids, from, foes, o) { aoe('fist', from, foes, o); },
      smite(ids, from, foes, o) { aoe('smite', from, foes, o); },
      ground(ids, from, foes, o) { aoe('ground', from, foes, o); },
    });
  }

  Object.assign(FXF.FORM, FORM);
  FXF.pixel = { spawn, active, SCALE, step, ensure, manual: (v) => { manual = !!v; } };
  if (FXF.kit) {
    FXF.kit.crescentFly = (from, to, o) => {
      spawn(GC.FORM.slash, from, to, { ...(o || {}), form: 'slash' }, null);
    };
  }
})();
