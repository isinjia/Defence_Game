// ===== 메인 시나리오 6부 「원초의 문」 + 종장 S급 (영역 D, docs/메인_시나리오.md §3 · docs/메인_후속_작업지시.md §4) =====
// 5부 플래그(northWay·circuitCut·arinAsk·arinPromise·ringWhole·jinFate·goWith·allies·part5)와 그 이전 플래그를 읽는다.
// 엔딩 5종: seal(봉인) · bridge(다리) · open(개방) · sacrifice(희생) · other(남의 이야기). flags.main.ending, flags.won 유지.
const ALLY_N = (M) => (M.flags.allies || []).length;
const HAS_ALLY = (M, k) => (M.flags.allies || []).includes(k);
const JIN_ALIVE = (M) => M.flags.jinFate === 'with' || M.flags.jinFate === 'jailed';
const FRIEND_ALIVE = (g, M) => { const f = g.mainWho('friend'); return !!f && (M.flags.friend3 === 'saved' || !!M.flags.friendBack); };
// 37장 "열겠다"를 고를 수 있는 조건: 사도(진서해와 동행) 또는 23장 동의 + 24장 신도 편
const CAN_OPEN = (M) => !!M.flags.apostle || (M.flags.c23 === 'agree' && M.flags.c24 === 'join');
// 엔딩 판정 (조건 엄수)
const MAIN_ENDING = (g, M) => {
  const c = M.flags.gateChoice;
  if (c === 'open' && CAN_OPEN(M)) return 'open';
  if (c === 'bridge' && !M.flags.circuitCut && JIN_ALIVE(M) && FRIEND_ALIVE(g, M)) return 'bridge';
  if (ALLY_N(M) === 0) return 'sacrifice';
  return 'seal';
};
const ENDINGS = {
  seal: { title: '봉인', text: '문이 닫혔다. 저편은 조용히 끝났다. 에테르는 수십 년에 걸쳐 옅어지고, 게이트는 하나씩 사라진다. 각성자의 시대도 천천히 저문다. 문이 닫히기 직전, 아린은 웃었다.' },
  bridge: { title: '다리', text: '문은 닫히지도 열리지도 않았다. 통로가 됐다. 두 세계가 에테르를 나누어 숨 쉰다. 문지기는 문 앞에 남았다. 가장 어렵고, 가장 따뜻한 결말.' },
  open: { title: '개방', text: '문이 끝까지 열렸다. 한반도의 모든 사람이 각성했다. 그리고 절반이 죽었다. 살아남은 사람들은 경보가 울려도 숨지 않는다. 숨을 사람이 남지 않았으니까.' },
  sacrifice: { title: '희생', text: '아무도 데려가지 않았다. 문과 함께 저편으로 넘어가, 안쪽에서 문을 닫았다. 한라산 아래 추모비에 이름 하나가 새겨졌다. 꽃이 마르지 않는다.' },
  other: { title: '남의 이야기', text: '문을 닫은 건 다른 사람이었다. 그 이야기 속에서 당신은 조연이다. 몇 줄 안 되는, 그래도 빠지면 이야기가 성립하지 않는 조연.' },
};

