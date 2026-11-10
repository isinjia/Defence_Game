// ===== 게이트 크로니클: 탐색 판정 (능력치 가산 + 주사위) =====
// 탐색 중 위험이 따르는 선택(게이트 층 사건, 지도 탐사 지점)은 "기본 확률 + 맡은 사람의 능력치 가산"으로
// 성공 확률을 정하고 d100 주사위로 가른다.
//  - 선택지마다 쓰는 능력치와 성공 확률을 보여 준다.
//  - 누가 맡을지는 파티 리더가 정한다. 플레이어가 리더면 직접 고르고, NPC 리더면 성격·실력대로
//    적임자를 고르거나 엉뚱한 사람을 고른다(한마디).
//  - 결과는 팝업: 맡은 사람, 주사위 굴림(값/목표치), 성공·실패, 얻은 것·잃은 것.
// gate_run.js·explore.js 의 사건 함수는 그대로 두고 G.roll 을 판정 결과로 대신한다.

const CHECK_STATS = {
  str:  { name: '힘',   val: (u) => u.atk,   base: (m) => 20 * m },
  vit:  { name: '체력', val: (u) => u.maxHp, base: (m) => 100 * m },
  agi:  { name: '민첩', val: (u) => u.spd,   base: (m) => 10 * Math.sqrt(m) },
  mind: { name: '정신', val: (u) => u.maxMp, base: (m) => 50 * m },
  luck: { name: '운',   val: (u) => u.luck,  base: () => 10 },
};
// 게이트 층 사건: 사건 id → 선택지 번호 → [능력치, 기본 확률]. 없는 사건은 g.roll(확률)을 읽어 운 판정으로 다룬다.
const GATE_CHECKS = {
  pack: { 0: ['luck', 0.7] }, pool: { 0: ['mind', 0.6] }, survivor: { 0: ['str', 0.55] }, altar: { 0: ['mind', 0.45] },
  wall: { 0: ['str', 0.6] }, trail: { 0: ['agi', 0.5] }, echo: { 0: ['mind', 0.5] }, crystal: { 0: ['vit', 0.65] },
};
// 지도 탐사 지점: 종류 → 선택 → [능력치, 기본 확률]
const SITE_CHECKS = {
  ruin: { search: ['agi', 0.6] }, spring: { absorb: ['mind', 0.6] }, outpost: { search: ['luck', 0.7] },
  village: { help: ['str', 0.7] }, altar: { destroy: ['str', 0.75], study: ['mind', 0.55] }, tower: { climb: ['agi', 0.75] },
  oldcity: { go: ['luck', 0.6] },
};
const LEADER_ACC = { just: 0.85, cold: 0.8, kind: 0.65, greedy: 0.55, warlike: 0.5 };

