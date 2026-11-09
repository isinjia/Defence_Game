// ===== 히든 피스 선점 경쟁 =====
// 설계: docs/헌터물_제안3.md 2
//  - 새 게임마다 6곳의 히든 피스를 지역에 숨긴다. 각각 열리는 시기와 조건(등급)이 있다.
//  - 단서는 소문·포차 브로커·떠도는 이야기에서 조각으로 모인다. 단서 2개면 지역을 알고 찾아갈 수 있다.
//  - NPC도 매달 확률로 먼저 차지한다. 차지한 NPC는 갑자기 강해지고 뉴스가 된다.
//  - 회귀자는 지난 생에 본 히든 피스를 기억한다(세계가 달라 일부만 맞는다).

const HIDDEN_TPL = [
  { id: 'hp_blackflame', kind: 'class', cls: 'blackflame', name: '흑염의 검총(劍塚)', minRank: 2, guard: true, hint: '검은 불꽃이 꺼지지 않는 무덤' },
  { id: 'hp_machine', kind: 'class', cls: 'machinist', name: '봉인된 기계 신전', minRank: 2, guard: true, hint: '밤마다 톱니 소리가 나는 폐공장' },
  { id: 'hp_gate', kind: 'class', cls: 'gatekeeper', name: '첫 문의 잔해', minRank: 3, guard: true, hint: '대붕괴 첫날 열린 문의 파편' },
  { id: 'hp_sword', kind: 'weapon', name: '말하는 검이 꽂힌 바위', minRank: 1, guard: true, hint: '뽑으려는 자에게 말을 거는 칼' },
  { id: 'hp_devour', kind: 'devour', name: '포식자의 둥지', minRank: 2, guard: true, hint: '괴수끼리 서로를 먹는 굴' },
  { id: 'hp_spring', kind: 'spring', name: '지하 에테르 샘', minRank: 0, hint: '지하철 폐선 아래에서 솟는 빛' },
  { id: 'hp_tablet', kind: 'skill', name: '고대 각성자의 석판', minRank: 1, hint: '읽을 수 없는 글자가 새겨진 돌' },
  { id: 'hp_vault', kind: 'vault', name: '대붕괴 이전의 금고', minRank: 0, hint: '무너진 은행 지하의 문' },
  { id: 'hp_heart', kind: 'heart', name: '잠든 고룡의 심장', minRank: 4, guard: true, hint: '바다 밑에서 뛰는 거대한 맥박' },
];
const HIDDEN_N = 6;
const hiddenTpl = (id) => HIDDEN_TPL.find((t) => t.id === id);

