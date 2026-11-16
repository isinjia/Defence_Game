// ===== 파티원의 도주 제안 (영역 C·사용자 지적) =====
// polish.js 의 '도주할까요?' 확인 창보다 먼저 리더가 정하도록 빌드 목록 맨 뒤에 둔다.
// 파티원은 도주를 마음대로 고를 수 없다(사용자 지적): NPC 리더가 같은 전투에 있으면 "도주"는 "도주 제안"이 되고, 리더가 정한다.
// 게이트 안(전투 도주·층 철수)과 게이트 밖 전투 모두 여기서 정한다. leader_rule.js 의 철수 제안 규칙(층마다 1번)은 거치지 않는다.
if (typeof UI !== 'undefined') {
  const fleeLeader = () => {
    const c = UI.ctx; const cb = c && c.combat; if (!cb || cb.result) return null;
    const L = (UI.councilLeader && UI.councilLeader()) || (G.crew && G.crew() && G.crewLeader && G.crewLeader());
    if (!L || L.id === G.player.id) return null;
    return cb.units.some((u) => u.id === 'npc' + L.id && u.alive) ? L : null;
  };
  const T = {
    yes: { just: '…좋다. 빠진다. 다들 물러나!', kind: '맞아요, 무리하지 말아요. 빠져요!', cold: '빠진다.', warlike: '쳇. 알았다, 물러난다.', greedy: '손해 보기 전에 빠지자.' },
    no: { just: '아직 버틸 만하다. 계속 싸운다.', kind: '조금만 더 버텨 봐요. 위험하면 제가 먼저 말할게요.', cold: '아직.', warlike: '도망은 없다. 끝까지 간다.', greedy: '여기서 빠지면 남는 게 없어.' },
  };
  const col = (L) => (typeof voiceCol === 'function' ? voiceCol(L) : 'just');
  // 제안 횟수(사용자 결정): 게이트 안에서는 도주·철수 제안을 합쳐 게이트당 3번. 게이트 밖 전투는 전투마다 1번.
  const MAX_GATE = 3;
  const RET = {
    yes: { just: '…그래, 여기까지다. 철수한다.', kind: '맞아요, 무리하지 말아요. 돌아가요.', cold: '철수.', warlike: '쳇. 알았다, 물러난다.', greedy: '손해 보기 전에 빠지자.' },
    no: { just: '아직이다. 더 간다.', kind: '조금만 더 가 봐요. 위험하면 바로 뺄게요.', cold: '아직.', warlike: '벌써? 이제 시작인데.', greedy: '여기서 나가면 남는 게 없어.' },
  };
  const gateLeader = () => { const c = UI.ctx; if (!c || c.kind !== 'gate') return null; const L = UI.councilLeader && UI.councilLeader(); return L && L.id !== G.player.id ? L : null; };
  const ask = (ui, L, budget, hpBase, lines, why) => {
    if (budget.left <= 0) { ui.toast(`${L.name}에게 ${budget.gate ? '이번 게이트에서 제안할 수 있는 3번을 다 썼다' : '이미 물어봤다'}. 이제 리더가 정한다.`); return false; }
    budget.left--;
    const ok = RNG.chance(Math.max(0.05, Math.min(0.95, hpBase + (L.personality === 'kind' ? 0.15 : L.personality === 'warlike' ? -0.25 : L.personality === 'cold' ? -0.1 : 0) + (L.relation || 0) / 300)));
    const left = budget.gate ? ` (남은 제안 ${budget.left}번)` : '';
    if (!ok) { G.changeRel(L, -1, why); ui.toast(`${L.name}: "${lines.no[col(L)] || lines.no.just}"${left}`); return false; }
    ui.toast(`${L.name}: "${lines.yes[col(L)] || lines.yes.just}"`); return true;
  };
  const hpBase = (lo, mid, hi) => { const hp = G.player.maxHp ? G.player.hp / G.player.maxHp : 1; return hp < 0.35 ? lo : hp < 0.6 ? mid : hi; };
  const gateBudget = (c) => { const o = c.run || c; if (o.leadAsks == null) o.leadAsks = MAX_GATE; return { gate: true, get left() { return o.leadAsks; }, set left(v) { o.leadAsks = v; } }; };
  const pass = (ui, act, v) => { const was = ui._leadRetreat, wf = ui._fleeOk; ui._leadRetreat = true; ui._fleeOk = true; try { return baseH.call(ui, act, v); } finally { ui._leadRetreat = was; ui._fleeOk = wf; } };
  const baseH = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'c-flee') {
      const L = fleeLeader(); const c = this.ctx; const cb = c && c.combat;
      if (L && cb) {
        if (!cb.leadFleeOk) {
          const budget = c.kind === 'gate' ? gateBudget(c) : { gate: false, get left() { return cb.fleeAsked ? 0 : 1; }, set left(v) { cb.fleeAsked = true; } };
          if (!ask(this, L, budget, hpBase(0.75, 0.4, 0.15), T, '전투 중 도망치자고 했다')) return;
          cb.leadFleeOk = true;
        }
        return pass(this, act, v); // 리더가 허락했으면 확인 창 없이, 게이트 철수 규칙도 다시 묻지 않게
      }
    }
    if (act === 'g-leave' && !this._leadRetreat) {
      const L = gateLeader(); const c = this.ctx;
      if (L && c) {
        if (!ask(this, L, gateBudget(c), hpBase(0.8, 0.45, 0.2), RET, '철수하자고 했다')) return;
        return pass(this, act, v);
      }
    }
    return baseH.call(this, act, v);
  };
  // 버튼 글자: 리더가 있으면 "도주 제안"
  const relabel = () => { if (!fleeLeader()) return; for (const b of document.querySelectorAll('#modal-box [data-act="c-flee"]')) { const s = b.querySelector('span'); if (s && s.textContent === '도주') s.textContent = '도주 제안'; else if (!s && b.textContent.trim() === '도주') b.textContent = '도주 제안'; b.setAttribute('aria-label', '도주 제안'); b.title = '도주 제안 (리더가 정한다)'; } };
  for (const k of ['commandMenu', 'renderControls']) if (UI[k]) { const base = UI[k]; UI[k] = function (...a) { const r = base.apply(this, a); try { relabel(); } catch (e) { /* 무시 */ } return r; }; }
}