Object.assign(Game.prototype, {
  checkMembers() {
    const p = this.player;
    const list = [{ key: 'me', name: p.name, npc: null, unit: this.playerUnit(), rank: p.rankIdx, stage: p.stage || 0 }];
    for (const n of this.party()) if (n && n.alive) list.push({ key: 'n' + n.id, name: n.name, npc: n, unit: this.npcUnit(n, 'ally'), rank: n.rankIdx, stage: n.stage || 0 });
    return list;
  },
  // 탐색 리더: 시험 교관 → 소속 파티 리더 → 플레이어(null)
  checkLeader() {
    if (typeof UI !== 'undefined' && UI.exam && UI.exam.leader != null && UI.ctx && UI.ctx.kind !== 'gate') { const L = this.npcById(UI.exam.leader); if (L && L.alive) return L; }
    const L = this.crewLeader ? this.crewLeader() : null;
    return L && this.party().includes(L) ? L : null;
  },
  // 맡은 사람의 성공 확률(%)과 가산 내역
  checkChance(m, stat, base, tier) {
    const S = CHECK_STATS[stat]; const u = m.unit;
    const ratio = S.val(u) / Math.max(1, S.base(statMult(m.rank, m.stage)));
    const statB = Math.max(-15, Math.min(25, Math.round((ratio - 1) * 50)));
    const rankB = Math.max(-21, Math.min(14, (m.rank - tier) * 7));
    const luckB = stat === 'luck' ? 0 : Math.max(-5, Math.min(5, Math.round(((u.luck || 10) - 10) / 3)));
    const chance = Math.max(5, Math.min(95, Math.round(base * 100 + statB + rankB + luckB)));
    return { chance, base: Math.round(base * 100), statB, rankB, luckB, val: Math.round(S.val(u)) };
  },
  // NPC 리더가 맡길 사람을 고른다 → { member, line, apt }
  checkLeaderPick(L, members, stat, base, tier) {
    const ranked = members.map((m) => ({ m, c: this.checkChance(m, stat, base, tier).chance })).sort((a, b) => b.c - a.c);
    const best = ranked[0].m; const self = members.find((m) => m.npc === L);
    // 적임자를 알아보는 눈: 리더 품질(orders.js npcLead 0~100)이 있으면 그것으로, 없으면 성격으로
    const acc = typeof npcLead === 'function' ? Math.min(0.95, Math.max(0.25, 0.2 + npcLead(L) * 0.0085))
      : Math.min(0.95, Math.max(0.3, (LEADER_ACC[L.personality] ?? 0.65) + Math.max(-0.1, Math.min(0.1, (L.rankIdx - 3) * 0.03))));
    const S = CHECK_STATS[stat].name;
    const call = (m) => (m.npc ? m.name : this.player.name);
    if (RNG.chance(acc) || members.length < 2) {
      if (best === self) return { member: best, apt: true, line: `"이건 내가 맡지. ${S}라면 여기서 내가 제일 낫다."` };
      return { member: best, apt: true, line: `"${call(best)}, 네가 해. ${S}라면 네가 제일이야."` };
    }
    // 엉뚱한 선택
    const others = ranked.filter((r) => r.m !== best).map((r) => r.m);
    let pick; let line;
    if ((L.personality === 'warlike' || L.personality === 'greedy') && self && self !== best) {
      pick = self; line = L.personality === 'warlike' ? '"내가 한다. 다들 뒤에서 구경이나 해."' : '"좋은 건 내가 먼저 봐야지. 내가 간다."';
    } else if (L.personality === 'kind') {
      pick = others[others.length - 1] || best; line = pick === self ? '"이번엔 내가 해 볼게. 나도 해 봐야 늘지."' : `"${call(pick)}, 이번엔 네가 해 볼래? 해 봐야 늘지."`;
    } else {
      pick = RNG.pick(others) || best; line = pick === self ? '"됐어, 내가 가 볼게."' : `"${call(pick)}, 네가 가 봐."`;
    }
    return { member: pick, apt: pick === best, line };
  },
  checkRoll(chance) { const d = RNG.int(1, 100); return { d, ok: d <= chance }; },
});

