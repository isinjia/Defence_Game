// ===== 게이트 크로니클: 동료 성격 50종 + 상황·관계 대사 (영역 C) =====
// docs/구현_대기목록.md 4-12, docs/동료_대사_제안.md.
// 성격(n.persona) = 어떻게 말하고 반응하나. 각 성격은 기존 5종 기질(n.personality) 하나를 가진다 → 전투 AI·기존 판정은 그대로.
// 사연(n.arch, archetypes.js)과 겹쳐 "츤데레 생계형 가장" 같은 조합이 나온다.
// 대사 우선순위: 상황 → 유형(30%) → 직업 맛 → 성격. 같은 전투에서 같은 줄 반복 금지.
// 상황 키: start(전투 시작) boss low(내 체력 30% 아래) down({npc} 쓰러짐) weak resist kill win flee idle orderOk orderNo town

const PERSONAS = {
  tsundere: { name: '츤데레', base: 'cold', rel: 0.8, chat: 1, council: 0, insight: 0,
    boss: ['흥, 저 정도는 나 혼자서도 돼.', '따라오기나 해. 뒤처지지 말고.'], low: ['괘, 괜찮다니까! 신경 꺼!', '이 정도 상처쯤…!'],
    down: ['{npc}! …딱히 걱정하는 거 아니거든!', '바보 {npc}, 누가 쓰러지래!'], weak: ['당연하지. 내가 누군데.', '흥, 봤어?'], resist: ['…안 먹히잖아! 내 탓 아니야!', '칫, 다른 걸로.'],
    kill: ['딱히 널 위해서 잡은 거 아니야.', '흥, 이걸로 빚 하나.'], win: ['…수고했어. 아, 아무 뜻 없어!', '다친 데 없지? 물어본 거 아니야!'], flee: ['도, 도망치는 거 아니야. 작전상 후퇴야!'],
    idle: ['따, 딱히 너 때문에 막은 거 아니거든!', '내 뒤에 있어. …그냥 그러라고.', '흥.'], town: ['뭘 봐. …밥은 먹었어?', '우연히 지나가던 길이야.'] },
  braggart: { name: '허세꾼', base: 'warlike', rel: 1, chat: 1.3, council: 0.25, insight: -0.05,
    boss: ['이 정도는 눈 감고도 하지.', '보스? 몸풀기네.'], low: ['크흑… 일부러 맞아 준 거다!', '이건 계산된 피격이야…!'],
    down: ['{npc}, 내 활약 못 보고 눕냐!', '{npc}! 걱정 마, 내가 다 끝내 줄게!'], weak: ['봤지? 이게 내 클래스다!', '역시 나야.'], resist: ['어? …방금 건 연습이었어.', '오늘 컨디션이 좀…'],
    kill: ['박수 쳐도 돼.', '방송 각이다, 방송 각!'], win: ['내 덕인 거 다들 알지?', '오늘 MVP는 정해졌네.'], flee: ['오늘은 봐준다! 다음엔 없어!'],
    idle: ['이 정도는 눈 감고도 하지.', '나 S급 될 상이래.', '잘 봐 둬, 이게 정석이야.'], town: ['어제 길드에서 스카우트 왔잖아. 거절했지만.', '사인 필요하면 말해.'] },
  coward: { name: '겁쟁이', base: 'kind', rel: 1.2, chat: 1, council: -0.3, insight: 0.05,
    boss: ['저, 저기 진짜 들어가요…?', '살아서 나가는 거 맞죠…?'], low: ['으아아, 피, 피 나요!', '나 이제 집에 갈래요…'],
    down: ['{npc}님!! 아, 안 돼요!', '{npc}… 이제 제가 해야 해요…? 해, 할게요!'], weak: ['어, 어라? 됐다!', '마, 맞았어요!'], resist: ['히익, 안 들어가요!', '왜 멀쩡해요?!'],
    kill: ['제, 제가 잡은 거예요…?', '살았다아…'], win: ['끝, 끝났죠? 진짜죠?', '다들 무사해서 다행이에요…'], flee: ['빨리요, 빨리!', '살았다…'],
    idle: ['저, 저 뒤에 있을게요…', '무서운데… 그래도 갈게요.', '방금 무슨 소리 났죠?'], town: ['어제 악몽 꿨어요…', '오늘은 게이트 안 가죠?'] },
  smooth: { name: '능글맞음', base: 'greedy', rel: 1.2, chat: 1.2, council: 0.05, insight: 0,
    boss: ['에이, 형님 왜 그러세요~ 저 큰 놈은 같이 가야죠.', '덩치값 하나 볼까요~'], low: ['아이고, 이건 좀 아프네~', '나 좀 챙겨 줘요~'],
    down: ['{npc} 씨, 거기 누워 있으면 제 몫 커져요~?', '어이쿠 {npc} 씨! 일어나셔야죠~'], weak: ['어머, 이게 들어가네~', '실력이죠~ 실력~'], resist: ['어라라, 안 먹히네~', '이건 패스~'],
    kill: ['막타는 제가 챙겼습니다~', '고마워요, 다들 덕분~'], win: ['오늘 회식 각인데요?', '다들 고생했어요~ 제가 커피 쏠게요. 말로만.'], flee: ['자자, 다음에 또 봐요~'],
    idle: ['에이, 형님 왜 그러세요~', '분위기 좋네~', '이번 건 보너스 나오죠?'], town: ['어? 우연이네요~ 밥 사 주시는 거죠?', '요즘 좋은 일 있어 보여요~'] },
  blunt: { name: '무뚝뚝', base: 'cold', rel: 0.7, chat: 0.4, council: 0, insight: 0.05,
    boss: ['…가자.', '…크다.'], low: ['…괜찮다.', '…아직.'], down: ['…{npc}.', '{npc}, 버텨.'], weak: ['…좋아.', '…됐다.'], resist: ['…안 먹힌다.', '…바꾼다.'],
    kill: ['…하나.', '…끝.'], win: ['…수고.', '…다친 데.'], flee: ['…철수.'], idle: ['…응.', '…가자.', '…'], town: ['…왔냐.', '…밥.'] },
  chatter: { name: '수다쟁이', base: 'kind', rel: 1.3, chat: 2, council: 0, insight: 0,
    boss: ['와 저거 봐 크기 봐 진짜 크다 저거 몇 급이야?', '보스다 보스! 나 보스 처음 보는 거 아닌데 볼 때마다 떨려!'], low: ['아 아파 아파 근데 나 말은 계속할 수 있어!', '피 나는데 나 괜찮은 거 맞지? 맞지?'],
    down: ['{npc}! {npc} 정신 차려! 아직 할 얘기 남았어!', '{npc} 쓰러졌어! 누가 좀!'], weak: ['들어갔다 들어갔어! 봤어? 봤지?', '와 방금 거 대박!'], resist: ['어 이거 왜 안 먹혀? 속성 문제야? 그치?', '아 이거 안 되는 거구나!'],
    kill: ['잡았다! 이따 다들 이 얘기 해야 돼!', '와 나 방금 엄청 멋있지 않았어?'], win: ['끝났다! 아 근데 아까 그 장면 말이야—', '다들 괜찮아? 나 할 얘기 엄청 많아!'], flee: ['뛰어 뛰어! 뛰면서 얘기하자!'],
    idle: ['근데 그거 알아? 어제 포차에서 들은 건데—', '이 게이트 냄새 좀 이상하지 않아?', '아 맞다, 그 얘기 했나?'], town: ['어! 마침 할 얘기 있었는데!', '요즘 무슨 소문 도는지 알아?'] },
  hotblood: { name: '열혈', base: 'just', rel: 1.1, chat: 1.2, council: 0.2, insight: -0.05,
    boss: ['포기하는 순간 끝이야!', '우리라면 할 수 있어!'], low: ['아직이다…! 아직 끝나지 않았어!', '이 정도로 쓰러질 수는 없어!'],
    down: ['{npc}!! 네 몫까지 싸운다!', '{npc}, 반드시 데리고 나간다!'], weak: ['이거다! 이게 우리 힘이야!', '좋았어!'], resist: ['안 먹혀도 계속 친다!', '뚫릴 때까지!'],
    kill: ['해냈다!!', '이게 근성이다!'], win: ['우리가 이겼다!!', '다들 최고야!'], flee: ['다음엔… 다음엔 꼭!'],
    idle: ['가자, 앞으로!', '불타오른다!', '함께라면 무섭지 않아!'], town: ['오늘도 수련하고 왔어!', '같이 뛸래? 10킬로!'] },
  chuuni: { name: '중2병', base: 'warlike', rel: 0.9, chat: 1.2, council: 0.2, insight: 0.05,
    boss: ['후후… 봉인된 오른팔이 욱신거린다…', '심연의 존재여, 너의 이름을 대라.'], low: ['크윽… 흑염룡이 날뛴다…!', '이 상처는… 계약의 대가다.'],
    down: ['{npc}… 너의 희생은 운명의 서에 기록된다.', '{npc}! 아직 각성의 때가 아니다!'], weak: ['예정된 결말이다.', '운명이 내게 속삭였지.'], resist: ['…결계인가. 재미있군.', '이 세계의 법칙이 거부하는가…!'],
    kill: ['어둠으로 돌아가라.', '나의 힘의 일부를 보였을 뿐.'], win: ['오늘의 피는 충분하다.', '…세계는 아직 안전하다.'], flee: ['전략적 차원 이동이다!'],
    idle: ['봉인된 오른팔이 욱신거린다…', '나의 진명을 아는 자는 없다.', '흑염이여…'], town: ['…낮의 세계는 눈부시군.', '오늘 밤 달이 붉다.'] },
  elitist: { name: '엘리트 의식', base: 'cold', rel: 0.7, chat: 0.8, council: 0, insight: 0.1,
    boss: ['이 정도면 내 수준에 맞군.', '하급 헌터들은 물러나 있어.'], low: ['…이럴 리가 없는데.', '내가 이 정도에…?'],
    down: ['{npc}, 그러니까 기본기를 하라고 했잖아.', '{npc}, 일어나. 체면이 있지.'], weak: ['교과서대로군.', '당연한 결과야.'], resist: ['속성 상성도 모르나… 아, 나였군.', '교체한다.'],
    kill: ['격의 차이야.', '기록해 둬.'], win: ['예상 범위 안이야.', '…생각보다 쓸 만하군, 다들.'], flee: ['합리적인 판단이야.'],
    idle: ['F급이 왜 여기 있지?', '내 시간은 비싸.', '수준을 맞춰 줘야 하나.'], town: ['아카데미 수석 출신이야. 알지?', '이 동네는 수준이 좀…'] },
  busybody: { name: '오지랖', base: 'kind', rel: 1.3, chat: 1.4, council: -0.1, insight: 0.05,
    boss: ['다들 포션 챙겼지? 신발 끈은?', '무리하지 말고, 알지?'], low: ['나는 괜찮아, 너희 먼저 챙겨!', '아이고, 나보다 저쪽!'],
    down: ['{npc}! 내가 갈게, 버텨!', '{npc}, 그러게 내가 쉬랬잖아!'], weak: ['잘했어, 잘했어!', '그렇지, 그거야!'], resist: ['그거 안 먹힌대! 다른 거!', '얘들아, 속성 바꿔!'],
    kill: ['다들 안 다쳤지?', '휴, 이제 좀 쉬자.'], win: ['다친 사람 손! 붕대 있어!', '밥은 내가 챙겨 놨어.'], flee: ['다들 따라와! 한 명도 놓치지 마!'],
    idle: ['물 마셨어?', '저기 너 표정 안 좋다?', '다들 잠은 잤어?'], town: ['얼굴이 반쪽이네, 밥은?', '요즘 무리하는 거 아니지?'] },
  calculating: { name: '계산적', base: 'greedy', rel: 0.9, chat: 0.9, council: -0.1, insight: 0.1,
    boss: ['보상 대비 위험도… 들어갈 만해.', '보스 코어 시세부터 확인했어.'], low: ['기대값이 안 나와. 철수 고려.', '손익분기점 아래야.'],
    down: ['{npc} 이탈. 전력 25% 감소.', '{npc} 치료비는 경비 처리.'], weak: ['효율 좋네.', '계산대로.'], resist: ['투입 대비 산출이 나빠. 교체.', '이건 손해야.'],
    kill: ['코어 회수 우선.', '수익 확정.'], win: ['정산은 오늘 안에 하자.', '수익률 나쁘지 않네.'], flee: ['손절도 투자야.'],
    idle: ['기대값이 안 나와.', '이 층, 시간 대비 효율이 별로야.', '경비 영수증 챙겨.'], town: ['코어 시세가 내렸어. 지금 팔지 마.', '요즘 이자율 봤어?'] },
  maniac: { name: '광기', base: 'warlike', rel: 0.8, chat: 1, council: 0.4, insight: -0.1,
    boss: ['크하하! 저 큰 걸 찢는다!', '피 냄새… 좋다.'], low: ['아하하하! 이제야 살아 있는 것 같아!', '더! 더 아프게!'],
    down: ['{npc}, 벌써? 아깝네.', '{npc} 몫까지 피를 보자!'], weak: ['그래, 그 표정!', '터진다!'], resist: ['단단해? 더 좋아!', '부술 맛 나겠네!'],
    kill: ['하하… 하나 더!', '끝? 아쉬운데.'], win: ['벌써 끝났어? 다음 층!', '이 손맛이지.'], flee: ['왜 도망가! 이제 재밌는데!'],
    idle: ['피 보고 싶다.', '크큭…', '다음 놈은 어디 있지?'], town: ['게이트 언제 가?', '마을은 지루해.'] },
  lazy: { name: '귀차니즘', base: 'cold', rel: 0.9, chat: 0.6, council: -0.15, insight: 0,
    boss: ['아 귀찮아… 빨리 끝내자.', '저거 꼭 잡아야 돼?'], low: ['아… 아프고 귀찮고…', '그만 누울래.'],
    down: ['{npc}… 일어나기 귀찮지? 나도.', '{npc}, 나중에 일으켜 줄게.'], weak: ['오, 한 방에. 좋아, 편하네.', '이러면 빨리 끝나겠다.'], resist: ['아 안 먹혀… 귀찮게.', '다른 사람이 해.'],
    kill: ['끝. 이제 쉬자.', '휴.'], win: ['집 가자.', '보고서는 누가 써?'], flee: ['오히려 좋아.'],
    idle: ['아 귀찮아…', '쉬었다 가면 안 돼?', '빨리 끝내자.'], town: ['오늘 휴무야. 말 걸지 마.', '…졸려.'] },
  naive: { name: '순진', base: 'kind', rel: 1.3, chat: 1.2, council: 0.05, insight: -0.1,
    boss: ['우와, 크다! 쟤도 사정이 있겠죠?', '저 괴수, 말 걸면 안 될까요?'], low: ['아야… 아파요!', '이상하다, 분명 피했는데.'],
    down: ['{npc}님 자는 거죠? 그쵸?', '{npc}님! 일어나세요!'], weak: ['와! 맞았다!', '배운 대로 했어요!'], resist: ['어? 안 아프대요!', '얘는 왜 멀쩡해요?'],
    kill: ['미, 미안해…', '잡았어요! 칭찬해 주세요!'], win: ['우리 엄청 잘했죠?', '다들 최고예요!'], flee: ['괴수도 놀랐나 봐요!'],
    idle: ['저 사람이 그러는데 이 게이트에 보물 있대요!', '모두 좋은 사람들이에요.', '이거 먹어도 돼요?'], town: ['어제 어떤 아저씨가 좋은 투자처를 알려 줬어요!', '오늘 날씨 좋죠?'] },
  ajae: { name: '아재', base: 'just', rel: 1.1, chat: 1.3, council: 0, insight: 0.05,
    boss: ['보스가 보스 노릇 하네. 허허.', '저 녀석 키가 크네. 키가 크면? 키다리!'], low: ['아이고 허리야… 아니, 괜찮아.', '나이는 못 속여.'],
    down: ['{npc}, 젊은 사람이 벌써!', '{npc}! 아저씨가 간다!'], weak: ['딱 맞았네! 딱딱한 놈이었나? 허허.', '이게 연륜이지.'], resist: ['안 먹히네. 먹히지 않는 걸 뭐라고 하게? …변비?', '허, 질기네.'],
    kill: ['잡았다! 오늘 저녁은 아저씨가 쏜다!', '젊은이들, 봤지?'], win: ['다들 수고했어. 국밥 먹으러 가자.', '신입은 안 다쳤지?'], flee: ['도망도 기술이야, 허허.'],
    idle: ['신입, 물은 챙겼어?', '세상에서 가장 가난한 왕은? 최저임금. 허허.', '요즘 애들은 말이야…'], town: ['국밥 한 그릇 할래?', '우리 때는 게이트가 이렇게 많지 않았어.'] },
  cynic: { name: '냉소', base: 'cold', rel: 0.7, chat: 0.8, council: -0.1, insight: 0.05,
    boss: ['협회는 또 정보를 틀렸네.', '어차피 공은 길드가 가져가겠지.'], low: ['보험 처리나 되려나.', '역시 이렇게 되지.'],
    down: ['{npc}… 협회가 뭐 해 준 게 있다고.', '{npc}, 그러니까 열심히 하지 말랬잖아.'], weak: ['운이 좋았네.', '이번엔 맞았네.'], resist: ['그럼 그렇지.', '기대도 안 했어.'],
    kill: ['하나 줄었네. 세상은 그대로지만.', '수당은 쥐꼬리겠지.'], win: ['이긴다고 뭐가 바뀌나.', '살았네. 다행인지는 모르겠고.'], flee: ['현명한 선택이야. 드물게.'],
    idle: ['협회가 뭐 해 준 게 있다고.', '랭킹? 다 돈이지.', '영웅은 뉴스에만 있어.'], town: ['또 무슨 법 만든대.', '뉴스 봤어? 다 연기야.'] },
  stickler: { name: '원칙주의', base: 'just', rel: 0.9, chat: 0.9, council: -0.3, insight: 0.05,
    boss: ['보스 진입 전 점검. 장비, 체력, 퇴로.', '규정상 보스전은 전원 동의가 필요합니다.'], low: ['규정상 후방으로 빠집니다.', '체력 30% 이하, 보고합니다.'],
    down: ['{npc} 전투 불능, 기록합니다.', '{npc}! 응급 절차 시작!'], weak: ['매뉴얼대로입니다.', '확인.'], resist: ['속성 판정 오류. 교체 절차.', '보고서에 적겠습니다.'],
    kill: ['처치 확인.', '절차대로 마무리.'], win: ['부상자 점검 후 보고서 작성.', '전원 생존 확인.'], flee: ['철수 절차 준수!'],
    idle: ['그건 절차에 어긋납니다.', '안전 수칙 3항, 기억하세요.', '서류는 제가 하겠습니다.'], town: ['갱신 서류 기한이 다음 주예요.', '규정집 개정판 나왔습니다.'] },
  gambler: { name: '도박꾼', base: 'greedy', rel: 1, chat: 1.2, council: 0.35, insight: -0.05,
    boss: ['한 판 크게 가자!', '저기 잭팟이 있다!'], low: ['아직 칩 남았어!', '여기서 접으면 손해야!'],
    down: ['{npc}, 패가 안 좋았네.', '{npc} 몫까지 올인!'], weak: ['따따블!', '이게 감이지!'], resist: ['꽝이네. 다음 판!', '운이 안 따르네.'],
    kill: ['잭팟!', '오늘 운 좋다!'], win: ['한 판 더!', '판돈 두 배!'], flee: ['이번 판은 접는다…'],
    idle: ['한 판 더!', '저 위험한 길로 가 보자.', '내기할래? 다음 방에 뭐 있는지.'], town: ['경매장 갈래? 감이 와.', '어제 좀 잃었어. 빌려줄래?'] },
  shy_genius: { name: '소심한 천재', base: 'cold', rel: 1, chat: 0.6, council: -0.05, insight: 0.2,
    boss: ['저, 저기… 저거 오른쪽이 약점 같아요.', '패턴이… 세 번째에 빈틈이…'], low: ['저, 그… 저 좀 위험해요.', '계산상… 두 대면…'],
    down: ['{npc}님… 제, 제가 메울게요.', '{npc}님! 그, 그 위치 위험하다고 말하려 했는데…'], weak: ['역시… 맞았다.', '가설이 맞았어요.'], resist: ['아, 이건 반대 속성…', '죄송해요, 제가 잘못 봤어요…'],
    kill: ['어, 어떻게… 됐네요.', '…좋아요.'], win: ['아까 그 패턴, 기록해 둘게요.', '다, 다들 잘했어요.'], flee: ['그, 그게 맞는 판단이에요.'],
    idle: ['저, 저기… 이 방 뭔가 이상해요.', '…아무것도 아니에요.', '혹시… 바닥 문양 보셨어요?'], town: ['도서관에 있었어요.', '그… 같이 밥… 아, 아니에요.'] },
  mood_maker: { name: '분위기 메이커', base: 'kind', rel: 1.4, chat: 1.5, council: 0.05, insight: 0,
    boss: ['자자, 다 같이 파이팅!', '이거 이기면 다들 레전드!'], low: ['괜찮아 괜찮아, 나 아직 웃고 있잖아!', '하하, 이 정도는 추억이지!'],
    down: ['{npc}! 일어나면 내가 맛있는 거 사 줄게!', '{npc}, 아직 끝 아니야!'], weak: ['나이스! 다들 봤지?', '오늘 컨디션 최고!'], resist: ['괜찮아, 다음엔 들어가!', '하하, 단단한 녀석!'],
    kill: ['박수!', '오늘의 하이라이트 나왔다!'], win: ['우리 팀 최고! 사진 찍자!', '다친 사람? 오늘은 내가 쏜다!'], flee: ['괜찮아, 다음에 이기면 돼! 진짜로!'],
    idle: ['다들 표정 펴! 웃으면 복이 와!', '노래 한 곡 할까?', '이 팀 좋다, 진짜.'], town: ['오늘 뭐 할 거야? 같이 놀자!', '분위기 왜 이래, 다들 웃어!'] },
};

