// 승인한 테마별 전투 배경. 전투 배치와 효과 레이어는 그대로 유지한다.
const BattleMaps = (() => {
  const root = 'assets/battle-maps/';
  const themes = Object.freeze({
    '협회 훈련용 게이트': 'training',
    '폐지하철역': 'subway',
    '침수된 쇼핑몰': 'mall',
    '붕괴 아파트 단지': 'apartments',
    '버려진 병원': 'hospital',
    '지하 데이터센터': 'data-center',
    '해저 터널': 'undersea-tunnel',
    '고대 신전': 'temple',
    '에테르 숲': 'forest',
    '폐공장': 'factory',
    '무너진 고가도로': 'overpass',
  });
  const mobileLeft = new Set(['subway', 'hospital', 'data-center', 'undersea-tunnel', 'temple', 'factory', 'overpass']);
  const cache = new Map();
  const themeFor = c => c && ['exam', 'exam-explore', 'spar'].includes(c.kind)
    ? '협회 훈련용 게이트' : c && c.gate && c.gate.theme || c && c.theme || '';
  const keyFor = c => themes[themeFor(c)] || (c && c.kind === 'mob' ? 'forest' : 'apartments');
  const source = c => root + keyFor(c) + '.webp';

  function warm(c) {
    const src = source(c);
    let im = cache.get(src);
    if (!im || (im.complete && !im.naturalWidth)) {
      im = new Image();
      im.src = src;
      cache.set(src, im);
    }
    return im;
  }

  function apply(c) {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const key = keyFor(c);
    const im = warm(c);
    stage.classList.add('has-battle-map');
    stage.dataset.battleMap = key;
    stage.style.setProperty('--battle-mobile-position', mobileLeft.has(key) ? '0% 40%' : '50% 40%');
    // CSS 변수에 상대 경로를 넣으면 dist/style.css 기준으로 해석된다.
    stage.style.setProperty('--battle-map', `url("${im.src}")`);
  }

  const open = UI.openCombat;
  UI.openCombat = function (...args) {
    const result = open.apply(this, args);
    apply(this.ctx);
    return result;
  };
  // 입장 안내가 나오는 동안 해당 맵 한 장만 미리 읽는다.
  for (const method of ['enterGate', 'startExam', 'startSpar']) {
    const base = UI[method];
    if (typeof base !== 'function') continue;
    UI[method] = function (...args) {
      warm(method === 'enterGate' ? { gate: args[0] } : { kind: 'spar' });
      return base.apply(this, args);
    };
  }
  return { themeFor, keyFor, source, warm, apply, themes };
})();
