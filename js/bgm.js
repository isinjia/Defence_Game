// 배경 음악 — 영역 B. 장면(타이틀·지도·게이트·전투·보스·죽음)에 맞춰 곡을 바꾼다.
// 곡 파일은 assets/bgm/*.mp3 (모두 CC0, 출처는 assets/bgm/CREDITS.md). 필요한 곡만 그때 불러온다.
// 화면 전환 함수가 여러 겹으로 감싸여 있어, 전환마다 걸지 않고 화면 상태를 짧은 간격으로 읽어 곡을 정한다.
const BGM = {
  KEY: 'gc_bgm_v1',
  opt: { on: true, vol: 0.5 },
  DIR: 'assets/bgm/',
  TRACKS: { title: 'title.mp3', world: 'world.mp3', gate: 'gate.mp3', battle: 'battle.mp3', boss: 'boss.mp3', end: 'end.mp3' },
  FADE: 0.9, // 곡이 바뀔 때 겹쳐 넘어가는 시간(초)
  els: {}, gains: {}, cur: null, awake: false, bus: null,

  load() {
    try { const o = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (o) Object.assign(this.opt, o); } catch (e) { /* 기기 저장 불가 */ }
  },
  saveOpt() { try { localStorage.setItem(this.KEY, JSON.stringify(this.opt)); } catch (e) { /* 무시 */ } },
  vol() { return Math.max(0, Math.min(1, this.opt.vol)); },

  // 지금 화면에 어울리는 곡 이름
  want() {
    if (typeof UI === 'undefined') return 'title';
    const s = UI.screen;
    if (s !== 'game') return s === 'prologue' || s === 'pro-result' ? 'world' : 'title';
    if (typeof G !== 'undefined' && G && G.over) return 'end';
    const c = UI.ctx;
    if (c && c.combat && typeof c.combat.toggleAuto === 'function') { // 층 지도 단계의 ctx.combat 은 전투 객체가 아니다
      if (!c.combat.result) return (c.combat.units || []).some((u) => u.side === 'enemy' && u.boss) ? 'boss' : 'battle';
      return this.cur === 'boss' || this.cur === 'battle' ? this.cur : 'battle'; // 결과 창이 떠 있는 동안은 그대로
    }
    if (c) return 'gate'; // 게이트 안 탐색
    return 'world';
  },

  el(name) {
    if (this.els[name]) return this.els[name];
    const a = new Audio(); a.loop = true; a.preload = 'auto'; a.src = this.DIR + this.TRACKS[name];
    this.els[name] = a;
    // 아이폰은 audio.volume 을 바꿀 수 없어, 효과음과 같은 소리 장치(Web Audio)를 거쳐 음량을 조절한다
    try {
      const ctx = typeof SFX !== 'undefined' && SFX.ctx;
      if (ctx) {
        if (!this.bus || this.bus.context !== ctx) { this.bus = ctx.createGain(); this.bus.connect(ctx.destination); }
        const g = ctx.createGain(); g.gain.value = 0;
        ctx.createMediaElementSource(a).connect(g); g.connect(this.bus);
        this.gains[name] = g;
      }
    } catch (e) { /* 실패하면 audio.volume 으로 */ }
    if (!this.gains[name]) a.volume = 0;
    return a;
  },
  setLevel(name, v, fade) {
    const g = this.gains[name]; const a = this.els[name]; if (!a) return;
    if (g) { const t = g.context.currentTime; g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(v, t, fade ? this.FADE / 3 : 0.01); return; }
    // Web Audio 가 없을 때: 짧은 간격으로 직접 옮긴다
    clearInterval(a._fade);
    if (!fade) { a.volume = v; return; }
    const from = a.volume; const t0 = performance.now(); const ms = this.FADE * 1000;
    a._fade = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / ms); a.volume = from + (v - from) * k; if (k >= 1) clearInterval(a._fade); }, 50);
  },

  play(name) {
    if (name === this.cur) return;
    const old = this.cur; this.cur = name;
    if (old && this.els[old]) {
      const a = this.els[old]; this.setLevel(old, 0, true);
      clearTimeout(a._stop); a._stop = setTimeout(() => { if (this.cur !== old) a.pause(); }, this.FADE * 1000 + 400);
    }
    if (!name) return;
    const a = this.el(name); clearTimeout(a._stop);
    if (name !== 'world' && name !== 'gate') { try { a.currentTime = 0; } catch (e) { /* 아직 못 불러옴 */ } } // 지도·탐색 곡은 듣던 자리에서 잇는다
    this.setLevel(name, this.vol(), true);
    const p = a.play(); if (p && p.catch) p.catch(() => { /* 첫 터치 전이거나 파일을 못 읽음 */ });
  },
  stop() { this.play(null); },

  tick() {
    if (!this.awake) return;
    if (!this.opt.on || document.hidden) { if (this.cur) this.stop(); return; }
    this.play(this.want());
  },
  // 첫 터치 때 깨운다(모바일 브라우저는 사용자 동작 안에서 재생을 시작해야 한다)
  wake() {
    if (this.awake) return;
    this.awake = true; this.tick();
  },
};
BGM.load();

{
  // 효과음 쪽 깨우기(SFX.unlock)가 먼저 돌도록 버블 단계에 건다
  for (const ev of ['pointerdown', 'touchend', 'keydown']) document.addEventListener(ev, () => BGM.wake(), { passive: true });
  setInterval(() => BGM.tick(), 300);
  document.addEventListener('visibilitychange', () => BGM.tick());

  // ---------- 설정 창에 배경 음악 줄 ----------
  const baseHtml = UI.settingsHtml;
  UI.settingsHtml = function () {
    const o = BGM.opt;
    const rows = `<div class="set-row"><div><b>배경 음악</b><div class="small dim">타이틀, 지도, 게이트, 전투 음악</div></div><button class="${o.on ? 'primary' : ''}" data-act="set-bgm">${o.on ? '켜짐' : '꺼짐'}</button></div>
      <div class="set-row"><div><b>음악 음량</b> <span class="num small" id="set-bgm-vol-t">${Math.round(o.vol * 100)}</span></div><input type="range" id="set-bgm-vol" min="0" max="100" step="5" value="${Math.round(o.vol * 100)}" ${o.on ? '' : 'disabled'} aria-label="배경 음악 음량"></div>`;
    const h = baseHtml.call(this);
    const at = h.lastIndexOf('<div class="row end">');
    return at < 0 ? h + rows : h.slice(0, at) + rows + h.slice(at);
  };
  const baseOpen = UI.openSettings;
  UI.openSettings = function () {
    const r0 = baseOpen.call(this);
    const r = document.getElementById('set-bgm-vol');
    if (r) {
      r.addEventListener('input', () => { BGM.opt.vol = +r.value / 100; const t = document.getElementById('set-bgm-vol-t'); if (t) t.textContent = r.value; if (BGM.cur) BGM.setLevel(BGM.cur, BGM.vol(), false); });
      r.addEventListener('change', () => BGM.saveOpt());
    }
    return r0;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'set-bgm') { BGM.opt.on = !BGM.opt.on; BGM.saveOpt(); BGM.awake = true; BGM.tick(); return this.openSettings(); }
    return baseHandle.call(this, act, v);
  };
}
