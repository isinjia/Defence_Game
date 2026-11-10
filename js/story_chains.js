// ===== 게이트 크로니클: 연계 기연 =====
// 여러 달에 걸쳐 이어지는 장편 사연. 선택에 따라 갈래가 나뉘고, 놓쳐도 세계는 계속 흘러간다.

// ===== 1. 균열교 =====
S({ id: 'cult_0', chain: 'cult', step: 0, city: true, minRank: 1, text: '전봇대마다 같은 전단이 붙어 있다. "균열은 저주가 아니라 구원이다. 신의 문이 열릴 때, 각성하지 못한 자들도 구원받으리라. — 균열교"',
  choices: [
    { text: '적힌 주소로 가 본다', do: (g) => { g.chainNext('cult'); return '전단을 접어 주머니에 넣었다.'; } },
    { text: '찢어 버린다', do: () => '바람에 날린 전단이 하수구로 빨려 들어갔다.' },
  ] });
S({ id: 'cult_1', chain: 'cult', step: 1, city: true, text: '폐업한 예식장 지하. 백여 명의 신도가 촛불을 들고 있다. 단상의 가면 쓴 남자, \'무명\'이 외친다. "다음 보름, 우리는 스스로 문을 연다! 각성하지 못한 형제들이 신의 빛을 받으리라!" 신도 대부분이 비각성자다.',
  choices: [
    { text: '신도인 척 잠입한다', do: (g) => { g.flags.story.cult = 'spy'; g.chainNext('cult'); return '흰 로브를 받아 입었다. 옆자리 노인이 "우리 손녀도 이번에 문을 보게 될 거야"라며 웃었다.'; } },
    { text: '협회에 신고한다', do: (g) => { g.flags.story.cult = 'report'; g.chainNext('cult'); return '협회는 "증거가 부족하다"며 미적거렸지만, 감시 요원을 붙였다.' + g.gain({ merit: 6 }); } },
    { text: '무명의 말에 끌린다', do: (g) => { g.flags.story.cult = 'join'; g.chainNext('cult'); return '이상하게도 그의 말이 틀리지 않은 것 같았다. 각성하지 못해 죽어 간 사람들을 너무 많이 봤으니까.'; } },
  ] });
S({ id: 'cult_2', chain: 'cult', step: 2, text: '보름이 다가온다. 의식 장소는 강북 폐구의 버려진 지하철역. 신도들이 수십 개의 코어를 모아 인공 게이트를 열려 한다. 실패하면 일대가 날아간다.',
  choices: [
    { text: '혼자 의식을 막는다', when: (g) => g.flags.story.cult !== 'join', do: (g) => { g.storyFight({ title: '균열교 무장 신도', mobs: { tier: g.player.rankIdx, n: 3, human: true, elem: 'dark' }, win: { text: '코어 배열을 부쉈다. 신도들이 흩어지는 사이, 무명은 사라졌다.', gain: { fame: 12, merit: 12, core: [0, 4] }, chain: 'cult' } }); return '지하철역 계단을 뛰어 내려갔다.'; } },
    { text: '협회 진압팀과 함께 간다', when: (g) => g.flags.story.cult === 'report', do: (g) => { g.chainNext('cult'); return '합동 작전은 성공했다. 하지만 체포된 신도들 사이에 무명은 없었다.' + g.gain({ merit: 20, fame: 5 }); } },
    { text: '의식에 참여한다', when: (g) => g.flags.story.cult === 'join', do: (g) => { g.chainNext('cult'); g.flags.story.cultist = true; g.lifeEvent('균열교의 의식에 참여했다.'); return '인공 게이트가 열리는 순간, 엄청난 에테르가 몸을 관통했다. 비각성 신도 몇이 그 자리에서 쓰러졌다. 무명이 당신을 바라보며 웃었다. "역시, 너는 선택받았어."' + g.gain({ ether: 150, life: -3 }); } },
  ] });
