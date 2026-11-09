// ===== 게이트 크로니클: 지역 고유 사건 =====
// 도시마다 그곳에서만 벌어지는 일. 처음 들어간 도시에서는 그 지역 사건 하나가 보장된다.
// (부산 항구·암시장, 대전 연구소, 강릉 해안, 대구 분지, 울산 중공업, 광주 자유 도시, 전주 보존 구역, 인천 관리국, 수원 공장, 강남 돔, 강북 폐구, 제주 격리 섬)

const REG_EV = (region, ev) => S({ region, city: true, regional: true, ...ev });

// ---------- 서울 강남 돔 ----------
REG_EV('gangnam', { id: 'rg_gangnam_gala', minRank: 2, text: '강남 돔 최상층 호텔에서 길드 후원의 밤이 열린다. 초대장 없이 들어온 당신에게 백호 시큐리티 경호원이 길을 막는다. 그때 안쪽에서 누군가 손짓한다. "그분은 제 손님입니다."',
  choices: [
    { text: '들어가서 인맥을 쌓는다', do: (g) => '명함 열두 장이 생겼다. 그중 세 장은 쓸 데가 있을 것 같다.' + g.gain({ fame: 4, money: 200 }) },
    { text: '손짓한 사람이 누군지만 확인하고 나온다', do: (g) => '관리국 차장이었다. 무슨 뜻인지는 나중에 알게 될 것이다.' + g.gain({ merit: 4 }) },
  ] });
REG_EV('gangnam', { id: 'rg_gangnam_dome', text: '돔 외벽 결계에 금이 갔다는 경보. 시민들은 태연하게 쇼핑을 계속한다. "어차피 백호가 막겠지." 백호 경비대는 아직 도착 전이다.',
  choices: [
    { text: '결계 틈으로 들어오는 괴수를 막는다', do: (g) => { g.storyFight({ title: '돔 결계 틈', mobs: { tier: Math.max(0, g.player.rankIdx), n: 2 }, win: { text: '경비대가 도착했을 땐 이미 끝나 있었다. 백호 쪽에서 감사장이 왔다.', gain: { rep: 8, fame: 3 } } }); return '쇼핑백을 든 사람들 사이를 뚫고 달렸다.'; } },
    { text: '시민들부터 대피시킨다', do: (g) => '"과민 반응 아니에요?" 투덜대던 사람들도 금이 커지자 뛰기 시작했다.' + g.gain({ rep: 5 }) },
  ] });
REG_EV('gangnam', { id: 'rg_gangnam_academy', maxRank: 3, text: '"상위 1% 각성자 사교육 — 등급 상승 보장반." 강남 학원가 전광판이다. 상담실장이 당신 등급을 보고 웃는다. "강사로 오시면 시급 50만 원."',
  choices: [
    { text: '주말 강사를 한다', do: (g) => { g.advanceDays(8, { noSave: true }); return '부잣집 아이들에게 에테르 호흡을 가르쳤다. 하나는 진짜 재능이 있었다.' + g.gain({ money: 400, fame: 1 }); } },
    { text: '"등급은 돈으로 안 올라요."', do: () => '상담실장의 웃음이 굳었다.' },
  ] });

// ---------- 서울 강북 폐구 ----------
REG_EV('gangbuk', { id: 'rg_gangbuk_school', text: '폐구 한가운데 버려진 초등학교. 칠판에 20년 전 날짜와 "내일 소풍"이라는 글씨가 그대로 있다. 운동장 한복판에 작은 게이트가 숨 쉬듯 깜빡인다.',
  choices: [
    { text: '게이트를 닫는다', do: (g) => { g.storyFight({ title: '폐교 게이트', mobs: { tier: g.player.rankIdx, n: 3, elem: 'dark' }, win: { text: '게이트가 닫히자 교실 창문 너머로 바람이 한 번 불었다. 칠판 글씨가 조금 지워져 있었다.', gain: { ether: 40, rep: 4 } } }); return '운동장으로 들어섰다.'; } },
    { text: '칠판 사진만 찍고 나온다', do: (g) => '그 사진은 대붕괴 추모 게시판에 올라갔고, 많은 사람이 댓글로 그날을 이야기했다.' + g.gain({ fame: 2 }) },
  ] });
