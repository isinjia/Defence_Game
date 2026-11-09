// ===== 직업 친화 속성 · 성·암·목 직업 (docs/구현_대기목록.md 4-10, 데이터 docs/신규_직업_스킬.md) =====
// - 직업마다 친화 속성 elem(하나) 또는 elems(각성 속성에 따라 고름). 친화 속성 스킬은 위력 ×1.1.
// - 새 직업 13개: 성 4(승려·수도사·퇴마사·성녀), 암 4(암흑사제·암흑기사·저주술사·그림자술사), 목 4(드루이드·주술사·정령사·수목 수호자), 염 1(화염술사).
// - 무당은 각성 속성이 암이면 "원귀 부리기", 그 밖은 "신내림" 갈래 스킬을 받는다.
// - 프롤로그 쪽(resolvePrologue)은 c.elem / c.elems 를 읽어 각성 속성 친화 직업에 가중치를 준다(D).

const NEW_CLASSES = [
  // ===== 성(聖) =====
  { id: 'monk_holy', g: 'support', name: '승려', r: 0, role: 'support', elem: 'holy', mods: { mp: 0.15, def: 0.12, hp: 0.05 }, adv: ['선사', '대선사'], desc: '염주를 굴리며 마음을 다스린다. 절에서 각성한 헌터.',
    skills: [['금강 염주', 'shield', 0.4, 12, '염주가 빛나며 자신을 지킨다.', 'holy'], ['자비의 독경', 'heal_all', 0.28, 26, '독경 소리가 파티를 치유한다.', 'holy'], ['천수관음', 'buff_all', 0.5, 50, '천 개의 손이 파티를 감싼다. 공격·방어 상승.', 'holy']] },
  { id: 'friar', g: 'fighter', name: '수도사', r: 0, role: 'tank', elem: 'holy', mods: { hp: 0.22, def: 0.1, spd: -0.05 }, adv: ['고행자', '순교자'], desc: '고행으로 단련한 몸. 맞을수록 단단해진다.',
    skills: [['참회의 일격', 'dmg', 1.3, 10, '성스러운 주먹을 내리친다.', 'holy'], ['고행', 'taunt', 0.5, 18, '적의 공격을 몸으로 받아낸다.', 'holy'], ['순교자의 결의', 'shield_all', 0.9, 46, '자신을 바쳐 파티 전체에 보호막을 친다.', 'holy']] },
  { id: 'exorcist', g: 'mage', name: '퇴마사', r: 1, role: 'caster', elem: 'holy', mods: { mp: 0.2, atk: 0.12 }, adv: ['구마 사제', '대퇴마사'], desc: '악령과 저주를 몰아낸다. 암 속성에게 특히 강하다.',
    skills: [['성수 세례', 'aoe', 1.0, 14, '성수를 흩뿌린다.', 'holy'], ['구마 의식', 'stun', 1.6, 26, '악한 것을 묶어 둔다.', 'holy'], ['정화의 불꽃', 'pierce', 2.6, 52, '방어를 무시하는 금빛 불꽃.', 'holy']] },
  { id: 'saint', g: 'support', name: '성녀', r: 2, role: 'support', elem: 'holy', mods: { mp: 0.35, luck: 0.1 }, adv: ['대성녀', '빛의 화신'], desc: '빛 그 자체. 쓰러진 이를 일으킨다. (남성은 "성자")',
    skills: [['빛의 손길', 'heal_ally', 0.5, 12, '가장 다친 동료를 크게 치유한다.', 'holy'], ['축성', 'buff_all', 0.45, 28, '파티 전체를 축복한다.', 'holy'], ['부활의 기적', 'revive', 0.6, 60, '쓰러진 동료를 일으킨다.', 'holy']] },
  // ===== 암(暗) =====
  { id: 'dark_priest', g: 'support', name: '암흑사제', r: 1, role: 'support', elem: 'dark', mods: { mp: 0.25, atk: 0.08 }, adv: ['흑교 사제', '심연의 대사제'], desc: '적의 생명을 빼앗아 아군을 살린다.',
    skills: [['피의 성찬', 'drain', 1.1, 14, '적의 생명을 빨아 자신을 회복한다.', 'dark'], ['저주의 기도', 'debuff', 0.35, 24, '적 전체의 공격을 깎는다.', 'dark'], ['검은 미사', 'heal_all', 0.4, 48, '어둠의 대가로 파티를 치유한다.', 'dark']] },
  { id: 'dark_knight', g: 'guard', name: '암흑기사', r: 1, role: 'tank', elem: 'dark', mods: { hp: 0.25, atk: 0.12, def: 0.05 }, adv: ['데스나이트', '심연기사'], desc: '자신의 피를 대가로 강타한다. 쓰러지지 않는 방패.',
    skills: [['어둠 베기', 'drain', 1.3, 12, '베면서 생명을 빼앗는다.', 'dark'], ['공포의 오라', 'taunt', 0.5, 20, '적의 시선을 끌고 겁먹게 한다.', 'dark'], ['심연 강타', 'crit', 2.8, 50, '모든 것을 걸고 내려친다.', 'dark']] },
  { id: 'hexer', g: 'mage', name: '저주술사', r: 0, role: 'caster', elem: 'dark', mods: { mp: 0.2, luck: 0.1 }, adv: ['저주의 대가', '재앙술사'], desc: '천천히 무너뜨린다. 저주는 시간이 지날수록 깊어진다.',
    skills: [['저주 인형', 'dot', 0.6, 10, '적을 서서히 갉아먹는다.', 'dark'], ['쇠약의 저주', 'debuff', 0.3, 20, '적 전체를 약하게 만든다.', 'dark'], ['파멸의 낙인', 'dot', 1.4, 46, '적 전체에 깊은 저주를 새긴다.', 'dark']] },
  { id: 'shade', g: 'shadow', name: '그림자술사', r: 1, role: 'assassin', elem: 'dark', mods: { spd: 0.2, atk: 0.12, hp: -0.05 }, adv: ['그림자 군주', '어둠의 화신'], desc: '그림자에 숨고 그림자로 벤다.',
    skills: [['그림자 숨기', 'evade', 0.5, 12, '그림자 속으로 사라진다.', 'dark'], ['그림자 분신', 'summon', 0.4, 26, '그림자 분신을 불러낸다.', 'dark'], ['그림자 처형', 'crit', 3.0, 52, '그림자에서 나와 급소를 벤다.', 'dark']] },
  // ===== 염(炎) 보강: 염 친화 직업이 적어서 (4-10 "염·뇌·수도 균형") =====
  { id: 'pyromancer', g: 'mage', name: '화염술사', r: 0, role: 'caster', elem: 'fire', mods: { atk: 0.16, mp: 0.1, hp: -0.06 }, adv: ['염화의 마도사', '염제'], desc: '불꽃만 다루는 술사. 한 가지 속성을 극한까지 판다.',
    skills: [['화염구', 'dmg', 1.5, 12, '불덩이를 던진다.', 'fire'], ['불꽃 장막', 'dot', 0.9, 22, '적 전체를 불길 속에 가둔다.', 'fire'], ['겁화', 'aoe', 2.0, 52, '모든 것을 태우는 업화가 전장을 삼킨다.', 'fire']] },
  // ===== 목(木) =====
  { id: 'druid', g: 'support', name: '드루이드', r: 1, role: 'support', elem: 'wood', mods: { hp: 0.15, mp: 0.15 }, adv: ['대드루이드', '숲의 군주'], desc: '숲과 하나가 된다. 치유하다가 짐승으로 변해 싸운다.',
    skills: [['재생의 덩굴', 'heal_all', 0.25, 14, '덩굴이 파티를 감싸 치유한다.', 'wood'], ['곰 변신', 'buff', 0.5, 24, '거대한 곰으로 변해 공격·체력이 오른다.', 'wood'], ['대자연의 분노', 'aoe', 1.8, 50, '땅에서 거목이 솟구친다.', 'wood']] },
  { id: 'witch_doctor', g: 'east', name: '주술사', r: 0, role: 'caster', elem: 'wood', mods: { mp: 0.18, luck: 0.12 }, adv: ['대주술사', '주술왕'], desc: '약초·독·토템. 시골 할머니에게 배운 주술이 각성으로 깨어났다.',
    skills: [['독초 침', 'dot', 0.55, 10, '독초 가시가 적을 갉아먹는다.', 'wood'], ['수호 토템', 'shield_all', 0.6, 24, '토템을 세워 파티를 지킨다.', 'wood'], ['원혼 굿', 'stun', 1.8, 48, '토템이 울며 적 전체를 묶는다.', 'wood']] },
  { id: 'spiritist', g: 'summon', name: '정령사', r: 1, role: 'summoner', elem: 'wood', mods: { mp: 0.25, luck: 0.08 }, adv: ['대정령사', '세계수의 계약자'], desc: '숲과 나무의 정령과 계약한다.',
    skills: [['숲 정령 소환', 'summon', 0.42, 16, '작은 나무 정령이 함께 싸운다.', 'wood'], ['꽃잎 폭풍', 'aoe', 1.1, 24, '날카로운 꽃잎이 휘몰아친다.', 'wood'], ['세계수의 가지', 'summon', 0.85, 54, '거대한 나무 정령이 깨어난다.', 'wood']] },
  { id: 'treant_warden', g: 'guard', name: '수목 수호자', r: 2, role: 'tank', elem: 'wood', mods: { hp: 0.4, def: 0.18, spd: -0.15 }, adv: ['숲의 기사', '세계수 수호자'], desc: '몸에 뿌리를 내린다. 뽑히지 않는다.',
    skills: [['뿌리 내리기', 'shield', 0.6, 12, '뿌리를 박고 단단해진다.', 'wood'], ['가시 넝쿨', 'taunt', 0.6, 22, '가시로 적을 끌어당긴다.', 'wood'], ['숲의 장벽', 'shield_all', 1.2, 50, '나무 벽이 파티를 감싼다.', 'wood']] },
];

