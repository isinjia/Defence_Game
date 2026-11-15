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
//    ② 맨 마지막에 이 스킬에 붙은 태그(레벨·접사·범위·성격)가 무슨 뜻인지 적는다.
{
  const SCOPE_TXT = { '단일': '적 하나를 노린다', '전체': '적 전체에 한꺼번에 쓴다', '아군 1': '아군 하나에게 쓴다', '아군 전체': '아군 전체에 한꺼번에 쓴다', '자신': '나에게 쓴다', '무작위': '적 여럿을 무작위로 여러 번 친다' };
  const KIND_TXT = { '치명': '치명타가 잘 터진다', '관통': '방어를 일부 무시한다', '연타': '여러 번 나눠 친다', '중독': '맞힌 적에게 지속 피해', '기절': '맞힌 적의 차례를 늦춘다', '흡혈': '준 피해 일부로 체력을 회복한다', '약화': '적의 능력을 떨어뜨린다', '도발': '적의 공격을 나에게 끈다', '회복': '체력을 회복한다', '치유': '아군의 체력을 회복한다', '부활': '쓰러진 아군을 일으킨다', '강화': '능력을 올린다', '방어': '받는 피해를 줄인다', '회피': '공격을 피하기 쉬워진다', '소환': '싸울 소환수를 부른다' };
  const fmtK = (v) => (Math.round(v * 100) / 100).toString();
  const tagRows = (sk) => {
    const rows = []; const p = G.player; const mine = p && (p.skills || []).includes(sk.id) && sk.id !== 'strike';
    if (mine && G.skillLv) {
      const lv = G.skillLv(sk.id);
      rows.push(lv >= 5 ? ['각성', '숙련이 끝까지 올라 각성한 스킬. 두 갈래 진화 중 하나를 골라 바뀐다']
        : [`Lv${lv}`, '숙련 레벨. 쓸수록 숙련이 쌓여 오르고, 오를 때마다 위력·절약·예리함 중 하나를 골라 키운다. Lv5에서 각성']);
    }
    const a = mine && p.skillAffix && p.skillAffix[sk.id];
    if (a && typeof affixById === 'function') {
      for (const x of [a.h, a.a].map((k) => k && affixById(k)).filter((x) => x && x.name)) {
        const parts = []; if (x.power !== 1) parts.push(`위력 ×${fmtK(x.power)}`); if (x.mp !== 1) parts.push(`정신력 소모 ×${fmtK(x.mp)}`);
        rows.push([x.name, `${x.id === a.h ? '숨은 접사. ' : '접사(스킬마다 무작위로 붙음). '}${parts.join(' · ') || '변화 없음'}`]);
      }
    }
    if (typeof TYPE_NAME !== 'undefined' && TYPE_NAME[sk.type]) rows.push([TYPE_NAME[sk.type], '스킬 종류' + (typeof SKILL_EFFECT !== 'undefined' && SKILL_EFFECT[sk.type] ? ` · ${SKILL_EFFECT[sk.type]}` : '')]);
    if (typeof SKILL_SCOPE === 'function') { const [sc] = SKILL_SCOPE(sk); if (sc && SCOPE_TXT[sc] && sc !== TYPE_NAME[sk.type]) rows.push([sc, `범위 · ${SCOPE_TXT[sc]}`]); }
    if (typeof SKILL_KIND !== 'undefined') { const k = SKILL_KIND[sk.type]; if (k && KIND_TXT[k] && k !== TYPE_NAME[sk.type]) rows.push([k, `성격 · ${KIND_TXT[k]}`]); }
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
