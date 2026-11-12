// ===== 메인 시나리오 4부 「재앙의 해」 B급 (영역 D, docs/메인_시나리오.md §3) =====
// 3부 플래그(c15·c16·c17·madoState·goJae·halfRing·c20·arinName·truthKnown·seoyunShake)와 2부·1부 플래그를 읽는다.
const ARIN_WARN = (M) => ({ world: '강이 마른 쪽에서 오는 거야. 우리 쪽 마지막 숨이 새고 있어.', why: '네 숨에 내 목소리가 묻었다고 했지. 그래서 들려. 저 아래에서 우는 소리, 너한테만.', jin: '그 사람이 이 틈을 키우고 있어. 다정한 얼굴로.', missed: '…들려? 저 아래.' })[M.flags.c20 || 'missed'];
// 아린의 부탁(21장): 20장에서 무엇을 물었는지·노인·반쪽 원에 따라 닫기/열기/다리 중 하나 → 26장 endSeed와 교차
const ARIN_ASK = (M) => (M.flags.c20 === 'world' || (M.flags.goJae === 'alive' && M.flags.halfRing) ? 'bridge' : M.flags.c20 === 'jin' && M.flags.jinBond === 'near' ? 'open' : 'close');
const ARIN_ASK_LINE = {
  close: '부탁 하나만 할게. 그날이 오면… 닫아 줘. 우리가 끝나도 괜찮아. 너희 강까지 마르는 건 못 보겠어.',
  open: '부탁이 있어. 그 사람이 문을 열 때, 막지 말아 줘. 우리 쪽 아이들이 너희 쪽 숨을 한 번만 쉬게 해 줘.',
  bridge: '부탁이야. 닫지도 열지도 말아 줘. 그 반쪽 원 기억하지? 두 개를 맞추면 문이 아니라 다리가 된대. 할아버지가 그날 본 거야.',
};
const RIVAL_REG = (g) => { const r = g.mainWho('rival'); return r && r.region ? r.region : 'city'; };
const MADO_LINE = (M, T) => T[M.flags.madoState || 'free'];

// ---------- 21장 심해 신호 ----------
MAIN.ch(21, {
  part: 4, title: '심해 신호', rank: 4, after: 1, where: 'gangneung', cal: 'abyss',
  goal: '강릉 해안 방벽',
  scenes: [
    leadScene('c21_lead', 'c21'),
    { id: 'c21_dream', lines: [
      { narr: '꿈. 바다 밑. 아린이 문 안쪽이 아니라 바닷속에 서 있다. 발밑으로 금이 간다.' },
      { who: 'arin', text: (g, M) => ARIN_WARN(M) },
      { who: 'arin', text: '동쪽 바다 밑에 새 틈이 났어. 거기로 우리 쪽 짐승들이 너희 쪽으로 밀려 나가. 걔들도 숨 쉴 곳을 찾는 거야.' },
      { narr: '깨어나니 휴대폰에 속보. 강릉 해안 전선.' },
      leadEcho('c21'),
    ], pause: { days: 2, label: '강릉', text: '이틀 뒤, 강릉 해안 방벽에 닿는다.' } },
    { id: 'c21_wall', lines: [
      { narr: (g) => ({
        active: '강릉 방벽 위. 재앙 경보. 동해 심해 게이트. 바다가 너무 잔잔하다. 해안 괴수들이 한 마리도 없다. 폭풍 전의 고요다.',
        player: '심해 게이트는 당신이 한 번 닫았다. 그런데 수평선 아래에서 다시 빛이 올라온다.',
        npc: '심해 게이트는 다른 헌터들이 닫았다. 그들 중 둘이 아직 깨어나지 못했다.',
        fail: '강릉 해안선은 이미 삼켜졌다. 방벽은 한 줄 뒤로 물러나 있다.',
        none: '강릉 방벽 계측기가 하루에 세 번 경보를 울린다. 아직 경보는 공식이 아니다.',
      })[CAL_OF(g, 'abyss')] },
      { narr: (g, M) => (M.flags.goJae === 'alive' ? '고재석 노인이 방벽에 올라와 있다. 지팡이로 수평선을 가리킨다. "저기야. 그날이랑 같은 빛이야."' : '방벽 아래, 불탄 판잣집 자리에 조개껍데기가 흩어져 있다.') },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: '관리국 측정팀이 저 아래로 잠수정을 내린대요. 목적은… "에테르 시료 채취". 분지 설비랑 같은 문구예요.' },
    ], choices: [
      { text: '잠수정을 타고 틈까지 내려간다', set: { c21: 'dive' }, next: 'c21_after',
        fight: (g) => ({ title: '심해의 틈', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, elem: 'water', boss: true, name: g.mainCalBoss('abyss', '틈을 지키는 것') },
          win: { text: '틈 가장자리가 얼어붙듯 굳는다. 빛이 가라앉는다.', gain: { fame: 15, rep: 10 } }, lose: { text: '잠수정 경보음 속에서 의식이 끊긴다. 눈을 뜨니 방벽 위 들것이다.', gain: { injure: 1 } } }) },
      { text: '방벽에 남아 밀려오는 것들을 막는다', set: { c21: 'wall' }, next: 'c21_after',
        fight: (g) => ({ title: '방벽 방어', mobs: { tier: Math.min(7, g.player.rankIdx), n: 4, elem: 'water' },
          win: { text: '새벽까지 방벽이 버틴다. 밀려온 것들이 하나둘 바다로 돌아간다. 다치지 않은 것들도.', gain: { fame: 8, rep: 12 } }, lose: { text: '방벽 한 구간이 무너진다. 사람들은 다 대피했다. 집들은 아니다.', gain: { injure: 1 } } }) },
      { text: '관리국 잠수정을 막는다 — 시료 채취를 멈추게', when: (g, M) => !!M.flags.truthKnown, set: { c21: 'stop' }, gain: { merit: -10 }, next: 'c21_after',
        say: [{ narr: '잠수정 출입구 앞에 선다. 측정팀장이 무전기를 든다. 십 분 뒤 작전이 보류된다.' }] },
    ] },
    { id: 'c21_after', lines: [
      { narr: (g, M) => ({
        dive: M.flags.fight_c21_wall === 'lose' ? '틈은 닫히지 않았다. 다만 당신이 거기까지 갔다는 걸 아린은 안다.' : '틈 바닥에서 본 것. 초록색 물. 아린이 말한 그 바다 색이다. 한 줌뿐이다.',
        wall: '아침. 방벽 위에 사람들이 컵라면을 나눈다. 해안 마을 아이가 당신 소매를 잡는다. 이유는 말하지 않는다.',
        stop: '측정팀이 철수한다. 당신 이름이 관리국 내부 보고서에 한 줄 더 오른다. "방해 행위."',
      })[M.flags.c21] || '' },
      { who: 'arin', text: '…고마워. 걔들도 숨 쉬고 싶었던 것뿐이야. 그래도 너희를 해치면 안 되지.' },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun === 'watch', text: '(문자) 측정팀 보고서에 당신 이름은 안 넣었어요. "신원 미상 헌터 1명." 저는 계속 지켜보고만 있을게요. 그게 제 자리라서.' },
    ] },
    { id: 'c21_ask', lines: [
      { narr: '그날 밤 꿈. 바닷속. 아린이 두 손을 모은다. 처음 보는 자세다. 부탁하는 자세.' },
      { who: 'arin', text: (g, M) => ARIN_ASK_LINE[ARIN_ASK(M)] },
    ], choices: [
      { text: '"약속할게."', set: { arinPromise: true }, run: (g, M) => { M.flags.arinAsk = ARIN_ASK(M); } },
      { text: '"아직은 약속 못 해."', set: { arinPromise: false }, run: (g, M) => { M.flags.arinAsk = ARIN_ASK(M); } },
    ], next: 'c21_morning' },
    { id: 'c21_morning', lines: [
      { narr: (g, M) => (M.flags.arinPromise ? '눈을 뜬다. 손가락 끝이 젖어 있다. 약속한 손이다.' : '눈을 뜬다. 꿈속에서 아린이 고개를 끄덕였던 것 같다. 기다리겠다는 뜻으로.') },
      { narr: (g, M) => (M.flags.goJae === 'alive' ? '방벽 위 고재석 노인이 묻는다. "그 애가 뭐라든?" 대답을 못 한다. 노인이 웃는다. "부탁했구나. 그 애는 부탁을 잘 못 해. 처음일 거다."' : '방벽 아래 바다가 아침 해에 잠깐 초록색으로 빛난다.') },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (M.flags.c21 === 'dive' && M.flags.fight_c21_wall === 'win') g.mainCalClear('abyss');
    g.lifeEvent(({ dive: '동해 심해의 틈까지 내려갔다.', wall: '강릉 방벽에서 밤새 밀려오는 것들을 막았다.', stop: '관리국 심해 시료 채취를 멈춰 세웠다.' })[M.flags.c21] || '강릉 해안에 다녀왔다.');
    if (M.flags.c21 === 'stop') M.flags.kamaWatch = 'hostile';
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c21: 'missed', abyssWide: true });
    g.rumor('동해 심해 틈이 넓어졌다. 강릉 해안 마을 두 곳이 방벽 안쪽으로 이주했다.');
    return '동해 심해의 틈이 넓어졌다는 뉴스. 방벽이 한 줄 물러났다.';
  } },
});

