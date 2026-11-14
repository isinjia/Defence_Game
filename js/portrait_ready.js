// ===== 게이트 크로니클: 초상 즉시 표시 (파츠 일괄 준비 + 외형 바꾸기 교체) =====
// 피부·머리·옷이 따로 뜨지 않게, 준비가 끝난 뒤에만 보이게 한다.
// 「외형 바꾸기」는 이전 그림을 덮어 둔 채 새 그림을 준비한 다음 한 번에 바꾼다.
(() => {
  if (typeof PortraitParts === 'undefined' || !PortraitParts.prepareElement) return;

  const css = document.createElement('style');
  css.textContent = `
    svg[data-portrait-parts]:not([data-parts-ready="1"]) { opacity: 0; }
    svg[data-portrait-parts][data-parts-ready="1"] { opacity: 1; }
    .portrait-swap-slot { position: relative; display: block; line-height: 0; }
    .portrait-swap-hold {
      position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none;
      line-height: 0;
    }
    .portrait-swap-hold > svg,
    .portrait-swap-hold > .portrait-img { display: block; max-width: 100%; height: auto; }
  `;
  document.head.appendChild(css);

  // 성별별 자주 쓰는 파츠를 미리 받아 둔다
  const warmed = new Set();
  const warmGender = (gender) => {
    const g = gender === 'F' ? 'f' : 'm';
    if (warmed.has(g)) return;
    warmed.add(g);
    // 외형 바꾸기 첫 몇 번이 무겁지 않게, 화면에 들어오자마자 부품 그림을 미리 받아 둔다 (사용자 요청).
    // 한꺼번에 하면 화면이 멈추므로 한가할 때 하나씩 차례로 준비한다.
    const N = 10; let i = 0;
    const idle = (fn) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60));
    const step = () => {
      if (i++ >= N) return;
      try {
        const html = FX.portrait(PortraitParts.newLook(), gender === 'F' ? 'F' : 'M', 'fire', 0, 160, { age: 19, outfit: 'underwear' });
        const p = html && html.includes('data-portrait-parts=') ? PortraitParts.rasterize(html) : null;
        if (p && p.then) p.catch(() => {}).finally(() => idle(step)); else idle(step);
      } catch (e) { idle(step); }
    };
    idle(step);
  };

  const findPreviewHost = () => document.querySelector('.id-preview, .panel.id-preview')
    || document.querySelector('#pro-side .panel')
    || document.querySelector('#pro-side');

  const baseHandle = UI.handle;
  UI.handle = function (act, v, ...rest) {
    if (act === 'c-look' || act === 'ps-look') {
      const host = findPreviewHost();
      let hold = null;
      if (host) {
        const shot = host.querySelector(':scope > svg[data-portrait-parts], :scope > .portrait-img, svg[data-portrait-parts], .portrait-img');
        if (shot) {
          hold = document.createElement('div');
          hold.className = 'portrait-swap-hold';
          hold.appendChild(shot.cloneNode(true));
          const ready = hold.querySelector('svg[data-portrait-parts]');
          if (ready) ready.setAttribute('data-parts-ready', '1');
        }
      }
      const r = baseHandle.call(this, act, v, ...rest);
      const host2 = findPreviewHost();
      const neu = host2 && host2.querySelector('svg[data-portrait-parts]:not([data-parts-ready="1"]), svg[data-portrait-parts]');
      if (host2 && hold && neu) {
        let slot = neu.parentElement;
        if (!slot || slot === host2) {
          slot = document.createElement('div');
          slot.className = 'portrait-swap-slot';
          neu.replaceWith(slot);
          slot.appendChild(neu);
        } else {
          slot.classList.add('portrait-swap-slot');
        }
        slot.appendChild(hold);
        PortraitParts.prepareElement(neu).catch(() => {
          neu.setAttribute('data-parts-ready', '1');
        }).finally(() => {
          hold.remove();
        });
      }
      try {
        const gender = (this.create && this.create.gender) || (this.pro && this.pro.gender) || 'M';
        warmGender(gender);
      } catch (e) { /* 무시 */ }
      return r;
    }
    return baseHandle.call(this, act, v, ...rest);
  };

  const baseRender = UI.render;
  UI.render = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      if (this.screen === 'create' || this.screen === 'story-setup' || this.screen === 'prologue' || this.screen === 'pro-id' || this.screen === 'pro-result') {
        const gender = (this.create && this.create.gender) || (this.pro && this.pro.gender) || 'M';
        warmGender(gender);
      }
      // 이미 붙은 미준비 초상을 즉시 준비 큐에 넣는다
      for (const svg of document.querySelectorAll('svg[data-portrait-parts]:not([data-parts-ready]):not([data-parts-pending])')) {
        svg.setAttribute('data-parts-pending', '1');
        PortraitParts.prepareElement(svg).catch(() => {
          svg.setAttribute('data-parts-ready', '1');
          svg.removeAttribute('data-parts-pending');
        });
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
})();
