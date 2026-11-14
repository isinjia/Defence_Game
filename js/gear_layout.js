// 장착 슬롯은 한눈에, 가방은 별도 목록으로 보여 준다. 장비 규칙·아이템 데이터는 그대로 쓴다.
(() => {
  const esc = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const name = item => item.name.replace(/^\[[^\]]+\]\s*/, '');
  const art = (item, size = 36) => ItemArt.icon({ type: 'equip', it: item }, size);
  const stats = item => UI.equipStats(item).replace(/<br\s*\/?>/g, ' · ');
  const slots = ['helm', 'weapon', 'cloak', 'gloves', 'armor', 'boots', 'acc', 'acc2', 'acc3'];
  const slotName = slot => UI.slotName(slot);
  const filters = [['all', '전체'], ['weapon', '무기'], ['armor', '방어구'], ['acc', '장신구']];
  const refresh = () => {
    const box = document.getElementById('modal-box');
    const scroll = box.querySelector('.sheet-body')?.scrollTop || 0;
    box.innerHTML = UI.sheetHtml();
    box.querySelector('.sheet-body').scrollTop = scroll;
  };
  const baseSheet = UI.sheetHtml;
  UI.sheetHtml = function (...args) {
    const html = baseSheet.apply(this, args);
    if (this.sheet !== 'gear') return html;
    const root = document.createElement('template'); root.innerHTML = html;
    const body = root.content.querySelector('.sheet-body');
    if (!body) return html;
    const p = G.player;
    const equippedSlots = slots.concat(G.slotOpen('sub') ? ['sub'] : []);
    const selected = equippedSlots.includes(this._gearSlot) ? this._gearSlot : null;
    const count = equippedSlots.filter(slot => p.equip[slot]).length;
    const cell = slot => {
      const item = p.equip[slot];
      return `<button type="button" class="gl-slot ${item ? 'filled' : 'empty'} ${selected === slot ? 'selected' : ''}" data-act="gear-slot" data-v="${slot}" aria-pressed="${selected === slot}" aria-label="${esc(slotName(slot))}: ${esc(item ? name(item) : '빈 칸')}" style="--slot-color:${item ? RARITY[item.rarity].color : '#334257'}">
        <span class="gl-slot-label">${slotName(slot)}</span><span class="gl-slot-art" aria-hidden="true">${item ? art(item) : '<span class="gl-plus">＋</span>'}</span><span class="gl-slot-name">${esc(item ? name(item) : '빈 칸')}</span></button>`;
    };
    const item = selected && p.equip[selected];
    const detail = selected ? `<div class="gl-selected"><div class="gl-selected-heading"><b>${item ? esc(name(item)) : slotName(selected) + ' · 빈 칸'}</b>${item ? `<button type="button" class="sm ghost" data-act="unequip" data-v="${selected}">해제</button>` : ''}</div>${item ? `<div class="gl-item-stats">${stats(item)}</div><button type="button" class="gl-detail-link" data-act="item-info" data-v="equip:${esc(item.uid)}">상세 정보</button>` : ''}</div>` : '';
    const tab = this._gearBagTab === 'cons' ? 'cons' : 'equip';
    const filter = filters.some(([key]) => key === this._gearFilter) ? this._gearFilter : 'all';
    const inventory = p.inventory.filter(it => filter === 'all' || equipSlotKind(it.slot) === filter);
    const bagRow = it => {
      const accSlot = selected && isAccSlot(selected) && equipSlotKind(it.slot) === 'acc' ? selected : null;
      const action = accSlot ? 'equip-acc' : 'equip';
      const value = accSlot ? it.uid + '|' + accSlot : it.uid;
      return `<div class="gl-bag-row"><button type="button" class="gl-item-icon" data-act="item-info" data-v="equip:${esc(it.uid)}" aria-label="${esc(name(it))} 상세">${art(it)}</button><div class="gl-item-copy"><button type="button" class="gl-item-name" data-act="item-info" data-v="equip:${esc(it.uid)}" style="color:${RARITY[it.rarity].color}">${esc(name(it))}</button><div class="gl-item-meta">${this.slotName(it.slot)} · ${RARITY[it.rarity].name}</div><div class="gl-item-stats">${stats(it)}</div></div><button type="button" class="sm gl-equip" data-act="${action}" data-v="${esc(value)}" aria-label="${esc(name(it))} ${accSlot ? slotName(accSlot) + '에 ' : ''}장착">장착</button></div>`;
    };
    const consumables = CONSUMABLES.filter(c => p.items[c.id] > 0);
    const consRow = c => `<div class="gl-bag-row"><button type="button" class="gl-item-icon" data-act="item-info" data-v="cons:${c.id}" aria-label="${c.name} 상세">${ItemArt.icon({ type: 'cons', id: c.id }, 36)}</button><div class="gl-item-copy"><b>${c.name} <span class="gl-quantity">×${p.items[c.id]}</span></b><div class="gl-item-stats">${c.desc}</div></div><button type="button" class="sm" data-act="use-item" data-v="${c.id}">사용</button></div>`;
    const sections = [...body.querySelectorAll('.panel > .sec')];
    const brands = sections.filter(sec => sec.querySelector(':scope > .sec-title')?.textContent.trim().startsWith('장착 장비')).reduce((out, sec) => out.concat([...sec.querySelectorAll('.small.amber')]), []).map(el => el.outerHTML).join('');
    const extras = (brands ? `<div class="sec"><div class="sec-title">세트 효과</div>${brands}</div>` : '') + sections.filter(sec => !['장착 장비', '방어구', '장신구', '가방', '소모품'].some(t => sec.querySelector(':scope > .sec-title')?.textContent.trim().startsWith(t))).map(sec => sec.outerHTML).join('');
    body.classList.add('gl-body');
    body.innerHTML = `<div class="gl-layout"><section class="gl-loadout" aria-label="장착 장비"><div class="gl-heading"><h3>장착 장비</h3><span><b>${count}</b> / ${equippedSlots.length}</span></div><div class="gl-slot-grid">${slots.map(cell).join('')}</div>${G.slotOpen('sub') ? `<div class="gl-sub-slot">${cell('sub')}</div>` : ''}${detail}</section><section class="gl-inventory" aria-label="인벤토리"><div class="gl-heading"><h3>인벤토리</h3><span>${tab === 'equip' ? p.inventory.length + '개' : consumables.length + '종'}</span></div><div class="gl-bag-tabs" role="group" aria-label="인벤토리 종류"><button type="button" data-act="gear-bag-tab" data-v="equip" aria-pressed="${tab === 'equip'}">장비 <span>${p.inventory.length}</span></button><button type="button" data-act="gear-bag-tab" data-v="cons" aria-pressed="${tab === 'cons'}">소모품 <span>${consumables.length}</span></button></div>${tab === 'equip' ? `<div class="gl-filters" role="group" aria-label="장비 분류">${filters.map(([key, label]) => `<button type="button" data-act="gear-filter" data-v="${key}" aria-pressed="${filter === key}">${label}</button>`).join('')}</div>` : ''}<div class="gl-bag-list">${tab === 'equip' ? inventory.map(bagRow).join('') || '<div class="gl-no-items">보관 중인 장비가 없습니다.</div>' : consumables.map(consRow).join('') || '<div class="gl-no-items">보유한 소모품이 없습니다.</div>'}</div></section>${extras ? `<details class="gl-extras"><summary>장비 효과 · 도감</summary>${extras}</details>` : ''}</div>`;
    return root.innerHTML;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, value, ...args) {
    if (act === 'gear-slot') {
      this._gearSlot = value; this._gearBagTab = 'equip';
      this._gearFilter = equipSlotKind(value);
      refresh(); return;
    }
    if (act === 'gear-bag-tab') { this._gearBagTab = value; refresh(); return; }
    if (act === 'gear-filter') { this._gearFilter = value; refresh(); return; }
    return baseHandle.call(this, act, value, ...args);
  };
})();
