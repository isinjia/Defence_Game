// ===== 게이트 크로니클: NPC 인물 유형 16종 + 라이벌 동기 보장 (영역 C) =====
// docs/NPC_인물유형_제안.md. 유형은 "누구인가", 야망(npc_ai.js)은 "무엇을 원하나".
// NPC의 약 40%가 유형 하나를 가진다. 처음엔 겉모습만, 관계 30 이상이면 유형과 사연이 드러난다.
// 유형마다 성장 곡선·야망·대사·뉴스 가치가 다르다. 라이벌 동기는 판마다 한 명 보장한다.

const ARCH = {
  rival:     { name: '라이벌 동기', cap: 1, amb: 'peak', news: 3, look: '자꾸 눈에 밟히는 동기',
    story: (g, n) => `같은 날 헌터 자격 시험을 본 동기. 당신의 등급이 오를 때마다 ${n.gender === 'M' ? '그' : '그녀'}도 어김없이 따라 올라온다.`,
    talk: ['"이번엔 내가 먼저다."', '"너 요즘 랭킹 몇 위야? …아니, 그냥 궁금해서."', '"다음 대회에서 보자."'] },
  monster:   { name: '괴물 신인', cap: 2, amb: 'peak', news: 3, look: '측정기 앞에서 화제가 됐던 신입',
    cond: (n) => n.ageMonths / 12 <= 24 && n.talent >= 7,
    story: (g, n) => `${regionById(n.region).name} 측정소에서 측정기를 터뜨린 신규 등록자. 업계가 벌써부터 몸값을 매긴다.`,
    talk: ['"선배들은 왜 이렇게 느려요?"', '"S급? 금방이죠."'] },
  fallen:    { name: '몰락한 천재', cap: 3, amb: 'revenge', news: 2, look: '눈빛이 어딘가 가라앉은 헌터',
    cond: (n) => n.talent >= 7 && n.rankIdx >= 2 && n.ageMonths / 12 >= 27,
    story: (g, n) => `한때 최연소 ${RANKS[Math.min(7, n.rankIdx + 2)].key}급 후보였다. ${RNG.int(3, 8)}년 전 게이트 사고 뒤로 성장이 멈췄다.`,
    talk: ['"예전엔… 아니다, 됐어."', '"그 게이트만 아니었으면."'] },
  late:      { name: '대기만성형', amb: 'family', news: 0, look: '나이에 비해 등급이 낮은 헌터',
    cond: (n) => n.ageMonths / 12 >= 30 && n.rankIdx <= 2,
    story: (g, n) => `서른 넘어 각성한 전직 회사원. 남들보다 늦었지만 꾸준함만은 누구에게도 지지 않는다.`,
    talk: ['"출근하던 버릇이 남아서, 아침 7시면 눈이 떠져요."', '"늦게 시작했으니 더 해야죠."'] },
  heir:      { name: '길드 2세', amb: 'power', news: 2, look: '장비가 유난히 비싼 젊은 헌터',
    cond: (n) => n.guild && n.ageMonths / 12 <= 30,
    story: (g, n) => `${GUILDS[n.guild] ? GUILDS[n.guild].name : '대형 길드'} 수뇌부의 자녀. 모두가 배경을 먼저 본다. 본인은 그게 지긋지긋하다.`,
    talk: ['"내 이름 말고 실력을 봐 줬으면 좋겠어."', '"아버지 얘긴 꺼내지 마."'] },
  provider:  { name: '생계형 가장', amb: 'family', news: 0, look: '휴대폰 배경이 아이 사진인 헌터',
    cond: (n) => n.ageMonths / 12 >= 30,
    story: (g, n) => `아이 ${RNG.int(1, 3)}명, 주택 대출 ${RNG.int(20, 30)}년. 위험한 게이트엔 들어가지 않는다. 오늘도 무사히 집에 가는 게 목표다.`,
    talk: ['"오늘은 무사히 집에 가야 해."', '"애들 학원비가 또 올랐어."'] },
  avenger:   { name: '복수귀', cap: 4, amb: 'revenge', news: 1, look: '말수가 적고 늘 무장한 헌터',
    story: (g, n) => `${RNG.int(3, 10)}년 전 ${regionById(RNG.pick(REGIONS).id).name} 브레이크로 가족을 잃었다. 그날의 괴수를 지금도 쫓는다.`,
    talk: ['"그놈 냄새가 나."', '"…괴수에게 자비는 없어."'] },
  legend:    { name: '은퇴한 전설', cap: 3, amb: 'rest', news: 3, look: '포차 구석의 조용한 노인',
    cond: (n) => n.ageMonths / 12 >= 58 && n.rankIdx >= 5,
    story: (g, n) => `대붕괴 직후의 1세대 ${RANKS[n.rankIdx].key}급. 지금은 ${RNG.pick(['포장마차를 하고', '약초를 팔고', '낚시만 하며'])} 조용히 산다. 칼을 놓은 지 오래다.`,
    talk: ['"젊을 땐 나도 그랬지."', '"검은 손이 아니라 마음으로 드는 거다."'] },
  porter:    { name: '짐꾼 출신', amb: 'family', news: 0, look: '배낭 끈 자국이 선명한 헌터',
    cond: (n) => n.rankIdx <= 3,
    story: (g, n) => `비각성 포터로 ${RNG.int(6, 12)}년을 일하다 늦게 각성했다. 게이트 안의 길과 함정은 누구보다 잘 안다.`,
    talk: ['"그 구역 왼쪽 벽, 두드려 봐. 소리가 달라."', '"짐꾼 때 버릇이라 늘 비상식량을 챙겨."'] },
  broker:    { name: '정보상', cap: 6, amb: 'wealth', news: 1, look: '누구와도 아는 사이인 사람',
    story: (g, n) => `${regionById(n.region).name}의 소문은 대부분 이 사람 손을 거친다. 값만 맞으면 뭐든 판다.`,
    talk: ['"공짜 정보는 없어. 근데 오늘은 기분이 좋네."', '"요즘 어느 길드가 이상하게 조용한지 알아?"'] },
  auditor:   { name: '원칙주의 감독관', cap: 3, amb: 'truth', news: 1, look: '관리국 배지를 단 깐깐한 사람',
    story: (g, n) => `관리국 감사관. 규정 밖의 일은 단 하나도 넘어가지 않는다. 그래서 적이 많다.`,
    talk: ['"규정 제14조 위반입니다."', '"편법은 언젠가 대가를 치릅니다."'] },
  streamer:  { name: '방송 헌터', cap: 5, amb: 'wealth', news: 2, look: '어깨에 촬영 드론을 단 헌터',
    story: (g, n) => `구독자 ${RNG.int(30, 150)}만의 헌터 스트리머. 위험한 게이트일수록 조회수가 잘 나온다.`,
    talk: ['"구독, 좋아요 부탁드려요! …아, 꺼져 있구나."', '"합방 한번 할래요? 조회수 반띵."'] },
  villain:   { name: '빌런 헌터', cap: 4, amb: 'wealth', news: 2, look: '눈을 잘 마주치지 않는 헌터',
    cond: (n) => n.personality === 'greedy' || n.personality === 'warlike' || n.personality === 'cold',
    story: (g, n) => `각성자 범죄 조직과 줄이 닿아 있다는 소문. 약탈·청부를 가리지 않는다. 관리국 수배 명단에 이름이 오르내린다.`,
    talk: ['"뭘 봐."', '"돈이면 다 돼. 너도 알잖아."'] },
  healer:    { name: '혹사당하는 힐러', amb: 'family', news: 1, look: '늘 피곤해 보이는 치유사',
    cond: (n) => { const c = classById(n.cls); return c && c.g === 'support'; },
    story: (g, n) => `희귀한 치유 계열이라 길드마다 데려가려고 싸운다. 계약서엔 휴가가 없다.`,
    talk: ['"이번 달 야간 공략만 열두 번째예요."', '"저도… 쉬고 싶어요."'] },
  outsider:  { name: '이방인', amb: 'truth', news: 1, look: '사람과 조금 다른 기척',
    cond: (n) => n.race && n.race !== 'human',
    story: (g, n) => `게이트 너머에서 넘어온 존재. 사람들의 시선이 곱지 않다. 원초의 게이트에 대해 뭔가 알고 있는 듯하다.`,
    talk: ['"너희 세계의 하늘은 너무 파랗다."', '"문 너머에도 사람이 산다. 믿지 않겠지만."'] },
  regressor: { name: '또 다른 회귀자', cap: 1, amb: 'peak', news: 2, rare: 0.15, look: '앞일을 아는 듯 말하는 사람',
    story: (g, n) => `아무도 모르는 게이트에 먼저 가 있고, 브레이크가 나기 전에 그 도시를 떠난다. 마치 한 번 살아 본 것처럼.`,
    talk: ['"이번엔… 아니, 아무것도 아니야."', '"다음 달 그 도시엔 가지 마."'] },
};
const ARCH_GROWTH = {
  monster: (n) => (n.rankIdx <= 3 ? 2.2 : n.rankIdx >= 5 ? 0.8 : 1), late: (n) => (n.rankIdx < 4 ? 0.6 : n.rankIdx < 6 ? 1.3 : 1), fallen: (n) => (n.recovered ? 1.4 : 0.15),
  legend: () => 0, provider: () => 0.8, porter: () => 0.8, broker: () => 0.6, auditor: () => 0.7, avenger: () => 1.2,
  heir: () => 1.1, villain: () => 1.1, healer: () => 0.9, regressor: (n) => (n.rankIdx < 6 ? 1.4 : 1),
};
const ARCH_NEWSY = new Set(Object.keys(ARCH).filter((k) => ARCH[k].news >= 2));

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.archCount = function (id) { return this.npcs.filter((n) => n.alive && n.arch === id).length; };
  GP.archFits = function (id, n) {
    const A = ARCH[id];
    if (n.child || n.isCompanion) return false;
    if (A.cap != null && this.archCount(id) >= A.cap) return false;
    if (A.cond && !A.cond(n)) return false;
    return true;
  };
  GP.archSet = function (n, id) {
    const A = ARCH[id];
    n.arch = id; n.archStory = fixJosa(A.story(this, n));
    if (A.amb && typeof AMBITIONS !== 'undefined') n.amb = A.amb;
    if (id === 'heir') n.cash = (n.cash || 0) + 3000;
    if (id === 'auditor') n.guild = 'kama';
    if (id === 'villain') n.faction = n.faction || 'black';
    if (id === 'legend') n.retired = n.retired || this.monthKey();
    if (id === 'avenger' && !n.nemesis) n.nemesisMonster = true;
  };
  // 유형 뽑기 (rival 제외). 40%만 유형을 가진다
  GP.archRoll = function (n) {
    if (n.child || n.arch || n.isCompanion || !RNG.chance(0.4)) return;
    const ids = Object.keys(ARCH).filter((id) => id !== 'rival' && this.archFits(id, n) && (!ARCH[id].rare || RNG.chance(ARCH[id].rare)));
    if (!ids.length) return;
    const w = ids.map((id) => (ARCH[id].cap ? 0.6 : 1.2) * (ARCH[id].cond ? 2 : 1));
    this.archSet(n, RNG.weighted(ids, w));
  };

  wrap('initSandbox', function (base) {
    base.call(this);
    if (!this.world.archSeeded) { for (const n of this.npcs) this.archRoll(n); this.world.archSeeded = true; }
  });
  wrap('makeNpc', function (base, young, race) {
    const n = base.call(this, young, race);
    if (n && this.world && this.world.archSeeded) this.archRoll(n);
    return n;
  });

  // ---------- 라이벌 동기 ----------
  GP.rival = function () { return this.npcs.find((n) => n.arch === 'rival' && n.alive) || null; };
  GP.makeRival = function (from) {
    const p = this.player;
    let n = from;
    if (!n) {
      n = this.makeNpc(true); this.npcs.push(n);
      n.ageMonths = p.ageMonths + RNG.int(-12, 12); n.region = p.region; n.examMate = true;
    }
    n.rankIdx = Math.max(n.rankIdx, Math.max(0, p.rankIdx - (RNG.chance(0.5) ? 1 : 0)));
    n.talent = Math.max(n.talent, 7);
    n.personality = n.personality === 'kind' ? RNG.pick(['warlike', 'just', 'cold']) : n.personality;
    n.lifespan = Math.max(n.lifespan, Math.floor(n.ageMonths / 12) + 45);
    this.archSet(n, 'rival');
    return n;
  };
  // 라이벌 성장: 플레이어 등급을 따라온다
  GP.rivalMonthly = function () {
    const p = this.player; let r = this.rival();
    if (!r) { if (p.examDone && this.ageYears() <= 45 && RNG.chance(0.1)) { r = this.makeRival(null); this.rumor(`${p.name}과(와) 같은 해 데뷔한 ${r.name}이(가) 무섭게 치고 올라온다는 말이 돈다.`, { kind: 'rival', score: 1 }); } return; }
    if (r.retired) r.retired = null;
    const gap = p.rankIdx + p.stage / 3 - (r.rankIdx + r.stage / 3);
    if (gap > 0.3) r.progress += 0.08 + gap * 0.06;
    else if (gap < -0.7) r.progress = 0; // 너무 앞서면 기다린다
    if (r.progress >= 1) {
      r.progress = 0;
      if (r.stage < 2) r.stage++;
      else if (r.rankIdx < 7 && (gap > -0.5 || RNG.chance(0.15))) {
        r.rankIdx++; r.stage = 0; r.lifespan += RANKS[r.rankIdx].life - RANKS[r.rankIdx - 1].life;
        const tone = r.relation >= 40 ? '오랜 벗이자 라이벌' : r.relation <= -20 ? '숙적' : '동기';
        this.log(`${tone} ${r.name}이(가) ${RANKS[r.rankIdx].name}에 올랐다.${r.rankIdx > p.rankIdx ? ' 이번엔 한발 늦었다.' : ''}`, 'major');
        this.rumor(`${RANKS[r.rankIdx].key}급 ${r.name}, ${p.name}과(와) 같은 기수에서 또 한 명의 ${RANKS[r.rankIdx].key}급.`, { kind: 'rival', score: 2 });
        if (r.rankIdx > p.rankIdx && this.npcRemember) this.npcRemember(r, `당신보다 먼저 ${RANKS[r.rankIdx].key}급에 올랐다`);
      }
    }
  };

  // 라이벌은 배경 사고(게이트·브레이크·수명 외 무작위)로는 죽지 않는다. 플레이어나 이야기가 끝낼 수 있다.
  wrap('killNpc', function (base, n, cause, killer) {
    if (n && n.arch === 'rival' && !killer && /게이트|브레이크|돌파/.test(String(cause))) { n.hurt = Math.max(n.hurt || 0, 3); if (n.met) this.log(`${n.name}이(가) 게이트에서 크게 다쳤다는 소식이다. 목숨은 건졌다고 한다.`, 'bad'); return; }
    return base.call(this, n, cause, killer);
  });

  // 유형별 성장 곡선 (simulateNpcs 의 진척에 덧붙이거나 덜어낸다)
  wrap('simulateNpcs', function (base) {
    base.call(this);
    for (const n of this.npcs) {
      if (!n.alive || n.child || !n.arch || !ARCH_GROWTH[n.arch]) continue;
      const m = ARCH_GROWTH[n.arch](n);
      if (m === 1) continue;
      const reg = regionById(n.region);
      const rate = (1 + n.talent * 0.08) * reg.ether * 0.3 / (4 * RANKS[n.rankIdx].mult ** 1.5);
      n.progress = Math.max(0, n.progress + rate * (m - 1));
    }
    this.rivalMonthly();
    // 정원 있는 유형 채우기
    if (RNG.chance(0.03)) {
      const id = RNG.pick(['monster', 'fallen', 'legend', 'avenger', 'streamer', 'villain', 'broker', 'auditor']);
      if (this.archCount(id) < (ARCH[id].cap || 1)) {
        const n = RNG.pick(this.adults().filter((x) => !x.arch && this.archFits(id, x)));
        if (n) { this.archSet(n, id); if (id === 'monster') this.rumor(`${regionById(n.region).name} 측정소에서 측정기가 터졌다. 신규 등록자 ${n.name}에게 길드들이 몰려든다.`, { kind: 'monster', score: 3 }); }
      }
    }
  });

  // 뉴스 가치
  if (GP.newsScore) wrap('newsScore', function (base, text, meta) {
    let s = base.call(this, text, meta);
    for (const n of this.npcs) if (n.arch && ARCH_NEWSY.has(n.arch) && n.name && text.includes(n.name)) { s += ARCH[n.arch].news - 1; break; }
    return s;
  });

  // 대사
  wrap('talk', function (base, id) {
    const r = base.call(this, id);
    const n = this.npcById(id);
    if (n && n.arch && typeof r === 'string' && this.archRevealed(n) && RNG.chance(0.5)) {
      const line = RNG.pick(ARCH[n.arch].talk);
      return r.replace(/: "[^"]*"/, `: ${line}`);
    }
    return r;
  });

  GP.archRevealed = function (n) { return n.arch === 'rival' || n.relation >= 30 || n.relation <= -40 || (n.met && n.arch === 'legend' && n.relation >= 15); };

  // 회귀자끼리
  if (GP.talk) wrap('talk', function (base, id) {
    const r = base.call(this, id);
    const n = this.npcById(id); const p = this.player;
    if (n && n.arch === 'regressor' && p.regress && p.regress.count && !n.knowsPlayer) {
      n.knowsPlayer = true; this.changeRel(n, 15, '서로 회귀자임을 알아봤다');
      return `${n.name}이(가) 당신 눈을 오래 들여다본다. "…너도구나. 몇 번째야?" (관계 +15)`;
    }
    return r;
  });
}

