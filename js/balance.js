// ===== 게이트 크로니클: 밸런스 조정 (영역 C) =====
// docs/성장_밸런스_분석.md 추천 1·3·6·7.
// 1. 일반 게이트·토벌 패배는 수명 대신 부상과 돈. 수명은 치명상·레드 게이트 같은 극적인 순간에만 깎인다.
// 3. 무소속 파티는 전리품을 능력(전투력)에 비례해 나눈다. 혼자 가면 조금 더 얻는다. 길드·보호국은 월급제 + 인센티브.
// 6. 돌파 직후 재측정 안내.
// 7. 돌파 실패는 에테르와 시간만 잃는다(수명 손상 없음).
// 수명이 줄면 크게 알리고, 정보 창에 잃은 이유를 남긴다(p.lifeLog).

const BAL = {
  critChance: 0.1,     // 패배 중 치명상(수명 -1) 확률
  soloMoney: 1.1, soloEther: 1.15,
};

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  // 수명 손실 기록 + 큰 알림
  GP.noteLifeLoss = function (years, reason) {
    if (!years) return;
    const p = this.player;
    (p.lifeLog = p.lifeLog || []).push({ date: this.dateStr(), age: this.ageYears(), years, reason });
    if (p.lifeLog.length > 40) p.lifeLog.shift();
    this.log(`수명 -${years}년 (${reason}). 남은 수명 ${Math.max(0, Math.round(this.maxLife() - this.ageYears()))}년.`, 'bad');
  };

  wrap('initSandbox', function (base) {
    base.call(this);
    this.player.lifeLog ??= [];
  });

  // 자유 동료(용병·소속 파티원 제외): 몫을 나눈다
  GP.shareMates = function () {
    if (this.crew && this.crew()) return [];
    return this.party().filter((n) => !(n.merc && n.merc.job));
  };

  wrap('finishGate', function (base, gate, result, loot, hpLeft, mpLeft) {
    const p = this.player;
    const note = [];
    if (result !== 'lose' && loot) {
      const mates = this.shareMates();
      const affiliated = this.payKind && this.payKind(p.guild); // 길드·보호국 소속은 전리품이 귀속되므로 솔로 보너스 없음
      if (!this.party().length && !affiliated) {
        loot.money = Math.round(loot.money * BAL.soloMoney); loot.ether = Math.round(loot.ether * BAL.soloEther);
        note.push('홀로 공략한 덕에 전리품을 독차지했다. (크레딧 +10%, 에테르 +15%)');
      } else if (mates.length) {
        // 무소속(자유) 파티는 능력에 비례해 나눈다 (사용자 설계). 길드·보호국은 월급제 + 인센티브라 여기와 별개.
        const pow = (u) => Math.max(1, u.atk * 1.2 + u.def + u.maxHp / 8);
        let mine = 1, theirs = [];
        try { mine = pow(this.playerUnit()); theirs = mates.map((n) => pow(this.npcUnit(n, 'ally'))); } catch (e) { theirs = mates.map(() => mine); }
        const total = mine + theirs.reduce((x, y) => x + y, 0);
        const keep = mine / total;
        const each = Math.round(loot.money * keep);
        const total$ = loot.money;
        loot.money = each; loot.ether = Math.round(loot.ether * keep);
        const parts = mates.map((n, i) => `${n.name} ${Math.round(theirs[i] / total * 100)}% (${fmt(Math.round(total$ * theirs[i] / total))})`);
        note.push(`무소속 파티 분배: 능력에 비례해 나눴다. 내 몫 ${Math.round(keep * 100)}% (${fmt(each)} 크레딧) · ${parts.join(', ')}`);
        mates.forEach((n, i) => { this.changeRel(n, 2); if (typeof n.money === 'number') n.money += Math.round(total$ * theirs[i] / total); });
      }
    }
    const before = p.lifePenalty;
    const lines = base.call(this, gate, result, loot, hpLeft, mpLeft);
    if (result === 'lose') {
      // 기본 처리의 수명 -2를 되돌리고, 부상을 늘린다. 치명상일 때만 수명 -1.
      p.lifePenalty = Math.max(0, p.lifePenalty - 2);
      p.injured = Math.max(p.injured, 4); this.recalc();
      const crit = RNG.chance(BAL.critChance);
      if (crit) p.lifePenalty += 1;
      const suffix = crit ? '치명상까지 입어 에테르 회로가 타 들어갔다. 수명 -1년. (부상 4개월)' : '목숨은 건졌지만 몸이 엉망이다. (부상 4개월)';
      for (let i = 0; i < lines.length; i++) if (typeof lines[i] === 'string') lines[i] = lines[i].replace('치명상으로 수명이 2년 줄었다. (부상 3개월)', suffix);
      const d = p.lifePenalty - before;
      if (d > 0) this.noteLifeLoss(d, gate.variant === 'red' ? (crit ? '레드 게이트 패배·치명상' : '레드 게이트 패배') : '게이트 패배 치명상');
    }
    if (note.length && Array.isArray(lines)) lines.unshift(...note);
    return lines;
  });

  wrap('finishMob', function (base, mob, result, kills, hpLeft, mpLeft) {
    const p = this.player;
    const before = p.lifePenalty;
    const lines = base.call(this, mob, result, kills, hpLeft, mpLeft);
    if (result === 'lose') {
      p.lifePenalty = Math.max(0, p.lifePenalty - 1);
      p.injured = Math.max(p.injured, 3); this.recalc();
      const crit = RNG.chance(BAL.critChance * 0.6);
      if (crit) p.lifePenalty += 1;
      if (Array.isArray(lines)) for (let i = 0; i < lines.length; i++) {
        if (typeof lines[i] === 'string') lines[i] = lines[i].replace(/수명 -1년, 부상 2개월/, crit ? '치명상으로 수명 -1년, 부상 3개월' : '부상 3개월');
      }
      const d = p.lifePenalty - before;
      if (d > 0) this.noteLifeLoss(d, '괴수 무리 패배 치명상');
    }
    return lines;
  });

  // 돌파: 실패해도 수명은 그대로. 성공하면 재측정 안내.
  wrap('breakthrough', function (base) {
    const p = this.player;
    const before = p.lifePenalty;
    const res = base.call(this);
    if (!res) return res;
    if (!res.ok) {
      p.lifePenalty = before;
      res.msg = res.msg.replace('(에테르 절반 손실, 수명 -1)', '(에테르 절반 손실)');
      const L = this.logs.find((l) => l.text.includes('돌파 실패'));
      if (L) L.text = L.text.replace('(에테르 절반 손실, 수명 -1)', '(에테르 절반 손실)');
    } else if (p.official < p.rankIdx) {
      p.needRemeasure = true;
      const tip = `실력은 ${RANKS[p.rankIdx].key}급이지만 관리국 등록은 ${RANKS[p.official].key}급이다. 도시 협회 의뢰소에서 재측정을 받아야 공식 등급·랭킹·의뢰가 오른다.`;
      this.log(tip, 'major');
      res.msg += ` ${tip}`;
    }
    return res;
  });

  wrap('remeasure', function (base) {
    const r = base.call(this);
    if (this.player.official >= this.player.rankIdx) this.player.needRemeasure = false;
    return r;
  });

  // 세계 고등급 정원: 새로 만들어지는 NPC가 이 이상이면 만들지 않는다 (S급은 손에 꼽는다)
  GP.rankCap = function (r) { return r >= 7 ? 2 : r === 6 ? 4 : r === 5 ? 8 : Infinity; };
  GP.rankRoom = function (r) { return this.adults().filter((n) => n.rankIdx === r).length < this.rankCap(r); };
  if (GP.makeCrewListing) wrap('makeCrewListing', function (base, regionId, leaderNpc) {
    const len = this.npcs.length;
    const L = base.call(this, regionId, leaderNpc);
    const fresh = this.npcs.slice(len);
    const over = fresh.some((n) => n.rankIdx >= 5 && this.adults().filter((o) => o.rankIdx === n.rankIdx && !fresh.includes(o)).length >= this.rankCap(n.rankIdx));
    if (!over) return L;
    this.npcs.length = len; // 새로 만든 고등급 인원을 거두고 공고를 내지 않는다
    return null;
  });

  // S급 하한: 세상에 S급이 너무 적으면 가끔 A급 중 하나가 벽을 넘는다 (뉴스거리)
  wrap('simulateNpcs', function (base) {
    base.call(this);
    const ad = this.adults();
    const top = ad.filter((n) => n.rankIdx >= 6).length;
    if (top < 3 && RNG.chance(0.035)) {
      const cand = ad.filter((n) => n.rankIdx === 5 && !n.isCompanion).sort((a, b) => (b.stage + b.talent * 0.3) - (a.stage + a.talent * 0.3))[0];
      if (cand) {
        cand.rankIdx = 6; cand.stage = 0; cand.progress = 0;
        cand.lifespan += RANKS[6].life - RANKS[5].life;
        this.rumor(`속보: A급 ${cand.name}이(가) S급 판정을 받았다. 국내 ${top + 1}번째 현역 S급이다.`);
        if (cand.met) this.log(`${cand.name}이(가) S급에 올랐다.`, 'major');
      }
    }
  });

  // 사건으로 잃은 수명도 기록
  if (GP.gain) wrap('gain', function (base, o, c) {
    const before = this.player.lifePenalty;
    const r = base.call(this, o, c);
    const d = this.player.lifePenalty - before;
    if (d > 0) this.noteLifeLoss(d, '사건');
    return r;
  });
}

if (typeof UI !== 'undefined') {
  // 정보 창: 수명 손실 내역
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    let html = baseChar.call(this);
    const p = G.player; const log = p.lifeLog || [];
    const orig = Math.round(G.maxLife() + p.lifePenalty);
    const box = `<div class="sec"><div class="sec-title">수명</div><div class="cards"><div class="item-row"><div class="grow">
      남은 수명 <b class="num">${Math.max(0, Math.round(G.maxLife() - G.ageYears()))}년</b> · 원래 수명 <b class="num">${orig}세</b> · 잃은 수명 <b class="num ${p.lifePenalty ? 'bad' : ''}">${p.lifePenalty}년</b>
      ${log.length ? `<div class="small dim">${log.slice(-8).reverse().map((e) => `${e.age}세 −${e.years}년 · ${e.reason}`).join('<br>')}</div>` : '<div class="small dim">일반 패배는 부상과 돈만 잃는다. 수명은 치명상·레드 게이트·일부 사건에서만 줄어든다.</div>'}
    </div></div></div></div>`;
    const at = html.lastIndexOf('<div class="sec"><div class="sec-title">인생 기록');
    return at >= 0 ? html.slice(0, at) + box + html.slice(at) : html + box;
  };
}
