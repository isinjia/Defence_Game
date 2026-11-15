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

// ---------- 큐(밀린 사건·알림) 저장 ----------
// G.queue 는 저장되지 않아(load 때 비움) 사건·부탁·깨달음·신의 선택·대회 초대 같은 것이 처리 전에 껐다 켜면 사라졌다.
// 저장할 수 있는 항목만 따로 남긴다. 빼는 것: 토스트·게임오버(일시적), 함수가 든 항목(이야기 전투 후처리 등 · 직렬화 불가),
// 이미 다른 복구 장치가 있는 것(인연 bond_*, 데뷔 debut_*, 첫 파티·소속 흐름).
{
  const QKEY = typeof SAVE_KEY !== 'undefined' ? SAVE_KEY + '_queue' : 'gate_chronicle_queue';
  const hasFn = (o, d = 0) => { if (typeof o === 'function') return true; if (!o || typeof o !== 'object' || d > 6) return false; for (const k in o) if (hasFn(o[k], d + 1)) return true; return false; };
  const keep = (q) => q && q.type && !['toast', 'gameover', 'firstParty', 'affStep'].includes(q.type)
    && !(q.type === 'story' && /^(bond_|debut_)/.test(q.id || '')) && !hasFn(q);
  const baseSave = Game.prototype.save;
  Game.prototype.save = function (...a) {
    const r = baseSave.apply(this, a);
    try {
      if (this.over) localStorage.removeItem(QKEY);
      else {
        const q = (this.queue || []).filter(keep);
        // 화면에 띄운 채 아직 고르지 않은 항목(큐에서는 이미 빠졌다)도 맨 앞에 남긴다
        const cur = typeof UI !== 'undefined' && UI._curQ; if (cur && keep(cur) && !q.includes(cur)) q.unshift(cur);
        localStorage.setItem(QKEY, JSON.stringify({ mk: this.monthKey(), day: this.day, q }));
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  const baseLoad = Game.prototype.load;
  Game.prototype.load = function (...a) {
    const ok = baseLoad.apply(this, a);
    if (!ok) return ok;
    try {
      const d = JSON.parse(localStorage.getItem(QKEY) || 'null');
      // 같은 날짜에 저장된 큐일 때만 되살린다(다른 판·옛 저장의 큐가 섞이지 않게)
      if (d && d.mk === this.monthKey() && d.day === this.day && Array.isArray(d.q) && d.q.length) {
        const sig = (q) => q.type + ':' + (q.id || '') + ':' + (q.npc ?? q.npcId ?? '');
        const have = new Set((this.queue || []).map(sig));
        for (const q of d.q) if (!have.has(sig(q))) this.queue.push(q);
      }
    } catch (e) { /* 무시 */ }
    return ok;
  };
  // 띄운 항목 기억: processQueue 가 꺼낸 항목이 창으로 떠 있는 동안. 무엇이든 누르면(고르면) 잊는다(중복 보상 방지)
  const baseQ = UI.processQueue;
  UI.processQueue = function (...a) {
    const q = G.queue && G.queue[0];
    if (!this.modalOpen() && !this.dlg) this._curQ = null; // 창이 떠 있으면 base 가 아무것도 안 꺼낸다: 기억 유지
    const r = baseQ.apply(this, a);
    try { if (q && G.queue[0] !== q && (this.modalOpen() || this.dlg)) this._curQ = q; } catch (e) { /* 무시 */ }
    return r;
  };
  // 되살린 큐는 이어하기 직후 처리한다
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act !== 'continue') this._curQ = null;
    const r = baseHandle.call(this, act, v);
    if (act === 'continue' && this.screen === 'game' && G.queue && G.queue.length) setTimeout(() => { try { if (!this.modalOpen() && !this.dlg && !this.ctx) this.processQueue(); } catch (e) { /* 무시 */ } }, 600);
    return r;
  };
}

// ---------- 위기 뒤 깨달음 보너스 표시(G._afterCrisis)도 저장 ----------
{
  Object.defineProperty(Game.prototype, '_afterCrisis', {
    configurable: true,
    get() { return !!(this.flags && this.flags.afterCrisis); },
    set(v) { if (this.flags) this.flags.afterCrisis = !!v; },
  });
}
