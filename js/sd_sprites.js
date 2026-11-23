// ===== 전투 SD 도트 캐릭터 (사용자 요청 2026-11-23, 정지 도트 방식) =====
// 전투 아군의 원형 상반신 초상을 SD 도트 캐릭터로 바꾼다. 아군은 화면 아래에서 위쪽 적을 보므로 뒷모습 줄을 쓴다.
// 프레임 그림을 따로 만들지 않는다: 깨끗한 정지 도트 한 장(몸·옷 + 머리 + 무기)을 겹치고, 동작은 도트 단위 이동·정확한 90도 회전·번쩍임으로만
// 표현한다(도트를 늘리거나 비틀지 않아 깨지지 않는다). 대기=숨쉬기, 공격=뛰어들기, 스킬=빛·도약, 피격=흰빛·밀려남, 사망=쓰러짐·흐려짐.
// 자료(assets/sd/): body/{성별}_{직업}.webp, head/{성별}_{머리}.webp, weapon/{무기}.webp — 모두 [정면; 뒷면] 두 줄, 같은 칸 크기
//                  SD_DATA(js/sd_sprite_data.js): 칸 크기·발 위치·무기 앞뒤·직업 -> 무기·역할
const SDSprite = (() => {
  const ROOT = 'assets/sd/';
  const MOTIONS = ['대기', '걷기', '달리기', '공격', '스킬', '피격', '사망'];
  const LOOP = { 대기: true, 걷기: true, 달리기: true };
  const LEN = { 공격: 520, 스킬: 900, 피격: 460, 사망: 1000 };   // 한 번 하고 끝나는 동작의 길이(밀리초)
  const BASE_SKIN = [222, 193, 173];
  const TONES = { fair: [246, 218, 200], medium: [220, 180, 150], tan: [182, 133, 95], deep: [133, 88, 65] };
  const OUTLINE = [34, 20, 30];
  const BOX_W = 180, BOX_H = 156, FOOT_X = 90, FOOT_Y = 146; // 보이는 칸: 쓰러진 모습·도약·빛이 다 들어가는 크기. 화면 1배(도트 그대로)
  const data = () => (typeof SD_DATA !== 'undefined' ? SD_DATA : null);
  const imgs = new Map();
  const sheets = new Map();
  const live = new Set();

  const load = (src) => {
    // 그림을 다시 내보내면 주소가 바뀌게 내보낸 시각을 붙인다(예전 그림이 브라우저에 남지 않게)
    if (!imgs.has(src)) imgs.set(src, new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error(src)); im.src = src + (data() && data().ver ? '?v=' + data().ver : ''); }));
    return imgs.get(src);
  };

  // ---------- 외형 읽기 ----------
  const jobOf = (cls, gender) => {
    const d = data(); let id = null;
    try {
      if (typeof HunterOutfits !== 'undefined') {
        const o = HunterOutfits.outfitFor(cls); const got = o && HunterOutfits.get(o, gender);
        id = got && got.familyId;
      }
    } catch (e) { /* 아래 기본값 */ }
    if (!id && d && d.jobs[cls]) id = cls;
    return id && d && d.jobs[id] ? id : 'swordsman';
  };
  const hairNo = (sel) => {
    const part = sel && sel.layers && sel.layers.find((p) => /hair-[mf]-\d+/.test(p.file || ''));
    const m = part && part.file.match(/hair-[mf]-(\d+)/);
    return m ? m[1] : '0';
  };
  function look(u) {
    try {
      if (u.isPlayer && typeof G !== 'undefined' && G.player) {
        const p = G.player, gender = p.gender === 'F' ? 'F' : 'M', g = gender === 'F' ? 'f' : 'm';
        const opts = typeof Wardrobe !== 'undefined' && Wardrobe.playerLook ? Wardrobe.playerLook() : {};
        if (typeof PlayerModularArt !== 'undefined' && PlayerModularArt.isPlayer(p.look, gender, opts)) {
          const s = PlayerModularArt.select(p.look, gender, opts);
          // 직업복을 입었으면 그 계열, 기본 복장(여성 1~3)이면 기본 옷, 그 밖은 직업에서
          const job = s.job && data().jobs[s.job] ? s.job : (g === 'f' && !s.job && data().jobs['기본' + s.outfit] ? '기본' + s.outfit : jobOf(u.cls || p.cls, gender));
          return { g, job, hair: '주' + s.hair, tone: opts.skinTone || p.skinTone, hc: null };
        }
        const sel = PortraitParts.select(p.look, gender, opts);
        return { g, job: jobOf(u.cls || p.cls, gender), hair: hairNo(sel), tone: sel.skinTone, hc: typeof HairColor !== 'undefined' ? HairColor.pick(p.look) : null };
      }
      let seed, gender, opts;
      if (u.npcId != null) {
        const n = G.npcById(u.npcId); if (!n) return null;
        seed = 'npc' + n.id + n.name; gender = n.gender; opts = UI.npcLook(n);
      } else if (u.portrait) {
        const q = u.portrait; seed = q.seed; gender = q.gender;
        opts = { ...(typeof Wardrobe !== 'undefined' && Wardrobe.appearance ? Wardrobe.appearance(u) : {}), ...q };
      } else return null;
      gender = gender === 'F' ? 'F' : 'M';
      const sel = PortraitParts.select(seed, gender, opts || {});
      return { g: gender === 'F' ? 'f' : 'm', job: jobOf(u.cls, gender), hair: hairNo(sel), tone: sel.skinTone, hc: typeof HairColor !== 'undefined' ? HairColor.pick(seed) : null };
    } catch (e) { return null; }
  }

  // ---------- 색 ----------
  const hsv = (r, g, b) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const s = mx ? (mx - mn) / mx : 0;
    let h = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI; if (h < 0) h += 360;
    return [h, s, mx / 255];
  };
  const isSkin = (r, g, b) => { const [h, s, v] = hsv(r, g, b); return h > 12 && h < 38 && s > 0.18 && s < 0.58 && v > 0.78; };
  const isOutline = (r, g, b) => Math.abs(r - OUTLINE[0]) + Math.abs(g - OUTLINE[1]) + Math.abs(b - OUTLINE[2]) < 6;
  function tintSkin(cv, tone) {
    const t = TONES[tone]; if (!t) return;
    const x = cv.getContext('2d'), im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
    const k = t.map((v, i) => v / BASE_SKIN[i]);
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3] || !isSkin(d[i], d[i + 1], d[i + 2])) continue;
      d[i] = Math.min(255, d[i] * k[0]); d[i + 1] = Math.min(255, d[i + 1] * k[1]); d[i + 2] = Math.min(255, d[i + 2] * k[2]);
    }
    x.putImageData(im, 0, 0);
  }
  // 일반 헌터 머리색: hair_color.js 의 3단 색(어두운·중간·밝은)을 머리 도트의 밝기 순서대로 입힌다
  function tintHair(cv, key) {
    const c = typeof HAIR_COLORS !== 'undefined' && HAIR_COLORS[key]; if (!c) return;
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [dk, md, lt] = c.ramp.map(hex);
    const x = cv.getContext('2d'), im = x.getImageData(0, 0, cv.width, cv.height), d = im.data;
    const idx = [], lum = [];
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (isOutline(r, g, b) || isSkin(r, g, b)) continue;
      const [h, s] = hsv(r, g, b);
      if (s > 0.45 && (h < 15 || h > 330)) continue; // 입술
      idx.push(i); lum.push(0.3 * r + 0.59 * g + 0.11 * b);
    }
    if (!idx.length) return;
    const sorted = lum.slice().sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.03)], hi = sorted[Math.floor(sorted.length * 0.97)] || lo + 1;
    idx.forEach((i, n) => {
      const t = Math.max(0, Math.min(1, (lum[n] - lo) / Math.max(1, hi - lo)));
      const [a, b, u] = t < 0.5 ? [dk, md, t * 2] : [md, lt, (t - 0.5) * 2];
      for (let k = 0; k < 3; k++) d[i + k] = a[k] + (b[k] - a[k]) * u;
    });
    x.putImageData(im, 0, 0);
  }

  // ---------- 한 장 만들기: 무기(뒤) + 몸 + 머리 + 무기(앞), 피부·머리색 칠하기 ----------
  async function buildSprite(L) {
    const d = data(); const N = d.칸; const weapon = d.jobs[L.job] ? d.jobs[L.job].무기 : '검';
    const [body, head, wpn] = await Promise.all([
      load(`${ROOT}body/${L.g}_${L.job}.webp`),
      load(`${ROOT}head/${L.g}_${L.hair}.webp`).catch(() => load(`${ROOT}head/${L.g}_0.webp`)),
      load(`${ROOT}weapon/${weapon}.webp`).catch(() => null),
    ]);
    const hc = document.createElement('canvas'); hc.width = head.width; hc.height = head.height;
    hc.getContext('2d').drawImage(head, 0, 0);
    if (L.hc) tintHair(hc, L.hc);
    const cv = document.createElement('canvas'); cv.width = N; cv.height = N * 2;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    ['정면', '뒷면'].forEach((dir, r) => {
      const layer = d.무기층[weapon] ? d.무기층[weapon][dir] : '앞';
      const part = (im) => x.drawImage(im, 0, r * N, N, N, 0, r * N, N, N);
      if (wpn && layer === '뒤') part(wpn);
      part(body); part(hc);
      if (wpn && layer !== '뒤') part(wpn);
    });
    if (L.tone && L.tone !== 'natural') tintSkin(cv, L.tone);
    // 빛·번쩍임용 실루엣(흰색)
    const sil = document.createElement('canvas'); sil.width = N; sil.height = N * 2;
    const sx = sil.getContext('2d'); sx.drawImage(cv, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, N, N * 2);
    return { cv, sil, N, foot: d.발 };
  }
  function sheetsFor(L) {
    const key = [L.g, L.job, L.hair, L.tone || 'natural', L.hc || ''].join('|');
    if (!sheets.has(key)) sheets.set(key, buildSprite(L).catch((e) => { sheets.delete(key); throw e; }));
    return sheets.get(key);
  }

  // ---------- 동작: 정수 이동·90도 회전·번쩍임만 ----------
  const ease = (a, b, t) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
  // 시간 t(밀리초)에서 [dx, dy, 눕기(0|1), 흰빛(0~1), 빛색|null, 투명도]. 아군은 위쪽(dy<0)이 적 방향
  function pose(m, t) {
    switch (m) {
      case '대기': return [0, Math.floor(t / 480) % 2, 0, 0, null, 1];
      case '걷기': return [0, -(Math.floor(t / 160) % 2), 0, 0, null, 1];
      case '달리기': return [0, -2 * (Math.floor(t / 100) % 2), 0, 0, null, 1];
      case '공격':
        if (t < 120) return [0, ease(0, 3, t / 120), 0, 0, null, 1];
        if (t < 240) return [0, ease(3, -12, (t - 120) / 120), 0, 0, null, 1];
        return [0, ease(-12, 0, (t - 240) / 280), 0, 0, null, 1];
      case '스킬':
        if (t < 260) return [0, ease(0, 4, t / 260), 0, 0, '#ffd84a', 1];
        if (t < 520) return [0, ease(4, -18, (t - 260) / 260), 0, 0, '#ffd84a', 1];
        return [0, ease(-18, 0, (t - 520) / 380), 0, t < 620 ? 0.6 : 0, '#ffd84a', 1];
      case '피격': {
        const k = Math.max(0, 1 - t / 460);
        return [Math.round(Math.sin(t / 22) * 2 * k), Math.round(6 * k), 0, t < 110 ? 1 : 0, null, 1];
      }
      case '사망':
        if (t < 140) return [0, 0, 0, 1, null, 1];
        if (t < 360) return [ease(0, -3, (t - 140) / 220), ease(0, 4, (t - 140) / 220), 0, 0, null, 1];
        return [0, 0, 1, 0, null, t < 600 ? 1 : Math.max(0.55, 1 - (t - 600) / 800)];
      default: return [0, 0, 0, 0, null, 1];
    }
  }
  function draw(s) {
    const x = s.cv.getContext('2d'); x.clearRect(0, 0, BOX_W, BOX_H);
    const sp = s.sp; if (!sp) return;
    const N = sp.N, row = s.back ? 1 : 0;
    const [dx, dy, lie, flash, glow, alpha] = pose(s.motion, s.t);
    x.imageSmoothingEnabled = false;
    x.save();
    x.globalAlpha = alpha;
    const ox = Math.round(FOOT_X - sp.foot[0]) + dx, oy = Math.round(FOOT_Y - sp.foot[1]) + dy;
    if (lie) {
      // 발 쪽을 축으로 옆으로 눕힌다(90도 회전은 도트가 그대로 돈다). 머리가 왼쪽, 발이 가운데 근처
      // 회전 후 발(fx, fy)이 (FOOT_X+50, FOOT_Y-28)에 오고 머리는 왼쪽, 몸 옆면이 바닥에 닿는다
      x.translate(FOOT_X + 50 + dx, FOOT_Y - 28 + dy);
      x.rotate(-Math.PI / 2);
      x.drawImage(sp.cv, 0, row * N, N, N, -Math.round(sp.foot[0]), -Math.round(sp.foot[1]), N, N);
    } else {
      if (glow) {
        const g = s.glowCv || (s.glowCv = (() => { const c = document.createElement('canvas'); c.width = N; c.height = N * 2; return c; })());
        const gx = g.getContext('2d'); gx.clearRect(0, 0, N, N * 2); gx.drawImage(sp.sil, 0, 0);
        gx.globalCompositeOperation = 'source-in'; gx.fillStyle = glow; gx.fillRect(0, 0, N, N * 2); gx.globalCompositeOperation = 'source-over';
        for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(g, 0, row * N, N, N, ox + a, oy + b, N, N);
      }
      x.drawImage(sp.cv, 0, row * N, N, N, ox, oy, N, N);
      if (flash) { x.globalAlpha = alpha * flash; x.drawImage(sp.sil, 0, row * N, N, N, ox, oy, N, N); }
    }
    x.restore();
  }
  function play(s, motion, loop) {
    if (!s.sp) return;
    if (s.motion === '사망' && motion !== '사망' && motion !== '대기') return; // 쓰러진 뒤엔 되살아날 때만
    s.motion = motion; s.t = 0; s.loop = loop != null ? loop : !!LOOP[motion];
    draw(s);
  }
  let last = 0, running = false;
  function tick(now) {
    const dt = last ? Math.min(400, now - last) : 16; last = now; // 화면 갱신이 느려져도(배경 탭 등) 실제 흐른 시간만큼 넘긴다
    for (const s of live) {
      if (!s.cv.isConnected) { live.delete(s); continue; }
      s.t += dt;
      const L = LEN[s.motion];
      if (!s.loop && L && s.t >= L && s.motion !== '사망') { s.motion = '대기'; s.loop = true; s.t = 0; }
      if (s.motion === '사망' && s.t > LEN['사망'] + 800) s.t = LEN['사망'] + 800;
      draw(s);
    }
    if (live.size) requestAnimationFrame(tick); else { running = false; last = 0; }
  }
  const run = () => { if (!running) { running = true; requestAnimationFrame(tick); } };

  // 아군 카드의 원형 초상 자리에 캐릭터를 넣는다
  function attach(u, el) {
    if (!data() || !u || !el || u.summon || u.side !== 'ally') return;
    const spr = el.querySelector('.fx-host > .sprite'); if (!spr || spr.dataset.sd) return;
    const L = look(u); if (!L) return;
    spr.dataset.sd = 'wait';
    sheetsFor(L).then((sp) => {
      if (!spr.isConnected) return;
      const cv = document.createElement('canvas'); cv.width = BOX_W; cv.height = BOX_H; cv.className = 'sd-char';
      spr.dataset.sd = '1'; spr.dataset.cuBust = '1';
      spr.innerHTML = ''; spr.appendChild(cv);
      el.classList.add('sd-fig');
      const s = { cv, sp, motion: '대기', t: Math.random() * 480, loop: true, back: true };
      el._sd = s; live.add(s);
      if (el.classList.contains('dead')) { s.motion = '사망'; s.t = LEN['사망'] + 800; s.loop = false; }
      draw(s); run();
    }).catch(() => { delete spr.dataset.sd; });
  }

  // 전투 사건 → 동작
  const unitEl = (id) => document.getElementById('u-' + id);
  function onEvent(ev) {
    if (!ev) return;
    const s = (id) => { const el = unitEl(id); return el && el._sd; };
    switch (ev.k) {
      case 'cast': { const a = s(ev.src); if (a && ev.side === 'ally') play(a, ev.name ? '스킬' : '공격', false); break; }
      case 'dash': { const a = s(ev.src); if (a) play(a, '달리기', true); break; }
      case 'dashBack': { const a = s(ev.src); if (a && a.motion === '달리기') play(a, '대기', true); break; }
      case 'dmg': { const a = s(ev.dst); if (a && !ev.killed && a.motion !== '사망') play(a, '피격', false); break; }
      case 'down': case 'flee': { const a = s(ev.dst != null ? ev.dst : ev.src); if (a) play(a, '사망', false); break; }
      case 'heal': { const a = s(ev.dst); if (a && ev.revive) { a.motion = '대기'; play(a, '대기', true); } break; }
      default: break;
    }
  }

  return { attach, onEvent, look, sheetsFor, play, draw, MOTIONS };
})();

// 카드 꾸미기 뒤에 캐릭터를 얹고, 전투 사건마다 동작을 바꾼다 (기존 함수는 감싸기로만 확장)
(() => {
  if (typeof UI === 'undefined') return;
  const baseDecorate = UI.decorateUnitCard;
  if (baseDecorate) {
    UI.decorateUnitCard = function (u, el) {
      const r = baseDecorate.apply(this, arguments);
      try { if (el && el.classList.contains('ally')) SDSprite.attach(u, el); } catch (e) { /* 초상 그대로 */ }
      return r;
    };
  }
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const r = baseApply.apply(this, arguments);
    try { SDSprite.onEvent(l && l.ev); } catch (e) { /* 연출만 생략 */ }
    return r;
  };
})();
