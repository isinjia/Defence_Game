// 기절·약점 파괴의 남은 행동 불가 횟수를 양 진영에 같은 방식으로 표시한다.
// 전투 규칙과 약점 파괴의 추가 피해 판정은 유지한다.
(() => {
  const base = UI.drawBreaks;
  UI.drawBreaks = function (...args) {
    const result = base.apply(this, args);
    const c = this.ctx;
    if (!c?.combat?.units) return result;
    for (const u of c.combat.units) {
      const el = document.getElementById('u-' + u.id); if (!el) continue;
      // 약점 파괴·회복은 기존 연출 이벤트의 표시 시점을 따른다.
      const broken = !!c.dispBrk?.[u.id]?.groggy;
      const turns = u.alive && !u.fled ? Math.max(0, Math.ceil(u.stun || 0), broken ? 1 : 0) : 0;
      el.classList.toggle('groggy', turns > 0);
      let tag = el.querySelector('.grg-tag');
      if (!turns) { if (tag) tag.remove(); continue; }
      const host = el.querySelector('.fx-host'); if (!host) continue;
      if (!tag) { tag = document.createElement('span'); tag.className = 'grg-tag'; host.append(tag); }
      const text = `그로기${turns}`;
      if (tag.textContent !== text) tag.textContent = text;
      tag.title = `자신의 행동 차례 ${turns}회 후 해제`;
      tag.setAttribute('aria-label', `그로기, 자신의 행동 차례 ${turns}회 후 해제`);
      // 상태 칸과 그림 위에 같은 상태를 중복 표시하지 않는다.
      for (const old of el.querySelectorAll('.status .tag')) if (old.textContent === '기절') old.remove();
    }
    return result;
  };
})();
