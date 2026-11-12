// 메인 컷신 그림 (assets/main_cut/cut-*.webp, 1536×1024). 목록·장면은 docs/메인_컷신_목록.md.
// 메인 서술 줄에 art:'cut-…'가 있으면 대화창 뒤에 장면 그림을 띄운다. 그 장면이 끝날 때까지 남고,
// 다음 장면으로 넘어가거나 대화가 닫히면 내린다. 선택 뒤 이어지는 짧은 대사 동안에는 그대로 둔다.
// 인물 키(main_cast_art.js)와 겹치지 않게 'cut-'로 시작하는 키만 다룬다. 그림 로딩 실패는 대화를 막지 않는다.
if (typeof UI !== 'undefined') {
  const ROOT = 'assets/main_cut/';
  const isCut = (k) => typeof k === 'string' && /^cut-[a-z0-9-]+$/.test(k);
  const src = (k) => ROOT + k + '.webp';
  UI.mainCutSrc = (k) => (isCut(k) ? src(k) : null);
  UI.mainCutClear = function () { const el = document.getElementById('main-cut'); if (el) el.remove(); this._cut = null; };
  UI.mainCutShow = function (key) {
    if (!isCut(key) || this._cut === key) return;
    this._cut = key;
    let el = document.getElementById('main-cut');
    if (!el) { el = document.createElement('div'); el.id = 'main-cut'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('on')); }
    const img = new Image(); img.alt = ''; img.className = 'mc-img'; img.decoding = 'async';
    img.onerror = () => { img.remove(); if (!el.querySelector('img')) this.mainCutClear(); };
    img.src = src(key);
    for (const o of el.querySelectorAll('img')) { o.classList.add('out'); setTimeout(() => o.remove(), 700); }
    el.appendChild(img);
  };
  const baseShow = UI.dlgShow;
  UI.dlgShow = function (...a) {
    try {
      const d = this.dlg;
      if (d && !d._cutPre) { d._cutPre = true; for (const l of d.lines) if (isCut(l.art)) new Image().src = src(l.art); } // 미리 받아 둔다
      const line = d && d.lines[d.i];
      if (line && isCut(line.art)) this.mainCutShow(line.art);
    } catch (e) { /* 그림 실패는 대화를 막지 않는다 */ }
    return baseShow.apply(this, a);
  };
  const baseEnd = UI.dlgEnd;
  UI.dlgEnd = function (...a) {
    const r = baseEnd.apply(this, a);
    if (!this.dlg) this.mainCutClear(); // 이어지는 대화가 없으면 내린다
    return r;
  };
  // 다음 장면으로 넘어가면 앞 장면 그림은 내린다
  const basePlay = UI.mainPlay;
  UI.mainPlay = function (...a) { this.mainCutClear(); return basePlay.apply(this, a); };
  // 엔딩 화면 머리 그림
  const baseEH = UI.mainEndingHtml;
  UI.mainEndingHtml = function (...a) {
    const h = baseEH.apply(this, a); const M = G.flags && G.flags.main;
    if (!h || !M || !M.ending) return h;
    return h.replace('<div class="main-ending">', `<div class="main-ending"><img class="main-ending-cut" src="${src('cut-end-' + M.ending)}" alt="" onerror="this.remove()">`);
  };
}
