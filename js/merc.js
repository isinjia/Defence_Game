// ===== 게이트 크로니클: 용병 모집 =====
// 용병은 돈만 내면 오는 사람이 아니다. 무엇을 할지 공고를 내면, 그 일에 맞는 사람만 응한다.
// 계약한 일을 하지 않으면 불만이 쌓여 따지거나 떠나고, 일이 잘 풀리면 기뻐하며 관계가 깊어진다.

const MERC_JOBS = {
  gate: { name: '게이트 공략', months: 2, desc: (j) => `${RANKS[j.tier].key}급 이상 게이트 1곳 공략` },
  hunt: { name: '괴수 토벌', months: 2, desc: (j) => `${RANKS[j.tier].key}급 이상 괴수 ${j.n}마리 토벌` },
  escort: { name: '동행 이동', months: 1, desc: (j) => `${regionById(j.dest).name}까지 동행` },
  long: { name: '장기 동행', months: 3, desc: () => '정해진 목표 없이 3개월 동행' },
};
const MERC_PAY = [{ id: 0.75, name: '박하게' }, { id: 1, name: '시세대로' }, { id: 1.4, name: '후하게' }];
// 성격별 취향: 일 종류 선호, 위험 선호, 돈 민감도
const MERC_TASTE = {
  kind: { job: { escort: 0.25, long: 0.1, hunt: 0, gate: -0.05 }, risk: -0.25, pay: 0.5 },
  warlike: { job: { gate: 0.25, hunt: 0.2, escort: -0.15, long: -0.2 }, risk: 0.25, pay: 0.4 },
  greedy: { job: { gate: 0.15, hunt: 0.05, escort: 0, long: 0 }, risk: -0.05, pay: 1.2 },
  just: { job: { hunt: 0.2, escort: 0.15, gate: 0.05, long: 0 }, risk: 0, pay: 0.5 },
  cold: { job: { long: 0.15, gate: 0.05, hunt: 0, escort: 0 }, risk: -0.1, pay: 0.7 },
};
const MERC_LINES = {
  yes: {
    kind: ['"사람 다치는 일만 아니면 좋아요. 같이 가요."', '"잘 부탁드려요. 저도 열심히 할게요."'],
    warlike: ['"드디어 손맛 좀 보겠네. 끼워 줘."', '"센 놈 나오면 내가 먼저다. 그 조건이면 간다."'],
    greedy: ['"이 금액이면 움직일 만하지. 잔금은 확실히 주는 거지?"', '"전리품은 공정하게. 그거면 됐어."'],
    just: ['"그런 일이라면 내가 빠질 수 없지."', '"좋은 일 하는 거 맞지? 그럼 간다."'],
    cold: ['"…조건 확인했어. 간다."', '"일만 제대로 하면 돼."'],
  },
  no: {
    risk: ['"그 등급은 내 목숨값보다 비싸."', '"미안, 아직 그 정도 게이트는 무리야."'],
    bored: ['"그런 시시한 일엔 관심 없어."', '"싸움이 없잖아. 패스."'],
    pay: ['"그 돈 받고는 못 가지."', '"공고 금액 보고 웃었어. 다시 써 와."'],
    rep: ['"당신 소문 들었어. 같이 일하고 싶진 않네."', '"사람 죽인 헌터랑은 안 엮여."'],
    plain: ['"이번엔 패스할게."', '"다른 일이 있어서."'],
  },
};

