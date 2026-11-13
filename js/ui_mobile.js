// 화면·조작 다듬기 (영역 B): 모바일에서 전투 한 턴을 한 번에 누를 수 있게
// - 조작 영역은 CSS로 전투 상자 아래에 고정 (style.css "전투 조작 하단 고정")
// - 대상을 이미 골라 두었거나 적이 하나뿐이면 스킬을 누르는 즉시 발동
{
  // 지금 누르면 바로 나갈 수 있는 적 대상 (없으면 null)
  UI.rememberedFoe = function () {
    const c = this.ctx; if (!c || !c.combat) return null; const cb = c.combat;
    if (cb.target && cb.target.alive && cb.target.side === 'enemy') return cb.target;
    const foes = cb.units.filter((u) => u.side === 'enemy' && u.alive && !u.fled);
    return foes.length === 1 ? foes[0] : null;
  };
  // 첫 조작 안내(자격 시험 첫 구역) 중에는 설명 → 대상 순서를 그대로 둔다
  UI.quickFireOk = function () {
    const c = this.ctx; if (!c || !c.combat) return false; const cb = c.combat;
    if (c.tutorial && !c.tutorial.boss && c.tutorial.acted < 1) return false;
    return cb.waiting && !c.playing && !cb.auto && !cb.result;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'c-skill' && this.quickFireOk()) {
      const c = this.ctx; const p = c.combat.player;
      const sk = G.skillEff ? G.skillEff(skillById(v)) : skillById(v);
      const aim = SKILL_AIM[sk.type] || 'none';
      if (sk.mp <= p.mp) {
        if (aim === 'enemy') { const t = this.rememberedFoe(); if (t) { c.sel = v; return this.fireSkill(t.id); } }
        else if (aim === 'none') { c.sel = v; return this.fireSkill(null); }
      }
    }
    return baseHandle.call(this, act, v);
  };

  UI.coachTarget = function (label) {
    const c = this.ctx; const box = document.getElementById('cb-ctrl'); if (!box || !c) return null;
    if (/1\/3/.test(label)) return document.getElementById('foes');
    if (/2\/3/.test(label)) return c.sel ? document.getElementById('foes') : (box.querySelector('.cmd-main') || box.querySelector('.skill-btns'));
    if (/3\/3/.test(label)) return document.querySelector('#modal-box .cb-tools') || box.querySelector('.ctrl-row');
    return null;
  };
  // 조작 안내는 레이아웃에 박지 않고 떠 있는 말풍선으로 (분담표 4-2). 실제 그리기는 아래 coachPop.
  UI.liftCoach = function () {
    const box = document.getElementById('cb-ctrl'); if (!box) return;
    const coach = box.querySelector('.coach'); if (coach) coach.remove();
    const c = this.ctx;
    if (!coach || !c || !c.combat || c.combat.result) return this.coachPop(null);
    const label = (coach.querySelector('.eyebrow') || coach).textContent;
    const cb = c.combat;
    const myTurn = cb.waiting && !c.playing && (!cb.auto || !!c.tutorial); // 시험 안내는 자동 전투 중에도 띄운다 (tut_pause.js 가 멈춘다)
    // 1/3(게이지 설명)은 시간이 흐를 때도, 나머지는 내 차례(시간 정지)에만
    if (!myTurn && !/1\/3/.test(label)) return this.coachPop(null);
    this._coachLabel = label;
    const target = this.coachTarget(label);
    this.coachPop(coach, target, label + '|' + (c.sel || ''));
  };

  // 안내 문구: 대상이 기억돼 있으면 한 번에 발동된다는 것을 알려 준다
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    baseControls.call(this);
    this.liftCoach();
    const c = this.ctx;
    const box = document.getElementById('cb-ctrl');
    if (box && c && c.combat) box.classList.toggle('cb-done', !!c.combat.result && !c.playing); // 결과 화면은 고정 풀기 (길어질 수 있음)
    if (!c || !c.combat || c.combat.result || c.sel || !this.quickFireOk()) return;
    const hint = document.querySelector('#cb-ctrl .cb-hint'); if (!hint) return;
    const t = this.rememberedFoe();
    hint.innerHTML = t
      ? fixJosa(`<b class="amber">내 차례!</b> 스킬을 누르면 <b>${t.name}</b>에게 바로 발동. 대상을 바꾸려면 적을 먼저 누르세요.`)
      : '<b class="amber">내 차례!</b> 적을 눌러 대상을 정한 뒤 스킬을 누르세요. (스킬 먼저 눌러도 됩니다)';
  };
}

// 첫 안내(판정 결과) 창 줄이기: 등급·직업·속성 한 줄 + 한 문장 요약, 상세는 펼치기
{
  const baseJudge = UI.judgmentHtml;
  if (baseJudge) UI.judgmentHtml = function () {
    const p = G.player; const k = classById(p.cls); const g = CLASS_GROUPS[k.g]; const R = RANKS[p.rankIdx];
    const E = ELEMENTS[p.element]; const negIds = ['cursed', 'frail', 'slow_learner', 'reckless'];
    const neg = p.traits.filter((id) => negIds.includes(id)).length, pos = p.traits.length - neg;
    const tone = !p.traits.length ? '특별한 체질은 없다' : neg === 0 ? '타고난 장점이 있다' : pos === 0 ? '약점을 안고 시작한다' : '장점과 약점을 함께 지녔다';
    const full = baseJudge.call(this);
    // 원래 내용(출신·직업 상세·특성)은 펼치기 안으로
    const detail = full.replace(/^[\s\S]*?<\/h2>/, '');
    return `<div class="eyebrow">국가 각성자 관리국 · 판정 결과</div><h2>헌터 ${p.name}</h2>
      <div class="judge-line">${this.rankTag(p.rankIdx)} <span class="tag cls" style="--c:${g.color}">${k.name}</span> ${this.elemTag(p.element)}</div>
      <p class="judge-sum">${g.name} ${k.name}, ${E.name} 속성. ${tone}. <span class="dim">(${R.key}급 · 협회 실기 시험 후 측정)</span></p>
      <details class="judge-more"><summary>직업 · 특성 자세히</summary>${detail}</details>`;
  };
}

