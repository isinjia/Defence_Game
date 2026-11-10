// ===== 소속별 수입 구조 (영역 E-10, 사용자 요청) =====
// "무소속은 능력에 비례 배분, 길드·보호국은 월급제 + 인센티브. 보호국은 인센이 매우 짜고 월급도 적다.
//  길드는 유망주에게 파격 지원. 축구랑 비슷하고 보호국은 상무."
//
// 한곳에서 정한다(중복 제거):
//  - 무소속: 지금처럼 전리품을 직접 갖는다(솔로 보너스, 자유 동료와는 능력(전투력) 비례: balance.js / 남의 파티 75%: crew.js).
//  - 길드(대형·중소): 계약제(contract.js)의 월급 하나만 받는다(game.js의 옛 직위 월급은 끈다).
//      게이트 전리품 크레딧은 길드에 귀속 → 월말에 성과급(계약 조건의 %)으로 돌려받는다.
//      유망주(재능·나이 대비 등급)는 계약금·월급·훈련비·장비 지원이 파격적이다. 중소 길드는 월급이 적고 성과급 비율이 높다.
//  - 관리국(보호국, 상무): 월급은 civil.js 의 공무원 봉급 하나. 성과급은 귀속 전리품의 12%뿐.
//      대신 공상(부상) 보상, 매달 공적, 유족 보상금, 의무 복무 24개월(조기 전역은 공적·명성·성향 손실).
//  - 월말 정산은 기록·정보 창·길드 탭에 그대로 보인다.

const PAY_TERMS = {
  big: { salary: 1, inc: [0.45, 0.65], sign: 1, label: '대형 길드' },
  minor: { salary: 0.7, inc: [0.6, 0.75], sign: 0.5, label: '지역 중소 길드' },
  kama: { salary: 0, inc: [0.12, 0.12], sign: 0, label: '관리국(보호국)' },
};
const KAMA_SERVICE = 24; // 의무 복무 개월
// 집결 지각·불참 불이익(D leader_rule.js RALLY와 이어짐). docs/E_수치.md
const LEADER_CUT = 0.1; // 리더 몫 (팀 수입에서 먼저 뗀다)
const RALLY_PAY = {
  latePerDay: 0.1, lateMin: 0.6,   // 무소속 팀: 늦은 날마다 그 원정 배당 −10%(최저 60%)
  incPerDay: 0.1, incMin: 0.5,      // 소속: 그달 지각 일수마다 성과급 비율 −10%(최저 절반)
  missSalaryCut: 0.2,               // 소속: 불참 1회마다 그달 월급 20% 감봉
  disciplineAfter: 2,               // 소속: 한 달에 불참 2회면 징계(계약 경고 +1)
};