Object.assign(Game.prototype, {
  mercsFor(regionId) {
    const key = this.monthKey(); this.world.mercs ??= {};
    let m = this.world.mercs[regionId];
    if (!m || m.key !== key) {
      const list = []; const pr = this.player.rankIdx;
      const groups = Object.keys(CLASS_GROUPS).filter((g) => g !== 'hidden').sort(() => Math.random() - 0.5);
      for (let i = 0; i < 5; i++) {
        const n = this.makeNpc(false);
        n.cls = RNG.pick(CLASSES.filter((c) => c.g === groups[i] && c.r < 3)).id;
        n.rankIdx = Math.max(0, Math.min(7, pr + RNG.int(-1, 1))); n.stage = RNG.int(0, 2);
        n.ageMonths = (22 + n.rankIdx * 4 + RNG.int(0, 10)) * 12; n.region = regionId; n.hireable = true;
        n.personality = RNG.pick(['kind', 'warlike', 'greedy', 'just', 'cold']);
        list.push(n);
      }
      m = this.world.mercs[regionId] = { key, list };
      if (this.player.mercPost && this.player.mercPost.region === regionId) this.player.mercPost = null;
    }
    return m.list;
  },
  mercJobPay(n, job, payMul) {
    const months = MERC_JOBS[job.kind].months + (job.kind === 'escort' ? Math.floor(regionDist(this.player.region, job.dest) / 3) : 0);
    const risk = job.tier != null ? Math.max(0, job.tier - n.rankIdx) : 0;
    return Math.round(this.mercFee(n) * (months / 3) ** 0.7 * (1 + 0.35 * risk) * payMul / 10) * 10;
  },
  // 공고에 대한 한 사람의 반응
  mercReply(n, job, payMul) {
    const p = this.player; const t = MERC_TASTE[n.personality] || MERC_TASTE.cold;
    const d = job.tier != null ? job.tier - n.rankIdx : -1;
    let s = 0.55 + (t.job[job.kind] || 0) + (payMul - 1) * t.pay + Math.min(p.fame, 150) / 600 + this.rep(this.player.region) / 600;
    let reason = 'plain';
    if (d >= 2) { s -= n.personality === 'warlike' ? 0.35 : 0.8; reason = 'risk'; }
    else if (d === 1) { s += t.risk; if (t.risk < 0) reason = 'risk'; }
    else if (d <= -2 && n.personality === 'warlike') { s -= 0.3; reason = 'bored'; }
    if (job.kind === 'long' && n.personality === 'warlike') reason = 'bored';
    if (payMul < 1 && t.pay >= 0.7) reason = 'pay';
    if ((p.record.npcKills || 0) >= 3 && (n.personality === 'kind' || n.personality === 'just')) { s -= 0.4; reason = 'rep'; }
    const yes = s + RNG.range(-0.15, 0.15) > 0.6;
    return { id: n.id, yes, line: RNG.pick(yes ? MERC_LINES.yes[n.personality] : MERC_LINES.no[reason]) };
  },
  postMercJob(job, payMul) {
    const p = this.player; const reg = this.region().id;
    const cost = Math.round(30 * RANKS[p.rankIdx].mult ** 0.5);
    if (p.money < cost) return '게시비가 부족하다.';
    p.money -= cost;
    const list = this.mercsFor(reg);
    p.mercPost = { region: reg, key: this.monthKey(), job, payMul, replies: list.filter((n) => !n.hired).map((n) => this.mercReply(n, job, payMul)) };
    const yes = p.mercPost.replies.filter((r) => r.yes).length;
    return `공고를 올렸다. (게시비 ${fmt(cost)}) ${yes ? `${yes}명이 응했다.` : '아무도 응하지 않았다. 조건을 바꿔 보자.'}`;
  },
  hireMerc(regionId, idx) {
    const p = this.player; const post = p.mercPost;
    const n = this.mercsFor(regionId).find((x) => x.id === idx);
    if (!post || !n || n.hired) return '';
    const r = post.replies.find((x) => x.id === n.id);
    if (!r || !r.yes) return `${n.name}은(는) 이 공고에 응하지 않았다.`;
    if (this.party().length >= 4) return '파티는 최대 5명이다.';
    const pay = this.mercJobPay(n, post.job, post.payMul); const adv = Math.round(pay / 2 / 10) * 10;
    if (p.money < adv) return `선금 ${fmt(adv)} 크레딧이 부족하다.`;
    p.money -= adv; n.hired = true; n.hireable = false;
    const months = MERC_JOBS[post.job.kind].months + (post.job.kind === 'escort' ? Math.floor(regionDist(p.region, post.job.dest) / 3) : 0);
    n.met = true; n.relation = 10; n.isCompanion = true;
    n.merc = { job: { ...post.job }, payMul: post.payMul, until: this.monthKey() + months, start: this.monthKey(), bal: pay - adv, mood: 60, progress: 0, active: this.monthKey() };
    n.links ??= {}; n.disciples ??= []; n.parents ??= [];
    this.npcs.push(n); p.party.push(n.id);
    return `${n.name}과(와) 계약했다. 일: ${MERC_JOBS[post.job.kind].desc(post.job)}, 기한 ${months}개월, 선금 ${fmt(adv)} · 잔금 ${fmt(pay - adv)}`;
  },
  mercs() { return this.party().filter((n) => n.merc && n.merc.job); },
  mercMood(n) { const m = n.merc.mood; return m >= 80 ? ['신났다', 'good'] : m >= 55 ? ['괜찮다', ''] : m >= 35 ? ['불만', 'bad'] : ['폭발 직전', 'bad']; },
  mercSay(n, text, tone = '') { this.queue.push({ type: 'mercSay', npc: n.id, text, tone }); },
  mercAdjust(n, d) { n.merc.mood = Math.max(0, Math.min(100, n.merc.mood + d)); },
  // 계약 종료 처리
  mercRelease(n, why) {
    const m = n.merc; n.merc = null;
    const stay = why === 'done' && n.relation >= 35;
    if (!stay) { n.isCompanion = false; this.player.party = this.player.party.filter((x) => x !== n.id); }
    return stay;
  },
  mercSuccess(n) {
    const p = this.player; const m = n.merc;
    if (p.money < m.bal) {
      this.changeRel(n, -30); this.mercRelease(n, 'unpaid'); n.nemesis = n.personality === 'warlike' ? 'player' : n.nemesis;
      this.rumor(`${p.name}이(가) 용병 ${n.name}의 잔금을 떼먹었다는 소문이 돈다.`); this.addRep(p.region, -10);
      this.mercSay(n, `"일은 끝났는데 잔금이 없다고? 장난해? …이 바닥 좁은 거 알지." ${n.name}이(가) 문을 걷어차고 나갔다. (관계 -30, 평판 -10)`, 'bad');
      return;
    }
    p.money -= m.bal;
    const g = 12 + Math.round((m.payMul - 1) * 20) + Math.round((m.mood - 50) / 5);
    this.changeRel(n, g);
    const happy = { kind: '"해냈어요! 다치지 않고 끝나서 다행이에요."', warlike: '"크하, 이 맛에 산다니까. 다음에도 불러."', greedy: '"깔끔하네. 잔금 확인했어. 거래 또 하자고."', just: '"덕분에 할 일을 했다. 고마워."', cold: '"…나쁘지 않았어."' }[n.personality];
    const stay = this.mercRelease(n, 'done');
    this.mercSay(n, `잔금 ${fmt(m.bal)} 크레딧을 건넸다. ${n.name}: ${happy} (관계 +${g})${stay ? ` ${n.name}이(가) 말한다. "계약은 끝났지만… 당분간 같이 다녀도 될까?" 파티에 남았다.` : ' 계약을 마치고 떠났다. 관계가 깊어지면 다시 함께할 수 있다.'}`, 'good');
  },
  mercFail(n, why) {
    const m = n.merc; const job = MERC_JOBS[m.job.kind];
    this.changeRel(n, why === 'quit' ? -15 : -20);
    const lines = why === 'quit'
      ? { kind: '"죄송해요. 이건 제가 약속받은 일이 아니에요. 선금은 경비로 쓸게요."', warlike: '"한 번도 제대로 안 싸우고 뭐 하는 거야. 시간 낭비야, 간다."', greedy: '"일을 안 시키면 잔금도 없잖아. 계산이 안 맞아. 빠질게."', just: '"말한 일을 할 생각이 없어 보이는군. 여기까지다."', cold: '"…나간다."' }
      : { kind: `"기한이 지났어요… ${job.name}, 결국 못 했네요. 다음엔 약속 지켜 주세요."`, warlike: '"기한 끝. 말만 번지르르했지. 다신 안 엮인다."', greedy: '"기한 넘겼지? 선금은 내 거야. 잘 있어."', just: '"약속은 약속이었어. 실망이야."', cold: '"계약 만료. 끝."' };
    this.mercRelease(n, why);
    if (n.personality === 'greedy' || n.personality === 'warlike') this.rumor(`용병 ${n.name}이(가) "${this.player.name}은(는) 공고만 그럴싸하다"고 떠들고 다닌다.`);
    this.mercSay(n, `${n.name}: ${lines[n.personality]} (관계 ${why === 'quit' ? -15 : -20})`, 'bad');
  },
  // 계약 진행: 게이트·토벌·도착 사건을 지켜본다
  mercProgress(kind, data) {
    for (const n of this.mercs()) {
      const m = n.merc; const j = m.job;
      if (kind === 'gate' || kind === 'kill') { m.active = this.monthKey(); if (n.personality === 'warlike') this.mercAdjust(n, 6); }
      if (kind === 'gate' && j.tier != null && data.tier > j.tier + 1 && n.personality !== 'warlike') {
        this.mercAdjust(n, -15); this.changeRel(n, -4);
        this.mercSay(n, `${n.name}: "${RANKS[data.tier].key}급이라니, 공고엔 ${RANKS[j.tier].key}급이라며! 다음에 또 이러면 나 빠진다." (불만)`, 'bad');
      }
      let done = false;
      if (j.kind === 'gate' && kind === 'gate' && data.tier >= j.tier) done = true;
      if (j.kind === 'hunt' && kind === 'kill' && data.tier >= j.tier) { m.progress += data.n; if (m.progress >= j.n) done = true; else if (m.progress >= j.n / 2 && !m.half) { m.half = true; this.mercAdjust(n, 10); } }
      if (j.kind === 'escort' && kind === 'arrive' && data.region === j.dest) done = true;
      if (done) this.mercSuccess(n);
    }
  },
  mercMonthly() {
    const mk = this.monthKey();
    for (const n of this.mercs()) {
      const m = n.merc; const idle = mk - m.active;
      if (m.job.kind === 'long') {
        if (mk >= m.until) { if (m.mood >= 40) this.mercSuccess(n); else this.mercFail(n, 'deadline'); continue; }
        if (idle >= 1 && n.personality === 'warlike') this.mercAdjust(n, -20);
        else if (idle >= 2) this.mercAdjust(n, -8);
        continue;
      }
      if (mk > m.until) { this.mercFail(n, 'deadline'); continue; }
      if (idle >= 1) this.mercAdjust(n, n.personality === 'greedy' || n.personality === 'warlike' ? -22 : -15);
      if (m.mood <= 10) { this.mercFail(n, 'quit'); continue; }
      if (m.mood < 40 && !m.warned) {
        m.warned = true;
        const job = MERC_JOBS[m.job.kind].desc(m.job);
        this.mercSay(n, `${n.name}이(가) 따진다. "${job}. 그게 계약이었지? ${m.until - mk > 0 ? `남은 기한 ${m.until - mk}개월이야.` : '이번 달이 마지막이야.'} 이대로면 나 빠진다."`, 'bad');
      } else if (m.mood >= 40) m.warned = false;
    }
  },
});

