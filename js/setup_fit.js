// 이야기 시작 전 "당신은 누구입니까" 화면 — 스크롤 없이 한 화면에 (영역 B, 사용자 요청)
// 세로 화면에서: 위는 초상과 그 아래 한 줄 외형 바꾸기 단추, 아래는 이름·성별·체형·피부색을
// 한 줄씩(제목은 왼쪽, 고르는 단추는 오른쪽), 맨 아래 [뒤로][이야기 시작]. 피부색은 이름 대신 색 동그라미.
// 화면 구성은 css/setup_fit.css. 가로·넓은 화면은 기존 두 칸 배치를 그대로 쓴다.
{
  const baseSetup = UI.renderStorySetup;
  if (baseSetup) UI.renderStorySetup = function (...a) {
    const r = baseSetup.apply(this, a);
    try {
      const c = document.querySelector('#app .create'); if (!c) return r;
      c.classList.add('ps-fit');
      // 피부색 단추: 글자는 숨기고(색 동그라미만) 이름은 길게 누르면·읽기 도구로 알 수 있게
      for (const b of c.querySelectorAll('[data-act="appearance-skin"]')) { const t = b.textContent.trim(); b.setAttribute('aria-label', '피부색 ' + t); b.title = t; }
      // 지금 고른 피부색 이름은 제목 옆에
      const sel = c.querySelector('[data-act="appearance-skin"].sel'); const st = sel && sel.closest('.sec') && sel.closest('.sec').querySelector('.sec-title');
      if (st && !st.querySelector('.ps-cur')) st.insertAdjacentHTML('beforeend', `<span class="ps-cur">${sel.textContent.trim()}</span>`);
      // 아래 단추 줄은 양식 밖(화면 맨 아래)으로
      const acts = c.querySelector('.create-grid .row.end'); if (acts) { acts.classList.add('ps-actions'); c.appendChild(acts); }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
