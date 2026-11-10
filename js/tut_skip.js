// ===== 게이트 크로니클: 튜토리얼 건너뛰기 (영역 A, 사용자 요청) =====
// 전에는 시험 입장 대화 동안에만 건너뛰기 버튼이 떴다. 이제 자격 시험(튜토리얼)이 진행되는 내내
// — 입장 대화, 탐색, 전투, 보스 — 화면 오른쪽 위에 떠 있고, 어느 단계에서든 바로 결과(등급 측정·동기 연락처)로 넘어간다.
// 실수로 누르지 않게 두 번 눌러야 한다(첫 번째는 확인 문구로 바뀐다).
{
  const active = () => !!(UI.exam && !UI.exam.skipped && !UI.exam.reveal);
  const baseBtn = UI.tutSkipBtn;
  UI.tutSkipBtn = function (on) {
    const want = on || active();
    const old = document.getElementById('tut-skip');
    if (!want) { if (old) old.remove(); return; }
    if (old) return;
    const b = document.createElement('button'); b.id = 'tut-skip'; b.className = 'ghost small'; b.textContent = '튜토리얼 건너뛰기';
    b.onclick = (e) => { e.stopPropagation(); e.preventDefault(); }; // 누르기는 아래 pointerdown 에서 받는다
    document.body.appendChild(b);
  };
  // 누르기: 안내 말풍선이 화면 터치를 모두 가로채는 동안(tut_pause.js)에도 받도록 window 단계의 pointerdown 으로 받는다
  let armed = 0;
  window.addEventListener('pointerdown', (e) => {
    const b = e.target && e.target.closest && e.target.closest('#tut-skip'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    if (!armed) { b.textContent = '한 번 더 누르면 건너뜁니다'; b.classList.add('armed'); armed = setTimeout(() => { armed = 0; const x = document.getElementById('tut-skip'); if (x) { x.textContent = '튜토리얼 건너뛰기'; x.classList.remove('armed'); } }, 3000); return; }
    clearTimeout(armed); armed = 0; UI.tutSkipNow();
  }, true);
  UI.tutSkipNow = function () {
    if (!active()) return this.tutSkipBtn(false);
    const ex = this.exam; ex.skipped = true; // 먼저 표시해 두어 도중의 화면 갱신이 버튼을 되살리지 않게 한다
    const old = document.getElementById('tut-skip'); if (old) old.remove();
    // 진행 중이던 대화·전투·탐색 창을 정리한다
    if (this.dlg) { this.dlg = null; const d = document.getElementById('dlg'); if (d) d.remove(); }
    if (this._hold && this.tutRelease) try { this.tutRelease(false); } catch (e) { /* 무시 */ }
    try { this.coachPop(null); } catch (e) { /* 무시 */ }
    if (this.ctx && (String(this.ctx.kind || '').startsWith('exam') || this.ctx.tutorial)) this.ctx = null;
    document.querySelectorAll('#coach-pop').forEach((el) => el.remove());
    this.closeModal();
    if (this.screen !== 'game') this.screen = 'game';
    this.render();
    return this.handle('exam-skip');
  };
  // 시험 단계가 바뀔 때마다 버튼 상태를 맞춘다
  const sync = () => { try { UI.tutSkipBtn(false); } catch (e) { /* 무시 */ } };
  for (const name of ['startExam', 'examExplore', 'startExamFight', 'finishExam', 'renderExamEnd', 'endExam', 'openCombat', 'render']) {
    const base = UI[name]; if (!base) continue;
    UI[name] = function (...a) { const r = base.apply(this, a); sync(); return r; };
  }
}
