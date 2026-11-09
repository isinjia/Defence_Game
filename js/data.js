// 게임 버전 (화면 오른쪽 아래에 표시)
const GAME_VERSION = '0.162';

// ===== 게이트 크로니클: 데이터 정의 =====
// 귀곡팔황의 "경지"를 각성 등급으로, "오행"을 에테르 속성으로 옮겼다.

const RANKS = [
  { key: 'F',  name: 'F급 각성자', mult: 1.0, cost: 40,   life: 0,   color: '#8a8f98' },
  { key: 'E',  name: 'E급 각성자', mult: 1.35, cost: 90,  life: 4,   color: '#7cb47c' },
  { key: 'D',  name: 'D급 각성자', mult: 1.8, cost: 180,  life: 8,   color: '#5fa8d3' },
  { key: 'C',  name: 'C급 각성자', mult: 2.4, cost: 340,  life: 14,  color: '#8f7be8' },
  { key: 'B',  name: 'B급 각성자', mult: 3.2, cost: 600,  life: 22,  color: '#d98cf0' },
  { key: 'A',  name: 'A급 각성자', mult: 4.4, cost: 1000, life: 35,  color: '#f0b35b' },
  { key: 'S',  name: 'S급 각성자', mult: 6.2, cost: 1700, life: 55,  color: '#ff6b6b' },
  { key: 'SS', name: 'SS급 초월자', mult: 9.0, cost: 3000, life: 90, color: '#ffe066' },
];
const STAGE_NAMES = ['초기', '중기', '후기'];
const BASE_LIFESPAN = 60; // 에테르 오염으로 평균 수명이 줄었다

const ELEMENTS = {
  fire:  { name: '염(炎)', icon: '🔥', color: '#ff7a45', beats: ['wood'] },
  bolt:  { name: '뇌(雷)', icon: '⚡', color: '#ffd84d', beats: ['water'] },
  water: { name: '수(水)', icon: '💧', color: '#4fb3ff', beats: ['fire'] },
  wood:  { name: '목(木)', icon: '🌿', color: '#5fcf6a', beats: ['bolt'] },
  holy:  { name: '성(聖)', icon: '✨', color: '#fff0b3', beats: ['dark'] },
  dark:  { name: '암(暗)', icon: '🌑', color: '#a36cff', beats: ['holy'] },
};
// 상성 (docs/구현_대기목록.md 4-9): 수→염→목→뇌→수 순환(우위 ×1.5, 열세 ×0.7), 성↔암은 서로 ×1.5. 성·암과 4속성은 중립.
function elemMult(atk, def) {
  const A = ELEMENTS[atk], D = ELEMENTS[def];
  if (!A || !D) return 1;
  if (A.beats.includes(def)) return 1.5;
  if (D.beats.includes(atk)) return 0.7;
  return 1;
}
// 1 유리, -1 불리, 0 보통
function elemEdge(atk, def) { const m = elemMult(atk, def); return m > 1 ? 1 : m < 1 ? -1 : 0; }
// atk 속성이 강하게 먹히는 속성들 (설명 문구용)
function elemStrongVs(atk) { return ELEMENTS[atk] ? ELEMENTS[atk].beats.slice() : []; }
// 상성 한 줄 설명: "목에 강함 · 수에 약함", 성·암은 "암과 서로 상극"
function elemShort(e) { return ELEMENTS[e] ? ELEMENTS[e].name.replace(/\(.*\)/, '') : '무'; }
function elemVsText(e) {
  if (!ELEMENTS[e]) return '';
  const strong = ELEMENTS[e].beats; const weak = ELEMENT_KEYS.filter((k) => ELEMENTS[k].beats.includes(e));
  if (strong.length === 1 && weak.length === 1 && strong[0] === weak[0]) { const n = elemShort(strong[0]); const c = n.charCodeAt(n.length - 1); return `${n}${c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '과' : '와'} 서로 상극`; }
  return `${strong.map(elemShort).join('·')}에 강함 · ${weak.map(elemShort).join('·')}에 약함`;
}
// 옛 속성 키(v0.12 이전 저장) → 새 키
const ELEM_OLD = { ice: 'water', steel: 'wood', spirit: 'dark' };
function elemFix(e) { return e && ELEM_OLD[e] ? ELEM_OLD[e] : e; }
// 무작위 속성: 성·암은 조금 드물게 (각 12%)
const ELEM_WEIGHTS = { fire: 19, bolt: 19, water: 19, wood: 19, holy: 12, dark: 12 };
function pickElem() { return RNG.weighted(ELEMENT_KEYS, ELEMENT_KEYS.map((k) => ELEM_WEIGHTS[k])); }
const ELEMENT_KEYS = Object.keys(ELEMENTS);

