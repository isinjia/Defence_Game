// ===== 게이트 크로니클: 신 16명 — 선택·2차 신탁·궁합·역류·전조·가호 NPC (영역 A, 사용자 확정 기획) =====
// - 신은 행적(DEED)과 "특별한 일"(강적·보스·브레이크·홀로·목격자)이 겹칠 때 드물게 나를 본다.
//   선이면 빛의 신, 악이면 어둠의 신, 중립이면 양쪽이 올 수 있다. 동시에 여럿이 오면 하나를 고른다.
// - 신의 선택은 평생 한 번. 거절은 없다(히든 직업 문지기·대붕괴의 아이만 물리칠 수 있다).
// - 그 신이 좋아하는 일을 거듭하면 2차 신탁(깊은 가호). 싫어하는 일을 하면 한 달간 시선이 식는다(효과 절반).
// - 궁합: 신마다 맞는 역할이 있다. 맞으면 역할에 맞춘 가호, 맞지 않으면 핵심 효과만(실망). 맞지 않는 신은 2차 신탁에서 역류로 각성한다.
// - 균열의 속삭임: 균열교 신도들이 문 너머의 목소리라 믿고 기도하는 대상, 제단의 갈라진 원 문양에 깃든 존재. 정말 문 너머에 있는지는 아무도 모른다(D 확인: 메인의 아린·진서해와 엮지 않는다).
// - 신의 가호는 관심일 뿐 대가가 없다(섬김과 다르다). NPC는 약 10%가 가호를 받는다. 같은 신이면 동문, 반대쪽 신이면 숙적.
// - 후원자 계약(hunter.js SPONSORS)의 존재와 같은 신이면 가호가 1.2배.
const GODS = [
  // ---- 빛 ----
  { id: 'warden', name: '침묵하는 파수꾼', side: 'light', deed: 'guard', color: '#7cd992', match: ['tank', 'support'], hate: ['execute', 'betray'],
    intro: '말없는 시선이 등 뒤에 내려앉는다. 지키는 손을, 그것은 오래 보아 왔다.', scorn: '파수꾼의 시선이 잠시 머물다 무겁게 가라앉는다. 지킬 줄 모르는 손이라 아쉬운 듯하다.', omen: '꿈속에서 누군가 말없이 문 앞에 서 있었다.',
    core: [{ partyDef: 0.06 }, { partyDef: 0.1, lowHpDef: 0.15 }], role: { melee: { lowHpAtk: 0.15 }, ranged: { dmgCut: 0.06 }, tank: { dmgCut: 0.08 }, support: { healUp: 0.12 }, summon: { summonUp: 0.15 }, recon: { evade: 0.05 }, east: { def: 0.06 } }, rev: { counter: 0.18, def: 0.06 }, revName: '그림자 파수' },
  { id: 'dawn', name: '새벽의 기수', side: 'light', deed: 'neardeath', color: '#ffd166', match: ['melee', 'tank'], hate: ['abandon'],
    intro: '무너지기 직전, 지평선 끝에서 말발굽 소리가 들렸다. 끝까지 서 있던 자를 기수가 보았다.', scorn: '기수는 고개를 갸웃하고 말머리를 돌린다. 이 싸움법은 그의 것이 아니다.', omen: '새벽빛 속에서 말 한 필이 이쪽을 보고 서 있었다.',
    core: [{ lowHpDef: 0.15 }, { lowHpDef: 0.25, guts: 1 }], role: { melee: { lowHpAtk: 0.2 }, ranged: { lowHpAtk: 0.15 }, tank: { hp: 0.08 }, support: { hpRegen: 0.02 }, summon: { summonUp: 0.12 }, recon: { evade: 0.06 }, east: { lowHpAtk: 0.15 } }, rev: { hpRegen: 0.03, lowHpAtk: 0.15 }, revName: '먼 새벽' },
  { id: 'well', name: '우물의 성모', side: 'light', deed: 'mercy', color: '#9fd8ff', match: ['support', 'east'], hate: ['execute', 'plunder'],
    intro: '거둔 칼끝에 맑은 물방울이 맺혔다. 베지 않은 손을 성모가 어루만진다.', scorn: '성모의 손길이 스치고 지나간다. 이 손은 치유를 담기엔 너무 거칠다.', omen: '바싹 마른 우물 바닥에서 물소리가 들렸다.',
    core: [{ hpRegen: 0.02 }, { hpRegen: 0.03, healTaken: 0.15 }], role: { melee: { lifesteal: 0.05 }, ranged: { mpRegen: 0.03 }, tank: { healTaken: 0.1 }, support: { healUp: 0.18 }, summon: { summonUp: 0.12 }, recon: { spd: 0.05 }, east: { mpRegen: 0.04 } }, rev: { lifesteal: 0.08, killHeal: 0.03 }, revName: '피 묻은 성수' },
  { id: 'star', name: '별을 세는 노파', side: 'light', deed: 'explore', color: '#b9c7ff', match: ['recon', 'ranged'], hate: [],
    intro: '낯선 길 끝에서 누군가 별을 세다 멈추었다. "그래, 그 길이야."', scorn: '노파가 하품을 하며 지도를 접는다. "넌 길보다 칼을 좋아하는구나."', omen: '밤하늘에 처음 보는 별자리가 떠 있었다.',
    core: [{ spd: 0.05, luck: 0.08 }, { spd: 0.08, luck: 0.12, evade: 0.05 }], role: { melee: { crit: 0.05 }, ranged: { crit: 0.06 }, tank: { evade: 0.04 }, support: { mpRegen: 0.03 }, summon: { spd: 0.04 }, recon: { evade: 0.06 }, east: { luck: 0.08 } }, rev: { firstHit: 0.25, spd: 0.04 }, revName: '방랑의 일격' },
  { id: 'saint', name: '검의 성자', side: 'light', deed: 'mastery', color: '#e8e8f0', match: ['melee', 'east'], hate: ['abandon'],
    intro: '수만 번 반복한 동작 끝에, 누군가 고요히 고개를 끄덕였다. 길을 끝까지 판 자를 성자가 본다.', scorn: '성자는 한 번 보고 눈을 감는다. 이 길은 그가 걷던 길이 아니다.', omen: '꿈에서 한 노인이 같은 동작을 천 번 되풀이하고 있었다.',
    core: [{ skillUp: 0.08 }, { skillUp: 0.12, mpCut: 0.12 }], role: { melee: { critDmg: 0.25 }, ranged: { elemUp: 0.1 }, tank: { counter: 0.12 }, support: { mpCut: 0.08 }, summon: { summonUp: 0.12 }, recon: { firstHit: 0.2 }, east: { critDmg: 0.2 } }, rev: { mpRegen: 0.04, skillUp: 0.06 }, revName: '다른 길의 극의' },
  { id: 'lamp', name: '등불의 순례자', side: 'light', deed: 'duty', color: '#ffb547', match: ['melee', 'ranged', 'recon'], hate: ['abandon'],
    intro: '닫힌 게이트들 너머로 작은 등불 하나가 따라왔다. 해야 할 일을 해 온 자를 순례자가 비춘다.', scorn: '순례자의 등불이 잠시 흔들린다. 갈 길이 서로 다르다.', omen: '어둠 속 먼 곳에서 등불 하나가 이쪽으로 걸어오고 있었다.',
    core: [{ startAtk: 0.2 }, { startAtk: 0.3, startDef: 0.25 }], role: { melee: { firstHit: 0.2 }, ranged: { firstHit: 0.2 }, tank: { startDef: 0.2 }, support: { partyAtk: 0.04 }, summon: { summonUp: 0.12 }, recon: { firstHit: 0.25 }, east: { startDef: 0.15 } }, rev: { hp: 0.08, dmgCut: 0.05 }, revName: '꺼지지 않는 심지' },
  { id: 'bell', name: '구원의 종', side: 'light', deed: 'savior', color: '#ffe9a8', match: ['support', 'tank', 'summon'], hate: ['abandon', 'hunt'],
    intro: '무너지던 거리 위로 어디선가 종이 울렸다. 사람들을 지켜 낸 자의 이름을 종이 부른다.', scorn: '종이 한 번 울리고 멎는다. 그 소리는 다른 손을 위한 것이었다.', omen: '먼 도시의 종소리가 꿈 끝까지 따라왔다.',
    core: [{ partyAtk: 0.05 }, { partyAtk: 0.08, partyDef: 0.05 }], role: { melee: { vsStrong: 0.12 }, ranged: { vsStrong: 0.1 }, tank: { partyDef: 0.05 }, support: { healUp: 0.12 }, summon: { summonUp: 0.2 }, recon: { spd: 0.05 }, east: { partyDef: 0.04 } }, rev: { vsStrong: 0.15 }, revName: '홀로 울리는 종' },
  { id: 'oath', name: '맹세의 별', side: 'light', deed: 'loyalty', color: '#c9b8ff', match: ['melee', 'tank', 'summon'], hate: ['betray', 'abandon'],
    intro: '쓰러진 동료를 두고 물러서지 않았다. 그 밤, 별 하나가 유난히 가까이 내려왔다.', scorn: '별빛이 잠깐 머물다 물러난다. 맹세는 혼자서는 지킬 수 없다는 듯이.', omen: '함께 걷던 누군가의 그림자가 꿈에 별빛으로 남았다.',
    core: [{ pairAtk: 0.08 }, { pairAtk: 0.12, partyDef: 0.05 }], role: { melee: { pairAtk: 0.06 }, ranged: { pairAtk: 0.06 }, tank: { dmgCut: 0.06 }, support: { healUp: 0.1 }, summon: { summonUp: 0.15 }, recon: { evade: 0.05 }, east: { pairAtk: 0.06 } }, rev: { soloAtk: 0.15, lowHpDef: 0.12 }, revName: '홀로 지킨 맹세' },
  // ---- 어둠 ----
  { id: 'ash', name: '잿빛 군주', side: 'dark', deed: 'execute', color: '#ff6b6b', match: ['melee', 'tank'], hate: ['mercy'],
    intro: '숨이 끊어지는 순간, 재 냄새가 났다. 잿빛 군주가 웃는다. "더."', scorn: '잿빛 군주가 코웃음을 친다. "…쓸모없군. 그래도 피는 피다."', omen: '잿빛 바람이 불었다. 바람 속에서 누군가 웃고 있었다.',
    core: [{ killStack: 0.06, dmgTaken: 0.04 }, { killStack: 0.09, killHeal: 0.05, dmgTaken: 0.04 }], role: { melee: { vsWeak: 0.12 }, ranged: { vsWeak: 0.1 }, tank: { killHeal: 0.05 }, support: { killHeal: 0.04 }, summon: { summonUp: 0.12 }, recon: { firstHit: 0.2 }, east: { killStack: 0.03 } }, rev: { skillUp: 0.15, healTaken: -0.1 }, revName: '타락한 성전' },
  { id: 'gold', name: '황금 눈의 상인', side: 'dark', deed: 'plunder', color: '#ffd84d', match: ['recon', 'ranged'], hate: ['mercy'],
    intro: '남의 것이 손에 들어오는 순간, 어디선가 주판알 튕기는 소리가 났다. "남는 장사로군."', scorn: '상인이 혀를 찬다. "적자가 뻔한 투자지만… 계약은 계약이니."', omen: '꿈에서 금빛 눈 하나가 장부를 넘기고 있었다.',
    core: [{ luck: 0.12, healTaken: -0.08 }, { luck: 0.18, crit: 0.05, healTaken: -0.08 }], role: { melee: { crit: 0.06 }, ranged: { crit: 0.06 }, tank: { counter: 0.1 }, support: { mpCut: 0.1 }, summon: { summonUp: 0.12 }, recon: { evade: 0.05 }, east: { critDmg: 0.2 } }, rev: { critDmg: 0.3 }, revName: '빚 받는 손' },
  { id: 'whisper', name: '균열의 속삭임', side: 'dark', deed: 'taboo', color: '#c58cff', match: ['ranged', 'east'], hate: ['savior'],
    intro: '제단의 갈라진 원이 눈 안쪽에서 열렸다. 신도들이 문 너머의 목소리라 부르며 기도하던 그것이, 이번엔 이쪽을 보았다.', scorn: '속삭임이 잠시 끊긴다. 갈라진 원은 이 그릇을 반쯤만 비춘다.', omen: '눈을 감으면 갈라진 원 문양이 떠올랐다. 누군가 그 틈으로 기도하는 소리가 들렸다.',
    core: [{ hpCostCut: 0.4, elemUp: 0.08, hpDrain: 0.01 }, { hpCostCut: 0.6, elemUp: 0.15, hpDrain: 0.015 }], role: { melee: { lifesteal: 0.05 }, ranged: { elemUp: 0.06 }, tank: { hp: 0.06 }, support: { mpRegen: 0.03 }, summon: { summonUp: 0.18 }, recon: { evade: 0.05 }, east: { elemUp: 0.06 } }, rev: { mp: 0.15, mpRegen: 0.03 }, revName: '닫힌 문의 메아리' },
  { id: 'thirst', name: '붉은 갈증', side: 'dark', deed: 'bloodlust', color: '#ff3b6a', match: ['melee', 'east'], hate: ['mercy'],
    intro: '피가 혀끝에 닿을 때마다 무언가가 함께 마셨다. 붉은 갈증이 깃든다.', scorn: '갈증이 혀를 차고 물러난다. 이 몸은 피를 담기엔 너무 맑다.', omen: '물을 마셔도 목이 탔다. 꿈에서 붉은 잔이 넘쳤다.',
    core: [{ lifesteal: 0.08, hp: -0.06 }, { lifesteal: 0.14, killHeal: 0.04, hp: -0.08 }], role: { melee: { lowHpAtk: 0.15 }, ranged: { lifesteal: 0.04 }, tank: { killHeal: 0.04 }, support: { healUp: 0.08 }, summon: { summonUp: 0.12 }, recon: { spd: 0.05 }, east: { lowHpAtk: 0.15 } }, rev: { healUp: 0.15, lifesteal: 0.04 }, revName: '나누는 피' },
  { id: 'mask', name: '가면의 왕', side: 'dark', deed: 'betray', color: '#a3a3b8', match: ['melee', 'recon'], hate: ['loyalty'],
    intro: '믿던 얼굴이 일그러지는 순간, 누군가 가면 뒤에서 박수를 쳤다.', scorn: '가면의 왕이 가면을 고쳐 쓴다. "정직한 얼굴이군. 지루해."', omen: '거울 속 내 얼굴이 반 박자 늦게 웃었다.',
    core: [{ firstHit: 0.3, noAura: 1 }, { firstHit: 0.45, crit: 0.08, noAura: 1 }], role: { melee: { crit: 0.06 }, ranged: { crit: 0.05 }, tank: { counter: 0.15 }, support: { evade: 0.06 }, summon: { summonUp: 0.12 }, recon: { evade: 0.06 }, east: { crit: 0.05 } }, rev: { evade: 0.1 }, revName: '두 얼굴의 방패' },
  { id: 'brand', name: '낙인의 여왕', side: 'dark', deed: 'infamy', color: '#ff8a5c', match: ['tank', 'support'], hate: ['mercy', 'savior'],
    intro: '사람들이 이름을 낮춰 부를 때마다 이마가 뜨거웠다. 낙인의 여왕이 왕관을 씌운다.', scorn: '여왕이 지루하다는 듯 손을 젓는다. "이름이 아직 덜 더럽혀졌구나."', omen: '꿈에서 이마에 불도장이 닿는 순간 깼다.',
    core: [{ foeDefDown: 0.06 }, { foeDefDown: 0.1, atk: 0.05 }], role: { melee: { vsWeak: 0.1 }, ranged: { vsWeak: 0.08 }, tank: { counter: 0.12 }, support: { partyAtk: 0.04 }, summon: { summonUp: 0.12 }, recon: { firstHit: 0.2 }, east: { atk: 0.05 } }, rev: { dmgCut: 0.08, atk: 0.04 }, revName: '홀로 쓴 왕관' },
  { id: 'shadow', name: '굶주린 그림자', side: 'dark', deed: 'hunt', color: '#7a6b8f', match: ['melee', 'recon', 'ranged'], hate: ['mercy'],
    intro: '약한 것이 무릎 꿇는 소리. 발밑의 그림자가 한 뼘 길어졌다.', scorn: '그림자가 발밑으로 돌아간다. 사냥꾼의 눈이 아니라는 듯이.', omen: '해가 높은데 그림자가 혼자 움직였다.',
    core: [{ vsWeak: 0.12, vsStrong: -0.08 }, { vsWeak: 0.2, killStack: 0.04, vsStrong: -0.08 }], role: { melee: { firstHit: 0.15 }, ranged: { crit: 0.05 }, tank: { killHeal: 0.04 }, support: { spd: 0.05 }, summon: { summonUp: 0.12 }, recon: { evade: 0.06 }, east: { vsWeak: 0.06 } }, rev: { vsStrong: 0.2 }, revName: '거꾸로 선 사냥' },
  { id: 'forsaken', name: '버림받은 자', side: 'dark', deed: 'abandon', color: '#6c7a90', match: ['recon', 'melee'], hate: ['loyalty', 'guard'],
    intro: '등 뒤에서 이름을 부르는 소리를 듣지 않기로 했다. 그때, 혼자인 누군가가 곁에 섰다.', scorn: '버림받은 자가 쓸쓸히 웃는다. "넌 아직 혼자가 아니구나."', omen: '빈 방에서 누군가 숨 쉬는 소리가 났다.',
    core: [{ soloAtk: 0.2, pairAtk: -0.05 }, { soloAtk: 0.3, evade: 0.06, pairAtk: -0.05 }], role: { melee: { lowHpAtk: 0.15 }, ranged: { firstHit: 0.2 }, tank: { dmgCut: 0.06 }, support: { hpRegen: 0.02 }, summon: { summonUp: 0.2 }, recon: { evade: 0.06 }, east: { spd: 0.05 } }, rev: { summonUp: 0.15, hpRegen: 0.02 }, revName: '버려진 것들의 주인' },
];
const GOD_FAVOR_NEED = 3;   // 2차 신탁까지 좋아하는 일을 몇 번 더
const GOD_REFUSE_CLS = ['gatekeeper', 'heir']; // 신의 시선을 물리칠 수 있는 히든 직업
const godById = (id) => GODS.find((g) => g.id === id);

