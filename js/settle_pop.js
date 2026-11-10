// 전투 결과·탐색 사건 결과를 화면 가운데 정산 팝업으로 (영역 B, 사용자 요청)
// - 전투: 결과(획득·상황·다음 행동 버튼)를 아래 조작 영역 대신 전장 위 가운데 팝업에. 조작 영역은 높이 그대로 잠긴다.
// - 게이트 층 지도: 칸에서 일어난 일(사건·휴식·층 이동)의 결과 줄을 지도 아래가 아니라 가운데 팝업으로, [확인]으로 닫는다.
{
  const pop = (host, html, cls) => {
    const old = host.querySelector(':scope > .settle-pop'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'settle-pop ' + (cls || '');
    el.innerHTML = `<div class="settle-box">${html}</div>`;
    host.appendChild(el);
    if (typeof SFX !== 'undefined') SFX.play('heal');
    return el;
  };

  // ---------- 전투 결과 ----------
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try {
      const c = this.ctx; const cb = c && c.combat; const box = document.getElementById('cb-ctrl'); const mb = document.getElementById('modal-box');
      if (!cb || !box || !mb || !cb.result || c.playing || !box.children.length) return r;
      // 토벌 전투는 승리 팝업을 거치지 않고 바로 실제 정산(획득 내역) 창으로
      if (cb.result === 'win' && c.kind === 'mob' && !c._settled) { c._settled = true; setTimeout(() => { if (this.ctx === c) this.finishPersonalCombat(); }, 0); return r; }
      const head = cb.result === 'win' ? '전투 승리' : cb.result === 'flee' ? '전장 이탈' : cb.result === 'lose' ? '패배' : '전투 종료';
      const frag = document.createElement('div'); while (box.firstChild) frag.appendChild(box.firstChild);
      // 제목과 겹치는 "승리/패배/이탈" 줄은 빼고, 게이트 전투는 이번 전투에서 얻은 것을 정산해 보여 준다
      const res = frag.querySelector('.result');
      if (res) {
        if (c.kind === 'gate' && cb.result === 'win') {
          const kills = cb.kills || []; const b0 = c._lootBefore || { money: 0, ether: 0 };
          const money = Math.max(0, (c.loot.money || 0) - (b0.money || 0)), ether = Math.max(0, (c.loot.ether || 0) - (b0.ether || 0));
          const sub = res.querySelector('b'); const what = sub ? sub.textContent : '';
          res.outerHTML = `<div class="settle-rows">${what && what !== '승리' ? `<div class="settle-sub">${what}</div>` : ''}
            <div class="sr"><span>처치</span><b>${kills.length}마리</b></div>
            <div class="sr"><span>크레딧</span><b class="amber">+${fmt(money)}</b></div>
            <div class="sr"><span>에테르</span><b class="ether">+${fmt(ether)}</b></div>
            <div class="sr dim"><span>이번 게이트 누적</span><b>${fmt(c.loot.money)} 크레딧 · 에테르 ${fmt(c.loot.ether)}</b></div>
            <div class="small dim">코어·장비는 게이트를 나갈 때 한꺼번에 정산된다.</div></div>`;
        } else res.remove();
      }
      const el = pop(mb, `<div class="settle-head ${cb.result}">${head}</div>`, 'combat ' + cb.result);
      el.querySelector('.settle-box').appendChild(frag);
      // 조작 영역은 비운 채 높이 유지
      box.classList.remove('cb-done'); box.classList.add('settled');
    } catch (e) { /* 실패하면 원래대로 아래에 */ }
    return r;
  };

  // 전투 시작 때 게이트 누적 보상을 기억해 두고, 끝나면 차이를 "이번 전투"로 보여 준다
  const baseOpen = UI.openCombat;
  UI.openCombat = function (...a) { const c = this.ctx; if (c && c.loot) c._lootBefore = { money: c.loot.money || 0, ether: c.loot.ether || 0 }; return baseOpen.apply(this, a); };

  // ---------- 게이트 층 지도의 결과 줄 ----------
  const baseMap = UI.renderGateMap;
  if (baseMap) UI.renderGateMap = function (note, ...a) {
    const r = baseMap.call(this, null, ...a);
    if (note) {
      try {
        const mb = document.getElementById('modal-box');
        if (mb) pop(mb, `<div class="settle-text">${fixJosa(note)}</div><div class="row end"><button class="primary" data-act="settle-close">확인</button></div>`, 'note');
      } catch (e) { /* 무시 */ }
    }
    return r;
  };

  // 토벌 정산 창: 제목을 "전투 승리"로, 획득 줄은 하나씩 나오게
  const baseFinish = UI.finishPersonalCombat;
  if (baseFinish) UI.finishPersonalCombat = function (...a) {
    const r = baseFinish.apply(this, a);
    try {
      const mb = document.getElementById('modal-box'); const h = mb && mb.querySelector(':scope > h3');
      if (h && /토벌 완료/.test(h.textContent)) { h.textContent = '전투 승리'; h.classList.add('settle-title'); mb.classList.add('settle-modal'); if (this.revealRewards) this.revealRewards(); }
    } catch (e) { /* 무시 */ }
    return r;
  };

  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'settle-close') { const el = document.querySelector('#modal-box > .settle-pop'); if (el) el.remove(); return; }
    return baseHandle.call(this, act, v);
  };
}