// ---------- 35장 격리 섬 ----------
MAIN.ch(35, {
  part: 6, title: '격리 섬', rank: 6, after: 1, where: 'jeju',
  goal: '제주 상륙',
  scenes: [
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
      { narr: (g, M) => (M.flags.otherLanded ? '앞서 오른 원정대의 흔적. 버려진 배낭. 그 안에 쓰다 만 편지. "엄마, 거의 다 왔어."' : '사람 발자국이 하나도 없다. 이십 년 동안 아무도 오르지 않은 길.') },
    ] },
    { id: 'c36_house', lines: [
      { narr: '중턱. 무너진 돌담집. 마당에 우물. 문패는 없다. 대신 조개껍데기 자국.' },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '우리 집이야. 여기서 그 애를 처음 봤어. 저 우물가에. 젖은 채로 울고 있었지.' },
      { narr: '강릉 방벽에 끼워 둔 조개껍데기 문패가 떠오른다. 여기가 그 문패의 자리였다.', when: (g, M) => M.flags.goJae !== 'alive' },
      { narr: '우물 바닥이 초록색으로 빛난다. 저편과 이어진 가장 오래된 틈이다.' },
    ] },
    { id: 'c36_talk', lines: [
      { narr: '우물가에서 마지막 쉼. 다들 한마디씩 한다. 문 앞에서는 말할 틈이 없을 테니까.', when: (g, M) => ALLY_N(M) > 0 },
      { who: 'leader', when: (g, M) => HAS_ALLY(M, 'leader'), text: (g, M) => g.mainReg({ haera: '전단지 안 버리던 놈이 여기까지 왔다. …내가 가르친 게 하나라도 있었으면 됐다.', haeyo: '전단지 안 버리던 사람이 여기까지 왔네요. 제가 가르친 게 하나라도 있었으면 됐어요.', short: '여기까지 왔다. 됐다.' }, g.mainWho('leader')) },
      { who: 'rival', when: (g, M) => HAS_ALLY(M, 'rival'), text: '시험 날 컵라면, 내가 산다고 해 놓고 네가 샀잖아. 이번엔 내가 산다. 내려가면.' },
      { who: 'seoyun', when: (g, M) => HAS_ALLY(M, 'seoyun'), text: '처음 만났을 때 꿈을 꾸냐고 물었죠. 저도 꿔요. 영점 세대니까. 그 꿈 끝을 같이 보고 싶었어요.' },
      { who: 'friend', when: (g, M) => HAS_ALLY(M, 'friend'), text: '놀이터 미끄럼틀 기억나? 꼭대기에서 뛰어내릴 때 너 항상 내 손 잡았잖아. 오늘도 잡아.' },
      { who: JIN_FACE, when: (g, M) => HAS_ALLY(M, 'jin'), text: '아린한테 백두 번째 사과를 하러 갑니다. 이번엔 얼굴 보고.' },
      { narr: (g, M) => (M.flags.leaderFate === 'dead' ? '주머니 속 리더의 칼날 기름병을 만진다. 반쯤 남았다.' : '혼자다. 우물에 돌을 하나 떨어뜨린다. 소리가 돌아오지 않는다.'), when: (g, M) => ALLY_N(M) === 0 },
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
      { narr: '문틈에서 빛이 새어 나온다. 그 빛이 사람 모양으로 선다. 열일곱쯤. 물속처럼 흔들리는 머리카락.' },
      { who: 'arin', text: '왔구나. 이번엔 꿈이 아니야.' },
      { narr: (g, M) => (M.flags.ringWhole ? '손안의 원이 빛난다. 아린이 그걸 보고 웃는다. "그거 있으면 다리를 놓을 수 있어. 할아버지가 본 거."' : M.flags.halfRing ? '주머니 속 반쪽 원이 떨린다. 아린의 손에 나머지 반쪽이 있다.' : '아린의 손이 비어 있다. 당신 손도.') },
      { who: 'arin', text: (g, M) => (M.flags.arinPromise ? ({ close: '약속, 기억해? 닫아 달라고 했던 거. …아직 그 말 그대로야.', bridge: '약속했지. 다리. 여기까지 왔으니까 해 볼 수 있어.', open: '약속했지. 열게 둬 달라고. …정말 괜찮아?' })[M.flags.arinAsk] || '약속, 기억해?' : '약속은 안 했지. 그래도 와 줬어. 이제 정해 줘.') },
    ] },
    { id: 'c37_choose', lines: [
      { narr: '문, 군주, 아린. 그리고 당신. 이십 년 동안 이 자리에 선 사람은 없었다.' },
    ], choices: [
      { text: '"닫겠다."', set: { gateChoice: 'close' }, next: 'c37_after' },
      { text: '"함께 사는 길을 찾겠다."', set: { gateChoice: 'bridge' }, next: 'c37_after' },
      { text: '"열겠다."', when: (g, M) => CAN_OPEN(M), set: { gateChoice: 'open' }, next: 'c37_after' },
    ] },
    { id: 'c37_after', lines: [
      { who: 'arin', text: (g, M) => ({ close: '…응. 그래. 고마워. 끝까지 옆에 있을게.', bridge: '다리. 그래. 그럼 저 문지기부터 재워야 해. 죽이지 말고. 할 수 있겠어?', open: '그 사람 꿈이네. …알았어. 그럼 저 문지기를 넘어야 해.' })[M.flags.gateChoice] },
      { who: JIN_FACE, when: (g, M) => HAS_ALLY(M, 'jin') || M.flags.jinFate === 'with', text: (g, M) => (M.flags.gateChoice === 'open' ? '…고맙습니다. 그리고 미안합니다. 둘 다 진심이에요.' : '그 선택이면 제가 틀렸던 거군요. 다행입니다.') },
      { narr: '군주가 눈을 뜬다. 문이 흔들린다. 산 전체가 숨을 들이쉰다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 4);
    M.flags.voiceEnd = M.flags.gateChoice;
    g.lifeEvent(({ close: '원초의 게이트 앞에서 문을 닫겠다고 했다.', bridge: '원초의 게이트 앞에서 함께 사는 길을 찾겠다고 했다.', open: '원초의 게이트 앞에서 문을 열겠다고 했다.' })[M.flags.gateChoice]);
  },
});