// 가호 스킬(장착용) 등록: god_<id>_1 · god_<id>_2. 효과는 받는 사람에 따라 계산(godPv)
for (const g of GODS) for (const t of [1, 2]) {
  const id = `god_${g.id}_${t}`;
  if (!SKILLS.some((k) => k.id === id)) SKILLS.push({ id, name: `${g.name}의 ${t === 2 ? '깊은 ' : ''}${g.side === 'light' ? '가호' : '낙인'}`, type: 'passive', pv: {}, power: 0, mp: 0, desc: t === 1 ? g.intro.split('.')[0] + '.' : `2차 신탁. ${g.name}의 시선이 깊어졌다.`, elem: null, price: 0, cls: null, rankReq: 99, learn: 'god', godId: g.id, tier: t });
}

{
  const GP = Game.prototype;
  const ROLE_OF = { melee: 'melee', assassin: 'melee', ranged: 'ranged', caster: 'ranged', esper: 'ranged', tank: 'tank', support: 'support', summoner: 'summon' };
  GP.godRole = function (cls) { const c = classById(cls || 'swordsman'); if (!c) return 'melee'; if (c.g === 'recon') return 'recon'; if (c.g === 'east') return 'east'; return ROLE_OF[c.role] || 'melee'; };
  GP.godMatch = function (g, cls) { return g.match.includes(this.godRole(cls)); };
  // 받는 사람(u: 전투 유닛, 없으면 플레이어)에 따른 가호 효과
  GP.godPv = function (sid, u) {
    const m = /^god_([a-z]+)_(\d)$/.exec(sid); if (!m) return null; const g = godById(m[1]); if (!g) return null; const t = +m[2];
    const n = u && u.npcId != null ? this.npcById(u.npcId) : null; const owner = n || this.player;
    const cls = (u && u.cls) || owner.cls; const role = this.godRole(cls); const match = this.godMatch(g, cls);
    const add = (o, src, k = 1) => { for (const [a, b] of Object.entries(src || {})) o[a] = (o[a] || 0) + (a === 'guts' || a === 'noAura' ? b : b * k); return o; };
    const o = {};
    if (t === 1) { add(o, g.core[0]); if (match) add(o, g.role[role]); }
    else { add(o, g.core[1]); if (match) add(o, g.role[role], 0.6); else add(o, g.rev); }
    if (t === 2 && match) for (const k of Object.keys(o)) if (k !== 'guts' && k !== 'noAura' && o[k] > 0 && !(k in g.core[1])) o[k] = Math.round(o[k] * 100) / 100;
    // 후원자 계약 · 식은 시선
    const st = !n ? this.player.god : n.god;
    let mul = 1;
    if (!n && this.player.sponsor && this.player.sponsor.id === g.id) mul *= 1.2;
    if (!n && st && st.coolUntil != null && st.coolUntil >= this.monthKey()) mul *= 0.5;
    if (mul !== 1) for (const k of Object.keys(o)) if (k !== 'guts' && k !== 'noAura' && o[k] > 0) o[k] = Math.round(o[k] * mul * 1000) / 1000;
    return o;
  };
  // 행적이 생길 때마다: 이미 신이 있으면 2차 신탁 진행·싫어하는 일, 없으면 신의 시선 판정
  GP.godNotice = function (deed, ctx = {}) {
    const p = this.player; if (!p || this.over) return;
    const st = p.god;
    if (st) {
      if (!st.id) return;
      const g = godById(st.id); if (!g) return;
      if (g.hate.includes(deed)) { st.coolUntil = this.monthKey() + 1; this.queue.push({ type: 'toast', text: `${g.name}의 시선이 식었다. (한 달간 ${g.side === 'light' ? '가호' : '낙인'}이 약해진다)` }); }
      if (deed === g.deed && st.tier === 1) { st.favor = (st.favor || 0) + 1; if (st.favor >= GOD_FAVOR_NEED && !this.queue.some((q) => q.type === 'oracle2')) this.queue.push({ type: 'oracle2', id: g.id }); }
      return;
    }
    const g = GODS.find((x) => x.deed === deed); if (!g) return;
    const al = this.alignKind ? this.alignKind() : 'neutral';
    if ((al === 'good' && g.side === 'dark') || (al === 'evil' && g.side === 'light')) return;
    const D = DEED[deed]; const cnt = (p.deeds || {})[deed] || 0;
    const w = 1 + (ctx.strong ? 1 : 0) + (ctx.boss ? 1 : 0) + (ctx.big ? 2 : 0) + (ctx.solo ? 1 : 0) + ((ctx.witnesses || 0) >= 3 ? 1 : 0) + Math.min(2, cnt / Math.max(1, D.need) / 2);
    let chance = 0.012 * w ** 1.5 * 1.3; // 주인공 보정 1.3 (대붕괴의 공명)
    if (p.omen && p.omen.id === g.id) chance *= 3;
    if (RNG.chance(Math.min(0.6, chance))) {
      const q = this.queue.find((x) => x.type === 'godChoice');
      if (q) { if (!q.ids.includes(g.id)) q.ids.push(g.id); } else this.queue.push({ type: 'godChoice', ids: [g.id] });
      return;
    }
    // 전조: 무게가 있는 일인데 이번엔 오지 않았을 때, 가끔
    if (w >= 2 && (!p.omen || p.omen.until < this.monthKey()) && RNG.chance(0.3)) {
      p.omen = { id: g.id, until: this.monthKey() + 3 };
      this.queue.push({ type: 'toast', text: `전조 — ${g.omen}` });
    }
  };
  GP.godChoose = function (id) {
    const p = this.player; if (p.god) return '';
    if (id === 'refuse') { p.god = { id: null, refused: true }; if (this.lifeEvent) this.lifeEvent('신의 시선을 물리쳤다.'); this.save(); return '신의 시선을 물리쳤다. 이제 어떤 신도 오지 않는다.'; }
    const g = godById(id); if (!g) return '';
    p.god = { id, tier: 1, favor: 0, since: this.monthKey() }; p.omen = null;
    const sid = `god_${id}_1`; if (!p.skills.includes(sid)) p.skills.push(sid);
    if (this.lifeEvent) this.lifeEvent(`${g.name}에게 선택받았다.`);
    this.save(); return `${g.name}의 ${g.side === 'light' ? '가호' : '낙인'}을 받았다. 스킬 화면에서 장착할 수 있다.`;
  };
  GP.godOracle2 = function () {
    const p = this.player; const st = p.god; if (!st || !st.id || st.tier >= 2) return '';
    st.tier = 2; const sid = `god_${st.id}_2`; if (!p.skills.includes(sid)) p.skills.push(sid);
    const g = godById(st.id); if (this.lifeEvent) this.lifeEvent(`${g.name}의 2차 신탁.`); this.save();
    return `${g.name}의 깊은 ${g.side === 'light' ? '가호' : '낙인'}을 받았다.`;
  };
  // NPC: 약 10%가 가호를 받는다(등급이 높을수록 잘). 성격에 따라 빛·어둠
  const DARKISH = ['warlike', 'greedy', 'cold'];
  GP.godOfNpc = function (n) {
    if (!n) return null;
    if (n.godRolled === undefined) {
      n.godRolled = true;
      const chance = 0.04 + (n.rankIdx || 0) * 0.025;
      if (RNG.chance(chance)) {
        const side = DARKISH.includes(n.personality) ? 'dark' : n.personality === 'kind' || n.personality === 'just' ? 'light' : RNG.pick(['light', 'dark']);
        const pool = GODS.filter((g) => g.side === side); const pref = pool.filter((g) => this.godMatch(g, n.cls));
        const g = RNG.pick(pref.length && RNG.chance(0.7) ? pref : pool);
        n.god = { id: g.id, tier: (n.rankIdx || 0) >= 5 ? 2 : 1 };
      }
    }
    return n.god && n.god.id ? n.god : null;
  };
  GP.godPassivesOf = function (n) { const st = this.godOfNpc(n); if (!st) return []; return st.tier >= 2 ? [`god_${st.id}_1`, `god_${st.id}_2`] : [`god_${st.id}_1`]; };
  // 동문·숙적: 관계가 오르내리는 폭이 달라진다. 낙인의 여왕은 관계가 잘 오르지 않는다
  const baseRel = GP.changeRel;
  if (baseRel) GP.changeRel = function (n, d, ...a) {
    try {
      const me = this.player && this.player.god; const ng = n && this.godOfNpc(n);
      if (d > 0 && me && me.id) {
        if (ng && ng.id === me.id) d = Math.round(d * 1.3);
        else if (ng && godById(ng.id).side !== godById(me.id).side) d = Math.round(d * 0.7);
        if (me.id === 'brand') d = Math.round(d * 0.75);
      }
    } catch (e) { /* 무시 */ }
    return baseRel.call(this, n, d, ...a);
  };
  GP.godPanelHtml = function () {
    const p = this.player; const st = p.god;
    let body;
    if (st && st.refused) body = '<div class="ep-row locked"><b>신의 시선을 물리쳤다</b><span class="small dim">어떤 신도 오지 않는다.</span></div>';
    else if (st && st.id) {
      const g = godById(st.id); const match = this.godMatch(g, p.cls); const cool = st.coolUntil != null && st.coolUntil >= this.monthKey();
      const next = st.tier >= 2 ? '2차 신탁을 받았다.' : `2차 신탁 · ${DEED[g.deed].name}의 일을 ${Math.max(0, GOD_FAVOR_NEED - (st.favor || 0))}번 더`;
      body = `<div class="ep-row god own" style="--gc:${g.color}"><b style="color:${g.color}">${g.name}</b><span class="tag">${g.side === 'light' ? '빛' : '어둠'} · ${match ? '궁합 맞음' : '궁합 어긋남'}</span><span class="small dim">${next}${!match && st.tier < 2 ? ' · 2차 신탁 때 역류로 각성한다' : ''}${cool ? ' · 시선이 식었다' : ''}</span></div>`;
    } else {
      const om = p.omen && p.omen.until >= this.monthKey() ? godById(p.omen.id) : null;
      body = `<div class="ep-row"><b>???</b><span class="tag">신</span><span class="small dim">${om ? `전조 — ${om.omen}` : '아직 어떤 신의 시선도 닿지 않았다. 특별한 일이 있을 때 드물게 신이 본다.'}</span></div>`;
    }
    return `<div class="ep-list"><div class="sec-title sec">신의 가호</div>${body}</div>`;
  };
}