REG_EV('gangbuk', { id: 'rg_gangbuk_squatters', text: '폐구에 사람이 산다. 등록되지 않은 각성자와 갈 곳 없는 사람들이 지하상가에 마을을 만들었다. 촌장 격 노인이 묻는다. "관리국에서 왔소?"',
  choices: [
    { text: '"아뇨. 그냥 지나가는 헌터입니다."', do: (g) => '노인이 따뜻한 보리차를 내줬다. 떠날 때 아이들이 손을 흔들었다.' + g.gain({ hp: 0.4, rep: 3 }) },
    { text: '의약품을 두고 간다', when: (g) => (g.player.items.potion || 0) > 0, do: (g) => { g.player.items.potion--; return '노인이 오래 고개를 숙였다. "이 은혜는 언젠가."' + g.gain({ rep: 8, fame: 2 }); } },
  ] });
REG_EV('gangbuk', { id: 'rg_gangbuk_scavenger', text: '고철을 줍던 소년이 뛰어온다. "헌터 형/누나! 저기 무너진 은행 금고에서 이상한 소리가 나요!"',
  choices: [
    { text: '같이 가 본다', do: (g) => g.roll(0.5) ? '금고 안에 대붕괴 이전 유물이 잠들어 있었다. 소년과 반씩 나눴다.' + g.gain({ relic: 1, rep: 3 }) : '괴수 둥지였다. 소년을 업고 뛰었다.' + g.gain({ hp: -0.2, rep: 4 }) },
    { text: '소년에게 위험하니 가지 말라고 한다', do: () => '소년은 입을 삐죽였지만 고개를 끄덕였다.' },
  ] });

// ---------- 인천 항만 특구 ----------
REG_EV('incheon', { id: 'rg_incheon_customs', text: '항만 세관 창고. 관리국 직원이 컨테이너 하나를 열지 못해 쩔쩔맨다. "안에서 뭔가 긁는 소리가 나요. 서류엔 \'건조 해산물\'이라고 돼 있는데."',
  choices: [
    { text: '대신 연다', do: (g) => { g.storyFight({ title: '밀수 컨테이너', mobs: { tier: g.player.rankIdx, n: 2, elem: 'water' }, win: { text: '밀수된 괴수 유체였다. 관리국 직원이 보고서에 당신 이름을 적었다.', gain: { merit: 8, money: 150 } } }); return '자물쇠를 뜯었다.'; } },
    { text: '진압팀을 부르라고 조언한다', do: (g) => '직원이 고맙다며 커피를 샀다.' + g.gain({ merit: 2 }) },
  ] });
REG_EV('incheon', { id: 'rg_incheon_hq', minRank: 2, text: '관리국 본청 민원실. 번호표 512번. 앞사람이 하소연한다. "각성 피해 보상 신청한 지 3년째예요." 창구 직원의 눈이 퀭하다.',
  choices: [
    { text: '앞사람 서류를 같이 봐 준다', do: (g) => '빠진 서류 한 장을 찾아냈다. 앞사람이 눈물을 글썽였다.' + g.gain({ rep: 5, merit: 2 }) },
    { text: '각성자 전용 창구로 간다', do: (g) => '5분 만에 업무를 마쳤다. 등 뒤의 시선이 따가웠다.' + g.gain({ fame: -1 }) },
  ] });
