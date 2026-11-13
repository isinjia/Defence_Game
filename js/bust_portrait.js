// ===== 게이트 크로니클: 상반신(버스트) 초상 — 전투·월드맵 캐릭터 표시 공통 =====
// 아바타(얼굴만) 대신 포트레이트를 원형으로 잘라 상체·의상이 보이게 한다.

{
  const BUST_VB = '45 55 310 310';

  /** 포트레이트 HTML → 상반신 크롭 SVG 문자열 */
  UI.toBustHtml = function (html, size = 64) {
    if (!html) return '';
    const d = document.createElement('div');
    d.innerHTML = html;
    const svg = d.querySelector('svg');
    if (!svg) return html; // img 기반 초상 등은 그대로
    svg.setAttribute('viewBox', BUST_VB);
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.classList.add('bust');
    if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!svg.getAttribute('xmlns:xlink')) svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svg.querySelectorAll(':scope > circle, :scope > rect').forEach((n) => n.remove());
    return svg.outerHTML;
  };

  UI.playerBust = function (size = 64) {
    try {
      const raw = this.playerPortrait(Math.max(120, size * 2));
      return this.toBustHtml(raw, size) || this.playerAvatar(size);
    } catch (e) { return this.playerAvatar(size); }
  };

  UI.npcBust = function (n, size = 64) {
    try {
      const raw = this.npcPortrait(n, Math.max(120, size * 2));
      return this.toBustHtml(raw, size) || this.npcAvatar(n, size);
    } catch (e) { return this.npcAvatar(n, size); }
  };

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
