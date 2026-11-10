// ===== 소속의 진짜 차이: 돈이 아니라 보호와 성장 (영역 E, docs/구현_대기목록.md 4-16 사용자 확정) =====
// "무소속이 제일 잘 버는 건 맞다. 대신 길드는 선임을 붙여 키우고, 선임과 높은 등급 게이트에 가고, 실패해도 구출하러 온다.
//  무소속은 알짤없는 능력제, 실패하면 관리국이 올 수도 안 올 수도, 병원비도 본인 부담. 위험이 매우 크다."
//
// 게이트 패배 처리(game.js 기본: 누구든 관리국 구조 + 가진 돈 30%)를 소속별로 바꾼다.
// 4-19(사용자 확정): 패배는 '구출 판정' 하나. 확률 = 게이트 관리 주체(gate_tender.js gateOwner) × 내 소속, 보정 뒤 실패하면 사망(귀환석이 있으면 자동 생환).
// 아래 옛 설명 중 '구조 확정·자력 탈출·두 번째 고립 사망'은 4-19로 대체됐다.
//  - 길드: 구조팀 확정(레드 게이트 제외 → 무소속 규칙). 의료 지원으로 본인 부담 0~20%, 부상 1개월 단축.
//          선임 NPC(내 등급 +2)가 붙어 수련 +15%, 내 등급 +1 이상 게이트에 동행. 내 등급 +2 이상 게이트는 선임이 있어야 들어간다.
//          내 등급이 선임을 따라잡으면 독립.
//  - 관리국: 구조 확정, 공상 처리(본인 부담 0), 부상 1개월 단축.
//  - 무소속: 구조는 확률(등급·도시/오지·공적·명성·브레이크 상황·보험·남의 파티). 안 오면 자력 탈출 판정.
//          실패하면 수명 −3년·부상 8개월·장비 하나 상실, 두 번째부터는 낮은 확률로 사망(첫 번째는 경고).
//          병원비는 청구서(등급·부상 정도). 모자라면 빚(월 2% 이자, 수입에서 자동 상환). 헌터 보험(월 보험료)으로 구조 +25%·청구서 30%만(레드 게이트 면책).
//          내 등급 +2 이상 게이트는 관리국 입장 허가가 안 나온다.
//  - C의 solo_relief.js 연패 치료비 환급은 이 규칙으로 대체된다(벼랑 끝 집중 버프는 그대로).

const RISK = {
  spot: { cityR: 3, city: 0.1, midR: 3, mid: 0.07, townR: 2, town: 0.04, remoteR: 8, remote: -0.1 }, // 게이트 위치 보정(한 차례 확률): 광역·중도시 3칸, 읍 2칸 이내 ↑, 어디서든 8칸 이상(육지의 약 6%) ↓
  bill: 260,            // 청구서 기준(등급 배율^1.3)
  guildSelf: { big: 0.1, minor: 0.2, prospect: 0 },
  insure: { premium: 70, rescue: 0.25, self: 0.3 },
  failLife: 3, failInjury: 8, deathChance: 0.12,
  debtRate: 0.02, repay: 0.3,
  rescueLife: 1,         // 4-19 사용자 결정: 구출 성공 시 수명 손상 −1년(길드원 수명 소진 방지)
  waves: 2,              // 4-19 수치 조정: 한 번의 판정은 20년 사망률이 너무 높아(길드 5/6) 두 차례 수색으로
};
const SENIOR_TRAIN = 0.15;

