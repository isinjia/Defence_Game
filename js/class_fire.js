// ===== 염 친화 직업 보강 (사용자 요청: 염 친화 직업이 가장 적음) =====
// 염 직업이 없던 계열(초능력·소환·지원·사격·방패)에 하나씩. 등록 방식은 class_elem.js 와 같다.
const FIRE_CLASSES = [
  { id: 'pyrokinetic', g: 'esper', name: '발화능력자', r: 0, role: 'caster', elem: 'fire', mods: { atk: 0.14, spd: 0.06, hp: -0.05 }, adv: ['인간 화염병', '태양의 아이'], desc: '보는 것만으로 불을 붙인다. 화가 나면 주변 온도부터 오른다.',
    skills: [['시선 발화', 'dmg', 1.45, 11, '노려본 곳에서 불길이 솟는다.', 'fire'], ['열기 폭주', 'aoe', 1.0, 22, '몸에서 뿜은 열기가 주변을 덮친다.', 'fire'], ['자연발화', 'dot', 1.3, 46, '적 전체가 안에서부터 타오른다.', 'fire']] },
  { id: 'phoenix_caller', g: 'summon', name: '불새 소환사', r: 1, role: 'summoner', elem: 'fire', mods: { mp: 0.22, atk: 0.08 }, adv: ['주작의 계약자', '불사조의 주인'], desc: '불새와 계약했다. 불새는 쓰러져도 재 속에서 다시 일어난다.',
    skills: [['불새 소환', 'summon', 0.42, 16, '작은 불새가 함께 싸운다.', 'fire'], ['불꽃 깃털', 'aoe', 1.05, 24, '불타는 깃털이 쏟아진다.', 'fire'], ['재 속의 부활', 'heal_all', 0.4, 50, '불새의 날개가 파티를 감싸 되살린다.', 'fire']] },
  { id: 'fire_dancer', g: 'support', name: '불꽃 무희', r: 0, role: 'support', elem: 'fire', mods: { spd: 0.12, luck: 0.1, mp: 0.1 }, adv: ['화무', '염무의 여왕'], desc: '불꽃을 두르고 춤춘다. 보는 동료의 피가 끓어오른다.',
    skills: [['불꽃 스텝', 'buff', 0.4, 10, '춤추며 스스로 달아오른다.', 'fire'], ['열정의 군무', 'buff_all', 0.4, 26, '파티 전체의 공격이 뜨거워진다.', 'fire'], ['화륜무', 'aoe', 1.5, 46, '불의 고리를 그리며 적을 휩쓴다.', 'fire']] },
  { id: 'bomber', g: 'shooter', name: '폭파술사', r: 0, role: 'ranged', elem: 'fire', mods: { atk: 0.15, def: -0.05 }, adv: ['폭발 전문가', '파괴왕'], desc: '에테르를 뭉쳐 던지면 터진다. 게이트 공략팀이 제일 먼저 찾는 사람.',
    skills: [['에테르 수류탄', 'aoe', 0.95, 12, '던진 곳이 폭발한다.', 'fire'], ['점착 폭탄', 'dot', 0.85, 20, '붙은 폭탄이 계속 터진다.', 'fire'], ['융단 폭격', 'aoe', 1.9, 50, '전장 전체를 불바다로 만든다.', 'fire']] },
  { id: 'lava_guard', g: 'guard', name: '용암 방패', r: 1, role: 'tank', elem: 'fire', mods: { hp: 0.25, def: 0.12, spd: -0.08 }, adv: ['화산 수문장', '용암 거신'], desc: '용암을 굳혀 방패로 쓴다. 때리는 쪽이 데인다.',
    skills: [['용암 방벽', 'shield', 0.55, 12, '굳은 용암이 몸을 덮는다.', 'fire'], ['열기 도발', 'taunt', 0.5, 18, '달아오른 방패로 적을 끌어당긴다.', 'fire'], ['분화', 'aoe', 1.6, 48, '발밑에서 용암이 터져 오른다.', 'fire']] },
];
{
  const at = CLASSES.findIndex((c) => c.g === 'hidden');
  FIRE_CLASSES.forEach((c, i) => { if (!CLASSES.some((x) => x.id === c.id)) CLASSES.splice(at < 0 ? CLASSES.length : at + i, 0, c); });
  for (const c of FIRE_CLASSES) c.skills.forEach((s, i) => {
    const id = `cls_${c.id}_${i}`;
    if (!SKILLS.some((k) => k.id === id)) SKILLS.push({ id, name: s[0], type: s[1], power: s[2], mp: s[3], desc: s[4], elem: s[5] || null, rankReq: [0, 2, 5][i], price: 0, cls: c.id });
  });
}