// 특성: 귀곡팔황의 "선천 특성"
const TRAITS = [
  { id: 'iron_body',   name: '강철 신체',   desc: '체력 +20%, 방어 +10%', mods: { hp: 0.2, def: 0.1 } },
  { id: 'mana_sense',  name: '에테르 감응', desc: '수련 효율 +30%', mods: { train: 0.3 } },
  { id: 'quick',       name: '신속 반사',   desc: '속도 +25%', mods: { spd: 0.25 } },
  { id: 'berserk',     name: '광전사',      desc: '공격 +25%, 방어 -15%', mods: { atk: 0.25, def: -0.15 } },
  { id: 'lucky',       name: '행운아',      desc: '운 +30%, 돌파 성공률 +10%', mods: { luck: 0.3, breakthrough: 10 } },
  { id: 'cursed',      name: '불운',        desc: '운 -30%', mods: { luck: -0.3 } },
  { id: 'charisma',    name: '달변가',      desc: 'NPC 호감 상승 +50%', mods: { social: 0.5 } },
  { id: 'loner',       name: '고독',        desc: 'NPC 호감 상승 -40%, 수련 효율 +15%', mods: { social: -0.4, train: 0.15 } },
  { id: 'frail',       name: '허약',        desc: '체력 -20%, 수명 -6', mods: { hp: -0.2, life: -6 } },
  { id: 'longevity',   name: '장수 체질',   desc: '수명 +12', mods: { life: 12 } },
  { id: 'merchant',    name: '장사꾼 기질', desc: '상점 가격 -20%', mods: { price: -0.2 } },
  { id: 'glutton',     name: '탐식',        desc: '회복 아이템 효과 +50%, 가격 +10%', mods: { heal: 0.5, price: 0.1 } },
  { id: 'genius',      name: '천재',        desc: '재능 +3', mods: { talent: 3 } },
  { id: 'slow_learner',name: '둔재',        desc: '재능 -2, 수명 +5', mods: { talent: -2, life: 5 } },
  { id: 'mana_core',   name: '고밀도 코어', desc: '정신력 +30%', mods: { mp: 0.3 } },
  { id: 'reckless',    name: '무모함',      desc: '돌파 성공률 -10%, 공격 +10%', mods: { breakthrough: -10, atk: 0.1 } },
];

// 스킬: 등급 요구치(rankReq), 속성(elem), 유형(type)
// type: dmg(단일), aoe(전체), heal, buff(공격 상승), shield(방어 상승)
const SKILLS = [
  { id: 'strike',     name: '기본 타격',    elem: null,     rankReq: 0, power: 1.0, mp: 0,  type: 'dmg', price: 0, desc: '무기로 공격한다.' },
  { id: 'flame_fist', name: '염권(炎拳)',   elem: 'fire',   rankReq: 0, power: 1.5, mp: 12, type: 'dmg', price: 300, desc: '불꽃을 머금은 주먹.' },
  { id: 'static',     name: '정전기 방출',  elem: 'bolt',   rankReq: 0, power: 1.3, mp: 10, type: 'dmg', price: 300, desc: '빠르게 전격을 쏜다.' },
  { id: 'frost',      name: '물살 손길',    elem: 'water',  rankReq: 0, power: 1.4, mp: 12, type: 'dmg', price: 300, desc: '세찬 물살로 적을 후려친다.' },
  { id: 'harden',     name: '수피 갑주',    elem: 'wood',   rankReq: 0, power: 0.4, mp: 10, type: 'shield', price: 350, desc: '살갗이 단단한 나무껍질로 덮인다. 3턴간 방어력 상승.' },
  { id: 'mend',       name: '치유의 빛',    elem: 'holy',   rankReq: 0, power: 0.35, mp: 15, type: 'heal', price: 400, desc: '체력을 회복한다.' },
  { id: 'shade',      name: '그림자 송곳',  elem: 'dark',   rankReq: 0, power: 1.4, mp: 12, type: 'dmg', price: 300, desc: '발밑 그림자를 송곳처럼 세워 찌른다.' },
  { id: 'inferno',    name: '화염 폭풍',    elem: 'fire',   rankReq: 2, power: 1.2, mp: 28, type: 'aoe', price: 1500, desc: '전체 공격.' },
  { id: 'chain',      name: '연쇄 번개',    elem: 'bolt',   rankReq: 2, power: 1.1, mp: 26, type: 'aoe', price: 1500, desc: '전체 공격.' },
  { id: 'glacier',    name: '빙하 창',      elem: 'water',    rankReq: 2, power: 2.3, mp: 30, type: 'dmg', price: 1600, desc: '강력한 단일 공격.' },
  { id: 'overdrive',  name: '생장 폭주',    elem: 'wood',   rankReq: 2, power: 0.5, mp: 24, type: 'buff', price: 1600, desc: '몸속 생기를 끌어올린다. 3턴간 공격력 상승.' },
  { id: 'soulfire',   name: '흑염(黑炎)',   elem: 'dark',   rankReq: 3, power: 2.6, mp: 40, type: 'dmg', price: 4000, desc: '영혼을 태우는 검은 불꽃.' },
  { id: 'meteor',     name: '유성 낙하',    elem: 'fire',   rankReq: 4, power: 2.2, mp: 60, type: 'aoe', price: 9000, desc: '광역 괴멸.' },
  { id: 'thunder_god',name: '뇌신 강림',    elem: 'bolt',   rankReq: 4, power: 3.8, mp: 65, type: 'dmg', price: 9500, desc: '단일 대상 극대 피해.' },
  { id: 'absolute',   name: '절대영도',     elem: 'water',    rankReq: 5, power: 3.0, mp: 90, type: 'aoe', price: 20000, desc: '모든 것을 멈춘다.' },
  { id: 'rebirth',    name: '환생(還生)',   elem: 'holy',   rankReq: 5, power: 1.0, mp: 100, type: 'heal', price: 22000, desc: '체력을 전부 회복한다.' },
];

