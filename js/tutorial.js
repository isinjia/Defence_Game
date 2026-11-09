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

  // 시험 파티를 이끄는 선임 각성자 (협회가 위촉한 현역 헌터, 소속은 aff_flow.js가 정한다). 시험이 끝나도 인연으로 남는다
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
      ex1after: { just: '좋아. 이제 진짜 전투다. 동료들은 각자 알아서 싸운다. 넌 네 몫만 해.', kind: '잘했어요. 이제 싸움이에요. 동료들은 알아서 움직이니까, 자기 몫만 챙기면 돼요.', cold: '됐다. 전투 준비.' },
      ex2: { just: '보급 상자다. 게이트 안의 상자는 반은 선물, 반은 함정이야. 열기 전에 확인하는 방법도 있다. 그리고 이 앞이 보스 구역이다.', kind: '상자가 있네요. 게이트 상자는 반쯤은 함정이에요. 돌을 던져 보는 것도 방법이고요. 이 앞이 보스예요.', cold: '상자. 절반은 함정. 이 앞이 보스.' },
      ex2after: { just: '보스는 체력이 많고 한 방이 세다. 막는 사람이 끌고, 치는 사람이 약점을 노린다. 위험하면 회복약을 아끼지 마.', kind: '보스는 오래 버티고 세게 때려요. 무리하지 말고, 위험하면 회복약 꼭 쓰세요.', cold: '보스는 세다. 아프면 약 먹어. 죽지 마.' },
      // 전투 중 리더의 말 (세계 안의 말만 한다. 조작 방법은 따로 작은 글씨로 붙인다)
      gauge: { just: '다들 움직이는 속도가 달라. 빠른 놈이 먼저 친다. 동료들은 알아서 싸우니까 넌 네 몫만 해.', kind: '사람마다 움직이는 속도가 달라요. 빠른 쪽이 먼저 쳐요. 동료들은 알아서 싸우니까 {name} 씨는 자기 몫만 챙겨요.', cold: '빠른 놈이 먼저 친다. 네 몫만 해.' },
      turn: { just: '{name}, 지금이다. 서두르지 말고 판단해.', kind: '{name} 씨, 지금이에요. 침착하게요.', cold: '지금.' },
      aimEnemy: { just: '어느 놈부터 칠지 정해.', kind: '누구부터 노릴지 정해요.', cold: '골라.' },
      aimAlly: { just: '누굴 돌볼 거야?', kind: '누굴 도와줄 거예요?', cold: '누구.' },
      aimNone: { just: '그건 겨눌 필요 없는 기술이다. 바로 써.', kind: '그건 겨누지 않아도 되는 기술이에요. 바로 써요.', cold: '바로 써.' },
      done: { just: '좋아. 다치면 바로 약 먹고, 버거우면 막으면서 버텨. 무리하지 마.', kind: '잘했어요! 아프면 바로 약 먹고, 힘들면 막으면서 버텨요.', cold: '됐다. 아프면 약. 버거우면 막아.' },
      boss: { just: '보스다. 속성 상성을 봐라. 상성이면 피해가 크게 들어간다.', kind: '보스예요! 속성 상성을 노려 보세요. 잘 맞으면 훨씬 아프게 들어가요.', cold: '상성 노려.' },
      win: { just: '"수고했다. 처음치곤 나쁘지 않았어. 밖에선 내가 없다. 오늘 한 순서, 잊지 마라."', kind: '"다들 정말 잘했어요. 오늘 순서대로만 하면 쉽게 안 죽어요. 무슨 일 있으면 연락해요."', cold: '"합격. …살아서 또 보자."' },
      lose: { just: '"내가 끼어든 건 이번이 마지막이다. 밖에서는 아무도 대신 안 싸워 준다."', kind: '"괜찮아요, 다들 처음이니까. 그래도 밖에서는 제가 없어요. 꼭 기억해요."', cold: '"구해 주는 건 오늘뿐이다."' },
    };
    return ((T[key] || {})[pers] || (T[key] || {}).just || '').replace(/\{name\}/g, G.player ? G.player.name : '');
  },
  // 리더 말 아래에 작게 붙는 조작 설명 (게임 시스템 안내)
  coachSys(key) {
    return {
      gauge: '발밑 게이지가 차면 그 캐릭터가 행동합니다.',
      turn: '내 차례에는 시간이 흐르지 않습니다. 아래 메뉴에서 공격·스킬·방어·아이템을 고르세요.',
      aimEnemy: '공격할 적을 누르면 바로 발동합니다.',
      aimAlly: '도울 동료를 누르면 발동합니다.',
      aimNone: '사용을 누르면 발동합니다.',
      done: '아이템: 회복약으로 체력 회복 · 방어: 받는 피해 감소',
      tools: '오른쪽 위 버튼: 전투 속도(배속)와 자동 전투. 익숙해지면 써 보세요.',
    }[key] || '';
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
    const gate = { id: -1, tier: 0, theme: '협회 훈련용 게이트', elem: pickElem() };
    this.exam = { ids, leader, gate, loot: { money: 0, ether: 0, kills: 0 }, stage: 0 };
    this.exam.rooms = [this.examEnemies(false), this.examEnemies(true)];
    const mates = ids.map((id) => G.npcById(id)); const L = G.npcById(leader);
    this.screen = 'game'; this.render();
    const examiner = { name: '시험관', sub: '헌터 협회' };
    // 받침에 따라 '이에요/예요', '이다/다'
    const jong = (w) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return c >= 0 && c < 11172 && c % 28 !== 0; };
    const yo = (w) => w + (jong(w) ? '이에요' : '예요'); const da = (w) => w + (jong(w) ? '이다' : '다');
    const intro = { kind: (n) => `${yo(n.name)}. ${yo(className(n.cls))}. 잘 부탁해요.`, just: (n) => `${n.name}. ${da(className(n.cls))}. 등 맡길 수 있게 해 줘.`, warlike: (n) => `${n.name}. ${className(n.cls)}. 괴수는 내가 먼저 친다.`, cold: (n) => `…${n.name}. ${className(n.cls)}.` };
    this.talk([
      { narr: `${G.region().name}, 헌터 협회 시험장. 로비엔 오늘 처음 각성한 사람들이 긴장한 얼굴로 앉아 있다. 전광판에 ${p.name}의 이름이 뜬다.` },
      { who: examiner, text: '실기는 임시 파티 단위로 본다. 협회 훈련용 게이트를 끝까지 통과하면 합격이다.' },
      { who: examiner, text: `각 파티엔 협회가 위촉한 현역 헌터가 리더로 붙는다. ${p.name}, 네 파티 리더는 ${L.name}. ${L.guild && GUILDS[L.guild] ? `${GUILDS[L.guild].name} 소속이다.` : `${L.crewName || '자기 파티'}를 꾸리는 파티장이다.`}` },
      { who: L, text: this.leadSay('brief') },
      ...mates.map((n) => ({ who: n, text: (intro[n.personality] || intro.kind)(n) })),
      { who: L, text: { just: '인사는 됐다. 들어간다. 내 뒤에 붙어.', kind: '자, 그럼 들어가 볼까요? 제 뒤로 따라오세요.', cold: '간다.' }[L.personality] || '간다.' },
      { choices: [{ text: '리더를 따라 게이트로 들어간다', go: () => this.handle('exam-go') }, { text: '(튜토리얼 건너뛰기)', go: () => this.handle('exam-skip') }] },
    ]);
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
    // 안내는 리더가 플레이어에게 직접 하는 말로 (시스템 문구를 리더 입에 넣지 않는다)
    let key;
    if (t.acted >= 2) { step = '안내 3/3 · 더'; key = 'tools'; }
    else if (t.acted >= 1) { step = '안내 3/3'; key = 'done'; }
    else if (!cb.waiting) { step = '안내 1/3'; key = 'gauge'; }
    else if (!c.sel) { step = '안내 2/3'; key = 'turn'; }
    else {
      step = '안내 2/3';
      const aim = SKILL_AIM[skillById(c.sel).type] || 'none';
      key = aim === 'enemy' ? 'aimEnemy' : aim === 'ally' ? 'aimAlly' : 'aimNone';
    }
    t.key = key;
    const sys = key === 'turn' && c.cmd === 'skill' ? '쓸 스킬을 누르세요. 그다음 공격할 적을 누르면 발동합니다.' : key === 'turn' && c.cmd === 'item' ? '쓸 물건을 누르세요.' : this.coachSys(key);
    text = `${key === 'tools' ? '' : `"${this.leadSay(key)}"`}<div class="small dim coach-sys">${sys}</div>`;
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
    this.examResultTalk(win);
  },
  // 시험이 끝난 뒤: 리더의 말 → 측정실 → 동기들 (대화창으로)
  examResultTalk(win) {
    const ex = this.exam; const L = this.examLeader(); const p = G.player;
    const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    const meter = { name: '측정관', sub: '헌터 협회' }; const chief = { name: '지부장', sub: '헌터 협회' };
    const r = ex.reveal ? ex.reveal.rank : p.rankIdx;
    const RANK_TALK = [
      [{ who: meter, text: 'F급. 대부분 여기서 시작합니다.' }, { who: meter, text: '실망할 것 없어요. S급도 처음엔 다 F였으니까.' }],
      [{ who: meter, text: '…E급이네요. 신규 각성자 중엔 위쪽입니다.' }, { narr: '대기실의 동기들이 수군거린다.' }],
      [{ narr: '측정기가 두 번 울린다. 측정관이 기록을 다시 확인하고 자리에서 일어난다.' }, { who: meter, text: 'D급. 신규 등록으로 D급은 이 지부에서 올해 처음입니다.' }],
      [{ narr: '측정실 문이 열리고 협회 지부장이 직접 들어온다.' }, { who: chief, text: 'C급 신인이라… 오늘 오후부터 길드들 전화가 빗발칠 겁니다.' }, { who: chief, text: '몸조심하세요. 좋은 뜻으로든, 나쁜 뜻으로든.' }],
      [{ narr: '측정기 화면이 붉게 깜빡인다. 아무도 말을 하지 않는다.' }, { who: chief, text: '본부죠? …B급입니다. 신규 각성자가요. 네, 지금 당장요.' }],
    ][Math.max(0, Math.min(4, r))];
    const speaker = mates.find((n) => n.personality === 'kind') || mates[0];
    ex.talked = true;
    this.talk([
      win ? { narr: '마지막 괴수가 쓰러지자 훈련용 게이트가 닫혔다.' } : { narr: `파티가 밀리자 ${L ? L.name : '시험관'}이(가) 봉인을 풀고 앞으로 나섰다. 보스가 한 번에 갈라졌다.` },
      L ? { who: L, text: this.leadSay(win ? 'win' : 'lose').replace(/^"|"$/g, '') } : null,
      { narr: '협회 측정실. 원통형 측정기 안에 들어선다.' },
      ...RANK_TALK,
      { narr: '시험장을 나서자 임시 파티원들이 기다리고 있다.' },
      speaker ? { who: speaker, text: '…우리, 연락처라도 주고받을까? 어디로 뽑힐지는 모르지만.' } : null,
    ], () => this.renderExamEnd());
  },
  renderExamEnd() {
    const ex = this.exam; const mates = ex.ids.map((id) => G.npcById(id)).filter(Boolean);
    const R = RANKS[G.player.rankIdx];
    this.modal(`<div class="eyebrow">헌터 자격 시험 · 결과</div><h3><span class="tag rank" style="--c:${R.color}">${R.key}급</span> 헌터 자격증 발급</h3>
      ${ex.talked ? '' : `<p class="event-text">${fixJosa(ex.text)}</p>`}
      ${ex.reveal && !ex.talked ? `<div class="sec-title sec">협회 등급 측정</div><p class="event-text">${fixJosa(ex.reveal.text)}</p>` : ''}
      ${ex.talked ? '' : `<p class="event-text">시험장을 나서자 임시 파티원들이 당신을 바라본다. "…우리, 연락처라도 주고받을까? 어디로 뽑힐지는 모르지만."</p>`}
      <div class="sec-title sec">연락처를 교환할 동기 <span class="small dim">(눌러서 선택·해제 · 측정 뒤 같은 곳에 뽑히면 첫 파티 후보가 된다)</span></div>
      <div class="cards">${mates.map((n) => `<button class="item-row choice-btn ${ex.pick.has(n.id) ? 'on' : ''}" data-act="exam-pick" data-v="${n.id}">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b>
        <div><span class="tag cls tiny" style="--c:${groupColor(classById(n.cls).g)}">${className(n.cls)}</span> <span class="small dim">${persById(n.personality).name}</span></div></div><b class="${ex.pick.has(n.id) ? 'amber' : 'dim'}">${ex.pick.has(n.id) ? '함께' : '각자'}</b></button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="exam-solo">교환하지 않는다</button><button class="primary" data-act="exam-party" ${ex.pick.size ? '' : 'disabled'}>${`${ex.pick.size}명과 연락처 교환`}</button></div>`, 'event-box');
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
      ${friend ? `<p class="dim">소꿉친구 ${friend.name}은(는) ${(REGIONS.find((r) => r.id === friend.region) || G.region()).name}에 있습니다.</p>` : ''}
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

