// ===== 게이트 크로니클: 원형 초상화를 살짝 위로 (영역 A, 사용자 요청) =====
// 월드맵 마커·HUD·전투·대화 등 원형 초상화에서 얼굴이 원 아래쪽에 치우쳐 보였다.
// 원(테두리·자르는 원)은 그대로 두고 안쪽 그림만 위로 올린다. 지도 마커도 이 SVG를 그려 쓰므로 함께 맞춰진다.
const PORTRAIT_LIFT = 24; // SVG 단위(원 지름 250 기준, 약 10%)
if (typeof PORTRAIT !== 'undefined' && PORTRAIT.avatar) {
  const baseAvatar = PORTRAIT.avatar;
  PORTRAIT.avatar = function (...a) {
    const s = baseAvatar.apply(this, a);
    if (typeof s !== 'string' || !s.includes('data-portrait-parts=')) return s;
    return s.replace(/(<g clip-path="url\(#[^)"]*circle\)">)([\s\S]*?)(<\/g><circle cx="200")/, (m, open, body, close) => `${open}<g transform="translate(0 -${PORTRAIT_LIFT})">${body}</g>${close}`);
  };
}
