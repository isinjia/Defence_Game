// ===== 게이트 크로니클: 넓어진 지도의 길드 본거지·관리국 지부 (영역 C, 지도 5배 확대 대응) =====
// 지도가 80×130으로 넓어지고 중도시(tier 2)·읍(tier 3)이 생겼다(WORLD.towns).
//  - 중소 길드 일부의 본거지를 권역 안 중도시로 옮긴다: GUILDS[id].town = 도시 id. 권역(home)은 그대로라 기존 코드(소속·입찰·팀 배정)는 안 바뀐다.
//  - 관리국 지부: 광역 12곳 + 중도시 전부. G.kamaBranches(), G.kamaBranchNear(x, y).
//  - 길드 본거지 좌표: guildBasePos(id) → [x, y]. 입찰은 본거지에서 가까운 게이트에 가산점(칸 거리 × WORLD.K 기준).
// 권역 사이 거리(regionDist)는 권역 격자 기준이라 지도 확대와 무관하다. 칸 거리를 쓰는 곳만 ×K.

const GUILD_TOWN = { nightowl: 'chuncheon', hanbat: 'cheongju', geumnam: 'suncheon', harbor: 'changwon', bluesteel: 'pohang' };

function guildBaseTown(id) {
  const g = GUILDS[id]; if (!g || !g.town || typeof WORLD === 'undefined' || !WORLD.towns) return null;
  return WORLD.towns.find((t) => t.id === g.town) || null;
}
function guildBasePos(id) {
  const t = guildBaseTown(id); if (t) return [t.x, t.y];
  const h = typeof guildHome === 'function' ? guildHome(id) : null;
  return h && WORLD.cityPos && WORLD.cityPos[h.id] ? WORLD.cityPos[h.id] : null;
}
function guildBaseName(id) {
  const t = guildBaseTown(id); const h = typeof guildHome === 'function' ? guildHome(id) : null;
  return t ? `${t.name}${h ? ` (${h.name})` : ''}` : (h ? h.name : '-');
}

if (typeof WORLD !== 'undefined' && WORLD.towns) {
  for (const [id, town] of Object.entries(GUILD_TOWN)) {
    const t = WORLD.towns.find((x) => x.id === town);
    // 중도시 이상이고 길드 권역 안일 때만 옮긴다
    if (GUILDS[id] && t && t.tier <= 2 && t.region === GUILDS[id].home) GUILDS[id].town = town;
  }
}

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const K = () => (typeof WORLD !== 'undefined' && WORLD.K) || 1;
  const tileDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  GP.kamaBranches = function () {
    const out = REGIONS.filter((r) => WORLD.cityPos && WORLD.cityPos[r.id]).map((r) => ({ id: r.id, name: r.name, x: WORLD.cityPos[r.id][0], y: WORLD.cityPos[r.id][1], region: r.id, main: true }));
    for (const t of WORLD.towns || []) if (t.tier <= 2) out.push({ id: t.id, name: t.name, x: t.x, y: t.y, region: t.region, main: false });
    return out;
  };
  // 가장 가까운 지부와 칸 거리
  GP.kamaBranchNear = function (x, y) {
    let best = null, bd = Infinity;
    for (const b of this.kamaBranches()) { const d = tileDist([x, y], [b.x, b.y]); if (d < bd) { bd = d; best = b; } }
    return best ? { branch: best, dist: bd } : null;
  };
  // 그 도시(읍·중도시)에 본거지를 둔 길드
  GP.guildsAtTown = function (townId) { return Object.keys(GUILDS).filter((id) => GUILDS[id].town === townId); };

  // 입찰: 본거지에서 가까운 게이트일수록 유리(옛 지도 기준 8칸 안 → ×K)
  wrap('tenderBidders', function (base, g) {
    const ids = base.call(this, g);
    g._near = {};
    for (const id of ids) {
      const p = guildBasePos(id); if (!p || g.x == null) continue;
      const d = tileDist(p, [g.x, g.y]);
      g._near[id] = Math.max(0, 1 - d / (8 * K()));
    }
    return ids;
  });
  wrap('guildPower', function (base, id) {
    const v = base.call(this, id);
    const g = this._tenderGate; const near = g && g._near ? g._near[id] : 0;
    return near ? Math.round(v * (1 + near) ** 2) : v; // 입찰 점수는 세력의 제곱근이라 (1+near)배가 된다
  });
  wrap('tenderResolve', function (base, g) {
    this._tenderGate = g;
    try { return base.call(this, g); } finally { this._tenderGate = null; delete g._near; }
  });
}

// 길드 소개에 실제 본거지 도시를 보여 준다
if (typeof guildInfo === 'function') {
  const baseInfo = guildInfo;
  // eslint-disable-next-line no-global-assign
  guildInfo = function (id) {
    const s = baseInfo(id); const t = guildBaseTown(id);
    return t ? s.replace(/본거지: [^\n]*/, `본거지: ${guildBaseName(id)}`) : s;
  };
}
