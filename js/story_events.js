// ===== 게이트 크로니클: 단발 사건 =====
// 각 사건은 조건이 맞을 때 시간의 흐름 속에서 무작위로 일어난다.

// 기존 기본 사건 편입
for (const e of EVENTS) S({ id: 'base_' + e.id, text: e.text, when: e.when ? (g) => e.when(g) : null, choices: e.choices.map((ch) => ({ text: ch.text, do: (g) => ch.effect(g) })) });

// ---------- 거리와 도시 ----------
S({ id: 'street_busker', city: true, text: '광장에서 버스킹하는 소녀의 노래에 에테르가 섞여 있다. 듣는 사람들의 표정이 편안해진다. 미등록 각성자가 분명하다.',
  choices: [
    { text: '협회 등록을 권한다', do: (g) => '소녀는 망설이다 명함을 받았다. 몇 달 뒤, 그녀가 E급으로 등록됐다는 소식을 들었다.' + g.gain({ fame: 2, merit: 3 }) },
    { text: '조용히 노래를 듣고 떠난다', do: (g) => '마음이 한결 가벼워졌다.' + g.gain({ hp: 0.3 }) },
    { text: '신고 포상금을 받는다', do: (g) => '소녀는 관리국 요원에게 끌려갔다. 씁쓸한 포상금이 입금됐다.' + g.gain({ money: 120, fame: -3 }) },
  ] });
S({ id: 'street_pickpocket', city: true, text: '누군가 등 뒤에서 지갑을 노린다. 손놀림이 비정상적으로 빠르다. 속도 계열 각성자다.',
  choices: [
    { text: '손목을 낚아챈다', do: (g) => g.roll(0.45 + g.player.spd / 120) ? '손목을 잡았다. 소매치기는 열여섯 살 남짓한 소년이었다. 배가 고팠다고 한다.' + g.gain({ fame: 1 }) : '놓쳤다. 지갑이 가벼워졌다.' + g.gain({ money: -60 }) },
    { text: '모른 척 지갑을 내준다', do: (g) => '소년은 놀란 눈으로 당신을 보고 사라졌다. 며칠 뒤 문 앞에 작은 코어 하나가 놓여 있었다.' + g.gain({ money: -40, core: [0, 1] }) },
  ] });
S({ id: 'street_protest', city: true, text: '"각성자 특권 폐지!" 시청 앞에서 비각성자 시위대가 행진하고 있다. 누군가 당신을 알아보고 손가락질한다.',
  choices: [
    { text: '확성기를 빌려 대화를 청한다', do: (g) => g.roll(0.5) ? '야유가 쏟아졌지만, 끝까지 들어 준 사람도 있었다. 다음 날 기사에 사진이 실렸다.' + g.gain({ fame: 6, rep: 4 }) : '물병이 날아왔다. 대화는 실패였다.' + g.gain({ fame: -2 }) },
    { text: '조용히 자리를 피한다', do: () => '구호 소리가 한참 동안 등 뒤를 따라왔다.' },
    { text: '위압감으로 해산시킨다', do: (g) => '에테르를 살짝 풀자 시위대가 흩어졌다. 그 영상은 하루 만에 백만 뷰를 찍었다.' + g.gain({ fame: -8, rep: -6 }) },
  ] });
S({ id: 'street_food', city: true, text: '골목 끝 떡볶이 포장마차. 사장님이 "헌터 양반이네, 오늘은 서비스!"라며 어묵을 잔뜩 얹어 준다.',
  choices: [
    { text: '감사히 먹는다', do: (g) => '대붕괴 전부터 장사했다는 사장님의 이야기를 들었다. 배도 마음도 든든하다.' + g.gain({ hp: 0.25, rep: 2 }) },
    { text: '돈을 넉넉히 놓고 간다', do: (g) => '"이러면 내가 미안하지!" 사장님은 동네 사람들에게 당신 자랑을 했다.' + g.gain({ money: -15, rep: 5 }) },
  ] });
S({ id: 'street_kid_fan', city: true, minRank: 2, text: '꼬마 하나가 수첩을 내밀며 사인을 해 달라고 한다. "저도 커서 헌터 될 거예요!" 엄마는 어딘가 불안한 얼굴이다.',
  choices: [
    { text: '사인을 해 주고 응원한다', do: (g) => '꼬마는 수첩을 껴안고 뛰어갔다.' + g.gain({ fame: 2 }) },
    { text: '"헌터는 위험한 일이야"라고 말해 준다', do: (g) => '꼬마는 시무룩했지만, 엄마는 고개 숙여 인사했다.' + g.gain({ rep: 3 }) },
  ] });
S({ id: 'street_drone_ads', city: true, text: '광고 드론이 머리 위를 맴돌며 "에테르 증폭 보조제! 하루 한 알이면 등급이 오릅니다!"를 외친다. 한 통에 300크레딧.',
  choices: [
    { text: '속는 셈 치고 산다', do: (g) => g.roll(0.25) ? '놀랍게도 진짜 효과가 있었다.' + g.gain({ money: -300 / RANKS[g.player.rankIdx].mult, ether: 25 }) : '설탕 덩어리였다.' + g.gain({ money: -300 / RANKS[g.player.rankIdx].mult }) },
    { text: '드론을 격추해 신고한다', do: (g) => '불법 광고 드론이었다. 협회가 포상했다.' + g.gain({ merit: 4 }) },
    { text: '무시한다', do: () => '드론은 다음 목표를 향해 날아갔다.' },
  ] });
S({ id: 'street_old_hunter', city: true, text: '지하철역 계단에 한쪽 팔이 없는 노인이 앉아 있다. 낡은 협회 배지가 가슴에 달려 있다. 1세대 헌터다.',
  choices: [
    { text: '옆에 앉아 이야기를 듣는다', do: (g) => '"첫 게이트 때는 등급이란 것도 없었지. 다들 맨손으로 들어갔어." 노인의 이야기에서 배운 것이 많다.' + g.gain({ ether: 20 }) },
    { text: '식사비를 건넨다', do: (g) => '노인은 받지 않았다. 대신 오래된 코어 하나를 쥐여 줬다. "나보다 네가 더 쓸모 있겠지."' + g.gain({ core: [1, 1] }) },
  ] });
S({ id: 'city_blackout', city: true, text: '도시 전체가 정전됐다. 에테르 발전소가 과부하에 걸렸다는 비상 방송이 흘러나온다. 발전소 쪽 하늘이 보랏빛으로 일렁인다.',
  choices: [
    { text: '발전소로 달려간다', do: (g) => { if (g.roll(0.55)) return '폭주하던 에테르를 흡수해 안정시켰다. 몸이 타는 듯했지만 버텼다.' + g.gain({ ether: 40, rep: 10, merit: 6, hp: -0.3 }); return '흡수에 실패해 튕겨 나갔다. 다른 헌터들이 수습했다.' + g.gain({ hp: -0.5, injure: 1 }); } },
    { text: '대피소 질서를 맡는다', do: (g) => '공황에 빠진 사람들을 진정시켰다. 아무도 다치지 않았다.' + g.gain({ rep: 6 }) },
  ] });
S({ id: 'city_scam_guild', city: true, maxRank: 2, text: '"신생 길드 \'블루 라이트\'! 가입비 500크레딧이면 매달 D급 게이트 공략 보장!" 전단을 든 남자가 웃는다.',
  choices: [
    { text: '가입한다', do: (g) => '다음 날 사무실은 텅 비어 있었다. 사기였다.' + g.gain({ money: -500 / RANKS[g.player.rankIdx].mult }) },
    { text: '수상해서 협회에 제보한다', do: (g) => '전국에 피해자가 수십 명이었다. 일당이 검거됐다.' + g.gain({ merit: 8, fame: 2 }) },
    { text: '거절한다', do: () => '남자는 다음 사람에게 전단을 내밀었다.' },
  ] });
