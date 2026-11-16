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
        // 이동 장면 동안 지도를 다시 그리면 NPC 리더가 '다음 길' 상의를 예약해, 전투가 열리기 전에 상의가 떠서
        // 다른 칸으로 가 버렸다(사용자 제보: 전투 스킵). 장면 동안은 상의 예약을 막고, 칸이 열린 뒤 풀어 준다.
        const reachNow = this.reachable ? this.reachable() : [];
        c.run.leadAsked = `${c.run.floor}|${reachNow.map((x) => x.join(':')).join(',')}`;
        this._xrAnimating = true;
        this.renderGateMap();
        const tk = document.querySelector('#modal-box .gtoken.lead');
        if (!tk) { this._xrAnimating = false; c.run.leadAsked = null; return base.apply(this, a); }
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
          if (c.run) c.run.leadAsked = null; // 칸의 일이 끝나 지도로 돌아오면 리더가 다음 길을 정한다
          base.apply(this, a);
        }, ms);
        return undefined;
      } catch (e) { this._xrAnimating = false; if (c.run) c.run.leadAsked = null; return base.apply(this, a); }
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
/* 모바일(좁은 화면)에서는 모든 메인 컷신 그림을 시험장 로비처럼: 화면 전체 · 아래만 어둡게 · 천천히 다가감 (사용자 요청) */
@media (max-width: 760px) {
  html body #main-cut { background: #04060a; }
  html body #main-cut .mc-img { top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh; transform: none; object-fit: cover; object-position: 50% 36%;
    -webkit-mask-image: none; mask-image: none; transform-origin: 50% 40%; animation: pfCutIn .9s ease-out both, pfCutPush 26s ease-out both; }
  html body #main-cut .mc-img.out { animation: mcOut .7s ease-in both; }
  html body #main-cut::after { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at 50% 38%, transparent 45%, #04060a8c 100%), linear-gradient(to bottom, #04060a59 0%, transparent 18%, transparent 46%, #04060ab3 74%, #04060af2 100%); }
}
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

// 10. NPC 리더 팀으로 게이트를 클리어하면 정산 창 전에: 리더가 수고했다고 하고 → 팀원들이 차례로 한마디(튜토리얼 인사처럼) → 리더가 정산하자고 한 뒤 정산 창 (사용자 요청)
{
  const LEAD_THANKS = {
    kind: ['다들 수고 많았어요. 다친 사람 없죠?', '오늘 정말 잘해 줬어요. 다들 고마워요.'],
    just: ['수고했다. 다들 제 몫 이상 해 줬다.', '끝났다. 누구 하나 빠짐없이 잘 버텼다.'],
    cold: ['끝. 수고했다.', '정리됐다. 다들 수고.'],
    warlike: ['좋았어! 이게 우리 팀이지. 다들 수고했다!', '한 판 시원하게 했다. 수고했어!'],
    greedy: ['수고들 했어. 오늘 건 수지가 맞겠는데?', '다들 수고. 전리품도 쏠쏠하다.'],
  };
  const LEAD_SETTLE = {
    kind: '자, 그럼 얻은 거 나눠 볼까요? 정산해요.', just: '그럼 정산하자. 규칙대로 나눈다.', cold: '정산한다.',
    warlike: '자, 이제 나눠 먹자! 정산 간다!', greedy: '자, 정산하자. 꼭 갖고 싶은 건 입찰로.',
  };
  const pers = (n) => (n && LEAD_THANKS[n.personality] ? n.personality : 'just');
  const baseFinish = UI.finishGate;
  if (baseFinish) UI.finishGate = function (result, ...a) {
    const c = this.ctx;
    const L = G.crewLeader && G.crewLeader();
    if (result !== 'clear' || !c || c.kind !== 'gate' || !L || L === G.player || !this.talk || this._clearTalked === c) return baseFinish.call(this, result, ...a);
    this._clearTalked = c;
    const mates = (G.withCrew ? G.withCrew(() => G.party()) : G.party()).filter((n) => n && n.alive && n !== L);
    const used = new Set();
    const line = (n) => (G.personaLine && G.personaLine(n, 'win', {}, used)) || RNG.pick(['수고했어요.', '다들 무사해서 다행이다.', '오늘 호흡 좋았어.', '휴, 끝났다.']);
    const p = pers(L);
    this.talk([
      { narr: '마지막 괴수가 쓰러지고, 게이트가 서서히 닫히기 시작한다.' },
      { who: L, text: RNG.pick(LEAD_THANKS[p]) },
      mates.length ? { narr: '팀원들이 차례로 한마디씩 건넨다.', group: mates.map((n) => ({ who: n, text: line(n) })) } : null,
      { who: L, text: LEAD_SETTLE[p] },
    ].filter(Boolean), () => { if (this.ctx === c) baseFinish.call(this, result, ...a); });
  };
}

// 11. 메인 이야기 단역(전용 그림이 없는 이름만 있는 인물: '아이' 등)은 일러스트를 띄우지 않는다 (사용자 요청)
//     예전엔 이름으로 무작위 성인 얼굴을 만들어 띄워, 아이가 어른 얼굴로 나왔다. 전용 그림(main_cast_art)이 있으면 그대로.
if (typeof Game !== 'undefined' && Game.prototype.mainWho) {
  const base = Game.prototype.mainWho;
  Game.prototype.mainWho = function (who, ...a) {
    const r = base.call(this, who, ...a);
    if (r && typeof r === 'object' && r.id == null && r.seed === undefined && r.name && !(UI.mainArt && UI.mainArt(r.name))) return { ...r, seed: false };
    return r;
  };
}