// 지도 패널 접기 (중2): 인물 카드(초상을 누르면 체력·정신 막대만), "현재 상황"(접기 단추). 접힘은 기기에 기억.
{
  const KEY = 'gc_fold_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const save = (o) => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* 무시 */ } };
  UI.fold = load();
  UI.applyFold = function () {
    const w = document.getElementById('world'); if (!w) return;
    w.classList.toggle('fold-card', !!this.fold.card);
    w.classList.toggle('fold-obj', !!this.fold.obj);
    const por = document.querySelector('#hud-card .card-portrait');
    if (por) { por.dataset.act = 'sheet'; por.dataset.v = 'char'; por.setAttribute('aria-label', '캐릭터 정보 열기'); }
    const tr = document.getElementById('hud-tr');
    if (tr && tr.children.length && !tr.querySelector('.fold-obj-btn')) tr.insertAdjacentHTML('afterbegin', `<button class="fold-obj-btn" data-act="fold-obj" aria-label="현재 상황 접기·펼치기">${this.fold.obj ? '▸' : '▾'}</button>`);
  };
  const baseRender = UI.renderGame;
  UI.renderGame = function (...a) { const r = baseRender.apply(this, a); try { this.applyFold(); } catch (e) { /* 무시 */ } return r; };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'fold-card' || act === 'fold-obj') {
      const k = act === 'fold-card' ? 'card' : 'obj';
      this.fold[k] = !this.fold[k]; save(this.fold);
      return this.renderGame();
    }
    return baseHandle.call(this, act, v);
  };
}

// 가로 화면(높이 낮음)은 세로로 돌려 달라는 안내 (상3)
{
  const el = document.createElement('div'); el.className = 'rotate-hint';
  el.innerHTML = '<div><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg><b>세로로 돌려 주세요</b><span class="small dim">게이트 크로니클은 세로 화면에 맞춰져 있습니다.</span></div>';
  document.body.appendChild(el);
}

// ---------- 떠 있는 안내 말풍선 (전투 조작 안내, 게이트 탐색 리더 대사) ----------
{
  UI._coachShut = null; // 닫은 안내의 열쇠 (같은 안내는 다시 띄우지 않음, 다음 단계에서 다시)
  UI.coachPop = function (node, target, key) {
    let pop = document.getElementById('coach-pop');
    for (const el of document.querySelectorAll('.coach-spot')) if (el !== target) el.classList.remove('coach-spot');
    if (!node || (key && this._coachShut === key)) { if (pop) pop.remove(); if (!node && target) target.classList.remove('coach-spot'); return; }
    if (!pop) { pop = document.createElement('div'); pop.id = 'coach-pop'; pop.setAttribute('role', 'status'); document.body.appendChild(pop); }
    const same = pop._key === (key || '') && pop.childElementCount;
    pop._key = key || '';
    pop.innerHTML = '';
    pop.style.animation = same ? 'none' : '';
    node.classList.add('coach-card'); pop.appendChild(node);
    pop.insertAdjacentHTML('beforeend', '<span class="coach-close small dim">눌러서 닫기</span><i class="coach-arrow"></i>');
    pop.onclick = () => { this._coachShut = pop._key; pop.remove(); for (const el of document.querySelectorAll('.coach-spot')) el.classList.remove('coach-spot'); };
    // 위치: 대상이 화면 아래쪽이면 말풍선은 대상 위에, 위쪽이면 대상 아래에
    const vh = window.innerHeight, vw = window.innerWidth;
    pop.className = '';
    if (target) {
      target.classList.add('coach-spot');
      const r = target.getBoundingClientRect();
      const ph = pop.offsetHeight || 90;
      const below = r.top + r.height / 2 < vh / 2;
      const top = below ? Math.min(vh - ph - 8, r.bottom + 12) : Math.max(8, r.top - ph - 12);
      pop.style.top = top + 'px'; pop.style.bottom = '';
      pop.classList.add(below ? 'arrow-up' : 'arrow-down');
      const ax = Math.max(24, Math.min(vw - 24, r.left + r.width / 2));
      const pr = pop.getBoundingClientRect();
      pop.querySelector('.coach-arrow').style.left = Math.max(14, Math.min(pr.width - 14, ax - pr.left)) + 'px';
    } else { pop.style.top = 'calc(12px + env(safe-area-inset-top, 0px))'; pop.style.bottom = ''; }
  };
  // 전투가 끝나거나 창이 바뀌면 말풍선 정리
  const clear = () => { const p = document.getElementById('coach-pop'); if (p) p.remove(); for (const el of document.querySelectorAll('.coach-spot')) el.classList.remove('coach-spot'); };
  const baseClose = UI.closeModal;
  UI.closeModal = function (...a) { clear(); return baseClose.apply(this, a); };
  const baseModal = UI.modal;
  UI.modal = function (html, cls = '', ...a) {
    clear();
    const r = baseModal.call(this, html, cls, ...a);
    // 게이트 탐색 리더 대사도 같은 말풍선으로
    try {
      const box = document.getElementById('modal-box');
      const lead = box && !String(cls).includes('combat-box') && box.querySelector('.coach.lead-say');
      if (lead) { lead.remove(); this.coachPop(lead, null, 'lead:' + lead.textContent.slice(0, 40)); }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
