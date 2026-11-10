// ===== 게이트 크로니클: 생사결 뒤 승자의 선택과 범죄 판정 (영역 C, 4-18) =====
// 이기면 바로 죽이지 않고 고른다: 풀어준다 / 탈취한다 / 죽인다. 지면 NPC 승자가 성격·관계·장소로 고른다(무조건 사망 아님).
// 범죄는 장소로 판정: 도시·월드맵 = 법 적용(살인 중범죄, 탈취 경범죄), 게이트 안·북부 봉쇄 구역 = 무법(목격자 소문만).
// 상태: world.duelPending = { id, hp, mp, place }. p.record.spared(풀어준 횟수), p.record.robbed(탈취 횟수).
// 화면(선택 창)은 A가 다듬는다. 여기에는 기본 창(queue 'duelChoice')만 둔다.

const DUEL_AFTER = {
  reportChance: { kind: 0.7, just: 0.85, cold: 0.4, greedy: 0.25, warlike: 0.15 }, // 탈취당한 NPC가 신고할 확률
  robShare: 0.6,       // 탈취: 생사결 전리품의 몫
  fineRob: 300,        // 강도 벌금(등급 배율 곱)
};

TITLES.push({ id: 'merciful', name: '자비로운 승자', how: '생사결에서 이기고 5번 풀어줌', mods: { social: 0.08, def: 0.02 }, cond: (g, p) => ((p.record && p.record.spared) || 0) >= 5 });

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const r = this.player.record; r.spared ??= 0; r.robbed ??= 0;
  });

  // 장소: 'gate'(게이트 안) | 'lawless'(북부 봉쇄 등) | 'city'(도시·월드맵)
  GP.duelPlace = function () {
    if (typeof UI !== 'undefined' && UI.ctx && (UI.ctx.run || UI.ctx.gate)) return 'gate';
    const p = this.player;
    if (this.isNorthTile && this.isNorthTile(p.x, p.y)) return 'lawless';
    return 'city';
  };
  GP.duelLawful = function (place) { return (place || this.duelPlace()) === 'city'; };
  // 정당방위: 상대가 먼저 덤볐거나 수배자·현상금 사냥꾼·악당·원수
  GP.duelSelfDefense = function (n) {
    return !!n && (n.relation <= -20 || persById(n.personality).id === 'warlike' || n.arch === 'villain' || n.bountyHunter || n.nemesis === 'player' || (n.wanted || 0) > 0 || n.ambushedPlayer);
  };

  wrap('finishDuel', function (base, n, won, hpLeft, mpLeft) {
    const p = this.player;
    if (!n) return base.call(this, n, won, hpLeft, mpLeft);
    if (won) {
      if (this._duelKill) return base.call(this, n, won, hpLeft, mpLeft);
      p.hp = Math.max(1, hpLeft); p.mp = mpLeft;
      this.world.duelPending = { id: n.id, hp: p.hp, mp: p.mp, place: this.duelPlace() };
      this.queue.unshift({ type: 'duelChoice', npcId: n.id });
      return `${n.name}이(가) 무릎을 꿇었다. 처분을 정하자.`;
    }
    return this.duelLoseChoice(n, base, hpLeft, mpLeft);
  });

  // 플레이어가 고른다
  GP.duelResolve = function (choice) {
    const d = this.world.duelPending; if (!d) return '';
    this.world.duelPending = null;
    const n = this.npcById(d.id); const p = this.player;
    if (!n || !n.alive) return '';
    const place = d.place; const lawful = this.duelLawful(place); const selfDef = this.duelSelfDefense(n);
    const where = place === 'gate' ? '게이트 안' : place === 'lawless' ? '봉쇄 구역' : regionById(p.region).name;
    if (choice === 'kill') {
      this._duelKill = { place, selfDef };
      let r;
      try { r = this.finishDuel(n, true, d.hp, d.mp); } finally { this._duelKill = null; }
      if (!lawful) {
        // 법은 닿지 않지만 목격자가 있으면 소문
        const witness = this.party().length > 0 || RNG.chance(0.3);
        if (witness) this.rumor(`${where}에서 ${n.name}이(가) 돌아오지 못했다. ${p.name}과(와) 마찰이 있었다는 말이 돈다.`, { kind: 'duel', score: 2 });
        return `${r} (${where}: 법이 닿지 않는 곳)`;
      }
      return r;
    }
    if (choice === 'rob') {
      const take = Math.round(200 * RANKS[n.rankIdx].mult ** 1.5 * DUEL_AFTER.robShare * RNG.range(0.7, 1.3));
      p.money += take; p.record.robbed++;
      if (typeof n.money === 'number') n.money = Math.max(0, n.money - take);
      this.changeRel(n, -40);
      if (RNG.chance(0.45)) n.nemesis ??= 'player';
      if (this.npcRemember) this.npcRemember(n, `${p.name}에게 털렸다`);
      if (this.addLaw) this.addLaw(-5, '강도');
      let out = `${n.name}의 소지금 ${fmt(take)} 크레딧을 빼앗고 살려 보냈다. 앙심을 품었을 것이다.`;
      if (lawful && !selfDef) {
        const pr = (DUEL_AFTER.reportChance[persById(n.personality).id] ?? 0.5) + (this.npcsHere().length > 2 ? 0.15 : 0);
        if (RNG.chance(Math.min(0.95, pr))) {
          const fine = Math.round(DUEL_AFTER.fineRob * RANKS[p.rankIdx].mult);
          this.player.infamy = Math.max(this.player.infamy || 0, (WANTED_STEPS[0] || 40) - 12); if (this.addSin) this.addSin(2, '생사결 뒤 강도'); /* 신고되면 수배 1단계 */
          p.money = Math.max(0, p.money - fine);
          this.rumor(`${n.name}이(가) ${p.name}에게 강도를 당했다며 관리국에 신고했다.`, { kind: 'wanted', score: 2 });
          out += ` ${n.name}이(가) 관리국에 신고했다. 벌금 ${fmt(fine)} 크레딧이 부과됐다.`;
        }
      }
      return out;
    }
    // spare
    p.record.spared++;
    const pid = persById(n.personality).id;
    const grateful = pid === 'kind' || pid === 'just' || (pid !== 'warlike' && RNG.chance(0.5));
    this.changeRel(n, grateful ? 25 : -10);
    if (grateful && n.nemesis === 'player') n.nemesis = null;
    if (!grateful && RNG.chance(0.3)) n.nemesis ??= 'player';
    n.hurt = Math.max(n.hurt || 0, 2);
    p.fame += grateful ? 2 : 0;
    if (this.addLaw) this.addLaw(3, '자비');
    if (this.npcRemember) this.npcRemember(n, grateful ? `${p.name}이(가) 목숨을 살려 줬다` : `${p.name}에게 지고 목숨을 구걸했다`);
    if (n.rankIdx >= 3 || n.met) this.rumor(`${p.name}이(가) 생사결 끝에 ${n.name}을(를) 살려 보냈다.`, { kind: 'duel', score: 1 });
    return grateful ? `${n.name}을(를) 살려 보냈다. "이 빚은 잊지 않겠다." 명성 +2` : `${n.name}을(를) 살려 보냈다. 고개를 숙였지만 눈빛은 차갑다.`;
  };

  // 플레이어가 졌을 때: NPC 승자가 고른다
  GP.duelNpcChoice = function (n, place = this.duelPlace()) {
    const pid = persById(n.personality).id;
    let w = { spare: 1, rob: 1, kill: 1 };
    if (pid === 'kind' || pid === 'just') w = { spare: 6, rob: 0.5, kill: 0.3 };
    else if (pid === 'greedy') w = { spare: 0.5, rob: 6, kill: 1 };
    else if (pid === 'warlike') w = { spare: 0.5, rob: 1.5, kill: 5 };
    else if (pid === 'cold') w = { spare: 1.5, rob: 2.5, kill: 2 };
    if (n.nemesis === 'player' || n.bountyHunter || n.arch === 'villain' || n.relation <= -60) w.kill += 6;
    if (n.relation >= 30) { w.spare += 4; w.kill *= 0.3; }
    if (place === 'city') w.kill *= 0.4; else w.kill *= 1.5; // 도시에선 NPC도 살인죄를 피한다
    return RNG.weighted(['spare', 'rob', 'kill'], [w.spare, w.rob, w.kill]);
  };

  GP.duelLoseChoice = function (n, base, hpLeft, mpLeft) {
    const p = this.player; const place = this.duelPlace();
    const ch = this.duelNpcChoice(n, place);
    if (ch === 'kill') return base.call(this, n, false, hpLeft, mpLeft);
    p.hp = 1; p.mp = 0;
    if (ch === 'rob') {
      const lost = Math.floor(p.money * 0.4); p.money -= lost;
      if (typeof n.money === 'number') n.money += lost;
      const slots = Object.keys(p.equip || {}).filter((k) => p.equip[k]);
      let gear = '';
      if (slots.length && RNG.chance(0.6)) { const k = RNG.pick(slots); gear = p.equip[k].name; p.equip[k] = null; }
      p.injured = Math.max(p.injured || 0, 4); this.recalc();
      this.changeRel(n, -10);
      this.rumor(`${n.name}이(가) 생사결 끝에 ${p.name}을(를) 털고 살려 보냈다.`, { kind: 'duel', score: 2 });
      this.log(`${n.name}에게 졌다. 목숨은 붙어 있지만 털렸다.`, 'bad');
      if (this.duelLawful(place) && RNG.chance(0.5) && n.alive) { n.wanted = (n.wanted || 0) + 1; this.rumor(`관리국이 ${n.name}을(를) 강도 혐의로 수배했다.`, { kind: 'wanted', score: 1 }); }
      return `${n.name}에게 졌다. ${fmt(lost)} 크레딧${gear ? `과 ${gear}` : ''}을(를) 빼앗겼다. (부상 4개월)`;
    }
    // spare
    p.injured = Math.max(p.injured || 0, 3); this.recalc();
    this.changeRel(n, 10);
    if (n.nemesis === 'player') n.nemesis = null;
    this.rumor(`${n.name}이(가) 생사결 끝에 쓰러진 ${p.name}을(를) 살려 보냈다.`, { kind: 'duel', score: 1 });
    this.log(`${n.name}에게 졌지만 목숨은 건졌다.`, 'bad');
    return `${n.name}에게 졌다. "오늘은 여기까지다." 그가 칼을 거뒀다. (부상 3개월)`;
  };
}

