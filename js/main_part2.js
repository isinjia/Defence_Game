// ===== 메인 시나리오 2부 「보름의 의식」 (영역 D, docs/메인_시나리오.md §3 · docs/메인_2부_작업지시.md) =====
// 1부 플래그(dream·c4·cultist·badge7·kamaWatch·rivalPath·doyun·yeonhee·kwon·c1_call·friendNear)를 9장부터 읽는다.
const F2_AWAKE = (g) => { const f = g.mainWho('friend'); return !!(f && f.rankIdx >= 1); };
const F2_HAS_LEADER = (g) => !!g.mainWho('leader');
const F2_HAS_RIVAL = (g) => !!g.mainWho('rival');
const F2_IN_CREW = (g) => !!(g.player.crew && g.crewLeader && g.crewLeader());
// 10·13장의 '균열교에 끌린 사람': 친구가 비각성이면 친구, 각성자면 친구의 동생 지우
const F2_TARGET = (g) => (F2_AWAKE(g) ? '{friend}의 동생 지우' : '{friend}');
const KID2 = { name: '도윤', sub: '경계선 마을' };
const SEOYUN_ON = (g, M) => M.flags.seoyun === 'ally' || M.flags.seoyun === 'shaken';
const RIVAL_LINE = (g, M, T) => T[M.flags.rivalPath || 'none'] || T.none || '';
// 2부 위험 장 진입 전 리더 반응(1부와 같은 규칙)
const F2_STANCE = (g, M) => { const L = g.mainWho('leader'); const r = L ? L.relation || 0 : 0; return r >= 40 || (L && L.personality === 'kind') ? 'with' : r < 10 || (L && L.personality === 'cold') ? 'stop' : 'let'; };
// 리더 말투(C의 말투표): { haera, haeyo, short } 중 리더 말투로
const LR = (T) => (g, M) => g.mainReg(typeof T === 'function' ? T(g, M) : T, g.mainWho('leader'));
// 위험 장 진입 전 리더 반응. T = { narr, with, stop, let, call, alt } — 장마다 다른 말
const LEAD_T = {
  c10: { narr: '친구가 균열교 모임에 나간다는 얘기를 꺼내자 {leader}이(가) 잠깐 말이 없다.',
    with: { haera: '친구 일이면 간다. 사람 끌어내는 건 둘이 낫다.', haeyo: '친구분 일이면 같이 가요. 사람 데려오는 건 둘이 나아요.', short: '간다. 둘이 낫다.' },
    stop: { haera: '남의 신앙에 손대는 거다. 팀 이름 걸고는 안 된다.', haeyo: '남의 신앙에 손대는 거예요. 팀 이름 걸고는 안 돼요.', short: '안 돼. 팀 이름 걸려.' },
    let: { haera: '네 친구다. 네가 정해. 대신 모임 안에선 아무것도 먹지 마.', haeyo: '친구분 일은 직접 정하세요. 대신 거기서 아무것도 드시지 마요.', short: '네가 정해. 거기 음식은 먹지 마.' },
    call: { haera: '(전화) 균열교 모임에 간다고? 혼자 가지 마라. 정 가면 위치 켜 둬.', haeyo: '(전화) 균열교 모임에 가신다고요? 혼자 가지 마요. 위치는 켜 두세요.', short: '(전화) 혼자 가지 마. 위치 켜.' },
    alt: '첫 팀 리더 번호를 눌렀다가 지운다. 물어볼 선배가 없다는 게 이럴 때 실감 난다.' },
  c12: { narr: '강북 보름 밤에 간다고 하자 {leader}이(가) 지도를 접는다.',
    with: { haera: '보름 밤엔 길드도 강북 안 들어간다. 그러니까 내가 간다.', haeyo: '보름 밤엔 길드도 강북 안 들어가요. 그러니까 제가 같이 가요.', short: '내가 간다.' },
    stop: { haera: '재앙 경보 걸린 구역에 의식까지다. 두 번 말 안 한다. 가지 마.', haeyo: '재앙 경보 구역에 의식까지예요. 가지 마세요. 진심이에요.', short: '가지 마. 경보 구역이다.' },
    let: { haera: '선로 아래로는 내려가지 마라. 내려갈 거면 나한테 먼저 전화하고.', haeyo: '선로 아래로는 내려가지 마세요. 내려가실 거면 먼저 연락 주시고요.', short: '선로 밑은 안 된다. 전화하고 가.' },
    call: { haera: '(전화) 보름 밤 강북? 뉴스 봤다. 살아서 문자 하나만 보내라.', haeyo: '(전화) 보름 밤 강북이라고요? 살아서 문자 하나만 주세요.', short: '(전화) 살아서 문자 해.' },
    alt: '보름 전날 밤, 연락처를 끝까지 내려 본다. 이런 밤에 전화할 선배가 없다.' },
  c13: { narr: '새벽 세 시. 신발을 신는데 {leader}이(가) 숙소 문간에 서 있다. 통화 소리를 들었다.',
    with: { haera: '차 키 내가 들고 있다. 타.', haeyo: '차 키 제가 들고 있어요. 타세요.', short: '타.' },
    stop: { haera: '함정이다. 새벽 세 시에 오는 전화는 다 함정이야. …그래도 갈 거지.', haeyo: '함정이에요. 새벽 세 시 전화는 다 함정이에요. …그래도 가시겠죠.', short: '함정이다. 그래도 가겠지.' },
    let: { haera: '주소 보내 놔. 해 뜰 때까지 소식 없으면 내가 간다.', haeyo: '주소 보내 두세요. 해 뜰 때까지 소식 없으면 제가 갈게요.', short: '주소 보내. 해 뜨면 간다.' },
    call: { haera: '(전화) 깨어 있었다. 무슨 일이냐. …주소 불러.', haeyo: '(전화) 깨어 있었어요. 무슨 일이에요? 주소 불러 주세요.', short: '(전화) 주소 불러.' },
    alt: '택시 뒷자리. 누구에게라도 주소를 남겨 두고 싶은데, 보낼 곳이 마땅치 않다.' },
  c15: { narr: '대구 분지 남쪽에 간다고 하자 {leader}이(가) 계측표를 내민다.',
    with: { haera: '저 수치면 사람 하나로 안 된다. 열 견디는 장비 두 벌 챙겼다.', haeyo: '저 수치면 혼자선 안 돼요. 열 견디는 장비 두 벌 챙겼어요.', short: '장비 두 벌 챙겼다.' },
    stop: { haera: '관리국 출입 금지 구역이다. 거기 들어가면 팀 면허가 날아간다.', haeyo: '관리국 출입 금지 구역이에요. 들어가면 팀 면허가 날아가요.', short: '금지 구역이다. 면허 날아간다.' },
    let: { haera: '숨이 따끔하면 바로 나와. 영웅 놀이 하다 폐 태운 놈 여럿 봤다.', haeyo: '숨이 따끔하면 바로 나오세요. 그러다 폐 다친 사람 여럿 봤어요.', short: '따끔하면 나와.' },
    call: { haera: '(전화) 대구 간다며. 분지 남쪽은 관리국 땅이다. 들키지 마라.', haeyo: '(전화) 대구 가신다면서요. 분지 남쪽은 관리국 땅이에요. 들키지 마세요.', short: '(전화) 남쪽은 관리국 땅이다.' },
    alt: '대구행 이동망. 예전 같으면 리더에게 계측표부터 물었을 것이다. 이제는 혼자 숫자를 읽는다.' },
  c17: { narr: '관리국 본청에 들어간다는 말에 {leader}이(가) 웃지도 않는다.',
    with: { haera: '밖에서 차 대고 기다린다. 십사 분 넘으면 들어간다.', haeyo: '밖에서 차 대고 기다릴게요. 십사 분 넘으면 들어가요.', short: '밖에서 기다린다. 십사 분.' },
    stop: { haera: '그건 게이트가 아니라 나라다. 나라는 칼로 안 베인다. 가지 마.', haeyo: '그건 게이트가 아니라 나라예요. 칼로 안 베여요. 가지 마세요.', short: '나라는 못 벤다. 가지 마.' },
    let: { haera: '나는 모르는 일이다. 모르는 게 너한테도 낫다. 돌아오면 밥 사.', haeyo: '저는 모르는 일로 할게요. 그게 서로 나아요. 돌아오면 밥 사세요.', short: '모르는 일로 한다. 밥 사.' },
    call: { haera: '(전화) 인천? 본청 근처면 전화 꺼 둬라. 기지국에 다 잡힌다.', haeyo: '(전화) 인천이세요? 본청 근처면 전화 꺼 두세요. 다 잡혀요.', short: '(전화) 본청 근처면 전화 꺼.' },
    alt: '본청 앞 횡단보도. 신호를 기다리며 생각한다. 실패하면 누가 나를 찾아올까.' },
  c21: { narr: '강릉 속보를 보던 {leader}이(가) 화면을 끈다.',
    with: { haera: '물속은 내가 너보다 오래 해 봤다. 같이 내려간다.', haeyo: '물속은 제가 더 오래 해 봤어요. 같이 내려가요.', short: '같이 내려간다.' },
    stop: { haera: 'B급 둘이 내려가서 살아 올라온 기록이 없다. 이번엔 진짜 말린다.', haeyo: 'B급 둘이 내려가서 살아 온 기록이 없어요. 이번엔 진짜 말려요.', short: '기록이 없다. 말린다.' },
    let: { haera: '방벽 위에 있을게. 줄 잡고 있는 사람 하나는 있어야지.', haeyo: '방벽 위에 있을게요. 줄 잡을 사람 하나는 있어야죠.', short: '방벽에서 줄 잡는다.' },
    call: { haera: '(전화) 강릉 갔냐. 바다 밑은 위아래가 없다. 줄 꼭 매.', haeyo: '(전화) 강릉 가셨어요? 바다 밑은 위아래가 없어요. 줄 꼭 매세요.', short: '(전화) 줄 꼭 매.' },
    alt: '방벽 위 사람들 사이에 낯익은 뒷모습이 있나 찾는다. 없다. 줄은 혼자 맨다.' },
  c24: { narr: '돔 앞 생중계를 보던 {leader}이(가) 리모컨을 내려놓는다.',
    with: { haera: '방패 쪽이든 촛불 쪽이든 네 옆에 선다. 어느 쪽인지는 가서 정해.', haeyo: '방패 쪽이든 촛불 쪽이든 옆에 설게요. 어느 쪽인지는 가서 정하세요.', short: '네 옆에 선다.' },
    stop: { haera: '사람 대 사람이다. 게이트보다 나쁘다. 어느 쪽에 서든 원망 듣는다.', haeyo: '사람 대 사람이에요. 게이트보다 나빠요. 어느 쪽에 서든 원망 들어요.', short: '사람끼리다. 가지 마.' },
    let: { haera: '칼은 집에 두고 가. 오늘은 그게 필요한 날 아니다.', haeyo: '칼은 두고 가세요. 오늘은 그게 필요한 날이 아니에요.', short: '칼은 두고 가.' },
    call: { haera: '(전화) 돔 앞 영상에 너 찍혔다. 어디 서 있든 다치지만 마.', haeyo: '(전화) 돔 앞 영상에 찍히셨어요. 어디 계시든 다치지만 마세요.', short: '(전화) 다치지만 마.' },
    alt: '돔으로 가는 지하철. 옆자리 사람이 피켓을 무릎에 놓고 졸고 있다.' },
};
const leadScene = (id, key) => { const T = LEAD_T[key]; return {
  id, skip: (g) => !F2_IN_CREW(g), lines: [
    { narr: T.narr },
    { who: 'leader', text: LR((g, M) => T[F2_STANCE(g, M)]) },
  ], choices: [
    { text: '같이 가 달라고 한다', when: (g, M) => F2_STANCE(g, M) === 'with', set: { [`${id}_with`]: true }, rel: { leader: 2 }, relWhy: '위험한 일에 함께 갔다' },
    { text: '"그래도 갈게요."', when: (g, M) => F2_STANCE(g, M) === 'stop', set: { [`${id}_defied`]: true }, rel: { leader: -2 }, relWhy: '말렸는데 갔다' },
    { text: '"연락은 할게요."', when: (g, M) => F2_STANCE(g, M) === 'let' },
  ] }; };
