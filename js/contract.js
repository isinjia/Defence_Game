// ===== 게이트 크로니클: 이적시장과 전속 계약 (영역 C) =====
// docs/헌터물_제안3.md 4. 길드 가입을 "계약"으로 바꾼다: 기간(1~3년), 연봉(월 보너스), 계약금, 위약금, 의무(분기당 게이트 n회).
// 계약이 끝나면 다른 길드들이 제안을 넣고(공식 등급·명성·랭킹), 중간 이적은 위약금. 서약을 걸면 연봉이 오르지만 깨면 몸이 대가를 치른다.
// NPC도 매년 1월 이적시장 뉴스. 저장: p.contract = { guild, start, until, salary, buyout, duty, qStart, qDone, warn, oath }

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const p = this.player;
    p.contract ??= null;
    if (p.guild && !p.contract) p.contract = this.makeContract(p.guild, 1, 1, false, true); // 옛 저장: 기본 계약
    this.world.transferRecord ??= 0;
  });

  // 몸값: 공식 등급·명성·랭킹
  GP.marketValue = function () {
    const p = this.player; const off = p.official ?? p.rankIdx;
    let pos = 50; try { pos = this.ranking ? this.ranking().pos : 50; } catch (e) { /* 무시 */ }
    return Math.round(60 * RANKS[off].mult * (1 + Math.min(p.fame, 600) / 300) * (pos <= 3 ? 1.6 : pos <= 10 ? 1.3 : 1));
  };
  GP.makeContract = function (gid, years, mul = 1, oath = false, basic = false) {
    const mk = this.monthKey(); const v = this.marketValue();
    const salary = basic ? 0 : Math.round(v * mul * (oath ? 1.3 : 1));
    return { guild: gid, start: mk, until: mk + 12 * years, years, salary, sign: basic ? 0 : Math.round(salary * 6 * mul), buyout: Math.round((salary + 50 * RANKS[this.player.official ?? 0].mult) * 12 * years * 0.6), duty: Math.min(4, 1 + Math.floor((this.player.official ?? 0) / 2)), qStart: mk, qDone: 0, warn: 0, oath };
  };

  // 제안 만들기
  GP.makeOffers = function (n = 3) {
    const p = this.player;
    const ids = Object.keys(GUILDS).filter((id) => id !== p.guild || (p.contract && p.contract.guild === id)).sort(() => RNG.next() - 0.5);
    const out = [];
    for (const id of ids) {
      if (out.length >= n) break;
      const F = this.world.factions && this.world.factions[id];
      if (F && (F.rel && p.guild && (F.rel[p.guild] || 0) > 40) && RNG.chance(0.5)) continue; // 동맹 길드 선수는 잘 안 건드린다
      if ((p.wanted || 0) >= 1 && id === 'kama') continue;
      if (p.fame < GUILDS[id].fameReq) continue;
      const years = RNG.int(1, 3); const mul = RNG.range(0.85, 1.35) * (id === p.guild ? 1.05 : 1);
      out.push({ ...this.makeContract(id, years, mul, false), renew: id === p.guild });
    }
    return out;
  };

  wrap('joinGuild', function (base) {
    const r = base.call(this);
    const p = this.player;
    if (p.guild && (!p.contract || p.contract.guild !== p.guild)) { p.contract = this.makeContract(p.guild, 1, 1, false, true); }
    return r && p.contract ? `${r} 수습 계약 1년, 분기당 게이트 ${p.contract.duty}회.` : r;
  });

  GP.contractLeft = function () { const c = this.player.contract; return c ? Math.max(0, c.until - this.monthKey()) : 0; };
  GP.currentBuyout = function () { const c = this.player.contract; if (!c) return 0; return Math.round(c.buyout * this.contractLeft() / Math.max(1, c.until - c.start)); };

  // 중간 이탈: 위약금, 서약 파기
  GP.breakContract = function (why, cover = 0) {
    const p = this.player; const c = p.contract; if (!c) return { ok: true, text: '' };
    const left = this.contractLeft(); if (!left) { p.contract = null; return { ok: true, text: '' }; }
    const fee = Math.round(this.currentBuyout() * (1 - cover));
    if (p.money < fee) return { ok: false, text: `위약금 ${fmt(fee)} 크레딧이 없다.` };
    p.money -= fee; p.fame = Math.max(0, p.fame - 10);
    let t = `위약금 ${fmt(fee)} 크레딧을 물었다. (명성 -10)`;
    if (c.oath) {
      p.lifePenalty += 1; p.injured = Math.max(p.injured, 4); this.recalc();
      if (this.noteLifeLoss) this.noteLifeLoss(1, '마나 서약 파기');
      t += ' 마나 서약이 깨지며 에테르 회로가 뒤틀렸다. 수명 -1, 부상 4개월.';
    }
    this.rumor(`${p.name}이(가) ${GUILDS[c.guild].name}과(와)의 계약을 깼다.${why ? ` ${why}` : ''}`, { kind: 'transfer', score: 2 });
    if (this.factionRel && this.factionPrestige) this.factionPrestige(c.guild, -3);
    p.contract = null;
    return { ok: true, text: t };
  };
  wrap('leaveGuild', function (base) {
    const r = this.breakContract('');
    if (!r.ok) return r.text;
    const out = base.call(this);
    return [out, r.text].filter(Boolean).join(' ');
  });

  GP.signOffer = function (o, oath) {
    const p = this.player;
    if (p.guild && p.guild !== o.guild) {
      const r = this.breakContract(`${GUILDS[o.guild].name}의 영입 제안`, 0.5);
      if (!r.ok) return r.text + ' (새 길드가 절반을 부담해도 모자란다)';
      p.guild = null; p.guildRank = 0; p.contrib = 0;
    }
    const c = oath ? { ...o, salary: Math.round(o.salary * 1.3), oath: true } : o;
    if (p.guild !== c.guild) { p.guild = c.guild; p.guildRank = Math.max(0, Math.min(2, (p.official ?? 0) - 2)); p.contrib = 0; }
    p.contract = { ...c, start: this.monthKey(), until: this.monthKey() + 12 * c.years, qStart: this.monthKey(), qDone: 0, warn: 0 };
    p.money += c.sign;
    const big = c.sign >= (this.world.transferRecord || 0) && c.sign > 0;
    if (big) this.world.transferRecord = c.sign;
    this.rumor(`${p.name}, ${GUILDS[c.guild].name}과(와) ${c.years}년 ${o.renew ? '재계약' : '전속 계약'}. 계약금 ${fmt(c.sign)} 크레딧${big ? ' · 역대 최고' : ''}.${c.oath ? ' 마나 서약까지 걸었다.' : ''}`, { kind: 'transfer', score: big ? 5 : 2 });
    this.lifeEvent(`${GUILDS[c.guild].name}과(와) ${c.years}년 계약을 맺었다.`);
    return `${GUILDS[c.guild].name}과(와) ${c.years}년 계약. 계약금 ${fmt(c.sign)} 크레딧, 월 보너스 ${fmt(c.salary)} 크레딧, 분기당 게이트 ${c.duty}회.`;
  };

  // 의무 집계: 게이트 공략
  wrap('finishGate', function (base, gate, result, ...rest) {
    const lines = base.call(this, gate, result, ...rest);
    const c = this.player.contract;
    if (c && result === 'clear' && this.player.guild === c.guild) c.qDone++;
    return lines;
  });

  GP.contractMonthly = function () {
    const p0 = this.player;
    if (p0.guild && (!p0.contract || p0.contract.guild !== p0.guild)) p0.contract = this.makeContract(p0.guild, 1, 1, false, true); // 다른 경로로 들어간 길드
    const p = this.player; const c = p.contract; const mk = this.monthKey();
    if (c && p.guild === c.guild) {
      if (c.salary) p.money += c.salary;
      if (mk - c.qStart >= 3) {
        if (c.qDone < c.duty) {
          c.warn++;
          this.log(`${GUILDS[c.guild].name}: 이번 분기 의무 게이트 ${c.qDone}/${c.duty}. ${c.warn >= 2 ? '계약 해지 통보를 받았다.' : '경고를 받았다.'}`, 'bad');
          if (c.warn >= 2) { p.contract = null; const g = GUILDS[p.guild]; p.guild = null; p.guildRank = 0; p.contrib = 0; p.fame = Math.max(0, p.fame - 8); this.rumor(`${g.name}, 의무 불이행으로 ${p.name}과(와)의 계약 해지.`, { kind: 'transfer', score: 2 }); }
        } else if (c.warn) c.warn = 0;
        if (p.contract) { c.qStart = mk; c.qDone = 0; }
      }
      if (p.contract && mk >= c.until) { this.queue.push({ type: 'offers', reason: 'end' }); }
      else if (p.contract && (p.official ?? 0) >= 4 && RNG.chance(0.03)) this.queue.push({ type: 'offers', reason: 'scout' });
    } else if (!p.guild && (p.official ?? 0) >= 2 && p.fame >= 20 && RNG.chance(0.05)) this.queue.push({ type: 'offers', reason: 'free' });
    if (c && !p.guild) p.contract = null;
  };

  // NPC 이적시장 (매년 1월)
  GP.npcTransferMarket = function () {
    const cand = this.adults().filter((n) => n.guild && n.guild !== 'kama' && n.rankIdx >= 3 && !n.isCompanion && !n.retired && (n.amb === 'wealth' || n.amb === 'power' || (n.cash || 0) < 0 || RNG.chance(0.1)));
    const moves = cand.sort(() => RNG.next() - 0.5).slice(0, RNG.int(1, 3));
    for (const n of moves) {
      const to = RNG.pick(Object.keys(GUILDS).filter((g) => g !== n.guild && g !== 'kama'));
      const fee = Math.round(1500 * RANKS[n.rankIdx].mult * RNG.range(0.7, 1.5));
      const from = n.guild; n.guild = to; n.cash = (n.cash || 0) + Math.round(fee * 0.3);
      const big = fee > (this.world.transferRecord || 0);
      if (big) this.world.transferRecord = fee;
      if (this.factionRel) this.factionRel(from, to, -6);
      if (n.rankIdx >= 4 || n.met || big) this.rumor(`이적시장: ${RANKS[n.rankIdx].key}급 ${n.name}, ${GUILDS[from].name} → ${GUILDS[to].name}. 이적료 ${fmt(fee)} 크레딧${big ? ', 역대 최고' : ''}.`, { kind: 'transfer', score: big ? 4 : 1 });
      if (n.met && this.npcRemember) this.npcRemember(n, `${GUILDS[to].name}(으)로 이적했다`);
    }
  };

  wrap('worldMonthly', function (base) {
    base.call(this);
    this.contractMonthly();
    if (this.month === 1) this.npcTransferMarket();
  });
}

