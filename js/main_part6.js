// ===== 메인 시나리오 6부 「원초의 문」 + 종장 S급 (영역 D, docs/메인_시나리오.md §3 · docs/메인_후속_작업지시.md §4) =====
// 5부 플래그(northWay·circuitCut·arinAsk·arinPromise·ringWhole·jinFate·goWith·allies·part5)와 그 이전 플래그를 읽는다.
// 엔딩 5종: seal(봉인) · bridge(다리) · open(개방) · sacrifice(희생) · other(남의 이야기). flags.main.ending, flags.won 유지.
const ES_WORD = { close: '닫겠다', open: '열 수도 있다', bridge: '잇는 길을 찾겠다' };
const ALLY_N = (M) => (M.flags.allies || []).length;
const HAS_ALLY = (M, k) => (M.flags.allies || []).includes(k);
const JIN_ALIVE = (M) => M.flags.jinFate === 'with' || M.flags.jinFate === 'jailed';
const FRIEND_ALIVE = (g, M) => { const f = g.mainWho('friend'); return !!f && (M.flags.friend3 === 'saved' || !!M.flags.friendBack); };
// 37장 "열겠다"를 고를 수 있는 조건: 사도(진서해와 동행) 또는 23장 동의 + 24장 신도 편
// 37장 "열겠다": 사도(33장 진서해와 동행 또는 히든 직업 심연의 사도) 또는 23장 동의 + 24장 신도 편
const CAN_OPEN = (M, g) => !!M.flags.apostle || !!(g && g.player && g.player.cls === 'apostle') || (M.flags.c23 === 'agree' && M.flags.c24 === 'join');
// 엔딩 판정 (조건 엄수)
const MAIN_ENDING = (g, M) => {
  const c = M.flags.gateChoice;
  if (c === 'open' && CAN_OPEN(M, g)) return 'open';
  if (c === 'bridge' && !M.flags.circuitCut && JIN_ALIVE(M) && FRIEND_ALIVE(g, M)) return 'bridge';
  // 희생은 "닫겠다" + 함께 온 동료 0명일 때만. 다리 조건이 모자라 닫히면 동료 수와 상관없이 봉인(실패 서사)
  if (c === 'close' && ALLY_N(M) === 0) return 'sacrifice';
  return 'seal';
};
const ENDINGS = {
  seal: { title: '봉인', eyebrow: '원초의 문 · 닫힌 문', sub: '저편은 끝나고, 이편의 각성은 천천히 저문다.', more: ['첫해에는 아무도 믿지 않았다. 게이트는 여전히 열렸다. 다만 조금씩 작아졌다. 셋째 해, 협회는 처음으로 "올해 신규 게이트 0건"인 달을 발표했다.', '마지막 각성자 세대가 늙어 간다. 아이들은 헌터를 옛날 직업으로 배운다. 그래도 가끔, 바닷가 아이들이 초록 물고기 꿈을 꾼다고 한다. 누가 웃는 꿈이라고.'], text: '문이 닫혔다. 저편은 조용히 끝났다. 에테르는 수십 년에 걸쳐 옅어지고, 게이트는 하나씩 사라진다. 각성자의 시대도 천천히 저문다. 문이 닫히기 직전, 아린은 웃었다.' },
  bridge: { title: '다리', eyebrow: '원초의 문 · 열린 길', sub: '두 세계가 숨을 나누고, 문 앞에 문지기가 남았다.', more: ['처음 건너온 저편 사람은 아이였다. 맨발로 한라산 능선에 서서, 처음 보는 파란 하늘에 울었다. 문지기가 그 아이에게 담요를 덮어 줬다.', '두 세계는 에테르를 반씩 나눈다. 게이트는 줄었고, 없어지지는 않았다. 헌터는 이제 괴수를 베는 사람이 아니라 길을 지키는 사람이다. 문 앞의 당신처럼.'], text: '문은 닫히지도 열리지도 않았다. 통로가 됐다. 두 세계가 에테르를 나누어 숨 쉰다. 문지기는 문 앞에 남았다. 가장 어렵고, 가장 따뜻한 결말.' },
  open: { title: '개방', eyebrow: '원초의 문 · 활짝 열린 문', sub: '모두가 각성했고, 절반이 돌아오지 못했다.', more: ['그날 이후 반도에는 비각성자가 없다. 경보는 울리지 않는다. 학교는 반이 비었다. 남은 아이들은 빈자리에 꽃을 놓고 수업을 듣는다.', '저편의 강은 완전히 말랐다. 마지막으로 넘어온 숨이 이쪽 사람들을 각성시켰다. 아린은 그 숨과 함께 사라졌다. 사람들은 그 이름을 모른다. 당신만 안다.'], text: '문이 끝까지 열렸다. 한반도의 모든 사람이 각성했다. 그리고 절반이 죽었다. 살아남은 사람들은 경보가 울려도 숨지 않는다. 숨을 사람이 남지 않았으니까.' },
  sacrifice: { title: '희생', eyebrow: '원초의 문 · 안쪽에서 닫힌 문', sub: '이름 하나가 추모비에 남고, 문 안쪽에 지키는 사람이 하나 늘었다.', more: ['추모비에는 이름 아래 한 줄이 더 있다. 누가 새겼는지 아무도 모른다. "문 안쪽에서 아직 지키는 중."', '비 오는 날이면 추모비 앞 웅덩이가 초록색으로 빛난다. 그 위로 두 사람 그림자가 비친다는 말이 있다. 하나는 열일곱쯤 된 여자아이고, 하나는 당신이다.'], text: '아무도 데려가지 않았다. 문과 함께 저편으로 넘어가, 안쪽에서 문을 닫았다. 한라산 아래 추모비에 이름 하나가 새겨졌다. 꽃이 마르지 않는다.' },
  other: { title: '남의 이야기', eyebrow: '원초의 문 · 조연의 기록', sub: '문을 닫은 건 다른 사람이었다.', more: ['뉴스는 그 사람의 이름을 크게 불렀다. 당신의 이름은 기사 맨 아래, "그 밖의 협력자" 줄에 작게 실렸다.', '그래도 그 사람은 인터뷰에서 한 번 당신 얘기를 했다. "그 사람이 먼저 길을 걸어 놨어요. 저는 따라갔을 뿐이에요."', '그 사람의 기록 마지막 장. "한라산 정상, 문 앞에 누가 놓고 간 컵라면이 하나 있었다. 오래된 것이었다. 누가 놓았는지 안다. 그 사람도 여기까지 오려고 했던 거다. 문을 닫으며 그 이름을 한 번 불렀다."'], text: '문을 닫은 건 다른 사람이었다. 그 이야기 속에서 당신은 조연이다. 몇 줄 안 되는, 그래도 빠지면 이야기가 성립하지 않는 조연.' },
};