// 팀원이 아닐 때: 옛 리더의 전화 한 줄, 리더도 없으면 서술
const leadEcho = (key) => ({ who: 'leader', when: (g) => !F2_IN_CREW(g), text: LR(LEAD_T[key].call), alt: LEAD_T[key].alt });

// ---------- 9장 감시자 ----------
MAIN.ch(9, {
  part: 2, title: '감시자', rank: 2, after: 1, where: 'city',
  goal: '협회 지부에 들른다',
  start: (g, M) => (M.flags.dream === 'ignore' || M.flags.dreamDebt ? 'c9_dream' : 'c9_cafe'),
  scenes: [
    { id: 'c9_dream', lines: [
      { narr: '또 그 꿈이다. 이번엔 바다가 발목까지 차 있다. 문이 한 걸음 앞이다.' },
      { who: 'arin', text: '…모른 척했지. 괜찮아. 다들 그래. 근데 이제는 못 해.' },
      { narr: '깨어나 보니 방바닥이 젖어 있다. 물이 아니다. 에테르가 고여 있다. 손바닥만큼.' },
      { narr: '오후에 협회에서 연락이 온다. "관리국에서 한 분이 뵙자고 하십니다. 지난주부터 몇 번 찾으셨어요."' },
    ], pause: { days: 3, label: '협회 지부', text: '사흘 뒤, 협회 지부에서 그 사람을 만나기로 했다.' } },
    { id: 'c9_cafe', lines: [
      { art: 'seoyun-suit', narr: '협회 지부 1층 카페. 창가 자리에 회색 정장의 여자가 앉아 있다. 서른 초반. 머리를 단단히 묶었다. 앞에 놓인 커피는 손도 안 댔다.' },
      { narr: '여자가 신분증을 보인다. 국가 각성자 관리국, 특수조사관. 한서윤.' },
      { who: 'seoyun', text: (g, M) => ({
        stop: '배교자 사냥꾼. 헌터넷에선 그렇게 부르더군요. 강북 폐역 반쪽 문을 혼자 닫은 분.',
        raid: M.flags.kamaWatch === 'hostile' ? '서약서에 서명을 거부하신 분이죠. 관리국 기록에 동그라미가 하나 쳐져 있어요. 그래서 제가 왔고요.' : '폐역 진압 때 서약서에 서명하셨죠. 협조적인 분이라 들었어요. 그래서 제가 왔어요. 겁먹진 마세요.',
        join: '강북 폐역 앞줄 영상. 몇 번을 돌려 봤어요. 비각성자들이 쓰러지는데 당신만 서 있더군요. 숨도 안 흐트러지고.',
        save: '권하은 양 보호자 연락처에 당신 번호가 적혀 있더군요. 보건소 기록에서 봤어요.',
        missed: '폐역 사고 날, 어디 계셨는지는 묻지 않을게요. 대신 다른 걸 묻죠.',
      })[M.flags.c4] || '처음 뵙겠습니다.' },
      { who: 'seoyun', text: '당신, 꿈을 꾸죠?' },
      { narr: '커피 잔에 비친 창밖이 잠깐 검은 바다처럼 보인다.' },
      { who: 'seoyun', text: (g, M) => (M.flags.dream === 'search' ? '헌터넷 꿈 게시판 글. 그거 지운 게 저희예요. 당신 글도요. 검색 기록이 남거든요.' : M.flags.dream === 'record' ? '공책에 적어 두셨죠. 검은 바다, 문, 목소리. "상처는 곪는다." …보고 싶네요, 그 공책.' : '모른 척하셨겠죠. 다들 처음엔 그래요. 근데 요즘 아침에 방바닥이 젖어 있지 않아요?') },
    ] },
    { id: 'c9_file', lines: [
      { narr: '서윤이 서류철을 하나 민다. 표지에 아무것도 적혀 있지 않다.' },
      { narr: '안에는 이름이 빼곡하다. 생년이 모두 같다. 대붕괴가 일어난 해. 그중 몇 줄에 빨간 줄이 그어져 있다.' },
      { who: 'seoyun', text: '관리국은 이 사람들을 "영점 세대"라고 불러요. 대붕괴 해에 태어났거나 그해 제주 바람을 맞은 각성자들. 같은 꿈을 꾸죠. 검은 바다, 문, 이름을 부르는 목소리.' },
      { who: 'seoyun', text: '빨간 줄은 연락이 끊긴 사람들이에요. 대부분 균열교에 들어갔고, 일부는… 그냥 사라졌어요.' },
      { narr: (g, M) => (M.flags.badge7 ? '서류 맨 아래 메모. "균열교 내부 호칭: 형제 일곱." 주머니 속 쇠 배지가 무겁다.' : '서류 맨 아래에 당신 이름이 있다. 빨간 줄은 없다. 아직은.') },
    ] },
    { id: 'c9_choice', lines: [
      { who: 'seoyun', text: '협조해 주세요. 꿈을 꾸면 알려 주시고, 균열교가 접촉해 오면 알려 주시면 돼요. 대신 저도 아는 걸 나눌게요. 전부는 아니지만.' },
    ], choices: [
      { text: '협조한다', set: { seoyun: 'ally' }, run: (g, M) => { const n = g.mainNpc('seoyun', { name: '한서윤', gender: 'F', rankIdx: 3, stage: 1, guild: 'kama', personality: 'just', region: g.player.region }); g.changeRel(n, 10, '협조하기로 했다'); g.lifeEvent('관리국 특수조사관 한서윤에게 협조하기로 했다.'); },
        say: [{ who: 'seoyun', text: '고마워요. …솔직히 거절할 줄 알았어요. 영점 세대는 관리국을 싫어하거든요. 이유가 있으니까.' }] },
      { text: '거절한다', set: { seoyun: 'watch' }, run: (g, M) => { const n = g.mainNpc('seoyun', { name: '한서윤', gender: 'F', rankIdx: 3, stage: 1, guild: 'kama', personality: 'just', region: g.player.region }); g.changeRel(n, -5, '협조를 거절했다'); g.rumor('관리국이 대붕괴 해 출생 각성자들에게 감시를 붙였다는 말이 돈다.'); },
        say: [{ who: 'seoyun', text: '알겠어요. 그럼 저는 그냥 지켜볼게요. 그게 제 일이니까요.' }, { narr: '그날 이후 숙소 앞에 같은 회색 승용차가 자주 선다.' }] },
      { text: '"관리국은 대붕괴 때 뭘 했죠? 마도현 국장은?" (역으로 캐묻는다)', set: { seoyun: 'shaken' }, run: (g, M) => { const n = g.mainNpc('seoyun', { name: '한서윤', gender: 'F', rankIdx: 3, stage: 1, guild: 'kama', personality: 'just', region: g.player.region }); g.changeRel(n, 3, '날카롭게 물었다'); M.flags.wave0 = true; },
        say: [
          { narr: '서윤의 손가락이 서류철 모서리에서 멈춘다.' },
          { who: 'seoyun', text: '…그건 제 권한 밖이에요. 하지만 하나는 말할 수 있어요. 영점 세대 명단을 처음 만든 건 대붕괴 사흘 전이에요. 일어나기 전이요.' },
          { who: 'seoyun', text: '오늘 한 얘기, 저도 위에 보고해야 해요. 이건 미리 사과할게요.' },
        ] },
    ] },
    { id: 'c9_after', lines: [
      { who: 'rival', when: F2_HAS_RIVAL, text: (g, M) => RIVAL_LINE(g, M, {
        kama: '관리국 들어와서 처음 들은 이름이 한서윤이야. 특수조사관. 영점 세대 담당. 너한테도 왔지? …조심해, 위에서 제일 신뢰하는 사람이래.',
        cult: '균열교 안에서도 한서윤 이름은 알아. "개 목줄 찬 영점"이라고 부르더라. 그 사람도 영점 세대야.',
        solo: '관리국 조사관이 너 찾아왔다며. 나한테도 왔어. 우리 둘 다 같은 명단에 있다는 거지.',
        alone: '…관리국이 너한테 붙었다며. 나는 징계 먹고 나서 그 명단에서 빠졌어. 웃기지.',
        none: '관리국이 영점 세대를 찾아다닌대. 너도 조심해.',
      }) },
      { narr: '카페를 나서는데 서윤이 마지막으로 말한다. "균열교가 다음 보름에 또 뭔가 한대요. 이번엔 한 군데가 아니라고."', when: SEOYUN_ON },
    ], next: 'end' },
  ],
  done: (g, M) => { if (M.flags.seoyun === 'watch') M.flags.kamaWatch = M.flags.kamaWatch === 'hostile' ? 'hostile' : 'watched'; },
  expire: { months: 6, run: (g, M) => {
    M.flags.seoyun = 'watch'; g.mainNpc('seoyun', { name: '한서윤', gender: 'F', rankIdx: 3, stage: 1, guild: 'kama', personality: 'just', region: g.player.region });
    g.rumor('관리국 특수조사관이 대붕괴 해 출생 각성자들을 조용히 면담하고 있다는 말이 돈다.');
    return '관리국에서 몇 번 연락이 왔지만 받지 않았다. 숙소 앞에 회색 승용차가 선다.';
  } },
});

