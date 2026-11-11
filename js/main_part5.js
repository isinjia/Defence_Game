// ===== 메인 시나리오 5부 「봉쇄선 너머」 A급 (영역 D, docs/메인_시나리오.md §3 · docs/메인_후속_작업지시.md §3) =====
// 4부 이전 플래그(endSeed·jinBond·rivalEnd·leaderFate·friend3·madoState·arinName·c20·arinAsk·seoyun·halfRing·goJae·straitRitual·c27·part4)를 읽는다.
// 28장은 north.js의 봉쇄 구역 열기를 감싸서 쓰고(중복 화면 없음), 30장은 관측소 회로를 선택으로 바꾼다.
const YOON = { name: '윤해람', sub: '북방 관측소장' };
const P4 = (M, k, d) => (M.part4 && M.part4[k]) || M.flags[k] || d;
const SEO_ON5 = (M) => !!M.flags.seoyun && (M.flags.seoyunShake || M.flags.seoyun === 'ally');

if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  // 메인 28장의 길로 봉쇄 구역을 연다. 비용·무법은 길마다. 이미 열려 있으면 그대로
  GP.mainNorthOpen = function (how) {
    const s = this.northState && this.northState(); if (!s) return false;
    if (s.open) return true;
    const p = this.player;
    if (how === 'smuggle') { const c = this.smuggleCost(); p.money = Math.max(0, p.money - Math.min(p.money, c)); p.outlaw = (p.outlaw || 0) + 15; this.rumor('누군가 봉쇄선 브로커를 통해 북쪽으로 넘어갔다는 말이 돈다.'); }
    if (how === 'permit' && this.canPermit()) { const c = this.northPermitCost(); p.merit = Math.max(0, p.merit - c.merit); }
    s.open = true; s.how = how === 'smuggle' ? 'smuggle' : 'permit';
    this.northApply(); this.spawnNorth(true);
    return true;
  };
  // 관측소(truth)는 메인 30장 전에는 안에서 잠겨 있다. 30장의 선택이 회로를 정한다
  const baseNSA = GP.northSiteAct;
  GP.northSiteAct = function (s, choice) {
    const M = this.mainState && this.mainState();
    if (s.kind === 'truth' && M && !M.done[30] && (M.ch <= 30)) {
      s.visited = true; s.known = true; s.used = this.monthKey();
      return '관측소 철문이 안에서 잠겨 있다. 두드리자 안쪽에서 낡은 무전기 소리가 난다. "아직은 열 수 없어요." (메인 30장)';
    }
    return baseNSA.call(this, s, choice);
  };
}