Object.assign(Game.prototype, {
  payrollActive: true,
  payKind(gid) { const g = gid && GUILDS[gid]; if (!g) return null; return gid === 'kama' ? 'kama' : g.minor ? 'minor' : 'big'; },
  // 유망주: 재능이 높거나, 나이에 비해 등급이 높다
  isProspect() {
    const p = this.player; if (!p) return false;
    const age = this.ageYears(); const expect = Math.max(0, Math.floor((age - 19) / 3));
    return p.talent >= 7 || (p.rankIdx >= expect + 2 && age <= 30) || ((p.record && p.record.gates) || 0) >= 20 + 10 * p.rankIdx;
  },
  // 기본 월급: 공식 등급·직위
  payBase(gid) {
    const p = this.player; const k = this.payKind(gid); if (!k) return 0;
    if (k === 'kama') return this.isCivil && this.isCivil() ? this.civilSalary() : Math.round(70 * RANKS[p.rankIdx].mult ** 0.7); // civil.js 봉급(주무관 기준 추정)
    const off = p.official ?? p.rankIdx;
    return Math.round(55 * RANKS[off].mult ** 1.1 * (1 + 0.35 * (p.guildRank || 0)) * PAY_TERMS[k].salary);
  },
  payPerks(gid, prospect) {
    const k = this.payKind(gid);
    if (k === 'kama') return { comp: true, merit: 1 };
    if (!prospect) return {};
    return k === 'big' ? { train: true, gear: true } : { gear: true };
  },
  payPerksText(pk) {
    const t = [];
    if (pk.train) t.push('훈련비(매달 에테르)'); if (pk.gear) t.push('연 1회 장비 지급');
    if (pk.comp) t.push('공상 보상'); if (pk.merit) t.push('매달 공적'); if (pk.comp) t.push(`유족 보상금 · 의무 복무 ${KAMA_SERVICE}개월`);
    return t.join(' · ');
  },
  // 권유 장면·제안서에 쓰는 조건 요약 (D·C 영역에서 불러 쓴다)
  payTermsText(gid) {
    const k = this.payKind(gid); if (!k) return '무소속: 전리품을 직접 갖는다. 자유 동료와는 능력(전투력)에 비례해 나누고, 리더가 있는 팀에선 정해진 배당(실력 좋은 팀 8~10%·보통 15%·초보끼리 20%), 혼자 가면 조금 더(크레딧 +10%).';
    const T = PAY_TERMS[k]; const pr = k !== 'kama' && this.isProspect();
    const sal = k === 'kama' ? this.payBase(gid) : Math.round(this.payBase(gid) * (pr ? 1.4 : 1));
    const inc = Math.round(((T.inc[0] + T.inc[1]) / 2) * 100);
    const pk = this.payPerksText(this.payPerks(gid, pr));
    return `${T.label}: 월급 약 ${fmt(sal)} 크레딧 + 게이트 전리품 성과급 ${k === 'kama' ? '' : '약 '}${inc}%${pr ? ' · <b>유망주 대우</b>(계약금·월급 우대)' : ''}${pk ? ` · ${pk}` : ''}`;
  },
  // 권유 장면 ⓘ(aff_flow.js UI.INFO.guild)에 붙는 짧은 한 줄. 플레이어 등급·재능(유망주)에 따라 달라진다
  contractTerms(gid) {
    const k = this.payKind(gid); if (!k) return '';
    const T = PAY_TERMS[k];
    if (k === 'kama') return `월급 ${fmt(this.payBase(gid))}(적음) + 성과급 ${Math.round(T.inc[0] * 100)}%(매우 짬) · 부상 보상·유족 보상금·매달 공적 · 의무 복무 ${KAMA_SERVICE}개월`;
    const pr = this.isProspect();
    const sal = Math.round(this.payBase(gid) * (pr ? 1.4 : 1));
    const inc = Math.round(((T.inc[0] + T.inc[1]) / 2) * 100);
    const sign = Math.round(sal * 6 * T.sign * (pr ? (k === 'big' ? 2.5 : 1.5) : 1));
    return `월급 ${fmt(sal)} + 성과급 약 ${inc}%${sign ? ` · 계약금 약 ${fmt(sign)}` : ''}${pr ? ` · 유망주 지원(${k === 'big' ? '훈련비·장비' : '장비'})` : ''}`;
  },
  // 4-22 무소속 팀 배당: D가 팀에 들 때 p.crewShare(또는 p.crew.share)를 0.08~0.2로 저장한다.
  // 무소속이고 배당률이 있으면 balance.js의 능력 비례 분배 대신 이 배당을, crew.js 원정은 75% 대신 이 배당을 쓴다.
  freeShare() {
    const p = this.player; if (!p || this.payKind(p.guild)) return null;
    const v = (p.crew && typeof p.crew.share === 'number') ? p.crew.share : (typeof p.crewShare === 'number' ? p.crewShare : null);
    return v != null ? Math.max(0.01, Math.min(1, v)) : null;
  },
  // 리더 몫: 리더는 팀 수입의 LEADER_CUT(10%)을 먼저 챙기고, 나머지를 배당대로 나눈다. 내가 리더면 내가 챙긴다.
  leaderCut() { return LEADER_CUT; },
  lateMul() {
    const late = (this.player.pay && this.player.pay.lateNow) || 0;
    return late && !this.payKind(this.player.guild) ? Math.max(RALLY_PAY.lateMin, 1 - RALLY_PAY.latePerDay * late) : 1;
  },
  // 팀 원정(게이트·토벌) 전리품 중 내 몫 비율. 옛 팀(배당률 없음)의 75%는 리더 몫 10% + 공용 경비 15%를 뺀 값이다.
  crewShareRate() {
    const v = this.freeShare(); const base = v != null ? v * (1 - LEADER_CUT) : (typeof CREW_SHARE !== 'undefined' ? CREW_SHARE : 0.75);
    return base * this.lateMul();
  },
  // 리더가 따 온 의뢰 보수(1인당 기준 금액 × 인원 = 총액) 중 내 몫. 배당률이 없으면 리더 몫을 뗀 뒤 균등.
  crewPayTotal(perHead) { return Math.round(perHead * (this.party().length + 1)); },
  crewPay(perHead) {
    const n = this.party().length + 1; const total = perHead * n; const v = this.freeShare();
    return Math.round(total * (1 - LEADER_CUT) * (v != null ? v : 1 / n) * this.lateMul());
  },
  payInit() {
    const p = this.player; if (!p) return;
    p.pay ??= { pool: 0, mk: this.monthKey(), last: null, gearYear: -1 };
  },
  payMonthly() {
    const p = this.player; const pay = p.pay; if (!pay) return;
    const gid = p.guild; const k = this.payKind(gid); const c = p.contract;
    const out = { mk: this.monthKey(), kind: k, salary: 0, pool: pay.pool, inc: 0, incentive: 0, extra: [] };
    if (k) {
      out.salary = k === 'kama' ? (this.isCivil && this.isCivil() ? this.civilSalary() : 0) : (c && c.guild === gid ? c.salary : 0);
      const rate = k === 'kama' ? PAY_TERMS.kama.inc[0] : (c && c.inc) || PAY_TERMS[k].inc[0];
      const lateD = pay.lateDays || 0; const miss = pay.missMonth || 0;
      const rateEff = lateD ? rate * Math.max(RALLY_PAY.incMin, 1 - RALLY_PAY.incPerDay * lateD) : rate;
      out.inc = rateEff; out.incentive = Math.round(pay.pool * rateEff);
      if (lateD) out.extra.push(`집결 지각 ${lateD}일: 성과급 ${Math.round(rate * 100)}% → ${Math.round(rateEff * 100)}%`);
      if (miss && out.salary) { const cut = Math.min(out.salary, Math.round(out.salary * RALLY_PAY.missSalaryCut * miss)); p.money = Math.max(0, p.money - cut); out.extra.push(`집결 불참 ${miss}회 감봉 −${fmt(cut)}`); }
      if (miss >= RALLY_PAY.disciplineAfter) { if (c) c.warn = (c.warn || 0) + 1; this.log(`${GUILDS[gid].name} 징계: 한 달에 집결 불참 ${miss}회. 계약 경고가 쌓였다.`, 'bad'); }
      if (out.incentive) p.money += out.incentive;
      const pk = (c && c.perks) || this.payPerks(gid, false);
      if (pk.train) { const v = this.etherGift(12); out.extra.push(`훈련비 에테르 +${fmt(v)}`); }
      if (pk.gear && pay.gearYear !== this.year && this.month === 3) {
        pay.gearYear = this.year;
        const it = this.makeEquipment(RNG.pick(['weapon', 'armor', 'acc']), p.rankIdx, 2); p.inventory.push(it);
        out.extra.push(`지원 장비 ${it.name}`);
      }
      if (k === 'kama') {
        p.merit += 1; out.extra.push('공적 +1');
        if (p.injured > 0 && out.salary) { const v = Math.round(out.salary * 0.5); p.money += v; out.extra.push(`공상 보상 ${fmt(v)}`); }
      }
      const name = GUILDS[gid].name;
      this.log(`월말 정산 · ${name}: 월급 ${fmt(out.salary)}${pay.pool ? ` · 성과급 ${fmt(out.incentive)} (귀속 전리품 ${fmt(pay.pool)}의 ${Math.round(out.inc * 100)}%)` : ' · 성과급 없음'}${out.extra.length ? ` · ${out.extra.join(', ')}` : ''}`, 'good');
    }
    pay.pool = 0; pay.lateDays = 0; pay.missMonth = 0; pay.last = out;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.payInit(); });
  // 계약: 월급은 여기서 정한 공식 하나. 성과급 비율·유망주 지원을 붙인다.
  wrap('makeContract', function (base, gid, years, mul = 1, oath = false, basic = false) {
    const c = base.call(this, gid, years, mul, oath, basic);
    const k = this.payKind(gid); if (!k) return c;
    const T = PAY_TERMS[k]; const pr = k !== 'kama' && this.isProspect();
    const m = Math.max(0.85, Math.min(1.35, mul));
    if (k === 'kama') { c.salary = 0; c.sign = 0; c.inc = T.inc[0]; c.years = Math.max(2, c.years); c.until = c.start + 12 * c.years; }
    else {
      c.salary = Math.round(this.payBase(gid) * (basic ? 1 : m) * (pr ? 1.4 : 1) * (oath ? 1.3 : 1));
      // 월급을 많이 주는 제안일수록 성과급 비율은 낮다
      c.inc = Math.round((T.inc[1] - (T.inc[1] - T.inc[0]) * (m - 0.85) / 0.5) * 100) / 100;
      c.sign = basic ? 0 : Math.round(c.salary * 6 * m * T.sign * (pr ? (k === 'big' ? 2.5 : 1.5) : 1));
    }
    c.prospect = pr; c.perks = this.payPerks(gid, pr); c.kind = k;
    return c;
  });
  // 게이트 전리품 크레딧은 소속에 귀속
  wrap('shareMates', function (base) { return this.freeShare() != null && !this.noPool ? [] : base.call(this); });
  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    const p = this.player; const gid = p.guild; const k = this.payKind(gid);
    let teamNote = '';
    const fs = this.freeShare();
    if (fs != null && !this.noPool && result !== 'lose' && loot && this.party().length) {
      const n = this.party().length + 1; const total = loot.money || 0;
      const rate = fs * (1 - LEADER_CUT);
      loot.money = Math.round(total * rate); loot.ether = Math.round((loot.ether || 0) * Math.max(fs, 1 / n));
      teamNote = `팀 배당: 전리품 ${fmt(total)} 크레딧에서 리더 몫 ${Math.round(LEADER_CUT * 100)}%를 먼저 떼고, 내 배당 ${Math.round(fs * 100)}% → ${fmt(loot.money)} 크레딧. 나머지는 팀원·공용 경비로.`;
    }
    const before = p.money;
    const lines = base.call(this, gate, result, loot, ...rest);
    if (teamNote && Array.isArray(lines)) lines.unshift(teamNote);
    if (!k || result === 'lose' || this.noPool || !loot || !(loot.money > 0)) return lines;
    const got = Math.min(loot.money, Math.max(0, p.money - before));
    if (got <= 0) return lines;
    p.money -= got; p.pay.pool += got;
    const c = p.contract; const rate = k === 'kama' ? PAY_TERMS.kama.inc[0] : (c && c.inc) || PAY_TERMS[k].inc[0];
    const name = GUILDS[gid].name;
    for (let i = 0; i < lines.length; i++) if (typeof lines[i] === 'string' && lines[i].startsWith('획득:')) { lines[i] = lines[i].replace(/^획득: [\d,]+ 크레딧/, `획득: 크레딧 ${fmt(got)}은(는) ${name}에 귀속`); break; }
    lines.push(`소속 규정: 전리품 크레딧은 ${name}에 귀속된다. 월말 정산 때 ${Math.round(rate * 100)}%를 성과급으로 돌려받는다. (이번 달 누적 ${fmt(p.pay.pool)})`);
    return lines;
  });
  // 팀 토벌(리더 일정·집결): 토벌 보상도 게이트와 같은 배당·지각 규칙으로 나눈다
  wrap('finishMob', function (base, mob, result, kills, ...rest) {
    const p = this.player; const ctx = typeof UI !== 'undefined' ? UI.ctx : null;
    const team = !!(ctx && ctx.kind === 'mob' && ctx.crewRaid && this.crew && this.crew());
    const before = p.money;
    const lines = base.call(this, mob, result, kills, ...rest);
    if (!team) return lines;
    try {
      const got = p.money - before;
      if (result === 'win' && got > 0) {
        const rate = this.crewShareRate(); const mine = Math.round(got * rate); const late = (p.pay && p.pay.lateNow) || 0;
        p.money -= got - mine;
        if (Array.isArray(lines)) lines.push(`파티 분배: 토벌 보상 ${fmt(got)} 크레딧 중 내 몫 ${Math.round(rate * 100)}% (${fmt(mine)} 크레딧). 리더 몫 ${Math.round(LEADER_CUT * 100)}%와 팀원 몫·공용 경비를 뺐다.${late ? ` 집결에 ${late}일 늦어 배당이 깎였다.` : ''}`);
        if (this.crewTrust) this.crewTrust(3);
      }
    } finally { if (p.pay) p.pay.lateNow = 0; }
    return lines;
  });
  wrap('worldMonthly', function (base) { base.call(this); this.payMonthly(); });
  // 관리국: 조기 전역, 유족 보상금
  wrap('civilLeave', function (base, why) {
    const p = this.player; const c = p.civil; const served = c ? this.monthKey() - c.since : 99;
    const r = base.call(this, why);
    if (c && served < KAMA_SERVICE) {
      p.merit = Math.max(0, p.merit - 20); p.fame = Math.max(0, p.fame - 5); if (this.addLaw) this.addLaw(-10, '의무 복무 중 조기 전역');
      return `${r || ''} 의무 복무 ${KAMA_SERVICE}개월을 채우지 못한 조기 전역이다. (공적 −20, 명성 −5)`;
    }
    return r;
  });
  wrap('gameOver', function (base, reason) {
    const p = this.player;
    if (p && this.payKind(p.guild) === 'kama' && this.civilSalary) {
      const v = this.civilSalary() * 24; p.money += v;
      p.lifeEvents.push({ date: this.dateStr(), age: this.ageYears(), text: `관리국이 유족 보상금 ${fmt(v)} 크레딧을 지급했다.` });
    }
    return base.call(this, reason);
  });
}