// ---------- 38장 심연의 군주 ----------
const LORD_FIGHT = (g) => {
  const M = g.mainState(); const strong = (M.flags.circuitCut ? 0 : 1) + (M.flags.straitStrong || M.flags.ritualDone ? 1 : 0);
  const ak = (M.flags.allies || [])[0]; const an = ak === 'leader' || ak === 'rival' || ak === 'friend' || ak === 'seoyun' ? g.mainWho(ak) : null;
  return { title: '심연의 군주', lethal: false, mobs: { tier: 7, n: 1 + strong, boss: true, elem: 'dark', name: '[최종] 심연의 군주' },
    ally: an && an.id != null ? { name: an.name, rank: an.rankIdx, elem: an.element } : undefined,
    win: { text: '군주가 무릎을 꿇는다. 산이 조용해진다. 문이 처음으로 가만히 선다.', gain: { fame: 100 } }, lose: { text: '군주의 숨에 밀려 능선 아래로 구른다. 아직 끝나지 않았다.', gain: { injure: 1 } } };
};
MAIN.ch(38, {
  part: 6, title: '심연의 군주', rank: 6, after: 0, where: 'jeju',
  goal: '심연의 군주',
  scenes: [
    { id: 'c38_wake', lines: [
      { narr: '군주가 일어선다. 문을 등지고. 지키는 자세다.' },
      { who: { name: '심연의 군주', sub: '문지기' }, text: (g, M) => ({ close: '닫으려는 손. …그래, 그것도 지키는 방법이다. 지나가 보아라.', bridge: '잇겠다고? 이십 년 동안 그 말을 한 자는 없었다. 증명해라.', open: '여는 손. 저편의 마지막 숨까지 가져가려는 손. 지나가지 못한다.' })[M.flags.gateChoice] || '…' },
      { narr: (g, M) => (M.flags.circuitCut ? '군주의 목소리가 갈라진다. 북쪽 줄이 끊긴 탓이다.' : '군주의 목소리가 산을 울린다. 북쪽에서 흘러온 숨이 아직 가득하다.') },
      { narr: (g, M) => (ALLY_N(M) ? `${ALLY_N(M)}명이 당신 양옆에 선다.` : '양옆이 비어 있다. 바람만 지나간다.') },
    ], choices: [
      { text: '문지기에게 맞선다', next: 'c38_check', fight: (g) => LORD_FIGHT(g) },
    ] },
    { id: 'c38_check', lines: [
      { narr: (g, M) => (M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win' ? '군주가 쓰러진다. 문이 기다린다.' : '능선 아래. 숨을 고른다. 위에서 군주가 기다린다. 문 앞을 비우지 않는다.') },
    ], choices: [
      { text: '다시 오른다', when: (g, M) => !(M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win'), next: 'c38_check', fight: (g) => LORD_FIGHT(g) },
      { text: '문으로 간다', when: (g, M) => M.flags.fight_c38_wake === 'win' || M.flags.fight_c38_check === 'win', set: { lordDown: true }, next: 'end' },
    ] },
  ],
  done: (g, M) => g.lifeEvent('원초의 게이트를 지키던 심연의 군주를 쓰러뜨렸다.'),
});

