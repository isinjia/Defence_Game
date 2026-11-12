// ===== 게이트 크로니클: 탐색계는 월드맵 시야가 넓다 (영역 A, 사용자 요청) =====
// 시야(안개 걷힘)를 크게 줄인 대신, 나나 파티원 중 탐색계가 있으면 넓어진다. 가장 잘 보는 한 사람 기준(G.partyScout).
//  - 등급: F~D급 +1칸, C~B급 +2칸, A급 이상 +3칸
//  - 전직(엘리트·마스터 등) 1단계마다 +1칸
//  - 레인저: 산·숲에 서면 +2칸 (높은 곳·우거진 곳에서 멀리 본다)
//  - 패스파인더: 늘 +1칸 (길잡이)
// 북부의 짙은 안개(north.js)는 그대로 시야 1칸이다.
const RECON_VISION = { rank: [1, 1, 1, 2, 2, 3, 3, 3], adv: 1, rangerHigh: 2, wayfinder: 1 };
{
  const GP = Game.prototype;
  GP.reconVisionBonus = function (x, y) {
    const sc = this.partyScout ? this.partyScout() : null; if (!sc) return 0;
    let b = RECON_VISION.rank[Math.max(0, Math.min(7, sc.rankIdx || 0))] + (sc.adv || 0) * RECON_VISION.adv;
    if (sc.cls === 'pathfinder' && x != null) { const t = WORLD.type(x, y); if (t === WORLD.T.MOUNTAIN || t === WORLD.T.FOREST) b += RECON_VISION.rangerHigh; }
    if (sc.cls === 'wayfinder') b += RECON_VISION.wayfinder;
    return b;
  };
  // 시야 반경 계산(world_scale.js)과 같은 식으로 기본 반경을 구해 그 위에 더 밝힌다
  const fill = (g, x, y, r) => {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + r || !WORLD.inb(x + dx, y + dy)) continue;
      g.fog[WORLD.idx(x + dx, y + dy)] = 1;
    }
  };
  GP.reconFill = function (x, y, r) { fill(this, x, y, r); };
  const baseReveal = GP.reveal;
  GP.reveal = function (x, y, r, ...a) {
    const out = baseReveal.call(this, x, y, r, ...a);
    try {
      if (r <= 6 && this.fog && this.player) {
        const bonus = this.reconVisionBonus(x, y);
        if (bonus > 0) fill(this, x, y, Math.max(1, Math.round(r * WORLD.K * 0.128)) + bonus);
        if (this.reconSense) this.reconSense(x, y, 0);
      }
    } catch (e) { /* 무시 */ }
    return out;
  };
}

