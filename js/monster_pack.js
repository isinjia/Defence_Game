// ===== 게이트 크로니클: 괴수 다양성 (영역 A-δ, docs/괴수_다양성_점검.md) =====
// 1) 게이트 주제별 괴수 구성  2) 괴수 행동 유형 8종  3) 무리 구성 틀
// 4) 특수 괴수(보물 괴수·변종·떠도는 우두머리)  5) 보스 고유 기술  6) 괴수 종류 늘리기(20 → 46종)
// data.js 의 MONSTERS·SKILLS 는 여기서 덧붙이고, Game·Combat·UI·FX 는 감싸기로만 넓힌다.
// 보스 체력 구간별 패턴·큰 기술 차지는 A-β(js/boss_pattern.js) 몫. 여기의 보스 고유 기술은
// 보스가 평소 돌림 속에 섞어 쓰는 "그 괴수다운 기술" 하나다(재사용 대기 3턴).

// ---------- 행동 유형 ----------
// hp·atk·def·spd: 능력치 배율 (보스에겐 40%만 적용)
const MON_TYPES = {
  rush:     { name: '돌격형', short: '돌', color: '#ff6b5a', hp: 0.9, atk: 1.12, def: 0.9, spd: 1.1, desc: '체력이 낮은 상대만 노린다. 도발로 붙잡자.' },
  guard:    { name: '방패형', short: '방', color: '#8cc4ff', hp: 1.2, atk: 0.8, def: 1.35, spd: 0.92, desc: '동료를 감싸 대신 맞는다. 관통·전체 공격은 막지 못한다.' },
  healer:   { name: '치유형', short: '치', color: '#7be0a0', hp: 0.9, atk: 0.8, def: 1, spd: 1, desc: '다친 동료를 회복시킨다. 먼저 잡자.' },
  summoner: { name: '소환형', short: '소', color: '#c58cff', hp: 1.05, atk: 0.85, def: 1, spd: 1, desc: '졸개를 불러낸다. 본체를 쓰러뜨리면 졸개도 흩어진다.' },
  swarm:    { name: '무리형', short: '무', color: '#ffd84d', hp: 0.6, atk: 0.8, def: 0.8, spd: 1.15, desc: '약하지만 떼로 온다. 수가 줄면 달아난다. 전체 공격이 좋다.' },
  bomber:   { name: '자폭형', short: '폭', color: '#ff3d57', hp: 0.75, atk: 1, def: 0.9, spd: 1, desc: '몇 차례 뒤 폭발한다. 그 전에 잡거나 방어하자.' },
  splitter: { name: '분열형', short: '분', color: '#4fd1e8', hp: 1, atk: 0.95, def: 1, spd: 1, desc: '쓰러지면 작은 개체 둘로 나뉜다.' },
  leech:    { name: '흡수형', short: '흡', color: '#a36cff', hp: 1, atk: 1, def: 1, spd: 1, desc: '때릴 때마다 정신력과 강화 효과를 빼앗는다. 짧게 끝내자.' },
  treasure: { name: '보물 괴수', short: '보', color: '#ffe066', hp: 1, atk: 1, def: 1, spd: 1, desc: '몇 차례 뒤 달아난다. 잡으면 큰 보상.' },
};
const monHasType = (u, t) => !!u && (u.mtype === t || u.mtype2 === t);

// ---------- 괴수 데이터 ----------
// 기존 20종에 유형·고유 그림 장식을 붙인다
const MON_EXTRA = {
  '가시털 들개': { type: 'rush' }, '산성 슬라임': { type: 'splitter', minion: '산성 방울' }, '전기 날벌레떼': { type: 'swarm' },
  '빛무리 드론': { type: 'healer' }, '불꽃 쥐': { type: 'swarm' }, '이끼 골렘': { type: 'guard' }, '서리 늑대': { type: 'rush' },
  '뇌격 비행체': { type: 'bomber' }, '망자의 합창단': { type: 'healer' }, '용암 두꺼비': { type: 'splitter' },
  '가시 거미 여왕': { type: 'summoner', minion: '새끼 거미', minionShape: 'spider' }, '빙설 세이렌': { type: 'leech' },
  '천둥 기수': { type: 'rush' }, '심판의 눈': { type: 'summoner', minion: '감시 눈알', minionShape: 'eye' },
  '적룡 파편체': { type: 'rush' }, '폭풍 와이번': { type: 'leech' }, '고목 거신': { type: 'guard' },
  '빙결 고룡': { type: 'leech' }, '심연 감시자': { type: 'summoner', minion: '심연의 촉수', minionShape: 'eye' }, '태양의 잔해': { type: 'bomber' },
};
for (const m of MONSTERS) Object.assign(m, MON_EXTRA[m.name] || { type: 'rush' });

