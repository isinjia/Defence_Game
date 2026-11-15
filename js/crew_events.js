// 소속 파티 팀 사건 (사용자 요청 2-④): 팀이 살아 있는 느낌
// 일을 마치고 거점에 돌아오면, 함께한 일이 2회 이상일 때 가끔(35%) 팀 사건이 하나 생긴다.
//  - 다툼: 두 팀원이 다툰다. 한쪽 편을 들거나 말린다(관계 변화). 다툰 둘은 나중에 화해 사건이 생길 수 있다.
//  - 화해: 다퉜던 둘이 화해한다(둘의 사이 회복, 팀 신뢰 +).
//  - 이탈: 리더와 사이가 나쁜 팀원이 나가겠다고 한다. 붙잡을 수 있다(나와의 관계에 따라).
//  - 신입 합류: 팀원이 2명 이하이면 리더가 신입을 데려온다.
//  - 리더 부상: 리더가 다친다. 내가 부리더면 다음 일은 내가 고른다(제안 판정 없이). 아니면 기한이 7일 늘어난다.
{
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };
  const mates = (c, L) => G.withCrew(() => G.party()).filter((n) => n && n.alive && n !== L && n.crewOf === c.id);
  const absDay = (g) => g.monthKey() * 30 + g.day;

  const pickEvent = (c, L) => {
    const ms = mates(c, L); const list = [];
    if (c.feud && (c.done || 0) - (c.feudAt || 0) >= 2 && ms.some((n) => n.id === c.feud[0]) && ms.some((n) => n.id === c.feud[1])) list.push(['reconcile', 3]); // 다툰 뒤 일 두 번은 지나서
    if (ms.length >= 2 && !c.feud) list.push(['quarrel', 3]);
    const sour = ms.find((n) => (n.links && n.links[L.id] != null ? n.links[L.id] : 30) < 10 || (n.relation || 0) < 5);
    if (sour || (ms.length >= 2 && Math.random() < 0.25)) list.push(['leave', 2]);
    if (ms.length <= 2) list.push(['recruit', 3]);
    if (!(L.injured > 0) && !c.actingLead) list.push(['injury', 1.5]);
    if (!list.length) return null;
    const pool = list.filter((x) => x[0] !== c.lastEv); if (pool.length) list.splice(0, list.length, ...pool); // 같은 사건이 연달아 나오지 않게
    let tot = list.reduce((a, b) => a + b[1], 0), r = Math.random() * tot;
    for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
    return list[0] && list[0][0];
  };

  const run = (ui) => {
    const c = npcLed(G); const L = G.crewLeader(); if (!c || !L) return false;
    if ((c.done || 0) < 2 || Math.random() > 0.35) return false;
    const kind = pickEvent(c, L); if (!kind) return false; const ms = mates(c, L); const k = col(L); c.lastEv = kind;
    if (kind === 'quarrel') {
      const [a, b] = ms.sort(() => Math.random() - 0.5);
      c.feud = [a.id, b.id]; c.feudAt = c.done || 0;
      ui._crewEv = { kind, a: a.id, b: b.id };
      return ui.modal(fixJosa(`<div class="eyebrow">${c.name} · 팀 사건</div><h3>거점 숙소의 말다툼</h3>
        <p class="event-text">${a.name}와(과) ${b.name}이(가) 지난 게이트 일로 언성을 높인다. "네가 뒤를 안 봐서 다 죽을 뻔했잖아!" "그럼 앞에서 혼자 뛰어든 건 누군데?" 다른 팀원들이 슬쩍 나를 본다.</p>
        <div class="cards"><button class="choice-btn" data-act="crew-ev" data-v="a">${a.name} 편을 든다 <span class="dim-in">${a.name} 관계 +4 · ${b.name} −4</span></button>
        <button class="choice-btn" data-act="crew-ev" data-v="b">${b.name} 편을 든다 <span class="dim-in">${b.name} 관계 +4 · ${a.name} −4</span></button>
        <button class="choice-btn" data-act="crew-ev" data-v="calm">둘 다 진정시킨다 <span class="dim-in">팀 신뢰 +3 · 둘 관계 +1</span></button></div>`), 'event-box fit-box');
    }
    if (kind === 'reconcile') {
      const a = G.npcById(c.feud[0]); const b = G.npcById(c.feud[1]); c.feud = null;
      if (a && b) { if (G.changeLink) try { G.changeLink(a, b, 10); } catch (e) { /* 무시 */ } }
      G.crewTrust(3);
      ui.talk([{ narr: fixJosa(`거점 근처 포장마차. ${a.name}와(과) ${b.name}이(가) 나란히 앉아 있다.`) }, { who: a, text: '…저번엔 내가 너무했다.' }, { who: b, text: '아냐, 나도 성질부렸지. 한잔해.' }, { sys: `${a.name}·${b.name} 화해 · 팀 신뢰 +3` }], () => ui.processQueue());
      return true;
    }
    if (kind === 'leave') {
      const n = ms.sort((x, y) => (x.relation || 0) - (y.relation || 0))[0];
      ui._crewEv = { kind, n: n.id };
      const keep = Math.round(Math.max(0.1, Math.min(0.9, 0.2 + (n.relation || 0) / 100)) * 100);
      return ui.modal(fixJosa(`<div class="eyebrow">${c.name} · 팀 사건</div><h3>${n.name}의 이별 통보</h3>
        <p class="event-text">${n.name}이(가) 짐을 싸 들고 나를 찾아왔다. "다른 파티에서 연락이 왔어. ${L.name} 방식이 나랑은 안 맞아서. …너한텐 말하고 가고 싶었어."</p>
        <div class="cards"><button class="choice-btn" data-act="crew-ev" data-v="keep">붙잡는다 <span class="dim-in">받아들일 확률 약 ${keep}%</span></button>
        <button class="choice-btn" data-act="crew-ev" data-v="go">보내 준다 <span class="dim-in">${n.name} 관계 +5</span></button></div>`), 'event-box fit-box');
    }
    if (kind === 'recruit') {
      const n = G.makeNpc(false); n.rankIdx = Math.max(0, L.rankIdx - 1); n.stage = 0; n.region = c.base;
      n.links ??= {}; n.disciples ??= []; n.parents ??= []; G.npcs.push(n);
      n.isCompanion = true; n.crewOf = c.id; n.met = true; n.relation = Math.max(n.relation || 0, 15);
      (G.player.party ||= []).push(n.id);
      G.lifeEvent(`${c.name}에 신입 ${n.name}이(가) 들어왔다.`);
      const T = { just: `새 얼굴이다. ${n.name}. 잘 챙겨 줘라.`, kind: `새 식구예요! ${n.name} 씨예요. 잘 부탁해요.`, cold: `신입. ${n.name}.` };
      ui.talk([{ who: L, text: T[k] || T.just }, { who: n, text: `${n.name}입니다. ${className(n.cls)}예요. 열심히 할게요.` }, { sys: `${c.name}에 ${n.name}(${className(n.cls)}) 합류` }], () => ui.processQueue());
      return true;
    }
    // 리더 부상
    const sub = G.crewRankOf && G.crewRankOf().id === 'sub';
    L.injured = Math.max(L.injured || 0, 1);
    if (sub) {
      c.actingLead = true;
      const T = { just: '팔이 이래서 다음 일은 못 고르겠다. 이번엔 네가 정해라. 부리더잖아.', kind: '저 당분간 무리예요… 다음 일은 부리더가 골라 줘요.', cold: '다쳤다. 다음 건 네가 정해.' };
      ui.talk([{ narr: fixJosa(`${L.name}이(가) 붕대 감은 팔을 들어 보인다.`) }, { who: L, text: T[k] || T.just }, { sys: '대리 지휘 · 다음에 거점에서 리더에게 말을 걸면 일을 내가 고른다(제안 판정 없음)' }], () => ui.processQueue());
    } else {
      if (c.due != null) c.due += 7;
      const T = { just: '좀 다쳤다. 일주일은 쉬어야겠다. 다음 집합은 미룬다.', kind: '저 좀 다쳤어요. 일주일만 쉴게요. 다음 모임은 늦춰요.', cold: '다쳤다. 일주일 미룬다.' };
      ui.talk([{ who: L, text: T[k] || T.just }, { sys: '리더 부상 · 합류 기한 +7일' }], () => ui.processQueue());
    }
    return true;
  };

  if (typeof UI !== 'undefined') {
    // 일이 끝나고 거점에 돌아오면
    const baseDone = UI.crewJobDone;
    if (baseDone) UI.crewJobDone = function (...a) {
      const c0 = npcLed(G); const wasJob = !!(c0 && c0.job);
      const r = baseDone.apply(this, a);
      try { if (wasJob && npcLed(G)) G.queue.push({ type: 'crewEvent' }); } catch (e) { /* 무시 */ }
      return r;
    };
    const baseQ = UI.processQueue;
    UI.processQueue = function (...a) {
      if (this.modalOpen && this.modalOpen()) return;
      const q = G.queue && G.queue[0];
      if (q && q.type === 'crewEvent' && !this.ctx && !this.dlg) { G.queue.shift(); if (run(this)) return; return this.processQueue(); }
      return baseQ.apply(this, a);
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'crew-ev') {
        const e = this._crewEv; this._crewEv = null; this.closeModal(); if (!e) return this.after();
        const c = npcLed(G);
        if (e.kind === 'quarrel') {
          const a = G.npcById(e.a), b = G.npcById(e.b);
          if (v === 'a') { G.changeRel(a, 4, '다툼에서 편을 들어 줬다'); G.changeRel(b, -4, '다툼에서 상대 편을 들었다'); return this.after(`${a.name}이(가) 고맙다는 눈짓을 한다. ${b.name}은(는) 문을 쾅 닫고 나갔다.`); }
          if (v === 'b') { G.changeRel(b, 4, '다툼에서 편을 들어 줬다'); G.changeRel(a, -4, '다툼에서 상대 편을 들었다'); return this.after(`${b.name}이(가) 고개를 끄덕인다. ${a.name}은(는) 말없이 등을 돌렸다.`); }
          G.crewTrust(3); G.changeRel(a, 1); G.changeRel(b, 1);
          return this.after(`"둘 다 살아 나왔잖아. 그걸로 됐어." 분위기가 조금 풀렸다. (팀 신뢰 +3)`);
        }
        if (e.kind === 'leave') {
          const n = G.npcById(e.n); if (!n) return this.after();
          const keep = Math.max(0.1, Math.min(0.9, 0.2 + (n.relation || 0) / 100));
          if (v === 'keep' && Math.random() < keep) { G.changeRel(n, 3, '떠나려는 걸 붙잡아 줬다'); return this.after(`${n.name}: "…알았어. 네가 그렇게까지 말하면 좀 더 있어 볼게."`); }
          n.crewOf = null; n.isCompanion = false; G.player.party = (G.player.party || []).filter((id) => id !== n.id);
          if (v === 'go') G.changeRel(n, 5, '떠나는 길을 웃으며 보내 줬다');
          G.lifeEvent(`${n.name}이(가) ${c ? c.name : '파티'}을(를) 떠났다.`);
          return this.after(v === 'keep' ? `${n.name}: "미안. 이미 마음 정했어." ${n.name}이(가) 파티를 떠났다.` : `${n.name}: "고마워. 어디서든 또 보자." ${n.name}이(가) 파티를 떠났다. (관계 +5)`);
        }
        return this.after();
      }
      return baseH.call(this, act, v);
    };
    // 대리 지휘: 다음 일 고르기에서 제안 판정 없이 내가 고른다
    const baseChance = Game.prototype.crewProposeChance;
    if (baseChance) Game.prototype.crewProposeChance = function (x) { const c = npcLed(this); if (c && c.actingLead) return 1; return baseChance.call(this, x); };
    const baseWork = UI.crewWork;
    if (baseWork) UI.crewWork = function (...a) { const c = npcLed(G); const r = baseWork.apply(this, a); if (c && c.actingLead) { c.actingLead = false; G.crewTrust(5); const L = G.crewLeader(); if (L) L.injured = 0; } return r; };
  }
}

