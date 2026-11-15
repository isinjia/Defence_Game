// 게이트 브레이크 보강 (사용자 요청: 프롤로그처럼 "게이트가 터져 괴수가 쏟아져 나오는" 현상)
// 1) 조짐: 닫힘 기한이 한 달 남은 게이트는 "균열 수치 상승" 경고가 뜬다(소문·지도 경고 고리). 그때 닫으면 브레이크를 미리 막은 공(공적 +5, 명성 +2).
// 2) 쏟아짐: 브레이크가 나면 그 도시 주변 칸에 괴수 무리 4개가 쏟아져 나오고, 브레이크가 이어지는 동안 매달 바깥으로 퍼진다(최대 8무리).
//    지도에서는 붉게 맥박치는 고리로 구분한다. 브레이크를 막으면 남은 무리의 절반이 흩어진다.
// 3) 도시 방어전: [방어전 참가]는 이제 거리 방어 — 몰려오는 무리 세 번을 막고 마지막에 브레이크의 핵(보스)을 벤다.
//    웨이브 사이마다 결과가 나오고, 전투에서 물러나면 방어전에서 빠진다(브레이크는 계속된다).
const BREAK2 = { omenLeft: 1, spill: 4, spillMax: 8, omenMerit: 5, omenFame: 2 };
{
  const GP = Game.prototype;
  const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const cityXY = (rid) => (WORLD.cityPos && WORLD.cityPos[rid]) || null;
  const freeNear = (g, cx, cy, r0, r1) => {
    for (let k = 0; k < 30; k++) {
      const a = Math.random() * Math.PI * 2, d = r0 + Math.random() * (r1 - r0);
      const x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
      if (!WORLD.inb(x, y) || WORLD.cityAt(x, y)) continue;
      const tt = WORLD.tiles && WORLD.tiles[WORLD.idx(x, y)]; if (tt === 0 || tt === 7) continue; // 바다·북쪽 통제 구역 제외 (world.js T.SEA·T.NORTH)
      if (g.player && g.player.x === x && g.player.y === y) continue;
      if (g.objAt && g.objAt(x, y)) continue;
      return [x, y];
    }
    return null;
  };
  const spillPack = (g, b, x, y) => {
    const tier = Math.max(0, Math.min(7, b.tier - (Math.random() < 0.5 ? 1 : 0)));
    const tpl = RNG.pick(MONSTERS.filter((m) => Math.abs(m.tier - tier) <= 1)) || MONSTERS[0];
    const mob = { id: g.nextObjId++, kind: 'mob', x, y, region: b.city, tier, elem: tpl.elem, name: tpl.name, shape: tpl.shape, count: rint(2, 3), born: g.monthKey(), spill: b.city };
    g.mobs.push(mob); return mob;
  };
  GP.breakSpill = function (b) {
    const c = cityXY(b.city); if (!c) return 0;
    let n = 0;
    for (let i = 0; i < BREAK2.spill; i++) { const pos = freeNear(this, c[0], c[1], 2, 5); if (pos) { spillPack(this, b, pos[0], pos[1]); n++; } }
    return n;
  };
  GP.breakSpread = function (b) {
    const c = cityXY(b.city); if (!c) return;
    const packs = this.mobs.filter((m) => m.spill === b.city);
    if (packs.length >= BREAK2.spillMax) return;
    for (const m of packs.slice(0, 2)) { const pos = freeNear(this, m.x, m.y, 1, 3); if (pos) spillPack(this, b, pos[0], pos[1]); }
  };

  // 새로 생긴 브레이크를 알아채 쏟아지게, 이어지는 브레이크는 퍼지게
  const watch = (fn) => function (...a) {
    const before = new Set((this.world && this.world.breaks || []).map((b) => b.city));
    const r = fn.apply(this, a);
    try {
      for (const b of this.world.breaks || []) {
        if (!before.has(b.city)) { const n = this.breakSpill(b); if (n) this.queue.push({ type: 'toast', text: `${regionById(b.city).name} 주변으로 괴수 무리 ${n}개가 쏟아져 나왔다! 지도에 붉게 표시된다.` }); }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  if (GP.spawnMonthly) GP.spawnMonthly = watch(GP.spawnMonthly);
  if (GP.worldMonthly) GP.worldMonthly = watch(GP.worldMonthly);
  // 달마다: 이어지는 브레이크는 퍼지고, 기한이 임박한 게이트엔 조짐
  const baseMonthly = GP.spawnMonthly;
  GP.spawnMonthly = function (...a) {
    const r = baseMonthly.apply(this, a);
    try {
      const mk = this.monthKey();
      for (const b of this.world.breaks || []) if (b.at !== mk) this.breakSpread(b);
      for (const g of this.mapGates || []) {
        if (g.omen || g.final || g.mission || g.crew || g.breakCity || g.cleared || g.deadline == null || g.region === 'jeju') continue;
        if (g.deadline - mk <= BREAK2.omenLeft && !g.raid) {
          g.omen = true;
          const reg = regionById(g.region);
          this.rumor(`${reg.name} 쪽 ${RANKS[g.tier].key}급 게이트의 균열 수치가 오르고 있다. 이번 달 안에 닫지 않으면 터질 수 있다.`, { kind: 'break-omen', score: 1 });
          if (this.player && this.player.region === g.region) this.queue.push({ type: 'toast', text: `균열 경고: 근처 ${RANKS[g.tier].key}급 게이트 수치가 미쳤다. 기한 안에 닫지 않으면 브레이크가 난다.` });
        }
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 조짐 게이트를 닫으면 공
  const baseFinish = GP.finishGate;
  if (baseFinish) GP.finishGate = function (gate, result, ...a) {
    const r = baseFinish.call(this, gate, result, ...a);
    try {
      if (gate && gate.omen && result === 'clear') {
        const p = this.player; p.merit = (p.merit || 0) + BREAK2.omenMerit; p.fame = (p.fame || 0) + BREAK2.omenFame;
        this.rumor(`${p.name}이(가) 터지기 직전의 ${regionById(gate.region).name} 게이트를 닫았다. 브레이크를 미리 막았다는 말이 돈다.`);
        if (Array.isArray(r)) r.push(`브레이크를 미리 막았다. (공적 +${BREAK2.omenMerit}, 명성 +${BREAK2.omenFame})`);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 브레이크를 막으면 남은 무리 절반이 흩어진다
  const baseResolve = GP.resolveBreak;
  if (baseResolve) GP.resolveBreak = function (rid, ...a) {
    const r = baseResolve.call(this, rid, ...a);
    try { const packs = this.mobs.filter((m) => m.spill === rid); const gone = new Set(packs.filter((_, i) => i % 2 === 0).map((m) => m.id)); this.mobs = this.mobs.filter((m) => !gone.has(m.id)); for (const m of this.mobs) if (m.spill === rid) m.spill = null; } catch (e) { /* 무시 */ }
    return r;
  };

  // 지도: 조짐 게이트 경고 고리, 쏟아진 무리 붉은 고리
  if (typeof MapView !== 'undefined') {
    const MP = MapView.prototype; const baseObjs = MP.drawObjects;
    MP.drawObjects = function (...a) {
      // 괴수 무리 아래 붉은 빛은 먼저, 게이트 경고 고리·글씨는 게이트 그림 위에 그린다
      const r0 = baseObjs.apply(this, a);
      try {
        const c = this.ctx, s = this.tile, t = this.t || 0; const pulse = 0.5 + 0.5 * Math.sin(t / 12);
        for (const g of G.gatesShown ? G.gatesShown() : []) {
          const live = g.omen ? g : (G.mapGates || []).find((x) => x.id === g.id);
          if (!live || !live.omen || g.gone) continue;
          const [px, py] = this.toScreen(g.x + 1, g.y + 1);
          if (px < -s * 3 || py < -s * 3 || px > this.w + s * 3 || py > this.hgt + s * 3) continue;
          c.save(); c.setLineDash([s * 0.18, s * 0.12]); c.lineDashOffset = -t;
          c.strokeStyle = `rgba(255,120,60,${0.55 + pulse * 0.4})`; c.lineWidth = 3;
          c.beginPath(); c.arc(px, py, s * (1.12 + pulse * 0.08), 0, Math.PI * 2); c.stroke(); c.restore();
          this.chip(px, py - s * 1.25, '균열 경고', '#ffb08a', 'rgba(40,10,6,.9)');
        }
        for (const m of G.mobs || []) {
          if (!m.spill) continue; if (G.objSeen && !G.objSeen(m)) continue;
          const [px, py] = this.toScreen(m.x + 0.5, m.y + 0.5);
          if (px < -s || py < -s || px > this.w + s || py > this.hgt + s) continue;
          const gr = c.createRadialGradient(px, py, 1, px, py, s * 0.75);
          gr.addColorStop(0, `rgba(255,60,80,${0.35 + pulse * 0.25})`); gr.addColorStop(1, 'rgba(255,60,80,0)');
          c.fillStyle = gr; c.beginPath(); c.arc(px, py, s * 0.75, 0, Math.PI * 2); c.fill();
        }
      } catch (e) { /* 표시 실패는 지도를 막지 않는다 */ }
      return r0;
    };
  }

  // 도시 방어전
  if (typeof UI !== 'undefined') {
    const WAVES = [
      { title: '첫 번째 무리', say: '골목 끝에서 괴수 무리가 몰려온다. 시민들이 뒤로 달아난다.', mob: (t) => ({ tier: Math.max(0, t - 1), n: 3 }) },
      { title: '두 번째 무리', say: '큰길 쪽에서 두 번째 무리가 밀려든다. 버스가 뒤집혀 있다.', mob: (t) => ({ tier: Math.max(0, t - 1), n: 3 }) },
      { title: '세 번째 무리', say: '균열 가까이로 갈수록 괴수가 굵어진다.', mob: (t) => ({ tier: t, n: 2 }) },
      { title: '브레이크의 핵', say: '터진 게이트 한가운데, 균열을 붙잡고 있는 거대한 핵이 맥박친다. 이것만 베면 균열이 닫힌다.', mob: (t) => ({ tier: t, n: 2, boss: true }) },
    ];
    UI.breakDefense = function (rid, i = 0) {
      const b = G.cityBreak(rid); if (!b) return this.after('브레이크는 이미 수습됐다.');
      const w = WAVES[i]; const last = i === WAVES.length - 1;
      const reg = regionById(rid);
      const next = () => G.storyFight({
        title: `${reg.name} 브레이크 방어전 · ${w.title}`,
        mobs: w.mob(b.tier),
        win: last
          ? { text: '핵이 갈라지며 균열이 닫혔다. 거리에 정적이 내려앉는다.', after: (g) => { const t = g.resolveBreak(rid); g.queue.push({ type: 'toast', text: t }); } }
          : { text: `${w.title}을(를) 막아 냈다. 숨을 돌릴 틈도 없이 다음 무리의 발소리가 들린다.`, after: () => { setTimeout(() => { if (!UI.ctx) UI.breakDefense(rid, i + 1); }, 50); } },
        lose: { text: '밀려났다. 동료들이 부축해 물러섰다. 브레이크는 아직 끝나지 않았다.' },
      });
      // 첫 웨이브 앞 장면
      if (i === 0) {
        return this.talk([{ narr: `${reg.name} 시내. 사이렌이 끊이지 않는다. ${RANKS[b.tier].key}급 게이트가 터진 자리에서 괴수가 쏟아져 나온다.` }, { sys: '거리 방어 · 몰려오는 무리 셋을 막고 마지막에 브레이크의 핵을 벤다. 전투에서 물러나면 방어전에서 빠진다.' }],
          () => { next(); this.processQueue(); });
      }
      this.toast(`${w.title} · ${w.say}`);
      next(); return this.processQueue();
    };
    const baseH = UI.handle;
    UI.handle = function (act, v) {
      if (act === 'break-fight') { const rid = G.region().id; if (!G.cityBreak(rid)) return; this.closeModal(); return this.breakDefense(rid, 0); }
      return baseH.call(this, act, v);
    };
  }
}
