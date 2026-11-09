// ===== 게이트 크로니클: 탐색 선택 팀 상의 (O/X 의견) =====
// docs/구현_대기목록.md 4-3. 게이트 층 지도에서 칸을 누르면 바로 들어가지 않는다. 제안 → 팀원 의견 → 리더 결정.
// - 팀원마다 O/X, 할 말이 있으면 한마디. 의견은 성격·체력·관계·직업·칸 종류로 정한다.
// - 리더가 플레이어면: 전원 O면 진행, X가 있으면 강행 또는 상의(다른 칸·설득·따르기).
// - 리더가 NPC(파티 리더)면: 리더가 고른 칸이 제안으로 뜨고, 플레이어도 O/X를 낸다. 리더는 성격대로 강행/상의.
// - 관계: 의견이 받아들여지면 +, 무시당하면 −(성격별). 강행 뒤 결과가 나쁘면 추가 −, 좋으면 일부 회복.
//   계속 무시당한 팀원은 불만이 쌓여 파티를 떠나겠다고 할 수 있다.
// - 전원 O가 확실한 칸은 의견만 잠깐 보여 주고 자동 진행("매번 묻기"로 끌 수 있다).
// - 시험 게이트 튜토리얼: 처음 고르는 칸에서 한 번, 상의 과정을 보여 준다.
// gate_run.js(영역 A)는 고치지 않고 UI.enterNode 를 감싼다.

const COUNCIL_LINES = {
  fightX: ['"지금 싸우면 버거워. 한숨 돌리고 가자."', '"체력이 바닥이야. 다른 길 없어?"', '"한 번만 더 싸우면 누구 하나 쓰러져."'],
  eliteX: ['"정예는 무리야. 회복부터 하자."', '"저건 지금 우리 급이 아니야."'],
  eliteO: ['"정예다. 이런 데서 커야지!"', '"보상 크잖아. 가자."'],
  restX: ['"아직 멀쩡한데 쉬긴 이르지."'],
  restO: ['"샘이다. 좀 쉬자, 제발."'],
  treasureO: ['"보물이다!"', '"저거 챙기고 가자."'],
  eventX: ['"수상한데. 괜히 건드리지 말자."'],
  bossX: ['"보스 앞인데 이 상태로 들어가?"'],
  bossO: ['"끝내자. 할 수 있어."'],
  distrust: ['"…또 마음대로 정할 거잖아."'],
};
const COUNCIL_HURT = { kind: 2, warlike: 2, greedy: 3, just: 4, cold: 3 };

Object.assign(Game.prototype, {
  // 팀원 n이 칸 종류 t에 대해 내는 의견
  councilOpinion(n, t, hpR, leaderRel) {
    const pers = n.personality; const grp = classById(n.cls || 'swordsman').g;
    let s = 0.4 + RNG.range(-0.25, 0.25);
    const fighty = t === 'fight' || t === 'elite' || t === 'boss';
    if (fighty) s += hpR < 0.35 ? -0.8 : hpR < 0.6 ? -0.25 : 0.15;
    if (t === 'elite') s += pers === 'warlike' ? 0.5 : pers === 'kind' ? -0.3 : pers === 'greedy' ? 0.2 : 0;
    if (t === 'fight' && (grp === 'guard' || grp === 'fighter')) s += 0.2;
    if (t === 'rest') s += hpR < 0.6 ? 0.6 : pers === 'warlike' ? -0.6 : -0.1;
    if (t === 'rest' && grp === 'support' && hpR < 0.7) s += 0.4;
    if (t === 'treasure') s += pers === 'greedy' ? 0.6 : 0.3;
    if (t === 'event') s += pers === 'cold' ? -0.3 : pers === 'just' ? 0.1 : 0;
    if (t === 'boss') s += hpR > 0.6 ? 0.3 : -0.2;
    if (leaderRel != null && leaderRel < 0) s -= 0.3;
    if ((n.grumble || 0) >= 2) s -= 0.15;
    const vote = s >= 0 ? 'O' : 'X';
    let key = null;
    if (vote === 'X') key = (n.grumble || 0) >= 3 ? 'distrust' : t === 'elite' ? 'eliteX' : t === 'rest' ? 'restX' : t === 'boss' ? 'bossX' : t === 'event' ? 'eventX' : 'fightX';
    else if (s > 0.85) key = t === 'elite' ? 'eliteO' : t === 'rest' ? 'restO' : t === 'treasure' ? 'treasureO' : t === 'boss' ? 'bossO' : null;
    const lines = key && COUNCIL_LINES[key];
    return { vote, s, line: lines ? RNG.pick(lines) : null };
  },
});

