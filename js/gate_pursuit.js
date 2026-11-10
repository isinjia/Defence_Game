// ===== 게이트 크로니클: 길드 추격대 — 게이트 안 대인 전투 (영역 A, 4-17 추가) =====
// 길드 게이트 보스를 가로채려 하면 길드가 게이트 안으로 쫓아올 수 있다. 추격 판정·관계·뉴스는 C, 최종층 진입 훅은 F.
// A는 "쫓아오는 연출 → 따라잡힘 → 협상 → 대인 전투 → 결과"를 맡는다.
//
// 다른 영역이 부르는 법
//   UI.gatePursuitStart(guildId, { steps })  층 지도에 추격대 표식을 띄운다. 칸을 하나 지날 때마다 1칸씩 다가오고 0이 되면 따라잡힌다.
//   UI.gatePursuitCatch(guildId)             바로 따라잡힌다(협상 창부터).
//   G.gatePursuitResult(info)                (C가 정의) 결과 통보. info = { guild, result, amount }
//     result: 'share'(전리품 절반 넘김) | 'bribe'(뇌물) | 'apology'(사과하고 물러남) | 'win'(이김) | 'lose'(짐) | 'dead'(사망)
// 길드 성향: 거대 길드(tier 'giant')는 협상을 먼저 받고 법적 대응을 예고한다. 무법 길드(GUILDS[id].lawless 또는 거친 성향)는 협상 없이 바로 덤빈다.

const PURSUIT = {
  teamMax: 3,          // 추격대 인원
  shareRate: 0.5,      // 나눠 줄 몫
  bribeBase: 400,      // 뇌물 (게이트 등급 배율 곱)
  deathChance: { giant: 0.03, normal: 0.06, lawless: 0.14 }, // 지면 목숨을 잃을 확률
  injury: 6,           // 지면 부상 (개월)
  infamyWin: 12,       // 이기면 오르는 악명
};

const pursuitStyle = (gid) => {
  const g = GUILDS[gid] || {};
  if (g.lawless || /거침|야간|무법|암시장/.test(g.style || '')) return 'lawless';
  if (g.tier === 'giant') return 'giant';
  return 'normal';
};

