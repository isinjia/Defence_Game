// 소속 파티(NPC 리더) 다듬기 (사용자 요청: "기한을 매우 넉넉하게", 파티 시스템 완성도)
// 1. 합류 기한을 매우 넉넉하게: 첫 기한 21일 이상, 다음 기한 18~28일(지휘가 서툰 리더도 14~20일).
//    거점이 멀면 이동 시간만큼 더 준다.
// 2. 지각 불이익을 가볍게: 리더 관계 −4, 다른 팀원 −1, 명성 −1, 신뢰 −8. 다섯 번 어기면 제명.
// 3. 다른 일을 하는 중에는 기한을 어긴 것으로 치지 않는다: 게이트 안·전투 중, 첫 공략 진행 중, 리더가 이끄는 이동 중이면
//    기한을 그만큼 미룬다(연락은 일이 끝난 뒤).
// 4. 말 다듬기: 기한을 어겨 팀이 따로 나간 직후에 "수고했다"라고 하지 않는다. 일감이 없어 훈련으로 바꿀 때는 이유를 말한다.
{
  if (typeof CREW_TIME !== 'undefined') Object.assign(CREW_TIME, { firstDue: 21, dueMin: 18, dueMax: 28, dueLowMin: 14, dueLowMax: 20 });
  if (typeof RALLY !== 'undefined') Object.assign(RALLY, { missLeader: 4, missMember: 1, missFame: 1, missTrust: 8, kickAfter: 5 });

  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };

  // 1. 거점이 멀면 이동 시간만큼 더
  const baseSet = GP.crewSetDue;
  if (baseSet) GP.crewSetDue = function (first) {
    const r = baseSet.call(this, first);
    try {
      const c = npcLed(this);
      if (c && c.due != null && typeof regionDist === 'function') c.due += Math.max(0, regionDist(this.player.region, c.base)) * 3;
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 3. 다른 일을 하는 중이면 기한을 미룬다
  const busy = (g) => {
    if (typeof UI === 'undefined') return false;
    if (UI.ctx) return true; // 게이트 안·전투·상의
    if (UI.crewMarch) return true; // 리더가 이끄는 이동
    const s = g.player && g.player.firstSortie; if (s && !s.returned && s.status === 'active') return true; // 첫 공략 진행 중
    return false;
  };
  const baseTick = GP.crewDayTick;
  if (baseTick) GP.crewDayTick = function (...a) {
    try {
      const c = npcLed(this);
      if (c && !c.on && c.due != null && busy(this) && c.due - absDay(this) < 2) { c.due = absDay(this) + 2; c.dueWarned = false; }
    } catch (e) { /* 무시 */ }
    return baseTick.apply(this, a);
  };

  // 4. 기한을 어긴 직후의 연락은 "수고했다"가 아니라 다음엔 오라는 말로
  const baseMiss = GP.crewMissDue;
  if (baseMiss) GP.crewMissDue = function (...a) {
    const c = npcLed(this); const before = c ? c.missed || 0 : 0;
    const r = baseMiss.apply(this, a);
    try { const c2 = npcLed(this); if (c2 && (c2.missed || 0) > before) c2._justMissed = true; } catch (e) { /* 무시 */ }
    return typeof r === 'string' ? r.replace('세 번이면 충분해.', '다섯 번이면 충분해.') : r;
  };
  if (typeof UI !== 'undefined' && UI.talk) {
    const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };
    const baseTalk = UI.talk;
    UI.talk = function (lines, ...a) {
      try {
        if (Array.isArray(lines)) {
          const c = npcLed(G);
          lines = lines.map((l) => {
            if (!l || typeof l.text !== 'string' || !l.who || typeof l.who !== 'object') return l;
            const k = col(l.who);
            // 기한을 어긴 직후: "수고했다/수고했어요. 다음은 ○일까지 …"
            let m = /^(?:수고했다|수고했어요!?|수고)[.!]?\s*다음(?:은|엔)\s*(.+?)까지\s*(.+?)(?:\(으\)로|으로|로|에서)/.exec(l.text);
            if (m && c && c._justMissed) {
              c._justMissed = false;
              const when = m[1], where = m[2].replace(/\(으\)$/, '');
              const T = { just: `이번엔 우리끼리 다녀왔다. 다음엔 꼭 와라. ${when}까지 ${where}(으)로.`, kind: `이번엔 저희끼리 다녀왔어요. 다음엔 꼭 와요. ${when}까지 ${where}에서 봐요.`, cold: `다음엔 와라. ${when}, ${where}.` };
              return { ...l, text: fixJosa(T[k] || T.just) };
            }
            // 일감이 없어 훈련으로: 이유를 말한다
            if (/합동 훈련/.test(l.text) && /출발/.test(l.text)) {
              const T = { just: '근처에 갈 만한 게이트가 없다. 이번엔 합동 훈련이다. 손발부터 맞춘다.', kind: '근처에 마땅한 일이 없어서, 이번엔 합동 훈련이에요. 손발부터 맞춰 봐요.', cold: '근처에 일이 없다. 합동 훈련.' };
              return { ...l, text: T[k] || T.just };
            }
            return l;
          });
        }
      } catch (e) { /* 무시 */ }
      return baseTalk.call(this, lines, ...a);
    };
  }
}

