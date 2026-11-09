// 전투 손맛 (영역 B, docs/연출_손맛_제안.md 1~4)
// 1 체력 잔상 · 2 피해 크기에 따른 강약 · 3 처치·큰 타격의 잠깐 멈춤 · 4 쓰러짐 연출
// 동작 줄이기 설정에서는 흔들림·확대·멈춤을 끄고 번쩍임과 숫자만 남긴다. 자동·2배속에서는 멈춤을 줄인다.
{
  const unitOf = (c, id) => c && c.combat && c.combat.units.find((u) => u.id === id);
  const colorOf = (e) => (e && ELEMENTS[e] ? elemColor(e) : '#e3e8f1');
  // 빠르게 돌리는 중이면 연출 대기를 줄인다
  const pace = (c) => (FX.reduced ? 0 : (c && (c.combat.auto || (c.speed || 1) > 1)) ? 0.4 : 1);

  // ---------- 1. 체력 잔상 ----------
  UI.hpGhosts = function () {
    for (const bar of document.querySelectorAll('#stage .bar.hp')) {
      const i = bar.querySelector(':scope > i'); if (!i) continue;
      let g = bar.querySelector(':scope > b.gh');
      const w = parseFloat(i.style.width); if (isNaN(w)) continue;
      if (!g) { g = document.createElement('b'); g.className = 'gh'; g.style.width = w + '%'; bar.insertBefore(g, i); bar.dataset.w = w; continue; }
      const prev = +bar.dataset.w;
      if (Math.abs(w - prev) < 0.01) continue;
      bar.dataset.w = w;
      clearTimeout(g._t);
      if (w < prev) { g.classList.remove('heal'); g._t = setTimeout(() => { g.style.width = w + '%'; }, FX.reduced ? 0 : 400); }
      else { g.classList.add('heal'); g.style.width = w + '%'; }
    }
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) { const r = baseRefresh.apply(this, a); try { this.hpGhosts(); } catch (e) { /* 연출 실패 무시 */ } return r; };

  // 잠깐 멈춤: 무대의 반복 애니메이션을 멈추고 번쩍임은 남긴다
  const hitstop = (ms) => {
    const st = document.getElementById('stage'); if (!st || FX.reduced || ms <= 0) return;
    st.classList.add('hitstop'); clearTimeout(st._hs); st._hs = setTimeout(() => st.classList.remove('hitstop'), ms);
  };

  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const c = this.ctx; const ev = l && l.ev;
    let wait = baseApply.call(this, l);
    if (!ev || !c) return wait;
    try {
      const el = document.getElementById('u-' + (ev.dst != null ? ev.dst : ev.src));
      const k = pace(c);
      if (ev.k === 'dmg' && el) {
        // ---------- 2. 강약 ----------
        const u = unitOf(c, ev.dst);
        const ratio = u && u.maxHp ? Math.min(1, (ev.amt || 0) / u.maxHp) : 0.1;
        const scale = ratio < 0.05 ? 0.8 : ratio < 0.12 ? 1 : ratio < 0.3 ? 1.2 : 1.45;
        const host = el.querySelector('.fx-host');
        const f = host && host.querySelector('.float-num:last-of-type');
        if (f) f.style.fontSize = `calc(${ev.crit ? 30 : 22}px * ${scale})`;
        el.style.setProperty('--sh', FX.reduced ? 0 : (0.5 + Math.min(1.5, ratio * 4)).toFixed(2));
        // 큰 타격(체력 30% 이상)도 무대를 흔든다
        if (ratio >= 0.3 && !ev.crit && !FX.reduced) { const st = document.getElementById('stage'); if (st) FX.pulse(st, 'quake', 380); }
        // ---------- 3. 멈춤 ----------
        if (ev.crit || ratio >= 0.3) { const ms = Math.round(90 * k); hitstop(ms); wait += ms; }
      } else if (ev.k === 'down' && el) {
        // ---------- 4. 쓰러짐 ----------
        const u = unitOf(c, ev.dst); const host = el.querySelector('.fx-host');
        if (u && u.side === 'enemy') {
          FX.burst(host, colorOf(u.elem), u.boss ? 26 : 14);
          FX.pulse(el, 'dying', 700);
          this.coreDrop(host, u);
          const st = document.getElementById('stage');
          if (u.boss && st) { st.style.setProperty('--fc', colorOf(u.elem)); FX.pulse(st, 'flash', 500); if (!FX.reduced) FX.pulse(st, 'quake', 380); }
          const left = c.combat.units.some((x) => x.side === 'enemy' && x.alive && !x.fled && !x.summon);
          if (!left) {
            // 마지막 일격: 조금 더 길게 + 확대 + "전투 승리"
            const ms = Math.round(220 * (k || 0.5));
            hitstop(ms); wait += ms;
            if (st) { if (!FX.reduced) FX.pulse(st, 'finale', 900); const v = document.createElement('div'); v.className = 'win-stamp'; v.textContent = '전투 승리'; st.appendChild(v); setTimeout(() => v.remove(), 1400); }
          } else { const ms = Math.round(100 * k); hitstop(ms); wait += ms; }
        } else if (u) {
          FX.pulse(el, 'downed', 900);
          if (host) FX.floatText(host, '전투 불능', 'down-t');
          wait += Math.round(120 * k);
        }
      }
    } catch (e) { /* 연출 실패는 무시 */ }
    return wait;
  };

  // 쓰러진 자리에서 코어 결정이 튀어 오른다 (보스는 크게)
  UI.coreDrop = function (host, u) {
    if (!host) return;
    const d = document.createElement('i'); d.className = 'core-drop' + (u.boss ? ' big' : '');
    d.style.setProperty('--c', colorOf(u.elem));
    host.appendChild(d); setTimeout(() => d.remove(), 1200);
  };
}

