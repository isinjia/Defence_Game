// ===== 팝업 고정 크기 (사용자 요청: 글 줄 수에 따라 창 크기가 바뀌면 안 된다) =====
// - 사건 창(event-box): 화면 기준 고정 높이. 글이 길면 창 안에서 스크롤.
// - 정보 팝업(skill-hold: 기술·아이템·유닛·상태 설명): 고정 높이, 단추 줄은 아래에 붙는다.
if (typeof document !== 'undefined' && !document.getElementById('popup-size-css')) {
  const st = document.createElement('style'); st.id = 'popup-size-css';
  st.textContent = `.modal-box.event-box{height:min(600px,100%);max-height:100%;overflow:auto}
.skill-hold{height:min(320px,calc(100vh - 32px));display:flex;flex-direction:column;overflow:auto}
.skill-hold > .sh-tip, .skill-hold > .row.end{margin-top:auto}`;
  document.head.appendChild(st);
}