S({ id: 'cult_3', chain: 'cult', step: 3, gap: 3, minRank: 2, text: '무명에게서 직접 연락이 왔다. 가면을 벗은 그는 대붕괴 당시 관리국 수석 연구원이었다. "게이트는 재앙이 아니야. 진화의 문이다. 정부는 그걸 독점하려고 거짓말을 했지. 마지막 의식을 함께하자. 아니면 막아 보든가."',
  choices: [
    { text: '그를 막는다', do: (g) => { g.storyFight({ title: '균열교 교주 무명', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true, human: true, elem: 'dark', name: '[교주] 무명' }, win: { text: '무명이 무릎을 꿇었다. "…그래도 문은 언젠가 열린다." 그가 남긴 수첩에는 제주에 관한 메모가 빼곡했다.', gain: { fame: 30, merit: 30, relic: 2 }, life: '균열교 교주 무명을 쓰러뜨렸다.', chainEnd: 'cult' } }); return '무명이 손을 펼치자 공간이 찢어졌다.'; } },
    { text: '그의 사도가 된다', when: (g) => g.flags.story.cultist, do: (g) => { g.chainEnd('cult'); g.flags.story.apostle = true; g.lifeEvent('균열교의 사도가 되었다.'); g.rumor(`충격: 유명 헌터 ${g.player.name}, 균열교 사도로 활동 정황.`); g.setClass('apostle', '히든 직업 각성'); return '무명이 당신 이마에 손을 얹었다. 금지된 지식이 흘러들었다. 히든 직업 [심연의 사도]. 세상의 시선은 차가워졌다.' + g.gain({ relic: 3, ether: 200, fame: -60, merit: -60 }); } },
    { text: '외면한다', do: (g) => { g.chainEnd('cult'); g.rumor('균열교가 다시 활동을 시작했다는 제보가 이어진다.'); return '전화를 끊었다. 그 뒤로 균열교 소식은 뉴스에서만 들었다.'; } },
  ] });

// ===== 2. 잃어버린 가족 =====
S({ id: 'fam_0', chain: 'family', step: 0, minRank: 1, once: true, text: '우편함에 낡은 봉투가 꽂혀 있다. 10년 전 게이트 사고로 실종된 혈육의 사진. 뒷면에 낯선 글씨: "강릉 해안 전선에서 이 사람을 봤습니다."',
  choices: [
    { text: '찾아 나선다', do: (g) => { g.flags.story.sib = g.player.name[0] + RNG.pick(g.player.gender === 'M' ? GIVEN_F.concat(GIVEN_M) : GIVEN_M.concat(GIVEN_F)); g.chainNext('family'); return `사진 속 ${g.flags.story.sib}은(는) 열두 살 그대로 웃고 있었다. 강릉으로 가야 한다.`; } },
    { text: '장난이라 생각하고 버린다', do: () => '봉투를 버렸지만, 그날 밤 잠이 오지 않았다.' },
  ] });
S({ id: 'fam_1', chain: 'family', step: 1, gap: 0, region: 'gangneung', text: () => '해안 전선의 늙은 상사가 사진을 보고 한참 말이 없다. "…심해 게이트에서 혼자 걸어 나온 애가 있었지. 기억을 다 잃었더라고. 부산 쪽 사람들이 데려갔어. 좋은 사람들은 아니었고."',
  choices: [{ text: '부산으로 향한다', do: (g) => { g.chainNext('family'); return '주먹을 쥐었다.' + g.gain({ ether: 15 }); } }] });
S({ id: 'fam_2', chain: 'family', step: 2, gap: 0, region: 'busan', text: (g) => `부산 암시장 뒷골목. "기억 없는 헌터"를 빚으로 묶어 게이트 총알받이로 쓰는 조직이 있다. 창고 안, 목줄 같은 추적 장치를 찬 사람들 사이에 ${g.flags.story.sib}이(가) 있다.`,
  choices: [
    { text: '창고를 습격한다', do: (g) => { g.storyFight({ title: '암시장 조직원', mobs: { tier: Math.max(1, g.player.rankIdx), n: 3, human: true }, win: { text: `조직원들을 쓰러뜨리고 추적 장치를 끊었다. ${g.flags.story.sib}이(가) 멍하니 당신을 본다.`, gain: { fame: 8 }, chain: 'family' } }); return '문을 걷어찼다.'; } },
    { text: '빚을 대신 갚는다', do: (g) => { const a = Math.round(2500 * RANKS[g.player.rankIdx].mult); if (g.player.money < a) return `몸값은 ${fmt(a)} 크레딧. 지금은 부족하다.`; g.player.money -= a; g.chainNext('family'); return '조직 두목이 웃으며 열쇠를 던졌다.'; } },
  ] });