// 새 괴수 26종 (생김새는 기존 13종 + 인간형·미믹, 장식 deco: horn·armor·glow·crown·rust)
const MON_NEW = [
  // 등급 0~1
  { name: '하수구 고블린', elem: 'dark', tier: 0, hp: 0.7, atk: 0.9, shape: 'humanoid', type: 'swarm', deco: 'horn', hab: '폐지하철역의 배수로, 무너진 아파트 지하' },
  { name: '잿불 임프', elem: 'fire', tier: 0, hp: 0.7, atk: 1.15, shape: 'humanoid', type: 'rush', deco: 'horn' },
  { name: '성광 반딧불', elem: 'holy', tier: 0, hp: 0.6, atk: 0.8, shape: 'swarm', type: 'healer' },
  { name: '녹슨 경비 로봇', elem: 'bolt', tier: 1, hp: 1.4, atk: 0.8, shape: 'golem', type: 'guard', deco: 'rust' },
  { name: '독안개 버섯', elem: 'wood', tier: 1, hp: 0.9, atk: 1.0, shape: 'slime', type: 'bomber', deco: 'glow' },
  { name: '침수 해파리', elem: 'water', tier: 1, hp: 0.9, atk: 1.0, shape: 'ghost', type: 'leech', deco: 'glow' },
  // 등급 2~3
  { name: '오크 약탈자', elem: 'fire', tier: 2, hp: 1.3, atk: 1.25, shape: 'humanoid', type: 'rush', deco: 'armor' },
  { name: '리자드맨 창병', elem: 'water', tier: 2, hp: 1.4, atk: 1.0, shape: 'humanoid', type: 'guard', deco: 'armor' },
  { name: '하피', elem: 'bolt', tier: 2, hp: 0.9, atk: 1.25, shape: 'flyer', type: 'rush' },
  { name: '병동의 그림자', elem: 'dark', tier: 2, hp: 1.0, atk: 1.15, shape: 'ghost', type: 'leech' },
  { name: '미믹', elem: 'dark', tier: 3, hp: 1.5, atk: 1.3, shape: 'mimic', type: 'leech', hab: '버려진 상자와 금고 사이. 보물인 척한다.' },
  { name: '가고일', elem: 'holy', tier: 3, hp: 1.6, atk: 1.0, shape: 'golem', type: 'guard', deco: 'horn' },
  { name: '엘리베이터 괴담', elem: 'dark', tier: 3, hp: 1.3, atk: 1.1, shape: 'ghost', type: 'summoner', minion: '층수 없는 승객', minionShape: 'ghost', deco: 'crown' },
  // 등급 4~5
  { name: '언데드 기사', elem: 'dark', tier: 4, hp: 2.3, atk: 1.3, shape: 'humanoid', type: 'guard', deco: 'armor' },
  { name: '키메라', elem: 'fire', tier: 4, hp: 1.9, atk: 1.6, shape: 'beast', type: 'rush', deco: 'horn' },
  { name: '오크 주술사', elem: 'wood', tier: 4, hp: 1.5, atk: 1.4, shape: 'humanoid', type: 'healer', deco: 'crown' },
  { name: '성역 수호상', elem: 'holy', tier: 4, hp: 2.4, atk: 1.2, shape: 'golem', type: 'guard', deco: 'glow' },
  { name: '서버 망령', elem: 'bolt', tier: 4, hp: 1.6, atk: 1.5, shape: 'ghost', type: 'splitter', deco: 'glow' },
  { name: '막차 괴담', elem: 'bolt', tier: 5, hp: 1.8, atk: 1.9, shape: 'core', type: 'bomber', deco: 'rust', hab: '자정 넘어 폐지하철역에 들어오는 열차' },
  { name: '심해 촉수', elem: 'water', tier: 5, hp: 2.0, atk: 1.6, shape: 'spider', type: 'summoner', minion: '촉수 끝', minionShape: 'slime' },
  // 등급 6~7
  { name: '오크 대족장', elem: 'fire', tier: 6, hp: 2.7, atk: 2.0, shape: 'humanoid', type: 'summoner', minion: '오크 전사', minionShape: 'humanoid', deco: 'crown' },
  { name: '타락 천사', elem: 'holy', tier: 6, hp: 2.3, atk: 2.1, shape: 'flyer', type: 'healer', deco: 'glow' },
  { name: '공허 키메라', elem: 'dark', tier: 6, hp: 2.5, atk: 2.1, shape: 'beast', type: 'splitter', deco: 'horn' },
  { name: '세계수 뿌리', elem: 'wood', tier: 7, hp: 3.0, atk: 2.0, shape: 'spider', type: 'leech', deco: 'glow' },
  { name: '강철 메카 거병', elem: 'bolt', tier: 7, hp: 2.9, atk: 2.2, shape: 'golem', type: 'bomber', deco: 'armor' },
  { name: '광휘의 성자', elem: 'holy', tier: 7, hp: 2.5, atk: 2.2, shape: 'eye', type: 'healer', deco: 'crown' },
];
for (const m of MON_NEW) if (!MONSTERS.some((x) => x.name === m.name)) MONSTERS.push(m);

// 보물 괴수 (일반 후보에는 없다)
const MON_TREASURE = { name: '황금 코어 도마뱀', elem: 'holy', tier: 0, hp: 0.8, atk: 0.5, shape: 'beast', type: 'treasure', deco: 'glow', hab: '어느 게이트에서나 드물게. 몇 차례 뒤 달아난다.' };

// ---------- 게이트 주제별 괴수 ----------
const THEME_MONSTERS = {
  '폐지하철역': ['불꽃 쥐', '전기 날벌레떼', '가시털 들개', '하수구 고블린', '뇌격 비행체', '막차 괴담', '천둥 기수', '오크 대족장'],
  '침수된 쇼핑몰': ['산성 슬라임', '침수 해파리', '리자드맨 창병', '서리 늑대', '미믹', '빙설 세이렌', '심해 촉수', '빙결 고룡'],
  '붕괴 아파트 단지': ['가시털 들개', '하수구 고블린', '오크 약탈자', '엘리베이터 괴담', '미믹', '키메라', '공허 키메라', '심연 감시자'],
  '버려진 병원': ['산성 슬라임', '빛무리 드론', '병동의 그림자', '망자의 합창단', '언데드 기사', '심판의 눈', '심연 감시자', '공허 키메라'],
  '지하 데이터센터': ['전기 날벌레떼', '빛무리 드론', '녹슨 경비 로봇', '뇌격 비행체', '서버 망령', '막차 괴담', '강철 메카 거병', '태양의 잔해'],
  '해저 터널': ['산성 슬라임', '침수 해파리', '리자드맨 창병', '서리 늑대', '빙설 세이렌', '심해 촉수', '빙결 고룡', '폭풍 와이번'],
  '고대 신전': ['성광 반딧불', '빛무리 드론', '가고일', '망자의 합창단', '성역 수호상', '언데드 기사', '심판의 눈', '타락 천사', '광휘의 성자', '심연 감시자'],
  '에테르 숲': ['가시털 들개', '성광 반딧불', '독안개 버섯', '이끼 골렘', '가시 거미 여왕', '오크 주술사', '키메라', '고목 거신', '세계수 뿌리'],
  '폐공장': ['잿불 임프', '불꽃 쥐', '녹슨 경비 로봇', '용암 두꺼비', '오크 약탈자', '미믹', '강철 메카 거병', '적룡 파편체', '태양의 잔해'],
  '무너진 고가도로': ['하수구 고블린', '잿불 임프', '하피', '오크 약탈자', '천둥 기수', '오크 주술사', '폭풍 와이번', '오크 대족장', '적룡 파편체'],
};
const monTpl = (name) => MONSTERS.find((m) => m.name === name) || (name === MON_TREASURE.name ? MON_TREASURE : null);
// 괴수 이름 → 잘 나오는 게이트 주제들 (도감 서식지에 쓴다)
function monHabitats(name) { return Object.keys(THEME_MONSTERS).filter((k) => THEME_MONSTERS[k].includes(name)); }