// 리더 교대 장면·독립 (사용자 요청 2-⑤)
// - 리더보다 두 등급 강해지면 오던 "리더 교대" 제안 창 앞에 장면(리더의 고백, 팀원 반응)을 넣는다.
// - 받아들이면 축하 장면 뒤 내가 리더인 파티가 된다(팀원 그대로, 팀과 함께 움직이는 상태로 시작).
// - 교대 제안에 "독립한다"를 더한다. 파티 화면에서도 고참 이상이면 언제든 [독립해서 내 파티 만들기].
//   독립하면 불이익 없이 나오고, 나와 사이가 좋은 팀원(관계 50 이상)은 확률로 따라 나온다.
{
  const npcLed = (g) => { const c = g.player && g.player.crew; if (!c) return null; const L = g.npcById(c.leader); return L && L.alive ? c : null; };
  const col = (L) => { try { return typeof voiceCol === 'function' ? voiceCol(L) : 'just'; } catch (e) { return 'just'; } };
  GP_indep: {
    if (typeof UI === 'undefined') break GP_indep;
    // 독립
    UI.crewIndependent = function () {
      const c = npcLed(G); const L = G.crewLeader(); if (!c) return;
      const ms = G.withCrew(() => G.party()).filter((n) => n && n.alive && n !== L && n.crewOf === c.id);
      const follow = ms.filter((n) => (n.relation || 0) >= 50 && Math.random() < 0.35 + ((n.relation || 0) - 50) / 100);
      const name = c.name;
      for (const n of G.npcs) if (n.crewOf === c.id) { n.crewOf = null; n.isCompanion = false; }
      G.player.crew = null; G.player.party = [];
      for (const n of follow) { n.isCompanion = true; n.region = G.player.region; G.player.party.push(n.id); }
      G.player.lead = follow.length ? { state: 'on', base: G.player.region } : null;
      if (L) G.changeRel(L, 2, '좋게 독립해 나갔다');
      G.lifeEvent(`${name}에서 독립했다.${follow.length ? ` ${follow.map((n) => n.name).join(', ')}이(가) 따라왔다.` : ''}`);
      const k = col(L);
      const T = { just: '언젠가 그럴 줄 알았다. 잘 해라. 막히면 연락하고.', kind: '아쉽지만… 응원할게요! 가끔 같이 일해요.', cold: '…가라. 잘 해.' };
      this.closeModal();
      this.talk([L ? { who: L, text: T[k] || T.just } : null, ...follow.map((n) => ({ who: n, text: '나도 같이 갈게. 너랑 하는 게 더 재밌을 것 같아.' })),
        { sys: `${name}에서 독립했다 · ${follow.length ? `따라온 팀원 ${follow.length}명 · 이제 내가 리더다(도시에서 [팀 호출])` : '혼자 시작한다 · 관계 50 이상인 인물에게 합류를 청할 수 있다'}` }].filter(Boolean),
        () => { this.renderGame(); this.processQueue(); });
    };
    // 교대 제안 장면
    const baseShow = UI.showCrewPlan;
    UI.showCrewPlan = function (...a) {
      const c = G.crew(); const L = G.crewLeader();
      if (c && L && c.plan && c.plan.kind === 'handover' && !c._hoScene) {
        c._hoScene = true;
        const ms = G.withCrew(() => G.party()).filter((n) => n && n !== L && n.crewOf === c.id);
        const k = col(L);
        const T = { just: '요즘 게이트에서 앞에 서는 건 네가 됐다. 다들 네 판단을 기다리더군.', kind: '요즘 다들 저보다 당신을 먼저 봐요. 눈치챘죠?', cold: '…이제 네가 더 강하다.' };
        return this.talk([{ narr: '거점 숙소 옥상. 리더가 할 말이 있다며 불러냈다.' }, { who: L, text: T[k] || T.just }, ms[0] ? { who: ms[0], text: '솔직히 우리도 그렇게 생각했어.' } : null].filter(Boolean),
          () => { const r = baseShow.apply(this, a); this.crewHandoverExtra(); return r; });
      }
      const r = baseShow.apply(this, a); this.crewHandoverExtra(); return r;
    };
    UI.crewHandoverExtra = function () {
      const c = G.crew(); if (!c || !c.plan || c.plan.kind !== 'handover') return;
      const cards = document.querySelector('#modal-box .cards'); if (!cards || cards.querySelector('[data-act="crew-indep"]')) return;
      cards.insertAdjacentHTML('beforeend', '<button class="choice-btn" data-act="crew-indep">독립해서 내 파티를 따로 만든다 <span class="dim-in">불이익 없음 · 사이 좋은 팀원은 따라올 수 있다</span></button>');
    };
    // 교대를 받아들인 뒤 축하 장면, 팀과 함께 움직이는 상태로
    const baseAns = UI.answerCrewPlan;
    UI.answerCrewPlan = function (v, ...a) {
      const c = G.crew(); const ho = c && c.plan && c.plan.kind === 'handover'; const L = G.crewLeader(); const name = c && c.name;
      const r = baseAns.call(this, v, ...a);
      try {
        if (ho && v === '1' && !G.player.crew) {
          G.player.lead = { state: 'on', base: G.player.region };
          const ms = G.party().filter((n) => n !== L);
          setTimeout(() => this.talk([L ? { who: L, text: '이제 네 팀이다. 난 뒤에서 받쳐 주지.' } : null, ...ms.slice(0, 2).map((n) => ({ who: n, text: '잘 부탁해, 리더.' })), { sys: `${name}의 리더가 되었다 · 일은 내가 고르고, 오더도 내가 내린다` }].filter(Boolean), () => this.processQueue()), 50);
        }
      } catch (e) { /* 무시 */ }
      return r;
    };
    // 파티 화면: 고참 이상이면 독립 단추
    const baseHtml = UI.crewHtml;
    if (baseHtml) UI.crewHtml = function (...a) {
      let h = baseHtml.apply(this, a);
      try {
        const c = npcLed(G); const r = c && G.crewRankOf && G.crewRankOf();
        if (c && r && (r.id === 'vet' || r.id === 'sub') && !c.on) h = h.replace('<button class="sm ghost" data-act="crew-leave">파티 탈퇴</button>', '<button class="sm" data-act="crew-indep">독립해서 내 파티 만들기</button> <button class="sm ghost" data-act="crew-leave">파티 탈퇴</button>');
      } catch (e) { /* 무시 */ }
      return h;
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'crew-indep') { const c = G.crew(); if (c) c.plan = null; return this.crewIndependent(); }
      return baseH.call(this, act, v);
    };
  }
}