// 장비: slot(weapon/armor/acc), tier(0~7) 에 따라 능력치 생성
const EQUIP_TEMPLATES = {
  weapon: ['진동 블레이드', '마나 건틀릿', '전자기 라이플', '합금 창', '플라즈마 세이버', '유물 검'],
  armor:  ['전술 코트', '나노 섬유 수트', '세라믹 플레이트', '중장 외골격', '에테르 장막', '유물 갑주'],
  acc:    ['마나 임플란트', '신경 가속기', '행운의 칩', '코어 안정기', '유물 반지', '기억의 팬던트'],
};
const CONSUMABLES = [
  { id: 'potion',  name: '응급 회복제',  price: 120,  desc: '체력 40% 회복', effect: 'hp', val: 0.4 },
  { id: 'mana',    name: '마나 앰플',    price: 150,  desc: '정신력 50% 회복', effect: 'mp', val: 0.5 },
  { id: 'crystal', name: '에테르 결정',  price: 600,  desc: '에테르 획득 (등급 비례)', effect: 'ether', val: 25 },
  { id: 'elixir',  name: '각성 촉진제',  price: 2500, desc: '다음 돌파 성공률 +20%', effect: 'bt', val: 20 },
];

// 지역: 4x3 격자. danger(위험도)는 게이트 등급과 수련 효율에 영향
const REGIONS = [
  { id: 'gangnam',  name: '서울 강남 돔',   x: 1, y: 0, danger: 1, guild: 'baekho', ether: 1.0, desc: '관리국의 보호 아래 가장 안전한 상업 구역. 백호 시큐리티 본부.' },
  { id: 'gangbuk',  name: '서울 강북 폐구', x: 2, y: 0, danger: 3, guild: null,     ether: 1.3, desc: '첫 대붕괴 때 버려진 구역. 에테르 농도가 높고 게이트가 잦다.' },
  { id: 'incheon',  name: '인천 항만 특구', x: 0, y: 0, danger: 2, guild: 'kama',   ether: 1.0, desc: '국가 각성자 관리국(KAMA) 본청. 해상 게이트 감시 거점.' },
  { id: 'gangneung',name: '강릉 해안 전선', x: 3, y: 0, danger: 4, guild: null,     ether: 1.5, desc: '동해에서 올라오는 심해형 괴수와 맞서는 최전선.' },
  { id: 'suwon',    name: '수원 산업 벨트', x: 0, y: 1, danger: 2, guild: null,     ether: 1.1, desc: '장비 제조의 중심. 좋은 장비가 유통된다.' },
  { id: 'daejeon',  name: '대전 연구 도시', x: 1, y: 1, danger: 2, guild: 'cheongryong', ether: 1.2, desc: '청룡 연구소. 스킬 데이터 거래가 활발하다.' },
  { id: 'daegu',    name: '대구 분지 요새', x: 2, y: 1, danger: 3, guild: null,     ether: 1.2, desc: '분지에 쌓이는 에테르로 수련에 유리하지만 폭주가 잦다.' },
  { id: 'ulsan',    name: '울산 중공업 지대', x: 3, y: 1, danger: 3, guild: 'hyeonmu', ether: 1.1, desc: '현무 중공업 각성자단. 중장갑 전투의 메카.' },
  { id: 'gwangju',  name: '광주 자유 도시', x: 0, y: 2, danger: 2, guild: 'jujak',  ether: 1.1, desc: '주작 프리랜서 연합. 길드에 속하지 않은 헌터들의 집결지.' },
  { id: 'jeonju',   name: '전주 보존 구역', x: 1, y: 2, danger: 1, guild: null,     ether: 0.9, desc: '옛 도시의 모습을 지킨 평화로운 구역. 치유 스킬이 전해진다.' },
  { id: 'busan',    name: '부산 해상 도시', x: 2, y: 2, danger: 3, guild: null,     ether: 1.2, desc: '바다 위에 세운 거대 도시. 암시장이 번성한다.' },
  { id: 'jeju',     name: '제주 격리 섬',   x: 3, y: 2, danger: 5, guild: null,     ether: 2.0, desc: '최초의 게이트가 열린 곳. S급 이상만 접근을 허가받는다.' },
];