// ---------- 추가 30종 (사용자 요청: 50종) ----------
Object.assign(PERSONAS, {
  steadfast: { name: '우직', base: 'just', rel: 0.9, chat: 0.6, council: 0, insight: 0.05, boss: ['동요하지 마라.', '평소처럼.'], low: ['아직 서 있다.', '흔들리지 않는다.'], down: ['{npc}, 쉬어라. 내가 맡는다.', '{npc}의 자리는 내가 채운다.'], weak: ['흐름이 왔다.', '좋다.'], resist: ['방법을 바꾸면 된다.', '서두를 것 없다.'], kill: ['다음.', '하나.'], win: ['오늘도 무사히.', '잘했다.'], flee: ['물러서는 것도 용기다.'], idle: ['마음을 가라앉혀라.', '서두르지 마라.', '…'], town: ['차 한잔 하겠나.', '오늘은 바람이 좋다.'] },
  romantic: { name: '로맨티스트', base: 'kind', rel: 1.3, chat: 1.3, council: 0, insight: 0, boss: ['이 싸움이 끝나면 꼭 할 말이 있어.', '운명의 상대가 보스라니…'], low: ['내 마지막 말은… 아직 안 정했어.', '아파도 아름답게.'], down: ['{npc}! 너 없으면 이 이야기는 비극이야!', '{npc}, 눈을 떠 줘!'], weak: ['이건 운명이야!', '별이 도왔어.'], resist: ['차가운 녀석이네…', '마음을 열지 않는구나.'], kill: ['안녕, 슬픈 짐승아.', '이 장면, 영화 같지 않아?'], win: ['오늘 밤은 축배를!', '우리 이야기가 계속돼.'], flee: ['잠시 이별이야.'], idle: ['이 게이트 노을 같은 빛 봤어?', '사랑해 본 적 있어?', '낭만이 없잖아, 낭만이.'], town: ['꽃집 앞을 지나왔어.', '오늘 누구 만날 것 같은 예감.'] },
  perfectionist: { name: '완벽주의', base: 'cold', rel: 0.9, chat: 1, council: -0.15, insight: 0.05, boss: ['동선 다시 맞춰. 0.5초 늦었어.', '완벽하게 끝낸다. 흠집 하나 없이.'], low: ['방금 피격은 내 실수야. 용납 못 해.', '이런 실수를… 내가?'], down: ['{npc}, 진형이 엉망이잖아. 다시 맞춰.', '{npc}! 계획에 없던 일이야!'], weak: ['정확히 계산한 각도야.', '이 정도는 돼야지.'], resist: ['준비가 부족했어. 내 탓이야.', '다시. 처음부터 다시.'], kill: ['깔끔. 하지만 0.2초 늦었어.', '이 정도면 합격.'], win: ['이겼지만 피해가 3% 많았어.', '다음엔 무피해로 간다.'], flee: ['계획 실패. 원인 분석은 나가서.'], idle: ['장비 정렬 다시 했어.', '발소리 맞춰.', '대충은 없어.'], town: ['어제 장비 세 번 닦았어.', '이 거리 간판 글씨가 비뚤어.'] },
  fatalist: { name: '운명론자', base: 'cold', rel: 1, chat: 0.9, council: 0, insight: 0.1, boss: ['오늘 이 만남은 정해져 있었어.', '피할 수 없는 거라면 맞서야지.'], low: ['여기까지가 내 운명인가.', '아직 끝이라고 쓰여 있진 않아.'], down: ['{npc}… 이것도 정해진 일이었을까.', '{npc}의 끝은 오늘이 아니야. 그렇게 쓰여 있어.'], weak: ['그렇게 될 일이었지.', '별이 맞췄어.'], resist: ['아직 때가 아니야.', '흐름이 막혔어.'], kill: ['녀석의 명이 다했어.', '정해진 대로.'], win: ['살아남을 운명이었군.', '오늘은 우리 편이었어.'], flee: ['물러서는 것도 정해진 길.'], idle: ['다 정해져 있어.', '오늘 꿈에 이 방이 나왔어.', '흐름에 맡겨.'], town: ['점괘가 좋더라.', '오늘 너를 만날 줄 알았어.'] },
  gourmet: { name: '미식가', base: 'greedy', rel: 1.2, chat: 1.3, council: 0.05, insight: -0.05, boss: ['저거 구우면 몇 인분일까?', '배고파서 힘이 안 나…'], low: ['간식만 있었어도…', '배고파서 더 아파.'], down: ['{npc}! 일어나면 고기 사 줄게!', '{npc}, 아직 회식 안 했어!'], weak: ['맛있게 들어갔다!', '바삭!'], resist: ['질기네…', '이건 못 먹겠다.'], kill: ['다 익었다!', '오늘 저녁 메뉴 정했다.'], win: ['밥 먹으러 가자!!', '배고파서 쓰러질 것 같아.'], flee: ['도시락 두고 왔어!'], idle: ['배고프다.', '육포 먹을 사람?', '이 층 끝나면 밥 먹자.'], town: ['새로 생긴 국밥집 가 봤어?', '밥은 먹었어? 나 아직.'] },
  worrier: { name: '걱정쟁이', base: 'kind', rel: 0.9, chat: 1, council: -0.3, insight: 0.05, boss: ['우린 다 죽을 거야.', '저건 못 이겨.'], low: ['거봐, 끝이야.', '유언 쓸 시간은 있나.'], down: ['{npc}… 다음은 나겠지.', '{npc}, 그러게 오지 말자 했잖아.'], weak: ['…어쩌다 들어갔네.', '이번만이겠지.'], resist: ['당연하지. 될 리가 없어.', '역시.'], kill: ['…아직 많이 남았어.', '의미 없어.'], win: ['…살았네. 이상하다.', '다음엔 안 될 거야.'], flee: ['처음부터 무리였어.'], idle: ['이번 층에서 다 죽을지도.', '어차피 안 될 거야.', '불길해.'], town: ['내일 브레이크 터질 것 같아.', '세상이 망해 가.'] },
  sunny: { name: '해맑음', base: 'kind', rel: 1.3, chat: 1.3, council: 0.15, insight: -0.05, boss: ['괜찮아, 다 잘될 거야!', '보스도 사실 착할지 몰라!'], low: ['아직 반이나 남았어!', '이것도 경험이지!'], down: ['{npc}, 쉬는 시간이야! 금방 올 거지?', '{npc}! 괜찮아, 괜찮아!'], weak: ['역시! 될 줄 알았어!', '좋아 좋아!'], resist: ['다음엔 될 거야!', '실패도 배움!'], kill: ['최고야!', '봐, 된다니까!'], win: ['거봐, 다 잘됐잖아!', '오늘 최고의 날!'], flee: ['다음에 이기면 되지!'], idle: ['오늘 운이 좋은 날 같아!', '다 잘될 거야!', '웃자!'], town: ['좋은 아침!', '오늘 뭔가 좋은 일 생길 것 같아!'] },
  kuudere: { name: '쿨데레', base: 'cold', rel: 1, chat: 0.5, council: 0, insight: 0.1, boss: ['…큰 놈이네.', '…괜찮아. 옆에 있을게.'], low: ['…조금 아파.', '…신경 쓰지 마. 고마워.'], down: ['…{npc}. 일어나. 부탁이야.', '…{npc}, 눈 떠.'], weak: ['…맞았어.', '…봤어? …아니, 됐어.'], resist: ['…안 통해.', '…바꿀게.'], kill: ['…끝.', '…너 덕분이야.'], win: ['…다행이다. 다들 무사해서.', '…수고했어. 진심이야.'], flee: ['…가자. 손 잡아.'], idle: ['…', '…너랑 있으면 조용해서 좋아.', '…응.'], town: ['…왔어? …기다린 거 아니야. 기다렸어.', '…차 마실래.'] },
  timid: { name: '소심', base: 'kind', rel: 1.1, chat: 1, council: -0.2, insight: 0.05, boss: ['소, 손이 떨려…', '심호흡, 심호흡…'], low: ['괜찮아, 괜찮아, 괜찮아…', '집중, 집중…'], down: ['{npc}! 어, 어떡해!', '{npc}, 내가 할게, 할 수 있어…!'], weak: ['됐, 됐다!', '휴우…'], resist: ['왜, 왜 안 돼!', '침착하자…'], kill: ['하, 했어…!', '다리 풀린다…'], win: ['끝났다… 진짜 끝났다…', '심장 터지는 줄.'], flee: ['빨리, 빨리!'], idle: ['방금 그림자 움직였지?', '숨 좀 고를게.', '긴장돼…'], town: ['어제 잠을 못 잤어.', '다음 게이트 언제야…?'] },
  hothead: { name: '다혈질', base: 'warlike', rel: 0.8, chat: 1.1, council: 0.2, insight: 0, boss: ['협회 말 들었으면 여기 안 왔지.', '규칙? 그런 거 몰라.'], low: ['아직 안 끝났어.', '쓰러지라는 대로 쓰러질 것 같아?'], down: ['{npc}, 버텨. 저놈들한테 지지 마.', '{npc}! 그렇게 쉽게 눕지 마!'], weak: ['내 방식이 맞잖아.', '봤냐!'], resist: ['하, 이것도 규칙이냐?', '다른 길로 간다.'], kill: ['꺼져.', '다음.'], win: ['우리 방식으로 이겼다.', '협회엔 보고하지 마.'], flee: ['다음엔 내 방식대로 간다.'], idle: ['명령은 싫어.', '누가 정한 규칙인데?', '내 맘대로 할 거야.'], town: ['관리국 놈들이 또 와서 귀찮게 굴더라.', '규정집? 버렸어.'] },
  soldierly: { name: '군인 기질', base: 'just', rel: 1, chat: 0.8, council: 0.1, insight: 0.05, boss: ['적 보스 확인! 진입 대기!', '전원 전투 배치!'], low: ['피격! 작전 수행 가능!', '부상 경미! 계속 갑니다!'], down: ['{npc} 전투 불능! 엄호합니다!', '위생병! {npc} 후송!'], weak: ['명중! 효과 확인!', '타격 유효!'], resist: ['타격 무효! 화력 전환!', '목표 장갑 두꺼움!'], kill: ['목표 제압!', '적 1 제거, 이상 무!'], win: ['상황 종료! 인원 점검!', '임무 완수, 보고합니다!'], flee: ['철수! 철수! 순서대로!'], idle: ['전방 이상 무.', '대기 중.', '지시를 기다립니다.'], town: ['오늘 아침 구보 10킬로 했습니다.', '휴가 복귀 신고합니다.'] },
  opportunist: { name: '기회주의', base: 'greedy', rel: 1, chat: 1.1, council: 0, insight: 0.1, boss: ['정면으로? 에이, 옆으로 돌자.', '저 녀석 약점, 이미 봤지.'], low: ['후후, 이것도 계산 안이야.', '속은 척 해 주는 거야.'], down: ['{npc}, 빚 하나 생긴 거다.', '{npc}! 내가 대신 받아 줄게, 나중에 갚아.'], weak: ['예상대로지.', '후후.'], resist: ['그럼 다른 수.', '속임수가 안 통하네.'], kill: ['깔끔하게.', '아무도 못 봤지?'], win: ['내 몫은 따로 챙겼어.', '다들 수고~ 후후.'], flee: ['뒷문은 내가 알아.'], idle: ['비밀 하나 알려 줄까? 비싸.', '정면 승부는 바보들이나 해.', '후후.'], town: ['좋은 정보 있는데, 살래?', '어제 재밌는 걸 봤지.'] },
  chivalrous: { name: '기사도', base: 'just', rel: 0.9, chat: 0.9, council: 0, insight: 0.05, boss: ['품위 있게 상대해 드리겠소.', '예의를 갖추시오, 괴수여.'], low: ['체면이… 상하는구려.', '이 정도는 견디오.'], down: ['{npc} 경, 일어나시오!', '{npc}, 그대의 명예는 내가 지키겠소.'], weak: ['우아하게.', '훌륭하오.'], resist: ['무례한 녀석이로구려.', '방법을 바꾸겠소.'], kill: ['명예롭게 쓰러졌소.', '끝이로구려.'], win: ['다들 훌륭했소.', '오늘 저녁은 내가 대접하겠소.'], flee: ['명예로운 후퇴요.'], idle: ['차 한잔이 그립구려.', '예의는 지킵시다.', '흠.'], town: ['좋은 아침이오.', '오늘 다과회가 있소.'] },
  brawler: { name: '싸움꾼', base: 'warlike', rel: 1.1, chat: 1.2, council: 0.2, insight: 0, boss: ['야, 저 덩치 우리 동네였으면 벌써 눕혔어.', '쫄지 마! 형이 간다!'], low: ['이 정도는 동네 싸움보다 덜 아파!', '아직 멀쩡해!'], down: ['{npc}! 누가 우리 애 건드렸어!', '{npc}, 일어나! 형 있잖아!'], weak: ['봤지? 이게 골목 기술이야!', '한 방!'], resist: ['단단하네, 그래도!', '다시 간다!'], kill: ['다음 놈 나와!', '정리!'], win: ['다들 수고했다! 떡볶이 간다!', '우리 애들 다 괜찮지?'], flee: ['오늘은 물러난다!'], idle: ['우리 애들 건드리면 죽어.', '쫄지 마.', '형만 믿어.'], town: ['동네 애들이 또 싸웠대.', '밥은? 형이 산다.'] },
  otaku: { name: '오타쿠', base: 'cold', rel: 1, chat: 1.1, council: -0.1, insight: 0.15, boss: ['흥미로운 표본이군.', '이 개체는 기록에 없어.'], low: ['데이터상… 위험 수준.', '실험은 여기까지인가.'], down: ['{npc} 생체 신호 약함! 응급!', '{npc}, 아직 연구할 게 많아.'], weak: ['가설 입증.', '이론대로야.'], resist: ['변수가 있었군.', '재계산.'], kill: ['샘플 채취해야 해.', '기록.'], win: ['코어 하나는 연구용으로 줘.', '귀중한 데이터였어.'], flee: ['데이터는 챙겼어.'], idle: ['이 벽의 문양… 고대 문자 같아.', '에테르 농도 측정 중.', '흥미롭군.'], town: ['논문 마감이야.', '청룡 연구소에서 연락 왔어.'] },
  spacey: { name: '4차원', base: 'kind', rel: 1.1, chat: 1.2, council: 0.05, insight: -0.05, boss: ['저거 혹시 용 아닐까?', '보스를 이기면 공주가… 아 아니구나.'], low: ['어? 언제 맞았지?', '꿈인가…'], down: ['{npc}! 꿈속에서도 일어나!', '{npc}, 이건 꿈이야, 꿈.'], weak: ['상상했던 대로야!', '와아.'], resist: ['어라, 상상이랑 다르네.', '흠냐.'], kill: ['동화처럼 끝났다!', '해피엔딩!'], win: ['오늘 일 일기에 써야지.', '우리 모험담 같지 않아?'], flee: ['다음 챕터로!'], idle: ['구름 모양 봤어? …아 여긴 게이트지.', '만약에 말이야…', '음…'], town: ['어제 꿈에 용이 나왔어.', '별 보러 갈래?'] },
  dutiful: { name: '책임감', base: 'just', rel: 0.9, chat: 0.8, council: 0.15, insight: 0, boss: ['오늘 할당량 마저 채운다.', '시간 단축 가능.'], low: ['업무에 지장 없음.', '야근 수준이야.'], down: ['{npc}, 업무 인계받는다.', '{npc} 몫까지 처리한다.'], weak: ['효율 좋아.', '진도 나간다.'], resist: ['다른 방식으로 처리.', '재작업.'], kill: ['처리 완료.', '다음 건.'], win: ['다음 게이트 일정은?', '보고서 지금 쓸게.'], flee: ['일정 재조정.'], idle: ['다음 일정 확인 중.', '쉬면 불안해.', '빨리 가자.'], town: ['오늘도 게이트 두 개 잡았어.', '휴가? 그게 뭐야.'] },
  sharp_tongue: { name: '독설가', base: 'cold', rel: 0.8, chat: 1.1, council: -0.05, insight: 0.05, boss: ['와, 정말 작고 귀엽네.', '오늘 운수 대통이다, 그렇지?'], low: ['완벽해. 정말 완벽해.', '이게 바로 내가 원하던 거야.'], down: ['{npc}, 바닥이 그렇게 좋아?', '{npc}, 훌륭한 연기야.'], weak: ['오, 드디어 뭔가 했네.', '박수라도 쳐 줘?'], resist: ['놀랍다. 정말 놀라워.', '역시 대단한 계획이야.'], kill: ['세상이 조금 나아졌네.', '와아, 굉장해.'], win: ['또 살아남았네, 기적이야.', '우리 대단하다, 그치?'], flee: ['명예로운 도주, 멋있다.'], idle: ['멋진 산책이야.', '재밌어 죽겠네.', '어련하시겠어.'], town: ['아, 반가워라. 정말로.', '오늘도 행복하네, 엄청.'] },
  justice_freak: { name: '정의광', base: 'just', rel: 1.1, chat: 1.2, council: 0.25, insight: -0.05, boss: ['영웅은 물러서지 않는다!', '이 순간을 기다렸다!'], low: ['영웅은 쓰러지지 않아…!', '시민들이 보고 있어!'], down: ['{npc}! 영웅이 구하러 간다!', '{npc}, 네 희생은 헛되지 않아!'], weak: ['정의의 일격!', '이것이 영웅의 힘!'], resist: ['시련이다! 극복한다!', '포기하지 않아!'], kill: ['정의는 승리한다!', '평화를 지켰다!'], win: ['오늘도 세상을 구했다!', '사인은 나중에!'], flee: ['영웅도 때론 물러선다…!'], idle: ['언젠가 국민 영웅이 될 거야.', '정의가 부른다!', '도움이 필요한 사람?'], town: ['오늘 고양이 구해 줬어!', '영웅 포즈 연습 중.'] },
  miser: { name: '수전노', base: 'greedy', rel: 1.1, chat: 1.1, council: 0, insight: 0.05, boss: ['보스 가죽은 따로 팔면 돼.', '부산물 챙겨!'], low: ['병원비 아끼려면 버텨야지.', '포션 아까운데…'], down: ['{npc}, 치료비 내가 싸게 아는 데 있어!', '{npc}! 일어나, 일당 깎인다!'], weak: ['좋아, 부산물 안 상했어.', '깔끔!'], resist: ['아까운 탄약.', '절약 모드.'], kill: ['해체는 내가 할게.', '이거 다 돈이야.'], win: ['전리품 정리할게, 쓸 만한 거 많다.', '오늘 장사 잘했다.'], flee: ['챙길 건 챙겼어!'], idle: ['저 돌, 팔면 돈 될걸?', '버리지 마, 그거 쓸 데 있어.', '아껴야 잘 살지.'], town: ['중고 장터 다녀왔어.', '쿠폰 모으는 중이야.'] },
  devout: { name: '신앙인', base: 'just', rel: 1.1, chat: 0.9, council: -0.05, insight: 0.1, boss: ['신께서 함께하신다.', '두려워 말라.'], low: ['이 고통도 뜻이 있으리라.', '기도한다…'], down: ['{npc}를 위해 기도한다.', '{npc}, 아직 부르심이 아니야!'], weak: ['은총이다.', '감사합니다.'], resist: ['시험이다.', '인내하라.'], kill: ['안식을.', '돌아가라.'], win: ['감사의 기도를.', '모두 무사함에 감사.'], flee: ['살아남는 것도 은혜다.'], idle: ['평화를.', '모든 것엔 뜻이 있다.', '기도하자.'], town: ['예배당에 다녀왔어.', '축복을.'] },
  lone_wolf: { name: '고독한 늑대', base: 'cold', rel: 0.7, chat: 0.4, council: -0.05, insight: 0.05, boss: ['혼자였으면 더 빨랐어.', '방해하지 마.'], low: ['도움 필요 없어.', '혼자 해.'], down: ['{npc}… 그러니까 혼자가 편하다고.', '{npc}, 내 앞에서 죽지 마.'], weak: ['내 몫은 했다.', '됐어.'], resist: ['상관없어.', '바꾼다.'], kill: ['끝.', '하나.'], win: ['…이번엔 같이 해서 나쁘지 않았어.', '해산.'], flee: ['각자 알아서.'], idle: ['…', '나 신경 쓰지 마.', '혼자 갈게.'], town: ['…무슨 일.', '혼자 있고 싶어.'] },
  competitor: { name: '승부욕', base: 'warlike', rel: 1, chat: 1.1, council: 0.3, insight: 0, boss: ['누가 먼저 잡나 내기다!', '저건 내 사냥감이야.'], low: ['아직 안 졌어!', '지는 건 질색이야!'], down: ['{npc}, 탈락이냐? 내가 이긴 거다.', '{npc}! 승부는 아직이야, 일어나!'], weak: ['1점!', '내가 앞선다!'], resist: ['칫, 이건 노카운트!', '다시!'], kill: ['내가 막타! 이번 판 내 승!', '스코어 몇 대 몇?'], win: ['오늘 처치 수 내가 1등이지?', '다음 판도 내가 이긴다.'], flee: ['이건 무승부야!'], idle: ['다음 방 누가 먼저 클리어하나 내기.', '지금 스코어 기억하고 있지?', '지는 건 싫어.'], town: ['팔씨름 한 판?', '랭킹 봤어? 다음 달엔 내가 위야.'] },
  klutz: { name: '허당', base: 'kind', rel: 1.2, chat: 1.2, council: 0.05, insight: -0.05, boss: ['어, 어 잠깐만, 신발 끈이…!', '저, 저 준비됐어요! …아마도.'], low: ['방금 제 발에 걸려 넘어졌어요…', '아야, 벽에 박았다…'], down: ['{npc}님! 제가 일으킬게요— 으악, 미끄러졌다!', '{npc}님, 저 때문 아니죠…?'], weak: ['어? 이게 맞았네?!', '실수로 쳤는데 들어갔어요!'], resist: ['아 또 엉뚱한 거 눌렀다!', '이거 아닌가 봐요, 헤헤…'], kill: ['어… 제가 잡은 거예요? 진짜로?', '결정적일 땐 한다니까요!'], win: ['저 오늘 한 건 했죠?!', '넘어진 건 빼고 생각해 주세요.'], flee: ['반대쪽이에요, 반대쪽!'], idle: ['어, 포션을 어디 뒀더라…', '지도 거꾸로 보고 있었네요.', '이번엔 안 넘어질게요!'], town: ['열쇠를 또 잃어버렸어요.', '어제 길드 문에 이마 박았어요.'] },
  self_doubt: { name: '자존감 낮음', base: 'kind', rel: 1.5, chat: 0.8, council: -0.1, insight: 0.05, boss: ['제가… 도움이 될까요…', '저 같은 게 보스전에…'], low: ['역시 저는 안 되나 봐요…', '죄송해요, 제가 약해서…'], down: ['{npc}님… 제가 더 잘했으면…', '{npc}님 대신 제가 맞았어야 했는데…'], weak: ['어, 제가… 해냈어요?', '저, 저도 할 수 있구나…'], resist: ['역시 저는…', '죄송해요, 죄송해요.'], kill: ['제, 제가요?!', '…저 조금은 쓸모 있죠?'], win: ['저 오늘 방해 안 됐죠…?', '칭찬해 주시면… 더 열심히 할게요.'], flee: ['제 탓이에요…'], idle: ['제가 여기 있어도 될까요…', '다들 대단하세요.', '저도 언젠가는…'], town: ['어제 수련 혼자 더 했어요.', '저 기억해 주셨어요?'] },
  ambitious: { name: '야심가', base: 'greedy', rel: 0.9, chat: 1, council: 0.15, insight: 0.05, boss: ['이 보스 공략 실적이면 간부 자리 확정이지.', '윗선에 보고 들어갈 건이다.'], low: ['여기서 쓰러지면 경력에 오점이야.', '아직 승진 심사 전이라고.'], down: ['{npc}, 네 공적은 내가 잘 정리해 주지.', '{npc}! 인원 손실은 평가에 안 좋아.'], weak: ['실적 하나 추가.', '이 장면 보고서 첫 줄이다.'], resist: ['계획 수정. 결과만 내면 돼.', '과정은 상관없어.'], kill: ['공로는 정확히 기록해.', '길드장님께 말씀드려야겠군.'], win: ['이번 건으로 우리 팀 평가가 오른다.', '다음 공략권도 우리가 가져온다.'], flee: ['후퇴도 전략적 판단으로 보고하지.'], idle: ['5년 안에 길드장이 될 거야.', '인맥이 실력이야.', '줄은 잘 서야 해.'], town: ['길드 간부 회의에 다녀왔어.', '이번 인사 발표 봤어?'] },
  merchant_soul: { name: '장사꾼', base: 'greedy', rel: 1.1, chat: 1.3, council: 0.05, insight: 0.05, boss: ['보스 코어 시세가 지금 최고가야!', '저거 통째로 팔면 건물 한 채!'], low: ['병원비 견적 나왔다…', '이건 손해 보는 장사야.'], down: ['{npc}! 너 빠지면 분배 비율이 바뀌잖아!', '{npc}, 일어나면 할인해 줄게!'], weak: ['상품 가치 안 떨어지게 깔끔히!', '이건 A등급 부산물이다!'], resist: ['흠집 나면 값 떨어져, 조심!', '다른 각도로, 손님!'], kill: ['물건 들어왔습니다~', '이 코어 내가 판매 대행할게.'], win: ['자, 정산합시다. 수수료는 싸게.', '부산 시장이 이것보다 2할 더 쳐 줘.'], flee: ['재고는 챙겼어!'], idle: ['요즘 코어 시세 알아? 설명해 줄게.', '흥정은 기술이야.', '이 돌멩이도 팔면 돈이야.'], town: ['좋은 물건 들어왔어, 볼래?', '오늘 장 좀 봤지.'] },
  haunted: { name: '트라우마', base: 'cold', rel: 0.9, chat: 0.5, council: -0.25, insight: 0.1, boss: ['…저 모양, 그때랑 똑같아.', '손이… 안 움직여.'], low: ['또… 또 이렇게…', '그날처럼은 안 돼.'], down: ['{npc}… 안 돼, 또 잃을 순 없어!', '{npc}! 이번엔… 이번엔 지킨다!'], weak: ['…이번엔 다르다.', '움직였다.'], resist: ['…그때도 이랬어.', '숨이…'], kill: ['…끝났어. 끝난 거야.', '그날의 빚을 하나 갚았다.'], win: ['…살아서 나간다. 다 같이.', '다들… 있지? 다 있지?'], flee: ['빨리, 그날처럼 되기 전에!'], idle: ['…붉은 빛은 싫어.', '여긴 너무 조용해.', '…괜찮아. 괜찮아.'], town: ['…어젯밤도 그 꿈이야.', '사람 많은 데는 좀…'] },
  drifter: { name: '방랑자', base: 'cold', rel: 0.9, chat: 0.8, council: 0, insight: 0.05, boss: ['이런 놈은 남쪽에서도 봤지.', '길 위에선 늘 이런 놈이 막지.'], low: ['길에서 다친 건 길에서 낫는다.', '흉터 하나 더.'], down: ['{npc}, 여기서 멈추기엔 길이 아직 멀다.', '{npc}! 같이 걸어온 길이 있잖아.'], weak: ['떠돌며 배운 수다.', '좋아.'], resist: ['다른 길로 돌아가자.', '막히면 돌아가면 돼.'], kill: ['이 땅에서 볼일은 끝났다.', '다음 길로.'], win: ['다음은 어느 도시로 가지?', '바람이 바뀌었다.'], flee: ['길은 또 있다.'], idle: ['한곳에 오래 있으면 답답해.', '이 게이트 끝엔 뭐가 있을까.', '바람 냄새가 다르다.'], town: ['내일 떠날까 해.', '이 도시는 처음이야. 아니, 두 번째던가.'] },
  insider: { name: '인싸', base: 'greedy', rel: 1.3, chat: 1.5, council: 0.05, insight: 0, boss: ['이 보스 내 단톡방에서 벌써 화제야!', '공략 영상 친구가 보내 줬어!'], low: ['아 이거 사진 찍어 올려야 하는데…', '병원 원장님 내가 아는 사람이야.'], down: ['{npc}! 내 친구 힐러 불러 줄게!', '{npc}, 너 쓰러진 거 벌써 소문났어!'], weak: ['이거 바로 단톡방에 올린다!', '역시 내 친구들 정보 정확해!'], resist: ['어? 친구가 이거 먹힌다던데?', '정보가 틀렸네, 단톡방 혼내야지.'], kill: ['인증샷!', '이거 오늘 피드 각!'], win: ['이따 뒤풀이 내가 잡아 둘게!', '다들 친구 추가했지?'], flee: ['다른 친구 파티 불렀어!'], idle: ['들었어? 백호 길드 간부 얘기.', '내가 아는 사람이 그러는데…', '여기 아는 사람 있나?'], town: ['어! 너도 왔구나! 다 아는 사람이네!', '오늘 모임 세 개야.'] },
});

