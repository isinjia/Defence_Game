// ===== 시험 게이트: 길과 사건은 리더가 정하고, 이동도 리더가 한다 (영역 D, 4-3 · 사용자 요청) =====
// 내가 리더가 아닐 때는 지도 칸을 누르지 않는다. 흐름은 매 칸 똑같다:
//   리더가 한마디(대화, 한 번 나오고 끝) → 팀 상의(동기 O/X, 나는 [따른다]/[반대한다]만) → 정해진 칸으로 자동 이동.
//   응답 시간 제한 없이 직접 선택한다. 길이 하나뿐이면 한마디 뒤 바로 이동.
// 칸 안의 사건(갈림길·상자·샘)도 리더가 고르고, 나는 따르거나 반대(다른 의견)만 낸다.

// 선택은 플레이어가 직접 한다. 자동 시험 지원은 no_autofollow.js에서만 제공한다.
if (typeof UI !== 'undefined') UI.autoFollow = function () {};

if (typeof UI !== 'undefined' && UI.renderExamMap) {
  const V = (T, L) => (T.banmal && G.personaRegister && G.personaRegister(L) === 'banmal' ? T.banmal : T[voiceKey(L)] ?? T[voiceCol(L)] ?? T.just);
  // 말투표(C)의 말투 이름으로 고르는 줄: haera·banmal·short·haeyo·hapsyo·hao
  const R = (T, L) => { const r = G.personaRegister ? G.personaRegister(L) : 'haera'; return T[r === 'hage' ? 'hao' : r] ?? T.haera; };
  const STEP_SAY = {
    your1: {
      haera: '앞의 두 길 다 괴수 냄새가 난다. 피할 수 없으니 가까운 쪽으로 간다.', banmal: '앞의 두 길 다 괴수가 있어. 어차피 싸워야 하니까 가까운 쪽으로 갈게.', short: '둘 다 괴수. 가까운 쪽.',
      haeyo: '앞의 두 길 모두 괴수가 있어요. 피할 수 없으니 가까운 쪽으로 갈게요.', hapsyo: '앞의 두 길 모두 괴수가 있습니다. 피할 수 없으니 가까운 쪽으로 가겠습니다.', hao: '앞의 두 길 모두 괴수 기척이 있소. 피할 수 없으니 가까운 쪽으로 가겠소.',
    },
    chest: {
      haera: '왼쪽은 녹슨 보급 상자, 오른쪽은 에테르 샘이다. 다들 아직 버틸 만하니 상자를 보러 간다. 버거우면 지금 말해라.', banmal: '왼쪽은 보급 상자, 오른쪽은 회복 샘이야. 다들 아직 괜찮아 보이니까 상자 보러 가자. 힘들면 지금 말해.', short: '왼쪽 상자. 오른쪽 샘. 상자로 간다.',
      haeyo: '왼쪽은 상자, 오른쪽은 회복 샘이에요. 다들 아직 괜찮아 보이니 상자를 보러 갈게요. 힘들면 지금 말해요.', hapsyo: '왼쪽은 보급 상자, 오른쪽은 회복 샘입니다. 아직 여력이 있으니 상자를 확인하겠습니다. 힘드시면 지금 말씀해 주십시오.', hao: '왼쪽은 보급 상자, 오른쪽은 에테르 샘이오. 아직 여력이 있으니 상자를 보러 가겠소. 버거우면 지금 말하시오.',
    },
    rest: {
      haera: '왼쪽은 녹슨 보급 상자, 오른쪽은 에테르 샘이다. 다친 사람이 있으니 샘에서 쉬고 간다.', banmal: '왼쪽은 보급 상자, 오른쪽은 회복 샘이야. 다친 사람이 있으니까 샘에서 쉬고 가자.', short: '왼쪽 상자. 오른쪽 샘. 샘으로 간다.',
      haeyo: '왼쪽은 상자, 오른쪽은 회복 샘이에요. 다친 사람이 있으니 샘에서 쉬고 갈게요.', hapsyo: '왼쪽은 보급 상자, 오른쪽은 회복 샘입니다. 부상자가 있으니 샘에서 쉬고 가겠습니다.', hao: '왼쪽은 보급 상자, 오른쪽은 에테르 샘이오. 다친 이가 있으니 샘에서 쉬고 가겠소.',
    },
  };
  const LEAD_REPLY = {
    ok: { banmal: '좋아, 가자. 내 뒤에 붙어.', just: '좋다. 간다. 내 뒤에 붙어.', kind: '좋아요, 그럼 출발해요!', cold: '간다.' },
    force: { banmal: '반대는 들었어. 그래도 갈 거야. 책임은 내가 져.', just: '반대는 들었다. 그래도 간다. 책임은 내가 진다.', kind: '걱정되는 거 알아요. 그래도 여긴 가야 해요. 제가 맨 앞에 설게요.', cold: '들었다. 그래도 간다.' },
    persuade: { banmal: '걱정되는 거 알아. 내가 맨 앞에 설게. 같이 가자.', just: '걱정은 안다. 내가 맨 앞에 선다. 같이 가자.', kind: '무서운 거 알아요. 제가 앞에 설게요. 위험하면 바로 빠질게요. 같이 가요.', cold: '…맨 앞은 내가 선다. 따라와.' },
    say: { just: '그래, 뒤는 맡긴다.', kind: '고마워요, 든든하네요.', cold: '…좋아. 뒤 맡긴다.' },
    alt: { banmal: '…알았어. 그럼 저쪽으로 가자.', just: '…알았다. 그럼 저쪽으로 간다.', kind: '그래요, 그럼 저쪽으로 가요.', cold: '…저쪽.', hao: '…알겠소. 그럼 저쪽으로 가겠소.', hapsyo: '알겠습니다. 그럼 저쪽으로 가겠습니다.' },
  };
  for (const r of ['hao', 'hapsyo']) for (const k of ['ok', 'force', 'persuade', 'say']) LEAD_REPLY[k][r] = VOICE_EXTRA.reply[r][k].replace(/첫 칸은 훈련용이고, /, '');
  // 사건을 리더가 고를 때
  const EV_SAY = {
    decide: { banmal: (t) => `난 이렇게 할 생각이야. "${t}". 반대면 지금 말해.`, just: (t) => `내 판단은 이거다. "${t}". 반대면 지금 말해.`, kind: (t) => `저는 이렇게 하려고 해요. "${t}". 다른 생각 있으면 말해요.`, cold: (t) => `"${t}". 이걸로 간다.`, hao: (t) => `내 판단은 이렇소. "${t}". 이견이 있으면 말하시오.`, hapsyo: (t) => `제 판단은 이렇습니다. "${t}". 이견이 있으면 말씀해 주십시오.` },
    ask: { banmal: '그럼 네 생각은 뭐야?', just: '그럼 네 생각을 말해 봐.', kind: '그럼 어떻게 하면 좋을까요?', cold: '…말해.', hao: '그럼 그대 생각을 말해 보시오.', hapsyo: '그럼 의견을 말씀해 주십시오.' },
    accept: { banmal: '좋아, 그렇게 하자.', just: '좋다. 그렇게 한다.', kind: '좋아요, 그렇게 해요.', cold: '…그걸로.', hao: '좋소. 그리하겠소.', hapsyo: '알겠습니다. 그렇게 하겠습니다.' },
    force: { banmal: '들었어. 그래도 이번엔 내 판단대로 갈게.', just: '들었다. 그래도 이번엔 내 판단대로 간다.', kind: '미안해요, 이번엔 제 판단대로 갈게요.', cold: '내가 정한다.', hao: '들었소. 허나 이번엔 내 판단대로 가겠소.', hapsyo: '의견은 들었습니다. 이번엔 제 판단대로 가겠습니다.' },
  };

  // 지도가 그려지면(이동 중이 아닐 때) 그 단계의 리더 한마디 → 상의 → 이동을 한 번 시작한다
  const baseRender = UI.renderExamMap;
  UI.renderExamMap = function (opts = {}) {
    const r = baseRender.call(this, opts);
    const m = this.exam && this.exam.map;
    if (m && !opts.leaderPick && !opts.move && m.step !== 'pick1' && m.asked !== m.step) {
      m.asked = m.step; const ctx = this.ctx;
      setTimeout(() => { if (this.ctx === ctx && this.exam && this.exam.map === m && m.asked === m.step) this.examLeadTalk(); }, FX.reduced ? 250 : 700);
    }
    return r;
  };

  Object.assign(UI, {
    examLeadTalk() {
      const m = this.exam.map; const L = this.examLeader(); const step = m.step;
      const reach = this.examReach().map(([r, i]) => r + ':' + i);
      if (!reach.length) return;
      const nodeOf = (k) => { const [r, i] = k.split(':').map(Number); return m.rows[r][i]; };
      let key = reach[0], alt = null, line;
      if (step === 'intro') line = this.examMapSay('intro');
      else if (step === 'boss') line = this.examMapSay('boss');
      else if (step === 'your2') {
        const p = G.player; const hurt = p.hp / p.maxHp < 0.6;
        const rest = reach.find((k) => nodeOf(k).t === 'rest'); const ev = reach.find((k) => nodeOf(k).t !== 'rest');
        key = hurt && rest ? rest : ev || reach[0]; alt = reach.find((k) => k !== key) || null;
        line = R(STEP_SAY[nodeOf(key).t === 'rest' ? 'rest' : 'chest'], L);
      } else { alt = reach[1] || null; line = R(STEP_SAY.your1, L); }
      const who = L || { name: '리더' };
      const next = () => (reach.length <= 1 ? this.examMove(key.split(':').map(Number)) : this.councilLeadStart(key, alt));
      if (!this.talk) return next();
      this.talk([{ who, text: line }], next);
    },
    councilLeadStart(key = '0:0', alt = null) {
      const ex = this.exam; const m = ex.map; const L = this.examLeader(); const pers = L ? voiceKey(L) : 'just';
      const [r, i] = key.split(':').map(Number); const nd = m.rows[r][i]; const nm = GNODE[nd.t].name;
      const mates = (ex.ids || []).map((id) => G.npcById(id)).filter(Boolean);
      const hp = G.player.hp / G.player.maxHp;
      const votes = mates.map((n) => {
        const o = G.councilOpinion(n, nd.t, hp, L ? L.relation : null);
        const line = o.line || (typeof personaCouncil === 'function' ? personaCouncil(n, o.vote === 'X' ? 1 : 0) : null) || (o.vote === 'X' ? '"…난 좀 불안한데."' : '"좋아, 가자."');
        return { id: n.id, vote: o.vote, s: o.s, line };
      });
      this.councilLead = { votes, nd, key, alt, first: m.step === 'intro' };
      this.councilPanel(`<div class="cn-card"><b>팀 상의 · 리더 제안: <span style="color:${GNODE[nd.t].color}">${nm}</span></b>
        <div class="cn-mems">${this.councilVotesHtml({ votes })}</div>
        <div class="cn-btns"><button class="primary" data-act="cn-lead" data-v="O">따른다</button><button class="danger" data-act="cn-lead" data-v="X">반대한다</button></div></div>`);
      this.autoFollow(document.querySelector('#council-ov [data-act="cn-lead"][data-v="O"]'), 5);
    },
    councilLeadResolve(v) {
      const t = this.councilLead; if (!t) return; this.councilLead = null;
      const L = this.examLeader(); const pers = L ? voiceKey(L) : 'just';
      const xs = t.votes.filter((x) => x.vote === 'X').map((x) => G.npcById(x.id)).filter(Boolean);
      const anyX = v === 'X' || xs.length > 0;
      const stubborn = !!L && (L.personality === 'cold' || L.personality === 'warlike');
      const toAlt = v === 'X' && !!t.alt && !stubborn;
      const force = anyX && stubborn;
      const key = toAlt ? 'alt' : !anyX ? 'ok' : force ? 'force' : 'persuade';
      const mine = v === 'O' ? '"좋아요, 가요."' : '"저는 다른 쪽이 낫다고 봐요."';
      if (L) G.changeRel(L, v === 'O' ? 1 : toAlt ? 2 : force ? -1 : 0, v === 'X' ? (toAlt ? '시험에서 내 의견을 받아 주었다' : '시험에서 리더 제안에 반대했다') : '시험에서 리더 제안을 따랐다');
      for (const n of xs) G.changeRel(n, force ? -1 : 1, force ? '반대했는데 리더가 밀어붙였다' : '리더가 걱정을 들어 주었다');
      const votes = t.votes.map((x) => ({ ...x, vote: force ? x.vote : 'O' }));
      const say = V(LEAD_REPLY[key], L);
      this.councilPanel(`<div class="cn-card"><b>팀 상의 · 리더 결정</b>
        <div class="cn-mems">${this.councilVotesHtml({ votes })}</div>
        <p class="event-text"><b>${G.player.name}</b> ${mine}</p>
        <div class="cn-lead-line"><b>${L ? L.name : '리더'}</b> ${say}</div>
        <p class="small dim">${toAlt ? '리더가 내 의견을 받아 길을 바꿨다.' : force ? '리더가 밀어붙였다. 반대한 사람은 조금 서운해한다.' : anyX ? '리더가 설득했다. 다들 고개를 끄덕인다.' : '모두 찬성. 출발한다.'}</p></div>`);
      const ctx = this.ctx; const go = (toAlt ? t.alt : t.key).split(':').map(Number);
      setTimeout(() => {
        if (this.ctx !== ctx || !this.exam) return;
        const ov = document.getElementById('council-ov'); if (ov) ov.remove();
        if (t.first) return this.examLeaderPick();
        this.examMove(go);
      }, FX.reduced ? 800 : 1900);
    },
    // 칸 안의 사건: 리더가 고른다. 나는 따르거나 반대(다른 의견)
    examLeadEvent(node, opts) {
      const c = this.ctx; const L = this.examLeader(); const who = L || { name: '리더' };
      const text0 = typeof node.text === 'function' ? node.text(c) : node.text;
      const choices = node.choices.filter((ch) => !ch.when || ch.when(c));
      const pick = choices.find((ch) => /정찰|던져|마신다/.test(ch.text)) || choices[0];
      const apply = (ch, pre) => {
        const res = fixJosa(ch.do(c)); G.save();
        const effects = (res.match(/\([^()]*\)/g) || []).join(' ');
        const story = res.replace(/\s*\([^()]*\)/g, '').trim();
        this.talk([...(pre || []), { narr: story }, effects ? { sys: effects } : null, opts.after ? { who, text: opts.after } : null].filter(Boolean), () => (G.over ? this.after() : opts.then()));
      };
      const stubborn = !!L && (L.personality === 'cold' || L.personality === 'warlike');
      this.talk([
        { narr: text0 },
        { who, text: opts.arrive },
        { who, text: V(EV_SAY.decide, L)(pick.text) },
        { choices: [
          { text: '따른다', go: () => { if (L) G.changeRel(L, 1, '시험에서 리더 판단을 따랐다'); apply(pick); } },
          { text: '반대한다 · 다른 의견을 낸다', go: () => {
            if (stubborn || choices.length < 2) { if (L) G.changeRel(L, -1, '시험에서 리더 판단에 반대했다'); return apply(pick, [{ who, text: V(EV_SAY.force, L) }]); }
            this.talk([{ who, text: V(EV_SAY.ask, L) }, { choices: choices.filter((ch) => ch !== pick).map((ch) => ({ text: ch.text, go: () => { if (L) G.changeRel(L, 2, '시험에서 내 의견을 받아 주었다'); apply(ch, [{ who, text: V(EV_SAY.accept, L) }]); } })) }]);
          } },
        ] },
      ]);
    },
  });
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'cn-lead') return this.councilLeadResolve(v);
    return baseHandle.call(this, act, v);
  };
}
