// ===== 게이트 크로니클: 게이트 관리권 (docs/구현_대기목록.md 4-17, 영역 F) =====
// 모든 게이트는 관리국(KAMA)이 등록·관리하고, 일부는 입찰로 길드가 가져간다. 그래서 함부로 들어갈 수 없다.
//  - 관리국 직할: 공식 등급이 게이트 등급 −1 이상이어야 입장(선임 동행 시 허용). 입장료 저렴, 관리국 소속 무료.
//  - 길드 게이트: 그 길드 소속은 무료. 외부인은 비싼 입장료 + 전리품 20% 상납, 또는 입장 불가(독점).
//    지역 평판이 높으면 할인, 동맹 세력이면 반값·독점도 허용.
//  - 긴급 개방: 재앙 게이트, 브레이크 중인 도시의 게이트, 기한이 다 된 방치 게이트는 누구나.
//  - 무단 진입: 경비 회피 판정(민첩). 들키면 벌금·무법 성향·길드 적대·소문. 몰래 깨도 나중에 들킬 수 있다(전리품 압수).
// 이 파일은 owner 데이터·입장 규칙·화면만 맡는다. 입찰 자동 진행과 게이트 생태계 팀 배정은 영역 C(owner 를 읽어 씀).
// 저장: 게이트 객체에 owner, policy('fee'|'closed'), paid, tribute, sneak / p.guildHostile = { 소유자: 횟수 }

const OWNER_KAMA = 'kama';
const BIG_GUILDS = ['baekho', 'cheongryong', 'hyeonmu', 'jujak'];

