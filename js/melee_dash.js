// ===== 근접 공격 연출: 공격하는 쪽이 대상에게 빠르게 달려가 치고 돌아온다 (사용자 요청, 2026-11-16) =====
// - 근접·원거리 판정은 js/attack_range.js (일반 공격은 무기·생김새, 스킬은 거리 속성). 아군·괴수·소환수 모두 같다.
// - 전투 기록(log)에서 '시전' 사건 뒤 처음 맞는 대상을 찾아 cast 사건에 dashTo(대상 id)를 붙이고, 화면은 그쪽으로 달려간다.
// - 원거리·지원 기술은 지금처럼 제자리 연출.
{
  const CP = Combat.prototype; const baseUse = CP.useSkill;
  CP.useSkill = function (u, skill, target) {
    const from = this.log.length;
    const r = baseUse.call(this, u, skill, target);
    try {
      const range = typeof G !== 'undefined' && G.skillRange ? G.skillRange(skill, u) : null;
      if (range === 'melee') {
        const L = this.log;
        for (let i = from; i < L.length; i++) {
          const ev = L[i] && L[i].ev; if (!ev || ev.k !== 'cast' || ev.src !== u.id) continue;
          for (let j = i + 1; j < L.length; j++) {
            const e2 = L[j] && L[j].ev; if (!e2) continue;
            if (e2.k === 'cast') break;
            if ((e2.k === 'dmg' || e2.k === 'miss') && e2.dst && e2.dst !== u.id) { ev.dashTo = e2.dst; break; }
          }
          break;
        }
      }
    } catch (e) { /* 연출 정보만 못 붙임 */ }
    return r;
  };
}

if (typeof UI !== 'undefined') {
  const css = document.createElement('style');
  css.textContent = `.melee-dashing { position: relative; z-index: 30; transition: transform .16s cubic-bezier(.3,.7,.4,1); will-change: transform; }
.melee-back { transition: transform .22s ease-out; }`;
  document.head.appendChild(css);
  let back = null; // 돌아올 사람
  const goHome = () => {
    if (!back) return; const s = back; back = null;
    s.classList.add('melee-back'); s.style.transform = '';
    setTimeout(() => s.classList.remove('melee-dashing', 'melee-back'), 240);
  };
  const baseApply = UI.applyEvent;
  UI.applyEvent = function (l) {
    const ev = l && l.ev;
    if (ev && ev.k === 'cast') goHome();
    const r = baseApply.call(this, l);
    if (!ev) return r;
    try {
      if (ev.k === 'cast' && ev.dashTo && !(FX && FX.reduced)) {
        const s = document.getElementById('u-' + ev.src); const t = document.getElementById('u-' + ev.dashTo);
        if (s && t) {
          s.classList.remove('lunge-up', 'lunge-down');
          const a = s.getBoundingClientRect(); const b = t.getBoundingClientRect();
          // 대상 바로 앞까지 (거리의 약 80%)
          const dx = (b.left + b.width / 2 - (a.left + a.width / 2)) * 0.8; const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) * 0.8;
          s.classList.add('melee-dashing'); s.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
          back = s;
          return Math.max(r || 0, 190); // 도착한 뒤에 맞는다
        }
      }
      // 맞고 나면 돌아온다 (같은 공격의 다음 타가 이어지면 다음 시전 때 돌아온다)
      if (back && (ev.k === 'dmg' || ev.k === 'miss' || ev.k === 'down')) {
        const wait = r || 0; setTimeout(() => { if (back) goHome(); }, Math.min(260, wait));
      }
      if (ev.k === 'end' || ev.k === 'victory' || ev.k === 'defeat') goHome();
    } catch (e) { /* 무시 */ }
    return r;
  };
}