const GUILDS = {
  baekho:      { name: '백호 시큐리티', elem: 'holy',  color: '#fff0b3', fameReq: 20,  desc: '민간 경비 재벌. 규율과 장비를 중시한다.' },
  kama:        { name: '국가 각성자 관리국', elem: 'bolt', color: '#ffd84d', fameReq: 40, desc: '정부 기관. 명성이 높아야 들어갈 수 있다.' },
  cheongryong: { name: '청룡 연구소', elem: 'wood', color: '#5fcf6a', fameReq: 15,  desc: '에테르 연구 집단. 스킬 습득에 유리하다.' },
  hyeonmu:     { name: '현무 중공업 각성자단', elem: 'water', color: '#4fb3ff', fameReq: 25, desc: '기업 직속 전투단. 보수가 두텁다.' },
  jujak:       { name: '주작 프리랜서 연합', elem: 'fire', color: '#ff7a45', fameReq: 5, desc: '자유로운 헌터들의 연합. 누구나 환영.' },
};

const MONSTERS = [
  // tier 0~1
  { name: '가시털 들개',   elem: 'wood',  tier: 0, hp: 0.8, atk: 0.9, shape: 'beast' },
  { name: '산성 슬라임',   elem: 'water',    tier: 0, hp: 1.1, atk: 0.7, shape: 'slime' },
  { name: '전기 날벌레떼', elem: 'bolt',   tier: 0, hp: 0.6, atk: 1.1, shape: 'swarm' },
  { name: '빛무리 드론',   elem: 'holy',   tier: 1, hp: 0.9, atk: 1.0, shape: 'drone' },
  { name: '불꽃 쥐',       elem: 'fire',   tier: 1, hp: 0.8, atk: 1.2, shape: 'beast' },
  // tier 2~3
  { name: '이끼 골렘',     elem: 'wood',  tier: 2, hp: 1.6, atk: 0.9, shape: 'golem' },
  { name: '서리 늑대',     elem: 'water',    tier: 2, hp: 1.1, atk: 1.2, shape: 'beast' },
  { name: '뇌격 비행체',   elem: 'bolt',   tier: 3, hp: 0.9, atk: 1.5, shape: 'drone' },
  { name: '망자의 합창단', elem: 'dark',   tier: 3, hp: 1.3, atk: 1.2, shape: 'choir' },
  { name: '용암 두꺼비',   elem: 'fire',   tier: 3, hp: 1.7, atk: 1.1, shape: 'slime' },
  // tier 4~5
  { name: '가시 거미 여왕', elem: 'wood', tier: 4, hp: 2.2, atk: 1.3, shape: 'spider' },
  { name: '빙설 세이렌',   elem: 'water',    tier: 4, hp: 1.5, atk: 1.6, shape: 'ghost' },
  { name: '천둥 기수',     elem: 'bolt',   tier: 5, hp: 1.6, atk: 1.9, shape: 'flyer' },
  { name: '심판의 눈',     elem: 'holy',   tier: 5, hp: 2.0, atk: 1.7, shape: 'eye' },
  // tier 6~7
  { name: '적룡 파편체',   elem: 'fire',   tier: 6, hp: 2.6, atk: 2.0, shape: 'dragon' },
  { name: '폭풍 와이번',   elem: 'bolt',   tier: 6, hp: 2.2, atk: 2.2, shape: 'dragon' },
  { name: '고목 거신',     elem: 'wood',  tier: 6, hp: 3.0, atk: 1.8, shape: 'golem' },
  { name: '빙결 고룡',     elem: 'water',    tier: 7, hp: 2.8, atk: 2.1, shape: 'dragon' },
  { name: '심연 감시자',   elem: 'dark',   tier: 7, hp: 2.6, atk: 2.2, shape: 'eye' },
  { name: '태양의 잔해',   elem: 'fire',   tier: 7, hp: 2.4, atk: 2.4, shape: 'core' },
];

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍', '전', '고', '문', '양', '손', '배', '백', '허', '남', '심'];
const GIVEN_M = ['도윤', '시우', '하준', '지호', '준서', '건우', '현우', '우진', '민재', '서준', '태양', '강민', '재현', '승현', '유찬', '지훈', '성민', '원우', '정우', '동현'];
const GIVEN_F = ['서아', '하윤', '지유', '수아', '지안', '아린', '유나', '채원', '다은', '예린', '소율', '하린', '세아', '민서', '지원', '윤서', '가은', '시은', '연우', '은서'];
const PERSONALITIES = [
  { id: 'kind',    name: '온화', relGain: 1.3, hostile: 0.0 },
  { id: 'warlike', name: '호전', relGain: 0.8, hostile: 0.25 },
  { id: 'greedy',  name: '탐욕', relGain: 0.9, hostile: 0.1 },
  { id: 'just',    name: '의협', relGain: 1.1, hostile: 0.05 },
  { id: 'cold',    name: '냉담', relGain: 0.6, hostile: 0.1 },
];

