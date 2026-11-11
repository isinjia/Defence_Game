// 현대 헌터 직업복: 기본 직업 37종, 남녀 74벌.
const HunterOutfits = (() => {
  const catalog = [
  {
    "id": "swordsman",
    "name": "검사",
    "variants": {
      "m": {
        "file": "outfit-m-swordsman.webp",
        "neck": [
          198,
          16
        ]
      },
      "f": {
        "file": "outfit-f-swordsman.webp",
        "neck": [
          203,
          15
        ]
      }
    }
  },
  {
    "id": "berserker",
    "name": "광전사",
    "variants": {
      "m": {
        "file": "outfit-m-berserker.webp",
        "neck": [
          200,
          21
        ]
      },
      "f": {
        "file": "outfit-f-berserker.webp",
        "neck": [
          200,
          17
        ]
      }
    }
  },
  {
    "id": "lancer",
    "name": "창술사",
    "variants": {
      "m": {
        "file": "outfit-m-lancer.webp",
        "neck": [
          199,
          15
        ]
      },
      "f": {
        "file": "outfit-f-lancer.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "monk",
    "name": "무도가",
    "variants": {
      "m": {
        "file": "outfit-m-monk.webp",
        "neck": [
          200,
          18
        ]
      },
      "f": {
        "file": "outfit-f-monk.webp",
        "neck": [
          203,
          18
        ]
      }
    }
  },
  {
    "id": "dualblade",
    "name": "쌍검사",
    "variants": {
      "m": {
        "file": "outfit-m-dualblade.webp",
        "neck": [
          202,
          16
        ]
      },
      "f": {
        "file": "outfit-f-dualblade.webp",
        "neck": [
          204,
          17
        ]
      }
    }
  },
  {
    "id": "guardian",
    "name": "방패 기사",
    "variants": {
      "m": {
        "file": "outfit-m-guardian.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-guardian.webp",
        "neck": [
          200,
          17
        ]
      }
    }
  },
  {
    "id": "paladin",
    "name": "성기사",
    "variants": {
      "m": {
        "file": "outfit-m-paladin.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-paladin.webp",
        "neck": [
          203,
          15
        ]
      }
    }
  },
  {
    "id": "giant",
    "name": "거인화 능력자",
    "variants": {
      "m": {
        "file": "outfit-m-giant.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-giant.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "assassin",
    "name": "암살자",
    "variants": {
      "m": {
        "file": "outfit-m-assassin.webp",
        "neck": [
          201,
          16
        ]
      },
      "f": {
        "file": "outfit-f-assassin.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "thief",
    "name": "도적",
    "variants": {
      "m": {
        "file": "outfit-m-thief.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-thief.webp",
        "neck": [
          202,
          16
        ]
      }
    }
  },
  {
    "id": "poisoner",
    "name": "독술사",
    "variants": {
      "m": {
        "file": "outfit-m-poisoner.webp",
        "neck": [
          199,
          15
        ]
      },
      "f": {
        "file": "outfit-f-poisoner.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "archer",
    "name": "궁수",
    "variants": {
      "m": {
        "file": "outfit-m-archer.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-archer.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "sniper",
    "name": "저격수",
    "variants": {
      "m": {
        "file": "outfit-m-sniper.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-sniper.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "gunslinger",
    "name": "총잡이",
    "variants": {
      "m": {
        "file": "outfit-m-gunslinger.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-gunslinger.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "elementalist",
    "name": "원소술사",
    "variants": {
      "m": {
        "file": "outfit-m-elementalist.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-elementalist.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "warlock",
    "name": "흑마법사",
    "variants": {
      "m": {
        "file": "outfit-m-warlock.webp",
        "neck": [
          203,
          15
        ]
      },
      "f": {
        "file": "outfit-f-warlock.webp",
        "neck": [
          200,
          16
        ]
      }
    }
  },
  {
    "id": "warder",
    "name": "결계사",
    "variants": {
      "m": {
        "file": "outfit-m-warder.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-warder.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "chronomancer",
    "name": "시공술사",
    "variants": {
      "m": {
        "file": "outfit-m-chronomancer.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-chronomancer.webp",
        "neck": [
          199,
          15
        ]
      }
    }
  },
  {
    "id": "summoner",
    "name": "소환사",
    "variants": {
      "m": {
        "file": "outfit-m-summoner.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-summoner.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "necromancer",
    "name": "사령술사",
    "variants": {
      "m": {
        "file": "outfit-m-necromancer.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-necromancer.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "tamer",
    "name": "조련사",
    "variants": {
      "m": {
        "file": "outfit-m-tamer.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-tamer.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "healer",
    "name": "치유사",
    "variants": {
      "m": {
        "file": "outfit-m-healer.webp",
        "neck": [
          198,
          16
        ]
      },
      "f": {
        "file": "outfit-f-healer.webp",
        "neck": [
          202,
          16
        ]
      }
    }
  },
  {
    "id": "priest",
    "name": "사제",
    "variants": {
      "m": {
        "file": "outfit-m-priest.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-priest.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "bard",
    "name": "음유시인",
    "variants": {
      "m": {
        "file": "outfit-m-bard.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-bard.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "alchemist",
    "name": "연금술사",
    "variants": {
      "m": {
        "file": "outfit-m-alchemist.webp",
        "neck": [
          201,
          16
        ]
      },
      "f": {
        "file": "outfit-f-alchemist.webp",
        "neck": [
          204,
          16
        ]
      }
    }
  },
  {
    "id": "telekinetic",
    "name": "염동력자",
    "variants": {
      "m": {
        "file": "outfit-m-telekinetic.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-telekinetic.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "telepath",
    "name": "정신 감응자",
    "variants": {
      "m": {
        "file": "outfit-m-telepath.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-telepath.webp",
        "neck": [
          202,
          16
        ]
      }
    }
  },
  {
    "id": "teleporter",
    "name": "순간이동자",
    "variants": {
      "m": {
        "file": "outfit-m-teleporter.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-teleporter.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "seer",
    "name": "예지자",
    "variants": {
      "m": {
        "file": "outfit-m-seer.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-seer.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "shaman",
    "name": "무당",
    "variants": {
      "m": {
        "file": "outfit-m-shaman.webp",
        "neck": [
          201,
          15
        ]
      },
      "f": {
        "file": "outfit-f-shaman.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  },
  {
    "id": "taoist",
    "name": "도사",
    "variants": {
      "m": {
        "file": "outfit-m-taoist.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-taoist.webp",
        "neck": [
          203,
          15
        ]
      }
    }
  },
  {
    "id": "swordmonk",
    "name": "검무사",
    "variants": {
      "m": {
        "file": "outfit-m-swordmonk.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-swordmonk.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "blackflame",
    "name": "흑염검사",
    "variants": {
      "m": {
        "file": "outfit-m-blackflame.webp",
        "neck": [
          199,
          15
        ]
      },
      "f": {
        "file": "outfit-f-blackflame.webp",
        "neck": [
          201,
          15
        ]
      }
    }
  },
  {
    "id": "apostle",
    "name": "심연의 사도",
    "variants": {
      "m": {
        "file": "outfit-m-apostle.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-apostle.webp",
        "neck": [
          202,
          15
        ]
      }
    }
  },
  {
    "id": "machinist",
    "name": "기계 교감자",
    "variants": {
      "m": {
        "file": "outfit-m-machinist.webp",
        "neck": [
          200,
          15
        ]
      },
      "f": {
        "file": "outfit-f-machinist.webp",
        "neck": [
          200,
          16
        ]
      }
    }
  },
  {
    "id": "gatekeeper",
    "name": "문지기",
    "variants": {
      "m": {
        "file": "outfit-m-gatekeeper.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-gatekeeper.webp",
        "neck": [
          204,
          15
        ]
      }
    }
  },
  {
    "id": "heir",
    "name": "대붕괴의 아이",
    "variants": {
      "m": {
        "file": "outfit-m-heir.webp",
        "neck": [
          202,
          15
        ]
      },
      "f": {
        "file": "outfit-f-heir.webp",
        "neck": [
          200,
          15
        ]
      }
    }
  }
];
  const root='assets/portraits/outfits/', prefix='hunter:', ns='http://www.w3.org/2000/svg';
  const byId=new Map(catalog.map(c=>[c.id,c]));
  const aliases={monk_holy:'monk',friar:'paladin',exorcist:'shaman',saint:'priest',dark_priest:'apostle',dark_knight:'guardian',hexer:'warlock',shade:'assassin',pyromancer:'blackflame',druid:'tamer',witch_doctor:'alchemist',spiritist:'summoner',treant_warden:'giant',pyrokinetic:'blackflame',phoenix_caller:'summoner',fire_dancer:'bard',bomber:'guardian',lava_guard:'gatekeeper',pathfinder:'archer',tracker:'thief',echo_scout:'telepath',farsight:'seer',wayfinder:'machinist'};
  const idOf=outfit=>typeof outfit==='string'&&outfit.startsWith(prefix)?outfit.slice(prefix.length):null;
  const outfitFor=cls=>(byId.has(cls)||byId.has(aliases[cls]))?prefix+cls:null;
  const get=(outfit,gender)=>{const id=idOf(outfit),c=byId.get(aliases[id]||id);return c?{...c.variants[gender==='F'?'f':'m'],classId:id,familyId:c.id,name:c.name}:null;};
  const legacy={card:PORTRAIT.card,avatar:PORTRAIT.avatar,select:PortraitParts.select};
  const cache=new Map();
  const node=(doc,name,attrs)=>{const e=doc.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
  function render(avatar,seed,gender,element,rank,size,opts){
    const part=get(opts.outfit,gender);
    if(!part)return legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,opts);
    const key=JSON.stringify([avatar,seed,gender,element,rank,size,opts]);if(cache.has(key))return cache.get(key);
    const bare={...opts,outfit:'underwear'}, selected=legacy.select(seed,gender,bare);
    const doc=new DOMParser().parseFromString(legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,bare),'image/svg+xml');
    const svg=doc.documentElement,defs=doc.querySelector('defs'),female=gender==='F',type=selected.bodyType;
    const pose=Number(svg.dataset.baseOffset||0),scale=Number(svg.dataset.headScale||1);
    const chin=selected.stage==='child'?(selected.layers[0].chinY|| (female?261:251)):(female?261:251);
    const pivot=(female?261:251)+24;
    const actualChin=pivot+(chin-pivot)*scale+pose;
    const fit={thin:.9,normal:1,strong:1.08,heavy:1.25}[type]||1;
    const frontY=actualChin+(type==='heavy'?12:female?18:20),backY=actualChin+2;
    const radius=(female?29:33)*fit,depth=7;
    const opening=`M${200-radius} 0H${200+radius}V${frontY-depth}A${radius} ${depth} 0 0 1 ${200-radius} ${frontY-depth}Z`;
    const id='ho'+FX.hash(selected.key+opts.outfit+avatar),clip=node(doc,'clipPath',{id:id+'skin'});
    const jaw=doc.querySelector('clipPath[id$="jaw"]');
    if(jaw){const g=node(doc,'g',{transform:`translate(0 ${pose})`});for(const c of jaw.children)g.append(c.cloneNode(true));clip.append(g);}
    clip.append(node(doc,'path',{d:opening}));defs.append(clip);
    const mask=node(doc,'mask',{id:id+'front',maskUnits:'userSpaceOnUse',x:0,y:0,width:400,height:720});
    mask.append(node(doc,'rect',{width:400,height:720,fill:'white'}));mask.append(node(doc,'path',{d:opening,fill:'black'}));defs.append(mask);
    for(const e of [...doc.querySelectorAll('[data-depth="garment-front"],[data-depth="collar-back"],[data-depth="neck-line"],[data-depth="head-front"]')])e.remove();
    const body=doc.querySelector('[data-depth="underwear"],[data-depth="neck"]');if(!body)return legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,bare);
    const parent=body.parentNode,wrap=node(doc,'g',{'data-depth':'job-skin','clip-path':`url(#${id}skin)`});parent.insertBefore(wrap,body);wrap.append(body);
    const garment=depthName=>{
      const e=node(doc,'image',{'data-depth':depthName,'data-job':part.classId,href:root+part.file+'?v=1',x:200-part.neck[0]*fit,y:backY-part.neck[1]*.82,width:400*fit,height:450*.82,preserveAspectRatio:'none'});
      e.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',root+part.file+'?v=1');return e;
    };
    parent.insertBefore(garment('job-garment-back'),wrap);
    const front=garment('job-garment-front');front.setAttribute('mask',`url(#${id}front)`);parent.insertBefore(front,wrap.nextSibling);
    if(jaw){const protect=node(doc,'g',{'data-depth':'job-jaw-front','clip-path':`url(#${id}jaw)`});
      const jawClip=node(doc,'clipPath',{id:id+'jaw'}),translated=node(doc,'g',{transform:`translate(0 ${pose})`});for(const c of jaw.children)translated.append(c.cloneNode(true));jawClip.append(translated);defs.append(jawClip);
      protect.append(body.cloneNode(true));parent.insertBefore(protect,front.nextSibling);
    }
    svg.dataset.outfit=opts.outfit;svg.dataset.jobClass=part.classId;svg.dataset.jobFrontY=frontY;svg.dataset.jobBackY=backY;
    if(!avatar){svg.setAttribute('viewBox','0 0 400 480');svg.setAttribute('height',Math.round(size*480/400));const border=[...svg.children].find(n=>n.tagName==='rect'&&n.getAttribute('x')==='1');if(border)border.setAttribute('height',478);}
    const result=new XMLSerializer().serializeToString(doc);if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
  }
  PORTRAIT.card=(seed,g,e,r,size=200,opts={})=>render(false,seed,g,e,r,size,opts);
  PORTRAIT.avatar=(seed,g,e,r,size=56,opts={})=>render(true,seed,g,e,r,size,opts);
  PortraitParts.select=(seed,g,opts={})=>{
    const part=get(opts.outfit,g);if(!part)return legacy.select(seed,g,opts);
    const s=legacy.select(seed,g,{...opts,outfit:'underwear'}),female=g==='F',young=s.stage==='child';
    const chin=young?s.layers[0].chinY:(female?261:251),pivot=(female?261:251)+24,scale=young?1:PortraitParts.HEAD_SCALE[g][s.bodyType],pose=young&&!female?8:0;
    const fit={thin:.9,normal:1,strong:1.08,heavy:1.25}[s.bodyType],back=pivot+(chin-pivot)*scale+pose+2;
    s.layers[1]={...part,file:'../outfits/'+part.file,rect:[200-part.neck[0]*fit,back-part.neck[1]*.82,400*fit,450*.82]};
    s.outfit=opts.outfit;s.key+='-'+opts.outfit;return s;
  };
  const oldProfession=Wardrobe.profession,oldPlayer=Wardrobe.playerLook,oldPrologue=Wardrobe.prologueLook;
  Wardrobe.profession=(cls,bg)=>outfitFor(cls)||oldProfession(cls,bg);
  const oldEquipment=Wardrobe.equipment;
  Wardrobe.equipment=item=>item&&outfitFor(idOf(item.appearanceOutfit))?item.appearanceOutfit:oldEquipment(item);
  Wardrobe.playerLook=()=>{
    const result=oldPlayer(),p=G.player,armor=p.equip&&p.equip.armor;
    const explicit=armor&&!armor.appearanceByClass&&(get(armor.appearanceOutfit,p.gender)||['coat','hanbok','mandarin','tactical','casual','overcoat'].includes(armor.appearanceOutfit)||/코트|외투|망토|도포|한복/.test(armor.name||''));
    return {...result,outfit:explicit?(get(armor.appearanceOutfit,p.gender)?armor.appearanceOutfit:Wardrobe.equipment(armor)):Wardrobe.profession(p.cls,p.bg)};
  };
  Wardrobe.prologueLook=s=>{const a=oldPrologue(s);return UI.screen==='pro-result'&&s.result?{...a,outfit:Wardrobe.profession(s.result.cls,s.bg)}:a;};
  UI.playerPortrait=size=>{const p=G.player;return FX.portrait(p.look,p.gender,p.element,p.rankIdx,size,Wardrobe.playerLook());};
  UI.playerAvatar=size=>{const p=G.player;return FX.avatar(p.look,p.gender,p.element,p.rankIdx,size,Wardrobe.playerLook());};
  const npcLook=UI.npcLook;
  UI.npcLook=function(n){const a=npcLook.call(this,n);return{...a,outfit:Wardrobe.profession(n.cls,n.bg)};};
  const unitSprite=UI.unitSprite;
  UI.unitSprite=function(u,size){
    if(!u.isPlayer&&u.portrait&&!u.portrait.outfit&&outfitFor(u.cls)){
      const q=u.portrait;
      return FX.avatar(q.seed,q.gender,q.elem,u.tier||0,size,{...Wardrobe.appearance(u),...q,outfit:outfitFor(u.cls)});
    }
    return unitSprite.call(this,u,size);
  };
  return {catalog,aliases,outfitFor,get};

})();
