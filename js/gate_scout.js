// ===== 게이트 크로니클: 게이트 층 지도 — 길 위험 맞추기 · 정찰 (영역 A, 사용자 요청) =====
// 1. 갈래길마다 전투 수가 크게 달라 길 고르기가 "전투 회피"가 되던 것을 고친다.
//    입구→층 보스의 모든 길에서 위험(전투 1, 정예 1.6)을 세어, 가장 쉬운 길과 가장 어려운 길의 차이가 1 안쪽이 되게 칸 종류를 바꾼다.
//    똑같게 만들지는 않는다(차이 1까지는 남긴다).
// 2. 정찰: 파티에 탐색계 헌터가 없으면 앞길은 모두 "?"(미확인). 층 보스의 기척만 느껴진다.
//    탐색계 헌터가 있으면 지금 자리에서 능력만큼 앞(행 수)이 보이고, 멀수록·능력이 낮을수록 잘못 볼 수 있다.
//    잘못 본 칸은 들어가 봐야 안다. 한 번 본 칸은 가까이 가면 다시 정찰해 고쳐 본다.
// 3. 탐색계(척후병·추적자·음파 탐지자·천리안·길잡이) 직업을 새로 만든다.

// ---------- 3. 탐색계 직업 ----------
CLASS_GROUPS.recon = { name: '탐색계', color: '#5ee0c8' };
// scout: 정찰 능력의 바탕 (등급·전직이 더해진다)
const RECON_CLASSES = [
  { id: 'pathfinder', g: 'recon', name: '척후병', r: 0, role: 'ranged', elem: 'wood', scout: 2.2, mods: { spd: 0.16, luck: 0.08, hp: -0.04 }, adv: ['수색대장', '그림자 척후'], desc: '파티보다 한발 먼저 들어가 길을 본다. 게이트 공략팀에 꼭 하나는 있어야 하는 사람.',
    skills: [['표식 화살', 'debuff', 0.35, 10, '약한 곳에 표식을 박아 적 전체의 방어를 무너뜨린다.', 'wood'], ['기습 사격', 'crit', 1.8, 20, '보이지 않는 곳에서 급소를 쏜다.', 'wood'], ['선제 일제사격', 'aoe', 1.5, 46, '적이 알아채기 전에 모두를 쏜다.', 'wood']] },
  { id: 'tracker', g: 'recon', name: '추적자', r: 0, role: 'melee', elem: 'dark', scout: 2.0, mods: { atk: 0.1, spd: 0.12 }, adv: ['사냥개', '끝까지 쫓는 자'], desc: '발자국·핏자국·에테르 잔향으로 괴수가 어디 있는지 읽는다. 놓친 사냥감이 없다.',
    skills: [['급소 추적', 'crit', 1.6, 10, '흔적을 따라 약점을 찌른다.', 'dark'], ['몰이', 'debuff', 0.3, 18, '적을 몰아붙여 방어를 흐트러뜨린다.', 'dark'], ['사냥의 끝', 'pierce', 2.9, 48, '쫓던 사냥감을 마침내 꿰뚫는다.', 'dark']] },
  { id: 'echo_scout', g: 'recon', name: '음파 탐지자', r: 1, role: 'support', elem: 'bolt', scout: 3.0, mods: { mp: 0.18, spd: 0.08 }, adv: ['공명사', '심해의 귀'], desc: '에테르 파동을 쏘아 돌아오는 울림으로 지형과 괴수를 그린다. 벽 너머도 듣는다.',
    skills: [['공명 펄스', 'stun', 1.2, 12, '울림으로 적을 흔들어 기절시킨다.', 'bolt'], ['반향 지도', 'buff_all', 0.3, 24, '적의 움직임을 읽어 파티 전체의 공격이 정확해진다.', 'bolt'], ['파동 붕괴', 'aoe', 1.6, 48, '공명을 겹쳐 적 전체를 무너뜨린다.', 'bolt']] },
  { id: 'farsight', g: 'recon', name: '천리안', r: 1, role: 'caster', elem: 'holy', scout: 3.6, mods: { mp: 0.22, luck: 0.12, hp: -0.06 }, adv: ['예견자', '만리안'], desc: '눈을 감으면 멀리 있는 것이 보인다. 많이 볼수록 머리가 아프다.',
    skills: [['약점 투시', 'debuff', 0.4, 12, '적 전체의 약점을 꿰뚫어 본다.', 'holy'], ['예지 회피', 'evade', 0.6, 18, '다음 공격을 미리 보고 피한다.', 'holy'], ['천리 일격', 'pierce', 3.0, 50, '멀리서 본 그 한 점을 빛으로 꿰뚫는다.', 'holy']] },
  { id: 'wayfinder', g: 'recon', name: '길잡이', r: 2, role: 'support', elem: 'water', scout: 4.4, mods: { spd: 0.12, mp: 0.15, luck: 0.15 }, adv: ['게이트 항해사', '미궁의 주인'], desc: '게이트의 구조를 몸으로 안다. 같이 들어간 파티는 길을 잃은 적이 없다.',
    skills: [['안전한 길', 'shield_all', 0.45, 14, '덜 위험한 자리로 파티를 이끈다.', 'water'], ['물길 열기', 'heal_all', 0.3, 26, '숨은 샘으로 파티를 쉬게 한다.', 'water'], ['미궁의 덫', 'stun', 2.4, 48, '적을 길 잃게 만들어 기절시킨다.', 'water']] },
];
{
  const at = CLASSES.findIndex((c) => c.g === 'hidden');
  RECON_CLASSES.forEach((c, i) => { if (!CLASSES.some((x) => x.id === c.id)) CLASSES.splice(at < 0 ? CLASSES.length : at + i, 0, c); });
  for (const c of RECON_CLASSES) c.skills.forEach((s, i) => {
    const id = `cls_${c.id}_${i}`;
    if (!SKILLS.some((k) => k.id === id)) SKILLS.push({ id, name: s[0], type: s[1], power: s[2], mp: s[3], desc: s[4], elem: s[5] || null, rankReq: [0, 2, 5][i], price: 0, cls: c.id });
  });
}

