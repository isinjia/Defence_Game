// ===== 게이트 크로니클: 메뉴·시설 단계적 열기 · 기기 안 진행 기록 =====
// docs/첫_30분_점검.md 3·6
// - 처음엔 정보·장비·스킬·파티·의뢰·연대기만. 인물은 아는 사람이 생기면, 길드는 명성이 가입 조건 근처에 오면,
//   헌터 탭은 C급 진입·첫 칭호·재측정·후원자 중 하나가 생기면 열린다. 열릴 때 한 줄 안내.
// - 도시 시설은 첫 해 수첩을 끝내기 전까지 호텔·마켓·의뢰소·공방 넷만 먼저 보이고 나머지는 "더 보기".
//   처음 들어간 시설마다 한 줄 설명을 한 번 띄운다.
// - 진행 기록: 첫 게이트·첫 도시·첫 의뢰·첫 보고·첫 제작·첫 돌파까지 걸린 게임 날짜와 실제 시간. 외부 전송 없이 이 기기에만.
//   연대기 탭에서 보고 복사할 수 있다.

const MENU_GATES = {
  people: { name: '인물', why: '아는 사람이 생겼다. 대화·선물로 관계를 쌓을 수 있다.', ok: (g, p) => g.npcs.some((n) => n.met && n.alive && !n.isCompanion) },
  guild: { name: '길드', why: '길드 소식과 가입 조건을 볼 수 있다.', ok: (g, p) => !!p.guild || p.fame >= Math.min(...Object.values(GUILDS).map((x) => x.fameReq)) - 2 },
  hunter: { name: '헌터', why: '헌터로서의 기록(칭호·방송·후원·은퇴)을 볼 수 있다.', ok: (g, p) => p.rankIdx >= 3 || (p.titles || []).length > 0 || !!p.remeasured || !!p.sponsor || g.ageYears() >= 50 },
};
const CORE_FACS = ['inn', 'market', 'board', 'workshop'];
const FUNNEL_KEY = 'gate_chronicle_funnel';
const FUNNEL_STEPS = [
  ['start', '새 게임'], ['exam', '자격 시험 끝'], ['city', '첫 도시 진입'], ['gate', '첫 게이트 공략'], ['take', '첫 의뢰 수락'],
  ['report', '첫 의뢰 보고'], ['craft', '첫 제작'], ['train', '첫 수련'], ['break', '첫 돌파'], ['end', '삶의 끝'],
];

Object.assign(Game.prototype, {
  menuOpen(k) { const p = this.player; if (!MENU_GATES[k] || !p || p.unlocked === 'all') return true; return (p.unlocked || []).includes(k); },
  menuCheck() {
    const p = this.player; if (!p || p.unlocked === 'all') return;
    p.unlocked ??= [];
    for (const [k, m] of Object.entries(MENU_GATES)) {
      if (p.unlocked.includes(k) || !m.ok(this, p)) continue;
      p.unlocked.push(k);
      this.queue.push({ type: 'toast', text: `새 메뉴가 열렸다: ${m.name} — ${m.why}` });
    }
    if (Object.keys(MENU_GATES).every((k) => p.unlocked.includes(k))) p.unlocked = 'all';
  },
  // ---------- 진행 기록 ----------
  funnelLoad() { try { return JSON.parse(localStorage.getItem(FUNNEL_KEY) || '[]'); } catch (e) { return []; } },
  funnelMark(step) {
    const p = this.player; if (!p || !p.runId) return;
    try {
      const runs = this.funnelLoad(); const r = runs.find((x) => x.id === p.runId); if (!r || r.s[step]) return;
      r.s[step] = { d: `${this.year}.${this.month}.${this.day}`, m: Math.round((Date.now() - r.t0) / 6000) / 10 };
      localStorage.setItem(FUNNEL_KEY, JSON.stringify(runs));
    } catch (e) { /* 저장 불가 */ }
  },
  funnelStart() {
    const p = this.player; p.runId = Date.now().toString(36);
    try {
      const runs = this.funnelLoad();
      runs.push({ id: p.runId, t0: Date.now(), name: p.name, s: {} });
      while (runs.length > 5) runs.shift();
      localStorage.setItem(FUNNEL_KEY, JSON.stringify(runs));
    } catch (e) { /* 저장 불가 */ }
    this.funnelMark('start');
  },
});