// ---------- 괴수 전용 기술 (플레이어 상점·습득 목록에 나오지 않게 cls:'monster', rankReq 99, price 0) ----------
const MON_SKILLS = [
  // 유형 기술
  { id: 'm_pounce', name: '약자 사냥', elem: null, power: 1.3, mp: 6, type: 'crit', intent: 'attack', desc: '가장 약한 상대에게 달려든다.' },
  { id: 'm_cover', name: '감싸기', elem: null, power: 0.5, mp: 6, type: 'm_cover', intent: 'guard', desc: '두 차례 동안 동료 대신 맞는다.' },
  { id: 'm_mend', name: '괴수 치유', elem: null, power: 0.2, mp: 10, type: 'heal_ally', intent: 'heal', desc: '다친 동료를 회복시킨다.' },
  { id: 'm_call', name: '졸개 부르기', elem: null, power: 0, mp: 10, type: 'm_summon', intent: 'summon', desc: '졸개를 불러낸다.' },
  { id: 'm_flee', name: '도주', elem: null, power: 0, mp: 0, type: 'm_flee', intent: 'flee', desc: '전장에서 달아난다.' },
  { id: 'm_blast', name: '자폭', elem: 'self', power: 1.9, mp: 0, type: 'm_blast', intent: 'aoe', desc: '스스로 터져 모두를 휩쓴다.' },
  { id: 'm_sap', name: '흡수', elem: 'self', power: 1.1, mp: 4, type: 'drain', intent: 'attack', desc: '체력과 정신력을 빨아들인다.' },
  // 보스 고유 기술 (생김새별)
  { id: 'b_breath', name: '용의 숨결', elem: 'self', power: 1.25, mp: 0, type: 'm_aoedot', intent: 'aoe', desc: '전체 공격 + 화상(3턴 지속 피해).' },
  { id: 'b_web', name: '거미줄 속박', elem: 'wood', power: 0.8, mp: 0, type: 'm_bind', intent: 'stun', desc: '한 명을 묶어 한 차례 움직이지 못하게 한다.' },
  { id: 'b_song', name: '홀리는 노래', elem: 'self', power: 0.6, mp: 0, type: 'm_charm', intent: 'debuff', desc: '한 명을 홀려 다음 차례에 아군을 치게 한다(주인공은 공격력 하락).' },
  { id: 'b_quake', name: '대지 진동', elem: 'self', power: 0.85, mp: 0, type: 'm_aoestun', intent: 'aoe', desc: '전체 공격 + 일부 기절.' },
  { id: 'b_gaze', name: '파멸의 응시', elem: 'self', power: 0.9, mp: 0, type: 'm_aoedebuff', intent: 'aoe', desc: '전체 공격 + 방어 약화.' },
  { id: 'b_roar', name: '피의 포효', elem: null, power: 0.4, mp: 0, type: 'buff_all', intent: 'buff', desc: '괴수 전체 공격력 상승.' },
  { id: 'b_tide', name: '산성 해일', elem: 'self', power: 1.0, mp: 0, type: 'm_aoedot', intent: 'aoe', desc: '전체 공격 + 부식(지속 피해).' },
  { id: 'b_legion', name: '군단 소집', elem: null, power: 0, mp: 0, type: 'm_summon', intent: 'summon', desc: '졸개를 한꺼번에 불러낸다.' },
  { id: 'b_laser', name: '과부하 레이저', elem: 'self', power: 2.3, mp: 0, type: 'pierce', intent: 'attack', desc: '방어를 꿰뚫는 단일 공격.' },
  { id: 'b_dive', name: '급강하', elem: 'self', power: 2.1, mp: 0, type: 'crit', intent: 'attack', desc: '가장 약한 상대에게 내리꽂힌다.' },
  { id: 'b_requiem', name: '진혼곡', elem: null, power: 0.18, mp: 0, type: 'heal_all', intent: 'heal', desc: '괴수 전체 회복.' },
  { id: 'b_nova', name: '태양 폭발', elem: 'self', power: 1.55, mp: 0, type: 'aoe', intent: 'aoe', desc: '강한 전체 공격.' },
  { id: 'b_warcry', name: '전투 함성', elem: null, power: 0.35, mp: 0, type: 'buff_all', intent: 'buff', desc: '괴수 전체 공격력 상승.' },
  { id: 'b_devour', name: '탐식', elem: 'self', power: 2.0, mp: 0, type: 'drain', intent: 'attack', desc: '한 명을 물어뜯고 그만큼 회복한다.' },
];
for (const s of MON_SKILLS) if (!SKILLS.some((x) => x.id === s.id)) SKILLS.push({ rankReq: 99, price: 0, cls: 'monster', ...s });
const BOSS_SIG = { dragon: 'b_breath', spider: 'b_web', ghost: 'b_song', golem: 'b_quake', eye: 'b_gaze', beast: 'b_roar', slime: 'b_tide', swarm: 'b_legion', drone: 'b_laser', flyer: 'b_dive', choir: 'b_requiem', core: 'b_nova', humanoid: 'b_warcry', mimic: 'b_devour' };
const TYPE_SKILL = { rush: 'm_pounce', guard: 'm_cover', healer: 'm_mend', summoner: 'm_call', leech: 'm_sap' };
// 단일 대상이 아닌 기술 (방패형 감싸기가 막지 못한다)
const MON_WIDE = new Set(['aoe', 'multi', 'pierce', 'm_aoedot', 'm_aoestun', 'm_aoedebuff', 'm_blast']);
Object.assign(SKILL_AIM, { m_bind: 'enemy', m_charm: 'enemy' });
if (typeof INTENT_KIND !== 'undefined') INTENT_KIND.flee = { name: '도주', color: '#ffe066', svg: '<path d="M4 12h12M12 6l6 6-6 6M20 4v16"/>' };
// 예고 아이콘: 괴수 기술은 intent 칸을 그대로 쓴다
if (typeof intentKind === 'function') {
  const baseIntentKind = intentKind;
  intentKind = function (sk) { return (sk && sk.intent && INTENT_KIND[sk.intent]) ? sk.intent : baseIntentKind(sk); }; // eslint-disable-line no-func-assign
}