// 기존 기능과의 연결
{
  const GP = Game.prototype;
  GP.expireMercs = function () {
    // 이전 저장의 단순 계약
    for (const n of this.party()) if (n.merc && !n.merc.job && this.monthKey() >= n.merc.until) {
      if (n.relation >= 40) n.merc = null; else { n.merc = null; this.dismiss(n.id); this.log(`${n.name}의 용병 계약이 끝났다.`); }
    }
    this.mercMonthly();
  };
  const baseQuest = GP.questEvent;
  GP.questEvent = function (kind, data) { baseQuest.call(this, kind, data); if (this.player) this.mercProgress(kind, data); };
  const baseDismiss = GP.dismiss;
  GP.dismiss = function (id) {
    const n = id != null ? this.npcById(id) : this.companion();
    if (n && n.merc && n.merc.job) {
      this.changeRel(n, -12); n.merc = null;
      const res = baseDismiss.call(this, id);
      return `${res} ${n.name}: "${n.personality === 'kind' ? '갑자기요…? 알겠어요. 선금은 돌려드리기 어려워요.' : '계약 깬 건 그쪽이야. 선금은 못 돌려줘.'}" (관계 -12)`;
    }
    return baseDismiss.call(this, id);
  };
  const baseKill = GP.killNpc;
  GP.killNpc = function (n, cause, killer) {
    const inParty = n.isCompanion;
    baseKill.call(this, n, cause, killer);
    if (!inParty || !this.player) return;
    for (const o of this.mercs()) {
      this.mercAdjust(o, -20);
      if (o.personality === 'kind' || (o.personality === 'cold' && o.merc.mood < 30)) {
        this.changeRel(o, -5); this.mercRelease(o, 'shaken');
        this.mercSay(o, `${o.name}: "${n.name} 씨가… 미안해요, 더는 못 하겠어요." ${o.name}이(가) 계약을 포기하고 떠났다.`, 'bad');
      }
    }
  };
}

