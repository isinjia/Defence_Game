// ===== 공격 거리: 근접 / 원거리 (사용자 결정, 2026-11-16) =====
// - 일반 공격(기본 타격)은 장착한 무기 계열을 따른다. 검·창·건틀릿·단검·방패는 근접, 총·활·지팡이·악기·드론은 원거리.
//   무기가 없으면 맨손(근접). NPC는 장비가 없으므로 직업군의 대표 무기 계열을 쓴다(gear.js GROUP_FAMS 첫 번째).
// - 스킬은 저마다 '거리' 속성(skill.range: 'melee' | 'ranged')을 가진다. 태그·접사가 아니라 스킬 자체의 속성이다.
//   공격 스킬(피해·광역·치명·지속·흡수·연타·관통·기절·약화)에만 붙는다. 회복·보호·버프·패시브는 거리가 없다.
//   직접 정한 값(RANGE_SET)이 먼저, 없으면 이름·설명의 말(쏜다·화살 / 벤다·주먹 등), 그래도 모르면 직업 역할로 정한다.
// - 괴수·소환수: 일반 공격은 생김새(유령·눈·드론·핵·합창단은 원거리, 나머지는 근접. 사람형은 이름으로), 괴수 기술은 RANGE_SET.
// - 전투 규칙(formation.js): 후열에서 근접 공격을 하면 피해 −25%. 암살자는 후열에서 파고드므로 예외.
//   (전에는 공격 종류와 상관없이 '근접 역할 직업이 후열이면' −25%였다.)
const RANGE_NAME = { melee: '근접', ranged: '원거리' };
const FAM_RANGE = { sword: 'melee', spear: 'melee', fist: 'melee', dagger: 'melee', shield: 'melee', gun: 'ranged', bow: 'ranged', staff: 'ranged', instr: 'ranged', drone: 'ranged' };
const RANGE_ATTACK_TYPES = ['dmg', 'aoe', 'crit', 'dot', 'drain', 'multi', 'pierce', 'stun', 'debuff'];
// 기본 스킬 직접 지정 (strike 는 무기를 따른다)
const RANGE_SET = {
  flame_fist: 'melee', static: 'ranged', frost: 'ranged', shade: 'ranged', inferno: 'ranged', chain: 'ranged', glacier: 'ranged',
  soulfire: 'ranged', meteor: 'ranged', thunder_god: 'ranged', absolute: 'ranged',
  // 괴수 전용 기술 (monster_pack.js). 감싸기·치유·졸개 부르기·도주·함성·진혼곡은 공격이 아니라 거리가 없다
  m_pounce: 'melee', m_blast: 'melee', m_sap: 'melee', b_dive: 'melee', b_devour: 'melee',
  b_breath: 'ranged', b_web: 'ranged', b_song: 'ranged', b_quake: 'ranged', b_gaze: 'ranged', b_tide: 'ranged', b_laser: 'ranged', b_nova: 'ranged',
};
// 괴수·소환수의 일반 공격: 생김새로 정한다. 사람형은 이름으로(주술사·사제·궁수 등은 원거리)
const SHAPE_RANGE = { beast: 'melee', golem: 'melee', slime: 'melee', spider: 'melee', swarm: 'melee', mimic: 'melee', flyer: 'melee', dragon: 'melee', humanoid: 'melee', lord: 'melee',
  ghost: 'ranged', eye: 'ranged', drone: 'ranged', core: 'ranged', choir: 'ranged' };
