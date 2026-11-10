// 타이틀 앞 세계관 오프닝. 게임 진행·저장 데이터와 독립적으로 재생한다.
const WorldOpening = (() => {
  const scenes = [
    { era: '2067년 · 제주', title: '처음으로, 하늘이 열렸다', image: 'assets/backgrounds/opening-jeju.webp', text: '제주에 정체를 알 수 없는 문이 나타났다.\n사람들은 훗날 그 문을 게이트라 불렀다.' },
    { era: '대붕괴', title: '문 너머의 세계가 밀려왔다', image: 'assets/prologue/gate-break.webp', text: '게이트는 한반도 곳곳으로 번졌다.\n쏟아져 나온 괴수들이 거리를 짓밟고, 익숙한 일상은 무너졌다.' },
    { era: '에테르와 각성자', title: '재앙 속에서, 누군가는 눈을 떴다', image: 'assets/prologue/awakening.webp', text: '낯선 에너지, 에테르는 사람들의 수명을 앗아갔다.\n그러나 그 힘에 적응한 이들은 한계를 넘어섰다. 사람들은 그들을 각성자라 불렀다.' },
    { era: '2087년 · 대붕괴로부터 20년', title: '이제, 당신의 차례다', image: 'assets/backgrounds/title-gate.webp', text: '각성자들은 헌터가 되어 게이트로 향한다.\n최초의 게이트가 남아 있는 제주. 그리고 아직 끝나지 않은 재앙.\n이 세계에서 어떤 삶을 살아갈지는, 당신의 선택에 달려 있다.' },
  ];
  const duration = 10000;
  let root = null, index = 0, paused = false, timer = null, returnFocus = null;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stop = () => { clearTimeout(timer); timer = null; };
  const schedule = () => {
    stop();
    if (root && !paused && !document.hidden) timer = setTimeout(next, duration);
  };
  const finish = () => {
    if (!root) return;
    stop(); root.remove(); root = null;
    document.removeEventListener('keydown', keydown, true);
    document.removeEventListener('visibilitychange', visibility);
    const target = returnFocus && returnFocus !== document.body && returnFocus.isConnected ? returnFocus : document.querySelector('.title-screen [data-act="new"]');
    if (target) target.focus();
    returnFocus = null;
  };
  const render = (focusAction) => {
    const scene = scenes[index];
    root.innerHTML = `<img class="opening-art" src="${scene.image}" alt="" aria-hidden="true" fetchpriority="high">
      <header class="opening-top"><span>세계의 기록</span><button type="button" data-opening="skip">스킵 · 타이틀로</button></header>
      <div class="opening-bottom">
        <article class="opening-story" aria-live="polite" aria-atomic="true"><p class="opening-era">${scene.era}</p><h2 id="opening-heading">${scene.title}</h2><p class="opening-text">${scene.text.replace(/\n/g, '<br>')}</p></article>
        <nav class="opening-controls" aria-label="세계관 오프닝 조작">
          <button type="button" data-opening="prev" ${index === 0 ? 'disabled' : ''}>이전</button>
          <span class="opening-count" aria-label="전체 ${scenes.length}장 중 ${index + 1}장">${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}</span>
          <button type="button" data-opening="pause" aria-pressed="${paused}">${paused ? '자동 진행' : '일시정지'}</button>
          <button type="button" class="opening-next" data-opening="next">${index === scenes.length - 1 ? '타이틀로' : '다음'} →</button>
        </nav>
      </div>`;
    // 한 장 앞 이미지만 미리 불러온다. 스킵 시 나머지 이미지는 받지 않는다.
    if (scenes[index + 1]) { const img = new Image(); img.src = scenes[index + 1].image; }
    if (focusAction) (root.querySelector(`[data-opening="${focusAction}"]:not(:disabled)`) || root.querySelector('[data-opening="next"]')).focus();
    schedule();
  };
  const next = () => {
    if (!root) return;
    if (index === scenes.length - 1) return finish();
    const action = root.contains(document.activeElement) ? document.activeElement.dataset.opening : null;
    index++; render(action);
  };
  const previous = () => { if (root && index > 0) { index--; render('prev'); } };
  const togglePause = () => {
    if (!root) return;
    paused = !paused;
    const button = root.querySelector('[data-opening="pause"]');
    button.textContent = paused ? '자동 진행' : '일시정지';
    button.setAttribute('aria-pressed', String(paused));
    schedule();
  };
  const visibility = () => { if (document.hidden) stop(); else schedule(); };
  const keydown = (event) => {
    if (!root) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); finish(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    else if (event.key === 'Tab') {
      const buttons = [...root.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  };
  const start = () => {
    if (root || UI.screen !== 'title') return;
    returnFocus = document.activeElement;
    index = 0; paused = reduced();
    root = document.createElement('section'); root.className = 'world-opening';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'opening-heading');
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-opening]'); if (!button || button.disabled) return;
      const action = button.dataset.opening;
      if (action === 'skip') finish(); else if (action === 'next') next(); else if (action === 'prev') previous(); else if (action === 'pause') togglePause();
    });
    document.body.appendChild(root);
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('visibilitychange', visibility);
    render('skip');
  };
  const addReplay = () => {
    const buttons = document.querySelector('.title-screen .btns');
    if (!buttons || buttons.querySelector('[data-act="world-opening"]')) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost';
    button.dataset.act = 'world-opening'; button.textContent = '세계관 다시 보기'; buttons.appendChild(button);
  };
  const baseTitle = UI.renderTitle;
  UI.renderTitle = function (...args) { const result = baseTitle.apply(this, args); addReplay(); return result; };
  const baseHandle = UI.handle;
  UI.handle = function (action, ...args) { if (action === 'world-opening') return start(); return baseHandle.call(this, action, ...args); };
  addReplay(); start();
  return { start, finish, get active() { return !!root; } };
})();
