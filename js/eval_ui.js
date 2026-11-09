// ---------- 평가 보정: 작은 화면 지도 ----------
// 높이 720px 이하(iPhone SE 등)는 인물 카드가 지도 가운데를 덮으므로, 접힘을 고른 적이 없으면 처음부터 접어 둔다(체력·정신 막대는 남는다).
if (typeof UI !== 'undefined' && UI.fold && !('card' in UI.fold) && typeof window !== 'undefined' && window.innerHeight <= 720) UI.fold.card = true;

// 전투 안내 말풍선이 아군 줄(내 캐릭터·동료 카드)을 통째로 가리던 문제(평가 8순위):
// 말풍선이 대상 위쪽에 서고 아군 줄과 겹치면, 자리가 있을 때 아군 줄 위로 올린다(화살표는 그대로 대상 쪽).
if (typeof UI !== 'undefined' && UI.coachPop) {
  const baseCoach = UI.coachPop;
  UI.coachPop = function (node, target, key) {
    const r = baseCoach.call(this, node, target, key);
    // onboarding.js 가 0.12초 뒤 위치를 다시 잡으므로 그 뒤에도 한 번 더 맞춘다
    const fit = () => { try {
      const pop = document.getElementById('coach-pop');
      const rows = [...document.querySelectorAll('.modal-box .allies, .modal-box .allies-front, .modal-box .allies-back')].map((e) => e.getBoundingClientRect()).filter((b) => b.height > 0);
      if (pop && target && rows.length && pop.classList.contains('arrow-down')) {
        const pr = pop.getBoundingClientRect(); const ar = { top: Math.min(...rows.map((b) => b.top)), bottom: Math.max(...rows.map((b) => b.bottom)) };
        const overlap = pr.bottom > ar.top + 4 && pr.top < ar.bottom - 4;
        const top = ar.top - pr.height - 10;
        // 적을 가리면 안 된다: 살아 있는 적의 아래 끝보다 위로는 올리지 않는다
        const foes = [...document.querySelectorAll('#foes .foe:not(.dead)')].map((e) => e.getBoundingClientRect()).filter((b) => b.height > 0);
        const foeBottom = foes.length ? Math.max(...foes.map((b) => b.bottom)) : 0;
        if (overlap && top >= Math.max(56, foeBottom - 4)) pop.style.top = top + 'px';
        else if (overlap) {
          // 자리가 없으면 아군 줄 위에 두되 작게(얼굴·여백 축소, 반투명) — 적 줄은 늘 보이게
          pop.classList.add('compact');
          const ph = pop.getBoundingClientRect().height; const ctl = document.getElementById('cb-ctrl');
          const cb = ctl ? ctl.getBoundingClientRect().top : window.innerHeight;
          pop.style.top = Math.max(foeBottom + 4, cb - ph - 10) + 'px';
        }
      }
    } catch (e) { /* 무시 */ } };
    fit(); for (const t of this._coachFitT || []) clearTimeout(t); this._coachFitT = [180, 450, 900].map((ms) => setTimeout(fit, ms));
    return r;
  };
}

// '현재 퀘스트' 칸에 첫 해 수첩 과제가 안 보여 "진행 중인 의뢰가 없다"만 뜨던 문제(독립 평가): 맨 위에 과제 한 줄.
if (typeof UI !== 'undefined' && UI.hudQuests) {
  const baseHq = UI.hudQuests;
  UI.hudQuests = function () {
    let html = baseHq.call(this);
    try {
      const t = G.nbTask && G.nbTask(); const nb = G.player && G.player.notebook;
      if (t && nb) {
        const row = `<button class="obj-link hq nb-task" data-act="sheet" data-v="quest"><span class="hq-mark">◆</span><span class="hq-t">수첩 ${nb.i + 1}/${NB_TASKS.length} · ${t.name}</span></button>`;
        html = html.replace('<div class="obj-sub">진행 중인 의뢰가 없다. 도시 의뢰소에서 받을 수 있다.</div>', '')
          .replace('<div class="obj-title">현재 퀘스트</div>', `<div class="obj-title">현재 퀘스트</div>${row}`);
      }
    } catch (e) { /* 무시 */ }
    return html;
  };
}

