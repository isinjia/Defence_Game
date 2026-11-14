// ===== 속성 스킬 추가 (사용자 요청): 속성마다 F·E·D·C급 상점 스킬이 하나씩 있게 13개를 채운다 =====
// 일반 상점은 C급까지만 판다(js/skill_foreign.js). 그림은 종류별 공용 아이콘을 쓴다.
SKILLS.push(
  { id: 'ember_rush',   name: '불씨 연타',  elem: 'fire',  rankReq: 1, power: 0.7,  mp: 16, type: 'multi',      price: 800,  desc: '불씨를 세 번 흩뿌린다.' },
  { id: 'scorch',       name: '작열',       elem: 'fire',  rankReq: 3, power: 1.5,  mp: 30, type: 'dot',        price: 4000, desc: '살을 태우는 불꽃이 3턴간 남는다.' },
  { id: 'flash_cut',        name: '섬광',       elem: 'bolt',  rankReq: 1, power: 1.5,  mp: 14, type: 'crit',       price: 800,  desc: '번쩍이는 순간 급소를 찌른다.' },
  { id: 'thunderbolt',  name: '낙뢰',       elem: 'bolt',  rankReq: 3, power: 2.6,  mp: 34, type: 'pierce',     price: 4200, desc: '하늘에서 떨어진 번개가 방어를 꿰뚫는다.' },
  { id: 'mist',         name: '물안개',     elem: 'water', rankReq: 1, power: 0.6,  mp: 14, type: 'evade',      price: 800,  desc: '물안개 속으로 몸을 숨긴다.' },
  { id: 'tidal',        name: '해일',       elem: 'water', rankReq: 3, power: 1.5,  mp: 40, type: 'aoe',        price: 4200, desc: '거센 물결이 적 전체를 덮친다.' },
  { id: 'vine_bind',    name: '덩굴 묶기',  elem: 'wood',  rankReq: 1, power: 1.0,  mp: 18, type: 'stun',       price: 900,  desc: '덩굴이 적의 발을 묶는다.' },
  { id: 'earth_breath', name: '대지의 숨',  elem: 'wood',  rankReq: 3, power: 0.3,  mp: 36, type: 'heal_all',   price: 4000, desc: '땅의 생기가 파티 모두를 감싼다.' },
  { id: 'light_veil',   name: '빛의 장막',  elem: 'holy',  rankReq: 1, power: 0.4,  mp: 20, type: 'shield_all', price: 900,  desc: '빛의 장막이 파티의 방어를 올린다.' },
  { id: 'radiance',     name: '성광',       elem: 'holy',  rankReq: 2, power: 2.1,  mp: 26, type: 'dmg',        price: 1600, desc: '응축한 빛을 쏘아낸다.' },
  { id: 'purify_light', name: '정화의 빛',  elem: 'holy',  rankReq: 3, power: 0.35, mp: 40, type: 'heal_all',   price: 4200, desc: '맑은 빛이 파티의 상처를 씻는다.' },
  { id: 'hex',          name: '저주',       elem: 'dark',  rankReq: 1, power: 0.3,  mp: 16, type: 'debuff',     price: 800,  desc: '적 전체의 방어를 깎는다.' },
  { id: 'blood_drain',  name: '흡혈',       elem: 'dark',  rankReq: 2, power: 1.6,  mp: 24, type: 'drain',      price: 1600, desc: '적의 피를 빨아 체력을 되찾는다.' },
);
