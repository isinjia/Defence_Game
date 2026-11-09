// 상성 공격이 먹혔는지/막혔는지 눈에 보이게 (영역 B, docs/구현_대기목록.md 4-6)
// - 맞는 순간: 우위 "약점! ▲"(크게·금색·크게 흔들림·강한 소리), 열세 "저항 ▼"(작게·회청색·방패에 튕김·둔한 소리)
//   아군이 약점을 맞으면 빨강. 색만이 아니라 ▲▼ 글자를 함께.
// - 고르기 전: 스킬을 고르면 적 위에 ▲/▼, 스킬 목록에도 지금 대상 기준 ▲/▼. 처음 보는 괴수도 처음부터 표시.
{
  const unitOf = (c, id) => c && c.combat && c.combat.units.find((u) => u.id === id);
  const kind = (name) => String(name || '').replace(/^\[[^\]]*\]\s*/, '');
  // 공격 속성 e가 대상 속성 t에 대해: 1 유리, -1 불리, 0 보통
  UI.elemEdge = function (e, t) {
    if (!e || !t || !ELEMENTS[e] || !ELEMENTS[t]) return 0;
    if (typeof elemEdge === 'function') return elemEdge(e, t); // 4-9 속성 개편 뒤의 상성 함수
    return elemEdge(e, t);
  };
  // 상성은 처음 보는 괴수도 처음부터 다 보여 준다 (사용자 요청: "?" 없음)
  UI.foeKnown = function () { return true; };
  const skillElem = (sk, att) => (sk.elem === 'self' ? att.elem : sk.elem);

  // ---------- 맞는 순간 ----------
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    let wait = baseApply.call(this, l);
    const c = this.ctx; const ev = l && l.ev;
    try {
      if (ev && ev.k === 'dmg' && c) {
        const dst = unitOf(c, ev.dst); const el = document.getElementById('u-' + ev.dst);
        const edge = dst ? this.elemEdge(ev.elem, dst.elem) : 0;
        const host = el && el.querySelector('.fx-host');
        if (edge && host) {
          const f = host.querySelector('.float-num:last-of-type');
          const mine = dst.side === 'ally';
          if (f) { f.classList.add(edge > 0 ? 'weak' : 'resist'); if (mine && edge > 0) f.classList.add('hurt-weak'); const base = f.style.fontSize || '22px'; f.style.fontSize = edge > 0 ? `calc(${base} * 1.3)` : `calc(${base} * .75)`; }
          FX.floatText(host, edge > 0 ? '약점! ▲' : '저항 ▼', 'edge ' + (edge > 0 ? (mine ? 'edge-bad' : 'edge-up') : 'edge-down'));
          if (edge > 0) { el.style.setProperty('--sh', FX.reduced ? 0 : 2); if (!FX.reduced) FX.pulse(el, 'hit', 420); }
          else { FX.pulse(el, 'deflect', 420); if (typeof SFX !== 'undefined') SFX.play('resist'); }
          if (edge > 0 && typeof SFX !== 'undefined') SFX.play('weak');
          wait += edge > 0 ? 60 : 0;
        }
      }
      // 쓰러뜨린 괴수 종은 기억한다 (다음부터 상성 미리 보기)
      if (ev && ev.k === 'down' && c) {
        const u = unitOf(c, ev.dst);
        if (u && u.side === 'enemy' && G.player) { const p = G.player; p.foeSeen ??= []; const k = kind(u.name); if (!p.foeSeen.includes(k)) p.foeSeen.push(k); }
      }
    } catch (e) { /* 연출 실패 무시 */ }
    return wait;
  };

  // ---------- 고르기 전 미리 보기 ----------
  UI.edgeMarks = function () {
    const c = this.ctx; if (!c || !c.combat) return;
    const cb = c.combat; const p = cb.player;
    const ready = cb.waiting && !c.playing && !cb.auto && !cb.result;
    const eff = (id) => (G.skillEff ? G.skillEff(skillById(id)) : skillById(id));
    const sel = ready && c.sel ? eff(c.sel) : null;
    const aimEnemy = sel && (SKILL_AIM[sel.type] || 'none') === 'enemy';
    // 적 위 표시
    for (const u of cb.units) {
      if (u.side !== 'enemy') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      let m = el.querySelector(':scope > .edge-mark');
      if (!aimEnemy || !u.alive) { if (m) m.remove(); continue; }
      const known = this.foeKnown(u); const edge = known ? this.elemEdge(skillElem(sel, p), u.elem) : 0;
      const txt = !known ? '?' : edge > 0 ? '▲' : edge < 0 ? '▼' : '';
      if (!txt) { if (m) m.remove(); continue; }
      if (!m) { el.insertAdjacentHTML('afterbegin', '<span class="edge-mark"></span>'); m = el.querySelector(':scope > .edge-mark'); }
      m.textContent = txt; m.className = 'edge-mark ' + (!known ? 'unk' : edge > 0 ? 'up' : 'down');
      m.title = !known ? '처음 보는 괴수: 상성을 모른다' : edge > 0 ? '상성 유리: 피해 증가' : '상성 불리: 피해 감소';
    }
    // 스킬 목록: 지금 대상 기준
    const t = cb.target && cb.target.alive ? cb.target : (this.rememberedFoe ? this.rememberedFoe() : null);
    for (const b of document.querySelectorAll('#cb-ctrl [data-act=c-skill]')) {
      const old = b.querySelector('.edge-tag'); if (old) old.remove();
      if (!t) continue;
      const sk = eff(b.dataset.v); if (!sk || (SKILL_AIM[sk.type] || 'none') !== 'enemy') continue;
      const known = this.foeKnown(t); const edge = known ? this.elemEdge(skillElem(sk, p), t.elem) : 0;
      if (!known && !sk.elem) continue;
      const txt = !known ? '?' : edge > 0 ? '▲' : edge < 0 ? '▼' : '';
      if (txt) b.insertAdjacentHTML('beforeend', `<span class="edge-tag ${!known ? 'unk' : edge > 0 ? 'up' : 'down'}" aria-label="${!known ? '상성 모름' : edge > 0 ? '상성 유리' : '상성 불리'}">${txt}</span>`);
    }
  };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) { const r = baseControls.apply(this, a); try { this.edgeMarks(); } catch (e) { /* 무시 */ } return r; };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) { const r = baseRefresh.apply(this, a); try { this.edgeMarks(); } catch (e) { /* 무시 */ } return r; };

  // 옛 저장: 본 괴수 목록
  if (Game.prototype.initSandbox) {
    const baseInit = Game.prototype.initSandbox;
    Game.prototype.initSandbox = function (...a) { const r = baseInit.apply(this, a); if (this.player) this.player.foeSeen ??= []; return r; };
  }

  // 효과음 두 가지 더 (약점: 날카롭게 / 저항: 둔하게 튕김)
  if (typeof SFX !== 'undefined') {
    SFX.SOUNDS.weak = (s) => { s.tone(1760, 0.1, { type: 'square', vol: 0.06, at: 0.02 }); s.tone(2640, 0.14, { type: 'triangle', vol: 0.08, at: 0.06 }); };
    SFX.SOUNDS.resist = (s) => { s.tone(220, 0.12, { type: 'triangle', vol: 0.12, to: 180 }); s.noise(0.06, { vol: 0.08, freq: 600, q: 4 }); };
  }
}