// ---------- 괴수 만들기 ----------
const monBaseName = (m) => (m._tpl || m.name.replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, ''));
function monTypeMul(type, key, boss) { const T = MON_TYPES[type]; const v = T ? T[key] : 1; return boss ? 1 + (v - 1) * 0.4 : v; }
// 괴수에 행동 유형과 기술을 붙인다
function monApplyType(m, tpl) {
  const type = tpl.type || 'rush';
  m._tpl = tpl.name; m.mtype = type;
  for (const [k, key] of [['maxHp', 'hp'], ['atk', 'atk'], ['def', 'def'], ['spd', 'spd']]) m[k] = Math.max(1, Math.round(m[k] * monTypeMul(type, key, m.boss)));
  m.hp = m.maxHp;
  const sk = TYPE_SKILL[type]; if (sk && !m.skills.includes(sk)) m.skills.push(sk);
  if (type === 'bomber') m.fuse = m.boss ? 4 : 3;
  if (tpl.minion) { m.minion = tpl.minion; m.minionShape = tpl.minionShape; }
  if (tpl.deco) m.deco = tpl.deco;
  if (m.boss) { m.sig = BOSS_SIG[m.shape] || null; if (m.sig) m.skills.push(m.sig); m.sigCd = 1; }
  return m;
}
// 이미 만든 괴수를 다른 괴수로 바꾼다 (등급·보스·파티 보정 비율은 유지)
function monRetemplate(m, tpl) {
  const old = monTpl(monBaseName(m)) || tpl; const ot = m.mtype || old.type || 'rush';
  const prefix = (m.name.match(/^(\[[^\]]*\]\s*)+/) || [''])[0];
  const r = (key, base) => (tpl[key] * monTypeMul(tpl.type, base, m.boss)) / (old[key] * monTypeMul(ot, base, m.boss));
  m.maxHp = m.hp = Math.max(1, Math.round(m.maxHp * r('hp', 'hp')));
  m.atk = Math.max(1, Math.round(m.atk * r('atk', 'atk')));
  m.def = Math.max(1, Math.round(m.def * monTypeMul(tpl.type, 'def', m.boss) / monTypeMul(ot, 'def', m.boss)));
  m.spd = Math.max(1, Math.round(m.spd * monTypeMul(tpl.type, 'spd', m.boss) / monTypeMul(ot, 'spd', m.boss)));
  m.name = prefix + tpl.name; m.elem = tpl.elem; m.shape = tpl.shape; m._tpl = tpl.name; m.mtype = tpl.type || 'rush';
  delete m.minion; delete m.minionShape; delete m.deco; delete m.fuse;
  m.skills = ['strike', ...SKILLS.filter((s) => s.elem === tpl.elem && !s.cls && (s.type === 'dmg' || s.type === 'aoe') && s.rankReq <= Math.floor(m.tier / 1.5)).map((s) => s.id).slice(-2)];
  const sk = TYPE_SKILL[m.mtype]; if (sk) m.skills.push(sk);
  if (m.mtype === 'bomber') m.fuse = m.boss ? 4 : 3;
  if (tpl.minion) { m.minion = tpl.minion; m.minionShape = tpl.minionShape; }
  if (tpl.deco) m.deco = tpl.deco;
  if (m.boss) { m.sig = BOSS_SIG[m.shape] || null; if (m.sig) m.skills.push(m.sig); m.sigCd = 1; }
  return m;
}
// 등급 근처 후보 (주제·속성 선호 반영)
function monPool(tier, opt = {}) {
  let pool = MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1);
  if (!pool.length) pool = MONSTERS.slice();
  if (opt.type) { const tp = pool.filter((m) => m.type === opt.type); if (!tp.length) return []; pool = tp; }
  const th = opt.theme && THEME_MONSTERS[opt.theme];
  if (th) { const tp = pool.filter((m) => th.includes(m.name)); if (tp.length && RNG.chance(opt.type ? 0.8 : 0.7)) pool = tp; }
  if (opt.elem && RNG.chance(0.45)) { const ep = pool.filter((m) => m.elem === opt.elem); if (ep.length) pool = ep; }
  return pool;
}

