// 승인한 남성 주인공 원화: 얼굴 3종, 헤어 8종, 복장 3종, 체형 1종.
// NPC와 여성은 기존 렌더러를 사용한다. 목·어깨는 승인 원화 그대로 유지한다.
const PlayerMaleArt = (() => {
  const root = 'assets/portraits/player-male/';
  const jaws = [
    'M0 0H1024V835H805Q794 945 756 990L603 1138Q580 1158 512 1158Q446 1158 423 1138L280 994Q240 955 223 835H0Z',
    'M0 0H1024V875H798Q780 955 753 995L613 1161Q580 1196 515 1196Q447 1196 418 1166L272 1021Q247 980 230 875H0Z',
    'M0 0H1024V840H824Q808 963 778 997L610 1158Q580 1187 515 1187Q447 1187 414 1158L250 1010Q210 970 196 840H0Z'
  ];
  // 각 원화의 턱 아래만 남긴다. 목을 가로로 줄이거나 새로 자르지 않는다.
  const bodies = [
    'M0 480H420L478 550Q512 565 546 550L614 480H1024V1536H0Z',
    'M0 482H414L477 557Q512 571 548 557L620 482H1024V1536H0Z',
    'M0 482H420L478 554Q512 568 547 554L615 482H1024V1536H0Z'
  ];
  const hairY = [
    [0,0,-10,-25,-10,0,0,-40],
    [0,0,0,0,0,0,0,0],
    [-10,-10,-25,-40,-25,-10,-10,-55]
  ];
  let uid = 0;
  const file = (kind, n) => root + kind + '-0' + n + '.webp';
  function select(seed, opts = {}) {
    const pick = (name, count) => FX.hash(String(seed) + '|player-male-v1|' + name) % count + 1;
    const valid = (v, n) => Number.isInteger(v) && v >= 1 && v <= n;
    return {
      face: valid(opts.maleFace, 3) ? opts.maleFace : pick('face', 3),
      hair: valid(opts.maleHair, 8) ? opts.maleHair : pick('hair', 8),
      outfit: valid(opts.maleOutfit, 3) ? opts.maleOutfit : outfitFor(opts.outfit) || pick('outfit', 3),
      bodyType: 'normal'
    };
  }
  function outfitFor(outfit) {
    if (outfit === 'casual') return 2;
    if (['coat','overcoat','hanbok','mandarin'].includes(outfit)) return 3;
    if (outfit === 'tactical') return 1;
    if (typeof outfit === 'string' && outfit.startsWith('hunter:')) {
      const c = typeof classById === 'function' && classById(outfit.slice(7));
      return c && ['mage','summon','support','esper','east','hidden','shadow'].includes(c.g) ? 3 : 1;
    }
    return null;
  }
  function isPlayer(seed, gender, opts = {}) {
    if (gender !== 'M') return false;
    if (opts.playerMaleArt === true) return true;
    const states = [typeof G !== 'undefined' && G.player,
      typeof UI !== 'undefined' && UI.pro, typeof UI !== 'undefined' && UI.create];
    return states.some(s => s && s.gender === 'M' && s.look === seed);
  }
  function toneFilter(id, tone) {
    const rgb = { fair:[246,218,200], medium:[220,180,150], tan:[182,133,95], deep:[133,88,65] }[tone];
    if (!rgb) return '';
    const gains = rgb.map((v,i) => v / [222,193,173][i]);
    // 피부의 적·청 채널 차이로 마스크를 만든다. 머리와 의상은 원색을 유지한다.
    return `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 10 0 -10 0 -.7" result="key"/><feComponentTransfer in="key" result="keyed"><feFuncA type="linear" slope="4" intercept="-1.5"/></feComponentTransfer><feComposite in="keyed" in2="SourceGraphic" operator="in" result="skin"/><feComponentTransfer in="SourceGraphic" result="tinted"><feFuncR type="linear" slope="${gains[0]}"/><feFuncG type="linear" slope="${gains[1]}"/><feFuncB type="linear" slope="${gains[2]}"/></feComponentTransfer><feComposite in="tinted" in2="skin" operator="in" result="newSkin"/><feComposite in="SourceGraphic" in2="skin" operator="out" result="rest"/><feMerge><feMergeNode in="rest"/><feMergeNode in="newSkin"/></feMerge></filter>`;
  }
  function render(seed, size = 200, opts = {}, avatar = false) {
    const s = select(seed, opts), id = 'ppmale' + (++uid), scale = s.face === 2 ? .41 : .4;
    const x = (1024 - 1024 * scale) / 2;
    const y = [98,112,102][s.outfit-1] - [0,25,12][s.face-1];
    const w = 1024 * scale, h = 1536 * scale;
    const necks = ['M400 470H630V595Q512 646 400 595Z','M400 480H640V650Q512 704 400 650Z','M400 480H630V600Q512 650 400 600Z'];
    const filter = toneFilter(id + 'tone', opts.skinTone);
    const skin = filter ? ` filter="url(#${id}tone)"` : '';
    const head = `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 1024 1536"><defs><clipPath id="${id}jaw"><path d="${jaws[s.face-1]}"/></clipPath></defs><image href="${file('face',s.face)}" width="1024" height="1536" clip-path="url(#${id}jaw)"${skin}/></svg>`;
    const body = `<image href="${file('look',s.outfit)}" width="1024" height="1536"/>`;
    const art = `<defs>${filter}<clipPath id="${id}body"><path d="${bodies[s.outfit-1]}"/></clipPath><clipPath id="${id}neck"><path d="${necks[s.outfit-1]}"/></clipPath></defs><g clip-path="url(#${id}body)">${body}${filter ? `<g clip-path="url(#${id}neck)"><image href="${file('look',s.outfit)}" width="1024" height="1536"${skin}/></g>` : ''}</g>${head}<image href="${file('hair',s.hair)}" x="${x}" y="${y+hairY[s.face-1][s.hair-1]*scale}" width="${w}" height="${h}"/>`;
    // 기존 상반신 크롭과 같은 400×600 좌표로 정규화한다.
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="player-male-v1" data-player-male="1" data-body-type="normal" data-face="${s.face}" data-hair="${s.hair}" data-outfit="${s.outfit}" class="${avatar?'avatar':'portrait'}" width="${size}" height="${avatar?size:Math.round(size*1.5)}" viewBox="${avatar?'39 16 322 322':'0 0 400 600'}" role="img" aria-label="${avatar?'초상화':'캐릭터 일러스트'}"><svg width="400" height="600" viewBox="0 0 1024 1536">${art}</svg></svg>`;
  }
  const card = PORTRAIT.card, avatar = PORTRAIT.avatar;
  PORTRAIT.card = function(seed,g,e,r,size=200,opts={}) {
    return isPlayer(seed,g,opts) ? render(seed,size,opts) : card.apply(this,arguments);
  };
  PORTRAIT.avatar = function(seed,g,e,r,size=56,opts={}) {
    return isPlayer(seed,g,opts) ? render(seed,size,opts,true) : avatar.apply(this,arguments);
  };
  const controls = Wardrobe.controls;
  Wardrobe.controls = function(s) {
    if (s.gender !== 'M') return controls(s);
    s.bodyType = 'normal';
    return controls(s).replace(/<button\b[^>]*data-act="appearance-body"[^>]*>[\s\S]*?<\/button>/g,
      button => button.includes('data-v="normal"') ? button : '');
  };
  const appearance = Wardrobe.appearance;
  Wardrobe.appearance = function(s) {
    const a = appearance(s);
    if (s && s.gender === 'M' && [G.player,UI.pro,UI.create].includes(s)) a.bodyType = 'normal';
    return a;
  };
  const handle = UI.handle;
  UI.handle = function(act,value) {
    const s = this.screen === 'story-setup' ? this.pro : this.screen === 'create' ? this.create : null;
    if (act === 'appearance-body' && s && s.gender === 'M') value = 'normal';
    return handle.call(this,act,value);
  };
  for (const method of ['newGame','initSandbox']) {
    const base = Game.prototype[method];
    Game.prototype[method] = function(...args) {
      const result = base.apply(this,args);
      if (this.player && this.player.gender === 'M') this.player.bodyType = 'normal';
      return result;
    };
  }
  return { select, render, isPlayer };
})();
