// 몬스터 외형을 종별 원화로 표시한다. 전투 수치·몸집·선택 판정은 그대로 사용한다.
const MonsterArt = (() => {
  const data = MONSTER_ART_DATA;
  const names = Object.keys(data).sort((a, b) => b.length - a.length);
  const aliases = {
    '오크 전사': '오크 약탈자', '촉수 끝': '심해 촉수', '층수 없는 승객': '병동의 그림자',
    '정령': '침수 해파리', '해골 병사': '언데드 기사', '그림자 분신': '그림자 군주', '원귀': '병동의 그림자',
    '나무 정령': '고목 거신', '길들인 괴수': '가시털 들개', '균열 괴수': '심연 감시자', '전투 드론': '뇌격 비행체',
  };
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const resolve = (mon) => {
    if (!mon) return '산성 슬라임';
    if (mon.shape === 'lord') return '심연의 군주';
    const name = String(mon.name || '').replace(/^(\[[^\]]*\]\s*)+/, '').replace(/^변종\s+/, '');
    if (data[name]) return name;
    if (aliases[name] && data[aliases[name]]) return aliases[name];
    const explicit = names.find((n) => name.includes(n)); if (explicit) return explicit;
    if (data[mon._tpl]) return mon._tpl;
    return names.find((n) => !data[n].special && data[n].shape === mon.shape && data[n].elem === mon.elem)
      || names.find((n) => !data[n].special && data[n].shape === mon.shape)
      || '산성 슬라임';
  };
  const url = (name, kind = 'web') => `assets/monsters/${kind}/${encodeURIComponent(name)}.${kind === 'original' ? 'png' : 'webp'}${kind === 'original' ? '' : '?v=' + data[name].rev}`;
  const image = (mon, size = 110) => {
    const name = resolve(mon), s = Math.max(16, Math.min(1600, Number(size) || 110));
    return `<img class="monster-art" data-monster-art="${esc(name)}" src="${url(name, 'thumb')}" srcset="${url(name, 'thumb')} 256w, ${url(name)} 1024w" sizes="${s}px" width="${s}" height="${s}" alt="${esc(mon && mon.name || name)}" loading="${s <= 60 ? 'lazy' : 'eager'}" decoding="async" draggable="false">`;
  };
  return { data, resolve, url, image };
})();

FX.monster = function (mon, size = 110) { return MonsterArt.image(mon, size); };

// 표시용 파일에 일시적인 오류가 있으면 같은 종의 보존 원본을 사용한다.
document.addEventListener('error', (ev) => {
  const img = ev.target;
  if (!img || !img.matches || !img.matches('img.monster-art') || img.dataset.originalTried) return;
  const name = img.dataset.monsterArt; if (!MonsterArt.data[name]) return;
  img.dataset.originalTried = '1'; img.removeAttribute('srcset'); img.src = MonsterArt.url(name, 'original');
}, true);

{
  const baseDetail = UI.dexDetail;
  UI.dexDetail = function (name) {
    const html = baseDetail.call(this, name), entry = G.player && G.player.dex && G.player.dex[name];
    if (!MonsterArt.data[name] || !entry || !(entry.seen || entry.kills)) return html;
    return html.replace('<div class="sec-title">모습·속성·유형</div>', `<div class="monster-art-action"><button class="ghost" data-act="monster-art" data-v="${name}">원화 크게 보기</button></div><div class="sec-title">모습·속성·유형</div>`);
  };
  const baseHandle = UI.handle;
  UI.handle = function (act, v, ...args) {
    if (act === 'monster-art') {
      const entry = G.player && G.player.dex && G.player.dex[v];
      if (!MonsterArt.data[v] || !entry || !(entry.seen || entry.kills)) return;
      return this.modal(`<div class="row between"><h3>${v}</h3><button class="ghost" data-act="dex-mon" data-v="${v}">도감으로</button></div><div class="monster-art-full">${MonsterArt.image({ name: v }, 900)}</div>`, 'sheet monster-art-box');
    }
    return baseHandle.call(this, act, v, ...args);
  };
}
