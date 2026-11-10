// ===== 게이트 크로니클: 생사결 범죄는 장소와 목격자로 (영역 A, 사용자 확정) =====
// - 도시: 빼앗거나 죽이면 언제나 범죄. 상대가 먼저 덤볐어도 마찬가지다(정당방위 감경 없음, 현상금 사냥꾼만 예외).
// - 월드맵(도시 밖)·게이트 안: 근처에 목격자가 없으면 범죄가 아니다. 목격자가 있으면 범죄.
//   목격자까지 모두 처리하면(전투로 쓰러뜨려 입을 막으면) 범죄가 되지 않는다.
// - 봉쇄 구역(북부): 법이 닿지 않는다.
// 판정 함수는 C(js/duel_after.js, js/public_order.js)를 그대로 쓰고, "법 적용(place 'city')"인지를 여기서 정한다.
//   world.duelPending = { id, hp, mp, place, where, witnesses: [npc id] }
//   where: 'city' | 'field' | 'gate' | 'lawless'  /  place: 'city'(범죄가 되는 곳) | 'gate' | 'lawless'

const WITNESS = { fieldRandom: 0.25, fieldNear: 2, cityPeek: 0 };

Object.assign(Game.prototype, {
  // 생사결 자리의 목격자 (상대 본인·내 파티는 빼고)
  duelWitnesses(where, foe) {
    const out = new Set(); const p = this.player; const skip = (n) => !n || !n.alive || n.child || n === foe || n.isCompanion || (this.party && this.party().includes(n));
    if (where === 'field') {
      // 근처를 지나는 공략팀
      for (const g of Object.values(this.gates || {}).flat()) {
        if (!g || !g.raid || !this.raidPos) continue;
        const pos = this.raidPos(g); if (!pos || pos.arrived) continue;
        if (Math.max(Math.abs(pos.x - p.x), Math.abs(pos.y - p.y)) <= WITNESS.fieldNear) for (const id of g.raid.ids || []) { const n = this.npcById(id); if (!skip(n)) out.add(n.id); }
      }
      // 지나가던 사람 (가끔)
      if (RNG.chance(WITNESS.fieldRandom)) {
        const pool = this.npcsHere().filter((n) => !skip(n));
        for (let k = 0; k < RNG.int(1, 2) && pool.length; k++) { const n = RNG.pick(pool); out.add(n.id); pool.splice(pool.indexOf(n), 1); }
      }
    }
    if (where === 'gate' && typeof UI !== 'undefined' && UI.ctx) {
      const c = UI.ctx.prevCtx || UI.ctx; const g = c.gate;
      // 같은 게이트 안에 들어와 있는 다른 공략팀
      if (g && g.raid && this.raidPos) { const pos = this.raidPos(g); if (pos && pos.arrived) for (const id of g.raid.ids || []) { const n = this.npcById(id); if (!skip(n)) out.add(n.id); } }
      // 함께 쓰러진 추격대원
      const ch = c.run && c.run.lastChase; if (ch && ch.ids) for (const id of ch.ids) { const n = this.npcById(id); if (!skip(n)) out.add(n.id); }
    }
    return [...out];
  },
  // 생사결 자리 정하기 (C가 세운 duelPending 을 보강)
  duelStage(d, foe) {
    if (!d) return d;
    const onCity = !!(this.onCity && this.onCity());
    const where = d.where || (d.place === 'gate' ? 'gate' : d.place === 'lawless' ? 'lawless' : onCity ? 'city' : 'field');
    d.where = where;
    d.witnesses ??= where === 'field' || where === 'gate' ? this.duelWitnesses(where, foe) : [];
    d.witnesses = d.witnesses.filter((id) => { const n = this.npcById(id); return n && n.alive; });
    d.place = where === 'city' || ((where === 'field' || where === 'gate') && d.witnesses.length) ? 'city' : where === 'gate' ? 'gate' : 'lawless';
    return d;
  },
});

{
  const GP = Game.prototype;
  // 이긴 뒤 처분 대기 상태에 자리·목격자를 붙인다
  const baseFinish = GP.finishDuel;
  GP.finishDuel = function (n, won, ...rest) {
    const r = baseFinish.call(this, n, won, ...rest);
    if (won && !this._duelKill && this.world.duelPending && n && this.world.duelPending.id === n.id) this.duelStage(this.world.duelPending, n);
    return r;
  };
  // 정당방위 감경 없음: 법이 닿는 곳에서 빼앗거나 죽이면 범죄 (현상금 사냥꾼만 예외)
  GP.duelSelfDefense = function (n) { return !!(n && n.bountyHunter); };
}

