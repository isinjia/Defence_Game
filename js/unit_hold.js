// ===== 게이트 크로니클: 전투 입력 다듬기 (영역 A, 사용자 요청) =====
// 1. 내 차례가 아닐 때는 공격·스킬·아이템·방어가 잠겨 보인다(전에는 눌리는 것처럼 보였지만 실제로는 나가지 않았다).
// 2. 아군·적을 길게 누르면 상세 정보 카드. 괴수 정보는 도감 단계(잡은 수)만큼만 보인다.

// ---------- 1. 차례 잠금 ----------
{
  const offTurn = (c) => c && c.combat && c.combat.units && !c.combat.result && !c.orderFor && (!c.combat.waiting || c.combat.auto);
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try {
      const c = this.ctx; const box = document.getElementById('cb-ctrl'); if (!box || !c || !c.combat) return r;
      const wrap = box.querySelector(':scope > .cmd-wrap:not(.order-cmd)'); if (!wrap) return r;
      const off = offTurn(c);
      wrap.classList.toggle('cmd-wait', !!off);
      let chip = wrap.querySelector(':scope > .turn-wait');
      if (!off) { if (chip) chip.remove(); return r; }
      // 열려 있던 스킬·아이템 목록은 닫는다
      if (c.cmd) { c.cmd = null; const pop = wrap.querySelector('.cmd-pop'); if (pop) pop.remove(); for (const b of wrap.querySelectorAll('.cmd.sel')) b.classList.remove('sel'); }
      c.sel = null;
      for (const b of wrap.querySelectorAll('.cmd-main .cmd')) { b.disabled = true; b.classList.remove('sel'); }
      const text = c.combat.auto ? '자동 전투 중' : c.playing ? '행동 중…' : '차례 대기 중 · 행동 게이지가 차면 내 차례';
      if (!chip) { wrap.insertAdjacentHTML('beforeend', '<span class="turn-wait"></span>'); chip = wrap.querySelector(':scope > .turn-wait'); }
      if (chip.textContent !== text) chip.textContent = text;
    } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ }
    return r;
  };
  // 차례가 아니면 입력도 받지 않는다
  const LOCKED = ['c-skill', 'c-cmd', 'c-item', 'c-defend', 'c-use'];
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (LOCKED.includes(act) && offTurn(this.ctx)) return;
    return baseHandle.call(this, act, v);
  };
}

