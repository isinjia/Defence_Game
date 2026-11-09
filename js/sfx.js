// 효과음 (Web Audio 합성, 파일 없음) + 안드로이드 진동 + 소리 설정 — 영역 B
// 첫 터치 때 소리 장치를 깨운다(모바일 브라우저는 사용자 동작 안에서 resume 해야 한다).
const SFX = {
  KEY: 'gc_sfx_v1',
  opt: { on: true, vol: 0.6, vib: true },
  ctx: null, master: null, noiseBuf: null, last: {},

  load() {
    try { const o = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (o) Object.assign(this.opt, o); } catch (e) { /* 기기 저장 불가 */ }
  },
  saveOpt() { try { localStorage.setItem(this.KEY, JSON.stringify(this.opt)); } catch (e) { /* 무시 */ } },
  canVibrate() { return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'; },

  unlock() {
    if (!this.opt.on) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        const n = this.ctx.sampleRate * 0.5; this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.ctx = null; }
  },

  // ---------- 합성 부품 ----------
  tone(freq, dur, { type = 'sine', vol = 0.3, at = 0, to = null, attack = 0.005 } = {}) {
    const c = this.ctx; const t0 = c.currentTime + at;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, { vol = 0.3, at = 0, freq = 1200, q = 1, type = 'bandpass', to = null } = {}) {
    const c = this.ctx; const t0 = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t0); s.stop(t0 + dur + 0.02);
  },

  // ---------- 소리 12종 ----------
  SOUNDS: {
    click(s) { s.tone(1800, 0.035, { type: 'square', vol: 0.06 }); },
    step(s) { s.noise(0.06, { vol: 0.12, freq: 260, q: 2 }); s.tone(90, 0.06, { vol: 0.08 }); },
    gate(s) { s.tone(55, 0.9, { type: 'sawtooth', vol: 0.12, to: 220, attack: 0.25 }); s.tone(110, 0.9, { vol: 0.12, to: 440, attack: 0.3 }); s.noise(0.9, { vol: 0.05, freq: 300, to: 2400 }); },
    hit(s, a) {
      const e = a.elem;
      if (e === 'fire') s.noise(0.16, { vol: 0.32, freq: 700, q: 0.6, type: 'lowpass', to: 200 });
      else if (e === 'water') { s.tone(2400, 0.14, { type: 'triangle', vol: 0.14, to: 1800 }); s.noise(0.05, { vol: 0.12, freq: 5000, q: 3 }); }
      else if (e === 'bolt') { for (let i = 0; i < 3; i++) s.noise(0.03, { vol: 0.2, freq: 3000 + i * 900, q: 4, at: i * 0.035 }); }
      else if (e === 'wood') { s.tone(180, 0.16, { type: 'triangle', vol: 0.16, to: 120 }); s.noise(0.07, { vol: 0.2, freq: 1200, q: 1.2 }); }
      else if (e === 'holy') { s.tone(880, 0.3, { type: 'triangle', vol: 0.12, to: 1320 }); s.tone(1320, 0.3, { vol: 0.07, to: 1760 }); }
      else if (e === 'dark') { s.tone(330, 0.3, { vol: 0.16, to: 220 }); s.tone(495, 0.3, { vol: 0.08, to: 330 }); }
      else { s.noise(0.08, { vol: 0.28, freq: 900, q: 0.8 }); s.tone(140, 0.08, { vol: 0.16, to: 70 }); }
      if (a.big) { s.tone(1320, 0.12, { type: 'triangle', vol: 0.12, at: 0.03 }); s.tone(1980, 0.16, { type: 'sine', vol: 0.08, at: 0.06 }); }
    },
    heal(s) { [523, 659, 784].forEach((f, i) => s.tone(f, 0.22, { type: 'triangle', vol: 0.1, at: i * 0.06 })); },
    down(s) { s.tone(300, 0.4, { type: 'sawtooth', vol: 0.1, to: 50 }); s.noise(0.25, { vol: 0.1, freq: 400, type: 'lowpass', to: 80 }); },
    turn(s) { s.tone(1046, 0.12, { type: 'sine', vol: 0.16 }); s.tone(1568, 0.22, { type: 'sine', vol: 0.12, at: 0.08 }); },
    btOk(s) { [392, 523, 659, 784, 1046].forEach((f, i) => s.tone(f, 0.5, { type: 'triangle', vol: 0.12, at: i * 0.09, attack: 0.02 })); },
    btFail(s) { s.tone(400, 0.6, { type: 'sawtooth', vol: 0.1, to: 90 }); s.tone(415, 0.6, { type: 'sawtooth', vol: 0.08, to: 85 }); s.noise(0.5, { vol: 0.12, freq: 1500, to: 200 }); },
    fanfare(s) { [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.32]].forEach(([f, t]) => s.tone(f, t === 0.32 ? 0.45 : 0.14, { type: 'square', vol: 0.07, at: t })); },
    alert(s) { for (let i = 0; i < 2; i++) { s.tone(880, 0.16, { type: 'square', vol: 0.08, at: i * 0.32 }); s.tone(660, 0.14, { type: 'square', vol: 0.08, at: i * 0.32 + 0.16 }); } },
    death(s) { s.tone(220, 2.2, { type: 'triangle', vol: 0.16, to: 40, attack: 0.05 }); s.tone(330, 1.8, { vol: 0.08, to: 60 }); s.noise(2, { vol: 0.05, freq: 600, type: 'lowpass', to: 60 }); },
  },
  // 같은 소리가 한꺼번에 몰리면 겹쳐 시끄러워지므로 최소 간격을 둔다
  GAP: { click: 40, step: 60, hit: 45, heal: 80 },

  play(name, arg = {}) {
    if (!this.opt.on || !this.SOUNDS[name]) return;
    if (!this.ctx) return; // 첫 터치 전에는 소리를 내지 않는다
    const now = performance.now(); const gap = this.GAP[name] || 0;
    if (gap && now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.master.gain.value = Math.max(0, Math.min(1, this.opt.vol));
      this.SOUNDS[name](this, arg);
    } catch (e) { /* 소리 실패는 무시 */ }
  },
  // 진동: 치명타·돌파·속보에만 아주 짧게 (아이폰 사파리는 지원하지 않음)
  buzz(pattern) {
    if (!this.opt.vib || !this.canVibrate()) return;
    try { navigator.vibrate(pattern); } catch (e) { /* 무시 */ }
  },
};
SFX.load();

