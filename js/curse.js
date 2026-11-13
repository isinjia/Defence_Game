// ===== 감정·저주 유물 · 에테르 오염·한계 돌파 =====
// 설계: docs/헌터물_제안3.md 10·6
//  - 보스·히든 구역에서 나온 유물과 장비 일부는 '미감정'이다. 감정·치료소에서 감정하면 등급과 정체가 드러난다.
//    일부는 저주받았다: 능력이 크게 오르지만 운·친화·수명이 깎이고, 장비는 벗을 수 없다. 해제는 비싸다.
//  - 에테르 오염(p.taint 0~100): 레드 게이트, 고위력·각성 스킬, 한계 돌파로 쌓인다.
//    높을수록 공격이 오르지만 60 이상이면 전투 중 폭주, 100을 넘으면 수명이 깎인다. 휴식·숙박·정화로 낮춘다.

const UNID_RELIC = 0.35;   // 무작위 유물이 미감정으로 나올 확률
const UNID_EQUIP = 0.25;   // 게이트 보스 드롭 장비가 미감정일 확률
const CURSE_CHANCE = 0.22; // 감정 결과 저주일 확률
const CURSE_MODS = { luck: -0.2, social: -0.15, life: -3 };
const LIMIT_TAINT = 20;
const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, '');

FACILITIES.push({ id: 'clinic', name: '감정·치료소', desc: '미감정 물건 감정, 저주 해제, 상처 치료.' });
FAC_ICON.clinic = '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8v6M8 11h6"/>';

