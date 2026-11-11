// ===== 게이트 크로니클: 아이템 상세 팝업 (영역 E·B, 사용자 요청) =====
// 정산서「얻은 물건」칩·팀 정산·가방·상점·소모품 등에서 아이템을 누르거나 터치하면
// 스킬 정보 카드와 같은 오버레이로 이름·종류·효과·시세·용도를 보여 준다.
{
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const rankOf = (name) => {
    const m = /^([FEDCBA]|SS?)급\s*(.*)$/.exec(String(name || '').trim());
    if (!m) return null;
    const tier = RANKS.findIndex((r) => r.key === m[1]);
    return tier < 0 ? null : { tier, rest: m[2].trim() };
  };
  const KIND_LABEL = { '괴수 코어': '괴수 코어', '부산물': '괴수 부산물', '유물 발견': '유물', '보스 드롭': '보스 드롭', '장비 획득': '장비', '전리품': '전리품', core: '괴수 코어', part: '괴수 부산물', relic: '유물', cons: '소모품', equip: '장비', cat: '각성 촉매' };
  const KIND_ICON = { '괴수 코어': '◆', '부산물': '⬢', '유물 발견': '✦', '보스 드롭': '★', '장비 획득': '⚔', '전리품': '•', core: '◆', part: '⬢', relic: '✦', cons: '◆', equip: '⚔', cat: '◇' };
  const KIND_COLOR = { '괴수 코어': '#ffb547', core: '#ffb547', '부산물': '#7ec8a3', part: '#7ec8a3', '유물 발견': '#d9b0ff', relic: '#d9b0ff', '보스 드롭': '#d9b0ff', '장비 획득': '#9ec5ff', equip: '#9ec5ff', cons: '#4fb3ff', cat: '#ffe066', '전리품': '#9aa6b8' };

  const parseRef = (v) => {
    if (!v) return null;
    if (typeof v === 'object') return v;
    const s = String(v);
    if (s.startsWith('equip:')) return { type: 'equip', uid: s.slice(6) };
    if (s.startsWith('cons:')) return { type: 'cons', id: s.slice(5) };
    if (s.startsWith('core:')) return { type: 'core', tier: +s.slice(5) };
    if (s.startsWith('part:')) { const [, id, t] = s.split(':'); return { type: 'part', id, tier: +t }; }
    if (s.startsWith('relic:')) { const [, id, g] = s.split(':'); return { type: 'relic', id, grade: +g }; }
    if (s.startsWith('cat:')) return { type: 'cat', tier: +s.slice(4) };
    // kind|name (정산서 칩)
    const bar = s.indexOf('|');
    if (bar >= 0) return { type: 'named', kind: decodeURIComponent(s.slice(0, bar)), name: decodeURIComponent(s.slice(bar + 1)) };
    return { type: 'named', kind: '', name: decodeURIComponent(s) };
  };

  const resolveNamed = (kind, name) => {
    const n = String(name || '').trim();
    if (!n) return null;
    // 유물: "희귀 유물 [용암의 심장]" / "용암의 심장 (희귀)" / 이름만
    let rname = n; let gname = null;
    const bracket = /^(.+?)\s*유물\s*\[(.+?)\]$/.exec(n) || /^\[(.+?)\]$/.exec(n);
    const paren = /^(.+?)\s*\((.+?)\)$/.exec(n);
    if (bracket) { rname = (bracket[2] || bracket[1]).trim(); gname = bracket[2] ? bracket[1].trim() : null; }
    else if (paren && RARITY.some((x) => x.name === paren[2])) { rname = paren[1].trim(); gname = paren[2].trim(); }
    if (kind === '유물 발견' || kind === '보스 드롭' || bracket || (paren && gname)) {
      const R = (typeof RELICS !== 'undefined' ? RELICS : []).find((r) => r.name === rname);
      if (R) {
        let grade = 1;
        if (gname) { const gi = RARITY.findIndex((x) => x.name === gname); if (gi >= 0) grade = gi; }
        return { type: 'relic', id: R.id, grade };
      }
    }
    const rk = rankOf(n);
    if (rk) {
      if (kind === '괴수 코어' || rk.rest === '코어' || /^코어$/.test(rk.rest)) return { type: 'core', tier: rk.tier };
      if (kind === '부산물' || (typeof PARTS !== 'undefined' && Object.keys(PARTS).some((k) => PARTS[k].name === rk.rest))) {
        const id = Object.keys(PARTS).find((k) => PARTS[k].name === rk.rest) || 'bone';
        return { type: 'part', id, tier: rk.tier };
      }
      if (/각성 촉매/.test(rk.rest) || kind === 'cat') return { type: 'cat', tier: rk.tier };
    }
    const C = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).find((c) => c.name === n);
    if (C) return { type: 'cons', id: C.id };
    // 장비: 가방·장착·상점 매물에서 이름으로
    const p = G && G.player;
    if (p) {
      const bag = [...(p.inventory || []), ...Object.values(p.equip || {}).filter(Boolean)];
      const hit = bag.find((it) => it && it.name === n);
      if (hit) return { type: 'equip', uid: hit.uid, it: hit };
      try {
        const shop = G.getShop && G.getShop();
        const sh = shop && (shop.equips || []).find((it) => it.name === n);
        if (sh) return { type: 'equip', uid: sh.uid, it: sh };
      } catch (e) { /* 무시 */ }
    }
    return { type: 'named', kind, name: n };
  };

  const rowsHtml = (rows) => `<table class="sh-table">${rows.filter(Boolean).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table>`;

  Object.assign(UI, {
    itemRefEnc(kind, name) { return `${encodeURIComponent(kind || '')}|${encodeURIComponent(name || '')}`; },
    itemChip(kind, name, n = 1) {
      const k = (kind || '전리품').replace(/\s/g, '');
      const icon = KIND_ICON[kind] || '•';
      const v = this.itemRefEnc(kind, name);
      return `<button type="button" class="ss-item k-${k}" data-act="item-info" data-v="${v}" aria-label="${esc(name)} 상세"><em>${icon}</em>${esc(name)}${n > 1 ? `<b>×${n}</b>` : ''}</button>`;
    },
    itemInfoHtml(ref) {
      const r0 = parseRef(ref); if (!r0) return '';
      const r = r0.type === 'named' ? (resolveNamed(r0.kind, r0.name) || r0) : r0;
      const tip = '<div class="small dim sh-tip">아무 곳이나 누르면 닫힙니다.</div>';
      const head = (icon, title, sub, col) => `<div class="skill-hold item-hold" style="--c:${col || '#9aa6b8'}"><div class="sh-head"><span class="ih-ico" aria-hidden="true">${icon}</span><b>${esc(title)}</b>${sub ? `<span class="small dim">${sub}</span>` : ''}</div>`;

      if (r.type === 'core') {
        const t = Math.max(0, Math.min(7, r.tier | 0)); const R = RANKS[t];
        const have = G && G.coreCount ? G.coreCount(t) : 0;
        let price = '';
        try { if (G && G.corePrice) price = `개당 ${fmt(G.corePrice(t))} 크레딧`; } catch (e) { price = ''; }
        const rows = [
          ['종류', '괴수 코어'],
          ['등급', `${R.key}급`],
          have ? ['보유', `${have}개`] : null,
          price ? ['시세', price] : null,
          ['용도', '공방에서 회복제·각성 촉매 제작 · 협회 납품 · 마켓 판매'],
        ];
        return `${head('◆', coreName(t), '재료', KIND_COLOR.core)}<p class="small">쓰러뜨린 괴수에게서 얻는 에테르 결정체. 등급이 높을수록 비싸고, 공방·납품·판매에 두루 쓰인다.</p>${rowsHtml(rows)}${tip}</div>`;
      }

      if (r.type === 'part') {
        const P = (typeof PARTS !== 'undefined' && PARTS[r.id]) || { name: r.id || '부산물', from: [] };
        const t = Math.max(0, Math.min(7, r.tier | 0));
        const label = G && G.partLabel ? G.partLabel(r.id, t) : `${RANKS[t].key}급 ${P.name}`;
        const have = G && G.partCount ? G.partCount(r.id, t) : 0;
        const unit = Math.round(25 * RANKS[t].mult ** 1.5);
        const shapes = (P.from || []).length ? P.from.join('·') : '그 밖의 형태';
        const crafts = (typeof GEAR_RECIPES !== 'undefined' ? GEAR_RECIPES : []).filter((x) => x.part === r.id).map((x) => x.name);
        const rows = [
          ['종류', '괴수 부산물'],
          ['등급', `${RANKS[t].key}급`],
          ['형태', shapes],
          have ? ['보유', `${have}개`] : null,
          ['시세', `개당 약 ${fmt(unit)} 크레딧 (일괄 판매)`],
          crafts.length ? ['제작', crafts.join(' · ')] : ['용도', '공방 제작 재료 · 일괄 판매 · 가게 납품'],
        ];
        return `${head('⬢', label, '부산물', KIND_COLOR.part)}<p class="small">괴수 형태마다 다른 부산물이다. 같은 등급 코어와 함께 공방에서 장비로 만들거나 팔 수 있다.</p>${rowsHtml(rows)}${tip}</div>`;
      }

      if (r.type === 'relic') {
        const R = typeof relicById === 'function' ? relicById(r.id) : (RELICS || []).find((x) => x.id === r.id);
        if (!R) return `${head('✦', r.id || '유물', '유물', KIND_COLOR.relic)}<p class="small">정체를 알 수 없는 유물이다.</p>${tip}</div>`;
        const g = Math.max(0, Math.min(RARITY.length - 1, r.grade | 0));
        const val = R.val * RARITY[g].mult;
        const gain = R.stat === 'life' ? `+${Math.round(val)}년` : `+${Math.round(val * 100)}%`;
        const rows = [
          ['종류', '유물'],
          ['희귀도', `<span style="color:${RARITY[g].color}">${RARITY[g].name}</span>`],
          ['효과', `돌파 때 바치면 ${R.desc} 영구 ${gain}`],
          ['능력', `${(typeof MOD_NAME !== 'undefined' && MOD_NAME[R.stat]) || R.stat} ${gain}`],
        ];
        return `${head('✦', R.name, '유물', RARITY[g].color)}<p class="small">게이트와 보스에게서 나오는 각성 유물. 돌파에 바치면 그 힘이 영원히 남는다.</p>${rowsHtml(rows)}${tip}</div>`;
      }

      if (r.type === 'cons') {
        const C = (CONSUMABLES || []).find((x) => x.id === r.id);
        if (!C) return '';
        const have = G && G.player && G.player.items ? (G.player.items[C.id] || 0) : 0;
        const combat = ['potion', 'mana'].includes(C.id) || C.combat || C.effect === 'hp' || C.effect === 'mp';
        const rows = [
          ['종류', '소모품'],
          ['효과', esc(C.desc)],
          C.price != null ? ['가격', `${fmt(C.price)} 크레딧`] : null,
          have ? ['보유', `${have}개`] : null,
          ['전투', combat ? '가방에서 사용 가능' : (C.noShop ? '특수 · 상점 미판매' : '비전투/특수')],
        ];
        return `${head('◆', C.name, '소모품', KIND_COLOR.cons)}<p class="small">${esc(C.desc)}</p>${rowsHtml(rows)}${tip}</div>`;
      }

      if (r.type === 'cat') {
        const t = Math.max(0, Math.min(7, r.tier | 0));
        const key = 'cat' + t;
        const have = G && G.player && G.player.items ? (G.player.items[key] || 0) : 0;
        const rows = [
          ['종류', '각성 촉매'],
          ['등급', `${RANKS[t].key}급`],
          have ? ['보유', `${have}개`] : null,
          ['용도', `${RANKS[t].key}급 → ${RANKS[Math.min(7, t + 1)].key}급 돌파에 반드시 필요`],
        ];
        return `${head('◇', `${RANKS[t].key}급 각성 촉매`, '돌파 재료', KIND_COLOR.cat)}<p class="small">공방에서 같은 등급 코어로 만들거나, 큰 도시 마켓에서 살 수 있다. 돌파 때 하나씩 소모된다.</p>${rowsHtml(rows)}${tip}</div>`;
      }

      if (r.type === 'equip') {
        let it = r.it;
        if (!it && G && G.player) {
          it = (G.player.inventory || []).find((e) => e.uid === r.uid)
            || Object.values(G.player.equip || {}).find((e) => e && e.uid === r.uid);
          if (!it) try { it = (G.getShop().equips || []).find((e) => e.uid === r.uid); } catch (e) { /* 무시 */ }
        }
        if (!it) return `${head('⚔', '장비', '', KIND_COLOR.equip)}<p class="small">이미 처분했거나 찾을 수 없는 장비다.</p>${tip}</div>`;
        const col = RARITY[it.rarity] ? RARITY[it.rarity].color : KIND_COLOR.equip;
        const stats = this.equipStats ? this.equipStats(it) : '';
        const slot = this.slotName ? this.slotName(it.slot) : it.slot;
        const rows = [
          ['종류', `장비 · ${slot}`],
          ['희귀도', `<span style="color:${col}">${RARITY[it.rarity] ? RARITY[it.rarity].name : '?'}</span>`],
          stats ? ['능력', stats] : null,
          it.value != null ? ['가치', `${fmt(it.value)} 크레딧`] : null,
          it.cursed ? ['상태', '<span class="bad">저주받음 · 해제 전까지 벗을 수 없음</span>'] : null,
        ];
        return `${head('⚔', it.name, slot, col)}<p class="small">${RARITY[it.rarity] ? RARITY[it.rarity].name : ''} ${slot}. 정보 탭 가방에서 장착·해제할 수 있다.</p>${rowsHtml(rows)}${tip}</div>`;
      }

      // 이름만 아는 경우
      const kind = r.kind || '전리품';
      return `${head(KIND_ICON[kind] || '•', r.name || '물건', KIND_LABEL[kind] || kind, KIND_COLOR[kind] || '#9aa6b8')}<p class="small">${KIND_LABEL[kind] || '전리품'}이다. 자세한 수치는 가방·공방·마켓에서 확인한다.</p>${tip}</div>`;
    },
    showItemInfo(v) {
      const html = this.itemInfoHtml(v);
      if (!html) return false;
      if (this.hideSkillHold) this.hideSkillHold();
      document.body.insertAdjacentHTML('beforeend', `<div class="skill-hold-wrap" id="skill-hold">${typeof fixJosa === 'function' ? fixJosa(html) : html}</div>`);
      if (navigator.vibrate) try { navigator.vibrate(10); } catch (e) { /* 무시 */ }
      return true;
    },
  });

  // 정산서 칩에 클릭 연결 (settle_sheet.js가 만든 .ss-item을 버튼으로 바꿈)
  const wireSettle = (root) => {
    if (!root) return;
    for (const el of root.querySelectorAll('.ss-item:not([data-act])')) {
      const kindCls = [...el.classList].find((c) => c.startsWith('k-'));
      const kindKey = kindCls ? kindCls.slice(2) : '';
      const kindMap = { '괴수코어': '괴수 코어', '부산물': '부산물', '유물발견': '유물 발견', '보스드롭': '보스 드롭', '장비를득': '장비 획득', '장비획득': '장비 획득', '전리품': '전리품' };
      const kind = kindMap[kindKey] || '전리품';
      let name = ''; let n = 1;
      const b = el.querySelector('b'); if (b) { const m = /×\s*(\d+)/.exec(b.textContent); if (m) n = +m[1]; }
      const clone = el.cloneNode(true); const bb = clone.querySelector('b'); if (bb) bb.remove(); const em = clone.querySelector('em'); if (em) em.remove();
      name = clone.textContent.replace(/\s+/g, ' ').trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = el.className;
      btn.setAttribute('data-act', 'item-info');
      btn.setAttribute('data-v', UI.itemRefEnc(kind, name));
      btn.setAttribute('aria-label', `${name} 상세`);
      btn.innerHTML = el.innerHTML;
      el.replaceWith(btn);
    }
  };

  const baseSettle = UI.settleSheet;
  if (baseSettle) UI.settleSheet = function (...a) {
    const r = baseSettle.apply(this, a);
    try { wireSettle(document.getElementById('modal-box')); } catch (e) { /* 무시 */ }
    return r;
  };

  // 팀 정산: 코어·부산물 이름을 칩으로, 장비 이름 탭 가능
  const baseLootHtml = UI.lootHtml;
  if (baseLootHtml) UI.lootHtml = function (...a) {
    let h = baseLootHtml.apply(this, a);
    if (!h || !this._loot) return h;
    try {
      const L = this._loot;
      if (L.mat) {
        const chips = [
          ...Object.entries(L.bag.cores).map(([t, n]) => UI.itemChip('괴수 코어', coreName(+t), n)),
          ...Object.entries(L.bag.parts).map(([k, n]) => { const [id, t] = k.split(':'); return UI.itemChip('부산물', G.partLabel(id, +t), n); }),
        ].join('');
        h = h.replace(/(<b>코어·부산물<\/b>)<span class="small dim">[^<]*<\/span>/, `$1<div class="ss-items ls-chips">${chips}</div>`);
      }
      L.gear.forEach((g) => {
        if (!g || !g.it) return;
        const name = g.it.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(<b[^>]*>)(${name})(</b>)`);
        h = h.replace(re, `$1<button type="button" class="item-tap-name" data-act="item-info" data-v="equip:${g.it.uid}">$2</button>$3`);
      });
    } catch (e) { /* 무시 */ }
    return h;
  };

  // 장비 줄: 이름·능력치 영역을 누르면 상세
  const baseRow = UI.equipRow;
  if (baseRow) UI.equipRow = function (it, right, extra = '') {
    const html = baseRow.call(this, it, right, extra);
    if (!it || !it.uid) return html;
    return html.replace('<div class="grow">', `<div class="grow item-tap" data-act="item-info" data-v="equip:${it.uid}" role="button" tabindex="0" aria-label="${esc(it.name)} 상세">`);
  };

  // 상점·가방 소모품 이름
  const tapCons = (html) => html.replace(/<div class="grow"><b>([^<]+)<\/b>/g, (m, name) => {
    const C = (CONSUMABLES || []).find((c) => c.name === name);
    if (!C) return m;
    return `<div class="grow item-tap" data-act="item-info" data-v="cons:${C.id}" role="button" tabindex="0" aria-label="${name} 상세"><b>${name}</b>`;
  });
  const baseShop = UI.shopHtml;
  if (baseShop) UI.shopHtml = function (...a) { return tapCons(baseShop.apply(this, a)); };
  const baseChar = UI.charHtml;
  if (baseChar) UI.charHtml = function (...a) {
    let html = tapCons(baseChar.apply(this, a));
    // 유물 줄
    html = html.replace(/<div class="grow"><b style="color:([^"]+)">([^<]+)<\/b> <span class="tag">([^<]+)<\/span>/g, (m, col, name, tag) => {
      const R = (RELICS || []).find((r) => r.name === name);
      if (!R) return m;
      const g = RARITY.findIndex((x) => x.name === tag);
      return `<div class="grow item-tap" data-act="item-info" data-v="relic:${R.id}:${g < 0 ? 1 : g}" role="button" tabindex="0" aria-label="${name} 상세"><b style="color:${col}">${name}</b> <span class="tag">${tag}</span>`;
    });
    // 코어 목록 글자
    html = html.replace(/(<(?:div|span) class="small dim">)([^<]*코어[^<]*)/g, (m, open, body) => {
      const parts = body.split(' · ').map((seg) => {
        const cm = /^([FEDCBA]|SS?)급 코어\s+(\d+)$/.exec(seg.trim());
        if (!cm) return esc(seg);
        const tier = RANKS.findIndex((r) => r.key === cm[1]);
        if (tier < 0) return esc(seg);
        return `<button type="button" class="item-inline" data-act="item-info" data-v="core:${tier}">${coreName(tier)} ${cm[2]}</button>`;
      });
      return open + parts.join(' · ');
    });
    return html;
  };

  // 도시 마켓 코어 매입 줄 — 시설명을 그린 뒤 연결
  const wireTownCores = () => {
    const box = document.getElementById('modal-box'); if (!box) return;
    for (const row of box.querySelectorAll('.item-row .grow > b')) {
      const t = rankOf(row.textContent); if (!t || t.rest !== '코어') continue;
      const grow = row.parentElement; if (!grow || grow.dataset.act) continue;
      grow.classList.add('item-tap');
      grow.setAttribute('data-act', 'item-info');
      grow.setAttribute('data-v', `core:${t.tier}`);
      grow.setAttribute('role', 'button');
    }
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v) {
    if (act === 'item-info') { this.showItemInfo(v); return; }
    const r = baseHandle.call(this, act, v);
    if (act === 'city-fac' || act === 'city' || act === 'sheet' || act === 'buy-item' || act === 'sell-cores') {
      try { wireTownCores(); } catch (e) { /* 무시 */ }
    }
    return r;
  };

  // 전투 가방 버튼: 짧게 누르면 사용, 정보 아이콘은 별도 — 길게 누르면 상세 (skill_hold와 비슷한 시간)
  {
    const HOLD_MS = 450;
    let timer = 0, start = null, fired = false;
    const clear = () => { clearTimeout(timer); timer = 0; start = null; };
    document.addEventListener('pointerdown', (e) => {
      if (document.getElementById('skill-hold')) return;
      const btn = e.target.closest && e.target.closest('[data-act="c-item"], [data-act="c-bag-use"]');
      if (!btn || !btn.dataset.v) return;
      start = [e.clientX, e.clientY];
      timer = setTimeout(() => {
        timer = 0;
        if (UI.showItemInfo('cons:' + btn.dataset.v)) fired = true;
      }, HOLD_MS);
    }, true);
    document.addEventListener('pointermove', (e) => { if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > 12) clear(); }, true);
    document.addEventListener('pointerup', clear, true);
    document.addEventListener('pointercancel', clear, true);
    document.addEventListener('click', (e) => {
      if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); }
    }, true);
  }
}