// ---------- 35장 격리 섬 ----------
MAIN.ch(35, {
  part: 6, title: '격리 섬', rank: 6, after: 1, where: 'jeju',
  goal: '제주 상륙',
  scenes: [
    { id: 'c35_dock', lines: [
      { narr: '출항 전날 밤. 남해안 작은 포구. 빌린 배 한 척. 선체에 누가 분필로 적었다. "돌아올 것."' },
      { narr: (g, M) => (M.flags.leaderFate === 'retire' ? '분식집 "전단지"에서 보낸 도시락이 배에 실려 있다. 쪽지 한 장. "식기 전에."' : M.flags.leaderFate === 'dead' ? '배 앞머리에 붕대 한 롤을 묶는다. 바람에 풀리지 않게 두 번.' : '포구 가로등 아래에서 장비를 한 번 더 점검한다. 칼날 기름, 붕대, 코어 주머니. 첫 팀에서 배운 순서 그대로.') },
      { who: 'friend', when: (g, M) => FRIEND_ALIVE(g, M) && !HAS_ALLY(M, 'friend'), text: '(전화) 안 따라가는 거 나 원해서 아니다. 너 돌아올 자리 지키는 거야. …놀이터에서 기다릴게.' },
      { who: 'arin', text: '바다 건너는 거, 무섭지 않아? 나는 처음 건넜을 때 무서웠어. 그래서 울었어. 할아버지가 그걸 봤지.' },
    ], pause: { days: 1, label: '출항', text: '내일 새벽, 제주로 출항한다.' } },
    { id: 'c35_sea', lines: [
      { narr: '제주 해협. 바다가 검다. 섬 둘레로 관리국 함정들이 원을 그린다. 최후의 봉쇄선. 이십 년 동안 한 번도 풀린 적 없는 원.' },
      { narr: (g, M) => ({ all: `배 위에 ${ALLY_N(M)}명. 아무도 말이 없다. 각자 장비를 세 번씩 점검한다.`, one: '배 위에 둘. 한 사람이 키를 잡고, 한 사람이 섬을 본다.', alone: '배 위에 혼자. 엔진 소리가 유난히 크다.' })[M.flags.goWith || 'alone'] },
      { narr: '한라산 꼭대기. 구름 사이로 문이 보인다. 하늘까지 닿은 문. 꿈에서 본 그대로다.' },
    ] },
    { id: 'c35_line', lines: [
      { narr: '함정 확성기. "접근 금지 구역입니다. 즉시 회항하십시오." 세 번. 네 번째는 없다. 포문이 돌아간다.' },
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: '(무전) 동쪽 두 척, 지금 물러난다. 십오 분. 자네가 지나갈 만큼만 열어 두겠네.' },
    ], choices: [
      { text: '정면으로 뚫는다', set: { c35: 'front' }, next: 'c35_land',
        fight: (g, M) => ({ title: '최후의 봉쇄선', mobs: { tier: 7, n: g.mainState().flags.madoState === 'ally' ? 2 : 3, human: true, name: '관리국 봉쇄 함대' }, win: { text: '함정 한 척이 물러난다. 원에 틈이 생긴다.', gain: { fame: 15 } }, lose: { text: '배가 밀려난다. 해안 바위에 부딪치며 겨우 상륙한다. 장비 절반을 잃었다.', gain: { injure: 1 } } }) },
      { text: '서윤의 길 — 관리국 보급선 항로로', when: (g, M) => HAS_ALLY(M, 'seoyun') || SEO_ON5(M), set: { c35: 'seoyun' }, next: 'c35_land',
        say: [{ who: 'seoyun', text: '보급선 항로는 매주 목요일 새벽. 오늘이 목요일이에요. 이 길 아는 사람, 관리국에 저 말고 둘 남았어요.' }] },
      { text: '균열교의 길 — 흰 배들이 아는 물길로', when: (g, M) => M.flags.jinFate === 'with' || M.flags.jinBond === 'near' || !!M.flags.apostle, set: { c35: 'cult' }, next: 'c35_land',
        say: [{ narr: '흰 배 몇 척이 앞장선다. 함정들이 포문을 돌리다 멈춘다. 흰 배에 탄 사람들은 비각성자다. 쏠 수 없다.' }] },
    ] },
    { id: 'c35_land', lines: [
      { narr: (g, M) => ({ front: '상륙. 모래가 아니라 재다. 이십 년 쌓인 에테르 재. 밟으면 초록빛이 튄다.', seoyun: '보급선 부두. 녹슨 컨테이너에 관리국 마크. 안에는 이십 년 치 관측 장비. 아무도 쓰지 않았다.', cult: '흰 배들이 닿은 곳은 옛 어촌. 담벼락마다 갈라진 원이 그려져 있다. 신도들이 몇 년에 걸쳐 몰래 그린 것이다.' })[M.flags.c35] || '' },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '…여기야. 이 바다. 이십 년 만이야. 냄새가 그대로야.' },
      { who: JIN_FACE, when: (g, M) => M.flags.jinFate === 'with', text: '저는 여기서 마지막으로 웃었습니다. 그날 아침.' },
    ], pause: { days: 1, label: '한라산 아래', text: '해안에서 하룻밤. 내일, 산을 오른다.' } },
    { id: 'c35_radio', lines: [
      { narr: (g, M) => ({ front: '부서진 무전기에서 함정 쪽 교신이 새어 나온다. "상륙 인원 확인 불가. 추격 중지." 누군가 추격을 멈췄다.', seoyun: '보급선 부두 무전기. 서윤의 목소리. "관리국 채널은 제가 막았어요. 열두 시간."', cult: '흰 배 무전기에서 신도들의 노래가 낮게 흐른다. "선생님이 가신 길로." 누군가 진서해를 위해 기도한다.' })[M.flags.c35] || '무전기가 조용하다.' },
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: '(무전) 상륙 확인했네. 함대는 물렸다. 이제 자네와 문 사이엔 아무도 없어. 나도.' },
      { narr: '(무전) 구치소 교도관이 전한 마도현의 말. "섬에 닿았거든 첫날 밤은 바다 쪽을 보지 말라고 전해 주게."', when: (g, M) => M.flags.madoState === 'jailed' },
      { narr: (g, M) => (M.flags.endSeed ? `무전기를 끄고 바다를 본다. 친구에게 "${ES_WORD[M.flags.endSeed]}"고 했던 밤이 떠오른다. 그 말을 지키러 왔다.` : '무전기를 끄고 바다를 본다. 무엇을 하러 왔는지, 아직 한 문장으로 말할 수 없다.') },
      { narr: '해협 쪽 수평선이 아직 희미하게 빛난다. 진서해의 의식이 남긴 흉터다.', when: (g, M) => !!M.flags.straitRitual },
    ] },
    { id: 'c35_camp', lines: [
      { narr: '해안 캠프. 모닥불 대신 에테르 등. 바다 쪽에서 초록 물고기들이 튀어 오른다.' },
      { who: 'arin', text: (g, M) => (M.flags.arinFade ? '…들려? 나 아직 여기 있어. 목소리가 작아졌을 뿐이야.' : '가까워졌어. 이렇게 가까운 건 처음이야. 내일이면 얼굴 볼 수 있어.') },
    ], next: 'end' },
  ],
  done: (g, M) => { g.lifeEvent(({ front: '제주 최후의 봉쇄선을 정면으로 뚫었다.', seoyun: '한서윤의 길로 제주에 상륙했다.', cult: '균열교의 물길로 제주에 상륙했다.' })[M.flags.c35] || '제주에 상륙했다.'); g.rumor(`${g.player.name}이(가) 제주에 상륙했다. 이십 년 만에 봉쇄선이 뚫렸다.`); },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c35: 'missed', otherLanded: true });
    g.rumor('다른 원정대가 제주 봉쇄선을 넘었다. 한라산으로 향했다는 말이 돈다.');
    return '다른 원정대가 먼저 제주에 상륙했다는 소식.';
  } },
});

