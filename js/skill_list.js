// 스킬 탭은 습득 경로 구분 없이 보유 스킬과 장착 조작만 표시한다.
{
  const base = UI.skillsHtml;
  UI.skillsHtml = function (...args) {
    const root = document.createElement('div');
    root.innerHTML = base.apply(this, args);
    const panel = root.querySelector('.panel');
    if (!panel) return root.innerHTML;
    panel.querySelectorAll(':scope > p, .ep-list, .sg-line').forEach(el => el.remove());
    panel.querySelectorAll('.item-row').forEach(row => {
      const button = row.querySelector('[data-act="toggle-skill"]');
      if (!button) { row.remove(); return; } // 기본 공격은 자동 제공되므로 목록에서 숨긴다.
      const equipped = G.player.equipSkills.includes(button.dataset.v);
      button.textContent = equipped ? '장착 해제' : '장착';
      button.setAttribute('aria-pressed', String(equipped));
    });
    const heading = panel.querySelector('h3');
    if (heading) heading.textContent = `스킬 · ${G.player.equipSkills.length}/${G.skillSlots()}`;
    const cards = panel.querySelector('.cards');
    if (cards && !cards.children.length) cards.textContent = '보유한 스킬이 없습니다.';
    return root.innerHTML;
  };
}