S({ id: 'city_hospital', city: true, when: (g) => g.player.injured > 0 || g.player.hp < g.player.maxHp * 0.5, text: '상처가 욱신거린다. 헌터 전문 병원 앞에 "에테르 재생 치료, 협회원 50% 할인" 현수막이 걸려 있다.',
  choices: [
    { text: '치료를 받는다', do: (g) => { g.player.injured = 0; return '말끔히 나았다.' + g.gain({ money: -150, hp: 1 }); } },
    { text: '참는다', do: () => '버틸 만하다. 아마도.' },
  ] });

// ---------- 필드 ----------
S({ id: 'field_refugees', field: true, text: '무너진 고가도로 아래, 게이트 난민 가족이 천막을 치고 있다. 아이가 기침을 한다. 근처에 괴수 발자국이 보인다.',
  choices: [
    { text: '도시까지 호위한다', do: (g) => '사흘 동안 그들을 지켰다. 도시 입구에서 아이가 손을 흔들었다.' + g.gain({ fame: 4, rep: 4 }) },
    { text: '물자를 나눠 준다', do: (g) => '회복제 하나와 식량을 두고 왔다.' + (g.player.items.potion ? (g.player.items.potion--, '') : '') + g.gain({ fame: 2 }) },
    { text: '갈 길을 간다', do: () => '기침 소리가 오래 귀에 남았다.' },
  ] });
S({ id: 'field_crashed_truck', field: true, text: '전복된 협회 수송 트럭. 운전석은 비어 있고, 짐칸에 봉인된 코어 상자가 그대로 있다.',
  choices: [
    { text: '협회에 신고하고 지킨다', do: (g) => '수거 팀이 도착할 때까지 지켰다.' + g.gain({ merit: 8 }) },
    { text: '상자 하나를 챙긴다', do: (g) => g.roll(0.7) ? '아무도 모를 것이다.' + g.gain({ core: [0, 4] }) : 'CCTV 드론에 찍혔다. 협회에서 경고장이 날아왔다.' + g.gain({ core: [0, 4], merit: -15, fame: -5 }) },
    { text: '운전자를 찾아 나선다', do: (g) => g.roll(0.5) ? '숲속에서 다친 운전자를 찾아냈다. 그는 당신 덕에 살았다.' + g.gain({ fame: 5, merit: 5 }) : '핏자국만 남아 있었다.' },
  ] });
S({ id: 'field_ether_spring', field: true, text: '바위 틈에서 맑은 에테르가 샘솟는다. 지도에 없는 샘이다. 주변 풀이 비정상적으로 크다.',
  choices: [
    { text: '샘 옆에서 수련한다', do: (g) => { g.advanceDays(10); return '열흘간 샘물을 마시며 수련했다.' + g.gain({ ether: 45 }); } },
    { text: '샘물을 병에 담는다', do: (g) => '고급 마나 앰플 대용으로 쓸 수 있겠다.' + g.gain({ item: ['mana', 3] }) },
    { text: '협회에 좌표를 판다', do: (g) => '좋은 값을 받았다.' + g.gain({ money: 250, merit: 3 }) },
  ] });
S({ id: 'field_lost_hunter', field: true, npc: 'stranger', text: '안개 속에서 비틀거리는 각성자 {npc}을(를) 만났다. 동료를 게이트에서 잃고 사흘째 헤매는 중이라고 한다.',
  choices: [
    { text: '도시까지 데려다준다', do: (g, c) => '{npc}은(는) 몇 번이고 고맙다고 했다.' + g.gain({ rel: 25 }, c) },
    { text: '회복제를 주고 길만 알려 준다', do: (g, c) => (g.player.items.potion ? (g.player.items.potion--, '') : '') + '그는 혼자 걸어갔다.' + g.gain({ rel: 10 }, c) },
  ] });
S({ id: 'field_monster_nest', field: true, minRank: 1, text: '쓰러진 아파트 단지 안에 괴수 둥지가 있다. 알 몇 개가 에테르 빛을 내며 맥동한다.',
  choices: [
    { text: '둥지를 소각한다', do: (g) => { g.storyFight({ title: '둥지를 지키는 어미', mobs: { tier: g.player.rankIdx, n: 1, boss: true }, win: { text: '어미를 쓰러뜨리고 둥지를 태웠다.', gain: { rep: 6, merit: 8, core: [0, 3] } } }); return '알을 건드리자 둥지 깊은 곳에서 포효가 울렸다!'; } },
    { text: '알을 팔면 비싸다던데', do: (g) => g.roll(0.5) ? '알 두 개를 암시장에 넘겼다.' + g.gain({ money: 400 }) : '알이 손안에서 부화했다. 새끼가 손을 물고 달아났다.' + g.gain({ hp: -0.2 }) },
    { text: '물러난다', do: () => '지도에 표시만 해 두었다.' },
  ] });
S({ id: 'field_rain', field: true, text: '보라색 비가 내린다. 에테르 비다. 맞으면 감기에 걸리거나, 아주 드물게 각성이 진전된다는 속설이 있다.',
  choices: [
    { text: '비를 맞으며 명상한다', do: (g) => g.roll(0.35) ? '빗방울 하나하나가 몸속으로 녹아들었다.' + g.gain({ ether: 35 }) : '지독한 몸살에 걸렸다.' + g.gain({ hp: -0.4 }) },
    { text: '비를 피한다', do: () => '처마 밑에서 비가 그치길 기다렸다.' },
  ] });
S({ id: 'field_old_bunker', field: true, text: '대붕괴 이전 군 벙커 입구를 발견했다. 녹슨 철문에 "출입 금지 - 국방부"라고 적혀 있다.',
  choices: [
    { text: '들어가 본다', do: (g) => { const r = RNG.next(); if (r < 0.4) return '보급품 창고가 그대로 남아 있었다.' + g.gain({ item: ['potion', 4], money: 200 }); if (r < 0.7) return '먼지 쌓인 실험 기록 사이에서 이상한 장비를 찾았다.' + g.gain({ equip: 1 }); g.storyFight({ title: '벙커의 경비 드론', mobs: { tier: g.player.rankIdx, n: 2, shape: 'drone', elem: 'steel' }, win: { text: '드론을 부수고 안쪽 금고를 열었다.', gain: { money: 350, relic: true } } }); return '어둠 속에서 붉은 센서가 켜졌다!'; } },
    { text: '위험하다. 지나간다', do: () => '철문 너머에서 기계음이 들린 것 같았다.' },
  ] });
S({ id: 'field_rival_party', field: true, minRank: 1, text: '다른 헌터 파티와 마주쳤다. 같은 괴수 무리를 쫓고 있었던 모양이다. 리더가 "우리가 먼저 찾았다"며 물러나라고 한다.',
  choices: [
    { text: '양보한다', do: (g) => '그들은 고개를 까딱하고 지나갔다.' + g.gain({ relAll: 2 }) },
    { text: '전리품을 나누자고 제안한다', do: (g) => g.roll(0.6) ? '함께 사냥해 반씩 나눴다.' + g.gain({ money: 150, core: [0, 1] }) : '협상은 결렬됐고, 서로 노려보며 헤어졌다.' },
    { text: '실력으로 정하자', do: (g) => { g.storyFight({ title: '헌터 파티와의 다툼', mobs: { tier: g.player.rankIdx, n: 2, human: true }, spar: true, win: { text: '그들은 투덜대며 물러났다. 사냥감은 당신 차지다.', gain: { money: 200, core: [0, 2], fame: 1 } }, lose: { text: '흠씬 두들겨 맞고 빈손으로 돌아섰다.', gain: { fame: -2 } } }); return '리더가 무기를 뽑았다.'; } },
  ] });