// ===== 탐색계 특기 2: 감지·투시 / 로그의 기습 회피 / [정찰] 행동 (사용자 확정) =====
//  - 감지 능력자·투시 능력자(나 또는 파티원): 안개 속이라도 반경 5+등급+전직 칸 안의 게이트·괴수 무리를 "?" 표식으로 감지한다(지형은 안 보인다).
//    투시 능력자는 등급까지 짐작한다. 멀수록 한 단계 틀릴 수 있다(들어가 보거나 시야에 들어오면 진짜가 보인다).
//  - 로그: 괴수 무리의 기습을 먼저 알아채면(50%+등급) 기습 대신 "먼저 봤다" 창 → [피해 간다] / [먼저 친다].
//  - [정찰]: 탐색계가 있으면 지도 행동에 생긴다. 반나절을 쓰고 지금 자리에서 시야 +4칸을 한 번 밝힌다(감지 범위도 +4).
const RECON_FIELD = { senseBase: 5, scanDays: 0.5, scanPlus: 4, rogueBase: 0.5, rogueRank: 0.06, farWrong: 0.3 };
{
  const GP = Game.prototype;
  const cands = (g) => { const p = g.player; return [{ who: null, name: p.name, cls: p.cls, rankIdx: p.rankIdx, adv: p.clsAdv }, ...(g.party ? g.party() : []).filter((n) => n && n.alive).map((n) => ({ who: n, name: n.name, cls: n.cls, rankIdx: n.rankIdx, adv: n.clsAdv }))]; };
  const bestOf = (g, ids) => cands(g).filter((c) => ids.includes(c.cls)).sort((a, b) => g.scoutPower(b.cls, b.rankIdx, b.adv) - g.scoutPower(a.cls, a.rankIdx, a.adv))[0] || null;
  GP.reconSenser = function () { return bestOf(this, ['echo_scout', 'farsight']); };
  GP.reconRogue = function () { return bestOf(this, ['tracker']); };
  GP.reconSense = function (x, y, plus) {
    const s = this.reconSenser(); const w = this.world; if (!w) return;
    w.sensed ??= {};
    // 사라졌거나 이미 보이는 것은 지운다
    for (const k of Object.keys(w.sensed)) { const o = this.reconObj(k); if (!o || this.objSeen(o)) delete w.sensed[k]; }
    if (!s) return;
    const R = RECON_FIELD.senseBase + (s.rankIdx || 0) + (s.adv || 0) + (plus || 0);
    const look = (o, key) => {
      const d = Math.max(Math.abs(o.x - x), Math.abs(o.y - y)); if (d > R || this.objSeen(o) || w.sensed[key]) return;
      let t = null;
      if (s.cls === 'farsight') { const off = d > R * 0.5 && RNG.chance(RECON_FIELD.farWrong) ? RNG.pick([-1, 1]) : 0; t = Math.max(0, Math.min(7, (o.tier || 0) + off)); }
      w.sensed[key] = { t, by: s.name };
    };
    for (const g of this.mapGates || []) look(g, 'g' + g.id);
    for (const m of this.mobs || []) look(m, 'm' + m.id);
  };
  GP.reconObj = function (k) { const id = k.slice(1); return k[0] === 'g' ? (this.mapGates || []).find((g) => String(g.id) === id) : (this.mobs || []).find((m) => String(m.id) === id); };
  // [정찰]
  GP.reconScan = function () {
    const sc = this.partyScout ? this.partyScout() : null; const p = this.player;
    if (!sc) return '정찰할 사람이 없다. 탐색계 헌터가 있어야 한다.';
    this.advanceDays(RECON_FIELD.scanDays);
    const r = Math.max(1, Math.round(3 * WORLD.K * 0.128)) + this.reconVisionBonus(p.x, p.y) + RECON_FIELD.scanPlus;
    this.reconFill(p.x, p.y, r);
    this.reconSense(p.x, p.y, RECON_FIELD.scanPlus);
    this.save();
    return `${sc.who ? sc.name : '당신'}이(가) 주변을 정찰했다. 반경 ${r}칸이 드러났다. (반나절)`;
  };
  // 로그: 기습을 먼저 알아챈다
  const baseWalk = GP.walkStep;
  if (baseWalk) GP.walkStep = function (...a) {
    const before = this.queue.length; const r = baseWalk.apply(this, a);
    try {
      const rg = this.reconRogue();
      if (rg) for (let i = before; i < this.queue.length; i++) {
        const q = this.queue[i];
        if (q && q.type === 'mobAmbush' && RNG.chance(RECON_FIELD.rogueBase + (rg.rankIdx || 0) * RECON_FIELD.rogueRank)) this.queue[i] = { type: 'mobSpot', mobId: q.mobId, by: rg.who ? rg.name : null };
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
if (typeof UI !== 'undefined') {
  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return baseQ.call(this);
    const q = G.queue[0];
    if (q && q.type === 'mobSpot') {
      G.queue.shift();
      const mob = G.mobs.find((m) => m.id === q.mobId); if (!mob) return this.processQueue();
      return this.modal(`<div class="enc mob-enc"><div class="mob-portrait" style="--c:${elemColor(mob.elem)}">${FX.monster({ name: mob.name, elem: mob.elem, shape: mob.shape }, 130)}</div>
        <div><div class="eyebrow">먼저 알아챘다 · ${G.fullDate()}</div><h3>${mob.name} 무리 ×${mob.count}</h3><div class="row">${this.rankTag(mob.tier)} ${this.elemTag(mob.elem)}</div>
        <p class="dim">${q.by ? `${q.by}(로그)이(가)` : '당신이'} 덤불 너머의 기척을 먼저 읽었다. 무리는 아직 이쪽을 모른다.</p></div></div>
        <div class="row end"><button class="ghost" data-act="modal-close">피해 간다</button><button class="danger" data-act="mob" data-v="${mob.id}">먼저 친다</button></div>`);
    }
    return baseQ.call(this);
  };
  const baseActs = UI.hudActions;
  UI.hudActions = function (...a) {
    const html = baseActs.apply(this, a);
    try {
      if (!G.partyScout || !G.partyScout() || (G.onCity && G.onCity())) return html;
      const btn = `<button data-act="recon-scan"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" class="ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg> 정찰 <span class="dim-in">반나절 · 시야 +${RECON_FIELD.scanPlus}</span></button>`;
      return html.includes('class="act-btns">') ? html.replace('class="act-btns">', `class="act-btns">${btn}`) : html + btn;
    } catch (e) { return html; }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'recon-scan') { const msg = G.reconScan(); this.renderGame(); this.toast(msg); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
}
if (typeof MapView !== 'undefined') {
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function (...a) {
    const r = baseObjs.apply(this, a);
    try {
      const sensed = G.world && G.world.sensed; if (!sensed) return r;
      const c = this.ctx, s = this.tile, t = this.t || 0;
      for (const [k, info] of Object.entries(sensed)) {
        const o = G.reconObj(k); if (!o || G.objSeen(o)) continue;
        const [px, py] = this.toScreen(o.x + 0.5, o.y + 0.5);
        if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
        const col = k[0] === 'g' ? '#d65cff' : '#ff6b7d'; const a2 = 0.55 + Math.sin(t / 20 + o.id) * 0.2;
        c.save(); c.globalAlpha = a2;
        c.strokeStyle = col; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.arc(px, py, s * 0.3, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = col; c.font = `bold ${Math.round(s * 0.36)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', px, py + 1);
        c.restore();
        if (info.t != null && this.chip) this.chip(px, py + s * 0.48, `${k[0] === 'g' ? '게이트' : '무리'} ${RANKS[info.t].key}?`, RANKS[info.t].color);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