// ---------- 36장 한라 ----------
MAIN.ch(36, {
  part: 6, title: '한라', rank: 6, after: 0, where: 'jeju',
  goal: '한라산을 오른다',
  scenes: [
    { id: 'c36_road', lines: [
      { narr: '산길. 대붕괴 이전 등산로 표지판이 반쯤 묻혀 있다. 해발 칠백. 나무들이 모두 남쪽으로 기울었다. 문 쪽으로.' },
      { narr: '능선에서 뒤돌아보면 북동쪽 바다, 해협 쪽 하늘에 아직 균열의 잔광이 걸려 있다.', when: (g, M) => !!M.flags.straitRitual },
      { narr: (g, M) => (M.flags.otherLanded ? '앞서 오른 원정대의 흔적. 버려진 배낭. 그 안에 쓰다 만 편지. "엄마, 거의 다 왔어."' : '사람 발자국이 하나도 없다. 이십 년 동안 아무도 오르지 않은 길.') },
    ] },
    { id: 'c36_house', lines: [
      { narr: '중턱. 무너진 돌담집. 마당에 우물. 문패는 없다. 대신 조개껍데기 자국.' },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '우리 집이야. 여기서 그 애를 처음 봤어. 저 우물가에. 젖은 채로 울고 있었지.' },
      { narr: '강릉 방벽에 끼워 둔 조개껍데기 문패가 떠오른다. 여기가 그 문패의 자리였다.', when: (g, M) => M.flags.goJae !== 'alive' },
      { narr: '우물 바닥이 초록색으로 빛난다. 저편과 이어진 가장 오래된 틈이다.' },
    ] },
    { id: 'c36_talk', lines: [
      { narr: '우물가에서 마지막 쉼. 문 앞에서는 말할 틈이 없을 테니까, 한 사람씩 우물가로 와서 앉는다.', when: (g, M) => ALLY_N(M) > 0 },
      { narr: (g, M) => (M.flags.leaderFate === 'dead' ? '주머니 속 리더의 칼날 기름병을 만진다. 반쯤 남았다.' : '혼자다. 우물에 돌을 하나 떨어뜨린다. 소리가 돌아오지 않는다.'), when: (g, M) => ALLY_N(M) === 0 },
    ] },
    { id: 'c36_w_leader', skip: (g, M) => !HAS_ALLY(M, 'leader'), lines: [
      { who: 'leader', text: (g, M) => g.mainReg({ haera: '전단지 안 버리던 놈이 여기까지 왔다. …내가 가르친 게 하나라도 있었으면 됐다.', haeyo: '전단지 안 버리던 사람이 여기까지 왔네요. 제가 가르친 게 하나라도 있었으면 됐어요.', short: '여기까지 왔다. 됐다.' }, g.mainWho('leader')) },
      { who: 'leader', text: (g, M) => g.mainReg(M.flags.endSeed === 'close' ? { haera: '닫겠다고 했다며. 닫고 내려와라. 문 앞에 서 있지 말고.', haeyo: '닫겠다고 하셨다면서요. 닫고 내려오세요. 문 앞에 서 있지 말고요.', short: '닫고 내려와.' } : { haera: '네가 뭘 고르든 난 무전기 앞에 있는다. 그거 하나만 약속한다.', haeyo: '뭘 고르시든 저는 무전기 앞에 있을게요. 그거 하나만 약속해요.', short: '무전기 앞에 있는다.' }, g.mainWho('leader')) },
    ] },
    { id: 'c36_w_rival', skip: (g, M) => !HAS_ALLY(M, 'rival'), lines: [
      { who: 'rival', text: '시험 날 컵라면, 내가 산다고 해 놓고 네가 샀잖아. 이번엔 내가 산다. 내려가면.' },
      { who: 'rival', text: (g, M) => RIVAL_LINE(g, M, { kama: '관리국은 나를 잘랐다. 너 따라왔다고. 처음으로 잘 잘렸다고 생각했다.', cult: '선생님 길이 맞는지 아직 모르겠어. 근데 네 길 끝은 보고 싶어.', solo: '혼자 다니던 놈이 둘이 됐다. 이상하게 덜 무섭다.', alone: '나 이번엔 안 도망갔다. 기억해 둬.', none: '내려가면 고기다.' }) },
    ] },
    { id: 'c36_w_seoyun', skip: (g, M) => !HAS_ALLY(M, 'seoyun'), lines: [
      { who: 'seoyun', text: '처음 만났을 때 꿈을 꾸냐고 물었죠. 저도 꿔요. 영점 세대니까. 그 꿈 끝을 같이 보고 싶었어요.' },
      { who: 'seoyun', text: (g, M) => (M.flags.seoyunBurned ? '관리국에서 잘린 날, 처음으로 아침까지 잤어요. 꿈도 안 꾸고.' : '감시 보고서는 이제 안 써요. 대신 일기를 써요. 첫 줄은 늘 당신 이름이에요.') },
    ] },
    { id: 'c36_w_friend', skip: (g, M) => !HAS_ALLY(M, 'friend'), lines: [
      { who: 'friend', text: '놀이터 미끄럼틀 기억나? 꼭대기에서 뛰어내릴 때 너 항상 내 손 잡았잖아. 오늘도 잡아.' },
      { who: 'friend', text: (g, M) => (M.flags.endSeed ? `옥상에서 너 "${ES_WORD[M.flags.endSeed]}"고 했지. 그 말 아직 그대로야? …대답 안 해도 돼. 문 앞에서 보면 알겠지.` : '옥상에서 못 한 얘기, 내려가서 마저 하자.') },
    ] },
    { id: 'c36_w_jin', skip: (g, M) => !HAS_ALLY(M, 'jin'), lines: [
      { who: JIN_FACE, text: '아린한테 백두 번째 사과를 하러 갑니다. 이번엔 얼굴 보고.' },
      { who: JIN_FACE, text: '숨이 짧아요. 정상까지는 갑니다. 그다음은 장담 못 해요. 그래도 괜찮습니다. 이십 년 전에 끝났어야 할 숨이니까.' },
    ] },
    { id: 'c36_w_empty', skip: (g, M) => M.flags.leaderFate !== 'dead', lines: [
      { narr: '우물가에 자리 하나가 비어 있다. 아무도 그 자리에 앉지 않는다. 리더가 앉았을 자리다.' },
      { narr: '붕대 한 롤을 그 자리에 놓는다. 바람이 붕대 끝을 문 쪽으로 날린다.' },
    ] },
    { id: 'c36_memory', lines: [
      { narr: '해발 천오백. 숨이 차다. 걸음마다 지나온 장면이 하나씩 떠오른다.' },
      { narr: (g, M) => (M.flags.c1_kid ? '첫 해 겨울. 전단지를 쥐고 서 있던 아이. 그 아이 얼굴이 이제 잘 기억나지 않는다. 그래서 더 미안하다.' : '처음 협회에 등록하던 날. 손이 떨려 서명을 두 번 했다.') },
      { narr: (g, M) => (M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '연희네 급식소의 국. 그 냄새가 이 높이까지 따라온다.' : M.flags.foodHall === 'burned' ? '불탄 급식소 간판. 그 앞을 지나며 아무것도 하지 못했던 날.' : '강북의 컵라면 천막.') },
      { narr: (g, M) => (M.flags.kwon === 'dead' ? '폐역 앞줄에서 쓰러진 권만석. 하은이 들고 있던 영정.' : '보름 밤의 촛불 줄. 땅속으로 내려가던 사람들.') },
      { narr: '그리고 꿈. 처음 바다가 발목까지 찼던 밤. 그 꿈의 끝이 저 위에 있다.' },
    ], pause: { days: 1, label: '정상', text: '하룻밤 더. 새벽에 정상에 오른다.' } },
    { id: 'c36_ridge', lines: [
      { narr: '새벽. 정상 능선. 백록담 자리에 호수 대신 문이 서 있다. 문틀은 돌도 쇠도 아니다. 반쪽 원과 같은 재질.' },
      { narr: '문 앞에 무언가 웅크리고 있다. 산만 한 것. 숨을 쉴 때마다 문이 흔들린다. 심연의 군주. 아직 자고 있다.' },
      { narr: (g, M) => (M.flags.circuitCut ? '군주의 숨이 얕다. 북쪽 줄이 끊긴 뒤로.' : '군주의 숨이 깊다. 북쪽에서 흘러온 숨을 아직 먹고 있다.') },
    ], next: 'end' },
  ],
  done: (g, M) => g.lifeEvent('한라산 정상, 원초의 게이트 앞에 섰다.'),
  expire: { months: 6, run: (g, M) => { Object.assign(M.flags, { c36: 'missed' }); return '한라산 기슭에서 오래 머뭇거렸다. 문은 기다려 주지 않는다.'; } },
});

