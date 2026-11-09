// ===== 게이트 크로니클: 전투 평가·MVP (영역 A-3, docs/전투_제안.md 9) =====
// 전투가 끝나면 아군마다 준 피해·치유·받아 낸 피해·처치를 모아 기여도를 매기고, 결과 화면에 한 줄로 MVP를 보여 준다.
// 동료가 MVP면 관계가 오르고 한마디 한다. 같은 집계를 연합 레이드 보상 분배에도 쓸 수 있다(UI.combatStats).

const MVP_LINE = {
  just: ['다들 무사해서 다행이야.', '오늘은 내가 앞에 섰을 뿐이야.'],
  kind: ['헤헤, 조금은 도움이 됐죠?', '다들 다친 데 없죠?'],
  cold: ['…계산대로다.', '당연한 결과다.'],
  warlike: ['봤냐? 이게 실력이다!', '다음엔 더 센 놈으로 데려와.'],
  greedy: ['MVP면 분배 좀 더 주는 거지?', '내 몫 잊지 마.'],
};

{
  // 치유는 기록에 시전자가 없으니 직접 센다
  const baseUse = Combat.prototype.useSkill;
  Combat.prototype.useSkill = function (u, skill, target) {
    const prev = this._actor; this._actor = u;
    try { return baseUse.call(this, u, skill, target); } finally { this._actor = prev; }
  };
  const baseHeal = Combat.prototype.healUnit;
  Combat.prototype.healUnit = function (u, v, by) {
    const before = u.hp;
    const r = baseHeal.call(this, u, v, by);
    const who = by || this._actor;
    if (who && who.side === 'ally') { const k = who.summonOf || who.id; (this.healBy ||= {})[k] = (this.healBy[k] || 0) + Math.max(0, u.hp - before); }
    return r;
  };
}

Object.assign(UI, {
  // 아군별 기여 집계
  combatStats(cb) {
    const st = {};
    const owner = (id) => { const u = cb.units.find((x) => x.id === id); return u && u.summonOf ? u.summonOf : id; };
    for (const u of cb.units) if (u.side === 'ally' && !u.summon) st[u.id] = { unit: u, dealt: 0, heal: 0, taken: 0, kills: 0, score: 0 };
    for (const l of cb.log) {
      const e = l.ev; if (!e || e.k !== 'dmg') continue;
      if (e.src) { const s = st[owner(e.src)]; if (s) { s.dealt += e.amt || 0; if (e.killed) s.kills++; } }
      if (e.dst && st[e.dst]) st[e.dst].taken += e.amt || 0;
    }
    for (const [id, v] of Object.entries(cb.healBy || {})) if (st[id]) st[id].heal += v;
    // 항목마다 파티 전체에서 차지한 몫으로 매긴다 (딜러·탱커·치유사가 같은 저울에 오르도록)
    const all = Object.values(st);
    for (const s of all) {
      const role = (classById(s.unit.cls) || {}).role;
      // 받아 낸 피해는 앞에 선 사람(전열·탱커)일수록 기여로 친다
      s.guard = s.taken * (role === 'tank' ? 1 : s.unit.row === 'front' ? 0.6 : 0.15);
    }
    const sum = (k) => all.reduce((a, s) => a + s[k], 0) || 1;
    const T = { dealt: sum('dealt'), heal: sum('heal'), guard: sum('guard'), kills: sum('kills') };
    // 각자 제 힘(공격·방어·체력)에 비해 얼마나 해냈는지로 매긴다: 강한 사람만 늘 MVP가 되지 않도록
    for (const s of all) {
      const u = s.unit; const power = Math.max(1, u.atk * 1.2 + u.def + u.maxHp / 8);
      s.abs = s.dealt * 1.3 + s.heal * 1.8 + s.guard * 1.4 + s.kills * 20;
      s.score = Math.round((s.abs / power) * 100);
    }
    return Object.values(st).sort((a, b) => b.score - a.score);
  },
  mvpHtml() {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return '';
    const cb = c.combat;
    if (!cb.result || cb.result === 'flee') return '';
    const list = this.combatStats(cb);
    if (list.length < 2) return ''; // 혼자 싸운 전투는 생략
    const top = list[0]; if (!top || top.score <= 0) return '';
    const u = top.unit;
    // 동료가 MVP면 관계 + 한마디 (전투마다 한 번)
    if (!cb.mvpDone) {
      cb.mvpDone = true;
      if (!u.isPlayer && u.npcId != null && cb.result === 'win') {
        const n = G.npcById(u.npcId); if (n) G.changeRel(n, 2, '함께 싸운 전투에서 MVP로 인정받았다');
        cb.mvpSay = RNG.pick(MVP_LINE[u.pers] || ['좋았어.']);
      }
      if (u.isPlayer && cb.result === 'win') G.player.mvpCount = (G.player.mvpCount || 0) + 1;
    }
    const part = (v, name) => (v > 0 ? `${name} <span class="num">${fmt(v)}</span>` : '');
    const total = list.reduce((a, s) => a + s.score, 0) || 1;
    const bars = list.map((s) => `<div class="mvp-row ${s === top ? 'top' : ''}"><span class="mvp-n">${s.unit.isPlayer ? '나' : s.unit.name.replace(/\(.*\)$/, '')}</span><span class="mvp-bar"><i style="width:${Math.round((s.score / total) * 100)}%"></i></span><span class="num small">${Math.round((s.score / total) * 100)}%</span></div>`).join('');
    return `<details class="mvp"><summary><b class="mvp-tag">MVP</b> ${u.isPlayer ? '나' : u.name.replace(/\(.*\)$/, '')} <span class="small dim">${[part(top.dealt, '피해'), part(top.heal, '치유'), part(top.taken, '받아 냄'), top.kills ? `처치 ${top.kills}` : ''].filter(Boolean).join(' · ')}</span>${cb.mvpSay ? ` <span class="small mvp-say">"${cb.mvpSay}"</span>` : ''}</summary><div class="mvp-list">${bars}</div></details>`;
  },
});

{
  const baseResult = UI.combatResultHtml;
  UI.combatResultHtml = function (...a) {
    const html = baseResult.apply(this, a);
    let m = ''; try { m = this.mvpHtml(); } catch (e) { m = ''; }
    return m + html;
  };
}