// ---------- 2. 아군·적 길게 누르기 ----------
Object.assign(UI, {
  unitHoldHtml(u) {
    const c = this.ctx; const cb = c.combat; const p = cb.player;
    const row = (k, v) => (v == null || v === '' ? '' : `<tr><th>${k}</th><td>${v}</td></tr>`);
    const pct = (a, b) => `${Math.max(0, Math.round(a))} / ${Math.round(b)}`;
    const stats = [];
    const st = u.st ? Object.keys(u.st).filter((k) => u.st[k] && u.st[k].t > 0 && typeof STATUS_FX !== 'undefined' && STATUS_FX[k]).map((k) => `<b style="color:${STATUS_FX[k].color}">${STATUS_FX[k].name}</b> ${u.st[k].t}턴`) : [];
    if (u.poison > 0 || (u.dot && u.dot.t > 0)) st.push('<b style="color:#9be06a">중독</b>');
    if (u.stun > 0) st.push('<b style="color:#ffd84d">기절</b>');
    const bf = [];
    if (u.buffs) {
      if (u.buffs.atk > 0 && u.buffs.atkT > 0) bf.push(`공격 +${Math.round(u.buffs.atk * 100)}% (${u.buffs.atkT}턴)`);
      if (u.buffs.def > 0 && u.buffs.defT > 0) bf.push(`방어 +${Math.round(u.buffs.def * 100)}% (${u.buffs.defT}턴)`);
      if (u.buffs.def < 0 && u.buffs.defT > 0) bf.push(`<span class="bad">방어 ${Math.round(u.buffs.def * 100)}% (${u.buffs.defT}턴)</span>`);
    }
    if (u.evadeT > 0) bf.push(`회피 태세 (${u.evadeT}턴)`);
    if (u.tauntT > 0) bf.push(`도발 (${u.tauntT}턴)`);
    const elemTxt = u.elem && ELEMENTS[u.elem] ? `${FX.elemIcon(u.elem, 13)} ${ELEMENTS[u.elem].name}` : '무속성';
    let head, body, col = u.elem && ELEMENTS[u.elem] ? elemColor(u.elem) : '#9aa6b8';

    if (u.side === 'enemy' && !u.npcId) {
      // 괴수: 도감 단계만큼 공개
      const base = u._tpl || String(u.name || '').replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, '');
      const step = u.summon ? 4 : (G.dexStep ? G.dexStep(base) : 4); // 도감 단계: 1(3마리)부터 능력치, 2(6마리)부터 기술. 속성·유형·상성은 전장에 이미 보이므로 늘 보여 준다
      const kills = G.dexKills ? G.dexKills(base) : 0;
      const T = typeof MON_TYPES !== 'undefined' && u.mtype ? MON_TYPES[u.mtype] : null; const T2 = typeof MON_TYPES !== 'undefined' && u.mtype2 ? MON_TYPES[u.mtype2] : null;
      const unk = '<span class="dim">알 수 없음</span>';
      const myE = p && (p.elem || p.affinity);
      const edge = myE && u.elem ? elemEdge(myE, u.elem) : 0;
      const weakTxt = u.elem && typeof elemVsText === 'function' ? `<span class="small">${elemVsText(u.elem)}</span>${edge ? `<br><b class="${edge > 0 ? 'good' : 'bad'}">내 속성으로 ${edge > 0 ? '유리 ▲' : '불리 ▼'}</b>` : ''}` : '';
      const skl = (u.skills || []).filter((id) => id !== 'strike').map((id) => skillById(id)).filter(Boolean);
      const sklTxt = step >= 2 ? (skl.length ? skl.map((s) => `${s.name} <span class="dim small">${TYPE_NAME[s.type] || ''}</span>`).join('<br>') : '기본 공격뿐') : `${unk} <span class="dim small">(6마리 잡으면 기록)</span>`;
      const nx = u.next && skillById(u.next.skill); const nt = u.next && u.next.target && cb.units.find((x) => x.id === u.next.target);
      const intent = u.alive && nx ? `${nx.id === 'strike' ? '공격' : nx.name}${nt ? ` → ${nt.name}` : ''}` : '';
      const brk = u.brk ? (u.brk.groggy ? '<b class="good">무력화됨</b>' : `${u.brk.cur} / ${u.brk.max}`) : '';
      head = `<div class="uh-art">${FX.monster({ name: u.name, elem: u.elem, shape: u.shape }, 64)}</div><div><b>${u.name}</b><div class="small dim">${u.boss ? '보스 · ' : u.elite ? '정예 · ' : ''}${RANKS[Math.min(7, u.tier || 0)].key}급 괴수${T ? ` · <span style="color:${T.color}">${T.name}</span>` : ''}${T2 ? ` + <span style="color:${T2.color}">${T2.name}</span>` : ''}</div></div>`;
      body = `${T ? `<p class="small">${T.desc}${T2 ? ' ' + T2.desc : ''}</p>` : ''}<table class="sh-table">
        ${row('체력', pct(u.hp, u.maxHp))}${row('속성', elemTxt)}${row('상성', weakTxt)}
        ${row('능력치', step >= 1 ? `공격 ${u.atk} · 방어 ${u.def} · 속도 ${Math.round(u.spd || 0)}` : `${unk} <span class="dim small">(3마리 잡으면 기록)</span>`)}
        ${row('기술', sklTxt)}${row('다음 행동', intent)}${row('약점 게이지', brk)}
        ${row('상태 이상', st.join(' · '))}${row('강화·약화', bf.join(' · '))}
        ${row('도감', u.summon ? '' : `${kills}마리 처치${G.dexBonus && G.dexBonus(base) ? ` · 이 괴수에게 피해 +${Math.round(G.dexBonus(base) * 100)}%` : ''}`)}</table>`;
    } else {
      // 사람 (아군·적 헌터)
      const n = u.npcId != null ? G.npcById(u.npcId) : null;
      const cls = u.cls ? classById(u.cls) : null; const grp = cls && CLASS_GROUPS[cls.g];
      const rank = u.isPlayer ? `${RANKS[G.player.rankIdx].key}급` : u.rankText || (n ? `${RANKS[n.rankIdx].key}급` : '');
      const art = u.summon ? FX.monster({ name: u.name, elem: u.elem, shape: u.shape }, 64) : this.unitSprite(u, 64);
      const ord = u.order && !u.order.vague && typeof orderLabel === 'function' ? orderLabel(u.order, cb) : '';
      const skl = (cb.skillsOf ? cb.skillsOf(u) : []).filter((s) => s.id !== 'strike');
      const ult = u.ult != null && typeof ULT_MAX !== 'undefined' ? `${Math.round(u.ult)} / ${ULT_MAX}` : '';
      if (grp) col = grp.color;
      head = `<div class="uh-art">${art}</div><div><b>${u.name}</b>${u.id === cb.leaderId ? ' <span class="tag tiny">리더</span>' : ''}<div class="small dim">${rank}${cls ? ` · <span style="color:${grp ? grp.color : 'inherit'}">${className(u.cls, u.clsAdv || 0)}</span>` : u.summon ? ' · 소환수' : ''}${u.side === 'enemy' ? ' · 적' : ''}</div></div>`;
      body = `<table class="sh-table">
        ${row('체력', pct(u.hp, u.maxHp))}${row('정신력', u.maxMp ? pct(u.mp, u.maxMp) : '')}${row('필살 게이지', ult)}
        ${row('능력치', `공격 ${u.atk} · 방어 ${u.def} · 속도 ${Math.round(u.spd || 0)}`)}
        ${row('속성', elemTxt)}${row('자리', u.side === 'ally' && u.row ? (u.row === 'front' ? '전열' : '후열') : '')}
        ${row('스킬', skl.length ? skl.map((s) => `${s.name} <span class="dim small">MP ${s.mp}</span>`).join(' · ') : '')}
        ${row('받은 오더', ord)}${row('상태 이상', st.join(' · '))}${row('강화·약화', bf.join(' · '))}
        ${n && !u.isPlayer ? row('사람', `${persById(n.personality).name} · 관계 ${relationLabel(n.relation)} (${n.relation})`) : ''}</table>`;
    }
    return `<div class="skill-hold unit-hold" style="--c:${col}"><div class="uh-head">${head}</div>${body}<div class="small dim sh-tip">아무 곳이나 누르면 닫힙니다.</div></div>`;
  },
  showUnitHold(el) {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return false;
    const u = c.combat.units.find((x) => 'u-' + x.id === el.id); if (!u) return false;
    this.hideSkillHold();
    document.body.insertAdjacentHTML('beforeend', `<div class="skill-hold-wrap" id="skill-hold">${fixJosa(this.unitHoldHtml(u))}</div>`);
    if (navigator.vibrate) try { navigator.vibrate(12); } catch (e) { /* 무시 */ }
    return true;
  },
});