// ---------- 게이트 주변 ----------
S({ id: 'gate_survivor', minRank: 1, text: '게이트 출구에서 갓 나온 생존자가 쓰러진다. "안에… 아직 둘 남아 있어요…" 게이트가 닫히기까지 남은 시간은 얼마 없다.',
  choices: [
    { text: '다시 뛰어든다', do: (g) => { g.storyFight({ title: '닫혀 가는 게이트', mobs: { tier: g.player.rankIdx, n: 3 }, win: { text: '두 사람을 업고 닫히기 직전에 빠져나왔다.', gain: { fame: 10, rep: 8, merit: 10 } }, lose: { text: '혼자 겨우 빠져나왔다. 게이트가 닫혔다.', gain: { injure: 2, fame: 2 } } }); return '게이트 안으로 몸을 던졌다.'; } },
    { text: '구조대를 부른다', do: (g) => '구조대가 왔지만 이미 늦었다.' + g.gain({ fame: -1 }) },
  ] });
S({ id: 'gate_red', minRank: 2, weight: 0.5, text: '눈앞의 게이트가 붉게 변했다. 레드 게이트, 들어가면 공략 전까진 나올 수 없다. 안에서 비명이 들린다.',
  choices: [
    { text: '들어간다', do: (g) => { g.storyFight({ title: '레드 게이트', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2, boss: true }, lethal: true, win: { text: '레드 게이트를 깨뜨렸다. 안에 갇혀 있던 사람들이 울며 매달렸다.', gain: { fame: 20, merit: 25, relic: 1, rep: 15 } } }); if (!g.flags.story.redGate) { g.flags.story.redGate = true; g.lifeEvent('처음으로 레드 게이트에 스스로 뛰어들었다.'); } return '붉은 막이 등 뒤에서 닫혔다. 이기거나, 죽거나.'; } },
    { text: '외부에서 협회에 알린다', do: (g) => 'S급 팀이 오기까지 사흘이 걸렸다. 생존자는 없었다.' + g.gain({ merit: 2 }) },
  ] });
S({ id: 'gate_double', minRank: 3, text: '공략이 끝난 게이트 안쪽에 또 하나의 문이 열렸다. 이중 게이트. 기록에 없는 공간이다.',
  choices: [
    { text: '탐색한다', do: (g) => { g.storyFight({ title: '이중 게이트의 수호자', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true, shape: 'eye', elem: 'spirit' }, win: { text: '수호자가 쓰러지자 제단 위의 유물이 빛났다.', gain: { relic: 2, ether: 60 } } }); return '문 너머에서 거대한 눈이 떠졌다.'; } },
    { text: '보고서만 쓴다', do: (g) => '협회가 연구 팀을 보냈다.' + g.gain({ merit: 12 }) },
  ] });
S({ id: 'gate_loot_fight', minRank: 1, npc: 'here', text: '게이트 공략 후 분배 자리에서 {npc}이(가) 보스 코어를 슬쩍 챙기는 걸 봤다.',
  choices: [
    { text: '공개적으로 지적한다', do: (g, c) => '{npc}은(는) 얼굴이 빨개져 코어를 내놓았다.' + g.gain({ core: [0, 2], rel: -20 }, c) },
    { text: '따로 불러 조용히 말한다', do: (g, c) => '"…미안. 동생 병원비가 급해서." {npc}은(는) 코어를 돌려줬고, 당신은 반을 쥐여 줬다.' + g.gain({ core: [0, 1], rel: 18 }, c) },
    { text: '못 본 척한다', do: () => '분배는 조용히 끝났다.' },
  ] });

// ---------- 등급별 ----------
S({ id: 'rank_f_mocked', maxRank: 0, city: true, text: '협회 창구 직원이 등급표를 보고 피식 웃는다. "F급이시면… 청소 의뢰 정도 가능하시겠네요." 뒤에 선 헌터들이 킥킥거린다.',
  choices: [
    { text: '청소 의뢰라도 받는다', do: (g) => '하수도 슬라임 청소. 냄새는 끔찍했지만 돈은 됐다.' + g.gain({ money: 120, core: [0, 2] }) },
    { text: '"두고 봐"라고 말한다', do: (g) => '등 뒤에서 웃음소리가 커졌다. 이를 악물었다.' + g.gain({ ether: 15 }) },
  ] });
S({ id: 'rank_e_first_party', minRank: 1, maxRank: 1, once: true, text: 'E급이 되자 처음으로 파티 모집 공고에 지원할 수 있게 됐다. 단톡방에 "E급 탱커 구합니다" 공고가 올라왔다.',
  choices: [
    { text: '지원한다', do: (g) => g.roll(0.6) ? '좋은 사람들이었다. 첫 파티 공략은 순조로웠다.' + g.gain({ money: 200, relAll: 5 }) : '리더가 몬스터를 당신 쪽으로 몰아 놓고 도망쳤다. 살아 나온 게 기적이다.' + g.gain({ injure: 1, ether: 20 }) },
    { text: '아직 혼자가 편하다', do: () => '단톡방 알림을 껐다.' },
  ] });
S({ id: 'rank_c_scout', minRank: 3, maxRank: 3, when: (g) => !g.player.guild, text: '대형 길드 스카우터가 명함을 내민다. "계약금 5천, 연봉 별도. C급이면 우리 2군 주전입니다."',
  choices: [
    { text: '조건을 듣는다', do: (g) => '좋은 조건이었지만 서명은 미뤘다. 소문이 퍼져 몸값이 올랐다.' + g.gain({ fame: 8 }) },
    { text: '계약금만 받고 생각해 본다', do: (g) => g.roll(0.4) ? '스카우터는 웃으며 선급금을 줬다. "편하게 생각하세요."' + g.gain({ money: 600 }) : '"장난하세요?" 스카우터의 표정이 굳었다.' + g.gain({ fame: -2 }) },
  ] });
S({ id: 'rank_b_variety', minRank: 4, text: '예능 PD가 연락해 왔다. "헌터의 하루" 관찰 예능에 출연해 달라는 것. 출연료는 짭짤하다.',
  choices: [
    { text: '출연한다', do: (g) => g.roll(0.6) ? '의외의 허당 매력이 화제가 됐다.' + g.gain({ money: 900, fame: 25 }) : '편집이 악마 같았다. 오만한 헌터로 낙인찍혔다.' + g.gain({ money: 900, fame: -10 }) },
    { text: '거절한다', do: () => '"아쉽네요. 마음 바뀌면 연락 주세요."' },
  ] });
S({ id: 'rank_a_nation', minRank: 5, text: '관리국에서 국가 비상 소집령이 내려왔다. 동해 심해 게이트에서 대형 개체가 상륙을 시도하고 있다.',
  choices: [
    { text: '소집에 응한다', do: (g) => { g.storyFight({ title: '동해 방어선', mobs: { tier: Math.min(7, g.player.rankIdx), n: 3, elem: 'ice' }, win: { text: '방어선을 지켰다. 대통령 표창이 내려왔다.', gain: { fame: 40, merit: 50, money: 3000 } }, lose: { text: '전선이 밀렸다. 많은 희생이 났다.', gain: { injure: 3, fame: -10 } } }); g.lifeEvent('동해 방어선 국가 소집에 응했다.'); return '강릉행 수송기에 올랐다.'; } },
    { text: '개인 사정으로 빠진다', do: (g) => '비난 여론이 일었다.' + g.gain({ fame: -25, merit: -20 }) },
  ] });