// ---------- 28장 봉쇄선 ----------
MAIN.ch(28, {
  part: 5, title: '봉쇄선', rank: 5, after: 1, where: 'gangbuk',
  goal: '강북 북쪽 봉쇄선 초소',
  scenes: [
    { id: 'c28_why', lines: [
      { narr: (g, M) => ({
        kama: '서윤이 해협 폭격을 사흘 늦췄다. 그 사흘 동안 할 일이 있다. 해협이 아니라 북쪽이다.',
        solo: '혼자 준비한 장비 목록 맨 아래에 한 줄을 더 적는다. "북쪽." 반쪽 원이 그쪽으로 기운 지 한 달째다.',
        reply: '진서해에게서 답장이 왔다. "해협에 오시기 전에 북쪽을 보세요. 제가 왜 이러는지 거기 있습니다."',
        missed: '해협 위 의식은 이미 시작됐다. 바다가 매일 조금씩 더 갈라진다. 그걸 멈출 열쇠가 북쪽에 있다는 말을 들었다.',
      })[P4(M, 'plan', 'missed')] },
      { narr: (g, M) => (M.flags.madoState === 'jailed' ? '구치소 면회실에서 마도현이 한 말. "군주는 북쪽에서 먹는다. 관측소가 그걸 안다. 윤해람이 아직 살아 있다면."' : M.flags.madoState === 'ally' ? '마도현의 메모. "북방 관측소. 윤해람. 내가 버린 사람이다. 자네가 가서 사과할 필요는 없네."' : '관리국에서 지워진 이름 하나. 북방 관측소장 윤해람. 대붕괴 이듬해 봉쇄선 너머에 혼자 남았다.') },
      { who: 'arin', text: (g, M) => (M.flags.arinAsk === 'bridge' ? '북쪽에 우리 쪽으로 이어진 줄이 있어. 그 줄이 문지기를 먹여. 끊지 말아 줘. 아직은.' : '북쪽에 줄이 하나 있어. 그 줄 끝에 있는 사람이 나를 알아. 만나 봐.') },
    ] },
    { id: 'c28_post', lines: [
      { narr: '강북 폐구 북쪽 끝. 철조망이 세 겹. 그 너머는 안개다. 안개가 벽처럼 서 있다. 초소 탐조등이 그 벽에 부딪혀 퍼진다.' },
      { narr: (g) => (g.northOpen && g.northOpen() ? '차단기는 이미 한 번 올라간 적이 있다. 당신이 올렸다. 초소 병사가 고개를 끄덕인다. "또 가십니까."' : '초소 병사가 당신 등급표를 보고 휘파람을 분다. "A급이면 브로커들이 줄 섭니다. 허가는… 국장님 결재가 있어야 하고요."') },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: (g, M) => RIVAL_LINE(g, M, { kama: '봉쇄선 초소 근무표다. 사흘 뒤 새벽 근무가 내 동기야. 눈 감아 줄 거다.', cult: '선생님도 북쪽에 가 봤대. 거기서 돌아와서 가면을 썼대.', solo: '안개 속 길은 내가 한 번 걸어 봤다. 표시 남겨 뒀어. 빨간 끈.', alone: '나도 간다. 짐은 내가 든다.', none: '같이 간다.' }) },
    ], choices: [
      { text: '이미 열린 길로 간다', when: (g) => !!(g.northOpen && g.northOpen()), set: { northWay: 'again' }, next: 'c28_cross' },
      { text: '관리국 특별 허가로 넘는다', when: (g, M) => !(g.northOpen && g.northOpen()) && (g.canPermit() || M.flags.madoState === 'ally'), set: { northWay: 'permit' }, next: 'c28_cross' },
      { text: '서윤에게 부탁한다', when: (g, M) => !(g.northOpen && g.northOpen()) && SEO_ON5(M), set: { northWay: 'seoyun' }, next: 'c28_cross',
        say: [{ who: 'seoyun', text: '봉쇄선 출입 기록은 관리국 서버에 남아요. 제 아이디로 찍을게요. …이제 제 이름도 돌이킬 수 없네요.' }] },
      { text: '브로커를 찾는다', when: (g) => !(g.northOpen && g.northOpen()), set: { northWay: 'broker' }, next: 'c28_cross',
        say: [{ narr: '폐구 지하 상가. 브로커가 손가락을 펼친다. 값이 비싸다. "A급이면 시체로 돌아와도 장사는 돼요."' }] },
    ] },
    { id: 'c28_cross', lines: [
      { narr: (g, M) => ({ again: '익숙한 차단기. 익숙한 안개. 처음 넘었을 때보다 안개가 한 뼘 더 짙다.', permit: '허가증 바코드가 찍힌다. 차단기가 올라간다. 병사들이 경례한다. 아무도 눈을 마주치지 않는다.', seoyun: '새벽 근무 교대 시간. 서윤의 아이디가 찍힌 출입 기록 한 줄. 차단기가 소리 없이 올라간다.', broker: '새벽 세 시. 철조망의 끊어진 틈. 브로커가 손전등을 끈다. "여기서부턴 혼자요."' })[M.flags.northWay] },
      { narr: '안개 속 첫걸음. 소리가 사라진다. 자기 발소리도 들리지 않는다. 한 칸 앞만 보인다.' },
    ], pause: { days: 2, label: '안개', text: '이틀 동안 안개 속을 걷는다.' } },
    { id: 'c28_fog', lines: [
      { narr: '이틀째. 안개가 갑자기 얇아진다. 도로 표지판. 녹슬었지만 읽힌다. 대붕괴 이전 지명이다.' },
      { narr: '표지판 아래에서 무언가 움직인다. 안개를 먹고 자란 것. 북쪽 괴수는 남쪽 것들보다 조용하다.' },
    ], choices: [
      { text: '칼을 뽑는다', set: { c28: 'fight' }, next: 'c28_end',
        fight: (g) => ({ title: '안개를 먹는 것', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2, elem: 'dark', boss: true, name: '안개 포식자' }, win: { text: '안개 포식자가 쓰러지자 주변 안개가 한 겹 걷힌다.', gain: { fame: 8 } }, lose: { text: '안개 속으로 끌려가다 간신히 빠져나온다.', gain: { injure: 1 } } }) },
      { text: '숨을 죽이고 지나간다', set: { c28: 'sneak' }, next: 'c28_end' },
    ] },
    { id: 'c28_end', lines: [
      { narr: '안개 너머로 도시의 윤곽이 보인다. 불 하나 없는 빌딩들. 그 위로 하늘이 이상하게 밝다. 북쪽인데 남쪽 바다 색이다.' },
      { who: 'arin', text: '거기야. 그 도시는 그날에서 멈췄어. 우리 쪽이랑 제일 가까운 곳이야.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const how = M.flags.northWay === 'broker' ? 'smuggle' : 'permit';
    if (g.mainNorthOpen) g.mainNorthOpen(how);
    if (M.flags.northWay === 'seoyun') { const s = g.mainWho('seoyun'); if (s && s.id != null) g.changeRel(s, 8, '봉쇄선 출입에 이름을 걸어 주었다'); M.flags.seoyunBurned = true; }
    g.lifeEvent(({ again: '다시 북부 봉쇄선을 넘었다.', permit: '관리국 허가로 북부 봉쇄선을 넘었다.', seoyun: '한서윤의 이름으로 북부 봉쇄선을 넘었다.', broker: '브로커를 통해 북부 봉쇄선을 넘었다.' })[M.flags.northWay] || '북부 봉쇄선을 넘었다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c28: 'missed', northWay: 'late', northFirst: 'other' });
    g.rumor('관리국 원정대가 북부 봉쇄선을 넘었다. 돌아온 사람은 절반이다.');
    return '관리국 북방 원정대 소식. 돌아온 사람이 절반이다. 그들이 지나간 길이 남았다.';
  } },
});

// ---------- 29장 멈춘 도시 ----------
MAIN.ch(29, {
  part: 5, title: '멈춘 도시', rank: 5, after: 0, where: 'any',
  goal: '북방 · 대붕괴 이전 도시 잔해',
  scenes: [
    { id: 'c29_clock', lines: [
      { narr: (g, M) => (M.flags.northWay === 'late' ? '원정대가 남긴 빨간 깃발을 따라 도시에 들어선다. 깃발 몇 개는 쓰러져 있다.' : '도시 입구. 시계탑이 9시 14분을 가리킨다. 이십 년째.') },
      { narr: '거리에 차가 서 있다. 문이 열린 채로. 안에 아무도 없다. 운전석 위 커피 컵에 먼지가 쌓여 있다. 컵 속은 말라 있다.' },
      { narr: '횡단보도 신호등은 빨간불에서 멈췄다. 정지선 앞에 유모차 하나.' },
    ] },
    { id: 'c29_school', lines: [
      { narr: '초등학교. 3학년 2반. 칠판에 아이들 글씨. "내일은 소풍". 그 아래 누가 그린 바다. 초록색 크레파스.' },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '도윤이 생각난다. 도윤도 바다를 초록색으로 그렸다. 울산에서 나온 날.' : M.flags.friend3 === 'late' ? '친구가 맨발로 걷던 부두가 생각난다. 그 바다도 이 색이었다.' : '교실 뒤 사물함에 이름표가 그대로다. 스물여덟 개.') },
      { narr: '교탁 위 출석부. 그날 날짜에 결석 하나도 없다.' },
    ] },
    { id: 'c29_paper', lines: [
      { narr: '역 앞 신문 가판대. 그날 아침 조간. 1면 기사.' },
      { sys: '「제주 해양 에테르 관측 사업, 오늘 2차 관측 — "인류 최초의 교신 기대"」' },
      { narr: '사진 속 두 사람이 웃고 있다. 젊은 진서해. 젊은 마도현. 어깨동무를 하고 있다.' },
      { who: 'mumyeong', when: (g, M) => M.flags.jinBond !== 'foe' || M.flags.c27 === 'reply', text: '(무전) 그 신문 보셨군요. 그날 아침엔 우리 둘 다 웃었습니다. 한 사람은 아직도 웃고, 한 사람은 웃는 법을 잊었죠.' },
    ], choices: [
      { text: '신문을 접어 품에 넣는다', set: { c29: 'paper', oldPaper: true } },
      { text: '유모차 곁에 앉아 잠시 묵념한다', set: { c29: 'mourn' } },
      { text: '학교 출석부를 가져간다 — 누군가는 이름을 불러야 하니까', set: { c29: 'roll', rollBook: true } },
    ] },
    { id: 'c29_camp', lines: [
      { narr: '밤. 무너진 서점 2층. 모닥불. 안개가 창문까지 차오른다.' },
      { who: 'leader', text: (g, M) => g.mainReg({ haera: '…이 도시 사람들, 다 어디 갔을까. 이십 년 동안 생각 안 하고 살았다.', haeyo: '이 도시 사람들 다 어디 갔을까요. 이십 년 동안 생각 안 하고 살았네요.', short: '다 어디 갔을까.' }, g.mainWho('leader')),
        alt: (g, M) => (M.flags.leaderFate === 'dead' ? '모닥불 옆에 붕대 한 롤을 놓는다. 리더가 늘 이 자리에 앉았을 것이다.' : '모닥불이 탁탁 튄다. 혼자 듣는 소리다.') },
      { who: 'seoyun', when: (g, M) => SEO_ON5(M), text: '관리국 문서엔 이 도시가 "소개 완료"로 돼 있어요. 소개된 사람은 없어요. 처음부터.' },
      { narr: (g, M) => ({ paper: '신문을 펴서 불빛에 비춰 본다. 사진 구석에 흰 가운 여자 하나. 이름표: 윤해람.', mourn: '눈을 감자 유모차 바퀴 소리가 들리는 것 같다.', roll: '출석부를 편다. 스물여덟 개 이름. 하나씩 소리 내 읽는다. 안개가 듣는다.' })[M.flags.c29] || '' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const e = g.exploreState && g.exploreState();
    if (e && e.sites) e.sites.filter((s) => s.north && (s.kind === 'oldcity' || s.kind === 'truth')).forEach((s) => { s.known = true; });
    g.lifeEvent(({ paper: '멈춘 도시에서 대붕괴 날 아침 신문을 가져왔다.', mourn: '멈춘 도시의 빈 유모차 곁에서 묵념했다.', roll: '멈춘 도시 초등학교의 출석부를 가져와 이름을 불렀다.' })[M.flags.c29] || '대붕괴 이전에 멈춘 도시를 걸었다.');
  },
  expire: { months: 4, run: (g, M) => {
    Object.assign(M.flags, { c29: 'missed' });
    g.rumor('북방 원정대가 멈춘 도시를 지도에 올렸다. 유물 사냥꾼들이 몰려든다.');
    return '북방 멈춘 도시에 유물 사냥꾼들이 몰려들었다는 소식.';
  } },
});

// ---------- 30장 관측소 ----------
MAIN.ch(30, {
  part: 5, title: '관측소', rank: 5, after: 0, where: 'any',
  goal: '북방 관측소 · 윤해람',
  scenes: [
    { id: 'c30_door', lines: [
      { narr: '산등성이 위 콘크리트 돔. 안테나가 원초의 게이트가 있는 남쪽을 향해 있다. 철문은 안에서 잠겨 있다.' },
      { narr: '무전기 소리. "누구세요." 늙은 여자 목소리. "…아, 반쪽 원 냄새가 나네. 들어와요."', when: (g, M) => !!M.flags.halfRing },
      { narr: '무전기 소리. "누구세요." 늙은 여자 목소리. 오래 침묵. "…영점 세대구나. 들어와요."', when: (g, M) => !M.flags.halfRing },
    ] },
    { id: 'c30_yoon', lines: [
      { narr: '돔 안. 모니터 수십 개. 절반은 꺼졌다. 침낭 하나, 라면 상자 탑. 백발의 여자가 휠체어에 앉아 있다.' },
      { who: YOON, text: '윤해람이에요. 관측소장. 대원은 나 하나. 이십 년째요.' },
      { who: YOON, text: (g, M) => (M.flags.oldPaper ? '그 신문… 내가 사진 구석에 있죠. 그날 아침 우리 셋은 다 웃었어요. 마도현, 진서해, 나.' : '마도현이 날 여기 두고 갔어요. "관측하라." 그 말 하나 남기고.') },
      { who: YOON, text: '문 앞의 그것, 심연의 군주. 그건 괴수가 아니에요. 저편이 마지막 에테르를 모아 만든 문지기 장치예요. 문을 붙잡고 있는 손.' },
      { who: YOON, text: '북쪽 봉쇄선 아래로 에테르가 흘러요. 저편에서 새는 마지막 숨이요. 이 관측소 송신 회로가 그걸 모아서 군주한테 보내고 있어요. 원래는 관측용이었는데, 어느 날부터 거꾸로 돌아요.' },
    ] },
    { id: 'c30_console', lines: [
      { narr: '빨간 레버 하나. 「송신 회로」. 레버 옆에 메모가 붙어 있다. 날짜가 열네 개. 열네 번 내리려다 만 날짜.' },
      { who: YOON, text: '끊으면 군주가 약해져요. 당신이 문 앞에서 이길 수 있게. 대신 저편으로 가는 마지막 숨도 끊겨요. 그쪽 사람들은… 더 빨리 끝나겠죠.' },
      { who: 'arin', text: (g, M) => ({ bridge: '끊지 말아 줘. 그 줄이 있어야 다리를 놓을 수 있어. 약속했잖아.', open: '끊지 마. 그 사람이 문을 열 때 우리 쪽 아이들이 건너갈 숨이 필요해.', close: '…끊어도 돼. 닫을 거라면, 우리가 덜 아프게 빨리 끝나는 게 나아.' })[M.flags.arinAsk || 'close'] },
    ], choices: [
      { text: '레버를 내린다 — 회로를 끊는다', set: { circuitCut: true }, next: 'c30_after' },
      { text: '레버에서 손을 뗀다 — 그대로 둔다', set: { circuitCut: false }, next: 'c30_after' },
    ] },
    { id: 'c30_after', lines: [
      { narr: (g, M) => (M.flags.circuitCut ? '레버가 내려간다. 모니터 하나가 꺼진다. 남쪽 하늘이 아주 조금 어두워진다. 멀리서 무언가가 우는 소리. 고래 같은.' : '레버에서 손을 뗀다. 윤해람이 메모에 날짜를 하나 더 적는다. 열다섯 번째. 이번엔 다른 사람 손이다.') },
      { who: YOON, text: (g, M) => (M.flags.circuitCut ? '…고마워요. 나는 이십 년 동안 못 했어요. 이제 잘 수 있겠네요.' : '그래요. 나도 그래서 못 내렸어요. 그 아이가 울까 봐.') },
      { who: 'arin', text: (g, M) => (M.flags.circuitCut ? (M.flags.arinAsk === 'close' ? '괜찮아. 고마워. …조금 춥다.' : '…알았어. 네가 정한 거니까.') : '고마워. 정말로.') },
      { narr: '관측소 창밖. 남쪽 하늘에 문이 보인다. 이렇게 멀리서도.' },
    ], pause: { days: 1, label: '관측소의 밤', text: '윤해람이 하룻밤 자고 가라고 한다.' } },
    { id: 'c30_night', lines: [
      { who: YOON, text: '나는 여기 남을 거예요. 누군가는 저 문을 끝까지 지켜봐야 하니까. 관측하라. 그 말은 마도현 말 중에 유일하게 맞는 말이었어요.' },
      { who: YOON, text: (g, M) => (M.flags.goJae === 'alive' ? '고재석 씨 살아 있다고요? …그 사람한테 전해 줘요. 그날 배에서 내 손 잡아 줘서 고맙다고.' : '제주에서 그날 살아 나온 사람이 한 명 있었는데. 아직 살아 있을까.') },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const ns = g.northState && g.northState(); if (ns) ns.truth = !!M.flags.circuitCut;
    g.lifeEvent(M.flags.circuitCut ? '북방 관측소의 송신 회로를 끊었다. 군주가 약해졌다.' : '북방 관측소의 송신 회로를 그대로 두었다.');
    if (M.flags.circuitCut) g.rumor('북쪽 하늘이 하룻밤 어두웠다. 관측소 쪽에서 고래 울음 같은 소리가 들렸다는 말이 돈다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c30: 'missed', circuitCut: true, yoonGone: true });
    const ns = g.northState && g.northState(); if (ns) ns.truth = true;
    g.rumor('관리국 원정대가 북방 관측소 회로를 끊었다. 관측소장은 그 자리에서 숨진 채 발견됐다.');
    return '관리국 원정대가 북방 관측소 회로를 끊었다는 소식. 관측소장은 숨졌다.';
  } },
});

// ---------- 31장 저편 ----------
MAIN.ch(31, {
  part: 5, title: '저편', rank: 5, after: 1, where: 'any',
  goal: '북방 균열 · 저편',
  scenes: [
    { id: 'c31_crack', lines: [
      { narr: (g, M) => (M.flags.circuitCut ? '관측소 아래 골짜기. 땅이 갈라져 있다. 회로를 끊은 뒤로 틈이 조금 좁아졌다. 그래도 사람 하나는 지나간다.' : '관측소 아래 골짜기. 땅이 갈라져 있다. 틈에서 따뜻한 바람이 나온다. 초록빛이 섞인 바람.') },
      { narr: (g, M) => (M.flags.halfRing ? '반쪽 원이 주머니에서 저절로 떠오른다. 틈 쪽으로. 따라간다.' : '틈 앞에서 숨을 고른다. 꿈에서 본 길이다. 발이 먼저 안다.') },
      { narr: '한 걸음. 소리가 바뀐다. 두 걸음. 색이 바뀐다. 세 걸음. 반쯤 넘어왔다.' },
    ] },
    { id: 'c31_grey', lines: [
      { narr: '회색 하늘. 갈라진 땅. 강이 있던 자리에 빛나는 모래가 말라붙어 있다. 강바닥을 따라 사람들이 앉아 있다. 움직이지 않는다. 숨은 쉰다.' },
      { narr: '아이 하나가 고개를 든다. 당신을 본다. 손을 뻗는다. 손끝이 투명하다.' },
      { narr: (g, M) => (M.flags.friend3 === 'late' ? `강바닥 끝에 ${g.mainFill(F2_TARGET(g))}이(가) 앉아 있다. 반쯤 투명하다. 진서해의 의식에서 반쯤 건너온 것이다. 당신을 보고 웃는다. "여기 조용해."` : M.flags.doyun === 'lab' ? '강바닥 끝에 짧게 깎은 머리의 아이. 도윤이다. 울산에서 사라진 아이들이 여기 반쯤 와 있다.' : '강바닥 끝, 빈자리가 하나 있다. 누군가 앉았던 자국.') },
    ] },
    { id: 'c31_arin', lines: [
      { narr: '아린이 서 있다. 꿈보다 작다. 꿈보다 지쳐 있다. 하지만 진짜다. 발밑에 그림자가 있다.' },
      { who: 'arin', text: '…왔네. 진짜로. 여기가 우리 세계야. 강이 마르기 전엔 밤마다 하늘에 강이 흘렀어.' },
      { who: 'arin', text: (g, M) => (M.flags.arinAsk ? ({ close: '부탁했었지. 닫아 달라고. 여기 와서 보니까, 그래도 그 말이 맞아?', open: '부탁했었지. 열게 둬 달라고. 여기 아이들 보니까, 그래도 그 말이 맞아?', bridge: '부탁했었지. 다리를 놓아 달라고. 여기 와서 보니까, 할 수 있을 것 같아?' })[M.flags.arinAsk] : '한 번도 부탁 안 했지. 이제 할게. 너는 어떻게 하고 싶어?') },
    ], choices: [
      { text: '"닫을게. 네 세계가 끝나더라도."', set: { arinAsk: 'close', arinPromise: true, c31: 'close' }, next: 'c31_reply' },
      { text: '"다리를 놓을게. 둘 다 사는 길."', when: (g, M) => !!M.flags.halfRing || !M.flags.circuitCut, set: { arinAsk: 'bridge', arinPromise: true, c31: 'bridge' }, next: 'c31_reply' },
      { text: '"열게. 여기 아이들도 숨 쉬게."', when: (g, M) => M.flags.jinBond === 'near' || M.flags.c24 === 'join', set: { arinAsk: 'open', arinPromise: true, c31: 'open' }, next: 'c31_reply' },
      { text: '"아직 모르겠어. 문 앞에서 정할게."', set: { arinPromise: false, c31: 'wait' }, next: 'c31_reply' },
    ] },
    { id: 'c31_reply', lines: [
      { who: 'arin', text: (g, M) => ({ close: '…응. 고마워. 끝까지 같이 있어 줄게. 문 안쪽에서.', bridge: '다리. 할아버지가 그날 본 거. 반쪽 원 두 개. …그래, 해 보자.', open: '그 사람이랑 같은 말을 하네. 근데 네 입에서 들으니까 다르게 들려. 무섭지 않아.', wait: '그래. 문 앞에서. 거기서 기다릴게.' })[M.flags.c31] },
      { narr: (g, M) => (M.flags.halfRing && M.flags.c31 === 'bridge' ? '아린이 자기 반쪽을 꺼낸다. 당신 반쪽과 맞댄다. 딱 맞는다. 원이 된다. 빛이 난다. 아린이 그걸 당신 손에 쥐여 준다. "이건 문 앞에서."' : '아린이 당신 손을 잡는다. 차갑지 않다. 따뜻하지도 않다. 그냥 손이다.') },
    ] },
    { id: 'c31_back', lines: [
      { narr: '틈 밖. 골짜기. 저녁이다. 반나절이 지났다고 생각했는데 사흘이 지났다.' },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '(전화) 꿈에 그 애가 나왔어. 웃더라. 이십 년 만에 처음. …너 거기 갔다 왔구나.' },
      { who: YOON, when: (g, M) => !M.flags.yoonGone, text: '(무전) 사흘 동안 신호가 하나 더 잡혔어요. 사람 하나 크기. 돌아왔군요. 다행이에요.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.otherSide = true; if (M.flags.halfRing && M.flags.c31 === 'bridge') M.flags.ringWhole = true;
    g.lifeEvent('저편에 반쯤 발을 들였다. 아린을 처음으로 만졌다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c31: 'missed', arinFade: true });
    return '꿈속 목소리가 점점 작아진다. 아린의 얼굴이 흐려진다.';
  } },
});