// 기존 직업 이름 다듬기: 헌터물에 어울리지 않던 이름 (사용자 요청)
const CLASS_NAME_FIX = {
  tamer: { name: '테이머', adv: ['비스트 마스터', '괴수왕'] },
  guardian: { adv: ['철벽기사', '불괴의 군주'] },
  berserker: { adv: ['혈투사', '혈귀'] },
  warlock: { adv: ['흑마도사', '심연의 마도사'] }, // '저주술사'는 새 직업 이름이라 겹침
  priest: { adv: ['대사제', '신의 대리인'] },
};
for (const c of CLASSES) if (CLASS_NAME_FIX[c.id]) Object.assign(c, CLASS_NAME_FIX[c.id]);

// 기존 직업 친화 속성 (4속성 친화 직업이 각 4개 이상)
const CLASS_ELEM = {
  swordsman: 'fire', berserker: 'fire', monk: 'fire', swordmonk: 'fire', blackflame: 'fire',
  lancer: 'bolt', dualblade: 'bolt', gunslinger: 'bolt', teleporter: 'bolt', machinist: 'bolt',
  guardian: 'water', thief: 'water', sniper: 'water', warder: 'water', bard: 'water', taoist: 'water',
  giant: 'wood', poisoner: 'wood', archer: 'wood', tamer: 'wood', alchemist: 'wood',
  paladin: 'holy', healer: 'holy', priest: 'holy', seer: 'holy', gatekeeper: 'holy',
  assassin: 'dark', warlock: 'dark', necromancer: 'dark', telepath: 'dark', apostle: 'dark',
};
const CLASS_ELEMS = { elementalist: ['fire', 'bolt', 'water', 'wood'], shaman: ['holy', 'dark'] };
// 기존 직업 스킬 속성 (1·2·3번, null 은 그대로)
const CLASS_SKILL_ELEM = {
  swordsman: [null, 'fire', null], berserker: ['fire', null, 'fire'], lancer: ['bolt', null, 'bolt'], monk: [null, null, 'fire'], dualblade: ['bolt', 'bolt', null],
  paladin: ['holy', 'holy', 'holy'], giant: [null, null, 'wood'], assassin: ['dark', null, 'dark'], poisoner: ['wood', 'wood', 'wood'],
  archer: [null, 'wood', null], sniper: [null, null, 'water'], gunslinger: ['bolt', null, 'bolt'], warlock: ['dark', 'dark', 'dark'],
  warder: ['water', null, 'water'], necromancer: ['dark', 'dark', 'dark'], tamer: [null, 'wood', null], healer: ['holy', 'holy', 'holy'],
  priest: ['holy', 'holy', 'holy'], bard: ['water', null, 'water'], alchemist: ['wood', 'fire', 'wood'], telepath: [null, 'dark', null],
  teleporter: ['bolt', null, null], seer: [null, 'holy', null], taoist: ['water', null, 'fire'], swordmonk: ['fire', null, 'fire'],
  shaman: ['holy', 'holy', 'holy'],
};
// 무당 원귀 부리기(암) 갈래 — 기존 cls_shaman_0~2 는 신내림(성) 갈래
const SHAMAN_DARK = [['원귀 부르기', 'summon', 0.4, 16, '한 맺힌 원귀가 따라 싸운다.', 'dark'], ['살 날리기', 'debuff', 0.35, 24, '원귀가 적의 살을 거꾸로 돌린다.', 'dark'], ['백귀야행', 'aoe', 1.9, 52, '원귀 떼가 적을 덮친다.', 'dark']];