S({ id: 'fam_3', chain: 'family', step: 3, gap: 1, text: (g) => `${g.flags.story.sib}은(는) 당신을 기억하지 못한다. 그래도 매일 찾아가 옛날이야기를 들려줬다. 어느 날, ${g.flags.story.sib}이(가) 문득 말했다. "…놀이터 미끄럼틀. 네가 떨어졌을 때 내가 울었잖아."`,
  choices: [{ text: '끌어안는다', do: (g) => {
    const n = g.makeNpc(false); n.name = g.flags.story.sib; n.gender = RNG.chance(0.5) ? 'M' : 'F';
    n.rankIdx = Math.max(1, g.player.rankIdx - 1); n.stage = 0; n.ageMonths = (g.ageYears() + RNG.int(-3, 3)) * 12; n.region = g.player.region;
    n.met = true; n.relation = 90; n.personality = 'kind'; n.lifespan = Math.max(n.lifespan, g.ageYears() + 30); n.parents = []; n.family = true;
    g.npcs.push(n); g.chainEnd('family');
    g.lifeEvent(`10년 만에 혈육 ${n.name}을(를) 되찾았다.`);
    return `${n.name}이(가) 돌아왔다. 인물 창에서 동료로 삼을 수 있다.` + g.gain({ fame: 10, hp: 1 });
  } }] });

// ===== 3. 제주의 목소리 =====
S({ id: 'voice_0', chain: 'voice', step: 0, minRank: 2, text: '꿈을 꿨다. 검은 바다 건너, 하늘까지 닿은 문. 문 너머에서 누군가 당신의 이름을 부른다. 깨어 보니 베개가 에테르로 젖어 있었다.',
  choices: [{ text: '꿈을 기록해 둔다', do: (g) => { g.chainNext('voice'); return '같은 꿈을 꾸는 헌터가 또 있을까.' + g.gain({ ether: 20 }); } }] });
S({ id: 'voice_1', chain: 'voice', step: 1, region: 'daejeon', minRank: 3, text: '청룡 연구소 지하 기록 보관소. 아는 연구원이 몰래 문을 열어 줬다. "대붕괴 사흘 전, 제주에서 \'공명 실험\'이 있었어요. 기록은 거기서 끊겨요."',
  choices: [
    { text: '자료를 복사한다', do: (g) => { g.chainNext('voice'); return '실험 책임자 명단 맨 위에 \'무명\'이라는 이름이 있었다.' + g.gain({ merit: -5 }); } },
    { text: '연구원을 설득해 정식 열람 허가를 받는다', do: (g) => { g.chainNext('voice'); return '시간은 걸렸지만 떳떳하게 자료를 얻었다.' + (g.advanceDays(10), '') + g.gain({ merit: 5 }); } },
  ] });
S({ id: 'voice_2', chain: 'voice', step: 2, region: 'incheon', minRank: 4, text: '관리국 본청 기밀 서버. 문서 제목: "원초 게이트 개방 경위". 첫 문장에서 손이 떨렸다. "게이트는 열린 것이 아니라, 우리가 열었다."',
  choices: [
    { text: '언론에 폭로한다', do: (g) => { g.flags.story.voice = 'expose'; g.chainNext('voice'); g.lifeEvent('관리국의 원초 게이트 은폐를 폭로했다.'); g.rumor('대특종: "대붕괴는 인재였다" — 관리국 기밀 유출, 국회 긴급 소집.'); return '나라가 뒤집혔다.' + g.gain({ fame: 60, merit: -50 }); } },
    { text: '국장과 거래한다', do: (g) => { g.flags.story.voice = 'deal'; g.chainNext('voice'); return '국장은 침묵의 대가로 협회 최고 등급 지원을 약속했다.' + g.gain({ merit: 50, catalyst: 1, money: 2000 }); } },
    { text: '혼자 간직한다', do: (g) => { g.flags.story.voice = 'keep'; g.chainNext('voice'); return '진실의 무게를 혼자 지기로 했다.' + g.gain({ ether: 40 }); } },
  ] });
S({ id: 'voice_3', chain: 'voice', step: 3, minRank: 5, gap: 3, text: '제주 출신 노인이 당신을 찾아왔다. 대붕괴의 유일한 생존자라고 한다. "그날 문이 열리고 처음 나온 건 괴물이 아니었어. 사람이었어. 우리랑 똑같이 생긴. 그 사람이 울면서 \'닫아 달라\'고 했지."',
  choices: [{ text: '노인의 말을 새긴다', do: (g) => { g.chainNext('voice'); return '문 너머에도 누군가 있다.' + g.gain({ ether: 60 }); } }] });
