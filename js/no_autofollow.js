// ===== 게이트 크로니클: 파티원 결정에 시간제한 없음 (영역 A, 사용자 요청) =====
// 리더가 NPC일 때 [따른다]·[확인] 같은 버튼이 몇 초 뒤 저절로 눌리던 것(UI.autoFollow: council_exam·leader_rule·leader_explore·crew_time)을 없앤다.
// 플레이어가 직접 누를 때까지 기다린다. 자동 시험(window.TUT_AUTO_TAP)만 예전처럼 저절로 누른다.
if (typeof UI !== 'undefined') {
  const baseAuto = UI.autoFollow;
  UI.autoFollow = function (btn, secs) {
    if (typeof window !== 'undefined' && window.TUT_AUTO_TAP && baseAuto) return baseAuto.call(this, btn, secs);
  };
}