const PERSONA_RENAME = {"moodmaker": "mood_maker", "smoothie": "smooth", "hothead": "hotblood", "bragger": "braggart", "competitive": "competitor", "sarcastic": "sharp_tongue", "elite": "elitist", "lonewolf": "lone_wolf", "shygenius": "shy_genius", "hero": "justice_freak", "noble": "chivalrous", "workaholic": "dutiful", "stoic": "steadfast", "loyal": "soldierly", "calculator": "calculating", "hustler": "miser", "sly": "opportunist", "nervous": "timid", "pessimist": "worrier", "daydreamer": "spacey", "scholar": "otaku", "glutton": "gourmet", "philosopher": "fatalist", "spiritual": "devout", "grumbler": "perfectionist", "silent": "kuudere", "optimist": "sunny", "rebel": "hothead", "street": "brawler"};
const PERSONA_RENAME_DROP = { prankster: 'klutz', warmhearted: 'self_doubt', joker: 'mood_maker', vain: 'insider', veteran: 'steadfast', tactician: 'calculating', showoff: 'insider' };
const PERSONA_RARE = { maniac: 0.3, lone_wolf: 0.3, haunted: 0.3 };
const PERSONA_BY_BASE = {};
for (const [id, P] of Object.entries(PERSONAS)) (PERSONA_BY_BASE[P.base] ??= []).push(id);