// 12. 게이트 공략 뒤 강제 복귀 없애기 (사용자 요청: "강제로 돌아가지 않도록 · 돌아가라는 팝업 계속 뜸")
//     ① 첫 공략을 마친 뒤 '도시로 복귀' 창이 대기열을 처리할 때마다 다시 떴다(닫기 없음). → 창 없이 알림 한 번, 복귀한 것으로 친다.
//        메인 1장은 '도시'에서만 열리므로(where: city) 아무 도시에 들어가면 시작된다.
//     ② 팀(소속 파티) 일이 끝나면 거점으로 자동 이동(날짜도 흐름)하던 것을 하지 않는다. 다음 집결 기한은 그대로 잡힌다.
{
  const baseRet = UI.firstSortieReturn;
  if (baseRet) UI.firstSortieReturn = function (...a) {
    const s = G.player && G.player.firstSortie;
    if (s && s.status === 'done' && !s.returned && !G.onCity()) {
      // 도시까지 끌고 가거나 창을 반복해 띄우지 않는다. 복귀한 것으로 치고, 메인 1장은 아무 도시에 들어가면 열린다.
      s.returned = true; G.mainCheck(); G.save();
      this.toast('첫 공략 완료. 아무 도시에 들어가면 다음 이야기가 이어진다.');
      return this.processQueue();
    }
    return baseRet.apply(this, a);
  };
  // ② 팀 일이 끝나도 거점으로 끌고 가지 않는다
  const baseDone = UI.crewJobDone;
  if (baseDone) UI.crewJobDone = function (...a) {
    const p = G.player; const keep = p ? { x: p.x, y: p.y, region: p.region } : null;
    const baseTravel = G.advanceTravel; G.advanceTravel = function () { /* 자동 귀환 이동 시간 없음 */ };
    try { return baseDone.apply(this, a); } finally {
      G.advanceTravel = baseTravel;
      if (keep && p) { p.x = keep.x; p.y = keep.y; p.region = keep.region; G.syncParty && G.syncParty(); }
      if (G.logs && G.logs[0] && /거점 .*돌아왔다/.test(G.logs[0].text || '')) G.logs.shift(); // '거점으로 돌아왔다' 기록은 실제로 안 갔으니 지운다
    }
  };
}

// 13. 월드맵 자동 이동이 끊기던 문제 (사용자 제보: "이동할 때 렉 걸리듯")
//     한 칸 갈 때마다 여러 화면(이어서 이동 칩·퀘스트 길·이동 계획)이 같은 자리에서 월드맵 전체 길찾기(WORLD.reach)를 따로 돌렸다.
//     결과는 출발 칸·이동력·제주 출입·지형 비용표(계절·탈것)에만 달려 있으므로, 같은 조건이면 기억해 둔 결과를 다시 쓴다.
if (typeof WORLD !== 'undefined' && WORLD.reach) {
  const base = WORLD.reach; const memo = new Map(); const MAX = 12;
  let costSig = '', costRef = null;
  WORLD.reach = function (sx, sy, mp, canJeju) {
    if (!(mp < 1e5)) mp = Infinity; // 1e6 과 Infinity 는 같은 결과(지도 전체): 한 번만 계산
    if (costRef !== WORLD.T_COST.join()) { costRef = WORLD.T_COST.join(); costSig = costRef; }
    const key = `${sx},${sy}|${mp}|${canJeju ? 1 : 0}|${costSig}`;
    const hit = memo.get(key); if (hit) return hit;
    const r = base.call(this, sx, sy, mp, canJeju);
    memo.set(key, r); if (memo.size > MAX) memo.delete(memo.keys().next().value);
    return r;
  };
}

// 14. 월드맵 이동을 부드럽게 (사용자 요청: "캐릭터 초상화가 가운데 있고 지도가 움직여야")
//     ① 걷는 동안 카메라를 캐릭터에 딱 붙인다(예전: 매 프레임 남은 거리의 10%씩 늦게 따라가 초상이 가운데서 밀렸다 돌아옴).
//     ② 칸 사이 이동을 일정한 속도로(예전: 칸마다 가속·감속해서 여러 칸을 갈 때 멈칫멈칫).
if (typeof MapView !== 'undefined') {
  const MP = MapView.prototype;
  const WALK_SLOW = 3; // 이동 속도 1/3 (사용자 요청: 너무 빠름)
  MP.tween = function (from, to, ms, done) {
    this.moving = true; this.reachData = null; ms *= WALK_SLOW;
    const t0 = performance.now();
    const step = (now) => {
      const k = ms <= 0 ? 1 : Math.min(1, (now - t0) / ms);
      this.token = { x: from[0] + (to[0] - from[0]) * k, y: from[1] + (to[1] - from[1]) * k, walking: true };
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  };
  const baseDraw = MP.draw;
  MP.draw = function (...a) {
    if (this.token && this.token.walking) { this.camX = this.token.x + 0.5; this.camY = this.token.y + 0.5; if (this.clampCam) this.clampCam(); }
    return baseDraw.apply(this, a);
  };
}
//     ③ 걷는 동안에는 위쪽 정보(HUD)를 칸마다 다시 그리지 않고 0.4초에 한 번만(칸 사이 멈칫 줄이기). 멈추거나 도착하면 바로 그린다.
{
  const baseHud = UI.renderHud;
  if (baseHud) {
    let last = 0, timer = 0;
    UI.renderHud = function (...a) {
      const w = this.walking;
      if (w && !w.stop && w.i < w.steps.length) {
        const now = performance.now();
        if (now - last < 400) { if (!timer) timer = setTimeout(() => { timer = 0; last = performance.now(); baseHud.apply(UI, a); }, 400 - (now - last)); return; }
        last = now;
      }
      if (timer) { clearTimeout(timer); timer = 0; }
      return baseHud.apply(this, a);
    };
  }
}