S({ id: 'rank_s_offer', minRank: 6, once: true, text: '정체불명의 해외 길드에서 영입 제안이 왔다. 연봉은 국내 최고액의 열 배. 조건은 하나, 국적을 버릴 것.',
  choices: [
    { text: '거절한다', do: (g) => '뉴스가 터졌다. "S급 헌터, 수천억 거절하고 한국에 남아".' + g.gain({ fame: 60 }) },
    { text: '조건만 들어 본다', do: (g) => '들어 볼수록 수상했다. 관리국이 조용히 감시를 붙였다.' + g.gain({ merit: -10 }) },
  ] });

// ---------- 지역 특화 ----------
S({ id: 'reg_busan_market', region: 'busan', city: true, text: '부산 해상 도시의 밤 시장. 포장마차 사이로 "출처 묻지 않는 유물" 좌판이 섞여 있다. 상인이 눈을 찡긋한다.',
  choices: [
    { text: '유물을 산다', do: (g) => g.roll(0.55) ? '진품이었다!' + g.gain({ money: -700, relic: true }) : '플라스틱에 형광 도료를 칠한 가짜였다.' + g.gain({ money: -700 }) },
    { text: '단속반에 넘긴다', do: (g) => '좌판이 털렸다. 시장 사람들의 눈빛이 싸늘해졌다.' + g.gain({ merit: 10, rep: -8 }) },
    { text: '어묵 국물만 마신다', do: (g) => '부산 어묵은 역시 다르다.' + g.gain({ hp: 0.2 }) },
  ] });
S({ id: 'reg_gangbuk_ruins', region: 'gangbuk', text: '강북 폐구의 무너진 초등학교. 칠판에 20년 전 날짜와 "내일 소풍!"이라는 글씨가 그대로 남아 있다. 교실 구석에서 무언가 움직인다.',
  choices: [
    { text: '살펴본다', do: (g) => g.roll(0.5) ? '숨어 지내던 고양이 가족이었다. 먹을 것을 두고 나왔다.' + g.gain({ hp: 0.1 }) : (g.storyFight({ title: '교실의 그림자', mobs: { tier: Math.max(0, g.player.rankIdx), n: 2, shape: 'ghost', elem: 'spirit' }, win: { text: '그림자가 흩어지며 아이들의 웃음소리가 들렸다.', gain: { ether: 40, rep: 4 } } }), '그림자가 아이 형상을 하고 일어섰다.') },
    { text: '조용히 문을 닫는다', do: () => '20년 전의 소풍은 영영 오지 않았다.' },
  ] });
S({ id: 'reg_gangneung_front', region: 'gangneung', text: '강릉 해안 전선의 경계 근무 교대 시간. 지친 병사가 "헌터님, 잠깐만 대신 봐 주실 수 있어요?"라며 망원경을 건넨다.',
  choices: [
    { text: '대신 경계를 선다', do: (g) => g.roll(0.4) ? '수평선에서 무언가 다가오는 걸 먼저 발견했다. 경보 덕에 피해가 없었다.' + g.gain({ fame: 8, merit: 10, rep: 6 }) : '조용한 밤이었다. 병사는 꿀잠을 잤다.' + g.gain({ rep: 3 }) },
    { text: '거절한다', do: () => '병사는 하품을 참으며 망원경을 다시 들었다.' },
  ] });
S({ id: 'reg_daejeon_lab', region: 'daejeon', city: true, text: '청룡 연구소 연구원이 길을 막는다. "피험자 모집 중입니다! 에테르 회로 측정만 하시면 돼요. 사례비 드립니다."',
  choices: [
    { text: '참여한다', do: (g) => g.roll(0.7) ? '측정 결과를 바탕으로 수련법을 교정받았다.' + g.gain({ money: 200, talent: 1 }) : '측정기 오작동으로 감전됐다.' + g.gain({ money: 400, hp: -0.4 }) },
    { text: '거절한다', do: () => '"다음에 꼭이요!"' },
  ] });
S({ id: 'reg_jeonju_hanok', region: 'jeonju', city: true, text: '전주 보존 구역의 한옥 마을. 한복을 입은 노파가 마당에서 약초를 말리고 있다. "에테르에 지친 얼굴이구먼. 차 한잔 하고 가."',
  choices: [
    { text: '차를 마신다', do: (g) => '오래된 약차가 몸속 막힌 곳을 풀어 줬다.' + g.gain({ hp: 0.5, life: 1 }) },
    { text: '약초 캐는 걸 돕는다', do: (g) => { g.advanceDays(5); return '닷새 동안 약초를 캤다. 노파는 회복제를 잔뜩 싸 줬다.' + g.gain({ item: ['potion', 5], rep: 6 }); } },
  ] });
S({ id: 'reg_gwangju_free', region: 'gwangju', city: true, text: '광주 자유 도시의 프리랜서 광장. 길드 없는 헌터들이 모여 즉석 파티를 꾸린다. "한 자리 비는데, 들어올 사람?"',
  choices: [
    { text: '합류한다', do: (g) => '자유로운 분위기 속에서 즐겁게 사냥했다.' + g.gain({ money: 180, relAll: 4, core: [0, 1] }) },
    { text: '구경만 한다', do: () => '다들 자기 길을 가는 사람들이다.' },
  ] });
S({ id: 'reg_incheon_port', region: 'incheon', city: true, text: '인천 항만의 관리국 검문소. 직원이 당신의 짐을 뒤지다 코어를 발견한다. "신고 안 된 코어네요. 압수입니다."',
  choices: [
    { text: '순순히 내준다', do: (g) => { const t = g.player.rankIdx; const n = Math.min(2, g.coreCount(t)); g.player.mats['c' + t] -= n; return '서류에 사인했다. 관리국 신뢰도가 조금 올랐다.' + g.gain({ merit: 5 }); } },
    { text: '협회원 증명을 내민다', do: (g) => g.player.merit >= 30 ? '"아, 실례했습니다." 직원이 경례했다.' : '"공적이 부족하시네요." 소용없었다.' + g.gain({ merit: -3 }) },
  ] });
S({ id: 'reg_ulsan_forge', region: 'ulsan', city: true, text: '울산 중공업 지대의 거대 용광로. 현무 중공업 기술자가 "괴수 코어 녹여서 합금 만드는 거 구경할래요?"라고 묻는다.',
  choices: [
    { text: '코어를 맡겨 장비를 맞춘다', do: (g) => { const t = g.player.rankIdx; if (g.coreCount(t) < 3) return '코어가 부족했다. 기술자는 다음에 오라고 했다.'; g.player.mats['c' + t] -= 3; return '불꽃 속에서 새 장비가 태어났다.' + g.gain({ equip: 0 }); } },
    { text: '구경만 한다', do: (g) => '쇳물이 흐르는 광경에 넋을 잃었다.' + g.gain({ ether: 10 }) },
  ] });
S({ id: 'reg_daegu_heat', region: 'daegu', text: '대구 분지에 에테르 열기가 고였다. 기온 45도. 거리의 사람들이 쓰러진다.',
  choices: [
    { text: '빙결 능력자를 찾아 협력한다', do: (g) => '임시 냉각소를 열었다. 수백 명이 쉬어 갔다.' + g.gain({ rep: 10, fame: 4 }) },
    { text: '열기를 수련에 이용한다', do: (g) => '극한의 열기 속에서 에테르가 단련됐다.' + g.gain({ ether: 30, hp: -0.3 }) },
  ] });