// 라이벌 동기는 시험 동기 중 재능이 가장 높은 사람
if (typeof UI !== 'undefined' && UI.makeExamParty) {
  const baseExam = UI.makeExamParty;
  UI.makeExamParty = function (...a) {
    const ids = baseExam.apply(this, a);
    if (!G.rival() && Array.isArray(ids)) {
      const pick = ids.map((id) => G.npcById(id)).filter(Boolean).sort((x, y) => y.talent - x.talent)[0];
      if (pick) G.makeRival(pick);
    }
    return ids;
  };
}

if (typeof UI !== 'undefined' && UI.npcCard) {
  const baseCard = UI.npcCard;
  UI.npcCard = function (n, here) {
    const html = baseCard.call(this, n, here);
    if (!n || !n.arch || n.child || !(n.met || here)) return html;
    const A = ARCH[n.arch];
    const rv = G.archRevealed(n);
    const tag = n.arch === 'rival' ? (n.relation >= 40 ? '평생의 라이벌' : n.relation <= -20 ? '숙적' : A.name) : A.name;
    const line = rv ? `<div class="small"><span class="tag amber">${tag}</span> <span class="dim">${n.archStory || ''}</span></div>` : `<div class="small dim">${A.look}</div>`;
    const at = html.indexOf('<div class="rel-line">');
    return at >= 0 ? html.slice(0, at) + line + html.slice(at) : html;
  };
}
