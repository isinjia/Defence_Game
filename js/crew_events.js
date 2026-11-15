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
