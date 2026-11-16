// 본편 코드가 도착하기 전에도 표시할 수 있는 진입 로딩 화면.
(() => {
  let root, previousFocus;
  const locked = new Map();
  const view = window.GateEntryLoading = {
    active: false,
    show(message = '게임을 준비하고 있습니다.') {
      if (!root) {
        root = document.createElement('div'); root.id = 'entry-loading';
        root.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="entry-loading-title" tabindex="-1"><div class="entry-spinner" aria-hidden="true"></div><h2 id="entry-loading-title">게임 준비 중</h2><p role="status" aria-live="polite"></p><button type="button" hidden>다시 시도</button></section>';
        document.body.appendChild(root);
      }
      if (!this.active) previousFocus = document.activeElement;
      this.active = true; root.hidden = false;
      for (const node of document.body.children) {
        if (node === root || /^(SCRIPT|STYLE|LINK)$/.test(node.tagName) || locked.has(node)) continue;
        locked.set(node, { inert: node.inert, hidden: node.getAttribute('aria-hidden') });
        node.inert = true; node.setAttribute('aria-hidden', 'true');
      }
      root.querySelector('p').textContent = message;
      root.querySelector('button').hidden = true;
      root.querySelector('section').focus({ preventScroll: true });
      document.body.classList.add('entry-loading-on');
    },
    stage(message) { if (root) root.querySelector('p').textContent = message; },
    fail(retry) {
      this.show('불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.');
      const button = root.querySelector('button'); button.hidden = false; button.onclick = retry; button.focus();
    },
    hide() {
      this.active = false;
      if (root) root.hidden = true;
      for (const [node, state] of locked) {
        node.inert = state.inert;
        if (state.hidden === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', state.hidden);
      }
      locked.clear(); document.body.classList.remove('entry-loading-on');
      const focus = previousFocus && previousFocus.isConnected ? previousFocus
        : [...document.querySelectorAll('#modal button, #app input, #app button')].find(node => !node.disabled && node.getClientRects().length);
      if (focus) focus.focus({ preventScroll: true });
    },
    paint() { return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); },
  };
  // 오래된 모바일 브라우저의 inert 미지원과 배경 단축키도 막는다.
  for (const type of ['click', 'keydown', 'pointerdown', 'touchstart']) {
    document.addEventListener(type, event => {
      if (!view.active || (root && root.contains(event.target))) return;
      event.preventDefault(); event.stopImmediatePropagation();
    }, { capture: true, passive: false });
  }
})();
