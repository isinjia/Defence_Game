// ===== 게이트 크로니클: 플레이 점검에서 찾은 흐름 보정 =====
// 1. 첫 공략(신입의 첫 게이트) 동안에는 경쟁 파티가 게이트 보스를 먼저 잡아 닫지 않는다.
//    자동 플레이 점검에서 첫 공략이 '선점당했다 · 받은 크레딧 0'으로 끝나 첫 게이트를 다시 신청해야 했다.
//    첫 경험은 끝까지 해 보게 하고, 경쟁은 그다음 게이트부터.
{
  const GP = Game.prototype;
  const firstGate = (g, gate) => {
    const s = g.player && g.player.firstSortie;
    return !!(s && s.status === 'active' && gate && (s.gate == null || s.gate === gate.id));
  };
  const baseStep = GP.gatePartiesStep;
  if (baseStep) GP.gatePartiesStep = function (gate, run) {
    const ev = baseStep.call(this, gate, run);
    if (!firstGate(this, gate)) return ev;
    return ev.filter((e) => e.type !== 'closed');
  };
  const baseBoss = GP.gatePartyBoss;
  if (baseBoss) GP.gatePartyBoss = function (gate, pt) {
    if (firstGate(this, gate)) return null; // 첫 공략 중엔 보스전에 끼어들지 않는다(다음 층으로도 서두르지 않음)
    return baseBoss.call(this, gate, pt);
  };
}

// 2. 솔로를 고른 신입에게 '공략대 모집' 창이 갑자기 뜨던 것: 그 전에 협회 담당자가 의무 동행 규정을 설명한다(사용자 요청).
//    실전 경험 없는 신규 헌터는 첫 게이트 한 번을 경험 있는 리더의 공략대와 함께 들어가야 한다. 끝나면 다시 솔로.
{
  const baseShow = UI.showFirstSortie;
  if (baseShow) UI.showFirstSortie = function (...a) {
    const p = G.player;
    const pending = p && p.notebook && G.nbTask && G.nbTask()?.id === 'gate' && p.firstSortie?.status !== 'done';
    const solo = !(G.crew && G.crew()) && !G.party().length;
    if (!pending || !solo || this.dlg || (p.firstSortie && (p.firstSortie.status === 'active' || p.firstSortie.briefed))) return baseShow.apply(this, a);
    const s = G.firstSortieOffer();
    s.briefed = true; G.save();
    const L = s.listing && G.npcById(s.listing.leader);
    const staff = { name: '협회 활동 지원 담당자', sub: '헌터 협회', seed: 'nb-free-staff', elem: 'holy' };
    const rk = RANKS[p.rankIdx].key;
    this.talk([
      { narr: '협회 지부 창구. 활동 지원 담당자가 서류 한 장을 내민다. 맨 위에 굵은 글씨로 "신규 헌터 실전 동행 확인서".' },
      { who: staff, text: '솔로로 활동하시겠다고요. 그건 존중합니다. 다만 그 전에 꼭 거쳐야 하는 규정이 하나 있어요.' },
      { who: staff, text: '실전 경험이 없는 신규 헌터는 첫 게이트 한 번을, 경험 있는 리더의 공략대와 함께 들어가야 합니다. 협회 의무 동행이에요.' },
      { who: staff, text: '첫 게이트에 혼자 들어갔다가 못 나오는 신입이 해마다 나옵니다. 그래서 생긴 규정이에요. 예외는 없습니다.' },
      { who: 'player', text: '한 번만 다녀오면 되는 거죠?' },
      { who: staff, text: '네, 이번 한 번입니다. 정산이 끝나면 다시 솔로로 돌아가시면 되고, 첫 공략 입장료는 협회가 냅니다.' },
      L ? { who: staff, text: `마침 ${RANKS[L.rankIdx].key}급 리더 ${L.name} 씨 공략대가 ${rk}급 인원을 찾고 있어요. 바로 연결해 드릴게요.` }
        : { who: staff, text: `${rk}급 인원을 찾는 공략대가 있는지 바로 알아봐 드릴게요.` },
    ], () => baseShow.apply(this, a));
  };
}

