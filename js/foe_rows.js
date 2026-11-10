// 적 줄 정리 (영역 B, 4-23 사용자 결정 3건 중 "적 줄 어긋남")
//  - 적이 5마리면 한 줄에 4 + 덩그러니 1이 아니라 아랫줄 3 + 윗줄 2로 선다.
//    칸 고정(js/battle_layout.js, 영역 A)은 그대로 쓴다: 아랫줄 0·1·2칸, 윗줄 1·2칸을 주고, 아랫줄은 반 칸 오른쪽으로 밀어 가운데에 맞춘다.
//    밀어 둔 줄의 넷째 칸은 화면 밖으로 반쯤 나가므로 비워 둔다(소환·분열은 윗줄 빈 칸으로).
//  - 크기가 달라도 이름·체력 막대가 줄마다 같은 높이에 오게 하는 것은 css/ui_b.css (줄 아래 기준선 맞춤).
{
  const C = Combat.prototype;
  const baseAll = C.foeAssignAll;
  if (baseAll && C.foeWidth) {
    C.foeAssignAll = function () {
      try {
        const foes = this.units.filter((u) => u.side === 'enemy' && u.alive && !u.fled);
        const fresh = foes.length === 5 && foes.every((u) => !u.slot) && foes.every((u) => this.foeWidth(u) === 1);
        if (fresh && !this._foeRows) {
          const bottom = FOE_ROWS - 1, top = 0;
          const spots = [{ r: bottom, c: 1 }, { r: bottom, c: 0 }, { r: bottom, c: 2 }, { r: top, c: 1 }, { r: top, c: 2 }];
          foes.forEach((u, i) => { u.slot = { r: spots[i].r, c: spots[i].c, w: 1 }; });
          this._foeRows = { shift: bottom };
        }
      } catch (e) { /* 실패하면 기본 배치 */ }
      return baseAll.call(this);
    };
    // 반 칸 밀어 둔 줄의 마지막 칸은 쓰지 않는다
    const baseFree = C.foeFreeSlot;
    C.foeFreeSlot = function (w, near) {
      const sh = this._foeRows ? this._foeRows.shift : null;
      if (sh == null) return baseFree.call(this, w, near);
      const blocker = { side: 'enemy', alive: true, fled: false, slot: { r: sh, c: FOE_COLS - 1, w: 1 }, _ghost: true };
      this.units.push(blocker);
      try { return baseFree.call(this, w, near); } finally { const i = this.units.indexOf(blocker); if (i >= 0) this.units.splice(i, 1); }
    };
  }
  const baseRefresh = UI.refreshUnits;
  UI.refreshUnits = function (...a) {
    const r = baseRefresh.apply(this, a);
    try {
      const cb = this.ctx && this.ctx.combat; const sh = cb && cb._foeRows ? cb._foeRows.shift : null;
      if (cb) for (const u of cb.units) {
        if (u.side !== 'enemy') continue;
        const el = document.getElementById('u-' + u.id); if (el) el.classList.toggle('row-shift', sh != null && !!u.slot && u.slot.r === sh);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
}
