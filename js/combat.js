// ===== 게이트 크로니클: 턴제 전투 =====

class Combat {
  // opts: { allies, enemies, canFlee, title, lethal, spar }
  constructor(game, opts) {
    this.game = game;
    this.title = opts.title || '전투';
    this.canFlee = opts.canFlee !== false;
    this.spar = !!opts.spar;
    this.units = [...opts.allies, ...opts.enemies].map((u) => ({ ...u, alive: true, buffs: { atk: 0, atkT: 0, def: 0, defT: 0 } }));
    this.log = [];
    this.round = 0;
    this.order = [];
    this.turnIdx = 0;
    this.result = null; // 'win' | 'lose' | 'flee'
    this.waiting = false;
    this.auto = false;
    this.target = null;
    this.kills = [];
    this.nextRound();
    this.advance();
  }

  get player() { return this.units.find((u) => u.isPlayer); }
  allies() { return this.units.filter((u) => u.side === 'ally' && u.alive); }
  enemies() { return this.units.filter((u) => u.side === 'enemy' && u.alive); }
  push(t, cls = '') { this.log.push({ t: fixJosa(t), cls }); if (this.log.length > 60) this.log.shift(); }

  nextRound() {
    this.round++;
    this.order = this.units.filter((u) => u.alive).sort((a, b) => b.spd * (0.9 + Math.random() * 0.2) - a.spd * (0.9 + Math.random() * 0.2));
    this.turnIdx = 0;
  }

  current() { return this.order[this.turnIdx]; }

  // 플레이어 차례가 올 때까지 자동 진행
  advance() {
    let guard = 0;
    while (!this.result && guard++ < 200) {
      if (this.turnIdx >= this.order.length) { this.tickBuffs(); this.nextRound(); }
      const u = this.current();
      if (!u || !u.alive) { this.turnIdx++; continue; }
      if (u.isPlayer && !this.auto) { this.waiting = true; return; }
      this.aiAct(u);
      this.turnIdx++;
      this.checkEnd();
    }
    this.waiting = false;
  }

