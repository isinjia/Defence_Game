// ===== 게이트 크로니클: 지도 위에서 움직이는 다른 파티 (4-20, 영역 F) =====
// 월드맵의 다른 파티를 점이 아니라 "파티 아이콘"으로 그린다: 리더 초상 원형 + 인원 배지 + 소속 색 테두리 + 이동 방향.
// 누르면 파티 카드(리더·파티원·소속·목적지·관계, 말 걸기·동행·거래·생사결).
// 대상: 게이트 생태계 공략팀(gate.raid, gate_eco.js), 브레이크 출동 팀, 현상금 사냥꾼, 모집 게시판 파티(crew.js).
// 파티 데이터·상호작용 결과의 세계 쪽 처리는 영역 C가 G.partyMeetResult(party, action) 를 두면 그쪽을 먼저 부른다.

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
    r.eta ??= Math.max(2, Math.min(20, Math.round(dist / 2) + 1)); // 공략팀은 차량으로 하루 두 칸쯤
    return { from: r.from, to: [g.x, g.y], eta: r.eta, dist };
  },
  // 이번 달 경과일 기준 공략팀 위치 (도착하면 게이트 안)
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
  affilColor(guild) { return guild && GUILDS[guild] ? GUILDS[guild].color : '#9aa6b8'; },
  // 브레이크 도시로 출동하는 헌터들 (근처 지역의 실제 NPC, 결정론적)
  breakTeams(b) {
    const [cx, cy] = WORLD.cityPos[b.city];
    const elapsed = (this.monthKey() - (b.at ?? this.monthKey())) * 30 + this.day;
    const busy = new Set((this.mapGates || []).flatMap((g) => (g.raid && g.raid.ids) || []));
    const pool = this.adults().filter((n) => n.alive && !n.isCompanion && !n.retired && !busy.has(n.id) && !n.bountyHunter && n.region !== b.city && regionDist(n.region, b.city) <= 1 && n.rankIdx >= Math.max(0, (b.tier || 0) - 1))
      .sort((a, x) => (FX.hash(`${b.at}:${a.id}`) % 997) - (FX.hash(`${b.at}:${x.id}`) % 997)).slice(0, 6);
    const out = [];
    for (let k = 0; k * 2 < pool.length && k < 3; k++) {
      const mem = pool.slice(k * 2, k * 2 + 2); const lead = mem[0];
      const [sx, sy] = WORLD.cityPos[lead.region];
      const spd = (0.5 + (FX.hash(`${b.city}:${b.at}:${k}`) % 5) * 0.12) * WORLD.K;
      const d = Math.hypot(cx - sx, cy - sy) || 1; const k2 = Math.min(1, (elapsed * spd) / d);
      if (k2 >= 1) continue; // 도착하면 도시 안
      out.push({ key: `brk:${b.city}:${k}`, kind: 'break', leader: lead, members: mem, guild: lead.guild || null, x: sx + (cx - sx) * k2, y: sy + (cy - sy) * k2, dir: [cx - sx, cy - sy], dest: `${regionById(b.city).name} 브레이크 출동`, left: Math.ceil((d - elapsed * spd) / spd) });
    }
    return out;
  },
  // 지금 지도 위에 보이는 다른 파티 전부
  mapParties() {
    const out = []; const p = this.player; const mk = this.monthKey();
    for (const g of this.mapGates || []) {
      if (!g.raid) continue;
      const pos = this.raidPos(g); if (!pos || pos.arrived) continue;
      const mem = (g.raid.ids || []).map((id) => this.npcById(id)).filter((n) => n && n.alive);
      if (!mem.length) continue;
      const rt = this.raidRoute(g);
      out.push({ key: `raid:${g.id}`, kind: 'raid', leader: mem[0], members: mem, guild: g.raid.actor && g.raid.actor.guild || (g.raid.actor && g.raid.actor.kind === 'assoc' ? 'kama' : null), actor: g.raid.actor,
        x: pos.x, y: pos.y, dir: [rt.to[0] - rt.from[0], rt.to[1] - rt.from[1]], dest: `${regionById(g.region).name} ${RANKS[g.tier].key}급 게이트로 · ${pos.left}일 뒤 도착`, gate: g.id, left: pos.left });
    }
    for (const b of (this.world && this.world.breaks) || []) if (WORLD.cityPos[b.city]) out.push(...this.breakTeams(b));
    // 현상금 사냥꾼: 당신을 쫓아 가까이 와 있다
    for (const n of this.adults()) {
      if (!n.alive || !n.bountyHunter || n.target !== 'player') continue;
      const h = FX.hash(`${n.id}:${mk}`); const ang = (h % 360) * Math.PI / 180; const r = Math.max(3, 12 - this.day / 3);
      const x = p.x + Math.cos(ang) * r, y = p.y + Math.sin(ang) * r; const ix = Math.round(x), iy = Math.round(y);
      if (!WORLD.inb(ix, iy) || !WORLD.passable(WORLD.idx(ix, iy), true)) continue;
      out.push({ key: `bounty:${n.id}`, kind: 'bounty', leader: n, members: [n], guild: n.guild || null, x, y, dir: [p.x - x, p.y - y], dest: '당신을 쫓는 중', hostile: true });
    }
    // 모집 게시판 파티: 이 지역 도시 근처에 모여 있다
    if (this.crewBoard) {
      const board = this.crewBoard(p.region) || [];
      board.forEach((L, i) => {
        const lead = this.npcById(L.leader); if (!lead) return;
        const [x, y] = UI.npcPos ? UI.npcPos(lead) : WORLD.cityPos[p.region];
        const mem = [lead, ...(L.members || []).map((id) => this.npcById(id)).filter((n) => n && n.alive)];
        out.push({ key: `crew:${p.region}:${i}`, kind: 'crew', leader: lead, members: mem, guild: lead.guild || null, x, y, dir: null, dest: `파티원 모집 중 · ${L.name || ''}`, crewIdx: i });
      });
    }
    return out;
  },
});

