// 헌터 일보 (사용자 요청): 매달 신문을 발행하고, 긴급할 때는 호외를 낸다.
// - 휴대폰으로 받으므로 게이트 안(전투·탐색 중)만 아니면 바로 받는다. 게이트 안이면 휴대폰에 쌓였다가 나오면 받는다.
// - 월간호: 달이 바뀌면 지난달 소식(news.js 의 중요도 점수)으로 1면 머리기사 + 분야별 기사(게이트·브레이크 / 길드·협회 / 사람들)
//   + 지난달 게이트 통계(닫힌 게이트·실패·브레이크) + 내 이름이 나온 기사는 따로 "이달의 헌터" 칸.
// - 호외: 게이트 브레이크 속보(breakingNews), S급 이상의 큰 소식(중요도 9 이상)이 나면 바로.
// - 지난 신문은 헤드라인 칸의 [헌터 일보] 단추로 다시 본다(최근 12호).
const PAPER = { keep: 12, extraScore: 9, perSection: 3 };
{
  const GP = Game.prototype;
  const ago = (mk) => { const y = Math.floor((mk - 1) / 12), m = ((mk - 1) % 12) + 1; return `${y}년 ${m}월`; }; // monthKey = 연×12 + 월(1~12)
  GP.paperStore = function () { const w = this.world; w.papers ??= []; w.paperNo ??= 0; w.paperStat ??= null; return w; };
  const section = (t) => (/브레이크|게이트|균열|괴수|레이드/.test(t) ? 'gate' : /길드|협회|관리국|보호국|백호|청룡|주작|현무|낙찰|계약/.test(t) ? 'guild' : 'people');
  // 월간호 만들기 (지난달 소식으로)
  GP.paperMonthly = function () {
    const w = this.paperStore(); const mk = this.monthKey() - 1;
    const items = (this.rumors || []).filter((r) => r.mk === mk).sort((a, b) => (b.score || 0) - (a.score || 0));
    const seen = new Set(); const pick = [];
    for (const r of items) { const k = r.thread || r.text; if (seen.has(k)) continue; seen.add(k); pick.push(r); }
    const p = this.player; const mine = pick.filter((r) => p && p.name && r.text.includes(p.name)).slice(0, 2);
    const rest = pick.filter((r) => !mine.includes(r));
    const head = rest[0] || null;
    const secs = { gate: [], guild: [], people: [] };
    for (const r of rest.slice(1)) { const s = section(r.text); if (secs[s].length < PAPER.perSection) secs[s].push(r.text); }
    const st = w.ecoStat || { npc: 0, fail: 0, breaks: 0 }; const prev = w.paperStat || st;
    const stat = { closed: st.npc - prev.npc, fail: st.fail - prev.fail, breaks: st.breaks - prev.breaks };
    w.paperStat = { ...st };
    if (!head && !mine.length) return null;
    w.paperNo++;
    const clean = (t) => String(t).replace(/^(속보|긴급):\s*/, '');
    for (const k of Object.keys(secs)) secs[k] = secs[k].map(clean);
    const paper = { no: w.paperNo, kind: 'month', mk, title: `${ago(mk)}호`, head: head ? clean(head.text) : null, mine: mine.map((r) => clean(r.text)), secs, stat, read: false };
    w.papers.unshift(paper); if (w.papers.length > PAPER.keep) w.papers.length = PAPER.keep;
    (p.paperInbox ||= []).push(paper.no);
    return paper;
  };
  // 호외
  GP.paperExtra = function (text, sub) {
    const w = this.paperStore(); w.paperNo++;
    const paper = { no: w.paperNo, kind: 'extra', mk: this.monthKey(), date: this.dateStr(), title: '호외', head: String(text).replace(/^속보:\s*/, ''), sub: sub || '', read: false };
    w.papers.unshift(paper); if (w.papers.length > PAPER.keep) w.papers.length = PAPER.keep;
    const p = this.player; if (p) (p.paperInbox ||= []).unshift(paper.no);
    return paper;
  };
  // 달이 바뀌면 월간호
  const baseMonth = GP.advanceMonth;
  GP.advanceMonth = function (...a) {
    const before = this.monthKey();
    const r = baseMonth.apply(this, a);
    try { if (this.player && !this.over && !this._paperQuiet && this.monthKey() !== before) this.paperMonthly(); } catch (e) { /* 무시 */ }
    return r;
  };
  // 브레이크 속보 → 호외
  const baseBreak = GP.breakingNews;
  if (baseBreak) GP.breakingNews = function (head, tail, ...a) {
    const r = baseBreak.call(this, head, tail, ...a);
    try { if (!this._paperQuiet) this.paperExtra(head, tail); } catch (e) { /* 무시 */ }
    return r;
  };
  // 아주 큰 소식(중요도 9 이상, 브레이크 속보는 위에서) → 호외
  const baseRumor = GP.rumor;
  GP.rumor = function (text, meta = {}, ...a) {
    const r = baseRumor.call(this, text, meta, ...a);
    try {
      const top = this.rumors && this.rumors[0];
      if (top && (top.score || 0) >= PAPER.extraScore && meta.kind !== 'break' && !/^속보:/.test(top.text) && !this._paperQuiet) this.paperExtra(top.text);
    } catch (e) { /* 무시 */ }
    return r;
  };
  // 새 게임을 만드는 동안(세계를 미리 굴리는 동안) 쌓이는 소식은 신문으로 내지 않는다
  const baseNew = GP.newGame;
  if (baseNew) GP.newGame = function (...a) { this._paperQuiet = true; try { return baseNew.apply(this, a); } finally { this._paperQuiet = false; try { const w = this.paperStore(); w.papers = []; w.paperStat = { ...(w.ecoStat || { npc: 0, fail: 0, breaks: 0 }) }; if (this.player) this.player.paperInbox = []; } catch (e) { /* 무시 */ } } };
  const baseInit = GP.initSandbox;
  GP.initSandbox = function (...a) { const r = baseInit.apply(this, a); try { this.paperStore(); if (this.player) this.player.paperInbox ??= []; } catch (e) { /* 무시 */ } return r; };
}