Object.assign(Game.prototype, {
  hiddenInit() {
    if (!this.world || !this.player) return;
    this.player.hiddenMods ??= {};
    if (this.world.hidden) return;
    const regs = REGIONS.filter((r) => r.id !== 'jeju').map((r) => r.id);
    const tpls = [...HIDDEN_TPL].sort(() => RNG.next() - 0.5).slice(0, HIDDEN_N);
    const mk = this.monthKey();
    this.world.hidden = tpls.map((t) => ({ id: t.id, region: RNG.pick(regs), open: mk + RNG.int(0, 30) + t.minRank * 4, clues: 0, taken: null }));
  },
  hiddenList() { return (this.world && this.world.hidden) || []; },
  hiddenOpen(h) { return this.monthKey() >= h.open; },
  hiddenCanClaim(h) {
    const p = this.player; const t = hiddenTpl(h.id);
    return !h.taken && h.clues >= 2 && this.hiddenOpen(h) && p.rankIdx >= t.minRank && p.region === h.region;
  },
  addClue(h, why) {
    if (!h || h.taken || h.clues >= 3) return '';
    h.clues++;
    const t = hiddenTpl(h.id);
    const txt = h.clues === 1 ? `어딘가에 '${t.hint}'이(가) 있다는 이야기` : h.clues === 2 ? `'${t.name}'은(는) ${regionById(h.region).name} 근방에 있다` : `${t.name}: 정확한 위치를 알아냈다`;
    this.log(`[히든 피스 단서] ${txt}${why ? ` · ${why}` : ''}`, 'major');
    return txt;
  },
  randomClue(why) {
    const pool = this.hiddenList().filter((h) => !h.taken && h.clues < 2);
    if (!pool.length) return '';
    return this.addClue(RNG.pick(pool), why);
  },
  // NPC 경쟁자가 먼저 차지한다
  hiddenMonthly() {
    const mk = this.monthKey();
    for (const h of this.hiddenList()) {
      if (h.taken || mk < h.open) continue;
      const t = hiddenTpl(h.id);
      const rivals = this.npcs.filter((n) => n.alive && !n.child && !n.isCompanion && n.rankIdx >= t.minRank && n.region === h.region);
      if (!rivals.length || !RNG.chance(Math.min(0.06, 0.008 * rivals.length + Math.max(0, mk - h.open) * 0.0006))) continue;
      const n = RNG.pick(rivals);
      h.taken = n.id;
      n.rankIdx = Math.min(7, n.rankIdx + 1); n.stage = 0; n.hiddenPiece = h.id;
      if (t.kind === 'class') n.cls = t.cls;
      const head = t.kind === 'class' ? `무명 ${RANKS[n.rankIdx - 1].key}급 ${n.name}, 히든 직업 [${classById(t.cls).name}] 각성!` : `${n.name}, ${t.name}을(를) 차지하다 — 단숨에 ${RANKS[n.rankIdx].key}급으로`;
      this.rumor(head);
      if (h.clues > 0) this.log(`쫓던 히든 피스 [${t.name}]을(를) ${n.name}이(가) 먼저 차지했다.`, 'bad');
      return;
    }
    // 떠도는 이야기에서 단서를 줍는다
    if (RNG.chance(0.05)) this.randomClue('떠도는 소문');
  },
  // 히든 피스를 얻었을 때
  hiddenGrant(h) {
    const p = this.player; const t = hiddenTpl(h.id);
    h.taken = 'player';
    let msg = '';
    switch (t.kind) {
      case 'class': { const got = this.setClass(t.cls, '히든 피스'); msg = `히든 직업 [${classById(t.cls).name}]에 각성했다.${got.length ? ` 새 스킬: ${got.join(', ')}` : ''}`; break; }
      case 'weapon': msg = this.soulWeaponGrant ? this.soulWeaponGrant() : ''; break;
      case 'devour': msg = this.devourGrant ? this.devourGrant() : ''; break;
      case 'spring': p.hiddenMods.train = (p.hiddenMods.train || 0) + 0.12; msg = '샘물에 몸을 담그자 에테르 순환이 달라졌다. 수련 효율 +12% (영구)'; break;
      case 'skill': {
        const pool = SKILLS.filter((s) => s.price && !s.cls && s.rankReq <= p.rankIdx + 1 && !p.skills.includes(s.id)).sort((a, b) => b.rankReq - a.rankReq || b.power - a.power);
        const s = pool[0];
        if (s) { p.skills.push(s.id); if (p.equipSkills.length < 5) p.equipSkills.push(s.id); msg = `석판의 글자가 머릿속으로 흘러들었다. 스킬 [${s.name}] 습득`; }
        else { this.etherGift(200); msg = '석판의 지식은 이미 아는 것이었다. 대신 에테르가 차올랐다.'; }
        break;
      }
      case 'vault': { const v = Math.round(3000 * RANKS[p.rankIdx].mult ** 1.4); p.money += v; msg = `금고 안에 대붕괴 이전의 자산이 잠들어 있었다. +${fmt(v)} 크레딧, ${this.addRelic(null, 2)}`; break; }
      case 'heart': p.hiddenMods.hp = (p.hiddenMods.hp || 0) + 0.15; p.lifeBonus += 5; msg = '고룡의 심장이 당신의 심장과 함께 뛴다. 체력 +15% (영구), 수명 +5년'; break;
      default: break;
    }
    this.recalc();
    this.lifeEvent(`히든 피스 [${t.name}]을(를) 차지했다.`);
    this.rumor(`${p.name}이(가) 히든 피스 [${t.name}]을(를) 차지했다는 소문이 돈다.`);
    p.fame += 15;
    return msg;
  },
});

// ---------- 기존 기능과의 연결 ----------
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  wrap('initSandbox', function (base) { base.call(this); this.hiddenInit(); });
  wrap('extraMod', function (base, key) { const p = this.player; return base.call(this, key) + ((p.hiddenMods && p.hiddenMods[key]) || 0); });
  wrap('worldMonthly', function (base) { base.call(this); this.hiddenMonthly(); });
  // 정보 브로커는 가끔 히든 피스 단서도 판다
  if (GP.buyIntel) wrap('buyIntel', function (base) {
    const r = base.call(this);
    if (typeof r === 'string' && r.includes('크레딧') && RNG.chance(0.4)) { const c = this.randomClue('정보 브로커'); if (c) return `${r} 그리고 덤으로: "${c}."`; }
    return r;
  });
  // 회귀: 지난 생에 본 히든 피스를 기억한다
  wrap('gameOver', function (base, reason) {
    base.call(this, reason);
    try {
      const d = JSON.parse(localStorage.getItem(REGRESS_KEY) || 'null'); if (!d) return;
      d.hiddenSeen = this.hiddenList().filter((h) => h.clues >= 2 || h.taken === 'player').map((h) => ({ id: h.id, region: h.region }));
      localStorage.setItem(REGRESS_KEY, JSON.stringify(d));
    } catch (e) { /* 저장 불가 */ }
  });
  wrap('newGame', function (base, opts) {
    base.call(this, opts);
    const p = this.player; if (!p || !p.regress) return;
    const d = Game.regressData(); const seen = (d && d.hiddenSeen) || [];
    let n = 0;
    for (const s of seen) {
      let h = this.hiddenList().find((x) => x.id === s.id);
      if (!h) continue;
      if (RNG.chance(0.6)) { h.region = s.region; h.clues = 2; n++; } else h.clues = 1;
    }
    if (n) this.log(`지난 생의 기억: 히든 피스 ${n}곳의 위치가 떠오른다. (세계가 조금 달라졌을지도 모른다)`, 'major');
  });
}