// ---------- 무리 구성 틀 ----------
const DPS = ['rush', 'leech', 'splitter', 'bomber'];
const PACK_FORMS = [
  { id: 'solo_sum', name: '소환형 단독', roles: ['summoner'] },
  { id: 'solo_split', name: '분열형 단독', roles: ['splitter'] },
  { id: 'tank_dps', name: '탱+딜', roles: ['guard', 'dps'] },
  { id: 'guard_bomb', name: '방패+자폭', roles: ['guard', 'bomber'] },
  { id: 'heal_dps', name: '치유+딜', roles: ['healer', 'dps'] },
  { id: 'leech_rush', name: '흡수+돌격', roles: ['leech', 'rush'] },
  { id: 'swarm', name: '무리형 떼', roles: ['swarm', 'swarm', 'swarm'], grow: 1 },
  { id: 'heal_dps2', name: '치유+딜 둘', roles: ['healer', 'dps', 'dps'] },
  { id: 'tank_heal', name: '탱+힐+딜', roles: ['guard', 'healer', 'dps'] },
  { id: 'sum_guard', name: '소환+방패', roles: ['summoner', 'guard', 'any'] },
  { id: 'mixed', name: '뒤섞인 무리', roles: [] },
];
Object.assign(Game.prototype, {
  // 일반 구역 하나를 틀에 맞춰 다시 짠다. list: 이미 만든 괴수들 (보스·정예는 건드리지 않는다)
  applyPackForm(list, tier, ctx = {}) {
    const free = list.filter((m) => !m.boss && !m.elite && !m.special);
    if (!free.length) return list;
    const n = free.length;
    const fits = (f) => f.roles.length === 0 || (f.grow ? n >= 2 : n === 1 ? f.roles.length === 1 : f.roles.length >= 2 && f.roles.length <= n);
    const forms = PACK_FORMS.filter((f) => f.id !== this._lastPack && fits(f));
    const form = RNG.pick(forms.length ? forms : PACK_FORMS);
    this._lastPack = form.id;
    if (!form.roles.length) return list;
    let roles = form.roles.slice(0, Math.max(n, form.roles.length));
    const fill = form.id === 'swarm' ? 'swarm' : 'any';
    while (roles.length < n) roles.push(fill);
    // 무리형 떼는 한 마리 더 (6마리까지)
    if (form.grow && n <= 3 && list.length < 6) {
      const extra = this.makeMonster(tier, false, ctx.elem); const ps = this.partySize ? this.partySize() : 1;
      if (ps > 1) { extra.maxHp = extra.hp = Math.round(extra.hp * (1 + 0.28 * (ps - 1))); extra.atk = Math.round(extra.atk * (1 + 0.05 * (ps - 1))); }
      list.push(extra); free.push(extra); roles.push('swarm');
    }
    // 같은 종으로 맞추면 무리답다
    let swarmTpl = null;
    free.forEach((m, i) => {
      const role = roles[i] || 'any';
      if (role === 'any') return;
      const want = role === 'dps' ? RNG.pick(DPS) : role;
      let tpl = role === 'swarm' && swarmTpl;
      if (!tpl) { const pool = monPool(tier, { type: want, theme: ctx.theme, elem: ctx.elem }); if (!pool.length) return; tpl = RNG.pick(pool); }
      if (role === 'swarm') swarmTpl = tpl;
      if (m._tpl !== tpl.name) monRetemplate(m, tpl);
    });
    list.pack = form.name;
    return list;
  },
  // 보스 호위: 보스 유형에 맞는 부하
  applyBossEscort(list, tier, ctx = {}) {
    const boss = list.find((m) => m.boss); if (!boss) return list;
    const map = { summoner: null, healer: 'guard', guard: 'healer', swarm: 'swarm' };
    const want = boss.mtype in map ? map[boss.mtype] : RNG.pick(['guard', 'healer', 'any']);
    for (const m of list) {
      if (m === boss || m.boss || m.special) continue;
      if (!want) continue;
      if (want === 'any') continue;
      const pool = monPool(tier, { type: want, theme: ctx.theme, elem: ctx.elem }); if (pool.length) monRetemplate(m, RNG.pick(pool));
    }
    return list;
  },
  // 특수 괴수: 보물 괴수·변종
  addSpecials(list, tier) {
    if (list.some((m) => m.boss)) return list;
    for (const m of list) {
      if (m.elite || m.special || m.summon || !RNG.chance(0.03)) continue;
      // 변종: 유형이 둘, 강하고 보상이 많다
      const t2 = RNG.pick(['guard', 'leech', 'splitter', 'healer'].filter((t) => t !== m.mtype));
      m.mtype2 = t2; m.variant = true; m.name = '변종 ' + m.name;
      m.maxHp = m.hp = Math.round(m.maxHp * 1.6); m.atk = Math.round(m.atk * 1.2); m.def = Math.round(m.def * 1.2);
      const sk = TYPE_SKILL[t2]; if (sk && !m.skills.includes(sk)) m.skills.push(sk);
      break;
    }
    if (list.length < 6 && RNG.chance(0.04)) list.push(this.makeTreasureMonster(tier));
    return list;
  },
  makeTreasureMonster(tier) {
    const m = this.makeMonster(tier, false);
    monRetemplate(m, MON_TREASURE);
    m.def = Math.round(m.def * 3); m.spd = Math.round(m.spd * 1.35); m.treasure = true; m.special = true; m.fleeIn = 2;
    m.skills = ['strike'];
    return m;
  },
  // 게이트 구역 전체 정리
  shapeRooms(rooms, tier, ctx) {
    rooms.forEach((room, i) => {
      if (!Array.isArray(room)) return;
      if (room.some((m) => m.boss)) this.applyBossEscort(room, tier, ctx);
      else { this.applyPackForm(room, tier, ctx); this.addSpecials(room, tier); }
    });
    return rooms;
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  // 괴수 하나: 주제 선호로 종을 고르고 행동 유형을 붙인다
  wrap('makeMonster', function (base, tier, boss, prefElem) {
    const m = base.call(this, tier, boss, prefElem);
    const ctx = this._monCtx;
    const tpl0 = monTpl(m.name.replace(/^\[보스\]\s*/, ''));
    if (tpl0) monApplyType(m, tpl0);
    if (ctx && ctx.theme && THEME_MONSTERS[ctx.theme]) {
      const pool = monPool(tier, { theme: ctx.theme, elem: prefElem });
      const tpl = pool.length && RNG.pick(pool);
      if (tpl && tpl.name !== m._tpl && THEME_MONSTERS[ctx.theme].includes(tpl.name)) monRetemplate(m, tpl);
    }
    return m;
  });
  // 게이트: 주제를 알려 주고, 구역마다 무리 틀·보스 호위·특수 괴수
  wrap('gateRooms', function (base, gate) {
    const prev = this._monCtx; this._monCtx = { theme: gate && gate.theme, elem: gate && gate.elem };
    try {
      const rooms = base.call(this, gate);
      if (gate && !gate.final) this.shapeRooms(rooms, gate.realTier ?? gate.tier, this._monCtx);
      return rooms;
    } finally { this._monCtx = prev; }
  });
  // 시련의 탑: 무리 틀만
  if (GP.towerEnemies) wrap('towerEnemies', function (base, spec) {
    const list = base.call(this, spec);
    if (spec.rule === 'normal' || spec.rule === 'solo') this.applyPackForm(list, spec.tier, {});
    return list;
  });
  // 지도 위 괴수 무리: 첫 마리는 지도에 보인 그 괴수로, 우두머리 무리는 우두머리가 앞장선다
  wrap('mobRoom', function (base, mob) {
    const list = base.call(this, mob);
    const tpl = monTpl(mob.name);
    if (tpl && list[0] && list[0]._tpl !== tpl.name) monRetemplate(list[0], tpl);
    // 같은 무리는 같은 종 (무리형이면 더 그렇다)
    if (tpl && tpl.type === 'swarm') for (const m of list.slice(1)) if (!m.summon && m._tpl !== tpl.name) monRetemplate(m, tpl);
    if (mob.leader && list[0]) {
      const L = list[0]; L.name = '[우두머리] ' + L.name; L.maxHp = L.hp = Math.round(L.maxHp * 2.2); L.atk = Math.round(L.atk * 1.25); L.def = Math.round(L.def * 1.2); L.elite = true; L.leader = true;
    }
    return list;
  });
  // 떠도는 우두머리: 새로 생긴 지도 괴수 무리 중 일부가 우두머리를 거느린다
  wrap('spawnMonthly', function (base, ...a) {
    const before = new Set((this.mobs || []).map((m) => m.id));
    const r = base.apply(this, a);
    for (const mob of this.mobs || []) if (!before.has(mob.id) && mob.leader == null) { mob.leader = RNG.chance(0.1); if (mob.leader) mob.count = Math.min(4, (mob.count || 1) + 1); }
    return r;
  });
  wrap('monsterReward', function (base, mon) {
    const r = base.call(this, mon);
    const mul = mon.treasure ? 7 : mon.leader ? 3 : mon.variant ? 2.5 : 1;
    if (mul !== 1) { r.money = Math.round(r.money * mul); r.ether = Math.round(r.ether * mul); }
    return r;
  });
}
// 던전 탐사(층 구조)도 주제·틀을 따른다
if (typeof GateRun !== 'undefined' && GateRun.enemies) {
  const baseEnemies = GateRun.enemies;
  GateRun.enemies = function (c, kind) {
    const g = c.gate; const prev = G._monCtx; G._monCtx = { theme: g.theme, elem: g.elem };
    try {
      const list = baseEnemies.call(this, c, kind);
      if (list === (c.run && c.run.finalBoss)) return list;
      const t = this.tier(g);
      if (kind === 'boss') G.applyBossEscort(list, t, G._monCtx);
      else if (kind !== 'elite') { G.applyPackForm(list, t, G._monCtx); G.addSpecials(list, t); }
      return list;
    } finally { G._monCtx = prev; }
  };
}

// ---------- 전투: 유형별 행동 ----------
{
  const CP = Combat.prototype;
  const atkTypes = ['dmg', 'crit', 'pierce', 'multi', 'dot', 'drain', 'stun'];
  Object.assign(CP, {
    monUsable(u) { return u.skills.map(skillById).filter((s) => s && s.mp <= u.mp); },
    monAttack(u, target) {
      const atk = this.monUsable(u).filter((s) => atkTypes.includes(s.type) && s.id !== 'strike' && !s.id.startsWith('b_'));
      const aoe = this.monUsable(u).filter((s) => s.type === 'aoe' && !s.id.startsWith('b_'));
      const foes = this.foesOf(u);
      if (aoe.length && foes.length >= 2 && Math.random() < 0.3) return this.useSkill(u, aoe[aoe.length - 1], null);
      const sk = atk.length && Math.random() < 0.6 ? atk[Math.floor(Math.random() * atk.length)] : skillById('strike');
      return this.useSkill(u, sk, target || this.pickTarget(u));
    },
    weakestFoe(u) { const f = this.foesOf(u); return f.length ? f.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)) : null; },
    // 괴수 판단 (예고 계획에도 그대로 쓰인다: useSkill 한 번만 부른다)
    monAct(u) {
      const has = (id) => u.skills.includes(id) && (skillById(id).mp <= u.mp);
      const friends = this.friendsOf(u); const foes = this.foesOf(u);
      if (!foes.length) return this.useSkill(u, skillById('strike'), null);
      // 보물 괴수: 정해진 차례 뒤 달아난다
      if (u.treasure) { if ((u.fleeIn ?? 2) <= 0) return this.useSkill(u, skillById('m_flee'), null); return this.useSkill(u, skillById('strike'), this.pickTarget(u)); }
      // 자폭형: 도화선이 다 타면 터진다
      if (monHasType(u, 'bomber') && (u.fuse ?? 3) <= 1) return this.useSkill(u, skillById('m_blast'), null);
      // 보스 고유 기술
      if (u.boss && u.sig && (u.sigCd ?? 0) <= 0) {
        const s = skillById(u.sig);
        const ok = !(s.type === 'm_summon' && this.monMinions(u).length >= 2) && !(s.type === 'heal_all' && !friends.some((f) => f.hp < f.maxHp * 0.75));
        if (ok) {
          let t = null;
          if (SKILL_AIM[s.type] === 'enemy') t = (s.type === 'crit' || s.type === 'm_charm') ? this.weakestFoe(u) : this.pickTarget(u);
          if (s.type === 'm_charm') { const npc = foes.filter((f) => !f.isPlayer && !f.summon); if (npc.length) t = npc[Math.floor(Math.random() * npc.length)]; }
          return this.useSkill(u, s, t);
        }
      }
      // 무리형: 수가 줄면 달아난다
      if (monHasType(u, 'swarm') && !u.boss && !this.spar) {
        const start = this.monStart || 1; const now = friends.filter((f) => !f.summon).length;
        if (start >= 2 && now <= Math.max(1, Math.floor(start / 3)) && Math.random() < 0.45) return this.useSkill(u, skillById('m_flee'), null);
      }
      // 치유형
      if (monHasType(u, 'healer') && has('m_mend')) {
        const hurt = friends.filter((f) => !f.summon && f.hp < f.maxHp * 0.62);
        if (hurt.length && Math.random() < 0.85) return this.useSkill(u, skillById('m_mend'), hurt.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)));
      }
      // 방패형: 다친 동료가 있거나 첫 차례
      if (monHasType(u, 'guard') && has('m_cover') && !u.coverT && friends.length > 1) {
        const need = friends.some((f) => f !== u && f.hp < f.maxHp * 0.7) || !u._covered;
        if (need && Math.random() < 0.7) return this.useSkill(u, skillById('m_cover'), null);
      }
      // 소환형
      if (monHasType(u, 'summoner') && has('m_call') && this.monMinions(u).length < 2 && this.enemies().length < 6 && Math.random() < 0.6) return this.useSkill(u, skillById('m_call'), null);
      // 흡수형: 흡수 공격 위주
      if (monHasType(u, 'leech') && has('m_sap') && Math.random() < 0.55) return this.useSkill(u, skillById('m_sap'), this.pickTarget(u));
      // 돌격형: 가장 약한 상대를 노린다 (도발엔 끌려간다)
      if (u.mtype === 'rush') {
        const taunter = foes.find((f) => f.tauntT > 0);
        const t = taunter && Math.random() < 0.8 ? taunter : this.weakestFoe(u);
        if (has('m_pounce') && Math.random() < 0.45) return this.useSkill(u, skillById('m_pounce'), t);
        return this.monAttack(u, t);
      }
      return this.monAttack(u, null);
    },
    monMinions(u) { return this.units.filter((x) => x.alive && x.summonOf === u.id); },
    // 졸개 하나 불러내기
    monSpawn(u, name, shape, ratio, atkRatio, extra = {}) {
      const s = {
        id: `${u.id}_m${Math.random().toString(36).slice(2, 6)}`, name, side: 'enemy', summon: true,
        hp: Math.max(1, Math.round(u.maxHp * ratio)), maxHp: Math.max(1, Math.round(u.maxHp * ratio)), mp: 0, maxMp: 1,
        atk: Math.max(1, Math.round(u.atk * atkRatio)), def: Math.round(u.def * 0.6), spd: Math.round(u.spd * 0.95), luck: 5, elem: u.elem, skills: ['strike'],
        shape, tier: u.tier, ...extra,
      };
      const su = this.prep(s); su.atb = Math.random() * 30; this.units.push(su);
      return su;
    },
  });

  // 예고 계획(aiActRaw)과 실제 행동 모두 이 판단을 거친다
  const baseRaw = CP.aiActRaw || CP.aiAct;
  const decide = function (base, u) {
    if (u.side === 'enemy' && (u.mtype || u.treasure) && !u.charmT) return this.monAct(u);
    return base.call(this, u);
  };
  if (CP.aiActRaw) CP.aiActRaw = function (u) { return decide.call(this, baseRaw, u); };
  else { const b0 = CP.aiAct; CP.aiAct = function (u) { return decide.call(this, b0, u); }; }
  // 홀린 아군: 자기 편 하나를 친다
  const baseAi = CP.aiAct;
  CP.aiAct = function (u) {
    if (u.charmT > 0) {
      u.charmT--; u.next = null;
      const mates = this.friendsOf(u).filter((f) => f !== u);
      if (mates.length) { this.push(`${u.name}이(가) 홀려 동료를 공격한다!`, 'bad', { k: 'note', dst: u.id }); return this.useSkill(u, skillById('strike'), mates[Math.floor(Math.random() * mates.length)]); }
    }
    return baseAi.call(this, u);
  };

  // 전투 시작 시 괴수 수 기억 (무리형 도주 기준)
  const basePrep = CP.prep;
  CP.prep = function (u) { const r = basePrep.call(this, u); if (r.side === 'enemy' && !r.summon) this.monStart = (this.monStart || 0) + 1; return r; };

  // 자기 차례: 감싸기 시간 줄이기
  const baseTurn = CP.takeTurn;
  CP.takeTurn = function (u) { if (u.coverT > 0) u.coverT--; return baseTurn.call(this, u); };

  // 기술 실행
  const baseUse = CP.useSkill;
  CP.useSkill = function (u, skill, target) {
    if (!skill) return baseUse.call(this, u, skill, target);
    const prevType = this._skType; this._skType = skill.type;
    try {
      // 차례 셈
      if (u.side === 'enemy') {
        if (u.boss && u.sig) u.sigCd = skill.id === u.sig ? 3 : (u.sigCd ?? 1) - 1;
        if (monHasType(u, 'bomber') && skill.type !== 'm_blast') u.fuse = (u.fuse ?? 3) - 1;
        if (u.treasure && skill.type !== 'm_flee') u.fleeIn = (u.fleeIn ?? 2) - 1;
      }
      const wide = (type) => ({ ...skill, type });
      switch (skill.type) {
        case 'm_cover': {
          u.mp -= skill.mp; u.coverT = 2; u._covered = true; u.buffs.def = Math.max(u.buffs.def, skill.power); u.buffs.defT = 2;
          this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: null, side: u.side, name: skill.name } });
          this.buffEvent(u, `${skill.name}! 동료 앞을 막아선다.`);
          return this.checkEnd();
        }
        case 'm_summon': {
          u.mp -= skill.mp;
          this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: u.elem, side: u.side, name: skill.name } });
          const k = skill.id === 'b_legion' ? 3 : 1; const room = 6 - this.enemies().length;
          const name = u.minion || (u.boss ? '괴수 졸개' : '졸개');
          for (let i = 0; i < Math.min(k, room, 2 - this.monMinions(u).length + (k > 1 ? 1 : 0)); i++) {
            const su = this.monSpawn(u, name, u.minionShape || (u.shape === 'swarm' ? 'swarm' : 'slime'), u.boss ? 0.08 : 0.22, 0.45, { summonOf: u.id });
            this.push(`${u.name}이(가) ${su.name}을(를) 불러냈다!`, 'hurt', { k: 'summon', dst: su.id, src: u.id });
          }
          return this.checkEnd();
        }
        case 'm_flee': {
          this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: null, side: u.side, name: '' } });
          u.alive = false; u.fled = true;
          this.push(u.treasure ? `${u.name}이(가) 반짝이며 틈새로 사라졌다!` : `${u.name}이(가) 겁에 질려 달아났다.`, '', { k: 'flee', src: u.id });
          for (const s of this.monMinions(u)) { s.alive = false; s.hp = 0; }
          return this.checkEnd();
        }
        case 'm_blast': {
          this.push(`${u.name}이(가) 부풀어 오르더니 터졌다!`, 'hurt', { k: 'note', dst: u.id });
          baseUse.call(this, u, wide('aoe'), null);
          if (u.alive) { u.hp = 0; this.down(u); }
          return this.checkEnd();
        }
        case 'm_aoedot': case 'm_aoestun': case 'm_aoedebuff': {
          const foes = this.foesOf(u);
          baseUse.call(this, u, wide('aoe'), null);
          for (const f of foes) {
            if (!f.alive) continue;
            if (skill.type === 'm_aoedot') f.poison = { dmg: Math.max(1, Math.round(u.atk * 0.22)), t: 3 };
            if (skill.type === 'm_aoestun' && Math.random() < 0.35 && !f.boss) { f.stun = 1; this.push(`${f.name}이(가) 휘청이며 기절했다!`, 'hurt', { k: 'note', dst: f.id }); }
            if (skill.type === 'm_aoedebuff') { f.buffs.def = Math.min(f.buffs.def, -0.3); f.buffs.defT = 2; }
          }
          if (skill.type === 'm_aoedot') this.push(skill.id === 'b_breath' ? '모두 화상을 입었다.' : '산이 살갗을 파고든다.', 'hurt');
          if (skill.type === 'm_aoedebuff') this.push('방어가 무너졌다.', 'hurt');
          return this.checkEnd();
        }
        case 'm_bind': {
          baseUse.call(this, u, wide('dmg'), target);
          if (target && target.alive) { target.stun = Math.max(target.stun, 1); this.push(`${target.name}이(가) 거미줄에 묶였다!`, 'hurt', { k: 'note', dst: target.id }); }
          return this.checkEnd();
        }
        case 'm_charm': {
          baseUse.call(this, u, wide('dmg'), target);
          if (target && target.alive) {
            if (target.isPlayer) { target.buffs.atk = Math.min(target.buffs.atk, -0.3); target.buffs.atkT = 2; this.push(`${target.name}의 정신이 흐려진다. (공격력 하락)`, 'hurt', { k: 'note', dst: target.id }); }
            else { target.charmT = 1; target.next = null; this.push(`${target.name}이(가) 노래에 홀렸다!`, 'hurt', { k: 'note', dst: target.id }); }
          }
          return this.checkEnd();
        }
        default: {
          const r = baseUse.call(this, u, skill, target);
          // 흡수형: 정신력과 강화를 빼앗는다
          if (monHasType(u, 'leech') && target && target.side !== u.side && atkTypes.includes(skill.type)) {
            const take = Math.min(target.mp || 0, Math.round((target.maxMp || 0) * 0.06));
            if (take > 0) { target.mp -= take; u.mp = Math.min(u.maxMp, u.mp + take); }
            let stole = '';
            if (target.buffs && target.buffs.atk > 0) { u.buffs.atk = Math.max(u.buffs.atk, target.buffs.atk); u.buffs.atkT = 2; target.buffs.atk = 0; target.buffs.atkT = 0; stole = ' · 강화를 빼앗았다'; }
            if (take > 0 || stole) this.push(`${u.name}이(가) ${target.name}의 기운을 빨아들였다${take ? ` (정신력 -${take})` : ''}${stole}.`, 'hurt', { k: 'mp', dst: target.id, mp: target.mp });
          }
          return r;
        }
      }
    } finally { this._skType = prevType; }
  };

  // 방패형 감싸기: 단일 공격만 대신 맞는다
  const baseDeal = CP.dealDamage;
  CP.dealDamage = function (att, def, skill, opt = {}) {
    if (def && def.side === 'enemy' && att.side === 'ally' && !MON_WIDE.has(this._skType) && !opt.pierce) {
      const cov = this.units.find((x) => x.alive && x.side === 'enemy' && x !== def && x.coverT > 0 && monHasType(x, 'guard'));
      if (cov && Math.random() < 0.7) { this.push(`${cov.name}이(가) ${def.name}을(를) 감싸며 막아섰다!`, '', { k: 'cover', src: cov.id, dst: def.id }); def = cov; }
    }
    return baseDeal.call(this, att, def, skill, opt);
  };

  // 쓰러질 때: 분열형은 둘로, 소환형 본체가 쓰러지면 졸개가 흩어진다
  const baseDown = CP.down;
  CP.down = function (u) {
    baseDown.call(this, u);
    if (u.side !== 'enemy') return;
    const mins = this.units.filter((x) => x.alive && x.summonOf === u.id);
    if (mins.length) { for (const s of mins) { s.alive = false; s.hp = 0; this.push('', '', { k: 'down', dst: s.id }); } this.push(`${u.name}이(가) 쓰러지자 졸개들이 흩어졌다.`, 'good'); }
    if (monHasType(u, 'splitter') && !u.splitChild && !u.boss && !u.summon && !u.fled) {
      const room = 6 - this.enemies().length; const base = monBaseName(u);
      for (let i = 0; i < Math.min(2, room); i++) {
        const su = this.monSpawn(u, '작은 ' + base, u.shape, 0.32, 0.6, { splitChild: true, deco: u.deco });
        su.hp = su.maxHp;
        this.push(`${u.name}이(가) 갈라져 ${su.name}이(가) 되었다!`, 'hurt', { k: 'summon', dst: su.id, src: u.id });
      }
    }
  };
}

