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
    const layers = [faces[face], cloths[cloth], hairs[hair]];
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
    return { layers: registered, race, stage, key: [g, face, hair, cloth, race].join('-') };
  }
  function svg(seed, gender, element, rankIdx, size, opts, avatar) {
    const selection = select(seed, gender, opts);
    const rank = Math.max(0, Math.min(RANKS.length - 1, rankIdx || 0));
    const ring = RANKS[rank].color;
    const aura = ELEMENTS[element] ? elemColor(element) : '#46e0d0';
    const id = 'pp' + FX.hash(selection.key + element + rank + avatar);
    const view = avatar ? '72 0 256 256' : '0 0 400 480';
    // 아이콘도 이마·턱·뿔을 함께 담으며 파츠 자체의 비율은 유지한다.
    // 안경 다리는 앞머리 밑으로 들어간다. 귀·뿔 등 다른 종족 파츠의 순서는 유지한다.
    const drawLayers = selection.layers.slice();
    const glassesIndex = drawLayers.findIndex(part => part.file === 'traits-5.webp');
    const hairIndex = drawLayers.findIndex(part => part.file.startsWith('hair-'));
    if (glassesIndex > hairIndex && hairIndex >= 0) drawLayers.splice(hairIndex, 0, drawLayers.splice(glassesIndex, 1)[0]);
    // 목은 옷깃 안쪽(뒤), 턱·얼굴은 옷 앞. 하이칼라가 턱 끝을 덮지 않게 순서를 나눈다.
    const facePart = selection.layers[0];
    const clothPart = selection.layers[1];
    const female = facePart.file.startsWith('face-f');
    const clothStyle = Number((clothPart.file.match(/cloth-[mf]-(\d+)/) || [])[1] || 0) % 6;
    const neck = clothStyle === 4 ? [155, 245] : [166, 234];
    // jawY: 목 클립이 시작되는 턱선. 코가 아니라 실제 턱 근처에 둔다.
    const jawY = female ? 248 : 242;
    // chinY: 이 높이까지는 옷 위에 다시 그려 턱이 옷깃 앞에 오게 한다.
    const chinY = female ? 254 : 250;
    // 닫힌 하이칼라(여성 한복·코트 등)는 살짝 내려 턱과 옷깃 사이에 목 깊이를 만든다.
    const clothClosed = clothStyle !== 4 && (female || clothStyle === 0);
    const clothDy = clothClosed ? 10 : 0;
    const partSrc = (file) => root + file + '?v=4';
    const orcFilter = selection.race === 'orc' ? ` filter="url(#${id}orc)"` : '';
    const drawPart = (part, extra = '') => {
      const [x, y, w, h] = part.rect;
      const dy = part.file.startsWith('cloth-') ? clothDy : 0;
      return `<image href="${partSrc(part.file)}" xlink:href="${partSrc(part.file)}" x="${x}" y="${y + dy}" width="${w}" height="${h}"${extra}/>`;
    };
    const rest = drawLayers.filter(part => !part.file.startsWith('face-') && !part.file.startsWith('cloth-'));
    // 하이칼라만 턱을 옷 앞에 다시 그린다. 열린 V넥은 목·깃이 이미 맞으므로 얼굴 한 장만 쓴다.
    const chinFront = clothClosed
      ? `<ellipse cx="200" cy="${chinY + 1}" rx="20" ry="4" fill="#05070d" opacity=".2"/>${drawPart(facePart, `${orcFilter} clip-path="url(#${id}chin)"`)}`
      : '';
    const images = [
      drawPart(facePart, `${orcFilter} clip-path="url(#${id}neck)"`),
      drawPart(clothPart),
      chinFront,
      ...rest.map(part => drawPart(part)),
    ].join('');
    const chinClip = clothClosed ? `<clipPath id="${id}chin"><path d="M0 0H400V${chinY - 18}H260L248 ${chinY - 8}L230 ${chinY}H170L152 ${chinY - 8}L140 ${chinY - 18}H0Z"/></clipPath>` : '';
    const background = `<defs><clipPath id="${id}neck"><path d="M0 0H400V${jawY}H252L247 ${jawY + 10}L238 ${jawY + 18}V${jawY + 22}L${neck[1]} 286V325H${neck[0]}V286L166 ${jawY + 22}V${jawY + 18}L161 ${jawY + 10}L148 ${jawY}H0Z"/></clipPath>${chinClip}<radialGradient id="${id}bg"><stop stop-color="${aura}" stop-opacity=".22"/><stop offset="1" stop-color="#080d19"/></radialGradient><filter id="${id}orc"><feColorMatrix type="matrix" values=".45 .2 0 0 .02 .2 .6 .1 0 .04 .1 .2 .25 0 .01 0 0 0 1 0"/></filter><clipPath id="${id}clip"><circle cx="200" cy="128" r="126"/></clipPath></defs>`;
    // 열린 도포의 V 목선 아래까지 같은 얼굴 파츠의 목 피부를 이어 넣는다.
    // 머리·턱은 원래 크기로 두고, 의상 뒤의 작은 피부 구간만 채운다.
    const faceSrc = partSrc(facePart.file);
    const robeNeck = !avatar && clothStyle === 1
      ? `<svg x="164" y="${275 + clothDy}" width="72" height="60" viewBox="36 220 72 20" preserveAspectRatio="none" aria-hidden="true"><image href="${faceSrc}" xlink:href="${faceSrc}" width="144" height="250"${orcFilter}/></svg>` : '';
    const drawing = `<rect x="0" y="0" width="400" height="600" fill="#0a1220"/><ellipse cx="200" cy="190" rx="240" ry="300" fill="url(#${id}bg)"/>${robeNeck}${images}`;
    const art = avatar ? `<g clip-path="url(#${id}clip)">${drawing}</g><circle cx="200" cy="128" r="125" fill="none" stroke="${ring}" stroke-width="4"/>` : drawing + `<rect x="1" y="1" width="398" height="478" fill="none" stroke="${ring}" stroke-width="2" opacity=".7"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="v4" data-parts-key="${selection.key}" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size * 1.2)}" viewBox="${view}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(avatar ? '초상화' : '캐릭터 일러스트')}">${background}${art}</svg>`;
  }
  PORTRAIT.card = function (seed, gender, element, rank, size = 200, opts = {}) {
    if ((!opts.race || opts.race === 'human') && PORTRAIT.imageFor(seed, gender)) return legacy.card.apply(this, arguments);
    return svg(seed, gender, element, rank, size, opts, false);
  };
  PORTRAIT.avatar = function (seed, gender, element, rank, size = 56, opts = {}) {
    if ((!opts.race || opts.race === 'human') && PORTRAIT.imageFor(seed, gender)) return legacy.avatar.apply(this, arguments);
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
