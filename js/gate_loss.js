// 게이트에서 쓰러졌을 때의 손실 (영역 B가 사용자 요청으로 추가 — 정산 팝업과 한 묶음)
// 보상은 전투마다 그때그때 받지만, 게이트 안에서 쓰러지면 그 게이트에서 얻은 것을 거의 다 잃는다.
//  - 이번 게이트에서 얻은 아이템(코어·부산물·장비·소모품·유물)은 하나하나 20% 확률로만 건진다.
//  - 크레딧·에테르 누적분은 전부 잃는다(기존 규칙 그대로).
//  - 차고 있던 장비는 칸마다 50% 확률로 잃는다.
const GATE_LOSS = { keep: 0.2, equipLoss: 0.5 };
{
  const snap = (p) => ({
    mats: { ...(p.mats || {}) }, parts: { ...(p.parts || {}) }, items: { ...(p.items || {}) },
    inv: (p.inventory || []).map((it) => it.uid), relics: (p.relics || []).map((r) => r.uid),
  });
  // 게이트에 들어갈 때의 소지품을 기억한다
  const baseStart = UI.startGate;
  Game.prototype.gateSnapNow = function () { try { this._gateSnap = snap(this.player); } catch (e) { this._gateSnap = null; } };
  if (baseStart) UI.startGate = function (...a) { G.gateSnapNow(); return baseStart.apply(this, a); };
  // 진입 전 상의 창 등으로 startGate 가 여러 번 불려도, 실제 게이트 안 첫 화면에서 한 번 더 확실히 기억한다
  const baseMap = UI.renderGateMap;
  if (baseMap) UI.renderGateMap = function (...a) { const c = this.ctx; if (c && c.kind === 'gate' && !c._snapped) { c._snapped = true; if (!G._gateSnap) G.gateSnapNow(); } return baseMap.apply(this, a); };

  const baseFinish = Game.prototype.finishGate;
  Game.prototype.finishGate = function (gate, result, ...rest) {
    const lines = baseFinish.call(this, gate, result, ...rest);
    const s = this._gateSnap; this._gateSnap = null;
    if (result !== 'lose' || !s || !Array.isArray(lines)) return lines;
    try {
      const p = this.player; const keep = () => RNG.chance(GATE_LOSS.keep);
      let lost = 0, kept = 0;
      // 쌓이는 것(코어·부산물·소모품): 늘어난 개수만큼 하나씩 판정
      for (const key of ['mats', 'parts', 'items']) {
        const cur = p[key] || {}; const old = s[key] || {};
        for (const k of Object.keys(cur)) {
          const gain = (cur[k] || 0) - (old[k] || 0); if (gain <= 0) continue;
          let k2 = 0; for (let i = 0; i < gain; i++) if (keep()) k2++;
          cur[k] = (old[k] || 0) + k2; lost += gain - k2; kept += k2;
        }
      }
      // 장비·유물: 새로 얻은 것 하나하나
      const newInv = (p.inventory || []).filter((it) => !s.inv.includes(it.uid));
      for (const it of newInv) { if (keep()) kept++; else { p.inventory.splice(p.inventory.indexOf(it), 1); lost++; } }
      const newRel = (p.relics || []).filter((r) => !s.relics.includes(r.uid));
      for (const r of newRel) { if (keep()) kept++; else { p.relics.splice(p.relics.indexOf(r), 1); lost++; } }
      if (lost || kept) lines.push(`<span class="bad">이번 게이트에서 얻은 것 ${lost + kept}개 중 ${lost}개를 잃었다.</span>${kept ? ` 겨우 ${kept}개만 건졌다.` : ''}`);
      // 차고 있던 장비: 칸마다 50%
      const gone = [];
      for (const slot of Object.keys(p.equip || {})) {
        const it = p.equip[slot]; if (!it || !RNG.chance(GATE_LOSS.equipLoss)) continue;
        gone.push(it.name); p.equip[slot] = null;
      }
      if (gone.length) { lines.push(`<span class="bad">차고 있던 장비를 잃었다: ${gone.join(', ')}</span>`); this.lifeEvent(`게이트에서 쓰러져 ${gone.join(', ')}을(를) 잃었다.`); }
      this.recalc(); p.hp = Math.min(p.hp, p.maxHp); p.mp = Math.min(p.mp, p.maxMp);
    } catch (e) { /* 손실 처리 실패는 게임을 막지 않는다 */ }
    return lines;
  };
}