// 이름을 비운 채 '이야기 시작'을 누르면 오류 토스트만 뜨던 문제: 무작위 이름으로 채워 바로 시작(나중에 바꿀 필요 없이).
if (typeof UI !== 'undefined') {
  const basePs = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'ps-start' && this.pro && !(this.pro.name || '').trim() && this.randomName) {
      const inp = document.querySelector('input[data-act="ps-name"], #ps-name, .ps-name input, input.pro-name-input');
      const typed = inp && inp.value ? inp.value.trim() : '';
      this.pro.name = typed || this.randomName(this.pro.gender || 'M');
      if (!typed) this.toast(`이름을 비워 두어 무작위 이름으로 시작한다: ${this.pro.name}`);
    }
    return basePs.call(this, act, v);
  };
}

// 퀘스트 이동 버튼이 목적지 도시 안에서 "이미 목적지에 와 있다"만 하던 문제: 진행 중인 의뢰면 가까운 알맞은 게이트(사냥이면 괴수 무리)로 안내.
if (typeof UI !== 'undefined' && UI.hqAsk) {
  const baseAsk = UI.hqAsk;
  UI.hqAsk = function (v) {
    try {
      const p = G.player; const t = this.hqTarget(v);
      const q = String(v)[0] === 'q' ? (p.quests || [])[+String(v).slice(1)] : null;
      if (t && q && q.status !== 'done' && t.region === p.region && G.onCity()) {
        const d = (o) => Math.max(Math.abs(o.x - p.x), Math.abs(o.y - p.y));
        const cap = p.rankIdx + (G.party().length >= 2 ? 1 : 0);
        const hunt = /hunt|kill|mob|사냥|처치/.test(`${q.type || ''} ${q.title || ''}`);
        const pool = hunt ? (G.mobs || []).filter((m) => G.revealed(m.x, m.y) && m.tier <= cap) : (G.mapGates || []).filter((g) => G.revealed(g.x, g.y) && g.tier <= cap && !g.final);
        const o = pool.sort((a, b) => d(a) - d(b))[0];
        if (o) return this.handle('travel-xy', `${o.x},${o.y}`);
      }
    } catch (e) { /* 무시 */ }
    return baseAsk.call(this, v);
  };
}

// 3차 평가: 프롤로그 선택지에 소꿉친구 이름이 소개 없이 불쑥 나온다 → 이 이야기에서 처음 나오는 장면에서만 '소꿉친구 ○○'로
if (typeof UI !== 'undefined' && UI.proFill) {
  const baseFill = UI.proFill;
  UI.proFill = function (t) {
    try {
      const s = this.pro; t = String(t);
      if (s && s.friend && t.includes('{friend}')) {
        s.friendIntro ??= s.id;
        if (s.friendIntro === s.id && !/(친구|동생|오빠|언니|형|누나)(인|이자)?\s*\{friend\}/.test(t)) t = t.replace('{friend}', '소꿉친구 {friend}');
      }
    } catch (e) { /* 무시 */ }
    return baseFill.call(this, t);
  };
}

// 3차 평가 '첫 30분': 시험 뒤 통지서·ID 카드·메시지 창이 연달아 떠 피로하다.
// 첫 카드를 받은 직후 소속만 정해진 경우(등급은 그대로)에는 재발급 창 대신 알림 한 줄로 조용히 고쳐 준다.
if (typeof UI !== 'undefined' && UI.showIdCard) {
  const baseShow = UI.showIdCard;
  UI.showIdCard = function (mode) {
    try {
      const p = G.player; const c = p && p.idCard;
      if (mode === 'reissue' && c && (c.gen || 1) === 1 && c.rank === (p.official ?? p.rankIdx) && (c.guild || null) !== (p.guild || null)) {
        G.issueIdCard();
        const g = p.guild && GUILDS[p.guild] ? GUILDS[p.guild].name : '무소속';
        this.toast(fixJosa(`헌터 ID 카드 소속이 ${g}(으)로 바뀌었다. 정보 탭에서 볼 수 있다.`));
        return;
      }
    } catch (e) { /* 무시하고 원래 창 */ }
    return baseShow.apply(this, arguments);
  };
}
