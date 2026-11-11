// ===== 게이트 크로니클: 월드맵 NPC·괴수 표식을 초상/원화로 (영역 F) =====
// 마름모·발톱 아이콘은 무엇을 가리키는지 알기 어렵다. 서 있는 NPC는 얼굴 원형,
// 괴수 무리는 괴수 썸네일 원형으로 바꾼다. 이동 중 파티 리더 초상(map_parties.js)과 같은 형식.
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

function mapMarkerRing(c, px, py, R, col, wide) {
  c.strokeStyle = col; c.lineWidth = wide || 2.2; c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.stroke();
}

function mapDrawCircleArt(c, px, py, R, im, bg) {
  c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(px, py + R * 0.95, R * 0.85, R * 0.25, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.clip();
  c.fillStyle = bg || '#0a0f16'; c.fillRect(px - R, py - R, R * 2, R * 2);
  if (im && im.complete && im.naturalWidth) c.drawImage(im, px - R, py - R, R * 2, R * 2);
  c.restore();
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
    const vis = (x, y) => G.revealed(x, y);

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
      const R = Math.max(8, s * 0.24);
      const hostile = n.relation <= -30;
      const col = hostile ? '#ff4f6a' : elemColor(n.element);
      mapDrawCircleArt(c, px, py, R, typeof partyFaceImage === 'function' ? partyFaceImage(n) : null);
      mapMarkerRing(c, px, py, R, col, hostile ? 2.8 : (n.met ? 2.2 : 1.6));
      if (hostile) {
        const pr = (t % 50) / 50;
        c.strokeStyle = `rgba(255,79,106,${0.65 * (1 - pr)})`; c.lineWidth = 1.8;
        c.beginPath(); c.arc(px, py, R + 2 + pr * 6, 0, Math.PI * 2); c.stroke();
      }
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
    const tip = document.getElementById('hud-tip'); if (!tip || !G.revealed(x, y)) return;
    const mon = mobAt(x, y); if (mon) swapMobDot(tip, mon, 34);
  };
  if (UI.mapLookHtml) {
    const baseLook = UI.mapLookHtml;
    UI.mapLookHtml = function (x, y) {
      const html = baseLook.call(this, x, y);
      if (!G.revealed(x, y)) return html;
      const mon = mobAt(x, y); if (!(mon && FX.monster)) return html;
      return html.replace(/<span class="mob-dot"[^>]*><\/span>/, `<span class="mob-face">${FX.monster(mon, 22)}</span>`);
    };
  }
}
