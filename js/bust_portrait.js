// ===== 게이트 크로니클: 상반신(버스트) 초상 — 전역 캐릭터 아이콘 공통 =====
// 월드맵·전투와 같이 원형 아이콘에서도 상의·의상이 보이게 한다.
// FX.avatar(얼굴만) 대신 포트레이트(의상 포함)를 잘라 쓴다.

{
  const BUST_VB = '45 55 310 310';

  let _bustUid = 0;
  /** clip/mask id를 호출마다 바꿔 대화 초상과 작은 아바타가 동시에 있어도 나체가 비치지 않게 */
  function remintPortraitIds(html) {
    const u = 'b' + (++_bustUid);
    const map = new Map();
    const rename = (id) => {
      if (!/^(ho|pp)/.test(id)) return id;
      if (!map.has(id)) map.set(id, id.replace(/[ub]\d+$/, '') + u);
      return map.get(id);
    };
    return String(html)
      .replace(/\bid="([^"]+)"/g, (_, id) => `id="${rename(id)}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${rename(id)})`);
  }

  /** 포트레이트 HTML → 상반신 크롭 SVG 문자열 */
  UI.toBustHtml = function (html, size = 64) {
    if (!html) return '';
    const d = document.createElement('div');
    d.innerHTML = remintPortraitIds(html);
    const svg = d.querySelector('svg');
    if (!svg) return html; // img 기반 초상 등은 그대로
    svg.setAttribute('viewBox', BUST_VB);
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.classList.add('bust', 'avatar');
    if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!svg.getAttribute('xmlns:xlink')) svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    // 카드 테두리·배경 사각형은 원형 아이콘에서 빼 둔다
    svg.querySelectorAll(':scope > circle, :scope > rect').forEach((n) => n.remove());
    return svg.outerHTML;
  };

  const bustFromPortrait = (raw, size, fallback) => {
    try {
      if (raw && /<svg/i.test(raw)) {
        const bust = UI.toBustHtml(raw, size);
        if (bust) return bust;
      }
    } catch (e) { /* 무시 */ }
    return typeof fallback === 'function' ? fallback() : (fallback || '');
  };

  // 모든 FX.avatar 호출 → 의상 포함 상반신 (레거시 사진 img는 기존 유지)
  if (FX && typeof FX.avatar === 'function' && typeof FX.portrait === 'function') {
    const baseFxAvatar = FX.avatar.bind(FX);
    FX.avatar = function (seed, gender, element, rankIdx, size = 56, opts = {}) {
      try {
        const raw = FX.portrait(seed, gender, element, rankIdx, Math.max(160, size * 2), opts || {});
        const bust = bustFromPortrait(raw, size, null);
        if (bust && /<svg/i.test(bust)) return bust;
      } catch (e) { /* 무시 */ }
      return baseFxAvatar(seed, gender, element, rankIdx, size, opts);
    };
  }

  UI.playerBust = function (size = 64) {
    try {
      return bustFromPortrait(this.playerPortrait(Math.max(160, size * 2)), size, () => this.playerAvatar(size));
    } catch (e) {
      try { return this.playerAvatar(size); } catch (e2) { return ''; }
    }
  };

  UI.npcBust = function (n, size = 64) {
    try {
      return bustFromPortrait(this.npcPortrait(n, Math.max(160, size * 2)), size, () => this.npcAvatar(n, size));
    } catch (e) {
      try { return this.npcAvatar(n, size); } catch (e2) { return ''; }
    }
  };

  // UI 아바타도 상반신으로 (wardrobe/job_outfits가 FX.avatar를 쓰므로 대부분 위에서 처리되지만 이중 보장)
  const basePlayerAvatar = UI.playerAvatar.bind(UI);
  UI.playerAvatar = function (size) {
    try {
      return bustFromPortrait(this.playerPortrait(Math.max(160, size * 2)), size, () => basePlayerAvatar(size));
    } catch (e) { return basePlayerAvatar(size); }
  };

  const baseNpcAvatar = UI.npcAvatar.bind(UI);
  UI.npcAvatar = function (n, size) {
    if (!n) return '';
    try {
      return bustFromPortrait(this.npcPortrait(n, Math.max(160, size * 2)), size, () => baseNpcAvatar(n, size));
    } catch (e) { return baseNpcAvatar(n, size); }
  };

  if (UI.unitAvatar) {
    const baseUnitAvatar = UI.unitAvatar.bind(UI);
    UI.unitAvatar = function (u, size) {
      try {
        if (!u) return '';
        if (u.isPlayer) return this.playerAvatar(size);
        if (u.npcId != null) {
          const n = G.npcById(u.npcId);
          if (n) return this.npcAvatar(n, size);
        }
        if (u.portrait && FX.portrait) {
          const q = u.portrait;
          const opts = { ...(typeof Wardrobe !== 'undefined' && Wardrobe.appearance ? Wardrobe.appearance(u) : {}), ...q };
          if (!opts.outfit && typeof Wardrobe !== 'undefined' && Wardrobe.profession) opts.outfit = Wardrobe.profession(u.cls, u.bg);
          const raw = FX.portrait(q.seed, q.gender, q.elem, u.tier || 0, Math.max(160, size * 2), opts);
          return bustFromPortrait(raw, size, () => baseUnitAvatar(u, size));
        }
      } catch (e) { /* 무시 */ }
      return baseUnitAvatar(u, size);
    };
  }

  if (UI.unitSprite) {
    const baseUnitSprite = UI.unitSprite.bind(UI);
    UI.unitSprite = function (u, size) {
      try {
        if (u && u.isPlayer) return this.playerAvatar(size);
        if (u && u.npcId != null) {
          const n = G.npcById(u.npcId);
          if (n) return this.npcAvatar(n, size);
        }
        if (u && u.portrait && FX.portrait) {
          const q = u.portrait;
          const opts = { ...(typeof Wardrobe !== 'undefined' && Wardrobe.appearance ? Wardrobe.appearance(u) : {}), ...q };
          if (!opts.outfit && typeof Wardrobe !== 'undefined' && Wardrobe.profession) opts.outfit = Wardrobe.profession(u.cls, u.bg);
          const raw = FX.portrait(q.seed, q.gender, q.elem, u.tier || 0, Math.max(160, size * 2), opts);
          return bustFromPortrait(raw, size, () => baseUnitSprite(u, size));
        }
      } catch (e) { /* 무시 */ }
      return baseUnitSprite(u, size);
    };
  }

  // 월드맵 플레이어 마커 → 상반신
  const baseRG = UI.renderGame;
  UI.renderGame = function (...a) {
    const r = baseRG.apply(this, a);
    try {
      if (this.map && typeof this.playerBust === 'function') this.map.setPlayerImage(this.playerBust(128));
    } catch (e) { /* 무시 */ }
    return r;
  };

  // 월드맵 NPC·파티 초상 캐시 → 상반신
  if (typeof partyFaceImage === 'function') {
    const baseFace = partyFaceImage;
    // eslint-disable-next-line no-func-assign
    partyFaceImage = function (n) {
      if (!n) return baseFace(n);
      const k = 'bust' + n.id;
      if (typeof PARTY_IMG !== 'undefined' && PARTY_IMG[k]) return PARTY_IMG[k];
      const html = (UI.npcBust && UI.npcBust(n, 64)) || '';
      if (!html || !html.includes('<svg')) return baseFace(n);
      const im = new Image();
      if (typeof PARTY_IMG !== 'undefined') PARTY_IMG[k] = im;
      const s = html.match(/<svg[\s\S]*<\/svg>/);
      if (!s) return baseFace(n);
      const svg = s[0].includes('xmlns') ? s[0] : s[0].replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const apply = (url) => { im.src = url; };
      if (svg.includes('data-portrait-parts=') && typeof PortraitParts !== 'undefined' && PortraitParts.rasterize) {
        PortraitParts.rasterize(svg).then(apply).catch(() => apply('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)));
      } else apply('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      return im;
    };
  }

  // 게이트 탐색 지도 리더 토큰 → 상반신
  const baseLead = UI.exploreLeaderFace;
  if (baseLead) UI.exploreLeaderFace = function (size) {
    try {
      const L = (this.councilLeader && this.ctx && this.ctx.run) ? this.councilLeader() : null;
      if (L) return this.npcBust(L, size);
      return this.playerBust(size);
    } catch (e) { return baseLead.call(this, size); }
  };
}
