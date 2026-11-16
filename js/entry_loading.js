// 타이틀에서 진입하는 화면을 준비한다. 아직 쓰지 않는 전 세계 그림은 선읽기하지 않는다.
(() => {
  const view = window.GateEntryLoading;
  if (!view) return;
  const entryActions = new Set(['new', 'new-ok', 'continue', 'mode-story', 'mode-manual', 'ps-start', 'c-start', 'pro-begin', 'pro-resume']);
  const baseHandle = UI.handle;
  const decoded = new Map();
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const timeout = promise => {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('화면 준비 시간 초과')), 30000);
    })]).finally(() => clearTimeout(timer));
  };
  const image = async (im, retry = false) => {
    const src = im.currentSrc || im.src;
    if (!src) return;
    if (retry && im.complete && !im.naturalWidth) im.src = src;
    if (!im.complete) await new Promise((resolve, reject) => {
      const clean = () => { im.removeEventListener('load', loaded); im.removeEventListener('error', failed); };
      const loaded = () => { clean(); resolve(); };
      const failed = () => { clean(); if ((im.currentSrc || im.src) !== src) image(im, retry).then(resolve, reject); else reject(new Error('이미지 로드 실패')); };
      im.addEventListener('load', loaded); im.addEventListener('error', failed);
      if (im.complete) im.naturalWidth ? loaded() : failed();
    });
    if (!im.naturalWidth) throw new Error('이미지 로드 실패');
    if (im.decode) await im.decode();
  };
  const url = src => {
    if (!src) return Promise.resolve();
    if (decoded.has(src)) return decoded.get(src);
    const im = new Image(); im.src = src;
    const job = image(im); decoded.set(src, job);
    job.catch(() => decoded.delete(src));
    return job;
  };
  const shown = node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
  const readyFonts = async () => {
    const link = document.getElementById('game-fonts');
    if (link && link.href && !link.sheet) await new Promise((resolve, reject) => {
      const clean = () => { link.removeEventListener('load', loaded); link.removeEventListener('error', failed); };
      const loaded = () => { clean(); resolve(); };
      const failed = () => { clean(); reject(new Error('글꼴 로드 실패')); };
      link.addEventListener('load', loaded); link.addEventListener('error', failed);
      // 실패했던 스타일시트도 재시도할 수 있게 한다.
      link.href = link.href;
      if (link.sheet) loaded();
    });
    if (document.fonts) {
      await Promise.all(['400 16px "IBM Plex Sans KR"', '700 16px "IBM Plex Sans KR"', '700 16px "Chakra Petch"', '16px "GateDisplay"']
        .map(font => document.fonts.load(font)));
      await document.fonts.ready;
    }
  };
  const readyScreen = async retry => {
    view.stage('화면을 준비하고 있습니다.');
    await readyFonts();
    if (retry) {
      for (const svg of document.querySelectorAll('svg[data-portrait-parts]')) {
        if (![...svg.querySelectorAll('image')].some(node => (node.getAttribute('href') || '').startsWith('assets/'))) continue;
        svg.removeAttribute('data-parts-ready');
        await PortraitParts.prepareElement(svg);
      }
      if (UI.screen === 'game' && UI.map) {
        if (!UI.map.imgs.player || !UI.map.imgs.player.naturalWidth) {
          UI.map._partsSource = null;
          UI.map.setPlayerImage(UI.playerAvatar(128));
        }
        if (typeof PARTY_IMG !== 'undefined') for (const key of Object.keys(PARTY_IMG)) delete PARTY_IMG[key];
      }
    }
    if (UI.screen === 'game' && UI.map && typeof MapTerrain !== 'undefined') await MapTerrain.prepareEntry();
    // RAF 렌더러가 만든 지도 얼굴, DOM 초상 합성, 디코딩을 모두 기다린다.
    // 이미지 준비 중 장면이 바뀌면 새 장면도 다시 확인한다.
    let previous = '';
    for (;;) {
      await frame();
      await PortraitParts.whenReady();
      const nodes = [...document.querySelectorAll('#app img, #modal img, #dlg img, #main-cut img, #app svg image, #modal svg image, #dlg svg image')].filter(shown);
      const sources = nodes.map(node => node.tagName.toLowerCase() === 'img'
        ? (node.currentSrc || node.src) : (node.getAttribute('href') || node.getAttribute('xlink:href'))).filter(Boolean);
      const jobs = nodes.map(node => node.tagName.toLowerCase() === 'img' ? image(node, retry) : url(node.getAttribute('href') || node.getAttribute('xlink:href')));
      if (UI.screen === 'game' && UI.map) {
        if (!UI.map.imgs.player || !UI.map.imgs.player.src) throw new Error('초상 준비 실패');
        for (const im of Object.values(UI.map.imgs || {})) if (im instanceof HTMLImageElement && im.src) { sources.push(im.src); jobs.push(image(im, retry)); }
        for (const cache of [typeof PARTY_IMG !== 'undefined' ? PARTY_IMG : {}, typeof MAP_MOB_IMG !== 'undefined' ? MAP_MOB_IMG : {}])
          for (const im of Object.values(cache)) if (im.src) { sources.push(im.src); jobs.push(image(im, retry)); }
      }
      // 컷신 등 CSS 배경으로 표시되는 그림도 포함한다.
      for (const node of document.querySelectorAll('#app [style], #modal [style], #dlg [style]')) {
        if (!shown(node)) continue;
        const bg = getComputedStyle(node).backgroundImage;
        for (const match of bg.matchAll(/url\(["']?(.+?)["']?\)/g)) { sources.push(match[1]); jobs.push(url(match[1])); }
      }
      await Promise.all(jobs);
      await frame();
      const signature = UI.screen + '\n' + sources.join('\n');
      if (signature === previous && !PortraitParts.pendingCount && !document.querySelector('svg[data-parts-pending]')) return;
      previous = signature;
    }
  };
  UI.handle = function (act, ...args) {
    if (this.entryLoading) return this.entryLoading;
    if (!entryActions.has(act)) return baseHandle.call(this, act, ...args);
    const ui = this;
    let entered = false;
    const run = async (retry = false) => {
      view.show();
      await view.paint();
      try {
        if (!entered) { await baseHandle.call(ui, act, ...args); entered = true; }
        await timeout(readyScreen(retry));
        view.hide(); ui.entryLoading = null;
        if (ui._entryCombatLoop) { const resume = ui._entryCombatLoop; ui._entryCombatLoop = null; resume(); }
      } catch (error) {
        console.warn('게임 진입 준비 실패', error);
        view.fail(() => { ui.entryLoading = run(true); });
      }
    };
    this.entryLoading = run();
    return this.entryLoading;
  };
  const combatLoop = UI.combatLoop;
  UI.combatLoop = function (...args) {
    if (view.active) { this._entryCombatLoop = () => combatLoop.apply(this, args); return; }
    return combatLoop.apply(this, args);
  };
  const advanceWalk = MapView.prototype.advanceWalk;
  MapView.prototype.advanceWalk = function (now) {
    if (view.active) { if (this._walkAnimation) this._walkAnimation.last = now; return null; }
    return advanceWalk.call(this, now);
  };
})();