// ---------- 8. 성장의 순간: 가운데 위에서 내려왔다 사라지는 띠 하나로 통일 ----------
// 경지 상승, 스킬 숙련·각성, 칭호 획득
{
  const snd = (n) => { if (typeof SFX !== 'undefined') SFX.play(n); };
  UI._bands = [];
  UI.growBand = function (head, sub, color) {
    this._bands.push({ head, sub, color });
    if (this._bands.length === 1) this.nextBand();
  };
  UI.nextBand = function () {
    const b = this._bands[0]; if (!b) return;
    const el = document.createElement('div');
    el.className = 'grow-band'; el.style.setProperty('--c', b.color || 'var(--amber)');
    el.innerHTML = `<b>${b.head}</b>${b.sub ? `<span>${b.sub}</span>` : ''}`;
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); this._bands.shift(); this.nextBand(); }, FX.reduced ? 1600 : 2200);
  };

  // 경지 상승 (초기 → 중기 → 후기)
  const baseEther = Game.prototype.addEther;
  Game.prototype.addEther = function (...a) {
    const p = this.player; const before = p ? p.stage : 0;
    const r = baseEther.apply(this, a);
    if (p && p.stage > before && this === G) {
      UI.growBand(`${STAGE_NAMES[p.stage]} 진입`, rankLabel(p.rankIdx, p.stage), '#ffb547');
      UI._cardGlow = true; snd('btOk');
    }
    return r;
  };
  // 스킬 숙련·각성
  const baseUse = Game.prototype.skillUse;
  if (baseUse) Game.prototype.skillUse = function (...a) {
    const msg = baseUse.apply(this, a);
    if (msg && this === G) {
      const m = /^\[(스킬 [^\]]+)\]\s*(.*)$/.exec(msg);
      UI.growBand(m ? m[1] : '스킬 숙련', m ? m[2] : msg, m && m[1] === '스킬 각성' ? '#c58cff' : '#6fc8ff');
      snd('heal');
    }
    return msg;
  };
  // 칭호 획득 알림은 띠로
  const baseToast = UI.toast;
  UI.toast = function (msg) {
    const m = /^칭호 획득 · (.*)$/.exec(String(msg || ''));
    if (m) return this.growBand('칭호 획득', m[1], '#ffd166');
    return baseToast.call(this, msg);
  };
  // 경지가 오른 뒤 지도로 돌아오면 인물 카드가 한 번 빛난다
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    if (this._cardGlow) { const c = document.getElementById('hud-card'); if (c) { this._cardGlow = false; FX.pulse(c, 'card-glow', 1400); } }
    return r;
  };
}

