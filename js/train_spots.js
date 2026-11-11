// ===== 게이트 크로니클: 수련·휴식은 장소에서 (사용자 요청) =====
// 귀곡팔황처럼 들판 아무 데서나 수련·휴식하던 것을 바꾼다.
//  - 지도 행동 줄의 수련·휴식은 도시(거점)와 특수 수련지에서만 보인다.
//  - 도시: 어디서 할지 고른다. 수련 = 협회 수련관(유료·효율↑) / 도시 공원·공터(무료·효율↓) / 아지트 수련실(아지트가 있으면).
//          휴식 = 숙소(유료·완전 회복) / 아지트(무료·완전 회복) / 공원 노숙(무료·덜 회복).
//  - 특수 수련지: 은둔 고수의 암자(산속, 효율 크게↑, 쉴 수도 있음), 기맥 혈처(에테르 지대, 효율 가장↑).
//    지도 탐사 지점(js/explore.js)에 새 종류로 얹어 같은 방식으로 지도에 보인다.

Object.assign(SITE_KINDS, {
  hermit: { name: '은둔 고수의 암자', icon: '⛩', color: '#e8c27a', desc: '이름 없는 고수가 숨어 수행하던 산속 암자. 기운이 맑아 수련이 잘 된다.' },
  leyline: { name: '기맥 혈처', icon: '✺', color: '#b07cff', desc: '땅속 에테르 줄기가 모이는 혈처. 수련 효율이 가장 높지만 오래 머물면 몸이 버거워한다.' },
});

const TRAIN_PLACES = {
  hall: { name: '협회 수련관', mult: 1.3, cost: 60, desc: '장비와 교관이 있다. 효율이 좋지만 이용료가 든다.' },
  park: { name: '도시 공원·공터', mult: 0.8, cost: 0, desc: '공짜지만 사람이 많고 기운이 흐리다.' },
  base: { name: '아지트 수련실', mult: 1.1, cost: 0, desc: '내 공간. 수련실을 넓힐수록 좋아진다.' },
  hermit: { name: '은둔 고수의 암자', mult: 1.6, cost: 0 },
  leyline: { name: '기맥 혈처', mult: 1.8, cost: 0 },
};
const REST_PLACES = {
  inn: { name: '숙소', cost: 40, full: true, desc: '푹 잔다. 완전히 회복한다.' },
  base: { name: '아지트', cost: 0, full: true, desc: '내 집에서 쉰다. 완전히 회복한다.' },
  park: { name: '공원 노숙', cost: 0, full: false, desc: '공짜지만 체력·정신력이 70%까지만 돌아온다.' },
  hermit: { name: '암자', cost: 0, full: true, desc: '고요한 암자에서 쉰다.' },
};