S({ id: 'reg_suwon_factory', region: 'suwon', city: true, text: '수원 산업 벨트 공장 노동자들이 파업 중이다. "괴수 습격 위험수당을 달라!" 공장장은 헌터를 고용해 해산시키려 한다.',
  choices: [
    { text: '노동자 편에 선다', do: (g) => '공장장이 물러섰다. 노동자들이 박수를 쳤다.' + g.gain({ rep: 10, money: -50 }) },
    { text: '공장장의 의뢰를 받는다', do: (g) => '돈은 받았지만 뒷맛이 씁쓸했다.' + g.gain({ money: 400, rep: -12, fame: -4 }) },
    { text: '양쪽을 중재한다', do: (g) => g.roll(0.5) ? '위험수당 절반 지급으로 타결됐다.' + g.gain({ rep: 6, fame: 3 }) : '양쪽 다 당신에게 화를 냈다.' + g.gain({ rep: -3 }) },
  ] });
S({ id: 'reg_gangnam_party', region: 'gangnam', city: true, minRank: 3, text: '강남 돔 최상층 펜트하우스에서 재벌가 파티 초대장이 왔다. 드레스 코드: 블랙. 상류층 헌터들이 모인다.',
  choices: [
    { text: '참석한다', do: (g) => g.roll(0.5) ? '인맥이 넓어졌다. 투자 제안도 받았다.' + g.gain({ fame: 6, money: 500 }) : '술에 취한 재벌 3세와 시비가 붙었다.' + g.gain({ fame: -4 }) },
    { text: '불참한다', do: () => '그날 밤은 컵라면을 먹으며 보냈다.' },
  ] });

// ---------- 관계 ----------
S({ id: 'rel_jealous', npc: 'partner', when: (g) => g.adults().some((n) => n.region === g.player.region && n.relation >= 40 && n.id !== (g.player.partner || g.player.spouse)), text: '{npc}이(가) 시무룩하다. "요즘 다른 사람이랑 더 자주 다니더라." 질투하는 모양이다.',
  choices: [
    { text: '하루를 온전히 함께 보낸다', do: (g, c) => { g.advanceDays(3); return '한강에서 자전거를 탔다. {npc}의 기분이 풀렸다.' + g.gain({ rel: 12 }, c); } },
    { text: '"일 때문이야"라고 넘긴다', do: (g, c) => '"…그래." 대답이 짧았다.' + g.gain({ rel: -8 }, c) },
  ] });
S({ id: 'rel_partner_worry', npc: 'partner', minRank: 2, text: '{npc}이(가) 붕대 감은 당신 팔을 보고 울컥한다. "이번 달은 게이트 좀 쉬면 안 돼?"',
  choices: [
    { text: '약속한다', do: (g, c) => { g.advanceDays(20); return '스무 날을 함께 쉬었다. 몸도 마음도 회복됐다.' + g.gain({ rel: 10, hp: 1 }, c); } },
    { text: '"이게 내 일이야"', do: (g, c) => '{npc}은(는) 더 말하지 않았다.' + g.gain({ rel: -5 }, c) },
  ] });
S({ id: 'rel_anniversary', npc: 'partner', text: '오늘은 {npc}와(과)의 기념일이다. 깜빡할 뻔했다.',
  choices: [
    { text: '근사한 저녁을 예약한다', do: (g, c) => '강남 루프탑 레스토랑. 야경만큼 {npc}의 웃음이 빛났다.' + g.gain({ money: -120, rel: 10 }, c) },
    { text: '손편지를 쓴다', do: (g, c) => '{npc}은(는) 편지를 지갑에 넣고 다닌다고 했다.' + g.gain({ rel: 8 }, c) },
  ] });
S({ id: 'rel_betrayal', npc: 'friend', minRank: 2, when: (g, c) => c.npc && c.npc.personality === 'greedy', text: '{npc}이(가) 당신의 공략 정보를 다른 길드에 팔았다는 걸 알게 됐다. 증거 메시지가 손에 있다.',
  choices: [
    { text: '정면으로 따진다', do: (g, c) => g.roll(0.5) ? '"…미안. 빚 때문에." {npc}은(는) 고개를 숙였다. 용서할지는 나중 일이다.' + g.gain({ rel: -10 }, c) : '{npc}은(는) 오히려 화를 냈다. 관계는 끝났다.' + g.gain({ rel: -60 }, c) },
    { text: '조용히 손절한다', do: (g, c) => '연락처를 지웠다.' + g.gain({ rel: -40 }, c) },
    { text: '이번 한 번은 눈감아 준다', do: (g, c) => '{npc}은(는) 당신이 안다는 사실을 모른다. 아직은.' },
  ] });
S({ id: 'rel_secret', npc: 'friend', text: '술에 취한 {npc}이(가) 비밀을 털어놓는다. "나… 사실 등급 측정 조작했어. 진짜는 한 단계 아래야."',
  choices: [
    { text: '비밀을 지켜 준다', do: (g, c) => '{npc}은(는) 다음 날 아무것도 기억 못 하는 척했지만, 눈빛이 달라졌다.' + g.gain({ rel: 15 }, c) },
    { text: '협회에 알린다', do: (g, c) => '{npc}은(는) 자격 정지를 당했다. 당신을 원망했다.' + g.gain({ merit: 10, rel: -50 }, c) },
  ] });
S({ id: 'rel_business', npc: 'friend', minRank: 1, text: '{npc}이(가) 사업 제안을 한다. "코어 가공 공방 같이 차리자. 너는 코어 대고, 나는 운영하고. 수익 반반."',
  choices: [
    { text: '투자한다', do: (g, c) => { const a = Math.round(500 * RANKS[g.player.rankIdx].mult); if (g.player.money < a) return '돈이 부족했다.'; g.player.money -= a; (g.player.loans ||= []).push({ npc: c.npc.id, amount: a * 1.4, due: g.monthKey() + 12 }); return `${fmt(a)} 크레딧을 넣었다. 1년 뒤 결과가 나올 것이다.` + g.gain({ rel: 10 }, c); } },
    { text: '사양한다', do: (g, c) => '"그래, 강요는 안 해."' },
  ] });
S({ id: 'rel_rival_challenge', npc: 'rival', text: '{npc}이(가) 공개 채널에 글을 올렸다. "{name}, 실력 없는 놈이 운만 좋아서 뜬 거다. 증명해 보든가."',
  choices: [
    { text: '공개 대련을 받는다', do: (g, c) => { g.queue.unshift({ type: 'spar', npcId: c.npc.id }); return '수백 명이 생중계를 지켜봤다.' + g.gain({ fame: 3 }); } },
    { text: '무시한다', do: (g) => '"쫄았네 ㅋㅋ" 댓글이 달렸다.' + g.gain({ fame: -3 }) },
    { text: '고소한다', do: (g, c) => '명예훼손 소송에서 이겼다. 합의금이 들어왔다.' + g.gain({ money: 300, rel: -20 }, c) },
  ] });
S({ id: 'rel_master_lesson', npc: 'master', text: '스승 {npc}이(가) 새벽부터 깨운다. "오늘은 산에 간다. 한 달 동안 내려올 생각 하지 마."',
  choices: [
    { text: '따른다', do: (g, c) => { g.advanceDays(30); return '지옥 같은 한 달이었다. 하지만 확실히 강해졌다.' + g.gain({ ether: 90, rel: 8 }, c); } },
    { text: '바쁘다고 핑계 댄다', do: (g, c) => '"쯧. 그래서 언제 크냐."' + g.gain({ rel: -6 }, c) },
  ] });
