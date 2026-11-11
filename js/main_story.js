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
    if (typeof who === 'function') return this.mainWho(who(this, M));
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
      case 'mumyeong': return M.flags.jinFace ? { name: '진서해', sub: '균열교 교주 · 전 관리국 수석 연구원' } : { name: '무명', sub: '균열교' };
      case 'arin': return M.flags.arinName ? { name: '아린', sub: '저편의 파수인' } : { name: '목소리', sub: '꿈' };
      case 'seoyun': { const n = M.npc && M.npc.seoyun != null ? alive(this.npcById(M.npc.seoyun)) : null; return n || { name: '한서윤', sub: '관리국 특수조사관' }; }
      case 'madohyun': return { name: '마도현', sub: '관리국 국장' };
      default: return typeof who === 'number' ? alive(this.npcById(who)) : null;
    }
  };
  // 메인 고정 인물을 실제 인물로 만든다(관계·초상화가 생긴다). 한 번만 만들고 id를 기억한다
  GP.mainNpc = function (key, spec) {
    const M = this.mainState(); M.npc ??= {};
    const old = M.npc[key] != null ? this.npcById(M.npc[key]) : null; if (old) return old;
    const n = this.makeNpc(false, 'human');
    Object.assign(n, { met: true, relation: 0, links: n.links || {}, disciples: n.disciples || [], parents: n.parents || [] }, spec || {});
    if (spec && spec.gender && spec.persona == null && this.pickPersona) n.persona = this.pickPersona(n);
    this.npcs.push(n); M.npc[key] = n.id; return n;
  };
  // 말투별 줄: { haera, haeyo, short, hapsyo, hao, banmal } 중 말하는 사람 말투(C의 성격별 말투표)에 맞는 것
  GP.mainReg = function (t, who) {
    if (!t || typeof t !== 'object' || Array.isArray(t)) return t;
    const r = who && who.id != null && this.personaRegister ? this.personaRegister(who) : 'haera';
    const alias = { banmal: 'haera', hao: 'haera', hage: 'haera', hapsyo: 'haeyo', haera: 'banmal', haeyo: 'hapsyo' };
    return t[r] ?? t[alias[r]] ?? t.haera ?? t.banmal ?? Object.values(t)[0];
  };
  // 관계 변화: { leader: +2, rival: -1, friend: +1 }
  GP.mainRel = function (rel, why) {
    const M = this.mainState(); for (const [k, v0] of Object.entries(rel || {})) { const v = typeof v0 === 'function' ? v0(this, M) : v0; const n = this.mainWho(k); if (n && n.id != null && v) this.changeRel(n, v, why || '메인 이야기'); }
  };
  GP.mainToday = function () { return this.monthKey() * 30 + this.day; };
  // 장면 끊기: pause = '문구' | 숫자(일) | { days, label, text }. pauseDays·pauseLabel 로도 줄 수 있다. 문구만 있으면 1일
  GP.mainPauseOf = function (sc) {
    const p = sc.pause; const o = typeof p === 'object' && p ? p : {};
    const days = Math.max(1, typeof p === 'number' ? p : o.days || sc.pauseDays || 1);
    const label = o.label || sc.pauseLabel || (days === 1 ? '내일' : `${days}일 뒤`);
    const text = typeof p === 'string' ? p : o.text || (days === 1 ? '오늘은 여기까지. 다음 날 이어진다.' : `${label} 이야기가 이어진다.`);
    return { days, label, text };
  };
  // 남은 대기를 짧게: '내일' · 'N일 뒤' · 라벨(목요일·보름 밤)
  GP.mainWaitText = function () {
    const M = this.mainState(); if (!M.pendingDay) return '';
    const left = M.pendingDay - this.mainToday(); if (left <= 0) return '';
    if (M.pendingLabel && !/일 뒤$|^내일$/.test(M.pendingLabel)) return left === 1 ? `내일 · ${M.pendingLabel}` : `${left}일 뒤 · ${M.pendingLabel}`;
    return left === 1 ? '내일' : `${left}일 뒤`;
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
      if (def.cal) this.mainCalOpen(def.cal);
      this.queue.push({ type: 'toast', text: `메인 이야기 · ${def.n}장 「${def.title}」이(가) 열렸다. 현재 퀘스트 맨 위를 보라.` });
      return;
    }
    // 세계가 먼저 움직인다
    // 시작만 해 두고 방치해도 만료된다(완료 전이면)
    if (def.expire && !M.done[def.n] && mk - M.open[def.n] >= def.expire.months) {
      if (def.cal) this.mainCalLapse(def.cal);
      const t = def.expire.run ? def.expire.run(this, M) : '';
      this.mainFinish(def.n, 'missed');
      this.queue.push({ type: 'toast', text: `메인 ${def.n}장 「${def.title}」 — 미루는 사이 세상이 먼저 움직였다. ${t || ''}` });
    }
  };
  // 만료까지 남은 달 (만료 없는 장이면 null)
  GP.mainLeft = function (def) {
    const M = this.mainState(); if (!def || !def.expire || !M.open[def.n] || M.done[def.n]) return null;
    return Math.max(0, def.expire.months - (this.monthKey() - M.open[def.n]));
  };
  // 재앙 연동: 메인 장(12·15·21·27·32)은 샌드박스 재앙과 상태를 공유한다. 플래그 키 = 재앙 id
  const calOK = (g) => typeof calamityById === 'function' && g.calState && g.calState();
  GP.mainCalOpen = function (id) {
    if (!calOK(this)) return; const s = this.calState(); const M = this.mainState(); const c = calamityById(id); if (!c) return;
    if (s.active && s.active.id === id) { M.flags[id] = 'active'; return; }
    if (s.done[id]) { M.flags[id] = s.done[id]; return; }
    // 다른 재앙이 없고 등급이 크게 모자라지 않으면 지금 열린다. 아니면 관측만
    if (!s.active && this.player.rankIdx >= c.tier - 2) { this.calStart(c); if (s.active && s.active.id === id) { s.active.main = true; M.flags[id] = 'active'; return; } }
    M.flags[id] = 'watch';
  };
  GP.mainCalClear = function (id) {
    if (!calOK(this)) return; const s = this.calState(); const M = this.mainState(); const c = calamityById(id); if (!c) return;
    if (s.active && s.active.id === id) {
      this.mapGates = this.mapGates.filter((g) => g.id !== s.active.gateId);
      s.done[id] = 'player'; s.active = null; s.last = this.monthKey();
      this.player.record.calamity = (this.player.record.calamity || 0) + 1;
      this.lifeEvent(`${c.name}을(를) 막아 냈다.`); this.rumor(`${this.player.name}이(가) ${c.name}의 ${c.boss}을(를) 쓰러뜨렸다.`);
    } else if (s.done[id] === 'fail' && c.region && s.dangerUp[c.region] > 0) {
      // 이미 무너진 땅: 상처를 한 칸 줄인다
      s.dangerUp[c.region]--; const r = regionById(c.region); if (r) r.danger = Math.max(1, r.danger - 1);
      this.rumor(`${regionById(c.region).name}의 ${c.name} 잔해가 걷혔다. 위험도가 내려갔다.`);
    } else if (!s.done[id]) s.done[id] = 'player';
    M.flags[id] = 'player';
  };
  GP.mainCalLapse = function (id) {
    if (!calOK(this)) return; const s = this.calState(); const M = this.mainState();
    if (s.active && s.active.id === id) this.calTimeout();
    M.flags[id] = s.done[id] || M.flags[id] || 'watch';
  };
  const baseMC = GP.mainCheck;
  GP.mainCheck = function () { baseMC.call(this); const p = this.player; if (!p || !p.examDone || this.over) return; this.mainPartLapse(); };
  GP.mainCalBoss = function (id, fallback) { const c = typeof calamityById === 'function' && calamityById(id); return c ? c.boss : fallback; };
  // 부 단위 세계 시계: 부의 첫 장이 열린 지 N개월이 지나도 그 부를 못 끝내면, 남은 장이 한꺼번에 만료된다
  MAIN.partClock = { 2: 18, 3: 24, 4: 24, 5: 18, 6: 12 };
  GP.mainPartFirst = function (part) { return Math.min(...Object.values(MAIN.chapters).filter((d) => d.part === part).map((d) => d.n)); };
  GP.mainPartLeft = function () {
    const M = this.mainState(); const def = MAIN.chapters[M.ch]; if (!def || !def.part || !MAIN.partClock[def.part]) return null;
    const st = M.open[this.mainPartFirst(def.part)]; if (st == null) return null;
    return Math.max(0, MAIN.partClock[def.part] - (this.monthKey() - st));
  };
  GP.mainPartLapse = function () {
    const M = this.mainState(); const def = MAIN.chapters[M.ch]; if (!def || !def.part || !MAIN.partClock[def.part]) return false;
    const left = this.mainPartLeft(); if (left == null || left > 0) return false;
    const part = def.part; const out = [];
    for (let n = M.ch; MAIN.chapters[n] && MAIN.chapters[n].part === part; n++) {
      const d = MAIN.chapters[n]; if (M.done[n]) continue;
      M.open[n] ??= this.monthKey();
      if (d.cal) this.mainCalLapse(d.cal);
      const t = d.expire && d.expire.run ? d.expire.run(this, M) : ''; if (t) out.push(t);
      this.mainFinish(n, 'missed');
    }
    if (MAIN.partEnd && MAIN.partEnd[part]) MAIN.partEnd[part](this, M);
    this.queue.push({ type: 'toast', text: `메인 ${part}부 — 너무 오래 미뤘다. 세상이 그 이야기를 먼저 끝냈다. ${out.slice(-1)[0] || ''}` });
    return true;
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
  GP.mainWhere = function (def) { const w = typeof def.where === 'function' ? def.where(this, this.mainState()) : def.where; return w || 'any'; };
  GP.mainAtPlace = function (def) {
    const p = this.player; const w = this.mainWhere(def);
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
      if (!sceneId && def.start) sceneId = def.start(G, M);
      const idx = sceneId ? def.scenes.findIndex((s) => s.id === sceneId) : 0;
      const sc = def.scenes[Math.max(0, idx)]; if (!sc) return G.mainFinish(def.n);
      // 조건에 맞지 않는 장면은 건너뛴다 (예: 리더가 없으면 리더 장면 없음)
      const skipNext = (s0) => { let s = s0; while (s && s.skip && s.skip(G, M)) { const j = def.scenes.indexOf(s); const nx = s.next && s.next !== 'end' ? def.scenes.find((x) => x.id === s.next) : s.next === 'end' ? null : def.scenes[j + 1]; if (!nx) return null; s = nx; } return s; };
      const sc2 = skipNext(sc); if (!sc2) { G.mainFinish(def.n); G.save(); this.renderGame(); this.toast(`메인 ${def.n}장 「${def.title}」 완료`); return this.processQueue(); }
      if (sc2 !== sc) return this.mainPlay(sc2.id);
      M.started[def.n] = true; M.scene = sc.id; M.pending = null; M.pendingDay = null; M.pendingLabel = null; M.pendingText = null;
      const lines = [];
      for (const l of sc.lines || []) {
        if (l.when && !l.when(G, M)) continue;
        if (l.narr) { lines.push({ narr: G.mainFill(l.narr) }); continue; }
        if (l.sys) { lines.push({ sys: G.mainFill(l.sys) }); continue; }
        if (l.group) { lines.push({ narr: l.narr0 ? G.mainFill(l.narr0) : undefined, group: l.group.map((g) => ({ who: G.mainWho(g.who), text: G.mainFill(g.text) })).filter((g) => g.who) }); continue; }
        const who = G.mainWho(l.who);
        if (who) lines.push({ who, text: G.mainFill(G.mainReg(l.text, who)) });
        else if (l.alt) { const aw = typeof l.alt === 'object' && !Array.isArray(l.alt) && l.alt.who ? G.mainWho(l.alt.who) : null; if (aw) lines.push({ who: aw, text: G.mainFill(G.mainReg(l.alt.text, aw)) }); else if (typeof l.alt === 'string' || typeof l.alt === 'function') lines.push({ narr: G.mainFill(l.alt) }); }
      }
      const nextOf = (x) => { if (x === 'end') return 'end'; if (x) return x; if (sc.next) return sc.next; const s = def.scenes[def.scenes.indexOf(sc) + 1]; return s ? s.id : 'end'; };
      const go = (next) => { if (next !== 'end' && sc.pause) { const pw = G.mainPauseOf(sc); M.pending = next; M.pendingDay = G.mainToday() + pw.days; M.pendingLabel = pw.label; M.pendingText = pw.text; G.save(); this.renderGame(); this.toast(pw.text); return this.processQueue(); } if (next === 'end') { G.mainFinish(def.n); G.save(); this.renderGame(); this.toast(`메인 ${def.n}장 「${def.title}」 완료`); return this.processQueue(); } return this.mainPlay(next); };
      const choices = (sc.choices || []).filter((c) => !c.when || c.when(G, M));
      if (choices.length) {
        lines.push({ choices: choices.map((c) => ({ text: G.mainFill(c.text), go: () => {
          if (c.set) Object.assign(M.flags, c.set);
          if (c.run) c.run(G, M);
          if (c.rel) G.mainRel(c.rel, c.relWhy);
          const g = c.gain ? G.gain(c.gain) : '';
          const after = (c.say || []).filter((l) => !l.when || l.when(G, M)).map((l) => { if (l.narr) return { narr: G.mainFill(l.narr) }; const w = G.mainWho(l.who); return w ? { who: w, text: G.mainFill(G.mainReg(l.text, w)) } : (l.alt ? { narr: G.mainFill(l.alt) } : {}); }).filter((l) => l.narr || l.who);
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
      if (M.pending) { if (M.pendingDay && G.mainToday() < M.pendingDay) return false; if (M.pendingDay && !G.mainAtPlace(def)) return false; const s = M.pending; this.mainPlay(s); return true; }
      return false;
    },
    mainGoal() {
      const def = G.mainChapter(); const M = G.mainState(); if (!def || !M.open[def.n] || M.done[def.n]) return null;
      const w = G.mainWhere(def); const where = w === 'any' ? '' : w === 'city' ? '아무 도시' : regionById(w).name;
      const wait = M.pendingDay && G.mainToday() < M.pendingDay;
      return { def, where, here: G.mainAtPlace(def), wait };
    },
    mainStart() {
      const g = this.mainGoal(); if (!g || this.ctx || this.dlg) return;
      const M = G.mainState();
      if (g.wait) return this.toast(`${G.mainWaitText()} 이어진다.`);
      if (!g.here) {
        const w = G.mainWhere(g.def);
        if (w === 'city') return this.toast('도시에 들어가면 이야기가 이어진다.');
        return this.travelRegion ? this.travelRegion(w) : null;
      }
      this.closeModal();
      return this.mainPlay(M.pending || M.scene || null);
    },
  });

  // 퀘스트 목록 맨 위: 메인 줄
  const baseHQ = UI.hudQuests;
  if (baseHQ) UI.hudQuests = function () {
    const html = baseHQ.call(this); const g = this.mainGoal(); if (!g) return html;
    const row = `<button class="obj-link hq main-q" data-act="main-go"><span class="hq-mark">◆</span><span class="hq-t">메인 · ${g.def.n}장 「${g.def.title}」 — ${G.mainFill(g.def.goal || '')}${G.mainLeft(g.def) != null ? ` <span class="hq-exp">· 만료까지 ${G.mainLeft(g.def)}개월</span>` : ''}${G.mainPartLeft && G.mainPartLeft() != null && G.mainPartLeft() <= 6 ? ` <span class="hq-exp">· ${g.def.part}부 마감 ${G.mainPartLeft()}개월</span>` : ''}</span><span class="hq-r ${g.here && !g.wait ? 'amber' : ''}">${g.wait ? `${G.mainWaitText()} 이어짐` : g.here ? (G.mainState().started[g.def.n] ? '이어서' : '지금 시작') : g.where}</span></button>`;
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