// 내가 리더인 파티 (사용자 요청 2-⑥)
// - 팀 호출에 늦는 확률·불이익을 소속 파티처럼 완화: 늦을 확률 기본 3%(전 6%)·관계 낮음 +8%(전 12%)·게으른 성격 +10%(전 15%),
//   늦으면 관계 −2(전 −3)·명성 −1(전 −2), 다섯 번(전 세 번) 늦으면 내보낸다.
// - 해산 중 팀원이 뭘 하는지 파티 화면에 한 줄씩(성격별).
{
  if (typeof LEAD_TIME !== 'undefined') Object.assign(LEAD_TIME, { lateBase: 0.03, lateLowRel: 0.08, lateLazy: 0.10, missRel: 2, missFame: 1, kickAfter: 5 });
  const GP = Game.prototype; const baseTick = GP.leadTick;
  if (baseTick) GP.leadTick = function (...a) {
    const n0 = this.queue.length; const r = baseTick.apply(this, a);
    for (let i = n0; i < this.queue.length; i++) { const q = this.queue[i]; if (q && q.type === 'toast' && typeof q.text === 'string') q.text = q.text.replace('세 번째로 늦었다', '다섯 번째로 늦었다'); }
    return r;
  };
  const DOING = { kind: '동네 사람들 일을 도와주는 중', warlike: '혼자 근처 괴수를 사냥하는 중', greedy: '부업으로 돈을 버는 중', just: '훈련장에서 수련하는 중', cold: '장비를 손보며 쉬는 중' };
  if (typeof UI !== 'undefined' && UI.partyHtml) {
    const basePH = UI.partyHtml;
    UI.partyHtml = function (...a) {
      let h = basePH.apply(this, a);
      try {
        const p = G.player; const L = p && !p.crew ? p.lead : null;
        if (L && L.state === 'free') {
          const ms = G.leadMembers ? G.leadMembers() : [];
          if (ms.length) h = h.replace(/(팀은 해산 중[^<]*)/, `$1</p><ul class="small dim lead-doing">${ms.map((n) => `<li>${n.name} · ${regionById(n.region || L.base).name}에서 ${DOING[n.personality] || '쉬는 중'}</li>`).join('')}</ul><p class="small">`);
        }
      } catch (e) { /* 무시 */ }
      return h;
    };
  }
}

