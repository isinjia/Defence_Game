// ===== 메인 시나리오 「원초의 문」 틀 (영역 D, docs/메인_시나리오.md) =====
// 장(章)은 등급·앞 장·경과 개월을 채우면 열린다(무작위 아님). 열린 장은 퀘스트 목록 맨 위에 고정되고,
// 그 장소에 가면 장면이 대화창으로 재생된다. 장면 사이 전투(이야기 전투)가 끝나면 다음 장면으로 이어진다.
// 미뤄 두면 세계가 먼저 움직인다: 장마다 expire(개월)가 지나면 그 장의 일은 다른 사람이 처리하고 결과가 남는다.
//
// 장 정의: MAIN.ch(n, { part, title, rank, after: 개월, when(g, M), where: 'any' | 'city' | 지역 id, goal,
//   scenes: [{ id, lines: [{ narr } | { who, text, alt } | { sys }], choices: [{ text, when, set, gain, say, next, fight }], next }],
//   done(g, M), expire: { months, run(g, M) → 문장 } })
//  - who: 'leader' | 'friend' | 'rival' | 'mumyeong' | 'arin' | 'seoyun' | 'madohyun' | { name, sub }. 실제 NPC로 풀고, 없거나 죽었으면 alt 줄(없으면 줄째 생략).
//  - text·narr 에는 함수(g, M)나 치환어를 쓸 수 있다: {name} 주인공, {friend} 친구, {leader} 리더, {rival} 라이벌, {hyung} 형/누나, {oppa} 오빠/언니
//  - next: 다음 장면 id, 'end' 면 장 끝. 없으면 배열의 다음 장면.
const MAIN = {
  chapters: {},
  ch(n, def) { this.chapters[n] = { n, ...def }; },
  parts: { 1: '균열의 냄새', 2: '보름의 의식', 3: '공명 기록', 4: '재앙의 해', 5: '봉쇄선 너머', 6: '원초의 문' },
  // 메인으로 옮긴 옛 무작위 연작
  absorbed: ['cult', 'voice'],
};

