// ===== 정보 탭 정리 (사용자 요청) =====
// 다른 파일들이 UI.charHtml 을 감싸 칸을 덧붙이므로, 모두 붙은 뒤에 지워야 해서 빌드 목록 맨 뒤에 둔다.
if (typeof UI !== 'undefined' && UI.charHtml) {
  const baseChar = UI.charHtml;
  UI.charHtml = function () {
    const html = baseChar.apply(this, arguments);
    // 사용자 요청으로 정보 탭에서 뺀 칸: 직업, 수명, 메인 이야기, 히든 피스 수첩, 고유 장비 도감 (칸 제목으로 찾아 <div class="sec"> 덩어리째 지운다)
    const drop = ['직업', '수명', '메인 이야기', '히든 피스 수첩', '고유 장비 도감'];
    // <div 로 시작하는 덩어리의 끝 위치
    const blockEnd = (str, i) => { let depth = 0; const re = /<div\b|<\/div>/g; re.lastIndex = i; for (let t; (t = re.exec(str));) { depth += t[0] === '</div>' ? -1 : 1; if (depth === 0) return re.lastIndex; } return -1; };
    const findSec = (str, title) => new RegExp('<div class="sec[^"]*"><div class="sec-title">' + title + '(?=[<\\s·])').exec(str);
    let out = html;
    for (const title of drop) {
      for (let guard = 0; guard < 4; guard++) {
        const m = findSec(out, title); if (!m) break;
        const j = blockEnd(out, m.index); if (j <= m.index) break;
        out = out.slice(0, m.index) + out.slice(j);
      }
    }
    // 선천·후천 특성을 '특성' 한 칸으로 합친다 (후천 특성은 얻으면 그 칸에 함께 보인다)
    const lm = findSec(out, '후천 특성');
    let ltCards = '';
    if (lm) {
      const j = blockEnd(out, lm.index);
      if (j > lm.index) {
        const sec = out.slice(lm.index, j);
        const c = sec.indexOf('<div class="cards traits">');
        if (c >= 0) { const ce = blockEnd(sec, c); if (ce > c) ltCards = sec.slice(c + '<div class="cards traits">'.length, ce - '</div>'.length); }
        out = out.slice(0, lm.index) + out.slice(j);
      }
    }
    const head = '<div class="sec"><div class="sec-title">선천 특성</div>';
    const at = out.indexOf(head);
    if (at >= 0) {
      out = out.slice(0, at) + '<div class="sec"><div class="sec-title">특성</div>' + out.slice(at + head.length);
      if (ltCards) {
        const c = out.indexOf('<div class="cards traits">', at);
        if (c >= 0) { const ce = blockEnd(out, c); if (ce > c) out = out.slice(0, ce - 6) + ltCards + out.slice(ce - 6); }
      }
    }
    return out;
  };
}