S({ id: 'rel_disciple_trouble', npc: 'disciple', text: '제자 {npc}이(가) 다른 길드 헌터와 시비가 붙어 경찰서에 있다는 연락이 왔다.',
  choices: [
    { text: '데리러 간다', do: (g, c) => '보증을 서고 데려 나왔다. {npc}은(는) 고개를 들지 못했다.' + g.gain({ money: -100, rel: 12 }, c) },
    { text: '스스로 해결하게 둔다', do: (g, c) => '{npc}은(는) 사흘 뒤 혼자 돌아왔다. 조금 어른스러워졌다.' + g.gain({ rel: -5 }, c) },
  ] });
S({ id: 'rel_friend_gift', npc: 'friend', weight: 0.7, text: '{npc}에게서 택배가 왔다. "지난번 고마웠어. 게이트에서 주운 건데 너한테 더 필요할 것 같아서."',
  choices: [{ text: '고맙게 받는다', do: (g, c) => '상자 안에는 편지와 선물이 들어 있었다.' + g.gain(RNG.chance(0.3) ? { relic: true, rel: 5 } : { core: [0, 3], rel: 5 }, c) }] });

// ---------- 언론, 정치, 사회 ----------
S({ id: 'media_viral', minRank: 1, text: '게이트에서 싸우는 당신의 영상이 SNS에서 퍼지고 있다. 누군가 몰래 찍은 것이다. 댓글이 수만 개.',
  choices: [
    { text: '공식 채널을 개설한다', do: (g) => g.roll(0.6) ? '구독자가 폭발적으로 늘었다.' + g.gain({ fame: 15, money: 300 }) : '악플이 쏟아졌다. 멘탈이 흔들렸다.' + g.gain({ fame: 5, hp: -0.2 }) },
    { text: '삭제 요청을 한다', do: (g) => '영상은 내려갔지만 짤은 영원했다.' + g.gain({ fame: 4 }) },
  ] });
S({ id: 'media_hearing', minRank: 4, text: '국회 각성자 관리법 청문회에 증인으로 불려 갔다. 의원이 묻는다. "각성자의 무력은 국가가 통제해야 하지 않습니까?"',
  choices: [
    { text: '"헌터는 시민입니다"라고 답한다', do: (g) => '각성자 커뮤니티에서 영웅이 됐다. 관리국은 불편해했다.' + g.gain({ fame: 20, merit: -10 }) },
    { text: '"관리가 필요합니다"라고 답한다', do: (g) => '관리국의 신임을 얻었다. 동료 헌터들의 시선은 차가워졌다.' + g.gain({ merit: 25, relAll: -5 }) },
    { text: '원론적으로 답한다', do: (g) => '무난히 넘어갔다.' + g.gain({ merit: 3 }) },
  ] });
S({ id: 'media_tax', minRank: 2, text: '국세청에서 연락이 왔다. "게이트 수익 신고 누락분이 있으시네요."',
  choices: [
    { text: '세금을 낸다', do: (g) => '성실 납세자가 됐다.' + g.gain({ money: -Math.round(g.player.money * 0.1 / RANKS[g.player.rankIdx].mult), merit: 5 }) },
    { text: '세무사를 고용한다', do: (g) => g.roll(0.6) ? '절세에 성공했다.' + g.gain({ money: -80 }) : '가산세까지 물었다.' + g.gain({ money: -Math.round(g.player.money * 0.15 / RANKS[g.player.rankIdx].mult) }) },
  ] });
S({ id: 'society_awakening_kid', city: true, text: '학교 앞에서 소동이 났다. 중학생이 수업 중 갑자기 각성해 교실 창문을 전부 날려 버렸다고 한다. 아이는 겁에 질려 운동장 한가운데서 불꽃을 뿜고 있다.',
  choices: [
    { text: '다가가 진정시킨다', do: (g) => g.roll(0.6) ? '"괜찮아, 나도 처음엔 그랬어." 불꽃이 잦아들었다.' + g.gain({ fame: 8, rep: 8 }) : '불꽃에 휩싸였다. 그래도 아이를 안아 진정시켰다.' + g.gain({ fame: 10, hp: -0.4, rep: 8 }) },
    { text: '관리국 진압팀을 기다린다', do: () => '진압팀이 마취총을 쐈다. 아이는 그대로 연구소로 이송됐다.' },
  ] });
S({ id: 'society_documentary', minRank: 1, text: '다큐멘터리 제작진이 "대붕괴 20년, 헌터의 삶"을 찍고 싶다며 동행을 요청한다.',
  choices: [
    { text: '동행을 허락한다', do: (g) => '방송이 나갔다. 생각보다 진솔하게 그려졌다.' + g.gain({ fame: 10 }) },
    { text: '거절한다', do: () => '"아쉽네요."' },
  ] });

// ---------- 이상 현상 ----------
S({ id: 'odd_time_loop', minRank: 2, text: '같은 거리를 세 번째 지나고 있다. 같은 신호등, 같은 행인, 같은 대화. 에테르가 시간을 꼬아 놓았다.',
  choices: [
    { text: '고리의 중심을 찾는다', do: (g) => g.roll(0.5) ? '골목 끝 깨진 거울이 원인이었다. 부수자 시간이 흘렀다.' + g.gain({ ether: 50, relic: true }) : '빠져나오는 데 2주가 걸렸다. 체감은 하루였다.' + (g.advanceDays(14), '') + g.gain({ ether: 20 }) },
    { text: '눈을 감고 기다린다', do: () => '눈을 뜨자 고리는 사라져 있었다. 꿈이었을까.' },
  ] });
S({ id: 'odd_shadow', minRank: 3, text: '그림자가 반 박자 늦게 움직인다. 밤이 되자 그림자가 말을 건다. "너는 나야. 나는 더 강한 너고."',
  choices: [
    { text: '그림자와 싸운다', do: (g) => { g.storyFight({ title: '나의 그림자', mirror: true, win: { text: '그림자가 다시 발밑으로 돌아왔다. 무언가 하나를 넘어선 느낌이다.', gain: { ether: 80, talent: 1 } }, lose: { text: '그림자에게 짓밟혔다. 깨어나니 아침이었다.', gain: { injure: 2 } } }); return '그림자가 바닥에서 일어섰다.'; } },
    { text: '그림자의 말을 듣는다', do: (g) => '"서둘러. 수명은 생각보다 짧아." 그림자는 다시 조용해졌다.' + g.gain({ ether: 30 }) },
  ] });
S({ id: 'odd_memory', text: '눈을 떠 보니 모르는 병원이다. 지난 사흘간의 기억이 없다. 주머니에 낯선 코어와 쪽지 한 장: "아직 때가 아니다."',
  choices: [{ text: '쪽지를 간직한다', do: (g) => { g.advanceDays(3); g.flags.story.note = true; return '필체가… 당신의 것과 똑같다.' + g.gain({ core: [1, 1] }); } }] });
S({ id: 'odd_ether_child', field: true, text: '빛으로 된 아이가 숲속을 뛰어다닌다. 에테르가 응집해 생긴 정령인 듯하다. 아이가 당신 손을 잡아끈다.',
  choices: [
    { text: '따라간다', do: (g) => '정령이 데려간 곳에 오래된 각성자의 무덤이 있었다. 무덤 앞에 유물이 놓여 있었다.' + g.gain({ relic: true }) },
    { text: '손을 뿌리친다', do: () => '아이는 슬픈 얼굴로 흩어졌다.' },
  ] });

