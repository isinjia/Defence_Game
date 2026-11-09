// ===== 게이트 크로니클: 턴제 파티 전투 =====
// 아군 최대 5명 (+소환수). 플레이어 외 아군은 직업 역할에 맞춰 AI가 싸운다.

// 성격별 전투 대사
const BARKS = {
  warlike: ['덤벼!', '이 정도냐?', '부숴 주마!', '하하, 재밌군!', '피가 끓는다!'],
  kind: ['괜찮아?', '내가 지켜 줄게!', '조금만 버텨!', '다치지 마!', '같이 살아서 나가자!'],
  greedy: ['그 코어 내 거야!', '막타는 내 몫!', '보수 올려 줘야 해!', '돈값은 한다!', '이건 추가 수당감이야.'],
  just: ['물러서지 마!', '내가 막는다!', '동료는 못 건드려!', '등 뒤는 맡겨!', '여기서 끝낸다!'],
  cold: ['…', '비효율적이군.', '끝낸다.', '약점은 거기다.', '시간 낭비다.'],
};
// 성격별 치유 시작 기준 (체력 비율)
const HEAL_AT = { kind: 0.72, just: 0.6, cold: 0.35, warlike: 0.35, greedy: 0.45 };

const SUMMON_NAME = { summoner: '정령', necromancer: '해골 병사', shade: '그림자 분신', shaman: '원귀', spiritist: '나무 정령', tamer: '길들인 괴수', apostle: '균열 괴수', machinist: '전투 드론' };

class Combat {
  // opts: { allies, enemies, canFlee, title, spar }
  constructor(game, opts) {
    this.game = game;
    this.title = opts.title || '전투';
    this.canFlee = opts.canFlee !== false;
    this.spar = !!opts.spar;
    this.units = [...opts.allies, ...opts.enemies].map((u) => this.prep(u));
    this.log = [];
    this.round = 1; this.actions = 0;
    this.result = null; this.waiting = false; this.auto = false; this.target = null; this.active = null;
    this.kills = [];
    // 평균 속도의 캐릭터가 약 2.4초에 한 번 행동하도록
    const sp = this.units.map((u) => u.spd); this.meanSpd = sp.reduce((a, b) => a + b, 0) / sp.length || 10;
    for (const u of this.units) u.atb = Math.random() * 35 + (u.spd / this.meanSpd) * 15;
    this.initial = Object.fromEntries(this.units.map((u) => [u.id, { hp: u.hp, mp: u.mp }]));
  }
  prep(u) { return { ...u, alive: u.hp > 0, atb: 0, buffs: { atk: 0, atkT: 0, def: 0, defT: 0 }, stun: 0, poison: null, evadeT: 0, tauntT: 0 }; }

  get player() { return this.units.find((u) => u.isPlayer); }
  side(s) { return this.units.filter((u) => u.side === s && u.alive); }
  allies() { return this.side('ally'); }
  enemies() { return this.side('enemy'); }
  friendsOf(u) { return this.side(u.side); }
  foesOf(u) { return this.side(u.side === 'ally' ? 'enemy' : 'ally'); }
  push(t, cls = '', ev = null) { this.log.push({ t: t ? fixJosa(t) : '', cls, ev }); }
  fillRate(u) { return (u.spd / this.meanSpd) * (100 / 2.4); } // 초당 게이지 증가량

