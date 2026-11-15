// ===== 스킬 효과 보강: 가속(행동 게이지)·위축(적 공격 하락) (사용자 요청: "가속인데 공격력 증가?") =====
// 전투 엔진의 버프·약화는 공격·방어·회피뿐이라, 이름이 속도·공포·연막인 스킬도 '파티 공격 상승'·'적 방어 하락'으로 묶여 있었다.
// 새 유형을 따로 만들면 대상 고르기·연출·AI·정보창 등 유형 목록을 쓰는 곳이 많아 흔들린다. 그래서 유형은 그대로 두고 효과 표식(eff)을 붙인다.
//   eff 'haste'  (buff_all 위): 3턴 동안 아군 전체의 행동 게이지가 power 만큼 빨리 찬다(가속·지름길).
//   eff 'weaken' (debuff 위)  : 3턴 동안 적 전체의 공격을 낮춘다(최대 35%) (공포 주입·연막 폭탄).
// 이름과 효과가 어긋난 나머지는 맞는 유형으로 옮긴다: 미래 시야 → 파티 방어, 위상 전이 → 회피.
// 설명이 "파티 전체 공격 상승." 한 줄뿐이던 스킬은 설명을 다듬는다.
{
  const RETYPE = {
    '가속': { eff: 'haste', desc: '주변의 시간을 빠르게 돌려 3턴 동안 아군 전체의 행동 게이지가 빨리 찬다.' },
    '지름길': { eff: 'haste', desc: '가장 빠른 길로 파티를 이끌어 3턴 동안 아군 전체의 행동 게이지가 빨리 찬다.' },
    '공포 주입': { eff: 'weaken', desc: '적 전체에 공포를 심어 3턴 동안 공격을 꺾는다.' },
    '연막 폭탄': { eff: 'weaken', desc: '매캐한 연막으로 적의 시야를 가려 3턴 동안 적 전체의 공격을 떨어뜨린다.' },
    '미래 시야': { type: 'shield_all', desc: '몇 초 뒤의 전장을 보여 주어 3턴 동안 아군 전체가 공격을 미리 막는다(방어 상승).' },
    '위상 전이': { type: 'evade', desc: '몸을 반쯤 다른 차원에 걸쳐 2턴 동안 공격을 흘려 낸다.' },
  };
  const DESC = {
    '정령 강화': '계약 정령의 힘을 동료들의 무기에 깃들게 해 3턴 동안 아군 전체의 공격을 올린다.',
    '축복': '따스한 빛을 내려 3턴 동안 아군 전체의 공격을 올린다.',
    '전투의 노래': '북돋는 노래로 3턴 동안 아군 전체의 공격을 올린다.',
    '운명 개변': '동료들이 이기는 결말 쪽으로 운명을 비틀어 3턴 동안 아군 전체의 공격을 올린다.',
    '군주의 포효': '군주의 포효로 동료들의 피를 끓여 3턴 동안 아군 전체의 공격을 크게 올린다.',
    '영웅 서사시': '전설의 노래로 모두를 영웅으로 만들어 3턴 동안 아군 전체의 공격을 극한까지 올린다.',
    '폭주': '억눌렀던 힘을 풀어 3턴 동안 자신의 공격을 크게 올린다.',
    '약점 분석': '적의 약점을 드러내 3턴 동안 적 전체의 방어를 낮춘다.',
  };
  const fix = () => {
    if (typeof SKILLS === 'undefined') return;
    for (const s of SKILLS) {
      const r = RETYPE[s.name];
      if (r) { if (r.type) s.type = r.type; if (r.eff) s.eff = r.eff; s.desc = r.desc; }
      else if (DESC[s.name] && /^(파티 전체 공격 상승|모든 아군|모두가|억눌렀던|적의 약점)/.test(s.desc || '')) s.desc = DESC[s.name];
    }
  };
  fix();
  // 나중에 붙는 스킬(확장·직업)도 있으므로 게임 시작 때 한 번 더
  if (typeof Game !== 'undefined' && Game.prototype.initSandbox) {
    const baseInit = Game.prototype.initSandbox;
    Game.prototype.initSandbox = function (...a) { fix(); return baseInit.apply(this, a); };
  }
  const EFF_TEXT = { haste: '아군 전체의 행동 게이지가 3턴간 빨리 찬다', weaken: '적 전체의 공격을 3턴간 낮춘다' };
  const EFF_NAME = { haste: '파티 가속', weaken: '위축' };

  if (typeof Combat !== 'undefined') {
    const C = Combat.prototype;
    const basePrep = C.prep;
    C.prep = function (u) { const r = basePrep.call(this, u); r.haste = 0; r.hasteT = 0; return r; };
    const baseFill = C.fillRate;
    C.fillRate = function (u) { const v = baseFill.call(this, u); return u.hasteT > 0 ? v * (1 + (u.haste || 0)) : v; };
    const baseTurn = C.takeTurn;
    C.takeTurn = function (u) { if (u && u.hasteT > 0 && --u.hasteT === 0) u.haste = 0; return baseTurn.call(this, u); };
    const baseUse = C.useSkill;
    C.useSkill = function (u, skill, target) {
      const eff = skill && (skill.eff || (skillById(skill.id) || {}).eff);
      if (eff !== 'haste' && eff !== 'weaken') return baseUse.call(this, u, skill, target);
      const friends = this.friendsOf(u), foes = this.foesOf(u);
      // 이미 걸려 있으면(AI가 같은 기술을 거듭 고르는 경우) 그냥 공격한다
      if (!u.isPlayer && (eff === 'haste' ? friends.every((f) => f.hasteT > 0) : foes.every((f) => f.buffs.atkT > 0 && f.buffs.atk < 0))) return baseUse.call(this, u, skillById('strike'), target);
      u.mp -= skill.mp;
      this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: skill.elem === 'self' ? u.elem : skill.elem, side: u.side, name: skill.name } });
      const P = skill.power;
      if (eff === 'haste') {
        for (const f of friends) { f.haste = Math.max(f.haste || 0, P); f.hasteT = 3; }
        this.buffEvent(u, `${skill.name} · 파티 행동 가속 (+${Math.round(P * 100)}%)`);
      } else {
        const v = Math.min(0.35, P);
        for (const f of foes) { f.buffs.atk = Math.min(f.buffs.atk > 0 ? 0 : f.buffs.atk, -v); f.buffs.atkT = 3; }
        this.push(`${u.name}의 ${skill.name}: 적 전체가 위축됐다 (공격 -${Math.round(v * 100)}%).`, 'hit', { k: 'aoe', src: u.id, side: u.side, elem: 'dark' });
      }
      this.checkEnd();
    };
  }

  // 스킬 정보창: 종류·효과 줄을 표식에 맞게
  if (typeof UI !== 'undefined' && UI.skillHoldHtml) {
    const baseHold = UI.skillHoldHtml;
    UI.skillHoldHtml = function (sk, u) {
      let h = baseHold.call(this, sk, u);
      const eff = sk && (sk.eff || (skillById(sk.id) || {}).eff);
      if (!eff) return h;
      h = h.replace(`<th>종류</th><td>${TYPE_NAME[sk.type] || sk.type}</td>`, `<th>종류</th><td>${EFF_NAME[eff]}</td>`);
      h = h.replace(`<th>효과</th><td>${SKILL_EFFECT[sk.type] || '-'}</td>`, `<th>효과</th><td>${EFF_TEXT[eff]}</td>`);
      if (eff === 'weaken') h = h.replace(/(<th>위력<\/th><td>)\d+%/, `$1${Math.round(Math.min(0.35, sk.power) * 100)}%`);
      return h;
    };
  }
}
