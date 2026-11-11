// ===== 메인 시나리오 3부 「공명 기록」 C급 (영역 D, docs/메인_시나리오.md §3) =====
// 2부 플래그(seoyun·friend3·jinSeohaeKnown·tone3·c12·rituals·kamaWatch·seoyunHasFile·wave0·doyun)를 읽는다.
// 2부의 F2_* · leadScene · RIVAL_LINE · SEOYUN_ON · KID2 를 그대로 쓴다(같은 묶음).
MAIN.absorbed.push('subject'); // 피험자 연작은 16장으로 옮겼다
const CAL_OF = (g, id) => { const s = g.world && g.world.calamity; if (!s) return 'none'; if (s.active && s.active.id === id) return 'active'; return (s.done && s.done[id]) || 'none'; };
const GOJ = { name: '고재석', sub: '대붕괴 생존자' };
const MINJAE3 = { name: '오민재', sub: '청룡 연구소 연구원' };
const BG = (g) => g.player.bg || 'student';
const DEAF_EYES = { narr: '지나가던 헌터 둘이 당신을 흘끔 본다. "그 영상 댓글…" 말끝을 흐린다. 진서해가 부른 이름이 아직 따라다닌다.', when: (g, M) => M.flags.tone3 === 'deaf' };
const EVIDENCE = (M) => ['basinData', 'subjectFile', 'seoyunHasFile'].filter((k) => M.flags[k]).length + (M.flags.jinSeohaeKnown === 'copy' || M.flags.jinSeohaeKnown === 'official' ? 1 : 0);