// 랜덤 이벤트: when(state) → 발생 가능 여부, choices → 선택지
const EVENTS = [
  {
    id: 'injured_hunter',
    text: '길가에 부상당한 헌터가 쓰러져 있다. 장비 가방이 옆에 떨어져 있다.',
    choices: [
      { text: '치료해 준다', effect: (g) => { g.player.fame += 5; g.gainNpcRelationRandom(15); return '헌터는 감사를 표하고 당신의 이름을 기억했다. (명성 +5)'; } },
      { text: '가방만 챙기고 떠난다', effect: (g) => { g.player.money += 400; g.player.fame -= 8; return '죄책감이 남았지만 400크레딧을 얻었다. (명성 -8)'; } },
      { text: '그냥 지나친다', effect: () => '아무 일도 없었다.' },
    ],
  },
  {
    id: 'black_market',
    text: '뒷골목의 암시장 상인이 정체불명의 에테르 결정을 내밀며 500크레딧을 요구한다.',
    choices: [
      { text: '구매한다 (500)', effect: (g) => {
          if (g.player.money < 500) return '돈이 부족하다. 상인은 코웃음을 치며 사라졌다.';
          g.player.money -= 500;
          if (g.rng.chance(0.65)) { const v = g.etherGift(40); return `진품이었다! 에테르 +${v}.`; }
          g.player.hp = Math.max(1, g.player.hp - Math.floor(g.player.maxHp * 0.3)); return '오염된 결정이었다. 마나 역류로 체력이 깎였다.';
        } },
      { text: '거절한다', effect: () => '상인은 어깨를 으쓱하고 사라졌다.' },
    ],
  },
  {
    id: 'kid_lost',
    text: '게이트 경보가 울리는 와중에 길을 잃은 아이를 발견했다.',
    choices: [
      { text: '안전 구역까지 데려다준다', effect: (g) => { g.player.fame += 8; return '아이의 부모가 눈물을 흘리며 감사했다. (명성 +8)'; } },
      { text: '무시한다', effect: (g) => { g.player.fame -= 3; return '마음 한구석이 무겁다. (명성 -3)'; } },
    ],
  },
  {
    id: 'ruins',
    text: '붕괴된 건물 지하에서 희미한 에테르 빛이 새어 나온다. 오래된 유적 같다.',
    choices: [
      { text: '탐색한다', effect: (g) => {
          const r = g.rng.next();
          if (r < 0.4) { const v = g.etherGift(30); return `옛 각성자의 수련 기록을 발견했다. 에테르 +${v}.`; }
          if (r < 0.7) { const it = g.makeEquipment(g.rng.pick(['weapon', 'armor', 'acc']), Math.min(7, g.player.rankIdx + 1)); g.player.inventory.push(it); return `유물 장비를 발견했다: ${it.name}`; }
          g.player.hp = Math.max(1, g.player.hp - Math.floor(g.player.maxHp * 0.4)); return '함정이었다. 큰 부상을 입었다.';
        } },
      { text: '위험하다. 돌아선다', effect: () => '안전이 최우선이다.' },
    ],
  },
  {
    id: 'duel_challenge',
    text: '거리에서 거만한 헌터가 당신을 가리키며 외친다. "너 각성자지? 나와 한번 붙어보자!"',
    choices: [
      { text: '대련을 받아들인다', effect: (g) => { g.startSparWithRandomNpc(); return '대련이 시작된다!'; } },
      { text: '무시한다', effect: (g) => { g.player.fame -= 2; return '그는 당신을 겁쟁이라 비웃었다. (명성 -2)'; } },
    ],
  },
  {
    id: 'mentor',
    text: '백발의 노인이 당신의 자세를 보고 혀를 찬다. "그렇게 에테르를 돌리면 수명이 줄어. 이리 와보게."',
    choices: [
      { text: '가르침을 받는다', effect: (g) => { g.player.talent += 1; return '호흡법의 요령을 배웠다. 재능 +1.'; } },
      { text: '거절한다', effect: () => '노인은 한숨을 쉬며 떠났다.' },
    ],
  },
  {
    id: 'gate_surge',
    text: '갑작스런 에테르 폭풍! 주변 공기가 일렁이며 피부가 따끔거린다.',
    choices: [
      { text: '폭풍을 흡수하려 시도한다', effect: (g) => {
          if (g.rng.chance(0.4 + g.player.talent * 0.03)) { const v = g.etherGift(50); return `폭풍의 에테르를 흡수했다! 에테르 +${v}.`; }
          g.player.hp = Math.max(1, Math.floor(g.player.hp * 0.5)); return '제어에 실패했다. 체력이 절반으로 줄었다.';
        } },
      { text: '대피한다', effect: () => '현명한 판단이었다.' },
    ],
  },
  {
    id: 'reporter',
    text: '방송국 기자가 인터뷰를 요청한다. "최근 활약 중이신 각성자시죠?"',
    when: (g) => g.player.fame >= 15,
    choices: [
      { text: '인터뷰한다', effect: (g) => { g.player.fame += 10; return '당신의 이름이 뉴스에 올랐다. (명성 +10)'; } },
      { text: '사양한다', effect: () => '조용히 자리를 떠났다.' },
    ],
  },
];