S({ id: 'voice_4', chain: 'voice', step: 4, region: 'jeju', minRank: 6, text: '한라산 정상, 원초의 게이트 앞. 꿈속의 목소리가 이번엔 또렷하다. "너는 열쇠다. 문을 닫으면 저편의 우리도 끝난다. 문을 열어 두면 이편의 너희가 끝난다. 선택해."',
  choices: [
    { text: '"닫겠다"', do: (g) => { g.flags.story.voiceEnd = 'seal'; g.chainEnd('voice'); g.setClass('gatekeeper', '히든 직업 각성'); g.player.relicBonus.atk = (g.player.relicBonus.atk || 0) + 0.15; g.recalc(); return '목소리가 슬프게 웃었다. "…고마워. 우리도 그걸 원했어." 문의 약점이 보이기 시작했다. (공격 영구 +15%)'; } },
    { text: '"함께 사는 길은 없나"', do: (g) => { g.flags.story.voiceEnd = 'bridge'; g.chainEnd('voice'); g.setClass('gatekeeper', '히든 직업 각성'); g.player.relicBonus.def = (g.player.relicBonus.def || 0) + 0.15; g.recalc(); return '긴 침묵. "…그런 질문을 한 건 네가 처음이야." 문이 조금 잦아들었다. (방어 영구 +15%)'; } },
  ] });

// ===== 4. 피험자 7번 (연구소 실험체 출신) =====
S({ id: 'sub_0', chain: 'subject', step: 0, when: (g) => g.player.bg === 'subject', text: '모르는 번호로 문자가 왔다. "나야, 7번. 연구소에서 같이 있었던. 우리 기수 피험자들이 한 명씩 사라지고 있어. 너도 조심해."',
  choices: [{ text: '7번을 만나러 간다', do: (g) => { g.chainNext('subject'); return '약속 장소는 대전 외곽의 버스 정류장.'; } }] });
S({ id: 'sub_1', chain: 'subject', step: 1, gap: 1, text: '약속 장소에 7번은 없었다. 대신 검은 정장 둘이 다가온다. "피험자 12번, 동행해 주시죠." 관리국 \'청소부\'다.',
  choices: [{ text: '싸운다', do: (g) => { g.storyFight({ title: '관리국 청소부', mobs: { tier: g.player.rankIdx, n: 2, human: true, elem: 'wood' }, win: { text: '청소부의 품에서 7번의 신분증과 좌표가 적힌 쪽지가 나왔다.', gain: { merit: -5 }, chain: 'subject' } }); return '정장 사내들이 총을 뽑았다.'; } }] });
S({ id: 'sub_2', chain: 'subject', step: 2, minRank: 2, text: '좌표는 울산 해안의 폐조선소. 지하에 아직 가동 중인 연구 시설이 있다. 유리관 속에 아이들이 잠들어 있다. 강제 각성 실험이 계속되고 있었다.',
  choices: [
    { text: '아이들을 구출한다', do: (g) => { g.storyFight({ title: '시설 경비 시스템', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true, shape: 'golem', elem: 'wood', name: '[실험체] 0번' }, win: { text: '아이들을 모두 데리고 나왔다. 그중 하나가 당신 손을 꼭 잡았다.', gain: { fame: 25, rep: 10 }, life: '비밀 연구 시설에서 아이들을 구해 냈다.', chain: 'subject' } }); return '경보가 울리고, 가장 안쪽 유리관이 깨졌다.'; } },
    { text: '증거만 챙겨 나온다', do: (g) => { g.chainNext('subject'); return '하드 드라이브를 품에 넣었다. 아이들의 얼굴이 눈에 밟혔다.' + g.gain({ merit: 10 }); } },
  ] });
S({ id: 'sub_3', chain: 'subject', step: 3, text: '실험의 책임자가 화상 통화를 걸어 왔다. "12번, 너는 우리 최고의 성공작이야. 돌아오면 S급까지 보장하지. 수명도."',
  choices: [
    { text: '모든 걸 폭로한다', do: (g) => { g.chainEnd('subject'); g.lifeEvent('강제 각성 실험을 세상에 알렸다.'); g.rumor('관리국 강제 각성 실험 폭로 파문. 책임자 긴급 체포.'); return '책임자는 체포됐다. 당신의 과거도 뉴스에 실렸지만, 후회는 없다.' + g.gain({ fame: 40, talent: 1 }); } },
    { text: '거래에 응한다', do: (g) => { g.chainEnd('subject'); g.lifeEvent('연구소와 다시 손을 잡았다.'); g.setClass('heir', '히든 직업 각성'); return '주사 한 방. 몸속 에테르 회로가 다시 짜였다. 히든 직업 [대붕괴의 아이].' + g.gain({ catalyst: 1, life: 6, fame: -15 }); } },
  ] });

// ===== 5. 포차 사장님 =====
S({ id: 'pocha_0', chain: 'pocha', step: 0, trigger: 'city', minRank: 1, text: '단골 포차. 사장님이 당신 팔의 상처를 보더니 말없이 구급상자를 꺼낸다. 붕대를 감는 손놀림이 이상할 만큼 능숙하다. "옛날에 좀 다쳐 봤지."',
  choices: [{ text: '"사장님, 혹시 헌터셨어요?"', do: (g) => { g.chainNext('pocha'); return '사장님은 대답 대신 소주를 한 잔 따라 줬다.' + g.gain({ hp: 0.4 }); } }] });