// ---------- 15장 분지의 열 ----------
MAIN.ch(15, {
  part: 3, title: '분지의 열', rank: 3, after: 1, where: 'daegu',
  goal: '대구 분지 가장자리',
  scenes: [
    leadScene('c15_lead', '대구 분지'),
    { id: 'c15_arrive', lines: [
      { narr: '대구 분지 요새. 성벽 위 계측판 숫자가 빨갛다. 공기가 데운 쇳물 같다. 숨을 쉬면 목 안쪽이 따끔하다.' },
      { narr: (g) => ({
        active: '분지엔 지금 재앙 경보가 걸려 있다. 에테르 폭주. 가장자리 마을들이 하나씩 비어 간다.',
        player: '분지 폭주는 당신이 한 번 눌러 놓았다. 그런데 계측판 숫자가 다시 오르고 있다. 누가 다시 불을 지핀다.',
        npc: '분지 폭주는 다른 헌터들이 눌러 놓았다. 그들도 원인은 못 찾았다고 했다.',
        fail: '분지 외곽은 이미 잿더미다. 그 재 위에서 아직도 열이 올라온다.',
        none: '분지 가장자리 마을에 원인 모를 열병이 돈다. 관리국은 "자연 현상"이라고 했다.',
      })[CAL_OF(g, 'basin')] },
      DEAF_EYES,
      { who: 'seoyun', when: (g, M) => M.flags.seoyun && M.flags.seoyun !== 'watch', text: '관리국 대구 지부가 저한테 협조를 안 해요. 같은 관리국인데. 분지 남쪽 구역은 "출입 금지"래요. 이유도 없이.' },
    ] },
    { id: 'c15_edge', lines: [
      { narr: '남쪽 가장자리. 철조망 안쪽에 하얀 기둥 여섯 개가 원을 그리고 서 있다. 기둥마다 굵은 관이 땅속으로 박혀 있다.' },
      { narr: '기둥 옆 명판. 「국가 각성자 관리국 · 에테르 수집 설비 3호」. 그 아래 작은 글씨로 결재자. 국장 마도현.' },
      { narr: (g, M) => (M.flags.c12 === 'kama' || M.flags.wave0 ? '"관측하라." 보름 밤 작전 지시서의 그 말이 떠오른다. 이건 관측이 아니다. 빨아들이고 있다.' : '관이 숨을 쉬듯 진동한다. 분지의 열이 이 기둥들 쪽으로 빨려 들어간다. 아니, 거꾸로다. 빨아들인 만큼 땅이 끓는다.') },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun && M.flags.seoyun !== 'watch', text: '…이거 제가 결재 서류로 본 거예요. "분지 안정화 설비"라고. 안정화라고 썼어요. 제 손으로 도장 찍은 서류에.' },
      { narr: '서윤의 손이 철조망을 붙잡는다. 처음 보는 얼굴이다. 감시자 얼굴이 아니다.', when: (g, M) => M.flags.seoyun && M.flags.seoyun !== 'watch' },
    ], choices: [
      { text: '설비를 부순다', set: { c15: 'break' }, next: 'c15_after',
        fight: (g) => ({ title: '수집 설비 경비', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, elem: 'fire', boss: true, name: '설비 수호 골렘' },
          win: { text: '기둥 하나가 쓰러지자 나머지가 연달아 꺼진다. 계측판 숫자가 처음으로 내려간다.', gain: { fame: 10, rep: 8 } }, lose: { text: '열기에 무릎이 꺾인다. 기둥은 그대로 숨을 쉰다.', gain: { injure: 1 } } }) },
      { text: '설비 기록만 뽑아 나온다', set: { c15: 'data', basinData: true }, gain: { merit: -3 }, next: 'c15_after',
        say: [{ narr: '제어반 덮개를 뜯는다. 기록 장치에 수집량이 날짜별로 쌓여 있다. 그 에테르가 실려 간 곳: 인천 본청 지하.' }] },
      { text: '서윤에게 맡긴다 — 관리국 안에서 멈추게', when: (g, M) => M.flags.seoyun && M.flags.seoyun !== 'watch', set: { c15: 'seoyun', seoyunShake: true }, next: 'c15_after',
        run: (g) => { const n = g.mainWho('seoyun'); if (n && n.id != null) g.changeRel(n, 6, '분지 설비를 맡겨 주었다'); },
        say: [{ who: 'seoyun', text: '정식으로 올릴게요. 반려되면… 그땐 저도 생각이 있어요.' }] },
    ] },
    { id: 'c15_after', lines: [
      { narr: (g, M) => ({
        break: M.flags.fight_c15_edge === 'lose' ? '이튿날 관리국 차량이 철조망을 두 겹으로 늘린다. 당신 얼굴이 찍힌 사진이 지부 게시판에 붙는다.' : '사흘 뒤 분지 가장자리 마을의 열병이 꺾인다. 관리국 발표는 "자연 냉각".',
        data: '숙소에서 기록을 연다. 분지만이 아니다. 설비 3호. 1호와 2호가 어딘가에 있다.',
        seoyun: '일주일 뒤 서윤에게서 문자. "반려됐어요. 사유 없음." 그다음 줄. "생각이 정해졌어요."',
      })[M.flags.c15] || '' },
      { who: 'rival', when: F2_HAS_RIVAL, text: (g, M) => RIVAL_LINE(g, M, {
        kama: '분지 건, 관리국 안에서 "외부 테러"로 분류됐다. 테러범 칸에 네 이름 쓰라는 얘기도 나왔어. 내가 막았다. 이번만.',
        cult: '진서해 선생님이 그러더라. "관리국은 에테르를 모아 무언가를 만든다." 그게 뭔지는 말 안 해 줬어.',
        solo: '나도 2호기를 찾았어. 수원 산업 벨트 지하. 혼자 부수기엔 크더라.',
        alone: '…대구 뉴스 봤어. 너 맞지. 나 요즘 다시 훈련해.',
        none: '대구에서 뭔 일 있었냐. 다들 그쪽 얘기다.',
      }) },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (M.flags.seoyun && M.flags.seoyun !== 'watch') M.flags.seoyunShake = true;
    g.lifeEvent(({ break: '대구 분지의 관리국 에테르 수집 설비를 부쉈다.', data: '대구 분지 에테르 수집 설비의 기록을 빼냈다.', seoyun: '대구 분지 설비 문제를 한서윤에게 맡겼다.' })[M.flags.c15] || '대구 분지에 다녀왔다.');
    g.rumor('대구 분지의 열이 관리국 설비 탓이라는 말이 헌터들 사이에 돈다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c15: 'missed', basinBurn: true });
    g.rumor('대구 분지 가장자리 마을 셋이 열병으로 비었다. 관리국은 "자연 현상"이라고 발표했다.');
    return '대구 분지 가장자리 마을이 또 비었다는 뉴스.';
  } },
});

