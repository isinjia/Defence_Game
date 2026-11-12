// ===== 게이트 크로니클: 월드맵 NPC·괴수 표식을 초상/원화로 (영역 F) =====
// 서 있는 NPC: 얼굴 + 마름모 테두리(서 있음) + 관계색(적대 빨강·중립 초록·우호 노랑) + 좌하단 소속 배지.
// 이동 중 파티는 map_parties.js의 원형 리더 초상을 유지. 괴수 무리는 썸네일 원형.
// 기존 drawObjects의 NPC·괴수 그리기만 끄고(일시적으로 목록을 비움), 게이트 등은 그대로 둔다.

const MAP_MOB_IMG = {};
function mapMobImage(m) {
  if (typeof MonsterArt === 'undefined') return null;
  const name = MonsterArt.resolve(m);
  if (MAP_MOB_IMG[name]) return MAP_MOB_IMG[name];
  const im = new Image();
  MAP_MOB_IMG[name] = im;
  im.src = MonsterArt.url(name, 'thumb');
  im.onerror = () => { if (!im.dataset.orig) { im.dataset.orig = '1'; im.src = MonsterArt.url(name, 'original'); } };
  return im;
}

// 관계 → 테두리 색 (relationLabel과 맞춤: 적대≤-20, 우호≥30, 그 사이 중립)
function mapNpcRelColor(n) {
  if (!n.met) return '#7a8799'; // 처음 보는 사람
  const r = n.relation || 0;
  if (r <= -20) return '#ff4f6a';
  if (r >= 30) return '#ffb547';
  return '#5fcf6a';
}

function mapNpcGuildId(n) {
  if (!n) return null;
  if (n.guild && GUILDS[n.guild]) return n.guild;
  return null;
}

function mapGuildMark(guild) {
  if (!guild || !GUILDS[guild]) return { ch: '무', col: '#9aa6b8' };
  const g = GUILDS[guild];
  const ch = guild === 'kama' ? '관' : (g.name || '?').charAt(0);
  return { ch, col: g.color || '#9aa6b8' };
}

function mapMarkerRing(c, px, py, R, col, wide) {
  c.strokeStyle = col; c.lineWidth = wide || 2.2; c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.stroke();
}

function mapDiamondPath(c, px, py, R) {
  c.beginPath();
  c.moveTo(px, py - R);
  c.lineTo(px + R, py);
  c.lineTo(px, py + R);
  c.lineTo(px - R, py);
  c.closePath();
}