Object.assign(Game.prototype, {
  ownerName(id) {
    if (!id) return '없음';
    if (id === OWNER_KAMA) return '관리국 직할';
    if (GUILDS[id]) return GUILDS[id].name;
    if (typeof MINOR_GUILDS !== 'undefined' && MINOR_GUILDS[id]) return MINOR_GUILDS[id].name;
    return id;
  },
  ownerColor(id) {
    if (id === OWNER_KAMA) return '#ffd84d';
    if (GUILDS[id]) return GUILDS[id].color;
    if (typeof MINOR_GUILDS !== 'undefined' && MINOR_GUILDS[id]) return MINOR_GUILDS[id].color;
    return '#9aa6b8';
  },
  // 관리 주체는 영역 C(gate_tender.js: 등록·입찰)가 정한다. 여기선 비어 있을 때만 C의 등록을 부르고, 정책(입장료/독점)만 덧붙인다.
  ensureOwner(g) {
    if (!g || g.kind !== 'gate') return null;
    if (!g.owner) { if (g.north) g.owner = OWNER_KAMA; else if (this.tenderRegister) this.tenderRegister(g); else g.owner = OWNER_KAMA; }
    if (!g.owner) g.owner = OWNER_KAMA;
    if (g.owner !== OWNER_KAMA && GUILDS[g.owner] && !g.policy) {
      const big = !GUILDS[g.owner].minor;
      const closedP = g.tier >= 5 ? (['baekho', 'hyeonmu'].includes(g.owner) ? 0.5 : big ? 0.3 : 0.15) : g.tier >= 3 ? 0.15 : 0;
      g.policy = RNG.chance(closedP) ? 'closed' : 'fee';
    }
    return g.owner;
  },
  gateFeeBase(t) { return Math.round(30 * (t + 1) ** 1.6 / 10) * 10; },
  // 동맹(세력 관계 50 이상): C의 외부인 판정과 같은 기준
  ownerAllied(owner) {
    const p = this.player; const w = this.world;
    if (!p.guild || !w || !w.factions || !w.factions[p.guild]) return false;
    return ((w.factions[p.guild].rel || {})[owner] || 0) >= 50;
  },
  // 입장 판정 → { mode: 'free'|'fee'|'deny', fee, tribute, why, tags }
  gateAccess(g) {
    this.ensureOwner(g);
    const p = this.player; const t = g.tier; const mk = this.monthKey();
    const off = p.official ?? p.rankIdx;
    const out = (mode, why, extra = {}) => ({ mode, why, fee: 0, tribute: 0, ...extra });
    if (g.paid) return out('free', '입장료를 이미 냈다');
    if (g.north) return out('free', '봉쇄선 너머엔 관리하는 사람이 없다');
    if (g.final) return out('free', '원초의 게이트는 관리국도 손대지 못한다');
    if (g.calamity) return out('free', '재앙 경보 · 긴급 개방');
    if (g.breakCity || (this.cityBreak && this.cityBreak(g.region))) return out('free', '브레이크 비상 · 긴급 개방');
    if (g.deadline && g.deadline < 1e8 && mk >= g.deadline - 1 && !g.mission && !g.bid) return out('free', '기한이 다 된 방치 게이트 · 긴급 개방');
    if (p.guild && g.owner === p.guild) return out('free', p.guild === OWNER_KAMA ? '관리국 소속 · 무료' : '우리 길드 게이트 · 무료');
    const escort = this.party().some((n) => n && n.alive && n.rankIdx >= t);
    const repOff = this.rep(g.region) >= 60 ? 0.25 : 0;
    if (g.owner === OWNER_KAMA) {
      if (off < t - 1 && !escort) return out('deny', `공식 등급 미달 (등록 ${RANKS[off].key}급 · ${RANKS[Math.max(0, t - 1)].key}급 이상 필요)`, { official: true });
      const fee = Math.round(this.gateFeeBase(t) * (1 - repOff) / 10) * 10;
      return out('fee', off < t - 1 ? '선임 동행 조건으로 입장 허가' : repOff ? '관리국 창구 · 지역 평판 할인' : '관리국 창구 입장료', { fee });
    }
    const ally = this.ownerAllied(g.owner);
    const hostile = (p.guildHostile || {})[g.owner] || 0;
    if (g.policy === 'closed' && !ally) return out('deny', `${this.ownerName(g.owner)} 독점 게이트 · 외부인 출입 금지`);
    if (hostile >= 2 && !ally) return out('deny', `${this.ownerName(g.owner)}이(가) 당신을 문전박대한다 (무단 진입 전력)`);
    let fee = this.gateFeeBase(t) * 4 * (1 - repOff) * (ally ? 0.5 : 1) * (hostile ? 1.5 : 1);
    fee = Math.round(fee / 10) * 10;
    return out('fee', ally ? '동맹 세력 · 입장료 반값' : '외부인 입장', { fee, tribute: ally ? 0.1 : 0.2 });
  },
  payGateFee(g) {
    const a = this.gateAccess(g); const p = this.player;
    if (a.mode === 'deny') return { ok: false, msg: a.why };
    if (a.mode === 'fee') {
      if (p.money < a.fee) return { ok: false, msg: `입장료 ${fmt(a.fee)} 크레딧이 모자란다.` };
      p.money -= a.fee; g.paid = true; g.tribute = a.tribute || 0;
      this.log(`${this.gateName(g)} 입장료 ${fmt(a.fee)} 크레딧을 냈다.`);
    }
    return { ok: true, msg: a.mode === 'fee' ? `입장료 ${fmt(a.fee)} 크레딧을 냈다.` : '' };
  },
  // 무단 진입이 들켰을 때
  sneakCaught(g, stage) {
    const p = this.player; const t = g.tier;
    const fine = Math.min(p.money, Math.max(this.gateFeeBase(t) * 3, Math.round(p.money * 0.1)));
    p.money -= fine; p.outlaw = (p.outlaw || 0) + (stage === 'after' ? 6 : 10);
    if (this.addLaw) this.addLaw(-3, '게이트 무단 진입');
    p.guildHostile ??= {};
    if (g.owner && g.owner !== OWNER_KAMA) p.guildHostile[g.owner] = (p.guildHostile[g.owner] || 0) + 1;
    if (this.updateWanted) this.updateWanted('게이트 무단 진입');
    const who = this.ownerName(g.owner);
    this.rumor(`${p.name}이(가) ${who} 관리 게이트에 몰래 들어갔다 걸렸다는 소문이 돈다.`);
    this.log(`${this.gateName(g)} 무단 진입 적발. 벌금 ${fmt(fine)} 크레딧.`, 'bad');
    return { fine, who };
  },
});

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.player.guildHostile ??= {}; for (const g of this.mapGates || []) this.ensureOwner(g); });
  wrap('spawnMonthly', function (base) { base.call(this); for (const g of this.mapGates) this.ensureOwner(g); });
  // 전리품 상납·몰래 깬 게이트의 뒤늦은 적발
  wrap('finishGate', function (base, gate, result, loot, ...rest) {
    const notes = [];
    if (gate && loot && result !== 'lose') {
      if (gate.tribute && loot.money > 0) { const cut = Math.round(loot.money * gate.tribute); loot.money -= cut; notes.push(`${this.ownerName(gate.owner)} 상납: 전리품 ${fmt(cut)} 크레딧 (${Math.round(gate.tribute * 100)}%)`); }
      if (gate.sneak && RNG.chance(0.3)) {
        const seized = Math.round((loot.money || 0) * 0.5); loot.money = (loot.money || 0) - seized;
        const r = this.sneakCaught(gate, 'after');
        notes.push(`나오는 길에 ${r.who} 경비에게 걸렸다. 전리품 ${fmt(seized)} 크레딧 압수, 벌금 ${fmt(r.fine)} 크레딧.`);
      }
    }
    const lines = base.call(this, gate, result, loot, ...rest);
    if (Array.isArray(lines)) lines.push(...notes);
    return lines;
  });
}

