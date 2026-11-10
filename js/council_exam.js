// ===== 시험 게이트 첫 칸: 리더 제안 → 동기 O/X → 나도 의견 → 리더 결정 → 이동 (영역 D, 4-3) =====
// 예전에는 "리더를 따라간다" 버튼 하나였다. 이제 첫 칸도 팀 상의로 정한다. 리더가 아니어도 의견은 낼 수 있고, 정하는 건 리더다.
if (typeof UI !== 'undefined' && UI.renderExamMap) {
  const baseRender = UI.renderExamMap;
  UI.renderExamMap = function (opts = {}) {
    const r = baseRender.call(this, opts);
    const m = this.exam && this.exam.map;
    if (m && m.step === 'intro' && !opts.leaderPick && !opts.move) {
      for (const b of document.querySelectorAll('#modal-box [data-act="exm-watch"]')) b.closest('.row') ? b.closest('.row').remove() : b.remove();
      if (!m.leadVote) { m.leadVote = true; const ctx = this.ctx; setTimeout(() => { if (this.ctx === ctx && this.exam && this.exam.map === m && m.step === 'intro') this.councilLeadStart(); }, FX.reduced ? 300 : 900); }
    }
    return r;
  };

  const LEAD_PROPOSE = {
    just: (nm) => `첫 칸은 저 ${nm}이다. 내가 앞장선다. 의견 있으면 지금 말해.`,
    kind: (nm) => `처음엔 저 ${nm}부터 가 봐요. 다들 어때요? 반대면 편하게 말해요.`,
    cold: (nm) => `${nm}. 간다. 반대면 말해.`,
  };
  const LEAD_REPLY = {
    ok: { just: '좋다. 간다. 내 뒤에 붙어.', kind: '좋아요, 그럼 출발해요!', cold: '간다.' },
    force: { just: '반대는 들었다. 그래도 간다. 첫 칸은 훈련용이고, 책임은 내가 진다.', kind: '걱정되는 거 알아요. 그래도 여긴 가야 해요. 제가 맨 앞에 설게요.', cold: '들었다. 그래도 간다. 첫 칸은 훈련용이다.' },
    persuade: { just: '걱정은 안다. 첫 칸은 훈련용이고, 내가 맨 앞에 선다. 같이 가자.', kind: '무서운 거 알아요. 제가 앞에 설게요. 위험하면 바로 빠질게요. 같이 가요.', cold: '…맨 앞은 내가 선다. 따라와.' },
    say: { just: '그래, 뒤는 맡긴다.', kind: '고마워요, 든든하네요.', cold: '…좋아. 뒤 맡긴다.' },
  };
  const persOf = (L) => { const k = L ? voiceKey(L) : 'just'; return k === 'hao' || LEAD_PROPOSE[k] ? k : 'just'; };
  LEAD_PROPOSE.hao = VOICE_HAO.propose; for (const k in LEAD_REPLY) LEAD_REPLY[k].hao = VOICE_HAO.reply[k];

  Object.assign(UI, {
    councilLeadStart() {
      const ex = this.exam; const m = ex.map; const L = this.examLeader(); const pers = persOf(L);
      const nd = m.rows[0][0]; const nm = GNODE[nd.t].name;
      const mates = (ex.ids || []).map((id) => G.npcById(id)).filter(Boolean);
      const hp = G.player.hp / G.player.maxHp;
      const votes = mates.map((n) => {
        const o = G.councilOpinion(n, nd.t, hp, L ? L.relation : null);
        const line = o.line || (typeof personaCouncil === 'function' ? personaCouncil(n, o.vote === 'X' ? 1 : 0) : null) || (o.vote === 'X' ? '"…난 좀 불안한데."' : '"좋아, 가자."');
        return { id: n.id, vote: o.vote, s: o.s, line };
      });
      this.councilLead = { votes, nd };
      this.councilPanel(`<div class="cn-card"><b>팀 상의 · 리더 제안: <span style="color:${GNODE[nd.t].color}">${nm}</span></b>
        <div class="coach lead-say"><span class="eyebrow">${this.examMapLeadName()}</span><div>${LEAD_PROPOSE[pers](nm)}</div></div>
        <div class="cn-mems">${this.councilVotesHtml({ votes })}</div>
        <p class="small dim">리더가 아니어도 의견은 낼 수 있다. 정하는 건 리더다. 반대가 있으면 리더는 밀어붙이거나 한마디로 설득한다.</p>
        <div class="cn-btns"><button class="primary" data-act="cn-lead" data-v="O">O 찬성</button><button class="danger" data-act="cn-lead" data-v="X">X 반대</button><button data-act="cn-lead" data-v="say">한마디: "뒤는 제가 볼게요."</button></div></div>`);
    },
    councilLeadResolve(v) {
      const t = this.councilLead; if (!t) return; this.councilLead = null;
      const L = this.examLeader(); const pers = persOf(L);
      const xs = t.votes.filter((x) => x.vote === 'X').map((x) => G.npcById(x.id)).filter(Boolean);
      const anyX = v === 'X' || xs.length > 0;
      const force = anyX && pers === 'cold';
      const key = v === 'say' && !xs.length ? 'say' : !anyX ? 'ok' : force ? 'force' : 'persuade';
      const mine = v === 'O' ? '"좋아요, 가요."' : v === 'X' ? '"저는 좀 불안해요."' : '"조심해서 가요. 뒤는 제가 볼게요."';
      if (L) G.changeRel(L, v === 'say' ? 2 : v === 'O' ? 1 : force ? -1 : 0, v === 'X' ? '시험에서 리더 제안에 반대했다' : '시험에서 리더 제안을 거들었다');
      for (const n of xs) G.changeRel(n, force ? -1 : 1, force ? '반대했는데 리더가 밀어붙였다' : '리더가 걱정을 들어 주었다');
      const votes = t.votes.map((x) => ({ ...x, vote: force ? x.vote : 'O' }));
      this.councilPanel(`<div class="cn-card"><b>팀 상의 · 리더 결정</b>
        <div class="cn-mems">${this.councilVotesHtml({ votes })}</div>
        <p class="event-text"><b>${G.player.name}</b> ${mine}</p>
        <div class="coach lead-say"><span class="eyebrow">${this.examMapLeadName()}</span><div>${LEAD_REPLY[key][pers]}</div></div>
        <p class="small dim">${force ? '리더가 밀어붙였다. 반대한 동료는 조금 서운해한다.' : anyX ? '리더가 설득했다. 다들 고개를 끄덕인다.' : '모두 찬성. 출발한다.'}</p></div>`);
      const ctx = this.ctx;
      setTimeout(() => {
        if (this.ctx !== ctx || !this.exam) return;
        const ov = document.getElementById('council-ov'); if (ov) ov.remove();
        this.examLeaderPick();
      }, FX.reduced ? 900 : 2200);
    },
  });
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'cn-lead') return this.councilLeadResolve(v);
    return baseHandle.call(this, act, v);
  };
}
