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
    // 인연 칸부터 아래는 모두 지운다 (같은 패널 안의 뒤따르는 덩어리 전부)
    const km = findSec(out, '인연');
    if (km) {
      let i = km.index;
      for (let guard = 0; guard < 40; guard++) {
        while (/\s/.test(out[i] || '')) i++;
        if (!out.startsWith('<div', i)) break;
        const j = blockEnd(out, i); if (j <= i) break;
        out = out.slice(0, i) + out.slice(j);
      }
    }
    // 빛·어둠(선악) 칸: 제목 없이 끼어 있던 문구를 지우고, 성향 칸 바로 아래에 막대로 보여 준다
    out = out.replace(/<div class="small align-line">[\s\S]*?<\/div>/, '');
    const pl = typeof G !== 'undefined' && G.player;
    const lm2 = findSec(out, '성향');
    if (pl && lm2) {
      const A = Math.round(pl.align || 0); const pct = Math.round((A + 100) / 2);
      const kind = A >= 30 ? '빛' : A <= -30 ? '어둠' : '중립';
      const txt = Math.abs(A) >= 30 && G.alignText ? G.alignText() : '';
      const box = `<div class="sec"><div class="sec-title">빛 · 어둠 · ${kind} <span class="small dim num">(${A > 0 ? '+' : ''}${A})</span></div>
        <div style="position:relative;height:8px;border-radius:4px;background:linear-gradient(90deg,#6b4a8a,#555 50%,#d9b65a)"><span style="position:absolute;top:-3px;left:calc(${pct}% - 7px);width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #222"></span></div>
        <div class="row small dim" style="justify-content:space-between"><span>어둠</span><span>빛</span></div>${txt ? `<div class="small dim">${txt}</div>` : ''}</div>`;
      const e = blockEnd(out, lm2.index);
      if (e > lm2.index) out = out.slice(0, e) + box + out.slice(e);
    }
    // 성향 칸 위에 스테이터스(능력치) 칸
    const p = typeof G !== 'undefined' && G.player;
    const sm = findSec(out, '성향');
    if (p && sm) {
      const STAT = [['maxHp', '체력'], ['maxMp', '정신력'], ['atk', '공격'], ['def', '방어'], ['spd', '속도'], ['luck', '운']];
      const box = `<div class="sec"><div class="sec-title">스테이터스</div><div class="st-stats">${STAT.map(([k, nm]) => `<span><i>${nm}</i><b class="num">${Math.round(p[k] || 0)}</b></span>`).join('')}</div></div>`;
      out = out.slice(0, sm.index) + box + out.slice(sm.index);
    }
    return out;
  };
}

// 정보 창 탭 줄에서 '인물'·'도감' 탭을 뺀다 (사용자 요청). 기능(관계·도감 피해 보너스)은 그대로 남는다.
if (typeof UI !== 'undefined' && UI.sheetHtml) {
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function () {
    const html = baseSheet.apply(this, arguments);
    if (typeof html !== 'string') return html;
    return html.replace(/<button\b[^>]*data-act="sheet" data-v="(?:people|dex)"[^>]*>[^<]*<\/button>/g, '');
  };
}