// ---------- 10장 친구의 선택 ----------
MAIN.ch(10, {
  part: 2, title: '친구의 선택', rank: 2, after: 1, where: (g) => { const f = g.mainWho('friend'); return f && f.region ? f.region : 'city'; },
  goal: (g) => `${F2_TARGET(g)}을(를) 만나러 간다`,
  scenes: [
    leadScene('c10_lead', 'c10'),
    { id: 'c10_call', lines: [
      { narr: (g, M) => (M.flags.seoyun === 'ally' ? '서윤에게서 문자가 온다. "균열교 신규 신도 명단에 아는 이름이 있어서요. 지우셔도 돼요, 이 문자." 첨부된 이름. ' + (F2_AWAKE(g) ? '{friend}의 동생, 지우.' : '{friend}.') : M.flags.seoyun === 'shaken' ? '서윤에게서 짧은 문자. "명단 확인하세요. 당신 쪽 사람." 그뿐이다.' : '{friend}에게 일주일째 연락이 안 된다. 메시지 옆의 숫자 1이 사라지지 않는다.') },
      { who: 'friend', when: (g) => F2_AWAKE(g), text: '…지우가 이상해. 요즘 밤마다 나가. 흰 옷 입고. 나보고는 "언니(형)는 이미 빛을 받았으니 모른다"고 하더라.' },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g), text: (g, M) => (M.flags.friendNear ? '…응. 나 요즘 회사 언니 따라서 모임 나가. 폐역 그날 이후로. 무서운데, 거기 사람들은 다 내 편이야.' : '아 미안, 요즘 바빴어. 모임 같은 거 나가거든. …균열교. 응. 그 균열교. 화내지 마.') },
      leadEcho('c10'),
    ] },
    { id: 'c10_home', lines: [
      { narr: '{friend}의 원룸. 현관에 흰 로브가 개켜져 있다. 책상 위에 갈라진 원이 찍힌 소책자 몇 권.' },
      { narr: '벽에 사진이 붙어 있다. 어릴 적 놀이터. 당신과 {friend}이(가) 미끄럼틀 위에서 웃고 있다.' },
      { who: 'friend', text: (g, M) => (F2_AWAKE(g) ? '지우 방도 똑같아. 소책자, 로브, 그리고 이상한 공책. 보름마다 날짜에 동그라미 쳐져 있어.' : M.flags.c1_call === 'promise' ? '너 대피소 일 따져 주겠다고 했잖아. 기사 한 번 나고 끝났어. 근데 거기 사람들은 매주 와. 밥 주고, 얘기 들어 주고. 그게 다야. 그게 다인데.' : '너는 몰라. 경보 울리면 너는 뛰어가는 쪽이고 나는 숨는 쪽이야. 거기 가면 처음으로 숨는 쪽끼리 모여 있어.') },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g) && M.flags.c4 === 'join', text: '그리고… 폐역 앞줄에 너 있었다며. 다들 네 얘기 해. 빛을 받고도 우리 편에 선 사람이라고.' },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g) && M.flags.c4 === 'stop', text: '폐역 깬 사람이 너라며. 모임 사람들이 너를 "배교자"라고 불러. …나는 아니라고 했어. 아니라고.' },
    ], pause: { days: 3, label: '모임 날', text: '사흘 뒤, 모임이 있는 밤. 그날 다시 보기로 했다.' } },
    { id: 'c10_jiwoo', skip: (g) => !F2_AWAKE(g), lines: [
      { narr: '지우의 방. 문틈으로 향 냄새. 책상 위 공책에 같은 문장이 수십 번 적혀 있다. "빛을 받지 못한 자도 문 앞에서는 같다."' },
      { narr: '지우가 들어온다. 열아홉. 교복 위에 흰 로브. 당신을 보고 놀라지 않는다.' },
      { who: { name: '지우', sub: '{friend}의 동생' }, text: '언니(형)가 불렀어요? …괜찮아요. 저 이상한 거 아니에요. 그냥 저도 숨는 쪽 말고 서는 쪽이 되고 싶은 거예요.' },
      { who: { name: '지우', sub: '{friend}의 동생' }, text: (g, M) => (M.flags.c4 === 'stop' ? '폐역 깬 사람이죠? 모임에서 당신 얘기 많이 해요. 무서운 사람이라고. 근데 언니(형) 친구라서 안 무서워요.' : '당신도 꿈 꾸죠? 바다 꿈. 모임 사람들이 그러는데, 꿈 꾸는 사람은 문이 고른 사람이래요.') },
    ] },
    { id: 'c10_meet', lines: [
      { narr: '모임 장소는 폐업한 학원 건물 4층. 계단에 촛불. 강북의 그 냄새.' },
      { narr: (g, M) => (M.flags.yeonhee === 'missing' ? '입구 신도의 손등에 화상 자국. 연희인가 싶어 다시 보니 아니다. 연희는 여전히 행방불명이다.' : M.flags.yeonhee === 'hurt' ? '입구에 팔에 붕대를 감은 연희가 서 있다. 당신을 보고 놀라다가, 작게 고개를 젓는다. 들어가지 말라는 건지, 데려가라는 건지.' : '입구에 연희가 서 있다. 이번엔 앞치마가 아니라 흰 로브다. 당신을 보고 눈을 내리깐다.') },
      { narr: (g) => `${F2_TARGET(g)}이(가) 계단 위에서 당신을 내려다본다.` },
    ], choices: [
      { text: '설득한다 — 놀이터 사진 얘기부터', set: { c10: 'talk' }, run: (g, M) => {
        const f = g.mainWho('friend'); const rel = f ? f.relation || 0 : 0;
        const ok = rel + (M.flags.c1_call === 'promise' ? 15 : M.flags.c1_call === 'doubt' ? 8 : 0) - (M.flags.friendNear ? 10 : 0) + (M.flags.c4 === 'save' ? 5 : 0) >= 25 || RNG.chance(0.35);
        M.flags.friend2 = ok ? 'safe' : 'drift'; if (f) g.changeRel(f, ok ? 6 : -2, ok ? '설득에 마음을 돌렸다' : '설득이 닿지 않았다');
      }, next: 'c10_out' },
      { text: '함께 들어간다 — 안에서 지켜보겠다고', set: { c10: 'with', friend2: 'with' }, run: (g, M) => { const f = g.mainWho('friend'); if (f) g.changeRel(f, 4, '모임에 같이 들어가 주었다'); if (M.flags.c4 === 'join') g.lifeEvent('균열교 모임에 다시 발을 들였다.'); }, next: 'c10_out' },
      { text: '팔을 잡고 끌어낸다', set: { c10: 'force', friend2: 'forced' }, run: (g, M) => { const f = g.mainWho('friend'); if (f) g.changeRel(f, -10, '모임에서 억지로 끌려 나왔다'); g.rumor('균열교 모임에서 헌터가 신도를 끌어냈다는 영상이 돈다.'); }, next: 'c10_out' },
    ] },
    { id: 'c10_out', lines: [
      { narr: (g, M) => ({
        safe: `${F2_TARGET(g)}이(가) 계단을 내려온다. 한 칸씩. 로브를 벗어 난간에 걸쳐 둔다. "…사진, 아직 있어? 미끄럼틀."`,
        drift: `${F2_TARGET(g)}이(가) 고개를 젓는다. "너는 이미 받았잖아. 나는 아직이야." 문이 닫힌다. 안에서 노래가 시작된다.`,
        with: '모임 안. 둘이 나란히 바닥에 앉는다. 사제가 다음 보름의 장소를 말한다. 한 군데가 아니다. 다섯 군데. 그중 하나에 당신들의 동네 이름이 있다.',
        forced: `${F2_TARGET(g)}을(를) 계단 아래까지 끌고 내려온다. 손목에 당신 손자국이 남는다. "…놔. 놓으라고." 처음 듣는 목소리다.`,
      })[M.flags.friend2] || '' },
      { who: 'leader', when: (g, M) => !!M.flags.c10_lead_with, text: (g, M) => (M.flags.friend2 === 'forced' ? '…잘한 건지 모르겠다. 근데 나도 그랬을 거다.' : '사람 마음은 칼로 못 끊는다. 오늘은 여기까지 한 거다.') },
      { who: KID2, when: (g, M) => M.flags.doyun && M.flags.doyun !== 'distant', text: (g, M) => (M.flags.doyun === 'leaflet' || M.flags.doyun === 'warned' ? '{hyung}! 여기도 와? 나 다음 보름엔 진짜 앞줄 설 거야. 엄마가 허락했어.' : '{hyung}, 여기서 뭐 해? 나 엄마 따라 왔어. …{hyung} 친구야, 저 사람?') },
    ], next: 'end' },
  ],
  done: (g, M) => { g.lifeEvent(({ safe: `${g.mainFill(F2_TARGET(g))}을(를) 균열교에서 데리고 나왔다.`, drift: `${g.mainFill(F2_TARGET(g))}은(는) 균열교에 남았다.`, with: `${g.mainFill(F2_TARGET(g))}와(과) 함께 균열교 모임에 들어갔다.`, forced: `${g.mainFill(F2_TARGET(g))}을(를) 균열교에서 억지로 끌어냈다.` })[M.flags.friend2] || '친구를 만났다.'); },
  expire: { months: 5, run: (g, M) => {
    M.flags.friend2 = 'deep'; const f = g.mainWho('friend'); if (f) g.changeRel(f, -6, '연락이 끊긴 사이 균열교에 깊이 들어갔다');
    g.rumor(`균열교 다섯 곳 동시 의식 준비 명단에 ${g.mainFill(F2_TARGET(g))}의 이름이 올랐다는 말이 돈다.`);
    return `${g.mainFill(F2_TARGET(g))}에게서 마지막 문자가 왔다. "보름에 봐."`;
  } },
});