{
  // 길게 누르기 (스킬 버튼과 같은 방식, js/skill_hold.js)
  const HOLD_MS = 450;
  let timer = 0, start = null, fired = false;
  const clear = () => { clearTimeout(timer); timer = 0; start = null; };
  document.addEventListener('pointerdown', (e) => {
    fired = false; // 길게 누른 뒤 클릭이 오지 않는 기기(터치)에서 다음 탭을 삼키지 않게
    if (document.getElementById('skill-hold')) return; // 닫기는 skill_hold.js가 처리
    const el = e.target.closest && e.target.closest('#stage .foe, #stage .ally');
    if (!el) return;
    start = [e.clientX, e.clientY];
    timer = setTimeout(() => { timer = 0; if (UI.showUnitHold(el)) fired = true; }, HOLD_MS);
  }, true);
  document.addEventListener('pointermove', (e) => { if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 12) clear(); }, true);
  document.addEventListener('pointerup', clear, true);
  document.addEventListener('pointercancel', clear, true);
  document.addEventListener('click', (e) => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('#stage .foe, #stage .ally')) e.preventDefault(); }, true);
}

// ---------- 3. 아이템을 지정한 대상에게 ----------
// 전에는 아이템이 언제나 나에게만 쓰였다. 이제 아이템을 고르면 아군(나 포함)을 눌러 쓸 대상을 정한다.
Object.assign(Combat.prototype, {
  playerItemOn(id, targetId) {
    if (!this.waiting || this.result) return;
    const g = this.game; const p = this.player;
    if (!g.player.items[id]) return;
    const it = CONSUMABLES.find((x) => x.id === id);
    if (!it || (it.effect !== 'hp' && it.effect !== 'mp')) return;
    const t = this.units.find((u) => u.id === targetId && u.side === 'ally' && u.alive) || p;
    g.player.items[id]--;
    const mul = 1 + g.mod('heal');
    if (t !== p) this.push(`${p.name}이(가) ${t.name}에게 ${it.name}을(를) 건넸다.`, 'heal', { k: 'note', dst: t.id });
    if (it.effect === 'hp') this.healUnit(t, t.maxHp * it.val * mul, p);
    else { const v = Math.round(t.maxMp * it.val * mul); t.mp = Math.min(t.maxMp, t.mp + v); this.push(`${it.name} 사용: ${t === p ? '' : t.name + '의 '}정신력 +${v}`, 'heal', { k: 'mp', dst: t.id, mp: t.mp }); }
    this.endPlayerTurn();
  },
});

