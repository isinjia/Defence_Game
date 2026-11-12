// ===== 메인 이야기 기록 (영역 D, docs/메인_시나리오.md §6 · docs/메인_폴리시2_작업지시.md §4-2) =====
// 정보 탭에 「메인 이야기」 구역: 지나온 장 제목 · 어떻게 끝났는지 · 고른 선택 한두 줄. 회차 기록(지난 판 엔딩)도 함께.
if (typeof UI !== 'undefined') {
  const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const HOW = { done: '', missed: '미룸 · 세상이 먼저 움직임' };
  UI.mainLogHtml = function () {
    const M = G.flags && G.flags.main; if (!M) return '';
    const log = (M.log || []).slice().sort((a, b) => a.n - b.n);
    const cur = MAIN.chapters[M.ch];
    const part = (n) => (MAIN.chapters[n] && MAIN.chapters[n].part) || 0;
    let lastPart = 0; const rows = [];
    for (const e of log) {
      const pt = part(e.n);
      if (pt !== lastPart) { rows.push(`<div class="small dim" style="margin-top:6px">${pt}부</div>`); lastPart = pt; }
      rows.push(`<div class="l${e.how === 'missed' ? '' : ' major'}"><span class="d">${e.n}장</span>「${esc(e.title)}」${e.how === 'missed' ? ` <span class="bad">${HOW.missed}</span>` : ''}${e.choice ? `<div class="small dim">${esc(e.choice)}</div>` : ''}</div>`);
    }
    const now = cur && !M.done[cur.n] ? `<div class="small">지금: ${cur.n}장 「${esc(cur.title)}」${M.open[cur.n] ? '' : ' · 아직 열리지 않음'}</div>` : M.ending ? `<div class="small">엔딩: <b>${esc((typeof ENDINGS !== 'undefined' && ENDINGS[M.ending] && ENDINGS[M.ending].title) || M.ending)}</b></div>` : '';
    const runs = (G.mainRuns && G.mainRuns()) || [];
    const past = runs.length ? `<div class="small dim" style="margin-top:6px">지난 판: ${runs.slice(-5).map((r) => `${esc(r.name)} · ${r.ending ? esc((typeof ENDINGS !== 'undefined' && ENDINGS[r.ending] && ENDINGS[r.ending].title) || r.ending) : `${r.ch}장에서 멈춤`}`).join(' / ')}</div>` : '';
    if (!log.length && !now && !past) return '';
    return `<div class="sec main-log"><div class="sec-title">메인 이야기</div>${now}<div class="logs">${rows.join('') || '<div class="small dim">아직 지나온 장이 없다.</div>'}</div>${past}</div>`;
  };
  const baseChar = UI.charHtml;
  if (baseChar) UI.charHtml = function () {
    const html = baseChar.call(this); const box = this.mainLogHtml(); if (!box) return html;
    const at = html.lastIndexOf('<div class="sec"><div class="sec-title">인생 기록');
    return at >= 0 ? html.slice(0, at) + box + html.slice(at) : html + box;
  };
}

// ===== 회차 기억: 지난 판의 메인 결말을 다음 판 대사에 한 줄씩 비춘다 (게임 기조: 모바일 반복 플레이) =====
// 저장은 판 저장과 따로 둔다(게임이 끝나 판 저장이 지워져도 남는다). 최근 20판.
const MAIN_RUNS_KEY = 'gate_chronicle_main_runs';
if (typeof Game !== 'undefined') {
  const GP = Game.prototype;
  GP.mainRuns = function () { try { return JSON.parse(localStorage.getItem(MAIN_RUNS_KEY) || '[]'); } catch (e) { return []; } };
  GP.mainRecordRun = function () {
    const M = this.flags && this.flags.main; const p = this.player; if (!M || !p || M.runRecorded) return;
    if ((M.ch || 1) <= 1 && !M.ending) return; // 1장도 안 끝낸 판은 남기지 않는다
    M.runRecorded = true;
    const run = { name: p.name, bg: p.bg || null, ending: M.ending || null, ch: M.ending ? 40 : M.ch, seed: M.flags.endSeed || null, jin: M.flags.jinFate || null, friend: M.flags.friend3 || null, date: this.dateStr ? this.dateStr() : '' };
    try { const a = this.mainRuns(); a.push(run); localStorage.setItem(MAIN_RUNS_KEY, JSON.stringify(a.slice(-20))); } catch (e) { /* 저장 불가면 넘어간다 */ }
  };
  const baseGO2 = GP.gameOver;
  // 남의 이야기 판정(main_ending.js)이 끝난 뒤에 기록한다
  GP.gameOver = function (reason) { const r = baseGO2.call(this, reason); try { this.mainRecordRun(); } catch (e) { /* 무시 */ } return r; };
  const baseFin = GP.mainFinish;
  GP.mainFinish = function (n, how) { const r = baseFin.call(this, n, how); if (n === 39) this.mainRecordRun(); return r; };
  // 새 판: 지난 판 하나를 기억해 둔다(이번 판 대사에서 읽는다)
  const baseInit2 = GP.initSandbox;
  GP.initSandbox = function () {
    baseInit2.call(this);
    const M = this.flags && this.flags.main;
    if (M && M.prevRun === undefined) { const a = this.mainRuns(); M.prevRun = (M.ch || 1) === 1 && !Object.keys(M.done || {}).length ? (a[a.length - 1] || null) : null; }
  };
}
