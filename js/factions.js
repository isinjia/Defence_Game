// ===== 게이트 크로니클: 세력 행위자 (영역 C) =====
// docs/NPC_사회_제안.md 층 2. 길드 다섯·균열교·암시장·재벌가·해외 세력이 지도자·자금·관계·의제를 갖고
// 매달 의제에 맞는 수를 둔다(영입·스캔들·동맹과 결별·승진과 숙청·비상 체계·포섭·밀수·지분·빼내기).
// 소속 NPC의 처지(돈·길드)가 세력의 결정에 따라 바뀐다. 음모(층 3)는 conspiracy가 이어받는다.

const FACTIONS_EXTRA = {
  cult:    { name: '균열교', color: '#a35cff', kind: 'cult', desc: '게이트를 구원이라 믿는 집단. 비각성자 신도가 많다.' },
  black:   { name: '부산 암시장', color: '#8a7a5a', kind: 'black', desc: '불법 각성제와 유물이 오가는 곳. 관리국 안에도 손이 닿는다.' },
  chaebol: { name: '백호 가문', color: '#d0d6e0', kind: 'chaebol', desc: '백호 시큐리티를 소유한 재벌가. 후계 다툼이 끊이지 않는다.' },
  foreign: { name: '해외 길드', color: '#5aa0ff', kind: 'foreign', desc: '국내 S급을 노리는 해외 대형 길드들.' },
};
const FACTION_AGENDA = {
  guild: ['recruit', 'scandal', 'diplomacy', 'promote'],
  kama: ['crackdown', 'recruit', 'diplomacy'],
  cult: ['convert', 'preach'],
  black: ['smuggle', 'bribe'],
  chaebol: ['stake', 'succession'],
  foreign: ['poach'],
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.factionIds = function () { return [...Object.keys(GUILDS), ...Object.keys(FACTIONS_EXTRA)]; };
  GP.factionName = function (id) { return GUILDS[id] ? GUILDS[id].name : FACTIONS_EXTRA[id] ? FACTIONS_EXTRA[id].name : id; };
  GP.factionKind = function (id) { return id === 'kama' ? 'kama' : GUILDS[id] ? 'guild' : FACTIONS_EXTRA[id].kind; };
  GP.factionMembers = function (id) { return this.adults().filter((n) => (GUILDS[id] ? n.guild === id : n.faction === id) && !n.retired); };

  GP.factionInit = function () {
    const w = this.world;
    w.factions ??= {};
    for (const id of this.factionIds()) {
      const f = (w.factions[id] ??= { funds: 0, rel: {}, leader: null });
      f.funds ||= RNG.int(3000, 9000) * (id === 'chaebol' ? 3 : id === 'foreign' ? 2 : 1);
      for (const o of this.factionIds()) if (o !== id) f.rel[o] ??= RNG.int(-20, 20);
    }
    // 앙숙과 동맹 기본값
    const set = (a, b, v) => { if (!w.factionsSeeded && w.factions[a] && w.factions[b]) { w.factions[a].rel[b] = v; w.factions[b].rel[a] = v; } };
    set('kama', 'cult', -80); set('kama', 'black', -60); set('baekho', 'chaebol', 70); set('baekho', 'jujak', -30); set('hyeonmu', 'cheongryong', -25);
    w.factionsSeeded = true;
    w.factionLog ??= [];
    // 비밀 세력 구성원
    if (!w.factionMembersSeeded) {
      for (const n of this.adults()) {
        if (n.faction || n.isCompanion) continue;
        if (n.personality === 'greedy' && RNG.chance(0.12)) n.faction = 'black';
        else if (!n.guild && RNG.chance(0.04)) n.faction = 'cult';
      }
      w.factionMembersSeeded = true;
    }
  };

  wrap('initSandbox', function (base) { base.call(this); this.factionInit(); });

  GP.factionLeader = function (id) {
    const f = this.world.factions[id];
    let n = f.leader != null ? this.npcById(f.leader) : null;
    if (!n || !n.alive || n.retired || (GUILDS[id] ? n.guild !== id : n.faction !== id)) {
      const ms = this.factionMembers(id).sort((a, b) => b.rankIdx - a.rankIdx || b.stage - a.stage);
      const old = n;
      n = ms[0] || null; f.leader = n ? n.id : null;
      if (n && old) this.factionNote(id, `${this.factionName(id)}의 새 수장으로 ${n.name}이(가) 올랐다.`, 2);
    }
    return n;
  };

  GP.factionRel = function (a, b, d) {
    const F = this.world.factions; if (!F[a] || !F[b]) return;
    F[a].rel[b] = Math.max(-100, Math.min(100, (F[a].rel[b] || 0) + d));
    F[b].rel[a] = Math.max(-100, Math.min(100, (F[b].rel[a] || 0) + d));
  };
  GP.factionPrestige = function (id, d) { if (GUILDS[id] && this.world.guildPrestige) this.world.guildPrestige[id] = Math.max(5, (this.world.guildPrestige[id] || 0) + d); };

  GP.factionNote = function (id, text, score = 0, kind = 'faction') {
    const w = this.world;
    w.factionLog.unshift({ mk: this.monthKey(), date: this.dateStr(), id, text: fixJosa(text) });
    if (w.factionLog.length > 30) w.factionLog.length = 30;
    this.rumor(text, { kind: kind + ':' + id, score, thread: 'faction:' + id });
    const p = this.player;
    if (p.guild === id) this.log(text, 'major');
  };

  // ---------- 수 ----------
  const MOVES = {
    recruit(g, id) {
      const f = g.world.factions[id];
      const pool = g.adults().filter((n) => !n.isCompanion && !n.retired && n.rankIdx >= 2 && n.guild !== id && !n.faction && !(n.merc && n.merc.job))
        .filter((n) => !n.guild || (g.guildPower ? g.guildPower(n.guild) < g.guildPower(id) : true));
      const t = pool.sort((a, b) => (b.rankIdx * 3 + b.talent) - (a.rankIdx * 3 + a.talent))[RNG.int(0, 2)];
      if (!t) return;
      const fee = Math.round(300 * RANKS[t.rankIdx].mult);
      if (f.funds < fee) return;
      const from = t.guild;
      if (from && t.amb === 'family' && RNG.chance(0.5)) return; // 의리
      f.funds -= fee; t.guild = id; t.cash = (t.cash || 0) + fee;
      if (t.amb === 'power' || t.amb === 'wealth') t.ambSince = g.monthKey();
      if (from) g.factionRel(id, from, -12);
      if (t.rankIdx >= 4 || t.met) g.factionNote(id, `${g.factionName(id)}이(가) ${from ? g.factionName(from) + '의 ' : ''}${RANKS[t.rankIdx].key}급 ${t.name}을(를) 영입했다.${from ? ' 이적료가 상당했다는 후문.' : ''}`, from ? 2 : 0);
      if (t.met && g.npcRemember) g.npcRemember(t, `${g.factionName(id)}(으)로 옮겼다`);
    },
    scandal(g, id) {
      const F = g.world.factions[id];
      const rivals = Object.keys(GUILDS).filter((o) => o !== id).sort((a, b) => (F.rel[a] || 0) - (F.rel[b] || 0));
      const r = rivals[0]; if (!r || (F.rel[r] || 0) > -10) return;
      if (F.lastScandal && g.monthKey() - F.lastScandal < 8) return;
      F.lastScandal = g.monthKey();
      const lines = ['간부의 갑질 의혹', '공략 보고서 조작 의혹', '신입 헌터 착취 논란', '코어 빼돌리기 의혹', '부상 은폐 논란'];
      g.factionPrestige(r, -RNG.int(3, 7)); g.factionRel(id, r, -8);
      // 진실 야망 NPC가 출처를 캘 수 있다
      const leak = RNG.chance(0.25);
      g.factionNote(r, `${g.factionName(r)} ${RNG.pick(lines)}이(가) 터졌다.${leak ? ` 제보자가 ${g.factionName(id)} 쪽이라는 말도 돈다.` : ''}`, 2, 'scandal');
      if (leak) g.factionPrestige(id, -2);
    },
    diplomacy(g, id) {
      const F = g.world.factions[id];
      const others = g.factionIds().filter((o) => o !== id);
      const o = RNG.pick(others); const v = F.rel[o] || 0;
      if (v >= 45 && !F.ally) { F.ally = o; g.factionNote(id, `${g.factionName(id)}와(과) ${g.factionName(o)}이(가) 공동 공략 협약을 맺었다.`, 2); g.factionRel(id, o, 10); }
      else if (v <= -55) { g.factionNote(id, `${g.factionName(id)}이(가) ${g.factionName(o)}을(를) 공개 비난했다. 두 세력의 골이 깊어진다.`, 1); g.factionRel(id, o, -5); }
      else g.factionRel(id, o, RNG.int(-6, 8));
      if (F.ally && (F.rel[F.ally] || 0) < 10) { g.factionNote(id, `${g.factionName(id)}와(과) ${g.factionName(F.ally)}의 협약이 깨졌다.`, 2); F.ally = null; }
    },
    promote(g, id) {
      const ms = g.factionMembers(id).filter((n) => n.amb === 'power' || n.rankIdx >= 4);
      const n = RNG.pick(ms); if (!n) return;
      const f = g.world.factions[id];
      if (f.funds < 1000 && RNG.chance(0.5)) { // 숙청
        const v = g.factionMembers(id).filter((x) => x.fails >= 2 || x.cash < 0)[0];
        if (v) { v.guild = null; v.cash -= 200; if (v.rankIdx >= 3 || v.met) g.factionNote(id, `${g.factionName(id)}이(가) 자금난 끝에 ${v.name}을(를) 내보냈다.`, 1); if (v.met && g.npcRemember) g.npcRemember(v, '길드에서 쫓겨났다'); }
        return;
      }
      n.cash = (n.cash || 0) + Math.round(150 * RANKS[n.rankIdx].mult); n.guildPos = (n.guildPos || 0) + 1;
      if (n.met || n.rankIdx >= 5) g.factionNote(id, `${n.name}이(가) ${g.factionName(id)} 간부로 승진했다.`, 0);
    },
    crackdown(g, id) {
      const w = g.world;
      if ((w.breaks || []).length || (w.ecoStat && w.ecoStat.breaks > (w.lastCrackBreaks || 0) + 2)) {
        w.assocBoost = g.monthKey() + 6; w.lastCrackBreaks = w.ecoStat ? w.ecoStat.breaks : 0;
        g.factionNote(id, '관리국이 비상 공략 체계를 가동했다. 협회 배정팀이 두 배로 늘어난다.', 2);
      } else if (RNG.chance(0.4)) {
        const sus = g.adults().filter((n) => n.faction === 'black' || n.faction === 'cult');
        const n = RNG.pick(sus);
        if (n && RNG.chance(0.3)) {
          const was = n.faction; const what = was === 'black' ? '불법 각성제 유통' : '균열교 연루';
          n.faction = null; n.cash -= 500; n.hurt = Math.max(n.hurt || 0, 3);
          g.factionNote(id, `관리국이 ${what} 혐의로 ${RANKS[n.rankIdx].key}급 ${n.name}을(를) 체포했다.`, 2);
          g.factionRel('kama', was, -5);
        }
      }
    },
    convert(g, id) {
      const t = g.adults().find((n) => !n.faction && !n.isCompanion && !n.retired && (n.fails >= 2 || n.cash < -200 || (n.nemesis && n.amb === 'revenge')) && n.personality !== 'just' && RNG.chance(0.3));
      if (!t) return;
      t.faction = 'cult';
      if (RNG.chance(0.3)) g.rumor(`요즘 ${regionById(t.region).name}에서 균열교 집회에 나가는 각성자가 늘었다는 말이 돈다.`, { kind: 'cult', score: 0 });
    },
    preach(g, id) {
      if (RNG.chance(0.5)) g.factionNote(id, `균열교 신도들이 ${regionById(RNG.pick(REGIONS).id).name} 도심에서 "문은 구원이다" 집회를 열었다.`, 0);
      g.world.factions[id].funds += 500;
    },
    smuggle(g, id) {
      const f = g.world.factions[id]; f.funds += RNG.int(800, 2000);
      for (const n of g.factionMembers(id)) n.cash = (n.cash || 0) + 100;
      const t = g.adults().find((n) => !n.faction && !n.isCompanion && n.personality !== 'just' && n.guild !== 'kama' && (n.amb === 'wealth' || n.cash < -300) && RNG.chance(0.25));
      if (t) t.faction = 'black';
      if (RNG.chance(0.2)) g.factionNote(id, '부산 항만에서 출처를 알 수 없는 B급 코어가 대량으로 풀렸다.', 1);
    },
    bribe(g, id) {
      const f = g.world.factions[id]; if (f.funds < 2000) return;
      f.funds -= 1500; g.factionRel(id, 'kama', 6);
      if (RNG.chance(0.15)) g.factionNote('kama', '관리국 직원이 암시장과 내통했다는 내부 고발이 나왔다.', 3, 'scandal');
    },
    stake(g, id) {
      const f = g.world.factions[id]; if (f.funds < 4000) return;
      const tgt = RNG.pick(['baekho', 'hyeonmu', 'jujak']);
      f.funds -= 3000; g.factionPrestige(tgt, 4); g.factionRel(id, tgt, 10);
      g.factionNote(id, `백호 가문이 ${g.factionName(tgt)} 지분을 사들였다. 업계는 다음 수를 주목한다.`, 1);
    },
    succession(g, id) {
      if (RNG.chance(0.3)) g.factionNote(id, RNG.pick(['백호 가문 장남과 차녀의 후계 다툼이 법정으로 번졌다.', '백호 가문 회장이 쓰러졌다는 소문이 돈다. 그룹 주가가 출렁인다.', '백호 가문이 S급 경호원을 새로 들였다는 소식.']), 1);
    },
    poach(g, id) {
      const top = g.adults().filter((n) => n.rankIdx >= 6 && !n.isCompanion && !n.retired && n.amb !== 'family' && n.amb !== 'guard' && !n.met);
      const n = RNG.pick(top);
      if (!n || !RNG.chance(0.12)) return;
      n.alive = false; n.emigrated = true; n.death = { date: g.dateStr(), cause: '해외 길드 이적' };
      if (n.guild) g.factionPrestige(n.guild, -8);
      g.factionNote(id, `속보: S급 ${n.name}이(가) 해외 길드로 떠났다. 몸값은 천문학적이라는 후문. 관리국은 "국가 전력 손실"이라며 유감을 표했다.`, 5, 'poach');
    },
  };
  GP.factionMoves = MOVES;

  GP.factionMonthly = function () {
    if (!this.world.factions) this.factionInit();
    let moves = 0;
    const ids = this.factionIds().sort(() => RNG.next() - 0.5);
    for (const id of ids) {
      if (moves >= 2) break;
      const kind = this.factionKind(id);
      const chance = kind === 'foreign' ? 0.04 : kind === 'cult' || kind === 'black' ? 0.25 : 0.3;
      if (!RNG.chance(chance * (this.storyPace ? this.storyPace() : 1))) continue;
      this.factionLeader(id);
      const ag = FACTION_AGENDA[kind];
      const m = RNG.pick(ag);
      MOVES[m](this, id);
      moves++;
    }
    // 유지비
    for (const id of this.factionIds()) { const f = this.world.factions[id]; f.funds = Math.round(f.funds * 0.97); }
    // 길드 자금: 위세와 길드원 수
    for (const id of Object.keys(GUILDS)) {
      const f = this.world.factions[id];
      f.funds += Math.round((this.world.guildPrestige[id] || 20) * 2 + this.factionMembers(id).length * 10);
    }
  };

  wrap('worldMonthly', function (base) { base.call(this); this.factionMonthly(); });

  // 관리국 비상 체계: 협회 배정팀이 늘어난다
  if (GP.ecoForm) wrap('ecoForm', function (base, g) {
    const f = base.call(this, g);
    if (f && f.actor.kind === 'assoc' && this.world.assocBoost && this.world.assocBoost >= this.monthKey()) f.boost = true;
    return f;
  });
  if (GP.ecoChance) wrap('ecoChance', function (base, g, actor, team) {
    let c = base.call(this, g, actor, team);
    if (actor.kind === 'assoc' && this.world.assocBoost && this.world.assocBoost >= this.monthKey()) c = Math.min(0.97, c + 0.12);
    if (actor.kind === 'guild' && this.world.factions && this.world.factions[actor.guild] && this.world.factions[actor.guild].ally) c = Math.min(0.97, c + 0.05);
    return c;
  });
}