(() => {
  const P = Game.prototype;
  const baseNew = P.newGame;
  P.newGame = function (opts) { const r = baseNew.call(this, opts); this.player.unlocked = []; this.player.facTour = true; this.funnelStart(); return r; };
  const baseInit = P.initSandbox;
  P.initSandbox = function () { baseInit.call(this); const p = this.player; p.unlocked ??= 'all'; p.facSeen ??= []; };
  // 진행 기록 지점
  const mark = (fn, step, ok) => { const base = P[fn]; if (!base) return; P[fn] = function (...a) { const r = base.apply(this, a); if (!ok || ok.call(this, r, ...a)) this.funnelMark(step); return r; }; };
  mark('visitCity', 'city');
  mark('finishGate', 'gate', function (r, gate, result) { return result === 'clear'; });
  mark('acceptBounty', 'take', (r) => typeof r === 'string' && r.startsWith('의뢰 수락'));
  mark('payBounty', 'report');
  mark('craft', 'craft', (r) => typeof r === 'string' && /만들었다/.test(r));
  mark('train', 'train');
  mark('breakthrough', 'break', (r) => r && r.ok);
  mark('gameOver', 'end');
  mark('revealAwakenRank', 'exam', (r) => !!r);
  const baseRe = P.remeasure;
  if (baseRe) P.remeasure = function () { const m = this.player.money; const r = baseRe.call(this); if (this.player.money < m) this.player.remeasured = true; return r; };
})();

(() => {
  // 메뉴 버튼·탭 감추기
  const lockBtns = (html) => html.replace(/<button[^>]*data-act="sheet" data-v="(people|guild|hunter)"[^>]*>[\s\S]*?<\/button>/g, (m, k) => (G.menuOpen(k) ? m : ''));
  const baseMenu = UI.hudMenu;
  UI.hudMenu = function () { return lockBtns(baseMenu.call(this)); };
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function () {
    const name = this.sheet || '';
    if (MENU_GATES[name] && !G.menuOpen(name)) this.sheet = 'char';
    const html = baseSheet.call(this);
    const head = html.indexOf('<div class="sheet-body">');
    return head > 0 ? lockBtns(html.slice(0, head)) + html.slice(head) : html;
  };
  const baseQueue = UI.processQueue;
  UI.processQueue = function () {
    if (!this.modalOpen() && G.player && !G.over) { const before = G.queue.length; G.menuCheck(); if (G.queue.length > before && this.screen === 'game') document.getElementById('hud-tl') && (document.getElementById('hud-tl').innerHTML = this.hudMenu()); }
    return baseQueue.call(this);
  };

  // 도시 시설: 처음엔 넷만
  const baseCity = UI.cityHtml;
  UI.cityHtml = function () {
    const html = baseCity.call(this);
    const p = G.player;
    if (p.facTour && p.notebook && p.notebook.i >= NB_TASKS.length) p.facTour = false;
    if (this.cityFac || !p.facTour || this.cityMore) return html;
    let hidden = 0;
    const out = html.replace(/<button class="fac-tile" data-act="city-fac" data-v="([a-z]+)">[\s\S]*?<\/button>/g, (m, id) => (CORE_FACS.includes(id) ? m : (hidden++, '')));
    if (!hidden) return html;
    return out.replace(/(<div class="fac-grid">[\s\S]*?)(<\/div>\s*<div class="sec-title sec">)/, `$1<button class="fac-tile more" data-act="city-more">${typeof facIcon === 'function' ? '' : ''}<b>더 보기</b><span class="small dim">시설 ${hidden}곳 더</span></button>$2`);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    switch (act) {
      case 'city-more': this.cityMore = true; $box.innerHTML = fixJosa(this.cityHtml()); return;
      case 'city-fac': {
        const r = baseHandle.call(this, act, v);
        const p = G.player; p.facSeen ??= [];
        if (v && !p.facSeen.includes(v) && p.unlocked !== 'all') { p.facSeen.push(v); const f = FACILITIES.find((x) => x.id === v); if (f) this.toast(`${f.name}: ${f.desc}`); }
        return r;
      }
      case 'modal-close': this.cityMore = false; return baseHandle.call(this, act, v);
      case 'funnel-copy': {
        const txt = UI.funnelText();
        try { navigator.clipboard.writeText(txt).then(() => this.toast('진행 기록을 복사했다.'), () => this.toast('복사하지 못했다.')); } catch (e) { this.toast('복사하지 못했다.'); }
        return;
      }
      default: return baseHandle.call(this, act, v);
    }
  };

  // 연대기 탭: 진행 기록
  UI.funnelText = function () {
    return G.funnelLoad().map((r) => `[${r.name || '?'}] ` + FUNNEL_STEPS.filter(([k]) => r.s[k]).map(([k, n]) => `${n} ${r.s[k].d}(${r.s[k].m}분)`).join(' → ')).join('\n') || '기록 없음';
  };
  const baseSheet2 = UI.sheetHtml;
  UI.sheetHtml = function () {
    const html = baseSheet2.call(this);
    if ((this.sheet || '') !== 'log') return html;
    const runs = G.funnelLoad().slice(-3).reverse();
    if (!runs.length) return html;
    const rows = runs.map((r) => `<div class="item-row"><div class="grow"><b>${r.name || '이름 없음'}</b><div class="small dim">${FUNNEL_STEPS.filter(([k]) => r.s[k]).map(([k, n]) => `${n} <span class="num">${r.s[k].d}</span> · ${r.s[k].m}분`).join('<br>')}</div></div></div>`).join('');
    const box = `<div class="panel"><h3>진행 기록 <span class="small dim">이 기기에만 저장</span></h3><p class="dim small">처음 무엇을 해 보기까지 걸린 게임 날짜와 실제 시간. 외부로 보내지 않는다. 지인에게 시험해 달라고 할 때 복사해서 받으면 어디서 막혔는지 알 수 있다.</p><div class="cards">${rows}</div><div class="row end"><button class="sm ghost" data-act="funnel-copy">복사</button></div></div>`;
    const i = html.lastIndexOf('</div>');
    return i > 0 ? html.slice(0, i) + box + html.slice(i) : html + box;
  };
})();