Object.assign(Game.prototype, {
  // 특수 수련지를 지도 탐사 지점에 얹는다 (판마다 한 번, 옛 저장에도)
  ensureTrainSpots() {
    const e = this.exploreState && this.exploreState(); if (!e) return;
    // 지도 5배 확대 뒤 거리 조건이 너무 커서 하나도 놓이지 않던 판은 다시 놓는다
    if (e.trainSpots && e.sites.some((s) => s.kind === 'hermit' || s.kind === 'leyline')) return;
    e.trainSpots = true;
    const T = WORLD.T; const sites = e.sites; let id = sites.reduce((a, s) => Math.max(a, s.id), 0) + 1;
    const far = (i, d) => { const [x, y] = WORLD.xy(i); return !sites.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < d) && !this.objAt(x, y); };
    const K = WORLD.K || 1; // 지도 5배 확대(v0.346): 칸으로 정한 거리는 K배
    const land = EXPLORE.land;
    const pick = (kind, pool, n) => {
      for (let k = 0; k < n; k++) {
        const free = pool.filter(([i]) => far(i, 4)); if (!free.length) return; // 다른 지점과 4칸 이상 (지점이 촘촘해져 K배 거리로는 자리가 없었다)
        const i = RNG.weighted(free.map((f) => f[0]), free.map((f) => f[1]));
        const [x, y] = WORLD.xy(i);
        sites.push({ id: id++, kind, x, y, region: REGIONS[WORLD.region[i]].id, known: false, visited: false, used: 0 });
      }
    };
    pick('hermit', land.filter((i) => WORLD.tiles[i] === T.MOUNTAIN && EXPLORE.cityDist(i) >= Math.round(4 * K)).map((i) => [i, EXPLORE.cityDist(i)]), Math.round(3 * K));
    pick('leyline', land.filter((i) => WORLD.tiles[i] === T.ETHER).map((i) => [i, 1]), Math.round(2 * K));
  },
  trainSpotHere() { const s = this.siteAt && this.siteAt(this.player.x, this.player.y); return s && (s.kind === 'hermit' || s.kind === 'leyline') ? s : null; },
  hasBaseHere() { return !!(this.atBase ? this.atBase() && this.onCity() : (this.player.base && this.onCity() && this.player.base.region === this.player.region)); },
  // 장소를 정해 한 달 수련
  trainAt(place) {
    if (!this.canAct()) return '';
    const P = TRAIN_PLACES[place]; const p = this.player;
    const cost = Math.round(P.cost * RANKS[p.rankIdx].mult);
    if (cost > p.money) return `이용료 ${fmt(cost)} 크레딧이 모자란다.`;
    p.money -= cost;
    const g = this.trainGain(P.mult);
    this.addEther(g);
    this.log(`${this.region().name} ${P.name}에서 한 달간 수련했다. 에테르 +${fmt(g)}${cost ? ` (이용료 ${fmt(cost)})` : ''}`);
    this.advanceMonth(1, { eventChance: 0.22 });
    return '';
  },
  restAt(place) {
    if (!this.canAct()) return '';
    const R = REST_PLACES[place]; const p = this.player;
    const cost = Math.round(R.cost * RANKS[p.rankIdx].mult);
    if (cost > p.money) return `숙박비 ${fmt(cost)} 크레딧이 모자란다.`;
    p.money -= cost;
    if (R.full) { p.hp = p.maxHp; p.mp = p.maxMp; if (p.injured > 0) p.injured = Math.max(0, p.injured - 2); }
    else { p.hp = Math.max(p.hp, Math.round(p.maxHp * 0.7)); p.mp = Math.max(p.mp, Math.round(p.maxMp * 0.7)); if (p.injured > 0) p.injured = Math.max(0, p.injured - 1); }
    this.recalc();
    this.log(`${R.name}에서 한 달간 쉬었다.${cost ? ` (숙박비 ${fmt(cost)})` : ''}`);
    this.advanceMonth(1, { eventChance: 0.15, noRegen: true });
    return '';
  },
});

{
  // 새 지점 종류는 늘 들를 수 있다
  const baseActive = Game.prototype.siteActive;
  Game.prototype.siteActive = function (s) { if (s && (s.kind === 'hermit' || s.kind === 'leyline')) return true; return baseActive.call(this, s); };
}

