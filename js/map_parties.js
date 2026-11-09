// ===== 게이트 크로니클: 지도 위에서 움직이는 헌터들 =====
// 게이트 생태계(gate_eco.js)의 공략팀이 출발 도시에서 게이트로 향하는 모습,
// 브레이크 속보가 난 도시로 헌터들이 몰려가는 모습을 지도에 그린다. (보이기만 하고 규칙은 바꾸지 않는다)

Object.assign(Game.prototype, {
  // 공략팀의 출발 칸과 도착 예정일
  raidRoute(g) {
    const r = g.raid; if (!r) return null;
    if (!r.from) {
      const lead = (r.ids || []).map((id) => this.npcById(id)).find((n) => n);
      const rid = lead && WORLD.cityPos[lead.region] ? lead.region : g.region;
      r.from = WORLD.cityPos[rid].slice();
    }
    const dist = Math.max(Math.abs(r.from[0] - g.x), Math.abs(r.from[1] - g.y));
    r.eta ??= Math.max(2, Math.min(20, dist + 1)); // 공략팀은 차량으로 하루 한 칸쯤
    return { from: r.from, to: [g.x, g.y], eta: r.eta, dist };
  },
  // 이번 달 경과일 기준 공략팀 위치 (도착하면 게이트 위)
  raidPos(g) {
    const rt = this.raidRoute(g); if (!rt) return null;
    const started = g.raid.at === this.monthKey() ? 1 : -99; // 지난달에 들어간 팀은 이미 안에 있다
    const k = Math.max(0, Math.min(1, (this.day - started) / rt.eta));
    return { x: rt.from[0] + (rt.to[0] - rt.from[0]) * k, y: rt.from[1] + (rt.to[1] - rt.from[1]) * k, arrived: k >= 1, left: Math.max(0, Math.ceil(rt.eta - (this.day - started))) };
  },
  actorColor(actor) {
    if (!actor) return '#c9ced6';
    if (actor.guild && GUILDS[actor.guild]) return GUILDS[actor.guild].color;
    return actor.kind === 'assoc' ? '#7fb6ff' : '#c9ced6';
  },
  // 브레이크 도시로 몰려드는 헌터 무리 (보이기용, 결정론적)
  breakRushers(b) {
    const [cx, cy] = WORLD.cityPos[b.city];
    const elapsed = (this.monthKey() - (b.at ?? this.monthKey())) * 30 + this.day;
    const out = [];
    for (let k = 0; k < 4; k++) {
      const h = FX.hash(`${b.city}:${b.at}:${k}`);
      const ang = (h % 360) * Math.PI / 180; const r0 = 5 + (h % 4);
      const speed = 0.4 + ((h >> 4) % 5) * 0.12;
      const r = Math.max(0.8, r0 - elapsed * speed);
      const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
      const ix = Math.round(x), iy = Math.round(y);
      if (!WORLD.inb(ix, iy)) continue;
      const t = WORLD.type(ix, iy); if (t === WORLD.T.SEA || t === WORLD.T.NORTH) continue;
      out.push({ x, y, color: ['#46e0d0', '#ffb547', '#7fb6ff', '#c58cff'][k] });
    }
    return out;
  },
});

// ---------- 화면 ----------
{
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip) return;
    const g = G.objAt(x, y);
    if (!g || g.kind !== 'gate' || !g.raid || !G.revealed(x, y)) return;
    const pos = G.raidPos(g); if (!pos) return;
    const team = (g.raid.ids || []).map((id) => G.npcById(id)).filter((n) => n);
    const who = `${g.raid.actor.name}${team.length ? ` ${team.map((n) => n.name).slice(0, 3).join('·')} 일행` : ''}`;
    tip.insertAdjacentHTML('beforeend', fixJosa(`<div class="small ${pos.arrived ? 'bad' : 'amber'}">${pos.arrived ? `${who}이(가) 안에서 공략 중. 다음 달 초면 결판이 난다.` : `${who}이(가) 향하는 중 · ${pos.left}일 뒤 도착. 먼저 닫으려면 서둘러야 한다.`}</div>`));
  };

  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    baseObjs.call(this);
    if (!G.player || !G.mapGates) return;
    const c = this.ctx, s = this.tile, t = this.t;
    const drawGroup = (x, y, col, n, bob) => {
      const [px, py] = this.toScreen(x + 0.5, y + 0.5);
      if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) return null;
      for (let k = 0; k < n; k++) {
        const ox = (k - (n - 1) / 2) * s * 0.16, oy = (k % 2) * s * 0.06 + Math.sin(t / 9 + k + bob) * 1.2;
        c.fillStyle = '#05080d'; c.beginPath(); c.arc(px + ox, py + oy, s * 0.1, 0, Math.PI * 2); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(px + ox, py + oy, s * 0.075, 0, Math.PI * 2); c.fill();
      }
      return [px, py];
    };
    // 게이트로 향하는 공략팀
    for (const g of G.mapGates) {
      if (!g.raid) continue;
      const pos = G.raidPos(g); if (!pos || pos.arrived) continue;
      const ix = Math.round(pos.x), iy = Math.round(pos.y);
      if (!WORLD.inb(ix, iy) || !G.revealed(ix, iy)) continue;
      const col = G.actorColor(g.raid.actor);
      // 남은 길 점선
      if (G.revealed(g.x, g.y)) {
        const [ax, ay] = this.toScreen(pos.x + 0.5, pos.y + 0.5), [bx, by] = this.toScreen(g.x + 0.5, g.y + 0.5);
        c.strokeStyle = col; c.globalAlpha = 0.45; c.lineWidth = 1.5; c.setLineDash([3, 5]); c.lineDashOffset = -t / 3;
        c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
      }
      const n = Math.max(1, Math.min(4, (g.raid.ids || []).length || 3));
      const at = drawGroup(pos.x, pos.y, col, n, g.id);
      if (at && s > 30) this.chip(at[0], at[1] - s * 0.36, `${g.raid.actor.name.replace(' 각성자단', '').replace(' 시큐리티', '')} ${pos.left}일`, col);
    }
    // 브레이크 도시로 몰려드는 헌터
    for (const b of (G.world && G.world.breaks) || []) {
      if (!WORLD.cityPos[b.city]) continue;
      for (const r of G.breakRushers(b)) {
        if (!G.revealed(Math.round(r.x), Math.round(r.y))) continue;
        drawGroup(r.x, r.y, r.color, 2, r.x);
      }
    }
  };
}