Object.assign(UI, {
  // gid 자리에 C의 G.guildChaseCheck(g) 결과(chase 객체)를 그대로 넘겨도 된다
  gatePursuitStart(gid, opts = {}) {
    const c = this.ctx; if (!c || !c.run) return;
    const chase = gid && typeof gid === 'object' ? gid : null; if (chase) gid = chase.guild;
    c.run.pursuit = { guild: gid, chase, steps: Math.max(1, opts.steps ?? 2), style: chase && chase.temper === 'lawless' ? 'lawless' : pursuitStyle(gid) };
    this.renderGateMap(`<b>${(GUILDS[gid] || {}).name || '길드'} 추격대</b>가 게이트 안으로 들어왔다. 뒤에서 발소리가 다가온다.`);
  },
  gatePursuitCatch(gid) {
    const c = this.ctx; if (!c || !c.run) return;
    const chase = gid && typeof gid === 'object' ? gid : (c.run.pursuit && c.run.pursuit.chase) || null; if (chase) gid = chase.guild;
    gid = gid || (c.run.pursuit && c.run.pursuit.guild);
    c.run.pursuit = { guild: gid, chase, steps: 0, style: chase && chase.temper === 'lawless' ? 'lawless' : pursuitStyle(gid) };
    this.pursuitCaught();
  },
  // 추격대 구성: 그 길드의 실제 길드원 중 게이트 등급 언저리, 모자라면 이름 없는 길드원
  pursuitTeam() {
    const c = this.ctx; const pu = c.run.pursuit; const t = GateRun.tier(c.gate);
    const real = pu.chase && pu.chase.ids ? pu.chase.ids.map((id) => G.npcById(id)).filter((n) => n && n.alive)
      : G.npcs.filter((n) => n.alive && !n.child && n.guild === pu.guild && !n.isCompanion && Math.abs((n.rankIdx || 0) - t) <= 1)
        .sort((a, b) => (b.rankIdx || 0) - (a.rankIdx || 0)).slice(0, PURSUIT.teamMax);
    const units = real.map((n) => G.npcUnit(n, 'enemy'));
    while (units.length < 2) {
      const n = G.makeNpc(true); n.rankIdx = Math.max(0, t); n.guild = pu.guild; n.id = -1000 - units.length;
      const u = G.npcUnit(n, 'enemy'); u.id = 'pursuer' + units.length; u.npcId = null; u.name = n.name; u.rankText = `${(GUILDS[pu.guild] || {}).name || '길드'} 길드원`;
      units.push(u);
    }
    pu.rank = Math.max(...real.map((n) => n.rankIdx || 0), t);
    pu.names = real.map((n) => n.name);
    return units;
  },
  // 따라잡힘: 협상 창 (무법 길드는 바로 전투)
  pursuitCaught() {
    const c = this.ctx; const pu = c.run.pursuit; const G0 = GUILDS[pu.guild] || {}; const p = G.player;
    const team = this.pursuitTeam(); pu.team = team;
    const lead = pu.names && pu.names[0];
    if (pu.style === 'lawless' || (pu.chase && pu.chase.mood === 'kill')) {
      return this.modal(`<div class="eyebrow">${G0.name || '길드'} 추격대</div><h3>따라잡혔다</h3>
        <p class="event-text">어둠 속에서 칼날이 번뜩인다. ${lead ? `${lead}이(가) 이를 드러낸다. ` : ''}"남의 밥그릇에 손대면 어떻게 되는지 알지?" 말이 통할 상대가 아니다.</p>
        <div class="row end"><button class="danger" data-act="gp-fight">맞서 싸운다</button></div>`, 'event-box');
    }
    const bribe = Math.round(PURSUIT.bribeBase * RANKS[GateRun.tier(c.gate)].mult);
    const share = Math.round(c.loot.money * PURSUIT.shareRate);
    const legal = pu.style === 'giant' ? '<p class="small amber">거대 길드다. 여기서 맞서면 나가서도 법적 대응과 현상금이 따라올 수 있다.</p>' : '';
    this.modal(`<div class="eyebrow">${G0.name || '길드'} 추격대</div><h3>따라잡혔다</h3>
      <p class="event-text">${lead ? `${lead}을(를) 앞세운 ` : ''}${team.length}명이 길을 막아섰다. "여긴 우리 길드가 낙찰받은 게이트다. 보스는 우리 몫이야. 어떻게 할래?"</p>${legal}
      <div class="cards">
        <button class="choice-btn" data-act="gp-deal" data-v="share" ${share > 0 ? '' : 'disabled'}><b>전리품 절반을 넘긴다</b> <span class="small dim">${fmt(share)} 크레딧 · 에테르도 절반</span></button>
        <button class="choice-btn" data-act="gp-deal" data-v="bribe" ${p.money >= bribe ? '' : 'disabled'}><b>뒷돈을 찔러 준다</b> <span class="small dim">${fmt(bribe)} 크레딧 · 안 받을 수도 있다</span></button>
        <button class="choice-btn" data-act="gp-deal" data-v="apology"><b>사과하고 물러난다</b> <span class="small dim">보스는 포기하고 게이트를 나간다</span></button>
        <button class="choice-btn danger" data-act="gp-fight"><b>맞서 싸운다</b> <span class="small dim">대인 전투 · 지면 전리품 압수·큰 부상, 드물게 목숨을 잃는다</span></button>
      </div>`, 'event-box');
  },
  pursuitNotify(result, amount = 0) {
    const pu = this.ctx && this.ctx.run && this.ctx.run.pursuit;
    if (G.gatePursuitResult && pu) try { G.gatePursuitResult({ guild: pu.guild, result, amount }); } catch (e) { /* C 쪽 실패는 무시 */ }
  },
  pursuitDeal(kind) {
    const c = this.ctx; const pu = c.run.pursuit; const p = G.player; const G0 = GUILDS[pu.guild] || {};
    const say = (t) => fixJosa(t);
    // C의 협상 판정이 있으면 그것을 쓴다 (관계·평판·뉴스까지 C가 처리)
    if (G.guildChaseDeal) {
      const res = G.guildChaseDeal(c.gate, kind, pu.chase || { guild: pu.guild, temper: pu.style === 'lawless' ? 'lawless' : 'legal' }) || {};
      if (!res.ok) return res.cost == null && kind === 'bribe' && /모자라/.test(res.text || '') ? this.toast(res.text) : this.pursuitFail(res.text || '"말로 끝날 일이 아니야."');
      c.run.pursuit = null;
      if (res.leave) { this.toast(res.text); this.gateStub(); return UI.handle('g-finish', 'retreat'); }
      return this.renderGateMap(`<b>협상</b> · ${say(res.text)}`);
    }
    if (kind === 'share') {
      const ok = Math.random() < (pu.style === 'giant' ? 0.85 : 0.7);
      if (ok) {
        const m = Math.round(c.loot.money * PURSUIT.shareRate), e = Math.round(c.loot.ether * PURSUIT.shareRate);
        c.loot.money -= m; c.loot.ether -= e; c.run.pursuit = null; this.pursuitNotify('share', m);
        return this.renderGateMap(say(`<b>협상</b> · 전리품 절반(${fmt(m)} 크레딧)을 넘겼다. 추격대는 "보스 근처엔 얼씬도 하지 마"라며 길을 열어 주었다.`));
      }
      return this.pursuitFail('"반으로 될 것 같아? 전부 내놔."');
    }
    if (kind === 'bribe') {
      const bribe = Math.round(PURSUIT.bribeBase * RANKS[GateRun.tier(c.gate)].mult);
      if (p.money < bribe) return;
      const ok = Math.random() < (pu.style === 'giant' ? 0.4 : 0.7);
      if (ok) { p.money -= bribe; c.run.pursuit = null; this.pursuitNotify('bribe', bribe); return this.renderGateMap(say(`<b>협상</b> · 뒷돈 ${fmt(bribe)} 크레딧을 받은 추격대가 못 본 척 돌아섰다.`)); }
      return this.pursuitFail(pu.style === 'giant' ? '"매수 시도까지 기록해 두지." 녹화 장비의 불빛이 깜빡인다.' : '"돈으로 될 일이 아니야."');
    }
    if (kind === 'apology') {
      const ok = Math.random() < 0.8;
      if (ok) {
        this.pursuitNotify('apology');
        c.run.pursuit = null;
        this.toast(`${G0.name || '길드'} 추격대에 사과하고 게이트를 나왔다.`);
        this.gateStub();
        return UI.handle('g-finish', 'retreat');
      }
      return this.pursuitFail('"이제 와서? 늦었어."');
    }
  },
  pursuitFail(line) {
    this.modal(`<div class="eyebrow">협상 결렬</div><p class="event-text">${fixJosa(line)}</p><div class="row end"><button class="danger" data-act="gp-fight">맞서 싸운다</button></div>`, 'event-box');
  },
  pursuitFight() {
    const c = this.ctx; const pu = c.run.pursuit; const G0 = GUILDS[pu.guild] || {};
    const team = pu.team || this.pursuitTeam();
    c.nodeKind = 'pvp'; c.pvp = { guild: pu.guild, rank: pu.rank || 0, style: pu.style };
    c.counted = true; // 사람과의 싸움이라 괴수 보상은 없다
    c.intro = pu.style === 'lawless' ? 'ambushed' : 'normal';
    c.combat = new Combat(G, { allies: this.allyUnits(), enemies: team, canFlee: false, title: `${G0.name || '길드'} 추격대와의 생사결` });
    c.elem = c.gate.elem;
    this.openCombat();
  },
});

