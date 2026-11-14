// 인벤토리: 보유 장비·소모품·재료를 통합하고 장비 탭과 독립된 상위 탭으로 둔다.
(() => {
  const esc = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const categories = [['all', '전체'], ['equip', '장비'], ['cons', '소모품'], ['material', '재료']];
  const materials = p => {
    const rows = [];
    for (let tier = 0; tier < RANKS.length; tier++) {
      const cores = p.mats?.['c' + tier] || 0;
      if (cores > 0) rows.push({ name: coreName(tier), n: cores, ref: `core:${tier}`, art: { type: 'core', tier }, use: '공방 제작 · 납품 · 마켓 판매' });
      const cats = p.items?.['cat' + tier] || 0;
      if (cats > 0) rows.push({ name: `${RANKS[tier].key}급 각성 촉매`, n: cats, ref: `cat:${tier}`, art: { type: 'cat', tier }, use: '등급 돌파에 사용' });
    }
    if (p.mats?.herb > 0) rows.push({ name: '약초', n: p.mats.herb, art: null, use: '마을 물자 거래에 사용' });
    for (const [key, n] of Object.entries(p.parts || {})) {
      if (!(n > 0)) continue;
      const [id, rawTier] = key.split(':'); const tier = +rawTier;
      if (!PARTS[id] || !RANKS[tier]) continue;
      rows.push({ name: G.partLabel(id, tier), n, ref: `part:${id}:${tier}`, art: { type: 'part', id, tier }, use: '장비 제작 · 공방 납품' });
    }
    const relics = new Map();
    for (const relic of p.relics || []) {
      const grade = relic.grade || 0, key = `${relic.id}:${grade}`;
      if (relics.has(key)) { relics.get(key).n++; continue; }
      const data = relicById(relic.id);
      relics.set(key, { name: `${RARITY[grade].name} ${data ? data.name : '미확인 유물'}`, n: 1, ref: `relic:${key}`, art: { type: 'relic', id: relic.id }, use: '돌파에 바쳐 영구 능력치 상승' });
    }
    return rows.concat([...relics.values()]);
  };
  const materialRow = row => {
    const icon = row.art ? ItemArt.icon(row.art, 36) : FX.elemIcon('wood', 30);
    const action = row.ref ? `data-act="item-info" data-v="${esc(row.ref)}"` : '';
    return `<div class="gl-bag-row gl-material-row"><span class="gl-item-icon" aria-hidden="true">${icon}</span><div class="gl-item-copy"><b>${esc(row.name)} <span class="gl-quantity">×${fmt(row.n)}</span></b><div class="gl-item-stats">${esc(row.use)}</div></div>${action ? `<button type="button" class="sm" ${action} aria-label="${esc(row.name)} 상세">용도</button>` : ''}</div>`;
  };
  const consumableRow = c => `<div class="gl-bag-row"><button type="button" class="gl-item-icon" data-act="item-info" data-v="cons:${c.id}" aria-label="${c.name} 상세">${ItemArt.icon({ type: 'cons', id: c.id }, 36)}</button><div class="gl-item-copy"><button type="button" class="gl-item-name" data-act="item-info" data-v="cons:${c.id}">${c.name} <span class="gl-quantity">×${G.player.items[c.id]}</span></button><div class="gl-item-stats">${c.desc}</div></div><button type="button" class="sm" data-act="use-item" data-v="${c.id}">사용</button></div>`;
  const equipmentRow = it => {
    const root = document.createElement('template'); root.innerHTML = UI.gearBagRow(it);
    if (G.onCity()) {
      const equip = root.content.querySelector('.gl-equip');
      const actions = document.createElement('div'); actions.className = 'gl-stock-actions';
      equip.replaceWith(actions); actions.append(equip);
      actions.insertAdjacentHTML('beforeend', `<button type="button" class="sm ghost" data-act="inventory-sell" data-v="${esc(it.uid)}" aria-label="${esc(it.name)} 판매">판매</button>`);
    }
    return root.innerHTML;
  };
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function (...args) {
    const current = this.sheet;
    let html;
    if (current === 'inventory') {
      this.sheet = 'gear';
      try { html = baseSheet.apply(this, args); } finally { this.sheet = current; }
    } else html = baseSheet.apply(this, args);
    const root = document.createElement('template'); root.innerHTML = html;
    const tabs = root.content.querySelector('.sheet-head .tabs');
    if (tabs) tabs.classList.add('gl-sheet-tabs');
    if (tabs && !tabs.querySelector('[data-v="inventory"]')) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.act = 'sheet'; button.dataset.v = 'inventory'; button.textContent = '인벤토리';
      const gear = tabs.querySelector('[data-v="gear"]');
      if (gear) gear.after(button); else tabs.append(button);
    }
    if (tabs) for (const tab of tabs.querySelectorAll('[data-act="sheet"]')) tab.classList.toggle('on', tab.dataset.v === (current || 'char'));
    if (current !== 'inventory') return root.innerHTML;
    const p = G.player;
    const cons = CONSUMABLES.filter(c => p.items[c.id] > 0);
    const mats = materials(p);
    const groups = { equip: p.inventory.map(equipmentRow), cons: cons.map(consumableRow), material: mats.map(materialRow) };
    const count = { equip: groups.equip.length, cons: groups.cons.length, material: groups.material.length };
    count.all = count.equip + count.cons + count.material;
    const filter = categories.some(([key]) => key === this._inventoryFilter) ? this._inventoryFilter : 'all';
    const selectedGroups = categories.filter(([key]) => key !== 'all' && (filter === 'all' || filter === key));
    const list = selectedGroups.filter(([key]) => groups[key].length).map(([key, label]) => `<section class="gl-stock-group" aria-label="보유 ${label}">${filter === 'all' ? `<h4>${label}<span>${count[key]}</span></h4>` : ''}<div class="gl-bag-list">${groups[key].join('')}</div></section>`).join('');
    const body = root.content.querySelector('.sheet-body');
    body.classList.add('gl-body');
    body.innerHTML = `<div class="gl-stock"><div class="gl-heading"><h3>인벤토리</h3><span>${count.all}개 항목</span></div><div class="gl-stock-tabs" role="group" aria-label="보유 물품 분류">${categories.map(([key, label]) => `<button type="button" data-act="inventory-filter" data-v="${key}" aria-pressed="${filter === key}">${label}<span>${count[key]}</span></button>`).join('')}</div>${list || '<div class="gl-no-items">보유한 물품이 없습니다.</div>'}${!G.onCity() && p.inventory.length ? '<div class="gl-stock-note">장비 판매는 도시에서 할 수 있습니다.</div>' : ''}</div>`;
    return root.innerHTML;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, value, ...args) {
    if (act === 'inventory-filter') { this._inventoryFilter = value; this.refreshGearSheet(); return; }
    if (act === 'inventory-sell') {
      const item = G.player.inventory.find(it => it.uid === value);
      if (!item || !G.onCity()) return;
      const amount = Math.round(item.value * 0.4);
      return this.confirmOver('장비 판매', `${esc(item.name)}을(를) ${fmt(amount)} 크레딧에 판매합니다.`, '판매', () => this.after(G.sellEquip(value)));
    }
    return baseHandle.call(this, act, value, ...args);
  };
})();
