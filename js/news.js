// ===== 게이트 크로니클: 뉴스 편집 (영역 C) =====
// docs/NPC_사회_제안.md 층 5. 소문마다 중요도를 매기고, 같은 사건 줄기를 묶어
// 속보(1건) · 헤드라인(3~5건) · 커뮤니티 소문(나머지) 세 단계로 보여 준다.
// rumor(text, meta) — meta: { score: 가산점, thread: 사건 줄기 키, kind: 종류 }

const NEWS_KEYWORDS = [
  [/속보|긴급/, 6], [/SS급/, 4], [/(^|[^S])S급/, 3], [/A급/, 1], [/브레이크/, 3],
  [/돌아오지 못했다|세상을 떠났다|살해|희생|전사/, 2], [/길드|관리국|협회/, 1], [/결혼|갈라섰다|결투/, 1],
  [/우승|랭킹|판정|이변/, 2],
];

{
  const GP = Game.prototype;
  const wrap = (name, fn) => { const base = GP[name]; GP[name] = function (...a) { return fn.call(this, base, ...a); }; };

  GP.newsScore = function (text, meta = {}) {
    let s = 1;
    for (const [re, v] of NEWS_KEYWORDS) if (re.test(text)) s += v;
    const p = this.player;
    if (p && p.name && text.includes(p.name)) s += 3;
    if (this.npcs) for (const n of this.npcs) if (n.met && n.name && text.includes(n.name)) { s += n.relation >= 40 || n.relation <= -30 ? 4 : 2; break; }
    // 새로움: 최근 석 달 같은 종류가 많으면 깎는다
    const kind = meta.kind;
    if (kind && this.rumors) {
      const mk = this.monthKey();
      const same = this.rumors.filter((r) => r.kind === kind && mk - (r.mk ?? mk) <= 3).length;
      s -= Math.min(3, same);
    }
    return Math.max(0, s + (meta.score || 0));
  };

  GP.newsThread = function (text, meta) {
    if (meta.thread) return meta.thread;
    if (/브레이크/.test(text)) { const r = REGIONS.find((x) => text.includes(x.name)); if (r) return 'break:' + r.id; }
    return null;
  };

  wrap('rumor', function (base, text, meta = {}) {
    base.call(this, text);
    const r = this.rumors[0]; if (!r) return;
    r.mk = this.monthKey();
    r.score = this.newsScore(r.text, meta);
    const th = this.newsThread(r.text, meta); if (th) r.thread = th;
    if (meta.kind) r.kind = meta.kind;
    // 같은 줄기의 앞선 소식 수
    if (th) r.follow = this.rumors.filter((x) => x !== r && x.thread === th && r.mk - (x.mk ?? r.mk) <= 12).length;
  });

  // 헤드라인: 최근 months개월, 줄기별 최신 1건, 중요도 순
  GP.headlines = function (n = 4, months = 3) {
    const mk = this.monthKey(); const seen = new Set(); const out = [];
    const recent = this.rumors.filter((r) => mk - (r.mk ?? -99) <= months);
    for (const r of recent) {
      if (r.thread) { if (seen.has(r.thread)) continue; seen.add(r.thread); }
      out.push(r);
    }
    return out.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.mk || 0) - (a.mk || 0)).slice(0, n);
  };

  GP.breakingNow = function () {
    const b = this.world && this.world.breaking;
    return b && this.monthKey() - b.mk <= 1 ? b : null;
  };
}

if (typeof UI !== 'undefined') {
  const esc = (s) => String(s);
  const line = (r, cls = '') => `<div class="l ${cls}"><span class="d">${r.date}</span>${esc(r.text)}${r.follow ? ` <span class="tag">후속 ${r.follow}</span>` : ''}</div>`;

  UI.headlinesHtml = function (n = 4) {
    const hs = G.headlines(n);
    if (!hs.length) return '';
    return `<div class="sec-title">오늘의 헤드라인</div><div class="logs">${hs.map((r, i) => line(r, i === 0 && (r.score || 0) >= 7 ? 'major' : '')).join('')}</div>`;
  };

  const baseRight = UI.rightHtml;
  UI.rightHtml = function () {
    const html = baseRight.call(this);
    const hl = this.headlinesHtml(5);
    if (!hl) return html;
    // 소문 목록은 중요도가 높은 줄을 강조
    const at = html.indexOf('<div class="sec-title">헌터 커뮤니티 소문</div>');
    return at >= 0 ? html.slice(0, at) + hl + html.slice(at) : html + hl;
  };

  // 지도 HUD: 속보 띠
  const baseObj = UI.hudObjective;
  if (baseObj) UI.hudObjective = function () {
    const html = baseObj.call(this);
    const b = G.breakingNow();
    if (!b) return html;
    return `<div class="obj news major"><b>속보</b> ${esc(b.text.replace(/^속보:\s*/, ''))}</div>` + html;
  };

  // 도시 전광판 사건: 헤드라인을 보여 준다
  const ev = typeof STORY !== 'undefined' && STORY.find((e) => e.id === 'arrive_news');
  if (ev && ev.choices && ev.choices[0]) ev.choices[0].do = (g) => {
    const hs = g.headlines(3);
    return hs.length ? hs.map((r) => `"${r.text}"`).join('\n') : '별다른 소식은 없었다.';
  };
}