REG_EV('incheon', { id: 'rg_incheon_ferry', text: '섬으로 가는 마지막 여객선. 선장이 바다를 보며 담배를 문다. "요즘 저 바다 밑에서 큰 놈이 움직여. 오늘은 각성자 한 명쯤 타 줬으면 좋겠는데."',
  choices: [
    { text: '여객선에 오른다', do: (g) => { g.advanceDays(2, { noSave: true }); return g.roll(0.6) ? '거대한 그림자가 배 밑을 지나갔지만, 당신이 뱃전에 서 있는 걸 보고 물러났다. 선장이 술을 샀다.' + g.gain({ money: 120, rep: 5 }) : '촉수가 갑판을 덮쳤다. 겨우 떼어 냈다.' + g.gain({ money: 120, hp: -0.3, rep: 8, fame: 3 }); } },
    { text: '다음 기회로 미룬다', do: () => '여객선이 수평선 너머로 사라졌다.' },
  ] });

// ---------- 강릉 해안 전선 ----------
REG_EV('gangneung', { id: 'rg_gangneung_watch', text: '해안 전선 초소. 야간 경계를 서던 병사가 졸다가 당신을 보고 화들짝 놀란다. "헌터님, 딱 두 시간만 대신 서 주시면 안 될까요? 사흘째 못 잤습니다."',
  choices: [
    { text: '대신 서 준다', do: (g) => g.roll(0.7) ? '새벽 바다는 조용했다. 일출이 수평선을 찢고 올라왔다.' + g.gain({ ether: 25, rep: 4 }) : '새벽 4시, 파도 사이로 무언가 올라왔다. 혼자 막아 냈다.' + g.gain({ ether: 30, rep: 8, fame: 2, hp: -0.2 }) },
    { text: '커피를 사다 준다', do: (g) => '"살았습니다." 병사가 경례를 했다.' + g.gain({ rep: 2 }) },
  ] });
REG_EV('gangneung', { id: 'rg_gangneung_fisher', text: '어촌 할머니가 그물을 손질하며 말한다. "우리 영감이 대붕괴 날 바다에 나갔다가 안 돌아왔어. 근데 요즘 밤마다 그 양반 노랫소리가 바다에서 들려."',
  choices: [
    { text: '밤바다에 나가 본다', do: (g) => g.roll(0.5) ? '노랫소리의 정체는 사람 목소리를 흉내 내는 심해 괴수였다. 처치하고 돌아오자 할머니는 한참 말이 없었다. "…그래도 고맙네."' + g.gain({ ether: 35, rep: 6 }) : '노랫소리는 파도 속으로 사라졌다. 정체는 끝내 알 수 없었다.' + g.gain({ ether: 10 }) },
    { text: '할머니 곁에서 노래를 같이 듣는다', do: (g) => '정말로 희미한 노랫소리가 들렸다. 할머니가 따라 불렀다.' + g.gain({ hp: 0.5 }) },
  ] });
REG_EV('gangneung', { id: 'rg_gangneung_deserter', minRank: 1, text: '해안 전선 근무를 버리고 도망친 각성자가 버스 정류장에 숨어 있다. "다시는 못 가요. 동기가 눈앞에서 바다로 끌려갔어요."',
  choices: [
    { text: '부대에 데려다주며 변호한다', do: (g) => '지휘관은 처벌 대신 후방 배치로 돌렸다. 그 각성자가 당신 손을 꽉 잡았다.' + g.gain({ merit: 5, rep: 4 }) },
    { text: '못 본 척 차비를 쥐여 준다', do: (g) => '버스가 떠났다. 옳은 일이었는지는 모르겠다.' + g.gain({ money: -30, merit: -2 }) },
  ] });

// ---------- 수원 산업 벨트 ----------
REG_EV('suwon', { id: 'rg_suwon_strike', text: '장비 공장 앞에서 파업 중이다. "각성자 전용 라인만 수당 세 배!" 비각성 노동자들의 피켓. 공장장은 당신에게 "질서 유지" 의뢰를 내밀었다.',
  choices: [
    { text: '의뢰를 거절하고 양쪽 이야기를 듣는다', do: (g) => '사흘 뒤 협상 테이블이 열렸다. 노동자 대표가 당신에게 고맙다고 했다.' + g.gain({ rep: 6 }) },
    { text: '의뢰를 받는다', do: (g) => '아무도 다치지 않았지만, 피켓 사이로 당신 사진이 돌았다.' + g.gain({ money: 300, rep: -6 }) },
  ] });
