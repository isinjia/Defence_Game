// ===== 게이트 크로니클: 전투 오더 =====
// 전투에는 팀 리더가 있다. 리더는 동료에게 "누구에게 무슨 스킬을" 오더를 내린다.
// 꼼꼼하고 통솔력 있는 리더는 정확한 오더를, 그렇지 않은 리더는 엉망인 오더를 내리기도 한다.
// 동료는 성격과 관계에 따라 오더를 따르거나 무시하고, 오더의 질과 순종 여부가 관계를 바꾼다.
// 플레이어가 리더일 때는 동료를 눌러 스킬과 대상을 정해 오더를 내린다.

// 오더로 아군 하나를 지정할 수 있는 자기 대상 기술 (지정하면 그 아군에게 쓴다)
const ORDER_ALLY_SELF = ['heal', 'buff', 'shield', 'evade'];
const orderAimOf = (sk) => (sk ? (ORDER_ALLY_SELF.includes(sk.type) ? 'ally' : (SKILL_AIM[sk.type] || 'none')) : null);
const ATK_TYPES = ['dmg', 'crit', 'pierce', 'multi', 'dot', 'drain', 'stun', 'aoe', 'debuff'];
const HEAL_TYPES = ['heal_ally', 'heal_all', 'heal', 'revive'];

// NPC의 지휘력 (0~100). 성격이 바탕이 되고 사람마다 다르다.
function npcLead(n) {
  if (!n) return 50;
  if (n.lead == null) {
    const base = { cold: [60, 95], just: [55, 92], kind: [40, 78], warlike: [15, 58], greedy: [10, 50] }[n.personality] || [30, 70];
    n.lead = RNG.int(base[0], base[1]);
  }
  return n.lead;
}
// 오더 한 줄 설명 (공격·스킬·아이템·방어)
function orderLabel(o, cb) {
  if (!o) return '';
  const t = o.target && cb.units.find((x) => x.id === o.target);
  if (o.act === 'defend') return '방어';
  if (o.act === 'item') { const it = CONSUMABLES.find((x) => x.id === o.item); return `${it ? it.name : '아이템'}${t ? ' → ' + t.name : ''}`; }
  const sk = o.skill && skillById(o.skill);
  return sk ? `${sk.id === 'strike' ? '공격' : sk.name}${t && t.id !== o.unit ? ' → ' + t.name : ''}` : '';
}
function leadLabel(v) { return v >= 75 ? '정확한 지휘' : v >= 55 ? '무난한 지휘' : v >= 35 ? '어설픈 지휘' : '엉망인 지휘'; }