// ---------- 37장 문 앞에서 ----------
MAIN.ch(37, {
  part: 6, title: '문 앞에서', rank: 6, after: 0, where: 'jeju',
  goal: '원초의 게이트 앞',
  scenes: [
    { id: 'c37_arin', lines: [
      { art: 'arin-material', narr: '문틈에서 빛이 새어 나온다. 그 빛이 사람 모양으로 선다. 열일곱쯤. 물속처럼 흔들리는 머리카락.' },
      { who: 'arin', text: '왔구나. 이번엔 꿈이 아니야.' },
      { who: 'arin', when: (g) => g.player.cls === 'gatekeeper', text: '…너, 문지기구나. 첫 문의 잔해가 너를 골랐어. 그 파편은 내가 처음 넘어올 때 부서진 문 조각이야. 그래서 네 손이 이 문을 알아.' },
      { who: 'arin', when: (g) => g.player.cls === 'heir', text: '그 사람들이 너를 억지로 깨웠지. 대붕괴의 아이. …괜찮아. 억지로 깬 것도 깬 거야. 여기선 그게 힘이 돼.' },
      { narr: (g, M) => (M.flags.ringWhole ? '손안의 원이 빛난다. 아린이 그걸 보고 웃는다. "그거 있으면 다리를 놓을 수 있어. 할아버지가 본 거."' : M.flags.halfRing ? '주머니 속 반쪽 원이 떨린다. 아린의 손에 나머지 반쪽이 있다.' : '아린의 손이 비어 있다. 당신 손도.') },
      { who: 'arin', text: (g, M) => (M.flags.arinPromise ? ({ close: '약속, 기억해? 닫아 달라고 했던 거. …아직 그 말 그대로야.', bridge: '약속했지. 다리. 여기까지 왔으니까 해 볼 수 있어.', open: '약속했지. 열게 둬 달라고. …정말 괜찮아?' })[M.flags.arinAsk] || '약속, 기억해?' : '약속은 안 했지. 그래도 와 줬어. 이제 정해 줘.') },
      { who: 'arin', when: (g, M) => !!(M.prevRun && M.prevRun.ending), text: (g, M) => `이상하지. 너를 처음 보는데, 네가 이 문 앞에서 「${(ENDINGS[M.prevRun.ending] || {}).title || '다른 끝'}」을 고르는 걸 본 것 같아. 이번엔… 어떻게 할 거야?` },
      { who: 'arin', when: (g) => !!(g.flags.story && g.flags.story.nuri === 'returned'), text: '누리가 돌아와서 네 얘기를 했어. 그 작은 게 하루 종일 떠들었어. 그래서 기다릴 수 있었어.' },
      { narr: '어깨 위 누리가 문을 향해 깜빡인다. 아린이 누리를 보고 웃는다. "너, 거기 있었구나. 보고는 안 와도 돼. 이제 다 봤어."', when: (g) => !!(g.flags.story && g.flags.story.nuri === 'stayed') },
    ] },
    { id: 'c37_echo', lines: [
      { narr: (g, M) => (M.flags.arinFade ? '아린의 윤곽이 군데군데 비어 있다. 오래 기다린 탓이다. 목소리가 바람보다 작다.' : '아린의 발밑에 그림자가 있다. 저편에서 처음 생겼던 그 그림자.') },
      { narr: (g, M) => (M.flags.ringWhole ? '손안의 원을 아린의 손바닥에 대 본다. 문틀이 그 모양을 알아보고 낮게 운다. 맞물릴 자리가 있다.' : M.flags.halfRing ? '반쪽 원을 아린의 반쪽에 대 본다. 끝이 맞지 않는다. 저편에서 맞대지 못한 탓이다. 그래도 둘 다 따뜻해진다.' : '빈손을 내민다. 아린이 그 손을 잡는다. 원 같은 건 없어도 된다는 듯이.') },
      { who: 'arin', when: (g, M) => !!M.flags.arinPromise, text: '약속한 날이야. 기억해 줘서 고마워. 지켜도, 못 지켜도.' },
      { who: 'arin', when: (g, M) => !M.flags.arinPromise && M.flags.c20, text: (g, M) => ({ world: '꿈에서 내가 우리 세계 얘기를 했지. 초록 바다, 하늘의 강. 다 진짜였어. 이제 거의 없지만.', why: '왜 너냐고 물었었지. 아직 대답이 같아. 그냥 그렇게 됐어. 미안하고, 고마워.', jin: '그 사람 얘기를 물었었지. 그 사람… 오고 있어? 아니면 이미 갔어?' })[M.flags.c20] || '…' },
    ] },
    { id: 'c37_memory', lines: [
      { who: 'arin', text: '보여 줄게. 그날.' },
      { art: 'jin-young', narr: '문이 투명해진다. 이십 년 전 제주 앞바다. 관측선 갑판. 흰 가운의 젊은 진서해가 헤드셋을 쥐고 있다. 옆에서 젊은 마도현이 시계를 본다. 구석에서 젊은 윤해람이 기록을 한다.' },
      { narr: '헤드셋에서 아이 목소리. "안녕?" 진서해가 웃는다. 울 것 같은 얼굴로. "안녕. 들려?"' },
      { art: 'mado-young', narr: '마도현이 손을 든다. "증폭." 진서해가 고개를 젓는다. 마도현이 직접 다이얼을 돌린다. 바다가 갈라진다.' },
      { who: 'arin', text: '그 사람들 미워하지 마. 둘 다 그날 무서웠어. 한 사람은 놓칠까 봐, 한 사람은 잡을까 봐.' },
      { who: JIN_FACE, when: (g, M) => M.flags.jinFate === 'with', text: '…저 다이얼, 제가 돌릴 수도 있었어요. 도현이가 먼저 돌렸을 뿐이에요. 그걸 이십 년 동안 모른 척했습니다.' },
    ] },
    { id: 'c37_choose', lines: [
      { narr: '문, 군주, 아린. 그리고 당신. 이십 년 동안 이 자리에 선 사람은 없었다.' },
      { sys: (g, M) => `지금 가진 것 — 북쪽 줄: ${M.flags.circuitCut ? '끊음' : '살아 있음'} · 진서해: ${JIN_ALIVE(M) ? '살아 있음' : '없음'} · 친구: ${FRIEND_ALIVE(g, M) ? '살아 있음' : '곁에 없음'} · 함께 온 사람: ${ALLY_N(M)}명` },
      { narr: '심연의 사도의 힘이 문 쪽으로 기운다. 여는 손이 될 수 있다는 걸 몸이 안다.', when: (g) => g.player.cls === 'apostle' },
    ], choices: [
      { text: '"닫겠다."', set: { gateChoice: 'close' }, next: 'c37_after' },
      { text: '"함께 사는 길을 찾겠다."', set: { gateChoice: 'bridge' }, next: 'c37_after' },
      { text: '"열겠다."', when: (g, M) => CAN_OPEN(M, g), set: { gateChoice: 'open' }, next: 'c37_after' },
    ] },
    { id: 'c37_after', lines: [
      { who: 'arin', text: (g, M) => ({ close: '…응. 그래. 고마워. 끝까지 옆에 있을게.', bridge: '다리. 그래. 그럼 저 문지기부터 재워야 해. 죽이지 말고. 할 수 있겠어?', open: '그 사람 꿈이네. …알았어. 그럼 저 문지기를 넘어야 해.' })[M.flags.gateChoice] },
      { narr: (g, M) => (M.flags.arinAsk === M.flags.gateChoice ? '아린이 부탁한 길이다. 약속을 지켰다. 아린이 눈을 감는다. 안도하는 얼굴로.' : '아린이 부탁한 길이 아니다. 아린이 잠깐 입술을 깨문다. 그리고 고개를 끄덕인다. 네가 정한 거니까.'), when: (g, M) => !!M.flags.arinPromise && !!M.flags.arinAsk },
      { narr: '문지기의 손이 저절로 문틀을 향한다. 히든 직업이 이 순간을 알고 있었다.', when: (g) => g.player.cls === 'gatekeeper' },
      { narr: '몸속 실험의 열이 문 쪽으로 끌린다. 억지로 깬 힘이 처음으로 제자리를 찾는다.', when: (g) => g.player.cls === 'heir' },
      { who: JIN_FACE, when: (g, M) => HAS_ALLY(M, 'jin') || M.flags.jinFate === 'with', text: (g, M) => (M.flags.gateChoice === 'open' ? '…고맙습니다. 그리고 미안합니다. 둘 다 진심이에요.' : '그 선택이면 제가 틀렸던 거군요. 다행입니다.') },
      { narr: '군주가 눈을 뜬다. 문이 흔들린다. 산 전체가 숨을 들이쉰다.' },
    ] },
    { id: 'c37_stand', lines: [
      { narr: (g, M) => (ALLY_N(M) >= 3 ? '동료들이 말없이 자리를 잡는다. 왼쪽, 오른쪽, 뒤. 첫 팀에서 배운 대형 그대로. 누가 가르친 것도 아닌데.' : ALLY_N(M) ? '함께 온 사람이 당신 등 뒤에 선다. 등이 따뜻하다.' : '혼자 선다. 등 뒤가 춥다. 그래도 발은 떨리지 않는다.') },
      { who: 'rival', when: (g, M) => HAS_ALLY(M, 'rival'), text: '시험 날처럼 하자. 너 앞, 나 뒤.' },
      { who: 'seoyun', when: (g, M) => HAS_ALLY(M, 'seoyun'), text: '기록은 제가 할게요. 이번엔 지우지 않을 기록이에요.' },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '나는 여기서 본다. 그날처럼. 이번엔 끝까지 본다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 4);
    M.flags.voiceEnd = M.flags.gateChoice;
    if (M.flags.arinPromise && M.flags.arinAsk) M.flags.promiseKept = M.flags.arinAsk === M.flags.gateChoice;
    g.lifeEvent(({ close: '원초의 게이트 앞에서 문을 닫겠다고 했다.', bridge: '원초의 게이트 앞에서 함께 사는 길을 찾겠다고 했다.', open: '원초의 게이트 앞에서 문을 열겠다고 했다.' })[M.flags.gateChoice]);
  },
  // 문 앞에서 너무 오래 머뭇거리면: 아린이 스스로 문을 닫기 시작한다(닫기로 고정, 아린이 흐려진다)
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c37: 'missed', gateChoice: 'close', voiceEnd: 'close', arinFade: true });
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 4);
    g.lifeEvent('문 앞에서 머뭇거리는 사이 아린이 스스로 문을 닫기 시작했다.');
    return '한라산 정상에서 빛이 약해졌다는 소식. 문이 안쪽에서부터 닫히고 있다.';
  } },
});