{
  // 칸을 지날 때마다 추격대가 다가온다
  const baseEnter = UI.enterNode;
  UI.enterNode = function (key) {
    const c = this.ctx; const pu = c && c.run && c.run.pursuit;
    if (pu && pu.steps > 0) {
      pu.steps--;
      if (pu.steps <= 0) {
        // 그 칸으로 가는 길에 따라잡힌다 → 협상 뒤 칸 진행은 그대로 이어지도록 key 를 기억
        pu.pending = key; return this.pursuitCaught();
      }
    }
    return baseEnter.call(this, key);
  };
  // 층 지도에 추격대 표식과 거리
  const baseRender = UI.renderGateMap;
  UI.renderGateMap = function (note) {
    const r = baseRender.call(this, note);
    const c = this.ctx; const pu = c && c.run && c.run.pursuit; if (!pu) return r;
    const m = c.run.map; const box = document.querySelector('#modal .gmap'); if (!box) return r;
    const at = m.pos || [0, 0];
    const row = Math.max(0, at[0] - pu.steps); const nd = m.rows[row][0];
    const H = 100, PADB = 7, PADT = 8; const y = H - PADB - (row / Math.max(1, m.rows.length - 1)) * (H - PADB - PADT);
    box.insertAdjacentHTML('beforeend', `<div class="gtoken pursuer" style="left:${Math.min(92, (m.rows[at[0]][at[1]] || nd).x * 100 + 10)}%;top:${Math.min(97, y + 4)}%" title="추격대">⚔</div>`);
    const lg = document.querySelector('#modal .scout-line') || document.querySelector('#modal .gmap-legend');
    if (lg) lg.insertAdjacentHTML('afterend', `<div class="pursuit-line small"><b>${(GUILDS[pu.guild] || {}).name || '길드'} 추격대</b>가 쫓아온다 · <b>${pu.steps}칸</b> 뒤</div>`);
    return r;
  };
  // 결과 화면
  const baseResult = UI.combatResultHtml;
  UI.combatResultHtml = function () {
    const c = this.ctx;
    if (c && c.pvp && c.combat && c.combat.result) for (const k of c.combat.kills || []) k._paid = true; // 사람이라 코어·부산물 정산 없음
    if (c && c.pvp && c.combat && c.combat.result === 'win') {
      return `<div class="pvp-res win"><b>추격대를 물리쳤다</b><br> <span class="small">쓰러진 길드원들이 서로를 부축해 물러난다. 이 일은 금세 소문이 날 것이다. (악명 +${PURSUIT.infamyWin})</span></div>
        <div class="row end"><button class="primary" data-act="gp-won">지도로 · 공략 계속</button></div>`;
    }
    if (c && c.pvp && c.combat && c.combat.result && c.combat.result !== 'win') {
      return `<div class="pvp-res lose"><b>추격대에게 졌다</b><br> <span class="small">정신을 잃기 직전, 누군가 가방을 뒤지는 소리가 들렸다.</span></div>
        <div class="row end"><button class="danger" data-act="gp-lost">눈을 뜬다</button></div>`;
    }
    return baseResult.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      case 'gp-deal': return this.pursuitDeal(v);
      case 'gp-fight': return this.pursuitFight();
      case 'gp-won': {
        const p = G.player; let txt = '';
        if (G.guildChaseResult) txt = G.guildChaseResult(c.gate, (c.run.pursuit && c.run.pursuit.chase) || { guild: c.pvp && c.pvp.guild }, true) || '';
        else { p.infamy = (p.infamy || 0) + PURSUIT.infamyWin; this.pursuitNotify('win'); }
        const key = c.run.pursuit && c.run.pursuit.pending;
        c.run.pursuit = null; c.pvp = null; c.nodeKind = null;
        this.gateSync(); this.gateStub();
        if (key) return baseHandle.call(this, 'g-node', key);
        return this.renderGateMap(`<b>대인 전투</b> · ${fixJosa(txt || '추격대를 물리쳤다.')} 보스까지 가는 길이 열렸다.`);
      }
      case 'gp-lost': {
        const p = G.player; const pu = c.pvp || {};
        const lostM = c.loot.money, lostE = c.loot.ether;
        const chase = (c.run.pursuit && c.run.pursuit.chase) || { guild: pu.guild };
        c.loot.money = 0; c.loot.ether = 0; c.loot.list = []; c.loot.kills = 0; // 게이트 안 전리품은 빼앗긴다
        p.hp = 1; p.mp = 0;
        c.pvp = null; c.run.pursuit = null;
        if (G.guildChaseResult) {
          // 부상·돈·수명 같은 벌은 C가 정한다
          const txt = G.guildChaseResult(c.gate, chase, false) || '';
          this.toast(fixJosa(txt || '추격대에게 졌다.'));
          this.gateStub();
          return baseHandle.call(this, 'g-finish', 'retreat');
        }
        p.injured = Math.max(p.injured || 0, PURSUIT.injury); G.recalc && G.recalc();
        if (Math.random() < (PURSUIT.deathChance[pu.style] ?? PURSUIT.deathChance.normal)) {
          this.pursuitNotify('dead');
          return G.gameOver(`${(GUILDS[pu.guild] || {}).name || '길드'} 추격대와의 생사결에서 쓰러져, 게이트 안에서 돌아오지 못했다.`);
        }
        this.pursuitNotify('lose', lostM);
        this.toast(`전리품을 모두 빼앗겼다 (크레딧 ${fmt(lostM)} · 에테르 ${fmt(lostE)}). 큰 부상을 입었다.`);
        this.gateStub();
        return baseHandle.call(this, 'g-finish', 'retreat');
      }
    }
    return baseHandle.call(this, act, v);
  };
}
