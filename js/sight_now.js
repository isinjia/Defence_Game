// ===== 게이트 크로니클: 현재 위치 기준 시야 (사용자 요청) =====
// 전에는 한 번 밝힌 칸(G.fog)의 게이트·괴수·다른 파티·NPC가 멀리 떠난 뒤에도 계속 보였다.
// 이제 움직이는 것들은 "지금 서 있는 자리의 시야" 안에서만 보인다.
//  - 지형: 가 본 곳은 지도에 남되 시야 밖은 어둡게.
//  - 게이트: 본 적 있는 게이트는 "마지막으로 본 모습"의 흐린 기억 표식으로 남는다(world.gateMemo). 그 사이 닫혔는지는 가 봐야 안다.
//  - 괴수·다른 파티·NPC: 시야 밖이면 보이지 않는다.
// 판정 함수: G.seenNow(x, y) 지금 보이는 칸 / G.gateSeen(g) 보이거나 기억하는 게이트 / G.objSeen(o) / G.objAtSeen(x, y) / G.gatesShown().
// G.revealed(x, y)는 그대로 "가 본 칸(지형을 아는 칸)"이다. 움직이는 것을 보일지 정할 때는 위 함수를 쓴다.
// 시야 반경은 따로 계산하지 않는다: 원래 reveal(넓어진 지도 배율·탐색계 보너스·북부 안개)을 빈 안개에 대고 돌려 그 결과를 시야로 쓴다.
{
  const GP = Game.prototype;
  const probe = (g, fn) => { const real = g.fog; const pr = new Uint8Array(real.length); g.fog = pr; try { fn(); } finally { g.fog = real; } return pr; };
  const merge = (to, from) => { for (let i = 0; i < from.length; i++) if (from[i]) to[i] = 1; };
  const snap = (g, o) => ({ x: o.x, y: o.y, tier: o.tier, final: !!o.final, variant: o.variant || null, mk: g.monthKey ? g.monthKey() : 0 });
  const memo = (g) => { const w = g.world; if (!w) return null; w.gateMemo ??= {}; return w.gateMemo; };
  const markGates = (g, pr) => { const mm = memo(g); if (!mm) return; for (const o of g.mapGates || []) if (WORLD.inb(o.x, o.y) && pr[WORLD.idx(o.x, o.y)]) mm[o.id] = snap(g, o); };
  const posKey = (p) => p.x + ',' + p.y;

  const baseReveal = GP.reveal;
  GP.reveal = function (x, y, r, ...a) {
    if (!this.fog || this._sightProbe) return baseReveal.call(this, x, y, r, ...a);
    let out; this._sightProbe = true; let pr;
    try { pr = probe(this, () => { out = baseReveal.call(this, x, y, r, ...a); }); } finally { this._sightProbe = false; }
    merge(this.fog, pr);
    this._syncKey = null; this._shown = null;
    markGates(this, pr); // 이번에 드러난 칸의 게이트는 기억해 둔다 (지나가며 본 것, 공지로 공개된 것 포함)
    const p = this.player;
    if (p && p.x === x && p.y === y) {
      if (this._sight && this._sightKey === posKey(p) && this._sight.length === pr.length) merge(this._sight, pr); else { this._sight = pr; this._sightKey = posKey(p); }
    }
    return out;
  };
  // [정찰]처럼 안개를 직접 걷는 경우: 그 자리에 있는 동안은 시야도 넓어진다
  if (GP.reconFill) {
    const baseFill = GP.reconFill;
    GP.reconFill = function (x, y, r) {
      if (!this.fog) return baseFill.call(this, x, y, r);
      const pr = probe(this, () => baseFill.call(this, x, y, r));
      merge(this.fog, pr); markGates(this, pr); this._syncKey = null; this._shown = null;
      const p = this.player; if (p && p.x === x && p.y === y) merge(this.sightMap(), pr);
    };
  }
  GP.sightMap = function () {
    const p = this.player; if (!p || !this.fog) return null;
    if (!this._sight || this._sightKey !== posKey(p) || this._sight.length !== this.fog.length) {
      // 저장을 불러왔거나 reveal 없이 자리가 바뀐 경우: 지금 자리에서 다시 잰다 (감지 판정 같은 부수 효과 없이)
      this._sightProbe = true; this.reconSense = null; let pr;
      try { pr = probe(this, () => baseReveal.call(this, p.x, p.y, WORLD.cityAt && WORLD.cityAt(p.x, p.y) ? 5 : 3)); } finally { this._sightProbe = false; delete this.reconSense; }
      this._sight = pr; this._sightKey = posKey(p);
    }
    return this._sight;
  };
  GP.seenNow = function (x, y) { const s = this.sightMap(); return !!s && WORLD.inb(x, y) && s[WORLD.idx(x, y)] === 1; };
  // 기억 정리: 보이는 게이트는 새로 적고, 사라진 게이트는 그 자리가 보일 때 지운다. 옛 저장은 지금까지 밝힌 칸의 게이트를 한 번 기억으로 옮긴다
  GP.sightSync = function () {
    const mm = memo(this); const s = this.sightMap(); if (!mm || !s) return;
    const key = `${this._sightKey}|${(this.mapGates || []).length}|${this.monthKey ? this.monthKey() : 0}|${this.day || 0}`;
    if (this._syncKey === key) return; this._syncKey = key;
    const w = this.world; const live = new Map((this.mapGates || []).map((o) => [String(o.id), o]));
    if (!w.gateMemoInit) { w.gateMemoInit = 1; for (const o of live.values()) if (WORLD.inb(o.x, o.y) && this.fog[WORLD.idx(o.x, o.y)]) mm[o.id] = snap(this, o); }
    for (const o of live.values()) if (WORLD.inb(o.x, o.y) && s[WORLD.idx(o.x, o.y)]) mm[o.id] = snap(this, o);
    for (const id of Object.keys(mm)) { const m = mm[id]; if (!live.has(id) && (!WORLD.inb(m.x, m.y) || s[WORLD.idx(m.x, m.y)])) delete mm[id]; }
    this._shown = null;
  };
  GP.gateSeen = function (o) { if (!o) return false; if (this.seenNow(o.x, o.y)) return true; this.sightSync(); const mm = memo(this); return !!(mm && mm[o.id]); };
  GP.objSeen = function (o) { return !!o && (o.kind === 'gate' ? this.gateSeen(o) : this.seenNow(o.x, o.y)); };
  GP.objAtSeen = function (x, y) { const o = this.objAt(x, y); return o && this.objSeen(o) ? o : null; };
  GP.gateMemoAt = function (x, y) { this.sightSync(); const mm = memo(this); if (!mm) return null; for (const id of Object.keys(mm)) if (mm[id].x === x && mm[id].y === y) return mm[id]; return null; };
  // 지도에 그릴 게이트: 지금 보이는 것 + 기억하는 것(이미 사라졌으면 기억 속 모습 그대로)
  GP.gatesShown = function () {
    this.sightSync(); const mm = memo(this) || {}; const key = this._syncKey;
    if (this._shown && this._shownKey === key) return this._shown;
    const out = []; const live = new Set();
    for (const o of this.mapGates || []) { live.add(String(o.id)); if (this.seenNow(o.x, o.y) || mm[o.id]) out.push(o); }
    for (const id of Object.keys(mm)) if (!live.has(id)) { const m = mm[id]; out.push({ id: 'memo' + id, kind: 'gate', x: m.x, y: m.y, tier: m.tier, final: m.final, variant: m.variant, gone: true }); }
    this._shown = out; this._shownKey = key; return out;
  };
}
if (typeof UI !== 'undefined' && typeof MapView !== 'undefined') {
  // 가 본 곳이라도 지금 시야 밖은 어둡게
  const MP = MapView.prototype; const baseTile = MP.drawTile;
  MP.drawTile = function (type, px, py, s, x, y) {
    const r = baseTile.call(this, type, px, py, s, x, y);
    try {
      if (G.player && x != null && WORLD.inb(x, y) && G.fog[WORLD.idx(x, y)] && !G.seenNow(x, y)) { const c = this.ctx; c.fillStyle = 'rgba(4,7,12,.46)'; c.fillRect(px, py, s + 0.5, s + 0.5); }
    } catch (e) { /* 그리기는 계속 */ }
    return r;
  };
  // 시야 밖 칸의 사람은 칸 정보에 나오지 않는다
  if (UI.npcsAt) { const baseNA = UI.npcsAt; UI.npcsAt = function (x, y) { return G.seenNow && !G.seenNow(x, y) ? [] : baseNA.call(this, x, y); }; }
  // 기억 속 게이트는 칸 정보에 그렇게 적는다
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    try {
      const tip = document.getElementById('hud-tip'); if (!tip || tip.classList.contains('hidden') || !G.revealed(x, y) || G.seenNow(x, y)) return;
      const o = G.objAt(x, y); const m = G.gateMemoAt(x, y);
      if (o && o.kind === 'gate' && m) tip.insertAdjacentHTML('beforeend', '<div class="small dim">마지막으로 본 모습이다. 지금은 달라졌을 수 있다.</div>');
      else if (m) tip.insertAdjacentHTML('beforeend', `<div class="small dim">전에 ${m.final ? '원초의' : RANKS[m.tier].key + '급'} 게이트를 본 자리다. 아직 있는지는 가 봐야 안다.</div>`);
      else tip.insertAdjacentHTML('beforeend', '<div class="small dim">지금은 시야 밖이다. 무엇이 있는지는 가까이 가야 보인다.</div>');
    } catch (e) { /* 안내 실패는 무시 */ }
  };
}
