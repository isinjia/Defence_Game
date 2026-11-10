// ===== 게이트 크로니클: 게이트 안 다른 파티 (영역 C, 4-20) =====
// 같은 게이트의 NPC 팀(생태계 배정 gate.raid, 길드 게이트의 길드 팀)을 층 지도 위 파티로 만든다.
// C: 데이터·이동·경쟁(먼저 보스를 잡으면 게이트가 닫힘)·만남 판정. F: 층 지도 표시·버튼(js/gate_owner.js 등).
//
// 부르는 법
//   G.gatePartiesIn(gate)                     → 파티 목록(없으면 만든다). 게이트 입장 때 한 번.
//   G.gatePartiesPlace(gate, run)             → 새 층 지도(run.map)가 생길 때. 이 층에 있는 파티에 칸(row, col)을 준다.
//   G.gatePartiesStep(gate, run)              → 플레이어가 칸을 하나 지날 때. 파티가 한 줄 위로. 반환: 사건 배열
//        { type: 'floor', party }(다른 층으로) | { type: 'closed', party }(먼저 게이트 보스를 잡아 닫음 → F가 허탕 처리)
//   G.gatePartiesAt(gate, run, row, col)      → 그 칸에 있는 파티(같은 칸이면 만남)
//   G.gatePartyVisible(gate, run, party, seen) → 보이는가(탐색 직업이 있으면 지나온 칸·인접 칸까지). seen = [[row,col], ...]
//   G.gatePartyOptions(gate, party)           → [{ act, label, hint }]  만났을 때 고를 수 있는 것
//   G.gatePartyAct(gate, party, act)          → { text, ok, join?, info?, duel?, trade?, help? }
// 파티 = { pid, ids, leader, owner('kama'|길드 id|'free'), kind, floor, row, col, intent('clear'|'farm'|'hostile'), met, allied, gone }

const GP_PARTY = {
  speed: 1,             // 한 칸 지날 때 파티가 오르는 줄 수
  bossWin: 0.55,        // 기준 보스 공략 성공률(힘 비교로 가감)
  guildTeamChance: 0.5, // 길드 게이트에 길드 팀이 들어와 있을 확률(생태계 배정이 없을 때)
};

// 성격 50종 → 만남 성향
const PERSONA_MEET = {
  provoke: ['hotblood', 'brawler', 'hothead', 'competitor', 'braggart', 'sharp_tongue', 'chuuni', 'ambitious'],
  trade: ['merchant_soul', 'miser', 'opportunist', 'calculating', 'gambler', 'insider'],
  helpful: ['chivalrous', 'justice_freak', 'devout', 'busybody', 'sunny', 'mood_maker', 'steadfast', 'dutiful', 'naive', 'romantic'],
  aloof: ['lone_wolf', 'kuudere', 'shy_genius', 'timid', 'cynic', 'coward', 'lazy', 'spacey', 'haunted', 'drifter', 'self_doubt'],
};

