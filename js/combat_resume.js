// ===== 전투 도중 이어하기 (사용자 요청, 2026-11-16) =====
// 전에는 전투 중에 껐다 켜면 그 칸(게이트)·그 무리(토벌)와 처음부터 다시 싸웠다.
// 이제 행동 하나가 끝날 때마다(UI.afterPlay) 전투 상태(체력·정신력·턴 게이지·버프·상태 이상·소환수 등)를 남기고,
// 이어하면 그 전투 그 순간으로 돌아온다. 대상: 게이트 전투(층 지도·옛 구역식), 괴수 토벌.
// 그 밖의 전투(이야기·대련·대회·레이드 등)는 지금처럼 처음부터(resume_run.js).
// 저장: localStorage SAVE_KEY+'_combat' — 같은 날짜(월·일)에 남긴 것만 되살린다.
{
  const KEY = (typeof SAVE_KEY !== 'undefined' ? SAVE_KEY : 'gate_chronicle') + '_combat';
  const clear = () => { try { localStorage.removeItem(KEY); } catch (e) { /* 무시 */ } };
  const OK_KIND = ['gate', 'mob'];

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

  const snap = () => {
    try {
      const c = UI.ctx; const cb = c && c.combat;
      if (!c || !OK_KIND.includes(c.kind) || !cb || !(cb instanceof Combat) || !G.player || G.over) return;
      if (cb.result) { clear(); return; }
      const ctx = { kind: c.kind, elem: c.elem, crewRaid: !!c.crewRaid };
      if (c.kind === 'gate') Object.assign(ctx, { gid: c.gate.id, run: c.run || null, rooms: c.run ? null : c.rooms, roomIdx: c.roomIdx, loot: c.loot, hidden: c.hidden, inHidden: c.inHidden, nodeKind: c.nodeKind, counted: c.counted });
      else ctx.mobId = c.mob && c.mob.id;
      const data = { mk: G.monthKey(), day: G.day, name: G.player.name, ctx: JSON.parse(JSON.stringify(ctx)), cb: pack(cb), speed: c.speed };
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
  const baseNew = Game.prototype.newGame;
  if (baseNew) Game.prototype.newGame = function (...a) { clear(); return baseNew.apply(this, a); };

  // 이어하기
  const restore = () => {
    let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    const p = G.player;
    if (!d || !p || G.over || UI.ctx || p.onboard) return false;
    if (d.mk !== G.monthKey() || d.day !== G.day || d.name !== p.name || !d.cb || !d.ctx) { clear(); return false; }
    const x = d.ctx; let ctx = null;
    if (x.kind === 'gate') {
      const gate = G.mapGates.find((g) => g.id === x.gid && !g.cleared); if (!gate) { clear(); return false; }
      ctx = { kind: 'gate', gate, rooms: x.rooms || [], roomIdx: x.roomIdx || 0, loot: x.loot || { money: 0, ether: 0, kills: 0, list: [] }, hidden: x.hidden, inHidden: x.inHidden,
        run: x.run || undefined, nodeKind: x.nodeKind, counted: x.counted, crewRaid: x.crewRaid, _snapped: true };
    } else if (x.kind === 'mob') {
      const mob = G.mobs.find((m) => m.id === x.mobId); if (!mob) { clear(); return false; }
      ctx = { kind: 'mob', mob, crewRaid: x.crewRaid };
    }
    if (!ctx) { clear(); return false; }
    let cb; try { cb = unpack(d.cb); } catch (e) { clear(); return false; }
    if (!cb.units || !cb.units.length || cb.result) { clear(); return false; }
    ctx.elem = x.elem; ctx.combat = cb;
    UI.closeModal();
    UI.ctx = ctx;
    UI.combatSpeed = d.speed || UI.combatSpeed;
    UI.openCombat();
    UI.toast('전투를 이어 갑니다.');
    return true;
  };
  if (UI.resumeRun) {
    const baseResume = UI.resumeRun;
    UI.resumeRun = function (...a) {
      try { if (restore()) return true; } catch (e) { clear(); }
      return baseResume.apply(this, a);
    };
  }
}