// ---------- 화면 ----------
{
  // 남의 파티(crew.js 75%)로 간 게이트는 소속 귀속에서 뺀다 (이중 공제 방지)
  const baseFinishGate = UI.finishGate;
  UI.finishGate = function (result) {
    const c = this.ctx; G.noPool = !!(c && c.crewRaid);
    try { return baseFinishGate.call(this, result); } finally { G.noPool = false; if (G.player && G.player.pay) G.player.pay.lateNow = 0; }
  };
  const payCard = () => {
    const p = G.player; const k = G.payKind(p.guild); if (!k) return '';
    const c = p.contract; const pay = p.pay || {}; const L = pay.last;
    const rate = k === 'kama' ? PAY_TERMS.kama.inc[0] : (c && c.inc) || PAY_TERMS[k].inc[0];
    const sal = k === 'kama' ? (G.isCivil && G.isCivil() ? G.civilSalary() : 0) : (c ? c.salary : 0);
    const pk = G.payPerksText((c && c.perks) || G.payPerks(p.guild, false));
    return `<div class="panel sec"><h3>급여 · ${PAY_TERMS[k].label}</h3>
      <div class="small">월급 <b class="num">${fmt(sal)}</b> · 성과급 <b>${Math.round(rate * 100)}%</b>${c && c.prospect ? ' · <span class="amber">유망주 대우</span>' : ''}${pk ? ` · ${pk}` : ''}</div>
      <div class="small dim">게이트 전리품 크레딧은 소속에 귀속되고, 월말에 성과급으로 돌려받는다. 이번 달 귀속 <span class="num">${fmt(pay.pool || 0)}</span> → 예상 성과급 <span class="num">${fmt(Math.round((pay.pool || 0) * rate))}</span></div>
      ${L && L.kind ? `<div class="small">지난 정산(${Math.floor(L.mk / 12)}년 ${L.mk % 12 || 12}월): 월급 ${fmt(L.salary)} · 성과급 ${fmt(L.incentive)}${L.extra.length ? ` · ${L.extra.join(', ')}` : ''}</div>` : ''}</div>`;
  };
  UI.payCardHtml = payCard;
  const baseGuild = UI.guildHtml;
  UI.guildHtml = function () { return baseGuild.call(this) + payCard(); };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this); const p = G.player; const k = G.payKind(p.guild);
    const L = p.pay && p.pay.last;
    const line = k ? `<div class="small dim">소속 급여: ${PAY_TERMS[k].label} · 월급 ${fmt(k === 'kama' ? (G.isCivil && G.isCivil() ? G.civilSalary() : 0) : (p.contract ? p.contract.salary : 0))} · 성과급 ${Math.round(((p.contract && p.contract.inc) || PAY_TERMS[k].inc[0]) * 100)}%${L && L.kind ? ` · 지난달 받은 돈 ${fmt(L.salary + L.incentive)}` : ''}</div>`
      : '<div class="small dim">소속 급여: 무소속 · 전리품을 직접 갖는다</div>';
    return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `${line}<div class="sec"><div class="sec-title">선천 특성</div>`);
  };
  // 이적 제안서에 성과급·유망주 지원
  const baseOffers = UI.showOffers;
  if (baseOffers) UI.showOffers = function (reason) {
    const r = baseOffers.call(this, reason);
    const rows = [...$box.querySelectorAll('.cards > .item-row')];
    (this.curOffers || []).forEach((o, i) => {
      const row = rows[i]; if (!row) return;
      const dim = row.querySelector('.small.dim');
      const pk = G.payPerksText(o.perks || {});
      if (dim) dim.insertAdjacentHTML('beforeend', ` · 성과급 ${Math.round((o.inc || 0) * 100)}%${o.prospect ? ' · <span class="amber">유망주 대우</span>' : ''}${pk ? ` · ${pk}` : ''} · ${PAY_TERMS[o.kind] ? PAY_TERMS[o.kind].label : ''}`);
      if (dim) dim.innerHTML = dim.innerHTML.replace('월 보너스', '월급');
    });
    return r;
  };
}
