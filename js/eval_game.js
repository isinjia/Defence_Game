// ---------- 평가 보정: 게임 규칙 쪽 ----------
// 1) 에테르가 돌파 직전까지 가득 찼는데 수련하면 '+43'만 보이고 한 달이 그냥 지나가던 문제 → 막고 돌파를 안내한다.
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  GP.etherCapped = function () {
    const p = this.player; if (!p) return false;
    return p.stage === 2 && p.rankIdx < RANKS.length - 1 && p.ether >= stageReq(p.rankIdx, 2);
  };
  GP.etherCapMsg = function () {
    const p = this.player; const next = RANKS[p.rankIdx + 1].key;
    return this.hasCatalyst && this.hasCatalyst()
      ? `에테르가 가득 찼다. 더 수련해도 늘지 않는다. 각성 촉매가 있으니 정보 창에서 ${next}급 돌파를 시도하자.`
      : `에테르가 가득 찼다. 더 수련해도 늘지 않는다. 공방이나 헌터 마켓에서 각성 촉매를 구해 ${next}급 돌파를 하자.`;
  };
  const baseTrainAt = GP.trainAt;
  // 첫 해 수첩 '한 달 수련'은 G.train 만 감싸서, 도시 수련(trainAt)으로는 영영 안 끝나던 문제(독립 평가 치명)도 여기서.
  const nbTrain = (g) => { const nb = g.player && g.player.notebook; if (nb && nb.f) nb.f.train = true; };
  if (baseTrainAt) GP.trainAt = function (place) {
    if (this.etherCapped()) { nbTrain(this); return this.etherCapMsg(); }
    const r = baseTrainAt.call(this, place); if (!r) nbTrain(this); return r;
  };
}
if (typeof UI !== 'undefined') {
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if ((act === 'train' || act === 'train-pick') && G.player && G.etherCapped()) { const nb = G.player.notebook; if (nb && nb.f) nb.f.train = true; this.toast(G.etherCapMsg()); if (G.nbCheck) G.nbCheck(); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
}

// 2) 전투 긴장 (독립 평가: '공격'만 눌러도 체력 10~20%만 잃고 이김 → 전투 재미 과락).
// 자기 등급 게이트를 파티로 돌면 끝 체력 약 80%였다. 일반 괴수·보스의 위협을 올려 50~65% 선으로.
// 헌터 시험(튜토리얼) 괴수는 그대로 둔다.
const THREAT = { atk: 1.1, hp: 1.08, bossAtk: 1.15, bossHp: 1.25 };
if (typeof Game !== 'undefined') {
  const baseMake = Game.prototype.makeMonster;
  Game.prototype.makeMonster = function (tier, boss, prefElem) {
    const m = baseMake.call(this, tier, boss, prefElem);
    if (this._tutorialMobs || !m) return m;
    const a = boss ? THREAT.bossAtk : THREAT.atk; const h = boss ? THREAT.bossHp : THREAT.hp;
    m.atk = Math.round(m.atk * a); m.hp = m.maxHp = Math.round(m.maxHp * h);
    return m;
  };
}
if (typeof UI !== 'undefined' && UI.examEnemies) {
  const baseExamEn = UI.examEnemies;
  UI.examEnemies = function (...a) {
    G._tutorialMobs = true;
    try {
      const list = baseExamEn.apply(this, a);
      // 첫 구역(조작 안내 3단계)은 동료 넷이 두 턴 만에 다 잡아 '회복약' 안내 때 적이 없던 문제 → 조금 더 버티게
      if (!a[0] && Array.isArray(list)) for (const e of list) { e.hp = e.maxHp = Math.round(e.maxHp * 1.5); e.atk = Math.round(e.atk * 1.15); }
      return list;
    } finally { G._tutorialMobs = false; }
  };
}

// 파티는 머릿수만큼 적 체력만 늘고 공격은 거의 그대로라 여전히 쉬웠다 → 3인 이상이면 적 공격을 조금 더.
if (typeof Game !== 'undefined') {
  const baseScale = Game.prototype.scaleForParty;
  Game.prototype.scaleForParty = function (list, tier) {
    const r = baseScale.call(this, list, tier); const n = this.partySize();
    if (n >= 3 && !this._tutorialMobs) for (const e of r) e.atk = Math.round(e.atk * (1 + 0.13 * (n - 2)));
    return r;
  };
}

// 3) 이름 겹침 (독립 평가: 플레이어 한서준 옆에 허서준·정서준, 소율 셋이 동시에). 이름 풀이 성별당 20개뿐이었다.
//    풀을 넓히고, 플레이어·살아 있는 인물과 이름(성 뺀 부분)이 겹치면 다시 뽑는다.
if (typeof GIVEN_M !== 'undefined' && typeof GIVEN_F !== 'undefined') {
  const addM = ['은호', '시윤', '이안', '선우', '유찬', '로운', '지환', '승민', '정우', '도현', '예준', '주원', '한결', '윤호', '태오', '성민', '동하', '민규', '재윤', '이준', '경민', '상혁', '찬영', '규현', '진혁', '무진', '해성', '기훈', '인호', '석진'];
  const addF = ['윤슬', '서윤', '가온', '나연', '수빈', '하은', '지민', '다인', '연우', '시은', '예나', '혜원', '보람', '은채', '소희', '라온', '민서', '유진', '채아', '서연', '아영', '규리', '해인', '다솜', '은지', '희수', '나래', '여름', '초아', '진아'];
  for (const n of addM) if (!GIVEN_M.includes(n)) GIVEN_M.push(n);
  for (const n of addF) if (!GIVEN_F.includes(n)) GIVEN_F.push(n);
}
if (typeof Game !== 'undefined') {
  const given = (s) => (s && s.length >= 3 ? s.slice(1) : s);
  const baseNpc = Game.prototype.makeNpc;
  Game.prototype.makeNpc = function (...a) {
    const n = baseNpc.apply(this, a);
    try {
      if (!n || !this.player || !this.npcs || typeof SURNAMES === 'undefined') return n;
      const pool = n.gender === 'M' ? GIVEN_M : GIVEN_F;
      const others = this.npcs.filter((x) => x.alive !== false && x.id !== n.id);
      if (pool.some((g) => n.name.endsWith(g))) {
        const taken = new Set([given(this.player.name), ...others.map((x) => given(x.name))]);
        for (let i = 0; i < 8 && taken.has(given(n.name)); i++) n.name = RNG.pick(SURNAMES) + RNG.pick(pool);
      } else if (n.race && typeof RACES !== 'undefined' && RACES[n.race] && RACES[n.race].names) {
        // 이종족: 같은 이름이 이미 있으면 다시 뽑고, 그래도 겹치면 2세·3세처럼 구분
        const rp = RACES[n.race].names[n.gender] || []; const taken = new Set(others.map((x) => x.name));
        for (let i = 0; i < 8 && taken.has(n.name) && rp.length; i++) n.name = RNG.pick(rp);
        if (taken.has(n.name)) { let k = 2; while (taken.has(`${n.name} ${k}세`)) k++; n.name = `${n.name} ${k}세`; }
      }
    } catch (e) { /* 무시 */ }
    return n;
  };
}

// 4) 지도 걷기: 한 칸마다 이야기 사건 30%라 몇 칸 못 가 멈췄다(독립 평가 첫 30분). 걷는 중에는 절반으로.
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  const baseWalk = GP.walkStep;
  GP.walkStep = function (...a) { this._walking = true; try { return baseWalk.apply(this, a); } finally { this._walking = false; } };
  const baseDays = GP.advanceDays;
  GP.advanceDays = function (n, opts = {}) {
    if (this._walking && opts.eventChance === 0.3) opts = { ...opts, eventChance: 0.15 };
    return baseDays.call(this, n, opts);
  };
}