// ---------- 화면 ----------
{
  UI.hiddenHtml = function () {
    const list = G.hiddenList().filter((h) => h.clues > 0 || h.taken === 'player');
    if (!list.length) return '<div class="sec"><div class="sec-title">히든 피스 수첩</div><div class="small dim">아직 아무 단서도 없다. 포차의 정보 브로커나 떠도는 소문에 귀를 기울이자.</div></div>';
    return `<div class="sec"><div class="sec-title">히든 피스 수첩</div><div class="cards">${list.map((h) => {
      const t = hiddenTpl(h.id); const can = G.hiddenCanClaim(h);
      const who = h.taken === 'player' ? '<span class="good">차지함</span>' : h.taken != null ? `<span class="bad">${(G.npcById(h.taken) || {}).name || '누군가'}이(가) 선점</span>` : '';
      const where = h.clues >= 2 ? regionById(h.region).name : '어딘가';
      const state = h.taken != null ? who : !G.hiddenOpen(h) ? '<span class="dim">아직 때가 아니다</span>' : G.player.rankIdx < t.minRank ? `<span class="dim">${RANKS[t.minRank].key}급 이상</span>` : h.clues < 2 ? '<span class="dim">단서 부족</span>' : G.player.region !== h.region ? `<span class="amber">${where}로 가야 한다</span>` : '<span class="good">근처다!</span>';
      return `<div class="item-row"><div class="grow"><b>${h.clues >= 2 || h.taken === 'player' ? t.name : '???'}</b> <span class="small dim">단서 ${h.clues}/3 · ${where}</span><div class="small dim">${t.hint} · ${state}</div></div>
        ${can ? `<button class="sm primary" data-act="hidden-go" data-v="${h.id}">찾아간다</button>` : ''}</div>`; }).join('')}</div></div>`;
  };
  const baseChar = UI.charHtml;
  UI.charHtml = function () { return baseChar.call(this) + this.hiddenHtml(); };
  UI.hiddenGo = function (id) {
    const h = G.hiddenList().find((x) => x.id === id); if (!h || !G.hiddenCanClaim(h)) return;
    const t = hiddenTpl(h.id); const p = G.player;
    this.closeModal();
    if (!t.guard) { const msg = G.hiddenGrant(h); G.advanceDays(7, { eventChance: 0 }); G.save(); this.renderGame(); return this.modal(`<div class="eyebrow">히든 피스</div><h3>${t.name}</h3><p class="event-text">${msg}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box'); }
    const tier = Math.min(7, Math.max(t.minRank, p.rankIdx) + (h.clues >= 3 ? 0 : 1));
    G.storyFight({ title: `${t.name}의 수호자`, mobs: { tier, n: 1, boss: true, name: `[수호자] ${t.name}` },
      win: { text: '수호자가 무너지고 길이 열렸다.', after: (g) => { UI.hiddenMsg = g.hiddenGrant(h); g.queue.push({ type: 'hidden-done', name: t.name }); } },
      lose: { text: '수호자에게 밀려났다. 다시 올 수 있다. 다른 누군가가 먼저 오지 않는다면.', gain: { injure: 1 } } });
    this.processQueue();
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen()) return;
    const q = G.queue[0];
    if (q && q.type === 'hidden-done') { G.queue.shift(); return this.modal(`<div class="eyebrow">히든 피스</div><h3>${q.name}</h3><p class="event-text">${this.hiddenMsg || ''}</p><div class="row end"><button class="primary" data-act="modal-close">확인</button></div>`, 'event-box'); }
    return baseQueue.call(this);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'hidden-go') return this.hiddenGo(v);
    return baseHandle.call(this, act, v);
  };
}