S({ id: 'pocha_1', chain: 'pocha', step: 1, trigger: 'city', text: '비 오는 밤, 손님이 당신뿐이다. 사장님이 처음으로 옛날 이야기를 꺼낸다. "1세대 S급 \'흑염\'. 내 이름이었어. 백골룡 게이트에서 동료 넷을 잃고 칼을 놨지."',
  choices: [{ text: '끝까지 듣는다', do: (g) => { g.chainNext('pocha'); return '그날 밤 사장님은 세 병을 비웠다.' + g.gain({ ether: 25 }); } }] });
S({ id: 'pocha_2', chain: 'pocha', step: 2, gap: 2, minRank: 2, text: '긴급 속보: 동해에서 백골룡 개체 재출현. 포차 셔터가 내려져 있다. 쪽지 한 장: "빚은 갚아야지. — 흑염"',
  choices: [
    { text: '뒤쫓아 함께 싸운다', do: (g) => { g.storyFight({ title: '백골룡', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 1, boss: true, shape: 'dragon', elem: 'dark', name: '[재앙] 백골룡' }, ally: { name: '흑염', rank: Math.min(7, g.player.rankIdx + 2), elem: 'fire' }, win: { text: '백골룡이 쓰러졌다. 흑염은 피투성이로 웃었다. "…이제야 애들한테 갈 낯이 서네."', gain: { fame: 30 }, chain: 'pocha' }, lose: { text: '패배했다. 흑염이 당신을 업고 빠져나왔다. 그는 돌아오지 않았다.', gain: { injure: 3 }, chainEnd: 'pocha' } }); return '강릉으로 달렸다.'; } },
    { text: '그의 선택을 존중한다', do: (g) => { g.chainEnd('pocha'); g.rumor('은퇴한 1세대 S급 \'흑염\', 백골룡과 동귀어진.'); return '며칠 뒤, 포차 자리에 꽃이 쌓였다.'; } },
  ] });
S({ id: 'pocha_3', chain: 'pocha', step: 3, trigger: 'city', text: '포차가 다시 문을 열었다. 흑염이 낡은 검집을 내민다. "나는 이제 진짜 은퇴다. 이건 네가 써. 그리고… 내 기술도 좀 가르쳐 줄게."',
  choices: [
    { text: '두 손으로 받는다', do: (g) => { g.chainEnd('pocha'); g.lifeEvent('1세대 S급 흑염의 검을 물려받았다.'); g.setClass('blackflame', '히든 직업 각성'); return '검을 쥐는 순간 검은 불꽃이 손목을 타고 올랐다. 히든 직업 [흑염검사]에 각성했다.' + g.gain({ relic: 3, equip: 1 }); } },
    { text: '검만 받고 내 길을 간다', do: (g) => { g.chainEnd('pocha'); g.lifeEvent('1세대 S급 흑염의 검을 물려받았다.'); return '"그래, 네 방식대로 가라." 흑염이 웃었다.' + g.gain({ skill: true, relic: 3, equip: 1 }); } },
  ] });

// ===== 6. 고철 드론 누리 =====
S({ id: 'nuri_0', chain: 'nuri', step: 0, field: true, text: '폐허 더미 속에서 손바닥만 한 드론이 깜빡인다. 스피커에서 갈라진 소리가 난다. "도…와…줘…"',
  choices: [
    { text: '데려간다', do: (g) => { g.chainNext('nuri'); return '드론을 품에 넣었다. 따뜻했다. 기계인데.'; } },
    { text: '고철상에 판다', do: (g) => { g.chainEnd('nuri'); return '고철값을 받았다.' + g.gain({ money: 30 }); } },
  ] });
S({ id: 'nuri_1', chain: 'nuri', step: 1, gap: 1, city: true, text: '공방 기술자가 드론을 열어 보고 휘파람을 분다. "이거 지구 기술이 아닌데요? 살리려면 코어가 3개는 필요해요."',
  choices: [
    { text: '코어를 넣는다', when: (g) => g.coreCount(g.player.rankIdx) + g.coreCount(Math.max(0, g.player.rankIdx - 1)) >= 3, do: (g) => { let need = 3; for (const t of [g.player.rankIdx, Math.max(0, g.player.rankIdx - 1)]) { const u = Math.min(need, g.coreCount(t)); g.player.mats['c' + t] -= u; need -= u; } g.chainNext('nuri'); return '드론의 눈이 파랗게 켜졌다. "안녕. 나는… 누리. 이름은 방금 지었어."'; } },
    { text: '나중에 다시 오겠다', do: () => '기술자가 드론을 조심스럽게 돌려줬다.' },
  ] });
