// ===== 길드 전력 = 공격대 전력의 합, 공격대 전력 = 개인 전력의 조합 (영역 E) =====
// 길드원을 공격대(파티)로 묶고, 길드 세력(guildPower)을 "위세 + 공격대 전력 합"으로 계산한다.
// 수치: docs/E_수치.md "길드·공격대 전력"
const GPARTY = {
  size: 4,            // 공격대 정원
  perRank: 3,         // 개인 전력 = 등급 배율 × 3 (기존 guildPower와 같은 단위)
  synPerGroup: 0.05,  // 계열이 하나 더 다양할 때마다 +5%
  synMax: 0.15,       // 조합 보정 상한
  short: 0.1,         // 정원에서 1명 모자랄 때마다 −10%
};
{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; if (!base) return; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };
  const grp = (cls) => { try { return classById(cls || 'swordsman').g; } catch (e) { return 'fighter'; } };
  Object.assign(GP, {
    // 조합 보정: 계열이 고를수록 강하고, 인원이 모자라면 약하다
    partySynergy(groups, size = groups.length) {
      const kinds = new Set(groups).size;
      return (1 + Math.min(GPARTY.synMax, Math.max(0, kinds - 1) * GPARTY.synPerGroup)) * (1 - Math.max(0, Math.min(GPARTY.size, 4) - size) * GPARTY.short);
    },
    // 길드원을 등급순으로 공격대에 나눈다. 플레이어가 길드원이면 자기 파티가 한 공격대다.
    guildParties(id) {
      const key = `${this.monthKey()}:${this.day}:${this.npcs.length}:${this.player.guild}:${(this.player.party || []).length}:${this.player.rankIdx}`;
      const cache = this._gpCache && this._gpCache.key === key ? this._gpCache : (this._gpCache = { key, m: {} });
      if (cache.m[id]) return cache.m[id];
      const p = this.player; const mine = p.guild === id; const mates = mine ? this.party().filter((n) => n.alive) : [];
      const mateIds = new Set(mates.map((n) => n.id));
      const rest = this.npcs.filter((n) => n.alive && !n.child && n.guild === id && !mateIds.has(n.id)).sort((a, b) => b.rankIdx - a.rankIdx || (b.stage || 0) - (a.stage || 0) || (a.id < b.id ? -1 : 1));
      const out = [];
      const make = (mem, withPlayer) => {
        let base = mem.reduce((s, n) => s + RANKS[n.rankIdx].mult * GPARTY.perRank, 0);
        const groups = mem.map((n) => grp(n.cls));
        if (withPlayer) { base += RANKS[p.rankIdx].mult * (GPARTY.perRank + 1) + (p.guildRank || 0) * 3; groups.push(grp(p.cls)); }
        const size = mem.length + (withPlayer ? 1 : 0); const syn = this.partySynergy(groups, size);
        const top = mem.reduce((m, n) => Math.max(m, n.rankIdx), withPlayer ? p.rankIdx : 0);
        return { members: mem, mine: !!withPlayer, leader: withPlayer ? (this.crewLeader && this.crewLeader()) || null : mem[0], playerLeads: !!withPlayer && !(this.crew && this.crew()), size, base: Math.round(base), syn, power: Math.round(base * syn), top };
      };
      if (mine) out.push(make(mates, true));
      for (let i = 0; i < rest.length; i += GPARTY.size) out.push(make(rest.slice(i, i + GPARTY.size), false));
      // 일반 대원(rank_file.js): 등급순으로 4명씩 공격대
      const rf = this.rfOf ? this.rfOf(id) : null;
      if (rf) {
        const pool = []; for (let r = 7; r >= 0; r--) for (let i = 0; i < (rf[r] || 0); i++) pool.push(r);
        for (let i = 0; i < pool.length; i += GPARTY.size) {
          const ranks = pool.slice(i, i + GPARTY.size); const base = ranks.reduce((s2, r) => s2 + RANKS[r].mult * GPARTY.perRank, 0);
          const syn = (typeof RF !== 'undefined' ? RF.rfSyn : 1) * (1 - (GPARTY.size - ranks.length) * GPARTY.short);
          out.push({ members: [], rf: true, ranks, mine: false, leader: null, playerLeads: false, size: ranks.length, base: Math.round(base), syn, power: Math.round(base * syn), top: ranks[0] });
        }
      }
      out.sort((a, b) => b.power - a.power);
      out.forEach((t, i) => { t.no = i + 1; t.name = `${i + 1}공격대`; });
      return (cache.m[id] = out);
    },
    guildPartyOf(n) {
      if (!n || !n.guild || !GUILDS[n.guild]) return null;
      return this.guildParties(n.guild).find((t) => t.members.includes(n)) || null;
    },
  });
  // 길드 세력 = 위세 + 공격대 전력 합
  wrap('guildPower', function (base, id) {
    if (!GUILDS[id] || !this.world || !this.world.guildPrestige) return base.call(this, id);
    const k = typeof RF !== 'undefined' ? RF.clout : 0;
    if (!k) { let v = this.world.guildPrestige[id] || 0; for (const t of this.guildParties(id)) v += t.power; return Math.round(v); }
    // 영향력은 규모만큼 늘지 않는다: 위세 + k × √전력
    let pres = this.world.guildPrestige[id] || 0; const cap = RF.presSoft;
    if (cap && pres > cap) pres = cap + 3 * Math.sqrt(pres - cap);
    return Math.round(pres + k * Math.sqrt(this.guildStrength(id)));
  });
  // 길드 전력 = 공격대 전력의 합 (있는 그대로의 크기)
  GP.guildStrength = function (id) { let v = 0; for (const t of this.guildParties(id)) v += t.power; return v; };
  GP.guildSize = function (id) { let v = 0; for (const t of this.guildParties(id)) v += t.size; return v; };
  // 내 팀 전력에도 같은 조합 보정
  wrap('teamPower', function (base, npcs, withPlayer = true) {
    const r = base.call(this, npcs, withPlayer); if (!r) return r;
    const groups = npcs.filter((n) => n && n.alive).map((n) => grp(n.cls)); if (withPlayer) groups.push(grp(this.player.cls));
    r.syn = this.partySynergy(groups, Math.max(groups.length, GPARTY.size)); // 내 팀은 인원 부족 감점 없이 계열 조합만
    r.approx = Math.round(r.approx * r.syn);
    return r;
  });

  if (typeof UI !== 'undefined') {
    const baseGuild = UI.guildHtml;
    if (baseGuild) UI.guildHtml = function () {
      let html = baseGuild.call(this); const p = G.player;
      // 세력 판도 각 줄에 공격대 수
      for (const id of Object.keys(GUILDS)) {
        const ts = G.guildParties(id); if (!ts.length) continue;
        const v = G.guildPower(id);
        html = html.replace(`<span class="small dim">세력 ${v}</span>`, `<span class="small dim">세력 ${v} · 전력 ${fmt(G.guildStrength(id))} · ${fmt(G.guildSize(id))}명 · 공격대 ${ts.length}개</span>`);
      }
      html = html.replace('길드원들의 실력과 위세로 매달 바뀐다.', (() => { const c = G.census ? G.census() : null; return `길드의 전력은 공격대 전력의 합이고, 공격대의 힘은 대원 개개인의 실력과 조합에서 나온다. 세력(영향력)은 위세에 전력을 더해 매기되, 규모만큼 그대로 늘지는 않는다.${c ? ` 전국 각성자 약 ${fmt(c.total)}명: 무소속 ${fmt(c.free)} · 거대 길드 ${fmt(c.giant)} · 중소 길드 ${fmt(c.minor)} · 관리국 ${fmt(c.gov)}.` : ''}`; })());
      if (!p.guild || !GUILDS[p.guild]) return html;
      const ts = G.guildParties(p.guild); const pres = (G.world.guildPrestige && G.world.guildPrestige[p.guild]) || 0;
      const max = Math.max(1, ...ts.map((t) => t.power));
      const rows = ts.slice(0, 8).map((t) => {
        const who = t.mine ? (t.playerLeads ? '리더 <b>나</b>' : `리더 <b>${t.leader ? t.leader.name : '-'}</b> · 내 소속`) : t.rf ? `일반 대원 · 최고 ${RANKS[t.top].key}급` : `리더 <b>${t.leader.name}</b>(${RANKS[t.leader.rankIdx].key}급)`;
        const syn = Math.round((t.syn - 1) * 100);
        return `<div class="item-row ${t.mine ? 'hl' : ''}"><b class="num rank-pos">${t.no}</b><div class="grow"><b>${t.name}</b> <span class="small dim">${who} · ${t.size}인 · 전력 ${t.power}${syn ? ` (조합 ${syn > 0 ? '+' : ''}${syn}%)` : ''}</span>${this.bar('ether', t.power, max)}</div></div>`;
      }).join('');
      const sum = ts.reduce((s, t) => s + t.power, 0);
      return html + `<div class="panel sec"><h3>${GUILDS[p.guild].name} 공격대</h3><p class="small dim">길드원 ${fmt(G.guildSize(p.guild))}명(간부·주요 인물 ${ts.filter((t) => !t.rf).reduce((a, t) => a + t.size, 0)} · 일반 대원 ${fmt(G.rfCount ? G.rfCount(p.guild) : 0)}) · 공격대 ${ts.length}개 · 전력 합 ${fmt(sum)} · 위세 ${Math.round(pres)} → 세력 ${G.guildPower(p.guild)}. 계열이 고른 공격대일수록 강하고, 인원이 모자라면 약하다.</p><div class="cards">${rows}</div>${ts.length > 8 ? `<p class="small dim">그 밖에 ${ts.length - 8}개 공격대</p>` : ''}</div>`;
    };
    // 인물 카드: 길드 공격대 소속(팀 명성 대신 공격대 전력)
    const baseCard = UI.npcCard;
    if (baseCard) UI.npcCard = function (n, here) {
      const html = baseCard.call(this, n, here);
      if (!n || !n.alive || n.child || html.includes('team-line')) return html;
      const gp = G.guildPartyOf(n); if (!gp) return html;
      const line = `<div class="small dim team-line">${GUILDS[n.guild].name} ${gp.name} ${gp.leader === n ? '<span class="tag amber">리더</span>' : '대원'} · 공격대 전력 ${gp.power}</div>`;
      return html.replace('<div class="rel-line">', line + '<div class="rel-line">');
    };
  }
}
