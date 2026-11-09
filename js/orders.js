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
  leader() { return this.units.find((u) => u.id === this.leaderId && u.alive) || null; },
  shortName(u) { return u.isPlayer ? u.name : u.name.replace(/\(.*\)$/, '').slice(-2); },

  // 오더의 질: 1 좋음, 0 보통, -1 나쁨
  rateOrder(u, sk, t) {
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
      const osk = u.order && u.order.skill && (!u.isPlayer || myTurn) && skillById(u.order.skill);
      if (osk && !tag) { el.insertAdjacentHTML('afterbegin', '<span class="order-tag"></span>'); tag = el.querySelector('.order-tag'); }
      if (tag) { tag.innerHTML = osk ? `${FX.elemIcon(osk.elem, 11)}${osk.name}` : ''; tag.style.display = osk ? '' : 'none'; tag.title = osk ? `오더: ${osk.name}` : ''; }
    }
    // ① ② NPC 리더가 나에게 내린 오더
    if (p && p.order && myTurn && L && !L.isPlayer) {
      const lf = document.getElementById('u-' + L.id);
      if (lf && p.order.say) { const host = lf.querySelector('.fx-host') || lf; host.insertAdjacentHTML('beforeend', `<span class="order-bubble">${fixJosa(p.order.say)}</span>`); }
      const t = p.order.target && document.getElementById('u-' + p.order.target);
      if (t) t.classList.add('marked');
      // ⑥ 처음 한 번만 설명
      let seen = false; try { seen = localStorage.getItem('gc_order_tip') === '1'; } catch (e) { seen = true; }
      // 자격 시험의 조작 안내가 진행 중이면 그 뒤로 미룬다 (안내를 가리지 않게)
      const tutoring = c.tutorial && !c.tutorial.boss && c.tutorial.acted < 3;
      if (!seen && !tutoring && this.coachPop) {
        try { localStorage.setItem('gc_order_tip', '1'); } catch (e) { /* 무시 */ }
        const n = document.createElement('div'); n.className = 'coach';
        n.innerHTML = fixJosa(`<span class="eyebrow">전투 안내 · 오더</span><div>${p.order.vague ? '리더가 말을 던졌지만 무엇을 하라는 건지는 없다.' : `<b>지목</b> 표시된 적과 <b>리더</b> 표시된 스킬이 오더다.`} 따르지 않아도 되지만, 리더는 기억한다. 오더를 따르면 리더와 사이가 좋아진다.</div>`);
        this.coachPop(n, t || lf || null, 'order-tip');
      }
    }
    // ⑤ 내가 동료에게 내린 오더: 동료에서 대상까지 선
    const lines = [];
    const sr = stage.getBoundingClientRect();
    for (const u of cb.units) {
      if (u.side !== 'ally' || !u.order || !u.order.target) continue;
      if (u.isPlayer && !myTurn) continue;
      const a = document.getElementById('u-' + u.id); const b = document.getElementById('u-' + u.order.target);
      if (!a || !b) continue;
      const ra = (a.querySelector('.fx-host') || a).getBoundingClientRect(); const rb = (b.querySelector('.fx-host') || b).getBoundingClientRect();
      lines.push(`<line x1="${ra.left + ra.width / 2 - sr.left}" y1="${ra.top + ra.height / 2 - sr.top}" x2="${rb.left + rb.width / 2 - sr.left}" y2="${rb.top + rb.height / 2 - sr.top}"/>`);
      b.classList.add('marked');
    }
    if (!lines.length) { if (svg) svg.remove(); return; }
    if (!svg) { stage.insertAdjacentHTML('beforeend', '<svg class="order-lines"></svg>'); svg = stage.querySelector('svg.order-lines'); }
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    svg.innerHTML = lines.join('');
  },
  // 이번 전투의 리더: 시험 교관, 소속 파티 리더, 아니면 플레이어
  pickLeader(c) {
    const cb = c.combat; const allies = cb.units.filter((u) => u.side === 'ally' && !u.summon);
    let L = null;
    if (c.kind === 'exam' && this.exam && this.exam.leader != null) L = allies.find((u) => u.npcId === this.exam.leader);
    if (!L && G.crewLeader) { const cl = G.crewLeader(); if (cl) L = allies.find((u) => u.npcId === cl.id); }
    return (L || allies.find((u) => u.isPlayer) || allies[0] || {}).id;
  },
  orderPanelHtml() {
    const c = this.ctx; const cb = c.combat; const u = cb.units.find((x) => x.id === c.orderFor); if (!u) return '';
    const skills = cb.skillsOf(u);
    const sel = c.orderSel ? skills.find((s) => s.id === c.orderSel) : null;
    const aim = sel ? orderAimOf(sel) : null;
    const n = G.npcById(u.npcId);
    const info = sel ? `<div class="small"><span class="tag tiny">${TYPE_NAME[sel.type] || sel.type}</span> ${SKILL_EFFECT[sel.type] || ''} · 소모 MP ${sel.mp} (남은 ${Math.round(u.mp)})${sel.mp > u.mp ? ' <b class="bad">MP 부족</b>' : ''}</div>` : '';
    return `<div class="skill-info order-panel" style="--c:var(--amber)">
      <div class="row between"><b>${u.name}에게 오더</b><span class="row"><span class="small dim">${n ? `관계 ${n.relation} · ${persById(u.pers).name}` : ''}</span><button class="sm ghost" data-act="o-cancel">닫기</button></span></div>
      <div class="skill-btns">${skills.map((s) => `<button class="skill-btn ${c.orderSel === s.id ? 'sel' : ''} ${s.mp > u.mp ? 'nomp' : ''}" style="--c:${s.elem ? elemColor(s.elem) : '#9aa6b8'}" data-act="o-skill" data-v="${s.id}">${FX.elemIcon(s.elem, 16)}<span><b>${s.name}</b><span class="small dim">MP ${s.mp} · ${TYPE_NAME[s.type]}</span></span></button>`).join('')}</div>
      ${info}
      <div class="small ${sel ? 'amber' : 'dim'}">${!sel ? '시간이 멈췄습니다. 시킬 스킬을 고르세요.' : aim === 'enemy' ? '노릴 적을 누르세요.' : aim === 'ally' ? '챙길 아군을 누르세요.' : '대상이 필요 없는 스킬입니다.'}</div>
      ${sel && aim === 'none' ? '<button class="primary use-btn" data-act="o-give">이대로 지시</button>' : ''}
      ${u.order ? '<button class="sm ghost" data-act="o-clear">내린 오더 취소</button>' : ''}</div>`;
  },
  giveOrder(targetId) {
    const c = this.ctx; const cb = c.combat; const u = cb.units.find((x) => x.id === c.orderFor); if (!u || !c.orderSel) return;
    const sk = cb.skillsOf(u).find((s) => s.id === c.orderSel); const t = targetId ? cb.units.find((x) => x.id === targetId) : null;
    u.order = { skill: sk.id, target: targetId || null, by: 'player', rate: cb.rateOrder(u, sk, t) };
    c.orderFor = null; c.orderSel = null; cb.paused = false;
    this.toast(`${u.name}에게 오더: ${sk.name}${t ? ' → ' + t.name : ''}`);
    this.refreshUnits(); this.renderControls();
  },
  orderAim() {
    const c = this.ctx; if (!c || !c.orderFor || !c.orderSel) return null;
    const u = c.combat.units.find((x) => x.id === c.orderFor); const sk = u && c.combat.skillsOf(u).find((s) => s.id === c.orderSel);
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
      box.innerHTML = fixJosa(this.orderPanelHtml()); // 높이를 더하지 않도록 내 조작 대신 들어간다
      const aim = this.orderAim();
      const foes = document.getElementById('foes'), allies = document.getElementById('allies');
      if (foes) foes.classList.toggle('aim', aim === 'enemy');
      if (allies) allies.classList.toggle('aim', aim === 'ally');
    }
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
        c.orderFor = v; c.orderSel = null; cb.paused = true;
        this.refreshUnits(); return this.renderControls();
      }
      case 'c-target': {
        if (c && c.orderFor && this.orderAim() === 'enemy') return this.giveOrder(v);
        break;
      }
      case 'o-skill': c.orderSel = v; return this.renderControls();
      case 'o-give': return this.giveOrder(null);
      case 'o-cancel': c.orderFor = null; c.orderSel = null; c.combat.paused = false; this.refreshUnits(); return this.renderControls();
      case 'o-clear': { const u = c.combat.units.find((x) => x.id === c.orderFor); if (u) u.order = null; c.orderFor = null; c.orderSel = null; c.combat.paused = false; this.refreshUnits(); return this.renderControls(); }
      case 'c-skill': case 'c-item': case 'c-auto': if (c && c.orderFor) { c.orderFor = null; c.orderSel = null; c.combat.paused = false; } break;
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
