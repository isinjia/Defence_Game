// 승인한 새 주인공 얼굴 남녀 각 5종. 완성 초상으로 목·옷깃을 보존한다.
const PlayerHeroFaces = (() => {
  const root = 'assets/portraits/player-hero/';
  let uid = 0;
  function isPlayer(seed, gender, opts = {}) {
    return gender === 'M' ? PlayerMaleArt.isPlayer(seed, gender, opts)
      : gender === 'F' && PlayerFemaleArt.isPlayer(seed, gender, opts);
  }
  function select(seed, gender, opts = {}) {
    // 여성 직업복은 승인한 기본 얼굴·단발의 37종을 유지한다.
    if (gender === 'F' && HunterOutfits.get(opts.outfit, 'F')) return 0;
    if (Number.isInteger(opts.heroFace) && opts.heroFace >= 0 && opts.heroFace <= 5) return opts.heroFace;
    // 기존 파츠를 명시해서 그리는 호출은 해당 렌더러에 그대로 전달한다.
    if (opts.maleFace || opts.maleHair || opts.maleOutfit || Number.isInteger(opts.femaleVariant)) return 0;
    const roll = FX.hash(String(seed) + '|hero-faces-v1|' + gender) % 10;
    return roll < 5 ? roll + 1 : 0;
  }
  function render(gender, face, size, opts = {}, avatar = false) {
    const g = gender === 'M' ? 'm' : 'f', id = 'pphero' + (++uid);
    const filter = PlayerMaleArt.toneFilter(id, opts.skinTone);
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="player-hero-v1" data-hero-face="${face}" data-player-${g === 'm' ? 'male' : 'female'}="1" data-body-type="normal" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size * 1.5)}" viewBox="${avatar ? '45 55 310 310' : '0 0 400 600'}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${avatar ? '초상화' : '캐릭터 일러스트'}"><defs>${filter}</defs><image href="${root}portrait-${g}-0${face}.webp" x="0" y="0" width="400" height="600" preserveAspectRatio="xMidYMid meet"${filter ? ` filter="url(#${id})"` : ''}/></svg>`;
  }
  for (const method of ['card', 'avatar']) {
    const base = PORTRAIT[method];
    PORTRAIT[method] = function(seed, gender, element, rank, size, opts = {}) {
      const face = isPlayer(seed, gender, opts) ? select(seed, gender, opts) : 0;
      return face ? render(gender, face, size === undefined ? (method === 'avatar' ? 56 : 200) : size, opts, method === 'avatar')
        : base.apply(this, arguments);
    };
  }
  return { select, render, isPlayer };
})();
