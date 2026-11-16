// 오프닝은 게임 계산 없이 바로 표시한다. 본편은 첫 입력 또는 오프닝 종료 시 준비한다.
(() => {
  const source = document.currentScript.dataset.game;
  const styleSource = document.currentScript.dataset.style;
  let loading = null, engine = null, stylesheet = null, actionPending = false;
  const loadAsset = element => new Promise((resolve, reject) => {
    element.onload = resolve;
    element.onerror = () => { element.remove(); reject(new Error('게임을 불러오지 못했습니다. 다시 시도해 주세요.')); };
    document.head.appendChild(element);
  });
  window.GateBoot = {
    ready: false,
    load() {
      if (loading) return loading;
      const artwork = document.querySelector('.title-art[data-src]');
      if (artwork && !artwork.src) artwork.src = artwork.dataset.src;
      const fonts = document.getElementById('game-fonts');
      if (fonts && !fonts.href) { fonts.rel = 'stylesheet'; fonts.href = fonts.dataset.href; }
      if (!stylesheet) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = styleSource;
        stylesheet = loadAsset(link).catch(error => { stylesheet = null; throw error; });
      }
      if (!engine) {
        const script = document.createElement('script');
        script.src = source;
        engine = loadAsset(script).catch(error => { engine = null; throw error; });
      }
      loading = Promise.all([engine, stylesheet]).then(() => {
        GateBoot.ready = true;
        document.dispatchEvent(new Event('gate-game-ready'));
      }).catch(error => {
        loading = null; throw error;
      });
      return loading;
    },
  };
  // 백그라운드 준비 실패는 실제 진입 때 로딩 화면에서 재시도한다.
  const prepare = () => GateBoot.load().catch(() => {});
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
    const action = target.dataset.act, value = target.dataset.v;
    const enter = async () => {
      GateEntryLoading.show();
      await GateEntryLoading.paint();
      try {
        await GateBoot.load();
        actionPending = false;
        await UI.handle(action, value);
        // 도움말처럼 게임 진입이 아닌 타이틀 동작도 초기 로딩을 닫는다.
        if (!UI.entryLoading) GateEntryLoading.hide();
      } catch (error) {
        GateEntryLoading.fail(enter);
      }
    };
    enter();
  }, true);
})();