// (tutorial.js 의 전투 안내와 짝. ui_mobile.js 가 coachTarget 을 정의한 뒤에 덮어써야 해서 여기에 둔다)
// 튜토리얼 안내 말풍선이 가리키는 곳 (안내 내용과 맞춘다)
//  1/3 게이지 → 아군 줄 · 2/3 내 차례 → 아래 메뉴(스킬·아이템 목록을 열었으면 그 목록) · 겨누기 → 적
//  3/3 회복약·방어 → 아이템 버튼 · 3/3 더 → 오른쪽 위 배속·자동
{
  const baseTarget = UI.coachTarget;
  UI.coachTarget = function (label) {
    const c = this.ctx; const t = c && c.tutorial; const box = document.getElementById('cb-ctrl');
    if (!t || !box || t.boss) return baseTarget ? baseTarget.call(this, label) : null;
    const k = t.key;
    if (k === 'gauge') return document.getElementById('allies') || document.getElementById('foes');
    if (k === 'turn') return (c.cmd && box.querySelector('.cmd-list')) || box.querySelector('.cmd-main') || box.querySelector('.skill-btns');
    if (k === 'aimEnemy') return document.getElementById('foes');
    if (k === 'aimAlly') return document.getElementById('allies');
    if (k === 'aimNone') return box.querySelector('.use-btn') || box.querySelector('.cmd-main');
    if (k === 'done') return box.querySelector('[data-act="c-cmd"][data-v="item"]') || box.querySelector('.cmd-main');
    if (k === 'tools') return document.querySelector('#modal-box .cb-tools');
    return baseTarget ? baseTarget.call(this, label) : null;
  };
}
// 전투 화면은 처음 그려진 뒤 배치가 한 번 더 바뀐다(전투 한 화면 맞춤). 말풍선 위치를 그 뒤에 다시 잡는다.
{
  const basePop = UI.coachPop;
  UI.coachPop = function (node, target, key) {
    const r = basePop.call(this, node, target, key);
    if (node && target && !this._coachRe) {
      clearTimeout(this._coachReT);
      this._coachReT = setTimeout(() => {
        const pop = document.getElementById('coach-pop'); const n = pop && pop.querySelector('.coach-card');
        if (!n || pop._key !== (key || '') || !document.body.contains(target)) return;
        this._coachRe = true; try { basePop.call(this, n, target, key); } finally { this._coachRe = false; }
      }, 120);
    }
    return r;
  };
}
