// 아이템 아이콘을 웹툰풍 이미지로 표시한다. 기존 SVG·기호 아이콘을 대체하되 동작은 그대로다.
const ItemArt = (() => {
  const data = typeof ITEM_ART_DATA !== 'undefined' ? ITEM_ART_DATA : {};
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const byKindKey = {};
  for (const [id, meta] of Object.entries(data)) {
    if (!meta || !meta.kind || meta.key == null) continue;
    byKindKey[meta.kind + ':' + meta.key] = id;
  }
  const url = (id, kind = 'thumb') => {
    const meta = data[id]; if (!meta) return '';
    return `assets/items/${kind}/${encodeURIComponent(id)}.webp?v=${meta.rev}`;
  };
  const img = (id, size = 38, cls = 'item-art') => {
    if (!data[id]) return '';
    const s = Math.max(14, Math.min(512, Number(size) || 38));
    const name = data[id].name || id;
    return `<img class="${cls}" data-item-art="${esc(id)}" src="${url(id, 'thumb')}" srcset="${url(id, 'thumb')} 128w, ${url(id, 'web')} 512w" sizes="${s}px" width="${s}" height="${s}" alt="${esc(name)}" loading="lazy" decoding="async" draggable="false">`;
  };
  const resolveId = (ref) => {
    if (!ref) return null;
    if (typeof ref === 'string' && data[ref]) return ref;
    if (ref.kind && ref.key != null && byKindKey[ref.kind + ':' + ref.key]) return byKindKey[ref.kind + ':' + ref.key];
    if (ref.type === 'cons' && byKindKey['cons:' + ref.id]) return byKindKey['cons:' + ref.id];
    if (ref.type === 'part' && byKindKey['part:' + ref.id]) return byKindKey['part:' + ref.id];
    if (ref.type === 'relic' && byKindKey['relic:' + ref.id]) return byKindKey['relic:' + ref.id];
    if (ref.type === 'core') return byKindKey['core:core'] || null;
    if (ref.type === 'cat') return byKindKey['cat:catalyst'] || null;
    if (ref.type === 'equip' || ref.slot || ref.it) {
      const it = ref.it || ref;
      const fam = it.fam || (typeof famOfName === 'function' ? famOfName(it.name || '') : null)
        || (G && typeof G.weaponFam === 'function' ? G.weaponFam(it) : null);
      if (fam && byKindKey['fam:' + fam]) return byKindKey['fam:' + fam];
      const slot = (it.slot === 'acc2' || it.slot === 'acc3') ? 'acc'
        : (it.slot === 'helm' || it.slot === 'gloves' || it.slot === 'boots' || it.slot === 'cloak') ? 'armor'
        : (it.slot === 'sub' ? null : it.slot);
      if (slot === 'weapon') return byKindKey['fam:sword'] || null;
      if (slot && byKindKey['slot:' + slot]) return byKindKey['slot:' + slot];
      if (it.slot === 'sub') return byKindKey['fam:shield'] || null;
    }
    return null;
  };
  const icon = (ref, size = 38) => { const id = resolveId(ref); return id ? img(id, size) : ''; };
  const slotWrap = (html, color) => `<span class="slot-ico item-art-slot" style="--c:${color || '#9aa6b8'}">${html}</span>`;
  return { data, url, img, resolveId, icon, slotWrap, byKindKey };
})();

FX.itemArt = function (ref, size = 38) { return ItemArt.icon(ref, size); };

document.addEventListener('error', (ev) => {
  const img = ev.target;
  if (!img || !img.matches || !img.matches('img.item-art') || img.dataset.originalTried) return;
  const id = img.dataset.itemArt; if (!ItemArt.data[id]) return;
  img.dataset.originalTried = '1'; img.removeAttribute('srcset');
  img.src = `assets/items/original/${encodeURIComponent(id)}.png`;
}, true);

