// ===== 게이트 크로니클: 팀 상의를 대화로 (영역 A, 사용자 요청) =====
// 상의 창(팀원 O/X·한마디·내 선택 버튼)은 그대로 두고, 리더의 말만 창 밖 대화로 보여 준다(사용자 요청).
//   리더 제안(대화) → 상의 창 → 내가 고르면 창이 사라지고 → 내 한마디·리더의 화답(대화) → 이동
// 판정·관계 변화는 council.js · council_exam.js 의 함수를 그대로 쓰고, 그 안의 알림(toast)·패널·지연 이동만 대화로 옮긴다.
{
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

  // ---------- 일반 게이트: 상의 창(팀원 의견·내 선택)은 그대로, 리더의 말만 창 밖 대화로 ----------
  const baseRender0 = UI.renderCouncil;
  const stripLead = () => { document.querySelectorAll('#council-ov .cn-lead-line, #council-ov .lead-say').forEach((e) => e.remove()); };
  UI.renderCouncil = function (...a) {
    const c = this.ctx; const cn = c && c.council;
    const L = cn && cn.leader != null ? G.npcById(cn.leader) : null;
    if (cn && L && cn.stage === 'vote' && !cn.leadSaid) {
      cn.leadSaid = true; closeOv();
      const nm = GNODE[this.nodeOf(cn.key).t].name;
      return this.talk([{ who: L, text: say(L, { just: `"${nm}(으)로 간다. 반대 있으면 지금 말해."`, kind: `"${nm} 쪽으로 가 볼까요? 의견 있으면 말해 줘요."`, cold: `"${nm}. 간다. 할 말 있으면 해."` }) }], () => { if (this.ctx === c && c.council === cn) { baseRender0.apply(this, a); stripLead(); } });
    }
    const r = baseRender0.apply(this, a); stripLead(); return r;
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
  // 내가 리더일 때(강행·다른 칸·설득)는 리더의 화답이 없으므로 원래 상의 창 그대로 둔다
  // 설득 뒤 다시 그릴 때는 의견을 또 읊지 않는다(cn.talked 유지). 대화 중에 원래 함수가 창을 다시 그리지 않게 막는다
  const baseRC = UI.renderCouncil;
  UI.renderCouncil = function (...a) { if (this.dlg) return; return baseRC.apply(this, a); };

  // ---------- 시험 게이트(튜토리얼) ----------
  const baseLead = UI.councilLeadStart;
  if (baseLead) UI.councilLeadStart = function (...a) {
    const cap = capture(this, () => baseLead.apply(this, a));
    const t = this.councilLead; if (!t || !cap.panel) return;
    const L = this.examLeader(); const nm = GNODE[t.nd.t].name; const ctx = this.ctx;
    this.talk([{ who: L || '리더', text: say(L, { just: `"${nm}(으)로 간다. 반대 있으면 지금 말해."`, kind: `"${nm} 쪽으로 가 볼까요? 의견 있으면 말해 줘요."`, cold: `"${nm}. 간다."` }) }],
      () => { if (this.ctx !== ctx || this.councilLead !== t) return; this.councilPanel(cap.panel.replace(/<p class="small dim">정하는 건 리더다[^<]*<\/p>/, '')); stripLead(); /* [사용자 요청] '정하는 건 리더다' 문구 삭제 */ if (window.TUT_AUTO_TAP) this.autoFollow(document.querySelector('#council-ov [data-act="cn-lead"][data-v="O"]'), 1); });
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
    const t = this.councilTut; if (!t || !cap.panel) return;
    const L = this.examLeader(); const d = document.createElement('div'); d.innerHTML = cap.panel;
    const ls = d.querySelector('.lead-say'); const lead = ls ? ls.querySelector('div') : null; const text = lead ? lead.textContent.trim() : '';
    if (ls) ls.remove();
    const ctx = this.ctx; const show = () => { if (this.ctx === ctx && this.councilTut === t) this.councilPanel(d.innerHTML); };
    if (!text) return show();
    this.talk([{ who: L || '리더', text: `"${text}"` }], show);
  };
}
