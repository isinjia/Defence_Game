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

  // 조작 안내 상자는 고정 조작 영역이 아니라 무대 위로 옮긴다 (조작 영역을 낮게 유지)
  UI.liftCoach = function () {
    const box = document.getElementById('cb-ctrl'); const stage = document.getElementById('stage'); if (!box || !stage) return;
    let host = document.getElementById('cb-coach');
    if (!host) { host = document.createElement('div'); host.id = 'cb-coach'; stage.parentNode.insertBefore(host, stage); }
    const coach = box.querySelector('.coach');
    host.innerHTML = '';
    if (coach) host.appendChild(coach);
  };

  // 안내 문구: 대상이 기억돼 있으면 한 번에 발동된다는 것을 알려 준다
  const baseControls = UI.renderControls;
  UI.renderControls = function () {
    baseControls.call(this);
    this.liftCoach();
    const c = this.ctx;
    const box = document.getElementById('cb-ctrl');
    if (box && c && c.combat) box.classList.toggle('cb-done', !!c.combat.result && !c.playing); // 결과 화면은 고정 풀기 (길어질 수 있음) if (!c || !c.combat || c.combat.result || c.sel || !this.quickFireOk()) return;
    const hint = document.querySelector('#cb-ctrl .cb-hint'); if (!hint) return;
    const t = this.rememberedFoe();
    hint.innerHTML = t
      ? fixJosa(`<b class="amber">내 차례!</b> 스킬을 누르면 <b>${t.name}</b>에게 바로 발동. 대상을 바꾸려면 적을 먼저 누르세요.`)
      : '<b class="amber">내 차례!</b> 적을 눌러 대상을 정한 뒤 스킬을 누르세요. (스킬 먼저 눌러도 됩니다)';
  };
}
