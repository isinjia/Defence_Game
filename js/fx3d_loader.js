// three.js 스킬 이펙트(dist/fx3d.js, 약 470KB)는 첫 화면에 필요 없으므로 늦게 불러온다 (영역 B, 4-15).
// 지도가 뜬 뒤 잠시 쉬었다가, 또는 첫 전투·이펙트 미리 보기 때 불러온다. 못 불러오면 기존 CSS 효과만 쓴다.
const FX3D_LOADER = {
  src: (() => { try { const s = document.currentScript && document.currentScript.src; return s ? s.replace(/game\.js(\?|$)/, 'fx3d.js$1') : 'dist/fx3d.js'; } catch (e) { return 'dist/fx3d.js'; } })(),
  state: 'idle', // idle | loading | done | fail
  waiters: [],
  load(cb) {
    if (typeof FX3D !== 'undefined') { this.state = 'done'; if (cb) cb(true); return; }
    if (cb) this.waiters.push(cb);
    if (this.state === 'loading') return;
    if (this.state === 'fail') { this.flush(false); return; }
    this.state = 'loading';
    const s = document.createElement('script'); s.src = this.src; s.async = true;
    s.onload = () => { this.state = typeof FX3D !== 'undefined' ? 'done' : 'fail'; this.flush(this.state === 'done'); };
    s.onerror = () => { this.state = 'fail'; this.flush(false); };
    document.head.appendChild(s);
  },
  flush(ok) { const w = this.waiters; this.waiters = []; for (const f of w) { try { f(ok); } catch (e) { /* 무시 */ } } },
};
{
  const later = () => { const go = () => FX3D_LOADER.load(); if (window.requestIdleCallback) requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500); };
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) { const r = baseRender.apply(this, a); if (FX3D_LOADER.state === 'idle') later(); return r; };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { FX3D_LOADER.load(); return baseOpen.apply(this, a); };
  // 불러오기 전에 설정에서 이펙트 미리 보기를 누르면 불러온 뒤 연다
  const baseSet = UI.openSettings;
  if (baseSet) UI.openSettings = function (...a) {
    if (typeof FX3D === 'undefined' && FX3D_LOADER.state !== 'fail') { FX3D_LOADER.load(() => { if (this.modalOpen() && document.getElementById('set-vol')) baseSet.apply(this, a); }); }
    return baseSet.apply(this, a);
  };
}