// ---------- 16장 피험자 ----------
MAIN.ch(16, {
  part: 3, title: '피험자', rank: 3, after: 1, where: 'ulsan',
  goal: '울산 해안 폐조선소',
  scenes: [
    { id: 'c16_msg', lines: [
      { narr: (g) => (BG(g) === 'subject' ? '모르는 번호의 문자. "나야, 7번. 연구소 같이 있었던. 우리 기수가 한 명씩 사라져. 좌표 보낸다. 너도 와야 해. 12번."' : '익명 제보. 좌표 하나와 사진 한 장. 유리관. 그 안에 잠든 아이.') },
      { narr: (g, M) => (M.flags.doyun === 'front' ? '사진 속 아이의 얼굴을 확대한다. 짧게 깎은 머리. 경계선 마을의 도윤이다. 보름 앞줄에 섰던.' : M.flags.friend3 === 'late' ? `사진 속 아이들 사이에 ${g.mainFill(F2_TARGET(g))}은(는) 없다. 안도하고, 안도한 자신이 싫다.` : '사진 뒷면에 볼펜 글씨. "보름 의식에서 깨어난 아이들. 관리국이 수거해 감."') },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: '울산 시설… 제 담당 명단의 아이들이 거기로 갔어요. "보호 이송"이라고 써 있었어요. 같이 가요. 이번엔 제가 먼저 들어갈게요.' },
    ], pause: { days: 2, label: '울산', text: '이틀 뒤, 울산 해안 폐조선소로 간다.' } },
    { id: 'c16_yard', lines: [
      { narr: '녹슨 크레인 아래 철문. 문 안쪽은 너무 깨끗하다. 흰 복도, 흰 조명. 소독약 냄새.' },
      { narr: '유리관이 끝없이 이어진다. 아이들이 잠들어 있다. 관마다 번호. 그리고 에테르 수치.' },
      { narr: (g, M) => (M.flags.c15 === 'data' || M.flags.basinData ? '벽의 배관 표식. 「설비 3호 → 울산 저장조」. 분지에서 빨아들인 열이 이 아이들 몸으로 흘러들어 간다.' : '벽의 배관이 웅웅 운다. 어딘가에서 끌어온 에테르가 아이들 몸으로 들어간다.') },
      { narr: (g) => (BG(g) === 'subject' ? '번호 12가 적힌 빈 관 앞에서 발이 멈춘다. 관 안쪽에 손톱자국이 있다. 당신의 것이다. 기억이 아니라 손이 먼저 안다.' : '빈 관 하나. 안쪽에 손톱자국. 누군가 여기서 나가려고 했다.') },
    ] },
    { id: 'c16_core', lines: [
      { narr: '맨 안쪽 방. 가장 큰 관. 안의 것이 눈을 뜬다. 아이였던 것. 지금은 에테르가 사람 모양으로 뭉친 것.' },
      { sys: '「실험체 0번 — 열쇠 계획 1차 시도. 공명 적합도 측정 불가. 폐기 보류.」' },
      { narr: '"열쇠 계획." 그 단어가 화면에 몇 번이고 반복된다.' },
    ], choices: [
      { text: '아이들을 구한다', set: { c16: 'rescue' }, next: 'c16_after',
        fight: (g) => ({ title: '실험체 0번', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true, shape: 'golem', elem: 'wood', name: '[실험체] 0번' },
          win: { text: '0번이 무너지며 아이 목소리로 운다. 유리관이 일제히 열린다.', gain: { fame: 18, rep: 10 } }, lose: { text: '정신이 들었을 땐 경보가 멎어 있다. 관 절반이 비었다. 옮겨진 것이다.', gain: { injure: 1 } } }) },
      { text: '증거만 챙긴다', set: { c16: 'evidence', subjectFile: true }, gain: { merit: 6 }, next: 'c16_after',
        say: [{ narr: '하드 드라이브를 뽑는다. 유리관 하나하나를 지나칠 때마다 발소리가 크다.' }, { narr: '마지막 관의 아이가 눈을 뜬다. 당신을 본다. 다시 감는다.' }] },
    ] },
    { id: 'c16_after', lines: [
      { narr: (g, M) => (M.flags.c16 === 'rescue' && M.flags.fight_c16_core !== 'lose' ? '새벽 부두. 담요를 두른 아이들이 컨테이너 그늘에 모여 앉는다. 누군가 컵라면을 끓인다.' : '빈 부두. 바닷바람만 분다. 하드 드라이브가 주머니에서 무겁다.') },
      { who: KID2, when: (g, M) => M.flags.doyun === 'front' && M.flags.c16 === 'rescue' && M.flags.fight_c16_core !== 'lose', text: '{hyung}… 나 바다 봤다고 했잖아. 여기 사람들이 그 바다 계속 보라고 했어. 이제 안 봐도 돼?' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: '이 명단, 제 서명이 들어간 이송 서류가 마흔두 장이에요. …사직서는 안 낼 거예요. 안에 있어야 할 수 있는 일이 있으니까.' },
      { narr: (g) => (BG(g) === 'subject' ? '7번에게서 마지막 문자. "봤지? 우리가 첫 기수가 아니었어. 0번이 있었어."' : '드라이브 속 문서 맨 위 결재란. 마도현.') },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const ok = M.flags.c16 === 'rescue' && M.flags.fight_c16_core !== 'lose';
    if (M.flags.doyun === 'front') M.flags.doyun = ok ? 'rescued' : 'lab';
    if (ok) { g.lifeEvent('울산 폐조선소 지하 시설에서 아이들을 구해 냈다.'); g.rumor('울산 폐조선소에서 유리관 속 아이들이 구조됐다는 말이 돈다. 관리국은 부인했다.'); }
    else g.lifeEvent('울산 지하 시설의 강제 각성 증거를 챙겨 나왔다.');
    if (BG(g) === 'subject') g.lifeEvent('내가 나온 관을 다시 봤다. 12번.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c16: 'missed' }); if (M.flags.doyun === 'front') M.flags.doyun = 'lab';
    g.rumor('울산 해안 폐조선소가 밤사이 철거됐다. 트럭 수십 대가 어디론가 갔다.');
    return '울산 폐조선소가 철거됐다는 짧은 기사.';
  } },
});