REG_EV('suwon', { id: 'rg_suwon_prototype', minRank: 1, text: '연구 개발팀이 시제품 테스트 요원을 구한다. "에테르 증폭 건틀릿 시제 3호. 1호와 2호 테스터는… 지금 휴가 중입니다."',
  choices: [
    { text: '테스트에 응한다', do: (g) => g.roll(0.6) ? '건틀릿이 정확히 설계대로 작동했다. 개발팀이 시제품을 선물했다.' + g.gain({ equip: true, money: 100 }) : '건틀릿이 폭발했다. 4호 테스터를 구해야 할 것 같다.' + g.gain({ money: 400, injure: 1 }) },
    { text: '1·2호 테스터의 진짜 행방을 묻는다', do: () => '개발팀장이 시선을 피했다.' },
  ] });
REG_EV('suwon', { id: 'rg_suwon_fortress', text: '화성 성곽 위에서 야간 순찰을 도는 노인 헌터를 만났다. "이 성은 대붕괴 때도 안 무너졌어. 옛날 사람들이 쌓은 돌에 뭔가 있지."',
  choices: [
    { text: '같이 성곽을 돈다', do: (g) => '돌 틈마다 희미한 에테르가 흘렀다. 옛 결계의 흔적이었다.' + g.gain({ ether: 30 }) },
    { text: '노인의 옛 이야기를 청한다', do: (g) => '1세대 헌터들의 이야기가 새벽까지 이어졌다.' + g.gain({ hp: 0.3, fame: 1 }) },
  ] });

// ---------- 대전 연구 도시 ----------
REG_EV('daejeon', { id: 'rg_daejeon_subject', text: '청룡 연구소 정문에 "임상 시험 참여자 모집 · 에테르 순환 개선제 · 사례비 300만 원" 공고가 붙어 있다. 줄 선 사람들 대부분이 F급이다.',
  choices: [
    { text: '참여한다', do: (g) => g.roll(0.55) ? '부작용 없이 끝났다. 에테르가 조금 더 잘 돈다.' + g.gain({ money: 300, ether: 40 }) : '사흘 동안 열이 났다. 사례비는 받았다.' + g.gain({ money: 300, hp: -0.4 }) },
    { text: '줄 선 사람들에게 동의서를 꼼꼼히 읽으라고 말해 준다', do: (g) => '연구원이 당신을 노려봤다. 몇 사람이 줄을 떠났다.' + g.gain({ rep: 3 }) },
  ] });
REG_EV('daejeon', { id: 'rg_daejeon_library', text: '연구 도시 공공 아카이브의 사서가 속삭인다. "열람 제한 구역에 대붕괴 직전 실험 기록이 있어요. 등급 C 이상이면 신청할 수 있는데… 서류가 좀 많아요."',
  choices: [
    { text: '정식으로 신청한다', do: (g) => { g.advanceDays(6, { noSave: true }); return '엿새 동안 서류와 씨름한 끝에 몇 장을 읽었다. 이해한 건 절반이지만, 그 절반이 중요했다.' + g.gain({ ether: 25, merit: 3 }); } },
    { text: '공개 자료만 읽는다', do: (g) => '공개 자료에도 배울 건 많았다.' + g.gain({ ether: 10 }) },
  ] });
REG_EV('daejeon', { id: 'rg_daejeon_ai', minRank: 2, text: '연구 단지 무인 경비 로봇이 오작동해 당신을 침입자로 인식했다. 경고음과 함께 테이저가 겨눠진다. 뒤쪽 건물에서 연구원들이 당황해 손을 흔든다.',
  choices: [
    { text: '로봇을 제압한다', do: (g) => { g.storyFight({ title: '오작동 경비 로봇', mobs: { tier: g.player.rankIdx, n: 2, shape: 'golem', elem: 'bolt' }, win: { text: '연구원들이 로봇 대신 당신을 데이터로 기록하고 싶어 했다. 사례비가 나왔다.', gain: { money: 250, merit: 3 } } }); return '테이저가 발사됐다.'; } },
    { text: '두 손을 들고 기다린다', do: (g) => '연구원이 달려와 리셋했다. 사과의 뜻으로 연구소 매점 쿠폰을 받았다.' + g.gain({ hp: 0.2 }) },
  ] });

