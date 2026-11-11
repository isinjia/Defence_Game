// 스킬 종류(type) 아이콘을 웹툰풍 이미지로 표시한다. 속성 색(--c)·기존 동작은 그대로다.
const SkillArt = (() => {
  const data = typeof SKILL_ART_DATA !== 'undefined' ? SKILL_ART_DATA : {};
  const byKey = {};
  for (const [id, meta] of Object.entries(data)) if (meta && meta.key) byKey[meta.key] = id;
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const url = (id, kind = 'thumb') => {
    const meta = data[id]; if (!meta) return '';
    return `assets/skills/${kind}/${encodeURIComponent(id)}.webp?v=${meta.rev}`;
  };
  const img = (id, size = 22, cls = 'skill-art') => {
    if (!data[id]) return '';
    const s = Math.max(12, Math.min(256, Number(size) || 22));
    const name = data[id].name || id;
    return `<img class="${cls}" data-skill-art="${esc(id)}" src="${url(id, 'thumb')}" srcset="${url(id, 'thumb')} 128w, ${url(id, 'web')} 512w" sizes="${s}px" width="${s}" height="${s}" alt="${esc(name)}" loading="lazy" decoding="async" draggable="false">`;
  };
  const resolveId = (typeOrSk) => {
    if (!typeOrSk) return null;
    if (typeof typeOrSk === 'string') return byKey[typeOrSk] || (data[typeOrSk] ? typeOrSk : null);
    return typeOrSk.type ? byKey[typeOrSk.type] || null : null;
  };
  const icon = (typeOrSk, size = 22) => {
    const id = resolveId(typeOrSk);
    return id ? img(id, size) : '';
  };
  return { data, byKey, url, img, resolveId, icon };
})();

FX.skillIcon = function (sk, size = 22) {
  const art = SkillArt.icon(sk, size);
  if (art) return art;
  if (sk && typeof sk === 'object') {
    const e = sk.elem === 'self' ? null : sk.elem;
    return FX.elemIcon(e, size);
  }
  return FX.elemIcon(null, size);
};

document.addEventListener('error', (ev) => {
  const img = ev.target;
  if (!img || !img.matches || !img.matches('img.skill-art') || img.dataset.originalTried) return;
  const id = img.dataset.skillArt; if (!SkillArt.data[id]) return;
  img.dataset.originalTried = '1'; img.removeAttribute('srcset');
  img.src = `assets/skills/original/${encodeURIComponent(id)}.png`;
}, true);

{
  // 스킬 시트: 속성 SVG 대신 종류 이미지 (기존 함수 감싸기)
  const baseSkills = UI.skillsHtml;
  if (baseSkills) UI.skillsHtml = function (...a) {
    let html = baseSkills.apply(this, a);
    html = html.replace(/<div class="item-row([^"]*)">\s*<span class="slot-ico"[^>]*>[\s\S]*?<\/span>([\s\S]*?(?:data-act="toggle-skill" data-v="([^"]+)"|기본<\/span>))/g, (m, cls, rest, id) => {
      let sk = id && typeof skillById === 'function' ? skillById(id) : null;
      if (!sk) {
        const nm = /<b>([^<]+)<\/b>/.exec(rest); sk = nm ? (SKILLS || []).find((s) => s.name === nm[1]) : null;
      }
      if (!sk) return m;
      const art = FX.skillIcon(sk, 34);
      const cm = /style="--c:([^"]+)"/.exec(m);
      const col = cm ? cm[1] : '#9aa6b8';
      return `<div class="item-row${cls}"><span class="slot-ico skill-art-slot" style="--c:${col}">${art}</span>${rest}`;
    });
    return html;
  };

  // 상점·아카이브 스킬 행의 아이콘만 교체 (다른 행은 유지)
  const paintShopSkills = (html) => {
    if (!html || typeof skillById !== 'function') return html;
    return html.replace(/<div class="item-row"><span class="slot-ico"[^>]*>[\s\S]*?<\/span>\s*<div class="grow"><b>([^<]+)<\/b>[\s\S]*?data-act="buy-skill" data-v="([^"]+)"/g, (m, name, id) => {
      const sk = skillById(id); if (!sk) return m;
      const art = FX.skillIcon(sk, 34);
      const cm = /style="--c:([^"]+)"/.exec(m);
      const col = cm ? cm[1] : '#9aa6b8';
      return m.replace(/<span class="slot-ico"[^>]*>[\s\S]*?<\/span>/, `<span class="slot-ico skill-art-slot" style="--c:${col}">${art}</span>`);
    });
  };
  for (const name of ['shopHtml', 'cityHtml', 'facilityHtml']) {
    if (!UI[name]) continue;
    const base = UI[name];
    UI[name] = function (...a) { return paintShopSkills(base.apply(this, a)); };
  }

  // 전투·오더 스킬 버튼 DOM에 종류 아이콘 심기
  const swapBtnIcons = (root) => {
    if (!root) return;
    for (const btn of root.querySelectorAll('.skill-btn[data-act="c-skill"], .skill-btn[data-act="o-skill"]')) {
      if (btn.querySelector('img.skill-art')) continue;
      const id = btn.getAttribute('data-v'); if (!id || typeof skillById !== 'function') continue;
      const sk = skillById(id); if (!sk) continue;
      const art = SkillArt.icon(sk, 18); if (!art) continue;
      const old = btn.querySelector('svg, img');
      if (old) old.outerHTML = art;
      else btn.insertAdjacentHTML('afterbegin', art);
    }
  };
  const paintStatus = (root) => {
    if (!root) return;
    for (const btn of root.querySelectorAll('button.st-sk[data-v]')) {
      if (btn.querySelector('img.skill-art')) continue;
      const sk = typeof skillById === 'function' ? skillById(btn.getAttribute('data-v')) : null;
      const art = SkillArt.icon(sk, 14); if (!art) continue;
      const old = btn.querySelector('svg, img');
      if (old) old.outerHTML = art;
      else btn.insertAdjacentHTML('afterbegin', art);
    }
  };

  const baseCtrl = UI.renderControls;
  if (baseCtrl) UI.renderControls = function (...a) {
    const r = baseCtrl.apply(this, a);
    try { swapBtnIcons(document.getElementById('cb-ctrl') || document.getElementById('modal-box')); } catch (e) { /* */ }
    return r;
  };
  const baseRender = UI.render;
  if (baseRender) UI.render = function (...a) {
    const r = baseRender.apply(this, a);
    try {
      const root = document.getElementById('modal-box') || document.getElementById('app');
      paintStatus(root); swapBtnIcons(document.getElementById('cb-ctrl'));
    } catch (e) { /* */ }
    return r;
  };

  // 스킬 상세 팝업 머리 아이콘
  const obs = new MutationObserver((muts) => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (!n || !n.querySelector) continue;
      const hold = (n.id === 'skill-hold' || (n.classList && n.classList.contains('skill-hold'))) ? n
        : n.querySelector('#skill-hold, .skill-hold, .skill-hold-wrap');
      if (!hold) continue;
      const head = hold.querySelector('.sh-head'); if (!head || head.querySelector('img.skill-art')) continue;
      const b = head.querySelector('b'); if (!b) continue;
      const sk = (typeof SKILLS !== 'undefined' ? SKILLS : []).find((s) => s.name === b.textContent.trim());
      const art = SkillArt.icon(sk, 22); if (!art) continue;
      const old = head.querySelector('svg, img');
      if (old) old.outerHTML = art;
      else head.insertAdjacentHTML('afterbegin', art);
    }
  });
  if (typeof document !== 'undefined') {
    const start = () => obs.observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }
}