// ---------- 화면 ----------
Object.assign(UI, {
  ckAvatar(m, size) { return m.npc ? this.npcAvatar(m.npc, size) : this.playerAvatar(size); },
  ckTag(stat, chance, note) { return `<span class="ck-tag"><b>${CHECK_STATS[stat].name}</b> 판정 · ${note ? note + ' ' : ''}성공 <b class="num">${chance}%</b></span>`; },
  // 선택지에 보일 확률: 플레이어가 리더면 가장 잘하는 사람 기준, NPC 리더면 "리더가 정함"
  ckPreview(stat, base, tier) {
    const mem = G.checkMembers(); const L = G.checkLeader();
    const best = mem.map((m) => G.checkChance(m, stat, base, tier).chance).sort((a, b) => b - a)[0];
    if (mem.length < 2) return this.ckTag(stat, best);
    return this.ckTag(stat, best, L ? `맡을 사람은 리더 ${L.name} 지정 · 최대` : '최대');
  },
  // 판정 시작. spec = { title, eyebrow, stat, base, tier, run(ok, member) → 결과 문장, next() }
  ckBegin(spec) {
    this._ck = spec;
    const mem = G.checkMembers();
    if (mem.length < 2) return this.ckRoll(mem[0]);
    const L = G.checkLeader();
    const S = CHECK_STATS[spec.stat].name;
    if (!L) {
      const rows = mem.map((m) => { const c = G.checkChance(m, spec.stat, spec.base, spec.tier);
        return `<button class="ck-who" data-act="ck-who" data-v="${m.key}">${this.ckAvatar(m, 44)}<span class="grow"><b>${m.name}${m.npc ? '' : ' (나)'}</b><span class="small dim">${S} ${fmt(c.val)} · ${this.ckBreak(c)}</span></span><span class="ck-pct num">${c.chance}%</span></button>`; }).join('');
      return this.modal(`<div class="eyebrow">${spec.eyebrow || '탐색 판정'}</div><h3>${spec.title}</h3>
        <p class="small dim">당신이 파티 리더다. 누구에게 맡길지 정하라. <b>${S}</b> 판정 · 기본 ${Math.round(spec.base * 100)}%</p>
        <div class="cards ck-list">${rows}</div>
        <div class="row end"><button class="ghost" data-act="ck-cancel">그만둔다</button></div>`, 'event-box ck-box');
    }
    const pick = G.checkLeaderPick(L, mem, spec.stat, spec.base, spec.tier);
    const c = G.checkChance(pick.member, spec.stat, spec.base, spec.tier);
    spec.leaderLine = pick.line; spec.leader = L; spec.leadPick = pick.member.key;
    return this.modal(`<div class="eyebrow">${spec.eyebrow || '탐색 판정'}</div><h3>${spec.title}</h3>
      <div class="ck-lead">${this.npcAvatar(L, 48)}<div><span class="small dim">파티 리더 ${L.name}</span><p class="ck-say">${pick.line}</p></div></div>
      <div class="ck-who on">${this.ckAvatar(pick.member, 44)}<span class="grow"><span class="small dim">맡을 사람</span><b>${pick.member.name}${pick.member.npc ? '' : ' (나)'}</b><span class="small dim">${S} ${fmt(c.val)} · ${this.ckBreak(c)}</span></span><span class="ck-pct num">${c.chance}%</span></div>
      ${pick.apt ? '' : '<p class="small amber">더 잘할 사람이 있었지만, 리더의 결정이다.</p>'}
      <div class="row end"><button class="ghost" data-act="ck-cancel">그만두자</button><button data-act="ck-suggest">다른 사람 추천</button><button class="primary" data-act="ck-who" data-v="${pick.member.key}">따른다</button></div>`, 'event-box ck-box');
  },
  // 내 의견: 리더가 고른 사람 말고 다른 사람을 추천한다 (받아들일지는 리더 성격·관계·리더십)
  ckSuggest() {
    const spec = this._ck; const L = spec && spec.leader; if (!L) return;
    const S = CHECK_STATS[spec.stat].name;
    const rows = G.checkMembers().filter((m) => m.key !== spec.leadPick).map((m) => { const c = G.checkChance(m, spec.stat, spec.base, spec.tier);
      return `<button class="ck-who" data-act="ck-sugg-who" data-v="${m.key}">${this.ckAvatar(m, 44)}<span class="grow"><b>${m.name}${m.npc ? '' : ' (나)'}</b><span class="small dim">${S} ${fmt(c.val)} · ${this.ckBreak(c)}</span></span><span class="ck-pct num">${c.chance}%</span></button>`; }).join('');
    this.modal(`<div class="eyebrow">${spec.eyebrow || '탐색 판정'} · 내 의견</div><h3>${spec.title}</h3>
      <p class="small dim">누구를 추천할까. 정하는 것은 리더 ${L.name}이다.</p><div class="cards ck-list">${rows}</div>
      <div class="row end"><button class="ghost" data-act="ck-who" data-v="${spec.leadPick}">그냥 리더 뜻대로</button></div>`, 'event-box ck-box');
    if (this.exWrapScene) this.exWrapScene();
  },
  ckSuggestWho(key) {
    const spec = this._ck; const L = spec && spec.leader; if (!L) return;
    const mem = G.checkMembers(); const m = mem.find((x) => x.key === key); const lp = mem.find((x) => x.key === spec.leadPick) || mem[0];
    if (!m) return this.ckRoll(lp);
    const q = typeof npcLead === 'function' ? npcLead(L) : 60;
    const better = G.checkChance(m, spec.stat, spec.base, spec.tier).chance > G.checkChance(lp, spec.stat, spec.base, spec.tier).chance;
    const chance = 0.3 + (L.relation || 0) / 200 + (['kind', 'just'].includes(L.personality) ? 0.15 : L.personality === 'cold' ? -0.1 : L.personality === 'warlike' ? -0.15 : 0) + (better && q >= 50 ? 0.25 : 0);
    if (RNG.chance(Math.max(0.05, Math.min(0.9, chance)))) { this.toast(`${L.name}: "${better ? '…네 말이 맞다.' : '그래, 그렇게 해 보자.'} ${m.npc ? m.name : '네가'} 맡아."`); G.changeRel(L, 1, '의견을 들어줬다'); return this.ckRoll(m); }
    G.changeRel(L, -1, '결정에 토를 달았다');
    this.toast(`${L.name}: "${L.personality === 'cold' ? '내가 정한다.' : '아니, 이번엔 내 판단대로 간다.'}"`);
    return this.ckRoll(lp);
  },
  ckBreak(c) {
    const sg = (v) => (v > 0 ? `+${v}` : `${v}`);
    return `기본 ${c.base} · 능력 ${sg(c.statB)} · 등급 ${sg(c.rankB)}${c.luckB ? ` · 운 ${sg(c.luckB)}` : ''}`;
  },
  ckRoll(m) {
    const spec = this._ck; if (!spec) return;
    const c = G.checkChance(m, spec.stat, spec.base, spec.tier);
    const r = G.checkRoll(c.chance);
    const out = this.ckRun(spec, r.ok, m);
    this.ckResult({ spec, m, c, r, ...out });
  },
  // 판정 결과를 실제로 적용한다 (G._ck 로 explore.js·gate 사건에 전달)
  ckRun(spec, ok, m) {
    G._ck = ok; G._ckNpc = m && m.npc ? m.npc : null; G._ckOut = { gains: [], losses: [] };
    let text = '';
    try { text = spec.run(ok, m) || ''; } finally { G._ck = undefined; G._ckNpc = null; }
    const out = G._ckOut; G._ckOut = null;
    const parsed = this.ckParse(text);
    const res = { text: parsed.text, gains: [...out.gains, ...parsed.gains], losses: [...out.losses, ...parsed.losses] };
    if (spec.post) spec.post(res);
    return res;
  },
  // "문장 (크레딧 +60, 체력 손실)" 꼴의 결과에서 목록을 뽑는다
  ckParse(text) {
    const gains = [], losses = [];
    let t = String(text);
    t = t.replace(/\s*\(([^()]*)\)/g, (all, inner) => {
      if (!/[+\-]|개|회복|손실|부상|공적|명성|평판|유물|스킬|촉매/.test(inner)) return all;
      for (const part of inner.split(/,\s*/)) {
        if (!part) continue;
        if (/손실|부상|-\d|−/.test(part)) losses.push(part); else gains.push(part);
      }
      return '';
    });
    t = t.replace(/\s*전투 준비!/, '');
    return { text: t.trim(), gains, losses };
  },
  ckList(arr, cls, sign) { return arr.length ? `<ul class="ck-items ${cls}">${arr.map((x) => `<li><span class="ck-sign">${sign}</span>${x}</li>`).join('')}</ul>` : ''; },
  ckResult(o) {
    const { spec, m, c, r } = o;
    const S = c ? CHECK_STATS[spec.stat].name : '';
    const dice = r ? `<div class="ck-dice ${r.ok ? 'ok' : 'bad'}"><div class="ck-die num" id="ck-die">${FX.reduced ? r.d : '—'}</div><div class="ck-target small">d100 · <b>${c.chance}</b> 이하면 성공</div></div>
      <div class="ck-verdict ${r.ok ? 'ok' : 'bad'} ${FX.reduced ? 'show' : ''}" id="ck-verdict">${r.ok ? (r.d <= Math.max(5, Math.round(c.chance * 0.15)) ? '대성공' : '성공') : (r.d >= 96 ? '대실패' : '실패')}</div>` : '';
    const who = m ? `<div class="ck-who on">${this.ckAvatar(m, 52)}<span class="grow"><b>${m.name}${m.npc ? '' : ' (나)'}</b>${c ? `<span class="small dim">${S} ${fmt(c.val)} · ${this.ckBreak(c)}</span>` : ''}</span></div>` : '';
    const body = `<div class="ck-rest ${r && !FX.reduced ? 'wait' : ''}" id="ck-rest"><p class="event-text">${o.text}</p>
      ${this.ckList(o.gains, 'gain', '+')}${this.ckList(o.losses, 'loss', '−')}
      ${!o.gains.length && !o.losses.length ? '<p class="small dim">얻은 것도 잃은 것도 없다.</p>' : ''}
      <div class="row end"><button class="${o.losses.some((x) => /습격|전투/.test(x)) ? 'danger' : 'primary'}" data-act="ck-next">${o.nextLabel || '계속'}</button></div></div>`;
    this._ckNext = spec.next; this._ckAfter = o.after || null;
    this.modal(`<div class="eyebrow">${spec.eyebrow || '탐색 판정'} · 결과</div><h3>${spec.title}</h3>${who}${dice}${body}`, 'event-box ck-box ck-result');
    if (r && !FX.reduced) {
      const die = document.getElementById('ck-die'); let k = 0;
      const tick = setInterval(() => {
        if (!document.getElementById('ck-die')) return clearInterval(tick);
        k++; die.textContent = k < 14 ? RNG.int(1, 100) : r.d;
        if (k >= 14) {
          clearInterval(tick); die.classList.add('land');
          const v = document.getElementById('ck-verdict'); if (v) v.classList.add('show');
          const rest = document.getElementById('ck-rest'); if (rest) rest.classList.remove('wait');
          if (typeof SFX !== 'undefined' && SFX.play) try { SFX.play(r.ok ? 'fanfare' : 'down'); } catch (e) { /* 소리 없음 */ }
        }
      }, 60);
    }
  },

  // ---------- 게이트 층 사건 ----------
  ckGateMeta(ev, i) {
    const ch = ev.choices[i]; if (!ch) return null;
    const m = GATE_CHECKS[ev.id] && GATE_CHECKS[ev.id][i];
    if (m) return { stat: m[0], base: m[1] };
    const src = String(ch.do); const mm = src.match(/\.roll\(\s*([0-9.]+)\s*\)/);
    return mm ? { stat: 'luck', base: +mm[1] } : null;
  },
  ckGateTier() { const c = this.ctx; return c && c.gate ? GateRun.tier(c.gate) : G.player.rankIdx; },
  ckGateEventHtml(ev) {
    const c = this.ctx; const tier = this.ckGateTier();
    return `<div class="eyebrow">${c.run.floor + 1}층 · 사건</div><h3>${ev.title}</h3><p class="event-text">${ev.text}</p>
      <div class="cards">${ev.choices.map((ch, i) => { const mt = this.ckGateMeta(ev, i);
        return `<button class="choice-btn" data-act="ck-ev" data-v="${i}">${ch.text}${mt ? this.ckPreview(mt.stat, mt.base, tier) : '<span class="ck-tag safe">판정 없음</span>'}</button>`; }).join('')}</div>`;
  },
  ckGateChoice(i) {
    const c = this.ctx; const ev = c.run.ev; const ch = ev && ev.choices[i]; if (!ch) return;
    const mt = this.ckGateMeta(ev, i);
    const spec = {
      title: ev.title, eyebrow: `${c.run.floor + 1}층 · ${ch.text}`, stat: mt ? mt.stat : 'luck', base: mt ? mt.base : 1, tier: this.ckGateTier(),
      run: (ok, m) => {
        const origRoll = G.roll; const origGain = G.gain; let used = false;
        G.roll = function (p) { if (!used && ok != null) { used = true; return ok; } return origRoll.call(this, p); };
        // NPC가 맡다 다친 것은 그 사람의 부상으로 적는다
        if (m && m.npc) G.gain = function (o, cx) { if (o && o.hp < 0) { o = { ...o }; G._ckOut.losses.push(`${m.npc.name} 부상 (체력 ${Math.round(o.hp * 100)}%)`); delete o.hp; } return origGain.call(this, o, cx); };
        c.run.ambush = 0;
        try { return ch.do(G, c); } finally { G.roll = origRoll; G.gain = origGain; this.gateStub(); }
      },
      post: (res) => { if (c.run.ambush) { res.losses.push(`괴수 ${c.run.ambush > 1 ? '무리' : ''}의 습격 · 전투로 이어진다`); res.nextLabel = '맞서 싸운다'; } },
      next: () => {
        const n = c.run.ambush; c.run.ambush = 0;
        if (n) return this.gateFight('ambush' + n);
        return this.renderGateMap();
      },
      cancel: () => this.modal(this.ckGateEventHtml(ev), 'event-box'),
    };
    this._ck = spec;
    if (!mt) { const out = this.ckRun(spec, undefined, null); return this.ckResult({ spec, ...out }); }
    return this.ckBegin(spec);
  },

  // ---------- 지도 탐사 지점 ----------
  ckSiteMeta(s, ch) { const m = SITE_CHECKS[s.kind] && SITE_CHECKS[s.kind][ch]; return m ? { stat: m[0], base: m[1] } : null; },
  ckSiteTier(s) { return s.north ? 6 : G.player.rankIdx; },
  ckSite(id, ch) {
    const s = G.siteById(id); if (!s) return;
    const mt = this.ckSiteMeta(s, ch); const K = SITE_KINDS[s.kind];
    const spec = {
      title: K.name, eyebrow: `탐사 지점 · ${regionById(s.region).name}`, stat: mt ? mt.stat : 'luck', base: mt ? mt.base : 1, tier: this.ckSiteTier(s),
      run: () => G.siteAct(id, ch),
      post: (res) => { if (G.queue.some((q) => q.type === 'mobAmbush')) res.nextLabel = '맞서 싸울 준비'; },
      next: () => { this.closeModal(); this.after(); },
      cancel: () => this.showSite(id),
    };
    if (!mt) { this._ck = spec; const out = this.ckRun(spec, undefined, null); return this.ckResult({ spec, ...out }); }
    return this.ckBegin(spec);
  },
  ckScav() {
    const spec = { title: '무너진 상가', eyebrow: '폐허', stat: 'luck', base: 0.6, tier: G.player.rankIdx, run: () => G.ruinScavenge(true), next: () => { this.closeModal(); this.after(); } };
    return this.ckBegin(spec);
  },
});

