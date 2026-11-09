// ===== 게이트 크로니클: 악행·수배, 각성자 여론·규제법 (영역 C) =====
// docs/헌터물_제안2.md 6·7.
// 악행: p.infamy(악명). 무고한 생사결, 음모 가담·협박, 밀입(p.outlaw) 등이 올린다. 성향 p.law(life.js)도 함께 움직인다.
//   악명 40/80/140 → 수배 1~3단계(p.wanted). 현상금 사냥꾼 기습, 협회 의뢰·재측정 제한. 벌금·봉사·자수로 낮춘다.
// 여론: world.opinion(−100~100). 브레이크·네임드·각성자 범죄·비리는 내리고, 저지·월드 퍼스트·폭로는 올린다.
//   −40 이하면 규제법 표결(통과 시 게이트 수익 특별세 10%), +40 이상이면 우대법(물가 −5%). 0을 넘어 돌아오면 폐지.

const WANTED_STEPS = [40, 80, 140];
const WANTED_NAME = ['', '관리국 주의 인물', '지명 수배', '1급 현상 수배'];

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const p = this.player; const w = this.world;
    p.infamy ??= 0; p.wanted ??= 0; p.sins ??= 0;
    w.opinion ??= 0; w.lawReg ??= false; w.lawFavor ??= false;
  });

  // ---------- 악행 ----------
  GP.wantedLevel = function () {
    const p = this.player; const v = (p.infamy || 0) + Math.round((p.outlaw || 0) / 2);
    return WANTED_STEPS.filter((s) => v >= s).length;
  };
  GP.addSin = function (n, why) {
    const p = this.player;
    p.sins = (p.sins || 0) + n; p.infamy = Math.max(0, (p.infamy || 0) + n * 6);
    if (this.addLaw) this.addLaw(-n * 3, why);
    this.updateWanted(why);
  };
  GP.updateWanted = function (why) {
    const p = this.player; const lv = this.wantedLevel();
    if (lv === p.wanted) return;
    const up = lv > p.wanted; p.wanted = lv;
    if (up) {
      const bounty = this.wantedBounty();
      this.rumor(`관리국이 ${RANKS[p.official ?? p.rankIdx].key}급 ${p.name}을(를) ${WANTED_NAME[lv]}(으)로 공시했다.${why ? ` 사유: ${why}.` : ''} 현상금 ${fmt(bounty)} 크레딧.`, { kind: 'wanted', score: 4 + lv });
      this.log(`수배 ${lv}단계: ${WANTED_NAME[lv]}. 현상금 사냥꾼이 움직이기 시작한다.`, 'major');
      this.addOpinion(-2 - lv, '각성자 범죄');
    } else this.log(lv ? `수배 단계가 ${lv}로 내려갔다.` : '수배가 풀렸다.', 'good');
  };
  GP.wantedBounty = function () { const p = this.player; return Math.round(500 * RANKS[p.rankIdx].mult * Math.max(1, p.wanted)); };

  // 무고한 생사결
  wrap('finishDuel', function (base, n, won, ...rest) {
    const innocent = n && !(n.relation <= -20 || persById(n.personality).id === 'warlike' || n.arch === 'villain' || n.bountyHunter || n.nemesis === 'player');
    const r = base.call(this, n, won, ...rest);
    if (won && n) {
      if (innocent) this.addSin(3, '무고한 헌터 살해');
      else if (n.bountyHunter) { this.player.infamy += 4; this.updateWanted('현상금 사냥꾼 살해'); }
    }
    return r;
  });

  // 현상금 사냥꾼
  GP.bountyHunterRoll = function () {
    const p = this.player; if (!p.wanted || !RNG.chance(0.04 * p.wanted)) return;
    let n = this.adults().find((x) => x.bountyHunter && x.alive && x.target === 'player');
    if (!n) {
      n = this.makeNpc(false); this.npcs.push(n);
      n.rankIdx = Math.min(7, p.rankIdx + (p.wanted >= 3 ? 1 : 0)); n.stage = RNG.int(0, 2);
      n.personality = RNG.pick(['cold', 'greedy', 'just']); n.bountyHunter = true; n.target = 'player';
      n.ageMonths = (26 + n.rankIdx * 3 + RNG.int(0, 10)) * 12; n.lifespan = Math.max(n.lifespan, Math.floor(n.ageMonths / 12) + 10);
      if (typeof ARCH !== 'undefined') { n.arch = null; }
    }
    n.region = p.region; n.met = true; n.relation = Math.min(n.relation, -40);
    if (this.npcRemember) this.npcRemember(n, `당신의 현상금 ${fmt(this.wantedBounty())} 크레딧을 노린다`);
    this.queue.push({ type: 'ambush', npcId: n.id });
  };

  // 갚는 길
  GP.payFine = function () {
    const p = this.player; if (!p.wanted && !p.infamy) return '';
    if (p.wanted >= 2) return '지명 수배 이상은 벌금으로 끝나지 않는다. 자수하거나 봉사로 죄를 갚아야 한다.';
    const cost = Math.round(300 * RANKS[p.rankIdx].mult + p.infamy * 20);
    if (p.money < cost) return '크레딧이 부족하다.';
    p.money -= cost; p.infamy = Math.max(0, p.infamy - 25); if (this.addLaw) this.addLaw(4, '벌금 납부');
    this.updateWanted();
    return `벌금 ${fmt(cost)} 크레딧을 냈다. 악명이 조금 옅어졌다.`;
  };
  GP.serveCommunity = function () {
    const p = this.player; if (!p.infamy) return '';
    if (!this.onCity()) return '봉사는 도시의 협회 의뢰소에서 신청한다.';
    if (p.wanted >= 3) return '1급 수배자는 봉사를 신청할 수 없다. 자수뿐이다.';
    p.infamy = Math.max(0, p.infamy - 15); if (this.addLaw) this.addLaw(3, '사회 봉사');
    this.addRep && this.addRep(this.region().id, 3);
    this.advanceMonth(1, { eventChance: 0 });
    this.updateWanted();
    return '한 달 동안 브레이크 피해 복구 현장에서 일했다. 악명 −15.';
  };
  GP.surrender = function () {
    const p = this.player; if (!p.wanted) return '';
    const months = p.wanted + 1; const fine = Math.round(p.money * 0.3);
    p.money -= fine; p.infamy = Math.floor(p.infamy * 0.3); p.outlaw = Math.floor((p.outlaw || 0) * 0.5);
    if (this.addLaw) this.addLaw(10, '자수');
    for (const n of this.adults().filter((x) => x.bountyHunter && x.target === 'player')) n.target = null;
    this.lifeEvent(`자수해 ${months}개월을 각성자 수용소에서 보냈다.`);
    this.advanceMonth(months, { eventChance: 0 });
    this.updateWanted();
    this.addOpinion(1, '');
    return `자수했다. ${months}개월 수감, 재산 ${fmt(fine)} 크레딧 몰수. 다시 시작할 수 있다.`;
  };

  // 수배 중 제한
  wrap('acceptBounty', function (base, qid) {
    if ((this.player.wanted || 0) >= 2) return '수배자에게는 협회 의뢰를 내주지 않는다.';
    return base.call(this, qid);
  });
  wrap('remeasure', function (base) {
    if ((this.player.wanted || 0) >= 1) return '관리국 측정소 입구에서 신분 조회에 걸렸다. 수배가 풀리기 전엔 재측정을 받을 수 없다.';
    return base.call(this);
  });

  // ---------- 여론 ----------
  GP.opinionLabel = function (v = this.world.opinion) { return v >= 60 ? '열광' : v >= 25 ? '우호적' : v >= -25 ? '엇갈림' : v >= -60 ? '냉담' : '적대적'; };
  GP.addOpinion = function (d, why) {
    const w = this.world; if (!w || !d) return;
    w.opinion = Math.max(-100, Math.min(100, (w.opinion || 0) + d));
  };
  // 소식으로 여론이 움직인다
  wrap('rumor', function (base, text, meta = {}) {
    base.call(this, text, meta);
    if (!this.world || this.world.opinion == null) return;
    const k = meta.kind || '';
    if (k === 'break') this.addOpinion(-8);
    else if (/^named/.test(k) && /희생자|당했다/.test(text) && !/쓰러뜨렸다|사살/.test(text)) this.addOpinion(-1);
    else if (/^named/.test(k) && /쓰러뜨렸다|사살/.test(text)) this.addOpinion(2);
    else if (k === 'worldfirst') this.addOpinion(3);
    else if (k === 'plot' && /폭로/.test(text)) this.addOpinion(-2);
    else if (k === 'scandal') this.addOpinion(-1);
    else if (k === 'eco-ok' && /[ABS]+급 게이트를 닫았다/.test(text)) this.addOpinion(1);
    else if (/브레이크의 핵을 베었다|브레이크를 막았다/.test(text)) this.addOpinion(7);
    else if (/상처가 깊다/.test(text)) this.addOpinion(-6);
    else if (/체포했다/.test(text)) this.addOpinion(1);
  });

  GP.opinionMonthly = function () {
    const w = this.world; const mk = this.monthKey();
    w.opinion = Math.round(w.opinion * 0.97 + RNG.int(-3, 3)); // 서서히 잊히고, 세상 분위기는 늘 출렁인다
    w.opinion = Math.max(-100, Math.min(100, w.opinion));
    const p = this.player;
    if (mk % 6 === 0 && p.infamy > 0) p.infamy--; // 악명도 세월에 옅어진다
    if ((p.followers || 0) >= 10000 && p.law > 0 && RNG.chance(0.2)) this.addOpinion(1);
    // 규제법
    if (!w.lawReg && w.opinion <= -35 && (!w.lawVote || mk - w.lawVote > 12) && RNG.chance(0.35)) {
      w.lawVote = mk;
      const pass = RNG.chance(0.45 + (-w.opinion - 35) / 100);
      if (pass) { w.lawReg = true; w.lawFavor = false; this.rumor('속보: 국회, 각성자 관리 강화법 가결. 게이트 수익에 특별세 10%가 붙고, 등록 갱신이 깐깐해진다.', { kind: 'law', score: 6 }); }
      else this.rumor('각성자 관리 강화법이 국회 문턱에서 부결됐다. 시민 단체가 거리로 나섰다.', { kind: 'law', score: 3 });
    } else if (w.lawReg && w.opinion >= -10 && RNG.chance(0.3)) { w.lawReg = false; this.rumor('여론이 돌아서며 각성자 관리 강화법이 폐지됐다.', { kind: 'law', score: 4 }); }
    // 우대법
    if (!w.lawFavor && w.opinion >= 35 && (!w.lawVote || mk - w.lawVote > 12) && RNG.chance(0.3)) {
      w.lawVote = mk; w.lawFavor = true; w.lawReg = false;
      this.rumor('각성자 지원법 통과. 헌터 등록증을 보이면 생필품·장비 가게에서 할인을 받는다.', { kind: 'law', score: 5 });
    } else if (w.lawFavor && w.opinion < 0) { w.lawFavor = false; this.rumor('각성자 지원법이 예산 문제로 중단됐다.', { kind: 'law', score: 2 }); }
    // 시위
    if (w.opinion <= -60 && RNG.chance(0.15)) this.rumor(`${regionById(RNG.pick(REGIONS.filter((r) => r.id !== 'jeju')).id).name}에서 "각성자 특권 폐지" 대규모 시위가 열렸다.`, { kind: 'protest', score: 2 });
  };

  wrap('worldMonthly', function (base) { base.call(this); this.opinionMonthly(); this.bountyHunterRoll(); this.updateWanted(); });

  // 특별세·지원법
  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    let tax = 0;
    if (this.world.lawReg && loot && result !== 'lose' && loot.money > 0) { tax = Math.round(loot.money * 0.1); loot.money -= tax; }
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (tax && Array.isArray(lines)) lines.push(`각성자 특별세 ${fmt(tax)} 크레딧이 원천징수됐다.`);
    return lines;
  });
  wrap('priceMul', function (base) { const m = base.call(this); return this.world && this.world.lawFavor ? m * 0.95 : m; });
  wrap('resolveBreak', function (base, r) { const out = base.call(this, r); this.addOpinion(6); return out; });

  // 청문회 사건: 답변이 여론을 움직인다
  const ev = typeof STORY !== 'undefined' && STORY.find((e) => e.id === 'media_hearing');
  if (ev && ev.choices) {
    const d = [6, -3, 0];
    ev.choices.forEach((c, i) => { const f = c.do; c.do = (g, ctx) => { const r = f(g, ctx); if (d[i]) g.addOpinion(d[i]); return r; }; });
  }
}

