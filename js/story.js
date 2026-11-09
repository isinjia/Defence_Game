// ===== 게이트 크로니클: 스토리 엔진 =====
// 정해진 줄거리는 없다. 조건이 맞는 사건이 시간의 흐름 속에서 터지고,
// 연계 기연(chain)은 단계별로 이어지며, NPC는 스스로 플레이어를 찾아온다.

const STORY = [];
const S = (ev) => { STORY.push(ev); return ev; };
const RK = (g) => g.player.rankIdx;

Object.assign(Game.prototype, {
  // 문장 속 {name} {npc} {city} {rank} {npc2} {victim} 치환
  storyFill(str, c = {}) {
    const p = this.player;
    const map = {
      name: p.name, npc: c.npc ? c.npc.name : '누군가', npc2: c.npc2 ? c.npc2.name : '누군가', victim: c.victim ? c.victim.name : '그 사람',
      city: this.region().name, rank: RANKS[p.rankIdx].key, next: RANKS[Math.min(7, p.rankIdx + 1)].key,
      spouse: p.spouse && this.npcById(p.spouse) ? this.npcById(p.spouse).name : '',
    };
    return fixJosa(String(str).replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m)));
  },
  storyNpc(kind) {
    const p = this.player;
    const here = this.npcsHere().filter((n) => !n.isCompanion);
    const met = this.adults().filter((n) => n.met && !n.isCompanion);
    const pick = (a) => (a.length ? RNG.pick(a) : null);
    switch (kind) {
      case 'here': return pick(here);
      case 'stranger': return pick(here.filter((n) => !n.met));
      case 'friend': return pick(met.filter((n) => n.relation >= 30));
      case 'friendHere': return pick(here.filter((n) => n.relation >= 25));
      case 'rival': return pick(met.filter((n) => n.relation <= -20));
      case 'strong': return pick(here.filter((n) => n.rankIdx >= p.rankIdx + 2));
      case 'weak': return pick(here.filter((n) => n.rankIdx < p.rankIdx));
      case 'warlike': return pick(here.filter((n) => n.personality === 'warlike'));
      case 'greedy': return pick(here.filter((n) => n.personality === 'greedy'));
      case 'kind': return pick(here.filter((n) => n.personality === 'kind' || n.personality === 'just'));
      case 'partner': { const id = p.spouse || p.partner; const n = id && this.npcById(id); return n && n.alive ? n : null; }
      case 'disciple': return pick((p.disciples || []).map((id) => this.npcById(id)).filter((n) => n && n.alive));
      case 'master': { const n = p.master && this.npcById(p.master); return n && n.alive ? n : null; }
      default: return null;
    }
  },
  storyEligible(ev, c) {
    const f = this.flags; const p = this.player;
    if (ev.once && f.seen[ev.id]) return false;
    if (ev.chain) {
      const st = f.chains[ev.chain] || 0;
      if (st !== ev.step) return false;
      if (st > 0 && this.monthKey() - (f.chainAt[ev.chain] || 0) < (ev.gap ?? 2)) return false;
    }
    if (ev.region && !(Array.isArray(ev.region) ? ev.region.includes(p.region) : p.region === ev.region)) return false;
    if (ev.city && !this.onCity()) return false;
    if (ev.field && this.onCity()) return false;
    if (ev.minRank != null && p.rankIdx < ev.minRank) return false;
    if (ev.maxRank != null && p.rankIdx > ev.maxRank) return false;
    if (ev.minAge != null && this.ageYears() < ev.minAge) return false;
    if (ev.npc && !c.npc) return false;
    if (ev.when && !ev.when(this, c)) return false;
    return true;
  },
  pickStory(trigger = 'month') {
    const cands = [], weights = [];
    const mk = this.monthKey();
    for (const ev of STORY) {
      if ((ev.trigger || 'month') !== trigger) continue;
      const c = {};
      if (ev.npc) c.npc = this.storyNpc(ev.npc);
      if (!this.storyEligible(ev, c)) continue;
      let w = ev.weight ?? 1;
      if (ev.chain) w *= 2.2;
      const seen = this.flags.seen[ev.id];
      if (seen && mk - seen < 36) w *= 0.15;
      cands.push({ ev, c }); weights.push(w);
    }
    if (!cands.length) return null;
    const { ev, c } = RNG.weighted(cands, weights);
    return { type: 'story', id: ev.id, npc: c.npc ? c.npc.id : null };
  },
  storyById(id) { return STORY.find((e) => e.id === id); },
  storyCtx(q) { return { npc: q.npc != null ? this.npcById(q.npc) : null, victim: q.victim != null ? this.npcById(q.victim) : null, npc2: q.npc2 != null ? this.npcById(q.npc2) : null, extra: q.extra }; },
  markSeen(id) { this.flags.seen[id] = this.monthKey(); },
  chainNext(id) { this.flags.chains[id] = (this.flags.chains[id] || 0) + 1; this.flags.chainAt[id] = this.monthKey(); },
  chainSet(id, step) { this.flags.chains[id] = step; this.flags.chainAt[id] = this.monthKey(); },
  chainEnd(id) { this.flags.chains[id] = 99; },
  chainAt(id) { return this.flags.chains[id] || 0; },
  roll(p) { return RNG.chance(Math.max(0.03, Math.min(0.97, p + (this.player.luck - 10) / 200))); },

  // 사건 보상/대가를 적용하고 요약 문구를 돌려준다
  gain(o, c = {}) {
    const p = this.player; const out = [];
    const m = RANKS[p.rankIdx].mult;
    if (o.money) { const v = Math.round(o.money * m); p.money = Math.max(0, p.money + v); out.push(`크레딧 ${v > 0 ? '+' : ''}${fmt(v)}`); }
    if (o.ether) out.push(`에테르 +${fmt(this.etherGift(o.ether))}`);
    if (o.fame) { p.fame = Math.max(0, p.fame + o.fame); out.push(`명성 ${o.fame > 0 ? '+' : ''}${o.fame}`); }
    if (o.merit) { p.merit = Math.max(0, p.merit + o.merit); out.push(`협회 공적 ${o.merit > 0 ? '+' : ''}${o.merit}`); }
    if (o.rep) { this.addRep(p.region, o.rep); out.push(`도시 평판 ${o.rep > 0 ? '+' : ''}${o.rep}`); }
    if (o.hp) { p.hp = Math.max(1, Math.min(p.maxHp, p.hp + Math.round(p.maxHp * o.hp))); out.push(`체력 ${o.hp > 0 ? '회복' : '손실'}`); }
    if (o.life) { if (o.life > 0) p.lifeBonus += o.life; else p.lifePenalty += -o.life; out.push(`수명 ${o.life > 0 ? '+' : ''}${o.life}년`); }
    if (o.injure) { p.injured = Math.max(p.injured, o.injure); this.recalc(); out.push(`부상 ${o.injure}개월`); }
    if (o.talent) { p.talent += o.talent; out.push(`재능 ${o.talent > 0 ? '+' : ''}${o.talent}`); }
    if (o.core) { const t = Math.max(0, Math.min(7, p.rankIdx + (o.core[0] || 0))); this.addCore(t, o.core[1]); out.push(`${coreName(t)} ${o.core[1]}개`); }
    if (o.relic) out.push(this.addRelic(null, typeof o.relic === 'number' ? o.relic : undefined));
    if (o.item) { p.items[o.item[0]] = (p.items[o.item[0]] || 0) + o.item[1]; out.push(`${(CONSUMABLES.find((x) => x.id === o.item[0]) || { name: '각성 촉매' }).name} ${o.item[1]}개`); }
    if (o.catalyst) { const k = this.catalystKey(); p.items[k] = (p.items[k] || 0) + o.catalyst; out.push(`${RANKS[p.rankIdx].key}급 각성 촉매 ${o.catalyst}개`); }
    if (o.equip) { const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), Math.min(7, p.rankIdx + (o.equip === true ? 0 : o.equip))); p.inventory.push(it); out.push(it.name); }
    if (o.skill) { const pool = SKILLS.filter((s) => s.price && s.rankReq <= p.rankIdx && !p.skills.includes(s.id)); if (pool.length) { const s = RNG.pick(pool); p.skills.push(s.id); if (p.equipSkills.length < 4) p.equipSkills.push(s.id); out.push(`스킬 [${s.name}]`); } }
    if (o.rel && c.npc) { c.npc.met = true; this.changeRel(c.npc, o.rel); out.push(`${c.npc.name} 관계 ${o.rel > 0 ? '+' : ''}${o.rel}`); }
    if (o.relAll) { for (const n of this.npcsHere()) this.changeRel(n, o.relAll); out.push(`주변 인물 관계 ${o.relAll > 0 ? '+' : ''}${o.relAll}`); }
    this.recalc();
    return out.length ? ` (${out.join(', ')})` : '';
  },

  // 스토리 전투 예약
  storyFight(spec) { this.queue.unshift({ type: 'storyfight', spec }); },

  // ---------- NPC가 먼저 찾아오는 부탁과 사연 ----------
  storyMonthly() {
    const p = this.player;
    // 제자와 배우자 가족사
    if (p.spouse && RNG.chance(0.035) && this.ageYears() < 55) {
      const sp = this.npcById(p.spouse);
      if (sp && sp.alive) {
        const c = this.makeNpc(true, RNG.chance(0.5) ? (p.race || 'human') : sp.race); c.ageMonths = 0; c.child = true; c.parents = [-1, sp.id]; c.region = p.region;
        c.name = p.name[0] + c.name.slice(1); c.met = true; c.relation = 80; c.element = RNG.chance(0.5) ? p.element : sp.element;
        this.npcs.push(c); (p.children ||= []).push(c.id);
        this.lifeEvent(`${sp.name}와(과)의 사이에서 아이 ${c.name}이(가) 태어났다.`);
        this.queue.push({ type: 'story', id: 'child_born', npc: c.id });
      }
    }
    // 빚 돌려받기
    for (const l of [...(p.loans || [])]) {
      if (this.monthKey() < l.due) continue;
      p.loans = p.loans.filter((x) => x !== l);
      const n = this.npcById(l.npc);
      if (n && n.alive && (n.personality !== 'greedy' || RNG.chance(0.5))) { p.money += Math.round(l.amount * 1.3); this.log(`${n.name}이(가) 빌린 돈을 이자까지 붙여 갚았다. (+${fmt(l.amount * 1.3)})`, 'good'); this.changeRel(n, 10); }
      else if (n) { this.log(`${n.name}에게 빌려준 돈은 결국 돌아오지 않았다.`, 'bad'); this.changeRel(n, -15); }
    }
    // NPC 부탁 (한 달에 최대 하나)
    if (RNG.chance(0.32)) {
      const r = this.pickRequest();
      if (r) this.queue.push(r);
    }
    // 원수의 습격 예고
    const nem = this.adults().find((n) => n.nemesis === 'player' && n.region === p.region && RNG.chance(0.35));
    if (nem) this.queue.push({ type: 'ambush', npcId: nem.id });
  },
  pickRequest() {
    const cands = [], weights = [];
    for (const [kind, rq] of Object.entries(REQUESTS)) {
      const pool = rq.who(this).filter((n) => n && n.alive && !n.child);
      if (!pool.length) continue;
      cands.push({ kind, n: RNG.pick(pool) }); weights.push(rq.weight || 1);
    }
    if (!cands.length) return null;
    const { kind, n } = RNG.weighted(cands, weights);
    const q = { type: 'request', kind, npc: n.id };
    if (kind === 'revenge_help') q.npc2 = n.nemesis;
    return q;
  },
  addNpcQuest(n, type, data) {
    const q = { id: 'nq' + Date.now() + RNG.int(0, 999), kind: 'npc', type, npc: n.id, status: 'active', deadline: this.monthKey() + (data.months || 4), ...data };
    this.player.quests.push(q);
    return q;
  },
  finishNpcQuest(q) {
    const p = this.player; const n = this.npcById(q.npc);
    p.quests = p.quests.filter((x) => x !== q);
    if (!n || !n.alive) return;
    this.changeRel(n, q.relReward || 15);
    const money = Math.round((q.money || 120) * RANKS[p.rankIdx].mult);
    p.money += money; p.fame += 2;
    this.queue.push({ type: 'toast', text: fixJosa(`${n.name}의 부탁을 들어줬다. 고맙다며 ${fmt(money)} 크레딧을 보내왔다.`) });
    this.log(`${n.name}의 부탁을 해결했다.`, 'good');
  },
  // 납품형 부탁: 같은 지역에 있을 때 코어가 있으면 전달
  checkDeliveries() {
    const p = this.player;
    for (const q of [...p.quests]) {
      if (q.kind !== 'npc' || q.type !== 'npc_cores') continue;
      const n = this.npcById(q.npc);
      if (n && n.region === p.region && this.coreCount(q.tier) >= q.n) { p.mats['c' + q.tier] -= q.n; q.status = 'done'; this.finishNpcQuest(q); }
    }
  },
});