// ---------- 화면 ----------
Object.assign(UI, {
  gateOwnerTag(g) {
    G.ensureOwner(g);
    const col = G.ownerColor(g.owner);
    return `<span class="tag owner-tag" style="--c:${col}">${g.north ? '봉쇄선 너머' : g.owner === OWNER_KAMA ? '관리국' : G.ownerName(g.owner)}${g.policy === 'closed' ? ' · 독점' : ''}${g.tender ? ' · 입찰 공고 중' : ''}</span>`;
  },
  gateAccessHtml(g) {
    const a = G.gateAccess(g);
    const cls = a.mode === 'deny' ? 'bad' : a.mode === 'fee' ? 'amber' : 'good';
    const what = a.mode === 'deny' ? '입장 불가' : a.mode === 'fee' ? `입장료 ${fmt(a.fee)} 크레딧${a.tribute ? ` · 전리품 ${Math.round(a.tribute * 100)}% 상납` : ''}` : '무료';
    const out = G.isGuildGateOutsider ? G.isGuildGateOutsider(g) : null;
    return `<div class="gate-access"><div><span class="dim small">관리</span> <b style="color:${G.ownerColor(g.owner)}">${g.north ? '없음 (봉쇄선 너머)' : G.ownerName(g.owner)}</b>${g.policy === 'closed' ? ' <span class="small bad">독점</span>' : ''}${g.tender ? ' <span class="small amber">다음 달 관리권 입찰</span>' : ''}</div>
      <div><span class="dim small">입장</span> <b class="${cls}">${what}</b> <span class="small dim">· ${a.why}</span></div>
      ${out && a.mode !== 'deny' ? `<div class="small amber">보스 공략권은 ${G.ownerName(out)}에 있다. 외부인은 최종층(보스층)에 가지 않는 게 규칙이다. 들어가면 추격대가 올 수 있다.</div>` : ''}</div>`;
  },
  gateSneak(id) {
    const g = G.mapGates.find((x) => x.id === +id); if (!g) return;
    this.ckBegin({
      title: G.gateName(g), eyebrow: '무단 진입 · 경비 회피', stat: 'agi', base: 0.5, tier: g.tier,
      run: (ok) => {
        if (ok) { g.sneak = true; G._ckOut.losses.push('들키면 벌금·무법 성향·길드 적대 (나올 때도 걸릴 수 있다)'); return '경비 교대 틈을 타 차단선 아래로 미끄러져 들어갔다. 아무도 못 봤다. 아직은.'; }
        const r = G.sneakCaught(g, 'enter');
        G._ckOut.losses.push(`벌금 ${fmt(r.fine)} 크레딧`, '무법 성향 상승', ...(g.owner !== OWNER_KAMA ? [`${r.who}의 적대`] : []));
        return `차단선을 넘자마자 경보가 울렸다. ${r.who} 경비원들이 당신을 끌어냈다.`;
      },
      post: (res) => { if (g.sneak) res.nextLabel = '게이트로 들어간다'; },
      next: () => { if (g.sneak) return this.startGate(g.id); this.closeModal(); return this.after(); },
      cancel: () => this.encounter(g),
    });
  },
});

