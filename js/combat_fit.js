// 전투 화면 한눈에 (영역 B, docs/구현_대기목록.md 4-0)
// 전투 상자를 화면 높이에 고정하고 머리말·전장(적·아군)·조작으로 나눈다.
// 그린 뒤 전장이 넘치면 적 그림을 단계적으로 줄이고(120→92→72→56→44), 그래도 넘치면 이름·체력 숫자를 숨긴다.
{
  const SIZES = [120, 92, 72, 56, 44];
  UI.combatFit = function () {
    const box = document.getElementById('modal-box'); const st = document.getElementById('stage');
    if (!box || !st || !box.classList.contains('combat-box')) return;
    const c = this.ctx; if (!c || !c.combat) return;
    box.classList.add('fit');
    // 가장 큰 단계부터 넣어 보고, 넘치면 한 단계씩 줄인다
    let lv = 0;
    const apply = (k) => {
      box.style.setProperty('--fs', SIZES[Math.min(k, SIZES.length - 1)] + 'px');
      box.classList.toggle('fit-tight', k >= SIZES.length);      // 이름 숨김
      box.classList.toggle('fit-tiny', k >= SIZES.length + 1);   // 체력 숫자·상태 숨김
    };
    // 적 줄은 가운데 정렬이라 위로도 넘친다: 자식들의 실제 위·아래 끝을 잰다
    const fz = document.getElementById('foes');
    const spill = (host) => { if (!host) return false; const r = host.getBoundingClientRect(); for (const ch of host.children) { const q = ch.getBoundingClientRect(); if (q.height && (q.top < r.top - 1 || q.bottom > r.bottom + 1)) return true; } return false; };
    const over = () => st.scrollHeight > st.clientHeight + 1 || box.scrollHeight > box.clientHeight + 1 || spill(fz);
    apply(lv);
    while (over() && lv < SIZES.length + 1) apply(++lv);
    c.fitLv = lv;
  };

  const later = () => { if (UI._fitRaf) return; UI._fitRaf = requestAnimationFrame(() => { UI._fitRaf = 0; try { UI.combatFit(); } catch (e) { /* 무시 */ } }); };
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { const r = baseOpen.apply(this, a); try { this.combatFit(); } catch (e) { /* 무시 */ } return r; };
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    // 조작 줄 글자 줄이기 (한 줄에 들어가게)
    try {
      const short = { potion: '회복제', mana: '마나' };
      for (const b of document.querySelectorAll('#cb-ctrl .ctrl-row [data-act=c-item]')) { const n = b.querySelector('.num'); if (short[b.dataset.v] && n) b.innerHTML = `${short[b.dataset.v]} ${n.outerHTML}`; }
      const sp = document.querySelector('#cb-ctrl [data-act=c-speed]'); if (sp) sp.textContent = sp.textContent.includes('2') ? '2배' : '1배';
      const au = document.querySelector('#cb-ctrl [data-act=c-auto]'); if (au) au.textContent = au.textContent.includes('중지') ? '자동 끄기' : '자동';
    } catch (e) { /* 무시 */ }
    later(); return r;
  };
  // 소환수 등 유닛 수가 바뀌면 다시 맞춘다
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const r = baseRefresh.apply(this, a);
    const n = document.querySelectorAll('#stage .foe, #stage .ally').length;
    if (n !== this._fitN) { this._fitN = n; later(); }
    return r;
  };
  window.addEventListener('resize', later);
}