// ---------- 나이와 수명 ----------
S({ id: 'age_birthday', when: (g) => g.month === 3 && g.ageYears() % 10 === 0, text: '{name}의 생일이다. 나이를 세어 보니 어느덧 앞자리가 바뀌었다.',
  choices: [
    { text: '조용히 케이크를 먹는다', do: (g) => '촛불을 끄며 지난 10년을 돌아봤다.' + g.gain({ hp: 0.3 }) },
    { text: '아는 사람들을 불러 파티를 연다', do: (g) => '생각보다 많은 사람이 왔다.' + g.gain({ money: -100, relAll: 6 }) },
  ] });
S({ id: 'age_mortality', when: (g) => g.maxLife() - g.ageYears() <= 8 && g.maxLife() - g.ageYears() > 0, text: '아침에 거울을 보다 흰머리가 부쩍 늘었다는 걸 알았다. 에테르가 예전처럼 돌지 않는다. 남은 시간은 길지 않다.',
  choices: [
    { text: '돌파에 모든 걸 건다', do: (g) => '남은 생을 불태우기로 했다.' + g.gain({ ether: 40, hp: -0.2 }) },
    { text: '주변을 정리한다', do: (g) => '고마운 사람들에게 편지를 썼다.' + g.gain({ relAll: 10 }) },
    { text: '후배를 키운다', do: (g) => '내가 못 간 길을 누군가는 가겠지.' + g.gain({ fame: 8 }) },
  ] });
S({ id: 'age_classmate', minAge: 30, text: '고등학교 동창회 단톡방이 울린다. 비각성자 친구들은 대부분 결혼해 아이를 키우고 있다. "넌 요즘 뭐 해? TV에서 봤어!"',
  choices: [
    { text: '동창회에 간다', do: (g) => '평범한 삶이 조금 부러웠다. 그래도 즐거웠다.' + g.gain({ hp: 0.3, fame: 1 }) },
    { text: '읽고 답하지 않는다', do: () => '단톡방에서 조용히 나왔다.' },
  ] });

// ---------- 도시 도착 사건 (도시에 들어설 때) ----------
S({ id: 'arrive_welcome', trigger: 'city', when: (g) => g.rep(g.player.region) >= 100, text: '{city} 입구에서 사람들이 당신을 알아보고 환호한다. 꽃다발을 든 아이가 달려온다.',
  choices: [{ text: '손을 흔든다', do: (g) => '이 도시는 당신을 잊지 않았다.' + g.gain({ hp: 0.3, fame: 2 }) }] });
S({ id: 'arrive_suspicious', trigger: 'city', when: (g) => g.rep(g.player.region) <= -20, text: '{city} 검문소 직원이 당신 이름을 보고 표정이 굳는다. "…추가 검사가 필요합니다."',
  choices: [
    { text: '검사에 응한다', do: (g) => { g.advanceDays(2); return '이틀을 허비했다.' + g.gain({ rep: 3 }); } },
    { text: '뒷돈을 건넨다', do: (g) => '직원은 못 본 척했다.' + g.gain({ money: -80, rep: -2 }) },
  ] });
S({ id: 'arrive_news', trigger: 'city', text: '{city} 대형 전광판에 속보가 흐른다. 각성자 관련 뉴스, 길드 순위, 그리고 게이트 경보.',
  choices: [{ text: '뉴스를 훑어본다', do: (g) => { const r = g.rumors[0]; return r ? `"${r.text}"` : '별다른 소식은 없었다.'; } }] });
S({ id: 'arrive_npc_greet', trigger: 'city', npc: 'friendHere', text: '{city}에 들어서자 {npc}이(가) 반갑게 손을 흔든다. "어? 여기 웬일이야! 밥은 먹었어?"',
  choices: [
    { text: '같이 밥을 먹는다', do: (g, c) => '국밥 한 그릇에 근황을 나눴다.' + g.gain({ rel: 6, hp: 0.2 }, c) },
    { text: '바빠서 다음에 보자고 한다', do: (g, c) => '"그래, 연락해!"' },
  ] });

// ---------- 길 위에서 (이동 중 발생) ----------
S({ id: 'road_merchant', trigger: 'road', text: '먼지를 뒤집어쓴 행상 트럭이 길가에 서 있다. "헌터 양반! 회복제 싸게 줄게, 코어도 사고!"',
  choices: [
    { text: '회복제를 산다', do: (g) => g.player.money >= 60 ? '시중가의 반값이었다.' + g.gain({ money: -60 / RANKS[g.player.rankIdx].mult, item: ['potion', 2] }) : '돈이 모자랐다.' },
    { text: '코어를 넘긴다', do: (g) => { const t = g.player.rankIdx; const n = g.coreCount(t); if (!n) return '팔 코어가 없었다.'; g.player.mats['c' + t] = 0; return `${n}개를 넘겼다. 시세보다 조금 쳐줬다.` + g.gain({ money: 22 * n }); } },
    { text: '그냥 지나간다', do: () => '트럭 확성기에서 트로트가 흘러나왔다.' },
  ] });
S({ id: 'road_hitchhiker', trigger: 'road', text: '배낭을 멘 청년이 엄지를 든다. "다음 도시까지만 같이 가요! 혼자 걷기 무서워서요."',
  choices: [
    { text: '함께 걷는다', do: (g) => g.roll(0.75) ? '수다스러운 청년이었다. 헤어지며 지도에 없는 샘 위치를 알려 줬다.' + (g.reveal(g.player.x, g.player.y, 7), '') + g.gain({ fame: 1 }) : '밤중에 청년이 짐을 뒤지다 들켜 도망쳤다. 각성자 강도였다.' + g.gain({ money: -80 }) },
    { text: '거절한다', do: () => '청년은 실망한 얼굴로 다음 행인을 기다렸다.' },
  ] });
S({ id: 'road_checkpoint', trigger: 'road', minRank: 1, text: '길 한복판에 바리케이드. 완장 찬 사내들이 막아선다. "여긴 우리 구역이야. 통행세 내고 가."',
  choices: [
    { text: '통행세를 낸다', do: (g) => '지갑이 가벼워졌다.' + g.gain({ money: -60 }) },
    { text: '뚫고 지나간다', do: (g) => { g.storyFight({ title: '불법 검문소', mobs: { tier: Math.max(0, g.player.rankIdx - 1), n: 3, human: true }, win: { text: '바리케이드가 무너졌다. 근처 주민들이 박수를 쳤다.', gain: { rep: 5, money: 80 } } }); return '사내들이 쇠파이프를 들었다.'; } },
    { text: '돌아간다', do: (g) => { g.advanceDays(4, { noSave: true }); return '나흘을 돌아갔다.'; } },
  ] });
S({ id: 'road_bridge', trigger: 'road', text: '앞의 다리가 반쯤 무너져 있다. 아래는 에테르로 탁해진 강물. 우회로는 한참 돌아간다.',
  choices: [
    { text: '에테르를 발에 모아 뛰어넘는다', do: (g) => g.roll(0.5 + g.player.spd / 150) ? '가뿐히 건넜다.' + g.gain({ ether: 8 }) : '발을 헛디뎌 강물에 빠졌다. 겨우 기어 나왔다.' + g.gain({ hp: -0.35 }) },
    { text: '우회한다', do: (g) => { g.advanceDays(5, { noSave: true }); return '닷새를 돌아갔다.'; } },
    { text: '다리를 보수하고 간다', do: (g) => { g.advanceDays(3, { noSave: true }); return '사흘에 걸쳐 임시 다리를 놓았다. 뒤에 오는 사람들이 고마워할 것이다.' + g.gain({ rep: 4, fame: 2 }); } },
  ] });
