// ===== 게이트 크로니클: NPC 야망·처지·행동 선택 (영역 C) =====
// docs/NPC_사회_제안.md 층 1. NPC마다 야망 하나, 처지(돈·부상·남은 수명·최근 실패)가 있고,
// 매달 후보 행동(수련·게이트·이동·휴식·교류)에 "야망 가중치 × 처지 보정" 점수를 매겨 고른다.
// 게이트 생태계(gate_eco.js)는 "게이트에 가려는" NPC로 팀을 꾸린다.

const AMBITIONS = {
  peak:    { name: '정점', desc: '더 높은 곳', w: { train: 1.4, gate: 1.2, move: 0.5, rest: 0.2, social: 0.3 } },
  wealth:  { name: '부', desc: '돈 되는 일', w: { train: 0.5, gate: 1.5, move: 0.7, rest: 0.3, social: 0.4 } },
  guard:   { name: '지킴', desc: '사람을 지키는 일', w: { train: 0.8, gate: 1.1, move: 0.9, rest: 0.3, social: 0.6 } },
  revenge: { name: '복수', desc: '원수를 갚는 일', w: { train: 1.6, gate: 0.8, move: 0.8, rest: 0.2, social: 0.2 } },
  family:  { name: '가문', desc: '가족과 안정', w: { train: 0.6, gate: 0.6, move: 0.1, rest: 0.9, social: 1.2 } },
  power:   { name: '권력', desc: '길드 안의 자리', w: { train: 0.7, gate: 1.0, move: 0.4, rest: 0.3, social: 1.1 } },
  truth:   { name: '진실', desc: '감춰진 것을 캐는 일', w: { train: 0.5, gate: 0.5, move: 1.2, rest: 0.4, social: 1.0 } },
  rest:    { name: '안식', desc: '조용한 마무리', w: { train: 0.3, gate: 0.05, move: 0.1, rest: 1.5, social: 1.0 } },
};
const NPC_INTENT_NAME = { train: '수련 중', gate: '게이트 원정 준비', move: '이동 중', rest: '쉬는 중', social: '사람들과 어울리는 중', hurt: '부상 치료 중', retired: '은퇴' };

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.pickAmbition = function (n) {
    const pers = n.personality;
    const age = Math.floor(n.ageMonths / 12);
    if (n.lifespan - age <= 6 && age >= 50) return 'rest';
    if (n.nemesis && n.nemesis !== 'player' && RNG.chance(0.6)) return 'revenge';
    if (n.nemesis === 'player') return 'revenge';
    const w = { peak: 1, wealth: 1, guard: 1, family: 0.6, power: 0.6, truth: 0.4 };
    if (pers === 'warlike') { w.peak += 3; w.power += 1; }
    if (pers === 'greedy') { w.wealth += 3; w.power += 1; }
    if (pers === 'just') { w.guard += 3; w.truth += 1.5; }
    if (pers === 'kind') { w.guard += 1.5; w.family += 2; }
    if (pers === 'cold') { w.power += 2; w.truth += 1; w.peak += 1; }
    if (n.talent >= 8) w.peak += 2;
    if (n.spouse) w.family += 2;
    if (n.guild && n.rankIdx >= 3) w.power += 1;
    const keys = Object.keys(w);
    return RNG.weighted(keys, keys.map((k) => w[k]));
  };

  GP.npcLifeLeft = function (n) { return n.lifespan - n.ageMonths / 12; };

  GP.npcInitAi = function (n) {
    if (n.child) return;
    n.amb ??= this.pickAmbition(n);
    n.cash ??= Math.round(200 * RANKS[n.rankIdx].mult * RNG.range(0.5, 2));
    n.hurt ??= 0; n.fails ??= 0;
  };

  wrap('initSandbox', function (base) {
    base.call(this);
    for (const n of this.npcs || []) this.npcInitAi(n);
  });

  // 처지가 야망을 바꾼다
  GP.npcShift = function (n) {
    const left = this.npcLifeLeft(n);
    const old = n.amb;
    if (left <= 6 && n.ageMonths / 12 >= 50 && n.amb !== 'rest' && !(n.amb === 'peak' && n.rankIdx < 7)) n.amb = 'rest';
    else if (n.cash < -300 * RANKS[n.rankIdx].mult && n.amb !== 'wealth' && RNG.chance(0.2)) { n.amb0 ??= n.amb; n.amb = 'wealth'; }
    else if (n.amb === 'wealth' && n.amb0 && n.cash > 800 * RANKS[n.rankIdx].mult) { n.amb = n.amb0; n.amb0 = null; }
    else if (n.nemesis && n.amb !== 'revenge' && RNG.chance(0.1)) n.amb = 'revenge';
    else if (!n.nemesis && n.amb === 'revenge') n.amb = this.pickAmbition(n);
    else if (n.spouse && n.amb !== 'family' && RNG.chance(0.01)) n.amb = 'family';
    if (old !== n.amb) { n.ambSince = this.monthKey(); this.npcRemember && this.npcRemember(n, `야망이 바뀌었다: ${AMBITIONS[old] ? AMBITIONS[old].name : '?'} → ${AMBITIONS[n.amb].name}`); }
  };

  // 지역 고르기
  GP.npcTargetRegion = function (n) {
    const reach = REGIONS.filter((r) => r.id !== 'jeju' || n.rankIdx >= 6);
    const score = (r) => {
      const gates = this.mapGates.filter((g) => g.region === r.id && !g.final && !g.mission);
      const fit = gates.filter((g) => g.tier <= n.rankIdx + 1 && g.tier >= n.rankIdx - 2).length;
      const brk = this.world.breaks && this.world.breaks.some((b) => b.city === r.id) ? 1 : 0;
      const nem = n.nemesis && n.nemesis !== 'player' ? this.npcById(n.nemesis) : null;
      switch (n.amb) {
        case 'peak': return gates.filter((g) => g.tier >= n.rankIdx).length * 2 + r.danger * 0.3;
        case 'wealth': return fit * 2 + (r.guild ? 0.5 : 0);
        case 'guard': return brk * 6 + r.danger + gates.length * 0.5;
        case 'revenge': return nem && nem.alive && nem.region === r.id ? 8 : fit;
        case 'truth': return RNG.next() * 3;
        case 'rest': return 5 - r.danger;
        default: return fit;
      }
    };
    const near = reach.filter((r) => r.id === n.region || regionDist(r.id, n.region) <= 1);
    return near.sort((a, b) => score(b) - score(a))[0];
  };

  GP.npcChoose = function (n) {
    const A = AMBITIONS[n.amb] || AMBITIONS.peak;
    const left = this.npcLifeLeft(n);
    const gatesHere = this.mapGates.filter((g) => g.region === n.region && !g.final && !g.mission && !g.raid && g.tier <= n.rankIdx + 1 && g.tier >= n.rankIdx - 2).length;
    const tgt = this.npcTargetRegion(n);
    const s = {
      train: A.w.train * (n.stage === 2 ? 1.3 : 1),
      gate: A.w.gate * (gatesHere ? 1.2 : 0.2) * (n.cash < 0 ? 1.5 : 1) * (n.fails >= 2 ? 0.5 : 1),
      move: A.w.move * (tgt && tgt.id !== n.region ? 1 : 0),
      rest: A.w.rest * (n.fails >= 2 ? 1.6 : 1),
      social: A.w.social,
    };
    if (n.amb === 'peak' && left <= 5 && n.rankIdx < 7) s.train += 2; // 남은 시간이 없다
    const keys = Object.keys(s);
    const pick = keys.map((k) => [k, s[k] * RNG.range(0.6, 1.4)]).sort((a, b) => b[1] - a[1])[0][0];
    return { act: pick, tgt };
  };

  GP.npcMonthly = function () {
    const mk = this.monthKey();
    for (const n of this.npcs) {
      if (!n.alive || n.child || n.isCompanion || (n.merc && n.merc.job)) continue;
      this.npcInitAi(n);
      if (n.retired) { n.intent = 'retired'; continue; }
      this.npcShift(n);
      if (n.hurt > 0) { n.hurt--; n.intent = 'hurt'; continue; }
      const { act, tgt } = this.npcChoose(n);
      n.intent = act;
      const reg = regionById(n.region);
      if (act === 'train') {
        n.progress += (1 + n.talent * 0.08) * reg.ether * 0.15 / (4 * RANKS[n.rankIdx].mult ** 1.5);
        // 수명이 다해 가는 정점 야망: 무리한 돌파
        if (n.amb === 'peak' && this.npcLifeLeft(n) <= 3 && n.stage === 2 && n.rankIdx < 7 && RNG.chance(0.08)) {
          if (RNG.chance(0.25)) {
            n.rankIdx++; n.stage = 0; n.progress = 0; n.lifespan += RANKS[n.rankIdx].life - RANKS[n.rankIdx - 1].life;
            this.rumor(`노장 ${n.name}이(가) 생의 끝에서 벽을 깼다. ${RANKS[n.rankIdx].key}급.`, { kind: 'npc-desperate', score: 3 });
          } else if (RNG.chance(0.4)) {
            this.killNpc(n, '무리한 돌파');
            if (n.met || n.rankIdx >= 4) this.rumor(`${n.name}이(가) 마지막 돌파에 모든 것을 걸었다가 쓰러졌다.`, { kind: 'npc-desperate', score: 2 });
            continue;
          }
        }
      } else if (act === 'move' && tgt && tgt.id !== n.region) {
        n.region = tgt.id;
        if (n.amb === 'guard' && this.world.breaks.some((b) => b.city === tgt.id) && (n.met || n.rankIdx >= 4)) this.rumor(`${n.name}이(가) 브레이크 소식을 듣고 ${tgt.name}(으)로 달려갔다.`, { kind: 'npc-guard' });
      } else if (act === 'rest') {
        if (n.fails > 0 && RNG.chance(0.3)) n.fails--;
      } else if (act === 'social') {
        const o = RNG.pick(this.adults().filter((x) => x !== n && x.region === n.region));
        if (o && this.addLink) this.addLink(n, o, RNG.int(1, 4));
      }
      // 생활비와 수입
      n.cash += Math.round(RANKS[n.rankIdx].mult * ((n.guild ? 30 : 18) - 20 * (n.amb === 'family' ? 1.3 : 1) + (act === 'gate' ? 10 : 0)));
      // 안식: 은퇴
      if (n.amb === 'rest' && this.npcLifeLeft(n) <= 4 && !n.retired && RNG.chance(0.25)) {
        n.retired = mk;
        if (n.met || n.rankIdx >= 4) this.rumor(`${RANKS[n.rankIdx].key}급 ${n.name}이(가) 은퇴를 선언했다.`, { kind: 'npc-retire', score: n.rankIdx >= 6 ? 3 : 0 });
        if (n.met) this.log(`${n.name}이(가) 현역에서 물러났다.`, '');
      }
    }
  };

  wrap('simulateNpcs', function (base) {
    base.call(this);
    this.npcMonthly();
  });

  wrap('makeNpc', function (base, young, race) {
    const n = base.call(this, young, race);
    if (n && !n.child) { n.amb = this.pickAmbition(n); n.cash = Math.round(200 * RANKS[n.rankIdx].mult * RNG.range(0.5, 2)); n.hurt = 0; n.fails = 0; }
    return n;
  });

  // 게이트 생태계와 연결: 게이트에 가려는 NPC 위주로 팀을 꾸린다
  if (GP.ecoPool) wrap('ecoPool', function (base, regionId) {
    return base.call(this, regionId).filter((n) => !n.retired && !(n.hurt > 0) && (n.intent === 'gate' || (n.amb !== 'rest' && RNG.chance(0.25))));
  });
  if (GP.ecoResolve) wrap('ecoResolve', function (base, g) {
    const ids = g.raid ? g.raid.ids.slice() : [];
    base.call(this, g);
    const ok = !this.mapGates.includes(g);
    for (const id of ids) {
      const n = this.npcById(id); if (!n || !n.alive) continue;
      if (ok) { n.cash = (n.cash || 0) + Math.round(120 * RANKS[g.tier].mult); n.fails = 0; }
      else { n.fails = (n.fails || 0) + 1; n.hurt = RNG.int(1, 3); }
    }
  });
  // 은퇴자는 랭킹·게이트 밖
  if (GP.ranking) wrap('ranking', function (base) {
    const r = base.call(this);
    r.list = r.list.filter((x) => x.me || !(x.npc && x.npc.retired));
    r.pos = r.list.findIndex((x) => x.me) + 1;
    return r;
  });
}

if (typeof UI !== 'undefined' && UI.npcCard) {
  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    const html = baseCard.call(this, n, here);
    if (!n || n.child || !n.alive || !n.amb || !(n.met || here)) return html;
    const A = AMBITIONS[n.amb];
    const line = `<div class="small dim">야망 <b>${A.name}</b> · ${A.desc}${n.intent ? ` · 지금: ${NPC_INTENT_NAME[n.intent] || n.intent}` : ''}</div>`;
    const at = html.indexOf('<div class="rel-line">');
    return at >= 0 ? html.slice(0, at) + line + html.slice(at) : html;
  };
}
