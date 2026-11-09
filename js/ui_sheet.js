// 정보 시트 정리 (영역 B, docs/모바일_조작_점검.md 중4)
// - "장비" 탭을 따로: 장착·가방·소모품·감정·성장형 무기 (정보 탭에서 길게 내려가지 않게)
// - 인생 기록·생애 통계는 연대기 탭으로
// 다른 파일들이 charHtml 에 덧붙이는 내용을 그대로 살리려고, 완성된 HTML을 구역(.sec) 제목으로 나눈다.
{
  const GEAR = ['장착 장비', '가방', '소모품', '감정 · 미감정', '성장형 무기'];
  const LIFE = ['인생 기록', '생애 통계'];
  const titleOf = (sec) => { const t = sec.querySelector(':scope > .sec-title'); return t ? t.textContent.trim() : ''; };
  const isIn = (list, t) => list.some((k) => t.startsWith(k));

  // 정보 탭 HTML에서 원하는 구역만 남기거나 빼낸다
  UI.charSections = function (keep) {
    const tpl = document.createElement('template'); tpl.innerHTML = this.charHtml();
    const panel = tpl.content.querySelector('.panel') || tpl.content;
    const secs = [...panel.querySelectorAll(':scope > .sec')];
    const out = [];
    for (const s of secs) { if (keep(titleOf(s))) out.push(s.outerHTML); else s.remove(); }
    return { rest: tpl.innerHTML, picked: out.join('') };
  };

  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function () {
    const name = this.sheet || 'char';
    if (name.startsWith('npc:')) return baseSheet.call(this);
    let html;
    if (name === 'gear') { this.sheet = 'char'; try { html = baseSheet.call(this); } finally { this.sheet = 'gear'; } }
    else html = baseSheet.call(this);
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    // 탭: 정보 뒤에 장비
    const tabs = tpl.content.querySelector('.sheet-head .tabs');
    if (tabs && !tabs.querySelector('[data-v="gear"]')) {
      const info = tabs.querySelector('[data-v="char"]');
      const b = document.createElement('button'); b.dataset.act = 'sheet'; b.dataset.v = 'gear'; b.textContent = '장비';
      if (info) info.after(b); else tabs.prepend(b);
      for (const x of tabs.querySelectorAll('button')) x.classList.toggle('on', x.dataset.v === name);
    }
    const body = tpl.content.querySelector('.sheet-body');
    try {
      if (body && name === 'gear') {
        const { picked } = this.charSections((t) => isIn(GEAR, t));
        body.innerHTML = `<div class="panel">${picked || '<div class="dim">장비가 없다.</div>'}</div>`;
      } else if (body && (name === 'char' || !name)) {
        const panel = body.querySelector('.panel');
        if (panel) for (const s of [...panel.querySelectorAll(':scope > .sec')]) { const t = titleOf(s); if (isIn(GEAR, t) || isIn(LIFE, t)) s.remove(); }
        if (panel && !panel.querySelector('.gear-link')) panel.insertAdjacentHTML('beforeend', '<div class="sec"><button class="full gear-link" data-act="sheet" data-v="gear">장비 · 가방 · 소모품 보기</button></div>');
      } else if (body && name === 'log') {
        const { picked } = this.charSections((t) => isIn(LIFE, t));
        if (picked) body.insertAdjacentHTML('afterbegin', `<div class="panel life-panel">${picked}</div>`);
      }
    } catch (e) { return html; }
    return tpl.innerHTML;
  };
}