// ---------- 대구 분지 요새 ----------
REG_EV('daegu', { id: 'rg_daegu_heatwave', text: '분지에 열이 고였다. 기온 41도, 에테르 농도 경보. 노인정 에어컨이 고장 났다는 신고가 들어왔는데, 수리 기사는 사흘 뒤에나 온단다.',
  choices: [
    { text: '냉기로 버텨 준다', when: (g) => g.player.element === 'water', do: (g) => '노인정 어르신들이 당신 손을 잡고 놓아주지 않았다.' + g.gain({ rep: 10, fame: 2 }) },
    { text: '근처 무더위 쉼터로 어르신들을 모신다', do: (g) => '하루 종일 차를 몰았다. 땀이 비 오듯 했다.' + g.gain({ rep: 6, hp: -0.2 }) },
    { text: '협회에 신고만 한다', do: (g) => '협회는 "검토하겠다"고 했다.' + g.gain({ rep: 1 }) },
  ] });
REG_EV('daegu', { id: 'rg_daegu_market', text: '서문시장 골목 깊숙한 곳. 대붕괴 이전부터 했다는 칼국숫집 할머니가 당신의 무기를 보더니 혀를 찬다. "그 칼, 날이 울고 있네. 우리 영감한테 가 봐."',
  choices: [
    { text: '할아버지 대장간을 찾아간다', do: (g) => '옛 방식으로 날을 세워 줬다. 돈은 칼국수 한 그릇값만 받았다. 무기를 쥐는 손이 한결 가벼웠다.' + g.gain({ money: -10, ether: 25 }) },
    { text: '칼국수만 먹고 간다', do: (g) => '국물이 진했다.' + g.gain({ hp: 0.4 }) },
  ] });
REG_EV('daegu', { id: 'rg_daegu_overflow', minRank: 1, text: '분지 바닥의 에테르 웅덩이가 넘치기 직전이다. 근처 주민들은 익숙한 듯 창문을 닫는다. 넘치면 일대에 괴수가 쏟아진다.',
  choices: [
    { text: '웅덩이의 에테르를 흡수해 낮춘다', do: (g) => g.roll(0.6) ? '몸이 터질 것 같았지만 버텼다. 웅덩이가 잠잠해졌다.' + g.gain({ ether: 70, rep: 6 }) : '에테르가 역류했다. 그래도 웅덩이는 낮아졌다.' + g.gain({ ether: 40, hp: -0.5, rep: 6 }) },
    { text: '주민들과 방벽을 쌓는다', do: (g) => '넘친 괴수들이 방벽 앞에서 막혔다.' + g.gain({ rep: 8 }) },
  ] });

// ---------- 울산 중공업 지대 ----------
REG_EV('ulsan', { id: 'rg_ulsan_shipyard', text: '현무 중공업 조선소. 건조 중인 대괴수 방어함의 동력로가 불안정하다. 엔지니어가 당신을 붙잡는다. "에테르 계열 각성자시죠? 동력로 안정화 좀 도와주세요. 5분이면 됩니다."',
  choices: [
    { text: '동력로에 손을 얹는다', do: (g) => g.roll(0.65) ? '5분이 50분이 됐지만 안정됐다. 함선 명판 아래 협력자 명단에 당신 이름이 새겨졌다.' + g.gain({ money: 350, fame: 3 }) : '동력로가 튀었다. 손이 얼얼하다. 그래도 안정은 됐다.' + g.gain({ money: 350, hp: -0.3 }) },
    { text: '"5분이라는 말은 못 믿겠네요."', do: () => '엔지니어가 웃었다. "다들 그러더라고요."' },
  ] });