if (typeof UI !== 'undefined') {
  UI.showOffers = function (reason) {
    const offers = G.makeOffers(3); this.curOffers = offers;
    const p = G.player; const c = p.contract;
    const head = reason === 'end' ? `${GUILDS[c.guild].name}과(와)의 계약이 끝났다. 제안서가 쌓였다.` : reason === 'scout' ? `몸값이 올랐다. 다른 길드에서 스카우트 제의가 왔다. 지금 옮기면 위약금 ${fmt(G.currentBuyout())} 크레딧 중 절반을 새 길드가 부담한다.` : '자유 계약 신분인 당신에게 길드들이 연락해 왔다.';
    const row = (o, i) => `<div class="item-row"><div class="grow"><b style="color:${GUILDS[o.guild].color}">${GUILDS[o.guild].name}</b> <span class="small">${o.renew ? '재계약' : '영입'} · ${o.years}년</span>
      <div class="small dim">계약금 ${fmt(o.sign)} · 월 보너스 ${fmt(o.salary)} · 분기당 게이트 ${o.duty}회 · 위약금 ${fmt(o.buyout)}</div>
      <div class="row"><button class="sm primary" data-act="offer-sign" data-v="${i}:0">계약</button><button class="sm" data-act="offer-sign" data-v="${i}:1">마나 서약까지 (연봉 +30%, 깨면 수명)</button></div></div></div>`;
    if (!offers.length) return this.processQueue();
    this.modal(`<div class="eyebrow">이적시장</div><h3>계약 제안</h3><p class="event-text">${head}</p>
      <div class="cards">${offers.map(row).join('')}</div>
      <div class="row end"><button class="ghost" data-act="offer-skip">${reason === 'end' ? '자유 계약으로 남는다' : '거절한다'}</button></div>`, 'event-box');
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'offers') { G.queue.shift(); if (G.queue.some((x) => x.type === 'offers')) G.queue = G.queue.filter((x) => x.type !== 'offers'); return this.showOffers(q.reason); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'offer-sign') { const [i, oath] = String(v).split(':'); const o = this.curOffers && this.curOffers[+i]; this.closeModal(); return this.after(o ? G.signOffer(o, oath === '1') : ''); }
    if (act === 'offer-skip') {
      this.closeModal(); const p = G.player;
      if (p.contract && G.contractLeft() === 0) { const g = GUILDS[p.guild]; p.contract = null; p.guild = null; p.guildRank = 0; p.contrib = 0; return this.after(`${g.name}을(를) 떠나 자유 계약 신분이 됐다.`); }
      return this.after('제안을 거절했다.');
    }
    return baseHandle.call(this, act, v);
  };
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () {
    const html = baseGuild.call(this);
    const c = G.player.contract; if (!c || G.player.guild !== c.guild) return html;
    const card = `<div class="panel sec"><h3>전속 계약</h3><div class="small">남은 기간 <b>${G.contractLeft()}개월</b> · 월 보너스 ${fmt(c.salary)} · 이번 분기 게이트 <b>${c.qDone}/${c.duty}</b>${c.warn ? ' <span class="bad">경고 1회</span>' : ''}${c.oath ? ' · <span class="bad">마나 서약</span>' : ''}</div>
      <div class="small dim">중간에 나가면 위약금 ${fmt(G.currentBuyout())} 크레딧. 몸값(월) ${fmt(G.marketValue())}.</div></div>`;
    return html + card;
  };
}
