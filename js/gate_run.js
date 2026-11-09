// ===== 게이트 크로니클: 게이트 내부 층 지도 =====
// 게이트에 들어가면 층마다 갈래길 지도가 펼쳐진다. 칸을 골라 나아가며 전투·정예·사건·휴식·보물을 만나고,
// 층 끝의 층 보스를 쓰러뜨리면 다음 층으로. 마지막 층 보스가 게이트 보스다.

const GNODE = {
  start: { name: '입구', desc: '게이트에 들어선 자리', color: '#46e0d0', svg: '<path d="M5 21V8a7 7 0 0 1 14 0v13"/><path d="M3 21h18"/><path d="M12 21v-6"/>' },
  fight: { name: '전투', desc: '괴수 무리', color: '#ff8a6c', svg: '<path d="M5 19 19 5M14 5h5v5M5 14l5 5M3 21l3-3"/>' },
  elite: { name: '정예', desc: '강한 괴수. 보상이 크다', color: '#ff4f6a', svg: '<path d="M12 3c-4 0-7 3-7 7 0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5 0-4-3-7-7-7z"/><circle cx="9.5" cy="10.5" r="1.4"/><circle cx="14.5" cy="10.5" r="1.4"/><path d="M10 21v-3M14 21v-3"/>' },
  event: { name: '사건', desc: '무슨 일이 일어날지 모른다', color: '#6fb8ff', svg: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4M12 18h.01"/>' },
  rest: { name: '휴식', desc: '에테르 샘. 숨을 고른다', color: '#7be0a0', svg: '<path d="M12 3c2 3 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-8z"/>' },
  treasure: { name: '보물', desc: '방치된 보급품이나 결정', color: '#ffd84d', svg: '<rect x="3" y="9" width="18" height="11" rx="1"/><path d="M3 13h18M12 11v4M5 9c0-3 3-5 7-5s7 2 7 5"/>' },
  boss: { name: '층 보스', desc: '이 층의 주인', color: '#c58cff', svg: '<path d="M3 18 5 7l4.5 5L12 5l2.5 7L19 7l2 11z"/><path d="M4 21h16"/>' },
};

// 게이트 안에서 만나는 사건. do(g, c) → 결과 문장. 전투로 이어지면 c.run.ambush 에 적을 넣는다.
const GATE_EVENTS = [
  { id: 'pack', title: '쓰러진 헌터의 배낭', text: '먼저 들어왔던 헌터의 것으로 보이는 배낭이 바위틈에 걸려 있다. 주인은 보이지 않는다.', choices: [
    { text: '배낭을 뒤진다', do: (g) => (g.roll(0.7) ? '쓸 만한 물건이 들어 있었다.' + g.gain({ item: ['potion', 1], money: 60 }) : '배낭 안에서 괴수 새끼가 튀어나왔다!' + GateRun.ambush(g, 1)) },
    { text: '인식표만 챙긴다', do: (g) => '협회에 돌려주기로 했다. 누군가는 기다리고 있을 테니까.' + g.gain({ merit: 3 }) },
  ] },
  { id: 'pool', title: '에테르 웅덩이', text: '푸른빛이 일렁이는 웅덩이. 짙은 에테르가 피부를 간질인다.', choices: [
    { text: '손을 담가 흡수한다', do: (g) => (g.roll(0.6) ? '에테르가 혈관을 타고 흘러든다.' + g.gain({ ether: 25 }) : '에테르가 역류했다! 속이 뒤집힌다.' + g.gain({ hp: -0.15, ether: 8 })) },
    { text: '물병에 담아 둔다', do: (g) => '조심스럽게 담았다. 나중에 정신력을 채우는 데 쓸 수 있겠다.' + g.gain({ item: ['mana', 1] }) },
  ] },
  { id: 'survivor', title: '갇힌 생존자', text: '무너진 기둥 아래서 신음 소리가 들린다. 주변에 괴수의 기척도 있다.', choices: [
    { text: '기둥을 치우고 구한다', do: (g) => (g.roll(0.55) ? '생존자를 끌어냈다. 그는 몇 번이고 고개를 숙였다.' + g.gain({ fame: 2, rep: 3 }) : '소리를 듣고 괴수들이 몰려왔다!' + GateRun.ambush(g, 2)) },
    { text: '위치만 표시해 둔다', do: () => '구조대가 오길 바라며 표식을 남겼다.' },
  ] },
  { id: 'altar', title: '수상한 제단', text: '괴수의 뼈로 쌓은 제단. 중앙의 홈에 붉은 결정이 박혀 있다.', choices: [
    { text: '피를 떨어뜨린다', do: (g) => (g.roll(0.45) ? '결정이 빛을 내며 손에 떨어졌다.' + g.gain({ hp: -0.2, relic: 1 }) : '제단이 피만 삼키고 잠잠하다.' + g.gain({ hp: -0.2, ether: 15 })) },
    { text: '결정을 부숴 버린다', do: (g) => '불길한 기운이 흩어졌다.' + g.gain({ ether: 10 }) },
  ] },
  { id: 'wall', title: '갈라진 벽', text: '벽 너머로 바람이 새어 나온다. 무너뜨리면 길이 날 것 같다.', choices: [
    { text: '벽을 무너뜨린다', do: (g) => (g.roll(0.6) ? '숨겨진 공간에 코어가 쌓여 있었다.' + g.gain({ core: [0, 2] }) : '벽 너머는 괴수의 둥지였다!' + GateRun.ambush(g, 2)) },
    { text: '그냥 지나간다', do: () => '괜한 위험은 피했다.' },
  ] },
  { id: 'trail', title: '다른 파티의 흔적', text: '발자국과 탄피. 다른 헌터 파티가 이 길로 지나간 것 같다.', choices: [
    { text: '흔적을 따라간다', do: (g) => (g.roll(0.5) ? '그들이 미처 챙기지 못한 전리품을 주웠다.' + g.gain({ money: 120 }) : '흔적 끝에는 그들을 덮친 괴수가 기다리고 있었다.' + GateRun.ambush(g, 2)) },
    { text: '다른 길을 고른다', do: () => '남의 길을 따라가지 않기로 했다.' },
  ] },
  { id: 'echo', title: '메아리', text: '어둠 속에서 누군가 당신의 이름을 부른다. 익숙한 목소리다.', choices: [
    { text: '대답한다', do: (g) => (g.roll(0.5) ? '목소리는 흩어지고, 마음 한구석이 따뜻해졌다.' + g.gain({ hp: 0.15 }) : '정신을 흔드는 환청이었다. 머리가 지끈거린다.' + GateRun.drainMp(g, 0.3)) },
    { text: '귀를 막고 지나간다', do: () => '목소리는 한참을 따라오다 사라졌다.' },
  ] },
  { id: 'crystal', title: '거대한 결정 기둥', text: '천장까지 닿는 에테르 결정 기둥. 캐내려면 시간이 걸린다.', choices: [
    { text: '시간을 들여 캐낸다', do: (g) => (g.roll(0.65) ? '결정 조각을 한 아름 캐냈다.' + g.gain({ ether: 20, money: 80 }) : '진동에 괴수가 깨어났다!' + GateRun.ambush(g, 1)) },
    { text: '조금만 떼어 간다', do: (g) => '손바닥만 한 조각을 챙겼다.' + g.gain({ ether: 8 }) },
  ] },
];

const GateRun = {
  tier(gate) { return gate.variant === 'misrank' ? gate.realTier : gate.tier; },
  floorsOf(gate) { if (gate.final) return 3; const t = this.tier(gate); return t <= 1 ? 1 : t <= 3 ? 2 : 3; },

  // 갈래길 지도: 행 4개 + 보스 행. 행마다 칸 2~4개, 가까운 칸끼리 이어진다.
  makeFloor(floor, floors) {
    const rows = [[{ t: 'start', x: 0.5, next: [] }]];
    const R = 4;
    for (let r = 0; r < R; r++) {
      const n = r === 0 ? RNG.int(2, 3) : RNG.int(2, 4);
      const row = [];
      for (let i = 0; i < n; i++) {
        let t;
        if (r === 0) t = RNG.weighted(['fight', 'event', 'treasure'], [60, 30, 10]);
        else if (r === R - 1) t = RNG.weighted(['rest', 'fight', 'event', 'treasure', 'elite'], [38, 24, 16, 10, 12]);
        else t = RNG.weighted(['fight', 'elite', 'event', 'rest', 'treasure'], [42, 14 + floor * 3, 22, 10, 10]);
        row.push({ t, x: (i + 0.5) / n, next: [] });
      }
      rows.push(row);
    }
    rows.push([{ t: 'boss', x: 0.5, next: [] }]);
    rows[0][0].next = rows[1].map((_, j) => j); // 입구에서 첫 갈림길 전부로
    // 연결
    for (let r = 1; r < rows.length - 1; r++) {
      const a = rows[r], b = rows[r + 1];
      const near = (x) => b.map((nd, j) => [Math.abs(nd.x - x), j]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
      for (const nd of a) { const o = near(nd.x); nd.next.push(o[0]); if (o[1] != null && RNG.chance(0.45) && Math.abs(b[o[1]].x - nd.x) < 0.45) nd.next.push(o[1]); }
      b.forEach((nd, j) => {
        if (a.some((p) => p.next.includes(j))) return;
        const from = a.map((p, i) => [Math.abs(p.x - nd.x), i]).sort((p, q) => p[0] - q[0])[0][1];
        a[from].next.push(j);
      });
      for (const nd of a) nd.next = [...new Set(nd.next)].sort((p, q) => p - q);
    }
    return { rows, pos: [0, 0], done: ['0:0'] };
  },

  enemies(c, kind) {
    const g = c.gate; const t = this.tier(g); const run = c.run;
    const deep = 1 + 0.12 * run.floor; // 깊을수록 단단해진다
    const list = [];
    if (kind === 'boss') {
      if (run.floor === run.floors - 1 && run.finalBoss) return run.finalBoss;
      const b = G.makeMonster(t, true, g.elem); b.name = b.name.replace('[보스]', `[${run.floor + 1}층 보스]`);
      b.hp = b.maxHp = Math.round(b.maxHp * 0.85); list.push(b);
      if (RNG.chance(0.5)) list.push(G.makeMonster(t, false, g.elem));
    } else if (kind === 'elite') {
      const e = G.makeMonster(t, false, g.elem); e.name = '[정예] ' + e.name;
      e.hp = e.maxHp = Math.round(e.maxHp * 2.2); e.atk = Math.round(e.atk * 1.25); e.def = Math.round(e.def * 1.2); e.elite = true;
      list.push(e); if (RNG.chance(0.5)) list.push(G.makeMonster(t, false, g.elem));
    } else {
      const cnt = kind === 'ambush1' ? 1 : kind === 'ambush2' ? 2 : RNG.int(1, 3);
      for (let k = 0; k < cnt; k++) list.push(G.makeMonster(t, false, g.elem));
    }
    for (const e of list) { e.hp = e.maxHp = Math.round(e.maxHp * deep); }
    return G.scaleForParty(list, t);
  },

  // 사건 중 습격 (다음 전투 예약)
  ambush(g, n) { const c = UI.ctx; if (c && c.run) c.run.ambush = n; return ' 전투 준비!'; },
  drainMp(g, f) { const p = g.player; const v = Math.round(p.maxMp * f); p.mp = Math.max(0, p.mp - v); return ` (정신력 -${v})`; },
};

Object.assign(UI, {
  gateRunInit() {
    const c = this.ctx; const g = c.gate;
    const floors = GateRun.floorsOf(g);
    c.run = { floors, floor: 0, map: GateRun.makeFloor(0, floors), finalBoss: c.rooms && c.rooms.length ? c.rooms[c.rooms.length - 1] : null, log: [] };
    c.rooms = []; c.roomIdx = 0;
    c.loot.list ||= [];
    // 전투 결과 화면 등에서 쓰는 체력·정신력 (게이트 안에서 이어진다)
    c.combat = { player: { hp: G.player.hp, mp: G.player.mp }, units: [], result: null, kills: [] };
    this.renderGateMap();
  },

  canLeaveGate() { const g = this.ctx.gate; return !g.final && g.variant !== 'red'; },
  reachable() {
    const run = this.ctx.run; const m = run.map;
    if (!m.pos) return m.rows[0].map((_, i) => [0, i]);
    const [r, i] = m.pos; if (r >= m.rows.length - 1) return [];
    return m.rows[r][i].next.map((j) => [r + 1, j]);
  },

  renderGateMap(note) {
    const c = this.ctx; const run = c.run; const m = run.map; const g = c.gate; const p = G.player;
    const reach = this.reachable().map(([r, i]) => r + ':' + i);
    const H = 100; const PADB = 7, PADT = 8; // 세로 % (아래 입구 ~ 위 보스)
    const y = (r) => H - PADB - (r / Math.max(1, m.rows.length - 1)) * (H - PADB - PADT);
    const lines = [];
    m.rows.forEach((row, r) => row.forEach((nd, i) => nd.next.forEach((j) => {
      const done = m.done.includes(r + ':' + i) && (m.done.includes(r + 1 + ':' + j) || reach.includes(r + 1 + ':' + j));
      lines.push(`<line x1="${nd.x * 100}" y1="${y(r)}" x2="${m.rows[r + 1][j].x * 100}" y2="${y(r + 1)}" class="${done ? 'on' : ''}"/>`);
    })));
    const nodes = [];
    m.rows.forEach((row, r) => row.forEach((nd, i) => {
      const k = r + ':' + i; const N = GNODE[nd.t];
      const st = m.done.includes(k) ? 'done' : reach.includes(k) ? 'can' : (m.pos && r <= m.pos[0]) ? 'past' : '';
      nodes.push(`<button class="gnode ${nd.t} ${st}" style="left:${nd.x * 100}%;top:${y(r)}%;--c:${N.color}" ${st === 'can' ? `data-act="g-node" data-v="${k}"` : 'disabled'} title="${N.name}">
        <svg viewBox="0 0 24 24" width="${nd.t === 'boss' ? 30 : 22}" height="${nd.t === 'boss' ? 30 : 22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${N.svg}</svg>
        ${st === 'can' ? `<span class="gnode-name">${N.name}</span>` : ''}</button>`);
    }));
    const legend = ['fight', 'elite', 'event', 'rest', 'treasure', 'boss'].map((t) => `<span class="gl" style="--c:${GNODE[t].color}"><i></i>${GNODE[t].name}</span>`).join('');
    this.modal(`<div class="cb-head gmap-head"><h3>${G.gateName(g)}</h3><span class="tag">${run.floor + 1}층 / ${run.floors}층</span>${this.canLeaveGate() ? '<button class="leave-btn" data-act="g-leave">철수</button>' : '<span class="tag bad no-leave">철수 불가</span>'}</div>
      <div class="gmap-stat row between small"><span>체력 <b class="num">${Math.round(p.hp)}/${p.maxHp}</b> · 정신력 <b class="num">${Math.round(p.mp)}/${p.maxMp}</b></span><span class="dim">전리품 <span class="num">${fmt(c.loot.money)}</span> 크레딧 · 에테르 <span class="num">${fmt(c.loot.ether)}</span></span></div>
      ${note ? `<div class="gmap-note">${fixJosa(note)}</div>` : ''}
      <div class="gmap-legend">${legend}</div>
      <div class="gmap gmap-fit" style="--rows:${m.rows.length}"><svg class="gmap-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none">${lines.join('')}</svg>${nodes.join('')}</div>
      <div class="small dim">맨 아래 입구에서 위로 나아갑니다. 빛나는 칸을 눌러 다음 길을 고르세요. 맨 위의 층 보스를 쓰러뜨리면 ${run.floor + 1 < run.floors ? '다음 층으로 내려갑니다' : '게이트가 닫힙니다'}.</div>
      <div class="row end"></div>`, 'combat-box gmap-box');
    const box = document.querySelector('#modal .gmap'); const cur = box && box.querySelector('.gnode.can');
    if (cur) cur.scrollIntoView({ block: 'center' });
  },

  enterNode(key) {
    const c = this.ctx; const m = c.run.map;
    if (!this.reachable().some(([r, i]) => r + ':' + i === key)) return;
    const [r, i] = key.split(':').map(Number); const nd = m.rows[r][i];
    m.pos = [r, i]; m.done.push(key);
    if (nd.t === 'fight' || nd.t === 'elite' || nd.t === 'boss') return this.gateFight(nd.t);
    if (nd.t === 'rest') return this.gateRest();
    if (nd.t === 'treasure') return this.gateTreasure();
    return this.gateEvent();
  },

  gateFight(kind) {
    const c = this.ctx; const run = c.run;
    const enemies = GateRun.enemies(c, kind);
    c.nodeKind = kind; c.counted = false;
    const label = kind === 'boss' ? (run.floor === run.floors - 1 ? '게이트 보스' : `${run.floor + 1}층 보스`) : kind === 'elite' ? '정예' : kind.startsWith('ambush') ? '습격' : '전투';
    c.combat = new Combat(G, { allies: this.allyUnits(), enemies, canFlee: this.canLeaveGate(), title: `${G.gateName(c.gate)} · ${run.floor + 1}층 ${label}` });
    c.elem = c.gate.elem;
    this.openCombat();
  },

  gateRest() {
    const c = this.ctx; const p = G.player;
    this.modal(`<div class="eyebrow">${c.run.floor + 1}층 · 휴식</div><h3>에테르 샘</h3>
      <p class="event-text">맑은 에테르가 솟는 샘. 괴수의 기척이 잦아든 틈에 숨을 고를 수 있다.</p>
      <div class="cards">
        <button class="choice-btn" data-act="g-rest" data-v="heal"><b>쉰다</b> <span class="small dim">체력 35% · 정신력 35% 회복</span></button>
        <button class="choice-btn" data-act="g-rest" data-v="train"><b>명상한다</b> <span class="small dim">에테르를 흡수한다 (회복은 조금)</span></button>
      </div>`, 'event-box');
  },
  gateTreasure() {
    const c = this.ctx; const t = GateRun.tier(c.gate);
    const r = RNG.next(); let text;
    if (r < 0.45) { const v = Math.round(120 * RANKS[t].mult * RNG.range(0.8, 1.3)); c.loot.money += v; text = `방치된 보급 상자에서 ${fmt(v)} 크레딧어치 물자를 챙겼다.`; }
    else if (r < 0.75) { const v = Math.round(10 * RANKS[t].mult ** 1.1 * RNG.range(0.8, 1.3)); c.loot.ether += v; text = `벽에 박힌 에테르 결정을 캐냈다. (에테르 +${v})`; }
    else if (r < 0.92) text = '구급 상자를 찾았다.' + G.gain({ item: ['potion', 1], hp: 0.1 });
    else text = '오래된 유물이 잠들어 있었다.' + G.gain({ relic: 1 });
    this.renderGateMap(`<b>보물</b> · ${text}`);
  },
  gateEvent() {
    const c = this.ctx;
    const ev = RNG.pick(GATE_EVENTS.filter((e) => !(c.run.seen || []).includes(e.id))) || RNG.pick(GATE_EVENTS);
    (c.run.seen ||= []).push(ev.id); c.run.ev = ev;
    this.modal(`<div class="eyebrow">${c.run.floor + 1}층 · 사건</div><h3>${ev.title}</h3><p class="event-text">${ev.text}</p>
      <div class="cards">${ev.choices.map((ch, i) => `<button class="choice-btn" data-act="g-ev" data-v="${i}">${ch.text}</button>`).join('')}</div>`, 'event-box');
  },

  // 전투가 끝난 뒤 지도로 돌아가거나 다음 층·클리어
  gateWinHtml() {
    const c = this.ctx; const cb = c.combat; const run = c.run;
    if (!c.counted) {
      c.counted = true;
      for (const k of cb.kills) { const r = G.monsterReward(k); const mul = k.elite ? 2.5 : 1; c.loot.money += Math.round(r.money * mul); c.loot.ether += Math.round(r.ether * mul); c.loot.kills++; c.loot.list.push(k); }
    }
    const boss = c.nodeKind === 'boss';
    const lastFloor = run.floor === run.floors - 1;
    const sum = `<div class="result win"><b>${boss ? (lastFloor ? '게이트 보스 격파' : `${run.floor + 1}층 보스 격파`) : '제압'}</b> <span class="small">누적 <span class="num">${fmt(c.loot.money)}</span> 크레딧 · 에테르 <span class="num">${fmt(c.loot.ether)}</span></span></div>`;
    if (c.inHidden) return `${sum}<div class="row end"><button class="primary" data-act="g-finish" data-v="clear">게이트 클리어</button></div>`;
    if (boss && lastFloor) {
      const hiddenNow = c.hidden && !c.inHidden;
      return `${sum}${hiddenNow ? '<p class="small amber">보스가 쓰러진 자리 뒤로 숨겨진 통로가 열렸다. 이중 던전이다. 더 강한 기척이 느껴진다.</p>' : ''}
        <div class="row end"><button class="${hiddenNow ? 'ghost' : 'primary'}" data-act="g-finish" data-v="clear">게이트 클리어</button>${hiddenNow ? '<button class="primary" data-act="g-hidden">숨겨진 구역으로</button>' : ''}</div>`;
    }
    if (boss) return `${sum}<p class="small dim">아래로 이어지는 균열이 열렸다. 내려가기 전에 잠시 숨을 고른다. (체력·정신력 15% 회복)</p>
      <div class="row end">${this.canLeaveGate() ? '<button class="ghost" data-act="g-finish" data-v="retreat">철수 · 보상 챙기기</button>' : ''}<button class="primary" data-act="g-floor">${run.floor + 2}층으로</button></div>`;
    return `${sum}<div class="row end"><button class="primary" data-act="g-map">지도로</button></div>`;
  },
  gateSync() { // 전투 뒤 체력·정신력을 이어 간다
    const c = this.ctx; const cb = c.combat; const p = G.player;
    if (cb && cb.player) { p.hp = Math.max(1, cb.player.hp); p.mp = Math.max(0, cb.player.mp); }
  },
  gateStub() { const p = G.player; const c = this.ctx; c.combat = { player: { hp: p.hp, mp: p.mp }, units: (c.combat && c.combat.units) || [], result: null, kills: [] }; },
});

{
  const baseStartRoom = UI.startRoom;
  UI.startRoom = function () {
    const c = this.ctx;
    if (c && c.kind === 'gate' && !c.run && !c.noRun) return this.gateRunInit();
    return baseStartRoom.call(this);
  };
  const baseResult = UI.combatResultHtml;
  UI.combatResultHtml = function () {
    const c = this.ctx;
    if (c && c.kind === 'gate' && c.run && c.combat.result === 'win') return this.gateWinHtml();
    return baseResult.call(this);
  };
  const baseOpen = UI.openCombat;
  UI.openCombat = function () {
    baseOpen.call(this);
    const c = this.ctx;
    if (c && c.kind === 'gate' && c.run) { const d = document.querySelector('#modal .room-dots'); if (d) d.outerHTML = `<span class="tag">${c.run.floor + 1}층 / ${c.run.floors}층</span>`; }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      case 'g-node': return this.enterNode(v);
      case 'g-map': this.gateSync(); this.gateStub(); return this.renderGateMap();
      case 'g-floor': {
        this.gateSync(); const p = G.player;
        p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.15)); p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.15));
        c.run.floor++; c.run.map = GateRun.makeFloor(c.run.floor, c.run.floors); this.gateStub();
        return this.renderGateMap(`<b>${c.run.floor + 1}층</b> · 공기가 더 무거워졌다. 괴수들도 단단해진다.`);
      }
      case 'g-leave': this.gateStub(); return baseHandle.call(this, 'g-finish', 'retreat');
      case 'g-rest': {
        const p = G.player; let text;
        if (v === 'heal') { p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35)); p.mp = Math.min(p.maxMp, p.mp + Math.round(p.maxMp * 0.35)); text = '샘가에 등을 기대고 눈을 붙였다. 몸이 한결 가볍다.'; }
        else { p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.1)); const e = Math.round(8 * RANKS[GateRun.tier(c.gate)].mult ** 1.1); c.loot.ether += e; text = `샘의 에테르를 끌어들였다. (에테르 +${e})`; }
        this.gateStub(); return this.renderGateMap(`<b>휴식</b> · ${text}`);
      }
      case 'g-ev': {
        const ev = c.run.ev; const ch = ev && ev.choices[+v]; if (!ch) return;
        c.run.ambush = 0;
        const res = ch.do(G, c);
        this.gateStub();
        if (c.run.ambush) {
          const n = c.run.ambush; c.run.ambush = 0;
          this.modal(`<div class="eyebrow">${ev.title}</div><p class="event-text">${fixJosa(res)}</p><div class="row end"><button class="danger" data-act="g-ambush" data-v="${n}">맞서 싸운다</button></div>`, 'event-box');
          return;
        }
        return this.renderGateMap(`<b>${ev.title}</b> · ${res}`);
      }
      case 'g-ambush': return this.gateFight('ambush' + v);
      case 'g-hidden': {
        if (!c || !c.run) break;
        this.gateSync();
        const g = c.gate; const t = Math.min(7, (g.realTier ?? g.tier) + 1);
        const boss = G.makeMonster(t, true, g.elem); boss.name = boss.name.replace('[보스]', '[숨은 보스]');
        c.inHidden = true; c.loot.hidden = true; c.nodeKind = 'boss'; c.counted = false;
        c.combat = new Combat(G, { allies: this.allyUnits(), enemies: G.scaleForParty([boss, G.makeMonster(t, false, g.elem)], t), canFlee: false, title: `${G.gateName(g)} · 숨겨진 구역` });
        return this.openCombat();
      }
    }
    return baseHandle.call(this, act, v);
  };
}