REG_EV('ulsan', { id: 'rg_ulsan_workers', text: '공단 식당. 현무 각성자단 정규직과 하청 각성자가 같은 줄에 서 있는데 식권 색이 다르다. 하청 쪽 청년이 자기 식판을 내려다본다.',
  choices: [
    { text: '청년 옆에 앉아 같이 먹는다', do: (g) => '청년이 하청 현장 이야기를 들려줬다. 위험수당은 정규직의 3분의 1이었다.' + g.gain({ rep: 4 }) },
    { text: '식당 운영팀에 따진다', do: (g) => '다음 주부터 식권 색이 하나로 바뀌었다. 현무 쪽은 당신을 곱게 보지 않았다.' + g.gain({ rep: 8, fame: 2 }) },
  ] });
REG_EV('ulsan', { id: 'rg_ulsan_rock', text: '대왕암 해안 바위에 오래된 비석이 있다. "바다의 용이 이 땅을 지킨다." 최근 그 비석 주위로 바닷물이 이상하게 소용돌이친다.',
  choices: [
    { text: '소용돌이 가운데로 에테르를 흘려 본다', do: (g) => g.roll(0.4) ? '바닷속에서 무언가가 응답했다. 따뜻한 기운이 몸에 스며들었다.' + g.gain({ ether: 50 }) : '아무 일도 없었다. 바닷바람만 셌다.' + g.gain({ ether: 5 }) },
    { text: '비석 탁본을 떠 간다', do: (g) => '대전 연구소에 보냈더니 고대 결계 문양이라는 답이 왔다.' + g.gain({ merit: 3 }) },
  ] });

// ---------- 광주 자유 도시 ----------
REG_EV('gwangju', { id: 'rg_gwangju_assembly', text: '금남로 광장에서 프리랜서 헌터 총회가 열린다. 안건: "대형 길드의 의뢰 독점에 맞선 공동 단가표." 누구든 발언할 수 있다.',
  choices: [
    { text: '발언대에 선다', do: (g) => g.roll(0.6) ? '박수가 터졌다. 공동 단가표에 당신 제안이 들어갔다.' + g.gain({ fame: 5, rep: 6 }) : '야유도 섞였지만, 끝까지 들어 준 사람들이 있었다.' + g.gain({ rep: 3 }) },
    { text: '조용히 투표만 한다', do: (g) => '안건은 근소한 차로 통과됐다.' + g.gain({ rep: 2 }) },
  ] });
REG_EV('gwangju', { id: 'rg_gwangju_nightmarket', text: '야시장 한쪽, 괴수 꼬치를 굽는 노점. "강원산 비늘 멧돼지 꼬치! 각성자 체질 개선!" 냄새가 기가 막힌다. 가격표가 수상하게 싸다.',
  choices: [
    { text: '하나 사 먹는다', do: (g) => g.roll(0.7) ? '맛있었다. 정말로 몸이 조금 가벼워졌다.' + g.gain({ money: -10, hp: 0.3, ether: 5 }) : '밤새 배앓이를 했다.' + g.gain({ money: -10, hp: -0.3 }) },
    { text: '원산지를 묻는다', do: () => '사장이 활짝 웃었다. "그건 영업 비밀이고!"' },
  ] });
REG_EV('gwangju', { id: 'rg_gwangju_mural', text: '골목 벽에 헌터 벽화를 그리는 화가가 있다. 대붕괴 때 시민을 지키다 쓰러진 무명 헌터들이다. "얼굴을 모르는 사람이 많아서, 지금 헌터들 얼굴을 빌리고 있어요. 모델 좀 서 줄래요?"',
  choices: [
    { text: '모델이 되어 준다', do: (g) => '반나절 동안 가만히 서 있었다. 완성된 벽화 속 무명 헌터의 눈이 당신을 닮았다.' + g.gain({ fame: 3, rep: 5 }) },
    { text: '물감값을 보탠다', do: (g) => '화가가 벽화 구석에 작은 글씨로 당신 이름을 적었다.' + g.gain({ money: -100, rep: 4 }) },
  ] });