{
  const GP = Game.prototype;
  const meetOf = (n) => {
    const id = n && (n.persona || '');
    for (const [k, list] of Object.entries(PERSONA_MEET)) if (list.includes(id)) return k;
    return 'neutral';
  };

  GP.gatePartyLeader = function (pt) { return this.npcById(pt.leader); };
  GP.gatePartyMembers = function (pt) { return pt.ids.map((id) => this.npcById(id)).filter((n) => n && n.alive); };
  GP.gatePartyPower = function (pt) { return this.ecoPower ? this.ecoPower(this.gatePartyMembers(pt)) : this.gatePartyMembers(pt).length; };

  GP.gatePartiesIn = function (gate) {
    if (!gate) return [];
    if (gate.parties) { gate.parties = gate.parties.filter((pt) => !pt.gone && this.gatePartyMembers(pt).length); return gate.parties; }
    const list = [];
    const add = (team, owner, kind) => {
      const ms = team.filter((n) => n && n.alive && !n.isCompanion && !this.player.party.includes(n.id));
      if (!ms.length) return;
      const L = ms.slice().sort((a, b) => b.rankIdx - a.rankIdx)[0];
      const meet = meetOf(L); const pid = persById(L.personality).id;
      const intent = (meet === 'provoke' || pid === 'warlike') && RNG.chance(0.35) ? 'hostile' : RNG.chance(0.7) ? 'clear' : 'farm';
      list.push({ pid: 'pt' + (list.length + 1), ids: ms.map((n) => n.id), leader: L.id, owner, kind, floor: 0, row: 0, col: 0, intent, met: false, allied: false, gone: false });
    };
    if (gate.raid && gate.raid.ids) {
      const a = gate.raid.actor || {};
      add(gate.raid.ids.map((id) => this.npcById(id)), a.kind === 'guild' ? a.guild : a.kind === 'assoc' ? 'kama' : 'free', a.kind || 'free');
    }
    const o = this.gateOwner ? this.gateOwner(gate) : 'kama';
    if (!gate.raid && o !== 'kama' && GUILDS[o] && o !== this.player.guild && RNG.chance(GP_PARTY.guildTeamChance) && this.ecoForm) {
      const f = this.ecoForm(gate); if (f && f.team.length) add(f.team, o, 'guild');
    }
    // 같은 게이트를 노리는 프리랜서가 가끔 있다
    if (!list.length && RNG.chance(0.4) && this.ecoPool) {
      const fit = (n) => n.rankIdx >= (gate.tier || 0) - 2 && n.rankIdx <= (gate.tier || 0) + 1 && !n.guild && !n.isCompanion;
      const team = this.ecoPool(gate.region).filter(fit).sort(() => RNG.next() - 0.5).slice(0, RNG.int(1, 3));
      add(team, 'free', 'free');
    }
    gate.parties = list;
    return list;
  };

  // 새 층: 이 층에 있는 파티에 칸을 준다(입구보다 조금 앞서 있거나 뒤에)
  GP.gatePartiesPlace = function (gate, run) {
    const m = run && run.map; if (!m || !m.rows) return [];
    const here = this.gatePartiesIn(gate).filter((pt) => pt.floor === run.floor);
    for (const pt of here) {
      if (pt.placedFloor === run.floor) continue;
      pt.row = Math.min(m.rows.length - 2, RNG.int(0, Math.max(0, Math.floor(m.rows.length / 2))));
      pt.col = RNG.int(0, m.rows[pt.row].length - 1); pt.placedFloor = run.floor;
    }
    return here;
  };

  GP.gatePartiesAt = function (gate, run, row, col) {
    return this.gatePartiesIn(gate).filter((pt) => pt.floor === run.floor && pt.row === row && (col == null || pt.col === col) && !pt.allied);
  };

  // 보이는가: 같은 칸이면 언제나, 탐색 직업(통찰 0.35 이상)이 있으면 지나온 칸과 인접 칸
  GP.gateScoutPower = function () {
    if (!this.insightOf) return 0.2;
    const p = this.player;
    return Math.max(this.insightOf({ cls: p.cls, rankIdx: p.rankIdx, personality: '' }), ...this.party().map((n) => this.insightOf(n)));
  };
  GP.gatePartyVisible = function (gate, run, pt, seen = []) {
    if (pt.floor !== run.floor || pt.allied) return false;
    const at = run.at || (seen.length ? seen[seen.length - 1] : null);
    if (at && at[0] === pt.row && at[1] === pt.col) return true;
    if (this.gateScoutPower() < 0.35) return false;
    return seen.some(([r, c]) => Math.abs(r - pt.row) <= 1 && Math.abs(c - pt.col) <= 1);
  };

  // 플레이어가 칸을 지날 때: 파티가 오른다. 마지막 층 맨 위에 닿으면 게이트 보스와 붙는다.
  GP.gatePartiesStep = function (gate, run) {
    const ev = [];
    const m = run && run.map; if (!m) return ev;
    for (const pt of this.gatePartiesIn(gate)) {
      if (pt.allied || pt.gone || pt.intent === 'farm' && RNG.chance(0.5)) continue;
      if (pt.floor < run.floor) { pt.floor++; pt.row = 0; pt.placedFloor = null; continue; } // 뒤처진 파티가 따라온다
      if (pt.floor > run.floor) { // 앞선 파티: 층 단위로 추상 진행
        if (RNG.chance(0.25)) { if (pt.floor >= run.floors - 1) { const e = this.gatePartyBoss(gate, pt); if (e) ev.push(e); } else pt.floor++; }
        continue;
      }
      pt.row += GP_PARTY.speed;
      const top = m.rows.length - 1;
      if (pt.row >= top) {
        if (run.floor >= run.floors - 1) { const e = this.gatePartyBoss(gate, pt); if (e) ev.push(e); }
        else { pt.floor++; pt.row = 0; pt.placedFloor = null; ev.push({ type: 'floor', party: pt }); }
      } else pt.col = Math.max(0, Math.min(m.rows[pt.row].length - 1, pt.col + RNG.int(-1, 1)));
    }
    return ev;
  };

  GP.gatePartyBoss = function (gate, pt) {
    const pow = this.gatePartyPower(pt); const need = RANKS[Math.min(7, gate.tier ?? 0)].mult * 1.5;
    const ok = RNG.chance(Math.max(0.1, Math.min(0.9, GP_PARTY.bossWin + (pow - need) / (need * 2))));
    const L = this.gatePartyLeader(pt);
    if (ok) {
      pt.gone = true; gate.closedBy = pt.pid;
      for (const n of this.gatePartyMembers(pt)) n.renown = (n.renown || 0) + (gate.tier || 0) + 1;
      this.rumor(`${L ? L.name : '다른 파티'}${pt.owner !== 'free' && pt.owner !== 'kama' && GUILDS[pt.owner] ? `(${GUILDS[pt.owner].name})` : ''}이(가) ${regionById(gate.region).name} 게이트 보스를 먼저 쓰러뜨렸다.`, { kind: 'eco-ok', thread: 'gate:' + gate.id });
      return { type: 'closed', party: pt, text: `${L ? L.name + '의 파티' : '다른 파티'}가 먼저 게이트 보스를 쓰러뜨렸다. 게이트가 닫히기 시작한다!` };
    }
    // 실패: 다쳐서 물러난다
    pt.gone = true;
    for (const n of this.gatePartyMembers(pt)) n.hurt = Math.max(n.hurt || 0, 2);
    return { type: 'retreat', party: pt, text: `${L ? L.name + '의 파티' : '다른 파티'}가 보스에게 밀려 물러났다는 비명이 들린다.` };
  };

  // ---------- 만남 ----------
  GP.gatePartyStance = function (gate, pt) {
    const L = this.gatePartyLeader(pt); if (!L) return 'neutral';
    const p = this.player;
    if (L.nemesis === 'player' || L.relation <= -40) return 'hostile';
    if (pt.intent === 'hostile') return 'hostile';
    const outsider = this.isGuildGateOutsider && this.isGuildGateOutsider(gate) === pt.owner;
    if (outsider || (this.guildHostileTo && GUILDS[pt.owner] && this.guildHostileTo(pt.owner))) return 'wary';
    if (L.relation >= 30 || (p.guild && p.guild === pt.owner)) return 'friendly';
    return meetOf(L) === 'helpful' ? 'friendly' : meetOf(L) === 'aloof' ? 'aloof' : 'neutral';
  };

  GP.gatePartyGreeting = function (gate, pt) {
    const L = this.gatePartyLeader(pt); if (!L) return '';
    const st = this.gatePartyStance(gate, pt);
    const line = this.personaLine ? this.personaLine(L, st === 'hostile' ? 'boss' : 'idle') : null;
    const head = { hostile: `${L.name}의 파티가 무기를 겨눈 채 길을 막는다.`, wary: `${L.name}의 파티가 경계하는 눈빛으로 멈춰 선다.`, friendly: `${L.name}의 파티가 손을 흔든다.`, aloof: `${L.name}의 파티가 힐끗 보고 지나치려 한다.`, neutral: `${L.name}의 파티와 마주쳤다.` }[st];
    return `${head}${line ? ` "${line}"` : ''}`;
  };

  GP.gatePartyOptions = function (gate, pt) {
    const st = this.gatePartyStance(gate, pt);
    const o = [
      { act: 'greet', label: '인사한다', hint: '관계 조금 +' },
      { act: 'info', label: '정보를 나눈다', hint: '다음 층 정보' },
      { act: 'join', label: '함께 가자고 한다', hint: '임시 연합 · 전리품 나눔' },
      { act: 'trade', label: '물자를 거래한다', hint: '회복약 사고팔기' },
      { act: 'help', label: '도움을 청한다', hint: '위기일 때' },
      { act: 'part', label: '따로 간다', hint: '' },
      { act: 'compete', label: '보스는 우리가 먼저', hint: '경쟁 선언 · 관계 −' },
      { act: 'provoke', label: '시비를 건다', hint: '생사결 · 게이트 안은 범죄 아님' },
    ];
    if (st === 'hostile') return o.filter((x) => ['part', 'provoke', 'trade'].includes(x.act)).concat([{ act: 'appease', label: '달랜다', hint: '말로 물리기' }]);
    return o;
  };

  // act → 결과. 성격·관계·소속으로 판정
  GP.gatePartyAct = function (gate, pt, act) {
    const L = this.gatePartyLeader(pt); const p = this.player;
    if (!L) return { ok: false, text: '' };
    pt.met = true; L.met = true;
    const st = this.gatePartyStance(gate, pt); const meet = meetOf(L);
    const mood = { friendly: 0.25, neutral: 0, aloof: -0.15, wary: -0.25, hostile: -0.5 }[st];
    const roll = (base) => RNG.chance(Math.max(0.05, Math.min(0.95, base + mood + (L.relation || 0) / 200)));
    const name = L.name;
    switch (act) {
      case 'greet': this.changeRel(L, 2); return { ok: true, text: `${name}과(와) 짧게 인사를 나눴다.` };
      case 'info': {
        if (!roll(0.6)) return { ok: false, text: `${name}이(가) 어깨를 으쓱한다. "알아서 해."` };
        this.changeRel(L, 2);
        return { ok: true, info: true, text: `${name}이(가) 위쪽 길을 알려 줬다. 다음 층의 위험한 칸이 표시된다.` };
      }
      case 'join': {
        const base = meet === 'helpful' ? 0.65 : meet === 'aloof' ? 0.15 : 0.4;
        if (!roll(base)) return { ok: false, text: `${name}이(가) 고개를 젓는다. "우린 우리 길로 간다."` };
        pt.allied = true; this.changeRel(L, 4);
        return { ok: true, join: pt.ids.slice(0, 2), text: `${name}의 파티와 임시 연합을 맺었다. 보스 전리품은 나눈다.` };
      }
      case 'trade': {
        if (meet === 'aloof' && !roll(0.3)) return { ok: false, text: `${name}이(가) 거래에 관심이 없다.` };
        const markup = meet === 'trade' ? 1.4 : st === 'hostile' ? 2 : 1.1;
        return { ok: true, trade: { markup }, text: `${name}이(가) 짐을 풀었다. ${markup >= 1.4 ? '값을 꽤 부른다.' : '시세대로 거래할 수 있다.'}` };
      }
      case 'help': {
        const base = meet === 'helpful' ? 0.8 : meet === 'trade' ? 0.45 : 0.4;
        if (!roll(base)) return { ok: false, text: `${name}이(가) 못 본 척 지나간다.` };
        this.changeRel(L, 3);
        const fee = meet === 'trade' ? Math.round(80 * RANKS[gate.tier || 0].mult) : 0;
        if (fee) p.money = Math.max(0, p.money - fee);
        return { ok: true, help: { heal: 0.4 }, text: `${name}의 파티가 응급 처치를 해 줬다. 체력 40% 회복${fee ? ` (사례비 ${fmt(fee)} 크레딧)` : ''}.` };
      }
      case 'part': return { ok: true, text: `${name}의 파티와 각자 길을 갔다.` };
      case 'compete': this.changeRel(L, -5); pt.intent = 'clear'; return { ok: true, text: `${name}이(가) 웃는다. "누가 먼저 닿는지 보자고." 파티가 서두르기 시작했다.` };
      case 'appease': {
        if (roll(0.45)) { pt.intent = 'clear'; return { ok: true, text: `${name}이(가) 칼을 거뒀다. "운 좋은 줄 알아."` }; }
        return { ok: false, duel: L.id, text: `${name}이(가) 말을 끊는다. "말은 됐고."` };
      }
      case 'provoke': this.changeRel(L, -30); L.relation = Math.min(L.relation, -20); return { ok: true, duel: L.id, text: `${name}과(와)의 생사결이다. 게이트 안이라 법은 닿지 않는다.` };
    }
    return { ok: false, text: '' };
  };

  // 4-19 구출 연결: 같은 게이트에 다른 팀이 있으면 구출 확률이 오른다(E가 읽는다)
  GP.gateRescueBonus = function (gate) {
    const list = this.gatePartiesIn(gate).filter((pt) => !pt.gone);
    if (!list.length) return 0;
    return 0.15 + (list.some((pt) => pt.met && this.gatePartyStance(gate, pt) === 'friendly') ? 0.1 : 0);
  };
}