Object.assign(Game.prototype, {
  riskInit() {
    const p = this.player; if (!p) return;
    p.risk ??= { debt: 0, insured: false, nearDeath: 0, lastBill: 0 };
    p.risk.debtBase ??= p.risk.debt; p.risk.debtSince ??= null;
    p.senior ??= null;
  },
  // ---------- 구출 확률 (4-19): 게이트 관리 주체 × 내 소속 ----------
  rescueBase(gate) {
    const p = this.player; const owner = this.gateOwner ? this.gateOwner(gate) : 'kama';
    const k = this.payKind ? this.payKind(p.guild) : null;
    if (owner === 'kama' || !GUILDS[owner]) {
      if (k === 'kama') return { c: 0.9, who: '관리국 구조대' };
      if (k) return { c: 0.85, who: `${GUILDS[p.guild].name} 구조팀` };
      const reg = regionById(gate.region) || this.region();
      return { c: Math.max(0.4, Math.min(0.6, 0.6 - 0.04 * Math.max(0, (reg.danger || 1) - 1))), who: '관리국 구조대' };
    }
    if (p.guild === owner) return { c: 0.95, who: `${GUILDS[owner].name} 구조팀` };
    if (k === 'kama') return { c: 0.7, who: '관리국 구조대' };
    if (k) return { c: 0.6, who: `${GUILDS[p.guild].name} 구조팀(${GUILDS[owner].name} 협조)` };
    const poach = this.isPoaching ? this.isPoaching(gate) : false; // boss_poach.js: 외부인의 길드 게이트 최종층 진입
    return { c: poach ? 0.05 : 0.3, who: `${GUILDS[owner].name} 구조팀`, poach };
  },
  // 게이트 위치: 가까운 도시·읍이 있으면 구조대가 빨리 온다 (지도 5배 확대 뒤, WORLD.towns)
  rescueSpot(gate) {
    if (!gate || gate.x == null || typeof WORLD === 'undefined' || !WORLD.cityPos) return { bonus: 0, label: '' };
    const d = (x, y) => Math.max(Math.abs(x - gate.x), Math.abs(y - gate.y));
    let city = 99, mid = 99, town = 99;
    for (const r of REGIONS) { const c = WORLD.cityPos[r.id]; if (c) city = Math.min(city, d(c[0], c[1])); }
    for (const t of WORLD.towns || []) { const v = d(t.x, t.y); if (t.tier === 2) mid = Math.min(mid, v); else town = Math.min(town, v); }
    const S = RISK.spot;
    if (city <= S.cityR) return { bonus: S.city, label: '광역 도시 인근' };
    if (mid <= S.midR) return { bonus: S.mid, label: '중도시 인근' };
    if (town <= S.townR) return { bonus: S.town, label: '읍 인근' };
    if (Math.min(city, mid, town) >= S.remoteR) return { bonus: S.remote, label: '오지' };
    return { bonus: 0, label: '' };
  },
  // 구조대는 두 차례 수색한다(1차·2차). 실효 구출 확률 = 1 − (1 − 한 차례 확률)²
  rescueChance(gate) { const w = this.rescueWave(gate); return Math.max(0.03, Math.min(0.99, 1 - (1 - w) ** RISK.waves)); },
  rescueWave(gate) {
    const p = this.player; const reg = regionById(gate.region) || this.region();
    const b = this.rescueBase(gate); let c = b.c;
    if (gate.variant === 'red') c *= 0.3;
    else if (gate.variant && gate.variant !== 'normal') c -= 0.15;
    const harsh = reg.id === 'jeju' || reg.north || /north/.test(reg.id) || (reg.danger || 1) >= 4;
    if (harsh) c -= 0.2;
    { const sp = this.rescueSpot(gate); if (sp.bonus > 0 || !harsh) c += sp.bonus; } // 도시 인근 ↑, 오지 ↓ (험지 감점과 오지 감점은 겹치지 않음)
    if (this.world.breaks && this.world.breaks.length) c -= 0.15;
    if (p.risk.insured && !(this.payKind && this.payKind(p.guild)) && gate.variant !== 'red') c += RISK.insure.rescue;
    if (this.seniorNpc && this.seniorNpc() && (gate.realTier ?? gate.tier) >= p.rankIdx + 1) c += 0.1;
    if (this.crewRescue) c += 0.15;
    if (this.gateRescueBonus) c += this.gateRescueBonus(gate) || 0; // gate_parties.js: 같은 게이트 다른 팀 +15%, 우호 파티 +25%
    c += Math.min(0.05, (p.merit || 0) / 1000) + Math.min(0.05, (p.fame || 0) / 4000);
    return Math.max(0.03, Math.min(0.97, c));
  },
  medicalBill(gate, severe) {
    const t = Math.max(0, Math.min(7, gate.realTier ?? gate.tier));
    return Math.round(RISK.bill * RANKS[t].mult ** 1.3 * (severe ? 2.2 : 1) * RNG.range(0.85, 1.15));
  },
  payBill(v, why) {
    const p = this.player; if (v <= 0) return '';
    if (p.money >= v) { p.money -= v; return `${why} ${fmt(v)} 크레딧을 냈다.`; }
    const short = v - p.money; p.money = 0; p.risk.debt += short; p.risk.debtBase = (p.risk.debtBase || 0) + short; if (p.risk.debtSince == null) p.risk.debtSince = this.monthKey();
    this.log(`${why}을(를) 다 못 내 ${fmt(short)} 크레딧 빚이 생겼다. (월 ${Math.round(RISK.debtRate * 100)}% 이자)`, 'bad');
    return `${why} ${fmt(v)} 크레딧 중 ${fmt(short)}은(는) 빚으로 남았다.`;
  },
  insurePremium() { return Math.round(RISK.insure.premium * RANKS[this.player.rankIdx].mult ** 1.2); },
  // ---------- 패배 처리: 구출 판정 하나 ----------
  loseOutcome(gate) {
    const p = this.player; const k = this.payKind ? this.payKind(p.guild) : null;
    const out = [];
    const rc = this.rescueChance(gate); const b = this.rescueBase(gate);
    // 파티원(NPC)도 같은 판정
    for (const n of (this.party ? this.party() : [])) {
      if (!n.alive || n.merc) continue;
      if (!RNG.chance(Math.min(0.97, rc + 0.1))) {
        this.killNpc(n, `${this.gateName ? this.gateName(gate) : '게이트'}에서 구출되지 못함`, null);
        out.push(`<span class="bad">${n.name}은(는) 끝내 구출되지 못했다.</span>`);
        this.lifeEvent(`${n.name}을(를) 게이트 안에 두고 왔다. 구조대는 그를 찾지 못했다.`);
      }
    }
    if (!RNG.chance(rc)) {
      if ((p.items.recall || 0) > 0) {
        p.items.recall--;
        out.unshift(`<span class="bad">구조대는 오지 않았다.</span> (구출 확률 ${Math.round(rc * 100)}%) 의식이 꺼지기 직전, 품속의 귀환석이 저절로 깨졌다. 정신을 차리니 게이트 밖이었다.`);
        p.injured = Math.max(p.injured, 6); p.lifePenalty += 2; if (this.noteLifeLoss) this.noteLifeLoss(2, '게이트 고립 · 귀환석 생환'); this.recalc();
        this.lifeEvent('게이트 안에서 죽기 직전 귀환석으로 살아 돌아왔다.');
        return out;
      }
      this.gameOver(`${this.gateName ? this.gateName(gate) : '게이트'} 안에서 구조를 기다리다 끝내 돌아오지 못했다. (구출 확률 ${Math.round(rc * 100)}%${b.poach ? ' · 보스 가로채기 중' : ''})`);
      out.unshift('<span class="bad">아무도 오지 않았다.</span>');
      return out;
    }
    // 구출 성공: 지금보다 무겁게 (부상 +1개월, 수명 −2년)
    p.injured = Math.max(p.injured, 4) + 1; p.lifePenalty += RISK.rescueLife; if (this.noteLifeLoss) this.noteLifeLoss(RISK.rescueLife, '게이트 패배 · 구출'); this.recalc();
    out.unshift(`${b.who}이(가) 들어와 당신을 끌어냈다. (구출 확률 ${Math.round(rc * 100)}%) 수명 −${RISK.rescueLife}년, 부상 ${p.injured}개월.`);
    if (k === 'kama') { out.push('공상 처리로 치료비는 국가가 낸다.'); return out; }
    if ((k === 'big' || k === 'minor') && gate.variant !== 'red') {
      const c = p.contract; const rate = c && c.prospect ? RISK.guildSelf.prospect : RISK.guildSelf[k];
      const bill = this.medicalBill(gate, false); const self = Math.round(bill * rate);
      out.push(`길드 의료 지원: 치료비 ${fmt(bill)} 중 본인 부담 ${Math.round(rate * 100)}%.`);
      if (self) out.push(this.payBill(self, '본인 부담 치료비'));
      const s = this.seniorNpc && this.seniorNpc(); if (s) { this.changeRel(s, 3, '구조하러 와 줬다'); out.push(`선임 ${s.name}: "살아 있으면 된 거야. 다음엔 내 말 들어."`); }
      return out;
    }
    const ins = p.risk.insured && !k && gate.variant !== 'red';
    const bill = this.medicalBill(gate, true);
    out.push(`병원비 청구서 ${fmt(bill)} 크레딧.${ins ? ' 보험 처리.' : ''}`);
    out.push(this.payBill(ins ? Math.round(bill * RISK.insure.self) : bill, ins ? '보험 처리 뒤 본인 부담' : '병원비'));
    return out;
  },
  // ---------- 선임 ----------
  seniorNpc() { const s = this.player.senior; const n = s && this.npcById(s.id); return n && n.alive ? n : null; },
  seniorMonthly() {
    const p = this.player; const k = this.payKind ? this.payKind(p.guild) : null;
    if (k !== 'big' && k !== 'minor') { if (p.senior) p.senior = null; return; }
    let s = this.seniorNpc();
    if (p.senior && (!s || s.guild !== p.guild)) { p.senior = null; s = null; }
    if (!s && !p.seniorDone) {
      const pool = this.adults().filter((n) => n.guild === p.guild && n.rankIdx >= p.rankIdx + 2 && !n.isCompanion && !n.retired);
      s = pool.length ? RNG.pick(pool) : null;
      if (!s) { s = this.makeNpc(false, 'human'); Object.assign(s, { rankIdx: Math.min(7, p.rankIdx + 2), stage: 1, region: p.region, guild: p.guild }); this.npcs.push(s); }
      s.met = true; s.relation = Math.max(s.relation || 0, 25);
      p.senior = { id: s.id, since: this.monthKey() };
      this.lifeEvent(`${GUILDS[p.guild].name}에서 선임 ${s.name}(${RANKS[s.rankIdx].key}급)이 붙었다.`);
      this.log(`선임 ${s.name}: "네가 이번 신입이야? 내 뒤만 잘 따라와. 너보다 한두 등급 위 게이트도 같이 들어가 줄게."`, 'major');
    }
    if (s && p.rankIdx >= s.rankIdx) {
      p.senior = null; p.seniorDone = true; this.changeRel(s, 6, '독립을 축하해 줬다');
      this.lifeEvent(`선임 ${s.name}을(를) 따라잡아 독립했다. 이제 내가 누군가의 선임이 될 차례다.`);
    }
  },
  gateNeedsSenior(g) { return !g.final && !g.mission && !g.bid && !g.breakCity && !g.raid && (g.realTier ?? g.tier) >= this.player.rankIdx + 2 && g.tier >= this.player.rankIdx + 2; },
  gateBlockReason(g) {
    if (!this.gateNeedsSenior(g)) return '';
    const k = this.payKind ? this.payKind(this.player.guild) : null;
    if ((k === 'big' || k === 'minor') && this.seniorNpc()) return '';
    return k === 'kama' ? '관리국 규정상 두 등급 위 게이트는 상부 명령 없이 들어갈 수 없다.' : k ? '두 등급 위 게이트는 선임이 있어야 들어갈 수 있다.' : '무소속에게는 두 등급 위 게이트의 관리국 입장 허가가 나오지 않는다.';
  },
  riskMonthly() {
    const p = this.player; const r = p.risk;
    if (r.insured) {
      if (this.payKind && this.payKind(p.guild)) { r.insured = false; this.log('소속이 생겨 무소속 헌터 보험을 해지했다.'); }
      else { const v = this.insurePremium(); if (p.money >= v) p.money -= v; else { r.insured = false; this.log('보험료를 못 내 헌터 보험이 해지됐다.', 'bad'); } }
    }
    if (r.debt > 0) {
      // 이자는 원금의 2배까지만 붙는다
      r.debt = Math.min(Math.round((r.debtBase || r.debt) * 2), Math.round(r.debt * (1 + RISK.debtRate)));
      const pay = Math.min(r.debt, Math.round(p.money * RISK.repay));
      if (pay > 0) { p.money -= pay; r.debt -= pay; r.debtBase = Math.max(0, (r.debtBase || 0) - pay); }
      if (r.debt > 0 && RNG.chance(0.08)) this.log(`사채업자의 독촉 문자가 왔다. 남은 빚 ${fmt(r.debt)} 크레딧.`, 'bad');
      if (r.debt > 0 && r.debtSince != null && this.monthKey() - r.debtSince >= 36) {
        // 3년 넘게 못 갚으면 개인 파산: 빚은 사라지지만 이름에 흠이 남는다
        this.lifeEvent(`빚 ${fmt(r.debt)} 크레딧을 끝내 갚지 못해 개인 파산 신청을 했다.`);
        p.fame = Math.max(0, p.fame - 20); if (this.addLaw) this.addLaw(-5, '개인 파산');
        r.debt = 0; r.debtBase = 0; r.debtSince = null;
      }
      if (r.debt <= 0 && r.debtSince != null) { r.debt = 0; r.debtBase = 0; r.debtSince = null; this.log('빚을 다 갚았다.', 'good'); }
    }
    this.seniorMonthly();
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.riskInit(); });
  // 길드 보호: 부상으로 쉰 달이 분기에 두 달 이상이면 의무 게이트를 면제한다 (contract.js 분기 판정 전에)
  wrap('contractMonthly', function (base) {
    const p = this.player; const c = p.contract;
    if (c && p.guild === c.guild && c.duty) {
      if (p.injured > 0) c.injMonths = (c.injMonths || 0) + 1;
      if (this.monthKey() - c.qStart >= 3 && (c.injMonths || 0) >= 2 && c.qDone < c.duty) { c.qDone = c.duty; this.log(`${GUILDS[c.guild].name}: 부상 치료 기간이라 이번 분기 의무 게이트를 면제받았다.`); }
    }
    const q = c && c.qStart;
    base.call(this);
    if (c && p.contract === c && c.qStart !== q) c.injMonths = 0;
  });
  wrap('worldMonthly', function (base) { base.call(this); this.riskMonthly(); });
  wrap('trainGain', function (base, mult = 1) { return base.call(this, mult * (this.seniorNpc && this.seniorNpc() ? 1 + SENIOR_TRAIN : 1)); });
  // 패배: 기본 처리(관리국 구조 + 돈 30%)와 솔로 연패 환급을 소속별 규칙으로 바꾼다
  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    if (result !== 'lose') return base.call(this, gate, result, loot, ...rest);
    const p = this.player; const money0 = p.money;
    const lines = base.call(this, gate, result, loot, ...rest);
    if (this.over) return lines;
    p.money = money0; // 일괄 30% 대신 아래 청구서
    const keep = (Array.isArray(lines) ? lines : []).filter((l) => typeof l !== 'string' || !/구조대가 끌어냈다|재활 지원 대상/.test(l));
    const out = this.loseOutcome(gate);
    return [...out, ...keep];
  });
  // 권유 장면·조건 표시에 보호·성장 조건
  if (GP.payTermsText) wrap('payTermsText', function (base, gid) {
    const r = base.call(this, gid); const k = this.payKind(gid);
    if (!k) return `${r} <span class="bad">지면 구출 30~60%(실패하면 사망) · 병원비 본인 부담(보험 선택) · 두 등급 위 게이트 입장 불가</span>`;
    if (k === 'kama') return `${r} · 구출 70~90% · 치료비 국가 부담`;
    return `${r} · 선임 배정(두 등급 위 게이트 동행) · 구출 60~95%(자기 길드 게이트 95%) · 의료 지원(본인 ${Math.round(RISK.guildSelf[k] * 100)}%)`;
  });
  if (GP.contractTerms) wrap('contractTerms', function (base, gid) {
    const r = base.call(this, gid); const k = this.payKind(gid); if (!r || !k) return r;
    return k === 'kama' ? `${r} · 구출 70~90%` : `${r} · 선임 배정 · 구출 60~95% · 의료 지원`;
  });
}