Object.assign(UI, {
  trainEst(mult) { return Math.round(G.trainGain(mult)); },
  openTrainPick() {
    const p = G.player; const spot = G.trainSpotHere();
    const opts = spot ? [spot.kind] : ['hall', 'park', ...(G.hasBaseHere() ? ['base'] : [])];
    const row = (k) => { const P = TRAIN_PLACES[k]; const cost = Math.round(P.cost * RANKS[p.rankIdx].mult); return `<button class="choice-btn tp-btn" data-act="train-at" data-v="${k}" ${cost > p.money ? 'disabled' : ''}><span class="tp-top"><b>${P.name}</b><span class="tp-info">에테르 +${fmt(this.trainEst(P.mult))} · ${cost ? `${fmt(cost)} 크레딧` : '무료'}</span></span>${P.desc ? `<span class="tp-desc">${P.desc}</span>` : ''}</button>`; };
    this.modal(`<div class="eyebrow">${spot ? SITE_KINDS[spot.kind].name : `${G.onCity().name} · 수련`}</div><h3>어디서 수련할까? <span class="small dim">(1개월)</span></h3>
      ${spot ? `<p class="event-text">${SITE_KINDS[spot.kind].desc}</p>` : ''}
      <div class="cards">${opts.map(row).join('')}</div><div class="row end"><button class="ghost" data-act="modal-close">그만둔다</button></div>`, 'event-box');
  },
  openRestPick() {
    const p = G.player; const spot = G.trainSpotHere();
    const opts = spot ? ['hermit'] : ['inn', ...(G.hasBaseHere() ? ['base'] : []), 'park'];
    const row = (k) => { const R = REST_PLACES[k]; const cost = Math.round(R.cost * RANKS[p.rankIdx].mult); return `<button class="choice-btn tp-btn" data-act="rest-at" data-v="${k}" ${cost > p.money ? 'disabled' : ''}><span class="tp-top"><b>${R.name}</b><span class="tp-info">1개월 · ${cost ? `${fmt(cost)} 크레딧` : '무료'}</span></span><span class="tp-desc">${R.desc}</span></button>`; };
    this.modal(`<div class="eyebrow">휴식</div><h3>어디서 쉴까?</h3><div class="cards">${opts.map(row).join('')}</div><div class="row end"><button class="ghost" data-act="modal-close">그만둔다</button></div>`, 'event-box');
  },
});

{
  // 도시 화면 시설 목록 맨 앞에 수련·휴식
  const baseCity = UI.cityHtml;
  if (baseCity) UI.cityHtml = function (...a) {
    let html = baseCity.apply(this, a);
    if (!this.cityFac) html = html.replace('<div class="fac-grid">', `<div class="fac-grid"><button class="fac-tile" data-act="train-pick">${FX.icon('train', 26)}<b>수련</b><span class="small dim">수련관·공원·아지트 중 골라 한 달 수련</span></button><button class="fac-tile" data-act="rest-pick">${FX.icon('rest', 26)}<b>휴식</b><span class="small dim">숙소·아지트·공원에서 한 달 쉰다</span></button>`);
    return html;
  };
}
{
  // 지도 행동 줄
  const baseHud = UI.hudActions;
  UI.hudActions = function (...a) {
    try { G.ensureTrainSpots(); } catch (e) { /* 탐사 상태가 없으면 넘어간다 */ }
    let html = baseHud.apply(this, a);
    // 사용자 요청: 전체 지도에서는 수련·휴식 버튼을 두지 않는다. 도시 안 시설과 특수 수련지(지점 들르기)에서만 한다.
    const spot = G.trainSpotHere();
    html = html.replace(/<button data-act="train">[\s\S]*?<\/button>/, '').replace(/<button data-act="rest">[\s\S]*?<\/button>/, '');
    // 들판의 "수련 효율 +40%" 안내는 이제 의미가 없으니 지운다
    if (!spot) html = html.replace(' · 수련 효율 +40%', '');
    return html;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'train-pick': this._pickFromCity = !!document.querySelector('#modal-box .city-hero'); return this.openTrainPick();
      case 'rest-pick': this._pickFromCity = !!document.querySelector('#modal-box .city-hero'); return this.openRestPick();
      case 'train-at': case 'rest-at': {
        const fromCity = this._pickFromCity; this._pickFromCity = false;
        this.closeModal(); const m = act === 'train-at' ? G.trainAt(v) : G.restAt(v); if (m) this.toast(m);
        if (fromCity && !m && this.openCity && G.onCity() && !G.queue.length) { this.renderGame(); return this.openCity(); }
        return this.after();
      }
      case 'site-open': { const s = G.trainSpotHere(); if (s) { s.known = true; s.visited = true; return this.openTrainPick(); } break; }
    }
    return baseHandle.call(this, act, v);
  };
}