function mapDrawCircleArt(c, px, py, R, im, bg) {
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(px, py + R * 0.95, R * 0.85, R * 0.25, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.clip();
  c.fillStyle = bg || '#0a0f16'; c.fillRect(px - R, py - R, R * 2, R * 2);
  if (im && im.complete && im.naturalWidth) c.drawImage(im, px - R, py - R, R * 2, R * 2);
  c.restore();
}

// 서 있는 NPC: 마름모로 자른 초상 + 마름모 테두리
function mapDrawStandingNpc(c, px, py, R, im, col, wide, t, hostile) {
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(px, py + R * 0.95, R * 0.9, R * 0.28, 0, 0, Math.PI * 2); c.fill();
  c.save();
  mapDiamondPath(c, px, py, R);
  c.clip();
  c.fillStyle = '#0a0f16'; c.fillRect(px - R, py - R, R * 2, R * 2);
  if (im && im.complete && im.naturalWidth) {
    // 마름모 안을 채우도록 약간 크게
    const s = R * 2.2;
    c.drawImage(im, px - s / 2, py - s / 2, s, s);
  }
  c.restore();
  c.strokeStyle = col; c.lineWidth = wide || 2.2;
  mapDiamondPath(c, px, py, R); c.stroke();
  if (hostile) {
    const pr = (t % 50) / 50;
    c.strokeStyle = `rgba(255,79,106,${0.7 * (1 - pr)})`; c.lineWidth = 1.8;
    mapDiamondPath(c, px, py, R + 2 + pr * 5); c.stroke();
  }
}

function mapDrawGuildBadge(c, px, py, R, guild) {
  const mark = mapGuildMark(guild);
  const br = Math.max(6, R * 0.42);
  const bx = px - R * 0.72, by = py + R * 0.72;
  c.fillStyle = '#05080d'; c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fill();
  c.fillStyle = mark.col; c.beginPath(); c.arc(bx, by, br - 1.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#05080d'; c.lineWidth = 1; c.stroke();
  c.fillStyle = guild === 'baekho' || guild === 'kama' ? '#1a1205' : '#0a0f16';
  c.font = `700 ${Math.max(8, Math.round(br * 1.15))}px "Chakra Petch", "IBM Plex Sans KR", sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(mark.ch, bx, by + 0.5);
}

{
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    const npcs = G.npcs, mobs = G.mobs;
    // 마름모·발톱 그리기를 건너뛰고 게이트 등만 그린다
    G.npcs = []; G.mobs = [];
    baseObjs.call(this);
    G.npcs = npcs; G.mobs = mobs;
    if (!G.player) return;

    const c = this.ctx, s = this.tile, t = this.t;
    const vis = (x, y) => G.seenNow(x, y);

    // 이미 파티 아이콘으로 나온 인물은 서 있는 초상과 겹치지 않게
    const inParty = new Set();
    if (G.mapParties) {
      for (const pt of G.mapParties()) {
        if (!vis(Math.round(pt.x), Math.round(pt.y))) continue;
        for (const m of pt.members || []) if (m && m.id != null) inParty.add(m.id);
      }
    }

    for (const n of npcs || []) {
      if (!n.alive || n.isCompanion || inParty.has(n.id)) continue;
      const [x, y] = UI.npcPos(n);
      if (!vis(x, y) || G.objAt(x, y)) continue;
      const [px, py0] = this.toScreen(x + 0.5, y + 0.5);
      if (px < -s || py0 < -s || px > this.w + s || py0 > this.hgt + s) continue;
      const py = py0 + Math.sin(t / 16 + n.id) * 0.8;
      const R = Math.max(9, s * 0.26);
      const col = mapNpcRelColor(n);
      const hostile = n.met && (n.relation || 0) <= -20;
      const im = typeof partyFaceImage === 'function' ? partyFaceImage(n) : null;
      mapDrawStandingNpc(c, px, py, R, im, col, hostile ? 2.8 : (n.met ? 2.2 : 1.6), t, hostile);
      mapDrawGuildBadge(c, px, py, R, mapNpcGuildId(n));
    }

    for (const m of mobs || []) {
      if (!vis(m.x, m.y)) continue;
      const [px, py0] = this.toScreen(m.x + 0.5, m.y + 0.5);
      if (px < -s || py0 < -s || px > this.w + s || py0 > this.hgt + s) continue;
      const bob = Math.sin(t / 18 + (m.id || 0)) * 1.5;
      const py = py0 + bob;
      const R = Math.max(10, s * 0.3);
      const col = elemColor(m.elem);
      mapDrawCircleArt(c, px, py, R, mapMobImage(m), '#1d0e12');
      mapMarkerRing(c, px, py, R, col, 2.4);
      this.chip(px, py + R + 8, `${RANKS[m.tier].key}·${m.count}`, RANKS[m.tier].color);
    }
  };

  // 칸 팁·커서 요약의 점 아이콘도 괴수 얼굴로
  const mobAt = (x, y) => (G.mobs || []).find((m) => m.x === x && m.y === y) || null;
  const swapMobDot = (root, mon, size) => {
    if (!root || !mon || !FX.monster) return;
    const dot = root.querySelector('.mob-dot');
    if (dot) dot.outerHTML = `<span class="mob-face">${FX.monster(mon, size)}</span>`;
  };
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip || !G.seenNow(x, y)) return;
    const mon = mobAt(x, y); if (mon) swapMobDot(tip, mon, 34);
  };
  if (UI.mapLookHtml) {
    const baseLook = UI.mapLookHtml;
    UI.mapLookHtml = function (x, y) {
      const html = baseLook.call(this, x, y);
      if (!G.seenNow(x, y)) return html;
      const mon = mobAt(x, y); if (!(mon && FX.monster)) return html;
      return html.replace(/<span class="mob-dot"[^>]*><\/span>/, `<span class="mob-face">${FX.monster(mon, 22)}</span>`);
    };
  }
}
