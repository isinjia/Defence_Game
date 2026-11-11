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
      ],
      "skinRgb": [
        235.0,
        197.0,
        178.0
      ],
      "chinY": 251,
      "skinMask": "face-m-0-skin.webp"
    },
    {
      "file": "face-m-1.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        234.0,
        194.0,
        174.0
      ],
      "chinY": 252,
      "skinMask": "face-m-1-skin.webp"
    },
    {
      "file": "face-m-2.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        232.0,
        192.0,
        171.0
      ],
      "chinY": 252,
      "skinMask": "face-m-2-skin.webp"
    },
    {
      "file": "face-m-3.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        236.0,
        194.5,
        169.0
      ],
      "chinY": 246,
      "skinMask": "face-m-3-skin.webp"
    },
    {
      "file": "face-m-4.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        238.0,
        198.0,
        173.0
      ],
      "chinY": 250,
      "skinMask": "face-m-4-skin.webp"
    },
    {
      "file": "face-m-5.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        255.0,
        201.0,
        168.5
      ],
      "chinY": 251,
      "skinMask": "face-m-5-skin.webp"
    },
    {
      "file": "face-m-6.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        237.0,
        189.0,
        155.0
      ],
      "chinY": 250,
      "skinMask": "face-m-6-skin.webp"
    },
    {
      "file": "face-m-7.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        226.0,
        197.5,
        195.0
      ],
      "chinY": 252,
      "skinMask": "face-m-7-skin.webp"
    },
    {
      "file": "face-m-8.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        226.0,
        195.5,
        192.0
      ],
      "chinY": 252,
      "skinMask": "face-m-8-skin.webp"
    },
    {
      "file": "face-m-9.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        227.0,
        206.5,
        152.0
      ],
      "chinY": 246,
      "skinMask": "face-m-9-skin.webp"
    },
    {
      "file": "face-m-10.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        200.0,
        160.0,
        139.5
      ],
      "chinY": 252,
      "skinMask": "face-m-10-skin.webp"
    },
    {
      "file": "face-m-11.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        199.0,
        159.0,
        137.0
      ],
      "chinY": 252,
      "skinMask": "face-m-11-skin.webp"
    },
    {
      "file": "face-m-12.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        255.0,
        223.5,
        196.0
      ],
      "chinY": 250,
      "skinMask": "face-m-12-skin.webp"
    },
    {
      "file": "face-m-13.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.5,
        222.0,
        199.0
      ],
      "chinY": 252,
      "skinMask": "face-m-13-skin.webp"
    },
    {
      "file": "face-m-14.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.5,
        221.0,
        196.0
      ],
      "chinY": 252,
      "skinMask": "face-m-14-skin.webp"
    },
    {
      "file": "face-m-15.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        235.5,
        198.0,
        178.5
      ],
      "chinY": 247,
      "skinMask": "face-m-15-skin.webp"
    },
    {
      "file": "face-m-16.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        255.0,
        199.0,
        168.0
      ],
      "chinY": 247,
      "skinMask": "face-m-16-skin.webp"
    },
    {
      "file": "face-m-17.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.0,
        223.5,
        201.5
      ],
      "chinY": 247,
      "skinMask": "face-m-17-skin.webp"
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
      ],
      "skinRgb": [
        228.0,
        195.0,
        186.0
      ],
      "chinY": 261,
      "skinMask": "face-f-0-skin.webp"
    },
    {
      "file": "face-f-1.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        227.0,
        194.0,
        184.0
      ],
      "chinY": 261,
      "skinMask": "face-f-1-skin.webp"
    },
    {
      "file": "face-f-2.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        227.0,
        194.0,
        184.0
      ],
      "chinY": 261,
      "skinMask": "face-f-2-skin.webp"
    },
    {
      "file": "face-f-3.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        236.0,
        191.0,
        167.0
      ],
      "chinY": 239,
      "skinMask": "face-f-3-skin.webp"
    },
    {
      "file": "face-f-4.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        243.0,
        205.0,
        185.0
      ],
      "chinY": 242,
      "skinMask": "face-f-4-skin.webp"
    },
    {
      "file": "face-f-5.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        251.0,
        199.0,
        176.0
      ],
      "chinY": 261,
      "skinMask": "face-f-5-skin.webp"
    },
    {
      "file": "face-f-6.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        234.0,
        199.0,
        183.5
      ],
      "chinY": 264,
      "skinMask": "face-f-6-skin.webp"
    },
    {
      "file": "face-f-7.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        219.0,
        197.0,
        207.0
      ],
      "chinY": 261,
      "skinMask": "face-f-7-skin.webp"
    },
    {
      "file": "face-f-8.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        219.0,
        197.0,
        207.0
      ],
      "chinY": 261,
      "skinMask": "face-f-8-skin.webp"
    },
    {
      "file": "face-f-9.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        225.0,
        191.5,
        184.0
      ],
      "chinY": 239,
      "skinMask": "face-f-9-skin.webp"
    },
    {
      "file": "face-f-10.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        196.0,
        161.0,
        148.0
      ],
      "chinY": 261,
      "skinMask": "face-f-10-skin.webp"
    },
    {
      "file": "face-f-11.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        195.0,
        161.0,
        148.0
      ],
      "chinY": 261,
      "skinMask": "face-f-11-skin.webp"
    },
    {
      "file": "face-f-12.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        207.0,
        169.0,
        148.0
      ],
      "chinY": 242,
      "skinMask": "face-f-12-skin.webp"
    },
    {
      "file": "face-f-13.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.0,
        222.0,
        210.0
      ],
      "chinY": 261,
      "skinMask": "face-f-13-skin.webp"
    },
    {
      "file": "face-f-14.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.0,
        221.5,
        210.0
      ],
      "chinY": 261,
      "skinMask": "face-f-14-skin.webp"
    },
    {
      "file": "face-f-15.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        227.0,
        194.0,
        183.0
      ],
      "chinY": 258,
      "skinMask": "face-f-15-skin.webp"
    },
    {
      "file": "face-f-16.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        246.0,
        195.0,
        172.0
      ],
      "chinY": 259,
      "skinMask": "face-f-16-skin.webp"
    },
    {
      "file": "face-f-17.webp",
      "rect": [
        128,
        55,
        144,
        250
      ],
      "skinRgb": [
        254.0,
        220.0,
        207.0
      ],
      "chinY": 258,
      "skinMask": "face-f-17-skin.webp"
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
        80,
        24,
        240,
        262
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
        80,
        24,
        240,
        262
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
      ],
      "skinRgb": [
        196.0,
        166.0,
        153.0
      ],
      "skinMask": "traits-0-skin.webp"
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
      "file": "body-m-normal.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "normal",
      "skinMask": "body-m-normal-skin.webp",
      "skinSample": [
        80,
        310,
        8,
        8
      ],
      "skinRgb": [
        221.0,
        187.0,
        173.0
      ]
    },
    {
      "file": "body-m-thin.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "thin",
      "skinMask": "body-m-thin-skin.webp",
      "skinSample": [
        76,
        310,
        8,
        8
      ],
      "skinRgb": [
        223.0,
        189.0,
        176.0
      ]
    },
    {
      "file": "body-m.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "strong",
      "skinMask": "body-m-skin.webp",
      "skinSample": [
        284,
        310,
        8,
        8
      ],
      "skinRgb": [
        226.0,
        190.0,
        175.0
      ]
    },
    {
      "file": "body-m-heavy.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "heavy",
      "skinMask": "body-m-heavy-skin.webp",
      "skinSample": [
        72,
        310,
        8,
        8
      ],
      "skinRgb": [
        221.0,
        189.0,
        177.0
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
        600
      ],
      "bodyType": "normal",
      "skinMask": "body-f-skin.webp",
      "skinSample": [
        288,
        310,
        8,
        8
      ],
      "skinRgb": [
        219.0,
        189.0,
        181.0
      ]
    },
    {
      "file": "body-f-thin.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "thin",
      "skinMask": "body-f-thin-skin.webp",
      "skinSample": [
        272,
        314,
        8,
        8
      ],
      "skinRgb": [
        220.0,
        191.0,
        183.0
      ]
    },
    {
      "file": "body-f-strong.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "strong",
      "skinMask": "body-f-strong-skin.webp",
      "skinSample": [
        300,
        338,
        8,
        8
      ],
      "skinRgb": [
        220.0,
        190.0,
        183.0
      ]
    },
    {
      "file": "body-f-heavy.webp",
      "rect": [
        0,
        0,
        400,
        600
      ],
      "bodyType": "heavy",
      "skinMask": "body-f-heavy-skin.webp",
      "skinSample": [
        68,
        318,
        8,
        8
      ],
      "skinRgb": [
        218.0,
        187.0,
        180.0
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
    let face = young
      ? FACE_ADULT + ((hash >>> 2) % Math.min(FACE_YOUTH, Math.max(1, faces.length - FACE_ADULT)))
      : hash % Math.min(FACE_ADULT, faces.length);
    // 별도 화풍으로 제작된 성인 파츠만 같은 시드의 웹툰풍 얼굴로 대체한다.
    if (!young) face = ({3:0,4:1,6:2,9:5,12:1})[face] ?? face;
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
    const bodyType = ['thin','normal','strong','heavy'].includes(opts.bodyType) ? opts.bodyType : 'normal';
    const skinTone = ['natural','fair','medium','tan','deep'].includes(opts.skinTone) ? opts.skinTone : 'natural';
    const bodyIndex = { normal:0, thin:1, strong:2, heavy:3 }[bodyType];
    const baseBody = parts['body-' + g][bodyIndex] || parts['body-' + g][0];
    const layers = [faces[face], underwear ? baseBody : cloths[cloth], hairs[hair]];
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
    return { layers: registered, race, stage, bodyType, skinTone, baseBody, outfit: underwear ? 'underwear' : Object.keys(outfits)[cloth % 6], key: [g, face, hair, underwear ? 'underwear' : cloth, race, bodyType, skinTone].join('-') };
  }
  function svg(seed, gender, element, rankIdx, size, opts, avatar) {
    const selection = select(seed, gender, opts);
    const rank = Math.max(0, Math.min(RANKS.length - 1, rankIdx || 0));
    const ring = RANKS[rank].color;
    const aura = ELEMENTS[element] ? elemColor(element) : '#46e0d0';
    const id = 'pp' + FX.hash(selection.key + element + rank + avatar);
    const face = selection.layers[0], cloth = selection.layers[1], base = selection.baseBody;
    const female = face.file.startsWith('face-f');
    const underwear = selection.outfit === 'underwear';
    const integrated = selection.stage !== 'child';
    const style = underwear ? -1 : Number(cloth.file.match(/cloth-[mf]-(\d+)/)[1]) % 6;
    const pose = underwear ? 0 : female ? 0 : style === 0 ? 28 : 8;
    const chin = female ? 261 : 251;
    const featureOffset = chin - (face.chinY || chin);
    const headY = integrated ? pose + featureOffset : pose;
    // 턱 아래를 고정해 얼굴·헤어·장신구를 같은 비율로 줄이고 목은 어깨로 이어 준다.
    const headScale = integrated ? (female ? { thin:.86, normal:.92, strong:.96, heavy:1 } : { thin:.86, normal:.85, strong:.96, heavy:1 })[selection.bodyType] /* 남자 보통 체형 머리 0.92→0.85 (사용자 요청, 미리보기 확인) */ : 1;
    const neckPivot = chin + 24 + pose;
    const headTransform = `translate(200 ${neckPivot}) scale(${headScale}) translate(-200 ${-neckPivot})`;
    const fitHead = markup => headScale === 1 ? markup : `<g data-proportion="head" transform="${headTransform}">${markup}</g>`;
    const cardHeight = underwear ? 440 : 480;
    const view = avatar ? `72 ${pose} 256 256` : `0 0 400 ${cardHeight}`;
    const source = part => root + part.file + '?v=8';
    const image = (part, attrs = '') => {
      const [x,y,w,h] = part.rect, src = source(part);
      return `<image href="${src}" xlink:href="${src}" x="${x}" y="${y}" width="${w}" height="${h}"${attrs}/>`;
    };
    const palette = { fair:[246,218,200], medium:[220,180,150], tan:[182,133,95], deep:[133,88,65] };
    const target = palette[selection.skinTone] || face.skinRgb || [230,195,180];
    // 피부 마스크 안의 색만 바꿔 흰자·입술·검은 선·속옷 색은 보존한다.
    const skinImage = (part, name, attrs = '', feature = false) => `<g${attrs}>${image(part, ` data-skin-source="${source(part)}" data-skin-mask="${root+part.skinMask}?v=8" data-skin-rgb="${part.skinRgb.join(',')}" data-skin-target="${target.join(',')}" data-skin-race="${selection.race}"${feature ? ` data-face-feature="${female ? 'f' : 'm'}" data-feature-offset="${featureOffset}"` : ''}${name === 'base' ? ` data-body-scale="${headScale}" data-body-pivot="${chin+24}"` : ''}`)}</g>`;
    const fit = integrated ? { thin:.9, normal:1, strong:1.04, heavy:1.12 }[selection.bodyType] : 1;
    const garmentAttrs = fit === 1 ? '' : ` transform="translate(200 0) scale(${fit} 1) translate(-200 0)"`;
    const round = {3:[200,266,37,7],5:[200,264,36,7]};
    const collar = style === 0 ? (female ? [200,290,34,6] : [201,289,42,15]) : female ? round[style] : null;
    const opening = collar ? `M${collar[0]-collar[2]} 0H${collar[0]+collar[2]}V${collar[1]}A${collar[2]} ${collar[3]} 0 0 1 ${collar[0]-collar[2]} ${collar[1]}Z` : '';
    const collarDefs = collar ? `<clipPath id="${id}back"><path d="${opening}"/></clipPath><mask id="${id}front" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600"><rect width="400" height="600" fill="white"/><path d="${opening}" fill="black"/></mask>` : '';
    // 닫힌 칼라는 기존 폭을 유지하고, 코트는 아래에서 실제 칼라 구멍으로 목을 연결한다.
    const neckWidth = {thin:52,normal:68,strong:76,heavy:92}[selection.bodyType];
    const neckPath = `M0 0H400V${chin+4}H${200+neckWidth/2}V330H${200-neckWidth/2}V${chin+4}H0Z`;
    const neckClip = collar ? `<rect width="400" height="${chin+24-22*headScale}"/><path d="${opening}" transform="translate(0 ${-pose}) translate(200 0) scale(${fit} 1) translate(-200 0)"/>` : `<path d="${neckPath}"/>`;
    const baseClips = `<clipPath id="${id}neck">${neckClip}</clipPath><clipPath id="${id}jaw"><rect width="400" height="${chin+24-22*headScale}"/></clipPath>`;
    const featureY = female ? 175 : 165;
    const features = `<radialGradient id="${id}features"><stop stop-color="white"/><stop offset=".9" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient><mask id="${id}featureMask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600"><ellipse cx="200" cy="${featureY}" rx="62" ry="70" fill="url(#${id}features)"/></mask>`;
    const defs = `<defs>${baseClips}${features}${collarDefs}<radialGradient id="${id}bg"><stop stop-color="${aura}" stop-opacity=".22"/><stop offset="1" stop-color="#080d19"/></radialGradient><clipPath id="${id}circle"><circle cx="200" cy="${128+pose}" r="126"/></clipPath></defs>`;
    const back = collar ? image(cloth, ` data-depth="collar-back" clip-path="url(#${id}back)"${garmentAttrs}`) : '';
    const rawBody = integrated
      ? skinImage(base,'base', ` data-depth="${underwear ? 'underwear' : 'neck'}" transform="translate(0 ${pose})"${underwear ? '' : ` clip-path="url(#${id}neck)"`}`)
      : skinImage(face,'face',` data-depth="neck" transform="translate(0 ${pose})"`);
    const garment = underwear ? '' : image(cloth, ` data-depth="garment-front"${collar ? ` mask="url(#${id}front)"` : ''}${garmentAttrs}`);
    const rawForeground = integrated && !underwear ? skinImage(base,'base',` data-depth="head-front" transform="translate(0 ${pose})" clip-path="url(#${id}jaw)"`) : '';
    const facial = integrated ? `<g data-join="features" transform="translate(0 ${pose})" mask="url(#${id}featureMask)">${skinImage(face,'face',` data-depth="face-features" transform="translate(0 ${featureOffset})"`, true)}</g>` : '';
    const accessories = selection.layers.slice(2);
    const glass = accessories.findIndex(p => p.file === 'traits-5.webp');
    const hair = accessories.findIndex(p => p.file.startsWith('hair-'));
    if (glass > hair && hair >= 0) accessories.splice(hair,0,accessories.splice(glass,1)[0]);
    const hairPart = accessories.find(part => part.file.startsWith('hair-'));
    const splitHair = integrated && female && hairPart;
    const hairData = splitHair ? ` data-hair-source="${source(hairPart)}" data-hair-rect="${hairPart.rect.join(',')}" data-head-source="${source(base)}" data-head-chin="${chin}"` : '';
    const rearHair = splitHair ? fitHead(image(hairPart, ` data-depth="hair-back" data-hair-layer="back" transform="translate(0 ${pose})"${hairData}`)) : '';
    const details = accessories.map(part => {
      const onFace = /traits-(3|5)\.webp/.test(part.file);
      const attrs = ` transform="translate(0 ${integrated && !onFace ? pose : headY})"`;
      if (splitHair && part.file.startsWith('hair-')) {
        return image(part, attrs + ` data-depth="hair-front" data-hair-layer="front"${hairData}`);
      }
      return part.file === 'traits-0.webp' ? skinImage(part,'ear',attrs) : image(part,attrs);
    }).join('');
    const body = rawBody;
    const foreground = rawForeground;
    const head = fitHead(facial + details);
    const layers = avatar ? `${rearHair}${body}${head}` : `${back}${rearHair}${body}${garment}${foreground}${head}`;
    const drawing = `<rect width="400" height="600" fill="#0a1220"/><ellipse cx="200" cy="190" rx="240" ry="300" fill="url(#${id}bg)"/>${layers}`;
    const art = avatar ? `<g clip-path="url(#${id}circle)">${drawing}</g><circle cx="200" cy="${128+pose}" r="125" fill="none" stroke="${ring}" stroke-width="4"/>` : drawing+`<rect x="1" y="1" width="398" height="${cardHeight-2}" fill="none" stroke="${ring}" stroke-width="2" opacity=".7"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-portrait-parts="v12" data-head-scale="${headScale}" data-neck-pivot="${neckPivot}" data-head-offset="${headY}" data-base-offset="${pose}" data-outfit="${selection.outfit}" data-body-type="${selection.bodyType}" data-skin-tone="${selection.skinTone}" data-parts-key="${selection.key}" class="${avatar ? 'avatar' : 'portrait'}" width="${size}" height="${avatar ? size : Math.round(size*cardHeight/400)}" viewBox="${view}" role="img" aria-label="${avatar ? '초상화' : '캐릭터 일러스트'}">${defs}${art}</svg>`;
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
  const cache = new Map(), embeddedImages = new Map();
  const loadImage = async source => {
    const image = new Image(); image.src = source;
    await new Promise((resolve, reject) => { if (image.complete && image.naturalWidth) resolve(); else { image.onload = resolve; image.onerror = reject; } });
    return image;
  };
  // 피부색과 몸 비율을 한 비트맵으로 계산한다. SVG 필터·분할 use의 타일 깨짐을 피한다.
  const skinBitmaps = new Map();
  const skinBitmap = node => {
    const attrs = ['skinSource','skinMask','skinRgb','skinTarget','skinRace','bodyScale','bodyPivot','faceFeature','featureOffset'].map(k => node.dataset[k] || '');
    const key = attrs.join('|');
    if (skinBitmaps.has(key)) return skinBitmaps.get(key);
    const promise = (async () => {
      const [source,mask] = await Promise.all([loadImage(attrs[0]),loadImage(attrs[1])]);
      const cv = document.createElement('canvas'); cv.width=source.naturalWidth; cv.height=source.naturalHeight;
      const ctx=cv.getContext('2d'); ctx.drawImage(source,0,0); const pixels=ctx.getImageData(0,0,cv.width,cv.height);
      ctx.clearRect(0,0,cv.width,cv.height); ctx.drawImage(mask,0,0,cv.width,cv.height); const masks=ctx.getImageData(0,0,cv.width,cv.height).data;
      const rgb=attrs[2].split(',').map(Number), target=attrs[3].split(',').map(Number), gain=target.map((v,i)=>v/rgb[i]);
      const linear = v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
      const srgb = v => 255*(v <= .0031308 ? 12.92*v : 1.055*v**(1/2.4)-.055);
      for(let k=0;k<pixels.data.length;k+=4){
        const alpha=masks[k]/255; if(!alpha || !pixels.data[k+3])continue;
        let tone=gain.map((g,i)=>Math.min(255,pixels.data[k+i]*g));
        if(attrs[4]==='orc'){
          const [r,g,b]=tone.map(v=>linear(v/255));
          tone=[.45*r+.2*g+.02,.2*r+.6*g+.1*b+.04,.1*r+.2*g+.25*b+.01].map(srgb);
        }
        for(let c=0;c<3;c++)pixels.data[k+c]=pixels.data[k+c]*(1-alpha)+tone[c]*alpha;
      }
      if(attrs[7]){
        // 표정 파츠의 볼·턱 외곽선을 제외한다. 턱 윤곽은 통합 몸 원화 한 장만 사용한다.
        const knots=[[105,26],[135,55],[170,55],[190,45],[210,35],[228,28],[240,18],[245,0]];
        const shift=attrs[7]==='m'?10:0,offset=Number(attrs[8]);
        for(let y=0;y<cv.height;y++){
          const fy=55+y+offset+shift;
          let half=0;
          for(let i=1;i<knots.length;i++)if(fy>=knots[i-1][0]&&fy<=knots[i][0]){
            const [y0,w0]=knots[i-1],[y1,w1]=knots[i];half=w0+(w1-w0)*(fy-y0)/(y1-y0);break;
          }
          const vertical=Math.max(0,Math.min(1,(fy-105)/8,(245-fy)/8));
          for(let x=0;x<cv.width;x++){
            const edge=Math.max(0,Math.min(1,(half-Math.abs(128+x-200))/6));
            pixels.data[(y*cv.width+x)*4+3]*=edge*vertical;
          }
        }
      }
      ctx.putImageData(pixels,0,0);
      const scale=Number(attrs[5]||1),pivot=Number(attrs[6]||0);
      if(scale!==1){
        const result=ctx.createImageData(cv.width,cv.height), src=pixels.data, dst=result.data, w=cv.width,h=cv.height;
        for(let y=0;y<h;y++){
          const sy=y<pivot ? pivot+(y-pivot)/scale : y;
          const sxScale=y<pivot?scale:y<pivot+40?scale+(1-scale)*(y-pivot)/40:1;
          for(let x=0;x<w;x++){
            const sx=200+(x-200)/sxScale, x0=Math.floor(sx), y0=Math.floor(sy), dx=sx-x0,dy=sy-y0, k=(y*w+x)*4;
            if(x0<0||x0+1>=w||y0<0||y0+1>=h)continue;
            // 연속된 역변환으로 행 경계에도 빈 줄이나 겹친 선을 만들지 않는다.
            for(let c=0;c<4;c++)dst[k+c]=src[(y0*w+x0)*4+c]*(1-dx)*(1-dy)+src[(y0*w+x0+1)*4+c]*dx*(1-dy)+src[((y0+1)*w+x0)*4+c]*(1-dx)*dy+src[((y0+1)*w+x0+1)*4+c]*dx*dy;
          }
        }
        ctx.putImageData(result,0,0);
      }
      return cv.toDataURL('image/png');
    })();
    if(skinBitmaps.size>=192)skinBitmaps.delete(skinBitmaps.keys().next().value);
    skinBitmaps.set(key,promise);promise.catch(()=>skinBitmaps.delete(key));return promise;
  };
  const hairBitmaps = new Map();
  const hairBitmap = node => {
    const d=node.dataset, key=[d.hairSource,d.hairRect,d.headSource,d.headChin].join('|');
    if(hairBitmaps.has(key))return hairBitmaps.get(key);
    const promise=(async()=>{
      const [hair,head]=await Promise.all([loadImage(d.hairSource),loadImage(d.headSource)]);
      const cv=document.createElement('canvas');cv.width=400;cv.height=600;const ctx=cv.getContext('2d');
      ctx.drawImage(head,0,0,400,600);const silhouette=ctx.getImageData(0,0,400,600).data;
      ctx.clearRect(0,0,400,600);ctx.drawImage(hair,...d.hairRect.split(',').map(Number));const pixels=ctx.getImageData(0,0,400,600);
      const chin=Number(d.headChin),back=ctx.createImageData(400,600);
      let left=200,right=200;
      for(let x=0;x<400;x++)if(silhouette[((chin+4)*400+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);}
      const neckHalf=Math.max(20,(right-left)/2);
      left=200;right=200;
      for(let x=0;x<400;x++)if(silhouette[(220*400+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x);}
      const cheekHalf=Math.max(20,(right-left)/2)+2;
      // 턱까지는 실제 머리 윤곽을 그대로 사용한다. 그 아래는 목 안쪽으로 좁혀 긴 머리가 가슴 앞으로 이어지게 한다.
      for(let y=195;y<330;y++){
        const t=Math.max(0,Math.min(1,(y-195)/5)),weight=t*t*(3-2*t);
        const half=y<=220?cheekHalf:y<=chin+4?200:neckHalf*Math.max(0,(330-y)/(330-chin-4));
        for(let x=0;x<400;x++){
          const k=(y*400+x)*4,edge=Math.max(0,Math.min(1,half-Math.abs(x-200)+.5));
          const cover=silhouette[k+3]>8?weight*edge:0;
          if(!cover)continue;
          for(let c=0;c<3;c++)back.data[k+c]=pixels.data[k+c];
          back.data[k+3]=pixels.data[k+3]*cover;pixels.data[k+3]*=1-cover;
        }
      }
      ctx.clearRect(0,0,400,600);ctx.putImageData(back,0,0);const rear=cv.toDataURL('image/png');
      ctx.putImageData(pixels,0,0);return {front:cv.toDataURL('image/png'),back:rear};
    })();
    if(hairBitmaps.size>=96)hairBitmaps.delete(hairBitmaps.keys().next().value);
    hairBitmaps.set(key,promise);promise.catch(()=>hairBitmaps.delete(key));return promise;
  };
  const setHairBitmap=(node,bitmaps)=>{
    const src=bitmaps[node.dataset.hairLayer||'front'];
    node.setAttribute('href',src);node.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',src);
    for(const [name,value]of Object.entries({x:0,y:0,width:400,height:600}))node.setAttribute(name,value);
    node.setAttribute('data-hair-ready','true');
  };
  const bakeHairs=async root=>Promise.all([...root.querySelectorAll('image[data-hair-source]')].map(async node=>setHairBitmap(node,await hairBitmap(node))));
  const bakeSkins = async root => Promise.all([...root.querySelectorAll('image[data-skin-source]')].map(async node => {
    const src=await skinBitmap(node);node.setAttribute('href',src);node.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',src);
  }));
  let scanQueued=false;
  new MutationObserver(()=>{if(scanQueued)return;scanQueued=true;queueMicrotask(()=>{scanQueued=false;
    for(const node of document.querySelectorAll('image[data-hair-source]:not([data-hair-ready])')){
      node.setAttribute('data-hair-ready','pending');hairBitmap(node).then(src=>setHairBitmap(node,src)).catch(()=>node.removeAttribute('data-hair-ready'));
    }
    for(const node of document.querySelectorAll('image[data-skin-source]:not([data-skin-ready])')){
      node.setAttribute('data-skin-ready','pending');skinBitmap(node).then(src=>{node.setAttribute('href',src);node.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',src);node.setAttribute('data-skin-ready','true')}).catch(()=>node.removeAttribute('data-skin-ready'));
    }
  })}).observe(document.documentElement,{childList:true,subtree:true});
  const bitmap = image => {
    const cv = document.createElement('canvas'); cv.width = image.naturalWidth; cv.height = image.naturalHeight;
    cv.getContext('2d').drawImage(image, 0, 0); return cv.toDataURL('image/png');
  };
  const embed = source => {
    if (embeddedImages.has(source)) return embeddedImages.get(source);
    const promise = loadImage(source).then(bitmap);
    if (embeddedImages.size >= 192) embeddedImages.delete(embeddedImages.keys().next().value);
    embeddedImages.set(source,promise); promise.catch(() => embeddedImages.delete(source)); return promise;
  };
  const rasterize = source => {
    if (cache.has(source)) return cache.get(source);
    const promise = (async () => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      await Promise.all([bakeSkins(doc),bakeHairs(doc)]);
      await Promise.all([...doc.querySelectorAll('image')].map(async node => {
        const href = node.getAttribute('href');
        const data = href.startsWith('data:') ? href : await embed(href);
        node.setAttribute('href',data); node.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',data);
      }));
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(doc));
      // 지도는 매 프레임 SVG 필터를 다시 그리지 않도록 최종 얼굴 비트맵을 저장한다.
      return doc.documentElement.classList.contains('avatar') ? bitmap(await loadImage(url)) : url;
    })();
    if (cache.size >= 48) cache.delete(cache.keys().next().value);
    cache.set(source,promise); promise.catch(() => cache.delete(source)); return promise;
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
