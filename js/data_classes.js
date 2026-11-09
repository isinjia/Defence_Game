// ===== 게이트 크로니클: 직업 =====
// 각성할 때 직업이 판정된다. C급과 S급에서 전직하며, 특정 기연을 끝까지 따라가면 히든 직업을 얻는다.
// role: 전투 AI의 행동 방식 (tank, melee, assassin, ranged, caster, summoner, support, esper)

const CLASS_GROUPS = {
  fighter: { name: '전투계', color: '#ff8a4c' },
  guard: { name: '수호계', color: '#b8c0cc' },
  shadow: { name: '암살계', color: '#9a7bff' },
  shooter: { name: '사격계', color: '#7cd4a8' },
  mage: { name: '마법계', color: '#6fb8ff' },
  summon: { name: '소환계', color: '#c58cff' },
  support: { name: '지원계', color: '#8be08b' },
  esper: { name: '초능력계', color: '#ff6fb5' },
  east: { name: '동방계', color: '#ffd84d' },
  hidden: { name: '히든', color: '#ff4f6a' },
};
const CLASS_RARITY = ['일반', '희귀', '영웅', '히든'];

// 스킬 정의: [이름, 종류, 위력, 정신력, 설명]
// 종류: dmg aoe pierce multi crit dot stun drain debuff taunt shield_all buff_all heal_ally heal_all revive summon evade buff shield
const CLASSES = [
  // ---- 전투계
  { id: 'swordsman', g: 'fighter', name: '검사', r: 0, role: 'melee', mods: { atk: 0.12, hp: 0.05 }, adv: ['검귀', '검성'], desc: '균형 잡힌 근접 딜러. 대한민국 헌터의 표준.',
    skills: [['일섬', 'crit', 1.7, 10, '빠르게 베어 치명타율이 높다.'], ['검기 방출', 'aoe', 1.15, 26, '검기를 날려 적 전체를 벤다.'], ['발도술 · 섬광', 'pierce', 3.2, 55, '방어를 무시하는 필살의 일격.']] },
  { id: 'berserker', g: 'fighter', name: '광전사', r: 0, role: 'melee', mods: { atk: 0.22, hp: 0.12, def: -0.12 }, adv: ['혈투사', '전쟁광'], desc: '피를 볼수록 강해진다. 방어는 신경 쓰지 않는다.',
    skills: [['광란', 'buff', 0.6, 12, '3턴간 공격력 대폭 상승.'], ['피의 갈증', 'drain', 1.6, 24, '벤 만큼 체력을 회복한다.'], ['멸살 난무', 'multi', 1.4, 50, '무작위 적을 세 번 내려친다.']] },
  { id: 'lancer', g: 'fighter', name: '창술사', r: 0, role: 'melee', mods: { atk: 0.1, spd: 0.1 }, adv: ['창귀', '창신'], desc: '긴 사거리와 관통력. 갑주를 꿰뚫는다.',
    skills: [['관통 찌르기', 'pierce', 1.5, 12, '방어를 상당 부분 무시한다.'], ['회선창', 'aoe', 1.1, 24, '창을 휘둘러 주변을 쓸어낸다.'], ['천뢰창', 'stun', 2.6, 48, '번개처럼 꿰뚫어 적을 기절시킨다.']] },
  { id: 'monk', g: 'fighter', name: '무도가', r: 0, role: 'melee', mods: { hp: 0.15, spd: 0.12, atk: 0.05 }, adv: ['권왕', '무신'], desc: '맨몸이 곧 무기. 에테르를 기공으로 다룬다.',
    skills: [['연환권', 'multi', 0.8, 10, '세 번 연속으로 내지른다.'], ['내공 순환', 'heal', 0.3, 18, '기를 돌려 체력을 회복한다.'], ['파천권', 'stun', 2.8, 50, '하늘을 깨는 일권. 적을 기절시킨다.']] },
  { id: 'dualblade', g: 'fighter', name: '쌍검사', r: 1, role: 'assassin', mods: { atk: 0.14, spd: 0.18, def: -0.05 }, adv: ['쌍룡검', '검무제'], desc: '두 자루 검으로 쉴 틈 없이 몰아친다.',
    skills: [['쌍월참', 'multi', 0.95, 12, '두 검이 교차하며 세 번 벤다.'], ['검무', 'evade', 0.6, 20, '2턴간 공격을 흘려 낸다.'], ['만검귀종', 'multi', 1.9, 55, '수십 개의 검영이 쏟아진다.']] },
  // ---- 수호계
  { id: 'guardian', g: 'guard', name: '방패 기사', r: 0, role: 'tank', mods: { def: 0.3, hp: 0.25, atk: -0.1 }, adv: ['철벽', '불괴'], desc: '동료 앞을 막아서는 벽. 파티의 생명줄.',
    skills: [['도발', 'taunt', 0.6, 8, '적의 공격을 자신에게 끈다.'], ['방패 진형', 'shield_all', 0.5, 24, '파티 전체 방어력 상승.'], ['불괴의 성벽', 'shield_all', 1.2, 50, '파티 전체가 철벽이 된다.']] },
  { id: 'paladin', g: 'guard', name: '성기사', r: 1, role: 'tank', mods: { def: 0.2, hp: 0.2, mp: 0.1 }, adv: ['성전사', '성기사장'], desc: '방패와 빛. 지키면서 치유한다.',
    skills: [['성스러운 도발', 'taunt', 0.5, 10, '빛으로 적의 시선을 끈다.'], ['치유의 손길', 'heal_ally', 0.35, 22, '가장 다친 동료를 치유한다.'], ['심판의 빛', 'aoe', 1.6, 48, '빛의 기둥이 적 전체를 내려친다.']] },
  { id: 'giant', g: 'guard', name: '거인화 능력자', r: 2, role: 'tank', mods: { hp: 0.45, atk: 0.12, spd: -0.15 }, adv: ['거신', '타이탄'], desc: '몸을 거대하게 키운다. 희귀한 변신계 각성.',
    skills: [['거인화', 'shield', 0.5, 14, '몸을 키워 방어력을 높인다.'], ['대지 강타', 'stun', 1.5, 26, '땅을 내리쳐 적을 기절시킨다.'], ['타이탄의 발걸음', 'aoe', 2.0, 52, '거대한 발로 모두 짓밟는다.']] },
  // ---- 암살계
  { id: 'assassin', g: 'shadow', name: '암살자', r: 0, role: 'assassin', mods: { atk: 0.15, spd: 0.2, hp: -0.1, luck: 0.2 }, adv: ['그림자 칼날', '죽음의 사신'], desc: '급소만 노린다. 한 방이 전부다.',
    skills: [['급소 찌르기', 'crit', 2.0, 12, '치명타율이 매우 높다.'], ['은신', 'evade', 0.7, 18, '2턴간 모습을 감춘다.'], ['단말마', 'crit', 4.0, 55, '확정적인 죽음.']] },
  { id: 'thief', g: 'shadow', name: '도적', r: 0, role: 'assassin', mods: { spd: 0.22, luck: 0.4 }, adv: ['괴도', '그림자 왕'], desc: '빠르고 운이 좋다. 전리품을 더 챙긴다.',
    skills: [['기습', 'crit', 1.6, 8, '먼저 치고 빠진다.'], ['연막탄', 'evade', 0.6, 16, '연막으로 공격을 피한다.'], ['그림자 습격', 'multi', 1.5, 45, '그림자에서 연속 공격.']] },
  { id: 'poisoner', g: 'shadow', name: '독술사', r: 1, role: 'assassin', mods: { atk: 0.08, spd: 0.1, mp: 0.15 }, adv: ['독왕', '만독불침'], desc: '독은 시간이 해결해 준다.',
    skills: [['독침', 'dot', 1.0, 10, '맹독으로 3턴간 피해를 준다.'], ['독무', 'aoe', 0.9, 26, '독안개로 전체를 공격한다.'], ['만독귀원', 'dot', 2.8, 50, '모든 독을 하나로 응축한다.']] },
  // ---- 사격계
  { id: 'archer', g: 'shooter', name: '궁수', r: 0, role: 'ranged', mods: { atk: 0.12, spd: 0.1 }, adv: ['신궁', '천궁'], desc: '에테르 화살로 멀리서 정확히.',
    skills: [['속사', 'multi', 0.8, 10, '세 발을 연달아 쏜다.'], ['화살비', 'aoe', 1.15, 26, '하늘에서 화살이 쏟아진다.'], ['일시천궁', 'pierce', 3.3, 55, '하늘을 꿰뚫는 한 발.']] },
  { id: 'sniper', g: 'shooter', name: '저격수', r: 1, role: 'ranged', mods: { atk: 0.25, spd: -0.05, luck: 0.2 }, adv: ['데드아이', '일격필살'], desc: '느리지만 한 발이 전부를 끝낸다.',
    skills: [['조준 사격', 'crit', 2.1, 12, '정밀하게 급소를 노린다.'], ['철갑탄', 'pierce', 2.0, 24, '방어를 꿰뚫는다.'], ['일격필살', 'crit', 4.4, 60, '단 한 발.']] },
  { id: 'gunslinger', g: 'shooter', name: '총잡이', r: 0, role: 'ranged', mods: { atk: 0.1, spd: 0.15 }, adv: ['건마스터', '총신'], desc: '쌍권총과 에테르 탄환. 화끈하다.',
    skills: [['난사', 'multi', 0.85, 10, '무작위로 세 발.'], ['폭발탄', 'aoe', 1.1, 24, '터지는 탄환.'], ['데스페라도', 'multi', 1.8, 52, '탄창을 전부 비운다.']] },
  // ---- 마법계
  { id: 'elementalist', g: 'mage', name: '원소술사', r: 0, role: 'caster', mods: { mp: 0.3, atk: 0.12, hp: -0.1 }, adv: ['대마법사', '원소의 군주'], desc: '자신의 속성을 극한까지 끌어낸다.',
    skills: [['원소탄', 'dmg', 1.6, 12, '속성의 힘을 응축해 쏜다.', 'self'], ['원소 폭풍', 'aoe', 1.3, 28, '속성의 폭풍이 휘몰아친다.', 'self'], ['원소 붕괴', 'aoe', 2.3, 60, '세계의 속성이 무너진다.', 'self']] },
  { id: 'warlock', g: 'mage', name: '흑마법사', r: 1, role: 'caster', mods: { mp: 0.25, atk: 0.15, def: -0.08 }, adv: ['저주술사', '흑마도사'], desc: '저주와 흡수. 금지된 술식을 다룬다.',
    skills: [['약화 저주', 'debuff', 0.4, 12, '적의 방어를 3턴간 깎는다.'], ['생명 흡수', 'drain', 1.5, 22, '적의 생명을 빼앗는다.'], ['파멸의 의식', 'aoe', 2.2, 58, '어둠이 모두를 삼킨다.']] },
  { id: 'warder', g: 'mage', name: '결계사', r: 1, role: 'support', mods: { mp: 0.3, def: 0.15 }, adv: ['결계왕', '절대영역'], desc: '공간을 봉쇄하고 동료를 지킨다.',
    skills: [['보호 결계', 'shield_all', 0.6, 16, '파티 전체 방어 상승.'], ['봉인진', 'stun', 1.2, 24, '적을 결계에 가둔다.'], ['절대영역', 'shield_all', 1.5, 55, '어떤 것도 들어올 수 없다.']] },
  { id: 'chronomancer', g: 'mage', name: '시공술사', r: 2, role: 'caster', mods: { spd: 0.3, mp: 0.25 }, adv: ['시간 조율자', '시공의 지배자'], desc: '시간을 비틀어 싸운다. 극히 드문 각성.',
    skills: [['가속', 'buff_all', 0.35, 16, '파티 전체 공격 상승.'], ['시간 정지', 'stun', 1.3, 30, '적의 시간을 멈춘다.'], ['인과 역전', 'revive', 0.5, 70, '쓰러진 동료를 되돌린다.']] },
  // ---- 소환계
  { id: 'summoner', g: 'summon', name: '소환사', r: 1, role: 'summoner', mods: { mp: 0.3, hp: -0.05 }, adv: ['대소환사', '정령왕'], desc: '계약한 정령을 불러낸다.',
    skills: [['정령 소환', 'summon', 0.5, 20, '정령 하나를 불러낸다.'], ['정령 강화', 'buff_all', 0.4, 22, '파티 전체 공격 상승.'], ['정령왕 강림', 'summon', 0.9, 60, '정령왕을 불러낸다.']] },
  { id: 'necromancer', g: 'summon', name: '사령술사', r: 2, role: 'summoner', mods: { mp: 0.3, atk: 0.1 }, adv: ['망자의 지휘자', '사령왕'], desc: '쓰러진 것들을 일으켜 세운다.',
    skills: [['망자 소생', 'summon', 0.45, 18, '해골 병사를 일으킨다.'], ['영혼 흡수', 'drain', 1.4, 22, '영혼을 빨아들인다.'], ['망자의 군단', 'summon', 0.8, 55, '해골 군단이 일어선다.']] },
  { id: 'tamer', g: 'summon', name: '조련사', r: 0, role: 'summoner', mods: { hp: 0.1, luck: 0.15 }, adv: ['맹수왕', '군주 조련사'], desc: '길들인 괴수와 함께 싸운다.',
    skills: [['괴수 호출', 'summon', 0.5, 18, '길들인 괴수를 부른다.'], ['협공', 'multi', 0.9, 16, '괴수와 함께 몰아친다.'], ['군주의 포효', 'buff_all', 0.6, 45, '모든 아군이 사나워진다.']] },
  // ---- 지원계
  { id: 'healer', g: 'support', name: '치유사', r: 0, role: 'support', mods: { mp: 0.3, hp: 0.05, atk: -0.15 }, adv: ['대치유사', '생명의 성자'], desc: '파티의 생명을 쥔 자. 어느 길드든 모셔 간다.',
    skills: [['치유', 'heal_ally', 0.4, 12, '가장 다친 동료를 치유한다.'], ['광역 치유', 'heal_all', 0.28, 30, '파티 전체를 치유한다.'], ['소생', 'revive', 0.5, 50, '쓰러진 동료를 일으킨다.']] },
  { id: 'priest', g: 'support', name: '사제', r: 1, role: 'support', mods: { mp: 0.25, def: 0.1 }, adv: ['대사제', '교황'], desc: '신성한 빛으로 축복하고 정화한다.',
    skills: [['축복', 'buff_all', 0.35, 14, '파티 전체 공격 상승.'], ['치유의 기도', 'heal_all', 0.3, 28, '파티 전체를 치유한다.'], ['신의 방패', 'shield_all', 1.0, 48, '신성한 보호막.']] },
  { id: 'bard', g: 'support', name: '음유시인', r: 1, role: 'support', mods: { spd: 0.15, luck: 0.25, mp: 0.15 }, adv: ['전장의 가수', '전설의 음유시인'], desc: '노래 하나로 전장의 흐름을 바꾼다.',
    skills: [['전투의 노래', 'buff_all', 0.4, 14, '파티 전체 공격 상승.'], ['안식의 선율', 'heal_all', 0.22, 24, '파티 전체를 달랜다.'], ['영웅 서사시', 'buff_all', 0.9, 50, '모두가 영웅이 된다.']] },
  { id: 'alchemist', g: 'support', name: '연금술사', r: 1, role: 'support', mods: { mp: 0.2, luck: 0.15 }, adv: ['연금술 대가', '현자'], desc: '포션과 폭약. 공방 제작 비용이 싸다.',
    skills: [['회복 포션 투척', 'heal_ally', 0.38, 10, '동료에게 포션을 던진다.'], ['폭약 투척', 'aoe', 1.2, 22, '터지는 플라스크.'], ['현자의 돌', 'heal_all', 0.55, 55, '모두를 완전히 되살린다.']] },
  // ---- 초능력계
  { id: 'telekinetic', g: 'esper', name: '염동력자', r: 0, role: 'esper', mods: { mp: 0.2, atk: 0.12 }, adv: ['염동 파괴자', '중력의 지배자'], desc: '보이지 않는 손으로 모든 것을 짓누른다.',
    skills: [['염동 압착', 'pierce', 1.5, 12, '방어를 무시하고 짓누른다.'], ['파편 폭풍', 'aoe', 1.2, 26, '주변 잔해를 날려 보낸다.'], ['중력 붕괴', 'stun', 2.8, 55, '중력이 무너진다.']] },
  { id: 'telepath', g: 'esper', name: '정신 감응자', r: 1, role: 'esper', mods: { mp: 0.3, luck: 0.15, hp: -0.05 }, adv: ['정신 지배자', '마인드 로드'], desc: '마음을 읽고, 흔들고, 지배한다.',
    skills: [['정신 공격', 'stun', 1.1, 12, '정신을 흔들어 기절시킨다.'], ['공포 주입', 'debuff', 0.45, 18, '적 전체의 의지를 꺾는다.'], ['정신 붕괴', 'pierce', 3.0, 55, '정신을 부숴 버린다.']] },
  { id: 'teleporter', g: 'esper', name: '순간이동자', r: 1, role: 'assassin', mods: { spd: 0.35, luck: 0.1 }, adv: ['공간 도약자', '차원 보행자'], desc: '눈 깜빡할 새 등 뒤에 있다.',
    skills: [['단거리 도약', 'evade', 0.7, 10, '공격을 피해 사라진다.'], ['배후 강습', 'crit', 1.9, 18, '등 뒤에서 찌른다.'], ['차원 절단', 'pierce', 3.4, 58, '공간째로 벤다.']] },
  { id: 'seer', g: 'esper', name: '예지자', r: 2, role: 'support', mods: { luck: 0.5, spd: 0.15 }, adv: ['운명 관측자', '예언자'], desc: '몇 초 뒤를 본다. 모든 공격을 예측한다.',
    skills: [['예지', 'evade', 0.8, 12, '다음 공격을 미리 본다.'], ['운명 개변', 'buff_all', 0.5, 26, '파티 전체 공격 상승.'], ['미래 확정', 'crit', 4.2, 60, '적이 쓰러지는 미래를 확정한다.']] },
  // ---- 동방계
  { id: 'shaman', g: 'east', name: '무당', r: 1, role: 'support', mods: { mp: 0.25, luck: 0.2 }, adv: ['대무당', '만신'], desc: '신을 받아 굿을 한다. 망령에게 특히 강하다.',
    skills: [['방울 굿', 'dmg', 1.5, 10, '방울 소리로 악귀를 친다. 망령에 특히 강하다.', 'spirit'], ['살풀이', 'heal_all', 0.28, 22, '액운을 풀어 파티를 치유한다.'], ['신내림 · 작두', 'aoe', 2.3, 55, '작두 위에서 신이 내린다. 악귀를 쓸어 버린다.', 'spirit']] },
  { id: 'taoist', g: 'east', name: '도사', r: 1, role: 'caster', mods: { mp: 0.25, def: 0.08 }, adv: ['도인', '신선'], desc: '부적과 술법. 오래된 도술이 에테르로 깨어났다.',
    skills: [['부적 투척', 'dot', 1.1, 10, '불타는 부적.'], ['축지법', 'evade', 0.6, 16, '땅을 접어 피한다.'], ['오행진', 'aoe', 2.0, 52, '오행의 진법으로 가둔다.']] },
  { id: 'swordmonk', g: 'east', name: '검무사', r: 2, role: 'melee', mods: { atk: 0.18, spd: 0.15, mp: 0.1 }, adv: ['검선', '검신'], desc: '춤추듯 검을 쓴다. 칼끝에 기가 맺힌다.',
    skills: [['검무 일식', 'multi', 1.0, 12, '춤추듯 세 번 벤다.'], ['기검', 'pierce', 1.8, 22, '기로 만든 검.'], ['만천화우', 'aoe', 2.4, 58, '꽃비처럼 검기가 쏟아진다.']] },
  // ---- 히든 (기연으로만)
  { id: 'blackflame', g: 'hidden', name: '흑염검사', r: 3, role: 'melee', mods: { atk: 0.3, hp: 0.15, spd: 0.1 }, adv: ['흑염귀', '흑염제'], desc: '1세대 S급 흑염의 검을 이은 자.',
    skills: [['흑염참', 'dot', 2.0, 14, '꺼지지 않는 검은 불꽃.', 'fire'], ['흑염 폭풍', 'aoe', 1.8, 30, '검은 불꽃이 휘몰아친다.', 'fire'], ['멸겁', 'pierce', 4.5, 60, '모든 것을 태워 없앤다.', 'fire']] },
  { id: 'apostle', g: 'hidden', name: '심연의 사도', r: 3, role: 'caster', mods: { atk: 0.25, mp: 0.3, hp: 0.1 }, adv: ['균열의 사제', '심연의 대행자'], desc: '균열교의 금지된 힘을 받아들였다.',
    skills: [['균열 열기', 'summon', 0.6, 18, '균열에서 괴수를 끌어낸다.'], ['심연의 손아귀', 'drain', 2.0, 26, '생명을 심연으로 끌어간다.'], ['차원 붕괴', 'aoe', 2.8, 62, '공간이 찢어진다.', 'spirit']] },
  { id: 'machinist', g: 'hidden', name: '기계 교감자', r: 3, role: 'summoner', mods: { luck: 0.3, mp: 0.25, spd: 0.15 }, adv: ['기계 지휘관', '기계신의 벗'], desc: '이계의 탐사기 누리와 마음이 통한 자.',
    skills: [['드론 전개', 'summon', 0.55, 16, '전투 드론을 띄운다.'], ['약점 분석', 'debuff', 0.6, 18, '적의 약점을 드러낸다.'], ['궤도 폭격', 'aoe', 2.6, 58, '하늘에서 빛이 내리꽂힌다.', 'bolt']] },
  { id: 'gatekeeper', g: 'hidden', name: '문지기', r: 3, role: 'tank', mods: { hp: 0.35, def: 0.3, atk: 0.15 }, adv: ['문의 수호자', '세계의 문지기'], desc: '원초의 게이트가 선택한 열쇠.',
    skills: [['문의 압력', 'taunt', 0.8, 10, '모든 적이 당신만 본다.'], ['차원 장벽', 'shield_all', 1.2, 30, '차원의 벽이 파티를 감싼다.'], ['문 닫기', 'aoe', 3.0, 65, '세계의 문을 닫는다.', 'spirit']] },
  { id: 'heir', g: 'hidden', name: '대붕괴의 아이', r: 3, role: 'esper', mods: { atk: 0.2, mp: 0.3, luck: 0.3 }, adv: ['각성의 정점', '초월자'], desc: '강제 각성 실험의 유일한 성공작.',
    skills: [['폭주', 'buff', 0.8, 12, '억눌렀던 힘을 푼다.'], ['에테르 해방', 'aoe', 1.9, 28, '몸속 에테르를 폭발시킨다.'], ['초월', 'pierce', 4.6, 62, '인간의 한계를 넘는다.']] },
];

const classById = (id) => CLASSES.find((c) => c.id === id) || CLASSES[0];
const classRank = (adv) => (adv >= 2 ? 6 : adv >= 1 ? 3 : 0);
// 전직 등급 이름
function className(id, adv = 0) { const c = classById(id); return adv > 0 ? c.adv[adv - 1] : c.name; }

// 직업 스킬을 SKILLS 목록에 등록 (id: cls_<직업>_<번호>)
for (const c of CLASSES) {
  c.skills.forEach((s, i) => {
    SKILLS.push({ id: `cls_${c.id}_${i}`, name: s[0], type: s[1], power: s[2], mp: s[3], desc: s[4], elem: s[5] || null, rankReq: [0, 2, 5][i], price: 0, cls: c.id });
  });
}
// 각성 판정: 희귀도 가중치
function rollClass(rng = Math.random) {
  const w = [70, 25, 5];
  const pool = CLASSES.filter((c) => c.r < 3);
  const r = rng() * 100;
  const rar = r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2;
  const list = pool.filter((c) => c.r === rar);
  return list[Math.floor(rng() * list.length)].id;
}
