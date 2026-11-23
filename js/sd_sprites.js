// ===== 전투 SD 도트 캐릭터 (사용자 요청 2026-11-23) =====
// 전투 아군의 원형 상반신 초상을 64도트 SD 캐릭터로 바꾼다. 아군은 화면 아래에서 위쪽 적을 보므로 뒷모습 줄을 쓴다.
// 자료(assets/sd/): body/{성별}_{직업}/{동작}.webp (머리를 뺀 몸·옷·무기 시트, 위 줄 정면·아래 줄 뒷면)
//                  head/{성별}_{머리}.webp (기준 자세 머리 [정면 칸, 뒷면 칸]) — 주인공은 '주'+새 파츠 번호, 일반 헌터는 예전 파츠 번호
//                  SD_DATA(js/sd_sprite_data.js): 무기 묶음별 동작 칸 크기·프레임 시간·프레임별 머리 변환, 직업 → 무기·역할
// 헌터마다 몸 시트 위에 머리를 변환해 얹고, 피부색·머리색을 칠한 시트를 한 번 만들어 둔다(외형 키로 캐시).
const SDSprite = (() => {
  const ROOT = 'assets/sd/';
  const MOTIONS = ['대기', '걷기', '달리기', '공격', '스킬', '피격', '사망'];
  const LOOP = { 대기: true, 걷기: true, 달리기: true };
  const BASE_SKIN = [222, 193, 173];
  const TONES = { fair: [246, 218, 200], medium: [220, 180, 150], tan: [182, 133, 95], deep: [133, 88, 65] };
  const OUTLINE = [34, 20, 30];
  const BOX_W = 180, BOX_H = 120, FOOT_X = 90, FOOT_Y = 92; // 보이는 칸: 사망(180×120)이 다 들어가는 크기, 발 위치 고정
  const data = () => (typeof SD_DATA !== 'undefined' ? SD_DATA : null);
  const imgs = new Map();
  const sheets = new Map();
  const live = new Set();

  const load = (src) => {
    if (!imgs.has(src)) imgs.set(src, new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error(src)); im.src = src; }));
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

  // ---------- 시트 만들기 ----------
  async function headCanvas(L) {
    const im = await load(`${ROOT}head/${L.g}_${L.hair}.webp`).catch(() => load(`${ROOT}head/${L.g}_0.webp`));
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    cv.getContext('2d').drawImage(im, 0, 0);
    if (L.hc) tintHair(cv, L.hc);
    return cv;
  }
  async function buildSheets(L) {
    const d = data(); const weapon = d.jobs[L.job] ? d.jobs[L.job].무기 : '검';
    const head = await headCanvas(L);
    const out = {};
    await Promise.all(MOTIONS.map(async (m) => {
      const mt = d.motions[weapon] && d.motions[weapon][m]; if (!mt) return;
      const body = await load(`${ROOT}body/${L.g}_${L.job}/${m}.webp`);
      const [cw, ch] = mt.칸, n = mt.시간.length;
      const cv = document.createElement('canvas'); cv.width = cw * n; cv.height = ch * 2;
      const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
      x.drawImage(body, 0, 0);
      ['정면', '뒷면'].forEach((dir, r) => {
        for (let i = 0; i < n; i++) {
          const M = mt.머리[dir][i]; if (!M) continue;
          x.save();
          x.beginPath(); x.rect(i * cw, r * ch, cw, ch); x.clip();
          x.setTransform(M[0], M[3], M[1], M[4], M[2] + i * cw, M[5] + r * ch);
          x.drawImage(head, 0, r * 96, 96, 96, 0, 0, 96, 96);
          x.restore();
        }
      });
      if (L.tone && L.tone !== 'natural') tintSkin(cv, L.tone);
      out[m] = { cv, cw, ch, n, t: mt.시간, foot: mt.발 };
    }));
    return out;
  }
  function sheetsFor(L) {
    const key = [L.g, L.job, L.hair, L.tone || 'natural', L.hc || ''].join('|');
    if (!sheets.has(key)) sheets.set(key, buildSheets(L).catch((e) => { sheets.delete(key); throw e; }));
    return sheets.get(key);
  }

  // ---------- 보이기·재생 ----------
  function draw(s) {
    const x = s.cv.getContext('2d'); x.clearRect(0, 0, BOX_W, BOX_H);
    const sh = s.sheets && s.sheets[s.motion]; if (!sh) return;
    const row = s.back ? 1 : 0;
    x.imageSmoothingEnabled = false;
    x.drawImage(sh.cv, s.frame * sh.cw, row * sh.ch, sh.cw, sh.ch, Math.round(FOOT_X - sh.foot[0]), Math.round(FOOT_Y - sh.foot[1]) + 1, sh.cw, sh.ch);
  }
  function play(s, motion, loop) {
    if (!s.sheets || !s.sheets[motion]) return;
    if (s.motion === '사망' && motion !== '사망' && motion !== '대기') return; // 쓰러진 뒤엔 되살아날 때만
    s.motion = motion; s.frame = 0; s.loop = loop != null ? loop : !!LOOP[motion]; s.t = 0;
    draw(s);
  }
  let last = 0, running = false;
  function tick(now) {
    const dt = last ? Math.min(400, now - last) : 16; last = now; // 화면 갱신이 느려져도(배경 탭 등) 실제 흐른 시간만큼 넘긴다
    for (const s of live) {
      if (!s.cv.isConnected) { live.delete(s); continue; }
      const sh = s.sheets && s.sheets[s.motion]; if (!sh) continue;
      s.t += dt;
      let moved = false;
      while (s.t >= sh.t[s.frame]) {
        s.t -= sh.t[s.frame];
        if (s.frame + 1 < sh.n) { s.frame++; moved = true; }
        else if (s.loop) { s.frame = 0; moved = true; }
        else if (s.motion === '사망') { s.t = 0; break; }
        else { s.motion = s.rest || '대기'; s.frame = 0; s.loop = true; moved = true; break; }
      }
      if (moved) draw(s);
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
    sheetsFor(L).then((sh) => {
      if (!spr.isConnected) return;
      const cv = document.createElement('canvas'); cv.width = BOX_W; cv.height = BOX_H; cv.className = 'sd-char';
      spr.dataset.sd = '1'; spr.dataset.cuBust = '1';
      spr.innerHTML = ''; spr.appendChild(cv);
      el.classList.add('sd-fig');
      const s = { cv, sheets: sh, motion: '대기', frame: 0, t: Math.random() * 200, loop: true, back: true };
      el._sd = s; live.add(s);
      if (el.classList.contains('dead')) { s.motion = '사망'; s.frame = sh['사망'] ? sh['사망'].n - 1 : 0; s.loop = false; }
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

  return { attach, onEvent, look, sheetsFor, play, MOTIONS };
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