{
  const GP = Game.prototype;
  GP.mainState = function () {
    this.flags.main ??= { ch: 1, open: {}, started: {}, done: {}, flags: {}, scene: null, pending: null, log: [], startMk: null };
    return this.flags.main;
  };
  GP.mainChapter = function () { const M = this.mainState(); return MAIN.chapters[M.ch] || null; };
  GP.mainFlag = function (k) { return this.mainState().flags[k]; };
  // 인물 풀기
  GP.mainWho = function (who) {
    const p = this.player; const M = this.mainState();
    const alive = (n) => (n && n.alive !== false ? n : null);
    if (who && typeof who === 'object') return who;
    switch (who) {
      case 'leader': {
        const c = this.crewLeader && this.crewLeader(); if (c) return c;
        const ft = this.flags.story && this.flags.story.firstTeam; const f = ft && alive(this.npcById(ft.leader)); if (f) return f;
        return alive(this.npcs.filter((n) => n.examLeader).pop());
      }
      case 'friend': return alive(this.npcs.find((n) => n.friendhood));
      case 'rival': {
        if (M.rival != null) return alive(this.npcById(M.rival));
        const mates = this.npcs.filter((n) => n.examMate && n.alive !== false);
        const n = mates.sort((a, b) => b.rankIdx - a.rankIdx)[0]; if (n) M.rival = n.id; return n || null;
      }
      case 'mumyeong': return { name: '무명', sub: '균열교' };
      case 'arin': return { name: '목소리', sub: '꿈' };
      case 'seoyun': return { name: '한서윤', sub: '관리국 특수조사관' };
      case 'madohyun': return { name: '마도현', sub: '관리국 국장' };
      default: return typeof who === 'number' ? alive(this.npcById(who)) : null;
    }
  };
  GP.mainFill = function (t) {
    const p = this.player; const M = this.mainState();
    if (typeof t === 'function') t = t(this, M);
    const nm = (k) => { const n = this.mainWho(k); return n ? n.name : ''; };
    return String(t || '').replace(/\{name\}/g, p.name).replace(/\{friend\}/g, nm('friend') || '친구').replace(/\{leader\}/g, nm('leader') || '선배')
      .replace(/\{rival\}/g, nm('rival') || '동기').replace(/\{hyung\}/g, p.gender === 'M' ? '형' : '누나').replace(/\{oppa\}/g, p.gender === 'M' ? '오빠' : '언니');
  };
  // 장이 열리는지
  GP.mainCheck = function () {
    const p = this.player; if (!p || !p.examDone || this.over) return;
    const M = this.mainState(); const mk = this.monthKey();
    M.startMk ??= mk;
    const def = MAIN.chapters[M.ch]; if (!def || M.done[def.n]) return;
    if (!M.open[def.n]) {
      const prevMk = def.n > 1 && M.done[def.n - 1] ? M.done[def.n - 1].mk : M.startMk;
      if (p.rankIdx < (def.rank || 0)) return;
      if (mk - prevMk < (def.after || 0)) return;
      if (def.when && !def.when(this, M)) return;
      M.open[def.n] = mk;
      this.queue.push({ type: 'toast', text: `메인 이야기 · ${def.n}장 「${def.title}」이(가) 열렸다. 현재 퀘스트 맨 위를 보라.` });
      return;
    }
    // 세계가 먼저 움직인다
    if (def.expire && !M.started[def.n] && mk - M.open[def.n] >= def.expire.months) {
      const t = def.expire.run ? def.expire.run(this, M) : '';
      this.mainFinish(def.n, 'missed');
      this.queue.push({ type: 'toast', text: `메인 ${def.n}장 「${def.title}」 — 미루는 사이 세상이 먼저 움직였다. ${t || ''}` });
    }
  };
  GP.mainFinish = function (n, how) {
    const M = this.mainState(); const def = MAIN.chapters[n];
    M.done[n] = { mk: this.monthKey(), how: how || 'done' };
    M.scene = null; M.pending = null;
    if (def && how !== 'missed' && def.done) def.done(this, M);
    M.log.push({ n, title: def ? def.title : '', how: how || 'done', when: this.fullDate ? this.fullDate() : '' });
    if (how !== 'missed') this.lifeEvent(`메인 이야기 ${n}장 「${def ? def.title : ''}」을(를) 마쳤다.`);
    M.ch = n + 1;
  };
  GP.mainAtPlace = function (def) {
    const p = this.player; const w = def.where || 'any';
    if (w === 'any') return true;
    if (w === 'city') return !!this.onCity();
    return p.region === w && (def.field || !!this.onCity());
  };
  // 옛 무작위 연작(균열교·목소리)은 메인으로 옮겼다
  const baseElig = GP.storyEligible;
  GP.storyEligible = function (ev, c) { if (ev.chain && MAIN.absorbed.includes(ev.chain)) return false; return baseElig.call(this, ev, c); };
  const baseAdv = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) { const r = baseAdv.call(this, n, opts); this.mainCheck(); return r; };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function () { baseInit.call(this); if (this.player) this.mainState(); };
}