// ---------- 7. 등장 연출: 게이트 진입 균열, 보스 이름, 레드 게이트 맥박 ----------
{
  UI.riftWipe = function () {
    if (FX.reduced) return;
    const el = document.createElement('div'); el.className = 'rift-wipe'; el.innerHTML = '<i></i>';
    document.body.appendChild(el); setTimeout(() => el.remove(), 800);
  };
  const baseGate = UI.startGate;
  if (baseGate) UI.startGate = function (...a) { this.riftWipe(); return baseGate.apply(this, a); };

  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) {
    const r = baseOpen.apply(this, a);
    try {
      const c = this.ctx; const box = document.getElementById('modal-box');
      if (box) box.classList.toggle('red-gate', !!(c && c.gate && c.gate.variant === 'red'));
      const boss = c && c.combat && c.combat.units.find((u) => u.side === 'enemy' && u.boss && u.alive);
      const st = document.getElementById('stage');
      if (boss && st) {
        const el = document.createElement('div'); el.className = 'boss-call';
        el.innerHTML = `<span>BOSS</span><b></b>`; el.querySelector('b').textContent = boss.name.replace(/^\[[^\]]*\]\s*/, '');
        st.appendChild(el); setTimeout(() => el.remove(), FX.reduced ? 900 : 1700);
        if (typeof SFX !== 'undefined') SFX.play('gate');
      }
    } catch (e) { /* 연출 실패 무시 */ }
    return r;
  };
}