// ---------- 화면 ----------
{
  // 남의 파티(crew) 게이트: 그 리더 소속 보호를 일부 받는다
  const baseFinishGate = UI.finishGate;
  UI.finishGate = function (result) {
    const c = this.ctx; G.crewRescue = !!(c && c.crewRaid);
    try { return baseFinishGate.call(this, result); } finally { G.crewRescue = false; }
  };
  // 선임 동행: 내 등급 +1 이상 게이트
  const baseAllies = UI.allyUnits;
  UI.allyUnits = function () {
    const list = baseAllies.call(this);
    const c = this.ctx; const s = G.seniorNpc();
    if (s && c && c.gate && (c.gate.realTier ?? c.gate.tier) >= G.player.rankIdx + 1 && list.length < 5 && !list.some((u) => u.npcId === s.id) && !s.isCompanion) {
      list.push(G.npcUnit(s, 'ally'));
      if (!c.seniorToast) { c.seniorToast = true; setTimeout(() => this.toast(`선임 ${s.name}이(가) 동행한다. "내 뒤에서 떨어지지 마."`), 60); }
    }
    return list;
  };
  // 입장 제한·위험 안내
  const baseEnc = UI.encounter;
  UI.encounter = function (obj) {
    const r = baseEnc.call(this, obj);
    if (obj.kind !== 'gate') return r;
    const p = G.player; const why = G.gateBlockReason(obj); const k = G.payKind(p.guild);
    const row = $box.querySelector('.row.end');
    if (why && row) {
      for (const b of row.querySelectorAll('[data-act="gate"]')) b.disabled = true;
      row.insertAdjacentHTML('beforebegin', `<p class="small bad">${why}</p>`);
    } else if (row) {
      const rc = G.rescueChance(obj);
      row.insertAdjacentHTML('beforebegin', `<p class="small ${rc < 0.5 ? 'bad' : 'dim'}">지면 구출 확률 <b>${Math.round(rc * 100)}%</b> (${G.rescueBase(obj).who}${(() => { const sp = G.rescueSpot(obj); return sp.label ? ` · ${sp.label}` : ''; })()}). 구출되지 못하면 죽는다.${!k ? ` 병원비 본인 부담${p.risk.insured ? ' · 보험 가입 중' : ''}.` : ''}${G.seniorNpc() && (obj.realTier ?? obj.tier) >= p.rankIdx + 1 ? ` 선임 ${G.seniorNpc().name}이(가) 함께 들어간다.` : ''}</p>`);
    }
    return r;
  };
  const baseStart = UI.startGate;
  UI.startGate = function (id) {
    const g = G.mapGates.find((x) => x.id === +String(id).split('|')[0]);
    const why = g && G.gateBlockReason(g);
    if (why) return this.toast(why);
    return baseStart.call(this, id);
  };
  // 보험: 협회 의뢰소
  const baseFac = UI.facilityHtml;
  UI.facilityHtml = function (id, reg) {
    let html = baseFac.call(this, id, reg);
    if (id !== 'board') return html;
    const p = G.player; const r = p.risk; const k = G.payKind(p.guild);
    html += `<div class="sec-title sec">무소속 헌터 보험</div><div class="item-row"><div class="grow"><b>${r.insured ? '가입 중' : '미가입'}</b> <span class="small">월 ${fmt(G.insurePremium())} 크레딧</span>
      <div class="small dim">${k ? '소속이 있으면 가입할 수 없다(소속이 보호한다).' : `패배 때 구조 확률 +${Math.round(RISK.insure.rescue * 100)}%, 병원비 ${Math.round(RISK.insure.self * 100)}%만 본인 부담. 레드 게이트는 면책.`}</div></div>
      ${k ? '' : `<button class="sm ${r.insured ? 'ghost' : 'primary'}" data-act="insure">${r.insured ? '해지' : '가입'}</button>`}</div>
      ${r.debt ? `<div class="small bad">빚 ${fmt(r.debt)} 크레딧 · 월 ${Math.round(RISK.debtRate * 100)}% 이자, 수입의 ${Math.round(RISK.repay * 100)}%씩 자동 상환 <button class="sm" data-act="debt-pay">지금 갚기</button></div>` : ''}`;
    return html;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.call(this); const p = G.player; const s = G.seniorNpc(); const k = G.payKind(p.guild);
    const bits = [];
    if (s) bits.push(`선임 ${s.name}(${RANKS[s.rankIdx].key}급) · 수련 +${Math.round(SENIOR_TRAIN * 100)}%`);
    if (!k) bits.push(`보호: 무소속(구출 30~60%${p.risk.insured ? ', 보험 +25%' : ''})`);
    else bits.push(k === 'kama' ? '보호: 관리국(구출 70~90%·공상)' : '보호: 길드(구출 60~95%·의료 지원)');
    if (p.risk.debt) bits.push(`<span class="bad">빚 ${fmt(p.risk.debt)}</span>`);
    return html.replace('<div class="sec"><div class="sec-title">선천 특성</div>', `<div class="small dim">${bits.join(' · ')}</div><div class="sec"><div class="sec-title">선천 특성</div>`);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'insure') { const r = G.player.risk; if (!G.payKind(G.player.guild)) r.insured = !r.insured; G.save(); return this.afterCity(r.insured ? '무소속 헌터 보험에 가입했다.' : '보험을 해지했다.'); }
    if (act === 'debt-pay') { const p = G.player; const v = Math.min(p.money, p.risk.debt); p.money -= v; p.risk.debt -= v; p.risk.debtBase = Math.max(0, (p.risk.debtBase || 0) - v); if (!p.risk.debt) p.risk.debtSince = null; G.save(); return this.afterCity(`빚 ${fmt(v)} 크레딧을 갚았다.`); }
    return baseHandle.call(this, act, v);
  };
}
