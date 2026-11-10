// ===== 게이트 크로니클: 탐색 사건 한 화면 (사용자 요청, 영역 F) =====
// 탐색 사건(게이트 층 사건·시험 탐색·지도 탐사 지점)을 한 화면에: 위 = 장면 그림, 가운데 = 본문 전체(길면 그 칸만 스크롤),
// 아래 = 선택지(성공 확률·능력치, 리더 결정 줄 포함). 문장마다 눌러 넘기는 컷씬은 자동으로 띄우지 않는다.
// 맡을 사람을 고르는 창에서도 그림과 본문이 그대로 보인다. 결과 팝업은 그대로.
// explore_cutscene.js 의 그림(ExploreCinema.art)과 문장(scenes[id].lines)을 그대로 쓴다. 빌드 목록의 맨 뒤쪽에 둔다.
{
  const EC = typeof ExploreCinema !== 'undefined' ? ExploreCinema : null;
  // 자동 컷씬 끄기 (다시 보기 버튼으로 부른 것만 재생)
  if (EC) { const baseShow = EC.show; EC.show = (id, replay) => (replay ? baseShow(id, true) : undefined); }

  // 지금 열린 사건 창을 그림 / 본문 / 선택지 세 칸으로 다시 짠다
  const oneScreen = () => {
    const box = document.getElementById('modal-box'); if (!box || box.querySelector('.ex-one')) return;
    const cards = box.querySelector(':scope > .cards'); if (!cards) return;
    const kids = [...box.children];
    const art = box.querySelector(':scope > .ec-preview');
    const at = kids.indexOf(cards);
    const bodyEls = kids.slice(0, at).filter((el) => el !== art);
    const footEls = kids.slice(at);
    const wrap = document.createElement('div'); wrap.className = 'ex-one';
    const body = document.createElement('div'); body.className = 'ex-body';
    const foot = document.createElement('div'); foot.className = 'ex-foot';
    if (art) {
      const b = art.querySelector('button'); const id = b && b.dataset.v; if (b) b.remove();
      art.classList.add('ex-art'); wrap.appendChild(art);
      // 컷씬의 장면 문장을 본문 앞에 한 번에
      const sc = EC && id && EC.scenes[id];
      if (sc && sc.lines && sc.lines.length) { const p = document.createElement('p'); p.className = 'ex-lines'; p.textContent = sc.lines.join(' '); body.appendChild(p); }
    }
    const hasLines = !!body.querySelector('.ex-lines');
    for (const el of bodyEls) {
      if (el.classList.contains('eyebrow') || el.tagName === 'H3') body.insertBefore(el, body.querySelector('.ex-lines'));
      else if (hasLines && el.classList.contains('event-text')) el.remove(); // 장면 문장이 같은 내용을 더 자세히 담고 있다
      else body.appendChild(el);
    }
    for (const el of footEls) foot.appendChild(el);
    wrap.appendChild(body); wrap.appendChild(foot);
    box.appendChild(wrap); box.classList.add('ex-box');
    UI._exScene = { art: art ? art.outerHTML : '', body: body.innerHTML };
  };
  const wrapAfter = (name) => { const base = UI[name]; if (!base) return; UI[name] = function (...a) { const r = base.apply(this, a); oneScreen(); return r; }; };
  ['gateEvent', 'showExplore', 'showSite'].forEach(wrapAfter);

  // 맡을 사람 고르기(판정 시작) 창에도 그림과 본문을 남긴다
  const baseBegin = UI.ckBegin;
  if (baseBegin) UI.ckBegin = function (spec) {
    const sc = this._exScene;
    const r = baseBegin.call(this, spec);
    const box = document.getElementById('modal-box');
    if (sc && box && box.querySelector('[data-act="ck-who"]') && !box.querySelector('.ex-one')) {
      const wrap = document.createElement('div'); wrap.className = 'ex-one';
      const foot = document.createElement('div'); foot.className = 'ex-foot ex-pick';
      while (box.firstChild) foot.appendChild(box.firstChild);
      wrap.innerHTML = `${sc.art}<div class="ex-body">${sc.body}</div>`;
      wrap.appendChild(foot); box.appendChild(wrap); box.classList.add('ex-box');
      this._exScene = sc; // 그만두고 돌아가도 다시 쓸 수 있게
    }
    return r;
  };
  const baseClose = UI.closeModal;
  UI.closeModal = function (...a) { this._exScene = null; return baseClose.apply(this, a); };
  const baseResult = UI.ckResult;
  if (baseResult) UI.ckResult = function (...a) { this._exScene = null; return baseResult.apply(this, a); };
}
