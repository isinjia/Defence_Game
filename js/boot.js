// 오프닝은 게임 계산 없이 바로 표시한다. 본편은 첫 입력 또는 오프닝 종료 시 준비한다.
(() => {
  const source = document.currentScript.dataset.game;
  let loading = null, actionPending = false;
  window.GateBoot = {
    ready: false,
    load() {
      if (loading) return loading;
      const artwork = document.querySelector('.title-art[data-src]');
      if (artwork && !artwork.src) artwork.src = artwork.dataset.src;
      const fonts = document.getElementById('game-fonts');
      if (fonts && !fonts.href) { fonts.rel = 'stylesheet'; fonts.href = fonts.dataset.href; }
      loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = source;
        script.onload = () => {
          GateBoot.ready = true;
          document.dispatchEvent(new Event('gate-game-ready'));
          resolve();
        };
        script.onerror = () => {
          script.remove(); loading = null;
          reject(new Error('게임을 불러오지 못했습니다. 다시 시도해 주세요.'));
        };
        document.head.appendChild(script);
      });
      return loading;
    },
  };
  const prepare = () => GateBoot.load().catch(error => window.dispatchEvent(new ErrorEvent('error', { message: error.message })));
  // 첫 장면의 그림을 먼저 전달하고, 다음 장면부터 본편을 캐시에 준비한다.
  // 실행은 첫 조작/오프닝 종료까지 미뤄 자막과 카메라 이동을 막지 않는다.
  document.addEventListener('gate-opening-scene', event => {
    if (event.detail !== 1 || loading) return;
    const preload = document.createElement('link');
    preload.rel = 'prefetch'; preload.as = 'script'; preload.href = source;
    document.head.appendChild(preload);
  });
  document.addEventListener('gate-opening-finished', prepare, { once: true });
  document.addEventListener('pointerdown', prepare, { once: true, passive: true });
  document.addEventListener('keydown', prepare, { once: true });
  // 본편이 준비되기 전의 타이틀 입력도 한 번만 전달한다.
  document.addEventListener('click', event => {
    if (GateBoot.ready) return;
    const target = event.target.closest('[data-act]');
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (actionPending) return;
    actionPending = true;
    const label = target.textContent;
    target.disabled = true; target.textContent = '준비 중…';
    const action = target.dataset.act, value = target.dataset.v;
    GateBoot.load().then(() => { actionPending = false; UI.handle(action, value); }).catch(error => {
      actionPending = false;
      target.disabled = false; target.textContent = label;
      window.dispatchEvent(new ErrorEvent('error', { message: error.message }));
    });
  }, true);
})();
