// ===== 게이트 크로니클: 스킬 성장 선택 (영역 A, 사용자 요청) =====
// 스킬은 쓸수록 숙련이 올라 Lv2~4가 되고 Lv5에서 각성한다(hunter.js). 그 기본 성장은 그대로 두고,
// 레벨이 오를 때마다 "어떻게 키울지"를 플레이어가 고른다.
//  - Lv2·3·4: 위력(+8%) / 절약(소모 −12%) / 예리함(치명 +8%, 공격 스킬만) 중 하나. 같은 것을 거듭 골라도 된다.
//  - Lv5 각성: 스킬 종류에 따라 두 갈래 진화 중 하나
//      단일 공격(dmg·crit·pierce): 광역화(적 전체, 위력 ×0.75) / 극대화(위력 ×1.3)
//      광역 공격(aoe): 집중(단일, 위력 ×1.5) / 확산 강화(위력 ×1.15, 소모 −20%)
//      치유(heal): 전체 치유(아군 전체, ×0.75) / 응급(×1.35)
//      그 밖: 강화(위력 ×1.25) / 숙달(소모 −35%)
// 전투 중에 오르면 전투가 끝난 뒤 고르는 창이 뜬다. 스킬 화면에서도 미뤄 둔 선택을 할 수 있다.
const SKILL_GROW = { pow: 0.08, mp: 0.12, crit: 0.08 };
const SKILL_EVO = {
  single: [{ k: 'wide', name: '광역화', desc: '적 전체를 친다. 한 명당 위력 ×0.75', type: 'aoe', pow: 0.75 }, { k: 'focus', name: '극대화', desc: '한 대상에게 위력 ×1.3', pow: 1.3 }],
  aoe: [{ k: 'focus', name: '집중', desc: '한 대상에게 몰아친다. 위력 ×1.5', type: 'dmg', pow: 1.5 }, { k: 'spread', name: '확산 강화', desc: '위력 ×1.15, 소모 −20%', pow: 1.15, mp: 0.8 }],
  heal: [{ k: 'wide', name: '전체 치유', desc: '아군 전체를 치유한다. 한 명당 ×0.75', type: 'heal_all', pow: 0.75 }, { k: 'focus', name: '응급', desc: '한 명을 크게 치유한다. ×1.35', pow: 1.35 }],
  other: [{ k: 'power', name: '강화', desc: '효과 ×1.25', pow: 1.25 }, { k: 'master', name: '숙달', desc: '소모 −35%', mp: 0.65 }],
};
{
  const GP = Game.prototype;
  const ATTACK = ['dmg', 'crit', 'pierce', 'drain', 'stun', 'dot', 'aoe'];
  const evoSet = (sk) => (['dmg', 'crit', 'pierce'].includes(sk.type) ? SKILL_EVO.single : sk.type === 'aoe' ? SKILL_EVO.aoe : sk.type === 'heal' ? SKILL_EVO.heal : SKILL_EVO.other);
  GP.skillPath = function (id) { const p = this.player; p.skillPath ??= {}; return (p.skillPath[id] ??= { picks: [], evo: null }); };
  // 아직 고르지 않은 성장 (레벨에 비해 고른 횟수가 모자라면)
  GP.skillGrowDue = function (id) {
    const lv = this.skillLv(id); const P = this.skillPath(id);
    if (P.picks.length < Math.min(3, lv - 1)) return { lv: P.picks.length + 2, evo: false };
    if (lv >= 5 && !P.evo) return { lv: 5, evo: true };
    return null;
  };
  GP.skillGrowOpts = function (id) {
    const sk = skillById(id); const due = this.skillGrowDue(id); if (!sk || !due) return [];
    if (due.evo) return evoSet(sk);
    const o = [{ k: 'pow', name: '위력', desc: `위력 +${Math.round(SKILL_GROW.pow * 100)}%` }, { k: 'mp', name: '절약', desc: `정신력 소모 −${Math.round(SKILL_GROW.mp * 100)}%` }];
    if (ATTACK.includes(sk.type)) o.push({ k: 'crit', name: '예리함', desc: `치명타 확률 +${Math.round(SKILL_GROW.crit * 100)}%` });
    return o;
  };
  GP.skillGrowPick = function (id, k) {
    const due = this.skillGrowDue(id); const sk = skillById(id); if (!due || !sk) return '';
    const P = this.skillPath(id);
    if (due.evo) { const e = evoSet(sk).find((x) => x.k === k); if (!e) return ''; P.evo = k; this.lifeEvent && this.lifeEvent(`스킬 [${sk.name}]이(가) ${e.name}(으)로 진화했다.`); this.save(); return `${sk.name} · ${e.name}(으)로 진화했다.`; }
    if (!['pow', 'mp', 'crit'].includes(k)) return '';
    P.picks.push(k); this.save();
    return `${sk.name} Lv${due.lv} · ${({ pow: '위력', mp: '절약', crit: '예리함' })[k]}(으)로 키웠다.`;
  };
  GP.skillPathText = function (id) {
    const P = (this.player.skillPath || {})[id]; if (!P) return '';
    const n = (k) => P.picks.filter((x) => x === k).length;
    const parts = [['pow', '위력'], ['mp', '절약'], ['crit', '예리함']].filter(([k]) => n(k)).map(([k, nm]) => `${nm}×${n(k)}`);
    const sk = skillById(id); const e = P.evo && sk ? evoSet(sk).find((x) => x.k === P.evo) : null;
    if (e) parts.push(`진화: ${e.name}`);
    return parts.join(' · ');
  };
  // 효과 반영
  const baseEff = GP.skillEff;
  GP.skillEff = function (sk) {
    const r = baseEff.call(this, sk);
    if (!sk || sk.id === 'strike' || !this.player || !this.player.skillPath || r._grow) return r;
    const P = this.player.skillPath[sk.id]; if (!P || (!P.picks.length && !P.evo)) return r;
    const n = (k) => P.picks.filter((x) => x === k).length;
    const out = { ...r, _eff: true, _grow: true };
    out.power = Math.round(out.power * (1 + SKILL_GROW.pow * n('pow')) * 1000) / 1000;
    out.mp = Math.max(0, Math.round(out.mp * Math.max(0.3, 1 - SKILL_GROW.mp * n('mp'))));
    if (n('crit')) out.critUp = SKILL_GROW.crit * n('crit');
    const base = skillById(sk.id); const e = P.evo && base ? evoSet(base).find((x) => x.k === P.evo) : null;
    if (e) {
      if (e.type) out.type = e.type;
      if (e.pow) out.power = Math.round(out.power * e.pow * 1000) / 1000;
      if (e.mp) out.mp = Math.max(0, Math.round(out.mp * e.mp));
      out.name = `${base.name}·${e.name}`; out.evo = e.k;
    }
    return out;
  };
  // 레벨이 오르면 고르는 창을 띄운다 (전투 중이면 끝난 뒤)
  const baseUse = GP.skillUse;
  GP.skillUse = function (id) {
    const msg = baseUse.call(this, id);
    try { if (msg && this.skillGrowDue(id) && !this.queue.some((q) => q.type === 'skillGrow' && q.id === id)) this.queue.push({ type: 'skillGrow', id }); } catch (e) { /* 무시 */ }
    return msg;
  };
}
// 예리함: 치명 확률
{
  const C = Combat.prototype; const baseCalc = C.calcDamage;
  C.calcDamage = function (att, def, skill, opt = {}) {
    if (skill && skill.critUp) opt = { ...opt, crit: (opt.crit || 0) + skill.critUp };
    return baseCalc.call(this, att, def, skill, opt);
  };
}
// ---------- 화면 ----------
if (typeof UI !== 'undefined') {
  UI.skillGrowShow = function (id) {
    const sk = skillById(id); const due = G.skillGrowDue(id); if (!sk || !due) return this.processQueue();
    const opts = G.skillGrowOpts(id); const cur = G.skillPathText(id);
    this.modal(`<div class="eyebrow">${due.evo ? '스킬 각성 · 진화' : `스킬 성장 · Lv${due.lv}`}</div><h3>${sk.name}</h3>
      <p class="dim small">${due.evo ? '한계를 넘어섰다. 어느 쪽으로 진화할까? 한 번 고르면 바꿀 수 없다.' : '숙련이 올랐다. 이번에는 어떻게 키울까?'}${cur ? ` (지금까지: ${cur})` : ''}</p>
      <div class="cards">${opts.map((o) => `<button class="choice-btn" data-act="sg-pick" data-v="${id}|${o.k}"><b>${o.name}</b><span class="small dim">${o.desc}</span></button>`).join('')}</div>
      <div class="row end"><button class="ghost" data-act="modal-close">나중에 정한다</button></div>`, 'event-box');
  };
  const baseQ = UI.processQueue;
  UI.processQueue = function () {
    if (this.modalOpen && this.modalOpen()) return baseQ.call(this);
    const q = G.queue && G.queue[0];
    if (q && q.type === 'skillGrow') {
      if (this.ctx && this.ctx.combat && !this.ctx.combat.result) return; // 전투 중에는 미룬다
      G.queue.shift(); return this.skillGrowShow(q.id);
    }
    return baseQ.call(this);
  };
  const baseSk = UI.skillsHtml;
  if (baseSk) UI.skillsHtml = function (...a) {
    const html = baseSk.apply(this, a);
    try {
      const d = document.createElement('div'); d.innerHTML = html;
      const rows = [...d.querySelectorAll('.item-row')];
      for (const id of G.player.skills || []) {
        if (id === 'strike') continue; const sk = skillById(id); if (!sk) continue;
        const btn = d.querySelector(`[data-act=toggle-skill][data-v="${id}"]`); const row = btn ? btn.closest('.item-row') : rows.find((r) => { const b = r.querySelector('b'); return b && b.textContent === sk.name; });
        if (!row) continue;
        const due = G.skillGrowDue(id); const txt = G.skillPathText(id); const eff = G.skillEff(sk);
        // 진화로 종류가 바뀌었으면 종류 태그와 이름도 바꾼다
        if (eff.type !== sk.type) { const t = [...row.querySelectorAll('.tag')].find((x) => x.textContent === (TYPE_NAME[sk.type] || '특수')); if (t) t.textContent = TYPE_NAME[eff.type] || (eff.type === 'heal_all' ? '아군 전체' : t.textContent); }
        const nm = row.querySelector('.grow > b'); if (nm && eff.evo) nm.textContent = eff.name;
        const grow = row.querySelector('.grow'); if (!grow || (!txt && !due)) continue;
        grow.insertAdjacentHTML('beforeend', `<div class="sg-line">${txt ? `<span class="small sg-path">성장 · ${txt}</span>` : ''}${due ? `<button class="sm primary sg-btn" data-act="sg-open" data-v="${id}">${due.evo ? '진화 선택' : '성장 선택'}</button>` : ''}</div>`);
      }
      return d.innerHTML;
    } catch (e) { return html; }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'sg-open') return this.skillGrowShow(v);
    if (act === 'sg-pick') { const [id, k] = String(v).split('|'); const msg = G.skillGrowPick(id, k); this.closeModal(); if (msg) this.toast(msg); if (G.skillGrowDue(id)) return this.skillGrowShow(id); return this.processQueue(); }
    return baseHandle.call(this, act, v);
  };
}