// ---------- 화면 ----------
Object.assign(UI, {
  mercDraft: null,
  mercHtml(reg) {
    const p = G.player; const pr = p.rankIdx;
    const d = this.mercDraft ||= { kind: 'gate', tier: pr, n: 8, dest: null, pay: 1 };
    if (d.kind === 'escort' && (!d.dest || d.dest === reg.id)) d.dest = REGIONS.find((r) => r.id !== reg.id && r.id !== 'jeju').id;
    const job = { kind: d.kind, ...(d.kind === 'gate' || d.kind === 'hunt' ? { tier: d.tier } : {}), ...(d.kind === 'hunt' ? { n: d.n } : {}), ...(d.kind === 'escort' ? { dest: d.dest } : {}) };
    const btn = (act, v, on, label) => `<button class="sm ${on ? 'primary' : 'ghost'}" data-act="${act}" data-v="${v}">${label}</button>`;
    const contracts = G.mercs().map((n) => {
      const m = n.merc; const [mood, cls] = G.mercMood(n);
      return `<div class="item-row">${this.npcAvatar(n, 36)}<div class="grow"><b>${n.name}</b> ${this.clsTag(n.cls)} <span class="small ${cls}">기분 ${mood}</span>
        <div class="small dim">${MERC_JOBS[m.job.kind].desc(m.job)}${m.job.kind === 'hunt' ? ` (${m.progress}/${m.job.n})` : ''} · 남은 기한 ${Math.max(0, m.until - G.monthKey())}개월 · 잔금 ${fmt(m.bal)}</div></div></div>`;
    }).join('');
    const post = p.mercPost && p.mercPost.region === reg.id && p.mercPost.key === G.monthKey() ? p.mercPost : null;
    const list = G.mercsFor(reg.id);
    const replies = post ? list.map((n) => {
      const r = post.replies.find((x) => x.id === n.id);
      const pay = G.mercJobPay(n, post.job, post.payMul);
      return `<div class="item-row ${r && r.yes ? '' : 'dimmed'}">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${this.clsTag(n.cls, n.rankIdx >= 6 ? 2 : n.rankIdx >= 3 ? 1 : 0)} ${this.rankTag(n.rankIdx, n.stage)} <span class="small dim">성격 ${persById(n.personality).name}</span>
        <div class="small">${r ? r.line : '"…"'}</div></div>
        ${n.hired ? '<span class="small dim">계약됨</span>' : r && r.yes ? `<button class="sm" data-act="hire" data-v="${n.id}" ${G.party().length >= 4 ? 'disabled' : ''}>선금 ${fmt(Math.round(pay / 20) * 10)}<br><span class="small dim">총 ${fmt(pay)}</span></button>` : '<span class="small bad">거절</span>'}</div>`;
    }).join('') : '';
    const tiers = [pr - 1, pr, pr + 1, pr + 2].filter((t) => t >= 0 && t <= 7);
    const dests = REGIONS.filter((r) => r.id !== reg.id && (r.id !== 'jeju' || pr >= 6));
    return `${contracts ? `<div class="sec-title">계약 중인 용병</div><div class="cards">${contracts}</div>` : ''}
      <div class="sec-title sec">모집 공고 쓰기</div>
      <p class="small dim">무엇을 할지 밝혀야 사람이 응한다. 성격마다 좋아하는 일과 감수할 위험, 돈에 대한 태도가 다르다. 계약한 일을 미루면 불만이 쌓여 따지거나 떠나고, 해내면 잔금을 받고 기뻐한다.</p>
      <div class="row wrap"><span class="small dim">할 일</span> ${Object.entries(MERC_JOBS).map(([k, j]) => btn('merc-kind', k, d.kind === k, j.name)).join(' ')}</div>
      ${d.kind === 'gate' || d.kind === 'hunt' ? `<div class="row wrap"><span class="small dim">등급</span> ${tiers.map((t) => btn('merc-tier', t, d.tier === t, RANKS[t].key + '급')).join(' ')}</div>` : ''}
      ${d.kind === 'escort' ? `<div class="row wrap"><span class="small dim">목적지</span> ${dests.map((r) => btn('merc-dest', r.id, d.dest === r.id, r.name)).join(' ')}</div>` : ''}
      <div class="row wrap"><span class="small dim">보수</span> ${MERC_PAY.map((x) => btn('merc-pay', x.id, d.pay === x.id, x.name)).join(' ')}</div>
      <div class="row"><span class="grow small">공고: <b>${MERC_JOBS[d.kind].desc(job)}</b> · 보수 ${MERC_PAY.find((x) => x.id === d.pay).name}</span><button class="primary sm" data-act="merc-post">공고 올리기</button></div>
      ${post ? `<div class="sec-title sec">응답 · ${MERC_JOBS[post.job.kind].desc(post.job)} · 파티 ${G.partySize()}/5</div><div class="cards">${replies}</div>` : `<p class="small dim sec">이번 달 이 도시에 ${list.filter((n) => !n.hired).length}명이 일을 찾고 있다.</p>`}`;
  },
  showMercSay(q) {
    const n = G.npcById(q.npc); if (!n) return this.processQueue();
    this.modal(`<div class="story-portrait">${UI.npcPortrait(n, 120)}<div><div class="eyebrow ${q.tone}">용병 · ${G.fullDate()}</div><b>${n.name}</b><div class="small">${this.rankTag(n.rankIdx, n.stage)} · 성격 ${persById(n.personality).name}</div><div class="small dim">관계 ${relationLabel(n.relation)} (${n.relation})</div></div></div>
      <p class="event-text">${fixJosa(q.text)}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box');
  },
});
{
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) { return id === 'merc' ? this.mercHtml(reg) : baseFac.call(this, id, reg); };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'mercSay') { G.queue.shift(); return this.showMercSay(q); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const d = this.mercDraft;
    switch (act) {
      case 'merc-kind': d.kind = v; return this.afterCity();
      case 'merc-tier': d.tier = +v; return this.afterCity();
      case 'merc-dest': d.dest = v; return this.afterCity();
      case 'merc-pay': d.pay = +v; return this.afterCity();
      case 'merc-post': {
        const job = { kind: d.kind };
        if (d.kind === 'gate' || d.kind === 'hunt') job.tier = d.tier;
        if (d.kind === 'hunt') job.n = d.n;
        if (d.kind === 'escort') job.dest = d.dest;
        return this.afterCity(G.postMercJob(job, d.pay));
      }
      case 'hire': return this.afterCity(G.hireMerc(G.region().id, +v));
      default: return baseHandle.call(this, act, v);
    }
  };
}