// 3. 시험 뒤 순서: 연락처 교환 → 등록 창구에서 등급 판정 대화 → (선임의 연락처) → 판정 통지서 → 헌터 카드 발급 (사용자 요청)
//    예전엔 등급을 알려 주는 대사가 연락처 교환 앞에 나왔다(js/tutorial.js examResultTalk 에서 뺌).
{
  const baseNotice = UI.showNotice;
  if (baseNotice) UI.showNotice = function (...a) {
    const f = G.flags || (G.flags = {});
    if (f.rankTalkDone || !this.talk || !G.player) return baseNotice.apply(this, a);
    f.rankTalkDone = true;
    const rk = RANKS[Math.max(0, Math.min(RANKS.length - 1, G.player.rankIdx))].key;
    const meter = { name: '등록 담당자', sub: '헌터 협회' };
    this.closeModal();
    this.talk([
      { narr: '동기들과 헤어진 뒤, 협회 등록 창구에서 시험 결과를 확인한다.' },
      { who: meter, text: `기존 측정 기록과 실기 결과를 확인했습니다. 등록 등급은 ${rk}급입니다.` },
      { who: meter, text: '정식 판정 통지서와 헌터 카드는 발급 창구에서 받으시면 됩니다. 수고하셨습니다.' },
    ], () => baseNotice.apply(this, a));
  };
}

// 4. 일반 탐색에도 튜토리얼처럼 이동 장면: 길을 정하면 경로 지도를 펼쳐 표식이 그 칸으로 1초 움직인 뒤 칸의 일(전투·사건·휴식·보물)이 열린다 (사용자 제보)
//    gate_run.js 의 enterNode 는 표식을 옮기자마자 바로 칸을 열었다. 팀 상의가 끝나 실제로 이동할 때만(맨 바깥 enterNode 호출 안) 보여 준다.
{
  const baseEnter = UI.enterNode;
  if (baseEnter) UI.enterNode = function (key, ...a) {
    const prev = this._xrEnterKey; this._xrEnterKey = key;
    try { return baseEnter.call(this, key, ...a); } finally { this._xrEnterKey = prev; }
  };
  const H = 100, PADB = 7, PADT = 8;
  const at = (m, pos) => {
    if (!pos) return { x: 50, y: H - PADB };
    const nd = m.rows[pos[0]][pos[1]];
    return { x: nd.x * 100, y: H - PADB - (pos[0] / Math.max(1, m.rows.length - 1)) * (H - PADB - PADT) };
  };
  const wrapOpen = (name) => {
    const base = UI[name]; if (!base) return;
    UI[name] = function (...a) {
      const c = this.ctx; const m = c && c.run && c.run.map;
      const key = m && m.pos && m.pos.join(':');
      if (!m || this.exam || this._xrAnimating || !key || this._xrEnterKey !== key || m.done[m.done.length - 1] !== key) return base.apply(this, a);
      const prevKey = m.done[m.done.length - 2];
      const from = prevKey ? prevKey.split(':').map(Number) : (m.rows[0] && m.rows[0][0] && m.rows[0][0].t === 'start' ? [0, 0] : null);
      if (from && from.join(':') === key) return base.apply(this, a);
      try {
        this.renderGateMap();
        const tk = document.querySelector('#modal-box .gtoken.lead');
        if (!tk) return base.apply(this, a);
        const s = at(m, from), t = at(m, m.pos);
        tk.style.transition = 'none'; tk.style.left = s.x + '%'; tk.style.top = s.y + '%';
        void tk.offsetWidth; tk.style.transition = '';
        const root = document.querySelector('#modal-box .exploration-layout');
        if (root && window.innerWidth < 1100) root.classList.add('xr-overview', 'xr-moving');
        const sc = root && root.querySelector('.xr-map-scroll');
        const follow = () => { if (tk.isConnected && sc) sc.scrollTop = Math.max(0, tk.offsetTop - sc.clientHeight / 2); };
        requestAnimationFrame(() => requestAnimationFrame(() => { tk.style.left = t.x + '%'; tk.style.top = t.y + '%'; }));
        const fid = sc ? setInterval(follow, 60) : null;
        this._xrAnimating = true;
        const ctx = c; const ms = 1000 * (FX.reduced ? 0.5 : 1);
        setTimeout(() => {
          if (fid) clearInterval(fid);
          this._xrAnimating = false;
          if (this.ctx !== ctx) return;
          if (root) root.classList.remove('xr-overview', 'xr-moving');
          base.apply(this, a);
        }, ms);
        return undefined;
      } catch (e) { this._xrAnimating = false; return base.apply(this, a); }
    };
  };
  ['gateFight', 'gateRest', 'gateTreasure', 'gateEvent'].forEach(wrapOpen);
}