// ---------- 초상 이미지 (캔버스용 캐시) ----------
// 파츠 SVG는 <image href="assets/...">를 쓰는데, 캔버스용 data URL SVG에서는 외부 이미지가
// 로드되지 않는다. 플레이어 마커(setPlayerImage)와 같이 PortraitParts.rasterize로 내장한다.
const PARTY_IMG = {};
function partyFaceImage(n) {
  const k = 'n' + n.id; if (PARTY_IMG[k]) return PARTY_IMG[k];
  const html = UI.npcAvatar(n, 64);
  const im = new Image();
  PARTY_IMG[k] = im;
  const m = html.match(/<img src="([^"]+)"/);
  if (m) { im.src = m[1]; return im; }
  const s = html.match(/<svg[\s\S]*<\/svg>/); if (!s) return im;
  const svg = s[0].includes('xmlns') ? s[0] : s[0].replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  const apply = (url) => { im.src = url; };
  if (svg.includes('data-portrait-parts=') && PortraitParts && PortraitParts.rasterize) {
    PortraitParts.rasterize(svg).then(apply).catch(() => apply('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)));
  } else apply('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  return im;
}

// ---------- 화면 ----------
Object.assign(UI, {
  partyAt(x, y) {
    if (!G.mapParties) return null;
    return G.mapParties().find((pt) => Math.round(pt.x) === x && Math.round(pt.y) === y && G.seenNow(x, y)) || null;
  },
  partyKindName(pt) { return { raid: '게이트 공략팀', break: '브레이크 출동', bounty: '현상금 사냥꾼', crew: '파티원 모집' }[pt.kind] || '파티'; },
  partyCard(key) {
    const pt = G.mapParties().find((x) => x.key === key); if (!pt) return this.toast('그 파티는 이미 떠났다.');
    this._party = pt;
    const L = pt.leader; const col = G.affilColor(pt.guild);
    const near = Math.max(Math.abs(Math.round(pt.x) - G.player.x), Math.abs(Math.round(pt.y) - G.player.y)) <= 1;
    const mem = pt.members.map((n) => `<div class="item-row">${this.npcAvatar(n, 40)}<div class="grow"><b>${n.name}</b> ${n === L ? '<span class="tag tiny">리더</span>' : ''}<div class="small">${this.rankTag(n.rankIdx, n.stage)} ${this.clsTag(n.cls || 'swordsman')}</div><div class="small dim">${n.met ? `관계 ${relationLabel(n.relation)}` : '처음 보는 사람'}</div></div></div>`).join('');
    const btn = (act, label, cls = '', dis) => `<button class="${cls}" data-act="${act}" data-v="${pt.key}" ${dis ? 'disabled' : ''}>${label}</button>`;
    this.modal(`<div class="sheet-head"><h3>${this.partyKindName(pt)}</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
      <div class="party-hero" style="--c:${col}">${this.npcPortrait(L, 110)}<div class="grow">
        <div class="eyebrow">${pt.guild ? (G.ownerName ? G.ownerName(pt.guild) : GUILDS[pt.guild].name) : '무소속'}</div><h3>${L.name}의 파티 · ${pt.members.length}명</h3>
        <p class="small ${pt.hostile ? 'bad' : 'amber'}">${pt.dest}</p>
        ${near ? '' : `<p class="small dim">${Math.max(Math.abs(Math.round(pt.x) - G.player.x), Math.abs(Math.round(pt.y) - G.player.y))}칸 떨어져 있다. 가까이(1칸) 가야 말을 걸 수 있다.</p>`}</div></div>
      <div class="cards">${mem}</div>
      <div class="row end party-acts">
        ${btn('pty-talk', '말 걸기', '', !near)}
        ${pt.kind !== 'bounty' ? btn('pty-join', pt.kind === 'crew' ? '합류 신청' : '동행 요청', '', !near) : ''}
        ${pt.kind !== 'bounty' ? btn('pty-trade', '거래', '', !near) : ''}
        ${btn('pty-duel', '생사결', 'danger', !near)}
        ${near ? '' : btn('pty-go', '그쪽으로 이동', 'primary')}
      </div>`, 'sheet party-sheet');
  },
  partyAct(act, key) {
    const pt = this._party && this._party.key === key ? this._party : G.mapParties().find((x) => x.key === key); if (!pt) return;
    const L = pt.leader; const p = G.player;
    if (G.partyMeetResult) { const r = G.partyMeetResult(pt, act.replace('pty-', '')); if (r && r.handled) { this.closeModal(); return this.after(r.text); } }
    switch (act) {
      case 'pty-talk': this.closeModal(); return this.openSheet('npc:' + L.id);
      case 'pty-trade': {
        const cost = Math.round(180 * (G.priceMul ? G.priceMul() : 1) / 10) * 10;
        if (p.money < cost) return this.toast(`회복제 두 병에 ${fmt(cost)} 크레딧을 부른다. 돈이 모자란다.`);
        p.money -= cost; p.items.potion = (p.items.potion || 0) + 2; L.met = true; G.changeRel(L, 1, '길에서 물자를 나눴다');
        this.closeModal(); return this.after(`${L.name}에게서 응급 회복제 두 병을 ${fmt(cost)} 크레딧에 샀다.`);
      }
      case 'pty-join': {
        if (pt.kind === 'crew') { this.closeModal(); return this.after(G.crewApply(G.crewBoard(p.region)[pt.crewIdx])); }
        const ok = L.relation >= 30 || (L.personality === 'kind' && L.relation >= 0);
        L.met = true;
        if (!ok) { G.changeRel(L, -1, '낯선 사람이 끼려 했다'); this.closeModal(); return this.after(`${L.name}: "우리끼리 간다. 미안하군."`); }
        if (pt.kind === 'raid') {
          const g = G.mapGates.find((x) => x.id === pt.gate); if (!g) return;
          // 함께 이동해 같은 게이트로: 도착일만큼 시간이 흐르고, 입장료는 그 팀 몫으로
          G.advanceDays(Math.max(1, pt.left || 1), { noSave: true });
          p.x = g.x; p.y = g.y; p.region = g.region; G.reveal(g.x, g.y, 3); G.syncParty && G.syncParty();
          g.paid = true; g.joint = { leader: L.id, ids: pt.members.map((n) => n.id) };
          G.changeRel(L, 2, '함께 게이트에 들어갔다');
          this.closeModal(); this.renderGame(); if (this.map) this.map.centerOn(p.x, p.y);
          this.toast(`${L.name}의 팀과 함께 ${G.gateName(g)}에 도착했다.`);
          return this.encounter(g);
        }
        // 브레이크 출동: 같이 도시로 간다
        const city = pt.dest.split(' ')[0];
        const reg = REGIONS.find((r) => pt.key.includes(':' + r.id + ':'));
        if (reg) { const [x, y] = WORLD.cityPos[reg.id]; G.advanceDays(Math.max(1, pt.left || 2), { noSave: true }); p.x = x; p.y = y; p.region = reg.id; G.reveal(x, y, 5); G.changeRel(L, 2, '브레이크 출동에 동행했다'); }
        this.closeModal(); this.renderGame(); if (this.map) this.map.centerOn(p.x, p.y);
        return this.after(`${L.name}의 팀과 함께 ${city}에 닿았다.`);
      }
      case 'pty-duel': this.closeModal(); return this.startDuel ? this.startDuel(L, true) : this.handle('ambush-fight', L.id);
      case 'pty-go': {
        this.closeModal();
        const rd = this.map && this.map.reachData; const tx = Math.round(pt.x), ty = Math.round(pt.y);
        // 닿을 수 있는 칸 가운데 파티에 가장 가까운 칸으로
        let best = null, bd = 1e9;
        if (rd) for (const [i] of rd.dist) { const [x, y] = WORLD.xy(i); const d = Math.max(Math.abs(x - tx), Math.abs(y - ty)); if (d < bd && i !== rd.start) { bd = d; best = i; } }
        if (best == null) return this.toast('지금은 그쪽으로 갈 수 없다.');
        return this.walk(WORLD.pathTo(rd, best).slice(1));
      }
    }
  },
});

{
  // 지도 칸 정보: 게이트 공략팀 안내
  const baseTip = UI.showTip;
  UI.showTip = function (x, y) {
    baseTip.call(this, x, y);
    const tip = document.getElementById('hud-tip'); if (!tip) return;
    const g = G.objAt(x, y);
    if (g && g.kind === 'gate' && g.raid && G.seenNow(x, y)) {
      const pos = G.raidPos(g);
      if (pos) {
        const team = (g.raid.ids || []).map((id) => G.npcById(id)).filter((n) => n);
        const who = `${g.raid.actor.name}${team.length ? ` ${team.map((n) => n.name).slice(0, 3).join('·')} 일행` : ''}`;
        tip.insertAdjacentHTML('beforeend', fixJosa(`<div class="small ${pos.arrived ? 'bad' : 'amber'}">${pos.arrived ? `${who}이(가) 안에서 공략 중. 다음 달 초면 결판이 난다.` : `${who}이(가) 향하는 중 · ${pos.left}일 뒤 도착. 먼저 닫으려면 서둘러야 한다.`}</div>`));
      }
    }
  };
  // 파티 아이콘을 누르면 파티 카드 (걷는 중엔 원래대로 멈춤)
  const baseTap = UI.onTap;
  UI.onTap = function (x, y) {
    if (!this.walking && !this.ctx && !this.modalOpen() && !(this.map && this.map.moving)) {
      const all = G.mapParties ? G.mapParties().filter((q) => Math.round(q.x) === x && Math.round(q.y) === y && G.seenNow(x, y)) : [];
      if (all.length === 1) { this.hideTip(); return this.partyCard(all[0].key); }
      if (all.length > 1) {
        this.hideTip();
        return this.modal(`<div class="sheet-head"><h3>이 자리의 파티 · ${all.length}</h3><button class="icon-btn" data-act="modal-close" aria-label="닫기">×</button></div>
          <div class="cards">${all.map((q) => `<button class="ck-who" data-act="pty-card" data-v="${q.key}">${this.npcAvatar(q.leader, 44)}<span class="grow"><b>${q.leader.name}의 파티 · ${q.members.length}명</b><span class="small dim">${this.partyKindName(q)} · ${q.dest}</span></span></button>`).join('')}</div>`, 'sheet party-sheet');
      }
    }
    return baseTap.call(this, x, y);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'pty-card') return this.partyCard(v);
    if (/^pty-/.test(act)) return this.partyAct(act, v);
    return baseHandle.call(this, act, v);
  };

  // 지도에 파티 아이콘
  const MP = MapView.prototype;
  const baseObjs = MP.drawObjects;
  MP.drawObjects = function () {
    baseObjs.call(this);
    if (!G.player || !G.mapParties) return;
    const c = this.ctx, s = this.tile, t = this.t;
    const list = G.mapParties().filter((pt) => G.seenNow(Math.round(pt.x), Math.round(pt.y)));
    // 게이트로 가는 공략팀은 남은 길을 점선으로
    for (const pt of list) {
      if (pt.kind !== 'raid') continue;
      const g = G.mapGates.find((x) => x.id === pt.gate); if (!g || !G.gateSeen(g)) continue;
      const [ax, ay] = this.toScreen(pt.x + 0.5, pt.y + 0.5), [bx, by] = this.toScreen(g.x + 0.5, g.y + 0.5);
      c.strokeStyle = G.affilColor(pt.guild); c.globalAlpha = 0.45; c.lineWidth = 1.5; c.setLineDash([3, 5]); c.lineDashOffset = -t / 3;
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    }
    // 같은 칸에 겹치면 묶음 아이콘
    const groups = new Map();
    for (const pt of list) { const k = Math.round(pt.x) + ',' + Math.round(pt.y); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(pt); }
    for (const [, arr] of groups) {
      const pt = arr[0];
      const [px, py0] = this.toScreen(pt.x + 0.5, pt.y + 0.5);
      if (px < -s || py0 < -s || px > this.w + s || py0 > this.hgt + s) continue;
      const py = py0 + Math.sin(t / 14 + pt.leader.id) * 1.2;
      const R = Math.max(9, s * 0.27);
      const col = pt.hostile ? '#ff4f6a' : G.affilColor(pt.guild);
      // 이동 방향 화살표
      if (pt.dir && (pt.dir[0] || pt.dir[1])) {
        const a = Math.atan2(pt.dir[1], pt.dir[0]);
        c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = col;
        c.beginPath(); c.moveTo(R + 7, 0); c.lineTo(R + 1, -4.5); c.lineTo(R + 1, 4.5); c.closePath(); c.fill(); c.restore();
      }
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(px, py + R * 0.95, R * 0.85, R * 0.25, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#0a0f16'; c.fillRect(px - R, py - R, R * 2, R * 2);
      const im = partyFaceImage(pt.leader);
      if (im.complete && im.naturalWidth) c.drawImage(im, px - R, py - R, R * 2, R * 2);
      c.restore();
      c.strokeStyle = col; c.lineWidth = pt.hostile ? 3 : 2.4; c.beginPath(); c.arc(px, py, R, 0, Math.PI * 2); c.stroke();
      if (pt.hostile) { const pr = (t % 50) / 50; c.strokeStyle = `rgba(255,79,106,${0.7 * (1 - pr)})`; c.lineWidth = 2; c.beginPath(); c.arc(px, py, R + 2 + pr * 8, 0, Math.PI * 2); c.stroke(); }
      // 인원 배지
      const n = arr.reduce((a, x) => a + x.members.length, 0);
      const bx = px + R * 0.75, by = py + R * 0.7;
      c.fillStyle = arr.length > 1 ? '#ffb547' : '#05080d'; c.beginPath(); c.arc(bx, by, 7.5, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = arr.length > 1 ? '#1a1205' : '#e3e8f1'; c.font = '700 10px "Chakra Petch", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(n), bx, by + 0.5);
      if (s > 30 && arr.length === 1 && pt.kind === 'raid') this.chip(px, py - R - 9, `${pt.left}일`, col);
      if (s > 30 && arr.length > 1) this.chip(px, py - R - 9, `${arr.length}개 파티`, '#ffb547');
    }
  };
}