// ---------- 6. 보상 확인의 순간: 결과 줄을 하나씩, 크레딧은 숫자가 올라가고, 귀한 것은 빛과 소리 ----------
{
  const snd = (n) => { if (typeof SFX !== 'undefined') SFX.play(n); };
  const RARE = /보스 드롭|유물|히든|숨겨진|전설|각성|재앙 저지|희귀|감정|성장형|코어/;
  UI.revealRewards = function () {
    const box = document.getElementById('modal-box'); if (!box) return;
    const ps = [...box.querySelectorAll(':scope > p')];
    if (!ps.length) return;
    const step = FX.reduced ? 0 : 260;
    ps.forEach((p, i) => {
      const rare = RARE.test(p.textContent);
      p.classList.add('reward-pop'); if (rare) p.classList.add('rare');
      p.style.animationDelay = (i * step) + 'ms';
      if (step) setTimeout(() => { if (p.isConnected) snd(rare ? 'fanfare' : 'click'); }, i * step + 40);
    });
    // 첫 "획득: N 크레딧" 숫자 올리기
    const first = ps.find((p) => /[0-9][0-9,]*\s*크레딧/.test(p.innerHTML));
    if (first && !FX.reduced) {
      const m = /([0-9][0-9,]*)\s*크레딧/.exec(first.innerHTML);
      if (m) {
        const target = +m[1].replace(/,/g, ''); const id = 'cnt-' + Date.now();
        first.innerHTML = first.innerHTML.replace(m[0], `<span class="num" id="${id}">0</span> 크레딧`);
        const el = document.getElementById(id); const t0 = performance.now(); const dur = 800;
        const tick = (now) => { if (!el.isConnected) return; const k = Math.min(1, (now - t0) / dur); el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }
  };
  const baseFinish = UI.finishGate;
  UI.finishGate = function (result, ...a) {
    const r = baseFinish.call(this, result, ...a);
    if (result !== 'lose') try { this.revealRewards(); } catch (e) { /* 무시 */ }
    return r;
  };
}

// ---------- 9. 지도의 손맛: 도착 파문, 지나가는 게이트의 반응, 브레이크 게이트 붉은 맥박과 가장자리 방향 표시 ----------
if (typeof MapView !== 'undefined') {
  const MP = MapView.prototype;
  MP.addRipple = function (x, y, color, big) { (this.fxr ||= []).push({ x, y, color, big: !!big, t0: this.t }); };
  const baseDraw = MP.draw;
  MP.draw = function () {
    baseDraw.call(this);
    if (!G.player) return;
    const c = this.ctx, s = this.tile, t = this.t;
    try {
      // 파문
      if (this.fxr && this.fxr.length) {
        this.fxr = this.fxr.filter((r) => t - r.t0 < (r.big ? 50 : 36));
        for (const r of this.fxr) {
          const k = (t - r.t0) / (r.big ? 50 : 36);
          const [px, py] = this.toScreen(r.x + 0.5, r.y + 0.5);
          c.save(); c.globalAlpha = 1 - k; c.strokeStyle = r.color; c.lineWidth = 2;
          c.beginPath(); c.ellipse(px, py + s * 0.28, s * (0.2 + k * (r.big ? 0.9 : 0.55)), s * (0.08 + k * (r.big ? 0.4 : 0.22)), 0, 0, Math.PI * 2); c.stroke(); c.restore();
        }
      }
      // 브레이크 게이트: 붉은 맥박, 화면 밖이면 가장자리에 방향 표시
      const brk = (G.mapGates || []).filter((g) => g.breakCity && !g.cleared);
      for (const g of brk) {
        const [px, py] = this.toScreen(g.x + 0.5, g.y + 0.5);
        const pad = 56;
        if (px > -s && py > -s && px < this.w + s && py < this.hgt + s) {
          const k = FX.reduced ? 0.5 : (t % 60) / 60;
          c.save(); c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = '#ff4f6a'; c.lineWidth = 3;
          c.beginPath(); c.arc(px, py, s * (0.45 + k * 0.5), 0, Math.PI * 2); c.stroke(); c.restore();
        } else {
          const cx = this.w / 2, cy = this.hgt / 2; const dx = px - cx, dy = py - cy;
          const sc = Math.min((cx - pad) / Math.abs(dx || 1), (cy - pad) / Math.abs(dy || 1));
          const ex = cx + dx * sc, ey = cy + dy * sc; const ang = Math.atan2(dy, dx);
          const blink = FX.reduced || (t % 40) < 28;
          if (blink) {
            c.save(); c.translate(ex, ey); c.rotate(ang); c.fillStyle = '#ff4f6a'; c.shadowColor = '#ff4f6a'; c.shadowBlur = 10;
            c.beginPath(); c.moveTo(12, 0); c.lineTo(-6, -9); c.lineTo(-2, 0); c.lineTo(-6, 9); c.closePath(); c.fill(); c.restore();
          }
        }
      }
    } catch (e) { /* 연출 실패 무시 */ }
  };

  // 걷기가 끝나면 발밑에 파문
  const baseEnd = UI.endWalk;
  if (baseEnd) UI.endWalk = function (...a) {
    const r = baseEnd.apply(this, a);
    if (this.map && G.player) this.map.addRipple(G.player.x, G.player.y, '#46e0d0');
    return r;
  };
  // 게이트 근처를 지나면 게이트가 꿈틀
  const baseStep = Game.prototype.walkStep;
  Game.prototype.walkStep = function (x, y, ...a) {
    const r = baseStep.call(this, x, y, ...a);
    try {
      if (this === G && UI.map) for (const g of this.mapGates || []) {
        if (g.cleared || Math.max(Math.abs(g.x - x), Math.abs(g.y - y)) > 1) continue;
        const seen = (UI.map._ripSeen ||= new Map()); if (seen.get(g.id) === UI.map.t) continue; seen.set(g.id, UI.map.t);
        UI.map.addRipple(g.x, g.y, g.variant === 'red' || g.breakCity ? '#ff4f6a' : '#c58cff', true);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
