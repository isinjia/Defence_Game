// ===== 게이트 크로니클: 팀 상의를 대화로 (영역 A, 사용자 요청) =====
// 게이트 층 지도의 "팀 상의"를 지도 위 패널(#council-ov) 대신 대화창으로 보여 준다.
//   제안(리더 한마디) → 팀원들의 의견(한 화면에 O/X와 한마디) → 내 선택(대화 선택지) → 리더의 화답(대화) → 이동
// 판정·관계 변화는 council.js · council_exam.js 의 함수를 그대로 쓰고, 그 안의 알림(toast)·패널·지연 이동만 대화로 옮긴다.
{
  const OK_LINES = ['"좋아."', '"찬성."', '"가자."', '"괜찮아 보여."'];
  const NO_LINES = ['"난 반대야."', '"글쎄, 별로야."', '"다른 길은 없어?"'];
  const voteLine = (n, v) => v.line || (typeof personaCouncil === 'function' ? personaCouncil(n, v.vote === 'X' ? 1 : 0) : null) || RNG.pick(v.vote === 'X' ? NO_LINES : OK_LINES);
  const tag = (v) => (v.vote === 'X' ? '<span class="cn-vt x">반대</span> ' : '<span class="cn-vt o">찬성</span> ');
  const groupOf = (votes) => {
    const g = votes.map((v) => { const n = G.npcById(v.id); return n ? { who: n, text: tag(v) + voteLine(n, v) } : null; }).filter(Boolean);
    return g.length ? { group: g } : null;
  };
  const say = (L, T) => { const k = L ? (L.personality === 'cold' ? 'cold' : L.personality === 'kind' ? 'kind' : 'just') : 'just'; return T[k] || T.just; };
  // 알림 문장 "이름: "말"" 을 그 사람의 대사로
  const toLine = (msg) => {
    const s = String(msg || ''); const m = /^(.+?): (["“].*)$/.exec(s);
    if (m) { const n = [...G.party(), ...((UI.exam && UI.exam.ids) || []).map((id) => G.npcById(id)), UI.examLeader ? UI.examLeader() : null].find((x) => x && x.name === m[1]); if (n) return { who: n, text: m[2] }; }
    return s ? { narr: s } : null;
  };
  // 원래 함수를 돌리되 알림·패널·이동·지연을 붙잡는다
  const capture = (ui, fn) => {
    const out = { said: [], panel: null, go: null, move: null, timer: null };
    const T = ui.toast, P = ui.councilPanel, Go = ui.councilGo, Mv = ui.examMove, RC = ui.renderCouncil, ST = window.setTimeout;
    ui.renderCouncil = () => { out.rerender = true; };
    ui.toast = (m) => { out.said.push(m); };
    ui.councilPanel = (h) => { out.panel = h; };
    ui.councilGo = (...a) => { out.go = a; };
    if (Mv) ui.examMove = (...a) => { out.move = a; };
    window.setTimeout = (f, ms, ...r) => { if (!out.timer && ms >= 500) { out.timer = f; return 0; } return ST(f, ms, ...r); };
    try { fn(); } finally { ui.toast = T; ui.councilPanel = P; ui.councilGo = Go; ui.renderCouncil = RC; if (Mv) ui.examMove = Mv; window.setTimeout = ST; }
    out.run = () => { if (out.go) return Go.apply(ui, out.go); if (out.move) return Mv.apply(ui, out.move); if (out.timer) return out.timer(); };
    return out;
  };
  const closeOv = () => { const ov = document.getElementById('council-ov'); if (ov) ov.remove(); };
  const autoPick = (k) => { if (window.TUT_AUTO_TAP) setTimeout(() => { if (UI.dlg) UI.handle('dlg-choice', k); }, 30); };

  // ---------- 일반 게이트 ----------
  UI.renderCouncil = function () {
    const c = this.ctx; const cn = c && c.council; if (!cn) return;
    closeOv();
    const nd = this.nodeOf(cn.key); const N = GNODE[nd.t]; const nm = N.name;
    const L = cn.leader != null ? G.npcById(cn.leader) : null;
    const xs = cn.votes.filter((v) => v.vote === 'X');
    const lines = [];
    if (cn.stage === 'consult') {
      const alts = this.reachable().map(([r, i]) => r + ':' + i).filter((k) => k !== cn.key);
      lines.push({ narr: '반대한 팀원들의 이야기를 들었다. 어떻게 할까?' });
      lines.push({ choices: [
        ...alts.map((k) => ({ text: `${GNODE[this.nodeOf(k).t].name}(으)로 바꾼다`, go: () => this.handle('cn-alt', k) })),
        { text: '설득한다', go: () => this.handle('cn-persuade') },
        { text: '지도로 돌아가 다시 고른다', go: () => this.handle('cn-back') },
      ] });
      return this.talk(lines);
    }
    if (!cn.talked) {
      cn.talked = true;
      if (L) lines.push({ who: L, text: say(L, { just: `"${nm}(으)로 간다. 반대 있으면 지금 말해."`, kind: `"${nm} 쪽으로 가 볼까요? 의견 있으면 말해 줘요."`, cold: `"${nm}. 간다. 할 말 있으면 해."` }) + (cn.clicked && cn.clicked !== cn.key ? ` (당신이 가리킨 곳은 ${GNODE[this.nodeOf(cn.clicked).t].name} 칸이었다)` : '') });
      else lines.push({ who: 'player', text: `"${nm}(으)로 가려는데, 다들 어때?"` });
      const g = groupOf(cn.votes); if (g) lines.push(g);
    }
    if (L) {
      lines.push({ choices: [
        { text: '찬성한다', go: () => this.handle('cn-vote', 'O') },
        { text: '반대한다', go: () => this.handle('cn-vote', 'X') },
        { text: cn.clicked && cn.clicked !== cn.key ? '"저쪽이 낫지 않아?"' : '"좀 더 생각해 보자."', go: () => this.handle('cn-vote', 'X!') },
        ...(c.run && !c.run.blocked && this.showBlock ? [{ text: '막아선다 (리더와 관계가 크게 흔들린다)', go: () => this.handle('cn-vote', 'B') }] : []),
      ] });
    } else if (xs.length) {
      lines.push({ choices: [
        { text: '상의한다', go: () => this.handle('cn-consult') },
        { text: '그냥 진행한다 (반대한 팀원과 관계 하락)', go: () => this.handle('cn-force') },
      ] });
    } else {
      lines.push({ choices: [
        { text: '진행한다', go: () => this.handle('cn-go') },
        { text: '다시 고른다', go: () => this.handle('cn-back') },
      ] });
    }
    this.talk(lines);
    autoPick(0);
  };

  const wrapSay = (name, pre) => {
    const base = UI[name]; if (!base) return;
    UI[name] = function (...a) {
      const before = pre ? pre.call(this, ...a) : null;
      const cap = capture(this, () => base.apply(this, a));
      const lines = [];
      if (before && before.mine) lines.push(before.mine);
      if (before && before.extra) lines.push(...before.extra(this));
      for (const s of cap.said) { const l = toLine(s); if (l) lines.push(l); }
      closeOv();
      if (!lines.length) return cap.run();
      // 다시 상의 창을 그려야 하는 경우(설득 뒤)에는 원래 창 그리기를 대화 뒤로
      this.talk(lines, () => { if (cap.go || cap.move || cap.timer) return cap.run(); if (this.ctx && this.ctx.council) this.renderCouncil(); });
    };
  };
  wrapSay('councilNpcDecide', (v) => ({ mine: { who: 'player', text: v === 'B' ? '"잠깐. 거긴 안 돼. 내가 막겠어."' : v === 'O' ? '"좋아, 따를게."' : v === 'X!' ? '"저쪽이 낫지 않아?"' : '"난 반대야."' } }));
  wrapSay('councilForce', () => ({ mine: { who: 'player', text: '"반대는 들었어. 그래도 간다."' } }));
  wrapSay('councilAltPick', function (k) { return { mine: { who: 'player', text: `"알았어. ${GNODE[this.nodeOf(k).t].name}(으)로 가자."` } }; });
  wrapSay('councilPersuade', function () {
    const cn = this.ctx.council; const ids = cn.votes.filter((x) => x.vote === 'X').map((x) => x.id);
    return { mine: { who: 'player', text: '"내 말 좀 들어 봐. 이쪽이 맞아."' }, extra: () => { const g = groupOf(cn.votes.filter((v) => ids.includes(v.id))); return g ? [g] : []; } };
  });
  // 설득 뒤 다시 그릴 때는 의견을 또 읊지 않는다(cn.talked 유지). 대화 중에 원래 함수가 창을 다시 그리지 않게 막는다
  const baseRC = UI.renderCouncil;
  UI.renderCouncil = function (...a) { if (this.dlg) return; return baseRC.apply(this, a); };

  // ---------- 시험 게이트(튜토리얼) ----------
  const baseLead = UI.councilLeadStart;
  if (baseLead) UI.councilLeadStart = function (...a) {
    const cap = capture(this, () => baseLead.apply(this, a));
    const t = this.councilLead; if (!t) return;
    const L = this.examLeader(); const nm = GNODE[t.nd.t].name;
    const lines = [
      { who: L || '리더', text: say(L, { just: `"${nm}(으)로 간다. 반대 있으면 지금 말해."`, kind: `"${nm} 쪽으로 가 볼까요? 의견 있으면 말해 줘요."`, cold: `"${nm}. 간다."` }) },
      groupOf(t.votes),
      { choices: [{ text: '따른다', go: () => this.handle('cn-lead', 'O') }, { text: '반대한다', go: () => this.handle('cn-lead', 'X') }] },
    ];
    closeOv(); this.talk(lines); autoPick(0);
    return cap;
  };
  const baseRes = UI.councilLeadResolve;
  if (baseRes) UI.councilLeadResolve = function (...a) {
    const cap = capture(this, () => baseRes.apply(this, a));
    const lines = [];
    if (cap.panel) {
      const d = document.createElement('div'); d.innerHTML = cap.panel;
      const mine = d.querySelector('p.event-text'); const lead = d.querySelector('.cn-lead-line'); const note = d.querySelector('p.small.dim');
      if (mine) { const b = mine.querySelector('b'); if (b) b.remove(); lines.push({ who: 'player', text: mine.textContent.trim() }); }
      if (lead) { const b = lead.querySelector('b'); if (b) b.remove(); lines.push({ who: this.examLeader() || '리더', text: lead.textContent.trim() }); }
      if (note) lines.push({ narr: note.textContent.trim() });
    }
    closeOv();
    this.talk(lines, () => cap.run());
  };
  const baseTut = UI.councilTutStart;
  if (baseTut) UI.councilTutStart = function (k) {
    const cap = capture(this, () => baseTut.call(this, k));
    const t = this.councilTut; if (!t) return;
    const L = this.examLeader();
    let lead = ''; let note = '';
    if (cap.panel) { const d = document.createElement('div'); d.innerHTML = cap.panel; const ls = d.querySelector('.lead-say div'); lead = ls ? ls.textContent.trim() : ''; const p = d.querySelector('p.small.dim'); note = p ? p.textContent.trim() : ''; }
    closeOv();
    this.talk([
      lead ? { who: L || '리더', text: `"${lead}"` } : null,
      groupOf(t.votes),
      note ? { sys: note.split('일반 게이')[0].trim() } : null,
      { choices: [{ text: '상의한다', go: () => this.handle('cn-tut', 'talk') }, { text: '그냥 진행한다', go: () => this.handle('cn-tut', 'force') }] },
    ]);
    autoPick(0);
  };
  wrapSay('councilTutNext', (v) => ({ mine: { who: 'player', text: v === 'force' ? '"걱정은 알겠어. 그래도 가자."' : '"무슨 걱정인지 들어 볼게."' } }));
}