Object.assign(UI, {
  councilMembers() { return G.party().filter((n) => n && n.alive); },
  councilLeader() { const L = G.crewLeader ? G.crewLeader() : null; return L && this.councilMembers().includes(L) ? L : null; },
  councilHp() { const p = G.player; return p.maxHp ? p.hp / p.maxHp : 1; },
  nodeOf(key) { const m = this.ctx.run.map; const [r, i] = key.split(':').map(Number); return m.rows[r][i]; },
  // NPC 리더가 고르는 칸: 자기 의견 점수가 가장 높은 곳
  councilLeaderPick(L) {
    const hp = this.councilHp(); let best = null, bs = -9;
    for (const [r, i] of this.reachable()) { const k = r + ':' + i; const o = G.councilOpinion(L, this.nodeOf(k).t, hp, null); if (o.s > bs) { bs = o.s; best = k; } }
    return best;
  },
  councilStart(key, clicked) {
    const c = this.ctx; const L = this.councilLeader(); const hp = this.councilHp();
    const t = this.nodeOf(key).t;
    const votes = this.councilMembers().filter((n) => n !== L).map((n) => ({ id: n.id, ...G.councilOpinion(n, t, hp, L ? L.relation : null) }));
    const used = new Set(); for (const v of votes) { if (v.line && used.has(v.line)) v.line = null; else if (v.line) used.add(v.line); }
    c.council = { key, clicked, leader: L ? L.id : null, votes, mine: null, stage: 'vote' };
    const allO = votes.every((v) => v.vote === 'O') && !votes.some((v) => v.line);
    if (!L && allO && !G.player.councilAsk) { this.toast(`팀원 전원 O · ${GNODE[t].name}`); return this.councilGo(false); }
    this.renderCouncil();
  },
  councilPanel(inner) {
    const box = document.getElementById('modal-box'); if (!box) return;
    let ov = document.getElementById('council-ov');
    if (!ov) { box.insertAdjacentHTML('beforeend', '<div id="council-ov" class="council-ov"></div>'); ov = document.getElementById('council-ov'); }
    ov.innerHTML = fixJosa(inner);
  },
  councilVotesHtml(cn) {
    return cn.votes.map((v) => { const n = G.npcById(v.id); if (!n) return ''; return `<div class="cn-mem">${this.npcAvatar(n, 34)}<span class="cn-badge ${v.vote === 'O' ? 'o' : 'x'}">${v.vote}</span><div class="cn-say"><b>${n.name}</b>${v.line ? `<span>${v.line}</span>` : ''}</div></div>`; }).join('');
  },
  renderCouncil() {
    const cn = this.ctx.council; const nd = this.nodeOf(cn.key); const N = GNODE[nd.t];
    const L = cn.leader != null ? G.npcById(cn.leader) : null;
    const xs = cn.votes.filter((v) => v.vote === 'X');
    let foot;
    if (cn.stage === 'consult') {
      const alts = this.reachable().map(([r, i]) => r + ':' + i).filter((k) => k !== cn.key);
      foot = `<p class="small dim">반대한 팀원들의 이야기를 들었다. 어떻게 할까?</p><div class="cn-btns">
        ${alts.map((k) => `<button class="sm" data-act="cn-alt" data-v="${k}">${GNODE[this.nodeOf(k).t].name}(으)로 바꾼다</button>`).join('')}
        <button class="sm" data-act="cn-persuade">설득한다</button><button class="sm ghost" data-act="cn-back">지도로 돌아가 다시 고른다</button></div>`;
    } else if (!L) {
      foot = xs.length ? `<div class="cn-btns"><button class="danger" data-act="cn-force">그냥 진행</button><button class="primary" data-act="cn-consult">상의하기</button></div><p class="small dim">강행하면 반대한 팀원과의 관계가 떨어진다. 결과가 좋으면 일부 회복된다.</p>`
        : `<div class="cn-btns"><button class="primary" data-act="cn-go">진행</button><button class="sm ghost" data-act="cn-back">다시 고른다</button></div>`;
    } else {
      foot = `<p class="small">${L.name}(리더)이(가) 이 길을 골랐다.${cn.clicked && cn.clicked !== cn.key ? ` 당신이 가리킨 곳은 ${GNODE[this.nodeOf(cn.clicked).t].name} 칸이었다.` : ''} 당신의 의견은?</p>
        <div class="cn-btns"><button class="primary" data-act="cn-vote" data-v="O">O 찬성</button><button class="danger" data-act="cn-vote" data-v="X">X 반대</button><button class="sm ghost" data-act="cn-vote" data-v="X!">X · "${cn.clicked && cn.clicked !== cn.key ? '저쪽이 낫지 않아?' : '좀 더 생각해 보자'}"</button></div>`;
    }
    this.councilPanel(`<div class="cn-card"><div class="row between"><b>팀 상의 · <span style="color:${N.color}">${N.name}</span></b><label class="small dim"><input type="checkbox" data-act="cn-ask" ${G.player.councilAsk ? 'checked' : ''}> 매번 묻기</label></div>
      ${L ? `<div class="small dim">제안: ${L.name}(리더)</div>` : '<div class="small dim">제안: 나(리더)</div>'}
      <div class="cn-mems">${this.councilVotesHtml(cn) || '<div class="small dim">의견을 낼 팀원이 없다.</div>'}</div>${foot}</div>`);
  },
  // 결정 실행
  councilGo(forced) {
    const c = this.ctx; const cn = c.council;
    const key = cn ? cn.key : null;
    if (cn) { c.councilAfter = { forced, xs: cn.votes.filter((v) => v.vote === 'X').map((v) => v.id), hp: this.councilHp(), leader: cn.leader }; c.council = null; }
    const ov = document.getElementById('council-ov'); if (ov) ov.remove();
    this.councilPass = true;
    try { return this.enterNode(key); } finally { this.councilPass = false; }
  },
  councilForce() {
    const cn = this.ctx.council; const L = cn.leader != null ? G.npcById(cn.leader) : null;
    for (const v of cn.votes.filter((x) => x.vote === 'X')) {
      const n = G.npcById(v.id); if (!n) continue;
      if (!L) { G.changeRel(n, -(COUNCIL_HURT[n.personality] || 3), '반대를 무시하고 강행했다'); n.grumble = (n.grumble || 0) + 1; }
    }
    return this.councilGo(true);
  },
  councilAltPick(k) {
    const cn = this.ctx.council;
    for (const v of cn.votes.filter((x) => x.vote === 'X')) { const n = G.npcById(v.id); if (n) { G.changeRel(n, 3, '내 말을 들어 주었다'); n.grumble = Math.max(0, (n.grumble || 0) - 1); } }
    cn.key = k; cn.votes = cn.votes.map((v) => ({ ...v, vote: 'O', line: null }));
    this.toast('반대하던 팀원들이 고개를 끄덕였다.');
    return this.councilGo(false);
  },
  councilPersuade() {
    const cn = this.ctx.council; const p = G.player;
    const xs = cn.votes.filter((x) => x.vote === 'X');
    let ok = 0;
    for (const v of xs) {
      const n = G.npcById(v.id); if (!n) continue;
      const chance = 0.35 + n.relation / 200 + ((p.traits || []).includes('charisma') ? 0.15 : 0) + (p.fame || 0) / 2000;
      if (RNG.chance(Math.max(0.1, Math.min(0.9, chance)))) { v.vote = 'O'; v.line = '"…알았어. 네 판단 믿어 볼게."'; G.changeRel(n, 1, '설득에 넘어갔다'); ok++; }
      else { v.line = '"그래도 난 반대야."'; G.changeRel(n, -1, '설득하려 들었다'); }
    }
    cn.stage = 'vote';
    this.renderCouncil();
    this.toast(ok === xs.length ? '모두 설득했다.' : ok ? '일부만 설득했다.' : '아무도 설득하지 못했다.');
  },
  // NPC 리더의 결정 (플레이어 의견 포함)
  councilNpcDecide(myVote) {
    const c = this.ctx; const cn = c.council; const L = G.npcById(cn.leader);
    cn.mine = myVote;
    const anyX = myVote !== 'O' || cn.votes.some((v) => v.vote === 'X');
    if (!anyX) return this.councilGo(false);
    const forceP = { cold: 0.75, warlike: 0.7, greedy: 0.5, just: 0.3, kind: 0.2 }[L.personality] ?? 0.5;
    if (RNG.chance(forceP)) {
      if (myVote !== 'O') { G.changeRel(L, -1, '리더 결정에 반대했다'); G.player.ignoredBy = (G.player.ignoredBy || 0) + 1; }
      this.toast(`${L.name}: "내가 책임진다. 간다."`);
      return this.councilGo(true);
    }
    // 상의: 플레이어가 가리킨 칸이나 X 팀원이 가장 덜 싫어하는 칸으로
    let alt = myVote === 'X!' && cn.clicked && cn.clicked !== cn.key ? cn.clicked : null;
    if (!alt) { const hp = this.councilHp(); const others = this.reachable().map(([r, i]) => r + ':' + i).filter((k) => k !== cn.key); alt = others.sort((a, b) => G.councilOpinion(L, this.nodeOf(b).t, hp, null).s - G.councilOpinion(L, this.nodeOf(a).t, hp, null).s)[0]; }
    if (myVote !== 'O') G.changeRel(L, 3, '내 의견을 받아 주었다');
    this.toast(`${L.name}: "…그래, 네 말도 일리가 있어."${alt ? '' : ' 그래도 다른 길이 없다.'}`);
    if (alt) cn.key = alt;
    return this.councilGo(false);
  },
  // 강행 결과 뒤처리 (지도로 돌아올 때)
  councilResolve() {
    const c = this.ctx; const a = c && c.councilAfter; if (!a) return;
    c.councilAfter = null;
    if (!a.forced || !a.xs.length) return;
    const now = this.councilHp(); const bad = now < 0.25 || a.hp - now > 0.4;
    for (const id of a.xs) {
      const n = G.npcById(id); if (!n) continue;
      if (bad) { G.changeRel(n, -3, '강행한 길에서 크게 다쳤다'); n.grumble = (n.grumble || 0) + 1; }
      else if (!a.leader) G.changeRel(n, 2, '강행했지만 결과는 괜찮았다');
    }
    if (bad) this.toast('반대했던 팀원들의 눈빛이 차갑다. "그러게 내가 뭐랬어."');
  },
});

