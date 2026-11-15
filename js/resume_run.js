// ===== 게이트 크로니클: 게이트 안·리더 이동 중 이어하기 (사용자 제보) =====
// 게이트 진행(UI.ctx.run)과 리더가 이끄는 이동(UI.crewMarch)은 화면 쪽에만 있어 저장되지 않았다.
// 그래서 껐다 켜면 ① 게이트 밖으로 나와 있거나 ② 팀 일(c.job)은 진행 중인데 이동 결정권이 플레이어에게 넘어와 있었다.
// - 게이트: 층 지도를 그릴 때마다(칸에 들어가기 직전 상태) player.gateRunSave 에 남긴다. 이어하면 그 층 지도로 돌아간다.
//   칸 안(전투·사건) 도중에 껐다면 그 칸에 들어가기 전 지도로 돌아온다(그 칸을 다시 연다).
// - 리더 이동: UI.crewMarch 가 바뀔 때마다 player.crewMarchSave 에 남기고, 이어하면 리더가 다시 이끈다.
{
  const clone = (o) => { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; } };

  // ---------- 리더 이동 ----------
  let march = UI.crewMarch || null;
  Object.defineProperty(UI, 'crewMarch', {
    configurable: true, enumerable: true,
    get() { return march; },
    set(v) {
      march = v || null;
      try { if (G && G.player) G.player.crewMarchSave = v ? clone(v) : null; } catch (e) { /* 무시 */ }
    },
  });

  // ---------- 게이트 진행 ----------
  const baseMap = UI.renderGateMap;
  if (baseMap) UI.renderGateMap = function (...a) {
    const r = baseMap.apply(this, a);
    try {
      const c = this.ctx;
      // 칸에 들어가는 중(이동 장면 등)에는 남기지 않는다: 들어가기 전 지도가 기준
      if (c && c.kind === 'gate' && c.run && c.gate && !this._xrEnterKey && G.player) {
        G.player.gateRunSave = {
          gid: c.gate.id, run: clone(c.run), loot: clone(c.loot), hidden: !!c.hidden, crewRaid: !!c.crewRaid,
          hp: c.combat && c.combat.player ? c.combat.player.hp : G.player.hp,
          mp: c.combat && c.combat.player ? c.combat.player.mp : G.player.mp,
        };
        G.save();
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseFinish = Game.prototype.finishGate;
  if (baseFinish) Game.prototype.finishGate = function (...a) {
    if (this.player) this.player.gateRunSave = null;
    return baseFinish.apply(this, a);
  };

  UI.resumeRun = function () {
    const p = G.player; if (!p || G.over || this.ctx || this.dlg || p.onboard) return false;
    const s = p.gateRunSave;
    if (s) {
      const gate = G.mapGates.find((g) => g.id === s.gid && !g.cleared);
      if (!gate || !s.run || !s.run.map) { p.gateRunSave = null; return false; }
      this.closeModal();
      this.ctx = { kind: 'gate', gate, rooms: [], roomIdx: 0, loot: s.loot || { money: 0, ether: 0, kills: 0, list: [] }, hidden: s.hidden, run: s.run,
        crewRaid: s.crewRaid, _snapped: true,
        combat: { player: { hp: s.hp ?? p.hp, mp: s.mp ?? p.mp }, units: [], result: null, kills: [] } };
      if (G.gateSnapNow) G.gateSnapNow();
      this.renderGateMap();
      this.toast('게이트 안에서 이어 갑니다.');
      return true;
    }
    const m = p.crewMarchSave;
    if (m && !march) {
      const c = G.crew && G.crew();
      if (!c || !c.job) { p.crewMarchSave = null; return false; }
      this.crewMarch = m;
      this.toast('리더가 팀을 이끌고 다시 출발한다.');
      setTimeout(() => { if (this.crewMarch && !this.walking && !this.ctx && !this.modalOpen() && !this.dlg) this.crewMarchStep(); }, 400);
      return true;
    }
    return false;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const r = baseHandle.call(this, act, v);
    if (act === 'continue' && this.screen === 'game') {
      // 이어하기 직후 뜨는 창(밀린 소식 등)이 닫힐 때까지 잠시 기다렸다가 되돌린다
      let n = 0; const tick = () => { try { if (this.ctx || n++ > 40) return; if (this.modalOpen() || this.dlg || this.walking) return setTimeout(tick, 500); this.resumeRun(); } catch (e) { /* 무시 */ } };
      setTimeout(tick, 250);
    }
    return r;
  };
}