// 직업 맛 (전투 시작·잡담 일부를 덮어쓴다)
const CLASS_FLAVOR = {
  priest: ['신의 가호를!', '빛이여, 우리를 지켜 주소서.'], paladin: ['정의의 이름으로!', '방패 뒤로!'], blackflame: ['검은 불꽃이 굶주렸다.', '피가 더 필요해.'],
  sniper: ['조준 중. 말 걸지 마.', '바람 2, 거리 300.'], archer: ['시위를 당긴다.', '한 발이면 돼.'], gunslinger: ['장전 완료.', '탄창 갈아 끼운다!'],
  shaman: ['대감님 오신다!', '원귀야, 가라.'], taoist: ['급급여율령!', '부적이 떨린다.'], necromancer: ['일어나라, 망자여.', '죽음은 끝이 아니다.'],
  healer: ['다친 사람 내 쪽으로!', '회복은 맡겨!'], bard: ['한 곡 뽑는다!', '리듬 타!'], berserker: ['피가 끓는다아!', '찢어 버린다!'],
  guardian: ['내가 막는다!', '뒤로 빠져!'], assassin: ['그림자 속으로.', '목을 노린다.'], seer: ['다음 수가 보인다.', '…세 걸음 뒤에 함정.'],
  machinist: ['드론 전개!', '출력 120%.'], summoner: ['나와라!', '계약에 따라.'], alchemist: ['비율이 중요해.', '폭발 주의!'],
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.pickPersona = function (n) { const pool = PERSONA_BY_BASE[n.personality] || Object.keys(PERSONAS); return RNG.weighted(pool, pool.map((id) => PERSONA_RARE[id] || 1)); };
  GP.personaOf = function (n) { if (!n) return null; if (!n.persona || !PERSONAS[n.persona]) n.persona = this.pickPersona(n); return PERSONAS[n.persona]; };

  wrap('initSandbox', function (base) {
    base.call(this);
    for (const n of this.npcs || []) { if (n.persona && !PERSONAS[n.persona]) n.persona = PERSONA_RENAME[n.persona] || PERSONA_RENAME_DROP[n.persona] || null; n.persona ??= this.pickPersona(n); } // 옛 저장: 기질 안에서 이전, v0.148 id 이름 바꿈
    this.world.chatSeen ??= {};
  });
  wrap('makeNpc', function (base, young, race) { const n = base.call(this, young, race); if (n) n.persona = this.pickPersona(n); return n; });

  // 관계 상승 속도
  wrap('relGain', function (base, n, b) { const P = this.personaOf(n); const g = base.call(this, n, b); return P ? Math.round(g * P.rel) : g; });
  // 팀 상의 O/X 경향 (council.js 훅)
  wrap('councilOpinion', function (base, n, t, hpR, leaderRel) {
    const r = base.call(this, n, t, hpR, leaderRel); const P = this.personaOf(n);
    if (!P || !P.council) return r;
    const fighty = t === 'fight' || t === 'elite' || t === 'boss';
    const s = r.s + (fighty ? P.council : P.council * 0.3);
    const vote = s >= 0 ? 'O' : 'X';
    if (vote !== r.vote) return { ...r, s, vote, line: `"${this.personaLine(n, vote === 'X' ? 'low' : 'boss', {})}"` };
    return { ...r, s };
  });
  // 통찰(막아서기) 훅
  wrap('insightOf', function (base, n) { const P = this.personaOf(n); return Math.max(0, Math.min(0.95, base.call(this, n) + (P ? P.insight : 0))); });

  // 대사 고르기: 상황 → 유형(30%) → 직업 맛 → 성격. used: 이미 쓴 줄(반복 금지)
  GP.personaLine = function (n, key, vars = {}, used) {
    const P = this.personaOf(n); if (!P) return null;
    const cands = [];
    if ((key === 'idle' || key === 'boss') && n.arch && typeof ARCH !== 'undefined' && ARCH[n.arch] && RNG.chance(0.3)) cands.push(...ARCH[n.arch].talk.map((s) => s.replace(/^"|"$/g, '')));
    if (!cands.length && (key === 'idle' || key === 'start') && CLASS_FLAVOR[n.cls] && RNG.chance(0.35)) cands.push(...CLASS_FLAVOR[n.cls]);
    if (!cands.length) cands.push(...(P[key] || P.idle));
    const pool = used ? cands.filter((s) => !used.has(s)) : cands;
    if (!pool.length) return null;
    let s = RNG.pick(pool); if (used) used.add(s);
    s = s.replace(/\{npc\}/g, vars.npc || '').replace(/\{name\}/g, this.player ? this.player.name : '');
    return s;
  };

  // 관계 대사: 쓰러진 사람과의 관계
  GP.personaRelLine = function (n, other) {
    const p = this.player;
    if (!other) return null;
    if (other.isPlayerRef) {
      if (n.relation >= 70) return `${p.name}!! 안 돼!`;
      if (n.relation <= -10) return `${p.name}, 발 걸리적거리더니.`;
      return null;
    }
    if (n.partner === other.id || n.spouse === other.id) return RNG.pick([`${other.name}!! 나 두고 가지 마!`, `${other.name}, 내가 갈게!`]);
    if (n.master === other.id) return `스승님!!`;
    if (other.master === n.id) return `${other.name}, 내 제자가 이렇게 끝날 리 없어!`;
    if (n.arch === 'rival' || other.arch === 'rival') return `${other.name}, 너한테 질 생각은 있어도 이렇게는 아니야!`;
    const L = this.link ? this.link(n, other) : 0;
    if (L <= -30) return `${other.name}, 또 늦었냐.`;
    if (L >= 50) return `${other.name}!! 버텨!`;
    return null;
  };
}

