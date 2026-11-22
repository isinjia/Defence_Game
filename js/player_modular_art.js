// Independent player face, front/back hair and clothing layers. NPC passthrough.
const PlayerModularArt = (() => {
  let uid = 0;
  const root = 'assets/portraits/';
  const extraRoot = root+'player-modular-extra/';
  const counts = Object.freeze({ M:Object.freeze({face:25,hair:25}), F:Object.freeze({face:25,hair:20}) });
  const partsRoot = 'assets/portraits/player-modular/';
  const PARTS_PROFILES = {"m":{"swordsman":[14,16,17,18,19,20,21,21,22,22,22,22,22,22,22,21,21,20,19,18,17,16,14],"berserker":[13,16,18,20,22,23,24,25,25,26,26,26,26,26,25,25,24,23,22,20,18,16,13],"lancer":[15,17,19,20,21,22,22,23,23,24,24,24,24,24,23,23,22,22,21,20,19,17,15],"monk":[10,14,16,18,20,21,22,23,24,25,25,25,25,25,24,23,22,21,20,18,16,14,10],"dualblade":[18,21,23,25,26,27,28,29,29,30,30,30,30,30,29,29,28,27,26,25,23,21,18],"guardian":[14,17,19,20,21,22,23,24,24,25,25,25,25,25,24,24,23,22,21,20,19,17,14],"paladin":[16,19,21,23,24,25,26,27,27,28,28,28,28,28,27,27,26,25,24,23,21,19,16],"giant":[14,17,19,21,22,23,24,25,25,26,26,26,26,26,25,25,24,23,22,21,19,17,14],"assassin":[15,18,21,23,24,26,27,27,28,29,29,29,29,29,28,27,27,26,24,23,21,18,15],"thief":[14,17,19,21,22,23,24,25,25,26,26,26,26,26,25,25,24,23,22,21,19,17,14],"poisoner":[22,24,26,27,29,30,30,31,31,32,32,32,32,32,31,31,30,30,29,27,26,24,22],"archer":[14,16,17,18,19,20,21,21,22,22,22,22,22,22,22,21,21,20,19,18,17,16,14],"sniper":[14,16,18,19,20,21,21,22,22,23,23,23,23,23,22,22,21,21,20,19,18,16,14],"gunslinger":[10,12,14,15,17,18,18,19,19,20,20,20,20,20,19,19,18,18,17,15,14,12,10],"elementalist":[6,8,9,10,11,12,13,13,14,14,14,14,14,14,14,13,13,12,11,10,9,8,6],"warlock":[16,19,21,22,23,24,25,26,26,27,27,27,27,27,26,26,25,24,23,22,21,19,16],"warder":[12,15,17,18,19,20,21,22,22,23,23,23,23,23,22,22,21,20,19,18,17,15,12],"chronomancer":[14,16,17,18,19,20,21,21,22,22,22,22,22,22,22,21,21,20,19,18,17,16,14],"summoner":[15,17,19,20,21,22,22,23,23,24,24,24,24,24,23,23,22,22,21,20,19,17,15],"necromancer":[18,20,22,23,24,25,25,26,26,27,27,27,27,27,26,26,25,25,24,23,22,20,18],"tamer":[12,14,15,16,17,18,19,19,20,20,20,20,20,20,20,19,19,18,17,16,15,14,12],"healer":[22,24,26,27,29,30,30,31,31,32,32,32,32,32,31,31,30,30,29,27,26,24,22],"priest":[27,30,32,34,35,36,37,38,38,39,39,39,39,39,38,38,37,36,35,34,32,30,27],"bard":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16],"alchemist":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"telekinetic":[15,17,19,20,22,23,23,24,24,25,25,25,25,25,24,24,23,23,22,20,19,17,15],"telepath":[18,21,23,25,26,27,28,29,29,30,30,30,30,30,29,29,28,27,26,25,23,21,18],"teleporter":[19,21,23,24,25,26,26,27,27,28,28,28,28,28,27,27,26,26,25,24,23,21,19],"seer":[12,14,15,16,17,18,19,19,20,20,20,20,20,20,20,19,19,18,17,16,15,14,12],"shaman":[14,16,18,19,21,22,22,23,23,24,24,24,24,24,23,23,22,22,21,19,18,16,14],"taoist":[20,22,24,25,27,28,28,29,29,30,30,30,30,30,29,29,28,28,27,25,24,22,20],"swordmonk":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16],"blackflame":[8,10,11,12,13,14,15,15,16,16,16,16,16,16,16,15,15,14,13,12,11,10,8],"apostle":[8,10,11,12,13,14,15,15,16,16,16,16,16,16,16,15,15,14,13,12,11,10,8],"machinist":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"gatekeeper":[11,14,17,19,20,22,23,23,24,25,25,25,25,25,24,23,23,22,20,19,17,14,11],"heir":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16]},"f":{"swordsman":[12,14,15,16,17,18,19,19,20,20,20,20,20,20,20,19,19,18,17,16,15,14,12],"berserker":[10,12,14,15,16,17,17,18,18,19,19,19,19,19,18,18,17,17,16,15,14,12,10],"lancer":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"monk":[13,16,18,19,20,21,22,23,23,24,24,24,24,24,23,23,22,21,20,19,18,16,13],"dualblade":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16],"guardian":[6,8,10,11,12,13,13,14,14,15,15,15,15,15,14,14,13,13,12,11,10,8,6],"paladin":[18,19,20,20,21,21,21,22,22,22,22,22,22,22,22,22,21,21,21,20,20,19,18],"giant":[14,17,19,21,23,24,25,26,26,27,27,27,27,27,26,26,25,24,23,21,19,17,14],"assassin":[22,24,26,27,29,30,30,31,31,32,32,32,32,32,31,31,30,30,29,27,26,24,22],"thief":[18,20,22,23,25,26,26,27,27,28,28,28,28,28,27,27,26,26,25,23,22,20,18],"poisoner":[19,20,21,21,22,22,22,23,23,23,23,23,23,23,23,23,22,22,22,21,21,20,19],"archer":[16,17,18,19,20,21,21,21,22,22,22,22,22,22,22,21,21,21,20,19,18,17,16],"sniper":[18,20,21,22,23,24,25,25,26,26,26,26,26,26,26,25,25,24,23,22,21,20,18],"gunslinger":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16],"elementalist":[12,14,15,16,17,18,19,19,20,20,20,20,20,20,20,19,19,18,17,16,15,14,12],"warlock":[14,16,18,19,21,22,22,23,23,24,24,24,24,24,23,23,22,22,21,19,18,16,14],"warder":[16,18,19,20,21,22,23,23,24,24,24,24,24,24,24,23,23,22,21,20,19,18,16],"chronomancer":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"summoner":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"necromancer":[32,34,36,37,38,39,39,40,40,41,41,41,41,41,40,40,39,39,38,37,36,34,32],"tamer":[18,21,23,25,27,28,29,30,30,31,31,31,31,31,30,30,29,28,27,25,23,21,18],"healer":[20,23,25,27,28,29,30,31,31,32,32,32,32,32,31,31,30,29,28,27,25,23,20],"priest":[20,22,23,24,25,25,26,26,27,27,27,27,27,27,27,26,26,25,25,24,23,22,20],"bard":[15,17,18,19,20,21,22,22,23,23,23,23,23,23,23,22,22,21,20,19,18,17,15],"alchemist":[10,12,13,14,15,15,16,16,17,17,17,17,17,17,17,16,16,15,15,14,13,12,10],"telekinetic":[12,15,18,20,21,23,24,24,25,26,26,26,26,26,25,24,24,23,21,20,18,15,12],"telepath":[17,19,21,22,24,25,25,26,26,27,27,27,27,27,26,26,25,25,24,22,21,19,17],"teleporter":[17,19,20,21,22,22,23,23,24,24,24,24,24,24,24,23,23,22,22,21,20,19,17],"seer":[18,20,21,22,23,23,24,24,25,25,25,25,25,25,25,24,24,23,23,22,21,20,18],"shaman":[15,18,20,21,22,23,24,25,25,26,26,26,26,26,25,25,24,23,22,21,20,18,15],"taoist":[23,25,26,27,28,28,29,29,30,30,30,30,30,30,30,29,29,28,28,27,26,25,23],"swordmonk":[16,20,23,25,27,28,29,30,31,32,32,32,32,32,31,30,29,28,27,25,23,20,16],"blackflame":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"apostle":[10,13,16,18,19,21,22,22,23,24,24,24,24,24,23,22,22,21,19,18,16,13,10],"machinist":[10,12,13,14,15,16,17,17,18,18,18,18,18,18,18,17,17,16,15,14,13,12,10],"gatekeeper":[14,16,18,19,21,22,22,23,23,24,24,24,24,24,23,23,22,22,21,19,18,16,14],"heir":[16,18,20,21,23,24,24,25,25,26,26,26,26,26,25,25,24,24,23,21,20,18,16]}};
  const maleHeads = [[95.62646,-17.76654,832.74708,1249.12062],[166.8129,36.17419,690.37419,1035.56129],[171.21019,36.83121,681.57962,1022.36943]].map(r=>r.map(v=>v*400/1024));
  const maleHairs = [98,98,94,88,94,98,98,82].map(y=>[120,y*400/1024,160,240]);
  const femaleHeads = [[.26,40],[.2416,43.75],[.2174,45.5],[.1781,48.2],[.181,57.1],[.1729,48.3],[.1715,49.1],[.1964,51.1]].map(([scale,y])=>[200-512*scale,y,1024*scale,1536*scale]);
  const n2 = n => String(n).padStart(2,'0');
  const image = (src,r,extra='',aspect='xMidYMid meet') => `<image href="${src}" x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" preserveAspectRatio="${aspect}" ${extra}/>`;
  function compose(g,face,hair,outfit,job=null,tone=null) {
    const id = 'ppmod-'+(++uid), female = g==='f';
    const filter=PlayerMaleArt.toneFilter(id+'-skin',tone);
    const skin=filter ? `filter="url(#${id}-skin)"` : '';
    const templateRect = female ? [108.8128,48.2,182.3744,273.5616] : [113,34,174,261];
    const head = face>8 ? [extraRoot+`${g}-face-${n2(face)}.webp`,templateRect] : female ? [partsRoot+`female-head-${n2(face)}.webp`,femaleHeads[face-1]]
      : face<=3 ? [root+`player-male/headneck-${n2(face)}.webp`,maleHeads[face-1]]
      : [partsRoot+`male-head-${face-3}.webp`,[113,34,174,261]];
    const newHair=hair>(female?3:8);
    const hairPart = newHair ? [extraRoot+`${g}-hair-${n2(hair)}-front.webp`,templateRect] : female ? [partsRoot+`female-hair-front-${n2(hair)}.webp`,hair===2?[100.16,30,199.68,299.52]:[66.88,40,266.24,399.36]]
      : [root+`player-male/hair-${n2(hair)}.webp`,maleHairs[hair-1]];
    const rearHair = newHair ? image(extraRoot+`${g}-hair-${n2(hair)}-back.webp`,hairPart[1]) : female ? image(partsRoot+`female-hair-back-${n2(hair)}.webp`,hairPart[1]) : '';
    let back='',front='';
    if(job) {
      const garment=HunterOutfits.get('hunter:'+job,g==='f'?'F':'M');
      const scale=female?.92:1, [cx,cy]=garment.neck;
      const r=[200-cx*scale,(female?228:215)-cy*scale,400*scale,450*scale];
      const profile=PARTS_PROFILES[g][job];
      const points=profile.map((y,i)=>`${r[0]+(cx-44+i*4)*scale},${r[1]+(cy+y)*scale}`).join(' ');
      const mask=`<defs><mask id="${id}-front" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="700"><rect width="400" height="700" fill="white"/><polygon points="${200-44*scale},0 ${200+44*scale},0 ${points.split(' ').reverse().join(' ')}" fill="black"/></mask></defs>`;
      const src=root+'outfits/'+garment.file;
      back=image(src,r);
      front=mask+image(src,r,`mask="url(#${id}-front)"`);
    } else if(female) {
      const rearRects=[[50,0,300,522],[54,-66,292,747],[50,52,300,400]];
      back=image(root+`player-male/collar-back-${outfit===2?'02':'01'}.webp`,rearRects[outfit-1],'','none');
      front=image(partsRoot+`female-clothes-${n2(outfit)}.webp`,[0,outfit===1?100:40,400,600]);
    } else {
      if(outfit<=2) {
        const r=outfit===1?[0,-99,1024,1536]:[-76.8,-697,1177.6,3225.6];
        back=image(root+`player-male/collar-back-${n2(outfit)}.webp`,r.map(v=>v*400/1024),'','none');
      }
      front=image(root+`player-male/clothes-${n2(outfit)}.webp`,[0,0,400,600]);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" data-face="${face}" data-hair="${hair}" data-outfit="${job||outfit}"><defs>${filter}</defs>${rearHair}${back}${image(head[0],head[1],skin)}${front}${image(...hairPart)}</svg>`;
  }
  const valid=(v,n)=>Number.isInteger(v)&&v>=1&&v<=n;
  function select(seed, gender, opts={}) {
    const female=gender==='F', key=female?'female':'male', count=counts[gender==='F'?'F':'M'];
    const pick=(part,count)=>{let h=FX.hash(String(seed)+'|player-modular-v1|'+gender+'|'+part);h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);return ((h^(h>>>16))>>>0)%count+1;};
    // Explicit legacy options map to individual parts; they never select a flattened portrait.
    const legacy=female&&Number.isInteger(opts.femaleVariant)?[[1,1,1],[2,1,1],[3,1,1],[1,2,1],[1,3,1],[1,1,2],[1,1,3]][opts.femaleVariant]:null;
    const face=valid(opts[key+'Face'],count.face)?opts[key+'Face']:valid(opts.heroFace,5)?opts.heroFace+3:legacy?legacy[0]:pick('face',count.face);
    const hair=valid(opts[key+'Hair'],count.hair)?opts[key+'Hair']:legacy?legacy[1]:pick('hair',count.hair);
    const outfit=valid(opts[key+'Outfit'],3)?opts[key+'Outfit']:legacy?legacy[2]:pick('outfit',3);
    const job=HunterOutfits.get(opts.outfit,gender);
    return {face,hair,outfit,job:job?job.familyId:null,bodyType:'normal'};
  }
  function isPlayer(seed,gender,opts={}) {
    return gender==='M'?PlayerMaleArt.isPlayer(seed,gender,opts):gender==='F'&&PlayerFemaleArt.isPlayer(seed,gender,opts);
  }
  function render(seed,gender,size=200,opts={},avatar=false) {
    const s=select(seed,gender,opts), g=gender==='F'?'f':'m';
    return compose(g,s.face,s.hair,s.outfit,s.job,opts.skinTone).replace('viewBox="0 0 400 600"',
      `viewBox="${avatar?'45 55 310 310':'0 0 400 600'}" width="${size}" height="${avatar?size:Math.round(size*1.5)}" class="${avatar?'avatar':'portrait'}" data-portrait-parts="player-modular-v2" data-player-${gender==='F'?'female':'male'}="1" data-body-type="normal" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${avatar?'초상화':'캐릭터 일러스트'}"`);
  }
  for(const method of ['card','avatar']) {
    const base=PORTRAIT[method];
    PORTRAIT[method]=function(seed,gender,element,rank,size,opts={}) {
      return isPlayer(seed,gender,opts)?render(seed,gender,size===undefined?(method==='avatar'?56:200):size,opts,method==='avatar'):base.apply(this,arguments);
    };
  }
  const controls=Wardrobe.controls;
  Wardrobe.controls=function(state) {
    if(!state||!isPlayer(state.look,state.gender))return controls.apply(this,arguments);
    const count=counts[state.gender==='F'?'F':'M'];
    const summary=`<div class="sec"><div class="sec-title">외형</div><div>얼굴 ${count.face}종 · 헤어 ${count.hair}종 · 복장 3종</div></div>`;
    return state.gender==='F'?summary:summary+controls.apply(this,arguments);
  };
  return {select,render,isPlayer,counts};
})();
