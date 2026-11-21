// 승인한 여성 주인공 기본 외형 1종. 완성 원화를 변형 없이 사용한다.
const PlayerFemaleArt = (() => {
  const source = 'assets/portraits/player-female/default-01.webp';
  function isPlayer(seed, gender, opts = {}) {
    if (gender !== 'F') return false;
    if (opts.playerFemaleArt === true) return true;
    return [typeof G !== 'undefined' && G.player,
      typeof UI !== 'undefined' && UI.pro, typeof UI !== 'undefined' && UI.create]
      .some(s => s && s.gender === 'F' && s.look === seed);
  }
  function render(size = 200, avatar = false) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="player-female-v1" data-player-female="1" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size * 1.5)}" viewBox="${avatar ? '45 55 310 310' : '0 0 400 600'}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${avatar ? '초상화' : '캐릭터 일러스트'}"><image href="${source}" x="0" y="0" width="400" height="600" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }
  for (const name of ['card', 'avatar']) {
    const base = PORTRAIT[name];
    PORTRAIT[name] = function(seed, gender, element, rank, size, opts = {}) {
      return isPlayer(seed, gender, opts) ? render(size === undefined ? (name === 'avatar' ? 56 : 200) : size, name === 'avatar') : base.apply(this, arguments);
    };
  }
  const controls = Wardrobe.controls;
  Wardrobe.controls = function(s) {
    if (!s || !isPlayer(s.look, s.gender)) return controls.apply(this, arguments);
    // 현재 승인된 여성 원화는 체형·피부색·헤어·복장 모두 기본 1종이다.
    return '<div class="sec"><div class="sec-title">외형</div><div>기본 외형</div></div>';
  };
  return { render, isPlayer };
})();
