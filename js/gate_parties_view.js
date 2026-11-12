// ===== 게이트 크로니클: 게이트 안 다른 파티 — 화면 (4-20, 영역 F) =====
// 데이터·이동·경쟁·만남 판정은 영역 C의 js/gate_parties.js (G.gatePartiesIn / Place / Step / At / Visible / Options / Act).
// 여기서는 층 지도 표시, 마주침 창, 결과 팝업, 연합 동행·보상 나눔, 게이트 안 생사결, 먼저 닫힌 게이트 처리, 구출 보너스 연결을 맡는다.

Object.assign(UI, {
  gpvOn() { const c = this.ctx; return !!(c && c.run && c.gate && !c.gate.exam && !c.gate.tutorial && G.gatePartiesIn); },
  gpvParties() {
    const c = this.ctx; const g = c.gate;
    const list = G.gatePartiesIn(g);
    // 월드맵에서 동행한 팀(gate.joint)은 처음부터 연합
    if (g.joint && !c.run.gpvJoint) { c.run.gpvJoint = true; c.run.allyTeam = (c.run.allyTeam || []).concat(g.joint.ids.slice(0, 2)); for (const pt of list) if (pt.ids.some((id) => g.joint.ids.includes(id))) pt.allied = true; }
    if (c.run.gpvPlaced !== c.run.floor + ':' + c.run.map.rows.length) { G.gatePartiesPlace(g, c.run); c.run.gpvPlaced = c.run.floor + ':' + c.run.map.rows.length; }
    return list;
  },
  gpvSeen() {
    const c = this.ctx; const m = c.run.map;
    const seen = m.done.map((k) => k.split(':').map(Number));
    for (const [r, i] of this.reachable()) seen.push([r, i]);
    if (m.pos) seen.push(m.pos);
    return seen;
  },
  gpvColor(pt) { return pt.owner && GUILDS[pt.owner] ? GUILDS[pt.owner].color : pt.owner === 'kama' ? '#ffd84d' : '#c9ced6'; },
  gpvName(pt) { const L = G.gatePartyLeader(pt); return `${L ? L.name : '헌터'}의 파티`; },
  gpvMeet(pt, key, surprised) {
    const c = this.ctx; const g = c.gate; const mem = G.gatePartyMembers(pt); const L = G.gatePartyLeader(pt) || mem[0];
    this._gpv = { pid: pt.pid, key };
    const st = G.gatePartyStance(g, pt);
    const opts = G.gatePartyOptions(g, pt).filter((o) => o.act !== 'help' || G.player.hp < G.player.maxHp * 0.6);
    const danger = (a) => a === 'provoke' || a === 'compete';
    const head = { hostile: '적의', wary: '경계', friendly: '우호', aloof: '무관심', neutral: '중립' }[st] || '';
    return this.modal(fixJosa(`<div class="eyebrow">${c.run.floor + 1}층 · ${surprised ? '뜻밖의 마주침' : '다른 파티'}</div>
      <h3>${this.gpvName(pt)} · ${mem.length}명 <span class="tag" style="--c:${this.gpvColor(pt)};border-color:${this.gpvColor(pt)}">${pt.owner && GUILDS[pt.owner] ? GUILDS[pt.owner].name : pt.owner === 'kama' ? '협회 배정팀' : '프리랜서'}</span></h3>
      <div class="party-hero" style="--c:${this.gpvColor(pt)}">${this.npcPortrait(L, 96)}<div class="grow"><b>${L.name}</b> <span class="small dim">리더 · ${head}</span>
        <div class="row" style="flex-wrap:wrap;gap:4px;margin-top:6px">${mem.map((n) => this.npcAvatar(n, 32)).join('')}</div>
        <p class="ck-say">${surprised ? '어둠 속에서 불쑥 사람 그림자가 튀어나왔다. ' : ''}${G.gatePartyGreeting(g, pt)}</p></div></div>
      <div class="cards">${opts.map((o) => `<button class="choice-btn ${danger(o.act) ? 'danger' : ''}" data-act="gpv-act" data-v="${o.act}">${o.label}${o.hint ? `<span class="ck-tag safe">${o.hint}</span>` : ''}</button>`).join('')}</div>`), 'event-box ck-box');
  },
  gpvAct(act) {
    const c = this.ctx; const g = c.gate; const st = this._gpv; if (!st) return;
    const pt = G.gatePartiesIn(g).find((x) => x.pid === st.pid); if (!pt) return this.gpvContinue(st.key);
    const L = G.gatePartyLeader(pt); const p = G.player;
    const res = G.gatePartyAct(g, pt, act) || { text: '' };
    const gains = [], losses = [];
    if (res.duel) {
      // 게이트 안 생사결: 층 지도 안에서 사람과 싸운다 (괴수 보상 없음, 지면 게이트 패배와 같다)
      this.closeModal(); this._gpv = null; pt.gone = true;
      const mem = G.gatePartyMembers(pt);
      c.nodeKind = 'fight'; c.counted = true; c.gpBrawl = { ids: mem.map((n) => n.id), key: st.key };
      c.combat = new Combat(G, { allies: this.allyUnits(), enemies: mem.map((n) => G.npcUnit(n, 'enemy')), canFlee: false, title: `${L ? L.name : ''} 일행과의 생사결` });
      c.elem = g.elem; this.toast(res.text);
      return this.openCombat();
    }
    if (res.join) { c.run.allyTeam = (c.run.allyTeam || []).concat(res.join); gains.push(`${res.join.length}명 전투 동행`); losses.push('게이트 보상 30% 나눔'); }
    if (res.info) {
      const m = c.run.map; const ahead = m.rows.slice((m.pos || [0])[0] + 1).flat();
      const elite = ahead.filter((n) => n.t === 'elite').length, rest = ahead.filter((n) => n.t === 'rest').length;
      gains.push(`앞길: 정예 ${elite}곳 · 샘 ${rest}곳 · 보스 ${g.elem && ELEMENTS[g.elem] ? ELEMENTS[g.elem].name : '?'} 속성`);
      c.run.gpvInfo = true;
    }
    if (res.trade) {
      const cost = Math.round(100 * (res.trade.markup || 1) * 2 / 10) * 10;
      if (p.money >= cost) { p.money -= cost; p.items.potion = (p.items.potion || 0) + 2; gains.push('응급 회복제 2개'); losses.push(`크레딧 −${fmt(cost)}`); }
      else losses.push(`회복제 두 병 ${fmt(cost)} 크레딧 · 돈이 모자란다`);
    }
    if (res.help && res.help.heal) { const h = Math.round(p.maxHp * res.help.heal); p.hp = Math.min(p.maxHp, p.hp + h); gains.push(`체력 +${fmt(h)}`); }
    if (act === 'greet' || (act === 'info' && res.ok)) gains.push(`${L ? L.name : ''} 관계 +2`);
    if (act === 'compete') losses.push(`${L ? L.name : ''} 관계 −5`, '상대 파티가 서두른다');
    this.gateStub && this.gateStub();
    this._gpv = null;
    const spec = { title: `${this.gpvName(pt)}와(과)의 만남`, eyebrow: `${c.run.floor + 1}층 · 다른 파티`, next: () => this.gpvContinue(st.key) };
    this._ck = spec;
    return this.ckResult({ spec, m: L ? { npc: L, name: L.name } : null, text: res.text || '', gains, losses });
  },
  gpvContinue(key) {
    const c = this.ctx; if (!c || !c.run) return;
    if (!key) return this.renderGateMap();
    const pass = this.councilPass; this.councilPass = true; c.run.gpvPass = key;
    try { return this.enterNode(key); } finally { this.councilPass = pass; c.run.gpvPass = null; }
  },
});

