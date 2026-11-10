// 말풍선 관리자 (영역 B, 사용자 제보 — 조사 세션 경유)
// 문제: 튜토리얼 탐색·전투에서 리더 말풍선이 이리저리 옮겨 다니고 여러 개가 겹쳤다.
//  원인 ① 위치를 다시 잡는 곳이 여럿(onboarding.js 0.12초 뒤, eval_ui.js 0.18·0.45·0.9초 뒤, combat_fit.js 메뉴 재배치 뒤)이라
//          같은 말풍선이 서로 다른 자리 사이를 오갔다.
//       ② 말하는 통로가 여럿(안내 말풍선 #coach-pop, 리더 오더 말풍선 .order-bubble, 전투 중 외침 .float-num.say, 탐색 잡담 #party-chatter, 대화창 #dlg)이라 동시에 떴다.
// 규칙(UI.speech):
//  - 안내 말풍선은 #coach-pop 하나뿐. 새 말이 오면 교체, 같은 말은 위치만 갱신.
//  - 위치는 한 번에 정한다: UI.coachPop 감싸기는 여기 한 겹뿐이고, 배치가 자리 잡은 뒤(0.22초) 한 번만 다시 맞춘다. 그때까지 새 말풍선은 숨겨 둔다(튀는 모습이 보이지 않게).
//  - 안내 말풍선이 떠 있는 동안: 오더 말풍선·외침은 숨기고, 탐색 잡담은 대기열에 넣었다가 닫힌 뒤에 띄운다(튜토리얼 대사 우선).
//  - 한 사람의 외침은 동시에 하나(새 외침이 오면 앞의 것을 지운다).
//  - 화면 전환(전투 열기, 대화창, 창 닫힘·새 창)에는 전부 정리.
// 예전에는 UI.coachPop 을 다섯 겹으로 감쌌다. 이제 각 파일은 할 일을 함수로만 내놓고 여기서 차례로 부른다:
//  tut_pause.js → UI.tutHoldBefore, tutorial_map.js → UI.speechDecorate, eval_ui.js → UI.coachFit. onboarding.js 의 지연 재배치는 없앴다.
{
  const popEl = () => document.getElementById('coach-pop');
  const shown = (e) => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const queue = [];
  UI.speech = {
    // 지금 화면에 보이는 말풍선 수 (연기 시험이 쓴다): 안내 + 오더 + 잡담, 그리고 한 사람에게 겹친 외침
    count() {
      const els = [popEl(), ...document.querySelectorAll('.order-bubble'), ...document.querySelectorAll('#party-chatter > *')].filter(shown);
      let n = els.length;
      for (const h of document.querySelectorAll('.fx-host')) { const k = h.querySelectorAll('.float-num.say').length; if (k > 1) n += k - 1; }
      if (document.querySelectorAll('#coach-pop').length > 1) n += 1;
      return n;
    },
    clear() { queue.length = 0; try { UI.coachPop(null); } catch (e) { /* 무시 */ } const p = popEl(); if (p) p.remove(); const ch = document.getElementById('party-chatter'); if (ch) ch.innerHTML = ''; this.sync(); },
    sync() {
      const on = !!popEl();
      document.body.classList.toggle('speech-on', on);
      if (!on && queue.length && !UI._hold) { const ls = queue.splice(0, queue.length); try { baseChatter.call(UI, ls); } catch (e) { /* 무시 */ } }
    },
  };

  // ---- 안내 말풍선: 감싸기는 이 한 겹. 멈춤(tut_pause) → 그리기(ui_mobile) → 얼굴 말풍선(tutorial_map) → 아군 줄 피하기(eval_ui) 순서로 한 번에 ----
  const base = UI.coachPop;
  const place = (ui, node, target, key) => {
    if (ui.tutHoldBefore) try { ui.tutHoldBefore(node, target, key); } catch (e) { /* 무시 */ }
    const r = base.call(ui, node, target, key);
    document.body.classList.toggle('tut-hold', !!ui._hold);
    if (node && popEl()) {
      if (ui.speechDecorate) try { ui.speechDecorate(); } catch (e) { /* 무시 */ }
      if (ui.coachFit) try { ui.coachFit(target); } catch (e) { /* 무시 */ }
    }
    return r;
  };
  UI.coachPop = function (node, target, key) {
    const before = popEl(); const prevKey = before ? before._key : null;
    const r = place(this, node, target, key);
    const pop = popEl();
    if (pop && node) {
      const fresh = !before || prevKey !== pop._key || !this._spSettled;
      if (fresh && target) { pop.style.visibility = 'hidden'; this._spSettled = false; }
      clearTimeout(this._spT);
      const k = pop._key;
      // 배치가 자리 잡은 뒤 한 번만 다시 맞춘다
      this._spT = setTimeout(() => {
        const p = popEl(); if (!p || p._key !== k) return;
        const n = p.querySelector('.coach-card');
        if (n && target && document.body.contains(target)) place(this, n, target, key);
        const q = popEl(); if (q) q.style.visibility = '';
        this._spSettled = true;
      }, target ? 220 : 0);
      if (!target) { pop.style.visibility = ''; this._spSettled = true; }
    } else this._spSettled = false;
    UI.speech.sync();
    return r;
  };

  // ---- 탐색 잡담: 안내가 떠 있으면 대기 ----
  const baseChatter = UI.chatterShow;
  if (baseChatter) UI.chatterShow = function (lines) {
    if (popEl() || this._hold || (this.dlgOpen && this.dlgOpen())) { if (lines && lines.length) queue.push(...lines.slice(0, 3)); return; }
    return baseChatter.call(this, lines);
  };
  setInterval(() => { try { if (queue.length || document.body.classList.contains('speech-on') !== !!popEl()) UI.speech.sync(); } catch (e) { /* 무시 */ } }, 400);

  // ---- 외침: 한 사람에 하나 ----
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && ev.k === 'say') { const t = document.getElementById('u-' + ev.src); if (t) for (const f of t.querySelectorAll('.float-num.say')) f.remove(); }
    return baseApply.call(this, l);
  };

  // ---- 화면 전환: 전부 정리 ----
  const baseOpen = UI.openCombat;
  if (baseOpen) UI.openCombat = function (...a) { try { UI.speech.clear(); } catch (e) { /* 무시 */ } return baseOpen.apply(this, a); };
  const baseDlg = UI.dlgShow;
  if (baseDlg) UI.dlgShow = function (...a) { try { if (popEl()) UI.speech.clear(); } catch (e) { /* 무시 */ } return baseDlg.apply(this, a); };
  for (const name of ['modal', 'closeModal']) {
    const base = UI[name]; if (!base) continue;
    UI[name] = function (...a) { const r = base.apply(this, a); try { UI.speech.sync(); } catch (e) { /* 무시 */ } return r; };
  }
}
