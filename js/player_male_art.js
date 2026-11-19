// 승인한 남성 주인공 원화: 얼굴 3종, 헤어 8종, 복장 3종, 체형 1종.
// NPC와 여성은 기존 렌더러를 사용한다. 목·어깨는 승인 원화 그대로 유지한다.
const PlayerMaleArt = (() => {
  const root = 'assets/portraits/player-male/';
  // 원본 파츠를 같은 비율의 공통 캔버스에 놓는 고정 배치. 복장·나이에 따른 변형 없음.
  const registration = {"heads":[[95.62646,-17.76654,832.74708,1249.12062],[166.8129,36.17419,690.37419,1035.56129],[171.21019,36.83121,681.57962,1022.36943]],"hairs":[[307.2,98.0,409.6,614.4],[307.2,98.0,409.6,614.4],[307.2,94.0,409.6,614.4],[307.2,88.0,409.6,614.4],[307.2,94.0,409.6,614.4],[307.2,98.0,409.6,614.4],[307.2,98.0,409.6,614.4],[307.2,82.0,409.6,614.4]]};
  let uid = 0;
  const file = (kind, n) => root + kind + '-0' + n + '.webp';
  function select(seed, opts = {}) {
    const pick = (name, count) => FX.hash(String(seed) + '|player-male-v1|' + name) % count + 1;
    const valid = (v, n) => Number.isInteger(v) && v >= 1 && v <= n;
    return {
      face: valid(opts.maleFace, 3) ? opts.maleFace : pick('face', 3),
      hair: valid(opts.maleHair, 8) ? opts.maleHair : pick('hair', 8),
      outfit: valid(opts.maleOutfit, 3) ? opts.maleOutfit : pick('outfit', 3),
      bodyType: 'normal'
    };
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
    const s = select(seed, opts), id = 'ppmale' + (++uid);
    const headRect = registration.heads[s.face-1], hairRect = registration.hairs[s.hair-1];
    const filter = toneFilter(id + 'tone', opts.skinTone);
    const skin = filter ? ` filter="url(#${id}tone)"` : '';
    const image = (src,rect,extra='') => `<image href="${src}" x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" preserveAspectRatio="xMidYMid meet"${extra}/>`;
    const art = `<defs>${filter}</defs>` + image(file('headneck',s.face),headRect,skin)
      + image(file('clothes',s.outfit),[0,0,1024,1536]) + image(file('hair',s.hair),hairRect);
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="player-male-v2" data-player-male="1" data-body-type="normal" data-face="${s.face}" data-hair="${s.hair}" data-outfit="${s.outfit}" class="${avatar?'avatar':'portrait'}" width="${size}" height="${avatar?size:Math.round(size*1.5)}" viewBox="${avatar?'39 16 322 322':'0 0 400 600'}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${avatar?'초상화':'캐릭터 일러스트'}"><svg width="400" height="600" viewBox="0 0 1024 1536" preserveAspectRatio="xMidYMid meet">${art}</svg></svg>`;
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