Object.assign(Combat.prototype, {
  // 치유·강화·방어·회피를 지정한 아군에게
  useSkillOn(u, sk, t) {
    u.mp -= sk.mp;
    this.log.push({ t: '', cls: 'cast', ev: { k: 'cast', src: u.id, mp: u.mp, elem: sk.elem === 'self' ? u.elem : sk.elem, side: u.side, name: sk.name } });
    const P = sk.power;
    const prev = this._actor; this._actor = u;
    try {
      if (sk.type === 'heal') this.healUnit(t, t.maxHp * P, u);
      else if (sk.type === 'buff') { t.buffs.atk = Math.max(t.buffs.atk, P); t.buffs.atkT = 3; this.buffEvent(t, `${u.name}의 ${sk.name} · 공격력 상승`); }
      else if (sk.type === 'shield') { t.buffs.def = Math.max(t.buffs.def, P * 2); t.buffs.defT = 3; this.buffEvent(t, `${u.name}의 ${sk.name} · 방어력 상승`); }
      else if (sk.type === 'evade') { t.evadeT = 2; this.buffEvent(t, `${u.name}의 ${sk.name} · 회피 태세`); }
    } finally { this._actor = prev; }
    this.checkEnd();
  },
  // 오더로 방어: 다음 차례까지 받는 피해 크게 감소, 정신력 조금 회복
  allyDefend(u) {
    u.buffs.def = Math.max(u.buffs.def, 0.8); u.buffs.defT = Math.max(u.buffs.defT, 1);
    u.mp = Math.min(u.maxMp, u.mp + Math.round(u.maxMp * 0.05));
    this.buffEvent(u, `${u.name} · 방어 태세`);
  },
  // 오더로 아이템: 파티 가방(내 소지품)에서 꺼내 지정한 아군에게
  allyItem(u, o) {
    const g = this.game; const it = CONSUMABLES.find((x) => x.id === o.item);
    if (!it || !g.player.items[o.item]) { const t = '가방에 그게 없는데?'; this.push(`${u.name}: "${t}"`, '', { k: 'say', src: u.id, text: t }); return false; }
    const t = (o.target && this.units.find((x) => x.id === o.target && x.alive)) || u;
    g.player.items[o.item]--;
    const mul = 1 + g.mod('heal');
    if (it.effect === 'hp') this.healUnit(t, t.maxHp * it.val * mul, u);
    else { const v = Math.round(t.maxMp * it.val * mul); t.mp = Math.min(t.maxMp, t.mp + v); this.push(`${u.name}이(가) ${t.name}에게 ${it.name} · 정신력 +${v}`, 'heal', { k: 'mp', dst: t.id, mp: t.mp }); }
    return true;
  },
  leader() { return this.units.find((u) => u.id === this.leaderId && u.alive) || null; },
  shortName(u) { return u.isPlayer ? u.name : u.name.replace(/\(.*\)$/, '').slice(-2); },

  // 오더의 질: 1 좋음, 0 보통, -1 나쁨
  rateOrder(u, sk, t, o) {
    if (o && o.act === 'defend') return u.hp < u.maxHp * 0.4 ? 1 : roleOf(u.cls) === 'tank' ? 0 : u.hp > u.maxHp * 0.8 ? -1 : 0;
    if (o && o.act === 'item') {
      const w = t || u; const it = CONSUMABLES.find((x) => x.id === o.item);
      if (!it || !this.game.player.items[o.item]) return -1;
      if (it.effect === 'mp') return w.mp < w.maxMp * 0.3 ? 1 : w.mp > w.maxMp * 0.8 ? -1 : 0;
      return w.hp < w.maxHp * 0.5 ? 1 : w.hp > w.maxHp * 0.9 ? -1 : 0;
    }
    if (!sk) return 0;
    if (sk.mp > u.mp) return -1;
    const role = roleOf(u.cls);
    if (sk.type === 'heal_ally') return t && t.side === u.side ? (t.hp < t.maxHp * 0.7 ? 1 : t.hp > t.maxHp * 0.92 ? -1 : 0) : 0;
    if (sk.type === 'heal_all') { const h = this.friendsOf(u).filter((f) => f.hp < f.maxHp * 0.7).length; return h >= 2 ? 1 : h === 0 ? -1 : 0; }
    if (sk.type === 'heal') { const w = t && t.side === u.side ? t : u; return w.hp < w.maxHp * 0.5 ? 1 : w.hp > w.maxHp * 0.9 ? -1 : 0; }
    if (sk.type === 'revive') return this.units.some((f) => f.side === u.side && !f.alive && !f.summon) ? 1 : -1;
    if (sk.type === 'taunt') return role === 'tank' ? (u.tauntT ? 0 : 1) : -1;
    if (sk.type === 'aoe' || sk.type === 'debuff') return this.foesOf(u).length >= 2 ? 1 : -1;
    if (ATK_TYPES.includes(sk.type)) {
      if (!t || t.side === u.side) return -1;
      const e = sk.elem === 'self' ? u.elem : sk.elem;
      if (e && t.elem) { const ed = elemEdge(e, t.elem); if (ed) return ed; }
      const foes = this.foesOf(u); const low = foes.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), foes[0]);
      // 다친 동료가 많은데 힐러에게 공격을 시키면 나쁜 오더
      if (role === 'support' && this.friendsOf(u).some((f) => f.hp < f.maxHp * 0.4) && this.skillsOf(u).some((s) => HEAL_TYPES.includes(s.type) && s.mp <= u.mp)) return -1;
      return t === low || t.boss ? 1 : 0;
    }
    return 0;
  },
  skillsOf(u) { return u.skills.map((id) => (u.isPlayer && this.game.skillEff ? this.game.skillEff(skillById(id)) : skillById(id))).filter(Boolean); },

  // 잘 짠 오더
  smartOrder(u) {
    const sk = this.skillsOf(u).filter((s) => s.mp <= u.mp);
    const of = (types) => sk.filter((s) => types.includes(s.type)).sort((a, b) => b.power - a.power)[0];
    const friends = this.friendsOf(u).filter((f) => !f.summon); const foes = this.foesOf(u);
    if (!foes.length) return null;
    const weak = friends.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a), friends[0]);
    if (this.units.some((f) => f.side === u.side && !f.alive && !f.summon) && of(['revive'])) return { skill: of(['revive']).id };
    if (friends.filter((f) => f.hp < f.maxHp * 0.6).length >= 2 && of(['heal_all'])) return { skill: of(['heal_all']).id };
    if (weak && weak.hp < weak.maxHp * 0.6 && of(['heal_ally'])) return { skill: of(['heal_ally']).id, target: weak.id };
    if (roleOf(u.cls) === 'tank' && !u.tauntT && of(['taunt'])) return { skill: of(['taunt']).id };
    if (foes.length >= 3 && of(['aoe'])) return { skill: of(['aoe']).id };
    // 집중 공격: 상성이 맞고 약해진 적
    const atk = sk.filter((s) => ['dmg', 'crit', 'pierce', 'dot', 'drain', 'stun'].includes(s.type));
    let best = null;
    for (const t of foes) for (const s of atk.length ? atk : [skillById('strike')]) {
      const e = s.elem === 'self' ? u.elem : s.elem;
      let v = s.power * (1 + (1 - t.hp / t.maxHp)) * (t.boss ? 1.2 : 1);
      if (e && t.elem) { const ed = elemEdge(e, t.elem); if (ed > 0) v *= 1.5; else if (ed < 0) v *= 0.6; }
      if (!best || v > best.v) best = { v, skill: s.id, target: t.id };
    }
    return best && { skill: best.skill, target: best.target };
  },
  // 엉망인 오더: 상황을 잘못 읽고 엉뚱한 걸 시키는 일이 잦다
  sloppyOrder(u) {
    const sk = this.skillsOf(u); const foes = this.foesOf(u); const friends = this.friendsOf(u);
    if (!foes.length) return null;
    const opts = [];
    for (const s of sk) {
      const aim = SKILL_AIM[s.type] || 'none';
      const ts = aim === 'enemy' ? foes : aim === 'ally' ? friends : [null];
      for (const t of ts) opts.push({ skill: s.id, target: t ? t.id : null, rate: this.rateOrder(u, s, t) });
    }
    const bad = opts.filter((o) => o.rate < 0);
    const pick = bad.length && Math.random() < 0.6 ? bad : opts;
    const o = pick[Math.floor(Math.random() * pick.length)];
    return o && { skill: o.skill, target: o.target };
  },
  // 리더가 u에게 오더를 낸다
  leaderOrders(u) {
    const L = this.leader(); if (!L || L === u || L.isPlayer || u.order) return;
    const q = npcLead(this.game.npcById(L.npcId)) / 100;
    if (Math.random() > 0.35 + q * 0.4) return; // 지휘가 좋을수록 자주 챙긴다
    const o = Math.random() < q ? this.smartOrder(u) : this.sloppyOrder(u);
    if (!o) return;
    const sk = skillById(o.skill); const t = o.target && this.units.find((x) => x.id === o.target);
    u.order = { ...o, by: L.id, rate: this.rateOrder(u, sk, t) };
    const say = q >= 0.75 && t ? `${this.shortName(u)}, ${sk.name}! ${t.side === u.side ? t.name + ' 챙겨' : t.name + ' 노려'}!` : q >= 0.55 ? `${this.shortName(u)}, ${sk.name}!` : RNG.pick([`${this.shortName(u)}! 아무거나 해!`, `${this.shortName(u)}, ${sk.name}… 아니 그냥 쳐!`, `야 ${this.shortName(u)}, ${sk.name} 써 봐!`]);
    this.push(`${L.name}: "${say}"`, '', { k: 'say', src: L.id, text: say });
  },

  // 오더를 따를지
  obeys(u, o) {
    if (u.isPlayer) return false;
    const n = this.game.npcById(u.npcId);
    const sk = skillById(o.skill);
    let p = { just: 0.88, kind: 0.88, cold: o.rate > 0 ? 0.92 : o.rate < 0 ? 0.25 : 0.7, warlike: sk && ATK_TYPES.includes(sk.type) ? 0.9 : 0.4, greedy: 0.6 }[u.pers] ?? 0.75;
    const byPlayer = o.by === 'player';
    if (n && byPlayer) p += n.relation / 300;
    if (o.rate < 0 && (u.pers === 'cold' || u.pers === 'warlike')) p -= 0.2;
    return Math.random() < Math.max(0.1, Math.min(0.97, p));
  },

  // 오더 기록 (전투가 끝나면 관계에 반영)
  noteOrder(kind, u, o) { (this.orderLog ||= []).push({ kind, unit: u.id, npcId: u.npcId, by: o.by, rate: o.rate }); },
});