// 5) 길드·보호국 소속인데 게이트 결과에 '무소속 파티 분배'와 '소속 규정: 귀속'이 함께 나오던 모순(독립 평가).
//    balance.js 주석대로 소속(월급제+성과급)이면 자유 파티 분배를 하지 않는다.
if (typeof Game !== 'undefined' && Game.prototype.shareMates) {
  const baseShare = Game.prototype.shareMates;
  Game.prototype.shareMates = function () {
    const p = this.player;
    if (p && p.guild && this.payKind && this.payKind(p.guild)) return [];
    return baseShare.call(this);
  };
}

// 6) 같은 수첩 과제 창(nb_msg)이 연달아 두 번 뜨던 문제: 큐에 같은 수첩 사건이 둘 이상이면 하나만.
if (typeof Game !== 'undefined' && Game.prototype.nbCheck) {
  const baseNb = Game.prototype.nbCheck;
  Game.prototype.nbCheck = function (...a) {
    const nb0 = this.player && this.player.notebook; const i0 = nb0 && nb0.i;
    const r = baseNb.apply(this, a);
    // 과제를 마쳤는데 위쪽 '수첩 n/6' 줄이 다음 화면 갱신까지 그대로이던 문제(3차 평가): 바로 고쳐 그린다
    if (nb0 && nb0.i !== i0 && typeof UI !== 'undefined' && UI.hudQuests) setTimeout(() => { try { const tr = document.getElementById('hud-tr'); if (tr) { const fold = tr.querySelector('.fold-obj-btn'); tr.innerHTML = fixJosa(UI.hudQuests()); if (fold) tr.prepend(fold); } } catch (e) { /* 무시 */ } }, 0);
    const seen = new Set();
    this.queue = (this.queue || []).filter((q) => { if (!q || q.type !== 'story' || !/^nb_/.test(q.id || '')) return true; const k = q.id; if (seen.has(k)) return false; seen.add(k); return true; });
    return r;
  };
}

