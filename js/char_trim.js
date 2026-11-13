// ===== 정보 탭 정리 (사용자 요청) =====
// 다른 파일들이 UI.charHtml 을 감싸 칸을 덧붙이므로, 모두 붙은 뒤에 지워야 해서 빌드 목록 맨 뒤에 둔다.
if (typeof UI !== 'undefined' && UI.charHtml) {
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.apply(this, arguments);
    // 사용자 요청으로 정보 탭에서 뺀 칸: 직업, 수명, 메인 이야기, 히든 피스 수첩, 고유 장비 도감 (칸 제목으로 찾아 <div class="sec"> 덩어리째 지운다)
    const drop = ['직업', '수명', '메인 이야기', '히든 피스 수첩', '고유 장비 도감'];
    let out = html;
    for (const title of drop) {
      for (let guard = 0; guard < 4; guard++) {
        const m = new RegExp('<div class="sec[^"]*"><div class="sec-title">' + title + '(?=[<\\s·])').exec(out); if (!m) break;
        let i = m.index, depth = 0, j = i;
        const re = /<div\b|<\/div>/g; re.lastIndex = i;
        for (let t; (t = re.exec(out));) { depth += t[0] === '</div>' ? -1 : 1; if (depth === 0) { j = re.lastIndex; break; } }
        if (j <= i) break; out = out.slice(0, i) + out.slice(j);
      }
    }
    return out;
  };
}