{
  // 동료 차례: 리더 오더 → 따르면 오더대로, 아니면 원래 판단
  const baseAi = Combat.prototype.aiAct;
  Combat.prototype.aiAct = function (u) {
    if (u.side === 'ally' && !u.isPlayer && !u.summon && this.leaderId) {
      this.leaderOrders(u);
      const o = u.order; u.order = null;
      if (o && (o.act === 'defend' || o.act === 'item')) {
        if (this.obeys(u, o)) {
          this.noteOrder('obey', u, o);
          if (Math.random() < 0.3) { const line = RNG.pick(['알겠어!', '맡겨 줘.', '오케이!']); this.push(`${u.name}: "${line}"`, '', { k: 'say', src: u.id, text: line }); }
          if (o.act === 'defend') return this.allyDefend(u);
          if (this.allyItem(u, o)) return;
        } else {
          const line = o.rate < 0 ? RNG.pick(['지금 그럴 때가 아니야.', '내 판단대로 할게.']) : RNG.pick(['잠깐, 내가 알아서 해.', '…']);
          this.push(`${u.name}: "${line}"`, '', { k: 'say', src: u.id, text: line });
          this.noteOrder('ignore', u, o);
        }
        return baseAi.call(this, u);
      }
      if (o) {
        const sk = skillById(o.skill);
        if (!sk || sk.mp > u.mp) {
          const t = '정신력이 없어서 못 써요!'; this.push(`${u.name}: "${t}"`, '', { k: 'say', src: u.id, text: t });
          this.noteOrder('fail', u, { ...o, rate: -1 });
          return baseAi.call(this, u);
        }
        if (this.obeys(u, o)) {
          let t = o.target && this.units.find((x) => x.id === o.target && x.alive);
          if (!t && SKILL_AIM[sk.type] !== 'none') t = SKILL_AIM[sk.type] === 'ally' ? null : this.pickTarget(u);
          if (Math.random() < 0.3) { const pn = this.game.npcById(u.npcId); const line = (pn && this.game.personaOrderLine && this.game.personaOrderLine(pn, true)) || RNG.pick(['알겠어!', '맡겨 줘.', '오케이!', '바로 갑니다!']); this.push(`${u.name}: "${line}"`, '', { k: 'say', src: u.id, text: line }); }
          this.noteOrder('obey', u, o);
          // 자기 대상 기술을 다른 아군에게: 효과를 그 아군에게 준다
          if (t && t !== u && t.side === u.side && ORDER_ALLY_SELF.includes(sk.type)) return this.useSkillOn(u, sk, t);
          return this.useSkill(u, sk, t);
        }
        const pn = this.game.npcById(u.npcId); const line = (pn && this.game.personaOrderLine && Math.random() < 0.7 && this.game.personaOrderLine(pn, false)) || (o.rate < 0 ? RNG.pick(['그건 아니지.', '지금 그걸 하라고?', '내 판단대로 할게.']) : RNG.pick(['잠깐, 내가 알아서 해.', '싫은데?', '…']));
        this.push(`${u.name}: "${line}"`, '', { k: 'say', src: u.id, text: line });
        this.noteOrder('ignore', u, o);
      }
    }
    return baseAi.call(this, u);
  };

  // 플레이어 차례: NPC 리더가 플레이어에게도 오더를 낸다
  const baseTurn = Combat.prototype.takeTurn;
  Combat.prototype.takeTurn = function (u) {
    const r = baseTurn.call(this, u);
    if (r === 'wait' && u.isPlayer) {
      const L = this.leader();
      if (L && !L.isPlayer && Math.random() < 0.7) {
        const q = npcLead(this.game.npcById(L.npcId)) / 100;
        if (q < 0.55 && Math.random() < 0.4) {
          // 엉성한 리더: 무엇을 하라는 건지 없이 말만 던진다
          const say = RNG.pick(['아무거나 해!', '빨리 뭐라도 해!', '알아서 잘 좀 해 봐!', '거기! 그거! 아니 그거!']);
          u.order = { skill: null, target: null, by: L.id, rate: 0, vague: true, say };
          this.push(`${L.name}: "${say}"`, '', { k: 'say', src: L.id, text: say });
        } else {
          const o = Math.random() < q ? this.smartOrder(u) : this.sloppyOrder(u);
          if (o) {
            const sk = skillById(o.skill); const t = o.target && this.units.find((x) => x.id === o.target);
            const say = t ? `${sk.name}! ${t.name}!` : `${sk.name}!`;
            u.order = { ...o, by: L.id, rate: this.rateOrder(u, sk, t), say };
            this.push(`${L.name}: "${u.name}, ${say}"`, '', { k: 'say', src: L.id, text: `${u.name}, ${say}` });
          }
        }
      }
    }
    return r;
  };
  // 플레이어가 리더 오더를 따랐는지
  const baseSkill = Combat.prototype.playerSkill;
  Combat.prototype.playerSkill = function (id, targetId) {
    const p = this.player; const o = p && p.order;
    if (o && o.vague && this.waiting) p.order = null;
    else if (o && this.waiting) {
      const follow = o.skill === id && (!o.target || o.target === targetId || SKILL_AIM[skillById(id).type] === 'none');
      this.noteOrder(follow ? 'obey' : 'ignore', p, o);
      p.order = null;
    }
    return baseSkill.call(this, id, targetId);
  };
  const baseItem = Combat.prototype.playerItem;
  Combat.prototype.playerItem = function (id) { const p = this.player; if (p && p.order && p.order.vague) p.order = null; if (p && p.order && this.waiting) { this.noteOrder('ignore', p, p.order); p.order = null; } return baseItem.call(this, id); };
  // 오더 창을 여는 동안 시간이 멈춘다
  const baseTick = Combat.prototype.tick;
  Combat.prototype.tick = function (dt) { if (this.paused) return null; return baseTick.call(this, dt); };
}