// ---------- 화면에 걸기 ----------
{
  const wake = () => SFX.unlock();
  for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, wake, { capture: true, passive: true });
  // 버튼·선택지 클릭음
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button, [data-act]'); if (b && !b.disabled) SFX.play('click'); }, true);

  // 지도 한 칸 이동
  if (typeof Game !== 'undefined' && Game.prototype.walkStep) {
    const baseStep = Game.prototype.walkStep;
    Game.prototype.walkStep = function (...a) { SFX.play('step'); return baseStep.apply(this, a); };
  }

  // 게이트 진입
  const baseGate = UI.startGate;
  if (baseGate) UI.startGate = function (...a) { SFX.play('gate'); return baseGate.apply(this, a); };

  // 전투 연출
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev) {
      if (ev.k === 'dmg') { SFX.play('hit', { elem: ev.elem, big: !!(ev.crit || ev.eff) }); if (ev.crit) SFX.buzz(25); }
      else if (ev.k === 'heal' || ev.k === 'buff' || ev.k === 'mp') SFX.play('heal');
      else if (ev.k === 'down') SFX.play('down');
    }
    return baseApply.call(this, l);
  };
  // 내 차례 알림 (차례가 새로 왔을 때 한 번)
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    const r = baseControls.call(this);
    const c = this.ctx;
    if (c && c.combat) {
      const mine = c.combat.waiting && !c.playing && !c.combat.auto && !c.combat.result;
      if (mine && !c._turnSnd) SFX.play('turn');
      c._turnSnd = mine;
    }
    return r;
  };

  // 돌파 성공 / 실패
  const baseBt = FX.breakthrough;
  FX.breakthrough = function (ok, ...a) { SFX.play(ok ? 'btOk' : 'btFail'); SFX.buzz(ok ? [30, 60, 30] : 80); return baseBt.call(this, ok, ...a); };

  // 칭호·월드 퍼스트 팡파르, 속보 경보
  const baseToast = UI.toast;
  UI.toast = function (msg) {
    if (msg) {
      const t = String(msg);
      if (/칭호 획득|월드 퍼스트|최초/.test(t)) SFX.play('fanfare');
      else if (/속보|브레이크|경보/.test(t)) { SFX.play('alert'); SFX.buzz([40, 80, 40]); }
    }
    return baseToast.call(this, msg);
  };

  // 사망
  const baseOver = UI.showGameOver;
  if (baseOver) UI.showGameOver = function (...a) { SFX.play('death'); return baseOver.apply(this, a); };

  // ---------- 설정 창 ----------
  UI.settingsHtml = function () {
    const o = SFX.opt;
    return `<h3>설정</h3>
      <div class="set-row"><div><b>효과음</b><div class="small dim">버튼, 이동, 전투, 돌파, 알림 소리</div></div><button class="${o.on ? 'primary' : ''}" data-act="set-sfx">${o.on ? '켜짐' : '꺼짐'}</button></div>
      <div class="set-row"><div><b>음량</b> <span class="num small" id="set-vol-t">${Math.round(o.vol * 100)}</span></div><input type="range" id="set-vol" min="0" max="100" step="5" value="${Math.round(o.vol * 100)}" ${o.on ? '' : 'disabled'} aria-label="효과음 음량"></div>
      <div class="set-row"><div><b>진동</b><div class="small dim">${SFX.canVibrate() ? '치명타·돌파·속보에만 짧게' : '이 기기(브라우저)는 진동을 지원하지 않습니다'}</div></div><button class="${o.vib ? 'primary' : ''}" data-act="set-vib" ${SFX.canVibrate() ? '' : 'disabled'}>${o.vib ? '켜짐' : '꺼짐'}</button></div>
      <div class="row end"><button class="primary" data-act="modal-close">닫기</button></div>`;
  };
  UI.openSettings = function () {
    this.modal(this.settingsHtml(), 'settings-box');
    const r = document.getElementById('set-vol');
    if (r) {
      r.addEventListener('input', () => { SFX.opt.vol = +r.value / 100; const t = document.getElementById('set-vol-t'); if (t) t.textContent = r.value; });
      r.addEventListener('change', () => { SFX.saveOpt(); SFX.play('heal'); });
    }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'settings': return this.openSettings();
      case 'set-sfx': SFX.opt.on = !SFX.opt.on; SFX.saveOpt(); if (SFX.opt.on) { SFX.unlock(); SFX.play('turn'); } return this.openSettings();
      case 'set-vib': SFX.opt.vib = !SFX.opt.vib; SFX.saveOpt(); SFX.buzz(30); return this.openSettings();
    }
    return baseHandle.call(this, act, v);
  };
  // 지도 오른쪽 확대·축소 단추 아래에 설정 단추
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    const z = document.querySelector('.hud-zoom');
    if (z && !document.getElementById('set-btn')) z.insertAdjacentHTML('beforeend', `<button class="icon-btn" id="set-btn" data-act="settings" aria-label="설정(소리·진동)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg></button>`);
    return r;
  };
}