// 5. 초상 옷·몸이 사라지던 문제는 js/job_outfits.js mintIds · js/bust_portrait.js remint 에서 <use href="#…"> 참조를 함께 바꿔 고쳤다.

// 6. 스킬 정보 팝업 (사용자 요청)
//    ① '대상' 칸 아래에 붙던 긴 설명(대상 수 배율 등)을 뺀다.
//    ② 맨 마지막에 이 스킬에 붙은 접사 태그(거친·예리한 등)가 무슨 뜻인지 붙은 순서대로 적는다(사용자 요청: 접사만, '숨은 접사' 글자 없이).
{
  const fmtK = (v) => (Math.round(v * 100) / 100).toString();
  const tagRows = (sk) => {
    const rows = []; const p = G.player; const mine = p && (p.skills || []).includes(sk.id) && sk.id !== 'strike';
    const a = mine && p.skillAffix && p.skillAffix[sk.id];
    if (a && typeof affixById === 'function') {
      for (const x of [a.a, a.h].map((k) => k && affixById(k)).filter((x) => x && x.name)) {
        const parts = []; if (x.power !== 1) parts.push(`위력 ×${fmtK(x.power)}`); if (x.mp !== 1) parts.push(`정신력 소모 ×${fmtK(x.mp)}`);
        rows.push([x.name, parts.join(' · ') || '변화 없음']);
      }
    }
    return rows;
  };
  const base = UI.skillHoldHtml;
  if (base) UI.skillHoldHtml = function (sk, u, ...a) {
    let h = base.call(this, sk, u, ...a);
    try {
      // ① 대상 칸 아래 설명 빼기
      h = h.replace(/(<tr><th>대상<\/th><td>[^<]*)<br><span class="dim small">[^<]*<\/span>/, '$1');
      // ② 태그 설명
      const rows = sk ? tagRows(sk) : [];
      if (rows.length) {
        const sec = `<div class="sh-tags-title small dim" style="margin-top:8px">태그</div><table class="sh-table sh-tag-table">${rows.map(([k, v]) => `<tr><th><span class="tag">${k}</span></th><td class="small">${v}</td></tr>`).join('')}</table>`;
        h = h.includes('sh-tip') ? h.replace(/(<div class="small dim sh-tip">)/, `${sec}$1`) : h.replace(/<\/div>\s*$/, `${sec}</div>`);
      }
    } catch (e) { /* 실패하면 원래 창 */ }
    return h;
  };
}

// 7. 자격 시험 시작 대화: 시험장 로비 그림을 게이트에 들어가기 전까지 띄워 둔다 (사용자 요청)
//    컷신 그림이 떠 있으면 인물 얼굴을 숨기게 되어 있어(css/dlg_vn.css), 이 그림일 때만 얼굴을 그림 위에 세운다.
{
  const KEEP_FACE = ['cut-exam-lobby'];
  const css = document.createElement('style');
  // 연출: 그림을 화면 전체에 깔고(가운데 기준으로 잘라 채움) 아주 천천히 다가간다. 아래쪽만 어둡게 눌러 대사가 읽히게 한다.
  css.textContent = KEEP_FACE.map((k) => `html body.main-cut-on[data-cut="${k}"] #dlg .dlg-face { display: block; }
html body[data-cut="${k}"] #main-cut { background: #04060a; }
html body[data-cut="${k}"] #main-cut .mc-img { top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; transform: none; object-fit: cover; object-position: 50% 36%;
  -webkit-mask-image: none; mask-image: none; transform-origin: 50% 40%; animation: pfCutIn .9s ease-out both, pfCutPush 26s ease-out both; }
html body[data-cut="${k}"] #main-cut .mc-img.out { animation: mcOut .7s ease-in both; }
html body[data-cut="${k}"] #main-cut::after { content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at 50% 38%, transparent 45%, #04060a8c 100%), linear-gradient(to bottom, #04060a59 0%, transparent 18%, transparent 46%, #04060ab3 74%, #04060af2 100%); }`).join('\n') + `
@keyframes pfCutIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes pfCutPush { from { transform: scale(1); } to { transform: scale(1.09); } }
@media (prefers-reduced-motion: reduce) { #main-cut .mc-img { animation: pfCutIn .3s ease-out both !important; } }
body.reduced #main-cut .mc-img { animation: pfCutIn .3s ease-out both !important; }`;
  document.head.appendChild(css);
  const baseShow = UI.mainCutShow, baseClear = UI.mainCutClear;
  if (baseShow) UI.mainCutShow = function (key, ...a) { const r = baseShow.call(this, key, ...a); if (this._cut) document.body.dataset.cut = this._cut; return r; };
  if (baseClear) UI.mainCutClear = function (...a) { delete document.body.dataset.cut; return baseClear.apply(this, a); };
}

