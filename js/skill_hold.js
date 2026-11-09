// ===== 게이트 크로니클: 스킬을 길게 누르면 스킬 정보 (영역 A, 사용자 요청) =====
// 전투의 스킬 버튼(내 스킬 목록·동료 오더 목록)을 0.45초 이상 누르고 있으면 정보 카드가 뜬다.
// 길게 누른 뒤 손을 떼도 스킬은 나가지 않는다. 카드는 아무 데나 누르면 닫힌다.

Object.assign(UI, {
  skillHoldHtml(sk, u) {
    const col = sk.elem && sk.elem !== 'self' ? elemColor(sk.elem) : '#9aa6b8';
    const e = sk.elem === 'self' ? u && u.elem : sk.elem;
    const aim = (typeof orderAimOf === 'function' ? orderAimOf(sk) : SKILL_AIM[sk.type]) || 'none';
    const aimTxt = { enemy: '적 하나', ally: '아군 하나', none: ['aoe', 'debuff'].includes(sk.type) ? '적 전체' : ['heal_all', 'shield_all', 'buff_all'].includes(sk.type) ? '아군 전체' : '자신' }[aim] || '자신';
    const st = e && typeof ELEM_STATUS !== 'undefined' && ELEM_STATUS[e] && STATUS_FX[ELEM_STATUS[e]];
    const reacts = e && typeof ELEM_REACT !== 'undefined' ? ELEM_REACT.filter((r) => r.elem === e) : [];
    const rows = [
      ['종류', `${TYPE_NAME[sk.type] || sk.type}`],
      ['효과', SKILL_EFFECT[sk.type] || '-'],
      sk.power && !['taunt', 'evade', 'summon'].includes(sk.type) ? ['위력', `${Math.round(sk.power * 100)}%`] : null,
      ['대상', aimTxt],
      ['소모', `MP ${sk.mp}${u ? ` <span class="${sk.mp > u.mp ? 'bad' : 'dim'}">(남은 ${Math.round(u.mp)})</span>` : ''}`],
      e && ELEMENTS[e] ? ['속성', `${FX.elemIcon(e, 13)} ${ELEMENTS[e].name}${typeof elemVsText === 'function' ? ` <span class="dim small">${elemVsText(e)}</span>` : ''}`] : null,
      st ? ['상태 이상', `${st.name} <span class="dim small">(맞히면 ${sk.id === 'strike' ? '10' : '32'}% 확률)</span>`] : null,
      reacts.length ? ['원소 반응', reacts.map((r) => `<b style="color:${r.color}">${r.name}</b> <span class="dim small">(${r.need.map((k) => STATUS_FX[k].name).join('·')}인 적)</span>`).join('<br>')] : null,
    ].filter(Boolean);
    return `<div class="skill-hold" style="--c:${col}">
      <div class="sh-head">${FX.elemIcon(e, 20)}<b>${sk.name}</b>${u ? `<span class="small dim">${u.name}</span>` : ''}</div>
      ${sk.desc ? `<p class="small">${sk.desc}</p>` : ''}
      <table class="sh-table">${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>
      <div class="small dim sh-tip">아무 곳이나 누르면 닫힙니다.</div></div>`;
  },
  showSkillHold(btn) {
    const c = this.ctx; if (!c || !c.combat) return false;
    const cb = c.combat; const id = btn.dataset.v;
    const u = btn.dataset.act === 'o-skill' ? cb.units.find((x) => x.id === c.orderFor) : cb.player;
    const sk = (u && cb.skillsOf(u).find((s) => s.id === id)) || skillById(id);
    if (!sk) return false;
    this.hideSkillHold();
    const host = document.body;
    host.insertAdjacentHTML('beforeend', `<div class="skill-hold-wrap" id="skill-hold">${fixJosa(this.skillHoldHtml(sk, u))}</div>`);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* 무시 */ }
    return true;
  },
  hideSkillHold() { const el = document.getElementById('skill-hold'); if (el) el.remove(); },
});

{
  const HOLD_MS = 450;
  let timer = 0, start = null, fired = false;
  const clear = () => { clearTimeout(timer); timer = 0; start = null; };
  document.addEventListener('pointerdown', (e) => {
    // 정보 카드가 떠 있으면 이번 누름은 닫기만
    if (document.getElementById('skill-hold')) { UI.hideSkillHold(); fired = true; return; }
    const btn = e.target.closest && e.target.closest('.skill-btn[data-act=c-skill], .skill-btn[data-act=o-skill]');
    if (!btn) return;
    fired = false; start = [e.clientX, e.clientY];
    timer = setTimeout(() => { timer = 0; if (UI.showSkillHold(btn)) fired = true; }, HOLD_MS);
  }, true);
  document.addEventListener('pointermove', (e) => { if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 12) clear(); }, true);
  document.addEventListener('pointerup', clear, true);
  document.addEventListener('pointercancel', clear, true);
  // 길게 눌렀거나 카드를 닫은 누름은 클릭으로 치지 않는다
  document.addEventListener('click', (e) => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  // 길게 누를 때 뜨는 브라우저 메뉴(문맥 메뉴·텍스트 선택) 막기
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.skill-btn')) e.preventDefault(); }, true);
  // 전투 화면이 바뀌면 닫는다
  const baseClose = UI.closeModal;
  UI.closeModal = function (...a) { UI.hideSkillHold(); return baseClose.apply(this, a); };
}