const RUMOR_TEMPLATES = [
  (n) => `${n.name}이(가) ${n.rankName}에 도달했다는 소식이다.`,
  (n) => `${n.name}이(가) 게이트 공략 중 큰 공을 세웠다고 한다.`,
  (n) => `${n.name}의 이름이 헌터 랭킹 게시판에 올랐다.`,
];

// 출신 배경
const BACKGROUNDS = [
  { id: 'chaebol', name: '재벌가 자제',   desc: '넉넉한 자금으로 시작한다. 크레딧 3000, 명성 +5.', region: 'gangnam', money: 3000, fame: 5, mods: {} },
  { id: 'orphan',  name: '보육원 출신',   desc: '가진 건 없지만 근성이 있다. 재능 +1, 크레딧 200.', region: 'jeonju', money: 200, talent: 1, mods: {} },
  { id: 'soldier', name: '특수부대 전역', desc: '실전 감각. 공격 +15%, 체력 +10%.', region: 'incheon', money: 800, mods: { atk: 0.15, hp: 0.1 } },
  { id: 'subject', name: '연구소 실험체', desc: '강제 각성의 후유증. 정신력 +30%, 수련 +15%, 수명 -6.', region: 'daejeon', money: 500, mods: { mp: 0.3, train: 0.15, life: -6 } },
  { id: 'student', name: '평범한 대학생', desc: '평범함 속의 행운. 운 +20%, 크레딧 1000.', region: 'gwangju', money: 1000, mods: { luck: 0.2 } },
];

const RARITY = [
  { name: '일반', mult: 1.0, color: '#c9ced6' },
  { name: '희귀', mult: 1.3, color: '#5fa8d3' },
  { name: '영웅', mult: 1.7, color: '#c58cff' },
  { name: '전설', mult: 2.2, color: '#f0b35b' },
];