  // ---------- ATB: 시간이 흐르며 게이지가 찬다 ----------
  // dt초만큼 게이지를 채우고, 가득 찬 캐릭터가 있으면 돌려준다
  tick(dt) {
    if (this.result || this.waiting) return null;
    let ready = null;
    for (const u of this.units) {
      if (!u.alive) continue;
      u.atb = Math.min(100, u.atb + this.fillRate(u) * dt);
      if (u.atb >= 100 && (!ready || u.spd > ready.spd)) ready = u;
    }
    return ready;
  }
  // 다음 캐릭터가 준비될 때까지 시간을 건너뛴다 (시뮬레이션용)
  skipToNext() {
    let best = Infinity;
    for (const u of this.units) if (u.alive) best = Math.min(best, (100 - u.atb) / this.fillRate(u));
    return this.tick(Math.max(0, best) + 1e-6);
  }
  // 차례가 된 캐릭터의 행동 시작. 플레이어면 입력을 기다린다.
  takeTurn(u) {
    this.actions++;
    this.round = 1 + Math.floor(this.actions / Math.max(1, this.units.filter((x) => x.alive).length));
    this.active = u;
    // 자기 차례가 올 때 지속 효과가 줄어든다
    if (u.buffs.atkT > 0 && --u.buffs.atkT === 0) u.buffs.atk = 0;
    if (u.buffs.defT > 0 && --u.buffs.defT === 0) u.buffs.def = 0;
    if (u.evadeT > 0) u.evadeT--;
    if (u.tauntT > 0) u.tauntT--;
    u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * 0.05));
    if (u.poison) {
      u.hp -= u.poison.dmg; u.poison.t--;
      this.push(`${u.name}이(가) 중독으로 ${u.poison.dmg} 피해`, u.side === 'enemy' ? 'hit' : 'hurt', { k: 'dmg', dst: u.id, amt: u.poison.dmg, elem: null, hp: Math.max(0, u.hp), killed: u.hp <= 0, dot: true });
      if (u.poison.t <= 0) u.poison = null;
      if (u.hp <= 0) { this.down(u); this.checkEnd(); u.atb = 0; return 'done'; }
    }
    if (u.stun > 0) { u.stun--; u.atb = 0; this.push(`${u.name}은(는) 기절해 움직이지 못한다.`, '', { k: 'note', dst: u.id }); return 'done'; }
    if (u.isPlayer && !this.auto) { this.waiting = true; return 'wait'; }
    this.aiAct(u);
    u.atb = 0;
    this.checkEnd();
    return 'done';
  }
  // 연출 없이 끝까지 진행 (시뮬레이션용)
  runAll() {
    this.auto = true; let g = 0;
    while (!this.result && g++ < 3000) {
      const u = this.skipToNext();
      if (u) this.takeTurn(u);
    }
  }

  down(u) {
    u.hp = this.spar && u.isPlayer ? 1 : 0; u.alive = false;
    this.push(`${u.name}이(가) 쓰러졌다.`, u.side === 'enemy' ? 'good' : 'bad', { k: 'down', dst: u.id });
    if (u.side === 'ally' && !u.summon) {
      const friend = this.allies().find((f) => f.pers && !f.isPlayer && f !== u);
      if (friend) { const t = friend.pers === 'kind' ? `${u.name}!! 안 돼!` : friend.pers === 'warlike' ? '이 자식들, 가만 안 둬!' : friend.pers === 'cold' ? '…하나 줄었군.' : friend.pers === 'greedy' ? '이거 위험수당 나오는 거지?' : `${u.name}의 몫까지 싸운다!`; this.push(`${friend.name}: "${t}"`, '', { k: 'say', src: friend.id, text: t }); }
    }
    if (u.side === 'enemy' && !u.summon) this.kills.push(u);
  }

  checkEnd() {
    if (this.result) return;
    const p = this.player;
    const allyCore = this.units.filter((u) => u.side === 'ally' && !u.summon && u.alive);
    if ((this.spar && !p.alive) || !allyCore.length) { this.result = 'lose'; this.push('파티가 무너졌다…', 'bad'); return; }
    if (!this.enemies().length) { this.result = 'win'; this.push('전투 승리!', 'good'); }
  }

  pickTarget(u) {
    const foes = this.foesOf(u);
    if (!foes.length) return null;
    if (u.side === 'ally') {
      if (u.isPlayer && this.target && this.target.alive) return this.target;
      switch (u.pers) {
        case 'warlike': return foes.reduce((a, b) => ((b.boss ? 1e9 : 0) + b.maxHp > (a.boss ? 1e9 : 0) + a.maxHp ? b : a)); // 가장 강한 적
        case 'greedy': return foes.reduce((a, b) => (a.hp < b.hp ? a : b)); // 막타
        case 'cold': { const adv = foes.find((f) => u.elem && f.elem && elemMult(u.elem, f.elem) > 1); return adv || foes.reduce((a, b) => (a.def < b.def ? a : b)); }
        case 'just': case 'kind': {
          // 다친 동료를 때린 적부터
          const weak = this.allies().filter((f) => !f.summon).reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), u);
          const culprit = weak.lastHitBy && this.units.find((x) => x.id === weak.lastHitBy && x.alive);
          return culprit || foes.reduce((a, b) => (a.hp < b.hp ? a : b));
        }
        default: return foes.reduce((a, b) => (a.hp < b.hp ? a : b));
      }
    }
    const taunter = foes.find((f) => f.tauntT > 0);
    if (taunter && Math.random() < 0.8) return taunter;
    const pl = foes.find((f) => f.isPlayer);
    if (pl && Math.random() < 0.35) return pl;
    return foes[Math.floor(Math.random() * foes.length)];
  }

  bark(u, force) {
    if (!u.pers || u.isPlayer || !BARKS[u.pers]) return;
    if (!force && Math.random() > 0.16) return;
    const t = BARKS[u.pers][Math.floor(Math.random() * BARKS[u.pers].length)];
    this.push(`${u.name}: "${t}"`, '', { k: 'say', src: u.id, text: t });
  }

  // ---------- AI: 직업과 성격으로 행동 결정 ----------
  aiAct(u) {
    // 탐욕: 체력이 바닥나면 혼자 달아난다
    if (u.pers === 'greedy' && u.side === 'ally' && !u.isPlayer && !this.spar && u.hp < u.maxHp * 0.25 && Math.random() < 0.35) {
      u.alive = false; u.fled = true;
      this.push(`${u.name}이(가) "목숨값은 따로 안 받았거든!" 하고 전장에서 달아났다.`, 'bad', { k: 'flee', src: u.id });
      this.checkEnd();
      return;
    }
    this.bark(u);
    const g = this.game;
    if (u.isPlayer && u.hp < u.maxHp * 0.35 && g.player.items.potion > 0) {
      g.player.items.potion--;
      const v = Math.round(u.maxHp * 0.4 * (1 + g.mod('heal')));
      u.hp = Math.min(u.maxHp, u.hp + v);
      this.push(`${u.name}이(가) 응급 회복제를 사용했다: 체력 +${v}`, 'heal', { k: 'heal', dst: u.id, amt: v, hp: u.hp });
      return;
    }
    const usable = u.skills.map(skillById).filter((s) => s && s.mp <= u.mp);
    const has = (t) => usable.filter((s) => s.type === t);
    const friends = this.friendsOf(u), foes = this.foesOf(u);
    const healAt = HEAL_AT[u.pers] ?? 0.55;
    const hurt = friends.filter((f) => f.hp < f.maxHp * healAt && !f.summon);
    const war = u.pers === 'warlike';
    const fallen = this.units.filter((f) => f.side === u.side && !f.alive && !f.summon);
    const mySummons = this.units.filter((f) => f.alive && f.summonOf === u.id).length;
    const R = Math.random;
    const choose = (list) => list.length ? list.reduce((a, b) => (b.power > a.power ? b : a)) : null;
    let skill = null;
    if (!skill && fallen.length && has('revive').length && R() < 0.8) skill = has('revive')[0];
    if (!skill && hurt.length >= 2 && has('heal_all').length) skill = choose(has('heal_all'));
    if (!skill && hurt.length >= 1 && has('heal_ally').length) skill = choose(has('heal_ally'));
    if (!skill && u.hp < u.maxHp * 0.4 && has('heal').length) skill = has('heal')[0];
    if (!skill && has('taunt').length && !u.tauntT && friends.length > 1) skill = has('taunt')[0];
    // 의협: 위기의 동료가 있으면 도발로 막아선다
    if (!skill && u.pers === 'just' && has('taunt').length && friends.some((f) => f !== u && f.hp < f.maxHp * 0.35)) skill = has('taunt')[0];
    if (!skill && has('summon').length && mySummons < 2 && R() < 0.7) skill = choose(has('summon'));
    const support = war ? 0.15 : u.pers === 'kind' ? 0.75 : 0.5;
    if (!skill && has('buff_all').length && !friends.some((f) => f.buffs.atkT) && R() < support) skill = choose(has('buff_all'));
    if (!skill && has('shield_all').length && !friends.some((f) => f.buffs.defT) && (hurt.length || this.round === 1) && R() < support) skill = choose(has('shield_all'));
    if (!skill && has('debuff').length && !foes.some((f) => f.buffs.def < 0) && R() < (u.pers === 'cold' ? 0.7 : war ? 0.1 : 0.4)) skill = has('debuff')[0];
    if (!skill && has('evade').length && !u.evadeT && u.hp < u.maxHp * 0.6 && R() < (war ? 0.05 : u.pers === 'greedy' ? 0.7 : 0.4)) skill = has('evade')[0];
    if (!skill && (has('buff').length || has('shield').length) && !u.buffs.atkT && !u.buffs.defT && R() < 0.25) skill = (has('buff')[0] || has('shield')[0]);
    if (!skill && has('aoe').length && foes.length >= 2 && R() < (war ? 0.85 : 0.65)) skill = choose(has('aoe'));
    if (!skill && has('stun').length && foes.some((f) => f.boss || f.maxHp > u.maxHp) && R() < 0.5) skill = choose(has('stun'));
    if (!skill) {
      const atk = usable.filter((s) => ['dmg', 'crit', 'pierce', 'multi', 'dot', 'drain', 'stun'].includes(s.type) && s.id !== 'strike');
      // 호전: 늘 가장 센 기술 / 냉담: 정신력을 아껴 효율적으로 / 탐욕: 막타용 연타·치명
      if (atk.length && war) skill = choose(atk);
      else if (atk.length && u.pers === 'cold') { const t = this.pickTarget(u); skill = t && t.hp < u.atk * 1.2 ? null : choose(atk); }
      else if (atk.length && u.pers === 'greedy') { const pref = atk.filter((s) => s.type === 'multi' || s.type === 'crit'); skill = pref.length && R() < 0.7 ? choose(pref) : choose(atk); }
      else if (atk.length && R() < 0.7) skill = R() < 0.6 ? choose(atk) : atk[Math.floor(R() * atk.length)];
    }
    if (!skill) skill = skillById('strike');
    this.useSkill(u, skill, this.pickTarget(u));
  }

  calcDamage(att, def, skill, opt = {}) {
    const atk = att.atk * (1 + att.buffs.atk);
    const d = Math.max(0, def.def * (1 + def.buffs.def) * (opt.pierce ? 0.3 : 1));
    let dmg = atk * skill.power * atk / (atk + d);
    let note = '';
    const e = skill.elem === 'self' ? att.elem : skill.elem;
    if (e && def.elem) {
      const em = elemMult(e, def.elem);
      if (em > 1) { dmg *= em; note = ' 효과적!'; }
      else if (em < 1) { dmg *= em; note = ' 저항됨'; }
    }
    if (e && att.affinity === e) dmg *= 1.2;
    if (e && att.clsElem === e) dmg *= CLASS_ELEM_POWER; // 직업 친화 속성 (4-10)
    if (Math.random() < 0.05 + att.luck / 400 + (opt.crit || 0)) { dmg *= 1.6; note += ' 치명타!'; }
    dmg *= 0.9 + Math.random() * 0.2;
    return { dmg: Math.max(1, Math.round(dmg)), note, elem: e };
  }

  dealDamage(att, def, skill, opt = {}) {
    // 의협·온화한 동료가 위기의 아군을 감싸 대신 맞는다
    if (def.side === 'ally' && !def.summon && def.hp < def.maxHp * 0.35) {
      const cover = this.allies().find((f) => f !== def && !f.summon && !f.isPlayer && (f.pers === 'just' || f.pers === 'kind') && f.hp > f.maxHp * 0.6 && !f.stun);
      if (cover && Math.random() < 0.38) {
        this.push(`${cover.name}이(가) ${def.name}을(를) 감싸며 막아섰다!`, 'heal', { k: 'cover', src: cover.id, dst: def.id });
        def = cover;
      }
    }
    def.lastHitBy = att.id;
    if (def.evadeT > 0 && Math.random() < 0.6) {
      this.push(`${def.name}이(가) ${skill.name}을(를) 피했다!`, '', { k: 'miss', dst: def.id });
      return 0;
    }
    const { dmg, note, elem } = this.calcDamage(att, def, skill, opt);
    def.hp -= dmg;
    const killed = def.hp <= 0;
    this.push(`${att.name}의 ${skill.name} → ${def.name}에게 ${dmg} 피해${note}`, att.side === 'ally' ? 'hit' : 'hurt',
      { k: 'dmg', src: att.id, dst: def.id, amt: dmg, elem, crit: note.includes('치명타'), eff: note.includes('효과적'), hp: Math.max(0, def.hp), killed });
    if (killed) this.down(def);
    return dmg;
  }

  buffEvent(u, txt) { this.push(`${u.name}: ${txt}`, 'heal', { k: 'buff', dst: u.id, mp: u.mp }); }
  healUnit(u, v, by) {
    const amt = Math.round(by && by === u ? v * 0.55 : v); // 자기 자신을 치유할 땐 효율이 떨어진다
    u.hp = Math.min(u.maxHp, u.hp + amt);
    this.push(`${by ? by.name + '의 치유 → ' : ''}${u.name} 체력 +${amt}`, 'heal', { k: 'heal', dst: u.id, amt, hp: u.hp });
  }

  useSkill(u, skill, target) {
    u.mp -= skill.mp;
    this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: skill.elem === 'self' ? u.elem : skill.elem, side: u.side, name: skill.id === 'strike' ? '' : skill.name } });
    const friends = this.friendsOf(u), foes = this.foesOf(u);
    const P = skill.power;
    switch (skill.type) {
      case 'dmg': if (target) this.dealDamage(u, target, skill); break;
      case 'crit': if (target) this.dealDamage(u, target, skill, { crit: 0.45 }); break;
      case 'pierce': if (target) this.dealDamage(u, target, skill, { pierce: true }); break;
      case 'multi': for (let i = 0; i < 3; i++) { const f = this.foesOf(u); if (!f.length) break; this.dealDamage(u, f[Math.floor(Math.random() * f.length)], skill); } break;
      case 'dot': if (target && this.dealDamage(u, target, skill) && target.alive) { target.poison = { dmg: Math.max(1, Math.round(u.atk * P * 0.3)), t: 3 }; this.push(`${target.name}이(가) 중독됐다.`, 'hit', { k: 'note', dst: target.id }); } break;
      case 'stun': if (target && this.dealDamage(u, target, skill) && target.alive && Math.random() < (target.boss ? 0.25 : 0.5)) { target.stun = 1; this.push(`${target.name}이(가) 기절했다!`, 'hit', { k: 'note', dst: target.id }); } break;
      case 'drain': if (target) { const d = this.dealDamage(u, target, skill); if (d) this.healUnit(u, d * 0.5); } break;
      case 'aoe':
        this.push(`${u.name}이(가) ${skill.name}을(를) 펼쳤다!`, u.side === 'ally' ? 'hit' : 'hurt', { k: 'aoe', src: u.id, side: u.side, elem: skill.elem === 'self' ? u.elem : skill.elem });
        for (const f of foes) this.dealDamage(u, f, skill);
        break;
      case 'debuff': for (const f of foes) { f.buffs.def = -Math.min(0.6, P); f.buffs.defT = 3; } this.push(`${u.name}의 ${skill.name}: 적 전체의 방어가 무너졌다.`, 'hit', { k: 'aoe', src: u.id, side: u.side, elem: 'dark' }); break;
      case 'taunt': u.tauntT = 2; u.buffs.def = Math.max(u.buffs.def, P); u.buffs.defT = 2; this.buffEvent(u, `${skill.name}! 적의 시선이 쏠린다.`); break;
      case 'shield_all': for (const f of friends) { f.buffs.def = Math.max(f.buffs.def, P); f.buffs.defT = 3; } this.buffEvent(u, `${skill.name} · 파티 방어 상승`); break;
      case 'buff_all': for (const f of friends) { f.buffs.atk = Math.max(f.buffs.atk, P); f.buffs.atkT = 3; } this.buffEvent(u, `${skill.name} · 파티 공격 상승`); break;
      case 'heal_ally': { const t = target && target.side === u.side && target.alive && !target.summon ? target : friends.filter((f) => !f.summon).reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), u); this.healUnit(t, t.maxHp * P, u); break; }
      case 'heal_all': for (const f of friends) this.healUnit(f, f.maxHp * P * (friends.length === 1 ? 0.55 : 1), null); break;
      case 'heal': this.healUnit(u, u.maxHp * P); break;
      case 'revive': {
        const t = this.units.find((f) => f.side === u.side && !f.alive && !f.summon);
        if (t) { t.alive = true; t.hp = Math.round(t.maxHp * P); this.push(`${u.name}의 ${skill.name}! ${t.name}이(가) 다시 일어섰다.`, 'heal', { k: 'heal', dst: t.id, amt: t.hp, hp: t.hp, revive: true }); t.atb = 30; }
        else this.healUnit(u, u.maxHp * 0.2);
        break;
      }
      case 'evade': u.evadeT = 2; this.buffEvent(u, `${skill.name} · 회피 태세`); break;
      case 'buff': u.buffs.atk = P; u.buffs.atkT = 3; this.buffEvent(u, `${skill.name} · 공격력 상승`); break;
      case 'shield': u.buffs.def = P * 2; u.buffs.defT = 3; this.buffEvent(u, `${skill.name} · 방어력 상승`); break;
      case 'summon': {
        const n = this.units.filter((f) => f.summonOf === u.id && f.alive).length;
        if (n >= 2) { this.dealDamage(u, target || foes[0], skillById('strike')); break; }
        const s = {
          id: `${u.id}_s${Math.random().toString(36).slice(2, 6)}`, name: SUMMON_NAME[u.cls] || '소환수', side: u.side, summon: true, summonOf: u.id,
          hp: Math.round(u.maxHp * (0.5 + P * 0.6)), maxHp: Math.round(u.maxHp * (0.5 + P * 0.6)), mp: 0, maxMp: 1,
          atk: Math.round(u.atk * (0.45 + P * 0.5)), def: Math.round(u.def * 0.7), spd: u.spd, luck: 5, elem: u.elem, skills: ['strike'],
          shape: { summoner: 'ghost', necromancer: 'ghost', shade: 'ghost', shaman: 'ghost', spiritist: 'golem', tamer: 'beast', apostle: 'eye', machinist: 'drone' }[u.cls] || 'slime', tier: 0,
        };
        const su = this.prep(s); su.atb = Math.random() * 40; this.units.push(su);
        this.push(`${u.name}이(가) ${s.name}을(를) 불러냈다!`, 'heal', { k: 'summon', dst: su.id, src: u.id });
        break;
      }
      default: if (target) this.dealDamage(u, target, skill);
    }
    this.checkEnd();
  }

  // ----- 플레이어 입력 (내 차례일 때만) -----
  playerSkill(id, targetId) {
    if (!this.waiting || this.result) return;
    const p = this.player; const skill = this.game.skillEff ? this.game.skillEff(skillById(id)) : skillById(id);
    if (skill.mp > p.mp) { this.push('정신력이 부족하다.', 'bad'); return; }
    const picked = targetId != null ? this.units.find((u) => u.id === targetId && u.alive) : null;
    if (picked && picked.side === 'enemy') this.target = picked;
    const target = picked || (this.target && this.target.alive ? this.target : this.enemies()[0]);
    this.useSkill(p, skill, target);
    this.endPlayerTurn();
  }
  playerItem(id) {
    if (!this.waiting || this.result) return;
    const g = this.game; const p = this.player;
    if (!g.player.items[id]) return;
    const c = CONSUMABLES.find((x) => x.id === id);
    if (c.effect !== 'hp' && c.effect !== 'mp') return;
    g.player.items[id]--;
    const mul = 1 + g.mod('heal');
    if (c.effect === 'hp') this.healUnit(p, p.maxHp * c.val * mul);
    else { const v = Math.round(p.maxMp * c.val * mul); p.mp = Math.min(p.maxMp, p.mp + v); this.push(`${c.name} 사용: 정신력 +${v}`, 'heal', { k: 'mp', dst: p.id, mp: p.mp }); }
    this.endPlayerTurn();
  }
  playerFlee() {
    if (!this.waiting || this.result || !this.canFlee) return;
    const p = this.player; const es = this.enemies();
    const avg = es.reduce((a, e) => a + e.spd, 0) / es.length;
    const chance = Math.max(0.2, Math.min(0.9, 0.5 + (p.spd - avg) / (p.spd * 2)));
    if (Math.random() < chance) { this.result = 'flee'; this.push('전장에서 이탈했다.', ''); this.waiting = false; return; }
    this.push('도주에 실패했다!', 'bad');
    this.endPlayerTurn();
  }
  setTarget(id) { const t = this.units.find((u) => u.id === id && u.alive && u.side === 'enemy'); if (t) this.target = t; }
  toggleAuto() { this.auto = !this.auto; }
  autoStep() {
    if (!this.waiting || this.result) return;
    this.waiting = false;
    this.aiAct(this.player);
    this.player.atb = 0;
    this.checkEnd();
  }
  endPlayerTurn() {
    this.waiting = false;
    this.player.atb = 0;
    this.checkEnd();
  }
}
