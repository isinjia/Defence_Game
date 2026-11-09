// ===== 게이트 크로니클: 광고·예능 활동 (영역 C-8) =====
// docs/헌터물_제안4_결합장르.md 5. 명성·구독자에 따라 광고 계약과 예능 출연 제의가 반복해서 들어온다.
// 이미지(호감·논란)를 관리해야 한다. 광고에는 이미지 조건이 붙고, 어기면 위약금과 논란 뉴스.
// 저장: p.image = { like, scandal }, p.deals = [{ id, brand, until, pay, clause, sign }]

const CELEB_BRANDS = ['에테르 음료 "블루 코어"', '헌터 전용 아웃도어 "리프트기어"', '보험사 "든든 헌터 보장"', '치킨 프랜차이즈 "게이트치킨"', '스마트워치 "S-RANK"', '라면 "브레이크면"', '안경 브랜드 "마나렌즈"', '자동차 "현무 모터스"'];
const CELEB_CLAUSES = {
  noDuel:    { name: '계약 기간 생사결 금지', hint: '생사결에서 사람을 베면 위반' },
  noRetreat: { name: '"무패 헌터" 이미지 유지', hint: '게이트 철수·패배 2회면 위반' },
  clean:     { name: '범죄 연루 금지', hint: '악명이 쌓이거나 수배되면 위반' },
  family:    { name: '가족 친화 이미지', hint: '연인과 헤어지거나 무고한 살인을 하면 위반' },
};
const CELEB_SHOWS = ['헌터 생존 예능 "게이트 런"', '토크쇼 "S급의 밤"', '먹방 예능 "던전 밥상"', '육아 관찰 예능 "우리 집 각성자"', '퀴즈쇼 "랭킹을 맞혀라"'];

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  wrap('initSandbox', function (base) {
    base.call(this);
    const p = this.player;
    p.image ??= { like: 50, scandal: 0 };
    p.deals ??= [];
  });

  GP.celebStar = function () { const p = this.player; return Math.min(1, p.fame / 400 + (p.followers || 0) / 300000); };
  GP.imageLabel = function () { const im = this.player.image; return im.scandal >= 50 ? '논란의 중심' : im.scandal >= 25 ? '구설수' : im.like >= 75 ? '국민 호감' : im.like >= 55 ? '호감' : im.like <= 30 ? '비호감' : '무난'; };
  GP.celebPay = function () {
    const p = this.player; const im = p.image; const op = this.world && this.world.opinion != null ? this.world.opinion : 0;
    return Math.round((300 + p.fame * 6 + (p.followers || 0) / 50) * (0.6 + im.like / 100) * (1 - im.scandal / 150) * (1 + op / 200));
  };

  GP.celebMakeOffer = function () {
    const p = this.player;
    if (RNG.chance(0.55)) {
      const clause = RNG.pick(Object.keys(CELEB_CLAUSES));
      const months = RNG.pick([6, 9, 12]); const pay = this.celebPay();
      return { kind: 'ad', brand: RNG.pick(CELEB_BRANDS.filter((b) => !p.deals.some((d) => d.brand === b))), months, pay, sign: pay * 2, clause };
    }
    return { kind: 'show', show: RNG.pick(CELEB_SHOWS), fee: Math.round(this.celebPay() * 1.5) };
  };

  GP.celebAcceptAd = function (o) {
    const p = this.player;
    p.deals.push({ id: Math.random().toString(36).slice(2, 7), brand: o.brand, until: this.monthKey() + o.months, pay: o.pay, clause: o.clause, sign: o.sign, strikes: 0, start: this.monthKey() });
    p.money += o.sign; p.fame += 3;
    this.rumor(`${p.name}, ${o.brand} 광고 모델 발탁. 계약금 ${fmt(o.sign)} 크레딧.`, { kind: 'celeb', score: 2 });
    return `${o.brand} 광고 모델 계약. 계약금 ${fmt(o.sign)} 크레딧, 석 달마다 ${fmt(o.pay)} 크레딧. 조건: ${CELEB_CLAUSES[o.clause].name}.`;
  };

  // 예능 출연: 태도에 따라 결과가 갈린다
  GP.celebShow = function (o, style) {
    const p = this.player; const im = p.image;
    p.money += o.fee; this.advanceDays && this.advanceDays(7, { eventChance: 0 });
    let t = `${o.show} 출연. 출연료 ${fmt(o.fee)} 크레딧. `;
    if (style === 'honest') { im.like = Math.min(100, im.like + 6); p.fame += 4; p.followers = (p.followers || 0) + 2000; t += '꾸밈없는 모습에 호감이 올랐다.'; }
    else if (style === 'funny') {
      if (RNG.chance(0.7)) { im.like = Math.min(100, im.like + 10); p.fame += 8; p.followers = (p.followers || 0) + 6000; t += '예능감이 터졌다. 짤이 온 커뮤니티를 돌았다.'; this.rumor(`${o.show}에 나온 ${p.name}, 의외의 예능감으로 화제.`, { kind: 'celeb', score: 2 }); }
      else { im.like -= 4; t += '웃기려다 분위기가 싸해졌다. 편집이 살렸다.'; }
    } else {
      if (RNG.chance(0.5)) { p.fame += 12; p.followers = (p.followers || 0) + 8000; im.scandal += 10; t += '독설이 클립으로 퍼졌다. 팬도 안티도 늘었다.'; }
      else { this.celebScandal('방송 중 막말 논란', 18); t += '선을 넘었다. 방송 직후 사과문을 올려야 했다.'; }
    }
    if (this.npcRemember) for (const n of this.adults().filter((x) => x.met && x.relation >= 30).slice(0, 3)) this.npcRemember(n, `당신이 ${o.show}에 나온 걸 봤다`);
    return t;
  };

  GP.celebScandal = function (why, v) {
    const p = this.player; const im = p.image;
    im.scandal = Math.min(100, im.scandal + v); im.like = Math.max(0, im.like - Math.round(v / 2));
    this.rumor(`${p.name} ${why}. 광고주들이 촉각을 곤두세운다.`, { kind: 'scandal', score: 3 });
    if (this.addOpinion) this.addOpinion(-1);
  };

  // 조건 위반
  GP.celebViolate = function (clause, why) {
    const p = this.player;
    for (const d of [...p.deals]) {
      if (d.clause !== clause) continue;
      if (clause === 'noRetreat' && ++d.strikes < 2) continue;
      const fee = d.sign * 2;
      p.money = Math.max(0, p.money - fee);
      p.deals = p.deals.filter((x) => x !== d);
      this.celebScandal(`${why}로 ${d.brand} 광고 계약 위반`, 25);
      this.log(`${d.brand}: 계약 조건(${CELEB_CLAUSES[clause].name}) 위반. 위약금 ${fmt(fee)} 크레딧, 광고 중단.`, 'bad');
    }
  };
  wrap('finishDuel', function (base, n, won, ...rest) {
    const r = base.call(this, n, won, ...rest);
    if (won) this.celebViolate('noDuel', '생사결');
    return r;
  });
  wrap('finishGate', function (base, gate, result, ...rest) {
    const lines = base.call(this, gate, result, ...rest);
    if (result === 'retreat' || result === 'lose') this.celebViolate('noRetreat', result === 'lose' ? '게이트 패배' : '게이트 철수');
    return lines;
  });
  if (GP.addSin) wrap('addSin', function (base, n, why) {
    base.call(this, n, why);
    this.celebViolate('clean', why || '범죄 연루');
    if (why && /무고한/.test(why)) this.celebViolate('family', why);
  });

  GP.celebMonthly = function () {
    const p = this.player; const im = p.image; const mk = this.monthKey();
    // 연애 상대가 사라지면 가족 친화 조건 위반
    if (p._lastPartner && !p.partner && !p.spouse) this.celebViolate('family', '결별 소식');
    p._lastPartner = p.partner || p.spouse || null;
    // 계약 수입·만료
    for (const d of [...p.deals]) {
      if ((mk - d.start) % 3 === 0 && mk > d.start) p.money += d.pay;
      if (mk >= d.until) { p.deals = p.deals.filter((x) => x !== d); this.log(`${d.brand} 광고 계약이 끝났다.`); im.like = Math.min(100, im.like + 2); }
    }
    // 이미지 회복과 논란의 대가
    im.scandal = Math.max(0, im.scandal - 2);
    im.like += im.like < 50 ? 1 : im.like > 60 ? -0.5 : 0;
    if (im.scandal >= 40) { p.followers = Math.floor((p.followers || 0) * 0.97); if (RNG.chance(0.2)) p.fame = Math.max(0, p.fame - 2); }
    if ((p.wanted || 0) >= 1) im.scandal = Math.min(100, im.scandal + 3);
    // 제의
    const star = this.celebStar();
    if (star >= 0.12 && im.scandal < 60 && p.deals.length < 3 && RNG.chance(0.06 + star * 0.2)) this.queue.push({ type: 'celeb' });
  };
  wrap('worldMonthly', function (base) { base.call(this); this.celebMonthly(); });
}

