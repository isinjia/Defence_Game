// ---------- 진행 단계 복구 (평가 보고 1순위) ----------
// 큐(G.queue)는 저장되지 않는다. 시험·소속·첫 파티 도중 새로고침하면 그 단계가 통째로 사라지던 문제를
// player.onboard 단계 표시로 막는다. 'exam' → 시험 다시, 'aff' → 소속 흐름 다시, 끝나면 null.
if (typeof Game !== 'undefined') {
  const baseInit = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function () {
    const r = baseInit.apply(this, arguments);
    const p = this.player;
    if (p) p.onboard ??= null;
    // 큐는 저장되지 않으니, 불러온 직후 '큐에 올렸음' 표시가 남아 있으면 데뷔 이야기가 영영 멈춘다
    // 인연 장면도 같은 문제: bondPending === true 인데 큐에 장면이 없으면 'wait'로 되돌려 다음 달 다시 띄운다
    for (const n of this.npcs || []) if (n.bondPending === true && !(this.queue || []).some((q) => q && q.npc === n.id && /^bond_/.test(q.id || ''))) n.bondPending = 'wait';
    if (p && p.debut && p.debut.queued && !(this.queue || []).some((q) => q && /^debut_/.test(q.id || ''))) p.debut.queued = false;
    return r;
  };
}

if (typeof UI !== 'undefined') {
  const baseStart = UI.startExam;
  UI.startExam = function () {
    if (G.player) G.player.onboard = 'exam';
    const r = baseStart.apply(this, arguments);
    if (G.player) G.save(); // 시험 인물까지 저장해야 이어하기 때 같은 사람들이 나온다
    return r;
  };

  const baseEnd = UI.endExam;
  UI.endExam = function () {
    const r = baseEnd.apply(this, arguments);
    if (G.player) {
      // '측정 결과 하위' 장면은 판정 직후 이야기라 소속 권유보다 먼저 (나중에 나오면 이미 파티를 꾸린 뒤라 어긋난다)
      const i = G.queue.findIndex((q) => q && q.id === 'debut_bottom_0');
      if (i > 0) G.queue.unshift(G.queue.splice(i, 1)[0]);
      G.player.onboard = 'aff'; G.player.examEnd = null; G.save();
    }
    return r;
  };

  // 시험 결과 화면에 닿으면 단계를 'examEnd'로 (고른 동기도 함께 저장)
  const baseRend = UI.renderExamEnd;
  if (baseRend) UI.renderExamEnd = function () {
    // 튜토리얼을 건너뛰면 동기가 '각자'로, 끝까지 하면 '함께'로 기본 선택이 달랐다(4차 평가) → 건너뛰어도 처음엔 모두 '함께'
    try { const ex = this.exam; if (ex && ex.skipped && !ex._defPick) { ex._defPick = true; ex.pick = new Set(ex.ids); } } catch (e) { /* 무시 */ }
    const r = baseRend.apply(this, arguments);
    try { const p = G.player; const ex = this.exam; if (p && ex && p.onboard && p.onboard !== 'aff') { p.onboard = 'examEnd'; p.examEnd = { ids: ex.ids.slice(), pick: [...(ex.pick || [])] }; G.save(); } } catch (e) { /* 무시 */ }
    return r;
  };

  const baseParty = UI.makeExamParty, baseLeader = UI.makeExamLeader;
  UI.makeExamParty = function () { return this._reuseExam ? this._reuseExam.ids.slice() : baseParty.apply(this, arguments); };
  UI.makeExamLeader = function () { return this._reuseExam ? this._reuseExam.leader : baseLeader.apply(this, arguments); };

  const baseDone = UI.firstPartyDone;
  UI.firstPartyDone = function () {
    if (G.player) G.player.onboard = null;
    return baseDone.apply(this, arguments);
  };

  // 이어하기: 끊긴 단계부터 다시
  UI.resumeOnboard = function () {
    const p = G.player; if (!p || !p.onboard || G.over) return false;
    if (p.onboard === 'examEnd' && p.examEnd && this.renderExamEnd) {
      // 시험은 끝났고 '연락처 교환'만 남았을 때: 시험을 다시 돌리지 않고 그 화면으로 (보상은 이미 받음)
      const e = p.examEnd; this.exam = { ids: e.ids.filter((id) => G.npcById(id)), pick: new Set(e.pick), talked: true, text: '', reveal: null };
      this.closeModal(); this.renderExamEnd(); return true;
    }
    if (p.onboard === 'exam') {
      // 끊긴 시험의 동기·리더를 그대로 다시 데려온다 (새로 뽑으면 앞서 본 대사와 이름이 어긋난다)
      const mates = G.npcs.filter((n) => n.examMate && n.alive !== false && !n.isCompanion).map((n) => n.id);
      const lead = G.npcs.filter((n) => n.examLeader && n.alive !== false).pop();
      this._reuseExam = mates.length && lead ? { ids: mates.slice(-3), leader: lead.id } : null;
      if (!this._reuseExam) G.npcs = G.npcs.filter((n) => !(n.examMate || n.examLeader) || n.isCompanion);
      this.closeModal(); try { this.startExam(); } finally { this._reuseExam = null; } return true;
    }
    if (p.onboard === 'aff') {
      if (p.party && p.party.length) { p.onboard = null; return false; }
      const f = G.flags && G.flags.story && G.flags.story.affFlow;
      const head = f && !f.done && this.affStep ? { type: 'affStep', step: 'guild' } : { type: 'firstParty' };
      if (!G.queue.some((q) => q.type === head.type)) G.queue.unshift(head);
      this.processQueue(); return true;
    }
    return false;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const r = baseHandle.call(this, act, v);
    if (act === 'continue' && this.screen === 'game') this.resumeOnboard();
    return r;
  };
}