// ---------- 22장 라이벌의 길 ----------
MAIN.ch(22, {
  part: 4, title: '라이벌의 길', rank: 4, after: 1, where: RIVAL_REG,
  goal: (g) => (g.mainWho('rival') ? `${g.mainWho('rival').name}을(를) 만난다` : '시험 동기의 빈자리'),
  scenes: [
    { id: 'c22_call', lines: [
      { who: 'rival', text: (g, M) => RIVAL_LINE(g, M, {
        kama: M.flags.c17 === 'expose' || M.flags.c21 === 'stop' ? '…명령이 내려왔다. 너 데려오래. 살아서든 아니든. 만나자. 내가 먼저 찾았다고 보고하기 전에.' : '관리국 정식 요원이 됐다. 첫 임무가 영점 세대 감시. 네 이름이 명단 세 번째에 있다. 만나자.',
        cult: '진서해 선생님이 나를 사도로 세웠어. 일곱 번째 사도. 네 배지랑 같은 번호. 우연 아니래. 만나자.',
        solo: '나 혼자 수집 설비 1호를 찾았어. 수원 지하. 혼자는 무리야. 처음으로 부탁한다.',
        alone: '…나 다시 시험 봤다. 붙었어. 너한테 제일 먼저 말하고 싶었어. 만나자.',
        none: '오랜만이다. 할 얘기가 있다.',
      }), alt: '시험 동기 단톡방이 조용하다. 마지막 메시지는 몇 달 전. 함께 시험 본 이름 하나가 회색으로 바뀌어 있다.' },
    ] },
    { id: 'c22_memory', lines: [
      { narr: '약속 전날. 서랍에서 시험 날 받은 응시표를 찾는다. 뒷면에 동기가 적어 준 전화번호. 잉크가 바랬다.' },
      { narr: (g, M) => ({ kama: '헌터넷에 관리국 요원 명단이 돈다. 동기 이름 옆에 "영점 세대 전담". 사진 속 동기는 웃지 않는다.', cult: '균열교 사도 명단 캡처. 일곱 번째 칸. 동기의 사진 위에 흰 가면이 그려져 있다.', solo: '헌터넷 "독자 행동" 게시판. 수원 지하 영상을 올린 사람 닉네임이 동기의 시험 번호다.', alone: '협회 재시험 합격자 명단. 아는 이름이 하나 있다. 동기다.', none: '동기에게서 온 마지막 메시지를 다시 읽는다.' })[M.flags.rivalPath || 'none'], when: (g) => !!g.mainWho('rival') },
      { narr: '동기의 마지막 기록을 찾는다. 협회 명부에 회색 줄이 그어져 있다.', when: (g) => !g.mainWho('rival') },
    ], pause: { days: 1, label: '약속 날', text: '내일, 시험 날의 그 편의점 앞에서 보기로 했다.' } },
    { id: 'c22_meet', lines: [
      { narr: (g) => (g.mainWho('rival') ? '약속 장소. 시험 날 같이 컵라면을 먹었던 편의점 앞. 동기가 먼저 와 있다. 많이 말랐다.' : '시험 날 같이 컵라면을 먹었던 편의점 앞. 혼자다. 의자 하나가 비어 있다.') },
      { who: 'rival', text: (g, M) => RIVAL_LINE(g, M, {
        kama: '나는 질서 쪽이야. 처음부터 그랬어. 근데 그 질서가 문을 열었대. 그럼 나는 뭘 지킨 거냐.',
        cult: '여기 사람들은 따뜻해. 진짜야. 근데 선생님이 그러더라. 문을 다 열면 바다가 마른대. 웃으면서.',
        solo: '나는 누구 편도 안 해. 그래서 아무도 안 도와줘. 너 빼고.',
        alone: '징계받고 일 년 동안 아무것도 안 했어. 네 소식만 봤어. 네가 하는 거 보고 다시 일어났어.',
        none: '…요즘 어떻게 지내.',
      }), alt: (g, M) => (M.flags.rivalPath === 'cult' ? '편의점 사장이 말한다. "그 친구 흰 옷 입고 다니더니 어느 날부터 안 와요."' : '편의점 사장이 말한다. "그 친구 요즘 통 안 보이네요."') },
    ], choices: [
      { text: '손을 내민다 — 같은 걸 쫓자', when: (g) => !!g.mainWho('rival'), set: { c22: 'ally' }, rel: { rival: 6 }, relWhy: '같은 길을 가자고 했다', next: 'c22_after' },
      { text: '"그 길 끝까지 가게 둘 순 없어." (대결)', when: (g) => !!g.mainWho('rival'), set: { c22: 'duel' }, next: 'c22_after',
        fight: (g) => { const r = g.mainWho('rival'); return { title: `${r.name}와(과)의 대결`, mobs: { tier: Math.min(7, Math.max(r.rankIdx, g.player.rankIdx)), n: 1, human: true, name: r.name }, win: { text: '동기가 무릎을 꿇는다. 웃는다. "…역시 너다."', gain: { fame: 10 } }, lose: { text: '바닥에 누운 채 하늘을 본다. 동기가 손을 내민다.', gain: { injure: 1 } } }; } },
      { text: '컵라면 두 개를 산다 (화해)', when: (g) => !!g.mainWho('rival'), set: { c22: 'peace' }, rel: { rival: 10 }, relWhy: '시험 날처럼 컵라면을 나눴다', next: 'c22_after' },
      { text: '빈 의자 앞에 컵라면 하나를 놓고 간다', when: (g) => !g.mainWho('rival'), set: { c22: 'empty' }, next: 'c22_after' },
    ] },
    { id: 'c22_after', lines: [
      { who: 'rival', when: (g, M) => M.flags.c22 === 'ally', text: (g, M) => RIVAL_LINE(g, M, { kama: '본청 안의 일은 내가 맡는다. 네 이름, 명단에서 한 칸씩 밀어 둘게.', cult: '안에서 지켜볼게. 해협 의식 날짜, 나오면 제일 먼저 알려 준다.', solo: '수원 1호기, 다음 달. 같이 간다.', alone: '이번엔 도망 안 가.', none: '그래.' }) },
      { who: 'rival', when: (g, M) => M.flags.c22 === 'duel', text: (g, M) => (M.flags.fight_c22_meet === 'win' ? '졌다. 깔끔하게. …네 길로 가. 나는 내 길 끝에서 기다릴게.' : '이겼네. 근데 기분이 안 좋다. 너 일부러 졌냐.') },
      { who: 'rival', when: (g, M) => M.flags.c22 === 'peace', text: '…시험 날 생각난다. 너 그때 젓가락 두 개 들고 왔잖아. 나 거 하나.' },
      { narr: '컵라면 국물이 식는다. 아무도 오지 않는다. 그래도 한동안 앉아 있다.', when: (g, M) => M.flags.c22 === 'empty' },
    ] },
    { id: 'c22_home', lines: [
      { narr: '돌아오는 길. 응시표를 다시 서랍에 넣는다. 이번엔 맨 위 칸.' },
      { who: 'rival', when: (g, M) => M.flags.c22 && M.flags.c22 !== 'empty', text: (g, M) => RIVAL_LINE(g, M, { kama: '(문자) 해협 쪽 작전명 정해졌다. "청소". 이름 참 성의 없지.', cult: '(문자) 선생님이 요즘 기침을 해. 피가 섞여. 아무도 모르는 척해.', solo: '(문자) 1호기 근처에서 울산 시설 트럭 번호를 봤다. 같은 회사다.', alone: '(문자) 오늘 첫 게이트 혼자 닫았다. 사진 보낸다. 못생기게 나왔다.', none: '(문자) 잘 들어갔냐.' }), alt: '협회 명부의 회색 줄 옆에, 오늘 날짜로 작은 메모를 남긴다. "다녀감."' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.rivalEnd = M.flags.c22 === 'ally' || M.flags.c22 === 'peace' ? 'with' : M.flags.c22 === 'duel' ? 'apart' : 'gone';
    g.lifeEvent(({ ally: '시험 동기와 같은 길을 가기로 했다.', duel: '시험 동기와 겨뤘다.', peace: '시험 동기와 컵라면을 나눠 먹었다. 시험 날처럼.', empty: '시험 동기의 빈자리에 컵라면을 두고 왔다.' })[M.flags.c22] || '시험 동기를 생각했다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c22: 'missed', rivalEnd: 'apart' }); g.mainRel({ rival: -4 }, '끝내 만나지 않았다');
    return '시험 동기에게서 온 마지막 메시지. "알았다. 각자 가자."';
  } },
});

// ---------- 23장 무명의 강의 ----------
const JIN_ROOM = { name: '청중', sub: '부산 폐부두 창고' };
MAIN.ch(23, {
  part: 4, title: '무명의 강의', rank: 4, after: 1, where: 'busan',
  goal: '부산 폐부두 비공개 강연',
  scenes: [
    { id: 'c23_invite', lines: [
      { narr: (g, M) => (M.flags.tone3 === 'heard' ? '손글씨 초대장. "끝까지 들어 주셨던 분께. 이번엔 얼굴을 보고 말하고 싶습니다. — 진서해"' : '헌터넷 공지. "진서해 공개 강연. 부산 폐부두 7번 창고." 마지막 줄. "전화를 끊으신 분도 환영합니다."') },
      { narr: (g, M) => (M.flags.rivalEnd === 'with' && M.flags.rivalPath === 'cult' ? '동기에게서 문자. "앞에서 셋째 줄. 자리 맡아 뒀다."' : '부산 해상 도시. 부유 구획 사이로 폐부두가 녹슬어 간다.') },
    ], pause: { days: 2, label: '강연 날', text: '이틀 뒤, 부산 폐부두 7번 창고로 간다.' } },
    { id: 'c23_hall', lines: [
      { narr: '창고 안. 의자 수백 개. 비각성자들이 대부분이다. 작업복, 앞치마, 교복. 단상은 없다. 진서해가 바닥에 서 있다.' },
      { narr: (g, M) => (M.flags.friend3 === 'late' ? `진서해 바로 옆에 ${g.mainFill(F2_TARGET(g))}이(가) 서 있다. 맨발. 눈동자가 바다 색이다. 당신을 보고 손을 흔든다. 웃는다.` : M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '맨 뒷줄에 연희가 앉아 있다. 앞치마 차림 그대로. 당신을 보고 고개만 까딱한다.' : '맨 뒷줄에 자리가 하나 비어 있다.') },
      { who: 'mumyeong', text: '각성한 분들께 묻겠습니다. 왜 여러분만 신이어야 하죠?' },
      { who: 'mumyeong', text: '게이트 시대 이십 년. 각성자는 백 명 중 한 명. 나머지 아흔아홉은 경보가 울리면 숨습니다. 돔 성벽 밖에서. 그게 질서입니까?' },
      { who: 'mumyeong', text: (g, M) => (M.flags.truthKnown ? '관리국이 문을 열었다는 건 이제 다들 압니다. 저도 거기 있었습니다. 저는 반대했고, 졌습니다. 이번엔 지지 않을 겁니다.' : '대붕괴는 재해가 아닙니다. 사고도 아닙니다. 선택이었습니다. 이번엔 우리가 선택할 차례입니다.') },
      { who: 'mumyeong', text: '문을 끝까지 열면 모두가 각성합니다. 모두가. 그날 이 창고에 계신 분들 모두가 경보에 숨지 않아도 됩니다.' },
      { who: 'mumyeong', when: (g, M) => !!M.flags.serverWiped, text: '관리국은 서버를 통째로 바꿨습니다. 보존 기간 만료라고요. 기록이 없으면 일어난 일도 없는 겁니까?' },
    ] },
    { id: 'c23_reply', lines: [
      { narr: '진서해가 청중석을 둘러보다 당신에게서 멈춘다. "오늘은 영점 세대 한 분이 오셨습니다. 한 말씀 하시겠어요?"' },
    ], choices: [
      { text: '반박한다 — "저편이 어떻게 됐는지 말하세요."', when: (g, M) => !!M.flags.arinName, set: { c23: 'refute' }, gain: { fame: 6 }, next: 'c23_dock',
        say: [{ narr: '"강이 말랐습니다. 저편은 에테르를 다 잃었어요. 문을 다 열면 우리 쪽 강도 마릅니다. 이분은 그걸 압니다."' }, { narr: '창고가 조용해진다. 진서해가 처음으로 말을 고른다. "…아린이 그렇게 말하던가요."' }] },
      { text: '침묵한다', set: { c23: 'silent' }, next: 'c23_dock',
        say: [{ narr: '당신은 아무 말도 하지 않는다. 진서해가 고개를 끄덕인다. "침묵도 대답입니다." 박수가 나온다. 당신을 향한 것인지 모른다.' }] },
      { text: '동의한다 — "숨는 사람이 없는 세상은 필요해요."', set: { c23: 'agree' }, gain: { fame: 4, merit: -10 }, next: 'c23_dock',
        say: [{ narr: '창고가 일어선다. 박수가 오래 이어진다. 진서해가 당신 손을 잡는다. 손이 차갑다. 바닷물처럼.' }] },
    ] },
    { id: 'c23_dock', lines: [
      { narr: '강연이 끝나고 폐부두. 사람들이 흩어진다. 다들 뭔가를 쥐고 돌아간다. 소책자, 촛불, 서로의 손.' },
      { narr: (g, M) => (M.flags.friend3 === 'late' ? `${g.mainFill(F2_TARGET(g))}이(가) 부두 끝까지 따라 나온다. 맨발로 콘크리트를 밟는다. 차갑지 않다고 한다.` : M.flags.yeonhee && M.flags.yeonhee !== 'missing' ? '연희가 부두 끝에서 담배를 문다. 불은 붙이지 않는다. "저 사람 말, 반은 맞아. 그게 문제야."' : '부두 끝에 앉아 바다를 본다. 해상 도시 불빛이 물에 길게 늘어진다.') },
      { who: 'arin', when: (g, M) => !!M.flags.arinName, text: (g, M) => (M.flags.arinPromise ? '…약속, 기억하고 있지? 그 사람 말 들어도 괜찮아. 마지막에만 기억해 줘.' : '그 사람 목소리 오랜만이야. 여전히 다정하네. 그래서 무서워.') },
    ] },
    { id: 'c23_after', lines: [
      { who: 'mumyeong', text: (g, M) => ({ refute: '다음에 만날 땐 해협 위겠군요. 그때도 반박하세요. 저를 멈출 수 있는 건 반박뿐이니까.', silent: '아직 정하지 않으셨군요. 좋습니다. 해협에서 정하셔도 늦지 않아요.', agree: '고맙습니다. 해협 의식 날, 당신 자리는 제 옆입니다.' })[M.flags.c23] },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'late' && !F2_AWAKE(g), text: '나 이제 안 숨어. 경보 울려도 안 숨어. 너처럼. …좋지?' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake, text: (g, M) => (M.flags.c23 === 'agree' ? '…정말이에요? 아니면 들어가 보려는 거예요? 대답하지 마요. 둘 다 보고서에 못 쓰니까.' : '강연 녹음본, 관리국에 안 넘겼어요. 사람들 얼굴이 다 나와서.') },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.jinBond = M.flags.c23 === 'agree' ? 'near' : M.flags.c23 === 'refute' ? 'foe' : 'open';
    g.lifeEvent(({ refute: '진서해의 강연에서 그를 반박했다.', silent: '진서해의 강연을 끝까지 침묵으로 들었다.', agree: '진서해의 강연에서 그에게 동의했다.' })[M.flags.c23] || '진서해의 강연에 다녀왔다.');
    g.rumor(M.flags.c23 === 'agree' ? `진서해 강연에 나타난 영점 세대 ${g.player.name}이(가) 그의 손을 잡았다는 말이 돈다.` : '부산 폐부두 진서해 강연에 수백 명이 모였다.');
  },
  expire: { months: 5, run: (g, M) => {
    Object.assign(M.flags, { c23: 'missed', jinBond: 'open' });
    g.rumor('부산 폐부두 진서해 강연에 수천 명이 모였다. 관리국은 해산하지 못했다.');
    return '진서해 강연 영상이 조회 수 천만을 넘었다는 뉴스.';
  } },
});

// ---------- 24장 비각성자 봉기 ----------
const KWON2 = { name: '권만석', sub: '균열교 신도' };
const HAEUN2 = { name: '권하은', sub: '권만석의 딸' };
const YEONHEE2 = { name: '서연희', sub: '급식소' };
MAIN.ch(24, {
  part: 4, title: '비각성자 봉기', rank: 4, after: 0, where: 'gangnam',
  goal: '서울 강남 돔 성벽',
  scenes: [
    leadScene('c24_lead', 'c24'),
    { id: 'c24_train', lines: [
      { narr: '서울행 이동망. 객차 절반이 흰 로브다. 다들 조용하다. 한 아이가 엄마 무릎에서 노래를 흥얼거린다. 강북 지하의 그 노래.' },
      { narr: (g, M) => (M.flags.c23 === 'agree' ? '옆자리 노인이 당신을 알아본다. "부산에서 그분 손 잡은 사람이지." 사탕 하나를 쥐여 준다.' : M.flags.c23 === 'refute' ? '맞은편 청년이 당신을 알아본다. "부산에서 반박한 사람이죠." 눈을 피한다.' : '아무도 당신을 알아보지 않는다. 오늘은 그게 다행이다.') },
    ], pause: { days: 1, label: '시위 날', text: '내일 밤, 강남 돔 성벽 앞.' } },
    { id: 'c24_wall', lines: [
      { narr: '강남 돔. 투명한 성벽 바깥에 사람들이 모였다. 수만. 흰 로브도 있고 작업복도 있다. 손에 든 건 무기가 아니라 촛불과 피켓.' },
      { sys: '「우리도 숨지 않을 권리가 있다」' },
      { narr: (g, M) => (M.flags.kwon === 'alive' ? '맨 앞줄. 지팡이 짚은 권만석. 옆에서 하은이 피켓을 든다. "아빠는 이번엔 안에 안 들어가요. 밖에서 외치기만 해요."' : M.flags.kwon === 'dead' ? '맨 앞줄에 권만석의 영정이 올라가 있다. 하은이 그 액자를 들고 서 있다. 키가 많이 컸다.' : '맨 앞줄에 낯선 얼굴들. 다들 무언가를 들고 있다. 사진, 촛불, 아이 손.') },
      { narr: (g, M) => (M.flags.doyun === 'rescued' ? '도윤이 군중 사이에서 당신을 찾아 손을 흔든다. 각성자가 됐다. 울산 이후로. 그런데 로브를 입고 있다. "엄마 대신이야."' : M.flags.doyun === 'lab' ? '피켓 하나에 도윤의 사진. "울산에서 사라진 아이들을 돌려 달라."' : '') , when: (g, M) => M.flags.doyun === 'rescued' || M.flags.doyun === 'lab' },
      { narr: '성벽 안쪽. 길드 연합 진압조와 관리국 기동대. 방패가 한 줄로 늘어서 있다.' },
      leadEcho('c24'),
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: '자네가 앞에 서 주게. 영점 세대가 막으면 저들도 멈춘다. 피는 안 보고 끝내고 싶네.' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyunShake && M.flags.madoState !== 'ally', text: '진압 명령 떨어졌어요. 열 시. 저는… 방패 뒤에 서라고 들었어요.' },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun === 'watch', text: '(방패 줄 맨 끝에서 무전기를 든 서윤이 당신을 본다. 입 모양만.) "거기 서 있으면 기록돼요."' },
    ] },
    { id: 'c24_choice', lines: [
      { narr: '아홉 시 오십 분. 확성기에서 해산 경고. 군중 속에서 노래가 시작된다. 강북 지하에서 듣던 그 노래다.' },
    ], choices: [
      { text: '성벽 앞에 선다 — 넘어오는 걸 막는다', set: { c24: 'block' }, gain: { merit: 15 }, next: 'c24_after',
        fight: (g) => ({ title: '성벽을 넘는 사도들', mobs: { tier: Math.min(7, g.player.rankIdx), n: 3, human: true, name: '흰 가면 사도' }, win: { text: '사도들이 물러난다. 군중은 남는다. 촛불이 밤새 꺼지지 않는다.', gain: { fame: 6 } }, lose: { text: '성벽 한 구간이 열린다. 사람들이 돔 안으로 밀려든다. 다친 사람이 많다.', gain: { injure: 1 } } }) },
      { text: '방패와 군중 사이에 선다 (중재)', set: { c24: 'mediate' }, gain: { fame: 12 }, next: 'c24_after',
        say: [{ narr: '방패 쪽으로 등을 돌리고 군중을 본다. 그리고 다시 방패를 본다. 확성기를 빼앗는다. "열 시는 미뤄 주세요. 한 시간만. 저 사람들 얘기 들을 사람 하나는 있어야죠."' }] },
      { text: '군중 쪽으로 걸어간다 (신도 편)', set: { c24: 'join' }, gain: { fame: 20, merit: -25 }, next: 'c24_after',
        say: [{ narr: '방패 줄을 지나 성벽 밖으로 나간다. 군중이 길을 연다. 누군가 촛불을 건넨다. 받는다.' }] },
    ] },
    { id: 'c24_after', lines: [
      { narr: (g, M) => ({
        block: '아침 뉴스. "영점 세대 헌터, 돔 성벽 지켜 내." 화면 밖에서 하은이 당신을 본다. 피켓이 젖어 있다.',
        mediate: '열 시가 열한 시가 되고, 열두 시가 된다. 진압 명령은 끝내 실행되지 않는다. 새벽에 군중이 스스로 흩어진다. 촛불만 성벽 아래 줄지어 남는다.',
        join: '아침 뉴스. "영점 세대 헌터, 균열교 시위대에 합류." 길드 연합 게시판에 당신 이름이 빨갛게 오른다. 군중 속에서 누가 당신 이름을 노래처럼 부른다.',
      })[M.flags.c24] || '' },
      { who: YEONHEE2, when: (g, M) => M.flags.yeonhee && M.flags.yeonhee !== 'missing', text: (g, M) => (M.flags.c24 === 'block' ? '…알아. 네 자리가 거기라는 거. 그래도 밥은 먹으러 와.' : '급식소 다시 열었어. 이번엔 누구 이름도 안 붙였어. 그냥 밥이야.') },
      { who: 'mumyeong', text: (g, M) => (M.flags.c24 === 'join' ? '오셨군요. 해협에서 뵙겠습니다.' : M.flags.c24 === 'mediate' ? '한 시간을 벌어 주셨군요. 그 한 시간에 이 사람들이 처음으로 성벽 안을 봤습니다.' : '성벽을 지키셨군요. 성벽 밖에서 그걸 본 사람들도 기억할 겁니다.') },
    ] },
    { id: 'c24_night', lines: [
      { narr: '새벽 세 시. 성벽 아래 촛불 자국. 청소차가 지나간다. 자국은 지워지지 않는다.' },
      { who: HAEUN2, when: (g, M) => M.flags.kwon === 'alive' || M.flags.kwon === 'dead', text: (g, M) => (M.flags.c24 === 'block' ? '…아빠가 그러는데, 당신은 원래 그쪽 사람이래요. 그래서 미워하면 안 된대요. 저는 아직 좀 미워요.' : '고마워요. 오늘 아무도 안 죽었어요. 그것만으로도요.') },
      { narr: '숙소로 돌아와 장비를 벗는다. 손에 촛농이 굳어 있다. 언제 묻었는지 모른다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const s = g.mainWho('seoyun');
    if (M.flags.c24 === 'join') { M.flags.kamaWatch = 'hostile'; M.flags.jinBond = 'near'; if (s && s.id != null) g.changeRel(s, -3, '시위대에 합류했다'); }
    if (M.flags.c24 === 'mediate' && s && s.id != null) g.changeRel(s, 6, '진압을 멈췄다');
    if (M.flags.c24 === 'block') g.mainRel({ leader: 2 }, '성벽을 함께 지켰다');
    g.lifeEvent(({ block: '강남 돔 성벽 앞에서 시위대를 막았다.', mediate: '강남 돔 성벽 앞에서 진압을 멈춰 세웠다.', join: '강남 돔 성벽 밖 시위대에 합류했다.' })[M.flags.c24] || '강남 돔 시위를 지켜봤다.');
    g.rumor(({ block: '강남 돔 성벽 시위가 막혔다. 영점 세대 헌터가 맨 앞에 섰다.', mediate: '강남 돔 시위가 진압 없이 끝났다. 한 헌터가 확성기를 빼앗았다는 말이 돈다.', join: '영점 세대 헌터가 균열교 시위대에 합류했다. 길드 연합이 발칵 뒤집혔다.' })[M.flags.c24] || '강남 돔 시위.');
  },
  expire: { months: 4, run: (g, M) => {
    Object.assign(M.flags, { c24: 'missed', domeBlood: true });
    g.rumor('강남 돔 성벽 앞 시위가 강제 진압됐다. 사상자 수는 발표되지 않았다.');
    return '강남 돔 시위 강제 진압. 성벽 아래 촛불 자국이 지워지지 않는다.';
  } },
});

// ---------- 25장 리더의 마지막 게이트 ----------
// 리더 생사: 이기고 신뢰(관계 40 이상 또는 위험한 장면에 함께 간 횟수 2 이상)면 은퇴, 이기면 부상, 지면 전사
const LEAD_TRUST = (g, M) => { const L = g.mainWho('leader'); const r = L ? L.relation || 0 : 0; const w = ['c10_lead_with', 'c12_lead_with', 'c13_lead_with', 'c15_lead_with', 'c17_lead_with', 'c21_lead_with', 'c24_lead_with'].filter((k) => M.flags[k]).length; const d = ['c10_lead_defied', 'c12_lead_defied', 'c13_lead_defied', 'c15_lead_defied', 'c17_lead_defied', 'c21_lead_defied', 'c24_lead_defied'].filter((k) => M.flags[k]).length; return r + w * 8 - d * 6; };
MAIN.ch(25, {
  part: 4, title: '리더의 마지막 게이트', rank: 4, after: 1, where: 'city',
  goal: (g) => (g.mainWho('leader') ? `${g.mainWho('leader').name}의 마지막 게이트` : '첫 팀의 빈자리'),
  scenes: [
    { id: 'c25_ask', lines: [
      { who: 'leader', text: LR((g, M) => (LEAD_TRUST(g, M) >= 40 ? { haera: '이번 게이트 끝나면 그만둔다. 무릎이 말을 안 듣는다. 마지막은 너랑 가고 싶다.', haeyo: '이번 게이트 끝나면 그만두려고요. 무릎이 말을 안 들어요. 마지막은 같이 가고 싶어요.', short: '이번이 마지막이다. 같이 가자.' } : { haera: '이번 게이트, 사람이 모자라다. 너밖에 생각이 안 났다. …오랜만이지.', haeyo: '이번 게이트에 사람이 모자라요. 생각나는 사람이 그쪽뿐이었어요. …오랜만이죠.', short: '사람이 모자라다. 오랜만이다.' })), alt: '첫 팀 단톡방에 옛 리더의 이름이 회색이다. 대신 팀원 하나가 연락해 온다. "리더 형(누나) 몫까지 마지막으로 한 번만 같이 가 줘."' },
      { narr: '거점 앞. 첫 팀 사람들이 모였다. 반은 처음 보는 얼굴이다. 몇 해가 지났다.' },
      { who: 'leader', when: F2_HAS_LEADER, text: LR((g, M) => (M.flags.c24 === 'join' ? { haera: '길드 연합이 너 이름 빨갛게 칠한 거 안다. 상관없다. 오늘은 내 팀이다.', haeyo: '길드 연합이 이름 빨갛게 칠한 거 알아요. 상관없어요. 오늘은 제 팀이에요.', short: '빨간 이름 상관없다. 오늘은 내 팀.' } : M.flags.c18 === 'ally' ? { haera: '관리국 신분증 들고 다닌다며. 오늘은 그거 집에 두고 와.', haeyo: '관리국 신분증 들고 다니신다면서요. 오늘은 두고 오세요.', short: '관리국 신분증은 두고 와.' } : { haera: '첫날 기억나냐. 전단지. 네가 안 버렸던 거.', haeyo: '첫날 기억나요? 전단지. 안 버리셨던 거.', short: '전단지. 기억나지.' })) },
      { narr: '돔 진압 이후 첫 팀에서 둘이 그만뒀다. 그날 성벽 아래 있었던 사람들이다. 남은 사람들도 그 얘기는 꺼내지 않는다.', when: (g, M) => !!M.flags.domeBlood },
    ] },
    { id: 'c25_prep', lines: [
      { narr: '전날 밤. 거점 창고. 첫 팀이 장비를 점검한다. 칼날 기름, 붕대, 코어 주머니. 오래된 순서 그대로.' },
      { who: 'leader', text: LR({ haera: '너 처음 왔을 때 붕대를 거꾸로 감았다. 기억나냐. 지금은 내가 배워야겠다.', haeyo: '처음 오셨을 때 붕대를 거꾸로 감으셨죠. 지금은 제가 배워야겠어요.', short: '붕대. 거꾸로 감던 놈이.' }), alt: '옛 리더가 쓰던 붕대 감는 순서를 팀원 하나가 그대로 따라 한다. 다들 아무 말 없이 본다.' },
      { narr: (g, M) => (M.flags.c13_lead_with || M.flags.c21_lead_with ? '새벽 세 시 그 택시, 강릉 방벽의 줄. 같이 간 밤들이 손에 익어 있다.' : '같이 간 밤보다 따로 간 밤이 많았다. 그게 오늘 조금 무겁다.') },
    ], pause: { days: 1, label: '게이트', text: '내일 아침, 마지막 게이트에 들어간다.' } },
    { id: 'c25_gate', lines: [
      { narr: '게이트 안. 공기가 짜다. 바다 냄새. 요즘 게이트는 다 이렇다.' },
      { narr: '가장 깊은 방. 리더가 앞에 선다. 처음 만났을 때처럼. "뒤는 맡긴다."' },
    ], choices: [
      { text: '앞으로 나란히 선다', set: { c25: 'front' }, next: 'c25_after',
        fight: (g) => ({ title: '마지막 게이트의 주인', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2, boss: true, elem: 'water', name: '짠물의 주인' },
          ally: (() => { const L = g.mainWho('leader'); return L ? { name: L.name, rank: L.rankIdx, elem: L.element } : undefined; })(),
          win: { text: '주인이 쓰러진다. 리더가 무릎을 짚고 웃는다.', gain: { fame: 10 } }, lose: { text: '눈앞이 하얗다. 리더가 당신 앞을 막아서는 게 마지막으로 보인다.', gain: { injure: 1 } } }) },
    ] },
    { id: 'c25_after', lines: [
      { narr: (g, M) => {
        const L = g.mainWho('leader');
        if (!M.flags.leaderFate) M.flags.leaderFate = !L ? 'gone' : M.flags.fight_c25_gate === 'lose' ? 'dead' : LEAD_TRUST(g, M) >= 40 ? 'retire' : 'hurt';
        return ({ retire: '게이트 밖. 리더가 장비를 하나씩 풀어 바닥에 내려놓는다. 마지막으로 칼을 내려놓고, 당신에게 내민다. "이건 네 거다."', hurt: '들것. 리더의 한쪽 다리가 이상한 각도로 꺾여 있다. 살았다. 다시 게이트에 들어갈 수는 없다.', dead: '게이트 밖. 리더는 걸어 나오지 못했다. 팀원들이 그 이름을 부른다. 대답이 없다.', gone: '게이트 밖. 빈자리에 옛 리더의 사진을 세운다. 누가 국화를 놓는다.' })[M.flags.leaderFate];
      } },
      { who: 'leader', when: (g, M) => M.flags.leaderFate === 'retire', text: LR({ haera: '팀 이름 네가 가져라. 사람도. …잘 해라. 전단지 안 버리던 놈답게.', haeyo: '팀 이름 가져가세요. 사람들도요. …잘해요. 전단지 안 버리던 사람답게.', short: '팀 네가 가져. 잘 해라.' }) },
      { who: 'leader', when: (g, M) => M.flags.leaderFate === 'hurt', text: LR({ haera: '다리 하나로 끝났으면 싸게 막은 거다. 울지 마. 너 우는 거 처음 본다.', haeyo: '다리 하나로 끝났으면 싸게 막은 거예요. 울지 마요. 우는 거 처음 봐요.', short: '싸게 막았다. 울지 마.' }) },
      { narr: '장례식장. 첫 팀 사람들이 줄지어 선다. 당신 차례. 할 말을 고르다 아무것도 못 한다.', when: (g, M) => M.flags.leaderFate === 'dead' },
    ] },
    { id: 'c25_week', lines: [
      { narr: (g, M) => ({ retire: '일주일 뒤. 옛 리더가 거점 앞 분식집을 연다고 한다. 간판 이름은 "전단지".', hurt: '일주일 뒤 병문안. 옛 리더가 목발로 복도를 왕복한다. "이거 생각보다 운동 된다."', dead: '일주일 뒤. 거점 벽에 사진 한 장이 붙는다. 그 아래 팀원들이 붕대 한 롤씩 놓고 간다.', gone: '일주일 뒤. 첫 팀이 새 이름으로 등록한다. 리더 칸에 당신 이름.' })[M.flags.leaderFate || 'gone'] },
      { who: 'friend', text: '소식 들었어. …나 보러 와. 오래 얘기하고 싶어.', alt: '휴대폰에 친구의 부재중 전화. 다시 걸지 못한다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const L = g.mainWho('leader'); const f = M.flags.leaderFate || 'gone';
    if (L && f === 'dead' && g.killNpc) g.killNpc(L, '마지막 게이트');
    if (L && f === 'hurt') L.hurt = Math.max(L.hurt || 0, 6);
    g.lifeEvent(({ retire: '첫 팀 리더가 은퇴했다. 칼을 물려받았다.', hurt: '첫 팀 리더가 마지막 게이트에서 다리를 잃었다.', dead: '첫 팀 리더가 마지막 게이트에서 돌아오지 못했다.', gone: '첫 팀 리더의 빈자리에서 마지막 게이트를 닫았다.' })[f]);
    if (f === 'dead') g.rumor(`${L ? L.name : '한 리더'}이(가) 마지막 게이트에서 팀원을 지키고 숨졌다.`);
  },
  expire: { months: 6, run: (g, M) => {
    const L = g.mainWho('leader'); M.flags.c25 = 'missed'; M.flags.leaderFate = L ? 'hurt' : 'gone';
    if (L) L.hurt = Math.max(L.hurt || 0, 6);
    return L ? `${L.name}이(가) 마지막 게이트에서 크게 다쳤다는 소식. 당신 없이 들어갔다.` : '첫 팀이 해체됐다는 소식.';
  } },
});

// ---------- 26장 친구에게 ----------
MAIN.ch(26, {
  part: 4, title: '친구에게', rank: 4, after: 0, where: (g) => { const f = g.mainWho('friend'); return f && f.region ? f.region : 'city'; },
  goal: (g) => `${g.mainWho('friend') ? g.mainWho('friend').name : '친구'}와 긴 밤`,
  scenes: [
    { id: 'c26_wait', lines: [
      { narr: (g, M) => (M.flags.leaderFate === 'dead' ? '장례 뒤 처음으로 친구에게 답장을 보낸다. "다음 주 토요일. 옥상."' : '친구에게 답장을 보낸다. "다음 주 토요일. 옥상. 캔은 내가 살게."') },
      { who: 'friend', text: '응. 기다릴게.', alt: '읽음 표시만 뜬다. 그걸로 충분하다.' },
    ], pause: { days: 7, label: '토요일', text: '일주일 뒤 토요일, 친구의 동네 옥상.' } },
    { id: 'c26_roof', lines: [
      { narr: (g, M) => (M.flags.friend3 === 'late' && !F2_AWAKE(g) ? '옥상. 친구가 먼저 와 있다. 맨발. 바다 색 눈. 진서해 곁에서 빠져나왔다고 한다. 오늘 하루만.' : '옥상. 어릴 적 동네가 내려다보인다. 놀이터는 주차장이 됐다. 친구가 캔맥주 두 개를 든다.') },
      { who: 'friend', text: (g, M) => (F2_AWAKE(g) ? '너 리더 일 들었다. …나도 각성자잖아. 이번엔 같이 싸우게 해 줘. 지우 일도 있고. 이제 구경만 하는 거 싫어.' : M.flags.friend3 === 'late' ? '나 이제 각성자야. 억지로 됐지만. 처음으로 경보가 안 무서워. 근데 밤마다 바다 소리가 들려. 그게 무서워.' : '나는 아직 아무것도 아니야. 너는 S급 될 거고. 나는 경보 울리면 숨겠지. …나 같은 사람도 살 수 있는 세상, 있어?') },
      { narr: (g, M) => (M.flags.leaderFate === 'dead' ? '친구가 캔을 하나 더 따서 난간에 올려 둔다. 당신 리더 몫이라고 한다.' : '바람이 분다. 짠 바람이다. 여기는 바다에서 멀다.') },
      { who: 'friend', when: (g, M) => !!M.flags.domeBlood, text: '돔 앞 진압 영상 봤어. 끝까지는 못 봤어. 너 거기 없었지? …없었다니 다행인데, 왜 다행인지 모르겠다.' },
    ] },
    { id: 'c26_walk', lines: [
      { narr: '캔이 반쯤 비자 동네를 걷는다. 문방구 자리는 편의점, 편의점 자리는 협회 출장소. 놀이터 자리 주차장에 미끄럼틀 기둥 하나가 남아 있다.' },
      { who: 'friend', text: (g, M) => (F2_AWAKE(g) ? (M.flags.friend3 === 'saved' ? '지우가 요즘 공부해. 협회 시험 본대. 각성자 말고 협회 직원. 경보 울리면 사람 대피시키는 사람.' : '지우는… 진서해 옆에 있어. 한 달에 한 번 엽서가 와. 바다 사진. 글씨는 지우 글씨야.') : M.flags.friend3 === 'late' ? '여기 서면 아직도 바다 소리가 나. 놀이터에서 바다 소리라니, 웃기지.' : '기둥 남은 거 봐. 우리 그 위에서 뛰어내리다 너 이마 깨졌잖아.') },
    ] },
    { id: 'c26_talk', lines: [
      { who: 'friend', text: (g, M) => (M.flags.c24 === 'join' ? '너 돔 앞에서 촛불 받았지. 영상 봤어. 나 울었어.' : M.flags.c24 === 'block' ? '너 돔 앞에서 방패 쪽에 섰지. 영상 봤어. 이해해. 근데 좀 멀게 느껴졌어.' : '너 돔 앞에서 확성기 뺏었다며. 너답다.') },
      { who: 'friend', text: '물어볼게. 진짜로. 문 닫을 거야? 열 거야?' },
    ], choices: [
      { text: '"닫을 거야. 그래도 숨는 사람 없게 할 방법을 찾을게."', set: { c26: 'close' }, next: 'c26_end' },
      { text: '"열 수도 있어. 모두가 숨지 않아도 된다면."', set: { c26: 'open' }, next: 'c26_end' },
      { text: '"닫지도 열지도 않는 길이 있을 거야. 저편도 이편도 사는."', when: (g, M) => !!M.flags.arinName, set: { c26: 'bridge' }, next: 'c26_end' },
    ] },
    { id: 'c26_end', lines: [
      { who: 'friend', text: (g, M) => ({ close: '…그래. 너라면 그 방법 찾겠지. 찾으면 제일 먼저 나한테 말해.', open: '그 말 진서해도 했어. 너 입에서 들으니까 다르게 들린다. 더 무섭게.', bridge: '그런 길이 있으면 좋겠다. 놀이터처럼. 미끄럼틀 위에서 둘 다 웃던 거처럼.' })[M.flags.c26] },
      { narr: '새벽까지 이야기한다. 학교, 놀이터, 첫 각성 날 걸려 온 전화. 캔이 다 비자 친구가 어깨에 기대 잠든다.' },
    ] },
    { id: 'c26_morning', lines: [
      { narr: (g, M) => (!M.flags.arinAsk ? '꿈. 아린이 문 안쪽에서 이쪽을 본다. 말은 없다.' : M.flags.arinAsk === M.flags.c26 ? '꿈. 아린이 문 안쪽에서 웃는다. 부탁했던 그 길이다. 손을 흔든다.' : '꿈. 아린이 문 안쪽에서 고개를 돌린다. 부탁한 길이 아니다. 그래도 문을 붙잡은 손은 놓지 않는다.') },
      { narr: '아침. 친구가 먼저 깨어 라면을 끓인다. 냄비 하나에 젓가락 두 벌. 시험 날 동기가 떠오른다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.endSeed = M.flags.c26; const f = g.mainWho('friend'); if (f) g.changeRel(f, 8, '긴 밤을 함께 보냈다');
    g.lifeEvent(({ close: '친구에게 문을 닫겠다고 말했다.', open: '친구에게 문을 열 수도 있다고 말했다.', bridge: '친구에게 닫지도 열지도 않는 길을 찾겠다고 말했다.' })[M.flags.c26] || '친구와 긴 밤을 보냈다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c26: 'missed', endSeed: 'none' }); const f = g.mainWho('friend'); if (f) g.changeRel(f, -5, '끝내 시간을 내지 않았다');
    return '친구에게서 문자. "바쁘지? 괜찮아. 나중에."';
  } },
});

// ---------- 27장 해협 ----------
MAIN.ch(27, {
  part: 4, title: '해협', rank: 4, after: 1, where: 'busan', cal: 'strait',
  goal: '부산 앞바다',
  scenes: [
    { id: 'c27_road', lines: [
      { narr: '부산행. 해상 도시 진입로에 검문이 세 겹이다. 흰 배 소식 이후로 부산은 반쯤 봉쇄됐다.' },
      { narr: (g, M) => (M.flags.c24 === 'join' ? '검문소 경관이 당신 얼굴을 보고 무전기를 든다. 십 분을 기다린다. 통과. 누가 위에서 풀어 줬다.' : '검문소 경관이 신분증을 보고 경례한다. 돔 앞에서 당신을 봤다고 한다.') },
    ], pause: { days: 2, label: '부산', text: '이틀 뒤, 부산 해상 도시에 닿는다.' } },
    { id: 'c27_rift', lines: [
      { narr: (g) => ({
        active: '부산 앞바다가 갈라졌다. 재앙 경보. 대한해협 대균열. 수평선 끝까지 이어진 금이 번개를 토한다.',
        player: '해협의 균열은 당신이 한 번 눌러 놓았다. 그 자리에 흰 배들이 떠 있다. 수백 척.',
        npc: '해협의 균열은 다른 헌터들이 눌러 놓았다. 그런데 그 위에 흰 배들이 모이고 있다.',
        fail: '해상 도시 외곽이 할퀴어져 있다. 그 상처 위에 흰 배들이 떠 있다.',
        none: '부산 앞바다에 흰 배 수백 척. 해경이 접근하지 못한다. 배들 한가운데 바다가 반으로 갈라지기 시작한다.',
      })[CAL_OF(g, 'strait')] },
      { narr: '해상 도시 대형 화면이 일제히 바뀐다. 진서해. 흰 배 맨 앞에 서 있다. 가면은 없다.' },
      { who: 'mumyeong', text: '다음 보름, 이 해협 위에서 마지막 의식을 엽니다. 문을 끝까지. 원하는 분은 오세요. 각성하지 못한 모든 분께 문을 엽니다.' },
      { who: 'mumyeong', text: (g, M) => ({ near: `${g.player.name} 님, 당신 자리는 제 옆에 비워 둡니다.`, foe: `${g.player.name} 님, 반박하러 오세요. 기다리겠습니다.`, open: `${g.player.name} 님, 이번엔 정하셔야 합니다.` })[M.flags.jinBond || 'open'] },
      { narr: '동해 심해의 틈이 넓어진 뒤로 남해까지 초록 비늘이 떠밀려 온다. 해협이 그 물을 끌어당기고 있다.', when: (g, M) => !!M.flags.abyssWide },
    ] },
    { id: 'c27_council', lines: [
      { narr: '그날 밤. 숙소에 사람들이 모인다. 모일 수 있는 사람들이.' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyun, text: (g, M) => (M.flags.seoyunShake ? '관리국은 해협을 통째로 봉쇄한대요. 봉쇄가 아니라 폭격이에요. 배에 탄 사람들까지.' : '관리국 작전 개요예요. 당신 이름이 "제거 대상" 칸에 있어요. 알려 주러 왔어요. 마지막으로.') },
      { who: 'madohyun', when: (g, M) => M.flags.madoState === 'ally', text: '열쇠가 필요할 때가 왔네. 문 앞에 서 주게. 닫는 건 자네 몫이다.' },
      { narr: '구치소 면회실. 유리 너머 마도현이 말한다. "해협에 가게 되면, 제주를 보게. 문은 해협이 아니라 거기 있어."', when: (g, M) => M.flags.madoState === 'jailed' },
      { who: 'rival', when: (g, M) => M.flags.rivalEnd === 'with', text: (g, M) => RIVAL_LINE(g, M, { kama: '봉쇄선 안쪽 배치표 빼 왔다. 너 들어갈 틈 하나 있다.', cult: '의식 순서 알아냈어. 마지막에 "열쇠"가 문 앞에 서야 한대. 너야.', solo: '배 하나 구했다. 낡았지만 뜬다.', alone: '나도 간다. 이번엔.', none: '같이 간다.' }) },
      { who: GOJ, when: (g, M) => M.flags.goJae === 'alive', text: '그 애가 울고 있어. 밤새. 바다 전체가 울어.' },
      { who: 'arin', text: '그 사람이 문을 끝까지 열면 우리 쪽 마지막 숨이 너희 쪽으로 다 넘어가. 그럼 나는… 괜찮아. 너는 정해. 너 쪽에서.' },
    ] },
    { id: 'c27_harbor', lines: [
      { narr: '새벽 항구. 어부들이 그물을 걷지 않는다. 바다에 그물을 넣으면 초록빛 비늘이 걸려 나온다고 한다. 처음 보는 물고기라고.' },
      { who: 'arin', text: (g, M) => (M.flags.arinPromise ? '우리 쪽 물고기야. 틈으로 넘어왔어. …약속, 아직 유효해?' : '우리 쪽 물고기야. 틈으로 넘어왔어. 너희 바다에서 숨을 쉬네. 신기하지.') },
    ] },
    { id: 'c27_choose', lines: [
      { narr: '창밖. 해협 쪽 하늘이 번개로 갈라진다. 다음 보름까지 한 달.' },
    ], choices: [
      { text: '서윤과 관리국 안쪽 사람들에게 날짜를 넘긴다', set: { c27: 'kama' } },
      { text: '혼자 준비한다', set: { c27: 'solo' } },
      { text: '진서해에게 답장한다 — "해협에서 봅시다."', set: { c27: 'reply' } },
    ] },
    { id: 'c27_end', lines: [
      { narr: (g, M) => ({ kama: '서윤이 날짜를 받아 적는다. "폭격은 제가 늦출게요. 하루라도."', solo: '장비를 하나씩 점검한다. 리더에게 받은 것, 노인에게 받은 것, 친구가 남긴 캔 고리.', reply: '답장은 짧다. 읽음 표시가 곧바로 뜬다. 그리고 한 줄. "기다리겠습니다."' })[M.flags.c27] },
      { narr: (g, M) => (M.flags.halfRing ? '반쪽 원이 손바닥 위에서 바다 쪽을 향해 기운다. 해협이 아니라, 더 남쪽. 제주.' : '바다 냄새가 방 안까지 들어온다.') },
      { sys: '4부 「재앙의 해」 끝. 5부 「봉쇄선 너머」는 A급이 되면 열린다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.straitRitual = true;
    M.part4 = { abyss: M.flags.c21 || 'missed', rival: M.flags.rivalEnd || 'gone', jin: M.flags.jinBond || 'open', dome: M.flags.c24 || 'missed', leader: M.flags.leaderFate || 'gone', seed: M.flags.endSeed || 'none', plan: M.flags.c27 };
    g.lifeEvent('진서해가 해협 위 마지막 의식을 예고했다.');
    g.rumor('진서해가 다음 보름 대한해협 위에서 "마지막 의식"을 연다고 선언했다.');
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c27: 'missed', straitRitual: true, straitStrong: true });
    M.part4 = { abyss: M.flags.c21 || 'missed', rival: M.flags.rivalEnd || 'gone', jin: M.flags.jinBond || 'open', dome: M.flags.c24 || 'missed', leader: M.flags.leaderFate || 'gone', seed: M.flags.endSeed || 'none', plan: 'missed' };
    g.rumor('대한해협 위 흰 배 수백 척. 진서해의 의식이 이미 시작됐다는 말이 돈다.');
    return '해협 위 흰 배들이 의식을 시작했다는 뉴스. 당신 없이.';
  } },
});