{
  // 게이트 창: 관리·입장 조건, 진입 버튼에 비용 표시, 불가면 무단 진입
  const baseEnc = UI.encounter;
  UI.encounter = function (obj) {
    const r = baseEnc.call(this, obj);
    if (!obj || obj.kind !== 'gate') return r;
    const box = document.getElementById('modal-box'); if (!box) return r;
    const a = G.gateAccess(obj);
    const row = box.querySelector('.row.end');
    if (row) row.insertAdjacentHTML('beforebegin', fixJosa(this.gateAccessHtml(obj)));
    const tags = box.querySelector('.enc .row'); if (tags) tags.insertAdjacentHTML('afterbegin', this.gateOwnerTag(obj) + ' ');
    const enters = box.querySelectorAll('[data-act="gate"]');
    const eBlock = G.gateBlockReason ? G.gateBlockReason(obj) : null;
    if (a.mode === 'deny') {
      enters.forEach((b) => b.remove());
      if (row && !eBlock) row.insertAdjacentHTML('beforeend', `<button class="danger" data-act="gate-sneak" data-v="${obj.id}">몰래 들어간다 <span class="dim-in">민첩 판정</span></button>`);
    } else if (a.mode === 'fee') {
      enters.forEach((b) => b.insertAdjacentHTML('beforeend', ` <span class="dim-in">${fmt(a.fee)}</span>`));
      if (G.player.money < a.fee) enters.forEach((b) => { b.disabled = true; });
    }
    return r;
  };
  // 진입: 입장료를 내고 들어간다 / 불가면 막는다
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'gate') {
      const g = G.mapGates.find((x) => x.id === +String(v).split('|')[0]);
      if (g) {
        const res = G.payGateFee(g);
        if (!res.ok) { this.toast(res.msg); return this.encounter(g); }
        if (res.msg) this.toast(res.msg);
      }
    }
    if (act === 'gate-sneak') { this.closeModal(); return this.gateSneak(v); }
    return baseHandle.call(this, act, v);
  };
  // 직접 호출(파티 일정 등)도 입장 불가는 막는다. 파티 리더가 잡은 일정은 소속 파티 자격으로 들어간다.
  const baseStart = UI.startGate;
  UI.startGate = function (id, ...rest) {
    const g = G.mapGates.find((x) => x.id === +String(id).split('|')[0]);
    if (g && !g.sneak && !g.paid && !(G.crew && G.crew())) {
      const a = G.gateAccess(g);
      if (a.mode === 'deny') { this.toast(`입장 불가: ${a.why}`); return this.encounter(g); }
    }
    return baseStart.call(this, id, ...rest);
  };
  // 지도 칸 정보
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip) return;
    const g = G.objAt(x, y); if (!g || g.kind !== 'gate' || !G.gateSeen(g)) return;
    tip.insertAdjacentHTML('beforeend', fixJosa(this.gateAccessHtml(g)));
  };
  // 지도: 게이트 옆 관리 깃발
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    baseObjs.call(this);
    if (!G.mapGates) return;
    const c = this.ctx, s = this.tile;
    for (const g of G.mapGates) {
      if (!G.gateSeen(g) || !g.owner || g.north || g.final) continue;
      const [px, py] = this.toScreen(g.x + 0.5, g.y + 0.5);
      if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
      const col = G.ownerColor(g.owner); const fx = px + s * 0.32, fy = py - s * 0.46;
      c.strokeStyle = '#05080d'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + s * 0.42); c.stroke();
      c.strokeStyle = '#c9ced6'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy + s * 0.42); c.stroke();
      c.fillStyle = col; c.beginPath();
      if (g.owner === OWNER_KAMA) { c.moveTo(fx, fy); c.lineTo(fx + s * 0.22, fy + s * 0.02); c.lineTo(fx + s * 0.22, fy + s * 0.14); c.lineTo(fx + s * 0.11, fy + s * 0.22); c.lineTo(fx, fy + s * 0.14); }
      else { c.moveTo(fx, fy); c.lineTo(fx + s * 0.26, fy + s * 0.07); c.lineTo(fx, fy + s * 0.15); }
      c.closePath(); c.fill(); c.strokeStyle = '#05080d'; c.lineWidth = 1; c.stroke();
      if (g.policy === 'closed') { c.strokeStyle = '#ff4f6a'; c.lineWidth = 1.6; c.beginPath(); c.arc(fx + s * 0.11, fy + s * 0.08, s * 0.13, 0, Math.PI * 2); c.stroke(); }
    }
  };
}

