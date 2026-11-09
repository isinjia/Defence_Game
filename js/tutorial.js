// ===== 게이트 크로니클: 헌터 자격 시험 (튜토리얼) =====
// 프롤로그(또는 직접 생성)가 끝난 뒤, 협회 실기 시험에서 임시 파티로 첫 전투를 치르며 조작을 배운다.

const EXAM_ROLE_POOL = {
  tank: ['guardian', 'paladin'],
  heal: ['healer', 'priest', 'shaman'],
  melee: ['swordsman', 'lancer', 'monk', 'berserker'],
  ranged: ['archer', 'gunslinger', 'sniper'],
  caster: ['elementalist', 'telekinetic', 'taoist'],
  shadow: ['assassin', 'thief'],
};

// 시험이 끝나면 협회가 각성 등급을 측정해 알려 준다. 대부분 F급이지만 아닐 수도 있다
const EXAM_RANK_TEXT = [
  '측정관이 화면을 돌려 보여 준다. "F급. 대부분 여기서 시작합니다. 실망할 것 없어요. S급도 처음엔 다 F였으니까."',
  '측정관이 눈썹을 올린다. "E급이네요. 신규 각성자 중엔 위쪽입니다." 대기실의 동기들이 수군거린다.',
  '측정기가 두 번 울린다. 측정관이 기록을 다시 확인하고 자리에서 일어난다. "D급. 신규 등록으로 D급은 이 지부에서 올해 처음입니다."',
  '측정실 문이 열리고 협회 지부장이 직접 들어온다. "C급 신인이라… 오늘 오후부터 길드들 전화가 빗발칠 겁니다. 몸조심하세요. 좋은 뜻으로든 나쁜 뜻으로든."',
  '측정기 화면이 붉게 깜빡인다. 아무도 말을 하지 않는다. 지부장이 누군가에게 전화를 건다. "본부죠? B급입니다. 신규 각성자가요. 네, 지금 당장요."',
];
Object.assign(Game.prototype, {
  revealAwakenRank() {
    const p = this.player; if (p.rankRevealed) return null;
    p.rankRevealed = true;
    const r = Math.max(0, Math.min(4, p.awakenRank || 0));
    if (r > p.rankIdx) { p.rankIdx = r; p.stage = 0; this.recalc(); p.hp = p.maxHp; p.mp = p.maxMp; }
    const fame = [0, 2, 6, 15, 30][r];
    if (fame) p.fame += fame;
    if (r >= 3) this.rumor(`${regionById(p.region).name}에서 ${RANKS[r].key}급 신규 각성자 ${p.name}이(가) 나왔다는 소식에 길드들이 술렁인다.`);
    this.lifeEvent(`협회 측정 결과 ${RANKS[r].key}급 각성자로 등록되었다.`);
    return { rank: r, text: EXAM_RANK_TEXT[r] + (fame ? ` (명성 +${fame})` : '') };
  },
});