if (typeof UI !== 'undefined') {
  Object.assign(UI, {
    // 장면 재생
    mainPlay(sceneId) {
      const M = G.mainState(); const def = G.mainChapter(); if (!def) return;
      const idx = sceneId ? def.scenes.findIndex((s) => s.id === sceneId) : 0;
      const sc = def.scenes[Math.max(0, idx)]; if (!sc) return G.mainFinish(def.n);
      M.started[def.n] = true; M.scene = sc.id; M.pending = null;
      const lines = [];
      for (const l of sc.lines || []) {
        if (l.when && !l.when(G, M)) continue;
        if (l.narr) { lines.push({ narr: G.mainFill(l.narr) }); continue; }
        if (l.sys) { lines.push({ sys: G.mainFill(l.sys) }); continue; }
        if (l.group) { lines.push({ narr: l.narr0 ? G.mainFill(l.narr0) : undefined, group: l.group.map((g) => ({ who: G.mainWho(g.who), text: G.mainFill(g.text) })).filter((g) => g.who) }); continue; }
        const who = G.mainWho(l.who);
        if (who) lines.push({ who, text: G.mainFill(l.text) });
        else if (l.alt) lines.push(typeof l.alt === 'object' && !Array.isArray(l.alt) && l.alt.who ? { who: G.mainWho(l.alt.who), text: G.mainFill(l.alt.text) } : { narr: G.mainFill(l.alt) });
      }
      const nextOf = (x) => { if (x === 'end') return 'end'; if (x) return x; const s = def.scenes[def.scenes.indexOf(sc) + 1]; return s ? s.id : 'end'; };
      const go = (next) => { if (next === 'end') { G.mainFinish(def.n); G.save(); this.renderGame(); this.toast(`메인 ${def.n}장 「${def.title}」 완료`); return this.processQueue(); } return this.mainPlay(next); };
      const choices = (sc.choices || []).filter((c) => !c.when || c.when(G, M));
      if (choices.length) {
        lines.push({ choices: choices.map((c) => ({ text: G.mainFill(c.text), go: () => {
          if (c.set) Object.assign(M.flags, c.set);
          if (c.run) c.run(G, M);
          const g = c.gain ? G.gain(c.gain) : '';
          const after = (c.say || []).map((l) => (l.narr ? { narr: G.mainFill(l.narr) } : { who: G.mainWho(l.who), text: G.mainFill(l.text) })).filter((l) => l.narr || l.who);
          if (g) after.push({ sys: g.replace(/^ \(|\)$/g, '') });
          const next = nextOf(c.next);
          if (c.fight) {
            M.pending = next === 'end' ? '__end' : next; G.save();
            const spec = typeof c.fight === 'function' ? c.fight(G, M) : c.fight;
            const done = (ok) => { M.flags[`fight_${sc.id}`] = ok ? 'win' : 'lose'; };
            G.storyFight({ ...spec, win: { ...(spec.win || {}), after: (g2) => { done(true); if (spec.win && spec.win.after) spec.win.after(g2); } }, lose: { ...(spec.lose || {}), after: (g2) => { done(false); if (spec.lose && spec.lose.after) spec.lose.after(g2); } } });
            if (after.length) return this.talk(after, () => this.processQueue());
            return this.processQueue();
          }
          if (after.length) return this.talk(after, () => go(next));
          return go(next);
        } })) });
        return this.talk(lines, null);
      }
      return this.talk(lines, () => go(nextOf(sc.next)));
    },
    mainResume() {
      const M = G.mainState(); const def = G.mainChapter(); if (!def) return false;
      if (M.pending === '__end') { M.pending = null; G.mainFinish(def.n); G.save(); this.renderGame(); this.toast(`메인 ${def.n}장 「${def.title}」 완료`); return true; }
      if (M.pending) { const s = M.pending; this.mainPlay(s); return true; }
      return false;
    },
    mainGoal() {
      const def = G.mainChapter(); const M = G.mainState(); if (!def || !M.open[def.n] || M.done[def.n]) return null;
      const where = def.where === 'any' ? '' : def.where === 'city' ? '아무 도시' : regionById(def.where).name;
      return { def, where, here: G.mainAtPlace(def) };
    },
    mainStart() {
      const g = this.mainGoal(); if (!g || this.ctx || this.dlg) return;
      const M = G.mainState();
      if (!g.here) {
        if (g.def.where === 'city') return this.toast('도시에 들어가면 이야기가 이어진다.');
        return this.travelRegion ? this.travelRegion(g.def.where) : null;
      }
      this.closeModal();
      return this.mainPlay(M.pending || M.scene || null);
    },
  });

  // 퀘스트 목록 맨 위: 메인 줄
  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    const html = baseHQ.call(this); const g = this.mainGoal(); if (!g) return html;
    const row = `<button class="obj-link hq main-q" data-act="main-go"><span class="hq-mark">◆</span><span class="hq-t">메인 · ${g.def.n}장 「${g.def.title}」 — ${G.mainFill(g.def.goal || '')}</span><span class="hq-r ${g.here ? 'amber' : ''}">${g.here ? '지금 시작' : g.where}</span></button>`;
    return html.replace('<div class="obj-title">현재 퀘스트</div>', `<div class="obj-title">현재 퀘스트</div>${row}`).replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '');
  };

  // 한가해지면: 전투 뒤 이어지는 장면, 그 장소에 와 있으면 장 시작(하루 한 번 묻지 않고 바로)
  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    const r = baseQ.call(this);
    if (this.modalOpen() || this.ctx || this.dlg || this.walking || (G.queue && G.queue.length) || G.over || this.screen !== 'game') return r;
    if (this._mainBusy) return r;
    this._mainBusy = true;
    setTimeout(() => {
      this._mainBusy = false;
      if (this.modalOpen() || this.ctx || this.dlg || this.walking || (G.queue && G.queue.length) || G.over || this.screen !== 'game') return;
      if (this.crewMarch) return;
      if (this.mainResume()) return;
      const g = this.mainGoal(); const M = G.mainState();
      if (g && g.here && !M.started[g.def.n] && M.autoAt !== G.monthKey() * 30 + G.day) { M.autoAt = G.monthKey() * 30 + G.day; this.mainPlay(null); }
    }, 300);
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'main-go') return this.mainStart();
    return baseHandle.call(this, act, v);
  };
}
