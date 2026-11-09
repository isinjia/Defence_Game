// ---------- 진행 단계 복구 (평가 보고 1순위) ----------
// 큐(G.queue)는 저장되지 않는다. 시험·소속·첫 파티 도중 새로고침하면 그 단계가 통째로 사라지던 문제를
// player.onboard 단계 표시로 막는다. 'exam' → 시험 다시, 'aff' → 소속 흐름 다시, 끝나면 null.
if (typeof Game !== 'undefined') {
  const baseInit = Game.prototype.initSandbox;
  Game.prototype.initSandbox = function () {
    const r = baseInit.apply(this, arguments);
    const p = this.player;
    if (p) p.onboard ??= null;
    return r;
  };
}

if (typeof UI !== 'undefined') {
  const baseStart = UI.startExam;
  UI.startExam = function () {
    if (G.player) { G.player.onboard = 'exam'; G.save(); }
    return baseStart.apply(this, arguments);
  };

  const baseEnd = UI.endExam;
  UI.endExam = function () {
    const r = baseEnd.apply(this, arguments);
    if (G.player) { G.player.onboard = 'aff'; G.save(); }
    return r;
  };

  const baseDone = UI.firstPartyDone;
  UI.firstPartyDone = function () {
    if (G.player) G.player.onboard = null;
    return baseDone.apply(this, arguments);
  };

  // 이어하기: 끊긴 단계부터 다시
  UI.resumeOnboard = function () {
    const p = G.player; if (!p || !p.onboard || G.over) return false;
    if (p.onboard === 'exam') {
      // 끊긴 시험의 동기·리더는 지우고 처음부터
      G.npcs = G.npcs.filter((n) => !(n.examMate || n.examLeader) || n.isCompanion);
      this.closeModal(); this.startExam(); return true;
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