// 7) 부탁 의뢰: C급 베테랑이 F급 신입에게 "혼자 들어가기 불안해서" 부탁하던 어긋남 → 나보다 한 등급 넘게 높은 사람은 빼고.
if (typeof REQUESTS !== 'undefined' && REQUESTS.help_gate) {
  const baseWho = REQUESTS.help_gate.who;
  REQUESTS.help_gate.who = (g) => baseWho(g).filter((n) => n.rankIdx <= g.player.rankIdx + 1);
}

// 8) 시험 뒤 '일주일 뒤', '첫 주 수입' 같은 서술이 나와도 날짜가 3월 1일에 머물던 문제: 소속·첫 파티가 정해지면 일주일이 흐른다.
if (typeof UI !== 'undefined' && UI.firstPartyDone) {
  const baseFpd = UI.firstPartyDone;
  UI.firstPartyDone = function (...a) {
    try { if (G.player && !G.over && (G.day || 1) <= 7 && !G.player.fpWeek) { G.player.fpWeek = true; G.advanceDays(7, { noSave: true }); } } catch (e) { /* 무시 */ }
    return baseFpd.apply(this, a);
  };
}

// 9) 나고 자란 도시에서도 '외지인'으로 뜨던 어긋남: 시작 지역은 '아는 얼굴'(평판 12)에서 출발.
if (typeof Game !== 'undefined' && Game.prototype.newGame) {
  const baseNew = Game.prototype.newGame;
  Game.prototype.newGame = function (...a) {
    const r = baseNew.apply(this, a);
    try { const p = this.player; if (p && p.rep && p.region && (p.rep[p.region] || 0) < 12) p.rep[p.region] = 12; } catch (e) { /* 무시 */ }
    return r;
  };
}

// 10) 레드 게이트가 '쉬움'으로 표시되고 체력을 거의 안 잃고 깨지던 문제: 레드는 괴수가 한 등급 위(표시도 한 등급 위로, ui.js gateRisk 호출부).
if (typeof GateRun !== 'undefined' && GateRun.tier) {
  const baseTier = GateRun.tier;
  GateRun.tier = function (gate) { const t = baseTier.call(this, gate); return gate && gate.variant === 'red' && !gate.final ? Math.min(7, t + 1) : t; };
}

// 11) 후반 크레딧 인플레이션(독립 평가: 70년에 900만~1,300만): 등급별 기준(30만 × 등급 배수)을 넘는 자산에 매달 1.5% '각성자 고소득 특별세'.
//     초반·가난한 판에는 닿지 않고, 쌓아 두기만 한 돈을 깎아 투자·후원·장비로 쓰게 민다.
const WEALTH_TAX = { base: 300000, rate: 0.015 };
if (typeof Game !== 'undefined') {
  const baseMonth = Game.prototype.advanceMonth;
  Game.prototype.advanceMonth = function (n = 1, opts = {}) {
    const r = baseMonth.call(this, n, opts);
    try {
      const p = this.player; if (!p || this.over) return r;
      const thr = Math.round(WEALTH_TAX.base * RANKS[p.rankIdx].mult);
      if (p.money > thr) {
        const tax = Math.round((p.money - thr) * WEALTH_TAX.rate * n);
        if (tax > 0) { p.money -= tax; p.taxPaid = (p.taxPaid || 0) + tax; this.log(`각성자 고소득 특별세 ${fmt(tax)} 크레딧 납부 (자산 ${fmt(thr)} 초과분의 ${WEALTH_TAX.rate * 100}%)`); }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}


// 12) 5인 파티에서 내 차례가 5번에 1번꼴이라 자동 전투처럼 느껴졌다(3차 독립 평가 전투 재미).
//     직접 조작할 때(자동 아님), 아군이 셋 이상이면 내 행동 게이지가 25% 빨리 찬다. 자동 전투·모의 전투(runAll)는 그대로.
if (typeof Combat !== 'undefined') {
  const baseFillRate = Combat.prototype.fillRate;
  Combat.prototype.fillRate = function (u) {
    const f = baseFillRate.call(this, u);
    if (u && u.isPlayer && !this.auto && !this._sim && this.units.filter((x) => x.side === 'ally' && !x.summon).length >= 3) return f * 1.25;
    return f;
  };
  const baseRunAll = Combat.prototype.runAll;
  if (baseRunAll) Combat.prototype.runAll = function (...a) { this._sim = true; try { return baseRunAll.apply(this, a); } finally { this._sim = false; } };
}
