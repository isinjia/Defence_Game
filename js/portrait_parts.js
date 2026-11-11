// 생성한 투명 WebP 파츠를 동일한 등록 좌표에서 조합한다. 인물 시드·저장 형식은 유지한다.
const PortraitParts = (() => {
  const root = 'assets/portraits/parts/';
  const parts = {
  "face-m": [
    {
      "file": "face-m-0.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-1.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-2.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-3.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-4.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-5.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-6.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-7.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-8.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-9.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-10.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-11.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-12.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-13.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-14.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-15.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-16.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-m-17.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    }
  ],
  "face-f": [
    {
      "file": "face-f-0.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-1.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-2.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-3.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-4.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-5.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-6.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-7.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-8.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-9.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-10.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-11.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-12.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-13.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-14.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-15.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-16.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    },
    {
      "file": "face-f-17.webp",
      "rect": [
        128,
        55,
        144,
        250
      ]
    }
  ],
  "hair-m": [
    {
      "file": "hair-m-0.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-1.webp",
      "rect": [
        105,
        28,
        190,
        200
      ]
    },
    {
      "file": "hair-m-2.webp",
      "rect": [
        105,
        28,
        190,
        184
      ]
    },
    {
      "file": "hair-m-3.webp",
      "rect": [
        105,
        28,
        190,
        233
      ]
    },
    {
      "file": "hair-m-4.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-5.webp",
      "rect": [
        105,
        28,
        190,
        200
      ]
    },
    {
      "file": "hair-m-6.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-7.webp",
      "rect": [
        105,
        28,
        190,
        200
      ]
    },
    {
      "file": "hair-m-8.webp",
      "rect": [
        105,
        28,
        190,
        184
      ]
    },
    {
      "file": "hair-m-9.webp",
      "rect": [
        105,
        28,
        190,
        233
      ]
    },
    {
      "file": "hair-m-10.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-11.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-12.webp",
      "rect": [
        105,
        28,
        190,
        200
      ]
    },
    {
      "file": "hair-m-13.webp",
      "rect": [
        105,
        28,
        190,
        184
      ]
    },
    {
      "file": "hair-m-14.webp",
      "rect": [
        105,
        28,
        190,
        233
      ]
    },
    {
      "file": "hair-m-15.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-16.webp",
      "rect": [
        105,
        28,
        190,
        193
      ]
    },
    {
      "file": "hair-m-17.webp",
      "rect": [
        105,
        28,
        190,
        200
      ]
    },
    {
      "file": "hair-m-18.webp",
      "rect": [
        105,
        28,
        190,
        184
      ]
    },
    {
      "file": "hair-m-19.webp",
      "rect": [
        105,
        28,
        190,
        233
      ]
    }
  ],
  "hair-f": [
    {
      "file": "hair-f-0.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-1.webp",
      "rect": [
        80,
        24,
        240,
        246
      ]
    },
    {
      "file": "hair-f-2.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-3.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-4.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-5.webp",
      "rect": [
        80,
        24,
        240,
        246
      ]
    },
    {
      "file": "hair-f-6.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-7.webp",
      "rect": [
        80,
        24,
        240,
        246
      ]
    },
    {
      "file": "hair-f-8.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-9.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-10.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-11.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-12.webp",
      "rect": [
        80,
        24,
        240,
        246
      ]
    },
    {
      "file": "hair-f-13.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-14.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-15.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-16.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-17.webp",
      "rect": [
        80,
        24,
        240,
        246
      ]
    },
    {
      "file": "hair-f-18.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    },
    {
      "file": "hair-f-19.webp",
      "rect": [
        0,
        0,
        400,
        600
      ]
    }
  ],
  "cloth-m": [
    {
      "file": "cloth-m-0.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-1.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-2.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-3.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-4.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-5.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-6.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-7.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-8.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-9.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-10.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-11.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-12.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-13.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-14.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-15.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-16.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-17.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-18.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-19.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-20.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-21.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-22.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-23.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-24.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-25.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-26.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-27.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-28.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    },
    {
      "file": "cloth-m-29.webp",
      "rect": [
        0,
        258,
        400,
        342
      ]
    }
  ],
  "cloth-f": [
    {
      "file": "cloth-f-0.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-1.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-2.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-3.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-4.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-5.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-6.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-7.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-8.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-9.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-10.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-11.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-12.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-13.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-14.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-15.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-16.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-17.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-18.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-19.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-20.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-21.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-22.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-23.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-24.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-25.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-26.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-27.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-28.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    },
    {
      "file": "cloth-f-29.webp",
      "rect": [
        10,
        258,
        380,
        342
      ]
    }
  ],
  "traits": [
    {
      "file": "traits-0.webp",
      "rect": [
        91,
        162,
        218,
        66
      ]
    },
    {
      "file": "traits-1.webp",
      "rect": [
        103,
        0,
        194,
        98
      ]
    },
    {
      "file": "traits-2.webp",
      "rect": [
        100,
        0,
        200,
        106
      ]
    },
    {
      "file": "traits-3.webp",
      "rect": [
        179,
        224,
        42,
        24
      ]
    },
    {
      "file": "traits-4.webp",
      "rect": [
        139,
        222,
        122,
        98
      ]
    },
    {
      "file": "traits-5.webp",
      "rect": [
        150,
        148,
        100,
        20
      ]
    }
  ],
  "body-m": [
    {
      "file": "body-m.webp",
      "rect": [
        0,
        0,
        400,
        900
      ]
    }
  ],
  "body-f": [
    {
      "file": "body-f.webp",
      "rect": [
        0,
        0,
        400,
        900
      ]
    }
  ]
};
  const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const legacy = { card: PORTRAIT.card, avatar: PORTRAIT.avatar };
  // 초상 파츠 나이대: 10~40대 초반. 그 밖 나이는 이 구간에 맞춰 보인다.
  const FACE_ADULT = 15;
  const FACE_YOUTH = 3;
  function portraitYears(age) {
    const y = age == null ? 25 : age;
    return Math.max(10, Math.min(42, y));
  }
  function select(seed, gender, opts = {}) {
    const g = gender === 'F' ? 'f' : 'm';
    const hash = FX.hash(seed + '|webtoon-parts-v2');
    const years = portraitYears(opts.age);
    const stage = years < 13 ? 'child' : years < 18 ? 'teen' : 'adult';
    const young = stage === 'child';
    const faces = parts['face-' + g];
    const hairs = parts['hair-' + g];
    const cloths = parts['cloth-' + g];
    // 유스 얼굴은 풀 뒤쪽 FACE_ADULT.. , 성인·청소년은 앞 FACE_ADULT종.
    const face = young
      ? FACE_ADULT + ((hash >>> 2) % Math.min(FACE_YOUTH, Math.max(1, faces.length - FACE_ADULT)))
      : hash % Math.min(FACE_ADULT, faces.length);
    const hair = (hash >>> 4) % hairs.length;
    // 의상 계열: 같은 스타일(6종)을 색 변형으로 묶는다. 아이는 casual 계열.
    const outfits = { coat: 0, hanbok: 1, mandarin: 2, tactical: 3, casual: 4, overcoat: 5 };
    let cloth;
    if (young) cloth = 4 + 6 * ((hash >>> 8) % Math.max(1, Math.floor(cloths.length / 6)));
    else if (Object.prototype.hasOwnProperty.call(outfits, opts.outfit)) {
      const base = outfits[opts.outfit];
      cloth = base + 6 * ((hash >>> 10) % Math.max(1, Math.floor(cloths.length / 6)));
    } else {
      const base = [0, 1, 2, 3, 5][(hash >>> 8) % 5];
      cloth = base + 6 * ((hash >>> 10) % Math.max(1, Math.floor(cloths.length / 6)));
    }
    cloth = Math.min(cloth, cloths.length - 1);
    const race = ['human', 'elf', 'orc', 'dwarf', 'beastkin', 'dragonkin'].includes(opts.race) ? opts.race : 'human';
    const underwear = !young && opts.outfit === 'underwear';
    const layers = [faces[face], underwear ? parts['body-' + g][0] : cloths[cloth], hairs[hair]];
    const trait = { elf: 0, beastkin: 1, dragonkin: 2, orc: 3, dwarf: 4 }[race];
    if (trait != null && !(race === 'dwarf' && (young || g === 'f'))) layers.push(parts.traits[trait]);
    if (!young && race === 'human' && (hash >>> 12) % 7 === 0) layers.push(parts.traits[5]);
    // 얼굴 바깥 사각형이 아니라 실제 눈·입·귀 위치에 맞춰 장신구를 등록한다.
    const registered = layers.map(part => {
      if (!part.file.startsWith('traits-')) return part;
      const index = Number(part.file.match(/traits-(\d+)/)[1]);
      const rect = part.rect.slice();
      if (index === 0) { rect[1] = g === 'm' ? 144 : 154; rect[3] = 56; }
      if (index === 3) { rect[1] = g === 'm' ? 207 : 215; rect[3] = 23; }
      if (index === 4) rect[1] = 203;
      if (index === 5) {
        // 확장 얼굴은 원본 0..2 계열 눈높이를 순환해 맞춘다.
        const fitBase = {
          m: [[200,154,100],[200,153,100],[200,153,98]],
          f: [[200,164,104],[200,163,104],[200,163,104]],
        }[g];
        const youthFit = { m: [200,158,96], f: [200,166,100] }[g];
        const fit = young ? youthFit : fitBase[face % 3];
        rect.splice(0, 4, fit[0] - fit[2] / 2, fit[1] - 6, fit[2], fit[2] / 5);
      }
      return { ...part, rect };
    });
    return { layers: registered, race, stage, outfit: underwear ? 'underwear' : Object.keys(outfits)[cloth % 6], key: [g, face, hair, underwear ? 'underwear' : cloth, race].join('-') };
  }
  function svg(seed, gender, element, rankIdx, size, opts, avatar) {
    const selection = select(seed, gender, opts);
    const rank = Math.max(0, Math.min(RANKS.length - 1, rankIdx || 0));
    const ring = RANKS[rank].color;
    const aura = ELEMENTS[element] ? elemColor(element) : '#46e0d0';
    const id = 'pp' + FX.hash(selection.key + element + rank + avatar);
    const female = selection.layers[0].file.startsWith('face-f');
    const clothStyle = selection.layers[1].file.startsWith('cloth-') ? Number(selection.layers[1].file.match(/cloth-[mf]-(\d+)/)[1]) % 6 : -1;
    // 남성은 눈·머리·귀를 함께 내려 목 노출만 줄인다. 얼굴 파츠 비율은 바꾸지 않는다.
    const headY = female ? 0 : clothStyle === 0 ? 16 : 8;
    const headTransform = ` transform="translate(0 ${headY})"`;
    const underwear = selection.layers[1].file.startsWith('body-');
    const cardHeight = underwear ? 800 : 480;
    const view = avatar ? `72 ${headY} 256 256` : `0 0 400 ${cardHeight}`;
    const face = selection.layers[0], cloth = selection.layers[1];
    const source = part => root + part.file + '?v=4';
    const faceFilter = selection.race === 'orc' ? ` filter="url(#${id}orc)"` : '';
    const image = (part, attributes = '') => {
      const [x, y, w, h] = part.rect, src = source(part);
      return `<image href="${src}" xlink:href="${src}" x="${x}" y="${y}" width="${w}" height="${h}"${attributes}/>`;
    };
    // 검게 채워져 있는 원통형 목구멍은 의상 그림을 앞·뒤로 나눠 목을 사이에 끼운다.
    // 남성 전술복은 이미 열린 U 목선이므로 기존 앞깃 투명 영역을 그대로 사용한다.
    // 색 변형도 같은 스타일의 목선과 뒤깃을 쓴다.
    const roundCollarStyles = { 3: [200, 266, 37, 7], 5: [200, 264, 36, 7] };
    const collar = clothStyle === 0 ? (female ? [200, 290, 34, 6] : [201, 289, 42, 15]) : female ? roundCollarStyles[clothStyle] : null;
    const opening = collar ? `M${collar[0]-collar[2]} 0H${collar[0]+collar[2]}V${collar[1]}A${collar[2]} ${collar[3]} 0 0 1 ${collar[0]-collar[2]} ${collar[1]}Z` : '';
    const collarDefs = collar ? `<clipPath id="${id}collarBack" clipPathUnits="userSpaceOnUse"><path d="${opening}"/></clipPath><mask id="${id}collarFront" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600"><rect width="400" height="600" fill="white"/><path d="${opening}" fill="black"/></mask>` : '';
    const neck = clothStyle === 4 ? [155, 245] : [166, 234];
    const jawY = female ? 210 : 200;
    const faceIndex = Number(face.file.match(/-(\d+)\.webp/)[1]);
    const chinKey = faceIndex >= FACE_ADULT ? 5 : faceIndex % 3;
    const chinY = (female ? [261,261,261,261,260,258] : [251,252,252,254,254,247])[chinKey];
    const chinOffset = chinY - (female ? 261 : 251);
    const headRows = (female
      ? [[200,147,253],[210,150,250],[220,154,246],[230,160,240],[240,168,232],[250,177,224],[258,189,211],[261,196,204],[263,199,201]]
      : [[190,147,253],[200,149,251],[210,152,248],[220,158,242],[230,167,234],[240,177,224],[248,187,214],[251,195,207],[253,199,201]]).map(([y,l,r]) => [y + chinOffset, l, r]);
    const headOutline = `M0 0H400V${headRows[0][0]}L` + headRows.map(([y,l,r]) => `${r} ${y}`).join('L') + 'L' + headRows.slice().reverse().map(([y,l,r]) => `${l} ${y}`).join('L') + `H0Z`;
    const neckBlend = underwear ? `<linearGradient id="${id}neckFade" gradientUnits="userSpaceOnUse" x1="0" y1="270" x2="0" y2="300"><stop stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="${id}neckBlend" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="900"><rect width="400" height="900" fill="url(#${id}neckFade)"/></mask>` : '';
    const background = `<defs>${collarDefs}${neckBlend}<clipPath id="${id}head" clipPathUnits="userSpaceOnUse"><path d="${headOutline}"/></clipPath><clipPath id="${id}neck"><path d="M0 0H400V${jawY}H252L247 ${jawY + 15}L234 ${jawY + 30}V255L${neck[1]} 286V325H${neck[0]}V286L166 255V${jawY + 30}L153 ${jawY + 15}L148 ${jawY}H0Z"/></clipPath><radialGradient id="${id}bg"><stop stop-color="${aura}" stop-opacity=".22"/><stop offset="1" stop-color="#080d19"/></radialGradient><filter id="${id}orc"><feColorMatrix type="matrix" values=".45 .2 0 0 .02 .2 .6 .1 0 .04 .1 .2 .25 0 .01 0 0 0 1 0"/></filter><clipPath id="${id}clip"><circle cx="200" cy="${128 + headY}" r="126"/></clipPath></defs>`;
    const robeNeck = !avatar && clothStyle === 1
      ? `<svg x="164" y="275" width="72" height="60" viewBox="36 220 72 20" preserveAspectRatio="none" aria-hidden="true"><image href="${source(face)}" xlink:href="${source(face)}" width="144" height="250"${faceFilter}/></svg>` : '';
    const backCollar = collar ? image(cloth, ` data-depth="collar-back" clip-path="url(#${id}collarBack)"`) : '';
    // 원본 얼굴·목을 먼저 놓고, 의상 앞깃 다음에 얼굴 윤곽을 다시 얹어 턱이 잘리지 않게 한다.
    const neckPlane = image(face, ` data-depth="neck"${headTransform}${faceFilter}${underwear ? ` mask="url(#${id}neckBlend)"` : ''} clip-path="url(#${id}neck)"`);
    const bodyPlane = underwear ? image(cloth, ` data-depth="underwear"${faceFilter}`) : '';
    const clothPlane = underwear ? '' : image(cloth, ` data-depth="garment-front"${collar ? ` mask="url(#${id}collarFront)"` : ''}`);
    const headPlane = image(face, ` data-depth="head-front"${headTransform}${faceFilter} clip-path="url(#${id}head)"`);
    const accessories = selection.layers.slice(2);
    const glassesIndex = accessories.findIndex(part => part.file === 'traits-5.webp');
    const hairIndex = accessories.findIndex(part => part.file.startsWith('hair-'));
    if (glassesIndex > hairIndex && hairIndex >= 0) accessories.splice(hairIndex, 0, accessories.splice(glassesIndex, 1)[0]);
    const details = accessories.map(part => image(part, headTransform)).join('');
    const drawing = `<rect width="400" height="${Math.max(600, cardHeight)}" fill="#0a1220"/><ellipse cx="200" cy="190" rx="240" ry="300" fill="url(#${id}bg)"/>${bodyPlane}${robeNeck}${backCollar}${neckPlane}${clothPlane}${headPlane}${details}`;
    const art = avatar ? `<g clip-path="url(#${id}clip)">${drawing}</g><circle cx="200" cy="${128 + headY}" r="125" fill="none" stroke="${ring}" stroke-width="4"/>` : drawing + `<rect x="1" y="1" width="398" height="${cardHeight - 2}" fill="none" stroke="${ring}" stroke-width="2" opacity=".7"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="v4" data-head-offset="${headY}" data-outfit="${selection.outfit}" data-parts-key="${selection.key}" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size * cardHeight / 400)}" viewBox="${view}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(avatar ? '초상화' : '캐릭터 일러스트')}">${background}${art}</svg>`;
  }
  PORTRAIT.card = function (seed, gender, element, rank, size = 200, opts = {}) {
    if (!opts.outfit && (!opts.race || opts.race === 'human') && PORTRAIT.imageFor(seed, gender)) return legacy.card.apply(this, arguments);
    return svg(seed, gender, element, rank, size, opts, false);
  };
  PORTRAIT.avatar = function (seed, gender, element, rank, size = 56, opts = {}) {
    if (!opts.outfit && (!opts.race || opts.race === 'human') && PORTRAIT.imageFor(seed, gender)) return legacy.avatar.apply(this, arguments);
    return svg(seed, gender, element, rank, size, opts, true);
  };

  // canvas 지도 마커: SVG 데이터 URL 안의 외부 이미지는 브라우저가 로드하지 않으므로 먼저 내장한다.
  const cache = new Map();
  const rasterize = source => {
    if (cache.has(source)) return cache.get(source);
    const promise = (async () => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      await Promise.all([...doc.querySelectorAll('image')].map(async node => {
        const img = new Image(); img.src = node.getAttribute('href');
        await new Promise((resolve, reject) => { if (img.complete && img.naturalWidth) resolve(); else { img.onload = resolve; img.onerror = reject; } });
        const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        cv.getContext('2d').drawImage(img, 0, 0);
        const data = cv.toDataURL('image/png'); node.setAttribute('href', data); node.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', data);
      }));
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(doc));
    })();
    if (cache.size >= 48) cache.delete(cache.keys().next().value);
    cache.set(source, promise); promise.catch(() => cache.delete(source)); return promise;
  };
  const baseMapImage = MapView.prototype.setPlayerImage;
  MapView.prototype.setPlayerImage = function (source) {
    if (!source.includes('data-portrait-parts=')) { this._partsSource = null; return baseMapImage.call(this, source); }
    if (this._partsSource === source) return;
    this._partsSource = source;
    rasterize(source).then(url => { if (this._partsSource === source) baseMapImage.call(this, url); }).catch(() => { if (this._partsSource === source) this._partsSource = null; });
  };
  return { select, rasterize };
})();
