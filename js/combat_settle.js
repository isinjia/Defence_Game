// ===== 게이트 크로니클: 전투 결산 보드 (승리·패배) =====
// 기존 mvpHtml(한 줄+접기) 대신 파티 전원 피해·치유·피격을 펼쳐 보여 주고 MVP를 강조한다.
(() => {
  const faceOf = (u, size) => {
    try {
      if (!u || u.summon) return '';
      if (u.isPlayer) return (UI.playerBust ? UI.playerBust(size) : UI.playerAvatar(size)) || '';
      if (u.npcId != null) {
        const n = G.npcById(u.npcId);
        if (n) return (UI.npcBust ? UI.npcBust(n, size) : UI.npcAvatar(n, size)) || '';
      }
      if (typeof UI.unitAvatar === 'function') return UI.unitAvatar(u, size) || '';
    } catch (e) { /* 무시 */ }
    return '';
  };
  const nameOf = (u) => (u.isPlayer ? (G.player && G.player.name) || '나' : String(u.name || '').replace(/\(.*\)$/, ''));
  const bar = (v, max, cls) => `<i class="${cls || ''}" style="width:${Math.max(0, Math.min(100, Math.round((v / Math.max(1, max)) * 100)))}%"></i>`;

  UI.mvpHtml = function () {
    const c = this.ctx; if (!c || !c.combat || !c.combat.units) return '';
    const cb = c.combat;
    if (!cb.result || cb.result === 'flee') return '';
    const list = this.combatStats(cb);
    if (!list.length) return '';
    const top = list[0];
    const scored = top && top.score > 0;

    if (!cb.mvpDone) {
      cb.mvpDone = true;
      if (scored) {
        const u = top.unit;
        if (!u.isPlayer && u.npcId != null && cb.result === 'win') {
          const n = G.npcById(u.npcId); if (n) G.changeRel(n, 2, '함께 싸운 전투에서 MVP로 인정받았다');
          cb.mvpSay = RNG.pick((typeof MVP_LINE !== 'undefined' && MVP_LINE[u.pers]) || ['좋았어.']);
        }
        if (u.isPlayer && cb.result === 'win') G.player.mvpCount = (G.player.mvpCount || 0) + 1;
      }
    }

    const maxDealt = Math.max(1, ...list.map((s) => s.dealt));
    const maxHeal = Math.max(1, ...list.map((s) => s.heal));
    const maxTaken = Math.max(1, ...list.map((s) => s.taken));

    const mvpHead = scored ? `<div class="cs-mvp">
      <div class="cs-mvp-face">${faceOf(top.unit, 64)}</div>
      <div class="cs-mvp-body">
        <div class="cs-mvp-line"><span class="mvp-tag">MVP</span><b>${nameOf(top.unit)}</b></div>
        ${cb.mvpSay ? `<p class="cs-say">"${cb.mvpSay}"</p>` : ''}
        <p class="cs-mvp-sum small">피해 <b class="num">${fmt(Math.round(top.dealt))}</b> · 치유 <b class="num">${fmt(Math.round(top.heal))}</b> · 피격 <b class="num">${fmt(Math.round(top.taken))}</b>${top.kills ? ` · 처치 <b class="num">${top.kills}</b>` : ''}</p>
      </div>
    </div>` : `<div class="cs-mvp empty"><span class="small dim">이번 전투에 뚜렷한 MVP는 없다.</span></div>`;

    const rows = list.map((s, i) => {
      const u = s.unit;
      const isMvp = scored && s === top;
      const down = !(u.hp > 0);
      return `<div class="cs-row ${isMvp ? 'is-mvp' : ''} ${down ? 'down' : ''}">
        <div class="cs-who">
          <div class="cs-face">${faceOf(u, 40)}${isMvp ? '<em class="cs-badge">MVP</em>' : `<em class="cs-ord">${i + 1}</em>`}</div>
          <div class="cs-name"><b>${nameOf(u)}</b><span class="small dim">${down ? '전투 불능' : `잔여 ${Math.round(u.hp)}`}${s.kills ? ` · 처치 ${s.kills}` : ''}</span></div>
        </div>
        <div class="cs-cols">
          <div class="cs-col"><span>피해</span><b class="num">${fmt(Math.round(s.dealt))}</b>${bar(s.dealt, maxDealt, 'dmg')}</div>
          <div class="cs-col"><span>치유</span><b class="num">${fmt(Math.round(s.heal))}</b>${bar(s.heal, maxHeal, 'heal')}</div>
          <div class="cs-col"><span>피격</span><b class="num">${fmt(Math.round(s.taken))}</b>${bar(s.taken, maxTaken, 'taken')}</div>
        </div>
      </div>`;
    }).join('');

    return `<div class="combat-settle" data-result="${cb.result}">${mvpHead}<div class="cs-head"><span>파티 결산</span><span class="dim">${list.length}명</span></div><div class="cs-list">${rows}</div></div>`;
  };
})();