// ===== 1단계: 소속 파티 모순·버그 정리 (사용자 요청 "전부 해") =====
// 1) 함께 일하는 중(팀 이동·게이트)에는 "○일까지 거점으로 와라" 연락을 띄우지 않는다(가입 때 쌓인 환영 연락이 이동 도중 튀어나왔다).
// 2) 파티 화면의 옛 안내("리더가 매달 일정을 잡아 연락한다·다음 일정은 다음 달 초") → 지금 방식과 합류 기한·남은 날.
// 3) 개인 시간인데 진형에 팀원이 서 있던 것 → 진형 위에 "다음 팀 일 때의 자리"라고 밝힌다.
// 4) 소속 파티 중에는 영입·용병 고용이 막혀 있는데 화면 안내는 할 수 있다고 했다 → 안내를 바꾼다.
// 6) 합동 훈련이 아무 연출 없이 한 달을 건너뛰던 것 → 훈련 장면(리더·팀원 한마디, 결과)을 보여 준다.
// 7) 옛 집결(rally) 규칙이 옛 저장에 남아 있으면 지금 방식(거점 합류 기한)으로 바꾼다.
{
  const GP = Game.prototype;
  const absDay = (g) => g.monthKey() * 30 + g.day;
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  const dateOf = (g, abs) => { const d = abs - absDay(g); const mm = g.month + Math.floor((g.day + d - 1) / 30); const dd = ((g.day + d - 1) % 30) + 1; return `${((mm - 1) % 12) + 1}월 ${dd}일`; };
  const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };

  // 7) 옛 집결 → 거점 합류 기한
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) {
    const r = baseInit.apply(this, a);
    try { const c = npcLed(this); if (c && c.rally) { c.rally = null; if (!c.on && c.due == null && this.crewSetDue) { this.crewSetDue(false); this.queue = this.queue.filter((q) => q.type !== 'crewCall'); } } } catch (e) { /* 무시 */ }
    return r;
  };

  if (typeof UI !== 'undefined') {
  // 1) 함께 일하는 중에는 거점 연락을 띄우지 않는다
  if (UI.crewCall) {
    const baseCall = UI.crewCall;
    UI.crewCall = function (first, ...a) {
      const c = npcLed(G);
      if (c && (c.on || c.job || this.crewMarch)) return this.processQueue();
      return baseCall.call(this, first, ...a);
    };
  }
  if (UI.crewWork) {
    const baseWork = UI.crewWork;
    UI.crewWork = function (...a) {
      try { G.queue = G.queue.filter((q) => q.type !== 'crewCall' && q.type !== 'crewLate'); } catch (e) { /* 무시 */ }
      return baseWork.apply(this, a);
    };
  }
  // 2) 파티 화면 안내
  if (UI.crewHtml) {
    const baseHtml = UI.crewHtml;
    UI.crewHtml = function (...a) {
      let h = baseHtml.apply(this, a);
      try {
        const c = npcLed(G); if (!c) return h;
        h = h.replace('리더가 매달 일정을 잡아 연락한다.', '평소엔 개인 시간이고, 합류 기한 안에 거점에서 리더에게 말을 걸면 바로 함께 일하러 간다.');
        const L = G.crewLeader();
        const line = c.on || c.job ? `<p class="small good">지금 ${L ? L.name + '와(과) ' : ''}팀이 함께 일하는 중이다.</p>`
          : c.due != null ? `<p class="small">합류 기한 <b>${dateOf(G, c.due)}</b> · 거점 <b>${G.crewBaseName()}</b> <span class="${c.due - absDay(G) <= 3 ? 'amber' : 'dim'}">(${Math.max(0, c.due - absDay(G))}일 남음)</span> ${G.crewAtBase && G.crewAtBase() ? '<button class="sm primary" data-act="crew-talk">리더에게 말 걸기</button>' : ''}</p>`
          : '';
        h = h.replace('<p class="small dim">다음 일정은 다음 달 초에 연락이 온다.</p>', line);
        h = fixJosa(h);
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
  // 3)·4) 진형과 파티 안내
  if (UI.formationHtml) {
    const baseForm = UI.formationHtml;
    UI.formationHtml = function (...a) {
      const h = baseForm.apply(this, a);
      try { const c = npcLed(G); if (c && !c.on) return `<p class="small dim crew-form-note">아래는 다음에 팀이 함께 일할 때의 자리다. 지금은 개인 시간이라 전투에는 나 혼자 나선다.</p>${h}`; } catch (e) { /* 무시 */ }
      return h;
    };
  }
  if (UI.partyHtml) {
    const baseParty = UI.partyHtml;
    UI.partyHtml = function (...a) {
      let h = baseParty.apply(this, a);
      try {
        if (G.crew && G.crew()) h = h.replace(/관계 50 이상인 인물에게 파티 합류를 청하거나, 도시의 용병 사무소에서 고용할 수 있습니다\./, '소속 파티에 있는 동안에는 따로 동료를 영입하거나 용병을 고용할 수 없습니다. 팀원 구성은 리더가 정합니다.');
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
  // 6) 합동 훈련 장면
  if (UI.crewDepart) {
    const baseDepart = UI.crewDepart;
    UI.crewDepart = function (plan, tgt, days, ...a) {
      if (!plan || plan.kind !== 'train' || tgt) return baseDepart.call(this, plan, tgt, days, ...a);
      const c = npcLed(G); const L = G.crewLeader(); if (!c || !L) return baseDepart.call(this, plan, tgt, days, ...a);
      c.job = true;
      const gain = G.trainGain(1.6); G.addEther(gain);
      const mates = G.withCrew(() => G.party()).filter((n) => n !== L && n.crewOf === c.id);
      for (const n of [L, ...mates]) G.changeRel(n, 3, '함께 훈련했다');
      G._crewBusy = true; try { G.advanceMonth(1, { eventChance: 0.1 }); } finally { G._crewBusy = false; }
      G.log(`${c.name}와(과) 한 달 동안 합동 훈련을 했다. 에테르 +${fmt(gain)}`, 'good');
      const k = col(L); const m = mates[0];
      const lines = [
        { narr: `${G.crewBaseName()} 외곽 훈련장. 한 달 동안 매일 같은 동작을 맞췄다. 전열이 막고, 후열이 치고, 빠질 때 서로를 엄호하는 순서.` },
        { who: L, text: { just: '처음보다 훨씬 낫다. 이제 서로 어디 있는지 안 봐도 안다.', kind: '다들 많이 늘었어요! 이제 눈빛만 봐도 알겠죠?', cold: '…쓸 만해졌다.' }[k] || '처음보다 훨씬 낫다.' },
        m ? { who: m, text: '이 정도면 다음 게이트는 문제없겠는데.' } : null,
        { sys: `합동 훈련 한 달 · 에테르 +${fmt(gain)} · 팀원과의 관계 +3` },
      ].filter(Boolean);
      return this.talk(lines, () => { this.crewJobDone && this.crewJobDone(); this.renderGame(); this.processQueue(); });
    };
  }
  }
}