{
  const baseSlot = UI.slotIcon;
  UI.slotIcon = function (slot, color) {
    let ref = { kind: 'slot', key: 'acc' };
    if (slot === 'weapon' || slot === 'sub') ref = { kind: 'fam', key: slot === 'sub' ? 'shield' : 'sword' };
    else if (slot === 'armor') ref = { kind: 'slot', key: 'armor' };
    else if (slot === 'acc' || slot === 'acc2' || slot === 'acc3') ref = { kind: 'slot', key: 'acc' };
    else if (slot === 'helm' || slot === 'gloves' || slot === 'boots' || slot === 'cloak') ref = { kind: 'slot', key: 'armor' };
    const art = ItemArt.icon(ref, 34);
    if (art) return ItemArt.slotWrap(art, color);
    return baseSlot.call(this, slot, color);
  };

  const baseRow = UI.equipRow;
  if (baseRow) UI.equipRow = function (it, right, extra = '') {
    let html = baseRow.call(this, it, right, extra);
    if (!it) return html;
    const art = ItemArt.icon({ type: 'equip', it }, 34);
    if (!art) return html;
    const col = (typeof RARITY !== 'undefined' && RARITY[it.rarity]) ? RARITY[it.rarity].color : '#9aa6b8';
    return html.replace(/<span class="slot-ico[^"]*"[^>]*>[\s\S]*?<\/span>/, ItemArt.slotWrap(art, col));
  };

  const paintItemHtml = (html) => {
    if (!html) return html;
    // 상점 소모품: 기존 플라스크 SVG → 해당 소모품 이미지
    html = html.replace(/<div class="item-row">\s*<span class="slot-ico"[^>]*>[\s\S]*?<\/span>([\s\S]*?data-act="buy-item" data-v="([^"]+)")/g, (m, rest, id) => {
      const art = ItemArt.icon({ type: 'cons', id }, 34);
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, 'var(--ether)')}${rest}`;
    });
    // 도시 마켓·가방: 아이콘 없는 소모품 줄에 삽입
    html = html.replace(/<div class="item-row"><div class="grow"><b>([^<]+)<\/b> <span class="dim small">보유/g, (m, name) => {
      const C = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).find((c) => c.name === name);
      if (!C) return m;
      const art = ItemArt.icon({ type: 'cons', id: C.id }, 34);
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, 'var(--ether)')}<div class="grow"><b>${name}</b> <span class="dim small">보유`;
    });
    html = html.replace(/<div class="item-row"><div class="grow"><b>([^<]+)<\/b> <span class="num">/g, (m, name) => {
      const C = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).find((c) => c.name === name);
      if (!C) return m;
      const art = ItemArt.icon({ type: 'cons', id: C.id }, 34);
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, 'var(--ether)')}<div class="grow"><b>${name}</b> <span class="num">`;
    });
    // item_pop이 grow에 item-tap을 붙인 뒤에도 동작
    html = html.replace(/<div class="item-row"><div class="grow item-tap"[^>]*data-v="cons:([^"]+)"[^>]*>/g, (m, id) => {
      if (/item-art-slot/.test(m)) return m;
      const art = ItemArt.icon({ type: 'cons', id }, 34);
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, 'var(--ether)')}${m.slice('<div class="item-row">'.length)}`;
    });
    // 각성 촉매
    html = html.replace(/<div class="item-row hl">(?:<span class="slot-ico"[^>]*>[\s\S]*?<\/span>)?<div class="grow"><b>([^<]*각성 촉매)/g, (m, title) => {
      const art = ItemArt.icon({ type: 'cat' }, 34);
      if (!art) return m;
      if (/item-art-slot/.test(m)) return m;
      if (/slot-ico/.test(m)) return m.replace(/<span class="slot-ico"[^>]*>[\s\S]*?<\/span>/, ItemArt.slotWrap(art, 'var(--amber)'));
      return `<div class="item-row hl">${ItemArt.slotWrap(art, 'var(--amber)')}<div class="grow"><b>${title}`;
    });
    // 유물 줄
    html = html.replace(/<div class="item-row"><div class="grow"><b style="color:([^"]+)">([^<]+)<\/b> <span class="tag">/g, (m, col, name) => {
      const R = (typeof RELICS !== 'undefined' ? RELICS : []).find((r) => r.name === name);
      if (!R) return m;
      const art = ItemArt.icon({ type: 'relic', id: R.id }, 34);
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, col)}<div class="grow"><b style="color:${col}">${name}</b> <span class="tag">`;
    });
    html = html.replace(/<div class="item-row"><div class="grow item-tap"[^>]*data-v="relic:([^:]+):/g, (m, id) => {
      if (/item-art-slot/.test(m)) return m;
      const art = ItemArt.icon({ type: 'relic', id }, 34);
      if (!art) return m;
      const col = '#d9b0ff';
      return `<div class="item-row">${ItemArt.slotWrap(art, col)}${m.slice('<div class="item-row">'.length)}`;
    });
    // 공방 부산물 제작 줄: "...급 괴수 가죽 3/4 · ..."
    html = html.replace(/<div class="item-row"><div class="grow"><b>([^<]+)<\/b>([\s\S]*?<div class="small dim">)((?:[FEDCBA]|SS?)급 [^·<]+)/g, (m, recipe, mid, partLab) => {
      if (/item-art-slot/.test(m)) return m;
      const rk = /^((?:[FEDCBA]|SS?)급)\s*(\S+)/.exec(partLab.trim());
      // partLabel = "F급 괴수 가죽" — 이름에 공백 가능
      const full = /^((?:[FEDCBA]|SS?)급)\s*(.+?)\s+\d+\//.exec(partLab.trim()) || /^((?:[FEDCBA]|SS?)급)\s*(.+)$/.exec(partLab.trim());
      const pname = full ? full[2].trim() : (rk ? rk[2] : '');
      const pid = (typeof PARTS !== 'undefined' && Object.keys(PARTS).find((k) => PARTS[k].name === pname)) || null;
      const art = pid ? ItemArt.icon({ type: 'part', id: pid }, 34) : '';
      if (!art) return m;
      return `<div class="item-row">${ItemArt.slotWrap(art, '#7ec8a3')}<div class="grow"><b>${recipe}</b>${mid}${partLab}`;
    });
    return html;
  };

  for (const name of ['shopHtml', 'charHtml', 'cityHtml', 'facilityHtml', 'workshopHtml']) {
    if (!UI[name]) continue;
    const base = UI[name];
    UI[name] = function (...a) { return paintItemHtml(base.apply(this, a)); };
  }

  // 아이템 상세 팝업
  const baseInfo = UI.itemInfoHtml;
  if (baseInfo) UI.itemInfoHtml = function (ref) {
    let html = baseInfo.call(this, ref);
    if (!html) return html;
    try {
      const s = String(ref || '');
      let artRef = null;
      if (s.startsWith('cons:')) artRef = { type: 'cons', id: s.slice(5) };
      else if (s.startsWith('core:')) artRef = { type: 'core' };
      else if (s.startsWith('part:')) artRef = { type: 'part', id: s.split(':')[1] };
      else if (s.startsWith('relic:')) artRef = { type: 'relic', id: s.split(':')[1] };
      else if (s.startsWith('cat:')) artRef = { type: 'cat' };
      else if (s.startsWith('equip:')) {
        const uid = s.slice(6); let it = null;
        if (G && G.player) {
          it = (G.player.inventory || []).find((e) => e.uid === uid)
            || Object.values(G.player.equip || {}).find((e) => e && e.uid === uid);
          if (!it) try { it = (G.getShop().equips || []).find((e) => e.uid === uid); } catch (e) { /* */ }
        }
        artRef = { type: 'equip', it: it || { slot: 'weapon' } };
      } else if (s.includes('|')) {
        const bar = s.indexOf('|');
        const kind = decodeURIComponent(s.slice(0, bar));
        const name = decodeURIComponent(s.slice(bar + 1));
        if (kind === '괴수 코어') artRef = { type: 'core' };
        else if (kind === '부산물') {
          const rk = /^([FEDCBA]|SS?)급\s*(.*)$/.exec(name.trim());
          const rest = rk ? rk[2] : name;
          const id = (typeof PARTS !== 'undefined' && Object.keys(PARTS).find((k) => PARTS[k].name === rest)) || 'bone';
          artRef = { type: 'part', id };
        } else if (kind === '유물 발견' || kind === '보스 드롭') {
          const R = (typeof RELICS !== 'undefined' ? RELICS : []).find((r) => name.includes(r.name));
          if (R) artRef = { type: 'relic', id: R.id };
        } else {
          const C = (typeof CONSUMABLES !== 'undefined' ? CONSUMABLES : []).find((c) => c.name === name);
          if (C) artRef = { type: 'cons', id: C.id };
        }
      }
      const art = artRef ? ItemArt.icon(artRef, 44) : '';
      if (art) html = html.replace(/<span class="ih-ico"[^>]*>[\s\S]*?<\/span>/, `<span class="ih-ico ih-art" aria-hidden="true">${art}</span>`);
    } catch (e) { /* 무시 */ }
    return html;
  };

  const baseChip = UI.itemChip;
  if (baseChip) UI.itemChip = function (kind, name, n = 1) {
    const html = baseChip.call(this, kind, name, n);
    let art = '';
    if (kind === '괴수 코어' || kind === 'core') art = ItemArt.icon({ type: 'core' }, 18);
    else if (kind === '부산물' || kind === 'part') {
      const rk = /^([FEDCBA]|SS?)급\s*(.*)$/.exec(String(name || '').trim());
      const rest = rk ? rk[2] : name;
      const id = (typeof PARTS !== 'undefined' && Object.keys(PARTS).find((k) => PARTS[k].name === rest)) || 'bone';
      art = ItemArt.icon({ type: 'part', id }, 18);
    } else if (kind === '유물 발견' || kind === '보스 드롭' || kind === 'relic') {
      const R = (typeof RELICS !== 'undefined' ? RELICS : []).find((r) => name && String(name).includes(r.name));
      if (R) art = ItemArt.icon({ type: 'relic', id: R.id }, 18);
    } else if (kind === '장비 획득' || kind === 'equip') art = ItemArt.icon({ kind: 'fam', key: 'sword' }, 18);
    if (!art) return html;
    return html.replace(/<em>[^<]*<\/em>/, `<em class="ss-art">${art}</em>`);
  };

  // 전투 소모품·가방 버튼에 작은 아이콘
  const paintCombatBtns = (root) => {
    if (!root) return;
    for (const btn of root.querySelectorAll('[data-act="c-item"], [data-act="c-bag-use"], [data-act="c-use"], [data-act="o-item"]')) {
      if (btn.querySelector('img.item-art')) continue;
      const id = btn.getAttribute('data-v'); if (!id) continue;
      const art = ItemArt.icon({ type: 'cons', id }, 18);
      if (art) btn.insertAdjacentHTML('afterbegin', art + ' ');
    }
  };
  const baseControls = UI.renderControls;
  if (baseControls) UI.renderControls = function (...a) {
    const r = baseControls.apply(this, a);
    try { paintCombatBtns(document.getElementById('modal-box') || document.getElementById('app')); } catch (e) { /* */ }
    return r;
  };
}