// ---------- NPC 부탁 정의 ----------
const REQUESTS = {
  help_gate: {
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 20 && !n.isCompanion && n.region !== 'jeju' && !g.player.quests.some((q) => q.npc === n.id)),
    text: (g, c) => `${c.npc.name}에게서 메시지가 왔다.\n\n"${regionById(c.npc.region).name}에 게이트가 하나 열렸는데, 혼자 들어가기엔 좀 불안해서. 시간 되면 같이 처리해 줄래? 보수는 섭섭지 않게 챙길게."`,
    accept: '도와주겠다고 답한다',
    onAccept: (g, c) => { g.addNpcQuest(c.npc, 'npc_gate', { region: c.npc.region, tier: Math.max(0, g.player.rankIdx - 1), title: `${c.npc.name}의 부탁: ${regionById(c.npc.region).name}의 ${RANKS[Math.max(0, g.player.rankIdx - 1)].key}급 이상 게이트 공략`, money: 160, relReward: 18 }); return `"고마워. 진짜 큰 힘이 된다." 기한은 4개월.`; },
    onDecline: (g, c) => { g.changeRel(c.npc, -4); return '"그래, 바쁘면 어쩔 수 없지."'; },
  },
  need_cores: {
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 15 && !g.player.quests.some((q) => q.npc === n.id)),
    text: (g, c) => { const t = Math.max(0, Math.min(7, c.npc.rankIdx - 1)); c.extra = t; return `${c.npc.name}이(가) 조심스럽게 연락해 왔다.\n\n"혹시 ${RANKS[t].key}급 코어 남는 거 있어? 장비 수리에 3개가 꼭 필요한데, 마켓엔 물량이 없더라고."`; },
    accept: '구해 주겠다고 한다',
    onAccept: (g, c) => { const t = Math.max(0, Math.min(7, c.npc.rankIdx - 1)); g.addNpcQuest(c.npc, 'npc_cores', { tier: t, n: 3, title: `${c.npc.name}에게 ${RANKS[t].key}급 코어 3개 전달 (같은 지역에서 자동 전달)`, money: 90, relReward: 14, months: 5 }); g.checkDeliveries(); return '"정말? 살았다!"'; },
    onDecline: (g, c) => { g.changeRel(c.npc, -2); return '"아냐, 괜히 물어봤네."'; },
  },
  spar_invite: {
    who: (g) => g.npcsHere().filter((n) => n.met && n.personality === 'warlike' && n.relation >= 0 && n.lastSpar !== g.monthKey()),
    text: (g, c) => `${c.npc.name}이(가) 어깨를 툭 친다.\n\n"요즘 소문이 좋던데. 실력이 소문만큼인지 한 판 붙어 보자고. 살살 할게."`,
    accept: '대련을 받아들인다',
    onAccept: (g, c) => { g.queue.unshift({ type: 'spar', npcId: c.npc.id }); return '두 사람은 근처 공터로 향했다.'; },
    onDecline: (g, c) => { g.changeRel(c.npc, -6); return '"쳇, 겁먹긴."'; },
  },
  confess: {
    weight: 0.8,
    who: (g) => g.player.partner || g.player.spouse ? [] : g.adults().filter((n) => n.met && n.relation >= 70 && !n.partner && !n.spouse && Math.abs(n.ageMonths / 12 - g.ageYears()) < 15),
    text: (g, c) => `늦은 밤, ${c.npc.name}이(가) 할 말이 있다며 찾아왔다. 한참을 망설이다 입을 연다.\n\n"게이트에 들어갈 때마다 네가 무사히 나올지 그것만 생각나. 나… 너 좋아해."`,
    accept: '마음을 받아들인다',
    onAccept: (g, c) => { g.player.partner = c.npc.id; c.npc.partner = -1; g.changeRel(c.npc, 15); g.lifeEvent(`${c.npc.name}와(과) 연인이 되었다.`); return `${c.npc.name}이(가) 웃었다. 둘은 연인이 되었다.`; },
    decline: '정중히 거절한다',
    onDecline: (g, c) => { g.changeRel(c.npc, -20); return `"…그렇구나. 미안, 잊어 줘." ${c.npc.name}은(는) 애써 웃으며 돌아섰다.`; },
  },
  propose: {
    weight: 1.5,
    who: (g) => { const n = g.player.partner && g.npcById(g.player.partner); return n && n.alive && !g.player.spouse && n.relation >= 85 ? [n] : []; },
    text: (g, c) => `${c.npc.name}이(가) 한강 야경이 보이는 옥상으로 불러냈다. 작은 반지 상자가 손에 들려 있다.\n\n"내일 게이트에서 못 돌아올 수도 있는 직업이잖아, 우리. 그러니까 미루지 않으려고. 나랑 결혼해 줄래?"`,
    accept: '결혼한다',
    onAccept: (g, c) => { const p = g.player; p.spouse = c.npc.id; p.partner = null; c.npc.spouse = -1; c.npc.partner = null; p.fame += 5; g.changeRel(c.npc, 10); g.lifeEvent(`${c.npc.name}와(과) 결혼했다.`); g.rumor(`${p.name}와(과) ${c.npc.name}이(가) 결혼식을 올렸다. 동료 헌터들이 축하 게이트 공략을 선물했다고.`); return '조촐하지만 따뜻한 결혼식이 열렸다. 배우자가 곁에 있는 동안 공격·방어·체력이 4% 오른다.'; },
    decline: '아직은 이르다고 말한다',
    onDecline: (g, c) => { g.changeRel(c.npc, -12); return '"…응, 기다릴게." 목소리가 조금 떨렸다.'; },
  },
  disciple_ask: {
    weight: 0.7,
    who: (g) => (g.player.disciples || []).length >= 3 || g.player.rankIdx < 2 ? [] : g.adults().filter((n) => n.met && n.relation >= 45 && n.rankIdx < g.player.rankIdx && !n.master),
    text: (g, c) => `${c.npc.name}이(가) 무릎을 꿇었다.\n\n"${g.player.name} 님의 전투를 봤습니다. 저도 그렇게 되고 싶습니다. 제자로 받아 주십시오!"`,
    accept: '제자로 받아들인다',
    onAccept: (g, c) => { g.player.disciples.push(c.npc.id); c.npc.master = -1; g.changeRel(c.npc, 15); g.lifeEvent(`${c.npc.name}을(를) 첫 제자로 받아들였다.`); return '제자가 생겼다. 인물 창에서 한 달을 들여 직접 가르칠 수 있다.'; },
    onDecline: (g, c) => { g.changeRel(c.npc, -8); return '"…포기하지 않겠습니다."'; },
  },
  master_offer: {
    weight: 0.6,
    who: (g) => g.player.master ? [] : g.adults().filter((n) => n.met && n.relation >= 55 && n.rankIdx >= g.player.rankIdx + 2),
    text: (g, c) => `${c.npc.name}이(가) 술잔을 내려놓았다.\n\n"너, 에테르 돌리는 법이 엉망이야. 그대로 두면 B급에서 막혀. …내가 봐 줄까? 대신 사부 소리는 들어야겠다."`,
    accept: '사부로 모신다',
    onAccept: (g, c) => { g.player.master = c.npc.id; g.changeRel(c.npc, 12); g.lifeEvent(`${c.npc.name}을(를) 스승으로 모셨다.`); return '스승이 생겼다. 스승이 살아 있는 동안 수련 효율 +10%, 언제든 가르침을 청할 수 있다.'; },
    onDecline: (g, c) => { g.changeRel(c.npc, -5); return '"흥, 후회할 거다."'; },
  },
  loan: {
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 25 && (n.personality === 'greedy' || n.personality === 'kind') && !(g.player.loans || []).some((l) => l.npc === n.id)),
    text: (g, c) => `${c.npc.name}에게서 다급한 전화가 왔다.\n\n"정말 미안한데… ${fmt(Math.round(400 * RANKS[g.player.rankIdx].mult))} 크레딧만 빌려줄 수 있어? 장비 할부가 밀려서 길드에서 잘리게 생겼어. 반년 안에 꼭 갚을게."`,
    accept: '빌려준다',
    onAccept: (g, c) => { const a = Math.round(400 * RANKS[g.player.rankIdx].mult); if (g.player.money < a) return '통장 잔고가 모자라 빌려줄 수 없었다.'; g.player.money -= a; (g.player.loans ||= []).push({ npc: c.npc.id, amount: a, due: g.monthKey() + RNG.int(4, 8) }); g.changeRel(c.npc, 12); return '"평생 안 잊을게. 진짜로."'; },
    onDecline: (g, c) => { g.changeRel(c.npc, -6); return '"…아냐, 내가 염치가 없었네."'; },
  },
  revenge_help: {
    weight: 1.2,
    who: (g) => g.adults().filter((n) => n.met && n.relation >= 35 && typeof n.nemesis === 'number' && g.npcById(n.nemesis) && g.npcById(n.nemesis).alive),
    text: (g, c) => { const t = g.npcById(c.npc.nemesis); return `${c.npc.name}의 눈이 충혈돼 있다.\n\n"${t.name}… 그 자식이 내 사람을 죽였어. 협회는 '정당한 결투'였다며 손을 놨고. 부탁이야. 나 혼자선 못 이겨."`; },
    accept: '복수를 돕겠다',
    onAccept: (g, c) => { const t = g.npcById(c.npc.nemesis); g.addNpcQuest(c.npc, 'npc_kill', { target: t.id, title: `${c.npc.name}의 원수 ${t.name}(${RANKS[t.rankIdx].key}급, ${regionById(t.region).name}) 처치`, money: 300, relReward: 30, months: 8 }); t.met = true; return `"…고마워. 이 은혜는 목숨으로 갚을게." ${t.name}은(는) 지금 ${regionById(t.region).name}에 있다고 한다.`; },
    decline: '원한에 휘말리고 싶지 않다',
    onDecline: (g, c) => { g.changeRel(c.npc, -10); return '"그래. 다들 그렇지."'; },
  },
};