// ---------- 17장 기밀 서버 ----------
MAIN.ch(17, {
  part: 3, title: '기밀 서버', rank: 3, after: 1, where: 'incheon',
  goal: '인천 관리국 본청',
  scenes: [
    leadScene('c17_lead', '관리국 본청'),
    { id: 'c17_way', lines: [
      { narr: '인천 항만 특구. 관리국 본청은 바다를 등지고 서 있다. 유리벽에 하늘이 비친다. 안이 안 보인다.' },
      { narr: (g, M) => (M.flags.seoyunShake ? '서윤이 출입증 두 장을 내민다. "하나는 제 거, 하나는 죽은 동료 거예요. 아직 말소가 안 됐어요."' : M.flags.c11_pass ? '라이벌이 빌려줬던 그 출입증. 아직 살아 있다. 마지막으로 한 번만.' : '지하 주차장 환기구. 민재가 보낸 도면대로라면 여기서 서버실까지 십사 분.') },
      { narr: (g, M) => `주머니 속 증거: ${EVIDENCE(M)}가지. ${EVIDENCE(M) >= 2 ? '퍼즐 조각이 거의 다 모였다.' : '아직 듬성듬성하다.'}` },
    ] },
    { id: 'c17_server', lines: [
      { narr: '지하 6층. 서버실은 춥다. 숨이 하얗다.' },
      { narr: '폴더 이름: 「원초 게이트 개방 경위」. 열자 첫 문장이 뜬다.' },
      { sys: '「게이트는 열린 것이 아니라, 우리가 열었다.」' },
      { narr: '그 아래. 2차 교신 증폭 지시. 서명 마도현. 그리고 한 줄 더. 「진서해 수석 반대. 지시 강행.」' },
      { narr: (g, M) => (M.flags.tone3 === 'heard' ? '진서해가 전화로 한 말과 같다. 그 사람은 거짓말을 하지 않았다. 적어도 이 부분은.' : '가면 벗은 영상 속 진서해의 말. "관리국이 열었다." 그게 사실이었다.') },
      { narr: '문서 끝. 「후속: 열쇠 계획. 공명 적합자를 만들어 문을 닫는다.」 적합자 명단 맨 위에 당신 이름.' },
    ], choices: [
      { text: '헌터넷에 통째로 올린다', set: { c17: 'expose' }, gain: { fame: 20, merit: -20 }, next: 'c17_after' },
      { text: '복사본을 쥐고 국장에게 면담을 요청한다', set: { c17: 'deal' }, next: 'c17_after' },
      { text: '아무에게도 말하지 않고 간직한다', set: { c17: 'keep' }, next: 'c17_after' },
    ] },
    { id: 'c17_after', lines: [
      { narr: (g, M) => ({
        expose: '새벽 네 시에 올린 글이 아침 아홉 시에 조회 수 이백만. 열 시에 삭제. 열한 시에 사본이 천 개.',
        deal: '면담 신청서가 접수된다. 한 시간 뒤 답이 온다. "국장님께서 직접 뵙겠답니다. 내일 오후 세 시."',
        keep: '파일을 암호화해 세 군데에 나눠 둔다. 그날 밤 꿈에 바다가 무릎까지 찬다.',
      })[M.flags.c17] || '' },
      { who: 'rival', when: F2_HAS_RIVAL, text: (g, M) => (M.flags.c17 === 'expose' ? RIVAL_LINE(g, M, { kama: '…본청이 뒤집혔어. 나한테 너 잡아 오라는 명령이 내려올 거야. 아직은 안 왔어.', cult: '사제들이 네 글을 낭독해. 성경처럼. 기분 이상하다.', solo: '잘했다. 이제 너도 쫓기는 쪽이다.', alone: '그거 너지. 무섭다. 근데 잘했어.', none: '세상 시끄럽다.' }) : '…본청에 무슨 일 있었냐. 경비가 두 배다.') },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: '"진서해 수석 반대." …그 사람이 막으려 했던 거네요. 그럼 우리가 쫓은 게 뭐였죠.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.truthKnown = true;
    if (M.flags.c17 === 'expose') { M.flags.kamaWatch = 'hostile'; g.rumor('"게이트는 우리가 열었다." 관리국 기밀 문서가 헌터넷에 퍼졌다. 관리국은 조작이라고 발표했다.'); g.lifeEvent('관리국 기밀 문서를 세상에 공개했다.'); }
    else if (M.flags.c17 === 'deal') g.lifeEvent('관리국 기밀 문서를 쥐고 마도현 국장과의 면담을 잡았다.');
    else g.lifeEvent('관리국 기밀 문서를 아무에게도 말하지 않고 간직했다.');
    if (M.flags.c17 === 'expose') { const s = g.mainWho('seoyun'); if (s && s.id != null) g.changeRel(s, M.flags.seoyunShake ? 4 : -4, '기밀을 공개했다'); }
  },
  expire: { months: 8, run: (g, M) => {
    Object.assign(M.flags, { c17: 'missed', serverWiped: true });
    g.rumor('관리국 본청 서버 교체 공사. 대붕괴 이전 기록은 "보존 기간 만료"로 폐기됐다.');
    return '관리국 본청 서버를 통째로 교체했다는 공고.';
  } },
});

// ---------- 18장 국장 ----------
MAIN.ch(18, {
  part: 3, title: '국장', rank: 3, after: 0, where: 'incheon',
  goal: '마도현과 마주한다',
  scenes: [
    { id: 'c18_room', lines: [
      { narr: (g, M) => ({
        expose: '본청 앞에 시위대가 있다. 경찰 버스 사이로 검은 승용차가 당신 앞에 선다. 뒷문이 열린다. "국장님이 기다리십니다."',
        deal: '오후 세 시 정각. 꼭대기 층 국장실. 창밖으로 항만 크레인이 천천히 돈다.',
        keep: '밤. 숙소 문을 두드리는 소리. 정장 차림 둘. "국장님께서 차 한잔하자십니다. 거절하셔도 됩니다. 권하진 않지만."',
        missed: '협회 지부 회의실. 관리국 국장이 지방 지부를 순시하다 당신을 지목해 부른다.',
      })[M.flags.c17 || 'missed'] },
      { who: 'madohyun', text: '앉게. 차는 식기 전에 마시고.' },
      { who: 'madohyun', text: '변명은 안 하겠네. 그날 문을 닫지 못한 건 내 책임이다. 그래서 닫을 사람을 만들었다.' },
      { who: 'madohyun', text: (g) => ({
        subject: '12번. 자네는 내가 만든 열쇠 중 가장 잘 자란 것이네. 미안하다는 말은 하지 않겠어. 미안해서 한 일이 아니니까.',
        orphan: '자네 어머니는 내 연구원이었다. 공명 실험 2차 관측선에 있었지. 돌아오지 못했어. 자네는 그 사람이 남긴 유일한 것이다.',
        chaebol: '자네 집안이 실험 자금의 삼분의 일을 댔지. 몰랐나. 자네 할아버지는 알았네.',
        soldier: '자네 부대가 그날 관측선 호위였네. 자네만 살아 돌아왔지. 왜 자네만이었는지 생각해 본 적 있나.',
        student: '자네는 아무도 만들지 않았네. 그런데 공명이 남았어. 그래서 더 흥미롭다.',
      })[BG(g)] || '자네도 명단에 있었지.' },
    ] },
    { id: 'c18_talk', lines: [
      { who: 'madohyun', text: '진서해는 문을 열자고 하지. 모두 각성하자고. 저편이 어떻게 됐는지 알면서도. 그건 구원이 아니야. 같이 죽자는 거다.' },
      { who: 'madohyun', text: '나는 닫겠네. 무슨 수를 써서라도. 그 수가 자네라면, 자네를 쓰겠네.' },
      { narr: (g, M) => (M.flags.c16 === 'rescue' && M.flags.fight_c16_core !== 'lose' ? '"울산 아이들, 자네가 데려갔지. 잘했네. 진심이야. 거긴 실패작만 남아 있었으니까." 찻잔이 떨린다. 당신 손이다.' : M.flags.basinData ? '"분지 설비 기록도 갖고 있겠지. 그 에테르가 어디로 가는지도 알겠고." 그가 처음으로 웃는다.' : '그는 끝까지 목소리를 높이지 않는다.') },
    ], choices: [
      { text: '"당신을 체포합니다."', when: (g, M) => M.flags.c17 === 'expose' || EVIDENCE(M) >= 3, set: { c18: 'arrest' }, next: 'c18_after',
        say: [
          { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: '국장님. 관리국 특수조사관 한서윤입니다. 공명 실험 은폐 및 미성년자 강제 각성 혐의로… 체포합니다.' },
          { who: 'madohyun', text: '그래. 그래야지. 하지만 문은 닫히지 않아. 나 없이는.' },
        ] },
      { text: '손을 잡는다 — 문을 닫는 데까지만', set: { c18: 'ally' }, gain: { merit: 15 },
        say: [{ who: 'madohyun', text: '현명하군. 조건은 하나다. 진서해를 막아. 그다음은 그다음에.' }], next: 'c18_after' },
      { text: '찻잔을 내려놓고 일어선다', set: { c18: 'leave' }, next: 'c18_after',
        say: [{ who: 'madohyun', text: '언젠가 다시 앉게 될 거네. 그땐 차가 더 식어 있겠지.' }] },
    ] },
    { id: 'c18_after', lines: [
      { narr: (g, M) => ({
        arrest: '저녁 뉴스. 수갑 찬 국장이 본청 계단을 내려간다. 한 번도 고개를 숙이지 않는다. 다음 날 아침, 대행이 발표한다. "열쇠 계획은 존재하지 않습니다."',
        ally: '관리국 신분증이 하나 생긴다. 직함 칸은 비어 있다. 국장이 말했다. "직함은 필요 없어. 자네가 하는 일이 직함이야."',
        leave: '본청 회전문을 나선다. 등 뒤 유리벽에 당신이 비친다. 안에서 누가 보고 있는지는 모른다.',
      })[M.flags.c18] || '' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake && M.flags.c18 === 'ally', text: '…국장님 손을 잡았다고요. 이해는 해요. 동의는 못 해요. 당분간 제 쪽에서 연락할게요.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const s = g.mainWho('seoyun');
    if (M.flags.c18 === 'arrest') { M.flags.madoState = 'jailed'; g.rumor('관리국 국장 마도현 체포. 혐의는 공개되지 않았다.'); if (s && s.id != null) g.changeRel(s, 8, '국장 체포를 함께했다'); }
    if (M.flags.c18 === 'ally') { M.flags.madoState = 'ally'; M.flags.kamaWatch = 'signed'; if (s && s.id != null) g.changeRel(s, -6, '국장과 손잡았다'); }
    if (M.flags.c18 === 'leave') M.flags.madoState = 'free';
    g.lifeEvent(({ arrest: '마도현 국장을 체포했다.', ally: '마도현 국장과 손을 잡았다. 문을 닫는 데까지만.', leave: '마도현 국장의 제안을 듣고 자리를 떴다.' })[M.flags.c18] || '마도현 국장을 만났다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c18: 'missed', madoState: 'free' });
    g.rumor('마도현 국장이 "열쇠 계획"을 공식 부인했다. 기자 질문은 받지 않았다.');
    return '국장 기자회견. "열쇠 계획은 존재하지 않습니다."';
  } },
});

// ---------- 19장 생존자 ----------
MAIN.ch(19, {
  part: 3, title: '생존자', rank: 3, after: 1, where: 'gangneung',
  goal: '강릉 해안 전선의 노인',
  scenes: [
    { id: 'c19_find', lines: [
      { narr: '강릉 해안 전선. 방벽 너머 바다가 검다. 방벽 아래 판잣집 하나. 문패 대신 조개껍데기.' },
      { narr: '노인이 문을 연다. 왼쪽 눈이 하얗다. "제주 사람 찾는다며. 내가 그 마지막 사람이야. 고재석."' },
      { who: GOJ, text: '그날 바다가 갈라졌어. 문이 열리고 처음 나온 건 괴물이 아니었어. 사람이었어. 우리랑 똑같이 생긴. 여자애였지.' },
      { who: GOJ, text: '그 애가 울면서 "닫아 줘"라고 했어. 우리 말로. 그러고는 도로 들어갔어. 문 안쪽으로. 문을 붙잡으러.' },
      { narr: (g, M) => (M.flags.dreamDebt || M.flags.dream === 'record' ? '공책 첫 장의 꿈이 떠오른다. 문 앞에 서 있던 사람. 여자애였다.' : '꿈속 목소리가 떠오른다. 여자애 목소리였다.') },
    ] },
    { id: 'c19_night', lines: [
      { narr: '밤. 판잣집 지붕 위로 발소리. 하나, 둘, 넷.' },
      { narr: (g, M) => (M.flags.madoState === 'jailed' ? '검은 전술복. 관리국 청소부다. 국장이 갇혀도 명령은 남아 있다.' : M.flags.madoState === 'ally' ? '흰 가면. 균열교다. 진서해도 이 노인을 원한다. 증인이 하나뿐이니까.' : '검은 전술복. 관리국 청소부다. 증인은 하나도 남기지 않는다.') },
      { who: GOJ, text: '…또 왔네. 이번이 일곱 번째야. 늙은이 하나 죽이기 힘들지.' },
    ], choices: [
      { text: '노인 앞에 선다', set: { c19: 'guard' }, next: 'c19_after',
        fight: (g, M) => ({ title: g.mainState().flags.madoState === 'ally' ? '흰 가면 습격조' : '관리국 청소부', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 4, human: true, name: g.mainState().flags.madoState === 'ally' ? '흰 가면 사도' : '청소부 조장' },
          win: { text: '마지막 하나가 방벽 아래로 떨어진다. 노인이 담배에 불을 붙인다.', gain: { fame: 8 } }, lose: { text: '쓰러진 채 판잣집에 불이 붙는 걸 본다.', gain: { injure: 1 } } }) },
      { text: '노인을 업고 방벽 안쪽으로 뛴다', set: { c19: 'flee' }, next: 'c19_after',
        say: [{ narr: '노인이 생각보다 가볍다. 등 뒤에서 판잣집이 무너진다. 조개껍데기 문패가 굴러 온다.' }] },
    ] },
    { id: 'c19_after', lines: [
      { narr: (g, M) => (M.flags.fight_c19_night === 'lose' ? '새벽. 잿더미 속에서 노인의 조개껍데기 문패만 찾는다.' : '새벽. 방벽 위. 노인이 바다를 본다. "그 애 아직 거기 있어. 나는 알아. 밤마다 울어."') },
      { who: GOJ, when: (g, M) => M.flags.fight_c19_night !== 'lose', text: '너 눈이 그 애랑 똑같다. 바다 보는 눈. …이거 가져가. 그 애가 문 닫기 전에 떨어뜨린 거야.' },
      { narr: '손바닥에 놓인 것. 반쪽짜리 원. 쇠도 돌도 아닌 것. 따뜻하다.', when: (g, M) => M.flags.fight_c19_night !== 'lose' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const alive = M.flags.fight_c19_night !== 'lose';
    M.flags.goJae = alive ? 'alive' : 'dead'; if (alive) M.flags.halfRing = true;
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 3);
    g.lifeEvent(alive ? '대붕괴 생존자 고재석을 지켜 냈다. 반쪽 원을 받았다.' : '대붕괴 생존자 고재석을 지키지 못했다.');
    if (!alive) g.rumor('강릉 방벽 아래 판잣집에서 불. 제주 출신 노인이 숨졌다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c19: 'missed', goJae: 'dead' });
    g.rumor('강릉 방벽 아래 판잣집에서 불. 제주 출신 노인이 숨졌다.');
    return '강릉 방벽 아래 판잣집 화재. 대붕괴 생존자라던 노인이 숨졌다.';
  } },
});

// ---------- 20장 아린 ----------
MAIN.ch(20, {
  part: 3, title: '아린', rank: 3, after: 0, where: 'any',
  goal: '잠든다',
  scenes: [
    { id: 'c20_sea', lines: [
      { narr: '검은 바다. 이번엔 물이 허리까지 찬다. 문이 바로 앞이다. 문 안쪽에 누가 서 있다.' },
      { narr: (g, M) => (M.flags.halfRing ? '주머니 속 반쪽 원이 뜨겁다. 문 안쪽 사람의 손에도 반쪽이 있다. 두 개가 서로를 부른다.' : '문 안쪽 사람이 손을 내민다. 그 손이 비어 있다.') },
      { who: 'arin', text: '드디어. 이렇게 가까이 온 건 처음이야.' },
      { narr: '목소리가 처음으로 얼굴을 갖는다. 열일곱쯤. 머리카락이 물속처럼 흔들린다. 눈은 당신과 같은 색이다.' },
    ] },
    { id: 'c20_name', lines: [
      { who: 'arin', text: '나는 아린. 저편의 파수인이야. 이 문을 붙잡고 있어. 이십 년째.' },
      { narr: '문 너머가 보인다. 하늘이 회색이다. 땅이 갈라져 있다. 건물들이 서 있지만 불빛이 없다. 사람들이 줄지어 앉아 있다. 움직이지 않는다.' },
      { who: 'arin', text: '우리 세계야. 에테르가 바닥났어. 너희 쪽으로 다 흘러갔거든. 문이 열린 그날부터.' },
      { who: 'arin', when: (g, M) => M.flags.goJae === 'alive', text: '그 할아버지, 아직 살아 있구나. 고마워. 그날 나를 본 유일한 사람이야.' },
      { who: 'arin', when: (g, M) => M.flags.friend3 === 'late', text: (g) => `${g.mainFill(F2_TARGET(g))}… 여기 가까이 와 있어. 진서해 옆에서. 문 냄새가 나.` },
    ], choices: [
      { text: '"저편은 어떤 곳이었어?"', set: { c20: 'world' }, next: 'c20_world' },
      { text: '"왜 나야?"', set: { c20: 'why' }, next: 'c20_why' },
      { text: '"진서해는 문을 열자고 해. 너는?"', set: { c20: 'jin' }, next: 'c20_jin' },
    ] },
    { id: 'c20_world', lines: [
      { who: 'arin', text: '바다가 초록색이었어. 밤에는 하늘에 강이 흘렀어. 빛나는 강. 그게 에테르야. 우리는 그걸 마셨어. 숨 쉬듯이.' },
      { who: 'arin', text: '이제 강이 말랐어. 남은 사람들은 앉아서 기다려. 문이 닫히면 끝나는 걸 알면서. 열려 있어도 끝나는 걸 알면서.' },
    ], next: 'c20_end' },
    { id: 'c20_why', lines: [
      { who: 'arin', text: '문이 처음 열린 날, 내가 넘어갔을 때 너희 쪽에 처음 닿은 숨이 있었어. 갓 태어난 숨. 그 숨에 내 목소리가 묻었어.' },
      { who: 'arin', text: (g) => (BG(g) === 'subject' ? '그 사람들이 너를 만든 게 아니야. 너는 이미 있었어. 그 사람들은 네가 있다는 걸 알아낸 것뿐이야.' : '그래서 네 꿈에만 내가 또렷해. 미안해. 고르지 않았어. 그냥 그렇게 됐어.') },
    ], next: 'c20_end' },
    { id: 'c20_jin', lines: [
      { who: 'arin', text: '그 사람 기억해. 첫 교신 때 나랑 말한 사람. 다정했어. 그날 나한테 미안하다고 백 번 말했어.' },
      { who: 'arin', text: '문을 다 열면 너희도 모두 각성하겠지. 잠깐은. 그다음엔 너희 강도 마를 거야. 우리처럼. 그 사람도 알아. 모르는 척하는 거야.' },
    ], next: 'c20_end' },
    { id: 'c20_end', lines: [
      { who: 'arin', text: '닫아 달라고 했었지. 그날. 이제는 모르겠어. 닫으면 우리가 끝나. 열어 두면 너희가 끝나.' },
      { who: 'arin', text: '정하지 않아도 돼. 아직은. 그냥… 다시 와 줘.' },
      { narr: '눈을 뜬다. 베개가 젖어 있다. 손바닥에 물빛 자국이 남아 있다. 반쪽 원 모양.' },
      { who: 'leader', when: F2_HAS_LEADER, text: (g) => '…또 꿈이냐. 얼굴이 하얗다. 오늘은 쉬어.' },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'saved', text: '새벽에 문자 보내서 미안. 나 꿈에 너 봤어. 바다에 서 있더라. 괜찮지?' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.arinName = true;
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 4);
    M.part3 = { basin: M.flags.c15 || 'missed', kids: M.flags.c16 || 'missed', truth: M.flags.c17 || 'missed', mado: M.flags.madoState || 'free', goJae: M.flags.goJae || 'dead', ask: M.flags.c20 };
    g.lifeEvent('꿈속 목소리가 처음으로 이름을 말했다. 아린. 저편의 파수인.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c20: 'missed', arinName: true });
    M.part3 = { basin: M.flags.c15 || 'missed', kids: M.flags.c16 || 'missed', truth: M.flags.c17 || 'missed', mado: M.flags.madoState || 'free', goJae: M.flags.goJae || 'dead', ask: 'none' };
    return '꿈에서 누군가 이름을 말하고 사라졌다. 아린.';
  } },
});