if (typeof UI !== 'undefined' && UI.guildHtml) {
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const html = baseGuild.call(this);
    const w = G.world; if (!w.factions) return html;
    const rows = Object.keys(FACTIONS_EXTRA).map((id) => {
      const f = FACTIONS_EXTRA[id]; const L = G.factionLeader(id);
      const known = id === 'chaebol' || id === 'foreign' || (L && L.met);
      return `<div class="item-row"><div class="grow"><b style="color:${f.color}">${f.name}</b> <span class="small dim">${known && L ? `수장 ${L.name}` : '수장 불명'}</span><div class="small dim">${f.desc}</div></div></div>`;
    }).join('');
    const pair = [];
    const ids = G.factionIds();
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const v = w.factions[ids[i]].rel[ids[j]] || 0;
      if (Math.abs(v) >= 45) pair.push({ a: ids[i], b: ids[j], v });
    }
    pair.sort((x, y) => Math.abs(y.v) - Math.abs(x.v));
    const rel = pair.slice(0, 6).map((r) => `<div class="small">${G.factionName(r.a)} ${r.v > 0 ? '<span class="good">협력</span>' : '<span class="bad">대립</span>'} ${G.factionName(r.b)}</div>`).join('') || '<div class="small dim">눈에 띄는 동맹이나 앙숙은 없다.</div>';
    const log = (w.factionLog || []).slice(0, 5).map((l) => `<div class="l"><span class="d">${l.date}</span>${l.text}</div>`).join('');
    return html + `<div class="panel sec"><h3>그 밖의 세력</h3><div class="cards">${rows}</div>
      <div class="sec-title sec">세력 관계</div>${rel}
      ${log ? `<div class="sec-title sec">최근 세력 동향</div><div class="logs">${log}</div>` : ''}</div>`;
  };
}