// ---------- 전주 보존 구역 ----------
REG_EV('jeonju', { id: 'rg_jeonju_healer', text: '한옥마을 골목 끝, 치유 계열 각성자 할머니가 무료 진료소를 연다. 대기 줄이 골목 밖까지 이어졌다. 할머니가 당신을 보고 손짓한다. "헌터 양반, 부축 좀 도와줘."',
  choices: [
    { text: '하루 종일 돕는다', do: (g) => { g.advanceDays(1, { noSave: true }); return '해 질 녘, 할머니가 당신 손을 잡고 에테르를 흘려 넣었다. 오래된 피로가 녹았다.' + g.gain({ hp: 1, rep: 6, ether: 10 }); } },
    { text: '진료비 상자에 돈을 넣고 간다', do: (g) => '할머니가 등 뒤에서 "복 받을 거야" 했다.' + g.gain({ money: -80, rep: 3 }) },
  ] });
REG_EV('jeonju', { id: 'rg_jeonju_hanji', text: '한지 공방 장인이 에테르를 머금은 한지를 만든다. "부적 쓰는 사람들이 이걸 찾아요. 근데 재료 닥나무가 숲 게이트 근처에만 자라서…"',
  choices: [
    { text: '닥나무를 구해 온다', do: (g) => { g.storyFight({ title: '숲 게이트 언저리', mobs: { tier: g.player.rankIdx, n: 2, elem: 'wood' }, win: { text: '장인이 첫 장을 떠서 건넸다. 손에 쥐자 따뜻했다.', gain: { money: 150, ether: 30, rep: 4 } } }); return '숲으로 향했다.'; } },
    { text: '한지 한 장을 산다', do: (g) => '얇은데 이상하게 무겁다. 품에 넣었다.' + g.gain({ money: -60, ether: 10 }) },
  ] });
REG_EV('jeonju', { id: 'rg_jeonju_festival', text: '보존 구역의 등불 축제. 대붕괴로 잃은 사람의 이름을 등에 적어 강물에 띄운다. 옆에 선 아이가 등에 "아빠"라고만 쓰고 있다.',
  choices: [
    { text: '아이와 함께 등을 띄운다', do: (g) => '수백 개의 등이 강을 따라 흘렀다. 아이가 당신 손을 잡았다.' + g.gain({ hp: 0.5, rep: 4 }) },
    { text: '잃은 사람의 이름을 적는다', do: (g) => { const dead = g.npcs.filter((n) => !n.alive && n.met && n.relation >= 30); return (dead.length ? `${RNG.pick(dead).name}의 이름을 적었다.` : '대붕괴로 잃은 얼굴 모를 이웃들을 위해 적었다.') + ' 등이 멀어질 때까지 지켜봤다.' + g.gain({ ether: 15 }); } },
  ] });

// ---------- 부산 해상 도시 ----------
REG_EV('busan', { id: 'rg_busan_float', text: '해상 도시의 부유 구획 하나가 연결부가 끊어져 떠내려가고 있다. 그 위에 아직 사람들이 있다. 해경 보트는 파도 때문에 접근을 못 한다.',
  choices: [
    { text: '연결부를 붙잡는다', do: (g) => g.roll(0.5 + g.player.rankIdx * 0.06) ? '팔이 끊어질 것 같았지만 버텼다. 구획이 다시 묶였다. 뉴스 헬기가 그 장면을 잡았다.' + g.gain({ fame: 10, rep: 10, hp: -0.3 }) : '구획은 떠내려갔지만, 사람들은 전부 옮겨 태웠다.' + g.gain({ fame: 4, rep: 8, hp: -0.4 }) },
    { text: '보트를 몰고 사람들부터 옮긴다', do: (g) => '세 번을 왕복했다. 마지막 사람은 구획이 기울기 직전에 건졌다.' + g.gain({ rep: 8, fame: 3 }) },
  ] });
