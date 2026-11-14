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
          <div class="cs-face-wrap">${isMvp ? '<em class="cs-badge">MVP</em>' : `<em class="cs-ord">${i + 1}</em>`}<div class="cs-face">${faceOf(u, 40)}</div></div>
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

  const takeQty = (s) => {
    const m = /^(.*?)\s*(?:×\s*|\s)?(\d+)\s*개?$/.exec(String(s || '').trim());
    return m ? { name: m[1].trim(), n: +m[2] } : { name: String(s || '').trim(), n: 1 };
  };
  const classifyLootName = (name) => {
    const n = String(name || '').trim();
    if (!n) return null;
    if (/코어/.test(n)) return '괴수 코어';
    if (/유물/.test(n)) return '유물 발견';
    if (/각성 촉매/.test(n)) return '전리품';
    if (/갑옷|투구|장갑|장화|망토|방패|검|도|창|활|총|지팡이|단검|장신구|반지|목걸이|장비/.test(n)) return '장비 획득';
    return '전리품';
  };
  const parseLootLine = (text) => {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (!t || /건진 코어가 없다|쓰러지면|게이트 누적/.test(t)) return [];
    const headed = /^(괴수 코어|부산물|유물 발견|보스 드롭|장비 획득|전리품)\s*:\s*(.+)$/.exec(t);
    if (headed) {
      const kind = headed[1];
      return headed[2].split(/,\s*/).map((part) => {
        const q = takeQty(part); if (!q.name) return null;
        let name = q.name;
        if (kind === '괴수 코어' && !/코어$/.test(name) && /급$/.test(name)) name += ' 코어';
        return { kind, name, n: q.n };
      }).filter(Boolean);
    }
    const q = takeQty(t); if (!q.name) return [];
    return [{ kind: classifyLootName(q.name), name: q.name, n: q.n }];
  };
  const chipOf = (it) => (UI.itemChip
    ? UI.itemChip(it.kind, it.name, it.n)
    : `<button type="button" class="ss-item" data-act="item-info" data-v="${encodeURIComponent(it.kind || '')}|${encodeURIComponent(it.name || '')}">${it.name}${it.n > 1 ? `<b>×${it.n}</b>` : ''}</button>`);

  const wireLootChips = (loot) => {
    if (!loot || loot.dataset.csChips) return;
    loot.dataset.csChips = '1';
    for (const line of [...loot.querySelectorAll('.sr-line')]) {
      if (line.classList.contains('dim') && /없다/.test(line.textContent)) continue;
      const items = parseLootLine(line.textContent);
      if (!items.length) continue;
      const wrap = document.createElement('div');
      wrap.className = 'cs-loot-chips ss-items';
      wrap.innerHTML = items.map(chipOf).join('');
      line.replaceWith(wrap);
    }
  };

  // 제목 → 이번 획득 → MVP·파티 결산 → 버튼 순으로 맞춘다 (획득이 스크롤 아래로 밀리지 않게)
  const baseControls = UI.renderControls;
  UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try {
      const box = document.querySelector('#modal-box > .settle-pop.combat .settle-box');
      if (!box) return r;
      const head = box.querySelector('.settle-head');
      let loot = box.querySelector('.settle-rows');
      const board = box.querySelector('.combat-settle');
      const btns = box.querySelector('.row.end');
      // 게이트가 아닌 승리(토벌은 별도 창)에서도 처치·드롭 요약이 있으면 획득 칸으로 올린다
      if (!loot && board) {
        const c = this.ctx; const cb = c && c.combat;
        if (cb && cb.result === 'win') {
          const kills = cb.kills || [];
          const lines = cb._lootLines || [];
          const money = c.kind === 'gate' && c.loot ? Math.max(0, (c.loot.money || 0) - ((c._lootBefore && c._lootBefore.money) || 0)) : null;
          const ether = c.kind === 'gate' && c.loot ? Math.max(0, (c.loot.ether || 0) - ((c._lootBefore && c._lootBefore.ether) || 0)) : null;
          if (kills.length || lines.length || money || ether) {
            loot = document.createElement('div');
            loot.className = 'settle-rows';
            loot.innerHTML = `${money != null ? `<div class="sr"><span>크레딧</span><b class="amber">+${fmt(money)}</b></div>` : ''}
              ${ether != null ? `<div class="sr"><span>에테르</span><b class="ether">+${fmt(ether)}</b></div>` : ''}
              ${kills.length ? `<div class="sr"><span>처치</span><b>${kills.length}마리</b></div>` : ''}
              ${lines.map((l) => `<div class="sr-line">${fixJosa(l)}</div>`).join('') || ''}`;
            // 결산 보드는 settle_pop이 옮긴 임시 div 안에 있을 수 있다.
            // box의 직접 자식이라고 가정하면 실제 처치가 있는 시험 승리에서
            // 예외가 나 확인 버튼·스크롤 영역 정리까지 실행되지 않는다.
            board.before(loot);
          }
        }
      }
      if (loot && !loot.querySelector('.cs-loot-h')) {
        loot.insertAdjacentHTML('afterbegin', '<div class="cs-loot-h"><span>이번 획득</span><span class="dim">눌러 상세</span></div>');
        loot.classList.add('cs-loot');
      } else if (loot) {
        const h = loot.querySelector('.cs-loot-h');
        if (h && !h.querySelector('.dim')) h.insertAdjacentHTML('beforeend', '<span class="dim">눌러 상세</span>');
      }
      if (loot) wireLootChips(loot);
      if (head && loot) head.after(loot);
      if (loot && board) loot.after(board);
      if (btns) box.appendChild(btns);
      // settle_pop이 감싸 둔 빈 껍데기 div 정리
      for (const el of [...box.children]) {
        if (el.tagName === 'DIV' && !el.className && !el.children.length) el.remove();
      }
      // 확인 버튼은 스크롤 밖 하단에 고정
      if (btns && !box.querySelector(':scope > .settle-scroll')) {
        const scroll = document.createElement('div');
        scroll.className = 'settle-scroll';
        for (const el of [...box.children]) {
          if (el === btns || el.classList.contains('settle-scroll')) continue;
          scroll.appendChild(el);
        }
        box.insertBefore(scroll, btns);
      } else if (btns) {
        box.appendChild(btns);
      }
    } catch (e) { /* 무시 */ }
    return r;
  };
})();
