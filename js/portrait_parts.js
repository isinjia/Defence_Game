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
        170
      ]
    },
    {
      "file": "hair-m-5.webp",
      "rect": [
        105,
        28,
        190,
        160
      ]
    }
  ],
  "hair-f": [
    {
      "file": "hair-f-0.webp",
      "rect": [
        80,
        24,
        240,
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
        80,
        24,
        240,
        600
      ]
    },
    {
      "file": "hair-f-3.webp",
      "rect": [
        80,
        24,
        240,
        600
      ]
    },
    {
      "file": "hair-f-4.webp",
      "rect": [
        80,
        24,
        240,
        262
      ]
    },
    {
      "file": "hair-f-5.webp",
      "rect": [
        80,
        24,
        240,
        424
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
        145,
        148,
        110,
        30
      ]
    }
  ]
};
  const escape = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const legacy = { card: PORTRAIT.card, avatar: PORTRAIT.avatar };
  function select(seed, gender, opts = {}) {
    const g = gender === 'F' ? 'f' : 'm';
    const hash = FX.hash(seed + '|webtoon-parts-v1');
    const stage = ageStage(opts.age == null ? 25 : opts.age);
    const young = stage === 'baby' || stage === 'child';
    const face = young ? 5 : stage === 'elder' ? 4 : stage === 'middle' ? 3 : stage === 'teen' ? 0 : hash % 3;
    const hair = stage === 'elder' ? 5 : stage === 'middle' ? 4 : (hash >>> 4) % 4;
    const outfits = { coat: 0, hanbok: 1, mandarin: 2, tactical: 3, casual: 4, overcoat: 5 };
    const cloth = young ? 4 : Object.prototype.hasOwnProperty.call(outfits, opts.outfit) ? outfits[opts.outfit] : [0, 1, 2, 3, 5][(hash >>> 8) % 5];
    const race = ['human', 'elf', 'orc', 'dwarf', 'beastkin', 'dragonkin'].includes(opts.race) ? opts.race : 'human';
    const layers = [parts['face-' + g][face], parts['cloth-' + g][cloth], parts['hair-' + g][hair]];
    const trait = { elf: 0, beastkin: 1, dragonkin: 2, orc: 3, dwarf: 4 }[race];
    if (trait != null && !(race === 'dwarf' && (young || g === 'f'))) layers.push(parts.traits[trait]);
    if (!young && race === 'human' && (hash >>> 12) % 7 === 0) layers.push(parts.traits[5]);
    return { layers, race, stage, key: [g, face, hair, cloth, race].join('-') };
  }
  function svg(seed, gender, element, rankIdx, size, opts, avatar) {
    const selection = select(seed, gender, opts);
    const rank = Math.max(0, Math.min(RANKS.length - 1, rankIdx || 0));
    const ring = RANKS[rank].color;
    const aura = ELEMENTS[element] ? elemColor(element) : '#46e0d0';
    const id = 'pp' + FX.hash(selection.key + element + rank + avatar);
    const view = avatar ? '72 0 256 256' : '0 0 400 480';
    // 아이콘도 이마·턱·뿔을 함께 담으며 파츠 자체의 비율은 유지한다.
    const images = selection.layers.map((part, i) => {
      const [x, y, w, h] = part.rect;
      const filter = i === 0 && selection.race === 'orc' ? ` filter="url(#${id}orc)"` : '';
      return `<image href="${root + part.file}" xlink:href="${root + part.file}" x="${x}" y="${y}" width="${w}" height="${h}"${filter}/>`;
    }).join('');
    const background = `<defs><radialGradient id="${id}bg"><stop stop-color="${aura}" stop-opacity=".22"/><stop offset="1" stop-color="#080d19"/></radialGradient><filter id="${id}orc"><feColorMatrix type="matrix" values=".45 .2 0 0 .02 .2 .6 .1 0 .04 .1 .2 .25 0 .01 0 0 0 1 0"/></filter><clipPath id="${id}clip"><circle cx="200" cy="128" r="126"/></clipPath></defs>`;
    const drawing = `<rect x="0" y="0" width="400" height="600" fill="#0a1220"/><ellipse cx="200" cy="190" rx="240" ry="300" fill="url(#${id}bg)"/>${images}`;
    const art = avatar ? `<g clip-path="url(#${id}clip)">${drawing}</g><circle cx="200" cy="128" r="125" fill="none" stroke="${ring}" stroke-width="4"/>` : drawing + `<rect x="1" y="1" width="398" height="478" fill="none" stroke="${ring}" stroke-width="2" opacity=".7"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="v1" data-parts-key="${selection.key}" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size * 1.2)}" viewBox="${view}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(avatar ? '초상화' : '캐릭터 일러스트')}">${background}${art}</svg>`;
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