// ---------- 전투에 연결 ----------
if (typeof Combat !== 'undefined') {
  const CP = Combat.prototype;
  CP.npcOf = function (u) { return u && u.npcId != null && !u.isPlayer ? G.npcById(u.npcId) : null; };
  CP.say = function (u, text) {
    if (!u || !text) return;
    this._said ??= new Set();
    this.push(`${u.name}: "${text}"`, '', { k: 'say', src: u.id, text });
  };
  CP.personaSay = function (u, key, vars, chance = 1) {
    const n = this.npcOf(u); if (!n || !u.alive || Math.random() > chance) return false;
    this._used ??= new Set(); this._spoke ??= {};
    if (this._spoke[u.id] === this.actions) return false; // 한 행동에 한 마디
    const t = G.personaLine(n, key, vars, this._used);
    if (!t) return false;
    this._spoke[u.id] = this.actions;
    this.say(u, t); return true;
  };
  CP.speakers = function () { return this.units.filter((x) => x.side === 'ally' && x.alive && !x.summon && !x.isPlayer && x.npcId != null); };

  // 평소 대사: 기존 16% 무작위 → 성격 idle (반복 금지)
  const baseBark = CP.bark;
  CP.bark = function (u, force) {
    if (!this.npcOf(u) || !PERSONAS) return baseBark.call(this, u, force);
    const P = G.personaOf(this.npcOf(u));
    this.personaSay(u, 'idle', {}, force ? 1 : 0.12 * (P ? P.chat : 1));
  };

  const baseTick = CP.tick;
  CP.tick = function (dt) {
    if (!this._personaStart) {
      this._personaStart = true;
      const sp = this.speakers();
      if (sp.length && !this.spar) {
        const boss = this.units.some((x) => x.side === 'enemy' && x.boss);
        this.personaSay(RNG.pick(sp), boss ? 'boss' : 'start', {}, boss ? 0.9 : 0.35);
      }
    }
    return baseTick.call(this, dt);
  };

  const basePush = CP.push;
  CP.push = function (t, cls, ev) {
    basePush.call(this, t, cls, ev);
    if (!ev || this._inPersona || this.spar) return;
    this._inPersona = true;
    try {
      const src = ev.src && this.units.find((x) => x.id === ev.src);
      const dst = ev.dst && this.units.find((x) => x.id === ev.dst);
      if (ev.k === 'dmg' && src && src.side === 'ally') {
        if (ev.killed) this.personaSay(src, 'kill', {}, dst && dst.boss ? 0.9 : 0.25);
        else if (ev.eff) this.personaSay(src, 'weak', {}, 0.4);
        else if (/저항됨/.test(t || '')) this.personaSay(src, 'resist', {}, 0.4);
      }
      if (ev.k === 'dmg' && dst && dst.side === 'ally' && !ev.killed && dst.hp < dst.maxHp * 0.3) {
        this._low ??= new Set();
        if (!this._low.has(dst.id)) { this._low.add(dst.id); this.personaSay(dst, 'low', {}, 0.6); }
      }
      if (ev.k === 'down' && dst && dst.side === 'ally' && !dst.summon) {
        const sp = this.speakers().filter((x) => x !== dst);
        const s = RNG.pick(sp);
        if (s) {
          const n = this.npcOf(s); const other = dst.isPlayer ? { isPlayerRef: true } : this.npcOf(dst);
          const rl = n && G.personaRelLine(n, other);
          if (rl && Math.random() < 0.85) this.say(s, rl);
          else this.personaSay(s, 'down', { npc: dst.name }, 0.85);
        }
      }
      if (ev.k === 'flee' && src && src.side === 'ally') { /* 탐욕 도주는 기존 대사 */ }
    } finally { this._inPersona = false; }
    // 끝: 승리·도주
    if (this.result && !this._personaEnd && !this._inPersona) {
      this._personaEnd = true; this._inPersona = true;
      try {
        const sp = this.speakers();
        const s = RNG.pick(sp);
        if (s && this.result === 'win') {
          const n = this.npcOf(s); const p = G.player;
          if (n && n.relation >= 70 && Math.random() < 0.35) this.say(s, `역시 ${p.name}.`);
          else if (n && n.relation <= -10 && Math.random() < 0.35) this.say(s, `${p.name}, 발 좀 맞춰.`);
          else this.personaSay(s, 'win', {}, 0.7);
        } else if (s && this.result === 'flee') this.personaSay(s, 'flee', {}, 0.8);
      } finally { this._inPersona = false; }
    }
  };
}