  tickBuffs() {
    for (const u of this.units) {
      if (u.buffs.atkT > 0 && --u.buffs.atkT === 0) u.buffs.atk = 0;
      if (u.buffs.defT > 0 && --u.buffs.defT === 0) u.buffs.def = 0;
      // 정신력 자연 회복
      if (u.alive) u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * 0.05));
    }
  }

  checkEnd() {
    if (this.result) return;
    const p = this.player;
    if (!p.alive) { this.result = 'lose'; this.push('당신은 쓰러졌다...', 'bad'); return; }
    if (!this.enemies().length) { this.result = 'win'; this.push('전투 승리!', 'good'); }
  }

  pickTarget(u) {
    const foes = u.side === 'ally' ? this.enemies() : this.allies();
    if (!foes.length) return null;
    if (u.side === 'ally') return foes.reduce((a, b) => (a.hp < b.hp ? a : b));
    // 적은 플레이어를 더 자주 노린다
    const pl = foes.find((f) => f.isPlayer);
    if (pl && Math.random() < 0.6) return pl;
    return foes[Math.floor(Math.random() * foes.length)];
  }

  aiAct(u) {
    // 자동 전투 중인 플레이어는 위급하면 회복제를 쓴다
    if (u.isPlayer && u.hp < u.maxHp * 0.35 && this.game.player.items.potion > 0) {
      this.game.player.items.potion--;
      const v = Math.round(u.maxHp * 0.4 * (1 + this.game.mod('heal')));
      u.hp = Math.min(u.maxHp, u.hp + v);
      this.push(`${u.name}이(가) 응급 회복제를 사용했다: 체력 +${v}`, 'heal');
      return;
    }
    const usable = u.skills.map(skillById).filter((s) => s.mp <= u.mp);
    let skill = skillById('strike');
    const heal = usable.find((s) => s.type === 'heal');
    const friends = u.side === 'ally' ? this.allies() : this.enemies();
    const foes = u.side === 'ally' ? this.enemies() : this.allies();
    if (heal && u.hp < u.maxHp * 0.4) skill = heal;
    else {
      const aoe = usable.find((s) => s.type === 'aoe');
      const dmg = usable.filter((s) => s.type === 'dmg' && s.id !== 'strike');
      const buff = usable.find((s) => (s.type === 'buff' && !u.buffs.atkT) || (s.type === 'shield' && !u.buffs.defT));
      if (aoe && foes.length >= 2 && Math.random() < 0.6) skill = aoe;
      else if (buff && Math.random() < 0.3) skill = buff;
      else if (dmg.length && Math.random() < 0.55) skill = dmg[Math.floor(Math.random() * dmg.length)];
    }
    this.useSkill(u, skill, this.pickTarget(u), friends);
  }

  calcDamage(att, def, skill) {
    const atk = att.atk * (1 + att.buffs.atk);
    const d = def.def * (1 + def.buffs.def);
    let dmg = atk * skill.power * atk / (atk + d);
    let note = '';
    const e = skill.elem;
    if (e && def.elem) {
      if (ELEMENTS[e].counter === def.elem) { dmg *= 1.5; note = ' 효과적!'; }
      else if (ELEMENTS[def.elem].counter === e) { dmg *= 0.7; note = ' 저항됨'; }
    }
    if (e && att.affinity === e) dmg *= 1.2;
    if (Math.random() < 0.05 + att.luck / 400) { dmg *= 1.6; note += ' 치명타!'; }
    dmg *= 0.9 + Math.random() * 0.2;
    return { dmg: Math.max(1, Math.round(dmg)), note };
  }

  dealDamage(att, def, skill) {
    const { dmg, note } = this.calcDamage(att, def, skill);
    def.hp -= dmg;
    const cls = att.side === 'ally' ? 'hit' : 'hurt';
    this.push(`${att.name}의 ${skill.name} → ${def.name}에게 ${dmg} 피해${note}`, cls);
    if (def.hp <= 0) {
      // 대련에서는 플레이어가 죽지 않고 체력 1로 패배 처리
      def.hp = this.spar && def.isPlayer ? 1 : 0;
      def.alive = false;
      this.push(`${def.name}이(가) 쓰러졌다.`, def.side === 'enemy' ? 'good' : 'bad');
      if (def.side === 'enemy') this.kills.push(def);
    }
  }

  useSkill(u, skill, target, friends) {
    u.mp -= skill.mp;
    if (skill.type === 'dmg') { if (target) this.dealDamage(u, target, skill); }
    else if (skill.type === 'aoe') {
      const foes = u.side === 'ally' ? this.enemies() : this.allies();
      this.push(`${u.name}이(가) ${skill.name}을(를) 펼쳤다!`, u.side === 'ally' ? 'hit' : 'hurt');
      for (const f of foes) this.dealDamage(u, f, skill);
    } else if (skill.type === 'heal') {
      const v = Math.round(u.maxHp * skill.power);
      u.hp = Math.min(u.maxHp, u.hp + v);
      this.push(`${u.name}의 ${skill.name}: 체력 +${v}`, 'heal');
    } else if (skill.type === 'buff') {
      u.buffs.atk = skill.power; u.buffs.atkT = 3;
      this.push(`${u.name}의 ${skill.name}: 공격력 상승!`, 'heal');
    } else if (skill.type === 'shield') {
      u.buffs.def = skill.power * 2; u.buffs.defT = 3;
      this.push(`${u.name}의 ${skill.name}: 방어력 상승!`, 'heal');
    }
  }

  // ----- 플레이어 입력 -----
  playerSkill(id) {
    if (!this.waiting || this.result) return;
    const p = this.player; const skill = skillById(id);
    if (skill.mp > p.mp) { this.push('정신력이 부족하다.', 'bad'); return; }
    let target = this.target && this.target.alive ? this.target : this.enemies()[0];
    this.useSkill(p, skill, target, this.allies());
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
    if (c.effect === 'hp') { const v = Math.round(p.maxHp * c.val * mul); p.hp = Math.min(p.maxHp, p.hp + v); this.push(`${c.name} 사용: 체력 +${v}`, 'heal'); }
    else { const v = Math.round(p.maxMp * c.val * mul); p.mp = Math.min(p.maxMp, p.mp + v); this.push(`${c.name} 사용: 정신력 +${v}`, 'heal'); }
    this.endPlayerTurn();
  }
  playerFlee() {
    if (!this.waiting || this.result || !this.canFlee) return;
    const p = this.player;
    const es = this.enemies();
    const avg = es.reduce((a, e) => a + e.spd, 0) / es.length;
    const chance = Math.max(0.2, Math.min(0.9, 0.5 + (p.spd - avg) / (p.spd * 2)));
    if (Math.random() < chance) { this.result = 'flee'; this.push('전장에서 이탈했다.', ''); this.waiting = false; return; }
    this.push('도주에 실패했다!', 'bad');
    this.endPlayerTurn();
  }
  setTarget(id) { const t = this.units.find((u) => u.id === id && u.alive && u.side === 'enemy'); if (t) this.target = t; }
  toggleAuto() { this.auto = !this.auto; if (this.auto && this.waiting) { this.waiting = false; this.advance(); } }

  endPlayerTurn() {
    this.waiting = false;
    this.turnIdx++;
    this.checkEnd();
    this.advance();
  }
}