if (typeof UI !== 'undefined') {
  UI.godChoiceShow = function (q) {
    const p = G.player; if (p.god) return this.processQueue();
    const gods = q.ids.map(godById).filter(Boolean);
    const card = (g) => {
      const match = G.godMatch(g, p.cls); const o = G.godPv(`god_${g.id}_1`, null);
      return `<button class="choice-btn god-card ${match ? 'match' : 'mis'}" data-act="god-pick" data-v="${g.id}" style="--gc:${g.color}">
        <span class="god-name" style="color:${g.color}">${g.name}<span class="small dim"> · ${g.side === 'light' ? '빛' : '어둠'}</span></span>
        <span class="small">${match ? g.intro : g.scorn}</span>
        <span class="small ${match ? 'ok' : 'dim'}">${match ? '궁합이 맞는다' : '궁합이 어긋난다 — 핵심만 내려온다'} · ${UI.pvText(o)}</span></button>`;
    };
    const refuse = GOD_REFUSE_CLS.includes(p.cls) ? '<button class="choice-btn danger" data-act="god-pick" data-v="refuse"><b>신의 시선을 물리친다</b><span class="small dim">이 자리는 평생 비워 둔다. 어떤 신도 다시 오지 않는다.</span></button>' : '';
    this.modal(`<div class="god-choice"><div class="eyebrow">신의 시선</div><h3>${gods.length > 1 ? '여러 시선이 동시에 닿았다' : '누군가 보고 있다'}</h3>
      <p class="small dim">${gods.length > 1 ? '하나를 고른다. 신의 선택은 평생 한 번뿐이다.' : '신의 선택은 평생 한 번뿐이다. 거부할 수 없다.'}</p>
      <div class="cards">${gods.map(card).join('')}${refuse}</div></div>`, 'event-box');
    if (gods.length === 1 && !refuse) { const b = document.querySelector('#modal-box [data-act=god-pick]'); if (b) b.insertAdjacentHTML('beforeend', '<span class="small">받아들인다</span>'); }
  };
  UI.oracle2Show = function (q) {
    const g = godById(q.id); if (!g) return this.processQueue();
    const msg = G.godOracle2(); const match = G.godMatch(g, G.player.cls); const o = G.godPv(`god_${g.id}_2`, null);
    this.modal(`<div class="god-choice"><div class="eyebrow" style="color:${g.color}">2차 신탁 · ${g.name}</div><h3>${match ? `깊은 ${g.side === 'light' ? '가호' : '낙인'}` : `역류 · ${g.revName}`}</h3>
      <p class="event-text">${match ? `${g.name}의 시선이 한층 깊어졌다.` : `어긋난 채로 오래 섬긴 끝에, ${g.name}의 힘이 이 몸에 맞게 비틀려 흘렀다.`}</p>
      <div class="ep-card"><span class="small">${UI.pvText(o)}</span></div><p class="small dim">${msg}</p>
      <div class="row end"><button class="primary" data-act="modal-close">받아들인다</button></div></div>`, 'event-box');
  };
  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return baseQ.call(this);
    const q = G.queue && G.queue[0];
    if (q && (q.type === 'godChoice' || q.type === 'oracle2')) {
      if (this.ctx && this.ctx.combat && !this.ctx.combat.result) return;
      G.queue.shift(); return q.type === 'godChoice' ? this.godChoiceShow(q) : this.oracle2Show(q);
    }
    return baseQ.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'god-pick') { const m = G.godChoose(v); this.closeModal(); if (m) this.toast(m); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
  // NPC 정보: 가호 표식 (아는 사람만)
  const baseCard = UI.npcCard;
  if (baseCard) UI.npcCard = function (n, ...a) {
    const html = baseCard.call(this, n, ...a);
    try {
      const st = n && n.met && G.godOfNpc(n); if (!st) return html;
      const g = godById(st.id); const me = G.player.god && G.player.god.id ? godById(G.player.god.id) : null;
      const rel = me ? (me.id === g.id ? ' · 동문' : me.side !== g.side ? ' · 숙적' : '') : '';
      return html + `<div class="small god-mark" style="color:${g.color}">${g.name}의 ${g.side === 'light' ? '가호' : '낙인'}${rel}</div>`;
    } catch (e) { return html; }
  };
}
