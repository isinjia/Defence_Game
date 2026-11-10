// ===== 일반 대원 명단: 이름 없는 각성자를 숫자·등급 분포로만 둔다 (영역 E) =====
// 완전한 NPC(간부·주요 인물)는 지금 수를 유지하고, 나머지 인원은 명단으로만 있다. 공격대 전력·랭킹 분모에 들어간다.
// 소속 이동 규칙도 여기: 무소속은 이유가 있어 무소속이다. 연 4%쯤만(등급이 오르면 더 자주) 길드에 들고, 그만큼 길드원이 무소속으로 나온다.
// 수치: docs/E_수치.md "일반 대원·소속 이동"
const RF = {
  size: { giant: 120, gov: 180, minor: 10, free: 600 },   // 길드 규모별 일반 대원 수, 전국 무소속 수
  dist: {                                                  // 등급 분포(F부터). 일반 대원은 B급 이하
    giant: [12, 24, 32, 22, 10], gov: [15, 30, 30, 19, 6], minor: [30, 35, 25, 10], free: [38, 30, 20, 9, 3],
  },
  regen: 0.25,        // 인원이 모자란 명단이 한 달에 1명 채워질 확률
  clout: 2,           // 길드 세력 = 위세 + clout × √(공격대 전력 합): 영향력은 규모만큼 늘지 않는다
  presSoft: 100,      // 위세가 이 값을 넘으면 넘는 부분은 3×√로만 세력에 반영(독주 방지)
  rfSyn: 1.1,         // 일반 공격대의 평균 조합 보정
  joinYear: 0.03,     // 무소속이 1년에 길드에 들 확률
  joinOnRankUp: 0.1,  // 등급이 오른 달에 길드에 들 확률(특별히 강해졌을 때)
  rankScore: 450,     // 일반 대원의 랭킹 점수 = 등급×1000 + 이 값
};
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const tierOf = (id) => { const g = GUILDS[id]; return id === 'kama' || g.tier === 'gov' ? 'gov' : g.minor || g.tier === 'minor' ? 'minor' : 'giant'; };
  const spread = (n, w) => { const s = w.reduce((a, b) => a + b, 0); const out = Array(8).fill(0); w.forEach((x, i) => { out[i] = Math.round(n * x / s); }); return out; };
  const sum = (a) => (a || []).reduce((x, y) => x + y, 0);
  Object.assign(GP, {
    rfInit() {
      const w = this.world; if (!w) return;
      w.rf ??= { g: {}, free: null };
      for (const id of Object.keys(GUILDS)) w.rf.g[id] ??= spread(RF.size[tierOf(id)], RF.dist[tierOf(id)]);
      w.rf.free ??= spread(RF.size.free, RF.dist.free);
    },
    rfOf(id) { const w = this.world; return (w && w.rf && w.rf.g[id]) || null; },
    rfCount(id) { return sum(this.rfOf(id)); },
    rfFree() { const w = this.world; return sum(w && w.rf && w.rf.free); },
    // 명단에서 한 명을 빼서 등급을 돌려준다(완전한 NPC로 올릴 때). minRank 미만은 뽑지 않는다
    rfTake(id, minRank = 0, maxRank = 7) {
      const a = this.rfOf(id); if (!a) return null;
      const idx = []; const wt = [];
      for (let r = minRank; r <= maxRank; r++) if (a[r] > 0) { idx.push(r); wt.push(a[r]); }
      if (!idx.length) return null;
      const r = RNG.weighted(idx, wt); a[r]--; this._gpCache = null;
      return r;
    },
    rfMonthly() {
      const w = this.world; if (!w || !w.rf) return;
      const fill = (a, kind) => { if (sum(a) < RF.size[kind] && RNG.chance(RF.regen)) { const d = RF.dist[kind]; a[RNG.weighted(d.map((_, i) => i), d)]++; this._gpCache = null; } };
      for (const id of Object.keys(GUILDS)) if (w.rf.g[id]) fill(w.rf.g[id], tierOf(id));
      fill(w.rf.free, 'free');
    },
    // 전국 각성자 수(완전한 NPC + 일반 대원)
    census() {
      const c = { giant: 0, gov: 0, minor: 0, free: this.rfFree() };
      for (const n of this.npcs) { if (!n.alive || n.child) continue; if (n.guild && GUILDS[n.guild]) c[tierOf(n.guild)]++; else c.free++; }
      for (const id of Object.keys(GUILDS)) c[tierOf(id)] += this.rfCount(id);
      c.total = c.giant + c.gov + c.minor + c.free;
      return c;
    },
    // 소속 이동: 무소속 → 길드(드물게), 같은 수만큼 길드 → 무소속
    affFlowMonthly() {
      const stay = (n) => n.isCompanion || n.crewOf || n.ogMember || n.retired || n.examLeader;
      const ids = Object.keys(GUILDS); const giants = ids.filter((id) => tierOf(id) === 'giant'); const minors = ids.filter((id) => tierOf(id) === 'minor');
      let joins = 0;
      for (const n of this.npcs) {
        if (!n.alive || n.child) continue;
        const up = n.rk0 != null && n.rankIdx > n.rk0; n.rk0 = n.rankIdx;
        if (n.guild || n.rankIdx < 1 || stay(n)) continue;
        if (!RNG.chance(up ? RF.joinOnRankUp : RF.joinYear / 12)) continue;
        const near = this.minorGuildsNear ? this.minorGuildsNear(n.region) : [];
        const r = RNG.next();
        n.guild = n.rankIdx >= 3 && r < 0.5 ? RNG.pick(giants) : r > 0.9 ? 'kama' : RNG.pick(near.length ? near : minors);
        joins++;
        if (n.met || n.rankIdx >= 5) this.rumor(`무소속으로 뛰던 ${n.name}이(가) ${GUILDS[n.guild].name}에 들어갔다.`);
      }
      if (joins) {
        const pool = this.npcs.filter((n) => n.alive && !n.child && n.guild && GUILDS[n.guild] && !stay(n) && n.rk0 === n.rankIdx);
        for (let i = 0; i < joins && pool.length; i++) {
          const n = pool.splice(RNG.int(0, pool.length - 1), 1)[0]; const from = n.guild; n.guild = null;
          if (n.met || n.rankIdx >= 5) this.rumor(`${n.name}이(가) ${GUILDS[from].name}을(를) 나와 무소속이 되었다.`);
        }
        this._gpCache = null;
      }
      return joins;
    },
  });
  GP.rfFlow = true; // game.js의 옛 "매달 1% 길드 가입"을 끈다
  wrap('initSandbox', function (base) { base.call(this); this.rfInit(); });
  wrap('worldMonthly', function (base) { base.call(this); try { this.rfInit(); this.rfMonthly(); this.affFlowMonthly(); } catch (e) { console.warn('rank_file', e); } });
  // 랭킹: 일반 대원도 분모에 넣고, 나보다 점수가 높은 만큼 순위를 민다
  wrap('ranking', function (base) {
    const r = base.call(this); const w = this.world; if (!w || !w.rf) { r.total = r.list.length; return r; }
    const mine = this.playerRankScore(); let ahead = 0, all = 0;
    const add = (a) => { for (let k = 0; k < 8; k++) { const c = a[k] || 0; all += c; if (k * 1000 + RF.rankScore > mine) ahead += c; } };
    for (const id of Object.keys(w.rf.g)) add(w.rf.g[id]);
    add(w.rf.free || []);
    r.namedPos = r.pos; r.pos += ahead; r.total = r.list.length + all;
    return r;
  });
}