if (typeof UI !== 'undefined') {
  // 협회 게시판: 여론·법·수배
  const baseBoard = UI.remeasureHtml;
  if (baseBoard) UI.remeasureHtml = function () {
    const html = baseBoard.call(this);
    const p = G.player; const w = G.world;
    const law = w.lawReg ? '<span class="bad">각성자 관리 강화법 시행 중 (게이트 수익 특별세 10%)</span>' : w.lawFavor ? '<span class="good">각성자 지원법 시행 중 (물가 −5%)</span>' : '시행 중인 각성자 특별법 없음';
    const op = `<div class="item-row"><div class="grow"><b>각성자 여론</b> <span class="small">${G.opinionLabel()} <span class="num dim">${w.opinion}</span></span><div class="small dim">${law}</div></div></div>`;
    let wanted = '';
    if (p.infamy > 0 || p.wanted) {
      wanted = `<div class="item-row ${p.wanted ? 'hl' : ''}"><div class="grow"><b class="${p.wanted ? 'bad' : ''}">${p.wanted ? WANTED_NAME[p.wanted] : '악명'}</b> <span class="small dim">악명 ${p.infamy}${p.wanted ? ` · 현상금 ${fmt(G.wantedBounty())}` : ''}</span>
        <div class="small dim">${p.wanted >= 2 ? '협회 의뢰·재측정을 받을 수 없다. 현상금 사냥꾼이 쫓는다.' : p.wanted ? '재측정을 받을 수 없다. 가끔 현상금 사냥꾼이 찾아온다.' : '쌓이면 수배된다.'}</div>
        <div class="row">${p.wanted < 2 ? '<button class="sm" data-act="law-fine">벌금</button>' : ''}${p.wanted < 3 ? '<button class="sm" data-act="law-serve">봉사 · 1개월</button>' : ''}${p.wanted ? '<button class="sm danger" data-act="law-surrender">자수</button>' : ''}</div></div></div>`;
    }
    return html + op + wanted;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'law-fine') return this.after(G.payFine());
    if (act === 'law-serve') return this.after(G.serveCommunity());
    if (act === 'law-surrender') return this.after(G.surrender());
    return baseHandle.call(this, act, v);
  };
}