Object.assign(Game.prototype, {
  curseInit() {
    const p = this.player; if (!p) return;
    p.unid ??= []; p.curses ??= []; p.taint ??= 0;
  },
  // ---------- 오염 ----------
  addTaint(v, why) {
    // 에테르 오염은 사용자 결정으로 뺐다. 호출부가 남아 있어도 아무 일도 하지 않는다.
    const p = this.player; if (!p || !v || true) return;
    const before = p.taint;
    p.taint = Math.max(0, Math.min(100, p.taint + v));
    if (v > 0 && before + v > 100) {
      p.lifePenalty += 1; p.taint = 75;
      this.log(`에테르 오염이 넘쳤다. 혈관이 검게 타들어 간다. (수명 −1)${why ? ` · ${why}` : ''}`, 'bad');
    } else if (v > 0 && before < 60 && p.taint >= 60) this.log('에테르 오염이 위험 수위를 넘었다. 전투 중 폭주할 수 있다.', 'bad');
    if (Math.floor(before / 10) !== Math.floor(p.taint / 10)) this.recalc();
  },
  taintLabel() { const t = this.player.taint || 0; return t >= 80 ? '임계' : t >= 60 ? '위험' : t >= 30 ? '짙음' : t > 0 ? '옅음' : '맑음'; },
  taintMod() { return 0; },
  purifyCost() { return Math.round(400 * RANKS[this.player.rankIdx].mult); },
  purify() {
    const p = this.player; if (!this.onCity()) return '';
    if (p.taint <= 0) return '오염이 없다.';
    const c = Math.round(this.purifyCost() * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; const d = Math.min(p.taint, 40); this.addTaint(-d); this.recalc();
    this.advanceDays(3, { eventChance: 0.05 });
    return `정화 수조에 몸을 담갔다. 에테르 오염 −${d} (−${fmt(c)} 크레딧, 3일)`;
  },

  // ---------- 감정 ----------
  appraiseCost(u) {
    const m = RANKS[this.player.rankIdx].mult;
    return Math.round((u.kind === 'relic' ? 220 : u.item.value * 0.12) * m ** 0.5);
  },
  unidLabel(u) { return u.kind === 'relic' ? '미감정 유물' : `미감정 ${({ weapon: '무기', armor: '방어구', acc: '장신구' })[u.item.slot]} · ${RANKS[u.item.tier].key}급`; },
  appraise(uid) {
    const p = this.player; const u = p.unid.find((x) => x.uid === uid);
    if (!u || !this.onCity()) return '';
    const c = Math.round(this.appraiseCost(u) * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c; p.unid = p.unid.filter((x) => x !== u);
    const lucky = RNG.chance(0.3 + Math.max(0, p.luck - 10) / 300);
    const cursed = RNG.chance(CURSE_CHANCE);
    if (u.kind === 'relic') {
      const grade = Math.min(3, u.grade + (lucky ? 1 : 0));
      const R = relicById(u.id);
      if (cursed) {
        const val = this.relicValue({ id: u.id, grade }) * 2.5;
        p.curses.push({ uid: u.uid, id: u.id, grade, stat: R.stat, val });
        this.recalc();
        this.lifeEvent(`감정한 유물 [${R.name}]이(가) 저주받은 물건이었다. 몸에 달라붙어 떨어지지 않는다.`);
        return `<span class="bad">저주!</span> ${RARITY[grade].name} [${R.name}]이(가) 피부 속으로 파고들었다. ${R.desc} 크게 상승, 대신 운·친화·수명이 깎인다. (해제 전까지 떼어 낼 수 없다)`;
      }
      p.relics.push({ id: u.id, grade, uid: u.uid });
      return `감정 결과: ${RARITY[grade].name} 유물 [${R.name}]${lucky ? ' — 생각보다 귀한 물건이었다!' : ''}`;
    }
    const it = u.item;
    if (lucky && it.rarity < 3) { const up = this.makeEquipment(it.slot, it.tier, it.rarity + 1); Object.assign(it, up, { uid: it.uid }); }
    if (cursed) {
      for (const k of ['atk', 'def', 'hp', 'mp', 'spd']) if (it[k]) it[k] = Math.round(it[k] * 1.7);
      it.cursed = true; it.name = `[저주] ${it.name}`; it.value = Math.round(it.value * 0.5);
      p.inventory.push(it);
      return `<span class="bad">저주받은 장비</span>: ${it.name}. 능력치가 비정상적으로 높다. 장착하면 해제 전까지 벗을 수 없고 운·친화·회복이 깎인다.`;
    }
    p.inventory.push(it);
    return `감정 결과: ${RARITY[it.rarity].name} ${it.name}${lucky ? ' — 숨은 옵션이 깨어났다!' : ''}`;
  },
  uncurseCost(kind) { return Math.round((kind === 'relic' ? 2500 : 1500) * RANKS[this.player.rankIdx].mult); },
  uncurse(uid) {
    const p = this.player; if (!this.onCity()) return '';
    const cr = p.curses.find((x) => x.uid === uid);
    const eq = Object.values(p.equip).find((e) => e && e.uid === uid && e.cursed);
    if (!cr && !eq) return '';
    const c = Math.round(this.uncurseCost(cr ? 'relic' : 'equip') * this.priceMul()); if (p.money < c) return '크레딧이 부족하다.';
    p.money -= c;
    if (cr) {
      p.curses = p.curses.filter((x) => x !== cr);
      p.relics.push({ id: cr.id, grade: cr.grade, uid: cr.uid });
      this.lifeEvent(`해주사의 의식으로 [${relicById(cr.id).name}]의 저주를 풀었다.`);
    } else { eq.cursed = false; eq.name = eq.name.replace('[저주] ', '[정화] '); }
    this.recalc();
    this.advanceMonth(1, { eventChance: 0.1 });
    return `한 달에 걸친 해주 의식이 끝났다. 저주가 풀렸다. (−${fmt(c)} 크레딧)${cr ? ' 유물은 평범한 유물로 돌아왔다.' : ' 장비는 이제 벗을 수 있다.'}`;
  },
  curseMod(key) {
    const p = this.player; let v = 0;
    for (const c of p.curses || []) { if (c.stat === key) v += c.val; v += CURSE_MODS[key] || 0; }
    for (const e of Object.values(p.equip || {})) if (e && e.cursed) { if (key === 'luck') v -= 0.15; if (key === 'social') v -= 0.1; if (key === 'heal') v -= 0.2; }
    return v;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.curseInit(); });
  wrap('extraMod', function (base, key) { return base.call(this, key) + this.curseMod(key) + this.taintMod(key); });
  // 무작위로 굴린 유물(등급 미지정)은 일부 미감정으로
  wrap('addRelic', function (base, id, grade) {
    const r = base.call(this, id, grade);
    const p = this.player;
    if (grade == null && !this.noUnid && p && p.unid && RNG.chance(UNID_RELIC)) {
      const rl = p.relics.pop();
      p.unid.push({ kind: 'relic', uid: rl.uid, id: rl.id, grade: rl.grade });
      if (!p.unidHint) { p.unidHint = true; this.log('정체를 알 수 없는 유물을 얻었다. 도시의 감정·치료소에서 감정할 수 있다.', 'major'); }
      return '미감정 유물';
    }
    return r;
  });
  wrap('finishGate', function (base, gate, result, ...rest) {
    const p = this.player;
    const inv = p.inventory.length; const red = p.record.red || 0;
    const lines = base.call(this, gate, result, ...rest);
    if (result === 'clear' && p.inventory.length > inv) {
      const it = p.inventory[p.inventory.length - 1];
      if (it && RNG.chance(UNID_EQUIP + (gate.variant === 'red' || gate.variant === 'double' ? 0.25 : 0))) {
        p.inventory.pop(); p.unid.push({ kind: 'equip', uid: it.uid, item: it });
        const i = lines.findIndex((l) => typeof l === 'string' && l.includes(it.name));
        if (i >= 0) lines[i] = lines[i].replace(it.name, this.unidLabel(p.unid[p.unid.length - 1]));
      }
    }
    return lines;
  });
  // 저주받은 장비는 벗을 수 없다
  wrap('equipItem', function (base, uid) {
    const p = this.player; const it = p.inventory.find((e) => e.uid === uid);
    if (it && p.equip[it.slot] && p.equip[it.slot].cursed) return;
    return base.call(this, uid);
  });
  wrap('unequip', function (base, slot) { const e = this.player.equip[slot]; if (e && e.cursed) return; return base.call(this, slot); });
  // 미감정 장비는 경매·판매 대상이 아니라 감정 뒤에 쓴다

  // 전투: 고위력·각성 스킬은 오염을 쌓고, 오염이 짙으면 폭주한다
  const CP = Combat.prototype;
  const baseUse = CP.useSkill;
  CP.useSkill = function (u, skill, target) {
    return baseUse.call(this, u, skill, target);
  };
  const baseTurn = CP.takeTurn;
  CP.takeTurn = function (u) {
    const gp = this.game.player;
    if (false && u.isPlayer && gp && (gp.taint || 0) >= 60 && !this.result && u.stun <= 0 && Math.random() < (gp.taint - 50) / 400) {
      this.actions++; this.active = u;
      const pool = this.units.filter((x) => x.alive && x !== u);
      const t = pool[Math.floor(Math.random() * pool.length)];
      this.push(`${u.name}의 에테르가 폭주했다! 통제를 잃었다.`, 'bad', { k: 'note', dst: u.id });
      if (t) this.dealDamage(u, t, skillById('strike'));
      u.atb = 0; this.waiting = false; this.checkEnd();
      return 'done';
    }
    return baseTurn.call(this, u);
  };
  CP.limitBreak = function () {
    if (!this.waiting || this.result || this.limitUsed) return false;
    const u = this.player; this.limitUsed = true;
    u.buffs.atk = Math.max(u.buffs.atk, 0.8); u.buffs.atkT = Math.max(u.buffs.atkT, 2);
    u.atb = 0;
    const heal = Math.round(u.maxHp * 0.15); u.hp = Math.min(u.maxHp, u.hp + heal);
    this.push(`${u.name}: 한계 돌파! 혈관에 검은 에테르가 치솟는다.`, 'heal', { k: 'buff', dst: u.id, mp: u.mp });
    return true;
  };
}

// ---------- 화면 ----------
{
  // 전투 끝: 쌓인 오염 반영
  const flushTaint = (cb) => { if (cb && cb.taintGain) { G.addTaint(cb.taintGain, '전투'); cb.taintGain = 0; } };
  for (const fn of ['finishGate', 'finishStoryFight', 'finishPersonalCombat']) {
    const base = UI[fn]; if (!base) continue;
    UI[fn] = function (...a) { flushTaint(this.ctx && this.ctx.combat); return base.apply(this, a); };
  }
  // 한계 돌파 버튼
  const baseCtrl = UI.renderControls;
  UI.renderControls = function () {
    baseCtrl.call(this);
    const c = this.ctx; if (!c || !c.combat) return;
    const cb = c.combat; const row = document.querySelector('#cb-ctrl .ctrl-row'); if (!row || cb.result) return;
    const ready = cb.waiting && !c.playing && !cb.auto;
    const low = cb.player.hp <= cb.player.maxHp * 0.5 || cb.limitUsed;
    if (!low && !cb.limitUsed) return;
    row.insertAdjacentHTML('afterbegin', `<button class="sm danger" data-act="c-limit" ${!ready || cb.limitUsed ? 'disabled' : ''} title="공격 +80% 2턴, 체력 15% 회복">${cb.limitUsed ? '한계 돌파 사용함' : '한계 돌파'}</button>`);
  };
  // 시설: 감정·치료소
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    if (id !== 'clinic') return baseFac.call(this, id, reg);
    const p = G.player; const pm = G.priceMul();
    const price = (v) => `${FX.icon('coin', 13)} <span class="num">${fmt(Math.round(v * pm))}</span>`;
    const lt = (p.ltraits || []).map((x) => typeof ltraitById === 'function' && ltraitById(x)).filter((t) => t && t.neg);
    const cursedEq = Object.values(p.equip).filter((e) => e && e.cursed);
    return `<div class="cards">
      <div class="sec-title">감정 · 미감정 ${p.unid.length}점</div>
      ${p.unid.map((u) => `<div class="item-row"><div class="grow"><b>${G.unidLabel(u)}</b> <span class="small dim">정체를 알 수 없다. 저주받았을 수도 있다.</span></div><button class="sm" data-act="appraise" data-v="${u.uid}">${price(G.appraiseCost(u))}</button></div>`).join('') || '<div class="small dim">감정할 물건이 없다. 보스와 숨은 구역에서 미감정 물건이 나온다.</div>'}
      ${p.curses.length || cursedEq.length ? '<div class="sec-title sec bad">저주 해제</div>' : ''}
      ${p.curses.map((c) => `<div class="item-row"><div class="grow"><b class="bad">${relicById(c.id).name}</b> <span class="small dim">${MOD_NAME[c.stat] || c.stat} +${c.stat === 'life' ? Math.round(c.val) + '년' : Math.round(c.val * 100) + '%'} · 운 −20%, 친화 −15%, 수명 −3년</span></div><button class="sm danger" data-act="uncurse" data-v="${c.uid}">해제 ${price(G.uncurseCost('relic'))}</button></div>`).join('')}
      ${cursedEq.map((e) => `<div class="item-row"><div class="grow"><b class="bad">${e.name}</b> <span class="small dim">벗을 수 없음 · 운·친화·회복 감소</span></div><button class="sm danger" data-act="uncurse" data-v="${e.uid}">해제 ${price(G.uncurseCost('equip'))}</button></div>`).join('')}
      ${lt.length ? `<div class="sec-title sec">상처 치료</div>${lt.map((t) => `<div class="item-row"><div class="grow"><b>${t.name}</b> <span class="small dim">${modsText(t.mods)}</span></div><button class="sm" data-act="lt-cure" data-v="${t.id}">치료 ${FX.icon('coin', 13)} <span class="num">${fmt(G.cureCost())}</span></button></div>`).join('')}` : ''}
    </div>`;
  };
  // 정보 화면: 오염과 저주
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player;
    if (!p.curses.length) return html;
    const box = `<div class="small bad">저주: ${p.curses.map((c) => relicById(c.id).name).join(', ')}</div>`;
    const at = html.indexOf('<div class="sec"><div class="sec-title">선천 특성</div>');
    return at < 0 ? html + box : html.slice(0, at) + box + html.slice(at);
  };
  // 계승: 오염·저주는 본인의 것
  const baseSucceed = UI.succeed;
  UI.succeed = function (id) { baseSucceed.call(this, id); const p = G.player; p.taint = 0; p.curses = []; G.recalc(); G.save(); };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'appraise': { const r = G.appraise(v); G.save(); return this.afterCity(stripTags(r)); }
      case 'uncurse': { const r = G.uncurse(v); G.save(); return this.afterCity(stripTags(r)); }
      case 'purify': return this.afterCity(G.purify());
      case 'c-limit': { const cx = this.ctx; if (!cx || !cx.combat.limitBreak()) return; this.refreshUnits(); return this.renderControls(); }
      case 'equip': case 'unequip': {
        const p = G.player; const it = act === 'equip' ? p.inventory.find((e) => e.uid === v) : null;
        const slot = it ? it.slot : v;
        if (p.equip[slot] && p.equip[slot].cursed) return this.toast('저주받은 장비가 몸에 들러붙어 떨어지지 않는다.');
        return baseHandle.call(this, act, v);
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
