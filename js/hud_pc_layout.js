// ===== 게이트 크로니클: PC HUD 배치 (영역 B, 사용자 요청) =====
// PC(넓은 화면)에서만:
//  1) 메뉴 아래 날짜·나이를 위쪽 크레딧(#hud-money) 왼쪽으로 옮긴다.
//  2) 현재 퀘스트 칸(.hud-tr)은 메뉴 아래 왼쪽에 둔다(CSS · 오른쪽 아님).
// 좁은 화면은 기존(메뉴 아래 날짜, 왼쪽 퀘스트) 그대로.
{
  const PC = '(min-width: 641px)';
  const isPc = () => window.matchMedia(PC).matches;

  UI.placeHudPc = function () {
    const dates = [...document.querySelectorAll('.hud-date')];
    const date = dates[0] || null;
    // 예전에 생긴 중복 날짜 칸은 하나만 남긴다
    for (let i = 1; i < dates.length; i++) dates[i].remove();
    const money = document.getElementById('hud-money');
    const tl = document.getElementById('hud-tl');
    let wrap = document.getElementById('hud-top-res');

    if (!isPc()) {
      if (date) {
        date.classList.remove('pc-tr');
        if (tl && date.parentElement !== tl) tl.appendChild(date);
      }
      if (wrap && money && money.parentElement === wrap) {
        document.body.appendChild(money);
      }
      if (wrap && wrap.childElementCount === 0) wrap.remove();
      return;
    }

    if (!date && !money) return;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'hud-top-res';
      document.body.appendChild(wrap);
    }
    if (date) {
      date.classList.add('pc-tr');
      if (date.parentElement !== wrap) wrap.appendChild(date);
    }
    if (money && money.parentElement !== wrap) wrap.appendChild(money);
    // 날짜가 크레딧 왼쪽이 되도록 순서 고정
    if (date && money && date.nextElementSibling !== money) wrap.insertBefore(date, money);
  };

  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRender.apply(this, a);
    try { this.placeHudPc(); } catch (e) { /* 무시 */ }
    return r;
  };

  if (UI.moneySync) {
    const baseMoney = UI.moneySync;
    UI.moneySync = function (...a) {
      const r = baseMoney.apply(this, a);
      try { this.placeHudPc(); } catch (e) { /* 무시 */ }
      return r;
    };
  }

  let t = 0;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => { try { UI.placeHudPc(); } catch (e) { /* 무시 */ } }, 80);
  });
}

// 월드맵 퀘스트는 짧은 목표만 표시한다. 원문은 의뢰 메뉴와 접근성 이름에 유지한다.
{
  const short = (text) => String(text || '')
    .replace(/^메인 · (\d+)장 「([^」]+)」 — /, '$1장 $2 · ')
    .replace(/^리더 (.+?)에게 말 걸기 · 일하러 간다$/, '$1 · 집결')
    .replace(/에서 리더와 합류$/, ' · 집결')
    .replace(/^팀 호출 · 이 도시로 모은다$/, '팀 호출')
    .replace(/^팀 호출 \(도시에서\)$/, '도시에서 팀 호출')
    .replace(/\s*· 만료까지 /g, ' · 기한 ')
    .replace(/가까운 게이트 하나 공략하기/g, '첫 게이트 공략')
    .replace(/도시에 들어간다/g, '도시 방문')
    .replace(/의뢰소에 보고하기/g, '의뢰 보고')
    .replace(/공략하기/g, '공략').replace(/수락하기/g, '수락')
    .replace(/진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다./g, '의뢰 없음');
  const base = UI.hudQuests;
  UI.hudQuests = function (...args) {
    const root = document.createElement('template'); root.innerHTML = base.apply(this, args);
    for (const el of root.content.querySelectorAll('.hq-t, .obj-sub, .travel-chip')) {
      const full = el.textContent; const compact = short(full);
      if (full === compact) continue;
      el.textContent = compact;
      const row = el.closest('button') || el;
      if (!row.hasAttribute('title')) row.setAttribute('title', full);
      if (!row.hasAttribute('aria-label')) row.setAttribute('aria-label', full);
    }
    return root.innerHTML;
  };
}
