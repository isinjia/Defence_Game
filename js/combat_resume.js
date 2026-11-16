// ===== 전투 도중 이어하기 (사용자 요청, 2026-11-16) =====
// 전에는 전투 중에 껐다 켜면 그 칸(게이트)·그 무리(토벌)와 처음부터 다시 싸웠다.
// 이제 행동 하나가 끝날 때마다(UI.afterPlay) 전투 상태(체력·정신력·턴 게이지·버프·상태 이상·소환수 등)를 남기고,
// 이어하면 그 전투 그 순간으로 돌아온다. 대상: 모든 전투 — 게이트(층 지도·옛 구역식·브레이크 방어), 괴수 토벌, 이야기 전투,
// 대련·결투, 전국 대회, 연합 레이드, 시련의 탑, 목격자 전투, 자격 시험.
// 이야기 전투의 후처리(함수)는 저장되지 않으므로 resume_run.js 의 재구성 키(spec.resume)로 다시 붙인다. 키가 없는 전투만 예전처럼 처음부터.
// 저장: localStorage SAVE_KEY+'_combat' — 같은 날짜(월·일)에 남긴 것만 되살린다.
{
  const KEY = (typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'gate_chronicle') + '_combat';
  const clear = () => { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } };

  // 전투 객체 → JSON. 유닛을 가리키는 값은 {$u:id}로 바꿔 둔다(불러올 때 다시 잇는다)
  const pack = (cb) => {
    const units = cb.units; const set = new Set(units);
    const rep = function (k, v) {
      if (v && typeof v === 'object' && set.has(v) && this !== units) return { $u: v.id };
      if (typeof v === 'function') return undefined;
      return v;
    };
    const o = {};
    for (const k of Object.keys(cb)) { if (k === 'game' || k === 'log') continue; o[k] = cb[k]; }
    return JSON.parse(JSON.stringify(o, rep));
  };
  const unpack = (o) => {
    const cb = Object.create(Combat.prototype);
    Object.assign(cb, o); cb.game = G; cb.log = [];
    const byId = new Map(cb.units.map((u) => [u.id, u]));
    const fix = (v, d = 0) => {
      if (!v || typeof v !== 'object' || d > 8) return v;
      if (v.$u !== undefined && Object.keys(v).length === 1) return byId.get(v.$u) || null;
      if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = fix(v[i], d + 1); return v; }
      for (const k of Object.keys(v)) v[k] = fix(v[k], d + 1);
      return v;
    };
    for (const u of cb.units) for (const k of Object.keys(u)) u[k] = fix(u[k]);
    for (const k of Object.keys(cb)) if (k !== 'units' && k !== 'game') cb[k] = fix(cb[k]);
    // 화면이 처음 보여 줄 체력은 지금 체력
    cb.initial = Object.fromEntries(cb.units.map((u) => [u.id, { hp: u.hp, mp: u.mp }]));
    return cb;
  };

  // 전투 화면 상태(ctx) → JSON. 게임 세계의 물건은 표시로 바꾼다(불러올 때 다시 찾는다)
  const hasFn = (o, d = 0) => { if (typeof o === 'function') return true; if (!o || typeof o !== 'object' || d > 6) return false; for (const k in o) if (hasFn(o[k], d + 1)) return true; return false; };
  const packCtx = (c, depth = 0) => {
    const o = {};
    for (const k of Object.keys(c)) {
      const v = c[k];
      if (k === 'combat') { if (v instanceof Combat) o.combat = { $cb: pack(v) }; continue; }
      if (k === 'disp' || k === 'playing' || k === 'played') continue;
      if (v && typeof v === 'object') {
        if (k === 'gate' && G.mapGates.includes(v)) { o[k] = { $gate: v.id }; continue; }
        if (k === 'mob' && G.mobs.includes(v)) { o[k] = { $mob: v.id }; continue; }
        if (G.world && v === G.world.raid) { o[k] = { $raid: 1 }; continue; }
        if (G.world && v === G.world.duelPending) { o[k] = { $pend: 1 }; continue; }
        if (k === 'prevCtx') { o[k] = depth < 2 ? packCtx(v, depth + 1) : null; continue; }
      }
      o[k] = v;
    }
    return JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'function' ? undefined : v)));
  };
  const unpackCtx = (o) => {
    const c = {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (v.$cb) { c[k] = unpack(v.$cb); continue; }
        if (v.$gate !== undefined) { const g = G.mapGates.find((x) => x.id === v.$gate); if (!g) throw new Error('gate'); c[k] = g; continue; }
        if (v.$mob !== undefined) { const m = G.mobs.find((x) => x.id === v.$mob); if (!m) throw new Error('mob'); c[k] = m; continue; }
        if (v.$raid) { if (!G.world.raid) throw new Error('raid'); c[k] = G.world.raid; continue; }
        if (v.$pend) { if (!G.world.duelPending) throw new Error('pend'); c[k] = G.world.duelPending; continue; }
        if (k === 'prevCtx') { c[k] = unpackCtx(v); continue; }
      }
      c[k] = v;
    }
    return c;
  };

  const snap = () => {
    try {
      const c = UI.ctx; const cb = c && c.combat;
      if (!c || !cb || !(cb instanceof Combat) || !G.player || G.over) return;
      if (cb.result) { clear(); return; }
      // 함수가 든 이야기 전투는 재구성 키가 있을 때만
      if (c.spec && hasFn(c.spec) && !Array.isArray(c.spec.resume)) { clear(); return; }
      const data = { mk: G.monthKey(), day: G.day, name: G.player.name, kind: c.kind, onboard: G.player.onboard || null, stage: UI.exam ? UI.exam.stage : null, ctx: packCtx(c), speed: c.speed,
        tourney: c.kind === 'tourney' && UI.tourney ? JSON.parse(JSON.stringify(UI.tourney)) : null };
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* 저장 실패는 전투를 막지 않는다 */ }
  };
  const baseAfter = UI.afterPlay;
  UI.afterPlay = function (...a) { const r = baseAfter.apply(this, a); snap(); return r; };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { const r = baseOpen.apply(this, a); setTimeout(snap, 0); return r; };
  // 전투가 끝나 다른 화면으로 가면 지운다
  for (const fn of ['finishGate', 'finishMob']) {
    const base = Game.prototype[fn];
    if (base) Game.prototype[fn] = function (...a) { clear(); return base.apply(this, a); };
  }
  for (const fn of ['finishPersonalCombat', 'finishStoryFight', 'finishTourney', 'finishRaid', 'finishExam', 'endExam']) {
    const base = UI[fn];
    if (base) UI[fn] = function (...a) { clear(); return base.apply(this, a); };
  }
  const baseNew = Game.prototype.newGame;
  if (baseNew) Game.prototype.newGame = function (...a) { clear(); return baseNew.apply(this, a); };

  // 이어하기
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const valid = (d) => { const p = G.player; return d && p && !G.over && d.mk === G.monthKey() && d.day === G.day && d.name === p.name && d.ctx && d.ctx.combat; };
  const open = (d) => {
    let ctx; try { ctx = unpackCtx(d.ctx); } catch (e) { clear(); return false; }
    const cb = ctx.combat;
    if (!cb || !cb.units || !cb.units.length || cb.result) { clear(); return false; }
    if (ctx.spec && Array.isArray(ctx.spec.resume) && UI._fightRebuild && !UI._fightRebuild(ctx.spec)) { clear(); return false; }
    // 이야기 전투: 큐에 되살아난 같은 전투는 빼고(두 번 싸우지 않게), 띄운 항목으로 기억한다
    if (ctx.kind === 'story' && ctx.spec) {
      const i = G.queue.findIndex((q) => q.type === 'storyfight' && q.spec && q.spec.title === ctx.spec.title);
      if (i >= 0) UI._curQ = G.queue.splice(i, 1)[0];
    }
    if (ctx.kind === 'tourney' && !UI.tourney && d.tourney) UI.tourney = d.tourney;
    if (ctx.kind === 'mob' && G.player) G.player.mobFightSave = null; // 토벌은 처음부터 다시가 아니라 이 전투로
    UI.closeModal();
    UI.ctx = ctx;
    UI.combatSpeed = d.speed || UI.combatSpeed;
    UI.openCombat();
    UI.toast('전투를 이어 갑니다.');
    return true;
  };
  const restore = () => {
    const d = read(); const p = G.player;
    if (!d || !p || G.over || UI.ctx) return false;
    if (!valid(d) || d.kind === 'exam' || p.onboard) { if (!valid(d)) clear(); return false; }
    return open(d);
  };
  // 자격 시험: 시험 지도 이어하기(resume_run.js)가 끝난 뒤 같은 단계의 시험 전투였다면 그 전투로
  if (UI.resumeOnboard) {
    const baseOnb = UI.resumeOnboard;
    UI.resumeOnboard = function (...a) {
      const r = baseOnb.apply(this, a);
      try {
        const d = read();
        if (r && d && d.kind === 'exam' && valid(d) && this.exam) { if (d.stage != null) this.exam.stage = d.stage; this.ctx = null; open(d); }
      } catch (e) { /* 무시 */ }
      return r;
    };
  }
  if (UI.resumeRun) {
    const baseResume = UI.resumeRun;
    UI.resumeRun = function (...a) {
      try { if (restore()) return true; } catch (e) { clear(); }
      return baseResume.apply(this, a);
    };
  }
}