Object.assign(UI, {
  // 플레이어 역할에 맞춰 빈 자리를 채우는 임시 파티 3명
  examRoles() {
    const role = (classById(G.player.cls) || {}).role;
    if (role === 'tank') return ['heal', 'melee', 'caster'];
    if (role === 'support') return ['tank', 'melee', 'caster'];
    if (role === 'caster' || role === 'esper' || role === 'summoner') return ['tank', 'heal', 'melee'];
    if (role === 'ranged') return ['tank', 'heal', 'shadow'];
    return ['tank', 'heal', 'ranged'];
  },
  makeExamParty() {
    const p = G.player; const used = new Set([p.cls]);
    const pers = ['kind', 'just', 'warlike', 'cold'].sort(() => RNG.next() - 0.5);
    return this.examRoles().map((role, i) => {
      const n = G.makeNpc(true, RNG.chance(0.75) ? 'human' : undefined);
      const pool = EXAM_ROLE_POOL[role].filter((id) => !used.has(id) && classById(id));
      n.cls = RNG.pick(pool.length ? pool : EXAM_ROLE_POOL[role]); used.add(n.cls);
      n.rankIdx = 0; n.stage = RNG.int(0, 1); n.region = p.region; n.met = true; n.relation = 30;
      n.ageMonths = p.ageMonths + RNG.int(-24, 30); n.guild = null; n.examMate = true;
      n.personality = pers[i % pers.length];
      G.npcs.push(n);
      return n.id;
    });
  },

  // 시험 파티를 이끄는 선임 각성자 (협회 소속 교관). 시험이 끝나도 인연으로 남는다
  makeExamLeader() {
    const p = G.player; const n = G.makeNpc(false, 'human');
    n.rankIdx = 3; n.stage = 1; n.region = p.region; n.met = true; n.relation = 25; n.guild = 'kama'; n.examLeader = true;
    n.personality = RNG.pick(['just', 'kind', 'cold']); n.cls = RNG.pick(['guardian', 'paladin', 'swordsman', 'lancer']);
    n.ageMonths = RNG.int(34, 46) * 12; n.lifespan = Math.max(n.lifespan, 80);
    n.links = {}; n.disciples = []; n.parents = [];
    G.npcs.push(n); return n.id;
  },
  examLeader() { return this.exam && G.npcById(this.exam.leader); },
  // 리더의 말투: 성격에 따라 조금씩 다르다
  leadSay(key) {
    const L = this.examLeader(); const pers = L ? L.personality : 'just';
    const T = {
      brief: { just: '오늘 너희 임시 파티 리더를 맡은 선임이다. 게이트는 문 열자마자 싸우는 곳이 아니야. 먼저 살피고, 고르고, 그다음에 싸운다. 순서 틀리면 죽는다.', kind: '오늘 여러분을 이끌 선임이에요. 긴장되죠? 저도 처음엔 그랬어요. 게이트는 들어가자마자 싸우는 곳이 아니에요. 먼저 둘러보고, 판단하고, 그다음에 싸워요.', cold: '리더다. 말은 한 번만 한다. 게이트에선 먼저 본다. 고른다. 그다음에 싸운다. 이상.' },
      ex1: { just: '갈림길이다. 탐색에선 고른 행동이 다음 전투를 바꾼다. 정찰하면 적이 약해지고, 욕심내면 적이 늘어난다. 정답은 없어. 결과를 감당하는 게 헌터다.', kind: '갈림길이네요. 여기서 고르는 길에 따라 다음 싸움이 쉬워지기도, 어려워지기도 해요. 정찰은 안전하게, 욕심은 보상을, 대신 대가가 있어요.', cold: '갈림길. 고른 길이 다음 전투를 바꾼다. 정찰, 욕심, 우회. 골라.' },
      ex1after: { just: '좋아. 이제 진짜 전투다. 동료들은 각자 알아서 싸운다. 넌 네 차례에만 집중해.', kind: '잘했어요. 이제 싸움이에요. 동료들은 알아서 움직이니까, 자기 차례만 챙기면 돼요.', cold: '됐다. 전투 준비.' },
      ex2: { just: '보급 상자다. 게이트 안의 상자는 반은 선물, 반은 함정이야. 열기 전에 확인하는 방법도 있다. 그리고 이 앞이 보스 구역이다.', kind: '상자가 있네요. 게이트 상자는 반쯤은 함정이에요. 돌을 던져 보는 것도 방법이고요. 이 앞이 보스예요.', cold: '상자. 절반은 함정. 이 앞이 보스.' },
      ex2after: { just: '보스는 체력이 많고 한 방이 세다. 막는 사람이 끌고, 치는 사람이 약점을 노린다. 위험하면 회복약을 아끼지 마.', kind: '보스는 오래 버티고 세게 때려요. 무리하지 말고, 위험하면 회복약 꼭 쓰세요.', cold: '보스는 세다. 아프면 약 먹어. 죽지 마.' },
      boss: { just: '보스다. 속성 상성을 봐라. 상성이면 피해가 크게 들어간다.', kind: '보스예요! 속성 상성을 노려 보세요. 잘 맞으면 훨씬 아프게 들어가요.', cold: '상성 노려.' },
      win: { just: '"수고했다. 처음치곤 나쁘지 않았어. 밖에선 내가 없다. 오늘 한 순서, 잊지 마라."', kind: '"다들 정말 잘했어요. 오늘 순서대로만 하면 쉽게 안 죽어요. 무슨 일 있으면 연락해요."', cold: '"합격. …살아서 또 보자."' },
      lose: { just: '"내가 끼어든 건 이번이 마지막이다. 밖에서는 아무도 대신 안 싸워 준다."', kind: '"괜찮아요, 다들 처음이니까. 그래도 밖에서는 제가 없어요. 꼭 기억해요."', cold: '"구해 주는 건 오늘뿐이다."' },
    };
    return (T[key] || {})[pers] || (T[key] || {}).just || '';
  },
  examGateCtx(stage) {
    const ex = this.exam;
    return { kind: 'exam-explore', gate: ex.gate, rooms: ex.rooms, roomIdx: stage, loot: ex.loot };
  },
  examExplore(stage) {
    const L = this.examLeader(); const ex = this.exam; ex.stage = stage;
    this.ctx = this.examGateCtx(stage);
    const node = stage === 0 ? EXPLORE_NODES.find((n) => n.id === 'fork') : EXPLORE_NODES.find((n) => n.id === 'chest');
    this.showExplore(node, { lead: this.leadSay(stage === 0 ? 'ex1' : 'ex2'), leadName: L ? `선임 ${L.name} · 리더` : '리더', after: this.leadSay(stage === 0 ? 'ex1after' : 'ex2after'), goLabel: stage === 0 ? '첫 구역으로' : '보스 구역으로', then: () => this.startExamFight(stage) });
  },

  startExam() {
    const p = G.player;
    const ids = this.makeExamParty();
    const leader = this.makeExamLeader();
    const gate = { id: -1, tier: 0, theme: '협회 훈련용 게이트', elem: RNG.pick(ELEMENT_KEYS) };
    this.exam = { ids, leader, gate, loot: { money: 0, ether: 0, kills: 0 }, stage: 0 };
    this.exam.rooms = [this.examEnemies(false), this.examEnemies(true)];
    const mates = ids.map((id) => G.npcById(id)); const L = G.npcById(leader);
    this.screen = 'game'; this.render();
    this.modal(`<div class="eyebrow">${G.dateStr()} · ${G.region().name} · 헌터 협회 시험장</div><h3>헌터 자격 시험</h3>
      <p class="event-text">각성자 등록을 마친 ${p.name}에게 협회가 실기 시험 통지서를 보냈다. 시험장 로비에는 오늘 처음 각성한 사람들이 긴장한 얼굴로 앉아 있다.</p>
      <p class="event-text">시험관: "실기는 임시 파티 단위로 본다. 협회 훈련용 게이트를 끝까지 통과하면 합격이다. 각 파티엔 협회 소속 선임 각성자가 리더로 붙는다."</p>
      <div class="sec-title sec">파티 리더</div>
      <div class="cards"><div class="item-row">${this.npcAvatar(L, 48)}<div class="grow"><b>${L.name}</b> <span class="small dim">헌터 협회 소속 교관 · 선임 각성자</span>
        <div>${this.rankTag(L.rankIdx, L.stage)} <span class="tag cls tiny" style="--c:${groupColor(classById(L.cls).g)}">${className(L.cls)}</span> <span class="small dim">${persById(L.personality).name}한 성격</span></div>
        <div class="small">"${this.leadSay('brief')}"</div></div></div></div>
      <div class="sec-title sec">배정된 임시 파티</div>
      <div class="cards">${mates.map((n) => `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${this.raceTag(n)}
        <div><span class="tag cls tiny" style="--c:${groupColor(classById(n.cls).g)}">${className(n.cls)}</span> <span class="small dim">${persById(n.personality).name}한 성격</span></div></div></div>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="exam-skip">튜토리얼 건너뛰기</button><button class="primary" data-act="exam-go">시험장으로</button></div>`, 'event-box');
  },

  examEnemies(boss) {
    const list = boss ? [G.makeMonster(0, true), G.makeMonster(0, false)] : [G.makeMonster(0, false), G.makeMonster(0, false), G.makeMonster(0, false)];
    if (boss) list[0].name = '[시험용] ' + list[0].name.replace(/^\[[^\]]*\] /, '');
    for (const e of list) { e.maxHp = e.hp = Math.round(e.hp * (boss ? 1.5 : 1.2)); }
    return list;
  },
  startExamFight(stage = 0) {
    const ex = this.exam; if (!ex) return;
    ex.stage = stage;
    const L = this.examLeader();
    // 리더는 시험이므로 힘을 아끼고 막는 역할만 한다 (신규 각성자 수준으로 싸운다)
    const lu = L ? G.npcUnit({ ...L, rankIdx: 0, stage: 1 }, 'ally') : null;
    if (lu) { lu.name = `${L.name}(리더)`; lu.npcId = L.id; }
    const allies = [G.playerUnit(), ...(lu ? [lu] : []), ...ex.ids.map((id) => G.npcUnit(G.npcById(id), 'ally'))];
    this.ctx = { kind: 'exam', tutorial: stage === 0 ? { acted: 0 } : { acted: 0, boss: true }, elem: ex.gate.elem, combat: new Combat(G, { allies, enemies: ex.rooms[stage], canFlee: false, spar: true, title: `헌터 자격 시험 · ${stage === 0 ? '첫 구역' : '보스 구역'}` }) };
    this.openCombat();
  },

  // 전투 화면 위에 띄우는 조작 안내
  coachHtml() {
    const c = this.ctx; if (!c || !c.tutorial || c.combat.result) return '';
    const cb = c.combat; const t = c.tutorial;
    let step, text;
    const L = this.examLeader(); const who = L ? `선임 ${L.name}` : '리더';
    if (t.boss) return t.acted >= 2 ? '' : `<div class="coach"><span class="eyebrow">${who}</span><div>${this.leadSay('boss')}</div></div>`;
    if (t.acted >= 3) return '';
    if (t.acted >= 1) {
      step = '조작 안내 3/3';
      text = '잘했습니다! <b>회복약</b>으로 체력을 채울 수 있고, <b>배속</b> 버튼으로 전투 속도를, <b>자동 전투</b>로 내 행동까지 AI에게 맡길 수 있습니다. 이제 자유롭게 싸워 보세요.';
    } else if (!cb.waiting) {
      step = '조작 안내 1/3';
      text = '각 캐릭터 아래의 <b>파란 게이지</b>가 속도에 따라 찹니다. 가득 차면 그 캐릭터가 행동합니다. 동료는 각자의 <b>성격대로 AI</b>가 싸웁니다. 내 게이지가 차기를 기다리세요.';
    } else if (!c.sel) {
      step = '조작 안내 2/3';
      text = '<b>내 차례!</b> 시간이 멈췄습니다. 아래 <b>스킬 버튼</b>을 누르면 어떤 스킬인지 설명이 뜹니다.';
    } else {
      step = '조작 안내 2/3';
      const aim = SKILL_AIM[skillById(c.sel).type] || 'none';
      text = aim === 'enemy' ? '설명을 확인했으면 위쪽의 <b>적을 눌러</b> 발동하세요. 대상을 누르는 순간 스킬이 나갑니다.' : aim === 'ally' ? '회복할 <b>아군 카드를 눌러</b> 발동하세요.' : '대상이 필요 없는 스킬입니다. <b>[사용]</b>을 누르면 발동합니다.';
    }
    return `<div class="coach"><span class="eyebrow">${who} · ${step}</span><div>${text}</div></div>`;
  },

  finishExam() {
    const c = this.ctx; const cb = c.combat; const ex = this.exam;
    this.ctx = null; this.closeModal();
    if (ex.stage === 0) {
      const p = G.player; p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.7)); p.mp = Math.max(p.mp, Math.round(p.maxMp * 0.6));
      ex.firstWin = cb.result === 'win';
      return this.examExplore(1);
    }
    if (ex.loot.money) G.player.money += ex.loot.money;
    const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    const win = cb.result === 'win';
    for (const n of mates) G.changeRel(n, win ? 22 : 12);
    G.player.hp = G.player.maxHp; G.player.mp = G.player.maxMp;
    G.lifeEvent(win ? '헌터 자격 시험에 합격했다.' : '시험관의 개입으로 간신히 헌터 자격 시험을 통과했다.');
    ex.reveal = G.revealAwakenRank();
    ex.pick = new Set(ex.ids);
    const L = this.examLeader();
    if (L) { G.changeRel(L, win ? 15 : 8); L.met = true; }
    ex.text = win
      ? `마지막 괴수가 쓰러지자 훈련용 게이트가 닫혔다. ${L ? `${L.name}이(가) 무기를 거두며 말한다. ${this.leadSay('win')}` : '시험관이 고개를 끄덕였다.'} 시험관이 기록판에 합격 도장을 찍었다.`
      : `파티가 밀리자 ${L ? L.name : '시험관'}이(가) 봉인을 풀고 앞으로 나섰다. 보스가 한 번에 갈라졌다. ${L ? this.leadSay('lose') : ''} 합격은 합격이다.`;
    this.renderExamEnd();
  },
  renderExamEnd() {
    const ex = this.exam; const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    const R = RANKS[G.player.rankIdx];
    this.modal(`<div class="eyebrow">헌터 자격 시험 · 결과</div><h3><span class="tag rank" style="--c:${R.color}">${R.key}급</span> 헌터 자격증 발급</h3>
      <p class="event-text">${fixJosa(ex.text)}</p>
      ${ex.reveal ? `<div class="sec-title sec">협회 등급 측정</div><p class="event-text">${fixJosa(ex.reveal.text)}</p>` : ''}
      <p class="event-text">시험장을 나서자 임시 파티원들이 당신을 바라본다. "…우리, 이대로 같이 다녀 볼래?"</p>
      <div class="sec-title sec">함께할 동료를 고르세요 <span class="small dim">(눌러서 선택·해제)</span></div>
      <div class="cards">${mates.map((n) => `<button class="item-row choice-btn ${ex.pick.has(n.id) ? 'on' : ''}" data-act="exam-pick" data-v="${n.id}">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b>
        <div><span class="tag cls tiny" style="--c:${groupColor(classById(n.cls).g)}">${className(n.cls)}</span> <span class="small dim">${persById(n.personality).name}</span></div></div><b class="${ex.pick.has(n.id) ? 'amber' : 'dim'}">${ex.pick.has(n.id) ? '함께' : '각자'}</b></button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="exam-solo">혼자 시작한다</button><button class="primary" data-act="exam-party" ${ex.pick.size ? '' : 'disabled'}>${ex.pick.size === mates.length ? '이 파티로 시작한다' : `${ex.pick.size}명과 시작한다`}</button></div>`, 'event-box');
  },
  endExam(ids) {
    const p = G.player; const ex = this.exam || { ids: [] };
    const joined = [];
    for (const id of ex.ids) {
      const n = G.npcById(id); if (!n) continue;
      if (ids.includes(id) && G.party().length < 4) { n.isCompanion = true; (p.party ||= []).push(n.id); n.region = p.region; n.relation = Math.max(n.relation, 55); joined.push(n.name); }
    }
    this.exam = null;
    if (joined.length) G.lifeEvent(`시험 동기 ${joined.join(', ')}와(과) 파티를 결성했다.`);
    G.save();
    this.closeModal(); this.renderGame();
    const friend = G.npcs.find((n) => n.friendhood && n.alive);
    this.modal(`<div class="ending">${UI.playerPortrait(160)}<div class="eyebrow">${G.dateStr()} · ${G.region().name}</div><h2>헌터 ${p.name}</h2></div>
      <p>${className(p.cls)} · ${ELEMENTS[p.element].name} 속성 · ${RANKS[p.rankIdx].key}급. ${joined.length ? `${joined.join(', ')}와(과) 함께 첫발을 내딛는다.` : '당분간은 혼자다. 시험 동기들은 인물 창에서 다시 만날 수 있다.'}</p>
      <p class="dim">지도에서 빛나는 칸을 눌러 걸어 다니고, 도시에 들어가 의뢰를 받으며 살아가십시오. 정해진 길은 없습니다.${friend ? ` 소꿉친구 ${friend.name}은(는) ${(REGIONS.find((r) => r.id === friend.region) || G.region()).name}에 있습니다.` : ''}</p>
      <div class="row end"><button class="primary" data-act="modal-close">시작</button></div>`);
  },
});

{
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    baseControls.call(this);
    const c = this.ctx; if (!c || !c.tutorial) return;
    const box = document.getElementById('cb-ctrl'); if (!box) return;
    const html = this.coachHtml();
    if (html) box.insertAdjacentHTML('afterbegin', fixJosa(html));
    const sk = box.querySelector('.skill-btns'); if (sk) sk.classList.toggle('tut-glow', c.combat.waiting && !c.playing && !c.sel && c.tutorial.acted < 1);
  };
  const baseFinish = UI.finishPersonalCombat;
  UI.finishPersonalCombat = function () {
    if (this.ctx && this.ctx.kind === 'exam') return this.finishExam();
    return baseFinish.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      // 생성이 끝나면 곧바로 헌터 시험으로
      case 'c-start': case 'pro-begin': {
        const r = baseHandle.call(this, act, v);
        if (this.screen === 'game' && G.player && !G.player.examDone) { G.player.examDone = true; this.closeModal(); this.startExam(); }
        return r;
      }
      case 'exam-go': this.closeModal(); return this.examExplore(0);
      case 'exam-skip': this.exam.pick = new Set(this.exam.ids); this.exam.text = '실기 시험은 무난히 끝났다. 시험관이 기록판에 합격 도장을 찍었다.'; G.lifeEvent('헌터 자격 시험에 합격했다.'); this.exam.reveal = G.revealAwakenRank(); return this.renderExamEnd();
      case 'exam-pick': { const ex = this.exam; const id = +v; if (ex.pick.has(id)) ex.pick.delete(id); else ex.pick.add(id); return this.renderExamEnd(); }
      case 'exam-party': return this.endExam([...this.exam.pick]);
      case 'exam-solo': return this.endExam([]);
      case 'c-item':
        if (c && c.tutorial && !c.playing && c.combat.waiting) c.tutorial.acted++;
        return baseHandle.call(this, act, v);
      default: return baseHandle.call(this, act, v);
    }
  };
}