{
  const aimable = (id) => { const it = CONSUMABLES.find((x) => x.id === id); return !!it && (it.effect === 'hp' || it.effect === 'mp'); };
  const clearAim = (c) => { if (c) c.itemSel = null; };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const c = this.ctx;
    // 차례가 끝났거나 전투가 끝나면 고르던 아이템은 취소
    if (c && c.itemSel && c.combat && (!c.combat.waiting || c.combat.result || c.combat.auto || c.orderFor || !G.player.items[c.itemSel])) c.itemSel = null;
    const r = baseControls.apply(this, a);
    try {
      const box = document.getElementById('cb-ctrl'); if (!box || !c || !c.combat) return r;
      const rows = document.querySelectorAll('#allies, #allies-front, #allies-back');
      const aiming = !!c.itemSel;
      if (aiming || !c.orderFor) for (const el of rows) if (!(c.sel && !aiming)) el.classList.toggle('aim', aiming);
      // 안내는 전장 맨 위 띠로 (아군 줄을 가리지 않게, 오더 띠와 같은 자리·모양)
      const st = document.getElementById('stage');
      if (st) st.querySelectorAll('.item-banner').forEach((e) => e.remove());
      if (!aiming) return r;
      const it = CONSUMABLES.find((x) => x.id === c.itemSel);
      const wrap = box.querySelector(':scope > .cmd-wrap'); if (!wrap) return r;
      if (st) st.insertAdjacentHTML('beforeend', `<div class="order-banner item-banner"><div class="row between"><b>${it.name} <span class="small dim">×${G.player.items[c.itemSel]}</span></b><span class="row"><span class="small dim">${it.effect === 'hp' ? `체력 ${Math.round(it.val * 100)}% 회복` : `정신력 ${Math.round(it.val * 100)}% 회복`}</span><button class="sm ghost" data-act="c-item-cancel">취소</button></span></div>
        <div class="small amber"><b>쓸 대상을 누르세요.</b> 나 또는 동료 (쓰러진 동료에게는 쓸 수 없다)</div></div>`);
      const ib = wrap.querySelector('.cmd-main [data-v=item]'); if (ib) ib.classList.add('sel');
    } catch (e) { /* 표시 실패는 전투를 막지 않는다 */ }
    return r;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    const c = this.ctx; const cb = c && c.combat;
    if (cb && cb.units && !cb.result) {
      if (act === 'c-item' && aimable(v)) {
        if (!cb.waiting || cb.auto || c.playing) return;
        if (!G.player.items[v]) return this.toast('가진 것이 없다.');
        c.itemSel = v; c.sel = null; c.cmd = null;
        return this.renderControls();
      }
      if (act === 'c-item-cancel') { clearAim(c); return this.renderControls(); }
      if (c.itemSel && act === 'c-ally') {
        if (!cb.waiting || c.playing) return;
        const t = cb.units.find((u) => u.id === v && u.side === 'ally');
        if (!t) return;
        if (!t.alive) return this.toast(`${t.name}은(는) 쓰러져 있어 쓸 수 없다.`);
        if (t.summon) return this.toast('소환수에게는 쓸 수 없다.');
        const id = c.itemSel; c.itemSel = null;
        return this.combatAction((x) => x.playerItemOn(id, t.id));
      }
      // 다른 행동을 고르면 아이템 지정은 취소
      if (c.itemSel && ['c-skill', 'c-cmd', 'c-defend', 'c-use', 'c-flee', 'c-auto', 'c-target'].includes(act)) { clearAim(c); if (act === 'c-target') return this.renderControls(); }
    }
    return baseHandle.call(this, act, v);
  };
}