REG_EV('busan', { id: 'rg_busan_fishmarket', text: '자갈치 새벽 경매장. 경매사가 은빛 비늘의 괴수 생선을 들어 올린다. "심해 2층산! 에테르 함량 최상!" 경매가가 미친 듯이 오른다.',
  choices: [
    { text: '입찰에 끼어든다', do: (g) => g.roll(0.4) ? '낙찰. 회로 먹었더니 온몸에 에테르가 돌았다.' + g.gain({ money: -300, ether: 60 }) : '옆의 요리사에게 밀렸다. 대신 그 요리사가 꼬리 부분을 나눠 줬다.' + g.gain({ ether: 10 }) },
    { text: '경매장 경비를 선다', do: (g) => '새벽 경매장은 소매치기 천국이었다. 셋을 잡았다.' + g.gain({ money: 120, rep: 4 }) },
  ] });
REG_EV('busan', { id: 'rg_busan_lighthouse', minRank: 1, text: '해상 도시 끝의 등대가 사흘째 꺼져 있다. 등대지기는 연락 두절. 밤바다 어선들이 길을 잃고 있다.',
  choices: [
    { text: '등대에 올라간다', do: (g) => { g.storyFight({ title: '꺼진 등대', mobs: { tier: g.player.rankIdx, n: 2, elem: 'water' }, win: { text: '등대 꼭대기에 둥지를 튼 괴수를 몰아냈다. 등대지기는 창고에 갇혀 있었다. 불이 다시 켜졌다.', gain: { rep: 8, money: 200 } } }); return '나선 계단을 올랐다.'; } },
    { text: '해경에 알린다', do: (g) => '해경은 이틀 뒤에 왔다.' + g.gain({ rep: 1 }) },
  ] });

// ---------- 제주 격리 섬 ----------
REG_EV('jeju', { id: 'rg_jeju_village', text: '격리 섬 안쪽, 대붕괴 이후 한 번도 떠나지 않은 사람들의 마을이 있다. 해녀 할머니가 당신을 보고 놀란다. "밖에서 사람이 오다니. 육지는 아직 있소?"',
  choices: [
    { text: '육지 소식을 전해 준다', do: (g) => '할머니가 한참을 울다 웃었다. 마을 사람들이 귤을 한 바구니 안겼다.' + g.gain({ hp: 1, rep: 10 }) },
    { text: '섬의 그날 이야기를 청한다', do: (g) => '할머니의 이야기는 관리국 기록과 많이 달랐다.' + g.gain({ ether: 40, merit: -3 }) },
  ] });
REG_EV('jeju', { id: 'rg_jeju_oreum', text: '오름 능선 위로 무지갯빛 에테르 안개가 흐른다. 이곳 에테르는 육지와 결이 다르다. 오래 머물면 강해지거나, 미쳐 버린다고 한다.',
  choices: [
    { text: '하룻밤 명상한다', do: (g) => g.roll(0.65) ? '새벽에 눈을 떴을 때, 세상의 결이 조금 다르게 보였다.' + g.gain({ ether: 120 }) : '환청이 들렸다. 서둘러 내려왔다.' + g.gain({ ether: 50, hp: -0.4 }) },
    { text: '멀리서 바라보기만 한다', do: (g) => '아름다웠다. 그걸로 충분했다.' + g.gain({ hp: 0.3 }) },
  ] });

// ---------- 처음 들어간 도시: 지역 사건 하나 보장 ----------
(() => {
  const P = Game.prototype;
  const baseVisit = P.visitCity;
  P.visitCity = function (id) {
    const first = !(this.player.visited || []).includes(id);
    const r = baseVisit.call(this, id);
    if (first && this.player.rankRevealed !== false) {
      const cands = STORY.filter((ev) => ev.regional && ev.region === id && !this.flags.seen[ev.id] && this.storyEligible(ev, {}));
      if (cands.length && !this.queue.some((q) => q.type === 'story' && /^rg_/.test(q.id))) this.queue.push({ type: 'story', id: RNG.pick(cands).id });
    }
    return r;
  };
})();
