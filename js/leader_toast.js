// 파티원으로 낸 제안의 리더 응답을 중앙에 표시한다. 제안 판정·작전 선택은 기존 핸들러에 맡긴다.
(() => {
  let timer = null;
  UI.showLeaderToast = function (leader, text, subject, detail = '') {
    cancelAnimationFrame(timer);
    document.getElementById('leader-reply-toast')?.remove();
    const box = document.createElement('aside'); box.id = 'leader-reply-toast';
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); box.setAttribute('aria-atomic', 'true');
    box.innerHTML = '<div class="lrt-card"><div class="lrt-face" aria-hidden="true"></div><div class="lrt-body"><div class="lrt-heading"><strong></strong><span></span></div><p></p><small></small></div><button type="button" aria-label="리더 응답 닫기">×</button></div>';
    box.querySelector('.lrt-face').innerHTML = this.npcAvatar(leader, 64);
    box.querySelector('strong').textContent = leader.name;
    box.querySelector('.lrt-heading span').textContent = `리더 · ${subject}`;
    box.querySelector('p').textContent = text;
    const sub = box.querySelector('small'); sub.textContent = detail; sub.hidden = !detail;
    const close = () => { cancelAnimationFrame(timer); box.remove(); };
    // 초상 준비 등으로 프레임이 늦어져도 읽기 전에 사라지지 않게, 실제 표시한 시간을 센다.
    const later = () => {
      cancelAnimationFrame(timer);
      const duration = Math.min(10000, Math.max(5000, (text.length + detail.length) * 90));
      let elapsed = 0, last = null;
      const tick = now => {
        if (!box.isConnected) return;
        if (last !== null && !document.hidden) elapsed += Math.min(100, Math.max(0, now - last));
        last = now;
        if (elapsed >= duration) close(); else timer = requestAnimationFrame(tick);
      };
      timer = requestAnimationFrame(tick);
    };
    box.querySelector('button').addEventListener('click', event => { event.stopPropagation(); close(); });
    box.addEventListener('mouseenter', () => cancelAnimationFrame(timer)); box.addEventListener('mouseleave', later);
    box.addEventListener('focusin', () => cancelAnimationFrame(timer)); box.addEventListener('focusout', later);
    box.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } });
    document.body.appendChild(box); later();
  };
  const leaderFor = (ui, act) => {
    const cb = ui.ctx?.combat;
    if (act === 'c-tactic') {
      if (!cb || ui.canSetTactic()) return null;
      const unit = cb.leader?.();
      return unit && (unit.npcId != null ? G.npcById(unit.npcId) : G.npcById(Number(String(unit.id).replace(/^npc/, ''))));
    }
    const L = ui.councilLeader?.() || (act === 'c-flee' && G.crew?.() && G.crewLeader?.());
    if (!L || L.id === G.player?.id) return null;
    if (act === 'c-flee' && (!cb || cb.result || !cb.units.some(u => u.id === 'npc' + L.id && u.alive))) return null;
    return L;
  };
  const base = UI.handle;
  UI.handle = function (act, ...args) {
    if (!['c-flee', 'g-leave', 'c-tactic'].includes(act)) return base.call(this, act, ...args);
    const leader = leaderFor(this, act);
    if (!leader) return base.call(this, act, ...args);
    const originalToast = this.toast;
    this.toast = (message, ...rest) => {
      const raw = String(message);
      if (!raw.startsWith(leader.name) && !raw.startsWith(`리더 ${leader.name}`)) return originalToast.call(this, message, ...rest);
      if (act === 'c-tactic') {
        const tactic = TACTICS[this.ctx.combat.tactic || 'balance'];
        const register = G.personaRegister?.(leader) || 'haera';
        const lines = {
          haera: `작전은 ${tactic.name}(으)로 간다.`, banmal: `작전은 ${tactic.name}(으)로 가자.`,
          short: `${tactic.name}. 이대로 간다.`, haeyo: `작전은 ${tactic.name}(으)로 갈게요.`,
          hapsyo: `작전은 ${tactic.name}(으)로 가겠습니다.`, hao: `작전은 ${tactic.name}(으)로 가겠소.`,
          hage: `작전은 ${tactic.name}(으)로 가세.`,
        };
        return this.showLeaderToast(leader, fixJosa(lines[register] || lines.haera), '현재 작전', tactic.desc);
      }
      const spoken = raw.match(/:\s*["“]([\s\S]*?)["”](.*)$/);
      return this.showLeaderToast(leader, spoken ? spoken[1] : raw, act === 'c-flee' ? '도주 제안' : '철수 제안', spoken?.[2]?.trim() || '');
    };
    try { return base.call(this, act, ...args); }
    finally { this.toast = originalToast; }
  };
})();
