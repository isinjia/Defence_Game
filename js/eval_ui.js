// ---------- 평가 보정: 작은 화면 지도 ----------
// 높이 720px 이하(iPhone SE 등)는 인물 카드가 지도 가운데를 덮으므로, 접힘을 고른 적이 없으면 처음부터 접어 둔다(체력·정신 막대는 남는다).
if (typeof UI !== 'undefined' && UI.fold && !('card' in UI.fold) && typeof window !== 'undefined' && window.innerHeight <= 720) UI.fold.card = true;
