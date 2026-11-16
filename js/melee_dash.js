// ===== 근접 공격 연출: 공격하는 쪽이 대상에게 빠르게 달려가 치고 돌아온다 (사용자 요청, 2026-11-16) =====
// - 근접·원거리 판정은 js/attack_range.js (일반 공격은 무기·생김새, 스킬은 거리 속성). 아군·괴수·소환수 모두 같다.
// - 전투 기록(log)에 맞는 순서대로 dash(대상으로 달려가기)·dashBack(돌아오기) 사건을 끼워 넣는다. 무작위 연타는 대상마다 옮겨 다니고, 전체 공격은 적 무리 한가운데로 한 번 파고든다.
// - 원거리·지원 기술은 지금처럼 제자리 연출.
{
  // 근접 공격이면 맞는 순서대로 '달려가기(dash)' 사건을 끼워 넣는다. 대상이 바뀔 때마다 옮겨 가고, 마지막 타 뒤에 '돌아오기(dashBack)'.
  const CP = Combat.prototype; const baseUse = CP.useSkill;
  CP.useSkill = function (u, skill, target) {
    const from = this.log.length;
    const r = baseUse.call(this, u, skill, target);
    try {
      const range = typeof G !== 'undefined' && G.skillRange ? G.skillRange(skill, u) : null;
      if (range === 'melee') {
        const L = this.log;
        let i = from; while (i < L.length && !(L[i] && L[i].ev && L[i].ev.k === 'cast' && L[i].ev.src === u.id)) i++;
        if (i < L.length) {
          let end = L.length; for (let j = i + 1; j < L.length; j++) { const e = L[j] && L[j].ev; if (e && e.k === 'cast') { end = j; break; } }
          // 전체 공격(독무 같은 광역)은 적 무리 한가운데로 한 번 파고들어 쓰고 나온다
          const WIDE = ['aoe', 'm_aoedot', 'm_aoestun', 'm_aoedebuff', 'm_blast'];
          if (WIDE.includes(skill.type)) {
            const hits = []; let last2 = -1;
            for (let j = i + 1; j < end; j++) { const e = L[j] && L[j].ev; if (e && (e.k === 'dmg' || e.k === 'miss') && e.dst && e.dst !== u.id) { if (!hits.includes(e.dst)) hits.push(e.dst); last2 = j; } else if (e && e.k === 'down' && last2 === j - 1) last2 = j; }
            if (hits.length) {
              L.splice(last2 + 1, 0, { t: '', cls: 'dash', ev: { k: 'dashBack', src: u.id } });
              L.splice(i + 1, 0, { t: '', cls: 'dash', ev: { k: 'dash', src: u.id, dsts: hits } });
            }
            return r;
          }
          const out = []; let at = null; let last = -1;
          for (let j = i + 1; j < end; j++) {
            const e = L[j] && L[j].ev;
            if (e && (e.k === 'dmg' || e.k === 'miss') && e.dst && e.dst !== u.id) {
              if (e.dst !== at) { out.push({ t: '', cls: 'dash', ev: { k: 'dash', src: u.id, dst: e.dst } }); at = e.dst; }
              out.push(L[j]); last = out.length;
              continue;
            }
            out.push(L[j]);
            if (e && e.k === 'down' && last === out.length - 1) last = out.length; // 쓰러짐까지 보고 돌아온다
          }
          if (at) { out.splice(last, 0, { t: '', cls: 'dash', ev: { k: 'dashBack', src: u.id } }); L.splice(i + 1, end - i - 1, ...out); }
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
    if (ev && ev.k === 'dash') {
      try {
        const s = document.getElementById('u-' + ev.src);
        const ts = (ev.dsts || [ev.dst]).map((id) => document.getElementById('u-' + id)).filter(Boolean);
        if (!s || !ts.length || (FX && FX.reduced)) return 0;
        if (back && back !== s) goHome();
        s.classList.remove('lunge-up', 'lunge-down', 'melee-back');
        const prev = s.style.transform; s.style.transform = ''; const a = s.getBoundingClientRect(); s.style.transform = prev;
        // 한 대상이면 그 바로 앞(거리의 약 80%), 여럿이면 그 무리의 한가운데로
        const cs = ts.map((t) => { const b = t.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
        const cx = cs.reduce((v, c) => v + c[0], 0) / cs.length; const cy = cs.reduce((v, c) => v + c[1], 0) / cs.length;
        const k = ts.length > 1 ? 1 : 0.8;
        const dx = (cx - (a.left + a.width / 2)) * k; const dy = (cy - (a.top + a.height / 2)) * k;
        s.classList.add('melee-dashing'); s.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
        back = s;
        return 180; // 도착한 뒤에 맞는다
      } catch (e) { return 0; }
    }
    if (ev && ev.k === 'dashBack') { goHome(); return 120; }
    if (ev && ev.k === 'cast') goHome();
    return baseApply.call(this, l);
  };
}