S({ id: 'road_storm', trigger: 'road', text: '지평선 너머 보랏빛 벽이 다가온다. 에테르 폭풍이다. 바람에 섞인 빛가루가 피부를 따끔하게 찌른다.',
  choices: [
    { text: '폭풍을 정면으로 맞는다', do: (g) => g.roll(0.45) ? '폭풍의 에테르를 고스란히 흡수했다.' + g.gain({ ether: 40, hp: -0.2 }) : '폭풍에 휩쓸려 정신을 잃었다.' + g.gain({ hp: -0.5, injure: 1 }) },
    { text: '폐건물에 숨는다', do: (g) => { g.advanceDays(3, { noSave: true }); return '사흘 뒤에야 폭풍이 지나갔다.'; } },
  ] });
S({ id: 'road_camp', trigger: 'road', text: '모닥불 연기가 보인다. 헌터 몇이 야영 중이다. "같이 불 쬐고 가요. 오늘 밤은 길어요."',
  choices: [
    { text: '하룻밤 신세 진다', do: (g) => '라면을 끓여 먹으며 근처 게이트 정보를 나눴다. 주변 지형이 머릿속에 그려졌다.' + (g.reveal(g.player.x, g.player.y, 8), '') + g.gain({ hp: 0.5 }) },
    { text: '인사만 하고 간다', do: () => '불빛이 등 뒤로 멀어졌다.' },
  ] });
S({ id: 'road_wreck', trigger: 'road', text: '도로 옆 구덩이에 처박힌 협회 장갑차. 문이 뜯겨 있고, 안에 물자 상자가 보인다. 핏자국은 없다.',
  choices: [
    { text: '상자를 연다', do: (g) => { const r = RNG.next(); if (r < 0.5) return '응급 물자가 들어 있었다.' + g.gain({ item: ['potion', 2], item2: null }); if (r < 0.8) return '봉인된 코어 상자였다.' + g.gain({ core: [0, 3] }); g.storyFight({ title: '장갑차에 숨어 있던 것', mobs: { tier: g.player.rankIdx, n: 1, boss: true }, win: { text: '괴수를 쓰러뜨리자 차량 깊숙한 곳에서 유물이 나왔다.', gain: { relic: true } } }); return '상자가 꿈틀거렸다.'; } },
    { text: '협회에 위치를 신고한다', do: (g) => '수거 팀이 고맙다고 했다.' + g.gain({ merit: 5 }) },
  ] });
S({ id: 'road_bandits', trigger: 'road', minRank: 1, text: '버려진 휴게소에서 복면을 쓴 각성자들이 튀어나온다. "가진 거 다 내놔. 코어도!"',
  choices: [
    { text: '싸운다', do: (g) => { g.storyFight({ title: '노상강도', mobs: { tier: g.player.rankIdx, n: 2, human: true }, win: { text: '강도들을 포박해 협회에 넘겼다. 현상금이 걸려 있던 놈들이었다.', gain: { money: 250, merit: 8 } }, lose: { text: '두들겨 맞고 지갑을 털렸다.', gain: { money: -200, injure: 1 } } }); return '먼저 움직였다.'; } },
    { text: '돈을 내준다', do: (g) => '목숨값 치고는 싸다고 생각하기로 했다.' + g.gain({ money: -150 }) },
  ] });
S({ id: 'road_signal', trigger: 'road', text: '무전기에서 잡음 섞인 구조 신호가 들린다. "…여기 세 명… 고립… 게이트 균열이…" 좌표는 이 근처다.',
  choices: [
    { text: '신호를 따라간다', do: (g) => { if (g.roll(0.6)) { g.storyFight({ title: '고립된 헌터들을 포위한 괴수', mobs: { tier: g.player.rankIdx, n: 3 }, win: { text: '세 사람을 구해 냈다. 다들 당신 이름을 몇 번이고 되뇌었다.', gain: { fame: 8, merit: 8, rep: 5 } } }); return '괴수의 포효가 가까워진다.'; } return '도착했을 땐 아무도 없었다. 무전기만 덩그러니 남아 있었다.'; } },
    { text: '협회에 전달만 한다', do: (g) => '구조대가 출동했다는 답이 왔다.' + g.gain({ merit: 2 }) },
  ] });
S({ id: 'road_shrine', trigger: 'road', field: true, text: '고갯마루에 오래된 서낭당이 있다. 오색 천이 바람에 날리고, 돌무더기 위에 동전과 코어 조각이 놓여 있다. 대붕괴 뒤에도 누군가 계속 찾아온 모양이다.',
  choices: [
    { text: '돌 하나를 얹고 빈다', do: (g) => { const p = g.player; p.buffs = p.buffs.filter((b) => b.stat !== 'luck'); p.buffs.push({ stat: 'luck', val: 1, until: g.monthKey() + 2, name: '서낭당의 가호' }); g.recalc(); return '마음이 차분해졌다. (3개월간 운 +10)'; } },
    { text: '코어 조각을 슬쩍한다', do: (g) => g.roll(0.5) ? '아무 일도 없었다.' + g.gain({ core: [-1, 2] }) : '내려오는 길에 발목을 접질렸다. 우연일까.' + g.gain({ core: [-1, 2], hp: -0.3 }) },
  ] });
S({ id: 'road_view', trigger: 'road', field: true, text: '언덕 위에서 내려다보니 멀리 무너진 도시와 그 위로 걸린 게이트 몇 개가 보인다. 이상하게 아름답다.',
  choices: [
    { text: '잠시 앉아 쉬어 간다', do: (g) => '바람이 땀을 식혀 줬다.' + g.gain({ hp: 0.3 }) },
    { text: '게이트 위치를 지도에 표시한다', do: (g) => '주변 지형이 한눈에 들어왔다.' + (g.reveal(g.player.x, g.player.y, 9), '') },
  ] });
S({ id: 'road_stray', trigger: 'road', text: '덤불 속에서 강아지만 한 새끼 괴수가 낑낑거린다. 다리를 다쳤다. 어미는 보이지 않는다.',
  choices: [
    { text: '다리를 치료해 준다', do: (g) => '새끼는 한참 당신을 따라오다 숲으로 사라졌다. 며칠 뒤 그 길엔 괴수가 얼씬도 하지 않았다.' + g.gain({ ether: 10 }) },
    { text: '처치한다', do: (g) => '코어는 작았다. 뒷맛이 썼다.' + g.gain({ core: [-1, 1] }) },
    { text: '그냥 둔다', do: () => '낑낑거리는 소리가 오래 따라왔다.' },
  ] });

// 길에서 아는 사람을 만났을 때 (시스템 호출)
S({ id: 'road_meet', trigger: 'system', npc: 'here', text: (g, c) => c.npc && c.npc.met ? '길 위에서 {npc}와(과) 마주쳤다. "어? 여기서 다 보네!"' : '길 위에서 낯선 각성자와 마주쳤다. 등급표를 보니 {npc}. 서로 경계하며 걸음을 멈췄다.',
  choices: [
    { text: '인사를 나눈다', do: (g, c) => (c.npc.personality === 'cold' ? '{npc}은(는) 고개만 까딱했다.' : '짧게 근황을 나눴다.') + g.gain({ rel: c.npc.personality === 'cold' ? 1 : 4 }, c) },
    { text: '같은 방향이면 함께 걷는다', do: (g, c) => { g.advanceDays(2, { noSave: true }); return '이틀을 함께 걸었다. 길이 짧게 느껴졌다.' + g.gain({ rel: 9 }, c); } },
    { text: '대련을 청한다', when: (g, c) => c.npc.lastSpar !== g.monthKey(), do: (g, c) => { g.queue.unshift({ type: 'spar', npcId: c.npc.id }); return '"좋지!"'; } },
    { text: '모른 척 지나간다', do: () => '발소리가 멀어졌다.' },
  ] });
