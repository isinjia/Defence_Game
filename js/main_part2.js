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
const leadScene = (id, what) => ({
  id, skip: (g) => !F2_IN_CREW(g), lines: [
    { narr: `${what} 얘기를 꺼내자 {leader}이(가) 잠깐 말이 없다.` },
    { who: 'leader', text: (g, M) => ({ with: '…같이 간다. 네가 혼자 들어가면 내가 잠을 못 잔다.', stop: '팀 일정에 없는 일이다. 가지 마라. 이번엔 진짜다.', let: '말린다고 안 들을 거 안다. 연락만 끊지 마.' })[F2_STANCE(g, M)] },
  ], choices: [
    { text: '같이 가 달라고 한다', when: (g, M) => F2_STANCE(g, M) === 'with', set: { [`${id}_with`]: true }, rel: { leader: 2 }, relWhy: '위험한 일에 함께 갔다' },
    { text: '"그래도 갈게요."', when: (g, M) => F2_STANCE(g, M) === 'stop', set: { [`${id}_defied`]: true }, rel: { leader: -2 }, relWhy: '말렸는데 갔다' },
    { text: '"연락은 할게요."', when: (g, M) => F2_STANCE(g, M) === 'let' },
  ],
});

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
      { narr: '협회 지부 1층 카페. 창가 자리에 회색 정장의 여자가 앉아 있다. 서른 초반. 머리를 단단히 묶었다. 앞에 놓인 커피는 손도 안 댔다.' },
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
    leadScene('c10_lead', '친구 일'),
    { id: 'c10_call', lines: [
      { narr: (g, M) => (M.flags.seoyun === 'ally' ? '서윤에게서 문자가 온다. "균열교 신규 신도 명단에 아는 이름이 있어서요. 지우셔도 돼요, 이 문자." 첨부된 이름. ' + (F2_AWAKE(g) ? '{friend}의 동생, 지우.' : '{friend}.') : M.flags.seoyun === 'shaken' ? '서윤에게서 짧은 문자. "명단 확인하세요. 당신 쪽 사람." 그뿐이다.' : '{friend}에게 일주일째 연락이 안 된다. 메시지 옆의 숫자 1이 사라지지 않는다.') },
      { who: 'friend', when: (g) => F2_AWAKE(g), text: '…지우가 이상해. 요즘 밤마다 나가. 흰 옷 입고. 나보고는 "언니(형)는 이미 빛을 받았으니 모른다"고 하더라.' },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g), text: (g, M) => (M.flags.friendNear ? '…응. 나 요즘 회사 언니 따라서 모임 나가. 폐역 그날 이후로. 무서운데, 거기 사람들은 다 내 편이야.' : '아 미안, 요즘 바빴어. 모임 같은 거 나가거든. …균열교. 응. 그 균열교. 화내지 마.') },
    ] },
    { id: 'c10_home', lines: [
      { narr: '{friend}의 원룸. 현관에 흰 로브가 개켜져 있다. 책상 위에 갈라진 원이 찍힌 소책자 몇 권.' },
      { narr: '벽에 사진이 붙어 있다. 어릴 적 놀이터. 당신과 {friend}이(가) 미끄럼틀 위에서 웃고 있다.' },
      { who: 'friend', text: (g, M) => (F2_AWAKE(g) ? '지우 방도 똑같아. 소책자, 로브, 그리고 이상한 공책. 보름마다 날짜에 동그라미 쳐져 있어.' : M.flags.c1_call === 'promise' ? '너 대피소 일 따져 주겠다고 했잖아. 기사 한 번 나고 끝났어. 근데 거기 사람들은 매주 와. 밥 주고, 얘기 들어 주고. 그게 다야. 그게 다인데.' : '너는 몰라. 경보 울리면 너는 뛰어가는 쪽이고 나는 숨는 쪽이야. 거기 가면 처음으로 숨는 쪽끼리 모여 있어.') },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g) && M.flags.c4 === 'join', text: '그리고… 폐역 앞줄에 너 있었다며. 다들 네 얘기 해. 빛을 받고도 우리 편에 선 사람이라고.' },
      { who: 'friend', when: (g, M) => !F2_AWAKE(g) && M.flags.c4 === 'stop', text: '폐역 깬 사람이 너라며. 모임 사람들이 너를 "배교자"라고 불러. …나는 아니라고 했어. 아니라고.' },
    ], pause: { days: 3, label: '모임 날', text: '사흘 뒤, 모임이 있는 밤. 그날 다시 보기로 했다.' } },
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