// ---------- 길드 게이트 외부인: 최종층(보스층) 규칙 (4-17 추가) ----------
// 보스를 잡으면 게이트가 닫히므로 외부인은 최종층에 가지 않는 게 규칙. 갈 수는 있다.
// 최종층에 들어서면 경고 → 물러나면 길드 평판 +(C: guildGateMannerly) / 계속 가면 C 판정(guildChaseCheck) → A 추격대(gatePursuitStart).
Object.assign(UI, {
  gateFinalFloor(c) { return c && c.run && c.run.floor === c.run.floors - 1; },
  gateFinalWarn(note) {
    const c = this.ctx; const g = c.gate; const gid = G.isGuildGateOutsider(g);
    const name = G.ownerName(gid);
    const leave = this.canLeaveGate ? this.canLeaveGate() : true;
    return this.modal(`<div class="eyebrow">${c.run.floor + 1}층 · 최종층</div><h3>길드 전용 · 보스 공략권 없음</h3>
      <p class="event-text">이 층 끝에 게이트 보스가 있다. 이 게이트의 보스 공략권은 <b style="color:${G.ownerColor(gid)}">${name}</b>에 있다. 보스를 잡으면 게이트가 닫히고, 그 길드의 몫을 가로채는 셈이 된다.</p>
      <ul class="ck-items loss"><li><span class="ck-sign">!</span>계속 가면 ${name} 추격대가 따라올 수 있다 (협상 또는 대인 전투)</li><li><span class="ck-sign">!</span>보스를 잡으면 ${name}와(과) 관계가 크게 나빠지고 소문이 난다</li></ul>
      ${leave ? `<ul class="ck-items gain"><li><span class="ck-sign">+</span>여기서 물러나면 지금까지의 전리품을 챙기고 ${name}의 평판이 오른다</li></ul>` : '<p class="small bad">이 게이트는 빠져나갈 수 없다.</p>'}
      <div class="row end">${leave ? '<button class="primary" data-act="gfin-leave">물러난다</button>' : ''}<button class="danger" data-act="gfin-go">그래도 내려간다</button></div>`, 'event-box ck-box');
  },
});
{
  const baseMap = UI.renderGateMap;
  UI.renderGateMap = function (note) {
    const c = this.ctx; const g = c && c.gate;
    const out = g && G.isGuildGateOutsider ? G.isGuildGateOutsider(g) : null;
    if (out && this.gateFinalFloor(c) && !c.run.finalWarned) { c.run.finalWarned = true; c.run.finalNote = note; return this.gateFinalWarn(note); }
    const r = baseMap.call(this, note);
    // 최종층 보스 칸에 "길드 전용" 표식 (정찰 표시와 겹치지 않게 칸 위쪽에)
    if (out && this.gateFinalFloor(c)) {
      const boss = document.querySelector('#modal-box .gnode.boss');
      if (boss && !boss.querySelector('.guild-only')) boss.insertAdjacentHTML('beforeend', `<span class="guild-only" style="--c:${G.ownerColor(out)}">길드 전용 · 보스 공략권 없음</span>`);
    }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx;
    if (act === 'gfin-leave' && c && c.gate) {
      const t = G.guildGateMannerly ? G.guildGateMannerly(c.gate) : '';
      if (t) this.toast(t);
      return baseHandle.call(this, 'g-leave');
    }
    if (act === 'gfin-go' && c && c.gate) {
      this.closeModal();
      const chase = G.guildChaseCheck ? G.guildChaseCheck(c.gate) : null;
      c.run.trespass = true;
      this.renderGateMap(c.run.finalNote);
      if (chase && chase.chase && this.gatePursuitStart) this.gatePursuitStart(chase, { steps: RNG.int(1, 2) });
      return;
    }
    return baseHandle.call(this, act, v);
  };
}