S({ id: 'nuri_2', chain: 'nuri', step: 2, gap: 2, text: '누리가 말을 꽤 잘하게 됐다. 뉴스를 보며 "인간은 왜 서로 싸워?"라고 묻는다. 게이트 근처에선 에테르 흐름을 읽어 약점을 알려 준다.',
  choices: [{ text: '"같이 배워 가자"', do: (g) => { g.chainNext('nuri'); g.player.relicBonus.luck = (g.player.relicBonus.luck || 0) + 1.5; g.recalc(); return '누리가 어깨에 앉아 함께 다니기 시작했다. (운 영구 +15)'; } }] });
S({ id: 'nuri_3', chain: 'nuri', step: 3, gap: 4, minRank: 3, text: '누리가 처음으로 망설이며 말한다. "기억이 돌아왔어. 나는 게이트 너머에서 온 탐사기야. 저편 사람들이 이쪽을 이해하려고 보냈어. 이제… 돌아가서 보고해야 해."',
  choices: [
    { text: '돌려보낸다', do: (g) => { g.chainEnd('nuri'); g.lifeEvent('누리를 게이트 너머로 돌려보냈다.'); return '누리는 마지막으로 당신 뺨에 부딪혔다. "인간은 싸우지만, 너 같은 인간도 있다고 말할게." 남은 자리에 빛나는 결정이 떨어져 있었다.' + g.gain({ relic: 3 }); } },
    { text: '"남아 줘"', do: (g) => { g.chainEnd('nuri'); g.player.relicBonus.train = (g.player.relicBonus.train || 0) + 0.08; g.recalc(); g.lifeEvent('누리가 곁에 남기로 했다.'); g.setClass('machinist', '히든 직업 각성'); return '히든 직업 [기계 교감자]에 각성했다. ' + '누리는 오래 깜빡이다 대답했다. "…응. 보고서는 천천히 써도 되겠지." (수련 효율 영구 +8%)'; } },
  ] });

// ===== 7. 부산 암시장 =====
S({ id: 'smug_0', chain: 'smuggle', step: 0, region: 'busan', minRank: 2, text: '부산 항구 컨테이너 사이에서 선글라스 쓴 남자가 다가온다. "오징어"라고 불린다. "코어 운반 한 건. 세관만 피해 주면 일반 의뢰 열 배."',
  choices: [
    { text: '받아들인다', do: (g) => { g.flags.story.smug = 'in'; g.chainNext('smuggle'); return '첫 운반은 싱겁게 끝났다.' + g.gain({ money: 900, merit: -8 }); } },
    { text: '관리국에 정보를 넘긴다', do: (g) => { g.flags.story.smug = 'mole'; g.chainNext('smuggle'); return '관리국은 당신에게 이중 첩자를 제안했다.' + g.gain({ merit: 10 }); } },
    { text: '거절한다', do: () => '"아쉽네. 마음 바뀌면 3번 부두로 와."' },
  ] });
S({ id: 'smug_1', chain: 'smuggle', step: 1, region: 'busan', text: '오징어가 신임을 보인다. "큰 건이야. 회장님 물건. 경쟁 조직 \'흑룡\'이 노리고 있어. 호위 좀 해 줘."',
  choices: [{ text: '호위한다', do: (g) => { g.storyFight({ title: '흑룡파 습격', mobs: { tier: g.player.rankIdx, n: 3, human: true }, win: { text: '물건을 지켜 냈다. 회장이 직접 보자고 한다.', gain: { money: 1200 }, chain: 'smuggle' } }); return '부두에 안개가 낀다. 총성이 울렸다.'; } }] });
S({ id: 'smug_2', chain: 'smuggle', step: 2, region: 'busan', gap: 2, text: '해상 요트에서 만난 \'최회장\'이 웃는다. "자네 실력 좋더군. 그래서 미안하네. 관리국에 내줄 희생양이 하나 필요하거든." 사방에서 무장한 각성자들이 일어선다.',
  choices: [{ text: '돌파한다', do: (g) => { g.storyFight({ title: '최회장의 경호대', mobs: { tier: Math.min(7, g.player.rankIdx + 1), n: 2, human: true, boss: true, name: '[암시장 왕] 최회장' }, lethal: true, win: { text: '최회장이 갑판에 쓰러졌다. 부산 암시장의 왕좌가 비었다.', gain: { fame: 10 }, chain: 'smuggle' } }); return '요트가 흔들렸다.'; } }] });
