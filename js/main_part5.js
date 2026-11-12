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
      { who: 'leader', when: (g) => F2_IN_CREW(g), text: LR({ haera: '봉쇄선 넘는다고? 우리 팀 계약서엔 북쪽이 없다. …계약서 다시 쓰자. 이번엔 "어디든"으로.', haeyo: '봉쇄선을 넘는다고요? 팀 계약서에 북쪽은 없어요. …다시 써요. 이번엔 "어디든"으로.', short: '계약서 다시 쓰자. 어디든.' }) },
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
    { id: 'c29_flat', lines: [
      { narr: '아파트 단지. 7동 1203호. 문이 열려 있다. 식탁에 밥공기 넷. 숟가락이 꽂힌 채로. 달력은 그 달에 멈췄다. 그날 칸에 동그라미. "할머니 생신".' },
      { narr: '냉장고에 아이 그림. 가족 넷이 바다 앞에 서 있다. 바다가 초록색이다. 이 도시 아이들은 다 그 색으로 그렸다.' },
      { narr: (g, M) => (M.flags.friend3 === 'saved' || M.flags.friendBack ? '친구에게 사진을 찍어 보낸다. 답장이 온다. "우리 집 달력도 아직 그 해야. 엄마가 못 넘겨."' : '사진을 찍으려다 그만둔다. 이건 남의 집이다.') },
    ] },
    { id: 'c29_paper', lines: [
      { narr: '역 앞 신문 가판대. 그날 아침 조간. 1면 기사.' },
      { sys: '「제주 해양 에테르 관측 사업, 오늘 2차 관측 — "인류 최초의 교신 기대"」' },
      { art: 'jin-young', narr: '사진 속 두 사람이 웃고 있다. 젊은 진서해. 젊은 마도현. 어깨동무를 하고 있다.' },
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
      { narr: '서점 창밖, 안개 사이로 다른 잔해 지점들이 보인다. 은행, 병원, 방송국. 내일 지도에 적어 둔다.' },
      { narr: (g, M) => ({ art: 'yoon-young', paper: '신문을 펴서 불빛에 비춰 본다. 사진 구석에 흰 가운 여자 하나. 이름표: 윤해람.', mourn: '눈을 감자 유모차 바퀴 소리가 들리는 것 같다.', roll: '출석부를 편다. 스물여덟 개 이름. 하나씩 소리 내 읽는다. 안개가 듣는다.' })[M.flags.c29] || '' },
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
      { art: 'yoon-observatory', narr: '돔 안. 모니터 수십 개. 절반은 꺼졌다. 침낭 하나, 라면 상자 탑. 백발의 여자가 휠체어에 앉아 있다.' },
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
      { art: 'arin-material', narr: '아린이 서 있다. 꿈보다 작다. 꿈보다 지쳐 있다. 하지만 진짜다. 발밑에 그림자가 있다.' },
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

// ---------- 32장 해협의 군주 (재앙 'strait'와 상태 공유) ----------
const JIN_FACE = (g) => g.mainWho('mumyeong');
MAIN.ch(32, {
  part: 5, title: '해협의 군주', rank: 5, after: 1, where: 'busan', cal: 'strait',
  goal: '대한해협 · 흰 배들 한가운데',
  scenes: [
    { id: 'c32_sea', lines: [
      { narr: (g, M) => (M.flags.straitStrong ? '해협이 이미 반쯤 열려 있다. 당신 없이 시작된 의식이 석 달째. 균열에서 번개가 아니라 노래가 흘러나온다.' : ({ active: '부산 앞바다. 재앙 경보. 해협의 균열이 수평선을 가른다. 그 위에 흰 배 수백 척이 원을 그린다.', player: '해협 균열은 한 번 눌러 놓았다. 그 상처 위에 흰 배들이 다시 원을 그린다.', npc: '다른 헌터들이 눌러 놓은 균열. 흰 배들이 그 위에 닻을 내렸다.', fail: '할퀴어진 해상 도시 외곽. 그 상처가 그대로 의식장이 됐다.', none: '해협 한가운데 흰 배들이 원을 그린다. 원 안쪽 바다가 천천히 내려앉는다.', watch: '해협 한가운데 흰 배들이 원을 그린다. 원 안쪽 바다가 천천히 내려앉는다.' })[CAL_OF(g, 'strait')] || '') },
      { narr: (g, M) => (M.flags.circuitCut ? '남쪽 하늘의 문이 지난달보다 흐리다. 관측소 회로를 끊은 뒤로.' : '남쪽 하늘의 문이 또렷하다. 북쪽 줄이 아직 살아 있다.') },
    ] },
    { id: 'c32_eve', lines: [
      { narr: (g, M) => ({ kama: '서윤에게 넘긴 의식 날짜. 그 날짜가 오늘이다. 관리국 함정들이 해협 바깥에 원을 그린다. 폭격 준비를 늦춰 둔 그 원.', solo: '혼자 준비한 날들. 장비 목록 맨 아래 "북쪽" 다음 줄에 오늘 적었다. "해협."', reply: '"해협에서 봅시다." 보낸 답장 아래, 읽음 표시 옆에 진서해의 마지막 문자. "자리 비워 뒀습니다."', missed: '해협 의식은 당신 없이 석 달을 이어 왔다. 부산 사람들은 이제 밤에도 노래를 듣는다.' })[(M.part4 && M.part4.plan) || M.flags.c27 || 'missed'] },
      { narr: '부산 해상 도시 방파제. 흰 배들 위로 해협의 균열이 숨 쉬듯 열렸다 닫힌다. 그 박자가 보름 밤 강북 지하의 노래와 같다.', when: (g, M) => !!M.flags.straitRitual },
      { who: 'leader', when: (g) => F2_IN_CREW(g), text: LR({ haera: '해협 한가운데다. 거기선 후퇴로가 없다. …그래서 내가 배를 몬다. 너는 앞만 봐.', haeyo: '해협 한가운데예요. 후퇴로가 없어요. …그래서 제가 배를 몰게요. 앞만 보세요.', short: '배는 내가 몬다. 앞만 봐.' }) },
    ] },
    { id: 'c32_boat', lines: [
      { narr: (g, M) => (M.flags.rivalEnd === 'with' && M.flags.rivalPath === 'solo' ? '동기가 구한 낡은 배. 엔진이 세 번 만에 걸린다. "뜬다고 했지. 간다고는 안 했다."' : SEO_ON5(M) ? '서윤이 관리국 고속정을 끌고 왔다. "폭격 개시까지 네 시간. 그 안에 끝내요."' : '어부 하나가 배를 빌려준다. 돈은 받지 않는다. "그 초록 물고기, 우리 애가 무서워해요."') },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: (g, M) => RIVAL_LINE(g, M, { kama: '폭격 좌표에 우리 배가 들어가 있어. 위에선 알면서 그대로 뒀다. …나도 알면서 탔다.', cult: '사도 자리는 비우고 왔어. 선생님은 알 거야. 내가 어디 섰는지.', solo: '키는 내가 잡는다. 너는 앞만 봐.', alone: '배멀미 난다. 근데 안 내린다.', none: '간다.' }) },
    ] },
    { id: 'c32_lord', lines: [
      { narr: '흰 배들의 원 안쪽으로 들어서는 순간 바다가 일어선다. 균열에서 무언가가 몸을 일으킨다. 해협 전체가 그것의 등이다.' },
      { who: JIN_FACE, text: (g, M) => (M.flags.otherSide ? '저편에 다녀오셨군요. 그럼 아시겠죠. 저건 그쪽에서 새어 나온 마지막 숨이 뭉친 겁니다. 죽이지 마세요. …라고 해도 듣지 않으시겠죠.' : '오셨군요. 저건 의식이 깨운 게 아닙니다. 원래 거기 있었어요. 우리가 문을 반쯤 열 때마다 조금씩 자랐죠.') },
    ], choices: [
      { text: '해협의 군주에게 뛰어든다', set: { c32lord: 'fight' }, next: 'c32_jin',
        fight: (g) => ({ title: g.mainCalBoss('strait', '해협의 군주'), mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, elem: 'bolt', boss: true, name: g.mainCalBoss('strait', '해협의 군주') },
          ally: g.mainState().flags.rivalEnd === 'with' && g.mainWho('rival') ? { name: g.mainWho('rival').name, rank: g.mainWho('rival').rankIdx, elem: g.mainWho('rival').element } : undefined,
          win: { text: '군주가 무너진다. 해협의 균열이 한 뼘씩 닫힌다. 흰 배들이 흔들린다.', gain: { fame: 25, rep: 15 } }, lose: { text: '파도에 배가 뒤집힌다. 정신을 잃기 직전, 누군가 당신 옷깃을 잡는다. 흰 소매.', gain: { injure: 2 } } }) },
    ] },
    { id: 'c32_jin', lines: [
      { narr: (g, M) => (M.flags.fight_c32_lord === 'win' ? '물보라가 가라앉는다. 맨 앞 흰 배 갑판에 진서해가 서 있다. 소매가 젖었다. 기침을 한다. 손바닥이 붉다.' : '눈을 뜨니 흰 배 갑판이다. 진서해가 당신을 건져 올렸다. 그의 소매가 젖어 있다. 기침을 한다. 손바닥이 붉다.') },
      { who: JIN_FACE, text: (g, M) => ({ foe: '반박하러 오셨죠. 들을게요. 이번엔 마지막이니까.', open: '정하셨나요. 저는 정했습니다. 이십 년 전에.', near: '제 옆자리, 비워 뒀습니다. 앉으시겠어요?' })[M.flags.jinBond || 'open'] },
    ], choices: [
      { text: '칼을 겨눈다 — 진서해와 겨룬다', set: { c32: 'fight' }, next: 'c32_after',
        fight: (g) => ({ title: '진서해', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, human: true, boss: true, elem: 'water', name: '진서해' }, win: { text: '진서해가 무릎을 꿇는다. 웃는다. "역시. 열쇠는 열쇠군요."', gain: { fame: 15 } }, lose: { text: '진서해가 칼을 내린다. 당신을 내려다본다. "아직입니다. 문 앞에서 다시."', gain: { injure: 1 } } }) },
      { text: '칼을 내린다 — 이야기한다', when: (g, M) => !!M.flags.otherSide || !!M.flags.arinName, set: { c32: 'talk' }, next: 'c32_after',
        say: [{ narr: '"아린을 만났어요. 강바닥을 봤어요. 당신이 문을 다 열면 우리 강도 저렇게 돼요. 당신도 알잖아요."' }, { who: JIN_FACE, text: '…알아요. 알면서 했습니다. 아흔아홉이 버려진 세상과 모두가 같이 끝나는 세상. 저는 뒤쪽이 더 공평하다고 생각했어요.' }] },
    ] },
    { id: 'c32_after', lines: [
      { narr: '흰 배들의 노래가 멈춘다. 신도들이 갑판에 주저앉는다. 바다는 아직 갈라져 있다. 다만 더 벌어지지는 않는다.' },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'late', text: '…나 여기 있었어. 맨 뒤 배에. 노래 멈추니까 바다 소리가 안 들려. 처음이야.' },
      { who: 'seoyun', when: (g, M) => SEO_ON5(M), text: '(무전) 폭격 취소됐어요. 제가 한 게 아니에요. 위에서 겁먹은 거예요. 당신이 저 위에 있다는 걸 다 봤으니까.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (M.flags.fight_c32_lord === 'win') { g.mainCalClear('strait'); M.flags.straitStrong = false; }
    g.lifeEvent(M.flags.fight_c32_lord === 'win' ? '해협의 군주를 쓰러뜨리고 진서해와 마주했다.' : '해협에서 진서해의 손에 건져졌다.');
  },
  expire: { months: 4, run: (g, M) => {
    Object.assign(M.flags, { c32: 'missed', straitStrong: true, ritualDone: true });
    g.rumor('대한해협 의식이 끝났다. 해협 균열이 원초의 게이트와 공명하기 시작했다는 말이 돈다.');
    return '해협 의식이 끝났다는 뉴스. 제주 쪽 하늘이 밤에도 밝다.';
  } },
});

// ---------- 33장 무명의 끝 ----------
MAIN.ch(33, {
  part: 5, title: '무명의 끝', rank: 5, after: 0, where: 'busan',
  goal: '흰 배 갑판 · 진서해',
  scenes: [
    { id: 'c33_deck', lines: [
      { narr: (g, M) => ({ fight: M.flags.fight_c32_jin === 'win' ? '갑판. 진서해가 난간에 기대 앉아 있다. 당신 칼에 베인 자리를 손으로 누른다. 피보다 기침이 더 붉다.' : '갑판. 진서해가 당신 옆에 앉는다. 이긴 사람이 진 사람 옆에 앉듯이.', talk: '갑판. 둘이 나란히 앉는다. 해협 바람. 신도들이 멀찍이서 지켜본다.', missed: '제주 쪽 하늘이 밝은 밤. 진서해가 먼저 연락해 온다. 부산 폐부두, 마지막 흰 배 위.' })[M.flags.c32 || 'missed'] },
      { who: JIN_FACE, text: '폐가 반쯤 바닷물이에요. 첫 교신 때 들이마신 거. 이십 년 걸려서 여기까지 찼어요. 길어야 석 달.' },
      { who: JIN_FACE, text: (g, M) => (M.flags.madoState === 'jailed' ? '도현이는 갇혔다죠. 면회 한 번 못 갔네요. 그 친구는 제가 오면 울 거예요. 그래서 못 갔어요.' : M.flags.madoState === 'ally' ? '도현이랑 손잡으셨다죠. 그 친구는 닫는 사람이에요. 끝까지. 그게 그 친구의 속죄예요. 제 것보다 정직하죠.' : '도현이는 아직 본청 꼭대기에 있죠. 그 친구는 질서를 믿어요. 저는 질서가 버린 사람들을 믿고요.') },
    ] },
    { id: 'c33_crowd', lines: [
      { narr: '갑판 아래에서 신도들이 올라온다. 흰 로브가 젖어 몸에 붙었다. 대부분 비각성자. 다들 진서해를 본다. 그다음 당신을 본다.' },
      { narr: (g, M) => (M.flags.kwon === 'alive' ? '그 사이에 지팡이 짚은 권만석. "이번엔 안 들어간다고 했는데… 하은이가 아빠 대신 내가 간다길래. 그래서 왔어요."' : M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '연희가 배 난간에 기대 있다. 컵라면 상자를 들고. "다들 굶었어. 의식하느라."' : '어린 신도 하나가 당신 소매를 잡는다. 아무 말 없이.') },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with' && M.flags.rivalPath === 'cult', text: '…선생님. 저 여기 있어요. 사도 자리 비우고 왔어요. 죄송해요.' },
    ] },
    { id: 'c33_breath', lines: [
      { narr: '진서해가 기침을 멈추고 바다를 본다. 한참 말이 없다. 당신도 말이 없다. 둘 사이로 흰 로브 한 장이 바람에 날아간다.' },
      { narr: (g, M) => (M.flags.endSeed === 'open' ? '친구에게 했던 말이 떠오른다. "열 수도 있어." 이 사람 앞에서 그 말이 무겁다.' : M.flags.endSeed === 'bridge' ? '친구 옥상에서 했던 말. "닫지도 열지도 않는 길." 이 사람은 그 길을 생각해 본 적이 있을까.' : M.flags.endSeed === 'close' ? '친구에게 닫겠다고 했다. 이 사람 앞에서도 그 말을 할 수 있을까.' : '할 말을 고른다. 고르는 사이 해가 조금 기운다.') },
      { who: JIN_FACE, when: (g, M) => M.flags.jinBond === 'near' || !!M.flags.apostle, text: '당신 옆자리가 아니라 제 옆자리를 비워 뒀다고 했죠. 사실은 반대였어요. 저는 당신 옆에 서고 싶었습니다. 심연의 사도라는 이름, 신도들이 붙였어요. 제가 아니라 당신한테.' },
    ] },
    { id: 'c33_last', lines: [
      { who: JIN_FACE, text: '마지막으로 하나만 말할게요. 문을 다 열면 모두 각성합니다. 그리고 절반이 죽어요. 저는 그걸 알았고, 신도들한텐 말 안 했습니다. 그게 제 죄예요. 문을 연 것보다 큰 죄.' },
      { narr: (g, M) => (M.flags.friend3 === 'late' ? `멀리 ${g.mainFill(F2_TARGET(g))}이(가) 그 말을 듣는다. 표정이 움직이지 않는다. 손만 떨린다.` : '신도 몇이 그 말을 듣는다. 아무도 움직이지 않는다.') },
    ], choices: [
      { text: '끝낸다 — 이 사람이 다시 일어서지 못하게', set: { jinFate: 'slain' }, next: 'c33_after' },
      { text: '체포한다 — 법정에서 다 말하게', when: (g, M) => SEO_ON5(M) || M.flags.madoState === 'jailed' || M.flags.c18 === 'arrest', set: { jinFate: 'jailed' }, next: 'c33_after' },
      { text: '"같이 갑시다. 문 앞까지."', when: (g, M) => M.flags.jinBond === 'near' || M.flags.c32 === 'talk', set: { jinFate: 'with' }, next: 'c33_after' },
      { text: '그가 일어서는 걸 막지 않는다', when: (g, M) => M.flags.c32 === 'talk' || M.flags.arinAsk === 'close', set: { jinFate: 'sacrifice' }, next: 'c33_after' },
    ] },
    { id: 'c33_after', lines: [
      { narr: (g, M) => ({
        slain: '칼끝이 가슴에 닿는다. 진서해가 눈을 감는다. "고마워요. 이 폐로 석 달을 더 사는 건… 좀 길었어요." 신도들이 운다. 노래 없이.',
        jailed: '서윤이 수갑을 채운다. 진서해가 손목을 내민다. 순순하다. "도현이 옆 방이면 좋겠네요."',
        with: '진서해가 웃는다. 처음으로 가면 쓴 사람 같지 않은 웃음이다. "열쇠랑 같이 문 앞에 가는 건… 상상해 본 적 없어요." 신도들 사이에서 누군가 당신을 "사도"라고 부른다.',
        sacrifice: '진서해가 일어선다. 난간을 넘는다. 갈라진 해협 한가운데로 걸어 들어간다. 물이 그를 받친다. 그가 서 있는 자리부터 균열이 닫힌다. 마지막에 손을 흔든다. 당신에게가 아니라, 남쪽 하늘에.',
      })[M.flags.jinFate] || '' },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'late' && M.flags.jinFate !== 'slain', text: '…나 집에 갈래. 데려다줘.' },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'late' && M.flags.jinFate === 'slain', text: '…선생님 그렇게 안 보내도 됐잖아. 됐잖아.' },
      { who: 'arin', text: (g, M) => (M.flags.jinFate === 'sacrifice' ? '…그 사람이 이쪽으로 왔어. 해협 문을 안쪽에서 닫고. 미안하다고 백한 번째 말했어.' : M.flags.jinFate === 'with' ? '그 사람이랑 같이 온다고? …그래. 그날 첫 교신 때처럼.' : '그 사람 목소리가 안 들려. 이제.') },
    ] },
    { id: 'c33_dawn', lines: [
      { narr: '새벽. 흰 배들이 하나둘 부산항으로 돌아간다. 신도들이 로브를 벗어 바다에 띄운다. 흰 천이 해협 위에 꽃잎처럼 흩어진다.' },
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: (g, M) => (M.flags.jinFate === 'slain' ? '(전화) …그래. 들었네. 자네가 했군. 고맙다고는 못 하겠어. 미안하다고도.' : '(전화) 서해가 살아 있다고. …그 친구한테 전해 주게. 차는 아직 식지 않았다고.') },
      { narr: '구치소 마도현에게 소식이 전해졌다고 서윤이 알려 준다. 그는 하루 종일 창밖만 봤다고 한다.', when: (g, M) => M.flags.madoState === 'jailed' && SEO_ON5(M) },
      { narr: '해협 위 갈라진 자리가 아침 해에 반짝인다. 닫혔든 아니든, 오늘은 조용하다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (M.flags.friend3 === 'late' && M.flags.jinFate !== 'slain') M.flags.friendBack = true;
    if (M.flags.jinFate === 'sacrifice') { M.flags.straitStrong = false; g.rumor('진서해가 해협 균열 한가운데로 걸어 들어갔다. 해협이 닫혔다.'); }
    if (M.flags.jinFate === 'slain') g.rumor('균열교 교주 진서해가 해협에서 숨졌다.');
    if (M.flags.jinFate === 'jailed') g.rumor('균열교 교주 진서해가 체포됐다. 그는 법정에서 모든 걸 말하겠다고 했다.');
    if (M.flags.jinFate === 'with') { M.flags.apostle = true; g.rumor(`진서해가 ${g.player.name}과(와) 함께 남쪽으로 간다는 말이 돈다. 균열교가 술렁인다.`); }
    g.lifeEvent(({ slain: '진서해를 내 손으로 끝냈다.', jailed: '진서해를 체포했다.', with: '진서해와 함께 문 앞까지 가기로 했다.', sacrifice: '진서해가 해협 균열 속으로 걸어 들어가는 걸 지켜봤다.' })[M.flags.jinFate] || '진서해와 마주했다.');
  },
  expire: { months: 4, run: (g, M) => {
    Object.assign(M.flags, { c33: 'missed', jinFate: 'gone' });
    g.rumor('진서해가 신도들과 함께 제주 쪽으로 사라졌다.');
    return '진서해가 제주 쪽으로 사라졌다는 소식.';
  } },
});

// ---------- 34장 출정 전야 ----------
const P5_ALLIES = (g, M) => {
  const a = [];
  const L = g.mainWho('leader'); if (L && M.flags.leaderFate !== 'dead') a.push('leader');
  if (g.mainWho('rival') && M.flags.rivalEnd === 'with') a.push('rival');
  if (SEO_ON5(M)) a.push('seoyun');
  const f = g.mainWho('friend'); if (f && (M.flags.friend3 === 'saved' || M.flags.friendBack)) a.push('friend');
  if (M.flags.goJae === 'alive') a.push('goJae');
  if (M.flags.jinFate === 'with') a.push('jin');
  return a;
};
MAIN.ch(34, {
  part: 5, title: '출정 전야', rank: 5, after: 1, where: 'city',
  goal: '거점 · 함께 갈 사람들',
  scenes: [
    { id: 'c34_rounds', lines: [
      { narr: '출정 일주일 전. 인사를 다닌다. 말로 하는 인사는 아니다. 그냥 들른다.' },
      { narr: (g, M) => (M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '연희네 급식소. 국 한 그릇. 연희가 계산을 받지 않는다. "갔다 와서 내."' : '강북 급식소 자리. 지금은 편의점이다. 컵라면 하나를 사서 그 자리에서 먹는다.') },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '경계선 마을. 도윤이 협회 견습 배지를 자랑한다. "{hyung}, 나도 따라가면 안 돼?" 안 된다고 하자 울지 않고 고개를 끄덕인다. 컸다.' : M.flags.doyun === 'lab' ? '경계선 마을. 도윤네 집 앞에 아직 흰 끈이 묶여 있다. 문을 두드리지 못한다.' : '경계선 마을. 아이들이 담벼락에 문을 그리고 논다. 열었다 닫았다.') },
      { narr: (g, M) => (M.flags.goJae === 'alive' ? '강릉 방벽. 고재석 노인이 짐을 싸 놓고 기다린다. "가자. 내 고향이야."' : '강릉 방벽 틈의 조개껍데기 문패를 한 번 쓰다듬는다.') },
    ], pause: { days: 7, label: '출정 전날', text: '일주일 뒤, 거점에 사람들을 부른다.' } },
    { id: 'c34_gather', lines: [
      { narr: (g, M) => { const n = P5_ALLIES(g, M).length; return n >= 4 ? '거점 2층. 의자가 모자라 상자를 끌어온다. 이렇게 많은 사람이 이 방에 모인 건 처음이다.' : n >= 2 ? '거점 2층. 몇 사람이 모였다. 빈 의자가 몇 개 남는다.' : '거점 2층. 의자는 많은데 앉은 사람은 당신뿐이다.'; } },
      { narr: '탁자 위에 제주 지도. 한라산 꼭대기에 빨간 원. 원초의 게이트.' },
    ] },
    { id: 'c34_table', lines: [
      { who: 'leader', when: (g, M) => M.flags.leaderFate !== 'dead', text: (g, M) => g.mainReg(M.flags.leaderFate === 'hurt' ? { haera: '다리 하나로는 산 못 오른다. 대신 무전은 내가 잡는다. 끝까지.', haeyo: '이 다리로는 산 못 올라요. 대신 무전은 제가 잡을게요. 끝까지.', short: '무전은 내가 잡는다.' } : { haera: '은퇴한 놈이 왜 왔냐고? 분식집 문 닫고 왔다. 오늘 하루는 장사 안 해도 된다.', haeyo: '은퇴했는데 왜 왔냐고요? 가게 문 닫고 왔어요. 오늘 하루는 괜찮아요.', short: '가게 닫고 왔다.' }, g.mainWho('leader')) },
      { narr: '벽에 붙은 리더 사진 앞에 붕대 한 롤. 누가 오늘 새로 놓고 갔다.', when: (g, M) => M.flags.leaderFate === 'dead' },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: '시험 날 너랑 나, 둘 다 떨어질 줄 알았다. 여기까지 왔네. 마저 가자.' },
      { who: 'seoyun', when: (g, M) => SEO_ON5(M), text: (g, M) => (M.flags.seoyunBurned ? '관리국에서 잘렸어요. 봉쇄선 기록 때문에. 이제 저는 그냥 한서윤이에요. 그 사람으로 갈게요.' : '사직서 냈어요. 처음으로 제 이름으로 서명한 서류예요.') },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'saved' || M.flags.friendBack, text: (g, M) => (F2_AWAKE(g) ? '나 각성자야. 잊었어? 이번엔 뒤에 안 숨어. 지우도 응원한대.' : M.flags.friendBack ? '나 반쯤 저편 사람이래. 그럼 문 앞에서 쓸모 있겠지. 데려가.' : '나는 비각성자야. 문 앞까진 못 가. 대신 산 아래에서 기다릴게. 네가 내려올 때까지.') },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '나는 그 섬에서 나온 마지막 사람이야. 들어가는 마지막 사람도 돼야지. 길 안내는 내가 한다.' },
      { who: JIN_FACE, when: (g, M) => M.flags.jinFate === 'with', text: '여러분이 저를 어떻게 보는지 압니다. 문 앞까지만 같이 가요. 그다음은 열쇠가 정합니다.' },
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: '(전화) 제주 봉쇄선은 내가 연다. 자네가 지나갈 동안만. 그다음은… 자네 몫이다.' },
      { narr: '(구치소에서 편지 한 통. 마도현의 글씨.) "제주를 보게. 그리고 돌아오게. 나는 그날 돌아오지 못한 사람들 이름을 다 외운다."', when: (g, M) => M.flags.madoState === 'jailed' },
    ] },
    { id: 'c34_choose', lines: [
      { narr: '지도 위에 손을 올린다. 누구와 함께 갈지 정할 시간이다.' },
    ], choices: [
      { text: '다 함께 간다', when: (g, M) => P5_ALLIES(g, M).length >= 2, set: { goWith: 'all' } },
      { text: '가장 믿는 한 사람과 간다', when: (g, M) => P5_ALLIES(g, M).length >= 1, set: { goWith: 'one' } },
      { text: '혼자 간다 — 아무도 문 앞에 세우지 않는다', set: { goWith: 'alone' } },
    ] },
    { id: 'c34_farewell', lines: [
      { narr: (g, M) => ({ all: '한 사람씩 손을 잡는다. 말은 짧다. 다 같이 갈 거니까.', one: '함께 가지 않을 사람들에게 하나씩 인사한다. 문간에서.', alone: '아무도 데려가지 않는다고 말하자 방이 조용해진다. 한 사람씩 문간에서 붙잡는다.' })[M.flags.goWith] },
      { who: 'leader', when: (g, M) => M.flags.goWith !== 'all' && P5_ALLIES(g, M).includes('leader'), text: LR({ haera: '…알았다. 대신 무전기는 켜 둬라. 끝까지.', haeyo: '…알았어요. 대신 무전기는 켜 두세요. 끝까지.', short: '무전은 켜 둬.' }) },
      { who: 'rival', when: (g, M) => M.flags.goWith !== 'all' && P5_ALLIES(g, M).includes('rival'), text: '치사하다. 끝까지 너 혼자 멋있으려고. …돌아와서 컵라면 사.' },
      { who: 'seoyun', when: (g, M) => M.flags.goWith !== 'all' && P5_ALLIES(g, M).includes('seoyun'), text: '제주 봉쇄선 보급선 시간표예요. 가져가요. 저는 산 아래에서 기록할게요.' },
      { who: 'friend', when: (g, M) => M.flags.goWith !== 'all' && P5_ALLIES(g, M).includes('friend'), text: '놀이터에서 기다릴게. 계속. 네가 내려올 때까지.' },
      { who: GOJ, when: (g, M) => M.flags.goWith === 'alone' && M.flags.goJae === 'alive', text: '그 애한테 전해. 할아버지가 그날 손 못 잡아 줘서 미안하다고.' },
    ] },
    { id: 'c34_night', lines: [
      { narr: (g, M) => ({ all: '밤이 깊도록 아무도 돌아가지 않는다. 누가 라면을 끓인다. 냄비 하나에 젓가락이 모자란다.', one: '다들 돌아가고 한 사람만 남는다. 둘이서 지도를 한 번 더 본다. 말은 별로 없다.', alone: '다들 돌아간다. 문 닫히는 소리가 하나씩. 마지막 사람이 문간에서 돌아본다. 아무 말도 하지 않는다.' })[M.flags.goWith] },
      { who: 'arin', text: (g, M) => (M.flags.goWith === 'alone' ? '혼자 오지 마. …아니, 와. 어떻게 오든.' : '많이 데려오네. 좋다. 문 앞이 이렇게 북적인 적은 없었어.') },
      { sys: '5부 「봉쇄선 너머」 끝. 6부 「원초의 문」은 S급이 되면 열린다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const allies = P5_ALLIES(g, M); M.flags.allies = M.flags.goWith === 'alone' ? [] : M.flags.goWith === 'one' ? allies.slice(0, 1) : allies;
    M.part5 = { north: M.flags.northWay || 'late', circuit: !!M.flags.circuitCut, arin: M.flags.arinAsk || 'none', promise: !!M.flags.arinPromise, strait: M.flags.fight_c32_lord === 'win' ? 'player' : (M.flags.straitStrong ? 'strong' : 'other'), jin: M.flags.jinFate || 'gone', go: M.flags.goWith || 'alone', allies: M.flags.allies.length };
    if (M.flags.endSeed) g.rumor(`출정 전날 밤, ${g.player.name}이(가) "${({ close: '문을 닫겠다', open: '열 수도 있다', bridge: '잇는 길을 찾겠다' })[M.flags.endSeed] || '끝내겠다'}"고 말했다는 말이 돈다.`);
    g.lifeEvent(M.flags.goWith === 'alone' ? '제주로 가기 전날 밤, 모두를 돌려보냈다.' : `제주로 가기 전날 밤, ${M.flags.allies.length}명과 함께 가기로 했다.`);
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c34: 'missed', goWith: 'alone', allies: [] });
    M.part5 = { north: M.flags.northWay || 'late', circuit: !!M.flags.circuitCut, arin: M.flags.arinAsk || 'none', promise: !!M.flags.arinPromise, strait: M.flags.straitStrong ? 'strong' : 'other', jin: M.flags.jinFate || 'gone', go: 'alone', allies: 0 };
    return '모이자고 한 날이 지났다. 사람들이 하나둘 각자의 자리로 돌아갔다.';
  } },
});
