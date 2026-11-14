// 장비 탭: 착용 슬롯과 선택한 부위의 교체 목록. 인벤토리는 inventory.js에서 별도 구성한다.
(() => {
  const esc = value => String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const name = item => item.name.replace(/^\[[^\]]+\]\s*/, '');
  const art = (item, size = 36) => ItemArt.icon({ type: 'equip', it: item }, size);
  const stats = item => UI.equipStats(item).replace(/<br\s*\/?>/g, ' · ');
  const slots = ['helm', 'weapon', 'cloak', 'gloves', 'armor', 'boots', 'acc', 'acc2', 'acc3'];
  const slotName = slot => UI.slotName(slot);
  const refresh = () => {
    const box = document.getElementById('modal-box');
    const scroll = box.querySelector('.sheet-body')?.scrollTop || 0;
    box.innerHTML = UI.sheetHtml();
    box.querySelector('.sheet-body').scrollTop = scroll;
  };
  UI.refreshGearSheet = refresh;
  UI.gearBagRow = function (it, selected = null) {
    const target = selected && isAccSlot(selected) && equipSlotKind(it.slot) === 'acc' ? selected : selected === 'sub' ? 'sub' : null;
    const action = target ? (target === 'sub' ? 'equip-extra' : 'equip-acc') : 'equip';
    const value = target ? it.uid + '|' + target : it.uid;
    return `<div class="gl-bag-row"><button type="button" class="gl-item-icon" data-act="item-info" data-v="equip:${esc(it.uid)}" aria-label="${esc(name(it))} 상세">${art(it)}</button><div class="gl-item-copy"><button type="button" class="gl-item-name" data-act="item-info" data-v="equip:${esc(it.uid)}" style="color:${RARITY[it.rarity].color}">${esc(name(it))}</button><div class="gl-item-meta">${this.slotName(it.slot)} · ${RARITY[it.rarity].name}</div><div class="gl-item-stats">${stats(it)}</div></div><button type="button" class="sm gl-equip" data-act="${action}" data-v="${esc(value)}" aria-label="${esc(name(it))} ${target ? slotName(target) + '에 ' : ''}장착">장착</button></div>`;
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
    const selected = equippedSlots.includes(this._gearSlot) ? this._gearSlot : 'weapon';
    const count = equippedSlots.filter(slot => p.equip[slot]).length;
    const cell = slot => {
      const item = p.equip[slot];
      return `<button type="button" class="gl-slot ${item ? 'filled' : 'empty'} ${selected === slot ? 'selected' : ''}" data-act="gear-slot" data-v="${slot}" aria-pressed="${selected === slot}" aria-label="${esc(slotName(slot))}: ${esc(item ? name(item) : '빈 칸')}" style="--slot-color:${item ? RARITY[item.rarity].color : '#334257'}">
        <span class="gl-slot-label">${slotName(slot)}</span><span class="gl-slot-art" aria-hidden="true">${item ? art(item) : '<span class="gl-plus">＋</span>'}</span><span class="gl-slot-name">${esc(item ? name(item) : '빈 칸')}</span></button>`;
    };
    const item = selected && p.equip[selected];
    const detail = selected ? `<div class="gl-selected"><div class="gl-selected-heading"><b>${item ? esc(name(item)) : slotName(selected) + ' · 빈 칸'}</b>${item ? `<button type="button" class="sm ghost" data-act="unequip" data-v="${selected}">해제</button>` : ''}</div>${item ? `<div class="gl-item-stats">${stats(item)}</div><button type="button" class="gl-detail-link" data-act="item-info" data-v="equip:${esc(item.uid)}">상세 정보</button>` : ''}</div>` : '';
    const inventory = p.inventory.filter(it => {
      if (selected === 'sub') return it.slot === 'weapon' && SUB_FAMS.includes(G.weaponFam(it));
      return isAccSlot(selected) ? equipSlotKind(it.slot) === 'acc' : it.slot === selected;
    });
    const sections = [...body.querySelectorAll('.panel > .sec')];
    const brands = sections.filter(sec => sec.querySelector(':scope > .sec-title')?.textContent.trim().startsWith('장착 장비')).reduce((out, sec) => out.concat([...sec.querySelectorAll('.small.amber')]), []).map(el => el.outerHTML).join('');
    const extras = (brands ? `<div class="sec"><div class="sec-title">세트 효과</div>${brands}</div>` : '') + sections.filter(sec => !['장착 장비', '방어구', '장신구', '가방', '소모품'].some(t => sec.querySelector(':scope > .sec-title')?.textContent.trim().startsWith(t))).map(sec => sec.outerHTML).join('');
    body.classList.add('gl-body');
    body.innerHTML = `<div class="gl-layout"><section class="gl-loadout" aria-label="장착 장비"><div class="gl-heading"><h3>장착 장비</h3><span><b>${count}</b> / ${equippedSlots.length}</span></div><div class="gl-slot-grid">${slots.map(cell).join('')}</div>${G.slotOpen('sub') ? `<div class="gl-sub-slot">${cell('sub')}</div>` : ''}${detail}</section><section class="gl-replacements" aria-label="선택 부위 교체"><div class="gl-heading"><h3>${slotName(selected)} 교체</h3><span>${inventory.length}개</span></div><div class="gl-bag-list">${inventory.map(it => this.gearBagRow(it, selected)).join('') || '<div class="gl-no-items">이 칸에 장착할 장비가 없습니다.</div>'}</div><button type="button" class="gl-detail-link" data-act="sheet" data-v="inventory">인벤토리 열기</button></section>${extras ? `<details class="gl-extras"><summary>장비 효과 · 도감</summary>${extras}</details>` : ''}</div>`;
    return root.innerHTML;
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, value, ...args) {
    if (act === 'gear-slot') {
      this._gearSlot = value;
      refresh(); return;
    }
    return baseHandle.call(this, act, value, ...args);
  };
})();