{
  // 새 직업은 히든 직업 앞에 끼운다
  const at = CLASSES.findIndex((c) => c.g === 'hidden');
  for (const c of NEW_CLASSES) if (!CLASSES.some((x) => x.id === c.id)) CLASSES.splice(at < 0 ? CLASSES.length : at + NEW_CLASSES.indexOf(c), 0, c);
  for (const c of CLASSES) {
    if (CLASS_ELEM[c.id] && !c.elem) c.elem = CLASS_ELEM[c.id];
    if (CLASS_ELEMS[c.id]) c.elems = CLASS_ELEMS[c.id];
    const se = CLASS_SKILL_ELEM[c.id];
    if (se) c.skills.forEach((s, i) => { if (se[i]) s[5] = se[i]; });
  }
  // 스킬 등록: 이미 등록된 기존 직업 스킬은 속성만 고치고, 새 직업·무당 암 갈래는 새로 넣는다
  for (const c of CLASSES) c.skills.forEach((s, i) => {
    const id = `cls_${c.id}_${i}`; const ex = SKILLS.find((k) => k.id === id);
    if (ex) ex.elem = s[5] || null;
    else SKILLS.push({ id, name: s[0], type: s[1], power: s[2], mp: s[3], desc: s[4], elem: s[5] || null, rankReq: [0, 2, 5][i], price: 0, cls: c.id });
  });
  for (let i = 0; i < 3; i++) { const sk = SKILLS.find((k) => k.id === `cls_shaman_${i}`); if (sk) sk.branch = 'holy'; }
  SHAMAN_DARK.forEach((s, i) => { if (!SKILLS.some((k) => k.id === `cls_shaman_d_${i}`)) SKILLS.push({ id: `cls_shaman_d_${i}`, name: s[0], type: s[1], power: s[2], mp: s[3], desc: s[4], elem: s[5], rankReq: [0, 2, 5][i], price: 0, cls: 'shaman', branch: 'dark' }); });
}

// 직업의 친화 속성 (각성 속성 element 기준). 없으면 null
function classElem(cls, element) {
  const c = CLASSES.find((x) => x.id === cls); if (!c) return null;
  if (c.elem) return c.elem;
  if (c.elems) return c.elems.includes(element) ? element : null;
  return null;
}
// 갈래가 있는 직업 스킬(무당)이 이 각성 속성에 맞는가
function classSkillFits(sk, element) {
  if (!sk || !sk.branch) return true;
  return sk.branch === (element === 'dark' ? 'dark' : 'holy');
}
const CLASS_ELEM_POWER = 1.1;

// NPC 각성: 희귀도는 rollClass 와 같게, 같은 희귀도 안에서 속성 친화 직업을 더 자주 (×3)
function rollClassFor(element, rng = Math.random) {
  const w = [70, 25, 5]; const r = rng() * 100;
  const rar = r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2;
  const list = CLASSES.filter((c) => c.r === rar);
  const ws = list.map((c) => (element && classElem(c.id, element) === element ? 3 : 1));
  let x = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { x -= ws[i]; if (x < 0) return list[i].id; }
  return list[list.length - 1].id;
}