// ---------- 11장 대전 기록 보관소 ----------
const MINJAE = { name: '오민재', sub: '청룡 연구소 연구원' };
MAIN.ch(11, {
  part: 2, title: '대전 기록 보관소', rank: 2, after: 1, when: (g) => g.player.rankIdx >= 3 || g.player.stage >= 1, where: 'daejeon',
  goal: '대전 청룡 연구소 지하 기록 보관소',
  scenes: [
    { id: 'c11_train', lines: [
      { narr: '대전행 고속 이동망. 창밖으로 연구 도시의 흰 돔들이 지나간다.' },
      { narr: '옆자리에 서윤이 앉아 있다. 노트북을 무릎에 놓고 아무것도 치지 않는다.', when: (g, M) => M.flags.seoyun === 'ally' },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun === 'ally', text: '청룡 지하 보관소는 관리국도 함부로 못 들어가요. 연구소 쪽 사람이 열어 줘야 해요. 아는 사람 있어요?' },
      { narr: '맞은편 칸에서 회색 정장 둘이 신문을 읽는 척한다. 감시다.', when: (g, M) => M.flags.seoyun === 'watch' },
      { who: 'rival', when: (g, M) => F2_HAS_RIVAL(g) && M.flags.rivalPath === 'kama', text: '관리국 임시 출입증이야. 빌려주는 거다. 기록에 내 이름 남으면 나 끝이니까, 들킬 거면 혼자 들켜.' },
    ] },
    { id: 'c11_lab', lines: [
      { narr: '청룡 연구소. 로비 바닥에 거대한 코어 단면이 박혀 있다. 녹색 빛이 천천히 맥박친다.' },
      { narr: '안경 낀 연구원이 당신을 알아본다. 오민재. 협회 공용 실험에서 몇 번 본 얼굴이다.' },
      { who: MINJAE, text: '지하요? …거기 왜요. 아니, 묻지 않을게요. 대붕괴 기록 보러 오는 사람들, 다 같은 얼굴이에요. 잠 못 잔 얼굴.' },
      { who: MINJAE, text: '저도 영점 세대예요. 꿈 꿔요. 그래서 열어 드리는 거예요. 한 시간. 그 이상은 경보가 울려요.' },
    ] },
    { id: 'c11_vault', lines: [
      { narr: '지하 3층. 서가 대신 금속 서랍이 끝없이 이어진다. 형광등 절반이 나가 있다.' },
      { narr: '서랍 하나. 「제주 해양 에테르 관측 사업 — 공명 실험」. 날짜는 대붕괴 사흘 전.' },
      { sys: '「목적: 해저 에테르 신호의 발신원과 교신 시도. 결과: 1차 교신 성공(추정). 2차 교신 중 신호 증폭, 관측선 연락 두절. 이후 기록 없음.」' },
      { narr: '실험 책임자 명단. 맨 위 이름에 손가락이 멈춘다.' },
      { sys: '「실험 책임: 수석 연구원 진서해 / 공동 책임: 관리국 기획실장 마도현」' },
      { narr: (g, M) => (M.flags.badge7 ? '명단 아래 붙은 단체 사진. 무명의 편지에 들어 있던 그 사진이다. 여기서는 얼굴이 긁혀 있지 않다. 맨 앞 줄 가운데, 키가 크고 마른 남자.' : '명단 아래 단체 사진. 흰 가운. 맨 앞 줄 가운데, 키가 크고 마른 남자. 걸음에 군더더기가 없을 것 같은 사람.') },
      { narr: '어디선가 본 걸음걸이다. 강북 예식장 단상. 흰 가면.' },
    ], choices: [
      { text: '몰래 복사한다', set: { jinSeohaeKnown: 'copy' }, next: 'c11_out', gain: { merit: -5 }, run: (g) => g.lifeEvent('청룡 연구소 지하에서 공명 실험 기록을 몰래 복사했다.'),
        say: [{ narr: '휴대폰 셔터 소리가 지하에 울린다. 열두 장. 열세 장째에서 위층 경보등이 노랗게 바뀐다.' }, { who: MINJAE, text: '지금 나와요! 지금!' }] },
      { text: '민재를 통해 정식 열람 허가를 받는다', set: { jinSeohaeKnown: 'official' }, next: 'c11_wait',
        say: [{ who: MINJAE, text: '신청서는 제가 올릴게요. 열흘. 대신 열람 대장에 이름이 남아요. 관리국으로 사본도 가고요.' }] },
      { text: '서윤에게 통째로 넘긴다', when: SEOYUN_ON, set: { jinSeohaeKnown: 'seoyun' }, run: (g, M) => { const n = g.mainWho('seoyun'); if (n && n.id != null) g.changeRel(n, 8, '공명 실험 기록을 넘겨주었다'); M.flags.seoyunHasFile = true; },
        next: 'c11_out', say: [{ who: 'seoyun', text: '…공동 책임, 마도현. 국장님이요.' }, { narr: '서윤의 목소리가 처음으로 흔들린다. 서류를 쥔 손가락이 하얗다.' }, { who: 'seoyun', text: '이건 제가 위로 올리지 않을게요. 아직은.' }] },
    ] },
    { id: 'c11_wait', lines: [
      { narr: '열람 신청서에 이름을 적는다. 대붕괴 기록 열람 사유: 개인 연구. 민재가 도장을 받아 오겠다고 한다.' },
    ], pause: { days: 10, label: '열람 허가', text: '열흘 뒤 청룡 연구소에서 열람 허가가 난다.' } },
    { id: 'c11_permit', lines: [
      { narr: '열흘 뒤. 같은 지하 3층. 이번엔 형광등이 다 켜져 있고, 옆에 연구소 직원이 서 있다.' },
      { narr: '기록은 그대로다. 사진도 그대로다. 열람 대장 맨 아래에 당신 이름. 그 옆에 「관리국 사본 송부」 도장.' },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun === 'watch', text: '열람 대장 사본이 제 책상에 왔어요. …무엇을 보셨는지는 묻지 않을게요. 아직은.' },
    ], next: 'c11_out' },
    { id: 'c11_out', lines: [
      { narr: '연구소 밖. 해가 지고 있다. 흰 돔들이 녹색으로 물든다.' },
      { who: 'rival', when: (g, M) => F2_HAS_RIVAL(g) && M.flags.rivalPath && M.flags.rivalPath !== 'kama', text: (g, M) => RIVAL_LINE(g, M, {
        cult: '진서해? …균열교 사제들이 가끔 그 이름을 써. "선생님"이라고. 교주를 그렇게 부르는 사람들이 있어.',
        solo: '진서해랑 마도현. 같은 실험. 한 사람은 가면을 썼고 한 사람은 국장이 됐네. 재밌지?',
        alone: '…나도 그 이름 봤어. 징계받기 전에. 그래서 징계받은 거고.',
      }) },
      { narr: '주머니 속 휴대폰이 진동한다. 발신자 표시 없음. "보셨군요. — 무"', when: (g, M) => M.flags.c4 === 'join' || M.flags.mumyeong === 'met' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    if (M.flags.jinSeohaeKnown === 'official') { M.flags.kamaWatch = M.flags.kamaWatch === 'hostile' ? 'hostile' : 'watched'; g.lifeEvent('청룡 연구소에 공명 실험 기록 정식 열람을 신청해 허가를 받았다.'); g.gain({ merit: 5 }); }
    if (M.flags.rivalPath === 'kama' && g.mainWho('rival')) { M.flags.c11_pass = true; g.mainRel({ rival: 2 }, '관리국 출입증을 빌려주었다'); }
    if (g.flags.chains) g.flags.chains.voice = Math.max(g.flags.chains.voice || 0, 2);
    M.flags.jinName = true;
    g.rumor('대전 청룡 연구소 지하 보관소에 외부인이 다녀갔다는 말이 연구원들 사이에 돈다.');
  },
  expire: { months: 8, run: (g, M) => {
    Object.assign(M.flags, { jinSeohaeKnown: 'none', archive: 'burned' });
    g.rumor('대전 청룡 연구소 지하 보관소에서 작은 화재. 대붕괴 이전 기록 일부가 소실됐다.');
    return '청룡 연구소 지하 보관소에 불이 났다는 뉴스. 원인 불명.';
  } },
});

// ---------- 12장 다섯 개의 보름 (재앙 '강북 지하철 둥지'를 읽기만 한다. 재앙 규칙은 건드리지 않음) ----------
const NEST = (g) => { const s = g.world && g.world.calamity; if (!s) return 'none'; if (s.active && s.active.id === 'nest') return 'active'; return (s.done && s.done.nest) || 'none'; };
const PRIEST = { name: '흰 가면 사제', sub: '균열교' };
MAIN.ch(12, {
  part: 2, title: '다섯 개의 보름', rank: 2, after: 1, where: 'gangbuk', cal: 'nest',
  goal: '보름 밤, 강북 폐구',
  scenes: [
    leadScene('c12_lead', 'c12'),
    { id: 'c12_list', lines: [
      { narr: (g, M) => (M.flags.friend2 === 'with' ? '모임에서 들은 다섯 군데. 강북 폐역, 대전 외곽 정수장, 부산 폐부두, 대구 분지 가장자리, 그리고 {friend}의 동네 재개발 구역. 날짜는 같다. 다음 보름.' : M.flags.seoyun === 'ally' ? '서윤이 지도 한 장을 보낸다. 빨간 점 다섯 개. "다음 보름. 동시에. 관리국은 강북만 막을 거예요. 인력이 그것밖에 없대요."' : '헌터넷에 글이 올라왔다가 지워진다. "보름에 다섯 곳." 캡처본만 돈다. 그중 하나가 강북이다.') },
      { narr: (g) => ({
        active: '강북엔 지금 재앙 경보가 걸려 있다. 지하철 둥지. 선로 아래 울음이 밤새 그치지 않는다. 균열교는 하필 그 위에서 보름을 맞겠다고 한다.',
        player: '강북 지하철 둥지는 당신 손으로 닫았다. 무너진 선로 위에 균열교가 다시 촛불을 켰다. 빈자리를 노리는 것이다.',
        npc: '강북 둥지는 다른 헌터들이 닫았다. 잔해 속 알 껍데기를 균열교가 주워 갔다는 말이 있다.',
        fail: '강북 지하는 둥지가 터지며 통째로 무너졌다. 균열교는 그 구덩이를 "열린 땅"이라 부른다.',
        none: '강북 폐구 선로 아래에서 무언가가 자라는 소리가 들린다는 신고가 늘었다. 아직 경보는 없다.',
      })[NEST(g)] },
      { who: 'seoyun', when: (g, M) => M.flags.wave0, text: '그 명단, 대붕괴 사흘 전에 만들었다고 했죠. 이번 작전 지시서도 그래요. 막으라는 말이 없어요. "관측하라"예요.' },
      leadEcho('c12'),
    ], pause: { days: 3, label: '보름 밤', text: '사흘 뒤 보름 밤, 강북 폐구로 간다.' } },
    { id: 'c12_tunnel', lines: [
      { narr: '보름 하루 전. 강북 폐구 지하철 입구 하나를 미리 내려가 본다. 계단 손잡이에 흰 끈이 묶여 있다. 길 표시다.' },
      { narr: (g) => ({ active: '선로 아래에서 거대한 것이 숨 쉰다. 둥지. 벽이 맥박처럼 부풀었다 가라앉는다. 그 박자에 맞춰 누군가 촛불을 세워 두었다.', player: '닫아 둔 둥지 자리. 무너진 알 껍데기 사이에 촛불이 줄지어 서 있다. 빈 둥지를 제단으로 쓰고 있다.', npc: '다른 헌터들이 닫은 둥지 자리. 껍데기를 주워 간 흔적. 그 자리에 갈라진 원이 분필로 그려져 있다.', fail: '무너진 지하. 구덩이 가장자리에 사람들이 둘러앉아 있다. "열린 땅." 누가 속삭인다.', none: '선로 끝, 아직 아무것도 없는 어둠. 그런데 벽에서 무언가가 자라는 소리가 들린다.', watch: '선로 끝, 아직 아무것도 없는 어둠. 그런데 벽에서 무언가가 자라는 소리가 들린다.' })[NEST(g)] || '' },
      { narr: (g, M) => (M.flags.c4 === 'join' ? '앞줄에 섰던 그날과 같은 냄새. 주머니 속 쇠 배지가 떨린다.' : M.flags.c4 === 'stop' ? '반쪽 문을 닫았던 그 역이 바로 옆 노선이다. 벽에 당신 얼굴이 그려진 종이가 붙어 있다. "배교자."' : '처음 오는 곳인데 낯익다. 꿈속 바다 냄새.') },
    ] },
    { id: 'c12_night', lines: [
      { narr: '보름. 강북 폐구. 달이 지나치게 크다. 무너진 역사 입구마다 촛불이 줄지어 땅속으로 내려간다.' },
      { narr: (g, M) => (M.flags.kwon === 'dead' ? '입구 벽에 권만석의 사진이 붙어 있다. 국화 몇 송이. 그 아래 누군가 적었다. "먼저 넘어간 형제."' : M.flags.kwon === 'alive' ? '입구에 권만석이 서 있다. 지팡이를 짚었다. 당신을 보더니 고개를 숙인다. "이번엔 나는 안 들어가요. 하은이가 울어서."' : '입구에 낯선 사제가 서서 들어오는 사람마다 이마에 재를 바른다.') },
      { narr: (g, M) => (M.flags.yeonhee === 'hurt' || M.flags.yeonhee === 'safe' ? '천막 그늘에 연희가 컵라면을 쌓아 두고 있다. 신도용이 아니다. 다친 사람 먹이려고. 당신과 눈이 마주치자 턱으로 선로 쪽을 가리킨다.' : '식당 자리엔 아무도 없다. 탄 간판만 남았다.') },
      { who: PRIEST, text: '반쪽 문이 다섯 개 열리면 하나가 된다. 오늘 밤, 바다가 우리 이름을 부른다.' },
      { narr: '발밑에서 선로가 울린다. 소리가 노래와 박자를 맞춘다.' },
    ], choices: [
      { text: '선로로 내려가 의식을 끊는다', set: { c12: 'cut' }, next: 'c12_after',
        fight: (g) => ({ title: '선로 아래의 것', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, elem: 'wood', boss: true, name: g.mainCalBoss('nest', '둥지에서 깬 것') },
          win: { text: '노래가 끊긴다. 선로 위 촛불이 한꺼번에 꺼진다.', gain: { fame: 8, rep: 6 } }, lose: { text: '무릎이 꺾인다. 노래는 끝까지 이어진다.', gain: { injure: 1 } } }) },
      { text: '관리국 작전에 합류한다', when: (g, M) => SEOYUN_ON(g, M) || M.flags.kamaWatch === 'signed', set: { c12: 'kama' }, gain: { merit: 6 }, next: 'c12_after',
        say: [{ who: 'seoyun', text: '들어가지 마세요. 우리는 입구만 봉쇄해요. …명령이에요. 제 명령 아니고.' }, { narr: '장갑차 조명 아래, 촛불 줄이 땅속으로 계속 내려간다. 아무도 막지 않는다. 카메라만 돌아간다.' }] },
      { text: (g) => `${F2_TARGET(g)}이(가) 있는 의식장으로 간다`, set: { c12: 'friend' }, next: 'c12_after', run: (g) => { const f = g.mainWho('friend'); if (f) g.changeRel(f, 3, '보름 밤에 찾아와 주었다'); },
        say: [{ narr: '강북을 등진다. 등 뒤에서 노래가 커진다. 택시 기사가 백미러로 당신을 본다. "거기도 오늘 뭐 한다던데요."' }] },
    ] },
    { id: 'c12_after', lines: [
      { narr: (g, M) => ({
        cut: M.flags.fight_c12_night === 'lose' ? '눈을 뜨니 새벽이다. 선로 위에 흰 로브들이 쓰러져 잔다. 다들 살아 있다. 다들 같은 꿈을 꿨다고 한다.' : '선로 바닥에 둥근 자국. 반쪽 원이 하나 덜 그려진 채 끝나 있다. 다섯 개 중 하나는 열리지 않았다.',
        kama: '새벽. 관리국 차량이 철수한다. 서류 상으론 "강북 집회 해산, 사상자 없음". 선로 아래에서 사람이 몇 올라오지 않았다.',
        friend: `재개발 구역. 의식은 이미 끝나 있다. ${F2_TARGET(g)}은(는) 없다. 바닥에 분필 원과 흰 끈 한 가닥.`,
      })[M.flags.c12] || '' },
      { who: 'rival', when: F2_HAS_RIVAL, text: (g, M) => RIVAL_LINE(g, M, {
        kama: '관리국 작전 보고서 봤어. 다섯 곳 다 "관측 성공". 성공이래. 뭐가 성공인데.',
        cult: '…나 강북 안에 있었어. 노래 부르다 네가 내려오는 거 봤어. 아니, 못 본 척했어.',
        solo: '대구 쪽 갔다. 혼자서 하나는 끊었어. 너는 몇 개 끊었냐.',
        alone: '뉴스 봤어. 다섯 곳. 나는 집에 있었어. 무서워서.',
        none: '보름 지났다. 다들 살아 있냐.',
      }) },
      { who: KID2, when: (g, M) => M.flags.doyun === 'leaflet' && M.flags.c12 !== 'cut', text: '{hyung}… 나 앞줄 섰어. 바다 봤어. 엄청 넓어. 근데 엄마가 안 일어나.' },
    ] },
    { id: 'c12_dawn', lines: [
      { narr: '아침 뉴스가 다섯 곳 지명을 차례로 읽는다. 강북, 대전 외곽, 부산 폐부두, 대구 분지, 그리고 {friend}의 동네.' },
      { narr: (g, M) => (M.flags.c12 === 'cut' && M.flags.fight_c12_night === 'win' ? '다섯 곳 중 강북만 "의식 중단"으로 나온다. 나머지 넷은 "해산 완료". 그 넷에서 사람이 몇 돌아오지 않았는지는 나오지 않는다.' : '다섯 곳 모두 "해산 완료". 화면 아래 자막이 너무 빨리 지나간다.') },
      { narr: '{friend}에게 문자를 보낸다. 읽음 표시가 뜨지 않는다.', when: (g, M) => M.flags.friend2 === 'drift' || M.flags.friend2 === 'deep' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const cut = M.flags.c12 === 'cut' && M.flags.fight_c12_night === 'win';
    M.flags.rituals = cut ? 4 : 5;
    if (cut) g.mainCalClear('nest');
    if (M.flags.doyun === 'leaflet' && M.flags.c12 !== 'cut') { M.flags.doyun = 'front'; g.lifeEvent('도윤이 보름 의식 앞줄에 섰다. 도윤의 엄마가 깨어나지 않았다.'); }
    g.rumor(cut ? '강북 보름 의식이 중간에 끊겼다. 다섯 곳 중 한 곳만 문이 덜 열렸다는 말이 돈다.' : '보름 밤 다섯 곳에서 동시에 의식이 치러졌다. 관리국은 "사상자 없음"이라고 발표했다.');
    g.lifeEvent(({ cut: '보름 밤, 강북 선로에서 균열교 의식을 끊었다.', kama: '보름 밤, 관리국 봉쇄선 뒤에서 의식을 지켜봤다.', friend: '보름 밤, 강북 대신 친구를 찾아갔다.' })[M.flags.c12] || '보름 밤을 보냈다.');
  },
  expire: { months: 4, run: (g, M) => {
    Object.assign(M.flags, { c12: 'missed', rituals: 5 });
    if (M.flags.doyun === 'leaflet') M.flags.doyun = 'front';
    g.rumor('보름 밤 다섯 곳에서 동시에 균열교 의식. 강북 선로 아래에서 돌아오지 않은 신도가 있다.');
    return '보름 밤이 지났다. 아침 뉴스에 다섯 곳의 지명이 차례로 나온다.';
  } },
});

// ---------- 13장 늦은 전화 ----------
// 늦음(late)이면 결과는 하나로 고정: 친구(또는 지우)는 의식으로 억지 각성한 채 흰 가면들에게 데려가진다.
const LATE13 = (g, M) => M.flags.c12 === 'missed' || M.flags.friend2 === 'deep';
MAIN.ch(13, {
  part: 2, title: '늦은 전화', rank: 2, after: 0, where: (g) => { const f = g.mainWho('friend'); return f && f.region ? f.region : 'city'; },
  goal: (g) => `${F2_TARGET(g)}에게 간다`,
  scenes: [
    leadScene('c13_lead', 'c13'),
    { id: 'c13_call', lines: [
      { narr: '새벽 세 시. 전화가 운다.' },
      { who: 'friend', text: (g, M) => ({
        safe: '…미안. 자는데. 지우(나)한테 자꾸 문자가 와. "그릇이 비었다"고. 집 앞에 흰 옷 입은 사람이 서 있어. 세 시간째.',
        drift: '나 지금 거기 있어. 지하. 다들 누워 있어. 나도 누워야 하는데… 무서워. 너 목소리 듣고 싶어서.',
        with: '너 그날 같이 들어와 줬잖아. 그래서 다들 날 앞줄에 세워. 오늘 밤이래. 나 "그릇"이래.',
        forced: '…너 때문에 나왔다가 다시 들어갔어. 화나서. 근데 지금 진짜 이상해. 다들 눈이 까매.',
        deep: '…(숨소리만 들린다. 멀리서 파도 소리.)',
      })[M.flags.friend2] || '…와 줘.' },
      { narr: (g, M) => (M.flags.c12 === 'friend' ? '보름 밤 그 재개발 구역이다. 길을 안다. 분필 원이 어디 있는지도.' : M.flags.c12 === 'missed' ? '주소를 받아 적는 손이 떨린다. 보름은 이미 지났다. 너무 늦었는지도 모른다.' : '주소를 받아 적는다. 차로 사십 분.') },
      leadEcho('c13'),
    ] },
    { id: 'c13_run', lines: [
      { narr: '계단을 세 칸씩 뛰어 내려간다. 신발 끈이 풀린 줄도 모른다.' },
      { narr: (g, M) => (LATE13(g, M) ? '도착하기 전에 안다. 공기가 짜다. 바다 냄새다. 여기는 바다가 없는데.' : '건물 지하에서 노래가 들린다. 아직 끝나지 않았다.') },
    ], choices: [
      { text: '문을 부수고 들어간다', when: (g, M) => !LATE13(g, M), set: { c13: 'run' }, next: 'c13_room',
        fight: (g) => ({ title: '흰 가면 호위', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 3, human: true, name: '흰 가면 호위' },
          win: { text: '마지막 호위가 쓰러진다. 안쪽 문이 열려 있다.', gain: { fame: 5 } }, lose: { text: '바닥에 쓰러진 채 안쪽에서 노래가 끝나는 걸 듣는다.', gain: { injure: 1 } } }) },
      { text: '서윤에게 전화하고 같이 들어간다', when: (g, M) => !LATE13(g, M) && M.flags.seoyun === 'ally', set: { c13: 'seoyun', friend3: 'saved', friendKama: true }, next: 'c13_room',
        say: [{ who: 'seoyun', text: '십 분. 아니, 칠 분. 혼자 들어가지 마요.' }, { narr: '칠 분 뒤 회색 승용차 두 대. 서윤이 먼저 내린다. 총을 뽑지 않는다. 대신 사이렌을 켠다. 노래가 멈춘다.' }] },
      { text: '들어간다', when: LATE13, set: { c13: 'late' }, next: 'c13_room' },
    ] },
    { id: 'c13_room', lines: [
      { narr: (g, M) => {
        if (!M.flags.friend3) M.flags.friend3 = LATE13(g, M) || M.flags.fight_c13_run === 'lose' ? 'late' : 'saved';
        return M.flags.friend3 === 'saved'
          ? `지하. 분필 원 한가운데 ${F2_TARGET(g)}이(가) 누워 있다. 숨을 쉰다. 눈을 뜨자 검은자위가 천천히 원래 색으로 돌아온다.`
          : `지하. 분필 원은 비어 있다. 원 바깥에 흰 끈과 신발 한 짝. ${F2_TARGET(g)}의 것이다.`;
      } },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'saved', text: (g) => (F2_AWAKE(g) ? '지우 괜찮아? …괜찮아? 고마워. 고마워. 진짜.' : '…목소리가 네 이름 불렀어. 바다에서. "그 애를 데려와"라고.') },
      { who: { name: '지우', sub: '{friend}의 동생' }, when: (g, M) => M.flags.friend3 === 'saved' && F2_AWAKE(g), text: '…바다가 저를 불렀는데, 언니(형)랑 당신 목소리가 더 컸어요. 그래서 돌아왔어요.' },
      { who: 'friend', when: (g, M) => M.flags.friend3 === 'late' && F2_AWAKE(g), text: '지우야. 지우야… 나 각성자인데. 나 각성자인데 아무것도 못 했어.' },
      { narr: '벽에 분필 글씨. "그릇은 차올랐다. 문 너머에서 기다린다."', when: (g, M) => M.flags.friend3 === 'late' },
      { narr: '휴대폰에 영상 하나가 도착한다. 흰 가면들 사이를 걸어가는 뒷모습. 맨발. 걸음이 이상하게 가볍다. 발밑에 물이 고인다.', when: (g, M) => M.flags.friend3 === 'late' },
    ] },
    { id: 'c13_after', lines: [
      { who: 'leader', when: (g, M) => F2_HAS_LEADER(g) && F2_IN_CREW(g), text: (g, M) => (M.flags.friend3 === 'saved' ? '살렸으면 됐다. 다음 일은 다음에 생각해.' : '…네 잘못 아니다. 그 말 백 번 해 줄 테니까 한 번만 들어.') },
      { who: 'seoyun', when: (g, M) => !!M.flags.friendKama, text: '보호 조치로 관리국 병원에 모실게요. …감시라고 생각하셔도 돼요. 둘 다니까.' },
      { narr: (g, M) => (M.flags.friend3 === 'late' && M.flags.c1_call === 'promise' ? '처음 각성하던 날 걸려 온 전화가 생각난다. "따져 줄게." 그렇게 말했었다.' : '해가 뜬다. 아무것도 끝나지 않았다.') },
    ] },
    { id: 'c13_alone', lines: [
      { who: { name: '지우', sub: '{friend}의 동생' }, when: (g, M) => F2_AWAKE(g) && M.flags.friend3 === 'saved', text: '…언니(형) 잠들었어요. 저 혼자 말할게요. 그 안에서 목소리가 그랬어요. "넌 아직 아니야. 돌아가." 누가 저를 돌려보낸 거예요.' },
      { who: 'seoyun', when: (g, M) => M.flags.seoyun && !M.flags.friendKama, text: (g, M) => (M.flags.seoyun === 'watch' ? '(문자) 오늘 새벽 일, 보고서엔 "민간 신고 출동"으로만 올렸어요. 지켜보는 사람도 가끔은 못 본 척해요.' : '(문자) 들었어요. …괜찮아요? 대답 안 해도 돼요. 그냥 물어본 거예요.') },
      { who: 'leader', when: (g, M) => F2_HAS_LEADER(g) && !F2_IN_CREW(g), text: (g, M) => g.mainReg(M.flags.friend3 === 'saved' ? { haera: '(전화) 새벽에 뭐 했냐. 목소리가 이상하다. …잘 했다. 뭘 했는지 몰라도.', haeyo: '(전화) 새벽에 뭐 하셨어요. 목소리가 이상해요. …잘하셨어요. 뭘 하셨는지 몰라도.', short: '(전화) 잘 했다.' } : { haera: '(전화) 목소리 들으니 알겠다. 늦었구나. 혼자 있지 마라. 지금 간다.', haeyo: '(전화) 목소리 들으니 알겠어요. 늦으셨구나. 혼자 있지 마요. 지금 갈게요.', short: '(전화) 지금 간다.' }, g.mainWho('leader')) },
      { narr: (g, M) => (M.flags.friend3 === 'saved' ? '이 새벽은 오래 남는다. 이 사람을 데려온 밤이다. 끝에 무엇을 고르든.' : '이 새벽은 오래 남는다. 이 사람을 놓친 밤이다. 끝에 무엇을 고르든.') },
      { sys: (g, M) => (M.flags.friend3 === 'saved' ? '친구가 살았다. 이 사람은 끝까지 이야기에 남는다.' : '친구를 놓쳤다. 되찾을 길은 아직 남아 있다.') },
    ], next: 'end' },
  ],
  done: (g, M) => {
    const f = g.mainWho('friend'); const who = g.mainFill(F2_TARGET(g));
    if (M.flags.friend3 === 'saved') { if (f) g.changeRel(f, 10, '의식에서 살려 주었다'); g.lifeEvent(`${who}을(를) 보름 의식에서 살려 냈다.`); }
    else { if (f) g.changeRel(f, F2_AWAKE(g) ? -4 : 0, '늦게 왔다'); g.lifeEvent(`${who}이(가) 흰 가면들에게 데려가졌다. 늦었다.`); g.rumor('억지로 각성한 신도들이 균열교 본진으로 옮겨졌다는 말이 돈다.'); }
  },
  expire: { months: 3, run: (g, M) => {
    Object.assign(M.flags, { friend3: 'late', c13: 'missed' });
    const f = g.mainWho('friend'); if (f) g.changeRel(f, -8, '전화를 받지 않았다');
    return `새벽 세 시에 온 부재중 전화 한 통. 그 뒤로 ${g.mainFill(F2_TARGET(g))}에게서 연락이 없다.`;
  } },
});

// ---------- 14장 가면 벗다 ----------
MAIN.ch(14, {
  part: 2, title: '가면 벗다', rank: 2, after: 1, where: 'any',
  goal: '모르는 번호의 전화',
  scenes: [
    { id: 'c14_ring', lines: [
      { narr: '밤. 숙소. 발신 번호 표시 없음. 세 번째 울림에서 안다. 누군지.' },
      { who: 'mumyeong', text: (g, M) => (M.flags.friend3 === 'late' ? `${g.mainFill(F2_TARGET(g))}은(는) 제 곁에 있습니다. 다치지 않았어요. 오히려 처음으로 편안해합니다.` : '친구분은 무사하더군요. 축하합니다. 진심이에요. 저도 한때 누군가를 그렇게 꺼내고 싶었거든요.') },
      { who: 'mumyeong', text: '이제 얼굴을 보여 드릴 때가 된 것 같아서요. 들으시겠어요?' },
    ], choices: [
      { text: '듣는다', set: { c14: 'listen' }, next: 'c14_listen' },
      { text: '끊는다', set: { c14: 'hangup' }, next: 'c14_news' },
    ] },
    { id: 'c14_listen', lines: [
      { who: 'mumyeong', text: (g, M) => ({
        copy: '청룡 지하에서 열세 장째에 멈추셨죠. 경보가 울려서. 열네 장째에 제 얼굴이 있었습니다.',
        official: '열람 대장에 이름을 남기셨더군요. 정직한 분이에요. 그 대장은 마도현 국장 책상으로 갔습니다.',
        seoyun: '그 기록을 한서윤 조사관에게 넘기셨죠. 좋은 사람이에요. 그래서 오래 못 버틸 겁니다.',
        none: '기록은 불탔습니다. 제가 태운 건 아니에요. 불을 낸 쪽이 누구인지 생각해 보세요.',
      })[M.flags.jinSeohaeKnown || 'none'] },
      { who: 'mumyeong', text: '진서해입니다. 청룡 연구소 수석 연구원이었죠. 대붕괴 사흘 전, 바다 밑 목소리와 처음 말을 나눈 사람이에요.' },
      { who: 'mumyeong', text: '1차 교신은 대화였습니다. 2차 교신을 증폭하라고 지시한 건 공동 책임자였어요. 관측선이 사라졌고, 그날 문이 열렸습니다.' },
      { narr: (g, M) => (M.flags.badge7 ? '주머니 속 쇠 배지를 쥔다. 7. 일곱 번째 형제. 이 사람이 붙인 번호다.' : M.flags.dreamDebt ? '방바닥에 또 에테르가 고인다. 목소리가 전화기 너머와 꿈속에서 동시에 들린다.' : '창밖 달이 반쯤 기울어 있다.') },
      { who: 'mumyeong', text: '문은 닫을 수 없습니다. 이미 반쪽씩 열렸어요. 남은 길은 하나예요. 모두 함께 넘어가는 것.' },
      { who: 'mumyeong', text: '당신은 영점 세대예요. 목소리가 이름을 부르는 사람. 언젠가 당신이 문 앞에 서게 됩니다. 그때 누구 편에 설지, 그때 정하세요.' },
      { narr: '전화가 끊긴다. 마지막 몇 초 동안 수화기 너머로 파도 소리가 들렸다.' },
    ], next: 'c14_street' },
    { id: 'c14_news', lines: [
      { narr: '통화 종료. 손바닥에 땀이 찬다.' },
      { art: 'jin-unmasked', narr: '사흘 뒤. 헌터넷 첫 화면에 영상 하나가 걸린다. 흰 가면을 벗는 남자. 마흔 후반. 마른 얼굴. 대전 지하 사진 속 바로 그 얼굴.' },
      { sys: '「균열교 교주, 전 청룡 연구소 수석 연구원 진서해로 확인」' },
      { who: 'mumyeong', text: '관리국은 대붕괴를 막지 못한 게 아닙니다. 열었습니다. 증거는 영점 세대가 갖고 있어요. 그중 한 명은 내 전화를 끊었고요.' },
      { narr: '영상 댓글 맨 위. 당신 이름이 적혀 있다. 누군가 찾아냈다.' },
      { who: 'seoyun', when: (g, M) => !!M.flags.seoyun, text: (g, M) => (M.flags.seoyunHasFile ? '…그 기록, 제가 갖고 있는 거 아무도 몰라요. 계속 그래야 해요. 당분간 연락 못 해요.' : '당신 이름이 돌기 시작했어요. 관리국이 먼저 움직일 거예요. 조심해요.') },
    ], next: 'c14_street' },
    { id: 'c14_street', lines: [
      { narr: '다음 날 아침. 편의점 앞. 사람들이 휴대폰을 들여다본다. 한 화면에 같은 얼굴. 마른 남자.' },
      { narr: (g, M) => (M.flags.c14 === 'hangup' ? '계산대 알바가 당신 얼굴을 두 번 본다. "혹시… 그 댓글…" 말을 끝내지 않는다. 거스름돈을 건네는 손이 조금 떨린다.' : '아무도 당신을 알아보지 않는다. 당신만 안다. 저 얼굴이 어젯밤 무슨 목소리로 말했는지.') },
      { narr: (g, M) => (M.flags.c4 === 'join' ? '전봇대에 새 전단. 갈라진 원 대신 그 얼굴이 인쇄돼 있다. "선생님이 얼굴을 보여 주셨다." 쇠 배지 7을 쥔 손에 땀이 찬다.' : '전봇대에 새 전단. 갈라진 원 대신 그 얼굴이 인쇄돼 있다. 누가 그 위에 매직으로 "살인자"라고 적었다. 그 옆에 다른 글씨로 "구원자".') },
      { who: 'friend', text: (g, M) => (M.flags.friend3 === 'late' ? '(부재중 음성) …선생님 얼굴 봤지. 나 지금 저 사람 옆에 있어. 괜찮아. 괜찮으니까 찾지 마.' : '(전화) 너 뉴스 봤어? 저 사람… 우리 동네에 전단 붙이던 그 사람들 교주래.') },
    ], next: 'c14_end' },
    { id: 'c14_end', lines: [
      { narr: '다음 날 아침 뉴스. 마도현 국장이 단상에 선다. 깔끔한 정장. 흔들림 없는 목소리.' },
      { sys: '「관리국은 테러 집단 지도자의 근거 없는 주장에 유감을 표합니다. 영점 세대 여러분의 안전을 최우선으로 보호하겠습니다.」' },
      { narr: (g, M) => (M.flags.seoyunHasFile || M.flags.jinSeohaeKnown === 'copy' ? '"공동 책임: 관리국 기획실장 마도현." 당신 휴대폰 사진첩에 그 줄이 있다. 화면 속 남자는 그걸 모른다. 아직은.' : '"보호." 그 단어가 유난히 또렷하게 들린다.') },
      { who: 'rival', when: F2_HAS_RIVAL, text: (g, M) => RIVAL_LINE(g, M, {
        kama: '국장님이 오늘 아침 회의에서 웃으셨어. 그게 제일 무서웠다.',
        cult: '진서해 선생님이 진짜로 가면을 벗었네. …나 이제 어느 쪽인지 모르겠다.',
        solo: '둘 중 하나는 거짓말이야. 아니면 둘 다.',
        alone: '…나 이 영상 열 번 봤다.',
        none: '봤냐. 세상이 시끄러워지겠다.',
      }) },
      { narr: '창밖에서 비가 온다. 빗소리가 조금 짜다.' },
    ], next: 'end' },
  ],
  done: (g, M) => {
    M.flags.jinFace = true;
    M.flags.tone3 = M.flags.c14 === 'listen' ? 'heard' : 'deaf';
    // 가면 벗기 = 균열교 연작 마무리(cult 4). voice는 여기서 올리지 않는다
    if (g.flags.chains) g.flags.chains.cult = Math.max(g.flags.chains.cult || 0, 4);
    M.part2 = { seoyun: M.flags.seoyun || 'none', friend: M.flags.friend3 || 'late', jin: M.flags.jinSeohaeKnown || 'none', ritual: M.flags.c12 || 'missed', tone: M.flags.tone3 };
    g.lifeEvent(M.flags.c14 === 'listen' ? '균열교 교주 진서해의 이야기를 끝까지 들었다.' : '균열교 교주 진서해의 전화를 끊었다. 사흘 뒤 그가 가면을 벗었다.');
    g.rumor('균열교 교주가 가면을 벗었다. 전 청룡 연구소 수석 연구원 진서해. 관리국을 대붕괴의 원인으로 지목했다.');
    if (M.flags.tone3 === 'deaf') g.rumor(`진서해 영상 댓글에 ${g.player.name}의 이름이 올랐다. 영점 세대라는 말과 함께.`);
  },
  expire: { months: 6, run: (g, M) => {
    Object.assign(M.flags, { c14: 'missed', jinFace: true, tone3: 'deaf' });
    M.part2 = { seoyun: M.flags.seoyun || 'none', friend: M.flags.friend3 || 'late', jin: M.flags.jinSeohaeKnown || 'none', ritual: M.flags.c12 || 'missed', tone: 'deaf' };
    g.rumor('균열교 교주가 가면을 벗었다. 전 청룡 연구소 수석 연구원 진서해.');
    return '균열교 교주가 가면을 벗었다는 뉴스. 진서해. 대전 지하 사진 속 그 얼굴이다.';
  } },
});