// ---------- 오더 수락·거절 (orders.js 등에서 쓸 수 있는 훅) ----------
Game.prototype.personaOrderLine = function (n, ok) { return this.personaLine(n, ok ? 'orderOk' : 'orderNo') || (ok ? '알겠다.' : '내 방식대로 간다.'); };
for (const P of Object.values(PERSONAS)) {
  P.orderOk ??= { cold: ['…알았다.', '합리적이군.'], warlike: ['좋아, 가자!', '맡겨!'], kind: ['네!', '알겠어요!'], just: ['알겠다!', '명령대로!'], greedy: ['그거 추가 수당이지?', '오케이~'] }[P.base];
  P.orderNo ??= { cold: ['비효율적이다.', '…거절.'], warlike: ['내 방식대로 간다!', '시끄러!'], kind: ['저, 그건 좀…', '무서워요…'], just: ['그건 옳지 않다.', '동의할 수 없다.'], greedy: ['그건 남는 게 없어.', '수당부터 정하고.'] }[P.base];
}

// ---------- 탐색 잡담: 두 동료가 주고받는다 ----------
const CHAT_TOPICS = [
  { id: 'gate', open: () => '이 게이트, 공기가 좀 무겁지 않아?', yes: ['응, 나도 아까부터 소름 돋아.', '조심하자. 느낌이 안 좋아.'], no: ['기분 탓이야.', '겁먹었냐?'] },
  { id: 'money', open: () => '이번 거 끝나면 코어 얼마나 나올까?', yes: ['보스 코어면 한 달 월세는 나오지.', '나눠 가지면 쏠쏠할걸.'], no: ['살아서 나가는 게 먼저야.', '돈 얘기는 나가서 해.'] },
  { id: 'news', open: (g) => { const h = g.headlines ? g.headlines(1)[0] : null; return h ? `들었어? "${h.text.slice(0, 26)}…" 그거.` : '요즘 뉴스 봤어?'; }, yes: ['들었어. 세상 참 시끄럽다.', '그거 진짜래? 무섭네.'], no: ['뉴스는 안 믿어.', '남 일에 관심 없어.'] },
  { id: 'past', open: () => '너는 어쩌다 각성했어?', yes: ['…말하자면 길어. 나중에 술 한잔하면서.', '평범했지. 그날 게이트가 열리기 전까진.'], no: ['그건 묻지 마.', '네가 알아서 뭐 하게.'] },
  { id: 'leader', open: (g) => `우리 리더 ${g.player.name}, 어떻게 생각해?`, yes: ['믿을 만해. 적어도 우릴 버리진 않잖아.', '생각보다 괜찮은 사람이야.'], no: ['아직 모르겠어.', '가끔 무리수를 둬.'] },
  { id: 'love', open: () => '요즘 만나는 사람 있어?', yes: ['…비밀이야. 근데 있긴 해.', '있으면 여기 있겠냐, 하하.'], no: ['그런 거 물어보지 마.', '게이트에서 그런 얘기를 하냐.'] },
  { id: 'rank', open: () => 'S급 되면 제일 먼저 뭐 하고 싶어?', yes: ['부모님 집부터 사 드려야지.', '나 무시하던 놈들한테 측정표 보여 줄 거야.'], no: ['S급? 꿈 깨.', '살아남는 게 먼저야.'] },
  { id: 'food', open: () => '나가면 국밥 먹을래, 치킨 먹을래?', yes: ['국밥이지. 무조건.', '치킨! 오늘은 치킨이야.'], no: ['밥 생각이 나냐 지금?', '아무거나. 빨리 나가기나 하자.'] },
];
{
  const GP = Game.prototype;
  // 층 지도에서 칸을 옮길 때 등: 20%로 잡담. 결과 줄 배열을 돌려준다
  GP.partyChat = function () {
    const ms = this.party().filter((n) => n.alive && !n.child);
    if (ms.length < 2) return null;
    const [a, b] = ms.sort(() => RNG.next() - 0.5);
    const Pa = this.personaOf(a); const Pb = this.personaOf(b);
    const L = this.link ? this.link(a, b) : 0;
    const stage = L >= 50 ? 2 : L >= 15 ? 1 : 0;
    const seen = this.world.chatSeen;
    const topics = CHAT_TOPICS.filter((t) => !seen[`${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}-${t.id}-${stage}`]);
    const T = RNG.pick(topics.length ? topics : CHAT_TOPICS);
    seen[`${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}-${T.id}-${stage}`] = 1;
    const agree = RNG.chance(0.5 + L / 200 + (Pb.rel - 1) * 0.5);
    const lines = [
      `${a.name}: "${T.open(this, a)}"`,
      `${b.name}: "${RNG.pick(agree ? T.yes : T.no)}"`,
    ];
    if (Pa.chat >= 1.2 && RNG.chance(0.6)) lines.push(`${a.name}: "${this.personaLine(a, 'idle')}"`);
    if (this.addLink) this.addLink(a, b, agree ? RNG.int(1, 3) : -RNG.int(1, 2));
    return lines;
  };
}

