// ===== 헤어 색 (사용자 요청): 머리 그림을 코드로 물들인다. 고르는 줄은 없고, 외형 바꾸기·NPC마다 무작위 =====
// 방식: 머리 그림만 흑백으로 → 그림마다 밝기 폭을 0~1로 펴고 → 어두운·중간·밝은 색 3단으로 입힌다(SVG 필터, 픽셀 재계산 없음).
// 예전에 만든 내 캐릭터(외형 문자열에 '~h' 표시가 없는 것)는 원래 머리색을 그대로 둔다.
const HAIR_COLORS = {
  black:    { name: '흑발',   w: 25, ramp: ['#0b0a0d', '#26242c', '#5f5c6c'] },
  brown:    { name: '갈색',   w: 18, ramp: ['#1c120c', '#5a3a24', '#b8875c'] },
  chestnut: { name: '밤색',   w: 10, ramp: ['#1a0b08', '#4a1f14', '#9a5a40'] },
  blond:    { name: '금발',   w: 4,  ramp: ['#4a3518', '#c49a52', '#f6e4ad'] },
  platinum: { name: '백금발', w: 2,  ramp: ['#6a6250', '#d8cfb4', '#fbf8ee'] },
  silver:   { name: '은발',   w: 4,  ramp: ['#363942', '#9aa0ab', '#f0f2f6'] },
  red:      { name: '적발',   w: 3,  ramp: ['#240a08', '#8a2618', '#e2784e'] },
  orange:   { name: '주황',   w: 2,  ramp: ['#3a1606', '#c4561a', '#f6a866'] },
  pink:     { name: '핑크',   w: 3,  ramp: ['#3a1424', '#c45a8a', '#f8c2da'] },
  purple:   { name: '보라',   w: 3,  ramp: ['#1c0f30', '#5a3a8e', '#b89ae6'] },
  blue:     { name: '청발',   w: 3,  ramp: ['#0a1430', '#2c4c88', '#90b6ea'] },
  mint:     { name: '민트',   w: 3,  ramp: ['#0a2a28', '#2a8a80', '#9ae6da'] },
};
const HAIR_ORIG_W = 20; // 원래 그림 색 그대로
// 머리 그림마다 밝기 폭(아래 3%·위 97%, 앞·뒤 머리 합침) — 어두운 원화도 금발·은발이 칙칙하지 않게 편다
const HAIR_LUM = {"hair-f-0":[0.121,0.239],"hair-f-1":[0.165,0.329],"hair-f-10":[0.2,0.836],"hair-f-11":[0.121,0.239],"hair-f-12":[0.164,0.349],"hair-f-13":[0.434,0.758],"hair-f-14":[0.126,0.244],"hair-f-15":[0.231,0.852],"hair-f-16":[0.182,0.342],"hair-f-17":[0.244,0.457],"hair-f-18":[0.466,0.721],"hair-f-19":[0.126,0.244],"hair-f-2":[0.359,0.687],"hair-f-20":[0.075,0.317],"hair-f-21":[0.09,0.366],"hair-f-22":[0.078,0.326],"hair-f-23":[0.068,0.293],"hair-f-24":[0.076,0.326],"hair-f-25":[0.091,0.417],"hair-f-26":[0.073,0.282],"hair-f-27":[0.069,0.315],"hair-f-28":[0.071,0.296],"hair-f-29":[0.194,0.731],"hair-f-3":[0.126,0.244],"hair-f-30":[0.088,0.176],"hair-f-31":[0,0],"hair-f-32":[0.168,0.386],"hair-f-33":[0.142,0.282],"hair-f-4":[0.212,0.789],"hair-f-5":[0.41,0.764],"hair-f-6":[0.209,0.343],"hair-f-7":[0.244,0.457],"hair-f-8":[0.481,0.774],"hair-f-9":[0.126,0.244],"hair-m-0":[0.146,0.262],"hair-m-1":[0.323,0.703],"hair-m-10":[0.083,0.851],"hair-m-11":[0.188,0.353],"hair-m-12":[0.481,0.841],"hair-m-13":[0.308,0.592],"hair-m-14":[0.227,0.46],"hair-m-15":[0.109,0.986],"hair-m-16":[0.146,0.262],"hair-m-17":[0.491,0.847],"hair-m-18":[0.341,0.668],"hair-m-19":[0.163,0.287],"hair-m-2":[0.208,0.379],"hair-m-20":[0.063,0.279],"hair-m-21":[0.075,0.356],"hair-m-22":[0.059,0.309],"hair-m-23":[0.067,0.325],"hair-m-24":[0.064,0.279],"hair-m-25":[0.078,0.382],"hair-m-26":[0.081,0.33],"hair-m-27":[0.065,0.34],"hair-m-28":[0.207,0.679],"hair-m-29":[0.073,0.309],"hair-m-3":[0.163,0.287],"hair-m-30":[0.088,0.176],"hair-m-31":[0,0],"hair-m-32":[0.168,0.386],"hair-m-33":[0.142,0.282],"hair-m-4":[0.092,0.699],"hair-m-5":[0.29,0.907],"hair-m-6":[0.179,0.322],"hair-m-7":[0.383,0.699],"hair-m-8":[0.243,0.439],"hair-m-9":[0.187,0.341]};
const HairColor = (() => {
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pick = (seed) => {
    const s = String(seed || '');
    if (/^look[345]:/.test(s) && !s.includes('~h')) return null; // 예전 내 캐릭터
    const keys = Object.keys(HAIR_COLORS);
    const tot = HAIR_ORIG_W + keys.reduce((a, k) => a + HAIR_COLORS[k].w, 0);
    let r = hash(s + '|hair-color') % tot;
    if (r < HAIR_ORIG_W) return null;
    r -= HAIR_ORIG_W;
    for (const k of keys) { r -= HAIR_COLORS[k].w; if (r < 0) return k; }
    return null;
  };
  const filterFor = (key, file) => {
    const c = HAIR_COLORS[key]; const [lo, hi] = HAIR_LUM[file] || [0, 1];
    const sl = 1 / Math.max(0.05, hi - lo), ic = -lo * sl;
    const [d, m, l] = c.ramp.map(hex);
    const tv = (k) => `${d[k].toFixed(3)} ${m[k].toFixed(3)} ${l[k].toFixed(3)}`;
    const id = `hc-${key}-${file}`;
    const lin = `type="linear" slope="${sl.toFixed(3)}" intercept="${ic.toFixed(3)}"`;
    return [id, `<filter id="${id}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR ${lin}/><feFuncG ${lin}/><feFuncB ${lin}/></feComponentTransfer><feComponentTransfer><feFuncR type="table" tableValues="${tv(0)}"/><feFuncG type="table" tableValues="${tv(1)}"/><feFuncB type="table" tableValues="${tv(2)}"/></feComponentTransfer></filter>`];
  };
  const IMG = /<image\b([^>]*?(hair-[mf]-\d+)(?:-rear)?\.webp[^>]*)>/g;
  // 초상 SVG 문자열에 머리색을 입힌다. key 를 주면 그 색, 없으면 seed 로 정한다.
  const apply = (html, seed, key) => {
    if (typeof html !== 'string' || !html.includes('data-portrait-parts')) return html;
    key = key === undefined ? pick(seed) : key;
    if (!key || !HAIR_COLORS[key]) return html;
    const defs = new Map();
    const out = html.replace(IMG, (m0, attrs, file) => {
      if (/\sfilter=/.test(attrs)) return m0;
      const [id, f] = filterFor(key, file); defs.set(id, f);
      return `<image filter="url(#${id})"${attrs}>`;
    });
    if (!defs.size) return html;
    return out.replace(/(<svg\b[^>]*>)/, `$1<defs>${[...defs.values()].join('')}</defs>`);
  };
  return { pick, apply, COLORS: HAIR_COLORS };
})();
if (typeof PORTRAIT !== 'undefined') {
  const bc = PORTRAIT.card, ba = PORTRAIT.avatar;
  PORTRAIT.card = function (seed, ...a) { return HairColor.apply(bc.call(this, seed, ...a), seed); };
  PORTRAIT.avatar = function (seed, ...a) { return HairColor.apply(ba.call(this, seed, ...a), seed); };
}
// 새로 만드는 외형에는 '~h' 표시를 붙여 머리색이 무작위로 정해지게 한다
if (typeof PortraitParts !== 'undefined' && PortraitParts.newLook) {
  const bn = PortraitParts.newLook;
  PortraitParts.newLook = function (...a) { return bn.apply(this, a) + '~h'; };
}