{
  // 게이트 층 사건 화면을 판정 선택지로
  const baseEv = UI.gateEvent;
  UI.gateEvent = function () {
    const r = baseEv.call(this);
    const c = this.ctx; if (c && c.run && c.run.ev) this.modal(this.ckGateEventHtml(c.run.ev), 'event-box');
    return r;
  };
  // 지도 지점 화면: 판정이 있는 선택지를 판정 버튼으로 바꾸고 확률을 붙인다
  const SITE_FLOW = ['ruin', 'spring', 'outpost', 'village', 'remains', 'altar', 'tower', 'oldcity', 'truth'];
  const baseShow = UI.showSite;
  UI.showSite = function (id) {
    const r = baseShow.call(this, id);
    const s = G.siteById(id); if (!s || !SITE_FLOW.includes(s.kind)) return r;
    document.querySelectorAll('#modal-box [data-act="site"]').forEach((b) => {
      const [, ch] = String(b.dataset.v).split('|');
      if (ch === 'pass') return;
      const mt = this.ckSiteMeta(s, ch);
      b.dataset.act = 'ck-site';
      b.insertAdjacentHTML('beforeend', mt ? this.ckPreview(mt.stat, mt.base, this.ckSiteTier(s)) : '<span class="ck-tag safe">판정 없음</span>');
    });
    return r;
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    const r = baseQueue.apply(this, arguments);
    const b = document.querySelector('#modal-box [data-act="ruin-scav"][data-v="1"]');
    if (b) { b.dataset.act = 'ck-scav'; b.insertAdjacentHTML('beforeend', this.ckPreview('luck', 0.6, G.player.rankIdx)); }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'ck-ev': return this.ckGateChoice(+v);
      case 'ck-site': { const [id, ch] = String(v).split('|'); return this.ckSite(+id, ch); }
      case 'ck-scav': return this.ckScav();
      case 'ck-suggest': return this.ckSuggest();
      case 'ck-sugg-who': return this.ckSuggestWho(v);
      case 'ck-who': { const m = G.checkMembers().find((x) => x.key === v); if (m) return this.ckRoll(m); return; }
      case 'ck-cancel': {
        const spec = this._ck; this._ck = null;
        if (spec && spec.cancel) return spec.cancel();
        this.closeModal(); return this.after();
      }
      case 'ck-next': {
        const next = this._ckNext; this._ckNext = null; this._ck = null;
        this.closeModal();
        return next ? next() : this.after();
      }
      default: return baseHandle.call(this, act, v);
    }
  };
}