const RANGED_NAME = /주술사|사제|궁수|사수|저격|포수|마법사|마술사|무녀|세이렌|합창|망령|해파리/;
{
  const RE_RANGED = /쏜|쏘|쏴|사격|탄환|탄막|총|화살|활|저격|발사|광선|빔|레이저|포격|폭격|투척|던진|던져|날린|날려|낙하|떨어|낙뢰|번개|전격|폭풍|파동|음파|노래|선율|연주|주문|마법진|구체|드론|원격|멀리|빗발|비처럼|퍼붓|쏟아|시선|염동|소환수|부른다|불러|저주|한 발|두 발|세 발|발을 쏘|탄창/;
  const RE_MELEE = /주먹|권|베어|벤다|베기|베는|찌른|찔러|찌르|휘둘|후려|돌진|박치기|발차기|차기|칼날|검을|검으로|검기|창으로|창을|도끼|일격|물어|할퀴|낫으로|난도|연타|육탄|몸통|들이받|움켜|목을|단검|비수|근접|파고들|달려들|부딪|내리찍|짓밟|맨손|손날|팔꿈치|무릎|창끝/;
  const ROLE_RANGE = { tank: 'melee', melee: 'melee', assassin: 'melee', ranged: 'ranged', caster: 'ranged', summoner: 'ranged', support: 'ranged', esper: 'ranged' };
  const guess = (s) => {
    if (RANGE_SET[s.id]) return RANGE_SET[s.id];
    const t = `${s.name || ''} ${s.desc || ''}`.replace(/\S+처럼/g, ''); // '번개처럼 꿰뚫어' 같은 비유는 빼고 본다
    const r = (t.match(new RegExp(RE_RANGED.source, 'g')) || []).length; const m = (t.match(new RegExp(RE_MELEE.source, 'g')) || []).length;
    if (r > m) return 'ranged';
    if (m > r) return 'melee';
    const c = s.cls && typeof classById === 'function' ? classById(s.cls) : null;
    if (c && ROLE_RANGE[c.role]) return ROLE_RANGE[c.role];
    return s.type === 'aoe' ? 'ranged' : 'melee';
  };
  // 모든 스킬 정의가 끝난 뒤(빌드 순서상 이 파일은 뒤쪽) 한 번 채운다. 나중에 더해지는 스킬은 skillRange 가 그때 정한다.
  const rangeOf = (s) => RANGE_SET[s.id] || (RANGE_ATTACK_TYPES.includes(s.type) ? guess(s) : null);
  const fill = () => { for (const s of SKILLS) if (s && s.range === undefined && s.id !== 'strike') s.range = rangeOf(s); };
  fill();

  const GP = Game.prototype;
  // 무기 계열의 거리
  GP.weaponRange = function (it) { const fam = it && this.weaponFam ? this.weaponFam(it) : null; return FAM_RANGE[fam] || 'melee'; };
  // 유닛의 일반 공격 거리: 플레이어는 장착 무기, NPC는 직업군 대표 무기, 괴수·소환수는 생김새(사람형은 이름)
  GP.unitWeaponRange = function (u) {
    if (!u) return 'melee';
    if (u.isPlayer) { const w = this.player && this.player.equip && this.player.equip.weapon; return w ? this.weaponRange(w) : 'melee'; }
    const c = u.cls && typeof classById === 'function' ? classById(u.cls) : null;
    if (!c && (u.shape || u.summon || u.side === 'enemy')) {
      if (RANGED_NAME.test(String(u.name || ''))) return 'ranged';
      return SHAPE_RANGE[u.shape] || 'melee';
    }
    const fam = c && typeof GROUP_FAMS !== 'undefined' && GROUP_FAMS[c.g] ? GROUP_FAMS[c.g][0] : null;
    return FAM_RANGE[fam] || 'melee';
  };
  // 스킬의 거리 (일반 공격이면 무기). 공격이 아닌 스킬은 null
  GP.skillRange = function (sk, u) {
    if (!sk) return null;
    if (sk.id === 'strike') return u ? this.unitWeaponRange(u) : (this.player ? this.unitWeaponRange({ isPlayer: true }) : 'melee');
    const def = sk.range !== undefined ? sk : (SKILLS.find((x) => x.id === sk.id) || sk);
    if (def.range === undefined) def.range = rangeOf(def);
    return def.range;
  };
}

// 스킬 정보 팝업: '대상' 아래에 '거리' 줄
if (typeof UI !== 'undefined' && UI.skillHoldHtml) {
  const base = UI.skillHoldHtml;
  UI.skillHoldHtml = function (sk, u, ...a) {
    let h = base.call(this, sk, u, ...a);
    try {
      const r = G.skillRange(sk, u || (G.player ? { isPlayer: true } : null));
      if (r) {
        let txt = RANGE_NAME[r];
        if (sk.id === 'strike') {
          const w = (!u || u.isPlayer) && G.player && G.player.equip && G.player.equip.weapon;
          const fam = w && G.weaponFam ? G.weaponFam(w) : null;
          const who = u && !u.isPlayer ? (u.summon ? '소환수' : u.cls && classById(u.cls) ? '직업 무기' : '괴수') : null;
          txt += ` <span class="dim small">(${fam && typeof WEAPON_FAMS !== 'undefined' ? `${WEAPON_FAMS[fam].name} 장착` : who || '맨손'})</span>`;
        }
        const row = `<tr><th>거리</th><td>${txt}</td></tr>`;
        h = /<tr><th>대상<\/th>[\s\S]*?<\/tr>/.test(h) ? h.replace(/(<tr><th>대상<\/th>[\s\S]*?<\/tr>)/, `$1${row}`) : h.replace(/(<table class="sh-table[^"]*">)/, `$1${row}`);
      }
    } catch (e) { /* 실패하면 원래 창 */ }
    return h;
  };
}