// 8. 첫 게이트 정찰 설명 연출 (js/leader_rule.js 4번과 짝, 사용자 요청)
//    설명하는 동안(run.scoutHide) 정찰로 본 칸도 '미확인'으로 보였다가, 설명이 끝나면 물음표가 스르륵 걷히며 칸 종류가 드러난다.
{
  if (typeof GateScout !== 'undefined') {
    const baseShown = GateScout.shown;
    GateScout.shown = function (m, r, i) {
      const s = baseShown.call(this, m, r, i);
      const run = typeof UI !== 'undefined' && UI.ctx && UI.ctx.run;
      if (run && run.scoutHide && run.map === m && s.t !== 'start' && s.t !== 'boss' && !(m.done || []).includes(r + ':' + i)) return { t: 'unknown' };
      return s;
    };
  }
  const css = document.createElement('style');
  css.textContent = `
@keyframes pfReveal { 0% { filter: blur(5px) brightness(.35) saturate(0); transform: scale(.82); } 55% { filter: blur(0) brightness(1.5); transform: scale(1.14); } 100% { filter: none; transform: scale(1); } }
@keyframes pfRevealRing { 0% { box-shadow: 0 0 0 0 #7fe3ffcc; } 100% { box-shadow: 0 0 0 16px #7fe3ff00; } }
#modal-box .gnode.pf-reveal { animation: pfReveal 1.3s ease-out both, pfRevealRing 1.3s ease-out .4s both; }
body.pf-scout-reveal #modal-box .xr-route .gnode:not(.pf-reveal):not(.done) { transition: opacity .6s; }
@media (prefers-reduced-motion: reduce) { #modal-box .gnode.pf-reveal { animation: none; } }
body.reduced #modal-box .gnode.pf-reveal { animation: none; }`;
  document.head.appendChild(css);
}

// 9. 팀(소속 파티)으로 깬 게이트의 전리품이 정산 없이 전부 내 것이 되던 문제 (사용자 제보: 파티원인데 바로 장착해 가질 수 있음)
//    게이트가 끝나면 팀 일이 먼저 끝나(c.on=false) party()가 팀원을 빼고 돌려준다 → 정산할 팀원이 0명 → 정산을 건너뛰었다.
//    정산 몫을 셀 때는 팀원을 포함한다(withCrew).
{
  const base = Game.prototype.lootShares;
  if (base) Game.prototype.lootShares = function (...a) {
    if (this.crew && this.crew() && this.withCrew) return this.withCrew(() => base.apply(this, a));
    return base.apply(this, a);
  };
}
//    정산 중인 장비는 결과 창 아래 '얻은 장비'의 [바로 장착]을 막는다(정산 전에 끼워 가져가지 못하게). 정산이 끝나 내 것이 되면 가방에서 장착한다.
{
  const lock = () => {
    const L = UI._loot; const box = document.getElementById('modal-box'); if (!L || !box || !UI.lootMine) return;
    for (const b of box.querySelectorAll('[data-act="quick-equip"]')) {
      const lot = (L.lots || []).find((x) => x.kind === 'gear' && String(x.it.uid) === String(b.dataset.v)); if (!lot) continue;
      if (UI.lootMine(b.dataset.v)) { b.disabled = false; b.textContent = '바로 장착'; continue; }
      b.disabled = true; b.textContent = lot.done ? '내 것 아님' : '팀 정산 중'; b.classList.remove('primary');
    }
  };
  for (const name of ['lootSplitStart', 'lootRender']) {
    const base = UI[name]; if (!base) continue;
    UI[name] = function (...a) { const r = base.apply(this, a); try { lock(); } catch (e) { /* 무시 */ } return r; };
  }
  const baseH = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'quick-equip' && UI._loot && UI.lootMine && !UI.lootMine(v)) { this.toast('팀 정산이 끝나 내 것이 되어야 장착할 수 있다.'); return; }
    return baseH.call(this, act, v);
  };
}