// 불만이 쌓인 팀원
S({ id: 'council_quit', trigger: 'system', npc: 'here', text: '{npc}이(가) 짐을 챙기며 말한다. "게이트 안에서 내 말은 한 번도 안 듣더라. 나 이 파티 계속 있어야 하나 모르겠어."',
  choices: [
    { text: '진심으로 사과하고 다음엔 꼭 듣겠다고 한다', do: (g, c) => { if (c.npc) { c.npc.grumble = 0; g.changeRel(c.npc, 6, '사과를 받아 주었다'); } return '{npc}이(가) 한숨을 쉬고 짐을 내려놓았다. "…이번 한 번만이다."'; } },
    { text: '"싫으면 떠나도 돼."', do: (g, c) => { if (c.npc && g.dismiss) g.dismiss(c.npc.id); if (c.npc) { c.npc.grumble = 0; g.changeRel(c.npc, -10, '파티에서 떠났다'); } return '{npc}은(는) 뒤도 돌아보지 않았다.'; } },
  ] });

(() => {
  const baseEnter = UI.enterNode;
  UI.enterNode = function (key) {
    const c = this.ctx;
    if (this.councilPass || !c || !c.run || !this.councilMembers().length) return baseEnter.call(this, key);
    if (!this.reachable().some(([r, i]) => r + ':' + i === key)) return;
    const L = this.councilLeader();
    return this.councilStart(L ? (this.councilLeaderPick(L) || key) : key, key);
  };
  const baseMap = UI.renderGateMap;
  UI.renderGateMap = function (note) { this.councilResolve(); return baseMap.call(this, note); };
  const baseMonthly = Game.prototype.storyMonthly;
  Game.prototype.storyMonthly = function () {
    baseMonthly.call(this);
    const n = this.party().find((x) => (x.grumble || 0) >= 4);
    if (n && RNG.chance(0.35) && !this.queue.some((q) => q.id === 'council_quit')) this.queue.push({ type: 'story', id: 'council_quit', npc: n.id });
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    switch (act) {
      case 'cn-go': return this.councilGo(false);
      case 'cn-force': return this.councilForce();
      case 'cn-consult': c.council.stage = 'consult'; return this.renderCouncil();
      case 'cn-alt': return this.councilAltPick(v);
      case 'cn-persuade': return this.councilPersuade();
      case 'cn-back': { c.council = null; const ov = document.getElementById('council-ov'); if (ov) ov.remove(); return; }
      case 'cn-vote': return this.councilNpcDecide(v);
      case 'cn-ask': G.player.councilAsk = !G.player.councilAsk; return;
      case 'cn-tut': return this.councilTutNext(v);
    }
    return baseHandle.call(this, act, v);
  };
})();