// 전투가 끝나면 오더 기록을 관계에 반영
function applyOrderRelations(cb) {
  if (cb.ordersApplied || !cb.orderLog) return [];
  cb.ordersApplied = true;
  const delta = {};
  const add = (npcId, d) => { if (npcId == null) return; delta[npcId] = (delta[npcId] || 0) + d; };
  const leader = cb.units.find((u) => u.id === cb.leaderId);
  for (const e of cb.orderLog) {
    if (e.by === 'player') {
      // 내가 내린 오더: 좋은 오더를 따른 동료는 믿음이 쌓이고, 엉터리 오더는 신뢰를 깎는다
      if (e.kind === 'obey') add(e.npcId, e.rate > 0 ? 1 : e.rate < 0 ? -1 : 0.5);
      else if (e.kind === 'fail') add(e.npcId, -1);
      else if (e.kind === 'ignore' && e.rate < 0) add(e.npcId, -0.5);
    } else if (leader && leader.npcId != null && e.unit === 'player') {
      // NPC 리더의 오더를 내가 따랐는지
      const lp = leader.pers;
      if (e.kind === 'obey') add(leader.npcId, e.rate >= 0 ? 1 : 0.5);
      else if (e.rate > 0 && (lp === 'cold' || lp === 'warlike' || lp === 'just')) add(leader.npcId, -1);
    }
  }
  const out = [];
  for (const [id, d] of Object.entries(delta)) {
    const n = G.npcById(+id); if (!n) continue;
    const v = Math.max(-5, Math.min(5, Math.round(d)));
    if (!v) continue;
    G.changeRel(n, v); out.push(`${n.name} ${v > 0 ? '+' : ''}${v}`);
  }
  return out;
}

