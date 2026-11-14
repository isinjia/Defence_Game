// ===== 장비 창 제목을 스킬 창처럼 '장비 · n/n' 한 줄로 (사용자 요청) =====
// gear_layout.js 가 만든 '장착 장비' + 오른쪽 'n / n' 을 합쳐 스킬 탭 제목(h3)과 같은 모양으로 바꾼다.
if (typeof UI !== 'undefined' && UI.sheetHtml) {
  const base = UI.sheetHtml;
  UI.sheetHtml = function (...a) {
    const html = base.apply(this, a);
    if (typeof html !== 'string') return html;
    return html.replace(/<div class="gl-heading"><h3>장착 장비<\/h3><span><b>(\d+)<\/b> \/ (\d+)<\/span><\/div>/, '<div class="gl-heading gl-heading-uni"><h3>장비 · $1/$2</h3></div>');
  };
  if (typeof document !== 'undefined' && !document.getElementById('title-uni-css')) {
    const st = document.createElement('style'); st.id = 'title-uni-css';
    st.textContent = '.gl-heading.gl-heading-uni h3{font-size:1.17em;font-weight:700}';
    document.head.appendChild(st);
  }
}