S({ id: 'smug_3', chain: 'smuggle', step: 3, region: 'busan', gap: 1, text: '오징어가 무릎을 꿇는다. "이제 형님이 왕입니다. 아니면… 전부 관리국에 넘기시든가요."',
  choices: [
    { text: '왕좌에 앉는다', do: (g) => { g.chainEnd('smuggle'); g.flags.story.kingpin = true; g.lifeEvent('부산 암시장의 왕이 되었다.'); return '매달 상납금이 들어온다. 협회는 당신을 의심의 눈으로 본다.' + g.gain({ money: 5000, merit: -40, fame: -10 }); } },
    { text: '조직을 통째로 넘긴다', do: (g) => { g.chainEnd('smuggle'); g.lifeEvent('부산 암시장 조직을 일망타진했다.'); g.rumor(`${g.player.name}, 부산 최대 밀수 조직 일망타진.`); return '관리국 역사상 최대 검거였다.' + g.gain({ merit: 60, fame: 25, rep: 20 }); } },
  ] });

// ===== 8. 백호 가문의 후계 =====
S({ id: 'baekho_0', chain: 'baekho', step: 0, region: 'gangnam', minRank: 3, when: (g) => g.player.fame >= 40, text: '백호 시큐리티 회장이 직접 연락했다. "손주 놈 경호를 맡아 주게. 요즘 집안이 시끄러워서 말이야. 길드 사람은 못 믿겠네."',
  choices: [
    { text: '수락한다', do: (g) => { const n = g.makeNpc(false); n.name = '백' + RNG.pick(GIVEN_M.concat(GIVEN_F)); n.rankIdx = Math.max(1, g.player.rankIdx - 2); n.region = 'gangnam'; n.met = true; n.relation = 20; n.guild = 'baekho'; n.ageMonths = 22 * 12; n.personality = 'cold'; g.npcs.push(n); g.flags.story.heir = n.id; g.chainNext('baekho'); return `회장의 손주 ${n.name}은(는) 첫인사부터 퉁명스러웠다. "경호 필요 없어."` + g.gain({ money: 800 }); } },
    { text: '거절한다', do: () => '"아쉽군."' },
  ] });
S({ id: 'baekho_1', chain: 'baekho', step: 1, region: 'gangnam', text: (g) => { const n = g.npcById(g.flags.story.heir); return `${n ? n.name : '손주'}의 차량 행렬. 고가도로 위에서 트럭이 돌진한다. 암살이다.`; },
  choices: [{ text: '막아선다', do: (g) => { g.storyFight({ title: '암살자들', mobs: { tier: g.player.rankIdx, n: 3, human: true, elem: 'dark' }, win: { text: '암살자를 제압했다. 품에서 백호 시큐리티 내부 출입증이 나왔다.', gain: { fame: 6 }, chain: 'baekho' } }); const n = g.npcById(g.flags.story.heir); if (n) g.changeRel(n, 30); return '트럭 위에서 복면들이 뛰어내렸다.'; } }] });
S({ id: 'baekho_2', chain: 'baekho', step: 2, region: 'gangnam', text: (g) => { const n = g.npcById(g.flags.story.heir); return `배후는 회장의 장남, 그러니까 ${n ? n.name : '손주'}의 큰아버지였다. 장남이 먼저 찾아와 봉투를 내민다. "조카만 \'사고\'로 정리되면 자네는 우리 길드 간부야."`; },
  choices: [
    { text: '회장에게 모두 알린다', do: (g) => { g.chainEnd('baekho'); g.lifeEvent('백호 가문의 후계 다툼을 막았다.'); const n = g.npcById(g.flags.story.heir); if (n) g.changeRel(n, 40); return '장남은 실각했다. 회장은 당신에게 평생 빚을 졌다고 말했다.' + g.gain({ money: 4000, fame: 15, rep: 20 }); } },
    { text: '봉투를 받는다', do: (g) => { g.chainEnd('baekho'); const n = g.npcById(g.flags.story.heir); if (n) { g.killNpc(n, '고가도로 사고'); } g.lifeEvent('돈을 받고 백호 가문의 후계자를 버렸다.'); return '며칠 뒤, 후계자의 사고 소식이 뉴스에 나왔다. 통장은 두둑해졌다.' + g.gain({ money: 8000, fame: -20 }); } },
    { text: '후계자와 함께 집안을 떠난다', do: (g) => { g.chainEnd('baekho'); const n = g.npcById(g.flags.story.heir); if (n) { g.changeRel(n, 50); n.guild = null; } return '"…너 진짜 이상한 놈이다." 그래도 따라 나섰다. 둘은 광주 프리랜서 광장에서 새 출발을 했다.' + g.gain({ fame: 5 }); } },
  ] });