// 파티 게시판 비교·이적 (사용자 요청 2-⑦)
// - 모집 게시판 각 파티에 비교 정보를 더한다: 방침, 리더 등급, 팀 전력(나 포함), 분배율, 지원 합격 확률.
// - 소속 파티가 있어도 도시에서 [다른 파티 둘러보기]로 게시판을 볼 수 있고, [이 파티로 옮긴다]로 이적한다.
//   이적은 지금 파티를 나가는 것이라 지금 팀원과의 관계가 조금 떨어진다(−8, 기존 탈퇴와 같음). 지원에 떨어지면 지금 파티에 그대로 남는다.
{
  if (typeof UI !== 'undefined') {
    const share = (L) => Math.round(((typeof L.share === 'number' ? L.share * (1 - (typeof LEADER_CUT !== 'undefined' ? LEADER_CUT : 0.1)) : (typeof CREW_SHARE !== 'undefined' ? CREW_SHARE : 0.75))) * 100);
    const odds = (L) => { const p = G.player; const leader = G.npcById(L.leader); if (!leader) return 0; if (p.rankIdx < L.minRank) return 0; const fit = classById(p.cls).g === L.want; return Math.round(Math.max(0, Math.min(1, (fit ? 0.9 : 0.55) + (leader.relation || 0) / 200 + Math.min(p.fame || 0, 100) / 400)) * 100); };
    const info = (L) => {
      const n = G.npcById(L.leader); const mem = L.members.map((id) => G.npcById(id)).filter(Boolean);
      const tp = G.teamPower ? G.teamPower([n, ...mem]) : null;
      return `<div class="small crew-cmp">팀 전력 <b>${tp ? tp.label : '-'}</b> · 분배율 <b>${share(L)}%</b> · ${G.player.rankIdx < L.minRank ? `<b class="bad">등급 미달 · ${RANKS[L.minRank].key}급부터</b>` : `합격 확률 <b class="${odds(L) >= 70 ? 'good' : odds(L) >= 40 ? '' : 'bad'}">${odds(L)}%</b>`}</div>`;
    };
    const baseHtml = UI.crewHtml;
    UI.crewHtml = function (...a) {
      let h = baseHtml.apply(this, a);
      try {
        if (!G.crew()) {
          const list = G.crewBoard(G.region().id);
          let i = 0; h = h.replace(/(<button class="sm primary" data-act="crew-apply" data-v="(\d+)">지원<\/button>)/g, (m, btn, idx) => { const L = list[+idx]; return L ? `${info(L)}${btn}` : m; });
        } else if (G.onCity && G.onCity()) {
          h = h.replace('<button class="sm ghost" data-act="crew-leave">파티 탈퇴</button>', '<button class="sm ghost" data-act="crew-browse">다른 파티 둘러보기</button> <button class="sm ghost" data-act="crew-leave">파티 탈퇴</button>');
        }
      } catch (e) { /* 무시 */ }
      return h;
    };
    UI.crewBrowse = function () {
      const reg = G.region(); const list = G.crewBoard(reg.id); const cur = G.crew();
      const row = (L, i) => {
        const n = G.npcById(L.leader); const st = CREW_STYLES[L.style];
        return `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${L.name}</b> <span class="small dim">리더 ${n.name}</span> ${this.rankTag(n.rankIdx, n.stage)}
          <div class="small dim">${st.name} · ${st.desc}</div>${info(L)}</div><button class="sm" data-act="crew-move" data-v="${i}" ${odds(L) ? '' : 'disabled'}>이 파티로 옮긴다</button></div>`;
      };
      this.modal(fixJosa(`<div class="eyebrow">파티 모집 게시판 · ${reg.name}</div><h3>다른 파티 둘러보기</h3>
        <p class="small dim">지금 소속: ${cur.name} (분배율 ${Math.round((G.crewShareRate ? G.crewShareRate() : 0.75) * 100)}%). 옮기면 지금 팀원과의 관계가 조금 떨어진다(−8). 지원에 떨어지면 지금 파티에 그대로 남는다.</p>
        <div class="cards">${list.map(row).join('') || '<div class="dim small">이 지역에는 지금 모집 중인 파티가 없다.</div>'}</div>
        <div class="row end"><button class="ghost" data-act="modal-close">닫기</button></div>`), 'event-box');
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'crew-browse') return this.crewBrowse();
      if (act === 'crew-move') {
        const L = G.crewBoard(G.region().id)[+v]; if (!L) return;
        const leader = G.npcById(L.leader); if (!leader) return;
        if (Math.random() * 100 >= odds(L)) { L.tried = G.monthKey(); this.closeModal(); return this.after(`${leader.name}: "미안해요. 이번엔 ${CLASS_GROUPS[L.want].name} 계열을 찾고 있어서요." (불합격 · 지금 파티에 남는다)`); }
        const old = G.crew().name; const out = G.crewLeave('quit'); const msg = G.crewJoin(L);
        this.closeModal(); G.lifeEvent(`${old}에서 ${L.name}(으)로 옮겼다.`);
        return this.after(`${out} ${msg}`);
      }
      return baseH.call(this, act, v);
    };
  }
}