const GATE_RANGES = { 1: [0, 1], 2: [0, 2], 3: [1, 3], 4: [2, 5], 5: [4, 7] };
const GATE_THEMES = ['폐지하철역', '침수된 쇼핑몰', '붕괴 아파트 단지', '버려진 병원', '지하 데이터센터', '해저 터널', '고대 신전', '에테르 숲', '폐공장', '무너진 고가도로'];
const GUILD_RANKS = [
  { name: '수습 단원', req: 0 },
  { name: '정식 단원', req: 100 },
  { name: '정예 단원', req: 300 },
  { name: '간부', req: 700 },
];

// ===== 샌드박스 확장 데이터 =====

// 유물 (돌파 때 바치면 영구 능력치를 얻는다)
const RELICS = [
  { id: 'magma_heart', name: '용암의 심장', stat: 'hp', val: 0.06, desc: '체력' },
  { id: 'storm_quill', name: '뇌조의 깃', stat: 'spd', val: 0.05, desc: '속도' },
  { id: 'frost_sarira', name: '빙정 사리', stat: 'def', val: 0.06, desc: '방어' },
  { id: 'steel_nerve', name: '강철 신경다발', stat: 'atk', val: 0.05, desc: '공격' },
  { id: 'soul_lamp', name: '혼등', stat: 'mp', val: 0.08, desc: '정신력' },
  { id: 'lucky_coin', name: '대붕괴 이전의 동전', stat: 'luck', val: 0.12, desc: '운' },
  { id: 'old_chip', name: '고대 연산 칩', stat: 'train', val: 0.04, desc: '수련 효율' },
  { id: 'world_sap', name: '세계수 수액', stat: 'life', val: 2, desc: '수명(년)' },
  { id: 'rift_shard', name: '균열의 파편', stat: 'atk', val: 0.08, desc: '공격' },
  { id: 'dragon_scale', name: '적룡의 비늘', stat: 'def', val: 0.09, desc: '방어' },
];

// 도시 시설
const FACILITIES = [
  { id: 'inn', name: '캡슐 호텔', desc: '크레딧과 5일을 써서 완전히 회복한다.' },
  { id: 'market', name: '헌터 마켓', desc: '장비와 소모품을 사고판다. 큰 도시엔 각성 촉매도 들어온다.' },
  { id: 'board', name: '협회 의뢰소', desc: '의뢰를 받고 보고한다. 크레딧, 협회 공적, 도시 평판을 준다.' },
  { id: 'tavern', name: '포차', desc: '술 한잔으로 기운을 얻고, 이 도시 각성자들과 가까워진다.' },
  { id: 'workshop', name: '공방', desc: '괴수 코어로 회복제와 각성 촉매를 만든다.' },
  { id: 'archive', name: '스킬 아카이브', desc: '크레딧과 협회 공적으로 스킬 데이터를 교환한다.' },
  { id: 'transit', name: '고속 이동망', desc: '가 본 도시로 빠르게 이동한다.' },
  { id: 'merc', name: '용병 사무소', desc: '할 일을 공고하면, 그 일에 끌린 헌터들이 응한다.' },
  { id: 'auction', name: '경매장', desc: '매년 5월, 유물과 전설 장비가 경매에 오른다.', big: true },
  { id: 'guild', name: '길드 본부', desc: '이 도시에 본부를 둔 길드.', guildOnly: true },
];
const BIG_CITIES = ['gangnam', 'busan', 'daegu'];

// 포차 메뉴
const DRINKS = [
  { id: 'soju', name: '소주 한 병', price: 30, desc: '이 도시 각성자 모두와 관계 +4 (한 달에 한 번)', effect: 'social' },
  { id: 'ether_cocktail', name: '에테르 칵테일', price: 220, desc: '3개월간 운 +15', effect: 'buff', buff: { stat: 'luck', val: 1.5, months: 3 } },
  { id: 'magma_whisky', name: '용암 위스키', price: 400, desc: '2개월간 공격 +12%', effect: 'buff', buff: { stat: 'atk', val: 0.12, months: 2 } },
  { id: 'calm_tea', name: '청심차', price: 150, desc: '3개월간 수련 효율 +15%', effect: 'buff', buff: { stat: 'train', val: 0.15, months: 3 } },
];

