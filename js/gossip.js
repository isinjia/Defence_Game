// ===== 게이트 크로니클: 소문의 전파와 왜곡 (영역 C) =====
// docs/NPC_사회_제안.md 층 4. 큰 사건마다 진실 기록(fact)을 남기고, 누가 어떤 판본을 아는지 따로 둔다.
// 매달 아는 사람이 같은 지역·친한 사람에게 옮기고, 가끔 틀어진다(범인이 바뀌거나 사고로 둔갑).
// 주모자는 가짜 판본을 흘리기도 한다. 플레이어는 들은 것만 안다. 틀린 소문으로 미움받으면 해명할 수 있다.

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.world.facts ??= [];
    this.world.factSeq ??= 1;
  });

  const culpritName = (g, c) => !c ? null : c.type === 'player' ? g.player.name : c.type === 'faction' ? (g.factionName ? g.factionName(c.id) : c.id) : (g.npcById(c.id) || { name: '누군가' }).name;
  const sameC = (a, b) => (!a && !b) || (a && b && a.type === b.type && a.id === b.id);

  GP.factText = function (f, vi) {
    const v = f.versions[vi]; const victim = this.npcById(f.victim);
    const vn = victim ? victim.name : '누군가';
    const who = culpritName(this, v.culprit);
    if (!who) return `${vn}의 죽음은 사고였다고 한다.`;
    return v.culprit.type === 'faction' ? `${vn}의 죽음 뒤에 ${who}이(가) 있다고 한다.` : `${vn}을(를) 죽인 범인으로 ${who}이(가) 지목된다.`;
  };

  // 사건 기록. culprit: {type:'npc'|'player'|'faction', id}. fake: 처음 퍼지는 판본(거짓)
  GP.factAdd = function ({ victim, culprit, region, fake, seeds = [] }) {
    const w = this.world;
    const f = { id: w.factSeq++, mk: this.monthKey(), victim: victim.id, region, versions: [{ culprit, truth: true }], heard: {}, player: null };
    let start = 0;
    if (fake) { f.versions.push({ culprit: fake, truth: false }); start = 1; }
    for (const n of seeds) if (n && n.alive) f.heard[n.id] = start;
    w.facts.push(f);
    if (w.facts.length > 25) w.facts.shift();
    return f;
  };

  // 사람이 판본을 듣는다
  GP.factHear = function (f, n, vi) {
    if (!n || !n.alive || n.child || f.heard[n.id] != null) return;
    f.heard[n.id] = vi;
    const v = f.versions[vi]; const victim = this.npcById(f.victim);
    if (!victim) return;
    const close = (n.links && (n.links[victim.id] || 0) >= 40) || (victim.parents || []).includes(n.id) || (n.parents || []).includes(victim.id) || n.spouse === victim.id || n.partner === victim.id;
    if (!close || !v.culprit) return;
    if (v.culprit.type === 'player') {
      n.met = true;
      const before = n.relation;
      n.relation = Math.max(-100, n.relation - 20);
      if (!v.truth) n.falseBelief = f.id;
      if (this.npcRemember) this.npcRemember(n, `당신이 ${victim.name}을(를) 죽였다는 소문을 들었다${v.truth ? '' : ' (사실 아님)'}`, n.relation - before);
    } else if (v.culprit.type === 'npc') {
      const c = this.npcById(v.culprit.id);
      if (c && c !== n && this.addLink) { this.addLink(n, c, -25); if (this.link(n, c) <= -60 && !n.nemesis) n.nemesis = c.id; }
    }
  };

  // 왜곡: 범인 바꾸기 / 사고로 둔갑
  GP.factDistort = function (f, vi, region) {
    const v = f.versions[vi];
    let c;
    if (v.culprit && RNG.chance(0.35)) c = null; // 사고였다더라
    else {
      const p = this.player;
      const cands = this.adults().filter((x) => x.region === region && x.id !== f.victim && (x.personality === 'warlike' || x.personality === 'cold' || x.nemesis));
      if (p.region === region && RNG.chance(0.15 + (p.sins || 0) * 0.02)) c = { type: 'player', id: 0 };
      else { const x = RNG.pick(cands); if (!x) return vi; c = { type: 'npc', id: x.id }; }
    }
    const ex = f.versions.findIndex((x) => sameC(x.culprit, c));
    if (ex >= 0) return ex;
    const truth = sameC(f.versions[0].culprit, c);
    f.versions.push({ culprit: c, truth });
    return f.versions.length - 1;
  };

  GP.gossipMonthly = function () {
    const mk = this.monthKey(); const p = this.player;
    const facts = this.world.facts.filter((f) => mk - f.mk <= 12);
    for (const f of facts) {
      const age = mk - f.mk;
      const speak = Object.entries(f.heard).map(([id, vi]) => [this.npcById(+id), vi]).filter(([n]) => n && n.alive);
      for (const [n, vi] of speak) {
        if (!RNG.chance(0.3 * 0.85 ** age)) continue;
        const friends = this.adults().filter((x) => x !== n && f.heard[x.id] == null && (x.region === n.region || (this.link && this.link(n, x) >= 30)));
        const L = RNG.pick(friends); if (!L) continue;
        const v2 = RNG.chance(0.08) ? this.factDistort(f, vi, n.region) : vi;
        this.factHear(f, L, v2);
      }
      // 플레이어가 듣는다
      const here = speak.filter(([n]) => n.region === p.region && (n.met || RNG.chance(0.3)));
      if (here.length && RNG.chance(this._atPocha ? 0.8 : 0.2)) {
        const [, vi] = RNG.pick(here);
        if (f.player !== vi) {
          const second = f.player != null;
          f.player = vi; (f.playerHeard ??= []).includes(vi) || f.playerHeard.push(vi);
          this.rumor(`${second ? '다른 이야기도 들린다. ' : ''}${this.factText(f, vi)}`, { kind: 'gossip', thread: 'fact:' + f.id, score: second ? 2 : 0 });
        }
      }
    }
  };

  wrap('worldMonthly', function (base) { base.call(this); this.gossipMonthly(); });

  // 죽음 → 진실 기록
  wrap('killNpc', function (base, n, cause, killer) {
    base.call(this, n, cause, killer);
    if (!killer || !this.world || !this.world.facts) return;
    if (!(n.met || n.rankIdx >= 3 || killer === 'player')) return;
    const culprit = killer === 'player' ? { type: 'player', id: 0 } : { type: 'npc', id: killer.id };
    const secret = cause === '의문사';
    const seeds = [];
    if (killer !== 'player') seeds.push(killer);
    const pool = this.adults().filter((x) => x.region === n.region);
    for (const x of pool) if (RNG.chance(secret ? 0.04 : 0.35)) seeds.push(x);
    // 암살 주모자는 다른 사람에게 덮어씌운다
    let fake = null;
    if (secret && killer !== 'player') {
      const rival = this.adults().find((x) => x !== killer && x.region === n.region && (x.personality === 'warlike' || x.nemesis === n.id));
      fake = rival ? { type: 'npc', id: rival.id } : RNG.chance(0.5) ? { type: 'faction', id: 'cult' } : null;
    }
    const f = this.factAdd({ victim: n, culprit, region: n.region, fake, seeds });
    if (secret && f.versions.length === 1) { f.versions.push({ culprit: null, truth: false }); for (const id of Object.keys(f.heard)) f.heard[id] = 1; }
    if (killer !== 'player') f.heard[killer.id] = 0;
  });

  // 포차: 귓속말이 잘 들린다
  wrap('drink', function (base, id) {
    this._atPocha = true;
    try { const r = base.call(this, id); if (typeof r === 'string' && !r.includes('부족') && !r.includes('이미')) this.gossipHearNow(); return r; } finally { this._atPocha = false; }
  });
  GP.gossipHearNow = function () {
    const p = this.player;
    for (const f of this.world.facts || []) {
      const here = Object.entries(f.heard).map(([id, vi]) => [this.npcById(+id), vi]).filter(([n]) => n && n.alive && n.region === p.region);
      if (!here.length || !RNG.chance(0.6)) continue;
      const [, vi] = RNG.pick(here);
      if (f.player === vi) continue;
      const second = f.player != null; f.player = vi;
      this.rumor(`${second ? '다른 이야기도 들린다. ' : ''}${this.factText(f, vi)}`, { kind: 'gossip', thread: 'fact:' + f.id, score: second ? 2 : 0 });
      break;
    }
  };

  // 해명: 틀린 소문으로 미워하는 사람
  GP.clarify = function (id) {
    const n = this.npcById(id); if (!n || !n.falseBelief) return '';
    if (n.lastClarify === this.monthKey()) return `${n.name}은(는) 이번 달엔 더 듣고 싶어 하지 않는다.`;
    n.lastClarify = this.monthKey();
    const p = this.player;
    const chance = 0.45 + Math.max(-40, n.relation) / 200 + Math.min(p.fame, 200) / 800 + (n.personality === 'just' ? 0.15 : n.personality === 'warlike' ? -0.15 : 0);
    if (RNG.chance(chance)) {
      n.falseBelief = null; this.changeRel(n, 18, '해명을 들었다');
      if (n.nemesis === 'player') n.nemesis = null;
      return `${n.name}이(가) 한참 말이 없다가 고개를 끄덕였다. "…내가 잘못 들었나 보군." (관계 +18)`;
    }
    this.changeRel(n, -3, '변명처럼 들렸다');
    return `${n.name}: "변명은 됐어." (관계 -3) 시간을 두고 다시 말해 보자.`;
  };
}

if (typeof UI !== 'undefined') {
  const baseCard = UI.npcCard;
  if (baseCard) UI.npcCard = function (n, here) {
    let html = baseCard.call(this, n, here);
    if (here && n && n.alive && n.falseBelief) {
      const btn = `<button class="sm" data-act="npc-clarify" data-v="${n.id}">해명한다</button>`;
      const at = html.indexOf('<div class="row npc-btns">');
      if (at >= 0) { const end = html.indexOf('>', at) + 1; html = html.slice(0, end) + btn + html.slice(end); }
    }
    return html;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'npc-clarify') return this.after(G.clarify(+v));
    return baseHandle.call(this, act, v);
  };
}