// ---------- 38장 심연의 군주 ----------
const LORD_FIGHT = (g) => {
  const M = g.mainState(); const strong = (M.flags.circuitCut ? 0 : 1) + (M.flags.straitStrong || M.flags.ritualDone ? 1 : 0);
  const ak = (M.flags.allies || [])[0]; const an = ak === 'leader' || ak === 'rival' || ak === 'friend' || ak === 'seoyun' ? g.mainWho(ak) : null;
  return { title: '심연의 군주', lethal: false, mobs: { tier: 7, n: 1 + strong, boss: true, elem: 'dark', name: '[최종] 심연의 군주' },
    ally: an && an.id != null ? { name: an.name, rank: an.rankIdx, elem: an.element } : undefined,
    win: { text: ALLY_N(M) >= 3 ? '세 방향에서 동시에 파고든다. 첫 팀에서 배운 대형 그대로. 군주가 무릎을 꿇는다. 산이 조용해진다.' : ALLY_N(M) ? '둘이 등을 맞댄다. 하나가 막고 하나가 벤다. 군주가 무릎을 꿇는다. 문이 처음으로 가만히 선다.' : '혼자다. 그래서 물러설 곳도 없다. 마지막 일격에 군주가 무릎을 꿇는다. 문이 처음으로 가만히 선다.', gain: { fame: 100 } }, lose: { text: '군주의 숨에 밀려 능선 아래로 구른다. 아직 끝나지 않았다.', gain: { injure: 1 } } };
};
MAIN.ch(38, {
  part: 6, title: '심연의 군주', rank: 6, after: 0, where: 'jeju',
  goal: '심연의 군주',
  scenes: [
    { id: 'c38_ready', lines: [
      { narr: '군주의 그림자가 능선 전체를 덮는다. 그 안에서는 해가 보이지 않는다.' },
      { narr: (g, M) => (M.flags.straitStrong || M.flags.ritualDone ? '군주의 등에서 해협의 노래가 흘러나온다. 진서해의 의식이 남긴 것이다. 놈이 더 크다.' : M.flags.fight_c32_lord === 'win' ? '군주의 옆구리에 오래된 흉터. 해협에서 당신이 남긴 자리다. 놈도 기억한다.' : '군주의 숨이 바람이 된다. 머리카락이 문 쪽으로 빨려 간다.') },
      { who: 'arin', text: '저건 우리 쪽 마지막 숨으로 만든 거야. 아파하지 않게… 아니, 그냥 이겨 줘.' },
      { who: 'rival', when: (g, M) => HAS_ALLY(M, 'rival'), text: '왼쪽은 내가 맡는다. 시험 날처럼.' },
      { who: 'seoyun', when: (g, M) => HAS_ALLY(M, 'seoyun'), text: '숨 쉬는 박자 세고 있어요. 세 번 들이쉬고 한 번 멈춰요. 멈출 때예요.' },
      { who: 'friend', when: (g, M) => HAS_ALLY(M, 'friend'), text: '나 뒤에 있을게. 무서우면 손 뒤로 뻗어.' },
      { narr: '아무도 대답하지 않는다. 대신 바람이 등을 민다.', when: (g, M) => ALLY_N(M) === 0 },
    ] },
    { id: 'c38_wake', lines: [
      { narr: '군주가 일어선다. 문을 등지고. 지키는 자세다.' },
      { who: { name: '심연의 군주', sub: '문지기' }, text: (g, M) => ({ close: '닫으려는 손. …그래, 그것도 지키는 방법이다. 지나가 보아라.', bridge: '잇겠다고? 이십 년 동안 그 말을 한 자는 없었다. 증명해라.', open: '여는 손. 저편의 마지막 숨까지 가져가려는 손. 지나가지 못한다.' })[M.flags.gateChoice] || '…' },
      { narr: (g, M) => (M.flags.circuitCut ? '군주의 목소리가 갈라진다. 북쪽 줄이 끊긴 탓이다.' : '군주의 목소리가 산을 울린다. 북쪽에서 흘러온 숨이 아직 가득하다.') },
      { narr: (g, M) => (ALLY_N(M) ? `${ALLY_N(M)}명이 당신 양옆에 선다.` : '양옆이 비어 있다. 바람만 지나간다.') },
    ], choices: [
      { text: '문지기에게 맞선다', next: 'c38_check', fight: (g) => LORD_FIGHT(g) },
    ] },
    { id: 'c38_check', lines: [
      { narr: '군주가 두 번째 숨을 들이쉰다. 몸의 초록 빛줄기가 붉게 바뀐다. 문을 지키는 마지막 힘이다.', when: (g, M) => !(M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win') },
      { narr: (g, M) => (M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win' ? '군주가 쓰러진다. 문이 기다린다.' : '능선 아래. 숨을 고른다. 위에서 군주가 기다린다. 문 앞을 비우지 않는다.') },
    ], choices: [
      { text: '다시 오른다', when: (g, M) => !(M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win'), next: 'c38_check', fight: (g) => LORD_FIGHT(g) },
      { text: '문으로 간다', when: (g, M) => M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win', set: { lordDown: true }, next: 'c38_last' },
    ] },
    { id: 'c38_last', lines: [
      { narr: '쓰러진 군주의 눈이 아직 열려 있다. 그 눈에 저편의 회색 하늘이 비친다.' },
      { who: { name: '심연의 군주', sub: '문지기' }, when: (g) => g.player.cls === 'gatekeeper', text: '같은 일을 하는 자였구나. 문지기가 문지기를 쓰러뜨렸다. …그럼 이 문은 이제 네 것이다.' },
      { who: { name: '심연의 군주', sub: '문지기' }, text: (g, M) => ({ close: '…닫아라. 이제 붙잡지 않아도 되는구나. 이십 년. 무거웠다.', bridge: '잇는다면… 내 자리를 넘겨주마. 문지기는 문을 미워하면 안 된다. 기억해라.', open: '열면… 우리 쪽 마지막 숨이 너희에게 간다. 잘 써라. 그게 우리 전부다.' })[M.flags.gateChoice] || '…' },
      { narr: '군주의 몸이 초록 모래로 흩어진다. 바람이 그 모래를 문 안쪽으로 데려간다. 집으로.' },
    ] },
    { id: 'c38_quiet', lines: [
      { narr: '정적. 산 위에 처음으로 새소리가 들린다. 이십 년 만에 이 섬에 날아든 새.' },
      { narr: (g, M) => (ALLY_N(M) ? '동료들이 주저앉는다. 누군가 웃는다. 누군가 운다. 둘 다 같은 사람일지도.' : '혼자 주저앉는다. 하늘이 파랗다. 이렇게 파란 걸 언제 봤는지 기억나지 않는다.') },
      { who: 'leader', when: (g, M) => M.flags.leaderFate === 'hurt' || M.flags.leaderFate === 'retire', text: (g, M) => g.mainReg({ haera: '(무전) 들린다. 다 들렸다. …잘했다.', haeyo: '(무전) 들려요. 다 들렸어요. …잘했어요.', short: '(무전) 잘했다.' }, g.mainWho('leader')) },
    ], next: 'end' },
  ],
  done: (g, M) => g.lifeEvent('원초의 게이트를 지키던 심연의 군주를 쓰러뜨렸다.'),
});

