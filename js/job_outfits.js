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
  // 옷 맞춤(사용자 요청: "목 길이는 고정, 옷의 어깨선이 목 끝에 와야 한다"): 옷 그림의 어깨선이 몸의 어깨 위에 얹히도록 옷을 올린다.
  // OFF_M: 남자 옷마다 깃 뒤 테두리의 높이(턱 기준, 음수=턱보다 위). 옷 그림 어깨선과 맨몸 어깨 높이를 재서 뽑았다(어깨 장식 때문에 잴 수 없는 옷은 중앙값 -8).
  // IN_D: 깃 안쪽 깊이(옷 그림 px). 목 살은 깃 안쪽(앞깃 윗선)까지만 보이고 앞깃이 목 위로 온다. 목 뒤쪽 옷(깃 안쪽 면)은 보이지 않는다.
  const OFF_M={"swordsman":-7,"berserker":-8,"lancer":-8,"monk":-8,"dualblade":-8,"guardian":-8,"paladin":-7,"giant":-4,"assassin":-5,"thief":-8,"poisoner":-14,"archer":-10,"sniper":-10,"gunslinger":-8,"elementalist":-4,"warlock":-8,"warder":-4,"chronomancer":-8,"summoner":-8,"necromancer":-8,"tamer":-15,"healer":-8,"priest":-6,"bard":-8,"alchemist":-13,"telekinetic":-10,"telepath":-11,"teleporter":-8,"seer":-10,"shaman":-11,"taoist":-13,"swordmonk":-11,"blackflame":-5,"apostle":-8,"machinist":-8,"gatekeeper":-8,"heir":-8};
  const TYPE_ADJ={thin:5,normal:0,strong:-2,heavy:-8};
  const IN_D={priest:23,alchemist:24,tamer:23,healer:22,telepath:22,monk:21,summoner:21,paladin:21,bard:21};
  // 깃이 높은 옷(IN_D)은 많이 올리면 깃이 턱에 붙어 목이 사라진다 → 턱 아래 목이 남도록 덜 올린다
  const IN_PROF={"m":{"swordsman":[9,13,17,21,23,25,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"berserker":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"lancer":[0,11,15,18,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,15,10,0],"monk":[0,6,10,13,16,19,21,22,23,24,26,26,26,25,24,23,22,20,18,15,11,6,0],"dualblade":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"guardian":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"paladin":[9,13,16,18,19,20,27,28,29,30,30,30,30,30,29,28,27,21,19,18,16,13,9],"giant":[0,6,14,17,20,23,24,26,28,30,30,30,30,30,27,25,24,22,20,17,12,6,0],"assassin":[0,6,15,19,21,23,25,26,27,29,30,30,30,30,27,26,25,24,22,19,16,6,0],"thief":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"poisoner":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"archer":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"sniper":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"gunslinger":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"elementalist":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"warlock":[9,13,17,21,24,26,27,28,29,30,30,29,30,30,29,28,27,26,24,21,17,13,9],"warder":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"chronomancer":[0,6,16,20,23,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,6,0],"summoner":[0,6,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"necromancer":[0,13,17,21,24,25,26,27,28,28,29,29,29,28,28,27,26,25,24,21,17,13,0],"tamer":[9,13,17,21,23,24,25,26,29,30,30,30,30,30,29,26,25,24,23,21,17,13,9],"healer":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"priest":[0,6,14,18,22,24,27,28,29,30,30,30,30,30,29,28,27,25,22,19,15,6,0],"bard":[0,6,15,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,10,6,0],"alchemist":[0,6,15,18,20,22,23,24,24,25,27,30,30,30,24,24,23,22,21,19,16,6,0],"telekinetic":[0,6,14,17,19,21,22,23,24,24,25,25,25,24,24,23,22,21,20,18,15,6,0],"telepath":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,12,0],"teleporter":[9,13,17,21,24,26,27,28,29,30,30,30,30,28,29,28,27,26,24,21,17,13,9],"seer":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"shaman":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"taoist":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"swordmonk":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"blackflame":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"apostle":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"machinist":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"gatekeeper":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"heir":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9]},"f":{"swordsman":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"berserker":[0,6,10,12,14,16,17,18,18,19,19,19,19,19,19,18,17,16,15,13,10,7,0],"lancer":[0,7,12,16,18,19,19,22,22,22,30,30,30,29,24,22,21,19,18,16,12,7,0],"monk":[0,7,12,16,19,20,21,22,23,23,24,24,24,24,23,22,21,20,19,16,12,7,0],"dualblade":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"guardian":[0,0,0,8,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,8,0,0,0],"paladin":[0,7,12,16,20,22,23,24,25,26,26,26,26,26,25,24,23,22,20,16,12,7,0],"giant":[0,7,12,16,19,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"assassin":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"thief":[0,7,12,16,18,17,17,17,16,16,16,16,16,16,16,17,17,17,18,16,12,7,0],"poisoner":[0,7,12,16,20,23,23,23,24,24,24,24,24,24,24,24,23,23,20,16,12,7,0],"archer":[0,7,12,16,18,19,20,21,22,22,23,23,23,22,22,21,20,19,18,16,12,0,0],"sniper":[0,7,12,11,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,11,12,7,0],"gunslinger":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"elementalist":[0,7,12,16,18,19,20,21,22,23,30,30,30,29,23,22,21,20,19,16,12,7,0],"warlock":[0,7,12,16,20,22,24,28,29,29,30,30,30,29,29,28,25,21,20,16,12,7,0],"warder":[0,0,12,16,19,21,22,23,24,24,25,25,25,24,24,23,22,21,20,16,12,0,0],"chronomancer":[0,0,11,15,18,20,22,26,27,29,30,30,30,29,29,28,26,20,18,14,9,0,0],"summoner":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"necromancer":[0,7,8,8,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,8,7,7,0],"tamer":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"healer":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"priest":[0,0,12,16,18,19,21,22,23,24,30,30,30,29,23,22,21,20,18,16,12,0,0],"bard":[0,0,0,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"alchemist":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"telekinetic":[0,0,12,16,20,24,26,27,28,29,30,30,30,29,28,27,26,24,20,16,12,0,0],"telepath":[0,7,12,16,20,24,25,26,27,27,28,28,28,27,27,26,26,24,20,16,12,7,0],"teleporter":[0,7,12,16,20,24,26,28,29,29,30,27,30,29,29,28,26,24,20,16,12,7,0],"seer":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"shaman":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"taoist":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"swordmonk":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"blackflame":[0,7,12,16,20,23,24,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"apostle":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"machinist":[0,0,10,13,15,16,17,18,19,19,19,25,25,25,19,18,18,17,16,14,11,0,0],"gatekeeper":[0,0,12,16,20,21,23,25,29,29,30,30,30,29,29,25,23,22,20,16,12,0,0],"heir":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0]}};
  // 여자도 체형별로 옷을 맞춘다: 통통·건장은 목이 넓어 깃 위로 넓은 살색 면이 보이므로 옷을 조금 올린다
  const TYPE_ADJ_F={thin:3,normal:2,strong:0,heavy:-5};
  // 어깨 맞춤(사용자 요청): 머리 밑 몸의 어깨선과 옷 그림의 어깨선이 같은 높이가 되도록 옷의 위아래 위치를 정한다.
  // SHOULDER[성별][옷]=[마름,보통,건장,통통]: 깃 뒤 테두리 높이(턱 기준). 몸 어깨선(가운데에서 90~130px)과 옷 어깨선을 재서 중앙값으로 뽑았다.
  const SHOULDER={"m":{"swordsman":[-5,-1,-8,-13],"berserker":[13,7,1,9],"lancer":[-15,-20,-16,-20],"monk":[13,16,9,6],"dualblade":[5,9,1,-2],"guardian":[19,20,20,12],"paladin":[-2,0,-4,-9],"giant":[0,4,-4,2],"assassin":[-6,-15,-21,3],"thief":[-11,-8,-14,-18],"poisoner":[-10,-7,-13,-17],"archer":[-7,-5,-10,-14],"sniper":[-8,-13,-11,-13],"gunslinger":[6,11,4,1],"elementalist":[-1,3,-3,-7],"warlock":[-5,-2,-7,-11],"warder":[-2,-3,-4,0],"chronomancer":[-4,-1,-7,-11],"summoner":[-12,-9,-15,-20],"necromancer":[-24,-22,-25,-31],"tamer":[-10,-7,-14,-18],"healer":[-4,-1,-7,-11],"priest":[-1,2,-5,-9],"bard":[-4,-1,-6,-11],"alchemist":[-8,-5,-10,-16],"telekinetic":[-5,-2,-7,-14],"telepath":[-6,-2,-9,-14],"teleporter":[-11,-7,-14,-19],"seer":[-1,-36,-14,-12],"shaman":[-6,-2,-9,-14],"taoist":[-9,-6,-12,-17],"swordmonk":[-6,-1,-9,-14],"blackflame":[12,17,9,5],"apostle":[-6,-16,-7,-3],"machinist":[18,6,19,19],"gatekeeper":[2,4,-1,4],"heir":[-2,2,-6,-9]},"f":{"swordsman":[4,-4,-6,-9],"berserker":[25,6,5,7],"lancer":[1,-17,-10,-11],"monk":[27,19,18,15],"dualblade":[14,9,4,1],"guardian":[27,20,19,11],"paladin":[6,-8,-3,-6],"giant":[11,5,1,-2],"assassin":[2,-16,-17,-4],"thief":[-21,-41,-32,-30],"poisoner":[-12,-30,-21,-21],"archer":[-2,-23,-10,-13],"sniper":[-18,-40,-29,-28],"gunslinger":[-1,-16,-11,-13],"elementalist":[-15,-44,-22,-18],"warlock":[-11,-29,-17,-16],"warder":[-2,-15,-12,-10],"chronomancer":[5,-8,-3,-7],"summoner":[-7,-15,-16,-21],"necromancer":[-14,-24,-25,-26],"tamer":[-2,-12,-11,-14],"healer":[0,-17,-9,-11],"priest":[9,1,-1,-4],"bard":[8,-8,0,-3],"alchemist":[-3,-14,-13,-15],"telekinetic":[-1,-8,-11,-14],"telepath":[0,-10,-9,-14],"teleporter":[-4,-13,-12,-16],"seer":[19,-8,-6,-11],"shaman":[-2,-13,-10,-13],"taoist":[-3,-19,-12,-14],"swordmonk":[-3,-15,-12,-15],"blackflame":[0,-16,-8,-10],"apostle":[-3,-27,-16,-15],"machinist":[5,-1,-5,-7],"gatekeeper":[2,-10,-9,-12],"heir":[1,-16,-7,-11]}};
  const TI={thin:0,normal:1,strong:2,heavy:3};
  // 마른 체형(사용자: "머리를 좀 아래로"): 옷을 THIN_UP 만큼 올려 머리가 내려앉아 보이게
  const THIN_UP=typeof window!=='undefined'&&window.__thinUp!=null?window.__thinUp:8;
  const rimOff=(part,female,type)=>(type==='thin'?-THIN_UP:0)+rimOff1(part,female,type);
  const rimOff1=(part,female,type)=>{
    const v=((SHOULDER[female?'f':'m']||{})[part.familyId]||[])[TI[type]??1];
    if(v==null)return female?(TYPE_ADJ_F[type]??2):Math.max(IN_D[part.familyId]?-5:-18,(OFF_M[part.familyId]??-8)+(TYPE_ADJ[type]||0));
    // 같은 사람이면 옷이 달라도 어깨 높이가 같아야 한다(사용자 지적): 옷마다 잰 값을 그대로 쓰고 옷별로 다르게 깎지 않는다.
    // 통통은 몸 원화의 어깨가 측정값보다 높게 보여 일괄로 HEAVY_DROP 만큼 더 올린다(사용자 확인 위치). 깃이 턱을 덮어도 깊이 순서상 옷이 위다.
    // 단 앞깃 윗선이 턱 끝을 덮지는 않게(턱 아래 최소 9, 목이 조금은 보이게): 깃이 높은 옷만 이 한도에 걸린다
    const pr=(IN_PROF[female?'f':'m']||{})[part.familyId],front=pr?Math.max(...pr)*.82:(IN_D[part.familyId]||(female?15:17))*.82;
    return v-(type==='heavy'?HEAVY_DROP:0); // 어깨선 통일이 우선(사용자 확정). 깃이 높아 턱에 걸리면 턱은 깃 앞에 그린다(아래 jawn)
  };
  const MIN_NECK=10,HEAVY_DROP=10;
  const cache=new Map();
  let _hoUid=0;
  // 같은 선임이 대화 초상+작은 아바타로 동시에 뜨면 clip/mask id가 문서에서 충돌해
  // 직업옷 아래 기본 나체(underwear)가 그대로 보인다. 반환마다 id를 다시 붙인다.
  function mintIds(html){
    const u='u'+(++_hoUid),map=new Map();
    const rename=id=>{
      if(!/^(ho|pp)/.test(id))return id;
      if(!map.has(id))map.set(id,id.replace(/u\d+$/,'')+u);
      return map.get(id);
    };
    return String(html)
      .replace(/\bid="([^"]+)"/g,(_,id)=>`id="${rename(id)}"`)
      .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${rename(id)})`);
  }
  const node=(doc,name,attrs)=>{const e=doc.createElementNS(ns,name);for(const[k,v]of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
  // 승인 시안: 남성 흑염 코트는 어깨 폭 +14% 뒤 +20%, 세로 축척 .82→.94.
  // 카드·아바타와 파츠 선택 좌표가 같은 의상 비율을 사용한다.
  function garmentFit(part,female,type){
    const wider=!female&&part.familyId==='blackflame';
    return {x:({thin:.9,normal:1,strong:1.08,heavy:1.25}[type]||1)*(wider?1.368:1),y:wider?.94:.82};
  }
  function render(avatar,seed,gender,element,rank,size,opts){
    {const t=legacy.select(seed,gender,{...opts,outfit:'underwear'}).bodyType;if(t==='heavy'||t==='strong')return renderOld(avatar,seed,gender,element,rank,size,opts);}
    const part=get(opts.outfit,gender);
    if(!part)return legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,opts);
    const key=JSON.stringify([avatar,seed,gender,element,rank,size,opts]);if(cache.has(key))return mintIds(cache.get(key));
    const bare={...opts,outfit:'underwear'}, selected=legacy.select(seed,gender,bare);
    const doc=new DOMParser().parseFromString(legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,bare),'image/svg+xml');
    const svg=doc.documentElement,defs=doc.querySelector('defs'),female=gender==='F',type=selected.bodyType;
    const pose=Number(svg.dataset.baseOffset||0),scale=Number(svg.dataset.headScale||1);
    const chin=selected.stage==='child'?(selected.layers[0].chinY|| (female?261:251)):(female?261:251);
    const pivot=(female?261:251)+24;
    const actualChin=pivot+(chin-pivot)*scale+pose;
    const fitting=garmentFit(part,female,type),fit=fitting.x,garmentY=fitting.y;
    // 남자(사용자 요청): 옷은 그대로 두고 목을 깃 안쪽까지 내린다. 목 창을 깃 안쪽 모양(넓고 얕은 U)으로 파서
    // 목 뒤쪽 옷(깃 안쪽 면)이 보이지 않고, 앞깃·폴라 윗선이 목 위로 온다. 옷 그림 기준 값: 안쪽 반폭 inW, 가운데 깊이 inD(px).
    // 목은 깃 안쪽(목 뒤 옷·안쪽 폴라 윗부분)을 채워 앞깃 윗선까지 내려온다 → 목이 옷 앞쪽에 바로 닿는다(사용자 요청).
    // IN_PROF: 옷 그림에서 찾은 앞깃 윗선(가운데에서 -44..44, 4px 간격, 옷 그림 px). 없으면 깃 안쪽 호 모양.
    const backY=actualChin+rimOff(part,female,type),prof=(IN_PROF[female?'f':'m']||{})[part.familyId];
    const inW=(female?34:41)*fit,inD=(IN_D[part.familyId]||(female?15:17))*garmentY;
    const frontY=prof?backY+Math.max(...prof)*garmentY:backY+inD,radius=prof?44*fit:inW,side=backY+3,depth=Math.max(3,frontY-side);
    const opening=!prof?`M${200-radius} 0H${200+radius}V${frontY-depth}A${radius} ${depth} 0 0 1 ${200-radius} ${frontY-depth}Z`
      :!female&&(type==='heavy'||type==='strong')?(()=>{
        // 통통·건장 남자(사용자 지적: "옷이 위여야 한다"): 목 창을 목 폭까지만 연다. 그 바깥(턱 아래 양옆 어깨 살)은 옷이 덮는다.
        const nw=Math.min(radius,type==='heavy'?46:42);
        const pts=prof.map((d,k)=>[200+(44-k*4)*fit,backY+prof[prof.length-1-k]*garmentY]).map(([x,y])=>[Math.max(200-nw,Math.min(200+nw,x)),y]);
        // 위쪽은 턱 폭(±62)으로 열고, 턱 아래에서 앞깃 쪽 목 폭(±nw)까지 비스듬히 좁힌다 → 턱 모서리가 수직으로 잘리지 않는다
        const jw=type==='heavy'?62:58,jy=actualChin-16,ey=Math.max(jy+6,pts[0][1]);
        return `M${200-jw} 0H${200+jw}V${jy.toFixed(1)}L${200+nw} ${ey.toFixed(1)}`+pts.map(([x,y])=>`L${x.toFixed(1)} ${y.toFixed(1)}`).join('')+`L${200-nw} ${ey.toFixed(1)}L${200-jw} ${jy.toFixed(1)}Z`;
      })()
      :`M${200-radius} 0H${200+radius}`+prof.map((d,k)=>`L${(200+(44-k*4)*(radius/44)).toFixed(1)} ${(backY+prof[prof.length-1-k]*garmentY).toFixed(1)}`).join('')+'Z';
    const id='ho'+FX.hash(selected.key+opts.outfit+avatar),clip=node(doc,'clipPath',{id:id+'skin'});
    const jaw=doc.querySelector('clipPath[id$="jaw"]');
    // clipPath 안에는 <g>를 둘 수 없어(브라우저가 무시) 턱 영역이 빠지고 얼굴이 좁은 기둥으로 잘렸다 → 도형마다 transform 을 붙인다
    const shift=c=>{const e=c.cloneNode(true);e.setAttribute('transform',`translate(0 ${pose}) ${e.getAttribute('transform')||''}`.trim());return e;};
    if(jaw){for(const c of jaw.children)clip.append(shift(c));}
    clip.append(node(doc,'path',{d:opening}));
    // 통통·건장 남자: 목 창을 좁혔으므로 턱 아래 둥근 부분도 살 영역에 넣는다(턱 모서리가 목 창 경계에서 잘리지 않게)
    const jawShape=!female&&(type==='heavy'||type==='strong')?(()=>{const rx=type==='heavy'?60:56,c=actualChin;return `M${200-rx} 0V${(c-14).toFixed(1)}Q${200-rx+3} ${(c+2).toFixed(1)} ${200-30} ${(c+3).toFixed(1)}H${200+30}Q${200+rx-3} ${(c+2).toFixed(1)} ${200+rx} ${(c-14).toFixed(1)}V0Z`;})():null;
    // 통통·건장 남자(사용자 지적: "옷이 위여야 한다", "목과 옷 연결부가 문제"): 살은 자르지 않고 몸 전체를 그린다.
    // 옷(앞)은 목 창만 비우고 그 위에 그려지므로, 옷이 있는 곳은 옷이 덮고 옷이 없는 곳(조끼 위 어깨 등)은 몸이 자연스럽게 보인다.
    // 단, 앞깃 윗선보다 아래(옷 속)와 어깨 끝 바깥은 살을 그리지 않는다: 옷 틈으로 살이 비치거나 어깨 끝에 살이 삐져나오지 않게
    if(jawShape){const W=type==='heavy'?63:60;clip.append(node(doc,'rect',{x:200-W,y:-50,width:2*W,height:(frontY+4+50).toFixed(1)}));}
    defs.append(clip);
    const mask=node(doc,'mask',{id:id+'front',maskUnits:'userSpaceOnUse',x:0,y:0,width:400,height:720});
    mask.append(node(doc,'rect',{width:400,height:720,fill:'white'}));mask.append(node(doc,'path',{d:opening,fill:'black'}));defs.append(mask);
    for(const e of [...doc.querySelectorAll('[data-depth="garment-front"],[data-depth="collar-back"],[data-depth="neck-line"],[data-depth="head-front"]')])e.remove();
    // 남자 얼굴 그림에는 턱 아래 목 토막이 붙어 있다. 머리 그룹은 옷보다 위라 그 토막이 깃 위에 네모 블록으로 보였다 → 얼굴 그림을 턱선에서 자른다(얼굴 좌표).
    if(!female){const fimg=[...doc.querySelectorAll('[data-proportion="head"] image')].find(e=>/face-m-/.test(e.getAttribute('href')||''));
      const ch=Number(selected.layers&&selected.layers[0]&&selected.layers[0].chinY)||251;
      if(fimg){const fc=node(doc,'clipPath',{id:id+'fcut'});fc.append(node(doc,'path',{d:`M0 0H400V${ch-26}H252C252 ${ch-6} 214 ${ch+2} 200 ${ch+2}C186 ${ch+2} 148 ${ch-6} 148 ${ch-26}H0Z`}));defs.append(fc);fimg.setAttribute('clip-path',`url(#${id}fcut)`);}}
    const body=doc.querySelector('[data-depth="underwear"],[data-depth="neck"]');if(!body)return legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,bare);
    // 깊이 순서(사용자 확정 규칙): ① 얼굴·몸(살)은 옷보다 아래에 그린다 ② 살을 지우지 않고 순서로 가린다
    // ③ 옷 그림에 그려진 뒤쪽(목 뒤 깃·안쪽 면)은 목 창에서 지운다 ④ 그래도 옷 밖으로 삐져나오는 살(어깨 끝 등)만 따로 숨긴다.
    // ④는 마스크로: 머리(턱 윤곽 위) + 목 창 + 옷 실루엣 안쪽만 살을 보인다. 옷 실루엣 안의 살은 어차피 옷이 위에서 덮는다.
    const parent=body.parentNode,wrap=node(doc,'g',{'data-depth':'job-skin',mask:`url(#${id}skinm)`});parent.insertBefore(wrap,body);wrap.append(body);
    const garmentImg=depthName=>{
      const e=node(doc,'image',{'data-depth':depthName,'data-job':part.classId,href:root+part.file+'?v=1',x:200-part.neck[0]*fit,y:backY-part.neck[1]*garmentY,width:400*fit,height:450*garmentY,preserveAspectRatio:'none'});
      e.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',root+part.file+'?v=1');return e;
    };
    // 목이 굵은 체형(사용자 요청: "목이 통통하고 넓으니 의상의 목 부분을 옆으로 늘려라"): 옷의 깃 부분만 가로로 넓히고
    // 아래로 내려가며 원래 폭으로 이어지게 얇은 띠로 나눠 그린다(겹쳐 그리지 않아 이중선이 생기지 않음). 어깨 아래 몸통은 그대로.
    const collarK=(female?{thin:1,normal:1,strong:1.06,heavy:1.14}:{thin:1,normal:1.04,strong:1.12,heavy:1.3})[type]||1;
    const garment=depthName=>{
      if(collarK<=1||avatar)return garmentImg(depthName);
      // 바깥 묶음에도 원래 옷 좌표를 적어 둔다(파츠 선택 좌표와 대조하는 시험·다른 코드가 읽는다)
      const base=garmentImg(depthName),g=node(doc,'g',{'data-depth':depthName,'data-collar-k':collarK,x:base.getAttribute('x'),y:base.getAttribute('y'),width:base.getAttribute('width'),height:base.getAttribute('height')}),y0=backY-6,y1=backY+40,step=10;
      const kAt=y=>y<=y0?collarK:y>=y1?1:1+(collarK-1)*(1-(t=>t*t*(3-2*t))((y-y0)/(y1-y0)));
      const slice=(top,h,k,n)=>{const cp=node(doc,'clipPath',{id:`${id}${depthName}s${n}`});cp.append(node(doc,'rect',{x:-200,y:top.toFixed(2),width:800,height:(h+.6).toFixed(2)}));defs.append(cp);
        const w=node(doc,'g',{'clip-path':`url(#${id}${depthName}s${n})`}),t=node(doc,'g',{transform:`translate(200 0) scale(${k.toFixed(4)} 1) translate(-200 0)`});t.append(node(doc,'use',{href:`#${id}gimg`}));w.append(t);g.append(w);};
      if(!doc.getElementById(id+'gimg')){const gi=garmentImg('job-garment-src');gi.setAttribute('id',id+'gimg');defs.append(gi);}
      slice(-100,y0+100,collarK,'a');let n=0;for(let y=y0;y<y1;y+=step)slice(y,step,kAt(y+step/2),n++);slice(y1,800,1,'z');
      return g;
    };
    // 옷 그림에 그려진 목 뒤쪽 깃(안쪽 면·폴라 뒷부분)은 지운다: 목 창 안에서는 옷 뒷면도 그리지 않아 목이 앞깃에 바로 닿는다(사용자 제안)
    // 옷 앞면은 목 창 전체가 아니라 '목 창 안에서 실제 살이 있는 곳'만 비운다: 목보다 넓은 창 양옆에 배경이 비치는 구멍이 생기지 않게
    {const fm=node(doc,'mask',{id:id+'frontb',maskUnits:'userSpaceOnUse',x:-100,y:-100,width:600,height:900});fm.append(node(doc,'rect',{x:-100,y:-100,width:600,height:900,fill:'white'}));
     const bk=node(doc,'filter',{id:id+'bk',x:0,y:0,width:1,height:1,filterUnits:'objectBoundingBox'});bk.append(node(doc,'feColorMatrix',{type:'matrix',values:'0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'}));defs.append(bk);
     // (가) 목 창 안이라도 목 폭(nw) 바깥 살(통통 원화의 넓은 목 옆면)은 숨기고 그 자리는 깃 안쪽 옷감(옷 뒷면)이 채운다
     const nw=female?60*fit:{thin:30,normal:60,strong:44,heavy:46}[type]||60; // 마른 남자: 깃 앞날개 안쪽(약 ±30)만 지운다
     // 살이 보이는 범위 = 얼굴(턱 곡선 안쪽, 얼굴 폭) ∪ 목(±nw). 그 밖의 넓은 목 옆면·어깨 살은 숨기고 옷이 덮는다.
     const nr=node(doc,'clipPath',{id:id+'nwr'}),jn=node(doc,'clipPath',{id:id+'jawn'});defs.append(jn);
     // 여자 등 턱 영역이 사각형(rect)으로 된 경우: 얼굴 폭(±60) 안으로 줄여 그대로 쓴다
     if(jaw)for(const c of jaw.children)if(c.tagName==='rect'){const e=shift(c),x=Number(c.getAttribute('x')||0),w=Number(c.getAttribute('width')||400),x0=Math.max(x,140),x1=Math.min(x+w,260);
       if(x1>x0){e.setAttribute('x',x0);e.setAttribute('width',x1-x0);nr.append(e);jn.append(e.cloneNode(true));}}
     if(jaw)for(const c of jaw.children){const d=c.getAttribute('d')||'',m=/^M0 0H400V([\d.]+)H([\d.]+)(C.*)H0Z$/.exec(d.trim());
       if(m){const e=shift(c);e.setAttribute('d',`M${400-Number(m[2])} -100H${m[2]}V${m[1]}${m[3]}Z`);
         // 턱 영역 경계가 그려진 턱선보다 넓다(통통·건장) → 그려진 턱선 폭으로 줄여, 턱선 바깥 목 살은 옷이 덮게
         const k=!female&&(type==='heavy'||type==='strong')?.86:1;e.setAttribute('transform',`${e.getAttribute('transform')||''} translate(200 0) scale(${k} 1) translate(-200 0)`.trim());nr.append(e);}}
     // 남자: 턱을 깃 앞에 그릴 영역은 '실제로 그려진 턱선'(얼굴 그림 좌표의 턱 곡선을 머리 축척으로 옮긴 것) 안쪽만
     if(!female){const ch=Number(selected.layers&&selected.layers[0]&&selected.layers[0].chinY)||251,pv=(female?261:251)+24,T=(x,y)=>`${(200+(x-200)*scale).toFixed(1)} ${(pv+(y-pv)*scale+pose).toFixed(1)}`;
       jn.append(node(doc,'path',{d:`M${T(148,0)}L${T(148,ch-26)}C${T(148,ch-6)} ${T(186,ch+2)} ${T(200,ch+2)}C${T(214,ch+2)} ${T(252,ch-6)} ${T(252,ch-26)}L${T(252,0)}Z`}));}
     else if(jaw)for(const c of jaw.children){if(c.tagName==='path')jn.append(shift(c));else if(c.tagName==='rect'){const e=shift(c),x=Number(c.getAttribute('x')||0),w=Number(c.getAttribute('width')||400),x0=Math.max(x,140),x1=Math.min(x+w,260);if(x1>x0){e.setAttribute('x',x0);e.setAttribute('width',x1-x0);jn.append(e);}}}
     nr.append(node(doc,'rect',{x:200-nw,y:actualChin-30,width:2*nw,height:900}));defs.append(nr);
     // 옷을 지우는 곳은 깃 뒤 테두리(backY) 아래만: 그 위에 솟은 것은 앞깃 날개(목 앞에 있음)라 지우지 않는다 → 턱 아래 네모 목 블록 방지
     const oc=node(doc,'clipPath',{id:id+'opc'});oc.append(node(doc,'path',{d:opening}));defs.append(oc);
     const ob=node(doc,'clipPath',{id:id+'opb'});ob.append(node(doc,'rect',{x:-100,y:(backY-2).toFixed(1),width:600,height:900}));defs.append(ob);
     const cutB=node(doc,'g',{'clip-path':`url(#${id}opb)`}),cut0=node(doc,'g',{'clip-path':`url(#${id}nwr)`}),cut=node(doc,'g',{'clip-path':`url(#${id}opc)`,filter:`url(#${id}bk)`});cut.append(body.cloneNode(true));cut0.append(cut);cutB.append(cut0);fm.append(cutB);
     // 턱은 높은 깃 앞에 있다(정면): 그려진 턱선 안쪽 얼굴은 옷 앞면이 덮지 않는다
     // 깃이 턱보다 높을 때만(앞깃 윗선이 턱 위) 턱을 깃 앞에 그린다. 그 외에는 깃이 목 옆을 덮는다(턱 아래 네모 목 블록 방지)
     if(frontY<actualChin){const cj=node(doc,'g',{'clip-path':`url(#${id}jawn)`,filter:`url(#${id}bk)`});cj.append(body.cloneNode(true));fm.append(cj);}defs.append(fm);}
    const front=garment('job-garment-front');front.setAttribute('mask',`url(#${id}frontb)`);parent.insertBefore(front,wrap.nextSibling);
    // 옷 뒷면: 살(목)이 있는 곳에서는 지우고(목 뒤 깃 삭제), 목 옆 빈 곳에만 깃 안쪽을 남겨 배경 구멍을 막는다. 살보다 아래.
    {const bg=garment('job-garment-back');bg.setAttribute('mask',`url(#${id}frontb)`);parent.insertBefore(bg,wrap);}
    {const aw=node(doc,'filter',{id:id+'aw',x:0,y:0,width:1,height:1,filterUnits:'objectBoundingBox'});aw.append(node(doc,'feColorMatrix',{type:'matrix',values:'0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'}));defs.append(aw);
     const sm=node(doc,'mask',{id:id+'skinm',maskUnits:'userSpaceOnUse',x:-100,y:-100,width:600,height:900});
     const head=node(doc,'g',{fill:'white'});if(jaw)for(const c of jaw.children){const e=shift(c);e.setAttribute('fill','white');head.append(e);}sm.append(head);
     {const og=node(doc,'g',{'clip-path':`url(#${id}nwr)`});og.append(node(doc,'path',{d:opening,fill:'white'}));sm.append(og);}
     defs.append(sm);} // 옷 속 살은 그리지 않는다(옷 그림의 반투명 가장자리·틈으로 살빛이 비치지 않게)
    svg.dataset.outfit=opts.outfit;svg.dataset.jobClass=part.classId;svg.dataset.jobFrontY=frontY;svg.dataset.jobBackY=backY;
    if(!avatar){svg.setAttribute('viewBox','0 0 400 480');svg.setAttribute('height',Math.round(size*480/400));const border=[...svg.children].find(n=>n.tagName==='rect'&&n.getAttribute('x')==='1');if(border)border.setAttribute('height',478);}
    const result=new XMLSerializer().serializeToString(doc);if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
  }
  // ---- 통통·건장 체형은 v0.98 방식 그대로 (사용자 결정: 보통·마른만 새 깊이 방식 먼저 배포) ----
  const IN_PROF_OLD={"m":{"swordsman":[9,13,17,21,23,25,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"berserker":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"lancer":[0,11,15,18,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,15,10,0],"monk":[0,6,10,13,16,19,21,22,23,24,26,26,26,25,24,23,22,20,18,15,11,6,0],"dualblade":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"guardian":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"paladin":[9,13,16,18,19,20,27,28,29,30,30,30,30,30,29,28,27,21,19,18,16,13,9],"giant":[0,6,14,17,20,23,24,26,28,30,30,30,30,30,27,25,24,22,20,17,12,6,0],"assassin":[0,6,15,19,21,23,25,26,27,29,30,30,30,30,27,26,25,24,22,19,16,6,0],"thief":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"poisoner":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"archer":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"sniper":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"gunslinger":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"elementalist":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"warlock":[9,13,17,21,24,26,27,28,29,30,30,29,30,30,29,28,27,26,24,21,17,13,9],"warder":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"chronomancer":[0,6,16,20,23,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,6,0],"summoner":[0,6,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"necromancer":[0,13,17,21,24,25,26,27,28,28,29,29,29,28,28,27,26,25,24,21,17,13,0],"tamer":[9,13,17,21,23,24,25,26,29,30,30,30,30,30,29,26,25,24,23,21,17,13,9],"healer":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,0],"priest":[0,6,14,18,22,24,27,28,29,30,30,30,30,30,29,28,27,25,22,19,15,6,0],"bard":[0,6,15,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,10,6,0],"alchemist":[0,6,15,18,20,22,23,24,24,25,27,30,30,30,24,24,23,22,21,19,16,6,0],"telekinetic":[0,6,14,17,19,21,22,23,24,24,25,25,25,24,24,23,22,21,20,18,15,6,0],"telepath":[0,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,12,0],"teleporter":[9,13,17,21,24,26,27,28,29,30,30,30,30,28,29,28,27,26,24,21,17,13,9],"seer":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"shaman":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"taoist":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"swordmonk":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9],"blackflame":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"apostle":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"machinist":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"gatekeeper":[0,6,10,12,13,14,15,16,16,17,17,17,17,17,16,16,15,14,13,12,10,6,0],"heir":[9,13,17,21,24,26,27,28,29,30,30,30,30,30,29,28,27,26,24,21,17,13,9]},"f":{"swordsman":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"berserker":[0,6,10,12,14,16,17,18,18,19,19,19,19,19,19,18,17,16,15,13,10,7,0],"lancer":[0,7,12,16,18,19,19,22,22,22,30,30,30,29,24,22,21,19,18,16,12,7,0],"monk":[0,7,12,16,19,20,21,22,23,23,24,24,24,24,23,22,21,20,19,16,12,7,0],"dualblade":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"guardian":[0,0,0,8,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,8,0,0,0],"paladin":[0,7,12,16,20,22,23,24,25,26,26,26,26,26,25,24,23,22,20,16,12,7,0],"giant":[0,7,12,16,19,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"assassin":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"thief":[0,7,12,16,18,17,17,17,16,16,16,16,16,16,16,17,17,17,18,16,12,7,0],"poisoner":[0,7,12,16,20,23,23,23,24,24,24,24,24,24,24,24,23,23,20,16,12,7,0],"archer":[0,7,12,16,18,19,20,21,22,22,23,23,23,22,22,21,20,19,18,16,12,0,0],"sniper":[0,7,12,11,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,11,12,7,0],"gunslinger":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"elementalist":[0,7,12,16,18,19,20,21,22,23,30,30,30,29,23,22,21,20,19,16,12,7,0],"warlock":[0,7,12,16,20,22,24,28,29,29,30,30,30,29,29,28,25,21,20,16,12,7,0],"warder":[0,0,12,16,19,21,22,23,24,24,25,25,25,24,24,23,22,21,20,16,12,0,0],"chronomancer":[0,0,11,15,18,20,22,26,27,29,30,30,30,29,29,28,26,20,18,14,9,0,0],"summoner":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"necromancer":[0,7,8,8,11,12,13,14,14,15,15,15,15,15,14,14,13,12,11,8,7,7,0],"tamer":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"healer":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"priest":[0,0,12,16,18,19,21,22,23,24,30,30,30,29,23,22,21,20,18,16,12,0,0],"bard":[0,0,0,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"alchemist":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"telekinetic":[0,0,12,16,20,24,26,27,28,29,30,30,30,29,28,27,26,24,20,16,12,0,0],"telepath":[0,7,12,16,20,24,25,26,27,27,28,28,28,27,27,26,26,24,20,16,12,7,0],"teleporter":[0,7,12,16,20,24,26,28,29,29,30,27,30,29,29,28,26,24,20,16,12,7,0],"seer":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"shaman":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"taoist":[0,0,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"swordmonk":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,0,0],"blackflame":[0,7,12,16,20,23,24,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"apostle":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0],"machinist":[0,0,10,13,15,16,17,18,19,19,19,25,25,25,19,18,18,17,16,14,11,0,0],"gatekeeper":[0,0,12,16,20,21,23,25,29,29,30,30,30,29,29,25,23,22,20,16,12,0,0],"heir":[0,7,12,16,20,24,26,28,29,29,30,30,30,29,29,28,26,24,20,16,12,7,0]}};
  const SHOULDER_OLD={"m":{"swordsman":[-3,-5,-7,-27],"berserker":[17,16,17,1],"lancer":[-15,-16,-15,-30],"monk":[13,9,9,-9],"dualblade":[5,1,1,-17],"guardian":[19,16,15,-5],"paladin":[-2,-6,-4,-21],"giant":[2,1,3,-13],"assassin":[-4,-3,2,-6],"thief":[-11,-13,-13,-23],"poisoner":[-10,-13,-13,-30],"archer":[-7,-10,-10,-27],"sniper":[-8,-9,-7,-7],"gunslinger":[6,4,4,-13],"elementalist":[-1,-3,-3,-19],"warlock":[-5,-8,-7,-23],"warder":[-2,-3,1,-14],"chronomancer":[-4,-7,-7,-23],"summoner":[-12,-12,-13,-29],"necromancer":[-24,-26,-25,-25],"tamer":[-10,-11,-12,-27],"healer":[-4,-7,-7,-23],"priest":[-1,-5,-5,-23],"bard":[-4,-7,-6,-23],"alchemist":[-8,-11,-10,-26],"telekinetic":[-5,-8,-7,-24],"telepath":[-6,-10,-9,-27],"teleporter":[-11,-15,-14,-32],"seer":[-17,-10,-8,-25],"shaman":[-6,-10,-9,-27],"taoist":[-9,-12,-12,-29],"swordmonk":[-6,-10,-9,-27],"blackflame":[12,8,9,-10],"apostle":[-6,-1,1,-16],"machinist":[18,16,17,0],"gatekeeper":[2,3,5,-11],"heir":[-2,-6,-6,-23]},"f":{"swordsman":[4,-4,-6,-22],"berserker":[25,18,16,5],"lancer":[1,-5,-8,-21],"monk":[27,19,17,1],"dualblade":[14,7,4,-9],"guardian":[27,17,13,-1],"paladin":[6,-1,-3,-16],"giant":[11,3,1,-10],"assassin":[6,-4,4,8],"thief":[-21,-26,-27,-21],"poisoner":[-12,-17,-19,-31],"archer":[-2,-8,-10,-23],"sniper":[-18,-24,-24,-10],"gunslinger":[-1,-7,-9,-21],"elementalist":[-11,-14,-16,-28],"warlock":[-7,-12,-13,-24],"warder":[0,-7,-6,-10],"chronomancer":[5,0,-3,-17],"summoner":[-7,-15,-17,-25],"necromancer":[-14,-22,-23,-15],"tamer":[-2,-9,-11,-22],"healer":[0,-7,-9,-21],"priest":[9,1,-1,-14],"bard":[8,2,0,-13],"alchemist":[-3,-10,-13,-25],"telekinetic":[-1,-8,-11,-22],"telepath":[0,-8,-10,-24],"teleporter":[-4,-10,-12,-26],"seer":[3,-4,-6,-19],"shaman":[-2,-8,-10,-23],"taoist":[-3,-9,-12,-24],"swordmonk":[-3,-9,-12,-25],"blackflame":[0,-6,-8,-20],"apostle":[-3,-9,-12,-25],"machinist":[5,-3,-5,-19],"gatekeeper":[2,-5,-7,-20],"heir":[1,-6,-7,-19]}};
  const rimOffOld=(part,female,type)=>{
    const v=((SHOULDER_OLD[female?'f':'m']||{})[part.familyId]||[])[TI[type]??1];
    if(v==null)return female?(TYPE_ADJ_F[type]??2):Math.max(IN_D[part.familyId]?-5:-18,(OFF_M[part.familyId]??-8)+(TYPE_ADJ[type]||0));
    // 단, 앞깃 윗선이 턱보다 MIN_NECK_OLD 이상 아래에 오게 한다(깃이 높은 옷을 올리면 깃이 턱까지 올라와 목이 사라진다)
    const pr=(IN_PROF_OLD[female?'f':'m']||{})[part.familyId],front=pr?Math.max(...pr)*.82:(IN_D[part.familyId]||(female?15:17))*.82;
    return Math.max(-24,MIN_NECK_OLD-front,Math.min(8,v));
  };
  const MIN_NECK_OLD=10;
  function renderOld(avatar,seed,gender,element,rank,size,opts){
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
    const fitting=garmentFit(part,female,type),fit=fitting.x,garmentY=fitting.y;
    // 남자(사용자 요청): 옷은 그대로 두고 목을 깃 안쪽까지 내린다. 목 창을 깃 안쪽 모양(넓고 얕은 U)으로 파서
    // 목 뒤쪽 옷(깃 안쪽 면)이 보이지 않고, 앞깃·폴라 윗선이 목 위로 온다. 옷 그림 기준 값: 안쪽 반폭 inW, 가운데 깊이 inD(px).
    // 목은 깃 안쪽(목 뒤 옷·안쪽 폴라 윗부분)을 채워 앞깃 윗선까지 내려온다 → 목이 옷 앞쪽에 바로 닿는다(사용자 요청).
    // IN_PROF: 옷 그림에서 찾은 앞깃 윗선(가운데에서 -44..44, 4px 간격, 옷 그림 px). 없으면 깃 안쪽 호 모양.
    const backY=actualChin+rimOffOld(part,female,type),prof=(IN_PROF_OLD[female?'f':'m']||{})[part.familyId];
    const inW=(female?34:41)*fit,inD=(IN_D[part.familyId]||(female?15:17))*garmentY;
    const frontY=prof?backY+Math.max(...prof)*garmentY:backY+inD,radius=prof?44*fit:inW,side=backY+3,depth=Math.max(3,frontY-side);
    const opening=!prof?`M${200-radius} 0H${200+radius}V${frontY-depth}A${radius} ${depth} 0 0 1 ${200-radius} ${frontY-depth}Z`
      :`M${200-radius} 0H${200+radius}`+prof.map((d,k)=>`L${(200+(44-k*4)*fit).toFixed(1)} ${(backY+prof[prof.length-1-k]*garmentY).toFixed(1)}`).join('')+'Z';
    const id='ho'+FX.hash(selected.key+opts.outfit+avatar)+'u'+(++_hoUid),clip=node(doc,'clipPath',{id:id+'skin'});
    const jaw=doc.querySelector('clipPath[id$="jaw"]');
    // clipPath 안에는 <g>를 둘 수 없어(브라우저가 무시) 턱 영역이 빠지고 얼굴이 좁은 기둥으로 잘렸다 → 도형마다 transform 을 붙인다
    const shift=c=>{const e=c.cloneNode(true);e.setAttribute('transform',`translate(0 ${pose}) ${e.getAttribute('transform')||''}`.trim());return e;};
    if(jaw){for(const c of jaw.children)clip.append(shift(c));}
    clip.append(node(doc,'path',{d:opening}));defs.append(clip);
    const mask=node(doc,'mask',{id:id+'front',maskUnits:'userSpaceOnUse',x:0,y:0,width:400,height:720});
    mask.append(node(doc,'rect',{width:400,height:720,fill:'white'}));mask.append(node(doc,'path',{d:opening,fill:'black'}));defs.append(mask);
    for(const e of [...doc.querySelectorAll('[data-depth="garment-front"],[data-depth="collar-back"],[data-depth="neck-line"],[data-depth="head-front"]')])e.remove();
    const body=doc.querySelector('[data-depth="underwear"],[data-depth="neck"]');if(!body)return legacy[avatar?'avatar':'card'](seed,gender,element,rank,size,bare);
    const parent=body.parentNode,wrap=node(doc,'g',{'data-depth':'job-skin','clip-path':`url(#${id}skin)`});parent.insertBefore(wrap,body);wrap.append(body);
    const garment=depthName=>{
      const e=node(doc,'image',{'data-depth':depthName,'data-job':part.classId,href:root+part.file+'?v=1',x:200-part.neck[0]*fit,y:backY-part.neck[1]*garmentY,width:400*fit,height:450*garmentY,preserveAspectRatio:'none'});
      e.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',root+part.file+'?v=1');return e;
    };
    // 옷 그림에 그려진 목 뒤쪽 깃(안쪽 면·폴라 뒷부분)은 지운다: 목 창 안에서는 옷 뒷면도 그리지 않아 목이 앞깃에 바로 닿는다(사용자 제안)
    const backG=garment('job-garment-back');backG.setAttribute('mask',`url(#${id}front)`);parent.insertBefore(backG,wrap);
    const front=garment('job-garment-front');front.setAttribute('mask',`url(#${id}front)`);parent.insertBefore(front,wrap.nextSibling);
    if(jaw){const protect=node(doc,'g',{'data-depth':'job-jaw-front','clip-path':`url(#${id}jaw)`});
      const jawClip=node(doc,'clipPath',{id:id+'jaw'});for(const c of jaw.children)jawClip.append(shift(c));defs.append(jawClip);
      protect.append(body.cloneNode(true));parent.insertBefore(protect,front.nextSibling);
    }
    svg.dataset.outfit=opts.outfit;svg.dataset.jobClass=part.classId;svg.dataset.jobFrontY=frontY;svg.dataset.jobBackY=backY;
    if(!avatar){svg.setAttribute('viewBox','0 0 400 480');svg.setAttribute('height',Math.round(size*480/400));const border=[...svg.children].find(n=>n.tagName==='rect'&&n.getAttribute('x')==='1');if(border)border.setAttribute('height',478);}
    const result=new XMLSerializer().serializeToString(doc);if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,result);return mintIds(result);
  }
  PORTRAIT.card=(seed,g,e,r,size=200,opts={})=>render(false,seed,g,e,r,size,opts);
  PORTRAIT.avatar=(seed,g,e,r,size=56,opts={})=>render(true,seed,g,e,r,size,opts);
  PortraitParts.select=(seed,g,opts={})=>{
    const part=get(opts.outfit,g);if(!part)return legacy.select(seed,g,opts);
    const s=legacy.select(seed,g,{...opts,outfit:'underwear'}),female=g==='F',young=s.stage==='child';
    const chin=young?s.layers[0].chinY:(female?261:251),pivot=(female?261:251)+24,scale=young?1:PortraitParts.HEAD_SCALE[g][s.bodyType],pose=young&&!female?8:0;
    const fitting=garmentFit(part,female,s.bodyType),fit=fitting.x,back=pivot+(chin-pivot)*scale+pose+(s.bodyType==='heavy'||s.bodyType==='strong'?rimOffOld:rimOff)(part,female,s.bodyType);
    s.layers[1]={...part,file:'../outfits/'+part.file,rect:[200-part.neck[0]*fit,back-part.neck[1]*fitting.y,400*fit,450*fitting.y]};
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