if (typeof UI !== 'undefined') {
  UI.showCeleb = function () {
    const o = G.celebMakeOffer(); this.curCeleb = o;
    if (o.kind === 'ad') {
      const C = CELEB_CLAUSES[o.clause];
      this.modal(`<div class="eyebrow">광고 제의</div><h3>${o.brand}</h3>
        <p class="event-text">매니저 번호로 전화가 왔다. "${o.brand}에서 모델 제안이 들어왔어요. 이미지가 딱이래요."</p>
        <div class="small">계약금 ${fmt(o.sign)} · 석 달마다 ${fmt(o.pay)} · ${o.months}개월</div>
        <div class="small bad">조건: ${C.name} (${C.hint}). 어기면 위약금 ${fmt(o.sign * 2)}와 논란.</div>
        <div class="row end"><button class="ghost" data-act="celeb-no">거절</button><button class="primary" data-act="celeb-ad">계약</button></div>`, 'event-box');
    } else {
      this.modal(`<div class="eyebrow">예능 출연 제의</div><h3>${o.show}</h3>
        <p class="event-text">작가에게서 섭외 메시지가 왔다. "녹화는 일주일이에요. 출연료 ${fmt(o.fee)} 크레딧. 편하게 와 주세요!"</p>
        <div class="cards">
          <button class="choice-btn" data-act="celeb-show" data-v="honest">꾸밈없이 임한다 <span class="small dim">호감 조금</span></button>
          <button class="choice-btn" data-act="celeb-show" data-v="funny">예능감을 불태운다 <span class="small dim">대박 또는 싸늘</span></button>
          <button class="choice-btn" data-act="celeb-show" data-v="edgy">독설 캐릭터로 간다 <span class="small dim">화제성, 논란 위험</span></button>
          <button class="choice-btn" data-act="celeb-no">거절한다</button>
        </div>`, 'event-box');
    }
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'celeb') { G.queue.shift(); return this.showCeleb(); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const o = this.curCeleb;
    if (act === 'celeb-ad') { this.closeModal(); return this.after(o ? G.celebAcceptAd(o) : ''); }
    if (act === 'celeb-show') { this.closeModal(); return this.after(o ? G.celebShow(o, v) : ''); }
    if (act === 'celeb-no') { this.closeModal(); return this.after('정중히 거절했다.'); }
    return baseHandle.call(this, act, v);
  };
  // 정보 창: 연예 활동
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this);
    const p = G.player; const im = p.image; if (!im) return html;
    if (G.celebStar() < 0.08 && !p.deals.length) return html;
    const deals = p.deals.map((d) => `<div class="small">${d.brand} · ${d.until - G.monthKey()}개월 남음 · <span class="bad">${CELEB_CLAUSES[d.clause].name}</span></div>`).join('') || '<div class="small dim">진행 중인 광고 없음</div>';
    const box = `<div class="sec"><div class="sec-title">연예 활동</div><div class="cards"><div class="item-row"><div class="grow">
      이미지 <b>${G.imageLabel()}</b> <span class="small dim">호감 ${Math.round(im.like)} · 논란 ${Math.round(im.scandal)}</span>${deals}</div></div></div></div>`;
    const at = html.lastIndexOf('<div class="sec"><div class="sec-title">인생 기록');
    return at >= 0 ? html.slice(0, at) + box + html.slice(at) : html + box;
  };
}