Object.assign(UI, {
  duelPlaceInfo(place) {
    const d = G.world.duelPending || {}; const where = d.where || (place === 'gate' ? 'gate' : place === 'lawless' ? 'lawless' : 'city');
    const ws = (d.witnesses || []).map((id) => G.npcById(id)).filter(Boolean);
    const names = ws.slice(0, 3).map((n) => n.name).join(', ') + (ws.length > 3 ? ` 외 ${ws.length - 3}명` : '');
    if (where === 'city') return { cls: 'lawful', label: `${regionById(G.player.region).name} · 도시 안 · 법이 적용되는 곳`, note: '도시에서는 상대가 먼저 덤볐어도 빼앗거나 죽이면 범죄다. 관리국 감찰·수배가 따른다.' };
    if (where === 'lawless') return { cls: 'lawless', label: '봉쇄 구역 · 법이 닿지 않는 곳', note: '범죄가 되지 않는다.' };
    const at = where === 'gate' ? '게이트 안' : '월드맵(도시 밖)';
    if (!ws.length) return { cls: 'lawless', label: `${at} · 목격자 없음`, note: '보는 눈이 없다. 무엇을 해도 범죄가 되지 않는다.' };
    return { cls: 'lawful', label: `${at} · 목격자 ${ws.length}명`, note: `${names}이(가) 보고 있다. 빼앗거나 죽이면 범죄가 된다. 목격자까지 처리하면 이야기가 달라진다.` };
  },
});

{
  // 선택 창에 "목격자부터 처리한다"를 덧붙인다
  const baseShow = UI.showDuelChoice;
  UI.showDuelChoice = function (n) {
    G.duelStage(G.world.duelPending, n);
    const r = baseShow.call(this, n);
    const d = G.world.duelPending || {};
    const ws = (d.witnesses || []).map((id) => G.npcById(id)).filter((x) => x && x.alive);
    const cards = document.querySelector('#modal-box .duel-choice .cards');
    if (cards && ws.length && d.where !== 'city') {
      cards.insertAdjacentHTML('beforeend', `<button class="choice-btn danger" data-act="duel-witness"><span class="dc-row"><b>목격자부터 처리한다</b><span class="dc-tag warn">${ws.length}명과 전투</span></span><span class="small dim">${ws.map((x) => x.name).join(', ')} · 모두 쓰러뜨려 입을 막으면 범죄가 되지 않는다. 놓치면 신고당한다</span></button>`);
    }
    return r;
  };
  // 목격자 전투
  UI.startWitnessFight = function () {
    const d = G.world.duelPending; if (!d) return;
    const ws = (d.witnesses || []).map((id) => G.npcById(id)).filter((x) => x && x.alive); if (!ws.length) return;
    const prev = this.ctx && this.ctx.run ? this.ctx : null;
    this.closeModal();
    this.ctx = { kind: 'witness', prevCtx: prev, pending: d, combat: new Combat(G, { allies: this.allyUnits(), enemies: ws.map((n) => G.npcUnit(n, 'enemy')), canFlee: true, title: '목격자의 입을 막는다' }) };
    this.openCombat();
  };
  const baseFinishP = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function (...a) {
    const c = this.ctx;
    if (!c || c.kind !== 'witness') return baseFinishP.apply(this, a);
    const cb = c.combat; const p = G.player; const d = c.pending; const foe = G.npcById(d.id);
    p.hp = Math.max(1, cb.player.hp); p.mp = Math.max(0, cb.player.mp);
    const ws = (d.witnesses || []).map((id) => G.npcById(id)).filter((x) => x && x.alive);
    this.ctx = c.prevCtx || null;
    this.closeModal();
    if (cb.result === 'win') {
      for (const n of ws) { G.killNpc(n, `${p.name}에게 입막음`, 'player'); p.record.npcKills++; }
      if (G.addLaw) G.addLaw(-6, '목격자 살해');
      d.witnesses = []; d.hp = p.hp; d.mp = p.mp; G.duelStage(d, foe);
      G.save();
      this.toast(`목격자 ${ws.length}명의 입을 막았다. 이제 보는 눈이 없다.`);
      if (foe && foe.alive) return this.showDuelChoice(foe);
      return this.ctx && this.ctx.run ? this.renderGateMap() : this.renderGame();
    }
    // 놓쳤다: 목격자들이 신고하고, 무릎 꿇었던 상대도 그 틈에 달아난다
    G.world.duelPending = null;
    if (foe && foe.alive) { G.changeRel(foe, -30); foe.nemesis ??= 'player'; }
    if (G.addSin) G.addSin(3, '목격자 습격');
    if (G.rumor) G.rumor(`${p.name}이(가) 생사결을 본 사람들까지 해치려 했다는 신고가 들어왔다.`, { kind: 'wanted', score: 3 });
    G.save();
    const msg = cb.result === 'flee' ? '목격자들을 놓쳤다. 신고가 들어갔고, 상대도 그 틈에 달아났다.' : '목격자들에게 밀렸다. 신고가 들어갔고, 상대도 그 틈에 달아났다.';
    if (this.ctx && this.ctx.run) return this.renderGateMap(`<b>입막음 실패</b> · ${msg}`);
    this.renderGame(); this.toast(msg); return this.processQueue();
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'duel-witness') return this.startWitnessFight();
    return baseHandle.call(this, act, v);
  };
}