// ===== 특수 사건 (시스템이 직접 호출) =====
S({ id: 'npc_wedding', trigger: 'system', npc: 'friend', text: '{npc}의 청첩장이 도착했다. "꼭 와 줘. 네가 없으면 안 될 것 같아."',
  choices: [
    { text: '축의금을 두둑이 들고 간다', do: (g, c) => '눈물 나게 행복한 결혼식이었다.' + g.gain({ money: -150, rel: 15 }, c) },
    { text: '바빠서 축하 메시지만 보낸다', do: (g, c) => '"그래도 고마워."' + g.gain({ rel: -3 }, c) },
  ] });
S({ id: 'vow_revenge', trigger: 'system', npc: 'here', text: '{npc}에게서 메시지가 왔다. 단 한 줄. "{victim}을(를) 죽인 대가를 반드시 치르게 해 주마."',
  choices: [
    { text: '사과의 뜻을 전한다', do: (g, c) => g.roll(0.25) ? '긴 침묵 끝에 답장이 왔다. "…용서는 못 해. 하지만 칼은 거두지." 원한이 조금 누그러졌다.' + (c.npc && (c.npc.nemesis = null, c.npc.relation = -25), '') : '읽음 표시만 떴다.' },
    { text: '"언제든 와라"', do: () => '전쟁이 시작됐다.' },
  ] });
S({ id: 'child_born', trigger: 'system', npc: 'here', text: '아이가 태어났다. {npc}. 작은 손가락이 당신 손가락을 꽉 쥔다. 에테르 냄새가 난다. 언젠가 이 아이도 각성하겠지.',
  choices: [
    { text: '"내가 지켜 줄게"', do: (g) => '세상이 조금 달라 보였다.' + g.gain({ hp: 1, fame: 3 }) },
  ] });


// ===== 전직 시험 (C급, S급 도달 시) =====
S({ id: 'class_advance', trigger: 'system', text: (g) => { const p = g.player; const next = classById(p.cls).adv[p.clsAdv] || classById(p.cls).adv[1]; return `협회 본부에서 통지가 왔다. "${RANKS[p.rankIdx].key}급 도달을 축하합니다. [${className(p.cls, p.clsAdv)}] 계열 전직 시험 자격이 주어졌습니다. 합격 시 [${next}] 칭호가 부여됩니다."\n\n시험관은 같은 계열의 현역 헌터다. 실전 형식이다.`; },
  choices: [
    { text: '시험에 응한다', do: (g) => { const p = g.player; g.storyFight({ title: '전직 시험', mobs: { tier: p.rankIdx, n: 1, boss: true, human: true, name: '[시험관] 협회 수석 헌터' }, spar: true, win: { text: '시험관이 검을 거두며 고개를 끄덕였다. "합격."', after: (gg) => { gg.player.clsAdv = Math.min(2, gg.player.clsAdv + 1); gg.recalc(); gg.lifeEvent(`전직 시험에 합격해 [${className(gg.player.cls, gg.player.clsAdv)}]이(가) 되었다.`); } }, lose: { text: '불합격. 다음 기회에 다시 도전할 수 있다.', gain: {}, after: (gg) => gg.queue.push({ type: 'story', id: 'class_advance_retry' }) } }); return '시험장 문이 열렸다.'; } },
    { text: '나중에 응시한다', do: (g) => { g.flags.story.advPending = true; return '협회 의뢰소에서 언제든 응시할 수 있다.'; } },
  ] });
S({ id: 'class_advance_retry', trigger: 'month', when: (g) => { const p = g.player; return (p.rankIdx >= 3 && p.clsAdv < 1) || (p.rankIdx >= 6 && p.clsAdv < 2); }, weight: 3, repeat: true, text: () => RNG.pick(['협회에서 전직 시험 재응시 안내가 왔다.', '협회 의뢰소 직원이 서류철을 내민다. "전직 시험 다음 회차 접수가 열렸어요. 이번엔 붙으셔야죠?"', '휴대폰에 협회 알림이 떴다. [전직 시험 재응시 대상자 안내] 시험관 명단에 지난번 그 수석 헌터의 이름이 또 있다.', '같은 등급 헌터들이 하나둘 전직 배지를 달고 다닌다. 협회에서 재응시 일정이 담긴 메일이 왔다.']),
  choices: [{ text: '다시 도전한다', do: (g) => { g.queue.unshift({ type: 'story', id: 'class_advance' }); return '마음을 다잡았다.'; } }, { text: '아직 아니다', do: () => '조금 더 단련하기로 했다.' }] });