// ---------- 화면: 유형 표시(적 그림 왼쪽 위), 자폭 남은 차례 ----------
if (typeof document !== 'undefined' && !document.getElementById('mon-pack-css')) {
  const st = document.createElement('style'); st.id = 'mon-pack-css';
  st.textContent = `.foe .fx-host{position:relative}
.mtype{position:absolute;left:0;top:0;min-width:16px;height:16px;padding:0 3px;border-radius:8px;background:rgba(10,13,20,.85);border:1px solid var(--mc);color:var(--mc);font-size:10px;line-height:14px;font-weight:700;text-align:center;pointer-events:none;z-index:3}
.mtype b{color:#fff;margin-left:2px}
.foe.variant .foe-name{color:#ffb547}.foe.treasure .foe-name{color:#ffe066}`;
  (document.head || document.documentElement).appendChild(st);
}
if (typeof UI !== 'undefined') {
  Object.assign(UI, {
    drawMonTypes() {
      const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
      for (const u of c.combat.units) {
        if (u.side !== 'enemy') continue;
        const el = document.getElementById('u-' + u.id); if (!el) continue;
        const host = el.querySelector('.fx-host') || el;
        let tag = host.querySelector('.mtype');
        const T = MON_TYPES[u.treasure ? 'treasure' : u.mtype];
        if (!T || !u.alive || u.summon) { if (tag) tag.remove(); continue; }
        const n = monHasType(u, 'bomber') ? Math.max(0, (u.fuse ?? 3) - 1) : u.treasure ? Math.max(0, u.fleeIn ?? 2) : null;
        const T2 = u.mtype2 && MON_TYPES[u.mtype2];
        const key = (u.mtype || '') + (u.mtype2 || '') + '|' + n;
        if (tag && tag._key === key) continue;
        if (!tag) { host.insertAdjacentHTML('beforeend', '<span class="mtype"></span>'); tag = host.querySelector('.mtype'); }
        tag._key = key; tag.style.setProperty('--mc', T.color);
        tag.innerHTML = `${T.short}${T2 ? T2.short : ''}${n != null ? `<b>${n}</b>` : ''}`;
        tag.title = `${T.name}${T2 ? '·' + T2.name : ''}: ${T.desc}`;
        el.classList.toggle('variant', !!u.variant); el.classList.toggle('treasure', !!u.treasure);
      }
    },
  });
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () { const r = baseRefresh.apply(this, arguments); try { this.drawMonTypes(); } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ } return r; };
}