// ---------- 2. 정찰 ----------
GNODE.unknown = { name: '미확인', desc: '앞이 보이지 않는다', color: '#8a94a6', svg: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>' };
const SCOUT_TYPES = ['fight', 'elite', 'event', 'rest', 'treasure'];
// 잘못 볼 때 헷갈리기 쉬운 쪽
const SCOUT_MIX = { fight: ['elite', 'event'], elite: ['fight'], event: ['treasure', 'fight'], rest: ['event', 'treasure'], treasure: ['event', 'rest'] };

Object.assign(Game.prototype, {
  // 한 사람의 정찰 능력 (탐색계만): 직업 바탕 + 등급 + 전직
  scoutPower(cls, rankIdx, adv) {
    const c = classById(cls); if (!c || c.g !== 'recon') return 0;
    return (c.scout || 2) + (rankIdx || 0) * 0.55 + (adv || 0) * 0.8;
  },
  // 파티에서 정찰을 맡는 사람 (가장 잘 보는 사람)
  partyScout() {
    const p = this.player; let best = null;
    const cand = [{ who: null, name: p.name, cls: p.cls, rankIdx: p.rankIdx, adv: p.clsAdv }];
    for (const n of this.party ? this.party() : []) if (n && n.alive) cand.push({ who: n, name: n.name, cls: n.cls, rankIdx: n.rankIdx, adv: n.clsAdv });
    for (const c of cand) { const v = this.scoutPower(c.cls, c.rankIdx, c.adv); if (v > 0 && (!best || v > best.power)) best = { ...c, power: v }; }
    return best;
  },
});

const GateScout = {
  key: (r, i) => r + ':' + i,
  // 몇 행 앞까지 보이나
  range(power) { return Math.max(1, Math.min(6, Math.floor(1 + power * 0.7))); },
  // d행 앞의 칸을 맞게 볼 확률
  acc(power, d) { return Math.max(0.35, Math.min(0.97, 0.6 + power * 0.08 - (d - 1) * 0.09)); },
  // 지금 자리에서 정찰
  scout(m, sc) {
    m.seen ||= {};
    const at = m.pos || [0, 0];
    const tag = at.join(':') + '@' + (sc ? sc.name : '-');
    if (m.scoutedAt === tag) return;
    m.scoutedAt = tag;
    if (!sc) return;
    const R = this.range(sc.power);
    // 지금 자리에서 갈 수 있는 칸들을 행마다 넓혀 간다
    let front = [at]; const seenNow = new Set();
    for (let d = 1; d <= R; d++) {
      const nx = [];
      for (const [r, i] of front) { const row = m.rows[r]; if (!row || !row[i]) continue; for (const j of row[i].next) { const k = this.key(r + 1, j); if (!seenNow.has(k)) { seenNow.add(k); nx.push([r + 1, j]); } } }
      for (const [r, i] of nx) {
        const nd = m.rows[r][i]; if (!SCOUT_TYPES.includes(nd.t)) continue;
        const k = this.key(r, i); const old = m.seen[k];
        if (old && old.d <= d) continue; // 더 가까이서 본 적이 있으면 그대로
        const a = this.acc(sc.power, d);
        const right = Math.random() < a;
        const t = right ? nd.t : RNG.pick(SCOUT_MIX[nd.t] || SCOUT_TYPES.filter((x) => x !== nd.t));
        m.seen[k] = { t, d, a: Math.round(a * 100), by: sc.name };
      }
      front = nx; if (!front.length) break;
    }
  },
  // 화면에 보일 칸 종류
  shown(m, r, i) {
    const nd = m.rows[r][i]; const k = this.key(r, i);
    if (nd.t === 'start' || nd.t === 'boss') return { t: nd.t };
    if ((m.done || []).includes(k)) return { t: nd.t };
    const s = m.seen && m.seen[k];
    return s ? { t: s.t, a: s.a } : { t: 'unknown' };
  },
};

// ---------- 1. 길 위험 맞추기 ----------
const DANGER = { fight: 1, elite: 1.6 };
GateScout.balance = function (map) {
  const rows = map.rows;
  const paths = [];
  const walk = (r, i, acc) => {
    const nd = rows[r][i]; const next = [...acc, [r, i]];
    if (r === rows.length - 1 || !nd.next.length) { paths.push(next); return; }
    for (const j of nd.next) walk(r + 1, j, next);
  };
  walk(0, 0, []);
  if (paths.length < 2) return map;
  const danger = (p) => p.reduce((s, [r, i]) => s + (DANGER[rows[r][i].t] || 0), 0);
  for (let it = 0; it < 40; it++) {
    const ds = paths.map(danger);
    const lo = Math.min(...ds), hi = Math.max(...ds);
    if (hi - lo <= 1.05) break;
    if (it % 2 === 0) {
      // 가장 쉬운 길의 쉬운 칸 하나를 전투로 (보물·사건 먼저, 마지막 행 휴식은 되도록 남긴다)
      const p = paths[ds.indexOf(lo)];
      const cand = p.filter(([r, i]) => ['treasure', 'event', 'rest'].includes(rows[r][i].t) && r > 0 && r < rows.length - 1)
        .sort((a, b) => ({ treasure: 0, event: 1, rest: 2 }[rows[a[0]][a[1]].t] - { treasure: 0, event: 1, rest: 2 }[rows[b[0]][b[1]].t]) || (b[0] === rows.length - 2) - (a[0] === rows.length - 2));
      if (cand.length) { const [r, i] = cand[0]; rows[r][i].t = 'fight'; continue; }
    }
    // 가장 어려운 길의 전투 하나를 사건으로 (정예는 전투로 낮춘다)
    const p = paths[ds.indexOf(hi)];
    const el = p.find(([r, i]) => rows[r][i].t === 'elite');
    if (el) { rows[el[0]][el[1]].t = 'fight'; continue; }
    const f = p.filter(([r, i]) => rows[r][i].t === 'fight');
    if (f.length) { const [r, i] = RNG.pick(f); rows[r][i].t = RNG.chance(0.6) ? 'event' : 'treasure'; continue; }
    break;
  }
  return map;
};
{
  const baseMake = GateRun.makeFloor;
  GateScout._raw = (...a) => baseMake.apply(GateRun, a);
  GateRun.makeFloor = function (...a) { const m = baseMake.apply(this, a); try { GateScout.balance(m); } catch (e) { /* 실패하면 원래 지도 */ } return m; };
}

// ---------- 화면 ----------
{
  const baseRender = UI.renderGateMap;
  UI.renderGateMap = function (note) {
    const c = this.ctx; const m = c && c.run && c.run.map;
    if (!m) return baseRender.call(this, note);
    const sc = G.partyScout();
    GateScout.scout(m, sc);
    // 그리는 동안만 칸 종류를 "보이는 것"으로 바꿔 둔다
    const saved = [];
    m.rows.forEach((row, r) => row.forEach((nd, i) => { const s = GateScout.shown(m, r, i); if (s.t !== nd.t) { saved.push([nd, nd.t]); nd.t = s.t; } }));
    const head = sc
      ? `<span class="scout-who">정찰 · <b>${sc.name}</b> <span class="dim">(${classById(sc.cls).name})</span> · 앞으로 ${GateScout.range(sc.power)}칸까지 보인다. 멀수록 잘못 볼 수 있다.</span>`
      : '<span class="scout-who none">탐색계 헌터가 없어 앞길이 보이지 않는다. 층 보스의 기척만 느껴진다.</span>';
    try { baseRender.call(this, note); } finally { for (const [nd, t] of saved) nd.t = t; }
    // 정찰 상황은 범례 아래 한 줄로 (알림 창으로 띄우지 않는다)
    const lg = document.querySelector('#modal .gmap-legend');
    if (lg) { const old = document.querySelector('#modal .scout-line'); if (old) old.remove(); lg.insertAdjacentHTML('afterend', `<div class="scout-line small">${head}</div>`); }
    // 범례에 미확인 추가, 정찰로 본 칸에 확신도
    const box = document.querySelector('#modal .gmap'); if (!box) return;
    const legend = document.querySelector('#modal .gmap-legend');
    if (legend && !legend.querySelector('.gl.unknown')) legend.insertAdjacentHTML('beforeend', `<span class="gl unknown" style="--c:${GNODE.unknown.color}"><i></i>미확인</span>`);
    // 칸마다 확신도 (정찰로 본 칸만)
    const btns = box.querySelectorAll('.gnode');
    let n = 0;
    m.rows.forEach((row, r) => row.forEach((nd, i) => {
      const b = btns[n++]; if (!b) return;
      const s = GateScout.shown(m, r, i);
      if (s.a != null) { b.classList.add('scouted'); if (s.a < 75) b.classList.add('unsure'); b.title = `${GNODE[s.t].name}로 보인다 (정찰 확신 ${s.a}%)`; }
      else if (s.t === 'unknown') b.title = '미확인';
    }));
  };
  // 들어가 보니 정찰과 달랐을 때
  const baseEnter = UI.enterNode;
  UI.enterNode = function (key) {
    const m = this.ctx && this.ctx.run && this.ctx.run.map;
    const s = m && m.seen && m.seen[key];
    if (s && m) { const [r, i] = key.split(':').map(Number); const nd = m.rows[r] && m.rows[r][i]; if (nd && s.t !== nd.t) this.toast(`정찰과 달랐다! ${GNODE[s.t].name}인 줄 알았는데 ${GNODE[nd.t].name}이다.`); }
    return baseEnter.call(this, key);
  };
  // 팀 상의(리더의 길 고르기)도 보이는 것만 보고 판단한다
  const baseNodeOf = UI.nodeOf;
  if (baseNodeOf) UI.nodeOf = function (key) {
    const nd = baseNodeOf.call(this, key);
    const m = this.ctx && this.ctx.run && this.ctx.run.map; if (!m || !nd) return nd;
    const [r, i] = key.split(':').map(Number);
    const s = GateScout.shown(m, r, i);
    return s.t === nd.t ? nd : { ...nd, t: s.t };
  };
}