if (typeof UI !== 'undefined') {
  // 겹치지 않는 말풍선 띠: 순서대로 떴다 사라진다(조작을 막지 않음)
  UI.chatterShow = function (lines) {
    if (!lines || !lines.length || typeof document === 'undefined') return;
    let el = document.getElementById('party-chatter');
    if (!el) {
      el = document.createElement('div'); el.id = 'party-chatter';
      el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:96px;z-index:60;pointer-events:none;display:flex;flex-direction:column;gap:4px;align-items:flex-start';
      document.body.appendChild(el);
    }
    lines.forEach((t, i) => setTimeout(() => {
      const b = document.createElement('div');
      b.textContent = fixJosa(t);
      b.style.cssText = 'background:rgba(16,20,30,.92);color:#e8ecf4;border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:6px 10px;font-size:13px;max-width:92%;transition:opacity .4s';
      el.appendChild(b);
      setTimeout(() => { b.style.opacity = '0'; setTimeout(() => b.remove(), 450); }, 3200);
    }, i * 1300));
  };
  // 층 지도 이동에 연결 (있는 함수만 감싼다)
  for (const k of ['enterNode', 'gateRest']) {
    if (typeof UI[k] !== 'function') continue;
    const base = UI[k];
    UI[k] = function (...a) { const r = base.apply(this, a); if (Math.random() < 0.2) { const ls = G.partyChat(); if (ls) this.chatterShow(ls); } return r; };
  }
  // NPC 카드: 성격 표시와 마을 한 줄
  const baseCard = UI.npcCard;
  if (baseCard) UI.npcCard = function (n, here) {
    let html = baseCard.call(this, n, here);
    if (!n || n.child || !n.alive || !(n.met || here)) return html;
    const P = G.personaOf(n); if (!P) return html;
    let mood = '';
    if (here && n.met) {
      if (n.hurt > 0 && n.hurt < 99) mood = P.low[0];
      else mood = G.personaLine(n, 'town');
    }
    const line = `<div class="small dim">성격 <b>${P.name}</b>${mood ? ` · "${mood}"` : ''}</div>`;
    const at = html.indexOf('<div class="rel-line">');
    return at >= 0 ? html.slice(0, at) + line + html.slice(at) : html;
  };
}
