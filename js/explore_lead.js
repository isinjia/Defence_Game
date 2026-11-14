// 탐색(게이트 입장 후 길 선택 화면) — 리더가 고른 길과 이동을 눈에 보이게 (영역 F·B, 사용자 요청)
// 1. 리더가 고른 칸: 목적지 카드에 리더 얼굴을 크게 붙이고(경로 지도 칸에는 테두리 강조만) "○○(리더)의 선택"이라고 쓴다.
//    (전에는 카드 왼쪽 위의 작은 "✓ 선택한 경로" 글자뿐이라 내가 고른 것인지 리더가 고른 것인지 알 수 없었다)
// 2. 모바일 이동: 좁은 화면에서는 경로 지도가 "전체 경로 보기" 안에 숨어 있어, 표식이 움직이는 1초 동안 빈 화면만 기다렸다.
//    이동하는 동안에는 경로 지도를 저절로 펼쳐 표식이 움직이는 것을 보여 준다.
{
  const MOBILE = () => window.innerWidth < 1100;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const face = (L, size) => { try { return (UI.npcBust && UI.npcBust(L, size)) || UI.npcAvatar(L, size); } catch (e) { return ''; } };

  // 지금 리더가 고른 칸과 그 리더
  const leadInfo = () => {
    const root = document.querySelector('#modal-box .exploration-layout'); if (!root) return null;
    if (UI.exam && UI.exam.map) {
      // 시험: 길은 늘 리더가 정한다. 화면에서 선택된 카드가 리더의 선택이다
      const L = UI.examLeader && UI.examLeader(); if (!L) return null;
      const sel = root.querySelector('.xr-card.selected'); return sel ? { key: sel.dataset.v, L } : null;
    }
    const c = UI.ctx; const cn = c && c.council;
    if (cn && cn.leader != null && cn.key) { const L = G.npcById(cn.leader); return L ? { key: cn.key, L } : null; }
    return null;
  };

  // 카드·지도 칸에 리더 얼굴 붙이기 (이미 붙어 있으면 그대로)
  const mark = () => {
    const root = document.querySelector('#modal-box .exploration-layout'); if (!root) return;
    const info = leadInfo(); const want = info ? info.key + '@' + info.L.id : '';
    if (root.dataset.leadMark === want) return;
    root.dataset.leadMark = want;
    root.querySelectorAll('.xr-lead-badge, .xr-lead-node').forEach((e) => e.remove());
    root.querySelectorAll('.xr-card.xr-leadpick').forEach((e) => e.classList.remove('xr-leadpick'));
    root.querySelectorAll('.gnode.xr-leadnode').forEach((e) => e.classList.remove('xr-leadnode'));
    if (!info) return;
    const { key, L } = info;
    const card = root.querySelector(`.xr-card[data-v="${key}"]`);
    if (card) {
      card.classList.add('xr-leadpick');
      card.insertAdjacentHTML('beforeend', `<span class="xr-lead-badge" aria-label="${esc(L.name)}(리더)의 선택"><span class="xr-lead-face">${face(L, 144)}</span><span class="xr-lead-tag">리더 선택</span><span class="xr-lead-name">${esc(L.name)}</span></span>`);
    }
    // 경로 지도 칸 위의 리더 얼굴은 뺐다(사용자 요청: 움직이는 표식과 얼굴이 겹쳐 보임). 칸 테두리 강조만 남긴다
    const node = root.querySelector(`.gnode[data-xr-key="${key}"]`);
    if (node) node.classList.add('xr-leadnode');
  };

  const after = (name) => { const base = UI[name]; if (!base) return; UI[name] = function (...a) { const r = base.apply(this, a); try { mark(); } catch (e) { /* 무시 */ } return r; }; };
  ['renderGateMap', 'renderExamMap', 'renderCouncil', 'councilPanel'].forEach(after);
  const baseHandle = UI.handle;
  UI.handle = function (act, v) { const r = baseHandle.call(this, act, v); try { mark(); } catch (e) { /* 무시 */ } return r; };
  // 상의 창이 나중에 열리거나(대화 뒤) 카드가 다시 그려지는 경우를 위해 가볍게 다시 본다
  setInterval(() => { try { if (document.querySelector('#modal-box .exploration-layout')) mark(); } catch (e) { /* 무시 */ } }, 300);

  // 이동하는 동안 모바일에서 경로 지도를 펼쳐 표식이 움직이는 것을 보여 준다
  const baseMove = UI.examMove;
  if (baseMove) UI.examMove = function (...a) {
    const r = baseMove.apply(this, a);
    try {
      const root = document.querySelector('#modal-box .exploration-layout');
      if (root && MOBILE()) {
        root.classList.add('xr-overview', 'xr-moving');
        const tk = root.querySelector('#gtoken'); const sc = root.querySelector('.xr-map-scroll');
        if (tk && sc) {
          // 표식이 지도 가운데쯤 오게 미리 스크롤(움직이는 동안 따라간다)
          const follow = () => { if (!tk.isConnected) return; const t = tk.offsetTop - sc.clientHeight / 2; sc.scrollTop = Math.max(0, t); };
          follow(); const id = setInterval(follow, 60); setTimeout(() => clearInterval(id), 1100);
        }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}

// 팀 상의 창: 위쪽 '의견 확인 중' 자리에 [전체 맵 보기] (사용자 요청)
// 누르면 상의 창을 잠시 숨기고 경로 지도를 펼친다. 이 지도에서는 리더가 제안한 칸 위에 리더 얼굴을 붙인다.
// 지도를 닫으면 상의 창으로 돌아온다.
{
  const face = (L, size) => { try { return (UI.npcBust && UI.npcBust(L, size)) || UI.npcAvatar(L, size); } catch (e) { return ''; } };
  const leadKey = () => {
    if (UI.councilLead && UI.councilLead.key) return { key: UI.councilLead.key, L: UI.examLeader && UI.examLeader() };
    const cn = UI.ctx && UI.ctx.council; if (cn && cn.key) return { key: cn.key, L: cn.leader != null ? G.npcById(cn.leader) : null };
    return null;
  };
  const closeMap = () => {
    document.body.classList.remove('cn-map-on');
    const root = document.querySelector('#modal-box .exploration-layout');
    if (root) { root.classList.remove('xr-overview', 'xr-cnmap'); root.querySelectorAll('.xr-lead-node, .xr-lead-arrow').forEach((e) => e.remove()); }
  };
  const openMap = () => {
    const root = document.querySelector('#modal-box .exploration-layout'); if (!root) return;
    root.classList.add('xr-overview', 'xr-cnmap'); document.body.classList.add('cn-map-on');
    root.querySelectorAll('.xr-lead-node, .xr-lead-arrow').forEach((e) => e.remove());
    const info = leadKey(); const node = info && root.querySelector(`.gnode[data-xr-key="${info.key}"]`);
    if (node && info.L) { node.classList.add('xr-leadnode'); node.insertAdjacentHTML('beforeend', `<span class="xr-lead-node" aria-hidden="true">${face(info.L, 96)}<b class="xr-lead-node-tag">리더 선택</b></span>`); }
    // 지금 자리 → 리더가 고른 칸: 흐르는 점선 화살표
    try {
      const gm = node && node.closest('.gmap'); const tk = gm && gm.querySelector('.gtoken.lead');
      if (gm && tk) {
        const g = gm.getBoundingClientRect(); const a = tk.getBoundingClientRect(); const b = node.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - g.left, y1 = a.top + a.height / 2 - g.top, x2 = b.left + b.width / 2 - g.left, y2 = b.top + b.height / 2 - g.top;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1; const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        const sx = x1 + ux * 18, sy = y1 + uy * 18, ex = x2 - ux * (b.width / 2 + 6), ey = y2 - uy * (b.height / 2 + 6);
        gm.insertAdjacentHTML('beforeend', `<svg class="xr-lead-arrow" width="${g.width}" height="${g.height}" viewBox="0 0 ${g.width} ${g.height}" aria-hidden="true">
          <defs><marker id="xrLeadHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#ffb547"/></marker></defs>
          <line class="xr-la-glow" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}"/>
          <line class="xr-la-line" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" marker-end="url(#xrLeadHead)"/></svg>`);
      }
    } catch (e) { /* 화살표 실패는 지도를 막지 않는다 */ }
    const sc = root.querySelector('.xr-map-scroll'); if (sc && node) sc.scrollTop = Math.max(0, node.offsetTop - sc.clientHeight / 2);
  };
  const dock = () => {
    const st = document.querySelector('#council-ov .cv-header .cv-state'); if (!st || !document.querySelector('#modal-box .exploration-layout')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'cv-mapbtn'; b.textContent = '전체 맵 보기';
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openMap(); });
    st.replaceWith(b);
  };
  setInterval(() => { try { dock(); if (document.body.classList.contains('cn-map-on') && !document.getElementById('council-ov')) closeMap(); } catch (e) { /* 무시 */ } }, 150);
  const baseHandle2 = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'xr-map-close' && document.body.classList.contains('cn-map-on')) { closeMap(); return; }
    return baseHandle2.call(this, act, v);
  };
}
