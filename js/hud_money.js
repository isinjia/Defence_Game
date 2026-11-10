// 보유 크레딧 상시 표시 (영역 B, 사용자 요청 — 조사 세션 경유)
//  - 화면 위 설정 버튼 왼쪽에 동전 + 금액(큰 수는 1.2만·3.4억처럼 줄임). 지도 화면에서 항상 보인다.
//  - 돈이 늘거나 줄면 숫자가 굴러가고 +/− 변화량이 잠깐 뜬다(초록/빨강).
//  - 누르면 이번 달 수입·지출 내역 창. 크레딧이 나오는 창(상점·입장 등) 위에서도 같은 자리에 보인다(이때는 누르지 못함).
//  - 내역은 돈이 바뀔 때 직전 기록(G.log) 글을 보고 갈래를 붙여 p.ledger 에 남긴다(최근 60건).
{
  const COIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5h5M9.5 14.5h5M12 7v10"/></svg>';
  const trim = (x) => String(Math.floor(x * 10) / 10).replace(/\.0$/, '');
  // 큰 수 줄이기: 12,345 → 1.2만 / 340,000,000 → 3.4억
  UI.moneyShort = function (n) {
    const neg = n < 0; let a = Math.abs(Math.floor(n)); let s;
    if (a < 10000) s = a.toLocaleString('ko-KR');
    else if (a < 1e8) s = trim(a / 1e4) + '만';
    else if (a < 1e12) s = trim(a / 1e8) + '억';
    else s = trim(a / 1e12) + '조';
    return (neg ? '−' : '') + s;
  };
  // 갈래: 기록 글의 낱말로 가른다
  const KINDS = [
    [/성과급|보너스/, '성과급'], [/급여|봉급|월급|연봉/, '급여'], [/병원|치료비|청구서/, '병원비'], [/보험/, '보험'], [/입장료|상납/, '입장료'],
    [/의뢰|보수|보상|현상금|사례/, '의뢰·보상'], [/전리품|코어|정산|분배|매각|팔았|판매/, '전리품·판매'], [/샀다|구입|구매|제작|강화|수리|주문/, '구입·제작'],
    [/생활비|월세|집세|유지비|세금|이자|빚|상환/, '생활비·빚'], [/수련|훈련|수업|도장/, '수련'], [/선물|밥|술|데이트|포차/, '교제'],
  ];
  const kindOf = (why, d) => { for (const [re, k] of KINDS) if (re.test(why)) return k; return d > 0 ? '기타 수입' : '기타 지출'; };

  // 직전 기록을 모아 둔다 (돈이 바뀐 까닭을 찾는 데 쓴다)
  let recent = [];
  const baseLog = Game.prototype.log;
  Game.prototype.log = function (text, ...a) {
    try { recent.push(String(text).replace(/<[^>]+>/g, '')); if (recent.length > 12) recent.shift(); } catch (e) { /* 무시 */ }
    return baseLog.call(this, text, ...a);
  };
  if (Game.prototype.initSandbox) {
    const baseInit = Game.prototype.initSandbox;
    Game.prototype.initSandbox = function (...a) { const r = baseInit.apply(this, a); if (this.player) this.player.ledger ??= []; return r; };
  }

  let who = null, seen = 0, shown = 0, anim = 0;
  const visible = () => {
    if (typeof G === 'undefined' || !G || !G.player || G.over || UI.screen !== 'game' || UI.dlg) return 0;
    if (!document.getElementById('world') || document.getElementById('tut-skip') || document.querySelector('#dlg.on')) return 0; // 튜토리얼 중에는 건너뛰기 버튼 자리
    if (!UI.modalOpen()) return 1;
    const m = document.getElementById('modal'); const box = document.getElementById('modal-box');
    if (!box || (m && m.classList.contains('full')) || box.classList.contains('combat-box') || box.classList.contains('money-pop')) return 0;
    // [A 수정, 사용자 제보] '크레딧'이라는 글자만 있어도 창 위로 올라와, 사건·결과·정보 창 어디서나 맨 위에 떠 버그처럼 보였다.
    // 돈을 쓰는 곳(도시·시설 화면)에서만 창 위에 보이고, 그 밖의 창이 열려 있으면 숨긴다.
    return box.querySelector('.city-hero, .fac-grid, .shop-list') ? 2 : 0;
  };
  const roll = (el, from, to) => {
    const id = ++anim; const t0 = performance.now(); const dur = FX && FX.reduced ? 1 : 600;
    const f = (now) => {
      if (id !== anim) return;
      const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3);
      shown = Math.round(from + (to - from) * e); el.textContent = UI.moneyShort(shown);
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  UI.moneySync = function () {
    let el = document.getElementById('hud-money');
    const v = visible();
    if (!v) { if (el) el.classList.add('hidden'); if (typeof G === 'undefined' || !G || !G.player) who = null; }
    if (typeof G === 'undefined' || !G || !G.player) return;
    const p = G.player; const now = Math.floor(p.money || 0);
    if (who !== p) { who = p; seen = shown = now; recent = []; } // 새 게임·불러오기: 기준만 잡는다
    const d = now - seen;
    if (d) {
      seen = now;
      const why = [...recent].reverse().find((t) => /크레딧|급|비|보상|료/.test(t)) || recent[recent.length - 1] || '';
      recent = [];
      p.ledger ??= [];
      p.ledger.unshift({ ym: G.monthKey ? G.monthKey() : 0, d, k: kindOf(why, d), why: why.slice(0, 60) });
      if (p.ledger.length > 60) p.ledger.length = 60;
    }
    if (!v) { shown = now; return; }
    if (!el) {
      el = document.createElement('button'); el.id = 'hud-money'; el.dataset.act = 'money-log'; el.setAttribute('aria-label', '보유 크레딧 · 수입과 지출 내역');
      el.innerHTML = `${COIN}<b class="num hm-n"></b>`; document.body.appendChild(el);
      el.querySelector('.hm-n').textContent = UI.moneyShort(shown);
    }
    el.classList.remove('hidden'); el.classList.toggle('over-modal', v === 2);
    const n = el.querySelector('.hm-n');
    if (d) {
      roll(n, shown, now);
      const f = document.createElement('span'); f.className = 'hm-d ' + (d > 0 ? 'up' : 'down');
      f.textContent = (d > 0 ? '+' : '−') + UI.moneyShort(Math.abs(d)); document.body.appendChild(f); // 버튼 모서리 자르기(clip-path)에 잘리지 않게 바깥에 띄운다
      setTimeout(() => f.remove(), 1600);
      el.classList.remove('up', 'down'); void el.offsetWidth; el.classList.add(d > 0 ? 'up' : 'down');
    } else if (shown !== now && !anim) { shown = now; n.textContent = UI.moneyShort(now); }
    else if (n.textContent === '') n.textContent = UI.moneyShort(shown);
  };

  // 수입·지출 내역 창
  UI.moneyPopup = function () {
    const p = G.player; const L = p.ledger || []; const ym = G.monthKey ? G.monthKey() : 0;
    const cur = L.filter((x) => x.ym === ym);
    const sum = (a, s) => a.filter((x) => Math.sign(x.d) === s).reduce((t, x) => t + x.d, 0);
    const inc = sum(cur, 1), out = sum(cur, -1);
    const by = {}; for (const x of cur) by[x.k] = (by[x.k] || 0) + x.d;
    const kinds = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="ml-row"><span>${k}</span><b class="num ${v >= 0 ? 'good' : 'bad'}">${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))}</b></div>`).join('');
    const rows = L.slice(0, 12).map((x) => `<div class="ml-row small"><span class="ml-why">${x.why || x.k}</span><b class="num ${x.d >= 0 ? 'good' : 'bad'}">${x.d >= 0 ? '+' : '−'}${fmt(Math.abs(x.d))}</b></div>`).join('');
    this.modal(`<div class="row between"><h3>크레딧</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
      <div class="ml-have">보유 <b class="num amber">${fmt(p.money)}</b> 크레딧</div>
      <div class="ml-sum"><div><span class="small dim">이번 달 수입</span><b class="num good">+${fmt(inc)}</b></div><div><span class="small dim">이번 달 지출</span><b class="num bad">−${fmt(Math.abs(out))}</b></div></div>
      ${kinds ? `<div class="eyebrow">이번 달 갈래별</div>${kinds}` : '<p class="small dim">이번 달에는 아직 들어오거나 나간 돈이 없다.</p>'}
      ${rows ? `<div class="eyebrow ml-gap">최근 내역</div>${rows}` : ''}`, 'money-pop');
  };

  for (const name of ['renderGame', 'modal', 'closeModal']) {
    const base = UI[name]; if (!base) continue;
    UI[name] = function (...a) { const r = base.apply(this, a); try { this.moneySync(); } catch (e) { /* 무시 */ } return r; };
  }
  setInterval(() => { try { UI.moneySync(); } catch (e) { /* 무시 */ } }, 400);
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'money-log') return this.moneyPopup();
    return baseHandle.call(this, act, v);
  };
}
