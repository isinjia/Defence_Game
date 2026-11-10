// ===== 소속 팀 정보: 리더·전력·팀 명성 (영역 E) =====
// 어느 리더의 팀인지, 팀이 대략 얼마나 강한지, 팀이 얼마나 알려졌는지를 내 정보·인물 카드·파티 탭에 보인다.
// 수치: docs/E_수치.md "팀 정보"
const TEAM = {
  fameClear: 2, fameHunt: 1, fameEscort: 1, fameLose: -1, // 팀 명성 증감
  fameTiers: [[0, '무명 팀'], [10, '동네에서 아는 팀'], [30, '지역에서 알아주는 팀'], [70, '전국구 팀'], [150, '전설적인 팀']],
  escortPerFame: 0.004, escortMax: 0.2, // 팀 명성 1당 의뢰 보수 +0.4%, 최대 +20%
};
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const pow = (u) => Math.max(1, u.atk * 1.2 + u.def + u.maxHp / 8);
  Object.assign(GP, {
    // 팀 전력: 구성원 전투력 합과 평균 등급. 대략적인 등급 표기만 보여 준다.
    teamPower(npcs, withPlayer = true) {
      let sum = 0, rank = 0, n = 0;
      const add = (u, r) => { sum += pow(u); rank += r; n++; };
      try { if (withPlayer) add(this.playerUnit(), this.player.rankIdx + (this.player.stage || 0) / 3); } catch (e) { /* 전투 중 등 */ }
      for (const x of npcs) { if (!x || !x.alive) continue; try { add(this.npcUnit(x, 'ally'), x.rankIdx + (x.stage || 0) / 3); } catch (e) { /* 건너뜀 */ } }
      if (!n) return null;
      const avg = rank / n; const ri = Math.max(0, Math.min(RANKS.length - 1, Math.floor(avg + 0.001))); const f = avg - ri;
      return { sum: Math.round(sum), n, rankIdx: ri, label: `${RANKS[ri].key}급 ${f < 0.34 ? '하위' : f < 0.67 ? '중위' : '상위'}`, approx: Math.round(sum / 10 ** Math.max(0, String(Math.round(sum)).length - 2)) * 10 ** Math.max(0, String(Math.round(sum)).length - 2) };
    },
    teamFameLabel(v) { let t = TEAM.fameTiers[0][1]; for (const [min, name] of TEAM.fameTiers) if (v >= min) t = name; return t; },
    teamFameInit(leader, members) { return Math.round((leader ? leader.rankIdx * 4 : 0) + (members || []).reduce((s, m) => s + (m ? m.rankIdx : 0), 0)); },
    addTeamFame(d) { const c = this.crew(); if (!c) return; c.fame = Math.max(0, (c.fame || 0) + d); },
    // 내가 속한 팀(남이 리더) 또는 내가 이끄는 파티의 정보
    myTeam() {
      const p = this.player; const c = this.crew(); const mates = this.party();
      if (c) {
        const L = this.crewLeader();
        c.fame ??= this.teamFameInit(L, mates.filter((n) => n !== L));
        return { name: c.name, leader: L, mine: false, fame: c.fame, power: this.teamPower(mates), share: this.freeShare ? this.freeShare() : null, size: mates.length + 1 };
      }
      if (mates.length) return { name: `${p.name} 파티`, leader: null, mine: true, fame: p.fame || 0, power: this.teamPower(mates), share: null, size: mates.length + 1 };
      return null;
    },
    // NPC가 속한 팀: 내 팀이거나 모집 게시판에 올라온 팀
    npcTeam(n) {
      const c = this.crew();
      if (c && n.crewOf === c.id) return { name: c.name, lead: n.id === c.leader, fame: c.fame || 0, mine: true };
      if (!c && this.player.party && this.player.party.includes(n.id)) return { name: `${this.player.name} 파티`, lead: false, fame: this.player.fame || 0, mine: true };
      for (const b of Object.values((this.world && this.world.crewBoards) || {})) for (const L of b.list || []) {
        if (L.leader === n.id || (L.members || []).includes(n.id)) {
          L.fame ??= this.teamFameInit(this.npcById(L.leader), (L.members || []).map((id) => this.npcById(id)));
          return { name: L.name, lead: L.leader === n.id, fame: L.fame, listing: L };
        }
      }
      return null;
    },
    teamLine() {
      const t = this.myTeam(); if (!t) return '';
      const L = t.leader; const pw = t.power;
      const who = t.mine ? '<b>내가 리더</b>' : `리더 <b>${L ? `${L.name}(${RANKS[L.rankIdx].key}급)` : '공석'}</b>`;
      const cut = this.leaderCut ? Math.round(this.leaderCut() * 100) : 0;
      const pay = t.mine ? (cut ? ` · 리더 몫 ${cut}%` : '') : (t.share != null ? ` · 내 배당 ${Math.round(t.share * 100)}%` : '');
      return `소속 팀 <b>${t.name}</b> · ${who} · ${t.size}인${pw ? ` · 전력 <b>${pw.label}</b>(약 ${fmt(pw.approx)})` : ''} · ${t.mine ? '내 명성' : '팀 명성'} <b>${t.fame}</b>(${t.mine ? '리더 명성이 곧 팀 명성' : this.teamFameLabel(t.fame)})${pay}`;
    },
  });
  // 팀에 들 때 모집 글의 명성을 이어받는다
  wrap('crewJoin', function (base, L, ...rest) {
    const r = base.call(this, L, ...rest); const c = this.crew();
    if (c && L && c.id === L.id) c.fame ??= L.fame != null ? L.fame : this.teamFameInit(this.crewLeader(), this.party().filter((n) => n.id !== c.leader));
    return r;
  });
  // 팀 토벌 성공 → 팀 명성
  wrap('finishMob', function (base, mob, result, ...rest) {
    const ctx = typeof UI !== 'undefined' ? UI.ctx : null; const team = ctx && ctx.kind === 'mob' && ctx.crewRaid;
    const lines = base.call(this, mob, result, ...rest);
    if (team && this.crew()) this.addTeamFame(result === 'win' ? TEAM.fameHunt : result === 'lose' ? TEAM.fameLose : 0);
    return lines;
  });
  // 알려진 팀일수록 의뢰 보수가 좋다 / 호위 성공 → 팀 명성
  wrap('crewMakePlan', function (base, ...a) {
    const plan = base.call(this, ...a); const c = this.crew();
    if (plan && plan.kind === 'escort' && c && c.fame) plan.pay = Math.round(plan.pay * (1 + Math.min(TEAM.escortMax, c.fame * TEAM.escortPerFame)));
    return plan;
  });
  wrap('storyFight', function (base, spec) {
    const c = this.crew();
    if (c && spec && spec.win && typeof spec.title === 'string' && spec.title.startsWith(`${c.name} · `)) {
      const after = spec.win.after; spec.win.after = (g) => { if (after) after(g); g.addTeamFame(TEAM.fameEscort); };
    }
    return base.call(this, spec);
  });

  if (typeof UI !== 'undefined') {
    const baseFinishGate = UI.finishGate;
    UI.finishGate = function (result) {
      const c = this.ctx; const raid = !!(c && c.crewRaid);
      const r = baseFinishGate.call(this, result);
      if (raid && G.crew()) { G.addTeamFame(result === 'clear' ? TEAM.fameClear : result === 'lose' ? TEAM.fameLose : 0); G.save(); }
      return r;
    };
    // 내 정보
    const baseChar = UI.charHtml;
    UI.charHtml = function () {
      const html = baseChar.call(this); const line = G.teamLine(); if (!line) return html;
      return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `<div class="small team-line">${line}</div><div class="sec"><div class="sec-title">선천 특성</div>`);
    };
    // 파티 탭의 소속 파티 패널
    const baseCrewHtml = UI.crewHtml;
    if (baseCrewHtml) UI.crewHtml = function () {
      const html = baseCrewHtml.call(this); const t = G.crew() && G.myTeam(); if (!t) return html;
      const pw = t.power;
      const row = `<p class="small">팀 전력 <b>${pw ? pw.label : '-'}</b>${pw ? ` <span class="dim">(${t.size}인 합산 약 ${fmt(pw.approx)})</span>` : ''} · 팀 명성 <b>${t.fame}</b> <span class="dim">${G.teamFameLabel(t.fame)} · 의뢰 보수 +${Math.round(Math.min(TEAM.escortMax, t.fame * TEAM.escortPerFame) * 100)}%</span></p>`;
      return html.replace('<div class="row small"><span class="dim">신뢰</span>', row + '<div class="row small"><span class="dim">신뢰</span>');
    };
    // 인물 카드
    const baseCard = UI.npcCard;
    if (baseCard) UI.npcCard = function (n, here) {
      const html = baseCard.call(this, n, here); const t = n && n.alive && !n.child ? G.npcTeam(n) : null; if (!t) return html;
      const line = `<div class="small dim team-line">${t.name} ${t.lead ? '<span class="tag amber">리더</span>' : '파티원'}${t.mine && !G.crew() ? '' : ` · 팀 명성 ${t.fame}(${G.teamFameLabel(t.fame)})`}</div>`;
      return html.replace('<div class="rel-line">', line + '<div class="rel-line">');
    };
  }
}