if (typeof UI !== 'undefined') {
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const SEC = { gate: '게이트·브레이크', guild: '길드·협회', people: '사람들' };
  UI.paperHtml = function (pp) {
    if (pp.kind === 'extra') {
      return `<div class="paper extra"><div class="paper-mast"><b>헌터 일보</b><span>호외 · ${esc(pp.date || '')}</span></div>
        <div class="paper-extra-tag">號外</div><h2 class="paper-head">${esc(pp.head)}</h2>${pp.sub ? `<p class="paper-sub">${esc(pp.sub)}</p>` : ''}</div>`;
    }
    const secs = Object.entries(pp.secs || {}).filter(([, a]) => a.length).map(([k, a]) => `<div class="paper-sec"><h4>${SEC[k]}</h4>${a.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`).join('');
    const st = pp.stat || {};
    return `<div class="paper"><div class="paper-mast"><b>헌터 일보</b><span>제${pp.no}호 · ${esc(pp.title)}</span></div>
      ${pp.head ? `<h2 class="paper-head">${esc(pp.head)}</h2>` : ''}
      ${pp.mine && pp.mine.length ? `<div class="paper-me"><h4>이달의 헌터</h4>${pp.mine.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
      <div class="paper-cols">${secs}</div>
      <div class="paper-stat">지난달 게이트 · 닫힘 <b>${Math.max(0, st.closed || 0)}</b> · 공략 실패 <b>${Math.max(0, st.fail || 0)}</b> · 브레이크 <b class="${st.breaks > 0 ? 'bad' : ''}">${Math.max(0, st.breaks || 0)}</b></div></div>`;
  };
  UI.showPaper = function (no, fromPhone) {
    const w = G.paperStore(); const pp = w.papers.find((x) => x.no === no); if (!pp) return this.processQueue();
    pp.read = true;
    const left = (G.player.paperInbox || []).length;
    this.modal(`${fromPhone ? `<div class="eyebrow">휴대폰 알림 · ${pp.kind === 'extra' ? '헌터 일보 호외' : '헌터 일보 새 호'}</div>` : ''}${this.paperHtml(pp)}
      <div class="row end">${left ? `<button class="ghost" data-act="paper-next">다음 소식 (${left})</button>` : ''}<button class="primary" data-act="modal-close">닫기</button></div>`, 'event-box paper-box');
  };
  UI.paperArchive = function () {
    const w = G.paperStore();
    const list = w.papers.map((pp) => `<button class="choice-btn" data-act="paper-open" data-v="${pp.no}">${pp.kind === 'extra' ? '<b class="bad">호외</b>' : `제${pp.no}호`} · ${esc(pp.kind === 'extra' ? pp.head : pp.title)}</button>`).join('');
    this.modal(`<div class="eyebrow">헌터 일보 · 지난 신문</div><div class="cards">${list || '<p class="dim small">아직 받은 신문이 없다. 달이 바뀌면 첫 호가 온다.</p>'}</div><div class="row end"><button class="ghost" data-act="modal-close">닫기</button></div>`, 'event-box');
  };
  // 휴대폰으로 받기: 게이트 안·전투·대화 중이 아니면
  const inGate = () => !!(UI.ctx);
  const baseQ = UI.processQueue;
  UI.processQueue = function (...a) {
    if (this.modalOpen && this.modalOpen()) return;
    const p = G.player;
    if (p && p.paperInbox && p.paperInbox.length && !inGate() && !this.dlg && !this.walking && !G.over && this.screen === 'game') {
      const no = p.paperInbox.shift(); return this.showPaper(no, true);
    }
    return baseQ.apply(this, a);
  };
  const baseH = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'paper-next') { this.closeModal(); return this.processQueue(); }
    if (act === 'paper-open') { this.closeModal(); return this.showPaper(+v, false); }
    if (act === 'paper-archive') return this.paperArchive();
    return baseH.call(this, act, v);
  };
  // 헤드라인 칸에 [헌터 일보]
  const baseHL = UI.headlinesHtml;
  if (baseHL) UI.headlinesHtml = function (...a) {
    const h = baseHL.apply(this, a);
    const btn = '<button class="sm ghost paper-btn" data-act="paper-archive">헌터 일보</button>';
    return h ? h.replace('<div class="sec-title">오늘의 헤드라인</div>', `<div class="sec-title">오늘의 헤드라인 ${btn}</div>`) : `<div class="sec-title">헌터 일보 ${btn}</div>`;
  };
}

// 헌터 일보 읽을거리 (사용자 요청: "신문에 내용도 좀 적어서 읽을거리를")
// - 기사마다 본문 2~3문장: 소식 종류(브레이크·공략·실패·등급 상승·길드 추문·입찰·월드 퍼스트·연합 공대·음모)에 맞춰
//   현장 묘사, 관계자 한마디, 반응을 붙인다. 같은 기사는 늘 같은 본문(제목으로 고른다).
// - 고정 꼭지: 협회 공지(다가오는 대회·경매), 에테르 기상(위험 지역 3곳·계절), 모집 광고(이 지역 파티 모집), 헌터 칼럼(돌아가며).
{
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pick = (arr, seed, k = 0) => arr[(hash(seed + ':' + k)) % arr.length];
  const regionIn = (t) => { const r = typeof REGIONS !== 'undefined' && REGIONS.find((x) => t.includes(x.name)); return r ? r.name : '현지'; };
  const BODY = [
    [/실종|구조 요청|출구가 닫혔다/, (t) => [
      `게이트 안에서 변이가 일어나며 출구가 닫혔다. 안에 남은 이들과는 연락이 끊긴 상태다.`,
      `협회는 ${pick(['인근 도시의 구조 지원자를 모집하고 있다.', '같은 등급 이상 헌터에게 긴급 구조 의뢰를 띄웠다.', '변이 게이트 전문 팀을 급히 불렀다.'], t)} 구조 보수는 평소의 두 배라고 한다.`,
      pick(['가족들은 협회 앞에서 밤을 새우고 있다.', '"변이 게이트는 들어가 봐야 안다"는 말이 다시 돌고 있다.'], t, 2)]],
    [/기한을 넘겼지만|봉쇄팀/, (t) => [
      `기한을 넘긴 게이트는 언제 터질지 모른다. 협회 봉쇄팀이 마지막 순간 들어가 겨우 닫았지만, 대원 몇 명이 부상을 입었다.`,
      `봉쇄팀장은 "이런 일이 반복되면 다음엔 장담 못 한다"고 경고했다.`]],
    [/랭킹/, (t) => [
      `헌터 랭킹 게시판은 매달 공략 기록과 평판을 모아 순위를 매긴다. ${pick(['처음 이름을 올린 신인이라 관심이 쏠린다.', '순위 변동 폭이 커서 화제가 됐다.'], t)}`,
      `${pick(['다음 달에도 이름이 남을지가 관건이다.', '팬 카페가 생겼다는 소문도 있다.'], t, 1)}`]],
    [/브레이크/, (t) => [
      `${regionIn(t)} 시내에 사이렌이 울린 건 새벽이었다. ${pick(['지하철역 출구', '시장 골목', '고가도로 아래', '항만 창고 거리'], t)}로 괴수가 쏟아졌고, 시민 수백 명이 인근 대피소로 몸을 피했다.`,
      `관리국 대변인은 "현장 각성자를 최대한 투입하고 있다. 도심 접근을 자제해 달라"고 밝혔다.`,
      pick(['한편 게이트를 맡았던 쪽의 책임론도 커지고 있다. 기한을 넘긴 게이트를 방치한 경위를 두고 조사가 예고됐다.', '헌터넷에는 "이번 달만 몇 번째냐"는 글이 쏟아졌다.', '인근 상인들은 문을 닫고 피해를 세고 있다.'], t, 2)]],
    [/닫았다|공략했다|핵을 베었다|막았다/, (t) => [
      `${pick(['공략팀은 입장 이틀 만에 보스 층에 닿았다.', '안쪽은 예상보다 깊었다고 한다. 공략팀은 층마다 정찰을 돌리며 천천히 올라갔다.', '보스는 마지막 순간 광폭화했지만 전열이 끝까지 버텼다.'], t)}`,
      `${pick(['현장에 있던 협회 관계자는 "교과서 같은 공략이었다"고 평가했다.', '참가한 한 헌터는 "다친 사람 없이 나온 게 제일 큰 수확"이라고 말했다.', '전리품 경매는 이번 주 안에 열릴 예정이다.'], t, 1)}`]],
    [/실패|돌아오지 못했다|전사/, (t) => [
      `공략은 중간 층에서 멈췄다. ${pick(['정찰이 놓친 매복이 화근이었다.', '보스 패턴이 사전 정보와 달랐다.', '체력 관리에 실패하며 철수가 늦었다.'], t)}`,
      `협회는 해당 게이트의 등급 재평가를 검토하고 있다. ${pick(['유가족 지원 방안도 함께 논의된다.', '같은 게이트에 다시 들어갈 팀은 아직 나서지 않고 있다.'], t, 1)}`]],
    [/도달했다|각성자에 도달|급이 되었다/, (t) => [
      `${pick(['돌파 직후 측정실을 나서며', '동료들의 박수를 받으며', '짧은 기자 질문에'], t)} "${pick(['아직 갈 길이 멉니다.', '같이 싸워 준 사람들 덕분입니다.', '다음 등급까지 1년 안에 가겠습니다.'], t, 1)}"라고 소감을 남겼다.`,
      `업계에서는 ${pick(['길드 영입 경쟁이 붙을 것', '몸값이 크게 오를 것', '당분간 대형 게이트 소집에 이름이 오를 것'], t, 2)}으로 보고 있다.`]],
    [/갑질|착취|폭로|의혹|논란|공작/, (t) => [
      `문제는 ${pick(['내부 제보', '익명 게시판의 글 한 편', '퇴사자의 녹취'], t)}에서 시작됐다. 당사자 측은 "사실과 다르다"며 법적 대응을 예고했다.`,
      `${pick(['관리국은 사실관계를 확인 중이라고만 밝혔다.', '헌터넷 여론은 이미 등을 돌린 분위기다.', '같은 조직 소속 헌터들의 이탈 조짐도 보인다.'], t, 1)}`]],
    [/입찰|공략권|낙찰/, (t) => [
      `공략권은 공개 입찰로 넘어간다. ${pick(['5대 길드가 모두 서류를 냈다는 말이 돈다.', '중소 길드들은 "결과는 정해져 있다"며 불만을 드러냈다.'], t)}`,
      `낙찰가는 다음 호에서 전한다.`]],
    [/월드 퍼스트|최초/, (t) => [
      `기록은 협회 공식 명부에 바로 올랐다. ${pick(['해외 헌터 커뮤니티에서도 영상이 돌고 있다.', '공략 영상은 하루 만에 조회 수 백만을 넘겼다.'], t)}`,
      `"다음 기록은 누가 깰지 벌써부터 내기가 붙었다"는 후문이다.`]],
    [/소집|연합|레이드|공대/, (t) => [
      `관리국은 각 길드에 정예 인원 차출을 요청했다. 공대는 ${pick(['이번 주말', '다음 달 초', '열흘 뒤'], t)} 집결한다.`,
      `${pick(['참가 헌터에게는 공적과 위험 수당이 함께 지급된다.', '불참 길드에는 다음 입찰에서 불이익이 있을 거라는 말도 나온다.'], t, 1)}`]],
  ];
  const generic = (t) => [`${pick(['헌터 커뮤니티에서는 이 소식을 두고 의견이 갈린다.', '아직 확인되지 않은 부분도 많다.', '관계자들은 말을 아끼고 있다.'], t)} ${pick(['자세한 내용은 확인되는 대로 전한다.', '다음 호에서 후속 소식을 싣는다.', '독자 제보를 기다린다.'], t, 1)}`];
  const bodyOf = (t, lines = 2) => { for (const [re, f] of BODY) if (re.test(t)) return f(t).slice(0, lines).join(' '); return generic(t).join(' '); };
  const TIPS = [
    ['층 지도는 정찰이 먼저', '정찰 직업이 본 칸은 믿어도 된다. 안 본 칸에 체력 절반으로 들어가는 건 도박이다. 샘은 보스 앞을 위해 아껴 두자.'],
    ['상성은 피해량의 절반', '같은 등급이라도 상성이 맞으면 피해가 크게 들어간다. 파티를 꾸릴 때 속성을 섞어 두면 어떤 게이트에서도 한 명은 웃는다.'],
    ['기한 지난 게이트는 시한폭탄', '지도에 "균열 경고"가 뜬 게이트는 이번 달 안에 누군가 닫아야 한다. 닫으면 공적이 붙고, 놓치면 도시가 운다.'],
    ['회복약은 아끼다 똥 된다', '체력이 30% 아래로 떨어지면 망설이지 말자. 다음 차례는 오지 않을 수도 있다.'],
    ['오더는 따라도, 판단은 내 몫', '리더 오더를 따르면 사이가 좋아진다. 그래도 엉터리 오더는 엉터리다. 깐깐한 리더 밑이라면 차라리 이유를 말하고 어기자.'],
    ['동료가 다치면 쉬어라', '다친 동료는 힘을 다 못 쓴다. 일주일만 쉬면 낫는다. 무리한 공략 한 번이 동료 하나를 잃게 한다.'],
  ];
  GP_paper_ext: {
    if (typeof Game === 'undefined') break GP_paper_ext;
    const GP = Game.prototype; const baseMonthly = GP.paperMonthly; const baseExtra = GP.paperExtra;
    GP.paperMonthly = function (...a) {
      const pp = baseMonthly.apply(this, a); if (!pp) return pp;
      try {
        pp.headBody = pp.head ? bodyOf(pp.head, 3) : '';
        pp.secBody = {}; for (const [k, arr] of Object.entries(pp.secs || {})) pp.secBody[k] = arr.map((t) => bodyOf(t, 1));
        pp.mineBody = (pp.mine || []).map((t) => bodyOf(t, 1));
        // 협회 공지
        const nxt = (this.rumors || []).filter((r) => /다음 달/.test(r.text) && (r.mk ?? 0) >= pp.mk).slice(0, 2).map((r) => r.text);
        pp.notice = nxt.length ? nxt : ['이달 협회 정기 공지는 없습니다. 게이트 기한 준수를 다시 한번 당부드립니다.'];
        // 에테르 기상
        const ss = this.season ? this.season() : null;
        const top = REGIONS.filter((r) => r.id !== 'jeju').slice().sort((a, b) => (b.danger * b.ether) - (a.danger * a.ether)).slice(0, 3);
        pp.weather = { season: ss === 'rain' ? '장마철 · 강과 늪지 이동이 느려진다' : ss === 'winter' ? '혹한기 · 산길 이동이 느려진다' : '맑음 · 이동에 큰 지장 없음', regions: top.map((r) => `${r.name} 에테르 농도 ${Math.round(r.ether * 100)} · 위험 ${'◆'.repeat(r.danger)}`) };
        // 모집 광고
        const board = this.crewBoard ? this.crewBoard(this.player.region) : [];
        pp.ads = board.slice(0, 2).map((L) => { const n = this.npcById(L.leader); return `[모집] ${L.name} — 리더 ${n ? n.name : ''}(${n ? RANKS[n.rankIdx].key : '?'}급) · ${RANKS[L.minRank].key}급 이상 · ${CLASS_GROUPS[L.want] ? CLASS_GROUPS[L.want].name + ' 계열 우대' : ''}`; });
        pp.ads.push(pick(['[광고] 응급 회복제 1+1 — 협회 매점, 이번 달 한정', '[광고] 장비 수리 당일 완료 — 도시 공방 거리', '[광고] 헌터 전용 보험 "살아서 돌아오세요" — 입장 전 가입 필수'], String(pp.no)));
        pp.tip = TIPS[pp.no % TIPS.length];
      } catch (e) { /* 읽을거리 실패는 신문을 막지 않는다 */ }
      return pp;
    };
    GP.paperExtra = function (text, sub, ...a) {
      const pp = baseExtra.call(this, text, sub, ...a);
      try { pp.body = bodyOf(String(text).replace(/^속보:\s*/, ''), 3); } catch (e) { /* 무시 */ }
      return pp;
    };
  }
  if (typeof UI !== 'undefined' && UI.paperHtml) {
    const esc = (s) => String(s ?? '').replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
    const SEC = { gate: '게이트·브레이크', guild: '길드·협회', people: '사람들' };
    const baseHtml = UI.paperHtml;
    UI.paperHtml = function (pp) {
      if (pp.kind === 'extra') {
        if (!pp.body) return baseHtml.call(this, pp);
        return baseHtml.call(this, pp).replace(/<\/div>$/, `<p class="paper-body">${esc(pp.body)}</p></div>`);
      }
      if (!pp.headBody && !pp.tip) return baseHtml.call(this, pp);
      const art = (t, b) => `<div class="paper-art"><b>${esc(t)}</b>${b ? `<p>${esc(b)}</p>` : ''}</div>`;
      const secs = Object.entries(pp.secs || {}).filter(([, a]) => a.length).map(([k, a]) => `<div class="paper-sec"><h4>${SEC[k]}</h4>${a.map((t, i) => art(t, pp.secBody && pp.secBody[k] && pp.secBody[k][i])).join('')}</div>`).join('');
      const st = pp.stat || {};
      return `<div class="paper"><div class="paper-mast"><b>헌터 일보</b><span>제${pp.no}호 · ${esc(pp.title)}</span></div>
        ${pp.head ? `<h2 class="paper-head">${esc(pp.head)}</h2><p class="paper-body lead">${esc(pp.headBody || '')}</p>` : ''}
        ${pp.mine && pp.mine.length ? `<div class="paper-me"><h4>이달의 헌터</h4>${pp.mine.map((t, i) => art(t, pp.mineBody && pp.mineBody[i])).join('')}</div>` : ''}
        <div class="paper-cols">${secs}</div>
        ${pp.notice ? `<div class="paper-sec"><h4>협회 공지</h4>${pp.notice.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
        ${pp.weather ? `<div class="paper-sec paper-weather"><h4>에테르 기상</h4><p>${esc(pp.weather.season)}</p>${pp.weather.regions.map((t) => `<p class="small">${esc(t)}</p>`).join('')}</div>` : ''}
        ${pp.tip ? `<div class="paper-sec paper-col"><h4>헌터 칼럼 · ${esc(pp.tip[0])}</h4><p>${esc(pp.tip[1])}</p></div>` : ''}
        ${pp.ads && pp.ads.length ? `<div class="paper-ads">${pp.ads.map((t) => `<p>${esc(t)}</p>`).join('')}</div>` : ''}
        <div class="paper-stat">지난달 게이트 · 닫힘 <b>${Math.max(0, st.closed || 0)}</b> · 공략 실패 <b>${Math.max(0, st.fail || 0)}</b> · 브레이크 <b class="${st.breaks > 0 ? 'bad' : ''}">${Math.max(0, st.breaks || 0)}</b></div></div>`;
    };
  }
}