Object.assign(UI, {
  // 전장 위 오더 표식: 리더 말풍선, 지목된 적의 고리, 동료 → 대상 선
  drawOrderMarks() {
    const c = this.ctx; const stage = document.getElementById('stage');
    if (!stage) return;
    stage.querySelectorAll('.order-bubble').forEach((e) => e.remove());
    stage.querySelectorAll('.foe.marked, .ally.marked').forEach((e) => e.classList.remove('marked'));
    let svg = stage.querySelector('svg.order-lines');
    if (!c || !c.combat || !c.combat.units || c.combat.result) { if (svg) svg.remove(); return; }
    const cb = c.combat; const p = cb.player; const L = cb.leader();
    const myTurn = cb.waiting && !c.playing && !c.orderFor;
    // 머리 위 오더 아이콘: 동료든 나든 같은 모양 (내 것은 내 차례 동안)
    for (const u of cb.units) {
      if (u.side !== 'ally') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      let tag = el.querySelector('.order-tag');
      const shown = u.order && !u.order.vague && (!u.isPlayer || myTurn) ? u.order : null;
      const osk = shown && shown.skill && skillById(shown.skill);
      const lab = shown ? (shown.act === 'defend' ? '방어' : shown.act === 'item' ? ((CONSUMABLES.find((x) => x.id === shown.item) || {}).name || '아이템') : osk ? (osk.id === 'strike' ? '공격' : osk.name) : '') : '';
      if (lab && !tag) { el.insertAdjacentHTML('afterbegin', '<span class="order-tag"></span>'); tag = el.querySelector('.order-tag'); }
      if (tag) { tag.innerHTML = lab ? `${osk && osk.elem ? FX.elemIcon(osk.elem, 11) : ''}${lab}` : ''; /* 속성 없는 기본 공격은 회색 점 없이 */ tag.style.display = lab ? '' : 'none'; tag.title = lab ? `오더: ${lab}` : ''; }
    }
    // ① ② NPC 리더가 나에게 내린 오더
    if (p && p.order && myTurn && L && !L.isPlayer) {
      const lf = document.getElementById('u-' + L.id);
      if (lf && p.order.say) { const host = lf.querySelector('.fx-host') || lf; host.insertAdjacentHTML('beforeend', `<span class="order-bubble">${fixJosa(p.order.say)}</span>`); }
      const t = p.order.target && p.order.target !== p.id && document.getElementById('u-' + p.order.target);
      // ⑥ 처음 한 번만 설명
      let seen = false; try { seen = localStorage.getItem('gc_order_tip') === '1'; } catch (e) { seen = true; }
      // 자격 시험의 조작 안내가 진행 중이면 그 뒤로 미룬다 (안내를 가리지 않게)
      const tutoring = c.tutorial && !c.tutorial.boss && c.tutorial.acted < 3;
      if (!seen && !tutoring && this.coachPop) {
        try { localStorage.setItem('gc_order_tip', '1'); } catch (e) { /* 무시 */ }
        const n = document.createElement('div'); n.className = 'coach';
        n.innerHTML = fixJosa(`<span class="eyebrow">전투 안내 · 오더</span><div>${p.order.vague ? '리더가 말을 던졌지만 무엇을 하라는 건지는 없다.' : `<b>오더</b> 표시가 붙은 스킬과 대상이 리더의 오더다.`} 따르지 않아도 되지만, 리더는 기억한다. 오더를 따르면 리더와 사이가 좋아진다.</div>`);
        this.coachPop(n, t || lf || null, 'order-tip');
      }
    }
    // ⑤ 오더 선: 지시받은 사람에서 대상까지 점선. 점선의 대상 쪽 끝에 "오더" 배지가 달린다.
    //    끝점은 대상 그림 테두리 중 다른 표시(행동 예고·상성·상태 이상·이름·체력 막대 등)와 겹치지 않는 빈 쪽으로 잡는다.
    stage.querySelectorAll('.order-end, .order-dot').forEach((e) => e.remove());
    const lines = []; const ends = {};
    const sr = stage.getBoundingClientRect();
    const BW = 30, BH = 15; // 배지 크기
    // 점선은 지시받은 사람의 가운데에서 대상 그림의 "가운데"를 향한다. 그림을 가리지 않게 가운데 바로 앞(그림 테두리쯤)에서 멈추고,
    // 그 끝에 "오더" 배지가 달린다. (전에는 테두리의 빈 쪽을 찾아 끝점을 옮겨서 선이 엉뚱한 곳을 가리키는 것처럼 보였다)
    // [A 수정, 사용자 제보] 선 끝은 대상 그림(괴수 이미지)의 정중앙이고, "오더" 배지는 그 선 끝에 단다
    const endFor = (b, ra) => {
      const host = b.querySelector('.monster-art, .sprite, .fx-host') || b; const rb = host.getBoundingClientRect();
      const cx = rb.left + rb.width / 2, cy = rb.top + rb.height / 2;
      const sx = ra.left + ra.width / 2, sy = ra.top + ra.height / 2;
      const dx = cx - sx, dy = cy - sy; const len = Math.hypot(dx, dy) || 1;
      const rad = Math.min(rb.width, rb.height) / 2 * 0.95;
      const k = Math.max(0, (len - rad) / len);
      return { x: cx - sr.left, y: cy - sr.top, bx: sx + dx * k - sr.left, by: sy + dy * k - sr.top, key: b.id + '|' + Math.round(sx) + ',' + Math.round(sy) };
    };
    for (const u of cb.units) {
      if (u.side !== 'ally' || !u.order || !u.order.target) continue;
      if (u.isPlayer && !myTurn) continue;
      // 점선은 스킬이 실제로 향하는 대상에게만: 적 대상 스킬은 적, 아군 대상 스킬(치유·강화·방어 등)은 그 아군.
      // 자기 대상·아군 전체 스킬이나 자기 자신을 가리키는 오더는 점선 없이 시전자 머리 위 오더 표식만 둔다.
      const tu = cb.units.find((x) => x.id === u.order.target);
      const osk = u.order.skill && skillById(u.order.skill);
      const aim = u.order.act === 'item' ? 'ally' : osk ? orderAimOf(osk) : 'none';
      if (!tu || tu === u || aim === 'none' || (aim === 'enemy' && tu.side === u.side) || (aim === 'ally' && tu.side !== u.side)) continue;
      const a = document.getElementById('u-' + u.id); const b = document.getElementById('u-' + u.order.target);
      if (!a || !b) continue;
      const tg = a.querySelector('.order-tag'); const tgr = tg && tg.style.display !== 'none' ? tg.getBoundingClientRect() : null;
      // [사용자 요청] 선은 초상화 위 오더 내용 표시에서 시작한다 (없으면 그림 가운데)
      const ra = tgr && tgr.width ? tgr : (a.querySelector('.monster-art, .sprite, .fx-host') || a).getBoundingClientRect();
      const e = endFor(b, ra); (ends.list ||= []).push(e);
      lines.push(`<line x1="${ra.left + ra.width / 2 - sr.left}" y1="${ra.top + ra.height / 2 - sr.top}" x2="${e.x}" y2="${e.y}"/>`);
      b.classList.add('marked');
    }
    if (!lines.length) { if (svg) svg.remove(); return; }
    if (!svg) { stage.insertAdjacentHTML('beforeend', '<svg class="order-lines"></svg>'); svg = stage.querySelector('svg.order-lines'); }
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    svg.innerHTML = lines.join('');
    for (const e of ends.list || []) stage.insertAdjacentHTML('beforeend', `<span class="order-end" style="left:${e.x}px;top:${e.y}px">오더</span>`);
  },
  // 이번 전투의 리더: 시험 교관, 소속 파티 리더, 아니면 플레이어
  pickLeader(c) {
    const cb = c.combat; const allies = cb.units.filter((u) => u.side === 'ally' && !u.summon);
    let L = null;
    if (c.kind === 'exam' && this.exam && this.exam.leader != null) L = allies.find((u) => u.npcId === this.exam.leader);
    if (!L && G.crewLeader) { const cl = G.crewLeader(); if (cl) L = allies.find((u) => u.npcId === cl.id); }
    return (L || allies.find((u) => u.isPlayer) || allies[0] || {}).id;
  },
  // 오더 창: 내 차례와 같은 기본 커맨드(공격·스킬·아이템·방어). 머리말은 위에 떠 있다.
  orderPanelHtml() {
    const c = this.ctx; const cb = c.combat; const u = cb.units.find((x) => x.id === c.orderFor); if (!u) return '';
    const skills = cb.skillsOf(u).filter((s) => s.id !== 'strike');
    const n = G.npcById(u.npcId);
    const cmd = c.orderCmd || null;
    const sel = c.orderSel ? skillById(c.orderSel) : null;
    const item = c.orderItem ? CONSUMABLES.find((x) => x.id === c.orderItem) : null;
    const aim = this.orderAim();
    const done = c.orderDone;
    const cur = u.order && !u.order.vague ? orderLabel(u.order, cb) : '';
    const hint = done ? `<b class="good">지시함</b> · ${done}`
      : sel ? `<b>${sel.name}</b> · ${aim === 'enemy' ? '노릴 적을 누르세요' : '챙길 아군을 누르세요'}`
      : item ? `<b>${item.name}</b> · 누구에게 쓸지 아군을 누르세요`
      : '시간이 멈췄습니다. 시킬 행동을 고르세요.';
    const head = `<div class="order-banner ${done ? 'done' : ''}">
      <div class="row between"><b>${u.name}에게 오더</b><span class="row"><span class="small dim">${n ? `관계 ${n.relation} · ${persById(u.pers).name}` : ''}</span><button class="sm ghost" data-act="o-cancel">닫기</button></span></div>
      <div class="small ${done ? '' : sel || item ? 'amber' : 'dim'}">${hint}</div>
      ${cur && !done ? `<div class="small row between"><span>지금 오더: <b>${cur}</b></span><button class="sm ghost" data-act="o-clear">취소</button></div>` : ''}</div>`;
    let list = '';
    if (cmd === 'skill') {
      list = skills.length ? skills.map((s) => `<button class="skill-btn ${c.orderSel === s.id ? 'sel' : ''} ${s.mp > u.mp ? 'nomp' : ''}" style="--c:${s.elem ? elemColor(s.elem) : '#9aa6b8'}" data-act="o-skill" data-v="${s.id}">${FX.elemIcon(s.elem, 16)}<span><b>${s.name}</b><span class="small dim">MP ${s.mp} · ${TYPE_NAME[s.type]} · ${SKILL_EFFECT[s.type] || ''}</span></span></button>`).join('') : '<div class="dim small">쓸 수 있는 스킬이 없다.</div>';
    } else if (cmd === 'item') {
      const its = ['potion', 'mana'].map((id) => CONSUMABLES.find((x) => x.id === id)).filter(Boolean);
      list = its.map((it) => `<button class="cmd-item ${c.orderItem === it.id ? 'sel' : ''}" data-act="o-item" data-v="${it.id}" ${G.player.items[it.id] ? '' : 'disabled'}>${it.name} <span class="num">×${G.player.items[it.id] || 0}</span></button>`).join('');
    }
    const pop = cmd ? `<div class="cmd-list cmd-pop"><div class="cmd-pop-head"><b>${cmd === 'skill' ? '스킬' : '아이템'} 지시</b><button class="sm ghost" data-act="o-cmd" data-v="${cmd}">닫기</button></div>${list}</div>` : '';
    const on = (k) => (done ? (c.orderDoneCmd === k ? 'sel' : '') : (k === 'attack' ? c.orderSel === 'strike' : cmd === k || (k === 'skill' && sel && sel.id !== 'strike') || (k === 'item' && item)) ? 'sel' : '');
    const dis = done ? 'disabled' : '';
    this._orderBanner = head;
    return `<div class="cmd-wrap order-cmd">${pop}<div class="cmd-main">
        <button class="cmd ${on('attack')}" data-act="o-cmd" data-v="attack" ${dis}>공격</button>
        <button class="cmd ${on('skill')}" data-act="o-cmd" data-v="skill" ${dis}>스킬</button>
        <button class="cmd ${on('item')}" data-act="o-cmd" data-v="item" ${dis}>아이템</button>
        <button class="cmd ${on('defend')}" data-act="o-cmd" data-v="defend" ${dis}>방어</button></div></div>`;
  },
  // 오더 확정 → 잠깐 "지시함"을 보여 준 뒤 내 조작으로
  giveOrder(targetId, act) {
    const c = this.ctx; const cb = c.combat; const u = cb.units.find((x) => x.id === c.orderFor); if (!u) return;
    const t = targetId ? cb.units.find((x) => x.id === targetId) : null;
    let o;
    if (act === 'defend') o = { act: 'defend', skill: null, target: null };
    else if (c.orderItem) o = { act: 'item', item: c.orderItem, skill: null, target: targetId || u.id };
    else if (c.orderSel) o = { act: 'skill', skill: c.orderSel, target: targetId || null };
    else return;
    o.by = 'player'; o.rate = cb.rateOrder(u, o.skill && skillById(o.skill), t, o);
    u.order = o;
    const kind = o.act === 'defend' ? 'defend' : o.act === 'item' ? 'item' : o.skill === 'strike' ? 'attack' : 'skill';
    c.orderDone = orderLabel(o, cb); c.orderDoneCmd = kind; c.orderCmd = null;
    if (typeof SFX !== 'undefined' && SFX.play) try { SFX.play('ui'); } catch (e) { /* 무시 */ }
    this.refreshUnits(); this.renderControls();
    const id = u.id;
    clearTimeout(this._orderDoneT);
    this._orderDoneT = setTimeout(() => {
      if (this.ctx !== c || c.orderFor !== id) return;
      c.orderFor = null; c.orderSel = null; c.orderItem = null; c.orderDone = null; c.orderDoneCmd = null; cb.paused = false;
      this.refreshUnits(); this.renderControls();
    }, FX.reduced ? 500 : 900);
  },
  orderAim() {
    const c = this.ctx; if (!c || !c.orderFor || c.orderDone) return null;
    if (c.orderItem) return 'ally';
    if (!c.orderSel) return null;
    const sk = skillById(c.orderSel);
    return sk ? orderAimOf(sk) : null;
  },
});