// ---------- 시험 게이트 튜토리얼: 처음 고르는 칸에서 한 번 ----------
Object.assign(UI, {
  councilTutStart(k) {
    const ex = this.exam; const mates = (ex.ids || []).map((id) => G.npcById(id)).filter(Boolean);
    const [r, i] = k.split(':').map(Number); const nd = ex.map.rows[r][i];
    const votes = mates.map((n, j) => ({ id: n.id, vote: j === mates.length - 1 ? 'X' : 'O', line: j === mates.length - 1 ? '"저기 괴수 많은 것 같은데… 괜찮을까?"' : j === 0 ? '"좋아, 가자."' : null }));
    this.councilTut = { k, votes, nd };
    const L = this.examLeader();
    this.councilPanel(`<div class="cn-card"><b>팀 상의 · <span style="color:${GNODE[nd.t].color}">${GNODE[nd.t].name}</span></b>
      <div class="coach lead-say"><span class="eyebrow">${this.examMapLeadName ? this.examMapLeadName() : '리더'}</span><div>${L && L.personality === 'cold' ? '가기 전에 다들 의견. 반대 있으면 지금 말해.' : '가기 전에 다들 의견을 들어 보자. 반대하는 사람이 있으면 지금 말해.'}</div></div>
      <div class="cn-mems">${this.councilVotesHtml({ votes })}</div>
      <p class="small dim">길을 정하기 전에 팀원들이 O·X로 의견을 낸다. X가 있으면 리더는 그냥 진행(강행)하거나 상의할 수 있다. 어느 쪽을 고르느냐에 따라 팀원과의 관계가 변한다. 이 시험에서는 당신이 길을 고르니, 당신이 정해 보자.</p>
      <div class="cn-btns"><button class="danger" data-act="cn-tut" data-v="force">그냥 진행</button><button class="primary" data-act="cn-tut" data-v="talk">상의하기</button></div></div>`);
  },
  councilTutNext(v) {
    const t = this.councilTut; if (!t) return;
    const x = G.npcById(t.votes[t.votes.length - 1].id);
    if (v === 'force') { if (x) G.changeRel(x, -2, '반대를 무시하고 강행했다'); this.toast(x ? `${x.name}이(가) 입술을 깨물었다. (관계 -2)` : '강행했다.'); }
    else { if (x) G.changeRel(x, 3, '내 말을 들어 주었다'); this.toast(x ? fixJosa(`${x.name}: "들어 줘서 고마워. …그래도 같이 가 볼게." (관계 +3)`) : '상의했다.'); }
    this.councilTut = null; G.player.councilTut = true;
    const ov = document.getElementById('council-ov'); if (ov) ov.remove();
    const [r, i] = t.k.split(':').map(Number);
    return this.examMove([r, i]);
  },
});
(() => {
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'exm-node' && this.exam && this.exam.map && !G.player.councilTut && (this.exam.ids || []).length) {
      const [r, i] = v.split(':').map(Number);
      if (!this.examReach().some(([a, b]) => a === r && b === i)) return;
      return this.councilTutStart(v);
    }
    return baseHandle.call(this, act, v);
  };
})();