// ---------- 그림: 인간형·미믹, 장식 ----------
if (typeof FX !== 'undefined' && FX.monster) {
  const baseMon = FX.monster;
  const shapeArt = (shape, pal, body, r) => {
    const hi = pal.hi;
    const eye = (x, y, rr = 3) => `<circle cx="${x}" cy="${y}" r="${rr * 1.9}" fill="${hi}" opacity=".35"/><circle cx="${x}" cy="${y}" r="${rr}" fill="${hi}"/>`;
    if (shape === 'humanoid') {
      const lean = Math.round(r() * 6 - 3);
      return `<path d="M50 30C40 30 34 38 36 48L30 70 38 72 42 60 44 92H50L52 72 54 92H60L60 60 64 72 72 70 64 48C66 38 60 30 50 30Z" fill="${body}" transform="rotate(${lean} 50 60)"/>
        <ellipse cx="50" cy="24" rx="11" ry="10" fill="${body}"/>${eye(46, 24, 2.2)}${eye(55, 24, 2.2)}
        <path d="M74 30 70 78" stroke="${hi}" stroke-width="3" stroke-linecap="round"/><path d="M70 30 74 22 78 30Z" fill="${hi}"/>`;
    }
    if (shape === 'mimic') {
      return `<path d="M18 56H82V86H18Z" fill="${body}"/><path d="M18 56 22 30H78L82 56Z" fill="${pal.mid}"/>
        <path d="M18 56H82" stroke="${hi}" stroke-width="2"/><rect x="44" y="52" width="12" height="10" rx="2" fill="${hi}"/>
        <path d="M24 56l4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8" stroke="#fff" stroke-width="2" fill="none" opacity=".85"/>
        <path d="M82 70q10 4 8 14" stroke="#c0405a" stroke-width="5" fill="none" stroke-linecap="round"/>${eye(34, 44, 2.6)}${eye(66, 44, 2.6)}`;
    }
    return null;
  };
  const decoArt = (deco, pal) => {
    const hi = pal.hi;
    switch (deco) {
      case 'horn': return `<path d="M34 14 30 2 40 12ZM66 14 70 2 60 12Z" fill="${hi}" opacity=".95"/>`;
      case 'armor': return `<path d="M30 50h40v14H30z" fill="#9aa6b8" opacity=".55"/><path d="M30 50h40" stroke="#dfe6ef" stroke-width="2" opacity=".7"/>`;
      case 'glow': return `<circle cx="50" cy="50" r="46" fill="${hi}" opacity=".10"/><circle cx="50" cy="50" r="38" fill="none" stroke="${hi}" stroke-width="1" opacity=".35" stroke-dasharray="3 6"/>`;
      case 'crown': return `<path d="M36 12 40 2 46 9 50 0 54 9 60 2 64 12Z" fill="#ffd84d"/>`;
      case 'rust': return `<circle cx="34" cy="60" r="5" fill="#8a4a2a" opacity=".7"/><circle cx="64" cy="40" r="4" fill="#8a4a2a" opacity=".6"/><circle cx="58" cy="74" r="3" fill="#8a4a2a" opacity=".7"/>`;
      default: return '';
    }
  };
  FX.monster = function (mon, size = 110) {
    const tpl = monTpl(mon._tpl || monBaseName(mon)) || {};
    const shape = mon.shape || tpl.shape;
    let svg;
    if (shape === 'humanoid' || shape === 'mimic') {
      // 기본 틀(그라데이션·그림자)을 빌려 몸만 바꾼다
      svg = baseMon.call(this, { ...mon, shape: 'slime' }, size);
      const pal = this.PAL[mon.elem] || this.PAL.none;
      const id = (svg.match(/id="([^"]+)g"/) || [])[1];
      const art = shapeArt(shape, pal, id ? `url(#${id}g)` : pal.mid, this.rng(this.hash(mon.name)));
      svg = svg.replace(/(<ellipse cx="50" cy="96"[^>]*\/>)[\s\S]*<\/svg>$/, `$1${art}</svg>`);
    } else svg = baseMon.call(this, mon, size);
    const deco = mon.deco || tpl.deco;
    if (deco) { const pal = this.PAL[mon.elem] || this.PAL.none; svg = svg.replace(/<\/svg>$/, `${decoArt(deco, pal)}</svg>`); }
    return svg;
  };
}
