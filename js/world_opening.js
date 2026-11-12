// 타이틀 전 시네마틱. 설명 패널 없이 장면·카메라·자막의 시간축으로 재생한다.
const WorldOpening = (() => {
  const shots = [
    {
      "image": "assets/backgrounds/opening-omen.svg",
      "focus": "50% center",
      "duration": 4200,
      "lines": [
        [
          600,
          "2067년, 제주.",
          "date"
        ]
      ]
    },
    {
      "image": "assets/backgrounds/opening-jeju.webp",
      "focus": "50% center",
      "duration": 4800,
      "lines": [
        [
          350,
          "그날, 하늘에 문이 열렸다."
        ]
      ]
    },
    {
      "image": "assets/prologue/dream.webp",
      "focus": "50% center",
      "duration": 5000,
      "lines": [
        [
          350,
          "아무도 몰랐다.\n그 너머에서 무엇이 기다리고 있는지."
        ]
      ]
    },
    {
      "image": "assets/prologue/gate-subway.webp",
      "focus": "50% center",
      "duration": 4200,
      "lines": [
        [
          350,
          "문은 하나가 아니었다."
        ]
      ]
    },
    {
      "image": "assets/prologue/gate-break.webp",
      "focus": "50% center",
      "duration": 5200,
      "lines": [
        [
          350,
          "한반도 곳곳이 찢어지고,\n괴수들이 쏟아져 나왔다."
        ]
      ]
    },
    {
      "image": "assets/prologue/memorial.webp",
      "focus": "50% center",
      "duration": 4600,
      "lines": [
        [
          350,
          "훗날, 우리는 그날을\n대붕괴라 불렀다."
        ]
      ]
    },
    {
      "image": "assets/backgrounds/opening-ether.svg",
      "focus": "50% center",
      "duration": 4200,
      "lines": [
        [
          350,
          "세계를 바꾼 힘. 에테르."
        ]
      ]
    },
    {
      "image": "assets/prologue/hospital.webp",
      "focus": "50% center",
      "duration": 4400,
      "lines": [
        [
          350,
          "누군가의 삶을 앗아간 그 힘은,"
        ]
      ]
    },
    {
      "image": "assets/prologue/awakening.webp",
      "focus": "50% center",
      "duration": 4200,
      "lines": [
        [
          350,
          "다른 누군가를 깨웠다."
        ]
      ]
    },
    {
      "image": "assets/backgrounds/opening-hunters.svg",
      "focus": "50% center",
      "duration": 5800,
      "lines": [
        [
          350,
          "재앙에 맞서 문을 넘는 자들.\n헌터의 시대가 시작되었다."
        ]
      ]
    },
    {
      "image": "assets/backgrounds/opening-quarantine.svg",
      "focus": "50% center",
      "duration": 8000,
      "lines": [
        [
          350,
          "2087년.\n대붕괴로부터 20년.",
          "date"
        ],
        [
          3900,
          "최초의 문은 아직 닫히지 않았다."
        ]
      ]
    },
    {
      "image": "assets/backgrounds/title-gate.webp",
      "focus": "50% center",
      "duration": 5000,
      "lines": [
        [
          350,
          "그리고 지금,\n당신이 눈을 뜬다.",
          "last"
        ]
      ]
    }
  ];

  const total = shots.reduce((sum, shot) => sum + shot.duration, 0);
  let root = null, raf = null, endTimer = null, returnFocus = null;
  let elapsed = 0, lastTime = 0, shotIndex = -1, lineIndex = -1, layerIndex = 0;
  let manual = false, revealed = false, finishing = false, chars = [], lastCount = -1;
  const stop = () => { cancelAnimationFrame(raf); raf = null; clearTimeout(endTimer); endTimer = null; };
  const finish = () => {
    if (!root) return;
    stop(); root.remove(); root = null;
    document.removeEventListener('keydown', keydown, true);
    document.removeEventListener('visibilitychange', visibility);
    const target = returnFocus && returnFocus !== document.body && returnFocus.isConnected ? returnFocus : document.querySelector('.title-screen [data-act="new"]');
    if (target) target.focus();
    returnFocus = null;
  };
  const end = () => {
    if (!root || finishing) return;
    finishing = true; root.classList.add('is-finishing');
    cancelAnimationFrame(raf); raf = null;
    endTimer = setTimeout(finish, manual ? 0 : 900);
  };
  const locate = () => {
    let offset = 0;
    for (let i = 0; i < shots.length; i++) {
      if (elapsed < offset + shots[i].duration) return { i, time: elapsed - offset, offset };
      offset += shots[i].duration;
    }
    return null;
  };
  const paint = () => {
    if (!root || finishing) return;
    const at = locate(); if (!at) return end();
    const shot = shots[at.i];
    if (shotIndex !== at.i) {
      const layers = root.querySelectorAll('.opening-art');
      const incoming = layers[layerIndex];
      incoming.classList.remove('is-active', 'has-shot');
      incoming.src = shot.image;
      incoming.style.setProperty('--shot-focus', shot.focus || '61% center');
      // 비활성 레이어의 그림을 교체한 뒤 두 레이어를 교차 전환한다.
      layers[1 - layerIndex].classList.remove('is-active');
      void incoming.offsetWidth;
      incoming.classList.add('is-active', 'has-shot');
      incoming.style.setProperty('--shot-duration', shot.duration + 1600 + 'ms');
      incoming.style.setProperty('--pan', at.i % 2 ? '-1.5%' : '1.5%');
      layerIndex = 1 - layerIndex;
      root.dataset.shot = String(at.i);
      shotIndex = at.i; lineIndex = -1;
      if (shots[at.i + 1]) { const nextImage = new Image(); nextImage.src = shots[at.i + 1].image; }
    }
    let nextLine = -1;
    shot.lines.forEach((line, i) => { if (at.time >= line[0]) nextLine = i; });
    const caption = root.querySelector('.opening-caption');
    if (nextLine !== lineIndex) {
      lineIndex = nextLine; revealed = false; lastCount = -1;
      const line = shot.lines[nextLine];
      chars = line ? Array.from(line[1]) : [];
      caption.className = 'opening-caption' + (line ? ' is-visible' : '') + (line && line[2] ? ' opening-' + line[2] : '');
      caption.textContent = '';
      // 자막 높이를 먼저 확보해 글자가 찍히는 동안 줄 배치가 흔들리지 않게 한다.
      root.querySelector('.opening-caption-space').textContent = line ? line[1] : '';
    }
    const line = shot.lines[nextLine];
    if (!line) return;
    const count = revealed || manual ? chars.length : Math.min(chars.length, Math.floor((at.time - line[0]) / 48));
    if (count !== lastCount) { caption.textContent = chars.slice(0, count).join(''); lastCount = count; }
    const following = shot.lines[nextLine + 1];
    const until = following ? following[0] : shot.duration;
    caption.classList.toggle('is-leaving', !manual && !revealed && until - at.time < 350);
  };
  const tick = (now) => {
    if (!root || finishing || document.hidden) return;
    if (!manual) elapsed += Math.max(0, now - lastTime);
    lastTime = now; paint();
    if (root && !finishing && !manual) raf = requestAnimationFrame(tick);
  };
  const advance = () => {
    if (!root || finishing) return;
    const at = locate(); if (!at) return end();
    if (lineIndex >= 0 && lastCount < chars.length) { revealed = true; paint(); return; }
    const following = shots[at.i].lines[lineIndex + 1];
    elapsed = following ? at.offset + following[0] : at.offset + shots[at.i].duration + (manual && shots[at.i + 1] ? shots[at.i + 1].lines[0][0] : 0);
    lastTime = performance.now(); paint();
  };
  const visibility = () => {
    if (root) root.classList.toggle('is-suspended', document.hidden);
    if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
    else if (root && !finishing && !manual) { lastTime = performance.now(); raf = requestAnimationFrame(tick); }
  };
  const keydown = (event) => {
    if (!root) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); finish(); }
    else if ((event.key === ' ' || event.key === 'Enter') && event.target.closest && event.target.closest('[data-opening="skip"]')) return;
    else if (event.key === 'Tab') { event.preventDefault(); root.querySelector('[data-opening="skip"]').focus(); }
    else if (event.key === ' ' || event.key === 'ArrowRight' || (event.key === 'Enter' && event.target === root)) {
      event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) advance();
    }
  };
  const start = () => {
    if (root || UI.screen !== 'title') return;
    returnFocus = document.activeElement;
    elapsed = 0; shotIndex = -1; lineIndex = -1; layerIndex = 0; finishing = false;
    manual = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root = document.createElement('section'); root.className = 'world-opening';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', '게임 오프닝'); root.tabIndex = -1;
    root.innerHTML = `<div class="opening-picture" aria-hidden="true"><img class="opening-art" alt=""><img class="opening-art" alt=""></div>
      <div class="opening-atmosphere" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<i style="--x:${(i * 23 + 7) % 100}%;--delay:-${i * 1.7}s;--drift:${i % 2 ? 34 : -28}px"></i>`).join('')}</div>
      <div class="opening-vignette" aria-hidden="true"></div>
      <div class="opening-letterbox opening-letterbox-top" aria-hidden="true"></div><div class="opening-letterbox opening-letterbox-bottom" aria-hidden="true"></div>
      <div class="opening-subtitles"><p class="opening-caption-space" aria-hidden="true"></p><p class="opening-caption" aria-hidden="true"></p><p class="opening-accessible" aria-live="polite" aria-atomic="true"></p></div>
      <div class="opening-shutter" aria-hidden="true"></div>
      <button type="button" class="opening-skip" data-opening="skip" aria-label="오프닝 건너뛰고 타이틀로">스킵 <span aria-hidden="true">»</span></button>
      <span class="opening-hint" aria-hidden="true">${manual ? '화면을 눌러 계속' : '화면을 누르면 자막을 넘깁니다'}</span>`;
    // 화면 읽기 도구에는 글자 단위가 아닌 완성된 문장을 전달한다.
    root.querySelector('.opening-accessible').textContent = shots.map(shot => shot.lines.map(line => line[1]).join(' ')).join(' ');
    root.addEventListener('click', (event) => { if (event.target.closest('[data-opening="skip"]')) finish(); else advance(); });
    document.body.appendChild(root);
    document.addEventListener('keydown', keydown, true); document.addEventListener('visibilitychange', visibility);
    root.focus(); lastTime = performance.now();
    if (manual) elapsed = shots[0].lines[0][0];
    paint(); raf = requestAnimationFrame((now) => { if (!root) return; root.classList.add('is-playing'); tick(now); });
  };
  const addReplay = () => {
    const buttons = document.querySelector('.title-screen .btns');
    if (!buttons || buttons.querySelector('[data-act="world-opening"]')) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost';
    button.dataset.act = 'world-opening'; button.textContent = '오프닝 다시 보기'; buttons.appendChild(button);
  };
  const baseTitle = UI.renderTitle;
  UI.renderTitle = function (...args) { const result = baseTitle.apply(this, args); addReplay(); return result; };
  const baseHandle = UI.handle;
  UI.handle = function (action, ...args) { if (action === 'world-opening') return start(); return baseHandle.call(this, action, ...args); };
  addReplay(); start();
  return { start, finish, get active() { return !!root; } };
})();