{
  const baseOpen = UI.openCombat;
  UI.openCombat = function () {
    const c = this.ctx;
    if (c && c.combat && c.combat.units) { c.combat.leaderId = this.pickLeader(c); c.orderFor = null; c.orderSel = null; }
    baseOpen.call(this);
    this.refreshUnits();
  };
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function () {
    const r = baseRefresh.call(this);
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return r;
    for (const u of c.combat.units) {
      if (u.side !== 'ally') continue;
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      el.classList.toggle('leader', u.id === c.combat.leaderId);
      el.classList.toggle('ordering', u.id === c.orderFor);
      let crown = el.querySelector('.lead-tag');
      if (u.id === c.combat.leaderId && !crown) el.insertAdjacentHTML('afterbegin', '<span class="lead-tag">리더</span>');
      if (u.id !== c.combat.leaderId && crown) crown.remove();
    }
    this.drawOrderMarks();
    return r;
  };
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    baseControls.call(this);
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return;
    const box = document.getElementById('cb-ctrl'); if (!box) return;
    const cb = c.combat;
    if (c.orderFor && !cb.result) {
      box.innerHTML = fixJosa(this.orderPanelHtml()); // 내 조작 자리에 같은 모양의 커맨드
      // 누구에게·무엇을 지시 중인지는 전장 맨 위 띠로 (아군 줄을 가리지 않게)
      const st = document.getElementById('stage');
      if (st) { st.querySelectorAll('.order-banner').forEach((e) => e.remove()); st.insertAdjacentHTML('beforeend', fixJosa(this._orderBanner || '')); }
      const aim = this.orderAim();
      const foes = document.getElementById('foes'), allies = document.getElementById('allies');
      if (foes) foes.classList.toggle('aim', aim === 'enemy');
      if (allies) allies.classList.toggle('aim', aim === 'ally');
    }
    else { const st = document.getElementById('stage'); if (st) st.querySelectorAll('.order-banner').forEach((e) => e.remove()); }
    // NPC 리더가 나에게 내린 오더: 스킬 버튼에 리더 표시
    const p = cb.player;
    if (p && p.order && !p.order.vague && cb.waiting && !c.playing && !c.orderFor) {
      const btn = box.querySelector(`[data-act=c-skill][data-v="${p.order.skill}"]`); if (btn) btn.classList.add('ordered');
    }
    this.drawOrderMarks();
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      case 'c-ally': {
        if (!c || !c.combat || c.combat.result) break;
        const cb = c.combat;
        if (c.orderFor && this.orderAim() === 'ally') return this.giveOrder(v);
        if (c.sel) break; // 내 치유 스킬 대상 지정
        const u = cb.units.find((x) => x.id === v);
        if (!u || u.isPlayer || u.summon || !u.alive) return;
        if (cb.leaderId !== 'player') { const L = cb.leader(); return this.toast(`지금 리더는 ${L ? L.name : '다른 사람'}이다. 오더는 리더만 내린다.`); }
        c.orderFor = v; c.orderSel = null; c.orderItem = null; c.orderCmd = null; c.orderDone = null; cb.paused = true;
        this.refreshUnits(); return this.renderControls();
      }
      case 'c-target': {
        if (c && c.orderFor && this.orderAim() === 'enemy') return this.giveOrder(v);
        break;
      }
      case 'o-cmd': {
        if (!c || !c.orderFor || c.orderDone) return;
        if (v === 'defend') { c.orderSel = null; c.orderItem = null; return this.giveOrder(null, 'defend'); }
        if (v === 'attack') { c.orderSel = 'strike'; c.orderItem = null; c.orderCmd = null; return this.renderControls(); }
        c.orderCmd = c.orderCmd === v ? null : v; return this.renderControls();
      }
      case 'o-skill': {
        if (!c || !c.orderFor || c.orderDone) return;
        c.orderSel = v; c.orderItem = null; c.orderCmd = null;
        if (this.orderAim() === 'none') return this.giveOrder(null); // 대상이 필요 없으면 바로 지시
        return this.renderControls();
      }
      case 'o-item': if (!c || !c.orderFor || c.orderDone) return; c.orderItem = v; c.orderSel = null; c.orderCmd = null; return this.renderControls();
      case 'o-give': return this.giveOrder(null);
      case 'o-cancel': c.orderFor = null; c.orderSel = null; c.orderItem = null; c.orderCmd = null; c.orderDone = null; c.combat.paused = false; this.refreshUnits(); return this.renderControls();
      case 'o-clear': { const u = c.combat.units.find((x) => x.id === c.orderFor); if (u) u.order = null; c.orderFor = null; c.orderSel = null; c.orderItem = null; c.orderCmd = null; c.orderDone = null; c.combat.paused = false; this.refreshUnits(); return this.renderControls(); }
      case 'c-skill': case 'c-item': case 'c-auto': if (c && c.orderFor) { c.orderFor = null; c.orderSel = null; c.orderItem = null; c.orderCmd = null; c.orderDone = null; c.combat.paused = false; } break;
    }
    return baseHandle.call(this, act, v);
  };
  // 전투가 끝나면 관계 반영
  const baseAfter = UI.afterPlay;
  UI.afterPlay = function () {
    const c = this.ctx;
    if (c && c.combat && c.combat.result && c.combat.orderLog && !c.combat.ordersApplied) {
      const out = applyOrderRelations(c.combat);
      if (out.length) this.toast(`오더에 대한 반응 · ${out.join(', ')}`);
    }
    return baseAfter.call(this);
  };
}