if (typeof UI !== 'undefined') {
  UI.showDuelChoice = function (n) {
    const G0 = G.world.duelPending; const lawful = G.duelLawful(G0 && G0.place); const selfDef = G.duelSelfDefense(n);
    const killNote = !lawful ? '법이 닿지 않는 곳. 목격자가 있으면 소문이 난다' : selfDef ? '정당방위로 감경된다. 그래도 악명이 남는다' : '살인 중범죄: 수배·현상금·감찰';
    const robNote = !lawful ? '범죄는 아니지만 원한을 산다' : selfDef ? '상대가 먼저 덤볐다. 신고해도 힘이 없다' : '강도 경범죄: 신고당하면 수배·벌금';
    this.modal(`<div class="ambush">${this.npcPortrait ? this.npcPortrait(n, 100) : ''}<div><div class="eyebrow">생사결 승리</div><h3>${n.name}</h3><div class="row small">${this.rankTag ? this.rankTag(n.rankIdx, n.stage) : ''}</div></div></div>
      <p class="event-text">${n.name}이(가) 무릎을 꿇었다. 숨이 거칠다. 어떻게 할까?</p>
      <div class="cards">
        <button class="choice-btn" data-act="duel-after" data-v="spare"><b>풀어준다</b> <span class="small dim">범죄 아님 · 은혜를 갚을 수도, 앙심을 품을 수도</span></button>
        <button class="choice-btn" data-act="duel-after" data-v="rob"><b>가진 것을 빼앗는다</b> <span class="small dim">${robNote}</span></button>
        <button class="choice-btn danger" data-act="duel-after" data-v="kill"><b>숨통을 끊는다</b> <span class="small dim">${killNote}</span></button>
      </div>`, 'event-box');
  };
  const baseStart = UI.startDuel;
  UI.startDuel = function (n, ambush) { if (n && ambush) n.ambushedPlayer = true; return baseStart.call(this, n, ambush); };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'duelChoice') {
      G.queue.shift();
      const n = G.npcById(q.npcId);
      if (!n || !n.alive || !G.world.duelPending) return this.processQueue();
      return this.showDuelChoice(n);
    }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'duel-after') { this.closeModal(); const msg = G.duelResolve(v); G.save(); this.renderGame(); if (msg) this.toast(msg); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
}