// 공방 제작법 (tier: 사용하는 코어 등급, 'rank'면 현재 등급)
const RECIPES = [
  { id: 'potion', name: '응급 회복제', cores: 1, tier: 0, credits: 40, out: 'potion', n: 2 },
  { id: 'mana', name: '마나 앰플', cores: 1, tier: 0, credits: 50, out: 'mana', n: 2 },
  { id: 'crystal', name: '에테르 결정', cores: 3, tier: 'rank', credits: 100, out: 'crystal', n: 1 },
  { id: 'catalyst', name: '각성 촉매', cores: 5, tier: 'rank', credits: 200, out: 'catalyst', n: 1 },
];

// 헌터 대회, 게이트 브레이크 등 세계 사건 이름
const SAGA = {
  tournamentMonth: 9, tournamentCity: 'gangnam', tournamentEvery: 3,
  auctionMonth: 5,
};

// ===== 이계 종족 =====
// 대붕괴 뒤 게이트 너머에서 건너와 한반도에 정착한 종족들. 일부는 각성자로 등록해 헌터로 활동한다.
const RACES = {
  human: { name: '인간', w: 70, mods: {}, groups: [] },
  orc: { name: '오크', w: 7, mods: { hp: 0.2, atk: 0.12, mp: -0.15 }, groups: ['fighter', 'guard'], desc: '강철 같은 근육과 엄니. 이계 전쟁에서 밀려나 건너온 전사 종족.',
    names: { M: ['우르그', '고르박', '카르둠', '브루나크', '타가르', '모르가쉬', '라즈곤', '두르크'], F: ['무르가', '라즈가', '오르샤', '가르나', '우르사', '타르카'] } },
  elf: { name: '엘프', w: 7, mods: { spd: 0.15, mp: 0.15, hp: -0.1 }, groups: ['shooter', 'mage', 'support'], desc: '긴 귀와 긴 수명. 숲이 불탄 세계에서 건너온 난민.',
    names: { M: ['실바렌', '엘라딘', '페아노르', '갈리엔', '아르웬도', '리안델'], F: ['세리안', '엘리네', '이스릴', '나엘리', '루시엔', '아마리스'] } },
  dwarf: { name: '드워프', w: 6, mods: { def: 0.2, hp: 0.12, spd: -0.1 }, groups: ['guard', 'fighter', 'support'], desc: '작고 단단하다. 울산 용광로에서 일하는 장인이 많다.',
    names: { M: ['두르간', '브로크', '토린바', '그림달', '발두르', '하르곤'], F: ['디스나', '헬가', '브룬힐', '마그라', '토라', '이델가'] } },
  beastkin: { name: '수인', w: 7, mods: { spd: 0.2, atk: 0.08, def: -0.05 }, groups: ['shadow', 'fighter'], desc: '짐승의 귀와 감각. 늑대족, 여우족, 고양이족이 섞여 산다.',
    names: { M: ['카야', '로웬', '티그로', '하울', '바로크', '세이른'], F: ['루나', '미야', '코하', '레이나', '시엘', '아라'] } },
  dragonkin: { name: '용인', w: 3, mods: { atk: 0.12, def: 0.12, hp: 0.1 }, groups: ['fighter', 'mage'], desc: '뿔과 비늘. 수가 적고 자존심이 높다.',
    names: { M: ['드라칸', '바르토스', '이그니르', '세라드', '카이렌'], F: ['이리스', '베라딘', '세레스', '아샤라', '니르바'] } },
};
const RACE_KEYS = Object.keys(RACES);
function rollRace(rng = Math.random) {
  const tot = RACE_KEYS.reduce((a, k) => a + RACES[k].w, 0);
  let r = rng() * tot;
  for (const k of RACE_KEYS) { r -= RACES[k].w; if (r < 0) return k; }
  return 'human';
}
// 나이대: 초상화와 상호작용에 쓰인다
function ageStage(years) { return years < 4 ? 'baby' : years < 13 ? 'child' : years < 18 ? 'teen' : years < 50 ? 'adult' : years < 65 ? 'middle' : 'elder'; }
const AGE_NAME = { baby: '아기', child: '어린이', teen: '청소년', adult: '성인', middle: '중년', elder: '노인' };

// 색상 조회 (알 수 없는 속성·계열이어도 멈추지 않게)
function elemColor(e) { return (ELEMENTS[e] && ELEMENTS[e].color) || '#9aa6b8'; }
function groupColor(g) { return (typeof CLASS_GROUPS !== 'undefined' && CLASS_GROUPS[g] && CLASS_GROUPS[g].color) || '#9aa6b8'; }