{
  const baseEnter = UI.enterNode;
  UI.enterNode = function (key) {
    const c = this.ctx;
    const real = this.gpvOn() && (this.councilPass || !this.councilMembers || !this.councilMembers().length || this.reachable().length <= 1);
    if (!real || c.run.gpvPass === key) return baseEnter.call(this, key);
    if (!this.reachable().some(([r, i]) => r + ':' + i === key)) return baseEnter.call(this, key);
    const g = c.gate; this.gpvParties();
    const [r, i] = key.split(':').map(Number);
    const here = G.gatePartiesAt(g, c.run, r, i).filter((pt) => !pt.gone && !(c.run.gpvMetAt || {})[pt.pid + '@' + key]);
    if (here.length) {
      const pt = here[0]; (c.run.gpvMetAt ||= {})[pt.pid + '@' + key] = true;
      const seenBefore = G.gatePartyVisible(g, c.run, pt, this.gpvSeen());
      return this.gpvMeet(pt, key, !seenBefore && !pt.met);
    }
    // 다른 파티도 나아간다 (경쟁)
    const evs = G.gatePartiesStep(g, c.run) || [];
    const closed = evs.find((e) => e.type === 'closed');
    if (closed) {
      return this.modal(`<div class="eyebrow">${c.run.floor + 1}층 · 경쟁</div><h3>선점당했다</h3><p class="event-text">${fixJosa(closed.text || '다른 파티가 먼저 보스를 쓰러뜨렸다.')}</p>
        <ul class="ck-items loss"><li><span class="ck-sign">−</span>게이트가 닫힌다 · 보스 보상 없음</li></ul><ul class="ck-items gain"><li><span class="ck-sign">+</span>지금까지의 전리품은 챙겨 나간다</li></ul>
        <div class="row end"><button class="primary" data-act="gpv-closed">전리품을 챙겨 나간다</button></div>`, 'event-box ck-box');
    }
    for (const e of evs) if (e.type === 'retreat' && e.text) this.toast(e.text);
    return baseEnter.call(this, key);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'gpv-act') return this.gpvAct(v);
    if (act === 'gpv-closed') {
      this.closeModal(); const c = this.ctx;
      if (c && c.gate) { G.mapGates = G.mapGates.filter((x) => x.id !== c.gate.id); }
      this.gateStub && this.gateStub();
      return baseHandle.call(this, 'g-finish', 'retreat');
    }
    return baseHandle.call(this, act, v);
  };
  // 층 지도: 보이는 다른 파티를 초상으로, 상황 한 줄
  const baseMap = UI.renderGateMap;
  UI.renderGateMap = function (note) {
    const r = baseMap.call(this, note);
    if (!this.gpvOn() || !document.querySelector('#modal .gmap')) return r;
    const c = this.ctx; const g = c.gate; const m = c.run.map; const box = document.querySelector('#modal .gmap');
    const list = this.gpvParties().filter((pt) => !pt.gone);
    if (!list.length && !(c.run.allyTeam || []).length) return r;
    const seen = this.gpvSeen(); const nodes = box.querySelectorAll('.gnode');
    for (const pt of list) {
      if (!G.gatePartyVisible(g, c.run, pt, seen)) continue;
      let idx = 0; for (let k = 0; k < pt.row && k < m.rows.length; k++) idx += m.rows[k].length; idx += pt.col;
      const btn = nodes[idx]; if (!btn) continue;
      const L = G.gatePartyLeader(pt);
      box.insertAdjacentHTML('beforeend', `<div class="gp-mark" style="left:${btn.style.left};top:${btn.style.top};--c:${this.gpvColor(pt)}" title="${this.gpvName(pt)}">${L ? this.npcAvatar(L, 26) : ''}<b>${G.gatePartyMembers(pt).length}</b></div>`);
    }
    const lg = document.querySelector('#modal .gmap-legend');
    if (lg && !document.querySelector('#modal .gp-line')) {
      const here = list.filter((pt) => pt.floor === c.run.floor && !pt.allied);
      const ahead = list.filter((pt) => pt.floor > c.run.floor);
      const parts = [];
      if ((c.run.allyTeam || []).length) parts.push('<span class="good">연합 파티 동행 중 · 보상 30% 나눔</span>');
      if (here.length) parts.push(`<span class="amber">이 층에 다른 파티 ${here.length}팀.${G.gateScoutPower() >= 0.35 ? ' 탐색된 칸이면 위치가 보인다.' : ' 탐색계가 없어 위치를 모른다.'}</span>`);
      if (ahead.length) parts.push('<span class="amber">앞서 내려간 파티가 있다. 보스를 먼저 잡으면 게이트가 닫힌다.</span>');
      if (parts.length) lg.insertAdjacentHTML('afterend', `<div class="gp-line small">${parts.join(' ')}</div>`);
    }
    return r;
  };
  // 게이트 안 생사결이 끝나면: 이기면 상대 팀은 돌아가지 못한다 (게이트 안 = 범죄 아님, 4-18)
  const baseRes = UI.combatResultHtml;
  UI.combatResultHtml = function () {
    const c = this.ctx;
    if (c && c.gpBrawl && c.combat && c.combat.result === 'win' && !c.gpBrawl.done) {
      c.gpBrawl.done = true; const p = G.player; const names = [];
      for (const id of c.gpBrawl.ids) { const n = G.npcById(id); if (n && n.alive) { G.killNpc(n, '게이트 안 생사결'); names.push(n.name); p.record.npcKills = (p.record.npcKills || 0) + 1; } }
      if (c.gate.raid && c.gate.raid.ids && c.gate.raid.ids.some((id) => c.gpBrawl.ids.includes(id))) c.gate.raid = null;
      if (names.length) G.rumor(`${G.gateName(c.gate)}에 들어간 ${names.join('·')}이(가) 돌아오지 않았다. 안에서 무슨 일이 있었는지 아는 사람은 없다.`);
      c.gpBrawl.text = names.length ? `${names.join('·')}은(는) 이 게이트에서 돌아가지 못한다.` : '';
    }
    const html = baseRes.call(this);
    return c && c.gpBrawl && c.gpBrawl.text && c.combat.result === 'win' ? html.replace('<div class="row end">', `<p class="small bad">${fixJosa(c.gpBrawl.text)}</p><div class="row end">`) : html;
  };
  // 연합한 파티원은 전투에 함께 (최대 5명)
  const baseAllies = UI.allyUnits;
  UI.allyUnits = function () {
    const list = baseAllies.call(this); const c = this.ctx; const ids = c && c.run && c.run.allyTeam;
    if (!ids) return list;
    for (const id of ids) { if (list.length >= 5) break; const n = G.npcById(id); if (n && n.alive && !list.some((u) => u.npcId === id)) list.push(G.npcUnit(n, 'ally')); }
    return list;
  };
  // 연합 보상 나눔
  const GP = Game.prototype; const baseFin = GP.finishGate;
  GP.finishGate = function (gate, result, loot, ...rest) {
    const c = UI.ctx; const share = c && c.run && (c.run.allyTeam || []).length && c.gate === gate && loot && result !== 'lose';
    let cut = 0; if (share && loot.money > 0) { cut = Math.round(loot.money * 0.3); loot.money -= cut; }
    const lines = baseFin.call(this, gate, result, loot, ...rest);
    if (cut && Array.isArray(lines)) lines.push(`연합 파티와 보상을 나눴다: ${fmt(cut)} 크레딧 (30%)`);
    return lines;
  };
  // 4-19 구출: C의 gateRescueBonus 를 E의 구출 확률에 더한다
  if (GP.rescueChance && GP.gateRescueBonus) {
    const baseResc = GP.rescueChance;
    GP.rescueChance = function (gate) { return Math.max(0.05, Math.min(0.97, baseResc.call(this, gate) + (gate && gate.parties ? this.gateRescueBonus(gate) : 0))); };
  }
}
