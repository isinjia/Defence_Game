// 메인 고정 인물 일러스트 (영역 B, 사용자 요청: 올린 전신 일러스트를 잘라 적용)
// 원본: assets/portraits/main/*.png (전신, 1024×1536). 대화창·카드에는 머리~가슴을 5:6으로 자른
// assets/portraits/main/bust/*.webp(400×480)를 쓴다. 자르기는 그림마다 머리 꼭대기·머리 중심을 찾아 자동으로 맞췄다.
// 시기·갈래별 옷은 docs/메인_인물_외형.md 기준으로 현재 장(M.ch)과 메인 플래그를 보고 고른다.
{
  const ROOT = 'assets/portraits/main/bust/';
  const ch = (M) => (M && M.ch) || 1;
  const part = (M) => { const c = typeof MAIN !== 'undefined' && MAIN.chapters[ch(M)]; return (c && c.part) || 1; };
  // 이름 → (M, f=M.flags) → 그림 이름
  const CAST = {
    '진서해': (M, f) => (part(M) === 5 ? 'jin-strait' : f.jinFace ? 'jin-unmasked' : 'jin-masked'),
    '무명': () => 'jin-masked',
    '아린': (M) => (ch(M) >= 31 ? 'arin-material' : 'arin-dream'),
    '목소리': () => 'arin-dream',
    '마도현': (M, f) => (f.madoState === 'jailed' ? (ch(M) <= 18 ? 'mado-arrest' : 'mado-detention') : 'mado-suit'),
    '한서윤': (M, f) => (f.seoyunBurned ? 'seoyun-retired' : 'seoyun-suit'),
    '윤해람': () => 'yoon-observatory',
    '고재석': () => 'go-survivor',
    '권만석': (M) => (ch(M) <= 4 ? 'kwon-ritual' : 'kwon-survivor'),
    '권하은': (M) => (ch(M) >= 40 ? 'haeun-evac' : part(M) >= 4 ? 'haeun-late' : 'haeun-school'),
    '서연희': (M, f) => (f.yeonhee === 'hurt' ? 'yeonhee-injured' : part(M) === 2 ? 'yeonhee-robe' : 'yeonhee-kitchen'),
    '도윤': (M) => { const n = ch(M); return n >= 40 ? 'doyun-school' : n >= 34 ? 'doyun-apprentice' : n === 24 ? 'doyun-robe' : n === 16 ? 'doyun-patient' : n >= 12 ? 'doyun-string' : 'doyun-child'; },
    '지우': (M) => (ch(M) >= 40 ? 'jiwoo-evac' : 'jiwoo-robe'),
    '오민재': () => 'minjae-research',
    '7번': () => 'seven-hoodie',
  };
  // 메인 고정 인물이 실제 NPC로 만들어진 경우(한서윤 등): 그 NPC id → 이름
  const npcKey = (n) => {
    if (!n || n.id == null || typeof G === 'undefined' || !G.flags || !G.flags.main || !G.flags.main.npc) return null;
    const ids = G.flags.main.npc; for (const k of Object.keys(ids)) if (ids[k] === n.id && CAST[n.name]) return n.name;
    return null;
  };
  UI.mainArt = function (name) {
    const pick = CAST[name]; if (!pick || typeof G === 'undefined' || !G.mainState) return null;
    try { const M = G.mainState(); const file = pick(M, M.flags || {}); return file ? ROOT + file + '.webp' : null; } catch (e) { return null; }
  };
  const card = (src, w, ring) => `<div class="portrait-img main-art" style="width:${w}px;--rc:${ring || '#7a8aa0'}"><img src="${src}" alt="인물 일러스트"></div>`;
  const avatar = (src, size, ring) => `<span class="avatar avatar-img main-art" style="width:${size}px;height:${size}px;--rc:${ring || '#7a8aa0'}"><img src="${src}" alt=""></span>`;

  // 대화창: { name } 으로 오는 고정 인물과, 실제 NPC가 된 고정 인물
  const baseSpeaker = UI.dlgSpeaker;
  UI.dlgSpeaker = function (who) {
    const sp = baseSpeaker.call(this, who);
    try {
      if (!sp || !who || who === 'player' || typeof who === 'string') return sp;
      const name = who.id != null ? npcKey(who) : who.name;
      const src = name && this.mainArt(name);
      if (src) sp.art = card(src, window.innerWidth < 520 ? 74 : 92, sp.color);
    } catch (e) { /* 실패하면 기본 초상 */ }
    return sp;
  };
  // 인물 카드·목록의 초상 (실제 NPC가 된 고정 인물)
  const basePortrait = UI.npcPortrait, baseAvatar = UI.npcAvatar;
  UI.npcPortrait = function (n, w) { const k = npcKey(n); const src = k && this.mainArt(k); return src ? card(src, w) : basePortrait.call(this, n, w); };
  UI.npcAvatar = function (n, size) { const k = npcKey(n); const src = k && this.mainArt(k); return src ? avatar(src, size) : baseAvatar.call(this, n, size); };
}
